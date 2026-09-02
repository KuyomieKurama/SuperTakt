import { listTimeEntries } from "../api/endpoints";
import type { Id } from "../api/types";
import { exportDisplayState, type ExportDisplayState } from "../components/ExportStatus";

/**
 * Takt — welchen Exportzustand tragen die Buchungen eines Todos?
 *
 * Der Exportstatus muss **überall** unterscheidbar sein, nicht nur in der
 * Export-Ansicht (A-13.5). Todo-Liste, Kanban-Karte und Dashboard zeigen ihn
 * deshalb als Zusammenfassung über die Buchungen des Todos.
 *
 * ## Zwei Werte, vier Darstellungen
 *
 * Gefragt wird mit genau zwei Werten — `open` und `exported` (E-032). „Erneut
 * offen" ist **kein** Filterwert: Eine zurückgesetzte Buchung ist offen und
 * muss im Filter „offen“ enthalten sein, sonst fiele sie aus dem Export
 * (Befund B-21). Dasselbe gilt für „Nicht abgerechnet" (E-050): Es ist eine
 * Darstellung innerhalb von `exported`, kein eigener Abfragewert. Beide
 * entstehen erst beim Anzeigen, aus `exportCount`, und zwar über
 * `exportDisplayState` — der einen Stelle, die das tut.
 *
 * ## Warum zwei Abfragen und keine dritte
 *
 * Der Dienst kennt keine Route, die je Todo zusammenfasst. Zwei Listen zu
 * holen und nach Todo zu zählen ist Auswertung von Daten, keine Fachlogik: Es
 * wird nichts gerundet, nichts gruppiert, was eine Exportzeile bestimmt, und
 * keine Zugehörigkeit entschieden. Bei einem Bestand über der Obergrenze wird
 * das **gesagt** statt geschätzt — siehe `truncated`.
 */

export type ExportSummary = Readonly<Record<ExportDisplayState, number>>;

export interface ExportSummaryIndex {
  readonly byTodo: ReadonlyMap<Id, ExportSummary>;
  /**
   * Erfasste Sekunden je Todo, aus denselben Listen aufaddiert.
   *
   * `Todo` traegt die Summe nicht (sie ist berechnet, nie gespeichert), und
   * die Listenroute liefert sie nicht mit. Addieren von Werten, die die
   * Domaene erzeugt hat, ist keine Rundung und keine Zeitrechnung — der
   * Exportwert entsteht davon unberuehrt in der Tagesgruppe (E-020).
   */
  readonly secondsByTodo: ReadonlyMap<Id, number>;
  /** Zahl der offenen Buchungen insgesamt, soweit gelesen. */
  readonly openCount: number;
  /** Wurde die Obergrenze erreicht? Dann sind die Zahlen Untergrenzen. */
  readonly truncated: boolean;
}

const PAGE_SIZE = 200;
const MAX_PAGES = 10;

async function collect(status: "open" | "exported"): Promise<{
  counts: Map<Id, Partial<Record<ExportDisplayState, number>>>;
  seconds: Map<Id, number>;
  total: number;
  truncated: boolean;
}> {
  const counts = new Map<Id, Partial<Record<ExportDisplayState, number>>>();
  const seconds = new Map<Id, number>();
  let cursor: string | undefined;
  let pages = 0;
  let total = 0;

  do {
    const page = await listTimeEntries(
      { exportStatus: status },
      cursor === undefined ? { limit: PAGE_SIZE } : { limit: PAGE_SIZE, cursor },
    );
    for (const entry of page.items) {
      const state = exportDisplayState(entry.exportStatus, entry.exportCount);
      const bucket = counts.get(entry.todoId) ?? {};
      bucket[state] = (bucket[state] ?? 0) + 1;
      counts.set(entry.todoId, bucket);
      seconds.set(entry.todoId, (seconds.get(entry.todoId) ?? 0) + entry.durationSeconds);
      total += 1;
    }
    cursor = page.nextCursor ?? undefined;
    pages += 1;
  } while (cursor !== undefined && pages < MAX_PAGES);

  return { counts, seconds, total, truncated: cursor !== undefined };
}

export async function loadExportSummaries(): Promise<ExportSummaryIndex> {
  const [open, exported] = await Promise.all([collect("open"), collect("exported")]);

  const byTodo = new Map<Id, ExportSummary>();
  const merge = (source: Map<Id, Partial<Record<ExportDisplayState, number>>>): void => {
    for (const [todoId, bucket] of source) {
      const current = byTodo.get(todoId) ?? EMPTY_SUMMARY;
      byTodo.set(todoId, {
        open: current.open + (bucket.open ?? 0),
        reopened: current.reopened + (bucket.reopened ?? 0),
        exported: current.exported + (bucket.exported ?? 0),
        not_billed: current.not_billed + (bucket.not_billed ?? 0),
      });
    }
  };
  merge(open.counts);
  merge(exported.counts);

  const secondsByTodo = new Map<Id, number>();
  for (const source of [open.seconds, exported.seconds]) {
    for (const [todoId, value] of source) {
      secondsByTodo.set(todoId, (secondsByTodo.get(todoId) ?? 0) + value);
    }
  }

  return {
    byTodo,
    secondsByTodo,
    openCount: open.total,
    truncated: open.truncated || exported.truncated,
  };
}

export const EMPTY_SUMMARY: ExportSummary = {
  open: 0,
  reopened: 0,
  exported: 0,
  not_billed: 0,
};
