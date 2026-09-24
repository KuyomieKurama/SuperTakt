import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { searchEverything } from "../api/endpoints";
import type { ForeignText, SearchResult, TodoSearchHit } from "../api/types";
import {
  ExportStatusMarker,
  exportDisplayState,
  type ExportDisplayState,
} from "../shared/ui/ExportStatus";
import { Icon } from "../shared/ui/Icon";
import { Spinner } from "../shared/ui/Primitives";
import { cx } from "../lib/cx";
import { formatDate, formatDuration } from "../lib/format";
import { navigate } from "./router";
import { foreignText, quotedName } from "../lib/foreign";
import { Foreign } from "../shared/ui/Foreign";
import { appTexts } from "./texts";

/**
 * Takt — globale Suche (A-13.7, E-038, C-22).
 *
 * Todos match by title, call number and — here only — their internal note; bookings match by
 * their billing note (A-7.3). The service decides where a todo matched (`origins`, T-393 K-5).
 *
 * The internal note is searched on this machine, never exported (A-7.2): E-075 point 2 and
 * E-122 point 1 decided that a note the own computer cannot search is a note written twice.
 * The earlier comment here claimed the opposite ("nicht im Vermerk", A-7.1) and was wrong.
 *
 * The list is grouped by kind of hit (K-9): "Todos" (title or call number), "Im Vermerk
 * (intern)" (todos that matched **only** in the note) and "In Leistungen" (bookings). A todo
 * matching in title and note appears once, in the first group. The origin stands in the row
 * as text (K-11, SC 1.4.1); no excerpt of the note appears anywhere — not in the row, not in a
 * `title`, not in an accessible name (K-12). The note group carries no export status: a note
 * is never exported (K-13).
 *
 * Keyboard: `Strg`+`K` or `/` focuses the field, arrow keys run linearly over all options
 * across the groups, Enter opens, Esc closes; the active option is announced through
 * `aria-activedescendant` while focus stays in the field.
 */

type EntryGroup = "todo" | "note" | "entry";

interface Entry {
  readonly key: string;
  readonly group: EntryGroup;
  readonly id: string;
  /** A todo title or a billing note — foreign text, shown through `Foreign`. */
  readonly title: ForeignText;
  readonly detail: string;
  readonly marker: ExportDisplayState | null;
}

const GROUP_ORDER: readonly EntryGroup[] = ["todo", "note", "entry"];

function todoEntry(todo: TodoSearchHit): Entry {
  const texts = appTexts().search;
  const noteOnly = todo.origins.length > 0 && todo.origins.every((origin) => origin === "todo_note");
  const where = noteOnly
    ? texts.hitInNoteOnly
    : texts.hitIn(todo.origins.map((origin) => texts.origin[origin]).join(", "));
  const parts = [
    ...(todo.callNumber === null ? [] : [texts.call(foreignText(todo.callNumber))]),
    where,
  ];
  return {
    key: `todo-${todo.id}`,
    group: noteOnly ? "note" : "todo",
    id: todo.id,
    title: todo.title,
    detail: `${parts.join(" · ")}${todo.completedAt === null ? "" : texts.doneSuffix}`,
    marker: null,
  };
}

function toEntries(result: SearchResult): readonly Entry[] {
  const texts = appTexts().search;
  const todos = result.todos.items.slice(0, 8).map(todoEntry);

  const entries: Entry[] = result.timeEntries.slice(0, 8).map((entry) => ({
    key: `entry-${entry.id}`,
    group: "entry",
    id: entry.todoId,
    title: entry.note.length === 0 ? texts.withoutNote : entry.note,
    detail: `${formatDate(entry.startedAt)} · ${formatDuration(entry.durationSeconds)}`,
    marker: exportDisplayState(entry.exportStatus, entry.exportCount),
  }));

  // Flat and in group order, so the arrow keys follow what the eye sees.
  const all = [...todos, ...entries];
  return GROUP_ORDER.flatMap((group) => all.filter((entry) => entry.group === group));
}

