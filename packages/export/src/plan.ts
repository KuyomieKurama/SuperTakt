/**
 * Den vollständigen Plan vor jedem Schreibzugriff erstellen. Vorschau und Export verwenden
 * dieselben Zeilen und Buchungskennungen.
 */

import type { ExportGroup, ExportSystemContext } from '@takt/domain/export';

import type {
  ExportFieldDefinition,
  ExportGroupSummary,
  ExportNotExportableReason,
  ExportRow,
  ExportTimeEntryId,
} from './model.ts';
import { renderExportGroup } from './render.ts';

/** Eine Tagesgruppe, die nicht in die Datei geht, den Lauf aber nicht aufhält. */
export interface SkippedExportGroup {
  readonly group: ExportGroupSummary;
  readonly reason: ExportNotExportableReason;
}

/**
 * Das vollständige Ergebnis eines Laufs, vor jedem Schreibvorgang.
 *
 * `rows[i]` gehört zu `groups[i]`. Die beiden Listen laufen parallel, damit der
 * schreibende Teil je Zeile ein `export_run_group` mit `seconds` und `quarters`
 * und dazu die `export_run_entry` anlegen kann, ohne noch einmal zu rechnen.
 */
export interface ExportRunPlan {
  readonly rows: readonly ExportRow[];
  readonly groups: readonly ExportGroupSummary[];
  readonly skipped: readonly SkippedExportGroup[];
  /** Anzahl der zu markierenden **Buchungen**, nicht der Zeilen. */
  readonly entryCount: number;
  /** Summe der Viertelstunden über die Zeilen. */
  readonly totalQuarters: number;
  /** R-10: Zeilen, die eine zurückgesetzte Buchung enthalten. */
  readonly previouslyExportedCount: number;
  /** Alle Buchungen des Laufs, in Zeilenreihenfolge. Für die Markierung. */
  readonly timeEntryIds: readonly ExportTimeEntryId[];
}

/**
 * Plant einen Exportlauf über bereits gruppierte, ausschließlich offene
 * Buchungen.
 *
 * Die Gruppen kommen aus `groupExportCandidates` beziehungsweise aus
 * `ExportReadPort.openGroups` und enthalten per Vertrag nur offene Buchungen.
 * Diese Funktion filtert nicht nach — eine bereits exportierte Buchung darf
 * nicht hier aussortiert werden müssen, sondern gelangt gar nicht erst hierher
 * (R-10).
 *
 * Eine nicht exportierbare Gruppe (E-034) landet in `skipped` und **nicht** in
 * `rows`. Ihre Buchungen stehen folglich auch nicht in `timeEntryIds`, werden
 * also nicht markiert und bleiben offen. Genau das verlangt E-034: Der übrige
 * Export läuft durch, die ausgelassene Gruppe erscheint beim nächsten Mal
 * wieder.
 */
export const planExportRun = (
  groups: readonly ExportGroup[],
  fields: readonly ExportFieldDefinition[],
  context: ExportSystemContext,
): ExportRunPlan => {
  const rows: ExportRow[] = [];
  const rowGroups: ExportGroupSummary[] = [];
  const skipped: SkippedExportGroup[] = [];
  const timeEntryIds: ExportTimeEntryId[] = [];

  let entryCount = 0;
  let totalQuarters = 0;
  let previouslyExportedCount = 0;

  for (const group of groups) {
    const result = renderExportGroup(group, fields, context);

    if (result.kind === 'not_exportable') {
      skipped.push({ group: result.group, reason: result.reason });
      continue;
    }

    rows.push(result.row);
    rowGroups.push(result.group);
    timeEntryIds.push(...result.group.timeEntryIds);

    entryCount += result.group.entryCount;
    totalQuarters += result.group.quarters ?? 0;
    if (result.group.previouslyExported) previouslyExportedCount += 1;
  }

  return {
    rows,
    groups: rowGroups,
    skipped,
    entryCount,
    totalQuarters,
    previouslyExportedCount,
    timeEntryIds,
  };
};

/**
 * Erzeugt den Inhalt der Exportdatei (A-8.1).
 *
 * Ein JSON-Feld von Zeilen, eingerückt und mit abschließendem Zeilenumbruch.
 * Deterministisch: Zwei Läufe über denselben Bestand ergeben byteweise dieselbe
 * Datei — Voraussetzung dafür, dass `export_run.file_sha256` überhaupt etwas
 * belegt.
 *
 * A-8.9: Der Inhalt ist Klartext. Base64 im Feld `Notiz` ist eine Kodierung,
 * keine Verschlüsselung; die Datei enthält Kundendaten.
 */
export const serializeExportRows = (rows: readonly ExportRow[]): string =>
  `${JSON.stringify(rows, null, 2)}\n`;
