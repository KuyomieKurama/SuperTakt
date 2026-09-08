/**
 * Takt — Start/Stop/Neustart des lokalen Dienstes für die Versionsprüfung im
 * End-zu-Ende-Lauf (T-142, `TP-VER-10` bis `TP-VER-13`).
 *
 * Startet `version-check-entry.ts` (nicht `apps/local-api/src/index.ts`) als
 * eigenen Kindprozess — dieselbe Bauart wie `services.ts#startLocalApi`
 * (Handschlag über `stdin`, Warten auf `/health`, acht Versuche mit
 * wachsendem Rückstand gegen eine kurze fremde Portbelegung), nur mit einer
 * zweiten Umgebungsvariable, die ausschließlich dieser Testeinstieg kennt
 * (`TAKT_E2E_GITHUB_STUB_URL`) und mit einem eigenen, von der übrigen
 * Testreihe getrennten Datenverzeichnis.
 *
 * **Warum ein eigenes Datenverzeichnis und nicht `E2E_DATA_DIR`.** Diese Datei
 * läuft nie gleichzeitig mit `services.ts` (eigene Ausführungskonfiguration,
 * `playwright.version-check.config.ts`, derselbe Grund wie bei
 * `playwright.web-build.config.ts`: beide binden Port 17843 exklusiv). Ein
 * eigener Ordner ist trotzdem richtig: `TP-VER-11`/`-12` starten den Dienst
 * mehrfach **innerhalb derselben Testdatei** neu, ohne das Verzeichnis
 * dazwischen zu leeren — die übersprungene Fassung muss den Neustart
 * überleben (R-20). Ein gemeinsamer Ordner mit der übrigen Testreihe wäre
 * hier nur zufällig richtig.
 *
 * **Warum ein eigener Vite-Entwicklungsserver-Start statt eines Imports aus
 * `services.ts`.** `startWeb()` dort ist unexportiert, mit Absicht (T-055:
 * „bleibt unexportiert und unverändert — sie startet ausdrücklich den
 * Entwicklungsserver"). Eine zusätzliche Ausfuhr wäre eine Änderung an einer
 * Datei, von der 20 andere Testdateien abhängen, für einen Bedarf, der sich
 * ohne sie deckt — hier steht deshalb eine eigene, absichtlich sehr kleine
 * Kopie, nicht eine Erweiterung der gemeinsamen.
 */

import { spawn, type ChildProcessByStdio, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

import { SESSION_SECRET, TOKEN_HEADER, WEB_BASE_URL, WINDOWS_USER } from './session';

const REPO_ROOT = new URL('../../../', import.meta.url).pathname;

export const VERSION_CHECK_API_BASE_URL = 'http://127.0.0.1:17843/api/v1';
export const E2E_VERSION_CHECK_DATA_DIR = join(tmpdir(), 'takt-e2e-version-check-data');

type ChildProcessWithoutStdin = ChildProcessByStdio<null, Readable, Readable>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check: () => Promise<boolean>, timeoutMs: number, label: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(150);
  }
  throw new Error(`Zeitüberschreitung beim Warten auf: ${label}. Letzter Fehler: ${String(lastError)}`);
}

/**
 * Startet `version-check-entry.ts` gegen die angegebene GitHub-Attrappe.
 *
 * `resetData`: beim ersten Start eines Testlaufs `true` (frisches Verzeichnis,
 * wie `services.ts#startLocalApi`), bei einem **Neustart** innerhalb derselben
 * Testdatei (`TP-VER-11`/`-12`) `false` — sonst wäre „übersprungen" nach dem
 * Neustart weg, und genau das soll dieser Fall widerlegen, nicht erzeugen.
 */
