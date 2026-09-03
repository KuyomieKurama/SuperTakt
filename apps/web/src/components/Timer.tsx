import { poolMovementSentence, type PoolMovement } from "@takt/domain";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";
import { Button, IconButton } from "./Primitives";

/**
 * Zeiterfassung — A-6.1, A-6.2, A-5.6, A-13.4.
 *
 * Der Baustein rechnet nichts. Die angezeigte Dauer kommt als bereits
 * formatierte Zeichenkette von aussen; das Formatieren gehoert zur Fachlogik
 * in `packages/domain` (siehe Bericht, offene Fragen).
 *
 * "Prominent, aber nicht stoerend" (A-13.4) wird ueber die Groesse geloest:
 *   sm  in der Kanban-Karte und der Tabellenzeile
 *   md  in der Kopfleiste, dauerhaft sichtbar
 *   lg  in der Zeiterfassung (S-05) und auf dem Dashboard
 *
 * Begriffe nach E-030: Der **Timer** ist dieses Bedienelement, die
 * **Zeiterfassung** ist der Bereich, der es enthaelt. "Time-Tracker" und
 * "Time-Tracking" kommen in Oberflaechentexten nicht vor.
 */
export type TimerState = "idle" | "running";

/**
 * Wie das Bedienelement am Ende aussieht.
 *
 *   icon      nur das Symbol — wo der Platz knapp ist (Kanban-Karte, Zeile)
 *   labelled  Symbol und Wort — wo der Knopf fuer sich stehen muss
 *
 * Ein nacktes Quadrat ohne Wort war in der Kopfleiste der Grund, warum der
 * Stoppknopf dort wie hineingefallen wirkte (T-056).
 */
export type TimerActionStyle = "icon" | "labelled";

