import type { DirectoryReport, ServiceExit, ShellState } from "@takt/desktop/shell";
import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from "react";
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
 *    auf und nimmt keinen Namen entgegen.
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
/* Startmeldung — problems                                              */
/* ==================================================================== */

export interface StartupProblemNoticeProps {
  /** Die Saetze der Huelle, unveraendert. Leer heisst: nichts anzeigen. */
  readonly problems: readonly string[];
  /** Beendet Takt ueber die Huelle. Ohne Rueckfrage gibt es keinen Knopf. */
  readonly onQuit?: () => void;
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
            <Button variant="secondary" size="sm" iconStart="x" onClick={onQuit}>
              Takt beenden
            </Button>
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
  readonly onQuit: () => void;
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
        <Button variant="danger" iconStart="x" onClick={onQuit}>
          Takt beenden
        </Button>
      </div>
    </>
  );
}

export interface ServiceStoppedOverlayProps {
  readonly exit: ShellServiceExit;
  readonly onQuit: () => void;
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
        <ServiceStoppedPanel
          exit={exit}
          onQuit={onQuit}
          titleId={titleId}
          descriptionId={descriptionId}
        />
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
  readonly onQuit: () => void;
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
export function ShellStatus({ state, onQuit, className }: ShellStatusProps) {
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
      {state.serviceExit !== null ? (
        <ServiceStoppedOverlay exit={state.serviceExit} onQuit={onQuit} />
      ) : null}
    </>
  );
}
