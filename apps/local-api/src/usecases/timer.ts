/**
 * Takt — Timer und Zeitbuchungen (A-6.*, A-2.5, E-036).
 *
 * ---------------------------------------------------------------------------
 * Die drei Regeln, die hier zusammenkommen
 * ---------------------------------------------------------------------------
 *
 *  1. **Nur ein Timer gleichzeitig** (A-6.8). Läuft schon einer, wird
 *     **gefragt**, nicht abgebrochen und nicht stillschweigend gestoppt. Der
 *     Anwendungsfall liefert dafür `confirmation_required` mit dem Titel des
 *     betroffenen Todos — sonst müsste die Oberfläche nachfragen, ohne sagen zu
 *     können, worum es geht.
 *  2. **Starten hebt „Erledigt" auf** (A-2.5). Das Todo wird wieder aktiv, die
 *     Kanban-Spalte bleibt (E-023), und die Pool-Zugehörigkeit kommt ohne
 *     Schreibvorgang zurück, weil sie aus den Tags abgeleitet und nirgends
 *     gespeichert ist (A-3.4).
 *  3. **Alles in einer Transaktion.** Stopp des alten Timers, Aufheben von
 *     „Erledigt" und Start des neuen sind ein Vorgang. Ein Abbruch dazwischen
 *     darf keinen Zustand hinterlassen, in dem das Todo aktiv ist, aber kein
 *     Timer läuft — oder in dem zwei Timer als beendet gelten und keiner läuft.
 */

import type {
  PoolMovement,
  RunningTimeEntry,
  TimeEntry,
  TimeEntryId,
  Timestamp,
  Todo,
  TodoId,
} from '@takt/domain';
import { decideOrphanedTimer, err, ok, taktError } from '@takt/domain';
import type { Page, Pagination, TimeEntryFilter, UnitOfWork } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from './context.ts';
import {
  type BookingPresenceBefore,
  NO_ENTRIES,
  bookingMovementStates,
  closedEntryMovementStates,
  completionMovementStates,
  poolMovementNamer,
} from './pool-movement.ts';

export interface RunningTimerView {
  readonly entry: RunningTimeEntry;
  readonly todoTitle: string;
  /** Sekunden seit dem Start, zum Zeitpunkt der Anfrage. Nicht gespeichert. */
  readonly elapsedSeconds: number;
}

export function loadRunningTimer(context: AppContext): Promise<RunningTimerView | null> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timer.running();
    if (entry === null) return null;
    const todo = await unit.todos.load(entry.todoId);
    return {
      entry,
      todoTitle: todo?.title ?? '',
      elapsedSeconds: Math.max(0, Math.floor((Date.parse(timestamp) - Date.parse(entry.startedAt)) / 1000)),
    };
  });
}

