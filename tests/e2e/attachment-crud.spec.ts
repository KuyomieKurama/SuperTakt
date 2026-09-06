/**
 * TP-ANH-01 bis TP-ANH-04, TP-ANH-07, TP-ANH-08, TP-ANH-09, TP-ANH-10 Stufe 1
 * (docs/testplan.md, Abschnitt 25.2) — T-150.
 *
 * Je Art das passende Eingabefeld, kein Rest beim Wechseln, mehrere Anhänge
 * gemischter Art gleichzeitig sichtbar, eine Ersatzbezeichnung, wenn der Titel
 * fehlt, ein Bild als Vorschaubild ohne externe Anfrage, Entfernen, und die
 * erste Stufe der Persistenzprüfung (Browserspeicher leeren, neu laden — die
 * zweite, echte Prozess-Neustart-Stufe steht separat in
 * `attachment-persistence-live.spec.ts`, siehe dort für die Begründung).
 *
 * Feldbezeichnungen sind über `getByRole('textbox', …)` angesprochen, nicht
 * über `getByLabel(…)`: Die Art-Auswahl (`RadioRow`) trägt für "Bild" dieselbe
 * sichtbare Beschriftung wie das Pflichtfeld der Art "Bild"
 * (`ATTACHMENT_VALUE_LABEL.image === "Bild"`) — `getByLabel('Bild')` träfe
 * deshalb zweideutig sowohl den Optionsknopf als auch das Textfeld.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createTodo, deleteTodo } from './support/api';
import { gotoTodo } from './support/nav';

/** Ein minimales, gültiges 1×1-PNG (rot) — selbst erzeugt, kein Verweis auf echte Bilddaten. */
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function attachmentsCardOn(page: import('@playwright/test').Page) {
  return page.locator('.card').filter({ has: page.locator('.card__title', { hasText: 'Anhänge' }) });
}

