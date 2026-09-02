// Takt — End-zu-Ende-Tests, Ausführungskonfiguration (T-012).
//
// Der Rahmen in der Wurzel (`playwright.config.ts`) gehört nicht dem
// e2e-tester und hat ausdrücklich noch keinen `webServer`-Eintrag ("in Welle
// 2 startet T-012 die Anwendung, ... ein geratener Startbefehl hier wäre ein
// stiller Fehlstart"). Diese Datei liegt unter `tests/e2e/**` (Dateihoheit
// e2e-tester) und übernimmt genau das: `globalSetup` startet den echten
// lokalen Dienst und die echte Oberfläche (siehe `support/services.ts`),
// `globalSetup` gibt die Abbaufunktion zurück.
//
// Aufruf: pnpm exec playwright test -c tests/e2e/playwright.config.ts
//
// Sobald der Orchestrator entscheidet, wie der Wurzel-Rahmen die Anwendung
// startet, kann diese Datei entweder aufgehen (`globalSetup` dorthin
// verschoben) oder bestehen bleiben — beides ändert nichts an den Testfällen
// selbst.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',

  // T-055: `web-build-smoke.spec.ts` und `outlook-addin-build.spec.ts`
  // brauchen ihre eigenen Ausführungskonfigurationen (`playwright.web-build
  // .config.ts`, `playwright.outlook-build.config.ts`) — ein gebautes
  // `apps/web`/`apps/outlook-addin`, nicht den Entwicklungsserver, den
  // `support/global-setup.ts` hier startet. Ohne diesen Ausschluss liefe
  // TP-BUILD-01 hier gegen den laufenden **Entwicklungsserver** und schlüge
  // fehl — nicht weil das Bauergebnis bräche, sondern weil es dann gar nicht
  // das Bauergebnis wäre, das da liefe. Gemessen: ohne diese Zeile wird der
  // zuvor durchgehend grüne Bestand dieser Datei auf 29 bestanden/3
  // fehlgeschlagen verschoben, exakt durch diese beiden Dateien.
  testIgnore: ['web-build-smoke.spec.ts', 'outlook-addin-build.spec.ts'],

  // Ein einziger lokaler Dienst, eine einzige SQLite-Datei (E-001, E-018).
  // Zwei gleichzeitig laufende Testdateien zögen sich gegenseitig Buchungen
  // unter den Füßen weg — deshalb seriell, wie im Wurzel-Rahmen begründet.
  fullyParallel: false,
  workers: 1,

  // Diese Maschine faehrt mehrere Team-Agenten gleichzeitig (Builds,
  // Mutationstests, weitere Playwright-Laeufe) — echte, aber
  // fremdverursachte Verzoegerung, keine Unzuverlaessigkeit der Anwendung
  // selbst. `retries: 1` faengt genau das ab; Playwright meldet einen
  // Fall, der erst beim zweiten Versuch gelingt, ausdruecklich als
  // "flaky" und nicht als "passed" — nichts wird dadurch verschleiert.
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },

  globalSetup: './support/global-setup.ts',

  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report-e2e' }]],
  outputDir: '../../test-results-e2e',

  use: {
    baseURL: 'http://127.0.0.1:5173',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
