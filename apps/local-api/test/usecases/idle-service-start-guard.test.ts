/**
 * Takt — R-34, die beiden idle-Türen aus `.claude/team/reports/T-371-domain-dev.md`
 * (B-1: `beginIdle` weist ab, `completeReturn` deckelt) und der Deckel nach
 * oben aus B-2 (`decideOrphanedTimer`, `packages/domain`), gemessen an der
 * Anzeige (`GET /timer/orphaned`) und am direkten Stopp.
 *
 * ---------------------------------------------------------------------------
 * Fünf Fälle, wie vom Orchestrator (T-375) benannt
 * ---------------------------------------------------------------------------
 *
 *  1. `POST /timer/idle/begin` auf einem beim Dienststart vorgefundenen
 *     Eintrag — in beiden Stellungen von `idleKeepTimerRunning` — weist mit
 *     `conflict` ab und schreibt nichts.
 *  2. Eine **eingespielte offene** Inaktivitätsphase (A-24.7) wird bei der
 *     Rückkehr gedeckelt, nicht mit `pending.startedAt` gebucht — mit und
 *     ohne Lebenszeichen.
 *  3. Die Gegenprobe: der **eigene** Timer dieser Sitzung bleibt unverändert,
 *     ohne Überlappung.
 *  4. Ein Lebenszeichen **aus der Zukunft** wird an beiden Stellen gedeckelt,
 *     die danach fragen — dem Verwaistendialog und dem direkten Stopp.
 *
 * Der rote Stand für 1–3 ist `idle.ts`, wie es bis `git show 311b26e:…`
 * aussah (unverändert seit `f6f4d6d`, T-371 war die erste Änderung an der
 * Datei danach) — dort fragt weder `beginIdle` noch `completeReturn`
 * `foundAtServiceStart`. Für Fall 4 ist der rote Stand zusätzlich
 * `packages/domain/src/time-entry.ts` vor T-371 (`decideOrphanedTimer` ohne
 * den `now`-Deckel). Beide Nachweise stehen im Bericht T-375, nicht in dieser
 * Datei — Meßkopien gehören nicht in den Quellbaum.
 */
import { describe, expect, it } from 'vitest';
import type { TimeEntryId, Timestamp, TodoId } from '@takt/domain';
import { openDatabase, type OpenedDatabase } from '@takt/storage';

import type { AppContext } from '../../src/context.ts';
import { exportDataArchive, importDataArchive } from '../../src/features/data-transfer/data-transfer.ts';
import { captureTimerRecovery, loadOrphanedTimer, loadRunningTimer, stopTimer, startTimer, touchHeartbeat } from '../../src/features/timer/timer.ts';
import { beginIdle, returnFromIdle } from '../../src/features/timer/idle.ts';

/** Dieselben Werte wie in `timer-recovery-booking.test.ts` (T-363/T-371). */
const T0 = '2026-09-13T06:00:00Z' as Timestamp;
const HEARTBEAT_AT = '2026-09-13T06:20:00Z' as Timestamp; // T0 + 1200 s
const TARGET_CLOCK = '2026-09-13T17:00:00Z' as Timestamp; // T0 + 39600 s
const INACTIVE_SINCE = '2026-09-13T16:50:00Z' as Timestamp; // TARGET_CLOCK - 600 s

interface Machine {
  readonly database: OpenedDatabase;
  readonly context: AppContext;
  setClock(value: Timestamp): void;
}

async function machine(initial: Timestamp): Promise<Machine> {
  let current = initial;
  const database = openDatabase({ location: ':memory:', now: () => current });
  await database.migrations.migrateToLatest();
  const context = {
    transactions: database.transactions,
    clock: { now: () => current },
    system: { windowsUser: () => 'Prüfrechner' },
  } as unknown as AppContext;
  return {
    database,
    context,
    setClock(value: Timestamp) {
      current = value;
    },
  };
}

function withTimerRecovery(context: AppContext, entryId: TimeEntryId | null): AppContext {
  return { ...context, timerRecovery: { entryId } } as unknown as AppContext;
}

