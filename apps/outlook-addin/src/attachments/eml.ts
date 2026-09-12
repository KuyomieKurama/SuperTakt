/**
 * SuperTakt — die **nachgebaute** Nachricht (A-19.22a, A-19.22b, A-19.22c,
 * A-A-96, A-A-97, Bedrohungsmodell 39.3.0).
 *
 * ===========================================================================
 * Der schwerste Punkt dieses Add-ins, und er ist neu in diesem Bestand
 * ===========================================================================
 *
 * Bisher hat SuperTakt fremden Text **angezeigt**, **gespeichert** und
 * **weitergereicht**. Hier **erzeugt** er zum ersten Mal aus fremdem Text ein
 * Format, das ein anderes Programm interpretiert — und zwar Outlook, mit
 * einem Doppelklick des Benutzers.
 *
 * Wer eine `.eml` durch Aneinanderreihen von Zeichenketten baut, gibt dem
 * Absender die Feder:
 *
 *  1. Ein Betreff mit `CR` oder `LF` schreibt **eigene Kopfzeilen**.
 *  2. Wer eigene Kopfzeilen schreiben kann, schreibt `Content-Type:
 *     multipart/mixed` mit eigener Trennmarke.
 *  3. In den so entstandenen Teil passt ein **Anhang** — den Outlook beim
 *     Öffnen anbietet, den der Benutzer doppelklicken kann, und der an
 *     A-19.23, an A-A-78 und an jeder Größengrenze **vollständig vorbeiführt**,
 *     weil er nie ein Anhang in deren Sinne war, sondern Text in einer Datei,
 *     die wir selbst geschrieben haben.
 *
 * ===========================================================================
 * Die Abwehr ist die Kodierung, nicht die Suche
 * ===========================================================================
 *
 * Eine Liste verbotener Zeichenfolgen wäre hier der alte Fehler in neuer Lage.
 * Statt dessen drei Bauentscheidungen, von denen jede einzelne die
 * Einschleusung strukturell unmöglich macht:
 *
 *  1. **Jeder Kopfzeilenwert aus fremdem Text wird nach RFC 2047 als
 *     `=?UTF-8?B?…?=` kodiert.** Das Ausgabealphabet einer solchen Kodierung
 *     ist `[A-Za-z0-9+/=]` samt den Klammerzeichen, die wir selbst setzen. Ein
 *     `CR`, ein `LF`, ein `:` am Zeilenanfang kann darin nicht **entstehen**;
 *     es ist nicht herausgefiltert, es hat keinen Weg hinein.
 *  2. **Der Rumpf wird base64-kodiert.** Was der Absender schreibt, wird zu
 *     `[A-Za-z0-9+/=]` und kann keine Struktur mehr tragen.
 *  3. **Es gibt keine Trennmarke, weil es keinen zweiten Teil gibt.** Die
 *     nachgebaute Nachricht ist `text/plain`, einteilig. A-A-96 verlangt, die
 *     Trennmarke zu **erzeugen** statt sie festzuschreiben; das ist die
 *     Antwort auf ein `multipart`, das es hier nicht gibt. **Keine Marke ist
 *     enger als eine erzeugte**, und A-19.22c verlangt ohnehin, dass aus
 *     keiner Angabe der Nachricht ein zusätzlicher Abschnitt wird. Wer diese
 *     Datei je auf `multipart` erweitert — für einen HTML-Teil etwa —, holt
 *     die erzeugte Marke aus A-A-96 zurück und nicht eine feste.
 *
 * Dazu, als **Messung und nicht als Filter**, die Formprüfung am Ende: Jede
 * erzeugte physische Kopfzeile muss aus druckbarem ASCII bestehen. Das ist
 * ein Festpunkt über dem eigenen Erzeugnis — er kann nur dann rot werden,
 * wenn eine der drei Bauentscheidungen oben verletzt wurde. Ein `CR` oder
 * `LF` im Wert einer Kopfzeile ist damit ein **Ablehnungsgrund** (A-A-96) und
 * keine Zeile: Der ganze Nachbau scheitert, wird nach A-19.29 gemeldet, und
 * es entsteht keine halbe Datei.
 *
 * ===========================================================================
 * Und warum die Datei selbst sagt, dass sie ein Nachbau ist
 * ===========================================================================
 *
 * Der Nachbau trägt Absender, Empfänger, Betreff, Datum und Text — er trägt
 * **nicht** die ursprünglichen Kopfzeilen, nicht DKIM, nicht S/MIME, nicht die
 * Empfangsstempel. Als Beleg ist er nichts wert, und er wird weitergereicht:
 * an die Buchhaltung, an einen Anwalt, in eine Akte. Die Kennzeichnung hängt
 * deshalb an der **Datei** und nicht am Augenblick des Anlegens (A-19.22b):
 * als Kopfzeile `X-SuperTakt-Rebuilt`, als erster Absatz im lesbaren Rumpf,
 * und — das ist die Hälfte von domain-dev — als Eigenschaft am Anhang im
 * Bestand (A-A-97), die der Aufgabenbereich mit {@link RebuiltEml.rebuilt}
 * weiterreicht.
 */

