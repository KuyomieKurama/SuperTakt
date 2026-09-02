/**
 * Takt — deutsche Anzeigetexte zur Plausibilisierung der Call-Nummer (S-12, S-13).
 *
 * **Was hier steht und was nicht.** Die Regel selbst steht in
 * `packages/domain/src/call-number.ts` und wird von hier aus nur aufgerufen
 * (E-045). Diese Datei enthält ausschließlich das, was die Domäne
 * ausdrücklich nicht führt: den Satz, der dem Benutzer im Aufgabenbereich
 * angezeigt wird.
 *
 * Die Trennung ist nicht kosmetisch. Bis T-028 lag beides zusammen in
 * `plausibility.ts` — Regel und Text —, und weil die Regel dort lag, musste
 * sie dort auch gepflegt werden. Genau daraus entstand die zweite Fassung, die
 * E-045 wieder eingesammelt hat. Ein Anzeigetext darf sich ändern, ohne dass
 * jemand über eine Abrechnung nachdenkt; die Regel darf das nicht.
 *
 * Die Texte nennen den abgelehnten Wert **nicht**. Er stammt aus einer fremden
 * E-Mail (B-12.1) und wird an der einen Stelle angezeigt, die ihn als Rohwert
 * kennzeichnet, nicht in einer Meldung, die wie eine Aussage der Anwendung
 * aussieht.
 */

import type { CallNumberRejection } from '@takt/domain';
import { CALL_NUMBER_MAX_LENGTH, CALL_NUMBER_MIN_LENGTH } from '@takt/domain';

/**
 * Deutscher Anzeigetext je Ablehnungsgrund.
 *
 * Vollständig über `CallNumberRejection`: Kommt in der Domäne ein Grund hinzu,
 * schlägt hier die Übersetzung fehl und nicht erst die Oberfläche mit
 * `undefined`.
 */
export const REJECTION_LABEL: Readonly<Record<CallNumberRejection, string>> = Object.freeze({
  empty: 'Keine Call-Nummer im Text gefunden — du kannst sie eintragen.',
  too_short: `Der gefundene Wert ist kürzer als ${String(CALL_NUMBER_MIN_LENGTH)} Zeichen und wurde nicht übernommen.`,
  too_long: `Der gefundene Wert ist länger als ${String(CALL_NUMBER_MAX_LENGTH)} Zeichen und wurde nicht übernommen.`,
  forbidden_characters:
    'Der gefundene Wert enthält Zeichen, die in einer Call-Nummer nicht vorkommen — er wurde nicht übernommen.',
  formula_start:
    'Der gefundene Wert beginnt mit =, +, - oder @ und wurde nicht übernommen.',
});

/**
 * Derselbe Grund, aber für einen **eingetragenen** Wert (T-041, T-046).
 *
 * `REJECTION_LABEL` spricht über einen Wert, den das Add-in im E-Mail-Text
 * gefunden und **nicht übernommen** hat. Am Eingabefeld ist derselbe Satz
 * falsch: Dort steht der Wert ja, ein Mensch hat ihn geschrieben, und
 * „wurde nicht übernommen" wäre eine Aussage über etwas, das gar nicht
 * geschehen ist.
 *
 * Warum es diesen Satz überhaupt braucht: Bis T-046 ließ sich ein Todo mit
 * einem unplausiblen Wert anlegen. Die Duplikatsuche sucht mit demselben
 * `checkCallNumber` und findet es danach nie wieder — beim nächsten Mal legt
 * derselbe Benutzer ein zweites Todo zum selben Kundenvorgang an, und die Zeit
 * steht auf zwei Vorgängen (R-15). Der Dienst weist das jetzt ab; dieser Satz
 * sagt es, **bevor** jemand auf „Todo anlegen" drückt, statt danach.
 *
 * Der abgelehnte Wert kommt auch hier in keinem Satz vor — er steht sichtbar im
 * Feld daneben, und eine Meldung ist der falsche Ort, um ihn zu wiederholen.
 */
export const INPUT_REJECTION_LABEL: Readonly<Record<CallNumberRejection, string>> = Object.freeze({
  empty: 'Die Call-Nummer ist leer. Sie darf leer bleiben.',
  too_short: `Eine Call-Nummer braucht mindestens ${String(CALL_NUMBER_MIN_LENGTH)} Zeichen.`,
  too_long: `Eine Call-Nummer darf höchstens ${String(CALL_NUMBER_MAX_LENGTH)} Zeichen haben. Länger findet die Duplikatsuche sie nicht wieder.`,
  forbidden_characters:
    'Erlaubt sind Buchstaben, Ziffern, Punkt, Schrägstrich, Bindestrich und Unterstrich — keine Leerzeichen.',
  formula_start: 'Eine Call-Nummer darf nicht mit =, +, - oder @ beginnen.',
});
