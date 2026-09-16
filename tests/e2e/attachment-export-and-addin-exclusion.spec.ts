import { todayAt } from './support/local-time';
/**
 * Exportdateien vollständig auf ausgeschlossene Daten prüfen. Die Add-in-Aufrufe prüfen konkrete
 * Einschleusversuche, nicht sämtliche Routen.
 */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import {
  addinBookOnTodo,
  addinCreateTodo,
  addinTodoMatches,
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
    // `.export-todo` ist der Todo-Block (trägt den Titel, S-07 nach dem
    // Tabellenumbau) — `.egroup` liegt seither eine Ebene tiefer, je Tag, und
    // führt den Todo-Titel nicht mehr im eigenen Text (T-249-8).
    const group = page.locator('.export-todo', { hasText: 'ANH-EXPORT' }).filter({ hasText: run });
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
    const wideGroup = page.locator('.export-todo', { hasText: 'ANH-EXPORT' }).filter({ hasText: run });
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

test.describe('TP-ANH-13 — an einem vorhandenen Todo entsteht über das Add-in kein Anhang (Spotcheck, A-19.19 neu, A-A-82, A-10.9/E-100)', () => {
  test('Anlegetür: eine mitgeschickte Kennung eines vorhandenen Todos lenkt den Anhang nicht um — er hängt am neu angelegten Todo', async () => {
    // Ein Todo, das es vorher schon gibt — die Tür, die A-19.19 (neu) zuhält.
    const existing = await createTodo({ title: `E2E-ADDIN-VORHANDEN-${Date.now()}` });
    expect(await listAttachmentsByTodo(existing.id)).toHaveLength(0);

    const marker = `ANH-SCHMUGGEL-${Date.now()}`;
    const created = await addinCreateTodo({
      title: `E2E-ADDIN-NEU-${Date.now()}`,
      // Der Schmuggelversuch: `POST /addin/todos` führt kein Feld, das ein
      // Todo benennt (A-A-82) — `AddinDeps.emailAttachments` hat keinen
      // Parameter vom Typ `TodoId`. Ein unbekannter Schlüssel fällt in zod
      // still weg (`createTodoSchema` ist kein `.strict()`); dieser Fall prüft
      // genau das an der Wirkung, nicht an der Zusage im Kommentar.
      todoId: existing.id,
      attachments: {
        sender: 'kunde@beispiel.example',
        items: [{ kind: 'link', displayName: marker, url: `https://beispiel.example/${marker}` }],
      },
    });

    // Die Gegenprobe, ohne die die Nullmessung unten nichts wert wäre: Der
    // Anhang ist wirklich entstanden — nur eben am **neuen** Todo.
    expect(created.todo.id).not.toBe(existing.id);
    expect(created.attachments?.stored).toBe(1);
    const onNewTodo = await listAttachmentsByTodo(created.todo.id);
    expect(onNewTodo).toHaveLength(1);
    expect(onNewTodo[0]?.kind).toBe('link');

    // Die eigentliche Zusage: das vorhandene Todo bleibt bei null, gleich, was
    // im Rumpf stand.
    expect(await listAttachmentsByTodo(existing.id)).toHaveLength(0);

    await deleteTodo(existing.id);
    // `created.todo` bleibt bewusst stehen: Es trägt jetzt einen Anhang, und
    // ein Todo mit Anhang lässt sich über die reguläre Tür so wenig unbemerkt
    // wegräumen wie eines mit Zeitbuchung — derselbe Vorbehalt wie am Ende von
    // TP-ANH-12 oben. Der Titel trägt den Zeitstempel und ist als E2E-Rest
    // erkennbar.
  });

  test('Duplikat-Hinweis und Buchungstür: kein Weg, am gefundenen Todo einen Anhang zu erzeugen (A-10.9, E-100)', async () => {
    const callNumber = `CALL-ADDIN-${Date.now()}`;
    const found = await createTodo({ title: `E2E-ADDIN-DUPLIKAT-${Date.now()}`, callNumber });
    expect(await listAttachmentsByTodo(found.id)).toHaveLength(0);

    // Die Ankündigung vor jeder Buchung (A-10.9) findet das Todo — und trägt
    // strukturell keine Anhangsauskunft: `AddinTodoMatch` hat dafür kein Feld,
    // hier zusätzlich an der rohen Antwort gemessen und nicht nur am Typ.
    const matches = await addinTodoMatches(callNumber);
    expect(matches.searched).toBe(true);
    if (matches.searched) {
      const match = matches.matches.find((entry) => entry.id === found.id);
      expect(match).toBeDefined();
      expect(Object.keys(match as object)).not.toContain('attachments');
    }

    // Die einzige Route unter `/addin`, die heute eine Todo-Kennung im Pfad
    // entgegennimmt, ist `POST /addin/todos/:todoId/time-entries`. Die
    // Oberfläche des Aufgabenbereichs ruft sie seit F-21/E-100 nicht mehr auf
    // (`DuplicateOffer.tsx`: „keine Zeitbuchung, kein Anhang" — und
    // `apps/outlook-addin/src/api/client.ts` hat keinen Aufrufer von `.book(
    // …)` mehr) — die Route selbst steht trotzdem, und A-10.9 spricht über die
    // **Handlung**, nicht über die Existenz einer Route. Dieser Testfall prüft
    // deshalb die Route direkt: Auch mit einem mitgeschickten `attachments`-
    // Feld entsteht darüber kein Anhang am gefundenen Todo.
    await addinBookOnTodo(found.id, {
      startedAt: todayAt(5, 0),
      endedAt: todayAt(5, 15),
      note: 'E2E-Aufräumung',
      attachments: {
        sender: null,
        items: [{ kind: 'link', displayName: 'sollte-nicht-ankommen', url: 'https://beispiel.example/schmuggel' }],
      },
    });

    expect(await listAttachmentsByTodo(found.id)).toHaveLength(0);

    // Kein Aufräumen: `found` trägt jetzt eine Zeitbuchung und lässt sich
    // deshalb nicht löschen (`time_entry_locked`) — dieselbe Lage wie in
    // `note-separation.spec.ts` und im ersten Test dieser Datei oben.
  });
});
