/**
 * Takt — Todo, Status und interner Vermerk (A-2.*, A-5.*, A-7.1, A-7.2, E-006).
 *
 * Die **Kanban-Spalte** steht seit E-054 nicht mehr hier, sondern in `board.ts`
 * und `tag.ts`: Sie ist eine Regel über Tags. `todo_status` ist geblieben, aber
 * als das, was es immer war — eine Eigenschaft des Todos.
 */

import type { PoolId, StatusId, TagId, TodoId, Timestamp } from './kernel.ts';

// ---------------------------------------------------------------------------
// Status eines Todos (A-5.3, A-5.4) — Tabelle `todo_status`
// ---------------------------------------------------------------------------

/**
 * Der **Status** eines Todos. Frei konfigurierbar (A-5.4); die vier Werte aus
 * A-5.3 sind Startbestand, keine feste Menge.
 *
 * **Seit E-054 ist das keine Kanban-Spalte mehr.** Eine Spalte ist eine Regel
 * über Tags (`Pool` mit `placement`, siehe `board.ts`); der Status bleibt als
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
  readonly now: Timestamp;
}

/** Ein Todo ändern. Nicht gesetzte Felder bleiben unverändert. */
export interface TodoUpdate {
  readonly title?: string;
  readonly callNumber?: string | null;
  readonly statusId?: StatusId;
  readonly tagIds?: readonly TagId[];
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
}
