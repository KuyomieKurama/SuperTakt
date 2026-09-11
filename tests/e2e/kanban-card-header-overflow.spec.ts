/**
 * TP-KANBAN-07 — Karte mit drei Marken in schmaler Spalte (T-282, T-281).
 *
 * Der Befund, den dieser Fall festhält, kam als Bildschirmfoto: Auf einer
 * Kanban-Karte mit Call-Nummer, Erledigt-Kennzeichen **und** Frist legte sich
 * die Abspieltaste über das rote „⚠ Überfällig …". T-281 hat die Ursache
 * behoben (`.kcard__top` bricht um, `.kcard__deadline` schrumpft wirklich)
 * und am Musterbaustein gemessen — aber nicht am echten Board-Bildschirm, und
 * es gab bis dahin **keinen** Prüffall für „drei Marken, schmale Spalte". Der
 * war nie geprüft; sonst wäre der Fall aufgefallen (T-282).
 *
 * Zwei Dinge, die dieser Fall bewusst **nicht** tut:
 *
 * - Er sucht keine Regel im Stilblatt (`flex-wrap`, `flex: none` &c.). Ein
 *   Fall, der eine CSS-Regel sucht, misst die Behebung und nicht die Wirkung
 *   — und bliebe grün, wenn ein künftiger Umbau dieselbe Wirkung mit anderen
 *   Regeln wieder zerstört. Gemessen wird der gerenderte Baum: Ränder in
 *   Pixeln, Überlappung als Rechteckschnitt, `scrollWidth` gegen
 *   `clientWidth`.
 * - Er bringt die Spalte nicht über eine feste `width` am Testcode auf ihre
 *   Mindestbreite, sondern über ein schmales Fenster — dieselbe Bedingung,
 *   unter der der Fehler am Bildschirm entstand. `.board` legt Spaltenbreiten
 *   über `grid-auto-columns: minmax(17rem, 21rem)` fest (`app.css`, „Kanban
 *   (S-04)"); ohne Fließraum (`fr`) wächst eine solche Spur nur, wenn im
 *   Container mehr Platz übrig ist, als die Summe der Mindestbreiten aller
 *   Spuren braucht. Bei genau einer Spalte reicht dafür ein Fenster, dessen
 *   Inhaltsbreite (Fensterbreite minus dem Seitenabstand von `.app__main`,
 *   der unterhalb der 52 rem-Schwelle in `app.css` auf `var(--space-4)`
 *   [16 px] je Seite fällt) unter 17 rem (272 px) liegt: **288 px** Fenster
 *   ergeben rechnerisch 288 − 32 = 256 px Inhaltsbreite, deutlich unter
 *   272 px, und die Spalte fällt auf ihren Boden. Nachgemessen unten
 *   (`expect(columnBox.width)`), nicht nur gerechnet — der Test hätte sich
 *   sonst selbst auf eine Annahme über eine Rechenregel verlassen, die er
 *   eigentlich prüfen soll.
 *
 * Der Fall aus TP-KANBAN-01 (`boardColumn`) wird hier bewusst noch einmal
 * lokal definiert statt importiert: Diese Datei ist die einzige Stelle im
 * Bestand, die den Helfer braucht, und `support/actions.ts` exportiert ihn
 * nicht — derselben Konvention folgt bereits `deadline-computed-state.spec.ts`
 * mit seinem eigenen `isoDay`.
 */
import { test, expect, type Locator, type Page } from '@playwright/test';

import { createBoardColumn } from './support/actions';
import { createTag, createTodo, deletePoolByName, deleteTag, deleteTodo } from './support/api';
import { gotoBoard } from './support/nav';

/** Ein Kalendertag `offsetDays` von heute, in Ortszeit (`YYYY-MM-DD`) — wie `deadline-computed-state.spec.ts`. */
function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

