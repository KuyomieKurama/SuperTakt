/**
 * Takt — T-148, Anhänge am Todo (A-19.8 bis A-19.15, A-19.17, E-071, E-072,
 * A-A-13 bis A-A-18).
 *
 * ===========================================================================
 * ROT ZUERST
 * ===========================================================================
 *
 * `packages/domain/src/attachment.ts` entstand mit T-146 und hatte laut
 * Auftrag T-148 (Messung des Orchestrators nach Welle T) **keine** Prüfdatei
 * — 10,37 % Anweisungen, 0 % Zweige, 0 % Funktionen. Vor dieser Datei existierte
 * kein `grep -rn "attachment" packages/domain/test/`.
 *
 * ===========================================================================
 * Was hier gemessen wird
 * ===========================================================================
 *
 * 1. **Drei Arten** (`isAttachmentKind`) und die Formprüfung je Art:
 *    - Verweis: `normalizeAttachmentLink` — Länge, Steuer-/Richtungszeichen
 *      VOR dem Zerlegen, die beiden Nullbreiten, Schema, Wirt, Zugangsdaten,
 *      Idempotenz.
 *    - Datei: `checkAttachmentPath` — leer, zu lang, Steuerzeichen, UNC in
 *      beiden Schreibweisen, nicht absolut, die fünf Umleitungsendungen.
 *    - Bild: `imageMediaTypeOf` — die vier Kopfsignaturen, keine Endung, kein
 *      `content-type`, zu kurzer Puffer.
 * 2. **Die Bildgrenze, an ihrer Herkunft gemessen und nicht an ihrem Wert**
 *    (T-134-Anspruch, siehe unten): `MAX_ATTACHMENT_IMAGE_BYTES` wird gegen
 *    die Mebibyte-Rechnung `8 * 1024 * 1024` gehalten, nicht gegen die
 *    wörtlich abgeschriebene Ziffernfolge `8388608` — sonst prüfte der Test
 *    nur, dass dieselbe Ziffernfolge zweimal im Bestand steht, und ein
 *    Verwechslungsfehler wie „8 Millionen Bytes“ (dezimal) bliebe unentdeckt.
 *    Zusätzlich wird gegen die frühere, von E-075 berichtigte Zahl aus E-073
 *    (5 MiB) abgegrenzt.
 * 3. **Die Beschriftung** (`attachmentLabel`, A-19.12): nie eine leere Zeile.
 */
import { describe, expect, it } from 'vitest';

import {
  ATTACHMENT_KINDS,
  ATTACHMENT_KIND_PRESENCE,
  IMAGE_SIGNATURE_BYTES,
  INDIRECT_EXTENSIONS,
  INVISIBLE_IN_ADDRESS,
  MAX_ATTACHMENT_IMAGE_BYTES,
  MAX_ATTACHMENT_LINK_BYTES,
  MAX_ATTACHMENT_PATH_BYTES,
  MAX_ATTACHMENT_TITLE_CHARACTERS,
  attachmentLabel,
  checkAttachmentPath,
  fileExtensionOf,
  imageMediaTypeOf,
  isAbsoluteAttachmentPath,
  isAttachmentKind,
  isNormalizedAttachmentLink,
  isUncPath,
  normalizeAttachmentLink,
} from '../src/attachment.ts';

// ---------------------------------------------------------------------------
// Die drei Arten
// ---------------------------------------------------------------------------

