/**
 * Der Exportmotor darf ausschließlich diesen Einstiegspunkt verwenden; interne Todo-Vermerke sind
 * darüber nicht erreichbar.
 */

import type {
  CalendarDay,
  ExportRunGroupId,
  ExportRunId,
  ExportTemplateId,
  QuarterHours,
  Seconds,
  TimeEntryId,
  Timestamp,
  TodoId,
} from './kernel.ts';
import { resolveTimeZone, toCalendarDay } from './kernel.ts';
import type { RoundingMode } from './rounding.ts';

/** Die gemeinsame Rundung über den eingeschränkten Export-Einstiegspunkt erreichbar halten. */
export { quarterHoursToExportNumber, roundToQuarterHours } from './rounding.ts';
export type { RoundingMode, SecondsPerQuarterHour } from './rounding.ts';

// Der einzige Datensatz, den der Exportmotor zu sehen bekommt

/**
 * Nur freigegebene Exportfelder; `bookingNote` ist die abrechenbare Leistung, niemals der interne
 * Todo-Vermerk.
 */
export interface ExportCandidate {
  readonly timeEntryId: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  readonly durationSeconds: Seconds;
  /** Buchungsnotiz nach A-7.3, Oberflächenbegriff „Leistung". */
  readonly bookingNote: string;
  readonly todoTitle: string;
  readonly todoCallNumber: string | null;
  readonly todoTagNames: readonly string[];
  /** R-10: war diese Buchung schon einmal in einem Exportlauf? */
  readonly previouslyExported: boolean;
}

// Gruppierung: eine Exportzeile je Todo und Kalendertag

/**
 * Nicht leere, nach Startzeit sortierte Gruppe ausschließlich offener Buchungen. Vor der Rundung
 * summieren; es gilt der lokale Starttag.
 */
export interface ExportGroup {
  readonly todoId: TodoId;
  /** Gruppierungsachse neben dem Todo. Siehe `CalendarDay` in kernel.ts. */
  readonly day: CalendarDay;
  /** Nur offene Buchungen, nach `startedAt` aufsteigend, nie leer. */
  readonly entries: readonly ExportCandidate[];
  readonly todoTitle: string;
  readonly todoCallNumber: string | null;
  readonly todoTagNames: readonly string[];
  /** R-10: mindestens eine Buchung der Gruppe war schon einmal exportiert. */
  readonly previouslyExported: boolean;
}

/** Leere Texte überspringen und die Reihenfolge von `ExportGroup.entries` erhalten. */
export type ExportNoteSeparator = '; ';

/** Werte, die nicht aus der Buchung stammen, sondern aus dem System (E-010). */
export interface ExportSystemContext {
  /** Vom Betriebssystem gelesen, keine Benutzereingabe (E-010, A-8.5). */
  readonly windowsUser: string;
  readonly exportedAt: Timestamp;
  readonly roundingMode: RoundingMode;
}

// Quellenpfade — die abschließende Liste (E-005, E-017, R-06)

/**
 * Geschlossene Quellenliste ohne internen Vermerk. Abgerechnet wird mit `group.quarters`;
 * ungerundete Sekunden dienen nur Kontrollangaben.
 */
export type ExportSourcePath =
  | 'todo.callNumber'
  | 'todo.title'
  | 'todo.tags'
  // Tagesgruppe — die Einheit, aus der genau eine Exportzeile entsteht (E-020).
  | 'group.day'
  /** Gerundet, Minimum 0,25 (E-008). Die Quelle für `Zeit`. */
  | 'group.quarters'
  /** Ungerundete Summe der Gruppe. Keine Abrechnungsgröße. */
  | 'group.durationSeconds'
  /** `bookingNotes` unterscheidet die abrechenbare Leistung ausdrücklich vom internen Todo-Vermerk. */
  | 'group.bookingNotes'
  /** Beginn der ersten Buchung der Gruppe. */
  | 'group.startedAt'
  /** Ende der letzten Buchung der Gruppe. */
  | 'group.endedAt'
  /** Anzahl der zusammengefassten Buchungen. Für Kontrollspalten. */
  | 'group.entryCount'
  | 'system.windowsUser'
  | 'system.exportedAt';

// Typbehauptungen: die Notiz-Grenze am Übersetzer (R-06)

/** Reiner Typ, kein Laufzeitanteil. `Assert<false>` verletzt seine Randbedingung. */
type Assert<T extends true> = T;

/** Macht das Hinzufügen eines internen Notizpfads bereits zum Typfehler. */
export type NoteBoundaryIsSealed = Assert<
  Extract<ExportSourcePath, `todo.note${string}` | `todo.notiz${string}`> extends never
    ? true
    : false
>;

/**
 * Gegenprobe: Jeder Quellenpfad, der mit `todo.` beginnt, muss ein Feld von
 * `ExportCandidate` treffen. So kann die Liste nicht um einen Pfad wachsen, für
 * den es im Kandidaten gar keinen Wert gibt — und damit auch nicht um einen
 * Pfad, der stillschweigend anderswo nachgeladen werden müsste.
 */
