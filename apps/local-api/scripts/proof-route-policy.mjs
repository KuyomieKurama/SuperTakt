/**
 * Takt — Nachweis, dass ein Add-in-Token nur die Add-in-Fläche erreicht
 * (T-034, B-2.10, Prüfung 24 aus Abschnitt 7 des Bedrohungsmodells).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:route-policy
 *
 * ===========================================================================
 * Warum dieser Lauf existiert
 * ===========================================================================
 *
 * T-023 hat mit **einem einzigen** Add-in-Token gegen den zusammengesetzten
 * Dienst gemessen: `GET /todos/{id}/note` → 200 mit dem internen Vermerk im
 * Klartext, `PUT` darauf → 200, `PATCH /settings` → 200 mit frei gewähltem
 * Exportordner, `POST /export/runs` → 201 mit einer Datei in genau diesem
 * Ordner. Das ist die vollständige Kette von einem dauerhaften, im
 * `localStorage` liegenden Token (E-009, E-019, R-09) zu ausgeleiteten
 * Kundendaten.
 *
 * Abschnitt 2 fährt jede dieser Messungen nach und zeigt, dass sie scheitert.
 * Das allein genügt aber nicht — vier nachgefahrene Angriffe schützen genau
 * vier Routen. Deshalb der zweite und wichtigere Teil:
 *
 * ===========================================================================
 * Die Aufzählung kommt aus dem Dienst, nicht aus dieser Datei
 * ===========================================================================
 *
 * Abschnitt 4 fragt den zusammengebauten Dienst nach **seiner eigenen**
 * Routenliste (`Hono#routes`) und fährt jede registrierte Route außerhalb von
 * `/api/v1/addin` einmal mit dem Add-in-Token an. Erwartet wird 401, ohne
 * Ausnahme.
 *
 * Eine von Hand gepflegte Liste hätte genau den Fehler, aus dem B-2.10
 * entstanden ist: Die nächste hinzugefügte Fachroute ist die vergessene. Wer
 * künftig eine Route registriert, ohne sie unter `/addin` zu hängen, bekommt
 * sie hier automatisch mitgeprüft — und wenn sie offen steht, wird dieser Lauf
 * rot, ohne dass jemand daran gedacht haben muss.
 *
 * Die Gegenprobe in Abschnitt 5 ist der andere Teil derselben Aussage: Mit dem
 * Sitzungsgeheimnis ergibt **keine** dieser Routen 401. Ohne sie wäre „alles
 * 401" auch durch einen kaputten Dienst erfüllbar.
 *
 * ===========================================================================
 * Die Regel über allen Nachweispfaden (A-A-55, T-206)
 * ===========================================================================
 *
 * Sie steht **hier** ausgeschrieben, weil an dieser Stelle schon die
 * Begründung der Aufzählung steht; `proof-openapi.mjs` und
 * `proof-template-fields.mjs` verweisen darauf:
 *
 * > **Keine Zusicherung darf bestehen, ohne daß das Geprüfte stattgefunden
 * > hat.** Wer eine Zusicherung über eine Menge schreibt, schreibt die
 * > Untergrenze dieser Menge daneben.
 *
 * Eine Aufzählung, die still schrumpfen kann, eine Menge, die leer sein darf,
 * und ein Angriff, der nicht ankommt, sind dieselbe Blindheit wie ein
 * Zerleger, der aus dem Takt gerät (A-A-33). Sechsmal in sechs Wellen lag die
 * Blindheit eines Wächters nicht in dem, worüber er urteilt, sondern in dem,
 * was er vorher für selbstverständlich hält. **Ein Wächter irrt sich selten
 * über sein Urteil. Er irrt sich über seinen Gegenstand.**
 *
 * Die erste Anwendung davon steht unmittelbar in {@link collectRoutes}.
 *
 * ===========================================================================
 * Warum über `app.fetch` und nicht über einen echten Netzanschluss
 * ===========================================================================
 *
 * Zwei Gründe, und beide sind Absicht.
 *
 * 1. `app.fetch` ist **dieselbe** Kette, die der Adaptor-Server bei jeder
 *    Anfrage aufruft — er baut aus der eingehenden Nachricht ein `Request` und
 *    reicht es genau hier hinein. Host-, Herkunfts-, Adress-, Inhaltstyp-,
 *    Größen-, Zeit-, Nachweis- und Rechteprüfung laufen vollständig. Der
 *    security-checker hat B-2.10 auf demselben Weg gemessen; dieser Lauf ist
 *    die Gegenprobe zu genau jener Messung.
 * 2. Der Dienst kennt **keine** Angabe für seinen Port (B-1.6 Punkt 1), er
 *    lauscht immer auf 17843. Ein Prüfpfad, der einen Prozess startet, ist
 *    deshalb nicht zweimal gleichzeitig fahrbar und kollidiert mit einer
 *    laufenden Anwendung und mit den End-zu-End-Tests. Der Weg über die echte
 *    Verbindung ist in `proof-addin-wiring.mjs` gebaut und bleibt dort.
 *
 * Was der Transport zu dieser Eigenschaft beiträgt, ist nichts: Die
 * Entscheidung fällt auf `c.req.path`, und den berechnet Hono aus dem `Request`
 * — gleich, ob es aus einem Netzanschluss oder von hier kommt.
 */

