import type { Id } from "../../api/types";
import { getAttachmentImage, type Attachment, type AttachmentKind } from "./api";
import { useAsync } from "../../app/useAsync";
import { ATTACHMENT_KIND_LABEL, attachmentLabel } from "./attachmentLabel";
import { cx } from "../../lib/cx";
import { foreignText, quotedName } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";
import { ForeignName } from "../../shared/ui/ForeignName";
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
 *
 * ===========================================================================
 * Seit T-302: die Herkunft steht an der Zeile, und nichts wird am Ende gekürzt
 * ===========================================================================
 *
 * **Kein Deckel** (A-19.23b, Auflage A-A-93, R-27). Bis T-302 trugen
 * Beschriftung und Wertzeile die Klasse `truncate` — `overflow: hidden`,
 * `text-overflow: ellipsis`, `white-space: nowrap`. In einer engen Spalte nimmt
 * das einem Namen die **Endung**, ohne ein Zeichen zu verändern, und die Zeile
 * darunter ist die, deren Klick ein Programm startet. Beide Zeilen brechen
 * jetzt um ({@link ForeignName}, `.attachment__value`); `scripts/proof-clamp.mjs`
 * mißt, daß hier und in jedem Elternelement keine deckelnde Klasse steht.
 *
 * **Die Herkunft ist eine Eigenschaft, keine Verzierung** (A-A-84, A-A-87). Ein
 * Anhang aus einer E-Mail ist nicht dasselbe wie einer, den der Benutzer selbst
 * gewählt hat: Name und Inhalt bestimmt ein Fremder (R-21). Das steht als
 * eigene Zeile unter der Beschriftung — **nicht** als Symbol allein und nicht
 * nur als Farbe, denn beides ist für eine Vorlesehilfe keine Auskunft.
 *
 * **Der Nachbau steht dabei** (A-19.22b, Auflage A-A-97). Er hängt an der
 * **Datei** und nicht am Augenblick des Anlegens. Ein Hinweis, der nur im
 * Aufgabenbereich erschien, wäre drei Wochen später nirgends — und dann sitzt
 * der Benutzer hier, vor einer Datei, die aussieht wie ein Beleg und keiner
 * ist.
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
/* Fläche F — Herkunft und Nachbau (A-A-84, A-A-87, A-19.22b)           */
/* ==================================================================== */

/**
 * Die **Herkunft** an der Zeile (Auflage A-A-84, A-A-87).
 *
 * ---------------------------------------------------------------------------
 * Warum sie an der Zeile steht und nicht nur in der Rückfrage
 * ---------------------------------------------------------------------------
 *
 * Die Rückfrage nennt sie auch (A-A-85) — aber sie erscheint erst **nach** dem
 * Klick, und bei einem Verweis erscheint sie nach A-A-7 gar nicht. Die Liste
 * ist die Stelle, an der ein Mensch seine Anhänge überblickt: Wer hier nicht
 * sieht, welcher davon aus fremder Hand kam, hat die Unterscheidung aus R-21
 * nicht. Sie ist der ganze Unterschied zwischen „ich habe diese Datei gewählt"
 * und „jemand hat sie mir geschickt".
 *
 * **Der Absender steht dabei.** „Aus einer E-Mail" ist eine Gattung, „von
 * diesem Absender" ist eine Auskunft — und sie ist die, an der ein Mensch
 * erkennt, ob er dieser Datei traut. Er ist fremder Text und geht durch
 * `<Foreign>`.
 *
 * ---------------------------------------------------------------------------
 * Warum das eine eigene Zeile ist und kein Symbol am Rand
 * ---------------------------------------------------------------------------
 *
 * Ein Symbol allein ist für eine Vorlesehilfe keine Auskunft, und eine Farbe
 * allein ist keine (SC 1.4.1). Die Marke trägt deshalb ein **Wort**; das Symbol
 * steht mit `aria-hidden` daneben.
 *
 * Der Nachbau steht **nicht** hier, sondern unmittelbar hinter dem Namen
 * ({@link RebuiltMark}): Er ist eine Aussage über **diese Datei**, nicht über
 * ihren Weg hierher, und der Entwurf des ux-designers stellt ihn dort in
 * Klammern hinter den Namen.
 */
