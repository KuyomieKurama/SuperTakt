import { localDayFromToday, todayAt } from './support/local-time';
/**
 * Die Browser-Uhr vor der Navigation installieren, damit auch der Mitternachtszeitgeber
 * kontrolliert läuft. Das Todo selbst bleibt unverändert.
 */
import { test, expect } from '@playwright/test';

import { createTimeEntry, createTodo, deleteTimeEntry, deleteTodo, listTimeEntriesByTodo } from './support/api';
import { gotoTodo } from './support/nav';

function deadlineCardOn(page: import('@playwright/test').Page) {
  return page.locator('.card').filter({ has: page.locator('.card__title', { hasText: 'Frist' }) });
}

test.describe('TP-FRIST-09 — Der Zustand wird gerechnet, nicht gespeichert (E-070 Punkt 3)', () => {
  test('"heute fällig" wird zu "überfällig", allein weil die Uhr über Mitternacht rückt — ohne Schreibzugriff auf das Todo', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const today = localDayFromToday(0);
    const todo = await createTodo({ title: `E2E-FRIST-COMPUTED-${Date.now()}`, dueDate: today });

    // Die Uhr auf 22:00 Ortszeit **heute** stellen — vor der Navigation, wie
    // bei jedem `page.clock`-Fall in diesem Bestand (`shell-quit-failure
    // .spec.ts`). So bleibt bis Mitternacht ein bekannter, kurzer Abstand,
    // unabhängig davon, zu welcher echten Uhrzeit dieser Testfall läuft.
    const clockTime = new Date();
    clockTime.setHours(22, 0, 0, 0);
    await page.clock.install({ time: clockTime });

    await gotoTodo(page, todo.id);
    const deadlineCard = deadlineCardOn(page);
    await expect(deadlineCard.locator('.deadline')).toContainText('Heute fällig');

    // Die Uhr über Mitternacht rücken — **ohne** das Todo anzufassen. Der
    // einzige Schreibzugriff dieses Testfalls war `createTodo` oben.
    await page.clock.fastForward('03:00:00');

    await expect(deadlineCard.locator('.deadline')).not.toContainText('Überfällig');
    await expect(deadlineCard.locator('.deadline')).toHaveClass(/deadline--overdue/);

    await deleteTodo(todo.id);
  });
});

test.describe('TP-FRIST-10 — derselbe Tagesbegriff wie die Tagesgruppierung des Exports (E-025, E-070 Punkt 2)', () => {
  test('eine Buchung um 00:10 Ortszeit und eine Frist auf denselben Tag meinen denselben Kalendertag', async ({
    page,
  }) => {
    const today = localDayFromToday(0);
    const title = `E2E-FRIST-SAMEDAY-${Date.now()}`;
    const todo = await createTodo({ title, dueDate: today });

    // Dieselbe Fehlerzone wie in `calendar-day-boundary.spec.ts`: eine
    // Buchung kurz nach Mitternacht Ortszeit liegt in UTC (bei positivem
    // Versatz) noch im Vortag — genau das Fenster, in dem ein zweiter,
    // abweichender Tagesbegriff sichtbar würde.
    await createTimeEntry({
      todoId: todo.id,
      startedAt: todayAt(0, 10),
      endedAt: todayAt(0, 20),
      note: 'E2E-FRIST-SAMEDAY, kurz nach Mitternacht Ortszeit',
    });

    // Der Fristzustand meint "heute" — dieselbe `today`-Berechnung wie
    // `useToday`/`toCalendarDay`.
    await gotoTodo(page, todo.id);
    await expect(deadlineCardOn(page).locator('.deadline')).toContainText('Heute fällig');

    // Die Buchung liegt, gefiltert auf denselben Kalendertag, im laufenden
    // Ortstag — nicht im (UTC-)Vortag. Derselbe Filter, dieselbe Erwartung
    // wie in `calendar-day-boundary.spec.ts`.
    await page.goto(
      `/#/buchungen?${new URLSearchParams({ von: today, bis: today, todo: todo.id }).toString()}`,
    );
    await expect(page.locator('.table__row', { hasText: title })).toBeVisible();

    const entries = await listTimeEntriesByTodo(todo.id);
    for (const entry of entries) await deleteTimeEntry(entry.id);
    await deleteTodo(todo.id);
  });
});
