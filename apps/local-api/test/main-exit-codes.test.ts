/**
 * Takt — A-28.10 exit codes (`EXIT_CODES`, `main.ts`), E-129 point 4 (T-401c).
 *
 * `main()` calls `process.exit(...)` directly at each of these five points, so the exit itself is
 * only observable by actually running the sidecar as a process — out of scope for a unit test.
 * What IS measurable without spawning:
 *  - the table of codes itself, pairwise distinct (a shell or `sidecar.rs` telling two causes
 *    apart depends on that), and
 *  - the one condition the task calls out by name — an application data directory blocked by a
 *    FILE instead of a directory — reaching the exact function whose failure `main.ts` maps to
 *    `EXIT_CODES.appData` (73): `ensureDirectory` (`@takt/storage`), used nowhere else in that
 *    catch block.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureDirectory } from '@takt/storage';
import { EXIT_CODES } from '../src/main.ts';

describe('A-28.10 — EXIT_CODES', () => {
  it('has exactly the five documented causes, pairwise distinct', () => {
    expect(EXIT_CODES).toEqual({
      handshake: 78,
      appData: 73,
      storeOpen: 66,
      migration: 65,
      bind: 74,
    });
    const values = Object.values(EXIT_CODES);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('A-28.10 — the application-data-directory cause (EXIT_CODES.appData, 73)', () => {
  let workDir: string | null = null;
  afterEach(() => {
    if (workDir !== null) rmSync(workDir, { recursive: true, force: true });
    workDir = null;
  });

  it('a plain FILE where the directory should be makes ensureDirectory throw — the exact condition main.ts maps to code 73', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'takt-appdata-blocked-'));
    const blocked = join(workDir, 'SuperTakt');
    writeFileSync(blocked, 'not a directory');

    await expect(ensureDirectory(blocked)).rejects.toThrow();
  });

  it('the ordinary case — no file in the way — does not throw, so the failure above is specific to the blocking file, not to the call itself', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'takt-appdata-ok-'));
    const target = join(workDir, 'SuperTakt');

    await expect(ensureDirectory(target)).resolves.toBeUndefined();
  });
});
