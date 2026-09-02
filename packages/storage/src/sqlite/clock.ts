/**
 * Takt — Uhr und Windows-Benutzername als Ports.
 *
 * ---------------------------------------------------------------------------
 * Warum die Dauer nicht aus zwei Wanduhrzeiten entsteht
 * ---------------------------------------------------------------------------
 *
 * `now()` liefert die Wanduhr, `monotonicSeconds()` eine Quelle, die nur
 * vorwärts läuft. Der Unterschied ist keine Feinheit: Stellt sich die Uhr
 * während eines laufenden Timers — Zeitumstellung, Abgleich über das Netz,
 * Benutzer korrigiert das Datum —, dann ergibt die Differenz zweier
 * Wanduhrzeiten eine falsche Dauer. Nach der Aufrundung aus E-008 landet sie
 * in einer Rechnung.
 *
 * Der Zeitstempel ist sekundengenau und in UTC: `YYYY-MM-DDTHH:MM:SSZ`. Nicht
 * feiner, weil die Speicherung die Dauer aus Start und Ende berechnet und
 * Bruchteile dort ohnehin abgeschnitten würden — und weil die CHECKs im Schema
 * genau diese Form über `GLOB` erzwingen. Ein Zeitstempel mit Millisekunden
 * käme gar nicht erst in die Tabelle.
 */

import type { ClockPort, SystemPort } from '../ports.ts';
import type { Timestamp } from '@takt/domain';

/** Wandelt ein Datum in die eine Form, die das Schema annimmt. */
export function toTimestamp(date: Date): Timestamp {
  // `toISOString` liefert `…THH:MM:SS.mmmZ`. Die Millisekunden fallen; sie
  // werden abgeschnitten und nicht gerundet, damit ein Zeitstempel nie vor dem
  // Ereignis liegt, das er bezeichnet.
  return `${date.toISOString().slice(0, 19)}Z` as Timestamp;
}

export function createClockPort(now: () => Date = () => new Date()): ClockPort {
  return {
    now: () => toTimestamp(now()),
    monotonicSeconds: () => Math.floor(performance.now() / 1000),
  };
}

/**
 * Der Windows-Benutzername (A-8.5, E-010, E-042).
 *
 * Er kommt als Wert herein und wird hier nur weitergereicht. Ausdrücklich
 * **kein** Rückfall auf `process.env.USERNAME`: Wer Takt mit
 * `set USERNAME=fremder && Takt.exe` startete, bekäme sonst fremde Arbeitszeit
 * unter seinem Namen in die Abrechnung (B-8.1). Der Wert kommt über die zweite
 * `stdin`-Zeile von der Tauri-Hülle; fehlt er, startet der Dienst gar nicht.
 */
export function createSystemPort(windowsUser: string, databasePath: string | null = null): SystemPort {
  return {
    windowsUser: () => windowsUser,
    // Vorgabe `null`: Ein Bestand im Arbeitsspeicher hat keinen Pfad, und ein
    // erfundener wäre schlimmer als keiner — er stünde in der Oberfläche als
    // Ort, an dem nichts liegt.
    databasePath: () => databasePath,
  };
}