export interface TimerDisplayProps {
  readonly state: TimerState;
  /** Bereits formatierte Dauer, zum Beispiel "00:42:17". */
  readonly display: string;
  /** Titel des Todos, auf das gebucht wird. */
  readonly todoTitle?: string;
  /** Bereits formatierter Zusatz, zum Beispiel "seit 09:12 Uhr". */
  readonly detail?: string;
  readonly size?: "sm" | "md" | "lg";
  /**
   * Steht zwischen der Zeit und dem Bedienelement — zum Beispiel der Verweis
   * auf das laufende Todo in der Kopfleiste. Der Knopf bleibt damit am Ende
   * der Zeile, wo eine Aktion hingehoert, statt mitten im Text zu stehen.
   */
  readonly trailing?: ReactNode;
  /** Vorgabe: `icon` bei `sm`, sonst `labelled`. */
  readonly actionStyle?: TimerActionStyle;
  /**
   * Titel fuer den **Namen** des Bedienelements, wenn der Titel nicht im
   * Text der Anzeige steht, sondern daneben (`trailing`). Ohne Angabe gilt
   * `todoTitle`.
   */
  readonly actionTitle?: string;
  readonly onStart?: () => void;
  readonly onStop?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function TimerDisplay({
  state,
  display,
  todoTitle,
  detail,
  size = "md",
  trailing,
  actionStyle,
  actionTitle,
  onStart,
  onStop,
  disabled = false,
  className,
}: TimerDisplayProps) {
  const running = state === "running";
  const action = actionStyle ?? (size === "sm" ? "icon" : "labelled");
  /*
   * E-030, Befund C-17: „Timer starten", nicht „Zeiterfassung starten". Der
   * Titel des Todos steht mit drin, wo er bekannt ist; dann heisst derselbe
   * Knopf auf allen fuenf Screens gleich — und das gilt auch fuer den
   * beschrifteten Knopf, dessen sichtbares Wort nur „Stoppen" lautet.
   */
  const namedTitle = actionTitle ?? todoTitle;
  const actionLabel =
    namedTitle === undefined
      ? running
        ? "Timer stoppen"
        : "Timer starten"
      : running
        ? `Timer für „${namedTitle}“ stoppen`
        : `Timer für „${namedTitle}“ starten`;
  return (
    <div
      className={cx("timer", `timer--${size}`, running ? "timer--running" : "timer--idle", className)}
    >
      <span className="timer__pulse" aria-hidden />
      <div className="timer__text">
        <output
          className="timer__value"
          aria-live={running ? "off" : "polite"}
          aria-label={running ? `Laufende Zeit ${display}` : `Erfasste Zeit ${display}`}
        >
          {display}
        </output>
        {todoTitle !== undefined || detail !== undefined ? (
          <span className="timer__meta truncate">
            {todoTitle !== undefined ? <strong>{todoTitle}</strong> : null}
            {todoTitle !== undefined && detail !== undefined ? <span aria-hidden> · </span> : null}
            {detail !== undefined ? <span>{detail}</span> : null}
          </span>
        ) : null}
      </div>
      {trailing === undefined ? null : <div className="timer__trailing">{trailing}</div>}
      {action === "icon" ? (
        <IconButton
          label={actionLabel}
          icon={running ? "square" : "play"}
          size="sm"
          variant={running ? "danger" : "secondary"}
          disabled={disabled}
          onClick={running ? onStop : onStart}
        />
      ) : (
        <Button
          className="timer__action"
          variant={running ? "danger" : "primary"}
          size={size === "lg" ? "lg" : size === "sm" ? "sm" : "md"}
          iconStart={running ? "square" : "play"}
          disabled={disabled}
          aria-label={actionLabel}
          onClick={running ? onStop : onStart}
        >
          {running ? "Stoppen" : "Starten"}
        </Button>
      )}
    </div>
  );
}

/* ==================================================================== */
/* Wiederaufnahme eines erledigten Todos — A-2.5, I-05                  */
/* ==================================================================== */

export interface ReactivationNoticeProps {
  readonly todoTitle: string;
  /**
   * Wohin der Timerstart dieses Todo bewegt hat — so, wie der Dienst es
   * gemeldet hat (`POST /timer/start`, Feld `poolMovement`, E-058).
   *
   * Drei Namenslisten und kein fertiger Satz: Den bildet
   * `poolMovementSentence` aus `@takt/domain`, damit dieselbe Handlung hier
   * und im Aufgabenbereich des Add-ins mit denselben Worten berichtet wird.
   *
   * `null` heisst, dass der Dienst keine Bewegung gemeldet hat. Dann steht
   * hier **kein** Poolsatz — weder ein leerer noch ein beruhigender. Bis T-094
   * stand an dieser Stelle eine Namensliste, die die Oberflaeche selbst
   * zusammengesucht hatte, und dahinter der Satz „Die Karte bleibt, wo sie ist"
   * (E-058: falsch, ersatzlos entfallen).
   */
  readonly movement: PoolMovement | null;
  /** Setzt den Vorgang zurueck: Timer stoppen, Todo wieder auf "Erledigt". */
  readonly onUndo?: () => void;
  readonly onDismiss?: () => void;
  readonly className?: string;
}

/**
 * Erklaert, was beim Start des Timers auf einem erledigten Todo passiert ist.
 * Die Anwendung hat den Erledigt-Status aufgehoben, ohne zu fragen (A-2.5);
 * deshalb muss sie es hinterher unmissverstaendlich sagen und einen Rueckweg
 * anbieten.
 *
 * Der Hinweis nennt zwei Dinge, und sie kommen aus zwei Quellen:
 *   1. **Was geschehen ist** — "Erledigt" ist aufgehoben, das Todo ist wieder
 *      offen, der Timer laeuft. Das weiss diese Flaeche selbst.
 *   2. **Wo es sichtbar wird** — der Satz aus `poolMovementSentence`
 *      (`@takt/domain`), gebildet aus dem `poolMovement`, das der Dienst zum
 *      Start gemeldet hat.
 *
 * Bis T-094 stand hier ein selbstgebauter Satz: eine Aufzaehlung der Pools,
 * die die Oberflaeche je Pool einzeln abgefragt hatte, und dahinter „Die Karte
 * bleibt, wo sie ist — die Spalte aendert sich dadurch nicht." Beides ist weg.
 * Die Aufzaehlung kannte nur, was **hinzukommt**, und schwieg darueber, was
 * verschwindet; der Kartensatz war seit E-055 schlicht falsch, weil eine Regel
 * nach "Erledigt" und nach dem Exportstatus fragen darf und ein Timerstart
 * beides anfasst (E-058).
 *
 * Jetzt gibt es **eine** Quelle fuer diesen Satz, und der Aufgabenbereich des
 * Add-ins liest dieselbe. Wer den Wortlaut aendern will, aendert ihn in der
 * Domaene; hier steht keine Abschrift.
 */
export function ReactivationNotice({
  todoTitle,
  movement,
  onUndo,
  onDismiss,
  className,
}: ReactivationNoticeProps) {
  /*
    `'past'`, weil der Start bereits gelaufen ist, und `'reopen'`, weil genau
    dieser Hinweis den Fall A-2.5 begleitet. Beim Anlass `'reopen'` gibt die
    Funktion immer einen Satz — auch den unangenehmen, dass gerade keine Regel
    passt. Nur wenn der Dienst gar keine Bewegung gemeldet hat, bleibt die
    Flaeche leer.
  */
  const movementSentence =
    movement === null ? null : poolMovementSentence(movement, "past", "reopen");

  return (
    <div className={cx("reactivation", className)} role="status" aria-live="polite">
      <span className="reactivation__icon">
        <Icon name="rotate-ccw" size={16} />
      </span>
      <div className="grow">
        {/* E-030: Der **Timer** läuft. „Zeiterfassung" ist der Bereich. */}
        <p className="reactivation__title">„Erledigt“ wurde aufgehoben — der Timer läuft</p>
        <p className="reactivation__body">
          <strong>{todoTitle}</strong> ist wieder offen.
          {movementSentence === null ? null : ` ${movementSentence}`}
        </p>
        <p className="reactivation__hint">
          „Rückgängig“ stoppt den Timer, verwirft die eben entstandene Buchung und setzt
          „Erledigt“ zurück. Verworfen wird sie deshalb, weil wenige Sekunden sonst als
          0,25 Stunden in der Abrechnung stünden.
        </p>
      </div>
      <div className="reactivation__actions">
        {onUndo !== undefined ? (
          <Button variant="secondary" size="sm" onClick={onUndo}>
            Rückgängig
          </Button>
        ) : null}
        {onDismiss !== undefined ? (
          <IconButton label="Hinweis schließen" icon="x" size="sm" onClick={onDismiss} />
        ) : null}
      </div>
    </div>
  );
}
