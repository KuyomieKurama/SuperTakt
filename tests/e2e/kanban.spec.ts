/**
 * Kanban (A-5.1 bis A-5.6, TP-KANBAN-01/02/04, docs/testplan.md Abschnitt 8).
 *
 * Karte per Drag & Drop zwischen Spalten, Statusspalten umkonfigurieren
 * (T-052-Auftrag: die Reihenfolge — genau die, die bis T-050 an einem
 * falschen Feldnamen scheiterte), Timer direkt von der Karte starten und
 * stoppen. In T-012/T-048 zweimal in Folge als "nicht gelaufen, Zeitmangel"
 * vermerkt (T-012 Fall 25, T-048 Fall 25) — hier zum ersten Mal tatsächlich
 * gefahren.
 *
 * **Der Anlass (T-052).** `apps/web/src/api/endpoints.ts` sendete bis T-050
 * beim Umsortieren `{ reihenfolge: order }` statt `{ order }`; die Route
 * (`PUT /todo-statuses/order`, `statusOrderSchema`) verlangt `order` und wies
 * jeden Aufruf mit 422 ab — die Pfeile „nach links“/„nach rechts“ in
 * „Spalten verwalten“ haben **nie etwas bewirkt**. Kein Testfall in
 * `tests/e2e/**` hat das je durch die Oberfläche geprüft; der Fehler kam erst
 * beim Quelltextabgleich in T-050 ans Licht. Der Reihenfolge-Testfall unten
 * ist deshalb bewusst **doppelt** abgesichert: Nachschau im selben Dialog
 * (derselbe Zustand könnte rein clientseitig sein) **und** an den
 * tatsächlichen Spaltentiteln auf dem Board **und** nach einem vollständigen
 * `page.reload()` (ein rein optimistischer, nie gespeicherter Zustand fiele
 * hier zurück) — nirgends am Rückgabewert des Aufrufs selbst.
 *
 * **Richtigstellung zu einer Angabe aus T-050.** Dort steht, jede neue Spalte
 * entstehe „auf 0“, weil das Formular kein `position` mitschickt und
 * `statusCreateSchema` dafür `0` vorgibt. Das ist nur die halbe Wahrheit und
 * an dieser Stelle live nachgemessen (`console.log` während der Entwicklung
 * dieses Falls, unten nicht mehr enthalten): Die Speicherschicht
 * (`packages/storage/src/sqlite/repo-statuses.ts`, `create()`) behandelt
 * `position <= 0` als Übergabewert **„ans Ende anhängen“**
 * (`MAX(position) + 1`), nicht als Wunsch nach der ersten Stelle. Eine neu
 * angelegte Spalte landet deshalb zuverlässig **hinter** den vier
 * Standardspalten, nicht davor — beide Testspalten unten werden dynamisch an
 * ihrer tatsächlichen, ermittelten Position gefunden, nicht an einer
 * angenommenen. Beide werden am Ende jedes Falls wieder entfernt
 * (`deleteTodoStatus`) — die relative Reihenfolge der Standardspalten
 * zueinander ist danach unverändert, auch wenn ihre absoluten Positionswerte
 * sich durch das Umsortieren zwischenzeitlich verschoben haben (Reihenfolge
 * zählt, nicht die absolute Zahl).
 *
 * **Befund am Rande, nicht Gegenstand eines eigenen Testfalls:** Die
 * Spezifikation aus `docs/testplan.md` (TP-KANBAN-02, Schritt 1) verlangt
 * „Eine Spalte umbenennen“ — dafür gibt es in `StatusColumnsDialog`
 * (`apps/web/src/screens/BoardScreen.tsx`) keine Bedienung. `updateTodoStatus`
 * wird dort ausschließlich mit `{ isDefault: true }` aufgerufen, nie mit
 * `{ name }`. `column-row__name` ist eine reine `<span>`, kein Eingabefeld.
 * Ein e2e-Fall kann eine Bedienung nicht prüfen, die es nicht gibt; siehe
 * Bericht.
 */
import { test, expect } from '@playwright/test';

import { createStatus, createTodo, deleteTodo, deleteTodoStatus, listStatuses } from './support/api';
import { gotoBoard } from './support/nav';

