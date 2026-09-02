// Takt — Ausführungskonfiguration für die Bauergebnis-Prüfung von
// `apps/outlook-addin` (T-055).
//
// `ignoreHTTPSErrors: true` ist eine bewusste Grenze dieser Prüfung, keine
// Nachlässigkeit: Sie gilt der Frage, ob das gebaute Bündel über den echten
// Aufgabenbereich-Server funktional lädt und läuft (Modul-/Worker-Auflösung,
// relative Pfade aus `base: './'`) — nicht der Frage, ob eine TLS-Kette einem
// Zertifikatsspeicher vertraut. Letzteres hat `apps/local-api/scripts/proof-taskpane.mjs`
// bereits mit einem echten `https.request` gegen die eigene Zertifikatswurzel
// geprüft (X.509, `subjectAltName`, Laufzeit) — dieselbe Zertifikatslogik läuft
// hier unverändert mit, nur der Browser übernimmt hier keine CA-Prüfung.
//
// Aufruf: pnpm exec playwright test -c tests/e2e/playwright.outlook-build.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'outlook-addin-build.spec.ts',

  fullyParallel: false,
  workers: 1,

  retries: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  globalSetup: './support/global-setup-outlook-build.ts',

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../../playwright-report-outlook-build' }],
  ],
  outputDir: '../../test-results-outlook-build',

  use: {
    baseURL: 'https://127.0.0.1:17944',
    ignoreHTTPSErrors: true,
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
