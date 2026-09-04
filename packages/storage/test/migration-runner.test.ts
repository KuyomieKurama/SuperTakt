/**
 * Takt — T-027, der Migrationsläufer (E-003).
 *
 * `packages/storage/src/sqlite/migration-runner.ts` lag laut T-021-Bericht
 * (Risiko 1) bei 0 Prozent Abdeckung, und Risiko 3 desselben Berichts nennt
 * ausdrücklich, dass er nur gegen fünf Migrationen auf leerem Bestand gefahren
 * wurde. Zuschnitt (T-021, offene Frage 3): geänderte Prüfsumme, fehlende
 * Rückwärtsdatei, `database_too_new` — dazu die Sicherungskopie selbst, mit
 * echten Dateien in einem temporären Verzeichnis.
 */
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { openConnection, type SqlConnection } from '../src/sqlite/database.ts';
import { createMigrationRunner, loadMigrations } from '../src/sqlite/migration-runner.ts';
import type { Migration } from '../src/migration.ts';

const REAL_MIGRATIONS_DIR = join(import.meta.dirname, '..', 'migrations');
const fixedNow = (iso: string) => (): Timestamp => iso as Timestamp;

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'takt-migration-runner-'));
}

describe('loadMigrations — liest reale Migrationsdateien', () => {
  it('liest alle mitgelieferten Migrationen in aufsteigender Reihenfolge mit Prüfsumme', () => {
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    expect(migrations.length).toBeGreaterThanOrEqual(5);
    expect(migrations.map((m) => m.version)).toEqual([...migrations].map((m) => m.version).sort((a, b) => a - b));
    for (const migration of migrations) {
      expect(migration.checksum).toMatch(/^[0-9a-f]{64}$/);
      expect(migration.up.length).toBeGreaterThan(0);
      expect(migration.down.length).toBeGreaterThan(0);
    }
  });

  it('wirft, wenn eine Vorwärtsdatei keine Rückwärtsdatei hat — eine Einbahnstraße ist ein Fehler', () => {
    const dir = tempDir();
    try {
      writeFileSync(join(dir, '0001_ohne_rueckweg.up.sql'), 'CREATE TABLE t (id INTEGER);');
      expect(() => loadMigrations(dir)).toThrow(/keine Rückwärtsdatei/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('wirft, wenn eine Rückwärtsdatei keine Vorwärtsdatei hat', () => {
    const dir = tempDir();
    try {
      writeFileSync(join(dir, '0001_verwaist.down.sql'), 'DROP TABLE t;');
      expect(() => loadMigrations(dir)).toThrow(/keine Vorwärtsdatei/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignoriert Dateien, die dem Namensschema nicht entsprechen', () => {
    const dir = tempDir();
    try {
      writeFileSync(join(dir, '0001_x.up.sql'), 'CREATE TABLE t (id INTEGER);');
      writeFileSync(join(dir, '0001_x.down.sql'), 'DROP TABLE t;');
      writeFileSync(join(dir, 'README.md'), 'kein Migrationsformat');
      expect(loadMigrations(dir)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('createMigrationRunner — Zustand, Vorwärts- und Rückwärtsmigration', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('state() ist "pending" vor jeder Migration und zählt die ausstehenden korrekt', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });

    const state = await runner.state();
    expect(state).toEqual({ kind: 'pending', from: 0, to: migrations.at(-1)?.version, count: migrations.length });
  });

  it('migrateToLatest bringt den Bestand auf die höchste bekannte Version; danach ist state() "current"', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });

    const result = await runner.migrateToLatest();
    expect(result.from).toBe(0);
    expect(result.to).toBe(migrations.at(-1)?.version);
    // Kein Dateipfad (databasePath: null) — nichts zu sichern.
    expect(result.backup).toBeNull();

    expect(await runner.state()).toEqual({ kind: 'current', version: result.to });
    const applied = await runner.applied();
    expect(applied).toHaveLength(migrations.length);
  });

  it('ein zweiter migrateToLatest-Aufruf ohne neue Migrationen ist ein Kein-Op (from === to)', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });
    await runner.migrateToLatest();

    const second = await runner.migrateToLatest();
    expect(second).toEqual({ from: second.to, to: second.to, backup: null });
  });

  it('checksum_mismatch: eine bereits gelaufene Migration mit geänderter Prüfsumme lässt migrateToLatest werfen', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });
    await runner.migrateToLatest();

    // Eine bereits gelaufene Migrationsdatei wurde nachträglich verändert —
    // simuliert durch eine manuell verfälschte Prüfsumme in schema_migration.
    conn.prepare('UPDATE schema_migration SET checksum = ? WHERE version = 1').run('geaendert'.padEnd(64, '0'));

    expect(await runner.state()).toEqual({ kind: 'checksum_mismatch', version: 1 });
    await expect(runner.migrateToLatest()).rejects.toThrow(/unterscheidet sich von der mitgelieferten Datei/);
  });

  /**
   * BEFUND (T-027, nicht behoben — außerhalb meiner Dateihoheit):
   *
   * `database_too_new` ist laut `MigrationState` (packages/storage/src/migration.ts)
   * der Zustand "der Bestand ist neuer als die mitgelieferten Migrationen"
   * ("Das passiert, wenn eine ältere Fassung von Takt eine bereits migrierte
   * Datei öffnet") — mit einer eigenen, hilfreichen Fehlermeldung ("Bitte die
   * neuere Fassung verwenden").
   *
   * `currentState()` in `migration-runner.ts` kann diesen Zustand jedoch
   * **nie erreichen**: Die Schleife davor prüft für jede angewandte Zeile, ob
   * `migrations.find(entry => entry.version === row.version)` etwas findet.
   * `known` ist definitionsgemäß das Maximum der Versionen in genau diesem
   * `migrations`-Feld. Jede Zeile mit `row.version > known` — die einzige Art,
   * wie `current > known` überhaupt zustande kommen könnte — findet in der
   * Schleife zwangsläufig `migration === undefined` und liefert bereits dort
   * `checksum_mismatch` zurück, bevor die Prüfung auf `current > known`
   * überhaupt erreicht wird. Der Codepfad für `database_too_new` ist damit
   * toter Code.
   *
   * Die Auswirkung ist real: Ein Anwender, der eine neuere Installation von
   * Takt auf einer älteren Fassung öffnet, bekommt "Die bereits gelaufene
   * Migration N unterscheidet sich von der mitgelieferten Datei" — eine
   * Meldung, die auf eine manipulierte Datei hindeutet — statt "Bitte die
   * neuere Fassung verwenden", was die tatsächliche und harmlose Ursache wäre.
   *
   * Dieser Test bleibt absichtlich rot, bis der Fund behoben ist — siehe
   * Bericht T-027, Abschnitt „Befunde am Adapter".
   */
  it('BEFUND: database_too_new ist laut Zustandsprüfung unerreichbar — checksum_mismatch feuert immer zuerst', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });
    await runner.migrateToLatest();

    const tooHigh = (migrations.at(-1)?.version ?? 0) + 1;
    conn
      .prepare('INSERT INTO schema_migration (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)')
      .run(tooHigh, 'aus_der_zukunft', 'x'.repeat(64), '2026-08-31T08:00:00Z');

    const state = await runner.state();
    expect(state).toEqual({ kind: 'database_too_new', database: tooHigh, known: migrations.at(-1)?.version });
    await expect(runner.migrateToLatest()).rejects.toThrow(/kennt nur/);
  });

  it('migrateDownTo(0) macht alle Migrationen rückgängig — applied() ist danach leer', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });
    await runner.migrateToLatest();

    const result = await runner.migrateDownTo(0);
    expect(result.to).toBe(0);
    expect(await runner.applied()).toEqual([]);

    // Die von Migration 0001 angelegte Tabelle existiert nicht mehr.
    expect(() => conn.prepare('SELECT * FROM todo').all()).toThrow();
  });

  it('migrateDownTo auf eine Zwischenversion lässt genau die späteren Migrationen rückgängig', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });
    await runner.migrateToLatest();

    const result = await runner.migrateDownTo(1);
    expect(result.to).toBe(1);
    const applied = await runner.applied();
    expect(applied.map((a) => a.version)).toEqual([1]);
  });

  it('migrateDownTo wirft, wenn für eine gelaufene Migration keine Datei mehr existiert', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, { databasePath: null, now: fixedNow('2026-08-31T08:00:00Z') });
    await runner.migrateToLatest();

    const phantomVersion = (migrations.at(-1)?.version ?? 0) + 1;
    conn
      .prepare('INSERT INTO schema_migration (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)')
      .run(phantomVersion, 'phantom', 'x'.repeat(64), '2026-08-31T08:00:00Z');

    await expect(runner.migrateDownTo(0)).rejects.toThrow(/Der Rückweg ist nicht gangbar/);
  });
});

