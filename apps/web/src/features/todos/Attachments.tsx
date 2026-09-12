import { useCallback, useState } from "react";

import {
  deleteAttachment,
  listAttachments,
} from "./api";
import type {
  ForeignText,
  Id,
} from "../../api/types";
import type { Attachment } from "./api";
import {
  openAttachmentFile,
  openAttachmentLink,
  type AttachmentOpen,
} from "../../app/connection";
import { useAsync, useMutation } from "../../app/useAsync";
import { useToasts } from "../../app/ToastContext";
import { attachmentLabel, foreseeableRefusalOf } from "./attachmentLabel";
import { quotedName } from "../../lib/foreign";
import { AttachmentFormDialog } from "./AttachmentFormDialog";
import { AttachmentOpenDialog } from "./AttachmentOpenDialog";
import { AttachmentRow } from "./AttachmentRow";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Button, EmptyState, InlineMessage, LoadingBlock } from "../../shared/ui/Primitives";

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
 * **D — das Vorschaubild** (`AttachmentPreview` in `AttachmentRow.tsx`). Die
 * Fläche steht in ihrer Größe da, **bevor** das Bild kommt — sonst springt das
 * Layout. Kein Vergrößern beim Überfahren: A-19.18 verlangt, dass nichts als
 * Nebenwirkung geschieht, und eine Lupe beim Überfahren ist genau das.
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
 * **Über das Add-in entsteht hier nichts.** Diese Routen liegen außerhalb von
 * `/addin` und sind damit von selbst geschlossen (Auflage A-A-21). Seit E-108
 * entstehen Anhänge über den Aufgabenbereich beim **Anlegen** eines Todos aus
 * einer E-Mail (A-19.19 in der Fassung vom 2026-09-11) — an einem bereits
 * vorhandenen Todo weiterhin nicht, und diese Fläche ist genau die für ein
 * vorhandenes.
 *
 * ===========================================================================
 * Was ein Anhang aus einer E-Mail hier anders macht (T-302)
 * ===========================================================================
 *
 * Nichts am Ablauf, alles an der Auskunft. Die Zeile nennt Herkunft und
 * Nachbau (`AttachmentRow`), die Rückfrage nennt beides noch einmal und dazu
 * den Anzeigenamen aus der E-Mail und die abgesetzte Endung (A-A-85, A-A-86,
 * A-A-97). Geöffnet wird weiterhin ausschließlich über den Befehl der Hülle,
 * der bei **jedem** Aufruf prüft — zwischen Übernahme und Öffnen liegt der
 * Bestand (E-072).
 */

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
  link_control_character: "Diese Adresse enthält unsichtbare Steuerzeichen. SuperTakt öffnet sie nicht.",
  link_unparsable: "Diese Adresse lässt sich nicht lesen.",
  link_scheme_rejected:
    "Diese Adresse lässt sich nicht öffnen: SuperTakt öffnet nur „http“ und „https“. Ein Netzwerkpfad ist keine Adresse, sondern eine Anmeldung an einem fremden Rechner.",
  link_not_normalized:
    "Diese Adresse steht nicht in der Form, die SuperTakt beim Anlegen erzeugt. Sie wird nicht geöffnet — sonst stünde hier eine andere Adresse, als geöffnet würde.",
  link_no_host: "Dieser Adresse fehlt der Rechnername.",
  link_userinfo:
    "Diese Adresse trägt Zugangsdaten vor dem Rechnernamen. Sie sieht dann nach einem anderen Ziel aus, als sie ansteuert, und wird nicht geöffnet.",
  path_empty: "Dieser Anhang hat keinen Pfad.",
  path_too_long: "Dieser Pfad ist zu lang, um ihn zu öffnen.",
  path_control_character: "Dieser Pfad enthält unsichtbare Steuerzeichen. SuperTakt öffnet ihn nicht.",
  path_unc:
    "Dieser Pfad zeigt auf eine Netzwerkfreigabe. SuperTakt öffnet keine, weil ein solcher Zugriff zugleich eine Anmeldung an einem fremden Rechner ist.",
  path_not_absolute: "Dieser Pfad ist nicht vollständig. SuperTakt öffnet nur vollständige Pfade.",
  path_stream_separator:
    "Der Dateiname trägt einen Doppelpunkt. Unter Windows benennt er einen zweiten Datenstrom derselben Datei — geöffnet würde dann nicht das, was hier steht. SuperTakt öffnet ihn deshalb nicht.",
  path_indirect_extension:
    "Diese Datei ist eine Verknüpfung. Ihr Ziel steht woanders — die Rückfrage könnte darüber nicht die Wahrheit sagen, deshalb öffnet SuperTakt sie nicht.",
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
        "SuperTakt hat das Öffnen abgewiesen. Der Anhang bleibt bestehen; der Grund lässt sich hier nicht genauer benennen."
      );
    case "failed":
      return "Das Öffnen ist fehlgeschlagen. Möglicherweise ist auf diesem Rechner keine Anwendung dafür eingerichtet.";
    case "unavailable":
      return result.reason;
  }
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
            description="Ein Verweis, ein Bild oder eine Datei, die zu diesem Todo gehört. SuperTakt kopiert nur Bilder; Verweise und Dateien merkt es sich als Adresse beziehungsweise Pfad."
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

      {/*
        Die vier neuen Angaben gehen **aus dem Bestand** in die Rückfrage und
        nicht aus dem Augenblick (A-A-84, A-A-97): Sie hängen am Anhang, den der
        Benutzer angeklickt hat, und stehen deshalb noch da, wenn die E-Mail
        drei Wochen alt ist.
      */}
      <AttachmentOpenDialog
        open={pendingOpen !== null}
        path={pendingOpen?.target ?? ""}
        displayName={pendingOpen?.displayName ?? null}
        originSender={pendingOpen?.originSender ?? null}
        fromEmail={pendingOpen?.origin === "email"}
        rebuilt={pendingOpen?.rebuilt ?? false}
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
            ? "Die Kopie des Bildes im Datenverzeichnis von SuperTakt wird mit gelöscht. Die Datei, aus der sie stammt, bleibt unberührt."
            : "SuperTakt vergisst die Adresse beziehungsweise den Pfad. Die Datei oder die Seite dahinter bleibt unberührt."
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
