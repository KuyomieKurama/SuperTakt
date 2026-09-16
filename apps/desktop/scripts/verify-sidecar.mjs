/** Startet das gebaute Installationsbild in einem temporären Verzeichnis mit leerem Arbeitsverzeichnis.
 * API, Aufgabenbereich, Geheimnisübergabe und Prozessende werden an der ausgelieferten Binärdatei geprüft; Benutzerdaten bleiben außerhalb. */

import { stageTaskpane } from './build-taskpane.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { request as httpsRequest } from 'node:https';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..');
const repoRoot = resolve(appDir, '../..');

const SIDECAR_NAME = 'takt-local-api';
const PORT = 17843;
const TASKPANE_PORT = 17844;
const BASE = `http://127.0.0.1:${PORT}/api/v1`;

/**
 * Kennzeichen im ausgelieferten Aufgabenbereich.
 *
 * Es steht in keiner echten Datei des Arbeitsbereichs. Kommt es über 17844
 * zurück, hat der Dienst **dieses** Bündel gefunden — das neben der
 * Binärdatei — und nicht zufällig ein anderes.
 */
const TASKPANE_MARK = `takt-nachweis-${randomBytes(8).toString('hex')}`;

/**
 * Der Ablageort wird umgelenkt — und zwar auf **jeder** Plattform (T-075).
 *
 * `apps/local-api/src/access/paths.ts` kennt zwei Regeln und nicht eine:
 *
 *   win32   `%LOCALAPPDATA%\Takt`   — `XDG_DATA_HOME` wird dort **nicht** gelesen
 *   sonst   `$XDG_DATA_HOME/takt`
 *
 * Dieser Lauf setzte bis T-075 nur `XDG_DATA_HOME`. Unter Linux und macOS ist
 * das richtig; unter Windows lief er damit gegen das **echte**
 * `%LOCALAPPDATA%\Takt` des angemeldeten Kontos. Zwei Schäden auf einmal: Der
 * Nachweis hätte die Datenbank des Benutzers angefasst, und die Prüfung „die
 * Datenbankdatei liegt im Anwendungsdatenverzeichnis" hätte im Wegwerfordner
 * nichts gefunden und wäre rot geworden — nicht, weil der Dienst falsch liegt,
 * sondern weil der Prüfer am falschen Ort nachsieht. Genau diese Sorte
 * Fehlschlag verleitet dazu, die Prüfung „für Windows zu lockern".
 *
 * Deshalb steht die Regel hier einmal und wird an beiden Stellen benutzt: beim
 * Start des Dienstes (welche Variable) und beim Nachsehen (welcher Ordnername).
 */
const APP_DATA = Object.freeze(
  process.platform === 'win32'
    ? { variable: 'LOCALAPPDATA', folder: 'Takt' }
    : { variable: 'XDG_DATA_HOME', folder: 'takt' },
);

let passed = 0;
let failed = 0;

function check(label, ok, detail = '') {
  if (ok) {
    passed += 1;
    process.stdout.write(`  ok    ${label}\n`);
  } else {
    failed += 1;
    process.stdout.write(`  FEHL  ${label}${detail ? ` — ${detail}` : ''}\n`);
  }
}

function binaryPath() {
  const result = spawnSync('rustc', ['-vV'], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write('FEHLER: `rustc -vV` ist fehlgeschlagen.\n');
    process.exit(1);
  }
  const host = String(result.stdout)
    .split('\n')
    .find((line) => line.startsWith('host:'))
    ?.slice('host:'.length)
    .trim();
  const suffix = process.platform === 'win32' ? '.exe' : '';
  return join(appDir, 'src-tauri', 'binaries', `${SIDECAR_NAME}-${host}${suffix}`);
}

/** Ist ein Port belegt, sagt das Skript das, statt einen Fehlschlag zu behaupten. */
function portFree(port) {
  return new Promise((done) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      done(false);
    });
    socket.once('error', () => done(true));
    setTimeout(() => {
      socket.destroy();
      done(true);
    }, 1500).unref();
  });
}

