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
import { errorMessage } from "../../api/client";
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
import { FormDialog } from "../../shared/ui/FormDialog";
import { NoteField } from "../../shared/ui/NoteField";
import {
  calendarDayOf,
  formatDuration,
  formatStopwatch,
} from "../../lib/format";
import { BILLING_NOTE_MAY_BE_EMPTY } from "../../lib/labels";
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

export function useTimer(): TimerApi {
  const api = useContext(TimerContext);
  if (api === null) {
    throw new Error("useTimer steht nur innerhalb von TimerProvider zur Verfügung.");
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
  const { promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes } = usePreferences();
  const directStopPending = useRef(false);

  const [running, setRunning] = useState<RunningTimerView | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [orphan, setOrphan] = useState<OrphanedTimerView | null>(null);

  const [stopOpen, setStopOpen] = useState(false);
  const [stopNote, setStopNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [conflict, setConflict] = useState<StartConflict | null>(null);
  const [conflictNote, setConflictNote] = useState("");

  const [orphanChoice, setOrphanChoice] = useState<"book_until_heartbeat" | "discard">(
    "book_until_heartbeat",
  );

  const runningRef = useRef<RunningTimerView | null>(null);
  runningRef.current = running;

  /* ---------------------------------------------------------------- */
  /* Laden und Fortzählen                                              */
  /* ---------------------------------------------------------------- */

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
  const actionPending = useRef(false);
  const guardIdle = useCallback((action: () => void) => {
    if (actionPending.current || busy || stopOpen || conflict !== null || orphan !== null) return;
    actionPending.current = true;
    void idle.check().then(pending => { if (pending === null || pending.returnedAt !== null) action(); })
      .catch((cause: unknown) => toasts.failure("Timer konnte nicht geprüft werden", errorMessage(cause)))
      .finally(() => { actionPending.current = false; });
  }, [idle.check, busy, stopOpen, conflict, orphan, toasts]);

  useEffect(() => {
    refresh();
    void getOrphanedTimer()
      .then(setOrphan)
      .catch(() => setOrphan(null));
  }, [refresh]);

  useEffect(() => {
    if (running === null) return;
    const handle = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(handle);
  }, [running]);

  /** E-036 — Lebenszeichen. Deckelt den Schaden eines Absturzes auf ein Intervall. */
  useEffect(() => {
    if (running === null) return;
    const handle = window.setInterval(() => {
      void touchTimerHeartbeat().catch(() => undefined);
    }, HEARTBEAT_MS);
    return () => window.clearInterval(handle);
  }, [running]);

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

  /* ---------------------------------------------------------------- */
  /* Stoppen                                                           */
  /* ---------------------------------------------------------------- */

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
    async (note: ForeignText): Promise<boolean> => {
      const current = runningRef.current;
      if (current === null) return false;
      const result = await stopTimer(note);
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
          title: "Nichts gebucht.",
          body: `Der Timer auf ${quotedName(current.todoTitle)} lief weniger als eine Sekunde. Das ist ein Doppelklick auf „Start“, keine geleistete Arbeit.`,
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

  const requestStop = useCallback(() => {
    const current = runningRef.current;
    if (current === null || directStopPending.current || busy || stopOpen || conflict !== null) return;
    if (!promptOnTimerStop) {
      directStopPending.current = true;
      setBusy(true);
      void performStop(current.entry.note)
        .catch((cause: unknown) => {
          toasts.failure("Der Timer ließ sich nicht stoppen", errorMessage(cause));
          refresh();
        })
        .finally(() => {
          directStopPending.current = false;
          setBusy(false);
        });
      return;
    }
    setStopNote(current.entry.note);
    setDialogError(null);
    setStopOpen(true);
  }, [busy, conflict, performStop, promptOnTimerStop, refresh, stopOpen, toasts]);

  const confirmStop = useCallback(() => {
    setBusy(true);
    setDialogError(null);
    void performStop(stopNote)
      .then((done) => {
        if (done) setStopOpen(false);
      })
      .catch((cause: unknown) => setDialogError(errorMessage(cause)))
      .finally(() => setBusy(false));
  }, [performStop, stopNote]);

  /* ---------------------------------------------------------------- */
  /* A-6.8 — die Rückfrage                                             */
  /* ---------------------------------------------------------------- */

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
  const performSwitch = useCallback(async (pending: StartConflict, note: ForeignText, showDialog: boolean) => {
    setBusy(true);
    setDialogError(null);
    /* Schritt 1 — der Stopp. Sein Fehler gehört noch in den Dialog. */
    try {
      await performStop(note);
    } catch (cause) {
      if (showDialog) setDialogError(errorMessage(cause));
      else toasts.failure("Der Timer ließ sich nicht stoppen", errorMessage(cause));
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
        `Gebucht, aber der Timer auf ${quotedName(pending.todoTitle)} ließ sich nicht starten`,
        `Die Zeit des vorigen Timers ist gebucht — daran ändert das nichts. ${detail}`,
      );
    };
    try {
      const result = await startTimer(pending.todoId, false);
      if (result.kind === "confirmation_required") {
        failed("Es läuft weiterhin ein Timer. Bitte starten Sie erneut.");
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
    directStopPending.current = true;
    void performSwitch(conflict, conflictNote, true).finally(() => {
      directStopPending.current = false;
    });
  }, [conflict, conflictNote, performSwitch]);

  /* ---------------------------------------------------------------- */
  /* Starten                                                           */
  /* ---------------------------------------------------------------- */

  const start = useCallback(
    (todoId: Id, todoTitle: ForeignText) => {
      if (directStopPending.current || runningRef.current?.entry.todoId === todoId) return;
      directStopPending.current = true;
      void (async () => {
        try {
          const result = await startTimer(todoId, false);
          if (result.kind === "confirmation_required") {
            const pending = { todoId, todoTitle, runningTitle: result.runningTodoTitle };
            if (promptOnTimerStop) {
              setDialogError(null);
              setConflictNote(result.running.note);
              setConflict(pending);
            } else {
              await performSwitch(pending, result.running.note, false);
            }
            return;
          }
          announceStart(todoId, todoTitle, result.doneCleared, result.poolMovement);
        } catch (cause) {
          toasts.failure("Der Timer ließ sich nicht starten", errorMessage(cause));
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

  /* ---------------------------------------------------------------- */
  /* E-036 — die verwaiste Buchung                                     */
  /* ---------------------------------------------------------------- */

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
            `Buchung auf ${quotedName(pending.todoTitle)} abgeschlossen.`,
            withMovement(
              `Gebucht bis zum letzten Lebenszeichen: ${formatDuration(result.entry.durationSeconds)}.`,
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
                title: "Buchung verworfen.",
                body: `Sie haben die unvollständige Buchung auf ${quotedName(pending.todoTitle)} verworfen. Es ist keine Zeit gebucht worden.`,
              }
            : {
                tone: "info",
                title: "Nichts zu buchen.",
                body: `Zwischen dem Start und dem letzten Lebenszeichen liegt auf ${quotedName(pending.todoTitle)} weniger als eine Sekunde. Die unvollständige Buchung ist damit weg, gebucht wurde nichts.`,
              },
        );
      })
      .catch((cause: unknown) => setDialogError(errorMessage(cause)))
      .finally(() => setBusy(false));
  }, [bump, orphan, orphanChoice, toasts]);

  const isRunningFor = useCallback(
    (todoId: Id) => runningRef.current?.entry.todoId === todoId,
    [],
  );

  const api = useMemo<TimerApi>(
    () => ({
      running,
      elapsedSeconds,
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
      running,
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

  return (
    <TimerContext.Provider value={api}>
      {children}
      {idle.session === null ? null : <IdleRecovery key={idle.session.id} session={idle.session} changed={idle.refresh} running={running !== null} resumeAfter={!idleKeepTimerRunning} />}
      <div role="alert">{idle.error === null ? null : <aside className="idle-reminder">Inaktivität konnte nicht geprüft werden: {idle.error}<Button onClick={idle.refresh}>Erneut prüfen</Button></aside>}</div>

      <FormDialog
        open={stopOpen}
        title="Timer stoppen"
        description={
          running === null
            ? undefined
            : `Läuft seit ${formatStopwatch(elapsedSeconds)} auf ${quotedName(running.todoTitle)}.`
        }
        submitLabel="Stoppen und buchen"
        cancelLabel="Weiterlaufen lassen"
        busy={busy}
        error={dialogError}
        onSubmit={confirmStop}
        onCancel={() => setStopOpen(false)}
      >
        <NoteField
          scope="billing"
          value={stopNote}
          onChange={setStopNote}
          rows={3}
          maxLength={8192}
          placeholder="Was wurde geleistet?"
        />
        {/*
          Derselbe Satz steht seit T-118 auch im Dialog „Zeit von Hand
          erfassen" (B-4). Er kommt aus `lib/labels.ts`, damit es ihn genau
          einmal gibt.
        */}
        <p className="dialog__hint">{BILLING_NOTE_MAY_BE_EMPTY}</p>
      </FormDialog>

      <FormDialog
        open={conflict !== null}
        title="Es läuft bereits ein Timer"
        description={
          conflict === null
            ? undefined
            : `Auf ${quotedName(conflict.runningTitle)} läuft ein Timer. Er wird gestoppt und die Zeit gebucht, dann startet der Timer auf ${quotedName(conflict.todoTitle)}.`
        }
        submitLabel="Stoppen und wechseln"
        cancelLabel="Abbrechen"
        busy={busy}
        error={dialogError}
        onSubmit={confirmSwitch}
        onCancel={() => setConflict(null)}
      >
        <NoteField
          scope="billing"
          value={conflictNote}
          onChange={setConflictNote}
          label={conflict === null ? "Leistung" : `Leistung für ${quotedName(conflict.runningTitle)}`}
          rows={3}
          maxLength={8192}
          placeholder="Was wurde geleistet?"
        />
      </FormDialog>

      <FormDialog
        open={orphan !== null}
        title="Eine Buchung ohne Ende"
        description={
          orphan === null
            ? undefined
            : `Beim letzten Mal wurde SuperTakt nicht ordentlich beendet. Auf ${quotedName(orphan.todoTitle)} lief ein Timer, der nie gestoppt wurde.`
        }
        submitLabel="Entscheiden"
        cancelLabel="Später entscheiden"
        busy={busy}
        error={dialogError}
        onSubmit={confirmOrphan}
        onCancel={() => setOrphan(null)}
      >
        <fieldset className="choice">
          <legend className="field__label">Was soll damit geschehen?</legend>
          <label className="choice__option">
            <input
              type="radio"
              name="orphan"
              value="book_until_heartbeat"
              checked={orphanChoice === "book_until_heartbeat"}
              onChange={() => setOrphanChoice("book_until_heartbeat")}
            />
            <span>
              <strong>Bis zum letzten Lebenszeichen buchen</strong>
              <span className="choice__hint">
                {orphan === null
                  ? ""
                  : `Das ergibt ${formatDuration(orphan.bookableSeconds)}. Gibt es kein Lebenszeichen, gibt es nichts zu buchen — dann wird verworfen.`}
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
              <strong>Verwerfen</strong>
              <span className="choice__hint">Es wird keine Zeit gebucht.</span>
            </span>
          </label>
        </fieldset>
        <p className="dialog__hint">
          „Bis jetzt buchen“ gibt es bewusst nicht. Genau das wäre der Weg, auf dem ein über
          Nacht vergessener Timer vierzehn Stunden in eine Rechnung bringt.
        </p>
      </FormDialog>
    </TimerContext.Provider>
  );
}
