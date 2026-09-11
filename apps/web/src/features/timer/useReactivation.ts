import { useCallback, useState } from "react";
import { errorMessage } from "../../api/client";
import { deleteTimeEntry } from "../../api/endpoints";
import { markTodoDone } from "../todos/api";
import type { ForeignText, Id, PoolMovement } from "../../api/types";
import { reactivationTitle } from "../../lib/labels";
import { doneMovementSentence, withMovement } from "../../lib/movement";
import { quotedName } from "../../lib/foreign";
import { useRefresh } from "../../app/RefreshContext";
import { useToasts } from "../../app/ToastContext";
import { stopTimer } from "./api";

/**
 * Takt — das aufgehobene „Erledigt" und sein Rückweg (A-2.5, I-05, E-058).
 *
 * Der Timer ist die einzige Stelle der Anwendung, die ein Kennzeichen von
 * selbst umlegt: Ein Start auf einem erledigten Todo hebt „Erledigt" auf. Was
 * daraus folgt, ist eine eigene Sache und steht deshalb in einer eigenen
 * Datei — die Menge der so wiedereröffneten Todos, der Satz, der es ansagt,
 * und der Weg zurück.
 *
 * **Eine einzige Abhängigkeit von außen.** `refresh` gehört dem Timer; `bump`
 * und den Meldungsstapel holt sich dieser Haken aus denselben Kontexten wie
 * sein Aufrufer. Eine Eigenschaft, die eine Kontextfunktion durchreicht, wäre
 * ein zweiter Weg zu derselben Sache (dieselbe Regel wie in
 * `features/todos/TodoDoneSwitch.tsx`).
 */
export function useReactivation(refresh: () => void) {
  const toasts = useToasts();
  const { bump } = useRefresh();

  const [reactivated, setReactivated] = useState<ReadonlySet<Id>>(() => new Set());

  const clearReactivated = useCallback((todoId: Id) => {
    setReactivated((previous) => {
      if (!previous.has(todoId)) return previous;
      const next = new Set(previous);
      next.delete(todoId);
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* I-05 — Rückgängig nach der Wiederaufnahme                          */
  /* ---------------------------------------------------------------- */

  const undoReactivation = useCallback(
    (todoId: Id, todoTitle: ForeignText) => {
      void (async () => {
        try {
          /*
            `stopped.poolMovement` bleibt hier absichtlich ungelesen (T-097):
            Die Buchung, die dieser Stopp erzeugt, wird in der nächsten Zeile
            gelöscht und das Kennzeichen gleich darauf wieder gesetzt. Der Satz
            „Es steht jetzt in „X“." wäre schon falsch, während er vorgelesen
            wird. Was hier gilt, sagt der Toast am Ende dieser Funktion.
          */
          const stopped = await stopTimer("");
          if (stopped.kind === "recorded") await deleteTimeEntry(stopped.entry.id);
          /*
            Diese Bewegung wird **gelesen**, anders als die des Stopps darüber
            (E-060): Das Setzen des Kennzeichens ist der letzte Schritt dieser
            Rücknahme, danach ändert sich nichts mehr. Der Satz beschreibt
            damit den Zustand, in dem der Benutzer die Meldung liest, und er
            ist das Gegenstück zu dem, den der Start eben gezeigt hat.
          */
          const done = await markTodoDone(todoId);
          clearReactivated(todoId);
          refresh();
          bump();
          toasts.show({
            tone: "info",
            title: "Zurückgenommen.",
            body: withMovement(
              `${quotedName(todoTitle)} ist wieder erledigt, die eben entstandene Buchung wurde verworfen.`,
              doneMovementSentence(done.poolMovement, false),
            ),
          });
        } catch (cause) {
          toasts.failure("Das Zurücknehmen hat nicht geklappt", errorMessage(cause));
        }
      })();
    },
    [bump, clearReactivated, refresh, toasts],
  );

  /* ---------------------------------------------------------------- */
  /* Nach dem Start                                                    */
  /* ---------------------------------------------------------------- */

  /**
   * Was der Start bewirkt hat — in **einem** Toast und aus **einer** Quelle
   * (A-2.5, I-05, E-058).
   *
   * ## Die Oberflaeche fragt nicht nach, sie zeigt
   *
   * `POST /timer/start` bringt die Bewegung als `poolMovement` mit, und den
   * Satz bildet `poolMovementSentence` aus `@takt/domain` — dieselbe Funktion,
   * die das Add-in aufruft. Vorgeschichte: `docs/decisions/timer.md`.
   *
   * ## Zwei Anlaesse, ein Aufruf
   *
   * `doneCleared` entscheidet, **welche Frage** an dieselben drei Listen
   * gestellt wird: `'reopen'` erzaehlt vom Wiedererscheinen eines erledigten
   * Todos, `'booking'` von der ersten abgeschlossenen Buchung, die eine Spalte
   * „noch nicht abgerechnet" fuellt.
   *
   * ## `null` heisst: keine Flaeche
   *
   * Meldet der Dienst keine Bewegung, steht kein Poolsatz da — kein leerer,
   * kein beruhigender. Ein `?? ""` haette dem Toast eine Zeile mit null Zeichen
   * gegeben; ausgelassen wird die Zeile ganz.
   */
  const announceStart = useCallback(
    (
      todoId: Id,
      todoTitle: ForeignText,
      doneCleared: boolean,
      poolMovement: PoolMovement | null,
    ) => {
      refresh();
      bump();

      if (doneCleared) setReactivated((previous) => new Set(previous).add(todoId));

      const movementSentence = doneMovementSentence(poolMovement, doneCleared);

      if (!doneCleared) {
        toasts.show({
          tone: "success",
          title: "Timer gestartet.",
          body: `Er läuft auf ${quotedName(todoTitle)}.${movementSentence === null ? "" : ` ${movementSentence}`}`,
        });
        return;
      }

      /*
        A-2.5: Das Kennzeichen ist gefallen — der Status nicht (E-023) und die
        Tags auch nicht. Der Titel sagt, was geschehen ist; der Rumpf sagt, wo
        es sichtbar wird. Ohne beides sucht der Benutzer die Karte an der
        falschen Stelle (T-005n, Abschnitt 2, Schritt 8).

        Der Rueckweg steht unabhaengig davon da, ob es einen Poolsatz gibt: Das
        Kennzeichen ist auch dann weg, wenn ueber die Bewegung nichts zu sagen
        ist, und „Rueckgaengig" ist die Antwort darauf.
      */
      toasts.show({
        tone: "success",
        title: reactivationTitle(todoTitle),
        ...(movementSentence === null ? {} : { body: movementSentence }),
        action: { label: "Rückgängig", onSelect: () => undoReactivation(todoId, todoTitle) },
      });
    },
    [bump, refresh, toasts, undoReactivation],
  );

  return { reactivated, clearReactivated, announceStart };
}
