import { expect, test } from '@playwright/test';

import { gotoTodos } from './support/nav';

test('Ordnung und Erledigt-Schalter stehen in derselben Reihe', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await gotoTodos(page);

  const ordering = page.locator('.todo-list__ordering');
  await expect(ordering).toBeVisible();

  const select = ordering.locator('.select__trigger');
  const toggle = ordering.locator('.filter-toggle');
  const [selectBox, toggleBox] = await Promise.all([select.boundingBox(), toggle.boundingBox()]);

  expect(selectBox).not.toBeNull();
  expect(toggleBox).not.toBeNull();
  expect(Math.abs((selectBox?.y ?? 0) - (toggleBox?.y ?? 0))).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 760, height: 800 });
  const hint = ordering.locator('.field__hint');
  const [narrowHintBox, narrowToggleBox] = await Promise.all([hint.boundingBox(), toggle.boundingBox()]);

  expect(narrowHintBox).not.toBeNull();
  expect(narrowToggleBox).not.toBeNull();
  expect(narrowToggleBox?.y ?? 0).toBeGreaterThan(
    (narrowHintBox?.y ?? 0) + (narrowHintBox?.height ?? 0),
  );
});
