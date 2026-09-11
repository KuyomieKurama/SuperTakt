/**
 * Takt — der Bezugspunkt des harten Bodens der Versionsprüfung (A-V-11,
 * A-18.10, A-24.7, E-011, Migration 0022, T-279).
 *
 * ===========================================================================
 * Warum dieser Wert überhaupt auf die Platte geht
 * ===========================================================================
 *
 * Bis T-279 lag er ausschließlich im Arbeitsspeicher des Dienstes. Ein neu
 * gestarteter Dienst kannte keinen letzten Zeitpunkt, also griff kein Boden,
 * also ging nach dem Startabstand von 10 s eine Anfrage hinaus — gemessen
 * (T-276) rund **344 ausgehende Anfragen je Stunde** für den, der den Sidecar
 * in einer Schleife startet und beendet.
 *
 * **Und genau der kann diese Datei auch mit `sqlite3` öffnen.** Ein Prozeß im
 * Benutzerkonto (VG-3) setzt die Zeitmarke zurück, so oft er will; das
 * Anwendungsdatenverzeichnis kommt aus der Umgebung und ist vom Startenden
 * bestimmbar. **Ein Bestandswert ist keine Abwehr gegen VG-3, sondern gegen den
 * Unfall.** Wer ihn als Behebung von R-19 verkauft, verkauft die falsche Sache.
 *
 * Der tragende Grund ist ein anderer, und er ist der stärkere: **Gleichbehandlung
 * mit `skipped_version`** (A-18.10) und mit den offenen Inaktivitätsphasen
 * (A-24.7). Beide Nachbarwerte derselben Fläche stehen im Bestand, „nicht im
 * Arbeitsspeicher und nicht im Browserspeicher". Ein Wert, der stillschweigend
 * eine andere Lebensdauer hat als sein Nachbar in derselben Tabellenzeile, ohne
 * daß irgendwo steht warum, ist genau die Unstimmigkeit, die dieser Bestand
 * mehrfach teuer bezahlt hat.
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
    async lastCheckAt(): Promise<Timestamp | null> {
      const row = conn
        .prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1')
        .get();
      /*
       * Fehlt die Zeile, ist der Bestand kaputt und nicht bloß leer — dieselbe
       * Lage wie in `createAppSettingsPort`. Hier wird trotzdem **nicht**
       * geworfen, sondern `null` geliefert: Der einzige Aufrufer ist die
       * Versionsprüfung, und die soll an einem kaputten Bestand nicht scheitern,
       * sondern sich verhalten wie beim allerersten Start. Wer den kaputten
       * Bestand meldet, ist der Einstellungsport, und er meldet ihn lauter.
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
