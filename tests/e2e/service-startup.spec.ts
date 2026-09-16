import { test, expect } from '@playwright/test';
import { installShellShim, type ShellShimArgs } from './support/shell-shim';
import { API_BASE_URL, SESSION_SECRET, TOKEN_HEADER } from './support/session';

const SHIM_ARGS: ShellShimArgs = {
  baseUrl: API_BASE_URL,
  headerName: TOKEN_HEADER,
  secret: SESSION_SECRET,
  osUser: { name: 'e2e.startup', qualified_name: null, source: 'e2e-fixture', trusted: false },
  shellState: { directory: null, problems: [], service_exit: null },
  quit: 'resolve',
};

test('keeps data readers unmounted until the authenticated service is ready', async ({ page }) => {
  await page.addInitScript(installShellShim, SHIM_ARGS);
  let ready = false;
  let probes = 0;
  const prematureRequests: string[] = [];
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (!ready && path.startsWith('/api/v1/') && path !== '/api/v1/health') {
      prematureRequests.push(path);
    }
  });
  await page.route('**/api/v1/health', async route => {
    probes += 1;
    expect(route.request().headers()[TOKEN_HEADER.toLowerCase()]).toBe(SESSION_SECRET);
    if (!ready) await route.abort('connectionrefused');
    else await route.continue();
  });

  await page.goto('/#/');
  await expect.poll(() => probes).toBeGreaterThanOrEqual(3);
  await expect(page.getByText('SuperTakt verbindet sich mit dem lokalen Dienst …')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeHidden();
  expect(prematureRequests).toEqual([]);

  ready = true;
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.getByText('Der lokale Dienst antwortet nicht. Läuft SuperTakt noch vollständig?')).toBeHidden();
});

test('shows an authentication failure without retrying it as a slow startup', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(installShellShim, SHIM_ARGS);
  let probes = 0;
  await page.route('**/api/v1/health', async route => {
    probes += 1;
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5173' },
      body: JSON.stringify({ error: { code: 'unauthorized', message: 'E2E: Startnachweis abgewiesen.' } }),
    });
  });

  await page.goto('/#/');
  await expect(page.getByText('E2E: Startnachweis abgewiesen.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Erneut versuchen', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeHidden();
  // The development server renders StrictMode: its initial effect runs twice.
  // Each connection attempt must stop after its first authentication rejection.
  expect(probes).toBe(2);
  await page.clock.runFor(5000);
  expect(probes).toBe(2);

  // Only the user's explicit retry starts another attempt.
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(page.getByText('E2E: Startnachweis abgewiesen.')).toBeVisible();
  expect(probes).toBe(3);
  await page.clock.runFor(5000);
  expect(probes).toBe(3);
});
