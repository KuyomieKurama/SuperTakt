import type {
  ExportConditionOperator,
  ExportSourceCatalog,
  ExportSourceGroupInfo,
  ExportSourceInfo,
  ExportSourcePath,
  ExportTransformation,
  ExportTransformationInfo,
} from "../api/types";

export type {
  ExportConditionOperator,
  ExportSourceCatalog,
  ExportSourceGroupInfo,
  ExportSourceInfo,
  ExportSourcePath,
  ExportTransformation,
  ExportTransformationInfo,
};

/**
 * Takt — die Gestalt einer Exportvorlage, wie die Oberfläche sie liest (S-14).
 *
 * ## Warum diese Datei überhaupt existiert
 *
 * `GET /export/templates` liefert `definition` als `unknown`. Das ist richtig
 * so: Das Vorlagenformat gehört dem Motor in `packages/export`, nicht der
 * Domäne und nicht der Schnittstelle. Wer es anzeigen will, muss es lesen —
 * und Lesen heißt prüfen, nicht behaupten. `parseTemplateDefinition` nimmt
 * deshalb `unknown` entgegen und gibt entweder eine geprüfte Vorlage zurück
 * oder den Grund, warum sie sich nicht anzeigen lässt.
 *
 * ## Was hier **nicht** passiert
 *
 * Gerechnet wird nichts. Nicht gerundet, nicht kodiert, nicht zusammengeführt.
 * Was der Export aus einer Vorlage macht, sagt die Vorschau (R-17).
 *
 * ## Die Auswahlliste kommt seit E-049 vom Dienst
 *
 * Bis dahin standen die zwölf Quellen, ihre deutschen Beschriftungen, die drei
 * Transformationen, die beiden Vergleiche und der Satz zur Notiz-Grenze hier
 * ein zweites Mal — die maßgebliche Fassung lag in `packages/export`, und
 * `apps/web` durfte dieses Paket nicht einbinden. Es war die fünfte und letzte
 * Doppelung dieses Projekts.
 *
 * `GET /api/v1/export/sources` beendet sie: Die Oberfläche **fragt**, statt zu
 * wissen. Diese Datei kennt seitdem keine einzige Quelle mehr beim Namen. Sie
 * nimmt die Antwort entgegen, ordnet sie für die Anzeige (`readSourceCatalog`)
 * und prüft eine Vorlagendefinition **gegen die geholte Liste**.
 *
 * ## Die Grenze aus A-7.2 wird trotzdem hier noch einmal gezogen
 *
 * Der Vermerk eines Todos steht nicht auf der Liste und kommt nie darauf
 * (A-7.2, R-06, B-3.1). Die Domäne hält das mit `NoteBoundaryIsSealed` fest,
 * der Dienst mit `NoteSourceIsNotPublished`. Bis E-049 tat die Oberfläche es
 * mit einer **Typzusicherung** über die hier aufgeschriebene Vereinigung.
 *
 * Diese Vereinigung gibt es nicht mehr — also kann die Zusicherung nicht mehr
 * am Übersetzer hängen. Sie ist deshalb dorthin gewandert, wo die Liste jetzt
 * herkommt: an die **Antwort**. `readSourceCatalog` entfernt jeden gelieferten
 * Pfad, der nach einem Vermerk aussieht, aus der Auswahl und nennt ihn in
 * `rejectedNoteSources`, damit die Ansicht ihn aussprechen kann. Sie ist damit
 * genauso billig wie vorher und deckt genau den Fall ab, für den sie gedacht
 * war: dass die Antwort je etwas enthält, was sie nicht enthalten darf.
 */

/* ==================================================================== */
/* Gestalt einer Vorlage                                                */
/* ==================================================================== */

export interface ExportFieldCondition {
  readonly source: ExportSourcePath;
  readonly op: ExportConditionOperator;
}

/** Ein Feld einer Exportvorlage, so wie es in der Datenbank liegt. */
export interface ExportFieldDefinition {
  readonly name: string;
  readonly source: ExportSourcePath;
  readonly transformation: ExportTransformation;
  readonly condition?: ExportFieldCondition;
}

/** Eine vollständige Vorlage. Die Reihenfolge der Felder ist die der Schlüssel. */
export interface ExportTemplateDefinition {
  readonly version: 1;
  readonly fields: readonly ExportFieldDefinition[];
}

/* ==================================================================== */
/* Die Auswahlliste, geordnet und versiegelt                            */
/* ==================================================================== */

