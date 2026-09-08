/**
 * Takt — die Frist eines Todos (A-19.1 bis A-19.7, A-19.20, E-070, E-074,
 * A-A-19).
 *
 * ===========================================================================
 * Ein Tag, und es ist **derselbe** Tag wie beim Export
 * ===========================================================================
 *
 * Die Frist ist ein Kalendertag ohne Uhrzeit (E-070 Punkt 1), und der
 * Tagesbegriff ist der aus E-025: `toCalendarDay` in `kernel.ts`, dieselbe
 * Funktion, die die Tagesgruppierung des Exports benutzt. Es gibt hier keinen
 * zweiten — diese Datei rechnet **keinen** Tag aus, sie bekommt ihn.
 *
 * Der Grund steht in E-070 Punkt 2 und ist kein Schönheitsargument: Ein
 * zweiter Tagesbegriff im selben Programm hieße, daß „heute fällig" und „heute
 * gebucht" an einem Reisetag verschiedene Tage meinen. Wer `dueState` aufruft,
 * übergibt deshalb `today` — und die eine Stelle, an der `today` entsteht, ist
 * `toCalendarDay(clock.now(), timeZone)`.
 *
 * ===========================================================================
 * Der Zustand wird gerechnet, nie gespeichert (E-070 Punkt 3)
 * ===========================================================================
 *
 * Gespeichert ist der Tag. „Überfällig" entsteht aus ihm und aus heute. Ein
 * gespeicherter Zustand wäre über Nacht falsch, ohne daß jemand etwas angefaßt
 * hat — und niemand hätte einen Anlaß, ihn neu zu schreiben.
 *
 * Deshalb ist {@link dueState} rein: zwei Werte hinein, ein Wert heraus, keine
 * Uhr, kein Bestand, kein HTTP. Ein Prüffall, der die Uhr über Mitternacht
 * stellt, mißt hier gar nichts — er mißt, ob das **System** die Funktion bei
 * jeder Anfrage neu ruft. Das ist der Fall: `listTodos` und `loadTodo` lesen
 * die Uhr je Anfrage.
 *
 * ===========================================================================
 * Der vierte Fall ist ein Wert und kein `null`
 * ===========================================================================
 *
 * A-19.5 nennt drei Zustände und sagt im selben Atemzug: „Ein Todo ohne Frist
 * hat keinen dieser Zustände." Das ist **eine Auskunft** und keine fehlende.
 * `dueState` gibt dafür `'no_due_date'` zurück und nicht `null`.
 *
 * Der Unterschied kostet eine Zeile und spart eine Klasse Fehler: Ein `null`
 * zwingt jeden Aufrufer zu einer Verzweigung, deren Ausgang er selbst benennen
 * muß — und die naheliegende Benennung ist „später fällig" oder ein leerer
 * Text. Beides behauptet etwas. Mit vier Werten steht der Fall im Typ; wer ihn
 * vergißt, bekommt von `tsc` keine Vollständigkeit über eine Vereinigung
 * geschenkt, sondern eine Meldung (siehe {@link DUE_STATE_PRESENCE}).
 *
 * ===========================================================================
 * Was hier **nicht** steht
 * ===========================================================================
 *
 * Die Frist ist **keine Achse** (E-070 Punkt 4, E-074 Punkt 1, A-19.7,
 * A-19.17). Sie taucht deshalb weder in `PoolRule` noch in `ExportSourcePath`
 * auf, und diese Datei liefert nichts, was ein Regelterm oder eine Feldquelle
 * werden könnte. Sortieren und Filtern sind Anzeige: Sie ordnen eine Liste,
 * sie ordnen kein Todo einem Pool zu.
 *
 * Rein: gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Uhr, Datei, Netz
 * oder Datenbank.
 */

import type { CalendarDay, Result, TaktError } from './kernel.ts';
import { err, ok, taktError } from './kernel.ts';

// ---------------------------------------------------------------------------
// Die Form eines Tages
// ---------------------------------------------------------------------------

/**
 * `YYYY-MM-DD`, und nichts daneben (A-A-19).
 *
 * Kein `2026-2-3`, kein `2026-02-30T00:00:00Z`, kein Zeitzonenanhang. Die Form
 * ist derselbe Ausdruck wie `daySchema` an der Tür des Dienstes — dort bindet
 * er an zod, hier steht er als Regel. Zwei Fassungen einer Form wären zwei
 * Gelegenheiten, sie verschieden zu ändern (E-063 Punkt 5); die Tür liest
 * deshalb diese Konstante.
 */
export const DUE_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Die Bandbreite der Jahre (A-A-19).
 *
 * **Warum überhaupt eine.** `0000-01-01` und `999999-01-01` bestehen keine
 * Formprüfung, die nur auf Ziffern schaut, und sie sind keine Frist, sondern
 * eine Eingabe, die die Anzeige zerlegen soll. 1970 ist der Anfang der
 * Zeitrechnung, in der dieses Programm rechnet; 2999 ist so weit jenseits
 * jeder Frist, daß darüber hinaus nichts Gutes gemeint sein kann.
 *
 * Beide Grenzen gehören **dazu**.
 */
