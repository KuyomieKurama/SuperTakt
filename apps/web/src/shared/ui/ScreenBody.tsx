import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

/**
 * Takt — der Laufbereich einer Ansicht (T-326, E-112).
 *
 * ===========================================================================
 * Der Vertrag
 * ===========================================================================
 *
 * Jede Ansicht hat einen festen Teil und **genau einen** Laufbereich:
 *
 * ```
 * <section class="screen">
 *   <ScreenHeader …/>            fest — Titel, Reiter, Filterleiste
 *   <div class="screen__bar">…   fest, 0..n — eine Leiste, die T-322 stehenlaesst
 *   <ScreenBody label="…">…      laeuft — genau einer, immer das letzte Kind
 * </section>
 * ```
 *
 * Die Naht liegt **unter dem, was die Auswahl steuert**: Was sagt, wo man ist
 * und welche Teilmenge man sieht, steht. Was die Teilmenge *ist*, laeuft. Wer
 * eine neue Ansicht baut, zieht die Naht an dieser Frage und nicht an der
 * Optik (E-112 Satz 1).
 *
 * Drei Ansichten brauchen einen Rahmen statt eines Laeufers, weil in ihnen
 * eine feste Spalte oder ein waagerechter Lauf neben dem senkrechten steht:
 * die Zeiterfassung (zwei Laufspalten nebeneinander), die Einstellungen (feste
 * Bereichsschiene) und das Kanban (Lauf waagerecht). Sie nehmen
 * {@link ScreenFrame} und darin {@link RunArea}.
 *
 * ===========================================================================
 * Warum die Sprungmarke hier haengt und nicht mehr an `.app__main`
 * ===========================================================================
 *
 * Bis T-326 trug `.app__main` `id="inhalt"` und `tabIndex={-1}`, und weil
 * `.app__main` der Laeufer war, rollte Bild-ab nach der Sprungmarke „Zum
 * Inhalt springen" den Inhalt. Laeuft das Kind, haette der Benutzer nach dem
 * Sprung den Fokus auf einem Kasten, der nichts zu rollen hat: **Bild-ab taete
 * nichts.** Das ist eine Verschlechterung gegenueber vorher und nicht
 * hinnehmbar (SC 2.1.1, T-323 Abschnitt 8.5). Die Marke wandert deshalb mit
 * dem Lauf.
 *
 * `<main class="app__main">` bleibt als Landmarke stehen; die Sprungmarke
 * landet darin statt darauf, was SC 2.4.1 genuegt. Der sichtbare Text „Zum
 * Inhalt springen" aendert sich nicht, und `href="#inhalt"` in `App.tsx`
 * bleibt woertlich.
 *
 * **Berichtigt in T-348 (T-344 8.5, A-25.5).** Der Satz oben war eine halbe
 * Regel: Er sagte „die Marke wandert mit dem Lauf" und wurde dann an einem
 * Kasten festgemacht, der den **Namen** `.screen__body` traegt, aber nicht
 * laeuft. `ScreenFrame` erbt von `.screen__body` alles bis auf genau die eine
 * Eigenschaft, die ihn zum Ziel der Marke machen wuerde. Gemessen (T-341 6,
 * Einstellungen, `scroll/klient`): 695/695, 775/775, 515/515 — der Rahmen
 * laeuft in keinem getragenen Fenster, und bei 1024 × 640 nur, weil dort der
 * E-115-Fehler steht. **Einen Tastaturweg auf einen Fehlerzustand zu stellen,
 * heisst, ihn zu brauchen.**
 *
 * Die Marke zeigt seither auf den **Inhaltshalt**: den innersten Kasten, der
 * den Inhalt traegt und in mindestens einer getragenen Fensterform eine eigene
 * Laufstrecke hat. Fuer die acht Regelansichten ist das unveraendert
 * `.screen__body`; in den Einstellungen die `RunArea` des Bereichs, in der
 * Zeiterfassung Laufbereich A, im Kanban `.board` — dort waagerecht.
 *
 * ===========================================================================
 * Warum `tabIndex={0}` und nicht `{-1}`
 * ===========================================================================
 *
 * Ein Laufbereich, der nur ueber die Sprungmarke fokussierbar ist, ist fuer
 * jeden erreichbar, der die Sprungmarke kennt — und fuer niemanden sonst. Bei
 * zwei Laufbereichen (Zeiterfassung) traegt die Marke ohnehin nur einer.
 * T-322 R-4 verlangt deshalb ausdruecklich: **jeder** Laufbereich liegt genau
 * einmal in der Tabulatorreihenfolge, unmittelbar vor seinem Inhalt, und
 * traegt einen zugaenglichen Namen. Der Preis sind ein bis zwei zusaetzliche
 * Tabulatorschritte je Ansicht; er ist dort bewusst in Kauf genommen (R-i),
 * weil der Gewinn — Bildlauf ohne Maus — groesser ist.
 *
 * **Der Name ist immer ein bereits vorhandener Text** (T-322 R-4, Abschnitt
 * 10): die Ueberschrift der Ansicht oder die Ueberschrift der Karte, in der
 * der Bereich liegt. Kein neuer Oberflaechentext, keine erfundene
 * Beschriftung.
 */