/**
 * Sieht ein gelieferter Quellenpfad nach dem internen Vermerk aus?
 *
 * Trifft auf jeder Ebene, nicht nur unter `todo.` — dieselbe Breite wie die
 * frühere Typzusicherung. Geprüft wird der **Anfang eines Segments**, damit
 * die abrechenbare Leistung `group.bookingNotes` nicht mitgefangen wird: Ihr
 * Segment heißt `bookingNotes` und beginnt nicht mit „note".
 *
 * Auf einer Auswahlliste, die der Benutzer im Editor sieht, ist „Notiz" ohne
 * Zusatz mehrdeutig, und genau diese Mehrdeutigkeit ist der Bedienfehler aus
 * R-08, der die Trennung aus A-7.2 zu Fall bringt.
 */
const looksLikeNoteSource = (path: string): boolean =>
  /(^|\.)(note|notiz|vermerk)/i.test(path);

/**
 * Die Zusicherung selbst, in einem Satz: **Auf dieser Liste steht kein
 * Vermerk.**
 *
 * Bis E-049 hieß sie `NoteSourceIsAbsent` und war eine Typzusicherung über die
 * hier aufgeschriebene Vereinigung der zwölf Quellen. Die Vereinigung gibt es
 * nicht mehr — sie war die Doppelung —, also hängt die Zusicherung jetzt an
 * der **Antwort** statt am Übersetzer. Sie ist damit genauso billig wie vorher
 * und deckt genau den Fall ab, für den sie gedacht war: dass die gelieferte
 * Liste je etwas enthält, was sie nicht enthalten darf.
 *
 * Sie entscheidet nichts über das Speichern — das tut der Motor, wörtlich und
 * ohne Normalisierung. Sie entscheidet nur, was die Oberfläche **anbietet**.
 */
export function noteSourceIsAbsent(catalog: SourceCatalog): boolean {
  return catalog.rejectedNoteSources.length === 0;
}

/**
 * Die Auswahlliste, wie die Oberfläche sie benutzt: geordnet, nachschlagbar
 * und um alles bereinigt, was nicht darauf stehen darf.
 */
export interface SourceCatalog {
  readonly groups: readonly ExportSourceGroupInfo[];
  /** Alle wählbaren Quellen in Anzeigereihenfolge, nach `groups` sortiert. */
  readonly sources: readonly ExportSourceInfo[];
  readonly transformations: readonly ExportTransformationInfo[];
  readonly conditionOperators: readonly { readonly value: ExportConditionOperator; readonly label: string }[];
  /** Der feste Satz unter der Quellenauswahl (A-7.2). Kommt vom Dienst. */
  readonly noteBoundaryHint: string;
  /** Die Quellen einer Ebene, in Anzeigereihenfolge. */
  readonly sourcesOfGroup: (groupId: string) => readonly ExportSourceInfo[];
  /** Beschriftung und Beschreibung einer Quelle. `undefined`, wenn unbekannt. */
  readonly sourceInfo: (path: ExportSourcePath) => ExportSourceInfo | undefined;
  /**
   * Beschriftung einer Quelle, notfalls der Pfad selbst.
   *
   * Der Rückfall ist kein Schönheitsfehler: Eine gespeicherte Vorlage kann
   * eine Quelle nennen, die der Dienst inzwischen nicht mehr führt. Sie dann
   * gar nicht zu benennen hieße, dem Benutzer ein leeres Feld zu zeigen, wo
   * ein Problem steht.
   */
  readonly sourceLabel: (path: ExportSourcePath) => string;
  readonly transformationInfo: (
    value: ExportTransformation,
  ) => ExportTransformationInfo | undefined;
  readonly transformationLabel: (value: ExportTransformation) => string;
  readonly conditionOperatorLabel: (value: ExportConditionOperator) => string;
  readonly hasSource: (value: unknown) => value is ExportSourcePath;
  readonly hasTransformation: (value: unknown) => value is ExportTransformation;
  readonly hasConditionOperator: (value: unknown) => value is ExportConditionOperator;
  /**
   * Vom Dienst gelieferte Pfade, die die Grenze aus A-7.2 verletzen und
   * deshalb **nicht** angeboten werden.
   *
   * Im Normalfall leer — der Dienst läuft über `EXPORT_SOURCE_PATHS` des
   * Motors und hält dieselbe Zusicherung am eigenen Übersetzer fest. Steht
   * hier je etwas, ist das keine Kleinigkeit, sondern ein Befund, und die
   * Ansicht spricht ihn aus.
   */
  readonly rejectedNoteSources: readonly string[];
  /** Voreinstellung für ein neu hinzugefügtes Feld. */
  readonly firstSource: ExportSourcePath | null;
  readonly firstTransformation: ExportTransformation | null;
  readonly firstConditionOperator: ExportConditionOperator | null;
}

