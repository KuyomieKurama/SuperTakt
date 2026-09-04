/**
 * Takt — T-111, `findMatches`/`bookOnTodo` und `poolMovement` (E-061 Punkt 3,
 * Vorschlag aus `reports/T-104-integration-dev.md` "Nächster Schritt" 1 /
 * `reports/T-105-unit-tester.md` "Nächster Schritt" 2: "Sobald die Add-in-
 * Routen auf `bookingMovementStates(todo, {hasOpen, hasExported})` umgestellt
 * sind, wäre ein Attrappen-Test nach demselben Muster wie
 * `todo-done-movement.test.ts` denkbar").
 *
 * Seit T-104 liefern beide Add-in-Routen `poolMovement` in DERSELBEN Form wie
 * jede Timer-Route (`{ appears, enters, leaves } | null`) statt der drei
 * Namenslisten `poolNames`/`enteringPoolNames`/`leavingPoolNames` von vorher
 * (E-061 Punkt 3). Diese Datei war bislang die einzige Lücke: kein
 * Einheitentest unter `apps/local-api/test/**` deckte `findMatches` oder
 * `bookOnTodo` ab (T-105 Annahme 6, T-104 "Kein Einheitentest ... ist
 * betroffen").
 *
 * Attrappe für `AddinDeps`/`AddinUnit` nach demselben Muster wie
 * `todo-done-movement.test.ts` und `time-entry-movement.test.ts`: nur die
 * Ports, die `findMatches`/`bookOnTodo` und `poolMovementNamer` tatsächlich
 * lesen.
 *
 * Geprüft wird genau das, was der Auftrag zu T-111 benennt:
 *
 *  1. `findMatches` und die Buchungsroute (`bookOnTodo`) liefern
 *     `poolMovement` in derselben Gestalt wie die Timer-Routen — ein Feld,
 *     `{ appears, enters, leaves } | null`, KEINE der drei alten Listen.
 *  2. `null`, wenn das Todo offen ist und schon eine offene Buchung hat
 *     (TP-EXPST-12a) — UND ohne eine einzige Regel aufzulösen.
 *  3. Drei leere Listen, wenn nachgesehen und nichts gefunden wurde — das
 *     "Kein Treffer"-Todo aus TP-EXPST-12 ist erledigt (`docs/testplan.md`
 *     Zeile 2351: "ein Treffer, der keine Regel trifft, aber noch bewegt
 *     werden könnte ... bekommt weiterhin `{ appears: [], enters: [],
 *     leaves: [] }`").
 *  4. Keine Reste `poolNames`/`enteringPoolNames`/`leavingPoolNames` in der
 *     Antwort — ein Schlüsselvergleich, dieselbe Wache wie in
 *     `apps/outlook-addin/scripts/proof-addin.mjs` (T-104).
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
import type { AddinDeps, AddinUnit } from '../../../src/routes/addin/ports.ts';
import { bookOnTodo, findMatches } from '../../../src/routes/addin/service.ts';

const todoId = (value: string) => value as unknown as TodoId;
const poolId = (value: string) => value as unknown as PoolId;
const tagId = (value: string) => value as unknown as TagId;
const statusId = (value: string) => value as unknown as StatusId;
const timestamp = (value: string) => value as unknown as Timestamp;
const timeEntryId = (value: string) => value as unknown as TimeEntryId;

const NOW = timestamp('2026-08-31T09:00:00Z');
const STARTED_AT = timestamp('2026-08-31T08:00:00Z');
const ENDED_AT = timestamp('2026-08-31T08:15:00Z');
// Erfunden, wie in `CLAUDE.md` verlangt — keine echte Call-Nummer.
const CALL_NUMBER = 'TCK-4711';

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

/** Eine Regel, die ausschließlich nach dem Exportstatus fragt — dieselbe Achse, die eine Buchung tatsächlich bewegt. */
const POOL_ABRECHNUNG: PoolFixture = {
  id: poolId('pool-abrechnung'),
  name: 'Abrechnung',
  completion: 'any',
  exportState: 'open',
};

