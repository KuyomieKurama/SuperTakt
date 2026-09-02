/**
 * Takt — Exportgrenze (A-7.2, A-7.4, A-8.*, E-005, E-012, E-017, R-06).
 *
 * Dieses Modul ist die einzige Verbindung zwischen der Domäne und dem
 * Vorlagen-Motor in `packages/export`. Es ist zugleich die Stelle, an der die
 * Datenschutzgrenze aus A-7.2 strukturell verankert ist.
 *
 * `packages/export` importiert ausschließlich aus `@takt/domain/export`, das
 * auf diese Datei zeigt. Weder `Todo` noch `TodoNote` sind von hier
 * erreichbar. Der Exportmotor kann den internen Vermerk also nicht lesen,
 * weil er keinen Typ und keinen Weg hat, ihn zu benennen — nicht, weil er es
 * unterlässt.
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

/**
 * Die Rundung wird hier **weitergereicht**, nicht nachgebaut.
 *
 * `packages/export` sieht ausschließlich `@takt/domain/export` (R-06). Ohne
 * diese Zeile hätte der Vorlagen-Motor keinen Weg, die Rundungsregel zu
 * benennen — und der einzige Ausweg wäre eine zweite Fassung derselben Regel
 * im Motor. Genau das verbietet der Kopfkommentar von rounding.ts: Die Regel
 * existiert einmal, und der Aufruf ist der vorgesehene Weg dorthin.
 *
 * Der Wächter `scripts/check-export-boundary.mjs` lässt in dieser Datei
 * ausschließlich `./kernel.ts` und `./rounding.ts` zu. Der Re-Export vergrößert
 * die Fläche also nicht: Was hier hinausgeht, kommt aus einem der beiden
 * Module, die die Exportfläche ohnehin kennen darf.
 */
export { quarterHoursToExportNumber, roundToQuarterHours } from './rounding.ts';
export type { RoundingMode, SecondsPerQuarterHour } from './rounding.ts';

// ---------------------------------------------------------------------------
// Der einzige Datensatz, den der Exportmotor zu sehen bekommt
// ---------------------------------------------------------------------------

/**
 * Eine offene Zeitbuchung, angereichert um die Todo-Felder, die exportierbar
 * sind. Entspricht Zeile für Zeile der Datenbanksicht `v_export_candidate`.
 *
 * Es gibt hier kein Feld für den internen Vermerk des Todos und keinen
 * Verweis, über den man ihn nachladen könnte. Die zugehörige Sicht in der
 * Speicherung enthält die Spalte ebenfalls nicht, sodass auch eine
 * handgeschriebene Abfrage im Exportpfad ins Leere greift.
 *
 * `bookingNote` ist die **Leistung** aus A-7.3 (E-016) und das einzige
 * Textfeld, das aus einer Buchung in die Abrechnung geht.
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

// ---------------------------------------------------------------------------
// Gruppierung: eine Exportzeile je Todo und Kalendertag
// ---------------------------------------------------------------------------

/**
 * Alle noch offenen Buchungen eines Todos an einem Kalendertag.
 *
 * Das ist die Einheit, aus der genau eine Exportzeile entsteht (Entscheidung
 * des Auftraggebers vom 2026-08-31, nachgetragen in T-013). Erst wird über
 * `entries` summiert, dann wird die Summe gerundet — nicht umgekehrt. Zehn,
 * zwanzig und fünf Minuten am selben Tag ergeben eine Zeile mit 0,75 statt
 * dreier Zeilen mit zusammen 1,00.
 *
 * Regeln, die dieser Typ trägt und die T-007 und T-009 einhalten müssen:
 *
 *  1. `entries` enthält ausschließlich Buchungen mit `export_status = 'offen'`.
 *     Eine bereits exportierte Buchung desselben Tages gehört nicht in die
 *     Gruppe; sonst würde ihre Zeit ein zweites Mal abgerechnet (R-10). Eine
 *     Tagesgruppe kann deshalb weniger Buchungen enthalten, als am Tag
 *     erfasst wurden.
 *  2. `entries` ist nach `startedAt` aufsteigend sortiert und nie leer. Die
 *     Sortierung ist zugleich die Reihenfolge, in der die Leistungstexte
 *     zusammengeführt werden.
 *  3. `entries` trägt keinen Vermerk und keinen Weg zu einem. Die Zusicherung
 *     `ExportGroupHasNoTodoNote` unten bindet das an den Übersetzer.
 *  4. `day` ist der Tag, an dem der Timer gestartet wurde. Eine Buchung von
 *     23:40 bis 00:20 liegt vollständig in der Gruppe des Starttags; sie wird
 *     nicht geteilt und taucht in keiner zweiten Gruppe auf.
 *
 * Weder Summenbildung noch Rundung noch das Zusammenführen der Leistungstexte
 * stehen hier: Dieser Typ beschreibt die Eingabe, nicht das Ergebnis. Die
 * Fachlogik ist T-009, das Erzeugen der Zeile T-007.
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

/**
 * Trennzeichen beim Zusammenführen der Leistungstexte einer Tagesgruppe.
 *
 * Semikolon mit nachfolgendem Leerzeichen. Der Wert steht hier und nicht im
 * Vorlagen-Motor, damit Vorschau und Datei ihn zwangsläufig teilen (R-17).
 *
 * Zwei Regeln gehören dazu und sind in T-009 umzusetzen: Zusammengeführt wird
 * in der Reihenfolge von `ExportGroup.entries`, also nach Startzeit; leere
 * Texte werden übersprungen, damit keine leeren Abschnitte und keine
 * führenden oder doppelten Trenner entstehen.
 */
