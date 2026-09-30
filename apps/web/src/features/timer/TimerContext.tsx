import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { errorCode, errorMessage, isServiceError } from "../../api/client";
import {
  getOrphanedTimer,
  getRunningTimer,
  resolveOrphanedTimer,
  startTimer,
  stopTimer,
  touchTimerHeartbeat,
  type OrphanedTimerView,
  type RunningTimerView,
} from "./api";
import type { ForeignText, Id } from "../../api/types";
import { getTodo } from "../todos/api";
import { FormDialog, TextField } from "../../shared/ui/FormDialog";
import { NoteField } from "../../shared/ui/NoteField";
import {
  calendarDayOf,
  formatDateTime,
  formatDuration,
  formatStopwatch,
  fromLocalInputValue,
  toLocalInputValue,
} from "../../lib/format";
import {
  bookingEndProblem,
  exceedsBookingLimit,
  latestBookingEnd,
  secondsToBook,
} from "../../lib/bookingEnd";
import { labels } from "../../lib/labels";
import { ServiceText } from "../../shared/ui/ServiceText";
import { timerTexts } from "./texts";
import { bookingSentence, withMovement } from "../../lib/movement";
import { loadDayGroupInsight } from "../../app/dayGroup";
import { useRefresh } from "../../app/RefreshContext";
import { useToasts } from "../../app/ToastContext";
import { quotedName } from "../../lib/foreign";
import { usePreferences } from "../settings/PreferencesContext";
import { useIdleTimer } from "./useIdleTimer";
import { IdleRecovery } from "./IdleRecovery";
import { stopMessage } from "./stopMessage";
import { useReactivation } from "./useReactivation";
import { Button } from "../../shared/ui/Primitives";
import { Icon } from "../../shared/ui/Icon";

/**
 * Takt — der Timer, überall erreichbar (A-13.4, I-04, I-05).
 *
 * Der Timer ist global, weil er global ist: Er läuft weiter, während der
 * Benutzer die Ansicht wechselt, und es gibt höchstens einen (A-6.8). Ihn je
 * Ansicht zu halten hieße, dieselbe Wahrheit mehrfach zu führen.
 *
 * Hier liegen auch die drei Dialoge, die zum Timer gehören — Stoppen mit
 * Leistung, die Rückfrage nach A-6.8 und die verwaiste Buchung nach E-036.
 * Sie gehören dorthin, wo der Timer ist, und nicht in die Ansicht, aus der sie
 * gerade angestoßen wurden: Sonst verschwindet der Dialog beim
 * Ansichtswechsel, und die Leistung mit ihm.
 *
 * ## Zwei Stellen, an denen die Umsetzung des Dienstes von seiner
 * ## Beschreibung abweicht — und was daraus folgt
 *
 * 1. **`POST /timer/start` nimmt kein `noteForRunning` entgegen.** Die
 *    Beschreibung nennt das Feld, `startSchema` in `routes/time.ts` kennt es
 *    nicht. Mit `stopRunning: true` würde der laufende Timer also **ohne
 *    Leistung** beendet — und eine Tagesgruppe ohne Leistung geht nach E-034
 *    gar nicht erst in den Export. Deshalb läuft die Rückfrage aus A-6.8 hier
 *    in zwei Schritten: erst `POST /timer/stop` **mit** der Leistung, dann
 *    `POST /timer/start`. Der Preis ist die verlorene Unteilbarkeit; der
 *    Gegenwert ist, dass keine abrechenbare Zeit stillschweigend unbrauchbar
 *    wird. Sobald der Dienst das Feld annimmt, wird daraus wieder ein Aufruf.
 * 2. **`elapsedSeconds` kommt vom Dienst.** Die Oberfläche zählt zwischen zwei
 *    Antworten nur weiter; sie rechnet die Dauer nicht aus zwei Wanduhrzeiten
 *    aus. Gebucht wird ohnehin, was der Dienst misst.
 */

