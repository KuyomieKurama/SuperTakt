/**
 * O-AH (docs/testplan.md, Abschnitt 23) — T-130, Vorlage `reports/T-124-frontend-dev.md` Abschnitt 4/5.
 *
 * Fremder Text aus dem Bestand: ein Titel mit einer bidirektionalen
 * Überschreibung (RLO, U+202E) erscheint in der Todo-Liste als
 * `Rechnung<U+FFFD>gnp.exe` in einem `<bdi>` — nicht in der Reihenfolge, die
 * das rohe Zeichen sonst erzwingen würde (E-063, `Foreign.tsx`).
 *
 * Der Titel entsteht **nicht** über die Tür: `POST /todos` weist ihn mit 422
 * ab (`titleSchema`, dieselbe Zeichenklasse wie überall sonst, T-122). Der
 * Auftrag nennt ausdrücklich den Weg über die Datenbank (`support/db.ts`) als
 * Alternative. Der genaue Wortlaut `Rechnung<RLO>gnp.exe` trägt bewusst
 * **kein** `E2E-`-Präfix: Er ist der Beleg aus dem Auftrag selbst (T-124,
 * „Nächster Schritt" 1) und bereits eine erfundene Fixtur — die klassische
 * RLO-Tarnung, bei der eine `.exe` wie eine `.png` aussieht — kein echter
 * Datei- oder Firmenname. Gefunden wird die Zeile trotzdem ohne Präfix: über
 * die Teilzeichenkette „gnp.exe", die nach dem RLO in der gespeicherten
 * Zeichenkette steht und in keinem anderen Testtitel vorkommt.
 *
 * Der Rangetest (`support/bidi.ts`) ist die Vorlage aus Abschnitt 5, Punkt 2
 * des genannten Berichts: Er misst die **tatsächliche** Leserichtung über die
 * Bildschirmposition jedes Zeichens, nicht nur, ob ein `<bdi>` im Baum steht —
 * `unicode-bidi: isolate` allein reicht gegen ein RLO nicht (UBA X2–X5,
 * E-063, Berichtigung aus T-119).
 */
import { test, expect } from '@playwright/test';

import { createTodo, deleteTodo } from './support/api';
import { rendersLeftToRight } from './support/bidi';
import { overwriteTodoTitleDirectly } from './support/db';
import { gotoTodos } from './support/nav';

const RLO = '\u202e';
const HIDDEN_MARKER = '\ufffd';
const RAW_TITLE = `Rechnung${RLO}gnp.exe`;
const DISPLAYED_TITLE = `Rechnung${HIDDEN_MARKER}gnp.exe`;

test.describe('O-AH — fremder Text aus dem Bestand: Bidi-Überschreibung im Titel', () => {
  test('erscheint in der Todo-Liste als Rechnung<U+FFFD>gnp.exe in einem <bdi>, in tatsächlicher Leserichtung', async ({
    page,
  }) => {
    const run = Date.now();
    // Sicherer Platzhalter über die Tür angelegt (mit E2E-Präfix, damit die
    // Kennung selbst unbedenklich ist) — erst danach an der Tür vorbei auf
    // den geprüften Wortlaut überschrieben.
    const todo = await createTodo({ title: `E2E-Foreign-Platzhalter-${run}` });

    try {
      overwriteTodoTitleDirectly(todo.id, RAW_TITLE);

      await gotoTodos(page, { q: 'gnp.exe' });

      const title = page.locator('.todo-row__title bdi', { hasText: DISPLAYED_TITLE });
      await expect(title).toBeVisible();
      await expect(title).toHaveText(DISPLAYED_TITLE);

      const tagName = await title.evaluate((element) => element.tagName.toLowerCase());
      expect(tagName).toBe('bdi');

      // Der Rangetest: nicht nur, dass ein <bdi> da ist, sondern dass der
      // Text tatsächlich von links nach rechts erscheint.
      expect(await rendersLeftToRight(title)).toBe(true);
    } finally {
      await deleteTodo(todo.id).catch(() => undefined);
    }
  });
});
