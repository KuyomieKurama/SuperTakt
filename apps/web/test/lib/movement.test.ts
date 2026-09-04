/**
 * Takt — `apps/web/src/lib/movement.ts` (T-102, Auftrag T-105 "Nächster
 * Schritt" 2 aus `reports/T-102-frontend-dev.md`).
 *
 * Vier reine Funktionen, kein DOM: `movementSentence`, `doneMovementSentence`,
 * `bookingSentence`, `withMovement`. Die Datei selbst sagt es im Kopf: "Kein
 * Wortlaut." — sie ruft ausschließlich `poolMovementSentence` aus
 * `@takt/domain` durch. Genau deshalb wird hier **nicht** gegen einen
 * hartkodierten deutschen Satz geprüft (das wäre die fünfte Abschrift, die der
 * Kopfkommentar der Datei ausdrücklich ausschließt), sondern gegen den
 * tatsächlichen Rückgabewert derselben `poolMovementSentence` — bei
 * Abweichung sagt der Test, *welche* Zuordnung (Handlung → Anlass) falsch ist,
 * nicht, welcher Buchstabe.
 *
 * Getestet wird also die **Zuordnung**, nicht der Satz:
 *
 *  - `movementSentence` reicht `occasion` unverändert durch und behandelt
 *    `movement === null` als eigenen Fall (kein Aufruf von
 *    `poolMovementSentence`, direkt `null`).
 *  - `doneMovementSentence(cleared)` wählt `'reopen'` bei `cleared: true` und
 *    `'booking'` bei `cleared: false` (E-060 Punkt 4, die Tabelle im
 *    Kopfkommentar der Quelldatei).
 *  - `bookingSentence` wählt immer `'booking'`, unabhängig von irgendeinem
 *    Kennzeichen (E-058 Punkt 6: ein Stopp hebt nie "Erledigt" auf).
 *  - `withMovement` hängt einen Satz mit genau einem Leerzeichen an oder lässt
 *    den Rumpf bei `null` unverändert.
 *
 * Keine echten Call-Nummern, Kundennamen oder Zugangsdaten: Die Poolnamen
 * unten sind erfunden.
 */
import { describe, expect, it } from "vitest";
import { poolMovementSentence } from "@takt/domain";
import {
  bookingSentence,
  doneMovementSentence,
  movementSentence,
  withMovement,
} from "../../src/lib/movement.ts";
import type { PoolMovement } from "../../src/api/types.ts";

const movement = (partial: Partial<PoolMovement>): PoolMovement => ({
  appears: [],
  enters: [],
  leaves: [],
  ...partial,
});

/** Eine Bewegung, die in BEIDEN Anlässen einen echten (nicht-null) Satz ergibt. */
const REAL_MOVEMENT = movement({ appears: ["Ost"], enters: ["Ost"], leaves: ["West"] });

/** Eine Bewegung ohne jede Änderung — für den Anlass "booking" der Fall, der `null` ergibt. */
const EMPTY_MOVEMENT = movement({});

describe("movementSentence — reicht occasion durch, movement: null wird zu null (ohne Aufruf der Domänenfunktion)", () => {
  it("movement === null ergibt null, für beide Anlässe", () => {
    expect(movementSentence(null, "reopen")).toBeNull();
    expect(movementSentence(null, "booking")).toBeNull();
  });

  it('occasion "reopen": das Ergebnis ist zeichengleich mit poolMovementSentence(movement, "past", "reopen")', () => {
    const expected = poolMovementSentence(REAL_MOVEMENT, "past", "reopen");
    expect(movementSentence(REAL_MOVEMENT, "reopen")).toBe(expected);
    // Gegenprobe: die Domänenfunktion liefert hier tatsächlich einen Satz —
    // sonst bewiese eine zufällig doppelte null-Rückgabe denselben Test.
    expect(expected).not.toBeNull();
  });

  it('occasion "booking": das Ergebnis ist zeichengleich mit poolMovementSentence(movement, "past", "booking")', () => {
    const expected = poolMovementSentence(REAL_MOVEMENT, "past", "booking");
    expect(movementSentence(REAL_MOVEMENT, "booking")).toBe(expected);
    expect(expected).not.toBeNull();
  });

  it('occasion "booking" ohne jede Änderung ergibt null (E-058 Punkt 6: "booking", nichts/nichts -> null) — bewusst NICHT dieselbe Rechnung wie "reopen"', () => {
    // Voraussetzung des Falls: Für "reopen" liefert dieselbe leere Bewegung
    // einen (nicht-null) Satz — den Fall "auf dieses Todo passt derzeit keine
    // Regel". Nur "booking" wird bei völliger Ruhe zu null.
    expect(poolMovementSentence(EMPTY_MOVEMENT, "past", "reopen")).not.toBeNull();
    expect(movementSentence(EMPTY_MOVEMENT, "booking")).toBeNull();
  });
});

