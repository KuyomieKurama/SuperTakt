/**
 * Takt — was ein Timerstart und eine abgeschlossene Buchung durch die Pools
 * bewegen (E-032, E-058, E-061, T-101).
 *
 * ---------------------------------------------------------------------------
 * Warum diese drei Funktionen eine eigene Datei sind
 * ---------------------------------------------------------------------------
 *
 * Weil sie von **beiden** Seiten dieses Merkmals gerufen werden und ihre
 * Gleichheit die eigentliche Anforderung ist. `presenceBeforeBooking` hat vier
 * Aufrufstellen (Start, Stopp, verwaister Timer, Buchung von Hand),
 * `movementOfBooking` drei (Stopp, verwaister Timer, Buchung von Hand). Der
 * lange Absatz an {@link CreatedTimeEntry} in `bookings.ts` steht nur deshalb
 * da: Die Buchung von Hand muß **dieselbe** Rechnung anstellen wie der
 * Timerstopp, sonst meldet sie ein Verlassen der Spalte „Erledigt", das nicht
 * stattfindet — das ist wörtlich der Fehler aus T-101.
 *
 * Eine zweite Fassung wäre also nicht Doppelung, sondern ein Fehler mit
 * Anlauf. Hier steht sie einmal, in derselben Merkmalsmappe wie ihre beiden
 * Aufrufer, und muß dafür nichts über eine Merkmalsgrenze reichen.
 *
 * Die Regeln selbst stehen nicht hier: `bookingMovementStates`,
 * `closedEntryMovementStates` und `completionMovementStates` bilden das
 * Zustandspaar (`pool-movement.ts`), `poolMovementNamer` benennt es.
 * Diese Datei entscheidet allein, **ob** überhaupt gerechnet wird — und der
 * Normalfall kostet dadurch keine einzige Ordnerauflösung.
 */

import type { PoolMovement, Todo, TodoId } from '@takt/domain';
import type { UnitOfWork } from '@takt/storage';

import {
  type BookingPresenceBefore,
  NO_ENTRIES,
  bookingMovementStates,
  closedEntryMovementStates,
  completionMovementStates,
  poolMovementNamer,
} from '../../pool-movement.ts';

/**
 * Die Bewegung zum Timerstart, oder `null` (E-058, A-2.5, E-032).
 *
 * Getrennt von `startTimer`, weil sie eine andere Sorte Arbeit ist: `startTimer`
 * ändert den Bestand, diese Funktion sagt, was das bedeutet. Sie schreibt
 * nichts und läuft in derselben Transaktion — der Bestand, über den sie
 * urteilt, ist der, in dem der Start stattgefunden hat.
 *
 * **Welches Zustandspaar gemeint ist, entscheidet diese Stelle; gebildet wird
 * es im Anwendungsfall darunter** (`pool-movement.ts`, E-061 Punkt 2).
 * Was ein Timerstart am Todo ändert, steht in A-2.5 und E-032 und ist die Sache
 * dieses Moduls. Die Rechnung darunter weiß davon nichts und soll es nicht
 * wissen — sie bekommt zwei Zustände und alle Regeln.
 *
 * Ein Start ist dabei **nicht immer** eine Buchung, und deshalb stehen hier
 * zwei Paare zur Wahl:
 *
 *  - **Er hat einen Timer desselben Todos verdrängt.** Aus dem laufenden Timer
 *    ist eine abgeschlossene, offene Buchung geworden — und damit gilt genau
 *    `BOOKING_EFFECT`: Kennzeichen fällt, „hat offene Buchungen" wird wahr.
 *    {@link bookingMovementStates}.
 *  - **Sonst.** Der Start hebt allein „Erledigt" auf (A-2.5); `hasOpenEntries`
 *    bleibt, was es war. Der frisch gestartete Timer zählt nicht: Er trägt
 *    `ended_at IS NULL` und ist nichts, was man abrechnen könnte. Hier wäre
 *    `BOOKING_EFFECT` sachlich falsch — es behauptete eine offene Buchung, die
 *    es nicht gibt, und schriebe dem Todo jede Spalte mit `exportState: 'open'`
 *    zu. {@link completionMovementStates} mit `null`.
 *
 * `before` trägt in beiden Fällen den echten Zustand von vorher, `completedAt`
 * eingeschlossen. Ein `null` an dieser Stelle machte beide Zustände gleich und
 * `leaves` für immer leer — die stille Rückabwicklung von E-056.
 *
 * ---------------------------------------------------------------------------
 * Was diese Funktion **nicht** berichtet: das verdrängte Todo (O-AB)
 * ---------------------------------------------------------------------------
 *
 * `bookedOnThisTodo` ist die Frage „lief der verdrängte Timer auf **diesem**
 * Todo?". Lief er auf einem anderen, entsteht dort möglicherweise die erste
 * abgeschlossene Buchung — jenes Todo bewegt sich also auch, und hier steht
 * darüber nichts.
 *
 * Das ist entschieden und keine Lücke (T-115, Orchestrator in T-117): **Eine
 * Antwort trägt eine Bewegung.** Zwei Bewegungen in einem `PoolMovement` wären
 * nicht auseinanderzuhalten, weil die drei Listen Namen tragen und keine
 * Kennung des Todos, zu dem sie gehören (E-058 Punkt 4). Ein zweites Feld
 * daneben verlangte von jeder Oberfläche eine Fallunterscheidung für einen Weg,
 * den die Hauptanwendung nicht geht: `TimerContext.confirmSwitch` stoppt und
 * startet in zwei Aufrufen, und der Stopp trägt seinen eigenen Satz
 * ({@link movementOfBooking}). Betroffen ist allein der direkte Aufruf mit
 * `stopRunning: true`, und für ihn gilt derselbe Weg: erst stoppen, dann
 * starten.
 */
