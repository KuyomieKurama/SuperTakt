/** API-Zugriffe dienen dem Testaufbau und Nachlesen; Bedienabläufe werden über die Oberfläche geprüft. */

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
  /** Tageswert YYYY-MM-DD oder null, kein Zeitstempel. */
  readonly dueDate: string | null;
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
  /** Die Frist beim Anlegen (A-19.1, A-19.3). Fehlt sie, entsteht das Todo ohne Frist. */
  dueDate?: string | null;
}): Promise<Todo> {
  const result = await call<{ todo: Todo; addedDefaultTagIds: readonly string[] }>('/todos', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      note: input.note ?? '',
      callNumber: input.callNumber ?? null,
      tagIds: input.tagIds ?? [],
      statusId: input.statusId ?? null,
      dueDate: input.dueDate ?? null,
    }),
  });
  return result.todo;
}

/** null entfernt das Fälligkeitsdatum. */
export async function updateTodoDueDate(id: string, dueDate: string | null): Promise<Todo> {
  return call<Todo>(`/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ dueDate }),
  });
}

/** `GET /todos/:id` — das Todo, so wie `TodoDetailScreen` es lädt. */
export async function loadTodoDetail(id: string): Promise<{
  readonly todo: Todo;
  readonly totalSeconds: number;
  readonly openSeconds: number;
}> {
  return call(`/todos/${id}`);
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

/** Die Antwort enthält die Todo-Felder und `poolMovement` ohne zusätzliche Hülle. */
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

/** Die Antwort ergänzt den Zeiteintrag um `poolMovement`; manuelle Buchungen öffnen erledigte Todos nicht wieder. */
export interface CreatedTimeEntryResult extends TimeEntry {
  readonly poolMovement: PoolMovementNames | null;
}

/** `POST /time-entries` mit `poolMovement` (E-061 Nachtrag, O-V, T-107). */
export async function createTimeEntryWithMovement(input: {
  todoId: string;
  startedAt: string;
  endedAt: string;
  note?: string;
}): Promise<CreatedTimeEntryResult> {
  return call<CreatedTimeEntryResult>('/time-entries', {
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

/** Liefert auch Fehlerantworten unverändert zur Prüfung. */
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

/* Pools / Kanban-Spalten (E-054, E-055)                                 */

/** Nur für Testaufbau und Aufräumen; Bedienabläufe verwenden die Oberfläche. */
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

/** Testnamen müssen eindeutig sein, damit das Aufräumen die richtige Spalte findet. */
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

export async function setTimerPrompt(promptOnTimerStop: boolean): Promise<void> {
  await call('/settings', { method: 'PATCH', body: JSON.stringify({ promptOnTimerStop }) });
}

export async function getSettings(): Promise<{
  promptOnTimerStop: boolean;
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

/** Verweise müssen vor dem Löschen entfernt werden; Fehler werden nicht automatisch behoben. */
export async function deleteTodoStatus(id: string): Promise<void> {
  await call<void>(`/todo-statuses/${id}`, { method: 'DELETE' });
}

/* Timer (T-048 — Aufräumung; T-099 — Bewegungssatz und Exportstatus)    */

export interface RunningTimer {
  readonly entry: { readonly id: string; readonly todoId: string; readonly startedAt: string };
  readonly todoTitle: string;
  readonly elapsedSeconds: number;
}

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
export async function getOrphanedTimer(): Promise<{ readonly running: RunningTimer['entry']; readonly todoTitle: string; readonly heartbeatAt: string | null; readonly bookableSeconds: number } | null> {
  return call('/timer/orphaned');
}

/** Nur `started` kann eine Poolbewegung enthalten. */
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

/** Verworfene Buchungen unter einer Sekunde lösen keine Poolbewegung aus. */
export type StopTimerResult =
  | { readonly kind: 'recorded'; readonly entry: TimeEntry; readonly poolMovement: PoolMovementNames | null }
  | { readonly kind: 'discarded'; readonly poolMovement: null };

export async function stopTimer(note = ''): Promise<StopTimerResult> {
  return call<StopTimerResult>('/timer/stop', { method: 'POST', body: JSON.stringify({ note }) });
}

/** Unterscheidet bewusstes Verwerfen von einer zu kurzen Buchung. */
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

/** Räumt auch nach fehlgeschlagenen Tests einen verbliebenen Timer auf. */
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

/* Outlook-Add-in — die Routen unter /addin direkt (T-099)               */

/** Für die direkte Testanbindung wird das Sitzungstoken verwendet. */
export interface AddinTodoMatch {
  readonly id: string;
  readonly title: string;
  readonly callNumber: string | null;
  readonly completedAt: string | null;
  readonly poolMovement: PoolMovementNames | null;
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
  readonly poolMovement: PoolMovementNames | null;
}

/** Zusätzliche Schlüssel erlauben Tests gegen eingeschleuste Anhangsdaten. */
export async function addinBookOnTodo(
  todoId: string,
  input: { startedAt: string; endedAt: string; note?: string } & Record<string, unknown>,
): Promise<AddinBookResult> {
  const { startedAt, endedAt, note, ...rest } = input;
  return call<AddinBookResult>(`/addin/todos/${todoId}/time-entries`, {
    method: 'POST',
    body: JSON.stringify({ startedAt, endedAt, note: note ?? '', ...rest }),
  });
}

export type AddinEmailAttachmentItemInput =
  | { readonly kind: 'message'; readonly displayName: string; readonly contentBase64: string; readonly rebuilt: boolean }
  | { readonly kind: 'file'; readonly displayName: string; readonly contentBase64: string }
  | { readonly kind: 'link'; readonly displayName: string; readonly url: string };

/** Der Umschlag: eine E-Mail, ihr Absender, ihre Anhänge (A-A-82). */
export interface AddinEmailAttachmentsInput {
  readonly sender?: string | null;
  readonly items: readonly AddinEmailAttachmentItemInput[];
}

/** Was `POST /addin/todos` über mitgeschickte Anhänge zurückmeldet (A-19.29, A-19.33). */
export interface AddinCreatedAttachmentsResult {
  readonly stored: number;
  readonly rejected: readonly {
    readonly displayName: string;
    readonly reason: string;
    readonly bytes: number | null;
  }[];
}

/** Zusätzliche Schlüssel erlauben Tests gegen unerlaubte Verknüpfungen mit bestehenden Todos. */
export interface AddinCreatedTodo {
  readonly todo: { readonly id: string; readonly title: string };
  readonly attachments: AddinCreatedAttachmentsResult | null;
}

export async function addinCreateTodo(
  input: { readonly title: string } & Record<string, unknown>,
): Promise<AddinCreatedTodo> {
  return call<AddinCreatedTodo>('/addin/todos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/* Anhänge (A-19.8 bis A-19.15, E-071, E-072, T-150)                     */

export type AttachmentKind = 'link' | 'image' | 'file';

export interface Attachment {
  readonly id: string;
  readonly todoId: string;
  readonly kind: AttachmentKind;
  readonly title: string | null;
  readonly target: string;
  readonly position: number;
  readonly createdAt: string;
  readonly origin?: 'user' | 'email';
  readonly originSender?: string | null;
  readonly displayName?: string | null;
  readonly rebuilt?: boolean;
}

/** Dieselbe unterschiedene Vereinigung wie `AttachmentCreate` in `apps/web/src/api/types.ts`. */
export type AttachmentCreateBody =
  | { readonly kind: 'link'; readonly url: string; readonly title?: string | null }
  | { readonly kind: 'file'; readonly path: string; readonly title?: string | null }
  | { readonly kind: 'image'; readonly sourcePath: string; readonly title?: string | null };

/** `POST /todos/:id/attachments` (A-19.10, A-19.11). */
export async function createAttachment(todoId: string, body: AttachmentCreateBody): Promise<Attachment> {
  return call<Attachment>(`/todos/${todoId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** `GET /todos/:id/attachments` (A-19.11). */
export async function listAttachmentsByTodo(todoId: string): Promise<readonly Attachment[]> {
  const result = await call<{ items: readonly Attachment[] }>(`/todos/${todoId}/attachments`);
  return result.items;
}

/** `DELETE /todos/:id/attachments/:attachmentId` (A-19.11). Aufräumen nach einem Testfall. */
export async function deleteAttachmentById(todoId: string, attachmentId: string): Promise<void> {
  await call<void>(`/todos/${todoId}/attachments/${attachmentId}`, { method: 'DELETE' });
}

export interface AttachmentImage {
  readonly mediaType: string;
  readonly base64: string;
}

/** `GET /todos/:id/attachments/:attachmentId/image` (A-19.13). */
export async function getAttachmentImage(todoId: string, attachmentId: string): Promise<AttachmentImage> {
  return call<AttachmentImage>(`/todos/${todoId}/attachments/${attachmentId}/image`);
}

/** Liefert auch Fehlerantworten unverändert zur Prüfung. */
export async function attemptCreateAttachment(
  todoId: string,
  body: unknown,
): Promise<
  | { readonly ok: true; readonly value: Attachment }
  | {
      readonly ok: false;
      readonly status: number;
      readonly body: { readonly error?: { readonly code?: string; readonly message?: string } };
    }
> {
  const response = await fetch(`${API_BASE_URL}/todos/${todoId}/attachments`, {
    method: 'POST',
    headers: {
      Origin: WEB_BASE_URL,
      [TOKEN_HEADER]: SESSION_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const parsed = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
    data?: Attachment;
  };
  if (response.ok && parsed.data !== undefined) {
    return { ok: true, value: parsed.data };
  }
  return { ok: false, status: response.status, body: parsed };
}
