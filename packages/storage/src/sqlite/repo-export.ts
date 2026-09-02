/**
 * Takt — Export: Lesen, Festschreiben, Zurücksetzen, Protokoll
 * (A-7.2, A-8.8, E-012, E-020, E-032, R-06, R-10).
 *
 * ---------------------------------------------------------------------------
 * Die Leseseite kennt den Vermerk nicht
 * ---------------------------------------------------------------------------
 *
 * `openCandidates` und `openGroups` lesen ausschließlich `v_export_candidate`.
 * Diese Sicht führt die Spalte `todo_note.body` nicht — die Grenze aus A-7.2
 * liegt im Schema und nicht in einer Vereinbarung (R-06). Auch die
 * Tagnamen kommen aus einer zweiten Abfrage über `todo_tag` und `tag`, nicht
 * aus einer Erweiterung der Sicht: Was der Export sieht, bleibt so schmal wie
 * möglich.
 *
 * `WHERE export_status = 'open'` steht in der Sicht und wird hier **nicht**
 * wiederholt und **nicht** aufgeweicht. Eine bereits exportierte Buchung
 * desselben Tages darf nicht in die Tagesgruppe geraten; sonst würde ihre Zeit
 * ein zweites Mal abgerechnet, und die Domäne könnte es nicht bemerken, weil
 * sie nur sieht, was diese Sicht liefert (R-10).
 *
 * ---------------------------------------------------------------------------
 * `recordRun` — der schreibende Teil von A-8.8, und **nur** dieser
 * ---------------------------------------------------------------------------
 *
 * Diese Datei schreibt keine Datei und rendert keine Zeile. Sie bekommt einen
 * fertigen Lauf übergeben und schreibt ihn fest:
 *
 *   1. `export_run`
 *   2. je Zeile ein `export_run_group`, dazu die `export_run_entry`
 *   3. `export_status = 'exported'`, `export_count + 1` für jede enthaltene Buchung
 *   4. je Buchung eine Protokollzeile `export_audit` mit Lauf **und** Gruppe
 *
 * Alle vier Schritte laufen in der Transaktion, die der Aufrufer geöffnet hat.
 * Es gibt keinen Weg, 3 ohne 4 zu tun: Beides steht in derselben Schleife, und
 * die Tabelle `export_audit` hat einen CHECK, der eine Zeile ohne Lauf und
 * Gruppe ablehnt.
 *
 * **Warum das Rendern nicht hier steht.** Der Vorlagen-Motor lebt in
 * `packages/export`, und dieses Paket kennt weder Dateisystem noch Datenbank
 * (R-06). Läge das Rendern hier, müsste die Speicherung den Motor einbinden —
 * und ein austauschbarer Adapter (E-001) trüge dann das Vorlagenformat mit
 * sich. Die Klammer selbst gehört trotzdem hierher, weil sie eine
 * Datenbanktransaktion ist. Der Anwendungsfall in `apps/local-api` setzt beides
 * zusammen; die Reihenfolge steht in architektur.md 3.2.
 */

import type {
  ExportAuditFilter,
  ExportPort,
  ExportReadPort,
  ExportRunRecord,
  Page,
  Pagination,
} from '../ports.ts';
import type {
  ExportAuditEntry,
  ExportCandidate,
  ExportGroup,
  ExportRun,
  ExportRunGroupId,
  ExportRunId,
  ExportStatusResetRequest,
  NotBilledRequest,
  TagId,
  TimeEntry,
  TimeEntryId,
  TodoId,
} from '@takt/domain';
import { err, groupExportCandidates, ok, taktError } from '@takt/domain';

import {
  chunk,
  integer,
  placeholders,
  text,
  textOrNull,
  type SqlConnection,
  type SqlRow,
  type SqlValue,
} from './database.ts';
import { atomically, attemptAtomically } from './atomic.ts';
import { asTimestamp, toExportAuditEntry, toExportRun, toTimeEntry } from './mappers.ts';
import { decodeCursor, encodeCursor, pageSize } from './paging.ts';
import type { IdSource } from './ids.ts';

const CANDIDATE_COLUMNS =
  'time_entry_id, todo_id, started_at, ended_at, duration_seconds, booking_note, export_count, todo_title, todo_call_number';

