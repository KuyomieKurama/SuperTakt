/**
 * Takt — T-010b, Testhilfe: eine vollständig migrierte SQLite-Datenbank im Speicher.
 *
 * `packages/storage/src` liefert bislang ausschließlich Typen (Ports); der
 * SQLite-Adapter, der `MigrationRunnerPort` umsetzt, entsteht erst mit T-007
 * und den Anwendungsfällen. Bis dahin ist die einzige Möglichkeit, das Schema
 * selbst — insbesondere `v_export_candidate`, den Partialindex
 * `ux_time_entry_running` und die Trigger aus Migration 0003/0004 — gegen ein
 * echtes SQLite zu prüfen, die Migrationsdateien direkt einzuspielen.
 *
 * `node:sqlite` (E-035), keine Fremdbibliothek. Jede Migration wird einzeln
 * mit `exec()` eingespielt, in der Reihenfolge ihrer vierstelligen Nummer
 * (lexikographische Sortierung entspricht hier der numerischen). Der eigene
 * Migrationsläufer aus `packages/storage/src/migration.ts` ist absichtlich
 * NICHT beteiligt — er existiert nur als Typ, und diese Datei prüft das
 * SQL-Schema selbst, nicht seinen künftigen Läufer.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', '..', 'migrations');

function migrationFilesInOrder(): readonly string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.up.sql'))
    .sort();
}

/**
 * Öffnet eine neue, leere In-Memory-Datenbank und spielt alle vorwärtigen
 * Migrationen ein — denselben Bestand, mit dem eine frisch installierte
 * Instanz von Takt startet.
 */
export function openMigratedDatabase(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  // Muss je Verbindung gesetzt werden (siehe ConnectionSettings in migration.ts) —
  // ohne das gälten weder ON DELETE CASCADE noch ON DELETE RESTRICT.
  db.exec('PRAGMA foreign_keys = ON;');
  for (const file of migrationFilesInOrder()) {
    db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  return db;
}

/** Die von Migration 0002 angelegte Standardspalte „Backlog". */
export const DEFAULT_STATUS_ID = '01931000-0000-7000-8000-000000000001';

/** Die nicht löschbare Standardvorlage aus Migration 0002/0004. */
export const BUILTIN_TEMPLATE_ID = '01931000-0000-7000-8000-0000000000f1';

/** Legt ein minimales Todo an, ausreichend für alle Zeitbuchungs-Tests hier. */
export function insertTodo(
  db: DatabaseSync,
  fields: { readonly id: string; readonly title?: string; readonly now?: string },
): void {
  const now = fields.now ?? '2026-08-31T08:00:00Z';
  db.prepare(
    `INSERT INTO todo (id, title, call_number, status_id, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, ?)`,
  ).run(fields.id, fields.title ?? 'Testtodo', DEFAULT_STATUS_ID, now, now);
}

/** Legt eine Zeitbuchung an. `endedAt: null` erzeugt einen laufenden Timer. */
export function insertTimeEntry(
  db: DatabaseSync,
  fields: {
    readonly id: string;
    readonly todoId: string;
    readonly startedAt: string;
    readonly endedAt: string | null;
    readonly note?: string;
    readonly exportStatus?: 'open' | 'exported';
    readonly exportCount?: number;
  },
): void {
  const exportStatus = fields.exportStatus ?? (fields.endedAt === null ? 'open' : 'open');
  const exportCount = fields.exportCount ?? (exportStatus === 'exported' ? 1 : 0);
  db.prepare(
    `INSERT INTO time_entry
       (id, todo_id, started_at, ended_at, note, export_status, export_count, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'timer', ?, ?)`,
  ).run(
    fields.id,
    fields.todoId,
    fields.startedAt,
    fields.endedAt,
    fields.note ?? '',
    exportStatus,
    exportCount,
    fields.startedAt,
    fields.endedAt ?? fields.startedAt,
  );
}
