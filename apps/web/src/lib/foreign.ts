import { quoteName, visibleText } from "@takt/domain";

import type { ForeignText } from "../api/types";

/**
 * Takt — fremder Text, der nur als Zeichenkette möglich ist (E-063, O-AH,
 * T-124, T-129).
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
 *
 * **Beide nehmen `ForeignText` und geben `string` zurück** (T-129). Das ist
 * keine Zierde, sondern der Vertrag, an dem `scripts/proof-foreign.mjs` sie
 * erkennt: Eine Behandlung ist alles, was fremden Text annimmt und
 * gewöhnlichen zurückgibt. Der Nachweis führt deshalb keine Liste von
 * Funktionsnamen — wer eine vierte Behandlung baut und sie so deklariert, wird
 * ohne Änderung am Nachweis anerkannt. Wer eine dieser beiden auf `string`
 * verbreitert, macht ihn rot, weil ihre Aufrufstellen dann wieder als roh
 * gelten.
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
export function quotedName(name: ForeignText): string {
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
export function foreignText(value: ForeignText): string {
  return visibleText(value);
}

/* ==================================================================== */
/* Die Grenze zum Wert ohne Typ (O-AT, T-133)                           */
/* ==================================================================== */

/**
 * Fremder Text aus einem Wert, über den der Typ nichts sagt. `null`, wenn
 * dort kein Text steht.
 *
 * ---------------------------------------------------------------------------
 * Wofür es diese Funktion gibt, obwohl sie zur Laufzeit fast nichts tut
 * ---------------------------------------------------------------------------
 *
 * `ExportTemplate.definition` ist `unknown`, und das ist richtig so: Das
 * Vorlagenformat gehört dem Motor in `packages/export`, nicht der Schnittstelle
 * (siehe `lib/exportTemplateModel.ts`). Aus diesem `unknown` packt die
 * Oberfläche aber **Feldnamen** aus, die ein Benutzer geschrieben hat und die
 * angezeigt werden — im Editor, in der Abweichungsliste und in der Vorschau der
 * Exportzeile, also in der Ansicht, an der jemand prüft, was er gleich
 * abrechnet.
 *
 * Ein `typeof x === "string"` an dieser Stelle macht daraus **gewöhnlichen**
 * Text: Die Herkunft, die T-129 in den Typ gehoben hat, entsteht dort gar nicht
 * erst. Für die Prüfungen 2 bis 4 in `scripts/proof-foreign.mjs` ist so ein
 * Name unsichtbar — sie können nur finden, was als fremd bekannt ist. Genau
 * diese Bauart benennt E-063 Punkt 5: Ein Nachweis, der erst rot wird, wenn der
 * Schaden schon da ist, bewacht den Schaden und nicht die Ursache.
 *
 * Deshalb steht die Grenze hier, an **einer** Stelle, und sie ist erklärt:
 * `unknown` hinein, fremder Text heraus. Abschnitt 6 des Nachweises erkennt sie
 * an ihrer **Signatur** — nicht an ihrem Namen — und verlangt, dass kein
 * anderer Weg von einem `unknown` zu einer Zeichenkette führt. Wer einen
 * zweiten baut, macht ihn rot.
 *
 * **Sie prüft nicht, ob der Text zulässig ist.** Das tut der Aufrufer: Ein
 * leerer Name ist ein Fehler der Vorlage, kein Fall für diese Funktion. Hier
 * wird ausschließlich die Frage „ist das überhaupt Text?" beantwortet — und die
 * Antwort trägt ihre Herkunft.
 */
export function foreignTextFrom(value: unknown): ForeignText | null {
  return typeof value === "string" ? value : null;
}
