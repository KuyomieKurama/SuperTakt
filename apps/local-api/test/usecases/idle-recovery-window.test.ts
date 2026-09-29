/**
 * Takt — A-24, B-5, R-35: two ways a recovered idle phase can disagree with the machine that
 * resumes it (T-401c, from T-388's measurements M2/M3).
 *
 *  - Clock skew (M2): an OPEN phase whose recorded start lies after the resuming computer's own
 *    wall clock is pulled back to that clock (`clampFutureIdlePhase`, `data-transfer.ts`); its
 *    previous periods are capped the same way, and one that ends up empty is dropped.
 *  - The allocation window of a phase found at service start or brought in by an archive never
 *    reaches past its last heartbeat (`witnessedIdleEnd`, `closeIdleWindow` in `idle.ts`) — the
 *    same rule whether the phase arrived through an archive or survived a plain crash.
 *
 * Built against a real in-memory SQLite database via `createTimerMachine` (no port mocked), with
 * direct `dataArchive.readAll`/`replaceAll` manipulation where a fixture needs a `timer_idle` row
 * shaped by hand — the same technique `time-entry-24h-limit.test.ts` uses for a too-long booking.
 */
import { describe, expect, it } from 'vitest';
import type { AppContext } from '../../src/context.ts';
import type { Timestamp, TodoId } from '@takt/domain';
import { createTimerMachine, type TimerMachine } from '../support/timer-machine.ts';
import { beginIdle, loadIdle, returnFromIdle } from '../../src/features/timer/idle.ts';
import { captureTimerRecovery, startTimer } from '../../src/features/timer/timer.ts';
import { exportDataArchive, importDataArchive } from '../../src/features/data-transfer/data-transfer.ts';

function ordinarySession(context: AppContext): AppContext {
  return { ...context, timerRecovery: { entryId: null } };
}

function plusSeconds(base: Timestamp, seconds: number): Timestamp {
  return new Date(Date.parse(base) + seconds * 1000).toISOString().replace('.000Z', 'Z') as Timestamp;
}

async function createTodo(m: TimerMachine, title: string): Promise<TodoId> {
  const todo = await m.database.transactions.inTransaction((unit) =>
    unit.todos.create({ title, callNumber: null, statusId: null, tagIds: [], note: '', now: '2026-09-01T00:00:00Z' as Timestamp }, []),
  );
  return todo.id;
}

describe('A-24 clock skew on import (T-388 M2) — an open phase in the future is pulled back to now', () => {
  it('the phase and its previous periods are capped at the resuming wall clock; a return one second later succeeds where the same instant does not', async () => {
    const source = await createTimerMachine('2026-09-01T08:00:00Z' as Timestamp);
    const todo = await createTodo(source, 'Uhrversatz');
    const started = await startTimer(ordinarySession(source.context), todo, false);
    if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
    const entryId = started.value.started.id;

    // A phase recorded on the source computer, open, well after the resuming computer's own
    // clock — plus two previous periods: one spanning the resuming clock (capped, kept) and one
    // entirely after it (capped to nothing, dropped).
    await source.database.transactions.inTransaction(async (unit) => {
      const tables = await unit.dataArchive.readAll();
      await unit.dataArchive.replaceAll({
        ...tables,
        timer_idle: [{
          id: 1, session_id: entryId, todo_id: todo, started_at: '2026-09-01T17:55:00Z', returned_at: null, note: '',
          previous_periods: JSON.stringify([
            { id: entryId, todoId: todo, startedAt: '2026-09-01T17:30:00Z', returnedAt: '2026-09-01T17:50:00Z', note: '' },
            // Entirely after the resuming clock, but still before the phase's own recorded
            // start (17:55) — `parseArchive` itself requires that ordering on import.
            { id: entryId, todoId: todo, startedAt: '2026-09-01T17:52:00Z', returnedAt: '2026-09-01T17:54:00Z', note: '' },
          ]),
        }],
      });
    });
    const archive = await exportDataArchive(source.context);
    source.database.close();

    const target = await createTimerMachine('2026-09-01T17:45:00Z' as Timestamp);
    const targetContext = ordinarySession(target.context);
    try {
      expect((await importDataArchive(targetContext, archive)).ok).toBe(true);

      const idle = await loadIdle(targetContext);
      expect(idle).toMatchObject({
        startedAt: '2026-09-01T17:45:00Z',
        returnedAt: null,
        previousPeriods: [{ startedAt: '2026-09-01T17:30:00Z', returnedAt: '2026-09-01T17:45:00Z' }],
      });

      const sameInstant = await returnFromIdle(targetContext, entryId);
      expect(sameInstant).toMatchObject({ ok: false, error: { code: 'validation_error' } });

      target.setClock('2026-09-01T17:45:01Z' as Timestamp);
      const oneSecondLater = await returnFromIdle(targetContext, entryId);
      expect(oneSecondLater.ok).toBe(true);
    } finally {
      target.database.close();
    }
  });
});

