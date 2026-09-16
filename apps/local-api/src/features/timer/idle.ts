/**
 * Takt — Inaktivität (A-24) und ihre Grenze zur Verwaistenregel (E-036, R-34).
 *
 * ===========================================================================
 * Die zwei Türen, die T-363 offen gelassen hat (T-369, T-370, T-371)
 * ===========================================================================
 *
 * A-24 und E-036 fragen dasselbe auf zwei Seiten einer Linie: **hat der Prozeß
 * überlebt?** Lebt er, wird die Abwesenheit vorgemerkt und die Rückkehr
 * schließt die aktive Zeit ab (diese Datei). Ist er tot, gilt E-036 — gebucht
 * wird höchstens bis zum letzten Lebenszeichen.
 *
 * Bis T-371 hat diese Datei die Linie nicht gekannt. Beide Schreibstellen
 * schlossen den laufenden Eintrag mit einem Zeitpunkt, der aus der **Wanduhr
 * dieses Rechners** kam, ohne zu fragen, ob der Eintrag überhaupt von diesem
 * Lauf stammt. Gemessen, zweimal unabhängig, mit Archiv und ohne:
 *
 *     GET  /timer/orphaned      bietet                 1 200 s
 *     POST /timer/idle/begin  + /idle/return   bucht  39 900 s   (open)
 *
 * in **beiden** Stellungen von `idleKeepTimerRunning`. Und das Schwerste
 * daran: Es braucht keine Handlung, die nach einer Buchung aussieht.
 * `useIdleTimer` schickt `begin` und `return` von selbst, sobald der Benutzer
 * vom Rechner weggeht.
 *
 * ===========================================================================
 * Zwei Ausgänge, und warum sie verschieden sind
 * ===========================================================================
 *
 * Die Frage des Auftrags lautete: auf einem vorgefundenen Eintrag **deckeln**
 * oder **abweisen**? Die Antwort ist beides, und die Trennlinie ist, ob es
 * einen anderen Weg aus dem Zustand gibt:
 *
 *  - **{@link beginIdle} weist ab.** Hier entsteht eine Inaktivitätsphase
 *    **neu**, und zwar ohne Zutun des Benutzers. Ein vorgefundener Eintrag ist
 *    die Leiche eines toten Laufs; er hat keine „aktive Zeit", die eine
 *    Rückkehr abschließen könnte, und aus der Abwesenheit einer Leiche eine
 *    verteilbare Zeitspanne zu machen, hieße Buchungszeit zu erfinden. Ein
 *    Deckel wäre hier zudem eine **Buchung ohne Antwort**: Er schlösse den
 *    Eintrag auf 1 200 s, während der Benutzer weg ist, und nähme ihm damit
 *    den Ausgang „verwerfen", den E-036 ausdrücklich anbietet. Abweisen
 *    hinterläßt keine Sackgasse — ohne offene Inaktivität bleiben
 *    `POST /timer/stop` (gedeckelt seit T-363), `GET /timer/orphaned` und
 *    `POST /timer/orphaned/resolve` alle drei offen.
 *  - **{@link completeReturn} deckelt.** Nach der Abweisung oben kann diese
 *    Stelle einen vorgefundenen Eintrag nur noch auf **einem** Weg sehen: Die
 *    Inaktivitätsphase stand schon in SQLite, als der Dienst hochkam (A-24.7),
 *    weil der vorige Lauf mitten in der Abwesenheit starb oder weil sie aus
 *    einem Archiv kam. Abweisen wäre dort eine echte Sackgasse — `stopTimer`,
 *    `loadOrphanedTimer` und `resolveOrphanedTimer` verweigern alle drei,
 *    solange eine unbestätigte Rückkehr aussteht. Also wird geschlossen, aber
 *    nicht weiter als bis zum letzten Lebenszeichen.
 *
 * Die Regel selbst wird dabei **nicht abgeschrieben**: Was „vorgefunden"
 * heißt, steht in `foundAtServiceStart`, was daraus folgt, in `bookingEndOf`,
 * und der Deckel nach oben in `decideOrphanedTimer` (`packages/domain`) — alle
 * drei in `timer.ts` beziehungsweise der Domäne, alle drei an genau einer
 * Stelle. Neu ist hier allein, **wer fragt**.
 */

import { err, ok, planIdlePeriods, taktError, type IdleAllocation, type Result, type TaktError, type TimeEntryId, type Timestamp } from '@takt/domain';
import type { IdleSession, UnitOfWork } from '@takt/storage';
import { now, type AppContext, type UseCaseResult } from '../../context.ts';
import { bookingEndOf, foundAtServiceStart } from './timer.ts';

export interface IdleView extends IdleSession { readonly todoTitle: string }

async function view(unit: UnitOfWork): Promise<IdleView | null> {
  const pending = await unit.idle.pending();
  if (pending === null) return null;
  const todo = await unit.todos.load(pending.todoId);
  return { ...pending, todoTitle: todo?.title ?? 'Nicht mehr vorhandene Aufgabe' };
}

export function loadIdle(context: AppContext): Promise<IdleView | null> {
  return context.transactions.inTransaction(view);
}

