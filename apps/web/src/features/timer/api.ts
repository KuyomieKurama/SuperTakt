import { request } from "../../api/client";
import type {
  ForeignText,
  Id,
  PoolMovement,
  RunningTimeEntry,
  TimeEntry,
  Timestamp,
} from "../../api/types";

/**
 * Takt — die Routen und Typen des Timers (A-6, E-036, A-24).
 *
 * Zehn Routen, ein Gegenstand: die **eine** laufende Buchung. Sechs davon
 * betreffen den Timer selbst — anzeigen, starten, stoppen, Lebenszeichen, die
 * verwaiste Buchung und ihre Auflösung —, vier die systemweite Inaktivität
 * (A-24). Sie stehen zusammen, weil eine Inaktivitätsphase ohne laufenden
 * Timer keinen Gegenstand hat.
 *
 * `RunningTimeEntry` steht weiterhin in `api/types.ts` und nicht hier: Die
 * Fehlerhülle des Übertragungswegs trägt sie (`api/client.ts`, `Conflict`),
 * und was die Übertragung selbst liest, gehört keinem Merkmal.
 */

/* ==================================================================== */
/* Was der Dienst über den Timer antwortet                              */
/* ==================================================================== */

export interface RunningTimerView {
  readonly entry: RunningTimeEntry;
  readonly todoTitle: ForeignText;
  /** Sekunden seit dem Start, zum Zeitpunkt der Anfrage. Vom Dienst gerechnet. */
  readonly elapsedSeconds: number;
}

/**
 * Zwei Ausgänge. `confirmation_required` ist **kein** Fehler, sondern der
 * vorgesehene erste Schritt (A-6.8, T-021 Annahme 9).
 */
export type StartTimerResult =
  | {
      readonly kind: "started";
      readonly started: RunningTimeEntry;
      readonly stopped: TimeEntry | null;
      /** A-2.5: war das Todo erledigt und ist durch den Start wieder aktiv? */
      readonly doneCleared: boolean;
      /**
       * Wie dieser Start das Todo durch die Pools bewegt — oder `null` (E-058).
       *
       * `doneCleared` sagt, **was** geschehen ist; dieses Feld sagt, **wo** es
       * sichtbar wird. Der Dienst rechnet es in genau zwei Fällen: Der Start
       * hat „Erledigt" aufgehoben, oder die erste abgeschlossene Buchung ist
       * entstanden. Sonst `null` — und `null` heißt „hier war keine Bewegung
       * möglich", nicht „es hat sich nichts geändert".
       *
       * Die Oberfläche zählt die Namen **nicht** selbst auf. Den Satz bildet
       * `poolMovementSentence` in `@takt/domain`, und zwar denselben, den der
       * Aufgabenbereich des Add-ins zeigt. Vorgeschichte:
       * `docs/decisions/timer.md`.
       *
       * **Nicht mehr nur an dieser Antwort** (berichtigt in T-097). Seit T-093
       * liefern `POST /timer/stop` und `POST /timer/orphaned/resolve` dasselbe
       * Feld, mit festem Anlaß `'booking'` (E-058 Punkt 6) — siehe
       * `StopTimerResult` weiter unten. Der Satz, den der Start hier bildet,
       * und der Satz nach dem Stopp kommen aus derselben Funktion.
       */
      readonly poolMovement: PoolMovement | null;
    }
  | {
      readonly kind: "confirmation_required";
      readonly running: RunningTimeEntry;
      readonly runningTodoTitle: ForeignText;
    };

