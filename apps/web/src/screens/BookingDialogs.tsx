import { useEffect, useState } from "react";
import { errorMessage } from "../api/client";
import {
  createTimeEntry,
  markNotBilled,
  resetExportStatus,
  updateTimeEntry,
} from "../api/endpoints";
import type { Id, TimeEntry } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExportAuditList } from "../components/ExportAudit";
import { ExportStatusBadge, exportDisplayState } from "../components/ExportStatus";
import { FormDialog, TextField } from "../components/FormDialog";
import { InfoDialog } from "../components/InfoDialog";
import { NoteField } from "../components/NoteField";
import { Button, EmptyState, InlineMessage, LoadingBlock } from "../components/Primitives";
import { useAsync, useMutation } from "../app/useAsync";
import { useRefresh } from "../app/RefreshContext";
import { useToasts } from "../app/ToastContext";
import { loadDayGroupInsight } from "../app/dayGroup";
import { loadExportAuditPage } from "../app/exportAudit";
import { navigate } from "../app/router";
import {
  calendarDayOf,
  formatDayLabel,
  formatDuration,
  formatPeriod,
  formatQuarters,
  fromLocalInputValue,
  plural,
  toLocalInputValue,
} from "../lib/format";

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

/* ==================================================================== */
/* Anlegen und Ändern                                                   */
/* ==================================================================== */

export interface BookingFormDialogProps {
  readonly open: boolean;
  /** Vorhandene Buchung — dann wird geändert. */
  readonly entry?: TimeEntry;
  /** Todo, auf das gebucht wird. Beim Ändern kommt es aus der Buchung. */
  readonly todoId: Id;
  readonly todoTitle: string;
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

  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [note, setNote] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setStartedAt(entry === undefined ? "" : toLocalInputValue(entry.startedAt));
    setEndedAt(entry === undefined ? "" : toLocalInputValue(entry.endedAt));
    setNote(entry?.note ?? "");
    setFieldError(undefined);
  }, [open, entry]);

  const submit = (): void => {
    const start = fromLocalInputValue(startedAt);
    const end = fromLocalInputValue(endedAt);
    if (start === null || end === null) {
      setFieldError("Anfang und Ende müssen beide gesetzt sein.");
      return;
    }
    setFieldError(undefined);

    void mutation.run(async () => {
      if (entry === undefined) {
        await createTimeEntry({ todoId, startedAt: start, endedAt: end, note });
        toasts.success("Zeit gebucht.", `Die Buchung liegt auf „${todoTitle}“.`);
      } else {
        await updateTimeEntry(entry.id, { startedAt: start, endedAt: end, note });
        toasts.success("Buchung geändert.", "Die Tagesgruppe dieses Todos ändert sich mit.");
      }
      bump();
      onClose();
    });
  };

  return (
    <FormDialog
      open={open}
      title={entry === undefined ? "Zeit von Hand erfassen" : "Buchung bearbeiten"}
      description={
        entry === undefined
          ? `Für „${todoTitle}“. Die Dauer ergibt sich aus Anfang und Ende; Takt rechnet sie aus.`
          : `Für „${todoTitle}“. Der gerundete Exportwert hängt an der Tagesgruppe, nicht an dieser Buchung.`
      }
      submitLabel={entry === undefined ? "Buchen" : "Speichern"}
      busy={mutation.busy}
      error={mutation.error}
      onSubmit={submit}
      onCancel={onClose}
    >
      <div className="field-row">
        <TextField
          label="Anfang"
          type="datetime-local"
          value={startedAt}
          onChange={setStartedAt}
          required
          {...(fieldError === undefined ? {} : { error: fieldError })}
        />
        <TextField
          label="Ende"
          type="datetime-local"
          value={endedAt}
          onChange={setEndedAt}
          required
        />
      </div>

      <NoteField
        scope="billing"
        value={note}
        onChange={setNote}
        rows={3}
        maxLength={8192}
        placeholder="Was wurde geleistet?"
      />
    </FormDialog>
  );
}

/* ==================================================================== */
/* Exportstatus zurücksetzen (E-012, R-10)                              */
/* ==================================================================== */

