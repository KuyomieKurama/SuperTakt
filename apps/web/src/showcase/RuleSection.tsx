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
import { describeRule, type RuleAxes } from "../lib/poolRule";
import { NEUTRAL_RULE, SHOWCASE_RULE_LOOKUP } from "./data";
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
 * Vier Regelformen stehen hier nebeneinander, und es sind dieselben vier, die
 * in der laufenden Anwendung nachgesehen werden:
 *
 *   1. **Nur ueber den Status** — keine einzige Tagbedingung.
 *   2. **Gemischt** — Tags, Status und Erledigt zusammen.
 *   3. **Mit ausgeschlossenem Tag** — die Bedingung, die eine Liste
 *      gleichartiger Terme nicht ausdruecken kann.
 *   4. **Ohne jede Bedingung** — der Zustand direkt nach dem Anlegen. Sie
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

const SHAPES: ReadonlyArray<{
  readonly title: string;
  readonly lead: string;
  readonly axes: RuleAxes;
  readonly emptyText: string;
}> = [
  {
    title: "Nur über den Status",
    lead: "Keine Tagbedingung. Ein Todo trägt genau einen Status — deshalb heißt die Achse „einer von diesen“ und nie „alle davon“.",
    axes: STATUS_ONLY,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Gemischt",
    lead: "Tags, ein Ordner, ein Status und „Erledigt“ zusammen. Zwischen den Achsen gilt „und“: jede engt weiter ein.",
    axes: MIXED,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Mit ausgeschlossenem Tag",
    lead: "„Ohne“ ist die Bedingung, die eine Liste gleichartiger Terme nicht ausdrücken kann. Sie hat ein eigenes Feld statt eines Vorzeichens.",
    axes: WITH_EXCLUDED,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
  {
    title: "Ohne jede Bedingung",
    lead: "Der Zustand unmittelbar nach dem Anlegen. Alle fünf Achsen stehen neutral — die Regel trifft nichts, nicht alles.",
    axes: NEUTRAL_RULE,
    emptyText: "Ohne Bedingung — diese Spalte bleibt leer.",
  },
];

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
      <SubHeading>Die Zusammenfassung — vier Regelformen</SubHeading>
      <div className="grid grid--2">
        {SHAPES.map((shape) => (
          <Card key={shape.title} title={shape.title} description={shape.lead}>
            <RuleSummary
              description={describeRule(shape.axes, SHOWCASE_RULE_LOOKUP)}
              emptyText={shape.emptyText}
            />
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
