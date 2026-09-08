import { afterEach, describe, expect, it } from 'vitest';
import type { CalendarDay } from '@takt/domain';

import { NOW, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

describe('DataArchivePort — vollständiger Round-Trip (A-20.3 bis A-20.6)', () => {
  let db: TestDatabase;

  afterEach(() => db.close());

  it('stellt den exakten Bestand wieder her und lässt Schutztrigger bestehen', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Migration', '#2563eb', NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;
    const todo = await db.unit.todos.create(
      { title: 'Zu sichernde Aufgabe', callNumber: 'CALL-42', statusId: null, tagIds: [tag.value.id], note: 'Interner Vermerk', dueDate: '2026-09-30' as CalendarDay, now: NOW },
      [tag.value.id],
    );
    await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:30:00Z'), note: 'Leistung' },
      NOW,
    );

    const before = await db.unit.dataArchive.readAll();
    await db.unit.todos.create(
      { title: 'Entfällt beim Restore', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    await db.transactions.inTransaction(async (unit) => unit.dataArchive.replaceAll(before));
    expect(await db.unit.dataArchive.readAll()).toEqual(before);

    const trigger = db.conn.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_export_template_builtin_no_delete'").get();
    expect(trigger?.['name']).toBe('trg_export_template_builtin_no_delete');
  });

  it('weist unvollständige Zeilen ab, bevor der Bestand verändert wird', async () => {
    db = openTestDatabase();
    const before = await db.unit.dataArchive.readAll();
    const broken = {
      ...before,
      todo_status: before.todo_status.map(({ updated_at: _removed, ...row }) => row),
    };

    await expect(db.transactions.inTransaction(async (unit) => unit.dataArchive.replaceAll(broken))).rejects.toThrow('ungültige Zeile');
    expect(await db.unit.dataArchive.readAll()).toEqual(before);
  });
});
