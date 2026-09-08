import { describe, expect, it } from 'vitest';
import { parseOutlookCertificate } from '../src/outlookCertificate.ts';

const facts = {
  supported: true, fingerprint: 'AB12'.repeat(16), subject: 'CN=localhost', issuer: 'CN=localhost',
  validFrom: '2026-01-01T00:00:00Z', validUntil: '2027-01-01T00:00:00Z',
  validProfile: true, validNow: true, installed: false, https: 'tls_failed',
};

describe('A-23: native certificate facts', () => {
  it('keeps installed and verified HTTPS distinct', () => {
    expect(parseOutlookCertificate({ ...facts, installed: true })).toMatchObject({ installed: true, https: 'tls_failed' });
    expect(parseOutlookCertificate({ ...facts, https: 'ready' })).toMatchObject({ installed: false, https: 'ready' });
  });
  it('does not forward unexpected native fields', () => {
    expect(parseOutlookCertificate({ ...facts, extra: 'not part of the contract' })).toEqual(facts);
  });
  it.each([null, {}, { ...facts, fingerprint: '../file' }, { ...facts, installed: 'yes' }, { ...facts, https: 'unknown' }, { ...facts, validUntil: 'yesterday' }])('rejects malformed answers', (value) => {
    expect(() => parseOutlookCertificate(value)).toThrow();
  });
  it('represents unsupported platforms honestly', () => {
    expect(parseOutlookCertificate({ supported: false })).toEqual({ supported: false });
  });
});
