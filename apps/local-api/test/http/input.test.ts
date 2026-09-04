/**
 * Takt — T-105, H-2: `titleSchema`/`nameSchema` weisen Steuer- und
 * Richtungszeichen ab (`apps/local-api/src/http/input.ts`, Auftrag aus
 * `reports/T-101-domain-dev.md` "Nächster Schritt" 2 / R-3a H-2).
 *
 * Erweitert um die Ränder der um drei Marken gewachsenen Klasse aus T-117
 * (Auftrag T-121, Risiko R1 aus `reports/T-117-domain-dev.md`: "Der Kopf
 * nennt „zwei Klassen … `U+202A`–`U+202E`, `U+2066`–`U+2069`". Es sind drei
 * Bauarten … für die Marken fehlen die Fälle").
 *
 * Bislang ohne eigene Testdatei: kein Test unter `apps/local-api/test` rief
 * `titleSchema` oder `nameSchema` je auf.
 *
 * Zwei Klassen sind abgewiesen (Kopfkommentar der Quelldatei), die zweite in
 * drei Bauarten:
 *
 *  - **C0/C1** — `U+0000`–`U+001F`, `U+007F`–`U+009F`.
 *  - **Bidirektionale Formatierungszeichen**, alle drei Bauarten:
 *      - **Einbettungen und Überschreibungen** — `U+202A`–`U+202E`.
 *      - **Isolate** — `U+2066`–`U+2069`.
 *      - **Marken** (seit T-117) — `U+061C` (ALM), `U+200E` (LRM),
 *        `U+200F` (RLM).
 *
 * Genau an den Rändern dieser Bereiche wird hier geprüft: das letzte
 * abgewiesene und das erste wieder erlaubte Zeichen auf jeder Seite. Ein
 * Bereich, der beim Übertragen der Regel in einen anderen Vergleichsoperator
 * (`<` statt `<=`) um eins verrutscht, fällt hier auf — nicht bei einem Wert
 * mitten im Bereich. Bei den Marken sind es zwei Ränder: `U+061C` steht
 * allein zwischen `U+061B` und `U+061D`, `U+200E`/`U+200F` stehen als Paar
 * zwischen dem Bereich `U+200B`–`U+200D` und `U+2010`.
 *
 * Ausdrücklich ERLAUBT und eigens geprüft: `U+200B`–`U+200D` (ZWSP, ZWNJ,
 * ZWJ — das letzte davon hält zusammengesetzte Emoji zusammen; ein
 * Familien-Emoji über ZWJ ist deshalb als eigener Fall dabei, er zieht die
 * Grenze nach unten fest) und `U+2010`.
 *
 * Umlaute, Emoji und Leerzeichen INNERHALB des Namens sind ausdrücklich NICHT
 * erfasst (Kopfkommentar: "Leerzeichen und Tabulator sind zwei verschiedene
 * Fälle"). Keine echten Call-Nummern, Kundennamen oder Zugangsdaten — alle
 * Namen unten sind erfunden.
 */
import { describe, expect, it } from 'vitest';
import { nameSchema, titleSchema } from '../../src/http/input.ts';

const CONTROL_MESSAGE = 'Steuerzeichen und Richtungszeichen sind in einem Namen nicht erlaubt.';

