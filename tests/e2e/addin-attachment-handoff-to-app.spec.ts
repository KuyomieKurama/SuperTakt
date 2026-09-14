/**
 * TP-ANH-23 (docs/testplan.md, Abschnitt 25.4, neu T-311) — A-19.33, A-19.22b,
 * A-19.23b, A-A-93, R-27.
 *
 * Die fehlende zweite Naht aus `.claude/team/reports/T-308-spec-ux-reviewer.md`,
 * Abschnitt 2 Punkt 2: A-19.33 ist an der ersten Naht (Office.js → Nutzlast →
 * Bestand, `proof-addin.mjs` Abschnitt 18) mit echtem SQLite von Ende zu Ende
 * gemessen — die **zweite** Naht, Bestand → Hauptfenster, war bisher nur **von
 * Hand** gemessen (T-302, bei 420 px) und ist damit nach der eigenen Regel
 * dieses Bestands ein Stand, kein Nachweis.
 *
 * Dieser Fall schlägt ein über das Add-in angelegtes Todo mit drei
 * übernommenen Anhängen in `apps/web` auf und zählt: **drei** Zeilen, nicht
 * „mindestens eine" — die Untergrenze, die ein Prüffall über eine Menge
 * braucht. Eine davon ist die Nachricht selbst, als Nachbau gekennzeichnet
 * (A-19.22b) — das ist zugleich die einzige e2e-Messung dieser Kennzeichnung
 * im Hauptfenster (die drei Orte aus T-303 Abschnitt 3 sind sonst nur an
 * Quelltext und Kommentar gemessen, siehe T-308).
 *
 * Die zweite Hälfte ist A-A-93/R-27 (T-308 Abschnitt 2 Punkt 2, A-19.23b):
 * ein 200 Zeichen langer Anzeigename mit `.exe` am Ende — unter der
 * Speichergrenze von 255 Zeichen (`MAX_EMAIL_DISPLAY_NAME_CHARACTERS`),
 * geht also **unverändert** in den Bestand, und die Frage ist ausschließlich
 * die **Darstellung**: bleibt die Endung im echten, gerenderten Browser
 * sichtbar, bei normaler Breite und bei einem schmalen Viewport (420 px, wie
 * T-302 von Hand geprüft hat)? `proof:clamp` (fremde Hoheit,
 * `apps/web/scripts/proof-clamp.mjs`) sichert das **statisch** — welche
 * Klassen im Quelltext stehen. Was hier zusätzlich gemessen wird, ist die
 * **tatsächliche Berechnung** des Browsers zur Laufzeit: kein Vorfahre im
 * echten DOM beschneidet die Breite, unabhängig davon, ob eine deckelnde
 * Klasse im Quelltext stünde oder nicht (z. B. über eine geerbte Regel, ein
 * `!important` von außen oder eine zur Laufzeit gesetzte Inline-Eigenschaft —
 * nichts davon sieht `proof:clamp`, das nur Klassennamen im Quelltext liest).
 *
 * Kein echter Outlook-Host nötig: Die Anhänge entstehen über die echte
 * HTTP-Tür `POST /addin/todos` (wie in `attachment-export-and-addin-exclusion
 * .spec.ts`), nicht über Office.js — die Naht Office.js → Nutzlast bleibt
 * die benannte, hinnehmbare Lücke aus T-308 Abschnitt 2 Punkt 1 (Windows +
 * echtes Outlook nötig).
 */
import { test, expect } from '@playwright/test';

import { addinCreateTodo, listAttachmentsByTodo } from './support/api';
import { gotoTodo } from './support/nav';

function attachmentsCardOn(page: import('@playwright/test').Page) {
  return page.locator('.card').filter({ has: page.locator('.card__title', { hasText: 'Anhänge' }) });
}

/** Erfundener Rumpf, keine Mail-Zerlegung im Dienst (A-A-88) — Bytes genügen. */
function base64Of(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}

