import { request } from "../../api/client";
import type { Pagination } from "../../api/endpoints";
import type {
  CalendarDay,
  ExportPreview,
  ExportStatus,
  ExportTemplate,
  FileSystemPath,
  ForeignText,
  Id,
  Page,
  RoundingMode,
  ServiceText,
  SkippedExportGroup,
  TechnicalKey,
  Timestamp,
} from "../../api/types";

/**
 * Takt — die Routen und Typen des Exports, soweit sie **nur** dieses Merkmal
 * angehen (A-8.x, E-005, E-049, E-051, R-10, R-17).
 *
 * Neun Routen: drei am Bestand der Vorlagen, die Auswahlliste, die Vorschau
 * eines ungespeicherten Entwurfs, die Läufe und das Protokoll.
 *
 * **Zwei Exportrouten stehen ausdrücklich nicht hier**, und zwar aus demselben
 * Grund, aus dem `listTimeEntries` in `api/endpoints.ts` geblieben ist (siehe
 * `features/bookings/api.ts`): Was mehrere Flächen lesen, gehört keiner.
 *
 *   `listExportTemplates` — `features/settings/ExportSettings.tsx` liest die Liste
 *   ebenfalls, um die aktive Vorlage zu wählen.
 *
 *   `previewExport` — `app/dayGroup.ts` ruft sie an, und `app/` liegt
 *   **unter** den Merkmalen. Eine Einfuhr aus `features/export/` an dieser
 *   Stelle drehte die Richtung um.
 *
 * Dieselbe Trennung gilt für die Typen. `ExportTemplate`, `ExportValue`,
 * `ExportRow`, `ExportGroupSummary`, `ExportNotExportableReason`,
 * `SkippedExportGroup` und `ExportPreview` bleiben in `api/types.ts`: Sie
 * hängen an den beiden Routen, die dort geblieben sind, und `api/types.ts`
 * darf aus `features/` nichts einführen.
 */

/* -------------------------------------------------------------------- */
/* Die Auswahlliste einer Vorlage (E-049)                               */
/* -------------------------------------------------------------------- */

/**
 * `GET /export/sources` — die geschlossene Auswahlliste als **Auskunft des
 * Dienstes** (E-017, E-049).
 *
 * Bis E-049 stand sie zweimal: einmal im Motor und ein zweites Mal in
 * `features/export/exportTemplateModel.ts`, weil die Oberfläche
 * `@takt/export` nicht einbinden darf und keine Route hatte, die sie hätte
 * fragen können. Sie war die fünfte und letzte Doppelung dieses Projekts.
 * Jetzt fragt die Oberfläche, statt zu wissen.
 *
 * Ohne Parameter, ohne Bestand, für jeden Aufruf dieselbe Antwort.
 */

/**
 * Ein Quellenpfad, wie er in `definition.fields[].source` steht.
 *
 * **Bewusst `string` und keine aufgeschriebene Vereinigung.** Welche Pfade es
 * gibt, sagt seit E-049 der Dienst zur Laufzeit; eine Vereinigung hier wäre
 * genau die Doppelung, die E-049 beseitigt hat. Geprüft wird deshalb nicht am
 * Übersetzer, sondern gegen die geholte Liste — `parseTemplateDefinition` in
 * `exportTemplateModel.ts` weist alles ab, was nicht darauf steht, und die
 * Auswahllisten im Editor bieten nichts anderes an.
 *
 * Der Alias trägt trotzdem seinen Namen: Er sagt, **welcher** String hier
 * gemeint ist, und macht jede Stelle auffindbar, an der ein Quellenpfad durch
 * die Oberfläche läuft.
 */
export type ExportSourcePath = string;

/** Wert aus `EXPORT_TRANSFORMATIONS` des Motors. Englisch (E-015). */
export type ExportTransformation = string;

/** Vergleich einer Feldbedingung, etwa `is_set`. */
export type ExportConditionOperator = string;

