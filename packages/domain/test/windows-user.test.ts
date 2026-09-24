/**
 * Takt — A-28.4, `userNameWithoutDomain` (T-397, `reports/T-397-domain-dev.md` next step 2).
 *
 * The export field `WindowsUser` carries the user name without domain. This is the pure rule the
 * handshake applies once (`apps/local-api`), so every reader of the value — settings, the export
 * file, the log — carries the same name regardless of what the shell sent.
 */
import { describe, expect, it } from 'vitest';
import { userNameWithoutDomain } from '../src/export.ts';

describe('userNameWithoutDomain (A-28.4)', () => {
  it('"DOM\\u" (downlevel-logon-name form) becomes "u"', () => {
    expect(userNameWithoutDomain('DOM\\u')).toBe('u');
  });

  it('"u@dom.example" (UPN form) becomes "u"', () => {
    expect(userNameWithoutDomain('u@dom.example')).toBe('u');
  });

  it('a bare name without any domain part stays unchanged', () => {
    expect(userNameWithoutDomain('u')).toBe('u');
  });

  it('"DOM\\" (nothing after the backslash) stays unchanged — an empty result would hide the input from the plausibility check at the handshake', () => {
    expect(userNameWithoutDomain('DOM\\')).toBe('DOM\\');
  });

  it('only the LAST backslash segment counts (a value with more than one backslash still resolves to the trailing name)', () => {
    expect(userNameWithoutDomain('FOREST\\DOM\\u')).toBe('u');
  });

  it('a UPN-looking value with no text before "@" behaves like "DOM\\": empty bare name stays unchanged', () => {
    expect(userNameWithoutDomain('@dom.example')).toBe('@dom.example');
  });
});