test.describe('TP-ANH-23 — vom Add-in übernommene Anhänge erscheinen vollständig im Hauptfenster', () => {
  test('drei Zeilen, eine als Nachbau gekennzeichnet, eine mit 200-Zeichen-Namen und sichtbarer .exe-Endung', async ({
    page,
  }) => {
    const run = Date.now();
    const longExeName = `${'a'.repeat(200)}.exe`;

    const created = await addinCreateTodo({
      title: `E2E-ADDIN-UEBERNAHME-${run}`,
      attachments: {
        sender: 'kunde@beispiel.example',
        items: [
          {
            kind: 'message',
            displayName: `Anfrage-${run}.eml`,
            contentBase64: base64Of(`Betreff: Anfrage ${run}\r\n\r\nErfundener Inhalt, kein echter Kundenvorgang.`),
            // Outlook ohne Mailbox 1.14 — der Nachbau-Fall aus A-19.22a/b.
            rebuilt: true,
          },
          {
            kind: 'file',
            displayName: `Angebot-${run}.pdf`,
            contentBase64: base64Of('Erfundener Dateiinhalt, kein echtes PDF.'),
          },
          { kind: 'file', displayName: longExeName, contentBase64: base64Of('Erfundener Dateiinhalt.') },
        ],
      },
    });

    // Gegenprobe vor der eigentlichen Messung: Der Dienst hat wirklich drei
    // Anhänge angelegt und keinen abgewiesen — sonst wäre die Zeilenzahl
    // unten aus dem falschen Grund richtig.
    expect(created.attachments?.stored).toBe(3);
    expect(created.attachments?.rejected).toEqual([]);
    const stored = await listAttachmentsByTodo(created.todo.id);
    expect(stored).toHaveLength(3);

    await gotoTodo(page, created.todo.id);
    const attachmentsCard = attachmentsCardOn(page);
    const rows = attachmentsCard.locator('.attachment-list .attachment');

    // --- Die Untergrenze: genau drei, nicht „mindestens eine" --------------
    await expect(rows).toHaveCount(3);

    // --- Die Nachricht: als Nachbau gekennzeichnet, an der Zeile -----------
    const messageRow = rows.filter({ hasText: `Anfrage-${run}.eml` });
    await expect(messageRow).toHaveCount(1);
    await expect(messageRow).toContainText('(nachgebaut)');
    await expect(messageRow.getByRole('button', { name: /\(nachgebaut\)/ })).toBeVisible();
    // Aus einer E-Mail, mit Absender — die Herkunftszeile (A-A-84, A-A-85).
    await expect(messageRow).toContainText('kunde@beispiel.example');

    // --- Der zweite Dateianhang: kein Nachbau, dieselbe Herkunft ------------
    const pdfRow = rows.filter({ hasText: `Angebot-${run}.pdf` });
    await expect(pdfRow).toHaveCount(1);
    await expect(pdfRow).not.toContainText('(nachgebaut)');

    // --- Der lange Name: Endung sichtbar, normale Breite --------------------
    const longRow = rows.filter({ hasText: '.exe' });
    await expect(longRow).toHaveCount(1);
    const longLabel = longRow.locator('.attachment__label');
    await expect(longLabel).toHaveText(longExeName);
    await assertExtensionRendersVisibly(page, longLabel);

    // --- Dieselbe Messung bei 420 px (T-302) — nicht von Hand, sondern hier -
    await page.setViewportSize({ width: 420, height: 800 });
    await expect(rows).toHaveCount(3);
    const longLabelNarrow = attachmentsCardOn(page)
      .locator('.attachment-list .attachment')
      .filter({ hasText: '.exe' })
      .locator('.attachment__label');
    await expect(longLabelNarrow).toHaveText(longExeName);
    await assertExtensionRendersVisibly(page, longLabelNarrow);

    // Kein Aufräumen: Das Todo trägt jetzt Anhänge, dieselbe Lage wie in
    // `attachment-export-and-addin-exclusion.spec.ts` — der Titel trägt den
    // Zeitstempel und ist als E2E-Rest erkennbar.
  });
});

/**
 * Die reale Messung hinter „die Endung bleibt sichtbar" (A-19.23b, A-A-93,
 * R-27) — zur Laufzeit im echten DOM, nicht am Quelltext.
 *
 * Drei Dinge, und keines davon liest `proof:clamp` (das prüft Klassennamen im
 * Quelltext, nicht die berechnete Darstellung):
 *
 *  1. Der volle Name steht im zugänglichen Text des Elements — keine
 *     unsichtbare Kürzung.
 *  2. Kein Vorfahre zwischen dem Element und `<body>` beschneidet die Breite
 *     (`overflow`/`overflow-x: hidden` **und** tatsächlich mehr Inhalt, als
 *     Platz da ist) — unabhängig davon, ob eine Klasse dafür im Quelltext
 *     stünde.
 *  3. Das Element hat eine echte, sichtbare Ausdehnung (keine Nullgröße,
 *     nicht `display: none`) und ragt nicht über den rechten Rand des
 *     sichtbaren Fensters hinaus.
 */
async function assertExtensionRendersVisibly(
  page: import('@playwright/test').Page,
  label: import('@playwright/test').Locator,
): Promise<void> {
  const text = await label.textContent();
  expect(text?.trim().endsWith('.exe')).toBe(true);

  // Wie eine Augenprüfung: erst dorthin scrollen, wo die Zeile tatsächlich
  // steht — sonst mäße die folgende Randprüfung nur „noch nicht gescrollt"
  // und keine echte Beschneidung.
  await label.scrollIntoViewIfNeeded();

  const box = await label.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) return;
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);

  /*
   * Nicht „gibt es irgendwo im Baum einen Überlauf" (ein fremdes, breites
   * Element woanders auf dem Bildschirm mit demselben scrollenden Vorfahren
   * meldete sonst einen Treffer, der mit **diesem** Namen nichts zu tun hat)
   * — sondern: liegt die tatsächliche Bildschirmposition **dieses Elements**
   * innerhalb des sichtbaren Ausschnitts jedes Vorfahren, der eine Achse
   * beschneidet. Das ist dieselbe Frage, die eine Augenprüfung stellt.
   */
  const rect = { left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height };
  const clippedByAncestor = await label.evaluate((el, r) => {
    let node: Element | null = el.parentElement;
    while (node !== null && node !== document.body) {
      const style = getComputedStyle(node);
      const hidesX = style.overflowX === 'hidden' || style.overflow === 'hidden';
      const hidesY = style.overflowY === 'hidden' || style.overflow === 'hidden';
      if (hidesX || hidesY) {
        const clip = node.getBoundingClientRect();
        const overflowsRight = hidesX && r.right > clip.right + 1;
        const overflowsLeft = hidesX && r.left < clip.left - 1;
        const overflowsBottom = hidesY && r.bottom > clip.bottom + 1;
        const overflowsTop = hidesY && r.top < clip.top - 1;
        if (overflowsRight || overflowsLeft || overflowsBottom || overflowsTop) return true;
      }
      node = node.parentElement;
    }
    return false;
  }, rect);
  expect(clippedByAncestor).toBe(false);

  const viewport = page.viewportSize();
  if (viewport !== null) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  }
}
