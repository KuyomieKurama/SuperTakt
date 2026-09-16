import { expect, it } from 'vitest';
import { openDatabase } from '@takt/storage';
import type { Timestamp, Todo, TodoId, TodoPriority } from '@takt/domain';
import type { AppContext } from '../../src/context';
import { createPriorityRoutes } from '../../src/features/priorities/routes';
import { createTodoRoutes } from '../../src/features/todos/routes';
import { createBoardRoutes } from '../../src/features/board/routes';
import { createStructureRoutes } from '../../src/features/structure/routes';
const json = (body: unknown, method = 'POST') => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

it('persists priorities, validates integers, sorts/filter boards before pagination and retains assignments through archives', async () => {
  const now = '2026-09-16T10:00:00Z' as Timestamp;
  const db = openDatabase({ location: ':memory:', now: () => now });
  try {
    await db.migrations.migrateToLatest();
    const context = { transactions: db.transactions, clock: { now: () => now } } as AppContext;
    const priorities = createPriorityRoutes(context);
    const todos = createTodoRoutes(context);
    const board = createBoardRoutes(context);
    const pools = createStructureRoutes(context).pools;
    const addPriority = async (name: string, weight: number) => {
      const response = await priorities.request('/', json({ name, weight }));
      expect(response.status, await response.clone().text()).toBe(201);
      return (await response.json() as { data: TodoPriority }).data;
    };
    const low = await addPriority('Niedrig', -5);
    const high = await addPriority('Hoch', 100);
    for (const weight of [1.5, '10', Number.MAX_SAFE_INTEGER + 1, null]) expect((await priorities.request('/', json({ name: 'Ungültig', weight }))).status).toBe(422);
    expect((await priorities.request('/', json({ name: 'hoch', weight: 2 }))).status).toBe(409);
    const addTodo = async (title: string, priorityId: string | null) => {
      const response = await todos.request('/', json({ title, priorityId }));
      expect(response.status, await response.clone().text()).toBe(201);
      return (await response.json() as { data: { todo: Todo } }).data.todo;
    };
    const unassigned = await addTodo('Ohne', null);
    const lower = await addTodo('Niedrig', low.id);
    const first = await addTodo('Wichtig', high.id);
    const second = await addTodo('Ebenso wichtig', high.id);
    expect((await pools.request('/', json({ name: 'Alle offenen', placement: 'board', completion: 'open' }))).status).toBe(201);
    const response = await board.request('/?sortByPriority=true&limit=1');
    expect(response.status, await response.clone().text()).toBe(200);
    const column = (await response.json() as { data: { columns: { column: { id: string }; todos: Todo[]; nextCursor: string; total: number }[] } }).data.columns[0]!;
    expect(column.total).toBe(4);
    expect(column.todos[0]?.priorityId).toBe(high.id);
    const seen: TodoId[] = [column.todos[0]!.id];
    let cursor: string | null = column.nextCursor;
    while (cursor) {
      const page = await pools.request(`/${column.column.id}/todos?sortByPriority=true&limit=1&cursor=${encodeURIComponent(cursor)}`);
      const result = await page.json() as { data: { items: Todo[]; nextCursor: string | null } };
      seen.push(...result.data.items.map(todo => todo.id)); cursor = result.data.nextCursor;
    }
    expect(new Set(seen.slice(0, 2))).toEqual(new Set([first.id, second.id]));
    expect(seen.slice(2)).toEqual([lower.id, unassigned.id]);
    const filtered = await board.request(`/?priorityId=${high.id}&sortByPriority=true&limit=1`);
    expect(await filtered.json()).toMatchObject({ data: { columns: [{ total: 2, todos: [{ priorityId: high.id }] }] } });
    expect(await (await board.request('/?withoutPriority=true')).json()).toMatchObject({ data: { columns: [{ total: 1, todos: [{ id: unassigned.id }] }] } });
    expect((await board.request('/?priorityId=')).status).toBe(422);
    await db.transactions.inTransaction(async unit => {
      const archive = await unit.dataArchive.readAll();
      await unit.dataArchive.replaceAll(archive);
      expect((await unit.todos.load(first.id))?.priorityId).toBe(high.id);
      expect((await unit.priorities.list()).map(priority => priority.weight)).toEqual([100, -5]);
    });
    expect((await priorities.request(`/${low.id}`, json({ name: 'Jetzt dringend', weight: 200 }, 'PUT'))).status).toBe(200);
    expect(await (await board.request('/?sortByPriority=true&limit=1')).json()).toMatchObject({ data: { columns: [{ todos: [{ id: lower.id }] }] } });
    expect((await todos.request(`/${unassigned.id}`, json({ priorityId: high.id }, 'PATCH'))).status).toBe(200);
    expect((await priorities.request(`/${high.id}`, { method: 'DELETE' })).status).toBe(204);
    await db.transactions.inTransaction(async unit => {
      expect((await unit.todos.load(first.id))?.priorityId).toBeNull();
      expect((await unit.todos.load(unassigned.id))?.priorityId).toBeNull();
      expect((await unit.todos.search({})).total).toBe(4);
    });
  } finally { db.close(); }
});
