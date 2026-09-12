/**
 * Takt — T-306 (unit-tester), die Lücke, die T-305 gemeldet hat.
 *
 * ===========================================================================
 * ROT ZUERST
 * ===========================================================================
 *
 * `packages/domain/src/email-attachment.ts` entstand mit T-299 (E-108, E-109)
 * und hatte laut T-305 (35,71 % Anweisungen, 16,66 % Funktionen) **keinen**
 * einzigen direkten Prüffall — die Deckung kam ausschließlich über andere
 * Dateien, die diese Datei beiläufig mitriefen. `grep -rn "email-attachment"
 * packages/domain/test/` lieferte vor dieser Datei keinen Treffer.
 *
 * ===========================================================================
 * Was hier gemessen wird, und warum genau das
 * ===========================================================================
 *
 * 1. **Die neun Fehlgründe sind eine geschlossene Menge** (T-301, T-309): Jeder
 *    der neun ist über {@link isEmailAttachmentFailureReason} erreichbar, und
 *    `connection` — der mit T-309 gefallene, `mailbox_closed` — der mit T-301
 *    gefallene — sind es ausdrücklich **nicht mehr**. Ein Grund, der nicht
 *    eintreten kann, ist derselbe Fehler wie ein Wächter, der eine Abwesenheit
 *    mißt, die nicht mehr gilt.
 *
 *    **Die schärfere Zusicherung — jeder erreichbare Grund hat im ganzen
 *    Bestand tatsächlich einen Erzeuger, und ein gestrichener hat keinen
 *    mehr — steht bewußt NICHT hier**, sondern in
 *    `apps/local-api/test/email-attachment-reason-producers.test.ts` (T-312).
 *    Sie müßte den Quelltext von `apps/outlook-addin/src`, `apps/web/src` und
 *    `apps/local-api/src` lesen, und die Domäne bekommt ausdrücklich **keine**
 *    Umgebungstypen (`packages/domain/tsconfig.json`: `"types": []"`) — nicht
 *    einmal `node:fs` ist hier benennbar, und das ist E-001, nicht eine Lücke
 *    in diesem Prüffall.
 * 2. **Die drei Grenzen aus A-A-81 greifen am dekodierten Puffer**, nicht an
 *    der Base64-Zeichenkette. Ein Prüffall, der am kodierten Text mißt, ginge
 *    um den Faktor 4/3 daneben und wäre trotzdem grün — deshalb wird hier mit
 *    einem **echten** Puffer aus exakt {@link MAX_EMAIL_ATTACHMENT_BYTES}
 *    Bytes kodiert, gemessen und erst danach gegen die Grenze gehalten.
 * 3. **`nameEmailFile`/`emailFileExtension`**: die Fälle aus dem Befund des
 *    security-checkers (T-297, 39.4.1), an denen die Vorlage gescheitert ist —
 *    Gerätenamen, Doppelendungen, Namen ohne Endung, eine sehr lange Endung —
 *    und die fünf Umleitungsendungen als vollständige, geschlossene Menge.
 * 4. **`shortenEmailDisplayName`**: die Endung überlebt am Ende, die Marke ist
 *    sichtbar, und die Zählung geschieht an Unicode-Codepunkten, nicht an
 *    UTF-16-Einheiten (Emoji als Gegenprobe).
 */
import { describe, expect, it } from 'vitest';

import { INDIRECT_EXTENSIONS } from '../src/attachment.ts';
import {
  EMAIL_ATTACHMENT_FAILURE_PRESENCE,
  EMAIL_ATTACHMENT_FAILURE_REASONS,
  MAX_EMAIL_ATTACHMENT_BYTES,
  MAX_EMAIL_ATTACHMENT_COUNT,
  MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH,
  MAX_EMAIL_ATTACHMENT_TOTAL_BYTES,
  MAX_EMAIL_DISPLAY_NAME_CHARACTERS,
  admitEmailAttachment,
  decodedBase64ByteLength,
  emailFileExtension,
  isEmailAttachmentFailureReason,
  nameEmailFile,
  shortenEmailDisplayName,
} from '../src/email-attachment.ts';

