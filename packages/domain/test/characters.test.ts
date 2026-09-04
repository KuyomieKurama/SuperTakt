/**
 * Takt — T-127, die Ränder der EINEN Zeichenklasse (E-063, T-117, T-119, T-122).
 *
 * `packages/domain/src/characters.ts` ist seit T-122 der maßgebliche Ort dieser
 * Regel: Dienst, Add-in und der Windows-Benutzername lesen sie, statt sie
 * abzuschreiben (T-125, Abschnitt 1.1). Bis heute (T-127) gab es dafür keine
 * eigene Testdatei unter `packages/domain/test/**` — die Klasse wurde bislang
 * nur an ihren vier Lesern gemessen (u. a.
 * `apps/local-api/test/http/input.test.ts`,
 * `apps/outlook-addin/test/text/hidden.test.ts`), nicht an der Quelle selbst.
 * Genau das ist die Lücke aus T-121, Risiko 2 / offene Frage 2: Die Datei lag
 * bei 48 % Zeilenabdeckung im ersten Bericht dieser Aufgabe — die Zahl ist seit
 * T-122 durch die vier Leser auf 97,22 % Anweisungen gewachsen, aber die
 * Ränder waren bislang nirgends an der Quelle selbst nachgewiesen, sondern nur
 * mittelbar über die Wächter, die sie lesen.
 *
 * Gemessen werden hier alle drei Behandlungen aus E-063 (abweisen, fallen
 * lassen, sichtbar machen) und ihre Ränder, wörtlich nach dem Auftrag T-127:
 *
 *   abgewiesen: C0, C1, DEL, die Bidi-Einbettungen/-Überschreibungen und
 *   -Isolate, sowie die drei Marken U+061C/U+200E/U+200F.
 *   angenommen: U+061B, U+061D, U+200B–U+200D (ZWJ hält Emoji zusammen — der
 *   Familien-Emoji-Fall gehört dazu) und U+2010.
 *
 * Und die eine Nuance, die den einzelnen Rand von den drei Behandlungen
 * unterscheidet: Der Steuer-Leerraum aus C0 (`CONTROL_WHITESPACE`,
 * `U+0009`–`U+000D`) wird an der Tür (`hasForbiddenNameCharacter`) genauso
 * abgewiesen wie jedes andere C0-Zeichen — die Tür kennt keine Ausnahme —,
 * bleibt aber für `hasHiddenCharacter`/`dropHiddenCharacters`/`visibleText`
 * unauffällig: Er trennt Wörter und wird nicht als unsichtbares Zeichen
 * behandelt, sondern (in `visibleText`) zu einem gewöhnlichen Leerzeichen.
 *
 * Reine Codepunkt-Prüfung, kein rohes Steuer- oder Richtungszeichen im
 * Quelltext dieser Datei (T-112-H2): jedes Zeichen der Klasse steht als
 * `String.fromCodePoint(...)`.
 */
import { describe, expect, it } from 'vitest';
import {
  CONTROL_WHITESPACE,
  FORBIDDEN_NAME_CHARACTERS,
  FORBIDDEN_NAME_CHARACTER_MESSAGE,
  HIDDEN_MARKER,
  dropHiddenCharacters,
  hasForbiddenNameCharacter,
  hasHiddenCharacter,
  isForbiddenNameCharacter,
  visibleText,
} from '../src/characters.ts';

const c = (codePoint: number): string => String.fromCodePoint(codePoint);

/** Die Familie aus dem T-121-Bericht: Mann–ZWJ–Frau–ZWJ–Mädchen–ZWJ–Junge. */
const FAMILY_EMOJI = `${c(0x1f468)}${c(0x200d)}${c(0x1f469)}${c(0x200d)}${c(0x1f467)}${c(0x200d)}${c(0x1f466)}`;

/**
 * Die Ränder, wörtlich aus dem Auftrag: je ein Codepunkt an jeder genannten
 * Grenze, mit der erwarteten Antwort von {@link isForbiddenNameCharacter}.
 */
