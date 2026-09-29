/**
 * SuperTakt — parity between the domain and the shell where one rule is written
 * in two languages (E-085, E-086; board items O-FL and O-GA).
 *
 * Call:  node apps/desktop/scripts/proof-shell-parity.mjs
 *
 * Two rules exist twice:
 *
 *  1. Attachment paths: `checkAttachmentPath` in `packages/domain` (the door)
 *     against `check_file` in `src-tauri/src/attachment.rs` (the last check
 *     before opening).
 *  2. Release versions: `checkVersion` with `VERSION_SHAPE` and
 *     `VERSION_MAX_LENGTH` against `is_release_version` and `MAX_VERSION_LEN`
 *     in `src-tauri/src/release.rs`.
 *
 * The case table belongs to this run, and every string goes through **both**
 * sides (E-086 point 1). The Rust side is not read as text: the pure functions
 * are cut out of the source, compiled with `rustc` into a small harness and
 * executed. Without `rustc` the run refuses with a reason instead of passing
 * (E-121 point 10).
 *
 * What counts as a failure:
 *
 *  - Attachments (E-085 point 2): a path the domain accepts and the shell
 *    rejects is an error — the user stores something that later cannot be
 *    opened, the T-179 class. A path the domain rejects and the shell would
 *    accept is a note. Both rejecting with different keys is a note.
 *    `path_missing` is a file-system answer the domain cannot give; it counts
 *    as "shape accepted".
 *  - Versions (E-086 point 2): any difference is an error, and so is a
 *    difference between `VERSION_MAX_LENGTH` and `MAX_VERSION_LEN` (point 4).
 *
 * Host dependence: the shell judges paths with the host's `std::path`. Posix
 * forms are only comparable on a posix host, drive-letter forms only on
 * Windows; such cases carry `host` and are skipped elsewhere (counted in the
 * output, not hidden).
 *
 * Counter-proofs (E-085 point 4, E-086 point 3): one inserted deviation on the
 * domain side and one in the Rust source for each rule must turn the run red.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRequiredFile } from '../../../scripts/source-anchors.mjs';
import { VERSION_MAX_LENGTH, checkAttachmentPath, checkVersion } from '../../../packages/domain/src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const rustSrcDir = resolve(here, '..', 'src-tauri', 'src');
const attachmentRust = readRequiredFile(
  join(rustSrcDir, 'attachment.rs'),
  'die Pfadprüfung der Hülle (`check_file`)',
);
const releaseRust = readRequiredFile(
  join(rustSrcDir, 'release.rs'),
  'die Fassungsprüfung der Hülle (`is_release_version`)',
);

const HOST = process.platform === 'win32' ? 'windows' : 'posix';

/* Rust: cut out, compile, run                                            */

/**
 * The index just past the brace that closes the one opened at `openIndex`.
 * Skips comments, string literals and char literals so that a `'{'` or a
 * `"}"` does not count.
 */
