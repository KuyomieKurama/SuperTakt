import type { DirectoryReport, ServiceExit, ShellState } from "@takt/desktop/shell";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../lib/cx";
import { focusFirstWithin, keepTabInside } from "../lib/focus";
import { Icon } from "./Icon";
import { Button } from "./Primitives";

/**
 * Takt — die drei Zustaende, die die Huelle beim Start meldet (Abschnitt 15).
 *
 * `apps/desktop/src/shell.ts` liefert sie ueber `shellState()` fertig aus:
 *
 *   problems             Takt ist nicht vollstaendig gestartet. Fertige
 *                        deutsche Saetze aus der Huelle — Rechte nicht
 *                        gesetzt, Datenverzeichnis nicht anlegbar, Dienst
 *                        nicht gestartet.
 *   serviceExit          Der lokale Dienst ist weg. Ohne ihn schreibt Takt
 *                        nichts mehr auf die Platte.
 *   directory.syncWarning Der Datenordner liegt auf einer Netzfreigabe oder in
 *                        einem Synchronisierungsordner (R-13, B-7.1).
 *
 * Bis T-020 hat sie niemand angezeigt. Seit dem Nachtrag zu T-008b ist das
 * folgenreich: Liefert `GetUserNameW` unter Windows keinen Namen, startet Takt
 * **ohne** lokalen Dienst. Der erklaerende Satz dazu liegt in `problems` — ohne
 * diese Bausteine saehe der Benutzer eine Anwendung, die nichts tut, und
 * erfuehre den Grund nicht.
 *
 * ## Zwei Regeln, die hier nicht verhandelbar sind
 *
 * 1. **Kein Wert aus `osUser()` gehoert in eine dieser Meldungen.** Die Huelle
 *    prueft ausdruecklich, dass ihre Saetze den Benutzernamen nicht
 *    wiedergeben (`steuerzeichen_im_namen_werden_abgewiesen`); eine Oberflaeche,
 *    die ihn danebenschreibt, hebt das auf. Diese Datei ruft `osUser()` nicht
 *    auf und nimmt keinen Namen entgegen — seit T-124 nimmt sie einen
 *    **Befund** entgegen ({@link ShellStatusProps.userName}): die Antwort auf
 *    eine Ja-Nein-Frage, nicht den Wert, ueber den sie gestellt wurde. Genau
 *    die Zeichen, um die es dabei geht, wuerden die Meldung umdrehen, die von
 *    ihnen berichtet (B-4.3 Punkt 5).
 * 2. **Die Sperrmeldung ist nicht wegklickbar.** Kein Schliesskreuz, kein
 *    Abbrechen, kein Escape. Sie gilt, bis Takt beendet ist — und genau das
 *    bietet sie an.
 *
 * ## Woher die Zustandsform kommt
 *
 * Aus `@takt/desktop/shell`, als reiner Typimport (T-020b). Bis dahin stand
 * hier ein handgeschriebener Ausschnitt derselben Felder. Der hat funktioniert
 * und war trotzdem falsch: Er haette still verfehlt, was die Huelle inzwischen
 * liefert — genau das ist beim Nachziehen der zwei neuen Felder passiert.
 * Jetzt prueft der Uebersetzer die Zuordnung.
 *
 * **Die Musterseite laeuft trotzdem im reinen Browser.**
 * `verbatimModuleSyntax` erzwingt, dass `import type` restlos verschwindet;
 * nichts aus `@tauri-apps/api` landet im Buendel. Wer hier eines Tages
 * `shellState()` aufruft statt nur seinen Typ zu benutzen, aendert das — und
 * muss dann den Fall ohne Huelle abfangen, den `isShellAvailable()` beschreibt.
 */

/* ==================================================================== */
/* Zustandsform — die Typen der Huelle, nicht nachgebaut                */
/* ==================================================================== */

/**
 * Die Namen der Huelle bleiben die Namen der Oberflaeche.
 *
 * Aliase und keine eigenen Schnittstellen: Ein zweiter Name fuer dieselbe
 * Sache laedt dazu ein, ihn irgendwann anders zu fuellen. Wer
 * `ShellStateSnapshot` liest, hat genau das vor sich, was `shellState()`
 * zurueckgibt — nicht etwas, das ihm aehnlich sieht.
 */
export type ShellDirectoryReport = DirectoryReport;
export type ShellServiceExit = ServiceExit;
export type ShellStateSnapshot = ShellState;

/* ==================================================================== */
/* Auswertung                                                           */
/* ==================================================================== */

