/**
 * Takt — dünner API-Zugang für die Vorbereitung von End-zu-Ende-Fällen.
 *
 * Die eigentliche Prüfung eines Testfalls läuft über die Oberfläche
 * (Playwright-Interaktion), nicht über diese Datei. Was hier steht, ist
 * ausschließlich Vorbereitung ("gegeben sei …") — etwa drei Todos anlegen,
 * bevor der Export in der Oberfläche ausgelöst wird — und das Nachlesen von
 * Tatsachen, die die Oberfläche selbst nicht in einer prüfbaren Form zeigt
 * (z. B. den rohen `exportCount`).
 *
 * Ruft denselben Dienst über dieselbe Route wie die Oberfläche, mit demselben
 * Sitzungsgeheimnis (`api/client.ts`, `X-Takt-Token`).
 */

import { API_BASE_URL, SESSION_SECRET, TOKEN_HEADER, WEB_BASE_URL } from './session';

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Origin: WEB_BASE_URL,
      [TOKEN_HEADER]: SESSION_SECRET,
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${response.status}: ${body}`);
  }
  if (response.status === 204) return undefined as T;
  const envelope = (await response.json()) as { data: T };
  return envelope.data;
}

export interface Todo {
  readonly id: string;
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: string;
  readonly completedAt: string | null;
  readonly tagIds: readonly string[];
}

export interface TimeEntry {
  readonly id: string;
  readonly todoId: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly note: string;
  readonly exportStatus: 'open' | 'exported';
  readonly exportCount: number;
}

export async function createTodo(input: {
  title: string;
  note?: string;
  callNumber?: string | null;
  tagIds?: readonly string[];
  statusId?: string | null;
}): Promise<Todo> {
  const result = await call<{ todo: Todo; addedDefaultTagIds: readonly string[] }>('/todos', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      note: input.note ?? '',
      callNumber: input.callNumber ?? null,
      tagIds: input.tagIds ?? [],
      statusId: input.statusId ?? null,
    }),
  });
  return result.todo;
}

/** A-2.4 — als erledigt markieren. Verschiebt keine Karte (A-3.4, E-054). */
export async function markTodoDone(id: string): Promise<Todo> {
  return call<Todo>(`/todos/${id}/done`, { method: 'PUT' });
}

/** Setzt die Tags eines Todos vollständig neu (Vorbereitung, kein Teil der geprüften Bedienung). */
export async function setTodoTags(id: string, tagIds: readonly string[]): Promise<Todo> {
  return call<Todo>(`/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ tagIds: [...tagIds] }),
  });
}

/** A-2.5 — „Erledigt" von Hand aufheben, ohne über den Timer zu gehen. */
export async function clearTodoDone(id: string): Promise<Todo> {
  return call<Todo>(`/todos/${id}/done`, { method: 'DELETE' });
}

/**
 * Vertrag von `PUT`/`DELETE /todos/:id/done`, seit T-101/T-102 gemessen
 * (E-060 Punkt 1): Beide Routen liefern das Todo **flach** wie bisher,
 * `poolMovement` als zusätzliches Feld daneben — Anlass `'booking'` beim
 * Setzen, `'reopen'` beim Aufheben (E-060 Punkt 2), `null`, wenn sich nichts
 * bewegt (kein Regelwechsel). Genau die Gestalt, die T-102 gegen die echte
 * Route gelesen hat (`Felder: callNumber, completedAt, createdAt, id,
 * poolMovement, statusId, tagIds, title, updatedAt`) und die
 * `apps/web/src/api/types.ts` als `TodoDoneResult extends Todo` abbildet.
 * **Keine** Hülle `{ todo, poolMovement }` — der T-103-Entwurf hatte das
 * angenommen, gemessen ist es anders.
 *
 * {@link markTodoDone}/{@link clearTodoDone} oben bleiben unverändert bei
 * der Beschriftung `Todo`: Die zusätzlichen Felder der Antwort stören dort
 * niemanden, sie werden nur nicht gelesen (kein Aufrufer dieser beiden
 * Funktionen braucht den Bewegungssatz). Keine `kind`-Marke hier — anders
 * als beim Timer kennt weder das Setzen noch das Aufheben von „Erledigt"
 * einen zweiten Ausgang (kein „unvollständig", kein „abgelehnt").
 */
