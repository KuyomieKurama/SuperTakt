/**
 * Takt — `isMailEntry` (T-411a, A-10.12): a stored mail entry is checked, not trusted, because it
 * can come from an imported archive. Covers the fields on top of `isMailMetadata`.
 */
import { describe, expect, it } from 'vitest';
import { isMailEntry, type MailEntry } from '../src/mail-entry.ts';
import type { TodoId, Timestamp } from '../src/kernel.ts';

function validEntry(): MailEntry {
  return {
    todoId: 'todo-1' as TodoId,
    identity: 'message-1',
    subject: 'CALL24470 Rückfrage',
    sender: 'sender@example.test',
    receivedAt: '2026-09-10T09:00:00Z',
    internetMessageId: '<message-1@example.test>',
    outlookLink: null,
    excerpt: 'Kurzer Auszug',
    kind: 'E-Mail',
    personalNote: 'Persönlicher Text',
    createdAt: '2026-09-10T09:00:00Z' as Timestamp,
  };
}

describe('isMailEntry — a positive case is accepted as a baseline', () => {
  it('a fully valid entry passes', () => {
    expect(isMailEntry(validEntry())).toBe(true);
  });
});

describe('isMailEntry — rejects a mismatched kind (must match emailType(subject))', () => {
  it('kind "Antwort" for a subject without "AW:"/"RE:" is rejected', () => {
    expect(isMailEntry({ ...validEntry(), kind: 'Antwort' })).toBe(false);
  });

  it('kind "Weiterleitung" for a plain subject is rejected', () => {
    expect(isMailEntry({ ...validEntry(), kind: 'Weiterleitung' })).toBe(false);
  });

  it('a kind outside the closed set is rejected', () => {
    expect(isMailEntry({ ...validEntry(), kind: 'Sonstiges' })).toBe(false);
  });
});

describe('isMailEntry — rejects a missing createdAt', () => {
  it('createdAt undefined is rejected', () => {
    const { createdAt: _createdAt, ...withoutCreatedAt } = validEntry();
    expect(isMailEntry(withoutCreatedAt)).toBe(false);
  });

  it('createdAt as a number instead of a string is rejected', () => {
    expect(isMailEntry({ ...validEntry(), createdAt: 1_757_500_800_000 })).toBe(false);
  });

  it('createdAt as null is rejected', () => {
    expect(isMailEntry({ ...validEntry(), createdAt: null })).toBe(false);
  });
});

describe('isMailEntry — attachmentIds must be a list of strings when present', () => {
  it('attachmentIds as a list of numbers is rejected', () => {
    expect(isMailEntry({ ...validEntry(), attachmentIds: [1] })).toBe(false);
  });

  it('attachmentIds omitted entirely is accepted (optional field)', () => {
    expect(isMailEntry(validEntry())).toBe(true);
  });

  it('attachmentIds as a list of strings is accepted', () => {
    expect(isMailEntry({ ...validEntry(), attachmentIds: ['att-1', 'att-2'] })).toBe(true);
  });

  it('attachmentIds as a bare string (not a list) is rejected', () => {
    expect(isMailEntry({ ...validEntry(), attachmentIds: 'att-1' })).toBe(false);
  });
});

describe('isMailEntry — personalNote is capped at MAIL_NOTE_MAX_LENGTH (4000)', () => {
  it('a note of exactly 4000 characters is accepted', () => {
    expect(isMailEntry({ ...validEntry(), personalNote: 'x'.repeat(4000) })).toBe(true);
  });

  it('a note of 4001 characters is rejected', () => {
    expect(isMailEntry({ ...validEntry(), personalNote: 'x'.repeat(4001) })).toBe(false);
  });

  it('a note as a number is rejected', () => {
    expect(isMailEntry({ ...validEntry(), personalNote: 123 })).toBe(false);
  });
});

describe('isMailEntry — todoId must be a string', () => {
  it('a numeric todoId is rejected', () => {
    expect(isMailEntry({ ...validEntry(), todoId: 42 })).toBe(false);
  });

  it('a missing todoId is rejected', () => {
    const { todoId: _todoId, ...withoutTodoId } = validEntry();
    expect(isMailEntry(withoutTodoId)).toBe(false);
  });
});

describe('isMailEntry — still delegates to isMailMetadata for the shared fields', () => {
  it('an entry that is not even an object is rejected', () => {
    expect(isMailEntry('not an object')).toBe(false);
    expect(isMailEntry(null)).toBe(false);
    expect(isMailEntry(undefined)).toBe(false);
  });

  it('an entry with an empty identity is rejected (isMailMetadata requires identity.length > 0)', () => {
    expect(isMailEntry({ ...validEntry(), identity: '' })).toBe(false);
  });
});
