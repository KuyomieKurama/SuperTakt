/**
 * Takt — Zusammenbau an genau einer Stelle (architektur.md 1.3).
 *
 * Alle Adapter werden hier erzeugt und in die Prüfschicht gereicht. Kein
 * Dienstsucher, keine versteckten Einzelstücke. Wer wissen will, was der Dienst
 * wirklich anspricht, liest diese Datei.
 *
 * Für den Prüfpfad wird derselbe Zusammenbau mit Attrappen aufgerufen — etwa
 * mit einem Tokenspeicher im Arbeitsspeicher. Ein Nachweispfad lässt sich damit
 * ohne Datei und ohne echtes Geheimnis prüfen.
 */

import type { Hono } from 'hono';

import {
  createClockPort,
  createFilePort,
  createSystemPort,
  openDatabase,
  type OpenedDatabase,
} from '@takt/storage';

import { createApp } from './app.ts';
import { nodeSecretDigest, type SecretDigestPort } from './access/crypto.ts';
import { createAttachmentBlobPort } from './access/attachment-store.ts';
import { createDirectoryInsightPort } from './access/export-directory.ts';
import { createNoticeBoard, type NoticeBoard } from './access/notices.ts';
import { EMPTY_THROTTLE } from './access/throttle.ts';
import { createTokenService, type TokenService } from './access/token-service.ts';
import type { TokenStorePort } from './access/token-store.ts';
import { LAST_USED_PERSIST_INTERVAL_MS } from './config.ts';
import { createLogger, type Logger } from './logger.ts';
import type { AccessRuntime } from './runtime.ts';
import type { TaktEnv } from './http/guards.ts';
import type { AppContext } from './usecases/context.ts';
import type { ExportFaultInjection } from './usecases/export.ts';
import { createVersionChecker, type VersionChecker } from './version/checker.ts';
import type { ReleaseSourcePort } from './version/source.ts';

export interface CompositionOptions {
  readonly port: number;
  readonly store: TokenStorePort;
  /**
   * Das Sitzungsgeheimnis im Klartext. Es wird hier **einmal** zu einem Abdruck
   * verrechnet und danach nicht mehr aufbewahrt — auch nicht im Zusammenbau.
   */
  readonly sessionSecret: string | null;
  /**
   * Windows-Benutzername aus der zweiten `stdin`-Zeile (E-042). Ohne Vorgabe:
   * Ein stiller Rückfall auf `USERNAME` oder auf eine leere Zeichenkette wäre
   * genau der Weg, auf dem fremde Arbeitszeit unter falschem Namen in eine
   * Abrechnung gelangt (B-8.1).
   */
  readonly windowsUser: string;
  readonly digest?: SecretDigestPort;
  readonly logger?: Logger;
  readonly notices?: NoticeBoard;
  readonly clock?: () => Date;
  /**
   * Pfad der Datenbankdatei oder `':memory:'`.
   *
   * Ohne Angabe wird **keine** geöffnet, und die Fachrouten hängen nicht. Das
   * ist der Zustand, in dem der Nachweispfad des Zugriffsverfahrens läuft: Er
   * prüft die Kette, nicht den Datenpfad.
   */
  readonly databaseLocation?: string;
  /**
   * Wo die Bildkopien der Anhänge liegen — das Anwendungsdatenverzeichnis
   * (E-018, E-071 Punkt 2, A-A-17).
   *
   * Er kommt aus dem Zusammenbau und nie aus einer Anfrage, genau wie
   * `databaseLocation` (B-1.6 Punkt 1). **Ohne Angabe gibt es keinen Ort**,
   * und dann gibt es keine Bildanhänge: `copyImage` antwortet mit
   * `write_failed` („Das Bild konnte nicht abgelegt werden."), `readImage`
   * mit `bad_name`. Das ist der Zustand jedes Prüfpfads mit `':memory:'` —
   * eine Antwort und kein Wurf.
   *
   * Seit T-159 nicht mehr `unreadable`: Dieser Satz sagte „Diese Datei lässt
   * sich nicht lesen." über eine Datei, die tadellos ist.
   */
  readonly appDataDir?: string;
  /** Zeitzone für die Tagesgruppierung des Exports (E-025). */
  readonly timeZone?: string;
  /**
   * Für den Prüfpfad: ein Haken mitten im Exportlauf.
   *
   * Er ist über keine Anfrage erreichbar und wird ausschließlich hier gesetzt.
   * Begründung, warum er im Erzeugnis steht, in `usecases/export.ts`.
   */
  readonly exportFaults?: ExportFaultInjection;
  /**
   * Woher die zuletzt veröffentlichte Fassung kommt (E-066 Punkt 1).
   *
   * Ohne Angabe: die feste Adresse im Erzeugnis (A-V-1). Dieser Parameter ist
   * die **prüfbare Naht** und kein Regler: Er liegt im Prozess, wie jeder
   * andere Port dieses Zusammenbaus, und ist von außen nicht erreichbar — nicht
   * über eine Route, nicht über eine Einstellung, nicht über eine
   * Umgebungsvariable, nicht über ein Argument (der Sidecar kennt keine,
   * B-1.6 Punkt 1). `proof:release-safety` misst, dass im ausgelieferten
   * Zusammenbau kein Weg zu einer anderen Adresse führt.
   */
  readonly releaseSource?: ReleaseSourcePort;
}

