import { createLogger } from '../../logger.ts';
import { createHash } from 'node:crypto';
import { isMailMetadata, validTodoSchedule, checkCallNumber, emailType, err, ok, taktError, type MailMetadata, type Result, type TaktError, type TodoId } from '@takt/domain';
import type { AppContext } from '../../context.ts';
import { createEmailAttachmentIntake } from '../../features/todos/email-attachments.ts';
import { toEmailIntake, createTodo, type AddinCreateTodoInput, type AddinCreateTodoResult, type AddinEmailAttachments } from './service.ts';

export interface MailAssignment {
  readonly requestId: string;
  readonly mail: MailMetadata;
  readonly note: string;
  readonly callNumber: string | null;
  readonly attachments: AddinEmailAttachments | null;
  readonly target: { readonly kind: 'existing'; readonly todoId: TodoId }
    | { readonly kind: 'auto' | 'new'; readonly input: AddinCreateTodoInput };
}
export interface MailAssignmentResult extends AddinCreateTodoResult {
  readonly outcome: 'created' | 'appended' | 'already_present';
}
export type AssignMail = (input: MailAssignment) => Promise<Result<MailAssignmentResult, TaktError>>;
const digest = (value: string): string => createHash('sha256').update(value).digest('hex');
class Rollback extends Error {
  readonly failure: TaktError;
  constructor(failure: TaktError) { super(failure.code); this.failure = failure; }
}

/** The transaction serializes matching, mail identity and the attachment receipt together. */
export function createMailAssignment(context: AppContext): AssignMail {
  return async (input) => {
    if (!isMailMetadata(input.mail)) return err(taktError('validation_error', 'Die Mail-Metadaten sind ungültig.'));
    const written: string[] = [];
    try {
      return await context.transactions.inTransaction(async unit => {
        const identity = digest(input.mail.identity);
        const requestKey = input.target.kind === 'auto' ? `auto:${identity}` : input.requestId;
        const fingerprint = digest(JSON.stringify(input));
        const receipt = await unit.mails.receipt(requestKey);
        if (receipt !== null) {
          // Automatic retries may have refreshed defaults, but must not create another task.
          if (input.target.kind !== 'auto' && receipt.fingerprint !== fingerprint) {
            return err(taktError('validation_error', 'Diese Anfragekennung gehört zu anderen Eingaben. Bitte neu laden.'));
          }
          const result = JSON.parse(receipt.response) as MailAssignmentResult;
          return ok({ ...result, outcome: 'already_present' as const });
        }
        const call = checkCallNumber(input.callNumber);
        if (input.callNumber !== null && !call.ok) return err(taktError('validation_error', 'Die Call-Nummer ist ungültig.'));
        let targetId = input.target.kind === 'existing' ? input.target.todoId : null;
        if (input.target.kind === 'auto' && call.ok) {
          const matches = await unit.todos.findByCallNumber(call.value);
          if (matches.length > 1) return err(taktError('validation_error', 'Mehrere Aufgaben passen. Bitte in der Seitenleiste auswählen.'));
          targetId = matches[0]?.id ?? null;
        }
        const scoped: AppContext = {
          ...context,
          transactions: { ...context.transactions, inTransaction: async work => work(unit) },
          attachmentBlobs: {
            ...context.attachmentBlobs,
            async storeEmailFile(data, extension) {
              const result = await context.attachmentBlobs.storeEmailFile(data, extension);
              if (result.ok) written.push(result.path);
              return result;
            },
          },
        };
        const deps = {
          inTransaction: scoped.transactions.inTransaction,
          now: () => context.clock.now(),
          emailAttachments: createEmailAttachmentIntake(scoped, context.logger ?? createLogger(), true),
        };
        let result: MailAssignmentResult;
        if (targetId !== null) {
          const todo = await unit.todos.load(targetId);
          if (todo === null) return err(taktError('not_found', 'Die Aufgabe ist nicht mehr vorhanden.'));
          if (!call.ok || todo.callNumber !== call.value) return err(taktError('validation_error', 'Die Aufgabe hat nicht dieselbe gültige Call-Nummer.'));
          const existing = await unit.mails.find(targetId, identity);
          result = { todo, addedDefaultTagIds: [], createdTags: [], attachments: null, outcome: existing ? 'already_present' : 'appended' };
          if (existing !== null) {
            const original = await unit.mails.receipt(`mail:${targetId}:${identity}`);
            return ok(original === null ? result : { ...JSON.parse(original.response) as MailAssignmentResult, outcome: 'already_present' });
          }
        } else {
          if (input.target.kind === 'existing') return err(taktError('not_found', 'Die Aufgabe ist nicht mehr vorhanden.'));
          if (!validTodoSchedule(input.target.input.dueDate, input.target.input.dueTime, input.target.input.estimateMinutes)) return err(taktError('validation_error', 'Frist, Uhrzeit oder Schätzung sind ungültig.'));
          const created = await createTodo(deps, { ...input.target.input, attachments: null });
          if (!created.ok) throw new Rollback(created.error);
          result = { ...created.value, outcome: 'created' };
        }
        let attachmentIds: readonly string[] = [];
        if (input.attachments !== null && input.attachments.items.length > 0) {
          // Reuse the intake capability only after validated matching, inside this transaction.
          const attached = await deps.emailAttachments(toEmailIntake(input.attachments), async () => ok({ todoId: result.todo.id, value: result }));
          if (!attached.ok) throw new Rollback(attached.error);
          attachmentIds = attached.value.attachments.attached.map(attachment => attachment.id);
          result = { ...result, attachments: {
            stored: attached.value.attachments.attached.length,
            rejected: attached.value.attachments.failed,
          } };
        }
        await unit.mails.insert({
          ...input.mail, identity, attachmentIds, todoId: result.todo.id,
          kind: emailType(input.mail.subject),
          personalNote: input.target.kind === 'existing' || result.outcome === 'appended' ? input.note : '',
          createdAt: context.clock.now(),
        });
        await unit.mails.record(`mail:${result.todo.id}:${identity}`, fingerprint, result.todo.id, JSON.stringify(result));
        await unit.mails.record(requestKey, fingerprint, result.todo.id, JSON.stringify(result));
        return ok(result);
      });
    } catch (error) {
      // SQL rollback does not roll back files; startup's orphan sweep also covers process death.
      for (const path of written) {
        try { await context.attachmentBlobs.removeEmailFile(path); } catch { /* The orphan sweep retries cleanup. */ }
      }
      if (error instanceof Rollback) return err(error.failure);
      throw error;
    }
  };
}
