/**
 * Takt — Nachweis, dass eine Regel der Datenbank nie als 500 beim Benutzer
 * ankommt (T-074).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:conflicts
 *
 * ===========================================================================
 * Wogegen
 * ===========================================================================
 *
 * Der frontend-dev hat in T-072 gemessen: `POST /pools` mit einem bereits
 * vergebenen Namen antwortete `500 internal_error`. Der eindeutige Index
 * `ux_pool_name` schlug durch, der Anwendungsfall fing ihn nicht, und die
 * Fehlerbehandlung am Rand machte daraus „Ein unerwarteter Fehler ist
 * aufgetreten“.
 *
 * Der Unterschied ist nicht kosmetisch. Ein 500 sagt „bei mir ist etwas
 * kaputt“; die Oberfläche zeigt daraufhin eine Störungsmeldung und rät zum
 * erneuten Versuch, der genauso scheitert. Ein 409 sagt „das geht so nicht“ —
 * und die Oberfläche kann sagen, dass der Name vergeben ist.
 *
 * Seit E-054 ist der Fall häufig: Pools und Kanban-Spalten sind **dieselbe**
 * Entität. Wer eine Spalte anlegt, deren Name schon als Pool existiert, läuft
 * genau hinein.
 *
 * ===========================================================================
 * Was hier gemessen wird, und warum in fünf Abschnitten
 * ===========================================================================
 *
 * **1 — Jeder eindeutige Index des Schemas kommt in der Übersetzung an.**
 * Nicht „die Liste sieht vollständig aus“, sondern: Die Liste der eindeutigen
 * Indizes wird aus `sqlite_master` einer **migrierten** Datenbank gelesen, jede
 * Verletzung wird ausgelöst, und `translateSqliteError` muss einen eigenen Satz
 * dafür haben. Ein neuer Index ohne Eintrag wird damit rot, statt eines Tages
 * als „Dieser Wert ist bereits vergeben“ bei einem Benutzer aufzutauchen.
 *
 * Dieser Abschnitt hat einen konkreten Anlass: Bis T-074 stand in `errors.ts`
 * je Eintrag der **Indexname** als Suchbegriff. SQLite nennt den aber nur bei
 * einem Index über einen Ausdruck oder mit WHERE-Bedingung; bei einem Index
 * über nackte Spalten nennt es die Spalten. Sieben der zwölf Einträge waren
 * damit unerreichbar — darunter `ux_pool_name` und `ux_todo_status_name`, die
 * beide einen genaueren Satz trugen, den nie jemand zu lesen bekam.
 *
 * **2 — Der Dienst antwortet auf jede dieser Verletzungen mit 4xx.** Gegen den
 * echten Sidecar, über die echten Routen. Das ist die Messung, die T-072
 * gemacht hat, jetzt als Prüflauf.
 *
 * **3 — Nichts bleibt halb angelegt.** Eine abgewiesene Anlage darf keine
 * Zeile hinterlassen. Gezählt wird vorher und nachher.
 *
 * **4 — „Derselbe Name“ heißt bei einer Regel dasselbe wie bei einem Tag.**
 * `ux_pool_name` vergleicht mit `COLLATE NOCASE` und deckt A–Z ab; die Domäne
 * deckt NFC, Leerraum und den lateinischen Ergänzungsblock ab. Der Abschnitt
 * misst beides an denselben Paaren, die `proof:tags` für Tags misst.
 *
 * **5 — Eine Regel, die nur in der Oberfläche steht, ist keine Regel.** Befund
 * aus T-073: `apps/web` sperrte das Löschen des Standard-Status, der Dienst
 * ließ es durch, und `defaultStatus()` fiel danach **still** auf den ersten
 * nach Position. Der Abschnitt fährt die Routen unmittelbar an, so wie es ein
 * zweiter Aufrufer täte — und misst auch die Gegenprobe: Weitergeben muss
 * weiterhin gehen, sonst ist die Sperre eine Sackgasse.
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

const { nameKey } = await import('@takt/domain');
const { UNIQUE_INDEX_CATALOG, loadMigrations, translateSqliteError } = await import('@takt/storage');

const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(HERE, '..', 'src', 'index.ts');
const MIGRATIONS = join(HERE, '..', '..', '..', 'packages', 'storage', 'migrations');
const PORT = 17843;

/** Die Herkunft der Oberfläche im Entwicklungsbetrieb (config.ts). */
const UI_ORIGIN = 'http://127.0.0.1:5173';