export interface TodoDoneResult extends Todo {
  readonly poolMovement: PoolMovementNames | null;
}

/** `PUT /todos/:id/done` mit `poolMovement` — Anlass `'booking'` (E-060 Punkt 1/2, T-101/T-102). */
export async function setTodoDoneWithMovement(id: string): Promise<TodoDoneResult> {
  return call<TodoDoneResult>(`/todos/${id}/done`, { method: 'PUT' });
}

/** `DELETE /todos/:id/done` mit `poolMovement` — Anlass `'reopen'` (E-060 Punkt 1/2, T-101/T-102). */
export async function reopenTodoWithMovement(id: string): Promise<TodoDoneResult> {
  return call<TodoDoneResult>(`/todos/${id}/done`, { method: 'DELETE' });
}

export async function createTimeEntry(input: {
  todoId: string;
  startedAt: string;
  endedAt: string;
  note?: string;
}): Promise<TimeEntry> {
  return call<TimeEntry>('/time-entries', {
    method: 'POST',
    body: JSON.stringify({
      todoId: input.todoId,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      note: input.note ?? '',
    }),
  });
}

export async function loadTimeEntry(id: string): Promise<TimeEntry> {
  return call<TimeEntry>(`/time-entries/${id}`);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await call<void>(`/time-entries/${id}`, { method: 'DELETE' });
}

export async function listTimeEntriesByTodo(todoId: string): Promise<readonly TimeEntry[]> {
  const result = await call<{ items: readonly TimeEntry[] }>(
    `/time-entries?${new URLSearchParams({ todoId }).toString()}`,
  );
  return result.items;
}

