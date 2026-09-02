/**
 * Takt — was ein **doppelter** Tagname ist (A-4.1, A-4.5, T-058).
 *
 * Diese Datei ist der einzige Ort im Projekt, an dem die Regel beschrieben ist.
 * Weder der SQLite-Adapter noch der lokale Dienst noch die Oberfläche noch das
 * Add-in führen eine eigene Fassung. Wer eine zweite anlegt, bekommt zwei Tags
 * „backend“, die sich für den Benutzer nicht unterscheiden.
 *
 * ---------------------------------------------------------------------------
 * Die Regel in Worten
 * ---------------------------------------------------------------------------
 *
 * Zwei Tagnamen bezeichnen **dasselbe** Tag, wenn ihr Vergleichsschlüssel
 * gleich ist. Der Schlüssel entsteht in vier Schritten, und jeder beantwortet
 * genau eine der drei Fragen aus der Aufgabenstellung:
 *
 *  1. **Unicode-Zusammensetzung (NFC).** „ä“ als ein Zeichen und „a“ mit
 *     nachgestelltem Trema sehen gleich aus und sind es danach auch.
 *  2. **Leerzeichen.** Jede Art Leerraum — Tabulator, Zeilenumbruch, geschütztes
 *     Leerzeichen — wird zum gewöhnlichen Leerzeichen, Folgen davon werden zu
 *     einem, und vorn und hinten fällt es weg. `„ backend “`, `„backend“` und
 *     `„back  end“` gegen `„back end“`: die ersten beiden sind gleich, die
 *     letzten beiden auch.
 *  3. **Groß- und Kleinschreibung.** „Backend“ und „backend“ sind **dasselbe
 *     Tag.** Ebenso „Änderung“ und „änderung“ — die Faltung deckt die
 *     lateinischen Buchstaben mit Akzent und Umlaut mit ab, nicht nur A–Z.
 *  4. **Sonst nichts.** Keine Umschrift, keine Entfernung von Bindestrichen,
 *     kein „ß“ zu „ss“. „Straße“ und „Strasse“ bleiben zwei Tags, und „Ä“ und
 *     „AE“ ebenfalls. Das ist eine Entscheidung und keine Auslassung: Eine
 *     Umschrift würde Namen zusammenwerfen, die der Benutzer unterschieden
 *     hat, und ließe sich nicht rückgängig machen.
 *
 * **Der angezeigte Name behält seine Schreibweise.** Wer „Backend“ tippt und
 * damit ein bestehendes „backend“ trifft, bekommt „backend“ — das zuerst
 * angelegte Tag gewinnt. Der Schlüssel entscheidet über die Gleichheit, nicht
 * über die Darstellung.
 *
 * ---------------------------------------------------------------------------
 * Warum die Faltung aufgezählt ist und nicht `toLowerCase()` heißt
 * ---------------------------------------------------------------------------
 *
 * Der Schlüssel steht als Spalte `tag.name_key` in der Datenbank und trägt dort
 * einen eindeutigen Index. Damit ist „kein doppeltes Tag“ eine Zusage des
 * Schemas und nicht eine Hoffnung des Adapters — auch gegen zwei gleichzeitige
 * Anfragen (T-058).
 *
 * Das geht nur, wenn die **Migration** denselben Schlüssel errechnet wie diese
 * Datei. SQLite kennt keine Unicode-Faltung: sein `lower()` fasst A–Z an und
 * sonst nichts. `toLowerCase()` in JavaScript fasst dagegen jedes Schriftsystem
 * an. Beides nebeneinander ergäbe zwei Regeln, von denen die Datenbank die
 * schwächere erzwingt — und genau dort entstünde das doppelte Tag, das der
 * Index verhindern soll.
 *
 * Deshalb ist die Faltung hier **aufgezählt**: ASCII A–Z, der lateinische
 * Ergänzungsblock U+00C0–U+00DE ohne das Malzeichen, und das große ẞ. Genau
 * diese Aufzählung bildet `0008_tag_name_key.up.sql` mit einer rekursiven
 * Abfrage Zeichen für Zeichen nach; `pnpm --filter @takt/local-api proof:tags`
 * misst die Gleichheit beider Fassungen, statt sie zu behaupten.
 *
 * Der Preis steht ausdrücklich da: Griechische, kyrillische und türkische
 * Großbuchstaben werden **nicht** gefaltet. „ΑΛΦΑ“ und „αλφα“ sind zwei Tags.
 * Für eine deutschsprachige Anwendung ist das der richtige Tausch — eine Regel,
 * die überall gleich gilt, gegen eine, die weiter reicht und an einer Stelle
 * anders ausfällt.
 */

