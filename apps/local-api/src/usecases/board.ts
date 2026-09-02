/**
 * Takt — das Kanban-Board (A-5.*, E-054).
 *
 * ---------------------------------------------------------------------------
 * Was dieser Anwendungsfall zusammensetzt
 * ---------------------------------------------------------------------------
 *
 * Drei Dinge, und keines davon entscheidet er selbst:
 *
 *  1. **Welche Spalten es gibt** — `pools.list('board')`. Eine Spalte ist eine
 *     Regel über Tags, also ein `Pool` mit `placement` `board` oder `both`
 *     (E-054). Ihre Reihenfolge ist `position`.
 *  2. **Wer in einer Spalte steht** — `pools.members(...)`, dieselbe Abfrage
 *     wie bei einer Pool-Ansicht (datenmodell.md 4.4). Sie zählt und blättert;
 *     eine zweite Abfrage hier wäre eine zweite Wahrheit über dieselbe Menge.
 *  3. **Wer mehrfach steht** — `boardAppearances` aus der Domäne, auf Grundlage
 *     von `matchesPool`. Das ist der Fall, den es vor E-054 nicht geben konnte:
 *     Eine Karte, die zwei Regeln erfüllt, steht in beiden Spalten.
 *
 * ---------------------------------------------------------------------------
 * Warum die Mehrfachnennung nicht aus den geladenen Seiten gezählt wird
 * ---------------------------------------------------------------------------
 *
 * Die naheliegende Fassung wäre: die Kennungen der geladenen Karten je Spalte
 * schneiden und zählen, in wie vielen Listen eine Kennung vorkommt. Sie ist
 * falsch, sobald eine Spalte mehr Karten hat, als eine Seite fasst — dann steht
 * die Karte in Spalte A auf Seite 1 und in Spalte B auf Seite 2, und die
 * Antwort behauptete, sie stünde nur einmal da. Das ist derselbe Fehler wie in
 * T-042 (der Protokollknopf, der genau bei den großen Läufen versagte): Eine
 * Auskunft, die auf der gerade geladenen Seite beruht, ist dort unvollständig,
 * wo sie gebraucht wird.
 *
 * Deshalb wird die Frage an der Regel beantwortet und nicht an der Seite: Jede
 * geladene Karte trägt ihre `tagIds` ohnehin bei sich, jede Spalte wird einmal
 * je Anfrage zur Tagmenge aufgelöst, und `matchesPool` sagt für jede Kombination
 * ja oder nein. Das Ergebnis hängt an keiner Seitengröße.
 *
 * Der Preis ist eine zweite Fassung derselben Regel — SQL für die
 * Mitgliedschaft, `matchesPool` für die Nennung. Sie wird deshalb **gemessen**:
 * `proof:openapi` hält für jede Spalte die Menge der Abfrage gegen die Menge,
 * die `matchesPool` auswählt.
 */

import type {
  BoardAppearance,
  BoardColumnRule,
  Pool,
  Timestamp,
  Todo,
  TodoFilter,
  TodoId,
} from '@takt/domain';
import { boardAppearances } from '@takt/domain';

import { type AppContext, read } from './context.ts';

/** Eine Spalte mit ihrer ersten Seite (E-054). */
export interface BoardColumnView {
  /**
   * Die Spalte selbst — ein `Pool`. Kein zweiter Typ, siehe `board.ts` in der
   * Domäne. Die Regel steht mit darin, damit die Oberfläche sagen kann,
   * **warum** eine Karte hier steht, ohne sie nachzuladen.
   */
  readonly column: Pool;
  readonly todos: readonly Todo[];
  /**
   * Fortsetzungsmarke **dieser** Spalte. Weitergeblättert wird über
   * `GET /pools/{id}/todos` — eine Spalte ist ein Pool, und ihre Mitglieder
   * kommen aus derselben Abfrage. Eine eigene Blätterroute für das Board wäre
   * dieselbe Abfrage unter einem zweiten Namen.
   */
  readonly nextCursor: string | null;
  /** Vollständige Zahl der Mitglieder, nicht die der geladenen Karten. */
  readonly total: number;
}

