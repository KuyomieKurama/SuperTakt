// Takt — End-zu-Ende-Tests, Ausführungskonfiguration (T-012).
//
// Diese Datei ist der Rahmen für alle Playwright-E2E-Läufe (Dateihoheit
// e2e-tester, `tests/e2e/**`). Der frühere Wurzel-`playwright.config.ts`
// wurde in T-085 entfernt — zwei Konfigurationen nebeneinander waren eine
// zu viel, und die falsche wurde benutzt. `globalSetup` startet den echten
// lokalen Dienst und die echte Oberfläche (siehe `support/services.ts`),
// `globalSetup` gibt die Abbaufunktion zurück.
//
// Aufruf: pnpm test:e2e
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
  //
  // T-142: `version-check-live.spec.ts` läuft gegen `version-check-entry.ts`
  // statt gegen `apps/local-api/src/index.ts` (`playwright.version-check
  // .config.ts`) — derselbe Grund, derselbe Port (17843), dieselbe Bauart des
  // Ausschlusses.
  //
  // T-150: `attachment-persistence-live.spec.ts` beendet den lokalen Dienst
  // mitten im Lauf und startet ihn neu (`support/services.ts#restartLocalApi`,
  // TP-ANH-10 Stufe 2) — geschähe das hier, risse es jeder anderen Datei
  // dieser Reihe den Dienst unter den Füßen weg. Eigene Konfiguration,
  // derselbe Port, derselbe Ausschlussgrund.
  testIgnore: [
    'web-build-smoke.spec.ts',
    'outlook-addin-build.spec.ts',
    'version-check-live.spec.ts',
    'attachment-persistence-live.spec.ts',
  ],

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

  // Ein vergessenes `test.only` soll im Bauserver rot sein, nicht still den
  // Rest der Suite überspringen (T-085; stand vorher nur im inzwischen
  // entfernten Wurzel-`playwright.config.ts`).
  forbidOnly: process.env['CI'] !== undefined,

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
