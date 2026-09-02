import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { joinGerman } from "../lib/format";
import { CARD_STAYS } from "../lib/labels";
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
   * Namen aller Pools, in denen das Todo jetzt wieder liegt (A-3.4).
   * Leer, wenn keine Poolregel auf seine Tags passt — dann darf die Meldung
   * keinen Pool nennen (T-005, B-12).
   */
  readonly poolNames: readonly string[];
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
 * Der Satz nennt die drei Wirkungen aus A-2.5:
 *   1. "Erledigt" ist aufgehoben
 *   2. das Todo ist wieder aktiv
 *   3. es erscheint erneut in seinen Pools
 *
 * Was er ausdruecklich **nicht** sagt: dass das Todo die Spalte gewechselt
 * habe. Das tut es nicht. Erledigt-Kennzeichen und Statusspalte sind zwei
 * unabhaengige Dinge; ein Timerstart fasst nur das Kennzeichen an.
 *
 * Dieser eine Satz steht zeichengleich in `lib/labels.ts` (`CARD_STAYS`), im
 * Toast der Hauptanwendung und im Outlook-Add-in. Bis T-045 stand hier
 * „Statusspalte" und dort „Spalte" — dieselbe Aussage in zwei Fassungen, und
 * genau das ist der Anfang zweier Bedeutungen (Befund C-24). Die
 * Aufzaehlung der Pools kommt aus demselben Grund aus `joinGerman`.
 */
export function ReactivationNotice({
  todoTitle,
  poolNames,
  onUndo,
  onDismiss,
  className,
}: ReactivationNoticeProps) {
  const poolText = joinGerman(poolNames);
  return (
    <div className={cx("reactivation", className)} role="status" aria-live="polite">
      <span className="reactivation__icon">
        <Icon name="rotate-ccw" size={16} />
      </span>
      <div className="grow">
        {/* E-030: Der **Timer** läuft. „Zeiterfassung" ist der Bereich. */}
        <p className="reactivation__title">„Erledigt“ wurde aufgehoben — der Timer läuft</p>
        <p className="reactivation__body">
          <strong>{todoTitle}</strong> ist wieder offen
          {poolNames.length > 0 ? (
            <>
              {" und erscheint erneut "}
              {poolNames.length === 1 ? "im Pool " : "in den Pools "}
              <strong>{poolText}</strong>.
            </>
          ) : (
            ". Zu seinen Tags passt derzeit keine Poolregel, deshalb erscheint es in keinem Pool."
          )}{" "}
          {CARD_STAYS}
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