/**
 * Das Ziel der Sprungmarke. Genau **ein** Element im Dokument traegt es.
 *
 * Als Eigenwert und nicht als Zeichenkette an zwei Stellen: `App.tsx` schreibt
 * `href="#inhalt"`, und wer das eine aendert, ohne das andere zu finden, bricht
 * die Sprungmarke still.
 */
export const CONTENT_ANCHOR_ID = "inhalt";

/**
 * Die Merkmale eines Laufbereichs — fuer ein Element, das schon da ist.
 *
 * Gebraucht an genau einer Stelle: Die Buchungstabelle **ist** ihr eigener
 * Laufbereich (T-323 6.3), denn ein klebender Tabellenkopf klebt an dem
 * Bildlaufkasten, der ihm am naechsten ist, und das ist bei einer Tabelle
 * immer das `.table-wrap`. Dort kann kein Umschlag darum stehen; die Merkmale
 * gehen an die Flaeche selbst.
 */
export interface RunAreaSurface {
  readonly id?: string;
  readonly tabIndex: number;
  readonly role?: "region";
  readonly "aria-label"?: string;
}

/**
 * Ohne Namen kein Gebiet und kein Tabulatorhalt.
 *
 * Ein Gebiet ohne zugänglichen Namen ist keine Landmarke, und ein Tabulatorhalt
 * ohne Namen ist eine Station, die eine Vorlesehilfe nicht ansagen kann. Es
 * gibt genau **eine** Fläche, der kein vorhandener Text zur Verfügung steht:
 * der Lade- und Fehlerzustand der Todo-Detailansicht, weil deren Überschrift
 * das Todo **ist** und im Ladezustand noch nicht feststeht (T-322 4.3). Sie
 * bleibt Ziel der Sprungmarke (`tabIndex={-1}`) und läuft, aber sie behauptet
 * keinen Namen.
 */
export function runAreaSurface(label: string | undefined, anchor = false): RunAreaSurface {
  return {
    ...(anchor ? { id: CONTENT_ANCHOR_ID } : {}),
    ...(label === undefined ? {} : { role: "region" as const, "aria-label": label }),
    tabIndex: label === undefined ? -1 : 0,
  };
}

