import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { focusFirstWithin, keepTabInside } from "../lib/focus";
import { cx } from "../lib/cx";
import { Button, IconButton, InlineMessage } from "./Primitives";

/**
 * Takt — modaler Dialog mit einem Formular darin.
 *
 * `ConfirmDialog` beantwortet eine Ja-Nein-Frage; sein Rumpf ist ein Absatz.
 * Sobald ein Eingabefeld dazukommt — die Leistung beim Stoppen, der Titel eines
 * neuen Todos, der Name einer Statusspalte —, braucht es einen Rumpf, der
 * beliebige Elemente aufnimmt. Beides in einen Baustein zu zwingen hätte
 * geheißen, ein `<div>` in ein `<p>` zu schreiben.
 *
 * Gemeinsam bleibt, was zugänglich sein muss: `role="dialog"`, `aria-modal`,
 * Fokus beim Öffnen hinein und beim Schließen zurück, Tabulatorschleife
 * (SC 2.4.3), Escape schließt, Absenden über die Eingabetaste.
 */
export interface FormDialogProps {
  readonly open: boolean;
  readonly title: string;
  /** Ein Satz unter der Überschrift. Sagt, was der Dialog tut. */
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly submitLabel: string;
  readonly cancelLabel?: string;
  readonly tone?: "default" | "danger";
  readonly busy?: boolean;
  /** Sperrt den Absendeknopf, etwa bei leerem Pflichtfeld. */
  readonly submitDisabled?: boolean;
  /** Fehler aus dem letzten Versuch. Bleibt stehen, bis er behoben ist. */
  readonly error?: string | null;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  /** Breiter Dialog, etwa für eine Vorschau. */
  readonly wide?: boolean;
}

export function FormDialog({
  open,
  title,
  description,
  children,
  submitLabel,
  cancelLabel = "Abbrechen",
  tone = "default",
  busy = false,
  submitDisabled = false,
  error = null,
  onSubmit,
  onCancel,
  wide = false,
}: FormDialogProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Erst das Formular, dann der Rest: Wer einen Dialog mit Feldern oeffnet,
    // will tippen — nicht auf dem Schliesskreuz stehen.
    const firstField = dialogRef.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])",
    );
    if (firstField === null || firstField === undefined) focusFirstWithin(dialogRef.current);
    else firstField.focus();
    return () => {
      openerRef.current?.focus();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      /*
       * Eine Taste, die eine aufgeklappte Liste schon behandelt hat, gehört
       * nicht mehr dem Dialog (T-059).
       *
       * Die Listen von Ark UI hängen im Portal am Dokumentkörper, stehen im
       * React-Baum aber unter diesem Dialog — ihre Tastenanschläge laufen
       * deshalb hier vorbei. Zag behandelt Escape in der Erfassungsphase und
       * setzt `preventDefault`; ohne diese Abfrage schlösse ein Escape in der
       * offenen Liste **beides**: die Liste und den Dialog dahinter.
       */
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) onCancel();
        return;
      }
      keepTabInside(dialogRef.current, event);
    },
    [busy, onCancel],
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy || submitDisabled) return;
      onSubmit();
    },
    [busy, submitDisabled, onSubmit],
  );

  if (!open) return null;

  return (
    <div className="scrim" onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...(description === undefined ? {} : { "aria-describedby": descriptionId })}
        className={cx("dialog", "dialog--form", wide && "dialog--wide", tone === "danger" && "dialog--danger")}
      >
        <form onSubmit={submit}>
          <div className="dialog__head dialog__head--form">
            <div className="grow">
              <h2 className="dialog__title" id={titleId}>
                {title}
              </h2>
              {description === undefined ? null : (
                <p className="dialog__lead" id={descriptionId}>
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Dialog schließen" icon="x" size="sm" onClick={onCancel} />
          </div>

          <div className="dialog__body dialog__body--form">
            {children}
            {error === null ? null : (
              <InlineMessage tone="danger" title="Das hat nicht geklappt">
                {error}
              </InlineMessage>
            )}
          </div>

          <div className="dialog__footer">
            <Button variant="ghost" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={tone === "danger" ? "danger" : "primary"}
              loading={busy}
              disabled={submitDisabled}
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Textfeld in einer Zeile                                              */
/* ==================================================================== */

export interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly maxLength?: number;
  readonly type?: "text" | "datetime-local" | "date";
  readonly className?: string;
}

/**
 * Einzeiliges Eingabefeld mit Beschriftung, Hilfetext und Fehlertext.
 *
 * Beschriftung immer sichtbar, nie nur als Platzhalter: Ein Platzhalter
 * verschwindet beim Tippen, und dann steht niemand mehr da, der sagt, was in
 * das Feld gehört (SC 3.3.2).
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  required = false,
  disabled = false,
  maxLength,
  type = "text",
  className,
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
    .filter((part): part is string => part !== null)
    .join(" ");

  return (
    <div className={cx("field", className)}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <>
            <span aria-hidden> *</span>
            <span className="visually-hidden"> (Pflichtfeld)</span>
          </>
        ) : null}
      </label>
      <input
        id={id}
        type={type}
        className={cx("field__input", error !== undefined && "field__input--invalid")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={error === undefined ? undefined : true}
        {...(describedBy.length === 0 ? {} : { "aria-describedby": describedBy })}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(maxLength === undefined ? {} : { maxLength })}
      />
      {hint === undefined ? null : (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
