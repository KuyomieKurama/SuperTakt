/**
 * Takt — T-140, `apps/web/src/lib/foreign.ts` (E-063, O-AT, T-129, T-133).
 *
 * `quotedName`, `foreignText` und `foreignTextFrom` sind reine Funktionen und
 * gehören nach E-062 zu Vitest (T-133-Bericht, "Nächster Schritt" 2:
 * "`foreignTextFrom` ist eine reine Funktion in `lib/**` ... zwei Zeilen, aber
 * sie sind die Grenze, an der O-AT hängt"). Bis T-140 gab es keine Datei dazu
 * — 0 Prozent Abdeckung an genau der Stelle, an der ein Nachweisskript
 * (`proof-foreign.mjs`) zwar die STRUKTUR erzwingt (Signatur `unknown herein,
 * ForeignText | null heraus`), aber niemals das VERHALTEN geprüft hat.
 *
 * Keine echten Namen: "Ost", "Wartung Nord" sind erfundene Pool-/Ordnernamen
 * aus demselben Fundus wie `packages/domain/test/*.test.ts`.
 */
import { describe, expect, it } from "vitest";
import { foreignText, foreignTextFrom, quotedName } from "../../src/lib/foreign";

describe("foreignTextFrom — die Grenze vom Wert ohne Typ (O-AT)", () => {
  it("eine Zeichenkette kommt unverändert durch", () => {
    expect(foreignTextFrom("Wartung Nord")).toBe("Wartung Nord");
  });

  it("eine leere Zeichenkette kommt ebenfalls durch — sie ist Text, nur leer", () => {
    expect(foreignTextFrom("")).toBe("");
  });

  it.each([null, undefined, 42, true, {}, [], ["Ost"]])(
    "%s ist kein Text und ergibt null",
    (value) => {
      expect(foreignTextFrom(value)).toBeNull();
    },
  );

  it("ein Objekt mit toString() bleibt trotzdem null — es wird NICHT in Text verwandelt", () => {
    const value = { toString: () => "Wartung Nord" };
    expect(foreignTextFrom(value)).toBeNull();
  });

  it("prüft nicht, ob der Text zulässig ist — auch ein fremd aussehender Wert kommt durch (das ist Sache des Aufrufers)", () => {
    expect(foreignTextFrom("\u202Eevil")).toBe("\u202Eevil");
  });
});

describe("quotedName — deutsche Anführungszeichen um sichtbar gemachten Text", () => {
  it('ein gewöhnlicher Name wird zu „Name“', () => {
    expect(quotedName("Ost")).toBe("„Ost“");
  });

  it("unsichtbare/steuernde Zeichen werden ERST sichtbar gemacht, DANN eingeklammert (Reihenfolge ist Inhalt)", () => {
    // U+202E (RIGHT-TO-LEFT OVERRIDE) ist ein Richtungszeichen, das
    // `visibleText` markiert und ersetzt (E-063). Wäre die Reihenfolge
    // umgekehrt — erst zitieren, dann sichtbar machen —, bliebe das Zeichen
    // zwischen den Anführungszeichen stehen und drehte deren Wirkung mit um.
    const result = quotedName("Ost\u202EWest");
    expect(result.startsWith("„")).toBe(true);
    expect(result.endsWith("“")).toBe(true);
    expect(result).not.toContain("\u202E");
  });

  it("ein Steuerzeichen unmittelbar vor dem Ende dreht das schließende Anführungszeichen nicht mit um (Bidi-Angriff, E-063)", () => {
    // U+202E (RIGHT-TO-LEFT OVERRIDE) direkt vor dem Ende einer rohen
    // Zeichenkette könnte das nachfolgende „“ optisch umkehren. `visibleText`
    // macht das Zeichen sichtbar, bevor die Anführungszeichen gesetzt werden.
    const result = quotedName("Ost\u202E");
    expect(result).not.toContain("\u202E");
    expect(result.endsWith("“")).toBe(true);
  });

  it("ein leerer Name ergibt leere Anführungszeichen, keinen Wurf", () => {
    expect(quotedName("")).toBe("„“");
  });
});

describe("foreignText — derselbe Wert wie quotedName, ohne Anführungszeichen", () => {
  it("macht unsichtbare Zeichen sichtbar, fügt aber keine Klammer hinzu", () => {
    expect(foreignText("Ost")).toBe("Ost");
    expect(foreignText("Ost")).not.toContain("„");
  });

  it("quotedName ist foreignText plus Anführungszeichen — nicht zwei unabhängige Wege", () => {
    const name = "Wartung\u200BNord";
    expect(quotedName(name)).toBe(`„${foreignText(name)}“`);
  });
});