function AttachmentOriginMarks({ attachment }: { readonly attachment: Attachment }) {
  if (attachment.origin !== "email") return null;

  return (
    <span className="attachment__marks">
      <span className="attachment__mark attachment__mark--email">
        <span className="attachment__mark-icon" aria-hidden>
          <Icon name="inbox" size={12} />
        </span>
        {attachment.originSender === null ? (
          <span>Aus einer E-Mail</span>
        ) : (
          <span>
            Aus einer E-Mail von <Foreign value={attachment.originSender} />
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * „(nachgebaut)" — die Kennzeichnung aus A-19.22b, an der Zeile.
 *
 * ---------------------------------------------------------------------------
 * Wortgleich mit dem Aufgabenbereich, und **nicht** im selben Element
 * ---------------------------------------------------------------------------
 *
 * Der Entwurf des ux-designers (F-06 in T-303) verlangt die Wortgleichheit und
 * überläßt die Fläche dem Hauptfenster. Dort steht sie als
 * `– die E-Mail (nachgebaut)`: eine Art des Anhangs, in Klammern hinter dem
 * Namen, in derselben Form wie `(als Verweis)`.
 *
 * Übernommen ist die **Form** und das **Wort**, nicht die Verschmelzung: Im
 * Aufgabenbereich steht vor der Klammer der Satz „die E-Mail", den SuperTakt
 * selbst geschrieben hat. Hier steht der Anzeigename aus fremder Hand, und an
 * ihn ein eigenes Wort anzuhängen hieße, eigenen und fremden Text in **einer**
 * Zeichenkette zu mischen — an genau der Zeile, deren Klick ein Programm
 * startet. Ein Absender, der seine Datei `Nachtrag.eml (nachgebaut)` nennt,
 * hätte damit eine Kennzeichnung erfunden, die er nicht hat. Deshalb ein
 * eigenes Element neben {@link ForeignName} und nicht in ihm.
 *
 * Der Ton ist **Warnung ohne Fehlerfarbe** — dieselbe Wahl wie in Z3a des
 * Entwurfs: Es ist kein Fehlschlag, es fehlt nichts, und wer den Warnton hier
 * verbraucht, hat ihn nicht mehr, wenn wirklich etwas fehlt.
 */
function RebuiltMark() {
  return (
    <span className="attachment__rebuilt">
      <span className="attachment__mark-icon" aria-hidden>
        <Icon name="alert-triangle" size={12} />
      </span>
      (nachgebaut)
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
            /*
              Die Kennzeichnung steht auch im zugänglichen Namen. Ein Wort, das
              nur zu sehen ist, gibt es für eine Vorlesehilfe nicht — und sie
              liest den Namen des Knopfes, nicht die Zeile darum.
            */
            aria-label={`${kind} öffnen: ${quotedName(label)}${
              attachment.rebuilt ? " (nachgebaut)" : ""
            }`}
          >
            <ForeignName className="attachment__label" value={label} />
            {attachment.rebuilt ? <RebuiltMark /> : null}
          </button>
        ) : (
          <>
            <ForeignName className="attachment__label" value={label} />
            {attachment.rebuilt ? <RebuiltMark /> : null}
          </>
        )}

        <AttachmentOriginMarks attachment={attachment} />

        {/*
          Der volle Wert steht in einer zweiten, kleineren Zeile — bei einer
          Datei ist der Pfad die einzige Auskunft darüber, was gleich startet.
          Bei einem Bild bleibt er weg: Dort steht der **erzeugte** Name der
          Kopie (Auflage A-A-17), und der sagt niemandem etwas.
        */}
        {attachment.kind === "image" ? (
          <span className="attachment__value muted">{kind}</span>
        ) : (
          /*
            **Ohne `truncate`** (A-A-93): Bei einer Datei ist das der Pfad, der
            gleich an die Standardanwendung geht, und sein Ende entscheidet.
            Bei einem Verweis steht hier der Wirt, und A-A-87 verlangt ihn
            **vor** dem Klick sichtbar — ein Deckel nähme ihn bei einer langen
            Adresse als erstes weg. Das `title` bleibt: Es ist die zweite
            Auskunft für den Zeiger, keine Ersatz für die erste.
          */
          <span className="attachment__value muted" title={foreignText(attachment.target)}>
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
