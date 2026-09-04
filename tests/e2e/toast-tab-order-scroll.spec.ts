/**
 * SC 2.4.7 (docs/testplan.md, Abschnitt 22) — T-120.
 *
 * Bündig mit B-2 aus T-116/T-118 (`apps/web/src/app/ToastContext.tsx`,
 * `.toast-layer` als Rollfläche): Steht der Meldungsstapel über mehr als eine
 * Bildschirmhöhe, muss die älteste Meldung über die Tastatur erreichbar
 * bleiben und darf beim Fokussieren nicht außerhalb des sichtbaren Bereichs
 * landen (Fokus sichtbar, SC 2.4.7).
 *
 * ## Warum sieben „Erledigt“ den Stapel über `MAX_TOASTS` hinaus wachsen lassen
 *
 * Die Todo-Liste (`TodoListScreen.tsx`, `toggleDone`) zeigt beim Setzen von
 * „Erledigt" eine Meldung **mit** Rückweg (`action: undoDoneAction(...)`,
 * B-6/B-7 aus T-116/T-118) — anders als das Kartenmenü des Kanban-Boards, das
 * hier bewusst nicht verwendet wird (`BoardScreen.tsx`, `toggleDone`, kein
 * `action`-Feld, siehe `toast-eviction.spec.ts`). `evict()` überspringt jede
 * Meldung mit Aktion (W-10); tragen alle stehenden Meldungen eine, wächst der
 * Stapel über `MAX_TOASTS = 4` hinaus (`ToastContext.tsx`, Abschnitt „Wenn nur
 * noch Meldungen mit Rückweg stehen"). Sieben Meldungen sind deshalb sieben
 * Meldungen — keine wird verdrängt, alle sieben stehen gleichzeitig.
 *
 * „Erledigte einblenden" wird vor dem ersten Abhaken eingeschaltet, damit
 * keine Zeile beim Setzen von „Erledigt" aus der Liste verschwindet
 * (E-039) — sonst verlöre jede Zeile beim Abhaken ihren Fokus an `body`, und
 * der folgende Tab-Weg würde nicht den in diesem Fall interessanten,
 * kurzen Ausschnitt (Rest der letzten Zeile, dann der Meldungsstapel) messen,
 * sondern den gesamten Tabulator-Weg der Anwendung von vorn.
 *
 * Geprüft wird über die **echte Tabulatortaste** (`page.keyboard.press`),
 * nicht über ein programmatisches `.focus()`: SC 2.4.7 handelt von dem Weg,
 * den eine Tastaturbedienerin tatsächlich geht.
 */
import { test, expect } from '@playwright/test';

import { createTodo, deleteTodo, type Todo } from './support/api';
import { gotoTodos } from './support/nav';

test.describe('SC 2.4.7 — die älteste von sieben „Erledigt“-Meldungen bleibt im Sichtbaren erreichbar', () => {
  test('Tab führt zur ältesten Meldung, ihre boundingBox().y ist nicht negativ', async ({ page }) => {
    const run = Date.now();
    const todos: Todo[] = [];
    for (let index = 0; index < 7; index += 1) {
      todos.push(await createTodo({ title: `E2E-SC247-${String(index)}-${String(run)}` }));
    }

    try {
      await gotoTodos(page, { q: String(run) });

      // Vor dem ersten Abhaken einschalten (siehe Dateikopf) — zu diesem
      // Zeitpunkt ist noch nichts ausgeblendet, der Umschalter trägt deshalb
      // eindeutig diesen einen Namen.
      await page.getByRole('button', { name: 'Erledigte einblenden' }).click();

      for (const todo of todos) {
        // `.click()`, nicht `.check()`: Das Kästchen ist von React
        // kontrolliert (`checked={done}`, aus Serverdaten) — sein sichtbarer
        // Zustand wechselt erst, nachdem `bump()` neu geladen hat, nicht
        // synchron mit dem Klick. `.check()` prüft den nativen Zustand
        // unmittelbar nach dem Klick und schlägt an einem kontrollierten
        // Element deshalb fehl; die folgende Meldung ist die richtige
        // Erfolgsprobe (siehe auch `toast-eviction.spec.ts`, derselbe Befund).
        await page.getByLabel(`„${todo.title}“ als erledigt markieren`).click();
        await expect(page.locator('.toast').filter({ hasText: `„${todo.title}“ ist erledigt.` })).toBeVisible();
      }

      // Keine Verdrängung — siehe Dateikopf.
      await expect(page.locator('.toast')).toHaveCount(7);

      const oldest = todos[0];
      if (oldest === undefined) throw new Error('unreachable');

      let reachedAnyToast = false;
      for (let attempt = 0; attempt < 200; attempt += 1) {
        await page.keyboard.press('Tab');
        const withinToast = await page
          .locator(':focus')
          .evaluate((element) => element.closest('.toast') !== null)
          .catch(() => false);
        if (withinToast) {
          reachedAnyToast = true;
          break;
        }
      }
      expect(reachedAnyToast).toBe(true);

      // Die erste über Tab erreichte Meldung ist tatsächlich die älteste: In
      // `ToastContext.tsx` hängt `show` neue Meldungen an
      // (`[...evict(previous), { ...input, id }]`), `evict` entfernt aus der
      // Mitte — unter den Überlebenden bleibt die Einfügereihenfolge
      // erhalten, und DOM-Reihenfolge ist Tab-Reihenfolge.
      const focused = page.locator(':focus');
      const focusedToastText = await focused.evaluate((element) => element.closest('.toast')?.textContent ?? '');
      expect(focusedToastText).toContain(`„${oldest.title}“ ist erledigt.`);

      const box = await focused.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
    } finally {
      for (const todo of todos) {
        await deleteTodo(todo.id).catch(() => undefined);
      }
    }
  });
});
