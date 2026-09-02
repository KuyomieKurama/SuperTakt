import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { focusFirstWithin, keepTabInside } from "../lib/focus";
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
 * Element zurueck, das den Dialog geoeffnet hat.
 */
export type ConfirmTone = "default" | "danger";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  /** Was der Dialog tut, in einem Satz. */
  readonly description: ReactNode;
  /** Was danach anders ist. Erscheint hervorgehoben. */
  readonly consequence?: ReactNode;
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
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [reason, setReason] = useState("");
  const reasonId = `${titleId}-reason`;

  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
      setReason("");
      return;
    }
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusFirstWithin(dialogRef.current);
    return () => {
      openerRef.current?.focus();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      /*
       * Eine Taste, die eine aufgeklappte Liste schon behandelt hat, gehört
       * nicht mehr dem Dialog (T-059).
       *
       * Die Listen von Ark UI hängen im Portal am Dokumentkörper, stehen im
       * React-Baum aber unter diesem Dialog — ihre Tastenanschläge laufen
       * deshalb hier vorbei. Zag behandelt Escape in der Erfassungsphase und
       * setzt `preventDefault`; ohne diese Abfrage schlösse ein Escape in der
       * offenen Liste **beides**: die Liste und den Dialog dahinter.
       */
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      keepTabInside(dialogRef.current, event);
    },
    [onCancel],
  );

  if (!open) return null;

  const blocked =
    (acknowledgeLabel !== undefined && !acknowledged) ||
    (reasonRequired && reason.trim() === "");

  return (
    <div className="scrim" onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cx("dialog", tone === "danger" && "dialog--danger")}
      >
        <div className="dialog__head">
          <span className={cx("dialog__icon", tone === "danger" && "dialog__icon--danger")}>
            <Icon name={tone === "danger" ? "alert-triangle" : "info"} size={18} />
          </span>
          <h2 className="dialog__title" id={titleId}>
            {title}
          </h2>
        </div>

        <div className="dialog__body" id={descriptionId}>
          <p>{description}</p>
          {consequence !== undefined ? (
            <p className="dialog__consequence">
              <Icon name="arrow-up-right" size={14} />
              <span>{consequence}</span>
            </p>
          ) : null}
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
                onChange={(event) => setReason(event.target.value)}
              />
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
        </div>

        <div className="dialog__footer">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => onConfirm(reason)}
            disabled={blocked}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
