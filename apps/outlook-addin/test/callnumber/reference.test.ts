import { describe, expect, it } from 'vitest';
import { baseCallNumber, emailType } from '@takt/domain';
import { detectCallNumber } from '../../src/callnumber/detect.ts';
import { resolveTheme } from '../../src/settings/theme.ts';
import { runPattern } from '../../src/callnumber/run.ts';

describe('reference behavior', () => {
  it.each([
    ['CALL24470', '24470'], ['24470CALL', '24470'], ['AW: Call #24470 Rückfrage', '24470'],
    ['Vorgang 123456', '123456'], ['INC6526796', null], ['Rückfrage ohne Nummer', null], ['12345 Call24470', '24470'],
  ])('baseline %s', (subject, expected) => expect(baseCallNumber(subject)).toBe(expected));
  it('falls back for empty, invalid and unmatched custom patterns', async () => {
    for (const pattern of ['', '(', 'CUSTOM(\\d+)']) {
      const result = await detectCallNumber(pattern, { subject: 'CALL24470', body: '' }, async () => ({ kind: 'no_match' }));
      expect(result).toMatchObject({ kind: 'match', value: '24470' });
      if (pattern === '(') expect(result).toHaveProperty('warning');
    }
  });
  it('accepts complete matches without groups in the isolated evaluator', () => {
    expect(runPattern({ id: 1, source: '\\d{5}', text: '24470' })).toMatchObject({ kind: 'match', group: '24470' });
  });
  it('preserves worker timeout and unavailable errors', async () => {
    expect(await detectCallNumber('(\\d+)', { subject: '24470', body: '' }, async () => ({ kind: 'timeout' }))).toEqual({ kind: 'timeout' });
  });
  it.each(['AW:', 'RE:'])('recognizes replies %s', prefix => expect(emailType(`${prefix} abc`)).toBe('Antwort'));
  it.each(['WG:', 'WL:', 'FW:', 'Fwd:'])('recognizes forwards %s', prefix => expect(emailType(`${prefix} abc`)).toBe('Weiterleitung'));
  it('resolves manual, Outlook and operating system themes in priority order', () => {
    expect(resolveTheme('light', '#000000', true)).toBe('light');
    expect(resolveTheme('auto', '#ffffff', true)).toBe('light');
    expect(resolveTheme('auto', undefined, true)).toBe('dark');
  });
});
