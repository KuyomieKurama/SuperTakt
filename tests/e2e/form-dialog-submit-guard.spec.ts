/**
 * O-KC — der eine Riegel in `FormDialog.tsx#submit`, und kein Lauf hat ihn
 * bisher gesehen (T-220, Auflage Z-64.1; Auftrag T-227).
 *
 * ===========================================================================
 * Warum dieser eine Prüffall der wichtigste an neun Dialogen ist
 * ===========================================================================
 *
 * T-220 hat alle neun Formulardialoge mit `submitDisabled` (E-093) von
 * `disabled` auf `aria-disabled` umgestellt: Der Absendeknopf ist seither
 * **tabulierbar und klickbar**, tabellarisch aufgezählt im eigenen Bericht
 * (`.claude/team/reports/T-220-frontend-dev.md`, Abschnitt 4) —
 * `TagsScreen` „Neuen Tag anlegen"/„Neuen Ordner anlegen"/„Umbenennen",
 * `TemplatesScreen` „Vorlage kopieren", `StatusSettings` anlegen/umbenennen,
 * `PoolFormDialog`, `Attachments` „Anhang hinzufügen", `PoolRenameDialog" und
 * die Musterseite. Dass die **Handlung** trotzdem nicht läuft, ist seit T-220
 * keine bauliche Eigenschaft eines `disabled`-Attributs mehr, sondern **eine
 * Zeile** im gemeinsamen `submit` von `FormDialog.tsx`:
 *
 * ```ts
 * if (busy) return;
 * setSubmitAttempt((count) => count + 1);
 * setQuiet(true);
 * if (submitDisabled) return;   // <- dieser Riegel, einmal, für alle neun
 * onSubmit();
 * ```
 *
 * T-220 hat das selbst benannt, wörtlich: „Der Riegel ist ab heute die
 * einzige Sicherung, und kein Lauf sieht ihn. […] Wer sie umstellt — etwa
 * beim gemeinsamen Meldungswirt […] —, macht acht Dialoge still, und **alle**
 * heutigen Prüffälle blieben grün." Weil der Riegel in genau einer Funktion
 * für alle neun Dialoge steht, genügt **ein** Prüffall an einer realen
 * Aufrufstelle, um ihn zu bewachen — dieselbe Überlegung, die
 * `export-audit-and-locks.spec.ts` (O-GZ, TP-EXPST-15) für den strukturell
 * verwandten, aber eigenständigen Torwächter in
 * `ConfirmDialog.tsx#confirmOrExplain` bereits trägt. Gewählt ist hier
 * `TagsScreen` „Neuen Tag anlegen": das einfachste der neun Formulare (ein
 * Pflichtfeld, keine zweite Sperrbedingung, kein `busy`-Zwischenschritt) und
 * dieselbe Stelle, an der T-220 selbst im Browser gemessen hat (Bericht,
 * Abschnitt 3.1/3.2).
 *
 * ===========================================================================
 * Drei Messungen, und die dritte ist die, die sonst fehlt
 * ===========================================================================
 *
 * Ein Fall, der nur die Meldung nach dem gesperrten Klick prüft, misst die
 * Hälfte — dieselbe Lehre wie bei O-GZ. Und ein Fall, der nur die Hälfte
 * „die Handlung bleibt aus" misst, ohne danach zu zeigen, dass ein gefülltes
 * Feld dieselbe Handlung tatsächlich auslöst, misst einen Knopf, der auch
 * dann geschwiegen hätte, wenn `onSubmit` nirgends mehr aufgerufen würde —
 * ein Riegel, der nie wieder öffnet, sähe in den ersten beiden Messungen
 * identisch aus. Deshalb unten **beide** Fälle mit **drei** Messungen:
 *
 *  1. Klick auf den gesperrten Knopf → die deutsche Meldung erscheint.
 *  2. Dieselbe Handlung läuft **nicht** — geprüft am Netzverkehr (keine
 *     Anfrage an den Dienst) **und** am Bestand (`listTags()` unverändert),
 *     nicht am bloßen Augenschein des Dialogzustands.
 *  3. Mit gefülltem Feld läuft sie **sofort**, mit demselben Knopf, ohne
 *     erneuten Dialogaufbau.
 *
 * ===========================================================================
 * Die Playwright-Falle — geprüft gegen T-192, jetzt für neun Dialoge
 * ===========================================================================
 *
 * Playwright hält ein `aria-disabled="true"`-Element für nicht bedienbar und
 * verweigert einen gewöhnlichen `.click()`. Der Klick auf den gesperrten
 * Knopf braucht deshalb `{ force: true }` — dokumentiert seit T-192
 * (`docs/testplan.md`, Abschnitt 28, TP-EXPST-15) für den strukturell
 * verwandten Bestätigungsknopf des Zurücksetzen-Dialogs. Diese Datei ist die
 * erste Anwendung an einem der **neun** `FormDialog`-Absendeknöpfe, für die
 * dieselbe Falle jetzt ebenfalls gilt; der Testplan-Abschnitt ist im Zug
 * dieser Aufgabe um einen Verweis hierher ergänzt.
 *
 * ===========================================================================
 * Die Eingabetaste — die Hälfte von E-093, die ein Benutzer tatsächlich merkt
 * ===========================================================================
 *
 * T-217 hat im **vorherigen** Bauzustand (hartes `disabled`) gemessen: Enter
 * im frisch geöffneten Dialog war ein **stummer Leerlauf** — kein Netzaufruf,
 * leerer Text in jedem `role="alert"`, bitgleiches Bild vor und nach der
 * Taste. Das ist mit dem Umbau auf `aria-disabled` nicht mehr nachstellbar
 * (der alte Bauzustand existiert im heutigen Quelltext nicht mehr) und wird
 * hier deshalb nicht erneut behauptet, sondern als historischer Befund
 * zitiert. Was **heute** gilt und hier gemessen wird, ist die Umkehrung, von
 * T-220 im Browser gemessen und hier erstmals automatisiert: Enter greift
 * **sofort** — der `<button type="submit">` ist weiterhin der Standardknopf
 * des Formulars (kein `disabled` mehr an ihm), also läuft die Eingabetaste in
 * denselben Riegel wie ein Klick, zeigt dieselbe Meldung und löst dieselbe
 * Handlung erst mit gefülltem Feld aus. Genau dieser Weg — Absenden über die
 * Eingabetaste an einem `submitDisabled`-Dialog — ist vor dieser Datei in
 * keinem Prüffall gegangen worden: `field-live-region-announcement.spec.ts`
 * prüft Enter ausschließlich am „Neues Todo"-Dialog, der **kein**
 * `submitDisabled` führt (eigene, serverseitig geprüfte Validierung seit
 * T-175); `export-audit-and-locks.spec.ts` (O-GZ) prüft den gesperrten Knopf
 * des `ConfirmDialog` ausschließlich per Klick.
 */
