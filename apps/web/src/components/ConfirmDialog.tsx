import { useEffect, useId, useState, type ReactNode } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { cx } from "../lib/cx";
import { touchedOnBlur } from "../lib/touched";
import { DialogSurface } from "./DialogSurface";
import { Icon } from "./Icon";
import { Button } from "./Primitives";

/**
 * Bestaetigungsdialog — Abschnitt 15, E-012, R-10.
 *
 * Der Dialog sagt aus, was passiert, nicht ob man sicher ist. Fuer den
 * folgenreichsten Fall des Produkts — das Zuruecksetzen eines Exportstatus,
 * aus dem eine Doppelabrechnung entstehen kann — gibt es zusaetzlich eine
 * ausdrueckliche Bestaetigung per Kontrollkaestchen.
 *
 * Fokus: Beim Oeffnen springt der Fokus in den Dialog, der Tabulator bleibt
 * darin gefangen, Escape schliesst, und der Fokus kehrt danach zu dem
 * Element zurueck, das den Dialog geoeffnet hat. Seit T-152 fuehrt das die
 * Zustandsmaschine unter {@link DialogSurface} (E-076 Stufe 1); die Rolle
 * bleibt `alertdialog`, der zugaengliche Name bleibt der Titel.
 *
 * **Es gibt hier kein Schliesskreuz, und das ist beabsichtigt.** Fuer
 * `role="alertdialog"` waehlt die Zustandsmaschine ohne weitere Angabe das
 * Schliesskreuz als erstes Ziel des Fokus. Weil es keines gibt, faellt sie auf
 * das erste tabulierbare Element im Kasten zurueck — dieselbe Wahl, die
 * `focusFirstWithin` vorher getroffen hat.
 */
