/**
 * SuperTakt — Windows-Code-Signing für den Tauri-Bündler.
 *
 * Tauri ruft `bundle.windows.signCommand` für die zu signierenden PE-Dateien
 * auf. `build-app.mjs` schaltet diesen Befehl nur ein, wenn
 * TAKT_WINDOWS_SIGNING_PROVIDER gesetzt ist. Dadurch bleibt der lokale Bau
 * ohne Signiermaterial unverändert, während ein Release-Bau fail-closed
 * signieren kann.
 *
 * Unterstützte Anbieter:
 *
 *   pfx              exportierbares Authenticode-Zertifikat (.pfx)
 *   artifact-signing Azure Artifact Signing (ehem. Trusted Signing)
 *
 * Geheimnisse werden ausschließlich über Umgebungsvariablen gelesen und nie
 * ausgegeben. Die Domain supertakt.de ist dabei Identitäts-/Webauftritt, kein
 * Ersatz für ein Code-Signing-Zertifikat.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

function required(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${name} ist nicht gesetzt. Ohne diese Angabe wird nicht signiert.`);
  }
  return value.trim();
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    windowsHide: true,
  });
  if (result.error) {
    fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${command} ist mit Status ${result.status ?? 'unbekannt'} fehlgeschlagen.`);
  }
}

function findSignTool() {
  const explicit = process.env['TAURI_WINDOWS_SIGNTOOL_PATH'];
  if (typeof explicit === 'string' && explicit.trim() !== '') {
    if (!existsSync(explicit.trim())) {
      fail(`TAURI_WINDOWS_SIGNTOOL_PATH zeigt auf keine Datei: ${explicit.trim()}`);
    }
    return explicit.trim();
  }

  const where = spawnSync('where.exe', ['signtool.exe'], { encoding: 'utf8', windowsHide: true });
  if (where.status === 0) {
    const first = String(where.stdout)
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find(Boolean);
    if (first && existsSync(first)) {
      return first;
    }
  }

  const programFilesX86 = process.env['ProgramFiles(x86)'];
  if (typeof programFilesX86 === 'string' && programFilesX86.trim() !== '') {
    const bin = join(programFilesX86, 'Windows Kits', '10', 'bin');
    if (existsSync(bin)) {
      const versions = readdirSync(bin, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^\d+(?:\.\d+)+$/u.test(entry.name))
        .map((entry) => entry.name)
        .sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
      for (const version of versions) {
        const candidate = join(bin, version, 'x64', 'signtool.exe');
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }

  fail('signtool.exe wurde nicht gefunden. Auf dem Windows-Läufer muss das Windows SDK vorhanden sein.');
}

if (process.platform !== 'win32') {
  fail('Windows-Code-Signing wurde auf einer anderen Plattform aufgerufen.');
}

const target = process.argv[2];
if (typeof target !== 'string' || target.trim() === '') {
  fail('Tauri hat keine zu signierende Datei übergeben.');
}
if (!existsSync(target)) {
  fail(`Die zu signierende Datei gibt es nicht: ${target}`);
}

const provider = required('TAKT_WINDOWS_SIGNING_PROVIDER').toLowerCase();

if (provider === 'pfx') {
  const certificate = required('WINDOWS_CERTIFICATE_PATH');
  const password = required('WINDOWS_CERTIFICATE_PASSWORD');
  const timestampUrl = process.env['WINDOWS_TIMESTAMP_URL']?.trim() || 'http://timestamp.digicert.com';
  if (!existsSync(certificate)) {
    fail(`WINDOWS_CERTIFICATE_PATH zeigt auf keine Datei: ${certificate}`);
  }

  run(findSignTool(), [
    'sign',
    '/fd',
    'SHA256',
    '/td',
    'SHA256',
    '/tr',
    timestampUrl,
    '/f',
    certificate,
    '/p',
    password,
    target,
  ]);
} else if (provider === 'artifact-signing') {
  const endpoint = required('AZURE_ARTIFACT_SIGNING_ENDPOINT');
  const account = required('AZURE_ARTIFACT_SIGNING_ACCOUNT');
  const profile = required('AZURE_ARTIFACT_SIGNING_PROFILE');
  required('AZURE_CLIENT_ID');
  required('AZURE_CLIENT_SECRET');
  required('AZURE_TENANT_ID');

  run('artifact-signing-cli', [
    '-e',
    endpoint,
    '-a',
    account,
    '-c',
    profile,
    '-d',
    'SuperTakt',
    target,
  ]);
} else {
  fail(`Unbekannter TAKT_WINDOWS_SIGNING_PROVIDER: ${provider}. Erwartet: pfx oder artifact-signing.`);
}

process.stdout.write(`Signatur angebracht: ${target}\n`);
