import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { cx } from "../lib/cx";
import { FieldMessageQuietContext, useFieldMessageLive } from "../lib/fieldMessages";
import { revealFirstInvalidWithin } from "../lib/focus";
import { touchedOnBlur } from "../lib/touched";
import { DialogSurface } from "./DialogSurface";
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
 * (SC 2.4.3), Escape schließt, Absenden über die Eingabetaste. Seit T-152
 * kommt all das aus der Zustandsmaschine unter {@link DialogSurface} und nicht
 * mehr aus vier Handgriffen je Dialog (E-076 Stufe 1).
 *
 * ## Zwei Notbehelfe von damals — einer entfallen, einer umgezogen
 *
 * 1. **Die Abfrage auf `event.defaultPrevented`** stand hier, weil eine
 *    aufgeklappte Liste im Portal ihr Escape sonst zweimal wirken ließ: einmal
 *    für die Liste, einmal für den Dialog dahinter. Die Ebenenverwaltung von
 *    Ark UI beantwortet dieselbe Frage von vorn — ein Escape geht an die
 *    **oberste** Ebene und an keine darunter.
 * 2. **`recoverFocus`** ist **nicht** entfallen — er ist nur umgezogen. T-152
 *    hat ihn hier gestrichen, weil die Fokusfalle von Ark UI denselben Fall
 *    zu kennen schien; T-155 und T-153 haben gemessen, dass sie ihn nicht
 *    trägt (sie vergleicht entfernte Knoten per Identität und sieht den
 *    Nachfahren nicht). Seit T-157 steht die Rückholung in
 *    {@link DialogSurface} und gilt damit für jeden Dialog. Die Begründung
 *    samt beider gemessener Anlaßfälle steht im Kopf jener Datei.
 *
 * Geblieben ist, was kein Fremdbaustein wissen kann: dass der Fokus beim
 * Öffnen **auf das erste Formularfeld** gehört und nicht auf das Schließkreuz,
 * und dass eine Fehlermeldung sich selbst ins Sichtfeld holt.
 *
 * ## `noValidate` — die eigene Prüfung steht vor der des Browsers (E-084)
 *
 * Dies ist das **einzige** `<form>` in `apps/web`. Bis T-175 trug es kein
 * `noValidate`, und damit fing Chromium jeden Absendeversuch an einem leeren
 * Pflichtfeld selbst ab: eigene Sprechblase, englischer Wortlaut, eine Gestalt,
 * die Takt nicht kennt — und vor allem **ohne** die Live-Region, die T-118 und
 * T-162 für genau diesen Fall gebaut haben. Das `submit`-Ereignis erreichte
 * React in diesem Fall gar nicht; die deutsche Meldung des Formulars blieb
 * unerreichbar (gemessen in T-170, entschieden in E-084).
 *
 * Die Bedingung aus E-084 Punkt 2 — jedes `required`-Feld braucht seine eigene
 * Prüfung, bevor ihm die des Browsers genommen wird — ist in T-175 gezählt und
 * geschlossen worden. Zwei Verluste waren dabei zu ersetzen, nicht einer:
 * `required` (steht jetzt an jedem Feld als eigene Regel) und **`badInput`**
 * (steht jetzt in {@link TextField}, siehe dort).
 *
 * **Der dritte Verlust, gemessen erst in T-198: der Weg zur Absage.** Chromiums
 * Sprechblase hat nebenbei zum beanstandeten Feld gescrollt. Ohne sie blieb bei
 * einem gescrollten Dialog die Meldung ausserhalb des Bildes stehen, und für
 * einen sehenden Benutzer an der Tastatur geschah beim Absenden sichtbar
 * nichts. Seit T-202 holt {@link revealFirstInvalidWithin} das erste ungültige
 * Feld in den Fokus und seinen Block ins Bild — die Begründung und die Meßwerte
 * stehen an jener Funktion.
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

/**
 * Erst das Formular, dann der Rest.
 *
 * Wer einen Dialog mit Feldern öffnet, will tippen — nicht auf dem
 * Schliesskreuz stehen. Die Auswahl ist wörtlich die aus der Fassung vor
 * T-152; findet sie nichts, faellt die Zustandsmaschine auf das erste
 * tabulierbare Element zurueck, und das ist dieselbe Wahl wie vorher.
 */
const FIRST_FIELD_SELECTOR =
  "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])";

