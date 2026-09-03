/**
 * Takt — Todos und der interne Vermerk (A-2.*, A-5.*, A-7.1, A-7.2, A-10.9).
 *
 * ---------------------------------------------------------------------------
 * Die Notiz-Trennung auf der Leseseite
 * ---------------------------------------------------------------------------
 *
 * In dieser Datei gibt es **keine** Abfrage, die `todo` und `todo_note`
 * verbindet — außer in `createTodoNotePort`, und dort ausschließlich auf
 * `todo_note` allein. `SELECT *` kommt nirgends vor: Jede Spalte ist
 * ausgeschrieben, damit eine später ergänzte Spalte nicht von selbst in einen
 * Datensatz gerät, den ein Exportpfad in der Hand hält (A-7.2, R-06).
 *
 * ---------------------------------------------------------------------------
 * Welche `tagIds` `create` liest — die Antwort auf offene Frage 4 aus T-019
 * ---------------------------------------------------------------------------
 *
 * `create(input, tagIds)` führt die Liste zweimal, und das ist kein Versehen:
 *
 *  - `input.tagIds` sind die **ausdrücklich gewählten** Tags. So steht es im
 *    Vertrag von `TodoCreate` in todo.ts: „Die Standard-Tags aus A-9 kommen im
 *    Anwendungsfall dazu."
 *  - Das zweite Argument ist die **wirksame** Liste, also die gewählten
 *    zuzüglich der Standard-Tags aus `applyDefaultTags`.
 *
 * Geschrieben wird das zweite Argument. `input.tagIds` wird von diesem Adapter
 * **nicht** gelesen. Damit greift A-9.5 unabhängig davon, ob der Aufrufer die
 * Ergänzung vorgenommen hat oder nicht — und ein Aufrufer, der beide gleich
 * übergibt (so macht es das Add-in), bekommt dasselbe Ergebnis.
 */

import type {
  Page,
  Pagination,
  TodoNotePort,
  TodoPort,
} from '../ports.ts';
import type {
  PoolCompletionFilter,
  PoolExportFilter,
  Result,
  StatusId,
  TagId,
  TaktError,
  Timestamp,
  Todo,
  TodoCreate,
  TodoFilter,
  TodoId,
  TodoNote,
  TodoUpdate,
} from '@takt/domain';
import { err, ok, taktError } from '@takt/domain';

import { chunk, integer, placeholders, text, type SqlConnection, type SqlRow, type SqlValue } from './database.ts';
import { attemptAtomically } from './atomic.ts';
import { attempt } from './errors.ts';
import { toTodo, toTodoNote } from './mappers.ts';
import { decodeCursor, encodeCursor, pageSize } from './paging.ts';
import type { IdSource } from './ids.ts';

/** Alle Spalten von `todo`, ausgeschrieben. `todo_note.body` ist keine davon. */
const TODO_COLUMNS =
  't.id, t.title, t.call_number, t.status_id, t.completed_at, t.created_at, t.updated_at';

interface Condition {
  readonly sql: string;
  readonly params: readonly SqlValue[];
}

/**
 * Übersetzt einen Filter in WHERE-Bedingungen.
 *
 * Jeder Wert geht als Parameter. Zusammengesetzt wird ausschließlich aus
 * Fragezeichen und festen Textstücken; kein Wert aus einer Anfrage berührt je
 * den SQL-Text.
 */
