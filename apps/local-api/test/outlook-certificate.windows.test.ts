import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { createServer, type Server } from 'node:https';
import { createSelfSignedCertificate } from '../src/taskpane/certificate.ts';

const scriptUrl = new URL('../../desktop/src-tauri/src/outlook_certificate.ps1', import.meta.url);
const executable = join(process.env['SystemRoot'] ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

async function powershell(script: string, input: unknown): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];
    const timer = setTimeout(() => { child.kill(); reject(new Error('PowerShell timeout')); }, 25_000);
    child.stdout.on('data', (b: Buffer) => chunks.push(b));
    child.stderr.on('data', (b: Buffer) => errors.push(b));
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) { reject(new Error(Buffer.concat(errors).toString('utf8'))); return; }
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '')) as Record<string, unknown>); }
      catch (error) { reject(error); }
    });
    child.stdin.end(JSON.stringify(input));
  });
}

describe.skipIf(process.platform !== 'win32')('A-23: real Windows certificate helper', () => {
  let directory: string | null = null;
  let server: Server | null = null;
  let trustedThumbprint: string | null = null;
  afterEach(async () => {
    if (server !== null) { const active = server; server = null; await new Promise<void>((resolve) => active.close(() => resolve())); }
    if (trustedThumbprint !== null) {
      // Only the generated test certificate; never clear or enumerate-delete a store.
      await powershell(`
        $ErrorActionPreference = 'Stop'
        $id = [Console]::In.ReadToEnd() | ConvertFrom-Json
        if ($id -cnotmatch '^[A-F0-9]{40}$') { throw 'bad test thumbprint' }
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root', 'CurrentUser')
        try {
          $store.Open('ReadWrite')
          foreach ($cert in $store.Certificates) { if ($cert.Thumbprint -ceq $id) { $store.Remove($cert) } }
        } finally { $store.Close() }
        '{}'`, trustedThumbprint);
      trustedThumbprint = null;
    }
    if (directory !== null) { await rm(directory, { recursive: true, force: true }); directory = null; }
  });

  it('reads the real generated certificate, rejects stale approval, and validates HTTPS after explicit trust', async () => {
    // Trust-store mutation is limited to an explicitly enabled disposable CI runner.
    directory = await mkdtemp(join(tmpdir(), "supertakt-zertifikat-ä-'"));
    const path = join(directory, 'taskpane-cert.pem');
    const pair = createSelfSignedCertificate();
    await writeFile(path, pair.certPem);
    const cert = new X509Certificate(pair.certPem);
    const fingerprint = cert.fingerprint256.replaceAll(':', '');
    const script = await readFile(scriptUrl, 'utf8');
    server = createServer({ key: pair.keyPem, cert: pair.certPem }, (_req, res) => res.writeHead(200).end('test add-in'));
    await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(17844, '127.0.0.1', resolve); });
    expect(await powershell(script, { path, action: 'inspect' })).toMatchObject({ fingerprint, validNow: true, validProfile: true, installed: false, https: 'tls_failed' });
    expect(await powershell(script, { path, action: 'trust', fingerprint: '0'.repeat(64) })).toEqual({ error: 'certificate_changed' });
    expect(await powershell(script, { path, action: 'trust', fingerprint: '../anything' })).toEqual({ error: 'certificate_changed' });
    if (process.env['SUPERTAKT_TEST_CERT_TRUST'] !== '1') return;
    trustedThumbprint = cert.fingerprint.replaceAll(':', '');
    expect(await powershell(script, { path, action: 'trust', fingerprint })).toMatchObject({ installed: true, https: 'ready' });
    await writeFile(path, createSelfSignedCertificate().certPem);
    expect(await powershell(script, { path, action: 'trust', fingerprint })).toEqual({ error: 'certificate_changed' });
  }, 90_000);

  it('rejects expired and nonlocal certificates before trust can be added', async () => {
    directory = await mkdtemp(join(tmpdir(), 'supertakt-invalid-certificate-'));
    const path = join(directory, 'taskpane-cert.pem');
    const script = await readFile(scriptUrl, 'utf8');
    const expired = createSelfSignedCertificate(new Date('2020-01-01T00:00:00Z'));
    await writeFile(path, expired.certPem);
    expect(await powershell(script, { path, action: 'trust', fingerprint: new X509Certificate(expired.certPem).fingerprint256.replaceAll(':', '') })).toEqual({ error: 'certificate_invalid' });
    const certificate = new X509Certificate(createSelfSignedCertificate().certPem);
    // Replace only the SAN bytes with a different same-length host; trust must
    // reject the profile regardless of whether the signature can be validated.
    const der = Buffer.from(certificate.raw);
    const san = Buffer.from('301182096c6f63616c686f737487047f000001', 'hex');
    const offset = der.indexOf(san);
    expect(offset).toBeGreaterThan(0);
    Buffer.from('wronghost').copy(der, offset + 4);
    await writeFile(path, der);
    expect(await powershell(script, { path, action: 'trust', fingerprint: new X509Certificate(der).fingerprint256.replaceAll(':', '') })).toEqual({ error: 'certificate_invalid' });
  }, 60_000);
});
