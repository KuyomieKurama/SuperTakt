/**
 * Takt — Nachweis, dass ein Vorlagenfeldname geprüft wird
 * (T-034, B-3.2, Prüfung 25 aus Abschnitt 7 des Bedrohungsmodells, TP-SEC-07).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:template-fields
 *
 * ===========================================================================
 * Was T-023 gemessen hat
 * ===========================================================================
 *
 * ```
 * validate("__proto__")   ok: true     validate("constructor") ok: true
 * validate("prototype")   ok: true     validate("a"×200)       ok: true
 * validate("<img src=x onerror=alert(1)>")                     ok: true
 * Duplikat zweier Felder namens "Call": angenommen
 *
 * Feld "__proto__", Quelle mit Wert null  -> {"Call":null,"Zeit":0.25}
 *                                            das Feld fehlt in der Ausgabe
 * Feld "__proto__", Quelle mit Zeichenkette -> {}       alles verschluckt
 * Zwei Felder "Call"                        -> {"Call":0.25}
 *                                            die Call-Nummer still ersetzt
 * ```
 *
 * Kein Prototype Pollution im gefährlichen Sinn — das Zeilenobjekt ist lokal.
 * Aber **stiller Feldverlust in der Abrechnungsdatei**, und im Doppelnamenfall
 * eine Call-Nummer, die durch eine Zeitangabe ersetzt wird. Das fällt weder
 * beim Speichern auf noch beim Exportieren, sondern beim Kunden.
 *
 * Dieser Lauf misst dieselben Fälle nach — auf drei Ebenen, weil B-3.2 auf drei
 * Ebenen wirkt:
 *
 * 1. **`packages/export` unmittelbar** — die Prüffunktion selbst.
 * 2. **Durch den vollständigen HTTP-Stapel** — `POST`/`PATCH /export/templates`
 *    und `POST /export/preview` mit ungespeicherter Definition (E-051).
 * 3. **An Oberfläche und Route vorbei**, per `INSERT` direkt in SQLite —
 *    derselbe Weg, mit dem T-023 die Notiz-Grenze angegriffen hat. Ein Lauf
 *    gegen eine so eingeschmuggelte Vorlage muss **abbrechen**, nicht das Feld
 *    still auslassen (B-3.1 Punkt 4).
 *
 * **Die Regel über allen Nachweispfaden** steht ausgeschrieben im Kopf von
 * `proof-route-policy.mjs` (A-A-55, T-206): *Keine Zusicherung darf bestehen,
 * ohne daß das Geprüfte stattgefunden hat.* Abschnitt 5 ist ihre Anwendung —
 * er liest den eingeschmuggelten Datensatz zurück, bevor er über dessen
 * Abwehr urteilt (A-A-54).
 */

import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

import {
  BUILTIN_EXPORT_TEMPLATE,
  renderExportGroup,
  validateExportTemplateDefinition,
  validateExportTemplateField,
} from '@takt/export';

import { compose } from '../src/composition.ts';
import { API_BASE_PATH } from '../src/config.ts';

const PORT = 17843;
const HOST = `127.0.0.1:${PORT}`;
const ORIGIN = 'http://localhost:5173';

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

const field = (name, source = 'todo.callNumber', transformation = 'raw') => ({
  name,
  source,
  transformation,
});

