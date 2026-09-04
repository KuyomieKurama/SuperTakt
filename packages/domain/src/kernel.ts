/**
 * Takt — Domänenkern: Grundtypen.
 *
 * T-001 liefert ausschließlich Typdefinitionen. Es steht keine Laufzeitlogik in
 * diesem Paket; die Umsetzung folgt in T-009, die Tests davor in T-010.
 *
 * Dieses Paket kennt weder HTTP noch SQL (CLAUDE.md, E-001). Es importiert
 * nichts außer sich selbst.
 *
 * Bezeichner sind englisch und an den Tabellennamen des Schemas ausgerichtet
 * (CLAUDE.md „Sprache", E-015, R-16): `tag_folder` heißt hier `TagFolder`,
 * `time_entry` heißt `TimeEntry`. Kommentare bleiben deutsch.
 */

// ---------------------------------------------------------------------------
// Kennungen. Markierte Typen, damit eine TodoId nicht versehentlich dort landet,
// wo eine TagId erwartet wird — beide sind zur Laufzeit Zeichenketten.
// ---------------------------------------------------------------------------

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
 * Kalendertag in Ortszeit, Form `YYYY-MM-DD`.
 *
 * Dient Filtern und Anzeige und ist zusätzlich die Gruppierungsachse des
 * Exports: Eine Exportzeile entsteht je Todo und Kalendertag.
 *
 * Maßgeblich ist der Tag, an dem der Timer **gestartet** wurde. Eine Buchung
 * von 23:40 bis 00:20 zählt vollständig zum Starttag und wird nicht geteilt.
 * Der Wert leitet sich damit ausschließlich aus `started_at` ab; `ended_at`
 * geht nie in die Gruppierung ein.
 */
export type CalendarDay = Branded<'CalendarDay'>;

/** Ganze Sekunden, immer >= 1. Eine Buchung mit Dauer 0 existiert nicht (E-008). */
export type Seconds = number;

/**
 * Anzahl Viertelstunden als ganze Zahl. Das ist die einzige Darstellung, in der
 * die Domäne gerundete Zeit weitergibt.
 *
 * Der Exportwert entsteht erst am Rand als `quarters / 4`. Diese Division ist in
 * IEEE-754 exakt, weil 1/4 eine Zweierpotenz im Nenner hat — 0,25 / 0,50 / 0,75
 * sind ohne Rundungsfehler darstellbar. Innerhalb der Domäne wird nie mit
 * Gleitkommazahlen gerechnet.
 */
export type QuarterHours = number;

// ---------------------------------------------------------------------------
// Ergebnis statt Ausnahme. Fachliche Fehlschläge sind Werte, keine Würfe.
// ---------------------------------------------------------------------------

export type Result<T, E = TaktError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// ---------------------------------------------------------------------------
// Fehlerkatalog. Die Zuordnung auf HTTP-Statuscodes steht in docs/architektur.md
// und wird ausschließlich im HTTP-Adapter vorgenommen, nie hier.
// ---------------------------------------------------------------------------

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
  // Zeitbuchung und Export (A-6.9, E-012, A-8.8)
  | 'time_entry_locked'
  | 'export_status_unchanged'
  | 'export_status_not_settable'
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
  /**
   * Der Standard-Status für neue Todos lässt sich nicht löschen (T-074).
   *
   * Bis dahin stand diese Zusage allein in der Oberfläche: `apps/web` sperrte
   * den Knopf, der Dienst ließ den Löschvorgang durch, und `defaultStatus()`
   * fiel danach **still** auf den ersten Status nach Position zurück. Wer die
   * Route unmittelbar aufrief, stellte damit einen Zustand her, den die
   * Oberfläche für unmöglich hielt — und niemand erfuhr, dass sein Standard
   * jetzt ein anderer ist. Eine Regel, die nur in der Oberfläche steht, ist
   * keine Regel.
   */
  | 'default_status_locked'
  // Speicherung
  | 'conflict'
  | 'storage_error';

