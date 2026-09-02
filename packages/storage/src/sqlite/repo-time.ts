/**
 * Takt — Zeitbuchungen, Timer und Lebenszeichen (A-6.*, A-2.5, E-036).
 *
 * ---------------------------------------------------------------------------
 * Nur ein Timer gleichzeitig — dreifach gesichert, und jede Ebene hat ihren Grund
 * ---------------------------------------------------------------------------
 *
 *  1. `decideTimerStart` in der Domäne liefert `confirmation_required`, wenn
 *     schon einer läuft und der Benutzer nicht zugestimmt hat. Das ist die
 *     Rückfrage aus A-6.8 — sie **fragt**, statt einen Fehler zu zeigen.
 *  2. Der Anwendungsfall setzt Stopp, gegebenenfalls das Aufheben von
 *     „Erledigt" und den neuen Start in **eine** Transaktion. Ein Abbruch
 *     dazwischen hinterlässt keinen der Teilschritte.
 *  3. `ux_time_entry_running`, ein eindeutiger Teilindex auf `ended_at IS
 *     NULL`, verhindert den zweiten laufenden Timer strukturell. Er ersetzt 1
 *     und 2 nicht, sondern sichert sie ab: Was die Regel zu prüfen vergisst,
 *     weist die Datenbank ab.
 *
 * ---------------------------------------------------------------------------
 * Warum Ende und Dauer nicht getrennt geschrieben werden
 * ---------------------------------------------------------------------------
 *
 * `duration_seconds` ist eine berechnete Spalte (`GENERATED ALWAYS AS ...
 * STORED`). Sie kann gar nicht von Start und Ende abweichen, weil sie nicht
 * geschrieben wird. Eine mitgeführte Dauer wäre eine zweite Wahrheit über
 * dieselbe Zeit — und die eine, die in die Rechnung ginge.
 */

import type { TimeEntryFilter, TimeEntryPort, TimerHeartbeatPort, TimerPort, Page, Pagination } from '../ports.ts';
import type {
  CalendarDay,
  CalendarDayBounds,
  RunningTimeEntry,
  TimeEntry,
  TimeEntryId,
  Timestamp,
  TodoId,
} from '@takt/domain';
import { calendarDayBounds, decideTimerStop, err, ok, taktError } from '@takt/domain';

import { integer, text, type SqlConnection, type SqlValue } from './database.ts';
import { attemptAtomically } from './atomic.ts';
import { attempt } from './errors.ts';
import { toRunningTimeEntry, toTimeEntry } from './mappers.ts';
import { decodeCursor, encodeCursor, pageSize } from './paging.ts';
import type { IdSource } from './ids.ts';

const COLUMNS =
  'id, todo_id, started_at, ended_at, duration_seconds, note, export_status, export_count, source, created_at, updated_at';

/**
 * Der Filter in SQL — und die Tagesgrenze kommt aus der Domäne.
 *
 * Bis T-042 stand hier `date(started_at) >= date(?)`. Das war falsch, und zwar
 * still: `date()` schneidet den **UTC**-Anteil ab, `toCalendarDay` in der
 * Domäne liefert den **Ortstag**. `date('2026-08-31T23:30:00Z')` ist der 31.
 * August, derselbe Zeitpunkt in Europe/Berlin der 1. September. Eine Buchung
 * um halb zwölf abends erschien damit unter einem anderen Tag, als der Export
 * sie gruppiert — und die Tagessumme wurde auf der falschen Seite gerundet.
 *
 * Jetzt rechnet `calendarDayBounds` den Ortstag in UTC-Grenzen um, und hier
 * wird nur noch verglichen. Der Vergleich ist lexikographisch und trotzdem
 * zeitlich richtig: `started_at` hat feste Breite und steht in UTC.
 */
function filterConditions(
  filter: TimeEntryFilter,
  timeZone: string | undefined,
): {
  readonly sql: string;
  readonly params: readonly SqlValue[];
} {
  const parts: string[] = ['ended_at IS NOT NULL'];
  const params: SqlValue[] = [];

  const boundsOf = (day: CalendarDay): CalendarDayBounds =>
    timeZone === undefined ? calendarDayBounds(day) : calendarDayBounds(day, timeZone);

  if (filter.todoId !== undefined) {
    parts.push('todo_id = ?');
    params.push(filter.todoId);
  }
  if (filter.exportStatus !== undefined) {
    parts.push('export_status = ?');
    params.push(filter.exportStatus);
  }
  if (filter.fromDay !== undefined) {
    // Der Tag einer Buchung ist der Tag ihres **Starts** (E-025). Verglichen
    // wird deshalb auf `started_at` und nie auf `ended_at`.
    parts.push('started_at >= ?');
    params.push(boundsOf(filter.fromDay).startsAt);
  }
  if (filter.toDay !== undefined) {
    // Halboffen nach oben: der erste Zeitpunkt des Folgetags, ausgeschlossen.
    // Ein `<=` auf 23:59:59 verlöre die letzte Sekunde des Tages.
    parts.push('started_at < ?');
    params.push(boundsOf(filter.toDay).endsBefore);
  }
  if (filter.onlyPreviouslyExported === true) {
    // R-10: schon einmal exportiert und wieder offen. Das ist **kein** dritter
    // Status (E-032), sondern offen mit `export_count > 0`.
    parts.push("export_status = 'open' AND export_count > 0");
  }

  return { sql: `WHERE ${parts.join(' AND ')}`, params };
}

