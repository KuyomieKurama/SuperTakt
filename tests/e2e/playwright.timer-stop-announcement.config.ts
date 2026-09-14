// Takt — Ausführungskonfiguration für die Neustart-Vorrichtung von
// `timer-stop-announcement.spec.ts` (T-352, aus `T-350-domain-dev.md`
// Abschnitt 5 und `docs/testplan.md` Abschnitt 34/35): ein echter
// Prozess-Neustart des lokalen Dienstes, damit `captureTimerRecovery`
// (`apps/local-api/src/features/timer/timer.ts`) einen vor dem Neustart
// gestarteten Timer beim Hochfahren als verwaist vorfindet (E-036).
//
// Eigene Konfiguration, nicht die Hauptreihe (`playwright.config.ts`): Diese
// Datei beendet den lokalen Dienst mitten im Testlauf und startet ihn neu
// (`support/services.ts#restartLocalApi`). Liefe das gegen die geteilte
// Ausführung der Hauptreihe, risse es jeder anderen, gleichzeitig oder danach
// laufenden Spezifikationsdatei den Dienst unter den Füßen weg — derselbe
// Grund, aus dem `attachment-persistence-live.spec.ts` und
// `version-check-live.spec.ts` eigene Konfigurationen brauchen.
//
// `globalSetup` startet **nur** die Oberfläche (`global-setup-timer-stop
// -announcement.ts`) — dieselbe Lage wie bei `TP-ANH-10`/`TP-VER-11`/`-12`:
// Ein `globalSetup` läuft in einem eigenen Prozess, ein dort gehaltenes
// `ChildProcess` ist im Testprozess nicht mehr greifbar. Der lokale Dienst
// startet deshalb **innerhalb** der Spezifikationsdatei selbst
// (`test.beforeAll`), über die bereits exportierten
// `startLocalApi`/`restartLocalApi` aus `support/services.ts` — echter
// Dienst, echte Oberfläche, kein Attrappen-Server, wie in der Hauptreihe.
//
// Läuft nie gleichzeitig mit `playwright.config.ts`: derselbe Port (17843).
//
// Aufruf: pnpm exec playwright test -c tests/e2e/playwright.timer-stop-announcement.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'timer-stop-announcement.spec.ts',

  fullyParallel: false,
  workers: 1,

  retries: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },

  forbidOnly: process.env['CI'] !== undefined,

  globalSetup: './support/global-setup-timer-stop-announcement.ts',

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../../playwright-report-timer-stop-announcement' }],
  ],
  outputDir: '../../test-results-timer-stop-announcement',

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
