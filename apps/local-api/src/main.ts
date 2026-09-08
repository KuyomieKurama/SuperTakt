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
  errorCodeOf,
  inspectDatabasePermissions,
  secureDatabaseFiles,
  sweepTemporaryFiles,
} from '@takt/storage';

import { compose, type Composition } from './composition.ts';
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
import { bringDatabaseUpToDate, describeStoreOpenFailure } from './startup.ts';
import { startTaskpaneServer } from './taskpane/server.ts';
import { sweepOrphanedImages } from './usecases/image-sweep.ts';
import type { ReleaseSourcePort } from './version/source.ts';
import { VERSION_CHECK_START_DELAY_MS } from './version/checker.ts';

/** Beendigungscodes, damit die Hülle den Grund unterscheiden kann. */
const EXIT_CONFIG = 78;
const EXIT_BIND = 74;

/**
 * Was der **Aufrufer im selben Prozeß** an diesem Start noch bestimmen darf.
 *
 * ===========================================================================
 * Warum es diesen Parameter gibt (Befund T-145-1)
 * ===========================================================================
 *
 * Der Kopf dieser Datei sagte bis T-146: „Damit stellt kein Nachweispfad, kein
 * Prüffall und keine Messung eine Verbindung nach außen her." Gemessen war das
 * **Gegenteil**: `proof:access` startet `src/index.ts`, also genau diesen
 * Start, wartet länger als {@link VERSION_CHECK_START_DELAY_MS} — und
 * `ss -tnp` zeigte während des Laufs `ESTAB … 140.82.121.6:443`, also
 * `api.github.com`.
 *
 * Drei Folgen, alle unerwünscht: ein **Lebenszeichen** (R-19 Punkt 3) aus
 * jedem `pnpm check` und damit auch aus dem Auslieferungstor; der Mitverbrauch
 * der 60 Anfragen je Stunde und Quelladresse (T-136-5); und eine Zusage im
 * Quelltext, die nicht stimmt. **Der Nachweis, der die Vertrauensgrenze mißt,
 * überschritt sie selbst.**
 *
 * ===========================================================================
 * Warum ein Parameter und ausdrücklich **keine** Umgebungsvariable
 * ===========================================================================
 *
 * Eine Umgebungsvariable wäre von außerhalb des Prozesses setzbar — und genau
 * das verbietet A-18.3: „nicht aus einer Umgebungsvariablen, nicht aus einem
 * Argument der Befehlszeile". Wer Takt mit gesetzter Variable startete, hätte
 * die Adresse verlegt, gegen die geprüft wird; das ist derselbe Schaden wie
 * `set USERNAME=fremder` bei B-8.1.
 *
 * Ein **Parameter dieser Funktion** ist es nicht. Er liegt im Prozeß, wie
 * jeder andere Port dieses Zusammenbaus, und der ausgelieferte Einstiegspunkt
 * `src/index.ts` ruft `main()` **ohne Argument**. Es gibt damit keinen Weg von
 * außen zu einer anderen Adresse: nicht über eine Route, nicht über eine
 * Einstellung, nicht über eine Datei daneben.
 *
 * Das ist dieselbe Naht, die E-066 Punkt 1 beschreibt („der Prüflauf baut sich
 * seinen eigenen Zusammenbau") und die T-142 in
 * `tests/e2e/support/version-check-entry.ts` schon benutzt. Der Unterschied
 * hier ist, daß **nicht** ein zweiter Start nachgebaut wird: Der Prüflauf
 * fährt denselben `main()` — dieselbe Migration, dieselbe Rechteprüfung,
 * dasselbe Aufräumen, denselben Aufgabenbereich —, und der einzige Unterschied
 * ist der eingesetzte Port. Ein nachgebauter Start wäre ein zweiter Weg, der
 * vom echten abweichen kann, ohne daß ein Fall es mißt.
 */
export interface MainOptions {
  /**
   * Woher die zuletzt veröffentlichte Fassung kommt (E-066 Punkt 1).
   *
   * Ohne Angabe: die feste Adresse im Erzeugnis (A-V-1). `src/index.ts` gibt
   * nichts an — deshalb ist das Erzeugnis von diesem Parameter unberührt.
   */
  readonly releaseSource?: ReleaseSourcePort;
}