export const MIN_DUE_YEAR = 1970;
export const MAX_DUE_YEAR = 2999;

/**
 * Ist das ein Tag, den es gibt?
 *
 * Drei Prüfungen, und die dritte ist die, die man vergißt:
 *
 *  1. Die Form (`YYYY-MM-DD`).
 *  2. Die Bandbreite des Jahres.
 *  3. **Der Tag existiert.** `2026-02-30` paßt auf die Form und ist keiner.
 *     Ohne diese Prüfung entstünde in jeder Rechnung darüber ein
 *     `Invalid Date`, und der taucht an einer Stelle auf, an der ihn niemand
 *     erwartet.
 *
 * Der Existenztest geht über `Date.UTC` und den **Rückweg**: Ein Datum, das
 * sich beim Zurückschreiben ändert, hat sich beim Anlegen verschoben. Das ist
 * der einzige Test, der ohne einen eigenen Kalender auskommt — und ein eigener
 * Kalender wäre die zweite Wahrheit neben der der Laufzeit.
 */
export function isCalendarDay(value: string): value is CalendarDay {
  if (!DUE_DATE_SHAPE.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  if (year < MIN_DUE_YEAR || year > MAX_DUE_YEAR) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // `Date.UTC` rollt über: Aus dem 30. Februar wird der 1. oder 2. März. Wer
  // zurückschreibt, sieht die Verschiebung — und nur die.
  const rolled = new Date(Date.UTC(year, month - 1, day));
  return (
    rolled.getUTCFullYear() === year &&
    rolled.getUTCMonth() === month - 1 &&
    rolled.getUTCDate() === day
  );
}

/** Der Satz, mit dem eine Tür eine Frist abweist, die keine ist. */
export const DUE_DATE_MESSAGE =
  `Eine Frist ist ein Tag der Form JJJJ-MM-TT zwischen ${String(MIN_DUE_YEAR)} und ${String(MAX_DUE_YEAR)}. Eine Uhrzeit gehört nicht dazu.`;

/**
 * Eine Frist aus einer Eingabe — geprüft, nicht behauptet.
 *
 * `null` heißt „keine Frist" und ist ein gültiger Wert (A-19.1); die Tür
 * unterscheidet ihn von „nicht genannt", und diese Funktion sieht ihn deshalb
 * gar nicht erst.
 *
 * **Der abgewiesene Wert steht nicht in der Meldung.** Er kann aus einer
 * fremden E-Mail stammen (A-19.21, E-074 Punkt 4) — dieselbe Regel wie bei der
 * Zeichenklasse (B-4.3 Punkt 5).
 */
export function checkDueDate(value: string): Result<CalendarDay, TaktError<'validation_error'>> {
  if (!isCalendarDay(value)) return err(taktError('validation_error', DUE_DATE_MESSAGE));
  return ok(value);
}

// ---------------------------------------------------------------------------
// Die vier Zustände
// ---------------------------------------------------------------------------

/**
 * Wie ein Todo zu seiner Frist steht (A-19.5).
 *
 * Drei benannte Zustände und der vierte, der keiner ist — siehe den Kopf
 * dieser Datei. Die Bezeichner sind englisch wie jeder Bezeichner in diesem
 * Baum; die deutschen Wörter „überfällig", „heute fällig", „später fällig"
 * stehen in der Oberfläche und nicht hier.
 */
export type DueState = 'overdue' | 'due_today' | 'due_later' | 'no_due_date';

/**
 * Vollständigkeit beim Übersetzen, nach dem Vorbild von `SOURCE_PRESENCE`
 * (`export.ts`).
 *
 * Wer die Vereinigung erweitert und diese Zuordnung vergißt, bekommt einen
 * Übersetzungsfehler und keinen stillen fünften Zustand, den niemand anzeigt.
 */
export const DUE_STATE_PRESENCE: Readonly<Record<DueState, true>> = Object.freeze({
  overdue: true,
  due_today: true,
  due_later: true,
  no_due_date: true,
});

/** Die vier Zustände als Liste, in der Reihenfolge, in der sie drängen. */
export const DUE_STATES: readonly DueState[] = Object.freeze(
  Object.keys(DUE_STATE_PRESENCE) as DueState[],
);

/** Ist das einer der vier Zustände? Wörtlicher Vergleich, ohne Normalisierung. */
export function isDueState(value: string): value is DueState {
  return Object.prototype.hasOwnProperty.call(DUE_STATE_PRESENCE, value);
}

/**
 * Der Zustand einer Frist, gerechnet aus ihr und aus heute (A-19.5, A-19.6).
 *
 * Ein **Tagesvergleich** und kein Zeitvergleich (E-070 Punkt 1). Beide Werte
 * sind `YYYY-MM-DD` fester Breite; ein lexikographischer Vergleich ist dort
 * derselbe wie ein kalendarischer, und deshalb steht hier kein `Date`.
 *
 * Gleichheit ist ein **eigener** Ausgang und kein Sonderfall von „vorher" oder
 * „nachher": „heute fällig" ist der Zustand, der in der Oberfläche anders
 * aussieht als beides.
 */
export function dueState(day: CalendarDay | null, today: CalendarDay): DueState {
  if (day === null) return 'no_due_date';
  if (day < today) return 'overdue';
  if (day === today) return 'due_today';
  return 'due_later';
}

// ---------------------------------------------------------------------------
// Filtern (A-19.20) — dieselbe Regel, in der Form, die eine Abfrage braucht
// ---------------------------------------------------------------------------

/**
 * Die Bedingung eines Zustands als Vergleich gegen den heutigen Tag.
 *
 * ---------------------------------------------------------------------------
 * Wozu es diesen zweiten Ausdruck derselben Regel gibt
 * ---------------------------------------------------------------------------
 *
 * {@link dueState} beantwortet „welchen Zustand hat **dieses** Todo".
 * Eine Abfrage stellt die umgekehrte Frage: „welche Zeilen haben diesen
 * Zustand". Sie kann dafür nicht jede Zeile laden — das ist dieselbe Auflage
 * wie bei den Tag-Ordnern (nicht die ganze Tabelle in den Speicher).
 *
 * Statt die Umkehrung im SQL-Adapter noch einmal zu erfinden — der sechste
 * Fall derselben Doppelung, siehe `calendarDayBounds` — liefert die Domäne
 * sie: vier Vergleiche, geschlossen aufgezählt. Der Adapter hat darüber einen
 * `switch` und **keine** Zeichenkettenarithmetik; kommt ein fünfter Zustand,
 * bricht der Übersetzer ab.
 *
 * `kind: 'none'` trägt bewußt keinen Tag: „hat keine Frist" ist kein
 * Vergleich, sondern die Abwesenheit eines Wertes.
 */
export type DueComparison =
  | { readonly kind: 'none' }
  | { readonly kind: 'before'; readonly day: CalendarDay }
  | { readonly kind: 'equal'; readonly day: CalendarDay }
  | { readonly kind: 'after'; readonly day: CalendarDay };

/**
 * Der Vergleich, der genau die Todos dieses Zustands trifft.
 *
 * Die Gegenprobe dazu ist eine Eigenschaft und kein zweiter Prüffall: Für
 * jeden Tag `d` und jedes `heute` gilt
 * `matchesDueComparison(d, dueComparison(s, heute)) === (dueState(d, heute) === s)`.
 * Wer eine der beiden Funktionen ändert und die andere nicht, bricht sie.
 */
export function dueComparison(state: DueState, today: CalendarDay): DueComparison {
  switch (state) {
    case 'overdue':
      return { kind: 'before', day: today };
    case 'due_today':
      return { kind: 'equal', day: today };
    case 'due_later':
      return { kind: 'after', day: today };
    case 'no_due_date':
      return { kind: 'none' };
  }
}

/** Trifft dieser Vergleich diese Frist? Die Fassung für den Arbeitsspeicher. */
export function matchesDueComparison(day: CalendarDay | null, comparison: DueComparison): boolean {
  switch (comparison.kind) {
    case 'none':
      return day === null;
    case 'before':
      return day !== null && day < comparison.day;
    case 'equal':
      return day !== null && day === comparison.day;
    case 'after':
      return day !== null && day > comparison.day;
  }
}

// ---------------------------------------------------------------------------
// Sortieren (A-19.20, E-074 Punkt 2)
// ---------------------------------------------------------------------------

/** Aufsteigend heißt: die nächste Frist zuerst. */
export type DueSortDirection = 'asc' | 'desc';

/**
 * Vergleicht zwei Fristen — und ein Todo **ohne** Frist steht in **beiden**
 * Richtungen am Ende (E-074 Punkt 2).
 *
 * ---------------------------------------------------------------------------
 * Warum kein Platzhalterdatum
 * ---------------------------------------------------------------------------
 *
 * Weil ein leeres Feld kein früher Wert ist und auch kein später. Es als
 * `1970-01-01` zu sortieren macht aus „keine Frist" ein „am dringendsten", und
 * das fällt niemandem auf, bis es in einer Abrechnung steht. Es als
 * `9999-12-31` zu sortieren dreht denselben Fehler nur um: In der absteigenden
 * Richtung stünden dann alle fristlosen Todos vorn.
 *
 * Die Antwort ist, die Abwesenheit **vor** dem Wertvergleich zu behandeln.
 * Erst dann kehrt die Richtung nur noch die Fristen um und nicht die Frage,
 * ob eine da ist.
 *
 * Rückgabe wie bei `Array#sort`: negativ, wenn `a` vor `b` steht. `0` heißt
 * „nicht zu unterscheiden" — der Aufrufer entscheidet dann über einen zweiten
 * Schlüssel (der Adapter nimmt die Kennung, damit die Blätterung stabil ist).
 */
export function compareByDueDate(
  a: CalendarDay | null,
  b: CalendarDay | null,
  direction: DueSortDirection,
): number {
  // Zuerst: hat überhaupt eines eine Frist? Diese Frage kennt keine Richtung.
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  if (a === b) return 0;
  const ascending = a < b ? -1 : 1;
  return direction === 'asc' ? ascending : -ascending;
}
