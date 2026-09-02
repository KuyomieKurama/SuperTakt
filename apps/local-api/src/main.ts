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
import { BIND_ADDRESS, DEFAULT_PORT, SESSION_SECRET_TIMEOUT_MS, TASKPANE_PORT } from './config.ts';
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
    // Der Text nennt keinen Wert und keinen Pfad — nur, was zu tun ist. Der
    // Grund wird unterschieden, weil „Benutzername fehlt" eine andere Nacharbeit
    // verlangt als „von Hand gestartet".
    logger.lifecycle(
      'error',
      handshake.reason === 'user_missing'
        ? 'Der lokale Dienst hat keinen Windows-Benutzernamen empfangen. Er startet nicht: Ein Export ohne Urheber wäre nicht nachvollziehbar.'
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

  const server = createAdaptorServer({ fetch: app.fetch });

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
  const shutdown = (): void => {
    taskpane?.close();
    database?.close();
    server.close(() => process.exit(0));
  };

  watchParentLink(process.stdin, () => {
    logger.lifecycle('info', 'Die Verbindung zur Anwendung ist beendet. Der lokale Dienst hält an.');
    shutdown();
  });

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, shutdown);
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
