/**
 * Takt — T-027, Testhilfe: eine migrierte SQLite-Verbindung samt Unit of Work
 * (E-048 Risiko 1 / T-021 Risiko 1: `packages/storage/src/sqlite/**` lag bei
 * 0 Prozent Abdeckung).
 *
 * Anders als `support/migrated-database.ts` (T-010b, prüft das SQL-Schema
 * selbst) baut diese Datei die **TypeScript-Adapter** aus `src/sqlite/*.ts`
 * gegen eine echte, vollständig migrierte `node:sqlite`-Verbindung im
 * Arbeitsspeicher zusammen — also genau das, was in T-021 entstanden ist und
 * wofür bislang kein Unit-Test existierte.
 *
 * Die Migrationen werden direkt per `exec()` eingespielt (dasselbe Verfahren
 * wie in `migrated-database.ts`), nicht über `createMigrationRunner` — der
 * Läufer selbst bekommt seine eigene, ausführliche Testdatei
 * (`migration-runner.test.ts`) und soll hier nicht als Vorbedingung mit
 * hineinspielen.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Timestamp } from '@takt/domain';

import { openConnection, type SqlConnection } from '../../src/sqlite/database.ts';
import { createTransactionPort, createUnitOfWork } from '../../src/sqlite/unit-of-work.ts';
import type { IdSource } from '../../src/sqlite/ids.ts';
import type { TransactionPort, UnitOfWork } from '../../src/ports.ts';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', '..', 'migrations');

function migrationFilesInOrder(): readonly string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.up.sql'))
    .sort();
}

/** Eine frische, vollständig migrierte In-Memory-Verbindung — kein Läufer beteiligt. */
export function openMigratedConnection(): SqlConnection {
  const conn = openConnection(':memory:');
  for (const file of migrationFilesInOrder()) {
    conn.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  return conn;
}

/**
 * Kennungsquelle mit vorhersagbaren, aufsteigenden Werten.
 *
 * `createIdSource()` (UUIDv7) wäre in einer Prüfung unhandlich: Zwei Läufe
 * ergäben nie dieselbe Kennung, und ein Test, der eine bestimmte Reihenfolge
 * nachweisen will, müsste sie aus dem Rückgabewert zurücklesen statt sie
 * vorherzusagen.
 */
export function fakeIds(prefix = 'id'): IdSource {
  let n = 0;
  return { next: () => `${prefix}-${String(++n).padStart(6, '0')}` };
}

/** Ein fester Zeitpunkt für Prüfpfade, in der Form, die das Schema verlangt. */
export const NOW: Timestamp = '2026-08-31T08:00:00Z' as Timestamp;

export function ts(iso: string): Timestamp {
  return iso as Timestamp;
}

export interface TestDatabase {
  readonly conn: SqlConnection;
  /** Direkter Zugriff auf alle Ports, außerhalb jeder expliziten Transaktion. */
  readonly unit: UnitOfWork;
  /** Die Transaktionsklammer auf derselben Verbindung, derselben Kennungsquelle. */
  readonly transactions: TransactionPort;
  readonly ids: IdSource;
  close(): void;
}

/**
 * Baut Adapter und Transaktionsklammer auf **einer** migrierten Verbindung.
 *
 * `unit` und `transactions` teilen dieselbe Kennungsquelle: Wer über den einen
 * Weg schreibt und über den anderen prüft, sieht fortlaufende Kennungen statt
 * einer verwirrenden Lücke.
 */
export function openTestDatabase(options?: {
  readonly ids?: IdSource;
  readonly timeZone?: string;
}): TestDatabase {
  const conn = openMigratedConnection();
  const ids = options?.ids ?? fakeIds();
  const unitOptions = {
    ids,
    ...(options?.timeZone === undefined ? {} : { timeZone: options.timeZone }),
  };
  const unit = createUnitOfWork(conn, unitOptions);
  const transactions = createTransactionPort(conn, unitOptions);
  return { conn, unit, transactions, ids, close: () => conn.close() };
}

/** Legt ein minimales Todo direkt über den Adapter an — keine Standard-Tags. */
export async function createTodo(
  db: TestDatabase,
  fields?: { readonly title?: string; readonly callNumber?: string | null; readonly now?: Timestamp },
) {
  return db.unit.todos.create(
    {
      title: fields?.title ?? 'Testtodo',
      callNumber: fields?.callNumber ?? null,
      statusId: null,
      tagIds: [],
      note: '',
      now: fields?.now ?? NOW,
    },
    [],
  );
}
