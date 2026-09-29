import { InlineMessage, Spinner } from "../../shared/ui/Primitives";
import type { ExportRow } from "../../api/types";
import { ExportRowPanes } from "./ExportRowPanes";
import type { ExportFieldDefinition, SourceCatalog } from "./exportTemplateModel";
import { exportTexts } from "./texts";

/**
 * Takt — die Zeile, wie sie in die Datei geht (A-8.4, A-8.9, Befund C-02).
 *
 * Der Kopf einer aufgeklappten Tagesgruppe in S-07. Er entscheidet über sechs
 * Fälle, nicht über einen, und der Grund dafür steht an `GroupRowDetail`.
 */

/**
 * Was das Lesen der aktiven Vorlage ergeben hat (Befund C-02).
 *
 * Vier Ausgänge statt `fields | null`, weil die Ansicht sie verschieden
 * beantwortet: „wird noch geladen" schweigt, „keine Vorlage gewählt" schickt
 * in die Einstellungen, „lässt sich nicht lesen" nennt den Grund. Ein
 * gemeinsames `null` hätte alle drei zu „keine Vorschau" verschmolzen.
 */
export type TemplateFieldsResult =
  | { readonly kind: "pending" }
  | { readonly kind: "unknown" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "ready"; readonly fields: readonly ExportFieldDefinition[] };

interface GroupRowDetailProps {
  /** Die Zeile aus der Vorschau. `null`, solange keine für diese Gruppe da ist. */
  readonly row: ExportRow | null;
  readonly deselected: boolean;
  readonly blocked: boolean;
  readonly template: TemplateFieldsResult;
  readonly catalog: SourceCatalog | null;
}

/**
 * Was in der aufgeklappten Gruppe über den Buchungen steht.
 *
 * Sechs Fälle, und jeder sagt etwas anderes. Sie alle auf „keine Vorschau"
 * zusammenzuziehen wäre der bequeme Weg — und genau der Grund, aus dem ein
 * Benutzer vor dem Schreiben nicht weiß, ob er gerade nichts sieht, weil
 * nichts da ist, oder weil etwas nicht stimmt.
 */
export function GroupRowDetail({ row, deselected, blocked, template, catalog }: GroupRowDetailProps) {
  const text = exportTexts();
  if (blocked) {
    // Der Grund steht bereits am Gruppenkopf (E-034). Ihn hier zu wiederholen
    // hieße, dieselbe Meldung zweimal zu lesen.
    return null;
  }

  if (deselected) {
    return (
      <p className="egroup__rowhint">
        {text.rowDeselected}
      </p>
    );
  }

  if (template.kind === "unknown") {
    return (
      <p className="egroup__rowhint">
        {text.noTemplate}
      </p>
    );
  }

  if (template.kind === "failed") {
    return (
      <InlineMessage tone="danger" title={text.templateUnreadable}>
        {template.message} {text.templateUnreadableTail}
      </InlineMessage>
    );
  }

  if (template.kind === "pending" || catalog === null) {
    return (
      <p className="egroup__rowhint" role="status" aria-live="polite">
        <Spinner size={13} label={text.templateReading} />
        <span>{text.templateReadingDots}</span>
      </p>
    );
  }

  if (row === null) {
    return (
      <p className="egroup__rowhint" role="status" aria-live="polite">
        <Spinner size={13} label={text.rowComputing} />
        <span>{text.rowComputingLong}</span>
      </p>
    );
  }

  return (
    <ExportRowPanes
      row={row}
      fields={template.fields}
      catalog={catalog}
      clearTextHint={text.clearTextInGroup}
    />
  );
}
