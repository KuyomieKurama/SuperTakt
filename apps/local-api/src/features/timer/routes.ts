/**
 * Takt — Routen für Zeitbuchungen und Timer (A-6.*, A-7.3, E-012, E-036).
 *
 * `/timer/start` und `/timer/stop` statt `POST` und `DELETE` auf `/timer`: Die
 * Ressourcenform wäre sauberer, aber beide Vorgänge tragen Fachlogik, die ein
 * Leser der Schnittstelle sehen soll. Der Start kann eine **Rückfrage**
 * auslösen (A-6.8) und ein „Erledigt" aufheben (A-2.5); der Stopp liefert eine
 * erzeugte Buchung **oder** verwirft sie. Ein `DELETE`, das einen Datensatz
 * zurückgibt, verschleiert das mehr, als die Form einbringt (architektur.md
 * 5.1).
 *
 * `/time-entries/{id}/export-status` kann den Status ausschließlich auf `open`
 * setzen. Der Weg nach `exported` führt allein über einen Exportlauf — sonst
 * gäbe es eine als abgerechnet markierte Buchung ohne Beleg.
 *
 * `/time-entries/{id}/not-billed` ist der zweite und einzige andere Weg nach
 * `exported` (E-047). Er ist ausdrücklich **kein** Export: keine Datei, kein
 * Exportlauf, eigener Ereignistyp im Protokoll. Deshalb steht er als eigener
 * Vorgang da und nicht als weiterer erlaubter Wert von `export-status` — ein
 * `PUT {"status":"exported"}` würde genau die Gleichsetzung nahelegen, die
 * E-047 aufhebt: „nicht abrechnen" ist nicht „von Hand exportiert".
 */

import { Hono } from 'hono';
import { beginIdle, loadIdle, resolveIdle, returnFromIdle } from './idle.ts';
import { z } from 'zod';

import type {
  CalendarDay,
  ExportStatus,
  PoolMovement,
  TimeEntry,
  TimeEntryId,
  Timestamp,
  TodoId,
  IdleAllocation,
} from '@takt/domain';

import type { AppContext } from '../../context.ts';
import type { CreatedTimeEntry } from './bookings.ts';
import {
  createTimeEntry,
  listTimeEntries,
  loadTimeEntry,
  removeTimeEntry,
  updateTimeEntry,
} from './bookings.ts';
import {
  loadOrphanedTimer,
  loadRunningTimer,
  resolveOrphanedTimer,
  startTimer,
  stopTimer,
  touchHeartbeat,
} from './timer.ts';
/**
 * Die **einzige** Kante zwischen zwei Merkmalen im ganzen Dienst — und sie ist
 * Absicht, kein Rest (T-257, F-T257-5).
 *
 * `PUT /time-entries/{id}/export-status` und `POST /time-entries/{id}/not-billed`
 * hängen an der Buchung; die Regel, ob der Wechsel zulässig ist, hängt am
 * Export (`checkExportStatusTransition`, E-012, E-047). Der Exportstatus einer
 * Buchung **ist** eine Eigenschaft, die beim Buchen entsteht und beim
 * Exportieren gelesen wird. Zwei Merkmale, die einander fachlich wirklich
 * kennen, sind kein Strukturfehler — eine erfundene Zwischenschicht wäre einer.
 *
 * Wer hier aufräumen will, hat drei Wege, und alle drei sind schlechter: die
 * Anwendungsfälle verdoppeln (zwei Fassungen einer Abrechnungsregel), sie
 * hierher ziehen (dann steht das Exportprotokoll an zwei Orten) oder eine
 * gemeinsame Mappe zwischen `timer` und `export` erfinden (die Schicht, die der
 * Auftraggeber ausgeschlossen hat).
 */
import { markNotBilled, setExportStatus } from '../export/status.ts';
import { data, fail, failValidation } from '../../http/problem.ts';
import {
  daySchema,
  idSchema,
  readFlag,
  readJson,
  readPagination,
  textSchema,
  timestampSchema,
  toFieldErrors,
} from '../../http/input.ts';
import type { TaktEnv } from '../../http/guards.ts';

const createEntrySchema = z.object({
  todoId: idSchema,
  startedAt: timestampSchema,
  endedAt: timestampSchema,
  /** Die **Leistung** (A-7.3, E-016). Sie geht in die Abrechnung, der Vermerk nicht. */
  note: textSchema.default(''),
});

const updateEntrySchema = z.object({
  todoId: idSchema.optional(),
  startedAt: timestampSchema.optional(),
  endedAt: timestampSchema.optional(),
  note: textSchema.optional(),
});

/**
 * `status` ist als `open` festgelegt und nicht offen für `exported`.
 *
 * Der Versuch, `exported` zu setzen, wird trotzdem nicht hier abgefangen,
 * sondern in der Domäne (`checkExportStatusTransition`) — damit die Antwort
 * `export_status_not_settable` heißt und nicht „ungültiger Wert". Der
 * Unterschied ist der zwischen einer Regel und einem Tippfehler.
 */
const exportStatusSchema = z.object({
  status: z.enum(['open', 'exported']),
  reason: z.string().trim().min(1).max(512),
});

