/**
 * Takt — Nachweis der beiden Erweiterungen aus T-033 (E-049, E-051).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:export-api
 *
 * ===========================================================================
 * Warum dieser Lauf über HTTP geht und nicht gegen den Anwendungsfall
 * ===========================================================================
 *
 * `proof:export` fährt `runExport` und `previewExport` unmittelbar an — richtig
 * so, denn die Zusicherung aus A-8.8 ist eine über Transaktionen und Dateien.
 * Die beiden Punkte aus T-033 sind dagegen Zusicherungen über die
 * **Schnittstelle**:
 *
 *  - E-049: Was der Dienst als Auswahlliste **ausliefert**, ist wörtlich die
 *    Liste, gegen die er beim Speichern prüft. Das lässt sich nur an der
 *    Antwort messen, nicht an einer Funktion.
 *  - E-051: Die Vorschau prüft eine mitgeschickte Definition **genau so** wie
 *    das Speichern. Der Nachweis ist ein Vergleich zweier Antworten — Status,
 *    Schlüssel, Satz und Feldangaben — und der ist nur über zwei echte
 *    Anfragen zu führen.
 *
 * Der Lauf startet deshalb den echten Sidecar als Kindprozess mit
 * Startgeheimnis und Benutzername über `stdin`, gegen eine echte migrierte
 * Datenbank in einem Wegwerfordner, und fährt die Routen durch die vollständige
 * Kette aus Host-, Herkunfts-, Inhaltstyp- und Tokenprüfung.
 *
 * Ausgabe: eine Zeile je Prüfung, am Ende eine Zusammenfassung. Exitcode 1,
 * sobald eine Prüfung fehlschlägt.
 */

import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request } from 'node:http';
import { createConnection } from 'node:net';
import { randomBytes } from 'node:crypto';

/**
 * Die Liste des Motors — **eingebunden, nicht abgeschrieben**.
 *
 * Der ganze Zweck von E-049 ist, dass es keine zweite Fassung dieser Liste
 * gibt. Ein Prüfpfad, der die zwölf Pfade selbst hinschriebe, wäre genau die
 * sechste Fassung und bestünde auch dann, wenn der Dienst etwas anderes
 * ausliefert als der Motor kennt.
 */
const { EXPORT_SOURCE_PATHS, EXPORT_TRANSFORMATIONS } = await import('@takt/export');

const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(HERE, '..', 'src', 'index.ts');
const PORT = 17843;

/** Die Herkunft der Oberfläche im Entwicklungsbetrieb (config.ts). */
const UI_ORIGIN = 'http://127.0.0.1:5173';

/** Ein Vermerk, der in keiner Antwort dieses Laufs auftauchen darf (A-7.2). */
const VERMERK = 'Vertraulicher Vermerk aus der E-Mail';

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

/** Dasselbe Muster wie in `proof-access.mjs` — die Prüfpfade teilen sich den Port. */
async function waitForPortFree(port, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  do {
    if (await portFree(port)) return true;
    await sleep(150);
  } while (Date.now() < until);
  return false;
}

/**
 * Jeder Antwortkörper dieses Laufs — die Menge, über die Abschnitt 8 urteilt.
 *
 * A-A-57: Genau **eine** Anfrage wird hier nicht eingetragen, und zwar die, die
 * den Vermerk holen **soll** (`sammeln: false`, Abschnitt 3). Sie ist der
 * positive Anker; stünde ihr Körper in dieser Menge, wäre die Menge nicht mehr
 * die, über die Abschnitt 8 etwas behauptet.
 */
const seenBodies = [];

/** Wie viele Anfragen der Dienst tatsächlich beantwortet hat — Untergrenze für A-A-58. */
let beantworteteAnfragen = 0;

function call(path, { method = 'GET', token, origin = UI_ORIGIN, body, sammeln = true } = {}) {
  return new Promise((resolve) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body), 'utf8');
    const headers = { Host: `127.0.0.1:${PORT}` };
    if (origin !== null) headers.Origin = origin;
    if (token !== undefined) headers['X-Takt-Token'] = token;
    if (payload !== null) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(payload.byteLength);
    }

    const req = request(
      { host: '127.0.0.1', port: PORT, path: `/api/v1${path}`, method, headers },
      (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          text += chunk;
        });
        res.on('end', () => {
          beantworteteAnfragen += 1;
          if (sammeln) seenBodies.push(text);
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            /* kein JSON */
          }
          resolve({ status: res.statusCode, body: json, text });
        });
      },
    );
    req.on('error', (error) => resolve({ status: 0, body: null, text: String(error.message) }));
    if (payload !== null) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Aufbau
