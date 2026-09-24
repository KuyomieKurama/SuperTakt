import { err, MAX_PRIORITY_NAME_CHARACTERS, taktError, type TodoPriority } from '@takt/domain';
import type { TodoPriorityPort } from '../ports.ts';
import { integer, text, type SqlConnection, type SqlRow } from './database.ts';
import type { IdSource } from './ids.ts';
import { attempt } from './errors.ts';

const COLUMNS = 'id, name, weight, created_at, updated_at';

function toPriority(row: SqlRow): TodoPriority {
  return {
    id: text(row, 'id'),
    name: text(row, 'name'),
    weight: integer(row, 'weight'),
    createdAt: text(row, 'created_at') as TodoPriority['createdAt'],
    updatedAt: text(row, 'updated_at') as TodoPriority['updatedAt'],
  };
}

export function createTodoPriorityPort(conn: SqlConnection, ids: IdSource): TodoPriorityPort {
  const load = (id: string): TodoPriority | null => {
    const row = conn.prepare(`SELECT ${COLUMNS} FROM todo_priority WHERE id = ?`).get(id);
    if (row === undefined) return null;
    return toPriority(row);
  };

  return {
    async list() {
      const rows = conn.prepare(`SELECT ${COLUMNS} FROM todo_priority ORDER BY weight DESC, name COLLATE NOCASE, id`).all();
      return rows.map(toPriority);
    },

    async load(id) {
      return load(id);
    },

    async save(id, name, weight, now) {
      const trimmedName = name.trim();
      const nameIsValid = trimmedName.length > 0 && trimmedName.length <= MAX_PRIORITY_NAME_CHARACTERS;
      if (!nameIsValid || !Number.isSafeInteger(weight)) {
        return err(taktError('validation_error', 'Name und ganzzahlige Gewichtung sind erforderlich.'));
      }
      if (id !== null && load(id) === null) {
        return err(taktError('not_found', 'Die Priorität existiert nicht.'));
      }

      const targetId = id ?? ids.next();
      const sameName = conn
        .prepare('SELECT id FROM todo_priority WHERE name = ? COLLATE NOCASE AND id <> ?')
        .get(trimmedName, targetId);
      if (sameName !== undefined) {
        return err(taktError('name_conflict', 'Eine Priorität mit diesem Namen existiert bereits.'));
      }

      return attempt(() => {
        if (id === null) {
          conn
            .prepare('INSERT INTO todo_priority (id, name, weight, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
            .run(targetId, trimmedName, weight, now, now);
        } else {
          conn
            .prepare('UPDATE todo_priority SET name = ?, weight = ?, updated_at = ? WHERE id = ?')
            .run(trimmedName, weight, now, id);
        }
        const saved = load(targetId);
        if (saved === null) throw new Error('Die gespeicherte Priorität ist nicht auffindbar.');
        return saved;
      });
    },

    async remove(id) {
      if (load(id) === null) {
        return err(taktError('not_found', 'Die Priorität existiert nicht.'));
      }
      return attempt(() => {
        conn.prepare('DELETE FROM todo_priority WHERE id = ?').run(id);
      });
    },
  };
}
