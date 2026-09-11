import { useCallback, useEffect, useState } from "react";

import type { Id } from "../../api/types";
import { createAttachment, type AttachmentKind } from "./api";
import { chooseAttachmentFile } from "../../app/connection";
import { useMutation } from "../../app/useAsync";
import { useToasts } from "../../app/ToastContext";
import { ATTACHMENT_VALUE_LABEL } from "./attachmentLabel";
import { Button } from "../../shared/ui/Primitives";
import { FormDialog, TextField } from "../../shared/ui/FormDialog";
import { RadioRow } from "../../shared/ui/RadioRow";

/**
 * Takt — Fläche B aus {@link Attachments}: einen Anhang hinzufügen (A-19.10).
 *
 * Die **Art wird zuerst gewählt**, dann erscheint genau ein Eingabefeld. Drei
 * Felder nebeneinander hießen, daß zwei davon gefüllt sein könnten — und dann
 * entschiede die Reihenfolge im Code, welches gilt. Voreinstellung ist
 * **Verweis**: die harmloseste der drei und die einzige, deren Wert man von
 * Hand tippt.
 *
 * Der Dialog steht in einer eigenen Datei, weil er ein geschlossener Vorgang
 * ist: eigener Zustand, eigene Prüfung, ein Aufruf an den Dienst, und danach
 * meldet er sich mit {@link AttachmentFormDialogProps.onSaved} genau einmal
 * zurück.
 */

