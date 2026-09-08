import { err, ok, planIdleAllocation, taktError, type IdleAllocation, type Result, type TaktError, type TimeEntryId, type Timestamp } from '@takt/domain';
import type { IdleSession, UnitOfWork } from '@takt/storage';
import { now, type AppContext, type UseCaseResult } from './context.ts';

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

async function completeReturn(unit: UnitOfWork, pending: IdleSession, end: Timestamp, timestamp: Timestamp): Promise<void> {
  const running = await unit.timer.running();
  if (running !== null && running.id === pending.id) {
    const continued = requireSuccess(await unit.timer.separateIdle(running.id, pending.startedAt, end, timestamp));
    await unit.heartbeat.touch(continued.id, timestamp);
  } else if (running !== null && Date.parse(running.startedAt) < Date.parse(end)) {
    throw new IdleWriteFailure(taktError('conflict', 'Der Timer wurde während der inaktiven Zeit geändert.'));
  }
  await unit.idle.returned(pending.id, end);
  // Existing saved sessions from the previous version had already stopped.
  if (running === null && (await unit.settings.load()).idleKeepTimerRunning) {
    const continued = requireSuccess(await unit.timer.start(pending.todoId, false, end));
    await unit.heartbeat.touch(continued.started.id, timestamp);
  }
}

export function beginIdle(context: AppContext, input: { entryId: TimeEntryId; startedAt: Timestamp; returnedAt?: Timestamp }): Promise<UseCaseResult<IdleView | null>> {
  const timestamp = now(context);
  return transaction(context, async unit => {
    const existing = await unit.idle.pending();
    if (existing !== null) return existing.id === input.entryId ? ok(await view(unit)) : err(taktError('conflict', 'Es wartet bereits eine andere inaktive Zeit auf Zuordnung.'));
    const settings = await unit.settings.load();
    if (!settings.idleDetectionEnabled) return err(taktError('conflict', 'Die Inaktivitätserkennung ist ausgeschaltet.'));
    const running = await unit.timer.running();
    if (running === null || running.id !== input.entryId) return err(taktError('conflict', 'Der Timer hat sich inzwischen geändert. Bitte erneut prüfen.'));
    const start = Date.parse(input.startedAt);
    const end = Date.parse(input.returnedAt ?? timestamp);
    if (!validInstant(input.startedAt) || (input.returnedAt !== undefined && !validInstant(input.returnedAt)) ||
        start < Date.parse(running.startedAt) || end > Date.parse(timestamp) ||
        end - start < settings.idleThresholdMinutes * 60_000) {
      return err(taktError('validation_error', 'Die inaktive Zeit liegt nicht innerhalb des laufenden Timers oder ist kürzer als die eingestellte Schwelle.'));
    }
    const pending = { id: running.id, todoId: running.todoId, startedAt: input.startedAt, returnedAt: null, note: running.note };
    if (!settings.idleKeepTimerRunning) requireSuccess(await unit.timer.stop(running.note, input.startedAt));
    await unit.idle.begin(pending);
    if (input.returnedAt !== undefined) await completeReturn(unit, pending, input.returnedAt, timestamp);
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
    await completeReturn(unit, pending, end, timestamp);
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
    const planned = planIdleAllocation(pending.startedAt, pending.returnedAt, input.allocations);
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
