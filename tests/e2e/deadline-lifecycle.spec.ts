/**
 * TP-FRIST-01, TP-FRIST-02, TP-FRIST-03, TP-FRIST-08, TP-FRIST-11
 * (docs/testplan.md, Abschnitt 25.1) — T-150.
 *
 * Die Frist entsteht, ändert sich und verschwindet wieder — und sie ist an
 * jeder Stelle sichtbar, an der ein Todo als Zeile oder Karte erscheint, ohne
 * dass man es öffnen muss (A-19.4). Ein Todo ohne Frist zeigt dort **nichts**,
 * keinen Platzhalter (A-19.5) — und die Frist bewegt kein Todo durch Pools
 * oder Spalten (A-19.7).
 *
 * **Abweichung vom Plan aus T-142 (docs/testplan.md, TP-FRIST-08):** Der Plan
 * nannte "Dashboard-Kachel „Zuletzt bearbeitet"" als dritte Anzeigestelle.
 * Gebaut ist das anders (`DashboardScreen.tsx`, Kommentar dort wörtlich: "es
 * steht hier kein `DeadlineFlag`"): Das Dashboard zeigt statt einer Frist je
 * Zeile eine **Zahl** überfälliger Todos in einer eigenen Kachel, die nur bei
 * einem Wert größer null erscheint (A-19.4 ist damit auf andere Weise erfüllt
 * — "was ist überfällig" statt "wann ist wessen Frist"). Dieser Fall prüft
 * deshalb die drei tatsächlich gebauten Stellen: Todo-Liste (S-02),
 * Kanban-Karte (S-04) und Detailansicht (S-03) — plus, ergänzend, die
 * Dashboard-Kachel selbst.
 */
import { test, expect } from '@playwright/test';

import {
  createPool,
  createTag,
  createTimeEntry,
  createTodo,
  deletePool,
  deletePoolByName,
  deleteTag,
  deleteTimeEntry,
  deleteTodo,
  listOpenTodosByTitle,
  listTimeEntriesByTodo,
  loadTodoDetail,
  updateTodoDueDate,
} from './support/api';
import { createBoardColumn } from './support/actions';
import { API_BASE_URL, SESSION_SECRET, TOKEN_HEADER, WEB_BASE_URL } from './support/session';
import { gotoBoard, gotoDashboard, gotoTodo, gotoTodos } from './support/nav';

/** Ein Kalendertag `offsetDays` von heute, in Ortszeit (`YYYY-MM-DD`). */
function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

/** Dasselbe Format wie `formatCalendarDay` (`apps/web/src/lib/format.ts`): `DD.MM.YYYY`. */
function germanDate(day: string): string {
  const [year, month, dayOfMonth] = day.split('-');
  return `${dayOfMonth}.${month}.${year}`;
}