export type ConfirmTone = "default" | "danger";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  /** Was der Dialog tut, in einem Satz. */
  readonly description: ReactNode;
  /** Was danach anders ist. Erscheint hervorgehoben. Steht beim Oeffnen da. */
  readonly consequence?: ReactNode;
  /**
   * Die **Absage des Dienstes**, nachdem der Benutzer bestaetigt hat (B-5 aus
   * T-116, SC 4.1.3).
   *
   * Getrennt von {@link consequence}, weil die beiden zu verschiedenen
   * Zeitpunkten entstehen und deshalb verschieden angesagt werden muessen:
   *
   *  - Die **Vorwarnung** steht beim Oeffnen da. Sie liegt in
   *    `aria-describedby` und wird zusammen mit dem Titel vorgelesen.
   *  - Die **Absage** kommt danach, waehrend der Dialog steht. Eine
   *    Beschreibung wird **nicht erneut** vorgelesen, wenn sie sich aendert —
   *    bis T-118 hoerte eine Vorlesehilfe deshalb nur den neuen Knopfnamen
   *    („Erneut versuchen") und kein Wort davon, **warum**. Der Satz mit den
   *    Regelnamen aus W-11, der eigens dafuer gebaut wurde, kam bei ihr nie an.
   *
   * Ist `refusal` gesetzt, tritt sie an die Stelle der Vorwarnung: Zwei
   * Kaesten, von denen einer nicht mehr gilt, sind schlechter als einer.
   */
  readonly refusal?: ReactNode;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly tone?: ConfirmTone;
  /** Verlangt ein gesetztes Kontrollkaestchen, bevor bestaetigt werden kann. */
  readonly acknowledgeLabel?: string;
  /**
   * Beschriftung eines Freitextfeldes fuer die Begruendung. Wird gesetzt, wenn
   * die Fachlogik einen Grund protokolliert — beim Zuruecksetzen des
   * Exportstatus etwa `ZuruecksetzenAntrag.grund` (E-012, R-10).
   */
  readonly reasonLabel?: string;
  readonly reasonRequired?: boolean;
  readonly busy?: boolean;
  readonly onConfirm: (reason: string) => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  consequence,
  refusal,
  confirmLabel,
  cancelLabel = "Abbrechen",
  tone = "default",
  acknowledgeLabel,
  reasonLabel,
  reasonRequired = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const fieldId = useId();
  const reasonId = `${fieldId}-reason`;
  const reasonErrorId = `${fieldId}-reason-error`;
  const [acknowledged, setAcknowledged] = useState(false);
  const [reason, setReason] = useState("");
  /**
   * Wurde das Begruendungsfeld schon einmal verlassen? (Befund Z-16 aus T-177.)
   *
   * Bis dahin war die Pflicht-Begruendung das einzige `required`-Feld des
   * Produkts **ohne jede** Meldung: Es steht in keinem `<form>`, also hat die
   * Pruefung des Browsers hier nie gegriffen und `noValidate` nimmt ihr nichts
   * — sichtbar war allein ein gesperrter Bestaetigungsknopf. Ein toter Knopf
   * ohne Satz, und das in dem einen Fluss, hinter dem Geld liegt (E-012, R-10).
   *
   * Der Ausloeser ist das **Verlassen nach einer Eingabe** — Regel P-8, in
   * {@link touchedOnBlur}. Nicht das Tippen: Eine Meldung beim ersten Zeichen
   * tadelt eine Eingabe, die noch niemand beendet hat (SC 3.3.1). Und seit
   * T-186 auch nicht das blosse Durchqueren: Ein Tabulator durch das leere Feld
   * eines gerade geoeffneten Dialogs tadelte bis dahin, bevor der Benutzer ein
   * Zeichen getippt hatte (Befund O-FY).
   *
   * **Der zweite Ausloeser ist der Knopf selbst, und er ist neu.** Bis T-186
   * deckte das Verlassen zwei Wege ab: das Weitertabben **und** den Klick auf
   * den gesperrten Knopf — der nahm dem Feld den Fokus ebenfalls. P-8 macht
   * aus diesem `blur` keine Beruehrung mehr, und damit waere der Dialog wieder
   * „gesperrt und stumm" gewesen: genau Z-16.
   *
   * Deshalb ist der Bestaetigungsknopf seit T-186 **nicht** mehr `disabled`,
   * sondern `aria-disabled` ({@link ButtonProps.ariaDisabled}). Er sieht
   * gesperrt aus, ist aber tabulierbar und anklickbar; der Klick loest **keine**
   * Handlung aus, sondern setzt {@link reasonTouched}. Der Weg, den P-8 dem
   * `blur` genommen hat, kommt damit am Knopf zurueck — und zwar an dem
   * Bedienelement, das der Benutzer ohnehin gedrueckt hat, statt an einem
   * Nebeneffekt des Fokuswechsels.
   *
   * Das ist zugleich die Antwort auf einen zweiten Befund: Ein `disabled`-Knopf
   * ist aus dem Tabulatorlauf entfernt. Wer den Dialog mit der Tastatur
   * bedient, kam bisher gar nicht an ihn heran und erfuhr auch dort nichts.
   */
  const [reasonTouched, setReasonTouched] = useState(false);
  /*
    Hat der Benutzer in das Begruendungsfeld getippt? — die eine Haelfte von
    P-8, die kein Wertvergleich beantwortet (Nachtrag T-186). `TextField` fuehrt
    denselben Zustand fuer die Formularfelder; dieses Feld ist ein blankes
    `textarea` und fuehrt ihn selbst.
  */
  const [reasonEdited, setReasonEdited] = useState(false);

  /* Jede Antwort faengt leer an: Was beim letzten Mal angekreuzt war, gilt
     fuer die naechste Frage nicht. */
  useEffect(() => {
    if (open) return;
    setAcknowledged(false);
    setReason("");
    setReasonTouched(false);
    setReasonEdited(false);
  }, [open]);

  const reasonMissing = reasonRequired && reasonTouched && reason.trim() === "";

  /* Regel P-8: ein Durchqueren ist keine Eingabe. */
  const touchReason = (): void => {
    if (touchedOnBlur(reason, reasonEdited)) setReasonTouched(true);
  };

  const blocked =
    (acknowledgeLabel !== undefined && !acknowledged) ||
    (reasonRequired && reason.trim() === "");

  /**
   * Der Klick auf den gesperrten Knopf — bestaetigen oder sagen, was fehlt.
   *
   * Die Reihenfolge ist die Zusicherung dieser Funktion: **Erst der Riegel,
   * dann die Handlung.** `onConfirm` laeuft nur, wenn nichts fehlt; der
   * `aria-disabled`-Knopf ist ein sichtbar gesperrter Knopf und kein
   * halboffener.
   *
   * Was der gesperrte Fall tut, haengt daran, **was** fehlt:
   *
   *  - Eine fehlende Begruendung bekommt ihren Satz: `reasonTouched` wird
   *    gesetzt, und die Meldeflaeche, die seit T-118 dauerhaft im Baum steht,
   *    fuellt sich — also wird sie **angesagt** (B-5, SC 4.1.3).
   *  - Ein fehlendes Haekchen bekommt keinen zweiten Satz. Seine Beschriftung
   *    steht unmittelbar ueber dem Knopf und ist die Bedingung selbst; ein
   *    Tadel daneben verdoppelte sie nur. **Das ist eine Entscheidung und
   *    keine Luecke** — sie steht im Bericht T-186 mit ihrem Grund.
   */
  const confirmOrExplain = (): void => {
    if (blocked) {
      if (reasonRequired) setReasonTouched(true);
      return;
    }
    onConfirm(reason);
  };

  return (
    <DialogSurface
      open={open}
      role="alertdialog"
      onDismiss={onCancel}
      className={cx("dialog", tone === "danger" && "dialog--danger")}
    >
      <div className="dialog__head">
        <span className={cx("dialog__icon", tone === "danger" && "dialog__icon--danger")}>
          <Icon name={tone === "danger" ? "alert-triangle" : "info"} size={18} />
        </span>
        <Dialog.Title className="dialog__title">{title}</Dialog.Title>
      </div>

      {/*
        Der ganze Rumpf ist die Beschreibung — so war es vorher, und daran
        haengt die Auflage aus B-5: Die Vorwarnung wird zusammen mit dem Titel
        vorgelesen, die Absage des Dienstes danach ueber die Live-Region.
      */}
      <Dialog.Description className="dialog__body">
        <p>{description}</p>
        {consequence !== undefined && refusal === undefined ? (
          <p className="dialog__consequence">
            <Icon name="arrow-up-right" size={14} />
            <span>{consequence}</span>
          </p>
        ) : null}

        {/*
          Die Live-Region steht **immer**, auch leer.

          Ein `role="status"`, das erst zusammen mit seinem Inhalt in den Baum
          kommt, wird von vielen Vorlesehilfen nicht angesagt: Sie melden
          Aenderungen an einer Region, die sie kennen, und diese kennen sie in
          dem Augenblick noch nicht. Deshalb steht der Behaelter vom Oeffnen
          an da und bekommt seinen Inhalt spaeter — dann ist es eine Aenderung
          und wird angesagt.

          Umgekehrt darf die **Vorwarnung** nicht darin stehen: Sie liegt
          bereits in `aria-describedby` und wuerde beim Oeffnen zweimal
          vorgelesen (die Auflage aus B-5: „nicht dauerhaft").

          Leer nimmt der Behaelter keinen Platz ein; `.dialog__consequence`
          traegt seinen eigenen Abstand.
        */}
        <div role="status">
          {refusal === undefined ? null : (
            <p className="dialog__consequence">
              <Icon name="alert-triangle" size={14} />
              <span>{refusal}</span>
            </p>
          )}
        </div>
        {reasonLabel !== undefined ? (
          <div className="dialog__reason">
            <label className="field__label" htmlFor={reasonId}>
              {reasonLabel}
              {reasonRequired ? (
                <>
                  <span aria-hidden> *</span>
                  <span className="visually-hidden"> (Pflichtfeld)</span>
                </>
              ) : null}
            </label>
            <textarea
              id={reasonId}
              className="note__input"
              rows={2}
              value={reason}
              required={reasonRequired}
              aria-required={reasonRequired || undefined}
              aria-invalid={reasonMissing ? true : undefined}
              {...(reasonMissing ? { "aria-describedby": reasonErrorId } : {})}
              onChange={(event) => {
                setReasonEdited(true);
                setReason(event.target.value);
              }}
              onBlur={touchReason}
            />
            {/*
              Die **zweite** Live-Region dieses Dialogs, und die einzige, die
              eine eigene Absage traegt (Z-16 aus T-177). Bauart und Begruendung
              sind die von `TextField` (T-162, Befund O-DA): Sie steht **immer**
              im Baum, auch leer, weil ein `role="alert"`, das erst zusammen mit
              seinem Inhalt entsteht, von vielen Vorlesehilfen uebergangen wird.

              **Sie kann die Region der Dienstabsage nicht ueberschreiben**, und
              zwar nicht aus Vorsicht, sondern der Bauart nach. Drei Gruende, und
              der dritte traegt allein:

               1. Zwei **verschiedene** Knoten mit verschiedenen Rollen
                  (`status` dort, `alert` hier) und verschiedenen Kennungen. Eine
                  Vorlesehilfe beobachtet sie getrennt.
               2. Zwei **verschiedene** Quellen: `refusal` kommt als Eigenschaft
                  vom Dienst, `reasonMissing` aus dem Zustand dieses Bausteins.
                  Keine schreibt in die andere.
               3. Sie sind **einander ausschliessend**, solange `reasonRequired`
                  gilt: Eine Absage des Dienstes setzt voraus, dass `onConfirm`
                  lief; `onConfirm` haengt am nicht gesperrten Knopf, und der ist
                  gesperrt, solange die Begruendung fehlt. Wo diese Meldung
                  steht, kann keine Absage angekommen sein — und umgekehrt.

              Der Wortlaut ist die Grundform aus T-177 P-3 mit der Beschriftung
              des Feldes als erstem Wort (P-2): Was angesagt wird, waehrend der
              Dialog schon steht, braucht seinen Bezug im Satz.
            */}
            <div className="field__live" role="alert">
              {reasonMissing ? (
                <p className="field__error" id={reasonErrorId}>
                  {`${reasonLabel} fehlt.`}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        {acknowledgeLabel !== undefined ? (
          <label className="dialog__acknowledge">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>{acknowledgeLabel}</span>
          </label>
        ) : null}
      </Dialog.Description>

      <div className="dialog__footer">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        {/*
          **Gesperrt, aber erreichbar** (T-186). `aria-disabled` statt
          `disabled`: Der Knopf bleibt im Tabulatorlauf und nimmt den Klick
          entgegen; abgefangen wird die **Handlung**, nicht das Ereignis.

          Das ist der Unterschied zwischen „geht nicht" und „geht nicht, und
          hier steht warum". Ein `disabled`-Knopf kann das zweite nicht
          leisten — er bekommt das Ereignis gar nicht erst.

          `busy` bleibt bei `loading` und damit bei der **harten** Sperre: Da
          gibt es nichts zu erklaeren, und ein zweiter Klick waere ein zweiter
          Auftrag an den Dienst.
        */}
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={confirmOrExplain}
          ariaDisabled={blocked}
          loading={busy}
        >
          {confirmLabel}
        </Button>
      </div>
    </DialogSurface>
  );
}
