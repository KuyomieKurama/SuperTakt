// Takt — Ausführungskonfiguration für die Bauergebnis-Prüfung von `apps/web` (T-055).
//
// Läuft gegen `vite build` + `vite preview`, nicht gegen den Entwicklungsserver
// aus `tests/e2e/playwright.config.ts`. Beide Konfigurationen binden denselben
// Port (5173, siehe `support/build-check-session.ts`) und laufen deshalb nie
// gleichzeitig — genau wie die Wurzel-`playwright.config.ts` und
// `tests/e2e/playwright.config.ts` das schon nicht tun.
//
// Aufruf: pnpm exec playwright test -c tests/e2e/playwright.web-build.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'web-build-smoke.spec.ts',

  fullyParallel: false,
  workers: 1,

  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },

  globalSetup: './support/global-setup-web-build.ts',

  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report-web-build' }]],
  outputDir: '../../test-results-web-build',

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
