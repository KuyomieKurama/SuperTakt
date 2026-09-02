/**
 * Takt — Bündelung des lokalen Dienstes zur Sidecar-Binärdatei (E-004, R-04).
 *
 * Vier Schritte, jeder mit einer Prüfung dahinter:
 *
 *   1. esbuild bündelt `sidecar/entry.ts` zu **einer** CommonJS-Datei.
 *      Danach wird das Metadatenblatt gelesen und geprüft, dass **nichts**
 *      extern geblieben ist außer den Node-Bausteinen `node:*`.
 *   2. Die eingebettete Node-Laufzeit wird bereitgestellt und gegen die im
 *      Repository stehende Prüfsumme geprüft (`scripts/sidecar-runtime.mjs`).
 *   3. `node --experimental-sea-config` erzeugt aus dem Bündel einen SEA-Blob.
 *   4. Die Laufzeit wird kopiert und der Blob mit `postject` hineingelegt.
 *      Ergebnis ist eine ausführbare Datei mit dem Ziel-Tripel im Namen, wie
 *      Tauri sie unter `bundle.externalBin` erwartet.
 *
 * ## Warum Node-SEA und nicht „Bündel plus installiertes Node"
 *
 * E-035 hat `node:sqlite` gewählt, weil es Teil der Laufzeit ist und nichts ins
 * Bündel zieht. Das gilt nur, wenn die Laufzeit **mitkommt**: `node:sqlite`
 * gibt es erst ab Node 22.5. Ein Bündel, das auf ein installiertes Node
 * angewiesen ist, würde auf dem Rechner des Auftraggebers an einer Node-Fassung
 * scheitern, über die niemand entschieden hat. Der SEA nimmt genau die Fassung
 * mit, gegen die hier gebaut und geprüft wurde.
 *
 * ## Warum die Prüfung auf „nichts extern" hier steht und nicht im Bericht
 *
 * `@takt/domain` und `@takt/storage` zeigen in ihren `exports` auf Quelltext,
 * nicht auf `dist/`. Führt der Bündler sie als „external", entsteht eine
 * Binärdatei, die zur Laufzeit `require('@takt/domain')` versucht und im
 * Installationsverzeichnis des Kunden nichts findet — und zwar erst dann, wenn
 * die erste Fachroute aufgerufen wird, nicht beim Start. Eine Zusicherung, die
 * niemand ausführt, ist eine Behauptung; deshalb bricht dieses Skript ab.
 *
 * ## Warum eine Warnung von esbuild hier ein Fehler ist (T-054)
 *
 * Beim Bau der Fassung, die T-053 zum Blocker machte, stand die Ursache die
 * ganze Zeit im Protokoll:
 *
 *     ▲ [WARNING] "import.meta" is not available with the "cjs" output format
 *       and will be empty  [empty-import-meta]
 *
 * Zweimal, bei jedem Lauf, und niemand hat sie gelesen. Der Bau war grün, die
 * Binärdatei entstand, und sie starb beim Start des Kunden.
 *
 * Seither gilt: `import.meta.url` wird über `define` **ausdrücklich** auf die
 * leere Zeichenkette gesetzt — der Wert, den beide Fundstellen im Quelltext
 * ohnehin als „gibt es nicht" behandeln —, und jede **andere** Berührung von
 * `import.meta` hält den Bau an (`logOverride`). Eine Warnung, die niemand
 * liest, ist keine Warnung.
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

import { NODE_VERSION, RuntimeError, ensureRuntime } from './sidecar-runtime.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const repoRoot = resolve(appDir, '../..');

/** Name, unter dem Tauri den Sidecar anspricht. Muss zu `tauri.conf.json` passen. */
const SIDECAR_NAME = 'takt-local-api';

const workDir = join(appDir, '.sidecar-build');
const cacheDir = join(workDir, '..', '.sidecar-runtime');
const bundleFile = join(workDir, 'sidecar.cjs');
const metaFile = join(workDir, 'meta.json');
const seaConfigFile = join(workDir, 'sea-config.json');
const blobFile = join(workDir, 'sidecar.blob');
const binariesDir = join(appDir, 'src-tauri', 'binaries');

