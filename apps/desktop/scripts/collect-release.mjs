/**
 * Takt — die gebauten Installationsdateien einsammeln (T-075).
 *
 * Aufruf:  pnpm --filter @takt/desktop release:collect
 *
 * ===========================================================================
 * Warum das ein Skript ist und keine Zeile im Ablauf
 * ===========================================================================
 *
 * Tauri legt seine Erzeugnisse je nach Plattform woanders ab und benennt sie
 * unterschiedlich:
 *
 *   Linux    bundle/deb/Takt_1.2.3_amd64.deb
 *            bundle/appimage/Takt_1.2.3_amd64.AppImage
 *   Windows  bundle/nsis/Takt_1.2.3_x64-setup.exe
 *   macOS    bundle/dmg/Takt_1.2.3_aarch64.dmg
 *
 * Ein Suchmuster in der Ablaufdatei müsste diese Fälle raten, und es müsste sie
 * dreimal raten, weil die Kommandozeile unter Windows eine andere ist. Schlimmer:
 * Ein Muster, das nichts findet, ist unter `bash` erfolgreich. Der Schritt wäre
 * grün, das Release entstünde — ohne Dateien. Genau die Sorte Lücke, an der
 * dieses Projekt schon dreimal hing.
 *
 * Deshalb sucht dieses Skript selbst, prüft, dass es **überhaupt etwas**
 * gefunden hat, und bricht sonst ab.
 *
 * ---------------------------------------------------------------------------
 * Was es ablegt
 * ---------------------------------------------------------------------------
 *
 *   apps/desktop/release/<ziel-tripel>/            die Dateien, unverändert
 *   apps/desktop/release/<ziel-tripel>/SHA256SUMS  Prüfsummen wie von sha256sum
 *
 * Die Dateinamen bleiben, wie Tauri sie vergibt. Sie tragen Produktnamen,
 * Fassung und Architektur bereits im Namen; sie umzubenennen hieße, eine zweite
 * Namensregel zu erfinden, die niemand kennt.
 *
 * Die Prüfsummendatei liegt je Plattform in einem eigenen Ordner und heißt
 * deshalb überall gleich. Erst beim Veröffentlichen werden die drei
 * zusammengeführt — dort, wo klar ist, welche Plattform welche Zeile beigetragen
 * hat.
 *
 * ---------------------------------------------------------------------------
 * Was es nicht einsammelt
 * ---------------------------------------------------------------------------
 *
 * Das `.app`-Bündel unter macOS. Es ist ein Ordner, kein Installationsstück;
 * das `.dmg` daneben enthält es. Ein Ordner als Anhang eines Releases müsste
 * gepackt werden, und dabei gingen unter Linux und Windows die Rechte und die
 * Signatur verloren.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const repoRoot = resolve(appDir, '../..');

/**
 * Die Endungen, die ein Mensch herunterlädt und startet.
 *
 * Bewusst eine Positivliste. Im Bündelordner liegen daneben entpackte
 * Verzeichnisse, `linuxdeploy`-Zwischenstände und Signaturdateien; ein
 * „alles außer" nähme sie mit.
 */
const ARTIFACT_SUFFIXES = ['.deb', '.AppImage', '.rpm', '.exe', '.msi', '.dmg'];

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

/**
 * Das Ziel-Tripel kommt von `rustc` — dieselbe Regel wie überall in dieser
 * Kette. Daraus wird die Kennung, unter der die Dateien abgelegt werden, damit
 * die drei Plattformen sich beim Zusammenführen nicht überschreiben.
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
 * Der Ausgabeordner von Cargo. `CARGO_TARGET_DIR` wird beachtet, weil es ihn
 * tatsächlich verschiebt — dieselbe Rücksicht wie in `build-taskpane.mjs`.
 */
function cargoTargetDir() {
  const fromEnv = process.env['CARGO_TARGET_DIR'];
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return resolve(repoRoot, fromEnv.trim());
  }
  return join(appDir, 'src-tauri', 'target');
}

/**
 * Die Fassung, die dieser Lauf einsammeln darf — und warum es sie braucht.
 *
 * `tauri build` **räumt den Bündelordner nicht auf**. Beim ersten Lauf hier
 * gemessen: Nach einem Bau mit `0.1.0` lagen dort
 *
 *     Takt_0.0.0_amd64.deb        ← vom vorigen Bau, Tage alt
 *     Takt_0.1.0_amd64.deb
 *     Takt_0.1.0_amd64.AppImage
 *
 * und ein Einsammeln „alles mit passender Endung" hätte die alte `.deb` in die
 * Fassung gehängt, mit Prüfsumme und allem. Auf einem frischen Läufer fällt das
 * nie auf; auf einem Rechner, auf dem schon einmal gebaut wurde, jedes Mal. Und
 * es sähe aus wie ein vollständiges Release.
 *
 * Deshalb: Ist `TAKT_RELEASE_VERSION` gesetzt — im Auslieferungsablauf ist sie
 * das immer —, kommt nur mit, was diese Fassung im Namen trägt. Tauri schreibt
 * sie in jeden Dateinamen (`Takt_1.2.3_amd64.deb`, `Takt_1.2.3_x64-setup.exe`,
 * `Takt_1.2.3_aarch64.dmg`). Findet der Filter nichts, bricht der Lauf ab,
 * statt ein leeres Verzeichnis weiterzureichen.
 */
