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
 * `XDG_DATA_HOME` **und** `LOCALAPPDATA` zeigen auf ein Wegwerfverzeichnis
 * (`E2E_DATA_DIR`, über `isolatedAppDataEnv`, `app-data-isolation.ts`) — der
 * Dienst legt seinen Bestand dort an (`resolveAppDataDir`, access/paths.ts)
 * und rührt niemals an `~/.local/share/takt/` oder `%LOCALAPPDATA%\Takt`, wo
 * ein echter Bestand läge. Bis T-247-5 setzte dieser Aufbau nur
 * `XDG_DATA_HOME` — unter Windows liest `access/paths.ts` das nicht, und der
 * Lauf traf den echten Bestand des Benutzers (A-A-72). `app-data-isolation
 * .ts` prüft seither vor jedem Start fail-closed, wohin der Kindprozeß
 * tatsächlich schriebe.
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

import { execFile, spawn, type ChildProcessByStdio, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

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
import { isolatedAppDataEnv } from './app-data-isolation';

// `fileURLToPath` statt `.pathname` (T-246-1): `.pathname` lieferte unter
// Windows `/C:/…`, verkettet über `${REPO_ROOT}apps/web` zu `C:\C:\…` und
// ließ den Kindprozess nie starten (`spawn … ENOENT`, vor dem ersten Fall).
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const execFileAsync = promisify(execFile);

/**
 * Beendet einen mit `shell: true` gestarteten Kindprozess samt seinem ganzen
 * Prozessbaum.
 *
 * **Gemessen, nicht vermutet (T-263, an `web-build-services.ts#startWebPreview`
 * zuerst gefunden, hier auf denselben Fund an `startWeb` angewandt):**
 * `child.kill('SIGTERM')` allein beendet unter Windows nur den unmittelbaren
 * Kindprozess. `startWeb` startet wegen `shell: process.platform ===
 * 'win32'` ein `cmd.exe`, das `pnpm` aufruft, das wiederum den eigentlichen
 * `vite`-Prozess als **Enkelkind** startet — `SIGTERM` an das `cmd.exe`
 * lässt dieses Enkelkind unter Windows als Waise weiterlaufen, mit Port 5173
 * weiterhin belegt. Reproduziert (T-263): Nach einem Lauf von
 * `playwright.web-build.config.ts` (derselbe `startWeb`/`stopServices`-Pfad)
 * blieb ein `vite`/`vite preview`-Prozess auf 5173 zurück und blockierte den
 * nächsten Lauf — exakt die Bauart, die T-259 schon als „fremde, aber
 * erreichbare Gegenstelle" auf einem geteilten Port beschrieb, und die der
 * Auftraggeber als wiederkehrendes Problem benennt (`board.md`: „Hängende
 * Prozesse auf 5173 und 17844 haben heute mehrfach Läufe verfälscht").
 * `spawnLocalApi`/`restartLocalApi` sind davon **nicht** betroffen — `node`
 * wird dort ohne `shell: true` direkt gestartet, kein Enkelkind, `SIGTERM`
 * trifft den richtigen Prozess.
 *
 * `taskkill /t /f` beendet unter Windows den ganzen Baum; auf anderen
 * Plattformen bleibt `SIGTERM` (kein `shell: true` dort, kein
 * Enkelkind-Problem).
 */
async function killShellChildTree(child: ChildProcessWithoutStdin): Promise<void> {
  if (process.platform === 'win32' && child.pid !== undefined) {
    try {
      await execFileAsync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    } catch {
      // Bereits beendet, oder nie wirklich gestartet — kein zweiter Versuch nötig.
    }
    return;
  }
  child.kill('SIGTERM');
}

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

/**
 * Entfernt ANSI-Farbcodes aus mitgeschnittenem Kindprozess-`stdout`/`stderr`.
 * Eigenständig statt aus `web-build-services.ts` importiert (T-249-7-Bauart:
 * jede Datei unter `support/**` bleibt für sich lauffähig) — dieselbe
 * Begründung wie bei `listFilesRecursively` dort.
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex -- ANSI-Escapes enthalten per Definition ein Steuerzeichen (ESC, 0x1B).
  return text.replace(/\x1B\[[0-9;]*m/g, '');
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
      env: { ...isolatedAppDataEnv(E2E_DATA_DIR), TAKT_E2E_GITHUB_STUB_URL: githubStubUrl },
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

/**
 * Startet den Entwicklungsserver für `apps/web`.
 *
 * **Bereitschaft am eigenen Prozess gemessen, nicht am Netz (T-263-Fund,
 * zuerst an `web-build-services.ts#startWebPreview` gemessen, hier auf
 * denselben Aufbau angewandt).** Eine reine `fetch`-Bereitschaftsprüfung
 * kann nicht unterscheiden, ob die Antwort vom selbst gestarteten Kind
 * stammt oder von einer fremden, aber erreichbaren Gegenstelle auf
 * demselben Port — und ein bloßes Wettrennen gegen den frühen Tod des
 * eigenen Kindes (`Promise.race([ready, exitedEarly])`, `ready` weiterhin
 * über `fetch`) genügt dafür **nicht**: Der `pnpm`/`cmd.exe`-Vorlauf unter
 * Windows dauert spürbar länger als die erste `fetch`-Runde, eine sofort
 * antwortende fremde Gegenstelle gewinnt das Wettrennen praktisch immer
 * (gemessen an `startWebPreview`, dort ausführlich begründet). `vite`
 * schreibt bei tatsächlich geglücktem Binden eine eigene Zeile auf sein
 * `stdout` (`➜  Local:   http://127.0.0.1:<port>/`) — die kann nur der
 * eigene, wirklich gebundene Prozess schreiben. Die Bereitschaftsprüfung
 * liest deshalb den mitgeschnittenen Log-Puffer, nicht das Netz; eine
 * `fetch`-Bestätigung folgt danach nur noch als Zusatzsicherung.
 */
async function startWeb(): Promise<ChildProcessWithoutStdin> {
  const child = spawn('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: `${REPO_ROOT}apps/web`,
    // Unter Windows ist `pnpm` eine `.cmd`; ohne Shell findet sie niemand
    // (`spawn pnpm ENOENT`, dieselbe Bauart wie in T-249-7 zuerst gemessen).
    shell: process.platform === 'win32',
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

  const exitedEarly = new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
  });

  const boundMarker = '127.0.0.1:5173';
  const readyOutcome = waitFor(
    async () => stripAnsi(log).includes(boundMarker),
    15_000,
    'Vite-Entwicklungsserver meldet auf eigenem stdout das Binden an 5173',
  ).then(
    () => 'ready' as const,
    () => 'timeout' as const,
  );

  const outcome = await Promise.race([readyOutcome, exitedEarly.then(() => 'exited' as const)]);

  if (outcome !== 'ready') {
    await killShellChildTree(child);
    const reason =
      outcome === 'exited'
        ? 'Der eigene Vite-Entwicklungsserver-Prozess ist beendet, bevor er das Binden an Port ' +
          '5173 auf seinem eigenen stdout gemeldet hat — vermutlich EADDRINUSE (Port bereits von ' +
          'einer fremden Gegenstelle belegt, --strictPort verhindert ein Ausweichen).'
        : 'Zeitüberschreitung beim Warten auf: Vite-Entwicklungsserver meldet auf eigenem stdout ' +
          'das Binden an 5173.';
    throw new Error(`${reason}\nAusgabe:\n${log}`);
  }

  try {
    await waitFor(async () => {
      const response = await fetch(WEB_BASE_URL).catch(() => null);
      return response !== null && response.ok;
    }, 5_000, 'Vite-Entwicklungsserver (bereits gebunden) antwortet über HTTP auf 5173');
  } catch (error) {
    await killShellChildTree(child);
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
  // `web` über `killShellChildTree` (T-263-Fund, Begründung dort): `startWeb`
  // spawnt über `shell: true`, ein blankes `SIGTERM` träfe nur das `cmd.exe`
  // und ließe den eigentlichen `vite`-Prozess als Waise auf 5173 zurück.
  // `localApi` startet `node` direkt, ohne Shell — `SIGTERM` bleibt hier
  // richtig und ausreichend.
  await killShellChildTree(services.web);
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
