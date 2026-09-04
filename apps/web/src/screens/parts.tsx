import type { ReactNode } from "react";
import { Button, InlineMessage, LoadingBlock } from "../components/Primitives";
import { cx } from "../lib/cx";
import { handleRouteLinkClick, href } from "../app/router";
import type { AsyncState } from "../app/useAsync";

/**
 * Takt — Bausteine, die jede Ansicht braucht.
 *
 * Kopfzeile, Ladezustand, Fehlerzustand. Sie stehen hier einmal, damit sie in
 * neun Ansichten gleich aussehen und gleich funktionieren — vor allem im
 * Fehlerfall: Eine Fehlermeldung ohne Wiederholungsknopf ist eine Sackgasse
 * (Abschnitt 15).
 */

export interface ScreenHeaderProps {
  readonly title: string;
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
      <div className="screen__headline">
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

/**
 * Die drei Bereiche des Exports (T-005, Abschnitt 7; T-040 für den dritten).
 *
 * S-07 schreibt die Datei, S-14 legt fest, was darin steht, das Protokoll
 * hält fest, was geschehen ist. Alle drei gehören zum selben
 * Navigationspunkt: Der Vorlageneditor braucht eine Vorschau auf tatsächlich
 * offenen Buchungen, und das sind genau die Daten von S-07; das Protokoll
 * beantwortet die Frage, die unmittelbar vor jedem Zurücksetzen steht.
 * Lägen sie in den Einstellungen, wären sie von ihrem Gegenstand getrennt.
 *
 * Umgesetzt als Verweise in einer Liste, nicht als ARIA-Registerkarten: Es
 * sind drei Adressen mit eigenem Verlauf und keine drei Bereiche derselben
 * Seite. `aria-current="page"` sagt, wo man ist.
 */
export function ExportTabs({
  active,
}: {
  readonly active: "export" | "templates" | "exportAudit";
}) {
  const items = [
    { key: "export", label: "Export", hint: "Auswahl, Vorschau und Lauf" },
    { key: "templates", label: "Vorlagen", hint: "Welche Felder in die Datei gehen" },
    {
      key: "exportAudit",
      label: "Protokoll",
      hint: "Wann welche Buchung exportiert, zurückgesetzt oder nicht abgerechnet wurde",
    },
  ] as const;

  return (
    <nav className="subtabs" aria-label="Bereiche des Exports">
      <ul className="subtabs__list">
        {items.map((item) => (
          <li key={item.key}>
            <a
              className={cx("subtab", active === item.key && "subtab--current")}
              href={href(item.key)}
              aria-current={active === item.key ? "page" : undefined}
              title={item.hint}
              /* Wie in der Hauptnavigation (T-102): der eigene Bereich noch einmal. */
              onClick={(event) => handleRouteLinkClick(href(item.key), event)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface AsyncBoundaryProps<T> {
  readonly state: AsyncState<T>;
  /** Was gerade geladen wird — wird angesagt, nicht nur gezeigt. */
  readonly label: string;
  readonly rows?: number;
  readonly onRetry: () => void;
  readonly children: (value: T, refreshing: boolean) => ReactNode;
}

export function AsyncBoundary<T>({
  state,
  label,
  rows = 4,
  onRetry,
  children,
}: AsyncBoundaryProps<T>) {
  if (state.status === "loading") {
    return <LoadingBlock label={label} rows={rows} />;
  }

  if (state.status === "error") {
    return (
      <InlineMessage
        tone="danger"
        title="Das ließ sich nicht laden"
        action={
          <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={onRetry}>
            Erneut versuchen
          </Button>
        }
      >
        {state.message}
        {state.code === null ? null : <span className="message__code"> ({state.code})</span>}
      </InlineMessage>
    );
  }

  return <>{children(state.value, state.refreshing)}</>;
}

/** Leiser Hinweis, dass im Hintergrund nachgeladen wird. */
export function RefreshHint({ active }: { readonly active: boolean }) {
  return (
    <span className={cx("refresh-hint", active && "refresh-hint--active")} aria-hidden={!active}>
      {active ? "Wird aktualisiert …" : ""}
    </span>
  );
}

/** Zwei Zahlen nebeneinander, wie sie auf dem Dashboard stehen. */
export function StatTile({
  label,
  value,
  detail,
  tone = "default",
  action,
}: {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly tone?: "default" | "accent" | "warning";
  readonly action?: ReactNode;
}) {
  return (
    <div className={cx("stat", tone !== "default" && `stat--${tone}`)}>
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {detail === undefined ? null : <p className="stat__detail">{detail}</p>}
      {action === undefined ? null : <div className="stat__action">{action}</div>}
    </div>
  );
}
