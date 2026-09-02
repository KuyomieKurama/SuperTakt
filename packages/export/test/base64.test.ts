/**
 * Takt — T-010, Base64 über UTF-8 (A-8.4).
 *
 * Testfälle: TP-B64-01 bis TP-B64-08 (docs/testplan.md, Abschnitt 2).
 *
 * `packages/export` existiert als Paket noch nicht (T-007, siehe
 * `.claude/team/reports/T-008a-domain-dev.md`, Abschnitt "Was die
 * Einstiegspunkte technisch tragen"). Diese Datei nimmt an, dass T-007 dort
 * `packages/export/src/base64.ts` mit den Funktionen
 *
 *     toBase64(text: string): string
 *     fromBase64(encoded: string): string
 *
 * anlegt — Englisch statt der im Testplan verwendeten deutschen Beispielnamen
 * `zuBase64`/`vonBase64`, passend zu E-015/R-16 (Bezeichner englisch). Bis
 * dahin schlägt der Import mit "Cannot find module" fehl — ROT ZUERST, weil
 * weder das Paket noch die Datei existieren, nicht weil dieser Test fehlerhaft
 * wäre.
 *
 * Wichtig für UTF-8-Korrektheit (Abgrenzung zu Latin-1/Buffer-Fallstricken):
 * Alle Prüfungen vergleichen den dekodierten String exakt mit dem
 * Ausgangstext, inklusive Codepoints außerhalb der Basic Multilingual Plane
 * (Emoji, TP-B64-05), die in UTF-16 als Surrogatpaare vorliegen und bei einer
 * naiven Byte-für-Byte- oder Latin-1-Kodierung typischerweise brechen.
 */
import { describe, expect, it } from 'vitest';
import { toBase64, fromBase64 } from '../src/base64.js';

const cases: ReadonlyArray<{ readonly id: string; readonly label: string; readonly text: string }> = [
  { id: 'TP-B64-01', label: 'leere Notiz', text: '' },
  { id: 'TP-B64-02', label: 'Umlaute', text: 'Übertragung mit Ärger, Grüße' },
  { id: 'TP-B64-03', label: 'scharfes S', text: 'Straße, groß, Fuß' },
  { id: 'TP-B64-04', label: 'französische Akzente', text: 'café, façade, à bientôt' },
  { id: 'TP-B64-05', label: 'Emoji (außerhalb der BMP)', text: 'Fertig 🎉 vielen Dank 👍' },
  { id: 'TP-B64-06', label: 'eingebetteter Zeilenumbruch', text: 'Erste Zeile\nZweite Zeile' },
  {
    id: 'TP-B64-08',
    label: 'worst case: alle Besonderheiten gleichzeitig',
    text: 'Übertragung mit Ärger, Grüße — Straße, groß, Fuß — café, façade, à bientôt\nFertig 🎉 vielen Dank 👍',
  },
];

describe('Base64-Encoder/Decoder — Hin- und Rückweg, UTF-8-korrekt', () => {
  it.each(cases)('$id ($label): dekodiert exakt zum Original, Codepoint für Codepoint', ({ text }) => {
    const encoded = toBase64(text);
    const decoded = fromBase64(encoded);
    expect(decoded).toBe(text);
    // Zusätzlich: Zeichenlänge (nicht Byte-Länge) muss übereinstimmen — deckt
    // eine falsche Surrogatpaar-Behandlung auf, die bei Emoji still Zeichen
    // verlieren oder verdoppeln könnte, obwohl toBe() bereits fehlschlüge.
    expect([...decoded]).toHaveLength([...text].length);
  });

  it('TP-B64-01: leerer String kodiert zu einem leeren (oder jedenfalls gültigen) Base64-Wert und dekodiert wieder zu ""', () => {
    const encoded = toBase64('');
    expect(fromBase64(encoded)).toBe('');
  });

  it('TP-B64-07: sehr lange Notiz (~10.000 Zeichen) übersteht Blockgrenzen der Base64-Kodierung', () => {
    // NACHTRAG T-010b (Befund 2, T-007-integration-dev): Der Grundtext ist 59
    // Zeichen lang; 59 x 160 = 9440 liegt UNTER der Schwelle, wodurch die
    // folgende Zusicherung fehlschlug, bevor toBase64 überhaupt aufgerufen
    // wurde — der eigentliche Fall wurde nie geprüft. 59 x 170 = 10 030 trifft
    // die Absicht (vom integration-dev unabhängig gegen Node als Maßstab
    // nachgerechnet: byteweise identisch, Rückweg exakt). Repariert wird der
    // Fülltext, nicht die Schwelle — sonst prüfte dieser Fall eine kurze
    // Notiz und nennte sie lang.
    const longText = 'Erfundener Fülltext für Performanz- und Blockgrenzen-Test. '.repeat(170); // 10.030 Zeichen
    expect(longText.length).toBeGreaterThan(10_000);
    const encoded = toBase64(longText);
    expect(fromBase64(encoded)).toBe(longText);
  });

  it('das kodierte Ergebnis ist tatsächlich gültiges Base64 (nur zulässiges Alphabet, korrektes Padding)', () => {
    const encoded = toBase64('café ☕');
    expect(encoded).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
  });

  it('zwei unterschiedliche Eingaben erzeugen unterschiedliche Kodierungen (keine Kollision im Trivialfall)', () => {
    expect(toBase64('Kunde A zurückgerufen')).not.toBe(toBase64('Kunde B zurückgerufen'));
  });
});