describe('titleSchema / nameSchema — gültige Namen mit Umlauten, Emoji und Leerzeichen innen', () => {
  it('Umlaute, scharfes ß und ein Emoji mitten im Text sind erlaubt', () => {
    const value = 'Café Müller — Rückruf nötig 😀 Support';
    const result = titleSchema.safeParse(value);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(value);
  });

  it('mehrere Leerzeichen INNERHALB des Namens sind erlaubt (U+0020 ist nicht erfasst)', () => {
    const value = 'Ein   Name   mit   vielen   Leerzeichen';
    const result = titleSchema.safeParse(value);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(value);
  });

  it('führende und nachgestellte Leerzeichen werden getrimmt (kein Fehler, nur eine Umformung)', () => {
    const result = nameSchema.safeParse('  Ost  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('Ost');
  });

  it('nameSchema erlaubt dieselben Zeichen wie titleSchema (gemeinsame Prüfung, siehe Kopfkommentar der Quelldatei)', () => {
    const result = nameSchema.safeParse('Nord-Straße ü 🎉');
    expect(result.success).toBe(true);
  });
});

describe('titleSchema / nameSchema — C0 (U+0000–U+001F): abgewiesen, Grenze bei U+001F/U+0020', () => {
  it('U+0000 (NUL) mitten im Namen wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u0000Nach');
    expect(result.success).toBe(false);
  });

  it('U+0009 (Tabulator) INNERHALB des Namens wird abgewiesen — anders als das Leerzeichen', () => {
    const result = titleSchema.safeParse('Vor\tNach');
    expect(result.success).toBe(false);
  });

  it('U+001F, das letzte C0-Zeichen, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u001fNach');
    expect(result.success).toBe(false);
  });

  it('U+0020 (Leerzeichen), das erste NICHT mehr erfasste Zeichen direkt danach, ist weiterhin erlaubt', () => {
    const result = titleSchema.safeParse('Vor Nach');
    expect(result.success).toBe(true);
  });
});

describe('titleSchema / nameSchema — C1 (U+007F–U+009F): abgewiesen, Grenze bei U+007E/U+007F und U+009F/U+00A0', () => {
  it('U+007E (Tilde), das letzte druckbare ASCII-Zeichen direkt davor, ist erlaubt', () => {
    const result = titleSchema.safeParse('Vor~Nach');
    expect(result.success).toBe(true);
  });

  it('U+007F (DEL), das erste C1-Zeichen, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u007fNach');
    expect(result.success).toBe(false);
  });

  it('U+009F, das letzte C1-Zeichen, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u009fNach');
    expect(result.success).toBe(false);
  });

  it('U+00A0 (geschütztes Leerzeichen), direkt nach dem C1-Bereich, ist erlaubt', () => {
    const result = titleSchema.safeParse('Vor Nach');
    expect(result.success).toBe(true);
  });
});

describe('titleSchema / nameSchema — Bidi-Steuerzeichen U+202A–U+202E: abgewiesen, Grenze bei U+2029/U+202A und U+202E/U+202F', () => {
  it('U+2029 (Absatztrenner), direkt vor dem Bidi-Bereich, ist NICHT erfasst und bleibt erlaubt', () => {
    const result = titleSchema.safeParse('Vor Nach');
    expect(result.success).toBe(true);
  });

  it('U+202A (LRE), das erste Zeichen des Bereichs, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u202aNach');
    expect(result.success).toBe(false);
  });

  it('U+202E (RLO) — das Zeichen, das eine Zeile optisch umdreht — wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u202eNach');
    expect(result.success).toBe(false);
  });

  it('U+202F (schmales geschütztes Leerzeichen), direkt nach dem Bereich, ist erlaubt', () => {
    const result = titleSchema.safeParse('Vor Nach');
    expect(result.success).toBe(true);
  });
});

describe('titleSchema / nameSchema — Bidi-Steuerzeichen U+2066–U+2069: abgewiesen, Grenze bei U+2065/U+2066 und U+2069/U+206A', () => {
  it('U+2065 , direkt vor dem Bereich, ist NICHT erfasst und bleibt erlaubt', () => {
    const result = titleSchema.safeParse('Vor\u2065Nach');
    expect(result.success).toBe(true);
  });

  it('U+2066 (LRI), das erste Zeichen des Bereichs, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u2066Nach');
    expect(result.success).toBe(false);
  });

  it('U+2069 (PDI), das letzte Zeichen des Bereichs, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u2069Nach');
    expect(result.success).toBe(false);
  });

  it('U+206A, direkt nach dem Bereich, ist erlaubt', () => {
    const result = titleSchema.safeParse('Vor\u206aNach');
    expect(result.success).toBe(true);
  });
});