export type TodoSourcesAreCovered = Assert<
  Extract<ExportSourcePath, `todo.${string}`> extends 'todo.callNumber' | 'todo.title' | 'todo.tags'
    ? true
    : false
>;

/**
 * Unqualifizierte Notiznamen auf jeder Ebene sperren, damit Leistung und interner Vermerk nicht
 * verwechselt werden.
 */
export type NoSourceIsCalledPlainNote = Assert<
  Extract<
    ExportSourcePath,
    `${string}.note` | `${string}.notiz` | `${string}.vermerk`
  > extends never
    ? true
    : false
>;

/**
 * `booking.*` ist fort und bleibt fort (E-033).
 *
 * Die Exportzeile entsteht aus der Tagesgruppe. Käme ein `booking.`-Pfad
 * zurück, meinte er zwangsläufig etwas anderes als sein Name sagt — und der
 * Unterschied fiele erst in einer Rechnung auf.
 */
export type BookingSourcesAreGone = Assert<
  Extract<ExportSourcePath, `booking.${string}`> extends never ? true : false
>;

/**
 * Gegenprobe für die Gruppenquellen, wie sie für `todo.*` schon besteht: Jeder
 * `group.`-Pfad muss in dieser Aufzählung stehen. Damit kann die Liste nicht um
 * einen Pfad wachsen, für den die Gruppe gar keinen Wert hergibt.
 */
export type GroupSourcesAreCovered = Assert<
  Extract<ExportSourcePath, `group.${string}`> extends
    | 'group.day'
    | 'group.quarters'
    | 'group.durationSeconds'
    | 'group.bookingNotes'
    | 'group.startedAt'
    | 'group.endedAt'
    | 'group.entryCount'
    ? true
    : false
>;

/**
 * Auch deutsche und unqualifizierte Notiznamen sperren, falls sie später in exportnahen Typen
 * auftauchen.
 */
type ForbiddenNoteKey =
  | 'note'
  | 'notiz'
  | 'vermerk'
  | 'todoNote'
  | 'todoNotiz'
  | 'todoVermerk';

/** Der Buchungssatz trägt keinen Vermerk. Bricht mit TS2344, sobald doch. */
export type ExportCandidateHasNoTodoNote = Assert<
  Extract<keyof ExportCandidate, ForbiddenNoteKey> extends never ? true : false
>;

/**
 * Dieselbe Zusicherung eine Ebene höher, für die Tagesgruppe.
 *
 * Die Gruppe ist die neue Eingabe des Vorlagen-Motors. Ohne diese Behauptung
 * wäre sie die naheliegendste Stelle, an der jemand „den Kontext des Todos"
 * anreichert und dabei den Vermerk mitnimmt. Der zusammengeführte Text einer
 * Zeile darf ausschließlich aus `entries[].bookingNote` entstehen.
 */
export type ExportGroupHasNoTodoNote = Assert<
  Extract<keyof ExportGroup, ForbiddenNoteKey> extends never ? true : false
>;

// Vorlagenhülle — Tabelle `export_template`

/**
 * Umschlag einer Exportvorlage, so wie die Speicherung sie führt.
 *
 * Die Feldliste in `definition` gehört T-007 und `packages/export`; die Domäne
 * kennt nur Kennung, Name, Unlöschbarkeit und die Tatsache, dass es sich um
 * gültiges JSON handelt. So kann der Vorlagen-Motor sein Format
 * weiterentwickeln, ohne dass Domäne oder Schema mitwandern müssen.
 */
