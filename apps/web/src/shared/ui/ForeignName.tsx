import type { UncappedText } from "../../api/types";
import { cx } from "../../lib/cx";
import { foreignText } from "../../lib/foreign";

/**
 * Takt — ein Dateiname aus fremder Hand, **ungedeckelt** (A-19.23b, Auflage
 * A-A-93, R-27).
 *
 * ===========================================================================
 * Warum es diesen Baustein neben `Foreign` gibt
 * ===========================================================================
 *
 * `Foreign` löst eine Frage: Verändert der Inhalt die Anzeige? Antwort:
 * `visibleText` macht Richtungs- und Nullbreitenzeichen sichtbar, `<bdi>`
 * isoliert den Rest. Das ist gebaut, gemessen und trägt.
 *
 * Dieser Baustein löst die **zweite** Frage, die T-297 gestellt hat und die
 * `Foreign` nicht beantworten kann: Ist der Inhalt **vollständig** zu sehen?
 * Ein Deckel am Zeilenende verändert kein Zeichen — er nimmt dem Namen die
 * Endung, und an der Endung hängt, ob beim Bestätigen eine PDF aufgeht oder ein
 * Programm startet. `Rechnung…` ist ein anderer Satz als `Rechnung.exe`, und
 * keiner der beiden ist falsch geschrieben.
 *
 * Deshalb sind es zwei Bausteine und nicht ein Schalter an einem:
 *
 *  - Ein Schalter (`<Foreign uncapped>`) wäre eine Bitte. Man kann ihn
 *    vergessen, und das Vergessen sieht aus wie eine richtige Zeile.
 *  - Ein eigener Baustein mit eigenem Parametertyp (`UncappedText`) ist eine
 *    **Behauptung im Typ**. `scripts/proof-clamp.mjs` fragt den Übersetzer
 *    danach: Jeder Wert dieses Typs muß hier landen oder in einem Parameter,
 *    der selbst so heißt. Die Menge der Anzeigestellen wird damit gerechnet
 *    und nicht aufgezählt — dieselbe Bauart, mit der `proof:foreign` seit
 *    T-129 der abgeschriebenen Feldliste entkommen ist (E-063 Punkt 4).
 *
 * ===========================================================================
 * Was hier geschieht — und was ausdrücklich nicht
 * ===========================================================================
 *
 *  1. **`visibleText`**, über `foreignText`. Ein `UncappedText` **ist** fremder
 *     Text; die Behandlung aus E-063 fällt nicht weg, sie kommt dazu.
 *  2. **`<bdi>`**, aus demselben Grund wie in `Foreign`: Innerhalb eines
 *     isolierten Blocks wirkt ein `U+202E` weiter (UBA X2–X5), außerhalb
 *     ordnet er den deutschen Satz daneben um.
 *  3. **`.foreign-name`** — die eine Klasse, die diesen Namen umbrechen läßt
 *     statt ihn zu deckeln: `overflow-wrap: anywhere`, `white-space` in Ruhe
 *     gelassen, kein `overflow`, kein `text-overflow`. Ein Dateiname hat keine
 *     Wortgrenzen, an denen sich sinnvoll trennen ließe; `anywhere` ist
 *     dieselbe Wahl, die `.openfile__path` seit T-144 trifft, und aus demselben
 *     Grund.
 *
 * **Nicht** hier: eine Kürzung in der Mitte. Sie wäre an dieser Stelle die
 * zweite Wahrheit über denselben Namen — der Dienst kürzt beim Anlegen
 * (`shortenEmailDisplayName` in `@takt/domain`, Mitte, sichtbare Marke, Ende
 * erhalten), und was hier ankommt, ist bereits das Ergebnis. Wer hier ein
 * zweites Mal kürzte, kürzte einen schon gekürzten Namen — und die Marke in der
 * Mitte sagte dann nicht mehr, wieviel fehlt.
 *
 * **Nicht** hier: eine Breitenbegrenzung. Wer diesem Baustein von außen ein
 * `max-width` mit `overflow: hidden` gibt, hebt seine Zusage auf, ohne ein
 * Zeichen zu ändern — genau die Bauart aus R-27. `proof:clamp` liest deshalb
 * nicht nur diese Datei, sondern auch die Klassen jedes **Elternelements** an
 * jeder Aufrufstelle.
 *
 * ===========================================================================
 * Die Grenze dieser Zusage, ausgesprochen
 * ===========================================================================
 *
 * Dieser Baustein sichert die **Darstellung**, nicht die Wirkung. Was beim
 * Öffnen wirklich geschieht, entscheidet `check_file` in
 * `apps/desktop/src-tauri/src/attachment.rs`, bei jedem Aufruf. Und der hier
 * angezeigte Name ist nach A-19.23a **nicht** der Name auf der Platte: Den
 * erzeugt SuperTakt. Wer wissen will, was geöffnet wird, liest die Endung, die
 * die Rückfrage abgesetzt nennt (A-A-86) — sie kommt aus dem Pfad und nicht aus
 * diesem Namen.
 */
export function ForeignName({
  value,
  className,
}: {
  readonly value: UncappedText;
  readonly className?: string;
}) {
  return <bdi className={cx("foreign-name", className)}>{foreignText(value)}</bdi>;
}
