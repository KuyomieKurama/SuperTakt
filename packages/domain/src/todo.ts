/**
 * Takt — Todo, Status und interner Vermerk (A-2.*, A-5.*, A-7.1, A-7.2, E-006).
 *
 * Die **Kanban-Spalte** steht seit E-054 nicht mehr hier, sondern in `board.ts`
 * und `tag.ts`: Sie ist eine Regel. Tags sind darin eine Achse von fünf
 * (E-055) — der Status ist eine weitere, und `todo_status` ist geblieben, aber
 * als das, was es immer war: eine Eigenschaft des Todos.
 */

import type { DueState, DueSortDirection } from './due-date.ts';
import type { CalendarDay, PoolId, StatusId, TagId, TodoId, Timestamp } from './kernel.ts';

// ---------------------------------------------------------------------------
// Status eines Todos (A-5.3, A-5.4) — Tabelle `todo_status`
// ---------------------------------------------------------------------------

/**
 * Der **Status** eines Todos. Frei konfigurierbar (A-5.4); die vier Werte aus
 * A-5.3 sind Startbestand, keine feste Menge.
 *
 * **Seit E-054 ist das keine Kanban-Spalte mehr.** Eine Spalte ist eine Regel
 * (`Pool` mit `placement`, siehe `board.ts`), und der Status ist seit E-055
 * eine ihrer fünf Achsen, nicht ihr Gegenstück; der Status bleibt als
 * Eigenschaft am Todo und wird in Detailansicht und Liste geändert. Beides
 * nebeneinander ist Absicht und keine Doppelung: Der Status sagt, wie weit ein
 * Todo ist; die Spalte sagt, wonach das Board gerade fragt — und auf diese
 * zweite Frage gibt es seit E-054 mehr als eine Antwort je Karte.
 *
 * Der Typ heißt nach der Tabelle `todo_status`, damit Schicht und Schema
 * denselben Namen tragen (E-015, R-16). Auf dem Bildschirm heißt es seit E-054
 * **Status** und nicht mehr Spalte.
 *
 * Es gibt hier bewusst kein Merkmal, das eine Spalte als „Erledigt" ausweist.
 * Erledigt (A-2.4) und die Kanban-Abschlussspalte (A-5.3) sind zwei getrennte
 * Dinge: Ein Todo kann in „Done" stehen und nicht erledigt sein, und es kann
 * erledigt sein und in „In Progress" stehen. Das Erledigt-Kennzeichen ist
 * `Todo.completedAt` und hängt an keiner Spalte.
 *
 * `isDefault` ist die Spalte, in der ein neu angelegtes Todo landet, wenn der
 * Aufrufer keine nennt. Genau eine Spalte trägt die Markierung; die Speicherung
 * erzwingt das über einen partiellen eindeutigen Index.
 */
