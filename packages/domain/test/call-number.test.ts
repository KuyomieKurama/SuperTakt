/**
 * Takt — T-010b, Nachtrag: Plausibilisierung der Call-Nummer (E-045, B-4.3, B-4.4, R-15).
 *
 * `call-number.ts` ist neu seit T-009/T-010 und lag bei 0 Prozent Abdeckung in
 * jedem Maß — die Datei entstand parallel zu dieser Aufgabe im Zuge von T-021
 * (E-045: die Regel zog von zwei Fassungen — Add-in und Dienst — in die
 * Domäne). Sie zieht `packages/domain/src` unter die 80-Prozent-Schwelle
 * (79,31 % Zeilen, 76,92 % Zweige, gemessen vor diesem Nachtrag), obwohl jede
 * andere Datei im Paket vollständig abgedeckt ist.
 *
 * Die Regel entscheidet mit, ob das Duplikatangebot aus A-10.9 auf den
 * richtigen Kundenvorgang zeigt (R-15): Trifft sie falsch, landet Arbeitszeit
 * auf einer fremden Rechnung. Das ist derselbe Rang wie die Rundung — ein
 * Fehler hier kostet Geld, nicht nur Bedienkomfort.
 */
import { describe, expect, it } from 'vitest';
import { checkCallNumber, mayLookUpDuplicates, normalizeCallNumber } from '../src/call-number.js';
import { CALL_NUMBER_MAX_LENGTH, CALL_NUMBER_MIN_LENGTH } from '../src/call-number.js';

