import { request } from "../../api/client";
import type { Pagination } from "../../api/endpoints";
import type { Id, Page, PageCursor, Pool, Timestamp, Todo } from "../../api/types";

/**
 * Takt — die Route und die Typen des Kanban-Boards (A-5.1, A-5.3 bis A-5.6,
 * E-054).
 *
 * **Eine** Route: `GET /board`. Es gibt kein Gegenstück, das eine Karte in eine
 * Spalte legt — Ziehen ist mit E-054 entfallen, weil sich eine Regel nicht
 * durch Verschieben umkehren läßt, ohne Tags zu setzen.
 *
 * **Was nicht hier steht.** `updatePool` bleibt in `api/endpoints.ts`: Vier
 * Aufrufer in drei Bereichen — das Board (Anzeigeort und Reihenfolge), die
 * Pool-Fläche, das Regelformular und der Umbenennen-Dialog. Was mehrere
 * Merkmale schreiben, gehört keinem.
 *
 * **`listPoolTodos` steht dagegen hier**, obwohl es heute niemand anruft: Es
 * ist der Weiterblätterweg **einer Board-Spalte** und hat außerhalb dieser
 * Ansicht keinen Sinn. Eine Route ohne Aufrufer gehört dem Merkmal, das sie
 * brauchen würde, nicht der Sammelstelle.
 *
 * `Pool`, `Todo` und `Id` bleiben aus demselben Grund in `api/types.ts`; die
 * drei Typen hier trägt allein diese Ansicht.
 */

/**
 * Eine Spalte mit ihrer ersten Seite.
 *
 * `column` ist ein vollständiger `Pool` samt Regel — damit die Ansicht sagen
 * kann, **warum** eine Karte hier steht, ohne sie nachzuladen. `total` zählt
 * alle Mitglieder, nicht die geladenen; weitergeblättert wird über
 * `GET /pools/{id}/todos` mit `nextCursor`.
 */
export interface BoardColumnView {
  readonly column: Pool;
  readonly todos: readonly Todo[];
  readonly nextCursor: PageCursor | null;
  readonly total: number;
}

/**
 * Dieselbe Karte in mehreren Spalten (E-054).
 *
 * Geliefert werden **nur** Karten in mehr als einer Spalte; `columnIds` steht
 * in der Reihenfolge der Spalten. Vor E-054 war dieser Fall ausgeschlossen,
 * seitdem ist er der Normalfall: Zwei zutreffende Regeln treffen beide zu.
 */
export interface BoardAppearance {
  readonly todoId: Id;
  readonly columnIds: readonly Id[];
}

/**
 * Das Board als **Ansicht**, nicht als Bestand.
 *
 * Es gibt nichts Gespeichertes, das diese Antwort wiedergäbe: Sie entsteht bei
 * jedem Aufruf neu aus den Regeln der Spalten und den Tags der Todos. Ein
 * leeres `columns` heißt „keine Spalte eingerichtet“ und nirgends „nichts zu
 * tun“ — nach der Umstellung ist das der Ausgangszustand.
 */
export interface BoardView {
  readonly columns: readonly BoardColumnView[];
  readonly appearances: readonly BoardAppearance[];
  readonly generatedAt: Timestamp;
}

/**
 * `GET /board` — das ganze Board in **einem** Aufruf.
 *
 * Die Spalten in ihrer Reihenfolge, je Spalte die erste Seite ihrer Karten und
 * die Karten, die in mehr als einer Spalte stehen. `limit` gilt **je Spalte**.
 *
 * Eine Fortsetzungsmarke nimmt diese Route nicht entgegen: Eine Marke gehört zu
 * genau einer geordneten Liste, und hier sind es so viele Listen wie Spalten.
 * Weiter blättert man je Spalte über {@link listPoolTodos} mit dem `nextCursor`
 * derselben Spalte.
 *
 * Es gibt **kein** Gegenstück, das eine Karte in eine Spalte legt. Ziehen ist
 * mit E-054 entfallen, weil sich eine Regel nicht durch Verschieben umkehren
 * lässt, ohne Tags zu setzen.
 */
export function getBoard(
  options: { includeCompleted?: boolean; limit?: number } = {},
): Promise<BoardView> {
  return request<BoardView>("/board", {
    query: {
      ...(options.includeCompleted === true ? { includeCompleted: "true" } : {}),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  });
}

/**
 * Bei jedem Aufruf aus den Tags abgeleitet (A-3.4). Nichts ist gespeichert.
 *
 * Der Parameter heißt `includeCompleted` und wirkt umgekehrt zum vorherigen
 * `nurOffene`: Ohne Angabe bleiben erledigte Todos außen vor (E-039). Bis T-050
 * schickte diese Funktion `nurOffene`, einen Namen, den der Dienst nicht liest.
 * Ein Aufruf mit `includeCompleted: true` blieb damit wirkungslos — er lieferte
 * still die offenen Todos statt aller.
 *
 * **Ohne Aufrufer in der Oberfläche seit T-094**, und das ist eine gute
 * Nachricht: Der letzte war `poolsContaining`, das je Pool einmal hier
 * anklopfte, um nach einem Timerstart eine Pool-Aufzählung zusammenzusuchen.
 * Diese Auskunft liefert der Dienst inzwischen fertig (E-058). Die Funktion
 * bleibt als Abbildung der Route stehen — sie ist der Weiterblätterweg einer
 * Board-Spalte ({@link getBoard}) und wird gebraucht, sobald eine Ansicht
 * über die erste Seite hinausblättert.
 */
export function listPoolTodos(
  id: Id,
  options: { includeCompleted?: boolean } = {},
  page: Pagination = {},
): Promise<Page<Todo>> {
  return request<Page<Todo>>(`/pools/${encodeURIComponent(id)}/todos`, {
    query: {
      ...(options.includeCompleted === true ? { includeCompleted: "true" } : {}),
      ...(page.limit === undefined ? {} : { limit: page.limit }),
      ...(page.cursor === undefined ? {} : { cursor: page.cursor }),
    },
  });
}
