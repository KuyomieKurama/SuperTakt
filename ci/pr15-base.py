"""Apply the reviewed PR #15 patch to its exact parent, without changing CI policy."""
from pathlib import Path
import re
import subprocess

BASE = '6578eabead3a4e5cde7347562c3915102628a6e9'
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip() == BASE


def replace_once(text: str, old: str, new: str) -> str:
    assert text.count(old) == 1, f'Expected one occurrence of {old[:120]!r}, found {text.count(old)}'
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, new: str) -> str:
    matches = list(re.finditer(pattern, text, re.S))
    assert len(matches) == 1, f'Expected one match for {pattern[:100]!r}, found {len(matches)}'
    match = matches[0]
    return text[:match.start()] + new + text[match.end():]


pane_path = Path('apps/outlook-addin/src/ui/TaskPane.tsx')
pane = pane_path.read_text()
start = pane.index('      <DuplicateOffer\n')
end = pane.index('\n      />', start) + len('\n      />')
pane = pane[:end] + '''

      {offers.length > 0 && dueEntry.kind !== 'none' ? (
        <p className="pane-note">
          Die eingetragene Frist gilt nur für ein neues Todo. Das vorhandene Todo behält seine eigene Frist.
        </p>
      ) : null}''' + pane[end:]
pane_path.write_text(pane)

offer_path = Path('apps/outlook-addin/src/ui/DuplicateOffer.tsx')
offer = replace_once(offer_path.read_text(),
    '        Dabei wird auf dem vorhandenen Todo keine Zeit erfasst.',
    '        Dabei wird auf dem vorhandenen Todo keine Zeit erfasst.\n        Ein erledigtes Todo bleibt erledigt.')
offer_path.write_text(offer)

proof_path = Path('apps/outlook-addin/scripts/proof-addin.mjs')
proof = proof_path.read_text()
proof = replace_once(proof, "import path from 'node:path';", "import path from 'node:path';\nimport { runFollowupProofs } from './proof-followup.mjs';")
proof = regex_once(proof,
    r'  assert\.ok\(\n    rufer\.length >= 2,\n    `nur [^\n]*`,\n  \);',
    '''  // PR #15: the booking API and its legacy presentation helper remain;
  // the follow-up UI no longer announces a booking or a pool movement.
  assert.deepEqual(
    rufer.map((file) => path.relative(srcRoot, file)).sort(),
    [path.join('duplicate', 'reopen.ts')],
    'der verbleibende Buchungshelfer muss den Satz aus der Domäne beziehen',
  );''')
proof = replace_once(proof,
    '  assert.ok(felder.length >= 12, `nur ${String(felder.length)} Felder gefunden — der Wächter greift ins Leere`);',
    '''  // PR #15 removes exactly two inputs: minutes and billable service.
  // Every remaining field still has to forward its accessibility attributes.
  assert.ok(felder.length >= 10, `nur ${String(felder.length)} Felder gefunden — der Wächter greift ins Leere`);
  for (const id of ['call', 'title', 'due', 'tags', 'note']) {
    assert.ok(
      felder.some(({ block }) => block.includes(`htmlFor="${id}"`)),
      `das erwartete Feld ${id} fehlt — eine kleinere Menge ist keine Entwarnung`,
    );
  }''')
