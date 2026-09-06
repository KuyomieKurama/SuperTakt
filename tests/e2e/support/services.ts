/**
 * Takt — startet den echten lokalen Dienst und die echte Oberfläche für den
 * End-zu-Ende-Testlauf, ohne die Tauri-Hülle.
 *
 * Das ist genau der Weg, den T-022 (offene Frage 6) für den e2e-tester
 * vorgezeichnet hat: `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` setzen, den
 * Dienst mit einem bekannten Startgeheimnis über `stdin` starten, Vite auf
 * Port 5173 binden. Diese Datei tut nichts anderes — kein Attrappen-Server,
 * kein gestubbtes `fetch`. Die Testfälle laufen gegen dieselbe Fachlogik,
 * dasselbe SQLite und dieselbe React-Anwendung wie ein echter Benutzer.
 *
 * `XDG_DATA_HOME` zeigt auf ein Wegwerfverzeichnis (`E2E_DATA_DIR`) — der
 * Dienst legt seinen Bestand dort an (`resolveAppDataDir`, access/paths.ts)
 * und rührt niemals an `~/.local/share/takt/`, wo ein echter Bestand läge.
 *
 * `startLocalApi`/`configureExportDirectory` sind seit T-055 zusätzlich
 * exportiert: Der Dienst selbst läuft dort unverändert aus dem Quelltext (das
 * war nie die gemessene Lücke, siehe T-053), aber die neuen
 * `global-setup-*-build.ts`-Dateien brauchen genau diese beiden Schritte, um
 * ihn als Gegenstelle für ein **gebautes** `apps/web`/`apps/outlook-addin` zu
 * starten, ohne die Startlogik ein zweites Mal zu schreiben. `startWeb`
 * bleibt unexportiert und unverändert — sie startet ausdrücklich den
 * Entwicklungsserver, den T-055 gerade *nicht* prüfen soll.
 *
 * ===========================================================================
 * O-CI/O-CV (T-166) — dieser Aufbau ruft seit T-146/T-147 wirklich `api.github.com`
 * ===========================================================================
 *
 * Bis hierhin stand oben unverändert: „kein Attrappen-Server, kein gestubbtes
 * `fetch`". Das war für jede bis dahin gebaute Fläche wahr, weil Takt keine
 * zweite Gegenstelle kannte (E-001). Seit der Versionsprüfung (T-146/T-147,
 * Spezifikation Abschnitt 18) ist das nicht mehr richtig: `spawnLocalApi`
 * startete bislang wörtlich `apps/local-api/src/index.ts`, also `main()` ohne
 * jeden Parameter — und genau dort baut `compose()` ohne `releaseSource` die
 * echte `createGithubReleaseSource()` (`version/source.ts`) und
 * `versionCheck.start()` löst zehn Sekunden nach dem Start eine echte Anfrage
 * gegen `https://api.github.com/…/releases/latest` aus (`VERSION_CHECK_START
 * _DELAY_MS`). Gemessen (T-166, `--import`-Netzmitschnitt über `globalThis
 * .fetch`, 15 s Lauf): Die Anfrage feuert zuverlässig zwischen der
 * „lauscht"-Zeile und dem Ende des Fensters — ein Playwright-Lauf dieser
 * Reihe dauert um Größenordnungen länger als zehn Sekunden, trifft also bei
 * **jedem** Lauf nach draußen. Dieselbe Überschreitung wie O-BU bei
 * `proof:access` (T-145): Ein Lauf, der eine Vertrauensgrenze prüfen soll —
 * hier implizit, weil `web-build-smoke.spec.ts` und
 * `attachment-persistence-live.spec.ts` denselben `spawnLocalApi` benutzen —,
 * überschreitet sie selbst. `CLAUDE.md` lässt genau eine Adresse außerhalb
 * `127.0.0.1` zu, und sie gehört dem Erzeugnis (der echten Versionsprüfung in
 * ihrer eigenen Reihe), nicht dieser Prüfreihe.
 *
 * **Die Behebung ist dieselbe Naht, die T-142 für genau diesen Fall gebaut
 * hat**, nur diesmal auch hier eingesetzt: `tests/e2e/support/version-check-
 * entry.ts` ersetzt ausschließlich die Abholfunktion
 * (`createGithubReleaseSource({ fetch })`, E-066 Punkt 1) durch eine, die auf
 * eine lokale Attrappe (`github-releases-stub.ts`, `ensureGithubStub()`
 * unten) zeigt statt auf `https://api.github.com`. Alles andere — Migration,
 * Handschlag, Routen, der unveränderte Zehn-Sekunden-Takt — bleibt exakt das,
 * was `apps/local-api/src/index.ts` auch täte; kein Fall dieser Reihe fragt
 * je nach der Versionsprüfung selbst (das bleibt `version-check-live.spec.ts`
 * in ihrer eigenen Ausführungskonfiguration vorbehalten), also kostet der
 * Tausch nichts an Deckung. Die Attrappe bleibt für die gesamte Laufzeit
 * dieses Prozesses auf ihrer Vorgabeantwort stehen — `404`, „keine
 * Veröffentlichung" (A-18.11) —, also bleibt der Prüfzustand für jede Datei
 * dieser Reihe auf „unknown", genau wie vor T-146, als es die Versionsprüfung
 * noch nicht gab.
 */

