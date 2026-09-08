import { test, expect } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { E2E_DATA_DIR } from './support/session';
import { gotoTime } from './support/nav';
import { cleanupAnyTimer, createTodo, deleteTodo, deleteTimeEntry, getRunningTimer, listTimeEntriesByTodo } from './support/api';

const iso = (ms: number) => new Date(Math.floor(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z');

test('A-24: offene Zeit überlebt Neuladen, lässt sich aufteilen und setzt den Timer fort', async ({ page }) => {
  await cleanupAnyTimer();
  const a = await createTodo({ title: `E2E-Inaktiv-A-${Date.now()}` });
  const b = await createTodo({ title: `E2E-Inaktiv-B-${Date.now()}` });
  const sessionId = randomUUID();
  const end = Date.now() - 60_000;
  const begin = end - 40 * 60_000;
  const db = new DatabaseSync(join(E2E_DATA_DIR, 'takt', 'takt.db'));
  try {
    db.exec('PRAGMA busy_timeout = 5000');
    // Simulates the persisted result of the native idle detection. All user
    // choices and allocations below use the real UI, HTTP and SQLite service.
    db.prepare('INSERT INTO timer_idle (id, session_id, todo_id, started_at, returned_at, note) VALUES (1, ?, ?, ?, ?, ?)')
      .run(sessionId, a.id, iso(begin), iso(end), 'Telefonat');
    await gotoTime(page);
    let dialog = page.getByRole('dialog', { name: 'Willkommen zurück' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Später zuordnen' }).click();
    expect(await getRunningTimer()).toBeNull();
    await page.reload();
    dialog = page.getByRole('dialog', { name: 'Willkommen zurück' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: 'Zeit aufteilen', exact: true }).check();
    await dialog.getByRole('textbox', { name: 'Dauer', exact: true }).first().fill('20');
    await dialog.getByRole('button', { name: 'Abschnitt hinzufügen' }).click();
    await dialog.getByRole('textbox', { name: 'Dauer', exact: true }).nth(1).fill('10');
    await dialog.getByRole('button', { name: 'Abschnitt hinzufügen' }).click();
    await dialog.getByRole('combobox', { name: 'Aufgabe oder Pause' }).nth(2).click();
    await page.getByRole('option', { name: b.title, exact: true }).click();
    await dialog.getByRole('button', { name: 'Rest übernehmen', exact: true }).nth(2).click();
    await expect(dialog.getByText('Die gesamte Zeit ist verteilt.', { exact: true })).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds?.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.screenshot({ path: 'test-results-e2e/idle-split.png' });
    await dialog.getByRole('button', { name: 'Zuordnung speichern' }).click();
    await expect(dialog).toBeHidden();
    const entriesA = await listTimeEntriesByTodo(a.id);
    const entriesB = await listTimeEntriesByTodo(b.id);
    expect(entriesA).toHaveLength(1);
    expect(entriesB).toHaveLength(1);
    expect(entriesA[0]).toMatchObject({ startedAt: iso(begin), endedAt: iso(begin + 20 * 60_000), note: 'Telefonat' });
    expect(entriesB[0]).toMatchObject({ startedAt: iso(begin + 30 * 60_000), endedAt: iso(end) });
    expect((await getRunningTimer())?.entry.todoId).toBe(a.id);
    await page.reload();
    await expect(dialog).toBeHidden();
  } finally {
    db.prepare('DELETE FROM timer_idle WHERE session_id = ?').run(sessionId);
    db.close();
    await cleanupAnyTimer();
    for (const todo of [a, b]) {
      for (const entry of await listTimeEntriesByTodo(todo.id)) await deleteTimeEntry(entry.id);
      await deleteTodo(todo.id);
    }
  }
});
