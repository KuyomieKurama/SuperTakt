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
  /** Zeitzone für die Tagesgruppierung des Exports (E-025). */
  readonly timeZone?: string;
  /**
   * Für den Prüfpfad: ein Haken mitten im Exportlauf.
   *
   * Er ist über keine Anfrage erreichbar und wird ausschließlich hier gesetzt.
   * Begründung, warum er im Erzeugnis steht, in `usecases/export.ts`.
   */
  readonly exportFaults?: ExportFaultInjection;
}

export interface Composition {
  readonly runtime: AccessRuntime;
  readonly app: Hono<TaktEnv>;
  readonly tokens: TokenService;
  /** `null`, wenn keine Datenbank geöffnet wurde. Dann hängen keine Fachrouten. */
  readonly database: OpenedDatabase | null;
  readonly context: AppContext | null;
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

  return {
    runtime,
    app: createApp(runtime, context === null ? {} : { context }),
    tokens,
    database,
    context,
  };
}
