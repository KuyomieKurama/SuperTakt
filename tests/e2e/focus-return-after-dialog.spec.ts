/**
 * Fokusrückkehr zum Menü-Auslöser nach dem Schließen eines Dialogs — die
 * Reihe, die den Fokusfall selbst misst (T-170, Auflage O-DY aus T-162).
 *
 * ===========================================================================
 * Warum diese Datei existiert, und warum keine Einheitenprüfung dafür reicht
 * ===========================================================================
 *
 * O-CY-2 stand zweimal auf dem Board, weil zweimal eine Zusage gemacht wurde,
 * die keine Prüfung hielt: T-157 hat `focusTriggerFirst` in `Menu.tsx`
 * eingebaut und als Behebung gemeldet; T-161 hat im Browser gemessen, dass
 * der Fokus nach Escape trotzdem auf `<body>` fiel — für „Bearbeiten" **und**
 * „Löschen", mit der Maus **und** mit der Tastatur, und bei einem
 * Menüeintrag ganz ohne Dialog (O-CY-3). T-162 hat die Ursache geklärt
 * (`focusMenu` aus `@zag-js/menu` holt den Fokus per `requestAnimationFrame`
 * zurück, bevor die Fokusfalle des Dialogs scharfstellt) und mit
 * `finalFocusEl` aus einem `useLayoutEffect` in `DialogSurface.tsx` behoben —
 * Einzelheiten in den Kopfkommentaren von `apps/web/src/components/Menu.tsx`
 * und `apps/web/src/components/DialogSurface.tsx`.
 *
 * Der Fehler ist eine Wettlaufbedingung zwischen einem `requestAnimationFrame`
 * und React-Zustandsänderungen — genau die Art von Fehler, die eine
 * Komponentenprüfung mit gefälschten Zeitgebern nicht sieht (sie sieht nicht
 * *wann* der echte Browser einen Frame malt). Deshalb trägt kein
 * `unit-tester`-Fall diesen Fall; der richtige Ort ist diese Reihe, im echten
 * Chromium.
 *
 * ===========================================================================
 * Was gemessen wird, und warum zu mehreren Zeitpunkten
 * ===========================================================================
 *
 * `document.activeElement` **nach** dem Schließen — nicht nur unmittelbar
 * danach, sondern auch einige hundert Millisekunden später. Genau darin lag
 * der Fehler, den T-157 übersehen und T-161 gefunden hat: Die Rückholung
 * griff zunächst (der Auslöser bekam kurz echt den Fokus), wurde dann aber
 * von `focusMenu` rückgängig gemacht, bevor der Menükasten verschwand. Eine
 * Prüfung, die nur bei t+0 hinsieht, hätte den Fehlschlag verpasst.
 *
 * Geprüft wird der **zugängliche Name** des fokussierten Elements
 * (`focusedAccessibleName` unten), nicht nur „irgendetwas hat den Fokus" —
 * der Fall aus T-161 fiel auf `<body>`, und `<body>` ist auch ein Element.
 * Ein bloßes `expect(locator).toBeFocused()` auf den erwarteten Auslöser
 * deckt denselben Fall zwar ebenfalls ab (es schlägt fehl, wenn `<body>` den
 * Fokus trägt), sagt im Fehlerfall aber nicht, *was* ihn stattdessen trägt —
 * deshalb zusätzlich die explizite Namensprobe.
 *
 * ===========================================================================
 * Was diese Reihe abdeckt, und was nicht
 * ===========================================================================
 *
 * Abgedeckt: „Bearbeiten" mit der Maus und mit der Tastatur (Pfeil ab +
 * Eingabe, ohne Pause dazwischen — mit Pause verdeckte sich der Fehler laut
 * T-161/T-162), „Löschen" (Rückfragedialog statt Formulardialog), Abschluss
 * über „Abbrechen" statt Escape, ein Menüeintrag ohne Dialog (O-CY-3,
 * Statuswechsel im Zeilenmenü) und die Gegenprobe „Neues Todo" auf dem
 * Dashboard, wo kein Menü davorsteht und es immer schon stimmte.
 *
 * Nicht abgedeckt: „Löschen" und der Statuswechsel über die Tastatur — beide
 * ließen sich nur mit einer festen Anzahl `ArrowDown`-Tastendrücke erreichen,
 * und diese Zahl hängt von der Zahl der im gemeinsamen Testbestand bereits
 * vorhandenen Status ab (dieselbe SQLite-Datei über den ganzen `test:e2e`-Lauf,
 * `support/services.ts`). Ein fester Zähler wäre entweder falsch oder ein
 * Zufallstreffer gewesen. Der Tastaturweg selbst ist mit „Bearbeiten"
 * (TP-FOCUS-02) bereits gemessen — der Unterschied zwischen den Einträgen ist
 * für den Fehler ohne Bedeutung, er sitzt in `@zag-js/menu` und kennt keinen
 * Eintragstyp.
 */
