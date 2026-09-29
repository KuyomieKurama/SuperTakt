/**
 * Takt — `resolvePool.matchesNothingReason` (O-J, `reports/T-397-domain-dev.md` next step 3).
 *
 * `PoolMatchesNothingReason` replaces three booleans an aufrufer would otherwise combine
 * themselves with one named reason. `unresolvedRequired` wins over `empty` for the explanation
 * (same priority as the raw booleans had before O-J), and `matchesNothing` must always agree
 * with `matchesNothingReason !== 'none'` — the two fields describe the same fact twice.
 */
import { describe, expect, it } from 'vitest';
import { resolvePool } from '../src/pool.ts';
import type { PoolRuleAxes } from '../src/pool.ts';
import type { TagFolderId } from '../src/kernel.ts';

const folderId = (value: string) => value as unknown as TagFolderId;

const neutralAxes: PoolRuleAxes = {
  rule: [],
  excludedTags: [],
  statusIds: [],
  completion: 'any',
  exportState: 'any',
};

describe('resolvePool — matchesNothingReason (O-J)', () => {
  it('a fully neutral rule (no condition at all): reason "empty", matchesNothing true', () => {
    const resolution = resolvePool({
      axes: neutralAxes,
      ruleTagIds: [],
      excludedTagIds: [],
      emptyRuleFolderIds: [],
      emptyExcludedFolderIds: [],
    });

    expect(resolution.matchesNothingReason).toBe('empty');
    expect(resolution.matchesNothing).toBe(true);
  });

  it('a rule with a real condition that resolved cleanly: reason "none", matchesNothing false', () => {
    const resolution = resolvePool({
      axes: { ...neutralAxes, completion: 'done' },
      ruleTagIds: [],
      excludedTagIds: [],
      emptyRuleFolderIds: [],
      emptyExcludedFolderIds: [],
    });

    expect(resolution.matchesNothingReason).toBe('none');
    expect(resolution.matchesNothing).toBe(false);
  });

  it('a required folder without tags: reason "unresolved_required", matchesNothing true', () => {
    const resolution = resolvePool({
      axes: { ...neutralAxes, rule: ['some-folder-term'] },
      ruleTagIds: [],
      excludedTagIds: [],
      emptyRuleFolderIds: [folderId('folder-empty')],
      emptyExcludedFolderIds: [],
    });

    expect(resolution.matchesNothingReason).toBe('unresolved_required');
    expect(resolution.matchesNothing).toBe(true);
  });

  it('"unresolved_required" wins over "empty" when both would apply on their own axis reading', () => {
    // The rule axis carries only the unresolved folder term (no other condition anywhere), so a
    // naive reading could call this "empty" — but an unresolved required folder is a stronger,
    // more specific statement, and it must win (same priority the three raw booleans had before O-J).
    const resolution = resolvePool({
      axes: { ...neutralAxes, rule: ['only-term'] },
      ruleTagIds: [],
      excludedTagIds: [],
      emptyRuleFolderIds: [folderId('folder-empty')],
      emptyExcludedFolderIds: [],
    });

    expect(resolution.matchesNothingReason).toBe('unresolved_required');
  });

  it('matchesNothing always agrees with matchesNothingReason !== "none", across all three reasons', () => {
    const cases: readonly [string, ReturnType<typeof resolvePool>][] = [
      [
        'none',
        resolvePool({
          axes: { ...neutralAxes, exportState: 'open' },
          ruleTagIds: [],
          excludedTagIds: [],
          emptyRuleFolderIds: [],
          emptyExcludedFolderIds: [],
        }),
      ],
      [
        'empty',
        resolvePool({
          axes: neutralAxes,
          ruleTagIds: [],
          excludedTagIds: [],
          emptyRuleFolderIds: [],
          emptyExcludedFolderIds: [],
        }),
      ],
      [
        'unresolved_required',
        resolvePool({
          axes: { ...neutralAxes, rule: ['term'] },
          ruleTagIds: [],
          excludedTagIds: [],
          emptyRuleFolderIds: [folderId('folder-empty')],
          emptyExcludedFolderIds: [],
        }),
      ],
    ];

    for (const [reason, resolution] of cases) {
      expect(resolution.matchesNothingReason).toBe(reason);
      expect(resolution.matchesNothing).toBe(reason !== 'none');
    }
  });

  it('an empty EXCLUDED folder never causes matchesNothing — only the required axis can (E-057)', () => {
    // A real condition elsewhere (`completion: 'done'`) keeps the rule from being globally
    // "empty", so this isolates exactly the claim: an unresolved EXCLUDED axis is reported
    // (`unresolvedExcluded: true`) but never turns `matchesNothingReason` away from "none".
    const resolution = resolvePool({
      axes: { ...neutralAxes, completion: 'done', excludedTags: ['excluded-term'] },
      ruleTagIds: [],
      excludedTagIds: [],
      emptyRuleFolderIds: [],
      emptyExcludedFolderIds: [folderId('excluded-empty')],
    });

    expect(resolution.unresolvedExcluded).toBe(true);
    expect(resolution.matchesNothingReason).toBe('none');
    expect(resolution.matchesNothing).toBe(false);
  });
});
