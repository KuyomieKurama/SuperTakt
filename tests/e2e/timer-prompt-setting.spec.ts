import { test, expect } from '@playwright/test';
import { cleanupAnyTimer, createTodo, deleteTimeEntry, deleteTodo, getSettings, listTimeEntriesByTodo, setTimerPrompt } from './support/api';
import { gotoTodo } from './support/nav';

test('A-22.1: Leistungsabfrage ausschalten, direkt buchen und wieder einschalten', async ({ page }) => {
  const original = (await getSettings()).promptOnTimerStop;
  const todo = await createTodo({ title: `E2E-Timer-Einstellung-${Date.now()}` });
  try {
    await cleanupAnyTimer();
    await setTimerPrompt(true);
    await page.goto('/#/einstellungen?bereich=timer');
    const prompt = page.getByRole('checkbox', { name: 'Leistung beim Stoppen abfragen' });
    await expect(prompt).toBeChecked();
    const saved = page.waitForResponse((r) => r.url().endsWith('/settings') && r.request().method() === 'PATCH');
    await prompt.uncheck();
    expect((await saved).ok()).toBe(true);
    await page.reload();
    await expect(prompt).not.toBeChecked();

    await gotoTodo(page, todo.id);
    const main = page.locator('#inhalt');
    await main.getByRole('button', { name: 'Timer starten', exact: true }).first().click();
    await expect(main.getByRole('button', { name: 'Timer stoppen', exact: true })).toBeVisible();
    await page.waitForTimeout(1200); // The real timer must exceed the discard threshold.
    const stopped = page.waitForResponse((r) => r.url().endsWith('/timer/stop') && r.request().method() === 'POST');
    await main.getByRole('button', { name: 'Timer stoppen', exact: true }).click();
    expect((await stopped).ok()).toBe(true);
    await expect(page.getByRole('dialog', { name: 'Timer stoppen', exact: true })).toBeHidden();
    const entries = await listTimeEntriesByTodo(todo.id);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.note).toBe('');
    const entry = entries[0];
    if (entry === undefined) throw new Error('Zeitbuchung fehlt');
    expect(Date.parse(entry.endedAt) - Date.parse(entry.startedAt)).toBeGreaterThanOrEqual(1000);

    await setTimerPrompt(true);
    await page.reload();
    await main.getByRole('button', { name: 'Timer starten', exact: true }).first().click();
    await main.getByRole('button', { name: 'Timer stoppen', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Timer stoppen', exact: true })).toBeVisible();
  } finally {
    await cleanupAnyTimer();
    await setTimerPrompt(original);
    for (const entry of await listTimeEntriesByTodo(todo.id)) await deleteTimeEntry(entry.id);
    await deleteTodo(todo.id);
  }
});
