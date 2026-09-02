/**
 * TP-NOTE-01, TP-NOTE-02, TP-NOTE-03 (docs/testplan.md, Abschnitt 3)
 *
 * Der wichtigste Sicherheitstest des Projekts: Der Vermerk (Todo-Notiz, A-7.2)
 * darf im Export **nirgends** erscheinen — weder im Klartext noch
 * base64-kodiert —, egal welche Vorlage aktiv ist. Die Leistung (Buchungsnotiz,
 * A-7.4) muss dagegen auffindbar sein, je nach Vorlage im Klartext oder
 * base64-kodiert. Geprüft wird gegen die Standardvorlage UND gegen mindestens
 * eine frei konfigurierte, abweichende Vorlage (R-06) — nie nur die
 * Standardvorlage, damit ein Bruch nicht deshalb unentdeckt bliebe, weil nur
 * eine Vorlage geprüft wurde.
 */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import { createTemplate, createTimeEntry, createTodo, listTimeEntriesByTodo } from './support/api';
import { runExportFromScreen, readResultFilePath } from './support/actions';
import { gotoExport, gotoTemplates } from './support/nav';
import { E2E_EXPORT_DIR } from './support/session';

function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Base64-Kodierung wie der Dienst sie erzeugt (A-8.4) — UTF-8 vor Base64. */
function b64(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}

interface NoteFixture {
  readonly todoId: string;
  readonly todoMarker: string;
  readonly mergedNotes: string;
  readonly bookingMarkerA: string;
  readonly bookingMarkerB: string;
}

/** Legt ein Todo mit Vermerk-Marker und zwei Buchungen mit Leistungs-Markern an. */
async function seedNoteFixture(label: string, run: string): Promise<NoteFixture> {
  const todoMarker = `GEHEIM-TODO-MARKER-${run}-${label}`;
  const bookingMarkerA = `OFFEN-BUCHUNG-MARKER-${run}-${label}-A`;
  const bookingMarkerB = `OFFEN-BUCHUNG-MARKER-${run}-${label}-B`;

  const todo = await createTodo({
    title: `NOTE-SEP ${run} ${label}`,
    note: `Interner Vermerk, darf nie exportiert werden: ${todoMarker}`,
  });
  const noteA = `Rückruf erledigt (${bookingMarkerA})`;
  const noteB = `Nachfolgearbeit abgeschlossen (${bookingMarkerB})`;
  await createTimeEntry({ todoId: todo.id, startedAt: todayAt(4, 0), endedAt: todayAt(4, 12), note: noteA });
  await createTimeEntry({ todoId: todo.id, startedAt: todayAt(5, 0), endedAt: todayAt(5, 12), note: noteB });

  // Zusammenführung nach E-026: "; "-verbunden, nach Startzeit sortiert. Beide
  // Texte enden ohne Punkt/Semikolon, die Randnormalisierung aus E-028 ändert
  // hier also nichts.
  const mergedNotes = `${noteA}; ${noteB}`;

  return { todoId: todo.id, todoMarker, mergedNotes, bookingMarkerA, bookingMarkerB };
}

test.describe('TP-NOTE-01 — Vermerk ist strukturell nicht als Feldquelle wählbar', () => {
  test('die Quellenauswahl im Vorlageneditor listet niemals "Vermerk"', async ({ page }) => {
    await gotoTemplates(page, 'neu');
    await page.getByRole('button', { name: 'Erstes Feld hinzufügen' }).click();

    // Seit der Ark-UI-Umstellung (T-059) ist der Auslöser ein
    // `<button role="combobox">`, kein `<select>` mehr — `getByLabel('Quelle')`
    // träfe außerdem zusätzlich die zugehörige (anfangs verborgene) Listbox,
    // die dieselbe Beschriftung über `aria-labelledby` trägt (Strict-Mode-
    // Verstoß, siehe T-060-Bericht). `getByRole('combobox', …)` ist eindeutig,
    // weil die Rolle die beiden Elemente unterscheidet.
    const sourceCombobox = page.getByRole('combobox', { name: 'Quelle' });
    await expect(sourceCombobox).toBeVisible();
    await sourceCombobox.click();

    // Nur der Beschriftungstext je Eintrag (`.select__option-label`), nicht
    // der komplette `innerText` des Eintrags — Optionen tragen seit T-059
    // zusätzlich eine zweite Zeile mit der Quellenbeschreibung
    // (`option.hint`), und die darf "Notiz" durchaus enthalten (z. B. bei der
    // erlaubten Quelle "Leistung"), ohne dass das hier fälschlich anschlägt.
    const optionLabels = await page
      .getByRole('option')
      .locator('.select__option-label')
      .allInnerTexts();
    await page.keyboard.press('Escape');

    expect(optionLabels.length).toBeGreaterThan(0);
    for (const label of optionLabels) {
      expect(label.toLowerCase()).not.toContain('vermerk');
      expect(label.toLowerCase()).not.toContain('notiz');
    }
  });
});

