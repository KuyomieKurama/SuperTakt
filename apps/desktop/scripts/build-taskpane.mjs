/**
 * Takt — der Aufgabenbereich des Add-ins wird dorthin gelegt, wo der Dienst ihn
 * sucht (E-046, T-054).
 *
 * ===========================================================================
 * Der Befund, wegen dessen es diese Datei gibt
 * ===========================================================================
 *
 * `apps/local-api/src/taskpane/server.ts` sucht sein Bündel an genau einem Ort,
 * der in der Auslieferung gilt:
 *
 *     resolve(process.execPath, '..', 'taskpane')
 *
 * Also **neben der Sidecar-Binärdatei**. Der Weg ist seit T-053 richtig und mit
 * `sidecar:verify` nachgewiesen. Es hat nur nie jemand ein Bündel dorthin
 * gelegt: `build-app.mjs` kannte das Wort `taskpane` nicht, `tauri.conf.json`
 * hatte kein `resources`, und der Dienst meldete folgerichtig bei jedem Start
 *
 *     Der Aufgabenbereich des Add-ins wird nicht ausgeliefert:
 *     Es liegt kein Bündel vor.
 *
 * Das ist dieselbe Sorte Lücke wie der Startfehler aus T-053, eine Ebene höher:
 * Jeder Teil für sich stimmt, und das Erzeugnis ist trotzdem unvollständig.
 * **Ohne diesen Schritt ist das Outlook-Add-in in der gebauten Anwendung nicht
 * benutzbar.**
 *
 * ---------------------------------------------------------------------------
 * Warum das auch im Entwicklungsbetrieb gilt
 * ---------------------------------------------------------------------------
 *
 * Der zweite Kandidat in `server.ts` — `apps/outlook-addin/dist` — entsteht aus
 * `import.meta.url` und existiert deshalb **nur**, wenn der Dienst aus dem
 * Quelltext läuft. In `tauri dev` läuft er nicht aus dem Quelltext, sondern als
 * dieselbe gebündelte Binärdatei wie beim Kunden; dort ist `import.meta.url`
 * seit T-054 ausdrücklich die leere Zeichenkette. Der gebündelte Dienst kennt
 * den Arbeitsbereich also bewusst nicht — und das ist richtig so: Was beim
 * Kunden läuft, soll nichts über ein Repository wissen.
 *
 * Die Folge ist aber, dass der Aufgabenbereich in `tauri dev` genauso tot wäre
 * wie in der Auslieferung, wenn ihn dort niemand hinlegt. Deshalb kennt dieses
 * Skript zwei Ziele:
 *
 *   `--dev`    <target>/debug/taskpane   — neben die Binärdatei, die `tauri dev`
 *                                          aus `src-tauri/binaries/` dorthin
 *                                          kopiert
 *   (ohne)     src-tauri/taskpane        — der Bereitstellungsordner, aus dem
 *                                          `tauri build` das Bündel in das Paket
 *                                          nimmt (siehe `tauri.conf.json`)
 *
 * ---------------------------------------------------------------------------
 * Warum hier gebaut und nicht nur kopiert wird
 * ---------------------------------------------------------------------------
 *
 * Ein Kopierschritt, der ein vorhandenes `dist/` voraussetzt, ist die nächste
 * Ausgabe desselben Fehlers: Er liefert stillschweigend den Stand von vorgestern
 * aus oder bricht mit „nicht gefunden" ab, je nachdem, was zufällig im
 * Arbeitsverzeichnis liegt. Deshalb ruft dieses Skript den Bau des Add-ins
 * selbst auf. `@takt/outlook-addin` steht dafür bewusst **nicht** in den
 * Abhängigkeiten von `@takt/desktop` — die Hülle benutzt keine seiner
 * Ausfuhren, sie liefert nur sein Erzeugnis aus. Der Aufruf geht deshalb über
 * den Arbeitsbereichsfilter von pnpm und nicht über eine Abhängigkeitskante,
 * die es fachlich nicht gibt.
 *
 * `--no-build` überspringt den Bau. Das ist für den Nachweislauf gedacht, in
 * dem dieselbe Bereitstellung mehrfach hintereinander läuft, und nicht für den
 * Alltag.
 */

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const repoRoot = resolve(appDir, '../..');

/** Der Ordnername, unter dem der Dienst sucht. Muss zu `taskpane/server.ts` passen. */
const TASKPANE_DIR_NAME = 'taskpane';

const addinDir = join(repoRoot, 'apps', 'outlook-addin');
const addinDist = join(addinDir, 'dist');

/** Der Bereitstellungsordner für `tauri build`. Siehe `tauri.conf.json`. */
export const stagingDir = join(appDir, 'src-tauri', TASKPANE_DIR_NAME);

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

function note(text) {
  process.stdout.write(`      ${text}\n`);
}

