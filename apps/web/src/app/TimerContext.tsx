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
import { errorMessage } from "../api/client";
import {
  deleteTimeEntry,
  getOrphanedTimer,
  getRunningTimer,
  markTodoDone,
  resolveOrphanedTimer,
  startTimer,
  stopTimer,
  touchTimerHeartbeat,
} from "../api/endpoints";
import type { Id, OrphanedTimerView, RunningTimerView } from "../api/types";
import { FormDialog } from "../components/FormDialog";
import { NoteField } from "../components/NoteField";
import {
  calendarDayOf,
  formatDuration,
  formatQuarters,
  formatStopwatch,
  joinGerman,
} from "../lib/format";
import { CARD_STAYS } from "../lib/labels";
import { loadDayGroupInsight } from "./dayGroup";
import { useRefresh } from "./RefreshContext";
import { useStructure } from "./StructureContext";
import { useToasts } from "./ToastContext";

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
  readonly start: (todoId: Id, todoTitle: string) => void;
  /** I-04 — öffnet den Stoppdialog. Ohne Leistung wird nicht gestoppt. */
  readonly requestStop: () => void;
  /** Startet oder stoppt, je nachdem was gerade gilt. */
  readonly toggle: (todoId: Id, todoTitle: string) => void;
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
  readonly todoTitle: string;
  readonly runningTitle: string;
}

