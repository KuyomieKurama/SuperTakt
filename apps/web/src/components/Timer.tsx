import type { ReactNode } from "react";
import type { ForeignText } from "../api/types";
import { cx } from "../lib/cx";
import { Button, IconButton } from "./Primitives";
import { quotedName } from "../lib/foreign";
import { Foreign } from "./Foreign";

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
  readonly todoTitle?: ForeignText;
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
  readonly actionTitle?: ForeignText;
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
        ? `Timer für ${quotedName(namedTitle)} stoppen`
        : `Timer für ${quotedName(namedTitle)} starten`;
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
            {todoTitle !== undefined ? (
              <strong>
                <Foreign value={todoTitle} />
              </strong>
            ) : null}
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
/* Was hier bis T-108 stand: `ReactivationNotice` (A-2.5, I-05)         */
/* ==================================================================== */

/*
 * Der Baustein ist **ersatzlos** entfallen (W-9 aus R-2a), und diese Notiz
 * steht an seiner Stelle, damit ihn niemand aus bester Absicht neu baut.
 *
 * Er zeigte nach einem Timerstart auf einem erledigten Todo eine eigene
 * Hinweisfläche: „„Erledigt“ wurde aufgehoben — der Timer läuft", darunter der
 * Bewegungssatz und ein „Rückgängig". **Keine Ansicht der Anwendung hat ihn
 * jemals eingesetzt.** Seit T-045 trägt diesen Fall der Toast
 * (`TimerContext.announceStart`: Titel, Bewegungssatz, „Rückgängig") zusammen
 * mit dem Etikett „Erledigt aufgehoben" an der Zeile ({@link DoneFlag},
 * `DONE_FLAG_LABEL.reopened`) — zwei Flächen, die zusammen dasselbe leisten
 * und dabei nicht mitten in der Liste Platz nehmen.
 *
 * Übrig blieben die Musterseite und dieser Baustein. Damit zeigte die
 * abgenommene visuelle Referenz (E-013, E-024) eine Fläche, die es im Produkt
 * nicht gibt — der teuerste Fehler, den eine Musterseite machen kann, weil er
 * genau dort steht, wo nachgesehen wird, was das Produkt tut. Die Musterseite
 * zeigt jetzt den Toast und das Etikett.
 *
 * Mit ihm entfallen sind `.reactivation*` in `styles/components.css`; das
 * gemessene Farbpaar `--text-muted` auf `--timer-running-bg` bleibt, weil es
 * andere Flächen ebenfalls tragen (Nebentext in einer Zeile mit laufendem
 * Timer) — nur sein Beleg in `scripts/contrast-check.mjs` nennt jetzt diese.
 */
