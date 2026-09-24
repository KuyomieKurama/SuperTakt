import { useId } from "react";
import { cx } from "../../lib/cx";
import { useFieldMessageLive } from "../../lib/fieldMessages";
import { Icon } from "./Icon";
import { labels } from "../../lib/labels";

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
 *   1. Randschiene links — durchgezogen (Leistung) gegen unterbrochen (Vermerk)
 *   2. Kopfband mit Richtung — "Verlaesst Takt" gegen "Bleibt in Takt"
 *   3. Symbol im Kopfband — Pfeil nach aussen gegen Schloss
 *   4. Marke direkt vor der Beschriftung — gefuellt gegen Kontur
 *   5. Schreibflaeche — hell wie ein Ausgabefeld gegen gedaempft
 *   6. Fussnote — nennt Ziel und Empfaenger gegen "wird nie exportiert"
 *
 * Merkmal 1 und 4 tragen auch dann, wenn das Kopfband abgeschnitten ist, und
 * bleiben in Graustufen unterscheidbar. Fuer Merkmal 1 steht die Zahl dazu im
 * Kontrastlauf: In der Luecke der unterbrochenen Schiene sieht man die Karte,
 * also ist Balken gegen Luecke dasselbe Verhaeltnis wie Schiene gegen Karte —
 * 3,49:1 hell und 4,31:1 dunkel (`scripts/contrast-check.mjs`, Gruppe
 * "Feldart"). Die Graustufenprobe in Abschnitt 7 der Musterseite zeigt das
 * Bauteil als Ganzes und kann ein **einzelnes** Merkmal nicht freisprechen: Sie
 * besteht, solange irgendeines der sechs traegt, und genau deshalb ist die
 * gestreifte Schiene, die bis T-202 hier stand, jahrelang durchgekommen,
 * obwohl sie nie gezeichnet wurde (T-194 Abschnitt 2.1, gemessen in T-198).
 */
export type NoteScope = "billing" | "internal";

/** The words of each note kind live in `labels().noteField` (locked sentences SP-09). */
const SCOPE_ICON: Readonly<Record<NoteScope, "arrow-up-right" | "lock">> = {
  billing: "arrow-up-right",
  internal: "lock",
};

export interface NoteFieldProps {
  readonly scope: NoteScope;
  readonly value: string;
  readonly onChange: (next: string) => void;
  /** Ueberschreibt die Standardbeschriftung der Feldart. */
  readonly label?: string;
  /** Wenn eine umgebende Karte bereits die sichtbare Überschrift trägt. */
  readonly hideLabel?: boolean;
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
  hideLabel = false,
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
  const text = labels().noteField;
  const definition = { ...text[scope], bannerIcon: SCOPE_ICON[scope] };
  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;
  const countId = `${fieldId}-count`;
  const quietLive = useFieldMessageLive();
  const showHelp = scope === "billing" || (readOnly && readOnlyHint !== undefined);

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
      <p className="note__banner" id={showHelp ? undefined : helpId}>
        <Icon name={definition.bannerIcon} size={13} />
        <span>{definition.bannerLabel}</span>
        {readOnly ? <span className="note__banner-tail">{text.locked}</span> : null}
      </p>

      <div className="note__frame">
        <label className={hideLabel ? "visually-hidden" : "note__label"} htmlFor={fieldId}>
          <span className="note__mark" aria-hidden>
            <Icon name={definition.bannerIcon} size={11} />
          </span>
          <span className="visually-hidden">{definition.markLabel}: </span>
          {label ?? definition.defaultLabel}
          {required ? (
            <>
              <span aria-hidden> *</span>
              <span className="visually-hidden">{labels().requiredField}</span>
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
          {showHelp ? (
            <p className="note__help" id={helpId}>
              {readOnly && readOnlyHint !== undefined ? readOnlyHint : definition.help}
            </p>
          ) : null}
          {maxLength !== undefined ? (
            <p className="note__count" id={countId}>
              <span className="visually-hidden">{text.characters}</span>
              {value.length} / {maxLength}
            </p>
          ) : null}
        </div>

        {/*
          Die Meldeflaeche steht **immer** im Baum, auch leer (T-186, Befund
          O-FX). Bis dahin war sie der eine Baustein, den T-162 nicht erreicht
          hat: Ein `role="alert"`, das erst zusammen mit seinem Inhalt entsteht,
          wird von vielen Vorlesehilfen uebergangen — sie melden Aenderungen an
          einer Region, die sie kennen, und diese kennen sie in dem Augenblick
          noch nicht. Eine Meldung, die **waehrend** des stehenden Dialogs
          entsteht, blieb deshalb stumm.

          Dieselbe Bauart und derselbe Grund wie in `FormDialog.tsx#TextField`
          (T-162), in `ConfirmDialog.tsx` (T-118, T-175) und im Aufgabenbereich
          des Add-ins (`outlook-addin/src/ui/field.ts`, T-158). Gemessen wird
          sie an `TextField` in `tests/e2e/field-live-region-announcement.spec.ts`;
          fuer dieses Feld steht die Messung aus (Bericht T-186).

          `alert` und nicht `status`: Eine Feldmeldung ist die Absage an eine
          gerade getaetigte Eingabe. Leer nimmt die Flaeche keinen Platz ein —
          den Abstand traegt `.note__error` selbst.

          `aria-live` schaltet sie waehrend eines Absendeversuchs still, ohne
          die Rolle anzutasten: Dann traegt der Fokuswechsel den Satz, und ein
          zweites Mal ist keine Hilfe (T-202, `lib/fieldMessages.ts`).
        */}
        <div className="note__live" role="alert" aria-live={quietLive}>
          {error === undefined ? null : (
            <p className="note__error" id={errorId}>
              <Icon name="alert-circle" size={14} />
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
