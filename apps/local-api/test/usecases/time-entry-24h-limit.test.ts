/**
 * Takt — A-28.6, the 24-hour limit on every door that can create or close a booking (T-401c).
 *
 * `MAX_TIME_ENTRY_SECONDS` (86 400 s) is a domain constant, but the doors that enforce it sit
 * across storage (`repo-time.ts`) and the timer/idle use cases (`timer.ts`, `idle.ts`,
 * `foreign.ts`, `data-transfer.ts`). This file measures the boundary at each of those doors
 * through the real application-level functions, against a real in-memory SQLite database — no
 * port is mocked, following `timer-recovery-booking.test.ts` and `idle.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import type { AppContext } from '../../src/context.ts';
import type { TimeEntryId, Timestamp, TodoId } from '@takt/domain';
import { openDatabase } from '@takt/storage';
import { createTimerMachine, type TimerMachine } from '../support/timer-machine.ts';
import { createTimeEntry, updateTimeEntry } from '../../src/features/timer/bookings.ts';
import { beginIdle, resolveIdle } from '../../src/features/timer/idle.ts';
import { exportDataArchive, importDataArchive } from '../../src/features/data-transfer/data-transfer.ts';
import { importSuperProductivity } from '../../src/features/data-transfer/foreign.ts';
import { resolveOrphanedTimer, startTimer, stopTimer } from '../../src/features/timer/timer.ts';

const T0 = '2026-09-01T08:00:00Z' as Timestamp;
const ONE_DAY_SECONDS = 24 * 60 * 60;

function plusSeconds(base: Timestamp, seconds: number): Timestamp {
  return new Date(Date.parse(base) + seconds * 1000).toISOString().replace('.000Z', 'Z') as Timestamp;
}

/** Marks a running timer as belonging to THIS run (not "found at service start"). */
function ordinarySession(context: AppContext): AppContext {
  return { ...context, timerRecovery: { entryId: null } };
}

async function createTodo(m: TimerMachine, title: string): Promise<TodoId> {
  const todo = await m.database.transactions.inTransaction((unit) =>
    unit.todos.create({ title, callNumber: null, statusId: null, tagIds: [], note: '', now: T0 }, []),
  );
  return todo.id;
}

describe('A-28.6 — manual booking (POST /time-entries)', () => {
  it('exactly 24 hours is accepted, 24 hours and one second is rejected', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Handbuchung');
      const ok24h = await createTimeEntry(m.context, {
        todoId: todo, startedAt: T0, endedAt: plusSeconds(T0, ONE_DAY_SECONDS), note: 'Text',
      });
      expect(ok24h.ok).toBe(true);
      if (ok24h.ok) expect(ok24h.value.entry.durationSeconds).toBe(ONE_DAY_SECONDS);

      const tooLong = await createTimeEntry(m.context, {
        todoId: todo, startedAt: T0, endedAt: plusSeconds(T0, ONE_DAY_SECONDS + 1), note: 'Text',
      });
      expect(tooLong).toMatchObject({ ok: false, error: { code: 'time_entry_too_long' } });
    } finally {
      m.database.close();
    }
  });
});

describe('A-28.6 — editing an older, longer booking', () => {
  it('a service-text-only PATCH on a 25-hour booking succeeds; extending it further is rejected', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Alte Buchung');
      // A 25-hour entry can only arrive through a raw table replace (own archive, A-28.6 point 2
      // in the T-388 report) — `create` itself would reject it, as proven above.
      const longId = 'long-entry-0001' as TimeEntryId;
      await m.database.transactions.inTransaction(async (unit) => {
        const tables = await unit.dataArchive.readAll();
        await unit.dataArchive.replaceAll({
          ...tables,
          time_entry: [
            ...tables.time_entry,
            {
              id: longId, todo_id: todo, started_at: T0, ended_at: plusSeconds(T0, ONE_DAY_SECONDS + 3600),
              note: 'Alte Notiz', export_status: 'open', export_count: 0, source: 'manual',
              created_at: T0, updated_at: T0,
            },
          ],
        });
      });

      const noteOnly = await updateTimeEntry(m.context, longId, { note: 'Nachgetragene Leistung' });
      expect(noteOnly).toMatchObject({ ok: true, value: { note: 'Nachgetragene Leistung' } });

      const extended = await updateTimeEntry(m.context, longId, { endedAt: plusSeconds(T0, ONE_DAY_SECONDS + 3601) });
      expect(extended).toMatchObject({ ok: false, error: { code: 'time_entry_too_long' } });
    } finally {
      m.database.close();
    }
  });
});

