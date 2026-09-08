import { cx } from "../lib/cx";
import { deadlineState, type DueState } from "../lib/deadline";
import { formatCalendarDay } from "../lib/format";
import type { CalendarDay } from "../api/types";
import { Icon, type IconName } from "./Icon";

/**
 * Takt — die Frist an einer Zeile und auf einer Karte (A-19.2 bis A-19.6).
 *
 * ---------------------------------------------------------------------------
 * Die dritte Sorte Marke am Todo, und warum sie trägt
 * ---------------------------------------------------------------------------
 *
 * Am Todo hängen bereits zwei Markenfamilien: `DoneFlag` (erledigt / Erledigt
 * aufgehoben / offen) und der Exportstatus (`ExportStatusBadge`,
 * `ExportStatusMarker`, `ExportSummaryStrip`). Eine dritte trägt nur unter drei
 * Auflagen (T-144 Abschnitt 8.2), und alle drei stehen in diesem Baustein:
 *
 * 1. **Ein Element, nicht drei.** Kein eigener Baustein je Zustand; der Zustand
 *    bestimmt die **Lautstärke** desselben Elements. Angezeigt wird immer das
 *    Datum.
 * 2. **Abwesend, wenn keine Frist gesetzt ist.** Das ist der Unterschied zu
 *    `DoneFlag`, das nach Designsystem 3.4 *immer* dasteht, auch als „Offen".
 *    A-19.5 sagt es selbst: „Ein Todo ohne Frist hat keinen dieser Zustände."
 *    Es gibt deshalb keine Marke „ohne Frist" — und damit trägt die Mehrzahl
 *    der Karten weiterhin zwei Marken und nicht drei.
 * 3. **Nur zwei der drei Zustände sind laut.** „Später fällig" ist eine ruhige
 *    Datumsangabe ohne Zustandswort. Wäre sie es nicht, stünde die dritte Marke
 *    auf jedem Todo mit Frist voll sichtbar — der Punkt, an dem A-13.2 kippt.
 *    Dasselbe Mittel benutzt das Designsystem schon bei `DoneFlag`.
 *
 * ---------------------------------------------------------------------------
 * Sechs Merkmale, nur eines davon Farbe (SC 1.4.1)
 * ---------------------------------------------------------------------------
 *
 * |                  | überfällig        | heute fällig       | später fällig |
 * |------------------|-------------------|--------------------|---------------|
 * | Wortlaut         | „Überfällig"      | „Heute fällig"     | nur das Datum |
 * | Absolutes Datum  | immer dabei       | immer dabei        | ist der Text  |
 * | Symbol           | `alert-triangle`  | `calendar-clock`   | `calendar`    |
 * | Füllung          | voll gefüllt      | Kontur, kräftig    | keine Fläche  |
 * | Schriftschnitt   | halbfett          | halbfett           | normal        |
 * | Farbe            | Rot-Rampe         | Bernstein-Rampe    | Sekundärfarbe |
 *
 * Fünf der sechs tragen ohne Farbe. Die Graustufenprobe der Musterseite
 * bekommt den Fall deshalb mit — sie ist der Schalter, mit dem sich das in
 * einem Klick prüfen lässt.
 *
 * ---------------------------------------------------------------------------
 * Das absolute Datum steht **immer** im zugänglichen Namen
 * ---------------------------------------------------------------------------
 *
 * „Überfällig" allein ist für eine Vorlesehilfe zu wenig: Wer die Karte hört,
 * kann damit nicht planen. Der zugängliche Name nennt deshalb Zustand **und**
 * Datum — nicht nur das `title`, das eine Vorlesehilfe je nach Einstellung gar
 * nicht liest und das mit der Tastatur nicht erreichbar ist.
 *
 * ---------------------------------------------------------------------------
 * Kein fremder Text
 * ---------------------------------------------------------------------------
 *
 * Ein Kalendertag ist ein Kalendertag (Bedrohungsmodell 20.6). Er kommt in
 * fester Form aus dem Dienst, der ihn an seiner Tür geprüft hat — `YYYY-MM-DD`,
 * ein existierender Tag, Jahr zwischen 1970 und 2999 (Auflage A-A-19). Hier
 * steht deshalb kein `<Foreign>`: Der Aufruf behauptete eine Herkunft, die es
 * nicht gibt.
 */

const DEADLINE_ICON: Readonly<Record<Exclude<DueState, "no_due_date">, IconName>> = {
  overdue: "alert-triangle",
  due_today: "calendar-clock",
  due_later: "calendar",
};

/**
 * Das Zustandswort. `later` hat keines — A-19.5 **benennt** den Zustand und
 * verlangt nicht, ihn hinzuschreiben (T-144 Abschnitt 8.5).
 */
const DEADLINE_WORD: Readonly<Record<Exclude<DueState, "no_due_date">, string | null>> = {
  overdue: "Überfällig",
  due_today: "Heute fällig",
  due_later: null,
};

export interface DeadlineFlagProps {
  /** Der gespeicherte Tag. `null` heißt: keine Frist, und dann steht hier nichts. */
  readonly dueDate: CalendarDay | null;
  /**
   * Der heutige Tag im Tagesbegriff aus E-025.
   *
   * Er wird **hereingereicht** und nicht hier geholt: So gibt es je Ansicht
   * einen Zeitgeber auf die nächste Mitternacht (`useToday`) und nicht einen je
   * Zeile — und alle Zeilen einer Liste wechseln im selben Augenblick.
   */
  readonly today: CalendarDay;
  readonly className?: string;
}

export function DeadlineFlag({ dueDate, today, className }: DeadlineFlagProps) {
  const state = deadlineState(dueDate, today);
  if (state === "no_due_date" || dueDate === null) return null;

  const date = formatCalendarDay(dueDate);
  const word = DEADLINE_WORD[state];

  return (
    <span
      className={cx("deadline", `deadline--${state}`, className)}
      /*
        Das absolute Datum steht im zugänglichen Namen, nicht nur im Text.
        Bei „später fällig" ist der sichtbare Text bloß ein Datum — ohne das
        Wort „Frist" davor wäre für eine Vorlesehilfe nicht zu erkennen, wovon
        die Rede ist. Das Element ist kein Bedienelement; `role="img"` gibt ihm
        einen zusammenhängenden Namen, statt Symbol und Text getrennt zu melden.
      */
      role="img"
      aria-label={word === null ? `Frist: ${date}` : `${word} — Frist: ${date}`}
    >
      <Icon name={DEADLINE_ICON[state]} size={12} />
      {word === null ? null : <span className="deadline__word">{word}</span>}
      <span className="deadline__date tabular">{date}</span>
    </span>
  );
}
