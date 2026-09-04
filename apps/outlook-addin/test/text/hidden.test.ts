/**
 * Takt — `apps/outlook-addin/src/text/hidden.ts` (T-119, E-063, Auftrag
 * T-121 Punkt 2: "markieren, nicht streichen (E-063 Punkt 2), und die Klasse
 * muss dieselbe sein wie an der Tür").
 *
 * Drei reine Funktionen (kein Baum, kein Ereignis, keine Uhr — E-062):
 *
 *  - `hasHidden`   — trägt der Wert ein Zeichen, das die Anzeige umordnen kann?
 *  - `dropHidden`  — nimmt diese Zeichen HERAUS (für einen Titelvorschlag).
 *  - `visibleText` — macht sie SICHTBAR als `U+FFFD` (für eine Anzeige).
 *
 * ---------------------------------------------------------------------------
 * "Die Klasse muss dieselbe sein wie an der Tür"
 * ---------------------------------------------------------------------------
 *
 * `apps/local-api/src/http/input.ts` weist an `titleSchema`/`nameSchema` ab:
 * C0 (`U+0000`-`U+001F`), C1 (`U+007F`-`U+009F`), die Marken (`U+061C` ALM,
 * `U+200E` LRM, `U+200F` RLM), die Einbettungen/Überschreibungen
 * (`U+202A`-`U+202E`) und die Isolate (`U+2066`-`U+2069`) — siehe
 * `apps/local-api/test/http/input.test.ts` für dieselbe Randmessung an der Tür.
 * Diese Datei misst dieselben Ränder hier noch einmal, unabhängig, weil
 * T-119 genau daran gescheitert war: Der Nachweispfad des Add-ins pruefte
 * gegen eine ABGESCHRIEBENE Liste und bemerkte die drei Marken aus T-117
 * nicht (T-119-Bericht Abschnitt 1). Eine zweite, unabhängig geschriebene
 * Randmessung ist kein Ersatz für Abschnitt 17 in `proof-addin.mjs` (der
 * gegen die Tür selbst fragt), aber sie hält dieselbe Behauptung an einer
 * zweiten Stelle fest, mit denselben Werten wie in `input.test.ts` — wessen
 * Wert wo abweicht, ist damit sofort sichtbar.
 *
 * ---------------------------------------------------------------------------
 * Eine Ausnahme, ausdrücklich NICHT dieselbe wie an der Tür
 * ---------------------------------------------------------------------------
 *
 * Die Tür weist `U+0009`-`U+000D` (Tabulator, LF, VT, FF, CR) als Teil von C0
 * ab. `hidden.ts` behandelt genau diesen Ausschnitt separat: Er ist Leerraum
 * und wird zu einem Leerzeichen, nicht zu `U+FFFD` — ein Betreff mit einem
 * eingebetteten Zeilenumbruch soll im Aufgabenbereich keine zweite Zeile
 * aufmachen, aber auch keine sichtbare Marke hinterlassen (Kopfkommentar der
 * Quelldatei, `CONTROL_WHITESPACE`). Diese fünf Zeichen sind deshalb weder in
 * `hasHidden` noch in `dropHidden`s Streichmenge enthalten; sie stehen in
 * eigenen Fällen unten, damit die Abweichung von der Tür nicht als Lücke
 * missverstanden wird.
 *
 * ---------------------------------------------------------------------------
 * Zeichen als benannte Konstanten mit chr()-artigen Codepunkten (T-112-H2)
 * ---------------------------------------------------------------------------
 *
 * Wie in `apps/local-api/test/http/input.test.ts` stehen die Steuer-, Bidi-
 * und Richtungszeichen unten als Escape-Folgen und nicht als rohe Zeichen im
 * Quelltext: Ein rohes Richtungszeichen in dieser Datei drehte dieselbe Zeile
 * um, die es beschreibt, und ein rohes `U+0000` machte eine solche Datei
 * bereits einmal für Git zu einer Binaerdatei (T-111-Bericht, Punkt 6).
 *
 * Keine echten Call-Nummern, Kundennamen oder Zugangsdaten. "Rechnung" im
 * RLO-Beispiel ist die Situation aus dem T-119-Bericht ("Rechnung<RLO>gnp.exe"
 * las sich als "Rechnung exe.png"), keine echte Datei.
 */
