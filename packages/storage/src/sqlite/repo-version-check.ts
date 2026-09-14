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
 * Was ein Wurf aus dieser Datei kostet — und was er nicht kann (T-364, A-A-124)
 * ===========================================================================
 *
 * **Die Tatsache für den Rest des Laufs — bis T-367.** Warf `recordCheck` ein
 * einziges Mal, legte der Prüfer den Speicher ab und merkte sich bis zum
 * Programmende keinen Zeitpunkt mehr. Gemessen am echten Prüfer gegen eine
 * echte Datei, mit einer Sperre, die nach kurzer Zeit wieder aufging: **ein**
 * fehlgeschlagener von 63 Schreibversuchen, danach 51 ausgehende Anfragen ohne
 * einen weiteren Eintrag. Der Bestand trug am Ende einen **52 Stunden alten**
 * Zeitpunkt — veraltet, nicht fehlend —, und die Datensicherung trägt ihn mit.
 *
 * **Seit T-367 kostet ein Wurf aus dieser Datei den Rest des Laufs nicht mehr**
 * (`reportStoreFailure` und `forgetStore` in
 * `apps/local-api/src/features/version/version.ts`): Er wird gemeldet — genau
 * eine Protokollzeile über die ganze Laufzeit —, aber der Speicher bleibt, und
 * der nächste Takt ruft wieder hier an. In derselben gemessenen Lage ist der
 * Wert danach **1 Stunde statt 52 Stunden** alt. Was ein Wurf aus dieser Datei
 * heute kostet, ist **ein** Schreibvorgang und ein Eintrag im Protokoll.
 *
 * **Löschen hilft dagegen nicht**, und das ist gemessen und nicht gemutmaßt:
 * Der Weg zu diesem Wert ist derselbe Kanal, der eben versagt hat. Bei einer
 * nur lesenden Verbindung, einer geschlossenen Verbindung und einer gesperrten
 * Datei wirft auch das `UPDATE … = NULL`. Die Begründung im ganzen steht bei
 * {@link VersionCheckStatePort}; hier steht sie, weil jemand, der diese Datei
 * um ein „vergiß den Wert" erweitern will, es hier zuerst liest.
 *
 * **Dieses `UPDATE` ist synchron.** Es kehrt zurück, bevor ein Zeitgeber mit
 * 0 ms drankommt (gemessen). Die Frist von fünf Sekunden, die der Prüfer über
 * ein angestoßenes Schreiben legt (A-A-106), kann für diesen Adapter also nie
 * ablaufen — und seit T-367 ist der einzige Weg, der noch ablegt, genau
 * dieser: Abgelegt wird nur noch der Speicher, der **nie antwortet**, und das
 * ist ein Adapter, den es hier nicht gibt. Dieser hier wirft, und ein Wurf legt
 * nicht mehr ab.
 *
 * **Und es kann die Ereignisschleife anhalten.** `busy_timeout = 5000`
 * (`database.ts`): Hält ein zweiter Schreiber die Datei, steht dieser Aufruf
 * gemessene **5 004 ms** und wirft danach `database is locked`. Der Port des
 * Prüfers sagt, was ein Adapter nicht dürfe, sei „synchron blockieren" — dieser
 * tut es unter einer Sperre. Das ist die zweite Achse von R-30 (A-A-125) an
 * ihrer Stelle im Bestand und kein Gedankenfall.
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
