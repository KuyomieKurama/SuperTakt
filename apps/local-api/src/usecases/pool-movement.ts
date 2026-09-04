/**
 * Takt — die Bewegung eines Todos durch die Pools, **einmal** gerechnet
 * (A-2.5, A-3.4, E-054, E-056, E-057, E-058, E-060, E-061, T-084).
 *
 * ---------------------------------------------------------------------------
 * Wogegen dieser Anwendungsfall geschrieben ist
 * ---------------------------------------------------------------------------
 *
 * Dieselbe Handlung, zwei Auskünfte. Der Add-in-Dienst rechnete die Bewegung
 * serverseitig aus (`bookingStates` und `poolNamer` in `routes/addin/`, drei
 * Listen), die Hauptanwendung fragte `poolsContaining` und kürzte bei zwölf.
 * Die zweite kannte `leaves` gar nicht — sie konnte also nicht sagen, woraus
 * ein Todo verschwindet, und genau das verlangt E-056. Dazu stand an vier
 * Flächen ein Satz („Die Karte bleibt, wo sie ist"), der seit E-055 falsch ist.
 *
 * E-058 zieht daraus die Folge: **eine** Rechnung, **ein** Satz. Die Rechnung
 * steht hier, der Satz in `packages/domain/src/pool-movement.ts`.
 *
 * ---------------------------------------------------------------------------
 * Was er tut, und was er ausdrücklich nicht tut
 * ---------------------------------------------------------------------------
 *
 * Er nimmt ein **Zustandspaar** — den Zustand vor und den nach der Handlung —
 * und alle Regeln, und sagt, wie sich die Zugehörigkeit dazwischen ändert.
 * `poolMovementNamer` entscheidet dabei **nicht**, was eine Handlung am Zustand
 * ändert: Ob ein Timerstart „Erledigt" aufhebt, steht in A-2.5; ob eine Buchung
 * „hat offene Buchungen" setzt, steht in E-032. Wer das Paar bildet, weiß es;
 * wer die Bewegung ausrechnet, braucht es nicht zu wissen.
 *
 * ---------------------------------------------------------------------------
 * Wer das Paar bildet — seit E-061 ebenfalls hier, und nur hier
 * ---------------------------------------------------------------------------
 *
 * Bis T-101 bildete es jede Aufrufstelle selbst: zweimal in den Add-in-Routen,
 * in `timer/start` und in `timer/stop` samt `orphaned/resolve`. Vier
 * Abschriften einer Fachaussage, und die Ankündigung des Add-ins hätte
 * jederzeit etwas anderes versprechen können, als die Bestätigung danach
 * berichtet (Befund C-03 aus T-025).
 *
 * E-061 zieht die Grenze deshalb eine Stufe schärfer:
 *
 *  - Die **Wirkung** einer Buchung — Kennzeichen fällt, „hat offene Buchungen"
 *    wird wahr — ist Fachwissen und steht als `BOOKING_EFFECT` in
 *    `packages/domain`. Sie kennt weder Buchungen im Speicher noch Pools.
 *  - Die **Rechnung**, die eine solche Wirkung auf einen gelesenen Bestand
 *    anwendet, steht hier. Drei Handlungen, drei Paare, jedes einmal:
 *
 *      | Paar                            | Wirkung               | Aufrufer |
 *      |---------------------------------|-----------------------|----------|
 *      | {@link bookingMovementStates}   | `BOOKING_EFFECT`      | Buchung aus dem Add-in (Ankündigung und Bestätigung), `POST /timer/start`, wenn er einen Timer desselben Todos verdrängt |
 *      | {@link closedEntryMovementStates} | `ENTRY_CLOSED_EFFECT` | `POST /timer/stop`, `POST /timer/orphaned/resolve` |
 *      | {@link completionMovementStates} | Erledigt-Achse        | `PUT`/`DELETE /todos/{todoId}/done`, `POST /timer/start` sonst |
 *
 *    Daß es **drei** sind und nicht eines, ist keine Nachlässigkeit: Ein Stopp
 *    hebt kein „Erledigt" auf (A-2.5), und ein Start ohne verdrängten Timer
 *    schließt keine Buchung ab. Ein gemeinsames Paar für alle drei behauptete
 *    an zwei von drei Stellen eine Wirkung, die nicht eintritt.
 *  - Die **Bewegung** rechnet `poolMovementNamer` aus, wie bisher.
 *
 * Keine Aufrufstelle bildet das Paar noch selbst.
 *
 * Die Zugehörigkeitsregel selbst fällt in `matchesPool` aus `@takt/domain` —
 * derselben Funktion, die die Pool-Ansicht, das Board und die Übersetzung nach
 * SQL benutzen. Eine zweite Fassung wäre der Anfang zweier verschiedener
 * Antworten auf dieselbe Frage.
 *
 * ---------------------------------------------------------------------------
 * `list('all')` — auch reine Board-Spalten (E-058 Absatz 1)
 * ---------------------------------------------------------------------------
 *
 * `PoolPort.list()` ohne Argument liefert `placement` `pool` oder `both`. Der
 * Add-in-Dienst fragte so, und damit war eine **reine** Kanban-Spalte für ihn
 * unsichtbar — obwohl `board` die Vorgabe ist, wenn eine Spalte über das Board
 * angelegt wird. Betroffen war ausgerechnet der Fall, für den E-056 geschrieben
 * ist: die Spalte „erledigt und noch nicht abgerechnet" als Abrechnungsliste.
 * Bucht der Benutzer darauf, verschwindet die Karte aus genau der Liste, in der
 * er sie sucht — und niemand sagte es ihm (R-1 Befund 3).
 *
 * Deshalb hier `list('all')`. Eine Bewegung ist eine Bewegung, gleich auf
 * welcher Fläche die Regel erscheint.
 *
 * ---------------------------------------------------------------------------
 * Warum die Antwort Namen trägt und trotzdem nicht über Namen rechnet
 * ---------------------------------------------------------------------------
 *
 * Die drei Listen tragen Pool**namen**, weil ein Mensch sie liest. Die
 * Rechnung vergleicht aber **Regeln mit sich selbst** und nie Namen mit Namen:
 * Zwei Pools dürfen denselben Namen tragen, und ein Vergleich über Namen ließe
 * den einen für den anderen einstehen. Jede Regel wird deshalb genau einmal
 * durchlaufen und in **einem** Durchgang gegen beide Zustände gehalten. Ein
 * `enters`, das man nachträglich aus `appears` und einer zweiten Abfrage
 * ausrechnet, wäre genau dieser Vergleich über Namen (T-084).
 */

