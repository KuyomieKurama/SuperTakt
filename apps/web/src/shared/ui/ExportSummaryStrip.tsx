import { cx } from "../../lib/cx";
import {
  ExportStatusMarker,
  EXPORT_STATE,
  type ExportDisplayState,
  type ExportSummary,
} from "./ExportStatus";

/**
 * Takt — der Exportstand der Buchungen eines Todos auf engem Raum (A-13.5).
 *
 * ## Warum dieser Streifen nicht im Board liegt
 *
 * Er stand bis T-253 in `features/board/Kanban.tsx`, zwischen der Karte und der
 * Spalte, und war damit ein Baustein des Boards, den zwei andere Flächen
 * benutzten. Gemessen sind es die Todo-Zeile (`features/todos/TodoRow.tsx`) und
 * die Musterseite (`showcase/ExportStatusSection.tsx`) — zwei Leser außerhalb
 * des Merkmals, und beide zeigen keinen Kanban-Kram, sondern denselben
 * Exportstand an einer anderen Zeile.
 *
 * Der Streifen nimmt **Werte** entgegen: eine Zusammenfassung und eine
 * Klassenangabe. Er kennt kein Todo, keine Spalte und keine Route. Das ist das
 * Kriterium für `shared/ui/` aus Welle 2, und es ist hier erfüllt — ein Ordner
 * `features/board/`, aus dem sich die Todo-Liste bedient, wäre eine
 * Abhängigkeit ohne Sache.
 */

export interface ExportSummaryStripProps {
  readonly summary: ExportSummary;
  readonly className?: string;
}

/**
 * Zeigt auf engem Raum, wie die Buchungen eines Todos beim Export stehen.
 * Form und Zahl tragen die Aussage, die Farbe verstaerkt sie nur.
 */
export function ExportSummaryStrip({ summary, className }: ExportSummaryStripProps) {
  /* Reihenfolge nach Dringlichkeit: was noch Geld bringt zuerst, was
     abgeschlossen ist zuletzt. */
  const order: readonly ExportDisplayState[] = ["open", "reopened", "exported", "not_billed"];
  const present = order.filter((state) => summary[state] > 0);

  if (present.length === 0) {
    return <span className={cx("summary-strip summary-strip--empty", className)}>keine Buchung</span>;
  }

  return (
    <span className={cx("summary-strip", className)}>
      {present.map((state) => (
        <span key={state} className="summary-strip__item">
          <ExportStatusMarker state={state} labelled={false} />
          <span aria-hidden>{summary[state]}</span>
          <span className="visually-hidden">
            {summary[state]} Buchungen: {EXPORT_STATE[state].label}
          </span>
        </span>
      ))}
    </span>
  );
}
