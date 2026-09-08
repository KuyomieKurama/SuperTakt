/** A-23: public facts only; private certificate keys never cross IPC. */
export type OutlookHttpsStatus = 'ready' | 'unreachable' | 'tls_failed' | 'certificate_mismatch' | 'page_missing' | 'certificate_invalid';

export interface OutlookCertificateFacts {
  readonly supported: true;
  readonly fingerprint: string;
  readonly subject: string;
  readonly issuer: string;
  readonly validFrom: string;
  readonly validUntil: string;
  readonly validProfile: boolean;
  readonly validNow: boolean;
  readonly installed: boolean;
  readonly https: OutlookHttpsStatus;
}

export type OutlookCertificateResult = OutlookCertificateFacts | { readonly supported: false };

export function parseOutlookCertificate(value: unknown): OutlookCertificateResult {
  if (typeof value !== 'object' || value === null) throw new Error('Die Zertifikatsantwort ist ungültig.');
  const row = value as Record<string, unknown>;
  if (row['supported'] === false) return { supported: false };
  const statuses: readonly unknown[] = ['ready', 'unreachable', 'tls_failed', 'certificate_mismatch', 'page_missing', 'certificate_invalid'];
  if (row['supported'] !== true || typeof row['fingerprint'] !== 'string' || !/^[A-F0-9]{64}$/.test(row['fingerprint']) ||
      typeof row['subject'] !== 'string' || typeof row['issuer'] !== 'string' ||
      typeof row['validFrom'] !== 'string' || !Number.isFinite(Date.parse(row['validFrom'])) ||
      typeof row['validUntil'] !== 'string' || !Number.isFinite(Date.parse(row['validUntil'])) ||
      typeof row['validProfile'] !== 'boolean' || typeof row['validNow'] !== 'boolean' ||
      typeof row['installed'] !== 'boolean' || !statuses.includes(row['https'])) {
    throw new Error('Die Zertifikatsantwort ist unvollständig oder ungültig.');
  }
  // Construct a fresh object so additional native fields are never forwarded.
  return {
    supported: true, fingerprint: row['fingerprint'], subject: row['subject'], issuer: row['issuer'],
    validFrom: row['validFrom'], validUntil: row['validUntil'], validProfile: row['validProfile'],
    validNow: row['validNow'], installed: row['installed'], https: row['https'] as OutlookHttpsStatus,
  };
}