/**
 * Ein einzelner Befund innerhalb eines fachlichen Fehlers.
 *
 * ---------------------------------------------------------------------------
 * Die drei Pflichtfelder
 * ---------------------------------------------------------------------------
 *
 * `field` benennt, **woran** es liegt — ein Eingabefeld, oder dort, wo es
 * keines gibt, die Kennung des betroffenen Datensatzes. `code` ist der
 * englische technische Schlüssel und die einzige Größe, gegen die ein
 * Aufrufer verzweigt. `message` ist der deutsche Anzeigetext (CLAUDE.md).
 *
 * ---------------------------------------------------------------------------
 * `name` — der Name als eigenes Feld, nicht nur im Satz (W-11 aus R-2a)
 * ---------------------------------------------------------------------------
 *
 * Sperrt der Dienst eine Löschung, weil eine Regel den Datensatz benutzt,
 * nennt er die Regel: `message` lautet dann „Regel „Ost“". Die Oberfläche
 * reiht solche Sätze aneinander und bekommt „Betroffen sind Regel „Ost“,
 * Regel „Nord“ und Regel „Abrechnung“." — dreimal dasselbe Gattungswort, und
 * besseres Deutsch wäre „die Regeln „Ost“, „Nord“ und „Abrechnung“".
 *
 * Der Weg dorthin führt **nicht** über einen Schnitt im fremden Text. Wer den
 * Namen aus `message` herausschneidet, baut eine zweite, ungeschriebene
 * Abmachung über dessen Wortlaut; sie bricht still, sobald der Dienst seinen
 * Satz ändert (T-097 Annahme 1, von R-2a ausdrücklich bestätigt). Der Name
 * steht deshalb **zusätzlich** als eigenes Feld da.
 *
 * **Rein additiv.** `message` bleibt Zeichen für Zeichen, wie es war, und
 * bleibt der Text, den eine Oberfläche zeigen darf, die `name` nicht kennt.
 * Wer `name` liest, setzt seinen eigenen Satz; wer es nicht liest, verliert
 * nichts. `undefined` heißt „dieser Befund trägt keinen Namen" und nicht
 * „der Name ist leer" — ein `''` wäre ein Name, den es nicht gibt.
 *
 * Der Name kommt aus dem eigenen Bestand und nie aus der Anfrage; er verrät
 * dem Aufrufer nichts, was ihm die Liste derselben Dinge nicht ohnehin sagt
 * (B-2.4).
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

// ---------------------------------------------------------------------------
// Laufzeitanteil (T-009)
//
// Ab hier steht ausführbarer Code. Er ist rein: keine Uhr, kein Dateisystem,
// kein Netz, keine Datenbank. Die einzige Ausnahme ist die Auflösung der
// Zeitzone in `resolveTimeZone`, und sie ist ausdrücklich überschreibbar —
// siehe die Begründung dort.
// ---------------------------------------------------------------------------

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
 * Zeitzone, in der Kalendertage bestimmt werden.
 *
 * Takt läuft auf einem Arbeitsplatzrechner mit einer Zeitzone; die Gruppierung
 * des Exports muss denselben Tagesbegriff benutzen wie die Uhr an der Wand des
 * Benutzers (E-025). Die Zone kommt deshalb aus der Laufzeit und nicht aus
 * einer Einstellung — eine zweite, abweichend eingestellte Zone wäre eine
 * Fehlerquelle ohne Nutzen.
 *
 * Jede Funktion, die sie braucht, nimmt sie als überschreibbares Argument
 * entgegen. Damit bleibt der Rest der Domäne rein und ohne laufenden Dienst
 * prüfbar: Ein Test kann jede Zone einsetzen, ohne die Umgebung zu verstellen.
 */
