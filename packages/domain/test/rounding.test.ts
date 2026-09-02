/**
 * Takt — T-010, Rundung auf Viertelstunden (E-008, E-020, E-025, A-8.3).
 *
 * Testfälle: TP-ROUND-01 bis TP-ROUND-16 (docs/testplan.md, Abschnitt 1).
 *
 * ROT ZUERST: `packages/domain/src/rounding.ts` liefert bislang ausschließlich
 * die Typen `RoundToQuarterHours`, `QuarterHoursToExportNumber` und
 * `RoundingMode` (T-001/T-013). Es gibt noch keine Laufzeitfunktion. Dieser
 * Test nimmt an, dass T-009 die beiden Funktionstypen als benannte Werte
 * `roundToQuarterHours` und `quarterHoursToExportNumber` exportiert — camelCase
 * zum PascalCase-Typnamen, wie es die Umbenennungstabelle aus
 * `.claude/team/reports/T-013-domain-dev.md` für die deutschen Vorgänger
 * (`RundeAufViertelstunden` -> `RoundToQuarterHours`) vorzeichnet. Bis T-009
 * diese Funktionen liefert, schlägt dieser gesamte Testlauf mit
 * "Cannot find module" bzw. "is not a function" fehl — das ist beabsichtigt
 * (rot vor grün) und keine Aussage über die Qualität dieses Tests.
 *
 * Wird die Funktion unter einem anderen Namen geliefert, bitte im Bericht des
 * domain-dev vermerken statt den Test heimlich anzupassen — siehe
 * T-010-unit-tester Bericht, Abschnitt "Annahmen zur Modulstruktur".
 *
 * NACHTRAG T-010b: T-009 liefert beide Funktionen unter genau diesen Namen
 * (`.claude/team/reports/T-009-domain-dev.md`, "alle acht ... Funktionsnamen
 * stimmten"). Der `@ts-expect-error`-Kommentar über dem Import ist damit
 * gegenstandslos geworden und entfernt — er würde, sobald jemand diese
 * Testdatei in eine Typprüfung aufnimmt, selbst als Fehler auffallen (TS2578,
 * "unused '@ts-expect-error' directive").
 */
import { describe, expect, it } from 'vitest';
import { roundToQuarterHours, quarterHoursToExportNumber } from '../src/rounding.js';
import type { RoundingMode } from '../src/rounding.js';

const MINUTE = 60;

/** TP-ROUND-01 bis TP-ROUND-15: die volle Wertetabelle im Produktivmodus `up`. */
const upTable: ReadonlyArray<{
  readonly id: string;
  readonly minutes: number;
  readonly seconds?: number;
  readonly expectedQuarters: number | null;
  readonly note: string;
}> = [
  { id: 'TP-ROUND-01', minutes: 0, expectedQuarters: null, note: 'Dauer 0 existiert nicht (E-008)' },
  { id: 'TP-ROUND-02', minutes: 1, expectedQuarters: 1, note: 'Mindestgrenze greift -> 0,25' },
  { id: 'TP-ROUND-03', minutes: 3, expectedQuarters: 1, note: 'vom Auftraggeber bestätigt -> 0,25' },
  { id: 'TP-ROUND-04', minutes: 0, seconds: 7 * MINUTE + 30, expectedQuarters: 1, note: '7:30 -> 0,25' },
  { id: 'TP-ROUND-05', minutes: 8, expectedQuarters: 1, note: 'innerhalb erster Stufe -> 0,25' },
  { id: 'TP-ROUND-06', minutes: 15, expectedQuarters: 1, note: 'exakte Stufengrenze bleibt auf der Stufe -> 0,25 (fängt floor(s/900)+1-Fehler ab)' },
  { id: 'TP-ROUND-07', minutes: 16, expectedQuarters: 2, note: '**Unterscheidungsfall E-008** -> 0,50, kaufmännisch wäre 0,25' },
  { id: 'TP-ROUND-08', minutes: 22, expectedQuarters: 2, note: 'Mittelpunkt 22,5 -> 0,50 (kaufmännisch ebenfalls 0,25 wäre falsch hier zum Vergleich)' },
  { id: 'TP-ROUND-09', minutes: 23, expectedQuarters: 2, note: 'kein Unterscheidungswert -> 0,50 in beiden Regeln' },
  { id: 'TP-ROUND-10', minutes: 30, expectedQuarters: 2, note: 'exakte Stufengrenze -> 0,50' },
  { id: 'TP-ROUND-11', minutes: 45, expectedQuarters: 3, note: 'exakte Stufengrenze -> 0,75' },
  { id: 'TP-ROUND-12', minutes: 60, expectedQuarters: 4, note: 'exakte Stufengrenze -> 1,00' },
  { id: 'TP-ROUND-13', minutes: 61, expectedQuarters: 5, note: '**zweiter Unterscheidungsfall** -> 1,25, kaufmännisch wäre 1,00' },
  { id: 'TP-ROUND-14', minutes: 90, expectedQuarters: 6, note: 'exakte Stufengrenze -> 1,50' },
  { id: 'TP-ROUND-15', minutes: 458, expectedQuarters: 31, note: '7h38min, mehrere Stufen übersprungen -> 7,75' },
];

