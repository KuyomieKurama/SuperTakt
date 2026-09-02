/**
 * Takt — Nachweis, dass ein neuer Tagname beim Anlegen eines Todos **ein** Tag
 * ergibt und nicht zwei (T-058).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:tags
 *
 * ===========================================================================
 * Was hier gemessen wird und warum es gemessen und nicht behauptet wird
 * ===========================================================================
 *
 * Der Auftrag lautete wörtlich: „Dabei müssen Race Conditions und doppelte Tags
 * berücksichtigt werden." Eine Zusicherung über einen Wettlauf lässt sich nicht
 * durch Hinsehen prüfen. Ein Prüffall, der zwei Anfragen **nacheinander**
 * schickt, ist grün und sagt nichts: Der Fehler, um den es geht, entsteht
 * genau dann, wenn beide gleichzeitig unterwegs sind.
 *
 * Deshalb fährt dieser Lauf den echten Sidecar als Kindprozess gegen eine echte
 * migrierte Datenbank und schickt **acht gleichzeitige** Anfragen mit demselben
 * neuen Tagnamen in acht Schreibweisen. Danach muss gelten:
 *
 *   genau ein Tag,  acht Todos,  jedes an diesem einen Tag,
 *   und genau eine der acht Antworten meldet, es angelegt zu haben.
 *
 * Dazu vier Zusicherungen, die dieselbe Regel von anderen Seiten treffen:
 *
 *  - **Kein Tag ohne sein Todo.** Scheitert das Anlegen des Todos, ist auch das
 *    eben angelegte Tag wieder weg. Das ist die achte Stelle aus T-047 — ein
 *    Fehlschlag als Wert löst kein Zurückrollen aus, deshalb bricht
 *    `resolveTagNames` mit einem Wurf ab —, und sie wird hier ausgelöst statt
 *    begutachtet.
 *  - **Die Faltung der Migration ist die Faltung der Domäne.** SQLite kennt
 *    keine Unicode-Faltung; `0008_tag_name_key.up.sql` bildet die aufgezählte
 *    Faltung aus `packages/domain/src/tag-name.ts` Zeichen für Zeichen nach.
 *    Abschnitt 1 hält beide über 30 Namen gegeneinander. Laufen sie
 *    auseinander, erzwingt die Datenbank eine andere Regel als die Anwendung
 *    prüft — und genau dort entstünde das doppelte Tag.
 *  - **Der Index trägt, nicht die Prüfung davor.** Abschnitt 2 fügt am Adapter
 *    vorbei ein zweites Tag mit demselben Schlüssel ein und erwartet eine
 *    Abweisung.
 *  - **Mehrdeutigkeit wird gefragt, nicht geraten.** Denselben Namen in zwei
 *    Ordnern löst der Dienst nicht auf den ersten Treffer auf.
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
import { DatabaseSync } from 'node:sqlite';

/**
 * Die Faltung der Domäne — **eingebunden, nicht abgeschrieben**.
 *
 * Der ganze Zweck von Abschnitt 1 ist der Vergleich zweier Fassungen. Eine
 * dritte hier im Prüfpfad wäre genau die Sorte Grün, gegen die er geschrieben
 * ist.
 */
const { normalizeTagName, tagNameKey } = await import('@takt/domain');
const { loadMigrations } = await import('@takt/storage');

const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(HERE, '..', 'src', 'index.ts');
const MIGRATIONS = join(HERE, '..', '..', '..', 'packages', 'storage', 'migrations');
const PORT = 17843;

/** Die Herkunft der Oberfläche im Entwicklungsbetrieb (config.ts). */
const UI_ORIGIN = 'http://127.0.0.1:5173';

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

async function waitForPortFree(port, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  do {
    if (await portFree(port)) return true;
    await sleep(150);
  } while (Date.now() < until);
  return false;
}