/**
 * Die Startmeldungen ohne den Synchronisierungshinweis.
 *
 * Die Huelle legt die Warnung aus `directory.syncWarning` **zusaetzlich** in
 * `problems` ab (`lib.rs`, Startschritt 2). Das war richtig, solange sie sonst
 * nirgends erschienen waere. Jetzt hat sie einen eigenen Platz, und unbesehen
 * uebernommen stuende sie zweimal auf dem Bildschirm — einmal davon unter der
 * Ueberschrift „nicht vollstaendig gestartet", die fuer sie zu laut ist: Takt
 * laeuft, der Ordner liegt nur falsch.
 *
 * Verglichen wird auf Gleichheit der ganzen Zeichenkette, weil genau dieselbe
 * Zeichenkette geklont wird. Aus einer fremden Meldung wird hier nichts
 * herausgeschnitten.
 */
export function startupProblems(state: ShellStateSnapshot): readonly string[] {
  const sync = state.directory?.syncWarning ?? null;
  if (sync === null) return state.problems;
  return state.problems.filter((problem) => problem !== sync);
}

/* ==================================================================== */
/* „Takt beenden" — der Knopf, der nichts sagte (O-AF, T-124)           */
/* ==================================================================== */

/**
 * Wie lange „Takt beenden" arbeiten darf, bevor die Oberflaeche sagt, dass es
 * nicht geklappt hat.
 *
 * **Warum es ueberhaupt eine Frist braucht und keinen `catch` allein.** Der
 * Erfolgsfall dieses Knopfes ist der Tod des eigenen Prozesses: `takt_quit`
 * ruft `app.exit(0)`, und die Zusage aus `invoke` kommt danach nie mehr an.
 * Ein Fehlschlag ist damit nicht „die Zusage wird abgewiesen", sondern „es
 * geschieht nichts" — und auf nichts kann man nicht warten. Die Frist macht
 * aus dem Ausbleiben ein Ereignis.
 *
 * Fuenf Sekunden, und der Wert ist eine Abwaegung: `app.exit(0)` braucht
 * Millisekunden. Wer hier zu kurz misst, zeigt einem Benutzer die
 * Notfallanleitung, waehrend sich das Fenster gerade schliesst; wer zu lang
 * misst, laesst ihn vor einem Knopf sitzen, der nichts tut. Fuenf Sekunden
 * sind lang genug fuer einen ausgelasteten Rechner und kurz genug, um nicht
 * fuer Absicht gehalten zu werden.
 */
const QUIT_GRACE_MS = 5_000;

/**
 * Was aus dem Versuch geworden ist, Takt zu beenden.
 *
 * `stuck` traegt den Grund, **falls** es einen gibt: Weist die Huelle den
 * Befehl ab, steht ihr Satz darin; laeuft nur die Frist ab, ist er `null` —
 * dann gibt es keinen Grund, sondern nur eine Beobachtung, und eine erfundene
 * Ursache waere schlechter als keine.
 */
type QuitAttempt =
  | { readonly kind: "idle" }
  | { readonly kind: "running" }
  | { readonly kind: "stuck"; readonly cause: string | null };

/**
 * Der Versuch, Takt zu beenden — mit Frist und mit Auskunft.
 *
 * Bis T-124 stand an beiden Knoepfen `onClick={onQuit}` und in `App.tsx`
 * `() => void quitApplication()`: keine Rueckmeldung, kein `catch`, keine
 * Frist. Das ist dieselbe Klasse wie B-6, und sie wiegt hier schwerer als
 * dort — „Takt beenden" ist nach E-036 der **einzige** Ausgang aus der
 * Sperrmeldung. Ein Ausgang, der stumm nicht funktioniert, ist eine Tuer ohne
 * Klinke.
 *
 * Die Auskunft gehoert ins Feld selbst und nicht in den Meldungsstapel: Der
 * liegt seit T-110 hinter der Abdunklung, wenn ein Dialog steht (T-118, offene
 * Frage 2).
 */