// A returned error does not roll back TransactionPort. Abort after any write
// by throwing, then convert back outside the transaction boundary.
class IdleWriteFailure extends Error {
  readonly problem: TaktError;
  constructor(problem: TaktError) { super(problem.message); this.problem = problem; }
}
function requireSuccess<T>(result: Result<T, TaktError>): T {
  if (!result.ok) throw new IdleWriteFailure(result.error);
  return result.value;
}
async function transaction<T>(context: AppContext, work: (unit: UnitOfWork) => Promise<UseCaseResult<T>>): Promise<UseCaseResult<T>> {
  try { return await context.transactions.inTransaction(work); }
  catch (error) { if (error instanceof IdleWriteFailure) return err(error.problem); throw error; }
}

function validInstant(value: string): boolean {
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString().replace('.000Z', 'Z') === value;
}

async function completeReturn(context: AppContext, unit: UnitOfWork, pending: IdleSession, end: Timestamp, timestamp: Timestamp): Promise<void> {
  const running = await unit.timer.running();
  if (running !== null && running.id === pending.id) {
    /*
     * Wo die aktive Zeit endet — der Wunsch ist der Beginn der Abwesenheit,
     * mehr ist es nie (T-371).
     *
     * Für einen Timer **dieses** Laufs kommt `pending.startedAt` unverändert
     * zurück, und das Verhalten aus A-24 ist zeichengleich: getrennt wird
     * sekundengenau am Beginn der Abwesenheit, fortgeführt bei der Rückkehr,
     * ohne Überlappung.
     *
     * Für einen **vorgefundenen** Eintrag ist `pending.startedAt` dagegen eine
     * Ortsangabe über einen fremden Lauf: Er kann von der Uhr des
     * Quellrechners stammen oder schlicht elf Stunden nach dem letzten
     * Lebenszeichen liegen. Dann wird bis zum Lebenszeichen geschlossen —
     * dieselbe Zahl, die `GET /timer/orphaned` nennt. Fehlt es ganz, gibt
     * `bookingEndOf` den Startzeitpunkt zurück, und `separateIdle` räumt die
     * Zeile ab, statt eine Buchung über 0 Sekunden anzulegen; auch das ist
     * derselbe Ausgang wie im Dialog.
     */
    const continued = requireSuccess(
      await unit.timer.separateIdle(running.id, await bookingEndOf(context, unit, running, pending.startedAt), end, timestamp),
    );
    await unit.heartbeat.touch(continued.id, timestamp);
  } else if (running !== null && Date.parse(running.startedAt) < Date.parse(end)) {
    throw new IdleWriteFailure(taktError('conflict', 'Der Timer wurde während der inaktiven Zeit geändert.'));
  }
  await unit.idle.returned(pending.id, end);
  // Bei gespeicherten Sitzungen der Vorversion war der Timer bereits gestoppt.
  if (running === null && (await unit.settings.load()).idleKeepTimerRunning) {
    const continued = requireSuccess(await unit.timer.start(pending.todoId, false, end));
    await unit.heartbeat.touch(continued.started.id, timestamp);
  }
}

