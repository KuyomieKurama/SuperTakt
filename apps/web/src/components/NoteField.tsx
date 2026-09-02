import { useId } from "react";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";

/**
 * Die zwei Textfelder am Todo und an der Buchung — A-7.1 bis A-7.4, R-08.
 *
 * In der Spezifikation heissen beide "Notiz", aber nur eines verlaesst die
 * Anwendung. Nach E-016 heissen sie in der Oberflaeche:
 *
 *   scope="billing"   "Leistung"  — geht in den Export (A-7.3, A-7.4)
 *   scope="internal"  "Vermerk"   — bleibt in Takt (A-7.1, A-7.2)
 *
 * Die beiden Woerter teilen keinen Wortstamm mehr. Der Schluessel im Export
 * bleibt `Notiz`, weil ihn das Abrechnungstool vorgibt (A-8.2) —
 * Beschriftung und Schluessel duerfen auseinandergehen.
 *
 * Die Beschriftung allein traegt die Folge aber nicht: "Leistung" sagt, was
 * drinsteht, nicht wohin es geht. Deshalb wird der Unterschied ueber sechs
 * sichtbare Merkmale getragen, von denen nur eines Farbe ist:
 *
 *   1. Randschiene links — gestreift (Leistung) gegen einfarbig (Vermerk)
 *   2. Kopfband mit Richtung — "Verlaesst Takt" gegen "Bleibt in Takt"
 *   3. Symbol im Kopfband — Pfeil nach aussen gegen Schloss
 *   4. Marke direkt vor der Beschriftung — gefuellt gegen Kontur
 *   5. Schreibflaeche — hell wie ein Ausgabefeld gegen gedaempft
 *   6. Fussnote — nennt Ziel und Empfaenger gegen "wird nie exportiert"
 *
 * Merkmal 1 und 4 tragen auch dann, wenn das Kopfband abgeschnitten ist, und
 * bleiben in Graustufen unterscheidbar (Probe in Abschnitt 7 der Musterseite).
 */
export type NoteScope = "billing" | "internal";

interface ScopeDefinition {
  readonly bannerLabel: string;
  readonly bannerIcon: "arrow-up-right" | "lock";
  readonly defaultLabel: string;
  /** Vorgelesener Zusatz an der Marke vor der Beschriftung. */
  readonly markLabel: string;
  readonly help: string;
  readonly defaultPlaceholder: string;
}

const SCOPE: Readonly<Record<NoteScope, ScopeDefinition>> = {
  billing: {
    bannerLabel: "Verlässt Takt · steht in der Abrechnung",
    bannerIcon: "arrow-up-right",
    defaultLabel: "Leistung",
    markLabel: "Wird exportiert",
    help: "Wird beim Export an das Abrechnungstool übertragen und steht dort auf der Rechnung des Kunden. Standardvorlage: Feld „Notiz“.",
    defaultPlaceholder: "Was wurde in diesem Zeitraum für den Kunden geleistet?",
  },
  internal: {
    bannerLabel: "Bleibt in Takt",
    bannerIcon: "lock",
    defaultLabel: "Vermerk",
    markLabel: "Wird nicht exportiert",
    help: "Bleibt in Takt. Wird nie exportiert — auch nicht über eine eigene Exportvorlage.",
    defaultPlaceholder: "Nur für dich. Gedanken, Zwischenstände, Ansprechpartner …",
  },
};

export interface NoteFieldProps {
  readonly scope: NoteScope;
  readonly value: string;
  readonly onChange: (next: string) => void;
  /** Ueberschreibt die Standardbeschriftung der Feldart. */
  readonly label?: string;
  readonly placeholder?: string;
  readonly rows?: number;
  readonly maxLength?: number;
  /** Fehlertext. Wird unter dem Feld ausgegeben und per aria-describedby verknüpft. */
  readonly error?: string;
  readonly disabled?: boolean;
  /** Gesperrt, weil die Buchung bereits exportiert ist (A-6.9). */
  readonly readOnly?: boolean;
  readonly readOnlyHint?: string;
  readonly required?: boolean;
  readonly className?: string;
}

export function NoteField({
  scope,
  value,
  onChange,
  label,
  placeholder,
  rows = 3,
  maxLength,
  error,
  disabled = false,
  readOnly = false,
  readOnlyHint,
  required = false,
  className,
}: NoteFieldProps) {
  const definition = SCOPE[scope];
  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;
  const countId = `${fieldId}-count`;

  const describedBy = [
    helpId,
    error !== undefined ? errorId : null,
    maxLength !== undefined ? countId : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" ");

  return (
    <div
      className={cx(
        "note",
        `note--${scope}`,
        error !== undefined && "note--invalid",
        disabled && "note--disabled",
        readOnly && "note--readonly",
        className,
      )}
    >
      <p className="note__banner">
        <Icon name={definition.bannerIcon} size={13} />
        <span>{definition.bannerLabel}</span>
        {readOnly ? <span className="note__banner-tail">gesperrt</span> : null}
      </p>

      <div className="note__frame">
        <label className="note__label" htmlFor={fieldId}>
          <span className="note__mark" aria-hidden>
            <Icon name={definition.bannerIcon} size={11} />
          </span>
          <span className="visually-hidden">{definition.markLabel}: </span>
          {label ?? definition.defaultLabel}
          {required ? (
            <>
              <span aria-hidden> *</span>
              <span className="visually-hidden"> (Pflichtfeld)</span>
            </>
          ) : null}
        </label>

        <textarea
          id={fieldId}
          className="note__input"
          value={value}
          rows={rows}
          placeholder={placeholder ?? definition.defaultPlaceholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={describedBy}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />

        <div className="note__footer">
          <p className="note__help" id={helpId}>
            {readOnly && readOnlyHint !== undefined ? readOnlyHint : definition.help}
          </p>
          {maxLength !== undefined ? (
            <p className="note__count" id={countId}>
              <span className="visually-hidden">Zeichen: </span>
              {value.length} / {maxLength}
            </p>
          ) : null}
        </div>

        {error !== undefined ? (
          <p className="note__error" id={errorId} role="alert">
            <Icon name="alert-circle" size={14} />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
