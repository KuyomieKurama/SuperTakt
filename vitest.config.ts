import { defineConfig } from 'vitest/config';

// Gemeinsame Mindestabdeckung der drei Fachpakete; jede Glob-Regel erhält alle vier Werte.
const coverageThresholds = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

export default defineConfig({
  test: {
    include: [
      'packages/*/test/**/*.{test,spec}.{ts,tsx,mts}',
      'apps/*/test/**/*.{test,spec}.{ts,tsx,mts}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],

    // DOM-Tests wählen ihre Umgebung über @vitest-environment selbst.
    environment: 'node',
    globals: false,
    restoreMocks: true,

    // Gleicher Kalendertag wie im Export (S-13, E-025).
    env: {
      TZ: 'Europe/Berlin',
      LANG: 'de_DE.UTF-8',
    },

    coverage: {
      provider: 'v8',

      // Auch vollständig abgedeckte Dateien im Agentenlauf anzeigen (E-048).
      reporter: [['text', { skipFull: false }], 'html', 'lcov'],
      reportsDirectory: 'coverage',

      // Die Abdeckung bleibt auch bei fehlgeschlagenen Tests sichtbar.
      reportOnFailure: true,
      include: [
        'packages/domain/src/**/*.ts',
        'packages/storage/src/**/*.ts',
        'packages/export/src/**/*.ts',
      ],
      exclude: ['**/*.d.ts', '**/index.ts'],
      thresholds: {
        'packages/domain/src/**': coverageThresholds,
        'packages/storage/src/**': coverageThresholds,
        'packages/export/src/**': coverageThresholds,
      },
    },
  },
});
