/**
 * Takt — die Lizenzbeilage für die ausgelieferten Pakete (T-068 R-1/R-2, T-075).
 *
 * Aufruf:  pnpm --filter @takt/desktop licenses
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * Solange nur auf dem eigenen Rechner gebaut wird, ist die Lizenzlage folgenlos:
 * Niemand gibt etwas weiter. **Ein Release ist Weitergabe.** Ab da gilt, was
 * T-068 gemessen hat:
 *
 *   - `grep -cE '@license|@preserve|Copyright'` über die gebauten Bündel ergab
 *     **null** Treffer. Vite und esbuild entfernen die Lizenzbanner. In den
 *     Bündeln stecken React, Ark UI, Zod, Hono — MIT verlangt wörtlich, dass
 *     Hinweis und Erlaubnistext „in all copies or substantial portions"
 *     enthalten sind.
 *   - Eine ausgelieferte Kiste steht unter **reinem Apache-2.0** (`tao`, die
 *     Fensterschicht). §4(a) verlangt eine Kopie des Lizenztextes für die
 *     Empfänger. Eine `NOTICE` verlangt sie nicht — `tao` liefert keine, und
 *     wer eine erfindet, erfindet Inhalt.
 *   - Eine ausgelieferte Kiste steht unter **MPL-2.0** (`option-ext`, über
 *     `dirs-sys → dirs → tauri`). §3.3 erlaubt die Weitergabe im größeren Werk
 *     unter anderen Bedingungen, §3.2 verlangt aber den Hinweis, dass die
 *     Quelltextform der abgedeckten Dateien unter MPL verfügbar ist.
 *   - Der Sidecar **ist** eine Kopie der offiziellen Node-Binärdatei. Damit
 *     wird Node ausgeliefert, und mit Node OpenSSL, V8, ICU, zlib und
 *     anderes. Der Lizenztext dafür liegt im heruntergeladenen Archiv und
 *     wird von hier aus mitgenommen — aus demselben Archiv, aus dem die
 *     Laufzeit stammt, nicht aus einer zweiten Quelle.
 *
 * Das Erzeugnis ist eine Datei: `src-tauri/licenses/THIRD-PARTY-LICENSES.txt`,
 * daneben eine Kopie von `/LICENSE`. `tauri.conf.json` nimmt den Ordner über
 * `resources` in `.deb`, `.AppImage` und den NSIS-Installer; `build-app.mjs`
 * bricht ab, wenn er fehlt. Der Dateiname ist die international übliche
 * Schreibweise und damit ein Bezeichner; der Inhalt ist deutsch.
 *
 * ---------------------------------------------------------------------------
 * Wie die Liste entsteht — und warum sie eine Obermenge ist
 * ---------------------------------------------------------------------------
 *
 * **Rust.** `cargo metadata --filter-platform <ziel-tripel>` liefert den
 * aufgelösten Graphen für genau die Plattform, für die gerade gebaut wird. Von
 * der Wurzel aus werden nur Kanten der Art „normal" verfolgt; Bauzeit- und
 * Entwicklungsabhängigkeiten fallen weg, Prozedurmakros ebenfalls — sie laufen
 * im Übersetzer und gehen nicht mit.
 *
 * Was **nicht** gefiltert wird, sind Merkmale: `cargo metadata` löst die
 * Vereinigung aller Merkmale auf. Kisten, die nur hinter einem abgeschalteten
 * Merkmal hängen, stehen deshalb mit in der Liste, obwohl sie nicht
 * ausgeliefert werden. T-068 hat mit `cargo tree -e normal,no-proc-macro` 209
 * ausgelieferte Kisten gezählt, dieser Lauf zählt rund 260.
 *
 * Diese Ungenauigkeit ist **bewusst in die sichere Richtung** gewählt: Wer
 * mehr nennt als nötig, nennt niemanden zu wenig. Der umgekehrte Fehler wäre
 * eine fehlende Attribution, und den sieht niemand, bis er teuer wird. Die
 * Datei sagt das im Kopf ausdrücklich, damit niemand die Zahl als Aussage über
 * den Bauumfang missversteht.
 *
 * **npm.** `pnpm licenses list --json --prod` über den ganzen Arbeitsbereich.
 * Entwicklungsabhängigkeiten — Vite, esbuild, TypeScript, Vitest — fallen weg,
 * weil sie im Erzeugnis nicht vorkommen. Die eigenen `@takt/*`-Pakete fallen
 * ebenfalls weg; sie stehen unter derselben Lizenz wie das Ganze.
 *
 * **Texte statt Kennungen.** Für jedes Paket werden die tatsächlich
 * mitgelieferten Lizenzdateien gelesen (`LICENSE*`, `LICENCE*`, `COPYING*`,
 * `NOTICE*`, `UNLICENSE*`). Gleiche Texte werden **einmal** abgedruckt und von
 * allen Paketen referenziert, die sie benutzen — sonst stünde der
 * Apache-2.0-Text hundertmal in derselben Datei.
 *
 * Pakete **ohne** mitgelieferte Lizenzdatei werden ausdrücklich als solche
 * aufgeführt, mit ihrer SPDX-Kennung. Sie zu verschweigen wäre die stille
 * Variante desselben Fehlers; einen Text für sie zu erfinden wäre die laute.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARCHIVES, NODE_VERSION, tarBinary } from './sidecar-runtime.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const repoRoot = resolve(appDir, '../..');

const tauriDir = join(appDir, 'src-tauri');
const outDir = join(tauriDir, 'licenses');
const runtimeCacheDir = join(appDir, '.sidecar-runtime');
const rootLicense = join(repoRoot, 'LICENSE');

/** Dateinamen, die als Lizenztext gelten. Bewusst eng: keine `*.md`-Fischzüge. */
const LICENSE_FILE = /^(LICENSE|LICENCE|COPYING|NOTICE|UNLICENSE|COPYRIGHT)([-._].*)?$/i;

