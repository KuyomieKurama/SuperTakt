import { Icon, type IconName } from "../components/Icon";
import { cx } from "../lib/cx";
import { handleRouteLinkClick, href, type RouteName } from "./router";

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
 * „Buchungen“ steht als eigener Punkt neben der Zeiterfassung. Abschnitt 14
 * nennt seine Liste ausdrücklich beispielhaft, und S-05 und S-06 sind zwei
 * Ansichten mit zwei Aufgaben: erfassen und nachsehen.
 *
 * **Die Musterseite steht seit T-057 nicht mehr hier.** Sie war der neunte
 * Eintrag, unten links, und sie war der einzige, der nicht zum Produkt gehört:
 * eine Abnahmeseite für Entwicklung und Prüfung. Sie hat jetzt einen eigenen
 * Einstiegspunkt (`apps/web/designsystem.html`) und ist über diese Navigation,
 * über den Router und über jede Adresse der Anwendung nicht mehr erreichbar.
 */

interface NavItem {
  readonly route: RouteName;
  readonly label: string;
  readonly icon: IconName;
}

/*
  Kein `hint` und kein `title` (T-181, ST-01). Die acht Zusätze sagten, was
  die Beschriftung sagt, und ein natives Titelattribut ist weder mit der
  Tastatur erreichbar noch abweisbar noch überfahrbar (SC 1.4.13). Trägt eine
  Beschriftung nicht, ist sie falsch — nicht zu kurz (Regel S-01).
*/
const ITEMS: readonly NavItem[] = [
  { route: "dashboard", label: "Dashboard", icon: "monitor" },
  { route: "todos", label: "Todos", icon: "inbox" },
  { route: "board", label: "Kanban", icon: "square" },
  { route: "time", label: "Zeiterfassung", icon: "clock" },
  { route: "bookings", label: "Buchungen", icon: "filter" },
  { route: "export", label: "Export", icon: "download" },
  { route: "tags", label: "Tags", icon: "tag" },
  { route: "settings", label: "Einstellungen", icon: "shield" },
];

export interface NavigationProps {
  readonly active: RouteName;
  /** Zahl offener Todos am Punkt „Todos“. `null`, solange sie unbekannt ist. */
  readonly openTodoCount: number | null;
  /** Zahl noch nicht exportierter Buchungen am Punkt „Export“. */
  readonly openEntryCount: number | null;
}

export function Navigation({ active, openTodoCount, openEntryCount }: NavigationProps) {
  return (
    <nav className="nav" aria-label="Hauptnavigation">
      <ul className="nav__list">
        {ITEMS.map((item) => {
          // Die Detailansicht eines Todos gehört zum Punkt „Todos“,
          // Vorlageneditor (S-14) und Exportprotokoll (R-10) zum Punkt
          // „Export“ — alle drei sind Bereiche ihres Punktes und keine
          // eigenen Ziele in der Navigation.
          const current =
            active === item.route ||
            (item.route === "todos" && active === "todo") ||
            (item.route === "export" && (active === "templates" || active === "exportAudit"));
          const badge =
            item.route === "todos"
              ? openTodoCount
              : item.route === "export"
                ? openEntryCount
                : null;

          return (
            <li key={item.route}>
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
                <span className="nav__label">{item.label}</span>
                {badge === null || badge === 0 ? null : (
                  <span className="nav__badge">
                    <span aria-hidden>{badge}</span>
                    <span className="visually-hidden">
                      {item.route === "todos"
                        ? `${String(badge)} offene Todos`
                        : `${String(badge)} noch nicht exportierte Buchungen`}
                    </span>
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
