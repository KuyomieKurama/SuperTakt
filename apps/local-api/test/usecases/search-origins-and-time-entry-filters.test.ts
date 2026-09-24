/**
 * Takt — C-22 (global search origins, K-3/C22-03/C22-04) and C-14 (`GET /time-entries` filters),
 * both from T-397 (T-401c). Driven through `compose()` + `app.request()` (no port mocked).
 */
import { describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { call, startService } from '../support/service.ts';

interface TodoJson { readonly id: string }

async function createTodo(service: Awaited<ReturnType<typeof startService>>, title: string, tagIds: readonly string[] = []): Promise<string> {
  const response = await call(service, 'POST', '/todos', { title, tagIds });
  expect(response.status, response.text).toBe(201);
  return (response.json as { data: { todo: TodoJson } }).data.todo.id;
}

async function writeNote(service: Awaited<ReturnType<typeof startService>>, todoId: string, text: string): Promise<void> {
  const response = await call(service, 'PUT', `/todos/${todoId}/note`, { text });
  expect(response.status, response.text).toBe(200);
}

describe('C-22 — global search origins (K-3, C22-03, C22-04)', () => {
  it('a hit in the internal note names its origin without leaking any other note text into the JSON (K-3), and /todos?search never finds it (C22-03)', async () => {
    const service = await startService();
    try {
      const titled = await createTodo(service, 'TitelWortSuche');
      const noted = await createTodo(service, 'Ohne Treffer im Titel');
      await writeNote(service, noted, 'GeheimwortEins GeheimwortZwei');

      const byTitle = await call(service, 'GET', '/search?q=TitelWortSuche');
      expect(byTitle.status, byTitle.text).toBe(200);
      const titleHit = (byTitle.json as { data: { todos: { items: { id: string; origins: string[] }[] } } }).data.todos.items;
      expect(titleHit.find((item) => item.id === titled)?.origins).toEqual(['title']);

      const byNote = await call(service, 'GET', '/search?q=GeheimwortEins');
      expect(byNote.status, byNote.text).toBe(200);
      const noteHit = (byNote.json as { data: { todos: { items: { id: string; origins: string[] }[] } } }).data.todos.items;
      expect(noteHit.find((item) => item.id === noted)?.origins).toEqual(['todo_note']);
      // The other word of the same note is nowhere in the response body — only the origin leaks.
      expect(byNote.text).not.toContain('GeheimwortZwei');

      const viaTodos = await call(service, `GET`, '/todos?search=GeheimwortEins');
      expect(viaTodos.status, viaTodos.text).toBe(200);
      const todosResult = (viaTodos.json as { data: { items: { id: string }[] } }).data.items;
      expect(todosResult.some((item) => item.id === noted)).toBe(false);
    } finally {
      service.database?.close();
    }
  });

  it('a service text on a booking older than the 200 most recent is still found (C22-04)', async () => {
    const service = await startService();
    try {
      if (service.context === null) throw new Error('fixture: no context');
      const todoId = await createTodo(service, 'Viele Buchungen');
      const MARKER = 'UralteLeistungSuchmarke';
      const base = Date.parse('2026-01-01T08:00:00Z');
      await service.context.transactions.inTransaction(async (unit) => {
        // The oldest booking of all carries the marker; 210 newer ones do not.
        await unit.timeEntries.create(
          { todoId: todoId as never, startedAt: new Date(base).toISOString().replace('.000Z', 'Z') as Timestamp, endedAt: new Date(base + 60_000).toISOString().replace('.000Z', 'Z') as Timestamp, note: MARKER },
          new Date(base).toISOString().replace('.000Z', 'Z') as Timestamp,
        );
        for (let i = 1; i <= 210; i += 1) {
          const start = base + i * 3_600_000;
          await unit.timeEntries.create(
            { todoId: todoId as never, startedAt: new Date(start).toISOString().replace('.000Z', 'Z') as Timestamp, endedAt: new Date(start + 60_000).toISOString().replace('.000Z', 'Z') as Timestamp, note: 'Gewöhnlicher Text' },
            new Date(start).toISOString().replace('.000Z', 'Z') as Timestamp,
          );
        }
      });

      const found = await call(service, 'GET', `/search?q=${MARKER}`);
      expect(found.status, found.text).toBe(200);
      const entries = (found.json as { data: { timeEntries: { note: string }[] } }).data.timeEntries;
      expect(entries.some((entry) => entry.note === MARKER)).toBe(true);
    } finally {
      service.database?.close();
    }
  });
});

describe('C-14 — GET /time-entries?tagId=&poolId=&hasNote= filters before the page limit', () => {
  it('combining a tag and hasNote narrows the total, not just the returned page', async () => {
    const service = await startService();
    try {
      const tagResponse = await call(service, 'POST', '/tags', { name: 'C14-Tag' });
      expect(tagResponse.status, tagResponse.text).toBe(201);
      const tagId = (tagResponse.json as { data: { id: string } }).data.id;

      const withTag = await createTodo(service, 'Mit Tag', [tagId]);
      const withoutTag = await createTodo(service, 'Ohne Tag');

      const book = async (todoId: string, note: string, hour: number) => {
        const startedAt = `2026-02-01T0${hour}:00:00Z`;
        const endedAt = `2026-02-01T0${hour}:30:00Z`;
        const response = await call(service, 'POST', '/time-entries', { todoId, startedAt, endedAt, note });
        expect(response.status, response.text).toBe(201);
      };
      await book(withTag, 'Mit Leistungstext', 1);
      await book(withTag, '', 2);
      await book(withoutTag, 'Mit Leistungstext', 3);

      const byTag = await call(service, 'GET', `/time-entries?tagId=${tagId}`);
      expect((byTag.json as { data: { total: number } }).data.total).toBe(2);

      const byHasNote = await call(service, 'GET', '/time-entries?hasNote=true');
      expect((byHasNote.json as { data: { total: number } }).data.total).toBe(2);

      // Combined and limited to one item: `total` still reports the FILTERED count (1), not the
      // count of all bookings, and not the page size — the filter runs before the limit.
      const combined = await call(service, 'GET', `/time-entries?tagId=${tagId}&hasNote=true&limit=1`);
      const combinedBody = (combined.json as { data: { total: number; items: unknown[] } }).data;
      expect(combinedBody.total).toBe(1);
      expect(combinedBody.items).toHaveLength(1);
    } finally {
      service.database?.close();
    }
  });
});