function matchingBraceEnd(source, openIndex) {
  let depth = 0;
  let i = openIndex;
  while (i < source.length) {
    const character = source[i];
    const next = source[i + 1];
    if (character === '/' && next === '/') {
      i = source.indexOf('\n', i);
      if (i === -1) return -1;
      continue;
    }
    if (character === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) return -1;
      i = end + 2;
      continue;
    }
    if (character === '"') {
      i += 1;
      while (i < source.length && source[i] !== '"') i += source[i] === '\\' ? 2 : 1;
      i += 1;
      continue;
    }
    if (character === "'") {
      // `'\n'`, `'x'`, or a lifetime `'a` (no closing quote two places on).
      if (next === '\\') {
        i = source.indexOf("'", i + 2) + 1;
      } else if (source[i + 2] === "'") {
        i += 3;
      } else {
        i += 1;
      }
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return -1;
}

/**
 * One top-level item (`fn`, `enum`, `impl`, `const`), found by the text that
 * starts it, including the attribute lines directly above it.
 */
function extractRustItem(source, fileName, head) {
  const at = source.indexOf(head);
  if (at === -1 || source.indexOf(head, at + 1) !== -1) {
    throw new Error(`${fileName}: \`${head}\` steht nicht genau einmal da — der Zuschnitt für den Prüfrahmen trägt nicht.`);
  }
  let start = source.lastIndexOf('\n', at) + 1;
  // Keep `#[derive(..)]` and similar attributes that belong to the item.
  for (;;) {
    const previousEnd = start - 1;
    if (previousEnd <= 0) break;
    const previousStart = source.lastIndexOf('\n', previousEnd - 1) + 1;
    if (!source.slice(previousStart, previousEnd).trimStart().startsWith('#[')) break;
    start = previousStart;
  }
  if (head.startsWith('const ') || head.startsWith('pub const ')) {
    // The value ends at the first `;` after `=` — the type may carry one (`[&str; 5]`).
    const end = source.indexOf(';', source.indexOf('=', at));
    return source.slice(start, end + 1);
  }
  const open = source.indexOf('{', at);
  const end = matchingBraceEnd(source, open);
  if (end === -1) throw new Error(`${fileName}: das Ende von \`${head}\` ist nicht zu finden.`);
  return source.slice(start, end);
}

/** The Rust items each side needs. The heads are the contract with the source files. */
const ATTACHMENT_ITEMS = [
  'const MAX_PATH_LEN',
  'const INDIRECT_EXTENSIONS',
  'pub enum Rejection',
  'impl Rejection',
  'fn effective_file_name(',
  'fn has_stream_separator(',
  'fn has_indirect_extension(',
  'fn is_unc(',
  'fn is_forbidden_path_character(',
  'pub fn check_file(',
];
const RELEASE_ITEMS = [
  'const MAX_VERSION_LEN',
  'const MAX_NUMBER_LEN',
  'const MAX_PRERELEASE_LEN',
  'pub fn is_release_version(',
];

function harnessSource(attachmentText, releaseText) {
  const items = [
    ...ATTACHMENT_ITEMS.map((head) => extractRustItem(attachmentText, 'attachment.rs', head)),
    ...RELEASE_ITEMS.map((head) => extractRustItem(releaseText, 'release.rs', head)),
  ];
  return `#![allow(dead_code)]
use std::io::{self, BufRead, Write};
use std::path::{Component, Path, Prefix};

${items.join('\n\n')}

fn decode(hex: &str) -> String {
    let bytes: Vec<u8> = (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).expect("hex"))
        .collect();
    String::from_utf8(bytes).expect("utf-8")
}

fn main() {
    let mode = std::env::args().nth(1).expect("mode");
    let stdin = io::stdin();
    let mut out = io::stdout().lock();
    if mode == "version" {
        writeln!(out, "{}", MAX_VERSION_LEN).unwrap();
    }
    for line in stdin.lock().lines() {
        let value = decode(&line.unwrap());
        let verdict = if mode == "version" {
            is_release_version(&value).to_string()
        } else {
            match check_file(&value) {
                Ok(_) => "ok".to_string(),
                Err(rejection) => rejection.key().to_string(),
            }
        };
        writeln!(out, "{}", verdict).unwrap();
    }
}
`;
}

/**
 * Compiles the harness once. Returns a function that runs one mode over a
 * list of strings, or throws with the compiler's reason.
 */
function buildHarness(scratch, name, source) {
  const sourceFile = join(scratch, `${name}.rs`);
  const binary = join(scratch, process.platform === 'win32' ? `${name}.exe` : name);
  writeFileSync(sourceFile, source, 'utf8');
  const compiled = spawnSync('rustc', ['--edition', '2021', '-o', binary, sourceFile], { encoding: 'utf8' });
  if (compiled.error !== undefined) {
    throw new Error(`rustc ist nicht aufrufbar (${compiled.error.message}). Ohne die Hülle gibt es keinen Vergleich.`);
  }
  if (compiled.status !== 0) {
    throw new Error(`Der Prüfrahmen übersetzt nicht:\n${compiled.stderr}`);
  }
  return (mode, values) => {
    const input = values.map((value) => Buffer.from(value, 'utf8').toString('hex')).join('\n');
    const ran = spawnSync(binary, [mode], { input: `${input}\n`, encoding: 'utf8' });
    if (ran.status !== 0) throw new Error(`Der Prüfrahmen bricht ab:\n${ran.stderr}`);
    return ran.stdout.split('\n').filter((line) => line !== '');
  };
}

/* The case tables — owned by this run                                    */

const LONG_NAME = 'a'.repeat(4_095);

/** `host`: only comparable on that host (see file head). */
const PATH_CASES = [
  { value: '' },
  { value: '   ' },
  { value: 'relativ/datei.txt' },
  { value: '/home/nutzer/bericht.pdf', host: 'posix' },
  { value: '/home/nutzer/programm.exe', host: 'posix' },
  { value: '/home/nutzer/.lnk', host: 'posix' },
  { value: '/home/nutzer/rechnung.lnk.', host: 'posix' },
  { value: '/home/nutzer/rechnung.lnk ', host: 'posix' },
  { value: '/home/nutzer/RECHNUNG.LNK', host: 'posix' },
  { value: '/home/nutzer/verweis.url', host: 'posix' },
  { value: '/home/nutzer/alt.pif', host: 'posix' },
  { value: '/home/nutzer/explorer.scf', host: 'posix' },
  { value: '/home/nutzer/start.desktop', host: 'posix' },
  { value: '/home/nutzer/...', host: 'posix' },
  { value: '/home/nutzer/a\\b.lnk', host: 'posix' },
  { value: '/home/nutzer/bericht.txt:evil.lnk', host: 'posix' },
  { value: '/home/nutzer/datei::$DATA', host: 'posix' },
  { value: '/home/nutzer/zeile\numbruch.txt', host: 'posix' },
  { value: '/home/nutzer/tab\tdatei.txt', host: 'posix' },
  { value: '/home/nutzer/rechnung\u202efdp.exe', host: 'posix' },
  { value: `/${LONG_NAME}`, host: 'posix' },
  { value: `/${LONG_NAME}a` },
  { value: '//server/freigabe/datei.pdf' },
  { value: '\\\\server\\freigabe\\datei.pdf' },
  { value: '\\\\?\\C:\\Daten\\datei.pdf' },
  { value: '\\temp\\datei.pdf' },
  { value: 'C:\\Users\\nutzer\\bericht.pdf', host: 'windows' },
  { value: 'C:/Users/nutzer/bericht.pdf', host: 'windows' },
  { value: 'C:\\Users\\nutzer\\rechnung.lnk.', host: 'windows' },
  { value: 'C:\\Users\\nutzer\\bericht.txt:evil.lnk', host: 'windows' },
  { value: 'C:datei.pdf' },
];

const NINE = '999999999';
const VERSION_CASES = [
  '',
  '1',
  '1.2',
  '1.2.3',
  '0.0.0',
  '01.02.03',
  '1.2.3.4',
  '1..3',
  '.1.2.3',
  '-1.2.3',
  '1.2.3-',
  '1.2.3-rc.1',
  '1.2.3-rc-1',
  '1.2.3-rc_1',
  '1.2.3-rc+1',
  '1.2.3+build',
  '1.2.3 ',
  ' 1.2.3',
  '1.2.3\n',
  '1.2.3-ä',
  '١.٢.٣',
  'v1.2.3',
  'V1.2.3',
  'vv1.2.3',
  `${NINE}.2.3`,
  '1234567890.2.3',
  '1.1234567890.3',
  '1.2.1234567890',
  `1.2.3-${'a'.repeat(64)}`,
  `1.2.3-${'a'.repeat(65)}`,
  `${NINE}.${NINE}.${NINE}-${'a'.repeat(64)}`,
  `${NINE}.${NINE}.${NINE}-${'a'.repeat(65)}`,
];

/* Comparisons                                                            */

function domainPathVerdict(value) {
  const checked = checkAttachmentPath(value);
  return checked.ok ? 'ok' : checked.reason;
}

/**
 * @returns {{ errors: string[], notes: string[], skipped: number }}
 */
function comparePaths(runShell, domainVerdict) {
  const cases = PATH_CASES.filter((entry) => entry.host === undefined || entry.host === HOST);
  const shellVerdicts = runShell('path', cases.map((entry) => entry.value));
  const errors = [];
  const notes = [];
  cases.forEach((entry, index) => {
    const domain = domainVerdict(entry.value);
    const raw = shellVerdicts[index];
    const shell = raw === 'path_missing' ? 'ok' : raw;
    if (domain === shell) return;
    const line = `${JSON.stringify(entry.value).slice(0, 80)}: Domäne ${domain}, Hülle ${raw}`;
    if (domain === 'ok') errors.push(`${line} — die Tür nimmt an, was die Hülle nie öffnet`);
    else notes.push(line);
  });
  return { errors, notes, skipped: PATH_CASES.length - cases.length };
}

/** What the domain hands to the shell: its verdict, and the value without `v`. */
function domainVersionVerdict(value) {
  const checked = checkVersion(value);
  if (checked.ok) return { ok: true, handed: checked.version.value };
  return { ok: false, handed: value.startsWith('v') ? value.slice(1) : value };
}

function compareVersions(runShell, domainVerdict) {
  const domain = VERSION_CASES.map(domainVerdict);
  const [shellMax, ...shellVerdicts] = runShell('version', domain.map((entry) => entry.handed));
  const errors = [];
  if (Number(shellMax) !== VERSION_MAX_LENGTH) {
    errors.push(`VERSION_MAX_LENGTH ist ${String(VERSION_MAX_LENGTH)}, MAX_VERSION_LEN ist ${shellMax}`);
  }
  VERSION_CASES.forEach((value, index) => {
    const shell = shellVerdicts[index] === 'true';
    if (domain[index].ok === shell) return;
    errors.push(
      `${JSON.stringify(value).slice(0, 80)}: Domäne ${domain[index].ok ? 'nimmt an' : 'weist ab'}, ` +
        `Hülle ${shell ? 'nimmt an' : 'weist ab'}`,
    );
  });
  return { errors };
}

/* The run                                                                */

let failed = 0;
const report = (title, errors, notes = []) => {
  process.stdout.write(`  ${errors.length === 0 ? 'ok  ' : 'FEHL'}  ${title}\n`);
  for (const error of errors) process.stdout.write(`        ${error}\n`);
  for (const note of notes) process.stdout.write(`        Hinweis: ${note}\n`);
  if (errors.length > 0) failed += 1;
};

const scratch = mkdtempSync(join(tmpdir(), 'takt-shell-parity-'));
try {
  let runShell;
  let runMutatedShell;
  try {
    runShell = buildHarness(scratch, 'parity', harnessSource(attachmentRust, releaseRust));
    // Rust-side deviations: `pdf` becomes a redirect, `-` leaves the prerelease alphabet, 94 becomes 93.
    const mutatedAttachment = attachmentRust.replace('["lnk", "url", "pif", "scf", "desktop"]', '["lnk", "url", "pif", "scf", "desktop", "pdf"]').replace('[&str; 5]', '[&str; 6]');
    const mutatedRelease = releaseRust
      .replace("|| byte == b'-')", ')')
      .replace('const MAX_VERSION_LEN: usize = 94;', 'const MAX_VERSION_LEN: usize = 93;');
    if (mutatedAttachment === attachmentRust || mutatedRelease === releaseRust) {
      throw new Error('Die Gegenprobe greift nicht mehr in den Rust-Quelltext — ihre Anker haben sich geändert.');
    }
    runMutatedShell = buildHarness(scratch, 'parity-mutated', harnessSource(mutatedAttachment, mutatedRelease));
  } catch (cause) {
    process.stdout.write(`  FEHL  Der Lauf verweigert das Urteil: ${cause.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`\nAnhänge — checkAttachmentPath gegen check_file (E-085), Wirt: ${HOST}\n`);
  const paths = comparePaths(runShell, domainPathVerdict);
  report(
    `${String(PATH_CASES.length - paths.skipped)} Pfade durch beide Seiten, ${String(paths.skipped)} nur auf dem anderen Wirt vergleichbar`,
    paths.errors,
    paths.notes,
  );

  process.stdout.write('\nFassung — checkVersion gegen is_release_version (E-086)\n');
  const versions = compareVersions(runShell, domainVersionVerdict);
  report(`${String(VERSION_CASES.length)} Bezeichnungen durch beide Seiten, dazu die Schranke`, versions.errors);

  process.stdout.write('\nGegenprobe — jede eingesetzte Abweichung muss auffallen\n');
  const probes = [
    {
      title: 'Domäne nimmt `.lnk` an',
      errors: comparePaths(runShell, (value) => (value.endsWith('.lnk') ? 'ok' : domainPathVerdict(value))).errors,
    },
    { title: 'Hülle führt `pdf` als Umleitung', errors: comparePaths(runMutatedShell, domainPathVerdict).errors },
    {
      title: 'Domäne weist `1.2.3` ab',
      errors: compareVersions(runShell, (value) =>
        value === '1.2.3' ? { ok: false, handed: value } : domainVersionVerdict(value),
      ).errors,
    },
    {
      title: 'Hülle ohne `-` in der Vorabkennung und mit Schranke 93',
      errors: compareVersions(runMutatedShell, domainVersionVerdict).errors,
    },
  ];
  for (const probe of probes) {
    const blind = probe.errors.length === 0;
    process.stdout.write(`  ${blind ? 'BLIND' : 'ok   '} ${probe.title}\n`);
    if (blind) failed += 1;
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

process.stdout.write(failed === 0 ? '\nGleichlauf bestanden.\n' : `\n${String(failed)} Befund(e).\n`);
process.exit(failed === 0 ? 0 : 1);
