/**
 * Takt — die Feldquellen als geschlossene Liste (E-017, E-033, R-06, B-3.1).
 *
 * Jede Quelle ist eine **ausgeschriebene Zugriffsfunktion**, kein ausgewerteter
 * Pfad. Das ist der Unterschied, an dem die Datenschutzgrenze hängt: Ein
 * generischer Auflöser `get(objekt, "a.b.c")` wäre ein Leseprimitiv auf alles,
 * was man ihm übergibt. Jedes Feld, das irgendwann an `ExportGroup` oder
 * `ExportCandidate` dazukommt, wäre damit sofort exportierbar, ohne dass es
 * jemand entschieden hätte. Der `switch` unten kann das nicht: Was keinen Zweig
 * hat, hat keinen Wert.
 *
 * `booking.*` gibt es nicht (E-033). Seit E-020 entsteht eine Exportzeile aus
 * einer Tagesgruppe; ein Pfad, der weiter `booking` hieße und die Gruppe meinte,
 * wäre der stille Bedeutungswechsel, den T-013 beseitigt hat.
 */

import type { ExportGroup, ExportSourcePath, ExportSystemContext } from '@takt/domain/export';
import { roundToQuarterHours } from '@takt/domain/export';

import { mergeBookingNotes } from './merge-notes.ts';
import type { ExportTimeEntryId, ExportValue } from './model.ts';

/**
 * Die Liste, gegen die validiert wird — an den Typ der Domäne gebunden.
 *
 * `Record<ExportSourcePath, true>` erzwingt Vollständigkeit beim Übersetzen:
 * Nimmt die Domäne eine Quelle auf, fehlt hier ein Schlüssel und `tsc` bricht
 * ab. Nimmt jemand hier einen Schlüssel auf, den die Domäne nicht kennt, bricht
 * es ebenso. Damit kann die Auswahlliste des Vorlageneditors nicht von der
 * abschließenden Liste abweichen — weder nach oben noch nach unten.
 */
const SOURCE_PRESENCE: Readonly<Record<ExportSourcePath, true>> = {
  'todo.callNumber': true,
  'todo.title': true,
  'todo.tags': true,
  'group.day': true,
  'group.quarters': true,
  'group.durationSeconds': true,
  'group.bookingNotes': true,
  'group.startedAt': true,
  'group.endedAt': true,
  'group.entryCount': true,
  'system.windowsUser': true,
  'system.exportedAt': true,
};

/** Alle wählbaren Quellen in Anzeigereihenfolge. Für den Vorlageneditor (S-14). */
export const EXPORT_SOURCE_PATHS: readonly ExportSourcePath[] = Object.keys(
  SOURCE_PRESENCE,
) as readonly ExportSourcePath[];

const KNOWN_SOURCES: ReadonlySet<string> = new Set<string>(EXPORT_SOURCE_PATHS);

/**
 * Ist der Wert wörtlich eine gelistete Quelle?
 *
 * **Ohne jede Normalisierung.** `" todo.callNumber "` mit Leerzeichen,
 * `"Todo.CallNumber"` in anderer Schreibweise und `"todo.callnumber"` sind
 * allesamt keine gelistete Quelle und werden abgewiesen. Tolerantes Abgleichen
 * wäre der Anfang eines Auflösers: Wer Leerzeichen verzeiht, verzeiht als
 * Nächstes Groß- und Kleinschreibung, und dann trifft `Todo.Note` irgendwann
 * doch (E-017, TP-TPL-08).
 */
export const isExportSourcePath = (value: unknown): value is ExportSourcePath =>
  typeof value === 'string' && KNOWN_SOURCES.has(value);

/**
 * Die abgeleiteten Werte einer Tagesgruppe.
 *
 * Hier wird summiert und **danach** gerundet (E-008, E-020). Die umgekehrte
 * Reihenfolge machte aus 10, 20 und 5 Minuten 1,00 statt 0,75 und rechnete
 * damit still zu viel ab.
 */