export function TimerProvider({ children }: { readonly children: ReactNode }) {
  const toasts = useToasts();
  const { bump } = useRefresh();
  const { poolsContaining } = useStructure();

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
  const [reactivated, setReactivated] = useState<ReadonlySet<Id>>(() => new Set());

  const clearReactivated = useCallback((todoId: Id) => {
    setReactivated((previous) => {
      if (!previous.has(todoId)) return previous;
      const next = new Set(previous);
      next.delete(todoId);
      return next;
    });
  }, []);

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
  /* I-05 — Rückgängig nach der Wiederaufnahme                          */
  /* ---------------------------------------------------------------- */

  const undoReactivation = useCallback(
    (todoId: Id, todoTitle: string) => {
      void (async () => {
        try {
          const stopped = await stopTimer("");
          if (stopped.kind === "recorded") await deleteTimeEntry(stopped.entry.id);
          await markTodoDone(todoId);
          clearReactivated(todoId);
          refresh();
          bump();
          toasts.show({
            tone: "info",
            title: "Zurückgenommen.",
            body: `„${todoTitle}“ ist wieder erledigt, die eben entstandene Buchung wurde verworfen.`,
          });
        } catch (cause) {
          toasts.failure("Das Zurücknehmen hat nicht geklappt", errorMessage(cause));
        }
      })();
    },
    [bump, clearReactivated, refresh, toasts],
  );

  /* ---------------------------------------------------------------- */
  /* Nach dem Start                                                    */
  /* ---------------------------------------------------------------- */

  const announceStart = useCallback(
    (todoId: Id, todoTitle: string, doneCleared: boolean) => {
      refresh();
      bump();

      if (doneCleared) setReactivated((previous) => new Set(previous).add(todoId));

      if (!doneCleared) {
        toasts.show({
          tone: "success",
          title: "Timer gestartet.",
          body: `Er läuft auf „${todoTitle}“.`,
        });
        return;
      }

      // A-2.5, I-05: Das Kennzeichen ist gefallen — der Status nicht, und die
      // Tags auch nicht. Seit E-054 haengt die Kanban-Spalte an den Tags, also
      // steht die Karte danach in denselben Spalten wie zuvor; sie war nur
      // ausgeblendet. Beides wird ausgesprochen — der Benutzer sucht die Karte
      // sonst an einer anderen Stelle (T-005n, Abschnitt 2, Schritt 8).
      /*
        Befund C-24: Derselbe Satz stand hier und im Add-in
        (`duplicate/reopen.ts`) in zwei Fassungen. Der Fall „kein Pool trifft"
        war bereits zeichengleich — die Absicht war da, nur nicht durchgezogen.
        Jetzt sind es beide: die Aufzaehlung ueber `joinGerman` („A, B und C"
        statt „A und B und C") und der Kartensatz ueber `CARD_STAYS`. Der
        Halbsatz zur Spalte macht E-023 aussprechbar, statt vorauszusetzen,
        dass jemand weiss, was „die Karte" mit „der Spalte" zu tun hat.

        Der Fehlschlag der Pool-Abfrage bleibt nicht stumm: Die drei Wirkungen
        aus A-2.5 sind eingetreten, gleich ob Takt die Pools nennen kann. Sie
        zu verschweigen, weil eine Nebenauskunft fehlt, waere der teurere
        Fehler — das Kennzeichen ist dann trotzdem weg.
      */
      const announce = (poolText: string): void => {
        toasts.show({
          tone: "success",
          title: `Timer gestartet. „${todoTitle}“ ist wieder offen.`,
          body: `${poolText} ${CARD_STAYS}`,
          action: { label: "Rückgängig", onSelect: () => undoReactivation(todoId, todoTitle) },
        });
      };

      void poolsContaining(todoId)
        .then((pools) => {
          announce(
            pools.length === 0
              ? "Auf seine Tags passt derzeit keine Poolregel, es erscheint also in keinem Pool."
              : `Es ist zurück in ${pools.length === 1 ? "dem Pool" : "den Pools"} ${joinGerman(
                  pools.map((name) => `„${name}“`),
                )}.`,
          );
        })
        .catch(() => {
          announce(
            "In welchen Pools es jetzt erscheint, ließ sich gerade nicht abfragen — die Todo-Liste zeigt es.",
          );
        });
    },
    [bump, poolsContaining, refresh, toasts, undoReactivation],
  );

  /* ---------------------------------------------------------------- */
  /* Starten                                                           */
  /* ---------------------------------------------------------------- */

  const start = useCallback(
    (todoId: Id, todoTitle: string) => {
      if (runningRef.current?.entry.todoId === todoId) return;
      void (async () => {
        try {
          const result = await startTimer(todoId, false);
          if (result.kind === "confirmation_required") {
            setConflictNote(result.running.note);
            setConflict({ todoId, todoTitle, runningTitle: result.runningTodoTitle });
            return;
          }
          announceStart(todoId, todoTitle, result.doneCleared);
        } catch (cause) {
          toasts.failure("Der Timer ließ sich nicht starten", errorMessage(cause));
        }
      })();
    },
    [announceStart, toasts],
  );

  /* ---------------------------------------------------------------- */
  /* Stoppen                                                           */
  /* ---------------------------------------------------------------- */

  const reportStopped = useCallback(
    async (todoId: Id, startedAt: string, durationSeconds: number) => {
      const insight = await loadDayGroupInsight(todoId, calendarDayOf(startedAt));
      const booked = `Gebucht: ${formatDuration(durationSeconds)}.`;

      if (insight === null) {
        toasts.success("Zeit gebucht.", booked);
        return;
      }
      /*
        Die Vorschau hat nicht geantwortet. Gebucht ist trotzdem — das steht
        zuerst da. Was daraus beim Export wird, weiss Takt gerade nicht, und
        dann steht das da statt eines Schweigens, das wie „nichts weiter zu
        sagen" aussieht (Befund aus T-044, `dayGroup.ts`).
      */
      if (insight.previewProblem !== null) {
        toasts.show({
          tone: "warning",
          title: "Zeit gebucht — der Exportwert ließ sich nicht abfragen.",
          body: `${booked} Was diese Tagesgruppe beim Export ergibt, konnte Takt gerade nicht ermitteln: ${insight.previewProblem} Die erfasste Zeit steht fest; der gerundete Wert steht in der Export-Ansicht.`,
        });
        return;
      }
      if (insight.blockedReason !== null) {
        toasts.show({
          tone: "warning",
          title: "Zeit gebucht — aber noch nicht abrechenbar.",
          body: `${booked} Für diesen Tag steht auf diesem Todo noch keine Leistung. Ohne sie bleibt die Tagesgruppe (${formatDuration(insight.seconds)}) beim Export stehen.`,
        });
        return;
      }
      if (insight.quarters === null) {
        toasts.success("Zeit gebucht.", booked);
        return;
      }
      toasts.success(
        "Zeit gebucht.",
        `${booked} An diesem Tag sind für dieses Todo ${formatDuration(insight.seconds)} offen — das ergibt beim Export ${formatQuarters(insight.quarters)}.`,
      );
    },
    [toasts],
  );

  const performStop = useCallback(
    async (note: string): Promise<boolean> => {
      const current = runningRef.current;
      if (current === null) return false;
      const result = await stopTimer(note);
      refresh();
      bump();

      if (result.kind === "discarded") {
        toasts.show({
          tone: "info",
          title: "Nichts gebucht.",
          body: "Der Timer lief weniger als eine Sekunde. Das ist ein Doppelklick auf „Start“, keine geleistete Arbeit.",
        });
        return true;
      }

      await reportStopped(
        current.entry.todoId,
        result.entry.startedAt,
        result.entry.durationSeconds,
      );
      return true;
    },
    [bump, refresh, reportStopped, toasts],
  );

  const requestStop = useCallback(() => {
    if (runningRef.current === null) return;
    setStopNote(runningRef.current.entry.note);
    setDialogError(null);
    setStopOpen(true);
  }, []);

  const toggle = useCallback(
    (todoId: Id, todoTitle: string) => {
      if (runningRef.current?.entry.todoId === todoId) requestStop();
      else start(todoId, todoTitle);
    },
    [requestStop, start],
  );

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

  const confirmSwitch = useCallback(() => {
    const pending = conflict;
    if (pending === null) return;
    setBusy(true);
    setDialogError(null);
    void (async () => {
      try {
        await performStop(conflictNote);
        const result = await startTimer(pending.todoId, false);
        if (result.kind === "confirmation_required") {
          setDialogError("Es läuft weiterhin ein Timer. Bitte versuchen Sie es erneut.");
          return;
        }
        setConflict(null);
        announceStart(pending.todoId, pending.todoTitle, result.doneCleared);
      } catch (cause) {
        setDialogError(errorMessage(cause));
      } finally {
        setBusy(false);
      }
    })();
  }, [announceStart, conflict, conflictNote, performStop]);

  /* ---------------------------------------------------------------- */
  /* E-036 — die verwaiste Buchung                                     */
  /* ---------------------------------------------------------------- */

  const confirmOrphan = useCallback(() => {
    setBusy(true);
    setDialogError(null);
    void resolveOrphanedTimer(orphanChoice)
      .then((result) => {
        setOrphan(null);
        bump();
        if (result.kind === "recorded") {
          toasts.success(
            "Buchung abgeschlossen.",
            `Gebucht bis zum letzten Lebenszeichen: ${formatDuration(result.entry.durationSeconds)}.`,
          );
        } else {
          toasts.show({
            tone: "info",
            title: "Buchung verworfen.",
            body: "Es ist keine Zeit gebucht worden.",
          });
        }
      })
      .catch((cause: unknown) => setDialogError(errorMessage(cause)))
      .finally(() => setBusy(false));
  }, [bump, orphanChoice, toasts]);

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
      start,
      requestStop,
      toggle,
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
    ],
  );

  return (
    <TimerContext.Provider value={api}>
      {children}

      <FormDialog
        open={stopOpen}
        title="Timer stoppen"
        description={
          running === null
            ? undefined
            : `Läuft seit ${formatStopwatch(elapsedSeconds)} auf „${running.todoTitle}“.`
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
        <p className="dialog__hint">
          Die Leistung darf leer bleiben. Dann ist die Buchung erfasst, aber die Tagesgruppe
          dieses Todos geht ohne Text nicht in den Export — die Exportvorschau sagt es
          und bietet an, den Text nachzutragen.
        </p>
      </FormDialog>

      <FormDialog
        open={conflict !== null}
        title="Es läuft bereits ein Timer"
        description={
          conflict === null
            ? undefined
            : `Auf „${conflict.runningTitle}“ läuft ein Timer. Er wird gestoppt und die Zeit gebucht, dann startet der Timer auf „${conflict.todoTitle}“.`
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
          label={conflict === null ? "Leistung" : `Leistung für „${conflict.runningTitle}“`}
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
            : `Beim letzten Mal wurde Takt nicht ordentlich beendet. Auf „${orphan.todoTitle}“ lief ein Timer, der nie gestoppt wurde.`
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