/** Wie in `kanban.spec.ts`: eine Spalte über ihre Überschrift, nicht über den ganzen Text finden. */
function boardColumn(page: Page, name: string): Locator {
  return page.locator('.kcolumn').filter({ has: page.locator('.kcolumn__title', { hasText: name }) });
}

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Rechteckschnittfläche zweier Kästen — 0, wenn sie sich nicht berühren. */
function overlapArea(a: Box, b: Box): number {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

test.describe('TP-KANBAN-07 — Kopfzeile der Kanban-Karte mit drei Marken in schmaler Spalte', () => {
  test('Call-Nummer, Erledigt-Kennzeichen und Frist bleiben bei Spaltenmindestbreite innerhalb der Karte, ohne Text zu verlieren', async ({
    page,
  }) => {
    const run = Date.now();
    const columnName = `E2E-Kopf-Ueberlauf-${run}`;
    const tag = await createTag(`E2E-Kopf-Ueberlauf-${run}`);
    // Eine **realistische** Call-Nummer, kurz wie im echten Betrieb (siehe
    // Vorgabewert des Add-in-Regex, `call[\s#:_-]*(\d{5,6})`) — nicht der
    // volle Zeitstempel `run`. Der Titel bleibt eindeutig über `run`; die
    // Call-Nummer braucht das nicht und würde sonst selbst mit nur zwei
    // Marken umbrechen (nachgemessen: 28 Zeichen lang bricht die Kopfzeile
    // schon ohne Frist — ein Fehler in den Testdaten, keiner der Karte).
    const callSuffix = String(run).slice(-6);

    // Überfällig, nicht nur "gestern": ein Abstand von fünf Tagen bleibt auch
    // dann sicher im Zustand "Überfällig", wenn die Uhr des Testläufers ein
    // paar Stunden von der Browser-Zeitzone (Europe/Berlin, playwright.config
    // .ts) abweicht — derselbe Kniff wie in `deadline-computed-state.spec.ts`.
    const overdue = isoDay(-5);

    const threeMarks = await createTodo({
      title: `E2E-KOPF-DREI-${run}`,
      callNumber: `CALL-${callSuffix}`,
      dueDate: overdue,
      tagIds: [tag.id],
    });
    // Gegenprobe: dieselbe Regel, aber ohne Frist — zwei Marken, kein Umbruch
    // nötig (A-19.5: ein Todo ohne Frist trägt diese dritte Marke gar nicht).
    const twoMarks = await createTodo({
      title: `E2E-KOPF-ZWEI-${run}`,
      callNumber: `CALL-${callSuffix}9`,
      tagIds: [tag.id],
    });

    try {
      await gotoBoard(page);
      await createBoardColumn(page, columnName, { requiredTagNames: [tag.name] });

      const column = boardColumn(page, columnName);
      await expect(column).toBeVisible();

      const cardThree = column.locator('.kcard', { hasText: threeMarks.title });
      const cardTwo = column.locator('.kcard', { hasText: twoMarks.title });
      await expect(cardThree).toBeVisible();
      await expect(cardTwo).toBeVisible();

      // Vor dem Verengen: die dritte Marke steht wirklich da (aria-label trägt
      // Zustandswort und Datum, DeadlineFlag.tsx) — sonst prüfte der Rest
      // dieses Falls einen Fall mit nur zwei Marken und hieße falsch.
      await expect(cardThree.locator('.kcard__deadline')).toHaveAttribute(
        'aria-label',
        /^Überfällig — Frist: \d{2}\.\d{2}\.\d{4}$/,
      );
      await expect(cardTwo.locator('.kcard__deadline')).toHaveCount(0);

      // --- Spalte auf ihre Mindestbreite bringen: ein schmales Fenster, ----
      // --- keine erzwungene Breite im Testcode (siehe Dateikopf). ----------
      await page.setViewportSize({ width: 288, height: 900 });

      const columnBox = await column.boundingBox();
      expect(columnBox).not.toBeNull();
      // 17 rem = 272 px bei einer Wurzelschriftgröße von 16 px (keine Datei
      // in diesem Bestand setzt eine andere). ±1,5 px Toleranz für
      // Sub-Pixel-Rundung zwischen Layout-Engine und `getBoundingClientRect`.
      expect(columnBox!.width).toBeGreaterThanOrEqual(270.5);
      expect(columnBox!.width).toBeLessThanOrEqual(273.5);

      // --- Der Fall mit drei Marken: nichts ragt aus `.kcard__main`, -------
      // --- nichts überschneidet `.kcard__actions`, nichts wird abgeschnitten.
      const main = cardThree.locator('.kcard__main');
      const actions = cardThree.locator('.kcard__actions');
      const top = cardThree.locator('.kcard__top');

      const mainBox = (await main.boundingBox()) as Box | null;
      const actionsBox = (await actions.boundingBox()) as Box | null;
      expect(mainBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();

      const marks = await top.locator(':scope > *').all();
      // Call-Nummer, Erledigt-Kennzeichen, Frist — sonst ist das nicht der
      // Drei-Marken-Fall, den dieser Testfall prüfen soll.
      expect(marks.length).toBe(3);

      for (const mark of marks) {
        const box = (await mark.boundingBox()) as Box | null;
        expect(box).not.toBeNull();
        const b = box as Box;

        // Rechter Rand der Marke ≤ rechter Rand von `.kcard__main`.
        expect(b.x + b.width).toBeLessThanOrEqual(mainBox!.x + mainBox!.width + 1);

        // Keine Überschneidung mit `.kcard__actions` (dem Fach mit Timer- und
        // Menüknopf) — das war genau der gemeldete Schaden: die Frist lag
        // unter der Abspieltaste.
        expect(overlapArea(b, actionsBox as Box)).toBeLessThanOrEqual(1);

        // Kein Text wird abgeschnitten: Der sichtbare Inhalt der Marke passt
        // vollständig in ihren eigenen Kasten. Das fängt einen künftigen
        // `text-overflow`/`overflow: hidden`-„Ausgleich" ab, der die beiden
        // Prüfungen oben grün ließe, aber die Frist stumm kürzte.
        const metrics = await mark.evaluate((el) => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        }));
        expect(metrics.scrollWidth).toBeLessThanOrEqual(Math.ceil(metrics.clientWidth) + 1);
      }

      // --- Gegenprobe: ohne Frist bleiben es zwei Marken in einer Zeile. ---
      const topTwo = cardTwo.locator('.kcard__top');
      const marksTwo = await topTwo.locator(':scope > *').all();
      expect(marksTwo.length).toBe(2);

      const boxesTwo = await Promise.all(marksTwo.map((mark) => mark.boundingBox()));
      expect(boxesTwo[0]).not.toBeNull();
      expect(boxesTwo[1]).not.toBeNull();
      // Einzeilig heißt: beide Marken teilen sich dieselbe Zeile. Ihre obere
      // Kante allein zu vergleichen, trägt nicht — `.kcard__top` zentriert
      // (`align-items: center`), und Call-Nummer und Erledigt-Kennzeichen sind
      // unterschiedlich hoch (verschiedene Symbol- und Schriftgrößen), stehen
      // aber auf derselben Zeile trotzdem mit **gleicher Mitte**. Die Mitte
      // ist deshalb das richtige Maß, nicht die Kante — sonst meldet dieser
      // Test einen Umbruch, den es gar nicht gibt (am Bildschirm nachgesehen).
      const [centerYFirst, centerYSecond] = (boxesTwo as Box[]).map((box) => box.y + box.height / 2);
      expect(Math.abs((centerYFirst as number) - (centerYSecond as number))).toBeLessThanOrEqual(1.5);
    } finally {
      await deletePoolByName(columnName).catch(() => undefined);
      await deleteTodo(threeMarks.id).catch(() => undefined);
      await deleteTodo(twoMarks.id).catch(() => undefined);
      await deleteTag(tag.id).catch(() => undefined);
    }
  });
});