// ---------------------------------------------------------------------------
section('1  Die Prüffunktion selbst — die Messreihe aus T-023');
// ---------------------------------------------------------------------------
{
  const rejected = [
    ['__proto__', 'der Name, mit dem das Feld still verschwand'],
    ['constructor', 'ebenso'],
    ['prototype', 'ebenso'],
    ['a'.repeat(65), '65 Zeichen — eins über der Grenze'],
    ['a'.repeat(200), '200 Zeichen'],
    ['<img src=x onerror=alert(1)>', 'HTML in einem JSON-Schlüssel'],
    ['Feld mit Leerzeichen', 'Leerzeichen'],
    ['Feld.mit.Punkten', 'Punkte'],
    ['Feld\nmit\nZeilenumbruch', 'Zeilenumbruch'],
    ['Ümläute', 'außerhalb des Zeichenvorrats'],
    ['', 'leer'],
    ['   ', 'nur Leerraum'],
  ];
  const durchgerutscht = rejected.filter(([name]) => validateExportTemplateField(field(name)).ok);
  check(
    `alle ${rejected.length} unzulässigen Feldnamen werden abgewiesen`,
    durchgerutscht.length === 0,
    durchgerutscht.map(([n]) => JSON.stringify(n)).join(', '),
  );

  const accepted = ['Call', 'Zeit', 'Notiz', 'WindowsUser', 'Ticket-Nr', 'feld_1', 'a', 'a'.repeat(64)];
  const faelschlich = accepted.filter((name) => !validateExportTemplateField(field(name)).ok);
  check(
    `alle ${accepted.length} zulässigen Feldnamen kommen weiterhin durch`,
    faelschlich.length === 0,
    faelschlich.join(', '),
  );

  const proto = validateExportTemplateField(field('__proto__'));
  check(
    'die Ablehnung nennt den Grund und den Zeichenvorrat',
    !proto.ok && proto.error.code === 'validation_error' && proto.error.message.includes('A–Z'),
    proto.ok ? 'angenommen' : proto.error.message,
  );

  const dup = validateExportTemplateDefinition({
    version: 1,
    fields: [field('Call'), field('Call', 'group.quarters', 'quarter_hours_to_number')],
  });
  check(
    'zwei Felder gleichen Namens werden beim Speichern abgewiesen',
    !dup.ok,
    dup.ok ? 'angenommen' : '',
  );
  check(
    'die Meldung sagt, was sonst geschähe',
    !dup.ok && dup.error.message.includes('mehrfach'),
    dup.ok ? '' : dup.error.message,
  );

  const nearDup = validateExportTemplateDefinition({
    version: 1,
    fields: [field('Call'), field('call', 'group.quarters', 'quarter_hours_to_number')],
  });
  check(
    'Call und call bleiben erlaubt — JSON unterscheidet sie, es geht nichts verloren',
    nearDup.ok,
    nearDup.ok ? '' : nearDup.error.message,
  );

  check(
    'die mitgelieferte Standardvorlage besteht die verschärfte Prüfung',
    validateExportTemplateDefinition(BUILTIN_EXPORT_TEMPLATE).ok,
  );
}

// ---------------------------------------------------------------------------
section('2  Der Renderer verschluckt auch dann nichts, wenn die Prüfung umgangen wird');
// ---------------------------------------------------------------------------
{
  const group = {
    todoId: '01920000-0000-7000-8000-00000000000a',
    day: '2026-09-01',
    entries: [
      {
        timeEntryId: '01920000-0000-7000-8000-00000000000e',
        todoId: '01920000-0000-7000-8000-00000000000a',
        startedAt: '2026-09-01T08:00:00Z',
        endedAt: '2026-09-01T08:10:00Z',
        durationSeconds: 600,
        bookingNote: 'abrechenbare Leistung',
        todoTitle: 'Feldnamen',
        todoCallNumber: 'TCK-000009',
        todoTagNames: [],
        previouslyExported: false,
      },
    ],
    todoTitle: 'Feldnamen',
    todoCallNumber: 'TCK-000009',
    todoTagNames: [],
    previouslyExported: false,
  };
  const context = { windowsUser: 'p', roundingMode: 'up', exportedAt: '2026-09-01T09:00:00Z' };

  // Absichtlich an `validateExportTemplateField` vorbei — genau der Zustand,
  // den ein `INSERT` in `export_template` oder ein alter Bestand herstellt.
  const result = renderExportGroup(group, [field('__proto__'), field('Call')], context);
  check('der Renderer liefert eine Zeile', result.kind === 'row', result.kind);
  if (result.kind === 'row') {
    const keys = Object.keys(result.row);
    check(
      'das Feld „__proto__" steht als gewöhnlicher Schlüssel in der Zeile (war: verschluckt)',
      keys.includes('__proto__'),
      keys.join(', '),
    );
    check(
      'das danebenstehende Feld „Call" überlebt (war: die ganze Zeile leer)',
      keys.includes('Call'),
      keys.join(', '),
    );
    const serialized = JSON.stringify(result.row);
    check(
      'und beide stehen so auch in der erzeugten Datei',
      serialized.includes('"__proto__"') && serialized.includes('"Call"'),
      serialized,
    );
    check(
      'die Zeile hat keinen Prototyp — kein Feldname hat eine Sonderbedeutung',
      Object.getPrototypeOf(result.row) === null,
      String(Object.getPrototypeOf(result.row)),
    );
  }
}

