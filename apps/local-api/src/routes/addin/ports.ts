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
 * **Und kein `AttachmentPort`.** Zwischen PR #16 und der Entscheidung zu F-21
 * stand hier einer mit `list` und `create`, für die schmale Verweisroute des
 * Aufgabenbereichs. Der Auftraggeber hat F-21 gegen das Anhängen entschieden
 * (T-247): die Route ist gefallen, und der Port mit ihr. In {@link AddinUnit}
 * steht er bis heute nicht.
 *
 * **Seit E-108 entsteht trotzdem ein Anhang — aber ausschließlich beim
 * Anlegen.** Die Fähigkeit dafür steht in {@link AddinDeps.emailAttachments}
 * und nicht in {@link AddinUnit}, und sie kennt keine `TodoId`. Der Unterschied
 * zur gefallenen Route ist nicht die Vorsicht, sondern die **Reichweite**: Jene
 * nahm eine Kennung entgegen und hängte an ein beliebiges vorhandenes Todo;
 * diese kann nur an das hängen, was im selben Aufruf entstanden ist. An ein
 * **vorhandenes** Todo kommt das Add-in-Token damit weiterhin auf keinem Weg
 * mit einem Anhang heran (A-A-82).
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

import type { EmailAttachmentIntake } from '../../features/todos/email-attachments.ts';

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
  /**
   * Die Aufnahme von Anhängen aus einer E-Mail (A-19.22 bis A-19.33, E-108).
   *
   * ---------------------------------------------------------------------------
   * In dieser Signatur gibt es **keinen Parameter vom Typ `TodoId`**
   * ---------------------------------------------------------------------------
   *
   * Das ist kein Versehen und keine Bequemlichkeit, sondern A-A-21′ (b)/(c) und
   * A-A-82, **im Typ festgehalten**. Die Fähigkeit nimmt keine Kennung
   * entgegen, sondern die **Funktion, die eine erzeugt**; ihr einziger Zugang
   * zu einem Todo führt durch den Anlegevorgang. An ein **vorhandenes** Todo
   * kann diese Tür deshalb nichts hängen — nicht, weil eine Prüfung es abweist,
   * sondern weil sie keines benennen kann.
   *
   * Wer sie darauf richten wollte, müßte eine Anlegefunktion schreiben, die
   * nichts anlegt und eine fremde Kennung zurückgibt. Das ist kein Versehen
   * mehr, das ist ein Entschluß, und er stünde im Quelltext.
   *
   * `apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 18 mißt dieselbe
   * Zusage noch einmal, und zwar **unabhängig vom Typ**: an der Wirkung gegen
   * eine echte Datenbank. Der Typ trägt sie beim Übersetzen, der Lauf beim
   * Fahren; keines von beiden allein ist der Nachweis.
   *
   * ---------------------------------------------------------------------------
   * Warum das Feld hier steht und nicht in {@link AddinUnit}
   * ---------------------------------------------------------------------------
   *
   * `AddinUnit` ist der Ausschnitt **innerhalb** einer Transaktion, und jede
   * seiner Zeilen ist ein `Pick<>` auf einem echten Port. Die Anhangsübernahme
   * ist keiner: Sie schreibt Bytes auf die Platte, **bevor** sie Zeilen
   * schreibt, und sie führt ihre Transaktion selbst. Sie in `AddinUnit` zu
   * legen hieße, dem Add-in einen schreibenden `AttachmentPort` zu geben — und
   * genau den hat es nach A-A-21′ (c) nicht.
   */
  readonly emailAttachments: EmailAttachmentIntake;
}
