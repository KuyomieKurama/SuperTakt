import {
  MAIL_EXCERPT_MAX_LENGTH,
  MAIL_MESSAGE_ID_MAX_LENGTH,
  MAIL_SENDER_MAX_LENGTH,
  MAIL_SUBJECT_MAX_LENGTH,
  type MailMetadata,
} from '@takt/domain';
import type { ApiClient, CreateTodoRequest } from '../api/client.ts';
import { suggestTitle, type MailFacts } from './mail.ts';

// Cut on code points so no surrogate half survives; one code point is at most two UTF-16 units,
// the unit the door counts, so half the cap always fits.
const EXCERPT_MAX_CODE_POINTS = Math.floor(MAIL_EXCERPT_MAX_LENGTH / 2);

export async function mailMetadata(mail: MailFacts, includeExcerpt: boolean): Promise<MailMetadata> {
  const source = mail.internetMessageId ? `internet:${mail.internetMessageId.trim()}`
    : mail.itemId ? `outlook:${mail.mailboxAddress ?? ''}:${mail.itemId}`
      : `content:${JSON.stringify([mail.subject, mail.senderAddress, mail.receivedAt, mail.body])}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const identity = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  return {
    identity,
    subject: mail.subject.slice(0, MAIL_SUBJECT_MAX_LENGTH),
    sender: `${mail.senderName} <${mail.senderAddress}>`.slice(0, MAIL_SENDER_MAX_LENGTH),
    receivedAt: mail.receivedAt,
    internetMessageId: mail.internetMessageId?.slice(0, MAIL_MESSAGE_ID_MAX_LENGTH) ?? null,
    outlookLink: mail.outlookLink ?? null,
    excerpt: includeExcerpt ? Array.from(mail.body).slice(0, EXCERPT_MAX_CODE_POINTS).join('') : null,
  };
}

/** Sends the mail either to the chosen existing todo (narrow `/mails` door) or as a new todo; the server assigns atomically. */
export async function saveMail(
  api: ApiClient,
  mail: MailFacts,
  input: CreateTodoRequest,
  target: 'auto' | 'new' | { readonly todoId: string },
  includeExcerpt: boolean,
) {
  const metadata = await mailMetadata(mail, includeExcerpt);
  const requestId = input.requestId ?? crypto.randomUUID();
  if (typeof target === 'object') return api.appendMail({
    todoId: target.todoId, requestId, mail: metadata,
    callNumber: input.callNumber ?? '', note: input.note, attachments: input.attachments,
  });
  return api.createTodo({ ...input, title: input.title || suggestTitle(mail.subject) || 'E-Mail bearbeiten',
    requestId, mode: 'new', mail: metadata });
}
