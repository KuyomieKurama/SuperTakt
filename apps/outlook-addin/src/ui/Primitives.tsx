/**
 * Takt — Bausteine des Aufgabenbereichs.
 *
 * Dieselben Klassennamen und dieselben Zustände wie in der Hauptanwendung
 * (`apps/web/src/styles/components.css`), aber eine eigene, schmalere
 * Umsetzung: Ein Aufgabenbereich ist 320 bis 450 Pixel breit, und die
 * Bausteine der Hauptanwendung sind für eine Tabelle mit sechs Spalten
 * gebaut.
 *
 * Geteilt werden die **Werte**, nicht der Quelltext: `@takt/ui-tokens` ist die
 * eine Quelle für Farben, Abstände, Radien und Bewegungsdauern (A-10.6, E-024).
 * In `styles/addin.css` steht kein einziger roher Farbwert. Das ist der
 * Unterschied zwischen „sieht ähnlich aus" und „ist dasselbe System".
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
  readonly full?: boolean;
  readonly children: ReactNode;
}

export function Button({
  variant = 'secondary',
  loading = false,
  full = false,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`];
  if (loading) classes.push('btn--loading');
  if (full) classes.push('btn--full');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      // Ein ladender Knopf ist gesperrt, sieht aber nicht deaktiviert aus —
      // sonst wäre „arbeitet gerade" von „geht nicht" nicht zu unterscheiden.
      disabled={disabled === true || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      <span className="btn__label">{children}</span>
    </button>
  );
}

interface FieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly hint?: string;
  readonly error?: string | undefined;
  readonly children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className={error === undefined ? 'field' : 'field field--invalid'}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint !== undefined && error === undefined ? (
        <p className="field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {error !== undefined ? (
        <p className="field__error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type CalloutTone = 'info' | 'warning' | 'danger' | 'success';

interface CalloutProps {
  readonly tone: CalloutTone;
  readonly title?: string;
  readonly children: ReactNode;
  readonly action?: ReactNode;
}

/**
 * Hinweisfläche.
 *
 * Der Ton wird **nicht nur über Farbe** getragen: Jeder Ton hat ein eigenes
 * Zeichen und eine eigene Überschrift. Farbe allein wäre für einen Teil der
 * Benutzer keine Information (WCAG 1.4.1).
 */
export function Callout({ tone, title, children, action }: CalloutProps) {
  const marks: Readonly<Record<CalloutTone, string>> = {
    info: 'i',
    warning: '!',
    danger: '×',
    success: '✓',
  };

  return (
    <div className={`callout callout--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="callout__mark" aria-hidden="true">
        {marks[tone]}
      </span>
      <div className="callout__body">
        {title !== undefined ? <p className="callout__title">{title}</p> : null}
        <div className="callout__text">{children}</div>
        {action !== undefined ? <div className="callout__actions">{action}</div> : null}
      </div>
    </div>
  );
}

interface ChipProps {
  readonly label: string;
  readonly path?: string | undefined;
  readonly tone?: 'default' | 'default-tag' | 'new-tag';
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
}

/** Wortmarke und Erklärung je Sonderfall. Ein Ort, damit beide zusammenbleiben. */
const CHIP_NOTE: Readonly<Record<'default-tag' | 'new-tag', { label: string; title: string }>> =
  Object.freeze({
    'default-tag': {
      label: 'Standard',
      title: 'Standard-Tag aus den Einstellungen (A-9.3)',
    },
    'new-tag': {
      label: 'neu',
      title: 'Dieses Tag gibt es in Takt noch nicht. Es entsteht zusammen mit dem Todo.',
    },
  });

/**
 * Ein gewähltes Tag.
 *
 * `tone="default-tag"` kennzeichnet die Standard-Tags aus A-9.3/A-9.5. Diese
 * Unterscheidung ist Pflicht, nicht Schmuck: Der Benutzer muss erkennen können,
 * welche Tags er selbst gewählt hat und welche der Dienst gesetzt hat — sonst
 * wirkt eine Vorbelegung wie eine eigene Entscheidung.
 *
 * `tone="new-tag"` kennzeichnet einen Namen, den es in Takt **noch nicht gibt**
 * (T-061). Aus demselben Grund: Ein Tag anzulegen ist eine Wirkung auf den
 * gemeinsamen Bestand und nicht bloß eine Auswahl. Wer sie auslöst, soll sie
 * vorher sehen — und zwar bevor der Knopf gedrückt ist, nicht in der
 * Erfolgsmeldung danach.
 */
export function Chip({ label, path, tone = 'default', onRemove, removeLabel }: ChipProps) {
  const note = tone === 'default' ? null : CHIP_NOTE[tone];

  return (
    <span
      className={
        tone === 'default-tag'
          ? 'chip chip--preset'
          : tone === 'new-tag'
            ? 'chip chip--new'
            : 'chip'
      }
    >
      {path !== undefined && path.length > 0 ? <span className="chip__path">{path}</span> : null}
      <span className="chip__label">{label}</span>
      {note !== null ? (
        <span className="chip__note" title={note.title}>
          {note.label}
        </span>
      ) : null}
      {onRemove !== undefined ? (
        <button
          type="button"
          className="chip__remove"
          onClick={onRemove}
          aria-label={removeLabel ?? `${label} entfernen`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function Skeleton({ lines = 3 }: { readonly lines?: number }) {
  return (
    <div className="loading-block" aria-hidden="true">
      {Array.from({ length: lines }, (_unused, index) => (
        <span key={index} className="skeleton" style={{ height: '1rem', width: `${String(90 - index * 12)}%` }} />
      ))}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  actions,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <section className="pane-section">
      <header className="pane-section__header">
        <h2 className="pane-section__title">{title}</h2>
        {actions}
      </header>
      {description !== undefined ? <p className="pane-section__lead">{description}</p> : null}
      <div className="pane-section__body">{children}</div>
    </section>
  );
}