/**
 * Der Satz, den `errors.ts` sagt, wenn es einen eindeutigen Index **nicht**
 * kennt. Er ist richtig und verrät nichts — aber er ist auch die Antwort, die
 * dieser Lauf für jeden Index des Schemas ausschließt.
 */
const GENERIC_UNIQUE = 'Dieser Wert ist bereits vergeben.';

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
section('1  Jeder eindeutige Index des Schemas hat einen eigenen Satz');
// ===========================================================================
//
// Die Datenbank wird vollständig migriert; die Liste der Indizes kommt aus ihr
// und nicht aus einer gepflegten Aufzählung in diesem Skript.

{
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const migration of loadMigrations(MIGRATIONS)) {
    db.exec('BEGIN;');
    db.exec(migration.up);
    db.exec('COMMIT;');
  }

  const inSchema = db
    .prepare(
      `SELECT name FROM sqlite_master
        WHERE type = 'index' AND sql IS NOT NULL AND sql LIKE 'CREATE UNIQUE%'
        ORDER BY name`,
    )
    .all()
    .map((row) => row.name);

  const mapped = UNIQUE_INDEX_CATALOG.map((entry) => entry.index).sort();

  check(
    `das Schema führt ${String(inSchema.length)} eindeutige Indizes`,
    inSchema.length > 0,
    inSchema.join(', '),
  );
  check(
    'für jeden gibt es einen Eintrag in errors.ts',
    inSchema.every((name) => mapped.includes(name)),
    `ohne Eintrag: ${inSchema.filter((name) => !mapped.includes(name)).join(', ')}`,
  );
  check(
    'und kein Eintrag zeigt auf einen Index, den es nicht gibt',
    mapped.every((name) => inSchema.includes(name)),
    `verwaist: ${mapped.filter((name) => !inSchema.includes(name)).join(', ')}`,
  );

  /*
   * Kein Indexname verschluckt einen anderen.
   *
   * `ux_tag_name` ist eine Teilzeichenkette von `ux_tag_name_key`. Ein
   * Zuordner, der blank nach Teilzeichenketten sucht, ordnet die Meldung des
   * einen dem Eintrag des anderen zu. Heute wäre das folgenlos — beide tragen
   * denselben Satz —, morgen nicht mehr. Gemessen wird deshalb, dass jeder
   * Indexname genau seinen eigenen Satz zurückbringt.
   */
  const asIndexMessage = (name) =>
    translateSqliteError({
      message: `UNIQUE constraint failed: index '${name}'`,
      code: 'ERR_SQLITE_ERROR',
    });

  const wrongEntry = [];
  for (const entry of UNIQUE_INDEX_CATALOG) {
    const answered = asIndexMessage(entry.index);
    if (answered.code !== entry.code || answered.message !== entry.message) {
      wrongEntry.push(`${entry.index} → „${answered.message}"`);
    }
  }
  check(
    'jeder Indexname bringt seinen eigenen Eintrag zurück, keinen benachbarten',
    wrongEntry.length === 0,
    wrongEntry.join(' | '),
  );

  /*
   * Die Gegenprobe zur Gegenprobe: Steckt ein Indexname in einem anderen? Wenn
   * ja, muss der Zuordner sie trotzdem auseinanderhalten — die Prüfung darüber
   * wäre sonst grün, ohne je auf die Probe gestellt worden zu sein.
   */
  const nested = mapped.filter((name) => mapped.some((other) => other !== name && other.includes(name)));
  check(
    `es gibt überhaupt einen Indexnamen, der in einem anderen steckt (${nested.join(', ') || 'keinen'})`,
    nested.length > 0,
    'ohne einen solchen Fall sagt die Prüfung darüber nichts',
  );

  // -------------------------------------------------------------------------
  // Bestand, gegen den die Verletzungen ausgelöst werden.
  //
  // Absichtlich am Adapter vorbei und mit festen Kennungen: Dieser Abschnitt
  // misst das Schema und die Übersetzung, nicht den Weg dorthin.
  // -------------------------------------------------------------------------
  const T = '2026-01-01T00:00:00Z';
  const run = (sql, ...params) => db.prepare(sql).run(...params);

  const statusId = db.prepare('SELECT id FROM todo_status ORDER BY position LIMIT 1').get().id;
  const statusName = db.prepare('SELECT name FROM todo_status WHERE id = ?').get(statusId).name;
  const statusPosition = db.prepare('SELECT position FROM todo_status WHERE id = ?').get(statusId).position;
  const templateName = db.prepare('SELECT name FROM export_template WHERE is_builtin = 1').get().name;
  const templateId = db.prepare('SELECT id FROM export_template WHERE is_builtin = 1').get().id;

  run(
    'INSERT INTO tag (id, folder_id, name, color, created_at, updated_at, name_key) VALUES (?, NULL, ?, NULL, ?, ?, ?)',
    'tag-a',
    'Alpha',
    T,
    T,
    nameKey('Alpha'),
  );
  run(
    'INSERT INTO tag (id, folder_id, name, color, created_at, updated_at, name_key) VALUES (?, NULL, ?, NULL, ?, ?, ?)',
    'tag-b',
    'Beta',
    T,
    T,
    nameKey('Beta'),
  );
  run('INSERT INTO tag_folder (id, parent_id, name, created_at, updated_at) VALUES (?, NULL, ?, ?, ?)', 'folder-a', 'Kunden', T, T);
  run(
    'INSERT INTO pool (id, name, match_mode, include_subfolders, position, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
    'pool-a',
    'Kunden Nord',
    'any',
    1,
    T,
    T,
  );
  run('INSERT INTO pool_rule (pool_id, tag_id, folder_id) VALUES (?, ?, NULL)', 'pool-a', 'tag-a');
  run(
    'INSERT INTO todo (id, title, call_number, status_id, completed_at, created_at, updated_at) VALUES (?, ?, NULL, ?, NULL, ?, ?)',
    'todo-a',
    'Ein Todo',
    statusId,
    T,
    T,
  );
  run(
    'INSERT INTO time_entry (id, todo_id, started_at, ended_at, note, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?)',
    'entry-running',
    'todo-a',
    T,
    '',
    T,
    T,
  );
  run('INSERT INTO default_tag (tag_id, position, created_at) VALUES (?, 1, ?)', 'tag-a', T);
  run(
    `INSERT INTO export_run (id, template_id, template_snapshot, file_path, file_sha256, byte_size,
                             entry_count, total_quarters, rounding_mode, windows_user, created_at)
     VALUES (?, ?, '{}', ?, ?, 1, 1, 1, 'up', 'proof', ?)`,
    'run-a',
    templateId,
    'C:/export/datei.csv',
    'a'.repeat(64),
    T,
  );
  run(
    'INSERT INTO export_run_group (id, export_run_id, todo_id, day, seconds, quarters) VALUES (?, ?, ?, ?, 900, 1)',
    'group-a',
    'run-a',
    'todo-a',
    '2026-01-01',
  );

  /**
   * Löst eine Verletzung aus und übersetzt sie.
   *
   * Übersetzt wird mit **derselben** Funktion, die der Dienst benutzt — nicht
   * mit einer Nachbildung. Eine Nachbildung wäre grün und sagte nichts.
   */
  function provoke(indexName, expectedCode, work) {
    let translated = null;
    let raw = '';
    try {
      work();
    } catch (error) {
      raw = String(error.message ?? '');
      try {
        translated = translateSqliteError(error);
      } catch {
        translated = null;
      }
    }

    check(
      `${indexName}: die Verletzung tritt ein`,
      translated !== null,
      raw === '' ? 'kein Wurf — die Vorbedingung stimmt nicht' : raw,
    );
    if (translated === null) return;

    check(
      `${indexName}: übersetzt zu ${expectedCode}`,
      translated.code === expectedCode,
      `${translated.code}: ${translated.message}`,
    );
    check(
      `${indexName}: mit einem eigenen Satz, nicht der allgemeinen Auskunft`,
      translated.message !== GENERIC_UNIQUE,
      translated.message,
    );
    check(
      `${indexName}: die Meldung von SQLite steht nicht in der Antwort (B-2.4)`,
      !translated.message.includes(indexName) && !translated.message.includes('constraint'),
      translated.message,
    );
  }

  provoke('ux_todo_status_name', 'name_conflict', () =>
    run(
      'INSERT INTO todo_status (id, name, position, is_default, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
      'status-dup-name',
      statusName.toUpperCase(),
      900,
      T,
      T,
    ),
  );

  provoke('ux_todo_status_position', 'conflict', () =>
    run(
      'INSERT INTO todo_status (id, name, position, is_default, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
      'status-dup-pos',
      'Ein neuer Status',
      statusPosition,
      T,
      T,
    ),
  );

  provoke('ux_todo_status_default', 'conflict', () =>
    run(
      'INSERT INTO todo_status (id, name, position, is_default, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
      'status-dup-default',
      'Noch ein Status',
      901,
      T,
      T,
    ),
  );

  provoke('ux_tag_folder_name', 'name_conflict', () =>
    run('INSERT INTO tag_folder (id, parent_id, name, created_at, updated_at) VALUES (?, NULL, ?, ?, ?)', 'folder-dup', 'KUNDEN', T, T),
  );

  // `ux_tag_name` lässt sich nur isoliert auslösen, wenn der Vergleichsschlüssel
  // **nicht** kollidiert — sonst schlägt `ux_tag_name_key` mit zu. Deshalb ein
  // Schlüssel, der zu keinem anderen passt; der Trigger aus 0008 verlangt nur,
  // dass er wie ein Schlüssel aussieht.
  provoke('ux_tag_name', 'name_conflict', () =>
    run(
      'INSERT INTO tag (id, folder_id, name, color, created_at, updated_at, name_key) VALUES (?, NULL, ?, NULL, ?, ?, ?)',
      'tag-dup-name',
      'ALPHA',
      T,
      T,
      'ein schluessel ohne zwilling',
    ),
  );

  // Umgekehrt: gleicher Schlüssel, unter NOCASE verschiedene Namen. „Änderung“
  // und „änderung“ sind für SQLite zwei Namen und für die Domäne einer.
  provoke('ux_tag_name_key', 'name_conflict', () => {
    run(
      'INSERT INTO tag (id, folder_id, name, color, created_at, updated_at, name_key) VALUES (?, NULL, ?, NULL, ?, ?, ?)',
      'tag-umlaut',
      'Änderung',
      T,
      T,
      nameKey('Änderung'),
    );
    run(
      'INSERT INTO tag (id, folder_id, name, color, created_at, updated_at, name_key) VALUES (?, NULL, ?, NULL, ?, ?, ?)',
      'tag-umlaut-2',
      'änderung',
      T,
      T,
      nameKey('änderung'),
    );
  });

  provoke('ux_pool_name', 'name_conflict', () =>
    run(
      'INSERT INTO pool (id, name, match_mode, include_subfolders, position, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
      'pool-dup-name',
      'KUNDEN NORD',
      'any',
      2,
      T,
      T,
    ),
  );

  provoke('ux_pool_position', 'conflict', () =>
    run(
      'INSERT INTO pool (id, name, match_mode, include_subfolders, position, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
      'pool-dup-pos',
      'Eine andere Regel',
      'any',
      1,
      T,
      T,
    ),
  );

  provoke('ux_pool_rule', 'validation_error', () =>
    run('INSERT INTO pool_rule (pool_id, tag_id, folder_id) VALUES (?, ?, NULL)', 'pool-a', 'tag-a'),
  );

  provoke('ux_time_entry_running', 'timer_already_running', () =>
    run(
      'INSERT INTO time_entry (id, todo_id, started_at, ended_at, note, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?)',
      'entry-second',
      'todo-a',
      T,
      '',
      T,
      T,
    ),
  );

  provoke('ux_export_template_name', 'name_conflict', () =>
    run(
      'INSERT INTO export_template (id, name, is_builtin, definition, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?)',
      'template-dup-name',
      templateName,
      '{}',
      T,
      T,
    ),
  );

  provoke('ux_export_template_builtin', 'conflict', () =>
    run(
      'INSERT INTO export_template (id, name, is_builtin, definition, created_at, updated_at) VALUES (?, ?, 1, ?, ?, ?)',
      'template-dup-builtin',
      'Eine zweite mitgelieferte',
      '{}',
      T,
      T,
    ),
  );

  provoke('ux_default_tag_position', 'conflict', () =>
    run('INSERT INTO default_tag (tag_id, position, created_at) VALUES (?, 1, ?)', 'tag-b', T),
  );

  provoke('ux_export_run_group', 'conflict', () =>
    run(
      'INSERT INTO export_run_group (id, export_run_id, todo_id, day, seconds, quarters) VALUES (?, ?, ?, ?, 900, 1)',
      'group-dup',
      'run-a',
      'todo-a',
      '2026-01-01',
    ),
  );

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

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-conflicts-'));
const secret = `takt_${randomBytes(32).toString('base64url')}`;

