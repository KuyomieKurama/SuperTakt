/**
 * Takt — `apps/web/src/lib/labels.ts`, `poolPlacementMessage` und
 * `reactivationTitle` (T-111, Auftrag aus `reports/T-108-frontend-dev.md`
 * "Nächster Schritt" 2: "`poolPlacementMessage` und `reactivationTitle` …
 * sind rein und ungeprüft — sechs Fälle für das Paar (drei Anzeigeorte mal
 * Rückweg ja/nein), einer für den Titel.").
 *
 * Beide Funktionen sind rein (keine Uhr, kein DOM); die Datei läuft mit
 * `environment: 'node'` wie `errorText.test.ts`.
 *
 * ---------------------------------------------------------------------------
 * Wie sich `title` und `body` an den Argumenten unterscheiden
 * ---------------------------------------------------------------------------
 *
 * `poolPlacementMessage(name, placement, restored)` ist eine reine Abbildung
 * von drei Argumenten auf ein Paar - kein Zustandsautomat, der sich merkt, wo
 * ein Todo VORHER stand. `restored` entscheidet NUR über den Titel
 * (Rückweg -> "Anzeigeort wiederhergestellt.", sonst der Titel zum
 * `placement`); `body` hängt NUR am `placement` (der Kurzform danach), nicht
 * an `restored`. Ein Rückweg zeigt deshalb den `placement`-Wert, in den er
 * ZURÜCKFÜHRT - nicht den, den die ursprüngliche Handlung verlassen hat.
 *
 * Das deckt sich mit dem im T-108-Bericht Abschnitt 4 gemessenen Paar aus
 * Handlung und Rückweg:
 *
 * ```
 * "Vom Board nehmen"     -> placement "pool", restored false
 *   Rückweg dazu         -> placement "both", restored true   (zurück zu Pool+Board)
 * "Als Spalte aufnehmen" -> placement "both", restored false
 *   Rückweg dazu         -> placement "pool", restored true   (zurück zu nur Pool)
 * ```
 *
 * Diese Datei prüft direkt die sechs reinen Kombinationen aus dem Auftrag
 * (drei Anzeigeorte mal `restored` ja/nein) und daneben, an den vier
 * Handlungs-/Rückweg-Paaren oben, dass sich daraus genau die im
 * T-108-Bericht gemessenen Sätze ergeben.
 *
 * Keine echten Call-Nummern, Kundennamen oder Zugangsdaten: "Ost" ist
 * derselbe erfundene Poolname, den auch `errorText.test.ts` verwendet.
 */
import { describe, expect, it } from "vitest";
import { poolPlacementMessage, reactivationTitle } from "../../src/lib/labels.ts";

const RULE_BODY_TAIL =
  "Die Regel bleibt vollständig erhalten; gelöscht wird nichts, und an den Todos ändert sich nichts.";

describe("poolPlacementMessage - sechs reine Kombinationen (drei Anzeigeorte mal restored ja/nein, T-108)", () => {
  it('placement "pool", restored false: Titel "Spalte vom Board genommen.", Zeile "Pool"', () => {
    const result = poolPlacementMessage("Ost", "pool", false);
    expect(result.title).toBe("Spalte vom Board genommen.");
    expect(result.body).toBe(`„Ost“ — Pool. ${RULE_BODY_TAIL}`);
  });

  it('placement "pool", restored true: Titel "Anzeigeort wiederhergestellt.", Zeile bleibt "Pool"', () => {
    const result = poolPlacementMessage("Ost", "pool", true);
    expect(result.title).toBe("Anzeigeort wiederhergestellt.");
    expect(result.body).toBe(`„Ost“ — Pool. ${RULE_BODY_TAIL}`);
  });

  it('placement "board", restored false: Titel "Regel als Spalte aufgenommen.", Zeile "Board-Spalte"', () => {
    const result = poolPlacementMessage("Ost", "board", false);
    expect(result.title).toBe("Regel als Spalte aufgenommen.");
    expect(result.body).toBe(`„Ost“ — Board-Spalte. ${RULE_BODY_TAIL}`);
  });

  it('placement "board", restored true: Titel "Anzeigeort wiederhergestellt.", Zeile bleibt "Board-Spalte"', () => {
    const result = poolPlacementMessage("Ost", "board", true);
    expect(result.title).toBe("Anzeigeort wiederhergestellt.");
    expect(result.body).toBe(`„Ost“ — Board-Spalte. ${RULE_BODY_TAIL}`);
  });

  it('placement "both", restored false: Titel "Regel als Spalte aufgenommen.", Zeile "Pool und Board"', () => {
    const result = poolPlacementMessage("Ost", "both", false);
    expect(result.title).toBe("Regel als Spalte aufgenommen.");
    expect(result.body).toBe(`„Ost“ — Pool und Board. ${RULE_BODY_TAIL}`);
  });

  it('placement "both", restored true: Titel "Anzeigeort wiederhergestellt.", Zeile bleibt "Pool und Board"', () => {
    const result = poolPlacementMessage("Ost", "both", true);
    expect(result.title).toBe("Anzeigeort wiederhergestellt.");
    expect(result.body).toBe(`„Ost“ — Pool und Board. ${RULE_BODY_TAIL}`);
  });
});

