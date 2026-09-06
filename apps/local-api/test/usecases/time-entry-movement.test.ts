/**
 * Takt — T-111, `createTimeEntry` und `poolMovement` (E-061 Nachtrag, O-V).
 *
 * `POST /time-entries` — die Buchung von Hand — kann die ERSTE abgeschlossene
 * Buchung eines Todos sein und damit `hasOpenEntries` von falsch auf wahr
 * setzen; ein Todo ohne Buchung erscheint dann in jeder Spalte
 * `exportState: 'open'`. `createTimeEntry` (`apps/local-api/src/usecases/
 * timer.ts`) rechnet das über `movementOfBooking` — dieselbe Funktion, die
 * `POST /timer/stop` und `POST /timer/orphaned/resolve` benutzen — und damit
 * über {@link closedEntryMovementStates} (`ENTRY_CLOSED_EFFECT`), NICHT über
 * {@link bookingMovementStates} (`BOOKING_EFFECT`). Der Unterschied ist genau
 * eine Achse: `BOOKING_EFFECT` hebt zusätzlich "Erledigt" auf, was eine
 * Buchung von Hand nicht tut (A-2.5 — nur der Timerstart hebt "Erledigt" auf).
 * Domain-dev hat das im Bericht `T-107-domain-dev.md`, Offene Frage 1,
 * ausdrücklich so begründet, und der Orchestrator hat den widersprüchlichen
 * Nachtrag zu E-061 danach auf `closedEntryMovementStates` richtiggestellt
 * (`decisions.md`, Nachtrag zu E-061, letzter Satz).
 *
 * Diese Datei prüft `createTimeEntry` als Anwendungsfall (Verdrahtung), nicht
 * die reine Rechnung dahinter — die ist bereits in
 * `pool-movement-states.test.ts` (T-105) gegen `bookingMovementStates`
 * abgegrenzt. Attrappe für `AppContext`/`UnitOfWork` nach demselben Muster wie
 * `todo-done-movement.test.ts`: nur die Ports, die `createTimeEntry` und
 * `poolMovementNamer` tatsächlich lesen (`todos.load`, `timeEntries.
 * exportPresence`+`create`, `pools.list`+`resolveAxes`).
 */
import { describe, expect, it } from 'vitest';
import type {
  Pool,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolId,
  PoolSurface,
  StatusId,
  TagId,
  TimeEntryId,
  Timestamp,
  Todo,
  TodoId,
} from '@takt/domain';
import { ok } from '@takt/domain';
import type { PoolAxesResolution, PoolPort, UnitOfWork } from '@takt/storage';
import type { AppContext } from '../../src/usecases/context.ts';
import { createTimeEntry } from '../../src/usecases/timer.ts';
import type { BookingPresenceBefore } from '../../src/usecases/pool-movement.ts';

const todoId = (value: string) => value as unknown as TodoId;
const poolId = (value: string) => value as unknown as PoolId;
const tagId = (value: string) => value as unknown as TagId;
const statusId = (value: string) => value as unknown as StatusId;
const timestamp = (value: string) => value as unknown as Timestamp;
const timeEntryId = (value: string) => value as unknown as TimeEntryId;

const TODO_ID = todoId('todo-1');
const NOW = timestamp('2026-08-31T09:00:00Z');
const STARTED_AT = timestamp('2026-08-31T08:00:00Z');
const ENDED_AT = timestamp('2026-08-31T08:15:00Z');

const noAxes: PoolAxesResolution = {
  required: { tagIds: [], emptyFolderIds: [] },
  excluded: { tagIds: [], emptyFolderIds: [] },
};

interface PoolFixture {
  readonly id: PoolId;
  readonly name: string;
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
}

