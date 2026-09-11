import type { ForeignText } from "../../api/types";
import type { DayGroupInsight } from "../../app/dayGroup";
import type { ToastTone } from "../../app/ToastContext";
import { formatDuration, formatQuarters } from "../../lib/format";
import { withMovement } from "../../lib/movement";
import { quotedName } from "../../lib/foreign";

export interface StopMessage {
  readonly tone: ToastTone;
  readonly title: string;
  readonly body: string;
}

/**
 * Was der Stopp gebucht hat — und wohin die Buchung das Todo bewegt hat
 * (E-058 Punkt 6, T-097).
 *
 * ## Ein Toast, fünf Rümpfe, ein Anhang
 *
 * Welcher Rumpf gilt, entscheidet die Exportvorschau des Tages; sie ist der
 * einzige Grund, warum diese Funktion überhaupt wartet. Der Bewegungssatz
 * hängt an **allen** fünf: Ob die Vorschau geantwortet hat, ändert nichts
 * daran, wo die Karte jetzt steht. Deshalb wird der Rumpf erst gebildet und
 * dann **an einer Stelle** ergänzt — fünf Anhängestellen wären fünf
 * Gelegenheiten, eine zu vergessen.
 *
 * ## Warum der Satz überhaupt hierher gehört
 *
 * Die **erste abgeschlossene Buchung** eines Todos setzt „hat offene
 * Buchungen", und jede Regel mit `exportState: 'open'` — „was habe ich noch
 * nicht abgerechnet" — nimmt das Todo damit auf. Bis T-097 sagte die
 * Oberfläche das nur am Start (T-094, O-G). Am Start entsteht die erste
 * Buchung aber nur in dem Sonderfall, in dem er einen Timer **desselben**
 * Todos verdrängt; der Regelweg dorthin ist dieser hier.
 */
export function stopMessage(
  insight: DayGroupInsight | null,
  todoTitle: ForeignText,
  durationSeconds: number,
  movementSentence: string | null,
): StopMessage {
  const booked = `Gebucht: ${formatDuration(durationSeconds)}.`;
  /*
    Der Name im Titel, nicht im Satz (W-5 aus R-2a).

    Der Bewegungssatz beginnt mit „Es" und nennt das Todo nicht — er kommt
    zeichengleich aus `@takt/domain` und wird gegen das Add-in gemessen; an
    ihm ist nichts zu ändern. Ohne einen Bezug darüber stand das „Es"
    allein, und beim Wechsel nach A-6.8 standen **zwei** Meldungen
    übereinander, die beide mit „Es" begannen und verschiedene Todos
    meinten. Der Aufgabenbereich des Add-ins hat diese Frage an beiden
    eigenen Flächen mit einem Rahmen beantwortet; hier ist es derselbe
    Rahmen — der Titel nennt das Todo, der Rumpf sagt, was mit ihm
    geschehen ist.
  */
  const on = `Zeit gebucht auf ${quotedName(todoTitle)}`;

  const message = ((): StopMessage => {
    if (insight === null) return { tone: "success", title: `${on}.`, body: booked };
    /*
      Die Vorschau hat nicht geantwortet. Gebucht ist trotzdem — das steht
      zuerst da. Was daraus beim Export wird, weiss Takt gerade nicht, und
      dann steht das da statt eines Schweigens, das wie „nichts weiter zu
      sagen" aussieht (Befund aus T-044, `dayGroup.ts`).
    */
    if (insight.previewProblem !== null) {
      return {
        tone: "warning",
        title: `${on} — der Exportwert ließ sich nicht abfragen.`,
        body: `${booked} Was diese Tagesgruppe beim Export ergibt, konnte SuperTakt gerade nicht ermitteln: ${insight.previewProblem} Die erfasste Zeit steht fest; der gerundete Wert steht in der Export-Ansicht.`,
      };
    }
    if (insight.blockedReason !== null) {
      return {
        tone: "warning",
        title: `${on} — aber noch nicht abrechenbar.`,
        body: `${booked} Für diesen Tag steht auf diesem Todo noch keine Leistung. Ohne sie bleibt die Tagesgruppe (${formatDuration(insight.seconds)}) beim Export stehen.`,
      };
    }
    if (insight.quarters === null) return { tone: "success", title: `${on}.`, body: booked };
    return {
      tone: "success",
      title: `${on}.`,
      body: `${booked} An diesem Tag sind für dieses Todo ${formatDuration(insight.seconds)} offen — das ergibt beim Export ${formatQuarters(insight.quarters)}.`,
    };
  })();

  return { ...message, body: withMovement(message.body, movementSentence) };
}