import type { MatchesPoolRule, PoolMovement, StatusId, TagId, Timestamp } from '@takt/domain';
import {
  BOOKING_EFFECT,
  ENTRY_CLOSED_EFFECT,
  matchesPool,
  tagAxisIsUnresolved,
} from '@takt/domain';
import type { PoolPort } from '@takt/storage';

/**
 * Der Zustand eines Todos, über den eine Regel urteilt.
 *
 * Alle fünf Achsen aus E-055 in **einem** Wert und als eigener Typ, damit
 * `tsc` widerspricht, wenn die Domäne eine sechste bekommt und diese Datei sie
 * nicht mitgibt. Eine lose Argumentliste könnte das nicht — genau der Fehler,
 * den T-078 zu beheben hatte.
 *
 * Kein Feld ist freiwillig. `matchesPool` liest ein fehlendes Feld als
 * „unbekannt" und lehnt damit ab; ein weggelassener Wert wäre also nicht
 * falsch, aber leise unvollständig, und niemand sähe, warum ein Pool fehlt.
 */
export interface PoolMovementState {
  readonly tagIds: readonly TagId[];
  readonly statusId: StatusId;
  /** `null` bedeutet unerledigt (A-2.4). */
  readonly completedAt: Timestamp | null;
  /** Mindestens eine **abgeschlossene**, offene Buchung? Ein laufender Timer zählt nicht. */
  readonly hasOpenEntries: boolean;
  /** Mindestens eine exportierte Buchung? */
  readonly hasExportedEntries: boolean;
}

/**
 * Das Zustandspaar, zwischen dem eine Handlung das Todo bewegt.
 *
 * Zwei benannte Felder und keine Reihenfolge: Sie sind gleich getippt, und wer
 * sie vertauscht, bekommt eine Bewegung, die sich richtig liest und in die
 * falsche Richtung zeigt.
 *
 * **`before` trägt den echten Zustand von jetzt.** Wer dort schon das Ergebnis
 * der Handlung einsetzt — `completedAt: null` etwa —, macht beide Zustände
 * gleich; `leaves` ist dann für immer leer, ohne dass etwas bricht. Das wäre
 * die stille Rückabwicklung von E-056.
 */
export interface PoolMovementStates {
  readonly before: PoolMovementState;
  readonly after: PoolMovementState;
}

