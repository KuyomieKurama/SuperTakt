/**
 * Takt — baut `apps/web` und serviert genau dieses Ergebnis statisch (T-055).
 *
 * Der Unterschied zu `services.ts#startWeb` ist der ganze Punkt dieser Datei:
 * Dort läuft `vite` als Entwicklungsserver, der Module bei jeder Anfrage neu
 * auflöst und `import.meta.env.DEV` mit `true` beantwortet. Hier läuft
 * `vite build` einmal vollständig durch (derselbe Befehl, den `pnpm build`
 * und jede Auslieferung ausführen), und `vite preview` liefert danach nur
 * noch die entstandenen Dateien aus — keine Transformation mehr, kein
 * Modulgraph, `import.meta.env.DEV` ist im Bündel bereits als `false`
 * ersetzt. Das ist genau die Achse, die T-053 als ungemessen benannt hat.
 *
 * `vite preview` und nicht ein selbstgeschriebener Server: Es ist Vite selbst,
 * das für „das Bauergebnis lokal ansehen" gebaut ist (eigene Dokumentation),
 * setzt dieselben Inhaltstypen wie ein echter Webserver und unterscheidet sich
 * darin nicht relevant von einem Auslieferungsserver — anders als bei
 * `apps/outlook-addin` (siehe `run-outlook-taskpane.mjs`) gibt es hier keinen
 * echten Auslieferungsweg, gegen den man stattdessen prüfen könnte: `apps/web`
 * wird von Tauris eigenem Protokoll ausgeliefert (`frontendDist`,
 * `tauri.conf.json`), und das ist mit Playwright nicht ansprechbar (siehe
 * Bericht, Punkt 3).
 *
 * **Seit T-060 zusätzlich:** `buildWebWithDesignsystem()` und die beiden
 * `dist`-Prüfhilfen (`distHasFile`, `distContainsText`). Der Anlass steht in
 * `web-build-smoke.spec.ts`, TP-BUILD-05 — hier nur die Begründung für den
 * Zusatz an `buildWeb()` selbst: Sie löscht `TAKT_DESIGNSYSTEM` jetzt
 * ausdrücklich aus der an `pnpm` übergebenen Umgebung, statt sie unbesehen
 * von der Elternumgebung zu übernehmen. Ohne das wäre der „ohne Variable"-Bau,
 * auf dem TP-BUILD-01/02/05 aufsetzen, von einer zufällig im Prozessbaum
 * gesetzten Variable abhängig gewesen — genau die Sorte Annahme, die T-060
 * gemessen statt geglaubt haben wollte.
 */

import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { REPO_ROOT, WEB_APP_DIST_DIR, WEB_BUILD_BASE_URL } from './build-check-session';

const execFileAsync = promisify(execFile);

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
 * `pnpm --filter @takt/web build` — derselbe Befehl aus `apps/web/package.json`,
 * den `pnpm build`/`pnpm check` ausführen. Kein Nachbau der Vite-Konfiguration
 * hier: Ein zweiter, angenommener Bauweg wäre selbst wieder eine Vermutung.
 */
export async function buildWeb(): Promise<void> {
  // Ausdrücklich entfernt statt unverändert durchgereicht (T-060) — siehe
  // Dateikopf. `{ ...process.env }` kopiert, damit `delete` nicht den
  // Prozess dieses Testlaufs selbst verändert.
  const env = { ...process.env };
  delete env['TAKT_DESIGNSYSTEM'];
  try {
    await execFileAsync('pnpm', ['--filter', '@takt/web', 'build'], {
      cwd: REPO_ROOT,
      maxBuffer: 16 * 1024 * 1024,
      env,
    });
  } catch (error) {
    const detail = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      `Der Bau von apps/web ist fehlgeschlagen — genau das wäre der Fund, den diese Aufgabe sucht.\n` +
        `${detail.stdout ?? ''}\n${detail.stderr ?? detail.message ?? String(error)}`,
    );
  }
}

/**
 * `pnpm --filter @takt/web build:designsystem` — derselbe Befehl, den
 * `apps/web/scripts/build-designsystem.mjs` für die Abnahme vorsieht (T-057).
 * Ausschließlich für die Gegenprobe aus T-060 (TP-BUILD-05) gedacht: Sie
 * belegt, dass das Fehlen der Musterseite im gewöhnlichen Bau tatsächlich an
 * `TAKT_DESIGNSYSTEM` liegt und nicht an etwas, das auch ohne die Variable
 * ausgeblieben wäre.
 */
export async function buildWebWithDesignsystem(): Promise<void> {
  try {
    await execFileAsync('pnpm', ['--filter', '@takt/web', 'build:designsystem'], {
      cwd: REPO_ROOT,
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    const detail = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      `Der Bau von apps/web mit TAKT_DESIGNSYSTEM=1 ist fehlgeschlagen.\n` +
        `${detail.stdout ?? ''}\n${detail.stderr ?? detail.message ?? String(error)}`,
    );
  }
}

/** Existiert eine Datei relativ zu `apps/web/dist`? Für TP-BUILD-05. */
export function distHasFile(relativePath: string): boolean {
  return existsSync(join(WEB_APP_DIST_DIR, relativePath));
}

/**
 * Durchsucht jede Datei unter `apps/web/dist` nach einem wörtlichen
 * Textstück. Für TP-BUILD-05: Eine fehlende `designsystem.html` allein
 * bewiese nur, dass *eine* Datei fehlt — nicht, dass ihr Inhalt nirgends
 * sonst im Bündel gelandet ist (etwa durch Bündelung in einen gemeinsamen
 * Chunk). Das ist der Unterschied zwischen „glauben" und „messen", den
 * dieser Fall verlangt.
 */
export function distContainsText(needle: string): boolean {
  if (!existsSync(WEB_APP_DIST_DIR)) return false;
  const stack: string[] = [WEB_APP_DIST_DIR];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (readFileSync(fullPath, 'utf8').includes(needle)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Liefert `apps/web/dist` auf demselben Port wie der Entwicklungsserver
 * (Begründung in `build-check-session.ts`). `--port`/`--host` auf der
 * Befehlszeile überschreiben `preview.port` aus `vite.config.ts` (4173).
 */
export async function startWebPreview(): Promise<ChildProcessWithoutNullStreams> {
  const child = spawn(
    'pnpm',
    ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
    {
      cwd: `${REPO_ROOT}apps/web`,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let log = '';
  child.stdout.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));
  child.stderr.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));

  try {
    await waitFor(async () => {
      const response = await fetch(WEB_BUILD_BASE_URL).catch(() => null);
      return response !== null && response.ok;
    }, 15_000, 'vite preview antwortet auf 5173');
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`${String(error)}\nAusgabe:\n${log}`);
  }

  return child;
}

export function stopChild(child: ChildProcessWithoutNullStreams): void {
  child.kill('SIGTERM');
}
