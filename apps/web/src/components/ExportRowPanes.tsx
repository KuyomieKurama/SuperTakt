import { foreignText } from "../lib/foreign";
import { Foreign } from "./Foreign";
import { cx } from "../lib/cx";
import type { ExportRow, ExportValue, ForeignText } from "../api/types";
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
        {/*
          Auch der Abzug der Zeile ist eine **Anzeige** und keine Datei (O-AT,
          T-133). Er trägt zweierlei fremden Text: die Werte und die
          **Schlüssel** — und ein Schlüssel ist der Feldname, den ein Benutzer
          in die Vorlage geschrieben hat. `JSON.stringify` maskiert nur
          Steuerzeichen unter `U+0020`; ein `U+202E` in einem Feldnamen bliebe
          roh stehen und drehte den ganzen Abzug um, in dem er steht.

          Die geschriebene Datei bleibt davon unberührt — sie entsteht im Motor
          und nicht hier. Was auf dem Bildschirm steht, folgt derselben Regel
          wie jede andere Fläche: markieren statt streichen (E-063 Punkt 2).
        */}
        <pre className="erow__json">
          <Foreign value={JSON.stringify(row, null, 2)} />
        </pre>
      </section>

      <section className="erow__pane">
        <h4 className="erow__pane-title">Feld für Feld</h4>
        <dl className="erow__fields">
          {cellsOf(row).map(([key, value]) => {
            const field = fields.find((candidate) => candidate.name === key);
            return (
              <div className="erow__field" key={key}>
                {/* Der Schlüssel ist der Feldname aus der Vorlage — fremder
                    Text aus einem `unknown` (O-AT). */}
                <dt className="erow__key">
                  <Foreign value={key} />
                </dt>
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
            Nicht in dieser Zeile, weil die Bedingung nicht zutraf:{" "}
            {missing.map(foreignText).join(", ")}. Der
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

/**
 * Die Zellen einer Zeile — **mit der Herkunft des Schlüssels im Typ** (O-AT,
 * T-133).
 *
 * `ExportRow` ist ein `Record<string, ExportValue>`: Der Wert trägt seine
 * Marke, der **Schlüssel** kann sie nicht tragen, weil ein Indexschlüssel in
 * TypeScript keine eigene Art hat. Damit fiel der Feldname beim Auslesen aus
 * jeder Herkunft heraus — gemessen in Gegenprobe L, die ohne diese Zeile grün
 * blieb, obwohl der Schlüssel roh im `<dt>` stand.
 *
 * Diese Funktion ist die Stelle, an der ausgesprochen wird, was der Schlüssel
 * **ist**: der Feldname aus der Vorlage, also fremder Text aus derselben
 * Quelle wie `ExportFieldDefinition.name`. Ab hier führen die Abschnitte 2
 * bis 4 von `scripts/proof-foreign.mjs` ihn wieder mit.
 */
function cellsOf(row: ExportRow): readonly (readonly [ForeignText, ExportValue])[] {
  return Object.entries(row);
}

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
): readonly ForeignText[] {
  return fields.filter((field) => !(field.name in row)).map((field) => field.name);
}
