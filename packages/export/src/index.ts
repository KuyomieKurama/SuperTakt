/**
 * Takt — öffentliche Fläche des Exportvorlagen-Motors.
 *
 * Was dieses Paket **nicht** einbindet, ist so wichtig wie das, was es
 * ausliefert: nicht `@takt/storage` und nicht `@takt/domain` als Ganzes,
 * sondern ausschließlich `@takt/domain/export`. Über den Wurzeleinstieg der
 * Domäne wären `Todo` und `TodoNote` erreichbar, und damit der interne Vermerk
 * (A-7.2, R-06). `pnpm boundaries` prüft das bei jedem Lauf; der Wächter steht
 * in `packages/domain/scripts/check-export-boundary.mjs`.
 *
 * ---------------------------------------------------------------------------
 * Warum die internen Importe hier `.ts` heißen und nicht `.js`
 * ---------------------------------------------------------------------------
 *
 * Bis T-028 stand hier `./base64.js` — die Schreibweise, die TypeScript für
 * ausgegebenes JavaScript vorsieht. Nur gibt dieses Paket nichts aus: Es wird
 * gebündelt (Vite in der Oberfläche, esbuild im Sidecar) oder unmittelbar aus
 * dem Quelltext geladen. Für den zweiten Fall braucht `.js` einen
 * Auflösungshaken, denn Node nimmt die Endung wörtlich und findet nichts.
 *
 * Ein Haken, der eine falsche Endung im Vorbeigehen richtigstellt, ist eine
 * Krücke, und Krücken bleiben. `allowImportingTsExtensions` steht in
 * `tsconfig.base.json`, `moduleResolution` ist `bundler` — die Endung darf also
 * das sein, was die Datei wirklich ist. Damit lädt der Motor mit blankem
 * `node`, ohne Vorbereitung, und jeder Prüfpfad kann ihn ohne Zurüstung
 * aufrufen.
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