/**
 * E-047: `reason` ist **freiwillig**. Ein Pflichtfeld erzeugt in der Praxis den
 * Text „x" und nichts weiter; was zählt, ist die Nachvollziehbarkeit des
 * Vorgangs. Fehlt das Feld ganz, steht im Protokoll die leere Zeichenkette —
 * derselbe Wert, den die Spalte als Voreinstellung führt.
 */
const notBilledSchema = z.object({
  reason: z.string().trim().max(512).default(''),
});

const startSchema = z.object({
  todoId: idSchema,
  /** Die Antwort auf die Rückfrage aus A-6.8, nicht eine Bequemlichkeit. */
  stopRunning: z.boolean().default(false),
});

const stopSchema = z.object({ note: textSchema.default('') });
const resolveSchema = z.object({ resolution: z.enum(['book_until_heartbeat', 'discard']) });
const idleBeginSchema = z.object({ entryId: idSchema, startedAt: timestampSchema, returnedAt: timestampSchema.optional() }).strict();
const idleReturnSchema = z.object({ id: idSchema, returnedAt: timestampSchema.optional() }).strict();
const idleResolveSchema = z.object({
  id: idSchema,
  resume: z.boolean(),
  allocations: z.array(z.object({ todoId: idSchema.nullable(), seconds: z.number().int().min(1).max(315360000), note: textSchema }).strict()).min(1).max(50),
}).strict();

/** Rumpfschemata nach `operationId`; gelesen von `proof:openapi`, siehe `todos.ts`. */
export const REQUEST_SCHEMAS = Object.freeze({
  createTimeEntry: createEntrySchema,
  updateTimeEntry: updateEntrySchema,
  resetExportStatus: exportStatusSchema,
  markTimeEntryNotBilled: notBilledSchema,
  startTimer: startSchema,
  stopTimer: stopSchema,
  resolveOrphanedTimer: resolveSchema,
  beginIdle: idleBeginSchema,
  returnFromIdle: idleReturnSchema,
  resolveIdle: idleResolveSchema,
});

