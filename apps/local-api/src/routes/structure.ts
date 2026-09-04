/**
 * Takt — Routen für Tags, Ordner, Pools und Kanban-Spalten
 * (A-3.*, A-4.*, A-5.*, A-9.*, A-10.4).
 *
 * `/tag-tree` liefert den **ganzen** Baum in einem Aufruf, beliebig tief
 * (A-4.3, A-10.4). Es gibt bewusst keine Route „Kinder von X" als
 * Hauptzugriff: Ein Aufruf je Ebene wäre genau das N+1, das die
 * Add-in-Anbindung unbenutzbar machte.
 *
 * `/tag-folders/{id}/move` ist eine eigene Route, weil eine fachliche Prüfung
 * daran hängt und ihr Fehlerfall ein eigener ist (A-4.6, `tag_folder_cycle`).
 * Als Feld in einem `PATCH` verschwände er zwischen den anderen.
 *
 * `/todo-statuses/order` nimmt die Reihenfolge **vollständig** entgegen, nicht
 * in Teilstücken — der eindeutige Index auf die Position bräche sonst mitten in
 * der Umsortierung.
 */

import { Hono } from 'hono';
import { z } from 'zod';

import type { PoolId, PoolTagTerm, StatusId, TagFolderId, TagId } from '@takt/domain';

import type { AppContext } from '../usecases/context.ts';
import {
  createPool,
  createStatus,
  createTag,
  createTagFolder,
  listPoolMembers,
  listPools,
  listStatuses,
  listTagsInFolder,
  loadTagTree,
  moveTagFolder,
  removePool,
  removeStatus,
  removeTag,
  removeTagFolder,
  renameTagFolder,
  reorderStatuses,
  updatePool,
  updateStatus,
  updateTag,
} from '../usecases/structure.ts';
import { data, fail, failValidation } from '../http/problem.ts';
import {
  colorSchema,
  idSchema,
  nameSchema,
  patchOf,
  readFlag,
  readJson,
  readPagination,
} from '../http/input.ts';
import type { TaktEnv } from '../http/guards.ts';

const tagCreateSchema = z.object({
  name: nameSchema,
  folderId: idSchema.nullish(),
  color: colorSchema.optional(),
});

const tagUpdateSchema = z.object({
  name: nameSchema.optional(),
  folderId: idSchema.nullish(),
  color: colorSchema.optional(),
});

/** Fragezeichenparameter von `GET /pools` (E-054). `all` ist keine Fläche, sondern der Verzicht auf den Filter. */
const poolListSchema = z.enum(['pool', 'board', 'all']);

const folderCreateSchema = z.object({ name: nameSchema, parentId: idSchema.nullish() });
const folderRenameSchema = z.object({ name: nameSchema });
const folderMoveSchema = z.object({ newParentId: idSchema.nullable() });

/**
 * Eine Tagliste einer Regel (T-076).
 *
 * Dieselbe Gestalt wie vor T-076 — ein Term ist ein Tag **oder** ein Ordner.
 * Was sich geändert hat, ist nicht der Term, sondern dass es zwei solche
 * Listen gibt: `rule` (erforderlich) und `excludedTags` (ausgeschlossen). Das
 * ist der Grund, warum hier **kein** dritter Fall für den Status steht: Der
 * Status ist keine Tagmenge und hat ein eigenes Feld.
 */
const poolTagListSchema = z.array(
  z.union([
    z.object({ kind: z.literal('tag'), tagId: idSchema }),
    z.object({ kind: z.literal('folder'), folderId: idSchema }),
  ]),
).max(200);

