/**
 * Fünf bei mir angemeldete Fälle (T-048), aus drei Berichten zusammengezogen:
 *
 *  - TP-SEC-13 — Exportieren, Exportstatus zurücksetzen, erneut exportieren.
 *    Der Weg, den R-10 nachvollziehbar halten soll: Der Verlauf dieser
 *    Buchung zeigt danach drei Protokollzeilen in der richtigen Reihenfolge,
 *    mit der Begründung des Zurücksetzens dazwischen (T-040, offene Frage 2a).
 *    Reset und der zweite Export laufen hier bewusst in schneller Folge — das
 *    ist genau das Szenario, für das Migration 0007 die Reihenfolge im
 *    Protokoll von `occurred_at` auf `rowid` umgestellt hat, weil zwei
 *    Protokollzeilen derselben Sekunde sonst vertauscht sein konnten.
 *  - „Verlauf dieser Buchung" bei einer nie exportierten Buchung (T-040,
 *    offene Frage 2c): Leerzustand statt Fehler.
 *  - Der gesperrte Export (T-045, offene Frage 1): Vorschau antwortet nicht →
 *    „Export ausführen" ist gesperrt, Meldung mit Ursache, Wiederholung holt
 *    die Zahlen zurück.
 *  - Derselbe Fehlschlag, während der Bestätigungsdialog bereits offen ist:
 *    der Dialog muss verschwinden und darf nicht von selbst wiederkommen.
 *
 * Die beiden letzten Fälle bilden die Vorschau-Fehlschläge über
 * `page.route()` gegen `POST /export/preview` nach — es gibt in diesem Aufbau
 * keinen anderen Weg, den Dienst gezielt für genau diese eine Route
 * scheitern zu lassen, ohne den Dienst selbst zu verändern (nicht meine
 * Dateihoheit). Der zweite Fall braucht zusätzlich einen Kniff: Der
 * Bestätigungsdialog ist ein echtes Modal (`.scrim` mit `position: fixed;
 * inset: 0`) und blockiert jeden echten Klick auf die Auswahl dahinter — ein
 * Testklick käme nie an. `locator.click({ force: true })` überspringt genau
 * die Erreichbarkeitsprüfung (sichtbar, nicht verdeckt), löst aber weiterhin
 * ein echtes, vertrauenswürdiges Klickereignis über die Eingabe-Pipeline des
 * Browsers aus — React reagiert also genauso, wie es auf einen normalen
 * Klick reagieren würde. Das bildet denselben Codepfad nach, den in
 * Wirklichkeit z. B. eine zweite gleichzeitige Sitzung auslösen könnte, die
 * eine der ausgewählten Buchungen während der Bestätigung ändert.
 */
import { test, expect } from '@playwright/test';

import { createTimeEntry, createTodo, deleteTimeEntry, listTimeEntriesByTodo } from './support/api';
import { runExportFromScreen } from './support/actions';
import { gotoExport, gotoTodo } from './support/nav';

function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Öffnet das Zeilenmenü der einzigen Buchung auf S-03 und wählt einen Eintrag. */
async function chooseEntryMenuItem(
  page: import('@playwright/test').Page,
  label: string,
): Promise<void> {
  await page.locator('.entry-row').getByRole('button', { name: 'Menü für diese Buchung' }).click();
  await page.getByRole('menuitem', { name: label }).click();
}

