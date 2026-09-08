import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { searchEverything } from "../api/endpoints";
import type { SearchResult } from "../api/types";
import {
  ExportStatusMarker,
  exportDisplayState,
  type ExportDisplayState,
} from "../components/ExportStatus";
import { Icon } from "../components/Icon";
import { Spinner } from "../components/Primitives";
import { cx } from "../lib/cx";
import { formatDate, formatDuration } from "../lib/format";
import { navigate } from "./router";
import { foreignText, quotedName } from "../lib/foreign";
import { Foreign } from "../components/Foreign";

/**
 * Takt — globale Suche (A-13.7, E-038).
 *
 * Sie trifft Todos über Titel und Call-Nummer und Zeitbuchungen über ihren
 * **Leistungstext**.
 *
 * ## Der Vermerk: was hier bis T-156 stand, war falsch (Befund O-CM)
 *
 * An dieser Stelle stand der Satz, die Suche dürfe den internen Vermerk „nicht
 * treffen (A-7.1)". **A-7.1 sagt darüber nichts.** Verboten ist der Vermerk im
 * **Export** (A-7.2) — nicht sein Wiederfinden auf dem eigenen Rechner. E-038
 * verlangt sogar das Gegenteil, und E-075 Punkt 2 hat es nach der Messung
 * ausdrücklich bestätigt: „Ein Vermerk, den der eigene Rechner nicht
 * durchsuchen kann, ist eine Notiz, die man zweimal schreibt."
 *
 * Der Satz war damit keine Beschreibung, sondern eine Anweisung an den
 * nächsten Agenten, gegen die Entscheidung zu bauen. Er ist gestrichen.
 *
 * **Was heute wirklich gilt:** `repo-todos.ts` sucht in `title` und
 * `call_number`; der Vermerk ist im Dienst nicht dabei, und deshalb steht er
 * auch in keiner Antwort. Das ist der **Stand**, nicht die Regel. Die
 * Erweiterung ist eine eigene Aufgabe — sie braucht zuerst die Herkunft des
 * Treffers aus dem Dienst, damit die Trefferzeile sagen kann, **wo** sie
 * getroffen hat, und sie legt zugleich Befund C-22 erneut vor (E-075 Punkt 2,
 * Bedingung).
 *
 * ## Bedienung
 *
 * Ohne Maus, nach dem Muster für Kombinationsfelder: `Strg`+`K` oder `/` setzt
 * den Fokus, Pfeiltasten wählen, Eingabe öffnet, `Esc` schließt. Der aktive
 * Eintrag wird über `aria-activedescendant` angesagt, ohne dass der Fokus das
 * Feld verlässt.
 */

interface Entry {
  readonly key: string;
  readonly kind: "todo" | "entry";
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly marker: ExportDisplayState | null;
}

function toEntries(result: SearchResult): readonly Entry[] {
  const todos: Entry[] = result.todos.items.slice(0, 8).map((todo) => ({
    key: `todo-${todo.id}`,
    kind: "todo",
    id: todo.id,
    title: todo.title,
    detail:
      todo.callNumber === null
        ? todo.completedAt === null
          ? "Todo"
          : "Todo · erledigt"
        : `Call ${foreignText(todo.callNumber)}${todo.completedAt === null ? "" : " · erledigt"}`,
    marker: null,
  }));

  const entries: Entry[] = result.timeEntries.slice(0, 8).map((entry) => ({
    key: `entry-${entry.id}`,
    kind: "entry",
    id: entry.todoId,
    title: entry.note.length === 0 ? "(ohne Leistung)" : entry.note,
    detail: `${formatDate(entry.startedAt)} · ${formatDuration(entry.durationSeconds)}`,
    marker: exportDisplayState(entry.exportStatus, entry.exportCount),
  }));

  return [...todos, ...entries];
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
      if ((event.key === "k" && (event.ctrlKey || event.metaKey)) || (event.key === "/" && !inField)) {
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

  return (
    <div className="gsearch">
      <label className="visually-hidden" htmlFor={inputId}>
        Globale Suche über Todos und Leistungstexte
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
          placeholder="Suchen … (Strg + K)"
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
          <ul className="gsearch__list" id={listId} role="listbox" aria-label="Suchergebnisse">
            {entries.map((entry, index) => (
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
                  <Icon name={entry.kind === "todo" ? "inbox" : "clock"} size={14} />
                </span>
                <span className="grow">
                  <Foreign className="gsearch__option-title truncate" value={entry.title} />
                  <Foreign className="gsearch__option-detail" value={entry.detail} />
                </span>
                {entry.marker === null ? null : <ExportStatusMarker state={entry.marker} />}
              </li>
            ))}
          </ul>

          {entries.length === 0 && !busy ? (
            <p className="gsearch__empty">
              {failed
                ? "Die Suche ist fehlgeschlagen. Läuft der lokale Dienst noch?"
                : `Kein Treffer für ${quotedName(term.trim())}. Gesucht wird in Titeln, Call-Nummern und Leistungstexten — nicht im Vermerk.`}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
