/**
 * Takt — T-010, Timer und Wiederbelebung erledigter Todos (A-2.5, A-6.8, E-023, E-036).
 *
 * Testfälle: TP-TIMER-01, TP-TIMER-02, TP-TIMER-03 (docs/testplan.md, Abschnitt 5).
 *
 * ROT ZUERST, gleiche Begründung wie in rounding.test.ts: `determineReopen` in
 * `packages/domain/src/time-entry.ts` und `isVisibleInPool` in
 * `packages/domain/src/tag.ts` existieren bislang nur als Funktionstypen
 * (`DetermineReopen`, `IsVisibleInPool`), keine Laufzeitwerte.
 *
 * TP-TIMER-03 („nur ein Timer gleichzeitig") ist strukturell **kein reiner
 * Domänenfall**: Weder time-entry.ts noch ein anderes Domänenmodul benennt
 * einen Funktionstyp für „entscheide, was beim Start passiert, wenn schon ein
 * Timer läuft" — dafür gibt es nur die Ergebnistypen `TimerStartRequest` und
 * `TimerStartResult`. Laut `packages/storage/src/ports.ts` (`TimerPort.start`)
 * trägt der SQLite-Adapter selbst die Verantwortung, inklusive des
 * strukturellen Schutzes über den eindeutigen Partialindex
 * `ux_time_entry_running`. Dieser Test prüft deshalb eine angenommene, rein
 * funktionale Entscheidungsfunktion `decideTimerStart` — **Annahme, im Bericht
 * ausdrücklich als solche markiert**, weil ihr Name in keiner Typdatei steht.
 * Bestätigt domain-dev einen anderen Zuschnitt (z. B. Entscheidung nur im
 * Adapter, kein reiner Kern dafür), gehört dieser Testfall stattdessen nach
 * `packages/storage/test/`.
 *
 * NACHTRAG T-010b (`.claude/team/reports/T-009-domain-dev.md`, Abschnitt
 * "Nächster Schritt" Punkt 2 und "Offene Fragen" Punkt 3): `determineReopen`,
 * `decideTimerStart` und `isVisibleInPool` existieren seit T-009 unter genau
 * diesen Namen, die `@ts-expect-error`-Kommentare über den Importen sind
 * damit entfernt (siehe rounding.test.ts für dieselbe Begründung).
 * Zusätzlich ergänzt dieser Nachtrag `decideOrphanedTimer` (E-036): Die
 * Funktion war bei T-010 noch nicht einmal als Typ vorhanden — weder Schema
 * noch Ports kannten das Lebenszeichen — und konnte deshalb nicht getestet
 * werden.
 */
import { describe, expect, it } from 'vitest';
import {
  determineReopen,
  decideTimerStart,
  decideOrphanedTimer,
  decideTimerStop,
  exceedsMaximumDuration,
  MAX_TIME_ENTRY_SECONDS,
  BOOKING_EFFECT,
  ENTRY_CLOSED_EFFECT,
} from '../src/time-entry.js';
import { isVisibleInPool } from '../src/pool.js';
import type { RunningTimeEntry, TimerStartRequest } from '../src/time-entry.js';
import type { Timestamp, TodoId } from '../src/kernel.js';

const todoId = (value: string) => value as unknown as TodoId;
const timestamp = (value: string) => value as unknown as Timestamp;

describe('TP-TIMER-01 — Domänenregel: Timer-Start auf erledigtem Todo hebt "Erledigt" auf', () => {
  it('isDone: true -> clearDone: true', () => {
    const result = determineReopen({ isDone: true });
    expect(result).toEqual({ clearDone: true });
  });

  it('isDone: false -> clearDone: false (nichts zu tun, kein überflüssiger Schreibvorgang)', () => {
    const result = determineReopen({ isDone: false });
    expect(result).toEqual({ clearDone: false });
  });

  it('die Regel äußert sich nicht zur Kanban-Spalte — es gibt kein Feld dafür im Ergebnis', () => {
    // E-023: Erledigt und Kanban-Spalte sind getrennte Achsen. Die Funktion
    // bekommt keine Spalte hinein und gibt keine heraus. Dieser Test wird bei
    // einer künftigen Regression, die eine "returnToStatusId" o.ä. wieder
    // einführt, weiterhin grün bleiben, solange das Feld optional ist — er
    // dient hier vor allem als Beleg für den erwarteten schmalen Vertrag.
    const result = determineReopen({ isDone: true }) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['clearDone']);
  });
});

