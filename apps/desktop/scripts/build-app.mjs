/**
 * Takt — der Bauaufruf der Anwendung.
 *
 * Wäre nur `tauri build`, gäbe es diese Datei nicht. Es sind zwei Zeilen mehr,
 * und beide sind Befunde aus dieser Aufgabe. Beide betreffen **nur den
 * AppImage-Schritt unter Linux** und damit den Entwicklungsrechner, nicht die
 * Auslieferung an den Auftraggeber — die ist Windows und NSIS.
 *
 * **`NO_STRIP=true`.** Der AppImage-Schritt ruft `linuxdeploy`, und das bringt
 * ein eigenes, eingefrorenes `strip` von 2024 mit. Auf einer Verteilung mit
 * rollender Aktualisierung tragen die Systembibliotheken inzwischen den
 * Abschnitt `.relr.dyn`, den dieses `strip` nicht kennt. Der Bau bricht dann
 * mit rund hundert Zeilen
 * `Strip call failed: ... unknown type [0x13] section '.relr.dyn'` ab und
 * meldet nach außen nur `failed to run linuxdeploy` — eine Meldung, aus der
 * niemand die Ursache errät. Ohne den Strip-Lauf gelingt der Bau; die
 * mitgelieferten Bibliotheken sind dann größer.
 *
 * **`APPIMAGE_EXTRACT_AND_RUN=1`.** `linuxdeploy` ist selbst ein AppImage und
 * hängt sich zum Ausführen über FUSE ein. Wo das nicht geht — Container,
 * eingeschränkte Sitzung, kein `fuse2` —, schlägt es aus einem zweiten,
 * gleich unauffälligen Grund fehl. Mit dieser Variablen entpackt es sich
 * stattdessen in einen Zwischenordner.
 *
 * **Beide werden nur unter Linux gesetzt.** Unter Windows und macOS haben sie
 * keine Bedeutung; sie dort trotzdem zu setzen wäre eine Zeile, die jemand
 * später sucht und nicht versteht.
 *
 * Weitere Argumente werden durchgereicht: `pnpm --filter @takt/desktop app:build
 * -- --bundles deb` baut nur das Debian-Paket.
 *
 * ## Die dritte Zeile mehr: der Aufgabenbereich (T-054)
 *
 * `tauri build` nimmt den Ordner `src-tauri/taskpane/` ins Paket — neben die
 * Sidecar-Binärdatei, weil der Dienst ihn nur dort sucht. Fehlt der Ordner,
 * findet der Glob in `tauri.conf.json` nichts, das Paket entsteht trotzdem, und
 * beim Kunden meldet der Dienst „Es liegt kein Bündel vor": Das Add-in ist
 * installiert und tot.
 *
 * Genau dieser Fall war T-054. Deshalb wird hier **vor** dem Bau geprüft, dass
 * der Ordner da und vollständig ist, und der Bau bricht sonst ab. Ein Paket
 * ohne Aufgabenbereich soll gar nicht erst entstehen — ein unvollständiges
 * Erzeugnis, das aussieht wie ein vollständiges, ist teurer als ein Bau, der
 * anhält.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

import { stagingDir } from './build-taskpane.mjs';

const require_ = createRequire(import.meta.url);
const cli = require_.resolve('@tauri-apps/cli/tauri.js');

// ---------------------------------------------------------------------------
// Vor dem Bau: liegt der Aufgabenbereich bereit? (T-054)
// ---------------------------------------------------------------------------

const taskpaneIndex = join(stagingDir, 'index.html');
if (!existsSync(stagingDir) || !statSync(stagingDir).isDirectory() || !existsSync(taskpaneIndex)) {
  process.stderr.write(
    `\nFEHLER: Der Aufgabenbereich des Add-ins liegt nicht bereit.\n\n` +
      `Erwartet: ${relative(process.cwd(), stagingDir)}/index.html\n\n` +
      `Ohne diesen Ordner entsteht ein Paket, in dem das Outlook-Add-in nicht\n` +
      `benutzbar ist — der Dienst meldet beim Start „Es liegt kein Bündel vor."\n` +
      `und läuft weiter, das Paket sieht vollständig aus. Genau das war T-054.\n\n` +
      `Bereitstellen mit:\n` +
      `  pnpm --filter @takt/desktop taskpane\n\n` +
      `Die vollständige Kette macht das von selbst:\n` +
      `  pnpm desktop:build\n`,
  );
  process.exit(1);
}

const env = { ...process.env };
if (process.platform === 'linux') {
  env['NO_STRIP'] = 'true';
  env['APPIMAGE_EXTRACT_AND_RUN'] = '1';
}

const result = spawnSync(process.execPath, [cli, 'build', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});

process.exit(result.status ?? 1);
