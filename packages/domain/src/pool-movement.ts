/** Der Wortlaut wird von Hauptanwendung und Add-in gemeinsam verwendet und zeichengenau getestet. */

import { enumerateNames } from './enumeration.ts';

/**
 * `appears` beschreibt den Zustand danach, `enters` und `leaves` die Änderung. Die Listen werden
 * vor der Textbildung berechnet.
 */
export interface PoolMovement {
  /** Pools, in denen das Todo **nach** der Handlung steht. */
  readonly appears: readonly string[];
  /** Pools, in die dieselbe Handlung es **hineinbewegt** (T-084). */
  readonly enters: readonly string[];
  /** Pools, aus denen dieselbe Handlung es **entfernt** (E-056). */
  readonly leaves: readonly string[];
}

/**
 * Vor der Handlung angekündigt oder danach berichtet.
 *
 * Beide Fassungen stehen in **einer** Funktion, weil sie dieselbe Auskunft
 * geben müssen. Zwei Textbausteine an zwei Stellen wären zwei Gelegenheiten,
 * Verschiedenes zu behaupten — das ist Befund C-03 aus T-025, und er hat
 * einmal gereicht.
 */
export type PoolMovementTense = 'future' | 'past';

/**
 * `reopen` beschreibt die Rückkehr mit `appears`; `booking` bezeichnet jede neutrale Änderung mit
 * `enters` und `leaves`, auch manuelles Erledigen.
 */
export type PoolMovementOccasion = 'reopen' | 'booking';

/**
 * Der Anlass muss ausdrücklich angegeben werden. Beim Wiederöffnen gibt es immer einen Hinweis;
 * neutrale Änderungen ohne Bewegung liefern null.
 */
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: 'reopen',
): string;
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: 'booking',
): string | null;
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: PoolMovementOccasion,
): string | null;
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: PoolMovementOccasion,
): string | null {
  const { appears, enters, leaves } = movement;

  if (occasion === 'reopen') {
    // Vier Fälle. „wieder" steht in jedem, in dem etwas erscheint: Das Todo war
    // erledigt und in keinem dieser Pools zu sehen.
    if (appears.length === 0 && leaves.length === 0) {
      return tense === 'future'
        ? 'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool und in keiner Spalte.'
        : 'Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte.';
    }

    if (appears.length === 0) {
      return tense === 'future'
        ? `Es verschwindet dann aus ${enumerateNames(leaves)} und erscheint sonst nirgends.`
        : `Es ist aus ${enumerateNames(leaves)} verschwunden und erscheint sonst nirgends.`;
    }

    if (leaves.length === 0) {
      return tense === 'future'
        ? `Es erscheint dann wieder in ${enumerateNames(appears)}.`
        : `Es ist zurück in ${enumerateNames(appears)}.`;
    }

    return tense === 'future'
      ? `Es erscheint dann wieder in ${enumerateNames(appears)} und verschwindet aus ${enumerateNames(leaves)}.`
      : `Es ist zurück in ${enumerateNames(appears)} und aus ${enumerateNames(leaves)} verschwunden.`;
  }

  // Keine Bewegung, kein Satz. Diese Zeile ist die Auflage aus E-056 und steht
  // vor allem anderen, damit kein Zweig darunter sie umgehen kann.
  if (enters.length === 0 && leaves.length === 0) return null;

  if (leaves.length === 0) {
    return tense === 'future'
      ? `Es erscheint dann in ${enumerateNames(enters)}.`
      : `Es steht jetzt in ${enumerateNames(enters)}.`;
  }

  if (enters.length === 0) {
    return tense === 'future'
      ? `Es verschwindet dann aus ${enumerateNames(leaves)}.`
      : `Es ist aus ${enumerateNames(leaves)} verschwunden.`;
  }

  return tense === 'future'
    ? `Es erscheint dann in ${enumerateNames(enters)} und verschwindet aus ${enumerateNames(leaves)}.`
    : `Es steht jetzt in ${enumerateNames(enters)} und ist aus ${enumerateNames(leaves)} verschwunden.`;
}