export async function main(options: MainOptions = {}): Promise<void> {
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
      // Der Grund noch einmal als Schlüssel: Der Satz ist für den Menschen,
      // dieser Wert für den, der die Zeile später auswertet (T-132).
      `handshake_rejected reason=${handshake.reason}`,
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
      `appdata_missing reason=${paths.reason}`,
    );
    process.exit(EXIT_CONFIG);
  }

  // Das Verzeichnis mit engen Rechten anlegen, bevor irgendetwas darin
  // entsteht (E-018, B-2.2 Punkt 3). `0700` ausdrücklich gesetzt und nicht dem
  // `umask` überlassen — darin liegen Kundendatenbank, Token und Zertifikat.
  await ensureDirectory(paths.dir, DIR_MODE);

  const store = createFileTokenStore(tokenFilePath(paths.dir));

  /*
   * **Der Zusammenbau steht in einer Klammer, und das ist neu** (T-132).
   *
   * `compose()` öffnet den Bestand. Bis T-132 stand der Aufruf frei: Ein Wurf
   * von dort — ein belegter Bestand, ein fehlendes Verzeichnis, eine
   * beschädigte Datei — lief an dieser Datei vorbei und endete im Auffangnetz
   * des gebündelten Sidecars, das `error.message` nach `stderr` schreibt.
   * Ausgerechnet dort kann ein Pfad stehen (`ENOENT: … open '/home/…'`), und
   * im Entwicklungsbetrieb kam obendrein der ganze Aufrufstapel dazu.
   *
   * Der Grund wird deshalb hier eingeordnet und **pfadfrei** protokolliert.
   * Was der Benutzer liest, ist ein Satz; was im Protokoll danebensteht, ist
   * ein Schlüssel aus einem geschlossenen Vorrat (`startup.ts`).
   */
  let composed: Composition;
  try {
    composed = compose({
      port: DEFAULT_PORT,
      store,
      sessionSecret: handshake.secret,
      windowsUser: handshake.windowsUser,
      databaseLocation: databaseFilePath(paths.dir),
      // Die Bildkopien der Anhänge liegen neben dem Bestand (E-018, E-071
      // Punkt 2, A-A-17) — derselbe Ort, dieselben Rechte, und beide kommen
      // aus derselben Auflösung und nicht aus einer Anfrage.
      appDataDir: paths.dir,
      logger,
      // Ohne Angabe bleibt die feste Adresse aus `version/source.ts` die
      // einzige (A-V-1). `src/index.ts` gibt nichts an; wer hier etwas
      // einsetzt, tut es im selben Prozeß und nicht von außen — siehe
      // {@link MainOptions}.
      ...(options.releaseSource === undefined ? {} : { releaseSource: options.releaseSource }),
    });
  } catch (error) {
    const diagnosis = describeStoreOpenFailure(error);
    logger.lifecycle('error', diagnosis.sentence, diagnosis.key);
    process.exit(EXIT_CONFIG);
  }
  const { app, runtime, tokens, database, context, versionCheck } = composed;

  // ---------------------------------------------------------------------------
  // Migration. Vorwärts bis zur höchsten bekannten Fassung, mit
  // Sicherungskopie davor (siehe migration-runner.ts).
  //
  // Schlägt sie fehl, startet der Dienst **nicht**. Ein Dienst auf einem
  // Schema, das er nicht kennt, schreibt in eine Abrechnung.
  //
  // **Der Grund wird unterschieden** (T-132). Hier stand bis dahin ein `catch`
  // ohne Bindung; der Schritt selbst liegt jetzt in `startup.ts` und ist ohne
  // laufenden Dienst prüfbar.
  // ---------------------------------------------------------------------------
  if (database !== null && !(await bringDatabaseUpToDate(database.migrations, logger))) {
    process.exit(EXIT_CONFIG);
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
        `file_permissions_wide files=${permissions.tooPermissive.length}`,
      );
    }
    /*
     * **Nicht messbar ist ein eigener Satz** (T-146, Befund T-143 S-4).
     *
     * Bis dahin verschwand jeder gescheiterte `stat` in einem `catch {}`, und
     * das Protokoll schwieg genauso wie die Einstellungen: null zu weite
     * Dateien, also alles in Ordnung. Auf einer eingehängten Freigabe oder in
     * einem Container mit engem `x`-Recht auf dem Elternordner war das eine
     * Entwarnung, für die niemand nachgesehen hatte.
     *
     * Der Fall ist **kein** `warn`: Es ist nicht bekannt, daß etwas offen
     * liegt — es ist bekannt, daß man es nicht weiß. Deshalb `info`, mit dem
     * Grund im Schlüssel und ohne Pfad im Text (B-2.4 Punkt 4). Sichtbar wird
     * derselbe Zustand in den Einstellungen als `null` und nicht als `0`.
     */
    if (permissions.unmeasured.length > 0) {
      logger.lifecycle(
        'info',
        `Die Rechte von ${permissions.unmeasured.length} Datei(en) des Datenbestands ließen sich nicht lesen. ` +
          'Takt sagt darüber nichts — weder dass sie eng liegen noch dass sie offen liegen.',
        `file_permissions_unmeasured files=${permissions.unmeasured.length}`,
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

  /*
   * Bildkopien ohne Eigentümer entfernen (A-A-18).
   *
   * Derselbe Anlass wie eine Zeile höher — etwas ist liegengeblieben, und es
   * ist Kundenmaterial —, nur die andere Hälfte: Dort eine halbe Exportdatei,
   * hier eine Bildkopie, deren Anhang es nicht mehr gibt. Sie entsteht, wenn
   * das Entfernen scheitert (T-159) oder eine Migration zurückgeht.
   *
   * **Hier und nicht später:** Der Lauf liest erst das Verzeichnis und fragt
   * dann den Bestand. Solange keine Route zuhört, kann zwischen beiden
   * Schritten kein Anhang entstehen — im Hintergrund neben laufenden Anfragen
   * hätte er ein Rennen, das eine frische Kopie kosten könnte. Die ganze
   * Begründung steht in `usecases/image-sweep.ts`.
   *
   * **Und der Anschlag auf den Port trägt diese Zusage nicht** (A-A-36): Das
   * `EADDRINUSE` weiter unten greift erst beim Lauschen, also nach dieser
   * Stelle. Getragen wird sie von `tauri_plugin_single_instance` in der Hülle,
   * einem anderen Erzeugnis — nachzulesen im Kopf von `image-sweep.ts`, damit
   * beide Seiten dieselbe Begründung führen.
   *
   * Er kann den Start nicht verhindern: Sein Rückgabewert wird nicht gelesen,
   * und ohne Antwort des Bestands fasst er nichts an.
   */
  if (context !== null) {
    await sweepOrphanedImages(
      {
        attachmentKinds: () =>
          context.transactions.inTransaction((unit) => unit.attachments.knownKinds()),
        listImages: () => context.attachmentBlobs.listImages(),
        knownImageTargets: (names) =>
          context.transactions.inTransaction((unit) => unit.attachments.knownImageTargets(names)),
        imageCount: () =>
          context.transactions.inTransaction((unit) => unit.attachments.imageCount()),
        removeImage: (name) => context.attachmentBlobs.removeImage(name),
      },
      logger,
    );
  }

  await tokens.load(new Date());
  const status = tokens.status();
  if (status.unreadable) {
    // Bewusst kein neues Token: Das würde ein eingerichtetes Add-in ohne
    // Vorwarnung aussperren. Der Dienst läuft, weist Add-in-Anfragen aber ab,
    // bis der Benutzer in der Oberfläche ein neues erzeugt.
    logger.lifecycle(
      'warn',
      'Die Tokendatei ist nicht lesbar. Bitte in den Einstellungen ein neues Token erzeugen.',
      'token_unreadable',
    );
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
        `port_in_use port=${DEFAULT_PORT}`,
      );
      process.exit(EXIT_BIND);
    }
    // Der Grund wird genannt, nicht verschluckt (T-132). `error.code` ist ein
    // Schlüssel der Laufzeit (`EACCES`, `EADDRNOTAVAIL`), kein Pfad und kein
    // Wert aus einer Anfrage; die **Meldung** des Wurfs geht nirgendwohin.
    logger.lifecycle(
      'error',
      'Der lokale Dienst konnte nicht gestartet werden.',
      `listen_failed${runtimeCode(error)}`,
    );
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
        logger.lifecycle(
          'error',
          'Der lokale Dienst lauscht nicht ausschließlich auf 127.0.0.1. Abbruch.',
          'not_loopback',
        );
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
  } catch (error) {
    // Mit Grund (T-132). Ohne ihn ist diese Zeile die zweite Stelle im
    // Startpfad, an der nur die Folge im Protokoll steht: „geht nicht" — und
    // ob ein Zertifikat fehlt, ein Recht oder der Platz auf dem Datenträger,
    // ließ sich hinterher nicht mehr sagen.
    logger.lifecycle(
      'warn',
      'Der Aufgabenbereich des Add-ins konnte nicht bereitgestellt werden. Takt läuft weiter; das Add-in ist bis auf Weiteres nicht benutzbar.',
      `taskpane_failed${runtimeCode(error)}`,
    );
  }

  /*
   * **Die einzige Stelle, an der Takt nach außen spricht** (A-18.2, E-064,
   * E-069, R-19).
   *
   * Sie steht hier unten und nicht im Zusammenbau: `compose()` baut den
   * Prüfer, startet ihn aber nicht. Wer den Dienst nur **zusammenbaut** —
   * `proof:openapi`, `proof:route-policy`, jeder Prüffall mit `compose()` —
   * schickt damit kein Lebenszeichen (R-19 Punkt 3).
   *
   * **Wer `main()` ruft, schickt eines** — und bis T-146 stand hier die
   * unzutreffende Behauptung, das täte niemand außer dem echten Prozeß.
   * `proof:access` startet `src/index.ts`, also genau diesen Start, und
   * `ss -tnp` hat die Verbindung nach `api.github.com` während des Laufs
   * gemessen (T-145-1). Die Naht dafür ist jetzt benannt: {@link MainOptions}
   * nimmt den Port entgegen, `src/index.ts` gibt keinen an, und der Prüflauf
   * setzt eine Abholfunktion ein, die den Prozeß nicht verläßt.
   *
   * Der Takt bleibt unverändert: die erste Anfrage ein paar Sekunden nach dem
   * Start (Begründung in `version/checker.ts`).
   *
   * Was danach geschieht, ist wenig: eine Anfrage, eine geprüfte
   * Fassungsbezeichnung im Arbeitsspeicher, danach höchstens eine Anfrage je
   * 24 Stunden. Ein Fehlschlag ist still und wird im selben Lauf nicht
   * wiederholt (A-18.11).
   */
  versionCheck.start();

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
    /*
     * Zuerst die ausgehende Verbindung (A-V-12).
     *
     * Ein `fetch`, der auf eine Antwort wartet, hielte sonst die
     * Ereignisschleife über die Abschaltfrist hinaus — und ein Prozess mit
     * Datenbankzugriff und ohne Fenster ist genau das, was B-1.6 Punkt 3
     * verhindert. `stop()` bricht den laufenden Aufruf ab und räumt den
     * Zeitgeber weg; beides ist unabhängig davon, ob gerade eine Anfrage läuft.
     */
    versionCheck.stop();
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

/**
 * Der Fehlerschlüssel einer Laufzeitstörung als Anhängsel eines Grundes
 * (T-132) — oder nichts.
 *
 * `EADDRINUSE`, `EACCES`, `ENOENT`: Großbuchstaben, Ziffern, Unterstrich.
 * `errorCodeOf` weist alles ab, was nicht so aussieht, und kleingeschrieben
 * passt es in den Zeichenvorrat, den `logger.ts` durchlässt. Aus diesem Feld
 * kann damit kein Pfad und kein Name werden (B-2.4).
 */
function runtimeCode(error: unknown): string {
  const code = errorCodeOf(error);
  return code === null ? '' : ` code=${code.toLowerCase()}`;
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
