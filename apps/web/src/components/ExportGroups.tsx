import type { ForeignText } from "../api/types";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { TIME_ENTRY_SOURCE_LABEL, type TimeEntrySource } from "../lib/labels";
import { exportDisplayState, ExportStatusBadge } from "./ExportStatus";
import { Icon } from "./Icon";
import { Button, IconButton } from "./Primitives";
import { foreignText } from "../lib/foreign";
import { Foreign } from "./Foreign";

/**
 * Exportvorschau nach Tagesgruppen — S-07, A-8.6, E-020, E-025, E-031, E-034.
 *
 * Seit E-020 entsteht **eine Exportzeile je Todo und Kalendertag**, nicht je
 * Buchung: Alle noch offenen Buchungen desselben Todos am selben Tag werden
 * addiert, und erst die Summe wird aufgerundet. Maszgeblich ist der Tag, an
 * dem der Timer gestartet wurde (E-025).
 *
 * Deshalb waehlt der Benutzer hier **Gruppen** aus und nicht Buchungen — die
 * Auswahl hat dieselbe Gliederung wie die Datei. Wer sieben Buchungen anhakt
 * und drei Zeilen bekommt, hat die wichtigste Umformung des Vorgangs nicht
 * gesehen.
 *
 * Eine Gruppe laesst sich aufklappen. Darunter stehen die einzelnen Buchungen
 * mit ihrer **ungerundeten** Dauer und ihrem eigenen Leistungstext. Wird dort
 * eine Buchung ausgeschlossen, aendert sich die gerundete Zeit der Gruppe
 * sofort sichtbar. Das ist die Stelle, an der ein Benutzer die Rundung
 * versteht — bei 10, 20 und 5 Minuten faellt die Gruppe von 0,75 auf 0,50,
 * sobald die mittlere Buchung herausfaellt.
 *
 * Seit T-040 (Befund C-02) steht in der aufgeklappten Gruppe **auch die
 * Zeile, wie sie in der Datei stuende** — dieselbe Gegenueberstellung, die
 * S-14 schon hatte. Sie kommt als `renderRowDetail` von aussen: Dieser
 * Baustein weiss nichts von Vorlagen, und er soll auch nichts davon wissen.
 *
 * **Der Baustein rechnet nichts.** Gerundete Zeit, zusammengefuehrte Leistung
 * und der Grund einer Sperre kommen fertig von aussen; gerundet wird in
 * `packages/domain`.
 */

export interface ExportGroupEntryData {
  readonly id: string;
  /** Bereits formatierter Zeitraum, zum Beispiel "09:12–09:22 Uhr". */
  readonly period: string;
  /** Bereits formatierte, **ungerundete** Dauer, zum Beispiel "0:10 h". */
  readonly duration: string;
  /** Wie die Buchung entstanden ist (`time_entry.source`, E-041). */
  readonly source: TimeEntrySource;
  /** Leistungstext dieser Buchung (A-7.3). Darf leer sein. */
  readonly note: string;
  /**
   * Wie oft die Buchung schon in einem Exportlauf war. Groesser null heiszt:
   * zurueckgesetzt (E-012). Sie ist trotzdem offen und gehoert in die Gruppe —
   * "Erneut offen" ist kein dritter Status (E-032).
   */
  readonly exportCount: number;
}

export interface ExportGroupData {
  readonly id: string;
  readonly todoTitle: ForeignText;
  /** Call-Nummer des Todos (A-2.6). `null`, wenn nicht gesetzt. */
  readonly callNumber: ForeignText | null;
  /** Bereits formatierter Kalendertag der Startzeit (E-025). */
  readonly day: string;
  /** Buchungen der Gruppe, bereits nach Startzeit sortiert. */
  readonly entries: readonly ExportGroupEntryData[];
}

export interface ExportGroupViewModel {
  readonly group: ExportGroupData;
  /** Vom Benutzer aus der Gruppe ausgeschlossene Buchungen. */
  readonly excludedEntryIds: ReadonlySet<string>;
  /**
   * Bereits gerundete Zeit der enthaltenen Buchungen als Text, zum Beispiel
   * "0,75". Kommt aus der Fachlogik (E-008, E-020).
   */
  readonly quarters: string;
  /**
   * Zusammengefuehrte Leistung der enthaltenen Buchungen (E-026, E-028).
   *
   * **Fremder Text** (T-133): Es sind die Leistungstexte der Buchungen, mit
   * `"; "` verbunden. Bis T-133 hiess das Feld `string` — die Herkunft fiel im
   * `join` ab, und der Text stand hier roh im Absatz **und** im `title`. Das
   * ist die Zeile, an der ein Benutzer liest, was er gleich abrechnet.
   */
  readonly mergedNote: ForeignText;
  /**
   * Grund, warum diese Gruppe nicht exportiert werden kann — zum Beispiel
   * fehlende Leistung (E-034). `null`, wenn sie exportierbar ist.
   */
  readonly blockedReason: string | null;
}

