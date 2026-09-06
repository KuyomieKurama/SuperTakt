/**
 * Takt — T-140, die Ordnung der Fassungen (A-18.4, A-18.5, A-18.10, E-064
 * Punkt 3, E-066 Punkt 3, A-V-8, A-V-9).
 *
 * Testfälle: `docs/testplan.md` Abschnitt 24, `TP-VER-15` bis `TP-VER-23`
 * (Ordnung, reine Fachlogik, ohne Attrappe lauffähig), dazu `decideUpdateNotice`
 * aus derselben Datei (E-064 Punkt 3: „neuer und nicht übersprungen").
 *
 * ---------------------------------------------------------------------------
 * Warum nicht einfach `compareVersions(a, b) === erwartet`
 * ---------------------------------------------------------------------------
 *
 * `docs/testplan.md` verlangt es wörtlich: „Schreib sie so, dass ein
 * Zeichenkettenvergleich an ihnen scheitert — sonst messen sie nicht, was sie
 * messen sollen." Ein Test, der nur die richtige Zahl erwartet, besteht auch
 * dann, wenn `compareVersions` versehentlich durch `a < b ? -1 : a > b ? 1 : 0`
 * ersetzt würde und diese Ersetzung zufällig dasselbe Ergebnis liefert. Jede
 * Tabellenzeile unten führt deshalb zusätzlich den **naiven** Zeichenkettenvergleich
 * mit und zeigt, dass er zu einem anderen Ergebnis kommt als die Fachlogik —
 * die eigentliche Prüfung folgt erst danach.
 */
import { describe, expect, it } from 'vitest';
import {
  VERSION_MAX_LENGTH,
  VERSION_SHAPE,
  RELEASE_TAG_SHAPE,
  checkVersion,
  compareVersions,
  decideUpdateNotice,
  isVersion,
  normalizeVersion,
} from '../src/version.js';

/** Der Vergleich, den ein sorgloser Aufrufer schreiben würde. */
function naiveStringOrder(a: string, b: string): -1 | 0 | 1 {
  return a === b ? 0 : a < b ? -1 : 1;
}

describe('VERSION_SHAPE und RELEASE_TAG_SHAPE — der Zeichenvorrat, aus dem die Hülle ihre Adresse baut', () => {
  it('VERSION_SHAPE lässt kein führendes v durch — RELEASE_TAG_SHAPE schon', () => {
    expect(VERSION_SHAPE.test('1.2.3')).toBe(true);
    expect(VERSION_SHAPE.test('v1.2.3')).toBe(false);
    expect(RELEASE_TAG_SHAPE.test('1.2.3')).toBe(true);
    expect(RELEASE_TAG_SHAPE.test('v1.2.3')).toBe(true);
    expect(RELEASE_TAG_SHAPE.test('V1.2.3')).toBe(false); // großes V ist kein Etikett dieses Bestands
  });

  it('keiner der beiden Ausdrücke trifft auf ein Zeichen, aus dem eine Adresse entkommen könnte', () => {
    for (const evil of ['1.2.3/../evil', '1.2.3?x=1', '1.2.3#a', '1.2.3 evil', '1.2.3\nevil', '1.2.3\\evil']) {
      expect(VERSION_SHAPE.test(evil), evil).toBe(false);
      expect(RELEASE_TAG_SHAPE.test(evil), evil).toBe(false);
    }
  });
});