function firstFieldWithin(content: HTMLElement): HTMLElement | null {
  return content.querySelector<HTMLElement>(FIRST_FIELD_SELECTOR);
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
  const errorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  /**
   * Der wievielte Absendeversuch — und ob die Meldeflächen gerade schweigen.
   *
   * Zwei Zustände und nicht einer, weil sie zwei verschiedene Fragen
   * beantworten. Der **Zähler** löst die Rückführung aus: Ein zweiter Versuch
   * ohne jede Änderung dazwischen soll den Fokus erneut setzen, und dafür muss
   * sich der Wert ändern. Der **Schalter** hält die Meldeflächen still, solange
   * der Fokuswechsel den Satz trägt (siehe {@link FieldMessageQuietContext}) —
   * er fällt zurück, sobald der Benutzer wieder tippt, und nicht schon im
   * nächsten Bilddurchlauf: Eine Vorlesehilfe verarbeitet die Änderung an einer
   * Region nicht zwingend im selben Augenblick, in dem sie geschieht.
   */
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [quiet, setQuiet] = useState(false);

  /* Ein geschlossener Dialog hat keinen Versuch hinter sich. */
  useEffect(() => {
    if (open) return;
    setSubmitAttempt(0);
    setQuiet(false);
  }, [open]);

  /**
   * Eine Fehlermeldung, die man erst suchen muss, ist keine (Abschnitt 15).
   *
   * Der Rumpf eines Formulardialogs scrollt. Die Meldung steht unter den
   * Feldern — bei einem langen Formular also unterhalb des Sichtfelds, waehrend
   * der Blick beim Absendeknopf steht und dort nichts geschieht. Gemessen im
   * Dialog „Neue Board-Spalte anlegen" (T-072): Der Dienst wies einen doppelten
   * Namen ab, und der Text lag zwei Bildschirmhoehen tiefer.
   */
  useEffect(() => {
    if (error === null) return;
    errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [error]);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy || submitDisabled) return;
      /*
        Erst zählen und stillstellen, dann absenden. Beide Zustandsänderungen
        und die des Formulars fallen in denselben Durchlauf: Wenn die Meldung
        erscheint, trägt die Meldefläche bereits `aria-live="off"`, und die
        Rückführung darunter findet ein Feld, das sich schon für ungültig
        erklärt hat.
      */
      setSubmitAttempt((count) => count + 1);
      setQuiet(true);
      onSubmit();
    },
    [busy, submitDisabled, onSubmit],
  );

  /**
   * Der Weg zur Absage (T-198, Befund O-FR 4.3).
   *
   * Läuft nach dem Zeichnen und vor dem Bild, damit kein Sprung sichtbar wird.
   * Findet sich kein ungültiges Feld, ist der Versuch durchgegangen oder die
   * Absage kam vom Dienst — dann greift der Ruf darüber, der die Meldung des
   * Dienstes ins Bild holt.
   */
  useLayoutEffect(() => {
    if (submitAttempt === 0) return;
    revealFirstInvalidWithin(bodyRef.current);
  }, [submitAttempt]);

  /*
    Sobald der Benutzer wieder tippt, sagen die Meldeflächen wieder selbst an:
    Der Fokus steht dann bei ihm und nicht mehr am Feld der letzten Absage.
    `input` steigt auf, ein Ruf am Formular genügt für alle Felder darin.
  */
  const relax = useCallback(() => {
    setQuiet((still) => (still ? false : still));
  }, []);

  return (
    <DialogSurface
      open={open}
      onDismiss={onCancel}
      /* Waehrend der Dialog arbeitet, bricht Escape nichts ab — wie vorher. */
      closeOnEscape={!busy}
      initialFocus={firstFieldWithin}
      className={cx(
        "dialog",
        "dialog--form",
        wide && "dialog--wide",
        tone === "danger" && "dialog--danger",
      )}
    >
      {/*
        `noValidate`: Die Prüfung der Anwendung ist die maßgebliche (E-084
        Punkt 1). Begründung im Kopf dieser Datei.
      */}
      <form onSubmit={submit} onInput={relax} noValidate>
        <div className="dialog__head dialog__head--form">
          <div className="grow">
            <Dialog.Title className="dialog__title">{title}</Dialog.Title>
            {description === undefined ? null : (
              <Dialog.Description asChild>
                <p className="dialog__lead">{description}</p>
              </Dialog.Description>
            )}
          </div>
          {/*
            `disabled={busy}` gehört hierher wie an den Abbrechen-Knopf
            (T-153, Befund O-CZ). Während der Dialog speichert, sperren Escape
            (`closeOnEscape={!busy}`) und „Abbrechen" bewusst — das Kreuz tat
            es nicht und schloss den Dialog mitten im Speichern, mit der Maus
            wie mit der Tastatur. Ein Weg hinaus, den die beiden anderen
            versperren, ist kein Weg, sondern ein Loch.
          */}
          <Dialog.CloseTrigger asChild>
            <IconButton label="Dialog schließen" icon="x" size="sm" disabled={busy} />
          </Dialog.CloseTrigger>
        </div>

        <div className="dialog__body dialog__body--form" ref={bodyRef}>
          {/*
            Während eines Absendeversuchs schweigen die Meldeflächen der Felder
            darin — den Satz trägt dann der Fokuswechsel. Begründung und Grenze
            der Aussage stehen an {@link FieldMessageQuietContext}.
          */}
          <FieldMessageQuietContext.Provider value={quiet}>{children}</FieldMessageQuietContext.Provider>
          {error === null ? null : (
            <div ref={errorRef}>
              <InlineMessage tone="danger" title="Das hat nicht geklappt">
                {error}
              </InlineMessage>
            </div>
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
    </DialogSurface>
  );
}

/* ==================================================================== */
/* Textfeld in einer Zeile                                              */
/* ==================================================================== */

/**
 * Der zweite Verlust durch `noValidate`, und der stillere von beiden.
 *
 * `required` nimmt dem Feld eine Meldung; **`badInput`** nimmt ihm die Wahrheit.
 * Ein `type="date"` oder `type="datetime-local"`, in das jemand „12.“ getippt
 * hat, liefert `value === ""` — denselben Wert wie ein nie berührtes Feld. Bis
 * T-175 hielt Chromiums eigene Prüfung den Absendeversuch an; ohne sie schlösse
 * das Formular aus der leeren Zeichenkette „keine Frist“ und verwürfe
 * stillschweigend, was der Benutzer sichtbar vor sich stehen hat.
 *
 * `validity.badInput` unterscheidet beides, und **nur das Element selbst** kennt
 * es: Über den Wert ist der Fall nicht zu erkennen. Die Meldung entsteht deshalb
 * hier und nicht an der Aufrufstelle — sie hängt an der Art des Feldes, nicht an
 * der Fachregel darüber.
 *
 * Sie hat aus demselben Grund **Vorrang** vor der Meldung von außen: Die
 * Fachregel sieht eine leere Zeichenkette und sagt „fehlt“; das Feld weiß, dass
 * etwas dasteht und nur unvollständig ist. Von zwei Meldungen ist die genauere
 * die richtige.
 *
 * Die Form ist P-5 aus T-177 — ein Wert, der da ist, aber nicht stimmt, nennt
 * die **eine** verletzte Regel hinter der Feldbeschriftung: `„<Feld>: <Regel>."`
 */
const INCOMPLETE_INPUT_RULE: Record<TextFieldType, string | undefined> = {
  text: undefined,
  date: "Tag, Monat und Jahr gehören dazu.",
  "datetime-local": "Datum und Uhrzeit gehören dazu.",
};

export type TextFieldType = "text" | "datetime-local" | "date";

export interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  /**
   * Das Feld wurde verlassen. Die Stelle, an der ein Formular „berührt" merken
   * darf, ohne beim ersten Zeichen zu tadeln (SC 3.3.1) — und die einzige, die
   * ein Pflichtfeld **ohne** Wähler überhaupt hat (Befund O-DZ).
   */
  /**
   * Das Feld gilt nach Regel P-8 als **berührt** (T-186, {@link touchedOnBlur}).
   *
   * Nicht `onBlur`, und der Unterschied ist der ganze Punkt: `onBlur` feuert
   * bei jedem Verlassen, auch beim blossen Durchtabben eines Feldes, das
   * niemand angefasst hat. Genau das erzeugte im frisch geöffneten Dialog einen
   * Tadel vor dem ersten Zeichen (Befund O-FY) — der Fokus liegt beim Öffnen im
   * ersten Feld, und ein Tabulator genügte.
   *
   * Die Bedingung steht **hier** und nicht an den acht Aufrufstellen. Acht
   * Abschriften wären acht Gelegenheiten, die neunte anders zu schreiben, und
   * die Abweichung wäre still: Beide Fassungen verhalten sich gleich, solange
   * jemand tippt. Sie fällt erst dem auf, der nur durchtabbt.
   */
  readonly onTouched?: () => void;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly maxLength?: number;
  readonly type?: TextFieldType;
  readonly className?: string;
}

