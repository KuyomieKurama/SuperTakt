import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase, type OpenedDatabase, type UnitOfWork } from '@takt/storage';
import type { Timestamp } from '@takt/domain';
const ts = (value: string) => value as Timestamp;
import type { TimeEntryId, TodoId } from '@takt/domain';
import type { AppContext } from '../../src/context.ts';
import { captureTimerRecovery, loadOrphanedTimer, resolveOrphanedTimer } from '../../src/features/timer/timer.ts';
import { beginIdle, loadIdle, resolveIdle, returnFromIdle } from '../../src/features/timer/idle.ts';

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
    context = { transactions: db.transactions, clock: { now: () => clock }, timerRecovery: { entryId: null } } as AppContext;
    first = (await unit.todos.create({ title: 'Aufgabe A', callNumber: null, statusId: null, tagIds: [], note: '', now: clock }, [])).id;
    second = (await unit.todos.create({ title: 'Aufgabe B', callNumber: null, statusId: null, tagIds: [], note: '', now: clock }, [])).id;
    const started = await unit.timer.start(first, false, ts('2026-09-08T08:00:00Z'));
    if (!started.ok) throw new Error('fixture');
    entryId = started.value.started.id;
  });
  afterEach(() => db.close());
  const begin = (returned = true) => beginIdle(context, { entryId, startedAt: ts('2026-09-08T08:10:00Z'), ...(returned ? { returnedAt: ts('2026-09-08T08:50:00Z') } : {}) });

  it('collects multiple absences in one pending session without reallocating the active gap', async () => {
    expect((await begin()).ok).toBe(true);
    const continued = await unit.timer.running();
    clock = ts('2026-09-08T09:30:00Z');
    const input = { entryId: continued!.id, startedAt: ts('2026-09-08T09:10:00Z'), returnedAt: clock };
    expect((await beginIdle(context, input)).ok).toBe(true);
    expect((await beginIdle(context, input)).ok).toBe(true);
    const pending = (await loadIdle(context))!;
    expect(pending.previousPeriods).toHaveLength(1);
    expect(pending.previousPeriods?.[0]?.returnedAt).toBe('2026-09-08T08:50:00Z');
    const tables = await unit.dataArchive.readAll();
    await unit.dataArchive.replaceAll(tables);
    expect((await loadIdle(context))?.previousPeriods).toEqual(pending.previousPeriods);
    const result = await resolveIdle(context, { id: pending.id, resume: false, allocations: [
      { todoId: second, seconds: 2700, note: 'Offline gearbeitet' }, { todoId: null, seconds: 900, note: '' },
    ] });
    expect(result).toMatchObject({ ok: true, value: { recordedSeconds: 2700, breakSeconds: 900 } });
    expect(await loadIdle(context)).toBeNull();
    const entries = await unit.timeEntries.search({ todoId: second });
    expect(entries.items.map(entry => [entry.startedAt, entry.endedAt]).sort()).toEqual([
      ['2026-09-08T08:10:00Z', '2026-09-08T08:50:00Z'], ['2026-09-08T09:10:00Z', '2026-09-08T09:15:00Z'],
    ]);
    expect(await unit.timeEntries.sumSeconds({ todoId: first })).toBe(1800);
    expect((await unit.timer.running())?.startedAt).toBe(clock);
    expect(await resolveIdle(context, { id: pending.id, resume: false, allocations: [{ todoId: null, seconds: 3600, note: '' }] })).toMatchObject({ ok: true, value: { alreadyResolved: true } });
  });

  it('behandelt einen Timer aus der laufenden Dienstsitzung nicht als verwaist', async () => {
    context = { ...context, timerRecovery: { entryId: null } };
    await begin();
    expect(await loadOrphanedTimer(context)).toBeNull();
    expect((await resolveOrphanedTimer(context, 'discard')).ok).toBe(false);
    expect(await unit.timer.running()).not.toBeNull();
  });

  it('erkennt den beim Dienststart vorgefundenen Timer und schützt spätere Timer', async () => {
    context = { ...context, timerRecovery: { entryId: null } };
    await captureTimerRecovery(context);
    expect(context.timerRecovery?.entryId).toBe(entryId);
    expect(await loadOrphanedTimer(context)).toMatchObject({ running: { id: entryId } });
    expect((await resolveOrphanedTimer(context, 'discard')).ok).toBe(true);
    expect(await unit.timer.running()).toBeNull();
    const next = await unit.timer.start(second, false, clock);
    expect(next.ok).toBe(true);
    expect(await loadOrphanedTimer(context)).toBeNull();
    expect((await resolveOrphanedTimer(context, 'discard')).ok).toBe(false);
    expect(await unit.timer.running()).not.toBeNull();
  });

  it('speichert die Pausenoption und pausiert bis zur Zuordnung, ohne Dialogzeit zu buchen', async () => {
    expect((await unit.settings.load()).idleKeepTimerRunning).toBe(true);
    await unit.settings.update({ idleKeepTimerRunning: false, now: clock });
    expect((await unit.settings.load()).idleKeepTimerRunning).toBe(false);
    expect((await begin(false)).ok).toBe(true);
    expect(await unit.timer.running()).toBeNull();
    expect((await returnFromIdle(context, entryId)).ok).toBe(true);
    expect(await unit.timer.running()).toBeNull();
    clock = ts('2026-09-08T08:55:00Z');
    expect((await resolveIdle(context, { id: entryId, resume: true, allocations: [{ todoId: null, seconds: 2400, note: '' }] })).ok).toBe(true);
    expect(await unit.timer.running()).toMatchObject({ todoId: first, startedAt: clock });
    expect((await unit.timeEntries.search({})).items.map(entry => entry.durationSeconds)).toEqual([600]);
  });

  it('lässt den Timer während der Abwesenheit laufen und trennt die Zeit erst bei der Rückkehr', async () => {
    expect((await begin(false)).ok).toBe(true);
    expect(await unit.timer.running()).toMatchObject({ id: entryId, startedAt: '2026-09-08T08:00:00Z' });
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
    expect((await unit.timer.start(second, false, clock)).ok).toBe(false);
    expect((await loadIdle(context))?.returnedAt).toBeNull();
    expect((await returnFromIdle(context, entryId)).ok).toBe(true);
    expect((await loadIdle(context))?.returnedAt).toBe(clock);
    expect(await unit.timer.running()).toMatchObject({ todoId: first, startedAt: clock });
    expect((await unit.timeEntries.search({})).items.map(e => e.durationSeconds)).toEqual([600]);
  });

  it('teilt 40 Minuten ohne Überlappung auf Aufgaben und Pause auf und erfasst die Zeit während der Zuordnung weiter', async () => {
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
    expect(await unit.timer.running()).toMatchObject({ todoId: first, startedAt: '2026-09-08T08:50:00Z' });
    expect(await loadIdle(context)).toBeNull();
  });

  it('verwirft ausschließlich die Pause und lässt den laufenden Timer unverändert', async () => {
    await begin();
    expect((await resolveIdle(context, { id: entryId, resume: false, allocations: [{ todoId: null, seconds: 2400, note: '' }] })).ok).toBe(true);
    expect((await unit.timeEntries.search({})).items).toHaveLength(1);
    expect(await unit.timer.running()).toMatchObject({ todoId: first, startedAt: '2026-09-08T08:50:00Z' });
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
    expect(await unit.timer.running()).toMatchObject({ todoId: first, startedAt: '2026-09-08T08:50:00Z' });
  });

  it('erlaubt nach der Rückkehr Timerwechsel und lässt den neuen Timer bei der Zuordnung unberührt', async () => {
    await begin();
    clock = ts('2026-09-08T08:51:00Z');
    const switched = await unit.timer.start(second, true, clock);
    expect(switched.ok).toBe(true);
    const active = await unit.timer.running();
    clock = ts('2026-09-08T08:55:00Z');
    expect((await resolveIdle(context, { id: entryId, resume: false, allocations: [{ todoId: null, seconds: 2400, note: '' }] })).ok).toBe(true);
    expect(await unit.timer.running()).toEqual(active);
    expect((await unit.timeEntries.search({})).items.map(e => e.durationSeconds).sort((a, b) => a - b)).toEqual([60, 600]);
  });

  it('behält Leistung und Timer bei erneutem Rückkehr-Aufruf bei', async () => {
    db.connection.prepare('UPDATE time_entry SET note = ? WHERE id = ?').run('Laufende Leistung', entryId);
    await begin(false);
    await returnFromIdle(context, entryId, clock);
    const active = await unit.timer.running();
    expect(active?.note).toBe('Laufende Leistung');
    await returnFromIdle(context, entryId, clock);
    expect(await unit.timer.running()).toEqual(active);
    expect((await unit.timeEntries.search({})).items).toHaveLength(1);
  });

  it('rollt eine fehlgeschlagene Abtrennung einschließlich der offenen Phase zurück', async () => {
    db.connection.exec("CREATE TRIGGER test_idle_continue_failure BEFORE INSERT ON time_entry WHEN NEW.started_at = '2026-09-08T08:50:00Z' BEGIN SELECT RAISE(ABORT, 'time_entry_locked'); END");
    expect((await begin()).ok).toBe(false);
    expect(await unit.timer.running()).toMatchObject({ id: entryId, startedAt: '2026-09-08T08:00:00Z' });
    expect(await loadIdle(context)).toBeNull();
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
  });

  it('trennt eine vollständig inaktive Buchung ohne Nullsekunden-Buchung ab', async () => {
    expect((await beginIdle(context, { entryId, startedAt: ts('2026-09-08T08:00:00Z'), returnedAt: clock })).ok).toBe(true);
    expect((await unit.timeEntries.search({})).items).toHaveLength(0);
    expect(await unit.timer.running()).toMatchObject({ todoId: first, startedAt: clock });
  });

  it('stellt einen weiterlaufenden Timer zusammen mit der offenen Zuordnung aus dem Archiv wieder her', async () => {
    await begin();
    const snapshot = await unit.dataArchive.readAll();
    const running = await unit.timer.running();
    await db.transactions.inTransaction(unit => unit.dataArchive.replaceAll(snapshot));
    expect(await unit.timer.running()).toEqual(running);
    expect(await loadIdle(context)).toMatchObject({ id: entryId, returnedAt: clock });
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
