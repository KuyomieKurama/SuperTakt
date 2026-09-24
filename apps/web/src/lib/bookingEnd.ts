import { MAX_TIME_ENTRY_SECONDS, exceedsMaximumSeconds } from "@takt/domain";

/**
 * The end of a booking, checked before it is sent (A-28.6, welle-18-fluss.md 4.2 and 4.4).
 *
 * The service stays the authority and refuses the same cases; this check only lets the
 * field say what is wrong before a round trip. The 24-hour limit comes from the domain.
 */
export type BookingEndProblem = "missing" | "before_start" | "over_24h" | "future";

function secondsFromTo(startedAt: string, endedAt: string): number {
  return Math.floor((Date.parse(endedAt) - Date.parse(startedAt)) / 1000);
}

/** `checkFuture`: the timer stop may not end after now; a manual booking may. */
export function bookingEndProblem(
  startedAt: string,
  endedAt: string | null,
  checkFuture: boolean,
): BookingEndProblem | null {
  if (endedAt === null || Number.isNaN(Date.parse(endedAt))) return "missing";
  const seconds = secondsFromTo(startedAt, endedAt);
  if (seconds <= 0) return "before_start";
  if (exceedsMaximumSeconds(seconds)) return "over_24h";
  if (checkFuture && Date.parse(endedAt) > Date.now()) return "future";
  return null;
}

/** Has a running timer passed the 24-hour limit? Exactly 24 hours is still allowed. */
export function exceedsBookingLimit(elapsedSeconds: number): boolean {
  return exceedsMaximumSeconds(elapsedSeconds);
}

/** The latest allowed end: start plus 24 hours, the default of the end question (A-28.6). */
export function latestBookingEnd(startedAt: string): string {
  return new Date(Date.parse(startedAt) + MAX_TIME_ENTRY_SECONDS * 1000).toISOString();
}

/** Seconds that would be booked between start and end, for the read-out under the field. */
export function secondsToBook(startedAt: string, endedAt: string | null): number | null {
  if (endedAt === null || Number.isNaN(Date.parse(endedAt))) return null;
  const seconds = secondsFromTo(startedAt, endedAt);
  return seconds > 0 ? seconds : null;
}