export async function setExportStatus(
  id: string,
  status: 'open' | 'exported',
  reason: string,
): Promise<TimeEntry> {
  return call<TimeEntry>(`/time-entries/${id}/export-status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

export async function markNotBilled(id: string, reason = ''): Promise<TimeEntry> {
  return call<TimeEntry>(`/time-entries/${id}/not-billed`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export interface Tag {
  readonly id: string;
  readonly name: string;
  readonly folderId: string | null;
}

export async function createTag(name: string, folderId: string | null = null): Promise<Tag> {
  return call<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name, folderId }) });
}

/** `folderId` weggelassen (bzw. `null`) liefert die Tags auf der Wurzelebene. */
export async function listTags(folderId?: string | null): Promise<readonly Tag[]> {
  const query = folderId === undefined || folderId === null ? '' : `?${new URLSearchParams({ folderId }).toString()}`;
  return call<readonly Tag[]>(`/tags${query}`);
}

/** Aufräumen nach einem Testfall, der die Tag-Eingabe ein neues Tag anlegen ließ. */
export async function deleteTag(id: string): Promise<void> {
  await call<void>(`/tags/${id}`, { method: 'DELETE' });
}

export interface DefaultTagEntry {
  readonly tagId: string;
}

export async function listDefaultTags(): Promise<readonly DefaultTagEntry[]> {
  return call<readonly DefaultTagEntry[]>('/settings/default-tags');
}

export interface TagFolder {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
}

export async function createTagFolder(name: string, parentId: string | null = null): Promise<TagFolder> {
  return call<TagFolder>('/tag-folders', { method: 'POST', body: JSON.stringify({ name, parentId }) });
}

export async function moveTagFolder(
  folderId: string,
  newParentId: string | null,
): Promise<{ ok: true; value: TagFolder } | { ok: false; status: number; body: string }> {
  const response = await fetch(`${API_BASE_URL}/tag-folders/${folderId}/move`, {
    method: 'POST',
    headers: {
      Origin: WEB_BASE_URL,
      [TOKEN_HEADER]: SESSION_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newParentId }),
  });
  if (!response.ok) {
    return { ok: false, status: response.status, body: await response.text() };
  }
  const envelope = (await response.json()) as { data: TagFolder };
  return { ok: true, value: envelope.data };
}

/** Aufräumen — ein leerer, an keiner Regel hängender Ordner ist löschbar. */
export async function deleteTagFolder(id: string): Promise<void> {
  await call<void>(`/tag-folders/${id}`, { method: 'DELETE' });
}

export interface ApiFieldErrorEntry {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

/**
 * `DELETE /tag-folders/:id` roh — anders als {@link deleteTagFolder} wirft
 * dieser Weg bei einer Ablehnung nicht, sondern liefert Status und Antwortkörper
 * zur Prüfung (T-096, R-1 Befund 1 / T-089): Ein in einer Regel stehender
 * Ordner antwortet `409 tag_in_use` mit `details` — je betroffener Regel ein
 * Eintrag mit ihrer Kennung (`field`) und ihrem Namen (`message`,
 * `packages/storage/src/sqlite/mappers.ts#poolReference`).
 */
export async function attemptDeleteTagFolder(id: string): Promise<
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly status: number;
      readonly body: {
        readonly error?: {
          readonly code?: string;
          readonly message?: string;
          readonly details?: readonly ApiFieldErrorEntry[];
        };
      };
    }
> {
  const response = await fetch(`${API_BASE_URL}/tag-folders/${id}`, {
    method: 'DELETE',
    headers: { Origin: WEB_BASE_URL, [TOKEN_HEADER]: SESSION_SECRET },
  });
  if (response.status === 204) return { ok: true };
  const body = (await response.json().catch(() => ({}))) as {
    error?: {
      code?: string;
      message?: string;
      details?: readonly ApiFieldErrorEntry[];
    };
  };
  return { ok: false, status: response.status, body };
}

export interface Status {
  readonly id: string;
  readonly name: string;
  readonly position: number;
}

export async function listStatuses(): Promise<readonly Status[]> {
  return call<readonly Status[]>('/todo-statuses');
}

export async function createStatus(name: string, position = 0): Promise<Status> {
  return call<Status>('/todo-statuses', { method: 'POST', body: JSON.stringify({ name, position }) });
}

/* ==================================================================== */
/* Pools / Kanban-Spalten (E-054, E-055)                                 */
/* ==================================================================== */

/**
 * Seit E-054 dieselbe Entität wie eine Kanban-Spalte — `placement`
 * unterscheidet, wo eine Regel erscheint. Nur die Felder, die die
 * Aufräumung und die wenigen Fälle brauchen, in denen das Anlegen selbst
 * nicht der geprüfte Schritt ist (`todo-revival.spec.ts`): Eine Kanban-Spalte,
 * die tatsächlich geprüft wird, entsteht in `kanban.spec.ts` ausschließlich
 * über die Oberfläche (`support/actions.ts`, `createBoardColumn`) — ein
 * Testaufbau an der Datenbank vorbei würde genau das nicht mitmessen
 * (T-081-Auftrag, "Zwei Fallen").
 */
export interface Pool {
  readonly id: string;
  readonly name: string;
  readonly placement: 'pool' | 'board' | 'both';
}

export async function createPool(input: {
  name: string;
  placement?: 'pool' | 'board' | 'both';
  requiredTagIds?: readonly string[];
  /** Ordnerterme der erforderlichen Achse (E-057, T-096). */
  requiredFolderIds?: readonly string[];
  /** Die Statusachse einer Regel (E-055, T-099) — leer heißt „Alle". */
  statusIds?: readonly string[];
  completion?: 'any' | 'done' | 'open';
  /** Die Exportstatus-Achse einer Regel (E-055, T-099) — Vorgabe „Alle". */
  exportState?: 'any' | 'open' | 'exported';
}): Promise<Pool> {
  return call<Pool>('/pools', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      placement: input.placement ?? 'pool',
      rule: [
        ...(input.requiredTagIds ?? []).map((tagId) => ({ kind: 'tag', tagId })),
        ...(input.requiredFolderIds ?? []).map((folderId) => ({ kind: 'folder', folderId })),
      ],
      statusIds: input.statusIds ?? [],
      completion: input.completion ?? 'any',
      exportState: input.exportState ?? 'any',
    }),
  });
}

