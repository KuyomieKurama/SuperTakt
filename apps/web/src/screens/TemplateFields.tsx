import { useId, useState, type DragEvent } from "react";
import type { ForeignText } from "../api/types";
import { Icon } from "../components/Icon";
import { Button, IconButton, InlineMessage } from "../components/Primitives";
import { Select, type SelectEntry, type SelectOptionGroup } from "../components/Select";
import { cx } from "../lib/cx";
import {
  defaultTransformationFor,
  type ExportConditionOperator,
  type ExportFieldDefinition,
  type ExportSourcePath,
  type ExportTransformation,
  type SourceCatalog,
} from "../lib/exportTemplateModel";
import { quotedName } from "../lib/foreign";

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
/* Eine Feldzeile                                                       */
/* ==================================================================== */

interface TemplateFieldRowProps {
  readonly entry: DraftField;
  readonly index: number;
  readonly total: number;
  readonly catalog: SourceCatalog;
  readonly builtinFields: readonly ExportFieldDefinition[];
  readonly duplicate: boolean;
  readonly rowError?: string;
  readonly readOnly: boolean;
  readonly dragging: boolean;
  readonly dropTarget: boolean;
  readonly onChange: (key: string, next: ExportFieldDefinition) => void;
  readonly onRemove: (key: string) => void;
  readonly onDuplicate: (key: string) => void;
  readonly onMoveBy: (delta: number) => void;
  readonly onDragStart: () => void;
  readonly onDragEnter: () => void;
  readonly onDragEnd: () => void;
  readonly onDropHere: () => void;
}

