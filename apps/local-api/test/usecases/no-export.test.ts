import { expect, it } from 'vitest';
import { openDatabase } from '@takt/storage';
import type { Timestamp, TodoId } from '@takt/domain';
import type { AppContext } from '../../src/context';
import { createTodoRoutes } from '../../src/features/todos/routes';
import { createTimeEntryRoutes } from '../../src/features/timer/routes';

it('NoExport survives API editing, permits timers and filters booking pages before pagination', async () => {
  const now = '2026-09-15T10:00:00Z' as Timestamp;
  const db = openDatabase({ location: ':memory:', now: () => now });
  try {
    await db.migrations.migrateToLatest();
    const context = { transactions: db.transactions, clock: { now: () => now } } as AppContext;
    const todos = createTodoRoutes(context);
    const bookings = createTimeEntryRoutes(context);
    const response = await todos.request('/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Interne Arbeit', tagIds: [], tagNames: [], note: '', noExport: true }) });
    expect(response.status, await response.clone().text()).toBe(201);
    const body = await response.json() as { data: { id: TodoId; todo?: { id: TodoId } } };
    const id = body.data.todo?.id ?? body.data.id;
    await db.transactions.inTransaction(async unit => {
      expect((await unit.todos.load(id))?.noExport).toBe(true);
      expect((await unit.timer.start(id, false, now)).ok).toBe(true);
      expect((await unit.timer.stop('Intern', '2026-09-15T10:15:00Z' as Timestamp)).ok).toBe(true);
      expect(await unit.timeEntries.sumSeconds({ todoId: id })).toBe(900);
      expect(await unit.exportRead.openCandidates()).toEqual([]);
    });
    const hidden = await bookings.request(`/?todoId=${id}&limit=1`);
    expect(await hidden.json()).toMatchObject({ data: { items: [], total: 0 } });
    const visible = await bookings.request(`/?todoId=${id}&includeNoExport=true`);
    expect(await visible.json()).toMatchObject({ data: { total: 1 } });
    const update = await todos.request(`/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noExport: false }) });
    expect(update.status, await update.clone().text()).toBe(200);
    expect(await (await bookings.request('/')).json()).toMatchObject({ data: { total: 1 } });
    const invalid = await todos.request(`/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noExport: 'yes' }) });
    expect(invalid.status).toBe(422);
  } finally { db.close(); }
});
