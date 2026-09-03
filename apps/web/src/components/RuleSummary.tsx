import { cx } from "../lib/cx";
import type { RuleAxis, RuleChip, RuleDescription } from "../lib/poolRule";
import { ExportStatusBadge } from "./ExportStatus";
import { Icon, type IconName } from "./Icon";
import { TagChip } from "./Tag";

/**
 * Takt — die Regel einer Spalte oder eines Pools in Worten (T-076, T-079).
 *
 * ## Eine Zusammenfassung, drei Flächen
 *
 * Sie steht unter jedem Spaltenkopf des Boards, in jeder Zeile der
 * Regelverwaltung und als Vorschau im Formular. Bis T-079 war sie an zwei
 * dieser Stellen getippt und an der dritten gar nicht — und die beiden
 * Fassungen kannten nur die Tagliste. Seit die Regel fünf Achsen hat, wäre das
 * nicht mehr bloß uneinheitlich, sondern **falsch**: Eine Spalte, die
 * ausgeschlossene Tags nennt und davon nichts zeigt, behauptet eine Regel, die
 * sie nicht hat.
 *
 * ## Was nicht dasteht, schränkt nicht ein
 *
 * Eine Achse auf ihrem Neutralwert erscheint hier **nicht**. Das ist die
 * Leseregel dieser Fläche und der Grund, warum sie kurz bleibt: Was hier steht,
 * engt ein; was fehlt, lässt alles durch. Im Formular steht daneben, welche
 * Achsen fehlen (`showNeutral`) — dort wird gewählt, und dort muss der
 * Unterschied zwischen „Alle" und „trifft alles" ausgesprochen werden.
 *
 * ## Wie sich die Achsen unterscheiden — ohne Farbe
 *
 * | Achse | Symbol | Wort |
 * |---|---|---|
 * | erforderliche Tags | Etikett | „Mindestens eines von" / „Alle von" |
 * | ausgeschlossene Tags | durchgestrichener Kreis | „Ohne" |
 * | Status | Quadrat | „Status" |
 * | Erledigt | Haken / Kreis | „Nur erledigte" / „Nur unerledigte" |
 * | Exportstatus | dasselbe Etikett wie überall | „Offen" / „Exportiert" |
 *
 * Symbol **und** Wort, nie nur die Farbe (SC 1.4.1). Die Exportachse borgt sich
 * `ExportStatusBadge` — dasselbe Etikett, das an jeder Buchung, in jeder Zeile
 * und in jeder Vorschau steht. Der Exportstatus ist die Unterscheidung, um die
 * sich Takt dreht; ihn hier anders zu zeichnen hieße, ihn zweimal zu erklären.
 */

export interface RuleSummaryProps {
  readonly description: RuleDescription;
  /** Auch die neutralen Achsen aufzählen. Für das Formular. */
  readonly showNeutral?: boolean;
  /**
   * Was an dieser Fläche steht, wenn die Regel keine Bedingung nennt.
   *
   * Kein Vorgabetext: „Diese Spalte bleibt leer" und „Dieser Pool bleibt leer"
   * sagen dasselbe an verschiedenen Orten, und ein Satz, der beides zugleich
   * sein will, sagt keines von beiden.
   */
  readonly emptyText: string;
  readonly size?: "sm" | "md";
  readonly className?: string;
}

const AXIS_ICON: Readonly<Record<RuleAxis["id"], IconName>> = {
  required: "tag",
  excluded: "slash-circle",
  status: "square",
  completion: "check",
  export: "download",
};

function ChipView({ chip, size }: { readonly chip: RuleChip; readonly size: "sm" | "md" }) {
  if (chip.kind === "tag") {
    return <TagChip size={size} label={chip.label} path={chip.path} />;
  }
  if (chip.kind === "status") {
    return (
      <span className="rule-summary__status">
        <Icon name="square" size={11} />
        {chip.label}
      </span>
    );
  }
  return (
    <span className="rule-summary__folder">
      <Icon name="folder" size={11} />
      {chip.label}
      {chip.withSubfolders === true ? (
        <span className="rule-summary__folder-note"> mit Unterordnern</span>
      ) : null}
    </span>
  );
}

export function RuleSummary({
  description,
  showNeutral = false,
  emptyText,
  size = "sm",
  className,
}: RuleSummaryProps) {
  if (description.isEmpty) {
    return (
      <p className={cx("rule-summary", `rule-summary--${size}`, "rule-summary--empty", className)}>
        <Icon name="alert-triangle" size={12} />
        {emptyText}
      </p>
    );
  }

  return (
    <div className={cx("rule-summary", `rule-summary--${size}`, className)}>
      {description.axes.map((axis) => (
        <span key={axis.id} className={cx("rule-summary__axis", `rule-summary__axis--${axis.id}`)}>
          <span className="rule-summary__axis-label">
            <Icon name={AXIS_ICON[axis.id]} size={11} />
            {axis.label}
          </span>
          {axis.exportState === undefined ? null : (
            <ExportStatusBadge state={axis.exportState} size="sm" detail="mindestens eine Buchung" />
          )}
          {axis.text === null || axis.exportState !== undefined ? null : (
            <span className="rule-summary__value">{axis.text}</span>
          )}
          {axis.chips.map((chip, index) => (
            <ChipView key={`${chip.kind}-${chip.label}-${String(index)}`} chip={chip} size={size} />
          ))}
        </span>
      ))}

      {showNeutral && description.neutral.length > 0 ? (
        <p className="rule-summary__neutral">
          <Icon name="info" size={11} />
          Ohne Einschränkung: {description.neutral.map((axis) => axis.label).join(", ")}. Diese
          Achsen lassen alles durch, was die übrigen übrig lassen — sie treffen nichts von sich aus.
        </p>
      ) : null}
    </div>
  );
}
