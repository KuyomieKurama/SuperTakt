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


describe('cross-platform certificate stores', () => {
  it('keeps partial installation distinct from a successful TLS probe', () => {
    expect(parseOutlookCertificate({ ...facts, https: 'ready', trustScope: 'linux_nss', toolsAvailable: true,
      installFailed: true, trustStores: [{ kind: 'chromium', installed: true }, { kind: 'firefox', installed: false }] }))
      .toMatchObject({ installed: false, https: 'ready', installFailed: true, trustStores: [{ installed: true }, { installed: false }] });
  });
  it('accepts a macOS user keychain and strips extra store fields', () => {
    expect(parseOutlookCertificate({ ...facts, trustScope: 'macos_user', trustStores: [{ kind: 'macos', installed: true, extra: 'discard' }] }))
      .toMatchObject({ trustStores: [{ kind: 'macos', installed: true }] });
    const parsed = parseOutlookCertificate({ ...facts, trustStores: [{ kind: 'macos', installed: true, extra: 'discard' }] });
    if (!parsed.supported) throw new Error('Expected certificate facts');
    expect(parsed.trustStores?.[0]).toEqual({ kind: 'macos', installed: true });
  });
  it.each([{ trustScope: 'anywhere' }, { trustStores: [{ kind: 'arbitrary', installed: true }] }, { trustStores: [{ kind: 'chromium', installed: 'yes' }] }, { installFailed: 'no' }, { toolsAvailable: 1 }])('rejects malformed store metadata', extra => {
    expect(() => parseOutlookCertificate({ ...facts, ...extra })).toThrow();
  });
});