export const resolveTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Kalendertag eines Zeitstempels in Ortszeit, Form `YYYY-MM-DD`.
 *
 * Das ist die Gruppierungsachse des Exports neben dem Todo. Maßgeblich ist der
 * Zeitpunkt des Timerstarts (E-025); diese Funktion weiß davon nichts, sie
 * bekommt schlicht den Zeitstempel übergeben, den der Aufrufer für maßgeblich
 * hält.
 *
 * Die Umrechnung in Ortszeit ist nicht schmückendes Beiwerk: Eine Buchung, die
 * um 23:50 Ortszeit beginnt, trägt in UTC bereits das Datum des Folgetags oder
 * eben nicht — je nach Jahreszeit. Wer den Datumsanteil des UTC-Zeitstempels
 * abschneidet, bekommt an rund einem Zwölftel aller Abende den falschen Tag und
 * damit die falsche Tagessumme.
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

/**
 * Wie weit die Ortszeit an diesem Zeitpunkt von UTC abweicht, in Millisekunden.
 *
 * Positiv östlich von Greenwich. Der Weg führt über die Darstellung: Die Zone
 * wird auf den Zeitpunkt angewandt, das Ergebnis wieder als UTC gelesen, und
 * die Differenz ist der Versatz. Anders ist er ohne Zonendatenbank nicht zu
 * bekommen — und eine eigene Zonendatenbank wäre die zweite Wahrheit neben der
 * des Betriebssystems.
 */
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
 * Der erste Zeitpunkt eines Kalendertags in einer Zone, als UTC-Millisekunden.
 *
 * Zwei Anläufe, weil der Versatz selbst vom Zeitpunkt abhängt: Der erste
 * rechnet mit dem Versatz zur Wanduhrzeit, der zweite mit dem am so gefundenen
 * Zeitpunkt. Danach wird begradigt — an Umstellungstagen kann Mitternacht
 * ausfallen (Sprung nach vorn genau um 00:00) oder zweimal vorkommen (Sprung
 * zurück). Gesucht ist beide Male der **früheste** Zeitpunkt, dessen Ortstag
 * der gesuchte ist.
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
 * Die UTC-Grenzen eines Kalendertags in Ortszeit (E-025).
 *
 * **Wozu.** Zeitpunkte liegen in UTC — in der Datenbank, in `Timestamp`, in
 * jeder Antwort. Kalendertage liegen in Ortszeit; `toCalendarDay` sagt das,
 * und `input.ts` nennt `fromDay`/`toDay` ausdrücklich „ein Kalendertag in
 * Ortszeit". Wer beides vergleichen will, muss an genau einer Stelle
 * umrechnen, und das ist diese.
 *
 * **Warum in der Domäne.** Bis T-042 rechnete der SQLite-Adapter selbst:
 * `date(started_at) >= date(?)`. `date()` schneidet den UTC-Anteil ab und
 * liefert damit einen anderen Tagesbegriff als die Domäne —
 * `date('2026-08-31T23:30:00Z')` ist `2026-08-31`, derselbe Zeitpunkt in
 * Europe/Berlin ist der 1. September. Eine Buchung um halb zwölf abends fiel
 * so in eine andere Tagesgruppe als die, mit der der Export rechnet, und die
 * Tagessumme wurde auf der falschen Seite gerundet.
 *
 * Das war die sechste Doppelung derselben Art in diesem Bestand (Rundung,
 * Plausibilisierung, Zustandsform, Kalendertag in der Oberfläche,
 * Quellenliste). Sie steckte in SQL, wo keine Typprüfung sie findet. Deshalb
 * steht die Tagesgrenze jetzt hier: Ein zweiter Adapter ruft dieselbe Funktion
 * auf, statt sie noch einmal zu erfinden.
 *
 * **Wie der Adapter sie benutzt.** `started_at` ist eine Zeichenkette fester
 * Breite in UTC (`YYYY-MM-DDTHH:MM:SSZ`); ein lexikographischer Vergleich ist
 * dort derselbe wie ein zeitlicher. Der Adapter vergleicht also
 * `started_at >= startsAt` und `started_at < endsBefore` und rechnet nicht.
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
