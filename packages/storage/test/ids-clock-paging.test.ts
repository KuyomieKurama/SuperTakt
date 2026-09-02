/**
 * Takt — T-027, Kennungen (UUIDv7), Uhr und Blätterung mit Fortsetzungsmarke.
 *
 * `ids.ts`, `clock.ts` und `paging.ts` lagen laut T-021-Bericht (Risiko 1) bei
 * 0 Prozent Abdeckung. Alle drei sind reine, kleine Bausteine ohne
 * Datenbankzugriff — genau deshalb hier zusammen in einer Datei statt drei
 * winzigen.
 */
import { describe, expect, it } from 'vitest';
import { createIdSource, uuidv7 } from '../src/sqlite/ids.ts';
import { createClockPort, createSystemPort, toTimestamp } from '../src/sqlite/clock.ts';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  pageSize,
} from '../src/sqlite/paging.ts';

describe('uuidv7 — Aufbau nach RFC 9562 5.7', () => {
  const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  it('erzeugt eine Zeichenkette in der üblichen UUID-Form', () => {
    expect(uuidv7()).toMatch(UUID_SHAPE);
  });

  it('trägt Version 7 in den oberen vier Bit des siebten Bytes', () => {
    const id = uuidv7();
    const versionNibble = id.split('-')[2]?.[0];
    expect(versionNibble).toBe('7');
  });

  it('trägt die Variante 10xx in den oberen zwei Bit des neunten Bytes', () => {
    const id = uuidv7();
    const varianceNibble = id.split('-')[3]?.[0];
    expect(varianceNibble).toBeDefined();
    const value = Number.parseInt(varianceNibble as string, 16);
    // 10xx in vier Bit bedeutet: die oberen zwei Bit der Ziffer sind exakt 10,
    // also liegt der Ziffernwert zwischen 8 und 11 (0b1000 bis 0b1011).
    expect(value).toBeGreaterThanOrEqual(8);
    expect(value).toBeLessThanOrEqual(11);
  });

  it('zwei aufeinanderfolgende Kennungen sind verschieden', () => {
    expect(uuidv7()).not.toBe(uuidv7());
  });

  it('der Zeitanteil (die ersten 48 Bit) wächst monoton mit der Erzeugungszeit', () => {
    // Nur der Zeitanteil ist geordnet (die ersten 12 Hex-Ziffern ohne
    // Trennstriche, siehe Kopfkommentar). Innerhalb derselben Millisekunde
    // ist der Rest der Kennung zufällig und absichtlich NICHT geordnet — ein
    // Vergleich der vollständigen Zeichenkette wäre deshalb kein verlässlicher
    // Test. Zwei Aufrufe im Abstand von 2 ms erzwingen unterschiedliche
    // Zeitanteile.
    const timePart = (id: string): string => id.replace(/-/g, '').slice(0, 12);
    const first = uuidv7();
    const start = Date.now();
    while (Date.now() - start < 2) {
      /* eine Millisekunde sicher verstreichen lassen */
    }
    const second = uuidv7();
    expect(timePart(second) >= timePart(first)).toBe(true);
  });

  it('createIdSource().next liefert dieselbe Form wie uuidv7 direkt', () => {
    const source = createIdSource();
    expect(source.next()).toMatch(UUID_SHAPE);
  });
});

