/**
 * Takt — Rundung auf Viertelstunden (A-8.3, E-008, R-03).
 *
 * Diese Datei ist der einzige Ort im gesamten Projekt, an dem die Rundungsregel
 * beschrieben ist. Weder `packages/export`, noch `apps/web`, noch das
 * Outlook-Add-in dürfen eine eigene Fassung führen. Die Umsetzung folgt in
 * T-009; hier steht der Vertrag.
 *
 * ---------------------------------------------------------------------------
 * Der Vertrag in Worten
 * ---------------------------------------------------------------------------
 *
 * Eingabe ist eine Dauer in ganzen Sekunden. Ausgabe ist eine ganze Anzahl
 * Viertelstunden oder `null`, wenn die Buchung nicht exportierbar ist.
 *
 * Modus `up` — aufwärts (E-008, bestätigt am 2026-08-31):
 *     quarters = max(1, ceil(seconds / 900))
 *
 * Modus `nearest` — kaufmännisch (Alternative aus R-03, umschaltbar vorgehalten):
 *     quarters = max(1, floor(seconds / 900 + 0.5))
 *
 * ---------------------------------------------------------------------------
 * Gerundet wird die Tagessumme je Todo, nicht die einzelne Buchung
 * ---------------------------------------------------------------------------
 *
 * Eingabe der Rundung ist die Summe aller noch offenen Buchungen eines Todos an
 * einem Kalendertag, nicht die Dauer einer einzelnen Buchung. Erst wird
 * addiert, dann gerundet. Zehn, zwanzig und fünf Minuten am selben Tag ergeben
 * eine Zeile mit 0,75 — nicht drei Zeilen mit zusammen 1,00.
 *
 * Die Gruppe, über die summiert wird, ist `ExportGroup` in export.ts. Die
 * Funktion hier bleibt davon unberührt: Sie bekommt Sekunden und liefert
 * Viertelstunden. Was in diese Sekunden eingeht, entscheidet die Gruppierung.
 *
 * Diese Fassung löst die Regel „je Buchung" aus T-001 ab (Entscheidung des
 * Auftraggebers vom 2026-08-31, nachgetragen in T-013).
 *
 * ---------------------------------------------------------------------------
 * Die drei Randfälle, die ausdrücklich festgelegt sind
 * ---------------------------------------------------------------------------
 *
 * 1. Dauer 0 oder kleiner. Ergibt `null`, nicht 0,25. Eine Buchung ohne Dauer
 *    existiert fachlich nicht (E-008) und wird gar nicht erst angelegt; die
 *    Speicherung weist sie über einen CHECK ab. `null` ist der Ausnahmezweig
 *    für Bestände, die auf anderem Weg entstanden sind, und für eine
 *    Tagesgruppe ohne offene Buchung.
 *
 * 2. Dauer unter 7 Minuten 30 Sekunden. Ergibt in beiden Modi 0,25, nie 0.
 *    Das ist die Untergrenze aus E-008 und der Grund für das `max(1, ...)`.
 *    Ohne diese Klammer lieferte `nearest` für 3 Minuten den Wert 0,00
 *    und widerspräche der ausdrücklichen Aussage des Auftraggebers.
 *
 * 3. Werte genau auf oder genau zwischen zwei Stufen.
 *    - Genau auf einer Stufe (900, 1800, 2700, 3600 Sekunden): der Wert bleibt
 *      auf dieser Stufe und wird nicht angehoben. 15 Minuten sind 0,25, nicht
 *      0,50. `ceil` eines ganzzahligen Vielfachen ist das Vielfache selbst; die
 *      naheliegende Fehlimplementierung `floor(s/900) + 1` verletzt das und ist
 *      in T-010 ausdrücklich zu prüfen.
 *    - Genau zwischen zwei Stufen (450, 1350, 2250, 3150 Sekunden): nur im
 *      Modus `nearest` überhaupt eine Frage. Dort wird zur größeren Stufe
 *      gerundet, also aufwärts. 7:30 ergibt damit 0,25 und deckt den vom
 *      Auftraggeber genannten Datenpunkt. Im Modus `up` stellt sich die
 *      Frage nicht.
 */

import type { Seconds, QuarterHours } from './kernel.ts';

/** Sekunden je Viertelstunde. Einzige Stelle, an der diese Zahl vorkommt. */
export type SecondsPerQuarterHour = 900;

