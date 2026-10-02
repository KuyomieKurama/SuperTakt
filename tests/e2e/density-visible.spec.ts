import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { createPool, createTag, createTimeEntry, createTodo, deletePool, deleteTag, deleteTimeEntry, deleteTodo } from './support/api';
import { todayAt } from './support/local-time';
import { gotoBoard, gotoBookings, gotoSettings, gotoTags } from './support/nav';

type Density = 'comfortable' | 'compact';
type View = 'kanban' | 'pools' | 'bookings' | 'tree';

const screenshotDirectory = process.env['DENSITY_SCREENSHOT_DIR'];
const negativeProbe = process.env['DENSITY_NEGATIVE_PROBE'] === '1';

async function setDensity(page: Page, density: Density): Promise<void> {
  await page.evaluate((value) => {
    document.documentElement.dataset.density = value;
  }, density);
}

async function rowHeight(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().height);
}

async function openView(page: Page, view: View): Promise<Locator> {
  switch (view) {
    case 'kanban':
      await gotoBoard(page);
      return page.locator('.kcard').filter({ hasText: 'E2E-DICHTE-' }).first();
    case 'pools':
      await gotoSettings(page, 'regeln');
      return page.locator('.pool-row').filter({ hasText: 'E2E-DICHTE-' }).first();
    case 'bookings':
      await gotoBookings(page);
      return page.locator('.table tbody tr').filter({ hasText: 'E2E-DICHTE-' }).first();

    case 'tree':
      await gotoTags(page);
      return page.locator('.tree__row').filter({ hasText: 'E2E-DICHTE-' }).first();
  }
}

async function measureDensity(page: Page, view: View): Promise<{ comfortable: number; compact: number }> {
  await setDensity(page, 'comfortable');
  const comfortable = await rowHeight(await openView(page, view));
  await setDensity(page, negativeProbe ? 'comfortable' : 'compact');
  const compact = await rowHeight(await openView(page, view));
  return { comfortable, compact };
}

async function captureScreenshots(page: Page): Promise<void> {
  if (screenshotDirectory === undefined) return;

  await mkdir(screenshotDirectory, { recursive: true });
  for (const [theme, colorMode] of [['classic', 'light'], ['everfrost', 'dark']] as const) {
    for (const density of ['comfortable', 'compact'] as const) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(({ theme, colorMode, density }) => {
        document.documentElement.dataset.designTheme = theme;
        document.documentElement.dataset.theme = colorMode;
        document.documentElement.dataset.density = density;
      }, { theme, colorMode, density });
      for (const view of ['kanban', 'pools', 'bookings'] as const) {
        await openView(page, view);
        await page.screenshot({ path: join(screenshotDirectory, `req014-${theme}-${density}-${view}.png`), fullPage: false });
      }
    }
  }
}

test('compact density reduces real Kanban, pool, booking, table, and tree row heights', async ({ page }) => {
  const run = Date.now();
  const prefix = `E2E-DICHTE-${run}`;
  const tag = await createTag(`${prefix}-Tag`);
  const todo = await createTodo({ title: `${prefix}-Aufgabe`, tagIds: [tag.id] });
  const pool = await createPool({ name: `${prefix}-Pool`, placement: 'both', requiredTagIds: [tag.id] });
  const entry = await createTimeEntry({
    todoId: todo.id,
    startedAt: todayAt(12, 0),
    endedAt: todayAt(12, 15),
    note: `${prefix}-Buchung`,
  });

  try {
    const measurements = {
      kanban: await measureDensity(page, 'kanban'),
      pools: await measureDensity(page, 'pools'),
      bookings: await measureDensity(page, 'bookings'),

      tree: await measureDensity(page, 'tree'),
    };

    for (const [view, measurement] of Object.entries(measurements)) {
      expect(measurement.compact, `${view}: compact must be shorter than comfortable`).toBeLessThan(measurement.comfortable);
    }

    await captureScreenshots(page);
  } finally {
    await deleteTimeEntry(entry.id).catch(() => undefined);
    await deletePool(pool.id).catch(() => undefined);
    await deleteTodo(todo.id).catch(() => undefined);
    await deleteTag(tag.id).catch(() => undefined);
  }
});
