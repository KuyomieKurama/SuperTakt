import { quoteName, visibleText } from "@takt/domain";

/**
 * Takt — fremder Text, der nur als Zeichenkette möglich ist (E-063, O-AH,
 * T-124).
 *
 * Das Gegenstück zu `components/Foreign.tsx` für die Stellen, an denen kein
 * Element steht: ein `aria-label`, ein `title`, die Überschrift oder der Rumpf
 * einer Meldung, die Beschriftung eines Menüeintrags. Dort geht nur die eine
 * Hälfte — die Zeichen werden sichtbar gemacht, isoliert wird nichts. Das ist
 * kein Versehen, sondern die Grenze des Möglichen, und sie steht deshalb
 * ausgeschrieben da.
 *
 * Beide Funktionen hier sind Zusammensetzungen aus `@takt/domain` und rechnen
 * nichts nach: `visibleText` und `quoteName` liegen in
 * `packages/domain/src/characters.ts` und `packages/domain/src/enumeration.ts`.
 */

/**
 * Ein **Name** aus dem Bestand, in deutschen Anführungszeichen und ohne
 * unsichtbare Zeichen: `„Ost“`.
 *
 * Die Reihenfolge ist Inhalt: Erst wird der Name sichtbar gemacht, dann kommen
 * die Anführungszeichen darum. Umgekehrt stünde die Marke möglicherweise
 * **außerhalb** der Klammer, die sie einschließen soll — und ein
 * Richtungszeichen unmittelbar vor dem schließenden Anführungszeichen dreht
 * genau dieses mit um.
 *
 * Es gibt diese Funktion, weil `„${name}“` an über neunzig Stellen in dieser
 * Oberfläche steht. Wer sie ruft, bekommt beides zugleich: die Form aus E-058
 * Punkt 4 und die Behandlung aus E-063.
 */
export function quotedName(name: string): string {
  return quoteName(visibleText(name));
}

/**
 * Fremder Text ohne Anführungszeichen, für Sätze und Beschriftungen, die ihre
 * eigene Klammer setzen oder keine brauchen.
 *
 * Nur ein zweiter Name für `visibleText` — er steht hier, damit an der
 * Aufrufstelle zu lesen ist, **warum** die Funktion dort steht: Der Wert ist
 * fremd. `visibleText` allein liest sich wie eine Formatierung.
 */
export function foreignText(value: string): string {
  return visibleText(value);
}
