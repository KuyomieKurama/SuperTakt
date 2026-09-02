/**
 * Takt — der Renderer (R-17, E-020, E-026, E-034, A-8.2 bis A-8.5).
 *
 * **Ein Renderer für Vorschau und Datei.** Zwei Wege wären genau an der Stelle
 * blind, für die die Vorschau da ist: Der Benutzer sähe das eine und
 * verschickte das andere, und der Unterschied fiele erst dem Empfänger auf.
 * Deshalb gibt es hier eine einzige Funktion, die aus einer Tagesgruppe eine
 * Zeile macht — S-07, S-14 und der Exportlauf rufen dieselbe.
 *
 * Rein: keine Uhr, keine Datei, kein Netz. Alles, was von außen kommt, steht in
 * `ExportSystemContext` und wird übergeben.
 */

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

/**
 * Wendet die Transformation eines Feldes an.
 *
 * `null` bleibt `null`. Ein fehlender Wert wird nicht zu `""` und nicht zu
 * `"null"` kodiert: Für das Abrechnungstool ist eine leere Zeichenkette etwas
 * anderes als ein fehlender Wert, und Base64 über das Wort „null" wäre eine
 * erfundene Angabe.
 */
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

/**
 * Trifft die Bedingung eines Feldes zu (A-8.7)?
 *
 * „Belegt" heißt: nicht `null` und nicht nur aus Leerzeichen bestehend. Ein
 * Feld, dessen Quelle bloß Leerzeichen enthält, gilt als leer — sonst hinge die
 * Ausgabe an einem unsichtbaren Zeichen.
 */
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
 * Erzeugt aus einer Tagesgruppe genau eine Exportzeile — oder meldet, dass sie
 * nicht exportierbar ist.
 *
 * Die Schlüssel der Zeile stehen in der Reihenfolge der Felder der Vorlage; ein
 * Feld mit nicht erfüllter Bedingung fehlt vollständig.
 *
 * **E-034, die leere Tagesgruppe.** Führt die Vorlage ein Feld mit der Quelle
 * `group.bookingNotes` und ist der zusammengeführte Leistungstext leer, ist die
 * Gruppe nicht exportierbar: Das Abrechnungstool nimmt keine leere Notiz an.
 * Das Ergebnis ist `not_exportable` mit Grund — kein Fehler, kein Abbruch. Der
 * übrige Export läuft durch, die Gruppe bleibt offen und erscheint beim
 * nächsten Mal wieder. Ein Platzhaltertext käme nicht in Frage; das hieße,
 * erfundene Daten an den Kunden zu schicken.
 *
 * Die Regel hängt am tatsächlich konfigurierten Feld, nicht an der Buchung an
 * sich: Eine Vorlage ohne Leistungsfeld kann von einer leeren Notiz nicht
 * aufgehalten werden.
 *
 * **Der interne Vermerk kommt hier nicht vor** — weder im Klartext noch
 * base64-kodiert, weder in dieser noch in irgendeiner anderen Vorlage. Nicht
 * weil diese Funktion ihn auslässt, sondern weil `ExportGroup` ihn nicht trägt
 * und `readExportSource` keinen Zweig hat, der ihn liefern könnte (A-7.2, R-06,
 * R-18).
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

  /**
   * Die Zeile wird **ohne Prototyp** gebaut (B-3.2, T-034).
   *
   * `{}` erbt von `Object.prototype`, und eine Zuweisung an `__proto__` ist
   * dort keine Zuweisung, sondern ein Aufruf des Setters: Der Wert verschwindet
   * spurlos, und je nach Sorte nimmt er die ganze Zeile mit. In T-023 gemessen:
   * `{"Call":null,"Zeit":0.25}` ohne das konfigurierte Feld, im anderen Fall
   * `{}`.
   *
   * `validateExportTemplateField` weist einen solchen Namen inzwischen beim
   * Speichern ab, und das ist die Schicht, die dem Benutzer etwas sagt. Diese
   * hier sagt niemandem etwas — sie sorgt nur dafür, dass ein Feldname, wie er
   * auch heiße, in dieser Zeile eine gewöhnliche Eigenschaft wird und keine
   * Sonderbedeutung hat. Zwei Schichten, weil ein stiller Feldverlust in einer
   * Abrechnungsdatei nirgends auffällt.
   *
   * **Warum die Zeile hier steht und nicht in der Prüfung** (nachgemessen in
   * T-046): Diese Funktion ist die Stelle, an der alle Wege zusammenlaufen.
   * Vorschau und Lauf rufen `planExportRun` und damit dieselbe Zeile (R-17),
   * und ein Aufrufer, der den Motor als Bibliothek benutzt, kommt ebenfalls
   * hier vorbei — auch dann, wenn er `validateExportTemplateDefinition` nie
   * aufgerufen hat. Genau das ist der Zustand, den ein `INSERT` in
   * `export_template` oder ein Bestand von vor T-034 herstellt. Die Prüfung
   * kann er umgehen; diesen Aufruf nicht.
   *
   * `JSON.stringify` behandelt ein Objekt ohne Prototyp wie jedes andere; an
   * der erzeugten Datei ändert sich nichts.
   */
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