describe('TP-TIMER-02 — Pool-Sichtbarkeit nach Wiederbelebung (A-2.5, A-3.4)', () => {
  it('erledigtes Todo ist in einer Pool-Ansicht ohne "erledigte einblenden" nicht sichtbar', () => {
    const visible = isVisibleInPool({ completedAt: timestamp('2026-08-30T10:00:00Z'), includeCompleted: false });
    expect(visible).toBe(false);
  });

  it('nach Aufheben von "Erledigt" (completedAt: null) ist dasselbe Todo wieder sichtbar', () => {
    // Kein Schreibvorgang auf eine gespeicherte Pool-Zuordnung nötig (A-3.4) —
    // die Funktion bekommt nur den neuen completedAt-Wert und liefert sofort
    // das richtige Ergebnis, weil die Mitgliedschaft nie an completedAt hing.
    const visible = isVisibleInPool({ completedAt: null, includeCompleted: false });
    expect(visible).toBe(true);
  });

  it('mit ausdrücklich eingeblendeten erledigten Todos (E-039) bleibt ein erledigtes Todo sichtbar', () => {
    const visible = isVisibleInPool({ completedAt: timestamp('2026-08-30T10:00:00Z'), includeCompleted: true });
    expect(visible).toBe(true);
  });

  it('ein aktives Todo ist unabhängig vom Einblend-Schalter immer sichtbar', () => {
    expect(isVisibleInPool({ completedAt: null, includeCompleted: false })).toBe(true);
    expect(isVisibleInPool({ completedAt: null, includeCompleted: true })).toBe(true);
  });
});

describe('TP-TIMER-03 — nur ein Timer gleichzeitig (A-6.8) — ANNAHME, siehe Kopfkommentar', () => {
  it('läuft bereits ein Timer und stopRunning ist nicht gesetzt: Rückfrage statt stillem Zweit-Timer', () => {
    const running: RunningTimeEntry = {
      id: 'te-1' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T08:00:00Z'),
      note: '',
      source: 'timer',
    };
    const request: TimerStartRequest = { todoId: todoId('todo-b'), stopRunning: false, now: timestamp('2026-08-31T09:00:00Z') };
    const result = decideTimerStart({ running, request });
    expect(result.kind).toBe('confirmation_required');
  });

  it('läuft bereits ein Timer und stopRunning ist gesetzt: der alte wird gestoppt, der neue startet', () => {
    const running: RunningTimeEntry = {
      id: 'te-1' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T08:00:00Z'),
      note: '',
      source: 'timer',
    };
    const request: TimerStartRequest = { todoId: todoId('todo-b'), stopRunning: true, now: timestamp('2026-08-31T09:00:00Z') };
    const result = decideTimerStart({ running, request });
    expect(result.kind).toBe('started');
    if (result.kind === 'started') {
      expect(result.stopped).not.toBeNull();
      expect(result.entry.todoId).toBe(todoId('todo-b'));
    }
  });

  it('läuft kein Timer: Start gelingt ohne Rückfrage, "stopped" ist null', () => {
    const request: TimerStartRequest = { todoId: todoId('todo-a'), stopRunning: false, now: timestamp('2026-08-31T09:00:00Z') };
    const result = decideTimerStart({ running: null, request });
    expect(result.kind).toBe('started');
    if (result.kind === 'started') {
      expect(result.stopped).toBeNull();
    }
  });
});

