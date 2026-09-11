import { request } from "../../api/client";
import type {
  DraftText,
  Id,
  ServiceText,
  TechnicalKey,
  Timestamp,
  TodoStatus,
  DefaultTag,
} from "../../api/types";

/**
 * Takt — die Routen und Typen der Einstellungen, soweit sie **nur** dieses
 * Merkmal angehen (S-09, S-10, S-13, A-5.4, A-18.x, A-20.x, A-22).
 *
 * Vierzehn Routen: Sicherheitsmeldungen und Add-in-Token, die vier Routen der
 * Statusstruktur, die Standard-Tags, die vier der Datensicherung und des
 * Fremdimports sowie die Versionsprüfung.
 *
 * **Sechs Routen an den Einstellungen stehen ausdrücklich nicht hier**, und
 * zwar aus demselben Grund, aus dem `listTimeEntries` in `api/endpoints.ts`
 * geblieben ist (siehe `features/bookings/api.ts`): Was mehrere Flächen lesen,
 * gehört keiner.
 *
 *   `getSettings`, `listTodoStatuses`, `listPools` — `app/StructureContext.tsx`
 *   ruft sie an, und `app/` liegt **unter** den Merkmalen. Eine Einfuhr aus
 *   `features/settings/` an dieser Stelle drehte die Richtung um.
 *
 *   `updateSettings` — `features/export/TemplatesScreen.tsx` schreibt damit die
 *   aktive Vorlage.
 *
 *   `listExportTemplates` — eine Route des Exports; `features/export` liest sie
 *   ebenfalls.
 *
 *   `updatePool` — Board, Tags und `features/structure` schreiben alle darüber.
 *
 * Dieselbe Trennung gilt für die Typen. `AppSettings`, `AppSettingsUpdate`,
 * `SettingsView`, `TodoStatus` und `DefaultTag` bleiben in `api/types.ts`: Sie
 * hängen an den Routen, die dort geblieben sind, und `api/types.ts` darf aus
 * `features/` nichts einführen.
 */

/* -------------------------------------------------------------------- */
/* Sicherheitsmeldungen und der Zugang des Add-ins (S-13, E-009)        */
/* -------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------- */
/* Status eines Todos — seit E-054 keine Kanban-Spalte mehr (A-5.4)     */
/* -------------------------------------------------------------------- */

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
 * Einstellungen (`features/settings/StatusSettings.tsx`).
 */
export function reorderTodoStatuses(order: readonly Id[]): Promise<readonly TodoStatus[]> {
  return request<readonly TodoStatus[]>("/todo-statuses/order", {
    method: "PUT",
    body: { order },
  });
}

/* -------------------------------------------------------------------- */
/* Standard-Tags (S-10, I-12)                                           */
/* -------------------------------------------------------------------- */

export function listDefaultTags(): Promise<readonly DefaultTag[]> {
  return request<readonly DefaultTag[]>("/settings/default-tags");
}

export function setDefaultTags(tagIds: readonly Id[]): Promise<readonly DefaultTag[]> {
  return request<readonly DefaultTag[]>("/settings/default-tags", {
    method: "PUT",
    body: { tagIds },
  });
}

/* -------------------------------------------------------------------- */
/* Datensicherung und Migration (A-20)                                  */
/* -------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------- */
/* Versionsprüfung (Abschnitt 18, E-069)                                */
/* -------------------------------------------------------------------- */

/**
 * Was der Dienst über die letzte Versionsprüfung weiß (A-18.2, E-069).
 *
 * ---------------------------------------------------------------------------
 * Die Naht zu T-138, und warum sie so schmal ist
 * ---------------------------------------------------------------------------
 *
 * **Die Route fragt GitHub nicht.** Sie gibt das Ergebnis heraus, das der
 * Dienst nach der Uhr ermittelt hat — beim Start, danach höchstens einmal in
 * 24 Stunden (E-069, Auflage A-V-10). Ein zweiter Abruf kostet deshalb nichts
 * und taktet nichts; genau darum darf die Oberfläche hier nachsehen, so oft
 * sie will.
 *
 * **Gelesen wird genau ein Feld.** Der Dienst liest aus GitHubs Antwort
 * ausschließlich `tag_name` (A-V-7); die Oberfläche liest aus seiner Antwort
 * ausschließlich `latestVersion`. Alles andere, was in der Antwort stehen mag,
 * wird nicht gelesen, nicht abgelegt und nicht angezeigt.
 *
 * **Und das eine Feld hat keinen Typ.** `unknown` ist hier keine Bequemlichkeit,
 * sondern die Aussage: Der Wert stammt aus einer fremden Antwort, und ein Typ
 * am Rand wäre eine Behauptung statt einer Prüfung. Er geht über
 * `foreignTextFrom` (E-063, T-133) in `decideUpdateNotice`, und erst die
 * Formprüfung dort macht aus ihm eine Fassung. „Noch nichts geprüft",
 * „nicht erreichbar" und „unbrauchbare Antwort" sehen für die Oberfläche
 * gleich aus, und das ist der Sinn: Sie zeigt in allen drei Fällen nichts
 * (A-18.11).
 */
export interface VersionCheckView {
  /**
   * Die zuletzt von GitHub gemeldete Fassung — oder etwas anderes, wenn nichts
   * geprüft werden konnte. Ungeprüft, ohne Typ, nie unbehandelt angezeigt.
   */
  readonly latestVersion: unknown;
}

/**
 * Was der Dienst zuletzt über die Fassungen auf GitHub erfahren hat.
 *
 * **Diese Anfrage löst keine Anfrage ins Netz aus** (Auflage A-V-10, E-069).
 * Der Dienst prüft nach der Uhr und legt das Ergebnis ab; diese Route liest es
 * nur. Läge der Netzaufruf im Anfragebehandler, taktete jeder lokale Prozess
 * mit dem Sitzungsgeheimnis das Lebenszeichen aus R-19 Punkt 3.
 *
 * Ein Fehlschlag dieser Route ist **kein Ereignis**: Die Oberfläche zeigt dann
 * dasselbe wie bei „alles aktuell", nämlich nichts (A-18.11).
 */
export function getVersionCheck(): Promise<VersionCheckView> {
  return request<VersionCheckView>("/version-check");
}
