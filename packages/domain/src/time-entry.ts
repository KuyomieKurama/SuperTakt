/** Die Buchungsnotiz wird exportiert; der interne Todo-Vermerk bleibt davon getrennt. */

import type { Seconds, Timestamp, TimeEntryId, TodoId } from './kernel.ts';
import { earlierOf, secondsBetween } from './kernel.ts';

// Exportstatus (A-6.5, A-6.9)

/** Der Exportstatus wechselt transaktional; es gibt keinen beobachtbaren Zwischenstatus. */
export type ExportStatus = 'open' | 'exported';

/** Woher die Buchung stammt. Für die Oberfläche, ohne Einfluss auf den Export. */
export type TimeEntrySource = 'timer' | 'manual';

/**
 * Eine abgeschlossene Zeitbuchung (A-6.4). Tabelle `time_entry`.
 *
 * `note` ist die Buchungsnotiz aus A-7.3, auf dem Bildschirm **Leistung**
 * (E-016). Sie geht in die Abrechnung (A-7.4). Der interne Vermerk des Todos
 * aus A-7.2 kommt in diesem Typ nicht vor und ist über ihn auch nicht
 * erreichbar — siehe `TodoNote` in todo.ts und R-06.
 */
export interface TimeEntry {
  readonly id: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  readonly durationSeconds: Seconds;
  readonly note: string;
  readonly exportStatus: ExportStatus;
  /**
   * Wie oft diese Buchung schon in einem Exportlauf enthalten war.
   *
   * `exportStatus === 'open' && exportCount > 0` ist genau der Zustand, den
   * die Oberfläche als „schon einmal exportiert" kennzeichnen muss (R-10).
   */
  readonly exportCount: number;
  readonly source: TimeEntrySource;
  /**
   * Read-only copy of `todo.no_export` (F-8, E-124 point 6, A-26). A NoExport booking is recorded
   * but never "open for billing"; the time screen must not count it as open.
   */
  readonly todoNoExport: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/** Eine laufende Buchung: kein Ende, keine Dauer, nie exportierbar. */
export interface RunningTimeEntry {
  readonly id: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly note: string;
  readonly source: 'timer';
}

// Timer-Regel (A-6.8, A-2.5)

/** Ein laufender Timer darf nur nach ausdrücklicher Zustimmung beendet werden. */
export interface TimerStartRequest {
  readonly todoId: TodoId;
  readonly stopRunning: boolean;
  readonly now: Timestamp;
}

/**
 * Ergebnis eines Startversuchs.
 *
 * Ein ausgezeichneter Vereinigungstyp, damit der Aufrufer den Konfliktfall
 * nicht übersehen kann: `kind` muss geprüft werden, bevor auf `entry`
 * zugegriffen werden darf.
 */
export type TimerStartResult =
  | {
      readonly kind: 'started';
      readonly entry: RunningTimeEntry;
      /** Der vorher laufende Timer, falls einer gestoppt wurde. */
      readonly stopped: TimeEntry | null;
      /**
       * Der Start hebt „Erledigt“ auf; mögliche Spaltenwechsel ergeben sich daraus über die
       * Poolregeln.
       */
      readonly doneCleared: boolean;
    }
  | {
      readonly kind: 'confirmation_required';
      /** Der Timer, der ohne Bestätigung weiterliefe. Für den Dialog. */
      readonly running: RunningTimeEntry;
      /** Titel des Todos, auf dem der laufende Timer sitzt. */
      readonly runningTodoTitle: string;
    };

/**
 * Der Anwendungsfall setzt die Wiederöffnung zusammen mit dem Timerstart in einer Transaktion um;
 * `statusId` bleibt unverändert.
 */
export type DetermineReopen = (input: {
  readonly isDone: boolean;
}) => {
  readonly clearDone: boolean;
};

/**
 * Kürzeste Dauer, die als Buchung erhalten bleibt.
 *
 * Ein Stopp unterhalb dieser Grenze verwirft die Buchung, statt eine Buchung
 * über 0 Sekunden anzulegen — das ist der Doppelklick auf „Start", nicht
 * geleistete Arbeit. Der Anwendungsfall meldet das als `timer_too_short`
 * zurück; die Oberfläche stellt es als Hinweis dar, nicht als Fehler.
 */
export type MinimumDurationSeconds = 1;

export type TimerStopResult =
  | { readonly kind: 'recorded'; readonly entry: TimeEntry }
  | { readonly kind: 'discarded'; readonly reason: 'timer_too_short'; readonly durationSeconds: number };
// Entwürfe: was eine reine Regel über eine Buchung sagen kann (T-009)
//
// Eine reine Funktion kann keine Kennung vergeben — dafür bräuchte sie Zufall
// oder eine Uhr, und beides nähme ihr die Prüfbarkeit ohne laufenden Dienst.
// Sie liefert deshalb Entwürfe: alles, was aus der Regel folgt, ohne die
// Felder, die erst die Speicherung setzt (`id` beim Anlegen, `createdAt`,
// `updatedAt`, `exportStatus`, `exportCount`).
//
// Das ist kein Umweg, sondern die Trennung aus E-001 an einer konkreten
// Stelle: Die Domäne entscheidet, der Adapter schreibt.

/** Ein neuer, noch nicht gespeicherter laufender Timer. */
export interface RunningTimeEntryDraft {
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly note: string;
  readonly source: 'timer';
}

/**
 * Eine abzuschließende Buchung: die Kennung ist bekannt, weil die Zeile bereits
 * läuft; Ende und Dauer folgen aus der Regel.
 */
export interface StoppedTimeEntryDraft {
  readonly id: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  readonly durationSeconds: Seconds;
  readonly note: string;
  readonly source: 'timer';
}

/** Kürzeste Dauer, die als Buchung erhalten bleibt. Siehe `MinimumDurationSeconds`. */
export const MINIMUM_DURATION_SECONDS: MinimumDurationSeconds = 1;

/** Longest single time entry (A-28.6, E-120, E-124 point 3): 24 hours. */
export const MAX_TIME_ENTRY_SECONDS = 24 * 60 * 60;

/** Would a booking of `seconds` exceed {@link MAX_TIME_ENTRY_SECONDS}? A non-finite value answers `false`. */
export const exceedsMaximumSeconds = (seconds: number): boolean =>
  Number.isFinite(seconds) && seconds > MAX_TIME_ENTRY_SECONDS;

/**
 * Would a booking from `startedAt` to `endedAt` exceed {@link MAX_TIME_ENTRY_SECONDS}?
 *
 * Unreadable timestamps answer `false`: they are rejected by the rules that read them, and a
 * `true` here would turn them into a stop that can never succeed.
 */
export const exceedsMaximumDuration = (startedAt: Timestamp, endedAt: Timestamp): boolean =>
  exceedsMaximumSeconds(secondsBetween(startedAt, endedAt));

/**
 * Ergebnis der reinen Stopp-Regel.
 *
 * `orphan_discarded` steht neben `timer_too_short`, weil beide Fälle dieselbe
 * Folge haben — es entsteht keine Buchung — aber aus verschiedenen Gründen, und
 * der Grund gehört in die Meldung an den Benutzer (E-036).
 */
export type TimerStopDecision =
  | { readonly kind: 'recorded'; readonly entry: StoppedTimeEntryDraft }
  | {
      readonly kind: 'discarded';
      readonly reason: 'timer_too_short' | 'orphan_discarded';
      readonly durationSeconds: number;
    };

/**
 * Ergebnis der reinen Start-Regel (A-6.8, A-2.5).
 *
 * Nicht zu verwechseln mit `TimerStartResult` oben: Dort steht, was nach dem
 * Schreiben herauskommt (mit vergebener Kennung und vollständiger Buchung),
 * hier steht, was die Regel entschieden hat. Der Anwendungsfall setzt das eine
 * in einer Transaktion in das andere um.
 */
export type TimerStartDecision =
  | {
      readonly kind: 'started';
      readonly entry: RunningTimeEntryDraft;
      /** Was mit dem zuvor laufenden Timer geschieht. `null`, wenn keiner lief. */
      readonly stopped: TimerStopDecision | null;
      /** A-2.5: hebt dieser Start das Erledigt-Kennzeichen des Todos auf? */
      readonly doneCleared: boolean;
    }
  | {
      readonly kind: 'confirmation_required';
      readonly running: RunningTimeEntry;
    };

// Umsetzung (T-009)

/** Bei `clearDone: false` soll der Anwendungsfall den Erledigt-Zeitpunkt nicht unnötig schreiben. */
export const determineReopen: DetermineReopen = ({ isDone }) => ({ clearDone: isDone });

/**
 * Nur abgeschlossene Buchungen zählen als offene Einträge. Ein Stopp hebt ein zwischenzeitlich
 * gesetztes Erledigt-Kennzeichen nicht auf.
 */
export interface EntryClosedEffect {
  /** E-032 — es gibt jetzt mindestens eine abgeschlossene, offene Buchung. */
  readonly hasOpenEntries: true;
}

/** Siehe {@link EntryClosedEffect}. Eingefroren, weil ein geteilter Wert nicht wandern darf. */
export const ENTRY_CLOSED_EFFECT: EntryClosedEffect = Object.freeze({ hasOpenEntries: true });

/**
 * Nur beim Entstehen einer abgeschlossenen Buchung mit Wiederöffnung verwenden. Ein regulärer
 * Timerstart setzt noch keine offene Buchung; ein Stopp hebt „Erledigt“ nicht auf.
 */
export interface BookingEffect extends EntryClosedEffect {
  /** A-2.5 — das Kennzeichen fällt. */
  readonly completedAt: null;
}

/** Siehe {@link BookingEffect}. Eingefroren, weil ein geteilter Wert nicht wandern darf. */
export const BOOKING_EFFECT: BookingEffect = Object.freeze({
  ...ENTRY_CLOSED_EFFECT,
  completedAt: null,
});

/**
 * Unterhalb der Mindestdauer wird keine Buchung angelegt; die Speicherung erlaubt keine Dauer von
 * null.
 */
export const decideTimerStop = (input: {
  readonly running: RunningTimeEntry;
  readonly note: string;
  readonly now: Timestamp;
}): TimerStopDecision => {
  const durationSeconds = secondsBetween(input.running.startedAt, input.now);

  // An unreadable timestamp yields NaN; it must not pass as a booking (T-380).
  if (!Number.isFinite(durationSeconds)) {
    return { kind: 'discarded', reason: 'timer_too_short', durationSeconds: 0 };
  }
  if (durationSeconds < MINIMUM_DURATION_SECONDS) {
    return { kind: 'discarded', reason: 'timer_too_short', durationSeconds };
  }

  return {
    kind: 'recorded',
    entry: {
      id: input.running.id,
      todoId: input.running.todoId,
      startedAt: input.running.startedAt,
      endedAt: input.now,
      durationSeconds,
      note: input.note,
      source: 'timer',
    },
  };
};

/**
 * Vor jedem Schreibzugriff die Zustimmung zum Stoppen einholen. Der eindeutige Index sichert die
 * Ein-Timer-Regel zusätzlich ab.
 */
export const decideTimerStart = (input: {
  readonly running: RunningTimeEntry | null;
  readonly request: TimerStartRequest;
  /** A-2.5: trägt das Zieltodo das Erledigt-Kennzeichen? */
  readonly todoIsDone?: boolean;
  /** Leistungstext, mit dem der neue Timer beginnt. */
  readonly note?: string;
}): TimerStartDecision => {
  const { running, request } = input;

  if (running !== null && !request.stopRunning) {
    return { kind: 'confirmation_required', running };
  }

  const stopped =
    running === null
      ? null
      : decideTimerStop({ running, note: running.note, now: request.now });

  return {
    kind: 'started',
    entry: {
      todoId: request.todoId,
      startedAt: request.now,
      note: input.note ?? '',
      source: 'timer',
    },
    stopped,
    doneCleared: determineReopen({ isDone: input.todoIsDone ?? false }).clearDone,
  };
};

/**
 * Book only after confirmation, and at most until min(heartbeat, now) (E-036, A-A-129).
 *
 * Without a heartbeat, or when a bound is unreadable, the booking ends at its start and is
 * discarded as too short: the cheap direction. Before T-388 an unreadable heartbeat made the
 * comparison fall through to `now` and booked the wall clock (T-380).
 */
export const decideOrphanedTimer = (input: {
  readonly running: RunningTimeEntry;
  /** Last heartbeat, `null` when none was ever written. */
  readonly heartbeatAt: Timestamp | null;
  readonly resolution: 'book_until_heartbeat' | 'discard';
  /** Wall clock of the asking run — the upper cap. Required since T-388. */
  readonly now: Timestamp;
}): TimerStopDecision => {
  if (input.resolution === 'discard') {
    return { kind: 'discarded', reason: 'orphan_discarded', durationSeconds: 0 };
  }

  const cappedEnd =
    input.heartbeatAt === null ? null : earlierOf(input.heartbeatAt, input.now);

  return decideTimerStop({
    running: input.running,
    note: input.running.note,
    now: cappedEnd ?? input.running.startedAt,
  });
};