describe('TP-TIMER-04 — verwaister Timer nach Absturz (E-036), decideOrphanedTimer', () => {
  it('Auflösung "verwerfen": die Buchung wird verworfen, unabhängig davon, ob je ein Lebenszeichen geschrieben wurde', () => {
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: 'Rückruf begonnen',
      source: 'timer',
    };

    const result = decideOrphanedTimer({ running, heartbeatAt: timestamp('2026-08-31T22:30:00Z'), resolution: 'discard', now: timestamp('2026-09-01T09:00:00Z') });

    expect(result).toEqual({ kind: 'discarded', reason: 'orphan_discarded', durationSeconds: 0 });
  });

  it('Auflösung "verwerfen" bleibt gleich, auch ganz ohne jemals geschriebenes Lebenszeichen (heartbeatAt: null)', () => {
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: '',
      source: 'timer',
    };

    const result = decideOrphanedTimer({ running, heartbeatAt: null, resolution: 'discard', now: timestamp('2026-09-01T09:00:00Z') });

    expect(result).toEqual({ kind: 'discarded', reason: 'orphan_discarded', durationSeconds: 0 });
  });

  it('Auflösung "bis Lebenszeichen buchen": die Dauer reicht exakt bis zum letzten Lebenszeichen, NIE bis "jetzt"', () => {
    // Das Kernszenario aus der Begründung von E-036: ein um 22:00 Uhr
    // gestarteter, dann vergessener Timer darf nach einem Absturz nicht
    // vierzehn Stunden weiterzählen. Hier liegt das letzte Lebenszeichen nur
    // eine Minute nach dem Start — genau darauf ist zu buchen, nicht weiter.
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: 'vergessen zu stoppen',
      source: 'timer',
    };

    const result = decideOrphanedTimer({
      running,
      heartbeatAt: timestamp('2026-08-31T22:01:00Z'),
      resolution: 'book_until_heartbeat',
      // `now` liegt hinter dem Lebenszeichen — der Deckel nach oben (T-371)
      // greift hier nicht, `min(heartbeatAt, now)` bleibt beim Lebenszeichen.
      now: timestamp('2026-09-01T09:00:00Z'),
    });

    expect(result.kind).toBe('recorded');
    if (result.kind === 'recorded') {
      expect(result.entry.endedAt).toBe(timestamp('2026-08-31T22:01:00Z'));
      expect(result.entry.durationSeconds).toBe(60);
      // Der Leistungstext der laufenden Buchung wandert unverändert in den Entwurf.
      expect(result.entry.note).toBe('vergessen zu stoppen');
    }

    // Gegenprobe zum eigentlichen Fehlerbild: bis "jetzt" (14 Stunden später)
    // zu buchen wäre grundlegend falsch und ergäbe eine andere Dauer als hier.
    if (result.kind === 'recorded') {
      expect(result.entry.durationSeconds).not.toBe(14 * 60 * 60);
    }
  });

  it('Auflösung "bis Lebenszeichen buchen" ohne je geschriebenes Lebenszeichen: Dauer 0, die Buchung fällt als zu kurz heraus', () => {
    // "Fehlt es ganz, ist die Dauer 0 und die Buchung fällt als zu kurz heraus
    // — es gibt nichts zu buchen, was jemand bezeugen könnte." (time-entry.ts)
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: '',
      source: 'timer',
    };

    const result = decideOrphanedTimer({ running, heartbeatAt: null, resolution: 'book_until_heartbeat', now: timestamp('2026-09-01T09:00:00Z') });

    expect(result).toEqual({ kind: 'discarded', reason: 'timer_too_short', durationSeconds: 0 });
  });

  it('Auflösung "bis Lebenszeichen buchen" mit einem Lebenszeichen exakt zum Startzeitpunkt: ebenfalls zu kurz, kein Export', () => {
    // Randfall zwischen "buchen" und "verwerfen": der Timer ist sofort nach
    // dem Start abgestürzt, bevor ein zweites Lebenszeichen geschrieben wurde.
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: '',
      source: 'timer',
    };

    const result = decideOrphanedTimer({
      running,
      heartbeatAt: timestamp('2026-08-31T22:00:00Z'),
      resolution: 'book_until_heartbeat',
      now: timestamp('2026-09-01T09:00:00Z'),
    });

    expect(result).toEqual({ kind: 'discarded', reason: 'timer_too_short', durationSeconds: 0 });
  });

  it('das Ergebnis kennt nur "recorded" oder "discarded" — es gibt keinen dritten, "noch offen" genannten Zwischenwert', () => {
    // Die Frage "bis Lebenszeichen buchen oder verwerfen" MUSS beantwortet
    // sein, bevor diese Funktion überhaupt aufgerufen wird (`resolution` ist
    // ein Pflichtfeld ohne dritten erlaubten Wert). Solange sie unbeantwortet
    // ist, bleibt die Buchung schlicht unangetastet (ended_at weiterhin NULL)
    // und ist damit laut `v_export_candidate`
    // (packages/storage/test/export-candidate-view.test.ts) kein Kandidat für
    // irgendeinen Export — das ist keine dritte Rückgabe dieser Funktion,
    // sondern der Zustand, bevor sie überhaupt aufgerufen wird.
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: '',
      source: 'timer',
    };

    for (const resolution of ['book_until_heartbeat', 'discard'] as const) {
      const result = decideOrphanedTimer({ running, heartbeatAt: timestamp('2026-08-31T22:05:00Z'), resolution, now: timestamp('2026-09-01T09:00:00Z') });
      expect(['recorded', 'discarded']).toContain(result.kind);
    }
  });

  /**
   * T-375 (Bericht T-371-domain-dev.md, Abschnitt 3 und 8, offene Frage 2):
   * `now` ist am Typ **optional** geblieben, weil ein Pflichtfeld die sechs
   * Fälle oben zu `tsc`-Fehlern gemacht hätte. Sie sind jetzt nachgezogen
   * (alle sechs übergeben `now`, ohne daß sich eine Erwartung geändert hat) —
   * diese beiden Fälle testen den Deckel selbst, direkt in der Domäne, statt
   * ihn nur über den Anwendungsfall in `apps/local-api` zu sehen.
   */
  it('der Deckel nach oben (T-371): "now" vor dem Lebenszeichen gewinnt — gebucht wird nie in die Zukunft', () => {
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: 'Rückruf begonnen',
      source: 'timer',
    };

    // Das Lebenszeichen liegt hinter der Wanduhr des fragenden Laufs — eine
    // fremde Uhr, die vorgeht (T-370, T-371). Gebucht wird höchstens bis
    // "now", nicht bis zum Lebenszeichen.
    const result = decideOrphanedTimer({
      running,
      heartbeatAt: timestamp('2026-08-31T23:00:00Z'),
      resolution: 'book_until_heartbeat',
      now: timestamp('2026-08-31T22:20:00Z'),
    });

    expect(result.kind).toBe('recorded');
    if (result.kind === 'recorded') {
      expect(result.entry.endedAt).toBe(timestamp('2026-08-31T22:20:00Z'));
      expect(result.entry.durationSeconds).toBe(20 * 60);
      expect(result.entry.durationSeconds).not.toBe(60 * 60); // bis zum Lebenszeichen wäre falsch
    }
  });

  it('der Deckel nach oben (T-371): eine "now" vor dem Start verwirft, statt eine negative Dauer zu buchen', () => {
    const running: RunningTimeEntry = {
      id: 'te-orphan' as never,
      todoId: todoId('todo-a'),
      startedAt: timestamp('2026-08-31T22:00:00Z'),
      note: '',
      source: 'timer',
    };

    const result = decideOrphanedTimer({
      running,
      heartbeatAt: timestamp('2026-08-31T23:00:00Z'),
      resolution: 'book_until_heartbeat',
      // Eine rückwärts laufende Uhr: "now" liegt vor dem Start des Timers.
      now: timestamp('2026-08-31T21:00:00Z'),
    });

    // Verworfen, wie jede zu kurze Buchung — die Dauer selbst bleibt negativ
    // (`decideTimerStop` rechnet sie unverändert durch), gebucht wird davon nichts.
    expect(result.kind).toBe('discarded');
    if (result.kind === 'discarded') {
      expect(result.reason).toBe('timer_too_short');
      expect(result.durationSeconds).toBeLessThan(0);
    }
  });
});