import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

import { compose } from '../src/composition.ts';
import { API_BASE_PATH } from '../src/config.ts';
import {
  ADDIN_PATH_PREFIX,
  SHARED_PATHS,
  requiredCredentialForPath,
} from '../src/access/route-policy.ts';

/** Die Herkunft des Aufgabenbereichs (E-046) — von dort spricht das Add-in. */
const ADDIN_ORIGIN = 'https://localhost:17844';
const PORT = 17843;
const HOST = `127.0.0.1:${PORT}`;

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
// Aufbau: echte SQLite in einem Wegwerfordner, echte Migration, echtes Token.
// ---------------------------------------------------------------------------

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-policy-'));
const stolenDir = await mkdtemp(join(tmpdir(), 'takt-beute-'));
const sessionSecret = `takt_${randomBytes(32).toString('base64url')}`;

/** Ein Tokenspeicher im Arbeitsspeicher — die Datei prüft `proof-access.mjs`. */
function memoryStore() {
  let record = null;
  return {
    read: async () => (record === null ? { status: 'absent' } : { status: 'ok', record }),
    write: async (next) => {
      record = next;
    },
    inspectPermissions: async () => ({
      checked: false,
      dirTooPermissive: false,
      fileTooPermissive: false,
    }),
  };
}

function build(location) {
  return compose({
    port: PORT,
    store: memoryStore(),
    sessionSecret,
    windowsUser: 't.beispiel',
    databaseLocation: location,
  });
}

const service = build(join(dataDir, 'takt.db'));
await service.database.migrations.migrateToLatest();
await service.tokens.load(new Date());
const addinToken = await service.tokens.rotate(new Date());

/** Ein Aufruf durch die vollständige Kette. */
async function call(path, { method = 'GET', token, origin = ADDIN_ORIGIN, body, raw } = {}) {
  const headers = { Host: HOST };
  if (origin !== null) headers.Origin = origin;
  if (token !== undefined) headers['X-Takt-Token'] = token;
  const init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const url = raw === true ? `http://${HOST}${path}` : `http://${HOST}${API_BASE_PATH}${path}`;
  const response = await service.app.fetch(new Request(url, init));
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* kein JSON */
  }
  return { status: response.status, body: json, text };
}

/**
 * Trägt der Pfad einen Platzhalter — `*` oder `:name`?
 *
 * Daran, und nur daran, unterscheidet sich ein Kettenglied von einem Endpunkt,
 * wenn beide unter der Methode `ALL` stehen (A-A-51).
 */
function hasPlaceholder(path) {
  return path.includes('*') || /:[A-Za-z0-9_]/.test(path);
}

/**
 * Baut den Dienst ein zweites Mal, nur um ihn nach seinen Routen zu fragen.
 *
 * Derselbe `compose` mit denselben Bausteinen — die Liste ist deshalb dieselbe
 * wie die des Dienstes oben. Diese Ausfertigung hält nur eine Datenbank im
 * Arbeitsspeicher und wird nach dem Auslesen weggeworfen.
 *
 * Zurück kommt neben der Liste, was aus ihr **herausgefallen** ist. Siehe
 * A-A-51 unten.
 */
