/**
 * Takt — Start des lokalen Dienstes (E-004, B-1.1, B-1.5, B-1.6).
 *
 * Der Sidecar wird von der Tauri-Hülle gestartet und von ihr wieder beendet.
 * Von Hand gestartet läuft er nicht: Ohne das Startgeheimnis über `stdin`
 * beendet er sich sofort (B-1.6 Punkt 2). Über denselben Kanal kommt als
 * zweite Zeile der Windows-Benutzername (E-042); auch ohne ihn startet der
 * Dienst nicht.
 *
 * Er kennt **keine** Argumente für Bindeadresse, Datenbankpfad oder Tokenpfad.
 * Diese Werte kommen fest aus `config.ts` und aus den Betriebssystempfaden
 * (B-1.6 Punkt 1). Wer hier ein `process.argv` einbaut, hebt das auf.
 */

import { createAdaptorServer } from '@hono/node-server';
import { homedir } from 'node:os';
import type { AddressInfo } from 'node:net';

import {
  ensureDirectory,
  inspectDatabasePermissions,
  secureDatabaseFiles,
  sweepTemporaryFiles,
} from '@takt/storage';

import { compose } from './composition.ts';
import {
  BIND_ADDRESS,
  CONNECTION_CHECK_INTERVAL_MS,
  DEFAULT_PORT,
  HEADERS_TIMEOUT_MS,
  REQUEST_RECEIVE_TIMEOUT_MS,
  SESSION_SECRET_TIMEOUT_MS,
  SHUTDOWN_DEADLINE_MS,
  TASKPANE_PORT,
} from './config.ts';
import { createLogger } from './logger.ts';
import { DIR_MODE, databaseFilePath, resolveAppDataDir, tokenFilePath } from './access/paths.ts';
import { readStartupHandshake, watchParentLink } from './access/session-secret.ts';
import { createFileTokenStore } from './access/token-store.ts';
import { startTaskpaneServer } from './taskpane/server.ts';

/** Beendigungscodes, damit die Hülle den Grund unterscheiden kann. */
const EXIT_CONFIG = 78;
const EXIT_BIND = 74;

