/**
 * Takt — A-19.34/T-394's name directory, checked again on import (T-401c, from T-388's own
 * archive-import guard). Every listed table.column is checked the same way as at its own door:
 * trimmed, within its length, no control or direction character (`hasForbiddenNameCharacter`).
 * An own archive is meant to be lossless, so a violation rejects the whole import instead of
 * silently cleaning the name up — and the message names the table and column, never the value
 * (T-394's own rule for what may reach a log or a response).
 *
 * This file covers a representative slice of the directory (`todo.title`, `tag.name`,
 * `tag_folder.name`, `todo_status.name`) — the ones buildable with a couple of simple, already
 * exported ports. The remaining columns (`todo_priority.name`, `pool.name`,
 * `export_template.name`, `todo_attachment.title`/`display_name`, `export_run.windows_user`,
 * `export_audit.actor`) need a full export run or attachment fixture and are named as an open gap
 * in the report rather than skipped silently.
 */
import { describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { openDatabase, type OpenedDatabase } from '@takt/storage';
import type { AppContext } from '../../src/context.ts';
import { exportDataArchive, importDataArchive, type TaktDataArchive } from '../../src/features/data-transfer/data-transfer.ts';

const NOW = '2026-09-10T10:00:00Z' as Timestamp;
const DIRECTION_OVERRIDE = '\u202e';

async function setup(): Promise<{ readonly database: OpenedDatabase; readonly context: AppContext }> {
  const database = openDatabase({ location: ':memory:', now: () => NOW });
  await database.migrations.migrateToLatest();
  return {
    database,
    context: {
      transactions: database.transactions,
      clock: { now: () => NOW },
      system: { windowsUser: () => 'Namensprüfung' },
    } as unknown as AppContext,
  };
}

async function buildBaseline(database: OpenedDatabase): Promise<void> {
  await database.transactions.inTransaction(async (unit) => {
    const folder = await unit.folders.create(null, 'Kunden', NOW);
    if (!folder.ok) throw new Error('fixture: folder');
    const tag = await unit.tags.create(folder.value.id, 'Wichtig', null, NOW);
    if (!tag.ok) throw new Error('fixture: tag');
    const status = await unit.statuses.create('In Arbeit', 0, NOW);
    if (!status.ok) throw new Error('fixture: status');
    await unit.todos.create({ title: 'Rückruf', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW }, []);
  });
}

/** Only the baseline row of `table` exists, so every row gets the tainted value. */
function injected(archive: TaktDataArchive, table: 'todo' | 'tag' | 'tag_folder' | 'todo_status', column: string, value: string): TaktDataArchive {
  return {
    ...archive,
    data: {
      ...archive.data,
      tables: {
        ...archive.data.tables,
        [table]: archive.data.tables[table].map((row) => ({ ...row, [column]: value })),
      },
    },
  };
}

describe('A-19.34 — a right-to-left override in an archived name is rejected, named by table.column, and changes nothing', () => {
  it.each([
    { table: 'todo' as const, column: 'title', label: 'todo.title' },
    { table: 'tag' as const, column: 'name', label: 'tag.name' },
    { table: 'tag_folder' as const, column: 'name', label: 'tag_folder.name' },
    { table: 'todo_status' as const, column: 'name', label: 'todo_status.name' },
  ])('$label rejects a name carrying U+202E, without echoing the value, and leaves the database as it was', async ({ table, column, label }) => {
    const { database, context } = await setup();
    try {
      await buildBaseline(database);
      const archive = await exportDataArchive(context);
      expect(archive.data.tables[table].length).toBeGreaterThan(0);

      const tainted = injected(archive, table, column, `A${DIRECTION_OVERRIDE}B`);
      const before = {
        todos: database.connection.prepare('SELECT COUNT(*) AS n FROM todo').get()?.['n'],
        tags: database.connection.prepare('SELECT COUNT(*) AS n FROM tag').get()?.['n'],
        folders: database.connection.prepare('SELECT COUNT(*) AS n FROM tag_folder').get()?.['n'],
        statuses: database.connection.prepare('SELECT COUNT(*) AS n FROM todo_status').get()?.['n'],
      };

      const result = await importDataArchive(context, tainted);
      expect(result).toMatchObject({ ok: false, error: { code: 'validation_error' } });
      if (!result.ok) {
        expect(result.error.message).toContain(label);
        expect(result.error.message).not.toContain(DIRECTION_OVERRIDE);
        expect(result.error.message).not.toContain('A\u202eB');
      }

      expect({
        todos: database.connection.prepare('SELECT COUNT(*) AS n FROM todo').get()?.['n'],
        tags: database.connection.prepare('SELECT COUNT(*) AS n FROM tag').get()?.['n'],
        folders: database.connection.prepare('SELECT COUNT(*) AS n FROM tag_folder').get()?.['n'],
        statuses: database.connection.prepare('SELECT COUNT(*) AS n FROM todo_status').get()?.['n'],
      }).toEqual(before);
    } finally {
      database.close();
    }
  });
});
