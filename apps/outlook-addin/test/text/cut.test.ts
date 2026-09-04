/**
 * Takt — `apps/outlook-addin/src/text/cut.ts` (T-119, Auftrag T-121 Punkt 2).
 *
 * `cutToCharacterBoundary` ist eine reine Funktion (kein Baum, kein Ereignis,
 * keine Uhr — E-062): Sie kürzt eine Zeichenkette auf höchstens `limit`
 * UTF-16-Einheiten, ohne ein zweiteiliges Zeichen (eine Ersatzpaar-Folge) zu
 * zerschneiden.
 *
 * ---------------------------------------------------------------------------
 * Der Kern: eine halbierte Ersatzstelle übersteht den Base64-Weg nicht
 * ---------------------------------------------------------------------------
 *
 * Das ist der Nachweis, den integration-dev in T-119 gemessen hat (Bericht
 * Abschnitt 5): `slice(0, n)` kann mitten durch ein Ersatzpaar schneiden und
 * eine einzelne hohe Ersatzstelle stehen lassen — kein wohlgeformter
 * Unicode-Text. `toBase64`/`fromBase64` (`packages/export/src/base64.ts`)
 * ersetzen eine solche Stelle durch `U+FFFD`, exakt wie es der Export mit
 * einer Notiz täte, die so gekürzt in die Datenbank gelangt wäre. Diese Datei
 * importiert die beiden Funktionen über einen relativen Dateipfad — genau wie
 * `scripts/proof-addin.mjs` es an derselben Stelle bereits tut (`:156`) — statt
 * eine Paketabhängigkeit zu behaupten, die es nicht gibt: `@takt/outlook-addin`
 * führt `@takt/export` nicht in seiner Abhängigkeitsliste, und daran ändert ein
 * Test nichts.
 *
 * Keine echten Call-Nummern, Kundennamen oder Zugangsdaten: Die Titel und
 * Betreffe unten sind erfunden.
 */
import { describe, expect, it } from "vitest";
import { cutToCharacterBoundary } from "../../src/text/cut.ts";
// Relativer Dateipfad statt einer Paketabhängigkeit — siehe Kopfkommentar und
// `scripts/proof-addin.mjs:156` für denselben Weg im Nachweispfad des Add-ins.
import { fromBase64, toBase64 } from "../../../../packages/export/src/base64.ts";

/** 🧑 (U+1F9D1), ein Emoji aus genau einem Ersatzpaar — zwei UTF-16-Einheiten. */
const PERSON_EMOJI = "\u{1f9d1}";

describe("cutToCharacterBoundary — bleibt unter dem Limit unverändert", () => {
  it("eine Zeichenkette, die kürzer als das Limit ist, kommt unverändert zurück", () => {
    expect(cutToCharacterBoundary("Kesselwartung", 500)).toBe("Kesselwartung");
  });

  it("eine Zeichenkette, die GENAU das Limit trifft, kommt unverändert zurück", () => {
    const value = "1234567890";
    expect(cutToCharacterBoundary(value, 10)).toBe(value);
    expect(cutToCharacterBoundary(value, 10)).toHaveLength(10);
  });
});

describe("cutToCharacterBoundary — kürzt an einer Zeichengrenze, nicht mitten im Ersatzpaar", () => {
  it("ein reiner ASCII-Text wird ohne Verlust auf das Limit gekürzt", () => {
    const value = "Vor Nach Vor Nach";
    expect(cutToCharacterBoundary(value, 8)).toBe("Vor Nach");
    expect(cutToCharacterBoundary(value, 8)).toHaveLength(8);
  });

  it("fällt das Limit MITTEN in ein Ersatzpaar, wird die ganze letzte Figur fallen gelassen (Ergebnis: limit - 1)", () => {
    // "AB" + Emoji (2 Einheiten) => Länge 4. Limit 3 liegt genau zwischen den
    // beiden Hälften des Ersatzpaars.
    const value = `AB${PERSON_EMOJI}`;
    expect(value).toHaveLength(4);

    const result = cutToCharacterBoundary(value, 3);
    expect(result).toBe("AB");
    expect(result).toHaveLength(2);
  });

  it("fällt das Limit GENAU auf das Ende eines Ersatzpaars, bleibt die Figur vollständig erhalten (Ergebnis: limit)", () => {
    const value = `AB${PERSON_EMOJI}CD`;
    const result = cutToCharacterBoundary(value, 4);
    expect(result).toBe(`AB${PERSON_EMOJI}`);
    expect(result).toHaveLength(4);
    // Gegenprobe: Das Ergebnis ist wohlgeformt — for...of liefert genau drei
    // Codepunkte (A, B, das Emoji als EIN Codepunkt), keine Ersatzstelle lose.
    expect([...result]).toHaveLength(3);
  });

  it("das Ergebnis ist nie länger als `limit`, aber höchstens eine Einheit kürzer", () => {
    const value = `AB${PERSON_EMOJI}CD`;
    for (let limit = 0; limit <= value.length; limit += 1) {
      const result = cutToCharacterBoundary(value, limit);
      expect(result.length).toBeLessThanOrEqual(limit);
      expect(result.length).toBeGreaterThanOrEqual(limit - 1);
    }
  });

  it("Limit 0 ergibt die leere Zeichenkette, kein Absturz an charCodeAt(-1)", () => {
    expect(cutToCharacterBoundary(`${PERSON_EMOJI}`, 0)).toBe("");
  });
});

describe("cutToCharacterBoundary — der Kern: eine halbierte Ersatzstelle übersteht den Base64-Weg nicht (T-119)", () => {
  it("Gegenprobe: der ALTE Schnitt (`slice`, ohne Zeichengrenze) hinterlässt eine halbe Ersatzstelle, die den Hin- und Rückweg über Base64 NICHT übersteht", () => {
    const value = `AB${PERSON_EMOJI}`;
    const naive = value.slice(0, 3); // schneidet mitten durch das Ersatzpaar

    expect(naive).toHaveLength(3);
    // Eine einzelne hohe Ersatzstelle ist kein wohlgeformter Unicode-Text.
    expect(fromBase64(toBase64(naive))).not.toBe(naive);
  });

  it("`cutToCharacterBoundary` an derselben Stelle übersteht den Hin- und Rückweg über Base64 unverändert", () => {
    const value = `AB${PERSON_EMOJI}`;
    const cut = cutToCharacterBoundary(value, 3);

    expect(fromBase64(toBase64(cut))).toBe(cut);
  });

  it("derselbe Nachweis mit einem Betreff aus lauter Emoji (T-119-Bericht Abschnitt 6: 'ein Betreff aus lauter Emoji wird an einer Zeichengrenze gekürzt')", () => {
    const allEmoji = PERSON_EMOJI.repeat(50); // 100 UTF-16-Einheiten, 50 Codepunkte
    const cutEven = cutToCharacterBoundary(allEmoji, 60); // liegt in der Mitte eines Paares? 60 ist gerade -> exakte Grenze
    const cutOdd = cutToCharacterBoundary(allEmoji, 61); // 61 ist ungerade -> mitten im Paar

    expect(cutEven).toHaveLength(60);
    expect(cutOdd).toHaveLength(60); // eine Einheit weniger als 61, da mitten im Paar

    expect(fromBase64(toBase64(cutEven))).toBe(cutEven);
    expect(fromBase64(toBase64(cutOdd))).toBe(cutOdd);
  });
});