/**
 * Einzeiliges Eingabefeld mit Beschriftung, Hilfetext und Fehlertext.
 *
 * Beschriftung immer sichtbar, nie nur als Platzhalter: Ein Platzhalter
 * verschwindet beim Tippen, und dann steht niemand mehr da, der sagt, was in
 * das Feld gehört (SC 3.3.2).
 *
 * **Die Meldefläche steht immer da, auch leer** (T-162, Befund O-DA). Das Feld
 * verwies schon vorher über `aria-describedby` auf seine Meldung und trug
 * `aria-invalid` — beschrieben war sie damit, **angesagt** nicht: Ein
 * `role="alert"`, das erst zusammen mit seinem Inhalt in den Baum kommt, wird
 * von vielen Vorlesehilfen übergangen, weil sie Änderungen an einer Region
 * melden, die sie in diesem Augenblick noch nicht kennen. Eine Meldung, die
 * **während** des stehenden Dialogs entsteht, blieb deshalb stumm.
 *
 * Dieselbe Bauart und derselbe Grund wie im Bestätigungsdialog (B-5 aus T-116,
 * gebaut in T-118) und im Aufgabenbereich des Add-ins
 * (`outlook-addin/src/ui/Primitives.tsx`, T-158). `alert` und nicht `status`:
 * Eine Feldmeldung ist die Absage an eine gerade getätigte Eingabe.
 *
 * Was die Fläche **nicht** enthält: den Hilfetext. Er steht bereits in
 * `aria-describedby` und käme sonst beim Öffnen zweimal.
 */
