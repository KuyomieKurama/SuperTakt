import { useEffect, useState, type ReactNode } from "react";
import { errorCode, errorMessage, isServiceError } from "../../api/client";
import {
  createTimeEntry,
  markNotBilled,
  resetExportStatus,
  updateTimeEntry,
} from "./api";
import type { ForeignText, Id, TimeEntry } from "../../api/types";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { ExportAuditList } from "../export/ExportAudit";
import { ExportStatusBadge, exportDisplayState } from "../../shared/ui/ExportStatus";
import { FormDialog, TextField } from "../../shared/ui/FormDialog";
import { InfoDialog } from "./InfoDialog";
import { NoteField } from "../../shared/ui/NoteField";
import { Button, EmptyState, InlineMessage, LoadingBlock } from "../../shared/ui/Primitives";
import { useAsync, useMutation } from "../../app/useAsync";
import { useRefresh } from "../../app/RefreshContext";
import { useToasts, type ToastInput } from "../../app/ToastContext";
import { loadDayGroupInsight, type DayGroupInsight } from "../../app/dayGroup";
import { loadExportAuditPage } from "../export/exportAuditRows";
import { navigate } from "../../app/router";
import {
  calendarDayOf,
  formatDayLabel,
  formatDuration,
  formatPeriod,
  formatQuarters,
  fromLocalInputValue,
  plural,
  toLocalInputValue,
} from "../../lib/format";
import { dayGroupMissingNote, dayGroupPreviewFailed, labels } from "../../lib/labels";
import { bookingTexts } from "./texts";
import { bookingSentence } from "../../lib/movement";
// Cycle bookings <-> timer: a manual booking reports exactly like a timer stop (A-28.7, one wording).
import { stopMessage } from "../timer/stopMessage";
import { timerTexts } from "../timer/texts";
import { bookingEndProblem } from "../../lib/bookingEnd";
import { quotedName } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";
import { ServiceText } from "../../shared/ui/ServiceText";

/**
 * Takt — Dialoge rund um eine Zeitbuchung.
 *
 * Zwei Vorgänge, die beide Geld betreffen, und deshalb beide einen Dialog
 * haben, der ausspricht, was geschieht:
 *
 *  - **Buchung anlegen und ändern.** Eine bereits exportierte Buchung ist
 *    gesperrt (A-6.9); der Dienst antwortet dann mit `time_entry_locked`, und
 *    diese Ansicht bietet den Vorgang erst gar nicht an.
 *  - **Exportstatus zurücksetzen** (E-012, R-10). Danach geht dieselbe
 *    Arbeitszeit erneut in die Abrechnung. Die Begründung ist Pflicht, weil
 *    sie ins unveränderliche Protokoll wandert.
 *  - **Nicht abrechnen** (E-047). Der Gegenweg: Die Buchung wird als
 *    abgeschlossen geführt, ohne dass eine Datei entsteht. Die Begründung ist
 *    hier **freiwillig** — ein Pflichtfeld erzeugt in der Praxis den Text „x"
 *    und nichts weiter.
 *  - **Verlauf dieser Buchung** (R-10, T-040, Befund C-01). Die Gegenprobe zu
 *    den beiden vorigen: Wer einen Exportstatus zurücksetzen will, muss
 *    nachsehen können, was mit dieser Zeit schon geschehen ist. Der Dialog
 *    liest nur; er ist die einzige Stelle, an der ein Vorgang gar nichts
 *    verändert.
 */

/* Anlegen und Ändern                                                   */

/**
 * The toast after editing a booking: four situations, three wordings
 * (docs/design/textbestand.md 12.3, O-II).
 *
 * `previewProblem` is checked before `blockedReason`: a failed preview also
 * carries `blockedReason: null`, and reading that as "all fine" would report
 * success about a state the application does not know.
 */