/** Fachliche Ebene, aus der eine Quelle stammt. Nur zur Gliederung der Liste. */
export interface ExportSourceGroupInfo {
  readonly id: TechnicalKey;
  readonly label: ServiceText;
  /** Warum diese Ebene existiert. Steht als Erklärung über der Gruppe. */
  readonly hint: ServiceText;
}

export interface ExportSourceInfo {
  /** Der Wert, der in `definition.fields[].source` steht. Englisch (E-015). */
  readonly path: ExportSourcePath;
  readonly group: TechnicalKey;
  /** Deutsche Beschriftung in der Auswahlliste. */
  readonly label: ServiceText;
  /** Was diese Quelle liefert, in einem Satz. */
  readonly description: ServiceText;
}

export interface ExportTransformationInfo {
  readonly value: ExportTransformation;
  readonly label: ServiceText;
  /** Was die Transformation mit dem Wert macht, in einem Satz. */
  readonly effect: ServiceText;
}

export interface ExportConditionOperatorInfo {
  readonly value: ExportConditionOperator;
  readonly label: ServiceText;
}

export interface ExportSourceCatalog {
  readonly groups: readonly ExportSourceGroupInfo[];
  /** Alle wählbaren Quellen in Anzeigereihenfolge, nach `groups` sortiert. */
  readonly sources: readonly ExportSourceInfo[];
  readonly transformations: readonly ExportTransformationInfo[];
  readonly conditionOperators: readonly ExportConditionOperatorInfo[];
  /**
   * Der feste Satz unter der Quellenauswahl (A-7.2, T-005 Abschnitt 3.4).
   *
   * Er kommt mit der Liste, weil er eine Aussage über **diese** Liste ist:
   * Wer die Liste ausliefert, liefert auch die Begründung dafür, was nicht
   * darauf steht.
   */
  readonly noteBoundaryHint: ServiceText;
}

/* -------------------------------------------------------------------- */
/* Der Lauf und sein Protokoll                                          */
/* -------------------------------------------------------------------- */

export interface ExportRunGroup {
  readonly id: Id;
  readonly exportRunId: Id;
  readonly todoId: Id;
  readonly day: CalendarDay;
  readonly seconds: number;
  readonly quarters: number;
  readonly timeEntryIds?: readonly Id[];
}

export interface ExportRun {
  readonly id: Id;
  readonly templateId: Id;
  readonly filePath: FileSystemPath;
  readonly fileSha256: TechnicalKey;
  readonly bytes: number;
  readonly entryCount: number;
  readonly totalQuarters: number;
  readonly roundingMode: RoundingMode;
  readonly windowsUser?: ForeignText;
  /**
   * **Vom Dienst heute nicht geliefert.** Die Beschreibung führt das Feld, die
   * Antwort von `POST /export/runs` enthält es nicht (nachgemessen gegen den
   * laufenden Dienst). Die Oberfläche verlässt sich deshalb nicht darauf: Die
   * Zahl der geschriebenen Zeilen kommt aus der Vorschau, mit der derselbe
   * Lauf ausgelöst wurde — dieselbe Rechnung (R-17), nur eine Sekunde früher.
   */
  readonly groups?: readonly ExportRunGroup[];
  /** Die beim Lauf verwendete Vorlage, festgehalten. Wird hier nicht gelesen. */
  readonly templateSnapshot?: unknown;
  readonly createdAt: Timestamp;
}

/** `POST /export/runs` — der Lauf **und** was er ausgelassen hat (E-034). */
export interface ExportRunResult {
  readonly run: ExportRun;
  readonly skipped: readonly SkippedExportGroup[];
}

export interface ExportAuditEntry {
  readonly id: Id;
  readonly timeEntryId: Id;
  /** `not_billed` seit E-047: ausgebucht, ohne dass eine Datei entstand. */
  readonly event: "exported" | "reset" | "not_billed";
  readonly previousStatus: ExportStatus;
  readonly newStatus: ExportStatus;
  readonly exportRunId: Id | null;
  readonly exportRunGroupId: Id | null;
  readonly actor: ForeignText;
  readonly reason: ForeignText;
  readonly occurredAt: Timestamp;
}

/* ==================================================================== */
/* Routen                                                               */
/* ==================================================================== */

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
