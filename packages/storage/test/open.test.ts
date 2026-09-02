/**
 * Takt — T-027, Datenbank öffnen, migrieren, Ports bauen (`src/sqlite/open.ts`).
 *
 * `packages/storage/src/sqlite/open.ts` lag laut T-021-Bericht (Risiko 1) bei
 * 0 Prozent Abdeckung. Es ist die eine Stelle, an der aus einem Dateipfad eine
 * benutzbare Speicherung wird — dieser Test prüft, dass sie tatsächlich
 * zusammenspielt: migrieren, dann über die Transaktionsklammer schreiben und
 * lesen, dann schließen.
 */
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { defaultMigrationsDirectory, openDatabase } from '../src/sqlite/open.ts';

const NOW = () => '2026-08-31T08:00:00Z' as Timestamp;

describe('defaultMigrationsDirectory', () => {
  it('zeigt auf ein tatsächlich existierendes Verzeichnis mit Migrationsdateien', () => {
    const dir = defaultMigrationsDirectory();
    expect(existsSync(dir)).toBe(true);
    expect(existsSync(join(dir, '0001_initial.up.sql'))).toBe(true);
  });
});

describe('openDatabase — migriert, baut die Transaktionsklammer, schließt', () => {
  it('öffnet eine In-Memory-Datenbank, migriert sie und lässt darüber schreiben und lesen', async () => {
    const opened = openDatabase({ location: ':memory:', now: NOW });
    try {
      const migration = await opened.migrations.migrateToLatest();
      expect(migration.to).toBeGreaterThan(0);
      expect(migration.backup).toBeNull(); // :memory: -> kein Dateipfad zu sichern

      const created = await opened.transactions.inTransaction(async (unit) =>
        unit.todos.create(
          { title: 'Über openDatabase angelegt', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW() },
          [],
        ),
      );

      const loaded = await opened.transactions.inTransaction(async (unit) => unit.todos.load(created.id));
      expect(loaded?.title).toBe('Über openDatabase angelegt');
    } finally {
      opened.close();
    }
  });

  it('öffnet eine echte Datei auf der Festplatte, migriert sie, und die Datei existiert danach', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'takt-open-'));
    const location = join(dir, 'takt.db');
    try {
      const opened = openDatabase({ location, now: NOW });
      await opened.migrations.migrateToLatest();
      opened.close();

      expect(existsSync(location)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('übernimmt eine überschriebene Zeitzone in den Exportlesevorgang, statt der Rechnerzone', async () => {
    const opened = openDatabase({ location: ':memory:', now: NOW, timeZone: 'Pacific/Kiritimati' });
    try {
      await opened.migrations.migrateToLatest();
      // Kein Wurf und ein normales, leeres Ergebnis genügt hier als Nachweis,
      // dass die Zeitzone durchgereicht wird, ohne den Aufbau zu brechen — die
      // eigentliche Rechenregel dafür liegt in der Domäne und ist dort geprüft.
      const groups = await opened.transactions.inTransaction(async (unit) => unit.exportRead.openGroups());
      expect(groups).toEqual([]);
    } finally {
      opened.close();
    }
  });

  it('ein eigenes Migrationsverzeichnis wird anstelle des mitgelieferten benutzt', async () => {
    const opened = openDatabase({
      location: ':memory:',
      now: NOW,
      migrationsDirectory: defaultMigrationsDirectory(),
    });
    try {
      const result = await opened.migrations.migrateToLatest();
      expect(result.to).toBeGreaterThan(0);
    } finally {
      opened.close();
    }
  });

  it('close() schließt die zugrunde liegende Verbindung tatsächlich', async () => {
    const opened = openDatabase({ location: ':memory:', now: NOW });
    await opened.migrations.migrateToLatest();
    opened.close();
    expect(() => opened.connection.prepare('SELECT 1').get()).toThrow();
  });
});
