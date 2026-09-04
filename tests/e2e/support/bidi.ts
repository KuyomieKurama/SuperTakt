/**
 * Takt — die tatsächliche Leserichtung eines Elements messen, nicht nur, ob
 * ein bestimmter Baustein vorhanden ist (O-AH, T-130).
 *
 * Vorlage: `reports/T-124-frontend-dev.md`, Abschnitt 5, Punkt 2. Ein
 * `unicode-bidi: isolate` allein genügt gegen ein bidirektionales
 * Formatierungszeichen **nicht** (UBA X2–X5, E-063 — die Berichtigung aus
 * T-119): Der Baustein `Foreign` (`apps/web/src/components/Foreign.tsx`)
 * wehrt sich stattdessen mit `visibleText`, das dem Zeichen seine Wirkung
 * nimmt und eine sichtbare Marke (`U+FFFD`) an seine Stelle setzt. Ob das
 * gelungen ist, zeigt sich erst an der tatsächlichen Bildschirmposition jedes
 * einzelnen Zeichens — eine Prüfung, die nur feststellt, dass ein `<bdi>` im
 * Baum steht, hätte den ursprünglichen Fehler (T-114/T-119) nicht gefangen.
 */

import type { Locator } from "@playwright/test";

/**
 * Wächst die x-Position jedes Zeichens mit seinem logischen Index? `true`
 * heißt: Der Text erscheint von links nach rechts, in der Reihenfolge, in der
 * er gespeichert ist.
 *
 * Setzt voraus, dass `locator` genau einen Textknoten als Kind trägt — das ist
 * die Gestalt von `<bdi>{visibleText(value)}</bdi>`.
 */
export function rendersLeftToRight(locator: Locator): Promise<boolean> {
  return locator.evaluate((element) => {
    const textNode = element.firstChild;
    if (textNode === null || textNode.nodeType !== Node.TEXT_NODE) {
      throw new Error("Erwartet ein Element mit genau einem Textknoten als Kind.");
    }
    const text = textNode.textContent ?? "";
    const lefts: number[] = [];
    for (let index = 0; index < text.length; index += 1) {
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      lefts.push(range.getBoundingClientRect().left);
    }
    for (let index = 1; index < lefts.length; index += 1) {
      const previous = lefts[index - 1];
      const current = lefts[index];
      if (previous === undefined || current === undefined) continue;
      if (current < previous) return false;
    }
    return true;
  });
}