function useQuitAttempt(onQuit: () => void | Promise<void>): {
  readonly attempt: QuitAttempt;
  readonly start: () => void;
} {
  const [attempt, setAttempt] = useState<QuitAttempt>({ kind: "idle" });
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const start = useCallback(() => {
    setAttempt({ kind: "running" });
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setAttempt({ kind: "stuck", cause: null });
    }, QUIT_GRACE_MS);

    // `Promise.resolve().then(onQuit)` und nicht `onQuit()` unmittelbar: Wirft
    // der Aufruf **synchron**, faenge ein `catch` an einer Zusage ihn nicht.
    void Promise.resolve()
      .then(() => onQuit())
      .then(
        () => {
          // Gelungen heisst hier: Der Prozess endet. Kommt die Zusage
          // trotzdem zurueck, ist Takt noch da — dann laeuft die Frist
          // weiter und sagt es gleich. Nichts zu tun ist hier richtig.
        },
        (cause: unknown) => {
          if (timer.current !== null) window.clearTimeout(timer.current);
          timer.current = null;
          setAttempt({
            kind: "stuck",
            cause: cause instanceof Error ? cause.message : null,
          });
        },
      );
  }, [onQuit]);

  return { attempt, start };
}

/**
 * Was zu tun ist, wenn „Takt beenden" nicht wirkt.
 *
 * **Kein Verweis auf die Systembetreuung** (F-15). Wer allein mit Takt
 * arbeitet, hat keine; und ein Fenster zu schliessen ist nichts, wofuer man
 * jemanden anrufen muesste. Beide Wege stehen jedem Benutzer offen und
 * brauchen kein Recht, das er nicht hat.
 *
 * Der letzte Satz ist der wichtigste: Er nimmt die Angst, die den Benutzer
 * sonst vor dem Task-Manager zurueckschrecken laesst. Der lokale Dienst haengt
 * an der `stdin`-Roehre der Huelle und haelt von selbst an, sobald sie
 * reisst — das ist B-1.6 Punkt 3 und kein Zufall.
 */
function QuitFailureNotice({ cause }: { readonly cause: string | null }) {
  return (
    <div className="quitfail">
      <p className="quitfail__title">
        <Icon name="alert-triangle" size={14} />
        <span>Takt ließ sich so nicht beenden</span>
      </p>
      <p className="quitfail__body">
        {cause ?? "Der Beenden-Befehl hat nicht gewirkt: Das Fenster steht noch."}
      </p>
      <ol className="quitfail__steps">
        <li>
          Schließen Sie das Fenster über das Kreuz in der Titelleiste — oder mit
          <span className="mono"> Alt+F4</span>.
        </li>
        <li>
          Hilft das nicht: <span className="mono">Strg+Umschalt+Esc</span> öffnet den
          Task-Manager. Beenden Sie dort den Eintrag „Takt".
        </li>
      </ol>
      <p className="quitfail__foot">
        Beides ist gefahrlos. Was gespeichert ist, bleibt gespeichert, und der lokale
        Dienst hält von selbst an, sobald das Fenster von Takt weg ist.
      </p>
    </div>
  );
}

/**
 * Der Knopf „Takt beenden" samt seiner Auskunft.
 *
 * Ein Baustein und nicht zwei, weil er an drei Stellen steht — Startmeldung,
 * Sperrmeldung und der Meldung zum Benutzernamen — und weil die Auskunft an
 * jeder dieser Stellen dieselbe ist. Drei Abschriften waeren drei
 * Gelegenheiten, die naechste Auflage nur an zweien nachzuziehen (dieselbe
 * Begruendung wie bei `app/undoDone.ts`, T-118).
 *
 * Die Live-Region steht **immer** da, auch leer — dieselbe Regel wie an
 * `refusal` in `ConfirmDialog` (B-5, T-118): Ein `role="status"`, das erst
 * zusammen mit seinem Inhalt in den Baum kommt, wird von vielen Vorlesehilfen
 * nicht angesagt, weil sie die Region in dem Augenblick noch nicht kennen.
 */
function QuitButton({
  onQuit,
  variant,
  size,
}: {
  readonly onQuit: () => void | Promise<void>;
  readonly variant: "secondary" | "danger";
  readonly size?: "sm" | "md";
}) {
  const { attempt, start } = useQuitAttempt(onQuit);

  return (
    <>
      <div role="status" className="quitfail__region">
        {attempt.kind === "stuck" ? <QuitFailureNotice cause={attempt.cause} /> : null}
      </div>
      <Button
        variant={variant}
        size={size ?? "md"}
        iconStart="x"
        loading={attempt.kind === "running"}
        onClick={start}
      >
        {attempt.kind === "running" ? "Takt wird beendet …" : "Takt beenden"}
      </Button>
    </>
  );
}

/* ==================================================================== */
/* Startmeldung — problems                                              */
/* ==================================================================== */