export function beginIdle(context: AppContext, input: { entryId: TimeEntryId; startedAt: Timestamp; returnedAt?: Timestamp }): Promise<UseCaseResult<IdleView | null>> {
  const timestamp = now(context);
  return transaction(context, async unit => {
    const existing = await unit.idle.pending();
    if (existing !== null) {
      if ([...(existing.previousPeriods ?? []), existing].some(period => period.id === input.entryId)) return ok(await view(unit));
      if (existing.returnedAt === null) return err(taktError('conflict', 'Die Rückkehr der letzten inaktiven Zeit ist noch offen.'));
      if ((existing.previousPeriods?.length ?? 0) >= 127 || Date.parse(input.startedAt) < Date.parse(existing.returnedAt)) {
        return err(taktError('validation_error', 'Die neue inaktive Zeit überschneidet eine vorhandene Phase oder die Sammlung ist voll.'));
      }
    }
    const settings = await unit.settings.load();
    if (!settings.idleDetectionEnabled) return err(taktError('conflict', 'Die Inaktivitätserkennung ist ausgeschaltet.'));
    const running = await unit.timer.running();
    if (running === null || running.id !== input.entryId) return err(taktError('conflict', 'Der Timer hat sich inzwischen geändert. Bitte erneut prüfen.'));
    /*
     * Auf einer Leiche beginnt keine Abwesenheit (T-371, R-34, E-036).
     *
     * Diese Abweisung steht **vor** jedem Schreibvorgang; ein zurückgegebener
     * Fehler rollt die Klammer nicht zurück, und hier ist noch nichts
     * zurückzunehmen. Die Begründung steht im Kopf dieser Datei; kurz: Der
     * Stopp ist eine Antwort des Benutzers, dieser Aufruf ist es nicht, und
     * eine Buchung ohne Antwort nähme dem Benutzer den Ausgang „verwerfen".
     *
     * Der Satz ist bewußt einer, der weitersagt, was zu tun ist: Die
     * Oberfläche zeigt ihn (`useIdleTimer` reicht die Fehlermeldung durch) und
     * wiederholt den Aufruf frühestens nach einer Minute.
     */
    if (foundAtServiceStart(context, running.id)) {
      return err(taktError('conflict', 'Diese Buchung ohne Ende stammt aus einem früheren Lauf. Entscheiden Sie zuerst, ob sie gebucht oder verworfen wird.'));
    }
    const start = Date.parse(input.startedAt);
    const end = Date.parse(input.returnedAt ?? timestamp);
    if (!validInstant(input.startedAt) || (input.returnedAt !== undefined && !validInstant(input.returnedAt)) ||
        start < Date.parse(running.startedAt) || end > Date.parse(timestamp) ||
        end - start < settings.idleThresholdMinutes * 60_000) {
      return err(taktError('validation_error', 'Die inaktive Zeit liegt nicht innerhalb des laufenden Timers oder ist kürzer als die eingestellte Schwelle.'));
    }
    const pending: IdleSession = { id: running.id, todoId: running.todoId, startedAt: input.startedAt, returnedAt: null, note: running.note };
    // Zweite Wand, absichtlich doppelt (T-371): Die Abweisung oben macht diese
    // Zeile für einen vorgefundenen Eintrag unerreichbar — aber eine
    // Schreibstelle, die ihre Frage einer `if`-Bedingung weiter oben
    // überläßt, ist genau die Bauart, an der T-363 gescheitert ist. Für einen
    // Timer dieses Laufs gibt `bookingEndOf` `input.startedAt` unverändert
    // zurück; die Zeile kostet also nichts und hält, wenn jemand die
    // Abweisung entfernt. `proof:layers` Abschnitt 7 mißt sie mit.
    if (!settings.idleKeepTimerRunning) requireSuccess(await unit.timer.stop(running.note, await bookingEndOf(context, unit, running, input.startedAt)));
    if (existing === null) await unit.idle.begin(pending);
    else {
      const { previousPeriods: previous = [], ...last } = existing;
      await unit.idle.replace({ ...pending, previousPeriods: [...previous, last] });
    }
    if (input.returnedAt !== undefined) await completeReturn(context, unit, pending, input.returnedAt, timestamp);
    return ok(await view(unit));
  });
}

export function returnFromIdle(context: AppContext, id: TimeEntryId, returnedAt?: Timestamp): Promise<UseCaseResult<IdleView | null>> {
  const timestamp = now(context);
  return transaction(context, async unit => {
    const pending = await unit.idle.pending();
    if (pending === null) return ok(null);
    if (pending.id !== id) return err(taktError('conflict', 'Diese inaktive Zeit wurde bereits bearbeitet.'));
    if (pending.returnedAt !== null) return ok(await view(unit));
    const end = returnedAt ?? timestamp;
    if (!validInstant(end) || Date.parse(end) <= Date.parse(pending.startedAt) || Date.parse(end) > Date.parse(timestamp)) {
      return err(taktError('validation_error', 'Der Rückkehrzeitpunkt ist ungültig.'));
    }
    await completeReturn(context, unit, pending, end, timestamp);
    return ok(await view(unit));
  });
}

export interface IdleResolution { recordedSeconds: number; breakSeconds: number; resumed: boolean; alreadyResolved: boolean }
export function resolveIdle(context: AppContext, input: { id: TimeEntryId; allocations: readonly IdleAllocation[]; resume: boolean }): Promise<UseCaseResult<IdleResolution>> {
  const timestamp = now(context);
  return transaction<IdleResolution>(context, async unit => {
    const pending = await unit.idle.pending();
    if (pending === null) return ok({ recordedSeconds: 0, breakSeconds: 0, resumed: false, alreadyResolved: true });
    if (pending.id !== input.id) return err(taktError('conflict', 'Es wartet inzwischen eine andere inaktive Zeit auf Zuordnung.'));
    if (pending.returnedAt === null) return err(taktError('conflict', 'Bestätigen Sie zuerst Ihre Rückkehr.'));
    const planned = planIdlePeriods([...(pending.previousPeriods ?? []), pending], input.allocations);
    if (!planned.ok) return planned;
    // Check every target before the first mutation; later errors still roll back.
    for (const part of planned.value) {
      if (part.todoId !== null && await unit.todos.load(part.todoId) === null) return err(taktError('not_found', 'Eine ausgewählte Aufgabe gibt es nicht mehr.'));
    }
    let recordedSeconds = 0;
    let breakSeconds = 0;
    for (const part of planned.value) {
      if (part.todoId === null) { breakSeconds += part.seconds; continue; }
      requireSuccess(await unit.timeEntries.create({ todoId: part.todoId, startedAt: part.startedAt, endedAt: part.endedAt, note: part.note }, timestamp));
      recordedSeconds += part.seconds;
    }
    await unit.idle.clear(pending.id);
    if (input.resume && await unit.timer.running() === null) {
      const started = requireSuccess(await unit.timer.start(pending.todoId, false, timestamp));
      await unit.heartbeat.touch(started.started.id, timestamp);
    }
    return ok({ recordedSeconds, breakSeconds, resumed: await unit.timer.running() !== null, alreadyResolved: false });
  });
}
