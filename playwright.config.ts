// Takt — End-zu-Ende-Tests (T-008a).
//
// Die Testdateien selbst gehören e2e-tester (T-012); hier steht nur der Rahmen.
import { defineConfig, devices } from '@playwright/test';

const imBauserver = process.env['CI'] !== undefined;

export default defineConfig({
  testDir: 'tests/e2e',

  // Takt schreibt in eine einzige lokale SQLite-Datei (E-001, E-018). Zwei
  // gleichzeitig laufende Testdateien würden sich denselben Bestand teilen und
  // einander die Zeitbuchungen unter den Füßen wegziehen. Deshalb seriell —
  // das ist kein Versehen und keine vorläufige Bremse.
  fullyParallel: false,
  workers: 1,

  forbidOnly: imBauserver,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Der HTML-Bericht wird nie von selbst geöffnet: Ein Testlauf, der einen
  // Browser aufreißt, ist in einer Kette aus Prüfungen ein Ärgernis.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://127.0.0.1:5173',

    // Die Oberfläche ist deutsch (CLAUDE.md), und die Rundung hängt am
    // Kalendertag der Startzeit (E-025). Datumsformat, Dezimalkomma und
    // Tagesgrenze müssen im Test dieselben sein wie beim Benutzer.
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Kein `webServer`-Eintrag: In Welle 2 startet T-012 die Anwendung, und ob
  // das der Vite-Server, der Sidecar oder die Tauri-Hülle ist, steht noch nicht
  // fest. Ein geratener Startbefehl hier wäre ein stiller Fehlstart.
});
