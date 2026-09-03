/**
 * Takt — T-095, `poolMovementSentence` (E-058 Punkt 4).
 *
 * `packages/domain/src/pool-movement.ts` lag nach Welle A bei 0 Prozent
 * Abdeckung (Orchestrator-Messung nach T-089/T-090/T-091: Zweigabdeckung
 * `packages/domain/src` 69,72 % statt 80 %, allein durch diese Datei). Diese
 * Datei schließt die Lücke und ist zugleich der Nachweis für E-058 Punkt 4.
 *
 * ---------------------------------------------------------------------------
 * Gegen die Tabelle, nicht gegen die Datei
 * ---------------------------------------------------------------------------
 *
 * T-093 (domain-dev) ändert den Wortlaut in `pool-movement.ts` parallel zu
 * dieser Aufgabe: kein Gattungswort ("Pool"/"Pools") vor dem Namen, nur der
 * Name in deutschen Anführungszeichen, und "sonst nirgends" statt "in keinem
 * anderen". Diese Datei prüft ausdrücklich gegen den Wortlaut aus der Tabelle
 * in `.claude/team/board.md` bei T-093 (= E-058 Punkt 4), zeichengenau — nicht
 * gegen den Stand, der beim Schreiben dieser Datei zufällig im Arbeitsbaum
 * lag. Ist ein Fall rot, weil T-093 noch nicht gelandet ist, ist das der
 * erwartete, dokumentierte Rot-Zustand (siehe Bericht T-095).
 *
 * Aufzählung mehrerer Namen: „A“, „B“ und „C“ — deutsche Anführungszeichen,
 * Komma, „und“ vor dem letzten. Das wird unten eigens geprüft (drei Namen in
 * einer Liste), unabhängig von den Einzelfällen der Tabelle.
 */
import { describe, expect, it } from 'vitest';
import { poolMovementSentence } from '../src/pool-movement.ts';
import type { PoolMovement } from '../src/pool-movement.ts';

const movement = (partial: Partial<PoolMovement>): PoolMovement => ({
  appears: [],
  enters: [],
  leaves: [],
  ...partial,
});

describe('poolMovementSentence — Anlass "reopen" (Wiederöffnen), Wortlaut aus E-058 Punkt 4', () => {
  it('nichts erscheint, nichts verschwindet — Ankündigung (future)', () => {
    const result = poolMovementSentence(movement({}), 'future', 'reopen');
    expect(result).toBe(
      'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool und in keiner Spalte.',
    );
  });

  it('nichts erscheint, nichts verschwindet — Bericht (past)', () => {
    const result = poolMovementSentence(movement({}), 'past', 'reopen');
    expect(result).toBe(
      'Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte.',
    );
  });

  it('nur leaves — future: "…und erscheint sonst nirgends", nicht "in keinem anderen"', () => {
    const result = poolMovementSentence(movement({ leaves: ['Ost'] }), 'future', 'reopen');
    expect(result).toBe('Es verschwindet dann aus „Ost“ und erscheint sonst nirgends.');
  });

  it('nur leaves — past', () => {
    const result = poolMovementSentence(movement({ leaves: ['Ost'] }), 'past', 'reopen');
    expect(result).toBe('Es ist aus „Ost“ verschwunden und erscheint sonst nirgends.');
  });

  it('nur appears — future: kein Gattungswort, nur der Name in „…“', () => {
    const result = poolMovementSentence(movement({ appears: ['Abrechnung'] }), 'future', 'reopen');
    expect(result).toBe('Es erscheint dann wieder in „Abrechnung“.');
  });

  it('nur appears — past', () => {
    const result = poolMovementSentence(movement({ appears: ['Abrechnung'] }), 'past', 'reopen');
    expect(result).toBe('Es ist zurück in „Abrechnung“.');
  });

  it('beides (appears und leaves) — future', () => {
    const result = poolMovementSentence(
      movement({ appears: ['Abrechnung'], leaves: ['Ost'] }),
      'future',
      'reopen',
    );
    expect(result).toBe('Es erscheint dann wieder in „Abrechnung“ und verschwindet aus „Ost“.');
  });

  it('beides (appears und leaves) — past', () => {
    const result = poolMovementSentence(
      movement({ appears: ['Abrechnung'], leaves: ['Ost'] }),
      'past',
      'reopen',
    );
    expect(result).toBe('Es ist zurück in „Abrechnung“ und aus „Ost“ verschwunden.');
  });

  it('liefert im Anlass "reopen" NIE null — auch nicht im leeren Fall (Gegenprobe zu "booking")', () => {
    const empty = poolMovementSentence(movement({}), 'future', 'reopen');
    const withMovement = poolMovementSentence(movement({ appears: ['X'] }), 'future', 'reopen');
    expect(typeof empty).toBe('string');
    expect(typeof withMovement).toBe('string');
  });

  it('Aufzählung von drei Namen: „A“, „B“ und „C“ — Komma zwischen den ersten, „und“ vor dem letzten', () => {
    const result = poolMovementSentence(
      movement({ appears: ['A', 'B', 'C'] }),
      'future',
      'reopen',
    );
    expect(result).toBe('Es erscheint dann wieder in „A“, „B“ und „C“.');
  });
});

