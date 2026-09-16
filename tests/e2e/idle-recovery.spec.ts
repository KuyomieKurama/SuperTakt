import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const entry = '/@fs/' + fileURLToPath(new URL('./support/idle-recovery.html', import.meta.url)).replaceAll('\\', '/').replace(/^\//, '');
import type { IdleSession } from '../../apps/web/src/features/timer/api';

test('opens immediately and keeps successive absences in one dialog until one resolution', async ({ page }) => {
  const start = new Date(Date.now() - 30 * 60_000).toISOString();
  const end = new Date(Date.now() - 20 * 60_000).toISOString();
  let session: IdleSession | null = { id: 'first', todoId: 'task', todoTitle: 'Arbeit', note: '', startedAt: start, returnedAt: null };
  let resolutions = 0;
  await page.route('**/idle-test-api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/return')) session = { ...session!, returnedAt: end };
    if (path.endsWith('/resolve')) {
      resolutions++;
      const body = route.request().postDataJSON() as { allocations: { seconds: number }[] };
      expect(body.allocations[0]?.seconds).toBe(1200);
      session = null;
      await route.fulfill({ json: { data: { recordedSeconds: 0, breakSeconds: 1200, resumed: false, alreadyResolved: false } } });
      return;
    }
    await route.fulfill({ json: { data: session } });
  });
  await page.goto(entry);
  await page.waitForFunction(() => 'setIdleSession' in window);
  await page.evaluate(value => (window as unknown as { setIdleSession(value: IdleSession): void }).setIdleSession(value), session);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Inaktive Zeit' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Als Pause übernehmen' })).toBeDisabled();
  await dialog.getByText('Sie waren inaktiv für').click();
  await expect(dialog.getByRole('button', { name: 'Als Pause übernehmen' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Später', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  session = { ...session!, id: 'second', startedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    returnedAt: new Date(Date.now() - 5 * 60_000).toISOString(), previousPeriods: [{ id: 'first', todoId: 'task', note: '', startedAt: start, returnedAt: end }] };
  await page.evaluate(value => (window as unknown as { setIdleSession(value: IdleSession): void }).setIdleSession(value), session);
  await expect(dialog).toHaveCount(1);
  await expect(dialog).toContainText('2 Inaktivitätsphasen');
  await dialog.getByRole('button', { name: 'Als Pause übernehmen' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Keine offene Zeit')).toBeVisible();
  expect(resolutions).toBe(1);
});

test('Später remains closed when the same interaction confirms a delayed return', async ({ page }) => {
  let session: IdleSession = { id: 'pending', todoId: 'task', todoTitle: 'Arbeit', note: '',
    startedAt: new Date(Date.now() - 600_000).toISOString(), returnedAt: null };
  await page.route('**/idle-test-api/**', async route => {
    if (route.request().url().endsWith('/return')) session = { ...session, returnedAt: new Date().toISOString() };
    await route.fulfill({ json: { data: session } });
  });
  await page.goto(entry);
  await page.waitForFunction(() => 'setIdleSession' in window);
  await page.evaluate(value => (window as unknown as { setIdleSession(value: IdleSession): void }).setIdleSession(value), session);
  await page.getByRole('dialog').getByRole('button', { name: 'Später', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Zeit zuordnen', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Zeit zuordnen', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
});