/** Stoppt einen laufenden Timer über den Karten-Knopf selbst (kein Öffnen der Detailansicht). */
async function stopTimerFromCard(page: import('@playwright/test').Page, card: import('@playwright/test').Locator): Promise<void> {
  await card.getByRole('button', { name: /Timer für/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Timer stoppen' });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole('button', { name: 'Stoppen und buchen' }).click();
    await expect(dialog).toBeHidden();
  }
}

/**
 * Zieht eine Kanban-Karte per echtem HTML5-Drag&Drop in eine Zielspalte.
 *
 * `locator.dragTo()` simuliert nur eine Zeigerbewegung und trifft die native
 * Ziehgeste in diesem Aufbau nicht zuverlässig (in der Entwicklung dieses
 * Falls beobachtet: die Karte blieb liegen, kein Fehler, kein Ereignis).
 * Diese Funktion löst stattdessen die vier echten Ereignisse aus, die
 * `Kanban.tsx` (`onDragStart`/`onDragEnd`) und `BoardScreen.tsx`
 * (`onDragOver`/`onDrop`) selbst abonniert haben, mit **einem** geteilten
 * `DataTransfer` — genau das Objekt, über das die Anwendung die Kennung des
 * gezogenen Todos weiterreicht (`DRAG_MIME`, `BoardScreen.tsx`). Geprüft wird
 * damit derselbe Code, den ein echter Mauszug auch träfe; nur die
 * Low-Level-Zeigermechanik der Ziehgeste wird ersetzt, nicht die Anwendung.
 */
async function dragCardIntoColumn(
  page: import('@playwright/test').Page,
  card: import('@playwright/test').Locator,
  column: import('@playwright/test').Locator,
): Promise<void> {
  const cardHandle = await card.elementHandle();
  const columnHandle = await column.elementHandle();
  if (cardHandle === null || columnHandle === null) {
    throw new Error('Karte oder Zielspalte nicht im DOM gefunden.');
  }
  await page.evaluate(
    ({ cardEl, columnEl }) => {
      const dataTransfer = new DataTransfer();
      const fire = (target: Element, type: string): void => {
        target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
      };
      fire(cardEl, 'dragstart');
      fire(columnEl, 'dragenter');
      fire(columnEl, 'dragover');
      fire(columnEl, 'drop');
      fire(cardEl, 'dragend');
    },
    { cardEl: cardHandle, columnEl: columnHandle },
  );
}

test.describe('Kanban — Drag & Drop, Spaltenverwaltung, Timer von der Karte', () => {
  test('TP-KANBAN-01 — Karte per Drag & Drop zwischen Spalten, persistent nach Neuladen', async ({ page }) => {
    const run = Date.now();
    const colA = await createStatus(`E2E-Kanban-Quelle-${run}`);
    const colB = await createStatus(`E2E-Kanban-Ziel-${run}`);
    const title = `E2E-KANBAN-DND-${run}`;
    const todo = await createTodo({ title, statusId: colA.id });

    try {
      await gotoBoard(page);

      const columnA = page.locator('.kcolumn', { hasText: colA.name });
      const columnB = page.locator('.kcolumn', { hasText: colB.name });
      await expect(columnA).toBeVisible();
      await expect(columnB).toBeVisible();

      const card = columnA.locator('.kcard', { hasText: title });
      await expect(card).toBeVisible();
      await expect(columnB.locator('.kcard', { hasText: title })).toHaveCount(0);

      // Der eigentliche Zug: echtes HTML5-Drag&Drop (die Karte trägt
      // `draggable`, `Kanban.tsx`), keine Tastaturalternative.
      await dragCardIntoColumn(page, card, columnB);

      // Sofort nach dem Ziehen liegt die Karte in der Zielspalte — und nicht
      // mehr in der Quelle.
      await expect(columnB.locator('.kcard', { hasText: title })).toBeVisible();
      await expect(columnA.locator('.kcard', { hasText: title })).toHaveCount(0);

      // Persistiert, nicht nur clientseitig verschoben (A-5.2/A-5.3 — der
      // Statuswechsel ist ein `PATCH /todos/{id}` auf dem Dienst).
      await page.reload();
      const columnBAfterReload = page.locator('.kcolumn', { hasText: colB.name });
      const columnAAfterReload = page.locator('.kcolumn', { hasText: colA.name });
      await expect(columnBAfterReload.locator('.kcard', { hasText: title })).toBeVisible();
      await expect(columnAAfterReload.locator('.kcard', { hasText: title })).toHaveCount(0);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
      await deleteTodoStatus(colA.id).catch(() => undefined);
      await deleteTodoStatus(colB.id).catch(() => undefined);
    }
  });

  test('TP-KANBAN-02 — Spalte anlegen, Reihenfolge ändern (der bis T-050 wirkungslose Fall), Spalte ohne Karten löschen', async ({
    page,
  }) => {
    const run = Date.now();
    const nameA = `E2E-Kanban-A-${run}`;
    const nameB = `E2E-Kanban-B-${run}`;
    let idA: string | null = null;
    let idB: string | null = null;

    try {
      await gotoBoard(page);
      await page.getByRole('button', { name: 'Spalten verwalten' }).click();
      const dialog = page.getByRole('dialog', { name: 'Statusspalten' });
      await expect(dialog).toBeVisible();

      // --- Anlegen: über das echte Formular, nicht über die Testhilfe -------
      await dialog.getByLabel('Neue Spalte').fill(nameA);
      await dialog.getByRole('button', { name: 'Spalte anlegen' }).click();
      await expect(dialog.locator('.column-row', { hasText: nameA })).toBeVisible();

      await dialog.getByLabel('Neue Spalte').fill(nameB);
      await dialog.getByRole('button', { name: 'Spalte anlegen' }).click();
      await expect(dialog.locator('.column-row', { hasText: nameB })).toBeVisible();

      // Kennungen für die Aufräumung am Ende — nur zum Aufräumen aus der API
      // gelesen, nicht Teil der eigentlichen Prüfung.
      const created = await listStatuses();
      idA = created.find((status) => status.name === nameA)?.id ?? null;
      idB = created.find((status) => status.name === nameB)?.id ?? null;
      expect(idA).not.toBeNull();
      expect(idB).not.toBeNull();

      // --- Reihenfolge: der Kern dieses Testfalls -----------------------
      // Beide neuen Spalten hängen sich ans Ende an (siehe Dateikopf) und
      // stehen deshalb nebeneinander hinter den Standardspalten — in
      // welcher der beiden Reihenfolgen, wird hier ermittelt statt
      // unterstellt.
      const rowNames = () => dialog.locator('.column-row__name').allInnerTexts();
      const namesBefore = await rowNames();
      const indexA = namesBefore.indexOf(nameA);
      const indexB = namesBefore.indexOf(nameB);
      expect(indexA).toBeGreaterThanOrEqual(0);
      expect(indexB).toBeGreaterThanOrEqual(0);
      const [leftName, rightName] = indexA < indexB ? [nameA, nameB] : [nameB, nameA];

      // "leftName" steht vor "rightName" — ein Klick auf dessen "nach
      // rechts" muss die beiden tauschen.
      await dialog.getByRole('button', { name: `„${leftName}“ nach rechts` }).click();

      // Nachschau 1 — im selben Dialog: die Zeilenliste hat tatsächlich
      // getauscht (nicht nur das Symbol des Knopfs). Über `expect.poll`, weil
      // der Klick selbst sofort zurückkehrt — `reorderTodoStatuses` und der
      // anschließende Neulade-Aufruf laufen asynchron dahinter, und ein
      // sofortiges `allInnerTexts()` läse noch den alten Stand (in der Probe
      // zu diesem Fall tatsächlich beobachtet: der Dienst hatte die Reihen-
      // folge schon umgestellt, das DOM zeigte sie noch nicht).
      await expect
        .poll(async () => {
          const names = await rowNames();
          return names.indexOf(rightName) - names.indexOf(leftName);
        })
        .toBeLessThan(0);

      await dialog.getByRole('button', { name: 'Schließen', exact: true }).click();
      await expect(dialog).toBeHidden();

      // Nachschau 2 — auf dem Board selbst, nicht mehr im Dialog: Ein
      // Dialog, der nur seinen eigenen, nie gespeicherten Zustand anzeigt,
      // wäre hier nicht zu unterscheiden von einem echten Erfolg — die
      // Spaltenköpfe auf dem Board sind ein zweiter, unabhängiger Ort, an
      // dem sich dieselbe Reihenfolge zeigen muss.
      // `.kcolumn__title` stellt seinen Text per CSS in Großbuchstaben dar
      // (`text-transform: uppercase`) — `innerText` folgt dem Bildschirmbild,
      // nicht dem Quelltext. Deshalb hier ohne Rücksicht auf Groß-/
      // Kleinschreibung verglichen; das Vorkommen selbst bleibt eindeutig,
      // die erfundenen Testnamen unterscheiden sich sonst nur im Zeitstempel.
      const boardTitles = async (): Promise<readonly string[]> =>
        (await page.locator('.kcolumn__title').allInnerTexts()).map((text) => text.toLowerCase());
      let titles = await boardTitles();
      expect(titles.indexOf(rightName.toLowerCase())).toBeLessThan(titles.indexOf(leftName.toLowerCase()));

      // Nachschau 3 — nach vollständigem Neuladen: Genau die Prüfung, die am
      // eingebauten `reihenfolge`-Fehler (T-050) rot geworden wäre. Vor
      // T-050 hätte der Klick oben bereits eine 422-Fehlermeldung ausgelöst
      // (heute: `mutation.error`, sichtbar in `StatusColumnsDialog`) und die
      // Reihenfolge wäre unverändert geblieben — dieser Fall hätte ihn
      // gefunden.
      await page.reload();
      // Nach `reload()` ist die Navigation fertig, nicht zwingend schon der
      // asynchrone Ladevorgang von Board und Struktur — deshalb erst auf
      // beide Testspalten warten, bevor die Reihenfolge gelesen wird.
      await expect(page.locator('.kcolumn', { hasText: leftName })).toBeVisible();
      await expect(page.locator('.kcolumn', { hasText: rightName })).toBeVisible();
      titles = await boardTitles();
      expect(titles.indexOf(rightName.toLowerCase())).toBeLessThan(titles.indexOf(leftName.toLowerCase()));

      // --- Löschen einer Spalte ohne Karten (Rest von TP-KANBAN-02) --------
      await page.getByRole('button', { name: 'Spalten verwalten' }).click();
      const dialog2 = page.getByRole('dialog', { name: 'Statusspalten' });
      await expect(dialog2).toBeVisible();
      const rowToDelete = dialog2.locator('.column-row', { hasText: rightName });
      await rowToDelete.getByRole('button', { name: `„${rightName}“ löschen` }).click();
      const confirm = page.getByRole('alertdialog', { name: 'Statusspalte löschen?' });
      await expect(confirm).toBeVisible();
      await expect(confirm).toContainText(
        'Liegen noch Karten in dieser Spalte, lehnt Takt das Löschen ab.',
      );
      await confirm.getByRole('button', { name: 'Löschen' }).click();
      await expect(confirm).toBeHidden();
      await expect(dialog2.locator('.column-row', { hasText: rightName })).toHaveCount(0);
      if (rightName === nameA) idA = null;
      else idB = null;

      await dialog2.getByRole('button', { name: 'Schließen', exact: true }).click();
      await expect(page.locator('.kcolumn', { hasText: rightName })).toHaveCount(0);
    } finally {
      if (idA !== null) await deleteTodoStatus(idA).catch(() => undefined);
      if (idB !== null) await deleteTodoStatus(idB).catch(() => undefined);
    }
  });

  test('TP-KANBAN-04 — Timer direkt von der Karte starten und stoppen, ohne die Detailansicht zu öffnen', async ({
    page,
  }) => {
    const title = `E2E-KANBAN-TIMER-${Date.now()}`;
    const todo = await createTodo({ title });

    try {
      await gotoBoard(page);
      const card = page.locator('.kcard', { hasText: title });
      await expect(card).toBeVisible();
      await expect(card.getByRole('button', { name: /Timer für „.*“ starten/ })).toBeVisible();

      await card.getByRole('button', { name: /Timer für/ }).click();

      // Karte zeigt einen laufenden Timer, ohne dass die Detailansicht
      // geöffnet wurde — die Adresse bleibt auf dem Board.
      await expect(page).toHaveURL(/#\/kanban/);
      await expect(card).toHaveClass(/kcard--running/);
      await expect(card.getByRole('button', { name: /Timer für „.*“ stoppen/ })).toBeVisible();

      await stopTimerFromCard(page, card);

      await expect(card).not.toHaveClass(/kcard--running/);
      await expect(card.getByRole('button', { name: /Timer für „.*“ starten/ })).toBeVisible();
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });
});
