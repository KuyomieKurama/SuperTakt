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
import { SubmitAttemptContext, useSubmitAttempt } from "../lib/submitAttempt";
import { touchedOnBlur } from "../lib/touched";
import { DialogSurface } from "./DialogSurface";
import { Icon } from "./Icon";
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
 *
 * ## Der gesperrte Absendeknopf ist weich gesperrt (E-093, T-220)
 *
 * `submitDisabled` sperrte den Absendeknopf bis T-220 **hart**, mit dem
 * `disabled`-Attribut. Das nahm ihm dreierlei auf einmal: den Platz im
 * Tabulatorlauf, den Klick — und, weil er zugleich der einzige `type="submit"`
 * und damit der **Standardknopf** dieses Formulars ist, die stillschweigende
 * Absendung über die Eingabetaste.
 *
 * Der letzte Punkt ist der schwerste, und er ist gemessen: In Chromium, gegen
 * die laufende Anwendung, war Enter im frisch geöffneten Dialog ein **stummer
 * Leerlauf** — kein Netzaufruf, kein Text in einer Meldefläche, keine
 * Änderung am Bild (visual-qa, T-217). Die Gegenprobe mit gefülltem Feld löste
 * sofort aus; die Sperre war die alleinige Ursache.
 *
 * Seit T-220 gilt hier dieselbe Bauart wie im {@link ConfirmDialog} seit T-186:
 * `aria-disabled` statt `disabled`. Der Knopf sieht unverändert gesperrt aus
 * (`components.css` fasst beide Sperren in **einem** Selektor), ist aber
 * erreichbar, fokussierbar und anklickbar. Abgefangen wird die **Handlung**,
 * nicht das Ereignis — zentral in {@link submit}, einmal für alle neun
 * Aufrufstellen mit `submitDisabled`.
 *
 * **`busy` bleibt hart gesperrt.** Da gibt es nichts zu erklären, und ein
 * zweiter Klick wäre ein zweiter Auftrag an den Dienst.
 *
 * ## Zwei Antworten auf einen abgewiesenen Versuch, und sie sind nicht dieselbe
 *
 * Wer den weich gesperrten Knopf drückt, bekommt eine von zwei Antworten, und
 * welche, hängt daran, **ob an einem Feld etwas nicht stimmt**:
 *
 *  1. **Ein Feld ist ungültig** — dann führt {@link revealFirstInvalidWithin}
 *     dorthin, und der Satz steht in dessen Meldefläche. Das ist der Weg für
 *     „Name fehlt." und seinesgleichen.
 *  2. **Kein Feld ist ungültig, und die Handlung hat trotzdem nichts zu tun** —
 *     etwa ein Umbenennen auf denselben Namen. Dafür ist {@link submitRefusal}
 *     da, und sie geht **nicht** durch den Fehlerkanal: `TextField.error` setzt
 *     `aria-invalid="true"`, die Fehlerfarbe am Rand und einen Fehlertext, und
 *     erklärte damit einen **gültigen, gespeicherten** Wert für ungültig — eine
 *     Aussage, die einer Vorlesehilfe etwas Falsches sagt (E-093 Punkt 5,
 *     T-221 Z-73).
 *
 * Die Absage der zweiten Art liegt deshalb in einer Statusfläche, gebaut nach
 * dem Vorbild, das die Entscheidung benennt: `ConfirmDialog#refusal` —
 * `role="status"`, `.dialog__consequence`, **kein** `aria-invalid`.
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
  /**
   * Die Antwort auf einen abgewiesenen Absendeversuch, den **kein Feld**
   * beantwortet (E-093 Punkt 5).
   *
   * Zu setzen dort, wo `submitDisabled` an einem Zustand hängt, der kein Feld
   * ungültig macht — der Musterfall ist ein Umbenennen auf denselben Namen:
   * Der Wert ist da, er ist gültig, er ist der gespeicherte; die Handlung hat
   * nur nichts zu tun.
   *
   * Der Satz erscheint **erst nach dem ersten Versuch** und verschwindet,
   * sobald die Sperre fällt. Er ist damit die Antwort auf einen Druck und kein
   * dauerhafter Hinweis — den führt die Aufrufstelle weiterhin selbst, von der
   * ersten Sekunde an (Regel P-9, zweite Hälfte).
   */
  readonly submitRefusal?: string;
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
  submitRefusal,
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

  /**
   * Der zweite Durchlauf der Rückführung — trägt die Nummer seines Versuchs.
   *
   * Warum es ihn braucht, steht am Weg zur Absage weiter unten. Der Wert ist die
   * Versuchsnummer und kein Schalter, damit ein **zweiter** Versuch ohne
   * Änderung dazwischen wieder einen zweiten Durchlauf bekommt.
   */
  const [revealPass, setRevealPass] = useState(0);

  /* Ein geschlossener Dialog hat keinen Versuch hinter sich. */
  useEffect(() => {
    if (open) return;
    setSubmitAttempt(0);
    setRevealPass(0);
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

  /**
   * Der eine Riegel für alle neun Dialoge mit `submitDisabled` (E-093, T-220).
   *
   * **Die Reihenfolge ist die Zusicherung dieser Funktion.** Sie hat seit T-220
   * drei Stufen, und jede beantwortet eine eigene Frage:
   *
   *  1. **`busy` — hart, und ohne jede Buchführung.** Während der Dialog
   *     speichert, ist der Knopf `disabled`; hier steht der Riegel ein zweites
   *     Mal, für den Fall, dass ein anderer Weg (Eingabetaste an einem Feld,
   *     ein Fremdbaustein) doch ein `submit` erzeugt. Ein zweiter Auftrag an
   *     den Dienst ist kein Fortschritt, und es gibt dabei auch nichts zu
   *     erklären: Der Ladeanzeiger sagt es bereits.
   *  2. **Zählen und stillstellen — für **jeden** Versuch, auch den
   *     abgewiesenen.** Der Zähler treibt zweierlei: die Rückführung zum ersten
   *     ungültigen Feld (der Weg zur Absage, unten) und, über
   *     {@link SubmitAttemptContext}, die Berührung der Felder darin (Regel
   *     P-8: „Ein Absendeversuch setzt `touched` weiterhin immer"). Genau das
   *     war vor T-220 unerreichbar — der gesperrte Knopf ließ das Ereignis nie
   *     entstehen, und der Versuch blieb ohne jede Rückmeldung.
   *  3. **`submitDisabled` — weich: der Versuch ist gezählt, die Handlung läuft
   *     nicht.** `onSubmit` bleibt aus, und zwar bevor irgendetwas den Dienst
   *     erreicht. Der Knopf ist ein sichtbar gesperrter Knopf und kein
   *     halboffener (dieselbe Formulierung wie `ConfirmDialog#confirmOrExplain`,
   *     dieselbe Sache).
   *
   * Beide Zustandsänderungen und die des Formulars fallen in denselben
   * Durchlauf: Wenn die Meldung erscheint, trägt die Meldefläche bereits
   * `aria-live="off"`, und der Satz kommt vom Fokuswechsel.
   */
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy) return;
      setSubmitAttempt((count) => count + 1);
      setQuiet(true);
      if (submitDisabled) return;
      onSubmit();
    },
    [busy, submitDisabled, onSubmit],
  );

  /**
   * Der Weg zur Absage (T-198, Befund O-FR 4.3) — in **zwei** Durchläufen.
   *
   * Läuft nach dem Zeichnen und vor dem Bild, damit kein Sprung sichtbar wird.
   * Findet sich kein ungültiges Feld, ist der Versuch durchgegangen oder die
   * Absage kam vom Dienst — dann greift der Ruf weiter oben, der die Meldung
   * des Dienstes ins Bild holt.
   *
   * **Warum ein Durchlauf seit T-220 nicht mehr genügt.** Bei einem
   * abgewiesenen Versuch ist das Pflichtfeld im Augenblick des Klicks noch
   * gar nicht ungültig: Es wird es erst dadurch, dass es seine Berührung
   * meldet — `TextField` liest den Zähler, ruft `onTouched`, und der Zustand
   * dahinter liegt in der **aufrufenden Ansicht**. Deren Neuzeichnung landet
   * einen Durchlauf später. Wer nur einmal sucht, sucht zu früh und findet
   * nichts.
   *
   * Deshalb: erster Durchlauf sofort; findet er nichts, vermerkt er die Nummer
   * seines Versuchs, und der zweite sieht denselben Rumpf noch einmal — dann
   * mit den Feldern, die sich inzwischen für ungültig erklärt haben. Zwei
   * Durchläufe und nicht mehr: Was auch beim zweiten Mal nichts findet, hat
   * nichts zu finden.
   */
  useLayoutEffect(() => {
    if (submitAttempt === 0) return;
    if (revealFirstInvalidWithin(bodyRef.current) !== null) return;
    setRevealPass(submitAttempt);
  }, [submitAttempt]);

  /**
   * Der Satz für den Versuch, den kein Feld beantwortet — sichtbar erst nach
   * dem ersten Versuch, und nur solange die Sperre steht.
   */
  const refusalShown = submitRefusal !== undefined && submitDisabled && submitAttempt > 0;

  useLayoutEffect(() => {
    if (revealPass === 0) return;
    /*
      Findet auch der zweite Durchlauf kein ungültiges Feld, gibt es nichts, in
      das der Fokus geführt werden könnte. Dann trägt die Absagefläche unter dem
      Rumpf — und die braucht weder Fokus noch Bildlauf: Sie steht ausserhalb
      des scrollenden Ausschnitts, unmittelbar über dem Knopf, der eben gedrückt
      wurde, und ein `role="status"` sagt sich selbst an. Ihm den Fokus
      hinterherzuschicken nähme dem Benutzer die Stelle, an der er gerade steht,
      ohne ihm eine bessere zu geben.
    */
    revealFirstInvalidWithin(bodyRef.current);
  }, [revealPass]);

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
            Zwei Zusagen an die Felder darin, und beide sind Zusammenhang und
            keine Eigenschaft je Dialog:

              * **Stillstellen** — während eines Absendeversuchs schweigen die
                Meldeflächen; den Satz trägt dann der Fokuswechsel. Begründung
                und Grenze der Aussage stehen an {@link FieldMessageQuietContext}.
              * **Zählen** — jedes Feld erfährt, dass abgesendet wurde, und gilt
                damit als berührt (Regel P-8). Begründung an
                {@link SubmitAttemptContext}. Das kostet an den neun
                Aufrufstellen **null** Zeilen; ein Rückruf je Dialog hätte neun
                Gelegenheiten geschaffen, die zehnte anders zu schreiben.
          */}
          <FieldMessageQuietContext.Provider value={quiet}>
            <SubmitAttemptContext.Provider value={submitAttempt}>{children}</SubmitAttemptContext.Provider>
          </FieldMessageQuietContext.Provider>
          {error === null ? null : (
            <div ref={errorRef}>
              <InlineMessage tone="danger" title="Das hat nicht geklappt">
                {error}
              </InlineMessage>
            </div>
          )}

        </div>

        {/*
          Die Absage an einen Versuch, den kein Feld beantwortet — Bauart
          zeichengleich zu `ConfirmDialog#refusal` und `UpdateDialog` (E-093
          Punkt 5, T-221 Z-73).

          **Sie steht ausserhalb des scrollenden Rumpfes**, und zwar aus zwei
          Gruenden. Der eine ist die Sache: Sie ist die Antwort auf einen Druck
          auf den Absendeknopf, und sie gehoert neben diesen Knopf, nicht an das
          Ende eines Ausschnitts, den der Benutzer erst zurueckscrollen muesste
          (im Pool-Dialog gemessen: 1599 px Inhalt gegen 492 px Ausschnitt).
          Der andere ist gemessen und waere sonst ein stiller Schaden: Der Rumpf
          ist ein `flex`-Behaelter mit `gap`, und ein leerer Behaelter darin ist
          trotzdem ein Element — er kostete an **jedem** der sechzehn
          Formulardialoge einen Abstand von 16 px, auch wenn nie eine Absage
          erscheint (1599 → 1615 px, gemessen vor der Verschiebung).

          **Die Flaeche steht immer da, auch leer.** Ein `role="status"`, das
          erst zusammen mit seinem Inhalt in den Baum kommt, wird von vielen
          Vorlesehilfen uebergangen: Sie melden Aenderungen an einer Region, die
          sie kennen, und diese kennen sie in dem Augenblick noch nicht.
          Dieselbe Regel und derselbe Grund wie an jeder anderen Meldeflaeche
          seit T-162 (O-GQ/O-FX).

          **`status` und nicht `alert`:** Hier ist nichts falsch. Der Wert ist
          gueltig, die Handlung hat nur nichts zu tun. Ein `alert` waere die
          Ansage einer Absage an eine Eingabe — und genau diese Behauptung soll
          hier nicht fallen.
        */}
        <div className={cx("dialog__refusal", refusalShown && "dialog__refusal--shown")} role="status">
          {refusalShown ? (
            <p className="dialog__consequence">
              <Icon name="alert-triangle" size={14} />
              <span>{submitRefusal}</span>
            </p>
          ) : null}
        </div>

        <div className="dialog__footer">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          {/*
            **Gesperrt, aber erreichbar** (E-093, T-220). `aria-disabled` statt
            `disabled`: Der Knopf bleibt im Tabulatorlauf, nimmt den Klick
            entgegen — und bleibt vor allem der **Standardknopf** dieses
            Formulars, so dass die Eingabetaste weiter durchkommt. Abgefangen
            wird die Handlung, nicht das Ereignis; der Riegel steht zentral in
            `submit` darüber.

            `busy` bleibt bei `loading` und damit bei der **harten** Sperre: Da
            gibt es nichts zu erklären, und ein zweiter Klick wäre ein zweiter
            Auftrag an den Dienst. Dieselbe Aufteilung wie am
            Bestätigungsknopf des {@link ConfirmDialog} seit T-186.
          */}
          <Button
            type="submit"
            variant={tone === "danger" ? "danger" : "primary"}
            loading={busy}
            ariaDisabled={submitDisabled}
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

  /**
   * Der zweite Auslöser für „berührt": der Absendeversuch (P-8, E-093, T-220).
   *
   * Regel P-8 hat zwei Sätze, und bis T-220 war nur der erste gebaut. Der
   * zweite lautet wörtlich: *„Ein Absendeversuch setzt `touched` weiterhin
   * **immer**."* Er war unerreichbar, solange ein leeres Pflichtfeld den
   * Absendeknopf hart sperrte — dann entstand gar kein Versuch (gemessen in
   * T-217: Enter im frisch geöffneten Dialog tat nichts und sagte nichts).
   *
   * Der Zählerstand kommt aus dem Zusammenhang und nicht aus einer Eigenschaft:
   * {@link SubmitAttemptContext}, gesetzt von {@link FormDialog}. Damit kostet
   * dieser Auslöser an den neun Aufrufstellen keine Zeile — und es gibt keine
   * neunte Abschrift derselben Bedingung, die still anders sein könnte.
   *
   * **Der Rückruf steht in einer Referenz und nicht in der Abhängigkeitsliste.**
   * `onTouched` ist an jeder Aufrufstelle eine an Ort und Stelle geschriebene
   * Pfeilfunktion; sie wechselt bei jedem Zeichnen ihre Kennung. Stünde sie in
   * der Liste, liefe der Effekt bei jedem Zeichnen und meldete eine Berührung,
   * die niemand ausgelöst hat. Der Abgleich läuft **vor** dem Effekt darunter,
   * weil Effekte in der Reihenfolge ihrer Notierung laufen.
   *
   * `useLayoutEffect` und nicht `useEffect`: Die Rückführung zum ersten
   * ungültigen Feld läuft im Elternteil ebenfalls in dieser Phase. So fällt die
   * Meldung der Berührung in denselben Durchlauf, und der zweite Durchlauf der
   * Rückführung findet das Feld verlässlich (Begründung dort).
   */
  const onTouchedRef = useRef(onTouched);
  useLayoutEffect(() => {
    onTouchedRef.current = onTouched;
  });

  const submitAttempt = useSubmitAttempt();
  useLayoutEffect(() => {
    if (submitAttempt === 0) return;
    onTouchedRef.current?.();
  }, [submitAttempt]);

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