/**
 * Rundungsverfahren.
 *
 * `up`      — E-008, aufwärts auf die nächste Viertelstunde. Bestätigt und Vorgabe.
 * `nearest`  — kaufmännisch zur nächstgelegenen Viertelstunde, bei genau
 *              dazwischen aufwärts, nie unter 0,25. Alternative aus R-03.
 *
 * Die Werte sind englisch und stehen so auch in der Speicherung:
 * `app_setting.rounding_mode` und `export_run.rounding_mode` führen einen CHECK
 * auf genau diese Literale. Die deutsche Beschriftung („aufwärts",
 * „kaufmännisch") gehört in die Oberfläche, nicht in die Datenbank.
 *
 * Der gewählte Modus wird in den Einstellungen geführt und bei jedem Exportlauf
 * mitgeschrieben (`export_run.rounding_mode`), damit später nachvollziehbar
 * bleibt, nach welcher Regel eine Abrechnung entstanden ist.
 */
export type RoundingMode = 'up' | 'nearest';

/**
 * Rundet eine Dauer auf Viertelstunden.
 *
 * Rein: gleiche Eingabe ergibt immer gleiche Ausgabe, kein Zugriff auf Uhr,
 * Dateisystem, Netz oder Datenbank. Ohne laufenden Dienst prüfbar.
 *
 * @returns Anzahl Viertelstunden >= 1, oder `null`, wenn `seconds <= 0`.
 */
export type RoundToQuarterHours = (
  seconds: Seconds,
  mode: RoundingMode,
) => QuarterHours | null;

/**
 * Wandelt Viertelstunden in den Zahlwert des Exportfeldes `Zeit` (A-8.3).
 *
 * `quarters / 4`. Exakt in IEEE-754, siehe `QuarterHours` in kernel.ts.
 * Diese Umwandlung geschieht ausschließlich am Rand, beim Erzeugen des JSON.
 */
export type QuarterHoursToExportNumber = (quarters: QuarterHours) => number;

// ---------------------------------------------------------------------------
// Umsetzung (T-009)
// ---------------------------------------------------------------------------

/**
 * Sekunden je Viertelstunde. Die einzige Stelle im Projekt, an der diese Zahl
 * als Wert vorkommt.
 */
export const SECONDS_PER_QUARTER_HOUR: SecondsPerQuarterHour = 900;

/**
 * Rundet eine Dauer auf Viertelstunden. Siehe den Vertrag im Kopf dieser Datei.
 *
 * Die Eingabe ist die **Tagessumme je Todo** (E-020), nicht die Dauer einer
 * einzelnen Buchung. Erst addieren, dann runden — die umgekehrte Reihenfolge
 * ergibt bei 10, 20 und 5 Minuten 1,00 statt 0,75 und rechnet damit still zu
 * viel ab.
 *
 * `!(seconds > 0)` statt `seconds <= 0`: Der Ausdruck fängt zusätzlich `NaN`,
 * für das jeder Vergleich falsch ist. Ohne ihn liefe `NaN` durch `Math.ceil`
 * und `Math.max` hindurch und käme als `NaN` in einer Rechnung an.
 */
export const roundToQuarterHours: RoundToQuarterHours = (seconds, mode) => {
  if (!(seconds > 0)) return null;

  const exact = seconds / SECONDS_PER_QUARTER_HOUR;

  // `nearest` rundet bei genau der Hälfte aufwärts (7:30 -> 0,25), `up` immer.
  const quarters = mode === 'nearest' ? Math.floor(exact + 0.5) : Math.ceil(exact);

  // Die Untergrenze aus E-008. Ohne sie ergäbe `nearest` für 3 Minuten 0,00.
  return Math.max(1, quarters);
};

/**
 * Wandelt Viertelstunden in den Zahlwert des Exportfeldes `Zeit` (A-8.3).
 *
 * Ausschließlich am Rand aufzurufen, beim Erzeugen der Datei oder der Vorschau.
 * Innerhalb der Domäne wird mit ganzen Viertelstunden gerechnet, damit keine
 * Gleitkommasumme entsteht, die sich um ein Hundertstel von der Datei
 * unterscheidet.
 */
export const quarterHoursToExportNumber: QuarterHoursToExportNumber = (quarters) => quarters / 4;
