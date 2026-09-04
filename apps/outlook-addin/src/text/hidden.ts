/**
 * Takt — die Zeichen, die man nicht sieht und die trotzdem etwas tun
 * (T-114, T-117, T-119, T-122, T-123, E-063).
 *
 * ---------------------------------------------------------------------------
 * Diese Datei führt die Klasse nicht mehr, sie liest sie
 * ---------------------------------------------------------------------------
 *
 * Bis T-122 stand die Zeichenklasse zweimal im Baum: einmal an der Tür des
 * Dienstes und einmal hier. Sie ist auseinandergelaufen — T-117 hat die Tür um
 * die drei Richtungsmarken `U+061C`, `U+200E` und `U+200F` erweitert, die
 * Abschrift hier zog nicht nach, und ein Betreff mit einer dieser Marken belegte
 * das Titelfeld wieder mit einem Vorschlag, den der Dienst mit 422 abweist
 * (T-119). Seit T-122 liegt sie an **einer** Stelle:
 * `packages/domain/src/characters.ts`. Seit T-123 liest das Add-in sie dort.
 *
 * Was hier steht, sind deshalb **keine Zeichen und keine Ausdrücke**, sondern
 * vier Namen. Die Begründungen — warum genau diese Zeichen, warum Codepunkte
 * statt eines regulären Ausdrucks, warum der C0-Leerraum ein eigener Fall ist —
 * stehen an der Quelle und sind bewußt nicht hierher kopiert: Ein Kommentar, der
 * eine Regel zweitschriftlich erklärt, veraltet genauso still wie die Regel
 * selbst.
 *
 * ---------------------------------------------------------------------------
 * Warum die Namen andere sind
 * ---------------------------------------------------------------------------
 *
 * `dropHidden` statt `dropHiddenCharacters`, `hasHidden` statt
 * `hasHiddenCharacter`. Die Domäne benennt ihre Ausfuhren aus der Sicht der
 * ganzen Anwendung, das Add-in nennt sie kurz an seinen Aufrufstellen. Die
 * Umbenennung ist der einzige Inhalt dieser Datei — sie kopiert nichts und kann
 * nichts anderes tun, als weiterzureichen. Der Nachweispfad prüft das nicht als
 * Verhalten, sondern als **Gleichheit der Objekte**: `dropHidden` *ist*
 * `dropHiddenCharacters` und verhält sich nicht nur so (Abschnitt 17).
 *
 * ---------------------------------------------------------------------------
 * Eine Klasse, drei Behandlungen — und welche das Add-in wo nimmt (E-063)
 * ---------------------------------------------------------------------------
 *
 * | Wo | Was geschieht | Hier |
 * |---|---|---|
 * | Die Tür des Dienstes | **abweisen**, mit deutschem Satz am Feld | nicht im Add-in |
 * | Der Titelvorschlag aus dem Betreff (`office/mail.ts`) | **fallen lassen** | {@link dropHidden} |
 * | Jede Anzeige fremden Textes (`ui/Primitives.tsx`, `Foreign`) | **sichtbar machen** | {@link visibleText} |
 *
 * Die beiden Behandlungen des Add-ins sind **nicht** vertauschbar, und das ist
 * die Stelle, an der E-063 Punkt 2 hängt:
 *
 *  - Ein **Vorschlag** steht im Eingabefeld, bevor jemand ihn gelesen hat. Eine
 *    Marke darin wäre ein Zeichen, das der Benutzer von Hand wieder löschen muß,
 *    bevor er anlegen kann — der Vorschlag läßt deshalb fallen.
 *  - Eine **Anzeige** darf nichts wegnehmen. Ein ersatzlos gestrichenes Zeichen
 *    ergäbe eine Fläche, die verschweigt, daß etwas da war; sie markiert deshalb
 *    und streicht nicht.
 *
 * ---------------------------------------------------------------------------
 * Und was das Add-in selbst dazu tun muß
 * ---------------------------------------------------------------------------
 *
 * `visibleText` nimmt dem **Inhalt** die Zeichen, die ihn von innen umordnen.
 * Daß fremder Text den deutschen Satz **daneben** nicht umordnet, besorgt die
 * Isolierung (`<bdi>`, `unicode-bidi: isolate` in `styles/addin.css`) — keine
 * CSS-Eigenschaft nimmt einem Text ein `U+202E` weg, und innerhalb eines
 * isolierten Blocks wirkt es weiter (UBA X2–X5). Beide Hälften gehören zusammen;
 * das ist die Berichtigung des Vorschlags aus T-114 und steht ausführlich an
 * `visibleText` in der Domäne.
 */

export {
  HIDDEN_MARKER,
  dropHiddenCharacters as dropHidden,
  hasHiddenCharacter as hasHidden,
  visibleText,
} from '@takt/domain';