/** Kein Lizenztext, sondern eine Maschinenfassung daneben. */
const NOT_A_TEXT = /\.(spdx|json|ya?ml)$/i;

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

function step(nr, text) {
  process.stdout.write(`[${nr}/5] ${text}\n`);
}

function note(text) {
  process.stdout.write(`      ${text}\n`);
}

/**
 * Das Ziel-Tripel kommt von `rustc`, nicht aus `process.platform` — dieselbe
 * Regel wie in `build-sidecar.mjs`, und aus demselben Grund: `--filter-platform`
 * will das Tripel und nicht „Linux".
 */
function targetTriple() {
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

/**
 * Sammelt die Lizenztexte eines Ordners.
 *
 * Nur die oberste Ebene: Ein `LICENSE` in einem Unterordner gehört zu einem
 * Unterprojekt, das wir nicht ausliefern, und würde die Beilage mit fremdem
 * Inhalt füllen.
 */
function licenseTextsIn(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }

  const texts = [];
  for (const name of names.sort()) {
    if (!LICENSE_FILE.test(name) || NOT_A_TEXT.test(name)) {
      continue;
    }
    const full = join(dir, name);
    try {
      if (!statSync(full).isFile()) {
        continue;
      }
      const raw = readFileSync(full, 'utf8');
      // Eine leere oder erkennbar binäre Datei ist kein Lizenztext.
      if (raw.trim() === '' || raw.includes('\u0000')) {
        continue;
      }
      texts.push({ name, text: raw.replace(/\r\n/g, '\n').trimEnd() });
    } catch {
      // Unlesbar heißt: nicht vorhanden. Der Eintrag landet dann unter
      // „ohne mitgelieferten Text" und wird dort sichtbar.
    }
  }
  return texts;
}

// ---------------------------------------------------------------------------
// 1 — Rust
// ---------------------------------------------------------------------------

const triple = targetTriple();
step(1, `Rust-Abhängigkeiten für ${triple} auflösen`);

