/**
 * Takt — T-010b, `v_export_candidate` gegen ein echtes Schema (R-06, R-10, A-6.8, A-6.9, A-8.8).
 *
 * `packages/storage/test/` existierte bislang nicht (T-010 hat das begründet
 * ausgelassen, siehe `.claude/team/reports/T-009-domain-dev.md`, Abschnitt
 * "Risiken": "R-10 bleibt scharf. Die Domäne rechnet korrekt über das, was sie
 * bekommt. Ob sie nur offene Buchungen bekommt, entscheidet
 * `v_export_candidate` — also SQL, nicht diese Regeln.").
 *
 * `groupExportCandidates` in `packages/domain/src/export.ts` filtert bewusst
 * NICHT nach Exportstatus — der Kommentar dort sagt wörtlich, dass genau diese
 * Sicht die Filterung trägt. Fällt hier eine bereits exportierte oder eine
 * noch laufende (verwaiste, E-036) Buchung durch, rechnet die Anwendung sie
 * ein zweites Mal ab bzw. vierzehn Stunden zu viel — und die Domäne hat keine
 * Möglichkeit, das zu bemerken, weil sie nur sieht, was diese Sicht liefert.
 *
 * Läuft gegen ein echtes `node:sqlite` mit allen vier Migrationen, nicht gegen
 * eine Attrappe (siehe `support/migrated-database.ts`).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { insertTimeEntry, insertTodo, openMigratedDatabase } from './support/migrated-database.js';

function candidateIds(db: DatabaseSync): readonly string[] {
  return (db.prepare('SELECT time_entry_id FROM v_export_candidate ORDER BY time_entry_id').all() as Array<{
    time_entry_id: string;
  }>).map((row) => row.time_entry_id);
}

describe('v_export_candidate — die einzige Sicht, die der Export liest (R-06, R-10)', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = openMigratedDatabase();
    insertTodo(db, { id: 'todo-1' });
  });

  afterEach(() => {
    db.close();
  });

  it('eine offene, abgeschlossene Buchung erscheint als Kandidat', () => {
    insertTimeEntry(db, { id: 'te-open', todoId: 'todo-1', startedAt: '2026-08-31T08:00:00Z', endedAt: '2026-08-31T08:15:00Z' });

    expect(candidateIds(db)).toEqual(['te-open']);
  });

  it('eine bereits exportierte Buchung erscheint NICHT — sonst würde dieselbe Zeit ein zweites Mal abgerechnet (R-10)', () => {
    insertTimeEntry(db, { id: 'te-open', todoId: 'todo-1', startedAt: '2026-08-31T08:00:00Z', endedAt: '2026-08-31T08:15:00Z' });
    insertTimeEntry(db, {
      id: 'te-exported',
      todoId: 'todo-1',
      startedAt: '2026-08-31T09:00:00Z',
      endedAt: '2026-08-31T09:15:00Z',
      exportStatus: 'exported',
      exportCount: 1,
    });

    // Die exportierte Buchung existiert (sie steht in time_entry), taucht aber
    // in der Kandidatensicht nicht auf — eine Umsetzung, die stattdessen "der
    // Vollständigkeit halber" alle Buchungen des Tages liest, würde sie hier
    // fälschlich wieder aufnehmen.
    expect(candidateIds(db)).toEqual(['te-open']);
    expect(db.prepare('SELECT COUNT(*) AS n FROM time_entry').get()).toEqual({ n: 2 });
  });

  it('eine laufende, noch nicht beendete Buchung erscheint NICHT — auch nicht mit Lebenszeichen (E-036)', () => {
    // Genau der Fall eines verwaisten Timers: `ended_at` ist NULL, weil die
    // Anwendung abgestürzt ist, bevor der Benutzer geantwortet hat. Ein
    // Lebenszeichen sagt nur, bis wohin höchstens gebucht werden DÜRFTE, wenn
    // der Benutzer sich entscheidet — es macht die Buchung nicht exportierbar.
    insertTimeEntry(db, { id: 'te-open', todoId: 'todo-1', startedAt: '2026-08-31T08:00:00Z', endedAt: '2026-08-31T08:15:00Z' });
    insertTimeEntry(db, { id: 'te-running', todoId: 'todo-1', startedAt: '2026-08-31T22:00:00Z', endedAt: null });
    db.prepare('INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)').run(
      'te-running',
      '2026-08-31T22:05:00Z',
    );

    expect(candidateIds(db)).toEqual(['te-open']);
  });

  it('solange die Frage "bis Lebenszeichen buchen oder verwerfen" unbeantwortet ist, bleibt die Buchung unvollständig und exportfrei', () => {
    // Deckt genau das Szenario aus der Begründung von E-036 ab: ein über Nacht
    // vergessener Timer (hier 22:00 Uhr gestartet, kein ended_at) darf nicht
    // vierzehn Stunden später stillschweigend in eine Rechnung geraten, nur
    // weil ein Export dazwischen läuft.
    insertTimeEntry(db, { id: 'te-forgotten', todoId: 'todo-1', startedAt: '2026-08-31T22:00:00Z', endedAt: null });

    expect(candidateIds(db)).toEqual([]);
    expect(db.prepare('SELECT openCount FROM (SELECT COUNT(*) AS openCount FROM v_export_candidate)').get()).toEqual({
      openCount: 0,
    });
  });

  it('ein zurückgesetzter Exportstatus (E-012) lässt die Buchung wieder als Kandidat erscheinen (R-10)', () => {
    insertTimeEntry(db, {
      id: 'te-reset',
      todoId: 'todo-1',
      startedAt: '2026-08-31T09:00:00Z',
      endedAt: '2026-08-31T09:15:00Z',
      exportStatus: 'exported',
      exportCount: 1,
    });
    expect(candidateIds(db)).toEqual([]);

    // E-032: das Ergebnis eines Resets ist derselbe Wert "open" wie bei einer
    // nie exportierten Buchung — kein dritter Status, den diese Sicht extra
    // behandeln müsste.
    db.prepare("UPDATE time_entry SET export_status = 'open' WHERE id = 'te-reset'").run();

    expect(candidateIds(db)).toEqual(['te-reset']);
  });

  it('die Sicht führt keine Spalte, die den internen Vermerk des Todos preisgeben würde (A-7.2, R-06)', () => {
    const columns = (db.prepare('PRAGMA table_info(v_export_candidate)').all() as Array<{ name: string }>).map(
      (row) => row.name,
    );

    expect(columns).not.toContain('body'); // todo_note.body
    expect(columns.some((name) => /note/i.test(name) && name !== 'booking_note')).toBe(false);
    expect(columns).toContain('booking_note'); // die Leistung (A-7.3) darf sichtbar sein
  });

  it('kein Zustand außer "open" und "exported" ist für export_status erreichbar (Schema-Rückhalt zu A-6.9)', () => {
    insertTimeEntry(db, { id: 'te-x', todoId: 'todo-1', startedAt: '2026-08-31T08:00:00Z', endedAt: '2026-08-31T08:15:00Z' });

    expect(() =>
      db.prepare("UPDATE time_entry SET export_status = 'pending' WHERE id = 'te-x'").run(),
    ).toThrow(/CHECK constraint failed/);
  });
});

describe('ux_time_entry_running — höchstens ein laufender Timer gleichzeitig (A-6.8)', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = openMigratedDatabase();
    insertTodo(db, { id: 'todo-a' });
    insertTodo(db, { id: 'todo-b' });
  });

  afterEach(() => {
    db.close();
  });

  it('ein zweiter laufender Timer wird abgewiesen, selbst auf einem anderen Todo', () => {
    insertTimeEntry(db, { id: 'te-running-1', todoId: 'todo-a', startedAt: '2026-08-31T08:00:00Z', endedAt: null });

    expect(() =>
      insertTimeEntry(db, { id: 'te-running-2', todoId: 'todo-b', startedAt: '2026-08-31T09:00:00Z', endedAt: null }),
    ).toThrow(/UNIQUE constraint failed/);
  });

  it('nach Beenden des ersten Timers lässt sich ein neuer starten', () => {
    insertTimeEntry(db, { id: 'te-running-1', todoId: 'todo-a', startedAt: '2026-08-31T08:00:00Z', endedAt: null });
    db.prepare("UPDATE time_entry SET ended_at = '2026-08-31T08:30:00Z' WHERE id = 'te-running-1'").run();

    expect(() =>
      insertTimeEntry(db, { id: 'te-running-2', todoId: 'todo-b', startedAt: '2026-08-31T09:00:00Z', endedAt: null }),
    ).not.toThrow();
  });

  it('Gegenprobe: beliebig viele bereits beendete Buchungen dürfen nebeneinander bestehen — der Index greift nur bei ended_at IS NULL', () => {
    insertTimeEntry(db, { id: 'te-1', todoId: 'todo-a', startedAt: '2026-08-31T08:00:00Z', endedAt: '2026-08-31T08:10:00Z' });
    insertTimeEntry(db, { id: 'te-2', todoId: 'todo-a', startedAt: '2026-08-31T09:00:00Z', endedAt: '2026-08-31T09:10:00Z' });
    insertTimeEntry(db, { id: 'te-3', todoId: 'todo-b', startedAt: '2026-08-31T10:00:00Z', endedAt: '2026-08-31T10:10:00Z' });

    expect(db.prepare('SELECT COUNT(*) AS n FROM time_entry').get()).toEqual({ n: 3 });
  });
});

describe('trg_time_entry_locked / trg_time_entry_no_delete_exported — eine exportierte Buchung ist gesperrt (A-6.9)', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = openMigratedDatabase();
    insertTodo(db, { id: 'todo-1' });
    insertTimeEntry(db, {
      id: 'te-exported',
      todoId: 'todo-1',
      startedAt: '2026-08-31T08:00:00Z',
      endedAt: '2026-08-31T08:15:00Z',
      exportStatus: 'exported',
      exportCount: 1,
    });
  });

  afterEach(() => {
    db.close();
  });

  it('Notiz, Start, Ende oder Todo-Zuordnung einer exportierten Buchung lassen sich nicht mehr ändern', () => {
    expect(() => db.prepare("UPDATE time_entry SET note = 'nachträglich' WHERE id = 'te-exported'").run()).toThrow(
      /time_entry_locked/,
    );
  });

  it('eine exportierte Buchung lässt sich nicht löschen — sie wird zurückgesetzt, nicht entfernt (R-10)', () => {
    expect(() => db.prepare("DELETE FROM time_entry WHERE id = 'te-exported'").run()).toThrow(/time_entry_locked/);
  });

  it('der Exportstatus selbst bleibt änderbar — sonst ließe sich E-012 nicht umsetzen', () => {
    expect(() => db.prepare("UPDATE time_entry SET export_status = 'open' WHERE id = 'te-exported'").run()).not.toThrow();
  });
});

describe('Transaktion — ein abgebrochener Export hinterlässt keinen Zwischenzustand (A-8.8)', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = openMigratedDatabase();
    insertTodo(db, { id: 'todo-1' });
    insertTimeEntry(db, { id: 'te-1', todoId: 'todo-1', startedAt: '2026-08-31T08:00:00Z', endedAt: '2026-08-31T08:15:00Z' });
  });

  afterEach(() => {
    db.close();
  });

  it('ein ROLLBACK nach dem Markieren als exportiert lässt die Buchung wieder offen und unverändert zurück', () => {
    db.exec('BEGIN');
    db.prepare("UPDATE time_entry SET export_status = 'exported', export_count = export_count + 1 WHERE id = 'te-1'").run();
    db.exec('ROLLBACK');

    expect(db.prepare('SELECT export_status, export_count FROM time_entry WHERE id = ?').get('te-1')).toEqual({
      export_status: 'open',
      export_count: 0,
    });
    expect(candidateIds(db)).toEqual(['te-1']);
  });
});
