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
 * Ordnerbaum lesen, nach einer Call-Nummer suchen, ein Todo anlegen und eine
 * Zeit buchen. Kein Löschen, kein Export, kein Zugriff auf den internen
 * Vermerk eines fremden Todos, keine Einstellungen. Das ist die Anwendung von
 * „Angriffsfläche des Tokens klein halten" (RR-1) auf den Zuschnitt der API.
 *
 * **Und kein Anhang.** Zwischen PR #16 und der Entscheidung zu F-21 stand hier
 * ein `AttachmentPort` mit `list` und `create`, für die schmale Verweisroute
 * des Aufgabenbereichs. Der Auftraggeber hat F-21 gegen das Anhängen
 * entschieden (T-247): A-19.19 bleibt im Wortlaut, die Route ist gefallen, und
 * der Port mit ihr. Das Add-in-Token kann damit auf keinem Weg einen Anhang
 * anlegen — nicht, weil eine Prüfung es abweist, sondern weil die Fähigkeit in
 * dieser Vertrauensstufe nicht vorhanden ist.
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
   * Die Auflösung der Pool-Regeln braucht die Buchungsroute, und die
   * Trefferbeschreibung des Duplikatfalls liest sie mit.
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
