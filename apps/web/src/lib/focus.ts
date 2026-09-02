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