const metadata = spawnSync(
  'cargo',
  ['metadata', '--format-version', '1', '--filter-platform', triple, '--locked'],
  { cwd: tauriDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
);
if (metadata.status !== 0) {
  fail(`\`cargo metadata\` ist fehlgeschlagen:\n${metadata.stderr || metadata.stdout}`);
}

let graph;
try {
  graph = JSON.parse(metadata.stdout);
} catch (error) {
  fail(`Die Ausgabe von \`cargo metadata\` ist kein JSON: ${String(error && error.message)}`);
}

const packagesById = new Map(graph.packages.map((entry) => [entry.id, entry]));
const nodesById = new Map(graph.resolve.nodes.map((entry) => [entry.id, entry]));

/**
 * Von der Wurzel aus, nur über Kanten der Art „normal".
 *
 * `dep_kinds[].kind` ist `null` für gewöhnliche Abhängigkeiten und trägt sonst
 * `"build"` oder `"dev"`. Prozedurmakros werden übersprungen — und mit ihnen
 * ihr ganzer Teilbaum, denn was nur ein Makro braucht, läuft im Übersetzer.
 */
const shipped = new Set();
const queue = [graph.resolve.root];
while (queue.length > 0) {
  const id = queue.pop();
  if (shipped.has(id)) {
    continue;
  }
  shipped.add(id);
  const node = nodesById.get(id);
  if (node === undefined) {
    continue;
  }
  for (const dependency of node.deps) {
    const kinds = dependency.dep_kinds ?? [];
    if (!kinds.some((kind) => kind.kind === null || kind.kind === 'normal')) {
      continue;
    }
    const target = packagesById.get(dependency.pkg);
    if (target !== undefined && target.targets.some((entry) => entry.kind.includes('proc-macro'))) {
      continue;
    }
    queue.push(dependency.pkg);
  }
}
shipped.delete(graph.resolve.root);

const components = [];
for (const id of shipped) {
  const entry = packagesById.get(id);
  if (entry === undefined) {
    continue;
  }
  components.push({
    ecosystem: 'Rust',
    name: entry.name,
    version: entry.version,
    spdx: entry.license ?? (entry.license_file === null ? null : `Datei: ${entry.license_file}`),
    texts: licenseTextsIn(dirname(entry.manifest_path)),
  });
}
note(`${components.length} Kisten (Obermenge, siehe Kopf dieser Datei)`);

// ---------------------------------------------------------------------------
// 2 — npm
// ---------------------------------------------------------------------------

step(2, 'npm-Abhängigkeiten der Auslieferung auflösen');

const licenses = spawnSync('pnpm', ['licenses', 'list', '--json', '--prod'], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
  // Unter Windows ist `pnpm` eine `.cmd`; ohne Shell findet sie niemand.
  shell: process.platform === 'win32',
});
if (licenses.status !== 0) {
  fail(`\`pnpm licenses list\` ist fehlgeschlagen:\n${licenses.stderr || licenses.stdout}`);
}

let byLicense;
try {
  byLicense = JSON.parse(licenses.stdout);
} catch (error) {
  fail(`Die Ausgabe von \`pnpm licenses list\` ist kein JSON: ${String(error && error.message)}`);
}

let npmCount = 0;
for (const [spdx, entries] of Object.entries(byLicense)) {
  for (const entry of entries) {
    // Die eigenen Pakete stehen unter derselben Lizenz wie das Ganze; sie
    // gehören in `/LICENSE` und nicht in die Beilage für Fremdbestandteile.
    if (entry.name.startsWith('@takt/')) {
      continue;
    }
    const texts = [];
    for (const path of entry.paths ?? []) {
      for (const text of licenseTextsIn(path)) {
        texts.push(text);
      }
    }
    components.push({
      ecosystem: 'npm',
      name: entry.name,
      version: (entry.versions ?? []).join(', '),
      spdx,
      texts,
    });
    npmCount += 1;
  }
}
note(`${npmCount} npm-Pakete (nur Laufzeitabhängigkeiten, ohne die eigenen)`);

// ---------------------------------------------------------------------------
// 3 — Die Node-Laufzeit im Sidecar
// ---------------------------------------------------------------------------

step(3, `Lizenztext der eingebetteten Node-Laufzeit v${NODE_VERSION}`);

const archive = ARCHIVES[triple];
if (archive === undefined) {
  fail(`Für \`${triple}\` ist keine Node-Laufzeit hinterlegt — dann ist hier auch kein Lizenztext zu holen.`);
}

const archivePath = join(runtimeCacheDir, archive.file);
if (!existsSync(archivePath)) {
  fail(
    `${relative(repoRoot, archivePath)} fehlt.\n\n` +
      `Der Lizenztext von Node wird aus **demselben Archiv** genommen, aus dem die\n` +
      `Laufzeit stammt — nicht aus einer zweiten Quelle, die etwas anderes sagen\n` +
      `könnte. Also erst die Binärdatei bauen:\n` +
      `  pnpm --filter @takt/desktop sidecar\n`,
  );
}

const prefix = archive.member.split('/')[0];
const licenseMember = `${prefix}/LICENSE`;
const scratch = join(runtimeCacheDir, '.lizenz');
rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

const extract = spawnSync(tarBinary(), ['-xf', archivePath, '-C', scratch, licenseMember], { encoding: 'utf8' });
if (extract.status !== 0) {
  fail(
    `Der Lizenztext ließ sich nicht aus ${archive.file} holen:\n` +
      `${extract.stderr || extract.stdout}\n` +
      `Gesucht wurde \`${licenseMember}\`.`,
  );
}

const nodeLicense = readFileSync(join(scratch, licenseMember), 'utf8').replace(/\r\n/g, '\n').trimEnd();
rmSync(scratch, { recursive: true, force: true });

