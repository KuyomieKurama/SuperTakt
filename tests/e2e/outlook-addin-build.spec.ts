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
 * innerhalb der 5-Sekunden-Grenze auf (`office/host.ts#readHost`). Ohne echtes
 * Outlook-Fenster bleibt `Office.context.mailbox.item` dabei `undefined` —
 * der Zustand landet deshalb bei `HostState.kind === 'no_item'`
 * ("Keine E-Mail geöffnet"), nicht bei `no_host` ("Kein Outlook"), wie eine
 * erste Fassung dieser Datei angenommen hatte, bevor der Lauf das
 * widerlegte. Beide sind in `office/host.ts`/`App.tsx#Body` als reguläre,
 * fehlerfreie Zustände benannt; TP-BUILD-03 prüft deshalb auf **einen von
 * beiden**, nicht auf einen bestimmten — welcher es wird, hängt von der
 * Erreichbarkeit dieser einen externen Adresse ab und ist nicht Gegenstand
 * dieser Aufgabe (T-055 misst `apps/outlook-addin`, nicht Microsofts CDN).
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

test.describe('TP-BUILD-03 — ohne Office-Wirt', () => {
  test('das gebaute Bündel lädt vollständig und zeigt den vorgesehenen Zustand', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/');

    await expect(page.locator('.shell__brand')).toContainText('Takt');

    // Beide Zustände sind aus `App.tsx#Body` — `no_host` ("Kein Outlook")
    // oder `no_item` ("Keine E-Mail geöffnet"), je nachdem, ob `office.js`
    // von seiner externen Herkunft laden konnte (siehe Dateikopf). Beides
    // ist ein regulärer, erwarteter Zustand; nur ein dauerhaftes „Wird
    // geladen" (Ladeplatzhalter, `host === null`) oder eine leere Seite wäre
    // der gesuchte Fund.
    const outsideOutlook = page.getByText('Dieser Bereich läuft außerhalb von Outlook.', { exact: false });
    // O-GE (T-192, E-080): `App.tsx` duzt an dieser einen Stelle noch
    // ("Öffne eine E-Mail, um daraus ein Todo anzulegen.") — die einzige
    // Stelle, die der E-080-Anredewächter im Add-in bislang duldet, weil
    // dieser Prüffall den Satz bis hierher wörtlich festhielt
    // (`IMPERATIV_AUSNAHME` in `apps/outlook-addin/scripts/proof-addin.mjs`,
    // T-190). Der Vergleich hängt jetzt an dem Teil des Satzes, der in der
    // heutigen Du-Form und der künftigen, gesiezten Fassung „Öffnen Sie eine
    // E-Mail, um daraus ein Todo anzulegen." wörtlich gleich bleibt, und
    // trägt damit beide, ohne selbst an der Anrede zu hängen — wird `App.tsx`
    // entsprechend umgestellt, bleibt dieser Fall unverändert grün.
    const noEmailOpen = page.getByText('eine E-Mail, um daraus ein Todo anzulegen.', { exact: false });
    await expect(outsideOutlook.or(noEmailOpen)).toBeVisible();
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
  });
});
