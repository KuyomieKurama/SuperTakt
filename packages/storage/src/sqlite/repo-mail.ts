import type { MailEntry, TodoId } from '@takt/domain';
import type { MailPort } from '../ports.ts';
import { text, type SqlConnection } from './database.ts';

export function createMailPort(conn: SqlConnection): MailPort {
  return {
    async list(todoId) {
      return conn.prepare('SELECT metadata FROM todo_mail WHERE todo_id = ? ORDER BY julianday(COALESCE(received_at, created_at)) DESC, created_at DESC, identity').all(todoId)
        .map(row => JSON.parse(text(row, 'metadata')) as MailEntry);
    },
    async find(todoId, identity) {
      const row = conn.prepare('SELECT metadata FROM todo_mail WHERE todo_id = ? AND identity = ?').get(todoId, identity);
      return row === undefined ? null : JSON.parse(text(row, 'metadata')) as MailEntry;
    },
    async insert(entry) {
      conn.prepare('INSERT INTO todo_mail (todo_id, identity, metadata, received_at, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(entry.todoId, entry.identity, JSON.stringify(entry), entry.receivedAt, entry.createdAt);
    },
    async receipt(key) {
      const row = conn.prepare('SELECT fingerprint, response FROM addin_mail_receipt WHERE request_key = ?').get(key);
      return row === undefined ? null : { fingerprint: text(row, 'fingerprint'), response: text(row, 'response') };
    },
    async record(key, fingerprint, todoId: TodoId, response) {
      conn.prepare('INSERT INTO addin_mail_receipt (request_key, fingerprint, todo_id, response) VALUES (?, ?, ?, ?)')
        .run(key, fingerprint, todoId, response);
    },
  };
}
