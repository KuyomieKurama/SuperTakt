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
import { fieldParts, type FieldAria } from './field.ts';

export type { FieldAria } from './field.ts';

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
  /**
   * Das Bedienelement — als Funktion und nicht als Knoten (T-158).
   *
   * Der Grund ist der Befund V-03: `Field` erzeugte die Kennungen, und kein
   * einziges Eingabefeld verwies darauf. Ein Knoten lässt sich nur erraten
   * (`cloneElement` auf das erste Kind, das wie ein Feld aussieht) — bei den
   * Feldern dieses Bereichs wäre das Raten falsch: Das Tag-Feld trägt drei
   * Zustände, das Dauerfeld eine Knopfreihe neben dem Eingabefeld, das
   * Tokenfeld einen Knopf daneben. Als Funktion bekommt jede Aufrufstelle die
   * Attribute in die Hand und setzt sie dorthin, wo das Bedienelement
   * tatsächlich steht.
   */
  readonly children: (aria: FieldAria) => ReactNode;
}

/**
 * Beschriftung, Bedienelement, Hinweis, Meldung — in dieser Reihenfolge.
 *
 * Drei Eigenschaften, die seit T-158 gelten und die vorher fehlten (V-03):
 *
 *  1. Das Bedienelement **verweist** auf beide Texte (`aria-describedby`) und
 *     trägt `aria-invalid`, solange eine Meldung steht.
 *  2. Der **Hinweis bleibt**, wenn eine Meldung dazukommt. Die Meldung sagt,
 *     was falsch ist; der Hinweis sagt, was das Feld ist. Am Fristfeld sagt er
 *     außerdem, warum es leer war — und das ist die Auskunft, die genau dann
 *     gebraucht wird, wenn der Benutzer am Feld hängt.
 *  3. Die **Meldefläche steht immer da, auch leer.** Ein `role="alert"`, das
 *     erst zusammen mit seinem Inhalt in den Baum kommt, wird von vielen
 *     Vorlesehilfen nicht angesagt: Sie melden Änderungen an einer Region, die
 *     sie kennen, und diese kennen sie in dem Augenblick noch nicht. Dieselbe
 *     Bauart und derselbe Grund wie im Bestätigungsdialog der Hauptanwendung
 *     (B-5 aus T-116, gebaut in T-118). Der Unterschied zu dort: Eine
 *     Feldmeldung ist eine Absage an eine gerade getätigte Eingabe, also
 *     `alert` und nicht `status`.
 *
 * Was die Meldefläche **nicht** enthält: den Hinweis. Er liegt bereits in
 * `aria-describedby` und stünde sonst beim Öffnen zweimal da.
 */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  const parts = fieldParts(htmlFor, hint, error);

  return (
    <div className={parts.className}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children(parts.aria)}
      {parts.showHint ? (
        <p className="field__hint" id={parts.hintId}>
          {hint}
        </p>
      ) : null}
      <div className="field__live" role="alert">
        {parts.showError ? (
          <p className="field__error" id={parts.errorId}>
            {error}
          </p>
        ) : null}
      </div>
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

/**
 * Wortmarke und Erklärung je Sonderfall. Ein Ort, damit beide zusammenbleiben.
 *
 * **Beide `title` sind in T-196 gekürzt** — ST-A-03 (Z-42) und ST-A-06 (Z-44)
 * aus `docs/design/textbestand-aufgabenbereich.md`, freigegeben in T-195.
 *
 * Bei `default-tag` ist die Anforderungs-ID „(A-9.3)“ gefallen. Eine Kennung aus
 * `docs/spec.md` ist für den Benutzer Rauschen und verspricht eine
 * Nachschlagemöglichkeit, die es in der Oberfläche nicht gibt (Regel S-19,
 * Geschwister von ST-03 drüben). Die Anforderung selbst steht weiter im
 * Dateikopf von `Chip` — dort gehört sie hin, dort liest sie ein Entwickler.
 *
 * Bei `new-tag` ist der **Zustand** gefallen („Dieses Tag gibt es in Takt noch
 * nicht.“). Den trägt der Chip sichtbar: die Wortmarke „neu“ und die eigene
 * Gestalt `chip--new`. Stehen bleibt die **Folge**. Sie steht danach nur noch an
 * einer zweiten Stelle — `TagPicker.tsx`, „… — entsteht beim Anlegen des
 * Todos“, gesperrt als **SP-A-12** (T-061). **Fällt SP-A-12, ist diese Kürzung
 * zurückgenommen**; das ist Auflage 1 aus Z-44 und kein Nebensatz.
 *
 * Was diese Kürzung **nicht** heilt: Der Träger ist und bleibt ein `title` auf
 * einem `<span class="chip__note">` — nicht fokussierbar, auf
 * Berührungsgeräten unsichtbar, nicht abweisbar (Regel S-16). Die sichtbaren
 * Wortmarken „Standard“ und „neu“ tragen die Aussage; der `title` ergänzt sie
 * nur. Drüben hat ST-09 dieselbe Bauart an `Tag.tsx` aufgelöst und dafür einen
 * `visually-hidden`-Text behalten — hier gibt es keinen. Wer beide Häuser
 * angleicht, setzt ihn zuerst und nimmt dann den `title` weg, nicht umgekehrt.
 * Das ist ein eigener Eintrag und nicht Gegenstand dieser Kürzung (Z-42).
 */
const CHIP_NOTE: Readonly<Record<'default-tag' | 'new-tag', { label: string; title: string }>> =
  Object.freeze({
    'default-tag': {
      label: 'Standard',
      title: 'Standard-Tag aus den Einstellungen',
    },
    'new-tag': {
      label: 'neu',
      title: 'Entsteht zusammen mit dem Todo.',
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
  /**
   * Die Zeile unter der Überschrift — **oder keine** (T-182).
   *
   * `string | undefined` und nicht `string?`: Unter
   * `exactOptionalPropertyTypes` ist „die Eigenschaft fehlt" etwas anderes
   * als „sie ist `undefined`", und eine Aufrufstelle, die je nach Zustand
   * eine Zeile hat oder nicht, kann nur das Zweite ausdrücken. Dieselbe
   * Schreibweise und derselbe Grund wie bei `error` in {@link FieldProps}.
   */
  readonly description?: string | undefined;
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
