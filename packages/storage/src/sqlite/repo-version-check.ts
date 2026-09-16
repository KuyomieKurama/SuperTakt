/**
 * Der gespeicherte Prüfzeitpunkt ist Protokolldatum, keine Neustartsperre. Schreibfehler dürfen
 * spätere Versuche nicht dauerhaft abschalten.
 * SQLite kann bis zum busy_timeout synchron blockieren; eine asynchrone Frist unterbricht das
 * nicht.
 * Anweisungen erst beim Aufruf vorbereiten, da der Zusammenbau vor der Migration erfolgt.
 */

import type { Timestamp } from '@takt/domain';

import { type SqlConnection } from './database.ts';
import type { VersionCheckStatePort } from '../ports.ts';

export function createVersionCheckStatePort(conn: SqlConnection): VersionCheckStatePort {
  return {
    /*
     * Kein Aufrufer im Betrieb (T-285) — die Begründung steht im Kopf dieser
     * Datei, und sie ist keine Nachlässigkeit, sondern eine Entscheidung.
     */
    async lastCheckAt(): Promise<Timestamp | null> {
      const row = conn
        .prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1')
        .get();
      /*
       * Fehlt die Zeile, ist der Bestand kaputt und nicht bloß leer — dieselbe
       * Lage wie in `createAppSettingsPort`. Hier wird trotzdem **nicht**
       * geworfen, sondern `null` geliefert: „noch nie gefragt" ist eine gültige
       * Antwort, und ein Leser dieser Tatsache soll an einem kaputten Bestand
       * nicht scheitern. Wer den kaputten Bestand meldet, ist der
       * Einstellungsport, und er meldet ihn lauter.
       */
      const value = row?.['last_version_check_at'];
      return typeof value === 'string' ? (value as Timestamp) : null;
    },

    async recordCheck(at: Timestamp): Promise<void> {
      /*
       * `updated_at` bleibt ausdrücklich unangetastet.
       *
       * Es ist der Zeitpunkt der letzten **Einstellungsänderung** und wird über
       * `GET /settings` sichtbar. Würde eine ausgehende Anfrage der
       * Versionsprüfung ihn fortschreiben, entstünde in der Oberfläche eine
       * stündlich wandernde Angabe, aus der sich der Takt der Prüfung ablesen
       * ließe — die Fehlerfläche aus A-18.11 durch die Hintertür.
       */
      conn.prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1').run(at);
    },
  };
}