interface AttachmentFormDialogProps {
  readonly open: boolean;
  readonly todoId: Id;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function AttachmentFormDialog({ open, todoId, onClose, onSaved }: AttachmentFormDialogProps) {
  const toasts = useToasts();
  const mutation = useMutation();

  /*
    Voreinstellung **Verweis**: die harmloseste der drei Arten und die einzige,
    die kein Öffnen auf dem Rechner des Benutzers auslöst.
  */
  const [kind, setKind] = useState<AttachmentKind>("link");
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickerNote, setPickerNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind("link");
    setValue("");
    setTitle("");
    setTouched(false);
    setPickerNote(null);
  }, [open]);

  const trimmed = value.trim();
  /*
    **Der Grund steht am Feld und nicht erst nach dem Klick** (Fläche B,
    Zustand „leer"). Derselbe Griff wie in `PoolRenameDialog`.

    `touched` entstand bis T-167 an genau **einer** Stelle: im Dateiwähler. Für
    die Art „Verweis" gibt es keinen Wähler, und der Hinzufügen-Knopf ist bei
    leerem Feld gesperrt — also lief `submit` nie, also wurde `touched` nie
    wahr, also war diese Meldung an einem Pflichtfeld unerreichbar (Befund
    O-DZ). Ein Pflichtfeld, dessen Grund niemand je sieht, ist ein gesperrter
    Knopf ohne Erklärung.

    Jetzt setzt das **Verlassen des Feldes** `touched` — bei allen drei Arten.
    Nicht das Tippen: Eine Meldung, die beim ersten Zeichen erscheint, tadelt
    eine Eingabe, die noch niemand beendet hat (SC 3.3.1).

    `!picking`, weil der Weg zum Wähler über das Verlassen des Feldes führt: Der
    Klick auf „Auswählen …" nimmt dem Feld den Fokus, und ohne diese Bedingung
    stünde die Meldung da, während der Benutzer im Systemdialog gerade dabei
    ist, sie zu erledigen.
  */
  const valueError =
    touched && !picking && trimmed.length === 0
      ? `Ohne ${ATTACHMENT_VALUE_LABEL[kind]} lässt sich der Anhang nicht öffnen.`
      : undefined;

  const pick = useCallback(() => {
    setPicking(true);
    setPickerNote(null);
    void chooseAttachmentFile(kind === "image" ? "image" : "file").then((choice) => {
      setPicking(false);
      switch (choice.outcome) {
        case "chosen":
          setValue(choice.path);
          setTouched(true);
          return;
        case "cancelled":
          setPickerNote("Auswahl abgebrochen.");
          return;
        case "unavailable":
          /*
            Kein toter Knopf und kein stiller Fehlschlag: Der Rückfallweg ist
            das Textfeld daneben, und der Grund steht darunter (dieselbe Lehre
            wie am Exportordnerfeld, T-133).
          */
          setPickerNote(`${choice.reason} Tragen Sie den vollständigen Pfad von Hand ein — SuperTakt prüft ihn genauso.`);
      }
    });
  }, [kind]);

  const submit = (): void => {
    setTouched(true);
    if (trimmed.length === 0) return;
    void mutation.run(async () => {
      /*
        Die **unterschiedene Vereinigung** aus `AttachmentCreate` (A-19.10). Der
        Schlüssel des Wertes wechselt mit der Art — `url`, `path`, `sourcePath` —,
        und `tsc` bricht ab, wenn hier zwei davon zugleich stünden.
      */
      const trimmedTitle = title.trim().length === 0 ? null : title.trim();
      await createAttachment(
        todoId,
        kind === "link"
          ? { kind: "link", url: trimmed, title: trimmedTitle }
          : kind === "file"
            ? { kind: "file", path: trimmed, title: trimmedTitle }
            : { kind: "image", sourcePath: trimmed, title: trimmedTitle },
      );
      /*
        Hinzufügen ist **umkehrbar** — also ein Rückweg und keine Rückfrage
        (E-059). Der Rückweg ist der Entfernen-Knopf in der Zeile, und der Toast
        sagt, dass es ihn gibt.
      */
      toasts.success("Anhang hinzugefügt.", "Entfernen über das Papierkorbsymbol in der Zeile.");
      onSaved();
      onClose();
    });
  };

  return (
    <FormDialog
      open={open}
      title="Anhang hinzufügen"
      description="Ein Verweis, ein Bild oder eine Datei, die zu diesem Todo gehört."
      submitLabel="Hinzufügen"
      submitDisabled={trimmed.length === 0}
      busy={mutation.busy}
      error={mutation.error}
      onSubmit={submit}
      onCancel={onClose}
    >
      {/*
        Die Art wird **zuerst** gewählt, und das Feld darunter wechselt mit ihr
        (A-19.10). Optionsknöpfe und nicht drei Knöpfe: Alle drei Werte stehen
        da, und der gewählte ist ohne Klick erkennbar.
      */}
      <RadioRow<AttachmentKind>
        label="Art"
        value={kind}
        onChange={(next) => {
          setKind(next);
          setValue("");
          setTouched(false);
          setPickerNote(null);
        }}
        options={[
          { value: "link", label: "Verweis", hint: "Eine Adresse. SuperTakt merkt sie sich und öffnet sie im Browser." },
          { value: "image", label: "Bild", hint: "SuperTakt legt eine Kopie neben seinen Daten ab und zeigt sie als Vorschaubild." },
          { value: "file", label: "Datei", hint: "Ein Pfad. SuperTakt merkt ihn sich und öffnet die Datei mit der Standardanwendung." },
        ]}
      />

      {kind === "link" ? (
        <TextField
          label={ATTACHMENT_VALUE_LABEL.link}
          value={value}
          onChange={setValue}
          onTouched={() => setTouched(true)}
          required
          maxLength={2048}
          placeholder="https://…"
          hint="Nur „http“ und „https“. SuperTakt speichert die Adresse, nicht die Seite."
          {...(valueError === undefined ? {} : { error: valueError })}
        />
      ) : (
        <div className="attachment-pick">
          <TextField
            label={ATTACHMENT_VALUE_LABEL[kind]}
            value={value}
            onChange={setValue}
            onTouched={() => setTouched(true)}
            required
            maxLength={4096}
            placeholder={kind === "image" ? "Pfad der Bilddatei" : "Vollständiger Pfad zur Datei"}
            hint={
              kind === "image"
                ? "SuperTakt legt eine Kopie neben seinen Daten ab. Verschieben Sie die Quelle später, bleibt das Vorschaubild."
                : "SuperTakt merkt sich den Pfad und kopiert nichts. Verschwindet die Datei, sagt der Anhang das."
            }
            {...(valueError === undefined ? {} : { error: valueError })}
          />
          <Button
            variant="secondary"
            iconStart="folder-open"
            loading={picking}
            onClick={pick}
            className="attachment-pick__button"
          >
            Auswählen …
          </Button>
        </div>
      )}

      {/* Immer im Baum, damit eine Vorlesehilfe die Änderung bemerkt. */}
      <p className="attachment-pick__note" role="status" aria-live="polite">
        {pickerNote}
      </p>

      <TextField
        label="Titel"
        value={title}
        onChange={setTitle}
        maxLength={200}
        hint="Optional. Ohne Titel steht in der Liste ein lesbares Stück der Adresse beziehungsweise des Pfades."
      />
    </FormDialog>
  );
}
