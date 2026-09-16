/**
 * Takt — R-34: die Aufnahme eines mitgereisten Timers beim Einspielen
 * (`.claude/team/reports/T-358-domain-dev.md`, Abschnitt 8, Fälle A bis E).
 *
 * ---------------------------------------------------------------------------
 * Was hier gemessen wird, und wonach — nicht geraten, aus dem Bericht
 * ---------------------------------------------------------------------------
 *
 * `importDataArchive` liest den laufenden Timer seit T-358 **in derselben**
 * Transaktion wie `replaceAll` und führt `context.timerRecovery.entryId`
 * damit nach. Ohne diese Nachführung buchte der nächste Stopp die Wanduhr
 * zwischen den Uhren zweier Rechner — im Befund elf Stunden (39 600 s) statt
 * der tatsächlich geleisteten 20 Minuten (1 200 s), obwohl keine der beiden
 * Uhren falsch geht: eine ehrliche Datensicherung genügt.
 *
 * Zwei echte `openDatabase({ location: ':memory:' })`-Bestände stehen für
 * zwei Rechner mit unterschiedlicher Uhr — genau der Aufbau aus T-350
 * Abschnitt 4 (M1 Fall C), den T-358 für seine eigene Messung benutzt hat.
 * Kein HTTP, kein Sidecar, kein Port gebunden.
 *
 * Fall E ist der wichtigste: Ein Prüffall, der nur die 1 200 s mißt, bleibt
 * grün, wenn die Lesung wieder in eine zweite Transaktion hinter `replaceAll`
 * gezogen wird (siehe Rot-Nachweis im Bericht des unit-testers). Er zählt
 * deshalb die tatsächlich geöffneten Transaktionen und läßt zusätzlich einen
 * echten nebenher fragenden Leser über dieselbe Warteschlange laufen.
 */
import { describe, expect, it } from 'vitest';
import type { TimeEntryId, Timestamp } from '@takt/domain';
import { type TransactionPort } from '@takt/storage';

import { createTimerMachine as machine, type TimerMachine as Machine } from '../support/timer-machine.ts';
import type { AppContext } from '../../src/context.ts';
import {
  DATA_ARCHIVE_FORMAT,
  exportDataArchive,
  importDataArchive,
} from '../../src/features/data-transfer/data-transfer.ts';
import {
  captureTimerRecovery,
  loadOrphanedTimer,
  loadRunningTimer,
  resolveOrphanedTimer,
  startTimer,
  stopTimer,
  touchHeartbeat,
} from '../../src/features/timer/timer.ts';

/** Dieselben Werte, mit denen T-358 Abschnitt 8 seine Vorgabe belegt. */
const T0 = '2026-09-13T06:00:00Z' as Timestamp;
const HEARTBEAT_AT = '2026-09-13T06:20:00Z' as Timestamp; // T0 + 1200 s
const TARGET_CLOCK = '2026-09-13T17:00:00Z' as Timestamp; // T0 + 39600 s

/** Derselbe Zusammenhang, aber mit einer eigenen `timerRecovery`-Aufnahme (Vorgabe, Abschnitt 8). */
function withTimerRecovery(context: AppContext, entryId: TimeEntryId | null): AppContext {
  return { ...context, timerRecovery: { entryId } };
}

/**
 * Zählt, wie oft über einen Zusammenhang tatsächlich eine Transaktion eröffnet
 * wird — Fall E mißt den Mechanismus (eine Klammer), nicht nur die Zahl.
 */
function countingTransactions(real: TransactionPort): { readonly port: TransactionPort; readonly count: () => number } {
  let opened = 0;
  const port: TransactionPort = {
    inTransaction(work) {
      opened += 1;
      return real.inTransaction(work);
    },
  };
  return { port, count: () => opened };
}

/**
 * Quellrechner: ein Todo, ein laufender Timer, ein Lebenszeichen bei T0+1200 s.
 *
 * `timerRecovery: { entryId: null }` steht **vor** dem Start, genau wie im
 * echten Dienst — `main.ts` ruft `captureTimerRecovery` immer vor dem ersten
 * `POST /timer/start` (T-350). Ohne das gilt seit T-363 jeder offene Eintrag
 * als „vorgefunden" (`foundAtServiceStart`, wenn `timerRecovery === undefined`),
 * und `touchHeartbeat` schriebe für den frisch gestarteten Timer gar kein
 * Lebenszeichen — der Quellrechner selbst darf davon nicht betroffen sein,
 * sonst mißt dieser Test etwas anderes als das Einspielen.
 */
