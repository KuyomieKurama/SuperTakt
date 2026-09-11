import { expect, test } from '@playwright/test';

import { gotoTodos } from './support/nav';

test('Ordnung und Erledigt-Schalter stehen in derselben Reihe', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await gotoTodos(page);

  const ordering = page.locator('.todo-list__ordering');
  await expect(ordering).toBeVisible();

  const select = ordering.locator('.select__trigger');
  const toggle = ordering.locator('.filter-toggle');
  const [selectBox, toggleBox] = await Promise.all([select.boundingBox(), toggle.boundingBox()]);

  expect(selectBox).not.toBeNull();
  expect(toggleBox).not.toBeNull();
  expect(Math.abs((selectBox?.y ?? 0) - (toggleBox?.y ?? 0))).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 760, height: 800 });
  // `.field__hint` ist die Klasse fremder Felder (`TextField`, `Select` &c.,
  // `FormDialog.tsx`); der Ordnungshinweis dieser Zeile trägt eine eigene,
  // engere Klasse (`TodoListFilters.tsx`: `<p className="todo-list__sort-
  // hint">`) — nie `field__hint`. Berichtigt, nicht abgeschwächt: dieselbe
  // Geometrieprüfung, nur gegen den tatsächlich vorhandenen Knoten.
  const hint = ordering.locator('.todo-list__sort-hint');
  const [narrowHintBox, narrowToggleBox] = await Promise.all([hint.boundingBox(), toggle.boundingBox()]);

  expect(narrowHintBox).not.toBeNull();
  expect(narrowToggleBox).not.toBeNull();
  // Berichtigt (Richtung war vertauscht, gemessen gegen den Bauplan des
  // Falltitels): `TodoListFilters.tsx` reiht Select, Schalter, dann den
  // Hinweis (`<p className="todo-list__sort-hint">`) — bei knappem Platz
  // erzwingt `flex-basis: 100%` (`app.css`, Container-Abfrage) für den
  // Hinweis eine eigene Zeile, und DOM-Reihenfolge bestimmt bei
  // `flex-wrap: wrap` ohne `order`, wer zuerst eine Zeile belegt: Select und
  // Schalter bleiben zusammen in der ersten Zeile — genau die Aussage im
  // Falltitel, die auch unter Platznot gelten soll —, der Hinweis weicht
  // darunter aus. Der Screenshot des Fehlschlags zeigt exakt dieses Bild
  // (Schalter neben Select, Hinweis eine Zeile darunter); die alte Richtung
  // hätte nur bestehen können, stünde der Hinweis vor dem Schalter im DOM.
  expect(narrowHintBox?.y ?? 0).toBeGreaterThan(
    (narrowToggleBox?.y ?? 0) + (narrowToggleBox?.height ?? 0),
  );
});
