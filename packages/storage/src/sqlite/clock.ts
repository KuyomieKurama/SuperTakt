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
import { inspectDatabasePermissions } from './database.ts';
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

    /*
     * **Bei jedem Aufruf neu gemessen** (T-132, O-C).
     *
     * Ein einmal beim Start gemerkter Wert wäre binnen Minuten falsch: SQLite
     * legt `-wal` und `-shm` im Betrieb wiederholt neu an, und der Modus einer
     * neu angelegten Datei hängt an der `umask` des Prozesses. Genau deshalb
     * setzt der Dienst sie (`main.ts`) — aber gemessen wird trotzdem, statt
     * geglaubt.
     *
     * Drei `stat`-Aufrufe auf eine lokale Datei; das trägt eine Abfrage der
     * Einstellungen ohne Weiteres.
     */
    databaseFilesTooPermissive: () => {
      if (databasePath === null) return null;
      const seen = inspectDatabasePermissions(databasePath);
      /*
       * `checked` ist seit T-146 (Befund T-143 S-4) nur dann `true`, wenn
       * **jede** der drei Dateien eine Antwort gegeben hat — nicht mehr schon
       * dann, wenn wir überhaupt nachgesehen haben.
       *
       * Vorher lief jeder gescheiterte `stat` in ein `catch {}`, die Liste
       * blieb leer, und diese Funktion gab **0** zurück: „alle drei liegen
       * eng", obwohl nichts gemessen wurde. `ports.ts` schließt genau das
       * aus — „`null` ist ausdrücklich **nicht** `0`, eine Nichtaussage ist
       * keine Entwarnung" —, und seit T-132 steht die Zahl in `GET /settings`
       * und wird gelesen.
       *
       * Der Ausdruck bleibt derselbe; was sich geändert hat, ist die Bedeutung
       * von `checked`, und sie steht bei `inspectDatabasePermissions`.
       */
      return seen.checked ? seen.tooPermissive.length : null;
    },
  };
}
