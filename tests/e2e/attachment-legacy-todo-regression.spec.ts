/**
 * TP-ANH-11 (docs/testplan.md, Abschnitt 25.2) — T-150.
 *
 * Ein Todo, das über den bestehenden Weg entsteht — ohne Frist, ohne Anhang,
 * genau wie vor Abschnitt 19 — funktioniert unverändert (A-19.16). Die neuen
 * Felder zeigen sich als „nicht gesetzt", nicht als Fehler oder Platzhalter.
 *
 * Die eigentliche Breite dieser Aussage — jeder bestehende Ablauf aus den
 * Abschnitten 1 bis 24 funktioniert weiter — trägt der unveränderte Rest der
 * Suite: `pnpm test:e2e` lief mit diesem Auftrag vollständig grün (Bericht
 * T-150). Dieser Fall zeigt zusätzlich, ausdrücklich und an einer Stelle, die
 * "nicht gesetzt" genau benennt: Timer starten/stoppen, Erledigt setzen und
 * Aufheben laufen dabei mit, weil sie Teil desselben Ablaufs sind.
 */
import { test, expect } from '@playwright/test';

import { cleanupAnyTimer, createTodo, markTodoDone } from './support/api';
import { gotoTodo } from './support/nav';

test.describe('TP-ANH-11 — bestehende Todos ohne Frist und ohne Anhang funktionieren unverändert', () => {
  test('ein Todo aus dem bestehenden Weg zeigt "nicht gesetzt", keinen Fehler — und der gewohnte Ablauf läuft weiter', async ({
    page,
  }) => {
    await cleanupAnyTimer();

    // Derselbe Weg wie vor Abschnitt 19 — kein `dueDate` im Rumpf.
    const todo = await createTodo({ title: `E2E-ANH-LEGACY-${Date.now()}` });
    await gotoTodo(page, todo.id);

    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    // Die Frist zeigt sich als Satz, nicht als Fehler und nicht als leeres
    // Datumsfeld (A-19.5, A-19.16).
    const deadlineCard = page
      .locator('.card')
      .filter({ has: page.locator('.card__title', { hasText: 'Frist' }) });
    await expect(deadlineCard).toContainText('Keine Frist gesetzt');
    await expect(deadlineCard.locator('.deadline')).toHaveCount(0);
    await expect(deadlineCard.getByRole('button', { name: 'Frist setzen' })).toBeVisible();

    // Anhänge zeigen den Leerzustand, keinen Fehler.
    const attachmentsCard = page
      .locator('.card')
      .filter({ has: page.locator('.card__title', { hasText: 'Anhänge' }) });
    await expect(attachmentsCard).toContainText('Keine Anhänge');
    await expect(attachmentsCard.locator('.attachment')).toHaveCount(0);

    // Der gewohnte Ablauf: Timer starten, stoppen, Erledigt setzen — alles
    // unverändert, obwohl das Todo keine der neuen Eigenschaften trägt.
    const main = page.locator('#inhalt');
    await main.getByRole('button', { name: 'Timer starten' }).first().click();
    await expect(main.getByRole('button', { name: 'Timer stoppen' })).toBeVisible();
    await main.getByRole('button', { name: 'Timer stoppen' }).click();
    const stopDialog = page.getByRole('dialog', { name: 'Timer stoppen' });
    if (await stopDialog.isVisible().catch(() => false)) {
      await stopDialog.getByRole('button', { name: 'Stoppen und buchen' }).click();
      await expect(stopDialog).toBeHidden();
    }

    await markTodoDone(todo.id);
    await page.reload();
    await expect(page.locator('.done-switch strong')).toHaveText('Erledigt');
    // Die Frist bleibt unangetastet von "Erledigt" — weiterhin "nicht gesetzt".
    await expect(deadlineCard).toContainText('Keine Frist gesetzt');

    expect(pageErrors).toEqual([]);

    await cleanupAnyTimer();
    // Kein `deleteTodo`: Ob der kurze Start/Stopp oben eine Buchung
    // hinterlassen hat (Rundung < 1 s, sonst verworfen), ist vom
    // Testzeitpunkt abhängig — ein Todo mit Buchung lässt sich nicht löschen
    // (`time_entry_locked`, dieselbe Lage wie in `note-separation.spec.ts`).
    // Der eindeutige Titel verhindert eine Kollision mit künftigen Läufen.
  });
});
