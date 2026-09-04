/**
 * Takt — Nachweis, dass die Add-in-Fläche am echten Dienst hängt
 * (T-019 offene Fragen 1 und 2, E-009, A-9.5, A-10.4, A-10.9, R-15).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:addin-wiring
 *
 * ===========================================================================
 * Was hier anders ist als in `apps/outlook-addin/scripts/proof-addin.mjs`
 * ===========================================================================
 *
 * Der Nachweispfad aus T-019 fährt den Router gegen eine **Attrappe** der
 * Speicherung und **ohne** die Prüfschicht aus `http/guards.ts` — er konnte
 * nicht anders, es gab weder Adapter noch Verdrahtung. Genau das ist Risiko 6
 * aus jenem Bericht: „Herkunftsprüfung, Vorabanfrage und der echte
 * Tokenvergleich sind im Zusammenspiel mit dem Add-in ungeprüft."
 *
 * Dieser Lauf schließt die Lücke. Er startet den **echten** Sidecar als
 * Kindprozess mit Startgeheimnis und Benutzername über `stdin`, gegen eine
 * echte migrierte Datenbank in einem Wegwerfordner, und fährt die vier
 * Add-in-Routen über HTTP — durch die vollständige Kette aus Host-,
 * Herkunfts-, Inhaltstyp- und Tokenprüfung.
 *
 * Damit ist der Dienstanteil von TP-ADDIN-08 ausführbar. Was hier **nicht**
 * geprüft wird, ist der Oberflächenanteil (Token in S-13 eintragen, DOM
 * inspizieren) — der gehört dem e2e-tester und braucht Playwright.
 */

import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request } from 'node:http';
import { createConnection } from 'node:net';
import { randomBytes } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(HERE, '..', 'src', 'index.ts');
const PORT = 17843;
const BASE = `http://127.0.0.1:${PORT}/api/v1`;

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
 * Risiko 5 — dasselbe Muster wie in `proof-access.mjs`, das sich denselben
 * Port teilt). Ohne diese Wartestufe hielte `waitForService()` weiter unten
 * einen noch nicht ganz beendeten vorigen Lauf für den eigenen Dienst.
 */
async function waitForPortFree(port, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  do {
    if (await portFree(port)) return true;
    await sleep(150);
  } while (Date.now() < until);
  return false;
}

/** Die Herkunft des Aufgabenbereichs (E-046, T-019 Annahme 1). */
const ADDIN_ORIGIN = 'https://localhost:17844';

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

function call(path, { method = 'GET', token, origin = ADDIN_ORIGIN, body, secret } = {}) {
  return new Promise((resolve) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body), 'utf8');
    const headers = { Host: `127.0.0.1:${PORT}` };
    if (origin !== null) headers.Origin = origin;
    if (token !== undefined) headers['X-Takt-Token'] = token;
    if (secret !== undefined) headers['X-Takt-Token'] = secret;
    if (payload !== null) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(payload.byteLength);
    }

    const req = request({ host: '127.0.0.1', port: PORT, path: `/api/v1${path}`, method, headers }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { text += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(text); } catch { /* kein JSON */ }
        resolve({ status: res.statusCode, body: json, text });
      });
    });
    req.on('error', (error) => resolve({ status: 0, body: null, text: String(error.message) }));
    if (payload !== null) req.write(payload);
    req.end();
  });
}

// T-029, Risiko 5: proof-addin-wiring teilt sich Port 17843 mit proof-access.
// Unmittelbar nacheinander gefahren bräuchte der vorige Kindprozess sonst
// noch einen Moment, den Port nach seinem SIGTERM tatsächlich freizugeben —
// dieses Skript würde in der Zwischenzeit gegen den ALTEN Dienst laufen und
// mit dessen fremdem Sitzungsgeheimnis reihenweise (falsch) scheitern. Vor
// jedem Ressourcenaufbau geprüft, damit im Fehlerfall nichts aufzuräumen ist.
if (!(await waitForPortFree(PORT))) {
  console.error(
    `FEHLER: Auf 127.0.0.1:${PORT} lauscht bereits etwas, auch nach 5 s Warten. ` +
      'Läuft Takt oder ein anderer Prüfpfad (proof:access, proof:addin-wiring) noch?',
  );
  process.exit(1);
}

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-addin-'));
const sessionSecret = `takt_${randomBytes(32).toString('base64url')}`;

