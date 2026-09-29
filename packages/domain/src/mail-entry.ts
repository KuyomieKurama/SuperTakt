import { normalizeAttachmentLink } from './attachment.ts';
import type { TodoId, Timestamp } from './kernel.ts';

// Length caps shared by the add-in door, the archive import and the task pane (O-AU, O-AV).
export const MAIL_IDENTITY_MAX_LENGTH = 4096;
export const MAIL_SUBJECT_MAX_LENGTH = 4096;
export const MAIL_SENDER_MAX_LENGTH = 2048;
export const MAIL_MESSAGE_ID_MAX_LENGTH = 2048;
export const MAIL_EXCERPT_MAX_LENGTH = 4000;
/** The personal note taken over with a mail; the add-in door caps its `note` field with it. */
export const MAIL_NOTE_MAX_LENGTH = 4000;

export interface MailMetadata {
  readonly identity: string;
  readonly subject: string;
  readonly sender: string;
  readonly receivedAt: string | null;
  readonly internetMessageId: string | null;
  readonly outlookLink: string | null;
  readonly excerpt: string | null;
}

export interface MailEntry extends MailMetadata {
  readonly todoId: TodoId;
  readonly kind: 'Antwort' | 'Weiterleitung' | 'E-Mail';
  readonly personalNote: string;
  readonly attachmentIds?: readonly string[];
  readonly createdAt: Timestamp;
}

export function emailType(subject: string): MailEntry['kind'] {
  if (/^\s*(WG|WL|FW|Fwd)\s*:/i.test(subject)) return 'Weiterleitung';
  if (/^\s*(AW|RE)\s*:/i.test(subject)) return 'Antwort';
  return 'E-Mail';
}

export function normalizeOutlookLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const checked = normalizeAttachmentLink(value);
  return checked.ok && /^https:\/\/(?:outlook\.office\.com|outlook\.office365\.com|outlook\.live\.com)\//.test(checked.url) ? checked.url : null;
}

export function isMailMetadata(value: unknown): value is MailMetadata {
  if (typeof value !== 'object' || value === null) return false;
  const mail = value as Record<string, unknown>;
  const textLimits = [
    ['identity', MAIL_IDENTITY_MAX_LENGTH],
    ['subject', MAIL_SUBJECT_MAX_LENGTH],
    ['sender', MAIL_SENDER_MAX_LENGTH],
  ] as const;
  for (const [key, max] of textLimits) {
    if (typeof mail[key] !== 'string' || mail[key].length > max) return false;
  }
  return (mail['identity'] as string).length > 0
    && (mail['receivedAt'] === null || (typeof mail['receivedAt'] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(mail['receivedAt']) && Number.isFinite(Date.parse(mail['receivedAt']))))
    && (mail['internetMessageId'] === null || (typeof mail['internetMessageId'] === 'string' && mail['internetMessageId'].length <= MAIL_MESSAGE_ID_MAX_LENGTH))
    && (mail['outlookLink'] === null || normalizeOutlookLink(mail['outlookLink']) !== null)
    && (mail['excerpt'] === null || (typeof mail['excerpt'] === 'string' && mail['excerpt'].length <= MAIL_EXCERPT_MAX_LENGTH));
}

/**
 * A stored mail entry: valid metadata plus the fields the service adds (A-10.12). Stored entries
 * can come from an imported archive, so readers check them instead of trusting the JSON.
 */
export function isMailEntry(value: unknown): value is MailEntry {
  if (!isMailMetadata(value)) return false;
  const entry = value as unknown as Record<string, unknown>;
  if (typeof entry['todoId'] !== 'string') return false;
  if (entry['kind'] !== emailType(value.subject)) return false;
  const note = entry['personalNote'];
  if (typeof note !== 'string' || note.length > MAIL_NOTE_MAX_LENGTH) return false;
  if (typeof entry['createdAt'] !== 'string') return false;
  const attachmentIds = entry['attachmentIds'];
  if (attachmentIds === undefined) return true;
  return Array.isArray(attachmentIds) && attachmentIds.every((id) => typeof id === 'string');
}

export function validTodoSchedule(dueDate: unknown, dueTime: unknown, estimateMinutes: unknown): boolean {
  return (dueTime == null || (dueDate != null && typeof dueTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(dueTime)))
    && (estimateMinutes == null || (typeof estimateMinutes === 'number' && Number.isInteger(estimateMinutes) && estimateMinutes > 0 && estimateMinutes <= 525600));
}
