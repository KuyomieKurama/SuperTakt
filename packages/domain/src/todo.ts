/**
 * Takt — Todo, Status und interner Vermerk (A-2.*, A-5.*, A-7.1, A-7.2, E-006).
 *
 * Die **Kanban-Spalte** steht seit E-054 nicht mehr hier, sondern in `board.ts`
 * und `pool.ts`: Sie ist eine Regel. Tags sind darin eine Achse von fünf
 * (E-055) — der Status ist eine weitere, und `todo_status` ist geblieben, aber
 * als das, was es immer war: eine Eigenschaft des Todos.
 */

import type { DueState, DueSortDirection } from './due-date.ts';
import type { CalendarDay, PoolId, StatusId, TagId, TodoId, Timestamp } from './kernel.ts';

// Status eines Todos (A-5.3, A-5.4) — Tabelle `todo_status`

/** Frei konfigurierbarer Status, unabhängig von `completedAt` und der Kanban-Spalte. */
export interface TodoStatus {
  readonly id: StatusId;
  readonly name: string;
  readonly position: number;
  readonly isDefault: boolean;
  readonly color: string | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface TodoPriority {
  readonly id: string;
  readonly name: string;
  readonly weight: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// Todo (A-2.1 bis A-2.5, E-006)

/**
 * Status und Erledigt-Kennzeichen sind unabhängig. Interne Vermerke werden getrennt geladen;
 * Poolmitgliedschaften und Zeit summiert bzw. berechnet.
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
   * Kalendertag ohne Uhrzeit; null bedeutet keine Frist. Fälligkeitszustände werden je Anfrage
   * berechnet.
   */
  readonly dueTime?: string | null;
  readonly estimateMinutes?: number | null;
  readonly noExport?: boolean;
  readonly priorityId?: string | null;
  readonly dueDate: CalendarDay | null;
  readonly tagIds: readonly TagId[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Interne Vermerke bleiben vom Todo und vom Exportvertrag getrennt, damit sie nicht versehentlich
 * in die Abrechnung gelangen.
 */
export interface TodoNote {
  readonly todoId: TodoId;
  readonly text: string;
  readonly updatedAt: Timestamp;
}

/**
 * Standard-Tags ergänzt der Anwendungsfall, damit sie auch bei Anlage aus dem Add-in gelten.
 * `note` bezeichnet den internen Vermerk.
 */
export interface TodoCreate {
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: StatusId | null;
  readonly tagIds: readonly TagId[];
  readonly note: string;
  /**
   * Beim Anlegen bedeuten fehlend und null dasselbe: keine Frist. Der Tageswert muss bereits
   * geprüft sein.
   */
  readonly dueTime?: string | null;
  readonly estimateMinutes?: number | null;
  readonly noExport?: boolean;
  readonly priorityId?: string | null;
  readonly dueDate?: CalendarDay | null;
  readonly now: Timestamp;
}

/** Nicht gesetzte Felder bleiben unverändert; `dueDate: null` entfernt die Frist. */
export interface TodoUpdate {
  readonly title?: string;
  readonly callNumber?: string | null;
  readonly statusId?: StatusId;
  readonly tagIds?: readonly TagId[];
  readonly dueTime?: string | null;
  readonly estimateMinutes?: number | null;
  readonly noExport?: boolean;
  readonly priorityId?: string | null;
  readonly dueDate?: CalendarDay | null;
  readonly now: Timestamp;
}

/**
 * Filter für Listen und Board (A-13.7).
 *
 * `poolIds` und `tagIds` schließen sich nicht aus; beide wirken zusätzlich.
 * `onlyOpen` filtert auf `completed_at IS NULL` und ist die Fassung von
 * `IsVisibleInPool` (pool.ts) auf der Abfrageseite: In Pool-Ansichten steht es
 * auf `true`, sonst entscheidet der Aufrufer.
 */
export interface TodoFilter {
  readonly priorityIds?: readonly string[];
  readonly withoutPriority?: boolean;
  readonly sortByPriority?: boolean;
  readonly search?: string;
  readonly statusIds?: readonly StatusId[];
  readonly tagIds?: readonly TagId[];
  readonly poolIds?: readonly PoolId[];
  readonly callNumber?: string;
  readonly onlyOpen?: boolean;
  readonly onlyWithOpenEntries?: boolean;
  /**
   * Mehrere Fälligkeitszustände wirken als ODER. `today` kommt aus der gemeinsamen Tagesberechnung
   * des Anwendungsfalls.
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