export type StartTimerResult =
  | {
      readonly kind: 'started';
      readonly started: RunningTimeEntry;
      readonly stopped: TimeEntry | null;
      /** A-2.5: war das Todo erledigt und ist durch den Start wieder aktiv? */
      readonly doneCleared: boolean;
      /**
       * Wie der Start das Todo durch die Pools bewegt — oder `null` (E-058).
       *
       * ---------------------------------------------------------------------
       * Wann gerechnet wird und wann nicht
       * ---------------------------------------------------------------------
       *
       * Gerechnet wird, wenn der Start etwas bewegt haben **kann**, und das
       * sind genau zwei Fälle:
       *
       *  1. **Der Start hat „Erledigt" aufgehoben** (A-2.5, `doneCleared`).
       *     Jede Regel mit einer Erledigt-Achse urteilt danach anders — die
       *     Spalte „nur Erledigte" verliert das Todo, die Spalte „nur Offene"
       *     bekommt es.
       *  2. **Die erste abgeschlossene Buchung ist entstanden.** Das geschieht
       *     beim Start dann, wenn er einen laufenden Timer **desselben** Todos
       *     stoppt: Aus dem laufenden Timer wird eine offene Buchung, und
       *     jede Regel mit `exportState: 'open'` nimmt das Todo damit auf.
       *
       * Sonst `null`. Ein laufender Timer allein ist keine Buchung — die
       * Abfrage verlangt `ended_at IS NOT NULL`, „ein laufender Timer ist noch
       * nichts, was man abrechnen könnte" —, an den Tags ändert der Start
       * nichts, und am Status auch nicht (E-023). Es gibt dann buchstäblich
       * nichts zu berichten, und `null` sagt das, statt drei leere Listen zu
       * schicken, aus denen der Aufrufer dasselbe schließen müsste.
       *
       * ---------------------------------------------------------------------
       * Warum das nicht dieselbe Frage ist wie `doneCleared`
       * ---------------------------------------------------------------------
       *
       * `doneCleared` sagt, **was geschehen ist**; `poolMovement` sagt, **was
       * daraus folgt**. Bis E-058 sagten beide Flächen dazu denselben Satz
       * („Die Karte bleibt, wo sie ist"), und der war seit E-055 falsch: Eine
       * Regel entscheidet auch über Erledigt und über den Exportstatus, und
       * beides ändert dieser Start. Der Satz dazu steht in
       * `poolMovementSentence` (`packages/domain`); hier stehen nur die Namen.
       */
      readonly poolMovement: PoolMovement | null;
    }
  | {
      readonly kind: 'confirmation_required';
      readonly running: RunningTimeEntry;
      readonly runningTodoTitle: string;
    };

/**
 * Timer starten (A-6.2, A-6.8, A-2.5).
 *
 * `stopRunning` ist die Antwort des Benutzers auf die Rückfrage — nicht eine
 * Bequemlichkeit des Aufrufers. Ohne sie wird nichts angefasst, und der
 * Anwendungsfall liefert zurück, worüber zu entscheiden ist.
 */
export async function startTimer(
  context: AppContext,
  todoId: TodoId,
  stopRunning: boolean,
): Promise<UseCaseResult<StartTimerResult>> {
  const timestamp = now(context);

  return context.transactions.inTransaction(async (unit) => {
    const running = await unit.timer.running();

    if (running !== null && !stopRunning) {
      const todo = await unit.todos.load(running.todoId);
      return ok({
        kind: 'confirmation_required' as const,
        running,
        runningTodoTitle: todo?.title ?? '',
      });
    }

    /*
     * Der Zustand **vor** dem Start, gelesen bevor etwas geschrieben wird
     * (E-058).
     *
     * Er muss hier stehen und nicht danach: Nach dem Start ist `completed_at`
     * bereits `NULL`, und aus dem Ergebnis allein ließe sich nicht mehr sagen,
     * woraus das Todo verschwindet. Genau das ist die Auskunft, die E-056
     * verlangt.
     *
     * Beides zusammen ist ein Lesezugriff auf die Zeile und einer auf den
     * Index `ix_time_entry_queue`; die Ordner werden erst weiter unten
     * aufgelöst, und nur dann, wenn es etwas zu berichten gibt.
     */
    const before = await unit.todos.load(todoId);
    const presenceBefore =
      before === null ? null : await presenceBeforeBooking(unit, todoId);

    const result = await unit.timer.start(todoId, stopRunning, timestamp);
    if (!result.ok) return err(result.error);

    // Ein frisch gestarteter Timer bekommt sofort sein erstes Lebenszeichen
    // (E-036). Ohne es wüsste ein Neustart unmittelbar nach dem Start nicht,
    // bis wohin gebucht werden darf, und verwürfe die Buchung — richtig, aber
    // unnötig.
    await unit.heartbeat.touch(result.value.started.id, timestamp);

    return ok({
      kind: 'started' as const,
      started: result.value.started,
      stopped: result.value.stopped,
      doneCleared: result.value.doneCleared,
      poolMovement: await movementOfStart(unit, {
        todo: before,
        presence: presenceBefore ?? NO_ENTRIES,
        doneCleared: result.value.doneCleared,
        // Der gestoppte Timer wird zu einer **offenen** Buchung (E-032), und
        // nur wenn er auf demselben Todo lief, betrifft das dieses hier.
        bookedOnThisTodo: result.value.stopped?.todoId === todoId,
      }),
    });
  });
}