export interface ScreenBodyProps {
  /**
   * Der zugaengliche Name — ein **vorhandener** Text (siehe Dateikopf).
   * Die Zuordnung je Ansicht steht in `docs/design/fensterfeste-flaechen-fluss.md`
   * Abschnitt 4.
   */
  readonly label?: string;
  /**
   * Zusaetzliche Klassen der Laufflaeche. Zwei Werte kommen vor:
   * `table-wrap`, wenn der Laufbereich selbst die Tabellenflaeche ist, und
   * `screen__body--center`, wenn er einen Bildschirmleerzustand traegt und
   * ihn in seiner Mitte zeigt (T-322 R-5).
   */
  readonly className?: string;
  /**
   * Traegt dieser Bereich die Sprungmarke? Vorgabe **ja** — die Regelansicht
   * hat genau einen Laufbereich, und er ist das Ziel. Auf `false` steht es nur
   * bei einer zweiten {@link RunArea} neben einer ersten.
   */
  readonly anchor?: boolean;
  readonly children: ReactNode;
}

/** Der Laufbereich der Regelansicht: senkrechter Lauf, Stapel mit Abstand. */
export function ScreenBody({ label, className, anchor = true, children }: ScreenBodyProps) {
  return (
    <div className={cx("screen__body", className)} {...runAreaSurface(label, anchor)}>
      {children}
    </div>
  );
}

export interface ScreenFrameProps {
  /**
   * Der zugaengliche Name — und zugleich die Entscheidung ueber den
   * Tabulatorhalt.
   *
   * **Nur ein Rahmen, der in mindestens einer getragenen Fensterform selbst
   * laeuft, bekommt ihn** (T-344 8.5). Das ist genau einer: der
   * `--split`-Rahmen der Zeiterfassung, der unterhalb von 68 rem der einzige
   * senkrechte Laeufer der Ansicht ist. Die Rahmen der Einstellungen und des
   * Kanban laufen in **keiner** getragenen Form; sie lassen den Namen weg und
   * geben damit Halt und Rolle ab. Ein Halt ohne Laufstrecke ist eine Station,
   * die nichts tut — in den Einstellungen mit acht Verweisen dahinter.
   */
  readonly label?: string;
  /**
   * `screen__body--split`, wenn die Spalten darin bei ≤ 68 rem untereinander
   * fallen und aus zwei Laufbereichen einer wird (T-322 R-2). Genau eine
   * Ansicht braucht das: die Zeiterfassung.
   */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Der Rahmen einer Ansicht mit zwei Laufspalten, mit einer festen Spalte oder
 * mit waagerechtem Lauf. Er laeuft **nicht**; die Bereiche darin tun es.
 *
 * **Er traegt die Sprungmarke nicht mehr** (T-344 8.5, A-25.5). Bis T-348 stand
 * `id="inhalt"` hier — an einem Kasten, dessen ganzer Zweck es ist, nicht zu
 * laufen. Nach „Zum Inhalt springen" lag der Fokus in den drei Rahmenansichten
 * auf etwas, das nichts zu rollen hat, und der naechste Bildlaufvorfahr
 * (`.app__main`) ebenso: **Bild-ab tat nichts.** Die Marke sitzt jetzt am
 * Inhaltshalt der jeweiligen Ansicht — beim Bereich der Einstellungen, bei
 * Laufbereich A der Zeiterfassung, bei `.board` im Kanban.
 */
export function ScreenFrame({ label, className, children }: ScreenFrameProps) {
  return (
    <div
      className={cx("screen__body", "screen__body--frame", className)}
      {...(label === undefined ? {} : runAreaSurface(label))}
    >
      {children}
    </div>
  );
}

export interface RunAreaProps {
  readonly label: string;
  readonly className?: string;
  /**
   * Traegt dieser Bereich die Sprungmarke? Vorgabe **nein** — innerhalb eines
   * Rahmens gibt es mehrere Bereiche, und genau einer ist der Inhaltshalt.
   */
  readonly anchor?: boolean;
  readonly children: ReactNode;
}

/**
 * „Dieser Kasten nimmt den Rest und laeuft" — dieselbe Regelmenge wie
 * {@link ScreenBody}, an beliebiger Tiefe innerhalb eines {@link ScreenFrame}.
 */
export function RunArea({ label, className, anchor = false, children }: RunAreaProps) {
  return (
    <div className={cx("runarea", className)} {...runAreaSurface(label, anchor)}>
      {children}
    </div>
  );
}
