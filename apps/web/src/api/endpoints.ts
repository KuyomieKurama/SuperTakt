/**
 * Takt — die Routen des lokalen Dienstes, je eine Funktion.
 *
 * Der Pfad steht genau einmal. Keine Ansicht setzt eine Adresse zusammen.
 *
 * **Gegen die Umsetzung geschrieben.** Wo `openapi/takt-local-api.yaml` und
 * `apps/local-api/src/routes/**` auseinandergehen, gilt die Umsetzung; die
 * betroffenen Stellen sind an Ort und Stelle vermerkt und im Bericht zu T-022
 * gesammelt.
 *
 * **Jeder Feldname hier ist der Name des Dienstes.** Ein Rumpf ist ein
 * Objektliteral: Ein falscher Schlüssel fällt keinem Typecheck auf, sondern
 * erst dem Benutzer, dem die Route mit 422 antwortet. T-050 hat drei solche
 * Namen gefunden — `neuerParentId`, `reihenfolge`, `nurOffene`. Wer hier ein
 * Feld ergänzt, gleicht es gegen `apps/local-api/src/routes/**` ab, nicht
 * gegen das Gedächtnis.
 */

import { request } from "./client";
import type {
  AppSettings,
  AppSettingsUpdate,
  CalendarDay,
  DefaultTag,
  ExportAuditEntry,
  ExportPreview,
  ExportRun,
  ExportRunResult,
  ExportSourceCatalog,
  ExportTemplate,
  Id,
  OrphanResolution,
  OrphanedTimerView,
  Page,
  BoardView,
  Pool,
  PoolPatch,
  PoolSurfaceQuery,
  PoolWrite,
  ResolveOrphanedTimerResult,
  RunningTimerView,
  SearchResult,
  SecurityNotice,
  SettingsView,
  StartTimerResult,
  StopTimerResult,
  Tag,
  TagFolder,
  TagTree,
  TimeEntry,
  TimeEntryFilter,
  Timestamp,
  Todo,
  TodoCreate,
  TodoDetail,
  TodoDoneResult,
  TodoFilter,
  TodoCreated,
  TodoNote,
  TodoStatus,
  TodoUpdate,
  TokenStatus,
} from "./types";

export interface Pagination {
  readonly cursor?: string;
  readonly limit?: number;
}

/* ==================================================================== */
/* Zustand                                                              */
/* ==================================================================== */

export function checkHealth(): Promise<{ status: "ok" }> {
  return request<{ status: "ok" }>("/health");
}

export function listSecurityNotices(): Promise<{ notices: readonly SecurityNotice[] }> {
  return request<{ notices: readonly SecurityNotice[] }>("/security/notices");
}

export function getTokenStatus(): Promise<TokenStatus> {
  return request<TokenStatus>("/token");
}

export function rotateToken(): Promise<{ token: string; issuedAt: Timestamp; generation: number }> {
  return request("/token", { method: "POST", body: {} });
}

/* ==================================================================== */
/* Todos                                                                */
/* ==================================================================== */

/**
 * `GET /todos`.
 *
 * Die Namen sind die, auf die der Dienst hört: `search`, `onlyOpen`. Die
 * Beschreibung nannte einmal `q` und `nurOffene`; seit T-039 nennt sie
 * dieselben Namen wie die Route. Der Vermerk bleibt stehen, damit niemand die
 * alte Fassung als die richtige liest.
 */
export function listTodos(filter: TodoFilter, page: Pagination = {}): Promise<Page<Todo>> {
  return request<Page<Todo>>("/todos", {
    query: {
      ...(filter.search === undefined ? {} : { search: filter.search }),
      ...(filter.callNumber === undefined ? {} : { callNumber: filter.callNumber }),
      ...(filter.statusIds === undefined ? {} : { statusId: filter.statusIds }),
      ...(filter.tagIds === undefined ? {} : { tagId: filter.tagIds }),
      ...(filter.poolIds === undefined ? {} : { poolId: filter.poolIds }),
      ...(filter.onlyOpen === true ? { onlyOpen: "true" } : {}),
      ...(filter.onlyWithOpenEntries === true ? { onlyWithOpenEntries: "true" } : {}),
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
    },
  });
}

