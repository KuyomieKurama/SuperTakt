import { useId, type DragEvent } from "react";
import { Icon } from "../../shared/ui/Icon";
import { IconButton } from "../../shared/ui/Primitives";
import { Select, type SelectEntry, type SelectOptionGroup } from "../../shared/ui/Select";
import { cx } from "../../lib/cx";
import {
  defaultTransformationFor,
  type ExportConditionOperator,
  type ExportFieldDefinition,
  type ExportSourcePath,
  type ExportTransformation,
  type SourceCatalog,
} from "./exportTemplateModel";
import { quotedName } from "../../lib/foreign";
import type { DraftField } from "./TemplateFields";

/**
 * Takt — eine Feldzeile der Vorlagenliste, ihre Quellenauswahl und ihre
 * Bedingung (S-14, I-15, A-8.7, E-017, E-049).
 *
 * Drei Bausteine, die nur zusammen lesbar sind: Die Bedingung benutzt
 * dieselbe geschlossene Quellenliste wie das Feld — ließe sich über eine
 * Bedingung eine Quelle prüfen, die als Feld gesperrt ist, wäre die Grenze
 * aus A-7.2 über den Umweg lesbar.
 */

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

export function TemplateFieldRow({
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

        {/*
          Die Meldefläche der Zeile steht **immer** im Baum, auch leer (B-5,
          T-162, T-186; Befund O-GQ, T-191). Bis dahin trug dieser Absatz
          **gar keine Rolle**: Er erschien, während der Vorlageneditor schon
          stand — beim Tippen eines doppelten Schlüssels und beim Rückschlag
          des Dienstes —, und keine Vorlesehilfe sagte ihn an.

          Der Behälter trägt die Rolle, der Absatz den Text: `.tfield__error`
          bleibt damit **bedingt**, und wer nach ihm greift, findet weiter nur
          die Zeilen mit einem Befund. Ein `role`-Attribut am Absatz selbst
          hätte dieselbe Ansage, aber eine leere Meldung in jeder Zeile.

          Ohne Klasse und ohne eigene Regel: Der Behälter ist leer ein Block
          ohne Höhe und ohne Rand, und der obere Rand von `.tfield__error`
          fällt durch ihn hindurch — dieselbe Bauart wie `role="status"` im
          Bestätigungsdialog.
        */}
        <div role="alert">
          {emptyName || duplicate || rowError !== undefined ? (
            <p className="tfield__error" id={errorId}>
              {emptyName
                ? "Ohne Namen gibt es keinen Schlüssel in der Datei."
                : duplicate
                  ? `${quotedName(field.name)} steht mehr als einmal in dieser Vorlage. In der Datei bleibt nur das letzte dieser Felder übrig.`
                  : rowError}
            </p>
          ) : null}
        </div>

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