describe('A-24 allocation window of a recovered phase (T-388 M3) — capped at the last heartbeat, never at the resuming clock', () => {
  const PHASE_START = '2026-09-01T06:05:00Z' as Timestamp;
  const LAST_HEARTBEAT = '2026-09-01T06:20:00Z' as Timestamp;
  const RESUMING_CLOCK = '2026-09-01T17:45:00Z' as Timestamp;

  it('through an archive: the window is exactly 900 seconds (06:05 to 06:20), not the 11-hour wall clock', async () => {
    const source = await createTimerMachine('2026-09-01T06:00:00Z' as Timestamp);
    const todo = await createTodo(source, 'Fensterprüfung');
    const started = await startTimer(ordinarySession(source.context), todo, false);
    if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
    const entryId = started.value.started.id;

    await source.database.transactions.inTransaction(async (unit) => {
      await unit.heartbeat.touch(entryId, LAST_HEARTBEAT);
      const tables = await unit.dataArchive.readAll();
      await unit.dataArchive.replaceAll({
        ...tables,
        timer_idle: [{ id: 1, session_id: entryId, todo_id: todo, started_at: PHASE_START, returned_at: null, note: '', previous_periods: '[]' }],
      });
    });
    const archive = await exportDataArchive(source.context);
    source.database.close();

    const target = await createTimerMachine(RESUMING_CLOCK);
    const targetContext = ordinarySession(target.context);
    try {
      expect((await importDataArchive(targetContext, archive)).ok).toBe(true);

      const result = await returnFromIdle(targetContext, entryId);
      expect(result.ok).toBe(true);

      const idle = await loadIdle(targetContext);
      expect(idle).toMatchObject({ startedAt: PHASE_START, returnedAt: LAST_HEARTBEAT });
    } finally {
      target.database.close();
    }
  });

  it('a plain crash without any archive gets the same 900-second window — "found" comes from captureTimerRecovery, not from an import', async () => {
    const m = await createTimerMachine('2026-09-01T06:00:00Z' as Timestamp);
    try {
      const todo = await createTodo(m, 'Absturz ohne Archiv');
      const liveSession = ordinarySession(m.context);
      const started = await startTimer(liveSession, todo, false);
      if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
      const entryId = started.value.started.id;

      // The front end only calls `beginIdle` once the threshold has actually elapsed.
      m.setClock(plusSeconds(PHASE_START, 5 * 60));
      expect((await beginIdle(liveSession, { entryId, startedAt: PHASE_START })).ok).toBe(true);
      await m.database.transactions.inTransaction((unit) => unit.heartbeat.touch(entryId, LAST_HEARTBEAT));

      // "Crash": a fresh context on the SAME database, exactly like `timer-recovery-booking.test.ts`.
      const restarted = ordinarySession(m.context);
      await captureTimerRecovery(restarted);
      expect(restarted.timerRecovery).toMatchObject({ entryId, idleSessionId: entryId });

      m.setClock(RESUMING_CLOCK);
      expect((await returnFromIdle(restarted, entryId)).ok).toBe(true);

      const idle = await loadIdle(restarted);
      expect(idle).toMatchObject({ startedAt: PHASE_START, returnedAt: LAST_HEARTBEAT });
    } finally {
      m.database.close();
    }
  });

  it('without any heartbeat after the phase began, a recovered phase is discarded rather than offered for allocation', async () => {
    const m = await createTimerMachine('2026-09-01T06:00:00Z' as Timestamp);
    try {
      const todo = await createTodo(m, 'Ohne Lebenszeichen');
      const liveSession = ordinarySession(m.context);
      const started = await startTimer(liveSession, todo, false);
      if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
      const entryId = started.value.started.id;
      // The only heartbeat on record is the one `startTimer` itself sent, BEFORE the phase began.

      m.setClock(plusSeconds(PHASE_START, 5 * 60));
      expect((await beginIdle(liveSession, { entryId, startedAt: PHASE_START })).ok).toBe(true);

      const restarted = ordinarySession(m.context);
      await captureTimerRecovery(restarted);

      m.setClock(RESUMING_CLOCK);
      expect((await returnFromIdle(restarted, entryId)).ok).toBe(true);

      // Discarded, not offered: `resolveIdle` never sees it again.
      expect(await loadIdle(restarted)).toBeNull();
    } finally {
      m.database.close();
    }
  });
});