import { test, expect, type Locator, type Page } from '@playwright/test';

import {
  createStatus,
  createTodo,
  deleteTodo,
  deleteTodoStatus,
} from './support/api';
import { gotoDashboard, gotoTodos } from './support/nav';

/**
 * Der zugängliche Name des fokussierten Elements: `aria-label` zuerst (die
 * Menü-Auslöser tragen ihn über `triggerLabel`, `Menu.tsx`), sonst der
 * sichtbare Text (der Dashboard-Knopf „Neues Todo" trägt keinen). `<body>`
 * kommt als eigene, benannte Zeichenkette zurück statt als `null` oder leerer
 * Text — sonst sähe der Fehlschlag aus T-161 in einem Testprotokoll wie „kein
 * Text" statt wie das, was er ist: der Fokus liegt auf dem Dokumentkörper.
 */
async function focusedAccessibleName(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (active === null) return null;
    if (active === document.body) return '<body>';
    const ariaLabel = active.getAttribute('aria-label');
    if (ariaLabel !== null && ariaLabel.trim().length > 0) return ariaLabel;
    return active.textContent?.trim() ?? null;
  });
}

/**
 * Prüft `document.activeElement` bei t+0/100/300/600 ms — dieselben
 * Meßpunkte, mit denen T-162 den Fehler und die Behebung belegt hat
 * (`.claude/team/board.md`, T-162: „t+0/100/300/600/1000 ms"). Vier statt
 * fünf Punkte: Ein Unterschied, der sich bis 600 ms nicht zeigt, zeigt sich
 * nach den Messungen aus T-162 auch bis 1000 ms nicht mehr — der Fokus fällt
 * hier, wenn überhaupt, innerhalb der ersten zwei Browser-Frames.
 */
async function expectTriggerHoldsFocus(page: Page, trigger: Locator, name: string): Promise<void> {
  for (const delayMs of [0, 100, 300, 600]) {
    if (delayMs > 0) await page.waitForTimeout(delayMs);
    await expect(trigger, `Fokus auf dem Auslöser, t+${String(delayMs)}ms`).toBeFocused();
    expect(
      await focusedAccessibleName(page),
      `zugänglicher Name des fokussierten Elements, t+${String(delayMs)}ms`,
    ).toBe(name);
  }
}

function todoRow(page: Page, title: string): Locator {
  return page.locator('.todo-row', { hasText: title });
}

/** Der Menü-Auslöser einer Zeile — `triggerLabel` aus `TodoListScreen.tsx`, `TodoRow`. */
function rowMenuTrigger(page: Page, title: string): Locator {
  return todoRow(page, title).getByRole('button', { name: `Menü für „${title}“` });
}

