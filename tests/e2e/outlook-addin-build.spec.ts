/**
 * TP-BUILD-03/04 (docs/testplan.md, Abschnitt 15) — T-055.
 *
 * Miss, ob die aus T-053 bekannte Lücke ("jeder Nachweis läuft aus dem
 * Quelltext") für `apps/outlook-addin` klafft — laut Auftrag der
 * wahrscheinlichere der beiden Fälle: HTTPS statt HTTP, ein eigener
 * Bündelort, und ein Web Worker, dessen Ladeweg zwischen `vite`-Entwicklung
 * und `vite build` bekanntermaßen unterschiedlich ist.
 *
 * Läuft gegen `tests/e2e/playwright.outlook-build.config.ts`. Der globale
 * Aufbau dort baut `apps/outlook-addin` (`vite build`) und liefert genau
 * dieses Ergebnis über den echten, unveränderten `startTaskpaneServer()` aus
 * `apps/local-api/src/taskpane/server.ts` aus (T-053) — nicht über eine
 * Attrappe.
 *
 * **Gemessen statt angenommen (Befund dieser Aufgabe):** Diese Maschine
 * erreicht `appsforoffice.microsoft.com` tatsächlich — das `<script>` aus
 * `index.html` lädt, `window.Office` entsteht, und `Office.onReady()` löst
 * innerhalb der Host-Zeitgrenze auf (`office/host.ts#readHost`). Ohne echtes
 * Outlook-Fenster bleibt `Office.context.mailbox.item` dabei `undefined` —
 * der Zustand landet deshalb bei `HostState.kind === 'no_item'`.
 *
 * Seit der Outlook-Hostdiagnose sind die beiden davor liegenden Fehlerzustände
 * getrennt: `office_js_unavailable`, wenn `office.js` gar kein `Office`
 * bereitstellt, und `office_not_ready`, wenn `Office.onReady()` trotz geladener
 * Schnittstelle innerhalb von 15 Sekunden nicht antwortet. TP-BUILD-03 darf
 * außerhalb eines echten Outlook-Wirts jeden dieser drei abgeschlossenen
 * Zustände sehen; nur ein dauerhaftes „Wird geladen“ oder eine leere Seite
 * wäre der gesuchte Fund.
 *
 * TP-BUILD-04 ist der eigentliche Fund-oder-Nichtfund dieser Datei: Der
 * Testbereich in `SettingsView.tsx` (`runSample`) ruft `evaluate()` auf, und
 * `App.tsx` wählt dafür `createTimedEvaluator({ spawn: spawnBrowserChannel })`,
 * sobald `supportsWorker()` wahr ist — **immer**, unabhängig vom Office-Wirt.
 * `spawnBrowserChannel()` ist die einzige Stelle im Add-in, die
 * `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`
 * aufruft — genau die Vite-Schreibweise, die im Entwicklungsbetrieb und im
 * Bauergebnis unterschiedliche Bündel erzeugt (ein eigener Chunk
 * `worker-*.js` im Bau, siehe `apps/outlook-addin/dist/assets/`). Schlägt der
 * Ladeweg des Worker-Chunks im Bauergebnis fehl, bleibt der Testbereich bei
 * `SampleOutcome` in `idle` oder `problem` stehen, nie bei `match` — das ist
 * die messbare Grenze zwischen „lädt" und „lädt nicht".
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.describe('TP-BUILD-03 — ohne Office-Wirt', () => {
  test('das gebaute Bündel lädt vollständig und zeigt den vorgesehenen Zustand', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/');

    await expect(page.locator('.shell__brand')).toContainText('SuperTakt');

    const officeJsUnavailable = page.getByText(
      'Die Outlook-Schnittstelle konnte nicht geladen werden.',
      { exact: false },
    );
    const officeNotReady = page.getByText(
      'Outlook hat den Aufgabenbereich noch nicht initialisiert.',
      { exact: false },
    );
    const noEmailOpen = page.getByText('eine E-Mail, um daraus ein Todo anzulegen.', {
      exact: false,
    });
    await expect(officeJsUnavailable.or(officeNotReady).or(noEmailOpen)).toBeVisible();
    await expect(page.locator('.shell__body')).not.toContainText('Wird geladen');

    // Ein scheiterndes `<script src="https://appsforoffice.microsoft.com/…">`
    // wäre kein `console.error`, den Playwright hier sähe — es betrifft nur
    // TP-BUILD-03s Randbedingung (siehe Dateikopf), nicht das Bündel selbst.
    expect(pageErrors).toEqual([]);

    // Gemessen, nicht angenommen (zweiter Befund dieser Aufgabe): Chromium
    // meldet zuverlässig `The Content Security Policy directive
    // 'frame-ancestors' is ignored when delivered via a <meta> element.` —
    // Browser wenden `frame-ancestors`/`sandbox` aus einem
    // `<meta http-equiv="Content-Security-Policy">` grundsätzlich nicht an
    // (nur aus einem echten HTTP-Kopf). Das liegt an `index.html` selbst
    // (`apps/outlook-addin/index.html`, unverändert seit vor T-055) und tritt
    // im Entwicklungsbetrieb identisch auf, weil Vite Kopfzeilen-`<meta>`s
    // unverändert durchreicht — keine Eigenschaft des Bauergebnisses und
    // damit kein Fund dieser Aufgabe, deshalb ausdrücklich herausgefiltert
    // statt stillschweigend zu bestehen.
    const relevantConsoleErrors = consoleErrors.filter(
      (text) =>
        !text.includes('appsforoffice.microsoft.com') &&
        !text.includes("'frame-ancestors' is ignored when delivered via a <meta> element"),
    );
    expect(relevantConsoleErrors).toEqual([]);
  });
});

test.describe('TP-BUILD-04 — der Web Worker der Call-Nummer-Erkennung', () => {
  test('der Testbereich aus S-13 erkennt das Vorgabemuster über den echten Worker-Chunk', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Einstellungen öffnen' }).click();

    // Vorgabemuster und Vorgabe-Beispieltext stimmen laut Quelltext bewusst
    // überein (`PATTERN_CATALOG[0]`, `DEFAULT_PATTERN = PATTERN_CATALOG[0].source`)
    // — beide Felder bleiben unverändert, damit dieser Fall ausschließlich den
    // Ladeweg des Worker-Chunks prüft und nicht die Auswertungslogik selbst
    // (die hat ihren eigenen Nachweis gegen einen Node-Worker, siehe
    // `evaluate.ts`-Dateikopf).
    await page.getByLabel('Regulärer Ausdruck (für Fortgeschrittene)').fill('\\b(TCK-\\d{6})\\b');
    await page.getByRole('button', { name: 'Ausdruck auf den Beispieltext anwenden' }).click();

    // `Callout`s Titel ist ein `<p class="callout__title">`, keine Überschrift
    // (`apps/outlook-addin/src/ui/Primitives.tsx`) — deshalb über die Klasse
    // und nicht über `getByRole('heading', …)` gesucht. Der übernommene Wert
    // steht daneben als `<bdi class="mono">` (seit T-119; zuvor `<span
    // class="mono">` — reiner Kommentarbefund aus T-119/T-120, der Locator
    // sucht über die Klasse und traf beide Fassungen unverändert). „TCK-000042"
    // kommt außerdem im Musterkatalog (Auswahlliste) und im Beispieltext
    // (Textfeld) vor — der Treffer wird deshalb bewusst auf den
    // Erfolgs-Callout eingegrenzt, sonst träfe `getByText()` im
    // Playwright-Strict-Mode mehrere Elemente.
    const successCallout = page.locator('.callout--success', { hasText: 'Erkannt' });
    await expect(successCallout).toBeVisible();
    await expect(successCallout.locator('.mono')).toHaveText('TCK-000042');
    await page.getByLabel('Regulärer Ausdruck (für Fortgeschrittene)').fill('.*');
    await page.getByRole('button', { name: 'Ausdruck speichern', exact: true }).click();
    await expect(page.getByText('Dieser Ausdruck trifft auch auf leeren Text zu und wurde nicht gespeichert.', { exact: true })).toBeVisible();
    await page.getByLabel('Regulärer Ausdruck (für Fortgeschrittene)').fill('');
    await page.getByRole('button', { name: 'Ausdruck speichern', exact: true }).click();
    await expect(page.locator('.callout--success', { hasText: 'Gespeichert' })).toBeVisible();

  });
});

test.describe('A-10.11 — gebautes Formular mit Office- und API-Mocks', () => {
  for (const action of ['append', 'create', 'no_match'] as const) test(`Mail übernehmen: ${action}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 850 });
    const status = '00000000-0000-4000-8000-000000000001';
    const tag = '00000000-0000-4000-8000-000000000002';
    const todo = '00000000-0000-4000-8000-000000000003';
    const context = {
      mailAssignment: { accepted: true }, emailAttachments: { accepted: true },
      statuses: [{ id: status, name: 'Inbox', position: 0, isDefault: true }], defaultStatusId: status,
      defaultTagIds: [], pools: [], tagTree: { rootTags: [], rootFolders: [{ folder: { id: 'folder', parentId: null, name: 'Kunden' }, tags: [], subfolders: [{ folder: { id: 'subfolder', parentId: 'folder', name: 'Nord' }, subfolders: [], tags: [{ id: tag, folderId: 'subfolder', name: 'Wartung', color: null }] }] }] },
    };
    await page.addInitScript(({ status, tag }) => {
      localStorage.setItem('takt.addin.token', 'takt_test');
      localStorage.setItem('takt.addin.defaults', JSON.stringify({ statusId: status, tagIds: [tag], includeExcerpt: false, theme: 'dark' }));
    }, { status, tag });
    await page.route('https://appsforoffice.microsoft.com/**', route => route.fulfill({ contentType: 'text/javascript', body: `
      window.Office = {
        AsyncResultStatus: { Succeeded: 'succeeded' }, CoercionType: { Text: 'text' }, EventType: { ItemChanged: 'changed' },
        onReady: callback => { if(callback) callback({host:'Outlook', platform:'test'}); return Promise.resolve({host:'Outlook'}); },
        context: { requirements: { isSetSupported: () => true }, mailbox: {
          addHandlerAsync: () => {}, item: { subject: 'AW: CALL24470', internetMessageId: '<build@example.test>',
            from: {displayName:'Beispiel', emailAddress:'build@example.test'}, attachments: [],
            body: { getAsync: (_type, callback) => callback({status:'succeeded',value:'Auszug aus der Mail'}) },
            getAsFileAsync: callback => callback({status:'succeeded',value:btoa('Subject: test\\r\\n\\r\\nbody')})
          }
        } }
      };
    ` }));
    const requests: Record<string, unknown>[] = [];
    await page.route('http://127.0.0.1:17843/**', async route => {
      const request = route.request();
      const headers = { 'Access-Control-Allow-Origin': 'https://127.0.0.1:17944', 'Access-Control-Allow-Headers': 'Content-Type, X-Takt-Token', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      let data: unknown = context;
      if (request.url().includes('todo-matches')) data = { searched: true, callNumber: '24470', matches: action === 'no_match' ? [] : [{ id: todo, title: 'Vorhandene Aufgabe', callNumber: '24470', statusId: status, tagIds: [tag], completedAt: null, openSeconds: 0, exportedSeconds: 0, poolMovement: null }] };
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        requests.push(body);
        data = { outcome: action === 'append' ? 'appended' : 'created', todo: { id: todo, title: body['title'] ?? 'Vorhandene Aufgabe', dueDate: body['dueDate'], dueTime: body['dueTime'], estimateMinutes: body['estimateMinutes'] }, createdTags: [], addedDefaultTagIds: [], attachments: { stored: 1, rejected: [] } };
      }
      await route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ data }) });
    });
    await page.goto('/');
    if (action === 'no_match') {
      await expect(page.getByLabel('Titel', { exact: true })).toBeVisible();
      await expect(page.getByRole('radio', { name: /Zur Aufgabe ergänzen/ })).toHaveCount(0);
    } else {
      await expect(page.getByRole('radio', { name: /Zur Aufgabe ergänzen/ })).toBeChecked();
      await expect(page.getByLabel('Titel', { exact: true })).toHaveCount(0);
    }
    await expect(page.getByLabel('Zeitschätzung in Minuten')).toHaveCount(0);
    await page.getByLabel('Vermerk (bleibt in SuperTakt)').fill('Meine eigene Notiz');
    await page.getByLabel('E-Mail-Auszug in die Notizen übernehmen').check();
    await page.getByLabel('E-Mail-Auszug in die Notizen übernehmen').uncheck();
    await expect(page.getByLabel('Vermerk (bleibt in SuperTakt)')).toHaveValue('Meine eigene Notiz');
    if (action === 'append') {
      await page.getByRole('button', { name: 'E-Mail an Aufgabe anhängen', exact: true }).click();
      await expect.poll(() => requests.length).toBe(1);
      expect(requests[0]).toMatchObject({ note: 'Meine eigene Notiz', mail: { excerpt: null }, attachments: { items: [{ kind: 'message' }] } });
      expect(requests[0]).not.toHaveProperty('estimateMinutes');
      expect(requests[0]).not.toHaveProperty('durationSeconds');
      await expect(page.getByText('Vorhandene Aufgabe', { exact: true })).toBeVisible();
      return;
    }
    if (action === 'create') await page.getByRole('button', { name: 'Stattdessen neue Aufgabe erstellen', exact: true }).click();
    await page.getByLabel('Titel', { exact: true }).fill('Bewusste Neuanlage');
    await page.getByLabel('Frist', { exact: true }).fill('2026-10-25');
    await page.getByLabel('Fälligkeitsuhrzeit (optional)').fill('02:30');
    await expect(page.getByLabel('Zeitschätzung in Minuten')).toHaveCount(0);
    await page.getByRole('button', { name: 'Kunden', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Nord', exact: true })).toHaveCount(0);
    await page.getByLabel('Tags', { exact: true }).fill('Wartung');
    await expect(page.getByRole('button', { name: 'Kunden', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nord', exact: true })).toBeVisible();
    await page.getByLabel('Tags', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Kunden', exact: true }).click();
    await page.getByRole('button', { name: 'Referenzdaten neu laden' }).click();
    await expect(page.getByLabel('Titel', { exact: true })).toHaveValue('Bewusste Neuanlage');
    await expect(page.getByLabel('Frist', { exact: true })).toHaveValue('2026-10-25');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByText('Wartung', { exact: true }).first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.locator('.tagpicker').evaluate(element => element.scrollIntoView({ block: 'center' }));
    await page.locator('.tagpicker').screenshot({ path: test.info().outputPath('tags.png') });
    await page.getByRole('button', { name: 'Neue Aufgabe anlegen', exact: true }).click();
    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]).toMatchObject({ title: 'Bewusste Neuanlage', mode: action === 'no_match' ? 'auto' : 'new', statusId: status, tagIds: [tag], dueDate: '2026-10-25', dueTime: '02:30', estimateMinutes: null, note: 'Meine eigene Notiz', mail: { excerpt: null, internetMessageId: '<build@example.test>' } });
    await expect(page.getByText('Bewusste Neuanlage', { exact: true })).toBeVisible();
  });
});


test('manifest icons decode and allow Office caching; HTML stays uncached', async ({ page, request }) => {
  for (const size of [16, 32, 64, 80, 128]) {
    const response = await request.get(`/assets/takt-${size}.png`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect(response.headers()['cache-control']).toBeUndefined();
    await page.goto(`/assets/takt-${size}.png`);
    await expect.poll(() => page.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(size);
  }
  const html = await request.get('/index.html');
  expect(html.headers()['cache-control']).toBe('no-store');
});


test('the single Outlook ribbon command opens the task pane for mail assignment', async ({ page }) => {
  const manifest = readFileSync(new URL('../../apps/outlook-addin/manifest.xml', import.meta.url), 'utf8');
  await page.setContent('<div id="manifest-check"></div>');
  const commands = await page.evaluate(xml => {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    return {
      errors: document.getElementsByTagName('parsererror').length,
      actions: Array.from(document.getElementsByTagName('Action')).map(node => node.getAttribute('xsi:type')),
      label: Array.from(document.getElementsByTagNameNS('*', 'String')).find(node => node.getAttribute('id') === 'paneButtonLabel')?.getAttribute('DefaultValue'),
    };
  }, manifest);
  expect(commands).toEqual({ errors: 0, actions: ['ShowTaskpane'], label: 'E-Mail anhängen' });
});
