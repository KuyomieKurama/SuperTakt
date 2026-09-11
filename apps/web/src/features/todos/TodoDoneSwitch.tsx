import { useCallback } from "react";

import { errorMessage } from "../../api/client";
import type { ForeignText, Todo } from "../../api/types";
import { clearTodoDone, markTodoDone } from "./api";
import { useRefresh } from "../../app/RefreshContext";
import { useTimer } from "../timer/TimerContext";
import { useToasts } from "../../app/ToastContext";
import { undoDoneAction } from "./undoDone";
import { cx } from "../../lib/cx";
import { quotedName } from "../../lib/foreign";
import { formatDateTime } from "../../lib/format";
import { DONE_FLAG_LABEL, doneFlagState } from "../../lib/labels";
import { doneMovementSentence, withMovement } from "../../lib/movement";
import { DoneFlag } from "../../shared/ui/DoneFlag";
import { Icon } from "../../shared/ui/Icon";

/**
 * Takt — „Erledigt" setzen und aufheben in der Detailansicht (A-2.4, A-2.5,
 * I-05, E-023, E-060).
 *
 * Der Schalter und die Handlung dahinter stehen zusammen, weil sie zusammen
 * eine Sache sind: umlegen, den Anzeigezustand „Erledigt aufgehoben" beenden,
 * den Bewegungssatz aus der Antwort zeigen und den Rückweg anbieten. Kein
 * anderer Teil der Ansicht liest `flagState`, und niemand sonst ruft von dieser
 * Fläche aus {@link markTodoDone} oder {@link clearTodoDone} an.
 *
 * **Der Status bleibt unverändert** (E-023) — Erledigt und Status sind zwei
 * getrennte Größen. Daß die Karte trotzdem die Spalte wechseln kann, steht
 * seit E-055 in der Antwort des Dienstes und wird hier nicht nachgerechnet.
 *
 * Die Ansicht danach neu zu holen ist **keine** Eigenschaft dieses Bausteins:
 * `bump()` kommt aus demselben `RefreshContext`, den der Screen liest, und
 * eine Eigenschaft, die eine Kontextfunktion durchreicht, wäre ein zweiter
 * Weg zu derselben Sache (T-097).
 */
export interface TodoDoneSwitchProps {
  readonly todo: Todo;
}

export function TodoDoneSwitch({ todo }: TodoDoneSwitchProps) {
  const timer = useTimer();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const todoId = todo.id;
  const done = todo.completedAt !== null;

  /*
    A-2.5, I-05, Befund C-23: S-03 ist neben S-02 die Ansicht, aus der
    am haeufigsten ein Timer gestartet wird. Bis T-045 sprang der
    Schalter danach schlicht auf „Offen" — die Aenderung, die Takt
    ohne Rueckfrage vorgenommen hat, war hinterher nicht mehr zu
    erkennen.
  */
  const flagState = doneFlagState(done, timer.reactivated.has(todo.id));

  const toggleDone = useCallback(
    (done: boolean, title: ForeignText) => {
      void (done ? clearTodoDone(todoId) : markTodoDone(todoId))
        .then((result) => {
          /*
            Der Anzeigezustand „Erledigt aufgehoben" endet, sobald der
            Benutzer das Kennzeichen selbst anfasst (A-2.5). Er erklaert eine
            Aenderung, die Takt vorgenommen hat — nach einer eigenen bliebe er
            als Behauptung stehen.
          */
          timer.clearReactivated(todoId);
          bump();
          /*
            Der Bewegungssatz aus der Antwort (E-060 Punkt 4). Diese Ansicht
            zeigt kein Board und keine Pool-Liste — gerade deshalb steht hier,
            wo das Todo nach der Handlung zu finden ist. Meldet der Dienst
            keine Bewegung, bleibt es beim Satz über Status und Kennzeichen.
          */
          toasts.show({
            tone: done ? "info" : "success",
            title: done ? `${quotedName(title)} ist wieder offen.` : `${quotedName(title)} ist erledigt.`,
            body: withMovement(
              "Der Status bleibt unverändert — Erledigt und Status sind zwei getrennte Größen.",
              doneMovementSentence(result.poolMovement, done),
            ),
            /*
              Der Rückweg, seit T-118 an allen drei Flächen (B-7 aus T-116).
              `done` ist hier der Zustand **vor** der Handlung: Wenn er wahr
              war, hat der Benutzer gerade wieder geöffnet — das ist selbst
              schon eine Rücknahme und braucht keine zweite.
            */
            ...(done ? {} : { action: undoDoneAction(todoId, title, toasts, bump) }),
          });
        })
        .catch((cause: unknown) =>
          toasts.failure("Das Kennzeichen ließ sich nicht ändern", errorMessage(cause)),
        );
    },
    [bump, timer, todoId, toasts],
  );

  return (
    <div className="detail__completion">
      <label className={cx("done-switch", done && "done-switch--on")}>
        <input
          type="checkbox"
          checked={done}
          aria-label="Aufgabe erledigt"
          onChange={() => toggleDone(done, todo.title)}
        />
        <span className="done-switch__box" aria-hidden>
          <Icon name={done ? "check" : "square"} size={14} />
        </span>
        <strong>{DONE_FLAG_LABEL[flagState]}</strong>
      </label>
      {flagState === "reopened" ? <DoneFlag state={flagState} /> : null}
      {/*
        **SP-16**, zweite Haelfte (Sperrliste, Abschnitt 5; A-2.5, I-05).
        Der Toast beim Timerstart traegt den ersten Teil (`reactivationTitle`);
        er ist weg, sobald der Benutzer hierher zurueckkommt. **Dieser** Satz
        bleibt, solange der Anzeigezustand gilt, und er nennt den Urheber: Die
        Anwendung hat das Kennzeichen aufgehoben, nicht der Benutzer. Ohne ihn
        aendert die Anwendung einen Zustand und schweigt darueber.
      */}
      {flagState === "reopened" ? (
        <p className="done-switch__hint">
          Der Timerstart hat das Kennzeichen aufgehoben — SuperTakt hat das getan, nicht Sie.
        </p>
      ) : null}
      {done ? (
        <span className="muted">{formatDateTime(todo.completedAt ?? todo.updatedAt)}</span>
      ) : null}
    </div>
  );
}
