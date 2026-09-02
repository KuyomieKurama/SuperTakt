/**
 * Takt — T-042: Der Tagesfilter benutzt denselben Tagesbegriff wie der Export
 * (E-025).
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * Bis T-042 stand in `repo-time.ts` `date(started_at) >= date(?)`.
 * `date()` in SQLite schneidet den **UTC**-Anteil ab; `toCalendarDay` in der
 * Domäne liefert den **Ortstag**. Die beiden fallen an rund einem Zwölftel
 * aller Abende auseinander:
 *
 * ```
 *   date('2026-08-31T22:30:00Z')          = 2026-08-31
 *   derselbe Zeitpunkt in Europe/Berlin   = 2026-09-01, 00:30
 * ```
 *
 * Eine Buchung um halb eins nachts erschien damit im Filter unter dem Vortag,
 * während der Export sie in die Tagesgruppe des Folgetags legt. Beide Tage
 * bekommen dann eine falsche Summe, und weil nach E-008 **je Tagesgruppe**
 * aufgerundet wird, landet der Fehler in einer Rechnung.
 *
 * Das war die sechste Doppelung derselben Art in diesem Bestand (Rundung,
 * Plausibilisierung, Zustandsform, Kalendertag in der Oberfläche,
 * Quellenliste). Diese steckte in SQL, wo keine Typprüfung sie findet — und
 * kein Test deckte sie ab. Deshalb prüft diese Datei **die Zeitzone selbst**
 * und nicht bloß, dass der Filter irgendetwas filtert: Ein Test, der nur mit
 * UTC arbeitet, wäre auch mit dem alten `date()` grün gewesen.
 *
 * `Europe/Berlin` ist fest eingesetzt und kommt nicht aus der Umgebung. Ein
 * Test, dessen Ergebnis von der Zone des ausführenden Rechners abhängt, misst
 * den Rechner und nicht den Bestand.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { calendarDayBounds, toCalendarDay, type CalendarDay } from '@takt/domain';

import { NOW, createTodo, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

const BERLIN = 'Europe/Berlin';
const day = (value: string): CalendarDay => value as CalendarDay;

const hoursBetween = (from: string, to: string): number =>
  (Date.parse(to) - Date.parse(from)) / 3_600_000;

describe('calendarDayBounds — der Ortstag in UTC-Grenzen (E-025)', () => {
  it('ein Sommertag in Berlin beginnt um 22:00 UTC des Vortags', () => {
    const bounds = calendarDayBounds(day('2026-08-31'), BERLIN);

    expect(bounds.startsAt).toBe('2026-08-30T22:00:00Z');
    expect(bounds.endsBefore).toBe('2026-08-31T22:00:00Z');
  });

  it('ein Wintertag beginnt um 23:00 UTC des Vortags', () => {
    const bounds = calendarDayBounds(day('2026-01-15'), BERLIN);

    expect(bounds.startsAt).toBe('2026-01-14T23:00:00Z');
    expect(bounds.endsBefore).toBe('2026-01-15T23:00:00Z');
  });

  /**
   * Der Grund, warum die Grenze berechnet und nicht als „minus zwei Stunden"
   * hingeschrieben wird: An den Umstellungstagen ist ein Tag nicht 24 Stunden
   * lang. Eine feste Verschiebung schöbe an genau diesen beiden Tagen im Jahr
   * eine Stunde Arbeitszeit in den falschen Tag.
   */
  it('der Tag der Sommerzeitumstellung hat 23 Stunden, der der Rückstellung 25', () => {
    const kurz = calendarDayBounds(day('2026-03-29'), BERLIN);
    const lang = calendarDayBounds(day('2026-10-25'), BERLIN);

    expect(hoursBetween(kurz.startsAt, kurz.endsBefore)).toBe(23);
    expect(hoursBetween(lang.startsAt, lang.endsBefore)).toBe(25);
  });

  it('die Grenzen sind halboffen und stoßen lückenlos aneinander', () => {
    const erster = calendarDayBounds(day('2026-08-31'), BERLIN);
    const zweiter = calendarDayBounds(day('2026-09-01'), BERLIN);

    expect(erster.endsBefore).toBe(zweiter.startsAt);
  });

  it('jeder Zeitpunkt in den Grenzen trägt den Ortstag, jeder davor und danach nicht', () => {
    const bounds = calendarDayBounds(day('2026-08-31'), BERLIN);
    const eineSekundeFrueher = new Date(Date.parse(bounds.startsAt) - 1000);
    const letzteSekunde = new Date(Date.parse(bounds.endsBefore) - 1000);

    expect(toCalendarDay(bounds.startsAt, BERLIN)).toBe('2026-08-31');
    expect(toCalendarDay(ts(`${letzteSekunde.toISOString().slice(0, 19)}Z`), BERLIN)).toBe('2026-08-31');
    expect(toCalendarDay(ts(`${eineSekundeFrueher.toISOString().slice(0, 19)}Z`), BERLIN)).toBe('2026-08-30');
    expect(toCalendarDay(bounds.endsBefore, BERLIN)).toBe('2026-09-01');
  });

  /**
   * Zonen mit halben und viertel Stunden Versatz sind kein Sonderfall der
   * Vollständigkeit halber: Sie brechen jede Umrechnung, die mit ganzen
   * Stunden rechnet, und ein Bestand, der einmal auf einem Reiselaptop läuft,
   * hat sie sofort.
   */
  it('auch eine Zone mit viertelstündigem Versatz stimmt (Asia/Kathmandu, UTC+05:45)', () => {
    const bounds = calendarDayBounds(day('2026-08-31'), 'Asia/Kathmandu');

    expect(bounds.startsAt).toBe('2026-08-30T18:15:00Z');
    expect(hoursBetween(bounds.startsAt, bounds.endsBefore)).toBe(24);
  });
});

