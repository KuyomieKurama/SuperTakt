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
 * über `stdin`, lenkt das Anwendungsdatenverzeichnis über `XDG_DATA_HOME` in
 * einen Wegwerfordner und fährt danach eine Tabelle von Anfragen dagegen.
 *
 * Ausgabe: eine Zeile je Prüfung, am Ende eine Zusammenfassung. Exitcode 1,
 * sobald eine Prüfung fehlschlägt.
 */

import { spawn } from 'node:child_process';
import { mkdtemp, rm, stat, readFile } from 'node:fs/promises';
import { tmpdir, networkInterfaces } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConnection } from 'node:net';
import { request as httpRequest } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(HERE, '..', 'src', 'index.ts');
const PORT = 17843;
const BASE = `http://127.0.0.1:${PORT}/api/v1`;
const SECRET_SHAPE = /takt_[A-Za-z0-9_-]{43}/;

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

// ---------------------------------------------------------------------------
// Dienst starten
// ---------------------------------------------------------------------------

async function startService(dataDir, { withSecret = true, withUser = true } = {}) {
  const child = spawn(process.execPath, [ENTRY], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, XDG_DATA_HOME: dataDir },
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
  const secret = withSecret ? `takt_${randomBytes(32).toString('base64url')}` : null;
  if (secret !== null) {
    child.stdin.write(withUser ? `${secret}\nkerem\n` : `${secret}\n`);
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

/** Ein Verbindungsversuch, der scheitert, heißt "frei"; einer, der ankommt, heißt "belegt". */
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
    }, 500).unref();
  });
}

/**
 * Wartet, statt sofort aufzugeben, bis Port {@link PORT} frei ist (T-029,
 * Risiko 5).
 *
 * Unmittelbar nacheinander gefahren teilen sich `proof:access` und
 * `proof:addin-wiring` denselben Port. Der vorige Lauf braucht nach seinem
 * `SIGTERM` einen Moment, bis sein Kindprozess ihn tatsächlich freigibt.
 * Ohne diese Wartestufe hielte `waitForService()` weiter unten den ALTEN,
 * noch antwortenden Dienst für den eigenen — er antwortet ja auf `/health` —
 * und führte mit einem Sitzungsgeheimnis weiter, das zu einem fremden Prozess
 * gehört: reihenweise Fehlschläge, die keine Regression sind, sondern ein
 * falsch verstandener Zustand.
 */
