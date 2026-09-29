/**
 * Takt — A-28.3 `PUT /pools/order` and O-D's `requiredTags`/`rule` alias (T-397, T-401c).
 *
 * Driven through `compose()` + `app.request()` (no port mocked) so this measures the actual
 * route wiring, not just `reorderPools`/`createPool` in isolation.
 */
import { describe, expect, it } from 'vitest';
import { call, startService } from '../support/service.ts';

async function createPool(service: Awaited<ReturnType<typeof startService>>, name: string): Promise<string> {
  const response = await call(service, 'POST', '/pools', { name, placement: 'pool', requiredTags: [] });
  expect(response.status, response.text).toBe(201);
  return (response.json as { data: { id: string } }).data.id;
}

describe('A-28.3 — PUT /pools/order', () => {
  it('a complete order is accepted and applied; a partial order (missing one id) is rejected as a whole', async () => {
    const service = await startService();
    try {
      const a = await createPool(service, 'Pool A');
      const b = await createPool(service, 'Pool B');
      const c = await createPool(service, 'Pool C');

      const complete = await call(service, 'PUT', '/pools/order', { order: [c, a, b] });
      expect(complete.status, complete.text).toBe(200);
      const reordered = (complete.json as { data: { id: string }[] }).data;
      expect(reordered.map((pool) => pool.id)).toEqual([c, a, b]);

      const partial = await call(service, 'PUT', '/pools/order', { order: [a, b] });
      expect(partial.status).toBe(422);

      // A rejected, partial order changes nothing — the order from the successful call stands.
      const listAfter = await call(service, 'GET', '/pools');
      const idsInOrder = (listAfter.json as { data: { id: string }[] }).data
        .slice()
        .sort((x, y) => reordered.findIndex((p) => p.id === x.id) - reordered.findIndex((p) => p.id === y.id));
      expect(idsInOrder.map((pool) => pool.id)).toEqual([c, a, b]);
    } finally {
      service.database?.close();
    }
  });
});

describe('O-D — requiredTags/rule alias on /pools', () => {
  it('a created pool answers with requiredTags and rule carrying the same value', async () => {
    const service = await startService();
    try {
      const response = await call(service, 'POST', '/pools', { name: 'Mit Regel', placement: 'pool', requiredTags: [] });
      expect(response.status, response.text).toBe(201);
      const body = (response.json as { data: { requiredTags: unknown; rule: unknown } }).data;
      expect(body.requiredTags).toEqual(body.rule);
    } finally {
      service.database?.close();
    }
  });

  it('naming both requiredTags and rule at once is rejected with a 422 on the requiredTags field', async () => {
    const service = await startService();
    try {
      const response = await call(service, 'POST', '/pools', {
        name: 'Zweideutig', placement: 'pool', requiredTags: [], rule: [],
      });
      expect(response.status).toBe(422);
      const body = response.json as { error: { details?: { field: string }[] } };
      expect(body.error.details?.some((detail) => detail.field === 'requiredTags')).toBe(true);
    } finally {
      service.database?.close();
    }
  });
});