function fakePools(fixtures: readonly PoolFixture[]) {
  const calls: (PoolSurface | 'all' | undefined)[] = [];
  const pools: AddinUnit['pools'] = {
    async list(shownOn) {
      calls.push(shownOn);
      return fixtures.map(makePool);
    },
    async resolveAxes() {
      return {
        required: { tagIds: [], emptyFolderIds: [] },
        excluded: { tagIds: [], emptyFolderIds: [] },
      };
    },
  };
  return { pools, calls };
}

const baseTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: todoId('todo-1'),
  title: 'Testtodo aus dem Add-in',
  callNumber: CALL_NUMBER,
  statusId: statusId('status-1'),
  completedAt: null,
  tagIds: [tagId('irrelevant')],
  createdAt: timestamp('2026-08-31T07:00:00Z'),
  updatedAt: timestamp('2026-08-31T07:00:00Z'),
  ...overrides,
});

/** Sekunden je Todo, wie `TimeEntryPort.sumSeconds` sie je Filter beantwortet. */
interface Presence {
  readonly open: number;
  readonly exported: number;
}

function fakeTimeEntries(presence: Presence): AddinUnit['timeEntries'] {
  return {
    async sumSeconds(filter) {
      return filter.exportStatus === 'open' ? presence.open : presence.exported;
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

function buildDeps(unit: {
  todos: Pick<AddinUnit['todos'], 'load' | 'findByCallNumber' | 'clearDone'>;
  timeEntries: AddinUnit['timeEntries'];
  pools: AddinUnit['pools'];
}): AddinDeps {
  return {
    inTransaction: (work) => work(unit as unknown as AddinUnit),
    now: () => NOW,
  };
}

describe('findMatches — poolMovement in derselben Form wie die Timer-Routen (E-061 Punkt 3, T-104)', () => {
  it('offenes Todo MIT bestehender offener Buchung: poolMovement ist null, ohne eine einzige Regel aufzulösen (TP-EXPST-12a)', async () => {
    const todo = baseTodo({ completedAt: null });
    const { pools, calls } = fakePools([POOL_ABRECHNUNG]);
    const deps = buildDeps({
      todos: {
        async load() {
          return todo;
        },
        async findByCallNumber() {
          return [todo];
        },
        async clearDone() {
          throw new Error('nicht erwartet');
        },
      },
      timeEntries: fakeTimeEntries({ open: 600, exported: 0 }),
      pools,
    });

    const result = await findMatches(deps, CALL_NUMBER);

    expect(result.kind).toBe('searched');
    if (result.kind !== 'searched') return;
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.poolMovement).toBeNull();
    // Die ganze Sparsamkeit aus `bookingMovement`: Wo nichts zu rechnen ist,
    // wird auch keine Regel aufgelöst (`unit.pools.list` bleibt ungerufen).
    expect(calls).toEqual([]);
  });

  it('erledigtes Todo OHNE jeden Treffer: poolMovement ist drei leere Listen, NICHT null (TP-EXPST-12, "Kein Treffer")', async () => {
    const doneAt = timestamp('2026-08-31T08:30:00Z');
    const todo = baseTodo({ completedAt: doneAt });
    // Keine Regel, die auf dieses Todo passt: leere Poolliste genügt, um
    // "nachgesehen und nichts gefunden" nachzubilden.
    const { pools, calls } = fakePools([]);
    const deps = buildDeps({
      todos: {
        async load() {
          return todo;
        },
        async findByCallNumber() {
          return [todo];
        },
        async clearDone() {
          throw new Error('nicht erwartet');
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
      pools,
    });

    const result = await findMatches(deps, CALL_NUMBER);

    expect(result.kind).toBe('searched');
    if (result.kind !== 'searched') return;
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.poolMovement).toEqual({ appears: [], enters: [], leaves: [] });
    expect(result.matches[0]?.poolMovement).not.toBeNull();
    // Hier WIRD gerechnet — anders als im Fall darüber.
    expect(calls).toEqual(['all']);
  });

  it('ein Treffer trägt genau die Schlüssel der neuen Form — keine Reste poolNames/enteringPoolNames/leavingPoolNames', async () => {
    const todo = baseTodo({ completedAt: null });
    const { pools } = fakePools([POOL_ABRECHNUNG]);
    const deps = buildDeps({
      todos: {
        async load() {
          return todo;
        },
        async findByCallNumber() {
          return [todo];
        },
        async clearDone() {
          throw new Error('nicht erwartet');
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
      pools,
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
        'poolMovement',
        'statusId',
        'tagIds',
        'title',
      ].sort(),
    );
    expect(match?.poolMovement).not.toBeNull();
    expect(Object.keys(match?.poolMovement ?? {}).sort()).toEqual(['appears', 'enters', 'leaves']);
  });
});

describe('bookOnTodo — poolMovement in derselben Form wie die Timer-Routen (E-061 Punkt 3, T-104)', () => {
  it('offenes Todo OHNE Buchung: die erste Buchung bewegt es in "Abrechnung" (exportState: open)', async () => {
    const todo = baseTodo({ completedAt: null });
    const { pools } = fakePools([POOL_ABRECHNUNG]);
    const deps = buildDeps({
      todos: {
        async load() {
          return todo;
        },
        async findByCallNumber() {
          return [todo];
        },
        async clearDone() {
          throw new Error('nicht erwartet — das Todo ist nicht erledigt');
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
      pools,
    });

    const result = await bookOnTodo(deps, {
      todoId: todo.id,
      startedAt: STARTED_AT,
      endedAt: ENDED_AT,
      note: 'Aus dem Add-in gebucht',
    });

    expect(result.kind).toBe('booked');
    if (result.kind !== 'booked') return;
    expect(result.poolMovement).toEqual({ appears: ['Abrechnung'], enters: ['Abrechnung'], leaves: [] });
    expect(result.todoWasDone).toBe(false);
    expect(result.doneCleared).toBe(false);
  });

  it('offenes Todo MIT bestehender offener Buchung: poolMovement ist null, ohne eine einzige Regel aufzulösen', async () => {
    const todo = baseTodo({ completedAt: null });
    const { pools, calls } = fakePools([POOL_ABRECHNUNG]);
    const deps = buildDeps({
      todos: {
        async load() {
          return todo;
        },
        async findByCallNumber() {
          return [todo];
        },
        async clearDone() {
          throw new Error('nicht erwartet');
        },
      },
      timeEntries: fakeTimeEntries({ open: 600, exported: 0 }),
      pools,
    });

    const result = await bookOnTodo(deps, {
      todoId: todo.id,
      startedAt: STARTED_AT,
      endedAt: ENDED_AT,
      note: 'Zweite Buchung aus dem Add-in',
    });

    expect(result.kind).toBe('booked');
    if (result.kind !== 'booked') return;
    expect(result.poolMovement).toBeNull();
    expect(calls).toEqual([]);
  });

  it('die Buchungsantwort trägt genau die Schlüssel der neuen Form — keine Reste poolNames/enteringPoolNames/leavingPoolNames', async () => {
    const todo = baseTodo({ completedAt: null });
    const { pools } = fakePools([POOL_ABRECHNUNG]);
    const deps = buildDeps({
      todos: {
        async load() {
          return todo;
        },
        async findByCallNumber() {
          return [todo];
        },
        async clearDone() {
          throw new Error('nicht erwartet');
        },
      },
      timeEntries: fakeTimeEntries({ open: 0, exported: 0 }),
      pools,
    });

    const result = await bookOnTodo(deps, {
      todoId: todo.id,
      startedAt: STARTED_AT,
      endedAt: ENDED_AT,
      note: 'Aus dem Add-in gebucht',
    });

    expect(result.kind).toBe('booked');
    if (result.kind !== 'booked') return;
    expect(Object.keys(result).sort()).toEqual(
      ['doneCleared', 'kind', 'poolMovement', 'timeEntry', 'todoWasDone'].sort(),
    );
    expect(result.poolMovement).not.toBeNull();
    expect(Object.keys(result.poolMovement ?? {}).sort()).toEqual(['appears', 'enters', 'leaves']);
  });
});
