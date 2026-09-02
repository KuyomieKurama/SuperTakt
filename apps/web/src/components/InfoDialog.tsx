import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { focusFirstWithin, keepTabInside } from "../lib/focus";
import { Button, IconButton } from "./Primitives";

/**
 * Takt — der Dialog, der nichts fragt (Abschnitt 15).
 *
 * `ConfirmDialog` beantwortet eine Ja-Nein-Frage, `FormDialog` nimmt Eingaben
 * entgegen. Für eine reine Auskunft — den Verlauf einer Buchung im
 * Exportprotokoll (R-10) — taugt beides nicht: Ein Dialog mit einem
 * Bestätigungsknopf verspricht eine Handlung, die es nicht gibt, und ein
 * Formular ohne Feld ist keines.
 *
 * Was er mit den beiden anderen teilt, ist alles, was zugänglich sein muss:
 * `role="dialog"`, `aria-modal`, Fokus beim Öffnen hinein und beim Schließen
 * zurück zum Auslöser, Tabulatorschleife (SC 2.4.3), Escape schließt.
 */
export interface InfoDialogProps {
  readonly open: boolean;
  readonly title: string;
  /** Ein Satz unter der Überschrift: worüber der Dialog Auskunft gibt. */
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly closeLabel?: string;
  /** Weitere Wege aus dem Dialog heraus, links vom Schließknopf. */
  readonly actions?: ReactNode;
  readonly wide?: boolean;
  readonly onClose: () => void;
}

export function InfoDialog({
  open,
  title,
  description,
  children,
  closeLabel = "Schließen",
  actions,
  wide = false,
  onClose,
}: InfoDialogProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusFirstWithin(dialogRef.current);
    return () => {
      openerRef.current?.focus();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
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
        onClose();
        return;
      }
      keepTabInside(dialogRef.current, event);
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div className="scrim" onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...(description === undefined ? {} : { "aria-describedby": descriptionId })}
        className={cx("dialog", "dialog--form", wide && "dialog--wide")}
      >
        <div className="dialog__head dialog__head--form">
          <div className="grow">
            <h2 className="dialog__title" id={titleId}>
              {title}
            </h2>
            {description === undefined ? null : (
              <p className="dialog__lead" id={descriptionId}>
                {description}
              </p>
            )}
          </div>
          <IconButton label="Dialog schließen" icon="x" size="sm" onClick={onClose} />
        </div>

        <div className="dialog__body dialog__body--form">{children}</div>

        <div className="dialog__footer">
          {actions}
          <Button variant="primary" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