export async function deletePool(id: string): Promise<void> {
  await call<void>(`/pools/${id}`, { method: 'DELETE' });
}

/**
 * Für die Aufräumung nach einem `kanban.spec.ts`-Fall: Eine über die
 * Oberfläche angelegte Spalte (`createBoardColumn`, `support/actions.ts`)
 * liefert keine Kennung an den Aufrufer zurück — sie wird hier über ihren
 * (im Testlauf eindeutigen, zeitgestempelten) Namen wiedergefunden.
 */
export async function listPools(placement: 'pool' | 'board' | 'all' = 'pool'): Promise<readonly Pool[]> {
  return call<readonly Pool[]>(`/pools?${new URLSearchParams({ placement }).toString()}`);
}

/** Löscht eine über die Oberfläche angelegte Spalte anhand ihres Namens, falls vorhanden. */
export async function deletePoolByName(name: string): Promise<void> {
  const pools = await listPools('all');
  const found = pools.find((pool) => pool.name === name);
  if (found !== undefined) await deletePool(found.id);
}

export async function setDefaultTags(tagIds: readonly string[]): Promise<unknown> {
  return call('/settings/default-tags', { method: 'PUT', body: JSON.stringify({ tagIds }) });
}

export async function getSettings(): Promise<{
  exportDirectory: string | null;
  activeExportTemplateId: string;
}> {
  return call('/settings');
}

export interface ExportTemplate {
  readonly id: string;
  readonly name: string;
  readonly isBuiltin: boolean;
  readonly definition: unknown;
}

export async function listTemplates(): Promise<readonly ExportTemplate[]> {
  return call<readonly ExportTemplate[]>('/export/templates');
}

export async function createTemplate(name: string, definition: unknown): Promise<ExportTemplate> {
  return call<ExportTemplate>('/export/templates', {
    method: 'POST',
    body: JSON.stringify({ name, definition }),
  });
}

export async function runExport(input: {
  templateId?: string | null;
  timeEntryIds?: readonly string[];
}): Promise<unknown> {
  return call('/export/runs', {
    method: 'POST',
    body: JSON.stringify({
      templateId: input.templateId ?? null,
      timeEntryIds: input.timeEntryIds ?? [],
    }),
  });
}

export async function listOpenTodosByTitle(search: string): Promise<readonly Todo[]> {
  const result = await call<{ items: readonly Todo[] }>(
    `/todos?search=${encodeURIComponent(search)}`,
  );
  return result.items;
}

/** Aufräumen nach einem Kanban-Testfall (T-052) — ein Todo hat keinen Löschschutz. */
export async function deleteTodo(id: string): Promise<void> {
  await call<void>(`/todos/${id}`, { method: 'DELETE' });
}

/**
 * Aufräumen nach einem Kanban-Testfall (T-052). Lehnt der Dienst ab
 * (`status_in_use`, 409 — trägt noch ein Todo, oder `last_status_column`,
 * falls sie die letzte verbliebene wäre), ist das ein Zeichen, dass zuerst
 * die betroffenen Todos umgehängt oder gelöscht werden müssen — kein Fall,
 * den diese Funktion selbst heilen sollte.
 */
export async function deleteTodoStatus(id: string): Promise<void> {
  await call<void>(`/todo-statuses/${id}`, { method: 'DELETE' });
}

/* ==================================================================== */
/* Timer (T-048 — Aufräumung; T-099 — Bewegungssatz und Exportstatus)    */
/* ==================================================================== */

export interface RunningTimer {
  readonly todoId: string;
}

