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
 *     Regel, also ein `Pool` mit `placement` `board` oder `both` (E-054), und
 *     die Regel fragt seit E-055 über fünf Achsen: erforderliche Tags,
 *     ausgeschlossene Tags, Status, Erledigt und Exportstatus. Ihre
 *     Reihenfolge ist `position`.
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
import { type PoolWithResolution, poolWithResolution } from './structure.ts';

/** Eine Spalte mit ihrer ersten Seite (E-054). */
export interface BoardColumnView {
  /**
   * Die Spalte selbst — ein `Pool`. Kein zweiter Typ, siehe `board.ts` in der
   * Domäne. Die Regel steht mit darin, damit die Oberfläche sagen kann,
   * **warum** eine Karte hier steht, ohne sie nachzuladen.
   *
   * Samt ihrer Auflösung (T-080): Ein Ordner, in dem kein Tag liegt, ergibt
   * eine Spalte, die nichts trifft — und ohne die Zahl sähe das aus wie eine
   * Regel, auf die im Augenblick nur nichts passt. Die Auflösung kostet hier
   * nichts, sie wird für `appearances` ohnehin gebraucht.
   */
  readonly column: PoolWithResolution;
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

    const pagination = request.limit === undefined ? {} : { limit: request.limit };

    /**
     * Die Ansichtseinstellung tritt zurück, wenn die Regel selbst etwas sagt
     * (T-076).
     *
     * Erledigte Karten sind Mitglied ihrer Spalte, sie werden nur nicht gezeigt
     * (`isVisibleInPool`); `onlyOpen` ist die Abfrageseite davon, und
     * `includeCompleted` schaltet sie ab. Das galt, solange keine Spalte etwas
     * über „Erledigt" sagen konnte.
     *
     * Seit T-076 kann sie es. Eine Spalte „Erledigt" (`completion: 'done'`)
     * wäre mit `onlyOpen` obendrauf **immer leer** — zwei Bedingungen, die
     * einander ausschließen, und die zweite hat der Benutzer nie für diese
     * Spalte gesetzt, sondern für die Ansicht. Deshalb: Sagt die Regel etwas,
     * entscheidet die Regel; steht sie neutral, entscheidet die Ansicht wie
     * bisher.
     */
    /**
     * Blendet diese Spalte erledigte Karten aus? (E-039, T-076)
     *
     * Sagt die Regel etwas über „Erledigt", steht ihre Achse in der
     * Mitgliederabfrage und die Ansichtseinstellung tritt zurück — sonst wäre
     * eine Spalte `completion: 'done'` unter der Vorgabe `includeCompleted =
     * false` **immer leer**, und die zweite Bedingung hat der Benutzer nie für
     * diese Spalte gesetzt, sondern für die Ansicht.
     *
     * Steht die Achse neutral, gilt alles wie vor T-076.
     */
    const showsCompleted = (column: Pool): boolean =>
      column.completion !== 'any' || request.includeCompleted;

    const filterFor = (column: Pool): TodoFilter =>
      showsCompleted(column) ? {} : { onlyOpen: true };

    const views: BoardColumnView[] = [];
    const rules: BoardColumnRule[] = [];

