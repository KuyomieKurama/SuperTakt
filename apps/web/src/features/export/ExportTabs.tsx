import { cx } from "../../lib/cx";
import { handleRouteLinkClick, href } from "../../app/router";

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
 *
 * **Sie steht bei ihrem Merkmal und nicht bei den geteilten Bausteinen**
 * (T-256): Ihre drei Adressen sind die drei Ansichten von `features/export`,
 * und alle drei Aufrufstellen liegen dort. Ein Baustein, den genau ein Merkmal
 * braucht, bleibt bei diesem Merkmal.
 */
export function ExportTabs({
  active,
}: {
  readonly active: "export" | "templates" | "exportAudit";
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
