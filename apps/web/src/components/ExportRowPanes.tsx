import { foreignText } from "../lib/foreign";
import { cx } from "../lib/cx";
import type { ExportRow, ExportValue } from "../api/types";
import type { ExportFieldDefinition, SourceCatalog } from "../lib/exportTemplateModel";

/**
 * Takt — eine Exportzeile, zweispaltig: was in der Datei steht und was es
 * bedeutet (A-8.4, A-8.6, A-8.9, A-7.2, Befund B-14, Befund C-02).
 *
 * ## Warum dieser Block an zwei Stellen steht
 *
 * S-14 prüft eine **Vorlage**, S-07 schreibt die **Datei**. Bis T-040 gab es
 * die Gegenüberstellung nur in S-14 — also genau dort nicht, wo die Datei
 * entsteht. Ein Bruch der Notiz-Trennung (A-7.2, R-08) fällt hier zuerst auf:
 * Wer vor dem Schreiben die Feldnamen und die kodierte Leistung sieht, sieht
 * auch, wenn ein interner Vermerk in eine Spalte gerutscht ist.
 *
 * Deshalb ist der Block ein eigener Baustein und keine zweite Fassung
 * derselben Darstellung. Zwei Fassungen wären genau der Fehler, gegen den
 * R-17 die Vorschau schützt — nur eine Ebene höher.
 *
 * ## Er rechnet nichts
 *
 * `row` kommt fertig aus `POST /export/preview`, also aus demselben Renderer,
 * der auch die Datei schreibt (R-17). Hier wird nichts kodiert, nichts
 * gerundet, nichts zusammengeführt: Es wird angezeigt, was der Dienst
 * geantwortet hat. Auch die Beschriftungen von Quelle und Umformung kommen aus
 * der Auswahlliste des Dienstes (E-049) und nicht aus einer Tabelle hier.
 */

export interface ExportRowPanesProps {
  /** Die Zeile, wie sie in der Datei stünde. Unverändert aus der Antwort. */
  readonly row: ExportRow;
  /** Die Felder der Vorlage, in ihrer Reihenfolge — für Herkunft und Umformung. */
  readonly fields: readonly ExportFieldDefinition[];
  /** Die Auswahlliste des Dienstes (E-049), nur zum Beschriften. */
  readonly catalog: SourceCatalog;
  /**
   * Wo der Klartext der kodierten Leistung zu finden ist, in einem Satz.
   *
   * Base64 ist eine Kodierung, keine Verschlüsselung (A-8.9). Der Satz steht
   * am Feld, nicht in einem Hilfetext — und er sagt, wo der lesbare Text
   * daneben steht, damit die Kodierung nicht wie ein Schutz aussieht.
   */
  readonly clearTextHint?: string;
  readonly className?: string;
}

export function ExportRowPanes({
  row,
  fields,
  catalog,
  clearTextHint = "Der Klartext steht unten bei den Buchungen.",
  className,
}: ExportRowPanesProps) {
  const missing = missingFieldNames(fields, row);

  return (
    <div className={cx("erow", className)}>
      <section className="erow__pane">
        <h4 className="erow__pane-title">So steht es in der Datei</h4>
        <pre className="erow__json">{JSON.stringify(row, null, 2)}</pre>
      </section>

      <section className="erow__pane">
        <h4 className="erow__pane-title">Feld für Feld</h4>
        <dl className="erow__fields">
          {Object.entries(row).map(([key, value]) => {
            const field = fields.find((candidate) => candidate.name === key);
            return (
              <div className="erow__field" key={key}>
                <dt className="erow__key">{key}</dt>
                <dd className="erow__detail">
                  <span className="erow__value mono">{renderValue(value)}</span>
                  {field === undefined ? null : (
                    <span className="erow__origin">
                      {catalog.sourceLabel(field.source)} ·{" "}
                      {catalog.transformationLabel(field.transformation)}
                    </span>
                  )}
                  {field?.transformation === "base64" ? (
                    <span className="erow__note">
                      Base64 ist eine Kodierung, keine Verschlüsselung. {clearTextHint}
                    </span>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
        {missing.length === 0 ? null : (
          <p className="erow__missing">
            Nicht in dieser Zeile, weil die Bedingung nicht zutraf: {missing.join(", ")}. Der
            Schlüssel fehlt vollständig, er steht nicht leer da.
          </p>
        )}
      </section>
    </div>
  );
}

/* ==================================================================== */
/* Hilfen — Darstellung, keine Rechnung                                 */
/* ==================================================================== */

/** Der Wert einer Zelle, so wie er in der Datei steht. Nicht umgeformt. */
function renderValue(value: ExportValue): string {
  if (value === null) return "null";
  /*
   * Die Anzeige einer Zelle ist eine Anzeige und keine Datei: Was hier steht,
   * ist der Wert der Zeile — und er kann den Titel eines Todos tragen, wenn die
   * Vorlage ihn abbildet. `foreignText` macht die unsichtbaren Zeichen sichtbar
   * (E-063 Punkt 2); die geschriebene Datei bleibt davon unberührt.
   */
  return typeof value === "number" ? String(value) : `"${foreignText(value)}"`;
}

/** Felder der Vorlage, die es nicht in diese Zeile geschafft haben (A-8.7). */
function missingFieldNames(
  fields: readonly ExportFieldDefinition[],
  row: ExportRow,
): readonly string[] {
  return fields.filter((field) => !(field.name in row)).map((field) => field.name);
}
