/**
 * Takt — T-095, die Laufzeitwache in `matchesPool` über `unresolvedRequired`
 * (E-057, O-L, R-3 H-3, T-089).
 *
 * `unresolvedRequired` ist seit T-089 das einzige Pflichtfeld der Regelseite
 * von `matchesPool` (`MatchesPoolRule`). Der Übersetzer erzwingt das Feld für
 * jeden getippten Aufrufer — auch für Testdateien, seit `tsconfig.test.json`
 * existiert (T-088). Ein `.mjs`-Nachweisskript oder ein Aufrufer, der das
 * Ergebnis eines externen Dienstes ungeprüft durchreicht, sieht kein `tsc` und
 * bekäme das Feld zur Laufzeit als `undefined` — also als "nein", die Antwort
 * von vor E-057. Deshalb wirft `matchesPool` bei einem fehlenden oder falsch
 * getippten Feld, statt es stillschweigend als `false` zu lesen.
 *
 * Diese Datei baut die fehlerhaften Aufrufer absichtlich über eine
 * Typzusicherung nach, so wie andere Testdateien im Projekt es an
 * vergleichbarer Stelle tun (siehe `'unbekannt' as never` in
 * `packages/storage/test/repo-tags.test.ts`): Die Umgehung des Typsystems ist
 * hier der Punkt, nicht ein Versehen.
 */
import { describe, expect, it } from 'vitest';
import { matchesPool } from '../src/tag.ts';
import type { MatchesPoolCandidate, MatchesPoolRule } from '../src/tag.ts';
import type { TagId } from '../src/kernel.ts';

const tagId = (value: string) => value as unknown as TagId;

/** Eine vollständige, gültige Regel — Ausgangspunkt für jeden Fall unten. */
const validRule: MatchesPoolRule = {
  ruleTagIds: [tagId('a')],
  matchMode: 'any',
  unresolvedRequired: false,
};
const candidate: MatchesPoolCandidate = { todoTagIds: [tagId('a')] };

type MatchesPoolInput = Parameters<typeof matchesPool>[0];

describe('matchesPool — Laufzeitwache über `unresolvedRequired` (E-057, T-089)', () => {
  it('wirft, wenn `unresolvedRequired` ganz fehlt (Objekt ohne das Feld, per Zusicherung eingeschleust)', () => {
    const { unresolvedRequired: _omitted, ...withoutGuard } = validRule;
    const input = { ...withoutGuard, ...candidate } as unknown as MatchesPoolInput;

    expect(() => matchesPool(input)).toThrow(TypeError);
    expect(() => matchesPool(input)).toThrow(/unresolvedRequired/);
  });

  it('wirft, wenn `unresolvedRequired` `undefined` ist (derselbe Fall wie "fehlt", nur ausdrücklich gesetzt)', () => {
    const input = {
      ...validRule,
      ...candidate,
      unresolvedRequired: undefined,
    } as unknown as MatchesPoolInput;

    expect(() => matchesPool(input)).toThrow(TypeError);
  });

  it('wirft, wenn `unresolvedRequired` eine Zeichenkette ist ("true" ist kein Wahrheitswert)', () => {
    const input = {
      ...validRule,
      ...candidate,
      unresolvedRequired: 'true',
    } as unknown as MatchesPoolInput;

    expect(() => matchesPool(input)).toThrow(TypeError);
  });

  it('wirft, wenn `unresolvedRequired` `null` ist', () => {
    const input = {
      ...validRule,
      ...candidate,
      unresolvedRequired: null,
    } as unknown as MatchesPoolInput;

    expect(() => matchesPool(input)).toThrow(TypeError);
  });

  it('wirft, wenn `unresolvedRequired` eine Zahl ist (0 ist nicht dasselbe wie `false`)', () => {
    const input = {
      ...validRule,
      ...candidate,
      unresolvedRequired: 0,
    } as unknown as MatchesPoolInput;

    expect(() => matchesPool(input)).toThrow(TypeError);
  });

  it('Gegenprobe: `unresolvedRequired: false` wirft NICHT und liefert das reguläre Ergebnis', () => {
    expect(() => matchesPool({ ...validRule, ...candidate, unresolvedRequired: false })).not.toThrow();
    expect(matchesPool({ ...validRule, ...candidate, unresolvedRequired: false })).toBe(true);
  });

  it('Gegenprobe: `unresolvedRequired: true` wirft NICHT — die Regel trifft dann fachlich nichts (E-057), aber die Wache selbst schlägt nicht an', () => {
    expect(() => matchesPool({ ...validRule, ...candidate, unresolvedRequired: true })).not.toThrow();
    expect(matchesPool({ ...validRule, ...candidate, unresolvedRequired: true })).toBe(false);
  });
});

describe('Rot-Nachweis — eine Fassung ohne die Wache (die Antwort von vor E-057) unterscheidet sich messbar', () => {
  /**
   * ROT ZUERST, nachgewiesen als Diskriminierungsfähigkeit statt als
   * fehlende Funktion (dasselbe Muster wie `boardAppearancesCountingRuleTerms`
   * in `board.test.ts`): Die Wache in `matchesPool` existiert bereits seit
   * T-089 und war zu keinem Zeitpunkt dieser Aufgabe fehlerhaft — ein Lauf
   * der Prüfungen oben gegen den unveränderten Bestand ist deshalb von
   * Anfang an grün, es gibt keinen echten Rot-Zustand am Produktivcode.
   *
   * Damit die Prüfungen oben trotzdem nachweislich etwas prüfen und nicht nur
   * zufällig grün sind: Diese Fassung bildet exakt den Fehler nach, den die
   * Wache verhindern soll — `unresolvedRequired` wird mit `?? false` gelesen
   * statt seinen Typ zu prüfen, also die Antwort von vor E-057 (T-078).
   * Ausschließlich in dieser Testdatei, keine Zeile in `src/`. Ein Lauf der
   * OBEN stehenden Prüfungen gegen DIESE Fassung wäre rot — sie schlägt bei
   * exakt denselben Eingaben nicht an, bei denen die echte Wache wirft.
   */
  const matchesPoolWithoutGuard = (input: {
    readonly unresolvedRequired: unknown;
  }): boolean => Boolean(input.unresolvedRequired ?? false);

  it('dieselben vier fehlerhaften Eingaben, die oben einen Wurf auslösen, lösen HIER keinen Wurf aus', () => {
    const missing = { unresolvedRequired: undefined };
    const wrongType = { unresolvedRequired: 'true' };
    const nullValue = { unresolvedRequired: null };
    const zero = { unresolvedRequired: 0 };

    for (const input of [missing, wrongType, nullValue, zero]) {
      expect(() => matchesPoolWithoutGuard(input)).not.toThrow();
    }
    // Zum Vergleich: die echte Wache wirft bei allen vieren (siehe oben).
    for (const input of [missing, wrongType, nullValue, zero]) {
      expect(() =>
        matchesPool({ ...validRule, ...candidate, unresolvedRequired: input.unresolvedRequired as never }),
      ).toThrow(TypeError);
    }
  });
});