async function createTodo(m: Machine, title: string, now: Timestamp): Promise<TodoId> {
  const todo = await m.database.transactions.inTransaction((unit) =>
    unit.todos.create({ title, callNumber: null, statusId: null, tagIds: [], note: '', now }, []),
  );
  return todo.id;
}

/** Quellrechner: ein laufender Timer, ein Lebenszeichen bei T0+1200 s, dann ein Archiv. */
async function archiveWithRunningTimer(): Promise<{ archive: unknown; runningId: TimeEntryId }> {
  const quelle = await machine(T0);
  const todoId = await createTodo(quelle, 'Rückruf', T0);
  const quelleContext = withTimerRecovery(quelle.context, null);
  const started = await startTimer(quelleContext, todoId, false);
  expect(started.ok).toBe(true);
  if (!started.ok || started.value.kind !== 'started') throw new Error('erwartet: started');
  const runningId = started.value.started.id;
  quelle.setClock(HEARTBEAT_AT);
  expect((await touchHeartbeat(quelleContext)).ok).toBe(true);
  const archive = await exportDataArchive(quelleContext);
  quelle.database.close();
  return { archive, runningId };
}

/** Zielrechner: Archiv einspielen, die Aufnahme zeigt danach auf den vorgefundenen Eintrag. */
async function importOnto(clock: Timestamp, archive: unknown): Promise<{ ziel: Machine; context: AppContext }> {
  const ziel = await machine(clock);
  const zielContext = withTimerRecovery(ziel.context, null);
  await captureTimerRecovery(zielContext);
  const imported = await importDataArchive(zielContext, archive);
  expect(imported.ok).toBe(true);
  return { ziel, context: zielContext };
}

describe('T-375 Fall 1 — beginIdle auf einem vorgefundenen Eintrag weist ab (B-1, beide Stellungen)', () => {
  it.each([true, false])('idleKeepTimerRunning = %s → 409 conflict, keine Buchung, kein Wechsel am laufenden Eintrag', async (idleKeepTimerRunning) => {
    const { archive, runningId } = await archiveWithRunningTimer();
    const { ziel, context } = await importOnto(TARGET_CLOCK, archive);
    await ziel.database.transactions.inTransaction((unit) => unit.settings.update({ idleKeepTimerRunning, now: TARGET_CLOCK }));

    const before = await loadRunningTimer(context);
    expect(before?.entry.id).toBe(runningId);

    const result = await beginIdle(context, { entryId: runningId, startedAt: INACTIVE_SINCE });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('conflict');
    // Keine Buchung — weder eine abgeschlossene Zeile noch ein verändertes Ende.
    expect((await ziel.database.transactions.inTransaction((unit) => unit.timeEntries.search({})))?.items).toHaveLength(0);
    const after = await loadRunningTimer(context);
    expect(after?.entry.id).toBe(runningId);
    expect(after?.entry.startedAt).toBe(T0);

    ziel.database.close();
  });
});

