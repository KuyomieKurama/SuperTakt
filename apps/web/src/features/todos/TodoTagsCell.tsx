import { useCallback, useEffect, useRef, useState } from "react";
import { Popover } from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";
import type { ForeignText } from "../../api/types";
import { formatCount, plural } from "../../lib/format";
import { TagChip } from "../../shared/ui/Tag";

/**
 * Takt — die Tag-Zelle der Todo-Tabelle und die Fläche dahinter
 * (A-25.9, `docs/design/todo-tabelle-fluss.md` 5 und 6,
 * `docs/design/todo-tabelle.md` 5, T-366 B-4 und B-5).
 *
 * ===========================================================================
 * Was in der Zelle steht: die Zahl, und sie kommt aus dem Todo
 * ===========================================================================
 *
 * Sichtbar bleibt **die Zahl der Tags**, nicht die erste Marke und nicht
 * nichts. Eine Marke wäre so breit wie ihr Name — eine Tabellenspalte, deren
 * Breite an den Daten hängt, ist keine Spalte —, und sie behauptete eine
 * Rangfolge, die es nicht gibt: Die Reihenfolge von `todo.tagIds` ist die
 * Speicherreihenfolge. Nichts zu zeigen wäre der stille Verlust einer Angabe.
 *
 * **Die Zahl ist `todo.tagIds.length` und nicht die Zahl der aufgelösten
 * Marken.** Das behebt einen stillen Fall: Steht der Strukturbestand auf
 * `loading` oder `error`, löste die alte Zeile keine einzige Kennung auf und
 * sah aus wie ein Todo ohne Tags. Der Zähler stimmt jetzt immer; eine nicht
 * auflösbare Kennung steht in der Fläche als „Unbekannt" — derselbe Ersatz,
 * den der Filterchip der Ansicht schon benutzt.
 *
 * **Ohne Tags gibt es keinen Auslöser und keine leere Fläche.** Eine Null ist
 * eine Behauptung, wo nichts zu sagen ist; eine Fläche, die aufgeht und „keine
 * Tags" sagt, ist eine Handlung, um nichts zu erfahren.
 *
 * ===========================================================================
 * Warum ein Popover und weder HoverCard noch Tooltip (T-366 B-4)
 * ===========================================================================
 *
 * Gemessen am installierten Paket (`@ark-ui/react@5.39.0`,
 * `@zag-js/popover@1.43.3`): `HoverCard` **liegt** vor, aber sein Inhalt trägt
 * `tabIndex: -1` ohne Weg hinein, und `TRIGGER_BLUR` schließt ihn, sobald der
 * Auslöser den Fokus verliert. Damit wären der Zustand „offen durch Absicht",
 * der Tabulatorausgang aus der Fläche und der innere Bildlauf mit `Bild ab`
 * unerreichbar — und A-25.9 verlangt ausdrücklich, daß die Fläche den
 * Tastaturfokus **annimmt**. `Tooltip` ist derselbe Fall, zusätzlich mit dem
 * falschen Muster (`aria-describedby` statt `aria-controls`).
 *
 * Der nicht-modale Popover bringt genau das Fehlende mit: fokussierbarer
 * Inhalt, `aria-expanded` und `aria-controls` am Auslöser, `Escape` als
 * Abweisung, Tabulator aus der Fläche heraus über `proxyTabFocus`. Er bringt
 * **nicht** mit: das Aufgehen beim Überfahren. Das sind die zwei Zeitgeber
 * unten — und sie öffnen und schließen, sie schließen nie eine **offene**
 * Fläche von selbst (SC 1.4.13 „beständig").
 *
 * Portal am Dokumentkörper, `.popover-layer`, `--z-popover` — dieselbe Form
 * wie Auswahlfeld, Menü, Tag-Eingabe und Hinweisfläche (E-052, E-116). Sie ist
 * hier keine Bequemlichkeit: `.table-wrap` läuft auf **beiden** Achsen, eine
 * Fläche darin wäre nicht bloß falsch verankert, sondern abgeschnitten.
 *
 * ===========================================================================
 * Fokus und Zeiger — wer was steuert
 * ===========================================================================
 *
 * Die Fläche geht auf **zwei** Wegen auf, und nur auf einem davon darf der
 * Fokus wandern: Wer mit dem Zeiger darüberfährt, hat ihn nicht verlangt.
 * Deshalb ist `autoFocus` aus und der Fokus wird hier von Hand hineingesetzt —
 * die Eigenschaft kennt den Weg nicht, über den aufgegangen wurde. Für den
 * Rückweg trägt `restoreFocus` den Modus (`intent`), weil Ark UI dabei noch
 * etwas kann, was hier von Hand teuer wäre: die Hand wegnehmen, wenn ein
 * Tabulator den Fokus schon weitergereicht hat.
 */

