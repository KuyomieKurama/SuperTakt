/**
 * Toast-Stapel: eine Meldung mit Rückweg wird nicht verdrängt (W-10 aus R-2a,
 * T-108, `apps/web/src/app/ToastContext.tsx`, `evict()`,
 * `docs/testplan.md` Abschnitt 20, Auftrag T-113 Punkt 2).
 *
 * ## Ausgangslage
 *
 * `ToastProvider` hält höchstens `MAX_TOASTS = 4` Meldungen gleichzeitig
 * (`ToastContext.tsx`). Bis T-108 warf die fünfte Meldung schlicht die
 * älteste hinaus (`previous.slice(-3)`), **gleich welche** — und seit E-059
 * bietet „Vom Board nehmen" keinen Bestätigungsdialog mehr, sondern
 * „Rückgängig" im Toast selbst an. Eine Meldung mit Rückweg ist damit der
 * **einzige** Weg zurück; verdrängt sie eine fremde Meldung, verschwindet der
 * Rückweg, ohne dass der Benutzer etwas gelesen oder getan hätte (SC 2.2.1).
 * Seit T-108 überspringt `evict()` jede Meldung mit `action` und wirft
 * stattdessen die **älteste ohne** Aktion hinaus.
 *
 * ## Aufbau dieses Falls
 *
 * Eine Meldung mit Rückweg entsteht über „Vom Board nehmen" auf einer
 * eigenen Spalte (`BoardScreen.tsx`, `setPlacement` — `toasts.show` mit
 * `action: { label: 'Rückgängig', … }`, weil `previous !== placement` und
 * `restoring` nicht gesetzt ist). Vier Meldungen ohne Aktion entstehen über
 * „Als erledigt markieren" auf vier Karten einer zweiten, eigenen Spalte
 * (`toggleDone` — der `toasts.show`-Aufruf dort trägt kein `action`-Feld).
 * Zwei getrennte Spalten, damit das Zurücknehmen der ersten die Karten der
 * zweiten nicht vom Board nimmt.
 *
 * Fünf Meldungen insgesamt, eine mehr als `MAX_TOASTS`: Genau eine Verdrängung
 * findet statt, und sie trifft die älteste **ohne** Aktion — die erste der
 * vier Karten. Die Meldung mit Rückweg bleibt stehen, ihr Knopf bedienbar,
 * bis „Schließen" sie entfernt.
 */
import { test, expect } from '@playwright/test';

import { createPool, createTag, createTodo, deletePoolByName, deleteTag, deleteTodo, type Todo } from './support/api';
import { gotoBoard } from './support/nav';

test.describe('Toast-Stapel: eine Meldung mit Rückweg wird nicht verdrängt (W-10)', () => {
  test('Meldung mit „Rückgängig“ bleibt; die älteste ohne Aktion verschwindet; „Schließen“ entfernt weiterhin', async ({
    page,
  }) => {
    const run = Date.now();
    const undoColumnName = `E2E-Verdraengung-Rueckweg-${run}`;
    const cardColumnName = `E2E-Verdraengung-Karten-${run}`;
    const undoTag = await createTag(`E2E-Verdraengung-RueckwegTag-${run}`);
    const cardTag = await createTag(`E2E-Verdraengung-KartenTag-${run}`);
    await createPool({ name: undoColumnName, placement: 'both', requiredTagIds: [undoTag.id] });
    await createPool({ name: cardColumnName, placement: 'both', requiredTagIds: [cardTag.id] });

    const todos: Todo[] = [];
    for (let index = 0; index < 4; index += 1) {
      todos.push(
        await createTodo({ title: `E2E-Verdraengung-Karte-${String(index)}-${run}`, tagIds: [cardTag.id] }),
      );
    }

    try {
      await gotoBoard(page);

      // Meldung mit Rückweg — „Vom Board nehmen" fragt seit E-059 nicht mehr
      // nach, sondern bietet „Rückgängig" an (`BoardScreen.tsx`, `setPlacement`).
      await page.getByRole('button', { name: `Spalte ${undoColumnName} verwalten` }).click();
      await page.getByRole('menuitem', { name: 'Vom Board nehmen' }).click();

      const undoToast = page.locator('.toast').filter({ hasText: 'Spalte vom Board genommen.' });
      await expect(undoToast).toBeVisible();
      const undoButton = undoToast.getByRole('button', { name: 'Rückgängig' });
      await expect(undoButton).toBeVisible();

      // Vier Meldungen ohne Aktion, nacheinander — „Als erledigt markieren"
      // zeigt keinen Rückweg (`toggleDone`, kein `action` im `toasts.show`-
      // Aufruf). Jede wird abgewartet, bevor die nächste ausgelöst wird,
      // damit die Reihenfolge im Stapel feststeht.
      for (const todo of todos) {
        await page.getByRole('button', { name: `Aktionen für ${todo.title}` }).click();
        await page.getByRole('menuitem', { name: 'Als erledigt markieren' }).click();
        await expect(
          page.locator('.toast').filter({ hasText: `„${todo.title}“ ist erledigt.` }),
        ).toBeVisible();
      }

      // Fünf ausgelöste Meldungen, `MAX_TOASTS = 4`: genau eine Verdrängung.
      await expect(page.locator('.toast')).toHaveCount(4);

      // Die Meldung mit Rückweg steht weiterhin, ihr Knopf ist bedienbar.
      await expect(undoToast).toBeVisible();
      await expect(undoButton).toBeEnabled();

      // Die älteste ohne Aktion — die erste Karte — ist verschwunden.
      const firstCardToast = page.locator('.toast').filter({ hasText: `„${todos[0]?.title}“ ist erledigt.` });
      await expect(firstCardToast).toHaveCount(0);

      // Die drei jüngeren ohne Aktion stehen noch.
      for (const todo of todos.slice(1)) {
        await expect(
          page.locator('.toast').filter({ hasText: `„${todo.title}“ ist erledigt.` }),
        ).toBeVisible();
      }

      // „Schließen" entfernt eine Meldung mit Rückweg weiterhin — genommen ist
      // ihr allein das Verdrängen durch eine fremde Meldung, nicht der eigene
      // Schließweg (`ToastContext.tsx`, Abschnitt „Was einer Meldung mit
      // Aktion weiterhin passieren kann").
      await undoToast.getByRole('button', { name: 'Meldung schließen' }).click();
      await expect(undoToast).toBeHidden();
    } finally {
      await deletePoolByName(undoColumnName).catch(() => undefined);
      await deletePoolByName(cardColumnName).catch(() => undefined);
      for (const todo of todos) {
        await deleteTodo(todo.id).catch(() => undefined);
      }
      await deleteTag(undoTag.id).catch(() => undefined);
      await deleteTag(cardTag.id).catch(() => undefined);
    }
  });
});