const child = spawn(process.execPath, [ENTRY], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, XDG_DATA_HOME: dataDir },
});
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

const get = (path) => call(path, { token: secret });
const post = (path, body) => call(path, { method: 'POST', token: secret, body });
const patch = (path, body) => call(path, { method: 'PATCH', token: secret, body });

/** Die Schlüssel, die eine Oberfläche unterscheiden kann. `internal_error` ist keiner. */
const READABLE = new Set([
  'name_conflict',
  'conflict',
  'validation_error',
  'not_found',
  'status_in_use',
  'last_status_column',
  'default_status_locked',
]);

/**
 * Eine Anfrage, die abgewiesen werden **muss** — und zwar lesbar.
 *
 * Drei Zusicherungen in einer: kein 500, ein Statuscode aus dem vereinbarten
 * Vorrat, und ein Schlüssel, gegen den eine Oberfläche verzweigen kann. Der
 * Schlüssel ist der Punkt: `internal_error` ist eine Antwort, mit der niemand
 * etwas anfangen kann.
 */
function rejects(name, response, expectedCode) {
  const code = response.body?.error?.code;
  check(
    `${name}: nicht 500`,
    response.status !== 500,
    `${String(response.status)} ${JSON.stringify(response.body)}`,
  );
  check(
    `${name}: ${expectedCode} (${String(expectedCode === 'validation_error' ? 422 : 409)})`,
    code === expectedCode,
    `${String(response.status)} ${String(code)}`,
  );
  check(
    `${name}: und der Statuscode passt zum Schlüssel`,
    response.status === (expectedCode === 'validation_error' ? 422 : 409),
    String(response.status),
  );
  check(`${name}: der Schlüssel ist lesbar`, READABLE.has(code), String(code));
}

