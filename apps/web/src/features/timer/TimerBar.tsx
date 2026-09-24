import { Icon } from "../../shared/ui/Icon";
import { Button } from "../../shared/ui/Primitives";
import { TimerDisplay } from "./Timer";
import { formatStopwatch, formatTime } from "../../lib/format";
import { href, navigate } from "../../app/router";
import { useTimer } from "./TimerContext";
import { Foreign } from "../../shared/ui/Foreign";
import { timerTexts } from "./texts";

/**
 * Takt — der Timer in der Kopfleiste (A-13.4).
 *
 * „Prominent, aber nicht störend“ heißt: immer sichtbar, immer an derselben
 * Stelle, und im Ruhezustand so leise, dass er nichts überdeckt. Läuft er,
 * trägt er Farbe, Puls und die laufende Zeit — dann **soll** er auffallen,
 * denn dann läuft eine Abrechnung mit.
 *
 * Der Titel des Todos steht daneben und ist anklickbar. Ein Timer, dessen Todo
 * man nicht findet, ist die häufigste Ursache dafür, dass Zeit auf dem
 * falschen Vorgang landet.
 */
export function TimerBar() {
  const timer = useTimer();
  const text = timerTexts();

  if (timer.loading) {
    return (
      <div className="timerbar timerbar--idle">
        <span className="timerbar__placeholder">{text.timerLoading}</span>
      </div>
    );
  }

  if (timer.running === null) {
    return (
      <div className="timerbar timerbar--idle">
        <span className="timerbar__icon">
          <Icon name="clock" size={16} />
        </span>
        <span className="timerbar__idle-text">{text.noTimerRunning}</span>
        <Button
          size="sm"
          variant="ghost"
          iconStart="play"
          onClick={() => navigate("time")}
        >
          {text.recordTime}
        </Button>
      </div>
    );
  }

  const running = timer.running;

  /*
   * Die Reihenfolge in der Leiste ist die Lesereihenfolge: erst der Puls,
   * dann die Zeit, dann worauf sie laeuft, und ganz am Ende die Aktion.
   *
   * Vorgeschichte: `docs/decisions/timer.md`.
   */
  return (
    <div className="timerbar timerbar--running">
      <TimerDisplay
        state="running"
        size="sm"
        actionStyle="labelled"
        display={formatStopwatch(timer.elapsedSeconds)}
        detail={text.since(formatTime(running.entry.startedAt))}
        actionTitle={running.todoTitle}
        trailing={
          <a className="timerbar__todo truncate" href={href("todo", running.entry.todoId)}>
            <span className="visually-hidden">{text.timerRunsOn}</span>
            <Foreign value={running.todoTitle} />
          </a>
        }
        onStop={timer.requestStop}
      />
    </div>
  );
}
