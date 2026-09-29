import { checkNoHardcodedPort, portFree, proofPort, waitForPortFree } from './port-probe.mjs';
/**
 * Takt — Nachweis des Zugriffsverfahrens (T-011).
 *
 * Dies ist **kein** Testlauf im Sinne von T-010 — die Testhoheit liegt beim
 * unit-tester. Es ist der Prüfpfad, mit dem der Erbauer belegt, dass die
 * Gegenmittel aus dem Bedrohungsmodell tatsächlich greifen: „nachgewiesen,
 * nicht behauptet".
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:access
 *
 * Der Lauf startet den echten Dienst als Kindprozess mit einem Startgeheimnis
 * über `stdin`, lenkt das Anwendungsdatenverzeichnis in einen Wegwerfordner
 * (`proof-appdata.mjs`, auf jeder Plattform über die Variable, die der Dienst
 * dort liest) und fährt danach eine Tabelle von Anfragen dagegen.
 *
 * Ausgabe: eine Zeile je Prüfung, am Ende eine Zusammenfassung. Exitcode 1,
 * sobald eine Prüfung fehlschlägt.
 */

import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, readFile } from 'node:fs/promises';
import { tmpdir, networkInterfaces } from 'node:os';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createConnection, createServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';

import { migrationsVerzeichnis, paketQuelle, paketVerzeichnis, scheitern } from './source-resolve.mjs';
import { DatabaseSync } from 'node:sqlite';
import { appDataDirIn, isolatedAppDataEnv } from './proof-appdata.mjs';

/*
 * Die drei Fristen des Betriebs kommen aus `config.ts` und stehen hier nicht
 * als Zahlen (T-128, E-063 Punkt 4). Ein Nachweis, der seine Erwartung
 * abschreibt, mißt seine eigene Abschrift: Setzte jemand `HEADERS_TIMEOUT_MS`
 * wieder auf sechzig Sekunden, würde eine hier hingeschriebene 5000 rot — mit
 * einer Meldung, die auf den Nachweis zeigt statt auf die Änderung. So zeigt
 * sie auf die Änderung.
 */
import {
  CONNECTION_CHECK_INTERVAL_MS,
  HEADERS_TIMEOUT_MS,
  REQUEST_RECEIVE_TIMEOUT_MS,
} from '../src/config.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Das Paket, dessen Nachweispfad hier durchsucht wird — über seinen **Namen**
 * (T-249-1).
 *
 * Bis T-249-1 stand dafür `join(HERE, '..')`: eine Ebene über diesem Skript.
 * Das stimmte, solange das Skript in `apps/local-api/scripts` liegt, und band
 * damit den Ort der Messung an den Ort des Meßgeräts.
 */
const PAKET_WURZEL = paketVerzeichnis('@takt/local-api');

/**
 * Das Migrationsverzeichnis — über die Ausfuhrtabelle von `@takt/storage`,
 * mit Untergrenze (T-249-1).
 *
 * Die Untergrenze trägt hier mehr als anderswo: `MIGRATION_COUNT` geht weiter
 * unten als „so viele Migrationen kennt diese Fassung" in eine Meldung ein, die
 * mit einer Datenbankfassung verglichen wird. Ein leeres oder falsches
 * Verzeichnis ergäbe dort eine Zahl, die niemand als falsch erkennt.
 */
const MIGRATIONS_DIR = migrationsVerzeichnis({ mindestens: 12 });

/**
 * **Nicht `src/index.ts`** (T-146, Befund T-145-1).
 *
 * `src/index.ts` ruft `main()` ohne Argument, und `main()` startet die
 * Versionsprüfung. Dieser Lauf dauert länger als deren Startabstand — `ss -tnp`
 * hat währenddessen `ESTAB … 140.82.121.6:443` gezeigt, also `api.github.com`.
 * Der Nachweis, der die Vertrauensgrenze mißt, überschritt sie selbst: ein
 * Lebenszeichen (R-19 Punkt 3) aus jedem `pnpm check`, Mitverbrauch der 60
 * Anfragen je Stunde und Quelladresse (T-136-5).
 *
 * `proof-access-entry.ts` ruft **denselben** `main()` — dieselbe Migration,
 * dieselbe Rechteprüfung, denselben Aufgabenbereich, dieselben
 * Beendigungscodes — und setzt als einziges eine Abholfunktion ein, die den
 * Prozeß nicht verläßt. Ein ausdrücklicher Parameter am Zusammenbau und keine
 * Umgebungsvariable: Eine Variable wäre von außen setzbar und damit genau das,
 * was A-18.3 verbietet.
 */
const ENTRY = join(HERE, 'proof-access-entry.ts');
/** From TAKT_PROOF_PORT, default the product port (E-121 point 8); the entry reads the same variable. */
const PORT = proofPort();
const SECRET_SHAPE = /takt_[A-Za-z0-9_-]{43}/;

/**
 * Wie viele Migrationen diese Fassung kennt — **gezählt, nicht abgeschrieben**
 * (T-132, Abschnitt 0g).
 *
 * Die Zahl wächst mit jeder neuen Migration. Stünde sie hier als Ziffer, würde
 * dieser Nachweis bei der nächsten Migration rot — mit einer Meldung, die auf
 * den Nachweis zeigt statt auf die Änderung.
 */
const MIGRATION_COUNT = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.up.sql')).length;

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  FEHL  ${name}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/**
 * A promise this platform cannot measure (E-121 point 10, E-124 point 8).
 *
 * On Linux, the CI runner that can measure every line of this run, a skip is red. Elsewhere
 * the line is not counted as passed and is listed in the summary as "ungemessen: <platform>".
 */
const unmeasured = [];
function cannotMeasure(name, reason) {
  if (process.platform === 'linux') {
    check(name, false, `nicht meßbar unter linux: ${reason}`);
    return;
  }
  unmeasured.push(name);
  console.log(`  UNGEM ${name} — ungemessen: ${process.platform} (${reason})`);
}

/**
 * Connects to host:port and classifies the outcome for the bind address check (W-10).
 *
 * Only ECONNREFUSED counts as "refused": the address exists and nobody listens there.
 * Every other outcome (timeout, address not available, no IPv6) says nothing about the
 * service and is returned as "unmeasurable".
 */
function probeConnect(host, port) {
  return new Promise((done) => {
    const socket = createConnection({ host, port, timeout: 1500 });
    socket.once('connect', () => {
      socket.destroy();
      done({ outcome: 'accepted' });
    });
    socket.once('error', (error) => {
      done(error.code === 'ECONNREFUSED' ? { outcome: 'refused' } : { outcome: 'unmeasurable', code: error.code ?? 'error' });
    });
    socket.once('timeout', () => {
      socket.destroy();
      done({ outcome: 'unmeasurable', code: 'timeout' });
    });
  });
}

/** Listens on a wildcard address at a free port; the counter-probe for W-10. */
function listenWildcard(host) {
  return new Promise((done) => {
    const server = createServer((socket) => socket.destroy());
    server.once('error', (error) => done({ server: null, code: error.code ?? 'error' }));
    server.listen({ host, port: 0, ipv6Only: false }, () => done({ server, port: server.address().port }));
  });
}

// Dienst starten

async function startService(
  dataDir,
  { withSecret = true, withUser = true, user = 'kerem', closeAfterHandshake = false, secretValue } = {},
) {
  const child = spawn(process.execPath, [ENTRY], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: isolatedAppDataEnv(dataDir),
  });

  let stderr = '';
  let stdout = '';
  child.stderr.setEncoding('utf8');
  child.stdout.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });

  // Zwei Zeilen über denselben Kanal: Startgeheimnis, dann Windows-Benutzername
  // (B-1.6, E-042). Absichtlich in EINEM Schreibvorgang — so wie es die Hülle
  // tut. Ein Leser, der die zweite Zeile im selben Datenblock verschluckt,
  // fällt hier auf und nicht erst auf dem Rechner des Benutzers.
  const secret = withSecret ? (secretValue ?? `takt_${randomBytes(32).toString('base64url')}`) : null;
  if (secret !== null) {
    child.stdin.write(withUser ? `${secret}\n${user}\n` : `${secret}\n`);
    // Die Hülle stirbt unmittelbar nach dem Start des Sidecars — die
    // schärfste Fassung von B-1.6 Punkt 3, siehe Abschnitt 0d.
    if (closeAfterHandshake) child.stdin.end();
    if (!withUser) {
      // Nichts weiter: Der Dienst wartet auf die zweite Zeile und läuft in die
      // Zeitgrenze. Der Kanal bleibt offen, damit nicht `missing` statt
      // `user_missing` gemeldet wird.
    }
  } else {
    child.stdin.end();
  }

  return {
    child,
    secret,
    output: () => stderr + stdout,
    exit: new Promise((resolve) => child.once('exit', (code) => resolve(code))),
  };
}

/**
 * Beendet einen gestarteten Dienst **deterministisch** und gibt den Port frei.
 *
 * Dieselbe Abfolge wie im `finally`-Block am Dateiende, und aus demselben
 * Grund (T-029, Risiko 5): Erst die Röhre schließen — so beendet sich der
 * Dienst von selbst, wie unter der Hülle —, dann warten, dann `SIGTERM`, dann
 * `SIGKILL`. Zum Schluß wird der Port **nachgesehen** und nicht angenommen.
 *
 * Wer hier ungeduldig ist, bezahlt es weiter unten: Ein noch laufender Dienst
 * antwortet auf `/health`, der nächste Start scheitert still mit Code 74, und
 * `waitForService()` hält den fremden Prozess für den eigenen — reihenweise
 * Fehlschläge, die keine Regression sind, sondern ein falsch verstandener
 * Zustand. Siehe {@link waitForPortFree}.
 */