/**
 * @param timeZone Zone für die Tagesgrenze der Filter `fromDay`/`toDay`
 *   (E-025). Ohne Angabe die des Rechners — dieselbe Vorgabe wie im
 *   Exportleser, damit beide denselben Tagesbegriff benutzen.
 */
export function createTimeEntryPort(
  conn: SqlConnection,
  ids: IdSource,
  timeZone?: string,
): TimeEntryPort {
  const loadOne = (id: TimeEntryId): TimeEntry | null => {
    const row = conn.prepare(`SELECT ${COLUMNS} FROM time_entry WHERE id = ?`).get(id);
    if (row === undefined) return null;
    if (row['ended_at'] === null) return null;
    return toTimeEntry(row);
  };

  return {
    async load(id) {
      return loadOne(id);
    },

    async search(filter, pagination?: Pagination): Promise<Page<TimeEntry>> {
      const { sql, params } = filterConditions(filter, timeZone);
      const total = integer(
        conn.prepare(`SELECT COUNT(*) AS n FROM time_entry ${sql}`).get(...params) ?? { n: 0 },
        'n',
      );

      const limit = pageSize(pagination?.limit);
      const cursor = decodeCursor(pagination?.cursor);
      const keyed =
        cursor === null
          ? { sql: '', params: [] as SqlValue[] }
          : {
              sql: 'AND (started_at < ? OR (started_at = ? AND id < ?))',
              params: [cursor.sort, cursor.sort, cursor.id] as SqlValue[],
            };

      const rows = conn
        .prepare(
          `SELECT ${COLUMNS} FROM time_entry ${sql} ${keyed.sql}
            ORDER BY started_at DESC, id DESC LIMIT ?`,
        )
        .all(...params, ...keyed.params, limit + 1);

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const last = page[page.length - 1];

      return {
        items: page.map(toTimeEntry),
        nextCursor:
          hasMore && last !== undefined
            ? encodeCursor({ sort: text(last, 'started_at'), id: text(last, 'id') })
            : null,
        total,
      };
    },

    /**
     * Manuelle Buchung (A-6.1).
     *
     * Sie umgeht den Timer, unterliegt aber denselben Regeln: Ende nach Start,
     * Dauer mindestens eine Sekunde, dieselben CHECKs. `source = 'manual'`
     * unterscheidet sie in der Anzeige und hat auf den Export keinen Einfluss.
     */
    async create(input, now) {
      const id = ids.next() as TimeEntryId;
      const outcome = attempt(() =>
        conn
          .prepare(
            `INSERT INTO time_entry (id, todo_id, started_at, ended_at, note, export_status, export_count, source, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'open', 0, 'manual', ?, ?)`,
          )
          .run(id, input.todoId, input.startedAt, input.endedAt, input.note, now, now),
      );
      if (!outcome.ok) return err(outcome.error);

      const created = loadOne(id);
      if (created === null) throw new Error('Die angelegte Buchung ist nicht auffindbar.');
      return ok(created);
    },

    /**
     * A-6.9 — eine exportierte Buchung ist gesperrt.
     *
     * Geprüft wird hier **und** im Trigger `trg_time_entry_locked`. Die
     * Doppelung ist Absicht: Der Trigger ist die verlässliche Grenze, die
     * Prüfung hier liefert den deutschen Satz statt einer Abbruchmeldung.
     */
    async update(id, fields, now) {
      const existing = loadOne(id);
      if (existing === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
      if (existing.exportStatus === 'exported') {
        return err(
          taktError(
            'time_entry_locked',
            'Diese Buchung ist exportiert und damit gesperrt. Setzen Sie zuerst ihren Exportstatus zurück.',
          ),
        );
      }

      const outcome = attempt(() => {
        const sets: string[] = [];
        const params: SqlValue[] = [];
        if (fields.todoId !== undefined) {
          sets.push('todo_id = ?');
          params.push(fields.todoId);
        }
        if (fields.startedAt !== undefined) {
          sets.push('started_at = ?');
          params.push(fields.startedAt);
        }
        if (fields.endedAt !== undefined) {
          sets.push('ended_at = ?');
          params.push(fields.endedAt);
        }
        if (fields.note !== undefined) {
          sets.push('note = ?');
          params.push(fields.note);
        }
        sets.push('updated_at = ?');
        params.push(now, id);
        conn.prepare(`UPDATE time_entry SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      });
      if (!outcome.ok) {
        return err(outcome.error as never);
      }

      const updated = loadOne(id);
      if (updated === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
      return ok(updated);
    },

    async remove(id) {
      const existing = loadOne(id);
      if (existing === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
      if (existing.exportStatus === 'exported') {
        return err(
          taktError(
            'time_entry_locked',
            'Eine exportierte Buchung wird nicht gelöscht. Setzen Sie ihren Exportstatus zurück, wenn sie erneut abgerechnet werden soll.',
          ),
        );
      }
      const outcome = attempt(() => conn.prepare('DELETE FROM time_entry WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as never);
      return ok(undefined);
    },

    async sumSeconds(filter) {
      const { sql, params } = filterConditions(filter, timeZone);
      const row = conn
        .prepare(`SELECT COALESCE(SUM(duration_seconds), 0) AS seconds FROM time_entry ${sql}`)
        .get(...params);
      return row === undefined ? 0 : integer(row, 'seconds');
    },
  };
}

export function createTimerPort(conn: SqlConnection, ids: IdSource): TimerPort {
  const running = (): RunningTimeEntry | null => {
    const row = conn
      .prepare(`SELECT id, todo_id, started_at, note FROM time_entry WHERE ended_at IS NULL LIMIT 1`)
      .get();
    return row === undefined ? null : toRunningTimeEntry(row);
  };

  const loadEntry = (id: TimeEntryId): TimeEntry | null => {
    const row = conn.prepare(`SELECT ${COLUMNS} FROM time_entry WHERE id = ?`).get(id);
    if (row === undefined || row['ended_at'] === null) return null;
    return toTimeEntry(row);
  };

  return {
    async running() {
      return running();
    },

    /**
     * Start (A-6.2, A-6.8, A-2.5).
     *
     * Der ganze Ablauf liegt in der Transaktion, die der Aufrufer geöffnet
     * hat: laufenden Timer beenden, „Erledigt" aufheben, neuen Timer anlegen.
     * Ein Abbruch dazwischen hinterlässt keinen der drei Schritte — insbesondere
     * keinen Zustand, in dem das Todo aktiv ist, aber kein Timer läuft.
     *
     * **Diese Zusage stand bis T-047 nur im Text.** Die drei Schritte lagen in
     * der Klammer, aber der letzte war in `attempt` gefasst: Eine SQLite-Störung
     * beim Einfügen wurde zu einem **Wert**, der Aufrufer bekam `err(...)`, und
     * die Transaktionsklammer sah keinen Wurf und schrieb die ersten beiden
     * Schritte fest. Genau der Zustand, den der Absatz oben ausschließt — der
     * alte Timer gestoppt, „Erledigt" aufgehoben, kein Timer laufend. Seither
     * liegen alle drei Schritte in **einem** Sicherungspunkt.
     *
     * `stopRunning` ist die **Antwort des Benutzers** auf die Rückfrage aus
     * A-6.8, nicht eine Bequemlichkeit des Aufrufers. Ohne sie wird nichts
     * angefasst.
     */
    async start(todoId: TodoId, stopRunning: boolean, now: Timestamp) {
      const todo = conn.prepare('SELECT id, completed_at FROM todo WHERE id = ?').get(todoId);
      if (todo === undefined) {
        return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
      }

      const current = running();
      if (current !== null && !stopRunning) {
        return err(
          taktError(
            'timer_already_running',
            'Es läuft bereits ein Timer. Er muss zuerst gestoppt werden.',
          ),
        );
      }

      const id = ids.next() as TimeEntryId;
      const outcome = attemptAtomically(conn, 'takt_timer_start', () => {
        let stopped: TimeEntry | null = null;
        if (current !== null) {
          const decision = decideTimerStop({ running: current, note: current.note, now });
          if (decision.kind === 'recorded') {
            conn
              .prepare('UPDATE time_entry SET ended_at = ?, note = ?, updated_at = ? WHERE id = ?')
              .run(decision.entry.endedAt, decision.entry.note, now, current.id);
            stopped = loadEntry(current.id);
          } else {
            // Zu kurz: die Zeile wird verworfen statt mit Dauer 0 abgelegt. Der
            // CHECK auf `duration_seconds >= 1` ließe sie ohnehin nicht zu.
            conn.prepare('DELETE FROM time_entry WHERE id = ?').run(current.id);
          }
        }

        // A-2.5 — der Start hebt „Erledigt" auf. `status_id` bleibt unangetastet
        // (E-023): Das Erledigen hat die Karte nie verschoben. Die
        // Pool-Zugehörigkeit ist aus den Tags abgeleitet und nirgends gespeichert
        // (A-3.4) — sie kommt ohne Schreibvorgang zurück.
        const doneCleared = todo['completed_at'] !== null;
        if (doneCleared) {
          conn
            .prepare('UPDATE todo SET completed_at = NULL, updated_at = ? WHERE id = ?')
            .run(now, todoId);
        }

        conn
          .prepare(
            `INSERT INTO time_entry (id, todo_id, started_at, ended_at, note, export_status, export_count, source, created_at, updated_at)
             VALUES (?, ?, ?, NULL, '', 'open', 0, 'timer', ?, ?)`,
          )
          .run(id, todoId, now, now, now);

        const started = running();
        // Kein SQLite-Fehler, sondern ein Widerspruch im eigenen Haus:
        // `attempt` reicht ihn weiter, und die äußere Klammer nimmt alles
        // zurück. So soll es sein.
        if (started === null) throw new Error('Der gestartete Timer ist nicht auffindbar.');

        return { started, stopped, doneCleared };
      });
      if (!outcome.ok) return err(outcome.error as never);

      return ok(outcome.value);
    },

    /**
     * Stopp (A-6.2, A-6.4).
     *
     * Ende und Leistung gehen in **einer** Anweisung. Zwei Anweisungen ließen
     * einen Zwischenzustand zu, in dem die Buchung abgeschlossen, aber ohne
     * Leistungstext wäre — und genau der käme in einen Export, der zwischen
     * beiden liefe (E-034).
     */
    async stop(note: string, now: Timestamp) {
      const current = running();
      if (current === null) {
        return err(taktError('timer_not_running', 'Es läuft kein Timer.'));
      }

      const decision = decideTimerStop({ running: current, note, now });

      if (decision.kind === 'discarded') {
        conn.prepare('DELETE FROM time_entry WHERE id = ?').run(current.id);
        return ok({ kind: 'discarded' as const });
      }

      const outcome = attempt(() =>
        conn
          .prepare('UPDATE time_entry SET ended_at = ?, note = ?, updated_at = ? WHERE id = ?')
          .run(decision.entry.endedAt, decision.entry.note, now, current.id),
      );
      if (!outcome.ok) return err(outcome.error as never);

      const entry = loadEntry(current.id);
      if (entry === null) throw new Error('Die gestoppte Buchung ist nicht auffindbar.');
      return ok({ kind: 'recorded' as const, entry });
    },
  };
}

/**
 * Das Lebenszeichen (E-036).
 *
 * Der einzige Schreibvorgang in Takt, der im Minutentakt läuft — und er fasst
 * die Zeile mit den Abrechnungsdaten ausdrücklich **nicht** an. Er schreibt in
 * eine eigene Tabelle mit genau einer Zeile.
 */
export function createTimerHeartbeatPort(conn: SqlConnection): TimerHeartbeatPort {
  return {
    async touch(timeEntryId, now) {
      conn
        .prepare(
          `INSERT INTO timer_heartbeat (time_entry_id, seen_at) VALUES (?, ?)
             ON CONFLICT (time_entry_id) DO UPDATE SET seen_at = excluded.seen_at`,
        )
        .run(timeEntryId, now);
    },

    async lastSeen(timeEntryId) {
      const row = conn
        .prepare('SELECT seen_at FROM timer_heartbeat WHERE time_entry_id = ?')
        .get(timeEntryId);
      return row === undefined ? null : (text(row, 'seen_at') as Timestamp);
    },

    /**
     * Die beim Start vorgefundene unvollständige Buchung.
     *
     * Sie bleibt ohne Ende, bis der Benutzer geantwortet hat, und geht in
     * keinen Export: `v_export_candidate` führt ausschließlich abgeschlossene
     * Buchungen. Das ist der Grund, warum diese Frage warten darf, ohne dass
     * jemand zu viel abrechnet.
     */
    async orphaned() {
      const row = conn
        .prepare(
          `SELECT te.id, te.todo_id, te.started_at, te.note, hb.seen_at
             FROM time_entry te
             LEFT JOIN timer_heartbeat hb ON hb.time_entry_id = te.id
            WHERE te.ended_at IS NULL
            LIMIT 1`,
        )
        .get();
      if (row === undefined) return null;

      const seenAt = row['seen_at'];
      return {
        running: toRunningTimeEntry(row),
        heartbeatAt: typeof seenAt === 'string' ? (seenAt as Timestamp) : null,
      };
    },
  };
}