export interface ExportGroupAggregate {
  /** Ungerundete Summe über die enthaltenen Buchungen. */
  readonly seconds: number;
  /** Gerundete Viertelstunden, oder `null` bei nicht positiver Dauer. */
  readonly quarters: number | null;
  /** Die zusammengeführten Leistungstexte (E-026, E-028). */
  readonly bookingNotes: string;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly entryCount: number;
  readonly timeEntryIds: readonly ExportTimeEntryId[];
}

/**
 * Rechnet die Gruppe zusammen.
 *
 * **Es wird nichts gefiltert.** `ExportGroup.entries` enthält per Vertrag
 * ausschließlich offene Buchungen; die Sicht `v_export_candidate` filtert
 * bereits in SQL. Sind von drei Buchungen eines Tages zwei offen, wird über
 * zwei summiert — die dritte ist abgerechnet und bleibt es. Eine Umsetzung, die
 * hier „der Vollständigkeit halber" nachlädt oder eine bereits exportierte
 * Buchung wieder hereinnimmt, rechnet stillschweigend doppelt ab (R-10).
 *
 * Die Rundung kommt aus `packages/domain` und wird hier **aufgerufen**, nicht
 * nachgebaut. Sie ist die einzige Stelle im Projekt, an der die Regel steht;
 * eine zweite Fassung wäre eine zweite Wahrheit über einen Rechnungsbetrag.
 */
export const aggregateExportGroup = (
  group: ExportGroup,
  context: ExportSystemContext,
): ExportGroupAggregate => {
  let seconds = 0;
  let startedAt: string | null = null;
  let endedAt: string | null = null;
  const notes: string[] = [];
  const timeEntryIds: ExportTimeEntryId[] = [];

  for (const entry of group.entries) {
    seconds += entry.durationSeconds;
    notes.push(entry.bookingNote);
    timeEntryIds.push(entry.timeEntryId);

    // Zeitstempel sind lexikographisch sortierbar (siehe `Timestamp` in
    // kernel.ts) — ein Datumsobjekt braucht es dafür nicht.
    if (startedAt === null || entry.startedAt < startedAt) startedAt = entry.startedAt;
    if (endedAt === null || entry.endedAt > endedAt) endedAt = entry.endedAt;
  }

  return {
    seconds,
    quarters: roundToQuarterHours(seconds, context.roundingMode),
    bookingNotes: mergeBookingNotes(notes),
    startedAt,
    endedAt,
    entryCount: group.entries.length,
    timeEntryIds,
  };
};

/**
 * Liest eine Quelle. Ein Zweig je Quelle, ausgeschrieben (E-017).
 *
 * Der `default`-Zweig ist unerreichbar, solange der Aufrufer eine geprüfte
 * Vorlage übergibt — er steht für den Fall, dass jemand am Vorlageneditor vorbei
 * eine unbekannte oder gesperrte Quelle einschleust. Dann ist der Wert `null`,
 * nie geraten und nie nachgeschlagen. Das ist die Stelle, an der `todo.notiz`
 * landete, wenn es die Validierung je passierte: bei nichts.
 */
export const readExportSource = (
  source: ExportSourcePath,
  group: ExportGroup,
  aggregate: ExportGroupAggregate,
  context: ExportSystemContext,
): ExportValue => {
  switch (source) {
    case 'todo.callNumber':
      return group.todoCallNumber;
    case 'todo.title':
      return group.todoTitle;
    case 'todo.tags':
      return group.todoTagNames.join(', ');
    case 'group.day':
      return group.day;
    case 'group.quarters':
      return aggregate.quarters;
    case 'group.durationSeconds':
      return aggregate.seconds;
    case 'group.bookingNotes':
      return aggregate.bookingNotes;
    case 'group.startedAt':
      return aggregate.startedAt;
    case 'group.endedAt':
      return aggregate.endedAt;
    case 'group.entryCount':
      return aggregate.entryCount;
    case 'system.windowsUser':
      return context.windowsUser;
    case 'system.exportedAt':
      return context.exportedAt;
    default:
      return null;
  }
};
