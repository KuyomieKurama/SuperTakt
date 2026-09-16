/**
 * Takt — R-34 Restpunkt: `stopTimer`, `startTimer` und `touchHeartbeat`
 * fragen dieselbe Frage wie die Anzeige (`.claude/team/reports/T-363-domain-dev.md`,
 * Abschnitt 7, Fälle T363-A bis T363-H).
 *
 * ---------------------------------------------------------------------------
 * Der Befund, den diese Datei gegen ein Zurückdrehen sichert
 * ---------------------------------------------------------------------------
 *
 * Bis T-363 stellten nur `loadOrphanedTimer` und `resolveOrphanedTimer` die
 * Frage „wurde dieser Timer beim Dienststart vorgefunden?" — der Schutz lag
 * damit allein in der Anzeige. Ein direkter `POST /timer/stop`, eine
 * Verdrängung über `POST /timer/start {stopRunning:true}` oder ein einziges
 * `POST /timer/heartbeat` auf dem vorgefundenen Eintrag bekamen weiterhin die
 * Wanduhr — auch **ohne** jedes Archiv, allein nach einem gewöhnlichen
 * Absturz. Seit T-363 stellt `bookingEndOfStop` (`features/timer/timer.ts`)
 * dieselbe Frage an einer Stelle, egal auf welchem Weg gebucht wird.
 *
 * `T363-C` und `T363-F` sind die Gegenprobe: Der **gewöhnliche** Fall — ein
 * Timer, der in dieser Sitzung selbst gestartet wurde — bucht unverändert die
 * Wanduhr. Ohne diese beiden Fälle wäre die Verengung nicht gegen ein
 * versehentliches „jetzt bucht alles nur noch bis zum Lebenszeichen"
 * abgesichert.
 */
import { describe, expect, it } from 'vitest';
import type { TimeEntryId, Timestamp, TodoId } from '@takt/domain';

import { createTimerMachine as machine, type TimerMachine as Machine } from '../support/timer-machine.ts';
import type { AppContext } from '../../src/context.ts';
import { compose } from '../../src/composition.ts';
import type { TokenRecord, TokenStorePort } from '../../src/access/token-store.ts';
import { createLogger } from '../../src/logger.ts';
import { exportDataArchive, importDataArchive } from '../../src/features/data-transfer/data-transfer.ts';
import {
  captureTimerRecovery,
  loadOrphanedTimer,
  loadRunningTimer,
  startTimer,
  stopTimer,
  touchHeartbeat,
} from '../../src/features/timer/timer.ts';

/** Dieselben Werte, mit denen T-363 Abschnitt 7 seine Vorgabe belegt. */
const T0 = '2026-09-13T06:00:00Z' as Timestamp;
const HEARTBEAT_AT = '2026-09-13T06:20:00Z' as Timestamp; // T0 + 1200 s
const TARGET_CLOCK = '2026-09-13T17:00:00Z' as Timestamp; // T0 + 39600 s

/** Derselbe Zusammenhang mit einer eigenen `timerRecovery`-Aufnahme. */
function withTimerRecovery(context: AppContext, entryId: TimeEntryId | null): AppContext {
  return { ...context, timerRecovery: { entryId } };
}

async function createTodo(m: Machine, title: string, now: Timestamp): Promise<TodoId> {
  const todo = await m.database.transactions.inTransaction((unit) =>
    unit.todos.create({ title, callNumber: null, statusId: null, tagIds: [], note: '', now }, []),
  );
  return todo.id;
}

/** Ein leerer, aber echter Tokenspeicher im Arbeitsspeicher — für Fall T363-H. */
function memoryTokenStore(): TokenStorePort {
  let record: TokenRecord | null = null;
  return {
    read: async () => (record === null ? { status: 'absent' } : { status: 'ok', record }),
    write: async (next) => {
      record = next;
    },
    inspectPermissions: async () => ({ checked: false, dirTooPermissive: false, fileTooPermissive: false }),
  };
}