export interface ExportGroupListProps {
  readonly models: readonly ExportGroupViewModel[];
  readonly selectedGroupIds: ReadonlySet<string>;
  readonly expandedGroupIds: ReadonlySet<string>;
  readonly onToggleGroup: (groupId: string) => void;
  readonly onToggleExpanded: (groupId: string) => void;
  /** Schlieszt eine einzelne Buchung aus der Gruppe aus oder nimmt sie zurueck. */
  readonly onToggleEntry: (groupId: string, entryId: string) => void;
  /** Springt zur Nachbearbeitung einer Buchung, zum Beispiel wegen E-034. */
  readonly onEditEntry?: (groupId: string, entryId: string) => void;
  /**
   * Was in der aufgeklappten Gruppe **ueber** den Buchungen steht: die
   * Exportzeile, wie sie in die Datei geht (A-8.4, A-8.9, Befund C-02).
   *
   * Als Rueckruf und nicht als Feld des Datensatzes, weil dieser Baustein
   * sonst wissen muesste, was eine Vorlage ist. `null` heisst: fuer diese
   * Gruppe gibt es nichts zu zeigen.
   */
  readonly renderRowDetail?: (groupId: string) => ReactNode;
  readonly className?: string;
}

export function ExportGroupList({
  models,
  selectedGroupIds,
  expandedGroupIds,
  onToggleGroup,
  onToggleExpanded,
  onToggleEntry,
  onEditEntry,
  renderRowDetail,
  className,
}: ExportGroupListProps) {
  return (
    <ul className={cx("egroups", className)}>
      {models.map((model) => (
        <ExportGroupRow
          key={model.group.id}
          model={model}
          selected={selectedGroupIds.has(model.group.id)}
          expanded={expandedGroupIds.has(model.group.id)}
          onToggleGroup={onToggleGroup}
          onToggleExpanded={onToggleExpanded}
          onToggleEntry={onToggleEntry}
          {...(onEditEntry === undefined ? {} : { onEditEntry })}
          {...(renderRowDetail === undefined ? {} : { renderRowDetail })}
        />
      ))}
    </ul>
  );
}

interface ExportGroupRowProps {
  readonly model: ExportGroupViewModel;
  readonly selected: boolean;
  readonly expanded: boolean;
  readonly onToggleGroup: (groupId: string) => void;
  readonly onToggleExpanded: (groupId: string) => void;
  readonly onToggleEntry: (groupId: string, entryId: string) => void;
  readonly onEditEntry?: (groupId: string, entryId: string) => void;
  readonly renderRowDetail?: (groupId: string) => ReactNode;
}

