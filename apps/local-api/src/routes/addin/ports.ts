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
 * Deshalb bekommt das Add-in nicht die 57 Operationen der vollen Beschreibung,
 * sondern das, was es für A-10.4, A-10.5 und A-10.9 tatsächlich braucht: den
 * Tag- und Ordnerbaum lesen, nach einer Call-Nummer suchen, ein Todo anlegen,
 * eine Zeit buchen. Kein Löschen, kein Export, kein Zugriff auf den internen
 * Vermerk eines fremden Todos, keine Einstellungen. Das ist die Anwendung von
 * „Angriffsfläche des Tokens klein halten" (RR-1) auf den Zuschnitt der API.
 *
 * ## Warum `Pick<>` auf den echten Ports
 *
 * Jede Methode hier ist **zeichengleich** eine Methode aus
 * `packages/storage/src/ports.ts`. Damit ist ein echter `UnitOfWork` aus T-009
 * strukturell zuweisbar: Wer die Routen verdrahtet, übergibt schlicht die
 * vorhandene Arbeitseinheit — es gibt keinen Adapter, der zwischen zwei
 * Schnittstellen übersetzt und dabei etwas verlieren könnte. Gleichzeitig sagt
 * `Pick<>` im Quelltext aus, welche Fähigkeiten das Add-in hat und welche nicht
 * — und jede weitere kostet eine Begründung an Ort und Stelle.
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
   * `findByKey` und `create` kamen mit T-061 dazu, und der Zuwachs ist die
   * einzige Änderung an der Fläche des Add-in-Tokens seit T-038.
   *
   * **Warum überhaupt.** A-9.5 verlangt, dass die Standard-Tags auf jedem Weg
   * greifen, auf dem ein Todo entsteht. Für **neue** Tags gilt dasselbe
   * Argument: Seit T-058 darf die Hauptanwendung beim Anlegen eines Todos
   * Tagnamen mitschicken, die es noch nicht gibt. Könnte das Add-in das nicht,
   * hätte derselbe Vorgang wieder zwei Ergebnisse, je nachdem wo er geschieht —
   * genau der Befund C-03.
   *
   * **Warum genau diese zwei und keine dritte.** `findByKey` fragt, `create`
   * schreibt; zusammen sind sie „finde das Tag oder lege es an“ und sonst
   * nichts. Ausdrücklich **nicht** dabei:
   *
   *  - `rename` und `move` — sie ändern **fremde** Tags. Ein entwendetes
   *    Add-in-Token könnte damit die Tagstruktur umbauen und über die Pools
   *    ändern, welche Todos wo auftauchen.
   *  - `remove` — dasselbe, nur unwiederbringlich.
   *  - `load` und `listInFolder` — der Baum kommt bereits vollständig über
   *    `folders.loadTree`; eine zweite Leseflanke wäre Fläche ohne Zuwachs.
   *  - `setOnTodo` — Tags eines **fremden**, bestehenden Todos umzuhängen ist
   *    nicht der Anwendungsfall des Add-ins. Es setzt Tags nur an dem Todo,
   *    das es in derselben Transaktion selbst anlegt, und das tut
   *    `todos.create`.
   *
   * Damit kann ein entwendetes Token Tags **hinzufügen**, aber keines
   * verändern, verschieben oder löschen. Ein hinzugefügtes Tag ist sichtbar und
   * vom Benutzer zu entfernen; ein umbenanntes fiele niemandem auf.
   *
   * **Was die Reihenfolge nicht ist.** `findByKey` urteilt nicht. Ob aus keinem,
   * einem oder mehreren Treffern „anlegen“, „verwenden“ oder „nachfragen“ folgt,
   * entscheidet der Anwendungsfall in `service.ts` — dieselbe Regel wie in
   * `usecases/todos.ts`, und beide fragen die Domäne (`checkTagNames`), wann
   * zwei Namen derselbe sind.
   */
  readonly tags: Pick<TagPort, 'findByKey' | 'create'>;
  /**
   * `resolveRule` kam mit T-038 dazu, und der Zuwachs ist Absicht.
   *
   * A-2.5 hebt „Erledigt" beim Buchen **automatisch** auf. Damit das keine
   * stille Änderung ist, muss das Add-in den Satz sagen können, den die
   * Hauptanwendung sagt: in **welchen** Pools das Todo danach wieder steht
   * (I-05). Ohne die aufgelöste Tagmenge einer Regel ließe sich das nur raten
   * — oder das Add-in müsste `pools.members(...)` bekommen, also eine Abfrage
   * über **fremde** Todos. Das ist die weitere Fläche; `resolveRule` ist die
   * engere: Sie liest die Regel eines Pools, nie einen Bestand.
   *
   * `resolveExcluded` kam mit T-078 dazu, und es ist **keine** Ausweitung
   * dieser Überlegung, sondern ihre Vervollständigung. Seit T-076 hat eine
   * Regel zwei Taglisten: die erforderliche und die ausgeschlossene. Wer nur
   * die erste liest, beantwortet die Frage „gehört das Todo hier hinein?" mit
   * einer halben Regel und bekommt eine Antwort, die **zu viele** Pools nennt
   * (Risiko 1 aus T-076). Die Methode liest dieselbe Art Wert aus derselben
   * Zeile mit derselben Auflösung über Ordner — sie sieht keine Todos, keine
   * Notizen und keinen Bestand. Ein entwendetes Add-in-Token kommt damit
   * genau um die zweite Hälfte der Regel weiter, die es zur richtigen Antwort
   * braucht, und um nichts sonst.
   *
   * Die übrigen drei Achsen (`statusIds`, `completion`, `exportState`) stehen
   * am Pool selbst und kommen mit `list()`; sie brauchen keine eigene Methode.
   * Für die Buchungslage des Todos genügt `timeEntries.sumSeconds`, das
   * ohnehin schon hier steht — `TimeEntryPort.exportPresence` (T-076) wäre der
   * zweite Weg zu derselben Auskunft und bliebe deshalb draußen.
   */
  readonly pools: Pick<PoolPort, 'list' | 'resolveRule' | 'resolveExcluded'>;
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