const rawVersion = process.env['TAKT_RELEASE_VERSION'];
const expectedVersion =
  typeof rawVersion === 'string' && rawVersion.trim() !== '' ? rawVersion.trim().replace(/^v/, '') : null;

/** Alle Dateien mit passender Endung, eine Ebene unter `bundle/`. */
function findArtifacts(bundleDir) {
  const found = [];
  let groups;
  try {
    groups = readdirSync(bundleDir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const group of groups) {
    if (!group.isDirectory()) {
      continue;
    }
    const groupDir = join(bundleDir, group.name);
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isFile()) {
        continue;
      }
      if (!ARTIFACT_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) {
        continue;
      }
      found.push({ group: group.name, name: entry.name, path: join(groupDir, entry.name) });
    }
  }
  return found.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

const triple = targetTriple();
const bundleDir = join(cargoTargetDir(), 'release', 'bundle');

process.stdout.write(`Ziel-Tripel:   ${triple}\n`);
process.stdout.write(`Bündelordner:  ${relative(repoRoot, bundleDir)}\n\n`);

if (!existsSync(bundleDir)) {
  fail(
    `${relative(repoRoot, bundleDir)} gibt es nicht.\n` +
      `Es wurde also gar nicht gebündelt. Erst bauen:\n` +
      `  pnpm desktop:build\n`,
  );
}

const allArtifacts = findArtifacts(bundleDir);
if (allArtifacts.length === 0) {
  fail(
    `In ${relative(repoRoot, bundleDir)} liegt keine Installationsdatei.\n\n` +
      `Gesucht wurde nach: ${ARTIFACT_SUFFIXES.join(', ')}\n\n` +
      `Vorhandene Unterordner: ${readdirSync(bundleDir).join(', ') || '(keine)'}\n\n` +
      `Ein Bau, der grün meldet und nichts hinterlässt, ist der Fall, den dieser\n` +
      `Lauf abfangen soll: Häufigste Ursache ist eine Plattform, für die in\n` +
      `\`bundle.targets\` kein Eintrag steht.`,
  );
}

let artifacts = allArtifacts;
if (expectedVersion === null) {
  process.stdout.write(
    `Fassung:       nicht vorgegeben (TAKT_RELEASE_VERSION ist leer)\n\n` +
      `  Hinweis: Es kommt alles mit, was im Bündelordner liegt — auch Dateien aus\n` +
      `  früheren Bauläufen. Tauri räumt dort nicht auf. Für eine Auslieferung ist\n` +
      `  TAKT_RELEASE_VERSION zu setzen; dann kommt nur diese Fassung mit.\n\n`,
  );
} else {
  process.stdout.write(`Fassung:       ${expectedVersion}\n\n`);
  artifacts = allArtifacts.filter((entry) => entry.name.includes(`_${expectedVersion}_`));

  for (const entry of allArtifacts) {
    if (!artifacts.includes(entry)) {
      process.stdout.write(`  übergangen  ${entry.name} — gehört nicht zu ${expectedVersion}\n`);
    }
  }

  if (artifacts.length === 0) {
    fail(
      `Im Bündelordner liegt nichts zur Fassung ${expectedVersion}.\n\n` +
        `Gefunden wurde:\n` +
        allArtifacts.map((entry) => `  - ${entry.name}`).join('\n') +
        `\n\nEntweder ist der Bau mit einer anderen Fassung gelaufen — dann stimmt\n` +
        `TAKT_RELEASE_VERSION zwischen Bau und Einsammeln nicht überein —, oder\n` +
        `Tauri benennt seine Dateien nicht mehr nach dem Muster \`Name_Fassung_Arch\`.\n` +
        `Beides ist ein Befund und keine Gelegenheit, den Filter zu lockern: Ohne\n` +
        `ihn ginge eine Datei aus einem früheren Bau als diese Fassung heraus.`,
    );
  }
}

const outDir = join(appDir, 'release', triple);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

/**
 * Die Prüfsumme wird **strömend** gebildet und nicht über `readFileSync`.
 *
 * Ein AppImage ist rund 140 MiB. `readFileSync` legte es vollständig in den
 * Speicher, und zwar auf einem Läufer, dessen Grenze niemand kennt. Der Strom
 * kostet nichts und hat diese Grenze nicht.
 */
async function sha256(path) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

const sums = [];
for (const artifact of artifacts) {
  const destination = join(outDir, artifact.name);
  copyFileSync(artifact.path, destination);
  const digest = await sha256(destination);
  sums.push(`${digest}  ${artifact.name}`);
  const megabytes = (statSync(destination).size / (1024 * 1024)).toFixed(1);
  process.stdout.write(`  ${artifact.group.padEnd(10)} ${artifact.name} (${megabytes} MiB)\n`);
}

writeFileSync(join(outDir, 'SHA256SUMS'), `${sums.join('\n')}\n`, 'utf8');

process.stdout.write(`\n${artifacts.length} Datei(en) in ${relative(repoRoot, outDir)}, dazu SHA256SUMS.\n`);
