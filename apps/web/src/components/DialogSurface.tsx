import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { focusFirstWithin } from "../lib/focus";

/**
 * Takt — die Zustandsmaschine unter allen modalen Dialogen (E-076 Stufe 1).
 *
 * ===========================================================================
 * Was hier hereinkam und was ausdrücklich draußen blieb
 * ===========================================================================
 *
 * Bis T-152 führten `FormDialog`, `ConfirmDialog`, `InfoDialog` und
 * `UpdateDialog` jeder für sich: `role`, `aria-modal`, den Fokuseinsprung, die
 * Fokusrückgabe, die Tabulatorschleife aus `lib/focus.ts` und die Behandlung
 * von Escape. Vier Kopien derselben Sache — und die Teile, die man dabei
 * übersieht, sind immer dieselben: welche Ebene ein Escape trifft, wohin der
 * Fokus fällt, wenn das fokussierte Element verschwindet, und was ein
 * Tabulator tut, während der Dialog selbst den Fokus trägt.
 *
 * Ark UI liefert genau diese Zustandsmaschine (dieselbe Bibliothek, dieselbe
 * Fassung wie Auswahlfeld, Kombobox und Menü seit T-059, E-052). **Aussehen
 * und Ansprache bleiben aus diesem Bestand:** `.scrim` und `.dialog` sind
 * weiterhin unsere Elemente mit unseren Klassen, die Rolle und der zugängliche
 * Name jedes Dialogs bleiben zeichengleich (E-076 Punkt 3).
 *
 * ===========================================================================
 * Warum `modal={false}` steht — und `aria-modal="true"` trotzdem
 * ===========================================================================
 *
 * Das ist die einzige Stelle, an der diese Fläche von der Voreinstellung von
 * Ark UI abweicht, und sie ist gemessen, nicht vermutet.
 *
 * `modal` heißt in der Zustandsmaschine **nicht** „ist ein modaler Dialog",
 * sondern schaltet vier Dinge gleichzeitig: `trapFocus` (Fokusfalle),
 * `preventScroll` (Sperre des Seitenbildlaufs), `pointerBlocking` an der
 * Abweisungsebene (Sperre der Zeigerereignisse außerhalb) — und
 * `hideContentBelow`. Das letzte setzt beim Öffnen einmalig `aria-hidden` auf
 * **jedes** Element neben dem Dialog, den Dokumentkörper hinauf. Zwei Folgen,
 * beide unerwünscht:
 *
 *  1. **Die aufgeklappte Liste eines Auswahlfeldes im Dialog verschwände aus
 *     dem Zugänglichkeitsbaum.** `Select`, `TagInput` und `Menu` zeichnen ihre
 *     Liste in ein Portal am Dokumentkörper. Beim Öffnen des Dialogs ist diese
 *     Liste noch zu, `findControlledElements` verlangt aber
 *     `aria-expanded="true"` und lässt sie deshalb nicht stehen — sie bekäme
 *     `aria-hidden="true"` und behielte es, weil `walkTreeOutside` genau
 *     einmal läuft. Eine Vorlesehilfe fände die Optionen dann nicht mehr. Das
 *     ist kein Testproblem, sondern ein Fehler.
 *  2. **Jede Fläche hinter dem Dialog verlöre ihre Rolle**, solange er steht.
 *     Der Vertrag aus E-076 Punkt 3 hält aber genau das fest: Rolle und Name
 *     bleiben, wie sie sind.
 *
 * Deshalb: `modal={false}` und dafür einzeln, was gebraucht wird —
 * `trapFocus` ausdrücklich an, `closeOnInteractOutside` ausdrücklich aus (ein
 * Klick auf die Abdunklung hat in Takt noch nie geschlossen), und
 * `aria-modal="true"` am Kasten selbst. Letzteres ist keine Notlüge: Der
 * Dialog **ist** modal — der Fokus ist gefangen, die Abdunklung liegt über der
 * Anwendung, und dieselbe Zusicherung stand hier schon vor T-152. Zurückgelegt
 * wird ausschließlich das Aushängen des übrigen Baums.
 *
 * **Was dabei ebenfalls zurückbleibt, und warum es hier folgenlos ist**
 * (T-155, Befund O-CS): Mit `modal` fallen auch `preventScroll` und
 * `pointerBlocking` weg. Der Seitenbildlauf ist trotzdem gesperrt, weil das
 * Fenster gar keinen hat: `base.css:49-53` bindet `html`, `body` und `#root`
 * auf volle Höhe, und `.app` steht in `app.css:90` auf `overflow: hidden` —
 * die Anwendung scrollt in ihren Flächen, nicht im Fenster. Und die Zeigersperre
 * ist entbehrlich, weil `.scrim` als eigene, deckende Fläche über der
 * Anwendung liegt und die Klicks selbst abfängt. Beides war bis T-157
 * ungenannt, und ungenannte Nebenwirkungen sind die, die beim nächsten Umbau
 * überraschen. Wer `app.css:90` ändert, ändert damit auch diese Zusage.
 *
 * Was der Verzicht auf `modal` **nicht** kostet: Die Ebenenverwaltung
 * (`layerStack`) hängt nicht daran. Ein Escape in einer offenen Liste trifft
 * weiterhin nur die Liste, weil `onEscapeKeyDown` nur für die oberste Ebene
 * feuert — der frühere Notbehelf auf `event.defaultPrevented` ist damit
 * ersatzlos entfallen.
 *
 * ===========================================================================
 * Kein `Dialog.Positioner`, kein `Dialog.Backdrop`
 * ===========================================================================
 *
 * Ark UI böte für die Abdunklung zwei eigene Bausteine an. Beide zeichnen aber
 * eigene Elemente mit eigenen Inline-Stilen — der Positionierer setzt ohne
 * `modal` unbedingt `pointer-events: none`, und damit fielen Klicks auf die
 * Abdunklung **durch** auf die Anwendung dahinter. `.scrim` bleibt deshalb
 * unser eigenes `<div>`, genau wie vorher: eine Klasse, ein Element, kein
 * Inline-Stil, und `page.locator('.scrim')` zählt beim Schließen wieder null.
 *
 * ===========================================================================
 * Die Rückholung des Fokus — und warum die Fokusfalle sie nicht trägt
 * ===========================================================================
 *
 * T-152 hat `recoverFocus` gestrichen, mit der Begründung, die Fokusfalle von
 * Ark UI setze den Fokus in genau diesem Fall selbst zurück. **Das war zu
 * früh** (T-155 O-CS, bestätigt von T-153 O-CX). Der Grund steht im Quelltext
 * von `@zag-js/focus-trap`, in `setupMutationObserver`:
 *
 * ```js
 * removedNodes.some((node) => node === this.state.mostRecentlyFocusedNode)
 * ```
 *
 * Verglichen wird **per Identität** mit dem entfernten Knoten selbst. Die
 * Rückholung greift also nur, wenn React genau den fokussierten Knopf
 * ausbaut — und nicht, wenn er als **Nachfahre** eines größeren Stücks
 * verschwindet.
 *
 * **Welche Fälle sie heute tragen** (T-162, Befund O-DK). Der Anlaßfall, der
 * hier bis T-161 stand, ist keiner mehr: Im Dialog „Spalten des Boards"
 * schließt „Als Spalte aufnehmen" seit T-102 den ganzen Dialog **vor** der
 * Wirkung (`BoardScreen.tsx`, Kommentar an `onAdopt`/`onRemove`), damit der
 * Rückweg im Toast für Tastatur und Vorlesehilfe erreichbar ist. Der Knopf
 * verschwindet dort also nicht mehr unter dem Zeiger, und T-161 hat das im
 * Browser bestätigt. Ein Wächter mit einem Anlaß, den es nicht mehr gibt, wird
 * beim nächsten Aufräumen gestrichen; hier stehen deshalb die zwei Fälle, die
 * gemessen sind:
 *
 *  - **`MutationObserver`: `PoolFormDialog`, Kombobox „Erforderliche Tags".**
 *    Wird der letzte Tag über seinen Entfernen-Knopf ausgetragen, baut React
 *    die ganze Chipliste neu, und der Fokus lag auf einem Knopf darin — als
 *    Nachfahre, nicht als der entfernte Knoten selbst. Ohne diese Hälfte fiele
 *    `document.activeElement` auf `<body>` (T-153, gegengemessen in T-161
 *    Punkt 1).
 *  - **`focusout` an der Abdunklung: der Knopf sperrt sich durch seine eigene
 *    Wirkung.** `FormDialog` setzt `loading={busy}` an „Speichern"/„Anlegen",
 *    und `Button` macht daraus `disabled` (`Primitives.tsx`). Wer mit der
 *    Tastatur abschickt, steht auf genau diesem Knopf, wenn er gesperrt wird;
 *    entfernt wird dabei **nichts**, der Beobachter oben sieht also nichts.
 *    Der Fokus fällt auf `<body>`, und der `focusout` mit
 *    `relatedTarget === null` ist der einzige Anlaß, der davon erfährt.
 *    Derselbe Weg trägt `UpdateDialog`, wo sich alle Knöpfe zugleich sperren.
 *
 * Was **nicht** zurückkommt, ist die schlimmste Folge von damals: Escape und
 * Tabulator hängen seit T-152 am Dokument und nicht mehr am `.scrim`, ein
 * Dialog wird also auch ohne Rückholung nicht zur Sackgasse. Was bleibt, ist
 * der hörbare Kontextverlust für eine Vorlesehilfe — sie liest den
 * Dokumenttitel an, statt im Formular zu bleiben.
 *
 * Zurückgeholt wird **nur**, wenn der Fokus ins Nichts gefallen ist — `null`
 * oder `<body>`. Nicht, wenn er bloß außerhalb des Kastens steht: Die
 * aufgeklappte Liste jedes Auswahlfeldes hängt im Portal am Dokumentkörper und
 * ist damit außerhalb. Wer dort zugriffe, risse dem Benutzer die Auswahl unter
 * den Fingern weg.
 *
 * ===========================================================================
 * Wohin der Fokus **nach** dem Schließen geht — der Dialog merkt sich seinen
 * Auslöser (T-162, Befund O-CY-2)
 * ===========================================================================
 *
 * Die Fokusfalle merkt sich beim Scharfstellen, was gerade den Fokus trägt
 * (`nodeFocusedBeforeActivation`), und gibt ihn beim Schließen dorthin zurück.
 * Das Scharfstellen liegt aber **ein Bild später** als das Öffnen — und in
 * dieser Lücke greift das Menü noch einmal selbst am Fokus an.
 *
 * Der gemessene Ablauf beim Weg über ein Zeilenmenü: `Menu` setzt den Fokus
 * auf seinen Auslöser, bevor die Aktion läuft (siehe `Menu.tsx`); die Aktion
 * öffnet den Dialog; ein von `@zag-js/menu` bereits vorgemerkter
 * `requestAnimationFrame` (`focusMenu`, ausgelöst von der letzten
 * Pfeiltaste oder Zeigerbewegung im Menü) zieht den Fokus auf den Menükasten
 * zurück, weil er inzwischen außerhalb steht; der Menükasten verschwindet
 * gleich darauf, und der Fokus fällt auf `<body>`. **Erst danach** stellt die
 * Fokusfalle scharf und merkt sich `<body>`. Escape gab den Fokus deshalb an
 * `<body>` zurück, gemessen im Browser (T-161 Punkt 2, T-162 Abschnitt 1).
 *
 * Ein Fokus **vor** der Aktion trägt also nicht — er wird überholt. Deshalb
 * hält dieser Baustein den Auslöser **fest**, statt sich auf den späteren
 * Stand zu verlassen: Im `useLayoutEffect` beim Öffnen (synchron im selben
 * Commit, also vor jedem `requestAnimationFrame`) wird
 * `document.activeElement` gemerkt und über `finalFocusEl` an die Fokusfalle
 * gereicht. `finalFocusEl` hat Vorrang vor `nodeFocusedBeforeActivation`
 * (`@zag-js/dialog`, `setReturnFocus`), und wer den Fokus danach noch
 * verschiebt, verschiebt das Ziel nicht mit.
 *
 * Für einen Dialog an einem gewöhnlichen Knopf ändert das nichts: Dort ist der
 * gemerkte Knoten derselbe, den die Fokusfalle ohnehin genommen hätte.
 * Verschwindet er, bis der Dialog schließt — die Zeile, deren Todo gerade
 * gelöscht wurde —, gibt `finalFocusEl` `null` zurück, und die Falle fällt auf
 * ihren eigenen Stand zurück.
 */