start = proof.index("const buchungsFlaeche = paneQuelle.slice(")
end = proof.index('// ---------------------------------------------------------------------------\n// 19f', start)
proof = proof[:start] + r'''// PR #15 replaces the booking surface with an explicit link-only follow-up.
// The user's draft date is still not an instruction to modify the found Todo.
const attachmentSurfaceStart = paneQuelle.indexOf('<DuplicateOffer');
const attachmentSurface = paneQuelle.slice(Math.max(0, attachmentSurfaceStart));

check('V-08: das Anhangsangebot sagt, dass die eingetragene Frist nur für ein neues Todo gilt', () => {
  assert.notEqual(attachmentSurfaceStart, -1, 'das Anhangsangebot ist nicht auffindbar');
  assert.match(
    attachmentSurface,
    /Die eingetragene Frist gilt nur für ein neues Todo\./,
    'das Anhängen verwirft die eingegebene Frist weiterhin stillschweigend',
  );
  assert.match(
    attachmentSurface,
    /Das vorhandene Todo behält seine eigene Frist\./,
    'die unveränderte Frist des vorhandenen Todos bleibt unerwähnt',
  );
});

check('V-08: der Satz hängt am Angebot und an der eingegebenen Frist', () => {
  const position = attachmentSurface.indexOf('Die eingetragene Frist gilt nur');
  assert.notEqual(position, -1, 'kein Hinweis gefunden');
  const before = attachmentSurface.slice(Math.max(0, position - 220), position);
  assert.match(
    before,
    /offers\.length > 0 && dueEntry\.kind !== 'none'\s*\?/,
    'der Hinweis darf weder ohne Treffer noch ohne eingegebene Frist erscheinen',
  );
});

check('V-08: das Anhängen sendet weder eine Frist noch eine Zeitbuchung', () => {
  const payload = /await api\.addLinkAttachment\(\{([\s\S]*?)\}\);/.exec(paneQuelle)?.[1] ?? '';
  assert.ok(payload.length > 0, 'der Anhangsaufruf ist nicht auffindbar');
  const keys = [...payload.matchAll(/^\s*([A-Za-z]+):/gm)].map((match) => match[1]).sort();
  assert.deepEqual(keys, ['title', 'todoId', 'url'], 'das Anhangsangebot sendet mehr als den Verweis');
  assert.equal(/\bapi\.book\s*\(/.test(paneQuelle), false, 'das Angebot bucht weiterhin Zeit');
  assert.equal(/due|startedAt|endedAt|minutes/.test(payload), false, 'der Entwurf verändert das gefundene Todo');
});

''' + proof[end:]
proof = replace_once(proof,
    "const TASKPANE = path.join('ui', 'TaskPane.tsx');",
    """// PR #15: SP-A-01 retains the note's privacy label and sentence.
// SP-A-05 and the service label retire with the removed booking controls.
// SP-A-27/28 protect the replacement action's no-booking/no-reopening promise.
// The corresponding product change is recorded in the text inventory.
const TASKPANE = path.join('ui', 'TaskPane.tsx');
const DUPLICATE_OFFER = path.join('ui', 'DuplicateOffer.tsx');""")
proof = regex_once(proof,
    r'''  Object\.freeze\(\{\n    sperre: 'SP-A-01',\n    datei: TASKPANE,\n    text: 'label="Leistung \(geht in die Abrechnung\)"',[\s\S]*?\n  \}\),''',
    '''  Object.freeze({
    sperre: 'SP-A-27',
    datei: DUPLICATE_OFFER,
    text: 'Dabei wird auf dem vorhandenen Todo keine Zeit erfasst.',
    verletzung: 'Die E-Mail wird übernommen.',
    grund: 'PR #15 — Anhängen ist keine Zeitbuchung',
  }),''')
proof = regex_once(proof,
    r'''  Object\.freeze\(\{\n    sperre: 'SP-A-05',\n    datei: TASKPANE,[\s\S]*?\n  \}\),''',
    '''  Object.freeze({
    sperre: 'SP-A-28',
    datei: DUPLICATE_OFFER,
    text: 'Ein erledigtes Todo bleibt erledigt.',
    verletzung: 'Das Todo wird aktualisiert.',
    grund: 'PR #15 — der Verweis hebt Erledigt nicht auf',
  }),''')
proof = replace_once(proof,
    "    [TASKPANE, uiQuelle('ui', 'TaskPane.tsx')],",
    "    [TASKPANE, uiQuelle('ui', 'TaskPane.tsx')],\n    [DUPLICATE_OFFER, uiQuelle('ui', 'DuplicateOffer.tsx')],")
proof = replace_once(proof,
    "// ===========================================================================\nprocess.stdout.write(\n",
    """// ===========================================================================
heading('21  Outlook-Verweise: keine Buchung, kein Wiederöffnen, enge Rechte');
await runFollowupProofs({ check, checkAsync });

// ===========================================================================
process.stdout.write(
""")
proof_path.write_text(proof)

windows_path = Path('apps/local-api/test/outlook-certificate.windows.test.ts')
windows = windows_path.read_text()
windows = replace_once(windows,
    'async function powershell(script: string, input: unknown): Promise<Record<string, unknown>> {',
    '''// Disposable Windows runners can spend over 25 seconds in the first
// PowerShell startup. This is a test-process budget, not a TLS/trust bypass.
const POWERSHELL_TIMEOUT_MS = 60_000;

async function powershell(script: string, input: unknown, phase = 'certificate helper'): Promise<Record<string, unknown>> {''')
windows = replace_once(windows,
    "    const timer = setTimeout(() => { child.kill(); reject(new Error(`PowerShell timeout: ${Buffer.concat(errors).toString('utf8')}`)); }, 25_000);",
    '''    let timedOut = false;
    let inputError: Error | null = null;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
      // Settle on close, so cleanup never races a still-running trust helper.
    }, POWERSHELL_TIMEOUT_MS);
    child.stdin.on('error', (error: Error) => {
      inputError = error;
      child.kill();
    });''')
