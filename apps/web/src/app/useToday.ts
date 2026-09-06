import { useEffect, useState } from "react";

import type { CalendarDay } from "../api/types";
import { nextMidnightMs, todayForDueDates } from "../lib/deadline";

/**
 * Takt — welcher Tag heute ist, und wann die Oberfläche das neu beantwortet
 * (E-073 Punkt 2, A-19.5).
 *
 * ---------------------------------------------------------------------------
 * Das Loch, das hier geschlossen wird
 * ---------------------------------------------------------------------------
 *
 * E-070 Punkt 3 sagt, der Zustand einer Frist wird **gerechnet** und nicht
 * gespeichert — ein gespeicherter wäre über Nacht falsch. Das allein genügt
 * nicht: Wird er nur beim Zeichnen gerechnet, zeigt ein über Nacht offenes Takt
 * am Morgen weiterhin die Antwort von gestern. „Heute fällig" steht dann an
 * einem Todo, das seit Mitternacht überfällig ist — dieselbe Klasse Fehler, nur
 * eine Ebene höher (T-144, F-T144-1).
 *
 * ---------------------------------------------------------------------------
 * Zwei Anlässe, und keiner davon ist ein Minutentakt
 * ---------------------------------------------------------------------------
 *
 * 1. **Der Tageswechsel selbst.** Ein Zeitgeber auf die **nächste Mitternacht**
 *    der maßgeblichen Zeitzone, gestellt aus `calendarDayBounds` der Domäne
 *    (E-025). Er feuert einmal je Tag, genau an der Grenze, und stellt sich
 *    danach neu.
 *
 * 2. **Das Fenster wird wieder sichtbar** (`visibilitychange`). Ein
 *    Hintergrundreiter bekommt seine Zeitgeber gedrosselt, ein zugeklappter
 *    Rechner gar keine; wer am Morgen den Deckel aufmacht, hat die Mitternacht
 *    verschlafen. Dasselbe Signal und derselbe Grund wie in
 *    `useDataFreshness` (T-097).
 *
 * Ausdrücklich **nicht** ein Zeitgeber auf „alle 60 Sekunden". Er wäre die
 * naheliegende Antwort und die schlechtere: Er rechnet 1439 Mal umsonst und
 * trifft die Grenze trotzdem nur zufällig genau (E-073 Punkt 2, wörtlich).
 *
 * ---------------------------------------------------------------------------
 * Warum `setTimeout` und nicht `setInterval`
 * ---------------------------------------------------------------------------
 *
 * Weil der Abstand bis zur nächsten Mitternacht jeden Tag ein anderer ist — an
 * den beiden Umstellungstagen um eine Stunde. Ein fester Abstand liefe binnen
 * eines halben Jahres zweimal an der Grenze vorbei.
 *
 * **Und die Frist wird gedeckelt.** `setTimeout` schneidet einen Wert über
 * 2³¹−1 Millisekunden auf 32 Bit ab und feuert dann sofort — bei einer weit in
 * die Zukunft verstellten Systemuhr ergäbe das eine Schleife (dieselbe Falle,
 * die T-143 im Prüftakt der Versionsprüfung gefunden hat). Der Deckel liegt bei
 * einem Tag: Steht die Uhr falsch, wird eben einmal täglich neu gerechnet, und
 * das ist folgenlos.
 */

/** Obergrenze einer Wartezeit. Siehe den letzten Absatz oben. */
const MAX_DELAY_MS = 24 * 60 * 60 * 1_000;

/** Kleinster Abstand, damit ein um Millisekunden verfehlter Wechsel nicht rattert. */
const MIN_DELAY_MS = 1_000;

/**
 * Der heutige Kalendertag, der von selbst aktuell bleibt.
 *
 * Der Rückgabewert ändert sich genau dann, wenn sich der **Tag** ändert — nicht
 * bei jedem Zeichnen und nicht bei jedem Zeitgeber. Eine Ansicht, die ihn liest,
 * zeichnet deshalb nicht öfter neu als nötig.
 *
 * @param now Nur für Prüfläufe: der Zeitpunkt, den der Haken für „jetzt" hält.
 *   Ohne Argument die Systemuhr.
 */
export function useToday(now: () => Date = () => new Date()): CalendarDay {
  const [today, setToday] = useState<CalendarDay>(() => todayForDueDates(now()));

  useEffect(() => {
    let timer: number | null = null;

    const settle = (): void => {
      const current = todayForDueDates(now());
      // `setToday` mit demselben Wert löst kein Zeichnen aus — React vergleicht.
      setToday(current);

      const delay = nextMidnightMs(current) - now().getTime();
      const wait = Math.min(MAX_DELAY_MS, Math.max(MIN_DELAY_MS, delay));
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(settle, wait);
    };

    settle();

    const onVisibilityChange = (): void => {
      if (document.visibilityState !== "visible") return;
      settle();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // `now` ist über die Lebenszeit dieselbe Funktion; die Ansichten reichen
    // keine wechselnde herein. Sie steht trotzdem in der Liste, damit ein
    // Prüflauf sie austauschen kann, ohne dass der Haken es verschweigt.
  }, [now]);

  return today;
}
