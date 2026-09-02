/**
 * Takt — Kanban-Spalten (A-5.3, A-5.4, E-023).
 *
 * Eine Spalte trägt **kein** Merkmal „Erledigt". Erledigt (A-2.4) und die
 * Abschlussspalte (A-5.3) sind zwei getrennte Achsen: Ein Todo kann in „Done"
 * stehen und nicht erledigt sein, und es kann erledigt sein und in
 * „In Progress" stehen. Das Kennzeichen ist `todo.completed_at` und hängt an
 * keiner Spalte.
 *
 * Die Neuordnung ist ein eigener Vorgang und kein Feld auf `update`. Grund ist
 * `ux_todo_status_position`: Der eindeutige Index bricht, sobald zwei Spalten
 * auch nur für die Dauer einer Anweisung dieselbe Position tragen. Eine
 * Neuordnung, die Spalte für Spalte schreibt, ist deshalb nicht bloß langsam,
 * sondern schlägt fehl.
 */

import type { TodoStatusPort } from '../ports.ts';
import type { StatusId, TodoStatus } from '@takt/domain';
import { err, ok, taktError } from '@takt/domain';

import { integer, text, type SqlConnection } from './database.ts';
import { attemptAtomically } from './atomic.ts';
import { attempt } from './errors.ts';
import { toTodoStatus } from './mappers.ts';
import type { IdSource } from './ids.ts';

const COLUMNS = 'id, name, position, is_default, color, created_at, updated_at';

