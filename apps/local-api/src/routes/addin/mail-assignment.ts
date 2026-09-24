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
  /**
   * Welches Todo die E-Mail bekommt (A-10.11, A-10.16).
   *
   * Zwei Fälle und nicht drei: Ein vorhandenes Todo benennt der Benutzer,
   * nachdem er es gesehen hat, sonst entsteht ein neues. Der frühere dritte
   * Fall `auto` — der Dienst sucht selbst und hängt an, was zur Call-Nummer
   * aus einer fremden E-Mail paßt — ist mit dem Schnellbefehl gefallen
   * (E-134 Punkt 2, T-409b-2).
   */
  readonly target: { readonly kind: 'existing'; readonly todoId: TodoId }
    | { readonly kind: 'new'; readonly input: AddinCreateTodoInput };
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

const OUTCOMES = ['created', 'appended', 'already_present'] as const;

/**
 * Liest einen gespeicherten Beleg — **geprüft**, nicht zugesichert (E-134 Punkt 6).
 *
 * Der Beleg ist zwar von diesem Dienst geschrieben, aber er kommt aus der
 * Datenbank zurück, und in die Datenbank schreibt auch das Einspielen eines
 * Archivs. Ein `as MailAssignmentResult` machte aus einer verdorbenen Zeile
 * eine Antwort, die der Aufgabenbereich für einen Erfolg hielte.
 */
function parseReceiptResponse(raw: string): MailAssignmentResult | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<MailAssignmentResult>;
  const todo = candidate.todo as { id?: unknown } | undefined;
  if (typeof todo !== 'object' || todo === null || typeof todo.id !== 'string') return null;
  if (!Array.isArray(candidate.addedDefaultTagIds) || !Array.isArray(candidate.createdTags)) return null;
  if (candidate.attachments !== null && typeof candidate.attachments !== 'object') return null;
  if (!OUTCOMES.includes(candidate.outcome as (typeof OUTCOMES)[number])) return null;
  return candidate as MailAssignmentResult;
}

/**
 * Ein Beleg, der sich nicht lesen läßt, ist kein Fall des Aufrufers.
 *
 * Er wird geworfen und endet als 500 mit einem Satz ohne Innenleben (B-2.4).
 * Eine Antwort mit `already_present` aus einer verdorbenen Zeile wäre die
 * schlechtere Wahl: Sie behauptete einen Erfolg, den niemand nachgeprüft hat.
 */
const brokenReceipt = (): Error => new Error('stored add-in mail receipt is not a readable result');

/** The transaction serializes matching, mail identity and the attachment receipt together. */
export function createMailAssignment(context: AppContext): AssignMail {
  return async (input) => {
    if (!isMailMetadata(input.mail)) return err(taktError('validation_error', 'Die Mail-Metadaten sind ungültig.'));
    const written: string[] = [];
    try {
      return await context.transactions.inTransaction(async unit => {
        const identity = digest(input.mail.identity);
        const fingerprint = digest(JSON.stringify(input));
        const receipt = await unit.mails.receipt(input.requestId);
        if (receipt !== null) {
          if (receipt.fingerprint !== fingerprint) {
            return err(taktError('validation_error', 'Diese Anfragekennung gehört zu anderen Eingaben. Bitte neu laden.'));
          }
          const previous = parseReceiptResponse(receipt.response);
          if (previous === null) throw brokenReceipt();
          return ok({ ...previous, outcome: 'already_present' as const });
        }
        const call = checkCallNumber(input.callNumber);
        if (input.callNumber !== null && !call.ok) return err(taktError('validation_error', 'Die Call-Nummer ist ungültig.'));
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
        if (input.target.kind === 'existing') {
          const todo = await unit.todos.load(input.target.todoId);
          if (todo === null) return err(taktError('not_found', 'Das Todo ist nicht mehr vorhanden.'));
          // A-10.11: only the same valid call number turns this mail into an addition to this todo.
          if (!call.ok || todo.callNumber !== call.value) {
            return err(taktError('validation_error', 'Das Todo hat nicht dieselbe gültige Call-Nummer.'));
          }
          const existing = await unit.mails.find(todo.id, identity);
          if (existing !== null) {
            const original = await unit.mails.receipt(`mail:${todo.id}:${identity}`);
            if (original === null) {
              return ok({ todo, addedDefaultTagIds: [], createdTags: [], attachments: null, outcome: 'already_present' as const });
            }
            const previous = parseReceiptResponse(original.response);
            if (previous === null) throw brokenReceipt();
            return ok({ ...previous, outcome: 'already_present' as const });
          }
          result = { todo, addedDefaultTagIds: [], createdTags: [], attachments: null, outcome: 'appended' };
        } else {
          const fresh = input.target.input;
          if (!validTodoSchedule(fresh.dueDate, fresh.dueTime, fresh.estimateMinutes)) {
            return err(taktError('validation_error', 'Frist, Uhrzeit oder Schätzung sind ungültig.'));
          }
          const created = await createTodo(deps, { ...fresh, attachments: null });
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
          personalNote: input.target.kind === 'existing' ? input.note : '',
          createdAt: context.clock.now(),
        });
        await unit.mails.record(`mail:${result.todo.id}:${identity}`, fingerprint, result.todo.id, JSON.stringify(result));
        await unit.mails.record(input.requestId, fingerprint, result.todo.id, JSON.stringify(result));
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
