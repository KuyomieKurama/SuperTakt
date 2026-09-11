import type { Id, TimeEntry } from "../../api/types";
import { exportDisplayState, type ExportDisplayState } from "../../shared/ui/ExportStatus";
import { formatDateTime, formatDuration, formatPeriod } from "../../lib/format";
import type { BookingRowData, SortColumn, SortDirection } from "./BookingTable";

/**
 * Takt — aus Buchungen des Dienstes werden Tabellenzeilen (S-06, I-10).
 *
 * Ohne React und ohne Zustand: hinein gehen die Antwort des Dienstes und die
 * gewählte Sortierung, heraus kommen die Zeilen, die `BookingTable` zeichnet.
 */

/** Reihenfolge der Anzeigezustände beim Sortieren nach Status. */
const STATE_ORDER: readonly ExportDisplayState[] = ["open", "reopened", "exported", "not_billed"];

/**
 * Buchungen in Tabellenzeilen. Formatiert wird hier, gerechnet nicht:
 * `durationSeconds` kommt aus der Domäne, ein Exportwert je Zeile existiert
 * seit E-020 nicht (Befund B-20).
 */
export function toRows(
  entries: readonly TimeEntry[],
  titles: ReadonlyMap<Id, { title: string; callNumber: string | null }>,
  sort: { column: SortColumn; direction: SortDirection },
): readonly BookingRowData[] {
  const rows = entries.map((entry) => {
    const todo = titles.get(entry.todoId);
    return {
      id: entry.id,
      exportStatus: entry.exportStatus,
      exportCount: entry.exportCount,
      source: entry.source,
      callNumber: todo?.callNumber ?? null,
      todoTitle: todo?.title ?? "Unbekanntes Todo",
      period: formatPeriod(entry.startedAt, entry.endedAt),
      duration: formatDuration(entry.durationSeconds),
      note: entry.note,
      ...(entry.exportStatus === "exported" ? { exportedAt: formatDateTime(entry.updatedAt) } : {}),
      sortPeriod: entry.startedAt,
      sortDuration: entry.durationSeconds,
      /*
       * Sortiert wird nach **Anzeigezustand** und damit nach Dringlichkeit:
       * offen, erneut offen, exportiert, nicht abgerechnet. Der Filter
       * daneben kennt weiterhin genau zwei Werte (E-032) — hier wird nur
       * geordnet, nicht ausgewählt.
       */
      sortState: STATE_ORDER.indexOf(exportDisplayState(entry.exportStatus, entry.exportCount)),
    };
  });

  const factor = sort.direction === "ascending" ? 1 : -1;
  rows.sort((left, right) => {
    if (sort.column === "duration") return (left.sortDuration - right.sortDuration) * factor;
    if (sort.column === "state") return (left.sortState - right.sortState) * factor;
    return left.sortPeriod.localeCompare(right.sortPeriod) * factor;
  });

  return rows.map(({ sortPeriod, sortDuration, sortState, ...row }) => {
    void sortPeriod;
    void sortDuration;
    void sortState;
    return row;
  });
}
