/**
 * Takt — die Tag-Eingabe (T-059, `apps/web/src/components/TagInput.tsx`).
 *
 * Vorher gab es vier verschiedene Arten, ein Tag zu wählen — eine davon (der
 * Todo-Filter, S-02) hatte **kein** Bedienelement, eine andere (die
 * Poolregel, S-11) war hart auf 40 Tags gekappt. Jetzt ist es eine Eingabe an
 * allen vier Stellen. Diese Datei prüft, was mit der Umstellung neu
 * prüfbar geworden ist und vorher entweder gar nicht ging oder gar nicht
 * geprüft war:
 *
 *  - TAGINPUT-01: Die Vorschläge folgen derselben Namensregel wie der
 *    Dienst (`tagNameKey` aus `packages/domain`, importiert statt
 *    nachgebaut) — `Backend` = `backend` = `„ Backend "`, aber
 *    `Straße` ≠ `Strasse`. Der wertvollste Einzelfall dieser Datei: ein
 *    abweichend geschriebener Name wird als **vorhanden** erkannt, kein
 *    zweites Tag entsteht.
 *  - TAGINPUT-02: Ein neuer Name entsteht beim Anlegen eines Todos in
 *    **derselben Transaktion** (`tagNames`, T-058) — nicht vorher über
 *    einen eigenen Aufruf.
 *  - TAGINPUT-03: Der Todo-Filter (S-02) nimmt jetzt tatsächlich ein Tag
 *    entgegen — vor T-059 gab es dafür keine Bedienung.
 *  - TAGINPUT-04: Die Standard-Tags (S-10) wählen aus dem Bestand, bieten
 *    aber kein Anlegen an (`allowCreate` fehlt dort bewusst,
 *    `TagInput.tsx`).
 *  - TAGINPUT-05: Fund des frontend-dev, hier dauerhaft abgesichert: Ein
 *    `display: flex` auf dem Listeninhalt hatte die `[hidden]`-Regel des
 *    Browsers überschrieben — die zugeklappte Liste blieb für Vorlesehilfen
 *    und die Tabulatortaste im Dokument. Behoben in `base.css`
 *    (`[hidden] { display: none !important }`), hier zum ersten Mal
 *    geprüft statt nur behauptet.
 *
 * Nicht in dieser Datei: die Poolregel (S-11) und ein zweiter vollständiger
 * Durchlauf über die Standard-Tags-Auswahl selbst — beide teilen sich
 * denselben Baustein (`TagCombobox`) mit den hier geprüften Stellen, das
 * Restrisiko einer stellenspezifischen Regression ist klein, aber nicht
 * null. Siehe Bericht zu T-063.
 */
import { test, expect } from '@playwright/test';

import {
  createTag,
  createTodo,
  deleteTag,
  deleteTodo,
  listDefaultTags,
  listOpenTodosByTitle,
  listTags,
  setDefaultTags,
} from './support/api';
import { gotoSettings, gotoTodos } from './support/nav';

