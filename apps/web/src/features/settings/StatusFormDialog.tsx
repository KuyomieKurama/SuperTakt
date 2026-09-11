import { MAX_NAME_LENGTH } from "@takt/domain";
import { useEffect, useState } from "react";
import type { TodoStatus } from "../../api/types";
import { FormDialog, TextField } from "../../shared/ui/FormDialog";
import { InlineMessage } from "../../shared/ui/Primitives";
import { useRefresh } from "../../app/RefreshContext";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useMutation } from "../../app/useAsync";
import { quotedName } from "../../lib/foreign";
import { createTodoStatus, updateTodoStatus } from "./api";
/* ==================================================================== */
/* Anlegen und Umbenennen                                               */
/* ==================================================================== */

export interface StatusFormDialogProps {
  readonly open: boolean;
  /** Vorhandener Status — dann wird umbenannt, sonst angelegt. */
  readonly status?: TodoStatus;
  /** Alle Statuswerte, für die Prüfung auf einen doppelten Namen. */
  readonly existing: readonly TodoStatus[];
  readonly onClose: () => void;
}

/**
 * Ein Formular für beide Fälle — es ist dasselbe Feld.
 *
 * Der doppelte Name wird **vor** dem Absenden gemeldet und nicht erst durch den
 * Dienst: Der eindeutige Index auf `todo_status.name` weist ihn ohnehin ab, und
 * eine Meldung nach dem Klick erklärt weniger als eine gesperrte Schaltfläche
 * mit dem Grund am Feld. Die Prüfung hier ist die **Erklärung**, nicht die
 * Grenze — die zieht der Dienst, und er zieht sie noch einmal.
 */
export function StatusFormDialog({ open, status, existing, onClose }: StatusFormDialogProps) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();
  const [name, setName] = useState("");
  /**
   * Das Verlassen des Feldes, nicht der Absendeversuch (Befund O-DZ, T-167).
   *
   * Bei leerem Namen ist die Schaltfläche gesperrt — `onSubmit` läuft also nie,
   * und eine Meldung, die dort entstünde, sähe niemand. Dieselbe Lehre wie im
   * Anhangsdialog: Ein Pflichtfeld, dessen Grund unerreichbar ist, ist ein
   * gesperrter Knopf ohne Erklärung. Nicht das Tippen, weil eine Meldung beim
   * ersten Zeichen eine Eingabe tadelt, die noch niemand beendet hat (SC 3.3.1).
   */
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(status?.name ?? "");
    setTouched(false);
  }, [open, status]);

  const trimmed = name.trim();
  const duplicate = existing.some(
    (entry) => entry.id !== status?.id && entry.name.toLocaleLowerCase("de-DE") === trimmed.toLocaleLowerCase("de-DE"),
  );
  const empty = touched && trimmed.length === 0;
  const nameError = duplicate
    ? "Diesen Namen gibt es schon. Zwei Statuswerte mit demselben Namen wären in jeder Auswahl nicht auseinanderzuhalten."
    : empty
      ? "Name fehlt."
      : undefined;

  return (
    <FormDialog
      open={open}
      title={status === undefined ? "Neuen Status anlegen" : `${quotedName(status.name)} umbenennen`}
      description={
        status === undefined
          ? "Der neue Status steht danach in jeder Auswahl. Er bekommt keine Todos, solange keines darauf gestellt wird."
          : "Nur der Name ändert sich. Welche Todos diesen Status tragen, bleibt unverändert — und welche Karte auf dem Board steht, hängt ohnehin an den Tags."
      }
      submitLabel={status === undefined ? "Anlegen" : "Speichern"}
      submitDisabled={trimmed.length === 0 || duplicate}
      busy={mutation.busy}
      error={mutation.error}
      onSubmit={() => {
        void mutation.run(async () => {
          const saved =
            status === undefined
              ? await createTodoStatus(trimmed, null)
              : await updateTodoStatus(status.id, { name: trimmed });
          structure.reload();
          // Der Name steht in der Liste, in der Detailansicht und auf jeder
          // Karte. Ohne dieses Signal zeigten sie den alten, bis jemand neu
          // lädt — und der Benutzer glaubte, das Umbenennen habe nicht gewirkt.
          bump();
          toasts.success(
            status === undefined ? "Status angelegt." : "Status umbenannt.",
            status === undefined
              ? `${quotedName(saved.name)} steht ab sofort zur Auswahl. Standard für neue Todos ist er dadurch nicht.`
              : `Aus ${quotedName(status.name)} wurde ${quotedName(saved.name)}.`,
          );
          onClose();
        });
      }}
      onCancel={onClose}
    >
      <TextField
        label="Name"
        value={name}
        onChange={setName}
        onTouched={() => setTouched(true)}
        required
        maxLength={MAX_NAME_LENGTH}
        placeholder="z. B. Wartet auf Rückmeldung"
        {...(nameError === undefined ? {} : { error: nameError })}
        {...(nameError !== undefined
          ? {}
          : {
              hint:
                status === undefined
                  ? "Der neue Status steht am Ende der Reihenfolge. Verschieben lässt er sich danach mit den Pfeilen."
                  : "Die Reihenfolge und der Standard bleiben, wie sie sind.",
            })}
      />

      {status === undefined ? null : (
        <InlineMessage tone="info" title="Das Umbenennen wirkt überall sofort">
          Der Status ist eine Eigenschaft des Todos, kein Text an einer Stelle. Der neue Name steht
          danach in der Todo-Liste, in der Detailansicht, in jedem Formular und auf jeder Karte des
          Boards.
        </InlineMessage>
      )}
    </FormDialog>
  );
}
