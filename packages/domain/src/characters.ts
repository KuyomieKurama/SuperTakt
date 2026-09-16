/**
 * Benutzereingaben abweisen, Vorschläge bereinigen und fremden Anzeigetext sichtbar machen.
 * Richtungszeichen können Dateiendungen trotz HTML-Escaping verfälschen; U+200B bis U+200D bleiben
 * für Emoji erlaubt.
 * Codepunkte statt unsichtbarer Zeichen im Quelltext halten die Prüfung lesbar und zustandslos.
 */

/** Beide Bereichsgrenzen sind eingeschlossen. */
export interface CodePointRange {
  readonly from: number;
  readonly to: number;
}

/**
 * Erweiterungen betreffen neue Eingaben, nicht gespeicherte Namen. Alte Namen können dadurch beim
 * unveränderten Zurücksenden unzulässig werden.
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
 * C0-Leerraum in Namen abweisen, in Anzeigetext aber als Worttrennung erhalten. Gewöhnliche
 * Leerzeichen sind erlaubt.
 */
export const CONTROL_WHITESPACE: readonly CodePointRange[] = Object.freeze([
  Object.freeze({ from: 0x0009, to: 0x000d }),
]);

/**
 * Den abgewiesenen Wert nicht in die Meldung einsetzen; seine Steuerzeichen könnten auch dort
 * wirken.
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

export function isCodePointInRanges(codePoint: number, ranges: readonly CodePointRange[]): boolean {
  for (const range of ranges) {
    if (codePoint >= range.from && codePoint <= range.to) return true;
  }
  return false;
}

/**
 * Eine Zahl, die in keinem Bereich liegen kann und auch in keinem künftigen.
 *
 * Codepunkte sind nicht negativ. `-1` ist damit dauerhaft außerhalb jeder
 * Klasse, die man hier eintragen könnte — anders als etwa `0`, das mitten in C0
 * liegt und ein unbekanntes Segment stillschweigend zu einem Steuerzeichen
 * machte.
 */
const NO_CODE_POINT = -1;

/**
 * `for...of` liefert keine leeren Segmente. Der Rückfall hält abweichende Eingaben unverändert
 * außerhalb der Zeichenklasse.
 */
function codePointOf(character: string): number {
  return character.codePointAt(0) ?? NO_CODE_POINT;
}

/**
 * Gehört dieser Codepunkt zur Klasse?
 *
 * Die Frage einzeln beantwortet, damit ein Nachweis sie über eine Menge stellen
 * kann, ohne für jedes Zeichen eine Zeichenkette zu bauen.
 */
export function isForbiddenNameCharacter(codePoint: number): boolean {
  return isCodePointInRanges(codePoint, FORBIDDEN_NAME_CHARACTERS);
}

/**
 * Über Codepunkte laufen; allein stehende UTF-16-Ersatzstellen gehören nicht zur verbotenen
 * Klasse.
 */
export function hasForbiddenNameCharacter(value: string): boolean {
  for (const character of value) {
    if (isForbiddenNameCharacter(codePointOf(character))) return true;
  }
  return false;
}

/** C0-Leerraum ist für die Anzeige ausgenommen, obwohl die Namensprüfung ihn abweist. */
export function hasHiddenCharacter(value: string): boolean {
  for (const character of value) {
    const code = codePointOf(character);
    if (isForbiddenNameCharacter(code) && !isCodePointInRanges(code, CONTROL_WHITESPACE)) return true;
  }
  return false;
}

/**
 * Nur Vorschläge bereinigen. C0-Leerraum bleibt erhalten; der Aufrufer normalisiert anschließend
 * die Wortabstände.
 */
export function dropHiddenCharacters(value: string): string {
  let out = '';
  for (const character of value) {
    const code = codePointOf(character);
    if (isForbiddenNameCharacter(code) && !isCodePointInRanges(code, CONTROL_WHITESPACE)) continue;
    out += character;
  }
  return out;
}

/**
 * C0-Leerraum wird zum Leerzeichen, andere verbotene Zeichen werden sichtbar markiert. Natürliche
 * Rechts-nach-links-Schrift bleibt erhalten.
 * Die Oberfläche muss zusätzlich die Textumgebung isolieren; Isolation allein neutralisiert keine
 * eingebetteten Richtungssteuerzeichen.
 */
export function visibleText(value: string): string {
  let out = '';
  for (const character of value) {
    const code = codePointOf(character);
    if (!isForbiddenNameCharacter(code)) {
      out += character;
      continue;
    }
    out += isCodePointInRanges(code, CONTROL_WHITESPACE) ? ' ' : HIDDEN_MARKER;
  }
  return out;
}
