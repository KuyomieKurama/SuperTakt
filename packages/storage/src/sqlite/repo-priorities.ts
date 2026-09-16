import { err, taktError, type TodoPriority } from '@takt/domain';
import type { TodoPriorityPort } from '../ports.ts';
import { integer, text, type SqlConnection, type SqlRow } from './database.ts';
import type { IdSource } from './ids.ts';
import { attempt } from './errors.ts';

const columns = 'id, name, weight, created_at, updated_at';
const map = (row: SqlRow): TodoPriority => ({ id: text(row, 'id'), name: text(row, 'name'), weight: integer(row, 'weight'), createdAt: text(row, 'created_at') as TodoPriority['createdAt'], updatedAt: text(row, 'updated_at') as TodoPriority['updatedAt'] });
export function createTodoPriorityPort(conn: SqlConnection, ids: IdSource): TodoPriorityPort {
  const load = (id: string) => { const row = conn.prepare(`SELECT ${columns} FROM todo_priority WHERE id = ?`).get(id); return row ? map(row) : null; };
  return {
    async list() { return conn.prepare(`SELECT ${columns} FROM todo_priority ORDER BY weight DESC, name COLLATE NOCASE, id`).all().map(map); },
    async load(id) { return load(id); },
    async save(id, name, weight, now) {
      if (!name.trim() || name.trim().length > 120 || !Number.isSafeInteger(weight)) return err(taktError('validation_error', 'Name und ganzzahlige Gewichtung sind erforderlich.'));
      if (id !== null && load(id) === null) return err(taktError('not_found', 'Die Priorität existiert nicht.'));
      const target = id ?? ids.next();
      if (conn.prepare('SELECT id FROM todo_priority WHERE name = ? COLLATE NOCASE AND id <> ?').get(name.trim(), target)) return err(taktError('name_conflict', 'Eine Priorität mit diesem Namen existiert bereits.'));
      return attempt(() => {
        if (id === null) conn.prepare('INSERT INTO todo_priority (id, name, weight, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(target, name.trim(), weight, now, now);
        else conn.prepare('UPDATE todo_priority SET name = ?, weight = ?, updated_at = ? WHERE id = ?').run(name.trim(), weight, now, id);
        return load(target)!;
      });
    },
    async remove(id) {
      if (load(id) === null) return err(taktError('not_found', 'Die Priorität existiert nicht.'));
      return attempt(() => { conn.prepare('DELETE FROM todo_priority WHERE id = ?').run(id); });
    },
  };
}