/**
 * Der Ausgang eines Stopps — und was die Buchung bewegt hat (E-058 Punkt 6).
 *
 * `POST /timer/stop`. Bis T-102 beantwortete dieser Typ auch
 * `POST /timer/orphaned/resolve`; seit O-R unterscheiden sich die beiden in der
 * Angabe, **warum** nichts gebucht wurde, und stehen deshalb getrennt (siehe
 * {@link ResolveOrphanedTimerResult}). Der gebuchte Zweig ist derselbe
 * geblieben und steht einmal.
 *
 * Beide tragen `poolMovement` **in beiden Zweigen**, und der Anlaß ist stets
 * `'booking'`. Ein Stopp hebt kein „Erledigt" auf — das tut allein der Start
 * (A-2.5) —, also gibt es hier keinen Fall `'reopen'`.
 *
 * **Warum das Feld auch im verworfenen Zweig steht.** Ein Stopp unter der
 * Mindestdauer erzeugt keine Buchung (A-6.2) und bewegt deshalb nichts; der
 * Dienst antwortet dort mit festem `null` (`usecases/timer.ts`,
 * `stopTimer`/`resolveOrphanedTimer`), ohne eine einzige Regel aufzulösen. Das
 * Feld fehlt trotzdem nicht: Ein Feld, das je nach `kind` da ist oder nicht,
 * zwingt jede Aufrufstelle zu einer Fallunterscheidung, bevor sie die
 * eigentliche treffen kann. Der Typ `null` — und nicht `PoolMovement | null` —
 * sagt dem Übersetzer, daß dieser Zweig nichts zu erzählen hat.
 *
 * **`null` heißt: keine Fläche.** `poolMovementSentence(movement, 'past',
 * 'booking')` gibt für eine Bewegung ohne Zu- und Abgang ebenfalls `null`
 * zurück; die Aufrufstelle läßt die Zeile dann **ganz** weg statt sie mit
 * `?? ""` zu füllen (`TimerContext.performStop`).
 */
export type StopTimerResult =
  | RecordedStop
  | {
      readonly kind: "discarded";
      /**
       * Der einzige Grund, aus dem **dieser** Aufruf nichts bucht (A-6.2).
       *
       * `POST /timer/stop` kennt kein Verwerfen auf Wunsch: Wer stoppt, will
       * buchen. Die zweite Route unten kennt beides — siehe
       * {@link ResolveOrphanedTimerResult}.
       */
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

/**
 * Der Ausgang von `POST /timer/orphaned/resolve` (E-036, O-R).
 *
 * **Ein eigener Typ und nicht mehr `StopTimerResult`** (T-102, Befund 2 aus
 * R-1a). Die verworfene Hälfte unterscheidet sich, und zwar in der einen
 * Angabe, die der Benutzer zu lesen bekommt:
 *
 *  - `'orphan_discarded'` — **er hat verworfen.** Die Antwort auf die Frage aus
 *    E-036 lautete „Verwerfen"; es wurde nichts gebucht, weil er es so wollte.
 *  - `'timer_too_short'` — **es gab nichts zu buchen.** Er hat „bis zum letzten
 *    Lebenszeichen" gewählt, und zwischen Start und Lebenszeichen liegt weniger
 *    als eine Sekunde (A-6.2) — oder es gibt gar kein Lebenszeichen.
 *
 * Welchen Satz die Oberfläche je Grund zeigt, steht in
 * `TimerContext.confirmOrphan`. Vorgeschichte: `docs/decisions/timer.md`.
 *
 * `poolMovement` ist in beiden verworfenen Fällen fest `null` — es entsteht
 * keine Buchung, und der Dienst löst dafür nicht einmal eine Regel auf.
 */
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

/* ==================================================================== */
/* A-24 — die Inaktivität                                               */
/* ==================================================================== */

export interface IdleSession {
  readonly id: Id;
  readonly todoId: Id;
  readonly todoTitle: ForeignText;
  readonly note: ForeignText;
  readonly startedAt: Timestamp;
  readonly returnedAt: Timestamp | null;
}
export interface IdleAllocation { readonly todoId: Id | null; readonly seconds: number; readonly note: ForeignText }
export interface IdleResolution { readonly recordedSeconds: number; readonly breakSeconds: number; readonly resumed: boolean; readonly alreadyResolved: boolean }

/* ==================================================================== */
/* Die Routen                                                           */
/* ==================================================================== */

export function getRunningTimer(): Promise<RunningTimerView | null> {
  return request<RunningTimerView | null>("/timer");
}

/**
 * A-6.2, A-6.8, A-2.5.
 *
 * Läuft schon ein Timer und `stopRunning` ist nicht gesetzt, antwortet der
 * Dienst mit `200` und `kind: "confirmation_required"` — kein Fehler, sondern
 * der erste Schritt eines zweistufigen Vorgangs.
 */
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

/**
 * E-036 — die Antwort des Benutzers auf die verwaiste Buchung.
 *
 * Eigener Rückgabetyp seit T-102 (O-R): Der verworfene Zweig nennt hier den
 * **Grund**, und die beiden Gründe sind verschiedene Auskünfte — „Sie haben
 * verworfen" gegen „es gab nichts zu buchen". Siehe
 * {@link ResolveOrphanedTimerResult}.
 */
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