describe('checkCallNumber — Grundform (B-4.3)', () => {
  it.each([undefined, null, 42, {}, [], true])('ein Wert, der keine Zeichenkette ist (%s), ist "empty"', (value) => {
    const result = checkCallNumber(value);
    expect(result).toEqual({ ok: false, reason: 'empty' });
  });

  it('eine leere Zeichenkette ist "empty"', () => {
    expect(checkCallNumber('')).toEqual({ ok: false, reason: 'empty' });
  });

  it('eine Zeichenkette aus ausschließlich Leerzeichen ist "empty", NICHT "forbidden_characters" (Beschneiden zuerst)', () => {
    // Wörtlich aus dem Kommentar der Funktion: Beschnitten wird vor allen
    // Längen- und Zeichenprüfungen. Eine Umsetzung, die zuerst auf den
    // Zeichenvorrat prüft, verwechselte hier die Ursache.
    expect(checkCallNumber('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it(`kürzer als ${CALL_NUMBER_MIN_LENGTH} Zeichen nach dem Beschneiden ist "too_short"`, () => {
    expect(checkCallNumber('AB')).toEqual({ ok: false, reason: 'too_short' });
    // Auch mit umschließenden Leerzeichen zählt die beschnittene Länge.
    expect(checkCallNumber('  AB  ')).toEqual({ ok: false, reason: 'too_short' });
  });

  it(`genau ${CALL_NUMBER_MIN_LENGTH} Zeichen ist die Untergrenze und bereits gültig`, () => {
    const result = checkCallNumber('ABC');
    expect(result).toEqual({ ok: true, value: 'ABC' });
  });

  it(`länger als ${CALL_NUMBER_MAX_LENGTH} Zeichen nach dem Beschneiden ist "too_long"`, () => {
    const tooLong = 'A'.repeat(CALL_NUMBER_MAX_LENGTH + 1);
    expect(checkCallNumber(tooLong)).toEqual({ ok: false, reason: 'too_long' });
  });

  it(`genau ${CALL_NUMBER_MAX_LENGTH} Zeichen ist die Obergrenze und bereits gültig`, () => {
    const exact = 'A'.repeat(CALL_NUMBER_MAX_LENGTH);
    const result = checkCallNumber(exact);
    expect(result).toEqual({ ok: true, value: exact });
  });

  it.each(['TCK 0001', 'TCK"0001', "TCK'0001", 'TCK\t0001', 'Übertragung', 'TCK@0001', 'TCK=0001', 'TCK+0001'])(
    'ein verbotenes Zeichen ("%s") ergibt "forbidden_characters"',
    (value) => {
      const result = checkCallNumber(value);
      expect(result).toEqual({ ok: false, reason: 'forbidden_characters' });
    },
  );

  it('Punkt, Unterstrich, Schrägstrich und Bindestrich (nicht am Anfang) sind erlaubt', () => {
    expect(checkCallNumber('TCK.000_042/1-A')).toEqual({ ok: true, value: 'TCK.000_042/1-A' });
  });

  it('ein Bindestrich am ANFANG ist der einzige Zeichenvorrat-Wert, der "formula_start" statt "forbidden_characters" auslöst', () => {
    // "=", "+" und "@" fallen laut Kopfkommentar bereits am Zeichenvorrat
    // durch (siehe forbidden_characters oben) — nur "-" steht im erlaubten
    // Vorrat und muss deshalb eigens auf die führende Position geprüft werden.
    // "-000042" besteht ausschließlich aus erlaubten Zeichen (Ziffern und
    // Bindestrich), erreicht also überhaupt erst die formula_start-Prüfung.
    expect(checkCallNumber('-000042')).toEqual({ ok: false, reason: 'formula_start' });
  });

  it('ein Bindestrich in der MITTE ist unproblematisch (TCK-000042 ist eine übliche Schreibweise)', () => {
    expect(checkCallNumber('TCK-000042')).toEqual({ ok: true, value: 'TCK-000042' });
  });

  it('das Ergebnis trägt den BESCHNITTENEN Wert, nicht die Rohfassung mit Leerzeichen', () => {
    const result = checkCallNumber('  TCK-1  ');
    expect(result).toEqual({ ok: true, value: 'TCK-1' });
  });
});

describe('mayLookUpDuplicates — Vertrauensgrenze für die Duplikatsuche (B-4.3 Punkt 4, R-15)', () => {
  it('eine plausible Call-Nummer darf gesucht werden', () => {
    expect(mayLookUpDuplicates('TCK-000042')).toBe(true);
  });

  it('eine leere oder unplausible Call-Nummer darf NICHT gesucht werden — nie ein Übereinstimmungskriterium', () => {
    expect(mayLookUpDuplicates('')).toBe(false);
    expect(mayLookUpDuplicates('   ')).toBe(false);
    expect(mayLookUpDuplicates(null)).toBe(false);
    expect(mayLookUpDuplicates(undefined)).toBe(false);
    expect(mayLookUpDuplicates('-2+3')).toBe(false);
    expect(mayLookUpDuplicates('AB')).toBe(false);
  });

  it('spiegelt exakt checkCallNumber().ok — keine zweite, abweichende Fassung der Regel', () => {
    const samples = ['TCK-000042', '', '  ', 'AB', '-2+3', 'A'.repeat(CALL_NUMBER_MAX_LENGTH + 1)];
    for (const sample of samples) {
      expect(mayLookUpDuplicates(sample)).toBe(checkCallNumber(sample).ok);
    }
  });
});

describe('normalizeCallNumber — Speicherform, leer oder Wert (A-2.6, R-15)', () => {
  it('null bleibt null', () => {
    expect(normalizeCallNumber(null)).toBeNull();
  });

  it('undefined wird zu null', () => {
    expect(normalizeCallNumber(undefined)).toBeNull();
  });

  it('eine Zeichenkette aus ausschließlich Leerzeichen wird zu null — "" und "  " sind derselbe Speicherwert', () => {
    expect(normalizeCallNumber('   ')).toBeNull();
    expect(normalizeCallNumber('')).toBeNull();
  });

  it('ein nicht leerer Wert wird beschnitten zurückgegeben', () => {
    expect(normalizeCallNumber('  TCK-1  ')).toBe('TCK-1');
  });

  it('ein nicht leerer, aber UNPLAUSIBLER Wert wird hier nicht verworfen — das ist Sache des Anwendungsfalls', () => {
    // Wörtlich aus dem Kommentar: "Ob eine unplausible Nummer angenommen oder
    // abgewiesen wird, ist eine Entscheidung des Anwendungsfalls." Ein Wert mit
    // einem Leerzeichen in der Mitte ist laut checkCallNumber unplausibel,
    // bleibt hier aber (beschnitten) erhalten.
    expect(checkCallNumber('TCK 0001').ok).toBe(false);
    expect(normalizeCallNumber('  TCK 0001  ')).toBe('TCK 0001');
  });
});
