/**
 * Kanban — Spalten sind Regeln über Tags, keine Ablageorte (A-5.1, A-5.3 bis
 * A-5.6, E-054, E-055, T-081, `docs/testplan.md` Abschnitt 8).
 *
 * ## Warum diese Datei komplett neu geschrieben ist, nicht nur repariert
 *
 * Bis T-080 prüfte diese Datei drei Fälle, die es nicht mehr gibt:
 * Drag & Drop zwischen Statusspalten (TP-KANBAN-01), einen Dialog
 * „Statusspalten“ mit einem Feld „Neue Spalte“ und Knöpfen „nach
 * rechts“/„nach links“ (TP-KANBAN-02), und einen Timer-Testfall
 * (TP-KANBAN-04), der zwar noch eine gültige Bedienung ansprach, aber ohne
 * jede reale Spalte lief — seit E-054 ist das Board nach der Umstellung leer,
 * bis jemand eine Regel einrichtet, und `createTodo({ title })` ohne Tags
 * landet in keiner.
 *
 * Seit **E-054** ist eine Kanban-Spalte eine **Regel über Tags**, dieselbe
 * Entität wie ein Pool (`Pool.placement`). Ziehen zwischen Spalten hat der
 * Auftraggeber ausdrücklich ausgeschlossen: Eine Regel lässt sich nicht durch
 * Verschieben umkehren, ohne dass die Anwendung selbst Tags setzt
 * (`decisions.md`, E-054). Seit **E-055** ist die Regel eine Struktur mit
 * fünf benannten Achsen (erforderliche Tags, ausgeschlossene Tags, Status,
 * Erledigt, Exportstatus) statt einer Liste gleichartiger Terme.
 *
 * Ein Test, der weiter Drag & Drop simuliert, bliebe grün, ohne noch etwas zu
 * messen — der schlechtere Zustand, weil er wie ein bestandener Test aussieht
 * (Auftrag T-081). Was jetzt hier steht, prüft stattdessen, dass Oberfläche
 * und Speicherung *dieselbe* Antwort geben: Eine Karte erscheint, weil eine
 * Regel sie trifft, und verschwindet, wenn sie es nicht mehr tut — beides über
 * die Oberfläche ausgelöst, nicht über die API. Der unit-tester hat die
 * Mehrfachnennung einer Karte über mehrere Spalten in T-077 bereits auf der
 * SQL-Seite gemessen (vier Karten × sechs Spalten); durch die Oberfläche war
 * sie bislang ungemessen.
 *
 * ## Zwei Fallen aus dem Auftrag, und wie diese Datei sie umgeht
 *
 * 1. **Spalten entstehen ausschließlich über die Oberfläche**
 *    (`support/actions.ts`, `createBoardColumn`) — nie über `POST /pools`.
 *    Ein Testaufbau an der Datenbank vorbei würde nicht messen, was der
 *    Benutzer erlebt, und hätte einen Fehler im Regelformular selbst nicht
 *    gefunden. Tags und Todos entstehen weiterhin über die API
 *    (`support/api.ts`) — das ist reine Vorbereitung, kein Teil der
 *    geprüften Bedienung, genau wie in jeder anderen Datei unter
 *    `tests/e2e/**`.
 * 2. **Jede Spalte trägt mindestens zwei Karten, wo es um Zugehörigkeit
 *    geht** — eine einzelne Karte je Spalte ließe Zugehörigkeit nicht von
 *    Reihenfolge unterscheiden. TP-KANBAN-01 vergleicht deshalb "die Karte
 *    matcht" gegen "die Karte matcht nicht mehr", nicht nur "eine Karte ist
 *    da".
 *
 * Playwrights `hasText` vergleicht Text case-insensitiv als Teilzeichenkette
 * — wichtig für die Achse "Erledigt": "Unerledigt" enthält "erledigt" als
 * Teilzeichenkette, weshalb die Auswahl der Optionsknöpfe in
 * `createBoardColumn` mit einem am Anfang verankerten Muster arbeitet statt
 * mit einem bloßen Namensvergleich (siehe dortiger Kommentar).
 */
import { test, expect } from '@playwright/test';

import {
  cleanupAnyTimer,
  createTag,
  createTodo,
  deletePoolByName,
  deleteTag,
  deleteTodo,
  markTodoDone,
  type Todo,
} from './support/api';
import { createBoardColumn } from './support/actions';
import { gotoBoard, gotoTodos } from './support/nav';

test.afterEach(async () => {
  // Falls ein Fall in Testfall 4 (Timer auf der Karte) fehlschlägt, bevor er
  // selbst aufräumt — derselbe Grund wie in `todo-revival.spec.ts` (T-048):
  // ein laufender Timer aus einem vorherigen Fall blockiert jeden folgenden
  // mit der Rückfrage nach einem verwaisten Timer.
  await cleanupAnyTimer();
});

