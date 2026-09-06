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

import type {
  AttachmentId,
  CalendarDay,
  DueSortDirection,
  DueState,
  PoolId,
  PoolMovement,
  StatusId,
  TagId,
  Todo,
  TodoId,
} from '@takt/domain';
import { DUE_STATES, isDueState } from '@takt/domain';

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
  today,
  updateTodo,
  writeTodoNote,
} from '../usecases/todos.ts';
import {
  addAttachment,
  listAttachments,
  readAttachmentImage,
  removeAttachment,
} from '../usecases/attachments.ts';
import { data, fail, failValidation } from '../http/problem.ts';
import {
  attachmentPathSchema,
  attachmentTitleSchema,
  attachmentUrlSchema,
  commaSeparatedIds,
  dueDateSchema,
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
  /**
   * Die **Frist** (A-19.1, A-19.3). Freiwillig; ohne Angabe hat das Todo
   * keine, und das ist der Regelfall.
   *
   * `.nullish()` und nicht `.optional()`: `null` heißt ausdrücklich „ohne
   * Frist" und ist damit dasselbe wie Weglassen — beim **Anlegen** gibt es
   * nichts zu entfernen. Beim Ändern sind die beiden verschieden, siehe
   * `updateSchema`.
   */
  dueDate: dueDateSchema.optional(),
});

const updateSchema = z.object({
  title: titleSchema.optional(),
  callNumber: z.string().trim().max(64).nullish(),
  statusId: idSchema.optional(),
  tagIds: z.array(idSchema).max(200).optional(),
  /**
   * Die Frist ändern **oder entfernen** (A-19.3).
   *
   * Drei Fälle, und sie sind hier alle drei erreichbar: Das Feld fehlt →
   * unverändert. `null` → entfernen. Ein Tag → setzen. Das ist der Grund für
   * `exactOptionalPropertyTypes` in diesem Baum, und ohne die Unterscheidung
   * gäbe es keinen Weg, eine gesetzte Frist wieder loszuwerden.
   */
  dueDate: dueDateSchema.optional(),
});

const noteSchema = z.object({ text: textSchema });

/**
 * Einen Anhang hinzufügen (A-19.9, A-19.10).
 *
 * ---------------------------------------------------------------------------
 * Eine unterschiedene Vereinigung und **kein** Objekt mit drei freiwilligen
 * Feldern
 * ---------------------------------------------------------------------------
 *
 * A-19.10 sagt es schon: „Beim Hinzufügen bestimmt die gewählte Art das
 * Eingabefeld." Ein Rumpf mit `url`, `path` und `sourcePath` nebeneinander
 * ließe zu, alle drei zu schicken — und dann entschiede eine Verzweigung,
 * welches gilt. Genau das schließt A-A-1 für die Öffnen-Befehle der Hülle aus,
 * und aus demselben Grund: Ein falsch gesetztes Kennzeichen wäre der Weg, eine
 * Adresse durch die Pfadprüfung zu schicken.
 *
 * Mit `z.discriminatedUnion` trägt der **Typ** die Trennung. Ein Rumpf
 * `{ kind: 'file', url: '…' }` wird abgewiesen, nicht ausgewertet.
 *
 * ---------------------------------------------------------------------------
 * Warum das Bild einen **Pfad** bekommt und keine Bytes
 * ---------------------------------------------------------------------------
 *
 * Weil der Rumpf auf `MAX_BODY_BYTES` begrenzt ist — ein Megabyte (B-1.7) —
 * und ein Bild bis zu acht Mebibyte groß sein darf (A-A-15). Die Grenze zu
 * heben, damit Bilder durch die Tür passen, hieße sie für **jede** Route zu
 * heben.
 *
 * Stattdessen wählt der Benutzer die Datei im Systemdialog der Hülle
 * (`dialog:allow-open` mit `directory: false`, A-A-11) und der Dienst liest
 * sie. Das ist zugleich die wirksamste Prüfung, die es hier gibt
 * (Bedrohungsmodell 20.1): Der Benutzer hat die Datei gesehen und ausgewählt,
 * bevor irgendetwas im Bestand steht. Gelesen wird sie mit Zählung beim Lesen
 * und Prüfung der Kopfsignatur (A-A-15, A-A-16); geschrieben wird nur in das
 * Bildverzeichnis, dessen Pfad aus dem Zusammenbau kommt.
 */
const addAttachmentSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('link'),
    url: attachmentUrlSchema,
    title: attachmentTitleSchema.nullish(),
  }),
  z.object({
    kind: z.literal('file'),
    path: attachmentPathSchema,
    title: attachmentTitleSchema.nullish(),
  }),
  z.object({
    kind: z.literal('image'),
    /** Der Pfad der **Quelle**. Er wird gelesen und danach nie gespeichert (A-A-17). */
    sourcePath: attachmentPathSchema,
    title: attachmentTitleSchema.nullish(),
  }),
]);

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
 * `?dueState=overdue,due_today` — nach der Frist filtern (A-19.20).
 *
 * **Anzeige, keine Achse** (E-074 Punkt 1): Dieser Parameter ordnet eine
 * Liste, er ordnet kein Todo einem Pool zu. Es gibt bewußt keinen
 * entsprechenden Term in `pool_rule` und keine Feldquelle im Vorlageneditor.
 *
 * Die vier Werte kommen aus `DUE_STATES` in der Domäne und werden **wörtlich**
 * verglichen (`isDueState`), ohne Normalisierung. Ein unbekannter Wert ist ein
 * `422` mit Feldangabe und nicht ein stillschweigend übergangener Filter — ein
 * Filter, der nicht greift, sieht aus wie eine Liste ohne Treffer, und der
 * Aufrufer sucht den Fehler bei seinen Daten.
 *
 * Kommagetrennt und als **Vereinigung** wirkend: „überfällig oder heute
 * fällig" ist die Frage, die jemand stellt. Der Schnitt wäre immer leer, weil
 * die vier Zustände einander ausschließen.
 *
 * Die Obergrenze ist die Zahl der Zustände selbst — mehr als vier gibt es
 * nicht, und `DUE_STATES.length` steht hier, damit ein fünfter sie mitnimmt,
 * statt an einer Ziffer aufzulaufen (T-128, E-063 Punkt 4).
 */
const dueStateListSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.split(',') : value),
  z
    .array(z.string().refine((entry) => isDueState(entry), { message: 'Unbekannter Fristzustand.' }))
    .min(1)
    .max(DUE_STATES.length),
);

/**
 * `?sortByDueDate=asc|desc` — nach der Frist sortieren (A-19.20).
 *
 * Ohne Angabe bleibt es bei der Ordnung, die es seit Migration 0010 gibt:
 * zuletzt geändert, absteigend. Ein Todo **ohne** Frist steht in **beiden**
 * Richtungen am Ende (E-074 Punkt 2) — das entscheidet der Adapter, und die
 * Regel dazu steht in `compareByDueDate` in der Domäne.
 */
