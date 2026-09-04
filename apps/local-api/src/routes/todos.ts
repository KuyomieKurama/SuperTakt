/**
 * Takt — Routen für Todos, Vermerk und Erledigt-Kennzeichen
 * (A-2.*, A-5.*, A-7.1, A-7.2, architektur.md 5.1).
 *
 * `/todos/{id}/done` ist eine **eigene Ressource** und kein Feld: `PUT` setzt
 * erledigt, `DELETE` hebt es auf. Der Vorgang hat eine eigene Bedeutung (A-2.4,
 * I-03), und er hat einen eigenen Fehlerfall.
 *
 * `/todos/{id}/note` ist ebenfalls eine eigene Ressource — und das ist die
 * vierte Schicht der Notiz-Trennung (architektur.md 4). Der Vermerk hängt an
 * keiner Todo-Antwort. Wer ihn will, fragt ihn ausdrücklich, und dieser Aufruf
 * ist im Quelltext auffindbar.
 *
 * Diese Datei enthält keine Fachregel. Sie liest die Anfrage, prüft ihre
 * Gestalt, ruft einen Anwendungsfall und übersetzt dessen Ergebnis.
 */

import { Hono } from 'hono';
import { z } from 'zod';

import type { PoolId, PoolMovement, StatusId, TagId, Todo, TodoId } from '@takt/domain';

import type { AppContext } from '../usecases/context.ts';
import {
  type TodoDoneResult,
  clearTodoDone,
  createTodo,
  listTodos,
  loadTodo,
  loadTodoNote,
  markTodoDone,
  removeTodo,
  searchEverything,
  updateTodo,
  writeTodoNote,
} from '../usecases/todos.ts';
import { data, fail, failValidation } from '../http/problem.ts';
import {
  commaSeparatedIds,
  idSchema,
  nameSchema,
  readFlag,
  readJson,
  readPagination,
  textSchema,
  titleSchema,
} from '../http/input.ts';
import type { TaktEnv } from '../http/guards.ts';

const createSchema = z.object({
  title: titleSchema,
  callNumber: z.string().trim().max(64).nullish(),
  statusId: idSchema.nullish(),
  tagIds: z.array(idSchema).max(200).default([]),
  /**
   * Tags über ihren **Namen** statt über eine Kennung (T-058).
   *
   * Der Fall aus dem Anlegedialog: Der Benutzer tippt „backend“, und das Tag
   * gibt es noch nicht. Der Dienst legt es an und hängt das Todo daran — in
   * derselben Transaktion, siehe `createTodo`.
   *
   * Die Obergrenze ist bewusst viel kleiner als die von `tagIds`: Kennungen
   * kommen aus einer Auswahl, Namen aus einem Eingabefeld. Fünfzig neue Tags in
   * einer Anfrage sind kein Arbeitsablauf, sondern ein Skript.
   */
  tagNames: z.array(nameSchema).max(50).default([]),
  /** Der interne Vermerk (A-7.1). Nicht die Leistung einer Buchung (A-7.3). */
  note: textSchema.default(''),
});

const updateSchema = z.object({
  title: titleSchema.optional(),
  callNumber: z.string().trim().max(64).nullish(),
  statusId: idSchema.optional(),
  tagIds: z.array(idSchema).max(200).optional(),
});

const noteSchema = z.object({ text: textSchema });