import { test, expect } from '@playwright/test';

import { deleteTag, listTags } from './support/api';
import { gotoTags } from './support/nav';

/** Zählt POST-Anfragen an genau die Route, die ein neues Tag anlegt. */
function trackTagCreationRequests(page: import('@playwright/test').Page): string[] {
  const calls: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/v1/tags')) {
      calls.push(request.url());
    }
  });
  return calls;
}

test.describe('O-KC — Der eine Riegel in FormDialog.tsx#submit, gemessen am „Neuen Tag anlegen"-Dialog', () => {
  test('Klick auf den gesperrten Absendeknopf: die Meldung erscheint, die Handlung bleibt aus (Netzverkehr und Bestand) — mit gefülltem Feld läuft sie sofort', async ({
    page,
  }) => {
    const tagCreationRequests = trackTagCreationRequests(page);
    const tagName = `E2E-Guard-Klick-${Date.now()}`;
    let createdTagId: string | null = null;

    try {
      const before = await listTags();

      await gotoTags(page);
      await page.getByRole('button', { name: 'Tag', exact: true }).click();

      const dialog = page.getByRole('dialog', { name: 'Neuen Tag anlegen' });
      await expect(dialog).toBeVisible();

      const submitButton = dialog.getByRole('button', { name: 'Anlegen' });
      await expect(submitButton).toHaveAttribute('aria-disabled', 'true');

      // Genau ein Feld im Rumpf dieses Dialogs ("Name") — derselbe Zugriff
      // wie in `field-live-region-announcement.spec.ts`.
      const nameField = dialog.locator('.field').first();
      const alertRegion = nameField.locator('[role="alert"]');
      await expect(alertRegion).toBeEmpty();

      // --- Messung 1 und 2: Klick auf den gesperrten Knopf -------------------
      //
      // `{ force: true }` überspringt ausschließlich Playwrights eigene
      // Erreichbarkeitsprüfung (siehe Dateikopf, T-192); das ausgelöste
      // Klickereignis ist ein echtes, vertrauenswürdiges Ereignis über die
      // Eingabe-Pipeline des Browsers, auf das React reagiert wie auf jeden
      // anderen Klick.
      await submitButton.click({ force: true });

      // Messung 1: die deutsche Meldung erscheint, am selben Knoten, der
      // vorher leer war (Bauplan aus T-186/O-DA).
      await expect(alertRegion).toContainText('Name fehlt.');

      // Messung 2: die Handlung läuft NICHT — geprüft an zwei unabhängigen
      // Stellen, nicht am Augenschein des Dialogzustands allein.
      //
      //   a) Netzverkehr: keine einzige Anfrage an die Route, die ein Tag
      //      anlegt, ist unterwegs gewesen.
      expect(tagCreationRequests).toHaveLength(0);
      //   b) Bestand: `GET /tags` liefert exakt dieselbe Menge wie vorher.
      const afterBlockedClick = await listTags();
      expect(afterBlockedClick.map((tag) => tag.id).sort()).toEqual(before.map((tag) => tag.id).sort());
      // Der Dialog selbst bleibt zusätzlich offen — der Riegel hat den
      // Versuch abgefangen, nicht etwa den Klick verschluckt.
      await expect(dialog).toBeVisible();

      // --- Messung 3: mit gefülltem Feld läuft dieselbe Handlung sofort ------
      //
      // Ohne diese dritte Messung wäre ein Riegel, der `onSubmit` dauerhaft
      // abfängt, von einem funktionierenden nicht zu unterscheiden — beide
      // bestehen die ersten beiden Messungen identisch.
      await dialog.getByLabel('Name').fill(tagName);
      await expect(submitButton).not.toHaveAttribute('aria-disabled');
      await submitButton.click();

      await expect(dialog).toBeHidden();
      expect(tagCreationRequests.length).toBeGreaterThanOrEqual(1);
      const afterFilledClick = await listTags();
      const created = afterFilledClick.find((tag) => tag.name === tagName);
      expect(created).toBeDefined();
      createdTagId = created?.id ?? null;
    } finally {
      if (createdTagId !== null) await deleteTag(createdTagId).catch(() => undefined);
    }
  });

  test('Eingabetaste im frisch geöffneten Dialog: die Sperre hält zurück und meldet sich (T-220), statt wie vor dem Umbau stumm zu bleiben (T-217) — mit gefülltem Feld läuft sie sofort', async ({
    page,
  }) => {
    const tagCreationRequests = trackTagCreationRequests(page);
    const tagName = `E2E-Guard-Enter-${Date.now()}`;
    let createdTagId: string | null = null;

    try {
      const before = await listTags();

      await gotoTags(page);
      await page.getByRole('button', { name: 'Tag', exact: true }).click();

      const dialog = page.getByRole('dialog', { name: 'Neuen Tag anlegen' });
      await expect(dialog).toBeVisible();

      // Fokus liegt beim Öffnen auf dem ersten Formularfeld
      // (`FIRST_FIELD_SELECTOR`, `FormDialog.tsx`) — kein Tabulatorschritt
      // nötig, um „frisch geöffnet" auch tatsächlich zu treffen.
      const nameInput = dialog.getByLabel('Name');
      await expect(nameInput).toBeFocused();

      const nameField = dialog.locator('.field').first();
      const alertRegion = nameField.locator('[role="alert"]');
      await expect(alertRegion).toBeEmpty();

      // --- Messung 1 und 2: Enter auf dem leeren Pflichtfeld ------------------
      //
      // `type="submit"` bleibt der Standardknopf des Formulars — Enter erfüllt
      // seit T-220 keinen stummen Leerlauf mehr (T-217, historischer
      // Bauzustand, siehe Dateikopf), sondern läuft in denselben Riegel wie
      // ein Klick.
      await nameInput.press('Enter');

      await expect(alertRegion).toContainText('Name fehlt.');
      expect(tagCreationRequests).toHaveLength(0);
      const afterBlockedEnter = await listTags();
      expect(afterBlockedEnter.map((tag) => tag.id).sort()).toEqual(before.map((tag) => tag.id).sort());
      await expect(dialog).toBeVisible();

      // --- Messung 3: mit gefülltem Feld löst dieselbe Taste sofort aus ------
      await nameInput.fill(tagName);
      await nameInput.press('Enter');

      await expect(dialog).toBeHidden();
      expect(tagCreationRequests.length).toBeGreaterThanOrEqual(1);
      const afterFilledEnter = await listTags();
      const created = afterFilledEnter.find((tag) => tag.name === tagName);
      expect(created).toBeDefined();
      createdTagId = created?.id ?? null;
    } finally {
      if (createdTagId !== null) await deleteTag(createdTagId).catch(() => undefined);
    }
  });
});
