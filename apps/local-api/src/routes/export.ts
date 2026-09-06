/**
 * Takt — Routen für Export, Vorlagen und Einstellungen
 * (A-8.*, A-9.*, E-005, E-011, E-034, R-10, R-17).
 *
 * `POST /export/runs` ist die eine Route, an der Geld hängt. Sie ist
 * **transaktional** (A-8.8): entweder Datei geschrieben und alle enthaltenen
 * Buchungen markiert, oder nichts. Der Ablauf steht in
 * `usecases/export.ts`; hier steht nur die Übersetzung in Statuscodes.
 *
 * `POST /export/preview` schreibt nichts und benutzt **denselben** Plan wie der
 * Lauf (R-17). Zwei Wege wären genau an der Stelle blind, für die die Vorschau
 * da ist.
 */

import { Hono } from 'hono';
import { z } from 'zod';

import type { ExportRunId, ExportTemplateId, TimeEntryId } from '@takt/domain';
import { RELEASE_TAG_SHAPE, VERSION_MAX_LENGTH } from '@takt/domain';

import type { AppContext } from '../usecases/context.ts';
import { previewExport, runExport, type ExportPreviewTemplate } from '../usecases/export.ts';
import { exportSourceCatalog } from '../usecases/export-catalog.ts';
import {
  createTemplate,
  listExportAudit,
  listExportRuns,
  listTemplates,
  loadExportRun,
  loadSettings,
  removeTemplate,
  updateSettings,
  updateTemplate,
} from '../usecases/structure.ts';
import { listDefaultTags, setDefaultTags } from '../usecases/todos.ts';
import { data, fail, failValidation } from '../http/problem.ts';
import { idSchema, nameSchema, readJson, readPagination } from '../http/input.ts';
import type { TaktEnv } from '../http/guards.ts';
import type { TagId } from '@takt/domain';

const runSchema = z.object({
  templateId: idSchema.nullish(),
  /** Leer bedeutet: alle offenen Buchungen (siehe `ExportJob` in der Domäne). */
  timeEntryIds: z.array(idSchema).max(20_000).default([]),
});

/**
 * Die Vorschau nimmt zusätzlich eine ungespeicherte Definition entgegen
 * (E-051).
 *
 * `definition` ist hier `z.unknown()` und nicht ausbuchstabiert — aus demselben
 * Grund wie beim Anlegen einer Vorlage: Die Gestalt einer Vorlage gehört dem
 * Motor in `packages/export`, und `validateExportTemplateDefinition` ist die
 * eine Stelle, die sie prüft. Ein zweites Schema hier wäre eine zweite
 * Wahrheit — und die Vorschau soll genau das nicht sein.
 */
const previewSchema = z.object({
  templateId: idSchema.nullish(),
  /**
   * `.optional()` ausgeschrieben: In zod 4 macht `z.unknown()` einen Schlüssel
   * **nicht** mehr von selbst weglassbar — ohne diesen Zusatz wiese die Route
   * jeden Rumpf ohne `definition` ab, also jeden bisherigen Aufruf.
   */
  definition: z.unknown().optional(),
  timeEntryIds: z.array(idSchema).max(20_000).default([]),
});

/** Trägt der Rumpf den Schlüssel — unabhängig davon, was darin steht? */
function hasKey(body: unknown, key: string): boolean {
  return typeof body === 'object' && body !== null && !Array.isArray(body) && Object.hasOwn(body, key);
}

const templateCreateSchema = z.object({ name: nameSchema, definition: z.unknown() });
const templateUpdateSchema = z.object({ name: nameSchema.optional(), definition: z.unknown().optional() });

const settingsSchema = z.object({
  exportDirectory: z.string().max(4096).nullish(),
  activeExportTemplateId: idSchema.nullish(),
  roundingMode: z.enum(['up', 'nearest']).optional(),
  locale: z.string().min(2).max(35).optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
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
  createExportTemplate: templateCreateSchema,
  updateExportTemplate: templateUpdateSchema,
  previewExport: previewSchema,
  runExport: runSchema,
  updateSettings: settingsSchema,
  setDefaultTags: defaultTagsSchema,
});

