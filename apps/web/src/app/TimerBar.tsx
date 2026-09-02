import { Icon } from "../components/Icon";
import { Button } from "../components/Primitives";
import { TimerDisplay } from "../components/Timer";
import { formatStopwatch, formatTime } from "../lib/format";
import { href, navigate } from "./router";
import { useTimer } from "./TimerContext";

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

  if (timer.loading) {
    return (
      <div className="timerbar timerbar--idle">
        <span className="timerbar__placeholder">Timer wird geladen …</span>
      </div>
    );
  }

  if (timer.running === null) {
    return (
      <div className="timerbar timerbar--idle">
        <span className="timerbar__icon">
          <Icon name="clock" size={16} />
        </span>
        <span className="timerbar__idle-text">Kein Timer läuft.</span>
        <Button
          size="sm"
          variant="ghost"
          iconStart="play"
          onClick={() => navigate("time")}
        >
          Zeit erfassen
        </Button>
      </div>
    );
  }

  const running = timer.running;

  /*
   * Die Reihenfolge in der Leiste ist die Lesereihenfolge: erst der Puls,
   * dann die Zeit, dann worauf sie laeuft, und ganz am Ende die Aktion.
   *
   * Bis T-056 stand der Stoppknopf zwischen Zeit und Titel — ein nacktes
   * lachsfarbenes Quadrat mitten im Satz, das aussah, als sei es
   * hineingefallen. Es steht jetzt am Ende der Zeile, wo eine Aktion
   * hingehoert, und traegt sein Wort: „Stoppen".
   */
  return (
    <div className="timerbar timerbar--running">
      <TimerDisplay
        state="running"
        size="sm"
        actionStyle="labelled"
        display={formatStopwatch(timer.elapsedSeconds)}
        detail={`seit ${formatTime(running.entry.startedAt)} Uhr`}
        actionTitle={running.todoTitle}
        trailing={
          <a className="timerbar__todo truncate" href={href("todo", running.entry.todoId)}>
            <span className="visually-hidden">Timer läuft auf: </span>
            {running.todoTitle}
          </a>
        }
        onStop={timer.requestStop}
      />
    </div>
  );
}
