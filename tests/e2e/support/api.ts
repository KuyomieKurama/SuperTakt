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
/* Timer — nur für Testaufräumung (T-048)                                */
/* ==================================================================== */

export interface RunningTimer {
  readonly todoId: string;
}

/** `GET /timer` — `null`, wenn keiner läuft. */
export async function getRunningTimer(): Promise<RunningTimer | null> {
  return call<RunningTimer | null>('/timer');
}

/** `GET /timer/orphaned` — `null`, wenn keiner verwaist ist. */
export async function getOrphanedTimer(): Promise<RunningTimer | null> {
  return call<RunningTimer | null>('/timer/orphaned');
}

export async function stopTimer(note = ''): Promise<unknown> {
  return call('/timer/stop', { method: 'POST', body: JSON.stringify({ note }) });
}

export async function resolveOrphanedTimer(resolution: 'book_until_heartbeat' | 'discard' = 'discard'): Promise<unknown> {
  return call('/timer/orphaned/resolve', { method: 'POST', body: JSON.stringify({ resolution }) });
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
