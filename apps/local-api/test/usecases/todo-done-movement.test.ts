/**
 * Takt — T-105, `markTodoDone` / `clearTodoDone` (E-060, Auftrag aus
 * `reports/T-101-domain-dev.md` "Nächster Schritt" 2a).
 *
 * Beide Anwendungsfälle rufen intern dieselbe private Funktion
 * `switchTodoDone` — sie ist nicht exportiert, deshalb wird hier ausschließlich
 * über die beiden öffentlichen Einstiege geprüft, genau wie ein echter
 * Aufrufer (die Route) es täte.
 *
 * `switchTodoDone` liest ein Todo, schreibt das Erledigt-Kennzeichen, liest
 * die Buchungslage und löst — nur wenn sich das Kennzeichen wirklich geändert
 * hat — alle Regeln über eine Attrappe von `PoolPort` auf (dieselbe Bauart
 * wie in `pool-movement.test.ts`). Eine echte Datenbank ist dafür nicht
 * nötig: `AppContext.transactions.inTransaction` ist eine Funktion, die einen
 * `UnitOfWork` entgegennimmt, und diese Datei liefert eine Attrappe, die
 * genau die drei Ports trägt, die `switchTodoDone`/`poolMovementNamer`
 * tatsächlich lesen (`todos`, `timeEntries`, `pools`) — der Rest von
 * `UnitOfWork` wird nicht gebraucht und deshalb weggelassen (Cast auf
 * `UnitOfWork`, wie bei `db.unit.tags.remove('unbekannt' as never)` an
 * anderer Stelle im Projekt üblich).
 *
 * Geprüft wird genau das, was T-101 als offene Ecke benennt:
 *
 *  - Setzen UND Aufheben liefern eine echte Bewegung, wenn sich das
 *    Kennzeichen ändert (E-060 Punkt 1).
 *  - Ein zweiter Aufruf ohne Wirkung (schon erledigt / schon offen) liefert
 *    `poolMovement: null` — UND löst keine einzige Regel auf (die Attrappe
 *    zählt ihre Aufrufe mit, exakt wie der Kommentar an `switchTodoDone` es
 *    behauptet: „es wird auch keine einzige Regel aufgelöst").
 *
 * Die Reihenfolge PUT → PUT → DELETE → DELETE bildet genau das
 * Wegwerfskript nach, mit dem domain-dev das Verhalten im Bericht
 * T-101-domain-dev.md gemessen hat:
 *
 *     PUT  #1   200 {"appears":["Erledigt"],"enters":["Erledigt"],"leaves":["Offen"]}
 *     PUT  #2   200 null
 *     DEL  #1   200 {"appears":["Offen"],"enters":["Offen"],"leaves":["Erledigt"]}
 *     DEL  #2   200 null
 */
import { describe, expect, it } from 'vitest';
import type {
  Pool,
  PoolCompletionFilter,
  PoolId,
  PoolSurface,
  StatusId,
  TagId,
  Timestamp,
  Todo,
  TodoId,
} from '@takt/domain';
import { ok } from '@takt/domain';
import type { PoolAxesResolution, PoolPort, UnitOfWork } from '@takt/storage';
import type { AppContext } from '../../src/usecases/context.ts';
import { clearTodoDone, markTodoDone } from '../../src/usecases/todos.ts';
import type { BookingPresenceBefore } from '../../src/usecases/pool-movement.ts';

const todoId = (value: string) => value as unknown as TodoId;
const poolId = (value: string) => value as unknown as PoolId;
const tagId = (value: string) => value as unknown as TagId;
const statusId = (value: string) => value as unknown as StatusId;
const timestamp = (value: string) => value as unknown as Timestamp;

const TODO_ID = todoId('todo-1');
const NOW = timestamp('2026-08-31T09:00:00Z');

/** Die Attrappe hat nur einen Tag zur Verfügung — die Pools unten filtern nicht danach. */
const noAxes: PoolAxesResolution = {
  required: { tagIds: [], emptyFolderIds: [] },
  excluded: { tagIds: [], emptyFolderIds: [] },
};