export interface Composition {
  readonly runtime: AccessRuntime;
  readonly app: Hono<TaktEnv>;
  readonly tokens: TokenService;
  /** `null`, wenn keine Datenbank geöffnet wurde. Dann hängen keine Fachrouten. */
  readonly database: OpenedDatabase | null;
  readonly context: AppContext | null;
  /**
   * Die Versionsprüfung (E-069). **Gebaut, aber nicht gestartet.**
   *
   * `compose()` stellt keine Verbindung nach außen her — kein Nachweispfad und
   * kein Prüffall, der den Dienst zusammenbaut, sendet dadurch ein
   * Lebenszeichen (R-19 Punkt 3). Wer eine Anfrage will, ruft `start()`, und
   * das tut genau eine Stelle: `main.ts`.
   */
  readonly versionCheck: VersionChecker;
}

export function compose(options: CompositionOptions): Composition {
  const digest = options.digest ?? nodeSecretDigest;
  const logger = options.logger ?? createLogger();
  const notices = options.notices ?? createNoticeBoard();
  const clock = options.clock ?? (() => new Date());

  const tokens = createTokenService({
    store: options.store,
    digest,
    notices,
    lastUsedPersistIntervalMs: LAST_USED_PERSIST_INTERVAL_MS,
  });

  const runtime: AccessRuntime = {
    port: options.port,
    digest,
    tokens,
    sessionFingerprint: options.sessionSecret === null ? null : digest.digest(options.sessionSecret),
    windowsUser: options.windowsUser,
    notices,
    logger,
    clock,
    throttle: EMPTY_THROTTLE,
  };

  // ---------------------------------------------------------------------------
  // Die Speicherung. Der Pfad kommt aus dem Anwendungsdatenverzeichnis (E-018)
  // und nie aus einer Anfrage oder einem Argument (B-1.6 Punkt 1).
  // ---------------------------------------------------------------------------
  const clockPort = createClockPort(clock);

  const database =
    options.databaseLocation === undefined
      ? null
      : openDatabase({
          location: options.databaseLocation,
          now: () => clockPort.now(),
          ...(options.timeZone === undefined ? {} : { timeZone: options.timeZone }),
        });

  const context: AppContext | null =
    database === null
      ? null
      : {
          transactions: database.transactions,
          clock: clockPort,
          files: createFilePort(),
          directories: createDirectoryInsightPort(),
          // Die Bildkopien der Anhänge (E-071 Punkt 2). Derselbe Ort wie der
          // Bestand und dieselben Rechten (E-018, A-A-17); ohne Angabe kein
          // Ort und damit keine Bildanhänge.
          // Der Protokollschreiber ist derselbe wie überall. Er ist hier kein
          // Beiwerk: Ein Fehlschlag beim Entfernen einer Bildkopie hat keinen
          // anderen Empfänger (T-159, A-A-18).
          attachmentBlobs: createAttachmentBlobPort(options.appDataDir ?? null, logger),
          // E-010, E-042: Der Windows-Benutzername kommt über die zweite
          // `stdin`-Zeile herein und wird von hier bis in `export_run` und
          // `export_audit` durchgereicht. Es gibt auf dem ganzen Weg keine
          // Stelle, an der ein Aufrufer ihn setzen könnte — kein
          // Anwendungsfall nimmt ihn als Argument, keine Route liest ihn aus
          // einem Rumpf (B-8.1).
          // Der zweite Wert ist der Ort des Bestands (E-018, R-13). Er kommt
          // aus demselben Zusammenbau wie die geöffnete Datenbank und aus
          // keiner Anfrage; `':memory:'` heißt „kein Ort" und nicht „hier".
          system: createSystemPort(
            options.windowsUser,
            options.databaseLocation === ':memory:' ? null : (options.databaseLocation ?? null),
          ),
          ...(options.exportFaults === undefined ? {} : { exportFaults: options.exportFaults }),
        };

  // Die Versionsprüfung (A-18.2, E-069). Sie hängt an keiner Datenbank: Was
  // sie weiß, liegt im Arbeitsspeicher, und was übersprungen wurde, ist eine
  // Einstellung wie jede andere und wird über `/settings` gelesen.
  const versionCheck = createVersionChecker({
    logger,
    now: clock,
    ...(options.releaseSource === undefined ? {} : { source: options.releaseSource }),
  });

  return {
    runtime,
    app: createApp(runtime, {
      ...(context === null ? {} : { context }),
      versionState: () => versionCheck.current(),
    }),
    tokens,
    database,
    context,
    versionCheck,
  };
}
