import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../../context.ts';
import { listPriorities, savePriority, removePriority } from './priorities.ts';
import type { TaktEnv } from '../../http/guards.ts';
import { nameSchema, readJson, toFieldErrors } from '../../http/input.ts';
import { data, fail, failValidation } from '../../http/problem.ts';
const input = z.object({ name: nameSchema.max(120), weight: z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER) }).strict();
export const REQUEST_SCHEMAS = { createPriority: input, updatePriority: input };
export function createPriorityRoutes(context: AppContext) {
  const routes = new Hono<TaktEnv>();
  routes.get('/', async c => data(c, await listPriorities(context)));
  routes.post('/', async c => {
    const parsed = input.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));
    const result = await savePriority(context, null, parsed.data.name, parsed.data.weight);
    return result.ok ? data(c, result.value, 201) : fail(c, result.error);
  });
  routes.put('/:id', async c => {
    const parsed = input.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));
    const result = await savePriority(context, c.req.param('id'), parsed.data.name, parsed.data.weight);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });
  routes.delete('/:id', async c => {
    const result = await removePriority(context, c.req.param('id'));
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });
  return routes;
}