const dueSortSchema = z.enum(['asc', 'desc']);

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
  addTodoAttachment: addAttachmentSchema,
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

    /*
     * Die Frist als Filter (A-19.20). `heute` kommt aus `today(context)` und
     * damit aus derselben Uhr und derselben Zeitzone wie die Tagesgruppierung
     * des Exports (E-025, E-070 Punkt 2) — es gibt einen Tagesbegriff, und er
     * entsteht an einer Stelle.
     */
    let dueStates: readonly DueState[] | undefined;
    if (query['dueState'] !== undefined) {
      const parsedStates = dueStateListSchema.safeParse(query['dueState']);
      if (!parsedStates.success) return failValidation(c, toIssues(parsedStates.error));
      dueStates = parsedStates.data as DueState[];
    }

    let sortByDueDate: DueSortDirection | undefined;
    if (query['sortByDueDate'] !== undefined) {
      const parsedSort = dueSortSchema.safeParse(query['sortByDueDate']);
      if (!parsedSort.success) return failValidation(c, toIssues(parsedSort.error));
      sortByDueDate = parsedSort.data;
    }

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
        ...(dueStates === undefined ? {} : { due: { states: dueStates, today: today(context) } }),
        ...(sortByDueDate === undefined ? {} : { sortByDueDate }),
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
      // `?? null` faßt „fehlt" und `null` zusammen: Beim **Anlegen** gibt es
      // keine Frist zu entfernen, beide heißen „ohne Frist" (A-19.1).
      dueDate: (parsed.data.dueDate ?? null) as CalendarDay | null,
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
      // **Nicht** `?? null`: Hier sind „fehlt" und `null` zwei verschiedene
      // Anweisungen (A-19.3), und die zweite ist die einzige, mit der sich
      // eine gesetzte Frist wieder entfernen läßt.
      ...(parsed.data.dueDate === undefined
        ? {}
        : { dueDate: parsed.data.dueDate as CalendarDay | null }),
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
  // Anhänge (A-19.8 bis A-19.15) — Unterressource des Todos
  // -------------------------------------------------------------------------
  /*
   * ===========================================================================
   * Warum die Anhänge hier hängen und nicht unter `/attachments`
   * ===========================================================================
   *
   * Weil ein Anhang ohne sein Todo nichts ist (spec.md, Kopf von Abschnitt 19:
   * „hängt am bestehenden Todo und ist keine zweite Struktur daneben"). Die
   * Kennung des Todos steht damit im Pfad und nicht im Rumpf, und es gibt keine
   * Adresse, unter der ein Anhang ohne seinen Eigentümer erreichbar wäre.
   *
   * ===========================================================================
   * Und warum das zugleich A-19.19 strukturell erfüllt
   * ===========================================================================
   *
   * `/api/v1/todos/…` liegt **außerhalb** von `/api/v1/addin` und steht nicht
   * in `SHARED_PATHS`. `requiredCredentialForPath` (`access/route-policy.ts`)
   * schließt damit alles hier von selbst für ein Add-in-Token — ohne einen
   * einzigen neuen Wächter, und `proof:route-policy` Abschnitt 4 fährt jede
   * Route der zusammengebauten Anwendung mit dem Add-in-Token an und mißt es
   * mit, ohne daß jemand daran denken muß (A-A-21).
   *
   * Das ist die stärkere und zugleich billigere Form von „über das Add-in
   * entstehen keine Anhänge": nicht ein Feld, das dort fehlt, sondern **keine
   * Leitung**, über die es entstehen könnte (E-072 Punkt 1, R-06).
   *
   * ===========================================================================
   * Es öffnet sich hier nichts
   * ===========================================================================
   *
   * Keine dieser Routen ruft `open`, keine startet etwas, keine holt etwas vor
   * (A-19.18, A-A-24). `GET …/image` liefert **Bytes**; die Oberfläche baut
   * daraus eine `data:`-Adresse (E-071 Punkt 3). Das Öffnen liegt in der Hülle,
   * hinter einer Formprüfung, die bei jedem Aufruf neu läuft (E-072 Punkt 2).
   */
  routes.get('/:todoId/attachments', async (c) => {
    const result = await listAttachments(context, c.req.param('todoId') as TodoId);
    return result.ok ? data(c, { items: result.value }) : fail(c, result.error);
  });

  routes.post('/:todoId/attachments', async (c) => {
    const parsed = addAttachmentSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toIssues(parsed.error));

    const todoId = c.req.param('todoId') as TodoId;
    const title = parsed.data.title ?? null;
    const result = await addAttachment(
      context,
      todoId,
      parsed.data.kind === 'link'
        ? { kind: 'link', title, url: parsed.data.url }
        : parsed.data.kind === 'file'
          ? { kind: 'file', title, path: parsed.data.path }
          : { kind: 'image', title, sourcePath: parsed.data.sourcePath },
    );
    if (!result.ok) return fail(c, result.error);

    c.header('Location', `/api/v1/todos/${todoId}/attachments/${result.value.id}`);
    return data(c, result.value, 201);
  });

  routes.delete('/:todoId/attachments/:attachmentId', async (c) => {
    const result = await removeAttachment(
      context,
      c.req.param('todoId') as TodoId,
      c.req.param('attachmentId') as AttachmentId,
    );
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  /**
   * Die **Bytes** eines Bildanhangs (A-19.13, E-071 Punkt 3).
   *
   * Eigene Route und kein Feld an der Anhangsliste: Ein Todo mit fünf Bildern
   * trüge sonst rund 33 MiB in **jeder** Antwort, auch wenn niemand sie sehen
   * will. Die Liste nennt die Anhänge, diese Route liefert die Bytes — und nur
   * für die, die angezeigt werden.
   *
   * Base64 im JSON-Rumpf und kein `Content-Type: image/png`. Der Grund ist der
   * aus Bedrohungsmodell 20.5, und er entscheidet die Frage: **Ein
   * `<img src>` trägt kein `X-Takt-Token`** — der Browser setzt bei einem
   * Bildabruf keine eigenen Kopfzeilen. Eine Byte-Route zum unmittelbaren
   * Einbinden bräuchte deshalb entweder gar keinen Nachweis (Kundenmaterial
   * für jeden lokalen Prozeß, VG-1) oder ein Geheimnis in der Adresse (B-2.4).
   * Beides ist schlechter als ein Drittel mehr Arbeitsspeicher, und die CSP
   * bleibt, wie sie ist: `img-src 'self' data:` (A-A-12).
   */
  routes.get('/:todoId/attachments/:attachmentId/image', async (c) => {
    const result = await readAttachmentImage(
      context,
      c.req.param('todoId') as TodoId,
      c.req.param('attachmentId') as AttachmentId,
    );
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