export function getTodo(id: Id): Promise<TodoDetail> {
  return request<TodoDetail>(`/todos/${encodeURIComponent(id)}`);
}

/**
 * Antwort ist `{ todo, addedDefaultTagIds }` — nicht das Todo allein. Die
 * ergänzten Standard-Tags (A-9.5) gehören in die Rückmeldung.
 */
export function createTodo(body: TodoCreate): Promise<TodoCreated> {
  return request<TodoCreated>("/todos", { method: "POST", body });
}

export function updateTodo(id: Id, body: TodoUpdate): Promise<Todo> {
  return request<Todo>(`/todos/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

export function deleteTodo(id: Id): Promise<void> {
  return request<void>(`/todos/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getTodoNote(id: Id): Promise<TodoNote> {
  return request<TodoNote>(`/todos/${encodeURIComponent(id)}/note`);
}

export function putTodoNote(id: Id, text: string): Promise<TodoNote> {
  return request<TodoNote>(`/todos/${encodeURIComponent(id)}/note`, {
    method: "PUT",
    body: { text },
  });
}

/**
 * A-2.4 — erledigt setzen. Der **Status** bleibt unverändert (E-023).
 *
 * Unverändert bleibt der Status, nicht die Spalte: Seit E-055 darf eine Regel
 * nach „Erledigt" fragen, und dann wechselt die Karte mit genau dieser
 * Handlung. Die Bewegung dazu steht seit E-060 **in der Antwort**
 * ({@link TodoDoneResult}): `poolMovement`, gerechnet vom selben Anwendungsfall
 * wie an den Timer-Routen, mit dem Anlaß `'booking'` — der neutralen Form, die
 * kein Wort von Buchung trägt.
 *
 * Bis dahin stand hier: „Was diese Antwort **nicht** enthält, ist die Bewegung
 * dazu … für das Setzen und Aufheben von Hand gibt es sie nicht." Das war die
 * Lücke O-U und ist mit E-060 geschlossen; die Oberfläche rechnet weiterhin
 * nichts nach, sie liest jetzt nur mehr.
 */
export function markTodoDone(id: Id): Promise<TodoDoneResult> {
  return request<TodoDoneResult>(`/todos/${encodeURIComponent(id)}/done`, {
    method: "PUT",
    body: {},
  });
}

/**
 * A-2.5 — „Erledigt“ von Hand aufheben.
 *
 * Anlaß `'reopen'`: Das Todo war erledigt und kehrt in seine Pools zurück —
 * derselbe Satz, den der Timerstart nach A-2.5 zeigt, und aus derselben
 * Funktion (E-060 Punkt 2).
 *
 * Bis T-094 stand hier „Verschiebt keine Karte." Das war der Satz aus der Zeit
 * vor E-055 und aus demselben Irrtum wie `CARD_STAYS`: Eine Spalte, die nach
 * „Erledigt" fragt, verliert oder gewinnt das Todo mit dieser Handlung. Siehe
 * {@link markTodoDone}.
 */
export function clearTodoDone(id: Id): Promise<TodoDoneResult> {
  return request<TodoDoneResult>(`/todos/${encodeURIComponent(id)}/done`, { method: "DELETE" });
}

/* ==================================================================== */
/* Status eines Todos — seit E-054 keine Kanban-Spalte mehr (A-5.4)     */
/* ==================================================================== */

export function listTodoStatuses(): Promise<readonly TodoStatus[]> {
  return request<readonly TodoStatus[]>("/todo-statuses");
}

export function createTodoStatus(name: string, color: string | null): Promise<TodoStatus> {
  return request<TodoStatus>("/todo-statuses", { method: "POST", body: { name, color } });
}

export function updateTodoStatus(
  id: Id,
  body: { name?: string; isDefault?: boolean; color?: string | null },
): Promise<TodoStatus> {
  return request<TodoStatus>(`/todo-statuses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

export function deleteTodoStatus(id: Id): Promise<void> {
  return request<void>(`/todo-statuses/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Vollständige Liste, nicht ein Teilstück.
 *
 * Der Schlüssel heißt `order`. Er hieß hier bis T-050 `reihenfolge` — ein Name,
 * den weder das Routenschema noch die Beschreibung kennen; die Route wies jeden
 * Aufruf mit 422 ab, und das Umsortieren (A-5.4) war unbenutzbar.
 *
 * **Immer die ganze Folge.** Der Dienst weist ein Teilstück mit
 * `validation_error` ab, weil der eindeutige Index auf die Position sonst mitten
 * in der Umsortierung bräche. Der einzige Aufrufer ist der Bereich „Status" der
 * Einstellungen (`screens/StatusSettings.tsx`).
 */
export function reorderTodoStatuses(order: readonly Id[]): Promise<readonly TodoStatus[]> {
  return request<readonly TodoStatus[]>("/todo-statuses/order", {
    method: "PUT",
    body: { order },
  });
}

/* ==================================================================== */
/* Tags und Ordner                                                      */
/* ==================================================================== */

/** Ein Aufruf liefert den ganzen Baum, beliebig tief (A-4.3). */
export function getTagTree(): Promise<TagTree> {
  return request<TagTree>("/tag-tree");
}

/** Liefert eine Liste, keine Seite — der Ordnerinhalt ist immer vollständig. */
export function listTags(folderId: Id | null): Promise<readonly Tag[]> {
  return request<readonly Tag[]>("/tags", {
    query: folderId === null ? {} : { folderId },
  });
}

export function createTag(body: {
  name: string;
  folderId: Id | null;
  color: string | null;
}): Promise<Tag> {
  return request<Tag>("/tags", { method: "POST", body });
}

export function updateTag(
  id: Id,
  body: { name?: string; folderId?: Id | null; color?: string | null },
): Promise<Tag> {
  return request<Tag>(`/tags/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

export function deleteTag(id: Id): Promise<void> {
  return request<void>(`/tags/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createTagFolder(body: { name: string; parentId: Id | null }): Promise<TagFolder> {
  return request<TagFolder>("/tag-folders", { method: "POST", body });
}

export function renameTagFolder(id: Id, name: string): Promise<TagFolder> {
  return request<TagFolder>(`/tag-folders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { name },
  });
}

export function deleteTagFolder(id: Id): Promise<void> {
  return request<void>(`/tag-folders/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * I-08 — Ordner verschachteln. Eigene Route, weil hier die Zyklusprüfung
 * hängt: `tag_folder_cycle`.
 *
 * Der Schlüssel heißt `newParentId`. Er hieß hier bis T-050 `neuerParentId` —
 * ein Name, den weder das Routenschema noch die Beschreibung kennen; die Route
 * wies jeden Aufruf mit 422 ab, und S-08 konnte keinen Ordner verschieben.
 */
export function moveTagFolder(id: Id, newParentId: Id | null): Promise<TagFolder> {
  return request<TagFolder>(`/tag-folders/${encodeURIComponent(id)}/move`, {
    method: "POST",
    body: { newParentId },
  });
}

/* ==================================================================== */
/* Pools                                                                */
/* ==================================================================== */

/**
 * Die Regeln **einer Fläche** (E-054).
 *
 * Welche Regel auf welcher Fläche steht, entscheidet der Dienst
 * (`WHERE placement IN (?, 'both')`) und nicht die Oberfläche. Deshalb steht
 * hier ein Parameter und kein Filter über der vollen Liste: Zwei Fassungen
 * desselben Prädikats gingen früher oder später auseinander.
 *
 *   `pool`  — Pool-Liste und Pool-Filter. Die Vorgabe, wie vor E-054.
 *   `board` — die Spalten des Kanban-Boards.
 *   `all`   — jede Regel, für die Verwaltung in S-11.
 */
export function listPools(surface: PoolSurfaceQuery = "pool"): Promise<readonly Pool[]> {
  return request<readonly Pool[]>("/pools", { query: { placement: surface } });
}

/** `placement: "board"` legt eine Kanban-Spalte an. Eine eigene Route dafür gibt es nicht. */
export function createPool(body: PoolWrite): Promise<Pool> {
  return request<Pool>("/pools", { method: "POST", body });
}

/**
 * Teiländerung. Ein Rumpf mit nur `placement` verschiebt eine Regel zwischen
 * Pool-Liste und Board, ohne die Regel selbst anzufassen.
 */
export function updatePool(id: Id, body: PoolPatch): Promise<Pool> {
  return request<Pool>(`/pools/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

export function deletePool(id: Id): Promise<void> {
  return request<void>(`/pools/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ==================================================================== */
/* Kanban-Board (E-054)                                                 */
/* ==================================================================== */

/**
 * `GET /board` — das ganze Board in **einem** Aufruf.
 *
 * Die Spalten in ihrer Reihenfolge, je Spalte die erste Seite ihrer Karten und
 * die Karten, die in mehr als einer Spalte stehen. `limit` gilt **je Spalte**.
 *
 * Eine Fortsetzungsmarke nimmt diese Route nicht entgegen: Eine Marke gehört zu
 * genau einer geordneten Liste, und hier sind es so viele Listen wie Spalten.
 * Weiter blättert man je Spalte über {@link listPoolTodos} mit dem `nextCursor`
 * derselben Spalte.
 *
 * Es gibt **kein** Gegenstück, das eine Karte in eine Spalte legt. Ziehen ist
 * mit E-054 entfallen, weil sich eine Regel nicht durch Verschieben umkehren
 * lässt, ohne Tags zu setzen.
 */
export function getBoard(
  options: { includeCompleted?: boolean; limit?: number } = {},
): Promise<BoardView> {
  return request<BoardView>("/board", {
    query: {
      ...(options.includeCompleted === true ? { includeCompleted: "true" } : {}),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  });
}

/**
 * Bei jedem Aufruf aus den Tags abgeleitet (A-3.4). Nichts ist gespeichert.
 *
 * Der Parameter heißt `includeCompleted` und wirkt umgekehrt zum vorherigen
 * `nurOffene`: Ohne Angabe bleiben erledigte Todos außen vor (E-039). Bis T-050
 * schickte diese Funktion `nurOffene`, einen Namen, den der Dienst nicht liest.
 * Ein Aufruf mit `includeCompleted: true` blieb damit wirkungslos — er lieferte
 * still die offenen Todos statt aller.
 *
 * **Ohne Aufrufer in der Oberfläche seit T-094**, und das ist eine gute
 * Nachricht: Der letzte war `poolsContaining`, das je Pool einmal hier
 * anklopfte, um nach einem Timerstart eine Pool-Aufzählung zusammenzusuchen.
 * Diese Auskunft liefert der Dienst inzwischen fertig (E-058). Die Funktion
 * bleibt als Abbildung der Route stehen — sie ist der Weiterblätterweg einer
 * Board-Spalte ({@link getBoard}) und wird gebraucht, sobald eine Ansicht
 * über die erste Seite hinausblättert.
 */
export function listPoolTodos(
  id: Id,
  options: { includeCompleted?: boolean } = {},
  page: Pagination = {},
): Promise<Page<Todo>> {
  return request<Page<Todo>>(`/pools/${encodeURIComponent(id)}/todos`, {
    query: {
      ...(options.includeCompleted === true ? { includeCompleted: "true" } : {}),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
    },
  });
}

/* ==================================================================== */
/* Zeitbuchungen                                                        */
/* ==================================================================== */

/**
 * `GET /time-entries`.
 *
 * Der Dienst liest `fromDay`, `toDay` und `onlyPreviouslyExported`; seit T-039
 * nennt die Beschreibung dieselben Namen. Die früheren `vonTag`, `bisTag` und
 * `nurSchonEinmalExportiert` stehen nirgends mehr.
 *
 * `exportStatus` kennt genau zwei Werte (E-032). „Erneut offen“ ist hier kein
 * Wert und darf nie einer werden — sonst fällt eine zurückgesetzte Buchung aus
 * dem Filter „offen“ und damit aus dem Export.
 */
export function listTimeEntries(
  filter: TimeEntryFilter,
  page: Pagination = {},
): Promise<Page<TimeEntry>> {
  return request<Page<TimeEntry>>("/time-entries", {
    query: {
      ...(filter.todoId === undefined ? {} : { todoId: filter.todoId }),
      ...(filter.exportStatus === undefined ? {} : { exportStatus: filter.exportStatus }),
      ...(filter.fromDay === undefined ? {} : { fromDay: filter.fromDay }),
      ...(filter.toDay === undefined ? {} : { toDay: filter.toDay }),
      ...(filter.onlyPreviouslyExported === true ? { onlyPreviouslyExported: "true" } : {}),
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
    },
  });
}

export function getTimeEntry(id: Id): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}`);
}

export function createTimeEntry(body: {
  todoId: Id;
  startedAt: Timestamp;
  endedAt: Timestamp;
  note: string;
}): Promise<TimeEntry> {
  return request<TimeEntry>("/time-entries", { method: "POST", body });
}

/** Eine exportierte Buchung ist gesperrt (A-6.9): `time_entry_locked`. */
export function updateTimeEntry(
  id: Id,
  body: { todoId?: Id; startedAt?: Timestamp; endedAt?: Timestamp; note?: string },
): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

/**
 * E-047 — „Nicht abrechnen".
 *
 * Der zweite und einzige andere Weg nach `exported`: Die Buchung wird als
 * abgeschlossen geführt, ohne dass eine Datei entsteht. `exportCount` bleibt
 * dabei **unverändert** — sie war in keinem Exportlauf, und eine erfundene
 * Eins ergäbe später eine Warnung vor einer zweiten Abrechnung, die nie eine
 * erste hatte.
 *
 * `reason` ist freiwillig (E-047). Ein zweiter Aufruf auf derselben Buchung
 * ergibt `409 export_status_unchanged` — sie ist dann bereits ausgebucht oder
 * exportiert.
 */
export function markNotBilled(id: Id, reason: string): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}/not-billed`, {
    method: "POST",
    body: { reason },
  });
}

export function deleteTimeEntry(id: Id): Promise<void> {
  return request<void>(`/time-entries/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * E-012 — Exportstatus zurücksetzen. Die einzige Route, die ihn von Hand
 * ändert, und sie kann ihn ausschließlich auf `open` setzen.
 *
 * Die Begründung ist hier **Pflicht** (`minLength: 1`) und wandert unverändert
 * ins Protokoll (R-10). Das ist etwas anderes als der freiwillige Grund bei
 * „nicht abrechnen“ (E-047).
 */
export function resetExportStatus(id: Id, reason: string): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}/export-status`, {
    method: "PUT",
    body: { status: "open", reason },
  });
}

/* ==================================================================== */
/* Timer                                                                */
/* ==================================================================== */

export function getRunningTimer(): Promise<RunningTimerView | null> {
  return request<RunningTimerView | null>("/timer");
}

/**
 * A-6.2, A-6.8, A-2.5.
 *
 * Läuft schon ein Timer und `stopRunning` ist nicht gesetzt, antwortet der
 * Dienst mit `200` und `kind: "confirmation_required"` — kein Fehler, sondern
 * der erste Schritt eines zweistufigen Vorgangs.
 */
export function startTimer(todoId: Id, stopRunning = false): Promise<StartTimerResult> {
  return request<StartTimerResult>("/timer/start", {
    method: "POST",
    body: { todoId, stopRunning },
  });
}

export function stopTimer(note: string): Promise<StopTimerResult> {
  return request<StopTimerResult>("/timer/stop", { method: "POST", body: { note } });
}

/** E-036 — Lebenszeichen. Mindestens jede Minute, solange ein Timer läuft. */
export function touchTimerHeartbeat(): Promise<{ seenAt: Timestamp }> {
  return request<{ seenAt: Timestamp }>("/timer/heartbeat", { method: "POST", body: {} });
}

export function getOrphanedTimer(): Promise<OrphanedTimerView | null> {
  return request<OrphanedTimerView | null>("/timer/orphaned");
}

/**
 * E-036 — die Antwort des Benutzers auf die verwaiste Buchung.
 *
 * Eigener Rückgabetyp seit T-102 (O-R): Der verworfene Zweig nennt hier den
 * **Grund**, und die beiden Gründe sind verschiedene Auskünfte — „Sie haben
 * verworfen" gegen „es gab nichts zu buchen". Siehe
 * {@link ResolveOrphanedTimerResult}.
 */
export function resolveOrphanedTimer(
  resolution: OrphanResolution,
): Promise<ResolveOrphanedTimerResult> {
  return request<ResolveOrphanedTimerResult>("/timer/orphaned/resolve", {
    method: "POST",
    body: { resolution },
  });
}

/* ==================================================================== */
/* Export                                                               */
/* ==================================================================== */

export function listExportTemplates(): Promise<readonly ExportTemplate[]> {
  return request<readonly ExportTemplate[]>("/export/templates");
}

export function createExportTemplate(name: string, definition: unknown): Promise<ExportTemplate> {
  return request<ExportTemplate>("/export/templates", {
    method: "POST",
    body: { name, definition },
  });
}

export function updateExportTemplate(
  id: Id,
  body: { name?: string; definition?: unknown },
): Promise<ExportTemplate> {
  return request<ExportTemplate>(`/export/templates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

export function deleteExportTemplate(id: Id): Promise<void> {
  return request<void>(`/export/templates/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * E-049 — die geschlossene Auswahlliste einer Exportvorlage.
 *
 * Ohne Parameter, ohne Bestand, für jeden Aufruf dieselbe Antwort. Die
 * Oberfläche **fragt** damit, statt zu wissen: Bis E-049 stand die Liste hier
 * ein zweites Mal, weil `apps/web` weder `@takt/export` einbinden darf noch
 * eine Route hatte, die sie abfragen konnte.
 */
export function getExportSources(): Promise<ExportSourceCatalog> {
  return request<ExportSourceCatalog>("/export/sources");
}

/**
 * Vorschau einer **gespeicherten** Vorlage. Schreibt nichts; Vorschau und
 * Datei entstehen aus demselben Plan (R-17).
 *
 * `templateId === null` heißt: die in den Einstellungen aktive Vorlage.
 *
 * Der Schlüssel `definition` wird hier **nicht** mitgeschickt — der Dienst
 * liest den Schlüssel und nicht seinen Wert und wiese einen Rumpf mit beidem
 * mit 422 ab (E-051). Für den ungespeicherten Stand gibt es
 * `previewExportDraft`.
 */
export function previewExport(
  templateId: Id | null,
  timeEntryIds: readonly Id[] = [],
): Promise<ExportPreview> {
  return request<ExportPreview>("/export/preview", {
    method: "POST",
    body: { templateId, timeEntryIds },
  });
}

/**
 * E-051 — Vorschau eines **ungespeicherten** Entwurfs.
 *
 * Der Dienst prüft die mitgeschickte Definition mit **derselben Funktion** wie
 * das Speichern (`checkTemplateDefinition`) und rendert sie mit demselben
 * Plan wie der Lauf. Er schreibt dabei nichts: keine Vorlage, kein Exportlauf,
 * keine Markierung. Die Antwort trägt `templateSource: "draft"`, `templateId`
 * und `templateName` sind dann `null`.
 *
 * Damit ist die Live-Vorschau aus A-8.7 möglich, **ohne** einen zweiten
 * Renderer in der Oberfläche — genau das, was R-17 verbietet.
 *
 * `templateId` steht hier absichtlich nicht im Rumpf: Entweder Kennung oder
 * Definition, nie beides. Welche der beiden gewinnt, hat niemand entschieden,
 * und die Vorschau ist die Route, bei der Zweifel am gezeigten Stand am
 * teuersten sind.
 */
export function previewExportDraft(
  definition: unknown,
  timeEntryIds: readonly Id[] = [],
): Promise<ExportPreview> {
  return request<ExportPreview>("/export/preview", {
    method: "POST",
    body: { definition, timeEntryIds },
  });
}

export function listExportRuns(page: Pagination = {}): Promise<Page<ExportRun>> {
  return request<Page<ExportRun>>("/export/runs", {
    query: {
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
    },
  });
}

/**
 * A-8.1, A-8.8 — der Lauf. Eine Transaktion: Datei **und** Markierung, oder
 * nichts.
 *
 * Im Erfolgsfall stehen die **ausgelassenen** Gruppen in derselben Antwort
 * (E-034). Sie gehören in die Anzeige — sonst verschwindet Arbeitszeit
 * lautlos, weil eine Leistung fehlte.
 */
export function runExport(
  templateId: Id | null,
  timeEntryIds: readonly Id[] = [],
): Promise<ExportRunResult> {
  return request<ExportRunResult>("/export/runs", {
    method: "POST",
    body: { templateId, timeEntryIds },
  });
}

export function getExportRun(id: Id): Promise<ExportRun> {
  return request<ExportRun>(`/export/runs/${encodeURIComponent(id)}`);
}

/**
 * R-10, E-012, E-047 — das Protokoll der Exportstatuswechsel.
 *
 * Anhängend und unveränderlich: Es gibt keine Route, die eine Protokollzeile
 * ändert oder löscht. Ohne `timeEntryId` ist es der Gesamtverlauf (S-07,
 * Bereich „Protokoll"), mit `timeEntryId` der Verlauf **einer** Buchung — die
 * Auskunft, die jemand braucht, der gerade einen Exportstatus zurücksetzen
 * will und wissen muss, was mit dieser Zeit schon geschehen ist.
 *
 * Der Zeiger wird mitgeführt: Ein Protokoll wächst monoton, und die Frage
 * „wann wurde das schon einmal exportiert" betrifft gerade die älteren Zeilen.
 */
export function listExportAudit(
  timeEntryId?: Id,
  page: Pagination = {},
): Promise<Page<ExportAuditEntry>> {
  return request<Page<ExportAuditEntry>>("/export/audit", {
    query: {
      ...(timeEntryId === undefined ? {} : { timeEntryId }),
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
    },
  });
}

/* ==================================================================== */
/* Einstellungen                                                        */
/* ==================================================================== */

/**
 * Liefert die Einstellungen **samt** dem geprüften Zustand des Exportordners
 * und den Standard-Tags. Siehe `SettingsView`.
 */
export function getSettings(): Promise<SettingsView> {
  return request<SettingsView>("/settings");
}

export function updateSettings(body: AppSettingsUpdate): Promise<AppSettings> {
  return request<AppSettings>("/settings", { method: "PATCH", body });
}

export function listDefaultTags(): Promise<readonly DefaultTag[]> {
  return request<readonly DefaultTag[]>("/settings/default-tags");
}

export function setDefaultTags(tagIds: readonly Id[]): Promise<readonly DefaultTag[]> {
  return request<readonly DefaultTag[]>("/settings/default-tags", {
    method: "PUT",
    body: { tagIds },
  });
}

/* ==================================================================== */
/* Globale Suche (A-13.7, E-038)                                        */
/* ==================================================================== */

/** Trifft Titel, Call-Nummer und Leistungstexte. Nie den Vermerk (A-7.1). */
export function searchEverything(term: string, limit = 20): Promise<SearchResult> {
  return request<SearchResult>("/search", { query: { q: term, limit } });
}

/** Kalendertag als Filterwert; die Oberfläche bildet ihn aus `lib/format`. */
export type { CalendarDay };