describe('roundToQuarterHours — Modus "up" (Produktivmodus, E-008 bestätigt 2026-08-31)', () => {
  it.each(upTable)('$id: $note', ({ minutes, seconds, expectedQuarters }) => {
    const totalSeconds = seconds ?? minutes * MINUTE;
    expect(roundToQuarterHours(totalSeconds, 'up' satisfies RoundingMode)).toBe(expectedQuarters);
  });

  it('TP-ROUND-07 exakt: 16 Minuten runden auf den Exportwert 0,50, nicht 0,25', () => {
    const quarters = roundToQuarterHours(16 * MINUTE, 'up');
    expect(quarters).not.toBeNull();
    expect(quarterHoursToExportNumber(quarters as number)).toBe(0.5);
  });

  it('TP-ROUND-13 exakt: 61 Minuten runden auf den Exportwert 1,25, nicht 1,00', () => {
    const quarters = roundToQuarterHours(61 * MINUTE, 'up');
    expect(quarters).not.toBeNull();
    expect(quarterHoursToExportNumber(quarters as number)).toBe(1.25);
  });

  it('TP-ROUND-01: negative Dauer ist ebenfalls kein exportierbarer Wert', () => {
    expect(roundToQuarterHours(-1, 'up')).toBeNull();
  });
});

describe('quarterHoursToExportNumber — Umwandlung in den Zahlwert des Exportfeldes "Zeit"', () => {
  it.each([
    [1, 0.25],
    [2, 0.5],
    [3, 0.75],
    [4, 1.0],
    [5, 1.25],
    [6, 1.5],
    [31, 7.75],
  ])('%i Viertelstunden -> %f', (quarters, expected) => {
    expect(quarterHoursToExportNumber(quarters)).toBe(expected);
  });
});

describe('TP-ROUND-16 — umschaltbarer kaufmännischer Modus bleibt korrekt, ohne Seiteneffekt', () => {
  it('Modus "nearest": 16 Minuten ergeben 0,25 (abweichend von "up")', () => {
    const quarters = roundToQuarterHours(16 * MINUTE, 'nearest' satisfies RoundingMode);
    expect(quarters).not.toBeNull();
    expect(quarterHoursToExportNumber(quarters as number)).toBe(0.25);
  });

  it('Modus "nearest": 61 Minuten ergeben 1,00 (abweichend von "up")', () => {
    const quarters = roundToQuarterHours(61 * MINUTE, 'nearest');
    expect(quarters).not.toBeNull();
    expect(quarterHoursToExportNumber(quarters as number)).toBe(1.0);
  });

  it('Modus "nearest": 7:30 (exakter Mittelpunkt) rundet aufwärts auf 0,25, nie auf 0,00', () => {
    const quarters = roundToQuarterHours(7 * MINUTE + 30, 'nearest');
    expect(quarters).toBe(1);
  });

  it('zurück auf "up": 16 und 61 Minuten liefern wieder 0,50 und 1,25 — kein globaler Seiteneffekt', () => {
    // Reihenfolge ist Absicht: "nearest" zuerst aufgerufen (siehe oben), dann "up" —
    // ein Test, der beide Modi in derselben Datei prüft, deckt genau den Fall ab,
    // dass ein Modul-Zustand (z. B. ein gemerktes Setting) fälschlich geteilt wird.
    expect(roundToQuarterHours(16 * MINUTE, 'up')).toBe(2);
    expect(roundToQuarterHours(61 * MINUTE, 'up')).toBe(5);
  });

  it('die beiden Modi liefern für denselben Wert nachweislich unterschiedliche Ergebnisse', () => {
    // Hält fest, dass "up" und "nearest" tatsächlich zwei verschiedene Regeln
    // sind und nicht heimlich auf denselben Code-Pfad münden (E-008).
    expect(roundToQuarterHours(16 * MINUTE, 'up')).not.toBe(roundToQuarterHours(16 * MINUTE, 'nearest'));
    expect(roundToQuarterHours(61 * MINUTE, 'up')).not.toBe(roundToQuarterHours(61 * MINUTE, 'nearest'));
  });
});
