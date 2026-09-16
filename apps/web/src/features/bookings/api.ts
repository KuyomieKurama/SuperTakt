import type {
  Page,
  Pagination,
  TimeEntryFilter,
  Id,
  PoolMovement,
  TimeEntry,
  Timestamp,
} from "../../api/types";
import { request } from "../../api/client";

/** Manuelle Buchungen können Pools ändern, heben „Erledigt“ aber nicht auf. Ohne mögliche Bewegung ist `poolMovement` null. */
export interface CreateTimeEntryResult extends TimeEntry {
  readonly poolMovement: PoolMovement | null;
}

export function createTimeEntry(body: {
  todoId: Id;
  startedAt: Timestamp;
  endedAt: Timestamp;
  note: string;
}): Promise<CreateTimeEntryResult> {
  return request<CreateTimeEntryResult>("/time-entries", { method: "POST", body });
}

/** Exportierte Einträge sind gesperrt; eine reine Daueränderung verschiebt keine Poolmitgliedschaften. */
export function updateTimeEntry(
  id: Id,
  body: { todoId?: Id; startedAt?: Timestamp; endedAt?: Timestamp; note?: string },
): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

/** Markiert ohne Datei als exportiert, ohne `exportCount` zu erhöhen. Wiederholung liefert unverändert 409. */
export function markNotBilled(id: Id, reason: string): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}/not-billed`, {
    method: "POST",
    body: { reason },
  });
}

/** Das Zurücksetzen auf „offen“ erfordert einen Grund und wird protokolliert. */
export function resetExportStatus(id: Id, reason: string): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}/export-status`, {
    method: "PUT",
    body: { status: "open", reason },
  });
}

/** `open` umfasst auch zurückgesetzte Buchungen. */
export function listTimeEntries(
  filter: TimeEntryFilter,
  page: Pagination = {},
): Promise<Page<TimeEntry>> {
  return request<Page<TimeEntry>>("/time-entries", {
    query: {
      ...(filter.includeNoExport === true ? { includeNoExport: true } : {}),
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

export function deleteTimeEntry(id: Id): Promise<void> {
  return request<void>(`/time-entries/${encodeURIComponent(id)}`, { method: "DELETE" });
}