import { spawn, type ChildProcessByStdio, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Readable } from 'node:stream';

import {
  API_BASE_URL,
  E2E_DATA_DIR,
  E2E_EXPORT_DIR,
  SESSION_SECRET,
  TOKEN_HEADER,
  WEB_BASE_URL,
  WINDOWS_USER,
} from './session';
import { startGithubReleasesStub, type GithubReleasesStub } from './github-releases-stub';

const REPO_ROOT = new URL('../../../', import.meta.url).pathname;

/**
 * Lazy gestartete, für den ganzen Prozess geteilte GitHub-Attrappe (O-CI).
 * Bleibt über mehrere `spawnLocalApi`-Aufrufe hinweg dieselbe — genau wie
 * `version-check-services.ts` es mit ihrem eigenen `stub` für `TP-VER-11`/
 * `-12` vormacht —, damit ein Neustart des Dienstes (`restartLocalApi`,
 * `attachment-persistence-live.spec.ts`) nicht plötzlich eine zweite
 * Attrappe auf einem zweiten Port bräuchte. Bleibt auf der Vorgabeantwort
 * (`404`) stehen; kein Fall dieser Reihe stellt sie um.
 */
let githubStub: GithubReleasesStub | null = null;

async function ensureGithubStub(): Promise<string> {
  githubStub ??= await startGithubReleasesStub();
  return githubStub.url;
}

/**
 * Schließt die Attrappe, falls sie je gestartet wurde. Teil von
 * `stopServices` — zusätzlich exportiert, weil `attachment-persistence-live
 * .spec.ts` `startLocalApi`/`restartLocalApi` **ohne** `stopServices`
 * benutzt (eigene Begründung dort) und trotzdem aufräumen muss, was sie über
 * diesen Umweg mit angestoßen hat.
 */
export async function stopGithubStub(): Promise<void> {
  if (githubStub !== null) {
    const stub = githubStub;
    githubStub = null;
    await stub.close();
  }
}

/**
 * Genau der Typ, den `spawn` mit `stdio: ['ignore', 'pipe', 'pipe']` liefert
 * (`stdin` ist `null`, weil nichts hineingeschrieben wird) — nicht
 * `ChildProcessWithoutNullStreams` (das verlangt ein beschreibbares `stdin`,
 * unter `exactOptionalPropertyTypes` ein echter Typfehler, kein Formalismus).
 */
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
 * Startet **einen** Prozess des lokalen Dienstes aus dem Quelltext gegen
 * `E2E_DATA_DIR`, ohne den Bestand darin anzurühren — die gemeinsame
 * Spawn-und-Warte-Schleife hinter {@link startLocalApi} und (seit T-150)
 * {@link restartLocalApi}. Der Unterschied zwischen beiden ist ausschließlich,
 * ob **vorher** aufgeräumt wird: ein frischer Lauf tut das, ein echter
 * Prozess-Neustart mit demselben Bestand (TP-ANH-10 Stufe 2) darf es nicht.
 *
 * Seit T-166 (O-CI) startet dies **nicht mehr** `apps/local-api/src/index.ts`
 * (das wäre `main()` ohne Parameter, also die echte Versionsprüfung gegen
 * `https://api.github.com` — Begründung im Kopf dieser Datei), sondern
 * `tests/e2e/support/version-check-entry.ts` gegen eine lokale, stumme
 * Attrappe ({@link ensureGithubStub}). Für jede Testdatei dieser Reihe
 * unbeobachtbar: derselbe Port, dieselbe Migration, dieselben Routen.
 */
