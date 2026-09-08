/**
 * Takt — T-132: Der Fehlschlag des Migrationsläufers **nennt seinen Grund**.
 *
 * ===========================================================================
 * Anlass
 * ===========================================================================
 *
 * Am 2026-09-04 um 18:57 startete Takt nicht. Übrig blieb eine Zeile, die die
 * Folge nannte („Der Datenbestand konnte nicht auf den Stand dieser Fassung
 * gebracht werden") und nicht die Ursache — `apps/local-api/src/main.ts` fing
 * den Wurf mit `catch {` ohne Bindung ab. Ein zweiter Anlauf lief durch, und
 * damit war der Grund für immer weg.
 *
 * Diese Datei misst die Gegenmaßnahme auf der Seite der Speicherung: Jeder
 * Fehlschlag des Läufers trägt einen **Wert**, der ihn von seinen Nachbarn
 * unterscheidet.
 *
 * ===========================================================================
 * Was hier gemessen wird — und was nicht
 * ===========================================================================
 *
 * Gemessen wird die **Unterscheidung**, nicht dass überhaupt etwas geworfen
 * wird. Jeder Fall bekommt seinen eigenen `kind` und seine eigenen Felder;
 * ein Prüffall, der nur `rejects.toThrow()` sagt, hätte den Befund vom
 * 2026-09-04 nicht verhindert.
 *
 * **Nicht** hier: der Satz, den der Benutzer liest, und die Zeile, die im
 * Protokoll landet. Beides gehört dem Dienst und steht in
 * `apps/local-api/test/startup.test.ts`.
 *
 * ---------------------------------------------------------------------------
 * Übernahme durch unit-tester (T-132, vollzogen mit T-148)
 * ---------------------------------------------------------------------------
 * Diese Datei liegt in der Hoheit von unit-tester und wurde vom domain-dev
 * angelegt, weil die Aufgabe T-132 die Prüffälle ausdrücklich verlangte. Der
 * Auftrag T-148 macht die Übernahme förmlich: Pflege und Erweiterung dieser
 * Datei liegen ab jetzt hier, nicht mehr beim domain-dev.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import type { Timestamp } from '@takt/domain';

import { openConnection, type SqlConnection } from '../src/sqlite/database.ts';
import { createMigrationRunner } from '../src/sqlite/migration-runner.ts';
import {
  errorCodeOf,
  isBusyResultCode,
  migrationFailureReason,
  sqliteResultCodeOf,
} from '../src/migration.ts';
import type { Migration, MigrationFailureReason } from '../src/migration.ts';

const now = (): Timestamp => '2026-09-04T18:57:44Z' as Timestamp;

const open: SqlConnection[] = [];
const dirs: string[] = [];

afterEach(() => {
  while (open.length > 0) open.pop()?.close();
  while (dirs.length > 0) rmSync(dirs.pop() ?? '', { recursive: true, force: true });
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'takt-failure-reason-'));
  dirs.push(dir);
  return dir;
}

function connect(location: string): SqlConnection {
  const conn = openConnection(location);
  open.push(conn);
  return conn;
}

function migration(version: number, up: string, down = 'SELECT 1;'): Migration {
  return { version, name: `m${version}`, up, down, checksum: `pruefsumme-${version}` };
}

/** Der Grund eines Wurfs — oder ein sprechender Fehlschlag statt `null`. */
async function reasonOf(work: () => Promise<unknown>): Promise<MigrationFailureReason> {
  try {
    await work();
  } catch (error) {
    const reason = migrationFailureReason(error);
    expect(reason, 'der Wurf trägt keinen Grund').not.toBeNull();
    return reason as MigrationFailureReason;
  }
  throw new Error('Es wurde nichts geworfen.');
}