/** Die Sicherung aus dem Node-SEA-Verfahren. Fest vorgegeben, kein Wahlwert. */
const SEA_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

function step(nr, text) {
  process.stdout.write(`[${nr}/5] ${text}\n`);
}

/**
 * Das Ziel-Tripel kommt von `rustc`, nicht aus `process.platform`.
 *
 * Tauri benennt Sidecars nach dem Rust-Tripel und sucht die Datei genau unter
 * diesem Namen. Eine selbst zusammengesetzte Zeichenkette geht bei `-gnu`
 * gegen `-musl` oder bei `-msvc` gegen `-gnu` schief, und der Fehler taucht
 * erst beim Bündeln der Anwendung auf.
 */
function targetTriple() {
  const result = spawnSync('rustc', ['-vV'], { encoding: 'utf8' });
  if (result.status !== 0) {
    fail('`rustc -vV` ist fehlgeschlagen. Ohne die Rust-Toolchain lässt sich das Ziel-Tripel nicht bestimmen.');
  }
  const line = String(result.stdout)
    .split('\n')
    .find((entry) => entry.startsWith('host:'));
  if (line === undefined) {
    fail('`rustc -vV` nennt kein `host:`. Das Ziel-Tripel ist damit nicht bestimmbar.');
  }
  return line.slice('host:'.length).trim();
}

// ---------------------------------------------------------------------------
// 1 — Bündeln
// ---------------------------------------------------------------------------

step(1, 'Bündeln mit esbuild');

// Der Arbeitsordner wird geleert, der Laufzeit-Zwischenspeicher **nicht** —
// sonst lädt jeder Bau 31 MiB neu.
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

let result;
try {
  result = await build({
    entryPoints: [join(appDir, 'sidecar', 'entry.ts')],
    outfile: bundleFile,
    bundle: true,
    platform: 'node',
    // Die Fassung, gegen die geprüft wurde. Tiefer zu zielen würde Sprachmittel
    // herunterübersetzen, die die Laufzeit im SEA ohnehin beherrscht.
    target: 'node22',
    format: 'cjs',
    // Ausdrücklich `bundle`, nicht `external`: Die Arbeitsbereichspakete zeigen
    // auf Quelltext und müssen mitübersetzt werden (R-04).
    packages: 'bundle',
    sourcemap: false,
    minify: false,
    legalComments: 'none',
    metafile: true,
    logLevel: 'warning',
    define: {
      // Der SEA läuft ohne `NODE_ENV`; Bibliotheken, die darauf abfragen, sollen
      // den Produktionszweig nehmen.
      'process.env.NODE_ENV': '"production"',
      // Aus einer stillen Annahme wird eine geschriebene (T-053/T-054).
      //
      // `import.meta` gibt es im CommonJS-Ausgabeformat nicht; esbuild setzt
      // dafür ein leeres Objekt ein, und `import.meta.url` ist dann
      // `undefined`. Genau daran ist Takt gestorben: `new URL('…', undefined)`
      // wirft `TypeError: Invalid URL`, und der Wurf kam aus der Wegsuche noch
      // vor dem Lauschen.
      //
      // Die leere Zeichenkette ist der ausdrückliche Wert für „diese Datei hat
      // im Bündel keinen Ort". Beide Fundstellen im Quelltext behandeln ihn
      // bereits so (`packages/storage/src/sqlite/open.ts`,
      // `apps/local-api/src/taskpane/server.ts`): sie prüfen auf
      // `typeof base !== 'string' || base === ''` und liefern `null`. Damit
      // hängt das Verhalten des Erzeugnisses an einer Zeile, die hier steht,
      // und nicht an dem, was esbuild zufällig einsetzt.
      'import.meta.url': '""',
    },
    logOverride: {
      // Die Warnung, die den Startfehler angesagt hat — und die niemand gelesen
      // hat. Ein Bau, der eine Binärdatei erzeugt, die beim Start stirbt, ist
      // schlimmer als ein Bau, der abbricht.
      //
      // Nach dem `define` oben bleibt sie für `import.meta.url` aus; sie
      // erscheint nur noch für **andere** Zugriffe auf `import.meta`
      // (`import.meta.dirname`, `import.meta.filename`, `import.meta` selbst).
      // Das ist der Punkt: Die bekannte Stelle ist geregelt, die nächste
      // unbekannte hält den Bau an.
      'empty-import-meta': 'error',
    },
  });
} catch (error) {
  const messages = Array.isArray(error?.errors) ? error.errors : [];
  const lines = messages.map((entry) => {
    const where = entry.location
      ? `${entry.location.file}:${entry.location.line}:${entry.location.column}`
      : 'unbekannte Stelle';
    return `  - ${where}\n    ${entry.text}`;
  });

  const emptyImportMeta = messages.some((entry) => entry.id === 'empty-import-meta');

  const hint = [
    '',
    'Dazu „import.meta": Im CommonJS-Bündel gibt es das nicht. Der Zugriff läuft',
    'nicht auf einen Fehler hinaus, sondern auf `undefined` — also auf eine',
    'Binärdatei, die gebaut wird und beim Start stirbt. Genau das war T-053.',
    '',
    'Der Weg ist, die Frage „wo liegt mein Quelltext" gar nicht erst zu stellen.',
    'Was zur Laufzeit gebraucht wird, gehört eingebettet (Vorbild:',
    'packages/storage/src/sqlite/migrations.embedded.ts) oder neben',
    'process.execPath. Wo es einen Ort nur im Quelltextbetrieb gibt, ist',
    'import.meta.url über das `define` in diesem Skript die leere Zeichenkette,',
    'und der Aufrufer behandelt sie als „gibt es nicht".',
  ].join('\n');

  fail(
    `esbuild hat den Bau abgebrochen:\n${lines.join('\n') || `  ${String(error?.message ?? error)}`}` +
      (emptyImportMeta ? `\n${hint}` : ''),
  );
}

