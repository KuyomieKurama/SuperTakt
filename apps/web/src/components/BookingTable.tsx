import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { TIME_ENTRY_SOURCE_LABEL, type TimeEntrySource } from "../lib/labels";
import {
  EXPORT_STATE,
  exportDisplayState,
  ExportStatusBadge,
  ExportStatusMarker,
  type ExportDisplayState,
  type ExportStatus,
} from "./ExportStatus";
import { Icon } from "./Icon";
import { Menu, type MenuEntry } from "./Menu";

/**
 * Tabelle der Zeitbuchungen — S-06, S-07, A-6.6, A-8.6.
 *
 * Alle Zahlen und Zeitangaben kommen fertig formatiert herein. Die Tabelle
 * rundet nichts und rechnet nichts; das gehoert nach `packages/domain`.
 *
 * Der Exportstatus wird dreifach getragen, damit er auch beim Ueberfliegen
 * einer langen Liste sofort auffaellt (A-6.7):
 *   1. farbige Randmarkierung am linken Zeilenrand
 *   2. Zustandspunkt mit eigener Form in der ersten Spalte
 *   3. Etikett mit Symbol und Beschriftung in der Statusspalte
 *
 * Die Zeile fuehrt den **zweiwertigen** Status (E-032) und daneben
 * `exportCount`. Der vierwertige Anzeigezustand wird hier abgeleitet und
 * verlaesst diese Datei nicht. Ein Filter greift auf `exportStatus` zu und
 * bekommt damit eine zurueckgesetzte Buchung unter "Offen" und eine
 * ausgebuchte unter "Exportiert" mitgeliefert — so, wie es der Exportmotor
 * auch tut.
 */

export interface BookingRowData {
  readonly id: string;
  /** Fachlicher Exportstatus. Genau zwei Werte (A-6.9, E-032). */
  readonly exportStatus: ExportStatus;
  /**
   * Wie oft die Buchung schon in einem Exportlauf war
   * (`time_entry.export_count`). Aus `open` und einem Wert groesser null
   * ergibt sich die Anzeige "Erneut offen", aus `exported` und einer Null die
   * Anzeige "Nicht abgerechnet" (E-047, E-050) — ein eigenes Merkmal, kein
   * dritter und kein vierter Status.
   */
  readonly exportCount: number;
  /** Wie die Buchung entstanden ist (`time_entry.source`, E-041). */
  readonly source: TimeEntrySource;
  /** Call-Nummer aus dem Todo (A-2.6). `null`, wenn nicht gesetzt. */
  readonly callNumber: string | null;
  readonly todoTitle: string;
  /** Bereits formatierter Zeitraum, zum Beispiel "12.08.2026, 09:12–10:19". */
  readonly period: string;
  /** Bereits formatierte, tatsaechliche Dauer, zum Beispiel "1:07 h". */
  readonly duration: string;
  /**
   * Kein Exportwert je Zeile — und das ist Absicht.
   *
   * Seit E-020 wird nicht die einzelne Buchung gerundet, sondern die Summe
   * aller noch offenen Buchungen desselben Todos an einem Kalendertag
   * (Tagesgruppe). Zehn, zwanzig und fuenf Minuten ergeben 0,75 und nicht
   * dreimal 0,25. Ein hier angezeigter Wert waere schlicht falsch — Befund
   * B-20 aus T-005n. Der gerundete Wert steht an der Tagesgruppe: in der
   * Export-Ansicht, in der Todo-Detailansicht und im Stoppdialog.
   */
  /** Leistung der Buchung. Geht in die Abrechnung (A-7.3, A-7.4, E-016). */
  readonly note: string;
  /**
   * Bereits formatierter Zeitpunkt der letzten Statusaenderung, falls
   * vorhanden. Wird im Zustand "exportiert" als Exportzeitpunkt und im Zustand
   * "nicht abgerechnet" als Zeitpunkt der Ausbuchung gezeigt; eine
   * zurueckgesetzte Buchung zeigt stattdessen ihren Exportzaehler, weil der
   * das Etikett erklaert.
   */
  readonly exportedAt?: string;
}

export type SortColumn = "period" | "duration" | "state";
export type SortDirection = "ascending" | "descending";

export interface BookingTableProps {
  readonly rows: readonly BookingRowData[];
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggleRow: (id: string) => void;
  readonly onToggleAll: () => void;
  readonly sort: { readonly column: SortColumn; readonly direction: SortDirection };
  readonly onSort: (column: SortColumn) => void;
  readonly rowMenu: (row: BookingRowData) => readonly MenuEntry[];
  readonly onOpenContextMenu?: (row: BookingRowData, x: number, y: number) => void;
  readonly activeRowId?: string;
  readonly caption: string;
  readonly className?: string;
}

const COLUMNS: ReadonlyArray<{
  readonly key: SortColumn | "note" | "call" | "source" | "actions";
  readonly label: string;
  readonly sortable: boolean;
  readonly align?: "end";
}> = [
  { key: "state", label: "Status", sortable: true },
  { key: "call", label: "Call", sortable: false },
  { key: "period", label: "Zeitraum", sortable: true },
  { key: "source", label: "Herkunft", sortable: false },
  { key: "duration", label: "Dauer", sortable: true, align: "end" },
  { key: "note", label: "Leistung", sortable: false },
  { key: "actions", label: "Aktionen", sortable: false, align: "end" },
];