/**
 * Baut das Verzeichnisbild der Auslieferung nach.
 *
 * Die Binärdatei kommt in einen eigenen Ordner, daneben das `taskpane`-Bündel
 * — genau so, wie Tauri beides ausliefert und wie `taskpane/server.ts` es
 * sucht (`resolve(process.execPath, '..', 'taskpane')`).
 *
 * Zuerst eine harte Verknüpfung: Die Datei ist 120 MiB, und wenn der
 * Wegwerfordner auf demselben Dateisystem liegt, kostet das nichts. Sonst wird
 * kopiert. Eine **symbolische** Verknüpfung geht nicht: Node löst `execPath`
 * auf den echten Pfad auf, und der zeigte dann wieder in den Bauordner — die
 * Prüfung liefe ins Leere, ohne es zu sagen.
 */
function buildInstallation(root, binary) {
  const installDir = join(root, 'install');
  mkdirSync(installDir, { recursive: true });

  const suffix = process.platform === 'win32' ? '.exe' : '';
  const installed = join(installDir, `${SIDECAR_NAME}${suffix}`);
  try {
    linkSync(binary, installed);
  } catch {
    copyFileSync(binary, installed);
  }
  chmodSync(installed, 0o755);

  const taskpaneDir = join(installDir, 'taskpane');
  // Exercise the production build/staging path, including both command entries.
  stageTaskpane({ target: taskpaneDir });
  const indexPath = join(taskpaneDir, 'index.html');
  writeFileSync(indexPath, readFileSync(indexPath, 'utf8') + `\n<!-- ${TASKPANE_MARK} -->\n`, 'utf8');
  // Eine Datei mit einer Endung, die nicht auf der Positivliste steht. Sie
  // liegt bewusst *im* Bündel: Der Nachweis ist nicht „gibt es nicht", sondern
  // „gibt es, wird aber nicht ausgeliefert".
  writeFileSync(join(taskpaneDir, 'nicht-ausliefern.pem'), '-----BEGIN PRIVATE KEY-----\n', 'utf8');

  return { installed, taskpaneDir };
}

/**
 * Startet die Binärdatei und schickt die Startzeilen.
 *
 * `secret === null` heißt: gar nichts schicken. `osUser === null` heißt: nur
 * die erste Zeile. Beide Fälle sind Prüfungen und keine Bequemlichkeit.
 *
 * Wenn beide Werte da sind, gehen sie in **einem** `write` heraus — genau so,
 * wie die Hülle es tut, und genau der Fall, den der Leser auf der Gegenseite
 * abdeckt.
 *
 * Das Arbeitsverzeichnis ist ein **leerer** Ordner und nicht das Repository
 * (T-053): Wer zur Laufzeit einen relativen Pfad auflöst, findet dort nichts
 * und fällt hier auf.
 */
function startSidecar(binary, cwd, dataDir, secret, osUser = 'pruefer') {
  const child = spawn(binary, [], {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, [APP_DATA.variable]: dataDir },
  });
  let output = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  if (secret !== null) {
    child.stdin.write(osUser === null ? `${secret}\n` : `${secret}\n${osUser}\n`);
  }
  return {
    child,
    read: () => output,
    /** Wartet auf eine Zeile in der Ausgabe. Endet der Prozess vorher: `false`. */
    waitForOutput: (needle, timeoutMs) =>
      new Promise((done) => {
        const timer = setTimeout(() => {
          clearInterval(tick);
          done(false);
        }, timeoutMs);
        const tick = setInterval(() => {
          if (output.includes(needle)) {
            clearInterval(tick);
            clearTimeout(timer);
            done(true);
          }
        }, 50);
        child.once('exit', () => {
          clearInterval(tick);
          clearTimeout(timer);
          done(output.includes(needle));
        });
      }),
    waitForExit: (timeoutMs) =>
      new Promise((done) => {
        if (child.exitCode !== null) {
          done(child.exitCode);
          return;
        }
        const timer = setTimeout(() => done(null), timeoutMs);
        child.once('exit', (code) => {
          clearTimeout(timer);
          done(code);
        });
      }),
  };
}