export interface ResetExportDialogProps {
  readonly open: boolean;
  readonly entry: TimeEntry | null;
  readonly todoTitle: string;
  readonly onClose: () => void;
}

export function ResetExportDialog({ open, entry, todoTitle, onClose }: ResetExportDialogProps) {
  const toasts = useToasts();
  const { bump } = useRefresh();
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<string | null>(null);

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
          setContext(
            `An diesem Tag ist auf diesem Todo derzeit nichts offen. Diese Buchung mit ${formatDuration(entry.durationSeconds)} bildet danach die Tagesgruppe.`,
          );
          return;
        }
        /*
          Der gerundete Wert fehlt aus zwei verschiedenen Gruenden, und der
          Unterschied gehoert vor die folgenreichste Bestaetigung des
          Produkts: Entweder die Domaene sagt, dass die Gruppe keinen hat —
          oder die Vorschau hat nicht geantwortet. Bis T-045 sahen beide
          gleich aus (`dayGroup.ts`).
        */
        if (insight.previewProblem !== null) {
          setContext(
            `An diesem Tag sind auf diesem Todo bereits ${formatDuration(insight.seconds)} offen. Diese Buchung mit ${formatDuration(entry.durationSeconds)} kommt hinzu. Was die Tagesgruppe danach gerundet ergibt, ließ sich gerade nicht abfragen: ${insight.previewProblem}`,
          );
          return;
        }
        const current =
          insight.quarters === null
            ? `${formatDuration(insight.seconds)} offen`
            : `${formatDuration(insight.seconds)} offen, das ergibt beim Export ${formatQuarters(insight.quarters)}`;
        setContext(
          `An diesem Tag sind auf diesem Todo bereits ${current}. Diese Buchung mit ${formatDuration(entry.durationSeconds)} kommt hinzu und verändert den gerundeten Wert der Tagesgruppe.`,
        );
      })
      .catch((cause: unknown) => {
        if (!live) return;
        /*
          Auch die Buchungen des Tages selbst koennen ausbleiben. Dann steht
          hier, dass die Auskunft fehlt — und nicht der allgemeine Satz aus
          `consequence`, der so klaenge, als waere nachgesehen worden.
        */
        setContext(
          `Was an diesem Tag auf diesem Todo bereits offen ist, ließ sich nicht abfragen: ${errorMessage(cause)} Dieselbe Arbeitszeit geht mit dem Zurücksetzen trotzdem beim nächsten Export erneut in die Abrechnung.`,
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
          title: "Exportstatus zurückgesetzt.",
          body: `Die Buchung ist wieder offen und geht beim nächsten Export erneut in die Abrechnung. Der Vorgang steht mit Ihrer Begründung im Protokoll.`,
        });
        onClose();
      })
      .catch((cause: unknown) =>
        toasts.failure("Der Exportstatus ließ sich nicht zurücksetzen", errorMessage(cause)),
      )
      .finally(() => setBusy(false));
  };

  return (
    <ConfirmDialog
      open={open && entry !== null}
      tone="danger"
      title="Exportstatus zurücksetzen?"
      description={
        entry === null
          ? ""
          : `Die Buchung vom ${formatDayLabel(calendarDayOf(entry.startedAt))} auf „${todoTitle}“ (${formatDuration(entry.durationSeconds)}) wird wieder als offen geführt.`
      }
      consequence={
        context ??
        "Dieselbe Arbeitszeit geht damit beim nächsten Export erneut in die Abrechnung."
      }
      confirmLabel="Zurücksetzen"
      reasonLabel="Begründung für das Protokoll"
      reasonRequired
      acknowledgeLabel="Mir ist klar, dass diese Zeit dadurch ein zweites Mal abgerechnet werden kann."
      busy={busy}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}

/* ==================================================================== */
/* Nicht abrechnen (E-047)                                              */
/* ==================================================================== */

export interface NotBilledDialogProps {
  readonly open: boolean;
  readonly entry: TimeEntry | null;
  readonly todoTitle: string;
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
  const { bump } = useRefresh();
  const [busy, setBusy] = useState(false);

