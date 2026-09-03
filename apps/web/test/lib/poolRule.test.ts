/**
 * Takt — T-095, `describeRuleReach` und `emptyFolderNames`
 * (`apps/web/src/lib/poolRule.ts`, R-1/R-2, E-057, T-082, T-087).
 *
 * Beide Funktionen sind rein: `describeRuleReach(description, resolved)`
 * bildet eine bereits beschriebene Regel und die Auflösung des Dienstes auf
 * einen von drei Gründen ab, warum eine Regel im Augenblick nichts trifft
 * (`empty-folder` / `no-condition` / `reachable`); `emptyFolderNames` zählt
 * die betroffenen Ordner deutsch auf. Beide brauchen kein DOM — die Datei
 * läuft mit `environment: 'node'` (Vorgabe der Wurzel-`vitest.config.ts`).
 *
 * `RuleDescription` und `PoolResolution` werden hier von Hand gebaut, nicht
 * über `describeRule`/den Dienst: Die beiden Funktionen unter Prüfung nehmen
 * beide Werte fertig entgegen, und ein handgebauter Wert hält jeden Fall
 * unabhängig vom Rest der Datei nachvollziehbar — dieselbe Bauart wie
 * `packages/domain/test/board.test.ts`, das `BoardColumnRule`-Werte ebenfalls
 * direkt zusammensetzt statt sie aus einer Regel zu berechnen.
 *
 * ---------------------------------------------------------------------------
 * E-059 — bewusst nicht berührt
 * ---------------------------------------------------------------------------
 *
 * `POOL_EXPORT_LABEL` (E-059: „Noch nicht abgerechnet"/„Abgerechnet") fließt
 * nur in `describeRule` ein, wenn es die Exportachse beschriftet — nicht in
 * `describeRuleReach` oder `emptyFolderNames`. Beide unter Prüfung lesen
 * ausschließlich `resolved.unresolvedRequired`, `description.isEmpty`,
 * `description.axes` (nur die Chips der Achse `required`) und die Liste der
 * `EmptyRuleFolder`. Kein Fall unten hängt deshalb an T-094; sollte sich das
 * durch eine künftige Änderung doch ergeben, ist das dem Orchestrator zu
 * melden statt hier stillschweigend nachgezogen zu werden.
 */
import { describe, expect, it } from "vitest";
import { describeRuleReach, emptyFolderNames } from "../../src/lib/poolRule.ts";
import type { EmptyRuleFolder, RuleAxis, RuleDescription } from "../../src/lib/poolRule.ts";
import type { PoolResolution } from "../../src/api/types.ts";

/** `PoolResolution` mit sieben Pflichtfeldern (E-057) — Vorgabe: löst alles auf, trifft etwas. */
function resolution(overrides: Partial<PoolResolution> = {}): PoolResolution {
  return {
    tagCount: 1,
    excludedTagCount: 0,
    isEmpty: false,
    unresolvedRequired: false,
    unresolvedExcluded: false,
    emptyRuleFolderIds: [],
    matchesNothing: false,
    ...overrides,
  };
}

/** Die Achse `required`, so wie `describeRule` sie aufbaut — hier von Hand, mit Ordner-Chips. */
function requiredAxis(chips: RuleAxis["chips"]): RuleAxis {
  return { id: "required", label: "Mindestens eines davon", chips, text: null };
}

/** `RuleDescription` mit den beiden Feldern, die `describeRuleReach` liest — der Rest ist Beiwerk. */
function description(overrides: Partial<RuleDescription> = {}): RuleDescription {
  return {
    axes: [],
    neutral: [],
    isEmpty: false,
    conditionCount: 1,
    ...overrides,
  };
}