export function bookingChangedMessage(insight: DayGroupInsight | null): ToastInput {
  const changed = bookingTexts().bookingChanged;
  const shared = labels();
  // L4 — nothing open that day, or the question itself failed.
  if (insight === null) return { tone: "success", title: `${changed}.` };
  // L3 — the preview did not answer; the service sentence stays verbatim (12.10).
  if (insight.previewProblem !== null) {
    return {
      tone: "warning",
      title: `${changed} — ${shared.dayGroupPreviewFailedShort}.`,
      body: dayGroupPreviewFailed(insight.previewProblem),
    };
  }
  // L2 — the group still has no billing note.
  if (insight.blockedReason !== null) {
    return {
      tone: "warning",
      title: `${changed} — ${shared.dayGroupNotBillable}.`,
      body: dayGroupMissingNote(insight.seconds),
    };
  }
  // L1 — the group carries text; name its rounded export value like after a stop (A-28.7).
  return {
    tone: "success",
    title: `${changed}.`,
    body:
      insight.quarters === null
        ? bookingTexts().groupChangesToo
        : timerTexts().openThatDay(formatDuration(insight.seconds), formatQuarters(insight.quarters)),
  };
}

/** A day group whose question failed as a whole: booked stays booked, the value is unknown. */
function failedInsight(cause: unknown): DayGroupInsight {
  return {
    entryCount: 0,
    seconds: 0,
    quarters: null,
    blockedReason: null,
    previewProblem: errorMessage(cause),
    previewProblemCode: errorCode(cause),
  };
}

export interface BookingFormDialogProps {
  readonly open: boolean;
  /** Vorhandene Buchung — dann wird geändert. */
  readonly entry?: TimeEntry;
  /** Todo, auf das gebucht wird. Beim Ändern kommt es aus der Buchung. */
  readonly todoId: Id;
  readonly todoTitle: ForeignText;
  readonly onClose: () => void;
}

export function BookingFormDialog({
  open,
  entry,
  todoId,
  todoTitle,
  onClose,
}: BookingFormDialogProps) {
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();
  const text = bookingTexts();

  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [note, setNote] = useState("");
  /**
   * Der Absendeversuch, nicht der erste Tastendruck (SC 3.3.1).
   *
   * Seit E-084 dem Formular `noValidate` gibt, ist die Bauart zugleich die
   * einzige Prüfung, die diese beiden Felder noch haben — Chromiums
   * Sprechblase fängt hier nichts mehr ab. Also trägt jedes Feld seine eigene
   * Meldung, und beide stehen in der Live-Region ihres Feldes (T-162).
   * Vorgeschichte: `docs/decisions/bookings.md`.
   */
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStartedAt(entry === undefined ? "" : toLocalInputValue(entry.startedAt));
    setEndedAt(entry === undefined ? "" : toLocalInputValue(entry.endedAt));
    setNote(entry?.note ?? "");
    setAttempted(false);
  }, [open, entry]);

  /*
    Der Wortlaut ist die Grundform aus T-177 P-3, das erste Wort die
    Beschriftung des Feldes (P-2): Die Meldung wird in einer `role="alert"`-
    Fläche **angesagt**, während der Dialog schon steht — wer sie hört und nicht
    sieht, hat ohne den Feldnamen keinen Bezug.
  */
  const start = fromLocalInputValue(startedAt);
  const end = fromLocalInputValue(endedAt);
  // A-28.6: at most 24 hours, and the end after the start; the service refuses the same.
  const endProblem = start === null ? (end === null ? "missing" : null) : bookingEndProblem(start, end, false);
  const startError = attempted && start === null ? text.startMissing : undefined;
  const endError = attempted && endProblem !== null ? labels().bookingEndProblem[endProblem] : undefined;

  const submit = (): void => {
    setAttempted(true);
    if (start === null || end === null || endProblem !== null) return;

    void mutation.run(async () => {
      if (entry === undefined) {
        /*
          Create: the title names the todo, the body says what happened to it (W-5). The
          movement sentence comes from the service (`bookingSentence`), as after a stop.
          A-28.7: the same toast as after a timer stop — day group of the start day (E-025)
          and its rounded export value. The dialog closes first, then the question follows
          (T-118); a failed question still reports the booking.
        */
        const created = await createTimeEntry({ todoId, startedAt: start, endedAt: end, note });
        bump();
        onClose();
        const movement = bookingSentence(created.poolMovement);
        void loadDayGroupInsight(todoId, calendarDayOf(created.startedAt))
          .catch(failedInsight)
          .then((insight) => toasts.show(stopMessage(insight, todoTitle, created.durationSeconds, movement)));
        return;
      }

      /*
        Edit: no movement sentence by contract — a changed period moves nothing, and
        `PATCH /time-entries/{id}` returns no `poolMovement` (O-V). The dialog closes first,
        then the day group is asked with the new start (textbestand 12.8 AK 1 and 6). A failed
        question is still a saved booking: it reports L4, never an error.
      */
      await updateTimeEntry(entry.id, { startedAt: start, endedAt: end, note });
      bump();
      onClose();
      void loadDayGroupInsight(entry.todoId, calendarDayOf(start))
        .then((insight) => toasts.show(bookingChangedMessage(insight)))
        .catch(() => toasts.show(bookingChangedMessage(null)));
    });
  };

  return (
    <FormDialog
      open={open}
      title={entry === undefined ? text.manualTitle : text.editTitle}
      description={
        entry === undefined
          ? text.manualLead(quotedName(todoTitle))
          : text.editLead(quotedName(todoTitle))
      }
      submitLabel={entry === undefined ? text.book : text.save}
      busy={mutation.busy}
      error={mutation.error}
      errorFromService={mutation.errorFromService}
      onSubmit={submit}
      onCancel={onClose}
    >
      <div className="field-row">
        <TextField
          label={text.start}
          type="datetime-local"
          value={startedAt}
          onChange={setStartedAt}
          required
          {...(startError === undefined ? {} : { error: startError })}
        />
        <TextField
          label={text.end}
          type="datetime-local"
          value={endedAt}
          onChange={setEndedAt}
          required
          {...(endError === undefined ? {} : { error: endError })}
        />
      </div>

      <NoteField
        scope="billing"
        value={note}
        onChange={setNote}
        rows={3}
        maxLength={8192}
        placeholder={text.notePlaceholder}
      />

      {/*
        Derselbe Hinweis wie im Stoppdialog (B-4 aus T-116, E-034).

        Eine Buchung ohne Leistung ist erfasst — aber die **Tagesgruppe** dieses
        Todos geht ohne Text nicht in den Export. Der Stoppdialog sagt das seit
        jeher und der Stopp-Toast warnt danach noch einmal; die Buchung von Hand
        sagte bis T-118 weder das eine noch das andere. Sie ist der Weg, auf dem
        Zeit **nachgetragen** wird, also der, auf dem eine Leistung am ehesten
        vergessen wird.

        Auch beim Ändern: Wer die Leistung hier leert, erzeugt denselben
        Zustand. Ein Hinweis, der nur an einem der beiden Ausgänge stünde, wäre
        derselbe Fehler eine Ebene tiefer.

        Der Wortlaut steht in `lib/labels.ts` und nicht zweimal in der Ansicht.
      */}
      <p className="dialog__hint">{labels().billingNoteMayBeEmpty}</p>
    </FormDialog>
  );
}