export async function main(): Promise<void> {
  const logger = createLogger();

  /**
   * B-7.2, S-03 aus T-023 — die `umask` des Sidecars, vor allem anderen.
   *
   * T-023 hat gemessen: Verzeichnis `0700`, Tokendatei `0600`, Zertifikat
   * `0600` — und `takt.db`, `takt.db-wal`, `takt.db-shm` mit `0644`. Ausgerechnet
   * die Datei mit den Kundendaten, in der auch die internen Vermerke stehen
   * (A-7.2), lag am weitesten offen.
   *
   * Die naheliegende Behebung wäre ein `chmod` nach dem Öffnen, und den gibt es
   * auch (`secureDatabaseFiles`). Er allein trägt aber nicht: SQLite entfernt
   * `-wal` und `-shm` im Betrieb und legt sie neu an, und jede künftige
   * Nachbardatei entstünde wieder mit `0644 & ~umask`. Die `umask` wirkt auf
   * **jede** Datei, die dieser Prozess je anlegt, und auf jede, an die heute
   * noch niemand gedacht hat. Sie ist der Riegel, das `chmod` ist die Nachlese
   * für Dateien aus einer früheren Fassung.
   *
   * `0o077` und nicht `0o022`: Gruppe und Andere bekommen nichts. Am Export
   * ändert das nichts, der wird ohnehin ausdrücklich mit `0600` geschrieben
   * (B-5.4). Unter Windows ist `process.umask` wirkungslos; dort trägt die
   * geerbte ACL von `%LOCALAPPDATA%` — benannte Lücke aus T-011.
   */
  process.umask(0o077);

  // Zwei Zeilen über denselben Kanal: Startgeheimnis, dann Windows-Benutzername
  // (B-1.6, E-042). Beide in einem Lesevorgang, siehe access/session-secret.ts.
  const handshake = await readStartupHandshake(process.stdin, SESSION_SECRET_TIMEOUT_MS);
  if (!handshake.ok) {
    // Der Text nennt keinen Wert und keinen Pfad — nur, was los ist. Der Grund
    // wird unterschieden, weil die drei Fälle verschiedene Nacharbeit
    // verlangen: von Hand gestartet, die Hülle hat den Namen nicht gelesen,
    // oder der Name ist da und nicht abrechenbar (T-122).
    //
    // Der abgewiesene Name steht **nicht** in der Meldung. Er kann genau die
    // Zeichen tragen, um die es geht — eine Meldung, die sie wörtlich
    // wiedergibt, dreht die Protokollzeile um, die vom Angriff berichtet
    // (B-2.4, B-4.3 Punkt 5).
    logger.lifecycle(
      'error',
      handshake.reason === 'user_missing'
        ? 'Der lokale Dienst hat keinen Windows-Benutzernamen empfangen. Er startet nicht: Ein Export ohne Urheber wäre nicht nachvollziehbar.'
        : handshake.reason === 'user_invalid'
          ? 'Der lokale Dienst hat einen Windows-Benutzernamen mit Steuer- oder Richtungszeichen empfangen. Er startet nicht: Dieser Name ginge unverändert in die Abrechnungsdatei.'
          : 'Der lokale Dienst wird von der Takt-Anwendung gestartet und nicht von Hand. Kein Startgeheimnis empfangen.',
    );
    process.exit(EXIT_CONFIG);
  }

  const paths = resolveAppDataDir({
    platform: process.platform,
    env: process.env,
    homedir: safeHomedir(),
  });
  if (!paths.ok) {
    logger.lifecycle(
      'error',
      paths.reason === 'localappdata_missing'
        ? 'Das lokale Anwendungsdatenverzeichnis (%LOCALAPPDATA%) ist nicht gesetzt. Takt weicht bewusst nicht auf das Roaming-Profil aus.'
        : 'Kein Benutzerverzeichnis gefunden.',
    );
    process.exit(EXIT_CONFIG);
  }

  // Das Verzeichnis mit engen Rechten anlegen, bevor irgendetwas darin
  // entsteht (E-018, B-2.2 Punkt 3). `0700` ausdrücklich gesetzt und nicht dem
  // `umask` überlassen — darin liegen Kundendatenbank, Token und Zertifikat.
  await ensureDirectory(paths.dir, DIR_MODE);

  const store = createFileTokenStore(tokenFilePath(paths.dir));
  const { app, runtime, tokens, database, context } = compose({
    port: DEFAULT_PORT,
    store,
    sessionSecret: handshake.secret,
    windowsUser: handshake.windowsUser,
    databaseLocation: databaseFilePath(paths.dir),
    logger,
  });

  // ---------------------------------------------------------------------------
  // Migration. Vorwärts bis zur höchsten bekannten Fassung, mit
  // Sicherungskopie davor (siehe migration-runner.ts).
  //
  // Schlägt sie fehl, startet der Dienst **nicht**. Ein Dienst auf einem
  // Schema, das er nicht kennt, schreibt in eine Abrechnung.
  // ---------------------------------------------------------------------------
  if (database !== null) {
    try {
      const state = await database.migrations.state();
      if (state.kind === 'pending') {
        logger.lifecycle('info', `Der Bestand wird von Fassung ${state.from} auf ${state.to} gebracht.`);
      }
      const migrated = await database.migrations.migrateToLatest();
      if (migrated.from !== migrated.to) {
        logger.lifecycle(
          'info',
          migrated.backup === null
            ? `Bestand auf Fassung ${migrated.to} gebracht.`
            : `Bestand auf Fassung ${migrated.to} gebracht. Eine Sicherungskopie liegt daneben.`,
        );
      }
    } catch {
      // Der Grund steht nicht in der Meldung: Er kann einen Dateipfad
      // enthalten (B-2.4). Was zu tun ist, steht drin.
      logger.lifecycle(
        'error',
        'Der Datenbestand konnte nicht auf den Stand dieser Fassung gebracht werden. Takt startet nicht.',
      );
      process.exit(EXIT_CONFIG);
    }
  }

  /**
   * Nach der Migration noch einmal über die Rechte (B-7.2 Punkte 1 bis 3).
   *
   * Vorher, weil eine Datei aus einer Fassung vor T-034 mit `0644` daliegt;
   * nachher, weil der Migrationsläufer `-wal` und `-shm` angefasst hat. Was
   * danach immer noch zu weit liegt, wird **sichtbar** gemeldet und nicht still
   * hingenommen: Ein Dateisystem ohne POSIX-Rechte lässt `chmod` scheitern, und
   * dann soll der Benutzer es erfahren statt der nächste Prüfbericht.
   */
  if (database !== null) {
    const databasePath = databaseFilePath(paths.dir);
    secureDatabaseFiles(databasePath);
    const permissions = inspectDatabasePermissions(databasePath);
    if (permissions.tooPermissive.length > 0) {
      runtime.notices.record('file_permissions_wide', new Date());
      // Der Text nennt keinen Pfad (B-2.4 Punkt 4), nur die Zahl und was zu tun
      // ist. Wer den Ordner sucht, findet ihn in den Einstellungen.
      logger.lifecycle(
        'warn',
        `${permissions.tooPermissive.length} Datei(en) des Datenbestands sind für andere Benutzer lesbar. ` +
          'Takt konnte die Rechte nicht enger setzen. Der Bestand enthält Kundendaten und interne Vermerke.',
      );
    }
  }

  // Liegengebliebene Nachbardateien eines abgebrochenen Exportlaufs entfernen.
  // Sie enthalten Kundendaten (A-8.9, R-05) und belegen nichts — die zugehörige
  // Transaktion ist zurückgenommen.
  if (context !== null) {
    const settings = await context.transactions.inTransaction((unit) => unit.settings.load());
    if (settings.exportDirectory !== null) {
      const swept = await sweepTemporaryFiles(settings.exportDirectory);
      if (swept > 0) {
        logger.lifecycle('info', `${swept} unvollständige Exportdatei(en) aus einem Abbruch entfernt.`);
      }
    }
  }

  await tokens.load(new Date());
  const status = tokens.status();
  if (status.unreadable) {
    // Bewusst kein neues Token: Das würde ein eingerichtetes Add-in ohne
    // Vorwarnung aussperren. Der Dienst läuft, weist Add-in-Anfragen aber ab,
    // bis der Benutzer in der Oberfläche ein neues erzeugt.
    logger.lifecycle('warn', 'Die Tokendatei ist nicht lesbar. Bitte in den Einstellungen ein neues Token erzeugen.');
  } else if (!status.configured) {
    logger.lifecycle('info', 'Es ist noch kein Add-in-Token eingerichtet.');
  }

  /*
   * **Die drei Fristen des Betriebs stehen hier und nicht auf ihren Vorgaben**
   * (T-128, offene Frage 2 aus T-126).
   *
   * Die Begründung für jede der drei Zahlen steht an ihrer Konstanten in
   * `config.ts`; kurz: Node ist für den Betrieb hinter einem Gegenlager
   * eingestellt (60 s Kopf, 300 s Anfrage, alle 30 s nachgesehen). Takt steht
   * nicht dahinter — es ist selbst das erste, was eine Verbindung sieht, und
   * jeder Aufrufer sitzt auf demselben Rechner.
   *
   * `serverOptions` und nicht drei Zuweisungen an den fertigen Server:
   * `createAdaptorServer` reicht sie unverändert an `http.createServer` durch,
   * und `connectionsCheckingInterval` **muss** dort stehen — der Takt wird beim
   * Anlegen des Servers eingerichtet, eine spätere Zuweisung an die
   * Eigenschaft käme zu spät und sähe trotzdem so aus, als wirke sie.
   *
   * Der Rückgabetyp bleibt `Server` aus `node:http` (ohne `createServer` nimmt
   * der Adapter genau den), `closeAllConnections` bleibt also da, wo T-126 es
   * gefunden hat.
   */
  const server = createAdaptorServer({
    fetch: app.fetch,
    serverOptions: {
      headersTimeout: HEADERS_TIMEOUT_MS,
      requestTimeout: REQUEST_RECEIVE_TIMEOUT_MS,
      connectionsCheckingInterval: CONNECTION_CHECK_INTERVAL_MS,
    },
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      // Kein Ausweichen auf einen anderen Port. Sonst könnte ein fremder
      // Prozess den Vorgabeport zuerst belegen und sich gegenüber dem Add-in
      // als Takt ausgeben, um Tokens einzusammeln (B-1.5 Punkt 1).
      logger.lifecycle(
        'error',
        `Der Port ${DEFAULT_PORT} ist belegt. Takt startet nicht und weicht nicht auf einen anderen Port aus.`,
      );
      process.exit(EXIT_BIND);
    }
    logger.lifecycle('error', 'Der lokale Dienst konnte nicht gestartet werden.');
    process.exit(EXIT_BIND);
  });

  server.listen(
    {
      host: BIND_ADDRESS,
      port: DEFAULT_PORT,
      // Belegt den Port ausschließlich. Unter Windows kann sonst ein zweiter
      // Prozess denselben Port binden (B-1.5 Punkt 1).
      exclusive: true,
    },
    () => {
      const address = server.address();
      if (!isLoopback(address)) {
        // Der Dienst prüft beim Start, dass er tatsächlich nur auf Loopback
        // lauscht, und beendet sich sonst mit Fehler statt weiterzulaufen
        // (B-1.1 Punkt 4).
        logger.lifecycle('error', 'Der lokale Dienst lauscht nicht ausschließlich auf 127.0.0.1. Abbruch.');
        server.close(() => process.exit(EXIT_BIND));
        return;
      }
      logger.lifecycle('info', `Takt lauscht auf ${BIND_ADDRESS}:${DEFAULT_PORT}.`);
    },
  );

  // ---------------------------------------------------------------------------
  // Der Aufgabenbereich des Add-ins über HTTPS (E-046).
  //
  // Zweiter Port, **nur statische Dateien**. Die API bleibt auf 17843 mit ihrer
  // Prüfschicht. Schlägt der Start fehl, läuft Takt weiter: Ohne
  // Aufgabenbereich ist das Add-in nicht benutzbar, die Anwendung selbst schon.
  // Ein Abbruch wäre die falsche Antwort auf ein fehlendes Zertifikat.
  // ---------------------------------------------------------------------------
  // Die Klammer ist keine Vorsicht, sondern eine Lehre aus T-053: Dort riss
  // ein `TypeError` aus der Wegsuche des Aufgabenbereichs den ganzen Dienst
  // mit. Was oben als Absicht steht — „ohne Aufgabenbereich läuft Takt
  // weiter" —, gilt jetzt auch für einen Fehler, an den niemand gedacht hat.
  // Der Text nennt keinen Pfad und keinen Aufrufstapel (B-2.4).
  let taskpane: Awaited<ReturnType<typeof startTaskpaneServer>> = null;
  try {
    taskpane = await startTaskpaneServer({
      appDataDir: paths.dir,
      port: TASKPANE_PORT,
      logger,
    });
  } catch {
    logger.lifecycle(
      'warn',
      'Der Aufgabenbereich des Add-ins konnte nicht bereitgestellt werden. Takt läuft weiter; das Add-in ist bis auf Weiteres nicht benutzbar.',
    );
  }

  // Ist die Hülle weg, endet der Dienst. Ein verwaister Sidecar mit
  // Datenbankzugriff und ohne Fenster ist genau das, was B-1.6 verhindert.
  //
  // **Genau einmal.** Zwei Wege führen hierher — das Ende der Röhre und ein
  // Signal —, und beide können denselben Augenblick treffen. Der zweite
  // Durchgang schlösse eine bereits geschlossene Datenbank; der Wurf daraus
  // endete den Prozess mit Code 1, obwohl er ordentlich anhält. Die Hülle liest
  // den Code, um den Grund zu unterscheiden (T-122).
  let stopping = false;
  const shutdown = (): void => {
    if (stopping) return;
    stopping = true;
    taskpane?.close();
    database?.close();

    /*
     * **Das Anhalten hat eine Frist, und ein fremder Prozess bestimmt sie
     * nicht** (T-125-4).
     *
     * `server.close()` nimmt keine neuen Verbindungen mehr an und ruft zurück,
     * wenn die bestehenden zu Ende sind. Untätige Verbindungen räumt Node
     * dabei seit v19 selbst ab — eine Verbindung mit einer **halben** Anfrage
     * aber nicht: Sie gilt als eine, die gerade sendet, und wird erst von
     * `headersTimeout` oder `requestTimeout` beendet — bei den Vorgaben von
     * Node nach 60 beziehungsweise 300 Sekunden. Bis T-126 führte der einzige
     * Weg zu `process.exit(0)` durch diesen Rückruf. Ein beliebiger Prozess auf
     * demselben Rechner konnte das Ende des Dienstes damit um bis zu fünf
     * Minuten verzögern — ohne ein Geheimnis zu kennen, mit einer
     * TCP-Verbindung und einem halben Anfragekopf. Genau dieser Prozess ist der
     * Akteur, gegen den B-1.6 Punkt 3 geschrieben ist (VG-1).
     *
     * Die Zeitgrenze aus B-1.7 greift dort nicht: `timeout(REQUEST_TIMEOUT_MS)`
     * ist Zwischenschicht und läuft erst, wenn Node den Kopf vollständig
     * gelesen hat. Ein halber Kopf kommt dort nie an.
     *
     * **Erst schließen, dann abreißen.** Umgekehrt könnte zwischen den beiden
     * Aufrufen noch eine Verbindung angenommen werden, die danach niemand mehr
     * abräumt.
     *
     * **Warum keine Schonfrist für laufende Anfragen.** Der übliche Bau wäre:
     * untätige Verbindungen sofort, laufenden Anfragen ein paar Sekunden,
     * dann abreißen. Er trüge hier nichts. Der Bestand ist zwei Zeilen weiter
     * oben bereits geschlossen; eine Anfrage, die jetzt noch läuft, kann nicht
     * mehr erfolgreich enden, gleich wie lange man ihr Zeit ließe. Eine
     * Schonfrist verlängerte also nur das Fenster, in dem ein fremder Prozess
     * den Zeitpunkt bestimmt, und kaufte dafür nichts. Sie wäre erst dann eine
     * Frage, wenn der Bestand zuletzt geschlossen würde — das ist eine andere
     * Entscheidung als diese und keine, die dieser Fund verlangt.
     *
     * **Und warum `headersTimeout` das hier nicht ersetzt.** Es steht seit
     * T-128 bei fünf Sekunden statt bei sechzig (`config.ts`), aber es ist die
     * Antwort auf eine andere Frage: Es verkürzt das Fenster im **Betrieb** und
     * schließt es nicht, denn eine Verbindung, die gerade eine erlaubte Anfrage
     * sendet, ist keine, die man abweisen will. Beim **Anhalten** ist sie genau
     * das — der Bestand ist zu, die Anfrage kann nicht mehr gelingen, und der
     * Zeitpunkt gehört nicht dem Absender. Zwei Stellen, zwei Mittel; keins
     * davon macht das andere entbehrlich.
     */
    server.close(() => process.exit(0));
    closeAllConnections(server);

    /*
     * Der Boden darunter. `closeAllConnections()` ist das Mittel, die Frist
     * ist nicht dasselbe noch einmal: Sie deckt den Fall ab, in dem der
     * Rückruf aus einem Grund ausbleibt, an den hier niemand gedacht hat —
     * und dieser Fall ist es, der einen Prozess mit Datenbankzugriff und ohne
     * Fenster zurückließe.
     *
     * `unref()`, weil eine Frist die Ereignisschleife nicht am Leben halten
     * soll: Ist der Dienst auf dem ordentlichen Weg fertig, endet er, ohne auf
     * sie zu warten.
     *
     * Code 0: Das Anhalten ist gewollt, auch wenn es über den Boden geht. Die
     * Hülle liest den Code, um den Grund zu unterscheiden (74 Port, 78
     * Konfiguration, sonst „unerwartet beendet"); eine andere Zahl wäre hier
     * eine falsche Auskunft an den Benutzer. Die Zeile im Protokoll sagt
     * stattdessen, was los war — und `proof:access` Abschnitt 0e prüft, dass
     * sie im Normalfall **nicht** erscheint.
     */
    setTimeout(() => {
      logger.lifecycle(
        'warn',
        'Beim Anhalten waren noch Verbindungen offen. Der lokale Dienst beendet sich trotzdem.',
      );
      process.exit(0);
    }, SHUTDOWN_DEADLINE_MS).unref();
  };

  /*
   * **Der Wächter wird zuletzt angemeldet, und das ist die richtige
   * Reihenfolge** — die Frage ist zweimal gestellt worden (T-122, T-125
   * Abschnitt 2.1), hier steht die Antwort.
   *
   * Der Einwand: `server.listen` steht weiter oben, der Dienst hört also auf
   * 127.0.0.1, bevor jemand über die Elternverbindung wacht. Stirbt die Hülle
   * in diesem Fenster, bliebe ein Prozess mit Port und Datenbestand zurück.
   * Genau das ist einmal passiert.
   *
   * Es ist aber nicht die Reihenfolge, die das verursacht hat, sondern ein
   * verlorenes Ereignis: Der Handschlag las `stdin` im fließenden Zustand, das
   * Dateiende ging an einen Strom ohne Zuhörer, und `once('end')` wartete
   * danach auf etwas, das vorbei war. Seit T-122 hält `readStartupHandshake`
   * den Strom mit `pause()` an, und `watchParentLink` holt das Dateiende mit
   * seinem `resume()` ab — **auch wenn es längst da liegt**. Das Ende der
   * Röhre geht in diesem Fenster nicht mehr verloren, es wird nur später
   * zugestellt.
   *
   * Und genau das ist der Grund, warum der Wächter hier und nicht weiter oben
   * steht. Zugestellt wird erst, wenn der Dienst fertig gebaut ist. Ein
   * `shutdown()` mitten im Start müsste sonst mit halbem Bestand umgehen —
   * ohne Datenbank, ohne Server, mitten in einer Migration — und jeder dieser
   * Zweige wäre ein eigener Weg, den Prozess in einem undefinierten Zustand zu
   * beenden. So gibt es genau einen Weg, und er läuft immer auf demselben
   * vollständigen Zustand.
   *
   * Wer das umstellen will, verschiebt nicht drei Zeilen, sondern übernimmt
   * die Verantwortung für das Anhalten eines halb gebauten Dienstes.
   * `proof:access` Abschnitt 0d misst den Fall an seinem Anfang: Röhre zu,
   * unmittelbar nach dem Handschlag.
   */
  watchParentLink(process.stdin, () => {
    logger.lifecycle('info', 'Die Verbindung zur Anwendung ist beendet. Der lokale Dienst hält an.');
    shutdown();
  });

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, shutdown);
  }
}

