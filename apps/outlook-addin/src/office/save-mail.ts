import type { MailMetadata } from '@takt/domain';
import type { ApiClient, CreateTodoRequest } from '../api/client.ts';
import { suggestTitle, type MailFacts } from './mail.ts';

export async function mailMetadata(mail: MailFacts, includeExcerpt: boolean): Promise<MailMetadata> {
  const source = mail.internetMessageId ? `internet:${mail.internetMessageId.trim()}`
    : mail.itemId ? `outlook:${mail.mailboxAddress ?? ''}:${mail.itemId}`
      : `content:${JSON.stringify([mail.subject, mail.senderAddress, mail.receivedAt, mail.body])}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const identity = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  return {
    identity,
    subject: mail.subject.slice(0, 4096),
    sender: `${mail.senderName} <${mail.senderAddress}>`.slice(0, 2048),
    receivedAt: mail.receivedAt,
    internetMessageId: mail.internetMessageId?.slice(0, 2048) ?? null,
    outlookLink: mail.outlookLink ?? null,
    excerpt: includeExcerpt ? Array.from(mail.body).slice(0, 2000).join('') : null,
  };
}

/** Both Outlook commands use this contract and the server's atomic assignment use case. */
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
    requestId, mode: target, mail: metadata });
}
