/**
 * Takt — T-088, E-057 (T-082): `tagAxisIsUnresolved` und `poolRuleMatchesNothing`
 * als reine Funktionen.
 *
 * Ein Ordnerterm, der auf keinen Tag auflöst, ist eine Einschränkung ohne
 * Treffer, kein Neutralwert (E-057, `.claude/team/decisions.md`). T-082 hat
 * dafür `tagAxisIsUnresolved` (termweise, `packages/domain/src/tag.ts:946`)
 * und `poolRuleMatchesNothing` (`tag.ts:1003`) eingeführt, aber laut dem
 * eigenen Bericht (Abschnitt 4) blieb dafür **kein** bestehender Prüffall in
 * `packages/domain/test/**` rot — die Domäne hatte für diese beiden Funktionen
 * bislang überhaupt keine eigene Testdatei (nachgeprüft: `grep -rn
 * tagAxisIsUnresolved packages/domain/test/` traf vor dieser Datei nichts).
 *
 * Diese Datei deckt die von T-082 benannten fünf Ecken der Ableitung ab:
 * `(named, resolved, emptyTerms)` = `(1,0,1)`, `(0,0,0)`, `(1,1,0)`, `(0,3,0)`
 * und der termweise Fall `(2,1,1)`.
 *
 * ROT-NACHWEIS ohne `src` anzufassen (meine Hoheit ist ausschließlich
 * `packages/*\/test/**`): Für jede Ecke, an der zwei plausible, aber
 * unterschiedliche Algorithmen dasselbe **nicht** ergeben, steht daneben eine
 * unabhängig in dieser Datei geschriebene, ausdrücklich falsche
 * Vergleichsfunktion — genau wie in `board.test.ts`
 * (`boardAppearancesCountingRuleTerms`). Ein bloßer Gleichheitstest gegen einen
 * erwarteten Wert wäre kein Nachweis (beide Seiten könnten denselben Fehler
 * teilen); die Vergleichsfunktion zeigt stattdessen konkret, **welche**
 * Änderung an der echten Formel den jeweiligen Fall wieder rot machen würde.
 * Die genaue Zeile in `src` steht bei jedem Fall im Kommentar.
 */
import { describe, expect, it } from 'vitest';
import { poolRuleMatchesNothing, tagAxisIsUnresolved } from '../src/tag.js';
import type { ResolvedPoolRuleAxes } from '../src/tag.js';

// ---------------------------------------------------------------------------
// tagAxisIsUnresolved — die fünf Ecken aus T-082 §4
// ---------------------------------------------------------------------------

describe('tagAxisIsUnresolved — die vier Ecken aus T-082 §4 (named, resolved, emptyTerms)', () => {
  it('(1,0,1) — ein einzelner Ordnerterm, leer: unresolved', () => {
    // Eine Regel, die nur "Tags aus Ordner Ost" nennt, und Ost ist leer.
    expect(tagAxisIsUnresolved({ named: 1, resolved: 0, emptyTerms: 1 })).toBe(true);
  });

  it('(0,0,0) — keine Bedingung genannt: NICHT unresolved (Neutralwert, A-3.4 entscheidet, nicht E-057)', () => {
    // Eine Regel, die über Tags gar nichts sagt. `poolRuleIsEmpty` fängt
    // diesen Fall auf, nicht `tagAxisIsUnresolved` — die Achse hat keine
    // Einschränkung ausgesprochen, die ins Leere zeigen könnte.
    expect(tagAxisIsUnresolved({ named: 0, resolved: 0, emptyTerms: 0 })).toBe(false);
  });

  it('(1,1,0) — ein Term, sauber aufgelöst: NICHT unresolved', () => {
    // Ein Tag-Term, oder ein Ordner mit genau einem Tag darin — in beiden
    // Fällen hat der einzige genannte Term etwas beigetragen.
    expect(tagAxisIsUnresolved({ named: 1, resolved: 1, emptyTerms: 0 })).toBe(false);
  });

  it('(0,3,0) — Grenzfall der Formel: ohne genannte Terme entscheidet "resolved" nichts', () => {
    // In der Praxis unerreichbar (drei aufgelöste Tags ohne einen einzigen
    // genannten Term gibt es nicht — Tags entstehen ausschließlich aus
    // Termen), aber die Formel behauptet es nicht implizit: Sie fragt zuerst
    // "wurde überhaupt etwas genannt" (`named`) und erst dann, was daraus
    // wurde. Eine Fassung, die stattdessen nur auf `resolved > 0` prüfte, um
    // "genannt" zu ersetzen, würde hier dieselbe Antwort geben (false) — der
    // Fall dokumentiert die Randbedingung der Formel, ohne selbst zwischen
    // zwei Lesarten zu unterscheiden. Die eigentliche Unterscheidung liefert
    // der termweise Fall darunter.
    expect(tagAxisIsUnresolved({ named: 0, resolved: 3, emptyTerms: 0 })).toBe(false);
  });

  describe('(2,1,1) — termweise statt achsenweise: der Fall, der zwei Algorithmen wirklich trennt', () => {
    // "Tag Support ODER Ordner Ost", Ost ist leer, Support liefert einen Tag.
    // named=2 (zwei Terme), resolved=1 (der eine Tag aus Support), emptyTerms=1
    // (Ost allein). Termweise: Ost bleibt eine Einschränkung ohne Treffer,
    // ungeachtet dessen, was Support beisteuert — die Regel ist unresolved.
    const axis = { named: 2, resolved: 1, emptyTerms: 1 };

    it('die echte Funktion liefert true — der leere Term zählt für sich', () => {
      expect(tagAxisIsUnresolved(axis)).toBe(true);
    });

    it('Nachweis: eine achsenweise Vergleichsfunktion liefert hier false — und trennt sich damit von der echten', () => {
      // Nachgebaut aus genau der falschen Lesart, die T-082 (Abschnitt 4b)
      // gemessen hat: "nur wenn die ganze Achse leer ausgeht". Diese Funktion
      // steht ausschließlich hier, keine Kopie von etwas in `src/`.
      //
      // Sie entspricht `tagAxisIsUnresolved`, wenn man in
      // `packages/domain/src/tag.ts:953` die Teilbedingung
      // `axis.emptyTerms > 0 ||` strichte und nur
      // `axis.named > 0 && axis.resolved === 0` übrig bliebe — die Formel vor
      // der termweisen Zählung.
      const axisWiseWrong = (input: { readonly named: number; readonly resolved: number }): boolean =>
        input.named > 0 && input.resolved === 0;

      expect(axisWiseWrong(axis)).toBe(false);
      expect(axisWiseWrong(axis)).not.toBe(tagAxisIsUnresolved(axis));
    });
  });
});