async function waitForPortFree(port, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  do {
    if (await portFree(port)) return true;
    await sleep(150);
  } while (Date.now() < until);
  return false;
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

// ---------------------------------------------------------------------------
// Lauf
// ---------------------------------------------------------------------------

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-'));
let service = null;
let hardFailure = null;

try {
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
    check(
      'Die Meldung nennt kein Geheimnis',
      !SECRET_SHAPE.test(bare.output()),
      bare.output().slice(0, 200),
    );
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

  section('1. Bindeadresse (B-1.1 Punkt 3 und 4)');
  {
    check(
      'Der Dienst meldet 127.0.0.1 als Bindeadresse',
      service.output().includes(`Takt lauscht auf 127.0.0.1:${PORT}`),
    );
    const external = Object.values(networkInterfaces())
      .flat()
      .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal)
      .map((entry) => entry.address);
    if (external.length === 0) {
      console.log('  ----  keine externe IPv4 vorhanden, Prüfung übersprungen');
    } else {
      const reachable = await new Promise((resolve) => {
        const socket = createConnection({ host: external[0], port: PORT, timeout: 1500 });
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });
      check(`Über ${external[0]}:${PORT} ist der Dienst nicht erreichbar`, reachable === false);
    }
  }

  section('2. Zielrechner — DNS-Rebinding (B-1.3)');
  {
    const evil = await call('/api/v1/health', { headers: { host: 'evil.example:17843' } });
    check('Host: evil.example ergibt 403', evil.status === 403);
    check('… mit dem Schlüssel host_not_allowed', evil.text.includes('host_not_allowed'));

    const evilWithToken = await call('/api/v1/health', {
      headers: { host: 'evil.example:17843', 'X-Takt-Token': service.secret },
    });
    check(
      'Auch mit gültigem Nachweis: 403 — die Host-Prüfung steht vor dem Token',
      evilWithToken.status === 403,
    );

    const raw = await rawRequest(['GET /api/v1/health HTTP/1.0']);
    check('Anfrage ohne Host-Kopf wird abgewiesen', /40[0-9]/.test(raw.split('\r\n')[0] ?? ''), raw.split('\r\n')[0]);

    const suffix = await call('/api/v1/health', { headers: { host: `127.0.0.1.evil.example:${PORT}` } });
    check(
      'Host: 127.0.0.1.evil.example:17843 ergibt 403 — keine Präfixprüfung',
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

    const stillTwo = await call('/api/v1/token', { headers: sessionHeaders });
    check('Keine Wirkung eingetreten: generation unverändert 2', stillTwo.text.includes('"generation":2'));
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
    const dir = join(dataDir, 'takt');
    const file = join(dir, 'addin-token.json');
    const dirStat = await stat(dir);
    const fileStat = await stat(file);
    check(`Verzeichnis 0700 (ist ${(dirStat.mode & 0o777).toString(8)})`, (dirStat.mode & 0o777) === 0o700);
    check(`Datei 0600 (ist ${(fileStat.mode & 0o777).toString(8)})`, (fileStat.mode & 0o777) === 0o600);

    const content = await readFile(file, 'utf8');
    check('In der Datei steht kein Token, nur der Abdruck', !SECRET_SHAPE.test(content));
    check('Der Abdruck ist ein SHA-256 in Hex', /"fingerprint": "[0-9a-f]{64}"/.test(content));
    const digest = createHash('sha256').update(addinToken, 'utf8').digest('hex');
    check('Der Abdruck gehört zum ausgegebenen Token', content.includes(digest));
  }

  section('12. Kein Geheimnis in der Ausgabe des Dienstes (B-2.4, B-12.2)');
  {
    const output = service.output();
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
    const sources = [
      'src/access/verifier.ts',
      'src/access/crypto.ts',
      'src/http/guards.ts',
      'src/access/token-service.ts',
    ];
    let offending = [];
    for (const relative of sources) {
      const text = await readFile(join(HERE, '..', relative), 'utf8');
      for (const line of text.split('\n')) {
        // Gesucht wird der Vergleich von **Geheimnismaterial**. Zwei
        // gespeicherte Abdrücke mit !== zu vergleichen (Buchführung im
        // token-service) ist ausdrücklich in Ordnung: Ein Abdruck ist kein
        // Geheimnis, und der Aufrufer liefert ihn nicht.
        if (/(presented|candidate|material|secret)\s*[!=]==/i.test(line) && !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//')) {
          offending.push(`${relative}: ${line.trim()}`);
        }
      }
    }
    check('Kein === auf Tokenmaterial im Nachweispfad', offending.length === 0, offending.join(' | '));

    // Gemessen: Ein Kandidat, der 47 von 48 Zeichen teilt, braucht nicht
    // messbar länger als einer, der schon im ersten Zeichen abweicht.
    const { verifyCredential } = await import(join(HERE, '..', 'src', 'access', 'verifier.ts'));
    const { nodeSecretDigest } = await import(join(HERE, '..', 'src', 'access', 'crypto.ts'));
    const real = `takt_${randomBytes(32).toString('base64url')}`;
    const active = { addin: nodeSecretDigest.digest(real), session: null };
    const nearMiss = `${real.slice(0, -1)}${real.endsWith('A') ? 'B' : 'A'}`;
    const farMiss = `takt_Z${real.slice(6)}`;

    const measure = (candidate) => {
      const samples = [];
      for (let round = 0; round < 4000; round += 1) {
        const t0 = process.hrtime.bigint();
        verifyCredential(candidate, active, nodeSecretDigest);
        samples.push(Number(process.hrtime.bigint() - t0));
      }
      samples.sort((a, b) => a - b);
      return samples[Math.floor(samples.length / 2)];
    };

    // Aufwärmen, damit der Übersetzer der Laufzeit nicht die erste Messung verzerrt.
    measure(nearMiss);
    measure(farMiss);
    const near = measure(nearMiss);
    const far = measure(farMiss);
    const empty = measure('');
    const spread = Math.max(near, far, empty) / Math.min(near, far, empty);
    console.log(
      `        Median in ns — fast richtig: ${near}, früh falsch: ${far}, leer: ${empty}; Streuung ${spread.toFixed(2)}`,
    );
    check('Die drei Fälle liegen innerhalb von 25 Prozent beieinander', spread < 1.25, `Streuung ${spread.toFixed(2)}`);

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
    check('Die Meldung nennt den Port, nicht das Token', second.output().includes(`Port ${PORT} ist belegt`));
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
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
