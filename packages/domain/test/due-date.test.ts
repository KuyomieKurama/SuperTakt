/**
 * Takt — T-148, die Frist eines Todos (A-19.1 bis A-19.7, A-19.20, E-070,
 * E-074, A-A-19).
 *
 * ===========================================================================
 * ROT ZUERST
 * ===========================================================================
 *
 * `packages/domain/src/due-date.ts` entstand mit T-146 und hatte laut Auftrag
 * T-148 (Messung des Orchestrators nach Welle T) **keine** Prüfdatei — 12 %
 * Anweisungen, 0 % Zweige, 0 % Funktionen. Vor dieser Datei existierte kein
 * `grep -rn "due-date" packages/domain/test/` — dieser Lauf ist der rote
 * Anfang, nicht die Fortsetzung einer bestehenden Prüfung.
 *
 * ===========================================================================
 * Was hier gemessen wird
 * ===========================================================================
 *
 * 1. **Die Form** (`isCalendarDay`): `YYYY-MM-DD`, die Jahresbandbreite
 *    1970–2999, und der Existenztest über den Rückweg via `Date.UTC` — mit
 *    genau den Randwerten, die der Auftrag nennt (30. Februar, Schaltjahr).
 * 2. **Denselben Tagesbegriff wie der Export (E-025).** `dueState` bekommt
 *    `today` **nicht** selbst gerechnet — es wird ausdrücklich mit
 *    `toCalendarDay` aus `kernel.ts` erzeugt, derselben Funktion, die die
 *    Tagesgruppierung des Exports benutzt (siehe `calendar-day-boundary.test.ts`).
 *    Die Tagesgrenze wird mit dem **echten** Kalendertag gemessen (Zeitpunkt
 *    kurz vor und kurz nach Mitternacht in einer echten Zeitzone), nicht mit
 *    einer selbst ausgedachten Zeichenkette — genau das verlangt der Auftrag
 *    mit "als echte Gleichheitsprüfung, nicht als zweite Rechnung".
 * 3. **Der vierte Fall ist ein Wert, kein `null`.**
 * 4. **Der Filtervergleich** (`dueComparison`/`matchesDueComparison`) als
 *    Eigenschaft: Für jeden Tag und jeden Zustand muss
 *    `matchesDueComparison(d, dueComparison(s, heute)) === (dueState(d, heute) === s)`
 *    gelten — wörtlich die Gegenprobe aus dem Kommentar über
 *    {@link dueComparison}.
 * 5. **Die Sortierregel** (`compareByDueDate`): Ein Todo ohne Frist steht in
 *    **beiden** Richtungen am Ende, ohne Platzhalterdatum (E-074 Punkt 2) —
 *    geprüft, indem eine Liste mit `Array#sort` tatsächlich sortiert wird und
 *    nicht nur der Rückgabewert eines einzelnen Vergleichs betrachtet wird.
 */
import { describe, expect, it } from 'vitest';

import {
  DUE_DATE_MESSAGE,
  DUE_STATES,
  DUE_STATE_PRESENCE,
  MAX_DUE_YEAR,
  MIN_DUE_YEAR,
  checkDueDate,
  compareByDueDate,
  dueComparison,
  dueState,
  isCalendarDay,
  isDueState,
  matchesDueComparison,
} from '../src/due-date.ts';
import type { DueState } from '../src/due-date.ts';
import { toCalendarDay } from '../src/kernel.ts';
import type { CalendarDay, Timestamp } from '../src/kernel.ts';

const day = (value: string): CalendarDay => value as CalendarDay;
const ts = (value: string): Timestamp => value as Timestamp;

// ---------------------------------------------------------------------------
// isCalendarDay — Form, Bandbreite, Existenz
// ---------------------------------------------------------------------------

describe('isCalendarDay — Form (A-A-19)', () => {
  it.each(['2026-09-05', '1970-01-01', '2999-12-31', '2024-02-29'])(
    'ein gültiger Kalendertag ("%s") wird angenommen',
    (value) => {
      expect(isCalendarDay(value)).toBe(true);
    },
  );

  it.each([
    ['2026-9-5', 'kein führendes Null-Padding'],
    ['2026/09/05', 'falscher Trenner'],
    ['2026-02-28T00:00:00Z', 'Zeitstempel mit Uhrzeit und Zone'],
    ['', 'leere Zeichenkette'],
    ['abcd-ef-gh', 'keine Ziffern'],
    ['2026-09-051', 'ein Zeichen zu lang'],
    ['26-09-05', 'zweistelliges Jahr'],
  ])('"%s" (%s) besteht die Form nicht', (value) => {
    expect(isCalendarDay(value)).toBe(false);
  });
});