/**
 * Trägt die Marke an den Kennungen einer geprüften Termliste nach (T-089).
 *
 * Das Schema kennt nur `string`; `PoolTagTerm` verlangt `TagId` beziehungsweise
 * `TagFolderId`. Zwischen beidem liegt genau diese Funktion — und sie liegt
 * **außerhalb** der Routen, damit sie ihren Eingabetyp aus dem Schema ableiten
 * kann (`z.infer`): Ändert sich die Gestalt von `poolTagListSchema`, wird diese
 * Zeile rot, statt von einer Zusicherung überdeckt zu werden.
 *
 * Der Ersatz für `as never`. Eine Zusicherung auf `never` prüft nichts, weil
 * `never` an alles zuweisbar ist; sie sieht aus wie eine Markierung und ist
 * eine Abschaltung.
 */
const poolTerms = (terms: z.infer<typeof poolTagListSchema>): readonly PoolTagTerm[] =>
  terms.map((term) =>
    term.kind === 'tag'
      ? { kind: 'tag', tagId: term.tagId as TagId }
      : { kind: 'folder', folderId: term.folderId as TagFolderId },
  );

/**
 * Dasselbe für die Statusachse: Marke je Kennung, nicht über die Liste.
 *
 * `as readonly StatusId[]` über die ganze Liste lehnt `tsc` ab („neither type
 * sufficiently overlaps"), und das zu Recht — es wäre eine Aussage über eine
 * Menge statt über ihre Elemente. Genau deshalb stand hier vorher `as never`:
 * Die Zusicherung, die alles annimmt.
 */
const poolStatusIds = (ids: z.infer<typeof poolStatusListSchema>): readonly StatusId[] =>
  ids.map((id) => id as StatusId);

/**
 * Die Erledigt- und die Exportstatus-Achse (T-076).
 *
 * Dreiwertig mit `any` als **Neutralwert**, nicht zwei Wahrheitswerte
 * nebeneinander: Ein Feld, das „alle" sagen kann, braucht keinen zweiten, der
 * sagt, ob das erste gilt.
 */
const completionSchema = z.enum(['any', 'done', 'open']);
const exportStateSchema = z.enum(['any', 'open', 'exported']);

/**
 * Die Status einer Regel. Leer heißt „Alle" (T-076).
 *
 * Dieselbe Obergrenze wie bei den Taglisten, obwohl es nie mehr Status als
 * eine Handvoll gibt: Die Grenze schützt nicht vor dem Benutzer, sondern vor
 * einem Rumpf, der die Datenbank mit Fragezeichen überfährt.
 */
const poolStatusListSchema = z.array(idSchema).max(200);

/**
 * Wo die Regel erscheint (E-054).
 *
 * Vorgabe `pool`: Wer eine Regel anlegt, ohne eine Fläche zu nennen, legt einen
 * Pool an. Das ist dieselbe Vorgabe wie im Schema (Migration 0009) und dieselbe
 * Bedeutung, die eine Regel vor E-054 als einzige haben konnte — ein Aufrufer
 * aus der Zeit davor bekommt damit unverändert das, was er meinte.
 */
const placementSchema = z.enum(['pool', 'board', 'both']);

const poolCreateSchema = z.object({
  name: nameSchema,
  matchMode: z.enum(['any', 'all']).default('any'),
  includeSubfolders: z.boolean().default(true),
  placement: placementSchema.default('pool'),
  position: z.number().int().min(0).default(0),
  rule: poolTagListSchema.default([]),
  excludedTags: poolTagListSchema.default([]),
  statusIds: poolStatusListSchema.default([]),
  completion: completionSchema.default('any'),
  exportState: exportStateSchema.default('any'),
});

const poolUpdateSchema = z.object({
  name: nameSchema.optional(),
  matchMode: z.enum(['any', 'all']).optional(),
  includeSubfolders: z.boolean().optional(),
  placement: placementSchema.optional(),
  position: z.number().int().min(0).optional(),
  rule: poolTagListSchema.optional(),
  excludedTags: poolTagListSchema.optional(),
  statusIds: poolStatusListSchema.optional(),
  completion: completionSchema.optional(),
  exportState: exportStateSchema.optional(),
});

