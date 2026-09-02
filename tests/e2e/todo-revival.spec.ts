/**
 * TP-TIMER-01/02, I-05, E-023, TP-KANBAN-05/06 (docs/testplan.md, Abschnitt 5)
 *
 * Erledigtes Todo wiederbeleben: Todo anlegen, Zeit buchen, auf erledigt
 * setzen, Timer erneut starten. Erwartung: „Erledigt" ist weg, das Todo ist
 * aktiv und erscheint wieder in seinem Pool. Geprüft von jeder Stelle aus, an
 * der ein Timer startbar ist — und ausdrücklich: **die Kanban-Spalte bleibt
 * unverändert** (E-023). Eine Umsetzung, die die Karte verschiebt, ist der
 * Bruch.
 *
 * Nachgezogen für T-048: T-012 konnte S-01 (Dashboard) und S-05
 * (Zeiterfassung) aus Zeitgründen nicht fahren (Fälle 10/11 im damaligen
 * Bericht). T-040 hat I-05 seither ausdrücklich auf alle sechs Startpunkte
 * ausgeweitet (Befund C-04) — beide Fälle sind jetzt nachgeholt.
 */
import { test, expect } from '@playwright/test';

import { cleanupAnyTimer, createTodo } from './support/api';
import { gotoBoard, gotoDashboard, gotoTime, gotoTodo, gotoTodos } from './support/nav';

const API_BASE_URL = 'http://127.0.0.1:17843/api/v1';
const SESSION_SECRET = 'takt-e2e-erfundenes-sitzungsgeheimnis-2026-08';

async function markDone(todoId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/todos/${todoId}/done`, {
    method: 'PUT',
    headers: { Origin: 'http://127.0.0.1:5173', 'X-Takt-Token': SESSION_SECRET },
  });
  if (!response.ok) throw new Error(`Konnte Todo nicht als erledigt markieren: ${response.status}`);
}

async function loadTodoStatusId(todoId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
    headers: { Origin: 'http://127.0.0.1:5173', 'X-Takt-Token': SESSION_SECRET },
  });
  const envelope = (await response.json()) as { data: { todo: { statusId: string; completedAt: string | null } } };
  return envelope.data.todo.statusId;
}

async function loadTodoDone(todoId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
    headers: { Origin: 'http://127.0.0.1:5173', 'X-Takt-Token': SESSION_SECRET },
  });
  const envelope = (await response.json()) as { data: { todo: { completedAt: string | null } } };
  return envelope.data.todo.completedAt !== null;
}

/**
 * Stoppt einen laufenden Timer über die Oberfläche, ohne ihn zu buchen zu
 * vergessen. Auf `#inhalt` beschränkt (nicht `page`-weit): Die Kopfleiste
 * trägt seit T-040 (Begriffsvereinheitlichung C-17) denselben Wortlaut
 * „Timer stoppen" wie die Seite selbst — ein page-weiter Locator träfe daher
 * zwei Elemente (Kopfleiste und Seite) und würde im Playwright-Strict-Mode
 * abgelehnt.
 */
async function stopRunningTimer(page: import('@playwright/test').Page): Promise<void> {
  const main = page.locator('#inhalt');
  const stopButton = main.getByRole('button', { name: /Timer stoppen|Zeiterfassung stoppen/ });
  if ((await stopButton.count()) === 0) return;
  await stopButton.first().click();
  const dialog = page.getByRole('dialog', { name: 'Timer stoppen' });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole('button', { name: 'Stoppen und buchen' }).click();
    await expect(dialog).toBeHidden();
  }
}

/*
 * Räumt nach jedem Fall über die API auf, unabhängig davon, ob eine
 * Assertion im Fall selbst fehlgeschlagen ist (siehe Bericht T-048: ein
 * fehlgeschlagener Fall, der den Timer laufen lässt, bringt sonst jeden
 * folgenden Fall zu Fall — die Oberfläche fragt dann beim nächsten Laden
 * nach einem verwaisten Timer, und dessen Rückfrage-Dialog blockiert alles
 * dahinter.
 */
test.afterEach(async () => {
  await cleanupAnyTimer();
});