describe('createMigrationRunner — Sicherungskopie (die eigentliche Rückwärtsrichtung, siehe Kopfkommentar)', () => {
  let conn: SqlConnection;
  let dir: string;

  afterEach(() => {
    conn.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('ohne Dateipfad (databasePath: null) wird keine Sicherungskopie versucht', async () => {
    dir = tempDir();
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
      backupDirectory: dir,
    });
    const result = await runner.migrateToLatest();
    expect(result.backup).toBeNull();
    expect(readdirSync(dir)).toEqual([]);
  });

  it('bei Fassung 0 (fromVersion === 0) unterbleibt die Sicherungskopie auch mit Dateipfad — eine leere Datei zu sichern, sichert nichts', async () => {
    dir = tempDir();
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: join(dir, 'takt.db'),
      now: fixedNow('2026-08-31T08:00:00Z'),
      backupDirectory: dir,
    });
    const result = await runner.migrateToLatest();
    expect(result.backup).toBeNull();
  });

  it('bei einem bereits benutzten Bestand (fromVersion > 0) legt migrateToLatest vorher eine echte Sicherungskopie an', async () => {
    dir = tempDir();
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const first = migrations.slice(0, 1);
    const runnerPartial = createMigrationRunner(conn, first, {
      databasePath: join(dir, 'takt.db'),
      now: fixedNow('2026-08-31T08:00:00Z'),
      backupDirectory: dir,
    });
    await runnerPartial.migrateToLatest(); // fromVersion 0 -> 1, kein Backup

    const runnerFull = createMigrationRunner(conn, migrations, {
      databasePath: join(dir, 'takt.db'),
      now: fixedNow('2026-08-31T09:00:00Z'),
      backupDirectory: dir,
    });
    const result = await runnerFull.migrateToLatest();

    expect(result.backup).not.toBeNull();
    expect(result.backup === null ? false : existsSync(result.backup)).toBe(true);
    expect(result.backup === null ? '' : result.backup).toMatch(/takt-vor-migration-1-\d{8}-\d{6}\.db$/);
  });

  it('zwei Sicherungskopien mit demselben Namen (Migration in derselben Sekunde) kollidieren nicht — die zweite bekommt einen Zähler', async () => {
    dir = tempDir();
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const databasePath = join(dir, 'takt.db');

    // Erste Migration auf Version 1, damit "fromVersion > 0" beim nächsten Mal gilt.
    await createMigrationRunner(conn, migrations.slice(0, 1), {
      databasePath,
      now: fixedNow('2026-08-31T08:00:00Z'),
      backupDirectory: dir,
    }).migrateToLatest();

    // Der Name, den `createBackup` beim nächsten Aufruf berechnen wird
    // (fromVersion 1, dieselbe Sekunde), liegt bereits im Ordner — genau der
    // Fall "zwei Migrationen in derselben Sekunde" aus dem Kopfkommentar.
    // `writeFileSync` statt eines echten `VACUUM INTO` reicht: `createBackup`
    // prüft nur `existsSync(target)`, nicht den Inhalt der Datei.
    const collidingName = join(dir, 'takt-vor-migration-1-20260831-090000.db');
    writeFileSync(collidingName, 'belegt von einer fremden Sicherung');

    const runner = createMigrationRunner(conn, migrations, {
      databasePath,
      now: fixedNow('2026-08-31T09:00:00Z'),
      backupDirectory: dir,
    });
    const result = await runner.migrateToLatest();

    expect(result.backup).not.toBeNull();
    expect(result.backup).not.toBe(collidingName);
    expect(result.backup === null ? '' : result.backup).toMatch(/takt-vor-migration-1-20260831-090000-2\.db$/);
    // Die kollidierende Datei ist unangetastet geblieben.
    expect(existsSync(collidingName)).toBe(true);
  });

  it('ohne existierendes Sicherungsverzeichnis unterbleibt die Kopie, statt zu werfen', async () => {
    dir = tempDir();
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    await createMigrationRunner(conn, migrations.slice(0, 1), {
      databasePath: join(dir, 'takt.db'),
      now: fixedNow('2026-08-31T08:00:00Z'),
      backupDirectory: dir,
    }).migrateToLatest();

    const missingDir = join(dir, 'existiert-nicht');
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: join(dir, 'takt.db'),
      now: fixedNow('2026-08-31T09:00:00Z'),
      backupDirectory: missingDir,
    });
    const result = await runner.migrateToLatest();
    expect(result.backup).toBeNull();
  });
});

