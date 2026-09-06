import { useCallback, useEffect, useState } from "react";

import {
  createAttachment,
  deleteAttachment,
  getAttachmentImage,
  listAttachments,
} from "../api/endpoints";
import type { Attachment, AttachmentKind, ForeignText, Id } from "../api/types";
import {
  chooseAttachmentFile,
  openAttachmentFile,
  openAttachmentLink,
  type AttachmentOpen,
} from "../app/connection";
import { useAsync, useMutation } from "../app/useAsync";
import { useToasts } from "../app/ToastContext";
import {
  ATTACHMENT_KIND_LABEL,
  ATTACHMENT_VALUE_LABEL,
  attachmentLabel,
  foreseeableRefusalOf,
} from "../lib/attachmentLabel";
import { cx } from "../lib/cx";
import { foreignText, quotedName } from "../lib/foreign";
import { AttachmentOpenDialog } from "./AttachmentOpenDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { Foreign } from "./Foreign";
import { FormDialog, TextField } from "./FormDialog";
import { Icon, type IconName } from "./Icon";
import { Button, EmptyState, IconButton, InlineMessage, LoadingBlock, Skeleton } from "./Primitives";
import { RadioRow } from "./RadioRow";

/**
 * Takt — Anhänge am Todo (A-19.8 bis A-19.15, E-071, E-072).
 *
 * ===========================================================================
 * Fünf Flächen, und jede hat ihre fünf Zustände (Spezifikation Abschnitt 15)
 * ===========================================================================
 *
 * **A — der Bereich** ({@link Attachments}). Leer, lädt, Zeiger, Fokus, Fehler.
 * Der Fehlerfall ist der, den man am leichtesten falsch baut: Ließ sich die
 * Liste nicht laden, wird die Karte **nicht** ausgeblendet — sonst sähe „keine
 * Anhänge" genauso aus wie „nicht geladen", und genau das verbietet A-19.15 für
 * den einzelnen Anhang.
 *
 * **B — Hinzufügen** ({@link AttachmentFormDialog}). Die **Art wird zuerst
 * gewählt**, und das Pflichtfeld darunter wechselt mit ihr (A-19.10).
 * Voreinstellung ist **Verweis** — die harmloseste der drei und die einzige,
 * die kein Öffnen auf dem Rechner auslöst.
 *
 * **C — die Liste** ({@link AttachmentRow}). Titel oder Ersatzbezeichnung, nie
 * eine leere Zeile (A-19.12). Die Art steht als Symbol **und** als Wort im
 * zugänglichen Namen: Ein Symbol allein ist für eine Vorlesehilfe keine Art.
 *
 * **D — das Vorschaubild** ({@link AttachmentPreview}). Die Fläche steht in
 * ihrer Größe da, **bevor** das Bild kommt — sonst springt das Layout. Kein
 * Vergrößern beim Überfahren: A-19.18 verlangt, dass nichts als Nebenwirkung
 * geschieht, und eine Lupe beim Überfahren ist genau das.
 *
 * **E — der Anhang, der sich nicht öffnen lässt.** Er **verschwindet nicht**
 * und **wirft nicht** (A-19.15). Er sagt es in seiner eigenen Zeile — nicht im
 * Meldungsstapel: Der liegt seit T-110 hinter der Abdunklung, solange ein
 * Dialog steht, und diese Liste kann in einem Dialog liegen.
 *
 * ===========================================================================
 * Was hier **nicht** geschieht
 * ===========================================================================
 *
 * **Nichts öffnet sich von selbst** (A-19.18, Auflage A-A-24). Kein
 * Vorabholen, keine Vorschau, die im Hintergrund etwas startet, keine
 * Nebenwirkung beim Laden. Die einzige Anzeige, die ohne Handlung des Benutzers
 * entsteht, ist das Vorschaubild — und es startet nichts.
 *
 * **Die Prüfung im Eingabefeld ist Bedienkomfort, nicht die Sicherung.** Sie
 * sagt dem Benutzer sofort, dass seine Eingabe nichts taugt. Die Kontrolle
 * sitzt im Öffnen-Befehl der Hülle, bei jedem Aufruf (E-072 Punkt 2): Zwischen
 * Eingabe und Öffnen liegen der Bestand, eine Migration und jeder künftige
 * zweite Schreibpfad. Ein Feld, das gut prüft, verführt dazu, die zweite
 * Prüfung für Verdopplung zu halten.
 *
 * **Über das Add-in entsteht hier nichts** (A-19.19). Diese Routen liegen
 * außerhalb von `/addin` und sind damit von selbst geschlossen
 * (Auflage A-A-21).
 */