// ---------------------------------------------------------------------------

if (!(await waitForPortFree(PORT))) {
  console.error(
    `FEHLER: Auf 127.0.0.1:${PORT} lauscht bereits etwas, auch nach 5 s Warten. ` +
      'Läuft Takt oder ein anderer Prüfpfad noch?',
  );
  process.exit(1);
}

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-export-api-'));
const secret = `takt_${randomBytes(32).toString('base64url')}`;

const child = spawn(process.execPath, [ENTRY], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, XDG_DATA_HOME: dataDir },
});
const childExit = new Promise((resolve) => child.once('exit', (code) => resolve(code)));
let stderr = '';
let stdout = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdout += chunk;
});

// Zwei Zeilen über denselben Kanal: Startgeheimnis, dann Benutzername (E-042).
child.stdin.write(`${secret}\nt.beispiel\n`);

async function waitForService() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const health = await call('/health', { token: secret });
    if (health.status !== 0) return true;
    await sleep(100);
  }
  return false;
}

/** Kurzform: jede Anfrage dieses Laufs geht mit dem Sitzungsgeheimnis. */
const get = (path) => call(path, { token: secret });
const post = (path, body) => call(path, { method: 'POST', token: secret, body });

/** Listen kommen geblättert (`{ items, nextCursor, total }`), Vorlagen als Feld. */
const listOf = (response) => {
  const payload = response.body?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return null;
};

/** Wie viele Vorlagen und Läufe der Bestand gerade führt — für „schreibt nichts". */
async function stateOf() {
  const templates = listOf(await get('/export/templates'));
  const runs = listOf(await get('/export/runs'));
  return {
    templates: templates === null ? -1 : templates.length,
    runs: runs === null ? -1 : runs.length,
  };
}

