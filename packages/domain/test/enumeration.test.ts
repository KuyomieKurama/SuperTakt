/**
 * Takt — T-127, die deutsche Aufzählung (E-058 Punkt 4, T-093, T-122, O-AG).
 *
 * `packages/domain/src/enumeration.ts` liegt seit T-122 an einem Ort, statt
 * dreimal in `apps/web` nachgebaut zu werden — bislang aber ohne eigene
 * Testdatei unter `packages/domain/test/**`. Die vierzehn Sätze aus
 * `pool-movement.test.ts` messen `enumerateNames` nur mittelbar, immer mit
 * mindestens einem Namen; die Ränder selbst — null, ein, zwei, drei Namen,
 * und ein leerer Name — waren nirgends direkt nachgewiesen.
 *
 * "Null" ist hier die deutsche Zahl (keine leere Liste im Sinn von
 * JavaScript `null` — die Funktionen nehmen `readonly string[]`, keinen
 * nullbaren Parameter): null Namen heißt eine leere Liste.
 */
import { describe, expect, it } from 'vitest';
import { enumerateGerman, enumerateNames, quoteName } from '../src/enumeration.ts';

describe('enumerateGerman — „A“, „A und B“, „A, B und C“ (E-058 Punkt 4)', () => {
  it('null Teile (leere Liste) ergeben die leere Zeichenkette', () => {
    expect(enumerateGerman([])).toBe('');
  });

  it('ein Teil steht für sich, ohne Bindewort', () => {
    expect(enumerateGerman(['A'])).toBe('A');
  });

  it('zwei Teile werden mit "und" verbunden, ohne Komma', () => {
    expect(enumerateGerman(['A', 'B'])).toBe('A und B');
  });

  it('drei Teile: die ersten beiden mit Komma, das letzte mit "und" — kein Komma vor "und"', () => {
    expect(enumerateGerman(['A', 'B', 'C'])).toBe('A, B und C');
  });

  it('vier Teile setzen dieselbe Regel fort', () => {
    expect(enumerateGerman(['A', 'B', 'C', 'D'])).toBe('A, B, C und D');
  });

  it('ein leerer Teil (leere Zeichenkette) wird NICHT übersprungen, sondern als leeres Element aufgezählt', () => {
    // enumerateGerman kennt keine Zeichen, nur Zeichenketten — sie
    // entscheidet nicht, ob ein Element sinnvoll ist. Das Überspringen
    // leerer Segmente ist eine andere Regel an anderer Stelle (E-026/E-028
    // für Leistungstexte einer Tagesgruppe), nicht diese Funktion.
    expect(enumerateGerman([''])).toBe('');
    expect(enumerateGerman(['A', ''])).toBe('A und ');
    expect(enumerateGerman(['', 'B'])).toBe(' und B');
  });

  it('ein einzelner leerer Teil unterscheidet sich am Ergebnis nicht von null Teilen — beide ergeben ""', () => {
    // Das ist genau die Zusicherung, die eine Aufrufstelle vorher prüfen muss
    // (Kommentar der Funktion: "die Aufrufstelle fragt vorher, ob es
    // überhaupt etwas aufzuzählen gibt") — ein leeres Ergebnis sagt für sich
    // allein nicht, ob es null Namen waren oder ein Name ohne Namen.
    expect(enumerateGerman([])).toBe(enumerateGerman(['']));
  });
});

describe('quoteName — deutsche Anführungszeichen um einen Namen', () => {
  it('ein gewöhnlicher Name wird in „…“ eingeschlossen', () => {
    expect(quoteName('Ost')).toBe('„Ost“');
  });

  it('ein Name mit Leerzeichen bleibt als Ganzes abgegrenzt', () => {
    expect(quoteName('Wartung Heizung')).toBe('„Wartung Heizung“');
  });

  it('ein leerer Name ergibt ein leeres Anführungszeichenpaar, keine leere Zeichenkette', () => {
    expect(quoteName('')).toBe('„“');
  });
});

describe('enumerateNames — Namen aufzählen, jeder in Anführungszeichen (T-122)', () => {
  it('null Namen (leere Liste) ergeben die leere Zeichenkette', () => {
    expect(enumerateNames([])).toBe('');
  });

  it('ein Name: „Ost“', () => {
    expect(enumerateNames(['Ost'])).toBe('„Ost“');
  });

  it('zwei Namen: „Ost“ und „Nord“', () => {
    expect(enumerateNames(['Ost', 'Nord'])).toBe('„Ost“ und „Nord“');
  });

  it('drei Namen: „Ost“, „Nord“ und „Abrechnung“ — das Beispiel aus dem Kopfkommentar der Funktion', () => {
    expect(enumerateNames(['Ost', 'Nord', 'Abrechnung'])).toBe('„Ost“, „Nord“ und „Abrechnung“');
  });

  it('ein leerer Name bleibt als leeres Anführungszeichenpaar sichtbar, statt zu verschwinden', () => {
    expect(enumerateNames([''])).toBe('„“');
    expect(enumerateNames(['Ost', ''])).toBe('„Ost“ und „“');
  });

  it('kein Gattungswort davor (E-058 Punkt 4) — die Namen stehen ohne "Pool"/"Spalte" o. Ä.', () => {
    const result = enumerateNames(['Ost', 'Nord']);
    expect(result).not.toMatch(/Pool|Spalte/i);
  });

  it('ruft erkennbar enumerateGerman(names.map(quoteName)) auf — dieselbe Form, nicht zufällig gleich', () => {
    const names = ['Ost', 'Nord', 'Abrechnung'];
    expect(enumerateNames(names)).toBe(enumerateGerman(names.map(quoteName)));
  });
});
