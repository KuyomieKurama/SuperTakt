import { errorMessage } from "../api/client";
import { clearTodoDone } from "../api/endpoints";
import type { ForeignText, Id } from "../api/types";
import { doneMovementSentence, withMovement } from "../lib/movement";
import type { ToastAction, ToastApi } from "./ToastContext";
import { quotedName } from "../lib/foreign";

/**
 * Der Rückweg aus „Erledigt" — einmal, für alle drei Flächen (B-6 und B-7 aus
 * T-116, E-059, Abschnitt 15).
 *
 * ## Warum eine Fassung und nicht drei
 *
 * „Erledigt" wird an drei Stellen gesetzt: in der Todo-Liste (S-02), auf dem
 * Board (S-01) und in der Detailansicht (S-03). Bis T-118 bot **nur** die Liste
 * einen Rückweg an, und der war zugleich der einzige der Anwendung ohne
 * `catch`: Ein Fehlschlag war vollständig stumm — keine Meldung, kein Etikett,
 * kein Protokolleintrag, und einen globalen Auffänger für abgewiesene Zusagen
 * gibt es im Baum nicht.
 *
 * Beides ist derselbe Befund in zwei Richtungen: *Dieselbe Handlung, zwei
 * Schutzniveaus* lehrt den Benutzer, daß eines davon nichts bedeutet — genau
 * die Begründung, mit der E-059 den Bestätigungsdialog vor „Vom Board nehmen"
 * gestrichen hat. Deshalb steht der Rückweg jetzt an allen drei Flächen, und
 * zwar aus **einer** Funktion: Drei Abschriften wären drei Gelegenheiten, die
 * nächste Auflage nur an zweien nachzuziehen.
 *
 * ## Die Gegenrichtung braucht ihn nicht
 *
 * „Wieder offen" ist selbst schon die Rücknahme. Ein Rückweg aus einer
 * Rücknahme wäre ein Ring aus zwei Meldungen, die sich gegenseitig anbieten.
 *
 * ## Was der Rückweg **nicht** tut
 *
 * Er sagt nicht, ob das Todo damit wieder in der gerade sichtbaren Liste steht.
 * Das hängt an der Ansichtseinstellung „Erledigte einblenden", und deren Wert
 * kann zwischen dem Anzeigen der Meldung und dem Klick ein anderer geworden
 * sein. Lieber eine Auskunft weniger als eine, die zwei Sekunden alt ist.
 */
/*
  Nur die Abwesenheit (T-181, ST-07). Dass das Abhaken zurueckgenommen ist,
  steht im Titel der Meldung („„X" ist wieder offen.") — der Rumpf hat ihn
  wiederholt. Regel S-13: Der Rumpf wiederholt den Titel nicht.
*/
const UNDONE_BODY = "Tags und Status ändern sich dadurch nicht.";

/** Der Titel, wenn das Zurücknehmen scheitert. Ein Wortlaut für alle drei Flächen. */
const UNDO_FAILED_TITLE = "Das Zurücknehmen hat nicht geklappt";

/**
 * Baut den Rückweg für die Meldung nach „Erledigt".
 *
 * @param todoId    Das Todo, dessen Kennzeichen wieder fallen soll.
 * @param todoTitle Steht im Titel der Meldung danach — der Bewegungssatz
 *                  beginnt mit „Es" und nennt das Todo nicht (W-5 aus R-2a).
 * @param toasts    Die Rückmeldungen. Beide Ausgänge melden.
 * @param afterwards Was nach dem Erfolg neu zu laden ist; in allen drei
 *                  Ansichten `bump` aus {@link useRefresh}.
 */
export function undoDoneAction(
  todoId: Id,
  todoTitle: ForeignText,
  toasts: ToastApi,
  afterwards: () => void,
): ToastAction {
  return {
    label: "Rückgängig",
    onSelect: () => {
      void clearTodoDone(todoId)
        .then((undone) => {
          afterwards();
          toasts.show({
            tone: "info",
            title: `${quotedName(todoTitle)} ist wieder offen.`,
            /*
              `cleared: true` — das Kennzeichen wird **aufgehoben**, also der
              Anlaß `'reopen'` („wieder"). Welcher Anlaß zu welcher Handlung
              gehört, entscheidet `lib/movement.ts` und nicht die Aufrufstelle.
            */
            body: withMovement(UNDONE_BODY, doneMovementSentence(undone.poolMovement, true)),
          });
        })
        .catch((cause: unknown) => toasts.failure(UNDO_FAILED_TITLE, errorMessage(cause)));
    },
  };
}
