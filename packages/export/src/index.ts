/**
 * Nur `@takt/domain/export` einbinden; der Wurzeleinstieg und die Speicherung würden den internen
 * Vermerk erreichbar machen.
 */

export { fromBase64, toBase64 } from './base64.ts';
export { mergeBookingNotes, NOTE_SEPARATOR } from './merge-notes.ts';
export type {
  ExportConditionOperator,
  ExportFieldCondition,
  ExportFieldDefinition,
  ExportFieldIssue,
  ExportGroupSummary,
  ExportNotExportableReason,
  ExportResult,
  ExportRow,
  ExportRowResult,
  ExportTemplateDefinition,
  ExportTemplateError,
  ExportTemplateErrorCode,
  ExportTimeEntryId,
  ExportTransformation,
  ExportValue,
} from './model.ts';
export type { ExportRunPlan, SkippedExportGroup } from './plan.ts';
export { planExportRun, serializeExportRows } from './plan.ts';
export { renderExportGroup } from './render.ts';
export type { ExportGroupAggregate } from './sources.ts';
export { aggregateExportGroup, EXPORT_SOURCE_PATHS, isExportSourcePath, readExportSource } from './sources.ts';
export {
  BUILTIN_EXPORT_TEMPLATE,
  EXPORT_CONDITION_OPERATORS,
  EXPORT_TRANSFORMATIONS,
  validateExportTemplateDefinition,
  validateExportTemplateField,
} from './template.ts';