describe('T-375 Fall 2 — eine eingespielte offene Inaktivitätsphase wird gedeckelt, nicht mit dem rohen Beginn gebucht (B-1, completeReturn)', () => {
  it('mit Lebenszeichen: gebucht wird bis zum Lebenszeichen (1200 s), nicht bis zum behaupteten Beginn der Abwesenheit (14400 s)', async () => {
    const quelle = await machine(T0);
    const todoId = await createTodo(quelle, 'Rückruf', T0);
    const quelleContext = withTimerRecovery(quelle.context, null);
    const started = await startTimer(quelleContext, todoId, false);
    expect(started.ok).toBe(true);
    if (!started.ok || started.value.kind !== 'started') throw new Error('erwartet: started');
    const runningId = started.value.started.id;
    quelle.setClock(HEARTBEAT_AT);
    expect((await touchHeartbeat(quelleContext)).ok).toBe(true);

    // Eine bereits offene Inaktivitätsphase, direkt über den Port angelegt wie
    // beim Wiederaufbau aus SQLite (A-24.7) — ihr behaupteter Beginn (10:00)
    // liegt HINTER dem letzten Lebenszeichen (06:20): eine Leiche, deren
    // eigene Uhr nicht zu trauen ist.
    const claimedStart = '2026-09-13T10:00:00Z' as Timestamp;
    await quelle.database.transactions.inTransaction((unit) =>
      unit.idle.begin({ id: runningId, todoId, startedAt: claimedStart, returnedAt: null, note: '' }),
    );
    const archive = await exportDataArchive(quelleContext);
    quelle.database.close();

    const { ziel, context } = await importOnto(TARGET_CLOCK, archive);

    const result = await returnFromIdle(context, runningId);
    expect(result.ok).toBe(true);

    const entries = (await ziel.database.transactions.inTransaction((unit) => unit.timeEntries.search({}))).items;
    expect(entries.map((e) => e.durationSeconds)).toEqual([1200]);
    expect(entries.map((e) => e.durationSeconds)).not.toEqual([14400]); // der behauptete, ungeprüfte Beginn

    // Der Timer läuft danach fort, sekundengenau ab der Rückkehr — keine Lücke, keine Überlappung.
    const running = await loadRunningTimer(context);
    expect(running?.entry.startedAt).toBe(TARGET_CLOCK);

    ziel.database.close();
  });

  it('ohne Lebenszeichen: keine Buchung entsteht, der Timer setzt sekundengenau bei der Rückkehr fort', async () => {
    const quelle = await machine(T0);
    const todoId = await createTodo(quelle, 'Rückruf', T0);
    const quelleContext = withTimerRecovery(quelle.context, null);
    const started = await startTimer(quelleContext, todoId, false);
    expect(started.ok).toBe(true);
    if (!started.ok || started.value.kind !== 'started') throw new Error('erwartet: started');
    const runningId = started.value.started.id;

    // Kein Lebenszeichen für diesen Eintrag — das erste, das `startTimer`
    // selbst schreibt, wird vor dem Export wieder entfernt (A-24.7 ohne
    // Beleg: ein Archiv, dessen `timer_heartbeat`-Zeile fehlt).
    quelle.database.connection.exec(`DELETE FROM timer_heartbeat WHERE time_entry_id = '${runningId}'`);

    const claimedStart = '2026-09-13T10:00:00Z' as Timestamp;
    await quelle.database.transactions.inTransaction((unit) =>
      unit.idle.begin({ id: runningId, todoId, startedAt: claimedStart, returnedAt: null, note: '' }),
    );
    const archive = await exportDataArchive(quelleContext);
    quelle.database.close();

    const { ziel, context } = await importOnto(TARGET_CLOCK, archive);

    const result = await returnFromIdle(context, runningId);
    expect(result.ok).toBe(true);

    const entries = (await ziel.database.transactions.inTransaction((unit) => unit.timeEntries.search({}))).items;
    expect(entries).toHaveLength(0); // keine Buchung über 0 Sekunden

    const running = await loadRunningTimer(context);
    expect(running?.entry.startedAt).toBe(TARGET_CLOCK);

    ziel.database.close();
  });
});

describe('T-375 Fall 3 — Gegenprobe: der eigene Timer dieser Sitzung bleibt unverändert (kein Zutun der beiden Türen)', () => {
  it('Stopp ohne Inaktivität bucht weiterhin die volle Wanduhr: 39600 s', async () => {
    const m = await machine(T0);
    const todoId = await createTodo(m, 'Rückruf', T0);
    const context = withTimerRecovery(m.context, null);
    await captureTimerRecovery(context);
    expect((await startTimer(context, todoId, false)).ok).toBe(true);
    m.setClock(TARGET_CLOCK);

    const result = await stopTimer(context, '');
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'recorded') throw new Error('erwartet: recorded');
    expect(result.value.entry.durationSeconds).toBe(39600);

    m.database.close();
  });

  it('eine Inaktivität am eigenen, laufenden Timer bucht weiterhin sekundengenau bis zum Beginn der Abwesenheit: 39000 s, ohne Überlappung', async () => {
    const m = await machine(T0);
    const todoId = await createTodo(m, 'Rückruf', T0);
    const context = withTimerRecovery(m.context, null);
    await captureTimerRecovery(context);
    const started = await startTimer(context, todoId, false);
    expect(started.ok).toBe(true);
    if (!started.ok || started.value.kind !== 'started') throw new Error('erwartet: started');
    const runningId = started.value.started.id;

    // Erkannt wird die Abwesenheit erst, nachdem die Schwelle überschritten
    // ist — die Wanduhr steht dabei schon auf `TARGET_CLOCK`, `startedAt`
    // benennt nur, wo die Abwesenheit begonnen hat (E-036/A-24, wie
    // `useIdleTimer` es meldet).
    m.setClock(TARGET_CLOCK);
    const begun = await beginIdle(context, { entryId: runningId, startedAt: INACTIVE_SINCE });
    expect(begun.ok).toBe(true);

    const returned = await returnFromIdle(context, runningId);
    expect(returned.ok).toBe(true);

    const entries = (await m.database.transactions.inTransaction((unit) => unit.timeEntries.search({}))).items;
    expect(entries.map((e) => e.durationSeconds)).toEqual([39000]);

    // Der Timer läuft fort, ohne Lücke und ohne Überlappung mit der Buchung.
    const running = await loadRunningTimer(context);
    expect(running?.entry.startedAt).toBe(TARGET_CLOCK);
    expect(entries[0]?.endedAt).toBe(INACTIVE_SINCE);

    m.database.close();
  });
});

