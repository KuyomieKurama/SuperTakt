/**
 * Takt — Speicherung: Ports und Adapter.
 *
 * Dieses Paket hält die ausgehenden Ports **und** den SQLite-Adapter, der sie
 * umsetzt. Die Domäne hängt nicht von hier ab; die Abhängigkeit läuft genau
 * andersherum (E-001, architektur.md 1.1).
 *
 * Der Adapter ist austauschbar. Fällt das „zumindest derzeit" aus E-001, tritt
 * an seine Stelle ein anderer — die Ports und damit jeder Anwendungsfall
 * bleiben, wie sie sind. Genau deshalb geben die Ports `Promise` zurück,
 * obwohl `node:sqlite` synchron arbeitet.
 */

export type * from './ports.ts';
export type * from './migration.ts';

/**
 * Der Fehlschlag des Migrationsverfahrens ist **kein** reiner Typ (T-132).
 *
 * Er gehört zur Zusage des Ports: Wer migrieren lässt, muss den Ausgang
 * unterscheiden können, ohne eine Meldung zu zergliedern. Die vier Helfer
 * daneben sind pur und lesen nur, was an einem Wurf steht.
 */
export {
  errorCodeOf,
  isBusyResultCode,
  migrationFailure,
  migrationFailureReason,
  sqliteResultCodeOf,
} from './migration.ts';

// ---------------------------------------------------------------------------
// SQLite-Adapter (T-021)
// ---------------------------------------------------------------------------

export {
  openConnection,
  secureDatabaseFiles,
  inspectDatabasePermissions,
  CONNECTION_PRAGMAS,
  DATABASE_FILE_MODE,
} from './sqlite/database.ts';
export type { SqlConnection, SqlRow, SqlStatement, SqlValue } from './sqlite/database.ts';

export { createIdSource, uuidv7 } from './sqlite/ids.ts';
export type { IdSource } from './sqlite/ids.ts';

export { createClockPort, createSystemPort, toTimestamp } from './sqlite/clock.ts';
export {
  createFilePort,
  DIRECTORY_CHECK_BUDGET_MS,
  ensureDirectory,
  removeFile,
  sweepTemporaryFiles,
  within,
} from './sqlite/file-port.ts';
export type { TimeBudgetResult } from './sqlite/file-port.ts';

export { createAttachmentPort } from './sqlite/repo-attachments.ts';

export { createTransactionPort, createUnitOfWork } from './sqlite/unit-of-work.ts';
export type { UnitOptions } from './sqlite/unit-of-work.ts';

export { createMigrationRunner, loadMigrations, migrationsFromFiles } from './sqlite/migration-runner.ts';
export type { MigrationRunnerOptions } from './sqlite/migration-runner.ts';

export { asStorageFailure, translateSqliteError, UNIQUE_INDEX_CATALOG } from './sqlite/errors.ts';

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, decodeCursor, encodeCursor, pageSize } from './sqlite/paging.ts';

export { openDatabase } from './sqlite/open.ts';
export type { OpenOptions, OpenedDatabase } from './sqlite/open.ts';