/**
 * Die Bewegung eines Todos durch die Pools, so wie der Dienst sie an den
 * Timer-Routen mitgibt (`PoolMovement` aus `@takt/domain`, E-058). Drei
 * Namenslisten und kein fertiger Satz — den bildet `poolMovementSentence`
 * aus derselben Domäne, hier bewusst noch als reine JSON-Gestalt gehalten,
 * damit diese Datei keine Domänenabhängigkeit braucht.
 */
export interface PoolMovementNames {
  readonly appears: readonly string[];
  readonly enters: readonly string[];
  readonly leaves: readonly string[];
}

/** `GET /timer` — `null`, wenn keiner läuft. */
export async function getRunningTimer(): Promise<RunningTimer | null> {
  return call<RunningTimer | null>('/timer');
}

/** `GET /timer/orphaned` — `null`, wenn keiner verwaist ist. */
export async function getOrphanedTimer(): Promise<RunningTimer | null> {
  return call<RunningTimer | null>('/timer/orphaned');
}

/**
 * `POST /timer/start` (T-099). `poolMovement` steht nur im Zweig `started`
 * und ist dort `null`, wenn der Start nichts bewegt hat (E-058 Punkt 1) —
 * derselbe Vertrag wie in `apps/web/src/api/types.ts` (`StartTimerResult`).
 */
export type StartTimerResult =
  | {
      readonly kind: 'started';
      readonly doneCleared: boolean;
      readonly poolMovement: PoolMovementNames | null;
    }
  | { readonly kind: 'confirmation_required' };

export async function startTimer(todoId: string, stopRunning = false): Promise<StartTimerResult> {
  return call<StartTimerResult>('/timer/start', {
    method: 'POST',
    body: JSON.stringify({ todoId, stopRunning }),
  });
}

/**
 * `POST /timer/stop` (T-099, E-058 Punkt 6). Im Zweig `discarded` steht
 * `poolMovement` fest auf `null` — der Timer lief unter einer Sekunde, und
 * ohne Buchung bewegt sich nichts.
 */
export type StopTimerResult =
  | { readonly kind: 'recorded'; readonly entry: TimeEntry; readonly poolMovement: PoolMovementNames | null }
  | { readonly kind: 'discarded'; readonly poolMovement: null };

export async function stopTimer(note = ''): Promise<StopTimerResult> {
  return call<StopTimerResult>('/timer/stop', { method: 'POST', body: JSON.stringify({ note }) });
}

/**
 * `POST /timer/orphaned/resolve` (T-099, E-058 Punkt 6). Dieselbe Gestalt wie
 * beim Stopp — auch hier ist `poolMovement` im verworfenen Zweig fest `null`.
 *
 * `reason` als geschlossene Aufzählung, nicht als `string` (Fund aus T-093,
 * O-R): Die OpenAPI verspricht `timer_too_short` und `orphan_discarded`,
 * vor T-101 liefert der Dienst aber ausnahmslos `timer_too_short` — die Wahl
 * „verwerfen“ läuft heute unter derselben Kennung wie „zu kurz“. Die
 * Aufzählung hier nennt bereits beide, weil kein heutiger Aufrufer den Wert
 * ausliest (siehe `cleanupAnyTimer` unten); sobald T-101 unterscheidet, ist
 * dieser Typ bereits der richtige, kein zweiter Umbau nötig.
 */
export type ResolveOrphanedTimerResult =
  | { readonly kind: 'recorded'; readonly entry: TimeEntry; readonly poolMovement: PoolMovementNames | null }
  | {
      readonly kind: 'discarded';
      readonly reason: 'timer_too_short' | 'orphan_discarded';
      readonly poolMovement: null;
    };

export async function resolveOrphanedTimer(
  resolution: 'book_until_heartbeat' | 'discard' = 'discard',
): Promise<ResolveOrphanedTimerResult> {
  return call<ResolveOrphanedTimerResult>('/timer/orphaned/resolve', {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  });
}

/** Setzt das Lebenszeichen des laufenden Timers — Vorbereitung für E-036-Fälle (T-099). */
export async function touchTimerHeartbeat(): Promise<void> {
  await call<unknown>('/timer/heartbeat', { method: 'POST' });
}