export interface DialogSurfaceProps {
  readonly open: boolean;
  /**
   * `alertdialog` für eine Frage, deren Antwort Folgen hat; sonst `dialog`.
   * Der Wert geht unverändert an `role` des Kastens.
   */
  readonly role?: "dialog" | "alertdialog";
  /** Klassen des Kastens. Das Aussehen kommt weiter aus diesem Bestand. */
  readonly className: string;
  /**
   * Jeder Weg hinaus, den die Zustandsmaschine kennt: Escape und der
   * Schließknopf. Ein Klick auf die Abdunklung gehört nicht dazu.
   */
  readonly onDismiss: () => void;
  /** Aus, solange ein Dialog arbeitet und Escape nichts abbrechen darf. */
  readonly closeOnEscape?: boolean;
  /**
   * Wählt das Element, das beim Öffnen den Fokus bekommt.
   *
   * Ohne Angabe nimmt die Zustandsmaschine das erste tabulierbare Element im
   * Kasten — dieselbe Wahl, die `focusFirstWithin` vorher getroffen hat. Wer
   * eine andere braucht (das erste Formularfeld, der Kasten selbst), sagt es
   * hier; `null` fällt auf die Voreinstellung zurück.
   */
  readonly initialFocus?: (content: HTMLElement) => HTMLElement | null;
  /**
   * Zugriff auf den Kasten, ausschliesslich zum Setzen des Fokus.
   *
   * Gebraucht an genau einer Stelle: Wenn sich **alle** Knoepfe eines Dialogs
   * durch ihre eigene Wirkung sperren, faellt der Fokus auf den
   * Dokumentkoerper. Die Fokusfalle merkt das nicht — sie beobachtet
   * entfernte, nicht gesperrte Elemente. Siehe `UpdateDialog`.
   */
  readonly contentRef?: RefObject<HTMLDivElement | null>;
  readonly children: ReactNode;
}

