import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from "react";

import type { ForeignText, UncappedText } from "../../api/types";
import { cx } from "../../lib/cx";
import { focusableWithin, keepTabInside } from "../../lib/focus";
import { foreignText } from "../../lib/foreign";
import { effectiveFileNameOf, extensionOf, fileNameOf, runsWhenOpened } from "./attachmentLabel";
import { Foreign } from "../../shared/ui/Foreign";
import { ForeignName } from "../../shared/ui/ForeignName";
import { Icon } from "../../shared/ui/Icon";
import { Button } from "../../shared/ui/Primitives";

/**
 * Takt — die Rückfrage vor dem Öffnen einer **Datei** (E-072 Punkt 3, R-21,
 * Auflage A-A-6).
 *
 * ===========================================================================
 * Warum es sie gibt, obwohl E-059 Bestätigungsdialoge zurückdrängt
 * ===========================================================================
 *
 * E-059 nimmt „Vom Board nehmen" den Bestätigungsdialog, weil die Handlung
 * **umkehrbar** ist: Was sich rückgängig machen lässt, bekommt einen Rückweg
 * und keine Frage. Das Öffnen einer `.bat` ist **nicht** umkehrbar — es gibt
 * kein „Rückgängig" für ein gestartetes Programm. Die beiden Entscheidungen
 * widersprechen sich also nicht; sie wenden dasselbe Kriterium an und kommen
 * bei verschiedenen Handlungen zu verschiedenen Ergebnissen (T-144 Abschnitt
 * 8.4).
 *
 * **Bei einem Verweis gibt es sie nicht** (Auflage A-A-7). Ein Browser ist der
 * erwartete Ausgang, und eine Frage vor jedem Verweis wäre die Gewöhnung, an
 * der die Frage vor der Datei stirbt.
 *
 * ===========================================================================
 * Die sechs Eigenschaften aus A-A-6, und wo jede in dieser Datei steht
 * ===========================================================================
 *
 * 1. **Voller Pfad, ungekürzt, Dateiname abgesetzt.** Er steht in
 *    Festbreitenschrift und bricht um; er wird **nie** in der Mitte gekürzt.
 *    Ein `C:\\Users\\…\\rechnung.exe` verbirgt genau das Stück, an dem man
 *    erkennt, wo die Datei herkommt. Der Dateiname steht zusätzlich
 *    hervorgehoben darüber — dort steht, was zählt.
 * 2. **Jeder angezeigte Teil geht durch die Behandlung für fremden Text.**
 *    `foreignText` (also `visibleText` aus der Domäne) auf Pfad **und**
 *    Dateiname. Ohne sie zeigt eine Datei namens `rechnung\\u{202e}cod.exe`
 *    hier `rechnungexe.doc` an — an einer Zeile, deren Klick ein Programm
 *    startet. Das ist die wichtigste einzelne Anforderung an diesen Dialog, und
 *    sie kostet nichts, weil die Behandlung seit E-063 existiert.
 * 3. **Der Satz nennt die Wirkung, nicht die Handlung.** Nicht „Datei öffnen?",
 *    sondern: die Datei wird mit der Standardanwendung des Systems geöffnet —
 *    dasselbe wie ein Doppelklick. Bei einer ausführbaren Endung kommt ein
 *    zweiter Satz dazu, und die Knopfbeschriftung wechselt auf „Ausführen".
 * 4. **Keine Vorauswahl.** Kein Knopf ist vorbelegt, keiner hat den
 *    Anfangsfokus (der liegt auf dem Dialog selbst, `tabIndex={-1}`), und
 *    `Enter` löst nichts aus. Derselbe Grundsatz wie A-18.7 im Versionsdialog,
 *    nur mit größerer Folge: Dort ist die Vorauswahl ein Reiter im Browser,
 *    hier ein Prozessstart.
 * 5. **Kein „nicht mehr fragen".** Es gibt hier kein Kontrollkästchen, und das
 *    ist keine Auslassung. E-072 Punkt 2 verlangt die Prüfung bei **jedem**
 *    Aufruf; eine gemerkte Antwort wäre genau das, was die Rückfrage zur
 *    Formsache macht — der Benutzer schaltete sie beim ersten harmlosen Anhang
 *    ab (R-20 beschreibt denselben Mechanismus von der anderen Seite).
 *    Zusätzlich: Designsystem 8 reserviert das Kontrollkästchen für das
 *    Zurücksetzen des Exportstatus. Ein zweiter Einsatz entwertete es dort, wo
 *    es Geld schützt. Die Wirkung entsteht hier über Wortlaut, Pfad und Fokus.
 * 6. **Kein `window.confirm`.** Es ist eine Zeile, die ein eingeschleustes
 *    Skript nachbauen kann, und es kann Punkt 2 nicht — es zeigt rohen Text.
 *
 * ===========================================================================
 * Warum ein eigener Baustein und nicht `ConfirmDialog`
 * ===========================================================================
 *
 * `ConfirmDialog` setzt den Fokus mit `focusFirstWithin` in den Dialog und hebt
 * seinen rechten Knopf hervor (Designsystem 8). Beides ist hier falsch, und
 * beides ließe sich nur über Schalter abstellen, die danach an jeder anderen
 * Aufrufstelle mitgeschleppt würden. Eine Fläche, an der der Unterschied die
 * Aussage ist, bekommt ihren eigenen Baustein.
 *
 * ===========================================================================
 * „Name beim Öffnen" — zwei Namen untereinander, nur bei Abweichung (X-05)
 * ===========================================================================
 *
 * Windows wirft nachgestellte Punkte und Leerzeichen weg, bevor es eine Datei
 * auflöst. Bis T-167 stand deshalb vier Zeilen weit oben `rechnung.exe.` und
 * daneben eine Behauptung über eine Endung „exe", die dort niemand wiederfand.
 * Der Dialog log nicht — er **schwieg** an der Stelle, an der Anzeige und
 * Wirkung auseinandergehen, und das ist die Klasse, die R-21 schließen soll.
 *
 * Die Antwort ist **kein Fließsatz**, sondern ein drittes Beschriftungspaar:
 * Der Benutzer soll zwei Namen **vergleichen**, und ein Vergleich gehört
 * untereinander in dieselbe Spalte. Es erscheint **nur bei Abweichung** —
 * stimmen die beiden überein, steht dort gar nichts (E-078 Punkt 2), und die
 * Zeile ist damit keine, die man nach dem dritten Mal überliest.
 *
 * **Die Bedingung wird hier nicht gerechnet.** `effectiveFileNameOf` steht in
 * `features/todos/attachmentLabel.ts` und wird auch von `extensionOf` gerufen — die
 * Wirkung und die Auskunft über sie kommen damit aus derselben Rechnung. Eine
 * zweite Abschneideregel an dieser Stelle wäre eine **dritte** Wahrheit über
 * denselben Namen, und O-CU war der Beweis, wie teuer die zweite schon war.
 *
 * **Die Zeile ist keine Kontrolle.** Sie sagt, welchen Namen das Betriebssystem
 * öffnet; ob überhaupt geöffnet wird, entscheidet `check_file` in
 * `apps/desktop/src-tauri/src/attachment.rs`, bei jedem Aufruf. Wer die Anzeige
 * für die Grenze hält, baut die Grenze aus.
 *
 * ===========================================================================
 * Der dritte Zustand: Takt öffnet diese Datei gar nicht (V-07)
 * ===========================================================================
 *
 * Fünf Endungen — `.lnk`, `.url`, `.pif`, `.scf`, `.desktop` — sind
 * **Umleitungen**, und ein Dateiname mit Doppelpunkt benennt unter Windows
 * einen zweiten Datenstrom (A-A-28). Für beide weist die Hülle ab. Bis T-167
 * erfuhr der Benutzer das erst **nach** dem Bestätigen: Der Dialog zeigte die
 * milde Fassung „Diese Datei wird geöffnet", er klickte „Öffnen", und dann kam
 * der Satz. Die Kette hielt, die Reihenfolge der Auskunft war verkehrt herum.
 *
 * Jetzt steht derselbe Satz **vor** dem Klick, und es gibt keinen Öffnen-Knopf
 * mehr, den es zu klicken gäbe. `foreseeableRefusalOf` liest die Liste aus
 * `@takt/domain` statt sie abzuschreiben; die Abweisung selbst bleibt
 * unangetastet in der Hülle.
 *
 * ===========================================================================
 * Der Fehlerzustand bleibt **im** Dialog
 * ===========================================================================
 *
 * Weist die Hülle ab — Pfad nicht mehr da, UNC, nicht absolut, Umleitung —,
 * bleibt der Dialog stehen und nennt den Grund. Er schließt sich **nicht**, als
 * wäre etwas geschehen. Der Meldungsstapel liegt seit T-110 hinter der
 * Abdunklung, solange ein Dialog steht; dieselbe Lehre wie bei „Takt beenden"
 * (T-133) und beim Versionsdialog (T-139).
 *
 * ===========================================================================
 * Drei Zutaten aus T-302 — Herkunft, Endung, Nachbau
 * ===========================================================================
 *
 * **1. Die Herkunft** (Auflage A-A-85). Bis A-19.23 war jeder Dateianhang von
 * Hand eingetragen: Der Benutzer kannte die Herkunft, weil er sie selbst
 * gewählt hatte. Seither ist der häufigste Dateianhang einer, den ein
 * **Fremder** geschickt hat, und der Benutzer sieht ihn Tage später zwischen
 * seinen eigenen. Die Rückfrage sagte bisher, **was** geschieht; sie sagt jetzt
 * auch, **woher** diese Datei kommt, und nennt den Absender als fremden Text.
 *
 * **2. Die abgesetzte Endung** (Auflage A-A-86). Der Dialog kannte sie längst
 * (`extensionOf`), zeigte sie aber nur als Ende einer Pfadzeile. Bei
 * `…Rechnung.pdf␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣.exe` steht sie zwanzig Zeichen vom
 * lesbaren Namen entfernt und kann in der Zeile umbrechen. Sie steht jetzt in
 * einer eigenen Zeile mit ihrem Urteil daneben: „Endung: exe — wird
 * ausgeführt". Der Wert kommt aus dem **Pfad** und nicht aus dem Anzeigenamen —
 * der Pfad ist es, den das Betriebssystem auflöst (A-19.23a).
 *
 * **3. Der Nachbau** (A-19.22b, Auflage A-A-97). Ist die `.eml` nicht die
 * ursprüngliche Nachricht, steht das hier — nicht nur beim Anlegen im
 * Aufgabenbereich, denn drei Wochen später ist ein Hinweis von dort nirgends,
 * und der Benutzer steht dann vor dieser Frage.
 *
 * ===========================================================================
 * Und eine vierte Sache, die nichts hinzufügt, sondern etwas verbietet
 * ===========================================================================
 *
 * **Nichts in diesem Dialog wird am Ende gekürzt** (A-19.23b, Auflage A-A-93,
 * R-27). Eigenschaft 1 sagte das schon für den Pfad — der security-checker hat
 * gezeigt, daß die Zusage bisher **nirgends gemessen** war: Ein Deckel in der
 * Darstellung verändert kein Zeichen, also sieht ihn weder `visibleText` noch
 * `proof:foreign`. Der Benutzer bestätigt dann `Rechnung…` und startet eine
 * `.exe`.
 *
 * Deshalb tragen Name, aufgelöster Name, Anzeigename und Endung seit T-302 den
 * Typ `UncappedText`, gehen durch {@link ForeignName}, und
 * `scripts/proof-clamp.mjs` mißt die Klassen dieser Datei gegen die Menge der
 * deckelnden Klassen aus den Stilblättern. Wer hier ein `truncate` setzt, macht
 * den Lauf rot.
 */
