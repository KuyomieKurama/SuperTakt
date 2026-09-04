/**
 * Takt — `apps/web/src/lib/errorText.ts` (T-100, Auftrag aus T-097 „Nächster
 * Schritt" 3, Wortlaute gemessen im Bericht `reports/T-097-frontend-dev.md`).
 *
 * Drei reine Funktionen, kein DOM: `enumerateGerman`, `ruleReferences`,
 * `errorMessageWithRules`. Die Datei läuft mit `environment: 'node'`
 * (Vorgabe der Wurzel-`vitest.config.ts`).
 *
 * ---------------------------------------------------------------------------
 * Woher die Testdaten kommen
 * ---------------------------------------------------------------------------
 *
 * `TaktApiError` wird über den echten Konstruktor gebaut (`apps/web/src/api/
 * client.ts`), nicht als literales Objekt — `details` normalisiert dort auf
 * `[]`, wenn der Dienst das Feld auslässt, und genau dieses Verhalten prüft
 * ein eigener Fall unten.
 *
 * Die Gestalt von `details[]` ist die aus `packages/storage/src/sqlite/
 * mappers.ts` (`poolReference`): `{ code: 'pool_rule', field: <Pool-Kennung>,
 * message: 'Regel „Name“' }`. Nachgesehen an ihren beiden Aufrufern —
 * `repo-tags.ts` (`TagFolderPort.remove`, Fehler `tag_in_use`) und
 * `repo-statuses.ts` (`remove`, Fehler `status_in_use`) —, dort stehen auch
 * die Basissätze, die unten unverändert als `message` auftauchen. Der
 * "fremde" Detaileintrag stammt aus `apps/local-api/src/usecases/
 * tag-names.ts` (`tag_name_ambiguous`) — ein Detaileintrag, der **keine**
 * Regel bezeichnet und deshalb nicht mitgezählt werden darf.
 *
 * Keine echten Call-Nummern, Kundennamen oder Zugangsdaten: Die Poolnamen
 * unten sind erfunden.
 */
import { describe, expect, it } from "vitest";
import {
  enumerateGerman,
  errorMessageWithRules,
  ruleReferences,
} from "../../src/lib/errorText.ts";
import { TaktApiError, TaktTransportError } from "../../src/api/client.ts";
import type { ApiError, ApiFieldError } from "../../src/api/types.ts";

/** Wie `poolReference` einen Regelverweis in `details` schreibt (siehe Kopf). */
function poolReferenceDetail(id: string, name: string): ApiFieldError {
  return { field: id, code: "pool_rule", message: `Regel „${name}“` };
}

const TAG_IN_USE_MESSAGE = "Dieser Ordner wird in der Regel eines Pools verwendet.";
const STATUS_IN_USE_MESSAGE =
  "Diesen Status benutzt noch die Regel eines Pools oder einer Kanban-Spalte. Nehmen Sie ihn dort zuerst heraus.";

describe("enumerateGerman — E-058 Punkt 4: „A“, „A und B“, „A, B und C“", () => {
  it("leere Liste ergibt die leere Zeichenkette", () => {
    expect(enumerateGerman([])).toBe("");
  });

  it("ein Name steht ohne Verknüpfungswort", () => {
    expect(enumerateGerman(["„Ost“"])).toBe("„Ost“");
  });

  it("zwei Namen werden mit „und“ verbunden, ohne Komma", () => {
    expect(enumerateGerman(["„Ost“", "„Nord“"])).toBe("„Ost“ und „Nord“");
  });

  it("drei Namen: Komma zwischen den ersten, „und“ vor dem letzten", () => {
    expect(enumerateGerman(["„Ost“", "„Nord“", "„Abrechnung“"])).toBe(
      "„Ost“, „Nord“ und „Abrechnung“",
    );
  });

  it("vier Namen: dieselbe Regel setzt sich fort", () => {
    expect(enumerateGerman(["„A“", "„B“", "„C“", "„D“"])).toBe("„A“, „B“, „C“ und „D“");
  });

  it("setzt selbst keine Anführungszeichen — die Einträge bringen sie mit", () => {
    expect(enumerateGerman(["Ost", "Nord"])).toBe("Ost und Nord");
  });
});