import { bytesToBase64, utf8Bytes, utf8ToBase64 } from './base64.ts';

/** Eine Adresse, wie Office.js sie hergibt. */
export interface MailAddress {
  readonly displayName: string;
  readonly address: string;
}

/**
 * Alles, was der Lesemodus ohne Mailbox 1.14 hergibt (A-19.22a).
 *
 * Genau die fünf Angaben aus A-19.22 und nicht mehr: Absender, Empfänger,
 * Kopie, Betreff, Versanddatum, Nachrichtentext.
 */
export interface RebuildFields {
  readonly subject: string;
  readonly from: MailAddress | null;
  readonly to: readonly MailAddress[];
  readonly cc: readonly MailAddress[];
  readonly sentAt: Date | null;
  /**
   * Der Nachrichtentext — **`null`, wenn er nicht zu bekommen war** (T-310).
   *
   * `''` und `null` sind zwei verschiedene Tatsachen: Das Erste ist eine
   * E-Mail ohne Text, das Zweite ein Ausfall beim Lesen. Der Vorspann des
   * Nachbaus sagt zu, den Nachrichtentext zu enthalten; er darf deshalb nur
   * über dem Ersten entstehen. Siehe {@link buildRebuiltEml}.
   */
  readonly body: string | null;
}

export type RebuildResult =
  | { readonly ok: true; readonly base64: string }
  | { readonly ok: false };

/**
 * Die Obergrenze eines kodierten Wortes nach RFC 2047 Abschnitt 2.
 *
 * 75 Zeichen einschließlich `=?UTF-8?B?` (10) und `?=` (2) lassen 63 Zeichen
 * Base64; auf ein Vielfaches von vier abgerundet sind das 60, und 60
 * Base64-Zeichen tragen 45 Bytes.
 */
const ENCODED_WORD_PAYLOAD_BYTES = 45;

/** Was in einer physischen Kopfzeile stehen darf: druckbares ASCII, sonst nichts. */
const PRINTABLE_ASCII_LINE = /^[\x20-\x7e]*$/;

/**
 * Die enge Form einer Adresse (`addr-spec`).
 *
 * Bewusst enger als RFC 5322 erlaubt: kein zitierter lokaler Teil, keine
 * Adressliteral-Form, kein Leerzeichen, kein `<`, kein `>`, kein Komma, kein
 * Semikolon, kein Anführungszeichen. Was hier durchfällt, ist deshalb nicht
 * verloren — es steht im lesbaren Rumpf, kodiert. Es wird nur nicht in eine
 * **strukturierte** Kopfzeile gesetzt, denn dort trennt ein Komma zwei
 * Adressen und ein `<` beginnt eine.
 */
const ADDR_SPEC = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}@[A-Za-z0-9][A-Za-z0-9.-]{0,251}$/;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const two = (value: number): string => String(value).padStart(2, '0');

/**
 * Das Versanddatum nach RFC 5322 Abschnitt 3.3, in UTC.
 *
 * Aus Zahlen gebaut und nicht aus `toUTCString()`: Die Ausgabe von
 * `toUTCString` endet auf `GMT`, und das ist die veraltete Zonenform aus RFC
 * 822. Eine Zeitzone in der Ortssprache der Laufzeit gäbe es hier ohnehin
 * nicht — ein `Date` ist kein fremder Text, sondern eine Zahl.
 */