/**
 * Findet **eine** Spalte über ihren Titel — nicht über `.kcolumn` mit
 * `hasText`, wie ein erster Entwurf dieser Datei es tat.
 *
 * Der Grund, gemessen an TP-KANBAN-02: Steht eine Karte in mehreren Spalten,
 * nennt jedes Vorkommen die jeweils **andere** Spalte beim vollen,
 * zeitgestempelten Namen ("Steht auch in „E2E-Kanban-Mehrfach-B-…“", siehe
 * `Kanban.tsx`). Ein `hasText`-Filter auf den ganzen Spaltenrumpf träfe dann
 * **zwei** Spalten statt einer — die eigene und jede, die auf sie verweist.
 * `.kcolumn__title` trägt nur die Überschrift und nie einen Querverweis auf
 * eine andere Spalte.
 */
function boardColumn(page: import('@playwright/test').Page, name: string) {
  return page.locator('.kcolumn').filter({ has: page.locator('.kcolumn__title', { hasText: name }) });
}

/** Öffnet den Bearbeiten-Dialog eines Todos über die Menü-Aktion der Todo-Liste (S-02). */
async function openEditDialog(page: import('@playwright/test').Page, todo: Todo) {
  await gotoTodos(page);
  const row = page.locator('.todo-row', { hasText: todo.title });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: `Menü für „${todo.title}“` }).click();
  await page.getByRole('menuitem', { name: 'Bearbeiten' }).click();
  const dialog = page.getByRole('dialog', { name: 'Todo bearbeiten' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('TP-KANBAN-01 — Zugehörigkeit folgt der Regel, nicht der Ablage', () => {
  test('Karte erscheint, weil die Regel sie trifft, und verschwindet über die Oberfläche wieder', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Kanban-Sichtbarkeit-${run}`;
    const tag = await createTag(`E2E-Kanban-Sichtbar-${run}`);
    // Zwei Karten, keine davon trägt das Tag zu Beginn (Falle 2 aus dem
    // Auftrag: Zugehörigkeit muss sich von Reihenfolge unterscheiden lassen —
    // die zweite Karte bleibt während des gesamten Falls außerhalb der Regel
    // und dient als Gegenprobe, dass die Spalte nicht einfach "irgendwas"
    // zeigt).
    const matching = await createTodo({ title: `E2E-KANBAN-MATCH-${run}` });
    const other = await createTodo({ title: `E2E-KANBAN-OTHER-${run}` });

    try {
      await gotoBoard(page);
      await createBoardColumn(page, columnName, { requiredTagNames: [tag.name] });

      const column = boardColumn(page, columnName);
      await expect(column).toBeVisible();

      // Noch trägt keines der beiden Todos das Tag: Die Spalte hat eine
      // gestellte Bedingung, die gerade nichts trifft — das ist ein anderer
      // Leerzustand als "keine Bedingung" (TP-KANBAN-03).
      await expect(column.getByText('Keine Karte trifft diese Regel')).toBeVisible();
      await expect(column.locator('.kcard')).toHaveCount(0);

      // --- Erscheinen: Tag über die Todo-Liste ergänzen, nicht über die API -
      const editDialog = await openEditDialog(page, matching);
      const tagsBox = editDialog.getByRole('combobox', { name: 'Tags' });
      await tagsBox.click();
      await tagsBox.fill(tag.name);
      await page.getByRole('option', { name: tag.name }).click();
      await page.keyboard.press('Escape');
      await editDialog.getByRole('button', { name: 'Speichern' }).click();
      await expect(editDialog).toBeHidden();

      await gotoBoard(page);
      const columnAfterAdd = boardColumn(page, columnName);
      await expect(columnAfterAdd.locator('.kcard', { hasText: matching.title })).toBeVisible();
      await expect(columnAfterAdd.getByText('Keine Karte trifft diese Regel')).toHaveCount(0);
      // Die zweite Karte trägt das Tag weiterhin nicht — sie erscheint nicht,
      // nur weil irgendeine Karte jetzt da ist.
      await expect(columnAfterAdd.locator('.kcard', { hasText: other.title })).toHaveCount(0);

      // --- Verschwinden: Tag über dieselbe Bedienung wieder entfernen ------
      const editDialog2 = await openEditDialog(page, matching);
      await editDialog2.getByRole('button', { name: `Tag ${tag.name} entfernen` }).click();
      await editDialog2.getByRole('button', { name: 'Speichern' }).click();
      await expect(editDialog2).toBeHidden();

      await gotoBoard(page);
      const columnAfterRemove = boardColumn(page, columnName);
      await expect(columnAfterRemove.locator('.kcard', { hasText: matching.title })).toHaveCount(0);
      await expect(columnAfterRemove.getByText('Keine Karte trifft diese Regel')).toBeVisible();
    } finally {
      // Reihenfolge wichtig: Die Spalte hängt am Tag (Löschschutz
      // `tag_in_use`), das Todo trägt es unter Umständen noch — erst die
      // Regel weg, dann Todo und Tag.
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(matching.id).catch(() => undefined);
      await deleteTodo(other.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});

test.describe('TP-KANBAN-02 — Eine Karte in mehreren Spalten zugleich', () => {
  test('Zwei zutreffende Regeln zeigen dieselbe Karte zweimal, mit Querverweis und gemeinsamer Hervorhebung', async ({
    page,
  }) => {
    const run = Date.now();
    const columnAName = `E2E-Kanban-Mehrfach-A-${run}`;
    const columnBName = `E2E-Kanban-Mehrfach-B-${run}`;
    const tagA = await createTag(`E2E-Kanban-MehrfachA-${run}`);
    const tagB = await createTag(`E2E-Kanban-MehrfachB-${run}`);
    // Vor E-054 unmöglich: Ein Todo trug genau einen Status. Seit eine Spalte
    // eine Regel ist, ist eine Karte, die zwei Regeln erfüllt, der Normalfall
    // (`decisions.md`, E-054) — hier mit beiden Tags an derselben Karte.
    const todo = await createTodo({
      title: `E2E-KANBAN-MULTI-${run}`,
      tagIds: [tagA.id, tagB.id],
    });

    try {
      await gotoBoard(page);
      await createBoardColumn(page, columnAName, { requiredTagNames: [tagA.name] });
      await createBoardColumn(page, columnBName, { requiredTagNames: [tagB.name] });

      const columnA = boardColumn(page, columnAName);
      const columnB = boardColumn(page, columnBName);
      const cardInA = columnA.locator('.kcard', { hasText: todo.title });
      const cardInB = columnB.locator('.kcard', { hasText: todo.title });
      await expect(cardInA).toBeVisible();
      await expect(cardInB).toBeVisible();

      // Jedes Vorkommen nennt das jeweils andere beim Namen (Kanban.tsx,
      // "Steht auch in …") — nicht nur "in mehreren Spalten" ohne zu sagen,
      // in welchen.
      await expect(cardInA.getByRole('button', { name: /Steht auch in/ })).toContainText(columnBName);
      await expect(cardInB.getByRole('button', { name: /Steht auch in/ })).toContainText(columnAName);

      // Live-Region der Ansicht (BoardScreen.tsx, `announcement`) — nicht per
      // Rolle "status" gesucht, weil jede Hinweismeldung (`InlineMessage`)
      // auf der Seite dieselbe Rolle trägt; die eindeutige Fläche ist die
      // unsichtbare Ansage selbst.
      const announcement = page.locator('[role="status"].visually-hidden');

      await cardInA.getByRole('button', { name: /Steht auch in/ }).click();
      await expect(cardInA).toHaveClass(/kcard--linked/);
      await expect(cardInB).toHaveClass(/kcard--linked/);
      await expect(announcement).toContainText(todo.title);
      await expect(announcement).toContainText('2 Spalten');
      await expect(announcement).toContainText(columnAName);
      await expect(announcement).toContainText(columnBName);

      // Ein zweiter Klick hebt die Hervorhebung an **beiden** Vorkommen auf.
      await cardInA.getByRole('button', { name: /Steht auch in/ }).click();
      await expect(cardInA).not.toHaveClass(/kcard--linked/);
      await expect(cardInB).not.toHaveClass(/kcard--linked/);
      await expect(announcement).toHaveText('Hervorhebung aufgehoben.');
    } finally {
      await deletePoolByName(columnAName).catch(() => undefined);
      await deletePoolByName(columnBName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tagA.id).catch(() => undefined);
      await deleteTag(tagB.id).catch(() => undefined);
    }
  });
});

test.describe('TP-KANBAN-03 — Eine Spalte ohne Bedingung ist kein „keine Treffer“', () => {
  test('Spalte ohne jede Bedingung sagt das ausdrücklich, statt „keine Karte trifft diese Regel“ zu behaupten', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Kanban-Ohne-Bedingung-${run}`;

    try {
      await gotoBoard(page);
      await createBoardColumn(page, columnName);

      // Die Erfolgsmeldung ist beim Anlegen ohne Bedingung ein Warnton, kein
      // Erfolgston (`PoolFormDialog.tsx`), und nennt den Grund von sich aus.
      await expect(page.locator('.toast__title')).toHaveText('Spalte angelegt.');
      await expect(page.locator('.toast__body')).toContainText(columnName);
      await expect(page.locator('.toast__body')).toContainText('nennt noch keine Bedingung');

      const column = boardColumn(page, columnName);
      await expect(column).toBeVisible();
      await expect(column.locator('.kcolumn__rule')).toContainText(
        'Ohne Bedingung — diese Spalte bleibt leer.',
      );

      // Der andere Leerzustand — TP-KANBAN-01 — behauptet "keine Karte trifft
      // diese Regel". Hier steht ausdrücklich etwas anderes: Es gibt gar
      // keine Regel, die etwas treffen könnte.
      await expect(column.getByText('Diese Spalte hat noch keine Bedingung')).toBeVisible();
      await expect(column.getByText('Keine Karte trifft diese Regel')).toHaveCount(0);

      const editButton = column.getByRole('button', { name: 'Bedingung ergänzen' });
      await expect(editButton).toBeVisible();
      await editButton.click();

      const editDialog = page.getByRole('dialog', { name: `„${columnName}“ bearbeiten` });
      await expect(editDialog).toBeVisible();
      await editDialog.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(editDialog).toBeHidden();
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
    }
  });
});

test.describe('TP-KANBAN-04 — Timer auf erledigter Karte hebt „Erledigt“ auf und ändert dadurch die Spaltenzugehörigkeit', () => {
  test('Timerstart direkt von der Karte verschiebt sie von der Erledigt- in die Unerledigt-Spalte, ohne dass eine Regel angefasst wird', async ({
    page,
  }) => {
    const run = Date.now();
    const doneColumnName = `E2E-Kanban-Erledigt-${run}`;
    const openColumnName = `E2E-Kanban-Unerledigt-${run}`;
    const tag = await createTag(`E2E-Kanban-Reaktivierung-${run}`);
    const todo = await createTodo({ title: `E2E-KANBAN-REAKTIVIERT-${run}`, tagIds: [tag.id] });
    await markTodoDone(todo.id);

    try {
      await gotoBoard(page);
      await createBoardColumn(page, doneColumnName, {
        requiredTagNames: [tag.name],
        completion: 'done',
      });
      await createBoardColumn(page, openColumnName, {
        requiredTagNames: [tag.name],
        completion: 'open',
      });

      // `markTodoDone` lief über die API, am `bump()`-Mechanismus der
      // Oberfläche vorbei — ohne Neuladen zeigte das Board noch den Stand vor
      // dem Erledigen.
      await page.reload();

      const doneColumn = boardColumn(page, doneColumnName);
      const openColumn = boardColumn(page, openColumnName);
      const cardInDone = doneColumn.locator('.kcard', { hasText: todo.title });
      const cardInOpen = openColumn.locator('.kcard', { hasText: todo.title });

      // Absichtlich **ohne** "Erledigte einblenden" anzuklicken (Vorgabe:
      // ausgeblendet): Eine Regel, die selbst etwas über "Erledigt" sagt, hat
      // das letzte Wort und zeigt die Karte trotzdem (T-076,
      // `PoolFormDialog.tsx`-Hinweistext an der Optionszeile).
      await expect(cardInDone).toBeVisible();
      await expect(cardInDone.locator('.kcard__flag')).toHaveText('Erledigt');
      await expect(openColumn.getByText('Keine Karte trifft diese Regel')).toBeVisible();
      await expect(cardInOpen).toHaveCount(0);

      await cardInDone.getByRole('button', { name: /Timer für/ }).click();

      // Die Regel "Erledigt" trifft die Karte nicht mehr, die Regel
      // "Unerledigt" jetzt schon — der einzige Weg, auf dem eine Karte heute
      // noch ohne Tag- oder Regeländerung die Spalte wechselt (A-2.5).
      await expect(doneColumn.locator('.kcard', { hasText: todo.title })).toHaveCount(0);
      await expect(cardInOpen).toBeVisible();
      await expect(cardInOpen.locator('.kcard__flag')).toHaveText(/Erledigt aufgehoben/);
      await expect(cardInOpen).toHaveClass(/kcard--running/);
      await expect(cardInOpen.getByRole('button', { name: /Timer für „.*“ stoppen/ })).toBeVisible();

      // A-5.6 bleibt: der Timer lässt sich weiterhin direkt von der Karte aus
      // stoppen, ohne die Detailansicht zu öffnen.
      await cardInOpen.getByRole('button', { name: /Timer für/ }).click();
      const stopDialog = page.getByRole('dialog', { name: 'Timer stoppen' });
      if (await stopDialog.isVisible().catch(() => false)) {
        await stopDialog.getByRole('button', { name: 'Stoppen und buchen' }).click();
        await expect(stopDialog).toBeHidden();
      }
      await expect(cardInOpen).not.toHaveClass(/kcard--running/);
    } finally {
      await deletePoolByName(doneColumnName).catch(() => undefined);
      await deletePoolByName(openColumnName).catch(() => undefined);
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});