windows = replace_once(windows,
    "      if (code !== 0) { reject(new Error(Buffer.concat(errors).toString('utf8'))); return; }",
    '''      if (timedOut) {
        reject(new Error(`PowerShell ${phase} exceeded ${POWERSHELL_TIMEOUT_MS} ms; stdout=${Buffer.concat(chunks).length} bytes; stderr: ${Buffer.concat(errors).toString('utf8')}`));
        return;
      }
      if (inputError !== null) { reject(inputError); return; }
      if (code !== 0) { reject(new Error(`PowerShell ${phase} exited ${String(code)}: ${Buffer.concat(errors).toString('utf8')}`)); return; }''')
windows = replace_once(windows,
    "    expect(await powershell(script, { path, action: 'inspect' })).toMatchObject({ fingerprint, validNow: true, validProfile: true, installed: false, https: 'tls_failed' });",
    "    expect(await powershell(script, { path, action: 'inspect' }, 'initial untrusted inspection')).toMatchObject({ fingerprint, validNow: true, validProfile: true, installed: false, https: 'tls_failed' });")
windows = replace_once(windows, '  }, 90_000);', '  }, 180_000);')
windows = replace_once(windows,
    "    if (directory !== null) { await rm(directory, { recursive: true, force: true }); directory = null; }\n  });",
    "    if (directory !== null) { await rm(directory, { recursive: true, force: true }); directory = null; }\n  }, 75_000);")
windows_path.write_text(windows)

inventory_path = Path('docs/design/textbestand-aufgabenbereich.md')
inventory = inventory_path.read_text()
inventory = replace_once(inventory,
    '# Oberflächentext des Aufgabenbereichs — Bestandsaufnahme und Urteil\n',
    '''# Oberflächentext des Aufgabenbereichs — Bestandsaufnahme und Urteil

## Nachtrag 2026-09-09 — Folge-E-Mail ohne Zeitbuchung (PR #15)

Der Auftraggeber hat den Ablauf geändert: Bei einem vorhandenen Todo wird die E-Mail
als Outlook-Verweis angehängt, nicht als Zeit gebucht. Die folgende ältere Aufnahme
bleibt als Historie erhalten; ihre Anforderungen an die entfernte Buchungsfläche gelten
nicht mehr für das neue Anhangsangebot. Die Buchungs-API und ihre bestehenden fachlichen
Prüfungen bleiben davon unberührt.

SP-A-01 schützt weiterhin **„Vermerk (bleibt in SuperTakt)“** und
**„Er geht nicht in die Abrechnung.“**. Der Leistungsteil von SP-A-01 sowie SP-A-05
und SP-A-11 entfallen mit den zugehörigen Buchungsfeldern und dem Wiederöffnen-Knopf.
SP-A-16 beschreibt den weiterhin geprüften Buchungshelfer, nicht die neue Folgehandlung.
SP-A-24 wird durch das ausdrückliche Anhangsangebot ersetzt; SP-A-12 bleibt unverändert.

Die neuen geschützten Aussagen stehen in `DuplicateOffer.tsx`:

| Kennung | Wortlaut | Bedeutung |
|---|---|---|
| SP-A-27 | Dabei wird auf dem vorhandenen Todo keine Zeit erfasst. | Anhängen erzeugt keine Zeitbuchung. |
| SP-A-28 | Ein erledigtes Todo bleibt erledigt. | Anhängen hebt das Kennzeichen nicht auf. |

`proof:addin` Abschnitt 20 prüft diese Aussagen wie die bisherigen Träger auf genau ein
Vorkommen und mit einzeln eingesetzten Gegenbeispielen. Abschnitt 21 prüft die Wirkung
gegen den zusammengesetzten Dienst mit echtem Add-in-Token und echter SQLite-Datenbank.
V-08 gilt weiter: Eine eingegebene Frist wird beim Anhängen nicht übernommen. Der Hinweis
erscheint nur bei einem Treffer und einer eingegebenen Frist; ohne diese Zustände nicht.

---
''')
inventory_path.write_text(inventory)