describe("poolPlacementMessage - die vier gemessenen Handlungs-/Rückweg-Paare aus T-108 Abschnitt 4", () => {
  it('"Vom Board nehmen" (both -> pool): Handlung nennt "Pool", der Rückweg (zurück zu "both") nennt "Pool und Board"', () => {
    const action = poolPlacementMessage("Ost", "pool", false);
    expect(action.title).toBe("Spalte vom Board genommen.");
    expect(action.body).toBe(`„Ost“ — Pool. ${RULE_BODY_TAIL}`);

    const undo = poolPlacementMessage("Ost", "both", true);
    expect(undo.title).toBe("Anzeigeort wiederhergestellt.");
    expect(undo.body).toBe(`„Ost“ — Pool und Board. ${RULE_BODY_TAIL}`);
  });

  it('"Als Spalte aufnehmen" (pool -> both): Handlung nennt "Pool und Board", der Rückweg (zurück zu "pool") nennt "Pool"', () => {
    const action = poolPlacementMessage("Ost", "both", false);
    expect(action.title).toBe("Regel als Spalte aufgenommen.");
    expect(action.body).toBe(`„Ost“ — Pool und Board. ${RULE_BODY_TAIL}`);

    const undo = poolPlacementMessage("Ost", "pool", true);
    expect(undo.title).toBe("Anzeigeort wiederhergestellt.");
    expect(undo.body).toBe(`„Ost“ — Pool. ${RULE_BODY_TAIL}`);
  });
});

describe("poolPlacementMessage - weitere Eigenschaften", () => {
  it("der Name steht unzerlegt im Text - deutsche Anführungszeichen, kein Escaping", () => {
    const result = poolPlacementMessage("Wartung Nord", "pool", false);
    expect(result.body).toContain("„Wartung Nord“");
  });

  it("Titel und Zeile kommen aus EINEM Aufruf - beide Werte stehen im selben Rückgabewert (Auseinanderlaufen ausgeschlossen)", () => {
    const result = poolPlacementMessage("Ost", "both", false);
    expect(Object.keys(result).sort()).toEqual(["body", "title"]);
  });
});

describe('reactivationTitle - Timerstart auf erledigtem Todo hebt "Erledigt" auf (A-2.5, W-9)', () => {
  it('nennt den Todo-Titel in Anführungszeichen und sagt "ist wieder offen."', () => {
    expect(reactivationTitle("Betriebshandbuch Kapitel 3")).toBe(
      'Timer gestartet. „Betriebshandbuch Kapitel 3“ ist wieder offen.',
    );
  });

  it("ein zweiter Todo-Titel ergibt denselben Rahmen mit anderem Namen - keine feste Zeichenkette", () => {
    expect(reactivationTitle("Wartung Nord")).toBe(
      'Timer gestartet. „Wartung Nord“ ist wieder offen.',
    );
  });

  it("ein leerer Titel bricht die Funktion nicht - sie liefert weiterhin den Rahmen, nur ohne Namen dazwischen", () => {
    expect(reactivationTitle("")).toBe("Timer gestartet. „“ ist wieder offen.");
  });
});