/**
 * Die Bewegung zum Timerstart, oder `null` (E-058, A-2.5, E-032).
 *
 * Getrennt von `startTimer`, weil sie eine andere Sorte Arbeit ist: `startTimer`
 * ändert den Bestand, diese Funktion sagt, was das bedeutet. Sie schreibt
 * nichts und läuft in derselben Transaktion — der Bestand, über den sie
 * urteilt, ist der, in dem der Start stattgefunden hat.
 *
 * **Welches Zustandspaar gemeint ist, entscheidet diese Stelle; gebildet wird
 * es im Anwendungsfall darunter** (`usecases/pool-movement.ts`, E-061 Punkt 2).
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
 */
async function movementOfStart(
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
 * Der Ausgang eines Stopps — und was er durch die Pools bewegt hat (E-058
 * Punkt 6).
 *
 * ---------------------------------------------------------------------------
 * Warum der Stopp überhaupt etwas zu berichten hat
 * ---------------------------------------------------------------------------
 *
 * Weil die **erste abgeschlossene Buchung** eine Achse umlegt. Seit E-055 kann
 * eine Regel nach dem Exportstatus fragen (`exportState: 'open'` — „was habe
 * ich noch nicht abgerechnet"), und ein Todo ohne jede abgeschlossene Buchung
 * erfüllt diese Achse nicht. Der Stopp macht aus dem laufenden Timer eine
 * offene Buchung; jede solche Spalte nimmt das Todo damit auf.
 *
 * Bis T-093 sagte nur `POST /timer/start` etwas dazu. Wer am Start eine
 * Auskunft gibt und am Stopp schweigt, sagt die halbe Wahrheit — und
 * ausgerechnet die unwichtigere Hälfte: Der Start kann die erste Buchung nur
 * in dem Sonderfall entstehen lassen, in dem er einen Timer **desselben** Todos
 * verdrängt. Der Regelweg zur ersten Buchung ist dieser hier.
 *
 * ---------------------------------------------------------------------------
 * Warum das Feld auch im verworfenen Ausgang steht
 * ---------------------------------------------------------------------------
 *
 * Ein Stopp unter der Mindestdauer erzeugt keine Buchung (A-6.2), bewegt also
 * nichts, und `poolMovement` ist dort **immer** `null`. Trotzdem steht das Feld
 * da, statt in diesem Zweig zu fehlen: Ein Feld, das je nach `kind` da ist oder
 * nicht, zwingt jede Aufrufstelle zu einer Fallunterscheidung, bevor sie die
 * eigentliche treffen kann — und `movement?.appears` auf einem Zweig, der es
 * nicht kennt, liest sich fehlerfrei und fragt ins Leere. Ein immer
 * vorhandenes `null` ist die Antwort „nachgesehen, nichts".
 *
 * Der Anlaß ist stets `'booking'` und nie `'reopen'`: Ein Stopp hebt kein
 * „Erledigt" auf. Das tut allein der Start (A-2.5).
 *
 * ---------------------------------------------------------------------------
 * Zwei Gründe für „verworfen", und sie sind nicht derselbe (O-R)
 * ---------------------------------------------------------------------------
 *
 * `decideOrphanedTimer` und `decideTimerStop` liefern beide `discarded`, aber
 * aus verschiedenen Gründen — und der Grund gehört in die Meldung an den
 * Benutzer (E-036, `TimerStopDecision` in `@takt/domain`):
 *
 *   `timer_too_short`   Die Laufzeit lag unter der Mindestdauer. Der
 *                       Doppelklick auf „Start", nicht geleistete Arbeit.
 *   `orphan_discarded`  Der Benutzer hat eine **verwaiste** Buchung
 *                       ausdrücklich verworfen. Es gab etwas zu buchen, und er
 *                       wollte es nicht.
 *
 * Bis T-101 schrieb `resolveOrphanedTimer` über den zweiten Grund
 * `timer_too_short` — die Domäne unterschied, der Dienst kürzte es wieder ein.
 * Der Benutzer las danach „die Buchung war zu kurz" über eine Buchung, die er
 * selbst verworfen hatte. `POST /timer/stop` kennt weiterhin **nur**
 * `timer_too_short`: Dort gibt es keine verwaiste Buchung zu verwerfen.
 */
type StopOutcome<Reason extends 'timer_too_short' | 'orphan_discarded'> =
  | {
      readonly kind: 'recorded';
      readonly entry: TimeEntry;
      /** Wie diese Buchung das Todo durch die Pools bewegt — oder `null`. */
      readonly poolMovement: PoolMovement | null;
    }
  | {
      readonly kind: 'discarded';
      /** Siehe den Absatz „Zwei Gründe für „verworfen"" oben (O-R, E-036). */
      readonly reason: Reason;
      /** Immer `null`: Ohne Buchung bewegt sich nichts. */
      readonly poolMovement: null;
    };

/**
 * `POST /timer/stop` — ein Grund für „verworfen", und es ist nicht der des
 * verwaisten Timers.
 */
export type StopTimerResult = StopOutcome<'timer_too_short'>;

/**
 * `POST /timer/orphaned/resolve` — **beide** Gründe (O-R).
 *
 * Ein eigener Typ und nicht eine Erweiterung von {@link StopTimerResult}: Die
 * Antwort von `POST /timer/stop` kann `orphan_discarded` nicht enthalten, und
 * ein gemeinsamer Typ zwänge jede Aufrufstelle dort zu einer
 * Fallunterscheidung, die es nicht gibt. Die Gestalt teilen sie über
 * `StopOutcome`; unterschiedlich ist allein die Gründeliste.
 */
export type ResolveOrphanedTimerResult = StopOutcome<'timer_too_short' | 'orphan_discarded'>;

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
async function presenceBeforeBooking(
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
async function movementOfBooking(
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

/**
 * Timer stoppen (A-6.2, A-6.4, A-7.3).
 *
 * Die Leistung wird beim Stoppen erfasst und in derselben Anweisung
 * geschrieben wie das Ende. Bleibt sie leer, entsteht trotzdem eine Buchung —
 * sie ist nur nicht exportierbar (E-034), und die Exportvorschau sagt das mit
 * Grund und bietet an, den Text nachzutragen.
 */
export async function stopTimer(
  context: AppContext,
  note: string,
): Promise<UseCaseResult<StopTimerResult>> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    /*
     * Der Bestand **vor** dem Stopp (E-058 Punkt 6).
     *
     * Erst hier steht fest, auf welchem Todo der Timer sitzt; danach ist die
     * Frage „gab es schon eine abgeschlossene Buchung?" nicht mehr zu stellen,
     * weil es ab dem Stopp immer eine gibt.
     *
     * Läuft kein Timer, wird nichts gelesen und nichts geraten — den Fehler
     * bildet `timer.stop` gleich darunter, an genau einer Stelle.
     */
    const running = await unit.timer.running();
    // Todo und Buchungslage in **einem** Wert: Getrennt gehalten müßte die
    // Aufrufstelle unten zweimal auf `null` prüfen, und `tsc` könnte den
    // Zusammenhang zwischen beiden Prüfungen nicht sehen.
    const booked =
      running === null
        ? null
        : { todoId: running.todoId, presence: await presenceBeforeBooking(unit, running.todoId) };

    const result = await unit.timer.stop(note, timestamp);
    if (!result.ok) return err(result.error);
    if (result.value.kind === 'discarded') {
      return ok({
        kind: 'discarded' as const,
        reason: 'timer_too_short' as const,
        poolMovement: null,
      });
    }
    return ok({
      kind: 'recorded' as const,
      entry: result.value.entry,
      poolMovement:
        booked === null ? null : await movementOfBooking(unit, booked.todoId, booked.presence),
    });
  });
}

/**
 * Lebenszeichen (E-036).
 *
 * Der einzige Schreibvorgang, der im Minutentakt läuft. Er fasst die Zeile mit
 * den Abrechnungsdaten nicht an. Läuft kein Timer, ist das kein Fehler,
 * sondern die Antwort „nichts zu tun": Die Oberfläche schickt weiter, bis sie
 * selbst merkt, dass der Timer aus ist.
 */
export async function touchHeartbeat(context: AppContext): Promise<UseCaseResult<Timestamp | null>> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const running = await unit.timer.running();
    if (running === null) return ok(null);
    await unit.heartbeat.touch(running.id, timestamp);
    return ok(timestamp);
  });
}

