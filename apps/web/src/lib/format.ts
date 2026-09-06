/**
 * Takt — Darstellung von Werten, die woanders gerechnet wurden.
 *
 * ## Was hier steht und was ausdrücklich nicht
 *
 * Hier steht **Formatierung**: aus einer Zahl wird ein lesbarer Text, aus einem
 * Zeitstempel eine Uhrzeit in der Anzeigesprache. Hier steht **keine
 * Fachlogik**:
 *
 *  - Es wird **nicht gerundet**. Die Rundung auf Viertelstunden ist E-008 und
 *    liegt in `packages/domain/src/rounding.ts`; sie geschieht über die
 *    Tagesgruppe (E-020) und kommt als `quarters` fertig über den Dienst.
 *  - Es wird **keine Tagesgruppe gebildet**. Welche Buchungen zu einer
 *    Exportzeile gehören, entscheidet `planExportRun` in `packages/export`.
 *  - Es wird **keine Dauer berechnet**. `durationSeconds` und `elapsedSeconds`
 *    kommen vom Dienst.
 *  - Es wird **nichts kodiert**. Base64 ist A-8.4 und liegt in der Domäne.
 *
 * Was bleibt, ist der Rand: Sekunden in `1:07 h`, ein Zeitstempel in
 * `12.08.2026, 09:12`, ein Kalendertag für einen Filter. Das muss die
 * Oberfläche tun — der Dienst liefert Rohwerte, kein Bildschirmtext. Diese
 * Datei ist die einzige Stelle, an der es geschieht.
 *
 * `calendarDayOf` und `todayCalendarDay` sind die Entsprechung zu
 * `toCalendarDay` aus `packages/domain/src/kernel.ts`. Sie erzeugen **keinen**
 * Abrechnungswert: Sie bilden den Filterwert `fromDay`/`toDay`, nach dem der
 * Dienst sucht; die Zuordnung einer Buchung zu ihrem Tag trifft er selbst
 * (E-025, Tag des Timerstarts).
 *
 * **Seit T-031 ist das nicht mehr die Gliederung des Exports.** S-07 und S-14
 * bekommen ihre Tagesgruppen aus `POST /export/preview` (Feld `groups`, T-030)
 * und bilden keine mehr. Übrig bleiben drei Verwendungen, die keine
 * Entsprechung im Dienst haben, weil sie **exportierte** Buchungen betreffen —
 * und die kommen in keiner Vorschau vor:
 *
 *   1. der Kalendertag in einem Dialogtext („Die Buchung vom …"),
 *   2. `fromDay`/`toDay` in `app/dayGroup.ts`, wo nach dem Tag einer bereits
 *      exportierten Buchung gefragt wird,
 *   3. die Bündelung der Buchungsliste eines Todos in S-03, die offene **und**
 *      abgerechnete Zeiten zeigt.
 */

const LOCALE = "de-DE";

const DATE_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
});

/** `YYYY-MM-DD` in der Zeitzone des Rechners. `sv-SE` liefert genau diese Form. */
const DAY_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const NUMBER_2 = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* ==================================================================== */
/* Dauer                                                                */
/* ==================================================================== */

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
 * Erfasste Dauer, zum Beispiel `1:07 h`.
 *
 * Das ist die **ungerundete** Wirklichkeit. Neben einer einzelnen Buchung
 * steht bewusst kein Exportwert: Seit E-020 hat eine einzelne Buchung keinen
 * (Befund B-20). Der gerundete Wert erscheint an der Tagesgruppe.
 *
 * ## Unter einer Minute wird in Sekunden gemessen (T-059)
 *
 * Bis T-058 lief jede Buchung unter 60 Sekunden als `0:00 h` über den Schirm.
 * Der Auftraggeber hatte genau das vor sich: `01:07–01:08 Uhr` und daneben
 * `0:00 h`. Der Dienst war nie ungenau — `durationSeconds` war 40 —, die
 * Anzeige hat die Sekunden weggeschnitten.
 *
 * Das ist keine Kosmetik. Wer seine Buchung als null liest, hält sie für nicht
 * zustande gekommen und legt eine zweite an; danach stehen zwei Buchungen da,
 * wo eine gemeint war.
 *
 * Deshalb: **null Sekunden bleiben `0:00 h`** — da ist wirklich nichts —, und
 * alles darunter bis 59 Sekunden erscheint als `40 s`. Aufrunden auf `0:01 h`
 * wäre die falsche Rettung: Das wären 60 Sekunden, und so viele sind es nicht.
 * Die Einheit wechselt sichtbar mit, damit niemand `40` für Minuten hält.
 */