/**
 * Die drei kommagetrennten Kennungslisten von `GET /todos` (R-3 S-2).
 *
 * ---------------------------------------------------------------------------
 * Was hier vorher stand und was es gekostet hat
 * ---------------------------------------------------------------------------
 *
 * `poolIds.split(',') as never` — kein Schema, keine Anzahlgrenze, keine
 * Prüfung gegen `idSchema`. Injektion war ausgeschlossen (die Übersetzung nach
 * SQL setzt ausschließlich Platzhalter, R-3 Abschnitt 3), aber die Kosten
 * standen frei: Der security-checker hat 200-mal dieselbe Poolkennung genannt
 * und **8 370 ms** je Anfrage gemessen — bei einem einfädigen Sidecar sind das
 * acht Sekunden stehende Oberfläche und ein Lebenszeichen des Timers, das nicht
 * kommt (E-036). Ab 1 000 Kennungen überschritt die ODER-Verkettung
 * `SQLITE_MAX_EXPR_DEPTH` und die Antwort war ein **500** — „bei mir ist etwas
 * kaputt", wo „das geht so nicht" richtig gewesen wäre.
 *
 * ---------------------------------------------------------------------------
 * Warum die Grenze bei 50 liegt
 * ---------------------------------------------------------------------------
 *
 * Weil sie **über** jedem Arbeitsablauf und **weit unter** der Schwelle liegt,
 * an der die Antwort teuer wird.
 *
 * Darüber: Die Kennungen kommen aus einer Auswahl, nicht aus einem
 * Eingabefeld. Fünfzig gleichzeitig gewählte Pools sind kein Filter mehr,
 * sondern eine Liste ohne Filter; fünfzig Status gibt es in keinem Bestand,
 * und für Tags ist die Auswahl in der Oberfläche eine Handvoll. Dieselbe Zahl
 * steht schon bei `tagNames` beim Anlegen, mit derselben Begründung.
 *
 * Darunter: Die 8,4 Sekunden waren bei 200 Poolkennungen gemessen, und die
 * Kosten wachsen mit der Zahl der Kennungen mal der Tiefe der Ordnerbäume. Bei
 * 50 bleibt davon rund ein Viertel, und die 500 aus der Ausdrucksbaumgrenze ist
 * um den Faktor 20 außer Reichweite.
 *
 * Die Antwort auf eine zu lange Liste ist damit `422` mit Feldangabe statt
 * `500` — der Aufrufer erfährt, dass **er** zu viel verlangt hat.
 *
 * `.min(1)` je Eintrag steckt in `idSchema`: `?poolId=` allein ergäbe sonst
 * eine Liste mit einer leeren Kennung, und die trifft nichts, kostet aber eine
 * Abfrage.
 */
const idListSchema = z.object({
  statusId: commaSeparatedIds.optional(),
  tagId: commaSeparatedIds.optional(),
  poolId: commaSeparatedIds.optional(),
});

/**
 * Die Rumpfschemata dieser Datei, nach `operationId` der OpenAPI-Beschreibung.
 *
 * Der einzige Leser ist `scripts/proof-openapi.mjs`: Er wandelt jedes Schema
 * nach JSON Schema und hält es gegen das, was
 * `apps/local-api/openapi/takt-local-api.yaml` über denselben Rumpf behauptet.
 * Wer hier eine Route mit Rumpf hinzufügt und den Eintrag vergisst, bekommt
 * keinen stillen blinden Fleck, sondern einen roten Nachweispfad — die
 * Beschreibung führt dann eine Anfrage, für die es kein Schema gibt.
 *
 * Deshalb steht hier eine Zuordnung und keine Sammlung einzelner `export`:
 * Der Schlüssel ist die `operationId`, und ein Schlüssel ohne Gegenstück auf
 * der einen oder anderen Seite fällt auf.
 */
export const REQUEST_SCHEMAS = Object.freeze({
  createTodo: createSchema,
  updateTodo: updateSchema,
  putTodoNote: noteSchema,
});

