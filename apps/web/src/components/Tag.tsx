import type { ForeignText } from "../api/types";
import { cx } from "../lib/cx";
import { foreignText } from "../lib/foreign";
import { Foreign } from "./Foreign";
import { Icon } from "./Icon";

/**
 * Tag-Chip — A-4.1 bis A-4.5, A-9.
 *
 * Ein Tag kann tief in einer Ordnerhierarchie liegen. Der Chip zeigt deshalb
 * optional den Ordnerpfad als gedaempftes Praefix, damit "Nord" aus
 * "Kunden / Nord" nicht mit "Nord" aus "Standorte / Nord" verwechselt wird
 * (A-4.4).
 *
 * ## Name und Pfad sind fremder Text (E-063, T-124)
 *
 * Beide kommen aus dem Bestand und koennen aus dem Add-in stammen; Namen von
 * vor T-101 koennen ausserdem Zeichen tragen, die `nameSchema` heute abweist
 * (Altbestand, siehe `packages/domain/src/characters.ts`). Sie laufen deshalb
 * ueber {@link Foreign} beziehungsweise `foreignText` — **hier**, im Baustein,
 * und nicht an den ueber zwanzig Aufrufstellen. Ein Chip ist Anzeige und kein
 * Eingabefeld; die eine Stelle, an der ein Tagname eingegeben wird, ist das
 * Textfeld in `TagInput`, und das bleibt unangetastet.
 */
export type TagTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface TagChipProps {
  readonly label: ForeignText;
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
          <span className="visually-hidden">
            <Foreign value={path.join(" / ")} /> /{" "}
          </span>
          <span className="chip__path" aria-hidden>
            <Foreign value={visiblePath} />
            <span> / </span>
          </span>
        </>
      ) : null}
      <Foreign className="chip__label" value={label} />
      {/*
        Kein `title` mehr an den beiden Marken (T-181, ST-09). Eine Marke trug
        zwei Texte mit zwei Wortlauten („Dieses Tag wird beim Speichern
        angelegt" gegen „wird neu angelegt"), und auf einem `<span>` ist ein
        Titelattribut ohnehin nicht zugaenglich: nicht mit der Tastatur
        erreichbar, nicht abweisbar, nicht ueberfahrbar (SC 1.4.13). Der
        `visually-hidden`-Text bleibt zeichengleich — er ist der zugaengliche
        Text und damit vertraglich.
      */}
      {isNew ? (
        <span className="chip__badge chip__badge--new">
          <span className="visually-hidden">wird neu angelegt</span>
          <span aria-hidden>neu</span>
        </span>
      ) : null}
      {isDefault ? (
        <span className="chip__badge">
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
    <span
      className={classes}
      title={
        hasPath
          ? `${foreignText(path.join(" / "))} / ${foreignText(label)}`
          : foreignText(label)
      }
    >
      {content}
      {onRemove !== undefined ? (
        <button
          type="button"
          className="chip__remove"
          aria-label={`Tag ${foreignText(label)} entfernen`}
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
  readonly segments: readonly ForeignText[];
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
      <span className="visually-hidden">
        Pfad: <Foreign value={segments.join(" / ")} />
      </span>
      <span aria-hidden className="tag-path__inner">
        {visible.map((segment, index) => (
          <span key={`${segment}-${index}`} className="tag-path__segment">
            {index > 0 ? <span className="tag-path__separator">/</span> : null}
            {/* „…" ist von uns; `Foreign` laesst es unveraendert durch. */}
            <Foreign value={segment} />
          </span>
        ))}
      </span>
    </span>
  );
}