export function TextField({
  label,
  value,
  onChange,
  onTouched,
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
  const quietLive = useFieldMessageLive();

  /*
    Unvollständige Eingabe in einem Datumsfeld — der zweite Verlust durch
    `noValidate`, Begründung an {@link INCOMPLETE_INPUT_RULE}. Der Zustand
    wird beim Tippen **und** beim Verlassen nachgeführt, weil beides ihn ändern
    kann: Wer „12.“ ergänzt, macht ihn wahr; wer das Feld leert, wieder falsch.
  */
  const [incomplete, setIncomplete] = useState(false);

  /*
    Hat der Benutzer in dieses Feld getippt? — die eine Hälfte von P-8, die kein
    Wertvergleich beantwortet (Nachtrag T-186). Wer „a" tippt und wieder löscht,
    steht wieder auf dem Anfangswert und hat das Feld trotzdem angefasst.

    Der Zustand steht hier und nicht an der Aufrufstelle, weil hier das
    `onChange` entsteht. Er wird beim Tippen gesetzt und beim Verlassen
    **gelesen** — nie beim Tippen gelesen: Eine Meldung, die beim ersten Zeichen
    erschiene, tadelte eine Eingabe, die noch niemand beendet hat (P-6,
    SC 3.3.1).
  */
  const [edited, setEdited] = useState(false);
  const incompleteRule = incomplete ? INCOMPLETE_INPUT_RULE[type] : undefined;
  const shownError = (incompleteRule === undefined ? undefined : `${label}: ${incompleteRule}`) ?? error;

  const describedBy = [
    hint === undefined ? null : hintId,
    shownError === undefined ? null : errorId,
  ]
    .filter((part): part is string => part !== null)
    .join(" ");

  const handleBlur = (event: FocusEvent<HTMLInputElement>): void => {
    setIncomplete(event.currentTarget.validity.badInput);
    if (touchedOnBlur(value, edited)) onTouched?.();
  };

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
        className={cx("field__input", shownError !== undefined && "field__input--invalid")}
        value={value}
        onChange={(event) => {
          setEdited(true);
          setIncomplete(event.currentTarget.validity.badInput);
          onChange(event.target.value);
        }}
        onBlur={handleBlur}
        disabled={disabled}
        /*
          `required` bleibt am Element stehen, obwohl `noValidate` es der
          Formularprüfung entzieht: Es ist zugleich die Zusage an die
          Vorlesehilfe (dieselbe wie `aria-required`) und muss zum sichtbaren
          Stern an der Beschriftung passen. Genommen wird ihm die Sprechblase,
          nicht die Bedeutung.
        */
        required={required}
        aria-invalid={shownError === undefined ? undefined : true}
        {...(describedBy.length === 0 ? {} : { "aria-describedby": describedBy })}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(maxLength === undefined ? {} : { maxLength })}
      />
      {hint === undefined ? null : (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {/*
        `aria-live` steht hier und die Rolle bleibt, wo sie ist: Eine Rolle, die
        kommt und geht, wäre genau der Fehler, den T-162 behoben hat. Der Wert
        ist während eines Absendeversuchs `"off"` — dann liest die Vorlesehilfe
        denselben Satz bereits als Beschreibung des Feldes vor, das gerade den
        Fokus bekommen hat, und ein zweites Mal ist keine Hilfe.
      */}
      <div className="field__live" role="alert" aria-live={quietLive}>
        {shownError === undefined ? null : (
          <p className="field__error" id={errorId}>
            {shownError}
          </p>
        )}
      </div>
    </div>
  );
}
