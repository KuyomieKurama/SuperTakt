import type { ForeignText } from "../api/types";
import { useId, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";
import { Button, IconButton, Spinner } from "./Primitives";
import { foreignText } from "../lib/foreign";
import { Foreign } from "./Foreign";

/**
 * Suche und Filter — A-3.3, A-13.7, I-10.
 *
 * Die Leiste macht drei Dinge sichtbar: wonach gesucht wird, welche Filter
 * gerade greifen und wie viele Treffer uebrig bleiben. Aktive Filter stehen
 * als entfernbare Chips darunter, damit nie ein Filter unbemerkt wirkt.
 *
 * Das gilt auch fuer Filter, die als Voreinstellung greifen: Dass eine
 * Pool-Ansicht erledigte Todos ausblendet (E-039), steht als Schalter in
 * dieser Leiste und nicht in einem Menue — sonst wundert sich der Benutzer
 * ueber ein fehlendes Todo und findet den Grund nicht.
 */

export interface SearchFieldProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly label: string;
  readonly placeholder?: string;
  readonly busy?: boolean;
  readonly disabled?: boolean;
  readonly hint?: string;
  readonly className?: string;
}

export function SearchField({
  value,
  onChange,
  label,
  placeholder = "Suchen …",
  busy = false,
  disabled = false,
  hint,
  className,
}: SearchFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={cx("search", disabled && "search--disabled", className)}>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <span className="search__icon" aria-hidden>
        <Icon name="search" size={15} />
      </span>
      <input
        id={id}
        type="search"
        className="search__input"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-describedby={hint === undefined ? undefined : hintId}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value !== "") {
            event.preventDefault();
            onChange("");
          }
        }}
      />
      {busy ? <Spinner size={14} className="search__busy" label="Suche läuft" /> : null}
      {value !== "" && !busy ? (
        <IconButton label="Suche leeren" icon="x" size="sm" onClick={() => onChange("")} />
      ) : null}
      {hint !== undefined ? (
        <span className="visually-hidden" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface ActiveFilter {
  readonly id: string;
  /** Name des Filters, zum Beispiel "Status". */
  readonly field: string;
  /** Gewaehlter Wert, zum Beispiel "Offen". */
  readonly value: ForeignText;
  readonly onRemove: () => void;
}

export interface FilterBarProps {
  readonly label: string;
  /** Auswahllisten und Umschalter, die den Filter setzen. */
  readonly controls: ReactNode;
  readonly activeFilters: readonly ActiveFilter[];
  readonly onResetAll: () => void;
  /** Bereits formatierter Trefferhinweis, zum Beispiel "42 von 318 Buchungen". */
  readonly resultLabel: string;
  readonly className?: string;
}

export function FilterBar({
  label,
  controls,
  activeFilters,
  onResetAll,
  resultLabel,
  className,
}: FilterBarProps) {
  return (
    <div className={cx("filterbar", className)}>
      <div className="filterbar__controls" role="group" aria-label={label}>
        {controls}
      </div>
      <div className="filterbar__status">
        <p className="filterbar__result" role="status" aria-live="polite">
          {resultLabel}
        </p>
        {activeFilters.length > 0 ? (
          <ul className="filterbar__chips">
            {activeFilters.map((filter) => (
              <li key={filter.id}>
                <span className="filter-chip">
                  <span className="filter-chip__field">{filter.field}:</span>
                  {/*
                    Der Wert eines aktiven Filters ist ein Tag-, Status- oder
                    Poolname aus dem Bestand — fremder Text (E-063, T-124). Das
                    Feld davor („Tag", „Status") ist unseres.
                  */}
                  <Foreign className="filter-chip__value" value={filter.value} />
                  <button
                    type="button"
                    className="filter-chip__remove"
                    aria-label={`Filter ${filter.field} ${foreignText(filter.value)} entfernen`}
                    onClick={filter.onRemove}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              </li>
            ))}
            <li>
              <Button variant="ghost" size="sm" onClick={onResetAll}>
                Alle Filter zurücksetzen
              </Button>
            </li>
          </ul>
        ) : (
          <p className="filterbar__hint muted">Kein Filter aktiv</p>
        )}
      </div>
    </div>
  );
}

export interface FilterToggleProps {
  readonly label: string;
  readonly pressed: boolean;
  readonly onChange: (next: boolean) => void;
  /** Zusatz unter der Beschriftung, zum Beispiel die Zahl der Betroffenen. */
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Zweistelliger Schalter in der Filterleiste — E-039.
 *
 * Gebraucht wird er zuerst fuer "Erledigte Todos anzeigen": Pool-Ansichten
 * blenden erledigte Todos aus (E-023, A-2.5), sonst gaebe es keinen Ort, an
 * den ein reaktiviertes Todo zurueckkehren koennte. Wer nachsehen will, was
 * er letzte Woche abgeschlossen hat, blendet sie hier ein.
 *
 * Umgesetzt als Knopf mit `aria-pressed` und nicht als Kontrollkaestchen:
 * Er loest sofort eine Wirkung aus, statt einen Wert fuer ein spaeteres
 * Absenden zu halten. Der Zustand steht zusaetzlich im Text, damit er nicht
 * allein an der Faerbung haengt.
 */
export function FilterToggle({
  label,
  pressed,
  onChange,
  hint,
  disabled = false,
  className,
}: FilterToggleProps) {
  return (
    <button
      type="button"
      className={cx("filter-toggle", pressed && "filter-toggle--on", className)}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onChange(!pressed)}
    >
      <span className="filter-toggle__track" aria-hidden>
        <span className="filter-toggle__knob">
          <Icon name={pressed ? "check" : "x"} size={9} />
        </span>
      </span>
      <span className="filter-toggle__text">
        <span className="filter-toggle__label">{label}</span>
        {hint !== undefined ? <span className="filter-toggle__hint">{hint}</span> : null}
      </span>
    </button>
  );
}
