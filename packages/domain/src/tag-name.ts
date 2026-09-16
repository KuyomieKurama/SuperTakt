/**
 * Namensschlüssel müssen mit der SQL-Migration übereinstimmen; deshalb ist die Unicode-Faltung
 * ausdrücklich begrenzt.
 * Keine Umschrift: „Straße“ und „Strasse“ bleiben verschieden. Bei gleichen Schlüsseln bleibt die
 * zuerst gespeicherte Schreibweise erhalten.
 */

import type { Result, TaktError } from './kernel.ts';
import { err, ok, taktError } from './kernel.ts';

/**
 * Obergrenze für einen getippten Namen. Dieselbe Zahl wie `nameSchema` im
 * Dienst und wie `tag.name` und `pool.name` in der Beschreibung der
 * Schnittstelle.
 */
export const MAX_NAME_LENGTH = 200;

/** Derselbe Wert unter seinem tagbezogenen Namen. Siehe Kopf der Datei. */
export const MAX_TAG_NAME_LENGTH = MAX_NAME_LENGTH;

/**
 * Ein geprüfter Name: die Anzeigeform und der Schlüssel, unter dem er mit
 * anderen verglichen wird.
 *
 * Beide zusammen in einem Wert, weil sie zusammen entstehen und weil ein
 * Aufrufer, der nur einen von beiden weiterreicht, den anderen später neu
 * errechnen müsste — und dann steht die Regel zweimal da.
 */
export interface NameCandidate {
  /** Wie das Ding heißt, wenn es neu angelegt wird. Schreibweise des Benutzers. */
  readonly name: string;
  /** Wonach verglichen wird. Steht bei Tags als `tag.name_key` in der Datenbank. */
  readonly key: string;
}

/** Derselbe Typ unter seinem tagbezogenen Namen. Siehe Kopf der Datei. */
export type TagNameCandidate = NameCandidate;

/** Geschlossene Bezeichnungen verhindern, dass freie Eingaben in Fehlermeldungen eingesetzt werden. */
export const NAME_SUBJECT = Object.freeze({
  tag: 'Ein Tagname',
  /**
   * Pool **und** Kanban-Spalte, denn seit E-054 ist das dieselbe Entität. Die
   * Meldung sagt deshalb „Regel“ und nicht „Pool“: Wer eine Spalte anlegt,
   * soll nicht über einen Pool belehrt werden, von dem er nichts weiß.
   */
  pool: 'Der Name einer Regel',
} as const);

export type NameSubject = (typeof NAME_SUBJECT)[keyof typeof NAME_SUBJECT];

/**
 * Zeichen, die als Leerraum gelten.
 *
 * Wörtlich die Menge, die `\s` in einem regulären Ausdruck von JavaScript
 * trifft, als Codepunkte aufgezählt — weil die Migration dieselbe Menge in SQL
 * aufzählen muss und ein `\s` dort nicht zur Verfügung steht.
 */
const WHITESPACE: ReadonlySet<number> = new Set([
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0xa0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005,
  0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff,
]);

/**
 * Faltet **ein** Zeichen. Siehe den Kopf dieser Datei zur Aufzählung.
 *
 * Getrennt und benannt, damit die Migration eine Vorlage hat, gegen die sie
 * sich messen lässt.
 */
function foldCodePoint(code: number): number {
  // A–Z
  if (code >= 0x41 && code <= 0x5a) return code + 0x20;
  // À–Þ ohne × (U+00D7): derselbe Abstand von 0x20 wie bei ASCII.
  if (code >= 0xc0 && code <= 0xde && code !== 0xd7) return code + 0x20;
  // ẞ (U+1E9E) auf ß (U+00DF). Kein Sonderfall aus Liebhaberei: Das große ẞ
  // liegt außerhalb jedes Blocks mit gleichmäßigem Abstand.
  if (code === 0x1e9e) return 0xdf;
  return code;
}

/**
 * Die Anzeigeform eines getippten Namens: NFC, jeder Leerraum ein Leerzeichen,
 * Folgen zu einem zusammengezogen, vorn und hinten nichts.
 *
 * Rein. Gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Uhr, Datei oder
 * Datenbank.
 */
export function normalizeName(raw: string): string {
  const source = raw.normalize('NFC');
  let out = '';
  for (const character of source) {
    const code = character.codePointAt(0);
    if (code !== undefined && WHITESPACE.has(code)) {
      if (out !== '' && !out.endsWith(' ')) out += ' ';
      continue;
    }
    out += character;
  }
  // Ein abschließendes Leerzeichen kann nur eines sein — die Schleife legt nie
  // zwei nebeneinander.
  return out.endsWith(' ') ? out.slice(0, -1) : out;
}

/** Der Schlüssel bestimmt die Gleichheit, nicht die angezeigte Schreibweise. */
export function nameKey(raw: string): string {
  const normalized = normalizeName(raw);
  let out = '';
  for (const character of normalized) {
    const code = character.codePointAt(0);
    out += code === undefined ? character : String.fromCodePoint(foldCodePoint(code));
  }
  return out;
}

/**
 * Ungültige Eingaben sind fachliche Fehlerwerte; `subject` bestimmt nur die Bezeichnung in der
 * Meldung.
 */
export function checkName(
  raw: unknown,
  subject: NameSubject,
): Result<NameCandidate, TaktError<'validation_error'>> {
  if (typeof raw !== 'string') {
    return err(taktError('validation_error', `${subject} muss Text sein.`));
  }

  const name = normalizeName(raw);
  if (name === '') {
    return err(taktError('validation_error', `${subject} darf nicht leer sein.`));
  }
  if (name.length > MAX_NAME_LENGTH) {
    return err(
      taktError(
        'validation_error',
        `${subject} darf höchstens ${String(MAX_NAME_LENGTH)} Zeichen lang sein.`,
      ),
    );
  }

  return ok({ name, key: nameKey(name) });
}

/**
 * Dieselben Funktionen unter ihren tagbezogenen Namen.
 *
 * Keine zweite Fassung, sondern derselbe Wert unter einem zweiten Bezeichner:
 * `normalizeTagName === normalizeName` ist wahr. Sie bleiben bestehen, weil die
 * Oberfläche und das Add-in sie so aufrufen und beide nicht in der Hoheit
 * dieser Aufgabe liegen (T-074).
 */
export const normalizeTagName = normalizeName;
export const tagNameKey = nameKey;

/** Prüft **einen** Tagnamen. `checkName` mit dem Betreff „Ein Tagname“. */
export function checkTagName(raw: unknown): Result<TagNameCandidate, TaktError<'validation_error'>> {
  return checkName(raw, NAME_SUBJECT.tag);
}

export function checkPoolName(raw: unknown): Result<NameCandidate, TaktError<'validation_error'>> {
  return checkName(raw, NAME_SUBJECT.pool);
}

/**
 * Doppelte Schlüssel vor dem Anlegen entfernen; Reihenfolge und zuerst genannte Schreibweise
 * bleiben erhalten.
 */
export function checkTagNames(
  raws: readonly unknown[],
): Result<readonly TagNameCandidate[], TaktError<'validation_error'>> {
  const seen = new Set<string>();
  const candidates: TagNameCandidate[] = [];

  for (const raw of raws) {
    const checked = checkTagName(raw);
    if (!checked.ok) return err(checked.error);
    if (seen.has(checked.value.key)) continue;
    seen.add(checked.value.key);
    candidates.push(checked.value);
  }

  return ok(candidates);
}