export function createExportRoutes(context: AppContext): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  // -------------------------------------------------------------------------
  // Vorlagen (A-8.7)
  // -------------------------------------------------------------------------
  routes.get('/templates', async (c) => data(c, await listTemplates(context)));

  routes.post('/templates', async (c) => {
    const parsed = templateCreateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await createTemplate(context, parsed.data.name, parsed.data.definition);
    if (!result.ok) return fail(c, result.error);
    c.header('Location', `/api/v1/export/templates/${result.value.id}`);
    return data(c, result.value, 201);
  });

  routes.patch('/templates/:templateId', async (c) => {
    const parsed = templateUpdateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await updateTemplate(
      context,
      c.req.param('templateId') as ExportTemplateId,
      parsed.data.name,
      parsed.data.definition,
    );
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.delete('/templates/:templateId', async (c) => {
    const result = await removeTemplate(context, c.req.param('templateId') as ExportTemplateId);
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  // -------------------------------------------------------------------------
  // Die Auswahlliste (E-049, E-017) — reine Auskunft, ohne Bestand
  // -------------------------------------------------------------------------

  /**
   * Damit die Oberfläche **fragt**, statt zu wissen.
   *
   * Die Liste der Feldquellen stand bis E-049 zweimal: im Motor und noch
   * einmal in `apps/web`, weil dort `@takt/export` nicht eingebunden werden
   * darf. Eine Paketabhängigkeit wäre der falsche Weg gewesen — die
   * Oberfläche bräuchte das Paket sonst nirgends. Eine Auskunft des Dienstes
   * ist es, also gibt der Dienst sie heraus.
   *
   * Ohne Parameter, ohne Bestand, für jeden Aufruf dieselbe Antwort.
   */
  routes.get('/sources', (c) => data(c, exportSourceCatalog()));

  // -------------------------------------------------------------------------
  // Vorschau (R-17, E-051) — schreibt nichts
  // -------------------------------------------------------------------------
  routes.post('/preview', async (c) => {
    const body = await readJson(c.req.raw);
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    // **Der Schlüssel entscheidet, nicht sein Wert.** Ein `definition: null`
    // gilt als Entwurf und läuft in dieselbe Ablehnung wie beim Speichern
    // („Die Vorlage muss ein Objekt sein"). Würde `null` hier als „nicht
    // angegeben" gelesen, zeigte die Vorschau stillschweigend die gespeicherte
    // Vorlage — und der Benutzer sähe ein Ergebnis zu etwas, das er nicht
    // geschickt hat.
    const draft = hasKey(body, 'definition');
    const named = parsed.data.templateId !== undefined && parsed.data.templateId !== null;

    if (draft && named) {
      // Nicht auflösen, sondern abweisen. Welche der beiden Angaben gewinnt,
      // wäre eine Regel, die niemand entschieden hat — und die Vorschau ist
      // die Route, bei der Zweifel am gezeigten Stand am teuersten sind.
      return failValidation(
        c,
        [
          {
            field: 'definition',
            message: 'Entweder eine Vorlagenkennung oder eine Definition, nicht beides.',
            code: 'exclusive',
          },
        ],
        'Die Vorschau nimmt entweder „templateId" oder „definition" entgegen, nicht beides.',
      );
    }

    const template: ExportPreviewTemplate = draft
      ? { kind: 'draft', definition: parsed.data.definition }
      : { kind: 'stored', templateId: (parsed.data.templateId ?? null) as ExportTemplateId | null };

    const result = await previewExport(context, template, parsed.data.timeEntryIds as TimeEntryId[]);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  // -------------------------------------------------------------------------
  // Der Lauf (A-8.8)
  // -------------------------------------------------------------------------
  routes.get('/runs', async (c) => data(c, await listExportRuns(context, readPagination(c.req.query()))));

  routes.post('/runs', async (c) => {
    const body = await readJson(c.req.raw);
    const parsed = runSchema.safeParse(body);
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    /**
     * Ein Lauf gegen einen ungespeicherten Entwurf gibt es nicht (E-051).
     *
     * Die Ablehnung ist ausdrücklich, weil zod unbekannte Schlüssel sonst
     * **still** wegwirft: Wer `definition` an diese Route schickt, bekäme eine
     * Datei aus der aktiven Vorlage und hielte sie für sein Ergebnis. Der
     * Grund für das Verbot steht in `recordRun` — jeder Lauf legt einen Abzug
     * der Vorlage ab, damit sich später feststellen lässt, welche Felder in
     * der Abrechnung gelandet sind. Ein Abzug ohne Vorlage wäre ein Beleg auf
     * etwas, das nie existiert hat.
     */
    if (hasKey(body, 'definition')) {
      return failValidation(
        c,
        [
          {
            field: 'definition',
            message: 'Ein Exportlauf läuft nur gegen eine gespeicherte Vorlage.',
            code: 'unsupported',
          },
        ],
        'Ein Exportlauf nimmt keine Definition entgegen. Speichern Sie die Vorlage, oder benutzen Sie die Vorschau.',
      );
    }

    const result = await runExport(context, {
      templateId: (parsed.data.templateId ?? null) as ExportTemplateId | null,
      timeEntryIds: parsed.data.timeEntryIds as TimeEntryId[],
    });
    if (!result.ok) return fail(c, result.error);

    c.header('Location', `/api/v1/export/runs/${result.value.run.id}`);
    // Die ausgelassenen Gruppen (E-034) stehen in derselben Antwort. Der Lauf
    // ist erfolgreich, und trotzdem ist etwas offen geblieben — der Benutzer
    // erfährt es hier und nicht erst beim nächsten Mal.
    return data(c, result.value, 201);
  });

  routes.get('/runs/:runId', async (c) => {
    const result = await loadExportRun(context, c.req.param('runId') as ExportRunId);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  // -------------------------------------------------------------------------
  // Protokoll (R-10)
  // -------------------------------------------------------------------------
  /**
   * Das Protokoll, gefiltert (R-10, T-042).
   *
   * `exportRunId` beantwortet „welche Buchungen waren in diesem Lauf?" —
   * vollständig und nicht nur so weit, wie gerade geladen ist. Vorher gab es
   * die Frage nur als Sieb über die geladene Seite; ein Lauf mit mehr
   * Buchungen, als eine Seite fasst, verdrängt jeden älteren daraus, und der
   * Knopf landete gerade bei den großen Läufen im Leerzustand.
   *
   * Beide Parameter dürfen zusammen stehen und wirken dann mit `und`.
   */
  routes.get('/audit', async (c) => {
    const timeEntryId = c.req.query('timeEntryId');
    const exportRunId = c.req.query('exportRunId');
    return data(
      c,
      await listExportAudit(
        context,
        {
          ...(timeEntryId === undefined || timeEntryId === ''
            ? {}
            : { timeEntryId: timeEntryId as TimeEntryId }),
          ...(exportRunId === undefined || exportRunId === ''
            ? {}
            : { exportRunId: exportRunId as ExportRunId }),
        },
        readPagination(c.req.query()),
      ),
    );
  });

  return routes;
}

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
    if (!parsed.success) return failValidation(c, issues(parsed.error));

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
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    return data(c, await setDefaultTags(context, parsed.data.tagIds as TagId[]));
  });

  return routes;
}

function issues(error: z.ZodError): { field: string; message: string; code: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.length === 0 ? '(rumpf)' : issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