test('TP-SEC-13 — exportieren, zurücksetzen, erneut exportieren: Verlauf bleibt in der richtigen Reihenfolge nachvollziehbar', async ({
  page,
}) => {
  const title = `E2E-AUDIT-CYCLE-${Date.now()}`;
  const todo = await createTodo({ title });
  await createTimeEntry({
    todoId: todo.id,
    startedAt: todayAt(5, 0),
    endedAt: todayAt(5, 20),
    note: 'Erster Durchlauf',
  });

  // --- Erster Export -------------------------------------------------------
  await gotoExport(page);
  await expect(page.locator('.egroup', { hasText: title })).toBeVisible();
  await runExportFromScreen(page);

  const afterFirstExport = await listTimeEntriesByTodo(todo.id);
  expect(afterFirstExport[0]?.exportStatus).toBe('exported');
  expect(afterFirstExport[0]?.exportCount).toBe(1);

  // --- Zurücksetzen, mit Begründung und ausdrücklicher Bestätigung ---------
  await gotoTodo(page, todo.id);
  await chooseEntryMenuItem(page, 'Exportstatus zurücksetzen');
  const resetDialog = page.getByRole('alertdialog', { name: 'Exportstatus zurücksetzen?' });
  await expect(resetDialog).toBeVisible();
  const reasonText = `E2E-Begruendung-${Date.now()}`;
  await resetDialog.getByLabel(/Begründung für das Protokoll/).fill(reasonText);
  await resetDialog
    .getByLabel(/Mir ist klar, dass diese Zeit dadurch ein zweites Mal abgerechnet werden kann/)
    .check();
  await resetDialog.getByRole('button', { name: 'Zurücksetzen' }).click();
  await expect(resetDialog).toBeHidden();

  const afterReset = await listTimeEntriesByTodo(todo.id);
  expect(afterReset[0]?.exportStatus).toBe('open');
  expect(afterReset[0]?.exportCount).toBe(1); // E-047/R-10: die Historie sinkt beim Zurücksetzen nicht.

  // --- Zweiter Export, unmittelbar danach (Migration 0007 betrifft genau ---
  // diesen Fall: zwei Protokollzeilen in derselben Sekunde). -----------------
  await gotoExport(page);
  await expect(page.locator('.egroup', { hasText: title })).toBeVisible();
  await runExportFromScreen(page);

  const afterSecondExport = await listTimeEntriesByTodo(todo.id);
  expect(afterSecondExport[0]?.exportStatus).toBe('exported');
  expect(afterSecondExport[0]?.exportCount).toBe(2);

  // --- Verlauf dieser Buchung: drei Zeilen, jüngste zuerst, in der ----------
  // tatsächlichen Reihenfolge der Vorgänge, mit der Begründung dazwischen.
  await gotoTodo(page, todo.id);
  await chooseEntryMenuItem(page, 'Verlauf dieser Buchung');
  const history = page.getByRole('dialog', { name: 'Verlauf dieser Buchung' });
  await expect(history).toBeVisible();

  const rows = history.locator('.auditrow');
  await expect(rows).toHaveCount(3);
  // Jüngste zuerst: exportiert (2.), zurückgesetzt, exportiert (1.).
  await expect(rows.nth(0)).toHaveClass(/auditrow--exported/);
  await expect(rows.nth(1)).toHaveClass(/auditrow--reset/);
  await expect(rows.nth(1)).toContainText(reasonText);
  await expect(rows.nth(2)).toHaveClass(/auditrow--exported/);

  await history.getByRole('button', { name: 'Schließen', exact: true }).click();
  await expect(history).toBeHidden();

  // Dieselbe Kette ist auch im Gesamtprotokoll (S-07, dritter Bereich) zu
  // finden — S-07 hat seit T-040 drei Bereiche: Export, Vorlagen, Protokoll.
  await gotoExport(page);
  await page.getByRole('link', { name: 'Protokoll' }).click();
  await expect(page).toHaveURL(/#\/export\/protokoll/);
  await expect(page.getByRole('heading', { name: 'Exportprotokoll' })).toBeVisible();
});

test('Verlauf einer nie exportierten Buchung zeigt den Leerzustand, keinen Fehler', async ({ page }) => {
  const title = `E2E-AUDIT-EMPTY-${Date.now()}`;
  const todo = await createTodo({ title });
  await createTimeEntry({
    todoId: todo.id,
    startedAt: todayAt(6, 0),
    endedAt: todayAt(6, 15),
    note: 'Nie exportiert',
  });

  await gotoTodo(page, todo.id);
  await chooseEntryMenuItem(page, 'Verlauf dieser Buchung');
  const history = page.getByRole('dialog', { name: 'Verlauf dieser Buchung' });
  await expect(history).toBeVisible();

  await expect(history.getByText('In keinem Exportlauf gewesen.')).toBeVisible();
  await expect(
    history.getByText('Für diese Buchung ist nichts protokolliert'),
  ).toBeVisible();
  await expect(history.locator('.auditrow')).toHaveCount(0);
  // Kein Fehlerzustand — insbesondere keine "InlineMessage" mit Gefahrenton.
  await expect(history.locator('[role="alert"]')).toHaveCount(0);

  // Aufräumen: keine offene Buchung im gemeinsamen Bestand zurücklassen.
  for (const entry of await listTimeEntriesByTodo(todo.id)) await deleteTimeEntry(entry.id);
});

test('Der gesperrte Export: Vorschau antwortet nicht → Schaltfläche gesperrt, Meldung mit Ursache, Wiederholung möglich', async ({
  page,
}) => {
  // Zwei Gruppen: Die Gliederung selbst (`GET .../export/preview` über *alle*
  // offenen Buchungen) muss beim ersten Laden gelingen, sonst gäbe es gar
  // keine `.egroup`-Elemente, an denen sich "gesperrt" zeigen ließe. Die
  // eigentliche Fehlschlagsprobe kommt danach über die *Auswahl* (zweiter,
  // von der Gliederung unabhängiger Aufruf derselben Route mit den
  // ausgewählten statt aller Kennungen) — deshalb zwei Gruppen: Eine
  // abwählen ändert die Auswahl, ohne sie leer werden zu lassen (eine leere
  // Auswahl braucht laut `ExportScreen.tsx` gar keine Vorschau und ginge in
  // den Zustand `idle`, nicht `failed`).
  const run = Date.now();
  const titleA = `E2E-LOCKED-A-${run}`;
  const titleB = `E2E-LOCKED-B-${run}`;
  const todoA = await createTodo({ title: titleA });
  const todoB = await createTodo({ title: titleB });
  await createTimeEntry({ todoId: todoA.id, startedAt: todayAt(7, 0), endedAt: todayAt(7, 20), note: 'Gruppe A' });
  await createTimeEntry({ todoId: todoB.id, startedAt: todayAt(7, 30), endedAt: todayAt(7, 50), note: 'Gruppe B' });

  await gotoExport(page);
  const groupA = page.locator('.egroup', { hasText: titleA });
  const groupB = page.locator('.egroup', { hasText: titleB });
  await expect(groupA).toBeVisible();
  await expect(groupB).toBeVisible();

  const exportButton = page.getByRole('button', { name: 'Export ausführen' });
  await expect(exportButton).toBeEnabled();

  // Ab jetzt scheitert jede weitere Gesamtvorschau — die bereits geladene
  // Gliederung bleibt davon unberührt.
  let failPreview = true;
  await page.route('**/api/v1/export/preview', async (route) => {
    if (!failPreview) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'server_error', message: 'E2E: absichtlich fehlgeschlagen' } }),
    });
  });

  // Auswahl ändern löst eine neue Gesamtvorschau aus, die jetzt scheitert.
  // `dispatchEvent('click')` statt eines echten Klicks: das Kontrollkästchen
  // ist zwar sichtbar und nicht überdeckt, aber der native Klick auf ein
  // gerade neu gerendertes Kästchen ist in diesem Lauf spürbar instabil
  // (siehe Bericht); das Ereignis direkt am Element ist deterministisch und
  // löst denselben `onChange` aus.
  await groupA.locator('input.egroup__check').dispatchEvent('click');

  await expect(exportButton).toBeDisabled();
  const failure = page.locator('[role="alert"]', { hasText: 'Die Gesamtvorschau ließ sich nicht abrufen' });
  await expect(failure).toBeVisible();
  await expect(failure).toContainText('E2E: absichtlich fehlgeschlagen');
  await expect(page.getByText('Zeilen und Stunden unbekannt — die Vorschau hat nicht geantwortet')).toBeVisible();
  // Die Gliederung selbst bleibt stehen — nur die Zahlen fehlen.
  await expect(groupA).toBeVisible();
  await expect(groupB).toBeVisible();

  // --- Wiederholung: die Zahlen kommen zurück, die Auswahl bleibt ----------
  failPreview = false;
  await failure.getByRole('button', { name: 'Erneut versuchen' }).click();
  await expect(exportButton).toBeEnabled();
  await expect(failure).toBeHidden();

  // Der Export selbst läuft danach normal durch — nur mit der Buchung, die
  // zum Zeitpunkt des Fehlschlags noch ausgewählt war (Gruppe B).
  await runExportFromScreen(page);
  const entriesB = await listTimeEntriesByTodo(todoB.id);
  expect(entriesB[0]?.exportStatus).toBe('exported');
  const entriesA = await listTimeEntriesByTodo(todoA.id);
  expect(entriesA[0]?.exportStatus).toBe('open'); // war zum Laufzeitpunkt abgewählt.

  // Aufräumen: die bewusst offen gelassene Buchung nicht im Bestand lassen.
  for (const entry of entriesA) await deleteTimeEntry(entry.id);
});