async function stopService(handle) {
  handle.child.stdin.end();
  let code = await Promise.race([handle.exit, sleep(5000).then(() => null)]);
  if (code === null && handle.child.exitCode === null) {
    handle.child.kill('SIGTERM');
    code = await Promise.race([handle.exit, sleep(3000).then(() => null)]);
  }
  if (code === null && handle.child.exitCode === null) {
    handle.child.kill('SIGKILL');
    await Promise.race([handle.exit, sleep(2000)]);
  }
  if (!(await waitForPortFree(PORT))) {
    throw new Error(
      `Der Dienst aus dem vorigen Abschnitt hat Port ${PORT} nicht freigegeben. ` +
        'Alles Weitere liefe gegen einen fremden Prozess und wäre kein Nachweis.',
    );
  }
}

async function waitForService(deadlineMs = 8000) {
  const until = Date.now() + deadlineMs;
  while (Date.now() < until) {
    try {
      await call('/api/v1/health', { headers: { host: `127.0.0.1:${PORT}` } });
      return true;
    } catch {
      await sleep(100);
    }
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Öffnet eine Verbindung auf {@link PORT} und schickt einen Anfragekopf **ohne**
 * die abschließende Leerzeile (T-126, Abschnitt 0e).
 *
 * Für Node ist die Anfrage damit unfertig: Die Verbindung gilt als eine, die
 * gerade eine Anfrage sendet, und `server.close()` wartet auf sie. Genau das
 * ist der Unterschied zu einer untätigen Verbindung — die schließt `close()`
 * seit Node 19 von selbst.
 *
 * `error` wird abgefangen. Der Dienst reißt die Verbindung beim Anhalten ab,
 * und ein unbehandeltes `error` auf einem Socket beendete den Nachweislauf mit
 * einem Wurf, der nichts mit dem Gegenstand zu tun hätte.
 */
function openHalfRequest() {
  return new Promise((done) => {
    const socket = createConnection({ host: '127.0.0.1', port: PORT });
    socket.on('error', () => undefined);
    socket.once('connect', () => {
      socket.write(`GET /api/v1/health HTTP/1.1\r\nHost: 127.0.0.1:${PORT}\r\n`);
      done(socket);
    });
    setTimeout(() => done(null), 2000).unref();
  });
}



/** Antworten werden vollständig eingesammelt, damit die Leckprüfung sie sieht. */
const seenBodies = [];

/**
 * Anfragen laufen über `node:http`, nicht über `fetch`.
 *
 * Zwei Gründe: `fetch` lässt die Kopfzeile `Host` nicht setzen — genau die,
 * gegen die B-1.3 prüft — und es hält Verbindungen offen, was nach einer mit
 * 413 abgebrochenen Anfrage die nächste mitreißt. `agent: false` erzwingt je
 * Anfrage eine eigene Verbindung.
 */
function call(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(body);
    const finalHeaders = { host: `127.0.0.1:${PORT}`, ...headers };
    if (payload !== null && finalHeaders['content-length'] === undefined) {
      finalHeaders['content-length'] = String(payload.byteLength);
    }
    const req = httpRequest(
      { host: '127.0.0.1', port: PORT, path, method, headers: finalHeaders, agent: false },
      (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          text += chunk;
        });
        res.on('end', () => {
          seenBodies.push(text);
          resolve({
            status: res.statusCode,
            text,
            headers: { get: (name) => res.headers[name.toLowerCase()] ?? null },
          });
        });
      },
    );
    req.on('error', reject);
    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

/** Rohe Anfrage ohne `Host` — das kann `fetch` nicht. */
function rawRequest(lines) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port: PORT }, () => {
      socket.write(`${lines.join('\r\n')}\r\n\r\n`);
    });
    let data = '';
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      data += chunk;
    });
    socket.on('end', () => resolve(data));
    socket.on('error', reject);
    setTimeout(() => {
      socket.destroy();
      resolve(data);
    }, 2000);
  });
}

// Lauf

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-'));
let service = null;
let hardFailure = null;