describe('T-375 Fall 4 — ein Lebenszeichen aus der Zukunft wird an beiden Stellen gedeckelt (B-2, decideOrphanedTimer.now)', () => {
  /** Ein Quellrechner, dessen Uhr weit vorgeht: das Lebenszeichen liegt jenseits des Zielrechners. */
  async function archiveWithHeartbeatFromTheFuture(): Promise<{ archive: unknown; runningId: TimeEntryId }> {
    const quelle = await machine('2026-09-13T06:00:00Z' as Timestamp);
    const todoId = await createTodo(quelle, 'Rückruf', '2026-09-13T06:00:00Z' as Timestamp);
    const quelleContext = withTimerRecovery(quelle.context, null);
    const started = await startTimer(quelleContext, todoId, false);
    expect(started.ok).toBe(true);
    if (!started.ok || started.value.kind !== 'started') throw new Error('erwartet: started');
    const runningId = started.value.started.id;
    // Die Uhr des Quellrechners geht extrem vor — dieselbe Zahl wie in
    // `.claude/team/reports/T-370-security-checker.md` (Start `2026-09-13`,
    // Lebenszeichen `9999-12-31`), damit die Zahlen aus dem Bericht direkt
    // nachprüfbar bleiben.
    quelle.setClock('9999-12-31T23:59:59Z' as Timestamp);
    expect((await touchHeartbeat(quelleContext)).ok).toBe(true);
    const archive = await exportDataArchive(quelleContext);
    quelle.database.close();
    return { archive, runningId };
  }

  it('am Verwaistendialog (GET /timer/orphaned): 251613021599 s werden zu 39600 s', async () => {
    const { archive, runningId } = await archiveWithHeartbeatFromTheFuture();
    const { ziel, context } = await importOnto(TARGET_CLOCK, archive);
    expect(runningId).toBeDefined();

    const orphaned = await loadOrphanedTimer(context);
    expect(orphaned?.bookableSeconds).toBe(39600);
    expect(orphaned?.bookableSeconds).not.toBe(251613021599); // die alte Zahl aus T-370

    ziel.database.close();
  });

  it('am direkten Stopp: dieselbe gedeckelte Zahl, dieselbe wie im Dialog', async () => {
    const { archive } = await archiveWithHeartbeatFromTheFuture();
    const { ziel, context } = await importOnto(TARGET_CLOCK, archive);

    const result = await stopTimer(context, 'x');
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'recorded') throw new Error('erwartet: recorded');
    expect(result.value.entry.durationSeconds).toBe(39600);
    expect(result.value.entry.durationSeconds).not.toBe(251613021599);
    // Kein Ende in der Zukunft, also auch keine Überlappung mit einem danach
    // gestarteten Timer (A-24, T-371 Abschnitt 4).
    expect(Date.parse(result.value.entry.endedAt)).toBeLessThanOrEqual(Date.parse(TARGET_CLOCK));

    ziel.database.close();
  });
});
