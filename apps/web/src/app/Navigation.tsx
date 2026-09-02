import { Icon, type IconName } from "../components/Icon";
import { cx } from "../lib/cx";
import { href, type RouteName } from "./router";

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
  /** Was der Punkt tut, für den Fall, dass der Name allein zu knapp ist. */
  readonly hint: string;
}

const ITEMS: readonly NavItem[] = [
  { route: "dashboard", label: "Dashboard", icon: "monitor", hint: "Überblick und schnelle Aktionen" },
  { route: "todos", label: "Todos", icon: "inbox", hint: "Liste aller Todos mit Filtern" },
  { route: "board", label: "Kanban", icon: "square", hint: "Board aus frei definierbaren Regeln über Tags" },
  { route: "time", label: "Zeiterfassung", icon: "clock", hint: "Timer, heutige Buchungen, Zeit von Hand erfassen" },
  { route: "bookings", label: "Buchungen", icon: "filter", hint: "Alle Zeitbuchungen, filterbar" },
  { route: "export", label: "Export", icon: "download", hint: "Vorschau, Lauf und Protokoll" },
  { route: "tags", label: "Tags", icon: "tag", hint: "Tags, Ordner und Pools" },
  { route: "settings", label: "Einstellungen", icon: "shield", hint: "Export, Darstellung, Add-in" },
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
                title={item.hint}
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
