import { defineConfig } from '@playwright/test';
import { browserUse, chromiumProjects } from './playwright.shared';

export default defineConfig({
  testDir: '.', testMatch: 'outlook-certificate.spec.ts', workers: 1, retries: 0,
  reporter: [['list']], outputDir: '../../test-results-outlook-certificate',
  webServer: { command: 'pnpm --filter @takt/web exec vite --host 127.0.0.1 --port 5191 --strictPort',
    url: 'http://127.0.0.1:5191', reuseExistingServer: false },
  use: { ...browserUse, baseURL: 'http://127.0.0.1:5191' }, projects: chromiumProjects,
});
