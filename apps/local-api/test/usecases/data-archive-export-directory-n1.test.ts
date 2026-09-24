/**
 * Takt — N-1 (T-388, E-124 point 9, R-37): an archive's exported directory only survives an
 * import if it is a local, absolute, existing directory on THIS computer. Anything else becomes
 * `null` plus a warning — the round trip at the very same computer still keeps its own folder.
 *
 * Built against the REAL `FilePort`/`DirectoryInsightPort` adapters (no mock), so the checks that
 * actually run in production (`isAbsolute`, `describeLocation`, `checkExportDirectory`) are the
 * ones this file measures.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { openDatabase, type OpenedDatabase } from '@takt/storage';
import { createDirectoryInsightPort } from '../../src/access/export-directory.ts';
import { createFilePort } from '@takt/storage';
import type { AppContext } from '../../src/context.ts';
import { exportDataArchive, importDataArchive } from '../../src/features/data-transfer/data-transfer.ts';

const NOW = '2026-09-10T10:00:00Z' as Timestamp;

async function setup(): Promise<{ readonly database: OpenedDatabase; readonly context: AppContext }> {
  const database = openDatabase({ location: ':memory:', now: () => NOW });
  await database.migrations.migrateToLatest();
  return {
    database,
    context: {
      transactions: database.transactions,
      clock: { now: () => NOW },
      system: { windowsUser: () => 'Ordnerprüfung' },
      files: createFilePort(),
      directories: createDirectoryInsightPort(),
    } as unknown as AppContext,
  };
}

async function archiveWithExportDirectory(path: string | null): Promise<{ readonly database: OpenedDatabase; readonly archive: Awaited<ReturnType<typeof exportDataArchive>> }> {
  const { database, context } = await setup();
  await database.transactions.inTransaction((unit) => unit.settings.update({ exportDirectory: path, now: NOW }));
  const archive = await exportDataArchive(context);
  return { database, archive };
}

describe('N-1 — five export-directory paths from an archive, only the local existing one survives', () => {
  let opened: OpenedDatabase | null = null;
  let tempDir: string | null = null;
  afterEach(() => {
    opened?.close();
    opened = null;
    if (tempDir !== null) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it.each([
    { label: 'UNC form (\\\\wirt\\freigabe)', path: '\\\\wirt.example\\freigabe' },
    { label: 'a POSIX-looking network share (//wirt.example/freigabe)', path: '//wirt.example/freigabe' },
    { label: 'missing (an absolute path that does not exist)', path: '/gibt/es/nicht-9f31' },
    { label: 'relative (relativ/ordner)', path: 'relativ/ordner' },
  ])('$label is dropped to null on import, with a warning, not carried over unchanged', async ({ path }) => {
    const built = await archiveWithExportDirectory(path);
    opened = built.database;
    expect(built.archive.data.tables.app_setting[0]?.['export_directory']).toBe(path);

    const { database: targetDb, context: targetContext } = await setup();
    try {
      const result = await importDataArchive(targetContext, built.archive);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.warnings.join(' ')).toContain('Exportordner');

      await targetDb.transactions.inTransaction(async (unit) => {
        expect((await unit.settings.load()).exportDirectory).toBeNull();
      });
    } finally {
      targetDb.close();
    }
  });

  it('an existing, writable local folder is kept unchanged, without a warning', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'takt-n1-'));
    const built = await archiveWithExportDirectory(tempDir);
    opened = built.database;

    const { database: targetDb, context: targetContext } = await setup();
    try {
      const result = await importDataArchive(targetContext, built.archive);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.warnings.join(' ')).not.toContain('Exportordner');

      await targetDb.transactions.inTransaction(async (unit) => {
        expect((await unit.settings.load()).exportDirectory).toBe(tempDir);
      });
    } finally {
      targetDb.close();
    }
  });
});