export interface StartupProblemNoticeProps {
  /** Die Saetze der Huelle, unveraendert. Leer heisst: nichts anzeigen. */
  readonly problems: readonly string[];
  /**
   * Beendet Takt ueber die Huelle. Ohne Rueckfrage gibt es keinen Knopf.
   *
   * Darf eine Zusage zurueckgeben: {@link QuitButton} wartet auf sie und sagt
   * es, wenn sie abgewiesen wird (O-AF). Eine Rueckgabe von `void` bleibt
   * gueltig — die Musterseite braucht keine.
   */
  readonly onQuit?: () => void | Promise<void>;
  readonly className?: string;
}

/**
 * Takt ist hochgekommen, aber nicht vollstaendig.
 *
 * Dauerhaft und nicht schliessbar: Der Zustand aendert sich bis zum Neustart
 * nicht, und eine Meldung, die man wegklicken kann, ist genau dann weg, wenn
 * man sie wiederfinden will. Sie steht deshalb nicht im Fluss der Ansicht,
 * sondern ueber allem, was danach kommt.
 *
 * Der Rahmen ist von uns, die Aufzaehlung ist es nicht: Jeder Satz kommt
 * unveraendert aus der Huelle. Eine Oberflaeche, die daraus „Ein Fehler ist
 * aufgetreten (Code 3)" macht, nimmt dem Benutzer die einzige Auskunft, die er
 * weitergeben kann.
 */
