// Kennungen. Markierte Typen, damit eine TodoId nicht versehentlich dort landet,
// wo eine TagId erwartet wird — beide sind zur Laufzeit Zeichenketten.

declare const brand: unique symbol;

/** Markierter Zeichenkettentyp. Erzeugt keine Laufzeitdarstellung. */
export type Branded<T extends string> = string & { readonly [brand]: T };

export type TodoId = Branded<'TodoId'>;
export type TagId = Branded<'TagId'>;
export type TagFolderId = Branded<'TagFolderId'>;
export type StatusId = Branded<'StatusId'>;
export type TimeEntryId = Branded<'TimeEntryId'>;
export type PoolId = Branded<'PoolId'>;
export type ExportTemplateId = Branded<'ExportTemplateId'>;
export type ExportRunId = Branded<'ExportRunId'>;
export type ExportRunGroupId = Branded<'ExportRunGroupId'>;
export type ExportAuditId = Branded<'ExportAuditId'>;

/**
 * Zeitstempel in UTC, sekundengenau, Form `YYYY-MM-DDTHH:MM:SSZ`.
 *
 * Sekundengenau und nicht feiner, weil die Dauer in der Speicherung aus
 * Start und Ende berechnet wird und Bruchteile von Sekunden dort ohnehin
 * abgeschnitten würden. Lexikographische Sortierung entspricht der
 * chronologischen.
 */
export type Timestamp = Branded<'Timestamp'>;

/**
 * Für den Export gilt der lokale Starttag. Buchungen über Mitternacht werden vollständig diesem
 * Tag zugerechnet.
 */
export type CalendarDay = Branded<'CalendarDay'>;

/** Ganze Sekunden, immer >= 1. Eine Buchung mit Dauer 0 existiert nicht (E-008). */
export type Seconds = number;

/**
 * Viertelstunden ganzzahlig führen; erst am Ausgaberand durch vier teilen, was binär exakt
 * darstellbar ist.
 */
export type QuarterHours = number;

// Ergebnis statt Ausnahme. Fachliche Fehlschläge sind Werte, keine Würfe.

export type Result<T, E = TaktError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// Fehlerkatalog. Die Zuordnung auf HTTP-Statuscodes steht in docs/architektur.md
// und wird ausschließlich im HTTP-Adapter vorgenommen, nie hier.

export type TaktErrorCode =
  // Eingabe
  | 'validation_error'
  | 'not_found'
  // Tags und Ordner (A-4.6)
  | 'tag_folder_cycle'
  | 'tag_folder_not_empty'
  | 'tag_in_use'
  | 'name_conflict'
  // Timer (A-6.8, A-2.5)
  | 'timer_already_running'
  | 'timer_not_running'
  | 'timer_too_short'
  /** A-28.6: the stop would book more than 24 hours; the caller has to name the real end. */
  | 'timer_stop_end_required'
  // Zeitbuchung und Export (A-6.9, E-012, A-8.8)
  | 'time_entry_locked'
  /** A-28.6: a single time entry lasts at most 24 hours. */
  | 'time_entry_too_long'
  | 'export_status_unchanged'
  | 'export_status_not_settable'
  /** A-26.3: a booking of a NoExport todo cannot be marked "not billed". */
  | 'time_entry_no_export'
  | 'export_nothing_to_do'
  | 'export_template_invalid'
  | 'export_source_forbidden'
  | 'builtin_template_immutable'
  | 'export_directory_missing'
  | 'export_directory_not_writable'
  | 'export_path_outside_directory'
  // Kanban und Status
  | 'status_in_use'
  | 'last_status_column'
  /** Der Standard-Status darf auch über direkte Dienstaufrufe nicht gelöscht werden. */
  | 'default_status_locked'
  // Speicherung
  | 'conflict'
  | 'storage_error';

/**
 * Über `code` verzweigen, nicht über Meldungstext. `name` stammt aus dem Bestand und erlaubt
 * eigene Formulierungen ohne Textzerlegung.
 */
export interface TaktFieldError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  /**
   * Der bloße Name des betroffenen Dings, ohne Gattungswort und ohne
   * Anführungszeichen — „Ost", nicht „Regel „Ost“" (W-11).
   *
   * Freiwillig: Ein Befund über ein Eingabefeld hat nichts zu benennen.
   */
  readonly name?: string;
}

/**
 * Fachlicher Fehler als Wert.
 *
 * `message` ist deutscher Anzeigetext (CLAUDE.md). `code` ist der englische
 * technische Schlüssel und die einzige Größe, gegen die Aufrufer verzweigen.
 * `details` enthält nie Geheimnisse, nie Dateipfade außerhalb des gewählten
 * Exportordners und nie das Add-in-Token (E-009, R-09).
 */
export interface TaktError<C extends TaktErrorCode = TaktErrorCode> {
  readonly code: C;
  readonly message: string;
  readonly details?: readonly TaktFieldError[];
}

// Laufzeitanteil (T-009)
//
// Ab hier steht ausführbarer Code. Er ist rein: keine Uhr, kein Dateisystem,
// kein Netz, keine Datenbank. Die einzige Ausnahme ist die Auflösung der
// Zeitzone in `resolveTimeZone`, und sie ist ausdrücklich überschreibbar —
// siehe die Begründung dort.

/** Erfolgreiches Ergebnis. */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/** Fehlgeschlagenes Ergebnis. Fachliche Fehlschläge sind Werte, keine Würfe. */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Fachlicher Fehler als Wert.
 *
 * `message` ist deutscher Anzeigetext, `code` der englische technische
 * Schlüssel. Die Zuordnung auf HTTP-Statuscodes geschieht im Adapter
 * (docs/architektur.md), nie hier.
 */
