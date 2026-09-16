import { request } from "../../api/client";
import type {
  Pagination,
  Id,
  Page,
  PageCursor,
  Pool,
  Timestamp,
  Todo,
} from "../../api/types";

/** `total` zählt alle Mitglieder, `todos` nur die geladene Seite. */
export interface BoardColumnView {
  readonly column: Pool;
  readonly todos: readonly Todo[];
  readonly nextCursor: PageCursor | null;
  readonly total: number;
}

/** Nur Todos in mehreren Spalten; `columnIds` folgt der Spaltenreihenfolge. */
export interface BoardAppearance {
  readonly todoId: Id;
  readonly columnIds: readonly Id[];
}

/** Leere `columns` bedeutet: keine Spalte eingerichtet. */
export interface BoardView {
  readonly columns: readonly BoardColumnView[];
  readonly appearances: readonly BoardAppearance[];
  readonly generatedAt: Timestamp;
}

/** `limit` gilt je Spalte. Weitere Seiten lädt `listPoolTodos` mit dem jeweiligen `nextCursor`. */
export function getBoard(
  options: { includeCompleted?: boolean; limit?: number; priorityId?: string; withoutPriority?: boolean; sortByPriority?: boolean } = {},
): Promise<BoardView> {
  return request<BoardView>("/board", {
    query: {
      ...(options.priorityId ? { priorityId: options.priorityId } : {}),
      ...(options.withoutPriority ? { withoutPriority: true } : {}),
      ...(options.sortByPriority ? { sortByPriority: true } : {}),
      ...(options.includeCompleted === true ? { includeCompleted: "true" } : {}),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  });
}

export function listPoolTodos(
  id: Id,
  options: { includeCompleted?: boolean; priorityId?: string; withoutPriority?: boolean; sortByPriority?: boolean } = {},
  page: Pagination = {},
): Promise<Page<Todo>> {
  return request<Page<Todo>>(`/pools/${encodeURIComponent(id)}/todos`, {
    query: {
      ...(options.priorityId ? { priorityId: options.priorityId } : {}),
      ...(options.withoutPriority ? { withoutPriority: true } : {}),
      ...(options.sortByPriority ? { sortByPriority: true } : {}),
      ...(options.includeCompleted === true ? { includeCompleted: "true" } : {}),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
    },
  });
}