describe('T-132 — der Läufer hängt jedem Fehlschlag seinen Grund an', () => {
  it('checksum_mismatch nennt die Fassung, deren Datei sich geändert hat', async () => {
    const conn = connect(':memory:');
    const first = createMigrationRunner(conn, [migration(1, 'CREATE TABLE a (x INTEGER);')], {
      databasePath: null,
      now,
    });
    await first.migrateToLatest();

    // Dieselbe Fassung, andere Prüfsumme: genau der Fall „jemand hat eine
    // bereits gelaufene Migration nachträglich geändert".
    const changed: Migration = { ...migration(1, 'CREATE TABLE a (x INTEGER);'), checksum: 'anders' };
    const second = createMigrationRunner(conn, [changed], { databasePath: null, now });

    const reason = await reasonOf(() => second.migrateToLatest());
    expect(reason).toEqual({ kind: 'checksum_mismatch', version: 1 });
  });

  it('database_too_new nennt beide Fassungen — den Bestand und die bekannte', async () => {
    const conn = connect(':memory:');
    const alle = [
      migration(1, 'CREATE TABLE a (x INTEGER);'),
      migration(2, 'CREATE TABLE b (x INTEGER);'),
    ];
    await createMigrationRunner(conn, alle, { databasePath: null, now }).migrateToLatest();

    // Eine ältere Fassung von Takt kennt nur die erste Migration.
    const aelter = createMigrationRunner(conn, [alle[0] as Migration], { databasePath: null, now });

    const reason = await reasonOf(() => aelter.migrateToLatest());
    expect(reason).toEqual({ kind: 'database_too_new', database: 2, known: 1 });
  });

  it('migration_failed nennt Fassung und Richtung, wenn es mitten in einer Migration abbricht', async () => {
    const conn = connect(':memory:');
    const runner = createMigrationRunner(
      conn,
      [
        migration(1, 'CREATE TABLE a (x INTEGER);'),
        // Die zweite läuft halb: Die erste Anweisung greift, die zweite ist
        // Unsinn. SQLite nimmt die Transaktion zurück; der Grund muss trotzdem
        // sagen, **welche** Fassung es war.
        migration(2, 'CREATE TABLE b (x INTEGER);\nDIES IST KEIN SQL;'),
      ],
      { databasePath: null, now },
    );

    const reason = await reasonOf(() => runner.migrateToLatest());
    expect(reason.kind).toBe('migration_failed');
    if (reason.kind !== 'migration_failed') return;
    expect(reason.version).toBe(2);
    expect(reason.direction).toBe('up');
    expect(reason.code).toBe('ERR_SQLITE_ERROR');

    // Und die Gegenprobe: Die halbe Migration ist zurückgenommen.
    const zurueck = conn
      .prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'b'")
      .get();
    expect(zurueck?.['n']).toBe(0);
  });

  it('migration_failed nennt auch die Rückrichtung', async () => {
    const conn = connect(':memory:');
    const runner = createMigrationRunner(
      conn,
      [migration(1, 'CREATE TABLE a (x INTEGER);', 'DIES IST KEIN SQL;')],
      { databasePath: null, now },
    );
    await runner.migrateToLatest();

    const reason = await reasonOf(() => runner.migrateDownTo(0));
    expect(reason.kind).toBe('migration_failed');
    if (reason.kind !== 'migration_failed') return;
    expect(reason.version).toBe(1);
    expect(reason.direction).toBe('down');
  });

  it('no_way_back: zu einer gelaufenen Migration gibt es keine Datei mehr', async () => {
    const conn = connect(':memory:');
    await createMigrationRunner(conn, [migration(1, 'CREATE TABLE a (x INTEGER);')], {
      databasePath: null,
      now,
    }).migrateToLatest();

    const ohne = createMigrationRunner(conn, [], { databasePath: null, now });
    const reason = await reasonOf(() => ohne.migrateDownTo(0));
    expect(reason).toEqual({ kind: 'no_way_back', version: 1 });
  });

  it('backup_failed, wenn die Sicherungskopie vor der Migration nicht entsteht', async () => {
    const dir = tempDir();
    const file = join(dir, 'takt.db');
    const conn = connect(file);

    // Fassung 1 ist gelaufen — ab hier legt der Läufer vor jeder weiteren
    // Migration eine Sicherungskopie an.
    await createMigrationRunner(conn, [migration(1, 'CREATE TABLE a (x INTEGER);')], {
      databasePath: file,
      now,
    }).migrateToLatest();

    // Der Ablageort der Kopie ist vorhanden, aber keiner: eine gewöhnliche
    // Datei. `VACUUM INTO` kann dorthin nichts schreiben — stellvertretend für
    // vollen Datenträger, fehlendes Schreibrecht und abgehängte Freigabe.
    // Genau das ist der Fall, den der Läufer von einer gescheiterten Migration
    // unterscheiden muss: Hier ist der Bestand unversehrt und **ungeändert**.
    const keinOrdner = join(dir, 'kein-ordner');
    writeFileSync(keinOrdner, 'belegt');

    const runner = createMigrationRunner(
      conn,
      [migration(1, 'CREATE TABLE a (x INTEGER);'), migration(2, 'CREATE TABLE b (x INTEGER);')],
      { databasePath: file, now, backupDirectory: keinOrdner },
    );

    const reason = await reasonOf(() => runner.migrateToLatest());
    expect(reason.kind).toBe('backup_failed');
    if (reason.kind !== 'backup_failed') return;
    expect(reason.from).toBe(1);

    // Und es wurde nichts migriert.
    const stand = conn.prepare('SELECT max(version) AS v FROM schema_migration').get();
    expect(stand?.['v']).toBe(1);
  });

  it('database_busy, wenn ein zweiter Zugriff den Bestand hält', async () => {
    const dir = tempDir();
    const file = join(dir, 'takt.db');

    // Ein Bestand **ohne** WAL: Dort sperrt ein `BEGIN EXCLUSIVE` auch die
    // Leser aus. Im WAL-Betrieb tut er das nicht — der Unterschied ist
    // gemessen und steht im Bericht zu T-132.
    const halter = new DatabaseSync(file);
    halter.exec('PRAGMA journal_mode = DELETE;');
    halter.exec('CREATE TABLE schema_migration (version INTEGER NOT NULL PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL);');

    const zweiter = new DatabaseSync(file);
    zweiter.exec('PRAGMA busy_timeout = 100;');
    const conn: SqlConnection = {
      prepare: (sql) => {
        const statement = zweiter.prepare(sql);
        return {
          all: (...params) => statement.all(...(params as never[])) as never,
          get: (...params) => statement.get(...(params as never[])) as never,
          run: (...params) => ({ changes: Number(statement.run(...(params as never[])).changes) }),
        };
      },
      exec: (sql) => zweiter.exec(sql),
      close: () => zweiter.close(),
    };
    const runner = createMigrationRunner(conn, [migration(1, 'CREATE TABLE a (x INTEGER);')], {
      databasePath: file,
      now,
    });

    halter.exec('BEGIN EXCLUSIVE;');
    try {
      const reason = await reasonOf(() => runner.state());
      expect(reason.kind).toBe('database_busy');
      if (reason.kind !== 'database_busy') return;
      // SQLITE_BUSY. Genau diese Zahl fehlte am 2026-09-04.
      expect(reason.sqlite).toBe(5);
    } finally {
      halter.exec('ROLLBACK;');
      halter.close();
      zweiter.close();
    }
  });

  it('state_unreadable: ein Wurf beim Lesen des Standes ist kein Wurf beim Migrieren', async () => {
    const conn = connect(':memory:');
    const runner = createMigrationRunner(conn, [migration(1, 'CREATE TABLE a (x INTEGER);')], {
      databasePath: null,
      now,
    });
    // Die Tabelle des Läufers verschwindet unter ihm. Ein anderer Wurf als
    // „belegt", also die allgemeine Auskunft — mit Schlüssel.
    conn.exec('DROP TABLE schema_migration;');

    const reason = await reasonOf(() => runner.state());
    expect(reason.kind).toBe('state_unreadable');
    if (reason.kind !== 'state_unreadable') return;
    expect(reason.code).toBe('ERR_SQLITE_ERROR');
  });

  it('kein Feld eines Grundes trägt einen Pfad — auch dann nicht, wenn einer im Spiel war', async () => {
    const dir = tempDir();
    const file = join(dir, 'takt.db');
    const conn = connect(file);
    const runner = createMigrationRunner(
      conn,
      [
        migration(1, 'CREATE TABLE a (x INTEGER);'),
        migration(2, 'CREATE TABLE b (x INTEGER);\nDIES IST KEIN SQL;'),
      ],
      { databasePath: file, now },
    );

    const reason = await reasonOf(() => runner.migrateToLatest());
    const alsText = JSON.stringify(reason);
    expect(alsText).not.toContain(dir);
    expect(alsText).not.toContain('takt.db');
    expect(alsText).not.toContain('/');
    expect(alsText).not.toContain('\\');
  });
});

