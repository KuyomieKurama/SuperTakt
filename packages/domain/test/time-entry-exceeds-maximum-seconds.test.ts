/**
 * Takt — `exceedsMaximumSeconds` (T-412, E-132 point 5): the 24-hour booking cap now lives only
 * in the domain; `idle.ts` calls this function instead of repeating the comparison.
 */
import { describe, expect, it } from 'vitest';
import { exceedsMaximumSeconds, MAX_TIME_ENTRY_SECONDS } from '../src/time-entry.ts';

describe('exceedsMaximumSeconds — the 24-hour boundary (A-28.6)', () => {
  it('MAX_TIME_ENTRY_SECONDS is exactly 24 hours in seconds', () => {
    expect(MAX_TIME_ENTRY_SECONDS).toBe(86_400);
  });

  it('exactly 86400 seconds does not exceed the cap', () => {
    expect(exceedsMaximumSeconds(86_400)).toBe(false);
  });

  it('86401 seconds — one second over — exceeds the cap', () => {
    expect(exceedsMaximumSeconds(86_401)).toBe(true);
  });

  it('a duration far below the cap does not exceed it', () => {
    expect(exceedsMaximumSeconds(1_800)).toBe(false);
  });

  it('zero seconds does not exceed the cap', () => {
    expect(exceedsMaximumSeconds(0)).toBe(false);
  });

  it('NaN answers false — an unreadable duration must not be treated as too long', () => {
    expect(exceedsMaximumSeconds(NaN)).toBe(false);
  });

  it('Infinity answers false, for the same reason as NaN', () => {
    expect(exceedsMaximumSeconds(Infinity)).toBe(false);
  });

  it('-Infinity answers false as well', () => {
    expect(exceedsMaximumSeconds(-Infinity)).toBe(false);
  });
});