/**
 * Zusatz hinter dem Etikett. Er ist je Anzeigezustand ein anderer, weil er
 * je Zustand eine andere Frage beantwortet:
 *
 *   exportiert         — wann ging die Buchung raus?
 *   nicht abgerechnet  — wann wurde sie ausgebucht? Ein Exportdatum waere hier
 *                        eine Luege: Eine Datei hat diese Buchung nie
 *                        enthalten (E-047). Deshalb "ausgebucht am" und
 *                        niemals das Wort exportiert.
 *   erneut offen       — woran haengt diese Darstellung? An `exportCount`, dem
 *                        eigenen Merkmal aus E-032. Der Zaehler steht deshalb
 *                        da, nicht ein Datum: Er ist der Grund fuer das
 *                        Etikett.
 *   offen              — kein Zusatz. Es gibt nichts zu sagen.
 */
function badgeDetail(
  row: BookingRowData,
  state: ExportDisplayState,
): { readonly detail?: string } {
  if (state === "exported") {
    return row.exportedAt === undefined ? {} : { detail: row.exportedAt };
  }
  if (state === "not_billed") {
    return row.exportedAt === undefined ? {} : { detail: `ausgebucht am ${row.exportedAt}` };
  }
  if (state === "reopened") {
    return { detail: `${row.exportCount}× exportiert` };
  }
  return {};
}

export function BookingTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  sort,
  onSort,
  rowMenu,
  onOpenContextMenu,
  activeRowId,
  caption,
  className,
}: BookingTableProps) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const someSelected = rows.some((row) => selectedIds.has(row.id));

  return (
    <div className={cx("table-wrap", className)}>
      <table className="table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="table__select">
              <input
                type="checkbox"
                aria-label="Alle sichtbaren Buchungen auswählen"
                checked={allSelected}
                ref={(node) => {
                  if (node !== null) node.indeterminate = someSelected && !allSelected;
                }}
                onChange={onToggleAll}
              />
            </th>
            {COLUMNS.map((column) => {
              const isSorted = column.sortable && sort.column === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={cx(column.align === "end" && "table__cell--end")}
                  aria-sort={isSorted ? sort.direction : column.sortable ? "none" : undefined}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="table__sort"
                      onClick={() => onSort(column.key as SortColumn)}
                    >
                      {column.label}
                      <Icon
                        name={isSorted && sort.direction === "descending" ? "chevron-down" : "chevron-right"}
                        size={12}
                        className={cx("table__sort-icon", isSorted && "table__sort-icon--active")}
                      />
                    </button>
                  ) : column.key === "actions" ? (
                    <span className="visually-hidden">{column.label}</span>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = selectedIds.has(row.id);
            const state = exportDisplayState(row.exportStatus, row.exportCount);
            return (
              <tr
                key={row.id}
                className={cx(
                  "table__row",
                  `table__row--${EXPORT_STATE[state].slug}`,
                  selected && "table__row--selected",
                  activeRowId === row.id && "table__row--active",
                )}
                aria-selected={selected}
                onContextMenu={(event) => {
                  if (onOpenContextMenu === undefined) return;
                  event.preventDefault();
                  onOpenContextMenu(row, event.clientX, event.clientY);
                }}
                onKeyDown={(event) => {
                  const wantsMenu =
                    event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
                  if (!wantsMenu || onOpenContextMenu === undefined) return;
                  event.preventDefault();
                  const rect = event.currentTarget.getBoundingClientRect();
                  onOpenContextMenu(row, rect.left + 24, rect.bottom - 4);
                }}
              >
                <td className="table__select">
                  <input
                    type="checkbox"
                    checked={selected}
                    aria-label={`Buchung ${row.todoTitle} auswählen`}
                    onChange={() => onToggleRow(row.id)}
                  />
                </td>
                <td className="table__state">
                  <span className="table__state-inner">
                    <ExportStatusMarker state={state} labelled={false} />
                    <ExportStatusBadge state={state} size="sm" {...badgeDetail(row, state)} />
                  </span>
                </td>
                <td className="table__call">
                  {row.callNumber === null ? (
                    <span className="muted">— ohne Call —</span>
                  ) : (
                    <span className="mono">{row.callNumber}</span>
                  )}
                </td>
                <td className="table__period">
                  <span className="table__primary">{row.period}</span>
                  <span className="table__secondary truncate">{row.todoTitle}</span>
                </td>
                <td className="table__source">
                  <span className="table__secondary">
                    <span className="visually-hidden">Herkunft der Buchung: </span>
                    {TIME_ENTRY_SOURCE_LABEL[row.source]}
                  </span>
                </td>
                <td className="table__cell--end">
                  <span className="table__primary">{row.duration}</span>
                </td>
                <td className="table__note">
                  <span className="truncate" title={row.note}>
                    {row.note === "" ? (
                      <span className="muted">— keine Leistung erfasst —</span>
                    ) : (
                      row.note
                    )}
                  </span>
                </td>
                <td className="table__cell--end">
                  <Menu
                    trigger={<Icon name="more-horizontal" size={16} />}
                    triggerLabel={`Aktionen für die Buchung ${row.todoTitle}`}
                    triggerClassName="table__row-menu"
                    align="end"
                    entries={rowMenu(row)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export interface TableShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** Rahmen fuer Leer-, Lade- und Fehlerzustand an Tabellenstelle. */
export function TableShell({ children, className }: TableShellProps) {
  return <div className={cx("table-shell", className)}>{children}</div>;
}
