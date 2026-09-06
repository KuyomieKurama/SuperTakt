import type { KeyboardEvent } from "react";

/**
 * Fokusfuehrung fuer modale Flaechen.
 *
 * Die Auswahl und die Tabulatorschleife standen bis T-020 nur in
 * `ConfirmDialog`. Mit der Sperrmeldung der Huelle gibt es eine zweite Stelle,
 * die beides braucht — und zwei Kopien derselben Auswahl laufen auseinander,
 * sobald jemand eine davon erweitert.
 */

/**
 * Elemente, die den Fokus annehmen koennen.
 *
 * `[tabindex="-1"]` ist ausgenommen: Solche Elemente sind programmatisch
 * fokussierbar, aber nicht Teil der Tabulatorreihenfolge.
 */
export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Alle tabulierbaren Elemente innerhalb von `container`, in Dokumentreihenfolge. */
export function focusableWithin(container: HTMLElement | null): readonly HTMLElement[] {
  if (container === null) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Setzt den Fokus auf das erste tabulierbare Element. Meldet, ob das gelang. */
export function focusFirstWithin(container: HTMLElement | null): boolean {
  const first = focusableWithin(container)[0];
  if (first === undefined) return false;
  first.focus();
  return true;
}

/**
 * Das erste Element in `container`, das sich selbst fuer ungueltig erklaert.
 *
 * Gesucht wird `aria-invalid="true"` und nichts anderes: Was ungueltig ist,
 * entscheidet die Fachregel an der Aufrufstelle, und sie sagt es bereits im
 * Baum. Eine zweite Liste von Pflichtfeldern hier waere eine zweite Wahrheit —
 * genau die Bauart, die E-086 misst, statt sie zuzusichern.
 *
 * Dokumentreihenfolge ist Feldreihenfolge: `querySelector` liefert das oberste,
 * und das ist das erste, das der Benutzer korrigieren soll.
 */
export function firstInvalidWithin(container: HTMLElement | null): HTMLElement | null {
  if (container === null) return null;
  return container.querySelector<HTMLElement>('[aria-invalid="true"]');
}

/**
 * Der Block, zu dem ein Feld gehoert — Beschriftung darueber, Meldung darunter.
 *
 * Ins Bild geholt wird der ganze Block und nicht die Zeile mit dem Cursor: Eine
 * Fehlermeldung steht **unter** dem Eingabefeld, und wer nur das Eingabefeld an
 * den unteren Rand scrollt, hat die Begruendung wieder abgeschnitten.
 *
 * Der Block wird ohne Klassennamen gefunden — er ist das Kind des scrollenden
 * Rumpfes, in dem das Element liegt. Ein Klassenname waere eine Verabredung
 * zwischen zwei Dateien, die kein Lauf misst.
 */
export function fieldBlockWithin(element: HTMLElement, container: HTMLElement): HTMLElement {
  let node: HTMLElement = element;
  while (node.parentElement !== null && node.parentElement !== container) {
    node = node.parentElement;
  }
  return node.parentElement === container ? node : element;
}

/**
 * Fuehrt den Benutzer zur Absage: Fokus auf das erste ungueltige Feld, und sein
 * Block ins Bild.
 *
 * **Warum das gebaut werden musste (T-198, Befund O-FR 4.3, gemessen von
 * visual-qa im Browser).** Der Rumpf eines Formulardialogs scrollt
 * (`.dialog__body--form`, `max-height: 60vh`). Wer mit der Tastatur bis zum
 * Absendeknopf gelaufen ist und dort absendet, steht am unteren Ende dieses
 * Ausschnitts. Die Absage entsteht oben am Titelfeld — gemessen bei 143,6px,
 * waehrend der sichtbare Rand des gescrollten Bereichs bei 165,8px lag. Fuer
 * einen sehenden Benutzer geschah damit sichtbar **nichts**: Der Dialog blieb
 * stehen, und die Begruendung stand ausserhalb des Bildes.
 *
 * Das ist die Kehrseite von E-084. Solange Chromium den Absendeversuch selbst
 * abfing, hat seine Sprechblase nebenbei zum Feld gescrollt. Wer die eigene
 * Pruefung fuehrt, fuehrt auch den Weg zur Absage.
 *
 * `preventScroll` und danach ein eigener Ruf: Der Browser holt beim Fokussieren
 * das **Element** ins Bild, wir wollen den **Block**. Zwei Scrollvorgaenge
 * hintereinander waeren ein Sprung; einer genuegt.
 *
 * @returns Das Feld, das den Fokus bekommen hat, oder `null`.
 */
export function revealFirstInvalidWithin(container: HTMLElement | null): HTMLElement | null {
  const invalid = firstInvalidWithin(container);
  if (invalid === null || container === null) return null;
  invalid.focus({ preventScroll: true });
  /*
    Der Block, solange er in den Ausschnitt passt — sonst das Element selbst.
    Nicht jeder Dialog stellt seine Felder unmittelbar in den Rumpf: In
    `Attachments` liegt das Feld mit dem Knopf „Auswaehlen …" in einer eigenen
    Huelle. Ist die Huelle groesser als der Ausschnitt, brauechte man einen
    Bildlauf, um darin wieder zu suchen — dann gilt das Feld.
  */
  const block = fieldBlockWithin(invalid, container);
  const target = block.getBoundingClientRect().height <= container.clientHeight ? block : invalid;
  target.scrollIntoView({ block: "nearest" });
  return invalid;
}

/**
 * Haelt den Tabulator innerhalb von `container` (WCAG 2.2 SC 2.4.3).
 *
 * Ruft nichts auf, wenn die Taste keine Tabulatortaste ist oder der Behaelter
 * kein fokussierbares Element enthaelt — dann wandert der Fokus weiter, statt
 * ins Leere zu laufen.
 */
export function keepTabInside(
  container: HTMLElement | null,
  event: KeyboardEvent<HTMLElement>,
): void {
  if (event.key !== "Tab") return;
  const focusable = focusableWithin(container);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (first === undefined || last === undefined) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