test.describe('I-05 — Timerstart auf einem erledigten Todo hebt Erledigt auf, Kanban-Spalte bleibt', () => {
  test('Startpunkt S-03 (Todo-Detailansicht)', async ({ page }) => {
    const todo = await createTodo({ title: `E2E-REVIVAL-S03-${Date.now()}` });
    const statusBefore = await loadTodoStatusId(todo.id);
    await markDone(todo.id);

    await gotoTodo(page, todo.id);
    await expect(page.locator('.done-switch strong')).toHaveText('Erledigt');

    const main = page.locator('#inhalt');
    await main.getByRole('button', { name: 'Timer starten' }).first().click();
    await expect(main.getByRole('button', { name: 'Timer stoppen' })).toBeVisible();

    // Wirkung 1 (T-045, Befund C-23): Der Schalter fällt nicht mehr auf
    // "Offen" zurück, sondern zeigt den dritten Anzeigezustand "Erledigt
    // aufgehoben" — denselben, den S-01/S-04/S-05 schon zeigten.
    await expect(page.locator('.done-switch strong')).toHaveText('Erledigt aufgehoben');

    // Kein Spaltenwechsel (E-023) — auch über die API nachgewiesen.
    expect(await loadTodoStatusId(todo.id)).toBe(statusBefore);
    expect(await loadTodoDone(todo.id)).toBe(false);

    await stopRunningTimer(page);
  });

  test('Startpunkt S-04 (Kanban-Karte)', async ({ page }) => {
    const todo = await createTodo({ title: `E2E-REVIVAL-S04-${Date.now()}` });
    const statusBefore = await loadTodoStatusId(todo.id);
    await markDone(todo.id);

    await gotoBoard(page);
    await page.getByRole('button', { name: 'Erledigte einblenden' }).click();
    const card = page.locator('.kcard', { hasText: todo.title });
    await expect(card).toBeVisible();
    await expect(card.locator('.kcard__flag')).toHaveText(/Erledigt/);

    // T-040, Befund C-17: "Zeiterfassung starten/stoppen" heißt überall
    // "Timer für 'X' starten/stoppen" — auch auf der Kanban-Karte.
    await card.getByRole('button', { name: /Timer für/ }).click();

    // Die Karte bleibt bestehen (bleibt selektierbar unter demselben Titel)
    // und zeigt jetzt "Erledigt aufgehoben" statt "Erledigt" (T-005n, Abschnitt 1).
    await expect(card.locator('.kcard__flag')).toHaveText(/Erledigt aufgehoben/);
    await expect(card.getByRole('button', { name: /Timer für/ })).toBeVisible();

    expect(await loadTodoStatusId(todo.id)).toBe(statusBefore);
    expect(await loadTodoDone(todo.id)).toBe(false);

    // Aufräumen: Timer über die Karte selbst stoppen.
    await card.getByRole('button', { name: /Timer für/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Timer stoppen' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Stoppen und buchen' }).click();
  });

  test('Startpunkt S-02 (Todo-Liste, Zeilenaktion, E-027)', async ({ page }) => {
    const todo = await createTodo({ title: `E2E-REVIVAL-S02-${Date.now()}` });
    const statusBefore = await loadTodoStatusId(todo.id);
    await markDone(todo.id);

    await gotoTodos(page);
    await page.getByRole('button', { name: 'Erledigte einblenden' }).click();

    const row = page.locator('.todo-row', { hasText: todo.title });
    await expect(row).toBeVisible();
    // T-045, AN-03: `.todo-row__flag` ist im gemeinsamen `.doneflag`-Baustein
    // aufgegangen.
    await expect(row.locator('.doneflag')).toHaveText('Erledigt');

    await row.getByRole('button', { name: /Timer für/ }).click();

    // Die Zeile bleibt stehen (E-027). T-045, Befund C-23: S-02 ruft jetzt
    // ebenfalls `clearReactivated` wie S-04 — das Kennzeichen verschwindet
    // nicht, sondern zeigt "Erledigt aufgehoben".
    await expect(row.locator('.doneflag')).toHaveText('Erledigt aufgehoben');

    expect(await loadTodoStatusId(todo.id)).toBe(statusBefore);
    expect(await loadTodoDone(todo.id)).toBe(false);

    await stopRunningTimer(page);
  });

  test('Startpunkt S-01 (Dashboard, „Zuletzt bearbeitet")', async ({ page }) => {
    const todo = await createTodo({ title: `E2E-REVIVAL-S01-${Date.now()}` });
    const statusBefore = await loadTodoStatusId(todo.id);
    await markDone(todo.id);

    // S-01 hat laut T-040 (AN-07) keinen Schalter "Erledigte einblenden" —
    // "Zuletzt bearbeitet" führt erledigte Todos immer mit, gekennzeichnet.
    await gotoDashboard(page);
    const row = page.locator('.pick-row', { hasText: todo.title });
    await expect(row).toBeVisible();
    await expect(row.locator('.doneflag')).toHaveText(/Erledigt/);

    await row.getByRole('button', { name: 'Start' }).click();

    // Wirkung: Kennzeichen wechselt zu "Erledigt aufgehoben" (dritter
    // Anzeigezustand), die Zeile bleibt stehen.
    await expect(row.locator('.doneflag')).toHaveText(/Erledigt aufgehoben/);
    await expect(row.getByRole('button', { name: 'Stopp' })).toBeVisible();

    expect(await loadTodoStatusId(todo.id)).toBe(statusBefore);
    expect(await loadTodoDone(todo.id)).toBe(false);

    await row.getByRole('button', { name: 'Stopp' }).click();
    const dialog = page.getByRole('dialog', { name: 'Timer stoppen' });
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.getByRole('button', { name: 'Stoppen und buchen' }).click();
      await expect(dialog).toBeHidden();
    }
  });

  test('Startpunkt S-05 (Zeiterfassung, „Erledigte einblenden")', async ({ page }) => {
    const todo = await createTodo({ title: `E2E-REVIVAL-S05-${Date.now()}` });
    const statusBefore = await loadTodoStatusId(todo.id);
    await markDone(todo.id);

    await gotoTime(page);
    await page.getByRole('button', { name: 'Erledigte einblenden' }).click();

    const row = page.locator('.pick-row', { hasText: todo.title });
    await expect(row).toBeVisible();
    await expect(row.locator('.doneflag')).toHaveText(/Erledigt/);

    await row.getByRole('button', { name: /Timer für/ }).click();

    await expect(row.locator('.doneflag')).toHaveText(/Erledigt aufgehoben/);

    expect(await loadTodoStatusId(todo.id)).toBe(statusBefore);
    expect(await loadTodoDone(todo.id)).toBe(false);

    await stopRunningTimer(page);
  });
});
