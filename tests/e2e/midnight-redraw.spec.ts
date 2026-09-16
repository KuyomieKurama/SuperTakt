import { localDayFromToday, todayAt } from './support/local-time';
/**
 * Die gefälschte Browser-Uhr beeinflusst den Dienst nicht: Zeilenmarken wechseln über
 * Mitternacht, der serverseitige Filter folgt seiner echten Uhr.
 */
import { test, expect } from '@playwright/test';

import {
  createTimeEntry,
  createTodo,
  deleteTimeEntry,
  deleteTodo,
  listTimeEntriesByTodo,
} from './support/api';
import { gotoDashboard, gotoTime, gotoTodos } from './support/nav';

/** 23:59 Ortszeit heute — derselbe Ausgangspunkt wie `deadline-computed-state.spec.ts`. */
function nearMidnight(): Date {
  const clockTime = new Date();
  clockTime.setHours(23, 59, 0, 0);
  return clockTime;
}

test.describe('TP-FRIST-11 — Zeilen-Marke der Todo-Liste zeichnet über Mitternacht neu, der serverseitige Fristfilter nicht (E-070 Punkt 3, T-172 Fall M1/M2/M3)', () => {
  test('„Heute fällig" wird zu „Überfällig" ohne Neuladen; der Filter „Überfällig" bleibt leer', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const title = `E2E-MIDNIGHT-ROW-${Date.now()}`;
    const todo = await createTodo({ title, dueDate: localDayFromToday(0) });

    await page.clock.install({ time: nearMidnight() });
    await gotoTodos(page, { q: title });

    const row = page.locator('.todo-row', { hasText: title });
    await expect(row.locator('.deadline')).toContainText('Heute fällig');

    await page.clock.fastForward('00:10:00');
    await expect(row.locator('.deadline')).not.toContainText('Überfällig');
    await expect(row.locator('.deadline')).toHaveClass(/deadline--overdue/);

    // Fall M3 (die Grenze): derselbe gefälschte Übergang ändert nichts an dem,
    // was der Dienst gegen seine eigene, echte Uhr als „überfällig" führt.
    // Kein natives `<select>` (Ark-UI-Kombobox, dieselbe Bauart wie überall
    // sonst in diesem Bestand) — Klick auf den Auslöser, dann die Option.
    await page.getByRole('combobox', { name: 'Frist' }).click();
    await page.getByRole('option', { name: 'Überfällig', exact: true }).click();
    await expect(page.locator('.todo-row', { hasText: title })).toHaveCount(0);

    await deleteTodo(todo.id);
  });
});

test.describe('TP-FRIST-12 — die „Erfasst"-Kachel der Zeiterfassung zeichnet über Mitternacht neu (T-154/O-CO, T-172 Fall M4/M5)', () => {
  test('eine Buchung von heute verschwindet aus „Buchungen von heute", ohne dass die Seite neu lädt', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const note = `E2E-MIDNIGHT-TIME-${Date.now()}`;
    const todo = await createTodo({ title: `E2E-MIDNIGHT-TIME-TODO-${Date.now()}` });
    await createTimeEntry({ todoId: todo.id, startedAt: todayAt(10, 0), endedAt: todayAt(10, 30), note });

    await page.clock.install({ time: nearMidnight() });
    await gotoTime(page);

    const entryRow = page.locator('.entry-row', { hasText: note });
    await expect(entryRow).toBeVisible();

    await page.clock.fastForward('00:10:00');
    await expect(entryRow).toHaveCount(0);

    const entries = await listTimeEntriesByTodo(todo.id);
    for (const entry of entries) await deleteTimeEntry(entry.id);
    await deleteTodo(todo.id);
  });
});

test.describe('TP-FRIST-13 — die „Heute erfasst"-Kachel des Dashboards zeichnet über Mitternacht neu, „Noch nicht exportiert" bleibt unberührt (T-154/O-CO, T-172 Fall M6/M7)', () => {
  test('eine Buchung von heute verschwindet vom Dashboard, ohne dass die Seite neu lädt', async ({ page }) => {
    test.setTimeout(60_000);

    const note = `E2E-MIDNIGHT-DASH-${Date.now()}`;
    const todo = await createTodo({ title: `E2E-MIDNIGHT-DASH-TODO-${Date.now()}` });
    await createTimeEntry({ todoId: todo.id, startedAt: todayAt(11, 0), endedAt: todayAt(11, 30), note });

    await page.clock.install({ time: nearMidnight() });
    await gotoDashboard(page);

    const entryRow = page.locator('.entry-row', { hasText: note });
    await expect(entryRow).toBeVisible();

    // Kontrollwert: hängt nicht an "heute" (E-011) und bleibt über den
    // gefälschten Tageswechsel unverändert — anders als die Buchungszeile.
    // `.stat__value`/`.stat__detail` einzeln statt der ganzen Kachel: Die
    // Kachel selbst trägt keinen zugänglichen Namen, über den `.stat` mit
    // `hasText` eindeutig würde, und ihr Text bricht über mehrere `<p>`.
    const notExportedTile = page.locator('.stat', { has: page.locator('.stat__label', { hasText: 'Noch nicht exportiert' }) });
    const valueBefore = await notExportedTile.locator('.stat__value').innerText();
    const detailBefore = await notExportedTile.locator('.stat__detail').innerText();

    await page.clock.fastForward('00:10:00');
    await expect(entryRow).toHaveCount(0);
    await expect(notExportedTile.locator('.stat__value')).toHaveText(valueBefore);
    await expect(notExportedTile.locator('.stat__detail')).toHaveText(detailBefore);

    const entries = await listTimeEntriesByTodo(todo.id);
    for (const entry of entries) await deleteTimeEntry(entry.id);
    await deleteTodo(todo.id);
  });
});