function collectRoutes() {
  const probe = build(':memory:');
  const unique = new Map();
  const opaque = [];
  for (const route of probe.app.routes) {
    // `Hono#routes` führt auch die Kettenglieder. Sie stehen als `ALL /*` und
    // sind keine Endpunkte — alles mit konkreter Methode ist einer.
    //
    // T-206-1: Der Satz stimmt für Kettenglieder und **nicht** für
    // `app.all('/x', …)` und `app.on('ALL', …)`. Hono trägt beides mit
    // derselben Methode ein; ein so registrierter Endpunkt ist von einem
    // Kettenglied allein am Platzhalter zu unterscheiden. Gemessen wurde eine
    // Zeile `api.all('/addin/leak', …)`: mit dem Add-in-Token 200 samt Rumpf,
    // dieser Lauf 40/0 und grün — samt der Zusicherung „die Add-in-Fläche sind
    // genau vier Routen".
    //
    // Ein `ALL`-Eintrag ohne Platzhalter wird deshalb nicht übersprungen,
    // sondern festgehalten und unten gemeldet: Eine Aussage über eine Liste,
    // aus der etwas herausfällt, ist keine (A-A-55).
    //
    // **Was diese Weigerung nicht deckt, und das steht hier, statt zu
    // fehlen:** Ein Endpunkt, der selbst auf einem Platzhalter liegt —
    // `api.all('/addin/*', …)` —, ist am Pfad allein von einem Kettenglied
    // nicht zu unterscheiden. Der Bestand kennt heute zehn `ALL`-Einträge,
    // alle auf `/*` und alle Kettenglieder; die Unterscheidung nach Bauart
    // (ein Kettenglied nimmt `(c, next)`, ein Endpunkt `(c)`) trägt nicht, weil
    // sie sich durch die Schreibweise des Handlers aushebeln lässt. Wer einen
    // Endpunkt unter `ALL` auf einen Platzhalter legt, umgeht diesen Wächter
    // weiterhin — gemeldet als offener Rest von T-215.
    if (route.method === 'ALL') {
      if (!hasPlaceholder(route.path)) opaque.push(route.path);
      continue;
    }
    unique.set(`${route.method} ${route.path}`, { method: route.method, path: route.path });
  }
  probe.database.close();
  return { routes: [...unique.values()], opaque };
}

/** Ein Platzhalter im Pfad wird zu einer formgültigen, nirgends vorhandenen Kennung. */
const SAMPLE_ID = '01920000-0000-7000-8000-000000000000';
function concrete(path) {
  return path.replace(/:[A-Za-z0-9_]+/g, SAMPLE_ID).slice(API_BASE_PATH.length);
}

const VERMERK = 'GEHEIMER-INTERNER-VERMERK-Kunde-Meier-Kuendigung';

