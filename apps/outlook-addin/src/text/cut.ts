/**
 * Takt — kürzen, ohne ein Zeichen zu zerteilen (T-119).
 *
 * ---------------------------------------------------------------------------
 * Der Befund
 * ---------------------------------------------------------------------------
 *
 * `suggestTitle` und `prepareNote` haben bis T-119 mit `slice(0, n)` gekürzt.
 * `slice` zählt **UTF-16-Einheiten**, und ein Emoji besteht aus zweien. Fällt
 * die Grenze zwischen sie, bleibt eine einzelne hohe Ersatzstelle stehen — kein
 * Zeichen, sondern eine Hälfte davon.
 *
 * Das ist nicht bloß unschön. Eine einzelne Ersatzstelle ist **kein
 * wohlgeformter Unicode-Text**, und das rächt sich außerhalb des Add-ins:
 *
 *  - Der Export kodiert die Notiz nach UTF-8 und dann nach Base64 (A-8.4). Für
 *    eine einzelne Ersatzstelle gibt es keine UTF-8-Folge; sie wird zu `U+FFFD`.
 *    Gemessen: Ein so gekürzter Titel kommt aus `fromBase64(toBase64(t))`
 *    **verändert** zurück. Der Hin- und Rückweg, den die Aufgabenstellung des
 *    Motors ausdrücklich verlangt, ist damit gebrochen — nicht am Motor,
 *    sondern am Wert, den das Add-in hineingibt.
 *  - Dieselbe Ersetzung geschieht beim Schreiben in SQLite. Was gespeichert
 *    wird, ist dann nicht, was im Feld stand.
 *
 * Die Tür des Dienstes fängt das **nicht** ab: `z.string().max(500)` zählt
 * ebenfalls UTF-16-Einheiten und sieht eine halbe Ersatzstelle nicht an.
 *
 * ---------------------------------------------------------------------------
 * Warum weiter in UTF-16-Einheiten **gezählt** wird
 * ---------------------------------------------------------------------------
 *
 * Weil die Tür so zählt. `titleSchema` ist `z.string().trim().min(1).max(500)`,
 * und `.max` misst `value.length` — UTF-16-Einheiten. Ein Vorschlag von 500
 * **Codepunkten** aus lauter Emoji wäre 1000 Einheiten lang und liefe in genau
 * das 422, das T-114 geschlossen hat. Gezählt wird also weiter in der Einheit
 * der Tür; **geschnitten** wird an einer Zeichengrenze. Das ist der ganze
 * Unterschied, und er kostet höchstens eine Einheit.
 *
 * ---------------------------------------------------------------------------
 * Warum Codepunkte und nicht Graphemcluster
 * ---------------------------------------------------------------------------
 *
 * Erwogen und verworfen. `Intl.Segmenter` mit `granularity: 'grapheme'` schnitte
 * so, dass auch eine Familie aus mehreren Emoji (drei Figuren, verbunden über
 * zwei `U+200D`) oder ein Buchstabe mit nachgestelltem Akzent ganz bliebe. Das
 * kostet:
 *
 *  - eine Abhängigkeit von `Intl.Segmenter` im Aufgabenbereich. Vorhanden ist
 *    sie in WebView2, aber sie ist eine Umgebungsannahme mehr, und ein
 *    Rückfallweg für ihr Fehlen wären zwei Verhalten für eine Regel.
 *  - Segmentierung ist Tabellenwissen und ändert sich mit der Unicode-Fassung.
 *    Zwei Läufe auf verschiedenen Rechnern könnten verschieden kürzen.
 *
 * Und der Gewinn ist kleiner, als er aussieht: Ein zerschnittener Graphemcluster
 * ist **wohlgeformter** Text. Er sieht an einer Stelle anders aus als gemeint;
 * er wird nicht ersetzt, nicht verändert gespeichert und nicht anders
 * exportiert. Die halbe Ersatzstelle ist ein Datenfehler, der zerschnittene
 * Cluster ein Schönheitsfehler — und beide treten erst am Zeichen 500 eines
 * Betreffs auf, den ohnehin niemand so gemeint hat.
 *
 * **Was das offenlässt, steht hier und nicht im Bericht allein:** Am Schnitt
 * kann ein `U+200D` (Verbinder) oder ein kombinierender Akzent ohne seinen
 * Grundbuchstaben zurückbleiben. Der Wert bleibt wohlgeformt, die Tür nimmt ihn
 * an, und der Benutzer sieht ihn im Feld, bevor er „Anlegen" drückt.
 */

/**
 * Kürzt auf höchstens `limit` UTF-16-Einheiten, ohne ein Zeichen zu zerteilen.
 *
 * Geprüft wird genau eine Stelle: die letzte Einheit des Schnitts. Ist sie eine
 * **hohe** Ersatzstelle (`U+D800` bis `U+DBFF`), dann steht ihre niedrige
 * Hälfte hinter der Grenze — das Paar wurde zerschnitten, und die Hälfte fällt
 * mit. Ist sie eine niedrige Ersatzstelle, ist das Paar vollständig; mehr ist
 * nicht zu prüfen.
 *
 * Das Ergebnis ist `limit` oder `limit - 1` Einheiten lang. Ein Zeichen geht
 * dabei nie verloren, das ohne den Schnitt ganz geblieben wäre.
 */
export const cutToCharacterBoundary = (value: string, limit: number): string => {
  if (value.length <= limit) return value;

  const cut = value.slice(0, limit);
  const last = cut.charCodeAt(cut.length - 1);

  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
};
