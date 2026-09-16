import type {
  AppSettings,
  AppSettingsUpdate,
  SettingsView,
  DraftText,
  Id,
  ServiceText,
  TechnicalKey,
  Timestamp,
  TodoStatus,
  DefaultTag,
} from "../../api/types";
import { request } from "../../api/client";

/* Sicherheitsmeldungen und der Zugang des Add-ins (S-13, E-009)        */

export type SecurityNoticeKind =
  | "auth_failure_burst"
  | "token_in_url"
  | "origin_rejected"
  | "host_rejected"
  | "file_permissions_wide";

export interface SecurityNotice {
  readonly kind: SecurityNoticeKind;
  readonly count: number;
  readonly firstAt: Timestamp;
  readonly lastAt: Timestamp;
}

export interface TokenStatus {
  readonly configured: boolean;
  readonly issuedAt: Timestamp | null;
  readonly lastUsedAt: Timestamp | null;
  readonly generation: number;
  readonly unreadable: boolean;
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

/* Status eines Todos — seit E-054 keine Kanban-Spalte mehr (A-5.4)     */

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

/** Die vollständige Reihenfolge ist erforderlich; Teillisten würden Positionskollisionen erzeugen. */
export function reorderTodoStatuses(order: readonly Id[]): Promise<readonly TodoStatus[]> {
  return request<readonly TodoStatus[]>("/todo-statuses/order", {
    method: "PUT",
    body: { order },
  });
}

/* Standard-Tags (S-10, I-12)                                           */

export function listDefaultTags(): Promise<readonly DefaultTag[]> {
  return request<readonly DefaultTag[]>("/settings/default-tags");
}

export function setDefaultTags(tagIds: readonly Id[]): Promise<readonly DefaultTag[]> {
  return request<readonly DefaultTag[]>("/settings/default-tags", {
    method: "PUT",
    body: { tagIds },
  });
}

/* Datensicherung und Migration (A-20)                                  */

/** Ergebnis eines vollständigen Datenimports. */
export interface DataImportSummary {
  readonly source: TechnicalKey;
  readonly todos: number;
  readonly projects: number;
  readonly sections: number;
  readonly tags: number;
  readonly timeEntries: number;
  readonly images: number;
  readonly warnings: readonly ServiceText[];
}

export function exportDataArchive(): Promise<unknown> {
  return request<unknown>("/data-transfer/archive");
}

export function importDataArchive(archive: unknown): Promise<DataImportSummary> {
  return request<DataImportSummary>("/data-transfer/archive", {
    method: "POST",
    body: { archive },
  });
}

export function importTodoistFiles(
  files: readonly { readonly name: DraftText; readonly content: DraftText }[],
): Promise<DataImportSummary> {
  return request<DataImportSummary>("/data-transfer/todoist", {
    method: "POST",
    body: { files },
  });
}

export function importSuperProductivity(backup: unknown, excludeTransferred = true, callPattern?: string): Promise<DataImportSummary> {
  return request<DataImportSummary>("/data-transfer/super-productivity", {
    method: "POST",
    body: { backup, excludeTransferred, ...(callPattern === undefined ? {} : { callPattern }) },
  });
}

/* Versionsprüfung (Abschnitt 18, E-069)                                */

/** Lokal gespeichertes Prüfergebnis ohne Netzabruf. Ungeprüfte Versionswerte dürfen nicht angezeigt werden. */
export interface VersionCheckView {
  /** Fremdwert: vor der Anzeige als Versionsnummer prüfen. */
  readonly latestVersion: unknown;
}

/** Löst keinen Netzabruf aus; bei Fehlern entfällt der Versionshinweis. */
export function getVersionCheck(): Promise<VersionCheckView> {
  return request<VersionCheckView>("/version-check");
}

export function getSettings(): Promise<SettingsView> {
  return request<SettingsView>("/settings");
}

export function updateSettings(body: AppSettingsUpdate): Promise<AppSettings> {
  return request<AppSettings>("/settings", { method: "PATCH", body });
}

export function listTodoStatuses(): Promise<readonly TodoStatus[]> {
  return request<readonly TodoStatus[]>("/todo-statuses");
}

export interface TodoPriority { readonly id: string; readonly name: string; readonly weight: number }
export const listPriorities = () => request<readonly TodoPriority[]>("/priorities");
export function savePriority(id: string | null, name: string, weight: number): Promise<TodoPriority> {
  if (id === null) {
    return request<TodoPriority>("/priorities", { method: "POST", body: { name, weight } });
  }
  return request<TodoPriority>(`/priorities/${encodeURIComponent(id)}`, { method: "PUT", body: { name, weight } });
}
export const deletePriority = (id: string) => request<void>(`/priorities/${encodeURIComponent(id)}`, { method: "DELETE" });
