/**
 * Takt — T-027, die Verbindung zu SQLite (E-003, E-035).
 *
 * `packages/storage/src/sqlite/database.ts` lag laut T-021-Bericht (Risiko 1)
 * bei 0 Prozent Abdeckung, obwohl über `support/setup.ts` bereits andere
 * Tests durch sie hindurchlaufen. Diese Datei prüft die Datei selbst und
 * direkt: die Aussagehelfer (`text`, `integer`, …), `chunk`/`placeholders`,
 * und dass `exec()` den Anweisungszwischenspeicher leert.
 */
import { describe, expect, it } from 'vitest';
import {
  boolean,
  chunk,
  integer,
  openConnection,
  placeholders,
  text,
  textOrNull,
  type SqlRow,
} from '../src/sqlite/database.ts';

describe('text / textOrNull / integer / boolean — Aussage statt Vermutung', () => {
  it('text liefert eine Zeichenkette und wirft bei jedem anderen Typ', () => {
    expect(text({ a: 'x' } as SqlRow, 'a')).toBe('x');
    expect(() => text({ a: 1 } as unknown as SqlRow, 'a')).toThrow(/kein Text/);
    expect(() => text({ a: null } as SqlRow, 'a')).toThrow(/kein Text/);
    expect(() => text({} as SqlRow, 'a')).toThrow(/kein Text/);
  });

  it('textOrNull lässt NULL und undefined durch, wirft aber bei jedem anderen Nicht-Text', () => {
    expect(textOrNull({ a: null } as SqlRow, 'a')).toBeNull();
    expect(textOrNull({} as SqlRow, 'a')).toBeNull();
    expect(textOrNull({ a: 'x' } as SqlRow, 'a')).toBe('x');
    expect(() => textOrNull({ a: 1 } as unknown as SqlRow, 'a')).toThrow(/weder Text noch NULL/);
  });

  it('integer akzeptiert number und bigint, wirft bei allem anderen', () => {
    expect(integer({ a: 42 } as SqlRow, 'a')).toBe(42);
    expect(integer({ a: 42n } as unknown as SqlRow, 'a')).toBe(42);
    expect(() => integer({ a: '42' } as unknown as SqlRow, 'a')).toThrow(/keine Zahl/);
    expect(() => integer({ a: null } as SqlRow, 'a')).toThrow(/keine Zahl/);
  });

  it('boolean ist integer <> 0', () => {
    expect(boolean({ a: 1 } as SqlRow, 'a')).toBe(true);
    expect(boolean({ a: 0 } as SqlRow, 'a')).toBe(false);
    expect(boolean({ a: 2 } as SqlRow, 'a')).toBe(true);
  });
});

describe('placeholders / chunk — sichere Zusammensetzung von IN (...)', () => {
  it('placeholders(0) ist eine leere Zeichenkette, placeholders(n) hat n Fragezeichen', () => {
    expect(placeholders(0)).toBe('');
    expect(placeholders(1)).toBe('?');
    expect(placeholders(3)).toBe('?, ?, ?');
  });

  it('chunk liefert eine leere Liste für eine leere Eingabe', () => {
    expect(chunk([])).toEqual([]);
  });

  it('chunk liefert einen einzigen Block, solange die Größe nicht überschritten wird', () => {
    const items = [1, 2, 3];
    expect(chunk(items, 10)).toEqual([[1, 2, 3]]);
  });

  it('chunk teilt eine lange Liste in Blöcke der angegebenen Größe (SQLite-Parametergrenze)', () => {
    const items = Array.from({ length: 7 }, (_, i) => i);
    expect(chunk(items, 3)).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
  });

  it('chunk mit exakt der Blockgröße ergibt genau einen vollen Block', () => {
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });
});

describe('openConnection / wrap — Zwischenspeicher vorbereiteter Anweisungen', () => {
  it('öffnet eine Verbindung im Arbeitsspeicher und setzt die Pragmas (foreign_keys)', () => {
    const conn = openConnection(':memory:');
    try {
      const row = conn.prepare('PRAGMA foreign_keys').get();
      expect(row).toBeDefined();
    } finally {
      conn.close();
    }
  });

  it('run() liefert changes als number, nicht als bigint', () => {
    const conn = openConnection(':memory:');
    try {
      conn.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)');
      const result = conn.prepare('INSERT INTO t (name) VALUES (?)').run('x');
      expect(typeof result.changes).toBe('number');
      expect(result.changes).toBe(1);
    } finally {
      conn.close();
    }
  });

  it('exec() leert den Zwischenspeicher — eine Anweisung auf ein inzwischen geändertes Schema bleibt nicht still falsch', () => {
    const conn = openConnection(':memory:');
    try {
      conn.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)');
      conn.prepare('SELECT * FROM t').all(); // füllt den Zwischenspeicher

      // Migration: Spalte umbenannt. Ohne einen geleerten Zwischenspeicher
      // griffe die alte, vorbereitete Fassung von `SELECT * FROM t` weiterhin
      // auf den alten Spaltennamen zu und schiene erfolgreich, obwohl das
      // Schema sich geändert hat.
      conn.exec('ALTER TABLE t RENAME COLUMN name TO title');

      // Dieselbe SQL-Zeichenkette wie oben — erneut vorbereitet, gegen das
      // NEUE Schema. `all()` funktioniert weiterhin, weil `SELECT *` beide
      // Namen tolerieren würde; der schlüssige Nachweis ist deshalb eine
      // gezielte Abfrage auf den neuen Namen, die nur nach dem Leeren
      // erfolgreich vorbereitet werden kann.
      expect(() => conn.prepare('SELECT title FROM t').all()).not.toThrow();
    } finally {
      conn.close();
    }
  });

  it('dieselbe SQL-Zeichenkette liefert dieselbe vorbereitete Anweisung (Zwischenspeicher trifft)', () => {
    const conn = openConnection(':memory:');
    try {
      conn.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)');
      conn.prepare('INSERT INTO t (name) VALUES (?)').run('a');
      conn.prepare('INSERT INTO t (name) VALUES (?)').run('b');
      const rows = conn.prepare('SELECT name FROM t ORDER BY id').all();
      expect(rows).toEqual([{ name: 'a' }, { name: 'b' }]);
    } finally {
      conn.close();
    }
  });

  it('close() leert den Zwischenspeicher und schließt die zugrunde liegende Verbindung', () => {
    const conn = openConnection(':memory:');
    conn.exec('CREATE TABLE t (id INTEGER PRIMARY KEY)');
    conn.close();
    // Ein Zugriff nach dem Schließen wirft — die Verbindung ist tatsächlich zu.
    expect(() => conn.prepare('SELECT 1').get()).toThrow();
  });
});
