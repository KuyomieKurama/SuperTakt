import { useEffect, useRef } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { DialogSurface } from "../../shared/ui/DialogSurface";
import { Icon } from "../../shared/ui/Icon";
import { Button, IconButton } from "../../shared/ui/Primitives";

/** A-18.6–9: Versionsvergleich und Öffnen der offiziellen Release-Seite.
 * Beide Aktionen bleiben gleich gewichtet; initialer Fokus liegt auf dem Dialog.
 * Schließen stellt nur zurück. Der native Öffnen-Befehl bleibt die einzige Navigation.
 */
export interface UpdateDialogProps {
  readonly open: boolean;
  /** Die installierte Fassung, ohne führendes `v`. */
  readonly installed: string;
  /** Die verfügbare Fassung, ohne führendes `v`. */
  readonly available: string;
  /** Die Release-Seite dieser Fassung, als lesbarer Text. */
  readonly url: string;
  /** Was nach der Antwort schiefging. Steht im Dialog, nicht als Toast. */
  readonly problem: string | null;
  /** „Überspringen" läuft. */
  readonly busy: boolean;
  readonly onInstall: () => void;
  readonly onSkip: () => void;
  /** Escape und Schließknopf: zurückstellen, nicht antworten. */
  readonly onPostpone: () => void;
}

export function UpdateDialog({
  open,
  installed,
  available,
  url,
  problem,
  busy,
  onInstall,
  onSkip,
  onPostpone,
}: UpdateDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  /*
    Während „Überspringen" läuft, sperrt sich jeder Knopf dieses Dialogs — und
    ein Element, das den Fokus trägt und dabei gesperrt wird, gibt ihn an den
    Dokumentkörper ab. Der Benutzer stünde dann außerhalb des modalen Dialogs,
    ohne ihn verlassen zu haben (SC 2.4.3).

    Die Fokusfalle fängt diesen Fall **nicht**: Sie beobachtet Elemente, die
    aus dem Baum verschwinden, und ein gesperrter Knopf verschwindet nicht. Der
    Fokus geht deshalb weiterhin von Hand zurück auf den Dialog selbst; von
    dort führt die Tabulatorschleife wieder hinein, sobald die Knöpfe wieder da
    sind.
  */
  useEffect(() => {
    if (!open || !busy) return;
    const content = contentRef.current;
    if (content === null) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && content.contains(active)) content.focus();
  }, [open, busy]);

  return (
    <DialogSurface
      open={open}
      onDismiss={onPostpone}
      contentRef={contentRef}
      /* Punkt 2 im Kopf dieser Datei: der Kasten selbst, kein Knopf. */
      initialFocus={(content) => content}
      className="dialog dialog--form update-dialog"
    >
      <div className="dialog__head dialog__head--form">
        <span className="update-dialog__icon"><Icon name="download" size={22} /></span>
        <div className="grow">
          <Dialog.Title className="dialog__title">
            Update verfügbar
          </Dialog.Title>
          <Dialog.Description asChild>
            <p className="dialog__lead">
              Eine neue Version von SuperTakt ist bereit.
            </p>
          </Dialog.Description>
        </div>
        <Dialog.CloseTrigger asChild>
          <IconButton label="Später entscheiden" icon="x" size="sm" disabled={busy} />
        </Dialog.CloseTrigger>
      </div>

      <div className="dialog__body dialog__body--form">
        <div className="update-dialog__versions">
          <dl><dt>Installiert</dt><dd>{installed}</dd></dl>
          <Icon name="chevron-right" size={20} />
          <dl className="update-dialog__available"><dt>Neue Version</dt><dd>{available}</dd></dl>
        </div>
        <p className="update-dialog__explanation">
          Die Release-Seite öffnet sich im Browser. Download und Installation starten Sie dort selbst.
        </p>
        <details className="update-dialog__source">
          <summary>Offizielle Release-Seite auf GitHub <Icon name="link" size={14} /></summary>
          <p>{url}</p>
        </details>

        {/*
          Die Live-Region steht **immer**, auch leer — dieselbe Begründung wie
          in `ConfirmDialog`: Eine Region, die erst mit ihrem Inhalt in den
          Baum kommt, kennt die Vorlesehilfe in dem Augenblick noch nicht und
          sagt die Änderung nicht an. Leer nimmt sie keinen Platz ein.
        */}
        <div role="status">
          {problem === null ? null : (
            <p className="dialog__consequence">
              <Icon name="alert-triangle" size={14} />
              <span>{problem}</span>
            </p>
          )}
        </div>

        <p className="dialog__hint">
          Überspringen blendet nur diese Version aus. Schließen erinnert beim nächsten Start.
        </p>
      </div>

      {/*
        Zwei Knöpfe, dieselbe Gestalt (A-18.7). Wer hier einem von beiden
        `variant="primary"` gibt, trifft die Entscheidung für den Benutzer —
        und zwar die folgenreiche.
      */}
      <div className="dialog__footer">
        <Button variant="secondary" iconEnd="arrow-up-right" onClick={onInstall} disabled={busy}>
          Release-Seite öffnen
        </Button>
        <Button variant="secondary" onClick={onSkip} loading={busy}>
          Überspringen
        </Button>
      </div>
    </DialogSurface>
  );
}
