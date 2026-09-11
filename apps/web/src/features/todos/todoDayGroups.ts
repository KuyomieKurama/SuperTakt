import type { TimeEntry } from "../../api/types";
import { calendarDayOf } from "../../lib/format";

/**
 * Takt — die Tagesgruppen eines Todos (E-025).
 *
 * Rein rechnend, ohne React. Die Detailansicht (S-03) bündelt die Buchungen
 * eines Todos nach dem Kalendertag ihres **Starts**, weil genau diese
 * Gliederung auch der Export benutzt.
 */

export interface DayGroup {
  readonly day: string;
  readonly entries: readonly TimeEntry[];
  readonly openSeconds: number;
  readonly blocked: boolean;
}

/**
 * Buchungen nach Kalendertag des **Starts** bündeln (E-025).
 *
 * Das ist die Gliederung, die auch der Export benutzt — welche Buchungen
 * daraus eine Zeile ergeben und was sie gerundet wert ist, entscheidet
 * weiterhin der Dienst. Hier wird nur sortiert und gezählt.
 */
export function groupByDay(
  entries: readonly TimeEntry[],
  blockedDays: ReadonlySet<string>,
): readonly DayGroup[] {
  const buckets = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const day = calendarDayOf(entry.startedAt);
    const bucket = buckets.get(day);
    if (bucket === undefined) buckets.set(day, [entry]);
    else bucket.push(entry);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([day, items]) => ({
      day,
      entries: [...items].sort((left, right) => left.startedAt.localeCompare(right.startedAt)),
      openSeconds: items
        .filter((entry) => entry.exportStatus === "open")
        .reduce((sum, entry) => sum + entry.durationSeconds, 0),
      blocked: blockedDays.has(day),
    }));
}
