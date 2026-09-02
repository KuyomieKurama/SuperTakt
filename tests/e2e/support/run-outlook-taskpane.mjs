#!/usr/bin/env node
/**
 * Takt — startet den echten Aufgabenbereich-Port aus `apps/local-api` gegen
 * das gebaute `apps/outlook-addin`-Bündel (T-055).
 *
 * Läuft als eigener Kindprozess, nicht als Import in einer Playwright-Datei:
 * `apps/local-api/src/taskpane/server.ts` importiert intern mit `.ts`-Endung
 * (`from '../config.ts'` usw.), so wie `apps/local-api/scripts/proof-taskpane.mjs`
 * es vormacht. Playwrights eigener esbuild-Transform für Testdateien ist dafür
 * nicht der richtige Ort — ein eigener, mit `node` gestarteter Prozess (Node
 * 22 löst `.ts`-Importe nativ auf, siehe `package.json#engines`) ist derselbe
 * Weg, den `tests/e2e/support/services.ts` für den lokalen Dienst selbst schon
 * geht.
 *
 * Startet `startTaskpaneServer()` **unverändert aus dem Quelltext** — das ist
 * dieselbe Funktion, die T-053 bereits repariert und mit `sidecar:verify`
 * gegen ein nachgebautes Installationsbild geprüft hat. Der Unterschied zu
 * `sidecar:verify` ist die `root`-Angabe: Dort liegt eine erzeugte Attrappe
 * (`buildInstallation`, zwei Zeilen HTML/JS), hier das tatsächliche
 * `vite build`-Ergebnis von `apps/outlook-addin`.
 *
 * Umgebungsvariablen (von `global-setup-outlook-build.ts` gesetzt):
 *   TAKT_TASKPANE_ROOT      Wurzel der auszuliefernden Dateien (apps/outlook-addin/dist)
 *   TAKT_TASKPANE_APPDATA   Ablageort für Schlüssel/Zertifikat dieses Laufs
 *   TAKT_TASKPANE_PORT      Portnummer (17944 in diesem Lauf, siehe build-check-session.ts)
 *
 * Meldet auf `stdout` genau eine Zeile `BEREIT <port>`, sobald der Port
 * offen ist, oder `FEHLER <Nachricht>` und beendet sich mit Exitcode 1.
 */

import { mkdir } from 'node:fs/promises';

const root = process.env['TAKT_TASKPANE_ROOT'];
const appDataDir = process.env['TAKT_TASKPANE_APPDATA'];
const port = Number(process.env['TAKT_TASKPANE_PORT']);

if (root === undefined || appDataDir === undefined || Number.isNaN(port)) {
  console.log('FEHLER Umgebungsvariablen TAKT_TASKPANE_ROOT/TAKT_TASKPANE_APPDATA/TAKT_TASKPANE_PORT fehlen.');
  process.exit(1);
}

const { startTaskpaneServer } = await import('../../../apps/local-api/src/taskpane/server.ts');

const quietLogger = {
  lifecycle: (level, message) => {
    // Auf stderr, damit `stdout` ausschließlich die eine `BEREIT`/`FEHLER`-Zeile
    // trägt, auf die der globale Aufbau wartet (`waitFor`-Muster wie in
    // `services.ts`, dort über HTTP statt über eine Protokollzeile, weil der
    // erste Verbindungsversuch hier ohnehin TLS braucht).
    console.error(`[taskpane] ${level} ${message}`);
  },
  request: () => {},
};

try {
  await mkdir(appDataDir, { recursive: true, mode: 0o700 });

  const server = await startTaskpaneServer({ appDataDir, port, root, logger: quietLogger });

  if (server === null) {
    console.log(`FEHLER startTaskpaneServer lieferte null — Bündel fehlt oder Port ${port} ist belegt.`);
    process.exit(1);
  }

  console.log(`BEREIT ${server.port}`);

  const shutdown = () => {
    server.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.log(`FEHLER ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  process.exit(1);
}