export type ExportNoteSeparator = '; ';

/** Werte, die nicht aus der Buchung stammen, sondern aus dem System (E-010). */
export interface ExportSystemContext {
  /** Vom Betriebssystem gelesen, keine Benutzereingabe (E-010, A-8.5). */
  readonly windowsUser: string;
  readonly exportedAt: Timestamp;
  readonly roundingMode: RoundingMode;
}

// ---------------------------------------------------------------------------
// Quellenpfade — die abschließende Liste (E-005, E-017, R-06)
// ---------------------------------------------------------------------------

/**
 * Alles, was eine Exportvorlage als Feldquelle wählen darf.
 *
 * Abschließend. Ein Vorlagenfeld mit einem Wert außerhalb dieser Vereinigung
 * lässt sich weder übersetzen noch zur Laufzeit validieren; der Vorlagen-Motor
 * weist es mit `export_source_forbidden` ab. Nach E-017 ist jede Quelle eine
 * ausgeschriebene Zugriffsfunktion, kein ausgewerteter Pfad.
 *
 * `todo.note` fehlt hier und wird nie aufgenommen. Das ist die Umsetzung von
 * A-7.2 gegen R-06: Sobald der Benutzer Feldquellen frei wählen kann, ist die
 * Grenze nur so stark wie diese Liste — deshalb steht sie in der Domäne und
 * nicht im Vorlageneditor.
 *
 * **`booking.*` ist entfernt, nicht umgedeutet (E-033).** Seit E-020 erzeugt
 * eine Tagesgruppe die Exportzeile. Ein Pfad, der weiterhin `booking` hieße und
 * die Gruppe meinte, wäre genau der stille Bedeutungswechsel, den T-013
 * beseitigt hat: Ein entfernter Name bricht sichtbar, ein umgedeuteter bricht
 * still und erst in der Abrechnung. An seine Stelle treten `group.*`.
 *
 * Die Quelle für das Exportfeld `Zeit` ist `group.quarters` — die **gerundete**
 * Summe der Tagesgruppe (E-008, E-020). `group.durationSeconds` daneben ist die
 * ungerundete Summe; sie ist keine Abrechnungsgröße und steht nur für
 * Vorlagen zur Verfügung, die eine Kontrollspalte führen wollen.
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
  /**
   * Die zusammengeführten **Leistungstexte** der Gruppe (A-7.3, E-016, E-026).
   *
   * Der Name trägt `bookingNotes` und nicht `note`. Das ist kein Zufall: Ein
   * Quellenpfad namens `group.note` stünde im Vorlageneditor unmittelbar neben
   * dem internen Vermerk des Todos, und die Verwechslung wäre eine Frage der
   * Zeit (R-08). Die Zusicherung `NoSourceIsCalledPlainNote` unten hält das
   * am Übersetzer fest.
   */
  | 'group.bookingNotes'
  /** Beginn der ersten Buchung der Gruppe. */
  | 'group.startedAt'
  /** Ende der letzten Buchung der Gruppe. */
  | 'group.endedAt'
  /** Anzahl der zusammengefassten Buchungen. Für Kontrollspalten. */
  | 'group.entryCount'
  | 'system.windowsUser'
  | 'system.exportedAt';