/**
 * T-388 (`reports/T-388-domain-dev.md`, Nächster Schritt 1 und 2, R-34): an unreadable timestamp
 * must never fall through to booking the wall clock. Before T-388, `earlierOf` compared with
 * `<=` directly on `Date.parse`, and a `NaN` comparison is always false — it silently picked the
 * second value. For a booking cap that is the expensive direction (T-380).
 */
describe('decideOrphanedTimer / decideTimerStop — an unreadable timestamp never books the wall clock (T-388, R-34)', () => {
  const runningSince = (startedAt: Timestamp): RunningTimeEntry => ({
    id: 'te-orphan' as never,
    todoId: todoId('todo-a'),
    startedAt,
    note: 'unread heartbeat guard',
    source: 'timer',
  });

  it('an unreadable heartbeat ("2026-13-01…", a syntactically valid but nonexistent month) discards, instead of booking until "now"', () => {
    const running = runningSince(timestamp('2026-08-31T22:00:00Z'));

    const result = decideOrphanedTimer({
      running,
      // `Date.parse` returns `NaN` for this — month 13 does not exist.
      heartbeatAt: '2026-13-01T00:00:00Z' as Timestamp,
      resolution: 'book_until_heartbeat',
      now: timestamp('2026-09-01T09:00:00Z'),
    });

    // Before T-388 this booked 39 600 s (the wall clock, "now" minus start) — never again.
    expect(result).toEqual({ kind: 'discarded', reason: 'timer_too_short', durationSeconds: 0 });
    if (result.kind === 'recorded') {
      expect((result as { entry: { durationSeconds: number } }).entry.durationSeconds).not.toBe(39_600);
    }
  });

  it('an unreadable "now" discards as well — the cap itself must be readable before it can cap anything', () => {
    const running = runningSince(timestamp('2026-08-31T22:00:00Z'));

    const result = decideOrphanedTimer({
      running,
      heartbeatAt: timestamp('2026-08-31T23:00:00Z'),
      resolution: 'book_until_heartbeat',
      now: '2026-13-01T00:00:00Z' as Timestamp,
    });

    expect(result).toEqual({ kind: 'discarded', reason: 'timer_too_short', durationSeconds: 0 });
  });

  it('decideTimerStop with an unreadable start yields discarded/durationSeconds: 0, not a NaN booking', () => {
    const running = runningSince('2026-13-01T00:00:00Z' as Timestamp);

    const result = decideTimerStop({ running, note: 'x', now: timestamp('2026-09-01T09:00:00Z') });

    expect(result).toEqual({ kind: 'discarded', reason: 'timer_too_short', durationSeconds: 0 });
  });

  it('decideTimerStop with an unreadable "now" yields discarded/durationSeconds: 0 as well', () => {
    const running = runningSince(timestamp('2026-08-31T22:00:00Z'));

    const result = decideTimerStop({ running, note: 'x', now: '2026-13-01T00:00:00Z' as Timestamp });

    expect(result).toEqual({ kind: 'discarded', reason: 'timer_too_short', durationSeconds: 0 });
  });
});

