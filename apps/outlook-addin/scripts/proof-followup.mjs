/** PR #15: behavioral regression tests for the link-only Outlook follow-up. */
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
