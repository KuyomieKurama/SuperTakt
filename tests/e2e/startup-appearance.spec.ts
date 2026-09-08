import { test, expect } from '@playwright/test';

test('cached appearance stays visible until authoritative settings arrive', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.setItem('supertakt.appearance.v1', JSON.stringify({
    version: 1, theme: 'system', designTheme: 'catppuccin-macchiato', mode: 'dark', density: 'compact',
  })));
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let requested!: () => void;
  const requestStarted = new Promise<void>(resolve => { requested = resolve; });
  await page.route('**/api/v1/settings', async route => {
    requested();
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/');
    await requestStarted;
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(36, 39, 58)');
    const response = page.waitForResponse(r => r.url().endsWith('/api/v1/settings'));
    release();
    const saved = (await (await response).json()).data.settings;
    await expect(page.locator('html')).toHaveAttribute('data-design-theme', saved.designTheme === 'clear' ? 'classic' : saved.designTheme);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('supertakt.appearance.v1') ?? '{}').theme)).toBe(saved.theme);
  } finally {
    release();
  }
});
