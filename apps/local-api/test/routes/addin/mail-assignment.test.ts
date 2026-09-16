import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase, type OpenedDatabase } from '@takt/storage';
import type { CalendarDay, Timestamp } from '@takt/domain';
import type { AppContext } from '../../../src/context.ts';
import { createAttachmentBlobPort } from '../../../src/access/attachment-store.ts';
import { createLogger } from '../../../src/logger.ts';
import { createMailAssignment, type MailAssignment, type MailAssignmentResult } from '../../../src/routes/addin/mail-assignment.ts';
import { createAddinRoutes } from '../../../src/routes/addin/index.ts';
import { createEmailAttachmentIntake } from '../../../src/features/todos/email-attachments.ts';

const NOW = '2026-09-15T12:00:00Z' as Timestamp;
function input(identity = 'message-one', mode: 'auto' | 'new' = 'auto'): MailAssignment {
  const fields = {
    title: 'CALL24470 Rückfrage', callNumber: '24470', statusId: null, tagIds: [], tagNames: [' Neu '],
    note: 'Persönlicher Text', dueDate: null, dueTime: null, estimateMinutes: 35,
    attachments: { sender: 'sender@example.test', items: [{ kind: 'file' as const, displayName: 'bericht.pdf', contentBase64: Buffer.from('fake pdf').toString('base64') }] },
  };
  return { ...fields, requestId: randomUUID(), mail: { identity, subject: 'AW: CALL24470 Rückfrage', sender: 'sender@example.test', receivedAt: NOW,
    internetMessageId: `<${identity}@example.test>`, outlookLink: null, excerpt: 'Optionaler Mailtext' }, target: { kind: mode, input: fields } };
}
function success(result: Awaited<ReturnType<ReturnType<typeof createMailAssignment>>>): MailAssignmentResult {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe('Outlook mail assignment with real SQLite and files', () => {
  let db: OpenedDatabase;
  let dir: string;
  let context: AppContext;
  beforeEach(async () => {
    db = openDatabase({ location: ':memory:', now: () => NOW });
    await db.migrations.migrateToLatest();
    dir = mkdtempSync(join(tmpdir(), 'supertakt-mail-'));
    const logger = createLogger(() => undefined);
    context = { transactions: db.transactions, clock: { now: () => NOW }, attachmentBlobs: createAttachmentBlobPort(dir, logger), logger } as AppContext;
  });
  afterEach(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });
  it('creates a task, a separate mail entry, notes, normalized tags and a file', async () => {
    const result = success(await createMailAssignment(context)(input()));
    expect(result.outcome).toBe('created');
    expect(result.attachments?.stored).toBe(1);
    expect(result.todo.estimateMinutes).toBe(35);
    await db.transactions.inTransaction(async unit => {
      expect((await unit.notes.load(result.todo.id))?.text).toBe('Persönlicher Text');
      expect((await unit.mails.list(result.todo.id))[0]?.excerpt).toBe('Optionaler Mailtext');
      const attachments = await unit.attachments.list(result.todo.id);
      expect(attachments).toHaveLength(1);
      expect((await unit.mails.list(result.todo.id))[0]?.attachmentIds).toEqual(attachments.map(attachment => attachment.id));
    });
  });
  it('appends distinct messages of the same day without changing completed tasks, personal notes, time or export state', async () => {
    const assign = createMailAssignment(context);
    const first = success(await assign(input()));
    await db.transactions.inTransaction(async unit => {
      const booked = await unit.timeEntries.create({ todoId: first.todo.id, startedAt: '2026-09-15T10:00:00Z' as Timestamp, endedAt: NOW, note: 'Leistung' }, NOW);
      expect(booked.ok).toBe(true);
      await unit.todos.markDone(first.todo.id, NOW);
    });
    const tables = ['todo', 'todo_note', 'todo_tag', 'time_entry', 'timer_heartbeat', 'export_run', 'export_audit'];
    const snapshot = () => tables.map(table => db.connection.prepare(`SELECT * FROM ${table}`).all());
    const before = snapshot();
    const second = success(await assign(input('message-two')));
    expect(second.outcome).toBe('appended');
    expect(second.todo.id).toBe(first.todo.id);
    expect(snapshot()).toEqual(before);
    await db.transactions.inTransaction(async unit => {
      const mails = await unit.mails.list(first.todo.id);
      expect(mails).toHaveLength(2);
      expect(mails.map(mail => mail.internetMessageId).sort()).toEqual(['<message-one@example.test>', '<message-two@example.test>']);
      expect(mails.find(mail => mail.internetMessageId === '<message-two@example.test>')?.personalNote).toBe('Persönlicher Text');
    });
  });
  it('orders messages by their actual timestamp even with different UTC offsets', async () => {
    const assign = createMailAssignment(context);
    const early = input('early');
    const late = input('late');
    const first = success(await assign({ ...early, mail: { ...early.mail, receivedAt: '2026-09-15T13:00:00+02:00' } }));
    success(await assign({ ...late, mail: { ...late.mail, receivedAt: '2026-09-15T12:00:00Z' } }));
    await db.transactions.inTransaction(async unit => {
      expect((await unit.mails.list(first.todo.id)).map(mail => mail.internetMessageId)).toEqual(['<late@example.test>', '<early@example.test>']);
    });
  });
  it('serializes concurrent repeats and concurrent different messages without duplicate tasks or files', async () => {
    const assign = createMailAssignment(context);
    const same = input();
    const results = await Promise.all([assign(same), assign(same), assign(input('other'))]);
    expect(results.map(result => success(result).outcome)).toEqual(['created', 'already_present', 'appended']);
    expect(db.connection.prepare('SELECT * FROM todo').all()).toHaveLength(1);
    expect(db.connection.prepare('SELECT * FROM todo_mail').all()).toHaveLength(2);
    expect(db.connection.prepare('SELECT * FROM todo_attachment').all()).toHaveLength(2);
    expect(await context.attachmentBlobs.listEmailFiles()).toHaveLength(2);
  });
  it('allows conscious new tasks, but rejects ambiguous automatic assignment', async () => {
    const assign = createMailAssignment(context);
    success(await assign(input()));
    const explicit = input('message-one', 'new');
    expect(success(await assign(explicit)).outcome).toBe('created');
    expect(success(await assign(explicit)).outcome).toBe('already_present');
    expect((await assign(input('message-three'))).ok).toBe(false);
    expect(db.connection.prepare('SELECT * FROM todo').all()).toHaveLength(2);
  });
  it('never merges tasks without a valid call number', async () => {
    const assign = createMailAssignment(context);
    for (const identity of ['without-one', 'without-two']) {
      const candidate = input(identity);
      if (candidate.target.kind === 'existing') throw new Error('fixture');
      success(await assign({ ...candidate, callNumber: null, target: { ...candidate.target, input: { ...candidate.target.input, callNumber: null } } }));
    }
    expect(db.connection.prepare('SELECT * FROM todo').all()).toHaveLength(2);
  });
  it('reports rejected files honestly and does not retry them as duplicates', async () => {
    const candidate = input();
    const broken: MailAssignment = { ...candidate, attachments: { sender: null, items: [{ kind: 'file', displayName: 'kaputt.pdf', contentBase64: '!!!' }] } };
    const result = success(await createMailAssignment(context)(broken));
    expect(result.attachments).toMatchObject({ stored: 0, rejected: [{ displayName: 'kaputt.pdf', reason: 'rejected' }] });
    expect(success(await createMailAssignment(context)(broken)).outcome).toBe('already_present');
    const repeated = success(await createMailAssignment(context)({ ...broken, requestId: randomUUID(), target: { kind: 'existing', todoId: result.todo.id } }));
    expect(repeated.outcome).toBe('already_present');
    expect(repeated.attachments).toEqual(result.attachments);
  });
  it('rolls back SQL and removes files if receipt persistence fails after writing', async () => {
    const broken: AppContext = { ...context, transactions: { inTransaction: work => db.transactions.inTransaction(unit => work({ ...unit, mails: { ...unit.mails, record: async () => { throw new Error('injected'); } } })) } };
    await expect(createMailAssignment(broken)(input())).rejects.toThrow('injected');
    expect(db.connection.prepare('SELECT * FROM todo').all()).toHaveLength(0);
    expect(db.connection.prepare('SELECT * FROM todo_mail').all()).toHaveLength(0);
    expect(await context.attachmentBlobs.listEmailFiles()).toHaveLength(0);
  });
  it('round-trips scheduling, mail history and receipts through the archive tables', async () => {
    const candidate = input();
    if (candidate.target.kind === 'existing') throw new Error('fixture');
    const scheduled = { ...candidate, target: { ...candidate.target, input: { ...candidate.target.input, dueDate: '2026-10-25' as CalendarDay, dueTime: '02:30', estimateMinutes: 55 } } };
    const result = success(await createMailAssignment(context)(scheduled));
    await db.transactions.inTransaction(async unit => {
      const tables = await unit.dataArchive.readAll();
      await unit.dataArchive.replaceAll(tables);
      const todo = await unit.todos.load(result.todo.id);
      expect(todo).toMatchObject({ dueDate: '2026-10-25', dueTime: '02:30', estimateMinutes: 55 });
      expect(await unit.mails.list(result.todo.id)).toHaveLength(1);
      expect((await unit.mails.list(result.todo.id))[0]?.attachmentIds).toEqual((await unit.attachments.list(result.todo.id)).map(attachment => attachment.id));
    });
    expect(success(await createMailAssignment(context)(scheduled)).outcome).toBe('already_present');
  });
  it('rejects unsafe mail links and deadlines with a time but no date', async () => {
    const candidate = input();
    const assign = createMailAssignment(context);
    expect((await assign({ ...candidate, mail: { ...candidate.mail, outlookLink: 'javascript:alert(1)' } })).ok).toBe(false);
    if (candidate.target.kind === 'existing') throw new Error('fixture');
    expect((await assign({ ...candidate, target: { ...candidate.target, input: { ...candidate.target.input, dueTime: '12:30' } } })).ok).toBe(false);
    expect(db.connection.prepare('SELECT * FROM todo').all()).toHaveLength(0);
  });
  it('rejects unrelated task fields at the narrow append route', async () => {
    const routes = createAddinRoutes({ inTransaction: db.transactions.inTransaction, now: () => NOW,
      emailAttachments: createEmailAttachmentIntake(context, context.logger!), assignMail: createMailAssignment(context) });
    const candidate = input();
    const result = success(await createMailAssignment(context)(candidate));
    const response = await routes.request(`/todos/${result.todo.id}/mails`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: randomUUID(), callNumber: '24470', mail: candidate.mail, title: 'Übernahme verboten', completedAt: null }) });
    expect(response.status).toBe(422);
  });
});