interface PoolFixture {
  readonly id: PoolId;
  readonly name: string;
  readonly completion: PoolCompletionFilter;
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
    exportState: 'any',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

/**
 * Zwei Pools, die AUSSCHLIESSLICH über die Erledigt-Achse entscheiden — die
 * Achse, um die es in dieser Datei geht (E-060). Kein Tagterm, kein Status:
 * eine Regel, die nur die Erledigt-Achse setzt, ist nicht leer (E-055 zählt
 * die Achse als eigene Bedingung).
 */
const POOL_FIXTURES: readonly PoolFixture[] = [
  { id: poolId('pool-erledigt'), name: 'Erledigt', completion: 'done' },
  { id: poolId('pool-offen'), name: 'Offen', completion: 'open' },
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

/**
 * Ein Todo mit veränderlichem Erledigt-Kennzeichen — Zeichen für Zeichen die
 * Fassung, die `TodoPort.markDone`/`clearDone` wirklich zusagen
 * (`repo-todos.ts`): `markDone` schreibt nur, wenn `completed_at IS NULL`
 * (ein bereits erledigtes Todo bleibt bei seinem ALTEN Zeitstempel), `clearDone`
 * setzt unbedingt auf `null`.
 */
function fakeTodos(initial: Todo) {
  let current = initial;
  const port: Pick<UnitOfWork['todos'], 'load' | 'markDone' | 'clearDone'> = {
    async load(id) {
      return id === current.id ? current : null;
    },
    async markDone(id, now) {
      if (id !== current.id) throw new Error('Attrappe: unbekanntes Todo');
      if (current.completedAt === null) current = { ...current, completedAt: now, updatedAt: now };
      return ok(current);
    },
    async clearDone(id, now) {
      if (id !== current.id) throw new Error('Attrappe: unbekanntes Todo');
      current = { ...current, completedAt: null, updatedAt: now };
      return ok(current);
    },
  };
  return { port, getCurrent: () => current };
}

function fakeTimeEntries(presence: BookingPresenceBefore): Pick<UnitOfWork['timeEntries'], 'exportPresence'> {
  return {
    async exportPresence(ids) {
      const map = new Map<TodoId, BookingPresenceBefore>();
      for (const id of ids) map.set(id, presence);
      return map;
    },
  };
}

function buildContext(unit: {
  todos: Pick<UnitOfWork['todos'], 'load' | 'markDone' | 'clearDone'>;
  timeEntries: Pick<UnitOfWork['timeEntries'], 'exportPresence'>;
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
  tagIds: [tagId('irrelevant')],
  createdAt: timestamp('2026-08-31T07:00:00Z'),
  updatedAt: timestamp('2026-08-31T07:00:00Z'),
});

describe('markTodoDone (PUT /todos/{id}/done) — poolMovement bei Setzen, null bei unverändertem Kennzeichen (E-060)', () => {
  it('ein aktives Todo: completedAt wird gesetzt, poolMovement nennt "Erledigt" als neu und "Offen" als verlassen', async () => {
    const { port: todos, getCurrent } = fakeTodos(baseTodo(null));
    const timeEntries = fakeTimeEntries({ hasOpen: false, hasExported: false });
    const { pools, calls } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const result = await markTodoDone(context, TODO_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.todo.completedAt).toBe(NOW);
    expect(getCurrent().completedAt).toBe(NOW);
    expect(result.value.poolMovement).not.toBeNull();
    expect(result.value.poolMovement).toEqual({
      appears: ['Erledigt'],
      enters: ['Erledigt'],
      leaves: ['Offen'],
    });
    // list('all') — auch reine Board-Spalten (E-058 Absatz 1, hier nicht der
    // Kern des Tests, aber eine Regression an dieser Stelle wäre teuer genug,
    // um sie mitzunehmen).
    expect(calls).toEqual(['all']);
  });

  it('zweimal "erledigt" hintereinander: der ZWEITE Aufruf liefert poolMovement: null und löst KEINE Regel auf', async () => {
    const { port: todos } = fakeTodos(baseTodo(null));
    const timeEntries = fakeTimeEntries({ hasOpen: false, hasExported: false });
    const { pools, calls } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const first = await markTodoDone(context, TODO_ID);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.poolMovement).not.toBeNull();
    expect(calls).toEqual(['all']); // genau einmal aufgelöst

    const second = await markTodoDone(context, TODO_ID);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.poolMovement).toBeNull();
    // Der entscheidende Teil des Vertrags: der zweite Aufruf hat KEINE
    // weitere Regel aufgelöst — `calls` ist unverändert bei genau einem
    // Eintrag, nicht zwei.
    expect(calls).toEqual(['all']);
  });
});

describe('clearTodoDone (DELETE /todos/{id}/done) — die umgekehrte Bewegung, null bei unverändertem Kennzeichen', () => {
  it('ein erledigtes Todo: completedAt fällt auf null, poolMovement nennt "Offen" als neu und "Erledigt" als verlassen', async () => {
    const doneAt = timestamp('2026-08-31T08:30:00Z');
    const { port: todos, getCurrent } = fakeTodos(baseTodo(doneAt));
    const timeEntries = fakeTimeEntries({ hasOpen: false, hasExported: false });
    const { pools, calls } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const result = await clearTodoDone(context, TODO_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.todo.completedAt).toBeNull();
    expect(getCurrent().completedAt).toBeNull();
    expect(result.value.poolMovement).toEqual({
      appears: ['Offen'],
      enters: ['Offen'],
      leaves: ['Erledigt'],
    });
    expect(calls).toEqual(['all']);
  });

  it('ein bereits aktives Todo: clearTodoDone liefert poolMovement: null (keine Bewegung, weil sich nichts geändert hat)', async () => {
    const { port: todos } = fakeTodos(baseTodo(null));
    const timeEntries = fakeTimeEntries({ hasOpen: false, hasExported: false });
    const { pools, calls } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const result = await clearTodoDone(context, TODO_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.poolMovement).toBeNull();
    expect(calls).toEqual([]); // keine einzige Regel wurde aufgelöst
  });

  it('die volle Reihenfolge aus dem Wegwerfskript in T-101-domain-dev.md: PUT, PUT, DELETE, DELETE', async () => {
    const { port: todos } = fakeTodos(baseTodo(null));
    const timeEntries = fakeTimeEntries({ hasOpen: false, hasExported: false });
    const { pools } = fakePools();
    const context = buildContext({ todos, timeEntries, pools });

    const put1 = await markTodoDone(context, TODO_ID);
    const put2 = await markTodoDone(context, TODO_ID);
    const del1 = await clearTodoDone(context, TODO_ID);
    const del2 = await clearTodoDone(context, TODO_ID);

    expect(put1.ok && put1.value.poolMovement).toEqual({
      appears: ['Erledigt'],
      enters: ['Erledigt'],
      leaves: ['Offen'],
    });
    expect(put2.ok && put2.value.poolMovement).toBeNull();
    expect(del1.ok && del1.value.poolMovement).toEqual({
      appears: ['Offen'],
      enters: ['Offen'],
      leaves: ['Erledigt'],
    });
    expect(del2.ok && del2.value.poolMovement).toBeNull();
  });
});