import type { Result, TaktError } from './kernel.ts';
import { err, ok, taktError } from './kernel.ts';

/**
 * Obergrenze für einen Tagnamen. Dieselbe Zahl wie `nameSchema` im Dienst und
 * wie `tag.name` in der Beschreibung der Schnittstelle.
 */
export const MAX_TAG_NAME_LENGTH = 200;

/**
 * Ein geprüfter Tagname: die Anzeigeform und der Schlüssel, unter dem er mit
 * anderen verglichen wird.
 *
 * Beide zusammen in einem Wert, weil sie zusammen entstehen und weil ein
 * Aufrufer, der nur einen von beiden weiterreicht, den anderen später neu
 * errechnen müsste — und dann steht die Regel zweimal da.
 */
export interface TagNameCandidate {
  /** Wie das Tag heißt, wenn es neu angelegt wird. Schreibweise des Benutzers. */
  readonly name: string;
  /** Wonach verglichen wird. Steht als `tag.name_key` in der Datenbank. */
  readonly key: string;
}

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
 * Die Anzeigeform eines Tagnamens: NFC, jeder Leerraum ein Leerzeichen, Folgen
 * zu einem zusammengezogen, vorn und hinten nichts.
 *
 * Rein. Gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Uhr, Datei oder
 * Datenbank.
 */
export function normalizeTagName(raw: string): string {
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

/**
 * Der Vergleichsschlüssel eines Tagnamens.
 *
 * `normalizeTagName` und darauf die aufgezählte Faltung. Das Ergebnis steht als
 * `tag.name_key` in der Datenbank und trägt dort den eindeutigen Index.
 */
export function tagNameKey(raw: string): string {
  const normalized = normalizeTagName(raw);
  let out = '';
  for (const character of normalized) {
    const code = character.codePointAt(0);
    out += code === undefined ? character : String.fromCodePoint(foldCodePoint(code));
  }
  return out;
}

/**
 * Prüft **einen** Tagnamen und liefert Anzeigeform und Schlüssel.
 *
 * Der Fehlschlag ist ein Wert und kein Wurf: Ein leerer Name ist eine Eingabe
 * des Benutzers und kein Programmierfehler.
 */
export function checkTagName(raw: unknown): Result<TagNameCandidate, TaktError<'validation_error'>> {
  if (typeof raw !== 'string') {
    return err(taktError('validation_error', 'Ein Tagname muss Text sein.'));
  }

  const name = normalizeTagName(raw);
  if (name === '') {
    return err(taktError('validation_error', 'Ein Tagname darf nicht leer sein.'));
  }
  if (name.length > MAX_TAG_NAME_LENGTH) {
    return err(
      taktError(
        'validation_error',
        `Ein Tagname darf höchstens ${String(MAX_TAG_NAME_LENGTH)} Zeichen lang sein.`,
      ),
    );
  }

  return ok({ name, key: tagNameKey(name) });
}

/**
 * Prüft eine **Liste** von Tagnamen und wirft Doppelte innerhalb der Liste weg.
 *
 * Das ist der Fall, den man ohne diese Funktion übersieht: Wer in einem Zug ein
 * Todo mit den Tags „Backend“ und „backend“ anlegt, meint ein Tag und nicht
 * zwei. Ohne Entdoppelung liefe die zweite Anlage in den eindeutigen Index —
 * und der Benutzer bekäme für eine Eingabe, die er für richtig hält, die
 * Meldung „Name bereits vergeben“.
 *
 * Die Reihenfolge bleibt die der Eingabe; von zwei gleichen Schlüsseln gewinnt
 * die zuerst genannte Schreibweise.
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
