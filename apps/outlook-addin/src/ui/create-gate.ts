/**
 * Why the main button of the task pane is disabled (V-11 from T-154, A-10.11).
 *
 * `blocked` and the sentence below the button come from one calculation:
 * `blocked` is true exactly when `reason` is set. Two separate expressions are
 * how a disabled button without a reason comes about. No JSX, so `proof:addin`
 * section 19f can run every case without rendering the pane.
 *
 * The gate does not replace a check: the service door validates the same
 * values again against the same rules from `@takt/domain`.
 */

/** The loading state of the task pane, as far as the gate is concerned. */
export type Connection = 'loading' | 'ready' | 'failed';

export interface CreateTodoInputs {
  /** The raw field value; trimmed here. */
  readonly title: string;
  readonly connection: Connection;
  /** The message at the call number field, or `null` when there is none. */
  readonly callNumberProblem: string | null;
  /** Does the deadline field hold something that is not a day? */
  readonly dueDateInvalid: boolean;
  /** Several todos match and none is chosen yet (A-10.11: ambiguous matches require a choice). */
  readonly targetChoiceMissing: boolean;
}

export interface CreateTodoGate {
  readonly blocked: boolean;
  /** The first open reason as a whole sentence, or `null`. One, not all: the user clears them in turn. */
  readonly reason: string | null;
}

/** One short sentence per reason, without address (E-078, E-080 point 4). */
const REASON = Object.freeze({
  call_number: 'Die Call-Nummer stimmt noch nicht.',
  target_choice: 'Mehrere Todos passen. Bitte eines auswählen.',
  title: 'Der Titel fehlt.',
  due_date: 'Die Frist stimmt noch nicht.',
  loading: 'Die Tags werden noch geladen.',
  failed: 'Keine Verbindung zu SuperTakt.',
});

/**
 * Block and reason in one.
 *
 * The order is the reading order of the pane (call number, the matching todos
 * right below it, title, deadline), followed by the connection. The connection
 * comes last because it already has its own visible surface in the tag field.
 */
export function createTodoGate({
  title,
  connection,
  callNumberProblem,
  dueDateInvalid,
  targetChoiceMissing,
}: CreateTodoInputs): CreateTodoGate {
  let reason: string | null = null;
  if (callNumberProblem !== null) reason = REASON.call_number;
  else if (targetChoiceMissing) reason = REASON.target_choice;
  else if (title.trim().length === 0) reason = REASON.title;
  else if (dueDateInvalid) reason = REASON.due_date;
  else if (connection === 'loading') reason = REASON.loading;
  else if (connection === 'failed') reason = REASON.failed;

  return { blocked: reason !== null, reason };
}