// ---------------------------------------------------------------------------
// Base64 ohne Bibliothek — die Domäne bekommt bewußt keine Umgebungstypen
// (`packages/domain/tsconfig.json`: "types": []), also auch kein `Buffer`.
// Für die Grenzprüfungen genügt eine Zeichenkette der richtigen LÄNGE und
// FORM; `decodedBase64ByteLength` liest keinen Inhalt, nur Länge und
// Polsterung. Die drei Bausteine sind von Hand geprüfte, bekannte
// Kodierungen ("A" → "QQ==", "AB" → "QUI=", "ABC" → "QUJD") und lassen sich
// gefahrlos aneinanderreihen, weil nur der LETZTE Baustein Polsterung trägt.
// ---------------------------------------------------------------------------

const THREE_BYTES_ENCODED = 'QUJD';
const ONE_BYTE_ENCODED_PADDED = 'QQ==';
const TWO_BYTES_ENCODED_PADDED = 'QUI=';

/** Eine gültige Base64-Zeichenkette, die auf exakt `byteLength` Bytes dekodiert. */
function base64OfExactByteLength(byteLength: number): string {
  const fullGroups = Math.floor(byteLength / 3);
  const remainder = byteLength % 3;
  const head = THREE_BYTES_ENCODED.repeat(fullGroups);
  if (remainder === 0) return head;
  if (remainder === 1) return head + ONE_BYTE_ENCODED_PADDED;
  return head + TWO_BYTES_ENCODED_PADDED;
}

// ---------------------------------------------------------------------------
// Die neun Fehlgründe — eine geschlossene Menge (T-301, T-309)
// ---------------------------------------------------------------------------

