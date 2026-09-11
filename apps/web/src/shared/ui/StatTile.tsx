import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

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
  /**
   * `danger` ist die lauteste Ausprägung und bleibt der einen Kachel
   * vorbehalten, die auf etwas Überfälliges zeigt (A-19.4).
   *
   * Ohne Farbe trägt die **Randschiene**: 4px an der Startkante, und keine
   * andere Kachel der Reihe hat eine. Fläche und Rahmen verstärken nur —
   * beide liegen in Graustufen unter 1,8 gegen ihre Nachbarn. Die Zahlen
   * stehen im Lauf (`contrast-check.mjs`, Gruppe „Anwendung"), die Regel in
   * `app.css` unter `.stat--danger`. Dazu trägt der Umstand, dass die Kachel
   * gar nicht erst erscheint, wenn ihre Zahl null ist.
   */
  readonly tone?: "default" | "accent" | "warning" | "danger";
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