writeFileSync(metaFile, JSON.stringify(result.metafile, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// 2 — Die Prüfung, wegen der dieses Skript existiert (R-04)
// ---------------------------------------------------------------------------

step(2, 'Prüfen, dass nichts extern geblieben ist');

const outputs = result.metafile.outputs;
const outputKey = Object.keys(outputs).find((key) => key.endsWith('sidecar.cjs'));
if (outputKey === undefined) {
  fail('esbuild hat keine Ausgabedatei gemeldet.');
}

const stray = [];
for (const entry of outputs[outputKey].imports ?? []) {
  if (entry.external !== true) {
    continue;
  }
  if (entry.path.startsWith('node:')) {
    continue;
  }
  stray.push(entry.path);
}

if (stray.length > 0) {
  fail(
    `Diese Abhängigkeiten sind extern geblieben und fehlen damit in der Binärdatei:\n` +
      stray.map((name) => `  - ${name}`).join('\n') +
      `\n\nDas ist R-04. Der Sidecar würde starten und erst bei der ersten Anfrage,\n` +
      `die diesen Baustein braucht, abstürzen. Ursache ist fast immer ein Eintrag\n` +
      `unter \`external\` oder \`packages: 'external'\`.`,
  );
}

/**
 * Zweite Prüfung, in die andere Richtung: Sind die Arbeitsbereichspakete
 * tatsächlich mit im Bündel, sobald der Dienst sie benutzt?
 *
 * Die erste Prüfung fängt „extern geblieben". Sie fängt **nicht** den Fall,
 * dass ein Paket nur Typen liefert und zur Laufzeit ganz verschwindet — das
 * ist heute bei `@takt/storage` so und in Ordnung. Deshalb wird hier nur
 * berichtet, nicht abgebrochen.
 */
// esbuild meldet Eingabepfade **relativ zum Arbeitsverzeichnis**. Erst absolut
// gemacht lassen sie sich gegen die Ordner des Arbeitsbereichs prüfen.
const inputs = Object.keys(result.metafile.inputs).map((input) => resolve(process.cwd(), input));
const workspaceHits = new Map();
for (const [name, folder] of [
  ['@takt/local-api', join(repoRoot, 'apps', 'local-api')],
  ['@takt/domain', join(repoRoot, 'packages', 'domain')],
  ['@takt/storage', join(repoRoot, 'packages', 'storage')],
]) {
  workspaceHits.set(name, inputs.filter((input) => input.startsWith(`${folder}/`)).length);
}
for (const [name, count] of workspaceHits) {
  const mark = count > 0 ? 'im Bündel' : 'zur Laufzeit nicht benutzt (heute nur Typen)';
  process.stdout.write(`      ${name}: ${count} Datei(en) — ${mark}\n`);
}
if ((workspaceHits.get('@takt/local-api') ?? 0) === 0) {
  fail('Der lokale Dienst selbst ist nicht im Bündel. Der Einstiegspunkt zeigt ins Leere.');
}

const bundleBytes = statSync(bundleFile).size;
process.stdout.write(`      Bündel: ${relative(repoRoot, bundleFile)} (${Math.round(bundleBytes / 1024)} KiB)\n`);

// ---------------------------------------------------------------------------
// 3 — SEA-Blob
// ---------------------------------------------------------------------------

const triple = targetTriple();

step(3, `Node-Laufzeit ${NODE_VERSION} für ${triple} bereitstellen`);

let runtime;
try {
  runtime = await ensureRuntime(triple, cacheDir, (line) => process.stdout.write(`${line}\n`));
} catch (error) {
  if (error instanceof RuntimeError) {
    fail(error.message);
  }
  throw error;
}
process.stdout.write(`      Laufzeit: ${relative(repoRoot, runtime)}\n`);

step(4, 'SEA-Blob erzeugen');

writeFileSync(
  seaConfigFile,
  `${JSON.stringify(
    {
      main: bundleFile,
      output: blobFile,
      // Ohne dies schreibt Node bei jedem Start eine Warnung nach stderr. Die
      // Hülle wertet stderr aus; eine Warnung, die immer kommt, verdeckt die,
      // die einmal kommt.
      disableExperimentalSEAWarning: true,
      // Kein Startabbild: Der Dienst öffnet beim Start Dateien und Sockets, und
      // ein Abbild friert genau das ein, was nicht eingefroren werden darf.
      useSnapshot: false,
      useCodeCache: true,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

// Der Blob wird von **derselben** Laufzeit erzeugt, die ihn später ausführt.
// Ein Blob aus einer anderen Node-Fassung wird beim Start abgelehnt, und der
// Zwischenspeicher für übersetzten Code ist ohnehin fassungsgebunden.
const sea = spawnSync(runtime, ['--experimental-sea-config', seaConfigFile], {
  stdio: ['ignore', 'pipe', 'pipe'],
  encoding: 'utf8',
});
if (sea.status !== 0) {
  fail(`\`node --experimental-sea-config\` ist fehlgeschlagen:\n${sea.stderr || sea.stdout}`);
}

// ---------------------------------------------------------------------------
// 4 — Binärdatei zusammensetzen
// ---------------------------------------------------------------------------

const suffix = process.platform === 'win32' ? '.exe' : '';
const outFile = join(binariesDir, `${SIDECAR_NAME}-${triple}${suffix}`);

step(5, `Binärdatei zusammensetzen (${SIDECAR_NAME}-${triple}${suffix})`);

mkdirSync(binariesDir, { recursive: true });
rmSync(outFile, { force: true });
copyFileSync(runtime, outFile);
chmodSync(outFile, 0o755);

/**
 * Der Einbau ist **nicht** auf allen drei Plattformen derselbe Aufruf (T-075).
 *
 * Das Ablageformat unterscheidet sich, und postject braucht das gesagt:
 *
 *   ELF   (Linux)    eine Notiz namens `NODE_SEA_BLOB`
 *   PE    (Windows)  eine Ressource namens `NODE_SEA_BLOB`
 *   Mach-O (macOS)   ein Abschnitt `NODE_SEA_BLOB` **im Segment `NODE_SEA`**
 *
 * Nur der letzte Fall braucht einen zusätzlichen Schalter. Fehlt er, legt
 * postject den Abschnitt in ein Segment, in dem die Laufzeit ihn nicht sucht:
 * Die Datei entsteht, sie startet, und sie führt das eingebaute Bündel nicht
 * aus — sie verhält sich wie ein blankes `node` ohne Argumente. Das ist genau
 * die Sorte Fehlschlag, die T-053 gekostet hat, nur eine Plattform weiter.
 *
 * Der Name des Segments ist vorgegeben und kein Wahlwert; er steht so in der
 * Beschreibung des SEA-Verfahrens von Node.
 */
const MACHO_SEGMENT = 'NODE_SEA';
const isMac = triple.includes('-apple-darwin');

/**
 * macOS unterschreibt jede ausführbare Datei, und auf Apple Silicon ist das
 * keine Formalie: Ohne gültige Signatur beendet der Kernel den Prozess sofort
 * mit SIGKILL. Die offizielle Node-Binärdatei bringt eine Signatur mit — und
 * der Einbau des Blobs macht sie ungültig, weil er die Datei verändert.
 *
 * Deshalb zwei Schritte um den Einbau herum:
 *
 *   vorher   `codesign --remove-signature`  — sonst weigert sich das Werkzeug
 *                                             oder erzeugt eine kaputte Datei
 *   nachher  `codesign --sign -`            — eine Ad-hoc-Signatur, die genügt,
 *                                             damit die Datei überhaupt läuft
 *
 * Eine Ad-hoc-Signatur (`-`) ist **kein** Entwicklerzertifikat. Sie macht die
 * Datei ausführbar, sie macht sie nicht vertrauenswürdig: Gatekeeper hält die
 * Anwendung beim ersten Start trotzdem an, weil sie nicht notariell beglaubigt
 * ist. Das ist eine bewusste Grenze und gehört in die Release-Beschreibung, wo
 * sie auch steht — nicht hierhin, wo sie niemand liest.
 */
function codesign(args, what) {
  const result = spawnSync('codesign', args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (result.error !== undefined) {
    fail(
      `\`codesign\` ist nicht aufrufbar (${what}): ${String(result.error.message)}\n` +
        `Unter macOS gehört es zu den Befehlszeilenwerkzeugen von Xcode. Ohne\n` +
        `Signatur beendet der Kernel die Binärdatei auf Apple Silicon sofort.`,
    );
  }
  return result;
}

if (isMac) {
  // Fehlt gar keine Signatur, meldet `--remove-signature` das und tut nichts.
  // Das ist kein Fehler, deshalb wird der Rückgabewert hier nicht bewertet.
  codesign(['--remove-signature', outFile], 'Signatur entfernen');
}

const require_ = createRequire(import.meta.url);
const postjectCli = require_.resolve('postject/dist/cli.js');

const inject = spawnSync(
  process.execPath,
  [
    postjectCli,
    outFile,
    'NODE_SEA_BLOB',
    blobFile,
    '--sentinel-fuse',
    SEA_FUSE,
    ...(isMac ? ['--macho-segment-name', MACHO_SEGMENT] : []),
  ],
  { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
);
if (inject.status !== 0) {
  fail(`postject ist fehlgeschlagen:\n${inject.stderr || inject.stdout}`);
}

if (isMac) {
  const signed = codesign(['--sign', '-', outFile], 'ad-hoc unterschreiben');
  if (signed.status !== 0) {
    fail(
      `\`codesign --sign -\` ist fehlgeschlagen:\n${signed.stderr || signed.stdout}\n\n` +
        `Ohne Signatur ist die Binärdatei auf Apple Silicon nicht startbar; der\n` +
        `Kernel beendet sie vor der ersten Zeile. Ein Bau, der hier weiterliefe,\n` +
        `lieferte ein Paket aus, das beim Öffnen nichts tut.`,
    );
  }
}

if (!existsSync(outFile)) {
  fail('Nach dem Einfügen gibt es keine Binärdatei.');
}

const outBytes = statSync(outFile).size;
process.stdout.write(
  `\nFertig: ${relative(repoRoot, outFile)} (${Math.round(outBytes / (1024 * 1024))} MiB)\n` +
    `Node-Fassung im Bündel: v${NODE_VERSION} (offizielle Binärdatei, Prüfsumme geprüft)\n` +
    `Nachweis, dass sie wirklich läuft: pnpm --filter @takt/desktop sidecar:verify\n`,
);