export function StartupProblemNotice({
  problems,
  onQuit,
  className,
}: StartupProblemNoticeProps) {
  if (problems.length === 0) return null;

  return (
    <div
      className={cx("shellnote", "shellnote--startup", className)}
      role="alert"
      aria-live="assertive"
    >
      <span className="shellnote__icon" aria-hidden>
        <Icon name="alert-circle" size={18} />
      </span>
      <div className="shellnote__main">
        <p className="shellnote__title">Takt ist nicht vollständig gestartet</p>
        <p className="shellnote__body">
          Ein Teil der Anwendung steht nicht zur Verfügung. Das ist Takt beim Start
          aufgefallen:
        </p>
        <ul className="shellnote__list">
          {/* Der Schluessel ist die Position: Die Liste entsteht einmal beim
              Start, wird nicht sortiert und nicht ergaenzt. */}
          {problems.map((problem, index) => (
            <li className="shellnote__item" key={index}>
              {problem}
            </li>
          ))}
        </ul>
        <div className="shellnote__todo">
          <p className="shellnote__todo-title">Was Sie tun können</p>
          <p className="shellnote__body">
            Beenden Sie Takt und starten Sie es neu. Bleibt die Meldung, geben Sie sie
            unverändert an Ihre Systembetreuung weiter — sie benennt bereits, was fehlt.
          </p>
        </div>
        {onQuit !== undefined ? (
          <div className="shellnote__actions">
            <QuitButton onQuit={onQuit} variant="secondary" size="sm" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Datenordner — directory.syncWarning (R-13, B-7.1)                    */
/* ==================================================================== */

export interface SyncFolderNoticeProps {
  /** Der Befund der Huelle im Klartext. Nennt den Ordner im ersten Satz. */
  readonly warning: string;
  /**
   * Der technische Zusatz zum selben Befund (T-020b). Steht unten, gedaempft
   * und beschriftet — das ist der Satz, den man weitergibt, und nicht der,
   * den man zuerst liest.
   */
  readonly detail: string | null;
  readonly className?: string;
}

/**
 * Der Datenordner liegt dort, wo er nicht liegen sollte.
 *
 * Ernst, aber nicht dringend: Takt arbeitet weiter, und der Benutzer kann den
 * Ordner nicht selbst umlegen — deshalb dauerhaft und ruhig statt sperrend.
 * Weggeklickt werden kann er trotzdem nicht: Der Zustand bleibt bestehen, und
 * mit ihm die Gefahr aus R-13.
 *
 * Der Ton ist Warnung, nicht Fehler. Wer hier rot faerbt, hat fuer die
 * Sperrmeldung nichts Lauteres mehr uebrig.
 */
export function SyncFolderNotice({ warning, detail, className }: SyncFolderNoticeProps) {
  return (
    <div
      className={cx("shellnote", "shellnote--sync", className)}
      role="status"
      aria-live="polite"
    >
      <span className="shellnote__icon" aria-hidden>
        <Icon name="alert-triangle" size={18} />
      </span>
      <div className="shellnote__main">
        <p className="shellnote__title">Die Daten von Takt liegen an einer ungeeigneten Stelle</p>
        <p className="shellnote__body">{warning}</p>
        <div className="shellnote__todo">
          <p className="shellnote__todo-title">Was das bedeutet</p>
          <p className="shellnote__body">
            Zwei Programme, die gleichzeitig an derselben Datei arbeiten, können sie
            unbrauchbar machen — die erfassten Zeiten wären dann verloren. Und die Daten
            Ihrer Kunden verlassen den Rechner, sobald der Ordner auf einen Dateiserver
            oder in einen Onlinespeicher kopiert wird.
          </p>
        </div>
        <div className="shellnote__todo">
          <p className="shellnote__todo-title">Was Sie tun können</p>
          <p className="shellnote__body">
            Takt kann diesen Ordner nicht selbst verlegen; er wird vom Betriebssystem
            vorgegeben. Wenden Sie sich an Ihre Systembetreuung, damit der
            Anwendungsdatenordner dieses Kontos auf einem Laufwerk dieses Rechners liegt.
          </p>
        </div>
        {detail !== null ? (
          <p className="shellnote__handover">
            <span className="shellnote__handover-label">Für die Systembetreuung</span>
            {detail}
          </p>
        ) : null}
        <p className="shellnote__foot">
          Takt arbeitet weiter. Der Hinweis bleibt stehen, solange der Ordner dort liegt.
        </p>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Sperrmeldung — serviceExit                                           */
/* ==================================================================== */

export interface ServiceStoppedPanelProps {
  readonly exit: ShellServiceExit;
  /** Beendet Takt ueber die Huelle. Der einzige Ausgang aus diesem Zustand. */
  readonly onQuit: () => void | Promise<void>;
  readonly titleId: string;
  readonly descriptionId: string;
}

/**
 * Der Inhalt der Sperrmeldung, ohne Abdunklung und ohne Fokusfalle.
 *
 * Getrennt vom modalen Rahmen, damit derselbe Text an einer zweiten Stelle
 * geprueft werden kann, ohne dass die halbe Anwendung dafuer gesperrt wird.
 */
export function ServiceStoppedPanel({
  exit,
  onQuit,
  titleId,
  descriptionId,
}: ServiceStoppedPanelProps) {
  return (
    <>
      <div className="dialog__head">
        <span className="dialog__icon dialog__icon--danger">
          <Icon name="alert-circle" size={18} />
        </span>
        <h2 className="dialog__title" id={titleId}>
          Takt kann im Moment nichts speichern
        </h2>
      </div>

      <div className="dialog__body" id={descriptionId}>
        <p>
          Der lokale Dienst von Takt ist nicht erreichbar. Er ist der Teil der Anwendung,
          der jede Buchung und jede Änderung auf die Festplatte schreibt.
        </p>
        <p className="dialog__consequence">
          <Icon name="alert-triangle" size={14} />
          <span>{exit.message}</span>
        </p>
        <p className="servicestop__assurance">
          Was bereits gespeichert ist, bleibt erhalten. Alles, was Sie ab jetzt eingeben,
          geht verloren.
        </p>
        {exit.detail !== null ? (
          <p className="servicestop__handover">
            <span className="shellnote__handover-label">Für die Systembetreuung</span>
            {exit.detail}
          </p>
        ) : null}
        <p className="servicestop__steps-title">Was zu tun ist</p>
        <ol className="servicestop__steps">
          <li>Notieren Sie sich, woran Sie gerade gearbeitet haben.</li>
          <li>Beenden Sie Takt und starten Sie es neu.</li>
          <li>
            Kommt die Meldung wieder, geben Sie sie an Ihre Systembetreuung weiter.
          </li>
        </ol>
      </div>

      <div className="dialog__footer servicestop__footer">
        {exit.code !== null ? (
          <p className="servicestop__code">
            Beendigungscode <span className="mono">{exit.code}</span> — hilft bei der
            Rückfrage.
          </p>
        ) : null}
        <QuitButton onQuit={onQuit} variant="danger" />
      </div>
    </>
  );
}

export interface ServiceStoppedOverlayProps {
  readonly exit: ShellServiceExit;
  readonly onQuit: () => void | Promise<void>;
}

/**
 * Die Sperrmeldung ueber der ganzen Anwendung.
 *
 * **Bewusst ohne Ausweg ausser dem Beenden.** Kein Escape, kein Klick auf die
 * Abdunklung, kein Schliesskreuz. Das ist der einzige Ort in Takt, an dem das
 * richtig ist: Ohne den lokalen Dienst geht jede weitere Eingabe verloren, und
 * eine weggeklickte Meldung liesse den Benutzer genau das tun.
 *
 * SC 2.1.2 (keine Tastaturfalle) bleibt gewahrt, weil der Dialog eine
 * bedienbare Schaltflaeche hat, die den Zustand aufloest — „Takt beenden".
 * `onQuit` ist deshalb Pflicht und nicht Kuer: Ein Dialog ohne diesen Knopf
 * waere eine Falle.
 */
export function ServiceStoppedOverlay({ exit, onQuit }: ServiceStoppedOverlayProps) {
  return (
    <BlockingDialog>
      {({ titleId, descriptionId }) => (
        <ServiceStoppedPanel
          exit={exit}
          onQuit={onQuit}
          titleId={titleId}
          descriptionId={descriptionId}
        />
      )}
    </BlockingDialog>
  );
}

/* ==================================================================== */
/* Der Windows-Benutzername (O-AJ, T-124)                               */
/* ==================================================================== */

/**
 * Was an dem Windows-Benutzernamen dieses Rechners auffaellt.
 *
 * Ein **Befund**, kein Wert — siehe Regel 1 im Dateikopf. Er entsteht in
 * `app/connection.ts` und beantwortet genau eine Frage: Traegt der Name ein
 * Zeichen aus `FORBIDDEN_NAME_CHARACTERS` (`packages/domain/src/characters.ts`)?
 *
 * `unknown` heisst „nicht gefragt oder nicht beantwortet" — ohne Huelle etwa.
 * Es ist ausdruecklich **nicht** dasselbe wie `ok`: Aus einer Frage, die
 * niemand beantwortet hat, eine Unbedenklichkeit zu machen, waere die Bauart
 * von Fehlern, die man spaeter sucht.
 */
export type UserNameFinding = "ok" | "forbidden_characters" | "unknown";

export interface UserNameBlockedPanelProps {
  /** Der Ablageort der Daten aus `shellState().directory`, oder `null`. */
  readonly dataPath: string | null;
  readonly onQuit: () => void | Promise<void>;
  readonly titleId: string;
  readonly descriptionId: string;
}

/**
 * Takt startet nicht, weil der Windows-Benutzername Zeichen traegt, die nicht
 * in eine Abrechnungsdatei duerfen (T-122, O-AJ).
 *
 * ---------------------------------------------------------------------------
 * Wogegen dieser Kasten steht
 * ---------------------------------------------------------------------------
 *
 * Seit T-122 prueft der lokale Dienst den Namen aus der zweiten `stdin`-Zeile
 * gegen dieselbe Zeichenklasse wie jeden anderen Namen und startet nicht, wenn
 * er sie verletzt (Grund `user_invalid`, Beendigungscode 78). Das Abweisen ist
 * entschieden und richtig: Der Wert geht **unveraendert** als `WindowsUser` in
 * die Exportdatei (A-8.5, E-010), und ein Richtungszeichen darin stellt die
 * Zeile um, in der es steht.
 *
 * Nur sah der Benutzer davon nichts. Er bekam entweder die Sperrmeldung mit
 * dem Satz zu Code 78 — „weil ihm beim Start etwas fehlte" —, und da fehlte
 * nichts; oder er bekam ueberhaupt nur ein Band ueber einer Anwendung, in der
 * jeder Klick ins Leere lief. Beides ist eine stumme Tuer vor jemandem, der
 * seinen Windows-Namen nicht aendern kann.
 *
 * ---------------------------------------------------------------------------
 * Warum dieser Kasten sperrt und nicht nur warnt
 * ---------------------------------------------------------------------------
 *
 * Weil ein Name aus dieser Klasse bedeutet, dass der lokale Dienst **nicht
 * laufen kann**: Die Huelle liest den Namen einmal beim Start und schickt
 * genau ihn ueber `stdin`; der Dienst weist ihn ab, bevor er die Datenbank
 * oeffnet. Es gibt also keinen Zustand, in dem dieser Befund zutrifft und Takt
 * trotzdem arbeitet. Eine Anwendung, die dann bedienbar aussieht, ist eine
 * Anwendung, die jede Eingabe verliert.
 *
 * ---------------------------------------------------------------------------
 * Was der Text leistet, und was er nicht darf
 * ---------------------------------------------------------------------------
 *
 * **Kein „Wenden Sie sich an Ihre Systembetreuung" als einziger Ausgang**
 * (F-15). Wer allein mit Takt arbeitet, hat keine. Es stehen deshalb zwei
 * Wege da, in der Reihenfolge, in der ein Benutzer sie gehen kann, und der
 * dritte — die Weitergabe — steht als Zusatz daneben und nicht an ihrer
 * Stelle.
 *
 * **Der Name steht nicht darin.** Er traegt genau die Zeichen, um die es geht;
 * eine Meldung, die ihn wiedergibt, dreht die Zeile um, in der sie von ihm
 * berichtet (B-2.4, B-4.3 Punkt 5). Der Dienst und die Huelle halten sich an
 * dieselbe Regel; eine Oberflaeche, die ihn danebenschreibt, hoebe sie auf.
 */
export function UserNameBlockedPanel({
  dataPath,
  onQuit,
  titleId,
  descriptionId,
}: UserNameBlockedPanelProps) {
  return (
    <>
      <div className="dialog__head">
        <span className="dialog__icon dialog__icon--danger">
          <Icon name="alert-circle" size={18} />
        </span>
        <h2 className="dialog__title" id={titleId}>
          Takt kann unter diesem Windows-Benutzernamen nicht arbeiten
        </h2>
      </div>

      <div className="dialog__body" id={descriptionId}>
        <p>
          Takt schreibt den Windows-Benutzernamen, unter dem Sie an diesem Rechner
          angemeldet sind, unverändert in jede Exportdatei. Daran erkennt die Abrechnung,
          wem die erfasste Zeit gehört.
        </p>
        <p className="dialog__consequence">
          <Icon name="alert-triangle" size={14} />
          <span>
            In diesem Namen steht ein Steuer- oder Richtungszeichen. Solche Zeichen sind
            unsichtbar und können die Zeile, in der sie stehen, umstellen. Takt startet
            deshalb nicht, statt eine Abrechnung zu schreiben, die etwas anderes anzeigt,
            als in ihr steht.
          </span>
        </p>
        <p className="servicestop__assurance">
          Der Name selbst steht nicht in dieser Meldung — genau die Zeichen, um die es
          geht, würden sie umdrehen.
        </p>

        <p className="servicestop__steps-title">Was Sie tun können</p>
        <ol className="servicestop__steps">
          <li>
            Melden Sie sich an diesem Rechner unter einem anderen Windows-Konto an und
            starten Sie Takt dort. Das ist der Weg, der ohne fremde Hilfe funktioniert.
          </li>
          <li>
            Oder lassen Sie den Anmeldenamen dieses Kontos ändern. Das geht nur mit
            Administratorrechten — bei einem Firmenkonto über die Systembetreuung.
          </li>
        </ol>

        {dataPath === null ? null : (
          <p className="servicestop__assurance">
            Ihre bisher erfassten Daten sind davon nicht betroffen. Sie liegen in{" "}
            <span className="mono">{dataPath}</span>. Sichern Sie diesen Ordner, bevor Sie
            das Konto wechseln: Unter einem anderen Konto legt Takt einen eigenen an.
          </p>
        )}

        <p className="servicestop__handover">
          <span className="shellnote__handover-label">Für die Systembetreuung</span>
          Der lokale Dienst weist den Windows-Benutzernamen ab (Grund
          <span className="mono"> user_invalid</span>): Er enthält ein Steuer- oder
          Richtungszeichen (C0, C1 oder ein bidirektionales Formatierungszeichen) und ginge
          unverändert als Feld „WindowsUser" in die Abrechnungsdatei.
        </p>
      </div>

      <div className="dialog__footer servicestop__footer">
        <QuitButton onQuit={onQuit} variant="danger" />
      </div>
    </>
  );
}

export interface UserNameBlockedOverlayProps {
  readonly dataPath: string | null;
  readonly onQuit: () => void | Promise<void>;
}

/** Die Meldung zum Benutzernamen ueber der ganzen Anwendung. */
export function UserNameBlockedOverlay({ dataPath, onQuit }: UserNameBlockedOverlayProps) {
  return (
    <BlockingDialog>
      {({ titleId, descriptionId }) => (
        <UserNameBlockedPanel
          dataPath={dataPath}
          onQuit={onQuit}
          titleId={titleId}
          descriptionId={descriptionId}
        />
      )}
    </BlockingDialog>
  );
}

/* ==================================================================== */
/* Der sperrende Rahmen — einmal fuer beide Sperrmeldungen              */
/* ==================================================================== */

interface BlockingDialogProps {
  readonly children: (ids: {
    readonly titleId: string;
    readonly descriptionId: string;
  }) => ReactNode;
}

/**
 * Abdunklung, Fokusfalle und `alertdialog` — der Rahmen, den sich die beiden
 * Sperrmeldungen teilen (T-124).
 *
 * Er stand bis T-124 in `ServiceStoppedOverlay`. Als die Meldung zum
 * Benutzernamen dazukam, waeren es zwei zeichengleiche Fassungen von
 * `useId`/`focusFirstWithin`/`keepTabInside` gewesen — und die zweite haette
 * beim naechsten Nachziehen der Fokusregeln gefehlt.
 *
 * **Kein Escape.** Der Zustand endet nicht dadurch, dass man ihn wegdrueckt;
 * beide Meldungen gelten, bis Takt beendet ist. SC 2.1.2 bleibt gewahrt, weil
 * jede von ihnen eine bedienbare Schaltflaeche traegt, die genau das tut.
 */
function BlockingDialog({ children }: BlockingDialogProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    focusFirstWithin(dialogRef.current);
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    // Escape ist hier absichtlich nicht behandelt: Der Zustand endet nicht
    // dadurch, dass man ihn wegdrueckt.
    keepTabInside(dialogRef.current, event);
  }, []);

  return (
    <div className="scrim scrim--blocking" onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="dialog dialog--danger"
      >
        {children({ titleId, descriptionId })}
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Zusammenstellung                                                     */
/* ==================================================================== */

export interface ShellStatusProps {
  /** Das Ergebnis von `shellState()` aus der Huelle. */
  readonly state: ShellStateSnapshot;
  /** Ruft `quit()` der Huelle auf. */
  readonly onQuit: () => void | Promise<void>;
  /**
   * Der Befund zum Windows-Benutzernamen (O-AJ, T-124).
   *
   * Ein Befund und **kein Name** — Regel 1 im Dateikopf. Vorgabe ist
   * `"unknown"`: Wer die Frage nicht stellt, bekommt keine Meldung, und die
   * Musterseite muss dafuer nichts wissen.
   */
  readonly userName?: UserNameFinding;
  readonly className?: string;
}

/**
 * Alle drei Huellenzustaende an einer Stelle, in der Reihenfolge ihrer
 * Dringlichkeit: die Sperrmeldung ueber allem, darunter die Startmeldung,
 * darunter der Datenordner.
 *
 * Im Normalfall — nichts aufgefallen, Dienst laeuft — kommt hier nichts auf
 * den Bildschirm. Das ist der Leerzustand dieser Anzeige und braucht keinen
 * Platzhalter: „Alles in Ordnung" ist die Abwesenheit einer Meldung, kein
 * eigener Kasten.
 */
export function ShellStatus({
  state,
  onQuit,
  userName = "unknown",
  className,
}: ShellStatusProps) {
  const problems = startupProblems(state);
  // Ordner und Warnung zusammen halten: Der Zusatz gehoert zu genau diesem
  // Befund, und getrennte Zugriffe ueber `?.` liessen offen, ob beide aus
  // demselben Bericht stammen.
  const directory = state.directory;
  const syncWarning = directory === null ? null : directory.syncWarning;
  const hasNotices = problems.length > 0 || syncWarning !== null;

  return (
    <>
      {hasNotices ? (
        <div className={cx("shellnotes", className)}>
          <StartupProblemNotice problems={problems} onQuit={onQuit} />
          {directory !== null && syncWarning !== null ? (
            <SyncFolderNotice warning={syncWarning} detail={directory.syncDetail} />
          ) : null}
        </div>
      ) : null}
      {/*
        Zwei Sperrmeldungen, und die Reihenfolge ist Inhalt.

        Traegt der Windows-Benutzername ein Zeichen aus der Klasse, kann der
        lokale Dienst nicht laufen — und der Satz zum Beendigungscode 78 („weil
        ihm beim Start etwas fehlte") beschriebe den Fall falsch: Es fehlt
        nichts. Deshalb steht dieser Befund **vor** dem Ausfall des Dienstes;
        er ist dessen Ursache und nicht ein zweiter Zustand daneben.

        Und er sperrt auch dann, wenn `serviceExit` leer ist: Faengt die Huelle
        den Namen schon vor dem Start ab, steht ihr Satz nur in `problems`, und
        der Benutzer saesse vor einer Anwendung, die bedienbar aussieht und
        deren jeder Klick ins Leere laeuft.
      */}
      {userName === "forbidden_characters" ? (
        <UserNameBlockedOverlay dataPath={directory?.path ?? null} onQuit={onQuit} />
      ) : state.serviceExit !== null ? (
        <ServiceStoppedOverlay exit={state.serviceExit} onQuit={onQuit} />
      ) : null}
    </>
  );
}