describe('poolMovementSentence — Anlass "booking" (reine Buchung), Wortlaut aus E-058 Punkt 4', () => {
  it('nichts erscheint, nichts verschwindet — future ist null (keine Bewegung, kein Satz)', () => {
    expect(poolMovementSentence(movement({}), 'future', 'booking')).toBeNull();
  });

  it('nichts erscheint, nichts verschwindet — past ist ebenfalls null', () => {
    expect(poolMovementSentence(movement({}), 'past', 'booking')).toBeNull();
  });

  it('nur enters — future', () => {
    const result = poolMovementSentence(movement({ enters: ['Abrechnung'] }), 'future', 'booking');
    expect(result).toBe('Es erscheint dann in „Abrechnung“.');
  });

  it('nur enters — past', () => {
    const result = poolMovementSentence(movement({ enters: ['Abrechnung'] }), 'past', 'booking');
    expect(result).toBe('Es steht jetzt in „Abrechnung“.');
  });

  it('nur leaves — future', () => {
    const result = poolMovementSentence(movement({ leaves: ['Ost'] }), 'future', 'booking');
    expect(result).toBe('Es verschwindet dann aus „Ost“.');
  });

  it('nur leaves — past', () => {
    const result = poolMovementSentence(movement({ leaves: ['Ost'] }), 'past', 'booking');
    expect(result).toBe('Es ist aus „Ost“ verschwunden.');
  });

  it('beides (enters und leaves) — future', () => {
    const result = poolMovementSentence(
      movement({ enters: ['Abrechnung'], leaves: ['Ost'] }),
      'future',
      'booking',
    );
    expect(result).toBe('Es erscheint dann in „Abrechnung“ und verschwindet aus „Ost“.');
  });

  it('beides (enters und leaves) — past', () => {
    const result = poolMovementSentence(
      movement({ enters: ['Abrechnung'], leaves: ['Ost'] }),
      'past',
      'booking',
    );
    expect(result).toBe('Es steht jetzt in „Abrechnung“ und ist aus „Ost“ verschwunden.');
  });

  it('Aufzählung von drei Namen bei "enters": „A“, „B“ und „C“', () => {
    const result = poolMovementSentence(movement({ enters: ['A', 'B', 'C'] }), 'future', 'booking');
    expect(result).toBe('Es erscheint dann in „A“, „B“ und „C“.');
  });

  it('null ist wörtlich null, kein leerer String — der Aufrufer muss den Fall unterscheiden', () => {
    const result = poolMovementSentence(movement({}), 'future', 'booking');
    expect(result).toBeNull();
    expect(result).not.toBe('');
  });
});

