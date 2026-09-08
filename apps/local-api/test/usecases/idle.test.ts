import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase, type OpenedDatabase, type UnitOfWork } from '@takt/storage';
import type { Timestamp } from '@takt/domain';
const ts = (value: string) => value as Timestamp;
import type { TimeEntryId, TodoId } from '@takt/domain';
import type { AppContext } from '../../src/usecases/context.ts';
import { beginIdle, loadIdle, resolveIdle, returnFromIdle } from '../../src/usecases/idle.ts';

// Real SQLite transactions: the test deliberately fails the second split write.
describe('A-24: Inaktivität und Zeitaufteilung', () => {
  let db: OpenedDatabase;
  let unit: UnitOfWork;
  let context: AppContext;
  let clock = ts('2026-09-08T08:50:00Z');
  let first: TodoId;
  let second: TodoId;
  let entryId: TimeEntryId;
  beforeEach(async () => {
    db = openDatabase({ location: ':memory:', now: () => clock });
    await db.migrations.migrateToLatest();
    unit = await db.transactions.inTransaction(value => Promise.resolve(value));
    clock = ts('2026-09-08T08:50:00Z');
    context = { transactions: db.transactions, clock: { now: () => clock } } as AppContext;
    first = (await unit.todos.create({ title: 'Aufgabe A', callNumber: null, statusId: null, tagIds: [], note: '', now: clock }, [])).id;
    second = (await unit.todos.create({ title: 'Aufgabe B', callNumber: null, statusId: null, tagIds: [], note: '', now: clock }, [])).id;
    const started = await unit.timer.start(first, false, ts('2026-09-08T08:00:00Z'));
    if (!started.ok) throw new Error('fixture');
    entryId = started.value.started.id;
  });
  afterEach(() => db.close());
  const begin = (returned = true) => beginIdle(context, { entryId, startedAt: ts('2026-09-08T08:10:00Z'), ...(returned ? { returnedAt: ts('2026-09-08T08:50:00Z') } : {}) });

  it('bucht nur aktive Zeit, pausiert und blockiert einen konkurrierenden Timer', async () => {
    expect((await begin(false)).ok).toBe(true);
    expect(await unit.timer.running()).toBeNull();
    expect((await unit.timeEntries.search({})).items.map(e => e.durationSeconds)).toEqual([600]);
    expect((await unit.timer.start(second, false, clock)).ok).toBe(false);
    expect((await loadIdle(context))?.returnedAt).toBeNull();
    expect((await returnFromIdle(context, entryId)).ok).toBe(true);
    expect((await loadIdle(context))?.returnedAt).toBe(clock);
  });

  it('teilt 40 Minuten ohne Überlappung auf Aufgaben und Pause auf und startet erst nach der Zuordnung neu', async () => {
    await begin();
    clock = ts('2026-09-08T08:51:00Z');
    const result = await resolveIdle(context, { id: entryId, resume: true, allocations: [
      { todoId: first, seconds: 1200, note: 'Telefonat' },
      { todoId: null, seconds: 600, note: '' },
      { todoId: second, seconds: 600, note: 'Besprechung' },
    ] });
    expect(result).toMatchObject({ ok: true, value: { recordedSeconds: 1800, breakSeconds: 600, resumed: true } });
    const entries = [...(await unit.timeEntries.search({})).items].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    expect(entries.map(e => [e.startedAt, e.endedAt, e.durationSeconds])).toEqual([
      ['2026-09-08T08:00:00Z', '2026-09-08T08:10:00Z', 600],
      ['2026-09-08T08:10:00Z', '2026-09-08T08:30:00Z', 1200],
      ['2026-09-08T08:40:00Z', '2026-09-08T08:50:00Z', 600],
    ]);
    expect(await unit.timer.running()).toMatchObject({ todoId: first, startedAt: clock });
    expect(await loadIdle(context)).toBeNull();
  });

  it('verwirft auf Wunsch ausschließlich die Pause und bleibt gestoppt', async () => {
    await begin();
    expect((await resolveIdle(context, { id: entryId, resume: false, allocations: [{ todoId: null, seconds: 2400, note: '' }] })).ok).toBe(true);
    expect((await unit.timeEntries.search({})).items).toHaveLength(1);
    expect(await unit.timer.running()).toBeNull();
  });

  it.each([2399, 2401, 0, -1, 1.5, Number.NaN])('weist unvollständige oder überzählige Zuordnung %s ohne Änderungen ab', async seconds => {
    await begin();
    expect((await resolveIdle(context, { id: entryId, resume: true, allocations: [{ todoId: first, seconds, note: '' }] })).ok).toBe(false);
    expect(await loadIdle(context)).not.toBeNull();
    expect((await unit.timeEntries.search({})).items).toHaveLength(1);
  });

  it('Doppelklick und Wiederholung nach verlorener Antwort erzeugen keine zweite Buchung', async () => {
    await begin();
    const input = { id: entryId, resume: true, allocations: [{ todoId: first, seconds: 2400, note: 'Arbeit' }] };
    const results = await Promise.all([resolveIdle(context, input), resolveIdle(context, input)]);
    expect(results[1]).toMatchObject({ ok: true, value: { alreadyResolved: true } });
    expect((await unit.timeEntries.search({})).items).toHaveLength(2);
  });

  it('rollt auch die erste Teilbuchung zurück, wenn die zweite scheitert', async () => {
    await begin();
    db.connection.exec("CREATE TRIGGER test_idle_failure BEFORE INSERT ON time_entry WHEN NEW.note = 'FAIL' BEGIN SELECT RAISE(ABORT, 'time_entry_locked'); END");
    const result = await resolveIdle(context, { id: entryId, resume: true, allocations: [
      { todoId: first, seconds: 1200, note: 'Erste' }, { todoId: second, seconds: 1200, note: 'FAIL' },
    ] });
    expect(result.ok).toBe(false);
    expect((await unit.timeEntries.search({})).items).toHaveLength(1);
    expect(await loadIdle(context)).not.toBeNull();
    expect(await unit.timer.running()).toBeNull();
  });

  it('weist alte Timerkennung, Zukunft und Zeiten vor dem Timerstart ab', async () => {
    for (const patch of [{ entryId: 'old' as TimeEntryId }, { startedAt: ts('2026-09-08T07:00:00Z') }, { returnedAt: ts('2026-09-08T09:00:00Z') }]) {
      expect((await beginIdle(context, { entryId, startedAt: ts('2026-09-08T08:10:00Z'), ...patch })).ok).toBe(false);
    }
    expect(await unit.timer.running()).not.toBeNull();
    expect(await loadIdle(context)).toBeNull();
  });

  it('speichert Schwelle, berücksichtigt Ausschalten und erhält eine schon offene Zuordnung', async () => {
    expect(await unit.settings.load()).toMatchObject({ idleDetectionEnabled: true, idleThresholdMinutes: 5 });
    await unit.settings.update({ idleThresholdMinutes: 60, now: clock });
    expect((await begin()).ok).toBe(false);
    await unit.settings.update({ idleThresholdMinutes: 5, now: clock });
    await begin();
    await unit.settings.update({ idleDetectionEnabled: false, now: clock });
    expect(await loadIdle(context)).not.toBeNull();
    expect((await resolveIdle(context, { id: entryId, resume: false, allocations: [{ todoId: first, seconds: 2400, note: '' }] })).ok).toBe(true);
  });

  it('sichert die noch offene Phase im Datenarchiv und stellt sie wieder her', async () => {
    await begin(false);
    const snapshot = await unit.dataArchive.readAll();
    await unit.idle.clear(entryId);
    await db.transactions.inTransaction(unit => unit.dataArchive.replaceAll(snapshot));
    expect(await loadIdle(context)).toMatchObject({ id: entryId, returnedAt: null });
  });
});