export function GlobalSearch() {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [entries, setEntries] = useState<readonly Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [failed, setFailed] = useState(false);

  /* Tastenkürzel: Strg+K und „/“ springen ins Feld. */
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent): void => {
      const target = event.target;
      const inField =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (!event.defaultPrevented && !inField && ((event.key === "k" && (event.ctrlKey || event.metaKey)) || event.key === "/")) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length === 0) {
      setEntries([]);
      setBusy(false);
      setFailed(false);
      return;
    }
    setBusy(true);
    const handle = window.setTimeout(() => {
      void searchEverything(trimmed)
        .then((result) => {
          setEntries(toEntries(result));
          setFailed(false);
          setActiveIndex(-1);
        })
        .catch(() => {
          setEntries([]);
          setFailed(true);
        })
        .finally(() => setBusy(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [term]);

  const choose = useCallback((entry: Entry) => {
    setOpen(false);
    setTerm("");
    setEntries([]);
    navigate("todo", entry.id);
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (entries.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
        setActiveIndex((index) => (index + 1) % entries.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
        setActiveIndex((index) => (index <= 0 ? entries.length - 1 : index - 1));
        return;
      }
      if (event.key === "Enter") {
        const entry = entries[activeIndex] ?? entries[0];
        if (entry !== undefined) {
          event.preventDefault();
          choose(entry);
        }
      }
    },
    [activeIndex, choose, entries],
  );

  const expanded = open && term.trim().length > 0;
  const activeId = activeIndex >= 0 ? `${listId}-${String(activeIndex)}` : undefined;

  const texts = appTexts().search;
  return (
    <div className="gsearch">
      <label className="visually-hidden" htmlFor={inputId}>
        {texts.label}
      </label>
      <div className="gsearch__field">
        <span className="gsearch__icon">
          <Icon name="search" size={16} />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          className="gsearch__input"
          type="search"
          role="combobox"
          autoComplete="off"
          placeholder={texts.placeholder}
          value={term}
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          {...(activeId === undefined ? {} : { "aria-activedescendant": activeId })}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        {busy ? <Spinner size={14} className="gsearch__spinner" /> : null}
      </div>

      {expanded ? (
        <div className="gsearch__panel">
          <ul className="gsearch__list" id={listId} role="listbox" aria-label={texts.results}>
            {GROUP_ORDER.map((group) => {
              const members = entries.filter((entry) => entry.group === group);
              if (members.length === 0) return null;
              const headingId = `${listId}-${group}`;
              return (
                <li key={group} role="group" aria-labelledby={headingId} className="gsearch__group">
                  <span id={headingId} role="presentation" className="gsearch__group-label overline">
                    {group === "todo" ? texts.groupTodos : group === "note" ? texts.groupNote : texts.groupEntries}
                  </span>
                  <ul role="presentation" className="gsearch__group-list">
                    {members.map((entry) => {
                      const index = entries.indexOf(entry);
                      return (
                        <li
                          key={entry.key}
                          id={`${listId}-${String(index)}`}
                          role="option"
                          aria-selected={index === activeIndex}
                          className={cx("gsearch__option", index === activeIndex && "gsearch__option--active")}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            choose(entry);
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                        >
                          <span className="gsearch__option-icon">
                            <Icon name={entry.group === "entry" ? "clock" : entry.group === "note" ? "lock" : "inbox"} size={14} />
                          </span>
                          <span className="grow">
                            <Foreign className="gsearch__option-title truncate" value={entry.title} />
                            <Foreign className="gsearch__option-detail" value={entry.detail} />
                          </span>
                          {entry.marker === null ? null : <ExportStatusMarker state={entry.marker} />}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>

          {entries.length === 0 && !busy ? (
            <p className="gsearch__empty">
              {failed
                ? texts.failed
                : texts.noHit(quotedName(term.trim()))}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
