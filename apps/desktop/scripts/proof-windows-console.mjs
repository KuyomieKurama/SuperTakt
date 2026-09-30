/**
 * Verifies that Windows subprocesses cannot allocate a console for the GUI parent.
 *
 * The check deliberately reads every Rust source file below src-tauri/src. A file
 * that contains a Windows cfg is a Windows path; each Command::new expression in
 * that file must set CREATE_NO_WINDOW before its terminating semicolon.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(here, '..');
const rustDir = join(desktopDir, 'src-tauri', 'src');
const CREATE_NO_WINDOW = 'creation_flags(0x08000000)';
const exceptions = [];

function readRustSources(dir = rustDir, prefix = '') {
  const sources = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      sources.push(...readRustSources(join(dir, entry.name), `${name}/`));
    } else if (entry.name.endsWith('.rs')) {
      sources.push({ name, text: readFileSync(join(dir, entry.name), 'utf8') });
    }
  }
  return sources;
}

function commandExpressions(text) {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return [...code.matchAll(/Command::new\([\s\S]*?;/g)].map((match) => match[0]);
}

const failures = [];
for (const source of readRustSources()) {
  const isWindowsPath = source.text.includes('cfg(windows)') || source.text.includes('#[cfg(target_os = "windows")]');
  if (!isWindowsPath) continue;

  for (const expression of commandExpressions(source.text)) {
    if (!expression.includes(CREATE_NO_WINDOW) && !exceptions.includes(source.name)) {
      failures.push(source.name);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Windows Command::new without ${CREATE_NO_WINDOW}: ${[...new Set(failures)].join(', ')}`);
}

console.log('proof:windows-console passed');
