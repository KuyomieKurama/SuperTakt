import type { ExportGroupSummary, ExportNotExportableReason, ExportRow, TimeEntry, Todo } from "../../api/types";
import { ExportRowPanes } from "./ExportRowPanes";
import { Icon } from "../../shared/ui/Icon";
import { Button } from "../../shared/ui/Primitives";
import { cx } from "../../lib/cx";
import type { ExportFieldDefinition, SourceCatalog } from "./exportTemplateModel";
import {
  formatDayLabel,
  formatDuration,
  formatQuarters,
  formatTimeRange,
  plural,
} from "../../lib/format";
import { Foreign } from "../../shared/ui/Foreign";

/**
 * Takt — eine Tagesgruppe der Vorschau des Vorlageneditors (S-14, E-028,
 * E-031, E-034).
 */

/**
 * Eine Tagesgruppe, wie die Vorschau sie zeigt.
 *
 * `group` kommt unverändert aus der Antwort des Dienstes — Kennung, Tag,
 * ungerundete Sekunden, gerundete Viertelstunden, die enthaltenen Buchungen.
 * `entries` sind dieselben Buchungen, nachgeschlagen in der geladenen Liste,
 * damit ihre Leistungstexte darunter stehen können.
 */
export interface PreviewGroup {
  readonly key: string;
  readonly group: ExportGroupSummary;
  readonly entries: readonly TimeEntry[];
  readonly outcome: GroupOutcome;
}

export type GroupOutcome =
  | { readonly kind: "row"; readonly row: ExportRow }
  | { readonly kind: "blocked"; readonly reason: ExportNotExportableReason };

interface PreviewGroupRowProps {
  readonly group: PreviewGroup;
  readonly todo: Todo | null;
  readonly fields: readonly ExportFieldDefinition[];
  readonly catalog: SourceCatalog;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onEditEntry: (entry: TimeEntry) => void;
}

export function PreviewGroupRow({
  group,
  todo,
  fields,
  catalog,
  expanded,
  onToggle,
  onEditEntry,
}: PreviewGroupRowProps) {
  const bodyId = `tpgroup-body-${group.key}`;
  const { outcome, group: summary } = group;
  const blocked = outcome.kind === "blocked";

  return (
    <li className={cx("tpgroup", blocked && "tpgroup--blocked")}>
      <button
        type="button"
        className="tpgroup__head"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="tpgroup__twisty" aria-hidden>
          <Icon name={expanded ? "chevron-down" : "chevron-right"} size={14} />
        </span>
        <span className="tpgroup__identity">
          <Foreign className="tpgroup__title" value={todo?.title ?? "Unbekanntes Todo"} />
          <span className="tpgroup__meta">
            {formatDayLabel(summary.day)}
            <span aria-hidden> · </span>
            {plural(summary.entryCount, "Buchung", "Buchungen")}
            <span aria-hidden> · </span>
            {formatDuration(summary.seconds)} erfasst
          </span>
        </span>
        <span className="tpgroup__value tabular">
          {outcome.kind === "row" && summary.quarters !== null ? (
            <>
              <span className="visually-hidden">Gerundete Exportzeit: </span>
              {formatQuarters(summary.quarters)}
              <span className="tpgroup__unit" aria-hidden>
                {" h"}
              </span>
            </>
          ) : (
            <span className="tpgroup__value-none">—</span>
          )}
        </span>
      </button>

      <div className="live-region" role="status">
        {blocked ? (
          <div className="tpgroup__blocked">
            <span className="tpgroup__blocked-icon" aria-hidden>
              <Icon name="alert-triangle" size={14} />
            </span>
            <div className="tpgroup__blocked-body">
              <p className="tpgroup__blocked-title">Leistung fehlt</p>
            </div>
            {group.entries[0] === undefined ? null : (
              /*
                Der Zusatz nennt hier die **Tagesgruppe** und nicht eine
                Buchung (T-222 Abschnitt 15.5, O-JX). Der Knopf steht in der
                Meldung über die Gruppe und gehört zu deren Gegenstand; daß er
                den Dialog an der ersten Buchung öffnet, ist der einzige Weg,
                hier anzufangen, und harmlos, weil `blocked` gerade heißt, daß
                keine Buchung der Gruppe Text trägt. Ein Zusatz mit einer
                Uhrzeit verspräche eine Auswahl, die der Benutzer nicht
                getroffen hat. Ohne den Zusatz wäre der Name dieses Knopfes der
                **Anfang** der Namen aller Zeilenknöpfe derselben Gruppe — die
                Verwechslung, die der Zusatz beseitigen soll, eine Ebene höher.
              */
              <Button
                size="sm"
                variant="secondary"
                iconStart="pencil"
                onClick={() => {
                  const first = group.entries[0];
                  if (first !== undefined) onEditEntry(first);
                }}
              >
                Leistung nachtragen
                <span className="visually-hidden">
                  , Tagesgruppe {formatDayLabel(summary.day)}
                </span>
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <div className="tpgroup__body" id={bodyId} hidden={!expanded}>
        {/*
          Derselbe Baustein, den S-07 vor dem Lauf zeigt (T-040, Befund C-02).
          Eine zweite Fassung dieser Gegenüberstellung wäre genau der Fehler,
          gegen den R-17 die Vorschau schützt — nur eine Ebene höher.
        */}
        {outcome.kind === "row" ? (
          <ExportRowPanes row={outcome.row} fields={fields} catalog={catalog} />
        ) : null}

        <section className="tpsegments">
          <h4 className="erow__pane-title">
            Die Buchungen dieser Tagesgruppe
            <span className="tpsegments__hint">
              {" "}
              — ihre Leistungstexte führt der Dienst zu einem Text zusammen
            </span>
          </h4>
          <ul className="tpsegment-list">
            {group.entries.map((entry) => {
              /*
                Zeichengleich dieselbe Zeichenkette, die die Zeile links
                sichtbar zeigt — **keine zweite Formatierung** desselben
                Zeitpunkts (T-222 Abschnitt 15.4). Deshalb einmal gerechnet und
                zweimal benutzt und nicht zweimal gerechnet.
              */
              const period = formatTimeRange(entry.startedAt, entry.endedAt);
              const missing = entry.note.trim().length === 0;
              return (
                <li className="tpsegment" key={entry.id}>
                  <span className="tpsegment__period tabular">{period}</span>
                  <span className="tpsegment__duration tabular">
                    <span className="visually-hidden">Ungerundete Dauer: </span>
                    {formatDuration(entry.durationSeconds)}
                  </span>
                  <span className="tpsegment__note">
                    {missing ? (
                      <span className="muted">— keine Leistung erfasst —</span>
                    ) : (
                      <Foreign value={entry.note} />
                    )}
                  </span>
                  {/*
                    Dieselbe Bauform wie in `ExportGroups.tsx`: **ein** Baustein,
                    zwei Beschriftungen, der Zeilenbezug als verborgener Zusatz
                    im Knopf und nicht als `aria-label` (T-218 Abschnitt 11.2,
                    T-222 Abschnitt 15.4). Die Ausprägung folgt dem Mangel —
                    `secondary`, solange die Leistung fehlt, danach `ghost`.
                  */}
                  <Button
                    size="sm"
                    variant={missing ? "secondary" : "ghost"}
                    iconStart="pencil"
                    onClick={() => onEditEntry(entry)}
                  >
                    {missing ? "Leistung nachtragen" : "Leistung bearbeiten"}
                    <span className="visually-hidden">, Buchung {period}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </li>
  );
}