describe("doneMovementSentence — cleared: true -> 'reopen', cleared: false -> 'booking' (E-060 Punkt 4)", () => {
  it("cleared: true liefert denselben Satz wie movementSentence(movement, 'reopen')", () => {
    expect(doneMovementSentence(REAL_MOVEMENT, true)).toBe(movementSentence(REAL_MOVEMENT, "reopen"));
  });

  it("cleared: false liefert denselben Satz wie movementSentence(movement, 'booking')", () => {
    expect(doneMovementSentence(REAL_MOVEMENT, false)).toBe(movementSentence(REAL_MOVEMENT, "booking"));
  });

  it("die beiden Anlässe ergeben bei derselben Bewegung UNTERSCHIEDLICHE Sätze — die Zuordnung ist nicht zufällig richtig", () => {
    const reopened = doneMovementSentence(REAL_MOVEMENT, true);
    const booked = doneMovementSentence(REAL_MOVEMENT, false);
    expect(reopened).not.toBe(booked);
  });

  it("movement: null bleibt in beiden Richtungen null", () => {
    expect(doneMovementSentence(null, true)).toBeNull();
    expect(doneMovementSentence(null, false)).toBeNull();
  });
});

describe("bookingSentence — immer 'booking', nie 'reopen' (E-058 Punkt 6: ein Stopp hebt kein Erledigt auf)", () => {
  it("liefert denselben Satz wie movementSentence(movement, 'booking')", () => {
    expect(bookingSentence(REAL_MOVEMENT)).toBe(movementSentence(REAL_MOVEMENT, "booking"));
  });

  it("bei einer Bewegung ohne Änderung liefert es null, wie am Stopp gefordert (kein Rumpf ohne Inhalt)", () => {
    expect(bookingSentence(EMPTY_MOVEMENT)).toBeNull();
  });

  it("movement: null ergibt null", () => {
    expect(bookingSentence(null)).toBeNull();
  });
});

describe("withMovement — ein Leerzeichen, dann der Satz, unverändert; sonst der Rumpf allein", () => {
  it("sentence: null lässt den Rumpf exakt unverändert (kein Leerzeichen am Ende)", () => {
    expect(withMovement("Erledigt.", null)).toBe("Erledigt.");
  });

  it("ein vorhandener Satz wird mit GENAU einem Leerzeichen angehängt", () => {
    expect(withMovement("Erledigt.", 'Es steht jetzt in „Ost".')).toBe(
      'Erledigt. Es steht jetzt in „Ost".',
    );
  });

  it("der angehängte Satz bleibt zeichengleich — kein Trimmen, kein Umformatieren", () => {
    const sentence = "  ein Satz mit Leerraum am Rand  ";
    expect(withMovement("Titel.", sentence)).toBe(`Titel. ${sentence}`);
  });

  it("ein leerer Rumpf mit Satz ergibt ein führendes Leerzeichen — kein Sonderfall für einen leeren Rumpf", () => {
    expect(withMovement("", "Satz.")).toBe(" Satz.");
  });
});
