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
  ExportPreview,
  ExportTemplate,
  Id,
  Page,
  Pool,
  PoolPatch,
  PoolSurfaceQuery,
  SearchResult,
  SettingsView,
  TimeEntry,
  TimeEntryFilter,
  TodoStatus,
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

/* ==================================================================== */
/* Status eines Todos — seit E-054 keine Kanban-Spalte mehr (A-5.4)     */
/* ==================================================================== */

export function listTodoStatuses(): Promise<readonly TodoStatus[]> {
  return request<readonly TodoStatus[]>("/todo-statuses");
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

export function deleteTimeEntry(id: Id): Promise<void> {
  return request<void>(`/time-entries/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ==================================================================== */
/* Export                                                               */
/* ==================================================================== */

export function listExportTemplates(): Promise<readonly ExportTemplate[]> {
  return request<readonly ExportTemplate[]>("/export/templates");
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

/* ==================================================================== */
/* Globale Suche (A-13.7, E-038)                                        */
/* ==================================================================== */

/** Trifft Titel, Call-Nummer und Leistungstexte. Nie den Vermerk (A-7.1). */
export function searchEverything(term: string, limit = 20): Promise<SearchResult> {
  return request<SearchResult>("/search", { query: { q: term, limit } });
}

/** Kalendertag als Filterwert; die Oberfläche bildet ihn aus `lib/format`. */
export type { CalendarDay };
