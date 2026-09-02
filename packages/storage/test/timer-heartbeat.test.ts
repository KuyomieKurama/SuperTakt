/**
 * Takt — T-010b, `timer_heartbeat` gegen ein echtes Schema (E-036).
 *
 * Migration 0003 ist neu seit T-009 und hatte noch keinen Test in diesem
 * Repository — der domain-dev hat sein Nachweisskript außerhalb des
 * Repositorys laufen lassen ("nicht dauerhaft", siehe
 * `.claude/team/reports/T-009-domain-dev.md`).
 *
 * Diese Datei prüft die drei Eigenschaften, auf die sich
 * `decideOrphanedTimer` in `packages/domain/src/time-entry.ts` verlässt, ohne
 * sie selbst zu kennen: Ein Lebenszeichen existiert nur für eine tatsächlich
 * laufende Buchung, es lässt sich fortschreiben, und es verschwindet mit der
 * Buchung, die es begleitet.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { insertTimeEntry, insertTodo, openMigratedDatabase } from './support/migrated-database.js';

describe('timer_heartbeat — nur für einen tatsächlich laufenden Timer (E-036)', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = openMigratedDatabase();
    insertTodo(db, { id: 'todo-1' });
  });

  afterEach(() => {
    db.close();
  });

  it('ein Lebenszeichen für eine laufende Buchung lässt sich schreiben', () => {
    insertTimeEntry(db, { id: 'te-running', todoId: 'todo-1', startedAt: '2026-08-31T22:00:00Z', endedAt: null });

    expect(() =>
      db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
        'te-running',
        '2026-08-31T22:01:00Z',
      ),
    ).not.toThrow();
    expect(db.prepare('SELECT seen_at FROM timer_heartbeat WHERE time_entry_id = ?').get('te-running')).toEqual({
      seen_at: '2026-08-31T22:01:00Z',
    });
  });

  it('ein Lebenszeichen für eine bereits beendete Buchung wird abgewiesen (INSERT)', () => {
    insertTimeEntry(db, { id: 'te-ended', todoId: 'todo-1', startedAt: '2026-08-31T08:00:00Z', endedAt: '2026-08-31T08:15:00Z' });

    expect(() =>
      db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
        'te-ended',
        '2026-08-31T08:10:00Z',
      ),
    ).toThrow(/timer_not_running/);
  });

  it('das Lebenszeichen lässt sich fortschreiben (touch), solange der Timer noch läuft — jede Minute mindestens einmal (E-036)', () => {
    insertTimeEntry(db, { id: 'te-running', todoId: 'todo-1', startedAt: '2026-08-31T22:00:00Z', endedAt: null });
    db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
      'te-running',
      '2026-08-31T22:01:00Z',
    );

    db.prepare('UPDATE timer_heartbeat SET seen_at = ? WHERE time_entry_id = ?').run(
      '2026-08-31T22:02:00Z',
      'te-running',
    );

    expect(db.prepare('SELECT seen_at FROM timer_heartbeat WHERE time_entry_id = ?').get('te-running')).toEqual({
      seen_at: '2026-08-31T22:02:00Z',
    });
  });

  it('ein Lebenszeichen lässt sich nicht mehr fortschreiben, sobald die Buchung beendet wurde (UPDATE)', () => {
    insertTimeEntry(db, { id: 'te-running', todoId: 'todo-1', startedAt: '2026-08-31T22:00:00Z', endedAt: null });
    db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
      'te-running',
      '2026-08-31T22:01:00Z',
    );

    // Der Timer wird gestoppt (z. B. weil der Benutzer die verwaiste Buchung
    // per decideOrphanedTimer aufgelöst hat) — danach ist jedes weitere
    // Lebenszeichen sinnlos und ein Hinweis auf einen Fehler im Adapter.
    db.prepare("UPDATE time_entry SET ended_at = '2026-08-31T22:03:00Z' WHERE id = 'te-running'").run();

    expect(() =>
      db.prepare('UPDATE timer_heartbeat SET seen_at = ? WHERE time_entry_id = ?').run(
        '2026-08-31T22:04:00Z',
        'te-running',
      ),
    ).toThrow(/timer_not_running/);
  });

  it('das Lebenszeichen verschwindet mit der Buchung, wenn diese verworfen (gelöscht) wird (ON DELETE CASCADE)', () => {
    insertTimeEntry(db, { id: 'te-running', todoId: 'todo-1', startedAt: '2026-08-31T22:00:00Z', endedAt: null });
    db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
      'te-running',
      '2026-08-31T22:01:00Z',
    );

    // Eine laufende Buchung ist nie exportiert, der Löschschutz aus A-6.9
    // greift also nicht — das Verwerfen einer zu kurzen oder abgebrochenen
    // Buchung bleibt möglich.
    db.prepare("DELETE FROM time_entry WHERE id = 'te-running'").run();

    expect(db.prepare('SELECT COUNT(*) AS n FROM timer_heartbeat').get()).toEqual({ n: 0 });
  });

  it('höchstens eine Lebenszeichen-Zeile existiert gleichzeitig — gebunden an den einen möglichen laufenden Timer (A-6.8)', () => {
    insertTimeEntry(db, { id: 'te-running', todoId: 'todo-1', startedAt: '2026-08-31T22:00:00Z', endedAt: null });
    db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
      'te-running',
      '2026-08-31T22:01:00Z',
    );

    // Ein zweites Lebenszeichen für dieselbe Buchung ist ein Primärschlüssel-
    // Konflikt, kein fachlicher Fall — touch() aktualisiert per UPDATE, fügt
    // nie ein zweites Mal ein.
    expect(() =>
      db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
        'te-running',
        '2026-08-31T22:02:00Z',
      ),
    ).toThrow(/UNIQUE constraint failed|PRIMARY KEY/);
  });
});
