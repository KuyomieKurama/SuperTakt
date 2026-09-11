import { useState } from "react";
import type { ForeignText } from "../../api/types";
import { Icon } from "../../shared/ui/Icon";
import { Button, InlineMessage } from "../../shared/ui/Primitives";
import type { ExportFieldDefinition, SourceCatalog } from "./exportTemplateModel";
import { quotedName } from "../../lib/foreign";
import { TemplateFieldRow } from "./TemplateFieldRow";

/**
 * Takt — die geordnete Feldliste einer Exportvorlage (S-14, I-15, A-8.7).
 *
 * Eine Vorlage ist eine **Liste**, und ihre Reihenfolge ist die Reihenfolge
 * der Schlüssel im erzeugten JSON. Deshalb ist das Umsortieren keine Zugabe,
 * sondern Teil des Gegenstands — und es geht auf zwei Wegen: durch Ziehen
 * (A-13.6) und über zwei Knöpfe je Zeile (SC 2.5.7). Der zweite Weg ist nicht
 * die Notlösung für den ersten; er ist gleichwertig und wird angesagt.
 *
 * ## Die Quelle kommt aus einer geschlossenen Liste (E-017, E-049)
 *
 * Kein Freitextfeld. Ein Freitextpfad wäre ein Leseprimitiv auf alles, was man
 * ihm gibt, und machte jedes später hinzugefügte Feld automatisch
 * exportierbar (B-3.1). Der Vermerk eines Todos steht nicht auf der Liste —
 * auch nicht gesperrt —, und darunter steht der feste Satz, der das erklärt
 * (A-7.2).
 *
 * Die Liste **und** der Satz kommen seit E-049 aus `GET /export/sources`, nicht
 * aus einer zweiten Fassung in der Oberfläche. Dieser Baustein kennt keine
 * einzige Quelle beim Namen; er zeigt, was der Dienst geantwortet hat.
 *
 * ## Gerechnet wird hier nichts
 *
 * Der Baustein setzt Namen, Quelle, Transformation und Bedingung. Was dabei
 * herauskommt, sagt allein die Vorschau, und die kommt vom Dienst (R-17).
 */

/**
 * Ein Feld im Entwurf.
 *
 * `key` ist die Kennung **für die Darstellung**: React braucht sie als
 * Listenschlüssel, das Ziehen als Bezug. Sie wird nicht gespeichert und
 * verlässt diese Sitzung nicht. Der Feldname taugt dafür nicht — er ist
 * änderbar und darf vorübergehend leer oder doppelt sein.
 */
export interface DraftField {
  readonly key: string;
  readonly field: ExportFieldDefinition;
}

export interface TemplateFieldsProps {
  readonly fields: readonly DraftField[];
  /** Die Auswahlliste des Dienstes (E-049). Ohne sie gibt es nichts zu wählen. */
  readonly catalog: SourceCatalog;
  /** Die Felder der Standardvorlage — Quelle der Voreinstellungen. */
  readonly builtinFields: readonly ExportFieldDefinition[];
  /** Namen, die mehr als einmal vorkommen. */
  readonly duplicates: ReadonlySet<string>;
  /** Nummer der Feldzeile, an der der Dienst beim Speichern angehalten hat. */
  readonly errorIndex: number | null;
  readonly errorMessage: string | null;
  /** Die mitgelieferte Vorlage ist unveränderlich (A-8.7). */
  readonly readOnly: boolean;
  readonly onChange: (key: string, next: ExportFieldDefinition) => void;
  readonly onRemove: (key: string) => void;
  readonly onDuplicate: (key: string) => void;
  /** Verschiebt das Feld um `delta` Plätze. Tastaturweg zum Ziehen. */
  readonly onMove: (key: string, delta: number) => void;
  /** Legt das gezogene Feld vor dem Feld an Position `toIndex` ab. */
  readonly onDrop: (fromIndex: number, toIndex: number) => void;
  readonly onAdd: () => void;
}