function TemplateFieldRow({
  entry,
  index,
  total,
  catalog,
  builtinFields,
  duplicate,
  rowError,
  readOnly,
  dragging,
  dropTarget,
  onChange,
  onRemove,
  onDuplicate,
  onMoveBy,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDropHere,
}: TemplateFieldRowProps) {
  const id = useId();
  const { field } = entry;
  const nameId = `${id}-name`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const emptyName = field.name.trim().length === 0;

  const describedBy = [
    hintId,
    emptyName || duplicate || rowError !== undefined ? errorId : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" ");

  const setCondition = (next: boolean): void => {
    if (!next) {
      onChange(entry.key, {
        name: field.name,
        source: field.source,
        transformation: field.transformation,
      });
      return;
    }
    /*
     * Der voreingestellte Vergleich ist der **erste der gelieferten Liste**
     * und kein hier getippter Wert. Ein „is_set" an dieser Stelle wäre die
     * kleinste denkbare Wiederholung der Auswahlliste — und genau die Sorte,
     * die E-049 beseitigt hat.
     */
    const operator = catalog.firstConditionOperator;
    if (operator === null) return;
    onChange(entry.key, {
      ...field,
      condition: { source: field.source, op: operator },
    });
  };

  const allowDrop = (event: DragEvent<HTMLLIElement>): void => {
    if (readOnly) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  return (
    <li
      className={cx(
        "tfield",
        dragging && "tfield--dragging",
        dropTarget && "tfield--drop",
        rowError !== undefined && "tfield--invalid",
      )}
      onDragEnter={onDragEnter}
      onDragOver={allowDrop}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        event.preventDefault();
        onDropHere();
      }}
    >
      <div className="tfield__rail">
        {/*
          Gezogen wird am **Griff** und nicht an der ganzen Zeile. Ein
          `draggable` weiter oben nimmt den Eingabefeldern darin in mehreren
          Browsern die Textauswahl — man kann dann im Namensfeld nicht mehr
          markieren, ohne die Zeile zu verschieben.
        */}
        <span
          className={cx("tfield__handle", readOnly && "tfield__handle--static")}
          aria-hidden
          draggable={!readOnly}
          onDragStart={(event) => {
            // Ohne Nutzlast bricht Firefox das Ziehen sofort wieder ab.
            event.dataTransfer.setData("text/plain", entry.key);
            event.dataTransfer.effectAllowed = "move";
            onDragStart();
          }}
          onDragEnd={onDragEnd}
        >
          <Icon name={readOnly ? "lock" : "drag"} size={14} />
        </span>
        <span className="tfield__position tabular">
          <span className="visually-hidden">Position </span>
          {index + 1}
        </span>
      </div>

      <div className="tfield__body">
        <div className="tfield__row">
          <div className="field tfield__name">
            <label className="field__label" htmlFor={nameId}>
              Schlüssel
            </label>
            <input
              id={nameId}
              type="text"
              className={cx(
                "field__input",
                (emptyName || duplicate || rowError !== undefined) && "field__input--invalid",
              )}
              value={field.name}
              disabled={readOnly}
              maxLength={80}
              autoComplete="off"
              aria-invalid={emptyName || duplicate || rowError !== undefined ? true : undefined}
              aria-describedby={describedBy}
              onChange={(event) => onChange(entry.key, { ...field, name: event.target.value })}
            />
          </div>

          <Select<ExportSourcePath>
            className="tfield__source"
            label="Quelle"
            value={field.source}
            disabled={readOnly}
            options={sourceOptions(catalog)}
            onChange={(next) => {
              onChange(entry.key, {
                ...field,
                source: next,
                transformation: defaultTransformationFor(next, builtinFields, catalog),
              });
            }}
          />

          <Select<ExportTransformation>
            className="tfield__transformation"
            label="Transformation"
            value={field.transformation}
            disabled={readOnly}
            options={catalog.transformations.map((entryInfo) => ({
              value: entryInfo.value,
              label: entryInfo.label,
            }))}
            onChange={(next) =>
              onChange(entry.key, {
                ...field,
                transformation: next,
              })
            }
          />

        </div>

        <p className="tfield__hint" id={hintId}>
          {catalog.sourceInfo(field.source)?.description ??
            "Diese Quelle steht nicht mehr auf der Auswahlliste des Dienstes."}{" "}
          {catalog.transformationInfo(field.transformation)?.effect ?? ""}
        </p>

        {emptyName || duplicate || rowError !== undefined ? (
          <p className="tfield__error" id={errorId}>
            {emptyName
              ? "Ohne Namen gibt es keinen Schlüssel in der Datei."
              : duplicate
                ? `${quotedName(field.name)} steht mehr als einmal in dieser Vorlage. In der Datei bleibt nur das letzte dieser Felder übrig.`
                : rowError}
          </p>
        ) : null}

        <ConditionEditor
          idPrefix={id}
          catalog={catalog}
          condition={field.condition ?? null}
          readOnly={readOnly}
          onToggle={setCondition}
          onChange={(next) => onChange(entry.key, { ...field, condition: next })}
        />
      </div>

      {/*
        Die Werkzeuge stehen **neben** der Feldreihe und nicht darin. Sonst
        nehmen vier Symbolknöpfe den Auswahllisten die Breite, und der
        Quellenname — die wichtigste Angabe der Zeile — wird abgeschnitten.
      */}
      {readOnly ? null : (
        <div className="tfield__tools" role="group" aria-label={`Feld ${String(index + 1)}`}>
          <IconButton
            label={`Feld ${quotedName(field.name)} nach oben`}
            icon="arrow-up"
            size="sm"
            disabled={index === 0}
            onClick={() => onMoveBy(-1)}
          />
          <IconButton
            label={`Feld ${quotedName(field.name)} nach unten`}
            icon="arrow-down"
            size="sm"
            disabled={index === total - 1}
            onClick={() => onMoveBy(1)}
          />
          <IconButton
            label={`Feld ${quotedName(field.name)} verdoppeln`}
            icon="copy"
            size="sm"
            onClick={() => onDuplicate(entry.key)}
          />
          <IconButton
            label={`Feld ${quotedName(field.name)} entfernen`}
            icon="trash"
            size="sm"
            className="tfield__remove"
            onClick={() => onRemove(entry.key)}
          />
        </div>
      )}
    </li>
  );
}

/* ==================================================================== */
/* Die Quellenauswahl                                                   */
/* ==================================================================== */