/**
 * Eine Anfrage an den Aufgabenbereich.
 *
 * ---------------------------------------------------------------------------
 * Warum hier nichts abgeschaltet wird
 * ---------------------------------------------------------------------------
 *
 * Das Zertifikat ist selbst signiert (E-046). Der bequeme Weg wäre
 * `rejectUnauthorized: false` — und er wäre der falsche: Er prüfte dann gar
 * nichts mehr, auch nicht, ob überhaupt der richtige Prozess antwortet.
 *
 * Stattdessen wird das Zertifikat, das der Dienst beim Start in das
 * Anwendungsdatenverzeichnis geschrieben hat, als **einzige** Vertrauenswurzel
 * mitgegeben (`ca`). Die Prüfung läuft vollständig. Sie schlägt fehl, wenn ein
 * anderer Prozess auf 17844 antwortet, wenn das Zertifikat nicht auf
 * `localhost` lautet oder wenn es abgelaufen ist — alles Fälle, die Outlook
 * beim Benutzer genauso träfen.
 *
 * Über `node:https` und nicht über `fetch`, weil `fetch` keine eigene
 * Vertrauenswurzel je Anfrage kennt.
 *
 * `servername: 'localhost'` und nicht `127.0.0.1`: So lädt Outlook den
 * Aufgabenbereich, und der alternative Name des Zertifikats führt beide.
 */
function taskpaneRequest(path, ca) {
  return new Promise((done, failWith) => {
    const req = httpsRequest(
      {
        host: '127.0.0.1',
        port: TASKPANE_PORT,
        path,
        method: 'GET',
        servername: 'localhost',
        ca,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => done({ status: res.statusCode, headers: res.headers, body }));
      },
    );
    req.on('error', failWith);
    req.setTimeout(10_000, () => {
      req.destroy(new Error('Zeitüberschreitung'));
    });
    req.end();
  });
}

async function taskpaneRequestOrNull(path, ca) {
  try {
    return await taskpaneRequest(path, ca);
  } catch (error) {
    return { status: null, headers: {}, body: '', error: String(error && error.message) };
  }
}

// Vorbedingungen

const binary = binaryPath();
if (!existsSync(binary)) {
  process.stderr.write(
    `FEHLER: ${relative(repoRoot, binary)} fehlt.\n` + `Erst bauen: pnpm --filter @takt/desktop sidecar\n`,
  );
  process.exit(1);
}

for (const [port, what] of [
  [PORT, 'der lokale Dienst'],
  [TASKPANE_PORT, 'der Aufgabenbereich'],
]) {
  if (!(await portFree(port))) {
    process.stderr.write(
      `FEHLER: Auf 127.0.0.1:${port} lauscht bereits etwas (dort erwartet dieser Lauf ${what}).\n` +
        `Der Dienst belegt seine Ports ausschließlich und weicht bewusst nicht aus (B-1.5).\n` +
        `Läuft Takt oder \`pnpm --filter @takt/local-api proof:access\` gerade?\n`,
    );
    process.exit(1);
  }
}

process.stdout.write(`Nachweis gegen ${relative(repoRoot, binary)}\n\n`);

const root = mkdtempSync(join(tmpdir(), 'takt-sidecar-'));
const dataDir = join(root, 'data');
mkdirSync(dataDir, { recursive: true });
// Ein leeres Arbeitsverzeichnis: Nichts, was ein relativer Pfad treffen könnte.
const emptyCwd = join(root, 'cwd');
mkdirSync(emptyCwd, { recursive: true });
// Genau das, was die Hülle beim Start tut: Verzeichnis anlegen, 0700 setzen.
// Der Ordnername kommt aus derselben Regel wie die Umgebungsvariable oben —
// unter Windows `Takt`, sonst `takt`.
const preparedDir = join(dataDir, APP_DATA.folder);
mkdirSync(preparedDir, { recursive: true, mode: 0o700 });
chmodSync(preparedDir, 0o700);

const { installed, taskpaneDir } = buildInstallation(root, binary);
process.stdout.write(
  `Installationsbild: <tmp>/install/${SIDECAR_NAME}, daneben ${relative(join(root, 'install'), taskpaneDir)}/\n\n`,
);

const secret = randomBytes(32).toString('hex');

