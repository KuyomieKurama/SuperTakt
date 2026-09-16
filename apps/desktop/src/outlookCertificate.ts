/** A-23: public facts only; private certificate keys never cross IPC. */
export type OutlookHttpsStatus = 'ready' | 'unreachable' | 'tls_failed' | 'certificate_mismatch' | 'page_missing' | 'certificate_invalid';

export type OutlookTrustScope = 'windows_user' | 'linux_nss' | 'macos_user';
export interface OutlookTrustStore {
  readonly kind: 'chromium' | 'firefox' | 'macos';
  readonly installed: boolean;
}

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
  readonly trustScope?: OutlookTrustScope;
  readonly trustStores?: readonly OutlookTrustStore[];
  readonly installFailed?: boolean;
  readonly toolsAvailable?: boolean;
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
  if ((row['trustScope'] !== undefined && !['windows_user', 'linux_nss', 'macos_user'].includes(String(row['trustScope']))) ||
      (row['installFailed'] !== undefined && typeof row['installFailed'] !== 'boolean') ||
      (row['toolsAvailable'] !== undefined && typeof row['toolsAvailable'] !== 'boolean') ||
      (row['trustStores'] !== undefined && (!Array.isArray(row['trustStores']) || row['trustStores'].length > 64 || row['trustStores'].some(store =>
        typeof store !== 'object' || store === null || !['chromium', 'firefox', 'macos'].includes(store.kind) || typeof store.installed !== 'boolean')))) {
    throw new Error('Die Zertifikatsspeicher-Antwort ist ungültig.');
  }
  // Zusätzliche native Felder dürfen nicht weitergereicht werden.
  return {
    supported: true, fingerprint: row['fingerprint'], subject: row['subject'], issuer: row['issuer'],
    validFrom: row['validFrom'], validUntil: row['validUntil'], validProfile: row['validProfile'],
    validNow: row['validNow'], installed: row['installed'], https: row['https'] as OutlookHttpsStatus,
    ...(row['trustScope'] === undefined ? {} : { trustScope: row['trustScope'] as OutlookTrustScope }),
    ...(row['trustStores'] === undefined ? {} : { trustStores: (row['trustStores'] as OutlookTrustStore[]).map(store => ({ kind: store.kind, installed: store.installed })) }),
    ...(row['installFailed'] === undefined ? {} : { installFailed: row['installFailed'] as boolean }),
    ...(row['toolsAvailable'] === undefined ? {} : { toolsAvailable: row['toolsAvailable'] as boolean }),
  };
}
