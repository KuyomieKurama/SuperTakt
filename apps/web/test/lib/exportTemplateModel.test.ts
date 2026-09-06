/**
 * Takt — T-140, `describeDeviations` und `duplicateFieldNames` aus
 * `apps/web/src/lib/exportTemplateModel.ts` (O-AT, T-133).
 *
 * T-133-Bericht, "Nächster Schritt" 2: "`foreignTextFrom` ist eine reine
 * Funktion in `lib/**` ... Ebenso `duplicateFieldNames` und
 * `describeDeviations` (die positionsbasierten `id`)." Bis T-140 gab es keine
 * dieser drei Prüfungen. Diese Datei nimmt die beiden hier verbliebenen auf.
 *
 * `describeDeviations` vergleicht eine Vorlage gegen die Standardvorlage und
 * meldet vier verschiedene Abweichungsarten (fehlend, andere Quelle, andere
 * Transformation, zusätzliche Bedingung), dazu zusätzliche Felder und eine
 * andere Reihenfolge. Das `id`-Feld ist **positionsbasiert** (`missing-0`,
 * `source-2`, `extra-1`, `order`) — kein fremder Text (O-AT): Bis T-133 stand
 * dort der Feldname selbst (`missing-Notiz`), unbemerkt fremder Text im
 * React-`key`. Ein Test, der nur auf den `text` schaut, würde diese Grenze
 * nicht messen — deshalb prüft jeder Fall unten auch das `id`-Feld.
 */
import { describe, expect, it } from "vitest";
import { describeDeviations, duplicateFieldNames, type ExportFieldDefinition } from "../../src/lib/exportTemplateModel";
import type { ExportConditionOperator, ExportSourcePath, ExportTransformation } from "../../src/api/types";
import type { SourceCatalog } from "../../src/lib/exportTemplateModel";

/** Ein Katalog, der nur das kann, was `describeDeviations` tatsächlich ruft. */
function fakeCatalog(): SourceCatalog {
  const sourceLabels: Record<string, string> = {
    "call.number": "Call-Nummer",
    "group.quarters": "Gerundete Zeit",
    "group.performanceText": "Leistung der Tagesgruppe",
    "hull.windowsUser": "Windows-Benutzer",
  };
  const transformationLabels: Record<string, string> = {
    none: "Unverändert",
    base64: "Base64",
  };
  const operatorLabels: Record<string, string> = {
    eq: "gleich",
    neq: "ungleich",
  };
  return {
    groups: [],
    sources: [],
    transformations: [],
    conditionOperators: [],
    noteBoundaryHint: "",
    sourcesOfGroup: () => [],
    sourceInfo: () => undefined,
    sourceLabel: (path) => sourceLabels[path] ?? path,
    transformationInfo: () => undefined,
    transformationLabel: (value) => transformationLabels[value] ?? value,
    conditionOperatorLabel: (value) => operatorLabels[value] ?? value,
    hasSource: (value): value is ExportSourcePath => typeof value === "string" && value in sourceLabels,
    hasTransformation: (value): value is ExportTransformation =>
      typeof value === "string" && value in transformationLabels,
    hasConditionOperator: (value): value is ExportConditionOperator =>
      typeof value === "string" && value in operatorLabels,
    rejectedNoteSources: [],
    firstSource: null,
    firstTransformation: null,
    firstConditionOperator: null,
  };
}

const field = (partial: Partial<ExportFieldDefinition> & Pick<ExportFieldDefinition, "name">): ExportFieldDefinition => ({
  source: "call.number",
  transformation: "none",
  ...partial,
});

/** Die Standardvorlage: Call, Zeit, Notiz, WindowsUser (E-005), mit erfundenen internen Quellenpfaden. */
const BUILTIN: readonly ExportFieldDefinition[] = [
  field({ name: "Call", source: "call.number", transformation: "none" }),
  field({ name: "Zeit", source: "group.quarters", transformation: "none" }),
  field({ name: "Notiz", source: "group.performanceText", transformation: "base64" }),
  field({ name: "WindowsUser", source: "hull.windowsUser", transformation: "none" }),
];

describe("describeDeviations — eine exakte Kopie der Standardvorlage ergibt KEINE Abweichung", () => {
  it("liefert eine leere Liste", () => {
    const result = describeDeviations(BUILTIN, BUILTIN, fakeCatalog());
    expect(result).toEqual([]);
  });
});

describe("describeDeviations — ein fehlendes Feld (missing-<Stelle>)", () => {
  it("meldet das Feld an seiner STELLE in der Standardvorlage, nicht am Namen", () => {
    const draft = BUILTIN.filter((f) => f.name !== "Notiz"); // Notiz steht an Stelle 2
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "missing-2",
      tone: "warning",
      text: "Das Feld „Notiz“ der Standardvorlage fehlt. Das Abrechnungstool erwartet es.",
    });
  });
});

describe("describeDeviations — eine andere Quelle (source-<Stelle>)", () => {
  it("meldet, was gelesen wird UND was die Standardvorlage stattdessen liest", () => {
    const draft = BUILTIN.map((f) => (f.name === "Zeit" ? { ...f, source: "call.number" } : f));
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());

    expect(result).toEqual([
      {
        id: "source-1",
        tone: "warning",
        text: "„Zeit“ liest Call-Nummer statt Gerundete Zeit.",
      },
    ]);
  });
});