export function formatDuration(seconds: number): string {
  const { hours, minutes, rest } = splitSeconds(seconds);
  if (hours === 0 && minutes === 0 && rest > 0) return `${String(rest)} s`;
  return `${String(hours)}:${pad(minutes)} h`;
}

/** Laufende Anzeige des Timers, zum Beispiel `00:42:17`. */
export function formatStopwatch(seconds: number): string {
  const { hours, minutes, rest } = splitSeconds(seconds);
  return `${pad(hours)}:${pad(minutes)}:${pad(rest)}`;
}

/**
 * Vorgelesene Fassung derselben Dauer, für `aria-label`.
 *
 * Dieselbe Genauigkeit wie `formatDuration` (T-059): unter einer Minute werden
 * Sekunden gesagt, sonst Stunden und Minuten. Zwei zusätzliche Regeln, damit
 * der Satz gesprochen trägt:
 *
 *  - **Volle Stunde ohne Anhängsel.** „1 Stunde und 0 Minuten" ist kein Satz,
 *    den jemand sagen würde. Sind es null Minuten, endet die Ansage nach der
 *    Stunde.
 *  - **Einzahl richtig.** „1 Stunde", nicht „1 Stunden" — auch dann, wenn
 *    keine Minuten folgen.
 */
export function spokenDuration(seconds: number): string {
  const { hours, minutes, rest } = splitSeconds(seconds);
  if (hours === 0 && minutes === 0) {
    if (rest === 0) return "0 Minuten";
    return rest === 1 ? "1 Sekunde" : `${String(rest)} Sekunden`;
  }
  const h = hours === 1 ? "1 Stunde" : `${String(hours)} Stunden`;
  const m = minutes === 1 ? "1 Minute" : `${String(minutes)} Minuten`;
  if (hours === 0) return m;
  if (minutes === 0) return h;
  return `${h} und ${m}`;
}

/* ==================================================================== */
/* Viertelstunden                                                       */
/* ==================================================================== */

/**
 * Der gerundete Wert einer **Tagesgruppe** als Text, zum Beispiel `0,75`.
 *
 * `quarters` ist die Anzahl Viertelstunden und kommt bereits gerundet aus der
 * Domäne (E-008 über die Tagessumme, E-020). Die Umrechnung in Stunden ist
 * `quarterHoursToExportNumber` aus `packages/domain/src/rounding.ts` — dieselbe
 * Division durch vier, hier nur zur Anzeige. Gerundet wird an dieser Stelle
 * nichts; wer hier rundet, ändert eine Rechnung.
 */
export function formatQuarters(quarters: number): string {
  return NUMBER_2.format(quarters / 4);
}

/* ==================================================================== */
/* Zeitpunkte                                                           */
/* ==================================================================== */

export function formatDate(timestamp: string): string {
  return DATE_FORMAT.format(new Date(timestamp));
}

export function formatTime(timestamp: string): string {
  return TIME_FORMAT.format(new Date(timestamp));
}