describe('isCalendarDay — Jahresbandbreite (1970–2999, A-A-19)', () => {
  it(`${String(MIN_DUE_YEAR)}-01-01 ist die Untergrenze und bereits gültig`, () => {
    expect(isCalendarDay(`${String(MIN_DUE_YEAR)}-01-01`)).toBe(true);
  });

  it(`ein Jahr unter ${String(MIN_DUE_YEAR)} wird abgewiesen`, () => {
    expect(isCalendarDay(`${String(MIN_DUE_YEAR - 1)}-12-31`)).toBe(false);
  });

  it(`${String(MAX_DUE_YEAR)}-12-31 ist die Obergrenze und bereits gültig`, () => {
    expect(isCalendarDay(`${String(MAX_DUE_YEAR)}-12-31`)).toBe(true);
  });

  it(`ein Jahr über ${String(MAX_DUE_YEAR)} wird abgewiesen`, () => {
    expect(isCalendarDay(`${String(MAX_DUE_YEAR + 1)}-01-01`)).toBe(false);
  });

  it('0000-01-01 besteht die Form, aber nicht die Bandbreite', () => {
    expect(isCalendarDay('0000-01-01')).toBe(false);
  });
});

describe('isCalendarDay — der Existenztest über den Rückweg (der Fall, den man vergisst)', () => {
  it('der 30. Februar besteht die Form und existiert nicht', () => {
    expect(isCalendarDay('2026-02-30')).toBe(false);
  });

  it('der 29. Februar existiert im Schaltjahr 2024', () => {
    expect(isCalendarDay('2024-02-29')).toBe(true);
  });

  it('der 29. Februar existiert NICHT im Nicht-Schaltjahr 2023', () => {
    expect(isCalendarDay('2023-02-29')).toBe(false);
  });

  it('Monat 0 und Monat 13 werden abgewiesen', () => {
    expect(isCalendarDay('2026-00-15')).toBe(false);
    expect(isCalendarDay('2026-13-15')).toBe(false);
  });

  it('Tag 0 und Tag 32 werden abgewiesen', () => {
    expect(isCalendarDay('2026-01-00')).toBe(false);
    expect(isCalendarDay('2026-01-32')).toBe(false);
  });

  it('der 31. April besteht die Form und existiert nicht (April hat 30 Tage)', () => {
    expect(isCalendarDay('2026-04-31')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkDueDate — der abgewiesene Wert steht nicht in der Meldung
// ---------------------------------------------------------------------------

describe('checkDueDate', () => {
  it('ein gültiger Tag kommt unverändert als ok zurück', () => {
    expect(checkDueDate('2026-09-05')).toEqual({ ok: true, value: '2026-09-05' });
  });

  it('ein ungültiger Wert ergibt validation_error mit dem festen Satz', () => {
    const result = checkDueDate('2026-02-30');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation_error');
    expect(result.error.message).toBe(DUE_DATE_MESSAGE);
  });

  it('der abgewiesene Wert taucht nicht in der Meldung auf, auch wenn er aus einer fremden Quelle stammt', () => {
    const boesartig = '<script>alert(1)</script>--2029-02-30';
    const result = checkDueDate(boesartig);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).not.toContain(boesartig);
    expect(result.error.message).not.toContain('<script>');
  });
});

// ---------------------------------------------------------------------------
// Die vier Zustände
// ---------------------------------------------------------------------------

describe('DUE_STATE_PRESENCE / isDueState / DUE_STATES — Vollständigkeit', () => {
  it('genau vier Zustände, wörtlich benannt', () => {
    expect(Object.keys(DUE_STATE_PRESENCE).sort()).toEqual(
      ['due_later', 'due_today', 'no_due_date', 'overdue'].sort(),
    );
    expect([...DUE_STATES].sort()).toEqual(Object.keys(DUE_STATE_PRESENCE).sort());
  });

  it.each(['overdue', 'due_today', 'due_later', 'no_due_date'])(
    '"%s" ist ein bekannter Zustand',
    (value) => {
      expect(isDueState(value)).toBe(true);
    },
  );

  it.each(['Overdue', 'due-today', 'later', '', 'null'])(
    '"%s" ist KEIN bekannter Zustand — wörtlicher Vergleich ohne Normalisierung',
    (value) => {
      expect(isDueState(value)).toBe(false);
    },
  );
});

describe('dueState — vier Werte, ein vierter ist ein Wert und kein null (A-19.5)', () => {
  it('ohne Frist ist der Zustand "no_due_date", unabhängig von heute', () => {
    expect(dueState(null, day('2026-09-05'))).toBe('no_due_date');
    expect(dueState(null, day('1970-01-01'))).toBe('no_due_date');
  });

  it('ein Tag vor heute ist "overdue"', () => {
    expect(dueState(day('2026-09-04'), day('2026-09-05'))).toBe('overdue');
  });

  it('der heutige Tag ist "due_today" — ein eigener Ausgang, kein Sonderfall von vorher/nachher', () => {
    expect(dueState(day('2026-09-05'), day('2026-09-05'))).toBe('due_today');
  });

  it('ein Tag nach heute ist "due_later"', () => {
    expect(dueState(day('2026-09-06'), day('2026-09-05'))).toBe('due_later');
  });

  it('lange zurückliegend bleibt "overdue" (kein Rückfall auf "später fällig")', () => {
    expect(dueState(day('1970-01-01'), day('2026-09-05'))).toBe('overdue');
  });

  it('weit in der Zukunft bleibt "due_later"', () => {
    expect(dueState(day('2999-12-31'), day('2026-09-05'))).toBe('due_later');
  });
});

describe('dueState — die Tagesgrenze, gemessen mit dem echten Tagesbegriff des Exports (E-025)', () => {
  /**
   * `today` wird hier bewusst NICHT als Zeichenkette hingeschrieben, sondern
   * mit derselben Funktion erzeugt, die auch die Tagesgruppierung des Exports
   * benutzt (`toCalendarDay`, siehe `packages/storage/test/calendar-day-boundary.test.ts`).
   * Der Auftrag verlangt genau das: "die Gleichheit mit dem Tagesbegriff des
   * Exports als echte Gleichheitsprüfung, nicht als zweite Rechnung".
   *
   * Europe/Berlin ist im Testlauf fest eingestellt (`vitest.config.ts`,
   * `env.TZ`). Ende August liegt in der Sommerzeit (UTC+2): Lokale Mitternacht
   * des 1. September fällt auf `2026-08-31T22:00:00Z`.
   */
  const BERLIN = 'Europe/Berlin';
  const MIDNIGHT_UTC = '2026-08-31T22:00:00Z';
  const kurzVorMitternacht = toCalendarDay(ts('2026-08-31T21:59:59Z'), BERLIN);
  const genauMitternacht = toCalendarDay(ts(MIDNIGHT_UTC), BERLIN);

  it('eine Sekunde vor der lokalen Mitternacht trägt noch den alten Tag', () => {
    expect(kurzVorMitternacht).toBe('2026-08-31');
  });

  it('die lokale Mitternacht selbst trägt bereits den neuen Tag', () => {
    expect(genauMitternacht).toBe('2026-09-01');
  });

  it('eine Frist auf den neuen Tag ist "due_later", solange heute der alte Tag ist', () => {
    expect(dueState(day('2026-09-01'), kurzVorMitternacht)).toBe('due_later');
  });

  it('dieselbe Frist wird "due_today", sobald heute — eine Sekunde weiter — derselbe Tag ist', () => {
    // Gleichheit hier ist ein Zeichenkettenvergleich zwischen einer Frist und
    // einem von `toCalendarDay` gelieferten Tag — nicht zwei getrennt
    // ausgerechneten Werten, die zufällig übereinstimmen.
    expect(genauMitternacht).toBe('2026-09-01');
    expect(dueState(day('2026-09-01'), genauMitternacht)).toBe('due_today');
  });

  it('und wird "overdue", sobald ein weiterer Tag vergangen ist', () => {
    const uebernaechsterTag = toCalendarDay(ts('2026-09-01T22:00:00Z'), BERLIN);
    expect(uebernaechsterTag).toBe('2026-09-02');
    expect(dueState(day('2026-09-01'), uebernaechsterTag)).toBe('overdue');
  });
});

// ---------------------------------------------------------------------------
// Filtern (A-19.20) — dueComparison / matchesDueComparison als Eigenschaft
// ---------------------------------------------------------------------------

describe('dueComparison — der Vergleich, der genau den Zustand trifft (A-19.20)', () => {
  const today = day('2026-09-05');

  it('overdue wird zu "before heute"', () => {
    expect(dueComparison('overdue', today)).toEqual({ kind: 'before', day: today });
  });

  it('due_today wird zu "equal heute"', () => {
    expect(dueComparison('due_today', today)).toEqual({ kind: 'equal', day: today });
  });

  it('due_later wird zu "after heute"', () => {
    expect(dueComparison('due_later', today)).toEqual({ kind: 'after', day: today });
  });

  it('no_due_date wird zu "none" — ohne Tag', () => {
    expect(dueComparison('no_due_date', today)).toEqual({ kind: 'none' });
  });
});

describe('matchesDueComparison / dueComparison — die Gegenprobe aus dem Quellkommentar, als Eigenschaft', () => {
  const today = day('2026-09-05');
  const tage: readonly (CalendarDay | null)[] = [
    null,
    day('1970-01-01'),
    day('2026-09-04'),
    day('2026-09-05'),
    day('2026-09-06'),
    day('2999-12-31'),
  ];

  it.each(DUE_STATES)(
    'für den Zustand "%s" gilt matchesDueComparison(d, dueComparison(s, heute)) === (dueState(d, heute) === s) für jeden geprüften Tag',
    (state: DueState) => {
      const comparison = dueComparison(state, today);
      for (const tag of tage) {
        expect(matchesDueComparison(tag, comparison)).toBe(dueState(tag, today) === state);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Sortieren (A-19.20, E-074 Punkt 2)
// ---------------------------------------------------------------------------

describe('compareByDueDate — ein Todo ohne Frist steht in BEIDEN Richtungen am Ende (E-074 Punkt 2)', () => {
  it('beide ohne Frist: nicht zu unterscheiden', () => {
    expect(compareByDueDate(null, null, 'asc')).toBe(0);
    expect(compareByDueDate(null, null, 'desc')).toBe(0);
  });

  it('a ohne Frist, b mit Frist: a steht danach — in beiden Richtungen', () => {
    expect(compareByDueDate(null, day('2026-09-05'), 'asc')).toBeGreaterThan(0);
    expect(compareByDueDate(null, day('2026-09-05'), 'desc')).toBeGreaterThan(0);
  });

  it('a mit Frist, b ohne Frist: a steht davor — in beiden Richtungen', () => {
    expect(compareByDueDate(day('2026-09-05'), null, 'asc')).toBeLessThan(0);
    expect(compareByDueDate(day('2026-09-05'), null, 'desc')).toBeLessThan(0);
  });

  it('gleiche Frist ist nicht zu unterscheiden', () => {
    expect(compareByDueDate(day('2026-09-05'), day('2026-09-05'), 'asc')).toBe(0);
  });

  it('aufsteigend: die nähere Frist zuerst', () => {
    expect(compareByDueDate(day('2026-09-05'), day('2026-09-06'), 'asc')).toBeLessThan(0);
    expect(compareByDueDate(day('2026-09-06'), day('2026-09-05'), 'asc')).toBeGreaterThan(0);
  });

  it('absteigend kehrt nur den Wertvergleich um, nicht die Abwesenheitsfrage', () => {
    expect(compareByDueDate(day('2026-09-05'), day('2026-09-06'), 'desc')).toBeGreaterThan(0);
    expect(compareByDueDate(day('2026-09-06'), day('2026-09-05'), 'desc')).toBeLessThan(0);
  });

  /**
   * Der Auftrag verlangt ausdrücklich, dass ein Todo ohne Frist am Ende
   * steht — "ohne Platzhalterdatum". Diese Eigenschaft wird deshalb an einer
   * tatsächlich sortierten Liste gemessen und nicht nur am Rückgabewert
   * eines einzelnen Vergleichs: Ein `1970-01-01`-Platzhalter bestünde die
   * Einzelvergleiche oben genauso, würde aber in einer sortierten Liste ganz
   * vorn landen und nicht hinten.
   */
  it('eine gemischte Liste: ohne Frist steht nach dem Sortieren hinten, egal in welcher Richtung', () => {
    const eintraege: readonly { readonly id: string; readonly due: CalendarDay | null }[] = [
      { id: 'ohne-1', due: null },
      { id: 'spaeter', due: day('2026-12-24') },
      { id: 'ohne-2', due: null },
      { id: 'heute', due: day('2026-09-05') },
      { id: 'ueberfaellig', due: day('2026-01-01') },
    ];

    const aufsteigend = [...eintraege].sort((a, b) => compareByDueDate(a.due, b.due, 'asc'));
    expect(aufsteigend.map((e) => e.id)).toEqual(['ueberfaellig', 'heute', 'spaeter', 'ohne-1', 'ohne-2']);

    const absteigend = [...eintraege].sort((a, b) => compareByDueDate(a.due, b.due, 'desc'));
    expect(absteigend.map((e) => e.id)).toEqual(['spaeter', 'heute', 'ueberfaellig', 'ohne-1', 'ohne-2']);

    // Keine der beiden Ordnungen setzt ein Platzhalterdatum: Die beiden Einträge
    // ohne Frist bleiben `null` und werden nicht durch einen Wert ersetzt.
    for (const eintrag of eintraege) {
      if (eintrag.id.startsWith('ohne')) expect(eintrag.due).toBeNull();
    }
  });
});