export async function movementOfStart(
  unit: UnitOfWork,
  input: {
    readonly todo: Todo | null;
    readonly presence: BookingPresenceBefore;
    readonly doneCleared: boolean;
    readonly bookedOnThisTodo: boolean;
  },
): Promise<PoolMovement | null> {
  const { todo, presence, doneCleared, bookedOnThisTodo } = input;

  // Kein Todo gelesen: Dann hat der Start es auch nicht gefunden, und der
  // Fehlerzweig darüber ist bereits genommen worden. Hier steht es nur, damit
  // dieser Pfad nichts behauptet, was er nicht gelesen hat.
  if (todo === null) return null;

  const firstEntryAppeared = bookedOnThisTodo && !presence.hasOpen;
  // Nichts bewegt sich, nichts wird aufgelöst. Der Normalfall — und er kostet
  // damit keine einzige Ordnerauflösung.
  if (!doneCleared && !firstEntryAppeared) return null;

  const namer = await poolMovementNamer(unit);
  return namer(
    bookedOnThisTodo
      ? bookingMovementStates(todo, presence)
      : completionMovementStates(todo, presence, null),
  );
}

/**
 * Liest den Bestand, gegen den die Bewegung einer Buchung gerechnet wird.
 *
 * `hasOpen` ist die einzige Angabe, die nach dem Stopp nicht mehr zu bekommen
 * ist: Danach ist sie **immer** wahr, und ob sie es vorher schon war, ließe
 * sich nicht mehr sagen. Genau daran hängt aber, ob es eine Bewegung gab. Die
 * Abfrage muß deshalb **vor** dem Schreiben stehen; danach beantwortet dieselbe
 * Abfrage eine andere Frage.
 *
 * Ein Indexzugriff (`ix_time_entry_queue`) und sonst nichts. Der Todo-Datensatz
 * wird hier absichtlich nicht mitgelesen: Er wird erst gebraucht, wenn
 * feststeht, daß es etwas zu berichten gibt — der Normalfall (zweite und jede
 * weitere Buchung) kostet damit weder einen Todo-Zugriff noch eine einzige
 * Ordnerauflösung.
 */
export async function presenceBeforeBooking(
  unit: UnitOfWork,
  todoId: TodoId,
): Promise<BookingPresenceBefore> {
  // Ein Todo ohne jede Buchung fehlt in der Zuordnung; dann gilt `NO_ENTRIES`.
  return (await unit.timeEntries.exportPresence([todoId])).get(todoId) ?? NO_ENTRIES;
}

/**
 * Die Bewegung, die eine **abgeschlossene Buchung** auslöst, oder `null`
 * (E-058 Punkt 6, E-032).
 *
 * Sie ändert genau eine Achse: `hasOpenEntries` von falsch auf wahr. Tags,
 * Status und „Erledigt" bleiben, wie sie waren — ein Stopp faßt das
 * Erledigt-Kennzeichen nicht an, das tut allein der Start (A-2.5).
 *
 * **Der erste Zweig ist die ganze Sparsamkeit dieser Funktion.** Hatte das Todo
 * schon eine offene Buchung, sind beide Zustände gleich, die Antwort wären drei
 * leere Listen — und der Weg dorthin führte über das Auflösen jeder Regel über
 * beliebig tiefe Ordnerbäume. Das ist der Normalfall, und er kostet hier
 * nichts.
 *
 * `null` und nicht drei leere Listen: Das eine heißt „hier war keine Bewegung
 * möglich", das andere „nachgesehen und nichts gefunden". Beide führen zu
 * derselben Anzeige, aber nur das erste kostet keine Ordnerauflösung — und die
 * Aufrufstelle muß den Fall behandeln, statt ihn mit `?? []` zu übergehen.
 */
export async function movementOfBooking(
  unit: UnitOfWork,
  todoId: TodoId,
  presence: BookingPresenceBefore,
): Promise<PoolMovement | null> {
  if (presence.hasOpen) return null;

  const todo = await unit.todos.load(todoId);
  // Ein Todo, das es nicht gibt, kann keine Buchung getragen haben. Der Zweig
  // steht da, damit dieser Pfad nichts behauptet, was er nicht gelesen hat.
  if (todo === null) return null;

  const namer = await poolMovementNamer(unit);
  // Das Paar bildet der Anwendungsfall aus der Wirkung in der Domäne (E-061).
  // `ENTRY_CLOSED_EFFECT` und nicht `BOOKING_EFFECT`: Der Stopp schließt eine
  // Buchung ab, die schon da war, und hebt kein „Erledigt" auf (A-2.5).
  return namer(closedEntryMovementStates(todo, presence));
}
