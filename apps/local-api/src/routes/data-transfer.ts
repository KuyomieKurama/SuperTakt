/** Eingehende Tür für Sicherung und Migration (A-20.*). */

import { Hono } from 'hono';
import { z } from 'zod';

import type { TaktEnv } from '../http/guards.ts';
import { readJson } from '../http/input.ts';
import { data, fail, failValidation } from '../http/problem.ts';
import type { AppContext } from '../usecases/context.ts';
import {
  exportDataArchive,
  importDataArchive,
  importSuperProductivity,
  importTodoist,
} from '../usecases/data-transfer.ts';

const todoistSchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1).max(260),
    content: z.string().max(16 * 1024 * 1024),
  })).min(1).max(200),
});
const archiveSchema = z.object({ archive: z.unknown() });
const superProductivitySchema = z.object({ backup: z.unknown(), excludeTransferred: z.boolean().default(true), callPattern: z.string().max(512).optional() });

export const REQUEST_SCHEMAS = Object.freeze({
  importDataArchive: archiveSchema,
  importTodoist: todoistSchema,
  importSuperProductivity: superProductivitySchema,
});

function issues(error: z.ZodError): readonly { field: string; message: string; code: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
    code: issue.code,
  }));
}

export function createDataTransferRoutes(context: AppContext): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  routes.get('/archive', async (c) => data(c, await exportDataArchive(context)));

  routes.post('/archive', async (c) => {
    const parsed = archiveSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));
    const result = await importDataArchive(context, parsed.data.archive);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.post('/todoist', async (c) => {
    const parsed = todoistSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));
    const result = await importTodoist(context, parsed.data.files);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.post('/super-productivity', async (c) => {
    const parsed = superProductivitySchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));
    const result = await importSuperProductivity(context, parsed.data.backup, parsed.data.excludeTransferred, parsed.data.callPattern);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  return routes;
}
