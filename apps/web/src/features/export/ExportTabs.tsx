import { cx } from "../../lib/cx";
import { handleRouteLinkClick, href } from "../../app/router";

/** Die Bereiche des Exports haben eigene Adressen und Browserhistorie.
 * Export enthält Buchungen, Bearbeitung und Dateivorschau.
 * Vorlagen und Protokoll ergänzen Konfiguration und Verlauf.
 */
export function ExportTabs({
  active,
}: {
  readonly active: "export" | "bookings" | "templates" | "exportAudit";
}) {
  /*
    Kein `hint` und kein `title` (T-181, ST-02). Die drei Zusätze erklärten
    die sichtbare Beschriftung; der dritte war zugleich die längste Fassung
    eines Satzes, der als `lead` des Protokolls noch einmal steht. Ein
    natives Titelattribut erfüllt SC 1.4.13 nicht (Regel S-16).
  */
  const items = [
    { key: "export", label: "Export" },
    { key: "templates", label: "Vorlagen" },
    { key: "exportAudit", label: "Protokoll" },
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
