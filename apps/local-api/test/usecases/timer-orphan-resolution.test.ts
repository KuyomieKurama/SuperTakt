/**
 * Takt — T-105, O-R: `resolveOrphanedTimer` reicht `orphan_discarded` durch,
 * `stopTimer` bleibt bei `timer_too_short` (Auftrag aus
 * `reports/T-101-domain-dev.md` "Nächster Schritt" 2c).
 *
 * ---------------------------------------------------------------------------
 * Was T-101 hier repariert hat, und was diese Datei davon prüft
 * ---------------------------------------------------------------------------
 *
 * Bis T-101 überschrieb `usecases/timer.ts` den von der Domäne gelieferten
 * Grund IMMER mit `timer_too_short` — auch dann, wenn der Benutzer eine
 * verwaiste Buchung ausdrücklich verworfen hatte (`resolution: 'discard'`).
 * `decideOrphanedTimer` selbst unterscheidet die beiden Gründe bereits
 * korrekt und ist in `packages/domain/test/timer.test.ts` (TP-TIMER-04)
 * ausführlich geprüft — das ist NICHT die Lücke.
 *
 * Die Lücke, die diese Datei schließt, liegt eine Ebene höher: Reicht der
 * ANWENDUNGSFALL `resolveOrphanedTimer` den von der Domäne gelieferten Grund
 * unverändert durch, statt ihn wieder einzukürzen? Und bleibt `stopTimer` —
 * eine andere Route, ohne Konzept einer "verwaisten" Buchung — tatsächlich
 * bei genau einem Grund? Beides war vor dieser Datei ungeprüft: kein Test
 * unter `apps/local-api/test` rief `resolveOrphanedTimer` oder `stopTimer`
 * je auf.
 *
 * ---------------------------------------------------------------------------
 * Die Attrappe
 * ---------------------------------------------------------------------------
 *
 * Für die hier geprüften Zweige (ausschließlich `discarded`-Ausgänge) liest
 * `resolveOrphanedTimer` nur `unit.heartbeat.orphaned()` und
 * `unit.timer.stop()` — `presenceBeforeBooking`/`poolMovementNamer` werden in
 * diesem Zweig laut Quelltext gar nicht erreicht (nachgelesen in
 * `usecases/timer.ts`: der `presence`-Zugriff steht dort HINTER der
 * `if (decision.kind === 'discarded') return …`-Zeile). Die Attrappe liefert
 * deshalb nur diese beiden Ports; ein Cast auf `UnitOfWork` steht dafür, wie
 * in `todo-done-movement.test.ts` begründet.
 */
import { describe, expect, it } from 'vitest';
import type { RunningTimeEntry, TimeEntryId, Timestamp, TodoId } from '@takt/domain';
import { ok } from '@takt/domain';
import type { UnitOfWork } from '@takt/storage';
import type { AppContext } from '../../src/usecases/context.ts';
import { resolveOrphanedTimer, stopTimer } from '../../src/usecases/timer.ts';

const timeEntryId = (value: string) => value as unknown as TimeEntryId;
const todoId = (value: string) => value as unknown as TodoId;
const timestamp = (value: string) => value as unknown as Timestamp;

const RUNNING: RunningTimeEntry = {
  id: timeEntryId('te-orphan'),
  todoId: todoId('todo-a'),
  startedAt: timestamp('2026-08-31T22:00:00Z'),
  note: 'Rückruf begonnen',
  source: 'timer',
};

/**
 * Absichtlich lose getippt (`Record<string, unknown>`, nicht `Partial<UnitOfWork>`):
 * `Partial` macht nur die SCHLÜSSEL optional, verlangt aber von jedem
 * angegebenen Wert weiterhin den VOLLEN Port (`TimerPort` mit `start`,
 * `TimerHeartbeatPort` mit `lastSeen` — beide werden in den Zweigen dieser
 * Datei nie erreicht). Der Cast auf `UnitOfWork` steht erst innerhalb von
 * `inTransaction`, an der einzigen Stelle, die ihn wirklich braucht.
 */
function buildContext(unit: Record<string, unknown>, nowValue: Timestamp): AppContext {
  return {
    transactions: {
      async inTransaction(work: (unit: UnitOfWork) => Promise<unknown>) {
        return work(unit as unknown as UnitOfWork);
      },
    },
    clock: { now: () => nowValue },
  } as unknown as AppContext;
}

