/**
 * Takt — das Kanban-Board als Ansicht über Regeln (A-5.*, E-054, T-076).
 *
 * ---------------------------------------------------------------------------
 * Was sich mit E-054 geändert hat
 * ---------------------------------------------------------------------------
 *
 * Bis E-054 war `todo_status` beides zugleich: die Eigenschaft am Todo **und**
 * die Spalte auf dem Board. Ein Todo trug genau eine `status_id`, die Spalten
 * waren die Statuswerte, und eine Karte stand deshalb in genau einer Spalte.
 *
 * Seitdem ist eine Spalte eine **Regel**, wie ein Pool. Tags sind dabei eine
 * Achse von fünf: erforderliche Tags, ausgeschlossene Tags, Status, Erledigt
 * und Exportstatus (E-055). Bis dahin stand hier „eine Regel über Tags"; das
 * war zur Zeit von E-054 vollständig und ist es seit E-055 nicht mehr — es
 * legte dem Leser nahe, eine Spalte hinge allein an Tags, und genau daraus
 * entstand der falsche Satz „Die Karte bleibt, wo sie ist" (E-058).
 *
 * Der Status bleibt als Eigenschaft am Todo, er ist nur nicht mehr die
 * Spalte — er ist eine der fünf Achsen, nach denen eine Regel fragen darf. Daraus
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

import type { PoolId, StatusId, TagId, Timestamp, TodoId } from './kernel.ts';
import type { MatchesPoolRule, Pool } from './tag.ts';
import { isVisibleInPool, matchesPool } from './tag.ts';

/**
 * Eine Spalte des Boards. **Derselbe Typ wie ein Pool** (E-054).
 *
 * Der Alias existiert, damit an einer Board-Fläche „Spalte" steht, ohne dass
 * daraus ein zweiter Wert wird. Wer hier ein eigenes `interface BoardColumn`
 * hinschreibt, hat die Entscheidung aus E-054 zurückgenommen.
 */
export type BoardColumn = Pool;

/**
 * Eine Spalte, deren Taglisten bereits zu Tagmengen aufgelöst sind.
 *
 * Das Auflösen (Ordner, Unterordner, beliebig tief) ist Aufgabe des Ports —
 * dafür braucht es den Baum. Diese Datei bekommt das Ergebnis und liest nichts
 * nach; sie bleibt damit rein und ohne laufenden Dienst prüfbar.
 *
 * ---------------------------------------------------------------------------
 * Warum die Achsen **nicht mehr** hier aufgezählt stehen (T-089)
 * ---------------------------------------------------------------------------
 *
 * Bis T-089 zählte dieser Typ die Achsen als **eigene** Felder auf, jede von
 * ihnen freiwillig. Damit war er ein zweites, unabhängiges Abbild von
 * {@link MatchesPoolRule} — und ein Abbild, das nicht mitwächst: Eine sechste
 * Achse in der Domäne wäre hier weder aufgetaucht noch rot geworden,
 * `boardAppearances` hätte sie stillschweigend übersprungen, und das Board
 * behauptete eine Zugehörigkeit, die die Abfrage nicht kennt. Der Kommentar an
 * {@link PoolRuleAxes} versprach das Gegenteil („jede dieser Stellen wird
 * rot"); R-1 hat die Lücke gemessen.
 *
 * Seitdem **ist** die Regelseite einer Spalte die Regelseite von
 * `matchesPool`: `BoardColumnRule extends MatchesPoolRule`. Was dort dazukommt,
 * steht hier ohne Zutun; was dort Pflicht wird, macht jeden Erbauer einer
 * Spalte rot. Die beiden Felder darunter sind alles, was eine Spalte darüber
 * hinaus hat — eine Kennung und eine **Ansichts**einstellung, und die ist
 * ausdrücklich keine Achse.
 *
 * Die geerbten Achsen (Status, Erledigt, Exportstatus, ausgeschlossene Tags)
 * bleiben freiwillig und stehen ohne Angabe neutral: Eine Spalte aus der Zeit
 * vor T-076 verhält sich unverändert. **Eine Angabe ist Pflicht**, und sie ist
 * keine Achse: `unresolvedRequired` (E-057). Wer eine Spalte auflöst, hat die
 * Antwort; wer sie wegläßt, hätte nicht „nichts gesagt", sondern „nicht
 * nachgesehen". Die Begründung steht am Feld in `MatchesPoolRule`.
 */