// ---------------------------------------------------------------------------
// poolRuleMatchesNothing — wo die beiden Gründe zusammenkommen
// ---------------------------------------------------------------------------

/** Eine vollständig neutrale, aufgelöste Regel — Ausgangspunkt für die Fälle unten. */
const neutralAxes: ResolvedPoolRuleAxes = {
  rule: [],
  excludedTags: [],
  statusIds: [],
  completion: 'any',
  exportState: 'any',
  unresolvedRequired: false,
};

describe('poolRuleMatchesNothing — die beiden Gründe, aus denen eine Regel nichts trifft (A-3.4, E-057)', () => {
  it('keine Bedingung genannt (isEmpty) UND aufgelöst: trifft nichts', () => {
    expect(poolRuleMatchesNothing(neutralAxes)).toBe(true);
  });

  it('eine Bedingung genannt, sauber aufgelöst, nicht unresolved: trifft NICHT "nichts" (Sanity, keine der beiden Ausnahmen greift)', () => {
    const axes: ResolvedPoolRuleAxes = { ...neutralAxes, statusIds: ['status-1'], unresolvedRequired: false };
    expect(poolRuleMatchesNothing(axes)).toBe(false);
  });

  describe('gemischte Achse: isEmpty=false, unresolvedRequired=true — der eigentliche E-057-Fall', () => {
    // "Tags aus dem leeren Ordner UND Status offen": die Statusachse ist
    // genannt (isEmpty=false), die Tagachse zeigt ins Leere
    // (unresolvedRequired=true). T-082 §4a hat exakt diesen Fall am laufenden
    // Dienst gemessen ("karten: 2", Abschnitt 14 von proof:openapi) — die
    // Zeile, die diesen Fall trägt, ist `packages/domain/src/tag.ts:1004`
    // (`poolRuleIsEmpty(axes) || axes.unresolvedRequired`).
    const mixedAxes: ResolvedPoolRuleAxes = { ...neutralAxes, statusIds: ['status-1'], unresolvedRequired: true };

    it('die echte Funktion liefert true — die Regel trifft nichts, obwohl eine Achse eine echte Bedingung nennt', () => {
      expect(poolRuleMatchesNothing(mixedAxes)).toBe(true);
    });

    it('Nachweis: "nur isEmpty" liefert hier false — genau die Antwort von vor E-057, an der die Regel still zu viel traf', () => {
      // Entspricht `poolRuleMatchesNothing`, wenn man in `tag.ts:1004` den
      // Ausdruck auf `poolRuleIsEmpty(axes)` kürzte, also `|| axes.unresolvedRequired`
      // entfernte. Reproduziert T-082 §4, Nachweis (a) ("Entscheidung ganz
      // aus") auf Ebene der reinen Funktion, ohne `src` anzufassen.
      const isEmptyOnly = (axes: ResolvedPoolRuleAxes): boolean =>
        axes.rule.length === 0 &&
        axes.excludedTags.length === 0 &&
        axes.statusIds.length === 0 &&
        axes.completion === 'any' &&
        axes.exportState === 'any';

      expect(isEmptyOnly(mixedAxes)).toBe(false);
      expect(isEmptyOnly(mixedAxes)).not.toBe(poolRuleMatchesNothing(mixedAxes));
    });
  });
});
