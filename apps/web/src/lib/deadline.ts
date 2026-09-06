import {
  calendarDayBounds,
  dueState,
  resolveTimeZone,
  toCalendarDay,
  type CalendarDay as DomainCalendarDay,
  type DueState,
  type Timestamp as DomainTimestamp,
} from "@takt/domain";

import type { CalendarDay } from "../api/types";

/**
 * Takt — die drei Zustände der Frist (A-19.5, A-19.6, E-070 Punkt 3).
 *
 * ---------------------------------------------------------------------------
 * Was hier steht — und was ausdrücklich nicht
 * ---------------------------------------------------------------------------
 *
 * Hier steht der **Vergleich zweier Kalendertage** und der Zeitpunkt, zu dem er
 * neu zu ziehen ist. Hier steht **kein zweiter Tagesbegriff**: Welcher Tag heute
 * ist und wann er endet, beantwortet `toCalendarDay` beziehungsweise
 * `calendarDayBounds` aus `@takt/domain` — dieselben Funktionen, mit denen der
 * Export gruppiert (E-025, E-070 Punkt 2). Diese Datei rechnet keine Millisekunde
 * selbst und legt keinen eigenen Kalender an.
 *
 * Warum das wichtig ist: „heute fällig" und „heute gebucht" dürfen an einem
 * Reisetag nicht verschiedene Tage meinen. Ein zweiter Tagesbegriff im selben
 * Programm ist eine Frage mit zwei Antworten, und Fragen mit zwei Antworten sind
 * die Stellen, an denen später etwas durchrutscht (Bedrohungsmodell 20.6).
 *
 * ---------------------------------------------------------------------------
 * Warum der Zustand nicht gespeichert wird
 * ---------------------------------------------------------------------------
 *
 * Gespeichert ist der **Tag** (`Todo.deadline`). „Überfällig" entsteht aus ihm
 * und aus heute. Ein gespeicherter Zustand wäre über Nacht falsch, ohne dass
 * jemand etwas angefasst hat — und genau deshalb steht in {@link deadlineState}
 * ein `today` als Argument statt eines Aufrufs von `new Date()` im Rumpf: So
 * lässt sich die Rechnung ohne verstellte Systemuhr prüfen, und die Ansicht
 * entscheidet selbst, wann sie einen neuen Tag hereinreicht
 * (`app/useToday.ts`).
 *
 * ---------------------------------------------------------------------------
 * Was hier fehlt und wo es hingehört
 * ---------------------------------------------------------------------------
 *
 * **Es gibt keine „Überfällig seit N Tagen"-Zahl.** T-144 schlägt sie vor; sie
 * wäre eine Differenz zweier Kalendertage, also eine Rechnung über Zeit, und die
 * gehört nach `packages/domain` und nicht in die Oberfläche. Solange sie dort
 * nicht steht, nennt die Marke stattdessen das **absolute Datum** — das ohnehin
 * verlangt ist (T-144: „Deshalb steht das absolute Datum immer im zugänglichen
 * Namen"), und das ohne jede Rechnung auskommt.
 */

/**
 * Die vier Zustände kommen **aus der Domäne** und werden hier nicht neu benannt.
 *
 * `no_due_date` ist kein fehlender Wert, sondern eine Auskunft: „Ein Todo ohne
 * Frist hat keinen dieser Zustände" (A-19.5, wörtlich). In der Anzeige trägt es
 * deshalb **keine** Marke — nicht „Ohne Frist", nicht „unbefristet", sondern
 * nichts.
 */
export type { DueState };

/**
 * Der heutige Kalendertag im Tagesbegriff aus E-025.
 *
 * Ein Aufruf, keine Rechnung: `toCalendarDay` bekommt den Zeitpunkt und die
 * Zone und liefert `YYYY-MM-DD`. Die Zone kommt aus der Laufzeit
 * (`resolveTimeZone`) und nicht aus einer Einstellung — eine zweite, abweichend
 * eingestellte Zone wäre eine Fehlerquelle ohne Nutzen.
 */
export function todayForDueDates(now: Date = new Date()): CalendarDay {
  /*
    Die Domäne führt `Timestamp` und `CalendarDay` als **gebrandete** Typen; über
    die Leitung und in dieser Oberfläche sind es Zeichenketten (siehe den Kopf
    von `api/types.ts`). Die beiden Übergänge stehen deshalb hier, an einer
    Stelle, statt an jeder Aufrufstelle — und sie sind das Einzige, was diese
    Datei an den Werten tut.
  */
  return toCalendarDay(now.toISOString() as DomainTimestamp, resolveTimeZone());
}

/**
 * Der Zustand einer Frist gegenüber einem Tag — **weitergereicht**, nicht
 * nachgebaut.
 *
 * `dueState` steht in `packages/domain/src/due-date.ts` und ist dieselbe
 * Funktion, gegen die der Dienst filtert (`dueComparison`, dieselbe Datei). Eine
 * zweite Fassung in der Oberfläche wäre eine zweite Meinung darüber, was
 * „überfällig" heißt — und sie liefe genau dann auseinander, wenn es zählt: an
 * der Tagesgrenze.
 *
 * Diese Hülle gibt es trotzdem, und zwar aus demselben Grund wie `foreignText`
 * neben `visibleText`: Sie nimmt die Zeichenketten dieser Oberfläche entgegen
 * und setzt die gebrandeten Typen der Domäne ein, damit der Übergang an
 * **einer** Stelle steht und nicht an jeder Aufrufstelle.
 */
export function deadlineState(deadline: CalendarDay | null, today: CalendarDay): DueState {
  return dueState(
    deadline === null || deadline.length === 0 ? null : (deadline as DomainCalendarDay),
    today as DomainCalendarDay,
  );
}

/**
 * Der Zeitpunkt, zu dem der nächste Tag beginnt — als Millisekunden seit dem
 * 1. Januar 1970 (E-073 Punkt 2).
 *
 * `calendarDayBounds(heute).endsBefore` ist der erste Zeitpunkt des Folgetags,
 * in derselben Zone. Auch das ist ein Aufruf und keine Rechnung: Eine eigene
 * Addition von 24 Stunden ginge an jedem Wechsel der Sommerzeit um eine Stunde
 * daneben, und eine eigene Zonendatenbank wäre die zweite Wahrheit neben der des
 * Betriebssystems.
 */
export function nextMidnightMs(today: CalendarDay): number {
  const bounds = calendarDayBounds(today as DomainCalendarDay, resolveTimeZone());
  return Date.parse(bounds.endsBefore);
}
