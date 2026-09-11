/**
 * Takt — Zeitbuchungen ohne Timer (A-6.1, A-6.5, A-7.3, E-061 Nachtrag).
 *
 * Dieselbe Buchung, ein anderer Knopf. Was hier entsteht, ist von einer
 * Buchung aus dem Timerstopp nicht zu unterscheiden — und deshalb rechnet
 * `createTimeEntry` die Pool-Bewegung mit **denselben** Funktionen wie der
 * Stopp (`movement.ts` nebenan). Der lange Absatz an {@link CreatedTimeEntry}
 * sagt, warum das nicht bequem, sondern nötig ist.
 *
 * Der Grund, warum diese Datei im Merkmal `timer` liegt und nicht in einem
 * eigenen: Sie teilt sich diese Rechnung mit ihm. Eine eigene Mappe hieße,
 * zwei private Helfer über eine Merkmalsgrenze zu exportieren — für sieben
 * Aufrufstellen, deren Gleichlauf die Anforderung ist.
 */

import type { PoolMovement, TimeEntry, TimeEntryId, Timestamp, TodoId } from '@takt/domain';
import { err, ok, taktError } from '@takt/domain';
import type { Page, Pagination, TimeEntryFilter } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';
import { movementOfBooking, presenceBeforeBooking } from './movement.ts';

export interface CreateTimeEntryInput {
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  /** Die **Leistung** (A-7.3, E-016). Sie geht in die Abrechnung. */
  readonly note: string;
}

/**
 * Die angelegte Buchung — und was sie durch die Pools bewegt hat
 * (E-061 Nachtrag, O-V).
 *
 * ---------------------------------------------------------------------------
 * Warum die Buchung von Hand überhaupt etwas zu berichten hat
 * ---------------------------------------------------------------------------
 *
 * Weil sie die **erste** Buchung eines Todos sein kann. Seit E-055 fragt eine
 * Regel nach dem Exportstatus (`exportState: 'open'` — „was habe ich noch
 * nicht abgerechnet"), und ein Todo ohne jede abgeschlossene Buchung erfüllt
 * diese Achse nicht. Mit der ersten erfüllt es sie, und jede solche Spalte
 * nimmt es auf.
 *
 * Der Timerstopp sagt das seit E-058 Punkt 6 an; der Weg ohne Timer schwieg.
 * Es ist derselbe Übergang, ausgelöst über einen anderen Knopf — und wer an
 * einer Stelle Auskunft gibt und an der anderen schweigt, sagt die halbe
 * Wahrheit.
 *
 * ---------------------------------------------------------------------------
 * Warum das **Zustandspaar des Stopps** und nicht das der Buchung
 * ---------------------------------------------------------------------------
 *
 * Der Nachtrag zu E-061 nennt in Klammern `bookingMovementStates` und im
 * selben Satz „dieselbe Rechnung … wie der Timerstopp". Beides zugleich geht
 * nicht: Der Stopp rechnet mit {@link closedEntryMovementStates}. Der
 * Unterschied ist genau eine Achse — `BOOKING_EFFECT` setzt zusätzlich
 * `completedAt: null`, „Buchen hebt „Erledigt" auf".
 *
 * Diese Route hebt es **nicht** auf. `TimeEntryPort.create` schreibt eine
 * Zeile in `time_entry` und sonst nichts; kein Trigger faßt `todo.completed_at`
 * an, und A-2.5 spricht vom **Starten** der Zeiterfassung, nicht vom Nachtragen
 * eines Zeitraums. (Die Buchung aus dem Aufgabenbereich des Add-ins hebt es
 * auf — dort steht `clearDone` ausdrücklich in derselben Transaktion.)
 *
 * Mit `BOOKING_EFFECT` meldete diese Route also für ein erledigtes Todo ein
 * Verlassen jeder Spalte `completion: 'done'`, das nicht stattfindet: Der
 * Benutzer läse „ist aus „Erledigt“ verschwunden." und sähe die Karte
 * danebenstehen. Das ist wörtlich der Fehler, gegen den `ENTRY_CLOSED_EFFECT`
 * in T-101 eingeführt wurde.
 *
 * Deshalb {@link movementOfBooking} — dieselbe Funktion, die `POST /timer/stop`
 * und `POST /timer/orphaned/resolve` benutzen. Der **Anlaß** ist `'booking'`
 * wie dort. Soll die Buchung von Hand „Erledigt" künftig aufheben wie die des
 * Add-ins, ist das eine Verhaltensänderung mit eigener Entscheidung; dann
 * ändert sich hier eine Zeile und dort eine Transaktion.
 *
 * ---------------------------------------------------------------------------
 * Warum ein Feld und kein flacher Rückgabewert
 * ---------------------------------------------------------------------------
 *
 * Der Anwendungsfall liefert beides getrennt, die Route setzt es flach
 * zusammen (`routes/time.ts`). Die Grenze ist dieselbe wie bei `TodoDoneResult`
 * in `features/todos/todos.ts`: Was die Handlung ergeben hat und was daraus folgt,
 * sind zwei Auskünfte; wie sie über HTTP aussehen, entscheidet der Adapter.
 */
export interface CreatedTimeEntry {
  readonly entry: TimeEntry;
  /** Wie die Buchung das Todo durch die Pools bewegt — oder `null`. */
  readonly poolMovement: PoolMovement | null;
}

/**
 * Zeitbuchung von Hand anlegen (A-6.1) und ansagen, was sie bewegt
 * (E-061 Nachtrag).
 *
 * **Die Buchungslage wird vor dem Schreiben gelesen.** Danach ist `hasOpen`
 * immer wahr, und ob es das vorher schon war, ließe sich nicht mehr sagen —
 * genau daran hängt aber, ob es überhaupt eine Bewegung gab. Siehe
 * {@link presenceBeforeBooking}.
 *
 * Beides steht in **einer** Transaktion: Die Auskunft urteilt über den
 * Bestand, in dem die Buchung entstanden ist, und nicht über einen, den es
 * inzwischen nicht mehr gibt.
 *
 * Schlägt das Anlegen fehl, wird keine Regel aufgelöst — der Fehler geht
 * unverändert heraus.
 */
export function createTimeEntry(
  context: AppContext,
  input: CreateTimeEntryInput,
): Promise<UseCaseResult<CreatedTimeEntry>> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const presence = await presenceBeforeBooking(unit, input.todoId);
    const created = await unit.timeEntries.create(input, timestamp);
    if (!created.ok) return err(created.error);

    return ok({
      entry: created.value,
      poolMovement: await movementOfBooking(unit, input.todoId, presence),
    });
  });
}

export function listTimeEntries(
  context: AppContext,
  filter: TimeEntryFilter,
  pagination: Pagination,
): Promise<Page<TimeEntry>> {
  return context.transactions.inTransaction((unit) => unit.timeEntries.search(filter, pagination));
}

export async function loadTimeEntry(
  context: AppContext,
  id: TimeEntryId,
): Promise<UseCaseResult<TimeEntry>> {
  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timeEntries.load(id);
    if (entry === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
    return ok(entry);
  });
}

export interface UpdateTimeEntryInput {
  readonly todoId?: TodoId;
  readonly startedAt?: Timestamp;
  readonly endedAt?: Timestamp;
  readonly note?: string;
}

export function updateTimeEntry(
  context: AppContext,
  id: TimeEntryId,
  input: UpdateTimeEntryInput,
): Promise<UseCaseResult<TimeEntry>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.timeEntries.update(id, input, timestamp));
}

export function removeTimeEntry(
  context: AppContext,
  id: TimeEntryId,
): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.timeEntries.remove(id));
}