const KIND_ICON: Readonly<Record<AttachmentKind, IconName>> = {
  link: "link",
  image: "image",
  file: "folder",
};

/**
 * Die deutschen Sätze zu den technischen Schlüsseln aus
 * `src-tauri/src/attachment.rs`.
 *
 * **Der abgewiesene Wert steht in keinem davon** (Auflage A-A-8) — er ist
 * fremder Text, und ein abgewiesener Wert in einer Meldung wäre derselbe fremde
 * Text an einer neuen Stelle. Der Wert steht ohnehin in der Zeile darüber; wer
 * ihn sehen will, sieht ihn dort, behandelt.
 *
 * Zwei Sorten Satz, und der Unterschied ist Absicht: „Diese Datei ist an diesem
 * Pfad nicht mehr vorhanden" ist eine **Beobachtung**, „Takt öffnet nur `http`
 * und `https`" ist eine **Regel**. Ohne den ausgeschriebenen Grund sähe die
 * zweite wie eine Störung aus (R-22).
 */
const REFUSAL_TEXT: Readonly<Record<string, string>> = {
  link_empty: "Dieser Verweis hat keine Adresse.",
  link_too_long: "Diese Adresse ist zu lang, um sie zu öffnen.",
  link_control_character: "Diese Adresse enthält unsichtbare Steuerzeichen. Takt öffnet sie nicht.",
  link_unparsable: "Diese Adresse lässt sich nicht lesen.",
  link_scheme_rejected:
    "Diese Adresse lässt sich nicht öffnen: Takt öffnet nur „http“ und „https“. Ein Netzwerkpfad ist keine Adresse, sondern eine Anmeldung an einem fremden Rechner.",
  link_not_normalized:
    "Diese Adresse steht nicht in der Form, die Takt beim Anlegen erzeugt. Sie wird nicht geöffnet — sonst stünde hier eine andere Adresse, als geöffnet würde.",
  link_no_host: "Dieser Adresse fehlt der Rechnername.",
  link_userinfo:
    "Diese Adresse trägt Zugangsdaten vor dem Rechnernamen. Sie sieht dann nach einem anderen Ziel aus, als sie ansteuert, und wird nicht geöffnet.",
  path_empty: "Dieser Anhang hat keinen Pfad.",
  path_too_long: "Dieser Pfad ist zu lang, um ihn zu öffnen.",
  path_control_character: "Dieser Pfad enthält unsichtbare Steuerzeichen. Takt öffnet ihn nicht.",
  path_unc:
    "Dieser Pfad zeigt auf eine Netzwerkfreigabe. Takt öffnet keine, weil ein solcher Zugriff zugleich eine Anmeldung an einem fremden Rechner ist.",
  path_not_absolute: "Dieser Pfad ist nicht vollständig. Takt öffnet nur vollständige Pfade.",
  path_stream_separator:
    "Der Dateiname trägt einen Doppelpunkt. Unter Windows benennt er einen zweiten Datenstrom derselben Datei — geöffnet würde dann nicht das, was hier steht. Takt öffnet ihn deshalb nicht.",
  path_indirect_extension:
    "Diese Datei ist eine Verknüpfung. Ihr Ziel steht woanders — die Rückfrage könnte darüber nicht die Wahrheit sagen, deshalb öffnet Takt sie nicht.",
  path_missing: "Diese Datei ist an diesem Pfad nicht mehr vorhanden.",
};

