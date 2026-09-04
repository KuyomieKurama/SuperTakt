/**
 * Takt — die Zeichen, die man nicht sieht und die trotzdem etwas tun
 * (R-3a H-2, E-063, T-114, T-117, T-119, T-122).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei in der Domäne liegt
 * ---------------------------------------------------------------------------
 *
 * Weil die Klasse bis T-122 an zwei Stellen stand und zweimal auseinanderlief.
 *
 * T-117 hat sie an der Tür des Dienstes um die drei Richtungsmarken erweitert
 * (`U+061C`, `U+200E`, `U+200F`). Der Titelvorschlag im Add-in trug seine eigene
 * Abschrift und zog nicht nach — die Sackgasse, die T-114 geschlossen hatte,
 * stand für drei Zeichen wieder offen: Ein Betreff mit einer dieser Marken
 * belegte das Titelfeld mit einem Vorschlag, den der Dienst mit 422 abweist, an
 * einem Feld, an dem nichts Falsches zu sehen ist. Der Nachweis, der genau das
 * verhindern sollte, prüfte gegen eine **abgeschriebene** Liste und blieb grün
 * (T-119, E-063 Punkt 4).
 *
 * Also liegt sie hier, an **einer** Stelle, und Dienst und Add-in lesen sie,
 * statt sie zu kopieren. Das ist dieselbe Begründung wie bei der Rundung
 * (E-008), der Call-Nummer (E-045) und dem Bewegungssatz (E-058): Eine Regel,
 * die an mehreren Flächen gleich gelten muß, hat genau eine Quelle.
 *
 * **Und sie darf hier liegen.** Die Domäne kennt weder HTTP noch SQL (E-001).
 * Eine Zeichenklasse ist keins von beidem: Sie ist die Antwort auf die Frage,
 * welche Zeichen in einem Namen stehen dürfen, den Takt anzeigt, in einen Satz
 * einsetzt und in eine Abrechnungsdatei schreibt. Was hier **nicht** steht, ist
 * die Bindung an zod — die bleibt im Dienst (`http/input.ts`), weil sie eine
 * Eigenschaft der Tür ist und nicht der Regel.
 *
 * ---------------------------------------------------------------------------
 * Die drei Bauarten, und warum es genau diese sind
 * ---------------------------------------------------------------------------
 *
 *  - **C0 und C1** (`U+0000`–`U+001F`, `U+007F`–`U+009F`). Steuerzeichen sind
 *    das, womit man eine Protokollzeile oder eine Exportzelle von innen
 *    aufbricht.
 *  - **Bidirektionale Formatierungszeichen**, alle drei Bauarten: die
 *    **Einbettungen und Überschreibungen** (`U+202A`–`U+202E`), die **Isolate**
 *    (`U+2066`–`U+2069`) und die **Marken** (`U+200E` LRM, `U+200F` RLM,
 *    `U+061C` ALM). Sie stehen in keinem geschriebenen Namen und verändern, wie
 *    der Rest der Zeile aussieht. React maskiert HTML; ein `U+202E` macht es
 *    **nicht** unschädlich, weil es kein Markup ist, sondern Text mit Wirkung
 *    auf die Darstellung. Der Betreff „Rechnung<RLO>gnp.exe“ steht auf dem
 *    Bildschirm als „Rechnung exe.png“.
 *
 * **Nicht** erfaßt und ausdrücklich erlaubt bleiben die Zeichen ohne
 * Richtungswirkung in derselben Nachbarschaft: `U+200B` bis `U+200D`. Das letzte
 * davon (ZWJ) hält zusammengesetzte Emoji zusammen — es abzuweisen hieße, einem
 * Titel mit einem Familien-Emoji die Annahme zu verweigern, und dieser Wächter
 * ist gegen Richtungszeichen gerichtet und nicht gegen Emoji.
 *
 * ---------------------------------------------------------------------------
 * Eine Klasse, drei Behandlungen (E-063)
 * ---------------------------------------------------------------------------
 *
 * | Wo | Was geschieht | Funktion |
 * |---|---|---|
 * | Die Tür des Dienstes, die Eingabe des Benutzers | **abweisen** | {@link hasForbiddenNameCharacter} |
 * | Ein Vorschlag aus fremder Quelle (Betreff einer E-Mail) | **fallen lassen** | {@link dropHiddenCharacters} |
 * | Die Anzeige fremden Textes | **sichtbar machen** | {@link visibleText} |
 *
 * Das sind drei Behandlungen nach **einer** Regel und nicht drei Regeln: Ein
 * Wert, den der Benutzer eingegeben hat, wird abgewiesen und nicht heimlich
 * bereinigt — ihn stillschweigend zu ändern hieße, ihm seine eigene Eingabe
 * unterzuschieben. Ein **Vorschlag** darf bereinigt werden, denn er ist keine
 * Eingabe; er steht im Feld, bevor jemand ihn gelesen hat. Und eine **Anzeige**
 * darf gar nichts wegnehmen: Sie zeigt, was da ist. Was sie nicht darf, ist ein
 * Zeichen wirken zu lassen, das niemand sieht.
 *
 * ---------------------------------------------------------------------------
 * Warum Codepunkte und kein regulärer Ausdruck
 * ---------------------------------------------------------------------------
 *
 * Die Klasse steht unten als **Zahlenbereiche** und nicht als Zeichenklasse in
 * einem `RegExp`. Drei Gründe, und jeder hat schon einmal Arbeit gekostet:
 *
 *  1. Ein Ausdruck mit `g` merkt sich in `lastIndex`, wo er zuletzt stand. Er
 *     ist für `replace` richtig und für `test` eine Falle — ein geteiltes
 *     Objekt gäbe abwechselnd `true` und `false` auf denselben Wert. Wer die
 *     Klasse teilt, müßte also entweder zwei Ausdrücke oder eine Fabrik teilen;
 *     Zahlen haben das Problem nicht.
 *  2. Die Zeichen als Escape-Folgen in einer Zeichenkette zu schreiben ist die
 *     zweitbeste Fassung (T-112-H2): Ein rohes `U+0000` machte diese Datei für
 *     Git zu einer Binärdatei, und ein rohes Richtungszeichen drehte
 *     ausgerechnet die Zeile um, die es abfängt. Zahlen sind gar keine Zeichen.
 *  3. Eine Liste von Bereichen läßt sich **lesen** — von einem Nachweis, von
 *     einer Migration, von einer Beschreibung. Ein Ausdruck läßt sich nur
 *     ausführen oder abschreiben, und Abschreiben ist der Fehler, gegen den
 *     diese Datei geschrieben ist.
 *
 * Rein: gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Uhr, Datei, Netz oder
 * Datenbank. Diese Datei importiert nichts.
 */