components.push({
  ecosystem: 'Laufzeit',
  name: 'Node.js',
  version: NODE_VERSION,
  spdx: 'MIT (mit den Lizenzen der mitgelieferten Bestandteile im Text)',
  texts: [{ name: 'LICENSE', text: nodeLicense }],
});
note(`${Math.round(nodeLicense.length / 1024)} KiB aus ${archive.file}`);

// ---------------------------------------------------------------------------
// 4 — Texte zusammenlegen
// ---------------------------------------------------------------------------

step(4, 'Gleiche Texte zusammenlegen');

/** Schlüssel ist der Inhalt, nicht der Dateiname: Apache-2.0 steht einmal. */
const uniqueTexts = new Map();
for (const component of components) {
  for (const text of component.texts) {
    const key = createHash('sha256').update(text.text).digest('hex');
    let bucket = uniqueTexts.get(key);
    if (bucket === undefined) {
      bucket = { text: text.text, users: [] };
      uniqueTexts.set(key, bucket);
    }
    bucket.users.push(`${component.name} ${component.version}`);
    text.key = key;
  }
}

const orderedTexts = [...uniqueTexts.entries()].sort((a, b) => b[1].users.length - a[1].users.length);
const textNumber = new Map(orderedTexts.map(([key], index) => [key, index + 1]));
note(`${uniqueTexts.size} verschiedene Texte für ${components.length} Bestandteile`);

components.sort(
  (a, b) => a.ecosystem.localeCompare(b.ecosystem, 'de') || a.name.localeCompare(b.name, 'de'),
);

const withoutText = components.filter((entry) => entry.texts.length === 0);

// ---------------------------------------------------------------------------
// 5 — Schreiben
// ---------------------------------------------------------------------------

step(5, 'Beilage schreiben');

const rule = '='.repeat(78);
const thin = '-'.repeat(78);
const lines = [];

lines.push(rule);
lines.push('Takt — Lizenzen der mitgelieferten Fremdbestandteile');
lines.push(rule);
lines.push('');
lines.push('Takt selbst steht unter der MIT-Lizenz. Ihr Wortlaut liegt neben dieser');
lines.push('Datei als LICENSE.txt.');
lines.push('');
lines.push('Diese Datei nennt die Bestandteile Dritter, die mit Takt ausgeliefert werden,');
lines.push('und druckt ihre Lizenztexte ab. Sie ist maschinell erzeugt aus dem');
lines.push('Abhängigkeitsgraphen dieses Baus, nicht von Hand gepflegt.');
lines.push('');
lines.push(`Ziel-Tripel dieses Baus:      ${triple}`);
lines.push(`Eingebettete Node-Laufzeit:   v${NODE_VERSION}`);
lines.push(`Bestandteile:                 ${components.length}`);
lines.push(`Verschiedene Lizenztexte:     ${uniqueTexts.size}`);
lines.push('');
lines.push(thin);
lines.push('Zur Genauigkeit dieser Liste');
lines.push(thin);
lines.push('');
lines.push('Die Rust-Seite ist eine **Obermenge**. Sie enthält alle Kisten, die über');
lines.push('gewöhnliche Abhängigkeitskanten für dieses Ziel-Tripel erreichbar sind.');
lines.push('Bauzeit-Abhängigkeiten, Entwicklungsabhängigkeiten und Prozedurmakros sind');
lines.push('ausgenommen, Merkmalsschalter dagegen nicht: Eine Kiste, die nur hinter einem');
lines.push('abgeschalteten Merkmal hängt, steht hier mit, obwohl sie nicht mitgeliefert');
lines.push('wird. Das ist Absicht — wer mehr nennt als nötig, nennt niemanden zu wenig.');
lines.push('Die Zahl oben ist deshalb keine Aussage über den Umfang des Erzeugnisses.');
lines.push('');
lines.push('Die npm-Seite listet die Laufzeitabhängigkeiten des Arbeitsbereichs.');
lines.push('Werkzeuge, die nur beim Bauen laufen, sind nicht dabei.');
lines.push('');
lines.push(thin);
lines.push('Besondere Auflagen');
lines.push(thin);
lines.push('');
lines.push('MPL-2.0 — Quelltextverfügbarkeit');
lines.push('');
lines.push('  Einzelne Bestandteile stehen unter der Mozilla Public License 2.0. Sie');
lines.push('  erlaubt in §3.3 ausdrücklich, das größere Werk unter anderen Bedingungen');
lines.push('  weiterzugeben, verlangt aber nach §3.2 den Hinweis, dass die Quelltextform');
lines.push('  der abgedeckten Dateien unter der MPL verfügbar ist.');
lines.push('');
lines.push('  Hiermit erfolgt dieser Hinweis: Der Quelltext dieser Bestandteile ist in');
lines.push('  unveränderter Form über die Registrierungsstelle crates.io beziehbar, unter');
lines.push('  Angabe von Name und Fassung wie unten aufgeführt. Takt verändert sie nicht.');
lines.push('  Welche Bestandteile das sind, steht im Verzeichnis unten an der Kennung');
lines.push('  MPL-2.0.');
lines.push('');
lines.push('Apache-2.0 — Kopie des Lizenztextes');
lines.push('');
lines.push('  §4(a) verlangt, den Empfängern eine Kopie des Lizenztextes mitzugeben. Sie');
lines.push('  steht unten abgedruckt. §4(d) — die NOTICE-Datei — greift nur, wenn ein');
lines.push('  Bestandteil selbst eine mitliefert; wo das der Fall ist, ist sie hier');
lines.push('  ebenfalls abgedruckt.');
lines.push('');
lines.push('Doppellizenzen');
lines.push('');
lines.push('  Viele Bestandteile stellen die Wahl zwischen mehreren Lizenzen ("MIT OR');
lines.push('  Apache-2.0"). Diese Beilage druckt beide Texte ab, wo beide mitgeliefert');
lines.push('  werden, und trifft die Wahl nicht für den Leser.');
lines.push('');