describe('T-363 — dieselbe Frage wie die Anzeige, gestellt in stopTimer/startTimer/touchHeartbeat', () => {
  it('T363-A — Archiv mit laufendem Timer einspielen, dann stopTimer: 1200 s, nicht 39600 s', async () => {
    const quelle = await machine(T0);
    const todoId = await createTodo(quelle, 'Rückruf', T0);
    const quelleContext = withTimerRecovery(quelle.context, null);
    expect((await startTimer(quelleContext, todoId, false)).ok).toBe(true);
    quelle.setClock(HEARTBEAT_AT);
    expect((await touchHeartbeat(quelleContext)).ok).toBe(true);
    const archive = await exportDataArchive(quelleContext);
    quelle.database.close();

    const ziel = await machine(TARGET_CLOCK);
    const zielContext = withTimerRecovery(ziel.context, null);
    await captureTimerRecovery(zielContext);
    expect((await importDataArchive(zielContext, archive)).ok).toBe(true);

    const result = await stopTimer(zielContext, 'x');
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'recorded') throw new Error('erwartet: recorded');
    expect(result.value.entry.durationSeconds).toBe(1200);
    expect(result.value.entry.durationSeconds).not.toBe(39600); // die Zahl aus R-34

    ziel.database.close();
  });

  it('T363-B — derselbe Stopp nach einem gewöhnlichen Absturz, GANZ OHNE Archiv: 1200 s (der reine E-036-Fall)', async () => {
    const m = await machine(T0);
    const todoId = await createTodo(m, 'Rückruf', T0);
    const laufend = withTimerRecovery(m.context, null);
    expect((await startTimer(laufend, todoId, false)).ok).toBe(true);
    m.setClock(HEARTBEAT_AT);
    expect((await touchHeartbeat(laufend)).ok).toBe(true);

    // „Absturz": derselbe Bestand, aber ein NEUER Zusammenhang mit eigener
    // Aufnahme — genau das, was `main.ts` beim echten Dienststart tut.
    const restarted = withTimerRecovery(m.context, null);
    await captureTimerRecovery(restarted); // findet den laufenden Timer vor -> „vorgefunden"

    m.setClock(TARGET_CLOCK);
    const result = await stopTimer(restarted, '');
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'recorded') throw new Error('erwartet: recorded');
    expect(result.value.entry.durationSeconds).toBe(1200);

    m.database.close();
  });

  it('T363-C — der gewöhnliche Fall bucht unverändert die Wanduhr (darf sich nicht ändern)', async () => {
    const m = await machine(T0);
    const todoId = await createTodo(m, 'Rückruf', T0);
    const context = withTimerRecovery(m.context, null);
    await captureTimerRecovery(context); // kein Timer läuft -> entryId bleibt null
    expect(context.timerRecovery?.entryId).toBeNull();

    expect((await startTimer(context, todoId, false)).ok).toBe(true);
    m.setClock(TARGET_CLOCK);

    const result = await stopTimer(context, '');
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'recorded') throw new Error('erwartet: recorded');
    expect(result.value.entry.durationSeconds).toBe(39600);

    m.database.close();
  });

  it('T363-D — ein Lebenszeichen nach dem Absturz hebt die Grenze NICHT mehr an', async () => {
    const m = await machine(T0);
    const todoId = await createTodo(m, 'Rückruf', T0);
    const laufend = withTimerRecovery(m.context, null);
    expect((await startTimer(laufend, todoId, false)).ok).toBe(true);
    m.setClock(HEARTBEAT_AT);
    expect((await touchHeartbeat(laufend)).ok).toBe(true);

    const restarted = withTimerRecovery(m.context, null);
    await captureTimerRecovery(restarted);

    m.setClock(TARGET_CLOCK);
    const touched = await touchHeartbeat(restarted);
    expect(touched.ok).toBe(true);
    if (touched.ok) expect(touched.value).toBeNull(); // kein Lebenszeichen für einen vorgefundenen Eintrag

    expect((await loadOrphanedTimer(restarted))?.bookableSeconds).toBe(1200);

    const result = await stopTimer(restarted, '');
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'recorded') throw new Error('erwartet: recorded');
    expect(result.value.entry.durationSeconds).toBe(1200);

    m.database.close();
  });

  it('T363-E — startTimer auf einem ANDEREN Todo verdrängt einen vorgefundenen Timer korrekt', async () => {
    const quelle = await machine(T0);
    const todoId = await createTodo(quelle, 'Rückruf', T0);
    const quelleContext = withTimerRecovery(quelle.context, null);
    expect((await startTimer(quelleContext, todoId, false)).ok).toBe(true);
    quelle.setClock(HEARTBEAT_AT);
    expect((await touchHeartbeat(quelleContext)).ok).toBe(true);
    const archive = await exportDataArchive(quelleContext);
    quelle.database.close();

    const ziel = await machine(TARGET_CLOCK);
    const zielContext = withTimerRecovery(ziel.context, null);
    await captureTimerRecovery(zielContext);
    expect((await importDataArchive(zielContext, archive)).ok).toBe(true);

    const anderesTodo = await createTodo(ziel, 'Anderes Todo', TARGET_CLOCK);
    const result = await startTimer(zielContext, anderesTodo, true);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== 'started') throw new Error('erwartet: started');
    expect(result.value.stopped?.durationSeconds).toBe(1200);
    expect(result.value.stopped?.endedAt).toBe(HEARTBEAT_AT);

    const running = await loadRunningTimer(zielContext);
    expect(running?.entry.todoId).toBe(anderesTodo);

    ziel.database.close();
  });

  it('T363-F — zwei Timer derselben Sitzung: die Verdrängung bucht weiter die Wanduhr, A-6.8 unberührt', async () => {
    const m = await machine(T0);
    const todoA = await createTodo(m, 'Todo A', T0);
    const todoB = await createTodo(m, 'Todo B', T0);

    const context = withTimerRecovery(m.context, null);
    await captureTimerRecovery(context);
    expect((await startTimer(context, todoA, false)).ok).toBe(true);

    m.setClock(TARGET_CLOCK);
    const displaced = await startTimer(context, todoB, true);
    expect(displaced.ok).toBe(true);
    if (!displaced.ok || displaced.value.kind !== 'started') throw new Error('erwartet: started');
    expect(displaced.value.stopped?.durationSeconds).toBe(39600);

    const confirmation = await startTimer(context, todoA, false);
    expect(confirmation.ok).toBe(true);
    if (confirmation.ok) expect(confirmation.value.kind).toBe('confirmation_required');

    m.database.close();
  });

  it('T363-G — ohne timerRecovery im Zusammenhang gilt jeder offene Eintrag als vorgefunden: der Stopp verwirft', async () => {
    const m = await machine(T0);
    const todoId = await createTodo(m, 'Rückruf', T0);
    expect(m.context.timerRecovery).toBeUndefined();

    expect((await startTimer(m.context, todoId, false)).ok).toBe(true);
    m.setClock(TARGET_CLOCK);

    const result = await stopTimer(m.context, '');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe('discarded');
      if (result.value.kind === 'discarded') expect(result.value.reason).toBe('timer_too_short');
    }

    m.database.close();
  });

  it('T363-H — composition.ts trägt die Zusage, die kein Typ erzwingen kann', () => {
    const composition = compose({
      port: 0,
      store: memoryTokenStore(),
      sessionSecret: 'takt_test_secret',
      windowsUser: 'Prüfrechner',
      databaseLocation: ':memory:',
      logger: createLogger(() => undefined),
    });

    expect(composition.context?.timerRecovery).toEqual({ entryId: null });

    composition.database?.close();
  });
});