test.describe('TAGINPUT-01 — Vorschläge folgen der Namensregel des Dienstes', () => {
  test('„backend“ = „Backend“ = „  Backend  “, aber „Strasse“ ≠ „Straße“', async ({ page }) => {
    const run = Date.now();
    const realBackend = `Backend-${run}`;
    const realStrasse = `Straße-${run}`;
    // Unterscheidet sich von "realStrasse" ausschließlich im fraglichen
    // Zeichen (ß gegen ss) — derselbe Zahlensuffix, damit kein anderer
    // Unterschied das Ergebnis erklären könnte.
    const wrongSpelling = `Strasse-${run}`;

    const backendTag = await createTag(realBackend);
    const strasseTag = await createTag(realStrasse);

    try {
      await gotoTodos(page);
      await page.getByRole('button', { name: 'Neues Todo' }).click();
      const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
      await expect(dialog).toBeVisible();

      const tagsBox = dialog.getByRole('combobox', { name: 'Tags' });
      // Nicht `page.getByText('als neues Tag anlegen')`: Der feste Hinweistext
      // unter dem Feld ("… ein unbekannter lässt sich als neues Tag anlegen.")
      // enthält denselben Satzteil wörtlich und träfe *immer*, unabhängig vom
      // tatsächlichen Angebot. Auf `role="option"` beschränkt trifft nur ein
      // wirklich gerendertes Angebot zum Anlegen.
      const noCreateOffer = (): ReturnType<typeof expect> =>
        expect(page.getByRole('option', { name: /als neues Tag anlegen/ })).toHaveCount(0);

      // --- Kleinschreibung: derselbe Schlüssel, kein Angebot zum Anlegen ---
      await tagsBox.click();
      await tagsBox.fill(realBackend.toLowerCase());
      await expect(page.getByRole('option', { name: realBackend })).toBeVisible();
      await noCreateOffer();

      // --- Umgebende Leerzeichen: dieselbe Normalisierung wie der Dienst,
      // und diesmal tatsächlich ausgewählt (Punkt 2 aus dem Auftrag: ein
      // vorhandenes Tag auswählen können, nicht nur seinen Vorschlag sehen).
      await tagsBox.fill('');
      await tagsBox.fill(`  ${realBackend}  `);
      const backendOption = page.getByRole('option', { name: realBackend });
      await expect(backendOption).toBeVisible();
      await noCreateOffer();
      await backendOption.click();
      await page.keyboard.press('Escape');

      const backendChip = dialog.locator('.taginput__chips .chip', { hasText: realBackend });
      await expect(backendChip).toBeVisible();
      await expect(backendChip).not.toHaveClass(/chip--new/);

      // --- Straße, exakt geschrieben: vorhanden, kein Angebot zum Anlegen -
      await tagsBox.click();
      await tagsBox.fill(realStrasse);
      await expect(page.getByRole('option', { name: realStrasse, exact: true })).toBeVisible();
      await noCreateOffer();

      // --- Strasse (ohne ß): eine andere Namensregel-Prüfung ergäbe hier
      // denselben Treffer wie "Straße" — die Domäne trifft das nicht, also
      // darf die Oberfläche es auch nicht behaupten. Erwartung: Angebot zum
      // Anlegen erscheint, "Straße" erscheint nirgends als Treffer.
      //
      // `exact: true` ist hier kein Stilmittel, sondern notwendig: Playwrights
      // *nicht*-exakter Namensvergleich faltet Groß-/Kleinschreibung über
      // Unicode-Regeln, und die ordnen serverseitig eben nicht — clientseitig
      // aber jedenfalls "ß" derselben gefalteten Form wie "ss" zu. Ohne
      // `exact: true` träfe die Suche nach "Straße-<run>" hier fälschlich auf
      // den Anlegen-Eintrag für "Strasse-<run>" und ließe genau die
      // Verwechslung unentdeckt, die dieser Fall widerlegen soll (selbst so
      // beobachtet, bevor `exact: true` ergänzt wurde).
      await tagsBox.fill('');
      await tagsBox.fill(wrongSpelling);
      // Nicht `exact: true`: Der Eintrag trägt zusätzlich den erklärenden
      // Hinweistext ("Dieses Tag gibt es noch nicht. …") als Teil derselben
      // Textknoten-Kette — ein Teilstring-Treffer genügt hier, da in diesem
      // Zustand ohnehin nur ein einziger Eintrag existiert.
      await expect(page.getByRole('option', { name: `„${wrongSpelling}“ als neues Tag anlegen` })).toBeVisible();
      await expect(page.getByRole('option', { name: realStrasse, exact: true })).toHaveCount(0);

      await page.keyboard.press('Escape');
      await dialog.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(dialog).toBeHidden();
    } finally {
      await deleteTag(backendTag.id).catch(() => undefined);
      await deleteTag(strasseTag.id).catch(() => undefined);
    }
  });
});