/**
 * Der Ausschnitt eines Todos, über den eine Bewegung urteilt (E-061 Punkt 2).
 *
 * Absichtlich **kein** `Todo`: Der Titel, der Vermerk und die Call-Nummer haben
 * hier nichts zu suchen, und ein Ausschnitt sagt das, statt es zu versprechen.
 * Wer den ganzen Datensatz hat, gibt ihn trotzdem hinein — strukturelle
 * Typisierung nimmt ihn an.
 */
export interface MovingTodo {
  readonly tagIds: readonly TagId[];
  readonly statusId: StatusId;
  /** `null` bedeutet unerledigt (A-2.4). */
  readonly completedAt: Timestamp | null;
}

/**
 * Die Buchungslage eines Todos **vor** der Handlung.
 *
 * Zeichengleich mit dem Wert, den `TimeEntryPort.exportPresence` je Todo
 * liefert — der Aufrufer reicht ihn durch, statt ihn umzubenennen. Fehlt das
 * Todo dort ganz, hat es keine Buchungen, und beide Werte sind `false`.
 *
 * `hasOpen` zählt nur **abgeschlossene** Buchungen. Ein laufender Timer ist
 * noch nichts, was man abrechnen könnte.
 */
export interface BookingPresenceBefore {
  readonly hasOpen: boolean;
  readonly hasExported: boolean;
}

/**
 * „Dieses Todo hat noch keine einzige Buchung."
 *
 * Der Wert, mit dem gerechnet wird, wenn in `exportPresence` nichts zu diesem
 * Todo stand — und nicht eine Kette von `?? false` an jeder Aufrufstelle. Ein
 * Todo, das in keiner der beiden Mengen vorkommt, hat gar keine Buchungen.
 */
export const NO_ENTRIES: BookingPresenceBefore = Object.freeze({
  hasOpen: false,
  hasExported: false,
});

/**
 * Das Zustandspaar einer **Buchung** (E-061 Punkt 2).
 *
 * ---------------------------------------------------------------------------
 * Wozu diese vier Zeilen eine eigene Funktion sind
 * ---------------------------------------------------------------------------
 *
 * Weil dasselbe Paar bis T-101 an vier Stellen entstand: in der Duplikatsuche
 * des Add-ins (Ankündigung), in dessen Buchungsroute (Bestätigung), in
 * `timer/start` und in `timer/stop` samt `orphaned/resolve`. Sagten zwei davon
 * Verschiedenes über dieselbe Handlung, sagte die Ankündigung etwas anderes als
 * die Bestätigung — Befund C-03 aus T-025, eine Ebene tiefer.
 *
 * Die **Wirkung** kommt aus der Domäne ({@link BOOKING_EFFECT}); hier steht nur
 * die Rechnung, die sie auf einen gelesenen Bestand anwendet. Das ist der
 * Schnitt aus E-061: Was eine Buchung ändert, ist Fachwissen; woher der Zustand
 * vorher kommt, ist Sache des Dienstes.
 *
 * ---------------------------------------------------------------------------
 * Das Spreizen ist der Punkt
 * ---------------------------------------------------------------------------
 *
 * `after` entsteht als `{ ...unverändert, ...BOOKING_EFFECT }`. Kommt eine
 * sechste Achse zu {@link PoolMovementState} hinzu, wird `unchanged`
 * unvollständig und **beide** Objektliterale werden rot — statt daß die neue
 * Achse in `after` still auf dem Wert von `before` stehen bliebe, ohne daß
 * jemand die Frage gestellt hätte.
 *
 * **`before` trägt den echten Zustand von jetzt.** Wer dort schon das Ergebnis
 * einsetzt, macht beide Zustände gleich; `leaves` ist dann für immer leer, ohne
 * daß etwas bricht — die stille Rückabwicklung von E-056.
 */
export function bookingMovementStates(
  todo: MovingTodo,
  entries: BookingPresenceBefore,
): PoolMovementStates {
  // Was die Buchung nicht anfaßt: Tags, Status und die exportierten Buchungen.
  // Eine exportierte Buchung wird durch eine neue nicht zu einer offenen.
  const unchanged = {
    tagIds: todo.tagIds,
    statusId: todo.statusId,
    hasExportedEntries: entries.hasExported,
  };

  return {
    before: { ...unchanged, completedAt: todo.completedAt, hasOpenEntries: entries.hasOpen },
    after: { ...unchanged, ...BOOKING_EFFECT },
  };
}