/** Liest den aktuellen Wert eines Pragmas, unabhängig vom genauen Spaltennamen der Antwortzeile. */
function readPragma(conn: SqlConnection, name: string): number {
  const row = conn.prepare(`PRAGMA ${name}`).get() as Record<string, unknown> | undefined;
  const value = row === undefined ? undefined : Object.values(row)[0];
  return Number(value);
}

/**
 * T-105 (R-3a H-4, Auftrag aus `reports/T-101-domain-dev.md` "Nächster
 * Schritt" 2): `legacy_alter_table` wird laut Kopfkommentar von `applyOne` in
 * `migration-runner.ts` "ohne Bedingung" im `finally` zurückgesetzt — auch im
 * FEHLERPFAD, wenn eine Migration mittendrin wirft, NACHDEM sie das Pragma
 * eingeschaltet hat. Vor dieser Datei prüfte kein Test den Fehlerpfad
 * überhaupt (die vorhandenen Fälle oben prüfen ausschließlich erfolgreiche
 * Migrationen).
 *
 * Wichtig für die Aussagekraft: Ein Pragma ist eine Einstellung der
 * VERBINDUNG, kein Teil der Transaktion — `ROLLBACK` nimmt es nicht zurück
 * (das ist der ganze Grund, warum ein `finally` überhaupt nötig ist). Die
 * Migration unten schaltet das Pragma deshalb VOR dem fehlschlagenden
 * Statement ein, damit die Verbindung den eingeschalteten Zustand tatsächlich
 * einmal getragen hat, bevor geprüft wird, dass er danach wieder weg ist.
 */