test('Fehlschlag der Vorschau, während der Bestätigungsdialog bereits offen ist: der Dialog verschwindet und kommt nicht von selbst zurück', async ({
  page,
}) => {
  const run = Date.now();
  const titleA = `E2E-LOCKED-OPEN-A-${run}`;
  const titleB = `E2E-LOCKED-OPEN-B-${run}`;
  const todoA = await createTodo({ title: titleA });
  const todoB = await createTodo({ title: titleB });
  await createTimeEntry({ todoId: todoA.id, startedAt: todayAt(8, 0), endedAt: todayAt(8, 20), note: 'Gruppe A' });
  await createTimeEntry({ todoId: todoB.id, startedAt: todayAt(9, 0), endedAt: todayAt(9, 20), note: 'Gruppe B' });

  await gotoExport(page);
  const groupA = page.locator('.egroup', { hasText: titleA });
  const groupB = page.locator('.egroup', { hasText: titleB });
  await expect(groupA).toBeVisible();
  await expect(groupB).toBeVisible();

  const exportButton = page.getByRole('button', { name: 'Export ausführen' });
  await expect(exportButton).toBeEnabled();
  await exportButton.click();
  const confirmDialog = page.getByRole('alertdialog', { name: 'Export ausführen?' });
  await expect(confirmDialog).toBeVisible();

  // Ab jetzt scheitert jede weitere Gesamtvorschau.
  await page.route('**/api/v1/export/preview', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'server_error', message: 'E2E: Datenänderung während der Bestätigung' } }),
    }),
  );

  // Die Auswahl ändert sich, während der Dialog offen ist (siehe Dateikopf:
  // `dispatchEvent`, weil das Modal echte Klicks auf die Auswahl dahinter
  // ohnehin blockieren würde — `force: true` bringt hier nichts, weil es nur
  // Playwrights eigene Erreichbarkeitsprüfung überspringt, den Klick aber
  // weiterhin an den obersten Bildpunkt schickt, und der gehört dem Scrim).
  await groupA.locator('input.egroup__check').dispatchEvent('click');

  await expect(confirmDialog).toBeHidden();
  await expect(exportButton).toBeDisabled();
  await expect(page.locator('[role="alert"]', { hasText: 'Die Gesamtvorschau ließ sich nicht abrufen' })).toBeVisible();

  // Er kommt nicht von selbst zurück, obwohl der Auslöser (der Knopf) noch
  // dieselbe Handlung anböte.
  await page.waitForTimeout(500);
  await expect(confirmDialog).toBeHidden();

  // Aufräumen: beide Buchungen bleiben offen (nie exportiert) — nicht im
  // gemeinsamen Bestand zurücklassen.
  for (const entry of await listTimeEntriesByTodo(todoA.id)) await deleteTimeEntry(entry.id);
  for (const entry of await listTimeEntriesByTodo(todoB.id)) await deleteTimeEntry(entry.id);
});

