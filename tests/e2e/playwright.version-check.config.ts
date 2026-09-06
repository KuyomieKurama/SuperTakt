// Takt — Ausführungskonfiguration für die End-zu-Ende-Fälle der Versionsprüfung
// (T-142, `TP-VER-10` bis `TP-VER-13`, `docs/testplan.md` Abschnitt 24).
//
// Läuft gegen `version-check-entry.ts` statt gegen `apps/local-api/src/index.ts`
// (siehe `support/version-check-services.ts`) — derselbe Port (17843) wie die
// Hauptreihe, deshalb nie gleichzeitig mit `playwright.config.ts` (dieselbe
// Begründung wie bei `playwright.web-build.config.ts`).
//
// Großzügige Fristen sind hier Absicht und kein Zeichen von Unzuverlässigkeit:
// `version-check-entry.ts` benutzt denselben unveränderten Zehn-Sekunden-Takt
// wie das echte `main.ts` (`VERSION_CHECK_START_DELAY_MS`), und `TP-VER-11`/
// `-12` starten den Dienst innerhalb einer Datei mehrfach neu.
//
// Aufruf: pnpm exec playwright test -c tests/e2e/playwright.version-check.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'version-check-live.spec.ts',

  fullyParallel: false,
  workers: 1,

  retries: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },

  forbidOnly: process.env['CI'] !== undefined,

  globalSetup: './support/global-setup-version-check.ts',

  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report-version-check' }]],
  outputDir: '../../test-results-version-check',

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
