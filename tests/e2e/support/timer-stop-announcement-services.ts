/**
 * Takt — eigener, kleiner Vite-Start für die Neustart-Vorrichtung von
 * `timer-stop-announcement.spec.ts` (T-352, aus `T-350-domain-dev.md`
 * Abschnitt 5 und `T-351-spec-ux-reviewer.md`/`docs/testplan.md` Abschnitt 34).
 *
 * Dieselbe Begründung wie bei `attachment-persistence-services.ts` und
 * `version-check-services.ts#startVersionCheckWeb` (T-142/T-150):
 * `services.ts#startWeb` ist unexportiert, mit Absicht (T-055 — "bleibt
 * unexportiert und unverändert"), und `services.ts` trägt bereits viele
 * andere Testdateien. Eine zusätzliche Ausfuhr dort wäre eine Änderung an
 * gemeinsamer Infrastruktur für einen Bedarf, der sich mit einer kleinen,
 * eigenen Kopie ebenso deckt.
 *
 * Diese Datei startet **ausschließlich die Oberfläche**. Der lokale Dienst
 * selbst startet und startet neu **innerhalb** von
 * `timer-stop-announcement.spec.ts` (`test.beforeAll` bzw. in den drei
 * betroffenen Fällen über `services.ts#startLocalApi`/`restartLocalApi`,
 * beide bereits exportiert und unverändert wiederverwendet) — ein
 * `globalSetup` läuft in einem eigenen Prozess, ein dort gehaltenes
 * `ChildProcess` ist im Testprozess nicht mehr greifbar (dieselbe Lage wie
 * bei `TP-ANH-10`/`TP-VER-11`/`-12`).
 *
 * **Warum diese Datei überhaupt nötig ist:** `captureTimerRecovery`
 * (`apps/local-api/src/features/timer/timer.ts`) erfaßt eine verwaiste
 * Buchung **ausschließlich beim Start des Dienstprozesses** (E-036, seine
 * erste tatsächliche Umsetzung seit T-350). Ein über die rohe API gestarteter
 * Timer, den die geteilte Reihe der Hauptkonfiguration bereits laufen sieht,
 * kann dort nie mehr als verwaist gelten — die drei betroffenen Fälle
 * brauchen einen **echten** Dienst-Neustart nach dem Anlegen des Eintrags,
 * und ein Neustart mitten in der geteilten Reihe zöge jedem parallel oder
 * danach laufenden Fall den Dienst unter den Füßen weg (dieselbe Begründung
 * wie in `playwright.attachment-persistence.config.ts`).
 */

import { spawn, type ChildProcessByStdio } from 'node:child_process';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

import { API_BASE_URL, SESSION_SECRET, WEB_BASE_URL } from './session';

// `fileURLToPath` statt `.pathname` (T-246-1): `.pathname` lieferte unter
// Windows `/C:/…`, verkettet über `${REPO_ROOT}apps/web` zu `C:\C:\…` und
// ließ den Kindprozess nie starten (`spawn … ENOENT`).
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

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

export async function startTimerStopAnnouncementWeb(): Promise<ChildProcessWithoutStdin> {
  const child = spawn('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: `${REPO_ROOT}apps/web`,
    // Unter Windows ist `pnpm` eine `.cmd`; ohne Shell findet sie niemand
    // (`spawn pnpm ENOENT`, dieselbe Bauart wie in T-249-7 zuerst gemessen).
    shell: process.platform === 'win32',
    // Nur außerhalb von Windows (dieselbe Behebung wie in
    // `services.ts#startWeb` und `attachment-persistence-services.ts
    // #startAttachmentPersistenceWeb`, T-330/T-345): Macht diesen Prozeß zum
    // Anführer einer eigenen Prozeßgruppe, damit `stopTimerStopAnnouncementWeb`
    // das Enkelkind `vite` mit erreicht.
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      VITE_TAKT_BASE_URL: API_BASE_URL,
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
    await stopTimerStopAnnouncementWeb(child);
    throw new Error(`${String(error)}\nAusgabe:\n${log}`);
  }

  return child;
}

/**
 * Beendet den mit `startTimerStopAnnouncementWeb` gestarteten Prozeßbaum
 * (dieselbe Behebung wie `services.ts#killShellChildTree` und
 * `attachment-persistence-services.ts#stopAttachmentPersistenceWeb`, hier als
 * eigene kleine Kopie statt eines Imports, siehe Dateikopf). **Muß awaited
 * werden** — sonst erzeugt der Aufruf denselben Waisenprozeß, den T-345 in
 * der Vorlage dieser Datei behoben hat.
 */
export async function stopTimerStopAnnouncementWeb(child: ChildProcessWithoutStdin): Promise<void> {
  if (process.platform !== 'win32' && child.pid !== undefined) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // Gruppe bereits weg, oder Plattform ohne Prozeßgruppen-Unterstützung —
      // der Einzelprozeß-Versuch darunter bleibt der Rückweg.
      child.kill('SIGTERM');
    }
    return;
  }
  child.kill('SIGTERM');
}