function buildConditions(
  filter: TodoFilter,
  resolvedPools: readonly ResolvedPool[],
): readonly Condition[] {
  const conditions: Condition[] = [];

  if (filter.search !== undefined && filter.search.trim() !== '') {
    // `LIKE` mit umschließenden Prozentzeichen. Die Sonderzeichen `%` und `_`
    // werden maskiert, sonst wäre eine Suche nach „50%" eine Suche nach allem.
    const needle = `%${escapeLike(filter.search.trim())}%`;
    conditions.push({
      sql: "(t.title LIKE ? ESCAPE '\\' OR (t.call_number IS NOT NULL AND t.call_number LIKE ? ESCAPE '\\'))",
      params: [needle, needle],
    });
  }

  if (filter.callNumber !== undefined) {
    conditions.push({ sql: 't.call_number = ?', params: [filter.callNumber] });
  }

  if (filter.statusIds !== undefined && filter.statusIds.length > 0) {
    conditions.push({
      sql: `t.status_id IN (${placeholders(filter.statusIds.length)})`,
      params: [...filter.statusIds],
    });
  }

  if (filter.tagIds !== undefined && filter.tagIds.length > 0) {
    // Alle genannten Tags müssen am Todo hängen. `HAVING COUNT` statt mehrerer
    // EXISTS: eine Unterabfrage, ein Indexdurchlauf auf ix_todo_tag_reverse.
    conditions.push({
      sql: `(SELECT COUNT(DISTINCT tt.tag_id) FROM todo_tag tt
              WHERE tt.todo_id = t.id AND tt.tag_id IN (${placeholders(filter.tagIds.length)})) = ?`,
      params: [...filter.tagIds, filter.tagIds.length],
    });
  }

  if (resolvedPools.length > 0) {
    // Mehrere Pools wirken als Vereinigung: Ein Todo, das in einem der
    // gewählten Pools liegt, gehört in das Ergebnis. Die Alternative — der
    // Schnitt — ließe die Auswahl zweier Pools regelmäßig leer ausgehen und
    // wäre für niemanden erklärbar.
    //
    // **Innerhalb** eines Pools ist es umgekehrt: Die Achsen einer Regel sind
    // mit UND verbunden (T-076). Das ist dieselbe Verknüpfung, die
    // `matchesPool` in der Domäne trifft — diese Übersetzung ist die zweite
    // Fassung derselben Regel, und ihre Übereinstimmung wird gemessen
    // (`proof:openapi`, Abschnitt 11), nicht angenommen.
    const parts: string[] = [];
    const params: SqlValue[] = [];
    for (const pool of resolvedPools) {
      const axes: string[] = [];

      if (pool.tagIds.length > 0) {
        // Erforderliche Tags. `HAVING`-freie Zählung über eine Unterabfrage:
        // ein Indexdurchlauf auf `ix_todo_tag_reverse`, kein GROUP BY.
        const needed = pool.matchMode === 'all' ? pool.tagIds.length : 1;
        axes.push(
          `(SELECT COUNT(DISTINCT tt.tag_id) FROM todo_tag tt
             WHERE tt.todo_id = t.id AND tt.tag_id IN (${placeholders(pool.tagIds.length)})) >= ?`,
        );
        params.push(...pool.tagIds, needed);
      }

      const excluded = pool.excludedTagIds;
      if (excluded.length > 0) {
        // Ausgeschlossene Tags: **keines** davon. `NOT EXISTS` und nicht
        // `COUNT(...) = 0` — die Abfrage bricht beim ersten Treffer ab, und
        // „keines" ist genau das, was `NOT EXISTS` heißt.
        axes.push(
          `NOT EXISTS (SELECT 1 FROM todo_tag tt
                        WHERE tt.todo_id = t.id AND tt.tag_id IN (${placeholders(excluded.length)}))`,
        );
        params.push(...excluded);
      }

      const statusIds = pool.statusIds;
      if (statusIds.length > 0) {
        // Der Status steht **an der Zeile** und nicht in einer
        // Verknüpfungstabelle: kein JOIN, kein EXISTS, ein Vergleich auf
        // `todo.status_id`. Genau darin unterscheidet sich diese Achse von den
        // beiden darüber, und genau deshalb ist sie ein eigenes Feld.
        axes.push(`t.status_id IN (${placeholders(statusIds.length)})`);
        params.push(...statusIds);
      }

      if (pool.completion === 'open') axes.push('t.completed_at IS NULL');
      if (pool.completion === 'done') axes.push('t.completed_at IS NOT NULL');

      if (pool.exportState === 'open') {
        // Dieselbe Bedingung wie `TodoFilter.onlyWithOpenEntries`, einschließlich
        // `ended_at IS NOT NULL`: Ein laufender Timer ist noch nichts, was man
        // abrechnen könnte. Trifft `ix_time_entry_queue`.
        axes.push(
          `EXISTS (SELECT 1 FROM time_entry te
                    WHERE te.todo_id = t.id AND te.export_status = 'open' AND te.ended_at IS NOT NULL)`,
        );
      }
      if (pool.exportState === 'exported') {
        axes.push(
          `EXISTS (SELECT 1 FROM time_entry te
                    WHERE te.todo_id = t.id AND te.export_status = 'exported')`,
        );
      }

      if (axes.length === 0) {
        // Eine Regel, deren Achsen alle neutral stehen, trifft nichts — dieselbe
        // Entscheidung wie `matchesPool` in tag.ts, und aus demselben Grund.
        // `0 = 1` hält die Vereinigung formal richtig, ohne zu treffen.
        parts.push('0 = 1');
        continue;
      }
      parts.push(`(${axes.join(' AND ')})`);
    }
    conditions.push({ sql: `(${parts.join(' OR ')})`, params });
  }

  if (filter.onlyOpen === true) {
    conditions.push({ sql: 't.completed_at IS NULL', params: [] });
  }

  if (filter.onlyWithOpenEntries === true) {
    conditions.push({
      sql: `EXISTS (SELECT 1 FROM time_entry te
                     WHERE te.todo_id = t.id AND te.export_status = 'open' AND te.ended_at IS NOT NULL)`,
      params: [],
    });
  }

  return conditions;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/**
 * Eine Regel, so weit aufgelöst, wie die Abfrage sie braucht (T-076).
 *
 * Die beiden Taglisten kommen aufgelöst herein — dafür braucht es den
 * Ordnerbaum, und das ist Sache von `resolvePoolRule`. Die übrigen drei Achsen
 * stehen unaufgelöst da: Sie sind Werte an der Regel und nichts, was man
 * auflösen könnte.
 *
 * **Jedes Feld ist Pflicht**, auch das leere. Der Auflöser hat sie alle in der
 * Hand (`poolAxes` liefert für eine Regel, die es nicht gibt, lauter
 * Neutralwerte); sie freiwillig zu machen hieße, an jeder Lesestelle ein
 * `?? []` zu schreiben — eine Verzweigung je Achse, die nichts entscheidet und
 * eine Vorgabe an einen zweiten Ort trüge. Der Neutralwert ist die leere Liste
 * beziehungsweise `any`, und er steht an genau einer Stelle: bei dem, der
 * auflöst.
 */
export interface ResolvedPool {
  readonly tagIds: readonly TagId[];
  readonly matchMode: 'any' | 'all';
  readonly excludedTagIds: readonly TagId[];
  readonly statusIds: readonly StatusId[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
}

/** Auflösung der Pool-Regeln. Wird von außen gereicht, damit `TodoPort` `PoolPort` nicht kennt. */
export type PoolResolver = (poolIds: readonly string[]) => readonly ResolvedPool[];

export function createTodoPort(
  conn: SqlConnection,
  ids: IdSource,
  resolvePools: PoolResolver,
): TodoPort {
  /** Tags aller genannten Todos in **einer** Abfrage. Kein N+1. */
  const loadTags = (todoIds: readonly string[]): Map<string, TagId[]> => {
    const map = new Map<string, TagId[]>();
    for (const id of todoIds) map.set(id, []);
    for (const block of chunk(todoIds)) {
      const rows = conn
        .prepare(
          `SELECT tt.todo_id, tt.tag_id
             FROM todo_tag tt
            WHERE tt.todo_id IN (${placeholders(block.length)})
            ORDER BY tt.todo_id, tt.created_at, tt.tag_id`,
        )
        .all(...block);
      for (const row of rows) {
        map.get(text(row, 'todo_id'))?.push(text(row, 'tag_id') as TagId);
      }
    }
    return map;
  };

  const hydrate = (rows: readonly SqlRow[]): readonly Todo[] => {
    const todoIds = rows.map((row) => text(row, 'id'));
    const tags = loadTags(todoIds);
    return rows.map((row) => toTodo(row, tags.get(text(row, 'id')) ?? []));
  };

  const loadOne = (id: TodoId): Todo | null => {
    const row = conn.prepare(`SELECT ${TODO_COLUMNS} FROM todo t WHERE t.id = ?`).get(id);
    if (row === undefined) return null;
    return hydrate([row])[0] ?? null;
  };

  const writeTags = (todoId: TodoId, tagIds: readonly TagId[], now: Timestamp): void => {
    conn.prepare('DELETE FROM todo_tag WHERE todo_id = ?').run(todoId);
    const insert = conn.prepare(
      'INSERT INTO todo_tag (todo_id, tag_id, created_at) VALUES (?, ?, ?)',
    );
    // Reihenfolge bleibt erhalten: `created_at` ist für alle gleich, deshalb
    // sortiert `loadTags` zusätzlich nach `tag_id`. Die fachliche Reihenfolge
    // der Tags ergibt sich aus `applyDefaultTags` und wird beim Anzeigen
    // hergestellt, nicht aus der Einfügereihenfolge.
    const unique = [...new Set(tagIds)];
    for (const tagId of unique) insert.run(todoId, tagId, now);
  };

  return {
    async load(id) {
      return loadOne(id);
    },

    async loadMany(idList) {
      if (idList.length === 0) return [];
      const rows: SqlRow[] = [];
      for (const block of chunk(idList)) {
        rows.push(
          ...conn
            .prepare(`SELECT ${TODO_COLUMNS} FROM todo t WHERE t.id IN (${placeholders(block.length)})`)
            .all(...block),
        );
      }
      return hydrate(rows);
    },

    async search(filter: TodoFilter, pagination?: Pagination): Promise<Page<Todo>> {
      const pools = filter.poolIds === undefined ? [] : resolvePools([...filter.poolIds]);
      const conditions = buildConditions(filter, pools);
      const where = conditions.length === 0 ? '' : `WHERE ${conditions.map((c) => c.sql).join(' AND ')}`;
      const params = conditions.flatMap((c) => [...c.params]);

      const total = integer(
        conn.prepare(`SELECT COUNT(*) AS n FROM todo t ${where}`).get(...params) ?? { n: 0 },
        'n',
      );

      const limit = pageSize(pagination?.limit);
      const cursor = decodeCursor(pagination?.cursor);

      /**
       * Sortiert nach zuletzt geändert, absteigend, mit der Kennung als
       * eindeutigem zweiten Schlüssel.
       *
       * Es gibt keine zweite Ordnung daneben. Bis Migration 0010 trug
       * `board_rank` die Reihenfolge innerhalb einer Kanban-Spalte; mit E-054
       * ist das Ziehen entfallen, und das Board ist eine Frage über Regeln
       * geworden. Diese Abfrage ist damit die einzige Ordnung über Todos —
       * eine zweite, abweichende wäre eine zweite Wahrheit über dieselbe Liste.
       */
      const keyed =
        cursor === null
          ? { sql: '', params: [] as SqlValue[] }
          : {
              sql: `${where === '' ? 'WHERE' : 'AND'} (t.updated_at < ? OR (t.updated_at = ? AND t.id < ?))`,
              params: [cursor.sort, cursor.sort, cursor.id] as SqlValue[],
            };

      const rows = conn
        .prepare(
          `SELECT ${TODO_COLUMNS} FROM todo t ${where} ${keyed.sql}
            ORDER BY t.updated_at DESC, t.id DESC LIMIT ?`,
        )
        .all(...params, ...keyed.params, limit + 1);

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const last = page[page.length - 1];

      return {
        items: hydrate(page),
        nextCursor:
          hasMore && last !== undefined
            ? encodeCursor({ sort: text(last, 'updated_at'), id: text(last, 'id') })
            : null,
        total,
      };
    },

    /**
     * A-10.9 — Duplikatsuche über die Call-Nummer.
     *
     * Trifft `ix_todo_call_number`, den Teilindex auf `call_number IS NOT
     * NULL`. Ob der übergebene Wert überhaupt als Suchbegriff taugt, entscheidet
     * `checkCallNumber` in der Domäne (E-045) — **vor** diesem Aufruf. Hier
     * wird nicht noch einmal geurteilt: Eine zweite, abweichende Fassung der
     * Regel wäre genau das, was E-045 beseitigt hat.
     */
    async findByCallNumber(callNumber) {
      const rows = conn
        .prepare(
          `SELECT ${TODO_COLUMNS} FROM todo t WHERE t.call_number = ? ORDER BY t.created_at DESC, t.id DESC`,
        )
        .all(callNumber);
      return hydrate(rows);
    },

    async create(input: TodoCreate, tagIds: readonly TagId[]): Promise<Todo> {
      const id = ids.next() as TodoId;
      const statusId = input.statusId ?? defaultStatusId(conn);

      conn
        .prepare(
          `INSERT INTO todo (id, title, call_number, status_id, completed_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, ?, ?)`,
        )
        .run(id, input.title, input.callNumber, statusId, input.now, input.now);

      writeTags(id, tagIds, input.now);

      /**
       * Der interne Vermerk wird **mitgeschrieben**, in derselben Transaktion.
       *
       * `TodoCreate.note` ist laut Vertrag der Vermerk aus A-7.1. Ließe der
       * Adapter ihn fallen, verschwände stillschweigend ein Text, den der
       * Benutzer eingegeben hat — im Add-in ist das die Übernahme aus der
       * E-Mail (B-12.3), und dort fiele es erst auf, wenn jemand ihn sucht.
       * Genau diesen Verlust hat `proof-addin-wiring.mjs` gefunden.
       *
       * Das schwächt die Notiz-Trennung nicht: Sie ist eine Grenze auf der
       * **Leseseite** (A-7.2, R-06). Es gibt weiterhin genau einen Weg, den
       * Vermerk zu lesen — `TodoNotePort.load` —, und keine Abfrage in diesem
       * Adapter verbindet `todo` mit `todo_note`.
       *
       * Leerer Text legt keine Zeile an. Ein Vermerk, den es nicht gibt, ist
       * etwas anderes als ein leerer, und `todo_note` soll nicht für jedes Todo
       * eine Zeile führen, nur weil das Formular ein Feld hat.
       */
      if (input.note.trim() !== '') {
        conn
          .prepare('INSERT INTO todo_note (todo_id, body, updated_at) VALUES (?, ?, ?)')
          .run(id, input.note, input.now);
      }

      const created = loadOne(id);
      if (created === null) throw new Error('Das angelegte Todo ist nicht auffindbar.');
      return created;
    },

    async update(id, input: TodoUpdate): Promise<Result<Todo, TaktError>> {
      const existing = loadOne(id);
      if (existing === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));

      // Sicherungspunkt (T-047): Erst wandert das Todo, dann werden die Tags
      // ersetzt. Verweist ein Tag auf eine Kennung, die es nicht mehr gibt,
      // scheitert `writeTags` an der Fremdschlüsselbedingung — als **Wert**,
      // nicht als Wurf. Zurück bliebe ein Todo, das die Spalte gewechselt hat
      // und **alle** Tags verloren hat, während die Antwort von einem
      // Validierungsfehler spricht. Mit den Tags ginge die
      // Pool-Zugehörigkeit (A-3.4), die aus ihnen abgeleitet wird.
      const outcome = attemptAtomically(conn, 'takt_todo_update', () => {
        const sets: string[] = [];
        const params: SqlValue[] = [];

        if (input.title !== undefined) {
          sets.push('title = ?');
          params.push(input.title);
        }
        if (input.callNumber !== undefined) {
          sets.push('call_number = ?');
          params.push(input.callNumber);
        }
        if (input.statusId !== undefined) {
          sets.push('status_id = ?');
          params.push(input.statusId);
        }
        // Auch wenn nur Tags geändert werden, wandert `updated_at` mit: Die
        // Liste sortiert danach, und eine Änderung, die nicht nach oben
        // rückt, sieht aus wie keine Änderung.
        sets.push('updated_at = ?');
        params.push(input.now);
        params.push(id);

        conn.prepare(`UPDATE todo SET ${sets.join(', ')} WHERE id = ?`).run(...params);

        if (input.tagIds !== undefined) {
          writeTags(id, input.tagIds, input.now);
        }
      });

      if (!outcome.ok) return err(outcome.error);

      const updated = loadOne(id);
      if (updated === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
      return ok(updated);
    },

    /**
     * Löschen. Eine exportierte Buchung an diesem Todo verhindert es.
     *
     * `time_entry.todo_id` steht auf `ON DELETE RESTRICT`: Solange eine Buchung
     * hängt, weist die Datenbank ab. Das ist die Absicht — mit dem Todo
     * verschwände die Zuordnung der Zeit zu ihrem Vorgang, und bei einer
     * bereits abgerechneten Zeit wäre das der Verlust des Belegs.
     */
    async remove(id) {
      const existing = conn.prepare('SELECT 1 AS one FROM todo WHERE id = ?').get(id);
      if (existing === undefined) {
        return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
      }

      const blocking = conn
        .prepare('SELECT COUNT(*) AS n FROM time_entry WHERE todo_id = ?')
        .get(id);
      if (blocking !== undefined && integer(blocking, 'n') > 0) {
        return err(
          taktError(
            'time_entry_locked',
            'Zu diesem Todo gibt es Zeitbuchungen. Es kann nicht gelöscht werden, solange sie bestehen.',
          ),
        );
      }

      const outcome = attempt(() => conn.prepare('DELETE FROM todo WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as TaktError<'time_entry_locked' | 'not_found'>);
      return ok(undefined);
    },

    /** A-2.4 — Erledigt setzen. Die Kanban-Spalte bleibt, wo sie ist (E-023). */
    async markDone(id, now) {
      const outcome = attempt(() =>
        conn
          .prepare('UPDATE todo SET completed_at = ?, updated_at = ? WHERE id = ? AND completed_at IS NULL')
          .run(now, now, id),
      );
      if (!outcome.ok) return err(outcome.error);
      const todo = loadOne(id);
      if (todo === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
      return ok(todo);
    },

    /**
     * A-2.5 — Erledigt aufheben.
     *
     * Nur `completed_at` fällt. `status_id` bleibt unangetastet: Das Erledigen
     * hat die Karte nie verschoben, also gibt es nichts wiederherzustellen
     * (E-023). Die Pool-Zugehörigkeit ist aus den Tags abgeleitet und nirgends
     * gespeichert (A-3.4) — sie kommt ohne einen einzigen Schreibvorgang
     * zurück, sobald `isVisibleInPool` wieder `true` liefert.
     */
    async clearDone(id, now) {
      const outcome = attempt(() =>
        conn
          .prepare('UPDATE todo SET completed_at = NULL, updated_at = ? WHERE id = ?')
          .run(now, id),
      );
      if (!outcome.ok) return err(outcome.error);
      const todo = loadOne(id);
      if (todo === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
      return ok(todo);
    },

    /** Erfasste Zeit je Todo. Berechnet, nie gespeichert — sie kann nicht abweichen. */
    async sumSeconds(idList) {
      const result = new Map<TodoId, number>();
      for (const id of idList) result.set(id, 0);
      for (const block of chunk(idList)) {
        const rows = conn
          .prepare(
            `SELECT todo_id, COALESCE(SUM(duration_seconds), 0) AS seconds
               FROM time_entry
              WHERE todo_id IN (${placeholders(block.length)}) AND ended_at IS NOT NULL
              GROUP BY todo_id`,
          )
          .all(...block);
        for (const row of rows) {
          result.set(text(row, 'todo_id') as TodoId, integer(row, 'seconds'));
        }
      }
      return result;
    },
  };
}

/** Die Standardspalte für ein neu angelegtes Todo (A-5.4). */
function defaultStatusId(conn: SqlConnection): StatusId {
  const row = conn
    .prepare('SELECT id FROM todo_status WHERE is_default = 1 ORDER BY position LIMIT 1')
    .get();
  if (row !== undefined) return text(row, 'id') as StatusId;

  // Kein Standard gesetzt: die vorderste Spalte. Ein Wurf wäre hier falsch —
  // das Anlegen eines Todos darf nicht daran scheitern, dass jemand die
  // Markierung entfernt hat.
  const first = conn.prepare('SELECT id FROM todo_status ORDER BY position LIMIT 1').get();
  if (first === undefined) {
    throw new Error('Es gibt keine einzige Kanban-Spalte.');
  }
  return text(first, 'id') as StatusId;
}

/**
 * Der interne Vermerk (A-7.1, A-7.2, E-016).
 *
 * Eigener Port, eigene Tabelle, eigene Abfrage. Wer den Vermerk lesen will,
 * muss diesen Port ausdrücklich benennen — und dieser Aufruf ist im Quelltext
 * auffindbar. Das ist die dritte der vier Schichten aus architektur.md 4.
 */
export function createTodoNotePort(conn: SqlConnection): TodoNotePort {
  return {
    async load(todoId): Promise<TodoNote | null> {
      const row = conn
        .prepare('SELECT todo_id, body, updated_at FROM todo_note WHERE todo_id = ?')
        .get(todoId);
      return row === undefined ? null : toTodoNote(row);
    },

    async write(todoId, body, now): Promise<TodoNote> {
      conn
        .prepare(
          `INSERT INTO todo_note (todo_id, body, updated_at) VALUES (?, ?, ?)
             ON CONFLICT (todo_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
        )
        .run(todoId, body, now);
      return { todoId, text: body, updatedAt: now };
    },
  };
}
