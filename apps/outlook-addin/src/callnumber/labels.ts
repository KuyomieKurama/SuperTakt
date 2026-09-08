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
 * Der Satz für „im Text steht keine Call-Nummer" — **einmal** (E-078 Punkt 1).
 *
 * Er stand bis T-169 zweimal: hier als `REJECTION_LABEL.empty` und wörtlich
 * gleich noch einmal in `TaskPane.tsx#describeDetection` für den Fall
 * `no_match`. Zwei Fassungen derselben Aussage laufen auseinander, sobald
 * jemand eine davon ändert — und diese hier ist der Fall, an dem es zuerst
 * auffällt: Beide Male sagt der Bereich dasselbe, und beide Male ist der
 * Ausgang derselbe (der Benutzer trägt die Nummer von Hand ein).
 *
 * **Ohne Anrede** (E-080 Punkt 4). „du kannst sie eintragen" und „Sie können
 * sie eintragen" sagen beide dasselbe wie „sie lässt sich eintragen", und die
 * dritte Fassung ist die kürzeste. Das ist keine Ausweichbewegung vor der
 * Entscheidung, sondern ihr vierter Punkt.
 */
export const NO_CALL_NUMBER_FOUND =
  'Keine Call-Nummer im Text gefunden — sie lässt sich eintragen.';

/**
 * Der Ausweg, wenn die Erkennung gar nicht erst gelaufen ist — **einmal**
 * (T-182, E-078 Punkt 1).
 *
 * Er stand bis T-182 zweimal in `TaskPane.tsx#describeDetection`, in zwei
 * Zweigen, die einander ausschließen: einmal mit „hier" (`pattern_invalid`)
 * und einmal ohne (`unavailable`). Zwei Fassungen einer Aussage laufen
 * auseinander, sobald jemand eine davon anfasst — genau der Befund, den
 * {@link NO_CALL_NUMBER_FOUND} eine Welle früher behoben hat, nur eine
 * Funktion weiter unten. Dass beide Zweige nie gleichzeitig erscheinen, macht
 * es nicht besser: Der Benutzer liest dann dieselbe Auskunft in zwei
 * Schreibweisen, je nachdem, woran die Erkennung gescheitert ist.
 *
 * **Ohne Anrede** (E-080 Punkt 4), wie sein Geschwister darüber.
 *
 * Er ist ein **B** nach dem Raster aus `docs/design/textbestand.md` Abschnitt 2
 * und fällt deshalb nicht: Er sagt, was zu tun ist, wenn Takt die Nummer nicht
 * liefern konnte. Im Aufgabenbereich gibt es keine zweite Fläche, auf der sich
 * das nachlesen ließe (AB-1).
 */
export const CALL_NUMBER_BY_HAND = 'Die Call-Nummer lässt sich von Hand eintragen.';

/**
 * Deutscher Anzeigetext je Ablehnungsgrund.
 *
 * Vollständig über `CallNumberRejection`: Kommt in der Domäne ein Grund hinzu,
 * schlägt hier die Übersetzung fehl und nicht erst die Oberfläche mit
 * `undefined`.
 */
export const REJECTION_LABEL: Readonly<Record<CallNumberRejection, string>> = Object.freeze({
  empty: NO_CALL_NUMBER_FOUND,
  too_short: `Der gefundene Wert ist kürzer als ${String(CALL_NUMBER_MIN_LENGTH)} Zeichen und wurde nicht übernommen.`,
  too_long: `Der gefundene Wert ist länger als ${String(CALL_NUMBER_MAX_LENGTH)} Zeichen und wurde nicht übernommen.`,
  forbidden_characters:
    'Der gefundene Wert enthält Zeichen, die in einer Call-Nummer nicht vorkommen — er wurde nicht übernommen.',
  formula_start:
    'Der gefundene Wert beginnt mit =, +, - oder @ und wurde nicht übernommen.',
});

/*
 * Hier stand bis T-190 `INPUT_REJECTION_LABEL` — die fünf Sätze für einen
 * **eingetragenen** Wert, der als Call-Nummer nicht taugt (T-041, T-046).
 *
 * Sie stehen jetzt als `CALL_NUMBER_INPUT_MESSAGE` in
 * `packages/domain/src/call-number.ts` und werden von hier aus nicht mehr
 * geführt. Der Grund ist nicht Sparsamkeit, sondern ein Befund: Dieselben fünf
 * Sätze standen ein zweites Mal an der Tür des Dienstes
 * (`apps/local-api/src/routes/addin/index.ts`), und beide Flächen liegen in
 * verschiedenen Paketen mit verschiedenen Eigentümern. Zwei davon waren bereits
 * auseinandergelaufen, als T-188 nachgemessen hat, und keiner der beiden
 * Eigentümer konnte es bemerken.
 *
 * Das ist **kein** Widerruf von E-045. E-045 trennt Regel und Anzeigetext,
 * damit ein Satz sich ändern kann, ohne dass jemand über eine Abrechnung
 * nachdenkt. Diese Trennung trägt, solange der Satz **an einer** Fläche steht.
 * Wo zwei Flächen denselben Satz sagen müssen, ist die Domäne der einzige Ort,
 * den beide kennen — `poolMovementSentence` und `DUE_DATE_MESSAGE` machen es
 * vor. Von T-190 gilt bei den zwei auseinandergelaufenen Sätzen die Fassung
 * dieser Datei: `empty` ohne Anrede (E-080 Punkt 4) und `too_long` mit dem
 * Nachsatz über die Duplikatsuche (E-078 Punkt 1 — ein Satz, der eine **Folge**
 * benennt, fällt nicht; die Folge ist R-15).
 *
 * `REJECTION_LABEL` und {@link NO_CALL_NUMBER_FOUND} bleiben hier. Sie sprechen
 * über einen Wert, den das Add-in in einer E-Mail **gefunden und nicht
 * übernommen** hat — diese Lage gibt es an der Tür nicht, und ihr Gegenstück
 * dort (`REJECTION_TEXT`) sagt mit Absicht etwas anderes.
 */