export interface OrphanedTimerView {
  readonly running: RunningTimeEntry;
  readonly todoTitle: string;
  readonly heartbeatAt: Timestamp | null;
  /** Was gebucht würde, wenn der Benutzer „bis zum Lebenszeichen" wählt. */
  readonly bookableSeconds: number;
}

/**
 * Die beim Start vorgefundene, unvollständige Buchung (E-036).
 *
 * Sie bleibt ohne Ende, bis der Benutzer geantwortet hat, und geht in keinen
 * Export — `v_export_candidate` führt ausschließlich abgeschlossene Buchungen.
 * Das ist der Grund, warum die Frage warten darf, ohne dass jemand zu viel
 * abrechnet.
 */
export async function loadOrphanedTimer(context: AppContext): Promise<OrphanedTimerView | null> {
  return context.transactions.inTransaction(async (unit) => {
    const orphan = await unit.heartbeat.orphaned();
    if (orphan === null) return null;

    const todo = await unit.todos.load(orphan.running.todoId);
    const decision = decideOrphanedTimer({
      running: orphan.running,
      heartbeatAt: orphan.heartbeatAt,
      resolution: 'book_until_heartbeat',
    });

    return {
      running: orphan.running,
      todoTitle: todo?.title ?? '',
      heartbeatAt: orphan.heartbeatAt,
      bookableSeconds: decision.kind === 'recorded' ? decision.entry.durationSeconds : 0,
    };
  });
}

