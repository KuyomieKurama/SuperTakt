/**
 * Vollständiges, JSON-kompatibles Abbild des fachlichen SQLite-Bestands.
 *
 * Die Spaltenlisten sind absichtlich ausgeschrieben. Eine Sicht oder eine neue
 * Spalte wird dadurch nicht versehentlich Teil des öffentlichen Dateiformats;
 * eine Formaterweiterung braucht eine bewusste neue Fassung.
 */

import type {
  ArchiveRow,
  ArchiveScalar,
  DataArchivePort,
  DataArchiveTable,
  DataArchiveTables,
} from '../ports.ts';
import type { SqlConnection, SqlRow, SqlValue } from './database.ts';

interface TableDefinition {
  readonly columns: readonly string[];
  readonly orderBy: string;
}

const TABLES: Readonly<Record<DataArchiveTable, TableDefinition>> = Object.freeze({
  todo_status: { columns: ['id', 'name', 'position', 'is_default', 'color', 'created_at', 'updated_at'], orderBy: 'position, id' },
  tag_folder: { columns: ['id', 'parent_id', 'name', 'created_at', 'updated_at'], orderBy: 'created_at, id' },
  tag: { columns: ['id', 'folder_id', 'name', 'color', 'created_at', 'updated_at', 'name_key'], orderBy: 'created_at, id' },
  todo: { columns: ['id', 'title', 'call_number', 'status_id', 'completed_at', 'created_at', 'updated_at', 'due_date'], orderBy: 'created_at, id' },
  todo_note: { columns: ['todo_id', 'body', 'updated_at'], orderBy: 'todo_id' },
  todo_tag: { columns: ['todo_id', 'tag_id', 'created_at'], orderBy: 'todo_id, tag_id' },
  time_entry: { columns: ['id', 'todo_id', 'started_at', 'ended_at', 'note', 'export_status', 'export_count', 'source', 'created_at', 'updated_at'], orderBy: 'started_at, id' },
  timer_heartbeat: { columns: ['time_entry_id', 'seen_at'], orderBy: 'time_entry_id' },
  todo_attachment_kind: { columns: ['kind'], orderBy: 'kind' },
  todo_attachment: { columns: ['id', 'todo_id', 'kind', 'title', 'target', 'position', 'created_at'], orderBy: 'todo_id, position, id' },
  pool: { columns: ['id', 'name', 'match_mode', 'include_subfolders', 'position', 'created_at', 'updated_at', 'placement', 'completion', 'export_state'], orderBy: 'position, id' },
  pool_rule: { columns: ['pool_id', 'role', 'tag_id', 'folder_id', 'status_id'], orderBy: 'pool_id, role, tag_id, folder_id, status_id' },
  default_tag: { columns: ['tag_id', 'position', 'created_at'], orderBy: 'position, tag_id' },
  export_template: { columns: ['id', 'name', 'is_builtin', 'definition', 'created_at', 'updated_at'], orderBy: 'created_at, id' },
  export_run: { columns: ['id', 'template_id', 'template_snapshot', 'file_path', 'file_sha256', 'byte_size', 'entry_count', 'total_quarters', 'rounding_mode', 'windows_user', 'created_at'], orderBy: 'created_at, id' },
  export_run_group: { columns: ['id', 'export_run_id', 'todo_id', 'day', 'seconds', 'quarters'], orderBy: 'export_run_id, day, todo_id' },
  export_run_entry: { columns: ['export_run_group_id', 'time_entry_id', 'duration_seconds'], orderBy: 'export_run_group_id, time_entry_id' },
  export_audit: { columns: ['id', 'time_entry_id', 'event', 'previous_status', 'new_status', 'export_run_id', 'export_run_group_id', 'actor', 'reason', 'occurred_at'], orderBy: 'occurred_at, id' },
  app_setting: { columns: ['id', 'export_directory', 'active_export_template_id', 'rounding_mode', 'locale', 'theme', 'updated_at', 'skipped_version', 'design_theme', 'density', 'prompt_on_timer_stop'], orderBy: 'id' },
});