describe('TimeEntryPort.search — fromDay/toDay filtern nach dem Ortstag (E-025, T-042)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  /**
   * Drei Buchungen um die Tagesgrenze herum. In UTC tragen alle drei das Datum
   * des 31. August; in Berliner Ortszeit gehören zwei davon zum 1. September.
   */
  async function threeAroundMidnight(): Promise<TestDatabase> {
    const database = openTestDatabase({ timeZone: BERLIN });
    const todo = await createTodo(database);
    if (todo === null) throw new Error('Kein Todo angelegt.');

    const create = async (startedAt: string, endedAt: string): Promise<void> => {
      const result = await database.unit.timeEntries.create(
        { todoId: todo.id, startedAt: ts(startedAt), endedAt: ts(endedAt), note: 'Leistung' },
        NOW,
      );
      if (!result.ok) throw new Error(`Buchung nicht angelegt: ${result.error.code}`);
    };

    // 23:30 Ortszeit am 31. August.
    await create('2026-08-31T21:30:00Z', '2026-08-31T21:50:00Z');
    // 00:30 Ortszeit am 1. September — in UTC noch der 31. August.
    await create('2026-08-31T22:30:00Z', '2026-08-31T22:50:00Z');
    // 01:30 Ortszeit am 1. September. Der Fall aus der Meldung.
    await create('2026-08-31T23:30:00Z', '2026-08-31T23:50:00Z');

    return database;
  }

  it('eine Buchung um 23:30 Ortszeit und eine um 00:30 des Folgetags liegen in verschiedenen Tagen', async () => {
    db = await threeAroundMidnight();

    const erster = await db.unit.timeEntries.search({
      fromDay: day('2026-08-31'),
      toDay: day('2026-08-31'),
    });
    const zweiter = await db.unit.timeEntries.search({
      fromDay: day('2026-09-01'),
      toDay: day('2026-09-01'),
    });

    expect(erster.items.map((entry) => entry.startedAt)).toEqual(['2026-08-31T21:30:00Z']);
    expect(zweiter.items.map((entry) => entry.startedAt)).toEqual([
      '2026-08-31T23:30:00Z',
      '2026-08-31T22:30:00Z',
    ]);
  });

  /**
   * Die eigentliche Rückfallprobe. Mit `date(started_at) <= date('2026-08-31')`
   * hätte der erste Filter **alle drei** Buchungen geliefert und der zweite
   * keine — beide Male falsch, und beide Male ohne dass irgendetwas auffällt.
   */
  it('der UTC-Tag zieht die Grenze nicht mehr: der 31. August liefert genau eine Buchung', async () => {
    db = await threeAroundMidnight();

    const gefiltert = await db.unit.timeEntries.search({ toDay: day('2026-08-31') });

    expect(gefiltert.total).toBe(1);
    expect(gefiltert.items).toHaveLength(1);
  });

  it('der Filter und die Gruppierung des Exports sind sich über jeden Tag einig', async () => {
    db = await threeAroundMidnight();

    for (const kalendertag of ['2026-08-31', '2026-09-01']) {
      const page = await db.unit.timeEntries.search({
        fromDay: day(kalendertag),
        toDay: day(kalendertag),
      });

      // `toCalendarDay` ist genau die Funktion, mit der `groupExportCandidates`
      // die Tagesgruppen bildet. Was der Filter unter einem Tag zeigt, muss
      // dort in derselben Gruppe landen — sonst rechnet die Vorschau etwas
      // anderes aus, als die Liste anzeigt.
      for (const entry of page.items) {
        expect(toCalendarDay(entry.startedAt, BERLIN)).toBe(kalendertag);
      }
    }
  });

  it('ein offener Zeitraum nach oben nimmt beide Septembertage mit', async () => {
    db = await threeAroundMidnight();

    const abSeptember = await db.unit.timeEntries.search({ fromDay: day('2026-09-01') });

    expect(abSeptember.total).toBe(2);
  });

  it('ohne Tagesfilter bleiben alle drei Buchungen sichtbar', async () => {
    db = await threeAroundMidnight();

    const alle = await db.unit.timeEntries.search({});

    expect(alle.total).toBe(3);
  });
});