describe("ruleReferences — nur Einträge mit code 'pool_rule' aus details[]", () => {
  it("kein TaktApiError: leere Liste", () => {
    expect(ruleReferences(new Error("etwas anderes"))).toEqual([]);
    expect(ruleReferences("kein Fehlerobjekt")).toEqual([]);
    expect(ruleReferences(null)).toEqual([]);
  });

  it("TaktApiError ohne details (Feld ausgelassen): leere Liste — der Konstruktor normalisiert", () => {
    const error: ApiError = { code: "not_found", message: "Diesen Ordner gibt es nicht." };
    const cause = new TaktApiError(404, error);
    expect(cause.details).toEqual([]);
    expect(ruleReferences(cause)).toEqual([]);
  });

  it("TaktApiError mit details: [] (Dienst nennt das Feld, aber leer): leere Liste", () => {
    const error: ApiError = { code: "tag_in_use", message: TAG_IN_USE_MESSAGE, details: [] };
    const cause = new TaktApiError(409, error);
    expect(ruleReferences(cause)).toEqual([]);
  });

  it("ein Regelverweis: der Name kommt unzerlegt aus details[].message", () => {
    const error: ApiError = {
      code: "tag_in_use",
      message: TAG_IN_USE_MESSAGE,
      details: [poolReferenceDetail("pool-1", "Ost")],
    };
    const cause = new TaktApiError(409, error);
    expect(ruleReferences(cause)).toEqual(["Regel „Ost“"]);
  });

  it("mehrere Regelverweise, in der Reihenfolge, in der der Dienst sie schickt", () => {
    const error: ApiError = {
      code: "status_in_use",
      message: STATUS_IN_USE_MESSAGE,
      details: [
        poolReferenceDetail("pool-1", "Ost"),
        poolReferenceDetail("pool-2", "Nord"),
        poolReferenceDetail("pool-3", "Abrechnung"),
      ],
    };
    const cause = new TaktApiError(409, error);
    expect(ruleReferences(cause)).toEqual(["Regel „Ost“", "Regel „Nord“", "Regel „Abrechnung“"]);
  });

  it("ein fremder code in details wird NICHT als Regelverweis gezählt", () => {
    // Gestalt aus apps/local-api/src/usecases/tag-names.ts: ein Detaileintrag,
    // der eine mehrdeutige Tag-Benennung meldet, keine Regel.
    const error: ApiError = {
      code: "validation_error",
      message: "Dieser Tagname kommt in mehreren Ordnern vor. Bitte wählen Sie das gemeinte Tag ausdrücklich aus.",
      details: [
        { field: "tagNames", code: "tag_name_ambiguous", message: "Mehrdeutiger Tagname." },
      ],
    };
    const cause = new TaktApiError(422, error);
    expect(ruleReferences(cause)).toEqual([]);
  });

  it("gemischte details: nur die pool_rule-Einträge zählen, in ihrer eigenen Reihenfolge", () => {
    const error: ApiError = {
      code: "tag_in_use",
      message: TAG_IN_USE_MESSAGE,
      details: [
        { field: "tagNames", code: "tag_name_ambiguous", message: "Mehrdeutiger Tagname." },
        poolReferenceDetail("pool-1", "Ost"),
        { field: "other", code: "irgendwas", message: "Ein weiterer, unbeteiligter Fund." },
        poolReferenceDetail("pool-2", "Nord"),
      ],
    };
    const cause = new TaktApiError(409, error);
    expect(ruleReferences(cause)).toEqual(["Regel „Ost“", "Regel „Nord“"]);
  });
});