/**
 * Das Rust-Bauverzeichnis, in dem `tauri dev` die Binärdateien ablegt.
 *
 * `CARGO_TARGET_DIR` wird beachtet, weil es das Verzeichnis tatsächlich
 * verschiebt — wer es setzt und hier nicht bedacht würde, bekäme ein Bündel an
 * einem Ort, an dem nichts läuft, und keinen Hinweis darauf.
 */
function cargoTargetDir() {
  const fromEnv = process.env['CARGO_TARGET_DIR'];
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return resolve(repoRoot, fromEnv.trim());
  }
  return join(appDir, 'src-tauri', 'target');
}

/** Baut das Add-in. Ohne eigenen Bau wäre der Kopierschritt eine Wette. */
function buildAddin() {
  const result = spawnSync('pnpm', ['--filter', '@takt/outlook-addin', 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
    // Unter Windows ist `pnpm` eine `.cmd`; ohne Shell findet sie niemand.
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    fail(
      'Der Bau des Add-ins ist fehlgeschlagen. Ohne sein Bündel gibt es keinen ' +
        'Aufgabenbereich; die Anwendung würde starten und das Add-in wäre tot.',
    );
  }
}

/**
 * Prüft, dass die kopierte Fassung vollständig ist.
 *
 * Nicht „der Ordner ist da", sondern: Die Einstiegsseite ist da, und **jede**
 * örtliche Datei, die sie nachlädt, ist es auch. Eine halb kopierte Fassung
 * liefert sonst eine Seite aus, die im Aufgabenbereich von Outlook leer bleibt
 * — mit einem Fehler in einer Konsole, die dort niemand sieht.
 */
function verifyStage(dir) {
  const index = join(dir, 'index.html');
  if (!existsSync(index) || !statSync(index).isFile()) {
    fail(`Im bereitgestellten Aufgabenbereich fehlt die \`index.html\`: ${relative(repoRoot, dir)}`);
  }

  const html = readFileSync(index, 'utf8');
  const referenced = [...html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith('./') || value.startsWith('/'));

  const missing = referenced.filter((value) => !existsSync(join(dir, value.replace(/^\.?\//, ''))));
  if (missing.length > 0) {
    fail(
      `Die \`index.html\` des Aufgabenbereichs verweist auf Dateien, die nicht mitgekommen sind:\n` +
        missing.map((value) => `  - ${value}`).join('\n'),
    );
  }

  return { files: countFiles(dir), referenced: referenced.length };
}

function countFiles(dir) {
  let count = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    count += 1;
    bytes += statSync(join(entry.parentPath ?? entry.path, entry.name)).size;
  }
  return { count, bytes };
}

/**
 * Legt das Bündel des Aufgabenbereichs an einen Ort.
 *
 * Der Zielordner wird **geleert**, nicht überschrieben: Vites Dateinamen tragen
 * eine Prüfsumme, und ein bloßes Darüberkopieren ließe die Bündel aller
 * früheren Bauläufe für immer im Paket liegen.
 */
export function stageTaskpane({ target, build = true }) {
  if (build) {
    buildAddin();
  }

  if (!existsSync(addinDist) || !statSync(addinDist).isDirectory()) {
    fail(
      `Das Add-in hat kein Bündel hinterlassen: ${relative(repoRoot, addinDist)} gibt es nicht.\n` +
        'Nachzuvollziehen mit: pnpm --filter @takt/outlook-addin build',
    );
  }

  rmSync(target, { recursive: true, force: true });
  mkdirSync(dirname(target), { recursive: true });
  cpSync(addinDist, target, { recursive: true });

  const { files, referenced } = verifyStage(target);
  note(
    `${relative(repoRoot, target)}: ${files.count} Datei(en), ` +
      `${Math.round(files.bytes / 1024)} KiB, ${referenced} örtliche Verweise geprüft`,
  );

  return target;
}

// ---------------------------------------------------------------------------
// Aufruf von der Befehlszeile
// ---------------------------------------------------------------------------

const isCli = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const args = process.argv.slice(2);
  const dev = args.includes('--dev');
  const build = !args.includes('--no-build');

  const target = dev ? join(cargoTargetDir(), 'debug', TASKPANE_DIR_NAME) : stagingDir;

  process.stdout.write(
    dev
      ? 'Aufgabenbereich für den Entwicklungsbetrieb bereitstellen (neben die Binärdatei von `tauri dev`)\n'
      : 'Aufgabenbereich für die Auslieferung bereitstellen (Vorlage für `tauri build`)\n',
  );

  stageTaskpane({ target, build });

  process.stdout.write(
    dev
      ? 'Fertig. Der Dienst meldet beim Start `Der Aufgabenbereich des Add-ins liegt unter https://localhost:17844.`\n'
      : 'Fertig. `tauri build` nimmt diesen Ordner neben die Binärdatei ins Paket.\n',
  );
}
