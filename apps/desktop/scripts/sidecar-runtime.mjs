/**
 * Takt — die Laufzeit, die in der Sidecar-Binärdatei steckt (E-004, E-035, R-04).
 *
 * ## Warum überhaupt eine eigene Laufzeit und nicht die vom Rechner
 *
 * Zwei Gründe, einer davon ein Befund aus dieser Aufgabe.
 *
 * **Der fachliche:** E-035 wählt `node:sqlite`, weil es Teil der Laufzeit ist
 * und nichts ins Bündel zieht. Das Modul gibt es erst ab Node 22.5. Eine
 * Binärdatei, die ein installiertes Node voraussetzt, scheitert damit auf jedem
 * Rechner, auf dem eine ältere Fassung steht — und zwar erst beim ersten
 * Datenbankzugriff.
 *
 * **Der handfeste:** Die Node-Binärdatei dieses Rechners (Arch Linux,
 * `/usr/bin/node`, gestrippt) lässt sich **nicht** zu einer Einzeldatei-
 * Anwendung machen. `postject` meldet beim Einfügen
 * `warning: Can't find string offset for section name '.note'`, schreibt die
 * Datei trotzdem, und die entstandene Binärdatei stirbt beim Start mit
 * SIGSEGV (Exitcode 139) — vor jeder Zeile JavaScript. Mit der offiziellen
 * Binärdatei von nodejs.org derselben Fassung tritt der Fehler nicht auf.
 * Das ist der Grund, warum hier heruntergeladen und nicht kopiert wird.
 *
 * ## Warum das die Lieferkette nicht aufweicht
 *
 * Die Prüfsumme jeder unterstützten Plattform steht **hier im Repository**,
 * nicht in einer Datei, die mitheruntergeladen wird. Wer die Auslieferung von
 * nodejs.org übernimmt, kommt damit nicht durch: Der Bauablauf bricht ab, bevor
 * ein Byte in die Anwendung gelangt. Eine neue Node-Fassung ist eine sichtbare
 * Änderung an dieser Datei und keine stille Verschiebung beim nächsten Bau —
 * dieselbe Haltung wie bei den festen Fassungen in `apps/local-api`.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Die eingebettete Node-Fassung. Bewusst dieselbe, unter der entwickelt und
 * geprüft wird — sonst prüft niemand, was ausgeliefert wird.
 */
export const NODE_VERSION = '22.23.2';

/**
 * SHA-256 der offiziellen Archive, abgeschrieben aus
 * `https://nodejs.org/dist/v22.23.2/SHASUMS256.txt`.
 *
 * Wer die Fassung erhöht, ersetzt **alle** Einträge und schreibt in den
 * Änderungshinweis, woher sie stammen. Ein einzelner nachgezogener Eintrag ist
 * genau der Fall, in dem später niemand mehr weiß, welche Zeile geprüft wurde.
 */
const ARCHIVES = Object.freeze({
  'x86_64-unknown-linux-gnu': {
    file: `node-v${NODE_VERSION}-linux-x64.tar.xz`,
    sha256: 'd60acfe00a2932254bb0ad20e01b0d74397a0875595de719654b214f4b03f307',
    member: `node-v${NODE_VERSION}-linux-x64/bin/node`,
    binary: 'node',
  },
  'aarch64-unknown-linux-gnu': {
    file: `node-v${NODE_VERSION}-linux-arm64.tar.xz`,
    sha256: 'fff4078c5def658577f92c88db7db3bc0072924bfb93fe52c1e744a54e94abb8',
    member: `node-v${NODE_VERSION}-linux-arm64/bin/node`,
    binary: 'node',
  },
  'x86_64-pc-windows-msvc': {
    file: `node-v${NODE_VERSION}-win-x64.zip`,
    sha256: '1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97',
    member: `node-v${NODE_VERSION}-win-x64/node.exe`,
    binary: 'node.exe',
  },
  'aarch64-pc-windows-msvc': {
    file: `node-v${NODE_VERSION}-win-arm64.zip`,
    sha256: 'fec025a6da31757e3b6af84c5a1628e9d38442ca99a2161091d78f2fcfa35ef3',
    member: `node-v${NODE_VERSION}-win-arm64/node.exe`,
    binary: 'node.exe',
  },
  'aarch64-apple-darwin': {
    file: `node-v${NODE_VERSION}-darwin-arm64.tar.xz`,
    sha256: '5eff7a9011895aae3f29d06f167b84a62b028a591370c7cafb59103559fd26e1',
    member: `node-v${NODE_VERSION}-darwin-arm64/bin/node`,
    binary: 'node',
  },
  'x86_64-apple-darwin': {
    file: `node-v${NODE_VERSION}-darwin-x64.tar.xz`,
    sha256: '96dff79f4e19a78715da559ec7cac2028f4985a175ea0c3454625a269c21deb7',
    member: `node-v${NODE_VERSION}-darwin-x64/bin/node`,
    binary: 'node',
  },
});

