/**
 * Takt — die sechs Prüfsummen in `sidecar-runtime.mjs` gegen nodejs.org halten
 * (T-075).
 *
 * Aufruf:  pnpm --filter @takt/desktop sidecar:checksums
 *
 * ===========================================================================
 * Warum es diesen Lauf gibt
 * ===========================================================================
 *
 * `scripts/sidecar-runtime.mjs` trägt die SHA-256 von sechs Node-Archiven —
 * Linux x64/arm64, Windows x64/arm64, macOS x64/arm64. Sie stehen **im
 * Repository**, damit der Bau abbricht, bevor eine untergeschobene Auslieferung
 * von nodejs.org in die Anwendung gelangt. Genau das macht sie aber auch zu
 * einer Behauptung: Solange nur unter Linux gebaut wurde, hat niemand die
 * anderen fünf Zeilen je gegen etwas gehalten. Ein Tippfehler in einer davon
 * fiele erst beim ersten Windows- oder macOS-Bau auf, und dort sähe er aus wie
 * ein Angriff.
 *
 * Dieser Lauf lädt `SHASUMS256.txt` der eingetragenen Fassung von nodejs.org
 * und vergleicht **alle** Einträge Zeile für Zeile. Er lädt keine Archive und
 * schreibt nichts; er ist ein Vergleich und sonst nichts.
 *
 * ---------------------------------------------------------------------------
 * Was er nicht prüft
 * ---------------------------------------------------------------------------
 *
 * Er prüft die **Signatur** von `SHASUMS256.txt` nicht. Neben der Datei liegt
 * `SHASUMS256.txt.sig`, mit einem der Freigabeschlüssel des Node-Projekts
 * unterschrieben. Diese Prüfung braucht `gpg` und den eingerichteten
 * Schlüsselbund — beides steht hier nicht, und ein Lauf, der so tut, als hätte
 * er signiert geprüft, wäre schlimmer als einer, der die Grenze benennt.
 *
 * Der Vergleich hier nimmt also an, dass die HTTPS-Verbindung zu nodejs.org und
 * die Datei dahinter in Ordnung sind. Das ist genau die Annahme, die auch beim
 * ersten Eintragen der Zeilen galt. Der Gewinn ist ein anderer: Er zeigt, dass
 * die sechs Zeilen im Repository nicht abgeschrieben-falsch sind, und er zeigt
 * es zu einem Zeitpunkt, den ein Mensch selbst wählt.
 *
 * Wer die Signatur prüfen will, tut das von Hand:
 *
 *   curl -O https://nodejs.org/dist/v<fassung>/SHASUMS256.txt
 *   curl -O https://nodejs.org/dist/v<fassung>/SHASUMS256.txt.sig
 *   gpg --verify SHASUMS256.txt.sig SHASUMS256.txt
 *
 * Die Schlüssel stehen unter https://github.com/nodejs/release-keys.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NODE_VERSION } from './sidecar-runtime.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const runtimeFile = join(here, 'sidecar-runtime.mjs');
const repoRoot = resolve(here, '../../..');

const URL_SHASUMS = `https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt`;

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

/**
 * Die Einträge werden aus dem Quelltext gelesen, nicht importiert.
 *
 * `ARCHIVES` ist in `sidecar-runtime.mjs` bewusst nicht ausgeführt — es ist ein
 * Wert, den nur diese Datei braucht. Ihn für einen Prüflauf öffentlich zu
 * machen hieße, die Schnittstelle für den Prüfer zu ändern; der Prüfer liest
 * stattdessen dieselben Zeilen, die auch ein Mensch liest. Findet er keine
 * sechs Einträge, ist das ein Fehler und keine Fußnote: Dann hat sich der
 * Aufbau der Datei geändert, und dieser Lauf prüfte still weniger als er
 * behauptet.
 */
