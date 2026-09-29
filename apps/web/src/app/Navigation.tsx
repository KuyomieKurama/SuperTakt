import { Icon, type IconName } from "../shared/ui/Icon";
import { cx } from "../lib/cx";
import { handleRouteLinkClick, href, type RouteName } from "./router";
import { formatCount } from "../lib/format";
import { appTexts } from "./texts";

/**
 * Takt — die globale Navigation (Abschnitt 14).
 *
 * Jederzeit sichtbar, immer an derselben Stelle, immer in derselben
 * Reihenfolge. Sie ist eine `<nav>` mit einer Liste, damit ein Bildschirmleser
 * sie als Bereich anspringen kann und weiß, wie viele Einträge es gibt.
 *
 * **Der Punkt heißt „Zeiterfassung“** und nicht „Time Tracking“ (E-030):
 * Zeiterfassung ist der Bereich, Timer das Bedienelement. Oberflächentexte
 * sind deutsch.
 *
 * „Buchungen“ gehört als eigener Bereich zum Export (S-06).
 *
 * **Die Musterseite steht seit T-057 nicht mehr hier.** Sie war der neunte
 * Eintrag, unten links, und sie war der einzige, der nicht zum Produkt gehört:
 * eine Abnahmeseite für Entwicklung und Prüfung. Sie hat jetzt einen eigenen
 * Einstiegspunkt (`apps/web/designsystem.html`) und ist über diese Navigation,
 * über den Router und über jede Adresse der Anwendung nicht mehr erreichbar.
 */

interface NavItem {
  readonly route: "dashboard" | "todos" | "board" | "time" | "export" | "settings";
  readonly icon: IconName;
}

/*
  Kein `hint` und kein `title` (T-181, ST-01). Die acht Zusätze sagten, was
  die Beschriftung sagt, und ein natives Titelattribut ist weder mit der
  Tastatur erreichbar noch abweisbar noch überfahrbar (SC 1.4.13). Trägt eine
  Beschriftung nicht, ist sie falsch — nicht zu kurz (Regel S-01).
*/
const ITEMS: readonly NavItem[] = [
  { route: "dashboard", icon: "monitor" },
  { route: "todos", icon: "inbox" },
  { route: "board", icon: "square" },
  { route: "time", icon: "clock" },
  { route: "export", icon: "download" },
  { route: "settings", icon: "shield" },
];

export interface NavigationProps {
  readonly installedVersion?: string | null;
  readonly availableVersion?: string | null;
  readonly onOpenUpdate?: () => void;
  readonly active: RouteName;
  /** Zahl offener Todos am Punkt „Todos“. `null`, solange sie unbekannt ist. */
  readonly openTodoCount: number | null;
  /** Zahl noch nicht exportierter Buchungen am Punkt „Export“. */
  readonly openEntryCount: number | null;
}

export function Navigation({ active, openTodoCount, openEntryCount, installedVersion, availableVersion, onOpenUpdate }: NavigationProps) {
  const texts = appTexts().nav;
  return (
    <nav className="nav" aria-label={texts.label}>
      <ul className="nav__list">
        {ITEMS.map((item) => {
          // Die Detailansicht eines Todos gehört zum Punkt „Todos“,
          // Vorlageneditor (S-14) und Exportprotokoll (R-10) zum Punkt
          // „Export“ — alle drei sind Bereiche ihres Punktes und keine
          // eigenen Ziele in der Navigation.
          const current =
            active === item.route ||
            (item.route === "todos" && active === "todo") ||
            (item.route === "export" && (active === "bookings" || active === "templates" || active === "exportAudit"));
          const badge =
            item.route === "todos"
              ? openTodoCount
              : item.route === "export"
                ? openEntryCount
                : null;

          return (
            <li key={item.route} className={cx(
              item.route === "time" && "nav__section-start",
              item.route === "settings" && "nav__settings",
            )}>
              <a
                className={cx("nav__item", current && "nav__item--current")}
                href={href(item.route)}
                aria-current={current ? "page" : undefined}
                /*
                  Ein Klick auf den Eintrag, auf dem man schon steht, ist keine
                  Navigation, sondern die Bitte „zeig mir das noch einmal".
                  Der Router beantwortet sie selbst, statt sie an ein Ereignis
                  des Browsers zu hängen, das nur unter Chromium gemessen ist
                  (T-102, Befund 6 aus R-1a). Jeder andere Klick — anderes
                  Ziel, Zusatztaste, mittlere Maustaste — bleibt beim Browser.
                */
                onClick={(event) => handleRouteLinkClick(href(item.route), event)}
              >
                <span className="nav__icon">
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="nav__label">{texts[item.route]}</span>
                {badge === null || badge === 0 ? null : (
                  <span className="nav__badge">
                    <span aria-hidden>{badge}</span>
                    <span className="visually-hidden">
                      {item.route === "todos"
                        ? texts.openTodos(formatCount(badge))
                        : texts.unexportedEntries(formatCount(badge))}
                    </span>
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="nav__version">
        {availableVersion ? <button type="button" className="nav__update" onClick={onOpenUpdate}>
          <span>v{installedVersion ?? "—"}</span><span><Icon name="arrow-up-right" size={12} /> {texts.versionAvailable(availableVersion)}</span>
        </button> : <span>{installedVersion ? texts.version(installedVersion) : texts.versionUnknown}</span>}
      </div>
    </nav>
  );
}
