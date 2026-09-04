/**
 * A-6.8 / B-1 (docs/testplan.md, Abschnitt 22) — T-120.
 *
 * Beim Timerwechsel (A-6.8 — ein zweiter Timerstart stoppt und bucht den
 * ersten, dann startet der zweite) darf kein Bild entstehen, in dem eine
 * Abdunklung (`.scrim`) und eine Meldung (`.toast`) gleichzeitig sichtbar
 * sind.
 *
 * ## Der Befund (T-116, behoben in T-118)
 *
 * `confirmSwitch` (`apps/web/src/app/TimerContext.tsx`) zeigte bis T-118 die
 * Meldung „Zeit gebucht auf „X“." bereits **innerhalb** von `performStop`,
 * schloss den Bestätigungsdialog (`setConflict(null)`) aber erst, nachdem der
 * anschließende `await startTimer(...)` — ein zweiter, vollständiger
 * Netzumlauf — abgeschlossen war. Für dessen gesamte Dauer stand die Meldung
 * hinter der Abdunklung: entstanden mit `pointer-events: none`, außerhalb des
 * `aria-modal="true"`, ihre Achtsekundenfrist lief bereits. Seit T-118 liegt
 * `setConflict(null)` unmittelbar hinter `await performStop(...)`, ohne
 * dazwischenliegenden `await` — beide Zustandsänderungen fallen damit in
 * dieselbe Zeichnung, und die Meldung kann in keinem Bild mehr hinter der
 * Abdunklung stehen (gemessen in `reports/T-118-frontend-dev.md`, Abschnitt 2:
 * vorher genau ein Bild mit beidem, nachher keines).
 *
 * ## Wie dieser Fall es misst (E-062 — im Browser, nicht in einer Nachbildung)
 *
 * Ein `MutationObserver` auf `document.body` protokolliert bei jeder
 * DOM-Änderung, ob `.scrim` und `.toast` gleichzeitig existieren, und meldet
 * einen Treffer über eine `page.exposeFunction`-Brücke an den Testfall
 * zurück — das entspricht demselben Prinzip wie die Renderprotokollierung aus
 * dem genannten Bericht, nur gegen die tatsächlich laufende Anwendung
 * statt einer Wegwerf-Seite. Beobachtet wird ausschließlich der Ausschnitt
 * dieses einen Wechsels: Vor dem Klick auf „Stoppen und wechseln" steht der
 * Meldungsstapel nachweislich leer (`toHaveCount(0)`), damit kein Toast aus
 * einer anderen Handlung den Befund verfälschen kann — der Dialog selbst
 * (mit seiner eigenen Abdunklung, aber ohne Meldung) ist zu diesem Zeitpunkt
 * ausdrücklich erlaubt und wird deshalb nicht als Treffer gezählt.
 *
 * Zwei Todos ohne Tags und ohne Regel: Kein `poolMovement` lenkt vom
 * eigentlichen Befund ab, die Toast-Texte bleiben auf ihre kürzeste Form
 * beschränkt (`hasText` prüft deshalb nur den stabilen Kern, nicht den ganzen
 * Satz).
 */
import { test, expect } from '@playwright/test';

import { cleanupAnyTimer, createTodo, deleteTodo } from './support/api';
import { gotoTodos } from './support/nav';

test.afterEach(async () => {
  await cleanupAnyTimer();
});

test.describe('A-6.8 / B-1 — kein Bild mit Abdunklung und Meldung gleichzeitig beim Timerwechsel', () => {
  test('Meldung „Zeit gebucht" entsteht nie hinter dem Scrim des Wechsel-Dialogs', async ({ page }) => {
    await cleanupAnyTimer();

    const run = Date.now();
    const todoA = await createTodo({ title: `E2E-Wechsel-A-${run}` });
    const todoB = await createTodo({ title: `E2E-Wechsel-B-${run}` });

    try {
      // Beide Todos auf einen Blick, ohne den Rest des Bestands im
      // Tabulator-Weg zu haben (nicht Gegenstand dieses Falls).
      await gotoTodos(page, { q: String(run) });

      await page.getByRole('button', { name: `Timer für „${todoA.title}“ starten` }).click();
      const startToastA = page.locator('.toast').filter({ hasText: `Er läuft auf „${todoA.title}“` });
      await expect(startToastA).toBeVisible();
      // Aufgeräumt, damit der Meldungsstapel vor dem eigentlichen Wechsel
      // nachweislich leer ist — sonst wäre die folgende `toHaveCount(0)`
      // sinnlos.
      await startToastA.getByRole('button', { name: 'Meldung schließen' }).click();
      await expect(startToastA).toBeHidden();

      // Echte Dauer, kein `discarded` (`MINIMUM_DURATION_SECONDS`).
      await page.waitForTimeout(1200);

      await page.getByRole('button', { name: `Timer für „${todoB.title}“ starten` }).click();
      const dialog = page.getByRole('dialog', { name: 'Es läuft bereits ein Timer' });
      await expect(dialog).toBeVisible();

      // Der Dialog selbst darf hier stehen (eigene Abdunklung, aber kein
      // Toast) — das ist der erlaubte Ausgangszustand, den der Beobachter
      // unten nicht als Treffer zählen soll.
      await expect(page.locator('.toast')).toHaveCount(0);

      await dialog.getByLabel(`Leistung für „${todoA.title}“`).fill('E2E-Wechsel-Leistungstext');

      const badFrames: unknown[] = [];
      await page.exposeFunction('__t120ReportBadFrame', (info: unknown) => {
        badFrames.push(info);
      });
      await page.evaluate(() => {
        const report = (window as unknown as { __t120ReportBadFrame: (info: unknown) => void })
          .__t120ReportBadFrame;
        const check = (): void => {
          const scrimCount = document.querySelectorAll('.scrim').length;
          const toastTitles = Array.from(document.querySelectorAll('.toast__title')).map(
            (element) => element.textContent ?? '',
          );
          if (scrimCount > 0 && toastTitles.length > 0) report({ scrimCount, toastTitles });
        };
        new MutationObserver(check).observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      });

      await dialog.getByRole('button', { name: 'Stoppen und wechseln' }).click();

      // Nach dem Wechsel stehen zwei Meldungen — eine für jedes Todo, jede
      // nennt ihr eigenes (W-5 aus R-2a).
      const stopToastA = page.locator('.toast').filter({ hasText: `Zeit gebucht auf „${todoA.title}“.` });
      const startToastB = page.locator('.toast').filter({ hasText: `Er läuft auf „${todoB.title}“` });
      await expect(stopToastA).toBeVisible();
      await expect(startToastB).toBeVisible();
      await expect(dialog).toBeHidden();
      await expect(page.locator('.scrim')).toHaveCount(0);

      expect(badFrames).toEqual([]);
    } finally {
      await cleanupAnyTimer();
      await deleteTodo(todoA.id).catch(() => undefined);
      await deleteTodo(todoB.id).catch(() => undefined);
    }
  });
});