function ExportGroupRow({
  model,
  selected,
  expanded,
  onToggleGroup,
  onToggleExpanded,
  onToggleEntry,
  onEditEntry,
  renderRowDetail,
}: ExportGroupRowProps) {
  const { group, excludedEntryIds, quarters, mergedNote, blockedReason } = model;
  const bodyId = `egroup-body-${group.id}`;
  const titleId = `egroup-title-${group.id}`;
  const included = group.entries.filter((entry) => !excludedEntryIds.has(entry.id));
  const blocked = blockedReason !== null;

  return (
    <li className={cx("egroup", blocked && "egroup--blocked", selected && "egroup--selected")}>
      <div className="egroup__head">
        <input
          type="checkbox"
          className="egroup__check"
          id={`egroup-check-${group.id}`}
          checked={selected && !blocked}
          disabled={blocked}
          aria-describedby={titleId}
          onChange={() => onToggleGroup(group.id)}
        />
        <label className="visually-hidden" htmlFor={`egroup-check-${group.id}`}>
          Tagesgruppe exportieren
        </label>

        <button
          type="button"
          className="egroup__twisty"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => onToggleExpanded(group.id)}
        >
          <Icon name={expanded ? "chevron-down" : "chevron-right"} size={14} />
          <span className="visually-hidden">
            {expanded ? "Buchungen dieser Tagesgruppe einklappen" : "Buchungen dieser Tagesgruppe aufklappen"}
          </span>
        </button>

        <div className="egroup__identity">
          <p className="egroup__title" id={titleId}>
            <Foreign value={group.todoTitle} />
          </p>
          <p className="egroup__meta">
            <span>{group.day}</span>
            <span aria-hidden> · </span>
            {group.callNumber === null ? (
              <span className="muted">ohne Call</span>
            ) : (
              <span className="mono">
                <Foreign value={group.callNumber} />
              </span>
            )}
            <span aria-hidden> · </span>
            <span>
              {included.length} von {group.entries.length}{" "}
              {group.entries.length === 1 ? "Buchung" : "Buchungen"}
            </span>
          </p>
        </div>

        <p className="egroup__note truncate" title={foreignText(mergedNote)}>
          {mergedNote === "" ? (
            <span className="muted">— keine Leistung erfasst —</span>
          ) : (
            <Foreign value={mergedNote} />
          )}
        </p>

        <output className={cx("egroup__quarters", "tabular")} key={quarters}>
          <span className="visually-hidden">Gerundete Exportzeit: </span>
          {quarters}
          <span className="egroup__unit" aria-hidden>
            {" h"}
          </span>
        </output>
      </div>

      <div className="live-region" role="status">
        {blocked ? (
          <p className="egroup__blocked">
            <Icon name="alert-triangle" size={14} />
            <span>
              <strong>Nicht exportierbar.</strong> {blockedReason} Der übrige Export läuft trotzdem;
              diese Gruppe bleibt offen und erscheint beim nächsten Mal wieder.
            </span>
          </p>
        ) : null}
      </div>

      <div className="egroup__body" id={bodyId} hidden={!expanded}>
        {/*
          Zuerst die Zeile, dann die Buchungen: Erst was geschrieben wird,
          danach woraus es entsteht. Genau diese Reihenfolge hat S-14, und
          genau diese Kontrolle fehlte in S-07 (Befund C-02).
        */}
        {renderRowDetail === undefined ? null : renderRowDetail(group.id)}
        <p className="egroup__body-lead">
          Die einzelnen Buchungen mit ihrer <strong>ungerundeten</strong> Dauer. Wird hier eine
          Buchung ausgeschlossen, ändert sich die gerundete Zeit der Gruppe sofort.
        </p>
        <ul className="eentries">
          {group.entries.map((entry) => {
            const excluded = excludedEntryIds.has(entry.id);
            const state = exportDisplayState("open", entry.exportCount);
            return (
              <li key={entry.id} className={cx("eentry", excluded && "eentry--excluded")}>
                <input
                  type="checkbox"
                  className="eentry__check"
                  id={`eentry-${entry.id}`}
                  checked={!excluded}
                  onChange={() => onToggleEntry(group.id, entry.id)}
                />
                <label className="eentry__label" htmlFor={`eentry-${entry.id}`}>
                  <span className="visually-hidden">In der Tagesgruppe berücksichtigen: </span>
                  <span className="eentry__period tabular">{entry.period}</span>
                </label>
                <span className="eentry__duration tabular">
                  <span className="visually-hidden">Ungerundete Dauer: </span>
                  {entry.duration}
                </span>
                <span className="eentry__source">
                  <span className="visually-hidden">Herkunft: </span>
                  {TIME_ENTRY_SOURCE_LABEL[entry.source]}
                </span>
                {state === "reopened" ? (
                  <ExportStatusBadge state="reopened" size="sm" />
                ) : (
                  <span className="eentry__spacer" aria-hidden />
                )}
                <span className="eentry__note truncate" title={foreignText(entry.note)}>
                  {entry.note === "" ? (
                    <span className="muted">— keine Leistung erfasst —</span>
                  ) : (
                    /* Die Leistung geht in die Abrechnung — fremder Text, siehe `Foreign`. */
                    <Foreign value={entry.note} />
                  )}
                </span>
                {onEditEntry === undefined ? null : entry.note === "" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    iconStart="pencil"
                    onClick={() => onEditEntry(group.id, entry.id)}
                  >
                    Leistung nachtragen
                  </Button>
                ) : (
                  <IconButton
                    label={`Leistung der Buchung ${entry.period} bearbeiten`}
                    icon="pencil"
                    size="sm"
                    onClick={() => onEditEntry(group.id, entry.id)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}