async function archiveWithRunningTimer(): Promise<unknown> {
  const quelleMachine = await machine(T0);
  const quelle = withTimerRecovery(quelleMachine.context, null);
  const todo = await quelleMachine.database.transactions.inTransaction((unit) =>
    unit.todos.create({ title: 'Rückruf', callNumber: null, statusId: null, tagIds: [], note: '', now: T0 }, []),
  );
  const started = await startTimer(quelle, todo.id, false);
  expect(started.ok).toBe(true);
  quelleMachine.setClock(HEARTBEAT_AT);
  const touched = await touchHeartbeat(quelle);
  expect(touched.ok).toBe(true);
  const archive = await exportDataArchive(quelle);
  quelleMachine.database.close();
  return archive;
}

/** Quellrechner wie oben, aber der Timer wird vor der Sicherung geschlossen (Fall B). */
async function archiveWithoutRunningTimer(): Promise<unknown> {
  const quelleMachine = await machine(T0);
  const quelle = withTimerRecovery(quelleMachine.context, null);
  const todo = await quelleMachine.database.transactions.inTransaction((unit) =>
    unit.todos.create({ title: 'Rückruf erledigt', callNumber: null, statusId: null, tagIds: [], note: '', now: T0 }, []),
  );
  const started = await startTimer(quelle, todo.id, false);
  expect(started.ok).toBe(true);
  quelleMachine.setClock(HEARTBEAT_AT);
  expect((await touchHeartbeat(quelle)).ok).toBe(true);
  const stopped = await stopTimer(quelle, 'Erledigt');
  expect(stopped.ok).toBe(true);
  const archive = await exportDataArchive(quelle);
  quelleMachine.database.close();
  return archive;
}

/**
 * Zielrechner mit einem EIGENEN verwaisten Eintrag — Grundlage für Fall B und
 * Fall C. `captureTimerRecovery` läuft, nachdem der eigene Timer schon läuft,
 * und markiert ihn damit als „beim Dienststart vorgefunden".
 */
async function machineWithOwnOrphanedEntry(): Promise<Machine> {
  const ziel = await machine(TARGET_CLOCK);
  const todo = await ziel.database.transactions.inTransaction((unit) =>
    unit.todos.create({ title: 'Vorheriger Lauf', callNumber: null, statusId: null, tagIds: [], note: '', now: TARGET_CLOCK }, []),
  );
  const started = await startTimer(ziel.context, todo.id, false);
  expect(started.ok).toBe(true);
  const context = withTimerRecovery(ziel.context, null);
  await captureTimerRecovery(context);
  return { ...ziel, context };
}