/**
 * Übernahme unit-tester: Lücke geschlossen.
 *
 * Die drei Riegel `errorCodeOf`, `sqliteResultCodeOf` und `isBusyResultCode`
 * sind öffentliche Ausfuhren von `@takt/storage` (`packages/storage/src/index.ts`)
 * und wurden bisher nur **mittelbar** gemessen — über Fälle, in denen
 * `node:sqlite` von sich aus ausschließlich echte, wohlgeformte Werte liefert
 * (`ERR_SQLITE_ERROR`, `ENOSPC`, …). Kein bestehender Fall zwingt den Riegel,
 * einen **schlecht geformten** Wert abzuweisen — genau die Aufgabe, für die er
 * da ist (`migration.ts`: „auch dann nicht, wenn eine Bibliothek eines Tages
 * etwas anderes in `code` schreibt"). Diese beiden Blöcke messen den Riegel
 * direkt, mit Werten, die kein SQLite-Fehler je liefert.
 */
describe('T-132 — errorCodeOf lässt nur echte Fehlerschlüssel durch', () => {
  it('ein echter Fehlerschlüssel kommt unverändert durch', () => {
    expect(errorCodeOf({ code: 'ENOENT' })).toBe('ENOENT');
    expect(errorCodeOf({ code: 'ERR_SQLITE_ERROR' })).toBe('ERR_SQLITE_ERROR');
  });

  it('kein Wurf, kein Objekt, kein `code` — jeweils null', () => {
    expect(errorCodeOf(null)).toBeNull();
    expect(errorCodeOf(undefined)).toBeNull();
    expect(errorCodeOf('nur ein Text')).toBeNull();
    expect(errorCodeOf({})).toBeNull();
    expect(errorCodeOf({ code: 42 })).toBeNull();
  });

  it('ein Pfad, ein Satz oder ein Geheimnis in `code` werden zu null, nie durchgereicht', () => {
    // "Geheimnis": eine zufällige, großbuchstabige Zeichenkette, wie ein
    // Sitzungstoken es sein könnte, wenn es großgeschrieben würde — die Form
    // allein reicht nicht, die Länge muss auch passen.
    const geheimnisAehnlich = 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0';
    expect(errorCodeOf({ code: geheimnisAehnlich })).toBeNull();
    expect(errorCodeOf({ code: '/home/jemand/.local/share/takt/takt.db' })).toBeNull();
    expect(errorCodeOf({ code: 'Der Bestand ist belegt.' })).toBeNull();
    expect(errorCodeOf({ code: 'enoent' })).toBeNull(); // Kleinbuchstaben: kein echter Node-Schlüssel
    expect(errorCodeOf({ code: 'A'.repeat(33) })).toBeNull(); // eins über der Grenze
    expect(errorCodeOf({ code: 'A'.repeat(32) })).toBe('A'.repeat(32)); // genau an der Grenze
  });
});

