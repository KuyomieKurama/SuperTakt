/**
 * Display of values that were computed elsewhere. The only place where the UI
 * turns numbers and timestamps into text.
 *
 * No business logic here: nothing is rounded (E-008, `packages/domain/src/rounding.ts`),
 * no day group is formed (`planExportRun` in `packages/export`), no duration is
 * computed (the service sends `durationSeconds`), nothing is encoded.
 *
 * Formats follow the UI language (A-28.2, E-123): `de-DE` or `en-GB`. The export
 * file never passes through this file (E-123 point 4); `formatQuarters` is
 * display only.
 *
 * `calendarDayOf` and `todayCalendarDay` build filter values (`fromDay`/`toDay`),
 * not billing values; the service assigns a booking to its day (E-025).
 */

import { currentLocale, pickTexts } from "./language";

const WORDS = {
  de: {
    timeRangeSuffix: " Uhr",
    zeroMinutes: "0 Minuten",
    seconds: (count: number) => (count === 1 ? "1 Sekunde" : `${String(count)} Sekunden`),
    hours: (count: number) => (count === 1 ? "1 Stunde" : `${String(count)} Stunden`),
    minutes: (count: number) => (count === 1 ? "1 Minute" : `${String(count)} Minuten`),
    and: "und",
  },
  en: {
    timeRangeSuffix: "",
    zeroMinutes: "0 minutes",
    seconds: (count: number) => (count === 1 ? "1 second" : `${String(count)} seconds`),
    hours: (count: number) => (count === 1 ? "1 hour" : `${String(count)} hours`),
    minutes: (count: number) => (count === 1 ? "1 minute" : `${String(count)} minutes`),
    and: "and",
  },
};

