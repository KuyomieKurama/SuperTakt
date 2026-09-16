/**
 * Den Vergleichstag mit derselben Zeitzone wie im Export bestimmen.
 * Der Fälligkeitszustand wird je Anfrage berechnet, damit er über Mitternacht nicht veraltet.
 */

import type { CalendarDay, Result, TaktError } from './kernel.ts';
import { err, ok, taktError } from './kernel.ts';

// Die Form eines Tages

export const DUE_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** Beide Jahresgrenzen sind eingeschlossen. */
export const MIN_DUE_YEAR = 1970;
export const MAX_DUE_YEAR = 2999;

/** Den Rückweg über UTC prüfen: `Date.UTC` verschiebt ungültige Tage statt sie abzuweisen. */
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

/** Abgewiesene Fremdwerte dürfen nicht in die Fehlermeldung gelangen. */
export function checkDueDate(value: string): Result<CalendarDay, TaktError<'validation_error'>> {
  if (!isCalendarDay(value)) return err(taktError('validation_error', DUE_DATE_MESSAGE));
  return ok(value);
}

// Die vier Zustände

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
 * Für gültige Tage fester Breite stimmt die lexikografische mit der kalendarischen Reihenfolge
 * überein.
 */
export function dueState(day: CalendarDay | null, today: CalendarDay): DueState {
  if (day === null) return 'no_due_date';
  if (day < today) return 'overdue';
  if (day === today) return 'due_today';
  return 'due_later';
}

// Filtern (A-19.20) — dieselbe Regel, in der Form, die eine Abfrage braucht

/**
 * Liefert die umgekehrte Bedingung für SQL-Abfragen, damit der Adapter die Tagesregel nicht erneut
 * implementiert.
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

// Sortieren (A-19.20, E-074 Punkt 2)

/** Aufsteigend heißt: die nächste Frist zuerst. */
export type DueSortDirection = 'asc' | 'desc';

/**
 * Fehlende Fristen vor dem Richtungsvergleich behandeln, damit sie in beiden Richtungen zuletzt
 * stehen.
 * Bei Gleichheit braucht die Blätterung einen stabilen zweiten Sortierschlüssel.
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