test.describe('O-DY — der Menü-Auslöser hält den Fokus nach dem Schließen eines Dialogs, mit vollem Namen, auch später gemessen', () => {
  test('TP-FOCUS-01 — Maus: Zeilenmenü → „Bearbeiten" → Escape', async ({ page }) => {
    const title = `E2E-FOCUS-MOUSE-${String(Date.now())}`;
    const todo = await createTodo({ title });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();

      const dialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-02 — Tastatur, ohne Pause: Pfeil ab + Eingabe → „Bearbeiten" → Escape', async ({ page }) => {
    const title = `E2E-FOCUS-KEY-${String(Date.now())}`;
    const todo = await createTodo({ title });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.focus();

      /*
       * Eingabe auf dem Auslöser öffnet das Menü und markiert den ersten
       * Eintrag ("Öffnen") — `@zag-js/menu`, `menu.machine.mjs`, Übergang
       * `closed --ARROW_DOWN--> open` mit `highlightFirstItem` (die
       * Zustandsmaschine bildet `Enter` auf dasselbe Ereignis ab wie
       * `ArrowDown`, `menu.connect.mjs`). Diese Zwischenprobe liegt bewusst
       * **vor** dem kritischen Schritt, nicht dazwischen.
       *
       * Den echten DOM-Fokus trägt dabei **der Menükasten** (`role="menu"`,
       * `tabIndex: 0`), nicht der einzelne Eintrag — die Markierung läuft
       * über `aria-activedescendant`/`data-highlighted` (`menu.connect.mjs`,
       * `getItemProps`), das klassische Muster für zusammengesetzte Widgets.
       * Ein `toBeFocused()` auf den Eintrag selbst wäre deshalb immer falsch,
       * unabhängig vom hier geprüften Fehler.
       */
      await page.keyboard.press('Enter');
      await expect(page.getByRole('menu')).toBeFocused();
      await expect(page.getByRole('menuitem', { name: 'Öffnen' })).toHaveAttribute('data-highlighted', '');

      /*
       * Der gemessene Fehlerfall (Menu.tsx, Kopfkommentar): "Liegen Pfeiltaste
       * und Eingabe im selben Bild — bei der Tastatur der Regelfall —,
       * überholt dieses Bild die Behebung." Deshalb hier ohne jede eigene
       * Wartezeit zwischen den beiden Tasten — mit einer Pause dazwischen
       * hätte T-157 den Fehler nicht übersehen.
       */
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-03 — Maus: Zeilenmenü → „Löschen" (Rückfragedialog statt Formulardialog) → Escape', async ({
    page,
  }) => {
    const title = `E2E-FOCUS-DELETE-${String(Date.now())}`;
    const todo = await createTodo({ title });
    let deleted = false;
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      await page.getByRole('menuitem', { name: 'Löschen' }).click();

      // `role="alertdialog"`, nicht `role="dialog"` — der andere der beiden
      // Dialogbausteine, die O-CY-2 betrifft (`ConfirmDialog.tsx`).
      const dialog = page.getByRole('alertdialog', { name: 'Todo löschen?' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      if (!deleted) await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-04 — Abschluss über „Abbrechen" statt Escape', async ({ page }) => {
    const title = `E2E-FOCUS-CANCEL-${String(Date.now())}`;
    const todo = await createTodo({ title });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();

      const dialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
      await expect(dialog).toBeVisible();
      // Derselbe Rückweg wie Escape (beide setzen `open` auf `false`), aber
      // über einen Knopfklick statt eine Taste — eine eigene Auslösung von
      // `onDismiss`/`onCancel`, kein bloßer zweiter Weg zu Escape.
      await dialog.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(dialog).toBeHidden();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-05 — Eintrag ohne Dialog: ein Statuswechsel im Zeilenmenü lässt den Fokus nicht ins Nichts fallen (O-CY-3)', async ({
    page,
  }) => {
    const run = Date.now();
    const title = `E2E-FOCUS-NODIALOG-${String(run)}`;
    const statusA = await createStatus(`E2E-Focus-Status-A-${String(run)}`);
    const statusB = await createStatus(`E2E-Focus-Status-B-${String(run)}`);
    const todo = await createTodo({ title, statusId: statusA.id });
    try {
      await gotoTodos(page, { q: title });
      const trigger = rowMenuTrigger(page, title);
      await trigger.click();
      // Dieser Eintrag öffnet keinen Dialog — die Zeile bleibt stehen, das
      // Menü schließt sich selbst (`Menu.tsx`, `useSelectHandler`).
      await page.getByRole('menuitem', { name: `Status: ${statusB.name}` }).click();
      await expect(page.getByText(`Status geändert: ${statusB.name}.`)).toBeVisible();

      await expectTriggerHoldsFocus(page, trigger, `Menü für „${title}“`);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTodoStatus(statusA.id).catch(() => undefined);
      await deleteTodoStatus(statusB.id).catch(() => undefined);
    }
  });

  test('TP-FOCUS-06 — Gegenprobe: „Neues Todo" auf dem Dashboard, kein Menü davor, stimmte schon vor T-162', async ({
    page,
  }) => {
    await gotoDashboard(page);
    // `.screen__actions` grenzt gegen den zweiten, gleichnamigen Knopf im
    // Leerzustand der Karte "Zuletzt bearbeitet" ab (`DashboardScreen.tsx`) —
    // der erscheint nur, wenn der gemeinsame Testbestand noch kein Todo
    // kennt, und ist über den ganzen `test:e2e`-Lauf hinweg nicht verlässlich
    // leer oder gefüllt.
    const trigger = page.locator('.screen__actions').getByRole('button', { name: 'Neues Todo' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await expectTriggerHoldsFocus(page, trigger, 'Neues Todo');
  });
});