export interface ExportTemplateEnvelope {
  readonly id: ExportTemplateId;
  readonly name: string;
  /** A-8.7: die mitgelieferte Standardvorlage. Kopierbar, nicht löschbar. */
  readonly isBuiltin: boolean;
  readonly definition: unknown;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// Exportlauf (A-8.8) — Tabelle `export_run`

/**
 * Vorlagensnapshot und Dateihash halten den historischen Export nachvollziehbar.
 * `entryCount` zählt Buchungen, `totalQuarters` summiert die gerundeten Exportzeilen.
 */
export interface ExportRun {
  readonly id: ExportRunId;
  readonly templateId: ExportTemplateId;
  readonly templateSnapshot: unknown;
  readonly filePath: string;
  readonly fileSha256: string;
  readonly bytes: number;
  readonly entryCount: number;
  readonly totalQuarters: QuarterHours;
  readonly roundingMode: RoundingMode;
  readonly windowsUser: string;
  readonly createdAt: Timestamp;
}

/**
 * Der gerundete Wert gehört zur Tagesgruppe; eine Aufteilung auf einzelne Buchungen wäre
 * willkürlich.
 */
export interface ExportRunGroup {
  readonly id: ExportRunGroupId;
  readonly exportRunId: ExportRunId;
  readonly todoId: TodoId;
  /** Starttag der Buchungen, `YYYY-MM-DD`. */
  readonly day: CalendarDay;
  /** Ungerundete Summe der enthaltenen Buchungen. */
  readonly seconds: Seconds;
  /** Gerundeter Wert der Zeile. Der einzige Ort, an dem er steht. */
  readonly quarters: QuarterHours;
}

/**
 * Welche Buchung in welche Exportzeile eingegangen ist.
 * Tabelle `export_run_entry`. Anhängend und unveränderlich.
 *
 * `durationSeconds` ist die ungerundete Dauer der Buchung, **nicht** ihr Anteil
 * an den Viertelstunden der Gruppe. Ein solcher Anteil existiert nicht.
 */
export interface ExportRunEntry {
  readonly exportRunGroupId: ExportRunGroupId;
  readonly timeEntryId: TimeEntryId;
  readonly durationSeconds: Seconds;
}

/**
 * Leere Auswahl bedeutet alle offenen Buchungen. Bei expliziter Auswahl lässt ein bereits
 * exportierter Eintrag den gesamten Lauf scheitern.
 */
export interface ExportJob {
  readonly templateId: ExportTemplateId;
  readonly timeEntryIds: readonly TimeEntryId[];
  readonly now: Timestamp;
}

/** Ergebnis einer Vorschau (A-8.7, S-14, R-17). Schreibt nichts und ändert nichts. */
export interface ExportPreview {
  readonly rows: readonly unknown[];
  readonly entryCount: number;
  readonly totalQuarters: QuarterHours;
  readonly roundingMode: RoundingMode;
  /** Buchungen, die schon einmal exportiert und zurückgesetzt wurden (R-10). */
  readonly previouslyExportedCount: number;
}

// Umsetzung: Gruppierung je Todo und Kalendertag (T-009, E-020, E-025)

/** Zwischenstand beim Einsortieren. Nur innerhalb dieser Datei sichtbar. */
interface CandidateBucket {
  readonly todoId: TodoId;
  readonly day: CalendarDay;
  readonly todoTitle: string;
  readonly todoCallNumber: string | null;
  readonly todoTagNames: readonly string[];
  readonly entries: ExportCandidate[];
}

/**
 * Die Kennung stabilisiert die Reihenfolge bei gleicher Startzeit und damit auch die
 * zusammengeführten Leistungstexte.
 */
const entrySortKey = (entry: ExportCandidate): string => entry.startedAt + entry.timeEntryId;

/**
 * Sortierschlüssel einer Gruppe: Tag, dann Todo.
 *
 * Der Kalendertag hat immer zehn Zeichen, deshalb ist auch dieser Schlüssel
 * ohne Trennzeichen eindeutig — und er ist es überhaupt, weil genau diese
 * beiden Werte die Gruppe bestimmen. Zwei Läufe über denselben Bestand
 * erzeugen damit dieselbe Datei in derselben Zeilenfolge (R-17).
 */
const groupSortKey = (group: ExportGroup): string => group.day + group.todoId;

/**
 * Die SQL-Sicht liefert bereits ausschließlich offene Buchungen; keine weiteren Buchungen
 * nachladen.
 * Nach lokalem Starttag gruppieren, auch bei Buchungen über Mitternacht.
 */
export const groupExportCandidates = (
  candidates: readonly ExportCandidate[],
  timeZone: string = resolveTimeZone(),
): readonly ExportGroup[] => {
  const buckets = new Map<string, CandidateBucket>();

  for (const candidate of candidates) {
    const day = toCalendarDay(candidate.startedAt, timeZone);

    // Der Kalendertag hat immer genau zehn Zeichen (`YYYY-MM-DD`), deshalb
    // braucht dieser Schlüssel kein Trennzeichen: Zwei verschiedene Paare aus
    // Tag und Todo können nie dieselbe Zeichenkette ergeben.
    const key = day + candidate.todoId;

    const existing = buckets.get(key);
    if (existing === undefined) {
      buckets.set(key, {
        todoId: candidate.todoId,
        day,
        todoTitle: candidate.todoTitle,
        todoCallNumber: candidate.todoCallNumber,
        todoTagNames: candidate.todoTagNames,
        entries: [candidate],
      });
    } else {
      existing.entries.push(candidate);
    }
  }

  const groups = [...buckets.values()].map((bucket): ExportGroup => {
    // Nach Startzeit aufsteigend. Diese Reihenfolge ist zugleich die, in der der
    // Vorlagen-Motor die Leistungstexte zusammenführt (E-026) — sie wird hier
    // einmal festgelegt und dort nicht erneut gemischt.
    const entries = [...bucket.entries].sort((left, right) =>
      entrySortKey(left) < entrySortKey(right) ? -1 : 1,
    );

    return {
      todoId: bucket.todoId,
      day: bucket.day,
      entries,
      todoTitle: bucket.todoTitle,
      todoCallNumber: bucket.todoCallNumber,
      todoTagNames: bucket.todoTagNames,
      // R-10: eine einzige zurückgesetzte Buchung genügt, damit die Zeile in
      // der Vorschau als „schon einmal exportiert" gekennzeichnet wird.
      previouslyExported: entries.some((entry) => entry.previouslyExported),
    };
  });

  return groups.sort((left, right) => (groupSortKey(left) < groupSortKey(right) ? -1 : 1));
};
