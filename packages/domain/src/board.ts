/**
 * Takt — das Kanban-Board als Ansicht über Regeln (A-5.*, E-054).
 *
 * ---------------------------------------------------------------------------
 * Was sich mit E-054 geändert hat
 * ---------------------------------------------------------------------------
 *
 * Bis E-054 war `todo_status` beides zugleich: die Eigenschaft am Todo **und**
 * die Spalte auf dem Board. Ein Todo trug genau eine `status_id`, die Spalten
 * waren die Statuswerte, und eine Karte stand deshalb in genau einer Spalte.
 *
 * Seitdem ist eine Spalte eine **Regel über Tags**, wie ein Pool. Der Status
 * bleibt als Eigenschaft am Todo, er ist nur nicht mehr die Spalte. Daraus
 * folgt der Fall, den es vorher nicht geben konnte und der jetzt der Normalfall
 * ist: **Dieselbe Karte kann in mehreren Spalten stehen.** Bei Status war das
 * ausgeschlossen, bei Regeln ist es unvermeidlich — zwei Regeln, die beide
 * zutreffen, treffen beide zu.
 *
 * ---------------------------------------------------------------------------
 * Warum hier kein zweiter Entitätstyp steht
 * ---------------------------------------------------------------------------
 *
 * Eine Spalte ist ein `Pool`. Kein abgeleiteter Typ, kein Zwilling, keine
 * zweite Tabelle: derselbe Name, dieselbe Regel, dieselbe Auflösung über
 * Ordner, dieselbe Regel „eine leere Regel trifft nichts". Was eine Spalte von
 * einem Pool unterscheidet, ist ausschließlich `Pool.placement` — die Fläche,
 * auf der sie erscheint.
 *
 * Der Alias {@link BoardColumn} sagt das im Typsystem: Er ist buchstäblich
 * `Pool`, und wer ihn benutzt, bekommt keinen anderen Wert, sondern eine
 * andere Lesart. Zwei Entitäten, die dasselbe tun, wären die achte Doppelung
 * dieses Bestands gewesen — und die teuerste, weil an ihr die
 * Ordnerauflösung, die Blätterung und die Mitgliederabfrage doppelt hingen.
 *
 * ---------------------------------------------------------------------------
 * Wer entscheidet, welche Karte in welcher Spalte steht
 * ---------------------------------------------------------------------------
 *
 * Die **Mitgliedschaft** einer Spalte beantwortet dieselbe Abfrage wie die
 * Mitgliedschaft eines Pools (`PoolPort.members`, datenmodell.md 4.4). Sie
 * zählt, blättert und trifft die Indizes; sie ist die Fassung der Regel auf
 * der Abfrageseite.
 *
 * Die **Mehrfachnennung** — steht diese Karte noch woanders? — beantwortet
 * {@link boardAppearances}, und zwar mit `matchesPool` aus `tag.ts`. Das ist
 * dieselbe Funktion, die auch das Add-in benutzt, um die Pools eines Todos zu
 * benennen (`routes/addin/service.ts`), und die die Abfrage in
 * `repo-todos.ts` in SQL nachbildet.
 *
 * Zwei Seiten derselben Regel also — und genau deshalb wird ihre
 * Übereinstimmung **gemessen** und nicht angenommen: `proof:openapi` hält für
 * jede Spalte die Menge, die die Abfrage liefert, gegen die Menge, die
 * `matchesPool` auswählt. Laufen sie auseinander, zeigt das Board eine Karte
 * in einer Spalte und behauptet daneben, sie stünde dort nicht.
 */

import type { PoolId, TagId, TodoId } from './kernel.ts';
import type { Pool } from './tag.ts';
import { matchesPool } from './tag.ts';

/**
 * Eine Spalte des Boards. **Derselbe Typ wie ein Pool** (E-054).
 *
 * Der Alias existiert, damit an einer Board-Fläche „Spalte" steht, ohne dass
 * daraus ein zweiter Wert wird. Wer hier ein eigenes `interface BoardColumn`
 * hinschreibt, hat die Entscheidung aus E-054 zurückgenommen.
 */
export type BoardColumn = Pool;

/**
 * Eine Spalte, deren Regel bereits zur Tagmenge aufgelöst ist.
 *
 * Das Auflösen (Ordner, Unterordner, beliebig tief) ist Aufgabe des Ports —
 * dafür braucht es den Baum. Diese Datei bekommt das Ergebnis und liest nichts
 * nach; sie bleibt damit rein und ohne laufenden Dienst prüfbar.
 */
export interface BoardColumnRule {
  readonly columnId: PoolId;
  /** Die Regel, aufgelöst. Leer heißt: Diese Spalte trifft nichts (A-3.4). */
  readonly ruleTagIds: readonly TagId[];
  readonly matchMode: 'any' | 'all';
}

/** Eine Karte, so viel davon, wie für die Zuordnung gebraucht wird. */
export interface BoardCard {
  readonly todoId: TodoId;
  readonly tagIds: readonly TagId[];
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
 * In welchen Spalten steht dieselbe Karte? (E-054)
 *
 * Geliefert werden **nur** Karten in mehr als einer Spalte. Eine Karte in genau
 * einer Spalte steht dort, wo sie steht; das sagt die Spalte selbst, und eine
 * Zeile darüber wäre das Board noch einmal, nur in einer anderen Gestalt.
 *
 * Drei Eigenschaften, und jede ist eine Entscheidung:
 *
 *  1. **Eine leere Regel trifft nichts.** `matchesPool` liefert für eine leere
 *     Tagmenge `false`, auch im Modus `all`. Eine Spalte, deren Regel noch nicht
 *     eingerichtet ist, zeigt deshalb nichts statt alles — dieselbe Antwort wie
 *     beim Pool (T-009).
 *  2. **Mehrere zutreffende Regelteile derselben Spalte ergeben eine
 *     Nennung, nicht mehrere.** Jede Spalte wird einmal befragt und höchstens
 *     einmal genannt, ganz gleich, über wie viele ihrer Tags die Karte
 *     hineinpasst — `matchesPool` antwortet mit ja oder nein und nicht mit
 *     einer Anzahl. Der Fall ist der Normalfall: Eine Spalte im Modus `any`
 *     mit fünf Regel-Tags trifft eine Karte, die drei davon trägt, einmal.
 *     Dass sie doppelt gezählt wird, kann nur noch dadurch geschehen, dass ein
 *     Aufrufer dieselbe Spalte zweimal übergibt; dagegen steht hier keine
 *     Prüfung, weil `PoolPort.list` eine Menge liefert und keine Folge.
 *  3. **Die Erledigt-Eigenschaft geht nicht ein.** Sie entscheidet über
 *     Sichtbarkeit (`isVisibleInPool`), nicht über Zugehörigkeit. Wer erledigte
 *     Karten einblendet, sieht sie in denselben Spalten wie vorher.
 *
 * Rein: Spalten herein, Karten herein, Zuordnung heraus. Keine Uhr, keine
 * Datenbank, kein Netz.
 */
export const boardAppearances = (
  columns: readonly BoardColumnRule[],
  cards: readonly BoardCard[],
): readonly BoardAppearance[] => {
  const appearances: BoardAppearance[] = [];

  for (const card of cards) {
    const columnIds: PoolId[] = [];
    for (const column of columns) {
      if (
        matchesPool({
          todoTagIds: card.tagIds,
          ruleTagIds: column.ruleTagIds,
          matchMode: column.matchMode,
        })
      ) {
        columnIds.push(column.columnId);
      }
    }
    if (columnIds.length > 1) appearances.push({ todoId: card.todoId, columnIds });
  }

  return appearances;
};
