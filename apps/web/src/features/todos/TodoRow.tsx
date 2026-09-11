import type { CalendarDay, Todo } from "../../api/types";
import type { ExportSummary } from "../../shared/ui/ExportStatus";
import { href, navigate } from "../../app/router";
import { cx } from "../../lib/cx";
import { quotedName } from "../../lib/foreign";
import type { DoneFlagState } from "../../lib/labels";
import { DeadlineFlag } from "../../shared/ui/DeadlineFlag";
import { DoneFlag } from "../../shared/ui/DoneFlag";
import { Foreign } from "../../shared/ui/Foreign";
import { Icon } from "../../shared/ui/Icon";
import { ExportSummaryStrip } from "../../shared/ui/ExportSummaryStrip";
import { Menu, type MenuEntry } from "../../shared/ui/Menu";
import { IconButton } from "../../shared/ui/Primitives";
import { TagChip } from "../../shared/ui/Tag";

interface TodoRowProps {
  readonly todo: Todo;
  readonly summary: ExportSummary;
  readonly statusName: string;
  readonly running: boolean;
  /**
   * Erledigt, offen oder „Erledigt aufgehoben" (A-2.5, Befund C-23).
   *
   * Der dritte Zustand kommt aus der Sitzung und nicht aus dem Todo, deshalb
   * reicht ihn die Liste herein, statt ihn hier aus `completedAt` zu raten.
   */
  readonly doneState: DoneFlagState;
  /** Heute, aus `useToday` der Ansicht — nicht je Zeile geholt. */
  readonly today: CalendarDay;
  readonly onToggleDone: () => void;
  readonly onToggleTimer: () => void;
  readonly menu: readonly MenuEntry[];
  readonly tagLabels: ReadonlyArray<{ readonly tag: { readonly name: string }; readonly path: readonly string[] }>;
}

export function TodoRow({
  todo,
  summary,
  statusName,
  running,
  doneState,
  today,
  onToggleDone,
  onToggleTimer,
  menu,
  tagLabels,
}: TodoRowProps) {
  const done = todo.completedAt !== null;
  const visibleTags = tagLabels.slice(0, 3);
  const hiddenTags = tagLabels.length - visibleTags.length;

  return (
    <li
      className={cx("todo-row", done && "todo-row--done", running && "todo-row--running")}
      onDoubleClick={(event) => {
        const target = event.target;
        if (!(target instanceof Element) || target.closest('a, button, input, label, select, textarea, [role="button"], [role="menuitem"]')) return;
        navigate("todo", todo.id);
      }}
    >
      <label className="todo-row__check">
        <input type="checkbox" checked={done} onChange={onToggleDone} />
        <span className="visually-hidden">
          {done ? `${quotedName(todo.title)} als offen markieren` : `${quotedName(todo.title)} als erledigt markieren`}
        </span>
      </label>

      <div className="todo-row__main">
        <a className="todo-row__title" href={href("todo", todo.id)}>
          <Foreign value={todo.title} />
        </a>
        <div className="todo-row__meta">
          {todo.callNumber === null ? null : (
            <span className="todo-row__call">
              Call <Foreign value={todo.callNumber} />
            </span>
          )}
          <Foreign className="todo-row__status" value={statusName} />
          {/*
            A-2.5, T-005n Abschnitt 1 Regel 1: Hat ein Timerstart „Erledigt"
            aufgehoben, darf die Zeile nicht aussehen, als waere sie nie
            erledigt gewesen. S-02 ist neben S-03 die Ansicht, aus der am
            haeufigsten gestartet wird (E-027, A-6.1) — bis T-045 stand das
            Etikett hier als einziger Listenansicht nicht (Befund C-23).
          */}
          <DoneFlag state={doneState} />
          {/*
            Die Frist (A-19.4): sichtbar, ohne dass man das Todo öffnen muss.
            Sie steht zwischen dem Erledigt-Kennzeichen und den Tags — und sie
            steht **gar nicht** da, wenn keine gesetzt ist (A-19.5). Damit
            trägt die Mehrzahl der Zeilen weiterhin zwei Marken und nicht drei.
          */}
          <DeadlineFlag dueDate={todo.dueDate} today={today} />
        </div>
      </div>

      <div className="todo-row__tags">
        {visibleTags.map((info, index) => (
          <TagChip
            key={`${info.tag.name}-${String(index)}`}
            label={info.tag.name}
            path={info.path}
            size="sm"
          />
        ))}
        {hiddenTags > 0 ? <span className="todo-row__more">+{hiddenTags}</span> : null}
      </div>

      <div className="todo-row__export">
        <ExportSummaryStrip summary={summary} />
      </div>

      <div className="todo-row__actions">
        <IconButton
          label={running ? `Timer für ${quotedName(todo.title)} stoppen` : `Timer für ${quotedName(todo.title)} starten`}
          icon={running ? "pause" : "play"}
          variant={running ? "primary" : "ghost"}
          onClick={onToggleTimer}
        />
        <Menu trigger={<Icon name="more-horizontal" size={16} />} triggerLabel={`Menü für ${quotedName(todo.title)}`} entries={menu} align="end" />
      </div>
    </li>
  );
}
