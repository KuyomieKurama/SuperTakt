import { expect, it } from 'vitest';
import type { MailEntry, Timestamp, TodoId } from '@takt/domain';
import type { Attachment } from '../src/features/todos/api';
import { chronologicalAttachments } from '../src/features/todos/attachmentChronology';

const imported = '2026-09-15T12:00:00Z';
function attachment(id: string, position: number, displayName = 'Nachricht.eml'): Attachment {
  return { id, todoId: 'todo', kind: 'file', title: null, target: `/tmp/${id}.eml`, position,
    createdAt: imported, origin: 'email', originSender: null, displayName, rebuilt: false };
}
function mail(identity: string, receivedAt: string, attachmentIds: readonly string[]): MailEntry {
  return { identity, todoId: 'todo' as TodoId, kind: 'Antwort', subject: 'AW: Test', sender: 'test@example.invalid',
    receivedAt, createdAt: imported as Timestamp, attachmentIds, internetMessageId: null,
    outlookLink: null, excerpt: null, personalNote: '' };
}
it('orders by mail time, keeps files with their message and formats local time with seconds', () => {
  const date = new Date(2026, 6, 13, 14, 9, 15).toISOString();
  const files = [attachment('new', 0), attachment('old-file', 1, 'Bericht.pdf'), attachment('old', 2)];
  const result = chronologicalAttachments(files, [mail('new', '2026-08-01T12:00:00Z', ['new']), mail('old', date, ['old', 'old-file'])]);
  expect(result.map(file => file.id)).toEqual(['old', 'old-file', 'new']);
  expect(result[0]?.title).toBe('Antwort – 13.07.2026, 14:09:15');
  expect(result[1]?.displayName).toBe('Bericht.pdf');
  expect(files[2]?.title).toBeNull();
});
it('labels legacy time honestly and preserves custom names', () => {
  const legacy = attachment('legacy', 0);
  expect(chronologicalAttachments([legacy], [])[0]?.title).toMatch(/^E-Mail – .* \(hinzugefügt\)$/);
  expect(chronologicalAttachments([{ ...legacy, title: 'Eigener Titel' }], [])[0]?.title).toBe('Eigener Titel');
});