export function DialogSurface({
  open,
  role = "dialog",
  className,
  onDismiss,
  closeOnEscape = true,
  initialFocus,
  contentRef: externalRef,
  children,
}: DialogSurfaceProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  /*
    Die Wahl beim Öffnen ist zugleich die Wahl beim Zurückholen — sie steht
    deshalb in einem Halter und nicht in der Abhängigkeitsliste. `UpdateDialog`
    reicht sie als Pfeilfunktion herein; die ist bei jedem Zeichnen eine neue,
    und ein Beobachter, der sich deswegen neu anmeldet, hätte mit der Sache
    nichts zu tun.
  */
  const initialFocusRef = useRef(initialFocus);
  useEffect(() => {
    initialFocusRef.current = initialFocus;
  });

  /*
    Der Auslöser, der diesen Dialog geöffnet hat — festgehalten im selben
    Commit, in dem `open` wahr wird (siehe Kopf, Abschnitt O-CY-2).

    `useLayoutEffect` und nicht `useEffect`: Der Layout-Effekt läuft synchron im
    Commit und damit vor jedem `requestAnimationFrame`; ein passiver Effekt
    liegt in einer eigenen Runde des Planers und könnte den späteren Zugriff des
    Menüs bereits gesehen haben. Genau diese Reihenfolge ist der Punkt.
  */
  const openerRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    // `<body>` ist kein Auslöser, sondern die Abwesenheit eines Auslösers.
    openerRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    // Beim Schließen wird **nicht** geleert: `finalFocusEl` wird erst beim
    // Abschalten der Fokusfalle gelesen, und die läuft nach diesem Effekt.
  }, [open]);

  const recoveryTimer = useRef<number | null>(null);

  /**
   * Holt den Fokus in den Kasten zurück, wenn er ins Nichts gefallen ist.
   *
   * Die Prüfung steht in einem `setTimeout`, weil `document.activeElement`
   * während `focusout` noch das alte Element ist und der Browser den Fokus
   * nach einer Entfernung erst danach richtet. Ein zweiter Anlass in derselben
   * Runde verlängert den vorhandenen Zeitgeber, statt einen zweiten zu stellen.
   *
   * `document.hasFocus()` ist die Ausnahme, die bleiben muss: Wer zur
   * Nachbaranwendung wechselt, soll nicht zurückgerissen werden.
   */
  const recoverFocus = useCallback(() => {
    if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
    recoveryTimer.current = window.setTimeout(() => {
      recoveryTimer.current = null;
      if (!document.hasFocus()) return;
      const content = contentRef.current;
      if (content === null) return;
      const active = document.activeElement;
      // Nur „nirgendwo". Alles andere gehört jemandem — siehe Kopf.
      if (active !== null && active !== document.body) return;
      const chosen = initialFocusRef.current?.(content) ?? null;
      if (chosen !== null) {
        chosen.focus();
        return;
      }
      if (!focusFirstWithin(content)) content.focus();
    }, 0);
  }, []);

  /*
    Der zweite Anlass: jede Änderung im Kasten. Verglichen wird **kein** Knoten
    — gefragt wird nach dem Fokus. Das ist der Unterschied zur Rückholung der
    Fokusfalle und der ganze Grund, warum diese hier steht.

    Beobachtet wird ausschließlich `childList`; ein `focus()` löst davon nichts
    aus, es gibt also keine Schleife.
  */
  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (content === null) return;
    const observer = new MutationObserver(recoverFocus);
    observer.observe(content, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (recoveryTimer.current !== null) {
        window.clearTimeout(recoveryTimer.current);
        recoveryTimer.current = null;
      }
    };
  }, [open, recoverFocus]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onDismiss();
      }}
      role={role}
      /* Siehe Kopf dieser Datei — die vier Schalter einzeln statt in einem. */
      modal={false}
      trapFocus
      closeOnInteractOutside={false}
      closeOnEscape={closeOnEscape}
      /*
        Das Ziel der Rückgabe. Wird beim Abschalten der Fokusfalle gerufen,
        nicht beim Zeichnen. `null` heißt „habe keins" — `@zag-js/dialog` fällt
        dann auf seinen eigenen Stand zurück, statt zu werfen.
      */
      finalFocusEl={() => {
        const opener = openerRef.current;
        return opener !== null && opener.isConnected ? opener : null;
      }}
      {...(initialFocus === undefined
        ? {}
        : {
            initialFocusEl: () => {
              const content = contentRef.current;
              return content === null ? null : initialFocus(content);
            },
          })}
    >
      {/*
        Der Kasten hängt am eigenen `open` und nicht an `lazyMount`.

        Der Grund ist die Abdunklung: Sie ist unser `<div>` und kennt die
        Anwesenheitsverwaltung von Ark UI nicht. Stünde sie, während der Dialog
        zu ist, läge eine dunkle Fläche über der ganzen Anwendung. Der Zweig
        hier nimmt beides zusammen weg, und die Zustandsmaschine bleibt
        trotzdem stehen — sie hängt an `Dialog.Root`, nicht am Kasten.
      */}
      {open ? (
        /*
          `onBlur` ist in React der **aufsteigende** `focusout` — der Weg aus
          T-072. Er greift auch dann, wenn nichts entfernt wurde, etwa wenn
          sich ein Knopf durch seine eigene Wirkung sperrt.
        */
        <div
          className="scrim"
          onBlur={(event) => {
            // `null` heißt: Der Fokus ging **nirgendwohin**. Ging er an ein
            // anderes Element, gehört er dorthin.
            if (event.relatedTarget === null) recoverFocus();
          }}
        >
          <Dialog.Content
            ref={(node) => {
              contentRef.current = node;
              if (externalRef !== undefined) externalRef.current = node;
            }}
            className={className}
            aria-modal="true"
          >
            {children}
          </Dialog.Content>
        </div>
      ) : null}
    </Dialog.Root>
  );
}