describe('ATTACHMENT_KIND_PRESENCE / isAttachmentKind / ATTACHMENT_KINDS (A-19.9)', () => {
  it('genau drei Arten', () => {
    expect(Object.keys(ATTACHMENT_KIND_PRESENCE).sort()).toEqual(['file', 'image', 'link'].sort());
    expect([...ATTACHMENT_KINDS].sort()).toEqual(['file', 'image', 'link'].sort());
  });

  it.each(['link', 'image', 'file'])('"%s" ist eine bekannte Art', (value) => {
    expect(isAttachmentKind(value)).toBe(true);
  });

  it.each(['Link', 'video', '', 'files'])(
    '"%s" ist KEINE bekannte Art — wörtlicher Vergleich ohne Normalisierung',
    (value) => {
      expect(isAttachmentKind(value)).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// Grenzwerte — die Bildgrenze an ihrer Herkunft gemessen (T-134-Anspruch)
// ---------------------------------------------------------------------------

describe('Grenzwerte', () => {
  it('MAX_ATTACHMENT_LINK_BYTES ist 2048 (die Browser-Konvention)', () => {
    expect(MAX_ATTACHMENT_LINK_BYTES).toBe(2_048);
  });

  it('MAX_ATTACHMENT_PATH_BYTES ist 4096 (PATH_MAX der verbreiteten Unix-Systeme)', () => {
    expect(MAX_ATTACHMENT_PATH_BYTES).toBe(4_096);
  });

  it('MAX_ATTACHMENT_TITLE_CHARACTERS ist 200', () => {
    expect(MAX_ATTACHMENT_TITLE_CHARACTERS).toBe(200);
  });

  /**
   * Die Frage ist die Herkunft der Zahl, nicht die Zahl selbst (T-134): Ein
   * Vergleich gegen die abgeschriebene Ziffernfolge `8388608` wäre nur die
   * doppelte Behauptung derselben Ziffern. Die Rechnung `8 * 1024 * 1024`
   * (acht MEBIbyte, keine dezimalen 8 Millionen Bytes) ist die Definition, aus
   * der der Wert stammt (E-075 Punkt 1, berichtigt E-073 Punkt 3) — ein Test,
   * der stattdessen `8_388_608` hinschriebe, bestünde auch dann, wenn jemand
   * aus Versehen `8_000_000` (die dezimale Lesart „8 MB“) einträgt und die
   * Konstante an dieser einen Stelle geändert, aber nirgends sonst nachgezogen
   * würde — der Vergleich träfe dann exakt denselben (falschen) Wert.
   */
  it('MAX_ATTACHMENT_IMAGE_BYTES ist die Mebibyte-Rechnung 8 * 1024 * 1024, nicht 8 Millionen Bytes', () => {
    expect(MAX_ATTACHMENT_IMAGE_BYTES).toBe(8 * 1024 * 1024);
    expect(MAX_ATTACHMENT_IMAGE_BYTES).not.toBe(8_000_000);
  });

  it('MAX_ATTACHMENT_IMAGE_BYTES ist NICHT mehr die von E-075 berichtigte Zahl aus E-073 (5 MiB)', () => {
    expect(MAX_ATTACHMENT_IMAGE_BYTES).not.toBe(5 * 1024 * 1024);
  });

  it('INVISIBLE_IN_ADDRESS trägt genau die zwei Nullbreiten, U+200B und U+FEFF', () => {
    expect(INVISIBLE_IN_ADDRESS).toEqual([
      { from: 0x200b, to: 0x200b },
      { from: 0xfeff, to: 0xfeff },
    ]);
  });

  it('INDIRECT_EXTENSIONS sind genau die fünf Umleitungen aus A-A-5', () => {
    expect([...INDIRECT_EXTENSIONS].sort()).toEqual(['desktop', 'lnk', 'pif', 'scf', 'url'].sort());
  });

  /**
   * O-FS (T-185, aus T-174 Risiko 1, Gegenstück zu `a_a_30_…` in
   * `apps/desktop/src-tauri/src/attachment.rs`).
   *
   * Der Fall oben hält die Liste als Ganzes fest — er wird bei JEDER
   * Änderung rot, egal ob eine neue Endung die 8.3-Begründung (A-A-30)
   * verletzt oder nicht. Genau darin liegt die Lücke: Wer eine sechste
   * Endung einträgt, MUSS die erwartete Liste oben mitziehen, damit der Fall
   * wieder grün wird — und zieht dabei nur die Ziffernfolge nach, ohne dass
   * irgendetwas ihn zwingt, die 8.3-Frage überhaupt zu stellen. Der Fall
   * beschreibt den heutigen Bestand, nicht die Regel dahinter.
   *
   * Diese beiden Fälle hier binden sich NICHT an die heutige Anzahl der
   * Einträge, sondern an die Regel selbst (Bedrohungsmodell 22.1.2): Nur
   * `"desktop"` darf länger als drei Zeichen sein, weil sein 8.3-Kurzname
   * (`.DES`) unter Windows nachweislich nichts auslöst; jede andere Endung
   * über drei Zeichen überlebt eine 8.3-Kürzung NICHT unverändert und bräuchte
   * denselben Nachweis erst noch. Eine künftige, vierte oder längere Endung,
   * die nicht `"desktop"` heißt, lässt BEIDE Fälle rot werden — unabhängig
   * davon, wie viele Einträge die Liste dann hat.
   */
  it('keine Umleitungsendung außer "desktop" ist länger als drei Zeichen (A-A-30, die 8.3-Regel)', () => {
    const laengereAlsDrei = INDIRECT_EXTENSIONS.filter(
      (endung) => endung !== 'desktop' && endung.length > 3,
    );
    expect(laengereAlsDrei).toEqual([]);
  });

  it('genau eine Endung überschreitet drei Zeichen, und es ist "desktop" — nicht mehr, nicht eine andere', () => {
    const laenger = INDIRECT_EXTENSIONS.filter((endung) => endung.length > 3);
    expect(laenger).toEqual(['desktop']);
  });
});

// ---------------------------------------------------------------------------
// Verweis — normalizeAttachmentLink (A-A-2, A-A-3, A-A-13, A-A-14)
// ---------------------------------------------------------------------------

describe('normalizeAttachmentLink — Normalform (A-A-13)', () => {
  it('eine bereits normale Adresse bleibt unverändert', () => {
    expect(normalizeAttachmentLink('http://example.org/')).toEqual({
      ok: true,
      url: 'http://example.org/',
    });
  });

  it('Großschreibung im Schema und im Wirt wird auf die Normalform gebracht (gemessenes Beispiel aus T-146)', () => {
    expect(normalizeAttachmentLink('HTTP://Beispiel.EXAMPLE/Seite')).toEqual({
      ok: true,
      url: 'http://beispiel.example/Seite',
    });
  });

  it('führender Leerraum wird durch das Zerlegen entfernt', () => {
    const result = normalizeAttachmentLink(' https://example.org');
    expect(result).toEqual({ ok: true, url: 'https://example.org/' });
  });

  it('http:/\\example.org/ wird zu http://example.org/ — das Schema greift auf den zerlegten Wert, nicht auf ein Präfix der Rohfassung', () => {
    expect(normalizeAttachmentLink('http:/\\example.org/')).toEqual({
      ok: true,
      url: 'http://example.org/',
    });
  });

  it('ein anderes Schema als http/https wird abgewiesen (link_scheme_rejected)', () => {
    expect(normalizeAttachmentLink('ftp://example.org/')).toEqual({
      ok: false,
      reason: 'link_scheme_rejected',
    });
  });

  it('ein file:-Schema wird ebenfalls abgewiesen, nicht als Datei behandelt', () => {
    expect(normalizeAttachmentLink('file:///etc/passwd')).toEqual({
      ok: false,
      reason: 'link_scheme_rejected',
    });
  });

  it('Zugangsdaten im Wirtsteil werden abgewiesen, nicht normalisiert (die klassische Verwechslung)', () => {
    expect(normalizeAttachmentLink('https://evil.example@gutartig.example/')).toEqual({
      ok: false,
      reason: 'link_userinfo',
    });
  });

  it.each(['\\\\server\\freigabe', '//server/freigabe'])(
    'ein UNC-Pfad ("%s") läßt sich als Adresse gar nicht zerlegen (link_unparsable) — der Typ Verweis braucht keine eigene UNC-Regel',
    (value) => {
      expect(normalizeAttachmentLink(value)).toEqual({ ok: false, reason: 'link_unparsable' });
    },
  );

  it('eine Zeichenkette ohne jedes Schema ist ebenfalls unparsable', () => {
    expect(normalizeAttachmentLink('nur ein Text ohne Schema')).toEqual({
      ok: false,
      reason: 'link_unparsable',
    });
  });

  it('länger als MAX_ATTACHMENT_LINK_BYTES in der Rohfassung wird vor dem Zerlegen abgewiesen', () => {
    const zuLang = `https://example.org/${'a'.repeat(MAX_ATTACHMENT_LINK_BYTES)}`;
    expect(normalizeAttachmentLink(zuLang)).toEqual({ ok: false, reason: 'link_too_long' });
  });

  /**
   * `byteLength` zählt UTF-8-Bytes von Hand (siehe Kommentar über der
   * Funktion) und hat einen eigenen Zweig für Codepunkte über `0xFFFF` — ein
   * Emoji als Ersatzpaar ist der einzige Weg, ihn zu erreichen (drei Bytes
   * reichen bis `0xFFFF`, ein Emoji liegt darüber und braucht vier).
   */
  it('ein Emoji in der Adresse (vierbytiger Codepunkt) wird korrekt gezählt und angenommen', () => {
    const result = normalizeAttachmentLink('https://example.org/😀');
    expect(result).toEqual({ ok: true, url: 'https://example.org/%F0%9F%98%80' });
  });

  it('genau an der Grenze (2048 Bytes) wird angenommen', () => {
    const praefix = 'https://example.org/';
    const fuellung = 'a'.repeat(MAX_ATTACHMENT_LINK_BYTES - praefix.length);
    const genauAnDerGrenze = praefix + fuellung;
    expect(genauAnDerGrenze.length).toBe(MAX_ATTACHMENT_LINK_BYTES);
    const result = normalizeAttachmentLink(genauAnDerGrenze);
    expect(result.ok).toBe(true);
  });

  /**
   * Die Normalform kann durch das Zerlegen wachsen (Prozentkodierung): Jedes
   * "ü" (2 Rohbytes) wird zu "%C3%BC" (6 Bytes) in der Serialisierung. Die
   * Rohfassung bleibt unter der Grenze, die Normalform reißt sie — genau der
   * Fall, den der Kommentar über der Funktion als zweite Längenprüfung nennt
   * ("Die Normalform kann durch das Zerlegen gewachsen sein").
   */
  it('eine Adresse, die erst NACH dem Zerlegen zu lang wird, wird ebenfalls abgewiesen', () => {
    const raw = `https://example.org/?q=${'ü'.repeat(700)}`;
    expect(raw.length).toBeLessThan(MAX_ATTACHMENT_LINK_BYTES);
    expect(normalizeAttachmentLink(raw)).toEqual({ ok: false, reason: 'link_too_long' });
  });

  it.each([
    ['ht\tps://example.org/', 'Tabulator'],
    ['java\nscript:alert(1)', 'Zeilenumbruch'],
    ['http\u0000s://example.org/', 'NUL'],
    [`https://example.org/${String.fromCodePoint(0x202e)}gpj.exe`, 'RLO — Bidi-Überschreibung'],
  ])('ein Steuer- oder Richtungszeichen ("%s") wird VOR dem Zerlegen abgewiesen (link_control_character)', (value) => {
    expect(normalizeAttachmentLink(value)).toEqual({ ok: false, reason: 'link_control_character' });
  });

  it.each([
    [`https://exam${String.fromCodePoint(0x200b)}ple.org/`, 'U+200B, Nullbreite'],
    [`https://exam${String.fromCodePoint(0xfeff)}ple.org/`, 'U+FEFF, Nullbreite ohne Umbruch'],
  ])('eine Nullbreite ("%s") wird abgewiesen, nicht stillschweigend entfernt (link_invisible_character)', (value) => {
    expect(normalizeAttachmentLink(value)).toEqual({ ok: false, reason: 'link_invisible_character' });
  });

  it('U+200D (ZWJ) ist NICHT in der Adress-Verbotsliste betroffen wie U+200B — die Klasse ist bewusst eng (nur 200B und FEFF)', () => {
    // ZWJ (200D) liegt außerhalb von INVISIBLE_IN_ADDRESS UND außerhalb von
    // FORBIDDEN_NAME_CHARACTERS (dort hält 200E/200F zusammengesetzte Emoji
    // zusammen). Als Wirtsname ist es trotzdem kein gültiger Hostname für
    // WHATWG URL, das ist aber ein anderer Fehlergrund als "invisible".
    const value = `https://exam${String.fromCodePoint(0x200d)}ple.org/`;
    const result = normalizeAttachmentLink(value);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).not.toBe('link_invisible_character');
  });

  it('idempotent: normalizeAttachmentLink(normalizeAttachmentLink(x).url) liefert wieder dieselbe Normalform', () => {
    const eingaben = [
      'HTTP://Beispiel.EXAMPLE/Seite',
      ' https://example.org',
      'http:/\\example.org/',
      'https://example.org/a b',
      'https://xn--exmple-4nf.org/',
    ];
    for (const eingabe of eingaben) {
      const erster = normalizeAttachmentLink(eingabe);
      expect(erster.ok).toBe(true);
      if (!erster.ok) continue;
      const zweiter = normalizeAttachmentLink(erster.url);
      expect(zweiter).toEqual({ ok: true, url: erster.url });
    }
  });
});

describe('isNormalizedAttachmentLink — der Festpunkt, den der Öffnen-Befehl der Hülle verlangt (A-A-3)', () => {
  it('eine bereits gespeicherte Normalform ist ein Festpunkt', () => {
    expect(isNormalizedAttachmentLink('http://example.org/')).toBe(true);
    expect(isNormalizedAttachmentLink('http://beispiel.example/Seite')).toBe(true);
  });

  it('eine Rohfassung, die sich beim Normalisieren ändert, ist KEIN Festpunkt', () => {
    expect(isNormalizedAttachmentLink('HTTP://EXAMPLE.ORG/')).toBe(false);
    expect(isNormalizedAttachmentLink(' https://example.org')).toBe(false);
  });

  it('ein Wert, der gar nicht als Adresse durchgeht, ist ebenfalls kein Festpunkt', () => {
    expect(isNormalizedAttachmentLink('ftp://example.org/')).toBe(false);
    expect(isNormalizedAttachmentLink('\\\\server\\freigabe')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Datei — checkAttachmentPath, isUncPath, isAbsoluteAttachmentPath, fileExtensionOf
// ---------------------------------------------------------------------------

describe('checkAttachmentPath — die Form eines Dateipfads (A-A-4, A-A-5)', () => {
  it('eine leere Zeichenkette ist path_empty', () => {
    expect(checkAttachmentPath('')).toEqual({ ok: false, reason: 'path_empty' });
  });

  it('nur Leerraum zählt ebenfalls als path_empty', () => {
    expect(checkAttachmentPath('   ')).toEqual({ ok: false, reason: 'path_empty' });
  });

  it('länger als MAX_ATTACHMENT_PATH_BYTES ist path_too_long', () => {
    const zuLang = `/${'a'.repeat(MAX_ATTACHMENT_PATH_BYTES)}`;
    expect(checkAttachmentPath(zuLang)).toEqual({ ok: false, reason: 'path_too_long' });
  });

  it('ein Steuerzeichen im Pfad ist path_control_character', () => {
    expect(checkAttachmentPath('/tmp/datei\nmit\numbruch.pdf')).toEqual({
      ok: false,
      reason: 'path_control_character',
    });
  });

  it.each([
    ['\\\\server\\freigabe\\datei.txt', 'doppelter Backslash'],
    ['//server/freigabe/datei.txt', 'doppelter Schrägstrich'],
    ['\\/gemischt/datei.txt', 'Backslash dann Schrägstrich'],
    ['/\\gemischt\\datei.txt', 'Schrägstrich dann Backslash'],
    ['\\\\?\\C:\\Users\\datei.txt', 'das verlängerte Windows-Präfix \\\\?\\'],
    ['\\\\.\\C:\\Users\\datei.txt', 'das Geräte-Präfix \\\\.\\'],
  ])('ein UNC-Pfad ("%s", %s) wird VOR der Absolutheitsprüfung als path_unc abgewiesen', (value) => {
    expect(checkAttachmentPath(value)).toEqual({ ok: false, reason: 'path_unc' });
  });

  it('ein relativer Pfad ist path_not_absolute', () => {
    expect(checkAttachmentPath('relativ/datei.pdf')).toEqual({ ok: false, reason: 'path_not_absolute' });
    expect(checkAttachmentPath('datei.pdf')).toEqual({ ok: false, reason: 'path_not_absolute' });
  });

  it('ein absoluter Unix-Pfad ist gültig', () => {
    expect(checkAttachmentPath('/home/nutzer/bericht.pdf')).toEqual({
      ok: true,
      path: '/home/nutzer/bericht.pdf',
    });
  });

  it('ein absoluter Windows-Pfad (Laufwerksbuchstabe) ist gültig, mit Backslash oder Schrägstrich', () => {
    expect(checkAttachmentPath('C:\\Users\\nutzer\\bericht.pdf')).toEqual({
      ok: true,
      path: 'C:\\Users\\nutzer\\bericht.pdf',
    });
    expect(checkAttachmentPath('C:/Users/nutzer/bericht.pdf')).toEqual({
      ok: true,
      path: 'C:/Users/nutzer/bericht.pdf',
    });
  });

  it.each(['lnk', 'url', 'pif', 'scf', 'desktop'])(
    'eine Umleitungsendung (".%s") wird abgewiesen (path_indirect_extension)',
    (extension) => {
      expect(checkAttachmentPath(`/home/nutzer/rechnung.${extension}`)).toEqual({
        ok: false,
        reason: 'path_indirect_extension',
      });
    },
  );

  it('Groß-/Kleinschreibung der Umleitungsendung spielt keine Rolle', () => {
    expect(checkAttachmentPath('/home/nutzer/rechnung.LNK')).toEqual({
      ok: false,
      reason: 'path_indirect_extension',
    });
  });

  // T-174 (unit-tester), T-178 Bedingung 2: Vor T-178 zerlegte `fileExtensionOf`
  // den rohen letzten Namensbestandteil (kein `effectiveNameSegment`). Ein
  // nachgestellter Punkt oder ein nachgestelltes Leerzeichen blieb Teil der
  // "Endung" (`"lnk "` statt `"lnk"`), traf damit KEINEN Eintrag von
  // `INDIRECT_EXTENSIONS`, und diese sieben von zehn gemessenen Namen kamen an
  // der Tür durch, obwohl die Hülle (`has_indirect_extension`, A-A-5′, T-156-1)
  // sie beim Öffnen ablehnt. Nach T-178 zerlegt `fileExtensionOf` am
  // AUFGELÖSTEN Namen, zeichengleich mit `effective_file_name` in der Hülle.
  it.each([
    'rechnung.lnk.',
    'rechnung.lnk ',
    'rechnung.lnk.. ',
  ])('eine Umleitungsendung mit nachgestelltem Punkt oder Leerzeichen ("%s") wird jetzt ebenfalls abgewiesen — konsistent mit der Hülle (T-178, A-A-5′)', (name) => {
    expect(checkAttachmentPath(`/home/nutzer/${name}`)).toEqual({
      ok: false,
      reason: 'path_indirect_extension',
    });
  });

  it('dieselbe Nachziehung gilt groß-/kleinschreibungsunabhängig und mit Backslash-Trenner', () => {
    expect(checkAttachmentPath('C:\\Users\\n\\verweis.URL ')).toEqual({
      ok: false,
      reason: 'path_indirect_extension',
    });
  });

  it('Gegenprobe: harmlose Dateien mit nachgestelltem Punkt bleiben unverändert gültig', () => {
    // Bericht.pdf. hat nach dem Abschneiden die Endung "pdf" -- unverändert
    // kein Treffer auf INDIRECT_EXTENSIONS, also weiterhin angenommen.
    expect(checkAttachmentPath('/home/nutzer/bericht.pdf.').ok).toBe(true);
  });

  // T-174 (unit-tester), T-179 Auflage A-1: Eine Datei, deren Name NUR aus
  // einer Umleitungsendung besteht (".lnk", ".desktop", …), wurde bis zum Fix
  // aus T-179 an dieser Tür ANGENOMMEN und fiel erst am Öffnen-Befehl der
  // Hülle auf `path_indirect_extension` — kein Loch (die tragende Kontrolle
  // hielt), aber genau die Auskunft, die T-178 an die Tür holen wollte,
  // fehlte ausgerechnet hier. Jetzt stimmen Tür und Hülle überein.
  it.each(['lnk', 'url', 'pif', 'scf', 'desktop'])(
    'ein Name, der NUR aus der Umleitungsendung besteht (".%s", führender Punkt), fällt jetzt ebenfalls an der Tür — konsistent mit der Hülle (T-179 A-1)',
    (extension) => {
      expect(checkAttachmentPath(`/home/nutzer/.${extension}`)).toEqual({
        ok: false,
        reason: 'path_indirect_extension',
      });
    },
  );

  it('.exe, .bat und .ps1 werden NICHT hier abgewiesen — es gibt keine Verbotsliste für ausführbare Dateien (A-A-5)', () => {
    expect(checkAttachmentPath('/home/nutzer/programm.exe')).toEqual({
      ok: true,
      path: '/home/nutzer/programm.exe',
    });
    expect(checkAttachmentPath('/home/nutzer/skript.bat').ok).toBe(true);
    expect(checkAttachmentPath('/home/nutzer/skript.ps1').ok).toBe(true);
  });

  it('der Pfad wird nicht verändert — kein trim, keine Auflösung', () => {
    const mitLeerraumAmEnde = '/home/nutzer/bericht .pdf';
    const result = checkAttachmentPath(mitLeerraumAmEnde);
    expect(result).toEqual({ ok: true, path: mitLeerraumAmEnde });
  });
});

describe('isUncPath — beide Schreibweisen (R-22, Bedrohungsmodell 20.1)', () => {
  it.each(['\\\\server\\freigabe', '//server/freigabe', '\\/mixed', '/\\mixed'])(
    '"%s" ist ein UNC-Pfad',
    (value) => {
      expect(isUncPath(value)).toBe(true);
    },
  );

  it.each(['/home/nutzer/datei.pdf', 'C:\\Users\\nutzer', 'relativ/pfad', ''])(
    '"%s" ist KEIN UNC-Pfad',
    (value) => {
      expect(isUncPath(value)).toBe(false);
    },
  );
});

describe('isAbsoluteAttachmentPath', () => {
  it.each(['/home/nutzer', 'C:\\Users', 'C:/Users', 'D:\\x'])('"%s" ist absolut', (value) => {
    expect(isAbsoluteAttachmentPath(value)).toBe(true);
  });

  it.each(['relativ/pfad', 'datei.pdf', '', 'C:ohneSchraegstrich'])('"%s" ist NICHT absolut', (value) => {
    expect(isAbsoluteAttachmentPath(value)).toBe(false);
  });
});

describe('fileExtensionOf — das letzte Punktsegment, kleingeschrieben', () => {
  it('eine gewöhnliche Endung wird erkannt und kleingeschrieben', () => {
    expect(fileExtensionOf('/home/nutzer/BERICHT.PDF')).toBe('pdf');
  });

  // ---------------------------------------------------------------------
  // T-174 (unit-tester): Dieser Fall trug bis hierher die Unix-Sicht ("ein
  // führender Punkt versteckt die Datei und hinterläßt keine Endung"). Das
  // war eine ECHTE Abweichung, kein Geschmack: T-179 (code-reviewer, Auflage
  // A-1) hat gegen die Quelle gemessen, daß `fileExtensionOf('.lnk')` bis
  // dahin `""` ergab, während `has_indirect_extension` in der Hülle
  // (`attachment.rs`, Fall "Name ist nur die Endung") und `extensionOf` in
  // der Oberfläche (`attachmentLabel.ts`) für denselben Namen `"lnk"`
  // liefern und ihn ablehnen — zwei grüne Prüffälle behaupteten Gegenteiliges
  // über dieselbe Fachfrage. Domäne, Hülle und Oberfläche sollen laut
  // `checkAttachmentPath`s eigenem Kopfkommentar "dieselben Fragen, dieselben
  // Schlüssel, dieselbe Folge" stellen (T-178) — für den führenden Punkt
  // stimmte das nicht, und T-179 hat den Fix genannt: `fileExtensionOf`
  // vergleicht jetzt `dot === -1` statt `dot <= 0`. Die Folge: Eine Datei
  // namens `.lnk` fällt jetzt schon an der Tür mit `path_indirect_extension`
  // (siehe Fall weiter unten) und nicht erst am Öffnen-Befehl der Hülle. Der
  // Preis, wörtlich aus T-179: `.gitignore` bekommt die Endung `gitignore`
  // — sie steht auf keiner Liste und ändert nichts.
  it('ein führender Punkt zählt MIT — Windows-Explorer-Sicht, konsistent mit has_indirect_extension in der Hülle (T-179 A-1)', () => {
    expect(fileExtensionOf('/home/nutzer/.bashrc')).toBe('bashrc');
    // Der Preis, ausdrücklich: eine harmlose Punktdatei bekommt jetzt auch
    // eine "Endung", ohne daß sich dadurch etwas ändert -- "gitignore" steht
    // auf keiner Umleitungsliste.
    expect(fileExtensionOf('/home/nutzer/.gitignore')).toBe('gitignore');
  });

  it('ein Punkt am Ende des Namens zählt nicht als Endung', () => {
    expect(fileExtensionOf('/home/nutzer/datei.')).toBe('');
  });

  it('kein Punkt im Namen ergibt eine leere Endung', () => {
    expect(fileExtensionOf('/home/nutzer/README')).toBe('');
  });

  it('mehrere Punkte: nur das letzte Segment zählt', () => {
    expect(fileExtensionOf('/home/nutzer/archiv.tar.gz')).toBe('gz');
  });

  it('funktioniert auch mit Backslash-Trennern', () => {
    expect(fileExtensionOf('C:\\Users\\nutzer\\bericht.docx')).toBe('docx');
  });

  it('ein Pfad ohne jeden Trenner wird als Dateiname behandelt', () => {
    expect(fileExtensionOf('bericht.pdf')).toBe('pdf');
  });
});

// ---------------------------------------------------------------------------
// Bild — imageMediaTypeOf (A-A-16)
// ---------------------------------------------------------------------------

describe('imageMediaTypeOf — erkannt an der Kopfsignatur, nicht an der Endung (A-A-16)', () => {
  it('IMAGE_SIGNATURE_BYTES ist 12 — die Länge der längsten Signatur (WebP)', () => {
    expect(IMAGE_SIGNATURE_BYTES).toBe(12);
  });

  it('PNG: 89 50 4E 47 0D 0A 1A 0A', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(imageMediaTypeOf(bytes)).toBe('image/png');
  });

  it('JPEG: FF D8 FF', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(imageMediaTypeOf(bytes)).toBe('image/jpeg');
  });

  it('GIF: "GIF8"', () => {
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
    expect(imageMediaTypeOf(bytes)).toBe('image/gif');
  });

  it('WebP: "RIFF" ... "WEBP"', () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // Größe, hier ignoriert
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(imageMediaTypeOf(bytes)).toBe('image/webp');
  });

  it('RIFF ohne WEBP dahinter ist kein Bild (z. B. eine WAV-Datei)', () => {
    const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    expect(imageMediaTypeOf(bytes)).toBeNull();
  });

  it('beliebige andere Bytes ergeben null — auch eine EXE-Signatur (MZ)', () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(imageMediaTypeOf(bytes)).toBeNull();
  });

  it('eine leere Byte-Folge ergibt null, ohne zu werfen', () => {
    expect(imageMediaTypeOf(new Uint8Array([]))).toBeNull();
  });

  it('ein zu kurzer Puffer ergibt null, ohne zu werfen (kein Zugriff über das Ende hinaus)', () => {
    expect(imageMediaTypeOf(new Uint8Array([0x89, 0x50]))).toBeNull();
    expect(imageMediaTypeOf(new Uint8Array([0x52, 0x49, 0x46, 0x46]))).toBeNull();
  });

  it('ein SVG (Textdatei, keine Kopfsignatur) wird NICHT erkannt (Bedrohungsmodell 20.5 Punkt 3)', () => {
    // Kein `TextEncoder`: `packages/domain` führt `lib: ["ES2023"]` ohne DOM
    // (siehe Kommentar über `byteLength` in `attachment.ts`) — dieselbe
    // Einschränkung gilt für diese Prüfdatei im selben Projekt. Die Zeichen
    // von `<svg …>` sind reines ASCII, ihr Codepunkt ist ihr Byte.
    const text = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const svg = Uint8Array.from(text, (character) => character.codePointAt(0) ?? 0);
    expect(imageMediaTypeOf(svg)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Beschriftung (A-19.12) — nie eine leere Zeile
// ---------------------------------------------------------------------------

describe('attachmentLabel — nie eine leere Zeile (A-19.12)', () => {
  it('ein gesetzter Titel gewinnt, unabhängig von Art und Ziel', () => {
    expect(attachmentLabel('link', 'Mein Verweis', 'http://example.org/')).toBe('Mein Verweis');
    expect(attachmentLabel('file', 'Mein Dokument', '/home/nutzer/bericht.pdf')).toBe('Mein Dokument');
    expect(attachmentLabel('image', 'Mein Bild', 'erzeugter-name.png')).toBe('Mein Bild');
  });

  it('ein Titel aus lauter Leerzeichen zählt als fehlend', () => {
    expect(attachmentLabel('image', '   ', 'erzeugter-name.png')).toBe('erzeugter-name.png');
  });

  it('null als Titel zählt als fehlend', () => {
    expect(attachmentLabel('image', null, 'erzeugter-name.png')).toBe('erzeugter-name.png');
  });

  // ---------------------------------------------------------------------
  // T-174 (unit-tester), O-EM: die zwei Fälle unten trugen bis hierher die
  // ALTE Regel ("nur der Wirtsname", "nur der Dateiname"). T-168-domain-dev.md
  // hat sie bewusst rot gelassen (die Beschriftung gehört unit-tester) und die
  // NEUE Regel begründet: Ersatzbeschriftung ist der ganze gespeicherte Wert,
  // gekürzt nur um das, was an jedem Anhang derselben Art gleich lautet.
  // `https://` fällt weg (das häufige Schema sagt nichts), `http://` bleibt
  // stehen (Absicht — sonst wären `http://a/b` und `https://a/b` nicht mehr
  // unterscheidbar, siehe den Fall weiter unten). Bei der Datei steht der
  // Name vorn (das Unterscheidende überlebt ein Abschneiden) und der Ordner
  // in Klammern dahinter. Die ALTE Erwartung war nicht bloß veraltet, sondern
  // gemessen falsch im Sinn von X-04: `beispiel.example` und `bericht.pdf`
  // sind genau die Beschriftungen, die zwei verschiedene Anhänge (zwei
  // Ordner, zwei Wirte mit unterschiedlichem Pfad) auf dieselbe Zeichenkette
  // zusammenfallen ließen.
  // ---------------------------------------------------------------------

  it('Verweis ohne Titel: der ganze gespeicherte Wert, nur "https://" entfällt (T-168 O-DU)', () => {
    expect(attachmentLabel('link', null, 'http://beispiel.example/Seite')).toBe(
      'http://beispiel.example/Seite',
    );
  });

  it('Verweis ohne Titel, dessen Ziel sich nicht normalisieren lässt: das Ziel selbst als letzter Rückfall', () => {
    expect(attachmentLabel('link', null, 'kein-gueltiges-ziel')).toBe('kein-gueltiges-ziel');
  });

  it('Verweis ohne Titel und ohne Ziel: das deutsche Wort "Verweis"', () => {
    expect(attachmentLabel('link', null, '')).toBe('Verweis');
  });

  it('Verweis ohne Titel: "https://" entfällt, aber Pfad, Abfrage und Fragment bleiben stehen', () => {
    expect(attachmentLabel('link', null, 'https://beispiel.example/tickets/4711')).toBe(
      'beispiel.example/tickets/4711',
    );
    expect(attachmentLabel('link', null, 'https://beispiel.example/s?call=4711')).toBe(
      'beispiel.example/s?call=4711',
    );
    expect(attachmentLabel('link', null, 'https://beispiel.example/s#abschnitt')).toBe(
      'beispiel.example/s#abschnitt',
    );
  });

  it('Verweis ohne Titel: der Port gehört zum Wirt und bleibt sichtbar', () => {
    expect(attachmentLabel('link', null, 'https://beispiel.example:8443/tickets/4711')).toBe(
      'beispiel.example:8443/tickets/4711',
    );
  });

  it('Verweis ohne Titel: "http://" bleibt SICHTBAR stehen — Absicht, nicht vergessen (T-168 1.4)', () => {
    // Würde "http://" wie "https://" wegfallen, ergäben "http://a/b" und
    // "https://a/b" dieselbe Beschriftung für zwei verschiedene Anhänge —
    // und die Abweichung eines Schemas nach unten wäre nirgends mehr zu sehen
    // (A-A-7: bei einem Verweis fragt Takt vor dem Öffnen nicht zurück).
    expect(attachmentLabel('link', null, 'http://beispiel.example/tickets/4711')).toBe(
      'http://beispiel.example/tickets/4711',
    );
  });

  it('Datei ohne Titel: der Dateiname steht VORN, der Ordner in Klammern dahinter (T-168 O-DU)', () => {
    expect(attachmentLabel('file', null, '/home/nutzer/bericht.pdf')).toBe(
      'bericht.pdf (/home/nutzer/)',
    );
  });

  it('Datei ohne Titel: ein Wurzelordner ("C:\\") bleibt vollständig samt seinem Trenner erhalten', () => {
    expect(attachmentLabel('file', null, 'C:\\rechnung.pdf')).toBe('rechnung.pdf (C:\\)');
  });

  it('Datei ohne Titel und ohne Trenner im Ziel: kein Ordner, also kein Klammerzusatz', () => {
    expect(attachmentLabel('file', null, 'bericht.pdf')).toBe('bericht.pdf');
  });

  it('Datei ohne Titel und ohne Dateinamen (Pfad endet auf einem Trenner): das Ziel selbst als Rückfall', () => {
    expect(attachmentLabel('file', null, '/home/nutzer/')).toBe('/home/nutzer/');
  });

  it('Datei ohne Titel und ohne Ziel: das deutsche Wort "Datei"', () => {
    expect(attachmentLabel('file', null, '')).toBe('Datei');
  });

  it('Bild ohne Titel: der erzeugte Name der Kopie, unverändert', () => {
    expect(attachmentLabel('image', null, '47dda9c4-3d80-4e45.png')).toBe('47dda9c4-3d80-4e45.png');
  });

  it('Bild ohne Titel und ohne Ziel: das deutsche Wort "Bild"', () => {
    expect(attachmentLabel('image', null, '')).toBe('Bild');
  });
});

// ---------------------------------------------------------------------------
// T-174 (unit-tester), O-EM — der eigentliche Inhalt von X-04 (T-165):
// Unterscheidbarkeit statt Zeichenkette.
//
// Die Fälle oben nageln das HEUTIGE Aussehen der Beschriftung fest. Dieser
// Block urteilt über etwas, das auch eine KÜNFTIGE Exportvorlage oder eine
// künftige Wortwahl nicht verletzen darf: Zwei verschiedene Anhänge dürfen
// niemals dieselbe Ersatzbeschriftung tragen — sie ist der zugängliche Name
// des Öffnen- und des Entfernen-Knopfes (T-168-domain-dev.md, Abschnitt 1.2).
// Ein Fall, der nur eine Zeichenkette prüft, hält die Regel nicht fest,
// sondern nur ihr heutiges Aussehen (Auftrag T-174, Punkt O-EM, wörtlich).
// ---------------------------------------------------------------------------

describe('attachmentLabel — zwei verschiedene Anhänge tragen nie dieselbe Ersatzbeschriftung (X-04)', () => {
  it('drei Verweise auf denselben Wirt und zwei gleichnamige Dateien in zwei Ordnern ergeben fünf verschiedene Beschriftungen', () => {
    const anhaenge: readonly ['link' | 'file', string][] = [
      ['link', 'https://beispiel.example/'],
      ['link', 'https://beispiel.example/tickets/4711'],
      ['link', 'https://beispiel.example/support?fall=4711'],
      ['file', '/home/kundeEins/rechnung.pdf'],
      ['file', '/home/kundeZwei/rechnung.pdf'],
    ];

    const beschriftungen = anhaenge.map(([kind, target]) => attachmentLabel(kind, null, target));

    expect(new Set(beschriftungen).size).toBe(beschriftungen.length);
  });

  it('http und https auf demselben Pfad bleiben unterscheidbar, weil "http://" sichtbar bleibt', () => {
    const https = attachmentLabel('link', null, 'https://beispiel.example/tickets/4711');
    const http = attachmentLabel('link', null, 'http://beispiel.example/tickets/4711');
    expect(https).not.toBe(http);
  });

  it('zwei Verweise, die sich nur im Port unterscheiden, bleiben unterscheidbar', () => {
    const ohnePort = attachmentLabel('link', null, 'https://beispiel.example/tickets/4711');
    const mitPort = attachmentLabel('link', null, 'https://beispiel.example:8443/tickets/4711');
    expect(ohnePort).not.toBe(mitPort);
  });

  it('zwei Dateien mit demselben Namen in verschiedenen Ordnern bleiben unterscheidbar (der frühere Befund)', () => {
    const eins = attachmentLabel('file', null, 'C:\\Kunden\\Meier\\rechnung.pdf');
    const zwei = attachmentLabel('file', null, 'C:\\Kunden\\Schulz\\rechnung.pdf');
    expect(eins).not.toBe(zwei);
  });

  it('ein gesetzter Titel ist von der Zusage ausdrücklich ausgenommen — zwei gleiche Titel bleiben gleich', () => {
    // T-168-domain-dev.md, Abschnitt 1.2: Die Zusage "nie dieselbe
    // Beschriftung" gilt für die ERSATZbeschriftung, nicht für den Titel.
    // Nennt der Benutzer zwei Anhänge gleich, heißen sie gleich — das ist
    // seine Entscheidung, und `attachmentLabel` ändert seinen Text nicht.
    const eins = attachmentLabel('link', 'Rechnung', 'https://beispiel.example/eins');
    const zwei = attachmentLabel('file', 'Rechnung', '/home/nutzer/zwei.pdf');
    expect(eins).toBe(zwei);
    expect(eins).toBe('Rechnung');
  });
});
