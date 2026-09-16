/**
 * Dienst und Add-in prüfen dieselbe Regel unabhängig; der Dienst darf dem Aufrufer nicht
 * vertrauen.
 * Prüfausdrücke ohne `g` verwenden, damit wiederholte Aufrufe nicht von `lastIndex` abhängen.
 */

/** Kürzeste zulässige Länge nach Beschneiden (B-4.3 Punkt 3). */
export const CALL_NUMBER_MIN_LENGTH = 3;

/** Längste zulässige Länge nach Beschneiden (B-4.3 Punkt 3). */
export const CALL_NUMBER_MAX_LENGTH = 64;

/**
 * Den gesamten Wert prüfen; der Zeichenvorrat verhindert unter anderem Formeleinstiege und
 * Steuerzeichen.
 */
const ALLOWED_SHAPE = /^[A-Za-z0-9._/-]+$/;

/**
 * Formeleinstiege gesondert sperren, auch wenn Teile davon bereits am Zeichenvorrat scheitern. Ein
 * Bindestrich ist nur innerhalb der Nummer zulässig.
 */
const FORMULA_STARTERS: ReadonlySet<string> = new Set(['=', '+', '-', '@']);

/** Warum ein Wert nicht als Call-Nummer taugt. Englisch, wie jeder Schlüssel. */
export type CallNumberRejection =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'forbidden_characters'
  | 'formula_start';

/**
 * Den geprüften, getrimmten Wert weiterverwenden, damit Speicherung und Duplikatsuche denselben
 * Text vergleichen.
 */
export type CallNumberCheck =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: CallNumberRejection };

/**
 * Vor der Prüfung trimmen, damit reiner Leerraum als `empty` und nicht als unerlaubtes Zeichen
 * gemeldet wird.
 */
export const checkCallNumber = (value: unknown): CallNumberCheck => {
  if (typeof value !== 'string') {
    return { ok: false, reason: 'empty' };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (trimmed.length < CALL_NUMBER_MIN_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }
  if (trimmed.length > CALL_NUMBER_MAX_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  if (!ALLOWED_SHAPE.test(trimmed)) {
    return { ok: false, reason: 'forbidden_characters' };
  }
  if (FORMULA_STARTERS.has(trimmed.charAt(0))) {
    return { ok: false, reason: 'formula_start' };
  }

  return { ok: true, value: trimmed };
};

/**
 * Mit einer unplausiblen Call-Nummer gar nicht suchen; „nicht gesucht“ ist keine Aussage über
 * fehlende Duplikate.
 */
export const mayLookUpDuplicates = (value: unknown): boolean => checkCallNumber(value).ok;

/**
 * Gemeinsame Meldungen für eingegebene Call-Nummern. Den abgewiesenen Fremdwert nicht einsetzen;
 * Meldungen zur Erkennung aus E-Mails bleiben getrennt.
 */
export const CALL_NUMBER_INPUT_MESSAGE: Readonly<Record<CallNumberRejection, string>> =
  Object.freeze({
    empty: 'Die Call-Nummer ist leer. Sie darf leer bleiben.',
    too_short: `Eine Call-Nummer braucht mindestens ${String(CALL_NUMBER_MIN_LENGTH)} Zeichen.`,
    too_long: `Eine Call-Nummer darf höchstens ${String(CALL_NUMBER_MAX_LENGTH)} Zeichen haben. Länger findet die Duplikatsuche sie nicht wieder.`,
    forbidden_characters:
      'Erlaubt sind Buchstaben, Ziffern, Punkt, Schrägstrich, Bindestrich und Unterstrich — keine Leerzeichen.',
    formula_start: 'Eine Call-Nummer darf nicht mit =, +, - oder @ beginnen.',
  });

/**
 * Leere Werte zu null vereinheitlichen, damit sie nicht als gleiche Call-Nummer gelten. Die
 * Plausibilität entscheidet der Anwendungsfall.
 */
export const normalizeCallNumber = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

/** Vorgabe für die Call-Erkennung beim Super-Productivity-Import. */
export const DEFAULT_IMPORT_CALL_PATTERN = String.raw`call[\s#:_-]*(\d{5,6})`;

/** Fixed, bounded baseline; custom expressions run only in an isolated worker. */
export function baseCallNumber(subject: string): string | null {
  const preferred = /call[\s#:_-]*(\d{5,})(?![A-Za-z\d])/i.exec(subject)
    ?? /(?<![A-Za-z\d])(\d{5,})[\s#:_-]*call/i.exec(subject);
  const match = preferred ?? /(?<![A-Za-z\d])(\d{5,})(?![A-Za-z\d])/.exec(subject);
  const value = match?.[1];
  if (value === undefined) return null;
  const checked = checkCallNumber(value);
  return checked.ok ? checked.value : null;
}