test.describe('TP-NOTE-02/03 — Volltextprüfung, Klartext und base64, über mehrere Vorlagen', () => {
  test('Standardvorlage (base64): Vermerk erscheint nirgends, Leistung ist auffindbar', async ({ page }) => {
    const run = `${Date.now()}`;
    const fixture = await seedNoteFixture('STD', run);

    // --- Vorschau in S-14 mit der Standardvorlage --------------------------
    await gotoTemplates(page);
    await expect(page.getByRole('heading', { name: 'Standardvorlage' })).toBeVisible();
    const groupHeader = page.locator('.tpgroup__head', { hasText: `NOTE-SEP ${run} STD` });
    await expect(groupHeader).toBeVisible();
    await groupHeader.click();
    const previewText = await page.locator('.tpreview').innerText();
    expect(previewText).not.toContain(fixture.todoMarker);
    expect(previewText).not.toContain(b64(fixture.todoMarker));
    // Die Leistung steht unten bei den Buchungen im Klartext (E-028) — die
    // Vorschau zeigt die Segmente immer unkodiert, egal welche Transformation
    // die Vorlage für das zusammengeführte Feld wählt.
    expect(previewText).toContain(fixture.bookingMarkerA);
    expect(previewText).toContain(fixture.bookingMarkerB);

    // --- Tatsächlicher Export mit der Standardvorlage -----------------------
    await gotoExport(page);
    const group = page.locator('.egroup', { hasText: 'NOTE-SEP' }).filter({ hasText: run }).filter({ hasText: 'STD' });
    await expect(group).toBeVisible();
    await runExportFromScreen(page);

    const filePath = await readResultFilePath(page);
    expect(filePath.startsWith(E2E_EXPORT_DIR)).toBe(true);
    const fileText = await readFile(filePath, 'utf8');

    // Der Vermerk erscheint an keiner Stelle der Datei — weder im Klartext
    // noch base64-kodiert (Bedrohungsmodell, Prüfung 8; R-18).
    expect(fileText).not.toContain(fixture.todoMarker);
    expect(fileText).not.toContain(b64(fixture.todoMarker));

    // Die Leistung ist auffindbar: die Standardvorlage kodiert `Notiz` als
    // Base64 über den gesamten zusammengeführten Text (E-026), also erscheint
    // dessen Base64-Form als Teilzeichenkette der Datei.
    expect(fileText).toContain(b64(fixture.mergedNotes));

    const entries = await listTimeEntriesByTodo(fixture.todoId);
    expect(entries.every((entry) => entry.exportStatus === 'exported')).toBe(true);
  });

  test('abweichende Vorlage (roh): Vermerk erscheint nirgends, Leistung steht im Klartext', async ({ page }) => {
    const run = `${Date.now()}`;
    const fixture = await seedNoteFixture('RAW', run);

    const rawTemplate = await createTemplate(`E2E roh ${run}`, {
      version: 1,
      fields: [
        { name: 'Leistung', source: 'group.bookingNotes', transformation: 'raw' },
        { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
      ],
    });

    await gotoExport(page);
    // Ark UI (T-059): der Auslöser ist ein `<button role="combobox">`, die
    // Einträge sind `role="option"`, kein `<select>` mehr — `selectOption()`
    // greift nicht mehr.
    await page.getByRole('combobox', { name: 'Exportvorlage' }).click();
    await page.getByRole('option', { name: rawTemplate.name, exact: true }).click();

    const group = page.locator('.egroup', { hasText: 'NOTE-SEP' }).filter({ hasText: run }).filter({ hasText: 'RAW' });
    await expect(group).toBeVisible();
    await runExportFromScreen(page);

    const filePath = await readResultFilePath(page);
    const fileText = await readFile(filePath, 'utf8');

    expect(fileText).not.toContain(fixture.todoMarker);
    expect(fileText).not.toContain(b64(fixture.todoMarker));
    // `roh` — die Leistung steht diesmal wörtlich in der Datei.
    expect(fileText).toContain(fixture.mergedNotes);
  });

  test('Vorlage mit möglichst vielen Quellenpfaden: Vermerk erscheint nirgends', async ({ page }) => {
    const run = `${Date.now()}`;
    const fixture = await seedNoteFixture('WIDE', run);

    const wideTemplate = await createTemplate(`E2E breit ${run}`, {
      version: 1,
      fields: [
        { name: 'Titel', source: 'todo.title', transformation: 'raw' },
        { name: 'Tags', source: 'todo.tags', transformation: 'raw' },
        { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
        { name: 'Tag', source: 'group.day', transformation: 'raw' },
        { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
        { name: 'Sekunden', source: 'group.durationSeconds', transformation: 'raw' },
        { name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' },
        { name: 'Beginn', source: 'group.startedAt', transformation: 'raw' },
        { name: 'Ende', source: 'group.endedAt', transformation: 'raw' },
        { name: 'AnzahlBuchungen', source: 'group.entryCount', transformation: 'raw' },
        { name: 'WindowsUser', source: 'system.windowsUser', transformation: 'raw' },
        { name: 'Exportiert', source: 'system.exportedAt', transformation: 'raw' },
      ],
    });

    await gotoExport(page);
    await page.getByRole('combobox', { name: 'Exportvorlage' }).click();
    await page.getByRole('option', { name: wideTemplate.name, exact: true }).click();

    const group = page.locator('.egroup', { hasText: 'NOTE-SEP' }).filter({ hasText: run }).filter({ hasText: 'WIDE' });
    await expect(group).toBeVisible();
    await runExportFromScreen(page);

    const filePath = await readResultFilePath(page);
    const fileText = await readFile(filePath, 'utf8');

    expect(fileText).not.toContain(fixture.todoMarker);
    expect(fileText).not.toContain(b64(fixture.todoMarker));
    expect(fileText).toContain(b64(fixture.mergedNotes));
  });
});