const boundaries: ReadonlyArray<{ readonly name: string; readonly codePoint: number; readonly forbidden: boolean }> = [
  // C0 — von der ersten bis zur letzten Stelle, einschließlich des
  // Steuer-Leerraums (Tab, LF, VT, FF, CR liegen mitten in C0).
  { name: 'U+0000 (NUL), erste Stelle von C0', codePoint: 0x0000, forbidden: true },
  { name: 'U+0009 (Tab), Steuer-Leerraum, dennoch Teil von C0', codePoint: 0x0009, forbidden: true },
  { name: 'U+000A (LF), Steuer-Leerraum', codePoint: 0x000a, forbidden: true },
  { name: 'U+000D (CR), letzte Stelle des Steuer-Leerraums', codePoint: 0x000d, forbidden: true },
  { name: 'U+001F, letzte Stelle von C0', codePoint: 0x001f, forbidden: true },
  { name: 'U+0020 (Leerzeichen), erste Stelle NACH C0', codePoint: 0x0020, forbidden: false },
  // DEL und C1.
  { name: 'U+007E (~), letztes druckbares ASCII-Zeichen vor DEL', codePoint: 0x007e, forbidden: false },
  { name: 'U+007F (DEL)', codePoint: 0x007f, forbidden: true },
  { name: 'U+0080, erste Stelle von C1', codePoint: 0x0080, forbidden: true },
  { name: 'U+009F, letzte Stelle von C1', codePoint: 0x009f, forbidden: true },
  { name: 'U+00A0 (NBSP), erste Stelle NACH C1', codePoint: 0x00a0, forbidden: false },
  // Die drei Marken, mit ihren beiden direkten Nachbarn (T-117).
  { name: 'U+061B (arabisches Semikolon), unmittelbar VOR der Marke', codePoint: 0x061b, forbidden: false },
  { name: 'U+061C (ALM), die Marke selbst', codePoint: 0x061c, forbidden: true },
  { name: 'U+061D, unmittelbar NACH der Marke', codePoint: 0x061d, forbidden: false },
  { name: 'U+200B (ZWSP), erlaubter Nachbar VOR LRM/RLM', codePoint: 0x200b, forbidden: false },
  { name: 'U+200C (ZWNJ), erlaubter Nachbar VOR LRM/RLM', codePoint: 0x200c, forbidden: false },
  { name: 'U+200D (ZWJ), erlaubter Nachbar VOR LRM/RLM — hält Emoji zusammen', codePoint: 0x200d, forbidden: false },
  { name: 'U+200E (LRM)', codePoint: 0x200e, forbidden: true },
  { name: 'U+200F (RLM)', codePoint: 0x200f, forbidden: true },
  { name: 'U+2010 (Bindestrich), erlaubter Nachbar NACH RLM', codePoint: 0x2010, forbidden: false },
  // Einbettungen und Überschreibungen.
  { name: 'U+2029, unmittelbar VOR den Einbettungen', codePoint: 0x2029, forbidden: false },
  { name: 'U+202A (LRE), erste Einbettung', codePoint: 0x202a, forbidden: true },
  { name: 'U+202E (RLO), letzte Überschreibung', codePoint: 0x202e, forbidden: true },
  { name: 'U+202F, unmittelbar NACH den Einbettungen', codePoint: 0x202f, forbidden: false },
  // Isolate.
  { name: 'U+2065, unmittelbar VOR den Isolaten (nicht zugewiesen, dennoch Randwert)', codePoint: 0x2065, forbidden: false },
  { name: 'U+2066 (LRI), erstes Isolat', codePoint: 0x2066, forbidden: true },
  { name: 'U+2069 (PDI), letztes Isolat', codePoint: 0x2069, forbidden: true },
  { name: 'U+206A, unmittelbar NACH den Isolaten', codePoint: 0x206a, forbidden: false },
];

describe('isForbiddenNameCharacter — die Codepunktgrenzen der EINEN Klasse (T-117, T-122)', () => {
  it.each(boundaries)('$name → forbidden: $forbidden', ({ codePoint, forbidden }) => {
    expect(isForbiddenNameCharacter(codePoint)).toBe(forbidden);
  });

  it('ein gewöhnlicher Buchstabe und eine Ziffer sind nicht Teil der Klasse', () => {
    expect(isForbiddenNameCharacter('A'.codePointAt(0)!)).toBe(false);
    expect(isForbiddenNameCharacter('7'.codePointAt(0)!)).toBe(false);
    expect(isForbiddenNameCharacter('ß'.codePointAt(0)!)).toBe(false);
  });

  it('jeder Bereich aus FORBIDDEN_NAME_CHARACTERS ist an from und to selbst geschlossen (beide Enden gehören dazu)', () => {
    // Miß die Tür, nicht eine Abschrift der Tür (E-063 Punkt 4): Diese Prüfung
    // liest die exportierte Liste direkt, statt ihre Grenzen ein zweites Mal
    // von Hand aufzuzählen.
    for (const range of FORBIDDEN_NAME_CHARACTERS) {
      expect(isForbiddenNameCharacter(range.from)).toBe(true);
      expect(isForbiddenNameCharacter(range.to)).toBe(true);
    }
  });

  it('kein Bereich ist vertauscht (from <= to) — sonst wäre die Klasse an dieser Stelle still leer', () => {
    for (const range of FORBIDDEN_NAME_CHARACTERS) {
      expect(range.from).toBeLessThanOrEqual(range.to);
    }
  });

  it('CONTROL_WHITESPACE liegt vollständig innerhalb von FORBIDDEN_NAME_CHARACTERS', () => {
    // Die Tür kennt keine Ausnahme für den Steuer-Leerraum — er ist Teil von
    // C0 und wird wie jedes andere C0-Zeichen abgewiesen.
    for (const range of CONTROL_WHITESPACE) {
      expect(isForbiddenNameCharacter(range.from)).toBe(true);
      expect(isForbiddenNameCharacter(range.to)).toBe(true);
    }
  });
});