function call(path, { method = 'GET', token, origin = UI_ORIGIN, body } = {}) {
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

// ===========================================================================
section('1  Die Faltung der Migration ist die Faltung der Domäne');
// ===========================================================================
//
// Der Bestand wird **vor** 0008 angelegt und die Migration darüber gefahren.
// Damit misst dieser Abschnitt den Text der Migrationsdatei und nicht eine
// Nachbildung davon.

/**
 * Namen, die die Regel an ihren Kanten treffen.
 *
 * Paarweise verschieden im Schlüssel — die Zusammenführung bestehender
 * Doppelter prüft Abschnitt 2 gesondert, hier stünde sie im Weg.
 */
const NAMES = [
  'Backend',
  'FRONTEND',
  'datenbank',
  'Änderung',
  'ÜBERSTUNDE',
  'Öffnungszeit',
  'Straße',
  'Strasse',
  'Café',
  'RÉSUMÉ',
  'ÀÈÌÒÙ',
  'ÝÞ',
  'Ç-Kunde',
  'Ñ',
  '  führende Leerzeichen',
  'nachfolgende Leerzeichen   ',
  'doppelte    Leerzeichen',
  'Tabulator\tdazwischen',
  'Zeilen\numbruch',
  'geschütztes Leerzeichen',
  'schmales Leerzeichen',
  'Ideogramm　Leerzeichen',
  'ẞ-GROSS',
  'ArtikelNr 4711',
  'a-b_c.d',
  'Øresund',
  'ökonomie',
  'x'.repeat(200),
  'Mit (Klammern)',
  'Und & Zeichen',
];

{
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');

  const migrations = loadMigrations(MIGRATIONS);
  const upTo = (version) => {
    for (const migration of migrations) {
      if (migration.version > version) continue;
      db.exec('BEGIN;');
      db.exec(migration.up);
      db.exec('COMMIT;');
    }
  };
  const only = (version) => {
    const migration = migrations.find((entry) => entry.version === version);
    db.exec('BEGIN;');
    db.exec(migration.up);
    db.exec('COMMIT;');
    return migration;
  };

  check('es gibt eine Migration 0008', migrations.some((entry) => entry.version === 8));
  check(
    'sie hat einen Rückweg',
    (migrations.find((entry) => entry.version === 8)?.down ?? '').includes('DROP COLUMN'),
  );

  upTo(7);

  const insert = db.prepare(
    'INSERT INTO tag (id, folder_id, name, color, created_at, updated_at) VALUES (?, NULL, ?, NULL, ?, ?)',
  );
  NAMES.forEach((name, index) => {
    const stamp = `2026-01-01T00:00:${String(index).padStart(2, '0')}Z`;
    insert.run(`fixture-${String(index)}`, name, stamp, stamp);
  });

  only(8);

  const rows = db.prepare('SELECT id, name, name_key FROM tag ORDER BY created_at').all();

  const keyMismatch = [];
  const nameMismatch = [];
  rows.forEach((row, index) => {
    const original = NAMES[index];
    if (row.name_key !== tagNameKey(original)) {
      keyMismatch.push(`${JSON.stringify(original)}: SQL ${JSON.stringify(row.name_key)} gegen Domäne ${JSON.stringify(tagNameKey(original))}`);
    }
    if (row.name !== normalizeTagName(original)) {
      nameMismatch.push(`${JSON.stringify(original)}: SQL ${JSON.stringify(row.name)} gegen Domäne ${JSON.stringify(normalizeTagName(original))}`);
    }
  });

  check(
    `die Migration errechnet für alle ${String(NAMES.length)} Namen denselben Schlüssel wie die Domäne`,
    keyMismatch.length === 0,
    keyMismatch.slice(0, 3).join(' | '),
  );
  check(
    'und dieselbe Anzeigeform',
    nameMismatch.length === 0,
    nameMismatch.slice(0, 3).join(' | '),
  );

  // Die Regel, die der Auftraggeber hören will, an ihren beiden Enden.
  check(
    '„Backend“ und „backend“ und „ Backend “ haben denselben Schlüssel',
    tagNameKey('Backend') === tagNameKey('backend') &&
      tagNameKey('backend') === tagNameKey(' Backend '),
    `${tagNameKey('Backend')} / ${tagNameKey('backend')} / ${tagNameKey(' Backend ')}`,
  );
  check(
    '„Änderung“ und „änderung“ auch — die Faltung endet nicht bei Z',
    tagNameKey('Änderung') === tagNameKey('änderung'),
  );
  check(
    '„Straße“ und „Strasse“ dagegen nicht — es wird nicht umgeschrieben',
    tagNameKey('Straße') !== tagNameKey('Strasse'),
  );

  // -------------------------------------------------------------------------
  section('2  Der eindeutige Index trägt, nicht die Prüfung davor');
  // -------------------------------------------------------------------------

  let rejected = null;
  try {
    db.prepare(
      'INSERT INTO tag (id, folder_id, name, name_key, color, created_at, updated_at) VALUES (?, NULL, ?, ?, NULL, ?, ?)',
    ).run('fixture-dup', 'BACKEND', tagNameKey('BACKEND'), '2026-01-02T00:00:00Z', '2026-01-02T00:00:00Z');
  } catch (error) {
    rejected = error.message;
  }
  check(
    'ein zweites Tag mit demselben Schlüssel wird abgewiesen — am Adapter vorbei',
    rejected !== null && rejected.includes('ux_tag_name_key'),
    rejected ?? 'durchgekommen',
  );

  let unfolded = null;
  try {
    db.prepare(
      'INSERT INTO tag (id, folder_id, name, name_key, color, created_at, updated_at) VALUES (?, NULL, ?, ?, NULL, ?, ?)',
    ).run('fixture-raw', 'Neuling', 'Neuling', '2026-01-02T00:00:00Z', '2026-01-02T00:00:00Z');
  } catch (error) {
    unfolded = error.message;
  }
  check(
    'ein Schlüssel, der wie ein Name aussieht, wird abgewiesen',
    unfolded !== null && unfolded.includes('tag_name_key_invalid'),
    unfolded ?? 'durchgekommen',
  );

  db.close();
}

// ---------------------------------------------------------------------------
{
  section('3  Bestehende Doppelte brechen die Migration nicht ab');
  // -------------------------------------------------------------------------
  //
  // Ein Bestand von vor 0008 kann „ backend“ und „Backend“ nebeneinander
  // führen — `ux_tag_name` aus 0001 lässt das durch. Unter dem neuen Schlüssel
  // sind das zwei gleiche. Ohne Behandlung bräche die Migration hier ab.

  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  const migrations = loadMigrations(MIGRATIONS);
  for (const migration of migrations) {
    if (migration.version > 7) continue;
    db.exec('BEGIN;');
    db.exec(migration.up);
    db.exec('COMMIT;');
  }

  const insert = db.prepare(
    'INSERT INTO tag (id, folder_id, name, color, created_at, updated_at) VALUES (?, NULL, ?, NULL, ?, ?)',
  );
  insert.run('d1', 'Backend', '2026-01-01T00:00:01Z', '2026-01-01T00:00:01Z');
  insert.run('d2', ' backend ', '2026-01-01T00:00:02Z', '2026-01-01T00:00:02Z');
  insert.run('d3', 'back  end', '2026-01-01T00:00:03Z', '2026-01-01T00:00:03Z');
  insert.run('d4', 'back end', '2026-01-01T00:00:04Z', '2026-01-01T00:00:04Z');
  insert.run('d5', 'Änderung', '2026-01-01T00:00:05Z', '2026-01-01T00:00:05Z');
  insert.run('d6', 'änderung', '2026-01-01T00:00:06Z', '2026-01-01T00:00:06Z');

  let broke = null;
  try {
    const eight = migrations.find((entry) => entry.version === 8);
    db.exec('BEGIN;');
    db.exec(eight.up);
    db.exec('COMMIT;');
  } catch (error) {
    broke = error.message;
    try {
      db.exec('ROLLBACK;');
    } catch {
      /* schon beendet */
    }
  }

  check('die Migration läuft trotz bestehender Doppelter durch', broke === null, broke ?? '');

  if (broke === null) {
    const after = db.prepare('SELECT id, name, name_key FROM tag ORDER BY created_at').all();
    check(
      'das zuerst angelegte Tag behält seinen Namen',
      after.find((row) => row.id === 'd1')?.name === 'Backend',
      JSON.stringify(after.find((row) => row.id === 'd1')),
    );
    check(
      'das zweite bekommt ein sichtbares „ (2)“ statt zu verschwinden',
      after.find((row) => row.id === 'd2')?.name === 'backend (2)',
      JSON.stringify(after.find((row) => row.id === 'd2')),
    );
    check(
      'kein Tag geht verloren',
      after.length === 6,
      `${String(after.length)} statt 6`,
    );
    check(
      'alle Schlüssel sind danach paarweise verschieden',
      new Set(after.map((row) => row.name_key)).size === after.length,
    );

    // Rückweg auf demselben Bestand.
    let backwards = null;
    try {
      const eight = migrations.find((entry) => entry.version === 8);
      db.exec('BEGIN;');
      db.exec(eight.down);
      db.exec('COMMIT;');
    } catch (error) {
      backwards = error.message;
    }
    check('und die Rückwärtsrichtung läuft ebenfalls durch', backwards === null, backwards ?? '');
    check(
      'danach gibt es die Spalte nicht mehr',
      db
        .prepare("SELECT name FROM pragma_table_info('tag')")
        .all()
        .every((row) => row.name !== 'name_key'),
    );
  }

  db.close();
}

// ===========================================================================
// Der Dienst
// ===========================================================================

if (!(await waitForPortFree(PORT))) {
  console.error(
    `FEHLER: Auf 127.0.0.1:${PORT} lauscht bereits etwas, auch nach 5 s Warten. ` +
      'Läuft Takt oder ein anderer Prüfpfad noch?',
  );
  process.exit(1);
}

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-tags-'));
const secret = `takt_${randomBytes(32).toString('base64url')}`;

const child = spawn(process.execPath, [ENTRY], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, XDG_DATA_HOME: dataDir },
});
const childExit = new Promise((resolve) => child.once('exit', (code) => resolve(code)));
let stderr = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});
child.stdout.setEncoding('utf8');
child.stdout.on('data', () => {
  /* verworfen */
});

