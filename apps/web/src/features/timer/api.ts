import { request } from "../../api/client";
import type {
  ForeignText,
  Id,
  PoolMovement,
  RunningTimeEntry,
  TimeEntry,
  Timestamp,
} from "../../api/types";

/* Was der Dienst über den Timer antwortet                              */

export interface RunningTimerView {
  readonly entry: RunningTimeEntry;
  readonly todoTitle: ForeignText;
  /** Sekunden seit dem Start, zum Zeitpunkt der Anfrage. Vom Dienst gerechnet. */
  readonly elapsedSeconds: number;
}

/** `confirmation_required` ist eine Rückfrage, kein Fehler. */
export type StartTimerResult =
  | {
      readonly kind: "started";
      readonly started: RunningTimeEntry;
      readonly stopped: TimeEntry | null;
      /** A-2.5: war das Todo erledigt und ist durch den Start wieder aktiv? */
      readonly doneCleared: boolean;
      /** Nur beim Wiederöffnen oder der ersten abgeschlossenen Buchung kann eine Poolbewegung entstehen. */
      readonly poolMovement: PoolMovement | null;
    }
  | {
      readonly kind: "confirmation_required";
      readonly running: RunningTimeEntry;
      readonly runningTodoTitle: ForeignText;
    };

/** Ein Stopp kann Poolzugehörigkeiten ändern, hebt „Erledigt“ aber nicht auf. */
export type StopTimerResult =
  | RecordedStop
  | {
      readonly kind: "discarded";
      /** Beim regulären Stopp werden nur zu kurze Buchungen verworfen. */
      readonly reason: "timer_too_short";
      /** Immer `null`: Ohne Buchung bewegt sich nichts. */
      readonly poolMovement: null;
    };

/** Der gebuchte Ausgang. Wortgleich an beiden Routen und deshalb einmal. */
interface RecordedStop {
  readonly kind: "recorded";
  readonly entry: TimeEntry;
  /** Wie diese Buchung das Todo durch die Pools bewegt — oder `null`. */
  readonly poolMovement: PoolMovement | null;
}

/** `orphan_discarded` bezeichnet bewusstes Verwerfen, `timer_too_short` eine zu kurze Buchung. */
export type ResolveOrphanedTimerResult =
  | RecordedStop
  | {
      readonly kind: "discarded";
      readonly reason: "timer_too_short" | "orphan_discarded";
      /** Immer `null`: Ohne Buchung bewegt sich nichts. */
      readonly poolMovement: null;
    };

export interface OrphanedTimerView {
  readonly running: RunningTimeEntry;
  readonly todoTitle: ForeignText;
  readonly heartbeatAt: Timestamp | null;
  /** Was gebucht würde, wenn „bis zum Lebenszeichen“ gewählt wird. */
  readonly bookableSeconds: number;
}

export type OrphanResolution = "book_until_heartbeat" | "discard";

/* A-24 — die Inaktivität                                               */

export interface IdleSession {
  readonly previousPeriods?: readonly Omit<IdleSession, "previousPeriods" | "todoTitle">[];
  readonly id: Id;
  readonly todoId: Id;
  readonly todoTitle: ForeignText;
  readonly note: ForeignText;
  readonly startedAt: Timestamp;
  readonly returnedAt: Timestamp | null;
}
export interface IdleAllocation { readonly todoId: Id | null; readonly seconds: number; readonly note: ForeignText }
export interface IdleResolution { readonly recordedSeconds: number; readonly breakSeconds: number; readonly resumed: boolean; readonly alreadyResolved: boolean }

/* Die Routen                                                           */

export function getRunningTimer(): Promise<RunningTimerView | null> {
  return request<RunningTimerView | null>("/timer");
}

/** Bei laufendem Timer liefert `stopRunning: false` eine Rückfrage mit Status 200. */
export function startTimer(todoId: Id, stopRunning = false): Promise<StartTimerResult> {
  return request<StartTimerResult>("/timer/start", {
    method: "POST",
    body: { todoId, stopRunning },
  });
}

export function stopTimer(note: ForeignText): Promise<StopTimerResult> {
  return request<StopTimerResult>("/timer/stop", { method: "POST", body: { note } });
}

/** E-036 — Lebenszeichen. Mindestens jede Minute, solange ein Timer läuft. */
export function touchTimerHeartbeat(): Promise<{ seenAt: Timestamp }> {
  return request<{ seenAt: Timestamp }>("/timer/heartbeat", { method: "POST", body: {} });
}

export function getOrphanedTimer(): Promise<OrphanedTimerView | null> {
  return request<OrphanedTimerView | null>("/timer/orphaned");
}

export function resolveOrphanedTimer(
  resolution: OrphanResolution,
): Promise<ResolveOrphanedTimerResult> {
  return request<ResolveOrphanedTimerResult>("/timer/orphaned/resolve", {
    method: "POST",
    body: { resolution },
  });
}

// Inaktivität: dieselbe zentrale API-Grenze wie die übrigen Timeraktionen.
export const getIdleSession = () => request<IdleSession | null>('/timer/idle');
export const beginIdleSession = (input: { entryId: Id; startedAt: Timestamp; returnedAt?: Timestamp }) => request<IdleSession | null>('/timer/idle/begin', { method: 'POST', body: input });
export const returnFromIdle = (id: Id, returnedAt?: Timestamp) => request<IdleSession | null>('/timer/idle/return', { method: 'POST', body: { id, ...(returnedAt === undefined ? {} : { returnedAt }) } });
export const resolveIdleSession = (id: Id, allocations: readonly IdleAllocation[], resume: boolean) => request<IdleResolution>('/timer/idle/resolve', { method: 'POST', body: { id, allocations, resume } });