describe('checkVersion — Grundform (A-V-8)', () => {
  it.each([undefined, null, 42, {}, [], true])('kein Zeichenkettenwert (%s) ist "not_a_string"', (value) => {
    expect(checkVersion(value)).toEqual({ ok: false, reason: 'not_a_string' });
  });

  it('eine leere Zeichenkette ist "empty"', () => {
    expect(checkVersion('')).toEqual({ ok: false, reason: 'empty' });
  });

  it('"v" allein ist nach dem Abschneiden leer — ebenfalls "empty", nicht "malformed"', () => {
    expect(checkVersion('v')).toEqual({ ok: false, reason: 'empty' });
  });

  it('es wird NICHT beschnitten — ein umgebendes Leerzeichen ist "malformed", nicht heimlich gültig', () => {
    expect(checkVersion(' 1.2.3')).toEqual({ ok: false, reason: 'malformed' });
    expect(checkVersion('1.2.3 ')).toEqual({ ok: false, reason: 'malformed' });
  });

  it.each(['banana', '', '1.2', '1.2.3.4', '1.2.3-', 'V1.2.3', 'vv1.2.3', '1.2.3?x=1', '../../evil'])(
    '"%s" ist keine Fassungsbezeichnung',
    (value) => {
      const result = checkVersion(value);
      expect(result.ok).toBe(false);
    },
  );

  it(`genau ${VERSION_MAX_LENGTH} Zeichen (ohne v) ist die Obergrenze und bereits gültig`, () => {
    const core = '999999999.999999999.999999999-';
    const prerelease = 'a'.repeat(VERSION_MAX_LENGTH - core.length);
    const exact = core + prerelease;
    expect(exact).toHaveLength(VERSION_MAX_LENGTH);
    const result = checkVersion(exact);
    expect(result).toEqual({
      ok: true,
      version: { value: exact, major: 999_999_999, minor: 999_999_999, patch: 999_999_999, prerelease: [prerelease] },
    });
  });

  it(`ein Zeichen über ${VERSION_MAX_LENGTH} (ohne v) ist "too_long"`, () => {
    const core = '999999999.999999999.999999999-';
    const prerelease = 'a'.repeat(VERSION_MAX_LENGTH - core.length + 1);
    const tooLong = core + prerelease;
    expect(tooLong).toHaveLength(VERSION_MAX_LENGTH + 1);
    expect(checkVersion(tooLong)).toEqual({ ok: false, reason: 'too_long' });
  });

  it('ein führendes v zählt nicht zur Länge — 94 Zeichen plus "v" bleibt gültig', () => {
    const core = '999999999.999999999.999999999-';
    const prerelease = 'a'.repeat(VERSION_MAX_LENGTH - core.length);
    const exact = `v${core}${prerelease}`;
    const result = checkVersion(exact);
    expect(result.ok).toBe(true);
  });

  it('eine 60 000 Zeichen lange Eingabe ist "too_long" und hängt sich nicht am Ausdruck auf (B-18.1 Punkt 3)', () => {
    const huge = `1.2.3-${'a'.repeat(60_000)}`;
    const started = Date.now();
    expect(checkVersion(huge)).toEqual({ ok: false, reason: 'too_long' });
    expect(Date.now() - started).toBeLessThan(100);
  });

  it('zerlegt eine gültige Fassung in ihre drei Zahlen und die Vorabkennung', () => {
    expect(checkVersion('1.2.3')).toEqual({
      ok: true,
      version: { value: '1.2.3', major: 1, minor: 2, patch: 3, prerelease: [] },
    });
    expect(checkVersion('v1.2.3-rc.1')).toEqual({
      ok: true,
      version: { value: '1.2.3-rc.1', major: 1, minor: 2, patch: 3, prerelease: ['rc', '1'] },
    });
  });

  it('genau ein führendes v fällt; ein zweites bleibt und macht die Fassung ungültig', () => {
    const stripped = checkVersion('v1.2.3');
    expect(stripped.ok).toBe(true);
    if (stripped.ok) expect(stripped.version.value).toBe('1.2.3');
    expect(checkVersion('vv1.2.3')).toEqual({ ok: false, reason: 'malformed' });
  });
});

describe('isVersion und normalizeVersion — die Kurzformen für Türen', () => {
  it('isVersion ist wahr genau dann, wenn checkVersion().ok wahr ist', () => {
    expect(isVersion('1.2.3')).toBe(true);
    expect(isVersion('v1.2.3')).toBe(true);
    expect(isVersion('banana')).toBe(false);
    expect(isVersion(null)).toBe(false);
  });

  it('normalizeVersion liefert den Wert ohne v, oder null', () => {
    expect(normalizeVersion('v1.2.3')).toBe('1.2.3');
    expect(normalizeVersion('1.2.3')).toBe('1.2.3');
    expect(normalizeVersion('banana')).toBeNull();
    expect(normalizeVersion(undefined)).toBeNull();
    expect(normalizeVersion(null)).toBeNull();
  });
});

