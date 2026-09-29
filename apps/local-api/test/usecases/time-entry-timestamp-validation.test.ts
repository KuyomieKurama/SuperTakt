/**
 * Takt — N-3 (T-411a, E-136 point 3): `timestampSchema` refines its regex match with
 * `isExactTimestamp`, so a calendar date that does not exist answers 422 with a field error
 * instead of a 500 or a silently stored, non-canonical value. Driven through `compose()` +
 * `app.request()`, no port mocked.
 */
import { describe, expect, it } from 'vitest';
import { call, startService } from '../support/service.ts';

interface TodoJson {
  readonly id: string;
}

async function createTodo(service: Awaited<ReturnType<typeof startService>>): Promise<string> {
  const response = await call(service, 'POST', '/todos', { title: 'Zeitprüfung' });
  expect(response.status, response.text).toBe(201);
  return (response.json as { data: { todo: TodoJson } }).data.todo.id;
}

describe('N-3 — an impossible calendar date on POST /time-entries is rejected with 422, not 500', () => {
  it.each([
    ['2026-01-32T00:00:00Z', 'a day that does not exist in January'],
    ['2026-02-31T00:00:00Z', 'February never has 31 days'],
    ['2026-01-01T23:60:00Z', 'minute 60 does not exist'],
  ])('startedAt = %s (%s) answers 422 with a field error and books nothing', async (startedAt) => {
    const service = await startService();
    try {
      const todoId = await createTodo(service);
      const before = await call(service, 'GET', '/time-entries');
      const beforeTotal = (before.json as { data: { total: number } }).data.total;

      const response = await call(service, 'POST', '/time-entries', {
        todoId,
        startedAt,
        endedAt: '2026-03-01T00:00:00Z',
        note: '',
      });

      expect(response.status, response.text).toBe(422);
      const body = response.json as { error: { code: string; details: { field: string }[] } };
      expect(body.error.code).toBe('validation_error');
      expect(body.error.details.some((detail) => detail.field === 'startedAt')).toBe(true);

      const after = await call(service, 'GET', '/time-entries');
      expect((after.json as { data: { total: number } }).data.total).toBe(beforeTotal);
    } finally {
      service.database?.close();
    }
  });

  it('the same impossible date on PATCH /time-entries/:id is rejected and leaves the booking unchanged', async () => {
    const service = await startService();
    try {
      const todoId = await createTodo(service);
      const created = await call(service, 'POST', '/time-entries', {
        todoId,
        startedAt: '2026-03-01T08:00:00Z',
        endedAt: '2026-03-01T09:00:00Z',
        note: 'Ursprünglich',
      });
      expect(created.status, created.text).toBe(201);
      const entryId = (created.json as { data: { id: string } }).data.id;

      const response = await call(service, 'PATCH', `/time-entries/${entryId}`, {
        endedAt: '2026-02-31T00:00:00Z',
      });
      expect(response.status, response.text).toBe(422);

      const reloaded = await call(service, 'GET', `/time-entries/${entryId}`);
      expect(reloaded.status, reloaded.text).toBe(200);
      expect((reloaded.json as { data: { endedAt: string } }).data.endedAt).toBe('2026-03-01T09:00:00Z');
    } finally {
      service.database?.close();
    }
  });

  it('a real boundary timestamp (leap-free Feb 28, 23:59:59) is accepted', async () => {
    const service = await startService();
    try {
      const todoId = await createTodo(service);
      const response = await call(service, 'POST', '/time-entries', {
        todoId,
        startedAt: '2026-02-28T23:00:00Z',
        endedAt: '2026-02-28T23:59:59Z',
        note: '',
      });
      expect(response.status, response.text).toBe(201);
    } finally {
      service.database?.close();
    }
  });
});