try {
  // 1 und 2 — Ohne jede Startzeile endet der Dienst (B-1.6 Punkt 2)
  const lonely = startSidecar(installed, emptyCwd, join(root, 'lonely'), null);
  lonely.child.stdin.end();
  const lonelyCode = await lonely.waitForExit(15_000);
  check('Ohne Startzeilen endet der Dienst mit Code 78', lonelyCode === 78, `Code ${String(lonelyCode)}`);
  check(
    'Die Abbruchmeldung nennt kein Geheimnis',
    !/takt_[A-Za-z0-9_-]{20,}/.test(lonely.read()),
    lonely.read().slice(0, 120),
  );

  // 3 bis 5 — Geheimnis ja, Benutzername nein (E-042)
  const nameless = startSidecar(installed, emptyCwd, join(root, 'nameless'), secret, null);
  const namelessCode = await nameless.waitForExit(15_000);
  check(
    'Mit Geheimnis, aber ohne Benutzernamen endet der Dienst mit Code 78',
    namelessCode === 78,
    `Code ${String(namelessCode)}`,
  );
  check(
    'Die Meldung nennt den fehlenden Benutzernamen als Grund',
    /Benutzernamen/.test(nameless.read()),
    nameless.read().slice(0, 200),
  );
  check('Auch diese Abbruchmeldung nennt kein Geheimnis', !new RegExp(secret).test(nameless.read()));
  // Falls er wider Erwarten doch hochgekommen ist: Er hält sonst die Ports und
  // lässt jede folgende Prüfung aus dem falschen Grund scheitern.
  if (nameless.child.exitCode === null) {
    nameless.child.kill('SIGKILL');
    await nameless.waitForExit(5_000);
  }

  // 6 und 7 — Mit beiden Startzeilen kommt er hoch, und zwar ohne Fehler
  const service = startSidecar(installed, emptyCwd, dataDir, secret, 'pruefer');
  const up = await service.waitForOutput(`lauscht auf 127.0.0.1:${PORT}`, 30_000);
  check('Mit beiden Startzeilen über stdin kommt der Dienst hoch', up, service.read().slice(0, 600));

  /**
   * Die Prüfung, die T-053 gefunden hätte.
   *
   * `entry.ts` fängt jeden Wurf aus `main()` ab und schreibt
   * „Der lokale Dienst konnte nicht starten: …" nach `stderr`. Diese Zeile darf
   * es nicht geben — auch dann nicht, wenn der Dienst kurz zuvor noch gemeldet
   * hat, dass er lauscht. Genau diese Reihenfolge trat auf: erst lauschen, dann
   * am Aufgabenbereich sterben.
   */
  check(
    'Die Ausgabe meldet keinen Startfehler',
    !/konnte nicht starten/.test(service.read()),
    (service.read().match(/.*konnte nicht starten.*/) ?? [''])[0],
  );

  if (up) {
    // 8 bis 10 — Der Nachweispfad steht auch in der gebündelten Fassung
    const good = await fetch(`${BASE}/health`, { headers: { 'X-Takt-Token': secret } });
    const body = await good.json();
    check('GET /health mit Sitzungsgeheimnis ergibt 200', good.status === 200, `war ${good.status}`);
    check('Die Antwort ist {"data":{"status":"ok"}}', body?.data?.status === 'ok', JSON.stringify(body));

    const bad = await fetch(`${BASE}/health`);
    check('Dieselbe Anfrage ohne Nachweis ergibt 401', bad.status === 401, `war ${bad.status}`);

    // 11 bis 13 — Der Bestand ist da (T-053)
    //
    // `/health` beweist, dass der Dienst antwortet. Es beweist nicht, dass er
    // eine Datenbank hat: Die Route hängt an keinem Port und antwortet auch
    // ohne jeden Bestand. Eine Fachroute tut das nicht — sie liest, und lesen
    // kann sie nur aus einem migrierten Schema.
    //
    // `todo-statuses` ist die richtige Wahl, weil Migration 0002 die Spalten
    // vorbelegt: Eine leere Liste wäre hier kein „noch nichts angelegt",
    // sondern eine Datenmigration, die nicht gelaufen ist.
    const statuses = await fetch(`${BASE}/todo-statuses`, { headers: { 'X-Takt-Token': secret } });
    const statusBody = statuses.status === 200 ? await statuses.json() : null;
    check(
      'Der Bestand ist migriert: GET /todo-statuses ergibt 200',
      statuses.status === 200,
      `war ${statuses.status}`,
    );
    check(
      'Die vorbelegten Spalten aus Migration 0002 sind vorhanden',
      Array.isArray(statusBody?.data) && statusBody.data.length > 0,
      JSON.stringify(statusBody).slice(0, 200),
    );
    check(
      'Die Datenbankdatei liegt im Anwendungsdatenverzeichnis',
      existsSync(join(preparedDir, 'takt.db')),
      preparedDir,
    );

    // 14 bis 17 — Der zweite Port: der Aufgabenbereich (E-046)
    //
    // Er findet sein Bündel über `process.execPath`. Deshalb läuft dieser
    // Nachweis aus dem Installationsbild und nicht aus dem Bauordner: Nur dort
    // liegt neben der Binärdatei überhaupt ein `taskpane`.
    const taskpaneUp = await service.waitForOutput(`https://localhost:${TASKPANE_PORT}`, 20_000);
    check('Der Aufgabenbereich meldet sich auf Port 17844', taskpaneUp, service.read().slice(-600));

    if (taskpaneUp) {
      // Die Vertrauenswurzel ist das Zertifikat, das der Dienst gerade selbst
      // in das Anwendungsdatenverzeichnis geschrieben hat. Fehlt es, schlägt
      // schon die erste Anfrage fehl — und das ist die richtige Antwort.
      const ca = existsSync(join(preparedDir, 'taskpane-cert.pem'))
        ? readFileSync(join(preparedDir, 'taskpane-cert.pem'), 'utf8')
        : undefined;

      const index = await taskpaneRequestOrNull('/', ca);
      check(
        'GET https://127.0.0.1:17844/ liefert die index.html aus dem Bündel neben der Binärdatei',
        index.status === 200 && index.body.includes(TASKPANE_MARK),
        `Status ${String(index.status)}${index.error ? `, ${index.error}` : ''}`,
      );

      const commands = await taskpaneRequestOrNull('/commands.html', ca);
      check('Der echte Schnellbefehl wird aus dem gebauten Paket ausgeliefert', commands.status === 200 && /<script[^>]*src="[^"]*commands[^"]*\.js"/.test(commands.body), `Status ${commands.status}`);
      const scriptPaths = [...commands.body.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match => match[1]).filter(path => !path.startsWith('https:'));
      for (const script of scriptPaths) {
        const resource = await taskpaneRequestOrNull(new URL(script, 'https://localhost/commands.html').pathname, ca);
        check(`Funktionsskript im Paket erreichbar: ${script}`, resource.status === 200 && resource.body.length > 0, `Status ${resource.status}`);
      }

      const pem = await taskpaneRequestOrNull('/nicht-ausliefern.pem', ca);
      check(
        'Eine Endung außerhalb der Positivliste ergibt 403',
        pem.status === 403 && !pem.body.includes('PRIVATE KEY'),
        `Status ${String(pem.status)}`,
      );

      const escape = await taskpaneRequestOrNull('/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd', ca);
      check(
        'Kodierte Aufwärtsschritte liefern keine fremde Datei',
        (escape.status === 403 || escape.status === 404) && !escape.body.includes('root:'),
        `Status ${String(escape.status)}`,
      );
    } else {
      failed += 3;
      process.stdout.write('  ----  Die drei Prüfungen am Aufgabenbereich entfallen: Der Port kam nicht hoch.\n');
    }

    // 18 — Rechte des Anwendungsdatenverzeichnisses (B-7.2)
    // Das Verzeichnis legt die **Hülle** an, nicht der Dienst (E-018, T-011
    // Risiko 2). Geprüft wird deshalb, dass der Dienst ein vorbereitetes
    // Verzeichnis mit 0700 annimmt und die Rechte nicht aufweitet — nicht,
    // dass er es selbst anlegt.
    if (process.platform === 'win32') {
      process.stdout.write('  ----  Rechteprüfung entfällt unter Windows; dort trägt die ACL die Grenze.\n');
    } else {
      const mode = statSync(preparedDir).mode & 0o777;
      check('Das von der Hülle angelegte Verzeichnis bleibt bei 0700', mode === 0o700, `war ${mode.toString(8)}`);
    }

    // 19 — Endet stdin, endet der Prozess (B-1.6 Punkt 3)
    service.child.stdin.end();
    const code = await service.waitForExit(10_000);
    check('Nach dem Schließen von stdin endet der Dienst', code !== null, 'lief weiter');
    if (code === null) {
      service.child.kill('SIGKILL');
    }
  } else {
    service.child.kill('SIGKILL');
  }

  // Ein `takt_`-Geheimnis darf in der gesamten Ausgabe nicht vorkommen (B-2.4).
  check(
    'Kein Geheimnis in der Ausgabe des Dienstes',
    !new RegExp(secret).test(service.read()) && !/takt_[A-Za-z0-9_-]{40,}/.test(service.read()),
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}

process.stdout.write(`\n${passed} bestanden, ${failed} fehlgeschlagen.\n`);
process.exit(failed === 0 ? 0 : 1);
