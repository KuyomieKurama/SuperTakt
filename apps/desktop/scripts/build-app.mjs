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
 *
 * ## Die vierte: die Lizenzbeilage (T-068, T-075)
 *
 * Dieselbe Prüfung noch einmal, für `src-tauri/licenses/`. T-068 hat gemessen,
 * dass die gebauten Bündel **null** Lizenzbanner enthalten — der Bündler
 * entfernt sie. Solange nur hier gebaut wird, ist das folgenlos. Ein Release
 * ist Weitergabe, und ab da verlangen MIT, Apache-2.0 §4(a) und MPL-2.0 §3.2
 * jeweils etwas, das mitgehen muss. Fehlt der Ordner, bricht der Bau ab.
 *
 * ## Die fünfte: die Fassung des Erzeugnisses (T-075)
 *
 * `tauri.conf.json` trägt `0.0.0`. Aus einem Etikett gebaut, muss das Paket die
 * Fassung des Etiketts tragen — sonst sind zwei Auslieferungen für `dpkg`
 * dieselbe. Der Wert kommt über `TAKT_RELEASE_VERSION` und wird Tauri als
 * zweite Konfigurationsdatei übergeben, **nicht** in `tauri.conf.json`
 * geschrieben: Dort stehen Kommentare, an denen E-043 hängt, und ein Werkzeug,
 * das die Datei neu schreibt, wirft sie weg.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stagingDir } from './build-taskpane.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const tauriDir = join(appDir, 'src-tauri');

const require_ = createRequire(import.meta.url);
const cli = require_.resolve('@tauri-apps/cli/tauri.js');

function fail(message) {
  process.stderr.write(`\nFEHLER: ${message}\n`);
  process.exit(1);
}

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

// ---------------------------------------------------------------------------
// Vor dem Bau: liegt die Lizenzbeilage bereit? (T-068, T-075)
// ---------------------------------------------------------------------------
//
// Dieselbe Sorte Prüfung wie beim Aufgabenbereich und aus demselben Grund: Das
// Paket entsteht auch ohne die Beilage und sieht vollständig aus. Nur ist es
// dann eines, das weitergegeben wird, ohne die Lizenztexte mitzugeben, die MIT,
// Apache-2.0 und MPL-2.0 wörtlich verlangen. Solange nur hier gebaut wird, ist
// das folgenlos; ein Release ist Weitergabe.

const licensesDir = join(tauriDir, 'licenses');
const licenseFile = join(licensesDir, 'THIRD-PARTY-LICENSES.txt');
if (!existsSync(licenseFile)) {
  fail(
    `Die Lizenzbeilage liegt nicht bereit.\n\n` +
      `Erwartet: ${relative(process.cwd(), licenseFile)}\n\n` +
      `Ohne sie entsteht ein Paket ohne die Lizenztexte der mitgelieferten\n` +
      `Fremdbestandteile. Das Paket sieht vollständig aus; die Auflagen aus MIT\n` +
      `(Hinweis und Erlaubnistext in jeder Kopie), Apache-2.0 §4(a) (Kopie des\n` +
      `Lizenztextes) und MPL-2.0 §3.2 (Hinweis auf die Quelltextverfügbarkeit)\n` +
      `sind dann nicht erfüllt.\n\n` +
      `Erzeugen mit:\n` +
      `  pnpm --filter @takt/desktop licenses\n\n` +
      `Die vollständige Kette macht das von selbst:\n` +
      `  pnpm desktop:build\n`,
  );
}

