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
  RunningTimeEntry,
  TimeEntry,
  TimeEntryId,
  Timestamp,
  TodoId,
} from '@takt/domain';
import { decideOrphanedTimer, err, ok, taktError } from '@takt/domain';
import type { Page, Pagination, TimeEntryFilter } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from './context.ts';

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
    });
  });
}

export type StopTimerResult =
  | { readonly kind: 'recorded'; readonly entry: TimeEntry }
  | { readonly kind: 'discarded'; readonly reason: 'timer_too_short' };

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
    const result = await unit.timer.stop(note, timestamp);
    if (!result.ok) return err(result.error);
    if (result.value.kind === 'discarded') {
      return ok({ kind: 'discarded' as const, reason: 'timer_too_short' as const });
    }
    return ok({ kind: 'recorded' as const, entry: result.value.entry });
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
): Promise<UseCaseResult<StopTimerResult>> {
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
      return ok({ kind: 'discarded' as const, reason: 'timer_too_short' as const });
    }

    // `timer.stop` mit dem Zeitpunkt des Lebenszeichens statt mit „jetzt".
    // Damit läuft der Stopp durch dieselbe Regel wie jeder andere, und es gibt
    // keinen zweiten Weg, auf dem eine Buchung entstehen kann.
    const stopped = await unit.timer.stop(orphan.running.note, decision.entry.endedAt);
    if (!stopped.ok) return err(stopped.error);
    if (stopped.value.kind === 'discarded') {
      return ok({ kind: 'discarded' as const, reason: 'timer_too_short' as const });
    }
    void timestamp;
    return ok({ kind: 'recorded' as const, entry: stopped.value.entry });
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