describe('resolveOrphanedTimer — reicht den Grund der Domäne unverändert durch (O-R)', () => {
  it('resolution: "discard" -> reason: "orphan_discarded" (NICHT auf "timer_too_short" gekürzt)', async () => {
    const stopCalls: Array<{ note: string; now: Timestamp }> = [];
    const context = buildContext(
      {
        heartbeat: {
          async orphaned() {
            return { running: RUNNING, heartbeatAt: timestamp('2026-08-31T22:30:00Z') };
          },
          async touch() {
            /* nicht Teil dieses Zweigs */
          },
        },
        timer: {
          async running() {
            return null;
          },
          async stop(note: string, now: Timestamp) {
            stopCalls.push({ note, now });
            // Der Rückgabewert dieses Aufrufs wird von `resolveOrphanedTimer`
            // im "discarded"-Zweig NICHT gelesen — der Grund kommt
            // ausschließlich aus `decision.reason` (siehe Kopfkommentar).
            // Ein `ok({ kind: 'discarded' })`, dessen "reason" hier fehlt
            // (der Port kennt gar kein `reason`-Feld), ist deshalb die
            // richtige Attrappe.
            return ok({ kind: 'discarded' as const });
          },
        },
      },
      timestamp('2026-08-31T23:00:00Z'),
    );

    const result = await resolveOrphanedTimer(context, 'discard');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ kind: 'discarded', reason: 'orphan_discarded', poolMovement: null });
    // Verwerfen räumt trotzdem auf: `unit.timer.stop` wurde aufgerufen, mit
    // dem Startzeitpunkt der Buchung (E-058 Punkt 6: "Verwerfen bewegt
    // nichts", die Buchung entsteht gar nicht).
    expect(stopCalls).toEqual([{ note: '', now: RUNNING.startedAt }]);
  });

  it('resolution: "book_until_heartbeat" OHNE jemals geschriebenes Lebenszeichen -> reason: "timer_too_short" (kein orphan_discarded ohne ausdrückliches Verwerfen)', async () => {
    const context = buildContext(
      {
        heartbeat: {
          async orphaned() {
            // heartbeatAt: null — nie ein Lebenszeichen geschrieben. Ohne
            // Lebenszeichen fällt die Dauer auf 0 (E-036), und `decideOrphanedTimer`
            // liefert "timer_too_short", nicht "orphan_discarded": Der Benutzer
            // hat nichts ausdrücklich verworfen, es gibt nur nichts zu buchen.
            return { running: RUNNING, heartbeatAt: null };
          },
          async touch() {},
        },
        timer: {
          async running() {
            return null;
          },
          async stop() {
            return ok({ kind: 'discarded' as const });
          },
        },
      },
      timestamp('2026-08-31T23:00:00Z'),
    );

    const result = await resolveOrphanedTimer(context, 'book_until_heartbeat');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ kind: 'discarded', reason: 'timer_too_short', poolMovement: null });
  });

  it('die beiden Gründe sind UNTERSCHIEDLICH bei ansonsten gleicher Ausgangslage — der Unterschied liegt allein an "resolution"', async () => {
    const orphan = { running: RUNNING, heartbeatAt: null as Timestamp | null };
    const makeContext = () =>
      buildContext(
        {
          heartbeat: {
            async orphaned() {
              return orphan;
            },
            async touch() {},
          },
          timer: {
            async running() {
              return null;
            },
            async stop() {
              return ok({ kind: 'discarded' as const });
            },
          },
        },
        timestamp('2026-08-31T23:00:00Z'),
      );

    const discarded = await resolveOrphanedTimer(makeContext(), 'discard');
    const tooShort = await resolveOrphanedTimer(makeContext(), 'book_until_heartbeat');

    expect(discarded.ok && discarded.value.kind === 'discarded' ? discarded.value.reason : null).toBe(
      'orphan_discarded',
    );
    expect(tooShort.ok && tooShort.value.kind === 'discarded' ? tooShort.value.reason : null).toBe(
      'timer_too_short',
    );
  });
});

describe('stopTimer — bleibt bei "timer_too_short" (O-R: POST /timer/stop kennt keine verwaiste Buchung)', () => {
  it('scheitert die Buchung an der Mindestdauer, lautet der Grund exakt "timer_too_short" und poolMovement ist null', async () => {
    const context = buildContext(
      {
        timer: {
          async running() {
            // Kein Timer "vor" dem Stopp sichtbar — für den geprüften Zweig
            // ohne Bedeutung, siehe Kopfkommentar: `booked` wird im
            // "discarded"-Ausgang nirgends gelesen.
            return null;
          },
          async stop() {
            return ok({ kind: 'discarded' as const });
          },
        },
      },
      timestamp('2026-08-31T23:00:00Z'),
    );

    const result = await stopTimer(context, '');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ kind: 'discarded', reason: 'timer_too_short', poolMovement: null });
  });
});