describe('titleSchema / nameSchema — die Marken aus T-117 (ALM U+061C, LRM U+200E, RLM U+200F): abgewiesen, ihre Nachbarn bleiben erlaubt', () => {
  it('U+061B (arabisches Semikolon), direkt vor der Marke, bleibt erlaubt', () => {
    const result = titleSchema.safeParse('Vor\u061bNach');
    expect(result.success).toBe(true);
  });

  it('U+061C (ALM — Arabic Letter Mark), die Marke selbst, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u061cNach');
    expect(result.success).toBe(false);
  });

  it('U+061D, direkt nach der Marke, bleibt erlaubt', () => {
    const result = titleSchema.safeParse('Vor\u061dNach');
    expect(result.success).toBe(true);
  });

  it('U+200B (ZWSP), U+200C (ZWNJ) und U+200D (ZWJ) bleiben erlaubt — sie haben keine Richtungswirkung', () => {
    expect(titleSchema.safeParse('Vor\u200bNach').success).toBe(true);
    expect(titleSchema.safeParse('Vor\u200cNach').success).toBe(true);
    expect(titleSchema.safeParse('Vor\u200dNach').success).toBe(true);
  });

  it('ein Familien-Emoji, über U+200D (ZWJ) zusammengehalten, bleibt als Titel erlaubt — der Wächter richtet sich gegen Richtungszeichen, nicht gegen Emoji', () => {
    // Vier Personen-Emoji, je durch ein ZWJ verbunden (ein Familien-Emoji).
    // Würde U+200D abgewiesen, könnte ein Todo mit diesem Titel nicht
    // angelegt werden, obwohl kein Zeichen darin die Zeile umdreht.
    const familyEmoji = '\u{1f468}\u200d\u{1f469}\u200d\u{1f467}\u200d\u{1f466}';
    const result = titleSchema.safeParse(`Familientermin ${familyEmoji}`);
    expect(result.success).toBe(true);
  });

  it('U+200E (LRM), die erste der beiden Richtungsmarken, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u200eNach');
    expect(result.success).toBe(false);
  });

  it('U+200F (RLM), die zweite der beiden Richtungsmarken, wird abgewiesen', () => {
    const result = titleSchema.safeParse('Vor\u200fNach');
    expect(result.success).toBe(false);
  });

  it('U+2010 (Bindestrich), jenseits der beiden Marken, bleibt erlaubt', () => {
    const result = titleSchema.safeParse('Vor\u2010Nach');
    expect(result.success).toBe(true);
  });

  it('nameSchema weist dieselben drei Marken ab wie titleSchema (gemeinsame Prüfung, siehe Kopfkommentar der Quelldatei)', () => {
    expect(nameSchema.safeParse('Regel\u061c').success).toBe(false);
    expect(nameSchema.safeParse('Regel\u200e').success).toBe(false);
    expect(nameSchema.safeParse('Regel\u200f').success).toBe(false);
  });
});

describe('titleSchema / nameSchema — die Fehlermeldung ist fest und nennt den abgewiesenen Wert NICHT (B-4.3 Punkt 5)', () => {
  it('die Meldung ist wortgleich, unabhängig davon, welches verbotene Zeichen den Fehler auslöst', () => {
    const withBell = titleSchema.safeParse('Vor\u0007Nach');
    const withRlo = titleSchema.safeParse('Vor\u202eNach');
    expect(withBell.success).toBe(false);
    expect(withRlo.success).toBe(false);
    if (withBell.success || withRlo.success) return;
    expect(withBell.error.issues[0]?.message).toBe(CONTROL_MESSAGE);
    expect(withRlo.error.issues[0]?.message).toBe(CONTROL_MESSAGE);
  });

  it('der abgewiesene Wert selbst steht in KEINER Meldung — weder das Steuerzeichen noch der umliegende Text', () => {
    const value = 'Vertraulicher Titel\u0007mit Steuerzeichen';
    const result = titleSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (result.success) return;
    const allMessages = result.error.issues.map((issue) => issue.message).join(' | ');
    expect(allMessages).not.toContain('Vertraulicher Titel');
    expect(allMessages).not.toContain('\u0007');
  });
});