/**
 * Ein **geschlossener** Bereich von Codepunkten: `from` und `to` gehören beide
 * dazu.
 *
 * Felder mit Namen statt eines Paares `[number, number]`: Zwei Zahlen
 * nebeneinander lassen sich vertauschen, und ein vertauschter Bereich trifft
 * nichts — die Klasse wäre still leer, und jede Prüfung darüber grün. Dieselbe
 * Begründung wie bei `PoolMovement` in `pool-movement.ts`.
 */
export interface CodePointRange {
  readonly from: number;
  readonly to: number;
}

/**
 * Die Zeichen, die in einem **Namen** nichts zu suchen haben.
 *
 * Diese Liste ist die maßgebliche Fassung. `titleSchema` und `nameSchema` im
 * lokalen Dienst weisen genau sie ab, der Titelvorschlag des Add-ins läßt genau
 * sie fallen, und der Windows-Benutzername wird gegen genau sie geprüft
 * (T-122). Wer sie erweitert, erweitert alle vier Stellen zugleich — das ist
 * der ganze Zweck.
 *
 * **Was eine Erweiterung kostet, steht dabei:** Die Prüfung sitzt am Eingang und
 * nicht am Bestand. Ein Name, der vor ihr angelegt wurde, bleibt lesbar und
 * löschbar, aber ein `PATCH`, der ihn **unverändert** zurückschickt, wird
 * abgewiesen — der Benutzer sieht seinen eigenen, ungeänderten Namen als
 * unzulässige Eingabe. Jede Erweiterung vergrößert diesen Altbestand. Das wird
 * genannt und nicht still migriert (T-101 Annahme 6): Eine Migration, die
 * vorhandene Namen umschriebe, wäre dieselbe stille Änderung der
 * Benutzereingabe, die diese Klasse an ihrem eigenen Eingang ablehnt.
 */