/**
 * Räumt einen laufenden oder verwaisten Timer über die API auf — unabhängig
 * davon, ob ein UI-Testfall zuvor selbst aufgeräumt hat. Ohne das hinterlässt
 * ein fehlgeschlagener Testfall einen laufenden Timer im gemeinsamen Bestand;
 * jeder folgende Testfall träfe dann sofort auf die „verwaister Timer"-
 * Rückfrage der Oberfläche (siehe Bericht zu T-048).
 */
export async function cleanupAnyTimer(): Promise<void> {
  const running = await getRunningTimer().catch(() => null);
  if (running !== null) {
    await stopTimer('E2E-Aufräumung').catch(() => undefined);
  }
  const orphaned = await getOrphanedTimer().catch(() => null);
  if (orphaned !== null) {
    await resolveOrphanedTimer('discard').catch(() => undefined);
  }
}

/* ==================================================================== */
/* Outlook-Add-in — die Routen unter /addin direkt (T-099)               */
/* ==================================================================== */

/**
 * `credentialPolicy` (`apps/local-api/src/http/guards.ts`) senkt die
 * Anforderung nur unter `/api/v1/addin` auf „irgendein Nachweis" — das
 * Sitzungsgeheimnis dieses Testlaufs erfüllt das ebenso wie ein eigenes
 * Add-in-Token. Ein zweites, eigens ausgestelltes Token ist deshalb für
 * diese Aufrufe nicht nötig.
 *
 * Diese Datei ruft die Add-in-Routen absichtlich **direkt** über HTTP an,
 * nicht über den Aufgabenbereich selbst (Office.js): T-099 vergleicht den
 * Bewegungssatz gegen das, was `POST /addin/...` liefert und was
 * `apps/outlook-addin/src/duplicate/reopen.ts` (fremde Hoheit, nur gelesen)
 * daraus baut — dieselbe Auskunft, die auch ein echter Aufgabenbereich über
 * `fetch` bekäme.
 */
export interface AddinTodoMatch {
  readonly id: string;
  readonly title: string;
  readonly callNumber: string | null;
  readonly completedAt: string | null;
  readonly poolNames: readonly string[];
  readonly enteringPoolNames: readonly string[];
  readonly leavingPoolNames: readonly string[];
}

export type AddinTodoMatchesResult =
  | {
      readonly searched: false;
      readonly reason: string;
      readonly message: string;
      readonly matches: readonly [];
    }
  | { readonly searched: true; readonly callNumber: string; readonly matches: readonly AddinTodoMatch[] };

/** `GET /addin/todo-matches` — die Ankündigung, vor jeder Buchung (A-10.9). */
export async function addinTodoMatches(callNumber: string): Promise<AddinTodoMatchesResult> {
  return call<AddinTodoMatchesResult>(
    `/addin/todo-matches?${new URLSearchParams({ callNumber }).toString()}`,
  );
}

export interface AddinBookResult {
  readonly timeEntry: { readonly id: string };
  readonly todoWasDone: boolean;
  readonly doneCleared: boolean;
  readonly poolNames: readonly string[];
  readonly enteringPoolNames: readonly string[];
  readonly leavingPoolNames: readonly string[];
}

/**
 * `POST /addin/todos/:todoId/time-entries` — die Bestätigung, nach der
 * Buchung (A-6.1, A-10.9). `startedAt`/`endedAt` im Format
 * `YYYY-MM-DDTHH:MM:SSZ` (Sekundengenauigkeit, `schema.ts` der Add-in-Routen).
 */
export async function addinBookOnTodo(
  todoId: string,
  input: { startedAt: string; endedAt: string; note?: string },
): Promise<AddinBookResult> {
  return call<AddinBookResult>(`/addin/todos/${todoId}/time-entries`, {
    method: 'POST',
    body: JSON.stringify({ startedAt: input.startedAt, endedAt: input.endedAt, note: input.note ?? '' }),
  });
}