it('A-24: offener Zeitraum und Einstellungen überleben das Schließen und Wiederöffnen der Datenbank', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'supertakt-idle-'));
  const clock = ts('2026-09-08T09:00:00Z');
  const options = { location: join(folder, 'data.sqlite'), now: () => clock };
  let database = openDatabase(options);
  try {
    await database.migrations.migrateToLatest();
    await database.transactions.inTransaction(async unit => {
      const todo = await unit.todos.create({ title: 'Gespeicherte Rückkehr', callNumber: null, statusId: null, tagIds: [], note: '', now: clock }, []);
      await unit.idle.begin({ id: 'idle-persisted' as TimeEntryId, todoId: todo.id, startedAt: ts('2026-09-08T08:00:00Z'), returnedAt: null, note: 'Telefonat' });
      await unit.settings.update({ idleDetectionEnabled: false, idleThresholdMinutes: 15, now: clock });
    });
    database.close();
    database = openDatabase(options);
    await database.migrations.migrateToLatest();
    await database.transactions.inTransaction(async unit => {
      expect(await unit.idle.pending()).toMatchObject({ id: 'idle-persisted', returnedAt: null, note: 'Telefonat' });
      expect(await unit.settings.load()).toMatchObject({ idleDetectionEnabled: false, idleThresholdMinutes: 15 });
      expect(await unit.timer.running()).toBeNull();
    });
  } finally { database.close(); rmSync(folder, { recursive: true, force: true }); }
});