export function TemplateFields({
  fields,
  catalog,
  builtinFields,
  duplicates,
  errorIndex,
  errorMessage,
  readOnly,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
  onDrop,
  onAdd,
}: TemplateFieldsProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /** Was zuletzt geschah — wird angesagt, nicht nur gezeigt (SC 4.1.3). */
  const [announcement, setAnnouncement] = useState("");

  /*
   * `name` heißt `ForeignText` und nicht `string` (O-AT, T-133): Der Feldname
   * kommt aus `definition`, also aus einem `unknown`, in das ein Benutzer
   * geschrieben hat — und er geht hier in einen **angesagten Satz**. Steht am
   * Parameter `string`, ist an der Aufrufstelle nicht mehr zu sehen, was mit
   * dem Wert geschieht.
   */
  const move = (key: string, delta: number, index: number, name: ForeignText): void => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    onMove(key, delta);
    setAnnouncement(
      `Feld ${quotedName(name)} steht jetzt an Position ${String(target + 1)} von ${String(fields.length)}.`,
    );
  };

  const finishDrag = (toIndex: number): void => {
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    onDrop(dragIndex, toIndex);
    setAnnouncement(
      `Feld an Position ${String(dragIndex + 1)} steht jetzt an Position ${String(toIndex + 1)}.`,
    );
    setDragIndex(null);
    setOverIndex(null);
  };

  if (fields.length === 0) {
    return (
      <div className="tfields">
        <div className="tfields__empty">
          <span className="tfields__empty-icon" aria-hidden>
            <Icon name="inbox" size={22} />
          </span>
          <p className="tfields__empty-title">Noch kein Feld</p>
          <p className="tfields__empty-text">
            Eine Vorlage ohne Feld erzeugt keine Datei — der Dienst nimmt sie nicht an. Fügen Sie
            das erste Feld hinzu; die Vorschau zeigt sofort, was dabei herauskommt.
          </p>
          {readOnly ? null : (
            <Button variant="primary" iconStart="plus" onClick={onAdd}>
              Erstes Feld hinzufügen
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tfields">
      <p className="tfields__lead">
        Die Reihenfolge dieser Liste ist die Reihenfolge der Schlüssel in der Datei. Verschieben
        lässt sich ein Feld durch Ziehen am Griff oder mit den beiden Pfeilknöpfen.
      </p>

      <ol className="tfield-list">
        {fields.map((entry, index) => {
          /*
           * Der Nachschlagewert steht **vor** dem JSX und nicht darin (O-AT):
           * `entry.field.name.trim()` ist fremder Text, der hier nachgeschlagen
           * und nicht gezeigt wird. Im Attribut sähe das aus wie eine Anzeige —
           * für einen Leser wie für `scripts/proof-foreign.mjs`.
           */
          const duplicate = duplicates.has(entry.field.name.trim());

          return (
          <TemplateFieldRow
            key={entry.key}
            entry={entry}
            index={index}
            total={fields.length}
            catalog={catalog}
            builtinFields={builtinFields}
            duplicate={duplicate}
            {...(errorIndex === index && errorMessage !== null ? { rowError: errorMessage } : {})}
            readOnly={readOnly}
            dragging={dragIndex === index}
            dropTarget={overIndex === index && dragIndex !== null && dragIndex !== index}
            onChange={onChange}
            onRemove={onRemove}
            onDuplicate={onDuplicate}
            onMoveBy={(delta) => move(entry.key, delta, index, entry.field.name)}
            onDragStart={() => setDragIndex(index)}
            onDragEnter={() => setOverIndex(index)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDropHere={() => finishDrag(index)}
          />
          );
        })}
      </ol>

      <p className="tfields__boundary">
        <span className="tfields__boundary-icon" aria-hidden>
          <Icon name="lock" size={14} />
        </span>
        <span>{catalog.noteBoundaryHint}</span>
      </p>

      {readOnly ? null : (
        <div className="tfields__actions">
          <Button variant="secondary" iconStart="plus" onClick={onAdd}>
            Feld hinzufügen
          </Button>
        </div>
      )}

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

/* ==================================================================== */
/* Fehler des Dienstes einer Zeile zuordnen                             */
/* ==================================================================== */

/**
 * Aus welcher Feldzeile stammt die Meldung des Dienstes?
 *
 * Der Motor prüft die Felder der Reihe nach, hält beim ersten Fehler an und
 * stellt seiner Meldung `Feld N: ` voran (`validateExportTemplateDefinition`).
 * Diese Funktion liest **nur** diese vorangestellte Nummer, damit der Fehler
 * an der betroffenen Zeile stehen kann statt als Sammelmeldung. Findet sie
 * nichts, bleibt die Meldung ungekürzt oben stehen — geraten wird nicht.
 */
export function fieldIndexOfMessage(message: string): number | null {
  const match = /^Feld (\d+):/.exec(message);
  if (match === null) return null;
  const raw = match[1];
  if (raw === undefined) return null;
  const position = Number.parseInt(raw, 10);
  return Number.isNaN(position) || position < 1 ? null : position - 1;
}

/** Meldung ohne die vorangestellte Feldnummer, für die Anzeige an der Zeile. */
export function messageWithoutFieldPrefix(message: string): string {
  return message.replace(/^Feld \d+:\s*/, "");
}

/** Sammelmeldung über der Liste, wenn sich der Fehler keiner Zeile zuordnen lässt. */
export function TemplateSaveError({ message }: { readonly message: string }) {
  return (
    <InlineMessage tone="danger" title="Die Vorlage wurde nicht gespeichert">
      {message} Die bisherige Fassung der Vorlage ist unverändert geblieben.
    </InlineMessage>
  );
}