// ---------------------------------------------------------------------------
// Die Fassung des Erzeugnisses (T-075)
// ---------------------------------------------------------------------------
//
// `tauri.conf.json` trägt `"version": "0.0.0"` — der Entwicklungswert. Wird aus
// einem Etikett heraus veröffentlicht, muss das Erzeugnis die Fassung des
// Etiketts tragen: Sie steht in den Eigenschaften des NSIS-Installers, in der
// Steuerdatei der `.deb` und im Dateinamen. Zwei Auslieferungen mit derselben
// Fassungsnummer sind für `dpkg` dieselbe Fassung, und der Installer weigert
// sich zu aktualisieren.
//
// Der Wert kommt über `TAKT_RELEASE_VERSION` herein und wird **nicht** in
// `tauri.conf.json` geschrieben. Diese Datei ist JSON5 mit Kommentaren, und in
// ihr steht die Begründung zu `useHttpsScheme` (E-043) — ein Werkzeug, das sie
// neu schreibt, wirft die Kommentare weg. Stattdessen bekommt Tauri eine zweite
// Datei über `--config`; die Kommandozeile legt beide übereinander. Die Datei im
// Repository bleibt unangetastet.
//
// Ohne die Variable baut alles wie bisher mit `0.0.0`. Der Entwicklungsbau soll
// nicht so aussehen, als wäre er eine Auslieferung.

const rawVersion = process.env['TAKT_RELEASE_VERSION'];
const extraArguments = [];

// **Die Form ist zeichengleich die der Domäne** (Befund T-143 S-2).
//
// Bis T-147 stand hier `/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/` — dieselbe Gestalt,
// aber **ohne** die Schranken `{1,9}` und `{1,64}` aus `VERSION_SHAPE`
// (`packages/domain/src/version.ts`). Ein Etikett `v1234567890.0.0` baute damit
// durch: Das Erzeugnis trug die Zahl, `takt_installed_version` gab sie heraus,
// `checkVersion` wies sie danach als `malformed` ab, und `decideUpdateNotice`
// lieferte dauerhaft `{ show: false, reason: 'unknown' }`. Die Versionsprüfung
// dieses Erzeugnisses hätte sich **nie** gemeldet — still, ohne Protokollzeile,
// nicht von „alles aktuell" zu unterscheiden. Dieselbe Fassung wiese auch
// `takt_open_release` ab.
//
// Der Ausdruck aus `@takt/domain` einzubinden wäre der bessere Weg. Das Paket
// liefert `.ts` und keine übersetzte Fassung, und eine Abhängigkeit in
// `apps/desktop/package.json` einzutragen ist eine Entscheidung des
// Orchestrators (offene Frage 2 aus T-143). Bis dahin gilt die zweite Hälfte
// derselben Auflage: **gemessen statt aufgelöst.** `proof:shell-surface`
// vergleicht diese Zeile zeichengleich mit `VERSION_SHAPE` und wird rot, sobald
// die beiden auseinanderlaufen.
const VERSION_SHAPE = /^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$/;

if (typeof rawVersion === 'string' && rawVersion.trim() !== '') {
  const version = rawVersion.trim().replace(/^v/, '');
  if (!VERSION_SHAPE.test(version)) {
    fail(
      `TAKT_RELEASE_VERSION="${rawVersion}" ist keine brauchbare Fassungsangabe.\n` +
        `Erwartet wird X.Y.Z, wahlweise mit Vorabkennung (1.2.3, 1.2.3-rc.1);\n` +
        `jede Zahl höchstens neunstellig, die Vorabkennung höchstens 64 Zeichen —\n` +
        `dieselbe Form wie VERSION_SHAPE in packages/domain/src/version.ts.\n` +
        `Ein führendes „v" wird abgeschnitten, alles andere nicht geraten.`,
    );
  }

  const overlay = join(tauriDir, '.release-config.json');
  writeFileSync(overlay, `${JSON.stringify({ version }, null, 2)}\n`, 'utf8');
  extraArguments.push('--config', overlay);
  process.stdout.write(`Fassung dieses Erzeugnisses: ${version} (aus TAKT_RELEASE_VERSION)\n`);
} else {
  process.stdout.write(`Fassung dieses Erzeugnisses: aus tauri.conf.json (kein TAKT_RELEASE_VERSION gesetzt)\n`);
}

const env = { ...process.env };
if (process.platform === 'linux') {
  env['NO_STRIP'] = 'true';
  env['APPIMAGE_EXTRACT_AND_RUN'] = '1';
}

const result = spawnSync(process.execPath, [cli, 'build', ...extraArguments, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});

process.exit(result.status ?? 1);
