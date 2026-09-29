import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase, type OpenedDatabase, type UnitOfWork } from '@takt/storage';
import type { TimeEntryId, Timestamp, TodoId } from '@takt/domain';
import type { AppContext } from '../../src/context.ts';
import { beginIdle, loadIdle, resolveIdle, returnFromIdle } from '../../src/features/timer/idle.ts';

const ts = (value: string) => value as Timestamp;

describe('A-24: Inaktivität wird erst nach einer bewussten Zuordnung gebucht', () => {
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
    context = { transactions: db.transactions, clock: { now: () => clock }, timerRecovery: { entryId: null } } as AppContext;
    first = (await unit.todos.create({ title: 'Aufgabe A', callNumber: null, statusId: null, tagIds: [], note: '', now: clock }, [])).id;
    second = (await unit.todos.create({ title: 'Aufgabe B', callNumber: null, statusId: null, tagIds: [], note: '', now: clock }, [])).id;
    const started = await unit.timer.start(first, false, ts('2026-09-08T08:00:00Z'));
    if (!started.ok) throw new Error('fixture');
    entryId = started.value.started.id;
  });
  afterEach(() => db.close());

  const begin = (returned = true) => beginIdle(context, {
    entryId,
    startedAt: ts('2026-09-08T08:10:00Z'),
    ...(returned ? { returnedAt: ts('2026-09-08T08:50:00Z') } : {}),
  });

  it('bucht weder beim Erkennen noch bei der Rückkehr automatisch und sperrt den Timer', async () => {
    expect((await begin()).ok).toBe(true);
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
    expect(await unit.timer.running()).toMatchObject({ id: entryId, startedAt: '2026-09-08T08:00:00Z' });
    expect(await loadIdle(context)).toMatchObject({ id: entryId, returnedAt: '2026-09-08T08:50:00Z' });
    expect((await unit.timer.start(second, false, clock)).ok).toBe(false);
  });

  it('blockiert eine weitere automatisch erkannte Abwesenheit bis zur Entscheidung', async () => {
    expect((await begin()).ok).toBe(true);
    clock = ts('2026-09-08T09:30:00Z');
    const result = await beginIdle(context, { entryId, startedAt: ts('2026-09-08T09:10:00Z'), returnedAt: clock });
    expect(result.ok).toBe(false);
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
  });

  it('bucht aktive und zugeordnete Zeit erst mit „Zeit buchen“ und startet danach frisch', async () => {
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

  it('bucht mit der Stopp-Option, ohne einen Timer neu zu starten', async () => {
    await begin();
    const result = await resolveIdle(context, { id: entryId, resume: false, allocations: [{ todoId: first, seconds: 2400, note: 'Arbeit' }] });
    expect(result).toMatchObject({ ok: true, value: { recordedSeconds: 2400, resumed: false } });
    expect(await unit.timer.running()).toBeNull();
    expect((await unit.timeEntries.search({})).items.map(entry => entry.durationSeconds).sort((a, b) => a - b)).toEqual([600, 2400]);
  });

  it.each([2399, 2401, 0, -1, 1.5, Number.NaN])('weist ungültige Zuordnung %s ohne Buchung ab', async seconds => {
    await begin();
    expect((await resolveIdle(context, { id: entryId, resume: true, allocations: [{ todoId: first, seconds, note: '' }] })).ok).toBe(false);
    expect(await loadIdle(context)).not.toBeNull();
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
    expect(await unit.timer.running()).toMatchObject({ id: entryId });
  });

  it('rollt die bewusste Buchung bei einem Fehler vollständig zurück', async () => {
    await begin();
    db.connection.exec("CREATE TRIGGER test_idle_failure BEFORE INSERT ON time_entry WHEN NEW.note = 'FAIL' BEGIN SELECT RAISE(ABORT, 'time_entry_locked'); END");
    const result = await resolveIdle(context, { id: entryId, resume: true, allocations: [
      { todoId: first, seconds: 1200, note: 'Erste' }, { todoId: second, seconds: 1200, note: 'FAIL' },
    ] });
    expect(result.ok).toBe(false);
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
    expect(await loadIdle(context)).not.toBeNull();
    expect(await unit.timer.running()).toMatchObject({ id: entryId, startedAt: '2026-09-08T08:00:00Z' });
  });

  it('bewahrt den angehaltenen Timer mit einer zurückgekehrten Phase im Archiv', async () => {
    await begin();
    const snapshot = await unit.dataArchive.readAll();
    await unit.idle.clear(entryId);
    await db.transactions.inTransaction(value => value.dataArchive.replaceAll(snapshot));
    expect(await unit.timer.running()).toMatchObject({ id: entryId, startedAt: '2026-09-08T08:00:00Z' });
    expect(await loadIdle(context)).toMatchObject({ id: entryId, returnedAt: '2026-09-08T08:50:00Z' });
  });

  it('behält die Rückkehr bei wiederholter Meldung ohne eine Buchung zu erzeugen', async () => {
    await begin(false);
    expect((await returnFromIdle(context, entryId, clock)).ok).toBe(true);
    expect((await returnFromIdle(context, entryId, clock)).ok).toBe(true);
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
    expect(await unit.timer.running()).toMatchObject({ id: entryId });
  });
});

it('A-24: offene Phase und Einstellungen überleben das Schließen und Wiederöffnen der Datenbank', async () => {
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