/**
 * Nimmt die Antwort von `GET /export/sources` entgegen und macht daraus die
 * Liste, mit der der Editor arbeitet.
 *
 * Hier wird **nichts erfunden**: keine Quelle, keine Beschriftung, keine
 * Reihenfolge. Die Reihenfolge ist die der Antwort, die Beschriftungen sind
 * die der Antwort. Was hier entsteht, sind Nachschlagetabellen und die
 * Versiegelung der Notiz-Grenze.
 */
export function readSourceCatalog(response: ExportSourceCatalog): SourceCatalog {
  const rejectedNoteSources = response.sources
    .map((source) => source.path)
    .filter((path) => looksLikeNoteSource(path));
  const rejected = new Set<string>(rejectedNoteSources);

  const sources = response.sources.filter((source) => !rejected.has(source.path));

  const sourceByPath = new Map<string, ExportSourceInfo>();
  for (const source of sources) sourceByPath.set(source.path, source);

  const transformationByValue = new Map<string, ExportTransformationInfo>();
  for (const entry of response.transformations) transformationByValue.set(entry.value, entry);

  const operatorByValue = new Map<string, string>();
  for (const entry of response.conditionOperators) operatorByValue.set(entry.value, entry.label);

  const byGroup = new Map<string, ExportSourceInfo[]>();
  for (const source of sources) {
    const bucket = byGroup.get(source.group);
    if (bucket === undefined) byGroup.set(source.group, [source]);
    else bucket.push(source);
  }

  return {
    groups: response.groups,
    sources,
    transformations: response.transformations,
    conditionOperators: response.conditionOperators,
    noteBoundaryHint: response.noteBoundaryHint,
    sourcesOfGroup: (groupId) => byGroup.get(groupId) ?? [],
    sourceInfo: (path) => sourceByPath.get(path),
    sourceLabel: (path) => sourceByPath.get(path)?.label ?? path,
    transformationInfo: (value) => transformationByValue.get(value),
    transformationLabel: (value) => transformationByValue.get(value)?.label ?? value,
    conditionOperatorLabel: (value) => operatorByValue.get(value) ?? value,
    hasSource: (value): value is ExportSourcePath =>
      typeof value === "string" && sourceByPath.has(value),
    hasTransformation: (value): value is ExportTransformation =>
      typeof value === "string" && transformationByValue.has(value),
    hasConditionOperator: (value): value is ExportConditionOperator =>
      typeof value === "string" && operatorByValue.has(value),
    rejectedNoteSources,
    firstSource: sources[0]?.path ?? null,
    firstTransformation: response.transformations[0]?.value ?? null,
    firstConditionOperator: response.conditionOperators[0]?.value ?? null,
  };
}

/* ==================================================================== */
/* Lesen                                                                */
/* ==================================================================== */

export type TemplateParseResult =
  | { readonly ok: true; readonly value: ExportTemplateDefinition }
  | { readonly ok: false; readonly message: string };

const fail = (message: string): TemplateParseResult => ({ ok: false, message });

/**
 * Liest eine Vorlage aus dem, was der Dienst als `definition` geliefert hat.
 *
 * Streng und ohne Reparaturversuch. Eine Vorlage, die sich hier nicht lesen
 * lässt, würde der Motor beim nächsten Lauf ebenfalls abweisen — sie
 * halbwegs anzuzeigen hieße, dem Benutzer eine Vorlage zu zeigen, die es so
 * nicht gibt, und ihn beim Speichern in eine unerklärliche Fehlermeldung
 * laufen zu lassen.
 *
 * Geprüft wird **gegen die geholte Auswahlliste** (E-049), wörtlich und ohne
 * Normalisierung — aus demselben Grund wie in `packages/export/src/sources.ts`:
 * Wer Leerzeichen verzeiht, verzeiht als Nächstes die Schreibweise, und dann
 * trifft ein Notizpfad irgendwann doch.
 */