describe('T-132 — sqliteResultCodeOf und isBusyResultCode', () => {
  it('nur eine ganze, sichere Zahl an `errcode` wird zum Ergebniskennzeichen', () => {
    expect(sqliteResultCodeOf({ errcode: 5 })).toBe(5);
    expect(sqliteResultCodeOf({ errcode: '5' })).toBeNull(); // Zeichenkette, keine Zahl
    expect(sqliteResultCodeOf({ errcode: 5.5 })).toBeNull(); // nicht ganzzahlig
    expect(sqliteResultCodeOf({})).toBeNull();
    expect(sqliteResultCodeOf(null)).toBeNull();
  });

  it('belegt (5) und gesperrt (6) gelten als busy — auch in ihrer erweiterten Form', () => {
    expect(isBusyResultCode(5)).toBe(true); // SQLITE_BUSY
    expect(isBusyResultCode(6)).toBe(true); // SQLITE_LOCKED
    expect(isBusyResultCode(517)).toBe(true); // SQLITE_BUSY_SNAPSHOT (0x205)
    expect(isBusyResultCode(261)).toBe(true); // SQLITE_BUSY_RECOVERY (0x105)
    expect(isBusyResultCode(11)).toBe(false); // SQLITE_CORRUPT
    expect(isBusyResultCode(26)).toBe(false); // SQLITE_NOTADB
    expect(isBusyResultCode(null)).toBe(false);
  });
});