const child = spawn(process.execPath, [ENTRY], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, XDG_DATA_HOME: dataDir },
});
const childExit = new Promise((resolve) => child.once('exit', (code) => resolve(code)));
let stderr = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => { stderr += chunk; });
child.stdout.setEncoding('utf8');
let stdout = '';
child.stdout.on('data', (chunk) => { stdout += chunk; });

// Zwei Zeilen über denselben Kanal: Startgeheimnis, dann Benutzername (E-042).
child.stdin.write(`${sessionSecret}\nt.beispiel\n`);

async function waitForService() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const health = await call('/health', { token: sessionSecret });
    if (health.status !== 0) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

try {
  const up = await waitForService();
  check('der Dienst kommt hoch', up, stderr.slice(-300));
  if (!up) throw new Error('Dienst nicht erreichbar');

  // ---------------------------------------------------------------------------
  section('1  Die Herkunft des Aufgabenbereichs ist zugelassen (T-019 offene Frage 1)');
  // ---------------------------------------------------------------------------
  {
    const health = await call('/health', { token: sessionSecret, origin: ADDIN_ORIGIN });
    check(
      `Herkunft ${ADDIN_ORIGIN} wird angenommen`,
      health.status === 200,
      `Status ${health.status}: ${health.text.slice(0, 120)}`,
    );

    const foreign = await call('/health', { token: sessionSecret, origin: 'https://boese.example' });
    check(
      'eine fremde Herkunft wird weiterhin mit 403 abgewiesen',
      foreign.status === 403 && foreign.body?.error?.code === 'origin_not_allowed',
      `Status ${foreign.status}`,
    );

    const lookalike = await call('/health', { token: sessionSecret, origin: 'https://localhost:17844.evil.example' });
    check(
      'eine ähnlich aussehende Herkunft besteht die Prüfung nicht',
      lookalike.status === 403,
      `Status ${lookalike.status}`,
    );
  }

  // ---------------------------------------------------------------------------
  section('2  Ein Add-in-Token entsteht und wirkt (E-009, TP-ADDIN-08, Dienstanteil)');
  // ---------------------------------------------------------------------------
  let addinToken = null;
  {
    const before = await call('/addin/context', { token: 'takt_' + 'x'.repeat(43) });
    check(
      'ohne gültiges Token antwortet die Add-in-Fläche mit 401',
      before.status === 401 && before.body?.error?.code === 'unauthorized',
      `Status ${before.status}`,
    );

    const created = await call('/token', { method: 'POST', token: sessionSecret, body: {} });
    check('die Hülle kann ein Token erzeugen', created.status === 201, `Status ${created.status}`);
    addinToken = created.body?.data?.token ?? null;
    check('das Token kommt genau einmal im Klartext zurück', typeof addinToken === 'string');

    const context = await call('/addin/context', { token: addinToken });
    check(
      'mit dem neuen Token liefert /addin/context den Tag-Baum (A-10.4)',
      context.status === 200 && context.body?.data !== undefined,
      `Status ${context.status}: ${context.text.slice(0, 160)}`,
    );
    check(
      'die Antwort trägt Spalten und Standard-Tags',
      Array.isArray(context.body?.data?.statuses) && context.body.data.statuses.length === 4,
      JSON.stringify(Object.keys(context.body?.data ?? {})),
    );

    // TP-ADDIN-08: Nach der Rotation ist das alte Token ungültig.
    const rotated = await call('/token', { method: 'POST', token: sessionSecret, body: {} });
    const newToken = rotated.body?.data?.token ?? null;
    check('ein zweites Token lässt sich erzeugen', typeof newToken === 'string');

    const withOld = await call('/addin/context', { token: addinToken });
    check(
      'das alte Token ist danach sofort ungültig (B-2.7)',
      withOld.status === 401,
      `Status ${withOld.status}`,
    );

    const withNew = await call('/addin/context', { token: newToken });
    check('das neue Token wirkt', withNew.status === 200, `Status ${withNew.status}`);
    addinToken = newToken;
  }

  // ---------------------------------------------------------------------------
  section('3  Die vier Add-in-Routen gegen den echten Datenpfad');
  // ---------------------------------------------------------------------------
  let todoId = null;
  {
    // Ein Standard-Tag einrichten, damit A-9.5 prüfbar wird.
    const tag = await call('/tags', {
      method: 'POST',
      secret: sessionSecret,
      body: { name: 'Support' },
    });
    check('ein Tag lässt sich über die Fachroute anlegen', tag.status === 201, `Status ${tag.status}: ${tag.text.slice(0,120)}`);
    const tagId = tag.body?.data?.id ?? null;

    const defaults = await call('/settings/default-tags', {
      method: 'PUT',
      secret: sessionSecret,
      body: { tagIds: [tagId] },
    });
    check('es lässt sich als Standard-Tag setzen (A-9.1)', defaults.status === 200, `Status ${defaults.status}`);

    // Suche vor dem Anlegen: nichts da, aber gesucht wurde.
    const empty = await call('/addin/todo-matches?callNumber=TCK-000042', { token: addinToken });
    check('die Duplikatsuche antwortet', empty.status === 200, `Status ${empty.status}`);
    check('sie hat gesucht und nichts gefunden', empty.body?.data?.searched === true && empty.body.data.matches.length === 0);

    const notSearched = await call('/addin/todo-matches?callNumber=%20%20', { token: addinToken });
    check(
      'eine leere Call-Nummer führt zu KEINER Suche, nicht zu "nichts gefunden" (R-15, E-045)',
      notSearched.status === 200 && notSearched.body?.data?.searched === false,
      JSON.stringify(notSearched.body?.data ?? {}),
    );

    const created = await call('/addin/todos', {
      method: 'POST',
      token: addinToken,
      body: { title: 'Aus Outlook', callNumber: 'TCK-000042', tagIds: [], note: 'Aus der E-Mail' },
    });
    check('ein Todo lässt sich aus dem Add-in anlegen', created.status === 201, `Status ${created.status}: ${created.text.slice(0,200)}`);
    todoId = created.body?.data?.todo?.id ?? null;
    check(
      'das Standard-Tag ist automatisch dran (A-9.5, über beide Wege dieselbe Regel)',
      Array.isArray(created.body?.data?.todo?.tagIds) && created.body.data.todo.tagIds.includes(tagId),
      JSON.stringify(created.body?.data?.todo?.tagIds ?? []),
    );

    const found = await call('/addin/todo-matches?callNumber=TCK-000042', { token: addinToken });
    check(
      'jetzt findet die Duplikatsuche das Todo (A-10.9)',
      found.body?.data?.searched === true && found.body.data.matches.length === 1,
      JSON.stringify(found.body?.data ?? {}),
    );

    // Der Rumpf trug bis T-039 ein `reopenIfDone: false`. Das Feld gibt es seit
    // T-038 nicht mehr (Befund C-03): Buchen hebt „Erledigt" ohne Schalter auf.
    // Es hier weiterhin mitzuschicken wäre der schlechtere von zwei Zuständen —
    // die Prüfung liefe grün und **misst nichts**, während sie sich wie eine
    // Zusage über einen Rumpf läse, den der Dienst nicht kennt. An seiner Stelle
    // steht jetzt eine Prüfung auf die Antwort, denn dort steht die Wirkung.
    const booked = await call(`/addin/todos/${todoId}/time-entries`, {
      method: 'POST',
      token: addinToken,
      body: {
        startedAt: '2026-01-20T08:00:00Z',
        endedAt: '2026-01-20T08:16:00Z',
        note: 'Aus Outlook gebucht',
      },
    });
    check('eine Zeit lässt sich aus dem Add-in buchen (A-6.1)', booked.status === 201, `Status ${booked.status}: ${booked.text.slice(0,200)}`);
    check(
      'die Antwort sagt, was mit „Erledigt" geschah (A-2.5, doneCleared) — hier: nichts, das Todo war offen',
      booked.body?.data?.doneCleared === false && booked.body?.data?.todoWasDone === false,
      JSON.stringify(booked.body?.data ?? {}).slice(0, 200),
    );
    // Seit T-104 steht die Bewegung als **ein** Feld in der Antwort und nicht
    // mehr als drei Listen (E-061 Punkt 3). Hier ist es die erste Buchung auf
    // einem offenen Todo — die erste abgeschlossene Buchung entsteht, also wird
    // gerechnet und `null` wäre falsch. Drei leere Listen wären dagegen eine
    // gültige Aussage: Auf dieses Todo passt keine Regel.
    const movement = booked.body?.data?.poolMovement;
    check(
      'und sie nennt die Bewegung durch die Regeln beim Namen (I-05, poolMovement) — leere Listen sind eine Aussage, nicht ein Fehlen',
      movement !== null &&
        typeof movement === 'object' &&
        Array.isArray(movement.appears) &&
        Array.isArray(movement.enters) &&
        Array.isArray(movement.leaves),
      JSON.stringify(movement ?? null),
    );
  }

  // ---------------------------------------------------------------------------
  section('4  Die Fläche des Add-in-Tokens bleibt schmal (RR-1, B-2.9 Punkt 3)');
  // ---------------------------------------------------------------------------
  {
    const token = await call('/token', { token: addinToken });
    check(
      'mit dem Add-in-Token ist der Tokenzustand nicht lesbar',
      token.status === 401,
      `Status ${token.status}`,
    );

    const rotate = await call('/token', { method: 'POST', token: addinToken, body: {} });
    check(
      'ein entwendetes Add-in-Token kann sich nicht selbst austauschen',
      rotate.status === 401,
      `Status ${rotate.status}`,
    );

    // Die allgemeinen Fachrouten stehen dem Add-in-Token offen (sie sind
    // dieselbe Vertrauensstufe wie die Add-in-Routen — beide hinter demselben
    // Token). Was NICHT offensteht, ist alles mit `requireCredential('session')`.
    const notices = await call('/security/notices', { token: addinToken });
    check('Sicherheitsmeldungen bleiben der Hülle vorbehalten', notices.status === 401, `Status ${notices.status}`);
  }

  // ---------------------------------------------------------------------------
  section('5  Der Vermerk verlässt die Add-in-Fläche nicht (A-7.2, R-06)');
  // ---------------------------------------------------------------------------
  {
    const note = await call(`/todos/${todoId}/note`, { secret: sessionSecret });
    check('über die Hauptfläche ist der Vermerk lesbar', note.status === 200, `Status ${note.status}`);
    check(
      'und er trägt den Text aus dem Add-in',
      note.body?.data?.text === 'Aus der E-Mail',
      JSON.stringify(note.body?.data ?? {}),
    );

    const context = await call('/addin/context', { token: addinToken });
    check(
      'in der Add-in-Antwort steht der Vermerk nirgends',
      !context.text.includes('Aus der E-Mail'),
    );

    const matches = await call('/addin/todo-matches?callNumber=TCK-000042', { token: addinToken });
    check(
      'auch das Duplikatangebot trägt ihn nicht',
      !matches.text.includes('Aus der E-Mail'),
      matches.text.slice(0, 200),
    );
  }

  // ---------------------------------------------------------------------------
  section('6  Kein Geheimnis in der Ausgabe des Dienstes (B-2.4)');
  // ---------------------------------------------------------------------------
  {
    const output = `${stdout}\n${stderr}`;
    check('die Protokollausgabe enthält kein Token', !/takt_[A-Za-z0-9_-]{43}/.test(output));
    check('sie enthält den Vermerk nicht', !output.includes('Aus der E-Mail'));
  }
} finally {
  child.kill('SIGTERM');
  // Abwarten statt eines festen 200-ms-Schlafs (T-029, Risiko 5): Der nächste
  // Prüflauf auf demselben Port muss ihn sicher frei vorfinden, nicht nur
  // "wahrscheinlich, wenn die Maschine schnell genug war". `SIGKILL` bleibt
  // der Rückfall, falls `SIGTERM` binnen 3 s nichts bewirkt hat.
  const exitCode = await Promise.race([childExit, sleep(3000).then(() => null)]);
  if (exitCode === null && child.exitCode === null) {
    child.kill('SIGKILL');
    await Promise.race([childExit, sleep(2000)]);
  }
  await rm(dataDir, { recursive: true, force: true });
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
