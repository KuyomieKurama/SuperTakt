import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const entry = '/@fs/' + fileURLToPath(new URL('./support/kanban-screenshot.html', import.meta.url)).replace(/^\//, '');
const screenshotPath = process.env['KANBAN_SCREENSHOT_PATH'];

test('captures the REQ-011 Kanban card-state fixture at desktop width', async ({ page }, testInfo) => {
  const target = screenshotPath ?? testInfo.outputPath('req011-board-1280.png');

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(entry);
  await expect(page.getByRole('heading', { name: 'Aufgaben im Überblick' })).toBeVisible();
  await expect(page.locator('.kcolumn')).toHaveCount(2);
  await expect(page.locator('.kcard')).toHaveCount(8);
  await expect(page.locator('.toast')).toHaveCount(0);
  await page.screenshot({ path: target, fullPage: false });
});