/**
 * TP-VER-15 bis TP-VER-22 — die Ordnung selbst.
 *
 * Jede Zeile trägt installiert/veröffentlicht wie im Testplan, dazu — wo
 * angebbar — den Nachweis, dass der naive Zeichenkettenvergleich zu einem
 * ANDEREN Ergebnis käme. Wo das nicht zutrifft (TP-VER-17, -22), ist es
 * vermerkt: Diese beiden Zeilen prüfen etwas anderes (Gleichheit als eigener
 * Ausgang, Regressionsanker E-065) und sind trotzdem Pflichtfälle.
 */
describe('compareVersions — TP-VER-15 bis TP-VER-22, Zeichenkettenvergleich muss scheitern', () => {
  it('TP-VER-15: 0.9.0 installiert, 0.10.0 veröffentlicht — veröffentlicht ist neuer', () => {
    const installed = '0.9.0';
    const published = '0.10.0';
    // Der Fall aus der Aufgabenstellung wörtlich: "0.10.0" < "0.9.0" als
    // Zeichenkette, weil "1" vor "9" steht.
    expect(naiveStringOrder(published, installed)).toBe(-1);
    expect(compareVersions(published, installed)).toBe(1);
  });

  it('TP-VER-16: 0.10.0 installiert, 0.9.0 veröffentlicht — installiert ist neuer (Umkehrung von -15)', () => {
    const installed = '0.10.0';
    const published = '0.9.0';
    expect(naiveStringOrder(published, installed)).toBe(1); // Zeichenkette sagt: veröffentlicht ist neuer
    expect(compareVersions(published, installed)).toBe(-1); // Fachlogik sagt das Gegenteil
  });

  it('TP-VER-17: 1.2.3 gegen 1.2.3 — gleich, ein eigener dritter Ausgang, kein Sonderfall einer Richtung', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('TP-VER-18: 1.2.3 gegen v1.2.3 — gleich trotz führendem v (ein reiner Zeichenkettenvergleich sähe zwei verschiedene Werte)', () => {
    // die Zeichenketten selbst sind verschieden — als `unknown` gefasst,
    // damit TS den literalen Nichtüberlapp nicht schon beim Übersetzen meldet.
    const a: unknown = '1.2.3';
    const b: unknown = 'v1.2.3';
    expect(a === b).toBe(false);
    expect(compareVersions('1.2.3', 'v1.2.3')).toBe(0);
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0);
  });

  it('TP-VER-19: v1.9.0 installiert, v1.10.0 veröffentlicht — derselbe Ziffernlängenfall, zusätzlich mit führendem v', () => {
    const installed = 'v1.9.0';
    const published = 'v1.10.0';
    expect(naiveStringOrder(published, installed)).toBe(-1);
    expect(compareVersions(published, installed)).toBe(1);
  });

  it('TP-VER-20: 1.0.0 installiert, 1.0.0-beta.1 veröffentlicht — installiert ist neuer (eine Vorabfassung ist älter als die fertige Fassung)', () => {
    const installed = '1.0.0';
    const published = '1.0.0-beta.1';
    // Als Zeichenkette ist "1.0.0" ein Präfix von "1.0.0-beta.1" und damit
    // "kleiner" — das behauptet fälschlich, die fertige Fassung sei älter.
    expect(naiveStringOrder(published, installed)).toBe(1);
    expect(compareVersions(published, installed)).toBe(-1);
  });

  it('TP-VER-21: 1.0.0-beta.2 installiert, 1.0.0-beta.10 veröffentlicht — veröffentlicht ist neuer, dieselbe Ziffernlängenfalle innerhalb der Vorabkennung', () => {
    const installed = '1.0.0-beta.2';
    const published = '1.0.0-beta.10';
    // "beta.10" < "beta.2" als Zeichenkette, weil "1" vor "2" steht.
    expect(naiveStringOrder(published, installed)).toBe(-1);
    expect(compareVersions(published, installed)).toBe(1);
  });

  it('TP-VER-22: 0.0.0 installiert, 0.4.1 veröffentlicht — Regressionsanker zu E-065 ("solange 0.0.0 steht, ist jede veröffentlichte Fassung neuer")', () => {
    expect(compareVersions('0.4.1', '0.0.0')).toBe(1);
    expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
  });

  it('jede Zeile auch in der jeweils anderen Richtung, damit die Funktion nicht nur einseitig stimmt', () => {
    const pairs: ReadonlyArray<[string, string, -1 | 0 | 1]> = [
      ['0.10.0', '0.9.0', 1],
      ['1.2.3', 'v1.2.3', 0],
      ['v1.10.0', 'v1.9.0', 1],
      ['1.0.0', '1.0.0-beta.1', 1],
      ['1.0.0-beta.10', '1.0.0-beta.2', 1],
    ];
    for (const [a, b, expected] of pairs) {
      expect(compareVersions(a, b), `${a} vs ${b}`).toBe(expected);
      expect(compareVersions(b, a), `${b} vs ${a} (umgekehrt)`).toBe(
        expected === 0 ? 0 : expected === 1 ? -1 : 1,
      );
    }
  });

  it('die vollständige Vorrangkette aus der SemVer-Spezifikation, aufsteigend', () => {
    const chain = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
    ];
    for (let i = 0; i < chain.length - 1; i += 1) {
      const lower = chain[i] as string;
      const higher = chain[i + 1] as string;
      expect(compareVersions(higher, lower), `${higher} > ${lower}`).toBe(1);
      expect(compareVersions(lower, higher), `${lower} < ${higher}`).toBe(-1);
    }
  });

  it('numerische Vorabkennungen ohne führende Nullen sind gleichwertig: 1.0.0-007 == 1.0.0-7', () => {
    expect(compareVersions('1.0.0-007', '1.0.0-7')).toBe(0);
  });
});