/**
 * A-28.6 / E-124 point 3: a single time entry lasts at most 24 hours (`MAX_TIME_ENTRY_SECONDS`).
 * `exceedsMaximumDuration` is the pure rule the storage layer asks at every write door
 * (create, update, stop, displacing start) — see `packages/storage/test/repo-time.test.ts` for
 * the doors themselves. Here: the boundary itself, both sides of it.
 */
describe('exceedsMaximumDuration / MAX_TIME_ENTRY_SECONDS — the 24-hour cap on a single booking (A-28.6)', () => {
  it('MAX_TIME_ENTRY_SECONDS is exactly 24 hours in seconds', () => {
    expect(MAX_TIME_ENTRY_SECONDS).toBe(86_400);
  });

  it('exactly 24 hours (86 400 s) does NOT exceed the cap', () => {
    expect(
      exceedsMaximumDuration(timestamp('2026-08-31T00:00:00Z'), timestamp('2026-09-01T00:00:00Z')),
    ).toBe(false);
  });

  it('24 hours plus one second (86 401 s) DOES exceed the cap', () => {
    expect(
      exceedsMaximumDuration(timestamp('2026-08-31T00:00:00Z'), timestamp('2026-09-01T00:00:01Z')),
    ).toBe(true);
  });

  it('an unreadable pair of timestamps answers false — a rule that reads them rejects them elsewhere, not here', () => {
    expect(
      exceedsMaximumDuration('2026-13-01T00:00:00Z' as Timestamp, timestamp('2026-09-01T00:00:01Z')),
    ).toBe(false);
    expect(
      exceedsMaximumDuration(timestamp('2026-08-31T00:00:00Z'), '2026-13-01T00:00:00Z' as Timestamp),
    ).toBe(false);
  });
});

