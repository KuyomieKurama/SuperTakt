/**
 * Takt — T-032, Migration 0006: kein Exportstatus ohne Herkunft (E-047, E-032, R-10).
 *
 * Zweiter Rest aus dem T-029-Bericht (Abschnitt "Offene Fragen", Punkt 1). Der
 * Adapter (`markNotBilled` in `repo-export.ts`) ist in `repo-export.test.ts`
 * geprüft. Diese Datei prüft die Zusage eine Ebene tiefer, die `markNotBilled`
 * erst möglich macht und die auch dann noch gilt, wenn ein künftiger Aufrufer
 * sie über den Port herum umgeht: `trg_time_entry_exported_needs_provenance`
 * aus Migration 0006 — direkt am Schema, mit derselben Methode wie
 * `export-candidate-view.test.ts`: eine rohe `UPDATE`-Anweisung, die ohne den
 * Trigger durchginge und mit ihm nicht.
 *
 * Dazu die Kehrseite derselben Migration: `migrateDownTo` muss abbrechen,
 * solange eine `not_billed`-Zeile im Protokoll steht — die Rückwärtsdatei
 * dürfte sie sonst nur verwerfen oder zu einem erfundenen Export umdeuten, und
 * beides wäre eine Falschaussage (siehe Kopfkommentar der Rückwärtsdatei).
 *
 * ---------------------------------------------------------------------------
 * ROT ZUERST, nachgewiesen und wieder zurückgenommen (T-032-Bericht)
 * ---------------------------------------------------------------------------
 *
 * Vor dem Abschluss dieser Datei wurden drei Mutationen an den (unveränderten
 * mitgelieferten) Migrationsdateien versuchsweise vorgenommen, jeweils die
 * Tests dieser Datei gefahren und die Datei danach byteweise auf den
 * Ursprungszustand zurückgesetzt (Diff bestätigt identisch):
 *
 *  1. In `0006_not_billed_audit_event.up.sql` das `WHEN`-Prädikat des
 *     Triggers `trg_time_entry_exported_needs_provenance` auf `WHEN 0`
 *     verkürzt (der Trigger feuert nie mehr). Ergebnis: genau die beiden
 *     Tests "kein Exportstatus ohne Herkunft" (kein Beleg / jüngste Zeile
 *     "reset") werden rot — die verbotene `UPDATE`-Anweisung läuft klaglos
 *     durch. Die beiden "erlaubt, wenn ..."-Tests bleiben grün, wie es sein
 *     muss: Ein zu lascher Trigger kann nichts fälschlich verbieten.
 *  2. In `0006_not_billed_audit_event.down.sql` den Wächter
 *     `_rollback_0006_guard` durch `INSERT INTO _rollback_0006_guard (ok)
 *     VALUES (1);` ersetzt (Zählung entfällt vollständig). Ergebnis:
 *     `migrateDownTo` bricht **trotzdem** ab — aber mit
 *     `CHECK constraint failed: event IN ('exported', 'reset')` statt mit
 *     `rollback_0006_only_without_not_billed`, weil die kopierte Zeile mit
 *     `event = 'not_billed'` den alten, wiederhergestellten CHECK aus 0001
 *     verletzt. Der Test dieser Datei prüft ausdrücklich auf die **sprechende**
 *     Meldung des Wächters (genau der Grund, den der Kopfkommentar der
 *     Rückwärtsdatei für den Wächter nennt: "ein sprechender Abbruch statt
 *     eines rohen CHECK-Fehlers mitten im Kopieren") und wird deshalb rot.
 *  3. Denselben Wächter stattdessen durch ein stilles
 *     `DELETE FROM export_audit WHERE event = 'not_billed';` ersetzt, um zu
 *     prüfen, ob sich die Zeile so unbemerkt beseitigen ließe. Ergebnis:
 *     `export_audit` ist selbst gegen DELETE gesperrt
 *     (`trg_export_audit_no_delete`, Migration 0006) — der Versuch scheitert
 *     mit `append_only`, ebenfalls nicht mit der erwarteten Meldung, also
 *     wieder rot.
 *
 * Nach jeder Mutation wurden beide Migrationsdateien wortgleich
 * wiederhergestellt (`diff` bestätigt Identität) und alle sieben Tests dieser
 * Datei erneut grün gefahren. Details siehe Bericht T-032, Abschnitt
 * "Rot zuerst".
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { openConnection, type SqlConnection } from '../src/sqlite/database.ts';
import { createMigrationRunner, loadMigrations } from '../src/sqlite/migration-runner.ts';
import { createUnitOfWork } from '../src/sqlite/unit-of-work.ts';
import { BUILTIN_TEMPLATE_ID } from './support/migrated-database.js';
import { NOW, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

const REAL_MIGRATIONS_DIR = new URL('../migrations', import.meta.url).pathname;
const fixedNow =
  (iso: string) =>
  (): Timestamp =>
    iso as Timestamp;

async function seedOpenBooking(db: TestDatabase) {
  const todo = await db.unit.todos.create(
    { title: 'Kundenauftrag', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
    [],
  );
  const created = await db.unit.timeEntries.create(
    { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:30:00Z'), note: 'Leistung' },
    NOW,
  );
  if (!created.ok) throw new Error('Vorbedingung fehlgeschlagen');
  return { todo, entry: created.value };
}

describe('trg_time_entry_exported_needs_provenance — kein Exportstatus ohne Herkunft (Migration 0006)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('eine offene Buchung ohne jede Protokollzeile lässt sich nicht per rohem UPDATE auf "exported" setzen', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    expect(() =>
      db.conn.prepare("UPDATE time_entry SET export_status = 'exported' WHERE id = ?").run(entry.id),
    ).toThrow(/export_status_not_settable/);

    // Kein Zwischenzustand: der Wurf kam aus dem Trigger, bevor irgendetwas
    // geschrieben wurde.
    const row = db.conn.prepare('SELECT export_status FROM time_entry WHERE id = ?').get(entry.id);
    expect(row?.['export_status']).toBe('open');
  });

  it('auch dann nicht, wenn die jüngste Protokollzeile "reset" ist — eine alte Ausbuchung rechtfertigt keine neue', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);

    const recorded = await db.unit.export.recordRun({
      templateId: BUILTIN_TEMPLATE_ID as never,
      templateSnapshot: { fields: ['Call', 'Zeit', 'Notiz', 'WindowsUser'] },
      filePath: '/exporte/2026-08-31.txt',
      fileSha256: 'a'.repeat(64),
      bytes: 42,
      roundingMode: 'up',
      windowsUser: 't.beispiel',
      now: ts('2026-08-31T09:00:00Z'),
      groups: [
        {
          todoId: todo.id,
          day: '2026-08-31' as never,
          seconds: 1800,
          quarters: 2,
          entries: [{ timeEntryId: entry.id, durationSeconds: 1800 }],
        },
      ],
    });
    expect(recorded.ok).toBe(true);

    const reset = await db.unit.export.resetStatus({
      timeEntryId: entry.id,
      reason: '',
      actor: 't.beispiel',
      now: ts('2026-08-31T10:00:00Z'),
    });
    expect(reset.ok).toBe(true);

    // Die jüngste Protokollzeile ist jetzt "reset" (nicht "not_billed") — das
    // rohe UPDATE bleibt verboten.
    expect(() =>
      db.conn.prepare("UPDATE time_entry SET export_status = 'exported' WHERE id = ?").run(entry.id),
    ).toThrow(/export_status_not_settable/);
  });

  it('erlaubt, wenn die jüngste Protokollzeile "not_billed" ist — genau der Weg, den markNotBilled selbst geht', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    db.conn
      .prepare(
        `INSERT INTO export_audit
           (id, time_entry_id, event, previous_status, new_status, export_run_id, export_run_group_id, actor, reason, occurred_at)
         VALUES (?, ?, 'not_billed', 'open', 'exported', NULL, NULL, ?, ?, ?)`,
      )
      .run('audit-manuell-1', entry.id, 't.beispiel', 'Kulanz', NOW);

    expect(() =>
      db.conn.prepare("UPDATE time_entry SET export_status = 'exported' WHERE id = ?").run(entry.id),
    ).not.toThrow();

    const row = db.conn.prepare('SELECT export_status FROM time_entry WHERE id = ?').get(entry.id);
    expect(row?.['export_status']).toBe('exported');
  });

  it('erlaubt, wenn export_count in derselben Anweisung mitzählt — der Weg des Exportlaufs', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    // Kein Protokolleintrag nötig: Zählt der Exportlauf mit, greift die
    // Herkunftsbedingung des Triggers nicht (NEW.export_count <> OLD.export_count).
    expect(() =>
      db.conn
        .prepare("UPDATE time_entry SET export_status = 'exported', export_count = export_count + 1 WHERE id = ?")
        .run(entry.id),
    ).not.toThrow();

    const row = db.conn.prepare('SELECT export_status, export_count FROM time_entry WHERE id = ?').get(entry.id);
    expect(row).toEqual({ export_status: 'exported', export_count: 1 });
  });
});

describe('migrateDownTo — eine "not_billed"-Zeile lässt Migration 0006 nicht zurücknehmen', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('bricht ab, solange eine Protokollzeile mit event="not_billed" existiert — der Bestand bleibt auf Fassung 6', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });
    await runner.migrateToLatest();

    const unit = createUnitOfWork(conn);
    const todo = await unit.todos.create(
      { title: 'Kundenauftrag', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const created = await unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:30:00Z'), note: 'Leistung' },
      NOW,
    );
    if (!created.ok) throw new Error('Vorbedingung fehlgeschlagen');

    // Genau der Vorgang, dessen Adapter in repo-export.test.ts geprüft ist —
    // hier gebaut über dieselbe migrationsläufer-gestützte Verbindung, damit
    // migrateDownTo im Anschluss auf einem echten, verfolgten Bestand läuft.
    const notBilled = await unit.export.markNotBilled({
      timeEntryId: created.value.id,
      reason: '',
      actor: 't.beispiel',
      now: NOW,
    });
    expect(notBilled.ok).toBe(true);

    await expect(runner.migrateDownTo(5)).rejects.toThrow(/rollback_0006_only_without_not_billed/);

    // Kein Zwischenzustand — und die Fassung, auf der die Rücknahme gehalten
    // hat, ist die von 0006. Der Läufer fährt jede Migration in einer **eigenen**
    // Transaktion (siehe `applyOne`), also läuft der Abstieg von 7 sauber bis 6
    // und bricht **dort** ab. Geprüft wird deshalb, was hier zur Sache gehört:
    // 0006 ist weiterhin angewandt, 0007 nicht mehr. Eine ausgeschriebene
    // Höchstfassung stünde hier nur so lange richtig, bis die nächste Migration
    // dazukommt (T-047).
    const applied = (await runner.applied()).map((row) => row.version);
    expect(applied).toContain(6);
    expect(applied).not.toContain(7);
  });

  it('eine per Exportlauf exportierte Buchung (export_count >= 1) hält die Rücknahme nicht auf — nur die Ausbuchung ohne Beleg tut das', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });
    await runner.migrateToLatest();

    const unit = createUnitOfWork(conn);
    const todo = await unit.todos.create(
      { title: 'Kundenauftrag', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const created = await unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:30:00Z'), note: 'Leistung' },
      NOW,
    );
    if (!created.ok) throw new Error('Vorbedingung fehlgeschlagen');

    const recorded = await unit.export.recordRun({
      templateId: BUILTIN_TEMPLATE_ID as never,
      templateSnapshot: { fields: ['Call', 'Zeit', 'Notiz', 'WindowsUser'] },
      filePath: '/exporte/2026-08-31.txt',
      fileSha256: 'a'.repeat(64),
      bytes: 42,
      roundingMode: 'up',
      windowsUser: 't.beispiel',
      now: ts('2026-08-31T09:00:00Z'),
      groups: [
        {
          todoId: todo.id,
          day: '2026-08-31' as never,
          seconds: 1800,
          quarters: 2,
          entries: [{ timeEntryId: created.value.id, durationSeconds: 1800 }],
        },
      ],
    });
    expect(recorded.ok).toBe(true);

    await expect(runner.migrateDownTo(5)).resolves.toMatchObject({ to: 5 });
  });

  it('läuft ohne eine "not_billed"-Zeile ungehindert auf Fassung 5 zurück und wieder ganz nach oben (Gegenprobe)', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    // Die Höchstfassung wird **ausgerechnet** und nicht hingeschrieben (T-058).
    // Hier stand `7`, davor `6`: Jede neue Migration hat diesen Fall gebrochen,
    // ohne dass an seiner Aussage etwas falsch geworden wäre. Gemeint ist „nach
    // dem Rückweg wieder ganz nach oben", nicht „auf die Zahl sieben".
    const latest = migrations.reduce((max, entry) => Math.max(max, entry.version), 0);
    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });
    await runner.migrateToLatest();

    const down = await runner.migrateDownTo(5);
    expect(down.to).toBe(5);

    const up = await runner.migrateToLatest();
    expect(up.to).toBe(latest);
    expect(await runner.state()).toEqual({ kind: 'current', version: latest });
  });
});
