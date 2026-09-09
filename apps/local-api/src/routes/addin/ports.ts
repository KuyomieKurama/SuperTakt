/**
 * Takt — was die Add-in-Routen von der Speicherung brauchen (T-019).
 *
 * ## Warum ein eigener, schmaler Port
 *
 * Das Add-in ist **nicht** dieselbe Vertrauensstufe wie die Oberfläche in der
 * Tauri-Hülle:
 *
 *  - Es läuft in einem Browsersteuerelement innerhalb von Outlook, und sein
 *    Inhalt wird zum Teil von einem Dritten bestimmt — dem Absender der E-Mail
 *    (Akteur A-06 im Bedrohungsmodell).
 *  - Es weist sich mit dem **dauerhaften** Token aus, die Oberfläche dagegen
 *    mit dem Sitzungsgeheimnis (E-009, B-2.9 Punkt 3). Ein entwendetes
 *    Add-in-Token kommt genau so weit, wie diese Fläche reicht.
 *
 * Deshalb bekommt das Add-in nicht die volle Beschreibung, sondern nur die
 * Operationen, die der Aufgabenbereich wirklich braucht: den Tag- und
 * Ordnerbaum lesen, nach einer Call-Nummer suchen, ein Todo anlegen, eine Zeit
 * buchen und einen **http(s)-Verweis** an ein bereits erkanntes Todo hängen.
 * Kein Löschen, kein Export, kein Zugriff auf den internen Vermerk eines
 * fremden Todos, keine Einstellungen. Das ist die Anwendung von
 * „Angriffsfläche des Tokens klein halten" (RR-1) auf den Zuschnitt der API.
 *
 * Der Anhang-Zuwachs ist bewusst schmal: Das Add-in bekommt nur `list` und
 * `create` auf dem Attachment-Port. Die Route akzeptiert ausschließlich
 * `kind: link` und normalisiert die URL in der Domäne. Damit kann ein
 * entwendetes Add-in-Token weder Dateien lesen noch Bilder kopieren, Anhänge
 * löschen oder fremde Pfade in den Bestand schreiben.
 *
 * ## Warum `Pick<>` auf den echten Ports
 *
 * Jede Methode hier ist **zeichengleich** eine Methode aus
 * `packages/storage/src/ports.ts`. Damit ist ein echter `UnitOfWork` strukturell
 * zuweisbar: Wer die Routen verdrahtet, übergibt schlicht die vorhandene
 * Arbeitseinheit — es gibt keinen Adapter, der zwischen zwei Schnittstellen
 * übersetzt und dabei etwas verlieren könnte. Gleichzeitig sagt `Pick<>` im
 * Quelltext aus, welche Fähigkeiten das Add-in hat und welche nicht — und jede
 * weitere kostet eine Begründung an Ort und Stelle.
 */

import type {
  AttachmentPort,
  DefaultTagPort,
  PoolPort,
  TagFolderPort,
  TagPort,
  TimeEntryPort,
  TodoPort,
  TodoStatusPort,
} from '@takt/storage';
import type { Timestamp } from '@takt/domain';

/**
 * Die Ports innerhalb **einer** Transaktion.
 *
 * Strukturell ein Ausschnitt von `UnitOfWork`. Ein echter `UnitOfWork` erfüllt
 * diesen Typ ohne Zutun.
 */
export interface AddinUnit {
  readonly todos: Pick<TodoPort, 'load' | 'findByCallNumber' | 'create' | 'clearDone'>;
  /**
   * Nur Verweise an ein vorhandenes Todo anhängen.
   *
   * `list` macht den Vorgang idempotent: Ein Doppelklick oder ein erneuter
   * Versuch legt denselben Outlook-Link nicht zweimal an. `create` ist der
   * einzige Schreibzugriff. `remove`, `load`, Bildabfragen und Dateizugriffe
   * bleiben ausdrücklich außerhalb dieser Vertrauensstufe.
   */
  readonly attachments: Pick<AttachmentPort, 'list' | 'create'>;
  readonly folders: Pick<TagFolderPort, 'loadTree'>;
  /**
   * `findByKey` und `create` kamen mit T-061 dazu.
   *
   * **Warum überhaupt.** A-9.5 verlangt, dass die Standard-Tags auf jedem Weg
   * greifen, auf dem ein Todo entsteht. Für **neue** Tags gilt dasselbe
   * Argument: Die Hauptanwendung darf beim Anlegen eines Todos Tagnamen
   * mitschicken, die es noch nicht gibt. Könnte das Add-in das nicht, hätte
   * derselbe Vorgang wieder zwei Ergebnisse, je nachdem wo er geschieht.
   *
   * **Warum genau diese zwei und keine dritte.** `findByKey` fragt, `create`
   * schreibt; zusammen sind sie „finde das Tag oder lege es an“ und sonst
   * nichts. Ausdrücklich **nicht** dabei: `rename`, `move`, `remove`, `load`,
   * `listInFolder` oder `setOnTodo` für fremde Todos.
   */
  readonly tags: Pick<TagPort, 'findByKey' | 'create'>;
  /**
   * Die Auflösung der Pool-Regeln wird für die bestehende Buchungsroute und
   * die Trefferbeschreibung weiterhin benötigt. Der neue Anhangpfad verändert
   * keine Zeit und keinen Zustand eines Todos.
   */
  readonly pools: Pick<PoolPort, 'list' | 'resolveAxes'>;
  readonly statuses: Pick<TodoStatusPort, 'list' | 'defaultStatus'>;
  readonly defaultTags: Pick<DefaultTagPort, 'list'>;
  readonly timeEntries: Pick<TimeEntryPort, 'create' | 'sumSeconds'>;
}

/**
 * Was die Routen zum Arbeiten brauchen.
 *
 * `inTransaction` ist dieselbe Klammer wie `TransactionPort.inTransaction`.
 * Auch eine reine Leseanfrage läuft darin: Der Tag- und Ordnerbaum wird aus
 * mehreren Abfragen zusammengesetzt, und ein Baum aus zwei verschiedenen
 * Zuständen wäre in einer Oberfläche schwer zu erklären.
 *
 * Die Uhr ist ein Port und keine Wanduhr im Modul — sonst wäre keine dieser
 * Routen ohne laufenden Rechner reproduzierbar prüfbar.
 */
export interface AddinDeps {
  inTransaction<T>(work: (unit: AddinUnit) => Promise<T>): Promise<T>;
  readonly now: () => Timestamp;
}