    for (const column of columns) {
      const page = await unit.pools.members(column.id, filterFor(column), pagination);
      // Einmal je Anfrage und je Spalte aufgelöst, nicht je Karte. Die
      // Auflösung steigt über die Ordner ab (rekursiv, beliebig tief) und ist
      // der teuerste Teil dieser Antwort; sie hängt nicht von der Karte ab.
      // Seit T-080 wird sie zweimal gelesen — für die Mehrfachnennung unten und
      // für die Auskunft an der Spalte — und **einmal** geholt.
      // Beide Achsen in einem Aufruf — samt der Ordner, aus denen kein Tag
      // geworden ist (E-057). Ohne diese Auskunft nennte `boardAppearances`
      // eine Spalte, aus der die Abfrage die Karte soeben herausgehalten hat.
      const axes = await unit.pools.resolveAxes(column.id);
      const ruleTagIds = axes.required.tagIds;
      const excludedTagIds = axes.excluded.tagIds;
      const view = poolWithResolution(column, axes);
      views.push({
        column: view,
        todos: page.items,
        nextCursor: page.nextCursor,
        total: page.total,
      });
      rules.push({
        columnId: column.id,
        ruleTagIds,
        matchMode: column.matchMode,
        // Die drei übrigen Achsen aus T-076 stehen am `Pool`.
        excludedTagIds,
        ruleStatusIds: column.statusIds,
        completion: column.completion,
        exportState: column.exportState,
        /**
         * Und die Auskunft, die `ruleTagIds` nicht tragen kann (E-057).
         *
         * Ein Ordner ohne Tags löst zu `[]` auf — und eine leere Tagliste ist
         * der Neutralwert der Achse. Ohne diese Zeile nennte `boardAppearances`
         * eine Spalte, aus der die Abfrage (`pools.members`) die Karte soeben
         * herausgehalten hat: dieselbe Karte, zwei Antworten. Genau so hat der
         * Fehler vor T-082 ausgesehen.
         *
         * Sie kostet nichts: Die Auflösung steht schon in `view.resolved`, weil
         * die Spalte sie ohnehin ausliefert.
         */
        unresolvedRequired: view.resolved.unresolvedRequired,
        /**
         * Und dieselbe Ausblendung, unter der die Abfrage gelaufen ist.
         *
         * Das ist der Punkt, an dem die beiden Fassungen derselben Regel
         * auseinanderliefen, und `proof:openapi` hat es gemessen: Solange keine
         * Spalte erledigte Karten zeigen konnte, kam eine erledigte Karte gar
         * nicht erst in die Antwort — `onlyOpen` hielt sie aus **jeder** Spalte
         * heraus, und `boardAppearances` bekam sie nie zu sehen. Sobald eine
         * Spalte `completion: 'done'` trägt, wird sie geladen; und dann
         * behauptete die Domänenregel, dieselbe Karte stehe auch in allen
         * übrigen Spalten — dort, wo die Abfrage sie soeben ausgeblendet hatte.
         *
         * `appearances` sagt, wo eine Karte auf **diesem Board** steht, nicht
         * wo sie stünde, wenn man anders hinsähe.
         */
        includeCompleted: showsCompleted(column),
      });
    }

    // Jede Karte genau einmal, auch wenn sie in drei Spalten steht: Gefragt ist,
    // wo sie überall steht, und die Antwort ist für jedes Vorkommen dieselbe.
    const cards = new Map<TodoId, Todo>();
    for (const view of views) {
      for (const todo of view.todos) cards.set(todo.id, todo);
    }

    /**
     * Offene und exportierte Buchungen je Karte — **nur wenn danach gefragt
     * ist** (T-076).
     *
     * Keine Spalte mit Exportstatus-Achse, keine Abfrage. Das ist der
     * Normalfall und der Zustand jedes Bestands unmittelbar nach der
     * Aktualisierung; ihn eine zusätzliche Abfrage kosten zu lassen, wäre der
     * Preis für eine Auskunft, die niemand haben will.
     *
     * Und wenn gefragt ist: **eine** Abfrage für alle geladenen Karten, nicht
     * eine je Karte (A-10.4).
     */
    const needsExportState = rules.some((rule) => rule.exportState !== 'any');
    const presence = needsExportState
      ? await unit.timeEntries.exportPresence([...cards.keys()])
      : undefined;

    return {
      columns: views,
      appearances: boardAppearances(
        rules,
        [...cards.values()].map((todo) => {
          const seen = presence?.get(todo.id);
          return {
            todoId: todo.id,
            tagIds: todo.tagIds,
            statusId: todo.statusId,
            completedAt: todo.completedAt,
            // Fehlt die Auskunft, bleibt das Feld weg statt auf `false` zu
            // fallen: `matchesPool` unterscheidet „unbekannt" von „nein", und
            // eine Spalte mit Exportstatus-Achse gibt es hier dann ohnehin
            // nicht. Ein hingeschriebenes `false` wäre eine Behauptung über
            // Buchungen, die niemand gelesen hat.
            ...(presence === undefined
              ? {}
              : { hasOpenEntries: seen?.hasOpen === true, hasExportedEntries: seen?.hasExported === true }),
          };
        }),
      ),
      generatedAt,
    };
  });
}