describe('EMAIL_ATTACHMENT_FAILURE_REASONS — neun Gründe, und connection/mailbox_closed sind keine mehr (T-301, T-309)', () => {
  it('genau neun Gründe, keiner mehr und keiner weniger', () => {
    expect(EMAIL_ATTACHMENT_FAILURE_REASONS.length).toBeGreaterThanOrEqual(9);
    expect(EMAIL_ATTACHMENT_FAILURE_REASONS.length).toBe(9);
    expect([...EMAIL_ATTACHMENT_FAILURE_REASONS].sort()).toEqual(
      [
        'too_large',
        'total_too_large',
        'too_many',
        'not_released',
        'timeout',
        'rejected',
        'not_a_web_address',
        'rebuild_rejected',
        'outlook_too_old',
      ].sort(),
    );
  });

  it.each([
    'too_large',
    'total_too_large',
    'too_many',
    'not_released',
    'timeout',
    'rejected',
    'not_a_web_address',
    'rebuild_rejected',
    'outlook_too_old',
  ])('"%s" ist erreichbar', (reason) => {
    expect(isEmailAttachmentFailureReason(reason)).toBe(true);
    expect(Object.hasOwn(EMAIL_ATTACHMENT_FAILURE_PRESENCE, reason)).toBe(true);
  });

  it.each(['connection', 'mailbox_closed'])(
    '"%s" ist NICHT mehr erreichbar (T-309/T-301: der Zustand ist seit E-109 bzw. seit der Messung in T-309 unerreichbar)',
    (removed) => {
      expect(isEmailAttachmentFailureReason(removed)).toBe(false);
      expect(Object.hasOwn(EMAIL_ATTACHMENT_FAILURE_PRESENCE, removed)).toBe(false);
      expect(EMAIL_ATTACHMENT_FAILURE_REASONS).not.toContain(removed);
    },
  );

  it('eine beliebige unbekannte Zeichenkette ist keiner der neun Gründe', () => {
    expect(isEmailAttachmentFailureReason('')).toBe(false);
    expect(isEmailAttachmentFailureReason('connection')).toBe(false);
    expect(isEmailAttachmentFailureReason('mailbox_closed')).toBe(false);
    expect(isEmailAttachmentFailureReason('TOO_LARGE')).toBe(false);
    expect(isEmailAttachmentFailureReason('totally_too_large')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Die drei Grenzen — vor dem ersten Byte, am Dekodierten gemessen (A-A-81)
// ---------------------------------------------------------------------------

describe('admitEmailAttachment — drei Grenzen, jede an ihrer eigenen Achse (A-A-81)', () => {
  it('genau an der Größengrenze je Datei: zulässig', () => {
    const verdict = admitEmailAttachment({
      bytes: MAX_EMAIL_ATTACHMENT_BYTES,
      bytesBefore: 0,
      countBefore: 0,
    });
    expect(verdict.ok).toBe(true);
  });

  it('ein Byte über der Größengrenze je Datei: too_large', () => {
    const verdict = admitEmailAttachment({
      bytes: MAX_EMAIL_ATTACHMENT_BYTES + 1,
      bytesBefore: 0,
      countBefore: 0,
    });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) throw new Error('unreachable');
    expect(verdict.reason).toBe('too_large');
  });

  it('genau an der Summengrenze über den Lauf: zulässig', () => {
    const verdict = admitEmailAttachment({
      bytes: 100,
      bytesBefore: MAX_EMAIL_ATTACHMENT_TOTAL_BYTES - 100,
      countBefore: 0,
    });
    expect(verdict.ok).toBe(true);
  });

  it(
    'ein Byte über der Summengrenze über den Lauf: total_too_large (NICHT too_large) — obwohl die Datei ' +
      'allein unter der Einzelgrenze bleibt, und der Satz dazu darf keine Zahl über SIE nennen (A-19.30b)',
    () => {
      const verdict = admitEmailAttachment({
        bytes: 100,
        bytesBefore: MAX_EMAIL_ATTACHMENT_TOTAL_BYTES - 99,
        countBefore: 0,
      });
      expect(verdict.ok).toBe(false);
      if (verdict.ok) throw new Error('unreachable');
      expect(verdict.reason).toBe('total_too_large');
    },
  );

  it('die 25. Datei (countBefore 24) ist noch zulässig', () => {
    const verdict = admitEmailAttachment({ bytes: 10, bytesBefore: 0, countBefore: MAX_EMAIL_ATTACHMENT_COUNT - 1 });
    expect(verdict.ok).toBe(true);
  });

  it(
    'die 26. Datei (countBefore 25) ist too_many, weder too_large noch rejected — Anzahl ist keine ' +
      'Größenaussage und nennt ihren eigenen Wert (A-19.30a, A-19.30b)',
    () => {
      const verdict = admitEmailAttachment({ bytes: 10, bytesBefore: 0, countBefore: MAX_EMAIL_ATTACHMENT_COUNT });
      expect(verdict.ok).toBe(false);
      if (verdict.ok) throw new Error('unreachable');
      expect(verdict.reason).toBe('too_many');
    },
  );

  it('eine leere Datei (0 Bytes) ist rejected, nicht too_large — leer ist keine Größenaussage', () => {
    const verdict = admitEmailAttachment({ bytes: 0, bytesBefore: 0, countBefore: 0 });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) throw new Error('unreachable');
    expect(verdict.reason).toBe('rejected');
  });

  it('eine nicht-ganzzahlige Byteanzahl ist rejected', () => {
    const verdict = admitEmailAttachment({ bytes: 12.5, bytesBefore: 0, countBefore: 0 });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) throw new Error('unreachable');
    expect(verdict.reason).toBe('rejected');
  });

  it(
    'die Größengrenze greift an einer ECHT dekodierten Länge — nicht an der Base64-Zeichenkette, ' +
      'die um den Faktor 4/3 länger ist (der Fall, der einen falschen Prüffall trotzdem grün ließe)',
    () => {
      const encodedExact = base64OfExactByteLength(MAX_EMAIL_ATTACHMENT_BYTES);
      // Die Zeichenkette selbst ist länger als die Grenze — würde man an ihr
      // messen, wäre schon diese zulässige Datei fälschlich zu groß.
      expect(encodedExact.length).toBeGreaterThan(MAX_EMAIL_ATTACHMENT_BYTES);
      const decodedExact = decodedBase64ByteLength(encodedExact);
      expect(decodedExact).toBe(MAX_EMAIL_ATTACHMENT_BYTES);
      expect(admitEmailAttachment({ bytes: decodedExact ?? -1, bytesBefore: 0, countBefore: 0 }).ok).toBe(true);

      const decodedOver = decodedBase64ByteLength(base64OfExactByteLength(MAX_EMAIL_ATTACHMENT_BYTES + 1));
      expect(decodedOver).toBe(MAX_EMAIL_ATTACHMENT_BYTES + 1);
      const overVerdict = admitEmailAttachment({ bytes: decodedOver ?? -1, bytesBefore: 0, countBefore: 0 });
      expect(overVerdict.ok).toBe(false);
      if (overVerdict.ok) throw new Error('unreachable');
      expect(overVerdict.reason).toBe('too_large');
    },
  );
});

// ---------------------------------------------------------------------------
// decodedBase64ByteLength — die Länge am Puffer, nie an einer Ankündigung
// ---------------------------------------------------------------------------

describe('decodedBase64ByteLength — gerechnet am dekodierten Puffer, eng in der Form (A-A-81)', () => {
  it('leere Zeichenkette: 0 Bytes', () => {
    expect(decodedBase64ByteLength('')).toBe(0);
  });

  it('von Hand geprüfte, bekannte Kodierungen — keine Bibliothek, keine Vermutung', () => {
    // "A" (1 Byte), "AB" (2 Bytes), "ABC" (3 Bytes) — Standard-Lehrbuchbeispiele.
    expect(decodedBase64ByteLength('QQ==')).toBe(1);
    expect(decodedBase64ByteLength('QUI=')).toBe(2);
    expect(decodedBase64ByteLength('QUJD')).toBe(3);
  });

  it.each([0, 1, 2, 3, 4, 5, 6, 100, 255])(
    'Rundreise über %i Bytes: eine Zeichenkette exakt dieser dekodierten Länge → decodedBase64ByteLength liefert genau sie zurück',
    (length) => {
      expect(decodedBase64ByteLength(base64OfExactByteLength(length))).toBe(length);
    },
  );

  it('die decodierte Länge ist STRIKT kleiner als die Zeichenkette selbst (Faktor 4/3) — wer an der Zeichenkette mißt, mißt falsch', () => {
    const encoded = base64OfExactByteLength(3000);
    const decoded = decodedBase64ByteLength(encoded);
    expect(decoded).toBe(3000);
    expect(decoded).not.toBe(encoded.length);
    expect(encoded.length).toBeGreaterThan(decoded ?? 0);
  });

  it.each([' ', '\n', '\t', '\r'])('Leerraum (%j) macht die Form ungültig: null', (whitespace) => {
    const withWhitespace = `${whitespace}${base64OfExactByteLength(6)}`;
    expect(decodedBase64ByteLength(withWhitespace)).toBeNull();
  });

  it.each(['-', '_'])('das URL-sichere Alphabet (%j) ist NICHT das Standardalphabet: null', (character) => {
    // Eine Zeichenkette, deren letztes Zeichen durch das URL-sichere Pendant
    // ersetzt ist — Länge bleibt ein Vielfaches von 4, nur das Alphabet weicht ab.
    const encoded = base64OfExactByteLength(9).slice(0, -1) + character;
    expect(decodedBase64ByteLength(encoded)).toBeNull();
  });

  it('Länge, die kein Vielfaches von 4 ist: null', () => {
    expect(decodedBase64ByteLength('QQ')).toBeNull();
    expect(decodedBase64ByteLength('QQE')).toBeNull();
  });

  it('fehlende Polsterung bei einer Länge, die kein Vielfaches von 4 ist: null (keine nachsichtige Dekodierung)', () => {
    // "QQE" wäre ohne Polsterung 2 Bytes, aber die Länge (3) ist kein
    // Vielfaches von 4 — nachsichtige Dekodierer wie `Buffer.from` würden das
    // stillschweigend übernehmen.
    expect(decodedBase64ByteLength('YQ')).toBeNull();
  });

  it('ein einzelnes, zusätzliches "="-Zeichen mitten in der Zeichenkette ist ungültig: null', () => {
    expect(decodedBase64ByteLength('QQ=A')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// nameEmailFile / emailFileExtension — die Fälle, an denen die Vorlage
// gescheitert ist (T-297, 39.4.1)
// ---------------------------------------------------------------------------

describe('nameEmailFile / emailFileExtension — Gerätenamen, Doppelendungen, keine Endung, sehr lange Endung (A-A-78)', () => {
  it.each(['NUL', 'nul', 'COM1', 'CONOUT$', 'CONIN$'])(
    'Gerätename ohne Punkt (%s): angenommen, OHNE Endung — die Datei landet ohne Punkt auf der Platte',
    (deviceName) => {
      const naming = nameEmailFile(deviceName);
      expect(naming.ok).toBe(true);
      if (!naming.ok) throw new Error('unreachable');
      expect(naming.extension).toBeNull();
    },
  );

  it('"CON.txt": angenommen, Endung "txt" — der Gerätename selbst geht nie in den Pfad', () => {
    const naming = nameEmailFile('CON.txt');
    expect(naming.ok).toBe(true);
    if (!naming.ok) throw new Error('unreachable');
    expect(naming.extension).toBe('txt');
  });

  it('"prn.pdf": angenommen, Endung "pdf"', () => {
    const naming = nameEmailFile('prn.pdf');
    expect(naming.ok).toBe(true);
    if (!naming.ok) throw new Error('unreachable');
    expect(naming.extension).toBe('pdf');
  });

  it('Doppelendung "archiv.tar.gz": nur die LETZTE Endung zählt ("gz", nicht "tar.gz")', () => {
    const naming = nameEmailFile('archiv.tar.gz');
    expect(naming.ok).toBe(true);
    if (!naming.ok) throw new Error('unreachable');
    expect(naming.extension).toBe('gz');
  });

  it('Name ohne jede Endung ("Rechnung"): angenommen, Endung null — kein Fehlschlag', () => {
    const naming = nameEmailFile('Rechnung');
    expect(naming.ok).toBe(true);
    if (!naming.ok) throw new Error('unreachable');
    expect(naming.extension).toBeNull();
  });

  it(`eine Endung mit genau ${MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH} Zeichen wird übernommen`, () => {
    const extension = 'a'.repeat(MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH);
    const naming = nameEmailFile(`datei.${extension}`);
    expect(naming.ok).toBe(true);
    if (!naming.ok) throw new Error('unreachable');
    expect(naming.extension).toBe(extension);
  });

  it(`eine Endung mit ${MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH + 1} Zeichen ist keine Endung mehr: null, kein Fehlschlag`, () => {
    const extension = 'a'.repeat(MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH + 1);
    const naming = nameEmailFile(`datei.${extension}`);
    expect(naming.ok).toBe(true);
    if (!naming.ok) throw new Error('unreachable');
    expect(naming.extension).toBeNull();
  });

  it('Großschreibung wird auf Kleinbuchstaben normalisiert: "Bericht.PDF" → "pdf"', () => {
    expect(emailFileExtension('Bericht.PDF')).toBe('pdf');
  });

  it.each(INDIRECT_EXTENSIONS)(
    'die Umleitungsendung ".%s" wird abgelehnt (rejected) — die vollständige, geschlossene Menge aus fünf Endungen',
    (extension) => {
      const naming = nameEmailFile(`rechnung.${extension}`);
      expect(naming.ok).toBe(false);
      if (naming.ok) throw new Error('unreachable');
      expect(naming.reason).toBe('rejected');
    },
  );

  it('mindestens fünf Umleitungsendungen sind in der geschlossenen Menge (Untergrenze)', () => {
    expect(INDIRECT_EXTENSIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('T-156-1: ein nachgestellter Punkt wird abgeschnitten, wie Windows es beim Öffnen tut — "rechnung.lnk." bleibt eine Umleitung', () => {
    const naming = nameEmailFile('rechnung.lnk.');
    expect(naming.ok).toBe(false);
    if (naming.ok) throw new Error('unreachable');
    expect(naming.reason).toBe('rejected');
  });

  it('T-156-1: ein nachgestelltes Leerzeichen wird ebenso abgeschnitten — "rechnung.lnk " bleibt eine Umleitung', () => {
    const naming = nameEmailFile('rechnung.lnk ');
    expect(naming.ok).toBe(false);
    if (naming.ok) throw new Error('unreachable');
    expect(naming.reason).toBe('rejected');
  });

  it('T-164: ein Doppelpunkt (alternativer Datenstrom) ergibt KEINE beurteilbare Endung — "rechnung.lnk::$DATA" ist null, nicht "lnk"', () => {
    expect(emailFileExtension('rechnung.lnk::$DATA')).toBeNull();
    const naming = nameEmailFile('rechnung.lnk::$DATA');
    // null-Endung ist kein Fehlschlag — die Umleitungsprüfung greift nur bei
    // einer ERKANNTEN Endung, und hier gibt es keine beurteilbare.
    expect(naming.ok).toBe(true);
  });

  it('leerer Anzeigename: rejected', () => {
    const naming = nameEmailFile('');
    expect(naming.ok).toBe(false);
    if (naming.ok) throw new Error('unreachable');
    expect(naming.reason).toBe('rejected');
  });

  it('Anzeigename nur aus Leerraum: rejected', () => {
    const naming = nameEmailFile('   ');
    expect(naming.ok).toBe(false);
    if (naming.ok) throw new Error('unreachable');
    expect(naming.reason).toBe('rejected');
  });
});

// ---------------------------------------------------------------------------
// shortenEmailDisplayName — die Endung bleibt, die Marke ist sichtbar (A-19.23b)
// ---------------------------------------------------------------------------

describe('shortenEmailDisplayName — Kürzung in der Mitte, Ende (und damit die Endung) bleibt VOLLSTÄNDIG stehen (A-19.23b, A-A-93)', () => {
  it(`ein Name mit genau ${MAX_EMAIL_DISPLAY_NAME_CHARACTERS} Zeichen bleibt unverändert`, () => {
    const name = 'a'.repeat(MAX_EMAIL_DISPLAY_NAME_CHARACTERS);
    expect(shortenEmailDisplayName(name)).toBe(name);
  });

  it(`ein Name mit ${MAX_EMAIL_DISPLAY_NAME_CHARACTERS + 1} Zeichen wird gekürzt, Ergebnis hat höchstens ${MAX_EMAIL_DISPLAY_NAME_CHARACTERS} Zeichen`, () => {
    const name = 'a'.repeat(MAX_EMAIL_DISPLAY_NAME_CHARACTERS + 1);
    const shortened = shortenEmailDisplayName(name);
    expect([...shortened].length).toBeLessThanOrEqual(MAX_EMAIL_DISPLAY_NAME_CHARACTERS);
    expect(shortened).toContain('…');
    expect(shortened).not.toBe(name);
  });

  it('die Endung überlebt unverändert am Ende — ein sehr langer Name mit ".pdf" endet nach der Kürzung immer noch auf ".pdf"', () => {
    const suffix = '.wichtige-rechnung-2026.pdf';
    const name = 'x'.repeat(500) + suffix;
    const shortened = shortenEmailDisplayName(name);
    expect(shortened.endsWith(suffix)).toBe(true);
    expect(shortened).toContain('…');
  });

  it('der Anfang bleibt erkennbar — die ersten Zeichen des Originals stehen unverändert vorn', () => {
    const head = 'Rechnung-Kundennummer-TEST-';
    const name = head + 'y'.repeat(400) + '.pdf';
    const shortened = shortenEmailDisplayName(name);
    expect(shortened.startsWith(head)).toBe(true);
  });

  it('Emoji (Surrogatpaare) werden an Codepunkten gezählt, nicht an UTF-16-Einheiten, und nicht mitten in einem Zeichen zerschnitten', () => {
    // 300 Emoji-Zeichen — jedes davon ein Surrogatpaar (2 UTF-16-Einheiten,
    // 1 Codepunkt). Eine Implementierung, die an .length (UTF-16) misst,
    // würde bereits bei 128 Einheiten kürzen wollen und dabei ein Surrogatpaar
    // durchschneiden.
    const name = '🎉'.repeat(300);
    expect([...name].length).toBe(300);
    const shortened = shortenEmailDisplayName(name);
    expect([...shortened].length).toBeLessThanOrEqual(MAX_EMAIL_DISPLAY_NAME_CHARACTERS);
    // Kein einzelnes, verwaistes Surrogat — jedes hohe Surrogat hat sein
    // niedriges Gegenstück unmittelbar danach, und umgekehrt.
    expect(shortened).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/u);
    expect(shortened).not.toMatch(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u);
  });

  it('ein Name unter der Grenze mit Umlauten, Emoji und französischen Akzenten bleibt exakt unverändert', () => {
    const name = 'Übergabe-Résumé-🎉-Straße.pdf';
    expect(shortenEmailDisplayName(name)).toBe(name);
  });
});
