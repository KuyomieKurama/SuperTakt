/**
 * Takt — die Bewegung eines Todos durch die Pools, **einmal** gerechnet
 * (A-2.5, A-3.4, E-054, E-056, E-057, E-058, T-084).
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
 * und alle Regeln, und sagt, wie sich die Zugehörigkeit dazwischen ändert. Er
 * entscheidet **nicht**, was eine Handlung am Zustand ändert: Ob ein Timerstart
 * „Erledigt" aufhebt, steht in A-2.5 und in `usecases/timer.ts`; ob eine
 * Buchung „hat offene Buchungen" setzt, steht in E-032. Wer das Paar bildet,
 * weiß es; wer die Bewegung ausrechnet, braucht es nicht zu wissen.
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
import { matchesPool, tagAxisIsUnresolved } from '@takt/domain';
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
