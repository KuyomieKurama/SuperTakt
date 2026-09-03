import { useState } from "react";
import { Card, InlineMessage } from "../components/Primitives";
import { RadioRow } from "../components/RadioRow";
import { RuleSummary } from "../components/RuleSummary";
import {
  POOL_AXIS_NEUTRAL_HINT,
  POOL_COMPLETION_LABEL,
  POOL_EXPORT_LABEL,
  POOL_MATCH_MODE_HINT,
  POOL_MATCH_MODE_LABEL,
  type PoolCompletionFilter,
  type PoolExportFilter,
  type PoolMatchMode,
} from "../lib/labels";
import { describeRule, describeRuleReach, type RuleAxes } from "../lib/poolRule";
import { NEUTRAL_RULE, SHOWCASE_RULE_LOOKUP } from "./data";
import type { PoolResolution } from "../api/types";
import { Section, SubHeading } from "./Section";

/**
 * Die Regel einer Spalte — Formularzeilen und Zusammenfassung (T-076, T-079).
 *
 * ## Warum dieser Abschnitt eigens dasteht
 *
 * Das Regelformular ist seit T-076 die Stelle mit den meisten Zustaenden in
 * der ganzen Anwendung: fuenf Achsen, jede mit einem Neutralwert, und die
 * Bedeutung jeder Achse haengt daran, ob sie neutral steht. Diese Zustaende
 * sind einzeln harmlos und zusammen verwirrend — genau der Fall, fuer den es
 * eine Musterseite gibt.
 *
 * Sechs Regelformen stehen hier nebeneinander, und es sind dieselben, die in
 * der laufenden Anwendung nachgesehen werden:
 *
 *   1. **Nur ueber den Status** — keine einzige Tagbedingung.
 *   2. **Gemischt** — Tags, Status und Erledigt zusammen.
 *   3. **Mit ausgeschlossenem Tag** — die Bedingung, die eine Liste
 *      gleichartiger Terme nicht ausdruecken kann.
 *   4. **Mit leerem Ordner** — sie nennt zwei Bedingungen und trifft trotzdem
 *      nichts, weil im geforderten Ordner kein Tag liegt (E-057). Der Chip
 *      des Ordners traegt den Befund, der Satz darunter die Folge.
 *   5. **Mit leerem Ordner neben einem Tag** — derselbe Fehler, aber die
 *      Achsensumme sieht gesund aus (T-087). Hier ist nachzusehen, dass
 *      **nur** der Ordnerchip markiert wird und der Satz darunter genau
 *      diesen einen Ordner nennt.
 *   6. **Ohne jede Bedingung** — der Zustand direkt nach dem Anlegen. Sie
 *      trifft nichts, nicht alles.
 *
 * ## Was die Zusammenfassung weglaesst
 *
 * Eine Achse auf ihrem Neutralwert steht nicht in der Zusammenfassung. Das ist
 * kein Platzsparen: „Alle" heisst „schraenkt nicht ein", und eine Zeile
 * „Status: Alle" laese sich wie eine Bedingung, die es nicht gibt. Im Formular
 * (`showNeutral`) werden die neutralen Achsen dagegen ausdruecklich genannt —
 * dort wird gewaehlt, und dort muss der Unterschied lesbar sein.
 */

const STATUS_ONLY: RuleAxes = {
  ...NEUTRAL_RULE,
  statusIds: ["status-progress", "status-review"],
};

const MIXED: RuleAxes = {
  ...NEUTRAL_RULE,
  matchMode: "all",
  rule: [
    { kind: "tag", tagId: "tag-support" },
    { kind: "folder", folderId: "folder-nord" },
  ],
  statusIds: ["status-progress"],
  completion: "open",
};

const WITH_EXCLUDED: RuleAxes = {
  ...NEUTRAL_RULE,
  rule: [{ kind: "tag", tagId: "tag-support" }],
  excludedTags: [{ kind: "tag", tagId: "tag-archiv" }],
  exportState: "open",
};

/**
 * Eine Regel, die zwei Bedingungen nennt und trotzdem nichts trifft: Der
 * geforderte Ordner enthaelt kein Tag (E-057).
 */
const WITH_EMPTY_FOLDER: RuleAxes = {
  ...NEUTRAL_RULE,
  rule: [{ kind: "folder", folderId: "folder-ost" }],
  statusIds: ["status-progress"],
};

/**
 * Derselbe leere Ordner, aber **neben** einem Tagterm (T-087).
 *
 * Der Fall, den die Achsensumme nicht sehen konnte: `tagCount` steht auf 1,
 * weil der Tagterm einen Tag beisteuert — und die Regel trifft nach E-057
 * trotzdem nichts, weil der Benutzer eine Zugehoerigkeit verlangt hat, die
 * niemand hat. Hier ist nachzusehen, dass **nur der Ordnerchip** markiert wird
 * und der Tag daneben unberuehrt bleibt.
 */
