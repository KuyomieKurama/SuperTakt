import { cargoTargetDir } from './rust-target.mjs';
/** Das frisch gebaute Add-in muss auch bei `tauri dev` neben dem Sidecar liegen.
 * `--no-build` ist nur für Prüfläufe mit bereits gebautem Add-in vorgesehen. */

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

// Aufruf von der Befehlszeile

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

  if (dev) {
    // Tauri copies bundle resources into target/debug during startup. Refresh
    // that source too, otherwise it overwrites the new task pane with an old one.
    stageTaskpane({ target: stagingDir, build });
    stageTaskpane({ target, build: false });
  } else {
    stageTaskpane({ target, build });
  }

  process.stdout.write(
    dev
      ? 'Fertig. Der Dienst meldet beim Start `Der Aufgabenbereich des Add-ins liegt unter https://localhost:17844.`\n'
      : 'Fertig. `tauri build` nimmt diesen Ordner neben die Binärdatei ins Paket.\n',
  );
}