describe('hasForbiddenNameCharacter — abweisen, die Tür (E-063 Punkt 3)', () => {
  it.each(boundaries)('ein Name aus GENAU "$name" → forbidden: $forbidden', ({ codePoint, forbidden }) => {
    expect(hasForbiddenNameCharacter(c(codePoint))).toBe(forbidden);
  });

  it('ein Zeichen der Klasse MITTEN in einem sonst gewöhnlichen Namen wird erkannt', () => {
    expect(hasForbiddenNameCharacter(`Vor${c(0x202e)}Nach`)).toBe(true);
  });

  it('ein Familien-Emoji (drei ZWJ) bleibt als Titel erlaubt — der Fall, der die Grenze nach unten festnagelt', () => {
    expect(hasForbiddenNameCharacter(FAMILY_EMOJI)).toBe(false);
    expect(hasForbiddenNameCharacter(`Foto ${FAMILY_EMOJI}`)).toBe(false);
  });

  it('eine leere Zeichenkette trägt kein verbotenes Zeichen', () => {
    expect(hasForbiddenNameCharacter('')).toBe(false);
  });

  it('Umlaute, Bindestrich und gewöhnliche Satzzeichen sind erlaubt', () => {
    expect(hasForbiddenNameCharacter('Prüfung – Übergabe, Straße')).toBe(false);
  });

  it('FORBIDDEN_NAME_CHARACTER_MESSAGE nennt Steuer- und Richtungszeichen, aber keinen konkreten Wert', () => {
    expect(FORBIDDEN_NAME_CHARACTER_MESSAGE).toBe(
      'Steuerzeichen und Richtungszeichen sind in einem Namen nicht erlaubt.',
    );
    // Die Meldung darf selbst kein Zeichen der Klasse enthalten — sonst gäbe
    // sie in der Anzeige genau das Zeichen wieder, das sie beschreibt.
    expect(hasForbiddenNameCharacter(FORBIDDEN_NAME_CHARACTER_MESSAGE)).toBe(false);
  });
});

describe('hasHiddenCharacter — die engere Frage OHNE den Steuer-Leerraum (E-063)', () => {
  it('der Steuer-Leerraum (Tab, LF, VT, FF, CR) löst hasHiddenCharacter NICHT aus', () => {
    for (const range of CONTROL_WHITESPACE) {
      expect(hasHiddenCharacter(c(range.from))).toBe(false);
      expect(hasHiddenCharacter(c(range.to))).toBe(false);
    }
    expect(hasHiddenCharacter('Störung\tLüftung')).toBe(false);
    expect(hasHiddenCharacter('Zeile eins\nZeile zwei')).toBe(false);
  });

  it('C1, DEL, Marken, Einbettungen und Isolate lösen hasHiddenCharacter weiterhin aus', () => {
    for (const { codePoint, forbidden } of boundaries) {
      if (!forbidden) continue;
      const isControlWhitespace = codePoint >= 0x0009 && codePoint <= 0x000d;
      expect(hasHiddenCharacter(c(codePoint))).toBe(!isControlWhitespace);
    }
  });

  it('ein Familien-Emoji löst hasHiddenCharacter nicht aus', () => {
    expect(hasHiddenCharacter(FAMILY_EMOJI)).toBe(false);
  });

  it('der RLO-Kernfall aus T-119: "Rechnung" + RLO + "gnp.exe" wird erkannt', () => {
    expect(hasHiddenCharacter(`Rechnung${c(0x202e)}gnp.exe`)).toBe(true);
  });
});