/** Ein Tag, wie die Fläche ihn zeigt: Name und Ordnerpfad, beides fremd. */
export interface TodoTagLabel {
  readonly name: ForeignText;
  /** Ordnerpfad ohne den Tag selbst, zum Beispiel ["Kunden", "Nord"]. */
  readonly path: readonly string[];
}

export interface TodoTagsCellProps {
  /** `todo.tagIds.length` — nicht die Zahl der aufgelösten Marken. */
  readonly count: number;
  readonly tags: readonly TodoTagLabel[];
  /**
   * Genau eine Fläche ist in der Ansicht offen. Der Zustand liegt deshalb in
   * der Tabelle und nicht in der Zelle: Ein zweiter Auslöser schließt die
   * erste, ohne daß sich die Zellen kennen müssen.
   */
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * Absichtsverzögerung und Nachlauf.
 *
 * Das Aufgehen wartet, damit ein Zeiger, der die Spalte nur überquert, keine
 * Fläche hinterläßt. Der Nachlauf überbrückt die Lücke zwischen Auslöser und
 * Fläche — das ist SC 1.4.13 „überfahrbar", und ohne ihn schlösse sie genau in
 * dem Augenblick, in dem der Zeiger sie erreichen will.
 *
 * Keines der beiden Designpapiere nennt Zahlen (T-366 N-5). Sie sind an der
 * vorhandenen Hinweisfläche ausgerichtet (`InfoHint`: 150/100) und etwas
 * ruhiger gewählt, weil hier eine ganze Spalte voller Auslöser steht.
 */
const OPEN_DELAY_MS = 220;
const CLOSE_DELAY_MS = 220;

type SurfaceMode = "pointer" | "intent";

export function TodoTagsCell({ count, tags, open, onOpenChange }: TodoTagsCellProps) {
  const [mode, setMode] = useState<SurfaceMode>("pointer");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  /* Zugehen; der Zeigerweg räumt dabei seine Zeitgeber ab. */
  const close = useCallback(() => {
    clearTimer();
    onOpenChange(false);
  }, [clearTimer, onOpenChange]);

  /*
    Der Zeiger öffnet nach der Absichtsverzögerung und schließt nach dem
    Nachlauf — **beides nur, solange die Fläche nicht mit Absicht offen ist.**
    Wer sie verlangt hat, nimmt sie selbst wieder weg.
  */
  const pointerEnter = useCallback(
    (pointerType: string) => {
      if (pointerType === "touch") return;
      clearTimer();
      if (open) return;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setMode("pointer");
        onOpenChange(true);
      }, OPEN_DELAY_MS);
    },
    [clearTimer, onOpenChange, open],
  );

  const pointerLeave = useCallback(
    (pointerType: string) => {
      if (pointerType === "touch") return;
      clearTimer();
      if (!open || mode === "intent") return;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        onOpenChange(false);
      }, CLOSE_DELAY_MS);
    },
    [clearTimer, mode, onOpenChange, open],
  );

  /*
    Der Fokus wandert genau dann in die Fläche, wenn sie verlangt wurde —
    durch Eingabe, Leertaste, Klick oder Tippen. Erst dadurch laufen `Bild ab`,
    `Pos1` und `Ende` in ihr, und erst dadurch ist ein innerer Bildlauf keine
    Mausfläche.
  */
  useEffect(() => {
    if (!open || mode !== "intent") return;
    const focus = () => contentRef.current?.focus({ preventScroll: true });
    if (contentRef.current !== null) {
      focus();
      return;
    }
    const frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [mode, open]);

  /*
    Läuft der Bereich unter der Fläche, schließt sie (T-366 B-5). Die
    Gegenrichtung — stehenbleiben, während der Anker wegrollt — ist der eine
    Ausgang, den beide Papiere falsch nennen: Die Fläche stünde dann über dem
    klebenden Tabellenkopf und zeigte die Tags einer Zeile, die nicht mehr im
    Bild ist.

    Zwei Ausnahmen, und beide sind gemessen und nicht vorsorglich:

     1. Der **innere** Lauf der Fläche zählt nicht; sonst schlösse sie sich beim
        Lesen selbst.
     2. Gemessen wird die **Bewegung des Ankers**, nicht das bloße Eintreffen
        eines Bildlaufereignisses. Grund: Ein Klick auf einen Auslöser, der nur
        halb im Bild steht, rollt ihn zuerst hinein — und dieses Ereignis kommt
        erst im nächsten Bild an, also **nachdem** die Fläche aufgegangen ist.
        Ohne den Vergleich schlösse sie sich in genau dem Augenblick wieder, in
        dem sie aufgeht. Der Anker steht zum Zeitpunkt der Messung bereits an
        seinem Platz; ein solches Nachzüglerereignis bewegt ihn nicht mehr.
  */
  useEffect(() => {
    if (!open) return;
    const anchor = triggerRef.current;
    if (anchor === null) return;
    const start = anchor.getBoundingClientRect();
    const onScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && contentRef.current?.contains(target) === true) return;
      const now = anchor.getBoundingClientRect();
      if (Math.abs(now.top - start.top) < 1 && Math.abs(now.left - start.left) < 1) return;
      close();
    };
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [close, open]);

  if (count === 0) return null;

  const label = plural(count, "Tag", "Tags");

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => {
        /*
          Aufgehen meldet der Baustein nur für **eine** Ursache: die Betätigung
          des Knopfes — Klick, Eingabe, Leertaste, Tippen. Er geht bei bloßem
          Fokus ausdrücklich nicht auf; wer mit dem Tabulator durch hundert
          Zeilen geht, soll nicht hundert Flächen aufgehen sehen. Der zweite
          Weg hinein ist der Zeiger, und den führen die Zeitgeber oben.

          Zugehen darf der Baustein ganz: `Escape`, ein Klick nach draußen und
          der Tabulator aus der Fläche heraus laufen über seine Abweisung.
        */
        if (details.open) {
          clearTimer();
          onOpenChange(true);
          return;
        }
        close();
      }}
      modal={false}
      autoFocus={false}
      /*
        Zurück auf den Auslöser — aber nur, wenn die Fläche **verlangt** wurde.
        Wer sie nur überfahren hat, hat den Fokus nicht bewegt und bekommt ihn
        auch nicht bewegt. Ark UI nimmt dabei außerdem die Hand weg, wenn ein
        Tabulator die Fläche verlassen und den Fokus schon weitergereicht hat —
        ihn dort wieder wegzuziehen wäre eine Tastatursperre.
      */
      restoreFocus={mode === "intent"}
      /*
        Gemessen und nicht vermutet: Ohne diese beiden Angaben zeichnet Ark UI
        den Inhalt **von Anfang an** und versteckt ihn nur (`hidden`). Bei
        hundert Zeilen stünden damit hundert verborgene Flächen samt aller
        Marken im Baum — und `.tagsurface` wäre als Meßgröße wertlos, weil sie
        immer da ist. Mit `lazyMount` entsteht sie beim ersten Aufgehen und mit
        `unmountOnExit` verschwindet sie beim Zugehen wieder.
      */
      lazyMount
      unmountOnExit
      positioning={{ placement: "bottom-end", gutter: 4, overflowPadding: 8 }}
    >
      <Popover.Trigger
        ref={triggerRef}
        className="todo-tags__trigger"
        aria-label={label}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          setMode("intent");
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          setMode("intent");
        }}
        onPointerEnter={(event) => pointerEnter(event.pointerType)}
        onPointerLeave={(event) => pointerLeave(event.pointerType)}
      >
        <span aria-hidden>{formatCount(count)}</span>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner className="popover-layer">
          <Popover.Content
            ref={contentRef}
            className="tagsurface"
            aria-label={label}
            onPointerEnter={(event) => pointerEnter(event.pointerType)}
            onPointerLeave={(event) => pointerLeave(event.pointerType)}
          >
            {tags.map((tag, index) => (
              /*
                Name und Pfad sind fremder Text und laufen deshalb über
                `TagChip` — ein `path.join(" / ")` an dieser Stelle wäre
                fremder Text ohne Behandlung (E-063, T-124).

                `size="md"` und nicht `sm`: In der dichten Größe zeigt der Chip
                nur den **letzten** Ordner. Hier ist der Platz da, und A-4.4
                verlangt genau das — „Nord" aus „Kunden / Nord" muß von „Nord"
                aus „Standorte / Nord" zu unterscheiden sein.
              */
              <TagChip key={`${tag.name}-${String(index)}`} label={tag.name} path={tag.path} size="md" />
            ))}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
