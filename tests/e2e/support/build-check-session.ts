/**
 * Takt — feste Werte für die Bauergebnis-Prüfungen aus T-055.
 *
 * Getrennt von `session.ts`, weil dort ausdrücklich der Weg über den
 * Entwicklungsserver steht (Port 5173, `vite`) — hier geht es um das Ergebnis
 * von `vite build`, statisch serviert. Wo eine Portnummer mit `session.ts`
 * übereinstimmt (5173 für `apps/web`), ist das Absicht und unten begründet;
 * wo sie abweicht (17944 statt 17844 für den Aufgabenbereich), ebenfalls.
 */

import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * `apps/web` wird nach dem Bau auf **demselben** Port wie der
 * Entwicklungsserver serviert (127.0.0.1:5173), nicht auf `vite preview`s
 * Vorgabe 4173.
 *
 * Grund: `apps/local-api/src/config.ts#ALLOWED_ORIGINS` lässt für die
 * Oberfläche ausschließlich `http://127.0.0.1:5173`/`http://localhost:5173`
 * zu (B-1.5 wörtlich zitiert in `tests/e2e/support/session.ts`). Ein Bau, der
 * auf 4173 liefe, würde von der Herkunftsprüfung des Dienstes abgewiesen —
 * das wäre ein Fehler dieses Testaufbaus, nicht des gebauten Bündels, und
 * würde die eigentliche Frage (verhält sich das *Bauergebnis* anders als der
 * Entwicklungsserver?) mit einem selbstgemachten Rauschen überdecken. Beide
 * Ports werden nacheinander benutzt, nie gleichzeitig — wie schon zwischen
 * der Wurzel-`playwright.config.ts` und `tests/e2e/playwright.config.ts`.
 */
export const WEB_BUILD_BASE_URL = 'http://127.0.0.1:5173';

/**
 * Der Aufgabenbereich läuft für diese Prüfung auf 17944, **nicht** auf dem
 * produktiven 17844.
 *
 * Derselbe Grund, den `apps/local-api/scripts/proof-taskpane.mjs` schon
 * nennt: Diese Maschine fährt mehrere Team-Agenten gleichzeitig, und ein
 * echter, gerade laufender Sidecar könnte 17844 belegt halten. Die
 * Content-Security-Policy des Add-ins nennt `connect-src` nur für die
 * API (127.0.0.1:17843), nicht für den Port, auf dem der Aufgabenbereich
 * selbst liegt — die Portwahl hier hat deshalb keinen Einfluss auf das, was
 * TP-BUILD-03/04 tatsächlich prüfen.
 */
export const OUTLOOK_TASKPANE_PORT = 17944;
export const OUTLOOK_TASKPANE_BASE_URL = `https://127.0.0.1:${OUTLOOK_TASKPANE_PORT}`;

/** Wegwerfverzeichnis für Schlüssel/Zertifikat dieses Laufs — nicht das der echten Anwendung. */
export const OUTLOOK_TASKPANE_APP_DATA_DIR = join(tmpdir(), 'takt-e2e-outlook-taskpane-appdata');

/** Wurzel des ausgelieferten Bündels: das echte `vite build`-Ergebnis, keine Attrappe. */
export const OUTLOOK_ADDIN_DIST_DIR = new URL(
  '../../../apps/outlook-addin/dist',
  import.meta.url,
).pathname;

export const WEB_APP_DIST_DIR = new URL('../../../apps/web/dist', import.meta.url).pathname;

export const REPO_ROOT = new URL('../../../', import.meta.url).pathname;
