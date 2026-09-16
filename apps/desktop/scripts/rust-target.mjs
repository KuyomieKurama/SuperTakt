import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(appDir, '../..');

export function cargoTargetDir() {
  const fromEnv = process.env['CARGO_TARGET_DIR'];
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return resolve(repoRoot, fromEnv.trim());
  }
  return join(appDir, 'src-tauri', 'target');
}

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

// Rusts Host-Tripel bestimmt die Plattform für Lizenzliste und Release-Artefakte.
export function targetTriple() {
  const result = spawnSync('rustc', ['-vV'], { encoding: 'utf8' });
  if (result.status !== 0) {
    fail('`rustc -vV` ist fehlgeschlagen. Ohne die Rust-Toolchain gibt es kein Ziel-Tripel.');
  }
  const line = String(result.stdout)
    .split('\n')
    .find((entry) => entry.startsWith('host:'));
  if (line === undefined) {
    fail('`rustc -vV` nennt kein `host:`.');
  }
  return line.slice('host:'.length).trim();
}
