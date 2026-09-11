/**
 * SuperTakt — was die Duplikatfläche sagt (A-10.9, R-15, Befunde Y-03/Y-04).
 *
 * Diese Datei enthält **keine** Anzeige und trotzdem die ganze Entscheidung
 * darüber, was in der Duplikatfläche steht. Der Grund ist der Nachweis: Der
 * Aufgabenbereich lässt sich hier nicht rendern (kein JSX in Node), eine reine
 * Funktion aber schon. Was in `DuplicateOffer.tsx` bliebe, wäre eine
 * Fallunterscheidung, die niemand ausführt — und genau die Sorte Zusage, gegen
 * die dieser Bestand seit T-247 gebaut wird.
 *
 * Drei Fälle, und der dritte ist der Befund:
 *
 *  1. **`found`** — es gibt Treffer. Die Fläche nennt sie: Titel und, falls
 *     erledigt, die Wortmarke „Erledigt". Nur **nennen**: kein Knopf, kein
 *     Verweis, keine Vorauswahl. A-10.9 verbietet eine **Handlung** am
 *     gefundenen Todo, keine **Angabe** darüber — und eine anonyme Warnung
 *     überliest jeder (Y-03).
 *  2. **`none`** — es wurde gesucht und nichts gefunden. Dieser Fall war bis
 *     T-247-3 stumm, und für eine Vorlesehilfe war „geprüft, nichts gefunden"
 *     damit von „noch nicht geprüft" nicht zu unterscheiden. Er bekommt
 *     **einen** Satz, keine Hinweisfläche: Die Bestätigung soll hörbar sein,
 *     nicht laut (Y-04).
 *  3. **`idle`** — es wurde (noch) nicht gesucht: leeres Feld, unplausibler
 *     Wert, der Dienst antwortet nicht, oder er hat die Suche abgelehnt. Die
 *     Fläche bleibt **leer** — aber sie bleibt. Die Live-Region steht
 *     dauerhaft im Baum, sonst meldet keine Vorlesehilfe ihren Inhalt
 *     (dieselbe Bauart und derselbe Grund wie bei `Field`, T-158).
 *
 * Der Unterschied zwischen 2 und 3 ist der einzige Zustand, den die Fläche
 * selbst nicht ausrechnen kann: „nichts gefunden" und „gar nicht gesucht"
 * sehen von hier aus beide wie eine leere Trefferliste aus. Deshalb reicht der
 * Aufgabenbereich die **gesuchte** Call-Nummer herein, und deshalb ist sie
 * `null`, wenn nicht gesucht wurde.
 */

import type { OfferDescription } from './rule.ts';

/** Ein genannter Treffer — Angabe, keine Handlung. */
export interface NoticeItem {
  readonly todoId: string;
  readonly title: string;
  readonly isDone: boolean;
}

export type DuplicateNotice =
  | { readonly kind: 'idle' }
  | { readonly kind: 'none'; readonly callNumber: string }
  | {
      readonly kind: 'found';
      /**
       * Die Call-Nummer für die Überschrift — oder `null` bei mehreren
       * Treffern.
       *
       * Bei mehr als einem Treffer nennt die Überschrift die Anzahl statt der
       * Nummer: Die Nummer ist dann für alle dieselbe und stünde in jeder
       * Zeile noch einmal.
       */
      readonly callNumber: string | null;
      readonly count: number;
      readonly items: readonly NoticeItem[];
    };

/**
 * Welcher der drei Fälle liegt vor?
 *
 * `checkedCallNumber` ist die Nummer, mit der der Dienst **tatsächlich**
 * gesucht hat, sonst `null`. Ein leerer oder unplausibler Wert erreicht diese
 * Funktion also nicht als „nichts gefunden", sondern als `idle` — es wurde
 * keine Abfrage gestellt (Riegel 1 aus `rule.ts`).
 */
export const duplicateNotice = (
  offers: readonly OfferDescription[],
  checkedCallNumber: string | null,
): DuplicateNotice => {
  if (offers.length > 0) {
    const first = offers[0];
    return {
      kind: 'found',
      callNumber: offers.length === 1 && first !== undefined ? first.callNumber : null,
      count: offers.length,
      items: offers.map(({ todoId, title, isDone }) => ({ todoId, title, isDone })),
    };
  }

  if (checkedCallNumber !== null && checkedCallNumber.length > 0) {
    return { kind: 'none', callNumber: checkedCallNumber };
  }

  return { kind: 'idle' };
};
