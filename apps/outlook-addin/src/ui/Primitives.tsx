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

import { visibleText } from '../text/hidden.ts';

/**
 * Fremder Text in der Anzeige (T-119).
 *
 * Der Aufgabenbereich zeigt fast nur Text, den ein anderer geschrieben hat:
 * Betreff, Absender und Textkörper einer E-Mail (Akteur A-06), dazu Titel und
 * Tagnamen aus dem Bestand. Das ist hier der Regelfall und nicht die Ausnahme —
 * deshalb gibt es dafür einen Baustein und keine Regel, an die man sich erinnern
 * muss.
 *
 * Zwei Dinge auf einmal, und beide sind nötig:
 *
 *  1. **`<bdi>`** isoliert den Text von seiner Umgebung. Ohne diese Klammer
 *     ordnet ein von rechts nach links geschriebener Titel den deutschen Satz
 *     um, in dem er steht — die Beschriftung „15 Minuten auf „…" buchen" ist
 *     der Fall, an dem das am meisten wehtut.
 *  2. **{@link visibleText}** nimmt dem Inhalt die Zeichen, die ihn umordnen,
 *     ohne sichtbar zu sein. Die Isolierung allein tut das **nicht**: Ein
 *     `U+202E` im Betreff dreht die Anzeige innerhalb des isolierten Blocks
 *     weiter um. Die Begründung steht in `../text/hidden.ts` und ausführlich an
 *     der Quelle, `packages/domain/src/characters.ts` (seit T-123 liest das
 *     Add-in die Zeichenklasse dort, statt sie zu führen).
 *
 * Wo ein Element nicht möglich ist — in einem `title`, einem `aria-label`, in
 * einem Satz, der als Zeichenkette entsteht —, steht `visibleText` allein. Dann
 * fehlt die Isolierung, und das ist ausgesprochen: Der Inhalt kann nichts mehr
 * umdrehen, aber ein hebräischer Titel steht in einem deutschen Satz weiterhin
 * dort, wohin ihn der Bidi-Algorithmus setzt.
 *
 * **Nicht** hierdurch geht der Inhalt von Eingabefeldern. Was in einem `input`
 * oder `textarea` steht, ist der Stand der Bearbeitung; ihn anzuzeigen wie
 * geschrieben ist die Voraussetzung dafür, ihn ändern zu können.
 */
export function Foreign({
  value,
  className,
}: {
  readonly value: string;
  readonly className?: string;
}) {
  return <bdi className={className}>{visibleText(value)}</bdi>;
}

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
  /**
   * Seit T-119 ein Knoten und keine Zeichenkette mehr.
   *
   * Zwei Überschriften tragen fremden Text: der Titel eines Todos nach einer
   * Buchung und der eines Angebots. Als Zeichenkette ließe sich er nur
   * bereinigen, nicht isolieren; als Knoten kann `<Foreign>` hinein. Jede
   * bisherige Aufrufstelle bleibt gültig — eine Zeichenkette **ist** ein
   * `ReactNode`.
   */
  readonly title?: ReactNode;
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
      {/*
        Tagname und Ordnerpfad sind fremder Text (T-119): Sie kommen aus dem
        Bestand oder aus dem Suchfeld daneben, und ein Name mit einem
        Richtungszeichen drehte sonst die ganze Chipzeile um — samt dem „×" des
        Nachbarchips, das dann an einem anderen Chip zu hängen scheint.
      */}
      {path !== undefined && path.length > 0 ? (
        <Foreign className="chip__path" value={path} />
      ) : null}
      <Foreign className="chip__label" value={label} />
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
          // Eine Beschriftung für die Sprachausgabe ist ein Attribut und kein
          // Element — hier bleibt nur das Bereinigen (T-119).
          aria-label={removeLabel ?? `${visibleText(label)} entfernen`}
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