lines.push(rule);
lines.push('Teil 1 — Verzeichnis der Bestandteile');
lines.push(rule);
lines.push('');

let currentEcosystem = '';
for (const component of components) {
  if (component.ecosystem !== currentEcosystem) {
    currentEcosystem = component.ecosystem;
    lines.push('');
    lines.push(`--- ${currentEcosystem} ---`);
    lines.push('');
  }
  const references =
    component.texts.length === 0
      ? 'ohne mitgelieferten Lizenztext'
      : `Text ${[...new Set(component.texts.map((text) => textNumber.get(text.key)))].sort((a, b) => a - b).join(', ')}`;
  lines.push(`  ${component.name} ${component.version}`);
  lines.push(`      Lizenz: ${component.spdx ?? 'nicht angegeben'}`);
  lines.push(`      ${references}`);
}
lines.push('');

if (withoutText.length > 0) {
  lines.push('');
  lines.push(rule);
  lines.push('Teil 2 — Bestandteile ohne mitgelieferten Lizenztext');
  lines.push(rule);
  lines.push('');
  lines.push('Diese Bestandteile nennen ihre Lizenz nur als Kennung und legen keinen Text');
  lines.push('bei. Der Wortlaut der genannten Lizenz gilt trotzdem; er ist unten bei den');
  lines.push('Texten abgedruckt, soweit ein anderer Bestandteil dieselbe Lizenz beilegt.');
  lines.push('Erfunden wird hier nichts.');
  lines.push('');
  for (const component of withoutText) {
    lines.push(`  ${component.name} ${component.version} — ${component.spdx ?? 'keine Angabe'}`);
  }
  lines.push('');
}

lines.push('');
lines.push(rule);
lines.push('Teil 3 — Lizenztexte');
lines.push(rule);

for (const [key, bucket] of orderedTexts) {
  const users = [...new Set(bucket.users)].sort((a, b) => a.localeCompare(b, 'de'));
  lines.push('');
  lines.push(thin);
  lines.push(`Text ${textNumber.get(key)} — verwendet von ${users.length} Bestandteil(en)`);
  lines.push(thin);
  lines.push('');
  for (const user of users) {
    lines.push(`  ${user}`);
  }
  lines.push('');
  lines.push(bucket.text);
  lines.push('');
}

lines.push('');
lines.push(rule);
lines.push('Ende der Beilage');
lines.push(rule);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const outFile = join(outDir, 'THIRD-PARTY-LICENSES.txt');
writeFileSync(outFile, `${lines.join('\n')}\n`, 'utf8');

if (!existsSync(rootLicense)) {
  fail(`${relative(repoRoot, rootLicense)} fehlt. Ohne die eigene Lizenz ist die Beilage unvollständig.`);
}
copyFileSync(rootLicense, join(outDir, 'LICENSE.txt'));

const size = statSync(outFile).size;
process.stdout.write(
  `\nFertig: ${relative(repoRoot, outFile)} (${Math.round(size / 1024)} KiB)\n` +
    `        ${relative(repoRoot, join(outDir, 'LICENSE.txt'))}\n` +
    `${components.length} Bestandteile, ${uniqueTexts.size} verschiedene Texte, ` +
    `${withoutText.length} ohne mitgelieferten Text.\n`,
);
