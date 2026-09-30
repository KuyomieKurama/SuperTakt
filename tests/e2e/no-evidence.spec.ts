import { test, expect } from '@playwright/test';
import {
  cleanupAnyTimer,
  createTodo,
  deleteTimeEntry,
  deleteTodo,
  getSettings,
  listTimeEntriesByTodo,
  setTimerPrompt,
  updateTodoEvidenceFlags,
} from './support/api';
import { gotoTodo } from './support/nav';

test('REQ-011: ohne Nachweis stoppt ohne Leistungsdialog und ohne Abrechnung bleibt unabhängig', async ({ page }) => {
  const originalPrompt = (await getSettings()).promptOnTimerStop;
  const timestamp = Date.now();
  const noEvidenceTodo = await createTodo({ title: `E2E-Ohne-Nachweis-${timestamp}`, noEvidence: true });
  const noExportTodo = await createTodo({ title: `E2E-Nur-Ohne-Abrechnung-${timestamp}`, noExport: true });

  try {
    await cleanupAnyTimer();
    await setTimerPrompt(true);

    await gotoTodo(page, noEvidenceTodo.id);
    const main = page.locator('.screen');
    await main.getByRole('button', { name: 'Timer starten', exact: true }).first().click();
    await expect(main.getByRole('button', { name: 'Timer stoppen', exact: true })).toBeVisible();
    await page.waitForTimeout(1200);
    const stoppedWithoutEvidence = page.waitForResponse((response) =>
      response.url().endsWith('/timer/stop') && response.request().method() === 'POST',
    );
    await main.getByRole('button', { name: 'Timer stoppen', exact: true }).click();
    expect((await stoppedWithoutEvidence).ok()).toBe(true);
    await expect(page.getByRole('dialog', { name: 'Timer stoppen', exact: true })).toBeHidden();

    const entriesBeforeFlagChange = await listTimeEntriesByTodo(noEvidenceTodo.id);
    expect(entriesBeforeFlagChange).toHaveLength(1);
    await updateTodoEvidenceFlags(noEvidenceTodo.id, { noEvidence: false });
    expect(await listTimeEntriesByTodo(noEvidenceTodo.id)).toEqual(entriesBeforeFlagChange);

    await gotoTodo(page, noExportTodo.id);
    await main.getByRole('button', { name: 'Timer starten', exact: true }).first().click();
    await expect(main.getByRole('button', { name: 'Timer stoppen', exact: true })).toBeVisible();
    await main.getByRole('button', { name: 'Timer stoppen', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Timer stoppen', exact: true })).toBeVisible();
  } finally {
    await cleanupAnyTimer();
    await setTimerPrompt(originalPrompt);
    for (const todo of [noEvidenceTodo, noExportTodo]) {
      for (const entry of await listTimeEntriesByTodo(todo.id)) await deleteTimeEntry(entry.id);
      await deleteTodo(todo.id);
    }
  }
});