try {
  let up = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const health = await get('/health');
    if (health.status === 200) {
      up = true;
      break;
    }
    await sleep(100);
  }
  check('der Dienst kommt hoch', up, stderr.slice(-400));
  if (!up) throw new Error('Dienst nicht erreichbar');

  // -------------------------------------------------------------------------
  section('2  Der Dienst antwortet auf jede Verletzung mit 4xx');
  // -------------------------------------------------------------------------

  const created = await post('/pools', { name: 'Kunden Nord' });
  check('eine Regel lässt sich anlegen', created.status === 201, JSON.stringify(created.body));
  const poolId = created.body?.data?.id;

  rejects('POST /pools, derselbe Name', await post('/pools', { name: 'Kunden Nord' }), 'name_conflict');
  rejects(
    'POST /pools, andere Groß- und Kleinschreibung',
    await post('/pools', { name: 'kunden nord' }),
    'name_conflict',
  );
  rejects(
    'POST /pools, Leerraum drumherum und dazwischen',
    await post('/pools', { name: ' Kunden   Nord ' }),
    'name_conflict',
  );

  // Der Name steht in der Meldung — das war die Bitte aus T-072. Ohne ihn liest
  // ein Benutzer „vergeben“ und weiß nicht, welcher der beiden Namen gemeint
  // ist, die er gerade getippt hat.
  const withName = await post('/pools', { name: 'Kunden Nord' });
  check(
    'die Meldung nennt den Namen',
    typeof withName.body?.error?.message === 'string' &&
      withName.body.error.message.includes('Kunden Nord'),
    String(withName.body?.error?.message),
  );

  const positioned = await post('/pools', { name: 'Mit Position', position: 42 });
  check('eine Regel mit fester Position lässt sich anlegen', positioned.status === 201);
  rejects(
    'POST /pools, dieselbe Position',
    await post('/pools', { name: 'Noch eine', position: 42 }),
    'conflict',
  );

  const tag = await post('/tags', { name: 'Beratung' });
  const tagId = tag.body?.data?.id;
  rejects(
    'POST /pools, derselbe Regelteil zweimal',
    await post('/pools', {
      name: 'Doppelter Term',
      rule: [
        { kind: 'tag', tagId },
        { kind: 'tag', tagId },
      ],
    }),
    'validation_error',
  );
  rejects(
    'POST /pools, Regelteil auf ein unbekanntes Tag',
    await post('/pools', {
      name: 'Unbekanntes Tag',
      rule: [{ kind: 'tag', tagId: '0199aaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee' }],
    }),
    'validation_error',
  );

  rejects(
    'PATCH /pools/{id}, auf einen vergebenen Namen',
    await patch(`/pools/${positioned.body?.data?.id}`, { name: 'Kunden Nord' }),
    'name_conflict',
  );

  // Der Fall, den eine zu strenge Prüfung kaputtmacht: Eine Regel darf ihren
  // eigenen Namen behalten.
  const keepsOwn = await patch(`/pools/${poolId}`, { name: 'Kunden Nord', matchMode: 'all' });
  check('eine Regel darf ihren eigenen Namen behalten', keepsOwn.status === 200, JSON.stringify(keepsOwn.body));

  rejects('POST /tags, derselbe Name', await post('/tags', { name: 'beratung' }), 'name_conflict');

  const statuses = await get('/todo-statuses');
  const existingStatus = statuses.body?.data?.[0]?.name;
  rejects(
    'POST /todo-statuses, derselbe Name',
    await post('/todo-statuses', { name: String(existingStatus).toUpperCase() }),
    'name_conflict',
  );

  rejects(
    'POST /todos, unbekanntes Tag',
    await post('/todos', { title: 'Mit falschem Tag', tagIds: ['0199aaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee'] }),
    'validation_error',
  );
  rejects(
    'POST /todos, unbekannter Status',
    await post('/todos', { title: 'Mit falschem Status', statusId: '0199aaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee' }),
    'validation_error',
  );

  const templates = await get('/export/templates');
  const templateName = templates.body?.data?.[0]?.name;
  const templateDefinition = templates.body?.data?.[0]?.definition;
  rejects(
    'POST /export/templates, derselbe Name',
    await post('/export/templates', { name: String(templateName), definition: templateDefinition }),
    'name_conflict',
  );

  // -------------------------------------------------------------------------
  section('3  Eine abgewiesene Anlage hinterlässt nichts');
  // -------------------------------------------------------------------------

  const before = (await get('/pools?placement=all')).body?.data ?? [];
  await post('/pools', { name: 'Kunden Nord' });
  await post('/pools', { name: 'Noch eine mit 42', position: 42 });
  await post('/pools', {
    name: 'Mit doppeltem Term',
    rule: [
      { kind: 'tag', tagId },
      { kind: 'tag', tagId },
    ],
  });
  await post('/pools', {
    name: 'Mit unbekanntem Tag',
    rule: [{ kind: 'tag', tagId: '0199aaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee' }],
  });
  const after = (await get('/pools?placement=all')).body?.data ?? [];

  check(
    'vier abgewiesene Anlagen, keine neue Regel',
    before.length === after.length,
    `vorher ${String(before.length)}, nachher ${String(after.length)}: ${JSON.stringify(after.map((p) => p.name))}`,
  );
  check(
    'und auch keine Regel ohne ihre Regelterme',
    after.every((pool) => Array.isArray(pool.rule)),
    JSON.stringify(after.map((pool) => [pool.name, pool.rule?.length])),
  );

  // -------------------------------------------------------------------------
  section('4  „Derselbe Name“ heißt bei einer Regel dasselbe wie bei einem Tag');
  // -------------------------------------------------------------------------
  //
  // Dieselben Paare, die `proof:tags` für Tags misst — hier über `POST /pools`.
  // Der eindeutige Index allein könnte das nicht: `COLLATE NOCASE` kennt kein Ä.

  const umlaut = await post('/pools', { name: 'Änderung' });
  check('„Änderung“ lässt sich anlegen', umlaut.status === 201, JSON.stringify(umlaut.body));
  rejects('„änderung“ ist derselbe Name', await post('/pools', { name: 'änderung' }), 'name_conflict');

  const strasse = await post('/pools', { name: 'Straße' });
  const strasse2 = await post('/pools', { name: 'Strasse' });
  check(
    '„Straße“ und „Strasse“ sind zwei Namen — keine Umschrift (T-058)',
    strasse.status === 201 && strasse2.status === 201,
    `${String(strasse.status)} / ${String(strasse2.status)}`,
  );

  // Die Anzeigeform wird vereinheitlicht, nicht die Eingabe gespeichert: Wer
  // „ Vertrieb   Süd “ tippt, bekommt „Vertrieb Süd“. Ohne diesen Schritt
  // stünden zwei Regeln nebeneinander, die auf dem Bildschirm gleich aussehen.
  const spaced = await post('/pools', { name: '  Vertrieb   Süd  ' });
  check(
    'der gespeicherte Name ist die Anzeigeform der Domäne',
    spaced.body?.data?.name === 'Vertrieb Süd',
    JSON.stringify(spaced.body?.data?.name),
  );

  const all = (await get('/pools?placement=all')).body?.data ?? [];
  const keys = all.map((pool) => nameKey(pool.name));
  check(
    'kein Bestand mit zwei Regeln desselben Schlüssels',
    new Set(keys).size === keys.length,
    JSON.stringify(all.map((pool) => pool.name)),
  );

  // Eine Spalte darf den Namen eines Pools nicht bekommen — der Fall, den E-054
  // häufig gemacht hat.
  rejects(
    'eine Board-Spalte mit dem Namen eines Pools',
    await post('/pools', { name: 'Kunden Nord', placement: 'board' }),
    'name_conflict',
  );

  // -------------------------------------------------------------------------
  section('5  Der Standard-Status ist auch ohne die Oberfläche geschützt');
  // -------------------------------------------------------------------------
  //
  // Befund aus T-073: `apps/web` sperrte das Löschen des Standard-Status, der
  // Dienst ließ es durch, und `defaultStatus()` fiel danach **still** auf den
  // ersten nach Position — ein neu angelegtes Todo landete woanders, ohne dass
  // jemand es erfahren hätte. Eine Regel, die nur in der Oberfläche steht, ist
  // keine Regel; dieser Abschnitt fährt deshalb die Routen unmittelbar an, so
  // wie es ein zweiter Aufrufer täte.

  const statusList = (await get('/todo-statuses')).body?.data ?? [];
  const defaultStatus = statusList.find((entry) => entry.isDefault === true);
  const otherStatus = statusList.find((entry) => entry.isDefault !== true);

  check(
    'es gibt genau einen Standard-Status',
    statusList.filter((entry) => entry.isDefault === true).length === 1,
    JSON.stringify(statusList.map((entry) => [entry.name, entry.isDefault])),
  );

  rejects(
    'DELETE /todo-statuses/{id} auf den Standard',
    await call(`/todo-statuses/${defaultStatus?.id}`, { method: 'DELETE', token: secret }),
    'default_status_locked',
  );
  rejects(
    'PATCH /todo-statuses/{id} mit isDefault:false auf den Standard',
    await patch(`/todo-statuses/${defaultStatus?.id}`, { isDefault: false }),
    'default_status_locked',
  );

  const stillThere = (await get('/todo-statuses')).body?.data ?? [];
  check(
    'nach beiden Abweisungen steht der Standard unverändert da',
    stillThere.filter((entry) => entry.isDefault === true).length === 1 &&
      stillThere.some((entry) => entry.id === defaultStatus?.id && entry.isDefault === true),
    JSON.stringify(stillThere.map((entry) => [entry.name, entry.isDefault])),
  );

  // Die Gegenprobe: Weitergeben geht, und danach lässt sich der frühere
  // Standard löschen. Ohne sie wäre die Sperre oben womöglich eine Sackgasse.
  const handed = await patch(`/todo-statuses/${otherStatus?.id}`, { isDefault: true });
  check('der Standard lässt sich weitergeben', handed.status === 200, JSON.stringify(handed.body));
  check(
    'und danach ist genau der andere der Standard',
    handed.body?.data?.isDefault === true,
    JSON.stringify(handed.body?.data),
  );

  const freed = await call(`/todo-statuses/${defaultStatus?.id}`, { method: 'DELETE', token: secret });
  check(
    'der frühere Standard lässt sich danach löschen',
    freed.status === 204 || freed.body?.error?.code === 'status_in_use',
    `${String(freed.status)} ${JSON.stringify(freed.body)}`,
  );

  // `isDefault: false` auf einem Status, der ohnehin nicht der Standard ist,
  // bleibt folgenlos — die Sperre darf nicht mehr abweisen, als sie schützt.
  const harmless = await patch(`/todo-statuses/${defaultStatus?.id}`, { isDefault: false });
  check(
    'isDefault:false auf einem Status ohne Standardmarke bleibt zulässig',
    harmless.status === 200 || harmless.status === 404,
    `${String(harmless.status)} ${JSON.stringify(harmless.body)}`,
  );

  // -------------------------------------------------------------------------
  section('6  Ein Status, der in einer Regel steht, wird nicht weggelöscht (T-076)');
  // -------------------------------------------------------------------------
  //
  // Seit T-076 kann eine Regel nach dem Status filtern. `pool_rule.status_id`
  // steht deshalb auf ON DELETE **RESTRICT** — anders als `tag_id`, das
  // kaskadiert. Der Unterschied ist der Grund für diesen Abschnitt: Bei einem
  // gelöschten Tag entkernte die Datenbank die Regel stillschweigend, und nur
  // eine Prüfung im Adapter verhinderte das (A-4.5). Beim Status weist auch die
  // Datenbank ab — aber mit „FOREIGN KEY constraint failed", und das ist ein
  // 4xx ohne Erklärung.
  //
  // Gemessen wird deshalb beides: dass abgewiesen wird, **und** dass der Satz
  // aus dem Anwendungsfall kommt und nicht aus SQLite.

  const ruleStatus = ((await get('/todo-statuses')).body?.data ?? []).find(
    (entry) => entry.isDefault !== true,
  );
  const ruleColumn = await call('/pools', {
    method: 'POST',
    token: secret,
    body: { name: 'Spalte über einen Status', placement: 'board', statusIds: [ruleStatus?.id] },
  });
  check(
    'eine Spalte lässt sich mit einem Statusterm anlegen',
    ruleColumn.status === 201 && ruleColumn.body?.data?.statusIds?.[0] === ruleStatus?.id,
    `${String(ruleColumn.status)} ${JSON.stringify(ruleColumn.body?.data?.statusIds)}`,
  );

  const blocked = await call(`/todo-statuses/${ruleStatus?.id}`, { method: 'DELETE', token: secret });
  rejects('DELETE /todo-statuses/{id} auf einen Status, den eine Regel benutzt', blocked, 'status_in_use');
  check(
    'und die Meldung nennt die Regel, nicht den Fremdschlüssel',
    typeof blocked.body?.error?.message === 'string' &&
      blocked.body.error.message.includes('Regel') &&
      !blocked.body.error.message.includes('FOREIGN KEY'),
    JSON.stringify(blocked.body?.error?.message),
  );

  // Die Gegenprobe: Ohne den Statusterm geht es wieder. Sonst wäre die Sperre
  // eine Sackgasse — derselbe Punkt wie beim Standard-Status oben.
  await patch(`/pools/${ruleColumn.body?.data?.id}`, { statusIds: [] });
  const afterRelease = await call(`/todo-statuses/${ruleStatus?.id}`, {
    method: 'DELETE',
    token: secret,
  });
  check(
    'nachdem der Statusterm aus der Regel genommen ist, lässt er sich löschen',
    afterRelease.status === 204,
    `${String(afterRelease.status)} ${JSON.stringify(afterRelease.body)}`,
  );
} finally {
  child.kill('SIGTERM');
  await sleep(300);
  await rm(dataDir, { recursive: true, force: true });
}

console.log(`\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.`);
if (failed > 0) {
  console.log('\nFehlgeschlagen:');
  for (const name of failures) console.log(`  - ${name}`);
  process.exit(1);
}
