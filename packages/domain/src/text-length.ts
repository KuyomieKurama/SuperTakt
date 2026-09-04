/**
 * Takt — wie lang ein getippter Text sein darf (T-114, T-123, T-128).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Zahl in der Domäne liegt
 * ---------------------------------------------------------------------------
 *
 * Aus demselben Grund wie die Zeichenklasse eine Datei weiter: Sie stand
 * zweimal im Baum.
 *
 * `titleSchema` im lokalen Dienst nimmt 500 Zeichen an, und der Titelvorschlag
 * des Add-ins kürzte auf 500 — mit einer eigenen Zahl, weil ein Browserbündel
 * `@takt/local-api` nicht einbinden darf. Bis T-114 waren es dort **512**, und
 * das war kein Schönheitsfehler: Ein Vorschlag, der länger ist als das, was die
 * Tür annimmt, ist ein vorbereitetes 422. Der Benutzer drückt „Anlegen" und
 * bekommt eine Abweisung für einen Text, den er nicht geschrieben hat — genau
 * die Sackgasse, gegen die auch `dropHiddenCharacters` geschrieben ist.
 *
 * T-123 hat den Zustand gemessen und richtig eingeordnet: Die beiden Zahlen
 * werden zwar gegeneinander gehalten (`proof:addin` Abschnitt 16), aber ein
 * Vergleich zweier Fassungen wird erst rot, wenn die Doppelung schon falsch ist
 * — er bewacht den Schaden, nicht die Ursache (E-063 Punkt 5). Also liegt die
 * Zahl hier, an **einer** Stelle, und beide Seiten lesen sie.
 *
 * **Und sie darf hier liegen.** Die Domäne kennt weder HTTP noch SQL (E-001).
 * Eine Obergrenze für einen Titel ist keins von beidem: Sie ist die Antwort auf
 * die Frage, wie lang ein Titel sein darf, den Takt anzeigt, in einen Satz
 * einsetzt und in eine Abrechnungsdatei schreibt. Was hier **nicht** steht, ist
 * die Bindung an zod — die bleibt im Dienst (`http/input.ts`), weil sie eine
 * Eigenschaft der Tür ist und nicht der Regel.
 *
 * ---------------------------------------------------------------------------
 * Was hier ausdrücklich **nicht** steht
 * ---------------------------------------------------------------------------
 *
 *  - **`MAX_NAME_LENGTH` (200)** für Tag-, Ordner- und Poolnamen. Sie steht in
 *    `tag-name.ts`, unmittelbar neben der Prüfung, die sie durchsetzt. Sie hier
 *    ein zweites Mal hinzuschreiben, wäre genau der Fehler, den diese Datei
 *    behebt. Wer beide Zahlen zusammen sehen will, liest sie beide aus
 *    `@takt/domain`.
 *  - **Die Deckel des Add-ins** (`MAX_TAKEOVER_CHARACTERS` für den übernommenen
 *    Vermerk, die Kurzfassung in der Vorschau). Sie stehen heute in
 *    `apps/outlook-addin` und in `routes/addin/schema.ts`; ob sie hierher
 *    gehören, ist eine eigene Frage und nicht diese (T-128, Bericht).
 *
 * Rein: Diese Datei enthält Zahlen und importiert nichts.
 */

/**
 * Obergrenze für den **Titel** eines Todos, in Zeichen.
 *
 * Maßgeblich für drei Stellen zugleich:
 *
 * | Wo | Was damit geschieht |
 * |---|---|
 * | `titleSchema` (`apps/local-api/src/http/input.ts`) | ein längerer Titel wird mit 422 abgewiesen |
 * | `POST /addin/todos` (dieselbe Prüfung, T-114) | dasselbe |
 * | `suggestTitle` (`apps/outlook-addin/src/office/mail.ts`) | der Vorschlag aus dem Betreff wird hier gekürzt |
 *
 * **Zeichen und nicht UTF-16-Einheiten** — jedenfalls dort, wo gekürzt wird:
 * `suggestTitle` schneidet an einer Zeichengrenze (`cutToCharacterBoundary`),
 * damit ein Emoji an der Grenze nicht halbiert wird und als Ersatzstelle
 * stehenbleibt. Die Tür zählt mit `z.string().max(...)`, also in
 * UTF-16-Einheiten; ein Titel aus 500 Emoji wird deshalb abgewiesen, obwohl er
 * 500 Zeichen hat. Das ist bekannt, gewollt und die vorsichtigere von beiden
 * Zählweisen: Sie weist zu viel ab, nie zu wenig.
 *
 * Warum 500 und nicht 512: 512 war die Zahl, die vor T-114 im Add-in stand, und
 * sie war größer als die der Tür. 500 ist die Zahl der Tür, sie ist rund, und
 * ein Titel ist eine Zeile und kein Vermerk — dafür gibt es `textSchema`.
 */
export const MAX_TITLE_CHARACTERS = 500;