export const FORBIDDEN_NAME_CHARACTERS: readonly CodePointRange[] = Object.freeze([
  /** C0 — einschließlich Tabulator und Zeilenumbruch, siehe {@link CONTROL_WHITESPACE}. */
  Object.freeze({ from: 0x0000, to: 0x001f }),
  /** DEL und C1. */
  Object.freeze({ from: 0x007f, to: 0x009f }),
  /** ALM — arabische Richtungsmarke (seit T-117). */
  Object.freeze({ from: 0x061c, to: 0x061c }),
  /** LRM und RLM — die beiden übrigen Richtungsmarken (seit T-117). */
  Object.freeze({ from: 0x200e, to: 0x200f }),
  /** Einbettungen und Überschreibungen: LRE, RLE, PDF, LRO, RLO. */
  Object.freeze({ from: 0x202a, to: 0x202e }),
  /** Isolate: LRI, RLI, FSI, PDI. */
  Object.freeze({ from: 0x2066, to: 0x2069 }),
]);

/**
 * Der Leerraum aus C0: Tabulator, Zeilenvorschub, vertikaler Tabulator,
 * Seitenvorschub, Wagenrücklauf.
 *
 * Er ist eine **Teilmenge** von {@link FORBIDDEN_NAME_CHARACTERS} — die Tür
 * weist ihn ab wie jedes andere Steuerzeichen. Für die beiden anderen
 * Behandlungen ist er trotzdem ein eigener Fall: Er trennt Wörter. Aus
 * „Störung⇥Lüftung“ wird ein Leerzeichen und nicht nichts, sonst stünde dort
 * „StörungLüftung“ und der Benutzer hielte es für einen Tippfehler des
 * Absenders.
 *
 * `U+0020` steht **nicht** darin und auch nicht in der Klasse darüber: Ein
 * gewöhnliches Leerzeichen darf in einem Namen stehen.
 */
export const CONTROL_WHITESPACE: readonly CodePointRange[] = Object.freeze([
  Object.freeze({ from: 0x0009, to: 0x000d }),
]);

/**
 * Der Satz, mit dem eine Tür einen Namen mit solchen Zeichen abweist.
 *
 * Er steht hier und nicht am Schema, weil er die Klasse benennt und mit ihr
 * wandern muß: Käme eine vierte Bauart dazu, die weder Steuer- noch
 * Richtungszeichen ist, wäre der Satz falsch. Wortgleich seit T-101; die
 * Erweiterung um die Marken in T-117 hat ihn nicht berührt, weil er sie schon
 * mitmeinte.
 *
 * **Der abgewiesene Wert steht nicht darin.** Er stammt möglicherweise aus einer
 * fremden E-Mail (B-4.3 Punkt 5) — und ein Text, der ein solches Zeichen
 * wörtlich wiedergibt, richtet in der Fehlermeldung genau den Schaden an, den er
 * verhindern soll.
 */
export const FORBIDDEN_NAME_CHARACTER_MESSAGE =
  'Steuerzeichen und Richtungszeichen sind in einem Namen nicht erlaubt.';

/**
 * Was in der Anzeige an der Stelle eines unsichtbaren Zeichens steht (E-063
 * Punkt 2).
 *
 * `U+FFFD` und kein eigenes Symbol: Es ist das Zeichen, das genau diese Aussage
 * trägt, es ist in jeder Schrift vorhanden, und es steht selbst nicht in der
 * Klasse — eine Marke, die wieder markiert werden müßte, wäre keine.
 */
export const HIDDEN_MARKER = '\ufffd';

/** Liegt der Codepunkt in einem der Bereiche? */
function inRanges(codePoint: number, ranges: readonly CodePointRange[]): boolean {
  for (const range of ranges) {
    if (codePoint >= range.from && codePoint <= range.to) return true;
  }
  return false;
}

/**
 * Gehört dieser Codepunkt zur Klasse?
 *
 * Die Frage einzeln beantwortet, damit ein Nachweis sie über eine Menge stellen
 * kann, ohne für jedes Zeichen eine Zeichenkette zu bauen.
 */
export function isForbiddenNameCharacter(codePoint: number): boolean {
  return inRanges(codePoint, FORBIDDEN_NAME_CHARACTERS);
}

