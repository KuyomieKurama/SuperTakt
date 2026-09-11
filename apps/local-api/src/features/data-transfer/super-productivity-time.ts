/**
 * OutlookBridge annotiert die SP-Tageszeiten in den Aufgabennotizen.
 * Die Dauer bleibt aus timeSpentOnDay: die Plugin-Wanduhr ist keine zweite
 * Buchung und kann durch Reloads oder Zeitkorrekturen davon abweichen.
 * Referenz: SP-OutlookBridge/src/plugin/{plugin,dashboard}.ts und
 * src/shared/time-booking.ts (Commit 3a4981bc47da55a4b99904d1e119cc9dbd62811b).
 */
import { isCalendarDay } from '@takt/domain';

import { record } from './data-transfer.ts';

export interface OutlookBridgeState {
  readonly bookedTagId: string | null;
  readonly timeBooked: Readonly<Record<string, unknown>>;
}

export function readOutlookBridge(root: Readonly<Record<string, unknown>>): {
  readonly state: OutlookBridgeState | null;
  readonly invalid: boolean;
} {
  const plugins = root['pluginUserData'];
  if (!Array.isArray(plugins)) return { state: null, invalid: false };
  const plugin = plugins.map(record).find(item => item?.['id'] === 'outlook-super-productivity-bridge');
  if (plugin === undefined || plugin === null) return { state: null, invalid: false };
  let raw: unknown = plugin['data'];
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return { state: null, invalid: true }; }
  }
  const data = record(raw);
  if (data === null) return { state: null, invalid: true };
  return {
    state: {
      bookedTagId: typeof data['bookingTagId'] === 'string' && data['bookingTagId'].length > 0 ? data['bookingTagId'] : null,
      timeBooked: record(data['timeBooked']) ?? {},
    },
    invalid: false,
  };
}

export function wasTransferred(state: OutlookBridgeState | null, taskId: string, tagIds: readonly string[], day: string): boolean {
  if (state === null) return false;
  const marker = state.timeBooked[`${taskId}|${day}`];
  // Wie im Plugin: der Eingetragen-Tag gilt für alle Tage. Der Offen-Tag
  // hebt weder ihn noch einen einzelnen Tagesmarker auf.
  return (state.bookedTagId !== null && tagIds.includes(state.bookedTagId))
    || (typeof marker === 'number' && Number.isFinite(marker));
}

/** Millisekunden bleiben bis nach der Abtrennung von Elternsummen erhalten. */
export function trackedMilliseconds(value: unknown): Record<string, number> {
  const days: Record<string, number> = {};
  for (const [day, ms] of Object.entries(record(value) ?? {})) {
    if (isCalendarDay(day) && typeof ms === 'number' && Number.isFinite(ms) && ms > 0) days[day] = ms;
  }
  return days;
}

export function outlookBridgeBillingNotes(notes: string, trackedDays: readonly string[]): {
  readonly byDay: Readonly<Record<string, string>>;
  readonly unassigned: number;
  readonly inferred: number;
} {
  const marker = '---- Eigene Notiz';
  const at = notes.indexOf(marker);
  if (at < 0) return { byDay: {}, unassigned: 0, inferred: 0 };
  const blocks = notes.slice(at + marker.length).replace(/\r\n/g, '\n').split(/^---- Zeit Dauer:[ \t]*/m).slice(1);
  const byDay: Record<string, string> = {};
  let unassigned = 0;
  let inferred = 0;
  for (const block of blocks) {
    const newline = block.indexOf('\n');
    const header = (newline < 0 ? block : block.slice(0, newline)).trim();
    const content = newline < 0 ? '' : block.slice(newline + 1).trim();
    if (content.length === 0) continue;
    const dated = /^(\d{2})\.(\d{2})\.(\d{4}|\d{2})\s+\d+:[0-5]\d:[0-5]\d$/.exec(header);
    let day: string | undefined;
    if (dated !== null) {
      const year = dated[3] ?? '';
      const candidate = `${year.length === 2 ? `20${year}` : year}-${dated[2]}-${dated[1]}`;
      if (isCalendarDay(candidate) && trackedDays.includes(candidate)) day = candidate;
    } else if (/^\d+:[0-5]\d:[0-5]\d$/.test(header) && trackedDays.length === 1) {
      day = trackedDays[0];
      inferred += 1;
    }
    if (day === undefined) { unassigned += 1; continue; }
    byDay[day] = [byDay[day], content].filter(Boolean).join('\n\n');
  }
  return { byDay, unassigned, inferred };
}
