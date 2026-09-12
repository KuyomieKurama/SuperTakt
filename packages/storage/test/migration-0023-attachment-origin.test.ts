/**
 * Takt — T-316 (unit-tester), A-A-98/Gegenprobe 3: Migration 0023
 * "attachment_origin" zurück auf 22 und wieder vor auf 23 — und die
 * Eigentümerfrage des Aufräumlaufs bleibt dabei unversehrt (T-313-3,
 * T-314-domain-dev.md Abschnitt 1 und 2, Migration 0023 Rückweg-Kommentar).
 *
 * ---------------------------------------------------------------------------
 * Was T-313-3 gemessen hat, und was hier nachgewiesen wird
 * ---------------------------------------------------------------------------
 *
 * Der Rückweg von 0023 läßt die Spalte `origin` fallen; die Hinrichtung legt
 * sie mit `DEFAULT 'user'` wieder an. Vor A-A-98 hing die Eigentümerfrage des
 * Aufräumlaufs (`attachmentsNamingFiles`/`emailFileCount`) an
 * `origin = 'email' AND kind = 'file'` — nach einem Rückweg-und-wieder-vor
 * stand jede vormals übernommene E-Mail-Datei plötzlich als `origin = 'user'`
 * da und wurde beim nächsten Start als Waise gelöscht (`{read:2, owned:0,
 * removed:2}`, T-313 Meßtabelle Fläche 1).
 *
 * Seit A-A-98 fragt `attachmentsNamingFiles` gar nicht mehr nach `origin` —
 * dieser Test fährt den Rückweg wirklich (nicht nur gelesen) und zeigt, daß
 * die Zeile danach immer noch als Eigentümer gefunden wird, obwohl ihr
 * `origin` jetzt `'user'` lautet.
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

describe('Migration 0023 "attachment_origin" — zurück und vor: die Eigentümerfrage bleibt unversehrt (A-A-98, T-313-3)', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('eine übernommene E-Mail-Datei ist nach dem Rückweg auf 22 und wieder vor auf 23 weiterhin ihr Eigentümer', async () => {
    conn = openConnection(':memory:');
    const migrations = loadMigrations(REAL_MIGRATIONS_DIR);
    const originMigration = migrations.find((m) => m.name === 'attachment_origin');
    expect(originMigration).toBeDefined();
    if (originMigration === undefined) return;
    const priorVersion = originMigration.version - 1;

    const runner = createMigrationRunner(conn, migrations, {
      databasePath: null,
      now: fixedNow('2026-08-31T08:00:00Z'),
    });

    // ---------------------------------------------------------------------
    // 0. Vorwärts auf den vollständigen Bestand und eine übernommene
    //    E-Mail-Datei anlegen, über den echten Adapter.
    // ---------------------------------------------------------------------
    await runner.migrateToLatest();
    const unit = createUnitOfWork(conn, { ids: fakeIds('mig23') });
    const todo = await unit.todos.create(
      { title: 'Testtodo', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    const target = 'C:\\App\\email-attachments\\aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml';
    const created = await unit.attachments.create({
      todoId: todo.id,
      kind: 'file',
      title: null,
      origin: 'email',
      target,
      now: NOW,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const vorher = conn.prepare('SELECT origin FROM todo_attachment WHERE id = ?').get(created.value.id);
    expect(vorher?.['origin']).toBe('email');
    expect((await unit.attachments.attachmentsNamingFiles(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml'])).has(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml',
    )).toBe(true);
    expect(await unit.attachments.emailFileCount()).toBe(1);

    // ---------------------------------------------------------------------
    // 1. Rückweg auf die Fassung vor 0023 — die Spalte `origin` fällt.
    // ---------------------------------------------------------------------
    const down = await runner.migrateDownTo(priorVersion);
    expect(down.to).toBe(priorVersion);
    expect(() => conn.prepare('SELECT origin FROM todo_attachment').get()).toThrow(/no such column/);

    // ---------------------------------------------------------------------
    // 2. Wieder vor auf 0023: DEFAULT 'user' legt die Spalte neu an — genau
    //    der Zustand, den T-313-3 gemessen hat.
    // ---------------------------------------------------------------------
    const up = await runner.migrateToLatest();
    expect(up.to).toBe(migrations.at(-1)?.version);
    const nachher = conn.prepare('SELECT origin FROM todo_attachment WHERE id = ?').get(created.value.id);
    expect(nachher?.['origin']).toBe('user');

    // ---------------------------------------------------------------------
    // 3. Die Eigentümerfrage findet die Datei TROTZDEM — A-A-98 fragt nicht
    //    mehr nach origin. Vor A-A-98 wäre "owned" hier leer gewesen und die
    //    Datei beim nächsten Start als Waise gelöscht worden.
    // ---------------------------------------------------------------------
    const unitAfter = createUnitOfWork(conn, { ids: fakeIds('mig23-nach') });
    const owned = await unitAfter.attachments.attachmentsNamingFiles([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml',
    ]);
    expect(owned.has('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml')).toBe(true);

    // emailFileCount() hingegen zählt jetzt bewusst 0 -- sie fragt weiterhin
    // origin='email' AND kind='file' (A-A-98 läßt ihre Enge unangetastet,
    // T-314-domain-dev.md Abschnitt 1.2: "ihre Enge ist hier die
    // Eigenschaft, nicht der Fehler"). Der Rückweg kostet die
    // Unterscheidbarkeit der Herkunft, nicht die Datei.
    expect(await unitAfter.attachments.emailFileCount()).toBe(0);

    const integrity = conn.prepare('PRAGMA integrity_check').get();
    expect(integrity?.['integrity_check']).toBe('ok');
    expect(conn.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });
});
