/**
 * Takt — die Zeichen, die man nicht sieht und die trotzdem etwas tun (T-119).
 *
 * ---------------------------------------------------------------------------
 * Eine Klasse, drei Behandlungen
 * ---------------------------------------------------------------------------
 *
 * Dieselbe Menge Zeichen begegnet dem Add-in an drei Stellen, und sie wird an
 * jeder anders behandelt — aber nach einer Regel und nicht nach drei:
 *
 * | Wo | Was geschieht | Seit |
 * |---|---|---|
 * | Die Tür des Dienstes (`http/input.ts`) | **abweisen**, mit deutschem Satz am Feld | T-101, T-114, T-117 |
 * | Der Titelvorschlag ({@link dropHidden}) | **fallen lassen**, bevor er im Feld steht | T-114 |
 * | Die Anzeige ({@link visibleText}) | **sichtbar machen**, mit einer Marke | T-119 |
 *
 * Warum dreimal verschieden: Ein Wert, den der Benutzer eingegeben hat, wird
 * abgewiesen und nicht heimlich bereinigt (die Begründung steht ausführlich in
 * `http/input.ts`). Ein **Vorschlag** aus fremder Quelle darf bereinigt werden,
 * denn er ist keine Eingabe — er steht im Feld, bevor jemand ihn gelesen hat.
 * Und eine **Anzeige** darf gar nichts wegnehmen: Sie zeigt, was da ist. Was
 * sie nicht darf, ist ein Zeichen wirken zu lassen, das niemand sieht.
 *
 * ---------------------------------------------------------------------------
 * Warum die Anzeige das überhaupt angeht
 * ---------------------------------------------------------------------------
 *
 * `U+202E` (RLO) dreht die Anzeige des restlichen Absatzes optisch um. Ein
 * Betreff „Rechnung<RLO>gnp.exe" steht im Aufgabenbereich als
 * „Rechnung exe.png" — der Text, den der Benutzer liest, ist nicht der Text,
 * der da steht. Das Zeichen muss dafür durch keine Tür: Der Betreff wird
 * angezeigt, nicht gespeichert.
 *
 * **`unicode-bidi: isolate` allein genügt dagegen nicht**, und das ist die
 * Berichtigung eines Vorschlags aus T-114. Eine Isolierung trennt den Block von
 * seiner Umgebung — die Umkehrung kann nicht mehr in den deutschen Satz daneben
 * hineinlaufen. **Innerhalb** des Blocks wirkt ein RLO weiter: Der
 * Bidi-Algorithmus verarbeitet die Zeichen im Inhalt des Elements, und keine
 * CSS-Eigenschaft nimmt sie ihm weg (auch `bidi-override` nicht — eine
 * geschachtelte Überschreibung öffnet nach UBA X2–X5 eine neue Ebene). Beides
 * gehört also zusammen:
 *
 *  - Die **Isolierung** (`<bdi>`, `styles/addin.css`) schützt die Umgebung.
 *  - Diese Datei nimmt dem Inhalt die Zeichen, die ihn umordnen könnten.
 *
 * ---------------------------------------------------------------------------
 * Warum eine Marke und kein stilles Streichen
 * ---------------------------------------------------------------------------
 *
 * Ein ersatzlos gestrichenes Zeichen ist eine Anzeige, die etwas verschweigt —
 * der Betreff sähe im Aufgabenbereich harmlos aus und wäre es nicht. Die Marke
 * `U+FFFD` sagt: Hier steht ein Zeichen, das sich nicht zeigen lässt. Das ist
 * dieselbe Auskunft, die ein Browser bei fehlerhaft kodiertem Text gibt, und
 * sie kostet nichts: Die Zeichen sind unsichtbar; es geht kein Schriftbild
 * verloren, das jemand sehen könnte.
 */