describe("describeDeviations — eine andere Transformation (transformation-<Stelle>)", () => {
  it("meldet die abweichende Kodierung mit beiden Beschriftungen", () => {
    const draft = BUILTIN.map((f) => (f.name === "Notiz" ? { ...f, transformation: "none" } : f));
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());

    expect(result).toEqual([
      {
        id: "transformation-2",
        tone: "warning",
        text: "„Notiz“ wird als Unverändert ausgegeben, die Standardvorlage benutzt Base64.",
      },
    ]);
  });
});

describe("describeDeviations — eine zusätzliche Bedingung (condition-<Stelle>)", () => {
  it("benennt die Bedingung, statt sie nur zu erwähnen", () => {
    const draft = BUILTIN.map((f) =>
      f.name === "Call" ? { ...f, condition: { source: "group.quarters", op: "eq" } } : f,
    );
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());

    expect(result).toEqual([
      {
        id: "condition-0",
        tone: "warning",
        text: "„Call“ steht nur in der Datei, wenn Gerundete Zeit gleich. Die Standardvorlage gibt das Feld immer aus.",
      },
    ]);
  });
});

describe("describeDeviations — ein zusätzliches Feld (extra-<Stelle>, Hinweis statt Warnung)", () => {
  it("meldet ein Feld, das die Standardvorlage nicht kennt, als info (nicht warning)", () => {
    const draft = [...BUILTIN, field({ name: "Projekt", source: "call.number" })];
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());

    expect(result).toEqual([
      {
        id: "extra-4",
        tone: "info",
        text: "Zusätzliches Feld „Projekt“, das die Standardvorlage nicht kennt.",
      },
    ]);
  });
});

describe('describeDeviations — eine andere Reihenfolge ("order", Hinweis)', () => {
  it("meldet eine vertauschte Reihenfolge der GEMEINSAMEN Felder als info", () => {
    const draft = [BUILTIN[1], BUILTIN[0], BUILTIN[2], BUILTIN[3]] as ExportFieldDefinition[];
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());

    expect(result).toContainEqual({
      id: "order",
      tone: "info",
      text: "Die Felder stehen in einer anderen Reihenfolge als in der Standardvorlage (Call, Zeit, Notiz, WindowsUser).",
    });
  });

  it("bei nur EINEM gemeinsamen Feld wird die Reihenfolge NICHT gemeldet — sie ist an einem Feld nicht definiert", () => {
    const draft = [field({ name: "Call" })];
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());
    expect(result.some((d) => d.id === "order")).toBe(false);
  });

  it("stimmt die Reihenfolge der gemeinsamen Felder überein, wird trotz zusätzlicher Felder dazwischen NICHT gemeldet", () => {
    const draft = [BUILTIN[0], field({ name: "Extra" }), BUILTIN[1], BUILTIN[2], BUILTIN[3]] as ExportFieldDefinition[];
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());
    expect(result.some((d) => d.id === "order")).toBe(false);
  });
});

describe("describeDeviations — mehrere Abweichungsarten gleichzeitig, jede mit ihrer eigenen Stelle", () => {
  it("meldet fehlend, andere Quelle und ein zusätzliches Feld nebeneinander, ohne sich zu vermischen", () => {
    const draft = [
      field({ name: "Call", source: "group.quarters" }), // andere Quelle, Stelle 0
      // "Zeit" fehlt ganz — Stelle 1
      BUILTIN[2],
      BUILTIN[3],
      field({ name: "Kundennummer" }), // zusätzlich, Stelle 3 im Entwurf
    ] as ExportFieldDefinition[];
    const result = describeDeviations(draft, BUILTIN, fakeCatalog());

    const ids = result.map((d) => d.id).sort();
    expect(ids).toEqual(["extra-3", "missing-1", "source-0"]);
  });
});

describe("duplicateFieldNames — welche Namen mehrfach vorkommen", () => {
  it("keine Doppelung ergibt eine leere Menge", () => {
    expect(duplicateFieldNames(BUILTIN)).toEqual(new Set());
  });

  it("ein zweimal vergebener Name landet in der Menge — genau einmal, nicht je Vorkommen", () => {
    const draft = [field({ name: "Call" }), field({ name: "Zeit" }), field({ name: "Call" })];
    expect(duplicateFieldNames(draft)).toEqual(new Set(["Call"]));
  });

  it("ein Name zählt getrimmt — Leerzeichen am Rand machen aus zwei Namen keine zwei verschiedenen", () => {
    const draft = [field({ name: "Call" }), field({ name: " Call " })];
    expect(duplicateFieldNames(draft)).toEqual(new Set(["Call"]));
  });

  it("ein leerer (oder nur aus Leerzeichen bestehender) Name wird NICHT als Doppelung gezählt", () => {
    const draft = [field({ name: "" }), field({ name: "  " }), field({ name: "" })];
    expect(duplicateFieldNames(draft)).toEqual(new Set());
  });

  it("drei gleiche Namen ergeben immer noch nur EIN Element in der Menge", () => {
    const draft = [field({ name: "Call" }), field({ name: "Call" }), field({ name: "Call" })];
    expect(duplicateFieldNames(draft)).toEqual(new Set(["Call"]));
  });
});
