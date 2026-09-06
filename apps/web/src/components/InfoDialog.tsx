import type { ReactNode } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { cx } from "../lib/cx";
import { DialogSurface } from "./DialogSurface";
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
 * zurück zum Auslöser, Tabulatorschleife (SC 2.4.3), Escape schließt. Seit
 * T-152 kommt das aus der Zustandsmaschine unter {@link DialogSurface}
 * (E-076 Stufe 1) und nicht mehr aus eigener Tastaturbehandlung.
 *
 * Ohne eigene Angabe nimmt sie das erste tabulierbare Element im Kasten, und
 * das ist hier das Schließkreuz — dieselbe Wahl wie vorher.
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
  return (
    <DialogSurface
      open={open}
      onDismiss={onClose}
      className={cx("dialog", "dialog--form", wide && "dialog--wide")}
    >
      <div className="dialog__head dialog__head--form">
        <div className="grow">
          <Dialog.Title className="dialog__title">{title}</Dialog.Title>
          {description === undefined ? null : (
            <Dialog.Description asChild>
              <p className="dialog__lead">{description}</p>
            </Dialog.Description>
          )}
        </div>
        <Dialog.CloseTrigger asChild>
          <IconButton label="Dialog schließen" icon="x" size="sm" />
        </Dialog.CloseTrigger>
      </div>

      <div className="dialog__body dialog__body--form">{children}</div>

      <div className="dialog__footer">
        {actions}
        <Button variant="primary" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
    </DialogSurface>
  );
}