describe('R-34 — importDataArchive führt die Timer-Aufnahme nach (T-358 Abschnitt 8)', () => {
  it('Fall A — die beiden Zahlen: 1200 s statt 39600 s (der eigentliche Prüffall)', async () => {
    const archive = await archiveWithRunningTimer();

    const ziel = await machine(TARGET_CLOCK);
    const zielContext = withTimerRecovery(ziel.context, null);
    await captureTimerRecovery(zielContext);

    const imported = await importDataArchive(zielContext, archive);
    expect(imported.ok).toBe(true);

    const orphaned = await loadOrphanedTimer(zielContext);
    expect(orphaned?.bookableSeconds).toBe(1200);

    const resolved = await resolveOrphanedTimerAssertion(zielContext);
    expect(resolved).toBe(1200);
    expect(resolved).not.toBe(39600); // die Zahl aus R-34

    ziel.database.close();
  });

  it('Fall B — ein Archiv ohne laufenden Timer erzeugt nichts, was es vorher nicht gab', async () => {
    const archive = await archiveWithoutRunningTimer();
    const ziel = await machineWithOwnOrphanedEntry();

    // Vor dem Einspielen: der eigene Eintrag gilt als verwaist.
    expect(await loadOrphanedTimer(ziel.context)).not.toBeNull();

    const imported = await importDataArchive(ziel.context, archive);
    expect(imported.ok).toBe(true);

    // `replaceAll` hat den eigenen offenen Eintrag ersetzt — es gibt buchstäblich
    // keinen mehr, und die Aufnahme darf nicht auf der gelöschten Zeile stehen
    // bleiben (T-358 Abschnitt 5, „Nebenbefund, der für die Änderung spricht").
    expect(ziel.context.timerRecovery?.entryId).toBeNull();
    expect(await loadOrphanedTimer(ziel.context)).toBeNull();
    expect(await loadRunningTimer(ziel.context)).toBeNull();

    const stopped = await stopTimer(ziel.context, '');
    expect(stopped.ok).toBe(false);
    if (!stopped.ok) expect(stopped.error.code).toBe('timer_not_running');

    ziel.database.close();
  });

  it('Fall C — ein ungültiges Archiv verändert auch die Aufnahme nicht', async () => {
    const ziel = await machineWithOwnOrphanedEntry();
    const before = await loadOrphanedTimer(ziel.context);
    expect(before).not.toBeNull();
    const entryIdBefore = ziel.context.timerRecovery?.entryId;
    const todosBefore = (await ziel.database.transactions.inTransaction((unit) => unit.todos.search({}))).items.length;

    const invalidArchives: readonly unknown[] = [
      // unbekannte Fassung
      { format: DATA_ARCHIVE_FORMAT, schemaVersion: 99, generator: 'Takt', data: { tables: {}, images: [], files: [] } },
      // fremde Formatkennung
      { format: 'fremdes-format', schemaVersion: 6, generator: 'Takt', data: { tables: {}, images: [], files: [] } },
      // gar kein Objekt
      'kaputt',
    ];

    for (const invalid of invalidArchives) {
      const result = await importDataArchive(ziel.context, invalid);
      expect(result.ok).toBe(false);
    }

    expect(ziel.context.timerRecovery?.entryId).toBe(entryIdBefore);
    const after = await loadOrphanedTimer(ziel.context);
    expect(after?.running.id).toBe(before?.running.id);
    expect(after?.bookableSeconds).toBe(before?.bookableSeconds);
    const todosAfter = (await ziel.database.transactions.inTransaction((unit) => unit.todos.search({}))).items.length;
    expect(todosAfter).toBe(todosBefore);

    ziel.database.close();
  });

  it('Fall D — ohne timerRecovery im Zusammenhang bleibt alles, wie es war', async () => {
    const quelle = await machine(T0);
    const archive = await exportDataArchive(quelle.context); // leer, aber gültig
    quelle.database.close();

    const ziel = await machine(TARGET_CLOCK);
    expect(ziel.context.timerRecovery).toBeUndefined();

    const imported = await importDataArchive(ziel.context, archive);
    expect(imported.ok).toBe(true);
    expect(ziel.context.timerRecovery).toBeUndefined();

    ziel.database.close();
  });

  it('Fall E — die Stelle, nicht nur die Wirkung: replaceAll und die Lesung in EINER Transaktion', async () => {
    const archive = await archiveWithRunningTimer();

    const ziel = await machine(TARGET_CLOCK);
    const zielBase = withTimerRecovery(ziel.context, null);
    await captureTimerRecovery(zielBase);
    expect(zielBase.timerRecovery?.entryId).toBeNull();

    const counting = countingTransactions(ziel.context.transactions);
    const zielForImport = { ...zielBase, transactions: counting.port };

    // Beide Aufrufe werden absichtlich VOR dem Warten gestartet: Sie reihen
    // sich synchron, im Aufrufzeitpunkt, in dieselbe Warteschlange
    // (`packages/storage/src/sqlite/unit-of-work.ts`) ein — `zielBase` benutzt
    // dabei den ECHTEN Transaktionsport, nicht den zählenden, damit dieser
    // Fall nur die Transaktionen von `importDataArchive` selbst zählt.
    const importPromise = importDataArchive(zielForImport, archive);
    const readerPromise = loadOrphanedTimer(zielBase);

    const [imported, duringImport] = await Promise.all([importPromise, readerPromise]);

    expect(imported.ok).toBe(true);
    // Der nebenher fragende Leser sieht die Waisenmeldung — nicht `null` und
    // nicht den laufenden Timer mit 39600 s (T-358 Abschnitt 4).
    expect(duringImport?.bookableSeconds).toBe(1200);
    // Der eigentliche Mechanismus: EINE Klammer für `replaceAll` und die
    // Lesung. Eine zweite Transaktion dahinter ändert an den Zahlen oben in
    // diesem sequentiellen Testaufbau nichts — deshalb zählt dieser Fall statt
    // nur zu vergleichen.
    expect(counting.count()).toBe(1);

    ziel.database.close();
  });

  /**
   * Fall F (T-375) — die ungeschriebene Zusage aus `unit-of-work.ts:264/278`
   * fest genagelt: `return next` und nicht `return queue`.
   *
   * Fall E oben genügt formal — er ist rot gegen die verworfene
   * Zwei-Transaktionen-Anordnung (nachgemessen im Bericht des unit-testers
   * dieser Aufgabe) —, aber er hat genau **einen** nebenher gereihten Leser.
   * T-358 und T-370 haben mit **siebzehn** gemessen, weil ein einzelner Leser
   * unter der Zwei-Transaktionen-Anordnung nur mit einer gewissen
   * Wahrscheinlichkeit in das offene Fenster trifft (T-358: 16 von 17 richtig,
   * 1 falsch — nicht 0 von 17). Dieser Fall fährt dieselben siebzehn Leser wie
   * Fall E, nur mehr davon, und alle synchron vor dem ersten `await` gestartet
   * — genau die Bauart, mit der Fall E den Mechanismus mißt, nicht nur die
   * Zahl.
   *
   * Selbst gemessen (fünf Wiederholungen je Seite, siehe Bericht T-375):
   *
   *     Zwei-Transaktionen-Anordnung (verworfen)   0 von 17 sahen 1200 s, alle 17 sahen `null`
   *     Diese Anordnung (aktuell)                  17 von 17 sahen 1200 s, in jedem der 5 Läufe
   *
   * Wer `unit-of-work.ts:278` von `return next` auf `return queue` ändert,
   * ändert nicht nur die Reihenfolge, sondern auch den Rückgabewert selbst
   * (`queue` löst immer zu `undefined` auf) — das reißt praktisch jeden
   * anderen Prüffall, der `await unit.…` auswertet, sofort und unübersehbar
   * mit; dieser Fall ist deshalb keine Absicherung gegen *diese* eine
   * Änderung, sondern gegen die schwerer zu findende Regression, welche die
   * **Reihenfolge** der beiden Anweisungen (Warteschlangen-Anhängen vor der
   * Rückgabe) verschiebt oder die Aufnahme wieder auf zwei Klammern zieht.
   */
  it('Fall F — siebzehn nebenher gereihte Leser sehen nie den Zwischenstand (unit-of-work.ts:264/278, R-34)', async () => {
    const archive = await archiveWithRunningTimer();

    const ziel = await machine(TARGET_CLOCK);
    const zielBase = withTimerRecovery(ziel.context, null);
    await captureTimerRecovery(zielBase);

    // Wie in Fall E: beide Seiten werden VOR dem Warten gestartet, damit sie
    // sich synchron, im Aufrufzeitpunkt, in dieselbe Warteschlange einreihen.
    const importPromise = importDataArchive(zielBase, archive);
    const readers = Array.from({ length: 17 }, () => loadOrphanedTimer(zielBase));

    const [imported, ...results] = await Promise.all([importPromise, ...readers]);

    expect(imported.ok).toBe(true);
    // Jeder einzelne der siebzehn Leser — nicht nur die Mehrheit.
    for (const result of results) {
      expect(result?.bookableSeconds).toBe(1200);
      expect(result?.bookableSeconds).not.toBe(39600);
    }

    ziel.database.close();
  });
});

/**
 * Hilfsfunktion für Fall A: bucht über den Dialog und liefert die Dauer, oder
 * wirft mit einer sprechenden Meldung, wenn der Ausgang nicht „recorded" ist.
 */
async function resolveOrphanedTimerAssertion(context: AppContext): Promise<number> {
  const result = await resolveOrphanedTimer(context, 'book_until_heartbeat');
  if (!result.ok || result.value.kind !== 'recorded') {
    throw new Error(`erwartet: recorded, bekommen: ${JSON.stringify(result)}`);
  }
  return result.value.entry.durationSeconds;
}
