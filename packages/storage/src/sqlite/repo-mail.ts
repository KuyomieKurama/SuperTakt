import { isMailEntry, type MailEntry, type TodoId } from '@takt/domain';
import type { MailPort } from '../ports.ts';
import { text, type SqlConnection, type SqlRow } from './database.ts';

const NEWEST_FIRST = 'ORDER BY julianday(COALESCE(received_at, created_at)) DESC, created_at DESC, identity';

// `metadata` can come from an imported archive; a malformed entry is a fault, not a mail.
function toMailEntry(row: SqlRow): MailEntry {
  const entry: unknown = JSON.parse(text(row, 'metadata'));
  if (!isMailEntry(entry)) throw new Error('Ein gespeicherter Mail-Eintrag ist ungültig.');
  return entry;
}

export function createMailPort(conn: SqlConnection): MailPort {
  return {
    async list(todoId) {
      const rows = conn.prepare(`SELECT metadata FROM todo_mail WHERE todo_id = ? ${NEWEST_FIRST}`).all(todoId);
      return rows.map(toMailEntry);
    },
    async find(todoId, identity) {
      const row = conn.prepare('SELECT metadata FROM todo_mail WHERE todo_id = ? AND identity = ?').get(todoId, identity);
      if (row === undefined) return null;
      return toMailEntry(row);
    },
    async insert(entry) {
      const statement = conn.prepare(
        'INSERT INTO todo_mail (todo_id, identity, metadata, received_at, created_at) VALUES (?, ?, ?, ?, ?)',
      );
      statement.run(entry.todoId, entry.identity, JSON.stringify(entry), entry.receivedAt, entry.createdAt);
    },
    async receipt(key) {
      const row = conn.prepare('SELECT fingerprint, response FROM addin_mail_receipt WHERE request_key = ?').get(key);
      if (row === undefined) return null;
      return { fingerprint: text(row, 'fingerprint'), response: text(row, 'response') };
    },
    async record(key, fingerprint, todoId: TodoId, response) {
      const statement = conn.prepare(
        'INSERT INTO addin_mail_receipt (request_key, fingerprint, todo_id, response) VALUES (?, ?, ?, ?)',
      );
      statement.run(key, fingerprint, todoId, response);
    },
  };
}
