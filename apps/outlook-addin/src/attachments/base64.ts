/**
 * SuperTakt — Base64 im Aufgabenbereich (A-19.22, A-A-81, A-A-96).
 *
 * ---------------------------------------------------------------------------
 * Warum hier kein zweiter Kodierer steht
 * ---------------------------------------------------------------------------
 *
 * `packages/export/src/base64.ts` schreibt das Verfahren aus, und zwar aus
 * einem Grund, der hier nicht gilt: Dieselbe Zeile entsteht dort im Dienst
 * **und** in der Oberfläche, also in zwei Laufzeiten, von denen die eine
 * `Buffer` hat und die andere nicht. Der Aufgabenbereich ist ein
 * Browserbündel und hat genau eine Laufzeit. Er benutzt deshalb die
 * **Plattform** — `TextEncoder` und `btoa` —, und das ist kein zweites
 * Verfahren, sondern dasselbe Verfahren aus der Hand der Laufzeit. Dieselbe
 * Begründung wie bei `URL` in `packages/domain/src/attachment.ts`: Ein
 * Standard der Plattform ist keine Fremdbibliothek (B-18.7), und eine eigene
 * Fassung wäre die zweite Wahrheit neben der der Laufzeit.
 *
 * Eine Abhängigkeit auf `@takt/export` wäre der andere Weg. Sie ist bewusst
 * nicht gezogen: Der Aufgabenbereich führt heute `@takt/domain` und
 * `@takt/ui-tokens` und sonst nichts, und `packages/export` trägt den
 * Vorlagen-Motor der Abrechnung mit. Ein Browserbündel, das den Exportmotor
 * einbinden **kann**, bindet ihn irgendwann ein.
 *
 * ---------------------------------------------------------------------------
 * Was hier geprüft und nicht geglaubt wird
 * ---------------------------------------------------------------------------
 *
 * Was aus `getAsFileAsync` und `getAttachmentContentAsync` kommt, ist eine
 * Zeichenkette aus fremder Hand. Sie **soll** Base64 sein; ob sie es ist,
 * misst {@link normalizeBase64}. Und ihre Größe wird an der Zeichenkette
 * gerechnet — nicht an `AttachmentDetails.size`, denn das ist eine
 * Ankündigung und keine Grenze (A-A-81).
 */

/**
 * Wie viele Bytes auf einmal an `String.fromCharCode` gehen.
 *
 * Die Zerlegung ist keine Vorsicht, sondern nötig: Ein Aufruf mit einer
 * 25-MB-Datei als Argumentliste überschreitet den Aufrufstapel jeder Laufzeit.
 */
const CHUNK_BYTES = 0x8000;

/** Das Standardalphabet nach RFC 4648 Abschnitt 4, als Zulassungsprüfung. */
const BASE64_SHAPE = /^[A-Za-z0-9+/]*={0,2}$/;

/** Leerraum, den Outlook in eine Base64-Zeichenkette falten darf. */
const BASE64_WHITESPACE = /[\r\n\t ]+/g;

/** Text nach UTF-8-Bytes — über den Kodierer der Laufzeit. */
export const utf8Bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

/** Bytes nach Base64 — über `btoa` der Laufzeit, in Stücken. */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_BYTES));
  }
  return btoa(binary);
};

/** Text nach Base64 über UTF-8. */
export const utf8ToBase64 = (text: string): string => bytesToBase64(utf8Bytes(text));

/**
 * Nimmt einer fremden Base64-Zeichenkette den Leerraum und misst ihre Form.
 *
 * `null` heißt: Das ist keine Base64-Zeichenkette. Der Aufrufer macht daraus
 * einen Fehlschlag mit Namen und Grund (A-19.29) und **keine** Datei — eine
 * Zeichenkette, deren Form nicht stimmt, ist kein Inhalt, sondern ein Befund.
 */
export const normalizeBase64 = (raw: string): string | null => {
  const compact = raw.replace(BASE64_WHITESPACE, '');
  if (compact.length % 4 !== 0) return null;
  if (!BASE64_SHAPE.test(compact)) return null;
  return compact;
};

/**
 * Wie viele Bytes stecken in dieser Base64-Zeichenkette (A-A-81).
 *
 * Gerechnet, nicht dekodiert: Eine 25-MB-Datei zu dekodieren, nur um
 * festzustellen, dass sie zu groß ist, wäre genau der Speicher, den die
 * Grenze verhindern soll. Die Rechnung ist exakt, weil Base64 blockweise
 * kodiert — drei Bytes je vier Zeichen, abzüglich der Füllzeichen.
 */
export const base64ByteLength = (normalized: string): number => {
  if (normalized.length === 0) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return (normalized.length / 4) * 3 - padding;
};