/**
 * **Abweisen.** Trägt dieser Text ein Zeichen aus der Klasse?
 *
 * Die Prüfung hinter `titleSchema`, `nameSchema` und der zweiten `stdin`-Zeile
 * mit dem Windows-Benutzernamen.
 *
 * Es wird über **Codepunkte** gelaufen und nicht über UTF-16-Einheiten. Für die
 * Klasse selbst macht das keinen Unterschied — sie liegt vollständig in der BMP
 * —, wohl aber für eine einzeln stehende Ersatzstelle: Sie ist kein Zeichen der
 * Klasse und wird hier auch nicht dazu.
 */
export function hasForbiddenNameCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code !== undefined && isForbiddenNameCharacter(code)) return true;
  }
  return false;
}

/**
 * **Trägt dieser Text ein Zeichen, das eine Anzeige umordnen kann?**
 *
 * Die engere Frage als {@link hasForbiddenNameCharacter}: Der Leerraum aus C0
 * (Tabulator, Zeilenumbruch) ist ausgenommen. Er wird an einer Tür abgewiesen,
 * aber er ordnet nichts um — er trennt Wörter, und eine Anzeige, die ihn
 * anzeigt, zeigt nichts Falsches.
 *
 * Es ist genau die Menge, auf der {@link dropHiddenCharacters} und
 * {@link visibleText} etwas tun. Beide Funktionen liefern deshalb Text, für den
 * diese Frage `false` ergibt — das ist die Zusicherung, gegen die sich messen
 * läßt, ob die Bereinigung vollständig war.
 */
export function hasHiddenCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code === undefined) continue;
    if (isForbiddenNameCharacter(code) && !inRanges(code, CONTROL_WHITESPACE)) return true;
  }
  return false;
}

/**
 * **Fallen lassen** — für einen Vorschlag aus fremder Quelle, der gleich in
 * einem Eingabefeld steht (E-063 Punkt 3).
 *
 * Aufrufer ist der Titelvorschlag aus dem Betreff einer E-Mail. Ein Vorschlag,
 * den die Tür anschließend abweist, ist eine Sackgasse: Das Feld ist gefüllt,
 * der Benutzer sieht nichts Falsches, und das Speichern scheitert (T-114).
 *
 * Der Leerraum aus C0 bleibt **stehen** (siehe {@link CONTROL_WHITESPACE}); ihn
 * zu einem Leerzeichen zusammenzuziehen ist der nächste Schritt beim Aufrufer
 * und nicht die Sache dieser Funktion — sie nimmt weg, sie formt nicht um.
 */
export function dropHiddenCharacters(value: string): string {
  let out = '';
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code !== undefined && isForbiddenNameCharacter(code) && !inRanges(code, CONTROL_WHITESPACE)) {
      continue;
    }
    out += character;
  }
  return out;
}

/**
 * **Sichtbar machen** — für alles, was angezeigt wird (E-063 Punkte 1 und 2).
 *
 * Zwei Umformungen: Der Leerraum aus C0 wird zu einem Leerzeichen (ein Betreff
 * soll in einer Zeile keine zweite aufmachen), jedes andere Zeichen der Klasse
 * zur Marke {@link HIDDEN_MARKER}.
 *
 * **Die Länge bleibt erhalten**, weil jedes Zeichen genau ein Zeichen wird. Eine
 * Anzeige, die kürzt, verschweigt zweierlei — daß etwas da war und wo.
 *
 * Was **nicht** geschieht: Arabische, hebräische und andere von rechts nach
 * links geschriebene Schrift bleibt unangetastet. Sie ist kein Angriff, sondern
 * Text; sie zu entfernen oder zu markieren wäre eine Anzeige, die einen Teil
 * ihrer Benutzer nicht mehr lesen kann. Daß sie den Satz daneben nicht umordnet,
 * besorgt die Isolierung der Oberfläche (`<bdi>`, `unicode-bidi: isolate`) und
 * nicht diese Funktion. Beide Hälften gehören zusammen: Die Isolierung schützt
 * die **Umgebung**, diese Funktion nimmt dem **Inhalt** die Zeichen, die ihn von
 * innen umordnen (UBA X2–X5 — innerhalb eines isolierten Blocks wirkt ein RLO
 * weiter, und keine CSS-Eigenschaft nimmt ihn ihm weg; das ist die Berichtigung
 * aus T-119).
 */
export function visibleText(value: string): string {
  let out = '';
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code === undefined || !isForbiddenNameCharacter(code)) {
      out += character;
      continue;
    }
    out += inRanges(code, CONTROL_WHITESPACE) ? ' ' : HIDDEN_MARKER;
  }
  return out;
}
