import type { IdleSession, IdleTimerPort } from '../ports.ts';
import type { TimeEntryId, Timestamp, TodoId } from '@takt/domain';
import { text, type SqlConnection } from './database.ts';

export function createIdleTimerPort(conn: SqlConnection): IdleTimerPort {
  return {
    async pending(): Promise<IdleSession | null> {
      const row = conn.prepare('SELECT session_id, todo_id, started_at, returned_at, note FROM timer_idle WHERE id = 1').get();
      if (row === undefined) return null;
      return {
        id: text(row, 'session_id') as TimeEntryId,
        todoId: text(row, 'todo_id') as TodoId,
        startedAt: text(row, 'started_at') as Timestamp,
        returnedAt: row['returned_at'] === null ? null : text(row, 'returned_at') as Timestamp,
        note: text(row, 'note'),
      };
    },
    async begin(session) {
      conn.prepare('INSERT INTO timer_idle (id, session_id, todo_id, started_at, returned_at, note) VALUES (1, ?, ?, ?, ?, ?)')
        .run(session.id, session.todoId, session.startedAt, session.returnedAt, session.note);
    },
    async returned(id, at) {
      conn.prepare('UPDATE timer_idle SET returned_at = ? WHERE session_id = ? AND returned_at IS NULL').run(at, id);
    },
    async clear(id) { conn.prepare('DELETE FROM timer_idle WHERE session_id = ?').run(id); },
  };
}
