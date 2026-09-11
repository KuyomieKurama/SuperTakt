import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

/**
 * Takt — die Kopfzeile, die jede Ansicht trägt.
 *
 * Sie steht hier einmal, damit sie in elf Ansichten gleich aussieht und gleich
 * funktioniert. Zusammen mit ihr steht {@link RefreshHint}: Der Kopf zeigt ihn
 * selbst, und vier Ansichten setzen ihn zusätzlich an eine eigene Leiste.
 */

export interface ScreenHeaderProps {
  /**
   * Die Ueberschrift der Ansicht.
   *
   * Ein `ReactNode` und keine Zeichenkette (T-124): Die Detailansicht setzt
   * hier den **Titel eines Todos** ein, und der ist fremder Text — er muss
   * durch `<Foreign>` gehen (E-063). Jede bisherige Aufrufstelle bleibt
   * gueltig; eine Zeichenkette **ist** ein `ReactNode`.
   */
  readonly title: ReactNode;
  /** Ein Satz darunter: was diese Ansicht beantwortet. */
  readonly lead?: string;
  readonly actions?: ReactNode;
  /**
   * Lädt diese Ansicht gerade im Hintergrund nach? (Abschnitt 15, W-12)
   *
   * Seit T-097 holt **jede** Ansicht ihre Daten neu, wenn dieselbe Adresse ein
   * zweites Mal angesteuert wird oder das Fenster wieder sichtbar wird — auch
   * die, die dafür kein Zeichen hatten. Dort änderte sich der Inhalt bis T-102
   * ohne jeden Hinweis. Vier Ansichten trugen `RefreshHint` an einer eigenen
   * Leiste (Board, Buchungen, Protokoll, Todo-Liste); die übrigen sieben haben
   * keine solche Leiste, und eine je Ansicht zu erfinden hieße, denselben
   * Zustand an elf Orten verschieden zu zeigen. Er steht deshalb hier, im Kopf,
   * den jede Ansicht hat.
   *
   * **Keine Live-Region.** Abschnitt 15 verlangt eine **sichtbare** Rückmeldung,
   * und eine Ansage, die es nur für Vorlesehilfen gibt, wäre eine zweite
   * Anwendung (Antwort auf T-097 Frage 3, R-2a).
   */
  readonly refreshing?: boolean;
  /** Zusatzzeile unter dem Kopf, etwa eine Filterleiste. */
  readonly children?: ReactNode;
}

export function ScreenHeader({ title, lead, actions, refreshing, children }: ScreenHeaderProps) {
  return (
    <header className="screen__header">
      {/*
        Ohne `lead` wird die Kopfzeile senkrecht zentriert (T-181, Vorgabe aus
        `docs/design/textabbau-gestalt.md` 2.1). `.screen__headline` richtet
        sonst an der Oberkante aus — richtig, solange ein zweizeiliger `lead`
        darunter hängt, falsch, wenn eine 36-px-Aktion an der Oberkante einer
        29-px-Titelzeile sitzt. Rolle und Überschrift bleiben zeichengleich.
      */}
      <div className={cx("screen__headline", lead === undefined && "screen__headline--bare")}>
        <div className="grow">
          <h1 className="screen__title">{title}</h1>
          {lead === undefined ? null : <p className="screen__lead">{lead}</p>}
        </div>
        {refreshing === undefined ? null : <RefreshHint active={refreshing} />}
        {actions === undefined ? null : <div className="screen__actions">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** Leiser Hinweis, dass im Hintergrund nachgeladen wird. */
export function RefreshHint({ active }: { readonly active: boolean }) {
  return (
    <span className={cx("refresh-hint", active && "refresh-hint--active")} aria-hidden={!active}>
      {active ? "Wird aktualisiert …" : ""}
    </span>
  );
}