/**
 * Die Auswahlliste, gegliedert nach den Ebenen des Dienstes.
 *
 * Steht an zwei Stellen — an der Quelle des Feldes und an der Quelle einer
 * Bedingung — und ist deshalb **ein** Baustein. Beide unterliegen derselben
 * geschlossenen Liste: Ließe sich über eine Bedingung eine Quelle prüfen, die
 * als Feld gesperrt ist, wäre die Grenze aus A-7.2 über den Umweg lesbar.
 *
 * Gruppen **und** Reihenfolge kommen aus der Antwort. Eine Gruppe ohne Quellen
 * wird weggelassen: Eine leere `optgroup` ist in mehreren Browsern ein toter
 * Eintrag, den die Tastaturnavigation trotzdem anfährt.
 */
/**
 * Die Quellenliste als **Daten** für das Auswahlfeld (T-059).
 *
 * Bis T-057 war das eine Komponente, die `<optgroup>` und `<option>` malte.
 * Seit die Liste in einem Portal gezeichnet wird, gibt es diese Elemente
 * nicht mehr; die Gruppierung nach Ebene bleibt und heißt jetzt
 * `kind: "group"`. Die Beschreibung einer Quelle steht als zweite Zeile im
 * Eintrag — im nativen `<option>` war dafür kein Platz.
 */
function sourceOptions(catalog: SourceCatalog): readonly SelectEntry<ExportSourcePath>[] {
  const groups: SelectOptionGroup<ExportSourcePath>[] = [];
  for (const group of catalog.groups) {
    const sources = catalog.sourcesOfGroup(group.id);
    if (sources.length === 0) continue;
    groups.push({
      kind: "group",
      label: group.label,
      options: sources.map((source) => ({
        value: source.path,
        label: source.label,
        hint: source.description,
      })),
    });
  }
  return groups;
}

/* ==================================================================== */
/* Bedingung                                                            */
/* ==================================================================== */

interface ConditionEditorProps {
  readonly idPrefix: string;
  readonly catalog: SourceCatalog;
  readonly condition: { readonly source: ExportSourcePath; readonly op: ExportConditionOperator } | null;
  readonly readOnly: boolean;
  readonly onToggle: (next: boolean) => void;
  readonly onChange: (next: { source: ExportSourcePath; op: ExportConditionOperator }) => void;
}

/**
 * Die optionale Bedingung eines Feldes (A-8.7).
 *
 * Trifft sie nicht zu, **fehlt** der Schlüssel in der Zeile — er steht nicht
 * mit `null` und nicht mit leerem Text da. Für das Abrechnungstool ist ein
 * leeres Feld etwas anderes als ein fehlendes, und dieser Unterschied gehört
 * an die Stelle, an der man ihn einstellt.
 *
 * Die Quelle der Bedingung unterliegt derselben geschlossenen Liste wie die
 * Quelle des Feldes. Sonst ließe sich über eine Bedingung ablesen, ob ein
 * gesperrtes Feld belegt ist.
 */
function ConditionEditor({
  idPrefix,
  catalog,
  condition,
  readOnly,
  onToggle,
  onChange,
}: ConditionEditorProps) {
  const toggleId = `${idPrefix}-condition`;

  return (
    <div className="tfield__condition">
      <label className="tfield__condition-toggle" htmlFor={toggleId}>
        <input
          id={toggleId}
          type="checkbox"
          checked={condition !== null}
          disabled={readOnly}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <span>Nur unter einer Bedingung ausgeben</span>
      </label>

      {condition === null ? null : (
        <div className="tfield__condition-body">
          <Select<ExportSourcePath>
            label="Geprüfte Quelle"
            value={condition.source}
            disabled={readOnly}
            options={sourceOptions(catalog)}
            onChange={(next) => onChange({ source: next, op: condition.op })}
          />

          <Select<ExportConditionOperator>
            label="Vergleich"
            value={condition.op}
            disabled={readOnly}
            options={catalog.conditionOperators.map((operator) => ({
              value: operator.value,
              label: operator.label,
            }))}
            onChange={(next) => onChange({ source: condition.source, op: next })}
          />

          <p className="tfield__condition-hint">
            Trifft die Bedingung nicht zu, fehlt der Schlüssel in dieser Zeile vollständig. Er
            steht dort nicht leer.
          </p>
        </div>
      )}
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