export class RuntimeError extends Error {}

/**
 * Legt die Laufzeit für ein Ziel-Tripel bereit und gibt den Pfad zurück.
 *
 * Einmal heruntergeladen bleibt sie im Zwischenspeicher liegen; der nächste Bau
 * geht ohne Netz. Die Prüfsumme wird trotzdem **jedes Mal** gerechnet — eine
 * Datei im Zwischenspeicher ist keine vertrauenswürdige Datei.
 */
export async function ensureRuntime(triple, cacheDir, log) {
  const archive = ARCHIVES[triple];
  if (archive === undefined) {
    throw new RuntimeError(
      `Für das Ziel-Tripel \`${triple}\` ist keine Node-Laufzeit hinterlegt.\n` +
        `Bekannt sind: ${Object.keys(ARCHIVES).join(', ')}.\n` +
        `Eine neue Plattform braucht einen Eintrag mit Prüfsumme in scripts/sidecar-runtime.mjs.`,
    );
  }

  mkdirSync(cacheDir, { recursive: true });
  const archivePath = join(cacheDir, archive.file);
  const runtimePath = join(cacheDir, `${triple}-${archive.binary}`);

  if (!existsSync(archivePath)) {
    const url = `https://nodejs.org/dist/v${NODE_VERSION}/${archive.file}`;
    log(`      lade ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new RuntimeError(`${url} antwortet mit ${response.status}.`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    // Erst unter einen Zwischennamen, dann umbenennen: Ein abgebrochener
    // Download darf beim nächsten Lauf nicht als fertige Datei gelten.
    const partial = `${archivePath}.teil`;
    writeFileSync(partial, bytes);
    renameSync(partial, archivePath);
  }

  const digest = createHash('sha256').update(readFileSync(archivePath)).digest('hex');
  if (digest !== archive.sha256) {
    rmSync(archivePath, { force: true });
    throw new RuntimeError(
      `Die Prüfsumme von ${archive.file} stimmt nicht.\n` +
        `  erwartet: ${archive.sha256}\n` +
        `  bekommen: ${digest}\n` +
        `Die Datei ist gelöscht. Das ist entweder ein beschädigter Download oder ein Befund.`,
    );
  }

  if (!existsSync(runtimePath)) {
    log(`      entpacke ${archive.member}`);
    // `tar` liegt auf allen drei Plattformen vor: unter Windows seit 10/1803
    // als bsdtar, das auch ZIP liest. Ein eigener Entpacker wäre mehr Code als
    // Nutzen.
    const extract = spawnSync('tar', ['-xf', archivePath, '-C', cacheDir, archive.member], {
      encoding: 'utf8',
    });
    if (extract.status !== 0) {
      throw new RuntimeError(`Entpacken ist fehlgeschlagen:\n${extract.stderr || extract.stdout}`);
    }
    renameSync(join(cacheDir, archive.member), runtimePath);
    rmSync(join(cacheDir, archive.member.split('/')[0]), { recursive: true, force: true });
  }

  return runtimePath;
}
