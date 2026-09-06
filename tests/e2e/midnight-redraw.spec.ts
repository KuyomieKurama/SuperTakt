/**
 * TP-FRIST-11 bis TP-FRIST-13 (docs/testplan.md, Abschnitt 25.1) — T-187, O-ER.
 *
 * Übernimmt als feste Reihe, was T-172 (visual-qa) erstmals wirklich **gesehen**
 * hat statt nur am Code abgeleitet: Ein über `page.clock` gefälschter
 * Mitternachtswechsel löst den in `useToday()` gestellten Zeitgeber aus, und
 * drei client-seitig gerechnete Flächen zeichnen **ohne jedes Neuladen der
 * Seite** neu (Fälle M1/M2, M4/M5, M6/M7 aus `.claude/team/reports
 * /T-172-visual-qa.md`). Ohne diese Reihe wäre die Behebung aus O-CO/O-DG
 * (`TodoListScreen.tsx`, `TimeScreen.tsx`, `DashboardScreen.tsx` — vollständige
 * Abhängigkeitslisten statt eines eingefrorenen `useMemo`) am nächsten Umbau
 * still zurückgefallen, ohne dass etwas rot geworden wäre.
 *
 * **Dieselbe Bauart wie `deadline-computed-state.spec.ts` (TP-FRIST-09):**
 * `page.clock.install()` **vor** der Navigation, `page.clock.fastForward()`
 * danach — kein echtes Warten, keine Abhängigkeit von der Tageszeit, zu der
 * dieser Lauf tatsächlich startet.
 *
 * **Die Grenze, die keine Behebung ist (T-172, Fall M3):** Der Fristfilter
 * "Überfällig" der Todo-Liste geht als `dueStates` an den **Dienst**
 * (`TodoListScreen.tsx`, Kommentar bei `list = useAsync(...)`), und dort
 * rechnet `dueState` gegen die **echte** Systemuhr des `local-api`-Prozesses
 * (E-070 Punkt 3) — nicht gegen die gefälschte Browser-Uhr dieses Tests. Eine
 * gefälschte Browser-Uhr überquert diese Grenze nicht, und das ist Architektur,
 * kein Fehler: Die Zeilen-Marke (`DeadlineFlag`, client-seitig) und der
 * Fristfilter (serverseitig) beantworten dieselbe Frage aus zwei
 * verschiedenen Prozessen mit zwei verschiedenen Uhren. `TP-FRIST-11` misst
 * unten beide Seiten in einem Fall — die Marke wechselt, der Filter nicht —,
 * damit diese Grenze **eingecheckt** bleibt und nicht nur in einem Bericht
 * steht, der irgendwann verblasst.
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

/** Ein Kalendertag `offsetDays` von heute, in Ortszeit (`YYYY-MM-DD`). */
function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

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
    const todo = await createTodo({ title, dueDate: isoDay(0) });

    await page.clock.install({ time: nearMidnight() });
    await gotoTodos(page, { q: title });

    const row = page.locator('.todo-row', { hasText: title });
    await expect(row.locator('.deadline')).toContainText('Heute fällig');

    await page.clock.fastForward('00:10:00');
    await expect(row.locator('.deadline')).toContainText('Überfällig');

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
