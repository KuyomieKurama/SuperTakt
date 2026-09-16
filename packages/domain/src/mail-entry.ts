import { normalizeAttachmentLink } from './attachment.ts';
import type { TodoId, Timestamp } from './kernel.ts';

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
  for (const [key, max] of [['identity', 4096], ['subject', 4096], ['sender', 2048]] as const) {
    if (typeof mail[key] !== 'string' || mail[key].length > max) return false;
  }
  return (mail['identity'] as string).length > 0
    && (mail['receivedAt'] === null || (typeof mail['receivedAt'] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(mail['receivedAt']) && Number.isFinite(Date.parse(mail['receivedAt']))))
    && (mail['internetMessageId'] === null || (typeof mail['internetMessageId'] === 'string' && mail['internetMessageId'].length <= 2048))
    && (mail['outlookLink'] === null || normalizeOutlookLink(mail['outlookLink']) !== null)
    && (mail['excerpt'] === null || (typeof mail['excerpt'] === 'string' && mail['excerpt'].length <= 4000));
}

export function validTodoSchedule(dueDate: unknown, dueTime: unknown, estimateMinutes: unknown): boolean {
  return (dueTime == null || (dueDate != null && typeof dueTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(dueTime)))
    && (estimateMinutes == null || (typeof estimateMinutes === 'number' && Number.isInteger(estimateMinutes) && estimateMinutes > 0 && estimateMinutes <= 525600));
}
