import { listTimeEntries } from "../../api/endpoints";
import type { ExportPreview, ForeignText, Id, SkippedExportGroup, TimeEntry } from "../../api/types";

/**
 * Takt — woraus die Export-Ansicht ihre Tagesgruppen bildet (S-07, E-020,
 * E-025, E-031, E-034).
 *
 * Der Block stand bis T-254 unter der Überschrift „Hilfen" am Fuß von
 * `ExportScreen.tsx`. Er tut genau eine Sache: die noch offenen Buchungen
 * holen und die Antwort des Dienstes in die Gliederung übersetzen, die die
 * Ansicht anzeigt.
 *
 * **Gerechnet wird auch hier nichts.** Welcher Kalendertag zu einer Buchung
 * gehört, entscheidet E-025; welche Gruppe stehen bleibt, entscheidet E-034.
 * Beides kommt fertig aus `POST /export/preview`.
 */

const MAX_PAGES = 5;
export const PAGE_SIZE = 200;

/**
 * Die Gliederung einer Tagesgruppe, **wie der Dienst sie gemeldet hat**.
 *
 * Seit T-030 liefert `POST /export/preview` `groups` parallel zu `rows`. Damit
 * ist die Gliederung wieder eine Sache der Domäne: Welcher Kalendertag zu einer
 * Buchung gehört, entscheidet E-025 (der Tag des Timer**starts**), und diese
 * Ansicht bildet die Regel nicht mehr nach. Sie war die letzte Stelle in der
 * Oberfläche, an der eine Domänenregel ein zweites Mal stand — falsch geworden
 * wäre sie ausgerechnet an der Grenze, an der es weh tut: bei einer Buchung um
 * 23:50, die über Mitternacht läuft.
 */
export interface GroupLayout {
  readonly key: string;
  readonly todoId: Id;
  readonly day: string;
  readonly entryIds: readonly Id[];
}

export interface GroupInsight {
  readonly quarters: number | null;
  readonly blockedReason: string | null;
}

export async function collectOpenEntries(): Promise<readonly TimeEntry[]> {
  const out: TimeEntry[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const page = await listTimeEntries(
      { exportStatus: "open" },
      cursor === undefined ? { limit: PAGE_SIZE } : { limit: PAGE_SIZE, cursor },
    );
    out.push(...page.items);
    cursor = page.nextCursor ?? undefined;
    pages += 1;
  } while (cursor !== undefined && pages < MAX_PAGES);
  return out;
}

/**
 * Vorschau des Leistungstextes für die eingeklappte Zeile.
 *
 * Verbunden mit `"; "` — dem Trennzeichen aus E-026, das in
 * `packages/export/src/merge-notes.ts` als `NOTE_SEPARATOR` steht. Diese
 * Zeichenkette ist **nur Anzeige**: In die Datei geht, was der Dienst
 * zusammenführt, und die einzelnen Segmente stehen darunter sichtbar getrennt
 * (E-028, T-005n 4.2) — genau dort fällt auch ein Text auf, der selbst ein
 * Semikolon enthält.
 */
export function previewNote(entries: readonly TimeEntry[]): ForeignText {
  return [...entries]
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
    .map((entry) => entry.note)
    .filter((note) => note.length > 0)
    .join("; ");
}

/** Kennung einer Tagesgruppe in der Anzeige. Aus den Werten des Dienstes. */
export function groupKeyOf(todoId: Id, day: string): string {
  return `${todoId}|${day}`;
}

/** Was der Dienst als Gliederung gemeldet hat, in Anzeigereihenfolge. */
export function toLayout(preview: ExportPreview): readonly GroupLayout[] {
  const out: GroupLayout[] = [
    ...preview.groups.map((group) => ({
      key: groupKeyOf(group.todoId, group.day),
      todoId: group.todoId,
      day: group.day,
      entryIds: group.timeEntryIds,
    })),
    ...preview.skipped.map((skipped) => ({
      key: groupKeyOf(skipped.group.todoId, skipped.group.day),
      todoId: skipped.group.todoId,
      day: skipped.group.day,
      entryIds: skipped.group.timeEntryIds,
    })),
  ];
  return out.sort((left, right) => right.day.localeCompare(left.day));
}

export const ALL_EXCLUDED: GroupInsight = {
  quarters: null,
  blockedReason: "Alle Buchungen ausgeschlossen",
};

export function reasonText(reason: SkippedExportGroup["reason"]): string {
  return reason === "empty_note"
    ? "Leistung fehlt"
    : "Nicht exportierbar";
}