/**
 * Anlegen einer Spalte, **mit** Farbe (T-051).
 *
 * Bis T-051 stand hier nur `{ name, position }`, und die Oberfläche schickte
 * seit jeher `{ name, color }`. Zod streift unbekannte Schlüssel ab: kein 422,
 * keine Farbe, keine Meldung. Das ist dieselbe Bauart wie `nurOffene` aus
 * T-050 — etwas wird gesendet und niemand liest es —, und sie fiel `proof:callers`
 * am ersten Tag auf.
 *
 * Von den beiden möglichen Antworten (die Route nimmt es an, oder die
 * Oberfläche sendet es nicht) ist dies die richtige: Die Farbe war das einzige
 * Feld einer Spalte, das sich nur in einem **zweiten** Schritt setzen ließ.
 */
const statusCreateSchema = z.object({
  name: nameSchema,
  color: colorSchema.optional(),
  position: z.number().int().min(0).default(0),
});
const statusUpdateSchema = z.object({
  name: nameSchema.optional(),
  color: colorSchema.optional(),
  isDefault: z.boolean().optional(),
});
const statusOrderSchema = z.object({ order: z.array(idSchema).min(1).max(100) });

/** Rumpfschemata nach `operationId`; gelesen von `proof:openapi`, siehe `todos.ts`. */
export const REQUEST_SCHEMAS = Object.freeze({
  createTag: tagCreateSchema,
  updateTag: tagUpdateSchema,
  createTagFolder: folderCreateSchema,
  updateTagFolder: folderRenameSchema,
  moveTagFolder: folderMoveSchema,
  createPool: poolCreateSchema,
  updatePool: poolUpdateSchema,
  createTodoStatus: statusCreateSchema,
  updateTodoStatus: statusUpdateSchema,
  reorderTodoStatuses: statusOrderSchema,
});

