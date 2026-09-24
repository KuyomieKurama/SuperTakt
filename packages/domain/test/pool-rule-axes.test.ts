/**
 * Takt — T-090, every axis of the domain has a field on the resolved rule side.
 *
 * Moved here from `apps/outlook-addin/scripts/proof-addin.mjs` (T-398, open question 1 to
 * unit-tester): the add-in dropped `poolMovement` and resolves no rule anymore (E-125 point 1,
 * E-120), so this pure domain guard had lost its only home in a script tied to a feature that no
 * longer computes movement. It measures a fact about `packages/domain/src/pool.ts` alone and
 * belongs in this package's own test suite.
 *
 * `POOL_RULE_AXIS_OF_FIELD` maps a resolved field of `MatchesPoolRule` back to its axis
 * (field -> axis). This guard looks the other way around: every axis named in
 * `POOL_RULE_AXIS_IDS` must be claimed by at least one field, or a rule that sets a new axis
 * could never be evaluated by `matchesPool` — and nothing would turn red to say so.
 */
import { describe, expect, it } from 'vitest';
import { POOL_RULE_AXIS_IDS, POOL_RULE_AXIS_OF_FIELD } from '../src/pool.ts';

describe('T-090 — every domain axis has a field on the resolved rule side', () => {
  it('POOL_RULE_AXIS_IDS names at least five axes — an empty list would pass trivially and check nothing', () => {
    expect(POOL_RULE_AXIS_IDS.length).toBeGreaterThanOrEqual(5);
  });

  it('every axis id is claimed by at least one field of MatchesPoolRule', () => {
    const claimedAxes = new Set(Object.values(POOL_RULE_AXIS_OF_FIELD));

    for (const axis of POOL_RULE_AXIS_IDS) {
      expect(claimedAxes.has(axis)).toBe(true);
    }
  });

  /**
   * Red-first proof, same pattern as `matches-pool-guard.test.ts`: the real guard above has
   * never failed in this codebase, so a run against the unmodified source is green from the
   * start. To prove the assertions above discriminate rather than pass by accident, this test
   * rebuilds exactly the failure the guard would need to catch — a sixth axis without a field —
   * entirely inside this test file, with no line in `src/`.
   */
  it('red-nachweis: a mapping missing one axis is told apart from the complete one', () => {
    const completeMapping = new Set(Object.values(POOL_RULE_AXIS_OF_FIELD));
    const incompleteMapping = new Set(completeMapping);
    incompleteMapping.delete('exportState');

    const axesMissingFromComplete = POOL_RULE_AXIS_IDS.filter((axis) => !completeMapping.has(axis));
    const axesMissingFromIncomplete = POOL_RULE_AXIS_IDS.filter(
      (axis) => !incompleteMapping.has(axis),
    );

    expect(axesMissingFromComplete).toEqual([]);
    expect(axesMissingFromIncomplete).toEqual(['exportState']);
  });
});
