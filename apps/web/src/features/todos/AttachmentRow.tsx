import type { Id } from "../../api/types";
import { getAttachmentImage, type Attachment, type AttachmentKind } from "./api";
import { useAsync } from "../../app/useAsync";
import { ATTACHMENT_KIND_LABEL, attachmentLabel } from "./attachmentLabel";
import { cx } from "../../lib/cx";
import { foreignText, quotedName } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";
import { Icon, type IconName } from "../../shared/ui/Icon";
import { IconButton, Skeleton } from "../../shared/ui/Primitives";

/**
 * Takt — eine Zeile der Anhangsliste samt Vorschaubild (A-19.12 bis A-19.15).
 *
 * Drei der fünf Flächen aus {@link Attachments} stehen hier, weil sie
 * **dieselbe Zeile** sind: die Beschriftung (C), das Vorschaubild eines
 * Bildanhangs (D) und der Grund, aus dem das letzte Öffnen scheiterte (E).
 * Die Zeile hält keinen Zustand und ruft nichts an außer den Bytes ihres
 * eigenen Vorschaubildes; **geöffnet wird ausschließlich über die
 * Rückmeldungen nach oben** — das Laden einer Liste öffnet nichts (A-19.18,
 * Auflage A-A-24).
 */

const KIND_ICON: Readonly<Record<AttachmentKind, IconName>> = {
  link: "link",
  image: "image",
  file: "folder",
};

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

export function AttachmentRow({ todoId, attachment, onOpen, onRemove, failure, busy }: AttachmentRowProps) {
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
