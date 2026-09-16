/**
 * Vor dem Runden die offenen Buchungen je Todo und Kalendertag summieren.
 * Positive Dauern ergeben mindestens eine Viertelstunde; nicht positive Dauern sind nicht
 * exportierbar.
 */

import type { Seconds, QuarterHours } from './kernel.ts';

/** Sekunden je Viertelstunde. Einzige Stelle, an der diese Zahl vorkommt. */
export type SecondsPerQuarterHour = 900;

/**
 * Der gewählte Rundungsmodus wird je Exportlauf gespeichert, damit die Abrechnung nachvollziehbar
 * bleibt.
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

// Umsetzung (T-009)

/**
 * Sekunden je Viertelstunde. Die einzige Stelle im Projekt, an der diese Zahl
 * als Wert vorkommt.
 */
export const SECONDS_PER_QUARTER_HOUR: SecondsPerQuarterHour = 900;

/**
 * Die Tagessumme je Todo runden, nicht einzelne Buchungen. `!(seconds > 0)` fängt zusätzlich NaN
 * ab.
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