/**
 * Das Zustandspaar, wenn eine **laufende Buchung abgeschlossen** wird
 * (E-032, E-058 Punkt 6).
 *
 * Der Unterschied zu {@link bookingMovementStates} ist eine einzige Achse und
 * trotzdem keine Feinheit: Ein Stopp faßt das Erledigt-Kennzeichen **nicht** an
 * (`timer.stop` schreibt `ended_at`, `note` und `updated_at` — sonst nichts).
 * Wer hier `BOOKING_EFFECT` nähme, behauptete eine Aufhebung, die nicht
 * stattfindet, und der Satz nennte für ein Todo, das während des laufenden
 * Timers von Hand auf erledigt gesetzt wurde, jede Spalte mit
 * `completion: 'open'`.
 *
 * Aufrufer sind `POST /timer/stop` und `POST /timer/orphaned/resolve` mit
 * `book_until_heartbeat`.
 */
export function closedEntryMovementStates(
  todo: MovingTodo,
  entries: BookingPresenceBefore,
): PoolMovementStates {
  // Was der Stopp nicht anfaßt — alles außer der Buchungsachse.
  const unchanged = {
    tagIds: todo.tagIds,
    statusId: todo.statusId,
    completedAt: todo.completedAt,
    hasExportedEntries: entries.hasExported,
  };

  return {
    before: { ...unchanged, hasOpenEntries: entries.hasOpen },
    after: { ...unchanged, ...ENTRY_CLOSED_EFFECT },
  };
}

/**
 * Das Zustandspaar, wenn sich allein das **Erledigt-Kennzeichen** ändert
 * (A-2.4, A-2.5, E-060).
 *
 * Drei Handlungen sind das, und alle drei fassen weder Tags noch Status noch
 * eine Buchung an:
 *
 *  - `DELETE /todos/{todoId}/done` — das Kennzeichen fällt (`completedAfter:
 *    null`). Das ist der Fall des Timerstarts ohne den Timer.
 *  - `PUT /todos/{todoId}/done` — das Kennzeichen wird gesetzt; `completedAfter`
 *    ist der Zeitstempel, den die Speicherung geschrieben hat.
 *  - `POST /timer/start`, solange er **keine** Buchung abschließt. Er hebt
 *    „Erledigt" auf (A-2.5) und sonst nichts; `hasOpenEntries` bleibt, was es
 *    war. Verdrängt derselbe Start einen Timer desselben Todos, entsteht eine
 *    Buchung — dann ist {@link bookingMovementStates} das richtige Paar.
 *
 * `completedAfter` wird **übergeben** und nicht geraten: Beim Setzen kennt nur
 * die Speicherung den Zeitstempel, und beim Aufheben ist `null` die Wirkung aus
 * A-2.5. Für die Regel zählt ohnehin allein, ob ein Wert dasteht
 * (`matchesPool`, Achse `completion`) — der Zeitstempel selbst wird nirgends
 * verglichen.
 */
export function completionMovementStates(
  todo: MovingTodo,
  entries: BookingPresenceBefore,
  completedAfter: Timestamp | null,
): PoolMovementStates {
  const unchanged = {
    tagIds: todo.tagIds,
    statusId: todo.statusId,
    hasOpenEntries: entries.hasOpen,
    hasExportedEntries: entries.hasExported,
  };

  return {
    before: { ...unchanged, completedAt: todo.completedAt },
    after: { ...unchanged, completedAt: completedAfter },
  };
}

/**
 * Der Ausschnitt der Speicherung, den diese Rechnung braucht.
 *
 * Zwei Methoden, und keine davon schreibt. Der Ausschnitt ist derselbe, den
 * `AddinUnit.pools` seit T-086 führt (`Pick<PoolPort, 'list' | 'resolveAxes'>`)
 * — absichtlich: Der Add-in-Dienst soll in Welle B auf diesen Anwendungsfall
 * umstellen können, ohne seinen Port-Ausschnitt anzufassen.
 */
export interface PoolMovementUnit {
  readonly pools: Pick<PoolPort, 'list' | 'resolveAxes'>;
}

/**
 * Eine Regel, aufgelöst und mit Namen — bereit, gegen beliebig viele Zustände
 * gehalten zu werden.
 *
 * `MatchesPoolRule` steht hier **nicht** ausgeschrieben, sondern als Teil des
 * Typs: Was in der Domäne dazukommt, muss hier gefüllt werden, sonst wird
 * diese Datei rot. Das ist dieselbe Wache, die `BoardColumnRule` seit T-089
 * trägt, und der Grund, aus dem R-1 sie verlangt hat.
 */