export function parseTemplateDefinition(
  input: unknown,
  catalog: SourceCatalog,
): TemplateParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return fail("Die Vorlage ist kein Objekt.");
  }

  const envelope = input as Record<string, unknown>;
  if (envelope["version"] !== 1) {
    return fail("Unbekannte Vorlagenfassung. Diese Anwendung liest Fassung 1.");
  }

  const rawFields = envelope["fields"];
  if (!Array.isArray(rawFields)) {
    return fail("Die Vorlage führt keine Feldliste.");
  }

  const fields: ExportFieldDefinition[] = [];
  for (const [index, rawField] of rawFields.entries()) {
    const position = index + 1;
    if (typeof rawField !== "object" || rawField === null || Array.isArray(rawField)) {
      return fail(`Feld ${String(position)} ist kein Objekt.`);
    }
    const candidate = rawField as Record<string, unknown>;

    const name = candidate["name"];
    if (typeof name !== "string" || name.trim().length === 0) {
      return fail(`Feld ${String(position)} hat keinen Namen.`);
    }

    const source = candidate["source"];
    if (!catalog.hasSource(source)) {
      return fail(
        `Feld ${String(position)} („${name}“) nennt eine Quelle, die diese Anwendung nicht kennt.`,
      );
    }

    const transformation = candidate["transformation"];
    if (!catalog.hasTransformation(transformation)) {
      return fail(`Feld ${String(position)} („${name}“) nennt eine unbekannte Transformation.`);
    }

    const rawCondition = candidate["condition"];
    if (rawCondition === undefined || rawCondition === null) {
      fields.push({ name, source, transformation });
      continue;
    }
    if (typeof rawCondition !== "object" || Array.isArray(rawCondition)) {
      return fail(`Die Bedingung von Feld ${String(position)} („${name}“) ist kein Objekt.`);
    }
    const parts = rawCondition as Record<string, unknown>;
    const conditionSource = parts["source"];
    const operator = parts["op"];
    if (!catalog.hasSource(conditionSource)) {
      return fail(
        `Die Bedingung von Feld ${String(position)} („${name}“) nennt eine unbekannte Quelle.`,
      );
    }
    if (!catalog.hasConditionOperator(operator)) {
      return fail(
        `Die Bedingung von Feld ${String(position)} („${name}“) nennt einen unbekannten Vergleich.`,
      );
    }
    fields.push({
      name,
      source,
      transformation,
      condition: { source: conditionSource, op: operator },
    });
  }

  return { ok: true, value: { version: 1, fields } };
}

/**
 * Baut den Rumpf für `POST`/`PATCH` — und seit E-051 auch den Entwurf, den
 * `POST /export/preview` rendert.
 *
 * `condition` fehlt vollständig, wenn keine gesetzt ist — sie mit `null` zu
 * schreiben wäre etwas anderes als sie nicht zu haben, und der Motor
 * unterscheidet beides.
 */
export function toDefinitionBody(fields: readonly ExportFieldDefinition[]): unknown {
  return {
    version: 1,
    fields: fields.map((field) =>
      field.condition === undefined
        ? { name: field.name, source: field.source, transformation: field.transformation }
        : {
            name: field.name,
            source: field.source,
            transformation: field.transformation,
            condition: { source: field.condition.source, op: field.condition.op },
          },
    ),
  };
}

/* ==================================================================== */
/* Abgleich mit der Standardvorlage                                     */
/* ==================================================================== */

export type DeviationTone = "warning" | "info";

export interface TemplateDeviation {
  readonly id: string;
  readonly tone: DeviationTone;
  readonly text: string;
}

/**
 * Worin weicht eine Vorlage von der mitgelieferten Standardvorlage ab?
 *
 * **Der Vergleichsmaßstab kommt aus dem Dienst**, nicht aus dieser Datei: Es
 * ist die Vorlage mit `isBuiltin`, so wie sie geliefert wurde. Damit gibt es
 * keine zweite Wahrheit darüber, welche Struktur das Abrechnungstool erwartet
 * — es gibt nur eine, und sie liegt in der Datenbank. Die Beschriftungen für
 * den Text kommen aus derselben Auswahlliste, die der Editor anbietet.
 *
 * Das Ergebnis ist eine Beschreibung, kein Urteil. Eine abweichende Vorlage
 * ist erlaubt (E-005); sie soll nur nicht versehentlich entstehen.
 */
