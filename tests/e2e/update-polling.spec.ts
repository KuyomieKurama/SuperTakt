import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { installShellShim } from './support/shell-shim';
const entry = '/@fs/' + fileURLToPath(new URL('./support/update-polling.html', import.meta.url)).replace(/^\//, '');

for (const skipped of [false, true]) test(`startup result reaches the UI without focus theft; skipped=${skipped}`, async ({ page }) => {
  let reads = 0;
  let known = false;
  let fail = false;
  let skippedVersion = skipped ? '2.0.0' : null;
  await page.addInitScript(installShellShim, {
    baseUrl: '/update-fixture', headerName: 'X-Test', secret: 'fixture',
    osUser: { name: 'test', qualified_name: null, source: 'fixture', trusted: false },
    shellState: { directory: null, problems: [], service_exit: null },
    quit: 'resolve' as const, installedVersion: '1.0.0',
  });
  await page.clock.install();
  await page.route('**/update-fixture/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/update-fixture', '');
    let data: unknown = [];
    if (path === '/version-check') {
      reads++;
      if (fail) { await route.fulfill({ status: 503, json: { error: { code: 'unavailable', message: 'offline' } } }); return; }
      data = { state: known ? 'known' : 'unknown', latestVersion: known ? '2.0.0' : null };
    } else if (path === '/settings') {
      if (route.request().method() === 'PATCH') {
        skippedVersion = route.request().postDataJSON().skippedVersion;
        data = { skippedVersion };
      } else data = { settings: { skippedVersion }, defaultTags: [], windowsUser: 'Test', exportDirectoryState: 'ok' };
    } else if (path === '/tag-tree') data = { rootFolders: [], rootTags: [] };
    await route.fulfill({ json: { data } });
  });
  await page.goto(entry);
  await expect.poll(() => reads).toBe(1);
  const note = page.getByRole('textbox', { name: 'Vermerk', exact: true });
  await note.fill('Weiterarbeiten');
  known = true;
  await page.clock.runFor(5_000);
  await expect.poll(() => reads).toBe(2);
  if (skipped) {
    await expect(page.locator('.updatebar')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    return;
  }
  await expect(page.locator('.updatebar')).toContainText('2.0.0');
  await expect(note).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  fail = true;
  await page.clock.runFor(300_000);
  await expect.poll(() => reads).toBe(3);
  await expect(page.locator('.updatebar')).toContainText('2.0.0');
  fail = false;
  await page.clock.runFor(5_000);
  await page.evaluate(() => { window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('focus')); });
  await expect.poll(() => reads).toBe(4);
  await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }));
  await page.clock.runFor(300_000);
  expect(reads).toBe(4);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => reads).toBe(5);
  await page.getByRole('button', { name: 'Ansehen', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Überspringen', exact: true }).click();
  await expect(page.locator('.updatebar')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Vermerk', exact: true })).toBeVisible();
  await expect(page.locator('.updatebar')).toHaveCount(0);
});