// ---------------------------------------------------------------------------
// Typbehauptungen: die Notiz-Grenze am Übersetzer (R-06)
// ---------------------------------------------------------------------------

/** Reiner Typ, kein Laufzeitanteil. `Assert<false>` verletzt seine Randbedingung. */
type Assert<T extends true> = T;

/**
 * Übersetzungsfehler, sobald jemand einen Notizpfad in `ExportSourcePath`
 * aufnimmt.
 *
 * Wird `'todo.note'` oder `'todo.notiz'` ergänzt, ist `Extract<...>` nicht mehr
 * `never`, der bedingte Typ liefert `false`, und `Assert<false>` verletzt seine
 * Randbedingung. `pnpm typecheck` schlägt mit TS2344 fehl, bevor irgendein Test
 * läuft. Die Datenschutzgrenze ist damit an den Übersetzer gebunden.
 */
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
 * Kein Quellenpfad heißt schlicht „Notiz".
 *
 * `todo.note` ist über `NoteBoundaryIsSealed` gesperrt. Diese Behauptung geht
 * weiter und sperrt den Namen auf **jeder** Ebene: `group.note`,
 * `booking.note`, `system.notiz`. Auf einer Auswahlliste, die der Benutzer im
 * Vorlageneditor sieht, ist „Notiz" ohne Zusatz mehrdeutig — und genau diese
 * Mehrdeutigkeit ist der Bedienfehler aus R-08, der die Datenschutzgrenze aus
 * A-7.2 zu Fall bringt. Die Leistung heißt `group.bookingNotes`.
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
 * Feldnamen, die auf keinem exportnahen Typ vorkommen dürfen, weil sie den
 * internen Vermerk des Todos benennen würden (A-7.2, E-016, R-06).
 *
 * Die deutschen Schreibweisen stehen hier nicht, weil sie erlaubt wären,
 * sondern damit der Übersetzer sie abfängt, falls jemand sie einführt. Ein
 * bloßes `note` ist ebenfalls gesperrt: Auf einem Typ, den der Exportmotor in
 * der Hand hält, ist „Notiz" ohne Zusatz mehrdeutig, und genau diese
 * Mehrdeutigkeit ist der Bedienfehler aus R-08.
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

// ---------------------------------------------------------------------------
// Vorlagenhülle — Tabelle `export_template`
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Exportlauf (A-8.8) — Tabelle `export_run`
// ---------------------------------------------------------------------------

