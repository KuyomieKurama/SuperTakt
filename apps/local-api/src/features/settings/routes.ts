/**
 * Takt — Routen für Einstellungen und Standard-Tags
 * (A-9.1, A-9.2, A-18.10, E-011, R-20).
 *
 * Der Exportordner wird beim Setzen geprüft und bei einem Fehlschlag
 * **abgewiesen** statt gespeichert; die Begründung steht am Anwendungsfall in
 * `settings.ts` nebenan.
 */

import { Hono } from 'hono';
import { z } from 'zod';

import type { ExportTemplateId, TagId } from '@takt/domain';
import { DESIGN_THEMES, RELEASE_TAG_SHAPE, VERSION_MAX_LENGTH } from '@takt/domain';

import type { AppContext } from '../../context.ts';
import { data, fail, failValidation } from '../../http/problem.ts';
import { idSchema, readJson, toFieldErrors } from '../../http/input.ts';
import type { TaktEnv } from '../../http/guards.ts';
import { listDefaultTags, loadSettings, setDefaultTags, updateSettings } from './settings.ts';

const settingsSchema = z.object({
  exportDirectory: z.string().max(4096).nullish(),
  activeExportTemplateId: idSchema.nullish(),
  roundingMode: z.enum(['up', 'nearest']).optional(),
  locale: z.string().min(2).max(35).optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  designTheme: z.enum(DESIGN_THEMES).optional(),
  density: z.enum(['comfortable', 'compact']).optional(),
  promptOnTimerStop: z.boolean().optional(),
  idleDetectionEnabled: z.boolean().optional(),
  idleKeepTimerRunning: z.boolean().optional(),
  idleThresholdMinutes: z.number().int().min(1).max(120).optional(),
  /**
   * Die übersprungene Fassung (A-18.10, R-20). `null` setzt sie zurück.
   *
   * Die Form kommt aus `packages/domain` und wird hier **nicht** abgeschrieben:
   * `RELEASE_TAG_SHAPE` ist derselbe Ausdruck, mit dem `checkVersion` urteilt,
   * nur mit erlaubtem führendem `v`. Ein eigener Ausdruck an dieser Tür wäre
   * eine zweite Meinung darüber, was eine Fassung ist — und die eine, die
   * versehentlich weiter wäre als die andere.
   *
   * Die Länge ist hier ausdrücklich beschrieben, weil ein Aufrufer sonst in
   * ein 422 liefe, das niemand angekündigt hat (`proof:openapi` Abschnitt 3
   * misst genau das).
   */
  skippedVersion: z.string().max(VERSION_MAX_LENGTH + 1).regex(RELEASE_TAG_SHAPE).nullish(),
});

const defaultTagsSchema = z.object({ tagIds: z.array(idSchema).max(100) });

/** Rumpfschemata nach `operationId`; gelesen von `proof:openapi`, siehe `todos.ts`. */
export const REQUEST_SCHEMAS = Object.freeze({
  updateSettings: settingsSchema,
  setDefaultTags: defaultTagsSchema,
});

export function createSettingsRoutes(context: AppContext): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  /**
   * Das Add-in-Token ist **nicht** Teil der Einstellungen (E-009).
   *
   * Es liegt in einer eigenen Datei im Anwendungsdatenverzeichnis und hat eine
   * eigene Route, die nur mit dem Sitzungsgeheimnis erreichbar ist. Stünde es
   * hier, käme es mit jeder Einstellungsabfrage über die Leitung.
   */
  routes.get('/', async (c) => data(c, await loadSettings(context)));

  routes.patch('/', async (c) => {
    const parsed = settingsSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await updateSettings(context, {
      ...(parsed.data.exportDirectory === undefined
        ? {}
        : { exportDirectory: parsed.data.exportDirectory ?? null }),
      ...(parsed.data.activeExportTemplateId === undefined
        ? {}
        : {
            activeExportTemplateId: (parsed.data.activeExportTemplateId ?? null) as ExportTemplateId | null,
          }),
      ...(parsed.data.roundingMode === undefined ? {} : { roundingMode: parsed.data.roundingMode }),
      ...(parsed.data.locale === undefined ? {} : { locale: parsed.data.locale }),
      ...(parsed.data.theme === undefined ? {} : { theme: parsed.data.theme }),
      ...(parsed.data.designTheme === undefined ? {} : { designTheme: parsed.data.designTheme }),
      ...(parsed.data.density === undefined ? {} : { density: parsed.data.density }),
      ...(parsed.data.promptOnTimerStop === undefined ? {} : { promptOnTimerStop: parsed.data.promptOnTimerStop }),
      ...(parsed.data.idleKeepTimerRunning === undefined ? {} : { idleKeepTimerRunning: parsed.data.idleKeepTimerRunning }),
      ...(parsed.data.idleDetectionEnabled === undefined ? {} : { idleDetectionEnabled: parsed.data.idleDetectionEnabled }),
      ...(parsed.data.idleThresholdMinutes === undefined ? {} : { idleThresholdMinutes: parsed.data.idleThresholdMinutes }),
      // `null` heißt „nichts übersprungen" und ist damit ein Wert; nur ein
      // fehlendes Feld heißt „unverändert" (A-18.10).
      ...(parsed.data.skippedVersion === undefined
        ? {}
        : { skippedVersion: parsed.data.skippedVersion ?? null }),
    });
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  /** A-9.1, A-9.2 — Standard-Tags. Sie greifen im Anwendungsfall, nicht hier. */
  routes.get('/default-tags', async (c) => data(c, await listDefaultTags(context)));

  routes.put('/default-tags', async (c) => {
    const parsed = defaultTagsSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    return data(c, await setDefaultTags(context, parsed.data.tagIds as TagId[]));
  });

  return routes;
}