export const taktError = <C extends TaktErrorCode>(code: C, message: string): TaktError<C> => ({
  code,
  message,
});

/**
 * Die Laufzeit liefert die Arbeitsplatz-Zeitzone; explizite Argumente halten die Tagesberechnung
 * unabhängig von der Testumgebung.
 */
export const resolveTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * In Ortszeit umrechnen; der abgeschnittene UTC-Datumsanteil kann einen anderen Kalendertag
 * liefern.
 */
export const toCalendarDay = (
  instant: Timestamp,
  timeZone: string = resolveTimeZone(),
): CalendarDay => {
  // Feste Sprache, nicht die des Benutzers: Gebraucht werden hier Ziffern, und
  // die sollen in jeder Umgebung dieselben sein. Die deutsche Darstellung eines
  // Datums gehoert in die Oberflaeche, nicht in einen Gruppierungsschluessel.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));

  let year = '';
  let month = '';
  let day = '';

  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'day') day = part.value;
  }

  return `${year.padStart(4, '0')}-${month}-${day}` as CalendarDay;
};

/**
 * Die Grenzen eines Kalendertags als Zeitpunkte in UTC.
 *
 * `startsAt` ist der erste Zeitpunkt des Tages, `endsBefore` der erste des
 * Folgetags. Halboffen — `startsAt <= t < endsBefore` —, weil ein
 * geschlossenes Intervall an der Sekunde vor Mitternacht endet und damit eine
 * Sekunde je Tag verliert oder doppelt zählt, je nachdem, wer es liest.
 */
export interface CalendarDayBounds {
  readonly startsAt: Timestamp;
  readonly endsBefore: Timestamp;
}

/** Ein Zeitpunkt in Millisekunden als Zeitstempel der einen Form. */
const asTimestamp = (ms: number): Timestamp => `${new Date(ms).toISOString().slice(0, 19)}Z` as Timestamp;

/** Den Zonenversatz aus der lokalisierten Darstellung berechnen, ohne eigene Zeitzonendatenbank. */
const zoneOffsetMs = (ms: number, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms));

  const field: Record<string, string> = {};
  for (const part of parts) field[part.type] = part.value;

  const asUtc = Date.UTC(
    Number(field['year']),
    Number(field['month']) - 1,
    Number(field['day']),
    Number(field['hour']),
    Number(field['minute']),
    Number(field['second']),
  );
  return asUtc - ms;
};

/** Der kleinste Schritt, in dem Zeitumstellungen weltweit vorkommen. */
const DST_STEP_MS = 15 * 60 * 1000;

/**
 * Mitternacht kann bei einer Zeitumstellung fehlen oder doppelt auftreten. Gesucht ist der
 * früheste Zeitpunkt des gewünschten Ortstags.
 */
const startOfCalendarDayMs = (day: CalendarDay, timeZone: string): number => {
  const wall = Date.parse(`${day}T00:00:00Z`);
  let instant = wall - zoneOffsetMs(wall, timeZone);
  instant = wall - zoneOffsetMs(instant, timeZone);

  // Mitternacht ausgefallen: vorrücken, bis der Ortstag stimmt.
  for (let step = 0; step < 8 && toCalendarDay(asTimestamp(instant), timeZone) < day; step += 1) {
    instant += DST_STEP_MS;
  }
  // Mitternacht doppelt: zurück auf ihr erstes Vorkommen.
  for (
    let step = 0;
    step < 8 && toCalendarDay(asTimestamp(instant - DST_STEP_MS), timeZone) === day;
    step += 1
  ) {
    instant -= DST_STEP_MS;
  }
  return instant;
};

/** Der Kalendertag nach diesem, rein rechnerisch auf der Zeichenkette. */
const nextCalendarDay = (day: CalendarDay): CalendarDay => {
  const next = Date.parse(`${day}T00:00:00Z`) + 24 * 60 * 60 * 1000;
  return new Date(next).toISOString().slice(0, 10) as CalendarDay;
};

/**
 * UTC-Zeitstempel gegen `startsAt <= startedAt < endsBefore` vergleichen; die Ortszeitgrenzen
 * nicht erneut im SQL-Adapter berechnen.
 */
export const calendarDayBounds = (
  day: CalendarDay,
  timeZone: string = resolveTimeZone(),
): CalendarDayBounds => ({
  startsAt: asTimestamp(startOfCalendarDayMs(day, timeZone)),
  endsBefore: asTimestamp(startOfCalendarDayMs(nextCalendarDay(day), timeZone)),
});

/**
 * Ganze Sekunden zwischen zwei Zeitstempeln. Negativ, wenn `to` vor `from`
 * liegt — die Prüfung darauf gehört der Regel, die den Wert benutzt, nicht
 * dieser Umrechnung.
 */
export const secondsBetween = (from: Timestamp, to: Timestamp): number =>
  Math.floor((Date.parse(to) - Date.parse(from)) / 1000);

/** A timestamp that parses and round-trips exactly (`2026-02-30T…` parses, but is not one). */
export const isExactTimestamp = (value: string): boolean => {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString().replace('.000Z', 'Z') === value;
};

/**
 * The earlier of two timestamps, compared by time rather than by text.
 *
 * `null` when either side is unreadable: a `NaN` comparison is always false and would
 * otherwise silently pick the second value — for a booking cap that is the expensive side
 * (T-380, R-34).
 */
export const earlierOf = (a: Timestamp, b: Timestamp): Timestamp | null => {
  const first = Date.parse(a);
  const second = Date.parse(b);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  return first <= second ? a : b;
};