describe('toTimestamp — sekundengenau, Millisekunden abgeschnitten, UTC', () => {
  it('schneidet Millisekunden ab, statt zu runden', () => {
    const date = new Date('2026-08-31T08:00:00.999Z');
    expect(toTimestamp(date)).toBe('2026-08-31T08:00:00Z');
  });

  it('liefert die Form YYYY-MM-DDTHH:MM:SSZ', () => {
    expect(toTimestamp(new Date('2026-01-01T00:00:00.000Z'))).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});

describe('createClockPort', () => {
  it('now() liefert den über die injizierte Funktion gelieferten Zeitpunkt, sekundengenau', () => {
    const fixed = () => new Date('2026-08-31T12:34:56.789Z');
    const clock = createClockPort(fixed);
    expect(clock.now()).toBe('2026-08-31T12:34:56Z');
  });

  it('monotonicSeconds liefert eine nicht negative, wachsende Ganzzahl', () => {
    const clock = createClockPort();
    const first = clock.monotonicSeconds();
    expect(Number.isInteger(first)).toBe(true);
    expect(first).toBeGreaterThanOrEqual(0);
    const second = clock.monotonicSeconds();
    expect(second).toBeGreaterThanOrEqual(first);
  });

  it('ohne Argument benutzt createClockPort die tatsächliche Wanduhr', () => {
    const clock = createClockPort();
    const before = Date.now();
    const value = clock.now();
    const after = Date.now();
    const parsed = Date.parse(value);
    // Toleranz von einer Sekunde für das Abschneiden der Millisekunden.
    expect(parsed).toBeGreaterThanOrEqual(before - 1000);
    expect(parsed).toBeLessThanOrEqual(after + 1000);
  });
});

describe('createSystemPort — reicht den Benutzernamen unverändert weiter (E-042, B-8.1)', () => {
  it('windowsUser() liefert exakt den übergebenen Wert, kein Rückfall auf process.env', () => {
    const system = createSystemPort('t.beispiel');
    expect(system.windowsUser()).toBe('t.beispiel');
  });

  it('ein leerer Benutzername wird ebenfalls unverändert durchgereicht (keine stille Ersetzung)', () => {
    expect(createSystemPort('').windowsUser()).toBe('');
  });
});

describe('pageSize — Vorgabe und Obergrenze', () => {
  it('ohne Angabe die Vorgabe', () => {
    expect(pageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('ein nicht endlicher Wert (NaN, Infinity) ergibt die Vorgabe', () => {
    expect(pageSize(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
    expect(pageSize(Number.POSITIVE_INFINITY)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('ein Wert unter 1 (auch negativ oder 0) wird zu 1', () => {
    expect(pageSize(0)).toBe(1);
    expect(pageSize(-5)).toBe(1);
  });

  it('ein Wert über der Obergrenze wird auf sie gekappt', () => {
    expect(pageSize(MAX_PAGE_SIZE + 100)).toBe(MAX_PAGE_SIZE);
  });

  it('ein gebrochener Wert wird abgerundet', () => {
    expect(pageSize(10.9)).toBe(10);
  });

  it('ein gültiger Wert innerhalb der Grenzen bleibt unverändert', () => {
    expect(pageSize(25)).toBe(25);
  });
});

describe('encodeCursor / decodeCursor — Hin- und Rückweg', () => {
  it('kodiert und dekodiert Sortierschlüssel und Kennung unverändert', () => {
    const cursor = { sort: '2026-08-31T08:00:00Z', id: 'te-0001' };
    const encoded = encodeCursor(cursor);
    expect(decodeCursor(encoded)).toEqual(cursor);
  });

  it('die Marke ist base64url — enthält kein "+", "/" oder "="', () => {
    const encoded = encodeCursor({ sort: 'a'.repeat(50), id: 'b'.repeat(50) });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('funktioniert mit Werten, die das Trennzeichen (Leerzeichen) nicht selbst enthalten', () => {
    const cursor = { sort: '2026-08-31T08:00:00Z', id: 'a-b-c_1234567890' };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('decodeCursor(undefined) und decodeCursor("") ergeben null — die erste Seite, kein Fehler', () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
  });

  it('eine unlesbare/beschädigte Marke ergibt null statt eines Wurfs', () => {
    expect(decodeCursor('!!!nicht-base64url!!!')).toBeNull();
  });

  it('eine Marke ohne Trennzeichen (kein Leerzeichen im dekodierten Inhalt) ergibt null', () => {
    const withoutSeparator = Buffer.from('keinTrennzeichen', 'utf8').toString('base64url');
    expect(decodeCursor(withoutSeparator)).toBeNull();
  });

  it('eine Marke, die mit dem Trennzeichen beginnt (leerer Sortierschlüssel), ergibt null', () => {
    const leadingSeparator = Buffer.from(' nur-id', 'utf8').toString('base64url');
    expect(decodeCursor(leadingSeparator)).toBeNull();
  });
});