export interface BoardColumnRule extends MatchesPoolRule {
  readonly columnId: PoolId;
  /**
   * Zeigt diese Spalte erledigte Karten? (E-039)
   *
   * **Keine Achse der Regel, sondern die Einstellung der Ansicht** — und
   * deshalb ein eigenes Feld und kein weiterer Wert in `completion`. Der
   * Unterschied ist nicht formal: Eine Regel, deren Achsen alle neutral
   * stehen, trifft nichts (A-3.4). Stünde die Ansichtseinstellung als
   * Erledigt-**Achse** darin, wäre eine Spalte ohne Regel plötzlich eine Regel
   * „alle unerledigten" — und zeigte alles statt nichts. Genau das hat
   * `proof:openapi` Abschnitt 11 gemessen, bevor dieses Feld hier stand.
   *
   * Ohne Angabe `true`: keine zusätzliche Ausblendung. Der Aufrufer, der die
   * Frage nicht stellt, bekommt die Antwort von vor T-076.
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
 *     beim Pool (T-009). Und seit E-057 gilt dasselbe für eine Spalte, deren
 *     erforderliche Tagachse ins Leere zeigt: Ein Ordner ohne Tags ist eine
 *     Einschränkung ohne Treffer, nicht eine Achse, die schweigt. Der Aufrufer
 *     sagt es über `BoardColumnRule.unresolvedRequired`; ohne die Angabe bliebe
 *     es bei der Antwort von vor E-057.
 *  2. **Mehrere zutreffende Regelteile derselben Spalte ergeben eine
 *     Nennung, nicht mehrere.** Jede Spalte wird einmal befragt und höchstens
 *     einmal genannt, ganz gleich, über wie viele ihrer Tags die Karte
 *     hineinpasst — `matchesPool` antwortet mit ja oder nein und nicht mit
 *     einer Anzahl. Der Fall ist der Normalfall: Eine Spalte im Modus `any`
 *     mit fünf Regel-Tags trifft eine Karte, die drei davon trägt, einmal.
 *     Dass sie doppelt gezählt wird, kann nur noch dadurch geschehen, dass ein
 *     Aufrufer dieselbe Spalte zweimal übergibt; dagegen steht hier keine
 *     Prüfung, weil `PoolPort.list` eine Menge liefert und keine Folge.
 *  3. **Die Erledigt-Eigenschaft geht nur ein, wenn die Spalte danach fragt.**
 *     Steht die Erledigt-Achse der Spalte neutral (`any`, die Vorgabe), gilt
 *     wie bisher: Erledigt entscheidet über Sichtbarkeit (`isVisibleInPool`),
 *     nicht über Zugehörigkeit — wer erledigte Karten einblendet, sieht sie in
 *     denselben Spalten wie vorher. Eine Spalte, die ausdrücklich „nur
 *     erledigte" oder „nur unerledigte" sagt, macht daraus eine Bedingung der
 *     Zugehörigkeit (T-076); dann ist es ihre Regel und nicht mehr die
 *     Ansichtseinstellung, die entscheidet.
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
      /*
       * Die Regelseite geht **als Ganzes** hinüber, nicht Feld für Feld
       * (T-089).
       *
       * Bis T-089 stand hier eine Aufzählung, und sie war der stille Teil der
       * Lücke: Eine sechste Achse hätte in ihr gefehlt, ohne daß etwas rot
       * geworden wäre — `matchesPool` überspringt, was es nicht genannt
       * bekommt. Jetzt trennt das Muster die **Regel** von den zwei Feldern,
       * die keine sind, und reicht den Rest weiter, wie er dasteht.
       *
       * Warum nicht `...column` mit den beiden Zusatzfeldern darin: Ein Spread
       * gibt sie mit, und sollte `MatchesPoolRule` je ein Feld gleichen Namens
       * bekommen, ginge die **Ansichts**einstellung stillschweigend als
       * Bedingung durch. So bleibt `axes` genau die Regelseite — fehlt darin
       * etwas, sagt es der Übersetzer.
       *
       * `undefined` wird dabei durchgereicht, wie es dasteht: `MatchesPool`
       * nimmt es ausdrücklich an und liest es als „nicht genannt".
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