// ---------------------------------------------------------------------------
// Ab hier gegen den zusammengesetzten Dienst. Warum `app.fetch` und kein
// eigener Prozess: siehe Kopf von `proof-route-policy.mjs`.
// ---------------------------------------------------------------------------

const dataDir = await mkdtemp(join(tmpdir(), 'takt-proof-fields-'));
const exportDir = await mkdtemp(join(tmpdir(), 'takt-export-'));
const sessionSecret = `takt_${randomBytes(32).toString('base64url')}`;
const databaseLocation = join(dataDir, 'takt.db');

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

let service = compose({
  port: PORT,
  store: memoryStore(),
  sessionSecret,
  windowsUser: 't.beispiel',
  databaseLocation,
});
await service.database.migrations.migrateToLatest();

async function call(path, { method = 'GET', body } = {}) {
  const headers = { Host: HOST, Origin: ORIGIN, 'X-Takt-Token': sessionSecret };
  const init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const response = await service.app.fetch(new Request(`http://${HOST}${API_BASE_PATH}${path}`, init));
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* kein JSON */
  }
  return { status: response.status, body: json, text };
}

try {
  // ---------------------------------------------------------------------------
  section('3  Durch den vollständigen HTTP-Stapel — beim Speichern abgewiesen');
  // ---------------------------------------------------------------------------
  {
    const before = await call('/export/templates');
    const countBefore = before.body?.data?.items?.length ?? before.body?.data?.length ?? 0;

    const attempts = [
      ['__proto__', [field('__proto__'), field('Call')]],
      ['constructor', [field('constructor')]],
      ['prototype', [field('prototype')]],
      ['200 Zeichen', [field('a'.repeat(200))]],
      ['HTML im Namen', [field('<img src=x onerror=alert(1)>')]],
      ['zwei Felder „Call"', [field('Call'), field('Call', 'group.quarters', 'quarter_hours_to_number')]],
    ];

    const accepted = [];
    for (const [label, fields] of attempts) {
      const response = await call('/export/templates', {
        method: 'POST',
        body: { name: `Angriff ${label}`, definition: { version: 1, fields } },
      });
      if (response.status < 400) accepted.push(`${label} → ${response.status}`);
    }
    check(
      `alle ${attempts.length} Vorlagen mit unzulässigen Feldnamen werden abgewiesen`,
      accepted.length === 0,
      accepted.join(' | '),
    );

    const after = await call('/export/templates');
    const countAfter = after.body?.data?.items?.length ?? after.body?.data?.length ?? 0;
    check(
      'es ist keine davon gespeichert worden',
      countAfter === countBefore,
      `vorher ${countBefore}, nachher ${countAfter}`,
    );

    const good = await call('/export/templates', {
      method: 'POST',
      body: {
        name: 'Eigene Vorlage',
        definition: { version: 1, fields: [field('Call'), field('Ticket-Nr')] },
      },
    });
    check(
      'eine Vorlage mit zulässigen Namen wird weiterhin gespeichert',
      good.status === 201,
      `Status ${good.status}: ${good.text.slice(0, 200)}`,
    );

    const templateId = good.body?.data?.template?.id ?? good.body?.data?.id;
    if (typeof templateId === 'string') {
      const patched = await call(`/export/templates/${templateId}`, {
        method: 'PATCH',
        body: { definition: { version: 1, fields: [field('__proto__')] } },
      });
      check(
        'auch das Ändern einer bestehenden Vorlage kommt nicht daran vorbei',
        patched.status >= 400,
        `Status ${patched.status}`,
      );
    } else {
      check('die angelegte Vorlage hat eine Kennung', false, good.text.slice(0, 200));
    }
  }

  // ---------------------------------------------------------------------------
  section('4  Die Vorschau mit ungespeicherter Definition (E-051) hält ebenso');
  // ---------------------------------------------------------------------------
  {
    const proto = await call('/export/preview', {
      method: 'POST',
      body: { definition: { version: 1, fields: [field('__proto__')] } },
    });
    check(
      'POST /export/preview mit „__proto__" wird abgewiesen',
      proto.status >= 400,
      `Status ${proto.status}: ${proto.text.slice(0, 200)}`,
    );

    const dup = await call('/export/preview', {
      method: 'POST',
      body: {
        definition: {
          version: 1,
          fields: [field('Call'), field('Call', 'group.quarters', 'quarter_hours_to_number')],
        },
      },
    });
    check(
      'POST /export/preview mit zwei Feldern „Call" wird abgewiesen',
      dup.status >= 400,
      `Status ${dup.status}: ${dup.text.slice(0, 200)}`,
    );

    const fine = await call('/export/preview', {
      method: 'POST',
      body: { definition: { version: 1, fields: [field('Call')] } },
    });
    check(
      'eine gültige Definition wird weiterhin gerendert',
      fine.status === 200,
      `Status ${fine.status}: ${fine.text.slice(0, 200)}`,
    );
  }

  // ---------------------------------------------------------------------------
  section('5  An Oberfläche und Route vorbei: per INSERT direkt in SQLite');
  // ---------------------------------------------------------------------------
  {
    // Ein Todo mit einer Buchung, damit es beim Lauf etwas zu exportieren gäbe.
    const todo = await call('/todos', {
      method: 'POST',
      body: { title: 'Feldnamen', callNumber: 'TCK-000042' },
    });
    const todoId = todo.body?.data?.todo?.id ?? todo.body?.data?.id;
    check('ein Todo für den Lauf ist angelegt', typeof todoId === 'string', todo.text.slice(0, 200));

    const entry = await call('/time-entries', {
      method: 'POST',
      body: {
        todoId,
        startedAt: '2026-09-01T08:00:00Z',
        endedAt: '2026-09-01T08:20:00Z',
        note: 'abrechenbare Leistung',
      },
    });
    check(
      'eine abgeschlossene Buchung liegt vor',
      entry.status === 201,
      `Status ${entry.status}: ${entry.text.slice(0, 200)}`,
    );

    await call('/settings', { method: 'PATCH', body: { exportDirectory: exportDir } });

    // Die Vorlage wird an jeder Prüfung vorbei eingesetzt. Danach wird der
    // Dienst neu aufgesetzt, damit er die manipulierte Datei liest — dasselbe
    // Vorgehen wie in Abschnitt 3 des Berichts zu T-023.
    const smuggled = JSON.stringify({
      version: 1,
      fields: [
        { name: '__proto__', source: 'todo.callNumber', transformation: 'raw' },
        { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
      ],
    });
    const id = randomBytes(16).toString('hex');
    const columns = service.database.connection
      .prepare('PRAGMA table_info(export_template)')
      .all()
      .map((row) => String(row['name']));
    const values = {
      id,
      name: 'Eingeschmuggelt',
      definition: smuggled,
      is_builtin: 0,
      is_active: 1,
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-09-01T08:00:00Z',
      sort_order: 99,
    };
    const used = columns.filter((column) => column in values);
    service.database.connection
      .prepare(
        `INSERT INTO export_template (${used.join(', ')}) VALUES (${used.map(() => '?').join(', ')})`,
      )
      .run(...used.map((column) => values[column]));

    /*
     * A-A-54 (T-206-4) — der Angriff wird **zurückgelesen**, bevor über seine
     * Wirkung geurteilt wird.
     *
     * Bis dahin lautete die Bedingung dieser Zeile wörtlich `true`: Es wurde
     * nichts nachgesehen. Gemessen mit einem Durchlauf ohne den `INSERT` —
     * Vorschau und Lauf antworteten `404 not_found`, und alle drei
     * Zusicherungen dieses Abschnitts bestanden. Rot wurde der Lauf nur an den
     * beiden `details`-Zeilen aus T-046, also durch einen Zufall der
     * Geschichte und nicht durch seine Anlage.
     *
     * Keine Zusicherung darf bestehen, ohne daß das Geprüfte stattgefunden hat
     * (A-A-55, ausgeschrieben im Kopf von `proof-route-policy.mjs`).
     */
    const stored = service.database.connection
      .prepare('SELECT definition FROM export_template WHERE id = ?')
      .get(id);
    check(
      'die Vorlage steckt an jeder Prüfung vorbei in der Datenbank',
      stored !== undefined && String(stored['definition']) === smuggled,
      stored === undefined ? 'keine Zeile' : `gelesen: ${String(stored['definition']).slice(0, 160)}`,
    );

    service.database.close();
    service = compose({
      port: PORT,
      store: memoryStore(),
      sessionSecret,
      windowsUser: 't.beispiel',
      databaseLocation,
    });

    /*
     * Zweiter Teil von A-A-54: nicht bloß „irgendein Fehler ab 400", sondern
     * der Schlüssel des **Feldnamens**. `>= 400` erfüllt auch ein `404
     * not_found` — also genau die Antwort, die kommt, wenn der Angriff gar
     * nicht angekommen ist. Der Unterschied zwischen „abgewehrt" und „nicht
     * stattgefunden" ist der ganze Zweck dieses Abschnitts.
     */
    const preview = await call('/export/preview', { method: 'POST', body: { templateId: id } });
    check(
      'die Vorschau gegen die eingeschmuggelte Vorlage bricht ab — mit validation_error',
      preview.status >= 400 && preview.body?.error?.code === 'validation_error',
      `Status ${preview.status}: ${preview.text.slice(0, 200)}`,
    );

    const run = await call('/export/runs', { method: 'POST', body: { templateId: id } });
    check(
      'der Exportlauf bricht mit validation_error ab, statt das Feld still auszulassen (B-3.1 Punkt 4)',
      run.status >= 400 && run.body?.error?.code === 'validation_error',
      `Status ${run.status}: ${run.text.slice(0, 200)}`,
    );

    /*
     * T-046 — **derselbe Fehlschlag sagt auf beiden Wegen dasselbe.**
     *
     * Bis dahin baute `runExport` den Fehler aus `code` und `message` neu und
     * verlor dabei `details`; die Vorschau behielt sie seit T-030. Der Lauf ist
     * der teurere der beiden Wege und der einzige, der eine Datei schreibt —
     * dass er weniger sagte als die Vorschau, war genau verkehrt herum. Die
     * Oberfläche konnte die betroffene Feldzeile beim Lauf nicht markieren.
     *
     * Und genau dieser Weg ist die Antwort auf das Bestandsrisiko: Eine vor
     * T-034 gespeicherte Vorlage mit einem heute unzulässigen Feldnamen
     * verhält sich wie diese eingeschmuggelte. Sie bricht den Lauf ab — und
     * seit T-046 sagt sie dabei, **welches Feld** es ist.
     */
    check(
      'und nennt dabei dieselbe Feldangabe wie die Vorschau (T-030, T-046)',
      JSON.stringify(run.body?.error?.details ?? null) ===
        JSON.stringify(preview.body?.error?.details ?? undefined),
      `Lauf: ${JSON.stringify(run.body?.error?.details)} / Vorschau: ${JSON.stringify(preview.body?.error?.details)}`,
    );
    check(
      'die Feldangabe ist auch wirklich vorhanden und nicht beidseitig leer',
      Array.isArray(run.body?.error?.details) && run.body.error.details.length > 0,
      JSON.stringify(run.body?.error),
    );

    const written = await readdir(exportDir);
    check('es liegt keine Exportdatei im Ordner', written.length === 0, written.join(', '));

    const entries = await call('/time-entries');
    check(
      'keine Buchung ist als exportiert markiert worden',
      !entries.text.includes('"exported"'),
      entries.text.slice(0, 240),
    );

    // Gegenprobe: mit der Standardvorlage läuft derselbe Export durch.
    const ok = await call('/export/runs', { method: 'POST', body: {} });
    check(
      'derselbe Export läuft mit der Standardvorlage durch',
      ok.status === 201,
      `Status ${ok.status}: ${ok.text.slice(0, 240)}`,
    );
    const files = await readdir(exportDir);
    check('und schreibt genau eine Datei', files.length === 1, files.join(', '));
  }
} finally {
  service.database.close();
  await rm(dataDir, { recursive: true, force: true });
  await rm(exportDir, { recursive: true, force: true });
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  console.log(`Fehlgeschlagen: ${failures.join(', ')}`);
  process.exit(1);
}
