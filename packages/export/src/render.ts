/** Gemeinsamer Renderer für Vorschau und Datei (R-17); Feldquellen bleiben ausdrücklich freigegeben. */

import type { ExportGroup, ExportSystemContext } from '@takt/domain/export';
import { quarterHoursToExportNumber } from '@takt/domain/export';

import { toBase64 } from './base64.ts';
import type {
  ExportFieldCondition,
  ExportFieldDefinition,
  ExportGroupSummary,
  ExportRowResult,
  ExportTransformation,
  ExportValue,
} from './model.ts';
import type { ExportGroupAggregate } from './sources.ts';
import { aggregateExportGroup, readExportSource } from './sources.ts';

/** Fehlende Werte bleiben null, auch bei der Kodierung. */
const applyTransformation = (
  transformation: ExportTransformation,
  value: ExportValue,
): ExportValue => {
  if (value === null) return null;

  switch (transformation) {
    case 'raw':
      return value;
    case 'base64':
      return toBase64(String(value));
    case 'quarter_hours_to_number':
      // Die Umrechnung kommt aus `packages/domain` und wird aufgerufen, nicht
      // nachgebaut (A-8.3). Sie erwartet ganze Viertelstunden; alles andere ist
      // eine falsch verdrahtete Vorlage und ergibt keinen Betrag.
      return typeof value === 'number' ? quarterHoursToExportNumber(value) : null;
    default:
      return null;
  }
};

/** Nur nichtleere Werte erfüllen „belegt“; Leerzeichen allein zählen nicht. */
const conditionHolds = (
  condition: ExportFieldCondition | undefined,
  group: ExportGroup,
  aggregate: ExportGroupAggregate,
  context: ExportSystemContext,
): boolean => {
  if (condition === undefined) return true;

  const value = readExportSource(condition.source, group, aggregate, context);
  const isSet = value !== null && String(value).trim().length > 0;

  return condition.op === 'is_not_set' ? !isSet : isSet;
};

const summarize = (group: ExportGroup, aggregate: ExportGroupAggregate): ExportGroupSummary => ({
  todoId: group.todoId,
  day: group.day,
  seconds: aggregate.seconds,
  quarters: aggregate.quarters,
  entryCount: aggregate.entryCount,
  timeEntryIds: aggregate.timeEntryIds,
  previouslyExported: group.previouslyExported,
});

/**
 * Eine Tagesgruppe ergibt eine Zeile. Vorlagen mit Leistungsfeld überspringen
 * Gruppen ohne Leistungstext (E-034). Interne Todo-Vermerke sind keine Feldquelle.
 */
export const renderExportGroup = (
  group: ExportGroup,
  fields: readonly ExportFieldDefinition[],
  context: ExportSystemContext,
): ExportRowResult => {
  const aggregate = aggregateExportGroup(group, context);
  const summary = summarize(group, aggregate);

  const exportsBookingNotes = fields.some((field) => field.source === 'group.bookingNotes');
  if (exportsBookingNotes && aggregate.bookingNotes.length === 0) {
    return { kind: 'not_exportable', reason: 'empty_note', group: summary };
  }

  // Ohne Prototyp bleibt auch __proto__ ein gewöhnlicher Schlüssel (B-3.2).
  // Das schützt Bibliotheksaufrufer, die die Vorlagenvalidierung umgehen.
  const row = Object.create(null) as Record<string, ExportValue>;

  for (const field of fields) {
    if (!conditionHolds(field.condition, group, aggregate, context)) continue;
    row[field.name] = applyTransformation(
      field.transformation,
      readExportSource(field.source, group, aggregate, context),
    );
  }

  return { kind: 'row', row, group: summary };
};