async function spawnLocalApi(): Promise<ChildProcessWithoutNullStreams> {
  const githubStubUrl = await ensureGithubStub();

  // Diese Maschine faehrt mehrere Team-Agenten gleichzeitig, und der Port ist
  // im Dienst fest verdrahtet (config.ts, DEFAULT_PORT) — kein Ausweichen.
  // Acht Versuche mit wachsendem Rueckstand haben sich in der Praxis als
  // ausreichend erwiesen, um eine kurze fremde Belegung abzuwarten, ohne bei
  // echter Fehlkonfiguration endlos zu haengen.
  const attempts = 8;
  let lastLog = '';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const child = spawn('node', ['tests/e2e/support/version-check-entry.ts'], {
      cwd: REPO_ROOT,
      env: { ...process.env, XDG_DATA_HOME: E2E_DATA_DIR, TAKT_E2E_GITHUB_STUB_URL: githubStubUrl },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let log = '';
    child.stdout.on('data', (chunk: Buffer) => {
      log += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      log += chunk.toString('utf8');
    });

    // Zwei Zeilen über denselben Kanal: Startgeheimnis, dann Windows-Benutzername
    // (readStartupHandshake, access/session-secret.ts). `stdin` bleibt offen —
    // schlösse es, würde der Dienst sich beenden (watchParentLink), genau wie
    // beim Verlust der Tauri-Hülle.
    child.stdin.write(`${SESSION_SECRET}\n${WINDOWS_USER}\n`);

    const exitedEarly = new Promise<boolean>((resolve) => {
      child.once('exit', () => resolve(true));
    });

    const ready = waitFor(async () => {
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: { Origin: WEB_BASE_URL, [TOKEN_HEADER]: SESSION_SECRET },
      }).catch(() => null);
      return response !== null && response.ok;
    }, 4_000, 'lokaler Dienst antwortet auf /health').then(
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

  throw new Error(
    `Der lokale Dienst kam nach ${attempts} Versuchen nicht hoch. Letzte Ausgabe:\n${lastLog}`,
  );
}

/**
 * Startet den lokalen Dienst aus dem Quelltext (wie `apps/local-api/src/index.ts`,
 * dasselbe, was auch der Prüfpfad in `apps/local-api/scripts/proof-*.mjs` benutzt).
 *
 * Der Port ist im Dienst selbst fest verdrahtet (`DEFAULT_PORT`, config.ts) —
 * kein Argument steuert ihn (B-1.6). Läuft zufällig noch ein anderer Prozess
 * auf 17843 (z. B. ein Prüfpfad einer parallel laufenden Aufgabe auf derselben
 * Maschine), schlägt der Start mit `EXIT_BIND` fehl; es wird deshalb mit
 * Rückstand erneut versucht, statt sofort aufzugeben.
 */
export async function startLocalApi(): Promise<ChildProcessWithoutNullStreams> {
  await rm(E2E_DATA_DIR, { recursive: true, force: true });
  await mkdir(E2E_DATA_DIR, { recursive: true });
  return spawnLocalApi();
}

/**
 * Beendet einen laufenden Dienstprozess und startet ihn **mit demselben
 * Bestand** neu — ein echter Prozess-Neustart, keine bloße Neuladung der Seite
 * (T-150, TP-ANH-10 Stufe 2, dieselbe Unterscheidung wie bei
 * `version-check-services.ts` für die Versionsprüfung). Anders als
 * {@link startLocalApi} wird `E2E_DATA_DIR` **nicht** gelöscht.
 *
 * Absichtlich nicht in der globalen `RunningServices`-Verdrahtung verwendet:
 * Ein Aufrufer, der diese Funktion mitten in einem Testlauf einsetzt, trägt
 * selbst die Verantwortung, am Ende wieder einen laufenden Dienst auf 17843
 * zu hinterlassen — siehe `attachment-persistence-live.spec.ts`.
 */
export async function restartLocalApi(
  previous: ChildProcessWithoutNullStreams,
): Promise<ChildProcessWithoutNullStreams> {
  const exited = new Promise<void>((resolve) => {
    previous.once('exit', () => resolve());
  });
  previous.kill('SIGTERM');
  await Promise.race([exited, sleep(3_000)]);
  return spawnLocalApi();
}

async function startWeb(): Promise<ChildProcessWithoutStdin> {
  const child = spawn('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: `${REPO_ROOT}apps/web`,
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
    child.kill('SIGTERM');
    throw new Error(`${String(error)}\nAusgabe:\n${log}`);
  }

  return child;
}

/** Setzt einen echten, beschreibbaren Exportordner (E-011) für den ganzen Lauf. */
export async function configureExportDirectory(): Promise<void> {
  await rm(E2E_EXPORT_DIR, { recursive: true, force: true });
  await mkdir(E2E_EXPORT_DIR, { recursive: true });

  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PATCH',
    headers: {
      Origin: WEB_BASE_URL,
      [TOKEN_HEADER]: SESSION_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ exportDirectory: E2E_EXPORT_DIR }),
  });
  if (!response.ok) {
    throw new Error(`Exportordner konnte nicht gesetzt werden: ${response.status} ${await response.text()}`);
  }
}

export interface RunningServices {
  readonly localApi: ChildProcessWithoutNullStreams;
  readonly web: ChildProcessWithoutStdin;
}

export async function startServices(): Promise<RunningServices> {
  const localApi = await startLocalApi();
  await configureExportDirectory();
  const web = await startWeb();
  return { localApi, web };
}

export async function stopServices(services: RunningServices): Promise<void> {
  services.web.kill('SIGTERM');
  services.localApi.kill('SIGTERM');
  // Kurze Gnadenfrist, damit beide Prozesse ihre Sockets freigeben, bevor ein
  // erneuter Lauf denselben Port belegen will.
  await sleep(300);
  // O-CI: die GitHub-Attrappe gehört zu diesem Prozesslauf, nicht zum
  // lokalen Dienst selbst — sie schließt eigenständig.
  await stopGithubStub();
}

export function exportDirExists(): boolean {
  return existsSync(E2E_EXPORT_DIR);
}
