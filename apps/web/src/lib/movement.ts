import type { PoolMovement } from "../api/types";
import { quotedName } from "./foreign";
import { formatList } from "./format";
import { labels } from "./labels";

/*
  The pool movement sentence of the main UI, composed from text keys in the UI
  language (E-124 F-1). The add-in keeps the German sentence from
  `poolMovementSentence` in @takt/domain; the German keys here are worded
  identically, and `test/lib/movement.test.ts` compares both.

  Which occasion belongs to which action (E-058, E-060):
  - timer start that lifts "done", DELETE /todos/{id}/done: "reopen" (the todo returns, A-2.5)
  - timer start without lifting, stop, orphaned entry, POST /time-entries,
    PUT /todos/{id}/done: "booking" (no return; neutral wording)
*/

function names(list: readonly string[]): string {
  return formatList(list.map((name) => quotedName(name)));
}

/**
 * The sentence for a movement, or `null` when there is none: either the service
 * computed nothing (`movement === null`) or a booking changed no pool.
 */
export function movementSentence(
  movement: PoolMovement | null,
  occasion: "reopen" | "booking",
): string | null {
  if (movement === null) return null;
  const words = labels().poolMovement;
  const { appears, enters, leaves } = movement;

  if (occasion === "reopen") {
    if (appears.length === 0 && leaves.length === 0) return words.reopenNowhere;
    if (appears.length === 0) return words.reopenOnlyLeft(names(leaves));
    if (leaves.length === 0) return words.reopenBack(names(appears));
    return words.reopenBackAndLeft(names(appears), names(leaves));
  }

  if (enters.length === 0 && leaves.length === 0) return null;
  if (leaves.length === 0) return words.entered(names(enters));
  if (enters.length === 0) return words.left(names(leaves));
  return words.enteredAndLeft(names(enters), names(leaves));
}

/** The sentence after setting (`cleared: false`) or lifting (`cleared: true`) "done" (E-060 point 4). */
export function doneMovementSentence(
  movement: PoolMovement | null,
  cleared: boolean,
): string | null {
  return movementSentence(movement, cleared ? "reopen" : "booking");
}

/** The sentence for a booking: stop, orphaned entry and manual entry (E-058 point 6, O-V). */
export function bookingSentence(movement: PoolMovement | null): string | null {
  return movementSentence(movement, "booking");
}

/** Appends the movement sentence to a body with one space, or leaves it out. */
export function withMovement(body: string, sentence: string | null): string {
  return sentence === null ? body : `${body} ${sentence}`;
}
