/**
 * Takt — T-095, `poolMovementNamer` (E-058 Absatz 1, `usecases/pool-movement.ts`).
 *
 * `apps/local-api/src/usecases/pool-movement.ts` entstand in T-089 und hatte
 * bis hierher keinen eigenen Prüffall — nur die Messung am laufenden Dienst
 * (`proof:openapi` Abschnitt 15). Diese Datei prüft die Funktion **rein**,
 * gegen eine Attrappe von `Pick<PoolPort, 'list' | 'resolveAxes'>`, ohne
 * laufenden Dienst und ohne Datenbank — in Anlehnung an die Attrappe aus
 * `apps/outlook-addin/scripts/fixtures.mjs`, hier aber in TypeScript und
 * typgeprüft (die Testdatei liegt unter `apps/local-api/test/**`, meiner
 * Hoheit).
 *
 * Fünf Fälle aus dem Auftrag (T-095):
 *
 *   1. `list('all')` wird aufgerufen, und reine Board-Spalten (`placement:
 *      'board'`) zählen mit.
 *   2. Ein Pool steht nie zugleich in `enters` und `leaves`; `enters` ist eine
 *      Teilmenge von `appears`.
 *   3. Zwei Pools mit demselben Namen werden über ihre Regel unterschieden,
 *      nicht über den Namen.
 *   4. Eine leere Regel trifft nichts.
 *   5. Eine Regel über einen leeren Ordner trifft nichts (`unresolvedRequired`,
 *      E-057) — auch wenn ein Tagterm daneben Tags beisteuert.
 *
 * ---------------------------------------------------------------------------
 * Hinweis zum Rot-Zustand
 * ---------------------------------------------------------------------------
 *
 * `poolMovementNamer` existiert seit T-089 vollständig und unverändert; ein
 * Lauf dieser Datei gegen den Bestand ist von Anfang an grün. Wo das der Fall
 * ist, hält diese Datei — wie `board.test.ts` es vormacht
 * (`boardAppearancesCountingRuleTerms`) — an mindestens einer Stelle eine
 * bewusst falsche Vergleichsfassung dagegen, damit sichtbar bleibt, dass die
 * Prüfung tatsächlich unterscheidet und nicht nur zufällig zutrifft (Fall 1).
 */
import { describe, expect, it } from 'vitest';
import type {
  Pool,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolId,
  PoolPlacement,
  PoolSurface,
  PoolTagTerm,
  StatusId,
  TagFolderId,
  TagId,
  Timestamp,
} from '@takt/domain';
import { tagAxisIsUnresolved } from '@takt/domain';
import type { PoolAxesResolution, PoolPort } from '@takt/storage';
import { poolMovementNamer } from '../../src/usecases/pool-movement.ts';
import type { PoolMovementState } from '../../src/usecases/pool-movement.ts';

const NOW = '2026-08-31T08:00:00Z' as Timestamp;
const poolId = (value: string) => value as unknown as PoolId;
const tagId = (value: string) => value as unknown as TagId;
const folderId = (value: string) => value as unknown as TagFolderId;
const statusId = (value: string) => value as unknown as StatusId;

interface PoolFixture {
  readonly id: PoolId;
  readonly name: string;
  readonly position: number;
  readonly placement?: PoolPlacement;
  readonly rule?: readonly PoolTagTerm[];
  readonly completion?: PoolCompletionFilter;
  readonly exportState?: PoolExportFilter;
  /** Was `resolveAxes` für diesen Pool zurückgibt — erfundene Auflösung, keine echte. */
  readonly axes?: PoolAxesResolution;
}

const noAxes: PoolAxesResolution = {
  required: { tagIds: [], emptyFolderIds: [] },
  excluded: { tagIds: [], emptyFolderIds: [] },
};