export function createTodoRoutes(context: AppContext): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  routes.get('/', async (c) => {
    const query = c.req.query();

    const filters = idListSchema.safeParse({
      statusId: query['statusId'],
      tagId: query['tagId'],
      poolId: query['poolId'],
    });
    if (!filters.success) return failValidation(c, toIssues(filters.error));

    const { statusId: statusIds, tagId: tagIds, poolId: poolIds } = filters.data;

    const page = await listTodos(
      context,
      {
        ...(query['search'] === undefined ? {} : { search: query['search'] }),
        ...(query['callNumber'] === undefined ? {} : { callNumber: query['callNumber'] }),
        ...(statusIds === undefined ? {} : { statusIds: statusIds as StatusId[] }),
        ...(tagIds === undefined ? {} : { tagIds: tagIds as TagId[] }),
        ...(poolIds === undefined ? {} : { poolIds: poolIds as PoolId[] }),
        ...(readFlag(query['onlyOpen']) ? { onlyOpen: true } : {}),
        ...(readFlag(query['onlyWithOpenEntries']) ? { onlyWithOpenEntries: true } : {}),
      },
      readPagination(query),
    );

    return data(c, page);
  });

  routes.post('/', async (c) => {
    const parsed = createSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toIssues(parsed.error));

    const result = await createTodo(context, {
      title: parsed.data.title,
      callNumber: parsed.data.callNumber ?? null,
      statusId: (parsed.data.statusId ?? null) as StatusId | null,
      tagIds: parsed.data.tagIds as TagId[],
      tagNames: parsed.data.tagNames,
      note: parsed.data.note,
    });
    if (!result.ok) return fail(c, result.error);

    c.header('Location', `/api/v1/todos/${result.value.todo.id}`);
    return data(c, result.value, 201);
  });

  routes.get('/:todoId', async (c) => {
    const result = await loadTodo(context, c.req.param('todoId') as TodoId);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.patch('/:todoId', async (c) => {
    const parsed = updateSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toIssues(parsed.error));

    const result = await updateTodo(context, c.req.param('todoId') as TodoId, {
      ...(parsed.data.title === undefined ? {} : { title: parsed.data.title }),
      ...(parsed.data.callNumber === undefined ? {} : { callNumber: parsed.data.callNumber ?? null }),
      ...(parsed.data.statusId === undefined ? {} : { statusId: parsed.data.statusId as StatusId }),
      ...(parsed.data.tagIds === undefined ? {} : { tagIds: parsed.data.tagIds as TagId[] }),
    });
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.delete('/:todoId', async (c) => {
    const result = await removeTodo(context, c.req.param('todoId') as TodoId);
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  // -------------------------------------------------------------------------
  // Der interne Vermerk (A-7.1, A-7.2). Eigene Ressource, eigener Aufruf.
  // -------------------------------------------------------------------------
  routes.get('/:todoId/note', async (c) => {
    const result = await loadTodoNote(context, c.req.param('todoId') as TodoId);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.put('/:todoId/note', async (c) => {
    const parsed = noteSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toIssues(parsed.error));

    const result = await writeTodoNote(context, c.req.param('todoId') as TodoId, parsed.data.text);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  // -------------------------------------------------------------------------
  // Erledigt (A-2.4, A-2.5)
  // -------------------------------------------------------------------------
  routes.put('/:todoId/done', async (c) => {
    const result = await markTodoDone(context, c.req.param('todoId') as TodoId);
    return result.ok ? data(c, doneBody(result.value)) : fail(c, result.error);
  });

  routes.delete('/:todoId/done', async (c) => {
    const result = await clearTodoDone(context, c.req.param('todoId') as TodoId);
    return result.ok ? data(c, doneBody(result.value)) : fail(c, result.error);
  });

  return routes;
}

/**
 * E-038 — die globale Suche trifft auch Zeitbuchungen.
 *
 * Eigene Route und nicht ein Parameter auf `/todos`: Das Ergebnis hat eine
 * andere Gestalt (zwei Listen), und wer beides über denselben Pfad ausgäbe,
 * müsste die Antwort je nach Parameter anders lesen.
 */
export function createSearchRoutes(context: AppContext): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  routes.get('/', async (c) => {
    const term = c.req.query('q') ?? '';
    const checked = nameSchema.safeParse(term);
    if (!checked.success) return failValidation(c, toIssues(checked.error), 'Ein Suchbegriff fehlt.');

    return data(c, await searchEverything(context, checked.data, readPagination(c.req.query())));
  });

  return routes;
}

/**
 * Der Antwortrumpf von `PUT` und `DELETE /todos/{todoId}/done` (E-060).
 *
 * ---------------------------------------------------------------------------
 * Warum das Todo **flach** dasteht und nicht unter `todo`
 * ---------------------------------------------------------------------------
 *
 * Weil beide Routen seit jeher das Todo selbst zurückgeben und jeder Aufrufer
 * es so liest. `poolMovement` kommt hinzu, es nimmt nichts weg: Wer die Antwort
 * heute als `Todo` liest, liest sie morgen unverändert weiter, und wer den
 * Bewegungssatz will, liest ein Feld mehr. Ein Umbau nach `{ todo, poolMovement }`
 * hätte dieselbe Auskunft gegeben und jede vorhandene Aufrufstelle gebrochen —
 * für nichts.
 *
 * Die Gestalt ist damit dieselbe wie an `POST /timer/start`: das Ergebnis der
 * Handlung und die Bewegung nebeneinander, nicht ineinander.
 *
 * Diese Datei entscheidet nichts Fachliches. Sie setzt zusammen, was der
 * Anwendungsfall geliefert hat.
 */
function doneBody(result: TodoDoneResult): Todo & { poolMovement: PoolMovement | null } {
  return { ...result.todo, poolMovement: result.poolMovement };
}

function toIssues(error: z.ZodError): { field: string; message: string; code: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.length === 0 ? '(rumpf)' : issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