describe("errorMessageWithRules — Dienstmeldung, um die betroffenen Regeln ergänzt", () => {
  it("ohne details: Wort für Wort dieselbe Meldung wie errorMessage", () => {
    const error: ApiError = { code: "not_found", message: "Diesen Ordner gibt es nicht." };
    const cause = new TaktApiError(404, error);
    expect(errorMessageWithRules(cause)).toBe("Diesen Ordner gibt es nicht.");
  });

  it("details: [] (Feld gesetzt, aber leer): dieselbe Meldung, kein Anhang", () => {
    const error: ApiError = { code: "tag_in_use", message: TAG_IN_USE_MESSAGE, details: [] };
    const cause = new TaktApiError(409, error);
    expect(errorMessageWithRules(cause)).toBe(TAG_IN_USE_MESSAGE);
  });

  it("genau ein Regelverweis: Singular „Betroffen ist Regel „Ost“.“", () => {
    const error: ApiError = {
      code: "tag_in_use",
      message: TAG_IN_USE_MESSAGE,
      details: [poolReferenceDetail("pool-1", "Ost")],
    };
    const cause = new TaktApiError(409, error);
    expect(errorMessageWithRules(cause)).toBe(
      `${TAG_IN_USE_MESSAGE} Betroffen ist Regel „Ost“.`,
    );
  });

  it("mehrere Regelverweise: Plural „Betroffen sind …“, deutsche Aufzählung", () => {
    const error: ApiError = {
      code: "status_in_use",
      message: STATUS_IN_USE_MESSAGE,
      details: [
        poolReferenceDetail("pool-1", "Ost"),
        poolReferenceDetail("pool-2", "Nord"),
        poolReferenceDetail("pool-3", "Abrechnung"),
      ],
    };
    const cause = new TaktApiError(409, error);
    expect(errorMessageWithRules(cause)).toBe(
      `${STATUS_IN_USE_MESSAGE} Betroffen sind Regel „Ost“, Regel „Nord“ und Regel „Abrechnung“.`,
    );
  });

  it("zwei Regelverweise: Plural, „und“ ohne Komma", () => {
    const error: ApiError = {
      code: "tag_in_use",
      message: TAG_IN_USE_MESSAGE,
      details: [poolReferenceDetail("pool-1", "Ost"), poolReferenceDetail("pool-2", "Nord")],
    };
    const cause = new TaktApiError(409, error);
    expect(errorMessageWithRules(cause)).toBe(
      `${TAG_IN_USE_MESSAGE} Betroffen sind Regel „Ost“ und Regel „Nord“.`,
    );
  });

  it("fremder Fehlercode (details ohne pool_rule): Rückfall auf errorMessage, kein Anhang", () => {
    const error: ApiError = {
      code: "validation_error",
      message: "Dieser Tagname kommt in mehreren Ordnern vor. Bitte wählen Sie das gemeinte Tag ausdrücklich aus.",
      details: [
        { field: "tagNames", code: "tag_name_ambiguous", message: "Mehrdeutiger Tagname." },
      ],
    };
    const cause = new TaktApiError(422, error);
    expect(errorMessageWithRules(cause)).toBe(error.message);
  });

  it("Nicht-TaktApiError-Ursache (Transportfehler): unverändert wie errorMessage", () => {
    const cause = new TaktTransportError("Der lokale Dienst antwortet nicht. Läuft Takt noch vollständig?");
    expect(errorMessageWithRules(cause)).toBe(
      "Der lokale Dienst antwortet nicht. Läuft Takt noch vollständig?",
    );
  });

  it("Nicht-TaktApiError-Ursache (gewöhnlicher Fehler ohne details): unverändert", () => {
    expect(errorMessageWithRules(new Error("Ein technischer Fehler."))).toBe(
      "Ein technischer Fehler.",
    );
  });

  it("Nicht-TaktApiError-Ursache (kein Error-Objekt): der Vorgabetext von errorMessage", () => {
    expect(errorMessageWithRules("irgendein Wert")).toBe(
      "Unbekannter Fehler. Bitte versuchen Sie es erneut.",
    );
  });
});
