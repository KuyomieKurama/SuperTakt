import { defineConfig } from '@playwright/test';
import { browserUse, chromiumProjects } from './playwright.shared';

export default defineConfig({
  testDir: '.', testMatch: 'kanban-layout.spec.ts', workers: 1, retries: 0,
  reporter: [['list']], outputDir: '../../test-results-kanban-layout',
  webServer: { command: 'pnpm --filter @takt/web exec vite --host 127.0.0.1 --port 5192 --strictPort',
    url: 'http://127.0.0.1:5192', reuseExistingServer: false },
  use: { ...browserUse, baseURL: 'http://127.0.0.1:5192' }, projects: chromiumProjects,
});