export interface BoardView {
  readonly columns: readonly BoardColumnView[];
  /**
   * Karten, die auf diesem Board **mehr als einmal** vorkommen (E-054).
   *
   * Leer, solange jede Karte in höchstens einer Spalte steht — der Zustand, der
   * vor E-054 der einzig mögliche war. Die Oberfläche soll das sichtbar machen,
   * statt es zu verstecken; hier steht, was sie dafür braucht, und zwar
   * ausgerechnet und nicht zum Nachrechnen hingelegt.
   */
  readonly appearances: readonly BoardAppearance[];
  /**
   * Wann diese Ansicht entstanden ist.
   *
   * Ein Board aus Regeln hat keinen gespeicherten Zustand, den man wiederfinden
   * könnte: Es ist die Antwort auf eine Frage zu einem Zeitpunkt. Der Zeitpunkt
   * gehört deshalb in die Antwort.
   */
  readonly generatedAt: Timestamp;
}

export interface BoardRequest {
  /**
   * Erledigte Karten einblenden (E-039). Vorgabe `false` — dieselbe wie in
   * Pool-Ansichten, und aus demselben Grund: Ein Timerstart, der „Erledigt"
   * aufhebt, bringt die Karte ohne Zutun zurück auf das Board.
   */
  readonly includeCompleted: boolean;
  /** Karten je Spalte. Ohne Angabe die Vorgabe der Speicherung. */
  readonly limit?: number;
}

/**
 * Das Board lesen (A-5.3, A-5.4, E-054).
 *
 * **Ein leeres `columns` heißt: Es ist keine Spalte eingerichtet**, nicht „es
 * gibt nichts zu tun". Nach der Umstellung ist das der Ausgangszustand —
 * Migration 0009 macht aus keinem vorhandenen Pool eine Spalte, weil sie das
 * nicht raten kann. Die Unterscheidung ist für die Oberfläche wesentlich: Der
 * eine Fall braucht „Spalte einrichten", der andere „nichts offen".
 */
export function loadBoard(context: AppContext, request: BoardRequest): Promise<BoardView> {
  const generatedAt = context.clock.now();

  return read(context, async (unit) => {
    const columns = await unit.pools.list('board');

    // Erledigte Karten sind Mitglied ihrer Spalte, sie werden nur nicht
    // gezeigt (isVisibleInPool). `onlyOpen` ist die Abfrageseite davon.
    const filter: TodoFilter = request.includeCompleted ? {} : { onlyOpen: true };
    const pagination = request.limit === undefined ? {} : { limit: request.limit };

    const views: BoardColumnView[] = [];
    const rules: BoardColumnRule[] = [];

    for (const column of columns) {
      const page = await unit.pools.members(column.id, filter, pagination);
      views.push({
        column,
        todos: page.items,
        nextCursor: page.nextCursor,
        total: page.total,
      });
      rules.push({
        columnId: column.id,
        // Einmal je Anfrage und je Spalte aufgelöst, nicht je Karte. Die
        // Auflösung steigt über die Ordner ab (rekursiv, beliebig tief) und ist
        // der teuerste Teil dieser Antwort; sie hängt nicht von der Karte ab.
        ruleTagIds: await unit.pools.resolveRule(column.id),
        matchMode: column.matchMode,
      });
    }

    // Jede Karte genau einmal, auch wenn sie in drei Spalten steht: Gefragt ist,
    // wo sie überall steht, und die Antwort ist für jedes Vorkommen dieselbe.
    const cards = new Map<TodoId, Todo>();
    for (const view of views) {
      for (const todo of view.todos) cards.set(todo.id, todo);
    }

    return {
      columns: views,
      appearances: boardAppearances(
        rules,
        [...cards.values()].map((todo) => ({ todoId: todo.id, tagIds: todo.tagIds })),
      ),
      generatedAt,
    };
  });
}
