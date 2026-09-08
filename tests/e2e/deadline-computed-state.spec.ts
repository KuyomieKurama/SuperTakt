/**
 * TP-FRIST-09, TP-FRIST-10 (docs/testplan.md, Abschnitt 25.1) — T-150.
 *
 * Zwei Behauptungen, die sich nicht am ruhenden Bildschirm zeigen lassen:
 *
 *  - **Der Fristzustand wird bei jeder Anzeige neu gerechnet, nie
 *    gespeichert** (E-070 Punkt 3). Ein Unit-Fall gegen `dueState` zeigt nur,
 *    dass die Funktion rein ist — er zeigt nicht, dass das System sie bei
 *    jeder Anzeige neu aufruft, statt irgendwo einen Zustand
 *    zwischenzuspeichern. Der überzeugende Fall braucht deshalb einen Ablauf
 *    **ohne jede Änderung am Todo**, bei dem allein die Uhr weiterläuft.
 *  - **Derselbe Tagesbegriff wie die Tagesgruppierung des Exports** (E-025,
 *    E-070 Punkt 2): eine Buchung kurz nach Mitternacht Ortszeit und eine
 *    Frist auf denselben Kalendertag meinen an diesem Fenster denselben Tag —
 *    dieselbe Maschine, derselbe Kniff wie `calendar-day-boundary.spec.ts`.
 *
 * **Gemessen (T-150), wie im Auftrag verlangt:** `apps/web/src/app/useToday.ts`
 * hängt die Neuzeichnung an der **nächsten Mitternacht** — einem `setTimeout`
 * auf `calendarDayBounds(heute).endsBefore` — und an `visibilitychange`,
 * ausdrücklich **nicht** an einem Minutentakt (T-147-Bericht, Abschnitt 4).
 * `page.clock` macht genau diesen Zeitgeber messbar, ohne echte Zeit
 * verstreichen zu lassen (dieselbe Bauart wie `shell-quit-failure.spec.ts` für
 * die Fünf-Sekunden-Frist von "Takt beenden").
 */
import { test, expect } from '@playwright/test';

import { createTimeEntry, createTodo, deleteTimeEntry, deleteTodo, listTimeEntriesByTodo } from './support/api';
import { gotoTodo } from './support/nav';

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

function deadlineCardOn(page: import('@playwright/test').Page) {
  return page.locator('.card').filter({ has: page.locator('.card__title', { hasText: 'Frist' }) });
}

test.describe('TP-FRIST-09 — Der Zustand wird gerechnet, nicht gespeichert (E-070 Punkt 3)', () => {
  test('"heute fällig" wird zu "überfällig", allein weil die Uhr über Mitternacht rückt — ohne Schreibzugriff auf das Todo', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const today = isoDay(0);
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

    await expect(deadlineCard.locator('.deadline')).toContainText('Überfällig');

    await deleteTodo(todo.id);
  });
});

test.describe('TP-FRIST-10 — derselbe Tagesbegriff wie die Tagesgruppierung des Exports (E-025, E-070 Punkt 2)', () => {
  test('eine Buchung um 00:10 Ortszeit und eine Frist auf denselben Tag meinen denselben Kalendertag', async ({
    page,
  }) => {
    const today = isoDay(0);
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