const TIME_ENTRY_COLUMNS =
  'id, todo_id, started_at, ended_at, duration_seconds, note, export_status, export_count, source, created_at, updated_at';

export function createExportReadPort(conn: SqlConnection, timeZone?: string): ExportReadPort {
  /** Tagnamen je Todo, in **einer** Abfrage je Block. Kein N+1. */
  const tagNames = (todoIds: readonly string[]): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    for (const id of todoIds) map.set(id, []);
    for (const block of chunk([...new Set(todoIds)])) {
      const rows = conn
        .prepare(
          `SELECT tt.todo_id, t.name
             FROM todo_tag tt JOIN tag t ON t.id = tt.tag_id
            WHERE tt.todo_id IN (${placeholders(block.length)})
            ORDER BY tt.todo_id, t.name COLLATE NOCASE`,
        )
        .all(...block);
      for (const row of rows) {
        map.get(text(row, 'todo_id'))?.push(text(row, 'name'));
      }
    }
    return map;
  };

  const readCandidates = (ids?: readonly TimeEntryId[]): readonly ExportCandidate[] => {
    const rows: SqlRow[] = [];

    if (ids === undefined || ids.length === 0) {
      rows.push(
        ...conn
          .prepare(`SELECT ${CANDIDATE_COLUMNS} FROM v_export_candidate ORDER BY started_at, time_entry_id`)
          .all(),
      );
    } else {
      for (const block of chunk([...ids])) {
        rows.push(
          ...conn
            .prepare(
              `SELECT ${CANDIDATE_COLUMNS} FROM v_export_candidate
                WHERE time_entry_id IN (${placeholders(block.length)})
                ORDER BY started_at, time_entry_id`,
            )
            .all(...block),
        );
      }
    }

    const names = tagNames(rows.map((row) => text(row, 'todo_id')));

    return rows.map((row): ExportCandidate => {
      const todoId = text(row, 'todo_id') as TodoId;
      return {
        timeEntryId: text(row, 'time_entry_id') as TimeEntryId,
        todoId,
        startedAt: asTimestamp(text(row, 'started_at')),
        endedAt: asTimestamp(text(row, 'ended_at')),
        durationSeconds: integer(row, 'duration_seconds'),
        bookingNote: text(row, 'booking_note'),
        todoTitle: text(row, 'todo_title'),
        todoCallNumber: textOrNull(row, 'todo_call_number'),
        todoTagNames: names.get(todoId) ?? [],
        // R-10: schon einmal exportiert und wieder offen. Kein dritter Status
        // (E-032) — die Buchung ist offen, und `export_count` sagt, dass sie
        // es nicht immer war.
        previouslyExported: integer(row, 'export_count') > 0,
      };
    });
  };

  return {
    async openCandidates(ids) {
      return readCandidates(ids);
    },

    /**
     * Tagesgruppen (E-020, E-025).
     *
     * Die Gruppierung selbst macht `groupExportCandidates` in der Domäne —
     * einschließlich der Umrechnung in Ortszeit, die entscheidet, in welchen
     * Kalendertag eine Abendbuchung fällt. Eine zweite Gruppierung in SQL wäre
     * eine zweite Wahrheit über den Tagesbegriff, und sie wäre die falsche:
     * SQLite kennt die Zeitzone des Arbeitsplatzes nicht.
     */
    async openGroups(ids): Promise<readonly ExportGroup[]> {
      const candidates = readCandidates(ids);
      return timeZone === undefined
        ? groupExportCandidates(candidates)
        : groupExportCandidates(candidates, timeZone);
    },

    async openCount() {
      const row = conn.prepare('SELECT COUNT(*) AS n FROM v_export_candidate').get();
      return row === undefined ? 0 : integer(row, 'n');
    },
  };
}

