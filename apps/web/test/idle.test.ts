import { describe, expect, it } from 'vitest';
import { idleCandidate, idleReturnTime } from '../src/lib/idle';
import { parseIdleDuration } from '../src/components/IdleRecovery';
import type { IdleActivity } from '@takt/desktop/shell';

const start = Date.parse('2026-09-08T08:00:00Z');
const sample = (overrides: Partial<IdleActivity> = {}): IdleActivity => ({ supported: true, sampledAtMs: start + 600_000, lastInputAtMs: start, periods: [], ...overrides });

describe('A-24: systemweite Zeitangaben statt Fensterfokus', () => {
  it('ignoriert aktive Eingaben in anderen Programmen', () => {
    expect(idleCandidate(sample({ lastInputAtMs: start + 599_000 }), '2026-09-08T08:00:00Z', 5)).toBeNull();
  });
  it('berücksichtigt die Schwelle und begrenzt die Zeit auf den Timerstart', () => {
    expect(idleCandidate(sample(), '2026-09-08T08:08:00Z', 5)).toBeNull();
    expect(idleCandidate(sample(), '2026-09-08T08:04:00Z', 5)).toEqual({ startedAt: '2026-09-08T08:04:00Z' });
  });
  it('findet eine Rückkehr auch nach gedrosseltem Webview und nimmt die erste Rückkehr', () => {
    const activity = sample({ lastInputAtMs: start + 599_000, periods: [{ startedAtMs: start, endedAtMs: start + 400_000 }] });
    expect(idleCandidate(activity, '2026-09-08T08:00:00Z', 5)).toEqual({ startedAt: '2026-09-08T08:00:00Z', returnedAt: '2026-09-08T08:06:40Z' });
    expect(idleReturnTime(activity, '2026-09-08T08:00:00Z')).toBe('2026-09-08T08:06:40Z');
    expect(idleCandidate(activity, '2026-09-08T08:07:00Z', 5)).toBeNull();
  });
  it('behauptet auf einer nicht unterstützten Plattform keine Inaktivität', () => {
    expect(idleCandidate(sample({ supported: false }), '2026-09-08T08:00:00Z', 5)).toBeNull();
  });
  it.each([['20', 1200], ['0:20', 1200], ['0:00:01', 1], ['1,5', 90], ['', null], ['1:60', null], ['-5', null], ['0', null]])('liest Dauer %s eindeutig', (input, expected) => {
    expect(parseIdleDuration(String(input))).toBe(expected);
  });
});
