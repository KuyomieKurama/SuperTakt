import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from "react";
import { focusableWithin, keepTabInside } from "../lib/focus";
import { Icon } from "./Icon";
import { Button, IconButton } from "./Primitives";

/**
 * Takt — der Hinweis auf eine neuere Fassung (A-18.6 bis A-18.9).
 *
 * ===========================================================================
 * Die eine Eigenschaft, die diesen Dialog von jedem anderen unterscheidet
 * ===========================================================================
 *
 * **Es gibt keine Vorauswahl** (A-18.7 wörtlich: „Es gibt keine Vorauswahl,
 * die eine der beiden Antworten für ihn trifft"). Das hat drei sichtbare
 * Folgen, und jede davon weicht bewusst von `ConfirmDialog` ab:
 *
 *  1. **Beide Knöpfe tragen dieselbe Gestalt** (`secondary`). Der
 *     Bestätigungsdialog hebt seinen rechten Knopf hervor — hier wäre genau
 *     das die Vorauswahl, und zwar für die Antwort, die den Benutzer aus der
 *     Anwendung heraus zu einer unsignierten Datei führt.
 *  2. **Der Fokus liegt beim Öffnen auf dem Dialog selbst** und nicht auf
 *     einem der Knöpfe. Ein Fokus auf „Installieren" machte ein bloßes Enter
 *     zur Antwort; ein Fokus auf „Überspringen" machte es zur anderen. Der
 *     Dialog trägt dafür `tabIndex={-1}` und wird angesagt, weil Titel und
 *     Beschreibung an ihm hängen (ARIA APG: „if focusing an element would be
 *     inappropriate, focus the dialog").
 *  3. **Escape und der Schließknopf beantworten nichts.** Sie stellen den
 *     Hinweis für diesen Lauf zurück; beim nächsten Start steht er wieder da.
 *     „Überspringen" ist eine Entscheidung und soll keine sein, die jemand
 *     versehentlich mit Escape trifft (R-20 von der anderen Seite: Der
 *     Hinweis soll wegzubekommen sein, aber nicht aus Versehen für immer).
 *
 * ===========================================================================
 * Der Verweis ist ein **Knopf**, kein `<a href>`
 * ===========================================================================
 *
 * Ein Anker führte den Webview selbst nach github.com. Es gibt in der Hülle
 * **keinen** Wächter über Navigationen (`on_navigation` ist nicht gesetzt), und
 * die Anwendung hätte den Benutzer damit aus seiner eigenen Oberfläche
 * getragen — in ein Fenster ohne Adresszeile, in dem er nicht sehen kann, wo er
 * ist. Der Knopf ruft stattdessen den Öffnen-Befehl der Hülle, und der nimmt
 * **keine Adresse** entgegen, sondern die Fassungsbezeichnung (E-064 Punkt 4,
 * Auflage A-V-18).
 *
 * Die Adresse steht trotzdem da — als Text, zum Lesen und zum Kopieren. A-18.6
 * verlangt den Verweis, und ein Knopf allein ist eine Zusicherung: Der Benutzer
 * soll vor dem Klick sehen, wohin er geschickt wird.
 *
 * ===========================================================================
 * Was der Dialog verspricht, und was er nicht verspricht
 * ===========================================================================
 *
 * Er sagt im Vorspann ausdrücklich, dass Takt **nichts** herunterlädt und
 * **nichts** installiert (A-18.9). Das ist keine Bescheidenheit, sondern die
 * Erwartung, die der Knopf sonst weckt: „Installieren" heißt in fast jeder
 * anderen Anwendung „jetzt läuft eine Aktualisierung". Hier heißt es „eine
 * Seite geht auf".
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
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    /*
      Der Fokus geht auf den **Dialog** und nicht auf seinen ersten Knopf —
      siehe Punkt 2 im Kopf dieser Datei. `focusFirstWithin` steht deshalb
      nicht hier, obwohl jeder andere Dialog dieser Oberfläche es ruft.
    */
    dialogRef.current?.focus();
    return () => {
      openerRef.current?.focus();
    };
  }, [open]);

  /*
    Während „Überspringen" läuft, sperrt sich jeder Knopf dieses Dialogs — und
    ein Element, das den Fokus trägt und dabei gesperrt wird, gibt ihn an den
    Dokumentkörper ab. Der Benutzer stünde dann außerhalb des modalen Dialogs,
    ohne ihn verlassen zu haben (SC 2.4.3). Der Fokus geht deshalb zurück auf
    den Dialog selbst; von dort führt die Tabulatorschleife unten wieder
    hinein, sobald die Knöpfe wieder da sind.
  */
  useEffect(() => {
    if (!open || !busy) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && dialogRef.current?.contains(active) === true) {
      dialogRef.current.focus();
    }
  }, [open, busy]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onPostpone();
        return;
      }
      /*
        Der Dialog trägt `tabIndex={-1}` und steht damit **nicht** in der
        Tabulatorreihenfolge; `keepTabInside` kennt ihn weder als erstes noch
        als letztes Element. Liegt der Fokus auf ihm — und das tut er beim
        Öffnen —, liefe ein Shift+Tab aus dem Dialog heraus, und zwar beim
        allerersten Tastendruck. Diese Abfrage schließt die Schleife dort.
      */
      if (event.key === "Tab" && document.activeElement === dialogRef.current) {
        // Auch dann angehalten, wenn gerade **kein** Knopf bedienbar ist:
        // Während „Überspringen" läuft, sperren sich alle drei, und ein
        // Tabulator ohne Ziel führte sonst aus dem modalen Dialog heraus.
        event.preventDefault();
        const focusable = focusableWithin(dialogRef.current);
        const target = event.shiftKey ? focusable[focusable.length - 1] : focusable[0];
        target?.focus();
        return;
      }
      keepTabInside(dialogRef.current, event);
    },
    [onPostpone],
  );

  if (!open) return null;

  return (
    <div className="scrim" onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="dialog dialog--form"
      >
        <div className="dialog__head dialog__head--form">
          <div className="grow">
            <h2 className="dialog__title" id={titleId}>
              Eine neuere Fassung von Takt ist verfügbar
            </h2>
            <p className="dialog__lead" id={descriptionId}>
              Takt lädt nichts herunter und installiert nichts. „Installieren" öffnet die
              Release-Seite dieser Fassung im Browser; alles Weitere entscheiden Sie dort.
            </p>
          </div>
          <IconButton
            label="Später entscheiden"
            icon="x"
            size="sm"
            onClick={onPostpone}
            disabled={busy}
          />
        </div>

        <div className="dialog__body dialog__body--form">
          <dl className="facts">
            <dt>Installiert</dt>
            <dd className="mono">{installed}</dd>
            <dt>Verfügbar</dt>
            <dd className="mono">{available}</dd>
            <dt>Release-Seite</dt>
            <dd className="mono">{url}</dd>
          </dl>

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
            Der Hinweis kehrt beim nächsten Start zurück, solange Sie ihn nicht überspringen.
            „Überspringen" gilt genau dieser Fassung — eine spätere meldet sich wieder.
          </p>
        </div>

        {/*
          Zwei Knöpfe, dieselbe Gestalt (A-18.7). Wer hier einem von beiden
          `variant="primary"` gibt, trifft die Entscheidung für den Benutzer —
          und zwar die folgenreiche.
        */}
        <div className="dialog__footer">
          <Button variant="secondary" iconEnd="arrow-up-right" onClick={onInstall} disabled={busy}>
            Installieren
          </Button>
          <Button variant="secondary" onClick={onSkip} loading={busy}>
            Überspringen
          </Button>
        </div>
      </div>
    </div>
  );
}