/* Exportstatus zurücksetzen (E-012, R-10)                              */

export interface ResetExportDialogProps {
  readonly open: boolean;
  readonly entry: TimeEntry | null;
  readonly todoTitle: ForeignText;
  readonly onClose: () => void;
}

export function ResetExportDialog({ open, entry, todoTitle, onClose }: ResetExportDialogProps) {
  const toasts = useToasts();
  const { bump } = useRefresh();
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<ReactNode>(null);
  const text = bookingTexts();

  /**
   * Was die Rücknahme für die Tagesgruppe bedeutet, wird **vor** dem
   * Bestätigen gezeigt (T-005n, 4.2). Der Wert danach lässt sich nicht
   * vorwegnehmen — die Vorschau kennt nur offene Buchungen —, also steht hier,
   * was heute gilt und was hinzukommt, und nichts Erfundenes.
   */
  useEffect(() => {
    if (!open || entry === null) {
      setContext(null);
      return;
    }
    let live = true;
    void loadDayGroupInsight(entry.todoId, calendarDayOf(entry.startedAt))
      .then((insight) => {
        if (!live) return;
        if (insight === null) {
          setContext(bookingTexts().resetNothingOpen(formatDuration(entry.durationSeconds)));
          return;
        }
        /*
          Der gerundete Wert fehlt aus zwei verschiedenen Gruenden, und der
          Unterschied gehoert vor die folgenreichste Bestaetigung des
          Produkts: Entweder die Domaene sagt, dass die Gruppe keinen hat —
          oder die Vorschau hat nicht geantwortet (`dayGroup.ts`).
        */
        if (insight.previewProblem !== null) {
          setContext(
            <>
              {bookingTexts().resetPreviewFailedLead(
                formatDuration(insight.seconds),
                formatDuration(entry.durationSeconds),
              )}
              <ServiceText text={insight.previewProblem} fromService={insight.previewProblemCode !== null} />
            </>,
          );
          return;
        }
        const words = bookingTexts();
        const current =
          insight.quarters === null
            ? words.openAmount(formatDuration(insight.seconds))
            : words.openAmountWithExport(formatDuration(insight.seconds), formatQuarters(insight.quarters));
        setContext(words.resetAdds(current, formatDuration(entry.durationSeconds)));
      })
      .catch((cause: unknown) => {
        if (!live) return;
        /*
          Auch die Buchungen des Tages selbst koennen ausbleiben. Dann steht
          hier, dass die Auskunft fehlt — und nicht der allgemeine Satz aus
          `consequence`, der so klaenge, als waere nachgesehen worden.
        */
        setContext(
          <>
            {bookingTexts().resetContextFailedLead}
            <ServiceText text={errorMessage(cause)} fromService={isServiceError(cause)} />
            {bookingTexts().resetContextFailedTail}
          </>,
        );
      });
    return () => {
      live = false;
    };
  }, [open, entry]);

  const confirm = (reason: string): void => {
    if (entry === null) return;
    setBusy(true);
    void resetExportStatus(entry.id, reason)
      .then(() => {
        bump();
        toasts.show({
          tone: "warning",
          title: text.resetDone,
          body: text.resetDoneBody,
        });
        onClose();
      })
      .catch((cause: unknown) =>
        toasts.failure(text.resetFailed, errorMessage(cause), isServiceError(cause)),
      )
      .finally(() => setBusy(false));
  };

  return (
    <ConfirmDialog
      open={open && entry !== null}
      tone="danger"
      title={text.resetTitle}
      description={
        entry === null
          ? ""
          : text.resetLead(
              formatDayLabel(calendarDayOf(entry.startedAt)),
              quotedName(todoTitle),
              formatDuration(entry.durationSeconds),
            )
      }
      consequence={context ?? text.resetConsequence}
      confirmLabel={text.reset}
      reasonLabel={text.reasonForLog}
      reasonRequired
      acknowledgeLabel={text.resetAcknowledge}
      busy={busy}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}

/* Nicht abrechnen (E-047)                                              */

export interface NotBilledDialogProps {
  readonly open: boolean;
  readonly entry: TimeEntry | null;
  readonly todoTitle: ForeignText;
  readonly onClose: () => void;
}

/**
 * „Diese Zeit nicht abrechnen“ — der zweite Weg nach `exported` (E-047).
 *
 * **Der Vorgang heißt nirgends „als exportiert markieren“.** Exportiert wurde
 * diese Zeit nie; der Benutzer rechnet sie schlicht nicht ab. Deshalb steht im
 * Dialog, was danach gilt, und nicht, welchen Wert eine Spalte bekommt.
 *
 * `exportCount` bleibt unverändert — die Buchung war in keinem Exportlauf. Eine
 * erfundene Eins ergäbe später eine Warnung vor einer zweiten Abrechnung, die
 * nie eine erste hatte.
 *
 * Der Grund ist freiwillig. Er wandert ins Protokoll (`export_audit` mit
 * `event = 'not_billed'`), wo auch der Zeitpunkt und der Urheber stehen.
 */
export function NotBilledDialog({ open, entry, todoTitle, onClose }: NotBilledDialogProps) {
  const toasts = useToasts();
  const text = bookingTexts();
  const { bump } = useRefresh();
  const [busy, setBusy] = useState(false);

  const confirm = (reason: string): void => {
    if (entry === null) return;
    setBusy(true);
    void markNotBilled(entry.id, reason.trim())
      .then(() => {
        bump();
        toasts.success(text.notBilledDone, text.notBilledDoneBody);
        onClose();
      })
      .catch((cause: unknown) => {
        // A-26.3: the service refuses "not billed" for a NoExport todo (409 `time_entry_no_export`).
        if (errorCode(cause) === "time_entry_no_export") {
          toasts.failure(text.notBilledFailed, text.notBilledNoExport);
          return;
        }
        toasts.failure(text.notBilledFailed, errorMessage(cause), isServiceError(cause));
      })
      .finally(() => setBusy(false));
  };

  return (
    <ConfirmDialog
      open={open && entry !== null}
      title={text.notBilledTitle}
      description={
        entry === null
          ? ""
          : text.notBilledLead(
              formatDayLabel(calendarDayOf(entry.startedAt)),
              quotedName(todoTitle),
              formatDuration(entry.durationSeconds),
            )
      }
      consequence={text.notBilledConsequence}
      confirmLabel={text.notBilled}
      reasonLabel={text.reasonOptional}
      busy={busy}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}

/* Verlauf einer Buchung (R-10, E-012, E-047, Befund C-01)              */

export interface BookingHistoryDialogProps {
  readonly open: boolean;
  readonly entry: TimeEntry | null;
  readonly todoTitle: ForeignText;
  readonly onClose: () => void;
}

/**
 * Was mit dieser Buchung schon geschehen ist — und zwar **bevor** jemand ihren
 * Exportstatus zurücksetzt.
 *
 * Vorgeschichte: `docs/decisions/bookings.md`.
 *
 * Der Dialog schreibt nichts. Er hat deshalb keinen Bestätigungsknopf, sondern
 * nur einen Weg hinaus und einen Weg weiter ins Gesamtprotokoll.
 */
export function BookingHistoryDialog({
  open,
  entry,
  todoTitle,
  onClose,
}: BookingHistoryDialogProps) {
  if (!open || entry === null) return null;
  return <BookingHistoryBody entry={entry} todoTitle={todoTitle} onClose={onClose} />;
}

function BookingHistoryBody({
  entry,
  todoTitle,
  onClose,
}: {
  readonly entry: TimeEntry;
  readonly todoTitle: ForeignText;
  readonly onClose: () => void;
}) {
  /*
   * Eine eigene Abfrage je Buchung, nicht das gefilterte Gesamtprotokoll: Der
   * Dienst filtert selbst (`timeEntryId`), und ein Filter über eine geladene
   * Seite hätte ältere Zeilen stillschweigend verschluckt — ausgerechnet die,
   * die eine Doppelabrechnung belegen.
   */
  const history = useAsync(
    () => loadExportAuditPage({ timeEntryId: entry.id, limit: 50 }),
    [entry.id],
  );

  const state = exportDisplayState(entry.exportStatus, entry.exportCount);
  const text = bookingTexts();

  return (
    <InfoDialog
      open
      wide
      title={text.historyTitle}
      description={
        <>
          {formatPeriod(entry.startedAt, entry.endedAt)} {text.on} <Foreign value={quotedName(todoTitle)} /> ·{" "}
          {formatDuration(entry.durationSeconds)}
        </>
      }
      actions={
        <Button
          variant="secondary"
          iconStart="filter"
          onClick={() => {
            onClose();
            navigate("exportAudit");
          }}
        >
          {text.fullLog}
        </Button>
      }
      onClose={onClose}
    >
      <p className="bhistory__now">
        <span className="bhistory__now-label">{text.today}</span>
        <ExportStatusBadge state={state} size="sm" />
        <span className="muted">
          {entry.exportCount === 0
            ? text.inNoRun
            : plural(entry.exportCount, text.runContained, text.runsContained)}
        </span>
      </p>

      {history.state.status === "loading" ? (
        <LoadingBlock label={text.historyLoading} rows={2} />
      ) : history.state.status === "error" ? (
        <InlineMessage
          tone="danger"
          title={text.historyFailed}
          action={
            <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={history.reload}>
              {labels().retry}
            </Button>
          }
        >
          <ServiceText text={history.state.message} fromService={history.state.fromService} />{" "}
          {text.historyFailedTail}
        </InlineMessage>
      ) : history.state.value.rows.length === 0 ? (
        <EmptyState
          compact
          icon="clock"
          title={text.historyEmptyTitle}
          description={text.historyEmptyBody}
        />
      ) : (
        <>
          <p className="bhistory__lead">
            {plural(history.state.value.rows.length, text.event, text.events)}
            {text.historyLeadTail}
          </p>
          <ExportAuditList models={history.state.value.rows} showBooking={false} />
        </>
      )}
    </InfoDialog>
  );
}