export interface AttachmentOpenDialogProps {
  readonly open: boolean;
  /**
   * Der volle Pfad aus dem Bestand. Fremder Text (E-063) — und `UncappedText`,
   * weil er ungekürzt dastehen muß (A-A-6 Eigenschaft 1, Auflage A-A-93).
   */
  readonly path: UncappedText;
  /**
   * Der Name aus der E-Mail (A-19.23a), falls dieser Anhang von dort stammt.
   * `null` bei jedem Anhang, den der Benutzer selbst eingetragen hat.
   *
   * **Er ist nicht der Name auf der Platte.** Den bestimmt SuperTakt; dieser
   * hier ist der einzige Wert im Dialog, den ein Absender frei gewählt hat —
   * und genau deshalb steht er da: Was der Benutzer in der Liste gelesen und
   * angeklickt hat, ist er, nicht `<32 Hexziffern>.pdf`. Verschwiege ihn der
   * Dialog, hätte die Rückfrage nichts mit der Zeile zu tun, aus der sie kommt.
   */
  readonly displayName?: UncappedText | null;
  /**
   * Der Absender der E-Mail, aus der diese Datei stammt (Auflage A-A-85).
   * `null` heißt: nicht aus einer E-Mail, oder kein Absender bekannt.
   */
  readonly originSender?: ForeignText | null;
  /**
   * Diese Datei stammt aus einer E-Mail (A-A-84). Getrennt von
   * {@link AttachmentOpenDialogProps.originSender}, weil „aus einer E-Mail ohne
   * bekannten Absender" eine Aussage ist und „nicht aus einer E-Mail" eine
   * andere.
   */
  readonly fromEmail?: boolean;
  /**
   * Diese Datei ist ein **Nachbau** der Nachricht und nicht die Nachricht
   * selbst (A-19.22b, Auflage A-A-97).
   */
  readonly rebuilt?: boolean;
  /**
   * Der Grund, aus dem die Hülle abgewiesen hat — schon als deutscher Satz.
   * `null`, solange nichts schiefgegangen ist.
   */
  readonly refusal?: string | null;
  /**
   * Der Satz zu einer Abweisung, die **schon vor dem Klick** feststeht (V-07)
   * — eine Umleitung oder ein Doppelpunkt im Namen. `null`, solange nichts
   * dagegen spricht. Steht hier ein Satz, trägt der Dialog keinen Öffnen-Knopf.
   *
   * Er kommt fertig herein, aus derselben Zuordnung wie jede andere Absage der
   * Hülle (`REFUSAL_TEXT` in `Attachments.tsx`) — damit derselbe Grund nicht an
   * zwei Stellen zwei Sätze bekommt.
   */
  readonly foreseenRefusal?: string | null;
  /** Der Öffnen-Befehl läuft. Der Bestätigungsknopf trägt den Anzeiger. */
  readonly busy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function AttachmentOpenDialog({
  open,
  path,
  displayName = null,
  originSender = null,
  fromEmail = false,
  rebuilt = false,
  refusal = null,
  foreseenRefusal = null,
  busy = false,
  onConfirm,
  onCancel,
}: AttachmentOpenDialogProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    /*
      Der Fokus geht auf den **Dialog** und nicht auf einen seiner Knöpfe
      (Eigenschaft 4). Ein Fokus auf „Ausführen" machte ein bloßes Enter zur
      Antwort — und ein Doppelklick auf die Zeile darunter erzeugt das zweite
      Ereignis, bevor der Benutzer die Frage gelesen hat.
    */
    dialogRef.current?.focus();
    return () => {
      openerRef.current?.focus();
    };
  }, [open]);

  /*
    Während der Öffnen-Befehl läuft, sperren sich beide Knöpfe — und ein
    Element, das den Fokus trägt und dabei gesperrt wird, gibt ihn an den
    Dokumentkörper ab. Der Benutzer stünde dann außerhalb des modalen Dialogs,
    ohne ihn verlassen zu haben (SC 2.4.3). Derselbe Griff wie im
    Versionsdialog.
  */
  useEffect(() => {
    if (!open || !busy) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && dialogRef.current?.contains(active) === true) {
      dialogRef.current.focus();
    }
  }, [open, busy]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) onCancel();
        return;
      }
      /*
        Der Dialog trägt `tabIndex={-1}` und steht damit nicht in der
        Tabulatorreihenfolge; `keepTabInside` kennt ihn weder als erstes noch
        als letztes Element. Liegt der Fokus auf ihm — und das tut er beim
        Öffnen —, liefe ein Shift+Tab beim allerersten Tastendruck hinaus.
      */
      if (event.key === "Tab" && document.activeElement === dialogRef.current) {
        /*
          Angehalten wird auch dann, wenn gerade **kein** Knopf bedienbar ist:
          Während der Öffnen-Befehl läuft, sind beide gesperrt, und ein
          durchgelassener Tabulator führte dann aus dem modalen Dialog heraus.
        */
        event.preventDefault();
        const buttons = focusableWithin(dialogRef.current);
        const target = event.shiftKey ? buttons[buttons.length - 1] : buttons[0];
        target?.focus();
        return;
      }
      keepTabInside(dialogRef.current, event);
    },
    [busy, onCancel],
  );

  if (!open) return null;

  /*
    Steht die Absage schon fest, wird nichts ausgeführt und nichts geöffnet —
    dann ist auch die Frage nach der Endung keine, die noch etwas entscheidet.
  */
  const blocked = foreseenRefusal !== null;
  const executes = !blocked && runsWhenOpened(path);
  /*
    Die Endung steht **zweimal** auf dem Bildschirm: im Satz über die Ausführung
    und abgesetzt im Kasten (Auflage A-A-86). Beide Male derselbe Wert aus
    derselben Rechnung — im Satz als Zeichenkette (dort ist nur eine möglich),
    im Kasten als {@link ForeignName}, weil sie dort für sich steht und dann
    auch für sich ungekürzt bleiben muß.
  */
  const rawExtension = extensionOf(path);
  const extension = foreignText(rawExtension);
  // Der Pfad durch die Behandlung für fremden Text (Eigenschaft 2). Name und
  // aufgelöster Name gehen über {@link ForeignName}, der sie selbst behandelt.
  const visiblePath = foreignText(path);
  const rawName = fileNameOf(path);
  const effectiveName = effectiveFileNameOf(path);
  /*
    X-05: nur bei **Abweichung**. Gerechnet wird sie nicht hier — beide Werte
    kommen aus `features/todos/attachmentLabel.ts`, aus derselben Rechnung wie die Endung.
    Auch der aufgelöste Name ist fremder Text und geht durch die Behandlung.
  */
  const nameDiverges = effectiveName !== rawName;

  return (
    <div className="scrim" onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cx("dialog", "dialog--open-file", executes && "dialog--danger")}
      >
        <div className="dialog__head">
          <span className={cx("dialog__icon", (executes || blocked) && "dialog__icon--danger")}>
            <Icon name={executes || blocked ? "alert-triangle" : "info"} size={18} />
          </span>
          <h2 className="dialog__title" id={titleId}>
            {blocked
              ? "Diese Datei wird nicht geöffnet"
              : executes
                ? "Diese Datei wird ausgeführt"
                : "Diese Datei wird geöffnet"}
          </h2>
        </div>

        <div className="dialog__body" id={descriptionId}>
          {/*
            Eigenschaft 3: die **Wirkung** im Satz. „Dasselbe wie ein
            Doppelklick" ist der Vergleich, den jeder Benutzer kennt — und er
            sagt zugleich, dass Takt danach nichts mehr in der Hand hat.

            Steht die Absage schon fest, wäre dieser Satz falsch: Takt übergibt
            dann gar nichts. An seiner Stelle steht der Grund (V-07).
          */}
          {blocked ? (
            <p className="dialog__consequence">
              <Icon name="alert-triangle" size={14} />
              <span>{foreseenRefusal}</span>
            </p>
          ) : (
            <p>
              SuperTakt übergibt diese Datei an die Standardanwendung des Systems — dasselbe wie ein
              Doppelklick im Dateimanager. Was danach geschieht, entscheidet die Anwendung, die
              Ihr System dafür eingestellt hat.
            </p>
          )}

          {executes ? (
            <p className="dialog__consequence">
              <Icon name="alert-triangle" size={14} />
              <span>
                <strong>Diese Datei wird dabei ausgeführt.</strong> Eine Datei mit der Endung „
                {extension}" ist ein Programm oder eine Befehlsfolge und läuft mit Ihren Rechten.
              </span>
            </p>
          ) : null}

          {/*
            Auflage A-A-85: die **Herkunft**. Sie steht vor dem Kasten mit Namen
            und Pfad, weil sie die Frage beantwortet, die ein Mensch zuerst
            stellt — „wo kommt das her?" —, und weil der Kasten darunter die
            Antwort auf „was genau ist das?" ist.

            Der Absender ist fremder Text und geht durch `<Foreign>`; ohne die
            Behandlung ordnete ein Richtungszeichen darin den deutschen Satz um,
            in dem er steht.
          */}
          {fromEmail ? (
            <p className="dialog__consequence dialog__consequence--origin">
              <Icon name="inbox" size={14} />
              <span>
                {originSender === null ? (
                  <>Diese Datei stammt aus einer E-Mail.</>
                ) : (
                  <>
                    Diese Datei stammt aus einer E-Mail von{" "}
                    <Foreign value={originSender} />.
                  </>
                )}{" "}
                Ihren Namen und ihren Inhalt hat der Absender bestimmt, nicht Sie.
              </span>
            </p>
          ) : null}

          {/*
            A-19.22b und Auflage A-A-97: der **Nachbau**. Er hängt an der Datei
            und nicht am Augenblick des Anlegens — deshalb steht er hier und
            nicht nur im Aufgabenbereich. Der Satz nennt die Folge und nicht die
            Technik: Was fehlt, sind die ursprünglichen Kopfzeilen, und was
            daraus folgt, ist die Untauglichkeit als Beleg.
          */}
          {rebuilt ? (
            <p className="dialog__consequence dialog__consequence--rebuilt">
              <Icon name="alert-triangle" size={14} />
              <span>
                <strong>Diese Datei ist ein Nachbau:</strong> Outlook hat die ursprüngliche
                Nachricht nicht als Datei hergegeben. Absender, Empfänger, Betreff, Versanddatum
                und Text stehen in der Datei. Die technischen Kopfzeilen der ursprünglichen
                Nachricht stehen nicht darin — und mit ihnen nicht der Nachweis, welchen Weg sie
                genommen hat.
              </span>
            </p>
          ) : null}

          <div className="openfile">
            <p className="openfile__label">Dateiname</p>
            {/*
              Eigenschaft 1: Der Dateiname steht abgesetzt über dem Pfad. `bdi`
              isoliert ihn vom deutschen Satz darum; `foreignText` hat die
              unsichtbaren Zeichen bereits sichtbar gemacht.
            */}
            <p className={cx("openfile__name", "mono", nameDiverges && "openfile__name--diverging")}>
              <ForeignName value={rawName} />
            </p>
            {/*
              X-05: das dritte Beschriftungspaar. Es steht **vor** dem vollen
              Pfad und nie an seiner Stelle — A-A-6 Punkt 1 und R-21 bleiben
              unangetastet, der Pfad behält den rohen Wert.
            */}
            {nameDiverges ? (
              <>
                <p className="openfile__label">Name beim Öffnen</p>
                <p className="openfile__name openfile__name--resolved mono">
                  <ForeignName value={effectiveName} />
                </p>
                <p className="openfile__note">
                  Punkte und Leerzeichen am Ende lässt Windows beim Öffnen weg.
                </p>
              </>
            ) : null}
            {/*
              A-19.23a: Der Name aus der E-Mail steht **unter** dem Namen auf
              der Platte und nicht an seiner Stelle. Die Reihenfolge ist die
              Aussage: Oben steht, was geöffnet wird; hier steht, was der
              Benutzer gelesen hat. Wäre es umgekehrt, wäre die Zeile mit der
              größten Schrift die, die am wenigsten über die Wirkung sagt.
            */}
            {displayName === null ? null : (
              <>
                <p className="openfile__label">Name aus der E-Mail</p>
                <p className="openfile__name openfile__name--foreign mono">
                  <ForeignName value={displayName} />
                </p>
                <p className="openfile__note">
                  Diesen Namen hat der Absender gewählt. SuperTakt zeigt ihn, öffnet aber die Datei
                  oben — ein fremder Name bestimmt hier nichts.
                </p>
              </>
            )}
            <p className="openfile__label">Vollständiger Pfad</p>
            <p className="openfile__path mono">
              <bdi>{visiblePath}</bdi>
            </p>
            {/*
              Auflage A-A-86: die aufgelöste Endung **abgesetzt**, mit ihrem
              Urteil daneben. Zwischen lesbarem Namen und Endung können beliebig
              viele Zeichen stehen, und eine Pfadzeile bricht um — dann steht
              die Endung irgendwo in der Mitte des Kastens.

              Gerechnet wird sie nicht hier: `extensionOf` ist dieselbe Rechnung,
              die über „öffnen" und „ausführen" entscheidet. Eine zweite wäre
              eine zweite Wahrheit über dieselbe Datei.
            */}
            <p className="openfile__label">Endung</p>
            <p
              className={cx(
                "openfile__extension",
                "mono",
                executes && "openfile__extension--executes",
              )}
            >
              {rawExtension === "" ? (
                <span className="openfile__extension-none">
                  keine — das System entscheidet selbst, womit es die Datei öffnet
                </span>
              ) : (
                <>
                  <ForeignName className="openfile__extension-value" value={rawExtension} />
                  <span className="openfile__extension-verdict">
                    {executes ? "— wird ausgeführt" : "— wird geöffnet"}
                  </span>
                </>
              )}
            </p>
          </div>

          {/*
            Die Live-Region steht **immer**, auch leer — sonst meldet eine
            Vorlesehilfe die Absage nicht, weil sie die Region in dem Augenblick
            noch nicht kennt (dieselbe Regel wie in `ConfirmDialog`).
          */}
          <div role="status">
            {refusal === null ? null : (
              <p className="dialog__consequence">
                <Icon name="alert-triangle" size={14} />
                <span>{refusal}</span>
              </p>
            )}
          </div>
        </div>

        <div className="dialog__footer">
          {/*
            V-07: Steht die Absage fest, gibt es **keinen Öffnen-Knopf**. Ein
            gesperrter wäre schlechter als keiner — er hielte die Handlung als
            Möglichkeit auf dem Bildschirm, die es nicht gibt. Es bleibt der eine
            Knopf, der die Fläche schließt; „Abbrechen" wäre hier falsch, weil
            nichts abzubrechen ist.
          */}
          {blocked ? (
            <Button variant="secondary" onClick={onCancel}>
              Schließen
            </Button>
          ) : (
            <>
              {/*
                Eigenschaft 4: Beide Knöpfe tragen dieselbe Gestalt — kein
                `variant="primary"`, keine Hervorhebung. Bei einer ausführbaren
                Endung ist der rechte Knopf `danger`; das ist keine Hervorhebung,
                sondern eine Warnung, und sie zieht keinen Klick an.
              */}
              <Button variant="secondary" onClick={onCancel} disabled={busy}>
                Abbrechen
              </Button>
              <Button
                variant={executes ? "danger" : "secondary"}
                onClick={onConfirm}
                loading={busy}
                iconEnd="arrow-up-right"
              >
                {/* Das Wort ist die Hälfte der Auskunft. Nie „OK", nie „Ja". */}
                {executes ? "Ausführen" : "Öffnen"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