function readArchivesFromSource() {
  const source = readFileSync(runtimeFile, 'utf8');
  const pattern =
    /file:\s*`node-v\$\{NODE_VERSION\}-([A-Za-z0-9.-]+)\.(tar\.xz|zip)`,\s*\n\s*sha256:\s*'([0-9a-f]{64})'/g;

  const found = [];
  let match;
  while ((match = pattern.exec(source)) !== null) {
    found.push({ file: `node-v${NODE_VERSION}-${match[1]}.${match[2]}`, sha256: match[3] });
  }
  return found;
}

const entries = readArchivesFromSource();
if (entries.length === 0) {
  fail(
    `In ${runtimeFile} steht kein einziger Archiveintrag im erwarteten Aufbau.\n` +
      `Entweder hat sich die Schreibweise geändert oder die Tabelle ist weg.\n` +
      `Dieser Lauf prüft dann nichts und darf deshalb nicht grün melden.`,
  );
}

process.stdout.write(`Node-Fassung im Repository: v${NODE_VERSION}\n`);
process.stdout.write(`Vergleichsquelle:           ${URL_SHASUMS}\n`);
process.stdout.write(`Einträge in sidecar-runtime.mjs: ${entries.length}\n\n`);

let response;
try {
  response = await fetch(URL_SHASUMS);
} catch (error) {
  fail(`${URL_SHASUMS} ist nicht erreichbar: ${String(error && error.message)}`);
}
if (!response.ok) {
  fail(`${URL_SHASUMS} antwortet mit ${response.status}.`);
}
const official = await response.text();

/** `<sha256>  <dateiname>` je Zeile. Zwei Leerzeichen, aber tolerant gelesen. */
const officialSums = new Map();
for (const line of official.split('\n')) {
  const match = line.trim().match(/^([0-9a-f]{64})\s+(\S+)$/);
  if (match !== null) {
    officialSums.set(match[2], match[1]);
  }
}
if (officialSums.size === 0) {
  fail(`${URL_SHASUMS} enthält keine lesbare Prüfsummenzeile.`);
}

let mismatched = 0;
for (const entry of entries) {
  const expected = officialSums.get(entry.file);
  if (expected === undefined) {
    mismatched += 1;
    process.stdout.write(`  FEHL  ${entry.file} — steht nicht in SHASUMS256.txt\n`);
    continue;
  }
  if (expected !== entry.sha256) {
    mismatched += 1;
    process.stdout.write(
      `  FEHL  ${entry.file}\n` + `        Repository: ${entry.sha256}\n` + `        nodejs.org: ${expected}\n`,
    );
    continue;
  }
  process.stdout.write(`  ok    ${entry.file}\n`);
}

process.stdout.write(`\n${entries.length - mismatched} von ${entries.length} Einträgen stimmen überein.\n`);

if (mismatched > 0) {
  process.stderr.write(
    `\nFEHLER: ${mismatched} Eintrag/Einträge weichen ab.\n\n` +
      `Zwei Ursachen sind möglich, und sie sehen gleich aus:\n` +
      `  1. Beim Eintragen wurde falsch abgeschrieben. Dann ist der Wert im\n` +
      `     Repository zu berichtigen — aus SHASUMS256.txt, nicht aus einem\n` +
      `     Archiv, das gerade herumliegt.\n` +
      `  2. Die Auslieferung von nodejs.org hat sich geändert. Dann ist das ein\n` +
      `     Befund und nichts, was man nachzieht.\n\n` +
      `Der Unterschied lässt sich nur über die Signatur klären:\n` +
      `  gpg --verify SHASUMS256.txt.sig SHASUMS256.txt\n` +
      `Schlüssel: https://github.com/nodejs/release-keys\n\n` +
      `Bis dahin gilt: nichts nachziehen. ${relativeHint()}\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `\nAlle Einträge stimmen mit der offiziellen Prüfsummendatei überein.\n` +
    `Damit ist belegt, dass der Bau unter Windows und macOS gegen dieselbe\n` +
    `Quelle prüft wie der unter Linux — und nicht gegen einen Tippfehler.\n`,
);

function relativeHint() {
  return `Die Tabelle steht in ${runtimeFile.slice(repoRoot.length + 1)}.`;
}