/**
 * O-GZ (T-192, aus T-186 selbst benannt) — TP-EXPST-15.
 *
 * T-186 hat den Bestätigungsknopf dieses Dialogs von `disabled` auf
 * `aria-disabled` umgestellt (O-GP), damit er mit der Tastatur erreichbar
 * bleibt und ein Klick sagen kann, was fehlt (SC 3.3.1). Genau das macht ihn
 * aber **anklickbar** — die einzige Sicherung gegen die Handlung ist seither
 * der Torwächter im `onClick` (`ConfirmDialog.tsx#confirmOrExplain`), und
 * der war ungemessen. Zwei Fälle, beide nötig, weil dies der Dialog ist,
 * hinter dem eine mögliche Doppelabrechnung liegt (E-012, R-10): die Meldung
 * erscheint, UND die Handlung läuft **nicht** — ein Fall, der nur die
 * Meldung prüft, misst die Hälfte.
 *
 * **Playwright-Falle (von T-186 selbst benannt, hier für den nächsten Fall
 * dokumentiert):** Playwright hält ein `aria-disabled="true"`-Element für
 * nicht bedienbar und verweigert einen gewöhnlichen `.click()`. Der Klick auf
 * den gesperrten Knopf braucht deshalb `{ force: true }` — das überspringt
 * ausschließlich Playwrights eigene Erreichbarkeitsprüfung (sichtbar, nicht
 * verdeckt), löst aber weiterhin ein echtes, vertrauenswürdiges
 * Klickereignis über die Eingabe-Pipeline des Browsers aus, auf das React
 * genauso reagiert wie auf einen gewöhnlichen Klick. Ohne diesen Hinweis
 * hält der nächste Prüffall den Knopf für kaputt, wenn `click()` ohne
 * `force` scheitert.
 *
 * Die Bauplan-Messung aus T-186 (`toHaveCount(1)` **und** `toBeEmpty()`
 * vorher, Marke am Knoten, derselbe Knoten nachher —
 * `field-live-region-announcement.spec.ts` ist die Vorlage) läuft hier
 * gleich mit: eine zweite, im Produkt tatsächlich erreichbare Stelle
 * derselben Bauart — neben der Titelmeldung des Anlegen-Dialogs (Befund
 * O-DA, geprüft in `field-live-region-announcement.spec.ts`). Bewusst über
 * die Befundkennung und die Datei benannt, nicht über den heutigen
 * Dialogtitel im Wortlaut (O-KB, T-227): Ein Zitat des Titels wäre hier
 * unangebunden — diese Datei prüft ihn nicht selbst — und würde bei der
 * nächsten Titeländerung still falsch, statt mit dem dort stehenden
 * Prüffall rot zu werden. Dieselbe Berichtigung wie in T-205 an O-IW
 * (`timer-stop-announcement.spec.ts`), hier nachgezogen, wo T-224 sie
 * ausdrücklich außerhalb des eigenen Auftrags belassen hatte.
 */