/**
 * T-105 (Auftrag aus `reports/T-101-domain-dev.md`, "Nächster Schritt" 2):
 * `BOOKING_EFFECT` und `ENTRY_CLOSED_EFFECT` (E-061 Punkt 1,
 * `pool-movement.ts` in `apps/local-api` verwendet sie als einzige
 * Quelle für "was ändert eine Buchung an einem Todo"). Beide Konstanten sind
 * bislang von keinem Test benannt (kein Treffer für "BOOKING_EFFECT" oder
 * "ENTRY_CLOSED_EFFECT" unter `packages/domain/test`, `packages/storage/test`
 * oder `apps/local-api/test` vor dieser Datei).
 *
 * Geprüft wird die eingefrorene GESTALT, nicht ihre Verwendung — die Wirkung
 * auf ein echtes Zustandspaar prüft
 * `apps/local-api/test/usecases/pool-movement-states.test.ts` gegen
 * `bookingMovementStates`/`closedEntryMovementStates`. Hier zählt: genau zwei
 * bzw. eine Achse, `BOOKING_EFFECT` baut sich wörtlich aus
 * `ENTRY_CLOSED_EFFECT` auf (keine zweite, unabhängig gepflegte Kopie), und
 * beide sind `Object.freeze`d — ein geteilter Wert, den ein Aufrufer
 * versehentlich verändert, wäre ein Fehler, der an einer ganz anderen Stelle
 * aufginge.
 */
describe('BOOKING_EFFECT / ENTRY_CLOSED_EFFECT — die Wirkung einer Buchung, eingefroren (E-061 Punkt 1)', () => {
  it('ENTRY_CLOSED_EFFECT trägt GENAU eine Achse: hasOpenEntries: true', () => {
    expect(ENTRY_CLOSED_EFFECT).toEqual({ hasOpenEntries: true });
    expect(Object.keys(ENTRY_CLOSED_EFFECT)).toEqual(['hasOpenEntries']);
  });

  it('BOOKING_EFFECT trägt GENAU zwei Achsen: completedAt: null UND hasOpenEntries: true — nicht mehr, nicht weniger', () => {
    expect(BOOKING_EFFECT).toEqual({ completedAt: null, hasOpenEntries: true });
    expect(Object.keys(BOOKING_EFFECT).sort()).toEqual(['completedAt', 'hasOpenEntries']);
  });

  it('BOOKING_EFFECT baut sich aus ENTRY_CLOSED_EFFECT auf — keine zweite, unabhängige Fassung derselben Achse', () => {
    // Nicht nur "beide Werte sind gleich" (das wäre auch bei zwei getrennt
    // gepflegten Literalen zufällig wahr), sondern: das Spreizen von
    // ENTRY_CLOSED_EFFECT plus der zusätzlichen Achse ergibt exakt
    // BOOKING_EFFECT.
    expect({ ...ENTRY_CLOSED_EFFECT, completedAt: null }).toEqual(BOOKING_EFFECT);
  });

  it('beide Konstanten sind eingefroren — ein Aufrufer kann den geteilten Wert nicht verändern', () => {
    expect(Object.isFrozen(ENTRY_CLOSED_EFFECT)).toBe(true);
    expect(Object.isFrozen(BOOKING_EFFECT)).toBe(true);

    // ES-Module laufen im Strikt-Modus: die Zuweisung auf ein eingefrorenes
    // Objekt wirft, statt still zu verpuffen (sonst bewiese ein grüner Test
    // nicht, dass wirklich eingefroren wurde).
    expect(() => {
      (ENTRY_CLOSED_EFFECT as { hasOpenEntries: boolean }).hasOpenEntries = false;
    }).toThrow();
    expect(() => {
      (BOOKING_EFFECT as { completedAt: string | null }).completedAt = '2026-08-31T08:00:00Z';
    }).toThrow();
  });
});