try {
  section('Port aus TAKT_PROOF_PORT, nicht hartkodiert (E-121 Punkt 8, T-397a)');
  await checkNoHardcodedPort(check, [fileURLToPath(import.meta.url), ENTRY]);

  if (!(await waitForPortFree(PORT))) {
    throw new Error(
      `Auf 127.0.0.1:${PORT} lauscht bereits etwas, auch nach 5 s Warten. ` +
        'Läuft Takt oder ein anderer Prüfpfad (proof:access, proof:addin-wiring) noch?',
    );
  }

  section('0. Start ohne Startgeheimnis (B-1.6 Punkt 2)');
  {
    const bare = await startService(dataDir, { withSecret: false });
    const code = await Promise.race([bare.exit, sleep(8000).then(() => 'timeout')]);
    check('Ohne Startgeheimnis beendet sich der Dienst mit Code 78', code === 78, `Code ${code}`);
  }

  section('0-. Ein abgewiesenes Startgeheimnis steht nicht in der Meldung (B-2.4, W-7)');
  {
    /*
     * Started without a secret, "the message names no secret" had nothing to name (W-7).
     * Here the service receives a secret-like value that is too short and therefore
     * rejected, and exactly that value must be absent from its output. It does not match
     * SECRET_SHAPE, so the redactor cannot hide it: only the handshake itself keeps it out.
     */
    const rejectedValue = `takt_${randomBytes(19).toString('base64url')}`;
    const tooShort = await startService(dataDir, { secretValue: rejectedValue });
    const code = await Promise.race([tooShort.exit, sleep(8000).then(() => 'timeout')]);
    const ausgabe = tooShort.output();
    check('Ein zu kurzes Startgeheimnis beendet den Dienst mit Code 78', code === 78, `Code ${code}`);
    check(
      'Vorbedingung: der Dienst hat den Wert gelesen und als zu kurz abgewiesen (reason=too_short)',
      rejectedValue.length < 32 && ausgabe.includes('reason=too_short'),
      ausgabe.slice(0, 300),
    );
    check(
      'Die Meldung gibt den abgewiesenen Wert nicht wieder, auch nicht teilweise',
      !ausgabe.includes(rejectedValue) && !ausgabe.includes(rejectedValue.slice(5)),
      ausgabe.slice(0, 300),
    );
    if (code === 'timeout') await stopService(tooShort);
  }

  section('0a. Start ohne Windows-Benutzernamen (E-042, B-8.1)');
  {
    const noUser = await startService(dataDir, { withUser: false });
    const code = await Promise.race([noUser.exit, sleep(12000).then(() => 'timeout')]);
    check('Ohne zweite stdin-Zeile beendet sich der Dienst mit Code 78', code === 78, `Code ${code}`);
    check(
      'Die Meldung nennt den fehlenden Benutzernamen und kein Geheimnis',
      noUser.output().includes('Windows-Benutzernamen') && !SECRET_SHAPE.test(noUser.output()),
      noUser.output().slice(0, 200),
    );
  }

  section('0b. Windows-Benutzername mit Steuer- oder Richtungszeichen (O-AE, T-122)');
  {
    /*
     * Der Name geht **unverändert** als `WindowsUser` in die Exportdatei
     * (A-8.5, E-010). Bis T-122 prüfte der Handschlag nur gegen C0 und DEL;
     * ein `U+202E` drehte damit eine Zeile der Datei, die beim Abrechnungstool
     * landet. Seit T-122 gilt hier dieselbe Klasse wie an der Haupttür
     * (`hasForbiddenNameCharacter` in `@takt/domain`).
     *
     * Die Zeichen stehen als Escape-Folgen und nicht roh (T-112-H2). Geprüft
     * werden die drei Bauarten und ausdrücklich **beide** Erweiterungen, die
     * hier bis T-122 fehlten: C1 und die Richtungsmarken.
     */
    const abzuweisen = [
      ['U+202E (RLO) — dreht die Zeile der Exportdatei um', 'kerem\u202egnp.exe'],
      ['U+0085 (NEL) — C1, bis T-122 nicht erfasst', 'kerem\u0085admin'],
      ['U+200F (RLM) — Richtungsmarke, bis T-122 nicht erfasst', 'kerem\u200fnord'],
    ];

    for (const [name, wert] of abzuweisen) {
      const bent = await startService(dataDir, { user: wert });
      const code = await Promise.race([bent.exit, sleep(12000).then(() => 'timeout')]);
      const ausgabe = bent.output();
      check(`${name}: der Dienst startet nicht (Code 78)`, code === 78, `Code ${code}`);
      check(
        `${name}: die Meldung nennt den Grund und gibt den Namen nicht wieder`,
        ausgabe.includes('Steuer- oder Richtungszeichen') &&
          !ausgabe.includes(wert) &&
          !SECRET_SHAPE.test(ausgabe),
        ausgabe.slice(0, 200),
      );
    }
  }

  section('0c. Ein gewöhnlicher Name bleibt gültig (Gegenprobe zu 0b)');
  {
    /*
     * Eine Prüfung, die alles abweist, ist grün und nutzlos. Der Name unten
     * trägt Umlaut, Leerzeichen, Punkt und Bindestrich — alles, was in einem
     * Konto vorkommt und mit der Klasse nichts zu tun hat. Er ist erfunden.
     */
    const gewoehnlich = await startService(dataDir, { user: 'Jan-Peter Müller.adm' });
    service = gewoehnlich;
    const oben = await waitForService();
    check('Ein Name mit Umlaut, Leerzeichen und Punkt lässt den Dienst starten', oben);
    check(
      'Und er ist es auch, der antwortet — der Dienst nennt seine Bindeadresse',
      gewoehnlich.output().includes(`Takt lauscht auf 127.0.0.1:${PORT}`),
      gewoehnlich.output().slice(0, 200),
    );
    /*
     * Und die Probe auf B-1.6 Punkt 3 an der frühesten Stelle, an der sie
     * möglich ist: Die Röhre wird geschlossen, sobald `/health` antwortet —
     * also mitten im Start, während der Aufgabenbereich noch sein Zertifikat
     * erzeugt. Bis T-122 überlebte der Dienst das: Der Handschlag ließ den
     * Strom fließen, das Dateiende ging verloren, und `watchParentLink` meldete
     * sich an einem Strom an, der schon zu Ende war. Gefunden wurde es an einem
     * verwaisten Prozess, der den Port hielt.
     */
    gewoehnlich.child.stdin.end();
    const ende = await Promise.race([gewoehnlich.exit, sleep(8000).then(() => 'timeout')]);
    check(
      'Endet die Röhre unmittelbar nach dem Start, hält der Dienst von selbst an (B-1.6 Punkt 3)',
      ende === 0,
      `Code ${ende}`,
    );

    await stopService(gewoehnlich);
    service = null;
  }

  section('0g. Der Startabbruch nennt seinen Grund, und zwar pfadfrei (T-132, B-2.4)');
  {
    /*
     * ---------------------------------------------------------------------
     * Warum dieser Abschnitt hier steht und nicht nur in den Einheitentests
     * ---------------------------------------------------------------------
     *
     * Am 2026-09-04 um 18:57 startete Takt nicht, und im Protokoll stand ein
     * Satz, der die Folge nannte und nicht die Ursache: `main.ts` fing den
     * Wurf mit `catch {` ohne Bindung ab. Der Grund war damit für immer weg.
     *
     * Die Einheitentests (`apps/local-api/test/startup.test.ts`) messen die
     * Übersetzung von Grund zu Zeile über den vollständigen Vorrat. Was sie
     * **nicht** messen können, ist die Kette: echter Bestand, echter Läufer,
     * echter Sidecar, echtes `stderr`. Genau die ist am 2026-09-04 gerissen,
     * und genau die steht hier — zwei Gründe, die sich ohne Zutun eines
     * Menschen herstellen lassen.
     *
     * Zwei Zusagen werden gemessen, und die zweite ist die aus B-2.4: Die
     * Zeile nennt den **Grund** und trägt **keinen Pfad**. Der Bestand liegt
     * dabei in einem Wegwerfordner, dessen Name im Lauf bekannt ist — käme er
     * durch, stünde er hier.
     */
    const startAbbruch = async (name, prepare, erwarteterGrund) => {
      const eigener = await mkdtemp(join(tmpdir(), 'takt-proof-abbruch-'));
      try {
        const appDir = appDataDirIn(eigener);
        await mkdir(appDir, { recursive: true, mode: 0o700 });
        const db = new DatabaseSync(join(appDir, 'takt.db'));
        db.exec(
          'CREATE TABLE schema_migration (version INTEGER NOT NULL PRIMARY KEY, name TEXT NOT NULL, ' +
            'checksum TEXT NOT NULL, applied_at TEXT NOT NULL);',
        );
        prepare(db);
        db.close();

        const abbruch = await startService(eigener);
        const code = await Promise.race([abbruch.exit, sleep(15000).then(() => 'timeout')]);
        const ausgabe = abbruch.output();
        if (code === 'timeout') await stopService(abbruch);

        // 65 = migration failed (A-28.10, E-129 point 4); 78 stays the handshake code.
        check(`${name}: der Dienst beendet sich mit Code 65`, code === 65, `Code ${code}`);
        check(
          `${name}: die Protokollzeile nennt den Grund „${erwarteterGrund}"`,
          ausgabe.includes(`"reason":"${erwarteterGrund}"`),
          ausgabe.slice(-400),
        );
        check(
          `${name}: die Ausgabe trägt weder Ordner noch Dateinamen des Bestands`,
          !ausgabe.includes(eigener) && !ausgabe.includes('takt.db') && !ausgabe.includes(tmpdir()),
          ausgabe.slice(-400),
        );
        check(
          `${name}: und auch keine Meldung von SQLite oder einen Aufrufstapel`,
          !ausgabe.includes('\n    at ') &&
            !ausgabe.includes('database is locked') &&
            !ausgabe.includes('SQLITE_'),
          ausgabe.slice(-400),
        );
      } finally {
        await rm(eigener, { recursive: true, force: true });
      }
    };

    /*
     * Der Bestand ist neuer als diese Fassung. Fassung 4711 gibt es nicht und
     * wird es nie geben — die Zahl ist damit gegen jede künftige Migration
     * stabil, und `known` steht bewusst **nicht** hier: Sie wächst mit jeder
     * neuen Migration, und ein Nachweis, der sie abschreibt, mißt seine eigene
     * Abschrift (T-128).
     */
    await startAbbruch(
      'Bestand aus einer neueren Fassung',
      (db) =>
        db
          .prepare('INSERT INTO schema_migration VALUES (?, ?, ?, ?)')
          .run(4711, 'aus_der_zukunft', 'x'.repeat(64), '2026-09-04T18:57:44Z'),
      'database_too_new database=4711 known=' + MIGRATION_COUNT,
    );

    /*
     * Eine bereits gelaufene Migration sieht heute anders aus. Fassung 1 gibt
     * es, ihre Prüfsumme hier ist erfunden — der Läufer muß das bemerken und
     * darf nicht migrieren.
     */
    await startAbbruch(
      'nachträglich geänderte Migration',
      (db) =>
        db
          .prepare('INSERT INTO schema_migration VALUES (?, ?, ?, ?)')
          .run(1, 'initial', 'nicht die echte pruefsumme', '2026-09-04T18:57:44Z'),
      'checksum_mismatch version=1',
    );
  }

  section('0d. Die Hülle stirbt während des Starts (B-1.6 Punkt 3, T-122)');
  {
    /*
     * Der Fall, den es gegeben hat, und er ist beim Aufräumen dieser Aufgabe
     * aufgefallen: ein verwaister Sidecar, der den Port hielt.
     *
     * Der Handschlag las `stdin` im fließenden Zustand und meldete danach nur
     * seine Zuhörer ab — der Strom lief weiter. Zwischen diesem Augenblick und
     * dem Anmelden von `watchParentLink` liegen Migration, Bestandssicherung
     * und das Zertifikat des Aufgabenbereichs. Schloß die Hülle in diesem
     * Fenster ihre Seite der Röhre, ging das Dateiende an einen Strom ohne
     * Zuhörer, und der Wächter meldete sich danach an einem Strom an, der schon
     * zu Ende war. Ergebnis: ein Prozess mit Datenbankzugriff, ohne Fenster,
     * ohne Ende — gemessen 15 Sekunden und weiter laufend.
     *
     * Hier wird die Röhre **unmittelbar nach dem Handschlag** geschlossen, ohne
     * auf `/health` zu warten. Damit hängt der Fall nicht am Zeitverhalten des
     * Rechners: Der Dienst ist zu diesem Zeitpunkt mit Sicherheit noch im Start.
     */
    const fruehesEnde = await startService(dataDir, { closeAfterHandshake: true });
    const code = await Promise.race([fruehesEnde.exit, sleep(15000).then(() => 'läuft weiter')]);
    check('Der Sidecar überlebt die Hülle nicht, auch nicht mitten im Start', code === 0, `Code ${code}`);
    check(
      'Und er sagt, warum er anhält',
      fruehesEnde.output().includes('Die Verbindung zur Anwendung ist beendet'),
      fruehesEnde.output().slice(-200),
    );
    if (code !== 0) {
      fruehesEnde.child.kill('SIGKILL');
      await Promise.race([fruehesEnde.exit, sleep(2000)]);
    }
    if (!(await waitForPortFree(PORT))) {
      throw new Error(`Nach Abschnitt 0d ist Port ${PORT} nicht frei.`);
    }
  }

  section('0e. Ein fremder Prozess hält eine Verbindung offen, während die Hülle stirbt (T-125-4, T-126)');
  {
    /*
     * 0c und 0d messen mit **stiller Leitung**: Wenn die Röhre endet, redet
     * niemand mit dem Dienst, und dann hält `shutdown()` mühelos Wort. Hier
     * redet jemand — halb.
     *
     * Der Abschnitt öffnet eine Verbindung auf den Prüfport und schickt einen
     * Anfragekopf ohne die abschließende Leerzeile. Für Node ist das eine
     * Anfrage, die noch kommt; `server.close()` wartet auf sie, bis
     * `headersTimeout` greift (60 s Vorgabe) oder, bei stockendem Rumpf,
     * `requestTimeout` (300 s). Bis T-126 führte der **einzige** Weg zu
     * `process.exit(0)` durch diesen Rückruf — der Dienst überlebte die Hülle
     * also so lange, wie ein fremder Prozess es wollte. Ein fremder Prozess auf
     * demselben Rechner ist genau der Akteur, gegen den B-1.6 geschrieben ist
     * (VG-1); er braucht dafür kein Geheimnis, nur eine TCP-Verbindung.
     *
     * Die Zeitgrenze aus B-1.7 hilft hier nicht: `timeout(REQUEST_TIMEOUT_MS)`
     * ist Hono-Zwischenschicht und läuft erst, wenn Node den Kopf vollständig
     * gelesen hat. Ein halber Kopf kommt dort nie an.
     *
     * Gemessen wird deshalb nicht nur **ob**, sondern **wann**. Ein Anhalten
     * nach einer Minute wäre keines, das ein Benutzer abwartet — und ein
     * Nachweis, der nur `code === 0` prüft, wäre auch ohne die Behebung grün,
     * sofern man ihm 60 Sekunden Zeit ließe.
     */
    const GRENZE_MS = 5_000;

    const gehalten = await startService(dataDir, { user: 'Jan-Peter Müller.adm' });
    const oben = await waitForService();
    check('Vorbedingung: der Dienst ist oben und antwortet', oben, gehalten.output().slice(-200));

    const halbeAnfrage = await openHalfRequest();
    check('Ein fremder Prozess hält eine Verbindung mit halbem Anfragekopf', halbeAnfrage !== null);

    gehalten.child.stdin.end();
    const begonnen = Date.now();
    const code = await Promise.race([gehalten.exit, sleep(20_000).then(() => 'läuft weiter')]);
    const dauer = Date.now() - begonnen;
    halbeAnfrage?.destroy();

    check(
      'Der Sidecar überlebt die Hülle auch dann nicht, wenn eine Verbindung offen gehalten wird',
      code === 0,
      `Code ${code} nach ${dauer} ms`,
    );
    check(
      `Und er hält binnen ${GRENZE_MS} ms an — der fremde Prozess bestimmt den Zeitpunkt nicht`,
      code === 0 && dauer < GRENZE_MS,
      `${dauer} ms`,
    );
    check(
      'Er geht dabei den ordentlichen Weg und sagt, warum er anhält',
      gehalten.output().includes('Die Verbindung zur Anwendung ist beendet'),
      gehalten.output().slice(-200),
    );
    /*
     * Die schärfste der sechs Prüfungen. `closeAllConnections()` ist das
     * Mittel, die Frist aus `SHUTDOWN_DEADLINE_MS` ist nur der Boden darunter
     * — und ein Boden, der jedes Mal trägt, verdeckt, dass das Mittel nicht
     * mehr greift. Fiele der Aufruf eines Tages weg, wäre alles oben weiterhin
     * grün: angehalten wird ja, und binnen zwei Sekunden auch. Diese Zeile
     * fragt, **worüber**.
     */
    check(
      'Und zwar über das Abräumen der Verbindungen, nicht erst über die Frist',
      code === 0 && !gehalten.output().includes('Beim Anhalten waren noch Verbindungen offen'),
      gehalten.output().slice(-200),
    );

    if (code !== 0) {
      gehalten.child.kill('SIGKILL');
      await Promise.race([gehalten.exit, sleep(2000)]);
    }
    if (!(await waitForPortFree(PORT))) {
      throw new Error(`Nach Abschnitt 0e ist Port ${PORT} nicht frei.`);
    }
  }

  service = await startService(dataDir);
  const started = await waitForService();
  if (!started) {
    // Ein `throw` statt `process.exit(1)`: Letzteres würde den `finally`-Block
    // unten überspringen und den gerade gestarteten Kindprozess mit dem Port
    // verwaist zurücklassen — genau die Sorte Fund, die diese Aufgabe beheben
    // soll, nur an anderer Stelle im selben Skript.
    throw new Error(`Der Dienst ist nicht hochgekommen.\n${service.output()}`);
  }

  const H = { host: `127.0.0.1:${PORT}` };
  const sessionHeaders = { ...H, 'X-Takt-Token': service.secret };

  section('0f. Dieselbe halbe Anfrage im laufenden Betrieb (B-1.7, T-125-4 R2, T-128)');
  {
    /*
     * 0e mißt das **Anhalten**, dieser Abschnitt den **Betrieb**. Es ist
     * derselbe fremde Prozess mit derselben halben Anfrage, nur stirbt hier
     * niemand: Der Dienst läuft weiter, und die Frage ist, wie lange er eine
     * Verbindung hält, auf der nichts mehr kommt.
     *
     * Bis T-128 waren das die Vorgaben von Node — 60 Sekunden für den Kopf, 300
     * für die ganze Anfrage, nachgesehen alle 30. Das sind Werte für einen
     * Dienst hinter einem Gegenlager im Netz. Takt hat keins: Es ist selbst das
     * erste, was die Verbindung sieht, und jeder Aufrufer sitzt auf demselben
     * Rechner. Ein Prozess, der viele solche Verbindungen aufmacht, nimmt der
     * eigenen Oberfläche die Betriebsmittel weg, und zwar ohne ein Geheimnis zu
     * kennen (VG-1).
     *
     * Gemessen wird **wann** und **womit**: Die Verbindung muß binnen
     * `HEADERS_TIMEOUT_MS + CONNECTION_CHECK_INTERVAL_MS` weg sein, und Node
     * muß dabei mit 408 antworten. Ohne die zweite Hälfte wäre auch ein
     * abgestürzter Dienst grün.
     */
    /*
     * Die Summe der beiden Fristen ist die Zusicherung; die fünf Sekunden
     * obendrauf sind Luft für den Takt und für einen ausgelasteten Rechner.
     * Gemessen wurde 9975 ms — der Wert liegt an der Summe und nicht an der
     * Luft. Was die Prüfung ausschließen soll, ist die Vorgabe von Node, und
     * die schließt sie um den Faktor vier aus; ohne die Behebung ist die
     * Verbindung nach 22 Sekunden noch da (Gegenprobe T-128).
     */
    const GRENZE_MS = HEADERS_TIMEOUT_MS + CONNECTION_CHECK_INTERVAL_MS + 5_000;

    check(
      'Die Fristen stehen unter den Vorgaben von Node (60 s Kopf, 300 s Anfrage)',
      HEADERS_TIMEOUT_MS < 60_000 &&
        REQUEST_RECEIVE_TIMEOUT_MS < 300_000 &&
        HEADERS_TIMEOUT_MS < REQUEST_RECEIVE_TIMEOUT_MS &&
        CONNECTION_CHECK_INTERVAL_MS < 30_000,
      `Kopf ${HEADERS_TIMEOUT_MS} ms, Anfrage ${REQUEST_RECEIVE_TIMEOUT_MS} ms, Takt ${CONNECTION_CHECK_INTERVAL_MS} ms`,
    );

    const halbeAnfrage = await openHalfRequest();
    check('Ein fremder Prozess hält eine Verbindung mit halbem Anfragekopf', halbeAnfrage !== null);

    const begonnen = Date.now();
    let antwort = '';
    if (halbeAnfrage !== null) halbeAnfrage.on('data', (teil) => (antwort += teil.toString('utf8')));
    const geschlossen = await new Promise((fertig) => {
      if (halbeAnfrage === null) {
        fertig(false);
        return;
      }
      halbeAnfrage.once('close', () => fertig(true));
      setTimeout(() => fertig(false), GRENZE_MS + 10_000).unref();
    });
    const dauer = Date.now() - begonnen;
    halbeAnfrage?.destroy();

    check(
      `Der Dienst trennt sie binnen ${GRENZE_MS} ms — der fremde Prozess bestimmt nicht, wie lange`,
      geschlossen && dauer < GRENZE_MS,
      `${geschlossen ? `${dauer} ms` : 'nicht getrennt'}`,
    );
    // Die Zahl gehört auch in den grünen Lauf. Wer ihn liest, soll sehen, wie
    // weit die Messung von der Grenze entfernt ist, und nicht nur, dass sie
    // darunter liegt.
    console.log(`        getrennt nach ${geschlossen ? `${dauer} ms` : 'gar nicht'}`);
    /*
     * Die Prüfung, die den Unterschied zwischen „behoben" und „zufällig weg"
     * macht. Ein 408 ist Nodes Antwort auf genau diese Frist; eine Verbindung,
     * die aus einem anderen Grund fällt, kommt ohne Antwort zurück.
     */
    check(
      'Und zwar über die Frist: Node antwortet mit 408',
      antwort.startsWith('HTTP/1.1 408'),
      antwort.split('\r\n')[0] ?? '(keine Antwort)',
    );

    const nachher = await call('/api/v1/health', { headers: sessionHeaders });
    check(
      'Der Dienst selbst läuft weiter — getrennt wird die Verbindung, nicht der Dienst',
      nachher.status === 200,
      String(nachher.status),
    );
  }

  section('1. Bindeadresse (B-1.1 Punkt 3 und 4)');
  {
    /*
     * W-10: The service's own "listening on 127.0.0.1" is a self-report, and the external
     * IPv4 check depends on the network. The network-independent measurement: a wildcard
     * bind (0.0.0.0 or ::) would also accept 127.0.0.2 and [::1]; a bind to 127.0.0.1 only
     * refuses both. The counter-probe binds a wildcard itself and must see it accepted,
     * otherwise "refused" above would prove nothing on this machine.
     */
    check(
      `Selbstauskunft: der Dienst nennt 127.0.0.1:${PORT} als Bindeadresse`,
      service.output().includes(`Takt lauscht auf 127.0.0.1:${PORT}`),
    );
    const own = await probeConnect('127.0.0.1', PORT);
    check(`Vorbedingung: über 127.0.0.1:${PORT} nimmt der Dienst an`, own.outcome === 'accepted', JSON.stringify(own));

    for (const [host, wildcard, label] of [
      ['127.0.0.2', '0.0.0.0', '127.0.0.2'],
      ['::1', '::', '[::1]'],
    ]) {
      const counter = await listenWildcard(wildcard);
      const counterProbe = counter.server === null ? { outcome: 'unmeasurable', code: counter.code } : await probeConnect(host, counter.port);
      if (counter.server !== null) await new Promise((done) => counter.server.close(done));
      const probe = await probeConnect(host, PORT);

      const name = `Über ${label}:${PORT} ist der Dienst nicht erreichbar — keine Platzhalterbindung`;
      if (counterProbe.outcome !== 'accepted' || probe.outcome === 'unmeasurable') {
        cannotMeasure(
          name,
          `Gegenprobe über ${wildcard}: ${counterProbe.outcome}${counterProbe.code ? ` ${counterProbe.code}` : ''}, ` +
            `Messung: ${probe.outcome}${probe.code ? ` ${probe.code}` : ''}`,
        );
        continue;
      }
      check(`Gegenprobe: eine Bindung an ${wildcard} wäre über ${label} erreichbar`, counterProbe.outcome === 'accepted');
      check(name, probe.outcome === 'refused', JSON.stringify(probe));
    }

    const external = Object.values(networkInterfaces())
      .flat()
      .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal)
      .map((entry) => entry.address);
    if (external.length === 0) {
      // Not a passed line: the wildcard case is measured above without a network.
      console.log('  --    keine externe IPv4 vorhanden; nicht gezählt, die Platzhalterbindung messen die Zeilen darüber');
    } else {
      const reachable = await probeConnect(external[0], PORT);
      check(`Über ${external[0]}:${PORT} ist der Dienst nicht erreichbar`, reachable.outcome !== 'accepted', JSON.stringify(reachable));
    }
  }

  section('2. Zielrechner — DNS-Rebinding (B-1.3)');
  {
    const evil = await call('/api/v1/health', { headers: { host: `evil.example:${PORT}` } });
    check('Host: evil.example ergibt 403', evil.status === 403);
    check('… mit dem Schlüssel host_not_allowed', evil.text.includes('host_not_allowed'));

    const evilWithToken = await call('/api/v1/health', {
      headers: { host: `evil.example:${PORT}`, 'X-Takt-Token': service.secret },
    });
    check(
      'Auch mit gültigem Nachweis: 403 — die Host-Prüfung steht vor dem Token',
      evilWithToken.status === 403,
    );

    const raw = await rawRequest(['GET /api/v1/health HTTP/1.0']);
    check('Anfrage ohne Host-Kopf wird abgewiesen', /40[0-9]/.test(raw.split('\r\n')[0] ?? ''), raw.split('\r\n')[0]);

    const suffix = await call('/api/v1/health', { headers: { host: `127.0.0.1.evil.example:${PORT}` } });
    check(
      `Host: 127.0.0.1.evil.example:${PORT} ergibt 403 — keine Präfixprüfung`,
      suffix.status === 403,
      `war ${suffix.status}`,
    );

    const brokenPort = await call('/api/v1/health', { headers: { host: `127.0.0.1:${PORT}.evil.example` } });
    check(
      'Host mit unsinnigem Port wird abgewiesen',
      brokenPort.status >= 400 && brokenPort.status < 500,
      `war ${brokenPort.status}`,
    );
  }

  section('3. Nachweis (B-1.1, B-2.7)');
  {
    const none = await call('/api/v1/health', { headers: H });
    check('Ohne Token: 401', none.status === 401);

    const wrong = await call('/api/v1/health', {
      headers: { ...H, 'X-Takt-Token': `takt_${randomBytes(32).toString('base64url')}` },
    });
    check('Mit falschem Token: 401', wrong.status === 401);
    check(
      'Beide 401-Antworten sind zeichengleich — kein Grund wird verraten',
      none.text === wrong.text,
    );

    const ok = await call('/api/v1/health', { headers: sessionHeaders });
    check('Mit Sitzungsgeheimnis: 200', ok.status === 200);
    check('Antwort nennt keinen Pfad und keinen Benutzernamen', ok.text === '{"data":{"status":"ok"}}', ok.text);
  }

  section('4. Token erzeugen und austauschen (B-2.2, B-2.7)');
  let addinToken = null;
  {
    const before = await call('/api/v1/token', { headers: sessionHeaders });
    check('Vor der Erzeugung: configured=false', before.text.includes('"configured":false'));

    const created = await call('/api/v1/token', { method: 'POST', headers: sessionHeaders });
    check('Erzeugen ergibt 201', created.status === 201);
    const match = SECRET_SHAPE.exec(created.text);
    addinToken = match === null ? null : match[0];
    check('Das erzeugte Token hat 48 Zeichen und das Präfix takt_', addinToken?.length === 48);

    const second = await call('/api/v1/token', { method: 'POST', headers: sessionHeaders });
    const secondToken = SECRET_SHAPE.exec(second.text)?.[0] ?? null;
    check('Zwei Erzeugungen unterscheiden sich', secondToken !== null && secondToken !== addinToken);

    const old = await call('/api/v1/health', { headers: { ...H, 'X-Takt-Token': addinToken } });
    check('Das alte Token ist sofort ungültig: 401', old.status === 401);

    addinToken = secondToken;
    const fresh = await call('/api/v1/health', { headers: { ...H, 'X-Takt-Token': addinToken } });
    check('Das neue Token trägt: 200', fresh.status === 200);

    const status = await call('/api/v1/token', { headers: sessionHeaders });
    check('Der Zustand nennt zuletzt verwendet', status.text.includes('"lastUsedAt":"'));
    check('Der Zustand gibt kein Token heraus', !SECRET_SHAPE.test(status.text));
  }

  section('5. Trennung der beiden Nachweise (B-2.9 Punkt 3)');
  {
    const addinOnTokenRoute = await call('/api/v1/token', {
      headers: { ...H, 'X-Takt-Token': addinToken },
    });
    check('Add-in-Token darf den Tokenzustand nicht lesen: 401', addinOnTokenRoute.status === 401);

    const addinRotate = await call('/api/v1/token', {
      method: 'POST',
      headers: { ...H, 'X-Takt-Token': addinToken },
    });
    check('Add-in-Token kann sich nicht selbst austauschen: 401', addinRotate.status === 401);

    const addinNotices = await call('/api/v1/security/notices', {
      headers: { ...H, 'X-Takt-Token': addinToken },
    });
    check('Add-in-Token sieht die Sicherheitsmeldungen nicht: 401', addinNotices.status === 401);
  }

  section('6. Herkunft (B-1.2, B-1.4)');
  {
    const table = [
      ['tauri://localhost', 200],
      ['http://tauri.localhost', 200],
      // E-043: gestrichen, weil die Schreibweise nur mit useHttpsScheme = true
      // entsteht und dieser Schalter auf false bleiben muss. Der Fall steht
      // weiter in der Tabelle — jetzt als abgewiesene Herkunft, damit eine
      // stille Rückkehr des Eintrags sofort auffällt.
      ['https://tauri.localhost', 403],
      ['https://evil.example', 403],
      ['https://tauri.localhost.evil.example', 403],
      ['null', 403],
      ['', 403],
      ['http://127.0.0.1:5173', 200],
    ];
    for (const [origin, expected] of table) {
      const response = await call('/api/v1/health', {
        headers: { ...sessionHeaders, origin },
      });
      check(`Origin ${origin === '' ? '(leer)' : origin} ergibt ${expected}`, response.status === expected, `war ${response.status}`);
    }

    const allowed = await call('/api/v1/health', {
      headers: { ...sessionHeaders, origin: 'tauri://localhost' },
    });
    check(
      'Zugelassene Herkunft bekommt genau diese zurück',
      allowed.headers.get('access-control-allow-origin') === 'tauri://localhost',
    );
    check(
      'Access-Control-Allow-Credentials bleibt aus',
      allowed.headers.get('access-control-allow-credentials') === null,
    );

    const preflight = await call('/api/v1/token', {
      method: 'OPTIONS',
      headers: { ...H, origin: 'tauri://localhost' },
    });
    check('Vorabanfrage aus zugelassener Herkunft: 204 ohne Token', preflight.status === 204);
    check(
      'Vorabanfrage nennt genau die verwendete Kopfzeile',
      preflight.headers.get('access-control-allow-headers') === 'X-Takt-Token, Content-Type',
    );

    const preflightEvil = await call('/api/v1/token', {
      method: 'OPTIONS',
      headers: { ...H, origin: 'https://evil.example' },
    });
    check('Vorabanfrage aus fremder Herkunft: 403', preflightEvil.status === 403);

    const crossSite = await call('/api/v1/health', {
      headers: { ...sessionHeaders, 'sec-fetch-site': 'cross-site' },
    });
    check('Sec-Fetch-Site: cross-site ohne Herkunft: 403', crossSite.status === 403);

    const navigate = await call('/api/v1/health', {
      headers: { ...sessionHeaders, 'sec-fetch-mode': 'navigate' },
    });
    check('Sec-Fetch-Mode: navigate: 403', navigate.status === 403);
  }

  section('7. Einfache Anfrage einer fremden Seite (B-1.2)');
  {
    const simple = await call('/api/v1/token', {
      method: 'POST',
      headers: { ...H, 'content-type': 'text/plain;charset=UTF-8' },
      body: '{}',
    });
    check('POST mit text/plain: 415 — vor jeder Wirkung', simple.status === 415);

    const form = await call('/api/v1/token', {
      method: 'POST',
      headers: { ...H, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'a=1',
    });
    check('POST mit Formularkodierung: 415', form.status === 415);

    /*
     * W-11: Without a token there would be no effect even without a content-type check, so
     * the two requests above measure the token check. The same two requests with the
     * session secret can only be stopped by the content-type check.
     */
    const simpleWithSecret = await call('/api/v1/token', {
      method: 'POST',
      headers: { ...sessionHeaders, 'content-type': 'text/plain;charset=UTF-8' },
      body: '{}',
    });
    check('POST mit text/plain und Sitzungsgeheimnis: 415', simpleWithSecret.status === 415, `war ${simpleWithSecret.status}`);
    const formWithSecret = await call('/api/v1/token', {
      method: 'POST',
      headers: { ...sessionHeaders, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'a=1',
    });
    check('POST mit Formularkodierung und Sitzungsgeheimnis: 415', formWithSecret.status === 415, `war ${formWithSecret.status}`);

    const stillTwo = await call('/api/v1/token', { headers: sessionHeaders });
    check(
      'Keine Wirkung eingetreten, auch mit Sitzungsgeheimnis: generation unverändert 2',
      stillTwo.text.includes('"generation":2'),
      stillTwo.text,
    );
  }

  section('8. Token in der Adresse (B-2.4 Punkt 1)');
  {
    const inQuery = await call(`/api/v1/health?token=${addinToken}`, { headers: H });
    check('Token als Abfrageparameter: 400', inQuery.status === 400);
    check('… mit dem Schlüssel token_in_url', inQuery.text.includes('token_in_url'));
    check('Die Antwort wiederholt den Wert nicht', !inQuery.text.includes(addinToken));

    const inPath = await call(`/api/v1/${addinToken}`, { headers: sessionHeaders });
    check('Token im Pfad: 400', inPath.status === 400);

    const notices = await call('/api/v1/security/notices', { headers: sessionHeaders });
    check('Der Vorfall steht in den Sicherheitsmeldungen', notices.text.includes('token_in_url'));
    check('Die Meldung enthält keinen Wert', !SECRET_SHAPE.test(notices.text));
  }

  section('9. Rumpfgrenze, unbekannte Route (B-1.7)');
  {
    const big = await call('/api/v1/token', {
      method: 'POST',
      headers: { ...sessionHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ x: 'y'.repeat(1024 * 1024 + 64) }),
    });
    check('Rumpf über 1 MB: 413', big.status === 413, `war ${big.status}`);

    const missing = await call('/api/v1/gibtsnicht', { headers: sessionHeaders });
    check('Unbekannte Route mit gültigem Nachweis: 404', missing.status === 404);

    const missingNoAuth = await call('/api/v1/gibtsnicht', { headers: H });
    check('Unbekannte Route ohne Nachweis: 401, nicht 404', missingNoAuth.status === 401);
  }

  section('10. Ratenbegrenzung auf Fehlversuche (B-2.6)');
  {
    for (let i = 0; i < 12; i += 1) {
      await call('/api/v1/health', {
        headers: { ...H, 'X-Takt-Token': `takt_${randomBytes(32).toString('base64url')}` },
      });
    }
    const notices = await call('/api/v1/security/notices', { headers: sessionHeaders });
    check('Nach 12 Fehlversuchen steht eine Warnung bereit', notices.text.includes('auth_failure_burst'));
    check('Die Warnung enthält keinen geratenen Wert', !SECRET_SHAPE.test(notices.text));
  }

  section('11. Rechte an Verzeichnis und Datei (B-2.2 Punkt 3, B-7.2)');
  {
    const dir = appDataDirIn(dataDir);
    const file = join(dir, 'addin-token.json');
    const dirStat = await stat(dir);
    const fileStat = await stat(file);

    /*
     * Daß beide überhaupt **hier** liegen, ist seit T-247 die erste Zusage
     * dieses Abschnitts (A-A-72). `dir` ist der umgelenkte Wegwerfort. Fände
     * `stat` sie dort nicht, hätte der Dienst woandershin geschrieben — und
     * unter Windows tat er das bis T-247: in das echte `%LOCALAPPDATA%\Takt`
     * des angemeldeten Kontos, weil die Umlenkung nur `XDG_DATA_HOME` setzte.
     */
    check(
      'Verzeichnis und Tokendatei liegen im umgelenkten Ablageort und nicht im echten (A-A-72)',
      dirStat.isDirectory() && fileStat.isFile(),
      dir,
    );

    /*
     * Der Modus wird nur dort gemessen, wo es einen gibt.
     *
     * Unter Windows liefert `fs.stat` keinen brauchbaren POSIX-Modus — hier
     * gemessen 0666 für Verzeichnis **und** Datei, also erkennbar keine
     * Auskunft über die tatsächliche Grenze. `access/paths.ts` nennt das seit
     * T-011 als benannte Lücke, dort trägt die ACL, und `proof:db-permissions`
     * überspringt aus demselben Grund unter Windows seinen ganzen Lauf.
     *
     * Das ist eine Lücke der **Messung**, keine Lockerung der **Regel**: Auf
     * Linux und macOS, wo `pnpm check` fährt, bleiben beide Zeilen scharf, und
     * die Zeile darüber — der Ort — wird überall gemessen. Sichtbar bleibt es
     * trotzdem: Der Lauf schreibt aus, was er nicht mißt, statt es wegzulassen.
     */
    if (process.platform === 'win32') {
      cannotMeasure('Verzeichnis 0700 und Datei 0600', 'der POSIX-Modus sagt unter Windows nichts, dort trägt die ACL (T-011)');
    } else {
      check(`Verzeichnis 0700 (ist ${(dirStat.mode & 0o777).toString(8)})`, (dirStat.mode & 0o777) === 0o700);
      check(`Datei 0600 (ist ${(fileStat.mode & 0o777).toString(8)})`, (fileStat.mode & 0o777) === 0o600);
    }

    const content = await readFile(file, 'utf8');
    check('In der Datei steht kein Token, nur der Abdruck', !SECRET_SHAPE.test(content));
    check('Der Abdruck ist ein SHA-256 in Hex', /"fingerprint": "[0-9a-f]{64}"/.test(content));
    const digest = createHash('sha256').update(addinToken, 'utf8').digest('hex');
    check('Der Abdruck gehört zum ausgegebenen Token', content.includes(digest));
  }

  section('12. Kein Geheimnis in der Ausgabe des Dienstes (B-2.4, B-12.2)');
  {
    /*
     * W-9: Collect the output before judging it. One last request on a recognisable path,
     * then wait until its log line has arrived; the channel is ordered, so every earlier
     * line is there too. Then require the two lines section 8 provoked: without them the
     * absence checks below would pass over a silent or delayed log.
     */
    const MARKE = 'w-9-marke';
    await call(`/api/v1/${MARKE}`, { headers: sessionHeaders });
    for (let versuch = 0; versuch < 60 && !service.output().includes(MARKE); versuch += 1) {
      await sleep(50);
    }
    const output = service.output();
    const requestLines = output
      .split('\n')
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((entry) => entry !== null && typeof entry.path === 'string' && typeof entry.status === 'number');
    check(
      'Die Ausgabe ist eingeholt: die Zeile der letzten Anfrage liegt vor',
      requestLines.some((entry) => entry.path === `/api/v1/${MARKE}`),
      `${requestLines.length} Anfragezeilen`,
    );
    check(
      'Die Zeile zum Token im Pfad liegt vor, mit 400 und geschwärzt (takt_<geschwaerzt>)',
      requestLines.some((entry) => entry.path === '/api/v1/takt_<geschwaerzt>' && entry.status === 400),
      JSON.stringify(requestLines.filter((entry) => entry.status === 400)),
    );
    check(
      'Die Zeile zum Token in der Abfrage liegt vor, als /api/v1/health mit 400 und token_in_url',
      requestLines.some(
        (entry) => entry.path === '/api/v1/health' && entry.status === 400 && entry.outcome === 'token_in_url',
      ),
      JSON.stringify(requestLines.filter((entry) => entry.status === 400)),
    );
    check('Die gesamte Protokollausgabe enthält kein takt_-Geheimnis', !SECRET_SHAPE.test(output));
    check('Sie enthält das Sitzungsgeheimnis nicht', !output.includes(service.secret));
    check('Sie enthält das Add-in-Token nicht', !output.includes(addinToken));
    check('Sie enthält keine Kopfzeile X-Takt-Token', !/x-takt-token/i.test(output));
    check(
      'Der protokollierte Pfad trägt keine Abfrageparameter',
      !output.includes('?token='),
    );

    const bodies = seenBodies.join('\n');
    const occurrences = bodies.match(new RegExp(SECRET_SHAPE.source, 'g')) ?? [];
    check(
      `In allen ${seenBodies.length} Antwortkörpern stehen genau 2 Tokens — die beiden Erzeugungen`,
      occurrences.length === 2,
      `gefunden: ${occurrences.length}`,
    );
  }

  section('13. Zeitkonstanter Vergleich (B-2.5)');
  {
    // Statisch: Im Nachweispfad wird kein Geheimnis mit === verglichen.
    //
    // A-A-59 — die Aufstellung ist entfallen
    //
    // Bis T-223 standen hier vier Dateinamen: `verifier.ts`, `crypto.ts`,
    // `guards.ts`, `token-service.ts`. `src/access/` führt dreizehn Dateien.
    // Was der „Nachweispfad" ist, entschied damit die Aufstellung, und nichts
    // maß, ob sie noch stimmt: Eine Zeile
    // `… (presented: string, secret: string) => presented === secret` in
    // `src/access/token-store.ts` — dieselbe Schublade, nicht auf der Liste —
    // ließ diesen Lauf bei 105/0 und Code 0, und die Zeile blieb grün
    // (T-223-5). Eine **fehlende** Datei fiel auf (`readFile` ohne Auffangnetz,
    // harter Abbruch); eine **hinzugekommene** nicht.
    //
    // A-A-59 stellte zwei Formen zur Wahl. Gebaut ist die erste — die
    // Aufstellung entfällt, durchsucht werden `src/access/**` und
    // `src/http/**` vollständig —, und zwar aus einem gemessenen Grund: Der
    // vollständige Durchlauf über alle 16 Dateien findet heute **null**
    // Treffer. Die zweite Form („die Liste bleibt, der Lauf weigert sich bei
    // einer ungesehenen Datei") hätte eine benannte Zahl ausgenommener Dateien
    // verlangt und damit genau die Pflege wieder eingeführt, deren Ausbleiben
    // der Befund ist. Ohne Ausnahmen ist die erste Form die billigere.
    //
    // Anders als bei den Kettengliedern (A-A-56) wird die **Zahl** der Dateien
    // hier nicht festgeschrieben: `src/access/` ist Alltagsbestand und wächst
    // mit dem Produkt (`attachment-store.ts`, `notices.ts`). Festgeschrieben
    // wird die **Untergrenze** — die Menge ist nicht leer, und die vier
    // Dateien, die B-2.5 tragen, sind darin. Sonst urteilte die Zusicherung
    // über eine Menge, die es nicht mehr gibt (A-A-55, A-A-60).
    //
    // A-A-68 — die Untergrenze sagte nichts, und die Zeile sagte
    // „vollständig"
    //
    // Bis T-235 lautete die Vorbedingung
    // `scanned.length >= TRAGENDE_DATEIEN.length`, also „mindestens vier" —
    // die Länge genau der Liste, die zwei Zeilen weiter ohnehin einzeln
    // geprüft wird. Sie schützte gegen die **leere** Ernte und gegen nichts
    // darüber hinaus, während die Zeile „**vollständig** durchsucht" behauptet.
    //
    // Gemessen (T-234, 31.1.1; in T-235 zeichengleich nachgestellt):
    // `src/access/unter/verifier-match.ts` mit `const gleich = presented ===
    // secret;`, und aus dem Sammler fällt **ein Wort** — `recursive: true`.
    // Der Lauf sagt dann **106/0, Code 0** und „vollständig durchsucht —
    // 16 Dateien", während sechzehn von siebzehn durchsucht sind und die
    // siebzehnte die einzige ist, auf die es ankommt.
    //
    // Zwei Zeilen schließen das, und sie messen **Verschiedenes**:
    //
    //  1. **Eine benannte Zahl**, nach dem Muster von A-A-61 (dort 100 und 25
    //     bei 117 und 31). Sie fängt den Zusammenbruch der Ernte — „0
    //     durchgesehen" darf nie `ok` sein (E-094 Punkt 3).
    //  2. **Eine zweite, unabhängige Aufnahme derselben Menge**, von Hand und
    //     ohne `recursive`. Sie fängt die **übersehene** Datei, und das kann
    //     eine Zahl allein nicht: Nach dem Streichen von `recursive: true`
    //     stehen heute weiterhin 16 Dateien in der Ernte, weil es heute keinen
    //     Unterordner gibt — jede Untergrenze bliebe grün. Erst der Vergleich
    //     zweier Wege macht das Wort „vollständig" verdient (E-094 Punkt 1).
    /*
     * Die Namen dieses Abschnitts stehen mit `/`, auf jedem Betriebssystem.
     *
     * `TRAGENDE_DATEIEN` weiter unten ist eine Aufstellung von Hand und steht
     * mit Schrägstrichen. `join` liefert unter Windows Rückstriche. Ohne diese
     * Angleichung verglich die Zeile „die vier Dateien sind darunter" zwei
     * Schreibweisen desselben Namens und wurde rot, obwohl jede der vier
     * durchsucht war — eine Meldung über die Schreibweise, die aussieht wie
     * eine über B-2.5.
     */
    const einheitlich = (name) => name.split(sep).join('/');

    const scanRoots = ['src/access', 'src/http'];
    /*
     * Fail-closed vor dem Sammeln (T-249-1).
     *
     * Die Untergrenze weiter unten (A-A-68) trägt die Menge, aber sie kann
     * einen Grund nicht nennen: Wäre einer der beiden Ordner umbenannt, bräche
     * `readdirSync` mit einer ENOENT-Stapelspur ab, mitten im Abschnitt und
     * ohne Bezug auf B-2.5. Der Abbruch hier sagt, welcher Ordner fehlt und
     * warum das kein Prüfsatz ist, der eben nichts gefunden hat.
     */
    for (const root of scanRoots) {
      let istVerzeichnis = false;
      try {
        istVerzeichnis = statSync(join(PAKET_WURZEL, root)).isDirectory();
      } catch {
        istVerzeichnis = false;
      }
      if (!istVerzeichnis) {
        scheitern(
          `Nachweispfad ${root} lesen (A-A-68)`,
          `${join(PAKET_WURZEL, root)} ist kein Verzeichnis.`,
          'Über einem nicht gelesenen Ordner ist „kein === auf Tokenmaterial" wahr,',
          'ohne daß jemand nachgesehen hätte.',
        );
      }
    }
    const scanned = [];
    for (const root of scanRoots) {
      for (const entry of readdirSync(join(PAKET_WURZEL, root), {
        recursive: true,
        withFileTypes: true,
      })) {
        if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
        const relative = join(root, entry.parentPath.slice(join(PAKET_WURZEL, root).length), entry.name);
        scanned.push(einheitlich(relative));
      }
    }

    /**
     * Die benannte Untergrenze (A-A-68).
     *
     * Heute liegen 16 Dateien unter den beiden Wurzeln. 14 lässt zwei
     * verschwinden, ohne rot zu werden — dasselbe Verhältnis, das A-A-61 mit
     * 100 bei 117 gewählt hat (rund 85 Prozent) —, und liegt mit dem Faktor
     * dreieinhalb deutlich über den vier tragenden Dateien. Fällt die Ernte
     * darunter, ist nicht der Bestand geschrumpft, sondern der Sammler kaputt.
     */
    const MINDESTENS_DURCHSUCHT = 14;
    check(
      `Der Sammler hat mindestens ${String(MINDESTENS_DURCHSUCHT)} Dateien eingesammelt (${String(scanned.length)}) (A-A-68)`,
      scanned.length >= MINDESTENS_DURCHSUCHT,
      `${String(scanned.length)} statt mindestens ${String(MINDESTENS_DURCHSUCHT)} — der Sammler greift ins Leere`,
    );

    /**
     * Dieselbe Menge ein zweites Mal, auf einem anderen Weg (A-A-68).
     *
     * Von Hand abgestiegen statt `recursive: true`, mit eigener Endungsprüfung.
     * Zwei Wege, ein Ergebnis — sonst ist die Ernte nicht die Menge, über die
     * geurteilt wird, und „vollständig" wäre ein Wort ohne Deckung.
     */
    const vonHand = (absolute, prefix) => {
      const out = [];
      for (const entry of readdirSync(absolute, { withFileTypes: true })) {
        if (entry.isDirectory()) out.push(...vonHand(join(absolute, entry.name), join(prefix, entry.name)));
        else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(einheitlich(join(prefix, entry.name)));
      }
      return out;
    };
    const vorhanden = scanRoots.flatMap((root) => vonHand(join(PAKET_WURZEL, root), root));
    const uebersehen = vorhanden.filter((name) => !scanned.includes(name));
    check(
      `Der Nachweispfad ist vollständig durchsucht — ${String(scanned.length)} von ${String(vorhanden.length)} Dateien unter ${scanRoots.join(' und ')}, zweiter Weg (A-A-68)`,
      uebersehen.length === 0 && scanned.length === vorhanden.length,
      uebersehen.length === 0
        ? `${String(scanned.length)} eingesammelt, ${String(vorhanden.length)} vorhanden`
        : `übersehen: ${uebersehen.join(', ')}`,
    );

    // Die vier Dateien, die B-2.5 tragen, vor jedem Urteil über die Menge.
    const TRAGENDE_DATEIEN = [
      'src/access/verifier.ts',
      'src/access/crypto.ts',
      'src/http/guards.ts',
      'src/access/token-service.ts',
    ];
    const fehlend = TRAGENDE_DATEIEN.filter((name) => !scanned.includes(name));
    check(
      'Und die vier Dateien, an denen B-2.5 hängt, sind darunter (A-A-59)',
      fehlend.length === 0,
      `nicht angesehen, obwohl B-2.5 daran hängt: ${fehlend.join(', ')}`,
    );

    /*
     * Gesucht wird der Vergleich von **Geheimnismaterial**, auf beiden Seiten des Operators.
     * Zwei gespeicherte Abdrücke mit !== zu vergleichen (Buchführung im token-service) ist
     * ausdrücklich in Ordnung: Ein Abdruck ist kein Geheimnis, und der Aufrufer liefert ihn
     * nicht. Ein Vergleich mit null, undefined oder einem Zahlen- oder Textliteral ist keiner
     * auf Material (W-13).
     */
    const MATERIAL = String.raw`(?:presented|candidate|material|secret|token|credential)\w*`;
    const NOT_MATERIAL = String.raw`(?:null|undefined|\d|'|"|\x60)`;
    const materialComparison = new RegExp(
      String.raw`${MATERIAL}\s*[!=]==(?!\s*${NOT_MATERIAL})|[!=]==\s*${MATERIAL}`,
      'i',
    );
    const isComment = (line) => line.trimStart().startsWith('*') || line.trimStart().startsWith('//');

    // Selbstprobe (W-13): the pattern must hit the known shapes and spare the harmless ones,
    // otherwise "no === on token material" would judge with a blind pattern.
    const mustHit = [
      'const gleich = presented === secret;',
      'if (token === header) return true;',
      'return header !== credential;',
      'if (candidateToken === stored) {',
    ];
    const mustSpare = ['if (token === null) return;', "if (secret.length === 0) {", 'if (fingerprint !== stored) {'];
    check(
      'Selbstprobe: das Muster trifft die vier bekannten Formen und keine der harmlosen (W-13)',
      mustHit.every((line) => materialComparison.test(line)) && mustSpare.every((line) => !materialComparison.test(line)),
      `verfehlt: ${mustHit.filter((line) => !materialComparison.test(line)).join(' | ')}; ` +
        `falsch getroffen: ${mustSpare.filter((line) => materialComparison.test(line)).join(' | ')}`,
    );

    let offending = [];
    for (const relative of scanned) {
      const text = await readFile(join(PAKET_WURZEL, relative), 'utf8');
      text.split('\n').forEach((line, index) => {
        if (materialComparison.test(line) && !isComment(line)) {
          offending.push(`${relative}:${index + 1}: ${line.trim()}`);
        }
      });
    }
    check(
      'Kein === auf Tokenmaterial im Nachweispfad (Namen presented, candidate, material, secret, token, credential)',
      offending.length === 0,
      offending.join(' | '),
    );

    // Gemessen: Ein Kandidat, der 47 von 48 Zeichen teilt, braucht nicht
    // messbar länger als einer, der schon im ersten Zeichen abweicht.
    /*
     * `import()` nimmt eine Adresse, keinen Pfad. Unter Windows beginnt ein
     * absoluter Pfad mit `C:`, und der Lader hält das für ein Schema — er
     * bricht mit „Received protocol 'c:'" ab, mitten im Abschnitt. `pathToFileURL`
     * macht daraus die `file:`-Adresse, die er erwartet.
     */
    const alsAdresse = (pfad) => pathToFileURL(pfad).href;
    /*
     * Aufgelöst statt abgezählt (T-249-1): Beide Module werden über ein
     * Merkmal gefunden. Ein `import()` auf einen festen Pfad wäre laut
     * gescheitert und nicht still — der Grund für die Änderung ist ein anderer:
     * Diese beiden Dateien stehen dreißig Zeilen weiter oben schon einmal in
     * `TRAGENDE_DATEIEN`. Zwei Abschriften desselben Ortes in einem Abschnitt
     * sind eine zu viel.
     */
    const { verifyCredential } = await import(
      alsAdresse(
        paketQuelle('@takt/local-api', {
          hinweis: 'src/access/verifier.ts',
          merkmal: 'export function verifyCredential',
        }),
      )
    );
    const { nodeSecretDigest } = await import(
      alsAdresse(
        paketQuelle('@takt/local-api', {
          hinweis: 'src/access/crypto.ts',
          merkmal: 'export const nodeSecretDigest',
        }),
      )
    );
    const real = `takt_${randomBytes(32).toString('base64url')}`;
    const active = { addin: nodeSecretDigest.digest(real), session: null };
    const nearMiss = `${real.slice(0, -1)}${real.endsWith('A') ? 'B' : 'A'}`;
    const farMiss = `takt_${real[5] === 'A' ? 'B' : 'A'}${real.slice(6)}`;

    const candidates = [nearMiss, farMiss, ''];
    check(
      'Alle drei Timing-Kandidaten sind tatsächlich ungültig',
      candidates.every((candidate) => !verifyCredential(candidate, active, nodeSecretDigest).ok),
    );

    // Alle Fälle gemeinsam aufwärmen, auch den leeren Wert. Die bisherigen
    // getrennten Messblöcke verglichen verschiedene JIT-/Lastphasen; damit
    // wurde auf CI wiederholt nur der zuerst gemessene Fall langsamer.
    for (let round = 0; round < 10_000; round += 1) {
      for (const candidate of candidates) verifyCredential(candidate, active, nodeSecretDigest);
    }

    // Pro Runde jeden Fall einmal messen, die Reihenfolge rotieren lassen.
    // Gleiche Stichprobengröße und derselbe Aufrufort für alle Kandidaten;
    // kein Wiederholen bis grün und keine gelockerte 25-Prozent-Grenze.
    const sampleCount = 6000;
    const samples = candidates.map(() => []);
    for (let round = 0; round < sampleCount; round += 1) {
      for (let offset = 0; offset < candidates.length; offset += 1) {
        const index = (round + offset) % candidates.length;
        const t0 = process.hrtime.bigint();
        verifyCredential(candidates[index], active, nodeSecretDigest);
        samples[index].push(Number(process.hrtime.bigint() - t0));
      }
    }
    check(
      'Die Timing-Messung erfasst jeden Fall gleich oft und vollständig',
      samples.length === 3 && samples.every((values) => values.length === sampleCount && values.every((value) => value > 0)),
    );
    const [near, far, empty] = samples.map((values) => {
      values.sort((a, b) => a - b);
      return values[Math.floor(values.length / 2)];
    });
    const spread = Math.max(near, far, empty) / Math.min(near, far, empty);
    console.log(
      `        Median in ns — fast richtig: ${near}, früh falsch: ${far}, leer: ${empty}; Streuung ${spread.toFixed(2)}`,
    );
    // W-12: a figure, not a check. The comparison below shows that this measurement cannot
    // tell `===` from `timingSafeEqual`; the evidence is the construction and the static scan.
    console.log(`        Kennzahl, nicht gezählt: Streuung ${spread.toFixed(2)} (Richtwert unter 1,25)`);

    // Vergleichswert mit ===, ausdrücklich **kein** Gegenbeweis: Auch dort ist
    // bei 48 Zeichen kein Unterschied messbar. Eine Messung ohne Ausschlag
    // beweist wenig — der Nachweis liegt in der Bauweise (hashen, dann
    // `timingSafeEqual`, kein früher Ausstieg) und in der statischen Prüfung
    // oben. Die Zahl steht hier, damit niemand die Messung für den Beweis hält.
    const naive = (candidate) => {
      const samples = [];
      for (let round = 0; round < 4000; round += 1) {
        const t0 = process.hrtime.bigint();
        // eslint-disable-next-line eqeqeq
        void (candidate === real);
        samples.push(Number(process.hrtime.bigint() - t0));
      }
      samples.sort((a, b) => a - b);
      return samples[Math.floor(samples.length / 2)];
    };
    console.log(
      `        Vergleichswert mit === (kein Gegenbeweis) — fast richtig: ${naive(nearMiss)}, früh falsch: ${naive(farMiss)}`,
    );

    // Und der Vergleich selbst, direkt.
    const a = createHash('sha256').update('a').digest();
    const b = createHash('sha256').update('b').digest();
    check('timingSafeEqual erkennt Gleichheit', timingSafeEqual(a, Buffer.from(a)));
    check('timingSafeEqual erkennt Ungleichheit', !timingSafeEqual(a, b));
  }

  section('14. Zweiter Dienst auf demselben Port (B-1.5 Punkt 1)');
  {
    const second = await startService(dataDir);
    const code = await Promise.race([second.exit, sleep(8000).then(() => 'timeout')]);
    check('Der zweite Start endet mit Code 74 statt auszuweichen', code === 74, `Code ${code}`);
    check(
      'Die Meldung nennt den Port, nicht das Token',
      second.output().includes(`Port ${PORT} ist belegt`) &&
        second.secret !== null &&
        !second.output().includes(second.secret) &&
        !SECRET_SHAPE.test(second.output()),
      second.output().slice(-300),
    );
  }

  section('15. Ende der Elternverbindung (B-1.6 Punkt 3)');
  {
    service.child.stdin.end();
    const code = await Promise.race([service.exit, sleep(8000).then(() => 'timeout')]);
    check('Der Dienst beendet sich, wenn die Hülle weg ist', code === 0, `Code ${code}`);
    service = null;
  }
} catch (error) {
  hardFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (service !== null) {
    service.child.kill('SIGTERM');
    // Nicht nur anstoßen, sondern abwarten (T-029, Risiko 5): Der nächste
    // Prüflauf auf demselben Port muss ihn sicher frei vorfinden, statt sich
    // auf ein Zeitfenster zu verlassen, das auf einer langsameren Maschine
    // nicht reicht. `SIGKILL` ist der Rückfall, falls `SIGTERM` binnen 3 s
    // nichts bewirkt hat.
    const exitCode = await Promise.race([service.exit, sleep(3000).then(() => null)]);
    if (exitCode === null && service.child.exitCode === null) {
      service.child.kill('SIGKILL');
      await Promise.race([service.exit, sleep(2000)]);
    }
  }
  await rm(dataDir, { recursive: true, force: true });
}

if (hardFailure !== null) {
  console.error(hardFailure);
  process.exit(1);
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
if (unmeasured.length > 0) {
  console.log(`${unmeasured.length} ungemessen: ${process.platform} — ${unmeasured.join(', ')}`);
}
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