child.stdin.write(`${secret}\nt.beispiel\n`);

async function waitForService() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const health = await call('/health', { token: secret });
    if (health.status !== 0) return true;
    await sleep(100);
  }
  return false;
}

const get = (path) => call(path, { token: secret });
const post = (path, body) => call(path, { method: 'POST', token: secret, body });

/** Alle Tags des Bestands, flach — aus dem Baum, den A-10.4 in einem Zug liefert. */
async function allTags() {
  const tree = (await get('/tag-tree')).body?.data ?? {};
  const out = [...(tree.rootTags ?? [])];
  const walk = (nodes) => {
    for (const node of nodes ?? []) {
      out.push(...(node.tags ?? []));
      walk(node.subfolders);
    }
  };
  walk(tree.rootFolders);
  return out;
}

/** Wie viele Tags tragen diesen Vergleichsschlüssel? Die Frage des ganzen Laufs. */
const countWithKey = (tags, key) => tags.filter((tag) => tagNameKey(tag.name) === key).length;

try {
  const up = await waitForService();
  check('der Dienst kommt hoch', up, stderr.slice(-400));
  if (!up) throw new Error('Dienst nicht erreichbar');

  // -------------------------------------------------------------------------
  section('4  Acht gleichzeitige Anfragen, ein Tag');
  // -------------------------------------------------------------------------
  //
  // Acht Schreibweisen desselben Namens, alle zugleich unterwegs. Nichts davon
  // wird zwischendurch abgewartet — das ist der Punkt.

  const SPELLINGS = [
    'backend',
    'Backend',
    'BACKEND',
    ' backend',
    'backend ',
    '  Backend  ',
    'bAcKeNd',
    'backend\t',
  ];

  const responses = await Promise.all(
    SPELLINGS.map((spelling, index) =>
      post('/todos', { title: `Gleichzeitig ${String(index)}`, tagNames: [spelling] }),
    ),
  );

  check(
    'alle acht Anfragen werden angenommen',
    responses.every((response) => response.status === 201),
    responses.map((response) => response.status).join(','),
  );

  const tagsAfter = await allTags();
  check(
    'danach gibt es **genau ein** Tag mit diesem Schlüssel',
    countWithKey(tagsAfter, 'backend') === 1,
    `${String(countWithKey(tagsAfter, 'backend'))} gefunden: ${JSON.stringify(
      tagsAfter.filter((tag) => tagNameKey(tag.name) === 'backend').map((tag) => tag.name),
    )}`,
  );

  const theTag = tagsAfter.find((tag) => tagNameKey(tag.name) === 'backend');
  check(
    'alle acht Todos hängen an genau diesem Tag',
    theTag !== undefined &&
      responses.every((response) => (response.body?.data?.todo?.tagIds ?? []).includes(theTag.id)),
    JSON.stringify(responses.map((response) => response.body?.data?.todo?.tagIds)),
  );

  const creators = responses.filter(
    (response) => (response.body?.data?.createdTags ?? []).length > 0,
  );
  check(
    'genau eine Antwort meldet, das Tag angelegt zu haben',
    creators.length === 1,
    `${String(creators.length)} Antworten mit createdTags`,
  );
  check(
    'die übrigen sieben melden nichts Neues',
    responses.length - creators.length === 7,
  );

  const todosOnTag = (await get(`/todos?tagId=${theTag?.id ?? 'x'}&limit=50`)).body?.data;
  check(
    'die Liste zu diesem Tag führt alle acht Todos',
    (todosOnTag?.items ?? []).length === 8,
    `${String((todosOnTag?.items ?? []).length)} statt 8`,
  );

  // -------------------------------------------------------------------------
  section('5  Kein Tag ohne sein Todo — die achte Stelle aus T-047');
  // -------------------------------------------------------------------------
  //
  // Das Tag wird angelegt, dann scheitert das Todo an einer Kanban-Spalte, die
  // es nicht gibt. Ohne gemeinsame Transaktion bliebe das Tag stehen: ein
  // Vokabular, das niemand bestellt hat, und beim nächsten Versuch ein Treffer,
  // der aus einem Fehlschlag stammt.

  const beforeFailure = (await allTags()).length;
  const doomed = await post('/todos', {
    title: 'Scheitert absichtlich',
    statusId: 'gibt-es-nicht',
    tagNames: ['rücklauf'],
  });
  check(
    'die Anfrage scheitert',
    doomed.status >= 400,
    `Status ${String(doomed.status)}`,
  );

  const afterFailure = await allTags();
  check(
    'das Tag der gescheiterten Anfrage gibt es nicht',
    countWithKey(afterFailure, 'rücklauf') === 0,
    JSON.stringify(afterFailure.map((tag) => tag.name)),
  );
  check(
    'und es ist überhaupt kein Tag hinzugekommen',
    afterFailure.length === beforeFailure,
    `${String(beforeFailure)} vorher, ${String(afterFailure.length)} nachher`,
  );

  // -------------------------------------------------------------------------
  section('6  Zwei Schreibweisen in **einer** Anfrage sind ein Tag');
  // -------------------------------------------------------------------------

  const twice = await post('/todos', {
    title: 'Zweimal derselbe Name',
    tagNames: ['Auswertung', 'auswertung', ' AUSWERTUNG '],
  });
  check('die Anfrage wird angenommen', twice.status === 201, twice.text.slice(0, 200));
  check(
    'sie legt ein Tag an und nicht drei',
    (twice.body?.data?.createdTags ?? []).length === 1,
    JSON.stringify(twice.body?.data?.createdTags),
  );
  check(
    'das Todo trägt genau ein Tag',
    (twice.body?.data?.todo?.tagIds ?? []).length === 1,
    JSON.stringify(twice.body?.data?.todo?.tagIds),
  );
  check(
    'gespeichert wird die zuerst genannte Schreibweise',
    twice.body?.data?.createdTags?.[0]?.name === 'Auswertung',
    JSON.stringify(twice.body?.data?.createdTags?.[0]?.name),
  );

  // -------------------------------------------------------------------------
  section('7  Ein vorhandenes Tag wird gefunden, nicht verdoppelt');
  // -------------------------------------------------------------------------

  const existing = await post('/tags', { name: 'Wartung' });
  check('ein Tag lässt sich wie bisher anlegen', existing.status === 201, existing.text.slice(0, 200));

  const reused = await post('/todos', { title: 'Trifft ein vorhandenes Tag', tagNames: ['WARTUNG'] });
  check('die Anfrage wird angenommen', reused.status === 201, reused.text.slice(0, 200));
  check(
    'sie legt nichts an',
    (reused.body?.data?.createdTags ?? []).length === 0,
    JSON.stringify(reused.body?.data?.createdTags),
  );
  check(
    'und hängt das Todo an das vorhandene Tag',
    (reused.body?.data?.todo?.tagIds ?? []).includes(existing.body?.data?.id),
    JSON.stringify(reused.body?.data?.todo?.tagIds),
  );
  check(
    'der Name des Tags bleibt, wie er angelegt wurde',
    (await allTags()).find((tag) => tag.id === existing.body?.data?.id)?.name === 'Wartung',
  );

  // -------------------------------------------------------------------------
  section('8  Derselbe Name in zwei Ordnern wird gefragt, nicht geraten');
  // -------------------------------------------------------------------------

  const folderA = await post('/tag-folders', { name: 'Kunde A' });
  const folderB = await post('/tag-folders', { name: 'Kunde B' });
  const inA = await post('/tags', { name: 'Abnahme', folderId: folderA.body?.data?.id });
  const inB = await post('/tags', { name: 'Abnahme', folderId: folderB.body?.data?.id });
  check(
    'derselbe Tagname in zwei Ordnern ist weiterhin zulässig (A-4.2)',
    inA.status === 201 && inB.status === 201,
    `${String(inA.status)} / ${String(inB.status)}`,
  );

  const ambiguous = await post('/todos', { title: 'Mehrdeutig', tagNames: ['abnahme'] });
  check(
    'ein mehrdeutiger Name wird mit 422 abgewiesen',
    ambiguous.status === 422,
    `Status ${String(ambiguous.status)}: ${ambiguous.text.slice(0, 200)}`,
  );
  check(
    'und die Antwort sagt maschinenlesbar, warum',
    (ambiguous.body?.error?.details ?? []).some((entry) => entry.code === 'tag_name_ambiguous'),
    JSON.stringify(ambiguous.body?.error),
  );
  check(
    'das Todo entsteht dabei nicht',
    ((await get('/todos?search=Mehrdeutig')).body?.data?.items ?? []).length === 0,
  );

  // -------------------------------------------------------------------------
  section('9  Was der Nachweis nicht misst, steht als Prüfung da');
  // -------------------------------------------------------------------------

  const tooMany = await post('/todos', {
    title: 'Zu viele Namen',
    tagNames: Array.from({ length: 51 }, (_, index) => `t${String(index)}`),
  });
  check('mehr als fünfzig Namen werden abgewiesen', tooMany.status === 422, `Status ${String(tooMany.status)}`);

  const blank = await post('/todos', { title: 'Leerer Name', tagNames: ['   '] });
  check('ein Name aus lauter Leerzeichen wird abgewiesen', blank.status === 422, `Status ${String(blank.status)}`);

  const untouched = await post('/todos', { title: 'Ohne Tagnamen' });
  check(
    'ohne `tagNames` ändert sich am bisherigen Verhalten nichts',
    untouched.status === 201 && (untouched.body?.data?.createdTags ?? []).length === 0,
    untouched.text.slice(0, 200),
  );
} finally {
  child.kill('SIGTERM');
  await Promise.race([childExit, sleep(3000)]);
  if (child.exitCode === null) child.kill('SIGKILL');
  await rm(dataDir, { recursive: true, force: true });
}

console.log(`\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen`);
if (failed > 0) {
  console.log('\nFehlgeschlagen:');
  for (const name of failures) console.log(`  - ${name}`);
  process.exit(1);
}