test.describe('TAGINPUT-02 — ein neuer Name entsteht beim Anlegen eines Todos in derselben Transaktion', () => {
  test('„neu anlegen“ in der Tag-Eingabe erzeugt das Tag erst mit dem Speichern des Todos', async ({ page }) => {
    const run = Date.now();
    const title = `E2E-TAGCREATE-${run}`;
    const newTagName = `E2E-NeuesTag-${run}`;

    await gotoTodos(page);
    await page.getByRole('button', { name: 'Neues Todo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Titel').fill(title);

    const tagsBox = dialog.getByRole('combobox', { name: 'Tags' });
    await tagsBox.click();
    await tagsBox.fill(newTagName);

    const createOption = page.getByRole('option', { name: `„${newTagName}“ als neues Tag anlegen` });
    await expect(createOption).toBeVisible();
    await createOption.click();
    await page.keyboard.press('Escape');

    // Der Chip trägt sofort die drei Merkmale eines noch nicht angelegten
    // Tags — keines davon nur Farbe (SC 1.4.1): gestrichelte Kontur
    // (`.chip--new`), Pluszeichen statt Punkt, und das Wort "neu".
    const newChip = dialog.locator('.taginput__chips .chip--new', { hasText: newTagName });
    await expect(newChip).toBeVisible();
    await expect(newChip).toContainText('neu');

    // Vor dem Speichern existiert das Tag im Dienst noch nicht.
    const beforeSave = await listTags();
    expect(beforeSave.some((tag) => tag.name === newTagName)).toBe(false);

    await dialog.getByRole('button', { name: 'Anlegen' }).click();
    await expect(dialog).toBeHidden();

    await expect(page.locator('.toast__title')).toHaveText('Todo angelegt.');
    await expect(page.locator('.toast__body')).toContainText('Neu angelegt wurde das Tag');
    await expect(page.locator('.toast__body')).toContainText(newTagName);

    let createdTagId: string | undefined;
    try {
      // Jetzt existiert es — auf der Wurzelebene, wie die Tag-Eingabe es
      // angekündigt hatte ("Es entsteht auf der Wurzelebene").
      const afterSave = await listTags();
      const createdTag = afterSave.find((tag) => tag.name === newTagName);
      expect(createdTag).toBeDefined();
      expect(createdTag?.folderId ?? null).toBeNull();
      createdTagId = createdTag?.id;

      // Und das Todo trägt es tatsächlich — nicht nur der Toast behauptet es.
      const [createdTodo] = await listOpenTodosByTitle(title);
      expect(createdTodo).toBeDefined();
      expect(createdTodo?.tagIds ?? []).toContain(createdTagId);

      if (createdTodo !== undefined) await deleteTodo(createdTodo.id).catch(() => undefined);
    } finally {
      if (createdTagId !== undefined) await deleteTag(createdTagId).catch(() => undefined);
    }
  });
});

test.describe('TAGINPUT-03 — Todo-Filter nimmt jetzt ein Tag entgegen (vorher kein Bedienelement, T-059)', () => {
  test('Filtern nach Tag zeigt nur das passende Todo, Entfernen zeigt wieder beide', async ({ page }) => {
    const run = Date.now();
    const tagA = await createTag(`E2E-FilterA-${run}`);
    const tagB = await createTag(`E2E-FilterB-${run}`);
    const todoA = await createTodo({ title: `E2E-FILTER-A-${run}`, tagIds: [tagA.id] });
    const todoB = await createTodo({ title: `E2E-FILTER-B-${run}`, tagIds: [tagB.id] });

    try {
      await gotoTodos(page);

      const rowA = page.locator('.todo-row', { hasText: todoA.title });
      const rowB = page.locator('.todo-row', { hasText: todoB.title });
      await expect(rowA).toBeVisible();
      await expect(rowB).toBeVisible();

      const filterBox = page.getByRole('combobox', { name: 'Tags' });
      await filterBox.click();
      await filterBox.fill(tagA.name);
      await page.getByRole('option', { name: tagA.name }).click();
      await page.keyboard.press('Escape');

      // Aktiver Filter sichtbar (I-10) und die Liste tatsächlich eingeschränkt.
      await expect(page.locator('.filter-chip', { hasText: tagA.name })).toBeVisible();
      await expect(rowA).toBeVisible();
      await expect(rowB).toHaveCount(0);

      // Entfernen über den Filter-Chip selbst — beide wieder da.
      await page.getByRole('button', { name: `Filter Tag ${tagA.name} entfernen` }).click();
      await expect(rowA).toBeVisible();
      await expect(rowB).toBeVisible();
    } finally {
      await deleteTodo(todoA.id).catch(() => undefined);
      await deleteTodo(todoB.id).catch(() => undefined);
      await deleteTag(tagA.id).catch(() => undefined);
      await deleteTag(tagB.id).catch(() => undefined);
    }
  });
});

test.describe('TAGINPUT-04 — Standard-Tags (S-10): auswählen aus dem Bestand, kein Anlegen', () => {
  test('ein vorhandenes Tag als Standard-Tag setzen, danach wieder auf den ursprünglichen Bestand zurück', async ({
    page,
  }) => {
    const run = Date.now();
    const tag = await createTag(`E2E-Standardtag-${run}`);
    const original = await listDefaultTags();

    try {
      await gotoSettings(page, 'standardtags');

      const input = page.getByRole('combobox', { name: 'Standard-Tags' });
      await input.click();
      await input.fill(tag.name);

      // Kein "neu anlegen" hier — anders als im Todo-Dialog fehlt
      // `allowCreate` bewusst (`SettingsScreen.tsx`, `TagInput.tsx`
      // Dateikopf): Standard-Tags werden aus dem Bestand gewählt, nicht
      // nebenbei erfunden.
      const option = page.getByRole('option', { name: tag.name });
      await expect(option).toBeVisible();
      // Nicht `getByText(...)`: die statische Hilfe unter dem Feld
      // ("… ein unbekannter lässt sich als neues Tag anlegen.") enthält
      // denselben Satzteil wörtlich und träfe hier immer, unabhängig vom
      // tatsächlichen Angebot. Auf die Rolle beschränkt trifft nur ein
      // wirklich gerendertes Angebot zum Anlegen.
      await expect(page.getByRole('option', { name: /als neues Tag anlegen/ })).toHaveCount(0);
      await option.click();
      await page.keyboard.press('Escape');

      await expect(page.locator('.taginput__chips .chip', { hasText: tag.name })).toBeVisible();
      await page.getByRole('button', { name: 'Speichern' }).click();

      await expect
        .poll(async () => {
          const current = await listDefaultTags();
          return current.some((entry) => entry.tagId === tag.id);
        })
        .toBe(true);
    } finally {
      // Ursprünglichen Bestand zuerst wiederherstellen (globale Einstellung,
      // von der Testsuite geteilt), erst danach das Testtag selbst löschen —
      // sonst verwiese die wiederhergestellte Liste kurzzeitig auf ein
      // gerade gelöschtes Tag.
      await setDefaultTags(original.map((entry) => entry.tagId)).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});

test.describe('TAGINPUT-05 — geschlossenes Auswahlfeld bleibt für Tastatur und Vorlesehilfen unsichtbar (T-059-Fund)', () => {
  test('Tab über ein geschlossenes Auswahlfeld landet nicht in dessen Optionen', async ({ page }) => {
    /*
     * Fund des frontend-dev (T-059-Bericht, Punkt 2, "Drittens"): `[hidden]
     * { display: none }` steht im Blatt des Browsers und liegt damit unter
     * jeder eigenen Regel. `.select__content { display: flex }` hob das auf
     * — die zugeklappte Liste blieb im Baum stehen, unsichtbar geschoben,
     * aber für Vorlesehilfe und Tabulator vorhanden. Behoben über eine
     * eigene `[hidden] { display: none !important }`-Regel in `base.css`.
     * Bisher nur behauptet, hier zum ersten Mal geprüft.
     */
    await gotoTodos(page);
    await page.getByRole('button', { name: 'Neues Todo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Neues Todo' });
    await expect(dialog).toBeVisible();

    const statusTrigger = dialog.getByRole('combobox', { name: 'Statusspalte' });
    await statusTrigger.focus();
    await expect(statusTrigger).toBeFocused();

    // Die Liste hängt per `<Portal>` am Dokumentkörper (`Select.tsx`), nicht
    // im Baum des Dialogs — `dialog.locator('.select__content')` träfe
    // nichts. Und `page.locator('.select__content')` ungefiltert träfe
    // *mehrere*: Die Filterleiste dahinter (S-02, "Statusspalte"/"Pool") und
    // "Farbmodus" in der Kopfleiste sind ebenfalls Auswahlfelder und bleiben
    // hinter dem Dialog im Baum stehen. Eindeutig wird es erst über die
    // Kennung, die der Auslöser selbst nennt (`aria-controls`).
    const contentId = await statusTrigger.getAttribute('aria-controls');
    if (contentId === null) throw new Error('Auslöser trägt kein aria-controls.');
    const content = page.locator(`[id="${contentId}"]`);

    // Geschlossen: die zugehörige Liste trägt tatsächlich `hidden` — nicht
    // nur `data-state="closed"` auf dem Auslöser.
    await expect(content).toHaveAttribute('hidden', '');
    await expect(content).toBeHidden();

    // Der nächste Tabulatorschritt geht am geschlossenen Feld vorbei — nicht
    // in seine (eigentlich unsichtbare) Optionsliste hinein.
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('combobox', { name: 'Tags' })).toBeFocused();

    const activeElementInHiddenContent = await page.evaluate((id) => {
      const contentEl = document.getElementById(id);
      const active = document.activeElement;
      return contentEl !== null && active !== null && contentEl.contains(active);
    }, contentId);
    expect(activeElementInHiddenContent).toBe(false);

    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  });
});