/**
 * Der Satz zu einer Absage, die **vor** dem Klick feststeht (V-07). `null`,
 * wenn nichts dagegen spricht.
 *
 * Es ist dieselbe Zuordnung wie für die Absage nach dem Klick — derselbe Grund
 * bekommt denselben Satz, gleich an welcher Stelle er auftaucht. Vorhergesagt
 * wird der Schlüssel, nicht der Satz: {@link foreseeableRefusalOf} liest die
 * Endungen aus `@takt/domain` und schreibt sie nicht ab.
 */
function foreseenRefusalText(target: ForeignText): string | null {
  const key = foreseeableRefusalOf(target);
  if (key === null) return null;
  return REFUSAL_TEXT[key] ?? null;
}

/** Der Satz zu einem Ausgang der Hülle. `null`, wenn alles gut ging. */
function refusalText(result: AttachmentOpen): string | null {
  switch (result.outcome) {
    case "opened":
      return null;
    case "rejected":
      return (
        REFUSAL_TEXT[result.reason] ??
        "Takt hat das Öffnen abgewiesen. Der Anhang bleibt bestehen; der Grund lässt sich hier nicht genauer benennen."
      );
    case "failed":
      return "Das Öffnen ist fehlgeschlagen. Möglicherweise ist auf diesem Rechner keine Anwendung dafür eingerichtet.";
    case "unavailable":
      return result.reason;
  }
}

/* ==================================================================== */
/* Fläche D — das Vorschaubild (A-19.13)                                */
/* ==================================================================== */

/**
 * Das Vorschaubild eines Bildanhangs.
 *
 * Die Bytes kommen **fertig kodiert** über die schon erlaubte Verbindung zu
 * `127.0.0.1:17843`; hier entsteht daraus eine `data:`-Adresse durch
 * Zusammensetzen — es wird nichts kodiert und nichts gerechnet (A-8.4 liegt in
 * der Domäne). `img-src 'self' data:` bleibt unverändert (Auflage A-A-12).
 *
 * Warum nicht unmittelbar `<img src="http://127.0.0.1:17843/…">`: Ein `<img
 * src>` trägt **kein** `X-Takt-Token`. Der Weg bräuchte deshalb eine
 * unauthentifizierte Byte-Route oder ein Geheimnis in der Adresse (T-145-9).
 */
function AttachmentPreview({ todoId, attachment }: { readonly todoId: Id; readonly attachment: Attachment }) {
  const image = useAsync(async () => getAttachmentImage(todoId, attachment.id), [todoId, attachment.id]);
  const label = attachmentLabel(attachment);

  if (image.state.status === "loading") {
    // Die Fläche steht **vorher** da, in der bekannten Größe. Kommt das Bild,
    // springt nichts (Fläche D, Zustand „lädt").
    return (
      <span className="attachment__preview attachment__preview--pending">
        <Skeleton width="100%" height="100%" radius="var(--radius-sm)" />
      </span>
    );
  }

  if (image.state.status === "error") {
    /*
      A-19.15: Der Anhang **verschwindet nicht**. An der Stelle des Bildes steht
      ein Feld mit dem Satz — kein kaputtes Bildsymbol, das aussieht wie ein
      Fehler des Browsers.
    */
    return (
      <span className="attachment__preview attachment__preview--broken" role="img" aria-label={`Vorschaubild nicht lesbar: ${foreignText(label)}`}>
        <Icon name="alert-triangle" size={16} />
        <span className="attachment__preview-note">Nicht mehr lesbar</span>
      </span>
    );
  }

  return (
    <span className="attachment__preview">
      <img
        className="attachment__image"
        src={`data:${image.state.value.mediaType};base64,${image.state.value.base64}`}
        /*
          Der Titel des Anhangs ist fremder Text und geht durch `foreignText` —
          `alt` ist ein Textattribut und wird vorgelesen.
        */
        alt={`Vorschaubild: ${foreignText(label)}`}
      />
    </span>
  );
}