export function createTodoStatusPort(conn: SqlConnection, ids: IdSource): TodoStatusPort {
  const loadOne = (id: StatusId): TodoStatus | null => {
    const row = conn.prepare(`SELECT ${COLUMNS} FROM todo_status WHERE id = ?`).get(id);
    return row === undefined ? null : toTodoStatus(row);
  };

  return {
    async list() {
      return conn.prepare(`SELECT ${COLUMNS} FROM todo_status ORDER BY position`).all().map(toTodoStatus);
    },

    async load(id) {
      return loadOne(id);
    },

    async defaultStatus() {
      const row =
        conn.prepare(`SELECT ${COLUMNS} FROM todo_status WHERE is_default = 1 LIMIT 1`).get() ??
        conn.prepare(`SELECT ${COLUMNS} FROM todo_status ORDER BY position LIMIT 1`).get();
      if (row === undefined) throw new Error('Es gibt keine einzige Kanban-Spalte.');
      return toTodoStatus(row);
    },

    async create(name, position, now, color = null) {
      const id = ids.next() as StatusId;
      const target =
        position > 0
          ? position
          : integer(
              conn.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM todo_status').get() ?? {
                next: 1,
              },
              'next',
            );

      // Sicherungspunkt (T-047): Das Rücken der Positionen und das Einfügen
      // gelten nur gemeinsam. Ein Name, den es schon gibt, lässt das INSERT
      // scheitern — `attempt` macht daraus einen **Wert**, die
      // Transaktionsklammer sieht keinen Wurf und schreibt fest. Zurück bliebe
      // ein Brett, auf dem jede Spalte ab der Zielposition um eins verrutscht
      // ist, während die Anwendung nichts als „Name bereits vergeben" meldet.
      const outcome = attemptAtomically(conn, 'takt_status_create', () => {
        // Platz schaffen: alle Spalten ab der Zielposition rücken eine weiter.
        // Absteigend, damit der eindeutige Index nie zwei gleiche Positionen
        // sieht — aufsteigend geschrieben kollidierte jede Zeile mit ihrem
        // eigenen Nachfolger.
        for (const row of conn
          .prepare('SELECT id, position FROM todo_status WHERE position >= ? ORDER BY position DESC')
          .all(target)) {
          conn
            .prepare('UPDATE todo_status SET position = ?, updated_at = ? WHERE id = ?')
            .run(integer(row, 'position') + 1, now, text(row, 'id'));
        }
        conn
          .prepare(
            `INSERT INTO todo_status (id, name, position, is_default, color, created_at, updated_at)
             VALUES (?, ?, ?, 0, ?, ?, ?)`,
          )
          .run(id, name, target, color, now, now);
      });
      if (!outcome.ok) return err(outcome.error as never);

      const created = loadOne(id);
      if (created === null) throw new Error('Die angelegte Spalte ist nicht auffindbar.');
      return ok(created);
    },

    async update(id, fields, now) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Diese Spalte gibt es nicht.'));

      // Sicherungspunkt (T-047): Ohne ihn ist der schlimmste Fall dieser
      // Methode ein Bestand **ohne** Standardspalte. Wer gleichzeitig
      // `isDefault` setzt und auf einen vergebenen Namen umbenennt, räumt mit
      // der ersten Anweisung alle Standardmarken ab und scheitert mit der
      // zweiten — als Wert, nicht als Wurf. `defaultStatus()` wirft danach bei
      // jedem neuen Todo.
      const outcome = attemptAtomically(conn, 'takt_status_update', () => {
        if (fields.isDefault === true) {
          // Genau eine Standardspalte (`ux_todo_status_default`). Erst alle
          // abräumen, dann setzen — in der umgekehrten Reihenfolge stünden
          // kurzzeitig zwei da, und der Index bräche.
          conn.prepare('UPDATE todo_status SET is_default = 0, updated_at = ? WHERE is_default = 1').run(now);
        }
        const sets: string[] = [];
        const params: (string | number | null)[] = [];
        if (fields.name !== undefined) {
          sets.push('name = ?');
          params.push(fields.name);
        }
        if (fields.color !== undefined) {
          sets.push('color = ?');
          params.push(fields.color);
        }
        if (fields.isDefault !== undefined) {
          sets.push('is_default = ?');
          params.push(fields.isDefault ? 1 : 0);
        }
        sets.push('updated_at = ?');
        params.push(now, id);
        conn.prepare(`UPDATE todo_status SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      });
      if (!outcome.ok) return err(outcome.error);

      const updated = loadOne(id);
      if (updated === null) return err(taktError('not_found', 'Diese Spalte gibt es nicht.'));
      return ok(updated);
    },

    /**
     * Neuordnung in **einem** Zug (A-5.4).
     *
     * Zwei Durchläufe: erst alle Positionen auf negative Werte, dann auf die
     * endgültigen. Der Umweg ist nicht Zierde — `ux_todo_status_position` ist
     * eindeutig, und jede Vertauschung zweier benachbarter Spalten kollidierte
     * ohne den Zwischenschritt mit sich selbst. Negative Positionen kommen im
     * Normalbestand nicht vor und können deshalb nichts treffen.
     */
    async reorder(order, now) {
      const known = conn.prepare('SELECT id FROM todo_status').all().map((row) => text(row, 'id'));
      const givenSet = new Set<string>(order);

      if (givenSet.size !== order.length || known.some((id) => !givenSet.has(id)) || order.length !== known.length) {
        return err(
          taktError(
            'validation_error',
            'Die Reihenfolge muss alle Spalten genau einmal nennen. Teilstücke sind nicht zulässig.',
          ),
        );
      }

      // Sicherungspunkt (T-047): Zwischen den beiden Durchläufen stehen **alle**
      // Positionen negativ. Scheitert der zweite, ist das der Bestand, der
      // festgeschrieben würde — ein Brett, dessen Spalten in umgekehrter
      // Reihenfolge stünden und dessen Neuordnung nie wieder gelänge.
      const outcome = attemptAtomically(conn, 'takt_status_reorder', () => {
        const shift = conn.prepare('UPDATE todo_status SET position = ? WHERE id = ?');
        order.forEach((id, index) => shift.run(-(index + 1), id));
        const settle = conn.prepare('UPDATE todo_status SET position = ?, updated_at = ? WHERE id = ?');
        order.forEach((id, index) => settle.run(index + 1, now, id));
      });
      if (!outcome.ok) return err(outcome.error);

      return ok(
        conn.prepare(`SELECT ${COLUMNS} FROM todo_status ORDER BY position`).all().map(toTodoStatus),
      );
    },

    /**
     * Löschen. Eine Spalte mit Todos wird nicht gelöscht, und die letzte
     * Spalte auch nicht.
     *
     * Der Fremdschlüssel `todo.status_id` steht auf `ON DELETE RESTRICT` und
     * würde ohnehin abweisen. Die Prüfung hier davor liefert den fachlichen
     * Grund statt einer Datenbankmeldung — der Unterschied ist der zwischen
     * „In dieser Spalte stehen noch Karten" und „FOREIGN KEY constraint
     * failed".
     */
    async remove(id) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Diese Spalte gibt es nicht.'));

      const count = conn.prepare('SELECT COUNT(*) AS n FROM todo_status').get();
      if (count !== undefined && integer(count, 'n') <= 1) {
        return err(
          taktError('last_status_column', 'Die letzte Spalte kann nicht gelöscht werden.'),
        );
      }

      const used = conn.prepare('SELECT COUNT(*) AS n FROM todo WHERE status_id = ?').get(id);
      if (used !== undefined && integer(used, 'n') > 0) {
        return err(
          taktError(
            'status_in_use',
            'In dieser Spalte stehen noch Todos. Verschieben Sie sie zuerst.',
          ),
        );
      }

      const outcome = attempt(() => conn.prepare('DELETE FROM todo_status WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as never);
      return ok(undefined);
    },
  };
}