try {
  // ---------------------------------------------------------------------------
  section('1  Vorbereitung: ein echtes Add-in-Token und ein Todo mit Vermerk');
  // ---------------------------------------------------------------------------
  check(
    'ein Add-in-Token ist erzeugt',
    typeof addinToken === 'string' && addinToken.startsWith('takt_'),
    String(addinToken).slice(0, 12),
  );
  check('Sitzungsgeheimnis und Add-in-Token sind verschieden', addinToken !== sessionSecret);

  const created = await call('/todos', {
    method: 'POST',
    token: sessionSecret,
    body: { title: 'Nachweis T-034', callNumber: 'TCK-000009', note: VERMERK },
  });
  const todoId = created.body?.data?.todo?.id ?? created.body?.data?.id;
  check(
    'ein Todo mit internem Vermerk ist angelegt',
    created.status === 201 && typeof todoId === 'string',
    `Status ${created.status}: ${created.text.slice(0, 200)}`,
  );
  if (typeof todoId !== 'string') throw new Error('kein Todo angelegt');

  const noteBySession = await call(`/todos/${todoId}/note`, { token: sessionSecret });
  check(
    'die Oberfläche (Sitzungsgeheimnis) liest den Vermerk weiterhin',
    noteBySession.status === 200 && noteBySession.text.includes(VERMERK),
    `Status ${noteBySession.status}`,
  );

  // ---------------------------------------------------------------------------
  section('2  Die Messungen aus T-023, mit ausschließlich dem Add-in-Token');
  // ---------------------------------------------------------------------------
  {
    const read = await call(`/todos/${todoId}/note`, { token: addinToken });
    check(
      'GET /todos/{id}/note  →  401 statt 200 (war: der Vermerk im Klartext)',
      read.status === 401,
      `Status ${read.status}`,
    );
    check(
      'der Vermerk steht in keiner Form in der Antwort',
      !read.text.includes(VERMERK) &&
        !read.text.includes(Buffer.from(VERMERK, 'utf8').toString('base64')),
      read.text.slice(0, 200),
    );
    check(
      'die Abweisung nennt denselben Schlüssel wie ein fehlendes Token',
      read.body?.error?.code === 'unauthorized',
      JSON.stringify(read.body).slice(0, 200),
    );

    const overwrite = await call(`/todos/${todoId}/note`, {
      method: 'PUT',
      token: addinToken,
      body: { note: 'ueberschrieben durch ein entwendetes Token' },
    });
    check(
      'PUT /todos/{id}/note  →  401 statt 200 (war: überschreibbar)',
      overwrite.status === 401,
      `Status ${overwrite.status}`,
    );

    const still = await call(`/todos/${todoId}/note`, { token: sessionSecret });
    check(
      'der Vermerk steht unverändert da',
      still.status === 200 && still.text.includes(VERMERK),
      `Status ${still.status}`,
    );

    const settings = await call('/settings', {
      method: 'PATCH',
      token: addinToken,
      body: { exportDirectory: stolenDir },
    });
    check(
      'PATCH /settings  →  401 statt 200 (war: Exportordner frei wählbar)',
      settings.status === 401,
      `Status ${settings.status}`,
    );

    const after = await call('/settings', { token: sessionSecret });
    check(
      'der Exportordner ist nicht gesetzt worden',
      after.status === 200 && !after.text.includes(stolenDir),
      after.text.slice(0, 240),
    );

    const rounding = await call('/settings', {
      method: 'PATCH',
      token: addinToken,
      body: { roundingMode: 'commercial' },
    });
    check(
      'PATCH /settings mit roundingMode  →  401 (eine Abrechnungsgröße)',
      rounding.status === 401,
      `Status ${rounding.status}`,
    );

    const run = await call('/export/runs', { method: 'POST', token: addinToken, body: {} });
    check(
      'POST /export/runs  →  401 statt 201 (war: Datei im gewählten Ordner)',
      run.status === 401,
      `Status ${run.status}`,
    );

    const spoils = await readdir(stolenDir);
    check('im Zielordner des Angreifers liegt keine Datei', spoils.length === 0, spoils.join(', '));

    const preview = await call('/export/preview', { method: 'POST', token: addinToken, body: {} });
    check(
      'POST /export/preview  →  401 (war: 200, eine Vorschau aller offenen Buchungen)',
      preview.status === 401,
      `Status ${preview.status}`,
    );

    const listing = await call('/time-entries', { token: addinToken });
    check(
      'GET /time-entries  →  401 (war: 200)',
      listing.status === 401,
      `Status ${listing.status}`,
    );

    const drop = await call(`/todos/${todoId}`, { method: 'DELETE', token: addinToken });
    check('DELETE /todos/{id}  →  401', drop.status === 401, `Status ${drop.status}`);

    const survives = await call(`/todos/${todoId}`, { token: sessionSecret });
    check('das Todo ist noch da', survives.status === 200, `Status ${survives.status}`);
  }

  // ---------------------------------------------------------------------------
  section('3  Die vier Routen, die das Add-in wirklich braucht, bleiben offen');
  // ---------------------------------------------------------------------------
  {
    const context = await call('/addin/context', { token: addinToken });
    check(
      'GET /addin/context ist mit dem Add-in-Token erreichbar',
      context.status === 200,
      `Status ${context.status}: ${context.text.slice(0, 200)}`,
    );
    check(
      'auch die Add-in-Fläche gibt keinen Vermerk heraus',
      !context.text.includes(VERMERK),
      context.text.slice(0, 200),
    );

    const matches = await call('/addin/todo-matches?callNumber=TCK-000009', { token: addinToken });
    check(
      'GET /addin/todo-matches ist erreichbar',
      matches.status === 200,
      `Status ${matches.status}: ${matches.text.slice(0, 200)}`,
    );
    check(
      'das Duplikatangebot trägt keinen Vermerk',
      !matches.text.includes(VERMERK),
      matches.text.slice(0, 240),
    );

    const posted = await call('/addin/todos', {
      method: 'POST',
      token: addinToken,
      body: { title: 'Aus dem Add-in', callNumber: 'TCK-000010' },
    });
    check(
      'POST /addin/todos legt weiterhin ein Todo an',
      posted.status === 201,
      `Status ${posted.status}: ${posted.text.slice(0, 240)}`,
    );

    const addinTodoId = posted.body?.data?.todo?.id ?? posted.body?.data?.id;
    if (typeof addinTodoId === 'string') {
      const booked = await call(`/addin/todos/${addinTodoId}/time-entries`, {
        method: 'POST',
        token: addinToken,
        body: {
          startedAt: '2026-09-01T08:00:00Z',
          endedAt: '2026-09-01T08:10:00Z',
          note: 'Analyse',
        },
      });
      check(
        'POST /addin/todos/{id}/time-entries bucht weiterhin Zeit',
        booked.status === 201,
        `Status ${booked.status}: ${booked.text.slice(0, 240)}`,
      );
    } else {
      check('POST /addin/todos liefert eine Kennung', false, posted.text.slice(0, 240));
    }
  }

  // ---------------------------------------------------------------------------
  section('4  Prüfung 24 — jede registrierte Route außerhalb von /addin ergibt 401');
  // ---------------------------------------------------------------------------
  const { routes, opaque } = collectRoutes();
  const foreign = routes.filter((r) => requiredCredentialForPath(r.path) === 'session');
  const own = routes.filter((r) => requiredCredentialForPath(r.path) === 'any');

  // A-A-51 — die Weigerung steht vor jedem Urteil über die Liste. Wer künftig
  // ein Kettenglied auf einen genauen Pfad legt, schreibt es mit Platzhalter
  // oder nennt es hier.
  check(
    'kein ALL-Eintrag ohne Platzhalter — sonst urteilt dieser Lauf über eine unvollständige Liste (A-A-51)',
    opaque.length === 0,
    `mit ALL registriert und damit aus der Liste gefallen: ${opaque.join(', ')}`,
  );

  check(
    `die Routenliste des Dienstes ist auslesbar und vollständig (${routes.length} Operationen)`,
    routes.length >= 60,
    `nur ${routes.length}`,
  );
  const addinSurface = own.filter((r) => r.path.startsWith(ADDIN_PATH_PREFIX));
  const shared = own.filter((r) => !r.path.startsWith(ADDIN_PATH_PREFIX));

  check(
    `die Add-in-Fläche sind genau vier Routen (${addinSurface.length})`,
    addinSurface.length === 4,
    addinSurface.map((r) => `${r.method} ${r.path}`).join(', '),
  );
  check(
    'daneben ist genau eine weitere Route abgesenkt, und es ist GET /health',
    shared.length === 1 && shared[0].method === 'GET' && SHARED_PATHS.has(shared[0].path),
    shared.map((r) => `${r.method} ${r.path}`).join(', '),
  );

  const leaks = [];
  for (const route of foreign) {
    const response = await call(concrete(route.path), {
      method: route.method,
      token: addinToken,
      ...(route.method === 'GET' || route.method === 'DELETE' ? {} : { body: {} }),
    });
    if (response.status !== 401) leaks.push(`${route.method} ${route.path} → ${response.status}`);
  }
  check(
    `alle ${foreign.length} Routen außerhalb von ${ADDIN_PATH_PREFIX} ergeben mit dem Add-in-Token 401`,
    leaks.length === 0,
    leaks.join(' | '),
  );

  // Die abgesenkte Ausnahme trägt ihren Namen zu Recht: Sie ist erreichbar und
  // verrät nichts (Begründung in `access/route-policy.ts`).
  {
    const health = await call('/health', { token: addinToken });
    check(
      'GET /health ist mit dem Add-in-Token erreichbar — „Verbindung prüfen" in S-13',
      health.status === 200,
      `Status ${health.status}`,
    );
    check(
      'und nennt nichts als den Zustand: kein Pfad, kein Benutzername, keine Bestandsgröße',
      health.text === '{"data":{"status":"ok"}}',
      health.text,
    );
    const withoutToken = await call('/health');
    check(
      'ohne Nachweis bleibt sie zu — sie verrät nicht, dass Takt läuft',
      withoutToken.status === 401,
      `Status ${withoutToken.status}`,
    );
  }

  const closedAddin = [];
  for (const route of own) {
    const response = await call(concrete(route.path), {
      method: route.method,
      token: addinToken,
      ...(route.method === 'GET' ? {} : { body: {} }),
    });
    if (response.status === 401) closedAddin.push(`${route.method} ${route.path}`);
  }
  check(
    'keine der abgesenkten Routen ist versehentlich mitgeschlossen worden',
    closedAddin.length === 0,
    closedAddin.join(' | '),
  );

  // ---------------------------------------------------------------------------
  section('5  Gegenprobe — dieselben Routen mit dem Sitzungsgeheimnis ergeben nicht 401');
  // ---------------------------------------------------------------------------
  {
    const wrongly = [];
    for (const route of foreign) {
      const response = await call(concrete(route.path), {
        method: route.method,
        token: sessionSecret,
        ...(route.method === 'GET' || route.method === 'DELETE' ? {} : { body: {} }),
      });
      if (response.status === 401) wrongly.push(`${route.method} ${route.path}`);
    }
    check(
      `keine der ${foreign.length} Routen weist das Sitzungsgeheimnis ab`,
      wrongly.length === 0,
      wrongly.join(' | '),
    );
  }

  // ---------------------------------------------------------------------------
  section('6  Die Grenze des Teilbaums hält auch von der Seite');
  // ---------------------------------------------------------------------------
  {
    const lookalike = await call(`${API_BASE_PATH}/addintern/context`, {
      token: addinToken,
      raw: true,
    });
    check(
      'ein ähnlich benannter Pfad (/addintern) fällt nicht in die Ausnahme',
      lookalike.status === 401,
      `Status ${lookalike.status}`,
    );

    const traversal = await call(`${API_BASE_PATH}/addin/../todos`, {
      token: addinToken,
      raw: true,
    });
    check(
      '/addin/../todos kommt nicht an den Todos an',
      traversal.status === 401,
      `Status ${traversal.status}`,
    );

    const encoded = await call(`${API_BASE_PATH}/addin/%2e%2e/todos`, {
      token: addinToken,
      raw: true,
    });
    check('/addin/%2e%2e/todos ebenso wenig', encoded.status === 401, `Status ${encoded.status}`);

    const slashEncoded = await call(`${API_BASE_PATH}/addin%2f../todos`, {
      token: addinToken,
      raw: true,
    });
    check('/addin%2f../todos ebenso wenig', slashEncoded.status === 401, `Status ${slashEncoded.status}`);

    const unknown = await call('/gibt-es-nicht', { token: addinToken });
    check(
      'ein unbekannter Pfad ergibt 401 und nicht 404 — die Routenliste bleibt verdeckt',
      unknown.status === 401,
      `Status ${unknown.status}`,
    );

    const none = await call('/addin/context');
    check('ohne jeden Nachweis bleibt auch die Add-in-Fläche zu', none.status === 401, `Status ${none.status}`);
  }

  // ---------------------------------------------------------------------------
  section('7  Die reine Entscheidungsfunktion, ohne laufenden Dienst');
  // ---------------------------------------------------------------------------
  {
    const cases = [
      [`${API_BASE_PATH}/health`, 'any'],
      [`${API_BASE_PATH}/health/extra`, 'session'],
      [`${API_BASE_PATH}/healthy`, 'session'],
      [`${API_BASE_PATH}/addin`, 'any'],
      [`${API_BASE_PATH}/addin/context`, 'any'],
      [`${API_BASE_PATH}/addin/todos/x/time-entries`, 'any'],
      [`${API_BASE_PATH}/addintern`, 'session'],
      [`${API_BASE_PATH}/addin-extra/context`, 'session'],
      // Roh, also so, wie der Adaptor-Server ihn durchreicht, wenn der
      // URL-Parser nichts aufzulösen fand: beide bleiben zu.
      [`${API_BASE_PATH}/addin/../todos`, 'session'],
      [`${API_BASE_PATH}/addin/%2E%2E/todos`, 'session'],
      [`${API_BASE_PATH}/addin/./context`, 'session'],
      [`${API_BASE_PATH}/addin%2f../todos`, 'session'],
      [`${API_BASE_PATH}/todos`, 'session'],
      [`${API_BASE_PATH}/settings`, 'session'],
      [`${API_BASE_PATH}/export/runs`, 'session'],
      ['/addin/context', 'session'],
      ['/', 'session'],
      ['', 'session'],
    ];
    const wrong = cases.filter(([path, expected]) => requiredCredentialForPath(path) !== expected);
    check(
      `requiredCredentialForPath entscheidet alle ${cases.length} Fälle wie beschrieben`,
      wrong.length === 0,
      wrong.map(([p]) => p).join(', '),
    );
  }
} finally {
  service.database.close();
  await rm(dataDir, { recursive: true, force: true });
  await rm(stolenDir, { recursive: true, force: true });
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
