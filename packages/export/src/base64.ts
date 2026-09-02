/**
 * Takt — Base64 über UTF-8 (A-8.4, A-8.9).
 *
 * `Notiz` geht als Base64 an das Abrechnungstool. Die Eingabe ist UTF-8, und
 * genau daran scheitern die üblichen Umsetzungen: `btoa` nimmt nur Latin-1 und
 * wirft bei „Ä"; `Buffer.from` gibt es in der Oberfläche nicht, wo dieselbe
 * Zeile für die Vorschau entsteht (R-17). Beide Wege wären in einer der beiden
 * Laufzeiten falsch oder gar nicht vorhanden.
 *
 * Deshalb steht die Kodierung hier ausgeschrieben: erst Text nach UTF-8-Bytes,
 * dann Bytes nach Base64. Das ist ein Kodierverfahren, keine Fachregel — es
 * gibt nichts, was dadurch doppelt beschrieben würde.
 *
 * A-8.9 ausdrücklich: Base64 ist eine Kodierung, keine Verschlüsselung. Die
 * Datei enthält Kundendaten im Klartextäquivalent.
 */

/** Das Standardalphabet nach RFC 4648, Abschnitt 4. Kein URL-sicheres. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Umkehrung des Alphabets. Einmal beim Laden gebaut, nicht je Aufruf. */
const REVERSE: ReadonlyMap<string, number> = new Map(
  [...ALPHABET].map((character, index) => [character, index] as const),
);

/**
 * U+FFFD REPLACEMENT CHARACTER.
 *
 * Ein alleinstehendes Surrogat ist kein gültiger Codepoint und hat keine
 * UTF-8-Darstellung. Es wird ersetzt statt durchgereicht — dasselbe Verhalten
 * wie `TextEncoder`. Durchreichen ergäbe WTF-8, das der Empfänger nicht lesen
 * kann.
 */
const REPLACEMENT = 0xfffd;

/**
 * Text nach UTF-8-Bytes.
 *
 * `for...of` läuft über Codepoints, nicht über UTF-16-Einheiten. Ein Emoji ist
 * damit **ein** Durchlauf und wird als eine Vier-Byte-Folge kodiert. Eine
 * Schleife über `charCodeAt` würde es in zwei Surrogate zerlegen und daraus
 * sechs Bytes machen — die Zeichenlängenprüfung in TP-B64-05 fängt genau das.
 */
const toUtf8Bytes = (text: string): number[] => {
  const bytes: number[] = [];

  for (const character of text) {
    const point = character.codePointAt(0);
    // `codePointAt` ist auf einer nicht leeren Zeichenkette immer belegt; der
    // Zweig steht für den Übersetzer, nicht für die Laufzeit.
    const codePoint = point === undefined || (point >= 0xd800 && point <= 0xdfff) ? REPLACEMENT : point;

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }

  return bytes;
};

/** Wie viele Folgebytes eine Startbyte-Klasse verlangt, und was sie beisteuert. */
const leadingByte = (byte: number): { readonly bits: number; readonly following: number } | null => {
  if (byte < 0x80) return { bits: byte, following: 0 };
  if (byte >= 0xc2 && byte <= 0xdf) return { bits: byte & 0x1f, following: 1 };
  if (byte >= 0xe0 && byte <= 0xef) return { bits: byte & 0x0f, following: 2 };
  if (byte >= 0xf0 && byte <= 0xf4) return { bits: byte & 0x07, following: 3 };
  return null;
};

/** UTF-8-Bytes zurück nach Text. Ungültige Folgen werden zu U+FFFD. */
const fromUtf8Bytes = (bytes: readonly number[]): string => {
  let text = '';
  let index = 0;

  while (index < bytes.length) {
    const lead = leadingByte(bytes[index] ?? 0);
    index += 1;

    if (lead === null) {
      text += '�';
      continue;
    }

    let codePoint = lead.bits;
    let valid = true;

    for (let step = 0; step < lead.following; step += 1) {
      const next = bytes[index];
      index += 1;
      if (next === undefined || (next & 0xc0) !== 0x80) {
        valid = false;
        break;
      }
      codePoint = (codePoint << 6) | (next & 0x3f);
    }

    text += valid && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : '�';
  }

  return text;
};

/**
 * Kodiert Text als Base64 über seine UTF-8-Bytes (A-8.4).
 *
 * Der leere Text ergibt die leere Zeichenkette — nicht `"="`, nicht `"null"`.
 * Ob eine leere Notiz überhaupt exportiert werden darf, entscheidet nicht diese
 * Funktion, sondern E-034 in `render.ts`.
 */
export const toBase64 = (text: string): string => {
  const bytes = toUtf8Bytes(text);
  let encoded = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1];
    const third = bytes[index + 2];

    encoded += ALPHABET.charAt(first >> 2);
    encoded += ALPHABET.charAt(((first & 0x03) << 4) | ((second ?? 0) >> 4));
    encoded += second === undefined ? '=' : ALPHABET.charAt(((second & 0x0f) << 2) | ((third ?? 0) >> 6));
    encoded += third === undefined ? '=' : ALPHABET.charAt(third & 0x3f);
  }

  return encoded;
};

/**
 * Dekodiert Base64 zurück nach Text.
 *
 * Gebraucht wird der Rückweg für den Nachweis, dass die Kodierung Umlaute und
 * Emoji unbeschadet überträgt, und für die Vorschau, die eine kodierte Notiz
 * wieder lesbar zeigt. In den Export selbst geht er nicht ein.
 *
 * Ein Zeichen außerhalb des Alphabets ist ein Programmierfehler, kein
 * fachlicher Fehlschlag — deshalb ein Wurf und kein `Result`. Das Zeichen
 * selbst steht bewusst nicht in der Meldung: Der Text kann Kundendaten
 * enthalten (A-8.9, E-009).
 */
export const fromBase64 = (encoded: string): string => {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const character of encoded) {
    if (character === '=') continue;

    const value = REVERSE.get(character);
    if (value === undefined) {
      throw new Error('Ungültige Base64-Eingabe: ein Zeichen liegt außerhalb des Alphabets.');
    }

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }

  return fromUtf8Bytes(bytes);
};