export function createTimeEntryRoutes(context: AppContext): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  routes.get('/', async (c) => {
    const query = c.req.query();
    const page = await listTimeEntries(
      context,
      {
        ...(query['todoId'] === undefined ? {} : { todoId: query['todoId'] as TodoId }),
        ...(query['exportStatus'] === undefined
          ? {}
          : { exportStatus: query['exportStatus'] as ExportStatus }),
        // `CalendarDay` ist ein Kalendertag **in Ortszeit** (E-025). Die
        // Umrechnung in UTC-Grenzen macht `calendarDayBounds` in der Domäne;
        // hier wird nur die Gestalt geprüft.
        ...(query['fromDay'] === undefined
          ? {}
          : { fromDay: daySchema.parse(query['fromDay']) as CalendarDay }),
        ...(query['toDay'] === undefined
          ? {}
          : { toDay: daySchema.parse(query['toDay']) as CalendarDay }),
        ...(readFlag(query['onlyPreviouslyExported']) ? { onlyPreviouslyExported: true } : {}),
      },
      readPagination(query),
    );
    return data(c, page);
  });

  routes.post('/', async (c) => {
    const parsed = createEntrySchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await createTimeEntry(context, {
      todoId: parsed.data.todoId as TodoId,
      startedAt: parsed.data.startedAt as Timestamp,
      endedAt: parsed.data.endedAt as Timestamp,
      note: parsed.data.note,
    });
    if (!result.ok) return fail(c, result.error);

    c.header('Location', `/api/v1/time-entries/${result.value.entry.id}`);
    return data(c, entryAfterBooking(result.value), 201);
  });

  routes.get('/:timeEntryId', async (c) => {
    const result = await loadTimeEntry(context, c.req.param('timeEntryId') as TimeEntryId);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.patch('/:timeEntryId', async (c) => {
    const parsed = updateEntrySchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await updateTimeEntry(context, c.req.param('timeEntryId') as TimeEntryId, {
      ...(parsed.data.todoId === undefined ? {} : { todoId: parsed.data.todoId as TodoId }),
      ...(parsed.data.startedAt === undefined ? {} : { startedAt: parsed.data.startedAt as Timestamp }),
      ...(parsed.data.endedAt === undefined ? {} : { endedAt: parsed.data.endedAt as Timestamp }),
      ...(parsed.data.note === undefined ? {} : { note: parsed.data.note }),
    });
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.delete('/:timeEntryId', async (c) => {
    const result = await removeTimeEntry(context, c.req.param('timeEntryId') as TimeEntryId);
    return result.ok ? c.body(null, 204) : fail(c, result.error);
  });

  /** E-012, R-10 — Zurücksetzen. Statuswechsel und Protokollzeile oder keines. */
  routes.put('/:timeEntryId/export-status', async (c) => {
    const parsed = exportStatusSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await setExportStatus(
      context,
      c.req.param('timeEntryId') as TimeEntryId,
      parsed.data.status,
      parsed.data.reason,
    );
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  /**
   * E-047 — nicht abrechnen. Statuswechsel und Protokollzeile oder keines.
   *
   * `POST` und nicht `PUT`: Der Vorgang ist nicht das Setzen eines Wertes,
   * sondern eine Entscheidung mit Protokollfolge, und er ist nur einmal
   * möglich. Ein zweiter Aufruf auf derselben Buchung ergibt `409`
   * (`export_status_unchanged`) — sie ist dann bereits ausgebucht oder
   * exportiert.
   */
  routes.post('/:timeEntryId/not-billed', async (c) => {
    // `?? {}`: Der einzige Feldwert ist freiwillig, ein leerer Rumpf also
    // zulässig. Ohne diese Zeile ergäbe „kein Rumpf" eine Gestaltrüge (422)
    // für ein Feld, das niemand angeben muss.
    const parsed = notBilledSchema.safeParse((await readJson(c.req.raw)) ?? {});
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await markNotBilled(
      context,
      c.req.param('timeEntryId') as TimeEntryId,
      parsed.data.reason,
    );
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  return routes;
}

export function createTimerRoutes(context: AppContext): Hono<TaktEnv> {
  const routes = new Hono<TaktEnv>();

  routes.get('/', async (c) => data(c, await loadRunningTimer(context)));

  /**
   * A-6.8 — läuft schon einer, wird **gefragt**.
   *
   * Der Statuscode für die Rückfrage ist `200`, nicht `409`: Es ist kein
   * Fehler des Aufrufers, sondern der vorgesehene erste Schritt eines
   * zweistufigen Vorgangs. Ein `409` liefe in jeder Fehleranzeige auf und
   * ließe den Benutzer an eine Störung glauben, wo keine ist.
   */
  routes.post('/start', async (c) => {
    const parsed = startSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await startTimer(
      context,
      parsed.data.todoId as TodoId,
      parsed.data.stopRunning,
    );
    if (!result.ok) return fail(c, result.error);
    return data(c, result.value, result.value.kind === 'started' ? 201 : 200);
  });

  routes.post('/stop', async (c) => {
    const parsed = stopSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await stopTimer(context, parsed.data.note);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  routes.get('/idle', async c => data(c, await loadIdle(context)));
  routes.post('/idle/begin', async c => {
    const parsed = idleBeginSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));
    const result = await beginIdle(context, { entryId: parsed.data.entryId as TimeEntryId, startedAt: parsed.data.startedAt as Timestamp,
      ...(parsed.data.returnedAt === undefined ? {} : { returnedAt: parsed.data.returnedAt as Timestamp }) });
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });
  routes.post('/idle/return', async c => {
    const parsed = idleReturnSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));
    const result = await returnFromIdle(context, parsed.data.id as TimeEntryId, parsed.data.returnedAt as Timestamp | undefined);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });
  routes.post('/idle/resolve', async c => {
    const parsed = idleResolveSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));
    const result = await resolveIdle(context, { id: parsed.data.id as TimeEntryId, resume: parsed.data.resume, allocations: parsed.data.allocations as readonly IdleAllocation[] });
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  /** E-036 — Lebenszeichen. Kein laufender Timer ist kein Fehler. */
  routes.post('/heartbeat', async (c) => {
    const result = await touchHeartbeat(context);
    return result.ok ? data(c, { seenAt: result.value }) : fail(c, result.error);
  });

  routes.get('/orphaned', async (c) => data(c, await loadOrphanedTimer(context)));

  routes.post('/orphaned/resolve', async (c) => {
    const parsed = resolveSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return failValidation(c, toFieldErrors(parsed.error));

    const result = await resolveOrphanedTimer(context, parsed.data.resolution);
    return result.ok ? data(c, result.value) : fail(c, result.error);
  });

  return routes;
}

/**
 * Der Antwortrumpf von `POST /time-entries` (E-061 Nachtrag, O-V).
 *
 * ---------------------------------------------------------------------------
 * Warum die Buchung **flach** dasteht und nicht unter `entry`
 * ---------------------------------------------------------------------------
 *
 * Weil die Route seit jeher die Buchung selbst zurückgibt und jeder Aufrufer
 * sie so liest. `poolMovement` kommt hinzu, es nimmt nichts weg: Wer die
 * Antwort heute als `TimeEntry` liest, liest sie morgen unverändert weiter,
 * und wer den Bewegungssatz will, liest ein Feld mehr. Ein Umbau nach
 * `{ entry, poolMovement }` hätte dieselbe Auskunft gegeben und jede
 * vorhandene Aufrufstelle gebrochen — für nichts.
 *
 * Es ist dieselbe Gestalt wie an `PUT`/`DELETE /todos/{todoId}/done`
 * (`doneBody` in `routes/todos.ts`) und an `POST /timer/start`: das Ergebnis
 * der Handlung und die Bewegung nebeneinander, nicht ineinander.
 *
 * Diese Datei entscheidet nichts Fachliches. Sie setzt zusammen, was der
 * Anwendungsfall geliefert hat.
 */
function entryAfterBooking(
  result: CreatedTimeEntry,
): TimeEntry & { poolMovement: PoolMovement | null } {
  return { ...result.entry, poolMovement: result.poolMovement };
}

