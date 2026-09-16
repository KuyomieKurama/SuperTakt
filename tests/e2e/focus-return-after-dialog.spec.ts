import { todayAt } from './support/local-time';
/**
 * Den Fokus unmittelbar und verzögert nach dem Schließen prüfen: Ein späterer Browser-Frame kann
 * die Rückgabe wieder aufheben.
 * Die Tastaturfälle decken Bearbeiten ab; Löschen und Statuswechsel werden mit der Maus geprüft.
 */
import { test, expect, type Locator, type Page } from '@playwright/test';

import {
  createStatus,
  createTimeEntry,
  createTodo,
  deleteTodo,
  deleteTodoStatus,
} from './support/api';
import { gotoDashboard, gotoExport, gotoTodos } from './support/nav';

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

test.describe('O-JP — der Fokus überlebt das Schließen des "Leistung nachtragen"-Dialogs, aber nicht die eigene Auffrischung (T-218)', () => {
  test('TP-FOCUS-07 — Leistung nachtragen im Export: Messung bei t+0 besteht, Messung nach der Auffrischung sieht den Fehler', async ({
    page,
  }) => {
    const marker = `E2E-FOCUS-BILLING-${String(Date.now())}`;
    const todo = await createTodo({ title: marker });
    // Leere Leistung — genau der Wert, der den Knopf auf den `Button`-Zweig
    // schaltet ("Leistung nachtragen") und der Dialog dieses Knopfes ändert.
    await createTimeEntry({ todoId: todo.id, startedAt: todayAt(5, 0), endedAt: todayAt(5, 45), note: '' });

    try {
      await gotoExport(page);
      // `.export-todo` ist der Todo-Block (trägt den Titel) — `.egroup` liegt
      // seit dem Tabellenumbau eine Ebene tiefer, je Kalendertag, und ist erst
      // nach Aufklappen des Todo-Kopfes erreichbar (T-249-8). Das Todo trägt
      // hier genau eine Buchung an genau einem Tag.
      const todoGroup = page.locator('.export-todo', { hasText: marker });
      await expect(todoGroup).toBeVisible();
      await todoGroup.getByRole('button', { name: /klappen/ }).click();
      const group = todoGroup.locator('.egroup');
      await expect(group).toBeVisible();
      await group.getByRole('button', { name: /klappen/ }).click();

      const row = group.locator('.eentry');
      await expect(row).toHaveCount(1);
      await expect(row.locator('.eentry__note')).toContainText('keine Leistung erfasst');

      // Heutiger Zweig: `Button` mit sichtbarem Text, ohne Zeilenbezug im
      // Namen (die Lücke aus O-IH/SC 2.4.6 ist ein eigener, hier nicht
      // gemessener Befund). Substring-Vergleich (Playwright-Vorgabe), damit
      // dieselbe Suche auch nach T-218 Abschnitt 11.4 träfe, sollte der
      // verborgene Zeilenbezug dann schon ergänzt sein.
      const trigger = row.getByRole('button', { name: 'Leistung nachtragen' });
      await expect(trigger).toBeVisible();

      /*
       * Das Zügel für die Auffrischung (siehe Kopfkommentar). Nur die
       * GET-Anfrage, die `bump()` erneut auslöst (Filter `exportStatus=open`,
       * `ExportScreen.tsx:278-289`), wartet auf `refreshGate`; die ursprüngliche
       * Ladeanfrage ist zu diesem Zeitpunkt längst beantwortet (die Zeile steht
       * ja schon), und die `PATCH`-Anfrage der Änderung selbst trägt weder
       * dieses Muster noch diese Methode und läuft ungebremst durch.
       */
      let releaseRefresh: () => void = () => undefined;
      const refreshGate = new Promise<void>((resolve) => {
        releaseRefresh = resolve;
      });
      await page.route('**/time-entries**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const isOpenEntriesRefresh =
          request.method() === 'GET' &&
          url.pathname.endsWith('/time-entries') &&
          url.searchParams.get('exportStatus') === 'open';
        if (!isOpenEntriesRefresh) {
          await route.continue();
          return;
        }
        await refreshGate;
        await route.continue();
      });

      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Buchung bearbeiten' });
      await expect(dialog).toBeVisible();

      const newNote = `E2E-Leistung-nachgetragen-${marker}`;
      await dialog.getByLabel('Leistung').fill(newNote);
      await dialog.getByRole('button', { name: 'Speichern' }).click();
      await expect(dialog).toBeHidden();

      /*
       * ==================================================================
       * Messung 1 — unmittelbar nach dem Schließen (t+0)
       * ==================================================================
       * `bump()` hat die neue Anfrage erst gestartet, sie kann hier noch
       * nicht zurück sein (T-218 Abschnitt 11.1). Die Zeile trägt deshalb
       * noch die alte, leere Leistung, der ursprüngliche Knopf existiert
       * unverändert, und `finalFocusEl` findet ihn. Diese Messung muss heute
       * bestehen — sonst wäre der Fehler nie über zwei Wellen unentdeckt
       * geblieben (T-218 Abschnitt 11.1, letzter Absatz).
       */
      await expect(trigger, 'Fokus auf dem Auslöser, unmittelbar nach dem Schließen (t+0)').toBeFocused();
      expect(
        await focusedAccessibleName(page),
        'zugänglicher Name des fokussierten Elements, unmittelbar nach dem Schließen (t+0)',
      ).not.toBe('<body>');

      // Referenz auf den Knoten von Messung 1 — die Grundlage für die
      // Knotengleichheit in Messung 2 (siehe Kopfkommentar dieses Blocks).
      const focusedNodeAtT0 = await page.evaluateHandle(() => document.activeElement);

      /*
       * ==================================================================
       * Das Zügel lösen, das Eintreffen der Auffrischung abwarten
       * ==================================================================
       * Erst jetzt darf die gehaltene Anfrage zurück. Wann genau das im
       * Browser ankommt, bleibt offen — deshalb kein fester Zeitwert danach,
       * sondern dasselbe sichtbare Ereignis, das auch den Fehler auslöst: Die
       * Zeile zeigt die neu eingetragene Leistung. `toContainText` ist
       * Playwrights eigene, selbst nachziehende Zusicherung; sie besteht
       * genau dann, wenn die Antwort verarbeitet und neu gezeichnet ist.
       */
      releaseRefresh();
      await expect(row.locator('.eentry__note')).toContainText(newNote);
      await page.unroute('**/time-entries**');

      /*
       * ==================================================================
       * Messung 2 — nach dem Eintreffen der Auffrischung
       * ==================================================================
       * Die einzige Messung, die den heutigen Fehler sieht (T-218 Abschnitt
       * 11.1): React hat den `Button` inzwischen gegen den `IconButton`
       * getauscht, der Knoten von Messung 1 existiert nicht mehr im
       * Dokument, und der Browser hat ihm den Fokus genommen. Heute, vor der
       * Behebung aus T-218 Abschnitt 11.2, fällt er auf `<body>` — diese
       * Messung schlägt deshalb heute erwartungsgemäß fehl.
       */
      const sameNodeAfterRefresh = await page.evaluate(
        (node) => node !== null && node === document.activeElement,
        focusedNodeAtT0,
      );
      expect(
        sameNodeAfterRefresh,
        'derselbe Knoten hält den Fokus auch nach der Auffrischung (T-218 Abschnitt 11.2)',
      ).toBe(true);
      expect(
        await focusedAccessibleName(page),
        'zugänglicher Name des fokussierten Elements nach der Auffrischung — nie "<body>" (T-218 Abschnitt 11.9)',
      ).not.toBe('<body>');
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });
});
