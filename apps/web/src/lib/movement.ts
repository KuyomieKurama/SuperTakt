import { poolMovementSentence } from "@takt/domain";
import type { PoolMovement } from "../api/types";

/**
 * Takt — der Bewegungssatz, an einer Stelle angelegt (E-058, E-060).
 *
 * ---------------------------------------------------------------------------
 * Was hier steht und was ausdrücklich nicht
 * ---------------------------------------------------------------------------
 *
 * **Kein Wortlaut.** Der Satz kommt Zeichen für Zeichen aus
 * `poolMovementSentence` in `@takt/domain` — derselben Funktion, die der
 * Aufgabenbereich des Add-ins aufruft. Hier steht ausschließlich, *welcher der
 * beiden Anlässe* zu welcher Handlung gehört und wie ein `null` behandelt wird.
 * Ein Satzbaustein in dieser Datei wäre die fünfte Abschrift eines Textes,
 * dessen Zeichengleichheit `proof:addin` bewacht.
 *
 * Bis T-102 stand die Zuordnung an vier Stellen: zweimal in `TimerContext`
 * (Stopp, verwaiste Buchung) und — seit E-060 — an drei Flächen, die „Erledigt"
 * umlegen (Board, Todo-Liste, Detailansicht). Seit T-108 wäre der Buchungsdialog
 * die fünfte. Fünf Stellen wären fünf Gelegenheiten, den Anlaß zu verwechseln,
 * und die Verwechslung ist still: Der falsche Anlaß liefert einen
 * wohlgeformten, falschen Satz.
 *
 * ---------------------------------------------------------------------------
 * Die Zuordnung, einmal ausgeschrieben
 * ---------------------------------------------------------------------------
 *
 * | Handlung | Anlaß | Warum |
 * |---|---|---|
 * | Timerstart, der „Erledigt" aufhebt | `'reopen'` | Das Todo kehrt zurück (A-2.5) |
 * | Timerstart ohne Aufhebung | `'booking'` | Erste abgeschlossene Buchung |
 * | Stopp, verwaiste Buchung | `'booking'` | Die Buchung setzt „hat offene Buchungen" |
 * | `POST /time-entries` | `'booking'` | Die Buchung von Hand kann die erste sein (O-V) |
 * | `DELETE /todos/{id}/done` | `'reopen'` | Aufheben von Hand, „wieder" stimmt |
 * | `PUT /todos/{id}/done` | `'booking'` | Neutrale Form, kein Wort von Buchung (E-060) |
 *
 * `'booking'` heißt also **nicht** „hier wurde gebucht", sondern „hier ist
 * keine Rückkehr". E-060 Punkt 3 hat den Namen ausdrücklich stehen lassen: Ein
 * treffenderer kostete fünf Hoheiten und gewänne nichts, was diese Tabelle
 * nicht auch sagt.
 */

/**
 * Der Satz zu einer Bewegung — oder `null`, wenn es keinen gibt.
 *
 * Zwei Wege führen zu `null`, und beide bedeuten für die Anzeige dasselbe: Der
 * Dienst hat nichts gerechnet (`movement === null`), oder er hat gerechnet und
 * nichts gefunden (`poolMovementSentence` gibt bei `'booking'` ohne Zu- und
 * Abgang `null`). In beiden Fällen steht **kein** Satz da — kein leerer Absatz,
 * kein Rumpf mit null Zeichen und keine Beruhigung, die niemand geprüft hat.
 */
export function movementSentence(
  movement: PoolMovement | null,
  occasion: "reopen" | "booking",
): string | null {
  return movement === null ? null : poolMovementSentence(movement, "past", occasion);
}

/**
 * Der Satz nach dem Setzen oder Aufheben von „Erledigt" (E-060 Punkt 4).
 *
 * `cleared` ist wahr, wenn das Kennzeichen **aufgehoben** wurde — also für
 * `DELETE /todos/{id}/done` und für den Timerstart auf einem erledigten Todo.
 * Der Aufrufer gibt damit die Handlung an und nicht den Anlaß; welcher Anlaß
 * daraus folgt, entscheidet diese Datei.
 */
export function doneMovementSentence(
  movement: PoolMovement | null,
  cleared: boolean,
): string | null {
  return movementSentence(movement, cleared ? "reopen" : "booking");
}

/**
 * Der Satz zu einer **Buchung** — Stopp, verwaiste Buchung und Buchung von Hand
 * (E-058 Punkt 6, O-V).
 *
 * Der Anlaß steht hier fest und wird nicht durchgereicht: Keine dieser drei
 * Handlungen hebt „Erledigt" auf, das tut allein der Timerstart (A-2.5). Alle
 * drei Antworten, die diese Funktion versorgen, berichten deshalb ausnahmslos
 * von einer Buchung.
 *
 * Die dritte ist seit T-108 dabei: `POST /time-entries`, die Buchung von Hand
 * aus `screens/BookingDialogs.tsx`. Der Dienst rechnet sie nach derselben
 * Rechnung wie den Stopp (`closedEntryMovementStates`) — die Begründung steht
 * an `CreateTimeEntryResult` in `api/types.ts`.
 */
export function bookingSentence(movement: PoolMovement | null): string | null {
  return movementSentence(movement, "booking");
}

/**
 * Hängt den Bewegungssatz an einen Rumpf — oder läßt ihn weg.
 *
 * Ein Leerzeichen, dann der Satz aus `@takt/domain`, unverändert. Damit sehen
 * der Satz nach dem Start, der nach dem Stopp und der nach „Erledigt" gleich
 * aus, und der Wortlaut bleibt zeichengleich mit dem, den der Aufgabenbereich
 * des Add-ins zeigt.
 */
export function withMovement(body: string, sentence: string | null): string {
  return sentence === null ? body : `${body} ${sentence}`;
}
