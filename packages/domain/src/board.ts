/** Spalten sind Pools mit passender Platzierung. Eine Karte kann mehreren Regeln entsprechen; Domänen- und SQL-Auswertung müssen übereinstimmen. */

import type { PoolId, StatusId, TagId, Timestamp, TodoId } from './kernel.ts';
import type { MatchesPoolRule, Pool } from './pool.ts';
import { isVisibleInPool, matchesPool } from './pool.ts';

/**
 * Eine Spalte des Boards. **Derselbe Typ wie ein Pool** (E-054).
 *
 * Der Alias existiert, damit an einer Board-Fläche „Spalte" steht, ohne dass
 * daraus ein zweiter Wert wird. Wer hier ein eigenes `interface BoardColumn`
 * hinschreibt, hat die Entscheidung aus E-054 zurückgenommen.
 */
export type BoardColumn = Pool;

/**
 * Die vollständige aufgelöste Regelseite wird geerbt, damit neue Achsen nicht still verloren
 * gehen.
 */
export interface BoardColumnRule extends MatchesPoolRule {
  readonly columnId: PoolId;
  /**
   * Ansichtseinstellung, keine Regelachse. Ohne Angabe werden erledigte Karten nicht zusätzlich
   * ausgeblendet.
   */
  readonly includeCompleted?: boolean;
}

/**
 * Eine Karte, so viel davon, wie für die Zuordnung gebraucht wird.
 *
 * Alles außer `todoId` und `tagIds` ist freiwillig — und was fehlt, lässt eine
 * Spalte, die danach fragt, **nicht** treffen (`matchesPool`, fail-closed).
 * Ein Aufrufer, der nur Tags kennt, bekommt damit die Antwort von vor T-076
 * und keine geratene.
 */
export interface BoardCard {
  readonly todoId: TodoId;
  readonly tagIds: readonly TagId[];
  /** Der Status der Karte (T-076). Jedes Todo trägt genau einen. */
  readonly statusId?: StatusId;
  /** `null` bedeutet unerledigt (A-2.4). */
  readonly completedAt?: Timestamp | null;
  /** Mindestens eine abgeschlossene, offene Buchung (T-076). */
  readonly hasOpenEntries?: boolean;
  /** Mindestens eine exportierte Buchung (T-076). */
  readonly hasExportedEntries?: boolean;
}

/**
 * Eine Karte, die auf dem Board **mehr als einmal** vorkommt (E-054).
 *
 * `columnIds` steht in der Reihenfolge der Spalten, nicht in der ihrer
 * Entdeckung: Die Oberfläche soll „steht auch in Warten und Rückfragen" in
 * derselben Folge sagen können, in der die Spalten nebeneinanderstehen.
 */
export interface BoardAppearance {
  readonly todoId: TodoId;
  readonly columnIds: readonly PoolId[];
}

/**
 * Gibt nur Mehrfachzugehörigkeiten zurück. Spalten müssen eindeutig sein; ausdrückliche
 * Erledigt-Regeln gehen dem Sichtbarkeitsfilter vor.
 */
export const boardAppearances = (
  columns: readonly BoardColumnRule[],
  cards: readonly BoardCard[],
): readonly BoardAppearance[] => {
  const appearances: BoardAppearance[] = [];

  for (const card of cards) {
    const columnIds: PoolId[] = [];
    for (const column of columns) {
      /**
       * Ansichtsfelder abtrennen und die übrigen Regelachsen vollständig weiterreichen, damit neue
       * Achsen nicht verloren gehen.
       */
      const { columnId, includeCompleted, ...axes } = column;
      if (
        matchesPool({
          ...axes,
          todoTagIds: card.tagIds,
          todoStatusId: card.statusId,
          completedAt: card.completedAt,
          hasOpenEntries: card.hasOpenEntries,
          hasExportedEntries: card.hasExportedEntries,
        })
      ) {
        // Und erst danach die Sichtbarkeit (E-039). Zwei getrennte Fragen, in
        // dieser Reihenfolge: **ob** die Karte dazugehört, entscheidet die
        // Regel; **ob sie gezeigt wird**, entscheidet die Ansicht. Umgekehrt
        // aufgeschrieben — die Sichtbarkeit als sechste Achse — machte die
        // Ansichtseinstellung zu einer Bedingung und aus einer Spalte ohne
        // Regel eine Spalte „alle unerledigten".
        if (
          card.completedAt !== undefined &&
          !isVisibleInPool({
            completedAt: card.completedAt,
            includeCompleted: includeCompleted ?? true,
          })
        ) {
          continue;
        }
        columnIds.push(columnId);
      }
    }
    if (columnIds.length > 1) appearances.push({ todoId: card.todoId, columnIds });
  }

  return appearances;
};