export function formatDateTime(timestamp: string): string {
  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

/** Zeitraum einer Buchung, zum Beispiel `12.08.2026, 09:12–10:19`. */
export function formatPeriod(startedAt: string, endedAt: string): string {
  return `${formatDate(startedAt)}, ${formatTime(startedAt)}–${formatTime(endedAt)}`;
}

/** Zeitraum ohne Datum, für die aufgeklappte Tagesgruppe: `09:12–09:22 Uhr`. */
export function formatTimeRange(startedAt: string, endedAt: string): string {
  return `${formatTime(startedAt)}–${formatTime(endedAt)} Uhr`;
}

/** Kalendertag mit Wochentag, zum Beispiel `Mi., 12.08.2026`. */
export function formatDayLabel(day: string): string {
  return WEEKDAY_FORMAT.format(new Date(`${day}T12:00:00`));
}

/* ==================================================================== */
/* Kalendertage für Filter                                              */
/* ==================================================================== */

/** Der Kalendertag eines Zeitpunkts in der Zeitzone des Rechners. */
export function calendarDayOf(timestamp: string): string {
  return DAY_FORMAT.format(new Date(timestamp));
}

/**
 * Ein Kalendertag als deutsches Datum: `12.09.2026`.
 *
 * Für die Frist an einer Zeile und auf einer Karte (A-19.2). Ohne Wochentag —
 * anders als {@link formatDayLabel}, das eine Tagesgruppe von Buchungen
 * überschreibt und dort den Wochentag braucht, weil man Buchungen nach ihm
 * sucht. Eine Frist wird nach dem Datum gesucht.
 *
 * Der Mittag als Uhrzeit ist der übliche Griff gegen Zeitzonenversatz beim
 * Auslesen: `new Date("2026-09-12")` ist Mitternacht **UTC** und liegt westlich
 * von Greenwich noch am Vortag. **Er rechnet nichts** — welcher Tag gemeint ist,
 * steht schon in der Zeichenkette; hier wird er nur gesetzt.
 */
export function formatCalendarDay(day: string): string {
  return DATE_FORMAT.format(new Date(`${day}T12:00:00`));
}

/** Heute, als Filterwert `YYYY-MM-DD`. */
export function todayCalendarDay(): string {
  return DAY_FORMAT.format(new Date());
}

/**
 * Verschiebt einen Kalendertag um `days` Tage.
 *
 * Reine Kalenderarithmetik für Filterschaltflächen („letzte 7 Tage“), nicht
 * für einen Abrechnungswert. Welche Buchung zu welchem Tag zählt, entscheidet
 * weiterhin der Dienst (E-025).
 */
export function shiftCalendarDay(day: string, days: number): string {
  const base = new Date(`${day}T12:00:00`);
  base.setDate(base.getDate() + days);
  return DAY_FORMAT.format(base);
}

/* ==================================================================== */
/* Eingabefelder für Zeitpunkte                                         */
/* ==================================================================== */

/**
 * Zeitstempel des Dienstes in den Wert eines `datetime-local`-Feldes.
 *
 * Der Dienst führt UTC, das Feld zeigt Ortszeit. Beide Richtungen stehen hier,
 * damit die Umrechnung nicht in zwei Formularen unterschiedlich geschieht.
 */
export function toLocalInputValue(timestamp: string): string {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).padStart(4, "0");
  return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Wert eines `datetime-local`-Feldes zurück in einen Zeitstempel des Dienstes.
 * Leere oder unlesbare Eingaben liefern `null`; der Aufrufer meldet das als
 * Feldfehler, statt einen Zeitpunkt zu erfinden.
 */
export function fromLocalInputValue(value: string): string | null {
  if (value.trim().length === 0) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toISOString().slice(0, 19)}Z`;
}

/* ==================================================================== */
/* Zahlen und Text                                                      */
/* ==================================================================== */

/** Ganze Zahl mit Tausenderpunkt. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

/** Dateigröße, zum Beispiel `12,4 kB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${formatCount(bytes)} B`;
  const kilo = bytes / 1024;
  if (kilo < 1024) {
    return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(kilo)} kB`;
  }
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(kilo / 1024)} MB`;
}

/** `1 Buchung` / `7 Buchungen` — Einzahl und Mehrzahl an einer Stelle. */
export function plural(count: number, one: string, many: string): string {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

/* ==================================================================== */
/* Aufzählungen — sie stehen nicht mehr hier                            */
/* ==================================================================== */

/*
  Bis T-124 stand hier `joinGerman`: fünf Zeilen, die „A", „A und B", „A, B
  und C" ergaben. Sie waren die dritte Abschrift derselben Form — neben
  `enumerateGerman` in `lib/errorText.ts` und `quoteList` in
  `screens/TodoFormDialog.tsx`, und alle drei neben dem privaten `listPools`
  in `packages/domain/src/pool-movement.ts`, aus dem sie stammten.

  Seit T-122 führt die Domäne die Form aus: `enumerateGerman`, `quoteName`
  und `enumerateNames` in `packages/domain/src/enumeration.ts`. Der einzige
  Aufrufer in dieser Oberfläche — `emptyFolderNames` in `lib/poolRule.ts` —
  liest sie jetzt dort.

  Warum die Zeilen ersatzlos verschwinden und nicht als Weiterleitung
  stehenbleiben: Eine Weiterleitung wäre ein zweiter Name für dieselbe
  Funktion und damit die nächste Gelegenheit, sie an einer Stelle zu ändern.
  `lib/errorText.ts` führt aus dem einen genannten Grund eine — dort hängt ein
  Test des unit-testers am Namen, und dieser Bruch gehört nicht in diese
  Aufgabe (siehe Bericht T-124).
*/