const MIXED_WITH_EMPTY_FOLDER: RuleAxes = {
  ...NEUTRAL_RULE,
  rule: [
    { kind: "tag", tagId: "tag-support" },
    { kind: "folder", folderId: "folder-ost" },
  ],
};

/** Die uebliche Auskunft des Dienstes: Die genannten Ordner enthalten Tags. */
const RESOLVED_FULL: PoolResolution = {
  tagCount: 3,
  excludedTagCount: 0,
  isEmpty: false,
  unresolvedRequired: false,
  unresolvedExcluded: false,
  emptyRuleFolderIds: [],
  matchesNothing: false,
};

/** Eine Regel ohne Tagbedingung — es gibt nichts aufzuloesen und nichts zu melden. */
const RESOLVED_NO_TAG_AXIS: PoolResolution = {
  tagCount: 0,
  excludedTagCount: 0,
  isEmpty: false,
  unresolvedRequired: false,
  unresolvedExcluded: false,
  emptyRuleFolderIds: [],
  matchesNothing: false,
};

/**
 * Und die Auskunft, um die es hier geht: Der geforderte Ordner "Kunden / Ost"
 * enthaelt kein Tag. `emptyRuleFolderIds` nennt ihn — daraus wird der Name im
 * Satz unter der Zusammenfassung (T-087).
 */
const RESOLVED_EMPTY_FOLDER: PoolResolution = {
  tagCount: 0,
  excludedTagCount: 0,
  isEmpty: true,
  unresolvedRequired: true,
  unresolvedExcluded: false,
  emptyRuleFolderIds: ["folder-ost"],
  matchesNothing: true,
};

/**
 * Derselbe leere Ordner **neben** einem Tagterm: `tagCount` bleibt positiv,
 * `unresolvedRequired` steht trotzdem — der Fall, den die Achsensumme nicht
 * sehen konnte (E-057, T-087).
 */
const RESOLVED_MIXED: PoolResolution = {
  tagCount: 1,
  excludedTagCount: 0,
  isEmpty: false,
  unresolvedRequired: true,
  unresolvedExcluded: false,
  emptyRuleFolderIds: ["folder-ost"],
  matchesNothing: true,
};