const INSERT_ORDER: readonly DataArchiveTable[] = [
  'todo_status', 'tag_folder', 'tag', 'todo_attachment_kind', 'todo', 'todo_note',
  'todo_tag', 'time_entry', 'timer_heartbeat', 'todo_attachment', 'pool', 'pool_rule',
  'default_tag', 'export_template', 'export_run', 'export_run_group',
  'export_run_entry', 'export_audit', 'app_setting',
];

const DELETE_ORDER: readonly DataArchiveTable[] = [...INSERT_ORDER].reverse();

function scalar(value: SqlValue): ArchiveScalar {
  if (value === null || typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') {
    const converted = Number(value);
    if (Number.isSafeInteger(converted)) return converted;
  }
  throw new Error('Das Datenarchiv enthält einen nicht unterstützten Binärwert.');
}

function archiveRow(row: SqlRow, columns: readonly string[]): ArchiveRow {
  const result: Record<string, ArchiveScalar> = {};
  for (const column of columns) {
    const value = row[column];
    if (value === undefined) throw new Error(`Die Archivspalte ${column} fehlt.`);
    result[column] = scalar(value);
  }
  return result;
}

interface TriggerDefinition {
  readonly name: string;
  readonly sql: string;
}

function triggerDefinitions(conn: SqlConnection): readonly TriggerDefinition[] {
  return conn.prepare(
    "SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND sql IS NOT NULL ORDER BY name",
  ).all().flatMap((row) =>
    typeof row['name'] === 'string' && typeof row['sql'] === 'string'
      ? [{ name: row['name'], sql: row['sql'] }]
      : []
  );
}

const quotedIdentifier = (value: string): string => `"${value.replaceAll('"', '""')}"`;

export function createDataArchivePort(conn: SqlConnection): DataArchivePort {
  return {
    async readAll(): Promise<DataArchiveTables> {
      const result = {} as Record<DataArchiveTable, readonly ArchiveRow[]>;
      for (const [table, definition] of Object.entries(TABLES) as [DataArchiveTable, TableDefinition][]) {
        const sql = `SELECT ${definition.columns.join(', ')} FROM ${table} ORDER BY ${definition.orderBy}`;
        result[table] = conn.prepare(sql).all().map((row) => archiveRow(row, definition.columns));
      }
      return result;
    },

    async replaceAll(tables: DataArchiveTables): Promise<void> {
      // Vollständig prüfen, bevor der erste bestehende Datensatz angefasst wird.
      for (const table of INSERT_ORDER) {
        const columns = TABLES[table].columns;
        for (const row of tables[table]) {
          if (
            columns.some((column) => !Object.hasOwn(row, column)) ||
            Object.keys(row).some((column) => !columns.includes(column)) ||
            Object.values(row).some((value) => value !== null && typeof value !== 'string' &&
              (typeof value !== 'number' || !Number.isFinite(value)))
          ) {
            throw new Error(`Das Datenarchiv enthält eine ungültige Zeile in ${table}.`);
          }
        }
      }

      // Während des Round-Trips gelten nicht nur Löschsperren: Manche
      // Invariant-Trigger untersagen Zwischenzustände, die im gespeicherten
      // Endzustand erlaubt sind (beispielsweise ein altes Timer-Lebenszeichen
      // neben einer inzwischen beendeten Buchung). Alle Definitionen stammen
      // aus dem lokalen, migrierten Schema und werden wortgleich zurückgelegt.
      const triggers = triggerDefinitions(conn);
      conn.exec('PRAGMA defer_foreign_keys = ON;');
      for (const trigger of triggers) conn.exec(`DROP TRIGGER ${quotedIdentifier(trigger.name)};`);

      for (const table of DELETE_ORDER) conn.prepare(`DELETE FROM ${table}`).run();

      for (const table of INSERT_ORDER) {
        const columns = TABLES[table].columns;
        const placeholders = columns.map(() => '?').join(', ');
        const statement = conn.prepare(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        );
        for (const row of tables[table]) {
          statement.run(...columns.map((column) => row[column] ?? null));
        }
      }

      for (const trigger of triggers) conn.exec(`${trigger.sql};`);
    },
  };
}
