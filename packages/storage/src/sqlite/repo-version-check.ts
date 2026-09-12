/**
 * Takt — der Zeitpunkt der letzten Anfrage der Versionsprüfung (A-V-11, A-20.4,
 * E-011, Migration 0022, T-279, T-285).
 *
 * ===========================================================================
 * Warum dieser Wert auf die Platte geht — und was er dort seit T-285 ist
 * ===========================================================================
 *
 * **Er ist eine Tatsache und keine Sperre.** Geschrieben wird er vor jeder
 * ausgehenden Anfrage; gelesen wird er von keinem Betriebspfad. Er beantwortet
 * eine Frage („wann wurde zuletzt gefragt") und nimmt am Round-Trip der
 * Datensicherung teil (A-20.4) — mehr nicht.
 *
 * In T-279 war er mehr: der **Bezugspunkt des harten Bodens über
 * Prozeßgrenzen hinweg**. Der Dienst las ihn beim ersten Prüflauf, und ein
 * Neustart innerhalb einer Stunde prüfte deshalb gar nicht. Gemessen war der
 * Anlaß richtig (T-276: rund 344 ausgehende Anfragen je Stunde für den, der
 * den Sidecar in einer Schleife startet), der Preis aber zu hoch: Der Neustart
 * ist die einzige Selbsthilfe, die E-069 dem Benutzer läßt, wenn die Prüfung
 * nicht greift, und er war damit bis zu eine Stunde lang wirkungslos. **Ein
 * Programmstart prüft seit T-285 immer einmal.**
 *
 * **Und als Abwehr gegen einen feindlichen lokalen Prozeß taugte der Wert
 * ohnehin nicht.** Wer den Sidecar in einer Schleife startet, öffnet diese
 * Datei auch mit `sqlite3` und setzt die Zeitmarke zurück; das
 * Anwendungsdatenverzeichnis kommt aus der Umgebung und ist vom Startenden
 * bestimmbar (VG-3). Wer diese Spalte als Behebung von R-19 verkauft, verkauft
 * die falsche Sache.
 *
 * `lastCheckAt()` hat deshalb **keinen Aufrufer im Betrieb**. Die Frage bleibt
 * als Naht, an der `recordCheck()` nachweisbar ist
 * (`packages/storage/test/repo-version-check.test.ts`); ein Schreiber ohne
 * Leser ist ein Schreiber ohne Nachweis. Sie wieder an die Versionsprüfung zu
 * hängen hieße, T-279 nachzubauen.
 *
 * ===========================================================================
 * Warum die Anweisungen erst beim Aufruf vorbereitet werden
 * ===========================================================================
 *
 * Der Zusammenbau des Dienstes öffnet die Datenbank **vor** dem Migrationslauf
 * (`compose()` in `apps/local-api/src/composition.ts`, danach
 * `bringDatabaseUpToDate` in `main.ts`). Ein `prepare` im Rumpf dieser Funktion
 * liefe damit gegen ein Schema, in dem die Spalte aus 0022 noch nicht steht,
 * und bräche den Start eines Bestands, der gerade erst aktualisiert wird.
 *
 * Die Anweisungen entstehen deshalb im Aufruf. Der Preis ist ein `prepare` je
 * Anfrage der Versionsprüfung — also höchstens eines je Stunde, und die
 * Anweisungsablage von SQLite trägt es ohnehin.
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