function makePool(fixture: PoolFixture): Pool {
  return {
    id: fixture.id,
    name: fixture.name,
    matchMode: 'any',
    includeSubfolders: false,
    placement: fixture.placement ?? 'pool',
    position: fixture.position,
    rule: fixture.rule ?? [],
    excludedTags: [],
    statusIds: [],
    completion: fixture.completion ?? 'any',
    exportState: fixture.exportState ?? 'any',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

/**
 * Die Attrappe für `Pick<PoolPort, 'list' | 'resolveAxes'>` — Zeichen für
 * Zeichen der Ausschnitt, den `PoolMovementUnit.pools` verlangt.
 *
 * `list` filtert wie der echte Port nach `placement` (T-090 hat genau diese
 * Auswertung nachgerüstet, `apps/outlook-addin/scripts/fixtures.mjs`); ohne
 * Argument gilt `'pool'`. Das ist kein Zufall: Nur eine Attrappe, die die
 * Fläche wirklich auswertet, kann zeigen, dass `poolMovementNamer` mit
 * `'all'` fragt — eine Attrappe, die das Argument verschluckt, hätte densel-
 * ben Fehler durchgelassen, den R-1 Befund 3 in T-090 gefunden hat.
 */
function fakePools(fixtures: readonly PoolFixture[]) {
  const calls: (PoolSurface | 'all' | undefined)[] = [];
  const byId = new Map(fixtures.map((fixture) => [fixture.id, fixture]));

  const pools: Pick<PoolPort, 'list' | 'resolveAxes'> = {
    async list(shownOn?: PoolSurface | 'all') {
      calls.push(shownOn);
      if (shownOn === 'all') {
        return fixtures.map(makePool);
      }
      const surface = shownOn ?? 'pool';
      return fixtures
        .filter((fixture) => {
          const placement = fixture.placement ?? 'pool';
          return placement === surface || placement === 'both';
        })
        .map(makePool);
    },
    async resolveAxes(id) {
      const fixture = byId.get(id);
      if (fixture === undefined) throw new Error(`Attrappe: unbekannter Pool ${String(id)}`);
      return fixture.axes ?? noAxes;
    },
  };

  return { pools, calls };
}

const state = (overrides: Partial<PoolMovementState> = {}): PoolMovementState => ({
  tagIds: [],
  statusId: statusId('kein-status'),
  completedAt: null,
  hasOpenEntries: false,
  hasExportedEntries: false,
  ...overrides,
});

describe('poolMovementNamer — Fall 1: list(\'all\'), reine Board-Spalten zählen mit (E-058 Absatz 1, R-1 Befund 3)', () => {
  it('fragt die Attrappe mit \'all\' und nennt eine reine Board-Spalte im Ergebnis', async () => {
    const boardOnly = poolId('pool-board');
    const poolOnly = poolId('pool-pool');
    const { pools, calls } = fakePools([
      {
        id: poolOnly,
        name: 'Pool-Liste',
        position: 0,
        placement: 'pool',
        rule: [{ kind: 'tag', tagId: tagId('a') }],
        axes: { required: { tagIds: [tagId('a')], emptyFolderIds: [] }, excluded: { tagIds: [], emptyFolderIds: [] } },
      },
      {
        id: boardOnly,
        name: 'Erledigt, noch nicht abgerechnet',
        position: 1,
        placement: 'board',
        rule: [{ kind: 'tag', tagId: tagId('b') }],
        axes: { required: { tagIds: [tagId('b')], emptyFolderIds: [] }, excluded: { tagIds: [], emptyFolderIds: [] } },
      },
    ]);

    const namer = await poolMovementNamer({ pools });
    const movement = namer({
      before: state({ tagIds: [] }),
      after: state({ tagIds: [tagId('a'), tagId('b')] }),
    });

    expect(calls).toEqual(['all']);
    expect(movement.enters).toContain('Pool-Liste');
    expect(movement.enters).toContain('Erledigt, noch nicht abgerechnet');
  });

  it('Rot-Nachweis: eine Attrappe, die das Argument verschluckt (wie vor T-090), würde die Board-Spalte NICHT sehen — die Prüfung oben unterscheidet also wirklich', async () => {
    const boardOnly = poolId('pool-board-2');
    const fixture: PoolFixture = {
      id: boardOnly,
      name: 'Nur Board',
      position: 0,
      placement: 'board',
      rule: [{ kind: 'tag', tagId: tagId('x') }],
      axes: { required: { tagIds: [tagId('x')], emptyFolderIds: [] }, excluded: { tagIds: [], emptyFolderIds: [] } },
    };

    // Dieselbe Attrappe, aber `list` verschluckt das Argument — die Fassung,
    // die es vor T-090 gab. Ausschließlich in dieser Testdatei.
    const swallowingPools: Pick<PoolPort, 'list' | 'resolveAxes'> = {
      list: async () => [makePool(fixture)].filter((pool) => pool.placement === 'pool' || pool.placement === 'both'),
      resolveAxes: async () => fixture.axes ?? noAxes,
    };

    const namer = await poolMovementNamer({ pools: swallowingPools });
    const movement = namer({
      before: state({ tagIds: [] }),
      after: state({ tagIds: [tagId('x')] }),
    });

    // Mit der verschluckenden Attrappe: unsichtbar — der Fehler, den R-1
    // Befund 3 beschreibt.
    expect(movement.enters).toEqual([]);
    expect(movement.appears).toEqual([]);
  });
});

describe('poolMovementNamer — Fall 2: enters ⊆ appears, enters ∩ leaves = ∅', () => {
  it('vier Pools, vier Übergänge — nur der jeweils zutreffende Fall erscheint in der passenden Liste', async () => {
    const neverMatches = poolId('never');
    const onlyAfter = poolId('only-after');
    const onlyBefore = poolId('only-before');
    const both = poolId('both');

    const rule = (tag: string): readonly PoolTagTerm[] => [{ kind: 'tag', tagId: tagId(tag) }];
    const axesFor = (tag: string): PoolAxesResolution => ({
      required: { tagIds: [tagId(tag)], emptyFolderIds: [] },
      excluded: { tagIds: [], emptyFolderIds: [] },
    });

    const { pools } = fakePools([
      { id: neverMatches, name: 'Nie', position: 0, rule: rule('z'), axes: axesFor('z') },
      { id: onlyAfter, name: 'Neu dabei', position: 1, rule: rule('x'), axes: axesFor('x') },
      { id: onlyBefore, name: 'Verlassen', position: 2, rule: rule('y'), axes: axesFor('y') },
      { id: both, name: 'Bleibt', position: 3, rule: rule('w'), axes: axesFor('w') },
    ]);

    const namer = await poolMovementNamer({ pools });
    const movement = namer({
      before: state({ tagIds: [tagId('y'), tagId('w')] }),
      after: state({ tagIds: [tagId('x'), tagId('w')] }),
    });

    expect(movement.appears).toEqual(['Neu dabei', 'Bleibt']);
    expect(movement.enters).toEqual(['Neu dabei']);
    expect(movement.leaves).toEqual(['Verlassen']);

    // Die beiden Invarianten aus dem Auftrag, unabhängig vom konkreten Fall
    // nachgerechnet — nicht nur an diesem einen Beispiel geglaubt.
    for (const name of movement.enters) expect(movement.appears).toContain(name);
    const intersection = movement.enters.filter((name) => movement.leaves.includes(name));
    expect(intersection).toEqual([]);

    // "Nie" darf in keiner der drei Listen stehen.
    expect(movement.appears).not.toContain('Nie');
    expect(movement.enters).not.toContain('Nie');
    expect(movement.leaves).not.toContain('Nie');
  });
});

describe('poolMovementNamer — Fall 3: zwei Pools mit demselben Namen, unterschieden über die Regel', () => {
  it('"Wartung" (Regel A, verlässt) und "Wartung" (Regel B, betritt) stehen unabhängig in allen drei Listen', async () => {
    const ruleA = poolId('wartung-a');
    const ruleB = poolId('wartung-b');

    const { pools } = fakePools([
      {
        id: ruleA,
        name: 'Wartung',
        position: 0,
        rule: [{ kind: 'tag', tagId: tagId('p') }],
        axes: { required: { tagIds: [tagId('p')], emptyFolderIds: [] }, excluded: { tagIds: [], emptyFolderIds: [] } },
      },
      {
        id: ruleB,
        name: 'Wartung',
        position: 1,
        rule: [{ kind: 'tag', tagId: tagId('q') }],
        axes: { required: { tagIds: [tagId('q')], emptyFolderIds: [] }, excluded: { tagIds: [], emptyFolderIds: [] } },
      },
    ]);

    const namer = await poolMovementNamer({ pools });
    // Vorher: erfüllt Regel A (p), nicht Regel B (q). Nachher: umgekehrt.
    const movement = namer({
      before: state({ tagIds: [tagId('p')] }),
      after: state({ tagIds: [tagId('q')] }),
    });

    // Beide Pools heißen "Wartung" — die Rechnung hat sie trotzdem
    // unabhängig beurteilt: Regel B erscheint (enters), Regel A verschwindet
    // (leaves), und "Wartung" steht deshalb in allen drei Listen, nicht nur
    // in einer, die die andere überschreibt.
    expect(movement.appears).toEqual(['Wartung']);
    expect(movement.enters).toEqual(['Wartung']);
    expect(movement.leaves).toEqual(['Wartung']);
  });
});

describe('poolMovementNamer — Fall 4: eine leere Regel trifft nichts (A-3.4)', () => {
  it('ein Pool ohne jede Bedingung bleibt unsichtbar, auch wenn sich der Zustand stark ändert', async () => {
    const empty = poolId('leer');
    const control = poolId('kontrolle');

    const { pools } = fakePools([
      { id: empty, name: 'Ohne Regel', position: 0, rule: [] },
      {
        id: control,
        name: 'Kontrolle',
        position: 1,
        rule: [{ kind: 'tag', tagId: tagId('k') }],
        axes: { required: { tagIds: [tagId('k')], emptyFolderIds: [] }, excluded: { tagIds: [], emptyFolderIds: [] } },
      },
    ]);

    const namer = await poolMovementNamer({ pools });
    const movement = namer({
      before: state({ tagIds: [] }),
      after: state({ tagIds: [tagId('k'), tagId('irgendwas'), tagId('noch-mehr')] }),
    });

    // Gegenprobe: Die Kontrolle zeigt, dass der Aufbau selbst funktioniert —
    // sonst bewiese ein Bestand, in dem zufällig nichts anschlägt, denselben
    // grünen Test.
    expect(movement.enters).toEqual(['Kontrolle']);
    expect(movement.appears).not.toContain('Ohne Regel');
    expect(movement.enters).not.toContain('Ohne Regel');
    expect(movement.leaves).not.toContain('Ohne Regel');
  });
});

describe('poolMovementNamer — Fall 5: eine Regel über einen leeren Ordner trifft nichts (E-057, unresolvedRequired)', () => {
  it('"Tag ODER leerer Ordner" trifft nichts, obwohl der Tagterm Tags beisteuert, die das Todo trägt', async () => {
    const mixed = poolId('gemischt');
    const control = poolId('nur-tag');

    // named=2 (Tagterm + Ordnerterm), resolved=1 (nur der Tagterm liefert
    // einen Tag), emptyTerms=1 (der Ordner ist leer) — termweise unaufgelöst,
    // wie im Bericht T-082 §4 Fall 2 gemessen.
    const unresolved = tagAxisIsUnresolved({ named: 2, resolved: 1, emptyTerms: 1 });
    expect(unresolved).toBe(true); // Voraussetzung des Falls, nicht das Ergebnis dieses Tests.

    const { pools } = fakePools([
      {
        id: mixed,
        name: 'Support ODER Ost (leer)',
        position: 0,
        rule: [{ kind: 'tag', tagId: tagId('support') }, { kind: 'folder', folderId: folderId('ost') }],
        axes: {
          required: { tagIds: [tagId('support')], emptyFolderIds: [folderId('ost')] },
          excluded: { tagIds: [], emptyFolderIds: [] },
        },
      },
      {
        id: control,
        name: 'Nur Support',
        position: 1,
        rule: [{ kind: 'tag', tagId: tagId('support') }],
        axes: {
          required: { tagIds: [tagId('support')], emptyFolderIds: [] },
          excluded: { tagIds: [], emptyFolderIds: [] },
        },
      },
    ]);

    const namer = await poolMovementNamer({ pools });
    const movement = namer({
      before: state({ tagIds: [] }),
      after: state({ tagIds: [tagId('support')] }),
    });

    // Gegenprobe: Der Tagterm selbst ist nicht das Problem — allein steht er
    // in "enters".
    expect(movement.enters).toEqual(['Nur Support']);
    expect(movement.appears).not.toContain('Support ODER Ost (leer)');
    expect(movement.enters).not.toContain('Support ODER Ost (leer)');
    expect(movement.leaves).not.toContain('Support ODER Ost (leer)');
  });
});