try {
  const up = await waitForService();
  check('der Dienst kommt hoch', up, stderr.slice(-400));
  if (!up) throw new Error('Dienst nicht erreichbar');

  // -------------------------------------------------------------------------
  section('1  GET /export/sources liefert die Auswahlliste (E-049)');
  // -------------------------------------------------------------------------

  const sources = await get('/export/sources');
  check('die Route antwortet mit 200', sources.status === 200, `Status ${sources.status}: ${sources.text.slice(0, 200)}`);

  const catalog = sources.body?.data ?? {};
  const paths = (catalog.sources ?? []).map((entry) => entry.path);

  check(
    `sie liefert ${EXPORT_SOURCE_PATHS.length} Quellen`,
    paths.length === EXPORT_SOURCE_PATHS.length,
    `${paths.length} geliefert`,
  );
  check(
    'die gelieferte Menge ist wörtlich die des Motors (EXPORT_SOURCE_PATHS)',
    [...paths].sort().join('|') === [...EXPORT_SOURCE_PATHS].sort().join('|'),
    `geliefert: ${paths.join(', ')}`,
  );
  check(
    'jede Quelle trägt Gruppe, Beschriftung und Beschreibung',
    (catalog.sources ?? []).every(
      (entry) =>
        typeof entry.group === 'string' &&
        entry.group.length > 0 &&
        typeof entry.label === 'string' &&
        entry.label.length > 0 &&
        typeof entry.description === 'string' &&
        entry.description.length > 0,
    ),
  );
  check(
    'die drei Ebenen stehen in Anzeigereihenfolge da',
    (catalog.groups ?? []).map((group) => group.id).join(',') === 'todo,group,system',
    JSON.stringify((catalog.groups ?? []).map((group) => group.id)),
  );
  check(
    'jede Quelle gehört zu einer gelieferten Ebene',
    (catalog.sources ?? []).every((entry) =>
      (catalog.groups ?? []).some((group) => group.id === entry.group),
    ),
  );
  check(
    'die Quellen sind nach Ebenen sortiert ausgeliefert',
    (catalog.sources ?? []).map((entry) => entry.group).join(',') ===
      'todo,todo,todo,group,group,group,group,group,group,group,system,system',
    (catalog.sources ?? []).map((entry) => entry.group).join(','),
  );
  check(
    'die Transformationen sind wörtlich die des Motors',
    (catalog.transformations ?? []).map((entry) => entry.value).join(',') ===
      EXPORT_TRANSFORMATIONS.join(','),
    JSON.stringify((catalog.transformations ?? []).map((entry) => entry.value)),
  );
  check(
    'jede Transformation trägt Beschriftung und Wirkung',
    (catalog.transformations ?? []).every(
      (entry) => entry.label?.length > 0 && entry.effect?.length > 0,
    ),
  );
  check(
    'die beiden Vergleiche einer Bedingung stehen dabei',
    (catalog.conditionOperators ?? []).map((entry) => entry.value).join(',') === 'is_set,is_not_set',
    JSON.stringify(catalog.conditionOperators),
  );
  check(
    'der Satz zur Notiz-Trennung wird mitgeliefert (A-7.2)',
    typeof catalog.noteBoundaryHint === 'string' && catalog.noteBoundaryHint.includes('Vermerk'),
  );
  /**
   * Dieselbe Form wie die Typzusicherung `NoteSourceIsNotPublished`, kein
   * Teilstring-Treffer: `group.bookingNotes` ist die **abrechenbare Leistung**
   * und soll auf der Liste stehen. Gesucht wird ein Pfad, der als Ganzes
   * „Notiz" heißt — genau die Mehrdeutigkeit aus R-08.
   */
  const notePath = (path) => /^todo\.(note|notiz)/i.test(path) || /\.(note|notiz|vermerk)$/i.test(path);
  check(
    'keine ausgelieferte Quelle heißt nach einer Notiz (R-06, B-3.1)',
    paths.every((path) => !notePath(path)),
    paths.filter(notePath).join(', '),
  );
  check(
    'die Auskunft kommt ohne Bestand aus — zweiter Aufruf, gleiche Antwort',
    (await get('/export/sources')).text === sources.text,
  );
  check(
    'ohne Nachweis ist sie nicht erreichbar (B-1.1)',
    (await call('/export/sources')).status === 401,
  );

  // -------------------------------------------------------------------------
  section('2  Jede ausgelieferte Quelle wird beim Speichern angenommen');
  // -------------------------------------------------------------------------

  /**
   * Eine Vorlage über **alle** gelieferten Quellen. Aus der Antwort gebaut,
   * nicht getippt.
   *
   * Der Feldname wird aus dem Quellenpfad abgeleitet und nicht wörtlich
   * übernommen: Seit T-034 gilt für Feldnamen der Zeichenvorrat
   * `[A-Za-z0-9_-]{1,64}` (B-3.2), und ein Punkt gehört nicht dazu. Der Punkt
   * dieses Abschnitts ist die **Quelle**, nicht der Name.
   */
  const fieldName = (path) => path.replace(/[^A-Za-z0-9_-]/g, '_');
  const allSources = {
    version: 1,
    fields: paths.map((path) => ({ name: fieldName(path), source: path, transformation: 'raw' })),
  };

  const savedAll = await post('/export/templates', { name: 'Alle Quellen', definition: allSources });
  check(
    'eine Vorlage über alle zwölf gelieferten Quellen wird gespeichert (201)',
    savedAll.status === 201,
    `Status ${savedAll.status}: ${savedAll.text.slice(0, 300)}`,
  );

  const previewAll = await post('/export/preview', { definition: allSources, timeEntryIds: [] });
  check(
    'dieselbe Definition rendert die Vorschau (200)',
    previewAll.status === 200,
    `Status ${previewAll.status}: ${previewAll.text.slice(0, 300)}`,
  );

  // -------------------------------------------------------------------------
  section('3  Bestand für die Vorschau: ein Todo mit drei Buchungen an einem Tag');
  // -------------------------------------------------------------------------

  const todo = await post('/todos', {
    title: 'Call 4711',
    callNumber: 'TCK-000042',
    tagIds: [],
    note: VERMERK,
  });
  check('das Todo entsteht', todo.status === 201, `Status ${todo.status}: ${todo.text.slice(0, 200)}`);
  const todoId = todo.body?.data?.todo?.id ?? todo.body?.data?.id;
  check('es trägt eine Kennung', typeof todoId === 'string' && todoId.length > 0, todo.text.slice(0, 200));

  /**
   * A-A-57 — der positive Anker, vor jeder Aussage über das Fehlen.
   *
   * Bis T-223 wurde `VERMERK` einmal geschrieben und nie gelesen; Abschnitt 8
   * urteilte über sein Fehlen, ohne daß irgend etwas geprüft hätte, daß er je
   * im Bestand war. Gemessen mit `note: 'harmlos, kein Vermerk'` blieb der Lauf
   * bei 69/0 und Code 0, beide Zeilen grün (T-223-3).
   *
   * `proof-route-policy.mjs` macht es an derselben Grenze richtig: erst
   * nachweisen, daß die Oberfläche den Vermerk liest, dann nachweisen, daß er
   * anderswo fehlt. Diese eine Antwort trägt den Vermerk mit Absicht und wird
   * deshalb **nicht** in `seenBodies` eingetragen.
   */
  const vermerkImBestand = await call(`/todos/${todoId}/note`, { token: secret, sammeln: false });
  check(
    'der Vermerk steht im Bestand und ist über die reguläre Route lesbar (A-A-57)',
    vermerkImBestand.status === 200 && vermerkImBestand.text.includes(VERMERK),
    `Status ${vermerkImBestand.status}: ${vermerkImBestand.text.slice(0, 200)}`,
  );

  for (const [startedAt, endedAt, note] of [
    ['2026-01-15T08:00:00Z', '2026-01-15T08:10:00Z', 'Rückruf entgegengenommen'],
    ['2026-01-15T09:00:00Z', '2026-01-15T09:20:00Z', 'Analyse gemacht'],
    ['2026-01-15T10:00:00Z', '2026-01-15T10:05:00Z', 'Ticket geschlossen.'],
  ]) {
    const entry = await post('/time-entries', { todoId, startedAt, endedAt, note });
    check(`Buchung ${startedAt} angelegt`, entry.status === 201, `Status ${entry.status}: ${entry.text.slice(0, 200)}`);
  }

  /** Ein zweites Todo **ohne** Call-Nummer — für die Bedingung `is_set`. */
  const ohneCall = await post('/todos', { title: 'Ohne Call', tagIds: [], note: '' });
  const ohneCallId = ohneCall.body?.data?.todo?.id ?? ohneCall.body?.data?.id;
  await post('/time-entries', {
    todoId: ohneCallId,
    startedAt: '2026-01-16T08:00:00Z',
    endedAt: '2026-01-16T08:30:00Z',
    note: 'Etwas getan',
  });

  // -------------------------------------------------------------------------
  section('4  POST /export/preview nimmt eine Definition entgegen (E-051)');
  // -------------------------------------------------------------------------

  const stored = await post('/export/preview', { templateId: null, timeEntryIds: [] });
  check('die Vorschau auf den gespeicherten Stand geht weiter (200)', stored.status === 200, stored.text.slice(0, 200));
  check(
    'sie sagt aus, welchen Stand sie zeigt: templateSource = stored',
    stored.body?.data?.templateSource === 'stored',
    JSON.stringify(stored.body?.data?.templateSource),
  );
  check(
    'und nennt Kennung und Namen der Vorlage',
    typeof stored.body?.data?.templateId === 'string' && typeof stored.body?.data?.templateName === 'string',
  );
  check(
    'die Standardvorlage erzeugt Call, Zeit, Notiz und WindowsUser (A-8.2 bis A-8.5)',
    Object.keys(stored.body?.data?.rows?.[0] ?? {}).join(',') === 'Call,Zeit,Notiz,WindowsUser',
    JSON.stringify(Object.keys(stored.body?.data?.rows?.[0] ?? {})),
  );

  const before = await stateOf();

  const entwurf = {
    version: 1,
    fields: [
      { name: 'Titel', source: 'todo.title', transformation: 'raw' },
      { name: 'Tag', source: 'group.day', transformation: 'raw' },
      { name: 'Viertelstunden', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
    ],
  };

  const draft = await post('/export/preview', { definition: entwurf, timeEntryIds: [] });
  check('eine ungespeicherte Definition wird gerendert (200)', draft.status === 200, draft.text.slice(0, 300));
  check(
    'die Antwort weist sie als Entwurf aus: templateSource = draft',
    draft.body?.data?.templateSource === 'draft',
    JSON.stringify(draft.body?.data?.templateSource),
  );
  check(
    'ohne Kennung und ohne Namen, weil es beides nicht gibt',
    draft.body?.data?.templateId === null && draft.body?.data?.templateName === null,
    JSON.stringify({ id: draft.body?.data?.templateId, name: draft.body?.data?.templateName }),
  );
  check(
    'die Zeilen tragen genau die Schlüssel des Entwurfs',
    Object.keys(draft.body?.data?.rows?.[0] ?? {}).join(',') === 'Titel,Tag,Viertelstunden',
    JSON.stringify(Object.keys(draft.body?.data?.rows?.[0] ?? {})),
  );
  check(
    '35 Minuten ergeben 0,75 — derselbe Renderer wie der Lauf (E-008, E-020, R-17)',
    (draft.body?.data?.rows ?? []).some((row) => row.Titel === 'Call 4711' && row.Viertelstunden === 0.75),
    JSON.stringify(draft.body?.data?.rows),
  );

  const after = await stateOf();
  check(
    'der Entwurf wird nicht gespeichert: gleich viele Vorlagen wie vorher',
    before.templates === after.templates && before.templates > 0,
    `${before.templates} → ${after.templates}`,
  );
  check(
    'und es entsteht kein Exportlauf',
    before.runs === after.runs && after.runs === 0,
    `${before.runs} → ${after.runs}`,
  );

  const stillOpen = listOf(await get('/time-entries')) ?? [];
  check(
    'keine Buchung wurde dabei markiert',
    stillOpen.length > 0 && stillOpen.every((entry) => entry.exportStatus === 'open'),
    JSON.stringify(stillOpen.map((entry) => entry.exportStatus)),
  );

  // -------------------------------------------------------------------------
  section('5  Die Prüfung ist dieselbe wie beim Speichern (E-051, Auflage)');
  // -------------------------------------------------------------------------

  /**
   * Neun Definitionen, die das Speichern ablehnt. Jede geht an **beide**
   * Routen; verglichen werden Status, Schlüssel, Satz und Feldangaben.
   *
   * Eine Vorschau, die eine Definition durchließe, die das Speichern abweist,
   * wäre schlimmer als gar keine — der Benutzer sähe ein Ergebnis und bekäme
   * es beim Speichern nicht.
   */
  const abgelehnt = [
    ['der interne Vermerk als Quelle', { version: 1, fields: [{ name: 'X', source: 'todo.note', transformation: 'raw' }] }],
    ['eine erfundene Quelle', { version: 1, fields: [{ name: 'X', source: 'todo.bogus', transformation: 'raw' }] }],
    ['eine Quelle mit Leerzeichen', { version: 1, fields: [{ name: 'X', source: ' todo.title ', transformation: 'raw' }] }],
    ['andere Schreibweise', { version: 1, fields: [{ name: 'X', source: 'Todo.Title', transformation: 'raw' }] }],
    ['unbekannte Fassung', { version: 2, fields: [{ name: 'X', source: 'todo.title', transformation: 'raw' }] }],
    ['leere Feldliste', { version: 1, fields: [] }],
    ['Feld ohne Namen', { version: 1, fields: [{ source: 'todo.title', transformation: 'raw' }] }],
    ['unbekannte Transformation', { version: 1, fields: [{ name: 'X', source: 'todo.title', transformation: 'rot13' }] }],
    [
      'gesperrte Quelle in der Bedingung',
      {
        version: 1,
        fields: [
          {
            name: 'X',
            source: 'todo.title',
            transformation: 'raw',
            condition: { source: 'todo.note', op: 'is_set' },
          },
        ],
      },
    ],
    ['gar kein Objekt', null],
    ['eine Liste statt eines Objekts', []],
  ];

  for (const [name, definition] of abgelehnt) {
    const save = await post('/export/templates', { name: `Abgelehnt — ${name}`, definition });
    const view = await post('/export/preview', { definition, timeEntryIds: [] });

    check(
      `${name}: Speichern und Vorschau antworten gleich`,
      save.status === view.status &&
        save.body?.error?.code === view.body?.error?.code &&
        save.body?.error?.message === view.body?.error?.message &&
        JSON.stringify(save.body?.error?.details ?? null) === JSON.stringify(view.body?.error?.details ?? null),
      `Speichern ${save.status} ${save.body?.error?.code} „${save.body?.error?.message}" / ` +
        `Vorschau ${view.status} ${view.body?.error?.code} „${view.body?.error?.message}"`,
    );
    check(`${name}: beide weisen ab (422)`, view.status === 422, `Status ${view.status}`);
  }

  const note = await post('/export/preview', {
    definition: { version: 1, fields: [{ name: 'X', source: 'todo.note', transformation: 'raw' }] },
    timeEntryIds: [],
  });
  check(
    'der Vermerk als Quelle ergibt export_source_forbidden',
    note.body?.error?.code === 'export_source_forbidden',
    JSON.stringify(note.body?.error),
  );
  check(
    'mit vorangestelltem „Feld 1: " — die Oberfläche ordnet daran zu (T-031)',
    typeof note.body?.error?.message === 'string' && note.body.error.message.startsWith('Feld 1: '),
    note.body?.error?.message,
  );

  // -------------------------------------------------------------------------
  section('6  Die Ränder: eindeutig oder abgewiesen');
  // -------------------------------------------------------------------------

  const templates = listOf(await get('/export/templates')) ?? [];
  const builtinId = templates.find((entry) => entry.isBuiltin)?.id;
  check(
    'die mitgelieferte Vorlage ist auffindbar',
    typeof builtinId === 'string',
    JSON.stringify(templates.map((entry) => entry.name)),
  );

  const beides = await post('/export/preview', {
    templateId: builtinId,
    definition: entwurf,
    timeEntryIds: [],
  });
  check(
    'Kennung und Definition zugleich werden abgewiesen (422)',
    beides.status === 422 && beides.body?.error?.code === 'validation_error',
    `Status ${beides.status}: ${beides.text.slice(0, 200)}`,
  );

  const leer = await post('/export/preview', { definition: null, timeEntryIds: [] });
  check(
    '„definition": null gilt als Entwurf und wird abgewiesen, nicht stillschweigend ersetzt',
    leer.status === 422 && leer.body?.error?.code === 'export_template_invalid',
    `Status ${leer.status}: ${leer.text.slice(0, 200)}`,
  );

  const lauf = await post('/export/runs', { definition: entwurf, timeEntryIds: [] });
  check(
    'ein Exportlauf nimmt keine Definition entgegen (422)',
    lauf.status === 422 && lauf.body?.error?.code === 'validation_error',
    `Status ${lauf.status}: ${lauf.text.slice(0, 200)}`,
  );
  const nachLauf = await stateOf();
  check('und hat dabei nichts geschrieben', nachLauf.runs === 0, `${nachLauf.runs} Läufe`);

  const ohneAlles = await post('/export/preview', {});
  check(
    'ein leerer Rumpf zeigt weiterhin die aktive Vorlage (200, stored)',
    ohneAlles.status === 200 && ohneAlles.body?.data?.templateSource === 'stored',
    `Status ${ohneAlles.status}: ${ohneAlles.text.slice(0, 200)}`,
  );

  // -------------------------------------------------------------------------
  section('7  Verhalten, das so bleiben sollte (T-031, gemessen)');
  // -------------------------------------------------------------------------

  const bedingt = await post('/export/preview', {
    definition: {
      version: 1,
      fields: [
        { name: 'Titel', source: 'todo.title', transformation: 'raw' },
        {
          name: 'Call',
          source: 'todo.callNumber',
          transformation: 'raw',
          condition: { source: 'todo.callNumber', op: 'is_set' },
        },
      ],
    },
    timeEntryIds: [],
  });
  const mitCall = (bedingt.body?.data?.rows ?? []).find((row) => row.Titel === 'Call 4711');
  const ohneCallZeile = (bedingt.body?.data?.rows ?? []).find((row) => row.Titel === 'Ohne Call');
  check(
    'bei belegter Call-Nummer steht der Schlüssel da',
    mitCall !== undefined && mitCall.Call === 'TCK-000042',
    JSON.stringify(mitCall),
  );
  check(
    'bei fehlender Call-Nummer FEHLT der Schlüssel, statt leer zu sein',
    ohneCallZeile !== undefined && !Object.hasOwn(ohneCallZeile, 'Call'),
    JSON.stringify(ohneCallZeile),
  );

  // -------------------------------------------------------------------------
  section('8  Der Vermerk kommt in keiner dieser Antworten vor (A-7.2, R-06)');
  // -------------------------------------------------------------------------

  // A-A-57 — die Untergrenze der Menge, über die die nächste Zeile urteilt.
  // `some` über einer leeren Menge ist falsch, die Verneinung also wahr: Ohne
  // diese Zeile bestünde „weder in der Auswahlliste noch in einer Vorschau"
  // auch dann, wenn dieser Lauf gar nichts gefahren hätte.
  check(
    `die Menge ist die gefahrene: ${seenBodies.length} Antwortkörper, darunter die Auswahlliste und die Vorschau (A-A-57)`,
    seenBodies.length >= 2 &&
      seenBodies.includes(sources.text) &&
      seenBodies.includes(stored.text) &&
      stored.text.includes('"Notiz"'),
    `gesammelt: ${seenBodies.length}; Auswahlliste enthalten: ${seenBodies.includes(sources.text)}; Vorschau enthalten: ${seenBodies.includes(stored.text)}`,
  );
  check(
    'weder in der Auswahlliste noch in einer Vorschau',
    !seenBodies.some((text) => text.includes(VERMERK)),
  );

  /**
   * A-A-58 — die Untergrenze der Ausgabe, vor den beiden Zeilen darüber.
   *
   * `stdout` und `stderr` wurden bis T-223 aufgesammelt und nur durchsucht.
   * Gemessen mit zwei geleerten Sammlern: 69/0, Code 0, beide Zeilen grün
   * (T-223-4) — B-2.4 wäre in diesem Lauf eine Zusicherung ohne Gegenstand,
   * sobald der Dienst schweigt oder sein Protokoll künftig in eine Datei
   * schreibt.
   *
   * Die Untergrenze wird nicht geraten, sondern aus dem Lauf abgeleitet: Der
   * Dienst schreibt je beantworteter Anfrage eine JSON-Zeile. Vorher wird die
   * Ausgabe **eingeholt** — eine letzte Anfrage auf einen wiedererkennbaren,
   * nirgends registrierten Pfad, und gewartet, bis deren Protokollzeile
   * angekommen ist. Der Kanal ist der Reihe nach: Steht die letzte Zeile da,
   * stehen alle früheren da.
   */
  const MARKE = 'a-a-58-marke';
  await get(`/${MARKE}`);
  for (let versuch = 0; versuch < 60; versuch += 1) {
    if (`${stdout}\n${stderr}`.includes(MARKE)) break;
    await sleep(50);
  }
  const ausgabe = `${stdout}\n${stderr}`;
  const protokollzeilen = ausgabe
    .split('\n')
    .filter((line) => line.includes('"method":') && line.includes('"path":'));
  check(
    `die Ausgabe des Dienstes ist angekommen — ${ausgabe.length} Zeichen, ${protokollzeilen.length} Protokollzeilen zu ${beantworteteAnfragen} beantworteten Anfragen (A-A-58)`,
    ausgabe.includes(`Takt lauscht auf 127.0.0.1:${PORT}`) &&
      protokollzeilen.length >= beantworteteAnfragen &&
      protokollzeilen.some((line) => line.includes('/api/v1/export/sources')) &&
      protokollzeilen.some((line) => line.includes(`/api/v1/${MARKE}`)),
    `Länge ${ausgabe.length}, Protokollzeilen ${protokollzeilen.length}, beantwortete Anfragen ${beantworteteAnfragen}`,
  );
  check(
    'auch nicht in der Ausgabe des Dienstes',
    !ausgabe.includes(VERMERK),
  );
  check(
    'und kein Token steht in der Protokollausgabe (B-2.4)',
    !/takt_[A-Za-z0-9_-]{43}/.test(ausgabe),
  );
} finally {
  child.kill('SIGTERM');
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
