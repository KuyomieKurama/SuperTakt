import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { cx } from "../lib/cx";
import { DONE_FLAG_LABEL, doneFlagState } from "../lib/labels";
import { ExportStatusMarker, EXPORT_STATE, type ExportDisplayState } from "./ExportStatus";
import { Icon } from "./Icon";
import { Menu, type MenuEntry } from "./Menu";
import { IconButton } from "./Primitives";
import { TagChip } from "./Tag";

/**
 * Kanban-Board — A-5.1 bis A-5.6, I-14.
 *
 * Ziehen und Ablegen ist der schnelle Weg, aber nie der einzige:
 * WCAG 2.2 SC 2.5.7 verlangt fuer jede Ziehbewegung eine Alternative mit
 * einem einzelnen Zeigerdruck. Jede Karte traegt deshalb ein Menue
 * "Verschieben nach" und reagiert zusaetzlich auf Strg+Pfeil links/rechts.
 */

export interface KanbanTagRef {
  readonly label: string;
  readonly path?: readonly string[];
}

/**
 * Zusammenfassung der Exportstaende aller Buchungen eines Todos.
 *
 * Gezaehlt wird nach **Anzeigezustand**, damit "erneut offen" auf der Karte
 * sichtbar bleibt (R-10) und "nicht abgerechnet" nicht als Export durchgeht
 * (E-050). Fachlich sind "offen" und "erneut offen" derselbe Wert, ebenso
 * "exportiert" und "nicht abgerechnet" (E-032); wer aus dieser
 * Zusammenfassung eine Exportauswahl ableitet, muss die jeweils zwei
 * addieren.
 */
export type ExportSummary = Readonly<Record<ExportDisplayState, number>>;

export interface KanbanCardData {
  readonly id: string;
  readonly title: string;
  readonly callNumber: string | null;
  readonly tags: readonly KanbanTagRef[];
  /** Bereits formatierte Gesamtdauer, zum Beispiel "4:15 h". */
  readonly trackedDisplay: string;
  readonly exportSummary: ExportSummary;
  readonly timerRunning: boolean;
  /**
   * Erledigt-Kennzeichen des Todos (A-2.4). Es haengt **nicht** an der Spalte:
   * Die Statusspalten sind frei definierbar (A-5.4), ein Kanban-Abschluss ist
   * kein Erledigt. Ein Todo kann in "Erledigt" stehen und offen sein, und es
   * kann in "In Arbeit" stehen und erledigt sein.
   */
  readonly done: boolean;
  /**
   * "Erledigt" wurde von der Anwendung selbst aufgehoben, weil jemand den
   * Timer gestartet hat (A-2.5). Die Karte bleibt dabei in ihrer Spalte; nur
   * das Kennzeichen faellt. Der Zustand bleibt sichtbar, bis der Benutzer das
   * Kennzeichen selbst wieder setzt — sonst wirkt der Wechsel unerklaert.
   */
  readonly reactivated?: boolean;
}

export interface KanbanCardProps {
  readonly card: KanbanCardData;
  readonly entries: readonly MenuEntry[];
  readonly onOpen: () => void;
  readonly onToggleTimer: () => void;
  /** Verschiebt die Karte um `delta` Spalten. Tastaturalternative zum Ziehen. */
  readonly onMoveByKeyboard: (delta: number) => void;
  readonly dragging?: boolean;
  readonly onDragStart?: (event: DragEvent<HTMLElement>) => void;
  readonly onDragEnd?: (event: DragEvent<HTMLElement>) => void;
}