test.describe('TP-ANH-01 bis TP-ANH-04, TP-ANH-07 bis TP-ANH-10 Stufe 1', () => {
  test('Feld je Art, kein Rest beim Wechseln, drei gemischte Anhänge, Ersatzbezeichnung, Vorschaubild, Entfernen, Persistenz über einen Neuladevorgang', async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000);

    const workDir = await mkdtemp(join(tmpdir(), 'takt-e2e-anhang-'));
    const filePath = join(workDir, 'e2e-anhang-bericht.txt');
    const imagePath = join(workDir, 'e2e-anhang-bild.png');
    await writeFile(filePath, 'E2E-Testinhalt, keine echten Kundendaten.\n', 'utf8');
    await writeFile(imagePath, Buffer.from(MINIMAL_PNG_BASE64, 'base64'));

    const externalRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
        externalRequests.push(request.url());
      }
    });

    const dueDate = (() => {
      const date = new Date();
      date.setDate(date.getDate() + 14);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${String(year)}-${month}-${day}`;
    })();

    const todo = await createTodo({ title: `E2E-ANH-${Date.now()}`, dueDate });
    await gotoTodo(page, todo.id);
    const attachmentsCard = attachmentsCardOn(page);

    // --- TP-ANH-01/02/03 + Zusatzfall: Feld je Art, kein Rest beim Wechseln --
    await attachmentsCard.getByRole('button', { name: 'Anhang hinzufügen' }).click();
    const addDialog = page.getByRole('dialog', { name: 'Anhang hinzufügen' });
    await expect(addDialog).toBeVisible();

    // Voreinstellung: Verweis — Adressfeld, kein Bild-, kein Dateipfadfeld.
    await expect(addDialog.getByRole('radio', { name: 'Verweis' })).toBeChecked();
    await expect(addDialog.getByRole('textbox', { name: 'Adresse' })).toBeVisible();
    await expect(addDialog.getByRole('textbox', { name: 'Bild' })).toHaveCount(0);
    await expect(addDialog.getByRole('textbox', { name: 'Dateipfad' })).toHaveCount(0);

    const firstLinkAddress = 'https://beispiel.example/ordner/erste-seite';
    await addDialog.getByRole('textbox', { name: 'Adresse' }).fill(firstLinkAddress);

    // Wechsel auf Bild: Adressfeld verschwindet, das neue Feld ist leer.
    await addDialog.getByRole('radio', { name: 'Bild' }).check();
    await expect(addDialog.getByRole('textbox', { name: 'Adresse' })).toHaveCount(0);
    const imageField = addDialog.getByRole('textbox', { name: 'Bild' });
    await expect(imageField).toBeVisible();
    await expect(imageField).toHaveValue('');
    await imageField.fill('/pfad/der/nicht-verwendet-wird.png');

    // Wechsel auf Datei: Bildfeld verschwindet, das neue Feld ist wieder leer
    // — kein Rest der Adresse und kein Rest des zuvor eingetragenen Bildpfads.
    await addDialog.getByRole('radio', { name: 'Datei' }).check();
    await expect(addDialog.getByRole('textbox', { name: 'Bild' })).toHaveCount(0);
    const fileField = addDialog.getByRole('textbox', { name: 'Dateipfad' });
    await expect(fileField).toBeVisible();
    await expect(fileField).toHaveValue('');

    // Zurück auf Verweis, um den ersten Anhang tatsächlich anzulegen — das
    // Feld ist wieder leer, derselbe Beweis in die Gegenrichtung.
    await addDialog.getByRole('radio', { name: 'Verweis' }).check();
    await expect(addDialog.getByRole('textbox', { name: 'Adresse' })).toHaveValue('');
    await addDialog.getByRole('textbox', { name: 'Adresse' }).fill(firstLinkAddress);
    await addDialog.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(addDialog).toBeHidden();

    // --- TP-ANH-08a: Verweis ohne Titel zeigt etwas Lesbares aus der Adresse -
    const list = attachmentsCard.locator('.attachment-list');
    await expect(list.locator('.attachment')).toHaveCount(1);
    await expect(list.locator('.attachment').first()).toContainText('beispiel.example/ordner/erste-seite');

    // --- TP-ANH-02: Bild hinzufügen -----------------------------------------
    await attachmentsCard.getByRole('button', { name: 'Anhang hinzufügen' }).click();
    await expect(addDialog).toBeVisible();
    await addDialog.getByRole('radio', { name: 'Bild' }).check();
    await addDialog.getByRole('textbox', { name: 'Bild' }).fill(imagePath);
    await addDialog.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(addDialog).toBeHidden();

    // --- TP-ANH-03 + TP-ANH-08b: Datei ohne Titel zeigt den Dateinamen ------
    await attachmentsCard.getByRole('button', { name: 'Anhang hinzufügen' }).click();
    await expect(addDialog).toBeVisible();
    await addDialog.getByRole('radio', { name: 'Datei' }).check();
    await addDialog.getByRole('textbox', { name: 'Dateipfad' }).fill(filePath);
    await addDialog.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(addDialog).toBeHidden();

    // --- TP-ANH-08c: Verweis MIT Titel — der Titel steht unverändert -------
    await attachmentsCard.getByRole('button', { name: 'Anhang hinzufügen' }).click();
    await expect(addDialog).toBeVisible();
    await addDialog.getByRole('textbox', { name: 'Adresse' }).fill('https://beispiel.example/zweite-seite');
    await addDialog.getByRole('textbox', { name: 'Titel' }).fill('Mein Verweis');
    await addDialog.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(addDialog).toBeHidden();

    // --- TP-ANH-04: alle vier gleichzeitig sichtbar, stabile Reihenfolge ---
    const rows = list.locator('.attachment');
    await expect(rows).toHaveCount(4);
    const labels = await rows.allInnerTexts();
    expect(labels[0]).toContain('beispiel.example/ordner/erste-seite');
    // Reihenfolge des Hinzufügens: Verweis, Bild, Datei, Verweis (mit Titel).
    expect(labels[2]).toContain('e2e-anhang-bericht.txt'); // TP-ANH-08b
    expect(labels[3]).toContain('Mein Verweis'); // TP-ANH-08c

    // --- TP-ANH-09: das Bild wird als Vorschaubild dargestellt -------------
    const imageRow = rows.nth(1);
    await expect(imageRow).toHaveClass(/attachment--image/);
    const img = imageRow.locator('img.attachment__image');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src?.startsWith('data:image/')).toBe(true);
    // Kein Öffnen-Knopf für ein Bild (E-072 Punkt 2: es öffnet nichts nach draußen).
    await expect(imageRow.locator('button.attachment__open')).toHaveCount(0);

    // --- TP-ANH-07: Entfernen ------------------------------------------------
    await rows.nth(2).getByRole('button', { name: /entfernen/i }).click();
    const removeDialog = page.getByRole('alertdialog', { name: 'Anhang entfernen' });
    await expect(removeDialog).toBeVisible();
    await removeDialog.getByRole('button', { name: 'Entfernen' }).click();
    await expect(removeDialog).toBeHidden();
    await expect(rows).toHaveCount(3);
    await expect(list).not.toContainText('e2e-anhang-bericht.txt');

    // Ein erneutes Laden zeigt die entfernte Datei nicht wieder — Entfernen
    // ist im Bestand angekommen, nicht nur im Zustand der Seite.
    await page.reload();
    await expect(attachmentsCardOn(page).locator('.attachment')).toHaveCount(3);
    await expect(attachmentsCardOn(page)).not.toContainText('e2e-anhang-bericht.txt');

    // --- TP-ANH-10 Stufe 1: Browserspeicher leeren und neu laden ------------
    await context.clearCookies();
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();

    const deadlineCard = page
      .locator('.card')
      .filter({ has: page.locator('.card__title', { hasText: 'Frist' }) });
    await expect(deadlineCard.locator('.deadline')).toBeVisible();
    const attachmentsAfterClear = attachmentsCardOn(page);
    await expect(attachmentsAfterClear.locator('.attachment')).toHaveCount(3);
    await expect(attachmentsAfterClear).toContainText('beispiel.example/ordner/erste-seite');
    await expect(attachmentsAfterClear).toContainText('Mein Verweis');
    const imageAfterClear = attachmentsAfterClear.locator('.attachment').nth(1).locator('img.attachment__image');
    await expect(imageAfterClear).toBeVisible();
    await expect(imageAfterClear).toHaveAttribute('src', /^data:image\//);

    expect(externalRequests).toEqual([]);

    // --- Aufräumen -----------------------------------------------------------
    await deleteTodo(todo.id);
    await rm(workDir, { recursive: true, force: true });
  });
});
