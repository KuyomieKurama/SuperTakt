/**
 * Schmale Add-in-Route für Outlook-Verweise an vorhandenen Todos.
 *
 * Der Aufgabenbereich darf damit **keine Datei** und kein Bild in den Bestand
 * schreiben. Akzeptiert wird ausschließlich ein http(s)-Verweis. Das reicht
 * für den Deep-Link auf die geöffnete Outlook-Nachricht und für Cloud-Anhänge,
 * die Office.js selbst als URL liefert.
 *
 * Der Vorgang ist idempotent: Derselbe normalisierte Verweis wird an demselben
 * Todo nur einmal angelegt. Ein Doppelklick oder ein Wiederholungsversuch nach
 * einer unsicheren Netzantwort erzeugt damit keinen zweiten Anhang.
 */

import { Hono } from 'hono';
import { z } from 'zod';

import type { TodoId } from '@takt/domain';
import { normalizeAttachmentLink, taktError } from '@takt/domain';

import { attachmentTitleSchema, attachmentUrlSchema, idSchema, readJson } from '../../http/input.ts';
import { data, fail, failValidation } from '../../http/problem.ts';
import type { TaktEnv } from '../../http/guards.ts';
import type { AddinDeps } from './ports.ts';

const linkSchema = z.object({
  url: attachmentUrlSchema,
  title: attachmentTitleSchema.nullish(),
});

const issues = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
    code: issue.code,
  }));

export function createAddinAttachmentRoutes(deps: AddinDeps): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  routes.post('/todos/:todoId/attachments', async (c) => {
    const parsedId = idSchema.safeParse(c.req.param('todoId'));
    if (!parsedId.success) return failValidation(c, issues(parsedId.error));

    const parsed = linkSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const normalized = normalizeAttachmentLink(parsed.data.url);
    if (!normalized.ok) {
      return failValidation(c, [
        {
          field: 'url',
          code: normalized.reason,
          message: 'Als Verweis sind ausschließlich gültige http- und https-Adressen zulässig.',
        },
      ]);
    }

    const todoId = parsedId.data as TodoId;
    const title = parsed.data.title?.trim() || null;
    const now = deps.now();

    const result = await deps.inTransaction(async (unit) => {
      const todo = await unit.todos.load(todoId);
      if (todo === null) {
        return { kind: 'not_found' as const };
      }

      const existing = (await unit.attachments.list(todoId)).find(
        (attachment) => attachment.kind === 'link' && attachment.target === normalized.url,
      );
      if (existing !== undefined) {
        return { kind: 'ok' as const, attachment: existing, alreadyPresent: true };
      }

      const created = await unit.attachments.create({
        todoId,
        kind: 'link',
        title,
        target: normalized.url,
        now,
      });
      return created.ok
        ? { kind: 'ok' as const, attachment: created.value, alreadyPresent: false }
        : { kind: 'failed' as const, error: created.error };
    });

    if (result.kind === 'not_found') {
      return fail(c, taktError('not_found', 'Dieses Todo gibt es nicht.'));
    }
    if (result.kind === 'failed') {
      return fail(c, result.error);
    }

    return data(
      c,
      {
        attachment: {
          id: result.attachment.id,
          todoId: result.attachment.todoId,
          kind: result.attachment.kind,
          title: result.attachment.title,
          target: result.attachment.target,
        },
        alreadyPresent: result.alreadyPresent,
      },
      result.alreadyPresent ? 200 : 201,
    );
  });

  return routes;
}