export function KanbanCard({
  card,
  entries,
  onOpen,
  onToggleTimer,
  onMoveByKeyboard,
  dragging = false,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (!event.ctrlKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onMoveByKeyboard(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onMoveByKeyboard(-1);
    }
  };

  const cardFlagState = doneFlagState(card.done, card.reactivated === true);

  return (
    <article
      className={cx(
        "kcard",
        dragging && "kcard--dragging",
        card.timerRunning && "kcard--running",
        card.done && "kcard--done",
        card.reactivated === true && "kcard--reactivated",
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onKeyDown={onKeyDown}
    >
      <div className="kcard__grip" aria-hidden>
        <Icon name="drag" size={14} />
      </div>

      <div className="kcard__main">
        <div className="kcard__top">
          {card.callNumber !== null ? (
            <span className="kcard__call mono">{card.callNumber}</span>
          ) : null}
          {/* Das Erledigt-Kennzeichen steht auf jeder Karte, auch wenn es
              "offen" lautet. Waere es nur bei "erledigt" da, muesste man aus
              dem Spaltennamen raten — und genau das ist der Fehler, den die
              Trennung von Spalte und Kennzeichen verhindern soll. */}
          <span className={cx("kcard__flag", `kcard__flag--${cardFlagState}`)}>
            <Icon
              name={card.done ? "check" : card.reactivated === true ? "rotate-ccw" : "circle"}
              size={12}
            />
            {/* Die Woerter stehen in `lib/labels.ts`, damit die Karte nicht
                etwas anderes sagt als die Zeile daneben (Befund C-23). Die
                Huelle bleibt eigen: Eine Karte hat andere Masse als eine
                Zeile. */}
            {DONE_FLAG_LABEL[cardFlagState]}
          </span>
        </div>

        <h4 className="kcard__title">
          <button type="button" className="kcard__open" onClick={onOpen}>
            {card.title}
          </button>
        </h4>

        {card.tags.length > 0 ? (
          <div className="kcard__tags">
            {card.tags.map((tag) => (
              <TagChip
                key={`${tag.path?.join("/") ?? ""}/${tag.label}`}
                label={tag.label}
                size="sm"
                {...(tag.path === undefined ? {} : { path: tag.path })}
              />
            ))}
          </div>
        ) : null}

        <div className="kcard__foot">
          <ExportSummaryStrip summary={card.exportSummary} />
          <span className="kcard__tracked tabular">
            <Icon name="clock" size={13} />
            {card.trackedDisplay}
          </span>
        </div>
      </div>

      <div className="kcard__actions">
        <IconButton
          /* E-030, Befund C-17: Der Timer wird gestartet, nicht der Bereich. */
          label={
            card.timerRunning
              ? `Timer für „${card.title}“ stoppen`
              : `Timer für „${card.title}“ starten`
          }
          icon={card.timerRunning ? "square" : "play"}
          size="sm"
          variant={card.timerRunning ? "danger" : "secondary"}
          onClick={onToggleTimer}
        />
        <Menu
          trigger={<Icon name="more-horizontal" size={16} />}
          triggerLabel={`Aktionen für ${card.title}`}
          triggerClassName="kcard__menu"
          align="end"
          entries={entries}
        />
      </div>
    </article>
  );
}

export interface ExportSummaryStripProps {
  readonly summary: ExportSummary;
  readonly className?: string;
}

/**
 * Zeigt auf engem Raum, wie die Buchungen eines Todos beim Export stehen.
 * Form und Zahl tragen die Aussage, die Farbe verstaerkt sie nur.
 */
export function ExportSummaryStrip({ summary, className }: ExportSummaryStripProps) {
  /* Reihenfolge nach Dringlichkeit: was noch Geld bringt zuerst, was
     abgeschlossen ist zuletzt. */
  const order: readonly ExportDisplayState[] = ["open", "reopened", "exported", "not_billed"];
  const present = order.filter((state) => summary[state] > 0);

  if (present.length === 0) {
    return <span className={cx("summary-strip summary-strip--empty", className)}>keine Buchung</span>;
  }

  return (
    <span className={cx("summary-strip", className)}>
      {present.map((state) => (
        <span key={state} className="summary-strip__item">
          <ExportStatusMarker state={state} labelled={false} />
          <span aria-hidden>{summary[state]}</span>
          <span className="visually-hidden">
            {summary[state]} Buchungen: {EXPORT_STATE[state].label}
          </span>
        </span>
      ))}
    </span>
  );
}

export interface KanbanColumnProps {
  readonly title: string;
  readonly count: number;
  /** Optionale Obergrenze aus der Spaltenkonfiguration (A-5.4). */
  readonly limit?: number;
  /**
   * Wie viele Todos dieser Spalte erledigt sind. Die Spalte sagt nichts
   * darueber aus — das Kennzeichen haengt am Todo, nicht an der Phase. Steht
   * die Zahl nicht im Kopf, muss man sie aus den Karten zusammenzaehlen.
   */
  readonly doneCount?: number;
  readonly entries: readonly MenuEntry[];
  readonly dropTarget?: boolean;
  readonly onDragOver?: (event: DragEvent<HTMLElement>) => void;
  readonly onDragLeave?: (event: DragEvent<HTMLElement>) => void;
  readonly onDrop?: (event: DragEvent<HTMLElement>) => void;
  readonly onAdd?: () => void;
  readonly children: ReactNode;
}

export function KanbanColumn({
  title,
  count,
  limit,
  doneCount = 0,
  entries,
  dropTarget = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onAdd,
  children,
}: KanbanColumnProps) {
  const overLimit = limit !== undefined && count > limit;
  const accessibleName =
    doneCount === 0
      ? `Spalte ${title}, ${count} Todos`
      : `Spalte ${title}, ${count} Todos, davon ${doneCount} erledigt`;
  return (
    <section
      className={cx("kcolumn", dropTarget && "kcolumn--drop")}
      aria-label={accessibleName}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="kcolumn__head">
        <div className="kcolumn__heading">
          <h3 className="kcolumn__title">{title}</h3>
          {doneCount > 0 ? (
            <p className="kcolumn__done-count" aria-hidden>
              <Icon name="check" size={11} />
              {doneCount} erledigt
            </p>
          ) : null}
        </div>
        <span className={cx("kcolumn__count", overLimit && "kcolumn__count--over")}>
          {count}
          {limit !== undefined ? <span aria-hidden> / {limit}</span> : null}
          {overLimit ? <span className="visually-hidden"> — Obergrenze überschritten</span> : null}
        </span>
        {onAdd !== undefined ? (
          <IconButton label={`Todo in ${title} anlegen`} icon="plus" size="sm" onClick={onAdd} />
        ) : null}
        <Menu
          trigger={<Icon name="more-horizontal" size={16} />}
          triggerLabel={`Spalte ${title} konfigurieren`}
          triggerClassName="kcolumn__menu"
          align="end"
          entries={entries}
        />
      </header>
      <div className="kcolumn__body">{children}</div>
    </section>
  );
}