describe('Rot-Nachweis — die Fassung vor T-093 (Commit afb3578) erfüllt die Tabelle aus E-058 Punkt 4 NICHT', () => {
  /**
   * ROT ZUERST, nachgewiesen als Diskriminierungsfähigkeit statt als
   * fehlende Funktion (dasselbe Muster wie in `board.test.ts`,
   * `boardAppearancesCountingRuleTerms`): Als diese Testdatei entstand, stand
   * in `packages/domain/src/pool-movement.ts` noch die Fassung aus T-089
   * (Commit `afb3578`) — wörtlich mit `inPools`, „in keinem anderen" und ohne
   * die Spalte im leeren Fall. Der Lauf gegen diese Fassung war rot (siehe
   * Bericht T-095, Abschnitt „Rot vor Grün", für die mitgeschnittenen
   * Fehlermeldungen). Noch während dieser Aufgabe landete T-093 (domain-dev,
   * parallel) die Umstellung auf den Wortlaut der Tabelle — die Prüfungen
   * oben liefen danach ohne Änderung grün.
   *
   * Damit der Unterschied im Prüflauf sichtbar bleibt statt nach der
   * Umstellung spurlos zu verschwinden: Diese zwei Bausteine sind wörtlich
   * die Fassung vor T-093, ausschließlich in dieser Testdatei — keine Zeile
   * in `src/`. Sie belegen, dass die Prüfungen oben tatsächlich zwischen
   * „richtig" und „vor T-093" unterscheiden, statt zufällig mit beidem grün
   * zu sein.
   */
  const listPoolsPreT093 = (poolNames: readonly string[]): string => {
    const quoted = poolNames.map((name) => `„${name}“`);
    if (quoted.length <= 1) return quoted[0] ?? '';
    return `${quoted.slice(0, -1).join(', ')} und ${quoted[quoted.length - 1] ?? ''}`;
  };
  const inPoolsPreT093 = (names: readonly string[]): string =>
    `${names.length === 1 ? 'dem Pool' : 'den Pools'} ${listPoolsPreT093(names)}`;

  it('"nichts, nichts" nannte nur "Pool", nicht "Pool und Spalte" — die Tabelle verlangt beide Flächen', () => {
    const preT093 = 'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool.';
    const tableWording = poolMovementSentence(movement({}), 'future', 'reopen');

    expect(preT093).not.toBe(tableWording);
    expect(tableWording).toBe(
      'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool und in keiner Spalte.',
    );
  });

  it('"nur leaves" sagte "dem Pool „X“" und "in keinem anderen" — die Tabelle verlangt den bloßen Namen und "sonst nirgends"', () => {
    const preT093 = `Es verschwindet dann aus ${inPoolsPreT093(['Ost'])} und erscheint in keinem anderen.`;
    const tableWording = poolMovementSentence(movement({ leaves: ['Ost'] }), 'future', 'reopen');

    expect(preT093).toBe('Es verschwindet dann aus dem Pool „Ost“ und erscheint in keinem anderen.');
    expect(preT093).not.toBe(tableWording);
    expect(tableWording).toBe('Es verschwindet dann aus „Ost“ und erscheint sonst nirgends.');
  });
});

describe('poolMovementSentence — dritte Überladung (zur Laufzeit entschiedener Anlass)', () => {
  it('occasion als Variable vom Typ PoolMovementOccasion: "reopen" verhält sich wie die feste Überladung', () => {
    const occasion: 'reopen' | 'booking' = 'reopen';
    const result = poolMovementSentence(movement({ appears: ['Abrechnung'] }), 'future', occasion);
    expect(result).toBe('Es erscheint dann wieder in „Abrechnung“.');
  });

  it('occasion als Variable: "booking" liefert weiterhin null bei fehlender Bewegung', () => {
    const occasion: 'reopen' | 'booking' = 'booking';
    const result = poolMovementSentence(movement({}), 'future', occasion);
    expect(result).toBeNull();
  });
});
