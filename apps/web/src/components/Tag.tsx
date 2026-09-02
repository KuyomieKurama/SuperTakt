import { cx } from "../lib/cx";
import { Icon } from "./Icon";

/**
 * Tag-Chip — A-4.1 bis A-4.5, A-9.
 *
 * Ein Tag kann tief in einer Ordnerhierarchie liegen. Der Chip zeigt deshalb
 * optional den Ordnerpfad als gedaempftes Praefix, damit "Nord" aus
 * "Kunden / Nord" nicht mit "Nord" aus "Standorte / Nord" verwechselt wird
 * (A-4.4).
 */
export type TagTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface TagChipProps {
  readonly label: string;
  /** Ordnerpfad ohne den Tag selbst, zum Beispiel ["Kunden", "Nord"]. */
  readonly path?: readonly string[];
  readonly tone?: TagTone;
  readonly size?: "sm" | "md";
  /** Kennzeichnet einen Standard-Tag aus den Einstellungen (A-9.1). */
  readonly isDefault?: boolean;
  /**
   * Dieses Tag gibt es **noch nicht** (T-059).
   *
   * Der Benutzer hat den Namen eingetippt; angelegt wird er erst beim
   * Speichern. Das ist ein anderer Zustand als „vorhanden und gewählt", und er
   * hängt nicht an der Farbe: gestrichelte Kontur, ein Pluszeichen statt des
   * Punktes und das Wort „neu" — drei Merkmale, damit die Unterscheidung auch
   * ohne Farbwahrnehmung und ohne Vergleichsstück trägt (SC 1.4.1).
   */
  readonly isNew?: boolean;
  /** Macht den Chip zum Umschalter, etwa in der Filterleiste. */
  readonly onToggle?: () => void;
  readonly selected?: boolean;
  /** Zeigt einen Entfernen-Knopf. Nur ohne `onToggle` sinnvoll. */
  readonly onRemove?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function TagChip({
  label,
  path,
  tone = "neutral",
  size = "md",
  isDefault = false,
  isNew = false,
  onToggle,
  selected = false,
  onRemove,
  disabled = false,
  className,
}: TagChipProps) {
  const classes = cx(
    "chip",
    `chip--${tone}`,
    `chip--${size}`,
    selected && "chip--selected",
    disabled && "chip--disabled",
    isNew && "chip--new",
    className,
  );

  // In der dichten Groesse ist nur der letzte Ordner sichtbar, sonst frisst
  // der Pfad den Platz des Tags. Der vollstaendige Pfad bleibt im Titel und
  // fuer Hilfsmittel erhalten.
  const hasPath = path !== undefined && path.length > 0;
  const visiblePath = hasPath
    ? size === "sm"
      ? (path[path.length - 1] ?? "")
      : path.join(" / ")
    : "";

  const content = (
    <>
      {isNew ? (
        <span className="chip__new-mark" aria-hidden>
          <Icon name="plus" size={11} />
        </span>
      ) : (
        <span className="chip__dot" aria-hidden />
      )}
      {hasPath ? (
        <>
          <span className="visually-hidden">{path.join(" / ")} / </span>
          <span className="chip__path" aria-hidden>
            {visiblePath}
            <span> / </span>
          </span>
        </>
      ) : null}
      <span className="chip__label">{label}</span>
      {isNew ? (
        <span className="chip__badge chip__badge--new" title="Dieses Tag wird beim Speichern angelegt">
          <span className="visually-hidden">wird neu angelegt</span>
          <span aria-hidden>neu</span>
        </span>
      ) : null}
      {isDefault ? (
        <span className="chip__badge" title="Standard-Tag">
          <span className="visually-hidden">Standard-Tag</span>
          <span aria-hidden>S</span>
        </span>
      ) : null}
    </>
  );

  if (onToggle !== undefined) {
    return (
      <button
        type="button"
        className={cx(classes, "chip--interactive")}
        aria-pressed={selected}
        disabled={disabled}
        onClick={onToggle}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} title={hasPath ? `${path.join(" / ")} / ${label}` : label}>
      {content}
      {onRemove !== undefined ? (
        <button
          type="button"
          className="chip__remove"
          aria-label={`Tag ${label} entfernen`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Icon name="x" size={12} />
        </button>
      ) : null}
    </span>
  );
}

export interface TagPathProps {
  /** Vollstaendiger Pfad einschliesslich des Tags am Ende. */
  readonly segments: readonly string[];
  readonly className?: string;
}

/**
 * Brotkrumenpfad fuer tiefe Ordnerbaeume (A-4.3, A-4.4). Zeigt bei mehr als
 * vier Ebenen nur Anfang und Ende und kuerzt die Mitte, damit die Zeile nicht
 * umbricht. Der vollstaendige Pfad bleibt fuer Hilfsmittel erhalten.
 */
export function TagPath({ segments, className }: TagPathProps) {
  const shorten = segments.length > 4;
  const visible = shorten
    ? [segments[0] ?? "", "…", ...segments.slice(-2)]
    : [...segments];

  return (
    <span className={cx("tag-path", className)}>
      <span className="visually-hidden">Pfad: {segments.join(" / ")}</span>
      <span aria-hidden className="tag-path__inner">
        {visible.map((segment, index) => (
          <span key={`${segment}-${index}`} className="tag-path__segment">
            {index > 0 ? <span className="tag-path__separator">/</span> : null}
            {segment}
          </span>
        ))}
      </span>
    </span>
  );
}
