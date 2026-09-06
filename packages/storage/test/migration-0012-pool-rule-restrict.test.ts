/**
 * Takt — T-095, Migration 0012 "pool_rule_restrict" vorwärts und rückwärts,
 * mit Bestand (R-1 Befund 1, T-089).
 *
 * `packages/storage/migrations/0012_pool_rule_restrict.{up,down}.sql` setzt
 * `pool_rule.tag_id` und `pool_rule.folder_id` von `ON DELETE CASCADE` auf
 * `ON DELETE RESTRICT` — dasselbe Muster wie bei `status_id` in Migration
 * 0011. Diese Datei fährt die Migration über den echten Läufer
 * (`createMigrationRunner`, wie `migration-runner.test.ts`), nicht über die
 * vorgemischte Verbindung aus `support/setup.ts`, damit Vorwärts- und
 * Rückwärtsrichtung einzeln ansteuerbar sind.
 *
 * Geprüft wird, was der T-089-Bericht von Hand nachgewiesen hat (Abschnitt
 * "Nachweise", Migrationstabelle) — hier automatisiert und dauerhaft:
 *
 *   1. Auf dem aktuellen Bestand (0012) weist die Datenbank das Löschen
 *      eines Ordners bzw. eines Tags, die eine Regel nennt, mit einem
 *      Fremdschlüsselfehler ab — die Regel bleibt unversehrt.
 *   2. Rückwärts auf 0011 bleibt derselbe Bestand unverändert erhalten
 *      ("keine Zeile verliert ihren Platz", so die Migrationsdatei selbst).
 *   3. Auf 0011 geht dasselbe Löschen durch und nimmt den Regelterm mit
 *      (CASCADE) — der Zustand, gegen den 0012 geschrieben ist.
 *   4. Vorwärts auf 0012 zurück: `integrity_check` und `foreign_key_check`
 *      sind sauber.
 */
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { openConnection, type SqlConnection } from '../src/sqlite/database.ts';
import { createMigrationRunner, loadMigrations } from '../src/sqlite/migration-runner.ts';
import { createUnitOfWork } from '../src/sqlite/unit-of-work.ts';
import { fakeIds, NOW } from './support/setup.ts';

const REAL_MIGRATIONS_DIR = join(import.meta.dirname, '..', 'migrations');
const fixedNow = (iso: string) => (): Timestamp => iso as Timestamp;

describe('Migration 0012 "pool_rule_restrict" — vorwärts und rückwärts, mit Bestand', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('RESTRICT (0012): ein Ordner und ein Tag, die eine Regel nennen, sind nicht löschbar — die Regel bleibt unversehrt; danach CASCADE (0011), FK-Fehler weg; wieder vorwärts: integer Bestand', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const restrictMigration = migrations.find((m) => m.name === 'pool_rule_restrict');
    expect(restrictMigration).toBeDefined();
    if (restrictMigration === undefined) return;
    const priorVersion = restrictMigration.version - 1;

    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });

    // ---------------------------------------------------------------------
    // 0. Vorwärts auf den vollständigen Bestand (aktuell = 0012) und Daten
    //    anlegen, über die echten Adapter — dieselben, die auch die
    //    Anwendung benutzt, nicht per Hand zusammengesetztes SQL.
    // ---------------------------------------------------------------------
    await runner.migrateToLatest();
    expect(await runner.state()).toEqual({ kind: 'current', version: migrations.at(-1)?.version });

    const unit = createUnitOfWork(conn, { ids: fakeIds('mig12') });
    const folder = await unit.folders.create(null, 'Ost', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;

    const pool = await unit.pools.create(
      {
        name: 'Wartung Nord',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'folder', folderId: folder.value.id }],
      },
      NOW,
    );

    const ruleCountFor = (poolId: string): number => {
      const row = conn.prepare('SELECT COUNT(*) AS c FROM pool_rule WHERE pool_id = ?').get(poolId);
      return row === undefined ? 0 : Number(row['c']);
    };
    expect(ruleCountFor(pool.id)).toBe(1);

    // ---------------------------------------------------------------------
    // 1. RESTRICT: das rohe DELETE (nicht der Adapter — die Datenbank selbst,
    //    als zweite Wache) schlägt fehl, und die Regel bleibt unversehrt.
    // ---------------------------------------------------------------------
    expect(() => conn.prepare('DELETE FROM tag_folder WHERE id = ?').run(folder.value.id)).toThrow(
      /FOREIGN KEY constraint failed/,
    );
    expect(await unit.folders.load(folder.value.id)).not.toBeNull();
    expect(ruleCountFor(pool.id)).toBe(1);

    // ---------------------------------------------------------------------
    // 2. Rückwärts auf die Fassung vor 0012 — keine Zeile verliert ihren
    //    Platz (Kommentar der Rückwärtsdatei, hier nachgemessen statt
    //    geglaubt).
    // ---------------------------------------------------------------------
    const down = await runner.migrateDownTo(priorVersion);
    expect(down.to).toBe(priorVersion);
    expect(ruleCountFor(pool.id)).toBe(1);
    const folderRow = conn.prepare('SELECT id, name FROM tag_folder WHERE id = ?').get(folder.value.id);
    expect(folderRow).toBeDefined();
    expect(folderRow?.['name']).toBe('Ost');

    // ---------------------------------------------------------------------
    // 3. Gegenprobe unmittelbar danach: Auf der alten Fassung (CASCADE) geht
    //    dasselbe Löschen durch und nimmt den Regelterm mit — das ist genau
    //    der Zustand, gegen den 0012 geschrieben ist (R-1 Befund 1).
    // ---------------------------------------------------------------------
    expect(() => conn.prepare('DELETE FROM tag_folder WHERE id = ?').run(folder.value.id)).not.toThrow();
    expect(conn.prepare('SELECT id FROM tag_folder WHERE id = ?').get(folder.value.id)).toBeUndefined();
    expect(ruleCountFor(pool.id)).toBe(0); // der Term ist mitgegangen — die Regel trifft jetzt mehr.

    // ---------------------------------------------------------------------
    // 4. Wieder vorwärts auf 0012: sauberer Bestand, keine offenen
    //    Fremdschlüsselverweise, keine Beschädigung durch den Hin- und Rückweg.
    // ---------------------------------------------------------------------
    const up = await runner.migrateToLatest();
    expect(up.to).toBe(migrations.at(-1)?.version);
    const integrity = conn.prepare('PRAGMA integrity_check').get();
    expect(integrity?.['integrity_check']).toBe('ok');
    expect(conn.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });

  it('RESTRICT gilt ebenso für tag_id: ein Tag in einer Regel ist nicht löschbar, solange 0012 gilt', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });
    await runner.migrateToLatest();

    const unit = createUnitOfWork(conn, { ids: fakeIds('mig12-tag') });
    const tag = await unit.tags.create(null, 'Beratung', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;

    await unit.pools.create(
      {
        name: 'Über ein Tag',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tag.value.id }],
      },
      NOW,
    );

    expect(() => conn.prepare('DELETE FROM tag WHERE id = ?').run(tag.value.id)).toThrow(
      /FOREIGN KEY constraint failed/,
    );
    expect(await unit.tags.load(tag.value.id)).not.toBeNull();
  });
});
