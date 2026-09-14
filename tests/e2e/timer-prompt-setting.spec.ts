import { test, expect } from '@playwright/test';
import { cleanupAnyTimer, createTodo, deleteTimeEntry, deleteTodo, getSettings, getRunningTimer, listTimeEntriesByTodo, setTimerPrompt } from './support/api';
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
    // `.screen` statt `#inhalt` (T-330, E-114): Seit T-326 sitzt die Marke
    // `#inhalt` auf dem Laufbereich (`ScreenBody`), nicht mehr auf dem
    // Rahmen der Ansicht — die Knöpfe „Timer starten"/„Timer stoppen" stehen
    // im `.screen__header` und lägen damit außerhalb. `.screen` ist die
    // Ansicht selbst (Kopf **und** Laufbereich, genau ein Treffer je Route)
    // und trifft dieselbe Menge wie zuvor `#inhalt` auf `.app__main` — auch
    // nach der Navigation zu `todoB` weiter unten, weil der Locator bei
    // jeder Aktion neu ausgewertet wird.
    const main = page.locator('.screen');
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

for (const promptOnStop of [false, true]) {
  test(`Timerwechsel berücksichtigt Leistungsabfrage: ${promptOnStop}`, async ({ page }) => {
    const original = (await getSettings()).promptOnTimerStop;
    const todoA = await createTodo({ title: `E2E-Wechsel-Einstellung-A-${Date.now()}` });
    const todoB = await createTodo({ title: `E2E-Wechsel-Einstellung-B-${Date.now()}` });
    try {
      await cleanupAnyTimer();
      await setTimerPrompt(promptOnStop);
      await gotoTodo(page, todoA.id);
      // `.screen` statt `#inhalt` (T-330, E-114), siehe Anmerkung im ersten Fall dieser Datei.
      const main = page.locator('.screen');
      await main.getByRole('button', { name: 'Timer starten', exact: true }).first().click();
      await expect(main.getByRole('button', { name: 'Timer stoppen', exact: true })).toBeVisible();
      await page.waitForTimeout(1200);
      await gotoTodo(page, todoB.id);
      await main.getByRole('button', { name: 'Timer starten', exact: true }).first().click();
      const dialog = page.getByRole('dialog', { name: 'Es läuft bereits ein Timer' });
      if (promptOnStop) {
        await expect(dialog).toBeVisible();
        expect((await getRunningTimer())?.entry.todoId).toBe(todoA.id);
        await dialog.getByRole('button', { name: 'Abbrechen', exact: true }).click();
        expect((await getRunningTimer())?.entry.todoId).toBe(todoA.id);
        expect(await listTimeEntriesByTodo(todoA.id)).toHaveLength(0);
        await main.getByRole('button', { name: 'Timer starten', exact: true }).first().click();
        await dialog.getByLabel(`Leistung für „${todoA.title}“`).fill('Leistung vor dem Wechsel');
        await dialog.getByRole('button', { name: 'Stoppen und wechseln' }).click();
      }
      await expect(main.getByRole('button', { name: 'Timer stoppen', exact: true })).toBeVisible();
      await expect(dialog).toBeHidden();
      expect((await getRunningTimer())?.entry.todoId).toBe(todoB.id);
      const entries = await listTimeEntriesByTodo(todoA.id);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.note).toBe(promptOnStop ? 'Leistung vor dem Wechsel' : '');
    } finally {
      await cleanupAnyTimer();
      await setTimerPrompt(original);
      for (const todo of [todoA, todoB]) {
        for (const entry of await listTimeEntriesByTodo(todo.id)) await deleteTimeEntry(entry.id);
        await deleteTodo(todo.id);
      }
    }
  });
}