const rfc5322Date = (date: Date): string | null => {
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  const weekday = WEEKDAYS[date.getUTCDay()];
  const month = MONTHS[date.getUTCMonth()];
  if (weekday === undefined || month === undefined) return null;
  return (
    `${weekday}, ${String(date.getUTCDate())} ${month} ${String(date.getUTCFullYear())} ` +
    `${two(date.getUTCHours())}:${two(date.getUTCMinutes())}:${two(date.getUTCSeconds())} +0000`
  );
};

/**
 * Zerlegt Text in Stücke von höchstens `maxBytes` UTF-8-Bytes, **an
 * Zeichengrenzen**.
 *
 * `for…of` läuft über Codepunkte und nicht über UTF-16-Einheiten. Ein kodiertes
 * Wort muss nach RFC 2047 für sich dekodierbar sein und eine ganze Zahl von
 * Zeichen enthalten; ein an der falschen Stelle geteiltes Emoji ergäbe zwei
 * Wörter, die einzeln kein gültiges UTF-8 sind.
 */
const chunkByCodePoint = (text: string, maxBytes: number): Uint8Array[] => {
  const chunks: Uint8Array[] = [];
  let current: number[] = [];

  for (const character of text) {
    const bytes = utf8Bytes(character);
    if (current.length > 0 && current.length + bytes.length > maxBytes) {
      chunks.push(Uint8Array.from(current));
      current = [];
    }
    for (const byte of bytes) current.push(byte);
  }
  if (current.length > 0) chunks.push(Uint8Array.from(current));

  return chunks;
};

/**
 * Fremder Text als Folge kodierter Wörter (RFC 2047, `B`-Kodierung).
 *
 * Zurück kommt eine Liste, weil eine gefaltete Kopfzeile aus mehreren
 * **physischen** Zeilen besteht und jede davon einzeln geprüft wird. Wer hier
 * eine Zeichenkette mit eingebautem `\r\n` zurückgäbe, hätte die Prüfung um
 * genau das gebracht, wofür sie da ist.
 */
export const encodeHeaderWords = (raw: string): string[] =>
  chunkByCodePoint(raw, ENCODED_WORD_PAYLOAD_BYTES).map(
    (chunk) => `=?UTF-8?B?${bytesToBase64(chunk)}?=`,
  );

/**
 * Eine Adresse für eine strukturierte Kopfzeile.
 *
 * `null` heißt: Diese Adresse gehört nicht in eine strukturierte Kopfzeile.
 * Sie ist damit nicht verschwunden — der lesbare Rumpf nennt sie, kodiert.
 */
const structuredAddress = (entry: MailAddress): string | null => {
  const words = encodeHeaderWords(entry.displayName.trim());
  if (!ADDR_SPEC.test(entry.address)) return null;
  return words.length === 0 ? `<${entry.address}>` : `${words.join(' ')} <${entry.address}>`;
};

/** Eine Adresse in Worten, für den lesbaren Rumpf — immer vollständig. */
const readableAddress = (entry: MailAddress): string => {
  const name = entry.displayName.trim();
  const address = entry.address.trim();
  if (name.length > 0 && address.length > 0) return `${name} <${address}>`;
  if (address.length > 0) return address;
  return name;
};

const readableList = (entries: readonly MailAddress[]): string =>
  entries.map(readableAddress).filter((value) => value.length > 0).join(', ');

/**
 * Eine Kopfzeile als **physische Zeilen** — die erste mit dem Namen, die
 * folgenden mit einem führenden Leerzeichen (RFC 5322 Abschnitt 2.2.3).
 */
const headerLines = (name: string, words: readonly string[]): string[] => {
  if (words.length === 0) return [];
  const [first, ...rest] = words;
  return [`${name}: ${String(first)}`, ...rest.map((word) => ` ${word}`)];
};

/** Base64 in Zeilen zu 76 Zeichen, wie RFC 2045 Abschnitt 6.8 es vorsieht. */
const wrapBase64 = (value: string): string[] => {
  const lines: string[] = [];
  for (let offset = 0; offset < value.length; offset += 76) {
    lines.push(value.slice(offset, offset + 76));
  }
  return lines.length === 0 ? [''] : lines;
};