/* ==================================================================== */
/* Fläche C und E — eine Zeile                                          */
/* ==================================================================== */

interface AttachmentRowProps {
  readonly todoId: Id;
  readonly attachment: Attachment;
  readonly onOpen: () => void;
  readonly onRemove: () => void;
  /** Der Grund, aus dem das letzte Öffnen scheiterte. Bleibt in der Zeile stehen. */
  readonly failure: string | null;
  readonly busy: boolean;
}

function AttachmentRow({ todoId, attachment, onOpen, onRemove, failure, busy }: AttachmentRowProps) {
  const label = attachmentLabel(attachment);
  const kind = ATTACHMENT_KIND_LABEL[attachment.kind];
  const openable = attachment.kind !== "image";

  return (
    <li className={cx("attachment", `attachment--${attachment.kind}`, failure !== null && "attachment--failed")}>
      {attachment.kind === "image" ? (
        <AttachmentPreview todoId={todoId} attachment={attachment} />
      ) : (
        <span className="attachment__icon" aria-hidden>
          <Icon name={KIND_ICON[attachment.kind]} size={16} />
        </span>
      )}

      <span className="attachment__main">
        {openable ? (
          /*
            Das Öffnen **ist** die Zeile — ein Knopf und kein `<a href>`: Ein
            Anker im Webview führte am Öffnen-Befehl der Hülle vorbei, und die
            CSP kennt für ihn ohnehin kein Ziel.

            Der zugängliche Name nennt die **Art als Wort** („Verweis öffnen:
            …"). Ein Symbol allein ist für eine Vorlesehilfe keine Art.
          */
          <button
            type="button"
            className="attachment__open"
            onClick={onOpen}
            disabled={busy}
            aria-label={`${kind} öffnen: ${quotedName(label)}`}
          >
            <Foreign className="attachment__label truncate" value={label} />
          </button>
        ) : (
          <Foreign className="attachment__label truncate" value={label} />
        )}

        {/*
          Der volle Wert steht in einer zweiten, kleineren Zeile — bei einer
          Datei ist der Pfad die einzige Auskunft darüber, was gleich startet.
          Bei einem Bild bleibt er weg: Dort steht der **erzeugte** Name der
          Kopie (Auflage A-A-17), und der sagt niemandem etwas.
        */}
        {attachment.kind === "image" ? (
          <span className="attachment__value muted">{kind}</span>
        ) : (
          <span className="attachment__value muted truncate" title={foreignText(attachment.target)}>
            <Foreign value={attachment.target} />
          </span>
        )}

        {/*
          Fläche E: der Grund steht **in der Zeile**. Kein „Erneut versuchen"
          bei einer verschwundenen Datei — es gibt nichts zu wiederholen.
        */}
        <span className="live-region" role="status">
          {failure === null ? null : (
            <span className="attachment__failure">
              <Icon name="alert-triangle" size={13} />
              <span>{failure}</span>
            </span>
          )}
        </span>
      </span>

      <IconButton
        label={`${kind} entfernen: ${quotedName(label)}`}
        icon="trash"
        size="sm"
        className="attachment__remove"
        onClick={onRemove}
        disabled={busy}
      />
    </li>
  );
}

/* ==================================================================== */
/* Fläche B — Hinzufügen (A-19.10)                                      */
/* ==================================================================== */