followup = Path('apps/outlook-addin/scripts/proof-followup.mjs')
assert not followup.exists()
followup.write_text(r'''/** PR #15: behavioral regression tests for the link-only Outlook follow-up. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { compose } from '../../local-api/src/composition.ts';
import { createApiClient } from '../src/api/client.ts';
import { runPattern } from '../src/callnumber/run.ts';
import { DEFAULT_PATTERN } from '../src/callnumber/catalog.ts';

const BASE = 'http://127.0.0.1:17843';
const ORIGIN = 'https://localhost:17844';

async function withService(work) {
  let record = null;
  const secret = `takt_${randomBytes(32).toString('base64url')}`;
  const service = compose({
    port: 17843,
    store: {
      read: async () => record === null ? { status: 'absent' } : { status: 'ok', record },
      write: async (value) => { record = value; },
      inspectPermissions: async () => ({ checked: false, dirTooPermissive: false, fileTooPermissive: false }),
    },
    sessionSecret: secret,
    windowsUser: 't.beispiel',
    databaseLocation: ':memory:',
  });
  try {
    await service.database.migrations.migrateToLatest();
    await service.tokens.load(new Date());
    const token = await service.tokens.rotate(new Date());
    const transport = async (url, init = {}) => {
      const headers = new Headers(init.headers);
      headers.set('Host', '127.0.0.1:17843');
      headers.set('Origin', ORIGIN);
      return service.app.fetch(new Request(url, { ...init, headers }));
    };
    const call = async (path, { method = 'GET', credential = secret, body } = {}) => {
      const headers = {};
      if (credential !== null) headers['X-Takt-Token'] = credential;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const response = await transport(`${BASE}/api/v1${path}`, {
        method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      return { status: response.status, text, body: text.length === 0 ? null : JSON.parse(text) };
    };
    const created = await call('/todos', {
      method: 'POST',
      body: { title: 'Prüfvorgang', callNumber: 'TCK-000042', note: 'Interner Prüfvermerk', dueDate: '2026-09-30' },
    });
    assert.equal(created.status, 201, created.text);
    const todoId = created.body.data.todo?.id ?? created.body.data.id;
    assert.equal(typeof todoId, 'string');
    const client = createApiClient({ baseUrl: BASE, token: () => token, fetch: transport });
    const db = service.database.connection;
    const snapshot = () => ({
      todo: db.prepare('SELECT title, call_number, status_id, completed_at, due_date FROM todo WHERE id = ?').get(todoId),
      note: db.prepare('SELECT body FROM todo_note WHERE todo_id = ?').get(todoId),
      entryCount: db.prepare('SELECT COUNT(*) AS n FROM time_entry WHERE todo_id = ?').get(todoId).n,
    });
    const attachmentCount = () => Number(db.prepare('SELECT COUNT(*) AS n FROM todo_attachment WHERE todo_id = ?').get(todoId).n);
    await work({ call, client, token, todoId, snapshot, attachmentCount });
  } finally {
    service.database.close();
  }
}

export async function runFollowupProofs({ check, checkAsync }) {
  check('PR #15: dieselbe Call-RegEx erkennt gemischte Groß- und Kleinschreibung', () => {
    for (const value of ['TCK-000042', 'tck-000042', 'TcK-000042', 'tCk-000042']) {
      const result = runPattern({ id: 1, source: DEFAULT_PATTERN, text: `AW: ${value}` });
      assert.equal(result.kind, 'match');
      assert.equal(result.group, value, 'die Erkennung darf die Schreibweise nicht still verändern');
    }
  });

  for (const done of [false, true]) {
    await checkAsync(`PR #15: Anhängen an ein ${done ? 'erledigtes' : 'offenes'} Todo ändert weder Zeit noch Frist noch Vermerk`, async () => {
      await withService(async ({ call, client, todoId, snapshot, attachmentCount }) => {
        if (done) {
          const marked = await call(`/todos/${todoId}/done`, { method: 'PUT', body: {} });
          assert.equal(marked.status, 200, marked.text);
        }
        const before = snapshot();
        assert.equal(before.entryCount, 0);
        assert.equal(before.todo.completed_at !== null, done);
        const result = await client.addLinkAttachment({ todoId, url: 'HTTPS://EXAMPLE.ORG:443/mail/42', title: 'Outlook: Prüfvorgang' });
        assert.equal(result.ok, true, result.message);
        assert.equal(result.value.alreadyPresent, false);
        assert.equal(result.value.attachment.kind, 'link');
        assert.equal(result.value.attachment.target, 'https://example.org/mail/42');
        assert.equal(attachmentCount(), 1);
        assert.deepEqual(snapshot(), before, 'Anhängen ist weder Bearbeiten noch Buchen noch Wiederöffnen');
        assert.equal(JSON.stringify(result).includes('Interner Prüfvermerk'), false);
      });
    });
  }

  await checkAsync('PR #15: acht gleichzeitige Verweise ergeben genau einen Anhang', async () => {
    await withService(async ({ client, todoId, attachmentCount }) => {
      const results = await Promise.all(Array.from({ length: 8 }, (_, index) => client.addLinkAttachment({
        todoId, url: index % 2 === 0 ? 'HTTPS://EXAMPLE.ORG:443/mail/42' : 'https://example.org/mail/42', title: 'Outlook',
      })));
      for (const result of results) assert.equal(result.ok, true, result.message);
      assert.equal(results.filter((result) => !result.value.alreadyPresent).length, 1);
      assert.equal(attachmentCount(), 1);
      assert.equal(new Set(results.map((result) => result.value.attachment.id)).size, 1);
    });
  });

  await checkAsync('PR #15: ein Wiederholungsversuch überschreibt den vorhandenen Titel nicht', async () => {
    await withService(async ({ client, todoId, attachmentCount }) => {
      const first = await client.addLinkAttachment({ todoId, url: 'https://example.org/mail/42', title: 'Erster Titel' });
      assert.equal(first.ok, true, first.message);
      const second = await client.addLinkAttachment({ todoId, url: 'HTTPS://EXAMPLE.ORG:443/mail/42', title: 'Zweiter Titel' });
      assert.equal(second.ok, true, second.message);
      assert.equal(second.value.alreadyPresent, true);
      assert.equal(second.value.attachment.id, first.value.attachment.id);
      assert.equal(second.value.attachment.title, 'Erster Titel');
      assert.equal(attachmentCount(), 1);
    });
  });

  await checkAsync('PR #15: lokale Pfade, Bilddaten und aktive URL-Schemata sind keine Verweise', async () => {
    await withService(async ({ call, token, todoId, snapshot, attachmentCount }) => {
      const before = snapshot();
      for (const body of [
        { url: 'file:///C:/Windows/System32/calc.exe' },
        { url: 'javascript:alert(1)' },
        { url: 'data:image/png;base64,aGVsbG8=' },
        { kind: 'file', path: '/tmp/keine-datei.txt' },
        { kind: 'image', bytes: 'aGVsbG8=' },
      ]) {
        const result = await call(`/addin/todos/${todoId}/attachments`, { method: 'POST', credential: token, body });
        assert.equal(result.status, 422, result.text);
      }
      assert.equal(attachmentCount(), 0);
      assert.deepEqual(snapshot(), before);
    });
  });

  await checkAsync('PR #15: ein unbekanntes Todo ergibt 404 und keinen Anhang', async () => {
    await withService(async ({ client, attachmentCount }) => {
      const result = await client.addLinkAttachment({ todoId: '01920000-0000-7000-8000-000000000000', url: 'https://example.org/mail/42' });
      assert.equal(result.ok, false);
      assert.equal(result.kind, 'not_found');
      assert.equal(attachmentCount(), 0);
    });
  });

  await checkAsync('PR #15: ohne gültiges Token ist auch die neue Anhangsroute geschlossen', async () => {
    await withService(async ({ call, todoId, attachmentCount }) => {
      for (const credential of [null, `takt_${'x'.repeat(43)}`]) {
        const result = await call(`/addin/todos/${todoId}/attachments`, {
          method: 'POST', credential, body: { url: 'https://example.org/mail/42' },
        });
        assert.equal(result.status, 401, result.text);
      }
      assert.equal(attachmentCount(), 0);
    });
  });

  await checkAsync('PR #15: das Add-in-Token erhält keinen allgemeinen Anhangs- oder Dateizugriff', async () => {
    await withService(async ({ call, token, todoId, attachmentCount }) => {
      for (const [method, path, body] of [
        ['GET', `/todos/${todoId}/attachments`, undefined],
        ['POST', `/todos/${todoId}/attachments`, { kind: 'file', path: '/tmp/keine-datei.txt' }],
        ['DELETE', `/todos/${todoId}/attachments/01920000-0000-7000-8000-000000000000`, undefined],
      ]) {
        const result = await call(path, { method, credential: token, body });
        assert.equal(result.status, 401, result.text);
      }
      assert.equal(attachmentCount(), 0);
    });
  });
}
''')
print('Applied only the PR #15 UI, proof, documentation and Windows test corrections.')
