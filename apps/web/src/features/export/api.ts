import { request } from "../../api/client";
import type {
  Pagination,
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

/* Die Auswahlliste einer Vorlage (E-049)                               */

/** Die erlaubten Exportquellen liefert der Dienst. */

/** Der Dienst prüft den Pfad gegen seine erlaubten Exportquellen. */
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
  /** Hinweis zur ausgeschlossenen internen Notiz. */
  readonly noteBoundaryHint: ServiceText;
}

/* Der Lauf und sein Protokoll                                          */

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
  /** Die Vorschau liefert die Zeilenzahl; dieses optionale Antwortfeld darf nicht vorausgesetzt werden. */
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

/* Routen                                                               */

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

export function getExportSources(): Promise<ExportSourceCatalog> {
  return request<ExportSourceCatalog>("/export/sources");
}

/** Prüft und rendert ohne Schreibzugriff. `definition` und `templateId` schließen sich aus. */
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

/** Datei und Exportmarkierungen entstehen gemeinsam oder gar nicht; übersprungene Einträge bleiben in der Antwort sichtbar. */
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

/** Das Protokoll wird nur ergänzt; `timeEntryId` schränkt die paginierte Liste ein. */
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

export function listExportTemplates(): Promise<readonly ExportTemplate[]> {
  return request<readonly ExportTemplate[]>("/export/templates");
}

/** `null` wählt die aktive Vorlage. `definition` muss fehlen, da der Dienst die Anwesenheit des Schlüssels prüft. */
export function previewExport(
  templateId: Id | null,
  timeEntryIds: readonly Id[] = [],
): Promise<ExportPreview> {
  return request<ExportPreview>("/export/preview", {
    method: "POST",
    body: { templateId, timeEntryIds },
  });
}
