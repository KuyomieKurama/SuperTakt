/**
 * Takt — Einstellungen (A-9, E-009, E-011). Tabelle `app_setting`.
 */

import type { ExportTemplateId, Timestamp } from './kernel.ts';
import type { RoundingMode } from './rounding.ts';

/**
 * Anwendungseinstellungen. Eine Zeile, feste Felder — kein Schlüssel-Wert-Beutel,
 * damit jede Einstellung einen Typ hat und eine Migration erzwingt.
 *
 * Was hier bewusst nicht steht:
 *
 *  - Das Add-in-Token (E-009, R-09). Es liegt in einer eigenen Datei im
 *    Anwendungsdatenverzeichnis, außerhalb der Datenbank. Begründung in
 *    docs/architektur.md, Abschnitt „Token".
 *  - Eine Rückkehr-Spalte, weder konfiguriert noch gemerkt (E-023). Erledigt
 *    und Kanban-Spalte sind zwei getrennte Dinge: Weder das Setzen noch das
 *    Aufheben von „Erledigt" ändert die Spalte, also gibt es nichts
 *    wiederherzustellen. A-2.5 löst sich über Sichtbarkeit — Pools sind
 *    tag-abgeleitet (A-3.4), erledigte Todos sind in Pool-Ansichten
 *    ausgeblendet (E-039), und der Timerstart hebt das Kennzeichen auf.
 *    Damit erscheint das Todo wieder in seinem Pool, ohne dass irgendwo eine
 *    Spalte gespeichert wäre.
 */
export interface AppSettings {
  /**
   * Zielordner für Exportdateien (E-011). `null` bedeutet: noch nicht gewählt,
   * Export nicht möglich. Der Pfad ist Benutzereingabe und wird bei jedem Lauf
   * neu geprüft, nicht nur beim Setzen (R-11).
   */
  readonly exportDirectory: string | null;
  readonly activeExportTemplateId: ExportTemplateId | null;
  /** Umschaltbar; der verwendete Modus wird je Exportlauf mitgeschrieben (E-008). */
  readonly roundingMode: RoundingMode;
  readonly locale: string;
  readonly theme: 'system' | 'light' | 'dark';
  readonly updatedAt: Timestamp;
}

/** Änderung an den Einstellungen. Nicht gesetzte Felder bleiben unverändert. */
export interface AppSettingsUpdate {
  readonly exportDirectory?: string | null;
  readonly activeExportTemplateId?: ExportTemplateId | null;
  readonly roundingMode?: RoundingMode;
  readonly locale?: string;
  readonly theme?: 'system' | 'light' | 'dark';
  readonly now: Timestamp;
}

/**
 * Was an einem Exportordner **belegbar** ist, nicht was an ihm vermutet wird.
 *
 * Die Oberfläche warnt vor Synchronisierungsordnern, Netzlaufwerken und
 * Systemverzeichnissen und begründet das mit dem, was im Pfad steht
 * (`exportDirectoryAdvice.ts`, B-5.2, B-5.3 Punkt 3). Das ist eine Auslegung
 * von Zeichenketten und sagt es auch so: „liegt in", nicht „ist". Sie kann `Z:\`
 * nicht ansehen, und ein umbenannter OneDrive-Ordner heißt nicht „OneDrive".
 *
 * Diese Merkmale sind die andere Hälfte: Sie entstehen dort, wo das
 * Betriebssystem befragt werden kann — Dateisystemart, Umgebung des
 * angemeldeten Benutzers, aufgelöster Pfad. Wo nichts Belegbares herauskommt,
 * steht hier **nichts**; eine fehlende Angabe ist keine Entwarnung, sondern
 * eine Nichtaussage. Die Heuristik der Oberfläche bleibt daneben stehen und
 * bleibt die Erklärung; diese Liste ist der Beleg.
 *
 *   `unc`          Der Pfad ist eine Netzfreigabe in UNC-Schreibweise
 *                  (`\\server\freigabe`). Aus der Form ableitbar und damit
 *                  sicher.
 *   `network`      Der Ordner liegt auf einem Netzdateisystem. Belegt über die
 *                  Art des Dateisystems, nicht über den Namen des Laufwerks.
 *   `sync_folder`  Der Ordner liegt im Ablageordner eines
 *                  Synchronisierungsdienstes, wie ihn dessen Client der
 *                  Umgebung mitteilt — unabhängig davon, wie der Ordner heißt.
 *   `system_dir`   Der Ordner liegt in einem Systemverzeichnis, wie es das
 *                  Betriebssystem selbst benennt. Auch dann, wenn Windows nicht
 *                  auf `C:` liegt.
 */
export type ExportDirectoryTrait = 'unc' | 'network' | 'sync_folder' | 'system_dir';

/**
 * Ergebnis der Prüfung eines Exportordners (E-011, R-11).
 *
 * Geprüft wird vor jedem Schreibvorgang, nicht nur beim Einstellen: der Ordner
 * kann seit dem Setzen verschwunden, schreibgeschützt oder ein nicht
 * verbundenes Netzlaufwerk geworden sein.
 *
 * `unreachable` ist nicht `missing`. Ein Ordner, dessen Prüfung in eine
 * Zeitgrenze läuft, ist nicht als abwesend belegt — er hat nur nicht geantwortet.
 * Der Unterschied ist der zwischen „gelöscht" und „die Freigabe hängt", und er
 * führt zu verschiedenen Handgriffen: Im einen Fall wählt man einen anderen
 * Ordner, im anderen wartet man oder verbindet das Laufwerk neu.
 *
 * Die **Merkmale** eines Ordners stehen bewusst nicht in diesem Ergebnis,
 * sondern in einer eigenen Auskunft (`ExportDirectoryTrait`, `describe…` im
 * Port). Zwei Gründe: Sie hängen nicht am Ausgang der Prüfung — ein
 * Systemverzeichnis bleibt eines, ob es nun beschreibbar ist oder nicht —, und
 * ein Ergebnis, das je nach Zweig einmal Merkmale trägt und einmal nicht, ist
 * genau die Gestalt, bei der ein Aufrufer das Nachsehen für eine Entwarnung
 * hält.
 */
export type ExportDirectoryCheck =
  | { readonly ok: true; readonly resolvedPath: string }
  | { readonly ok: false; readonly reason: 'not_set' | 'missing' | 'not_writable' | 'not_a_directory' }
  | {
      readonly ok: false;
      readonly reason: 'unreachable';
      /** Wie lange gewartet wurde, bevor abgebrochen wurde. Für die Meldung. */
      readonly waitedMs: number;
    };