describe('dropHiddenCharacters — fallen lassen, ein Vorschlag aus fremder Quelle (E-063 Punkt 3)', () => {
  it('der RLO-Kernfall: das Zeichen wird ersatzlos entfernt, der Rest bleibt unverändert', () => {
    expect(dropHiddenCharacters(`Rechnung${c(0x202e)}gnp.exe`)).toBe('Rechnunggnp.exe');
  });

  it.each(boundaries.filter((b) => b.forbidden))('$name wird entfernt, sofern kein Steuer-Leerraum', ({ codePoint }) => {
    const isControlWhitespace = codePoint >= 0x0009 && codePoint <= 0x000d;
    const result = dropHiddenCharacters(`Vor${c(codePoint)}Nach`);
    expect(result).toBe(isControlWhitespace ? `Vor${c(codePoint)}Nach` : 'VorNach');
  });

  it.each(boundaries.filter((b) => !b.forbidden))('$name bleibt erhalten', ({ codePoint }) => {
    expect(dropHiddenCharacters(`Vor${c(codePoint)}Nach`)).toBe(`Vor${c(codePoint)}Nach`);
  });

  it('ein Familien-Emoji bleibt vollständig erhalten', () => {
    expect(dropHiddenCharacters(FAMILY_EMOJI)).toBe(FAMILY_EMOJI);
  });

  it('nach dem Fallenlassen löst der Text hasHiddenCharacter nicht mehr aus — die Zusicherung aus dem Kommentar', () => {
    const source = `Rechnung${c(0x202e)}${c(0x200f)}${c(0x061c)}gnp.exe`;
    const cleaned = dropHiddenCharacters(source);
    expect(hasHiddenCharacter(cleaned)).toBe(false);
  });

  it('eine leere Zeichenkette bleibt leer', () => {
    expect(dropHiddenCharacters('')).toBe('');
  });

  it('ein Text ganz ohne verbotene Zeichen bleibt zeichengleich (kein Kopieren mit Nebenwirkung)', () => {
    expect(dropHiddenCharacters('Kesselwartung Ost')).toBe('Kesselwartung Ost');
  });
});

describe('visibleText — sichtbar machen, die Anzeige fremden Textes (E-063 Punkte 1 und 2)', () => {
  it('der RLO-Kernfall: die Marke ersetzt das Zeichen, dreht die Zeile aber nicht mehr um', () => {
    const result = visibleText(`Rechnung${c(0x202e)}gnp.exe`);
    expect(result).toBe(`Rechnung${HIDDEN_MARKER}gnp.exe`);
    expect(hasHiddenCharacter(result)).toBe(false);
  });

  it('der Steuer-Leerraum wird zu GENAU EINEM Leerzeichen, nicht zur Marke', () => {
    expect(visibleText('Störung\tLüftung')).toBe('Störung Lüftung');
    for (const range of CONTROL_WHITESPACE) {
      expect(visibleText(c(range.from))).toBe(' ');
      expect(visibleText(c(range.to))).toBe(' ');
    }
  });

  it.each(boundaries.filter((b) => b.forbidden))('$name wird zur Marke, außer es ist Steuer-Leerraum', ({ codePoint }) => {
    const isControlWhitespace = codePoint >= 0x0009 && codePoint <= 0x000d;
    expect(visibleText(c(codePoint))).toBe(isControlWhitespace ? ' ' : HIDDEN_MARKER);
  });

  it.each(boundaries.filter((b) => !b.forbidden))('$name bleibt in der Anzeige unverändert', ({ codePoint }) => {
    expect(visibleText(c(codePoint))).toBe(c(codePoint));
  });

  it('ein Familien-Emoji bleibt in der Anzeige unverändert', () => {
    expect(visibleText(FAMILY_EMOJI)).toBe(FAMILY_EMOJI);
  });

  it('die Länge bleibt erhalten — ein Zeichen wird zu genau einem Zeichen', () => {
    const source = `Vor${c(0x202e)}${c(0x200f)}Nach`;
    expect([...visibleText(source)].length).toBe([...source].length);
  });

  it('rechtsläufige Schrift (Arabisch, Hebräisch) bleibt unangetastet — kein Angriff, sondern Text', () => {
    const arabic = 'إصلاح الفاتورة';
    const hebrew = 'תיקון החשבונית';
    expect(visibleText(arabic)).toBe(arabic);
    expect(visibleText(hebrew)).toBe(hebrew);
    expect(hasHiddenCharacter(arabic)).toBe(false);
    expect(hasHiddenCharacter(hebrew)).toBe(false);
  });

  it('ein Text ganz ohne verbotene Zeichen bleibt zeichengleich', () => {
    expect(visibleText('Kesselwartung Ost')).toBe('Kesselwartung Ost');
  });

  it('HIDDEN_MARKER ist U+FFFD und liegt selbst NICHT in der Klasse — eine Marke, die sich selbst markieren müsste, wäre keine', () => {
    // HIDDEN_MARKER als Escape-Folge geschrieben, wie in characters.ts
    // selbst (dieselbe Schreibweise wie an der Quelle, kein rohes Zeichen im
    // Testquelltext, T-112-H2).
    expect(HIDDEN_MARKER).toBe('\ufffd');
    expect(isForbiddenNameCharacter(HIDDEN_MARKER.codePointAt(0)!)).toBe(false);
  });
});