export function createStructureRoutes(context: AppContext): {
  readonly tagTree: Hono<TaktEnv>;
  readonly tags: Hono<TaktEnv>;
  readonly folders: Hono<TaktEnv>;
  readonly pools: Hono<TaktEnv>;
  readonly statuses: Hono<TaktEnv>;
} {
  // ---------------------------------------------------------------------------
  const tagTree = new Hono<TaktEnv>();
  tagTree.get('/', async (c) => data(c, await loadTagTree(context)));

  // ---------------------------------------------------------------------------
  const tags = new Hono<TaktEnv>();

  tags.get('/', async (c) => {
    const folderId = c.req.query('folderId');
    const target = folderId === undefined || folderId === '' ? null : (folderId as TagFolderId);
    return data(c, await listTagsInFolder(context, target));
  });

  tags.post('/', async (c) => {
    const parsed = tagCreateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await createTag(
      context,
      (parsed.data.folderId ?? null) as TagFolderId | null,
      parsed.data.name,
      parsed.data.color ?? null,
    );
    if (!result.ok) return fail(c, result.error);
    c.header('Location', `/api/v1/tags/${result.value.id}`);
    return data(c, result.value, 201);
  });

  tags.patch('/:tagId', async (c) => {
    const parsed = tagUpdateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await updateTag(context, c.req.param('tagId') as TagId, {
      ...(parsed.data.name === undefined ? {} : { name: parsed.data.name }),
      ...(parsed.data.folderId === undefined
        ? {}
        : { folderId: (parsed.data.folderId ?? null) as TagFolderId | null }),
      ...(parsed.data.color === undefined ? {} : { color: parsed.data.color }),
    });
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  tags.delete('/:tagId', async (c) => {
    const result = await removeTag(context, c.req.param('tagId') as TagId);
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  // ---------------------------------------------------------------------------
  const folders = new Hono<TaktEnv>();

  folders.post('/', async (c) => {
    const parsed = folderCreateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await createTagFolder(
      context,
      (parsed.data.parentId ?? null) as TagFolderId | null,
      parsed.data.name,
    );
    if (!result.ok) return fail(c, result.error);
    c.header('Location', `/api/v1/tag-folders/${result.value.id}`);
    return data(c, result.value, 201);
  });

  folders.patch('/:folderId', async (c) => {
    const parsed = folderRenameSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await renameTagFolder(context, c.req.param('folderId') as TagFolderId, parsed.data.name);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  folders.delete('/:folderId', async (c) => {
    const result = await removeTagFolder(context, c.req.param('folderId') as TagFolderId);
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  /** A-4.6 — die Zyklusprüfung hängt hier, und ihr Fehlerfall ist `409`. */
  folders.post('/:folderId/move', async (c) => {
    const parsed = folderMoveSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await moveTagFolder(
      context,
      c.req.param('folderId') as TagFolderId,
      parsed.data.newParentId as TagFolderId | null,
    );
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  // ---------------------------------------------------------------------------
  const pools = new Hono<TaktEnv>();

  /**
   * Die Regeln einer Fläche (E-054).
   *
   * Ohne `?placement` die **Pool-Liste** — also das, was hier vor E-054 stand.
   * Eine Regel, die der Benutzer ausdrücklich nur auf das Board gestellt hat,
   * gehört nicht in die Pool-Navigation; sie hier stillschweigend
   * mitzuliefern, hieße, die Entscheidung des Benutzers zu übergehen.
   *
   *   (nichts)  → `placement` `pool` oder `both`
   *   `board`   → die Spalten des Kanban-Boards
   *   `all`     → jede Regel, für eine Verwaltung, die alle sehen will
   */
  pools.get('/', async (c) => {
    const parsed = poolListSchema.safeParse(c.req.query('placement') ?? 'pool');
    if (!parsed.success) return failValidation(c, issues(parsed.error));
    return data(c, await listPools(context, parsed.data));
  });

  pools.post('/', async (c) => {
    const parsed = poolCreateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    /*
     * **Ein Wert statt zehn Zeilen** (R-1, T-089).
     *
     * Bis T-089 zählte diese Stelle jedes Feld einzeln auf, und in `PoolInput`
     * sind die vier Achsen aus T-076 freiwillig. Eine Achse, die ins Schema und
     * in `PoolInput` kommt, hier aber vergessen wird, verschwände damit
     * **still**: nichts wird rot, die Spalte wird angelegt, sie trifft nur
     * etwas anderes. Genau diese Bauart hat T-050 (`nurOffene`) und T-051 (die
     * Farbe einer Spalte) gekostet — etwas wird gesendet, und niemand liest es.
     *
     * `PATCH` daneben reichte `parsed.data` seit jeher als Ganzes durch und
     * kann nichts vergessen. Der `POST` tut es jetzt auch: Was das Schema
     * annimmt, geht weiter, ohne dass es jemand abschreiben muss. Das ist eine
     * Wache des Übersetzers statt einer des Nachweispfads — `proof:openapi`
     * Abschnitt 12 bleibt trotzdem, es misst die andere Richtung (trifft die
     * angelegte Spalte danach das Richtige).
     *
     * Die drei markierten Listen stehen daneben, weil das Schema Zeichenketten
     * liefert und die Domäne markierte Kennungen erwartet. `as never` stand
     * hier vorher: eine Zusicherung, die nicht die Markierung nachträgt,
     * sondern **jede** Prüfung abschaltet — `never` ist an alles zuweisbar,
     * also fiele auch eine geänderte Gestalt von `poolTagListSchema` niemandem
     * auf. `poolTerms` und `as readonly StatusId[]` tun genau das eine, was
     * nötig ist, und nichts sonst.
     */
    const result = await createPool(context, {
      ...parsed.data,
      rule: poolTerms(parsed.data.rule),
      excludedTags: poolTerms(parsed.data.excludedTags),
      statusIds: poolStatusIds(parsed.data.statusIds),
    });
    // Bis T-074 stand hier ein `await createPool(...)` ohne Fehlerzweig: Der
    // eindeutige Index auf `pool.name` warf, niemand fing ihn, und die Antwort
    // war ein 500. Ein doppelter Name ist aber kein Fehler des Dienstes,
    // sondern eine Antwort an den Benutzer (T-072).
    if (!result.ok) return fail(c, result.error);
    c.header('Location', `/api/v1/pools/${result.value.id}`);
    return data(c, result.value, 201);
  });

  pools.patch('/:poolId', async (c) => {
    const parsed = poolUpdateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    /*
     * Dieselbe Markierung wie im `POST`, und aus demselben Grund kein
     * `as never` mehr (R-1). Die drei Listen sind die einzigen Felder, deren
     * Gestalt sich zwischen Schema und Domäne unterscheidet; alles andere geht
     * durch, wie es dasteht.
     *
     * `Partial<PoolInput>`: Was fehlt, bleibt, wie es ist — auch bei den
     * Listen. Deshalb wird jede von ihnen nur dann gesetzt, wenn sie im Rumpf
     * stand; ein `poolTerms(undefined)` machte aus „nicht genannt" eine leere
     * Liste und löschte damit die Regel, die der Aufrufer behalten wollte.
     */
    const { rule, excludedTags, statusIds, ...rest } = parsed.data;
    const result = await updatePool(
      context,
      c.req.param('poolId') as PoolId,
      patchOf({
        ...rest,
        ...(rule === undefined ? {} : { rule: poolTerms(rule) }),
        ...(excludedTags === undefined ? {} : { excludedTags: poolTerms(excludedTags) }),
        ...(statusIds === undefined ? {} : { statusIds: poolStatusIds(statusIds) }),
      }),
    );
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  pools.delete('/:poolId', async (c) => {
    const result = await removePool(context, c.req.param('poolId') as PoolId);
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  /**
   * Mitglieder — abgeleitet, nie gespeichert (A-3.4).
   *
   * `includeCompleted` ist der ausdrückliche Wunsch, erledigte Todos
   * einzublenden (E-039). Vorgabe ist `false`; genau deshalb erscheint ein Todo,
   * dessen „Erledigt" ein Timerstart aufgehoben hat, ohne Zutun wieder hier.
   */
  pools.get('/:poolId/todos', async (c) => {
    const result = await listPoolMembers(
      context,
      c.req.param('poolId') as PoolId,
      readFlag(c.req.query('includeCompleted')),
      readPagination(c.req.query()),
    );
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  // ---------------------------------------------------------------------------
  const statuses = new Hono<TaktEnv>();

  statuses.get('/', async (c) => data(c, await listStatuses(context)));

  statuses.post('/', async (c) => {
    const parsed = statusCreateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await createStatus(
      context,
      parsed.data.name,
      parsed.data.position,
      parsed.data.color ?? null,
    );
    if (!result.ok) return fail(c, result.error);
    c.header('Location', `/api/v1/todo-statuses/${result.value.id}`);
    return data(c, result.value, 201);
  });

  /** Vollständig, nicht in Teilstücken. Begründung im Kopf dieser Datei. */
  statuses.put('/order', async (c) => {
    const parsed = statusOrderSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await reorderStatuses(context, parsed.data.order as StatusId[]);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  statuses.patch('/:statusId', async (c) => {
    const parsed = statusUpdateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, issues(parsed.error));

    const result = await updateStatus(context, c.req.param('statusId') as StatusId, {
      ...(parsed.data.name === undefined ? {} : { name: parsed.data.name }),
      ...(parsed.data.color === undefined ? {} : { color: parsed.data.color }),
      ...(parsed.data.isDefault === undefined ? {} : { isDefault: parsed.data.isDefault }),
    });
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  statuses.delete('/:statusId', async (c) => {
    const result = await removeStatus(context, c.req.param('statusId') as StatusId);
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  return { tagTree, tags, folders, pools, statuses };
}

function issues(error: z.ZodError): { field: string; message: string; code: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.length === 0 ? '(rumpf)' : issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