/**
 * Die Zeichen, die weder in einer Anzeige noch in einem Titelvorschlag stehen
 * dürfen.
 *
 * Es ist **dieselbe** Klasse, die `apps/local-api/src/http/input.ts` an
 * `titleSchema` und `nameSchema` abweist — C0 ohne den Leerraum, C1, die
 * Richtungsmarken und die bidirektionalen Einbettungen und Isolate. Der
 * Aufgabenbereich ist ein Browserbündel und darf `@takt/local-api` nicht in
 * seiner Abhängigkeitsliste führen (ein Bündel, das den Dienst importieren
 * kann, importiert ihn irgendwann); die Klasse steht deshalb zweimal im Baum.
 *
 * **Dass sie dieselbe bleibt, wird gemessen und nicht zugesichert.** Abschnitt
 * 17 des Nachweispfads fragt die Tür selbst — er geht die ganze BMP durch,
 * sammelt jedes Zeichen, das sie in einem Titel abweist, und hält dieses
 * Ergebnis gegen diese Zeile. Ein handgeschriebener Vergleich hätte T-117 nicht
 * bemerkt: Die Tür bekam damals `U+061C`, `U+200E` und `U+200F` dazu, der
 * Vorschlag hier nicht, und der Betreff mit einem dieser drei Zeichen führte
 * wieder in die Sackgasse, die T-114 geschlossen hatte.
 *
 * `U+0009` bis `U+000D` stehen **nicht** darin, obwohl die Tür auch sie
 * abweist. Sie sind Leerraum und werden zu einem Leerzeichen, nicht zu nichts:
 * Aus „Störung⇥Lüftung" wird „Störung Lüftung" und nicht „StörungLüftung".
 * Siehe {@link CONTROL_WHITESPACE}.
 */
const HIDDEN_SOURCE =
  '[\\u0000-\\u0008\\u000e-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069]';

/**
 * Ein Wortlaut, zwei Ausdrücke.
 *
 * Ein Ausdruck mit `g` merkt sich in `lastIndex`, wo er zuletzt stand; er ist
 * für `replace` richtig und für `test` eine Falle. Statt zwei Zeichenklassen
 * nebeneinander zu schreiben — die Doppelung, um die es in T-114 ging — stehen
 * hier zwei Objekte über **einer** Quelle.
 *
 * Die Zeichen stehen als Escape-Folgen in einer Zeichenkette und nicht roh in
 * einem Ausdruck (T-112-H2): Ein rohes `U+0000` machte diese Datei für Git zu
 * einer Binärdatei, und ein rohes Richtungszeichen drehte ausgerechnet die
 * Zeile um, die es abfängt.
 */
// eslint-disable-next-line no-control-regex -- genau darum geht es hier
const HIDDEN_ALL = new RegExp(HIDDEN_SOURCE, 'gu');
// eslint-disable-next-line no-control-regex -- dieselbe Quelle, anderer Zweck
const HIDDEN_ANY = new RegExp(HIDDEN_SOURCE, 'u');

/** C0-Leerraum: Tabulator, Zeilenvorschub, Zeilenumbruch, vertikaler Tabulator, Seitenvorschub. */
const CONTROL_WHITESPACE = /[\u0009-\u000d]/gu;

/**
 * Was in der Anzeige an der Stelle eines unsichtbaren Zeichens steht.
 *
 * `U+FFFD` und kein eigenes Symbol: Es ist das Zeichen, das genau diese Aussage
 * trägt, es ist in jeder Schrift vorhanden, und es steht selbst nicht in der
 * Klasse — eine Marke, die wieder markiert werden müsste, wäre keine.
 */
export const HIDDEN_MARKER = '\ufffd';

/** Trägt dieser Text ein Zeichen, das die Anzeige umordnen kann? */
export const hasHidden = (value: string): boolean => HIDDEN_ANY.test(value);

/**
 * Nimmt die Zeichen **heraus** — für Werte, die gespeichert werden sollen.
 *
 * Aufrufer ist der Titelvorschlag aus dem Betreff (`office/mail.ts`). Der
 * Leerraum aus C0 bleibt stehen; dort zieht der nächste Schritt (`\s+`) ihn zu
 * einem Leerzeichen zusammen.
 */
export const dropHidden = (value: string): string => value.replace(HIDDEN_ALL, '');

/**
 * Macht die Zeichen **sichtbar** — für alles, was angezeigt wird.
 *
 * Zwei Schritte, und die Reihenfolge ist gleichgültig, weil sich die beiden
 * Mengen nicht überschneiden: Der C0-Leerraum wird zu einem Leerzeichen (ein
 * Betreff soll im Aufgabenbereich keine zweite Zeile aufmachen), alles Übrige
 * zur Marke.
 *
 * Was **nicht** passiert: Arabische, hebräische und andere von rechts nach
 * links geschriebene Schrift bleibt unangetastet. Sie ist kein Angriff, sondern
 * Text; dass sie sich nicht in den deutschen Satz daneben hineinschreibt,
 * besorgt die Isolierung (`<bdi>`) und nicht diese Funktion.
 */
export const visibleText = (value: string): string =>
  value.replace(CONTROL_WHITESPACE, ' ').replace(HIDDEN_ALL, HIDDEN_MARKER);
