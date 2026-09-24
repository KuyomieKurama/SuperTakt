/**
 * Takt — `findMatches`, the add-in's duplicate offer (A-10.9, A-10.11, E-120, E-125 point 1).
 *
 * This file replaces the earlier version built for T-111, which measured both `findMatches` and
 * `bookOnTodo` and asserted that a match carried `poolMovement` in the same shape as the timer
 * routes. Since the add-in booking rollback (T-389, E-120, A-10.12, A-10.16) `bookOnTodo` is
 * gone: the add-in books no time and clears no "done" flag. Since T-398 (E-125 point 1) a match
 * carries no `poolMovement` either — the add-in resolves no rule anymore, so the field described
 * a movement that no longer exists.
 *
 * `AddinUnit` is narrower for the same reason: `todos` has no `clearDone`, `timeEntries` has no
 * `create`, `pools` has no `resolveAxes` (structural proof of A-10.12/E-125 point 1 — see the
 * second `describe` block below). What this file measures now is the absence of the removed
 * fields, named explicitly, instead of a shape that used to include them.
 *
 * The T-090 axis guard that used to live in `describe('findMatches — poolMovement …')`'s
 * neighbourhood moved to `packages/domain/test/pool-rule-axes.test.ts` (T-398 open question 1):
 * it is a pure domain fact and had no reader left in this narrower `AddinUnit`.
 */
import { describe, expect, it } from 'vitest';
import type { StatusId, TagId, Timestamp, Todo, TodoId } from '@takt/domain';
import type { AddinDeps, AddinUnit } from '../../../src/routes/addin/ports.ts';
import { findMatches } from '../../../src/routes/addin/service.ts';

const todoId = (value: string) => value as unknown as TodoId;
const tagId = (value: string) => value as unknown as TagId;
const statusId = (value: string) => value as unknown as StatusId;
const timestamp = (value: string) => value as unknown as Timestamp;

const NOW = timestamp('2026-08-31T09:00:00Z');
// Invented, as CLAUDE.md requires — never a real call number.
const CALL_NUMBER = 'TCK-4711';

const baseTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: todoId('todo-1'),
  title: 'Test todo from the add-in',
  callNumber: CALL_NUMBER,
  statusId: statusId('status-1'),
  completedAt: null,
  dueDate: null,
  tagIds: [tagId('irrelevant')],
  createdAt: timestamp('2026-08-31T07:00:00Z'),
  updatedAt: timestamp('2026-08-31T07:00:00Z'),
  ...overrides,
});

/** Seconds per todo, exactly what `TimeEntryPort.sumSeconds` answers for a given filter. */
interface Presence {
  readonly open: number;
  readonly exported: number;
}

function fakeTimeEntries(presence: Presence): AddinUnit['timeEntries'] {
  return {
    async sumSeconds(filter) {
      return filter.exportStatus === 'open' ? presence.open : presence.exported;
    },
  };
}

/** `findMatches` never touches email attachments; a call here is a test-setup bug. */
const unexpectedEmailAttachments: AddinDeps['emailAttachments'] = async () => {
  throw new Error('not expected — findMatches never runs an attachment intake');
};

function buildDeps(unit: {
  todos: Pick<AddinUnit['todos'], 'findByCallNumber'>;
  timeEntries: AddinUnit['timeEntries'];
}): AddinDeps {
  return {
    inTransaction: (work) => work(unit as unknown as AddinUnit),
    now: () => NOW,
    emailAttachments: unexpectedEmailAttachments,
  };
}