/**
 * Der Vorspann im lesbaren Rumpf.
 *
 * Er steht **in** der Datei und nicht nur an ihr: Wer sie in drei Wochen aus
 * einem Ordner heraus doppelklickt, sieht als Erstes, was er vor sich hat.
 * Die Kennzeichnung im Bestand (A-A-97) ersetzt diesen Absatz nicht und wird
 * von ihm nicht ersetzt — die eine trägt in SuperTakt, der andere trägt,
 * sobald die Datei SuperTakt verlassen hat.
 */
const REBUILD_PREAMBLE = [
  'Diese Datei ist ein Nachbau der ursprünglichen E-Mail, erzeugt von SuperTakt.',
  'Sie enthält Absender, Empfänger, Betreff, Versanddatum und Nachrichtentext.',
  'Die ursprünglichen Kopfzeilen, Signaturen und Empfangsstempel fehlen; als',
  'Nachweis über die ursprüngliche Nachricht ist sie deshalb nicht geeignet.',
];

/** Die Trennlinie zwischen Vorspann und Nachrichtentext im lesbaren Rumpf. */
const REBUILD_SEPARATOR = '-'.repeat(60);

/**
 * Baut die nachgebaute Nachricht und gibt sie als Base64 zurück — oder lehnt
 * ab.
 *
 * Abgelehnt wird aus **zwei** Gründen, und beide enden im selben Ergebnis
 * (`rebuild_rejected`, A-19.29):
 *
 *  1. Eine erzeugte physische Kopfzeile besteht nicht aus druckbarem ASCII.
 *     Unter den drei Bauentscheidungen im Dateikopf ist das unerreichbar;
 *     genau deshalb steht die Prüfung da. Sie ist die Wache für den Tag, an
 *     dem jemand einen Wert **roh** einsetzt.
 *  2. **Der Nachrichtentext war nicht zu bekommen** (`body === null`, T-310).
 *     Der Vorspann sagt wörtlich zu, ihn zu enthalten. Eine Datei, die sagt
 *     „hier steht die Nachricht" und leer ist, ist in einem Vorgang, aus dem
 *     eine Rechnung wird, eine falsche Auskunft — und sie wäre nach A-19.31
 *     außerdem ein stiller Ausfall: Sie ginge als übernommen durch. Lieber
 *     keine Datei und ein Satz darüber als eine Datei, die etwas behauptet.
 *
 * Eine E-Mail **ohne** Text (`''`) wird dagegen gebaut: Dann steht unter der
 * Trennlinie nichts, und das ist wahr.
 */
export const buildRebuiltEml = (fields: RebuildFields): RebuildResult => {
  if (fields.body === null) return { ok: false };

  const date = fields.sentAt === null ? null : rfc5322Date(fields.sentAt);

  const toStructured = fields.to.map(structuredAddress).filter((value) => value !== null);
  const ccStructured = fields.cc.map(structuredAddress).filter((value) => value !== null);
  const fromStructured = fields.from === null ? null : structuredAddress(fields.from);

  const head: string[] = ['MIME-Version: 1.0'];
  if (date !== null) head.push(`Date: ${date}`);
  if (fromStructured !== null) head.push(`From: ${fromStructured}`);
  if (toStructured.length > 0) head.push(`To: ${toStructured.join(', ')}`);
  if (ccStructured.length > 0) head.push(`Cc: ${ccStructured.join(', ')}`);
  head.push(...headerLines('Subject', encodeHeaderWords(fields.subject.trim())));
  head.push('X-SuperTakt-Rebuilt: yes');
  head.push('Content-Type: text/plain; charset=utf-8');
  head.push('Content-Transfer-Encoding: base64');

  for (const line of head) {
    if (!PRINTABLE_ASCII_LINE.test(line)) return { ok: false };
  }

  const readable = [
    ...REBUILD_PREAMBLE,
    '',
    `Von: ${fields.from === null ? '' : readableAddress(fields.from)}`,
    `An: ${readableList(fields.to)}`,
    `Kopie: ${readableList(fields.cc)}`,
    `Betreff: ${fields.subject}`,
    `Gesendet: ${date ?? 'unbekannt'}`,
    '',
    REBUILD_SEPARATOR,
    '',
    fields.body,
  ].join('\r\n');

  const message = [...head, '', ...wrapBase64(utf8ToBase64(readable)), ''].join('\r\n');
  return { ok: true, base64: utf8ToBase64(message) };
};