/**
 * `closeAllConnections()` — sofern dieser Server sie hat.
 *
 * `createAdaptorServer` gibt die Vereinigung `Server | Http2Server |
 * Http2SecureServer` zurück. Ohne `serverOptions` bekommt Takt immer die
 * erste, und nur die erste kennt `closeAllConnections`; die beiden
 * HTTP/2-Fassungen erben von `net.Server` und haben sie nicht. Ein `as` würde
 * die Zusage bloß behaupten — hier wird gefragt.
 *
 * Fiele der Zweig eines Tages weg, weil jemand auf HTTP/2 umstellt, bliebe nur
 * noch die Frist aus {@link SHUTDOWN_DEADLINE_MS}, und `proof:access`
 * Abschnitt 0e würde rot: Er prüft ausdrücklich, dass es **nicht** die Frist
 * ist, die den Dienst beendet.
 */
function closeAllConnections(server: ReturnType<typeof createAdaptorServer>): void {
  if ('closeAllConnections' in server) {
    server.closeAllConnections();
  }
}

function isLoopback(address: string | AddressInfo | null): boolean {
  if (address === null || typeof address === 'string') {
    return false;
  }
  return address.address === '127.0.0.1';
}

function safeHomedir(): string | null {
  try {
    return homedir();
  } catch {
    return null;
  }
}