describe('findMatches — duplicate offer without booking and without poolMovement (E-120, E-125 point 1)', () => {
  it('an implausible value is never searched — no port is touched (R-15)', async () => {
    const deps = buildDeps({
      todos: {
        async findByCallNumber() {
          throw new Error('not expected — no search for an implausible input');
        },
      },
      timeEntries: {
        async sumSeconds() {
          throw new Error('not expected');
        },
      },
    });

    const result = await findMatches(deps, '   ');

    expect(result.kind).toBe('not_searched');
  });

  it('a plausible call number with no matching todo: searched, but empty', async () => {
    const deps = buildDeps({
      todos: {
        async findByCallNumber() {
          return [];
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
    });

    const result = await findMatches(deps, CALL_NUMBER);

    expect(result.kind).toBe('searched');
    if (result.kind !== 'searched') return;
    expect(result.callNumber).toBe(CALL_NUMBER);
    expect(result.matches).toEqual([]);
  });

  it('a match carries title, status, tags and the open/exported split (A-10.11)', async () => {
    const todo = baseTodo({ completedAt: null });
    const deps = buildDeps({
      todos: {
        async findByCallNumber() {
          return [todo];
        },
      },
      timeEntries: fakeTimeEntries({ open: 600, exported: 300 }),
    });

    const result = await findMatches(deps, CALL_NUMBER);

    expect(result.kind).toBe('searched');
    if (result.kind !== 'searched') return;
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]).toEqual({
      id: todo.id,
      title: todo.title,
      callNumber: todo.callNumber,
      statusId: todo.statusId,
      tagIds: todo.tagIds,
      completedAt: null,
      openSeconds: 600,
      exportedSeconds: 300,
    });
  });

  it('a completed todo is marked as such — completedAt is not null (A-10.11)', async () => {
    const doneAt = timestamp('2026-08-31T08:30:00Z');
    const todo = baseTodo({ completedAt: doneAt });
    const deps = buildDeps({
      todos: {
        async findByCallNumber() {
          return [todo];
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
    });

    const result = await findMatches(deps, CALL_NUMBER);

    expect(result.kind).toBe('searched');
    if (result.kind !== 'searched') return;
    expect(result.matches[0]?.completedAt).toBe(doneAt);
  });

  it('several todos sharing the call number all come back, in the order the port returned them', async () => {
    const first = baseTodo({ id: todoId('todo-1'), title: 'First' });
    const second = baseTodo({ id: todoId('todo-2'), title: 'Second' });
    const deps = buildDeps({
      todos: {
        async findByCallNumber() {
          return [first, second];
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
    });

    const result = await findMatches(deps, CALL_NUMBER);

    expect(result.kind).toBe('searched');
    if (result.kind !== 'searched') return;
    expect(result.matches.map((match) => match.title)).toEqual(['First', 'Second']);
  });

  it('a match carries exactly these eight keys — no poolMovement, no booking fields (E-125 point 1, E-120)', async () => {
    const todo = baseTodo();
    const deps = buildDeps({
      todos: {
        async findByCallNumber() {
          return [todo];
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
    });

    const result = await findMatches(deps, CALL_NUMBER);

    expect(result.kind).toBe('searched');
    if (result.kind !== 'searched') return;
    const match = result.matches[0];
    expect(match).toBeDefined();
    expect(Object.keys(match ?? {}).sort()).toEqual(
      [
        'callNumber',
        'completedAt',
        'exportedSeconds',
        'id',
        'openSeconds',
        'statusId',
        'tagIds',
        'title',
      ].sort(),
    );
    // The absence itself, named rather than assumed: the old response shape (T-104) carried
    // `poolMovement`, and before that three separate name lists.
    expect(match).not.toHaveProperty('poolMovement');
    expect(match).not.toHaveProperty('poolNames');
    expect(match).not.toHaveProperty('enteringPoolNames');
    expect(match).not.toHaveProperty('leavingPoolNames');
  });
});

describe('AddinUnit is structurally narrower since E-120/A-10.12 and E-125 point 1', () => {
  /**
   * These three cases assert nothing at runtime beyond `Object.keys` — the real assertion is
   * that `tsc` accepts the object literal as `AddinUnit['todos']` / `['timeEntries']` /
   * `['pools']` at all. If a future change reintroduces `clearDone`, `timeEntries.create` or
   * `pools.resolveAxes` as a *required* member, this file still compiles (Pick is additive-safe
   * the other way), but the corresponding gap in `apps/local-api/src/routes/addin/service.ts`
   * (no call to any of them) is what `findMatches — …` above exercises through behaviour.
   */
  it('AddinUnit.todos accepts an implementation without clearDone (A-10.12: the add-in clears no "done" flag)', () => {
    const todos: AddinUnit['todos'] = {
      async load() {
        return null;
      },
      async findByCallNumber() {
        return [];
      },
      async create() {
        throw new Error('not expected in this guard');
      },
    };

    expect(Object.keys(todos).sort()).toEqual(['create', 'findByCallNumber', 'load']);
  });

  it('AddinUnit.timeEntries accepts an implementation without create (E-120: the add-in books no time)', () => {
    const timeEntries: AddinUnit['timeEntries'] = {
      async sumSeconds() {
        return 0;
      },
    };

    expect(Object.keys(timeEntries)).toEqual(['sumSeconds']);
  });

  it('AddinUnit.pools accepts an implementation without resolveAxes (E-125 point 1: a match resolves no rule)', () => {
    const pools: AddinUnit['pools'] = {
      async list() {
        return [];
      },
    };

    expect(Object.keys(pools)).toEqual(['list']);
  });
});