export interface TimerApi {
  readonly running: RunningTimerView | null;
  /** Sekunden seit dem Start, fortgezählt. Nur für die Anzeige. */
  readonly elapsedSeconds: number;
  readonly loading: boolean;
  /** Läuft der Timer auf genau diesem Todo? */
  readonly isRunningFor: (todoId: Id) => boolean;
  /** I-04 — startet den Timer. Kümmert sich um A-6.8 und A-2.5 selbst. */
  readonly start: (todoId: Id, todoTitle: ForeignText) => void;
  /** A-22.1 — fragt je nach Einstellung nach der Leistung oder stoppt direkt. */
  readonly requestStop: () => void;
  /** Startet oder stoppt, je nachdem was gerade gilt. */
  readonly toggle: (todoId: Id, todoTitle: ForeignText) => void;
  readonly refresh: () => void;
  readonly orphan: OrphanedTimerView | null;
  /**
   * Todos, deren „Erledigt“ die Anwendung selbst aufgehoben hat (A-2.5).
   *
   * Der Zustand „Erledigt aufgehoben“ steht in keiner Tabelle — im Datenmodell
   * gibt es nur gesetzt oder nicht gesetzt. Er ist trotzdem nötig: Ohne ihn
   * sähe die Karte hinterher aus, als wäre sie nie erledigt gewesen, und der
   * Wechsel bliebe unerklärt (T-005n, Abschnitt 1). Er gilt für diese Sitzung
   * und endet, sobald der Benutzer das Kennzeichen selbst anfasst.
   */
  readonly reactivated: ReadonlySet<Id>;
  readonly clearReactivated: (todoId: Id) => void;
}

const TimerContext = createContext<TimerApi | null>(null);

export function shouldAskForStopNote(promptOnTimerStop: boolean, noEvidence: boolean): boolean {
  return promptOnTimerStop && !noEvidence;
}

/** A failure shown in one of the timer dialogs, with its origin for `lang` (A-28.2). */
interface DialogFailure {
  readonly message: string;
  readonly fromService: boolean;
}

function dialogFailure(cause: unknown): DialogFailure {
  return { message: errorMessage(cause), fromService: isServiceError(cause) };
}

/**
 * The service refuses a plain stop after more than 24 hours (A-28.6). The UI then asks for the
 * end instead of showing a dead-end error (welle-18-fluss.md 4.1, clock drift included).
 */
function needsNamedEnd(cause: unknown): boolean {
  const code = errorCode(cause);
  return code === "timer_stop_end_required" || code === "time_entry_too_long";
}

/** The end question of a long stop, prefilled with start + 24 h (A-28.6). */
interface EndQuestion {
  readonly startedAt: string;
  /** Value of the `datetime-local` field. */
  readonly value: string;
  /** A submit was attempted; only then does the field show its message (SC 3.3.1). */
  readonly attempted: boolean;
}

function endQuestionFor(startedAt: string): EndQuestion {
  return { startedAt, value: toLocalInputValue(latestBookingEnd(startedAt)), attempted: false };
}

/** The named end, or `null` while the field is not valid. */
function endOf(question: EndQuestion): string | null {
  const end = fromLocalInputValue(question.value);
  return bookingEndProblem(question.startedAt, end, true) === null ? end : null;
}

function LongStopFields({
  question,
  label,
  onChange,
}: {
  readonly question: EndQuestion;
  readonly label: string;
  readonly onChange: (value: string) => void;
}) {
  const text = timerTexts();
  const end = fromLocalInputValue(question.value);
  const problem = bookingEndProblem(question.startedAt, end, true);
  const seconds = secondsToBook(question.startedAt, end);
  return (
    <>
      <p className="dialog__consequence dialog__consequence--warning">
        <Icon name="alert-triangle" size={14} />
        <span>{text.longStopLead}</span>
      </p>
      <TextField
        label={label}
        type="datetime-local"
        value={question.value}
        onChange={onChange}
        required
        hint={text.longStopHint(formatDateTime(question.startedAt))}
        {...(question.attempted && problem !== null ? { error: labels().bookingEndProblem[problem] } : {})}
      />
      {/* Recomputed on change; not a live region (welle-18-fluss.md 4.2). */}
      <p className="dialog__hint tabular">
        {seconds === null ? null : text.longStopReadout(formatDuration(seconds))}
      </p>
    </>
  );
}

export function useTimer(): TimerApi {
  const api = useContext(TimerContext);
  if (api === null) {
    throw new Error("useTimer is only available inside TimerProvider.");
  }
  return api;
}

const HEARTBEAT_MS = 45_000;
const POLL_MS = 60_000;

interface Anchor {
  readonly atMs: number;
  readonly seconds: number;
}

interface StartConflict {
  readonly todoId: Id;
  readonly todoTitle: ForeignText;
  readonly runningTitle: ForeignText;
}