describe('A-28.6 — timer stop (POST /timer/stop)', () => {
  it('stopping after 25 hours without an end is refused; with the real end at the cap it books, one second over is rejected', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Timer');
      const context = ordinarySession(m.context);
      expect((await startTimer(context, todo, false)).ok).toBe(true);
      m.setClock(plusSeconds(T0, ONE_DAY_SECONDS + 3600));

      const withoutEnd = await stopTimer(context, '');
      expect(withoutEnd).toMatchObject({ ok: false, error: { code: 'timer_stop_end_required' } });

      const atCap = await stopTimer(context, 'Text', plusSeconds(T0, ONE_DAY_SECONDS));
      expect(atCap.ok).toBe(true);
      if (atCap.ok && atCap.value.kind === 'recorded') expect(atCap.value.entry.durationSeconds).toBe(ONE_DAY_SECONDS);
    } finally {
      m.database.close();
    }
  });

  it('one second past the 24-hour cap is rejected even when named explicitly', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Timer');
      const context = ordinarySession(m.context);
      expect((await startTimer(context, todo, false)).ok).toBe(true);
      m.setClock(plusSeconds(T0, ONE_DAY_SECONDS + 3600));

      const overCap = await stopTimer(context, 'Text', plusSeconds(T0, ONE_DAY_SECONDS + 1));
      expect(overCap).toMatchObject({ ok: false, error: { code: 'time_entry_too_long' } });
    } finally {
      m.database.close();
    }
  });
});

describe('A-28.6 — displacement at start (POST /timer/start, stopRunning: true)', () => {
  it('starting on another todo while the running timer is already over 24 hours old is refused, not silently capped', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todoA = await createTodo(m, 'A');
      const todoB = await createTodo(m, 'B');
      const context = ordinarySession(m.context);
      expect((await startTimer(context, todoA, false)).ok).toBe(true);
      m.setClock(plusSeconds(T0, ONE_DAY_SECONDS + 3600));

      const displaced = await startTimer(context, todoB, true);
      expect(displaced).toMatchObject({ ok: false, error: { code: 'timer_stop_end_required' } });
    } finally {
      m.database.close();
    }
  });
});

describe('A-28.6 — orphan dialog (POST /timer/orphaned/resolve)', () => {
  it('an explicit end at the cap books 24 hours, one second more is rejected', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Verwaist');
      const context = ordinarySession(m.context);
      const started = await startTimer(context, todo, false);
      if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
      // Mark this very entry as "found at service start" — the orphan dialog only ever applies
      // to a booking that a restart (or an archive) found, not to one this run started itself.
      context.timerRecovery!.entryId = started.value.started.id;
      m.setClock(plusSeconds(T0, ONE_DAY_SECONDS + 3600));

      const atCap = await resolveOrphanedTimer(context, 'book_until_heartbeat', plusSeconds(T0, ONE_DAY_SECONDS));
      expect(atCap.ok).toBe(true);
      if (atCap.ok && atCap.value.kind === 'recorded') expect(atCap.value.entry.durationSeconds).toBe(ONE_DAY_SECONDS);
    } finally {
      m.database.close();
    }
  });

  it('one second past the cap is rejected', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Verwaist');
      const context = ordinarySession(m.context);
      const started = await startTimer(context, todo, false);
      if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
      context.timerRecovery!.entryId = started.value.started.id;
      m.setClock(plusSeconds(T0, ONE_DAY_SECONDS + 3600));

      const overCap = await resolveOrphanedTimer(context, 'book_until_heartbeat', plusSeconds(T0, ONE_DAY_SECONDS + 1));
      expect(overCap).toMatchObject({ ok: false, error: { code: 'time_entry_too_long' } });
    } finally {
      m.database.close();
    }
  });
});

describe('A-28.6 — beginIdle (POST /timer/idle/begin)', () => {
  it('an active part of more than 24 hours before the absence is refused; exactly 24 hours is accepted', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Inaktiv');
      const context = ordinarySession(m.context);
      const started = await startTimer(context, todo, false);
      if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
      const entryId = started.value.started.id;
      m.setClock(plusSeconds(T0, ONE_DAY_SECONDS + 3600));

      const overCap = await beginIdle(context, {
        entryId, startedAt: plusSeconds(T0, ONE_DAY_SECONDS + 1), returnedAt: plusSeconds(T0, ONE_DAY_SECONDS + 3600),
      });
      expect(overCap).toMatchObject({ ok: false, error: { code: 'timer_stop_end_required' } });

      const atCap = await beginIdle(context, {
        entryId, startedAt: plusSeconds(T0, ONE_DAY_SECONDS), returnedAt: plusSeconds(T0, ONE_DAY_SECONDS + 3600),
      });
      expect(atCap.ok).toBe(true);
    } finally {
      m.database.close();
    }
  });
});