export type OrphanResolution = 'book_until_heartbeat' | 'discard';

/**
 * Die Antwort des Benutzers auf die verwaiste Buchung (E-036).
 *
 * Gebucht wird **höchstens bis zum letzten Lebenszeichen**, nie bis „jetzt".
 * Ein über Nacht vergessener Timer buchte sonst vierzehn Stunden, und nach der
 * Aufrundung aus E-008 landet das in einer Rechnung. Fehlt das Lebenszeichen
 * ganz, ist die Dauer 0 und die Buchung fällt als zu kurz heraus — es gibt
 * nichts zu buchen, was jemand bezeugen könnte.
 */
export async function resolveOrphanedTimer(
  context: AppContext,
  resolution: OrphanResolution,
): Promise<UseCaseResult<ResolveOrphanedTimerResult>> {
  const timestamp = now(context);

  return context.transactions.inTransaction(async (unit) => {
    const orphan = await unit.heartbeat.orphaned();
    if (orphan === null) {
      return err(taktError('timer_not_running', 'Es gibt keine unvollständige Buchung.'));
    }

    const decision = decideOrphanedTimer({
      running: orphan.running,
      heartbeatAt: orphan.heartbeatAt,
      resolution,
    });

    if (decision.kind === 'discarded') {
      const removed = await unit.timer.stop('', orphan.running.startedAt);
      if (!removed.ok) return err(removed.error);
      // **Verwerfen bewegt nichts** (E-058 Punkt 6). Die Buchung entsteht gar
      // nicht, `hasOpenEntries` bleibt, was es war — und deshalb wird hier auch
      // nichts gelesen und keine Regel aufgelöst.
      //
      // Der Grund kommt aus der **Domäne** und wird nicht hier gesetzt (O-R):
      // `decideOrphanedTimer` unterscheidet `orphan_discarded` von
      // `timer_too_short`, und bis T-101 schrieb diese Stelle den Unterschied
      // wieder weg. Beide Ausgänge sind erreichbar — `discard` gibt
      // `orphan_discarded`, `book_until_heartbeat` ohne Lebenszeichen gibt
      // `timer_too_short` —, und der Benutzer bekommt den Satz zu seinem
      // eigenen Fall.
      return ok({
        kind: 'discarded' as const,
        reason: decision.reason,
        poolMovement: null,
      });
    }

    // Der Bestand vor dem Buchen, aus demselben Grund wie in `stopTimer`.
    const presence = await presenceBeforeBooking(unit, orphan.running.todoId);

    // `timer.stop` mit dem Zeitpunkt des Lebenszeichens statt mit „jetzt".
    // Damit läuft der Stopp durch dieselbe Regel wie jeder andere, und es gibt
    // keinen zweiten Weg, auf dem eine Buchung entstehen kann.
    const stopped = await unit.timer.stop(orphan.running.note, decision.entry.endedAt);
    if (!stopped.ok) return err(stopped.error);
    if (stopped.value.kind === 'discarded') {
      // Hier ist `timer_too_short` der **richtige** Grund und keine Kürzung:
      // Der Benutzer wollte buchen, und die Zeit bis zum Lebenszeichen lag
      // unter der Mindestdauer. Es gibt nichts zu buchen, was jemand bezeugen
      // könnte (E-036).
      return ok({
        kind: 'discarded' as const,
        reason: 'timer_too_short' as const,
        poolMovement: null,
      });
    }
    void timestamp;
    return ok({
      kind: 'recorded' as const,
      entry: stopped.value.entry,
      poolMovement: await movementOfBooking(unit, orphan.running.todoId, presence),
    });
  });
}