function dateFormat(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(currentLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function weekdayFormat(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(currentLocale(), {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** 24-hour clock in both languages (welle-18.md 2.2). */
function timeFormat(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(currentLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** `YYYY-MM-DD` in the computer's time zone. `sv-SE` yields exactly this form. */
const DAY_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/* Durations                                                            */

function splitSeconds(seconds: number): { hours: number; minutes: number; rest: number } {
  const total = Math.max(0, Math.trunc(seconds));
  return {
    hours: Math.trunc(total / 3600),
    minutes: Math.trunc((total % 3600) / 60),
    rest: total % 60,
  };
}

function pad(value: number): string {
  return value < 10 ? `0${String(value)}` : String(value);
}

/**
 * Recorded duration, for example `1:07 h`. Unrounded; a single booking has no
 * export value (E-020).
 *
 * Under one minute the unit switches to seconds (`40 s`, T-059): a booking shown
 * as `0:00 h` looks like it never happened and gets entered twice. Zero stays
 * `0:00 h`.
 */
export function formatDuration(seconds: number): string {
  const { hours, minutes, rest } = splitSeconds(seconds);
  if (hours === 0 && minutes === 0 && rest > 0) return `${String(rest)} s`;
  return `${String(hours)}:${pad(minutes)} h`;
}

/** Running timer display, for example `00:42:17`. */
export function formatStopwatch(seconds: number): string {
  const { hours, minutes, rest } = splitSeconds(seconds);
  return `${pad(hours)}:${pad(minutes)}:${pad(rest)}`;
}

/**
 * Spoken form of the same duration, for `aria-label`. Same precision as
 * `formatDuration`; a full hour ends without "and 0 minutes", singular forms
 * are correct.
 */
export function spokenDuration(seconds: number): string {
  const words = pickTexts(WORDS);
  const { hours, minutes, rest } = splitSeconds(seconds);
  if (hours === 0 && minutes === 0) {
    if (rest === 0) return words.zeroMinutes;
    return words.seconds(rest);
  }
  if (hours === 0) return words.minutes(minutes);
  if (minutes === 0) return words.hours(hours);
  return `${words.hours(hours)} ${words.and} ${words.minutes(minutes)}`;
}

/* Quarter hours                                                        */

/**
 * The rounded value of a **day group** for display, for example `0,75` or
 * `0.75`. `quarters` arrives rounded from the domain (E-008, E-020); this only
 * divides by four like `quarterHoursToExportNumber`. Display only — the export
 * file takes its number from the template, never from here (E-123 point 4).
 */
export function formatQuarters(quarters: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(quarters / 4);
}

/* Points in time                                                       */

export function formatDate(timestamp: string): string {
  return dateFormat().format(new Date(timestamp));
}

export function formatTime(timestamp: string): string {
  return timeFormat().format(new Date(timestamp));
}

export function formatDateTime(timestamp: string): string {
  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

/** Period of a booking, for example `12.08.2026, 09:12–10:19`. */
export function formatPeriod(startedAt: string, endedAt: string): string {
  return `${formatDate(startedAt)}, ${formatTime(startedAt)}–${formatTime(endedAt)}`;
}

/** Period without date: `09:12–09:22 Uhr` in German, `09:12–09:22` in English. */
export function formatTimeRange(startedAt: string, endedAt: string): string {
  return `${formatTime(startedAt)}–${formatTime(endedAt)}${pickTexts(WORDS).timeRangeSuffix}`;
}

/** Calendar day with weekday, for example `Mi., 12.08.2026`. */
export function formatDayLabel(day: string): string {
  return weekdayFormat().format(new Date(`${day}T12:00:00`));
}

/* Calendar days for filters                                            */

/** The calendar day of a timestamp in the computer's time zone. */
export function calendarDayOf(timestamp: string): string {
  return DAY_FORMAT.format(new Date(timestamp));
}

/**
 * A calendar day as a date without weekday, for the deadline (A-19.2).
 * Noon avoids the time-zone shift of `new Date("2026-09-12")` (midnight UTC);
 * it computes nothing, the day is already in the string.
 */
export function formatCalendarDay(day: string): string {
  return dateFormat().format(new Date(`${day}T12:00:00`));
}

/** Today, as filter value `YYYY-MM-DD`. */
export function todayCalendarDay(): string {
  return DAY_FORMAT.format(new Date());
}

/**
 * Moves a calendar day by `days` days. Calendar arithmetic for filter buttons
 * ("last 7 days"), not for a billing value (E-025).
 */
export function shiftCalendarDay(day: string, days: number): string {
  const base = new Date(`${day}T12:00:00`);
  base.setDate(base.getDate() + days);
  return DAY_FORMAT.format(base);
}

/* Input fields for points in time                                      */

/**
 * Service timestamp (UTC) to the value of a `datetime-local` field (local time).
 * Both directions live here so two forms never convert differently.
 */
export function toLocalInputValue(timestamp: string): string {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).padStart(4, "0");
  return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Value of a `datetime-local` field back to a service timestamp. Empty or
 * unreadable input returns `null`; the caller reports a field error instead of
 * inventing a point in time.
 */
export function fromLocalInputValue(value: string): string | null {
  if (value.trim().length === 0) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toISOString().slice(0, 19)}Z`;
}

/* Numbers and text                                                     */

/** Whole number with the language's thousands separator. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat(currentLocale()).format(value);
}

/** File size, for example `12,4 kB` or `12.4 kB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${formatCount(bytes)} B`;
  const oneDecimal = new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 1 });
  const kilo = bytes / 1024;
  if (kilo < 1024) return `${oneDecimal.format(kilo)} kB`;
  return `${oneDecimal.format(kilo / 1024)} MB`;
}

/**
 * `1 Buchung` / `7 Buchungen`. The caller passes both forms from its text
 * bundle, so each language brings its own.
 */
export function plural(count: number, one: string, many: string): string {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

/**
 * "A, B und C" / "A, B and C" in the UI language (welle-18.md 2.2). The domain
 * keeps `enumerateGerman` for the add-in; the main UI enumerates here.
 */
export function formatList(parts: readonly string[]): string {
  return new Intl.ListFormat(currentLocale(), { style: "long", type: "conjunction" }).format(parts);
}