import { describe, expect, it } from "vitest";
import { HIDDEN_MARKER, dropHidden, hasHidden, visibleText } from "../../src/text/hidden.ts";

// C0, ohne den Leerraum U+0009-U+000D.
const NUL = "\u0000";
const BACKSPACE = "\u0008"; // letztes C0-Zeichen VOR der Leerraum-Ausnahme
const SHIFT_OUT = "\u000e"; // erstes C0-Zeichen NACH der Leerraum-Ausnahme
const UNIT_SEPARATOR = "\u001f"; // letztes C0-Zeichen insgesamt

// Der Leerraum-Ausschnitt selbst — die eine Ausnahme zur Tür.
const TAB = "\u0009";
const LINE_FEED = "\u000a";
const VERTICAL_TAB = "\u000b";
const FORM_FEED = "\u000c";
const CARRIAGE_RETURN = "\u000d";

// C1.
const DEL = "\u007f";
const C1_LAST = "\u009f";

// Die Marken aus T-117.
const ALM_BEFORE = "\u061b"; // arabisches Semikolon, direkt vor der Marke
const ALM = "\u061c"; // Arabic Letter Mark
const ALM_AFTER = "\u061d"; // direkt nach der Marke
const ZWSP = "\u200b";
const ZWNJ = "\u200c";
const ZWJ = "\u200d";
const LRM = "\u200e";
const RLM = "\u200f";
const HYPHEN = "\u2010"; // jenseits der beiden Marken

// Einbettungen/Überschreibungen und Isolate.
const LRE = "\u202a";
const RLO = "\u202e";
const LRI = "\u2066";
const PDI = "\u2069";

describe("HIDDEN_MARKER", () => {
  it("ist U+FFFD (REPLACEMENT CHARACTER)", () => {
    expect(HIDDEN_MARKER).toBe("\ufffd");
    expect(HIDDEN_MARKER.codePointAt(0)).toBe(0xfffd);
  });
});

describe("hasHidden / dropHidden / visibleText — gewöhnlicher Text bleibt gewöhnlicher Text", () => {
  it("Umlaute, scharfes Eszett, Akzente und ein Emoji lösen nichts aus", () => {
    const value = "Caf\u00e9 M\u00fcller \u2013 R\u00fcckruf n\u00f6tig \ud83d\ude00 Support";
    expect(hasHidden(value)).toBe(false);
    expect(dropHidden(value)).toBe(value);
    expect(visibleText(value)).toBe(value);
  });

  it("rechtsläufige Schrift (Arabisch, Hebräisch) bleibt UNANGETASTET — sie ist kein Angriff, sondern Text (E-063)", () => {
    // "Wartungsrechnung" auf Arabisch bzw. Hebräisch — erfundener Beispieltext.
    const arabic = "\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0635\u064a\u0627\u0646\u0629";
    const hebrew = "\u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea \u05ea\u05d7\u05d6\u05d5\u05e7\u05d4";
    expect(hasHidden(arabic)).toBe(false);
    expect(hasHidden(hebrew)).toBe(false);
    expect(dropHidden(arabic)).toBe(arabic);
    expect(visibleText(arabic)).toBe(arabic);
    expect(visibleText(hebrew)).toBe(hebrew);
  });
});