interface AttachmentFormDialogProps {
  readonly open: boolean;
  readonly todoId: Id;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

function AttachmentFormDialog({ open, todoId, onClose, onSaved }: AttachmentFormDialogProps) {
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
          setPickerNote(`${choice.reason} Tragen Sie den vollständigen Pfad von Hand ein — Takt prüft ihn genauso.`);
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
          { value: "link", label: "Verweis", hint: "Eine Adresse. Takt merkt sie sich und öffnet sie im Browser." },
          { value: "image", label: "Bild", hint: "Takt legt eine Kopie neben seinen Daten ab und zeigt sie als Vorschaubild." },
          { value: "file", label: "Datei", hint: "Ein Pfad. Takt merkt ihn sich und öffnet die Datei mit der Standardanwendung." },
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
          hint="Nur „http“ und „https“. Takt speichert die Adresse, nicht die Seite."
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
                ? "Takt legt eine Kopie neben seinen Daten ab. Verschieben Sie die Quelle später, bleibt das Vorschaubild."
                : "Takt merkt sich den Pfad und kopiert nichts. Verschwindet die Datei, sagt der Anhang das."
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

/* ==================================================================== */
/* Fläche A — der Bereich (A-19.11)                                     */
/* ==================================================================== */

export interface AttachmentsProps {
  readonly todoId: Id;
  /** Titel des Todos — für die Rückfrage beim Entfernen. */
  readonly todoTitle: ForeignText;
  /** Wird erhöht, wenn anderswo geschrieben wurde. */
  readonly version?: number;
}

export function Attachments({ todoId, todoTitle, version = 0 }: AttachmentsProps) {
  const toasts = useToasts();
  const list = useAsync(async () => listAttachments(todoId), [todoId], [version]);

  const [formOpen, setFormOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState<Attachment | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Attachment | null>(null);
  const [opening, setOpening] = useState(false);
  const [dialogRefusal, setDialogRefusal] = useState<string | null>(null);
  /** Je Anhang der Grund, aus dem das letzte Öffnen scheiterte (Fläche E). */
  const [failures, setFailures] = useState<ReadonlyMap<Id, string>>(new Map());
  const removal = useMutation();

  const noteFailure = useCallback((id: Id, message: string | null) => {
    setFailures((previous) => {
      const next = new Map(previous);
      if (message === null) next.delete(id);
      else next.set(id, message);
      return next;
    });
  }, []);

  /**
   * Öffnen — der einzige Weg nach draußen, und er beginnt mit einem Klick.
   *
   * Ein **Verweis** geht ohne Rückfrage (Auflage A-A-7). Eine **Datei** geht
   * durch {@link AttachmentOpenDialog}. Ein **Bild** kommt hier nie an: Es
   * öffnet nichts nach draußen (E-072 Punkt 2), und die Zeile hat für es
   * keinen Öffnen-Knopf.
   */
  const open = useCallback(
    (attachment: Attachment) => {
      noteFailure(attachment.id, null);
      if (attachment.kind === "file") {
        setDialogRefusal(null);
        setPendingOpen(attachment);
        return;
      }
      if (attachment.kind !== "link") return;
      setOpening(true);
      void openAttachmentLink(attachment.target).then((result) => {
        setOpening(false);
        noteFailure(attachment.id, refusalText(result));
      });
    },
    [noteFailure],
  );

  const confirmOpen = useCallback(() => {
    const attachment = pendingOpen;
    if (attachment === null) return;
    setOpening(true);
    setDialogRefusal(null);
    void openAttachmentFile(attachment.target).then((result) => {
      setOpening(false);
      const problem = refusalText(result);
      if (problem === null) {
        setPendingOpen(null);
        return;
      }
      /*
        **Der Dialog bleibt stehen** und nennt den Grund. Er schließt sich
        nicht, als wäre etwas geschehen. Zusätzlich merkt sich die Zeile den
        Grund, damit er nach dem Schließen nicht verloren ist (A-19.15).
      */
      setDialogRefusal(problem);
      noteFailure(attachment.id, problem);
    });
  }, [pendingOpen, noteFailure]);

  const remove = useCallback(() => {
    const attachment = pendingRemove;
    if (attachment === null) return;
    void removal.run(async () => {
      await deleteAttachment(todoId, attachment.id);
      setPendingRemove(null);
      noteFailure(attachment.id, null);
      list.reload();
      toasts.success("Anhang entfernt.", `${quotedName(attachmentLabel(attachment))} gehört nicht mehr zu diesem Todo.`);
    });
  }, [pendingRemove, removal, todoId, list, noteFailure, toasts]);

  return (
    <>
      <div className="attachments">
        {list.state.status === "loading" ? (
          /* Zustand „lädt": Skelettzeilen im Bereich, kein Ladeanzeiger über
             der ganzen Karte. */
          <LoadingBlock label="Anhänge werden geladen" rows={3} />
        ) : list.state.status === "error" ? (
          /*
            Zustand „Fehler": **nicht** ausblenden. Sonst sähe „keine Anhänge"
            genauso aus wie „nicht geladen" — der Fehler, den A-19.15 für den
            einzelnen Anhang ausdrücklich verbietet.
          */
          <InlineMessage
            tone="danger"
            title="Die Anhänge ließen sich nicht laden"
            action={
              <Button variant="secondary" iconStart="rotate-ccw" onClick={list.reload}>
                Erneut versuchen
              </Button>
            }
          >
            {list.state.message}
          </InlineMessage>
        ) : list.state.value.items.length === 0 ? (
          <EmptyState
            icon="paperclip"
            compact
            title="Keine Anhänge"
            /*
              Der zweite Satz gehört genau hierhin: Er ist die Erwartung, an der
              sonst A-19.15 scheitert — wer glaubt, Takt hebe die Datei auf,
              hält ihr Verschwinden für einen Fehler von Takt.
            */
            description="Ein Verweis, ein Bild oder eine Datei, die zu diesem Todo gehört. Takt kopiert nur Bilder; Verweise und Dateien merkt es sich als Adresse beziehungsweise Pfad."
            action={
              <Button variant="secondary" iconStart="plus" onClick={() => setFormOpen(true)}>
                Anhang hinzufügen
              </Button>
            }
          />
        ) : (
          <>
            <ul className="attachment-list" aria-label="Anhänge">
              {list.state.value.items.map((attachment) => (
                <AttachmentRow
                  key={attachment.id}
                  todoId={todoId}
                  attachment={attachment}
                  onOpen={() => open(attachment)}
                  onRemove={() => setPendingRemove(attachment)}
                  failure={failures.get(attachment.id) ?? null}
                  busy={opening}
                />
              ))}
            </ul>
            <Button variant="ghost" iconStart="plus" onClick={() => setFormOpen(true)}>
              Anhang hinzufügen
            </Button>
          </>
        )}
      </div>

      <AttachmentFormDialog
        open={formOpen}
        todoId={todoId}
        onClose={() => setFormOpen(false)}
        onSaved={list.reload}
      />

      <AttachmentOpenDialog
        open={pendingOpen !== null}
        path={pendingOpen?.target ?? ""}
        foreseenRefusal={pendingOpen === null ? null : foreseenRefusalText(pendingOpen.target)}
        refusal={dialogRefusal}
        busy={opening}
        onConfirm={confirmOpen}
        onCancel={() => {
          setPendingOpen(null);
          setDialogRefusal(null);
        }}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Anhang entfernen"
        description={
          pendingRemove === null
            ? ""
            : `${quotedName(attachmentLabel(pendingRemove))} gehört danach nicht mehr zu ${quotedName(todoTitle)}.`
        }
        consequence={
          pendingRemove?.kind === "image"
            ? "Die Kopie des Bildes im Datenverzeichnis von Takt wird mit gelöscht. Die Datei, aus der sie stammt, bleibt unberührt."
            : "Takt vergisst die Adresse beziehungsweise den Pfad. Die Datei oder die Seite dahinter bleibt unberührt."
        }
        refusal={removal.error}
        confirmLabel="Entfernen"
        tone="danger"
        busy={removal.busy}
        onConfirm={remove}
        onCancel={() => {
          setPendingRemove(null);
          removal.clearError();
        }}
      />
    </>
  );
}