  const confirm = (reason: string): void => {
    if (entry === null) return;
    setBusy(true);
    void markNotBilled(entry.id, reason.trim())
      .then(() => {
        bump();
        toasts.success(
          "Diese Zeit wird nicht abgerechnet.",
          "Die Buchung ist abgeschlossen und geht in keinen Export mehr ein. Der Vorgang steht im Protokoll.",
        );
        onClose();
      })
      .catch((cause: unknown) =>
        toasts.failure("Die Buchung ließ sich nicht ausbuchen", errorMessage(cause)),
      )
      .finally(() => setBusy(false));
  };

  return (
    <ConfirmDialog
      open={open && entry !== null}
      title="Diese Zeit nicht abrechnen?"
      description={
        entry === null
          ? ""
          : `Die Buchung vom ${formatDayLabel(calendarDayOf(entry.startedAt))} auf „${todoTitle}“ (${formatDuration(entry.durationSeconds)}) wird als abgeschlossen geführt.`
      }
      consequence="Sie geht in keinen Export mehr ein. Exportiert wird sie nicht — Sie rechnen diese Zeit einfach nicht ab. Rückgängig machen lässt sich das über „Exportstatus zurücksetzen“."
      confirmLabel="Nicht abrechnen"
      reasonLabel="Grund (freiwillig)"
      busy={busy}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}

/* ==================================================================== */
/* Verlauf einer Buchung (R-10, E-012, E-047, Befund C-01)              */
/* ==================================================================== */

export interface BookingHistoryDialogProps {
  readonly open: boolean;
  readonly entry: TimeEntry | null;
  readonly todoTitle: string;
  readonly onClose: () => void;
}

/**
 * Was mit dieser Buchung schon geschehen ist — und zwar **bevor** jemand ihren
 * Exportstatus zurücksetzt.
 *
 * Bis T-040 gab es diese Auskunft nirgends: `GET /export/audit` war gebaut,
 * geprüft und ohne einen einzigen Aufrufer in der Oberfläche (Befund C-01).
 * Damit war der ganze Aufwand für den eigenen Ereignistyp (E-047), für die
 * Herkunft ohne Exportlauf und für den Trigger, der keinen Exportstatus ohne
 * Herkunft zulässt, für den Benutzer unsichtbar.
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
  readonly todoTitle: string;
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

  return (
    <InfoDialog
      open
      wide
      title="Verlauf dieser Buchung"
      description={
        <>
          {formatPeriod(entry.startedAt, entry.endedAt)} auf „{todoTitle}“ ·{" "}
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
          Gesamtes Protokoll
        </Button>
      }
      onClose={onClose}
    >
      <p className="bhistory__now">
        <span className="bhistory__now-label">Heute</span>
        <ExportStatusBadge state={state} size="sm" />
        <span className="muted">
          {entry.exportCount === 0
            ? "In keinem Exportlauf gewesen."
            : plural(
                entry.exportCount,
                "Exportlauf hat diese Zeit enthalten",
                "Exportläufe haben diese Zeit enthalten",
              )}
        </span>
      </p>

      {history.state.status === "loading" ? (
        <LoadingBlock label="Der Verlauf dieser Buchung wird geladen" rows={2} />
      ) : history.state.status === "error" ? (
        <InlineMessage
          tone="danger"
          title="Der Verlauf ließ sich nicht laden"
          action={
            <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={history.reload}>
              Erneut versuchen
            </Button>
          }
        >
          {history.state.message} Der Exportstatus der Buchung ist davon unberührt.
        </InlineMessage>
      ) : history.state.value.rows.length === 0 ? (
        <EmptyState
          compact
          icon="clock"
          title="Für diese Buchung ist nichts protokolliert"
          description="Das Protokoll hält ausschließlich Wechsel des Exportstatus fest: exportiert, zurückgesetzt, nicht abgerechnet. Eine geänderte Zeit oder ein nachgetragener Leistungstext steht nicht darin."
        />
      ) : (
        <>
          <p className="bhistory__lead">
            {plural(history.state.value.rows.length, "Vorgang", "Vorgänge")}, der jüngste zuerst.
            Das Protokoll ist anhängend: Es gibt keinen Weg, eine dieser Zeilen zu ändern oder zu
            löschen.
          </p>
          <ExportAuditList models={history.state.value.rows} showBooking={false} />
        </>
      )}
    </InfoDialog>
  );
}