export function createExportPort(conn: SqlConnection, ids: IdSource): ExportPort {
  const loadEntry = (id: TimeEntryId): TimeEntry | null => {
    const row = conn.prepare(`SELECT ${TIME_ENTRY_COLUMNS} FROM time_entry WHERE id = ?`).get(id);
    if (row === undefined || row['ended_at'] === null) return null;
    return toTimeEntry(row);
  };

  /**
   * Der Sicherungspunkt um Anweisungen, die nur gemeinsam gelten (R-10), steht
   * seit T-047 in `atomic.ts`.
   *
   * **Wogegen.** `resetStatus` und `markNotBilled` schreiben je eine
   * Protokollzeile **und** den Statuswechsel. Scheitert die zweite Anweisung,
   * bliebe die erste stehen — ein Protokoll, das etwas bezeugt, das nicht
   * geschehen ist. Genau das ist in T-041 gemessen worden.
   *
   * Er ist ausgezogen, weil T-047 dieselbe Bauart an sechs weiteren Stellen
   * gefunden hat (Kanban-Spalten, Pools, Todos, der Exportlauf selbst). Ein
   * Sicherungspunkt, der nur in dieser Datei liegt, schützt nur diese Datei.
   */
  return {
    /**
     * Schreibt einen fertigen Lauf fest. Läuft in der Transaktion des
     * Aufrufers — diese Methode öffnet keine eigene.
     *
     * Sie prüft vorher, dass **jede** genannte Buchung noch offen ist. Eine
     * bereits exportierte im Auftrag lässt den ganzen Lauf scheitern, statt sie
     * stillschweigend zu überspringen: Sonst bliebe unklar, was in der Datei
     * steht, die der Aufrufer bereits geschrieben hat.
     */
    async recordRun(record: ExportRunRecord) {
      const entryIds = record.groups.flatMap((group) => group.entries.map((entry) => entry.timeEntryId));

      if (entryIds.length === 0) {
        return err(
          taktError('export_nothing_to_do', 'Es gibt keine offenen Buchungen für einen Export.'),
        );
      }

      // Alle Buchungen müssen offen sein. Geprüft wird innerhalb der
      // Transaktion, in der auch geschrieben wird — eine Prüfung davor und ein
      // Schreiben danach wären zwei Schritte.
      for (const block of chunk(entryIds)) {
        const stale = conn
          .prepare(
            `SELECT COUNT(*) AS n FROM time_entry
              WHERE id IN (${placeholders(block.length)}) AND (export_status <> 'open' OR ended_at IS NULL)`,
          )
          .get(...(block as readonly SqlValue[]));
        if (stale !== undefined && integer(stale, 'n') > 0) {
          return err(
            taktError(
              'time_entry_locked',
              'Mindestens eine Buchung dieses Laufs ist inzwischen exportiert oder noch nicht abgeschlossen. Es wurde nichts geändert.',
            ),
          );
        }
      }

      const totalQuarters = record.groups.reduce((sum, group) => sum + group.quarters, 0);

      // Der Sicherungspunkt ist hier kein Zierrat, obwohl die Klammer des
      // Aufrufers schon offen ist (T-047). Die Schleife schreibt bis zu vier
      // Anweisungen je Buchung. Stolpert die dritte über eine SQLite-Störung —
      // eine Fremdschlüsselbedingung, ein Trigger —, dann übersetzt `attempt`
      // sie in einen **Wert**, `recordRun` gibt `err(...)` zurück, und der
      // Anwendungsfall nimmt seine Datei zurück. Die äußere Transaktion sieht
      // von alldem nichts und schreibt fest, was bis dahin geschrieben wurde:
      // ein halber Exportlauf mit halb markierten Buchungen, ohne Datei.
      // Genau der Zustand, den A-8.8 ausschließt.
      const outcome = attemptAtomically(conn, 'takt_record_run', () => {
        const runId = ids.next() as ExportRunId;

        conn
          .prepare(
            `INSERT INTO export_run
               (id, template_id, template_snapshot, file_path, file_sha256, byte_size,
                entry_count, total_quarters, rounding_mode, windows_user, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            runId,
            record.templateId,
            JSON.stringify(record.templateSnapshot),
            record.filePath,
            record.fileSha256,
            record.bytes,
            entryIds.length,
            totalQuarters,
            record.roundingMode,
            // Der Windows-Benutzername kommt aus der zweiten `stdin`-Zeile
            // (E-042) und wandert unverändert bis hierher. Er ist eine
            // Abrechnungsgröße und keine Eingabe (E-010, B-8.1).
            record.windowsUser,
            record.now,
          );

        const insertGroup = conn.prepare(
          `INSERT INTO export_run_group (id, export_run_id, todo_id, day, seconds, quarters)
           VALUES (?, ?, ?, ?, ?, ?)`,
        );
        const insertEntry = conn.prepare(
          `INSERT INTO export_run_entry (export_run_group_id, time_entry_id, duration_seconds)
           VALUES (?, ?, ?)`,
        );
        const markExported = conn.prepare(
          `UPDATE time_entry SET export_status = 'exported', export_count = export_count + 1, updated_at = ?
            WHERE id = ? AND export_status = 'open'`,
        );
        const insertAudit = conn.prepare(
          `INSERT INTO export_audit
             (id, time_entry_id, event, previous_status, new_status, export_run_id, export_run_group_id, actor, reason, occurred_at)
           VALUES (?, ?, 'exported', 'open', 'exported', ?, ?, ?, '', ?)`,
        );

        for (const group of record.groups) {
          const groupId = ids.next() as ExportRunGroupId;
          insertGroup.run(groupId, runId, group.todoId, group.day, group.seconds, group.quarters);

          for (const entry of group.entries) {
            insertEntry.run(groupId, entry.timeEntryId, entry.durationSeconds);

            const changed = markExported.run(record.now, entry.timeEntryId).changes;
            if (changed !== 1) {
              // Kann nur eintreten, wenn zwischen Prüfung und Schreiben etwas
              // dazwischenkam. Ein Wurf rollt die Transaktion zurück — die
              // Datei entfernt der Anwendungsfall.
              throw new Error('Eine Buchung ließ sich nicht als exportiert markieren.');
            }

            // Ohne Protokollzeile kein Statuswechsel. Beides oder keines
            // (R-10) — und „beides" heißt: in derselben Schleife, nicht in
            // einer zweiten, die jemand später auslassen könnte.
            insertAudit.run(
              ids.next(),
              entry.timeEntryId,
              runId,
              groupId,
              record.windowsUser,
              record.now,
            );
          }
        }

        const row = conn
          .prepare(
            `SELECT id, template_id, template_snapshot, file_path, file_sha256, byte_size,
                    entry_count, total_quarters, rounding_mode, windows_user, created_at
               FROM export_run WHERE id = ?`,
          )
          .get(runId);
        if (row === undefined) throw new Error('Der geschriebene Exportlauf ist nicht auffindbar.');
        return toExportRun(row);
      });

      return outcome.ok ? ok(outcome.value) : err(outcome.error);
    },

    async loadRun(id: ExportRunId): Promise<ExportRun | null> {
      const row = conn
        .prepare(
          `SELECT id, template_id, template_snapshot, file_path, file_sha256, byte_size,
                  entry_count, total_quarters, rounding_mode, windows_user, created_at
             FROM export_run WHERE id = ?`,
        )
        .get(id);
      return row === undefined ? null : toExportRun(row);
    },

    async listRuns(pagination?: Pagination): Promise<Page<ExportRun>> {
      const total = integer(conn.prepare('SELECT COUNT(*) AS n FROM export_run').get() ?? { n: 0 }, 'n');
      const limit = pageSize(pagination?.limit);
      const cursor = decodeCursor(pagination?.cursor);

      const rows = conn
        .prepare(
          `SELECT id, template_id, template_snapshot, file_path, file_sha256, byte_size,
                  entry_count, total_quarters, rounding_mode, windows_user, created_at
             FROM export_run
            ${cursor === null ? '' : 'WHERE (created_at < ? OR (created_at = ? AND id < ?))'}
            ORDER BY created_at DESC, id DESC LIMIT ?`,
        )
        .all(...(cursor === null ? [] : [cursor.sort, cursor.sort, cursor.id]), limit + 1);

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const last = page[page.length - 1];

      return {
        items: page.map(toExportRun),
        nextCursor:
          hasMore && last !== undefined
            ? encodeCursor({ sort: text(last, 'created_at'), id: text(last, 'id') })
            : null,
        total,
      };
    },

    /**
     * E-012 — Zurücksetzen, je Buchung.
     *
     * Statuswechsel und Protokollzeile stehen in derselben Klammer. Es gibt
     * keinen Weg, das eine ohne das andere zu tun — und das ist der Kern von
     * R-10: Nach dem Zurücksetzen geht dieselbe Arbeitszeit erneut in eine
     * Abrechnung, und das muss auffindbar bleiben.
     *
     * `export_count` bleibt stehen. Der Zustand „offen bei `export_count > 0`"
     * ist genau das, was die Oberfläche dauerhaft als „schon einmal
     * exportiert" kennzeichnet. Ein dritter Status entsteht dabei nicht
     * (E-032).
     */
    async resetStatus(request: ExportStatusResetRequest) {
      const entry = loadEntry(request.timeEntryId);
      if (entry === null) {
        return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
      }
      if (entry.exportStatus === 'open') {
        return err(
          taktError(
            'export_status_unchanged',
            'Diese Buchung ist bereits offen; es gibt nichts zurückzusetzen.',
          ),
        );
      }

      const outcome = atomically(conn, 'takt_reset_status', () => {
        const changed = conn
          .prepare(
            `UPDATE time_entry SET export_status = 'open', updated_at = ?
              WHERE id = ? AND export_status = 'exported'`,
          )
          .run(request.now, request.timeEntryId);

        // Kein Statuswechsel, keine Protokollzeile. Ohne diesen Wurf entstünde
        // ein Protokolleintrag über etwas, das nicht stattgefunden hat — und
        // der Sicherungspunkt hätte nichts, woran er merkt, dass er zurück muss
        // (R-10).
        if (changed.changes !== 1) {
          return taktError(
            'export_status_unchanged',
            'Diese Buchung ist bereits offen; es gibt nichts zurückzusetzen.',
          );
        }

        conn
          .prepare(
            `INSERT INTO export_audit
               (id, time_entry_id, event, previous_status, new_status, export_run_id, export_run_group_id, actor, reason, occurred_at)
             VALUES (?, ?, 'reset', 'exported', 'open', NULL, NULL, ?, ?, ?)`,
          )
          .run(ids.next(), request.timeEntryId, request.actor, request.reason, request.now);

        return null;
      });
      if (!outcome.ok) return err(outcome.error as never);

      const updated = loadEntry(request.timeEntryId);
      if (updated === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
      return ok(updated);
    },

    /**
     * E-047 — „nicht abrechnen".
     *
     * Derselbe Bau wie `resetStatus`, in die andere Richtung und mit einem
     * anderen Ereignis. Bewusst **nicht** über `recordRun` mit einem erfundenen
     * Exportlauf: Es gibt keine Datei, kein Vorlagenabbild und keine
     * Tagessumme, und ein Lauf ohne all das wäre eine Behauptung im Protokoll.
     *
     * `export_count` bleibt unberührt. Er zählt Exportläufe, und einer hat
     * nicht stattgefunden — die Auskunft „schon einmal exportiert" (R-10) darf
     * eine Ausbuchung nicht mitzählen.
     *
     * Die WHERE-Bedingung nennt `export_status = 'open'` ein zweites Mal,
     * obwohl darüber schon geprüft wurde. Das ist kein Versehen: Zwischen Lesen
     * und Schreiben liegt kein `await` und damit keine fremde Anfrage, aber die
     * Bedingung hält die Zusage auch dann, wenn diese Reihenfolge später einmal
     * aufgebrochen wird.
     */
    async markNotBilled(request: NotBilledRequest) {
      const entry = loadEntry(request.timeEntryId);
      if (entry === null) {
        return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
      }
      if (entry.exportStatus === 'exported') {
        return err(
          taktError(
            'export_status_unchanged',
            'Diese Buchung ist bereits ausgebucht oder exportiert; sie geht in keinen Export mehr ein.',
          ),
        );
      }

      const outcome = atomically(conn, 'takt_not_billed', () => {
        // **Erst das Protokoll, dann der Status.** Diese Reihenfolge ist keine
        // Vorliebe: `trg_time_entry_exported_needs_provenance` (Migration 0006)
        // lässt den Wechsel auf `exported` ohne mitzählenden Exportlauf nur zu,
        // wenn die jüngste Protokollzeile der Buchung bereits `not_billed` ist.
        // Wer die beiden Anweisungen tauscht, bekommt `export_status_not_settable`
        // aus der Datenbank — laut, nicht still. Genau dafür steht der Trigger:
        // „beides oder keines" (R-10) hängt damit nicht mehr an dieser Methode.
        conn
          .prepare(
            `INSERT INTO export_audit
               (id, time_entry_id, event, previous_status, new_status, export_run_id, export_run_group_id, actor, reason, occurred_at)
             VALUES (?, ?, 'not_billed', 'open', 'exported', NULL, NULL, ?, ?, ?)`,
          )
          .run(ids.next(), request.timeEntryId, request.actor, request.reason, request.now);

        const changed = conn
          .prepare(
            `UPDATE time_entry SET export_status = 'exported', updated_at = ?
              WHERE id = ? AND export_status = 'open'`,
          )
          .run(request.now, request.timeEntryId);

        // Siehe `resetStatus`: eine Protokollzeile ohne Statuswechsel ist die
        // schlimmere Hälfte von „beides oder keines".
        if (changed.changes !== 1) {
          return taktError(
            'export_status_unchanged',
            'Diese Buchung ist bereits ausgebucht oder exportiert; sie geht in keinen Export mehr ein.',
          );
        }

        return null;
      });
      if (!outcome.ok) return err(outcome.error as never);

      const updated = loadEntry(request.timeEntryId);
      if (updated === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));
      return ok(updated);
    },

    async audit(
      filter?: TimeEntryId | ExportAuditFilter,
      pagination?: Pagination,
    ): Promise<Page<ExportAuditEntry>> {
      // Die nackte Kennung ist die ältere Aufrufform (siehe Port).
      const criteria: ExportAuditFilter =
        filter === undefined ? {} : typeof filter === 'string' ? { timeEntryId: filter } : filter;

      // Der Filter wird aus **Spaltennamen** gebaut, nie aus einem Wert. Die
      // Werte gehen als Parameter, damit hier keine Zeichenkette entsteht, in
      // der Eingabe und SQL sich mischen (B-4.3).
      const conditions: string[] = [];
      const params: SqlValue[] = [];
      if (criteria.timeEntryId !== undefined) {
        conditions.push('time_entry_id = ?');
        params.push(criteria.timeEntryId);
      }
      if (criteria.exportRunId !== undefined) {
        conditions.push('export_run_id = ?');
        params.push(criteria.exportRunId);
      }
      const where = conditions.length === 0 ? '' : `WHERE ${conditions.join(' AND ')}`;

      const total = integer(
        conn.prepare(`SELECT COUNT(*) AS n FROM export_audit ${where}`).get(...params) ?? { n: 0 },
        'n',
      );

      const limit = pageSize(pagination?.limit);
      const cursor = decodeCursor(pagination?.cursor);
      const keyed =
        cursor === null
          ? { sql: '', params: [] as SqlValue[] }
          : {
              sql: `${where === '' ? 'WHERE' : 'AND'} (occurred_at < ? OR (occurred_at = ? AND id < ?))`,
              params: [cursor.sort, cursor.sort, cursor.id] as SqlValue[],
            };

      const rows = conn
        .prepare(
          `SELECT id, time_entry_id, event, previous_status, new_status, export_run_id,
                  export_run_group_id, actor, reason, occurred_at
             FROM export_audit ${where} ${keyed.sql}
            ORDER BY occurred_at DESC, id DESC LIMIT ?`,
        )
        .all(...params, ...keyed.params, limit + 1);

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const last = page[page.length - 1];

      return {
        items: page.map(toExportAuditEntry),
        nextCursor:
          hasMore && last !== undefined
            ? encodeCursor({ sort: text(last, 'occurred_at'), id: text(last, 'id') })
            : null,
        total,
      };
    },
  };
}

/** Tagnamen eines einzelnen Todos. Für Anzeigezwecke außerhalb des Exports. */
export function tagIdsOf(conn: SqlConnection, todoId: string): readonly TagId[] {
  return conn
    .prepare('SELECT tag_id FROM todo_tag WHERE todo_id = ? ORDER BY tag_id')
    .all(todoId)
    .map((row) => text(row, 'tag_id') as TagId);
}
