/** Implausible call numbers never trigger a lookup; the service checks the same rule again.
 * The offer names the existing todo and shows no booked time: the add-in offers no time tracking (A-10.16, E-120). */

import { checkCallNumber, type CallNumberRejection } from '@takt/domain';
import type { TodoMatchDto } from '../api/types.ts';

export type LookupDecision =
  | { readonly kind: 'lookup'; readonly callNumber: string }
  | { readonly kind: 'skip'; readonly reason: CallNumberRejection };

/**
 * Darf mit diesem Wert nach einem vorhandenen Todo gefragt werden?
 *
 * Der Aufrufer darf das Ergebnis **nicht** umgehen. Es gibt im Add-in keinen
 * zweiten Weg zu `findMatches`.
 */
export const decideLookup = (callNumber: unknown): LookupDecision => {
  const checked = checkCallNumber(callNumber);
  return checked.ok
    ? { kind: 'lookup', callNumber: checked.value }
    : { kind: 'skip', reason: checked.reason };
};

export interface OfferDescription {
  readonly todoId: string;
  readonly title: string;
  readonly callNumber: string;
  readonly isDone: boolean;
}

/** A match without a plausible call number is dropped here instead of showing up as empty text (R-15). */
export const describeOffer = (match: TodoMatchDto): OfferDescription | null => {
  const checked = checkCallNumber(match.callNumber);
  if (!checked.ok) return null;

  return {
    todoId: match.id,
    title: match.title,
    callNumber: checked.value,
    isDone: match.completedAt !== null,
  };
};

/** No ranking and no preselection among several matches: A-10.11 requires the user's choice. */
export const describeOffers = (matches: readonly TodoMatchDto[]): readonly OfferDescription[] =>
  matches.map(describeOffer).filter((offer): offer is OfferDescription => offer !== null);

// `offerMovement` (until T-104) and the offer's `poolMovement` (until T-389) are gone: the add-in announces no booking (E-120).