/**
 * NACHTRAG T-010b: `fromBase64` mit einem Zeichen außerhalb des Alphabets und
 * mit ungültigen UTF-8-Byte-Folgen (T-007-Bericht, Befund 4, letzter
 * Aufzählungspunkt). `fromBase64` geht nicht in den Export selbst ein — der
 * Rückweg wird für Vorschau und Nachweis gebraucht —, aber ein falsch
 * behandeltes Fehlereingabe-Zeichen wäre ein stiller Absturz an genau dieser
 * Stelle.
 *
 * Die Bytes werden über `Buffer.from(bytes).toString('base64')` erzeugt, weil
 * `toBase64` selbst nur gültige UTF-8-Bytes aus einem echten JS-String
 * herstellen kann — für einen absichtlich ungültigen Byte-Strom braucht es
 * einen zweiten, unabhängigen Weg, ihn zu kodieren.
 */
describe('fromBase64 — ungültige Eingaben (Wurf statt Ergebnis, siehe Kopfkommentar der Funktion)', () => {
  it('ein Zeichen außerhalb des Base64-Alphabets wirft mit einer Meldung, die das Zeichen selbst nicht preisgibt', () => {
    expect(() => fromBase64('@@@@')).toThrow(/außerhalb des Alphabets/);
  });

  it('die Fehlermeldung nennt niemals den tatsächlichen Inhalt der (potenziell vertraulichen) Eingabe', () => {
    // "GEHEIME-KUNDENNUMMER-42" enthält "-", ein Zeichen außerhalb des
    // Base64-Alphabets, ist also selbst eine ungültige Eingabe.
    const secret = 'GEHEIME-KUNDENNUMMER-42';
    let thrown: unknown;
    try {
      fromBase64(secret);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect(String((thrown as Error).message)).not.toContain(secret);
  });

  it('eine einzelne, alleinstehende Fortsetzungs-Byte (0x80) ohne Startbyte wird zu U+FFFD, kein Absturz', () => {
    const encoded = Buffer.from([0x80]).toString('base64');
    expect(fromBase64(encoded)).toBe('�');
  });

  it('eine abgeschnittene Mehrbyte-Folge (Startbyte ohne Fortsetzungsbyte) wird zu U+FFFD', () => {
    // 0xC2 kündigt eine 2-Byte-Folge an; hier folgt aber gar nichts mehr.
    const encoded = Buffer.from([0xc2]).toString('base64');
    expect(fromBase64(encoded)).toBe('�');
  });

  it('ein ungültiges Fortsetzungsbyte bricht nur die eine Folge ab, der Rest wird normal weitergelesen', () => {
    // 0xE0 kündigt eine 3-Byte-Folge an, aber 0x41 ("A") ist keine gültige
    // Fortsetzung (oberste zwei Bits müssten 10 sein). Danach folgt ein
    // gewöhnliches ASCII-"A" (0x41), das unabhängig weiterhin korrekt gelesen
    // werden muss — kein Übergreifen des Fehlers auf nachfolgende Zeichen.
    const encoded = Buffer.from([0xe0, 0x41, 0x41]).toString('base64');
    expect(fromBase64(encoded)).toBe('�A');
  });

  it('Padding-Zeichen ("=") werden übersprungen, nicht als ungültiges Zeichen gewertet', () => {
    const encoded = toBase64('A'); // "A" ist 1 Byte, ergibt Base64 mit "==" Padding.
    expect(encoded.endsWith('==')).toBe(true);
    expect(() => fromBase64(encoded)).not.toThrow();
    expect(fromBase64(encoded)).toBe('A');
  });
});
