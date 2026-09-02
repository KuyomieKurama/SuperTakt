/**
 * Takt — was ein **doppelter Name** ist (A-4.1, A-4.5, A-3.1, T-058, T-074).
 *
 * Diese Datei ist der einzige Ort im Projekt, an dem die Regel beschrieben ist.
 * Weder der SQLite-Adapter noch der lokale Dienst noch die Oberfläche noch das
 * Add-in führen eine eigene Fassung. Wer eine zweite anlegt, bekommt zwei Tags
 * „backend“, die sich für den Benutzer nicht unterscheiden.
 *
 * ---------------------------------------------------------------------------
 * Seit T-074 gilt sie auch für Pools und Kanban-Spalten
 * ---------------------------------------------------------------------------
 *
 * Die Regel war ursprünglich für Tagnamen aufgeschrieben, aber nichts an ihr
 * ist tagspezifisch: Sie beantwortet die Frage „bezeichnen zwei getippte Namen
 * dasselbe Ding?“, und die stellt sich bei einem Pool — seit E-054 zugleich
 * eine Kanban-Spalte — Wort für Wort genauso. Bis T-074 hatte der Pool
 * stattdessen `ux_pool_name` mit `COLLATE NOCASE`, also eine **zweite,
 * schwächere** Regel: `Backend` und `backend` fielen zusammen, `Änderung` und
 * `änderung` nicht, `back  end` und `back end` auch nicht.
 *
 * Deshalb tragen die Funktionen unten seit T-074 zwei Namen. Die neutralen
 * (`normalizeName`, `nameKey`, `checkName`) sind die Sache selbst; die
 * tagbezogenen (`normalizeTagName`, `tagNameKey`, `checkTagName`) bleiben
 * bestehen, weil die Oberfläche (`apps/web/src/components/TagInput.tsx`) und
 * das Add-in (`apps/outlook-addin/src/tags/new-name.ts`) sie unter diesem Namen
 * aufrufen. Es sind **dieselben** Funktionen und nicht zwei Fassungen — ein
 * `===`-Vergleich der Bezeichner ist wahr.
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

/**
 * Wovon in einer Fehlermeldung die Rede ist.
 *
 * Eine deutsche Nominalphrase im Nominativ, die vor „muss Text sein“, „darf
 * nicht leer sein“ und „darf höchstens … Zeichen lang sein“ passt. Sie steht
 * hier als Aufzählung und nicht als freier Text am Aufrufer: Die Meldungen der
 * Domäne sind Konstanten, und ein Aufrufer, der seinen eigenen Satz einsetzen
 * dürfte, wäre die Stelle, an der eines Tages eine Eingabe darin landet
 * (B-2.4).
 */
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

/**
 * Der Vergleichsschlüssel eines getippten Namens.
 *
 * `normalizeName` und darauf die aufgezählte Faltung. Das Ergebnis steht bei
 * Tags als `tag.name_key` in der Datenbank und trägt dort den eindeutigen
 * Index. Bei Pools und Kanban-Spalten steht es nirgends: Dort vergleicht der
 * Anwendungsfall die Schlüssel der wenigen vorhandenen Regeln, siehe
 * `usecases/structure.ts` und die Begründung im Bericht zu T-074.
 */
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
 * Prüft **einen** getippten Namen und liefert Anzeigeform und Schlüssel.
 *
 * Der Fehlschlag ist ein Wert und kein Wurf: Ein leerer Name ist eine Eingabe
 * des Benutzers und kein Programmierfehler.
 *
 * `subject` sagt, wovon in der Meldung die Rede ist — siehe `NAME_SUBJECT`. Es
 * ist der einzige Unterschied zwischen der Prüfung eines Tagnamens und der
 * eines Regelnamens; alles andere daran ist dieselbe Regel.
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

/**
 * Prüft **einen** Regelnamen — Pool oder Kanban-Spalte, seit E-054 dasselbe.
 *
 * `checkName` mit dem Betreff „Der Name einer Regel“. Es gibt hier keine
 * eigene Normalisierung und keine eigene Faltung: Die Frage, wann zwei Namen
 * derselbe sind, ist bei einer Regel dieselbe wie bei einem Tag, und eine
 * zweite Antwort darauf wäre genau die Doppelung, gegen die diese Datei
 * geschrieben ist.
 */
export function checkPoolName(raw: unknown): Result<NameCandidate, TaktError<'validation_error'>> {
  return checkName(raw, NAME_SUBJECT.pool);
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