describe("describeRuleReach — Reihenfolge und Benennung (E-057, T-082, T-087)", () => {
  it('Fall 1 — unresolvedRequired mit einem benannten leeren Ordner: "empty-folder" nennt Kennung und Namen', () => {
    const axes = [requiredAxis([{ kind: "folder", label: "Kunden / Ost", path: [], folderId: "ordner-ost" }])];
    const reach = describeRuleReach(
      description({ axes }),
      resolution({ unresolvedRequired: true, emptyRuleFolderIds: ["ordner-ost"] }),
    );

    expect(reach).toEqual({
      kind: "empty-folder",
      folders: [{ id: "ordner-ost", label: "Kunden / Ost" }],
    });
  });

  it('Fall 2 — unresolvedRequired OHNE genannten Ordner (emptyRuleFolderIds leer): ein unbenennbarer Eintrag, kein leeres Feld', () => {
    // "Netz für eine Termart, die eines Tages ins Leere zeigt, ohne ein Ordner
    // zu sein" (Kopfkommentar an describeRuleReach). Die Auskunft schweigt
    // trotzdem nicht: genau EIN Eintrag ohne Kennung und ohne Namen.
    const reach = describeRuleReach(
      description({ axes: [requiredAxis([])] }),
      resolution({ unresolvedRequired: true, emptyRuleFolderIds: [] }),
    );

    expect(reach).toEqual({ kind: "empty-folder", folders: [{ id: null, label: null }] });
  });

  it("Fall 3 — zwei Sorten \"unbenennbar\": eine Kennung ohne jeden Chip, ein Chip mit missing:true — beide liefern label:null, aber MIT Kennung", () => {
    const axes = [
      requiredAxis([
        // Diese Kennung trägt gar keinen Chip in der Achse (Baum hat sie nie gesehen).
        { kind: "folder", label: "Kunden / Nord", path: [], folderId: "ordner-nord" },
        // Diese schon, aber als "missing" markiert — der Baum kennt sie nicht mehr.
        { kind: "folder", label: "Unbekannter Ordner", path: [], folderId: "ordner-verschwunden", missing: true },
      ]),
    ];
    const reach = describeRuleReach(
      description({ axes }),
      resolution({
        unresolvedRequired: true,
        // "ordner-ohne-chip" steht in KEINEM Chip der Achse.
        emptyRuleFolderIds: ["ordner-ohne-chip", "ordner-verschwunden"],
      }),
    );

    expect(reach).toEqual({
      kind: "empty-folder",
      folders: [
        { id: "ordner-ohne-chip", label: null },
        { id: "ordner-verschwunden", label: null },
      ],
    });
  });

  it('Fall 4 — Priorität: unresolvedRequired UND isEmpty gleichzeitig wahr ergibt weiterhin "empty-folder", nicht "no-condition"', () => {
    // Eine Regel, die nur aus einem leeren Ordner besteht, ist nach dem
    // Auflösen leer UND unaufgelöst zugleich. "Richten Sie die Regel ein"
    // wäre hier die falsche Aufforderung — sie ist eingerichtet.
    const axes = [requiredAxis([{ kind: "folder", label: "Ost", path: [], folderId: "ordner-ost" }])];
    const reach = describeRuleReach(
      description({ axes, isEmpty: true }),
      resolution({ unresolvedRequired: true, emptyRuleFolderIds: ["ordner-ost"] }),
    );

    expect(reach.kind).toBe("empty-folder");
    expect(reach).not.toEqual({ kind: "no-condition" });
  });

  it('Fall 5 — unresolvedRequired: false, isEmpty: true ergibt "no-condition"', () => {
    const reach = describeRuleReach(description({ isEmpty: true }), resolution({ unresolvedRequired: false }));
    expect(reach).toEqual({ kind: "no-condition" });
  });

  it('Fall 6 — unresolvedRequired: false, isEmpty: false ergibt "reachable" — es steht NICHT fest, dass gerade ein Todo passt, nur dass es möglich wäre', () => {
    const reach = describeRuleReach(
      description({ isEmpty: false }),
      resolution({ unresolvedRequired: false, tagCount: 3 }),
    );
    expect(reach).toEqual({ kind: "reachable" });
  });
});

describe("emptyFolderNames — deutsche Aufzählung, Namen in Anführungszeichen, Unbenennbares nicht (E-057)", () => {
  it("Fall 7 — nur benannte Ordner: ein Name ohne Verknüpfung, zwei Namen mit „und“", () => {
    const one: readonly EmptyRuleFolder[] = [{ id: "a", label: "Kunden / Ost" }];
    const two: readonly EmptyRuleFolder[] = [
      { id: "a", label: "Kunden / Ost" },
      { id: "b", label: "Nord" },
    ];

    expect(emptyFolderNames(one)).toBe("„Kunden / Ost“");
    expect(emptyFolderNames(two)).toBe("„Kunden / Ost“ und „Nord“");
  });

  it("Fall 8 — gemischt (benannt + unbenannt) UND rein unbenannt, Einzahl gegen Mehrzahl: „einem unbekannten Ordner“ gegen „N unbekannten Ordnern“", () => {
    const namedPlusOneUnnamed: readonly EmptyRuleFolder[] = [
      { id: "a", label: "Kunden / Ost" },
      { id: null, label: null },
    ];
    const onlyTwoUnnamed: readonly EmptyRuleFolder[] = [
      { id: null, label: null },
      { id: "b", label: null },
    ];

    expect(emptyFolderNames(namedPlusOneUnnamed)).toBe("„Kunden / Ost“ und einem unbekannten Ordner");
    // Zwei unbenennbare Ordner: Mehrzahl, mit formatCount ("2") statt der
    // Ziffer — dieselbe Formatierung wie überall sonst in der Oberfläche.
    expect(emptyFolderNames(onlyTwoUnnamed)).toBe("2 unbekannten Ordnern");
  });
});