/**
 * Was ein Exportlauf hinterlässt. Anhängend und unveränderlich.
 *
 * `templateSnapshot` ist eine Kopie der Vorlage zum Zeitpunkt des Laufs. Ohne
 * sie würde eine spätere Änderung an der Vorlage rückwirkend die Geschichte
 * umschreiben, und man könnte nicht mehr feststellen, welche Felder tatsächlich
 * in der Abrechnung gelandet sind.
 *
 * `fileSha256` belegt, dass die Datei im Ordner dieselbe ist, die der Lauf
 * geschrieben hat. Der Ordner ist Benutzereingabe (E-011, R-11) und kann
 * zwischen zwei Läufen von außen verändert worden sein.
 *
 * `entryCount` zählt die enthaltenen **Buchungen**, `totalQuarters` ist die
 * Summe über die **Zeilen**. Seit der Gruppierung je Todo und Kalendertag sind
 * Buchungen und Zeilen zwei verschiedene Mengen; die Zeilen selbst stehen in
 * `ExportRunGroup` und lassen sich von dort zählen, statt hier ein zweites Mal
 * geführt zu werden.
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
 * Eine geschriebene Exportzeile, wie der Lauf sie hinterlässt.
 * Tabelle `export_run_group`. Anhängend und unveränderlich.
 *
 * Hier hängt der gerundete Wert, und nur hier. Bei 10, 20 und 5 Minuten in
 * einer Gruppe von 0,75 gibt es keine richtige Aufteilung auf die drei
 * Buchungen, nur mehrere falsche; eine willkürliche Aufteilung würde genau das
 * Protokoll verfälschen, das R-10 nachvollziehbar halten soll.
 *
 * `seconds` ist die ungerundete Tagessumme, `quarters` der Wert, der in die
 * Abrechnung ging. Die Differenz zwischen beiden ist der Aufschlag, den die
 * Rundung dieser Zeile hinzugefügt hat, und sie ist damit nachrechenbar statt
 * geschätzt.
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
 * Auftrag für einen Exportlauf.
 *
 * `timeEntryIds` leer bedeutet: alle offenen Buchungen. Ist die Liste gesetzt,
 * werden ausschließlich diese exportiert — und nur, wenn sie sämtlich noch
 * offen sind. Eine bereits exportierte Buchung im Auftrag lässt den gesamten
 * Lauf scheitern, statt sie stillschweigend zu überspringen; sonst bliebe
 * unklar, was in der Datei steht.
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

// ---------------------------------------------------------------------------
// Umsetzung: Gruppierung je Todo und Kalendertag (T-009, E-020, E-025)
// ---------------------------------------------------------------------------

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
 * Sortierschlüssel einer Buchung: Startzeit, dann Kennung.
 *
 * Zeitstempel sind lexikographisch sortierbar (siehe `Timestamp` in kernel.ts),
 * ein Datumsobjekt braucht es dafür nicht. Die Kennung dahinter macht den
 * Schlüssel eindeutig — sie ist Primärschlüssel, zwei Buchungen können ihn
 * also nie teilen. Ohne diesen zweiten Teil hätten zwei zur selben Sekunde
 * begonnene Buchungen keine bestimmte Reihenfolge, und die zusammengeführten
 * Leistungstexte hüpften zwischen zwei Vorschauen.
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
 * Fasst offene Buchungen zu Tagesgruppen zusammen — eine Gruppe je Todo und
 * Kalendertag, und damit genau eine Exportzeile (E-020).
 *
 * **Was diese Funktion nicht tut, und warum das der wichtigste Teil ist.** Sie
 * filtert nicht nach Exportstatus. `ExportCandidate` ist per Vertrag eine
 * *offene* Buchung; die Sicht `v_export_candidate` filtert bereits in SQL. Eine
 * bereits exportierte Buchung desselben Tages kommt hier gar nicht an und darf
 * die Summe nicht erhöhen. Sind von drei Buchungen eines Tages zwei offen,
 * entsteht eine Gruppe aus zwei Buchungen — die dritte ist abgerechnet und
 * bleibt es. Eine Umsetzung, die an dieser Stelle „der Vollständigkeit halber"
 * alle Buchungen des Tages nachlädt, rechnet stillschweigend doppelt ab (R-10).
 *
 * **Der Kalendertag kommt aus der Startzeit, in Ortszeit** (E-025). Eine
 * Buchung von 23:40 bis 00:20 zählt vollständig zum Starttag und wird nicht
 * geteilt; `endedAt` geht in die Gruppierung nie ein. Umgekehrt liegen zwei
 * Buchungen um 23:50 und 00:10 zwanzig Minuten auseinander und trotzdem in zwei
 * Gruppen — der Sonderfall, den E-025 ausdrücklich in Kauf nimmt.
 *
 * Der Umweg über die Ortszeit ist keine Feinheit: Am Abend unterscheiden sich
 * lokales und UTC-Datum, und wer den Datumsanteil des Zeitstempels abschneidet,
 * legt Abendbuchungen auf den Folgetag.
 *
 * **Die Gruppe trägt keinen Vermerk.** Sie besteht ausschließlich aus
 * `ExportCandidate`-Werten, und die kennen den internen Vermerk des Todos nicht
 * — weder als Feld noch als Verweis (A-7.2, R-06). Die Typbehauptung
 * `ExportGroupHasNoTodoNote` oben hält das am Übersetzer fest.
 *
 * Rein: gleiche Eingabe, gleiche Ausgabe. Die Zeitzone ist überschreibbar,
 * damit die Regel ohne verstellte Umgebung prüfbar bleibt.
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