describe("Der Kernfall aus T-119: U+202E (RLO) dreht die Anzeige um, visibleText nimmt ihm die Wirkung", () => {
  it("ein Betreff mit eingebettetem RLO trägt ein verdecktes Zeichen — hasHidden erkennt es", () => {
    const trick = `Rechnung${RLO}gnp.exe`;
    expect(hasHidden(trick)).toBe(true);
  });

  it("visibleText ersetzt das RLO durch die Marke — der Text zeigt sich als das, was er ist, statt die Zeile umzudrehen", () => {
    const trick = `Rechnung${RLO}gnp.exe`;
    expect(visibleText(trick)).toBe(`Rechnung${HIDDEN_MARKER}gnp.exe`);
    // Die Marke selbst löst hasHidden nicht mehr aus — sie ist keine
    // Richtungswirkung, sondern ihre sichtbare Auflösung.
    expect(hasHidden(visibleText(trick))).toBe(false);
  });

  it("dropHidden nimmt das RLO ersatzlos heraus (für einen Titelvorschlag, nicht für eine Anzeige)", () => {
    const trick = `Rechnung${RLO}gnp.exe`;
    expect(dropHidden(trick)).toBe("Rechnunggnp.exe");
  });
});

describe("Dieselbe Klasse wie an der Tür — die Marken aus T-117 (ALM U+061C, LRM U+200E, RLM U+200F)", () => {
  it("U+061B, direkt vor der Marke: KEINE Wirkung, wie an der Tür", () => {
    const value = `Vor${ALM_BEFORE}Nach`;
    expect(hasHidden(value)).toBe(false);
    expect(dropHidden(value)).toBe(value);
    expect(visibleText(value)).toBe(value);
  });

  it("U+061C (ALM), die Marke selbst: erkannt, gestrichen, markiert — wie an der Tür abgewiesen", () => {
    const value = `Vor${ALM}Nach`;
    expect(hasHidden(value)).toBe(true);
    expect(dropHidden(value)).toBe("VorNach");
    expect(visibleText(value)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });

  it("U+061D, direkt nach der Marke: KEINE Wirkung, wie an der Tür", () => {
    const value = `Vor${ALM_AFTER}Nach`;
    expect(hasHidden(value)).toBe(false);
    expect(visibleText(value)).toBe(value);
  });

  it("U+200B (ZWSP), U+200C (ZWNJ), U+200D (ZWJ): KEINE Wirkung — sie haben keine Richtungswirkung, wie an der Tür", () => {
    for (const zeichen of [ZWSP, ZWNJ, ZWJ]) {
      const value = `Vor${zeichen}Nach`;
      expect(hasHidden(value)).toBe(false);
      expect(dropHidden(value)).toBe(value);
      expect(visibleText(value)).toBe(value);
    }
  });

  it("ein Familien-Emoji, ueber U+200D (ZWJ) zusammengehalten, bleibt in der Anzeige ganz — kein Zerfallen in einzelne Figuren", () => {
    const familyEmoji = `\u{1f468}${ZWJ}\u{1f469}${ZWJ}\u{1f467}${ZWJ}\u{1f466}`;
    expect(hasHidden(familyEmoji)).toBe(false);
    expect(visibleText(`Familientermin ${familyEmoji}`)).toBe(`Familientermin ${familyEmoji}`);
  });

  it("U+200E (LRM): erkannt, gestrichen, markiert — wie an der Tür abgewiesen", () => {
    const value = `Vor${LRM}Nach`;
    expect(hasHidden(value)).toBe(true);
    expect(dropHidden(value)).toBe("VorNach");
    expect(visibleText(value)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });

  it("U+200F (RLM): erkannt, gestrichen, markiert — wie an der Tür abgewiesen", () => {
    const value = `Vor${RLM}Nach`;
    expect(hasHidden(value)).toBe(true);
    expect(dropHidden(value)).toBe("VorNach");
    expect(visibleText(value)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });

  it("U+2010 (Bindestrich), jenseits der beiden Marken: KEINE Wirkung, wie an der Tür", () => {
    const value = `Vor${HYPHEN}Nach`;
    expect(hasHidden(value)).toBe(false);
    expect(visibleText(value)).toBe(value);
  });
});

describe("Dieselbe Klasse wie an der Tür — C0/C1, Einbettungen/Überschreibungen, Isolate", () => {
  it("U+0000 (NUL) und U+001F (letztes C0-Zeichen davor): erkannt und markiert", () => {
    expect(hasHidden(`Vor${NUL}Nach`)).toBe(true);
    expect(hasHidden(`Vor${UNIT_SEPARATOR}Nach`)).toBe(true);
    expect(visibleText(`Vor${NUL}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
    expect(visibleText(`Vor${UNIT_SEPARATOR}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });

  it("U+007F (DEL) und U+009F (letztes C1-Zeichen): erkannt und markiert", () => {
    expect(hasHidden(`Vor${DEL}Nach`)).toBe(true);
    expect(hasHidden(`Vor${C1_LAST}Nach`)).toBe(true);
    expect(visibleText(`Vor${DEL}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
    expect(visibleText(`Vor${C1_LAST}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });

  it("U+202A (LRE) und U+202E (RLO), die Einbettungen/Überschreibungen: erkannt und markiert", () => {
    expect(hasHidden(`Vor${LRE}Nach`)).toBe(true);
    expect(hasHidden(`Vor${RLO}Nach`)).toBe(true);
    expect(visibleText(`Vor${LRE}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });

  it("U+2066 (LRI) und U+2069 (PDI), die Isolate: erkannt und markiert", () => {
    expect(hasHidden(`Vor${LRI}Nach`)).toBe(true);
    expect(hasHidden(`Vor${PDI}Nach`)).toBe(true);
    expect(visibleText(`Vor${LRI}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });
});

describe("Die eine Ausnahme zur Tür: C0-Leerraum (U+0009-U+000D) wird zu einem Leerzeichen, nicht zur Marke", () => {
  it("hasHidden erkennt Tabulator, LF, VT, FF, CR NICHT als 'hidden' — sie sind Leerraum, keine Richtungswirkung", () => {
    for (const zeichen of [TAB, LINE_FEED, VERTICAL_TAB, FORM_FEED, CARRIAGE_RETURN]) {
      expect(hasHidden(`Vor${zeichen}Nach`)).toBe(false);
    }
  });

  it("dropHidden lässt den C0-Leerraum unangetastet stehen — Streichen ist nicht Sache von hidden.ts, das Zusammenziehen macht ein späterer Schritt in mail.ts", () => {
    expect(dropHidden(`St\u00f6rung${TAB}L\u00fcftung`)).toBe(`St\u00f6rung${TAB}L\u00fcftung`);
    expect(dropHidden(`Zeile eins${LINE_FEED}Zeile zwei`)).toBe(`Zeile eins${LINE_FEED}Zeile zwei`);
  });

  it("visibleText macht aus dem C0-Leerraum GENAU EIN Leerzeichen, keine Marke", () => {
    expect(visibleText(`St\u00f6rung${TAB}L\u00fcftung`)).toBe("St\u00f6rung L\u00fcftung");
    expect(visibleText(`Zeile eins${LINE_FEED}Zeile zwei`)).toBe("Zeile eins Zeile zwei");
    expect(visibleText(`Vor${VERTICAL_TAB}Nach`)).toBe("Vor Nach");
    expect(visibleText(`Vor${FORM_FEED}Nach`)).toBe("Vor Nach");
    expect(visibleText(`Vor${CARRIAGE_RETURN}Nach`)).toBe("Vor Nach");
  });

  it("die Grenzen dieser Ausnahme: U+0008 (davor) und U+000E (danach) sind WIEDER die Marke, nicht das Leerzeichen", () => {
    expect(visibleText(`Vor${BACKSPACE}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
    expect(visibleText(`Vor${SHIFT_OUT}Nach`)).toBe(`Vor${HIDDEN_MARKER}Nach`);
  });
});

describe("visibleText — mehrere verdeckte Zeichen in einem Wert", () => {
  it("jedes verdeckte Zeichen bekommt seine eigene Marke, keine Zusammenfassung zu einer", () => {
    const value = `A${LRM}B${RLM}C`;
    expect(visibleText(value)).toBe(`A${HIDDEN_MARKER}B${HIDDEN_MARKER}C`);
  });
});