export async function startVersionCheckService(
  githubStubUrl: string,
  resetData: boolean,
): Promise<ChildProcessWithoutNullStreams> {
  if (resetData) {
    await rm(E2E_VERSION_CHECK_DATA_DIR, { recursive: true, force: true });
  }
  await mkdir(E2E_VERSION_CHECK_DATA_DIR, { recursive: true });

  const attempts = 8;
  let lastLog = '';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const child = spawn('node', ['tests/e2e/support/version-check-entry.ts'], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        XDG_DATA_HOME: E2E_VERSION_CHECK_DATA_DIR,
        TAKT_E2E_GITHUB_STUB_URL: githubStubUrl,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let log = '';
    child.stdout.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));
    child.stderr.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));

    child.stdin.write(`${SESSION_SECRET}\n${WINDOWS_USER}\n`);

    const exitedEarly = new Promise<boolean>((resolve) => {
      child.once('exit', () => resolve(true));
    });

    const ready = waitFor(async () => {
      const response = await fetch(`${VERSION_CHECK_API_BASE_URL}/health`, {
        headers: { Origin: WEB_BASE_URL, [TOKEN_HEADER]: SESSION_SECRET },
      }).catch(() => null);
      return response !== null && response.ok;
    }, 4_000, 'version-check-entry.ts antwortet auf /health').then(
      () => true,
      () => false,
    );

    const outcome = await Promise.race([
      ready.then((ok) => (ok ? 'ready' : 'timeout')),
      exitedEarly.then(() => 'exited'),
    ]);

    if (outcome === 'ready') {
      return child;
    }

    lastLog = log;
    child.kill('SIGTERM');
    await sleep(500 * attempt);
  }

  throw new Error(`version-check-entry.ts kam nach ${attempts} Versuchen nicht hoch. Letzte Ausgabe:\n${lastLog}`);
}

/**
 * Beendet den Dienst und wartet, bis der Port wieder frei ist — derselbe
 * Ablauf wie `services.ts#stopServices`, hier einzeln, weil `TP-VER-11`/`-12`
 * mehrfach neu starten, ohne dass Vite mitbeendet wird.
 */
export async function stopVersionCheckService(child: ChildProcessWithoutNullStreams): Promise<void> {
  child.kill('SIGTERM');
  await sleep(300);
}

/** Eigene, kleine Kopie von `services.ts#startWeb` — Begründung im Dateikopf. */
export async function startVersionCheckWeb(): Promise<ChildProcessWithoutStdin> {
  const child = spawn('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: `${REPO_ROOT}apps/web`,
    env: {
      ...process.env,
      VITE_TAKT_BASE_URL: VERSION_CHECK_API_BASE_URL,
      VITE_TAKT_TOKEN: SESSION_SECRET,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let log = '';
  child.stdout.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));
  child.stderr.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));

  try {
    await waitFor(async () => {
      const response = await fetch(WEB_BASE_URL).catch(() => null);
      return response !== null && response.ok;
    }, 15_000, 'Vite-Entwicklungsserver antwortet auf 5173');
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`${String(error)}\nAusgabe:\n${log}`);
  }

  return child;
}

export function stopVersionCheckWeb(child: ChildProcessWithoutStdin): void {
  child.kill('SIGTERM');
}

/**
 * Wartet, bis der Dienst eine Fassung ermittelt hat (`state: "known"`) —
 * serverseitig, ohne die Oberfläche zu bemühen. Trennt „der Dienst hat
 * geprüft" von „die Oberfläche hat es gelesen": Erst danach lohnt sich ein
 * `page.reload()`, und ein Fehlschlag hier zeigt eindeutig auf den Dienst statt
 * auf einen möglicherweise falschen Selektor in der Oberfläche.
 */
export async function waitForKnownVersionCheckState(timeoutMs = 20_000): Promise<{ latestVersion: string }> {
  let last: unknown = null;
  await waitFor(async () => {
    const response = await fetch(`${VERSION_CHECK_API_BASE_URL}/version-check`, {
      headers: { Origin: WEB_BASE_URL, [TOKEN_HEADER]: SESSION_SECRET },
    });
    const envelope = (await response.json()) as { data: { state: string; latestVersion: string | null } };
    last = envelope.data;
    return envelope.data.state === 'known';
  }, timeoutMs, 'Versionsprüfung liefert state="known"').catch((error: unknown) => {
    throw new Error(`${String(error)} — zuletzt gelesen: ${JSON.stringify(last)}`);
  });
  const response = await fetch(`${VERSION_CHECK_API_BASE_URL}/version-check`, {
    headers: { Origin: WEB_BASE_URL, [TOKEN_HEADER]: SESSION_SECRET },
  });
  const envelope = (await response.json()) as { data: { state: string; latestVersion: string | null } };
  if (envelope.data.latestVersion === null) {
    throw new Error('state="known", aber latestVersion ist null — das darf laut A-V-14 nicht vorkommen.');
  }
  return { latestVersion: envelope.data.latestVersion };
}