function makePool(fixture: PoolFixture): Pool {
  return {
    id: fixture.id,
    name: fixture.name,
    matchMode: 'any',
    includeSubfolders: false,
    placement: 'both',
    position: 0,
    rule: [],
    excludedTags: [],
    statusIds: [],
    completion: fixture.completion,
    exportState: fixture.exportState,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

/**
 * Zwei Regeln, die die beiden Achsen auseinanderhalten, um die es in dieser
 * Datei geht: "Abrechnung" fragt ausschließlich nach dem Exportstatus (die
 * Achse, die eine Buchung von Hand tatsächlich bewegt), "Erledigt" fragt
 * ausschließlich nach der Erledigt-Achse (die Achse, die A-2.5 dieser Route
 * ausdrücklich VERWEHRT).
 */
const POOL_FIXTURES: readonly PoolFixture[] = [
  { id: poolId('pool-abrechnung'), name: 'Abrechnung', completion: 'any', exportState: 'open' },
  { id: poolId('pool-erledigt'), name: 'Erledigt', completion: 'done', exportState: 'any' },
];

function fakePools(fixtures: readonly PoolFixture[] = POOL_FIXTURES) {
  const calls: (PoolSurface | 'all' | undefined)[] = [];
  const pools: Pick<PoolPort, 'list' | 'resolveAxes'> = {
    async list(shownOn) {
      calls.push(shownOn);
      return fixtures.map(makePool);
    },
    async resolveAxes() {
      return noAxes;
    },
  };
  return { pools, calls };
}

function fakeTodos(todo: Todo): Pick<UnitOfWork['todos'], 'load'> {
  return {
    async load(id) {
      return id === todo.id ? todo : null;
    },
  };
}

function fakeTimeEntries(
  presence: BookingPresenceBefore,
): Pick<UnitOfWork['timeEntries'], 'exportPresence' | 'create'> {
  const calls: TodoId[][] = [];
  return {
    async exportPresence(ids) {
      calls.push([...ids]);
      const map = new Map<TodoId, BookingPresenceBefore>();
      for (const id of ids) map.set(id, presence);
      return map;
    },
    async create(input, now) {
      return ok({
        id: timeEntryId('entry-1'),
        todoId: input.todoId,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        durationSeconds: 900,
        note: input.note,
        exportStatus: 'open',
        exportCount: 0,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      });
    },
  };
}

function buildContext(unit: {
  todos: Pick<UnitOfWork['todos'], 'load'>;
  timeEntries: Pick<UnitOfWork['timeEntries'], 'exportPresence' | 'create'>;
  pools: Pick<PoolPort, 'list' | 'resolveAxes'>;
}): AppContext {
  return {
    transactions: {
      async inTransaction(work: (unit: UnitOfWork) => Promise<unknown>) {
        return work(unit as unknown as UnitOfWork);
      },
    },
    clock: { now: () => NOW },
  } as unknown as AppContext;
}

const baseTodo = (completedAt: Timestamp | null): Todo => ({
  id: TODO_ID,
  title: 'Testtodo',
  callNumber: null,
  statusId: statusId('status-1'),
  completedAt,
  dueDate: null,
  tagIds: [tagId('irrelevant')],
  createdAt: timestamp('2026-08-31T07:00:00Z'),
  updatedAt: timestamp('2026-08-31T07:00:00Z'),
});

describe('createTimeEntry — poolMovement bei der ersten Buchung eines offenen Todos (E-061 Nachtrag, O-V)', () => {
  it('ein offenes Todo OHNE jede Buchung: die neue Buchung ist die erste, "Abrechnung" (exportState: open) erscheint als neu', async () => {
    const todos = fakeTodos(baseTodo(null));
    const timeEntries = fakeTimeEntries({ hasOpen: false, hasExported: false });
    const { pools, calls } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const result = await createTimeEntry(context, {
      todoId: TODO_ID,
      startedAt: STARTED_AT,
      endedAt: ENDED_AT,
      note: 'Nachtrag von Hand',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.poolMovement).not.toBeNull();
    expect(result.value.poolMovement).toEqual({
      appears: ['Abrechnung'],
      enters: ['Abrechnung'],
      leaves: [],
    });
    // list('all') — auch reine Board-Spalten (E-058 Absatz 1).
    expect(calls).toEqual(['all']);
  });

  it('ein offenes Todo MIT bestehender offener Buchung: poolMovement ist null — keine Bewegung möglich, und keine Regel wird aufgelöst', async () => {
    const todos = fakeTodos(baseTodo(null));
    const timeEntries = fakeTimeEntries({ hasOpen: true, hasExported: false });
    const { pools, calls } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const result = await createTimeEntry(context, {
      todoId: TODO_ID,
      startedAt: STARTED_AT,
      endedAt: ENDED_AT,
      note: 'Zweite Buchung',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.poolMovement).toBeNull();
    // `movementOfBooking` gibt frueh zurueck (presence.hasOpen), OHNE eine
    // einzige Regel aufzuloesen — dieselbe Sparsamkeit wie am Stopp.
    expect(calls).toEqual([]);
  });

  it('ein ERLEDIGTES Todo: "Erledigt" bleibt gesetzt (A-2.5) — kein Verlassen einer completion:"done"-Spalte, das ist der Unterschied zu bookingMovementStates', async () => {
    const doneAt = timestamp('2026-08-31T08:30:00Z');
    const todos = fakeTodos(baseTodo(doneAt));
    const timeEntries = fakeTimeEntries({ hasOpen: false, hasExported: false });
    const { pools } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const result = await createTimeEntry(context, {
      todoId: TODO_ID,
      startedAt: STARTED_AT,
      endedAt: ENDED_AT,
      note: 'Nachtrag auf ein erledigtes Todo',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.poolMovement).not.toBeNull();
    // "Erledigt" (completion: 'done') traf VOR der Buchung zu (Todo ist
    // erledigt) und trifft DANACH weiter zu — mit `bookingMovementStates`
    // stuende es faelschlich in `leaves`, weil BOOKING_EFFECT `completedAt`
    // auf `null` setzte. Mit der richtigen Rechnung (`closedEntryMovementStates`,
    // ENTRY_CLOSED_EFFECT) bleibt "Erledigt" unberuehrt: es steht weder in
    // `enters` noch in `leaves`, dafuer weiter in `appears`.
    expect(result.value.poolMovement).toEqual({
      appears: ['Abrechnung', 'Erledigt'],
      enters: ['Abrechnung'],
      leaves: [],
    });
    expect(result.value.poolMovement?.leaves).not.toContain('Erledigt');
  });

  it('das Anlegen schlaegt fehl: der Fehler geht unveraendert heraus, ohne dass eine Regel aufgeloest wird', async () => {
    const todos = fakeTodos(baseTodo(null));
    const { pools, calls } = fakePools();
    const failingTimeEntries: Pick<UnitOfWork['timeEntries'], 'exportPresence' | 'create'> = {
      async exportPresence(ids) {
        const map = new Map<TodoId, BookingPresenceBefore>();
        for (const id of ids) map.set(id, { hasOpen: false, hasExported: false });
        return map;
      },
      async create() {
        return { ok: false, error: { code: 'validation_error', message: 'ungueltiger Zeitraum' } };
      },
    };
    const context = buildContext({ todos, timeEntries: failingTimeEntries, pools });

    const result = await createTimeEntry(context, {
      todoId: TODO_ID,
      startedAt: ENDED_AT,
      endedAt: STARTED_AT,
      note: 'Zeitraum verkehrt herum',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation_error');
    expect(calls).toEqual([]);
  });
});