// ---------------------------------------------------------------------------
// Zeitbuchungen ohne Timer (A-6.1)
// ---------------------------------------------------------------------------

export interface CreateTimeEntryInput {
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  /** Die **Leistung** (A-7.3, E-016). Sie geht in die Abrechnung. */
  readonly note: string;
}

export function createTimeEntry(
  context: AppContext,
  input: CreateTimeEntryInput,
): Promise<UseCaseResult<TimeEntry>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.timeEntries.create(input, timestamp));
}

export function listTimeEntries(
  context: AppContext,
  filter: TimeEntryFilter,
  pagination: Pagination,
): Promise<Page<TimeEntry>> {
  return context.transactions.inTransaction((unit) => unit.timeEntries.search(filter, pagination));
}

export async function loadTimeEntry(
  context: AppContext,
  id: TimeEntryId,
): Promise<UseCaseResult<TimeEntry>> {
  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timeEntries.load(id);
    if (entry === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
    return ok(entry);
  });
}

export interface UpdateTimeEntryInput {
  readonly todoId?: TodoId;
  readonly startedAt?: Timestamp;
  readonly endedAt?: Timestamp;
  readonly note?: string;
}

export function updateTimeEntry(
  context: AppContext,
  id: TimeEntryId,
  input: UpdateTimeEntryInput,
): Promise<UseCaseResult<TimeEntry>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.timeEntries.update(id, input, timestamp));
}

export function removeTimeEntry(
  context: AppContext,
  id: TimeEntryId,
): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.timeEntries.remove(id));
}