export function TimerProvider({ children }: { readonly children: ReactNode }) {
  const toasts = useToasts();
  const { bump } = useRefresh();
  const { promptOnTimerStop, idleDetectionEnabled, idleThresholdMinutes } = usePreferences();
  const directStopPending = useRef(false);

  const [running, setRunning] = useState<RunningTimerView | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [orphan, setOrphan] = useState<OrphanedTimerView | null>(null);

  const [stopOpen, setStopOpen] = useState(false);
  const [stopNote, setStopNote] = useState("");
  /** `null`: a normal stop. Otherwise the timer ran for more than 24 hours (A-28.6). */
  const [stopEnd, setStopEnd] = useState<EndQuestion | null>(null);
  /** With the Leistung prompt off, the long-stop dialog asks only for the end (A-22). */
  const [stopAsksNote, setStopAsksNote] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<DialogFailure | null>(null);

  const [conflict, setConflict] = useState<StartConflict | null>(null);
  const [conflictNote, setConflictNote] = useState("");
  const [conflictEnd, setConflictEnd] = useState<EndQuestion | null>(null);

  const [orphanChoice, setOrphanChoice] = useState<"book_until_heartbeat" | "discard">(
    "book_until_heartbeat",
  );

  const runningRef = useRef<RunningTimerView | null>(null);
  runningRef.current = running;
  const elapsedRef = useRef(0);

  /* Laden und Fortzählen                                              */

  const refresh = useCallback(() => {
    void getRunningTimer()
      .then((view) => {
        setRunning(view);
        setAnchor(view === null ? null : { atMs: Date.now(), seconds: view.elapsedSeconds });
      })
      .catch(() => {
        /* Der Verbindungsfehler wird an der Hülle sichtbar, nicht hier. */
      })
      .finally(() => setLoading(false));
  }, []);

  /*
    A-2.5, I-05 — die wiedereröffneten Todos und der Satz, der den Start
    ansagt. Eigene Datei, weil es eine eigene Sache ist (`useReactivation.ts`).
  */
  const { reactivated, clearReactivated, announceStart } = useReactivation(refresh);

  const idleChanged = useCallback(() => { refresh(); bump(); }, [refresh, bump]);
  const idle = useIdleTimer({ running, enabled: idleDetectionEnabled, thresholdMinutes: idleThresholdMinutes,
    blocked: busy || stopOpen || conflict !== null || orphan !== null, changed: idleChanged });
  const pausedForIdle = idle.session !== null;
  const actionPending = useRef(false);
  const guardIdle = useCallback((action: () => void) => {
    if (actionPending.current || busy || stopOpen || conflict !== null || orphan !== null) return;
    actionPending.current = true;
    void idle.check().then(pending => { if (pending === null) action(); })
      .catch((cause: unknown) => toasts.failure(timerTexts().checkFailed, errorMessage(cause), isServiceError(cause)))
      .finally(() => { actionPending.current = false; });
  }, [idle.check, busy, stopOpen, conflict, orphan, toasts]);

  useEffect(() => {
    refresh();
    void getOrphanedTimer()
      .then(setOrphan)
      .catch(() => setOrphan(null));
  }, [refresh]);

  useEffect(() => {
    if (running === null || pausedForIdle) return;
    const handle = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(handle);
  }, [running, pausedForIdle]);

  /** E-036 — Lebenszeichen. Deckelt den Schaden eines Absturzes auf ein Intervall. */
  useEffect(() => {
    if (running === null || pausedForIdle) return;
    const handle = window.setInterval(() => {
      void touchTimerHeartbeat().catch(() => undefined);
    }, HEARTBEAT_MS);
    return () => window.clearInterval(handle);
  }, [running, pausedForIdle]);

  /** Ein Timer kann auch anderswo entstehen. Selten nachfragen genügt. */
  useEffect(() => {
    const handle = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(handle);
  }, [refresh]);

  const elapsedSeconds = useMemo(() => {
    if (anchor === null) return 0;
    void tick;
    return anchor.seconds + Math.max(0, Math.floor((Date.now() - anchor.atMs) / 1000));
  }, [anchor, tick]);
  elapsedRef.current = elapsedSeconds;

  /* Stoppen                                                           */

  /**
   * Was der Stopp gebucht hat — und wohin die Buchung das Todo bewegt hat
   * (E-058 Punkt 6, T-097).
   *
   * Diese Funktion holt die eine Auskunft, auf die sie wartet, und zeigt das
   * Ergebnis. **Welcher** von fünf Rümpfen gilt und warum der Bewegungssatz an
   * genau einer Stelle angehängt wird, steht in `stopMessage.ts` — dieselbe
   * Frage, ohne React und ohne Meldungsstapel.
   */
  const reportStopped = useCallback(
    async (
      todoId: Id,
      todoTitle: ForeignText,
      startedAt: string,
      durationSeconds: number,
      movementSentence: string | null,
    ) => {
      const insight = await loadDayGroupInsight(todoId, calendarDayOf(startedAt));
      toasts.show(stopMessage(insight, todoTitle, durationSeconds, movementSentence));
    },
    [toasts],
  );

  const performStop = useCallback(
    async (note: ForeignText, endedAt?: string): Promise<boolean> => {
      const current = runningRef.current;
      if (current === null) return false;
      const result = await stopTimer(note, endedAt);
      runningRef.current = null;
      setRunning(null);
      setAnchor(null);
      refresh();
      bump();

      if (result.kind === "discarded") {
        /*
          Kein Bewegungssatz, und zwar nicht aus Nachlässigkeit: Ohne Buchung
          bewegt sich nichts, `poolMovement` ist in diesem Zweig fest `null`
          (`usecases/timer.ts`, `stopTimer`), und der Typ sagt es hier ebenso.
          Es gibt nichts wegzulassen.
        */
        toasts.show({
          tone: "info",
          title: timerTexts().nothingBooked,
          body: timerTexts().underOneSecond(quotedName(current.todoTitle)),
        });
        return true;
      }

      await reportStopped(
        current.entry.todoId,
        current.todoTitle,
        result.entry.startedAt,
        result.entry.durationSeconds,
        bookingSentence(result.poolMovement),
      );
      return true;
    },
    [bump, refresh, reportStopped, toasts],
  );

  const openStopDialog = useCallback((current: RunningTimerView, askEnd: boolean, askForNote = promptOnTimerStop) => {
    setStopNote(current.entry.note);
    setStopEnd(askEnd ? endQuestionFor(current.entry.startedAt) : null);
    setStopAsksNote(askForNote);
    setDialogError(null);
    setStopOpen(true);
  }, [promptOnTimerStop]);

  const requestStop = useCallback(() => {
    const current = runningRef.current;
    if (current === null || directStopPending.current || busy || stopOpen || conflict !== null) return;
    const askEnd = exceedsBookingLimit(elapsedRef.current);
    setBusy(true);
    void getTodo(current.entry.todoId)
      .then(({ todo }) => {
        const askForNote = shouldAskForStopNote(promptOnTimerStop, todo.noEvidence ?? false);
        if (askForNote || askEnd) {
          setBusy(false);
          openStopDialog(current, askEnd, askForNote);
          return;
        }
        directStopPending.current = true;
        return performStop(current.entry.note)
          .catch((cause: unknown) => {
            if (needsNamedEnd(cause)) {
              openStopDialog(current, true, false);
              return;
            }
            toasts.failure(timerTexts().stopFailed, errorMessage(cause), isServiceError(cause));
            refresh();
          })
          .finally(() => {
            directStopPending.current = false;
            setBusy(false);
          });
      })
      .catch((cause: unknown) => {
        setBusy(false);
        toasts.failure(timerTexts().stopFailed, errorMessage(cause), isServiceError(cause));
      });
  }, [busy, conflict, openStopDialog, performStop, promptOnTimerStop, refresh, stopOpen, toasts]);

  const confirmStop = useCallback(() => {
    const current = runningRef.current;
    let endedAt: string | undefined;
    if (stopEnd !== null) {
      setStopEnd({ ...stopEnd, attempted: true });
      const end = endOf(stopEnd);
      if (end === null) return;
      endedAt = end;
    }
    setBusy(true);
    setDialogError(null);
    void performStop(stopAsksNote ? stopNote : current?.entry.note ?? "", endedAt)
      .then((done) => {
        if (done) setStopOpen(false);
      })
      .catch((cause: unknown) => {
        // A plain stop the service refuses as too long turns into the end question.
        if (stopEnd === null && current !== null && needsNamedEnd(cause)) {
          setStopEnd(endQuestionFor(current.entry.startedAt));
          return;
        }
        setDialogError(dialogFailure(cause));
      })
      .finally(() => setBusy(false));
  }, [performStop, stopAsksNote, stopEnd, stopNote]);

  /* A-6.8 — die Rückfrage                                             */

  /**
   * A-6.8 — erst stoppen, dann starten.
   *
   * ## Zwei Buchungsereignisse, zwei Meldungen — und das bleibt so (T-097)
   *
   * Der Wechsel löst nacheinander zwei Vorgänge aus, und seit T-097 kann
   * **jeder** von beiden einen Bewegungssatz tragen: der Stopp den über die
   * Buchung auf dem alten Todo, der Start den über das Wiederöffnen oder die
   * erste Buchung auf dem neuen. Beide Sätze sind wahr, und sie handeln von
   * **verschiedenen** Todos.
   *
   * Nachgesehen, wie sich das überlagert (`ToastContext`): Meldungen stapeln
   * sich, es sind höchstens vier gleichzeitig, jede ohne Rückweg verschwindet
   * nach acht Sekunden. Der Stapel zeigt also beide untereinander, in der
   * Reihenfolge, in der die Vorgänge gelaufen sind, und **beide Titel nennen
   * ihr Todo**: „Zeit gebucht auf „A“." gegen „Timer gestartet. …" mit „B" im
   * Rumpf.
   *
   * **Entscheidung: beide bleiben stehen.** Einen davon zu unterdrücken hieße,
   * eine wahre Auskunft über ein Todo zu verschweigen, weil zufällig ein
   * zweites im Spiel ist — und die unterdrückte wäre die über das Todo, das
   * der Benutzer gerade verläßt und danach nicht mehr ansieht. Genau dort ist
   * eine unerklärte Bewegung am teuersten (E-056).
   *
   * Der Befund, der bis T-097 daran hing, ist mit T-102 behoben (W-5 aus
   * R-2a): Beide Bewegungssätze beginnen mit „Es" und nennen das Todo nicht —
   * sie kommen zeichengleich aus `@takt/domain`, an ihnen ist nichts zu
   * ändern. Der Bezug steht deshalb im **Rahmen**, im Titel der Meldung, und
   * damit hat jedes „Es" wieder eines, worauf es zeigt.
   *
   * ## Warum der Dialog zwischen den beiden Schritten schließt (B-1 aus T-116)
   *
   * Bis T-118 stand `setConflict(null)` **hinter** dem Start. Zwischen der
   * Stopp-Meldung und dem Schließen des Dialogs lag damit ein **Netzumlauf**,
   * und seit T-110 tritt der Meldungsstapel hinter die Abdunklung, solange ein
   * Dialog steht (`body:has(.scrim) .toast-layer`). Die Meldung „Zeit gebucht
   * auf „X“." entstand also abgedunkelt, mit `pointer-events: none`, außerhalb
   * des `aria-modal="true"` — und ihre Achtsekundenfrist lief dabei. Sie ist
   * die **einzige** Bestätigung dafür, daß die Zeit des verdrängten Timers
   * gebucht wurde; A-6.8 macht das Verdrängen zu einer Handlung, die der
   * Benutzer ausdrücklich bestätigt, also schuldet sie ihm eine Auskunft, die
   * er auch lesen kann.
   *
   * Jetzt liegt das Schließen im selben Zustandsschritt wie die Meldung: Nach
   * `await performStop(...)` folgt `setConflict(null)` ohne dazwischenliegenden
   * Netzumlauf, beide Zustandsänderungen fallen in dieselbe Zeichnung. Damit
   * ist diese Stelle so geordnet wie alle übrigen Aufrufstellen (geprüft in
   * T-116, Abschnitt 3.1).
   *
   * ## Der Preis, und warum er der richtige ist
   *
   * Ein Start, der **danach** scheitert, kann seinen Fehler nicht mehr im
   * Dialog zeigen — den gibt es dann nicht mehr. Er geht in eine Meldung, und
   * die sagt zuerst, was gilt: **Gebucht ist gebucht.** Der Stopp *ist*
   * geschehen, und ihn hinter einer Fehlerzeile im Dialog verschwinden zu
   * lassen, wäre die unehrlichere Auskunft.
   *
   * Der Fehler des **Stopps** bleibt dagegen im Dialog: Bis dahin hat sich
   * nichts geändert, kein Timer ist beendet, und der Dialog ist die Stelle, an
   * der der Benutzer eben „Wechseln" gedrückt hat.
   */
  const performSwitch = useCallback(async (pending: StartConflict, note: ForeignText, showDialog: boolean, endedAt?: string) => {
    setBusy(true);
    setDialogError(null);
    /* Schritt 1 — der Stopp. Sein Fehler gehört noch in den Dialog. */
    try {
      await performStop(note, endedAt);
    } catch (cause) {
      const startedAt = runningRef.current?.entry.startedAt;
      if (endedAt === undefined && startedAt !== undefined && needsNamedEnd(cause)) {
        // The running timer is older than 24 hours: ask for its end, start nothing yet (4.3).
        setConflictNote(note);
        setConflictEnd(endQuestionFor(startedAt));
        setConflict(pending);
      } else if (showDialog) setDialogError(dialogFailure(cause));
      else toasts.failure(timerTexts().stopFailed, errorMessage(cause), isServiceError(cause));
      refresh();
      setBusy(false);
      return;
    }

    /*
      Schritt 2 — schließen, im selben Zustandsschritt wie die Meldung aus
      `performStop`. Zwischen beiden liegt kein `await`, also keine
      Zeichnung, in der die Meldung hinter der Abdunklung stünde.
    */
    setConflict(null);
    setBusy(false);

    /* Schritt 3 — der Start. Ab hier meldet nur noch der Stapel. */
    const failed = (detail: string) => {
      toasts.failure(
        timerTexts().switchStartFailed(quotedName(pending.todoTitle)),
        timerTexts().switchStartFailedBody(detail),
      );
    };
    try {
      const result = await startTimer(pending.todoId, false);
      if (result.kind === "confirmation_required") {
        failed(timerTexts().stillRunning);
        return;
      }
      announceStart(
        pending.todoId,
        pending.todoTitle,
        result.doneCleared,
        result.poolMovement,
      );
    } catch (cause) {
      failed(errorMessage(cause));
    }
  }, [announceStart, performStop, refresh, toasts]);

  const confirmSwitch = useCallback(() => {
    if (conflict === null || directStopPending.current) return;
    let endedAt: string | undefined;
    if (conflictEnd !== null) {
      setConflictEnd({ ...conflictEnd, attempted: true });
      const end = endOf(conflictEnd);
      if (end === null) return;
      endedAt = end;
    }
    directStopPending.current = true;
    void performSwitch(conflict, conflictNote, true, endedAt).finally(() => {
      directStopPending.current = false;
    });
  }, [conflict, conflictEnd, conflictNote, performSwitch]);

  /* Starten                                                           */

  const start = useCallback(
    (todoId: Id, todoTitle: ForeignText) => {
      if (directStopPending.current || runningRef.current?.entry.todoId === todoId) return;
      directStopPending.current = true;
      void (async () => {
        try {
          const result = await startTimer(todoId, false);
          if (result.kind === "confirmation_required") {
            const pending = { todoId, todoTitle, runningTitle: result.runningTodoTitle };
            // The running timer is older than 24 hours: the dialog opens even with the prompt off (4.3).
            const askEnd = exceedsBookingLimit(elapsedRef.current);
            if (promptOnTimerStop || askEnd) {
              setDialogError(null);
              setConflictNote(result.running.note);
              setConflictEnd(askEnd ? endQuestionFor(result.running.startedAt) : null);
              setConflict(pending);
            } else {
              await performSwitch(pending, result.running.note, false);
            }
            return;
          }
          announceStart(todoId, todoTitle, result.doneCleared, result.poolMovement);
        } catch (cause) {
          toasts.failure(timerTexts().startFailed, errorMessage(cause), isServiceError(cause));
        } finally {
          directStopPending.current = false;
        }
      })();
    },
    [announceStart, performSwitch, promptOnTimerStop, toasts],
  );

  const toggle = useCallback(
    (todoId: Id, todoTitle: ForeignText) => {
      if (runningRef.current?.entry.todoId === todoId) requestStop();
      else start(todoId, todoTitle);
    },
    [requestStop, start],
  );

  /* E-036 — die verwaiste Buchung                                     */

  const confirmOrphan = useCallback(() => {
    /*
      Der Name wird **vor** dem Auflösen festgehalten: `setOrphan(null)` steht
      in derselben Kette, und ohne diese Zeile stünde in der Meldung danach
      kein Todo mehr (W-5).
    */
    const pending = orphan;
    if (pending === null) return;
    setBusy(true);
    setDialogError(null);
    void resolveOrphanedTimer(orphanChoice)
      .then((result) => {
        setOrphan(null);
        bump();
        if (result.kind === "recorded") {
          /*
            Dieselbe Auskunft wie nach jedem anderen Stopp (E-058 Punkt 6): Die
            verwaiste Buchung ist eine Buchung, und wenn sie die erste ist,
            nimmt jede Spalte „noch nicht abgerechnet" das Todo damit auf. Der
            Weg hierher ist ein anderer, die Folge ist dieselbe — also auch der
            Satz, und aus derselben Funktion.

            Das Todo steht im Titel und nicht im Satz (W-5): Zwischen dem
            Ereignis und dieser Meldung liegt ein Programmabsturz, und wer
            danach „Es steht jetzt in „Ost“." liest, hat keinen Bezug für das
            „Es".
          */
          toasts.success(
            timerTexts().orphanBooked(quotedName(pending.todoTitle)),
            withMovement(
              timerTexts().orphanBookedBody(formatDuration(result.entry.durationSeconds)),
              bookingSentence(result.poolMovement),
            ),
          );
          return;
        }

        /*
          Verworfen heißt: keine Buchung, keine Bewegung, kein Satz — der
          Dienst löst hier nicht einmal eine Regel auf. **Warum** nichts
          gebucht wurde, sind aber zwei verschiedene Auskünfte (O-R, T-102):

           - `'orphan_discarded'`: Der Benutzer hat „Verwerfen" gewählt. Die
             Meldung bestätigt seine Entscheidung.
           - `'timer_too_short'`: Er hat „bis zum letzten Lebenszeichen"
             gewählt, und dort war nichts zu holen — kein Lebenszeichen oder
             weniger als eine Sekunde bis dahin (A-6.2). Das ist keine
             Bestätigung, sondern eine Auskunft über einen Fall, den er nicht
             gewählt hat, und der Dialog hat ihn angekündigt („Gibt es kein
             Lebenszeichen, gibt es nichts zu buchen").

          Vorgeschichte: `docs/decisions/timer.md`.
        */
        toasts.show(
          result.reason === "orphan_discarded"
            ? {
                tone: "info",
                title: timerTexts().orphanDiscarded,
                body: timerTexts().orphanDiscardedBody(quotedName(pending.todoTitle)),
              }
            : {
                tone: "info",
                title: timerTexts().orphanNothing,
                body: timerTexts().orphanNothingBody(quotedName(pending.todoTitle)),
              },
        );
      })
      .catch((cause: unknown) => setDialogError(dialogFailure(cause)))
      .finally(() => setBusy(false));
  }, [bump, orphan, orphanChoice, toasts]);

  const isRunningFor = useCallback(
    (todoId: Id) => !pausedForIdle && runningRef.current?.entry.todoId === todoId,
    [pausedForIdle],
  );
  const visibleRunning = pausedForIdle ? null : running;

  const api = useMemo<TimerApi>(
    () => ({
      running: visibleRunning,
      elapsedSeconds: pausedForIdle ? 0 : elapsedSeconds,
      loading,
      isRunningFor,
      start: (id, title) => guardIdle(() => start(id, title)),
      requestStop: () => guardIdle(requestStop),
      toggle: (id, title) => guardIdle(() => toggle(id, title)),
      refresh,
      orphan,
      reactivated,
      clearReactivated,
    }),
    [
      visibleRunning,
      pausedForIdle,
      elapsedSeconds,
      loading,
      isRunningFor,
      start,
      requestStop,
      toggle,
      refresh,
      orphan,
      reactivated,
      clearReactivated,
      guardIdle,
    ],
  );

  const text = timerTexts();

  return (
    <TimerContext.Provider value={api}>
      {children}
      {idle.session === null ? null : <IdleRecovery key={idle.session.previousPeriods?.[0]?.id ?? idle.session.id} session={idle.session} changed={idle.refresh} running={false} resumeAfter />}
      <div role="alert">{idle.error === null ? null : <aside className="idle-reminder">{text.idleCheckFailed}<ServiceText text={idle.error} fromService={idle.errorFromService} /><Button onClick={idle.refresh}>{text.checkAgain}</Button></aside>}</div>

      <FormDialog
        open={stopOpen}
        title={text.stopTitle}
        description={
          running === null
            ? undefined
            : text.runningFor(formatStopwatch(elapsedSeconds), quotedName(running.todoTitle))
        }
        submitLabel={text.stopAndBook}
        cancelLabel={text.keepRunning}
        busy={busy}
        error={dialogError?.message ?? null}
        errorFromService={dialogError?.fromService ?? false}
        onSubmit={confirmStop}
        // Cancel books nothing; the timer keeps running (A-28.6, AK-4.3).
        onCancel={() => setStopOpen(false)}
      >
        {/* The end comes first and takes the initial focus: it is the question (4.2). */}
        {stopEnd === null ? null : (
          <LongStopFields
            question={stopEnd}
            label={text.longStopEnd}
            onChange={(value) => setStopEnd({ ...stopEnd, value })}
          />
        )}
        {stopAsksNote ? (
          <>
            <NoteField
              scope="billing"
              value={stopNote}
              onChange={setStopNote}
              rows={3}
              maxLength={8192}
              placeholder={text.notePlaceholder}
            />
            {/*
              Derselbe Satz steht seit T-118 auch im Dialog „Zeit von Hand
              erfassen" (B-4). Er kommt aus `lib/labels.ts`, damit es ihn genau
              einmal gibt.
            */}
            <p className="dialog__hint">{labels().billingNoteMayBeEmpty}</p>
          </>
        ) : null}
      </FormDialog>

      <FormDialog
        open={conflict !== null}
        title={text.alreadyRunning}
        description={
          conflict === null
            ? undefined
            : text.switchLead(quotedName(conflict.runningTitle), quotedName(conflict.todoTitle))
        }
        submitLabel={text.stopAndSwitch}
        cancelLabel={labels().cancel}
        busy={busy}
        error={dialogError?.message ?? null}
        errorFromService={dialogError?.fromService ?? false}
        onSubmit={confirmSwitch}
        // Cancel: the old timer keeps running, the new one does not start, nothing is booked.
        onCancel={() => setConflict(null)}
      >
        {conflict === null || conflictEnd === null ? null : (
          <LongStopFields
            question={conflictEnd}
            label={text.longStopEndFor(quotedName(conflict.runningTitle))}
            onChange={(value) => setConflictEnd({ ...conflictEnd, value })}
          />
        )}
        {promptOnTimerStop ? (
          <NoteField
            scope="billing"
            value={conflictNote}
            onChange={setConflictNote}
            label={conflict === null ? text.note : text.noteFor(quotedName(conflict.runningTitle))}
            rows={3}
            maxLength={8192}
            placeholder={text.notePlaceholder}
          />
        ) : null}
      </FormDialog>

      <FormDialog
        open={orphan !== null}
        title={text.orphanTitle}
        description={orphan === null ? undefined : text.orphanLead(quotedName(orphan.todoTitle))}
        submitLabel={text.decide}
        cancelLabel={text.decideLater}
        busy={busy}
        error={dialogError?.message ?? null}
        errorFromService={dialogError?.fromService ?? false}
        onSubmit={confirmOrphan}
        onCancel={() => setOrphan(null)}
      >
        <fieldset className="choice">
          <legend className="field__label">{text.whatShouldHappen}</legend>
          <label className="choice__option">
            <input
              type="radio"
              name="orphan"
              value="book_until_heartbeat"
              checked={orphanChoice === "book_until_heartbeat"}
              onChange={() => setOrphanChoice("book_until_heartbeat")}
            />
            <span>
              <strong>{text.bookUntilHeartbeat}</strong>
              <span className="choice__hint">
                {orphan === null
                  ? ""
                  : text.bookUntilHeartbeatHint(formatDuration(orphan.bookableSeconds))}
              </span>
            </span>
          </label>
          <label className="choice__option">
            <input
              type="radio"
              name="orphan"
              value="discard"
              checked={orphanChoice === "discard"}
              onChange={() => setOrphanChoice("discard")}
            />
            <span>
              <strong>{text.discard}</strong>
              <span className="choice__hint">{text.discardHint}</span>
            </span>
          </label>
        </fieldset>
        <p className="dialog__hint">
          {text.noBookUntilNow}
        </p>
      </FormDialog>
    </TimerContext.Provider>
  );
}