describe('compareVersions — TP-VER-23, unsinnige Eingaben ergeben "incomparable" und werfen nie', () => {
  it.each([
    ['banana', '1.2.3'],
    ['', '1.2.3'],
    ['1.2.3.4.5.6', '1.2.3'],
    [null, '1.2.3'],
    [undefined, '1.2.3'],
    ['1.2.3', 'banana'],
  ])('compareVersions(%s, %s) ist "incomparable"', (a, b) => {
    expect(() => compareVersions(a, b)).not.toThrow();
    expect(compareVersions(a, b)).toBe('incomparable');
  });

  it('"incomparable" ist keine Zahl — ein "< 0"-Vergleich eines Aufrufers kann nicht versehentlich zutreffen', () => {
    const result = compareVersions('banana', '1.2.3');
    expect(typeof result).toBe('string');
    // @ts-expect-error — genau das darf nicht kompilieren, und zur Laufzeit nicht wahr sein.
    expect(result < 0).toBe(false);
  });
});

/**
 * `decideUpdateNotice` — E-064 Punkt 3: neuer UND nicht übersprungen.
 */
describe('decideUpdateNotice — neuer und nicht übersprungen', () => {
  it('neuer, nichts übersprungen: die Meldung erscheint mit der veröffentlichten Fassung', () => {
    const result = decideUpdateNotice({ installed: '1.0.0', latest: '1.1.0' });
    expect(result).toEqual({ show: true, version: '1.1.0' });
  });

  it('die gemeldete Fassung ist immer ohne führendes v, auch wenn GitHub mit v liefert', () => {
    const result = decideUpdateNotice({ installed: '1.0.0', latest: 'v1.1.0' });
    expect(result).toEqual({ show: true, version: '1.1.0' });
  });

  it('gleich: keine Meldung, Grund "up_to_date"', () => {
    expect(decideUpdateNotice({ installed: '1.2.3', latest: '1.2.3' })).toEqual({
      show: false,
      reason: 'up_to_date',
    });
  });

  it('installiert ist neuer als veröffentlicht: keine Meldung, Grund "up_to_date"', () => {
    expect(decideUpdateNotice({ installed: '2.0.0', latest: '1.9.0' })).toEqual({
      show: false,
      reason: 'up_to_date',
    });
  });

  it('noch nichts geprüft (latest ist null): keine Meldung, Grund "unknown" — kein Fehlerzustand', () => {
    expect(decideUpdateNotice({ installed: '1.0.0', latest: null })).toEqual({
      show: false,
      reason: 'unknown',
    });
  });

  it('die installierte Fassung ist selbst keine gültige Fassung: "unknown"', () => {
    expect(decideUpdateNotice({ installed: 'kaputt', latest: '1.1.0' })).toEqual({
      show: false,
      reason: 'unknown',
    });
  });

  it('neuer, aber genau diese Fassung wurde übersprungen: keine Meldung, Grund "skipped"', () => {
    const result = decideUpdateNotice({ installed: '1.0.0', latest: '9.9.9', skipped: '9.9.9' });
    expect(result).toEqual({ show: false, reason: 'skipped' });
  });

  it('übersprungen wirkt auch, wenn eine Seite ein führendes v trägt (Vergleich über die geprüfte Form)', () => {
    const result = decideUpdateNotice({ installed: '1.0.0', latest: 'v9.9.9', skipped: '9.9.9' });
    expect(result).toEqual({ show: false, reason: 'skipped' });
  });

  it('übersprungen wird genau EINE Fassung, nicht die Prüfung: eine später erschienene höhere Fassung meldet sich wieder (TP-VER-12)', () => {
    const result = decideUpdateNotice({ installed: '1.0.0', latest: '9.10.0', skipped: '9.9.9' });
    expect(result).toEqual({ show: true, version: '9.10.0' });
  });

  it('verglichen wird auf Gleichheit, nicht "kleiner oder gleich": eine übersprungene HÖHERE Fassung unterdrückt eine NIEDRIGERE neue Fassung nicht', () => {
    // Wäre "übersprungen" ein Boden ("alles bis hierhin"), würde dieser Fall
    // fälschlich schweigen, obwohl 1.5.0 nie übersprungen wurde.
    const result = decideUpdateNotice({ installed: '1.0.0', latest: '1.5.0', skipped: '9.9.9' });
    expect(result).toEqual({ show: true, version: '1.5.0' });
  });

  it('ein unbrauchbarer gespeicherter Übersprungen-Wert bedeutet "nichts übersprungen" — kein Wurf (T-136-4)', () => {
    expect(() => decideUpdateNotice({ installed: '1.0.0', latest: '1.1.0', skipped: 'kaputt' })).not.toThrow();
    const result = decideUpdateNotice({ installed: '1.0.0', latest: '1.1.0', skipped: 'kaputt' });
    expect(result).toEqual({ show: true, version: '1.1.0' });
  });

  it('skipped fehlt ganz (undefined): dieselbe Wirkung wie "nichts übersprungen"', () => {
    const result = decideUpdateNotice({ installed: '1.0.0', latest: '1.1.0' });
    expect(result).toEqual({ show: true, version: '1.1.0' });
  });

  it('eine Vorabfassung als installierte Fassung: die fertige Fassung meldet sich (E-066 Punkt 3)', () => {
    const result = decideUpdateNotice({ installed: '1.2.0-rc.1', latest: '1.2.0' });
    expect(result).toEqual({ show: true, version: '1.2.0' });
  });

  it('installierte Vorabfassung derselben Fassung ohne Kennung: keine Meldung (die installierte Vorabfassung ist "älter", aber es gibt nichts Neueres)', () => {
    const result = decideUpdateNotice({ installed: '1.2.0-rc.1', latest: '1.2.0-rc.1' });
    expect(result).toEqual({ show: false, reason: 'up_to_date' });
  });

  it('nie ein Wurf, gleich wie unsinnig installed/latest/skipped sind', () => {
    const eingaben: readonly unknown[] = [null, undefined, 42, {}, [], 'banana', '../../evil', ''];
    for (const installed of eingaben) {
      for (const latest of eingaben) {
        expect(() => decideUpdateNotice({ installed, latest })).not.toThrow();
      }
    }
  });
});