test.describe('TP-FRIST-01/02/03/08 — Setzen, Ändern, Entfernen, sichtbar ohne zu öffnen', () => {
  test('eine Frist entsteht, ändert sich, verschwindet — und ist an drei Stellen sichtbar, ohne das Todo zu öffnen', async ({
    page,
  }) => {
    const title = `E2E-FRIST-${Date.now()}`;
    const later = isoDay(30);
    const overdue = isoDay(-4);

    // --- TP-FRIST-01: anlegen, mit Frist ------------------------------------
    const todo = await createTodo({ title, dueDate: later });

    // Eine Kanban-Spalte, deren Regel jedes offene Todo aufnimmt (neutrale
    // Achsen bis auf "Erledigt") — dieselbe Bauart wie in
    // `todo-revival.spec.ts`, hier gebraucht, um die Karte für TP-FRIST-08
    // sichtbar zu machen.
    await gotoBoard(page);
    const columnName = `E2E-FRIST-SPALTE-${Date.now()}`;
    await createBoardColumn(page, columnName, { completion: 'open' });

    // --- TP-FRIST-08, Kanban-Karte (S-04), Zustand "später fällig" ----------
    const column = page.locator('.kcolumn', { hasText: columnName });
    const card = column.locator('.kcard', { hasText: title });
    await expect(card).toBeVisible();
    // "später fällig" ist ruhig: nur das Datum, kein Zustandswort (T-144 8.5).
    await expect(card.locator('.deadline')).toHaveAttribute('aria-label', `Frist: ${germanDate(later)}`);

    // --- TP-FRIST-08, Todo-Liste (S-02) --------------------------------------
    await gotoTodos(page, { q: title });
    const row = page.locator('.todo-row', { hasText: title });
    await expect(row).toBeVisible();
    await expect(row.locator('.deadline')).toHaveAttribute('aria-label', `Frist: ${germanDate(later)}`);

    // --- TP-FRIST-08, Detailansicht (S-03) -----------------------------------
    await gotoTodo(page, todo.id);
    const deadlineCard = page.locator('.card').filter({ has: page.locator('.card__title', { hasText: 'Frist' }) });
    await expect(deadlineCard.locator('.deadline')).toHaveAttribute('aria-label', `Frist: ${germanDate(later)}`);
    await expect(deadlineCard.getByRole('button', { name: 'Frist ändern' })).toBeVisible();

    // --- TP-FRIST-02: ändern -------------------------------------------------
    await deadlineCard.getByRole('button', { name: 'Frist ändern' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
    await expect(editDialog).toBeVisible();
    await expect(editDialog.getByLabel('Frist')).toHaveValue(later);
    await editDialog.getByLabel('Frist').fill(overdue);
    await editDialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(editDialog).toBeHidden();

    // Die Frist zeigt danach ausschließlich das neue Datum — an jeder Stelle.
    await expect(deadlineCard.locator('.deadline')).toHaveAttribute(
      'aria-label',
      `Überfällig — Frist: ${germanDate(overdue)}`,
    );
    await expect(deadlineCard.locator('.deadline')).toContainText('Überfällig');
    await expect(deadlineCard.locator('.deadline')).not.toContainText(germanDate(later));

    await gotoTodos(page, { q: title });
    await expect(row.locator('.deadline')).toHaveAttribute(
      'aria-label',
      `Überfällig — Frist: ${germanDate(overdue)}`,
    );

    await gotoBoard(page);
    await expect(card.locator('.deadline')).toHaveAttribute(
      'aria-label',
      `Überfällig — Frist: ${germanDate(overdue)}`,
    );

    // Ergänzend: Die Dashboard-Kachel "Überfällig" zählt dieses Todo mit
    // (tatsächlich gebaute dritte Anzeigestelle, siehe Kopfkommentar).
    await gotoDashboard(page);
    await expect(page.getByText('Überfällig', { exact: true })).toBeVisible();

    // --- TP-FRIST-03: entfernen ----------------------------------------------
    await gotoTodo(page, todo.id);
    await expect(deadlineCard.getByRole('button', { name: 'Frist ändern' })).toBeVisible();
    await deadlineCard.getByRole('button', { name: 'Frist ändern' }).click();
    const removeDialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
    await removeDialog.getByLabel('Frist').fill('');
    await removeDialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(removeDialog).toBeHidden();

    // Weder ein Zustand noch ein Platzhalterdatum — die Karte sagt es in Worten.
    await expect(deadlineCard).toContainText('Keine Frist gesetzt');
    await expect(deadlineCard.locator('.deadline')).toHaveCount(0);
    await expect(deadlineCard.getByRole('button', { name: 'Frist setzen' })).toBeVisible();

    await gotoTodos(page, { q: title });
    await expect(row.locator('.deadline')).toHaveCount(0);

    await gotoBoard(page);
    await expect(card.locator('.deadline')).toHaveCount(0);

    // --- Aufräumen -------------------------------------------------------------
    await deleteTodo(todo.id);
    await deletePoolByName(columnName).catch(() => undefined);
  });

  test('ein Todo ohne Frist ist genauso gültig wie eines mit — A-19.1 wörtlich', async ({ page }) => {
    const title = `E2E-FRIST-OHNE-${Date.now()}`;
    await gotoTodos(page);
    await page.getByRole('button', { name: 'Neues Todo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
    await dialog.getByLabel('Titel').fill(title);
    // Das Feld "Frist" bleibt leer.
    await dialog.getByRole('button', { name: 'Anlegen' }).click();
    await expect(dialog).toBeHidden();

    await gotoTodos(page, { q: title });
    const row = page.locator('.todo-row', { hasText: title });
    await expect(row).toBeVisible();
    // Kein Platzhalter, keine Marke — "ohne Frist" ist die Abwesenheit des
    // Elements, kein vierter, leerer Zustand (E-074 Punkt 2).
    await expect(row.locator('.deadline')).toHaveCount(0);

    const found = (await listOpenTodosByTitle(title))[0];
    expect(found).toBeDefined();
    if (found !== undefined) await deleteTodo(found.id);
  });
});

test.describe('TP-FRIST-11 — Die Frist ist keine Achse (A-19.7)', () => {
  test('Ändern der Frist bewegt weder Pool noch Kanban-Spalte noch Buchungen', async ({ page }) => {
    const tagName = `E2E-FRIST-TAG-${Date.now()}`;
    const tag = await createTag(tagName);
    const todo = await createTodo({ title: `E2E-FRIST-ACHSE-${Date.now()}`, tagIds: [tag.id] });
    await createTimeEntry({
      todoId: todo.id,
      startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      endedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      note: 'E2E-FRIST-ACHSE Buchung',
    });

    const pool = await createPool({ name: `E2E-FRIST-POOL-${Date.now()}`, requiredTagIds: [tag.id] });

    await gotoTodos(page, { pool: pool.id });
    const row = page.locator('.todo-row', { hasText: todo.title });
    await expect(row).toBeVisible();

    // Die Frist auf "überfällig" setzen und wieder ändern — dieselbe Regel
    // (Tags) bleibt die einzige, nach der sich Pool-Zugehörigkeit richtet.
    await updateTodoDueDate(todo.id, isoDay(-2));
    await gotoTodos(page, { pool: pool.id });
    await expect(row).toBeVisible();

    await updateTodoDueDate(todo.id, isoDay(10));
    await gotoTodos(page, { pool: pool.id });
    await expect(row).toBeVisible();

    const entries = await listTimeEntriesByTodo(todo.id);
    expect(entries).toHaveLength(1);

    const detail = await loadTodoDetail(todo.id);
    expect(detail.todo.tagIds).toContain(tag.id);

    // Strukturelle Bedingung: Ein Regelterm, der die Frist referenziert, gibt
    // es nicht — nicht "abgeschaltet", sondern kein Zweig im Schema. Ein
    // unbekannter `kind` wird 422 abgewiesen, dieselbe Bauart wie bei den
    // Exportvorlagen (`export-template-validation.spec.ts`) und beim Vermerk
    // (`TP-NOTE-01`).
    const rejected = await attemptCreatePoolWithDueRule();
    expect(rejected.status).toBe(422);

    for (const entry of entries) await deleteTimeEntry(entry.id);
    await deletePool(pool.id);
    await deleteTodo(todo.id);
    await deleteTag(tag.id);
  });
});

/**
 * `POST /pools` mit einem Regelterm `{ kind: 'due', … }` — es gibt dafür
 * keinen Zweig im Schema (A-19.7, E-070 Punkt 4). Roh aufgerufen, nicht über
 * `support/api.ts#createPool`: Diese Funktion kennt nur die vier tatsächlich
 * erlaubten Regelterme und könnte einen fünften gar nicht ausdrücken.
 */
async function attemptCreatePoolWithDueRule(): Promise<{ readonly status: number }> {
  const response = await fetch(`${API_BASE_URL}/pools`, {
    method: 'POST',
    headers: {
      Origin: WEB_BASE_URL,
      [TOKEN_HEADER]: SESSION_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `E2E-FRIST-REGEL-${Date.now()}`,
      placement: 'pool',
      rule: [{ kind: 'due', state: 'overdue' }],
      statusIds: [],
      completion: 'any',
      exportState: 'any',
    }),
  });
  return { status: response.status };
}