const SHAPES: ReadonlyArray<{
  readonly title: string;
  readonly lead: string;
  readonly axes: RuleAxes;
  /**
   * Was der Dienst zur Aufloesung sagt. Auf der Musterseite von Hand gesetzt —
   * die Oberflaeche rechnet nirgends nach, wie viele Tags in einem Ordner
   * liegen.
   */
  readonly resolved: PoolResolution;
  readonly emptyText: string;
}> = [
  {
    title: "Nur über den Status",
    lead: "Keine Tagbedingung. Ein Todo trägt genau einen Status — deshalb heißt die Achse „einer von diesen“ und nie „alle davon“.",
    axes: STATUS_ONLY,
    resolved: RESOLVED_NO_TAG_AXIS,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Gemischt",
    lead: "Tags, ein Ordner, ein Status und „Erledigt“ zusammen. Zwischen den Achsen gilt „und“: jede engt weiter ein.",
    axes: MIXED,
    resolved: RESOLVED_FULL,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Mit ausgeschlossenem Tag",
    lead: "„Ohne“ ist die Bedingung, die eine Liste gleichartiger Terme nicht ausdrücken kann. Sie hat ein eigenes Feld statt eines Vorzeichens.",
    axes: WITH_EXCLUDED,
    resolved: RESOLVED_FULL,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Mit leerem Ordner",
    lead: "Zwei Bedingungen — und trotzdem trifft sie nichts: Im geforderten Ordner liegt kein Tag. Der einzige Zustand hier, der ein Einrichtungsfehler ist (E-057).",
    axes: WITH_EMPTY_FOLDER,
    resolved: RESOLVED_EMPTY_FOLDER,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Mit leerem Ordner neben einem Tag",
    lead: "Zwei Terme, einer davon leer. Die Achsensumme steht auf 1 und sieht gesund aus — die Regel trifft nach E-057 trotzdem nichts. Markiert wird nur der leere Ordner, nicht der Tag daneben.",
    axes: MIXED_WITH_EMPTY_FOLDER,
    resolved: RESOLVED_MIXED,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Ohne jede Bedingung",
    lead: "Der Zustand unmittelbar nach dem Anlegen. Alle fünf Achsen stehen neutral — die Regel trifft nichts, nicht alles.",
    axes: NEUTRAL_RULE,
    resolved: {
      tagCount: 0,
      excludedTagCount: 0,
      isEmpty: true,
      unresolvedRequired: false,
      unresolvedExcluded: false,
      emptyRuleFolderIds: [],
      matchesNothing: true,
    },
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
];

/**
 * Eine Regelform mit ihrer Aufloesung — als eigene Komponente, damit die
 * Beschreibung **einmal** entsteht und der Befund am Ordnerchip aus derselben
 * Beschreibung kommt wie die Chips selbst.
 */
function ShapeSummary({ shape }: { readonly shape: (typeof SHAPES)[number] }) {
  const description = describeRule(shape.axes, SHOWCASE_RULE_LOOKUP);
  return (
    <RuleSummary
      description={description}
      reach={describeRuleReach(description, shape.resolved)}
      emptyText={shape.emptyText}
    />
  );
}

export function RuleSection() {
  const [matchMode, setMatchMode] = useState<PoolMatchMode>("any");
  const [completion, setCompletion] = useState<PoolCompletionFilter>("any");
  const [exportState, setExportState] = useState<PoolExportFilter>("any");

  const live: RuleAxes = {
    ...NEUTRAL_RULE,
    matchMode,
    rule: [{ kind: "tag", tagId: "tag-support" }, { kind: "tag", tagId: "tag-wartet" }],
    completion,
    exportState,
  };

  return (
    <Section
      id="regel"
      title="5b — Die Regel einer Spalte"
      lead="Fünf Achsen mit je einem Neutralwert. Die Verknüpfung folgt aus dem Feldnamen: „erforderlich“ heißt und, „ausgeschlossen“ heißt nicht — es gibt keinen Und/Oder-Schalter."
      refs={["A-3.1", "A-3.4", "A-5.1", "I-13", "E-054", "E-055"]}
    >
      <SubHeading>Die Zusammenfassung — sechs Regelformen</SubHeading>
      <div className="grid grid--2">
        {SHAPES.map((shape) => (
          <Card key={shape.title} title={shape.title} description={shape.lead}>
            <ShapeSummary shape={shape} />
          </Card>
        ))}
      </div>

      <SubHeading>Dieselbe Regel im Formular — mit den neutralen Achsen</SubHeading>
      <Card
        title="Optionszeilen und Vorschau"
        description="Wählen Sie hier, was die Vorschau darunter sagt. Der Zusatz „schränkt nicht ein“ steht dauerhaft am Neutralwert und nicht erst, nachdem man ihn gewählt hat."
      >
        <RadioRow
          label="Wie viele der erforderlichen Tags müssen zutreffen?"
          value={matchMode}
          onChange={setMatchMode}
          options={[
            { value: "any", label: POOL_MATCH_MODE_LABEL.any, hint: POOL_MATCH_MODE_HINT.any },
            { value: "all", label: POOL_MATCH_MODE_LABEL.all, hint: POOL_MATCH_MODE_HINT.all },
          ]}
        />

        <RadioRow
          label="Erledigt"
          value={completion}
          onChange={setCompletion}
          neutralNote={POOL_AXIS_NEUTRAL_HINT.toLowerCase()}
          options={[
            {
              value: "any",
              label: POOL_COMPLETION_LABEL.any,
              neutral: true,
              hint: "Erledigt entscheidet nicht über die Zugehörigkeit.",
            },
            { value: "done", label: POOL_COMPLETION_LABEL.done, hint: "Nur erledigte Todos." },
            { value: "open", label: POOL_COMPLETION_LABEL.open, hint: "Nur unerledigte Todos." },
          ]}
        />

        <RadioRow
          label="Exportstatus"
          value={exportState}
          onChange={setExportState}
          neutralNote={POOL_AXIS_NEUTRAL_HINT.toLowerCase()}
          options={[
            {
              value: "any",
              label: POOL_EXPORT_LABEL.any,
              neutral: true,
              hint: "Der Exportstatus entscheidet nicht über die Zugehörigkeit.",
            },
            {
              value: "open",
              label: POOL_EXPORT_LABEL.open,
              hint: "Todos mit mindestens einer abgeschlossenen, offenen Buchung.",
            },
            {
              value: "exported",
              label: POOL_EXPORT_LABEL.exported,
              hint: "Todos mit mindestens einer exportierten Buchung — nicht „vollständig abgerechnet“.",
            },
          ]}
        />

        <RadioRow
          label="Gesperrt (zum Vergleich)"
          value={completion}
          onChange={() => undefined}
          disabled
          neutralNote={POOL_AXIS_NEUTRAL_HINT.toLowerCase()}
          options={[
            { value: "any", label: POOL_COMPLETION_LABEL.any, neutral: true },
            { value: "done", label: POOL_COMPLETION_LABEL.done },
            { value: "open", label: POOL_COMPLETION_LABEL.open },
          ]}
        />

        <div className="form-section">
          <h3 className="form-section__title">Diese Regel trifft</h3>
          <RuleSummary
            description={describeRule(live, SHOWCASE_RULE_LOOKUP)}
            showNeutral
            size="md"
            emptyText="Keine Bedingung — diese Regel trifft nichts."
          />
        </div>
      </Card>

      <InlineMessage tone="info" title="Der Exportstatus gehört der Buchung, nicht dem Todo">
        „Exportiert“ heißt hier <strong>mindestens eine</strong> exportierte Buchung und nicht
        „vollständig abgerechnet“ (E-032). Ein Todo mit einer offenen und einer exportierten
        Buchung erfüllt beide Bedingungen und steht deshalb in beiden Spalten — derselbe Fall, den
        E-054 zum Normalfall gemacht hat.
      </InlineMessage>
    </Section>
  );
}