test('O-GZ — Klick auf den gesperrten Bestätigungsknopf beim Zurücksetzen: die Meldung erscheint, doch die Handlung bleibt aus; erst mit Begründung läuft sie', async ({
  page,
}) => {
  const title = `E2E-GATE-RESET-${Date.now()}`;
  const todo = await createTodo({ title });
  await createTimeEntry({
    todoId: todo.id,
    startedAt: todayAt(10, 0),
    endedAt: todayAt(10, 20),
    note: 'Vor dem Zurücksetzen',
  });

  await gotoExport(page);
  await expect(page.locator('.egroup', { hasText: title })).toBeVisible();
  await runExportFromScreen(page);

  const afterExport = await listTimeEntriesByTodo(todo.id);
  expect(afterExport[0]?.exportStatus).toBe('exported');
  expect(afterExport[0]?.exportCount).toBe(1);

  await gotoTodo(page, todo.id);
  await chooseEntryMenuItem(page, 'Exportstatus zurücksetzen');
  const resetDialog = page.getByRole('alertdialog', { name: 'Exportstatus zurücksetzen?' });
  await expect(resetDialog).toBeVisible();

  const confirmButton = resetDialog.getByRole('button', { name: 'Zurücksetzen' });
  await expect(confirmButton).toHaveAttribute('aria-disabled', 'true');

  // Vorher: die Meldefläche der Begründung steht schon da, aber leer — genau
  // der Bauplan aus T-186 (siehe Dateikopf).
  const liveRegion = resetDialog.locator('.dialog__reason .field__live');
  await expect(liveRegion).toHaveCount(1);
  await expect(liveRegion).toBeEmpty();
  await liveRegion.evaluate((element) => element.setAttribute('data-e2e-marker', 'reset-reason-live'));

  // Der Klick auf den gesperrten Knopf, ohne Begründung und ohne das
  // Kontrollkästchen — beide Bedingungen aus `ConfirmDialog.tsx#blocked`
  // fehlen hier gleichzeitig; welche davon den Torwächter auslöst, ist für
  // diesen Fall unerheblich, denn `confirmOrExplain` setzt `reasonTouched`
  // in jedem gesperrten Fall (siehe Dateikopf im Quelltext).
  await confirmButton.click({ force: true });

  // Derselbe markierte Knoten trägt jetzt den Text — kein neues, zweites
  // `role="alert"` an anderer Stelle.
  const markedRegion = resetDialog.locator('.field__live[data-e2e-marker="reset-reason-live"]');
  await expect(markedRegion).toHaveCount(1);
  await expect(markedRegion).toContainText('Begründung für das Protokoll fehlt.');

  // Gegenprobe: der Dialog steht noch, und die Handlung ist **nicht**
  // gelaufen — der Exportstatus und sein Zähler sind unverändert. Das ist
  // der eigentliche Kern von O-GZ: eine Meldung ohne diese Prüfung deckt nur
  // die Hälfte des Torwächters ab.
  await expect(resetDialog).toBeVisible();
  const afterBlockedClick = await listTimeEntriesByTodo(todo.id);
  expect(afterBlockedClick[0]?.exportStatus).toBe('exported');
  expect(afterBlockedClick[0]?.exportCount).toBe(1);

  // Mit Begründung und Kontrollkästchen: derselbe Knopf, diesmal ohne
  // `force`, weil er nicht mehr `aria-disabled` ist — die Handlung läuft.
  const reasonText = `E2E-Gate-Begruendung-${Date.now()}`;
  await resetDialog.getByLabel(/Begründung für das Protokoll/).fill(reasonText);
  await resetDialog
    .getByLabel(/Mir ist klar, dass diese Zeit dadurch ein zweites Mal abgerechnet werden kann/)
    .check();
  await expect(confirmButton).not.toHaveAttribute('aria-disabled');
  await confirmButton.click();
  await expect(resetDialog).toBeHidden();

  const afterReset = await listTimeEntriesByTodo(todo.id);
  expect(afterReset[0]?.exportStatus).toBe('open');
  // E-047/R-10: die Historie sinkt beim Zurücksetzen nicht.
  expect(afterReset[0]?.exportCount).toBe(1);

  // Kein Aufräumen hier: Eine Buchung mit Exportprotokoll (dieser Fall hat
  // sie exportiert und zurückgesetzt, `exportCount: 1` bleibt) lässt sich
  // über die API nicht mehr löschen — der Dienst antwortet mit `422
  // validation_error` ("Ein verwiesener Datensatz existiert … oder wird
  // noch benutzt", gemessen bei einem Löschversuch), weil das Protokoll auf
  // sie verweist. Das ist dieselbe Regel wie bei `TP-SEC-13`
  // (`export-audit-and-locks.spec.ts` Zeile 56), die ihre exportierte
  // Buchung aus demselben Grund ebenfalls unbereinigt im gemeinsamen Bestand
  // lässt, nicht ein Versehen dieses Falls.
});
