/**
 * TP-ANH-12, TP-ANH-13 (docs/testplan.md, Abschnitt 25.2) — T-150.
 *
 * Weder die Frist noch ein Anhang gelangen in einen Export, gleich welche
 * Vorlage aktiv ist (A-19.17) — geprüft nach demselben Muster wie
 * `note-separation.spec.ts` für den Vermerk: eine auffällige, erfundene Frist
 * und ein auffälliger, erfundener Anhang, mehrere Vorlagen, die Ergebnisdatei
 * vollständig als Text durchsucht statt nur die erwarteten Felder gelesen.
 * Dazu die strukturelle Bedingung: Die Feldquellen des Vorlageneditors
 * kennen weder die Frist noch einen Anhang (`EXPORT_SOURCE_PATHS`,
 * `packages/export/src/sources.ts`, zwölf Werte, keiner davon neu) — dieselbe
 * Prüfbauart wie `TP-NOTE-01`.
 *
 * TP-ANH-13 (A-19.19, E-072 Punkt 1) ist hier nur als **Spotcheck** von der
 * Oberfläche aus vertreten: Die eigentliche Integrationsprüfung
 * (`apps/local-api/test/routes/addin/**`) und der strukturelle Nachweis
 * (`proof:addin`) gehören unit-tester/integration-dev (T-148/T-149, laufen in
 * dieser Welle parallel) — dieser Fall misst dieselbe Wirkung zusätzlich über
 * die echte HTTP-Tür, ohne die Add-in-Route selbst zu berühren.
 */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import {
  addinCreateTodo,
  createAttachment,
  createTemplate,
  createTimeEntry,
  createTodo,
  deleteTodo,
  listAttachmentsByTodo,
} from './support/api';
import { runExportFromScreen, readResultFilePath } from './support/actions';
import { gotoExport, gotoTemplates } from './support/nav';
import { E2E_EXPORT_DIR } from './support/session';

function todayAt(hour: number, minute: number): string {
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Weit in der Zukunft, damit das Datum im Exporttext unverwechselbar ist. */
function farFutureIsoDay(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 12);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

test.describe('TP-ANH-12 — weder Frist noch Anhang erscheinen in einem Export', () => {
  test('Standardvorlage und eine Vorlage mit allen zwölf Feldquellen: kein Treffer', async ({ page }) => {
    const run = `${Date.now()}`;
    const dueDate = farFutureIsoDay();
    const attachmentMarker = `ANH-EXPORT-MARKER-${run}`;
    const attachmentAddress = `https://beispiel.example/${attachmentMarker}`;
    const attachmentTitle = `Titel ${attachmentMarker}`;

    const todo = await createTodo({ title: `ANH-EXPORT ${run}`, dueDate });
    await createAttachment(todo.id, { kind: 'link', url: attachmentAddress, title: attachmentTitle });
    await createTimeEntry({
      todoId: todo.id,
      startedAt: todayAt(6, 0),
      endedAt: todayAt(6, 15),
      note: `Leistung ${run}`,
    });

    // --- Standardvorlage ------------------------------------------------------
    await gotoExport(page);
    const group = page.locator('.egroup', { hasText: 'ANH-EXPORT' }).filter({ hasText: run });
    await expect(group).toBeVisible();
    await runExportFromScreen(page);
    const filePath = await readResultFilePath(page);
    expect(filePath.startsWith(E2E_EXPORT_DIR)).toBe(true);
    const standardText = await readFile(filePath, 'utf8');
    expect(standardText).not.toContain(dueDate);
    expect(standardText).not.toContain(attachmentAddress);
    expect(standardText).not.toContain(attachmentTitle);
    expect(standardText).not.toContain(attachmentMarker);

    // --- Vorlage mit allen zwölf Feldquellen (dieselbe Liste wie in ---------
    // note-separation.spec.ts, "möglichst viele Quellenpfade") --------------
    const wideTemplate = await createTemplate(`E2E-ANH-breit-${run}`, {
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

    // Eine zweite, offene Buchung auf demselben Todo, damit ein zweiter
    // Exportlauf wieder etwas zu exportieren hat.
    await createTimeEntry({
      todoId: todo.id,
      startedAt: todayAt(7, 0),
      endedAt: todayAt(7, 15),
      note: `Leistung zwei ${run}`,
    });

    await gotoExport(page);
    await page.getByRole('combobox', { name: 'Exportvorlage' }).click();
    await page.getByRole('option', { name: wideTemplate.name, exact: true }).click();
    const wideGroup = page.locator('.egroup', { hasText: 'ANH-EXPORT' }).filter({ hasText: run });
    await expect(wideGroup).toBeVisible();
    await runExportFromScreen(page);
    const widePath = await readResultFilePath(page);
    const wideText = await readFile(widePath, 'utf8');
    expect(wideText).not.toContain(dueDate);
    expect(wideText).not.toContain(attachmentAddress);
    expect(wideText).not.toContain(attachmentTitle);
    expect(wideText).not.toContain(attachmentMarker);

    // Kein Aufräumen des Todos: Ein Todo mit bestehenden Zeitbuchungen lässt
    // sich nicht löschen (`time_entry_locked`) — dieselbe Lage wie in
    // `note-separation.spec.ts`, das aus demselben Grund keinen `deleteTodo`-
    // Aufruf am Ende führt.
  });

  test('strukturell: die Feldquellen des Vorlageneditors kennen weder Frist noch Anhang', async ({ page }) => {
    await gotoTemplates(page, 'neu');
    await page.getByRole('button', { name: 'Erstes Feld hinzufügen' }).click();

    const sourceCombobox = page.getByRole('combobox', { name: 'Quelle' });
    await expect(sourceCombobox).toBeVisible();
    await sourceCombobox.click();

    const optionLabels = await page.getByRole('option').locator('.select__option-label').allInnerTexts();
    await page.keyboard.press('Escape');

    expect(optionLabels.length).toBe(12);
    for (const label of optionLabels) {
      const normalized = label.toLowerCase();
      expect(normalized).not.toContain('frist');
      expect(normalized).not.toContain('fällig');
      expect(normalized).not.toContain('anhang');
      expect(normalized).not.toContain('verweis');
      expect(normalized).not.toContain('deadline');
    }
  });
});

test.describe('TP-ANH-13 — über das Add-in entstehen keine Anhänge (Spotcheck, A-19.19)', () => {
  test('ein zusätzliches Anhangsfeld im Rumpf von POST /addin/todos hat keine Wirkung', async () => {
    const title = `E2E-ADDIN-KEIN-ANHANG-${Date.now()}`;
    const created = await addinCreateTodo({
      title,
      // Ein Feld, das einen Anhang beschreiben würde — die Route hat dafür
      // keinen Zweig (A-A-21), egal ob zod es abweist oder still verwirft.
      attachments: [{ kind: 'link', url: 'https://beispiel.example/sollte-nicht-ankommen' }],
      attachmentUrl: 'https://beispiel.example/sollte-auch-nicht-ankommen',
    });

    const attachments = await listAttachmentsByTodo(created.todo.id);
    expect(attachments).toHaveLength(0);

    await deleteTodo(created.todo.id);
  });
});
