import type { MailEntry } from '@takt/domain';
import type { Attachment } from './api';

function mailDate(value: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(value));
}

/** Mail time determines order; the import time is only a fallback for legacy files. */
export function chronologicalAttachments(attachments: readonly Attachment[], mails: readonly MailEntry[]): readonly Attachment[] {
  const byAttachment = new Map<string, MailEntry>();
  for (const mail of mails) {
    for (const id of mail.attachmentIds ?? []) byAttachment.set(id, mail);
  }
  const entries = attachments.map(attachment => {
    const mail = attachment.origin === 'email' ? byAttachment.get(attachment.id) : undefined;
    const date = mail?.receivedAt ?? mail?.createdAt ?? attachment.createdAt;
    const message = attachment.origin === 'email' && attachment.displayName === 'Nachricht.eml';
    const label = `${mail?.kind ?? 'E-Mail'} – ${mailDate(date)}${mail?.receivedAt ? '' : ' (hinzugefügt)'}`;
    return {
      attachment: message && !attachment.title ? { ...attachment, title: label } : attachment,
      time: Date.parse(date), group: mail?.identity ?? attachment.id,
      groupTime: Date.parse(mail?.createdAt ?? attachment.createdAt), message,
    };
  });
  entries.sort((a, b) => a.time - b.time || a.groupTime - b.groupTime || a.group.localeCompare(b.group)
    || Number(b.message) - Number(a.message) || a.attachment.position - b.attachment.position);
  return entries.map(entry => entry.attachment);
}