export interface TodoStatus {
  readonly id: StatusId;
  readonly name: string;
  readonly position: number;
  readonly isDefault: boolean;
  readonly color: string | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Todo (A-2.1 bis A-2.5, E-006)
// ---------------------------------------------------------------------------

/**
 * Ein Todo beziehungsweise Ticket.
 *
 * `statusId` und `completedAt` sind zwei voneinander unabhängige Achsen. Der
 * Status sagt, wie weit das Todo ist; `completedAt` sagt, ob es erledigt ist.
 * Weder das Setzen noch das Aufheben von Erledigt ändert den Status, und ein
 * geänderter Status ändert das Kennzeichen nicht.
 *
 * **In welcher Kanban-Spalte die Karte steht, sagt keines von beidem** (E-054).
 * Das ergibt sich aus den Tags und den Regeln der Spalten — abgeleitet wie die
 * Pool-Zugehörigkeit und aus demselben Grund nicht gespeichert (A-3.4). Eine
 * Karte kann seitdem in mehreren Spalten zugleich stehen; siehe `board.ts`.
 *
 * Was hier bewusst fehlt:
 *
 *  - Der interne Vermerk (A-7.1). Er liegt in `TodoNote` und wird getrennt
 *    geladen. Begründung unten und in R-06.
 *  - Die Pool-Zugehörigkeit (A-3.4). Sie ist aus `tagIds` abgeleitet und wird
 *    nirgends gespeichert. Genau deshalb funktioniert A-2.5 ohne Zusatzschritt.
 *  - Eine gemerkte Spalte für die Rückkehr aus „Erledigt". Es gibt nichts
 *    wiederherzustellen, weil das Erledigen den Status nie verändert hat — und
 *    seit E-054 erst recht nicht die Spalte, die niemand speichert.
 *    A-2.5 trägt `IsVisibleInPool` in tag.ts.
 *  - Die erfasste Arbeitszeit. Sie ist die Summe der Zeitbuchungen und wird
 *    berechnet, nicht mitgeführt, damit sie nie von den Buchungen abweichen kann.
 *  - Ein Sortierschlüssel innerhalb der Spalte (`boardRank`, A-5.2, A-13.6).
 *    Mit E-054 ist das Ziehen entfallen; er wurde von niemandem gesetzt und
 *    von nichts gelesen. Migration 0010 hat ihn samt `ux_todo_rank` entfernt.
 *    Wer eine vom Benutzer gewählte Reihenfolge braucht, führt sie neu ein und
 *    begründet sie — er belebt nicht diesen Rest wieder.
 */
export interface Todo {
  readonly id: TodoId;
  readonly title: string;
  /** Call-Nummer aus dem Add-in (E-006, A-2.6). Darf leer bleiben. */
  readonly callNumber: string | null;
  readonly statusId: StatusId;
  /**
   * Erledigt-Kennzeichen aus A-2.4. `null` bedeutet aktiv, ein Zeitstempel
   * bedeutet erledigt. Unabhängig von `statusId`.
   */
  readonly completedAt: Timestamp | null;
  /**
   * Die **Frist** (A-19.1 bis A-19.7, E-070). Ein Kalendertag, keine Uhrzeit.
   *
   * `null` heißt „keine Frist", und das ist ein vollwertiger Zustand: Ein Todo
   * ohne Frist bleibt in jeder Hinsicht ein gültiges Todo (A-19.1).
   *
   * Was hier **nicht** steht, ist der Zustand „überfällig / heute fällig /
   * später fällig" (A-19.5). Er wird gerechnet, nie gespeichert (E-070
   * Punkt 3) — `dueState(todo.dueDate, today)` in `due-date.ts`. Ein
   * gespeicherter Zustand wäre über Nacht falsch, ohne daß jemand etwas
   * angefaßt hat.
   *
   * Die Frist ist **keine Achse** (A-19.7, E-070 Punkt 4): Sie ändert nichts
   * an Pools, Spalten, Zeitbuchungen oder Export. Sie steht in keinem
   * `PoolRule`-Term und in keinem `ExportSourcePath` — und der Export sieht
   * sie ohnehin nie, weil er `ExportCandidate` bekommt und kein `Todo`
   * (A-19.17, R-06).
   */
  readonly dueDate: CalendarDay | null;
  readonly tagIds: readonly TagId[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Der interne Vermerk eines Todos (A-7.1). Tabelle `todo_note`.
 *
 * Auf dem Bildschirm heißt das Feld **Vermerk** (E-016); im Code trägt es den
 * Namen der Tabelle. Es bleibt in der Anwendung und geht nie in den Export —
 * im Unterschied zur **Leistung**, der Notiz der Zeitbuchung.
 *
 * Eigener Typ und eigene Tabelle, nicht ein Feld auf `Todo`. Das ist der Kern
 * der Trennung aus A-7.2 und die Antwort auf R-06:
 *
 *  1. Kein Wert vom Typ `Todo` trägt den Vermerk. Ein Exportpfad, der ein
 *     `Todo` in der Hand hält, kann ihn nicht versehentlich mitnehmen.
 *  2. Wer den Vermerk will, muss `TodoNote` ausdrücklich anfordern. Diese
 *     Anforderung ist im Quelltext eindeutig auffindbar.
 *  3. Der Exportmotor bekommt weder diesen Typ noch den Port, der ihn liefert.
 *
 * Siehe `ExportCandidate` und `ExportGroup` in export.ts für die zweite Hälfte
 * der Absicherung.
 */
export interface TodoNote {
  readonly todoId: TodoId;
  readonly text: string;
  readonly updatedAt: Timestamp;
}

/**
 * Ein Todo anlegen (A-2.1, A-9.3, A-9.5).
 *
 * `tagIds` sind die ausdrücklich gewählten Tags. Die Standard-Tags aus A-9
 * kommen im Anwendungsfall dazu, nicht in der Oberfläche und nicht im Add-in —
 * sonst griffe A-9.5 nur auf einem der beiden Wege.
 *
 * `note` ist der interne Vermerk aus A-7.1, nicht die Leistung einer Buchung.
 */
export interface TodoCreate {
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: StatusId | null;
  readonly tagIds: readonly TagId[];
  readonly note: string;
  /**
   * Die Frist (A-19.3). `null` heißt „ohne Frist" — der Regelfall.
   *
   * Sie kommt **geprüft** hier an: `checkDueDate` in `due-date.ts` läuft an
   * der Tür, und zwar an jeder. Auch an der des Add-ins (A-19.21, E-074
   * Punkt 4): ein Tag in fester Form, kein freier Text, keine Uhrzeit, keine
   * Rechnung aus einer E-Mail.
   *
   * ---------------------------------------------------------------------------
   * Freiwillig — und warum das hier **kein** dritter Fall ist
   * ---------------------------------------------------------------------------
   *
   * Beim **Ändern** sind „fehlt" und `null` zwei verschiedene Anweisungen:
   * unverändert lassen gegen entfernen (siehe {@link TodoUpdate}). Beim
   * **Anlegen** gibt es nichts zu entfernen — ein Todo, das es noch nicht
   * gibt, hat keine Frist, die man ihm nehmen könnte. Beide bedeuten deshalb
   * dasselbe: ohne Frist.
   *
   * Das ist keine Bequemlichkeit für Aufrufer, die das Feld vergessen, sondern
   * die Aussage, daß es hier nur zwei Zustände gibt. Der Adapter schreibt
   * `dueDate ?? null` und hat damit denselben Zweig für beide.
   */
  readonly dueDate?: CalendarDay | null;
  readonly now: Timestamp;
}

/**
 * Ein Todo ändern. Nicht gesetzte Felder bleiben unverändert.
 *
 * `dueDate` unterscheidet drei Fälle, und die Unterscheidung ist der Grund für
 * `exactOptionalPropertyTypes` in diesem Baum: Das Feld **fehlt** heißt „die
 * Frist bleibt, wie sie ist"; `null` heißt „die Frist entfernen" (A-19.3);
 * ein Tag heißt „auf diesen Tag setzen". Wer die ersten beiden verwechselt,
 * macht aus einer Löschung ein Weglassen.
 */
export interface TodoUpdate {
  readonly title?: string;
  readonly callNumber?: string | null;
  readonly statusId?: StatusId;
  readonly tagIds?: readonly TagId[];
  readonly dueDate?: CalendarDay | null;
  readonly now: Timestamp;
}

/**
 * Filter für Listen und Board (A-13.7).
 *
 * `poolIds` und `tagIds` schließen sich nicht aus; beide wirken zusätzlich.
 * `onlyOpen` filtert auf `completed_at IS NULL` und ist die Fassung von
 * `IsVisibleInPool` (tag.ts) auf der Abfrageseite: In Pool-Ansichten steht es
 * auf `true`, sonst entscheidet der Aufrufer.
 */
export interface TodoFilter {
  readonly search?: string;
  readonly statusIds?: readonly StatusId[];
  readonly tagIds?: readonly TagId[];
  readonly poolIds?: readonly PoolId[];
  readonly callNumber?: string;
  readonly onlyOpen?: boolean;
  readonly onlyWithOpenEntries?: boolean;
  /**
   * Filtern nach der Frist (A-19.20, E-074 Punkt 1).
   *
   * **Anzeige, keine Achse.** Dieses Feld steht in `TodoFilter` und
   * ausdrücklich nicht in `PoolRule`: Es ordnet eine Liste, es ordnet kein
   * Todo einem Pool zu. Wer die Frist später als Regelterm will, bekommt eine
   * eigene Entscheidung; `pool_rule` hat seit 0011 die Form dafür.
   *
   * `today` steht **daneben** und wird nicht hier gerechnet. Der Grund ist
   * E-070 Punkt 2: Es gibt einen Tagesbegriff, und er entsteht an einer
   * Stelle — `toCalendarDay(clock.now(), timeZone)` im Anwendungsfall. Ein
   * Filter, der sich seinen eigenen „heute" nähme, wäre der zweite.
   *
   * Mehrere Zustände wirken als **Vereinigung**: „überfällig oder heute
   * fällig" ist die Frage, die jemand stellt. Der Schnitt wäre immer leer.
   */
  readonly due?: TodoDueFilter;
  /**
   * Nach der Frist sortieren (A-19.20, E-074 Punkt 2).
   *
   * Ohne Angabe bleibt es bei der einen Ordnung, die es seit 0010 gibt:
   * zuletzt geändert, absteigend. Ein Todo **ohne** Frist steht in **beiden**
   * Richtungen am Ende und bekommt kein Platzhalterdatum — die Begründung
   * steht bei `compareByDueDate` in `due-date.ts`.
   */
  readonly sortByDueDate?: DueSortDirection;
}

/** Welche Fristzustände die Liste zeigen soll, und gegen welchen Tag gerechnet wird. */
export interface TodoDueFilter {
  readonly states: readonly DueState[];
  readonly today: CalendarDay;
}
