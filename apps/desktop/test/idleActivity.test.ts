import { expect, it } from 'vitest';
import { parseIdleActivity } from '../src/idleActivity';

it('A-24: validiert den nativen Verlauf und verwirft nicht benötigte Daten', () => {
  const raw = { supported: true, sampledAtMs: 900000, lastInputAtMs: 899000, periods: [{ startedAtMs: 100000, endedAtMs: 800000 }], extra: 'ignored' };
  expect(parseIdleActivity(raw)).toEqual({ supported: true, sampledAtMs: 900000, lastInputAtMs: 899000, periods: raw.periods });
  for (const patch of [{ lastInputAtMs: 900001 }, { sampledAtMs: -1 }, { supported: 'yes' }, { periods: [{ startedAtMs: 50, endedAtMs: 40 }] }, { periods: [{ startedAtMs: 50, endedAtMs: 900001 }] }]) {
    expect(() => parseIdleActivity({ ...raw, ...patch })).toThrow();
  }
});
