/**
 * TP-EXPORT-01 bis TP-EXPORT-03, TP-B64-10 (docs/testplan.md, Abschnitt 9)
 *
 * Export von Anfang bis Ende: mehrere offene Buchungen, Export ausführen,
 * JSON prüfen (Struktur der Standardvorlage, `Zeit` in Viertelstunden über die
 * Tagessumme je Todo — E-020, `Notiz` als Base64 über UTF-8, `WindowsUser`
 * gesetzt). Danach sind genau die exportierten Buchungen markiert; ein
 * zweiter Lauf gibt keine davon erneut aus.
 *
 * Die Standardvorlage hat laut `packages/storage/migrations/0005_*.up.sql`
 * genau vier Felder: `Call`, `Zeit`, `Notiz`, `WindowsUser`.
 */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import { createTodo, createTimeEntry, listTimeEntriesByTodo } from './support/api';
import { confirmExportRun, readResultFilePath } from './support/actions';
import { gotoExport } from './support/nav';
import { E2E_EXPORT_DIR, WINDOWS_USER } from './support/session';

/** Ein Zeitpunkt heute, in der Zeitzone des Testlaufs (Europe/Berlin). */
function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

test.describe('TP-EXPORT-01/02/03 — Export von Anfang bis Ende', () => {
  test('mehrere offene Buchungen, Export ausführen, JSON prüfen, zweiter Lauf ist leer', async ({ page }) => {
    const marker = `E2E-EXPORT-${Date.now()}`;

    // --- Vorbereitung: zwei Todos, drei bzw. eine Buchung -------------------
    //
    // Todo Alpha traegt drei offene Buchungen am selben Kalendertag (10 + 20 +
    // 5 Minuten = 35 Minuten). Nach E-020 wird zuerst summiert, dann gerundet:
    // 35 Minuten runden auf 3 Viertelstunden = 0,75 (nicht dreimal 0,25).
    const alpha = await createTodo({ title: `${marker} Alpha`, note: 'Vermerk Alpha — darf nie in den Export' });
    await createTimeEntry({
      todoId: alpha.id,
      startedAt: todayAt(6, 0),
      endedAt: todayAt(6, 10),
      note: 'Rückruf entgegengenommen',
    });
    await createTimeEntry({
      todoId: alpha.id,
      startedAt: todayAt(7, 0),
      endedAt: todayAt(7, 20),
      note: 'Analyse durchgeführt',
    });
    await createTimeEntry({
      todoId: alpha.id,
      startedAt: todayAt(8, 0),
      endedAt: todayAt(8, 5),
      note: 'Ticket geschlossen',
    });

    // Todo Beta traegt genau eine Buchung von 16 Minuten — der
    // Unterscheidungsfall aus TP-ROUND-07 (0,50 statt 0,25 bei kaufmaennischer
    // Rundung). Sie ist die einzige offene Buchung ihres Todos an ihrem Tag,
    // damit die Gruppierung aus E-020 den 16-Minuten-Wert nicht mit anderen
    // Buchungen verrechnet (T-016, Praezisierung zu TP-EXPORT-01).
    // Die Leistung traegt Umlaute und einen eingebetteten Zeilenumbruch fuer
    // die Base64-UTF-8-Probe (TP-B64-10).
    const beta = await createTodo({ title: `${marker} Beta`, note: 'Vermerk Beta — darf nie in den Export' });
    const betaNote = 'Übertragung mit Ärger geklärt, Grüße\nZweite Zeile: Straße, groß, Fuß';
    await createTimeEntry({
      todoId: beta.id,
      startedAt: todayAt(9, 0),
      endedAt: todayAt(9, 16),
      note: betaNote,
    });

    // --- Export-Ansicht: beide Gruppen erscheinen, mit dem korrekten Wert ---
    await gotoExport(page);

    const alphaGroup = page.locator('.egroup', { hasText: `${marker} Alpha` });
    const betaGroup = page.locator('.egroup', { hasText: `${marker} Beta` });
    await expect(alphaGroup).toBeVisible();
    await expect(betaGroup).toBeVisible();

    // E-020: Summe zuerst, dann runden — 0,75 und nicht dreimal 0,25.
    await expect(alphaGroup.locator('.egroup__quarters')).toHaveText(/0,75/);
    // TP-ROUND-07: 16 Minuten runden auf 0,50 ("immer aufrunden", nicht 0,25).
    await expect(betaGroup.locator('.egroup__quarters')).toHaveText(/0,50/);

    // Beide Gruppen sind standardmäßig ausgewählt (Checkbox nicht deaktiviert).
    await expect(alphaGroup.locator('input.egroup__check')).toBeChecked();
    await expect(betaGroup.locator('input.egroup__check')).toBeChecked();

    // Der Vermerk (Todo-Notiz) darf in der Vorschau nirgends auftauchen.
    await expect(page.locator('body')).not.toContainText('darf nie in den Export');

    // --- Export ausführen -----------------------------------------------
    // (Bestätigungsdialog inkl. des seit T-045 möglichen "Mir ist bewusst"-
    // Kontrollkästchens, siehe support/actions.ts.)
    await page.getByRole('button', { name: 'Export ausführen' }).click();
    await confirmExportRun(page);

    await expect(page.getByText('Export abgeschlossen')).toBeVisible();

    const filePathText = await readResultFilePath(page);
    expect(filePathText.length).toBeGreaterThan(0);
    expect(filePathText.startsWith(E2E_EXPORT_DIR)).toBe(true);

    // --- Die Datei selbst: Struktur, Rundung, Base64/UTF-8, WindowsUser -----
    const raw = await readFile(filePathText, 'utf8');
    const rows = JSON.parse(raw) as ReadonlyArray<Record<string, unknown>>;

    // Mindestens die zwei eigenen Zeilen — nicht "genau zwei": Der Dienst hat
    // eine einzige gemeinsame SQLite-Datei über den ganzen Lauf (T-012); mit
    // mehr Spezifikationsdateien als in T-012 können zum Zeitpunkt dieses
    // Exports auch offene Buchungen anderer Fälle mitgehen (bewusst offen
    // gelassene Buchungen, etwa bei den Fällen zum gesperrten Export). Geprüft
    // wird deshalb gezielt gegen die eigenen, markierten Zeilen, nicht gegen
    // die Gesamtzahl.
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) {
      // Standardvorlage: genau diese vier Schlüssel (migrations/0005).
      expect(Object.keys(row).sort()).toEqual(['Call', 'Notiz', 'WindowsUser', 'Zeit']);
      expect(row['WindowsUser']).toBe(WINDOWS_USER);
    }

    const alphaRow = rows.find((row) => {
      const decoded = Buffer.from(String(row['Notiz']), 'base64').toString('utf8');
      return decoded.includes('Rückruf entgegengenommen');
    });
    expect(alphaRow).toBeDefined();
    expect(alphaRow?.['Zeit']).toBe(0.75);
    const alphaNote = Buffer.from(String(alphaRow?.['Notiz']), 'base64').toString('utf8');
    // E-026: die drei Leistungstexte sind mit "; " zusammengeführt, nach Startzeit sortiert.
    expect(alphaNote).toBe('Rückruf entgegengenommen; Analyse durchgeführt; Ticket geschlossen');

    const betaRow = rows.find((row) => {
      const decoded = Buffer.from(String(row['Notiz']), 'base64').toString('utf8');
      return decoded === betaNote;
    });
    expect(betaRow).toBeDefined();
    expect(betaRow?.['Zeit']).toBe(0.5);
    const betaDecoded = Buffer.from(String(betaRow?.['Notiz']), 'base64').toString('utf8');
    // TP-B64-10: Base64 → UTF-8 verlustfrei, Umlaute und Zeilenumbruch erhalten.
    expect(betaDecoded).toBe(betaNote);

    // --- Genau die exportierten Buchungen sind markiert, mit exportCount 1 ---
    const alphaEntriesAfter = await listTimeEntriesByTodo(alpha.id);
    expect(alphaEntriesAfter).toHaveLength(3);
    for (const entry of alphaEntriesAfter) {
      expect(entry.exportStatus).toBe('exported');
      expect(entry.exportCount).toBe(1);
    }
    const betaEntriesAfter = await listTimeEntriesByTodo(beta.id);
    expect(betaEntriesAfter).toHaveLength(1);
    expect(betaEntriesAfter[0]?.exportStatus).toBe('exported');
    expect(betaEntriesAfter[0]?.exportCount).toBe(1);

    // --- TP-EXPST-02/03: zweiter Lauf ohne neue Buchungen ------------------
    await page.reload();
    // Die eben exportierten Gruppen dürfen nicht mehr in der Auswahl stehen.
    await expect(page.locator('.egroup', { hasText: `${marker} Alpha` })).toHaveCount(0);
    await expect(page.locator('.egroup', { hasText: `${marker} Beta` })).toHaveCount(0);
  });
});