describe('A-28.6 — resolveIdle allocations (POST /timer/idle/resolve)', () => {
  it('a single allocation over 24 hours is rejected on its own field; splitting it at the cap succeeds', async () => {
    const m = await createTimerMachine(T0);
    try {
      const todo = await createTodo(m, 'Aufteilung');
      const context = ordinarySession(m.context);
      const started = await startTimer(context, todo, false);
      if (!started.ok || started.value.kind !== 'started') throw new Error('fixture');
      const entryId = started.value.started.id;

      // A zero-length active part (idle starts at the timer's own start) keeps this fixture
      // focused on the allocation limit rather than the active-part limit above.
      const windowEnd = plusSeconds(T0, ONE_DAY_SECONDS + 1);
      m.setClock(windowEnd);
      const begun = await beginIdle(context, { entryId, startedAt: T0, returnedAt: windowEnd });
      expect(begun.ok).toBe(true);

      const oneBigAllocation = await resolveIdle(context, {
        id: entryId, resume: false, allocations: [{ todoId: todo, seconds: ONE_DAY_SECONDS + 1, note: 'Zu lang' }],
      });
      expect(oneBigAllocation).toMatchObject({
        ok: false,
        error: { code: 'time_entry_too_long', details: [{ field: 'allocations.0.seconds' }] },
      });

      const split = await resolveIdle(context, {
        id: entryId, resume: false,
        allocations: [{ todoId: todo, seconds: ONE_DAY_SECONDS, note: 'Am Deckel' }, { todoId: null, seconds: 1, note: '' }],
      });
      expect(split).toMatchObject({ ok: true, value: { recordedSeconds: ONE_DAY_SECONDS, breakSeconds: 1 } });
    } finally {
      m.database.close();
    }
  });
});

async function setupMinimal(): Promise<{ readonly database: ReturnType<typeof openDatabase>; readonly context: AppContext }> {
  const database = openDatabase({ location: ':memory:', now: () => T0 });
  await database.migrations.migrateToLatest();
  return {
    database,
    context: {
      transactions: database.transactions,
      clock: { now: () => T0 },
      system: { windowsUser: () => 'Importprüfung' },
    } as unknown as AppContext,
  };
}

describe('A-28.6 — foreign import counts entries it refuses (rejectedTimeEntries)', () => {
  it('a day over 24 hours is rejected and counted, a day at exactly 24 hours is kept', async () => {
    const { database, context } = await setupMinimal();
    try {
      const backup = {
        project: { entities: {} },
        task: { entities: {
          t: {
            id: 't', title: 'Lange Tage',
            timeSpentOnDay: { '2026-09-06': (ONE_DAY_SECONDS + 1) * 1000, '2026-09-07': ONE_DAY_SECONDS * 1000 },
          },
        } },
      };
      const result = await importSuperProductivity(context, backup);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.rejectedTimeEntries).toBe(1);
      expect(result.value.timeEntries).toBe(1);
      expect(result.value.warnings.join(' ')).toContain('länger als 24 Stunden');
    } finally {
      database.close();
    }
  });
});

describe("A-28.6 — a SuperTakt's own archive keeps a long entry unchanged and warns instead of rejecting", () => {
  it('a 25-hour entry survives the round trip on another computer, with a warning naming it', async () => {
    const source = await setupMinimal();
    const longId = 'own-long-0001' as TimeEntryId;
    let archive;
    try {
      const todo = await source.database.transactions.inTransaction((unit) =>
        unit.todos.create({ title: 'Eigenes Archiv', callNumber: null, statusId: null, tagIds: [], note: '', now: T0 }, []),
      );
      await source.database.transactions.inTransaction(async (unit) => {
        const tables = await unit.dataArchive.readAll();
        await unit.dataArchive.replaceAll({
          ...tables,
          time_entry: [
            ...tables.time_entry,
            {
              id: longId, todo_id: todo.id, started_at: T0, ended_at: plusSeconds(T0, ONE_DAY_SECONDS + 3600),
              note: 'Lange Buchung', export_status: 'open', export_count: 0, source: 'manual',
              created_at: T0, updated_at: T0,
            },
          ],
        });
      });
      archive = await exportDataArchive(source.context);
    } finally {
      source.database.close();
    }

    const target = await setupMinimal();
    try {
      const imported = await importDataArchive(target.context, archive);
      expect(imported.ok).toBe(true);
      if (!imported.ok) return;
      expect(imported.value.warnings.join(' ')).toContain('länger als 24 Stunden');

      await target.database.transactions.inTransaction(async (unit) => {
        const entry = await unit.timeEntries.load(longId);
        expect(entry?.durationSeconds).toBe(ONE_DAY_SECONDS + 3600);
      });
    } finally {
      target.database.close();
    }
  });
});