interface ResolvedPoolRule {
  readonly name: string;
  readonly rule: MatchesPoolRule;
}

/**
 * Sagt, wie sich die Zugehörigkeit eines Todos zwischen zwei Zuständen ändert.
 *
 * Eine Funktion und kein Wert, weil die teure Hälfte — das Auflösen der Ordner
 * über beliebig tiefe Bäume — **einmal je Anfrage** geschieht und die billige
 * je Todo. Wer zehn Treffer beurteilt, löst die Regeln trotzdem nur einmal auf.
 */
export type PoolMovementNamer = (states: PoolMovementStates) => PoolMovement;

/**
 * Löst alle Regeln auf und liefert die Rechnung dazu (E-058 Absatz 1).
 *
 * Der Aufrufer öffnet die Transaktion; dieser Anwendungsfall liest nur. Er
 * gehört damit in dieselbe Klammer wie die Handlung, über die er redet —
 * sonst beurteilte er einen Bestand, den es zum Zeitpunkt der Handlung nicht
 * mehr gab.
 */
export async function poolMovementNamer(unit: PoolMovementUnit): Promise<PoolMovementNamer> {
  // `'all'`: auch reine Board-Spalten. Die Begründung steht im Kopf.
  const pools = await unit.pools.list('all');
  const ordered = [...pools].sort((left, right) => left.position - right.position);

  const resolved: readonly ResolvedPoolRule[] = await Promise.all(
    ordered.map(async (pool): Promise<ResolvedPoolRule> => {
      // Beide Tagachsen in **einer** Antwort — samt der Ordner, aus denen kein
      // Tag geworden ist (E-057). Nur diese Antwort kann sagen, **welcher**
      // genannte Ordner nichts beigetragen hat; eine flache Tagmenge kann es
      // nicht, und das ist der ganze Punkt von E-057.
      const axes = await unit.pools.resolveAxes(pool.id);

      return {
        name: pool.name,
        rule: {
          ruleTagIds: axes.required.tagIds,
          matchMode: pool.matchMode,
          excludedTagIds: axes.excluded.tagIds,
          ruleStatusIds: pool.statusIds,
          completion: pool.completion,
          exportState: pool.exportState,
          /*
           * Die einzige Angabe, die keine Bedingung ist, sondern eine Auskunft
           * über eine (E-057).
           *
           * Gefragt wird **termweise**: `named` zählt die Terme, die der
           * Benutzer ausgesprochen hat, nicht die Tags, die daraus geworden
           * sind. Ein leerer Ordner **neben** einem Tagterm bliebe in der
           * Summe unsichtbar — `ruleTagIds` ist dann gefüllt —, zählt aber in
           * `emptyFolderIds`.
           *
           * Die ausgeschlossene Achse steht absichtlich nicht daneben:
           * „keiner davon" über nichts schließt nichts aus.
           */
          unresolvedRequired: tagAxisIsUnresolved({
            named: pool.rule.length,
            resolved: axes.required.tagIds.length,
            emptyTerms: axes.required.emptyFolderIds.length,
          }),
        },
      };
    }),
  );

  /** Eine Regel gegen einen Zustand — die Frage, an genau einer Stelle. */
  const holds = (pool: ResolvedPoolRule, todo: PoolMovementState): boolean =>
    matchesPool({
      ...pool.rule,
      todoTagIds: todo.tagIds,
      todoStatusId: todo.statusId,
      completedAt: todo.completedAt,
      hasOpenEntries: todo.hasOpenEntries,
      hasExportedEntries: todo.hasExportedEntries,
    });

  return ({ before, after }) => {
    const appears: string[] = [];
    const enters: string[] = [];
    const leaves: string[] = [];

    for (const pool of resolved) {
      // Eine Regel, ein Durchgang, beide Zustände. Ob sich für diese Regel
      // etwas geändert hat, weiß nur die Stelle, die sie für beide Zustände
      // befragt hat (T-084).
      const held = holds(pool, before);

      if (holds(pool, after)) {
        appears.push(pool.name);
        // Die Teilmenge, die die **Bewegung** trägt. Das `continue` steht
        // absichtlich danach: Was nachher zutrifft, kann nicht zugleich
        // verlassen werden.
        if (!held) enters.push(pool.name);
        continue;
      }
      if (held) leaves.push(pool.name);
    }

    return { appears, enters, leaves };
  };
}