describe('applyOne — legacy_alter_table wird auch im FEHLERPFAD zurückgesetzt (R-3a H-4)', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('eine Migration, die NACH "PRAGMA legacy_alter_table = ON" scheitert, hinterlässt das Pragma trotzdem auf OFF', async () => {
    conn = openConnection(':memory:');
    const broken: Migration = {
      version: 1,
      name: 'kaputt_nach_legacy_alter_table',
      up: `
        PRAGMA legacy_alter_table = ON;
        CREATE TABLE t (id INTEGER PRIMARY KEY);
        INSERT INTO tabelle_die_es_nicht_gibt (x) VALUES (1);
      `,
      down: 'DROP TABLE IF EXISTS t;',
      checksum: 'a'.repeat(64),
    };
    const runner = createMigrationRunner(conn, [broken], {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });

    await expect(runner.migrateToLatest()).rejects.toThrow();

    // Die Migration ist NICHT angewendet — ROLLBACK hat die Transaktion
    // zurückgenommen (die Tabelle "t" existiert nicht).
    expect(() => conn.prepare('SELECT * FROM t').all()).toThrow();
    // Das Pragma dagegen — nicht Teil der Transaktion — steht wieder auf OFF.
    expect(readPragma(conn, 'legacy_alter_table')).toBe(0);
  });

  it('Gegenprobe: OHNE das fehlschlagende Statement bleibt dieselbe Migration erfolgreich und das Pragma steht ebenfalls wieder auf OFF', async () => {
    conn = openConnection(':memory:');
    const working: Migration = {
      version: 1,
      name: 'funktioniert',
      up: `
        PRAGMA legacy_alter_table = ON;
        CREATE TABLE t (id INTEGER PRIMARY KEY);
        PRAGMA legacy_alter_table = OFF;
      `,
      down: 'DROP TABLE IF EXISTS t;',
      checksum: 'b'.repeat(64),
    };
    const runner = createMigrationRunner(conn, [working], {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });

    const result = await runner.migrateToLatest();

    expect(result.to).toBe(1);
    expect(conn.prepare('SELECT * FROM t').all()).toEqual([]);
    expect(readPragma(conn, 'legacy_alter_table')).toBe(0);
  });

  it('eine gewöhnliche Migration, die legacy_alter_table NIE anfasst, hält es unverändert auf OFF (die Vorgabe von SQLite)', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });

    await runner.migrateToLatest();

    expect(readPragma(conn, 'legacy_alter_table')).toBe(0);
  });
});
