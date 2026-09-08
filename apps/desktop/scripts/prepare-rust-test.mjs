/**
 * Bereitet die von tauri-build verlangten Bündelpfade für `cargo test` vor.
 *
 * `tauri-build` wertet `externalBin` und `resources` bereits beim Übersetzen
 * der Bibliothek aus. Ein sauberer Checkout enthält diese Erzeugnisse mit
 * Absicht nicht; sie sind ignoriert und entstehen erst beim Anwendungsbau.
 * Die Rust-Prüffälle bündeln oder starten sie jedoch nicht. Deshalb genügen
 * leere Platzhalter, damit die Testübersetzung nicht vom Zustand eines zuvor
 * ausgeführten Baus abhängt.
 *
 * Vorhandene echte Bauergebnisse werden niemals geleert oder überschrieben.
 */

import { spawnSync } from 'node:child_process';
import { closeSync, mkdirSync, openSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tauriDir = resolve(here, '..', 'src-tauri');

function fail(message) {
  process.stderr.write(`FEHLER: ${message}\n`);
  process.exit(1);
}

function targetTriple() {
  const result = spawnSync('rustc', ['-vV'], { encoding: 'utf8' });
  if (result.status !== 0) {
    fail('`rustc -vV` ist fehlgeschlagen. Das Ziel-Tripel ist nicht bestimmbar.');
  }

  const host = String(result.stdout)
    .split(/\r?\n/u)
    .find((line) => line.startsWith('host:'))
    ?.slice('host:'.length)
    .trim();

  if (!host) {
    fail('`rustc -vV` nennt kein `host:`. Das Ziel-Tripel ist nicht bestimmbar.');
  }
  return host;
}

function ensurePlaceholder(path) {
  mkdirSync(dirname(path), { recursive: true });
  closeSync(openSync(path, 'a'));
}

const executableSuffix = process.platform === 'win32' ? '.exe' : '';
const placeholders = [
  join(tauriDir, 'binaries', `takt-local-api-${targetTriple()}${executableSuffix}`),
  join(tauriDir, 'taskpane', 'index.html'),
  join(tauriDir, 'licenses', 'LICENSE.txt'),
];

for (const path of placeholders) {
  ensurePlaceholder(path);
}

process.stdout.write('Tauri-Ressourcen für die Rust-Testübersetzung sind vorhanden.\n');