export function describeDeviations(
  draft: readonly ExportFieldDefinition[],
  builtin: readonly ExportFieldDefinition[],
  catalog: SourceCatalog,
): readonly TemplateDeviation[] {
  const out: TemplateDeviation[] = [];
  const byName = new Map<string, ExportFieldDefinition>();
  for (const field of draft) byName.set(field.name, field);

  for (const expected of builtin) {
    const actual = byName.get(expected.name);
    if (actual === undefined) {
      out.push({
        id: `missing-${expected.name}`,
        tone: "warning",
        text: `Das Feld „${expected.name}“ der Standardvorlage fehlt. Das Abrechnungstool erwartet es.`,
      });
      continue;
    }
    if (actual.source !== expected.source) {
      out.push({
        id: `source-${expected.name}`,
        tone: "warning",
        text: `„${expected.name}“ liest ${catalog.sourceLabel(actual.source)} statt ${catalog.sourceLabel(expected.source)}.`,
      });
    }
    if (actual.transformation !== expected.transformation) {
      out.push({
        id: `transformation-${expected.name}`,
        tone: "warning",
        text: `„${expected.name}“ wird als ${catalog.transformationLabel(actual.transformation)} ausgegeben, die Standardvorlage benutzt ${catalog.transformationLabel(expected.transformation)}.`,
      });
    }
    if (actual.condition !== undefined) {
      out.push({
        id: `condition-${expected.name}`,
        tone: "warning",
        // Die Bedingung wird **benannt**, nicht nur erwaehnt: „steht unter
        // einer Bedingung" laesst offen, unter welcher — und genau das ist
        // die Angabe, die man braucht, um zu beurteilen, ob eine Zeile im
        // Abrechnungstool ankommt.
        text: `„${expected.name}“ steht nur in der Datei, wenn ${catalog.sourceLabel(actual.condition.source)} ${catalog.conditionOperatorLabel(actual.condition.op)}. Die Standardvorlage gibt das Feld immer aus.`,
      });
    }
  }

  const expectedNames = new Set(builtin.map((field) => field.name));
  for (const field of draft) {
    if (expectedNames.has(field.name)) continue;
    out.push({
      id: `extra-${field.name}`,
      tone: "info",
      text: `Zusätzliches Feld „${field.name}“, das die Standardvorlage nicht kennt.`,
    });
  }

  const sharedDraft = draft.filter((field) => expectedNames.has(field.name)).map((f) => f.name);
  const sharedBuiltin = builtin
    .filter((field) => byName.has(field.name))
    .map((field) => field.name);
  if (
    sharedDraft.length === sharedBuiltin.length &&
    sharedDraft.length > 1 &&
    sharedDraft.join(" ") !== sharedBuiltin.join(" ")
  ) {
    out.push({
      id: "order",
      tone: "info",
      text: `Die Felder stehen in einer anderen Reihenfolge als in der Standardvorlage (${sharedBuiltin.join(", ")}).`,
    });
  }

  return out;
}

/**
 * Welche Transformation ist für eine Quelle voreingestellt?
 *
 * Die Antwort kommt aus der **Standardvorlage**, nicht aus einer Regel in
 * dieser Datei: Führt sie ein Feld mit derselben Quelle, wird dessen
 * Transformation übernommen — deshalb steht bei „Leistung der Tagesgruppe“
 * Base64 und bei „Gerundete Zeit“ die Zahlumrechnung. Kennt die
 * Standardvorlage die Quelle nicht, bleibt es bei der ersten Transformation
 * der Auswahlliste; welche das ist, sagt der Dienst und nicht diese Datei.
 *
 * Es ist eine **Voreinstellung**, keine Bindung: Jede Quelle lässt sich mit
 * jeder Transformation verbinden, und was dabei herauskommt, zeigt die
 * Vorschau.
 */
export function defaultTransformationFor(
  source: ExportSourcePath,
  builtin: readonly ExportFieldDefinition[],
  catalog: SourceCatalog,
): ExportTransformation {
  const fromBuiltin = builtin.find((field) => field.source === source)?.transformation;
  return fromBuiltin ?? catalog.firstTransformation ?? "";
}

/**
 * Feldnamen, die mehr als einmal vorkommen.
 *
 * Zwei Felder mit demselben Namen sind **ein** Schlüssel im erzeugten JSON;
 * das hintere überschreibt das vordere. Der Dienst weist das nicht ab — das
 * ist keine Fachregel, sondern die Rechenart von JSON —, also sagt es die
 * Oberfläche, bevor ein Feld stillschweigend aus der Rechnung verschwindet.
 */
export function duplicateFieldNames(fields: readonly ExportFieldDefinition[]): ReadonlySet<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const field of fields) {
    const key = field.name.trim();
    if (key.length === 0) continue;
    if (seen.has(key)) duplicates.add(key);
    else seen.add(key);
  }
  return duplicates;
}
