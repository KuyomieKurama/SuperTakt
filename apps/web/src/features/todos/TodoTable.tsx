import type { MouseEvent, ReactNode } from "react";
import type { CalendarDay, Todo } from "../../api/types";
import { href, navigate } from "../../app/router";
import { cx } from "../../lib/cx";
import { quotedName } from "../../lib/foreign";
import type { DoneFlagState } from "../../lib/labels";
import { DeadlineFlag } from "../../shared/ui/DeadlineFlag";
import { DoneFlag } from "../../shared/ui/DoneFlag";
import type { ExportSummary } from "../../shared/ui/ExportStatus";
import { ExportSummaryStrip } from "../../shared/ui/ExportSummaryStrip";
import { Foreign } from "../../shared/ui/Foreign";
import { Icon } from "../../shared/ui/Icon";
import { Menu, type MenuEntry } from "../../shared/ui/Menu";
import { IconButton } from "../../shared/ui/Primitives";
import { TodoTagsCell, type TodoTagLabel } from "./TodoTagsCell";

/**
 * Takt — die Todo-Liste als Tabelle (A-25.9, S-02).
 *
 * ===========================================================================
 * Acht Spalten, und keine davon ist neu
 * ===========================================================================
 *
 * Erledigt, Call, Titel, Status, Frist, Tags, Buchungen, Aktionen. Alles, was
 * die frühere Zeile trug, steht in genau einer Spalte; verlegt — nicht
 * gestrichen — sind zwei Dinge: die **Tag-Namen** aus der Zeile in die Fläche
 * (`TodoTagsCell`) und der **Metazeilen-Verbund** in vier getrennte Spalten.
 * Der Zweck ist der Vergleich: dieselbe Angabe steht in jeder Zeile an
 * derselben waagerechten Stelle, und auf dieselbe Bildschirmhöhe passen mehr
 * Todos, weil eine Zeile eine Zeile ist und nicht drei.
 *
 * ===========================================================================
 * Was diese Tabelle ausdrücklich **nicht** von der Buchungstabelle übernimmt
 * ===========================================================================
 *
 * Die Buchungsübersicht hat eine Mehrfachauswahl: ein Kästchen in der
 * Kopfzelle, `aria-selected` an der Zeile, eine Sammelleiste darüber. **Die
 * Todo-Liste hat keine.** Das führende Kästchen ist das Erledigt-Kennzeichen
 * (I-03, E-023) und bleibt es. Wer diese Datei aus `BookingTable` fortschreibt,
 * erbt sonst ein Bedienelement, das eine Auswahl anbietet, die keine Aktion
 * verwerten kann — dieselbe Klasse wie ein Satz, der eine Handlung nennt, die
 * es nicht gibt (E-100). Deshalb drei Auflagen, und sie sind hart:
 *
 *   die Kopfzelle von Spalte 1 trägt das **Wort** „Erledigt", kein Kästchen;
 *   die Zeile trägt **kein** `aria-selected`;
 *   es gibt **keine** Sammelleiste, und die Zelle heißt `.todo-col--done`
 *   und nicht `.table__select` — ein Bezeichner, der „select" heißt und nichts
 *   auswählt, ist ein Rest mit Zusage.
 *
 * **Auch kein Sortieren am Spaltenkopf.** Die Ordnung nach Frist steht bereits
 * in der Filterleiste (A-19.20), samt Filterchip zum Zurücksetzen; ein zweites
 * Stellglied für denselben Zustand ist ein Fehler und kein Komfort. Keine
 * Kopfzelle trägt `aria-sort`, keine ist ein Knopf, keine trägt `.table__sort`
 * oder einen Pfeil — damit der Unterschied zur Buchungstabelle sichtbar ist,
 * bevor jemand klickt.
 *
 * ===========================================================================
 * Der Fuß
 * ===========================================================================
 *
 * „Weitere laden" steht **in** der Tabelle. Der Grund ist Mechanik, nicht
 * Geschmack: Der klebende Kopf greift nur, wenn `.table-wrap` selbst der
 * senkrechte Laufbereich ist — dann hat die Tabelle dort kein Geschwister
 * mehr. Ein Blockelement in einem waagerecht laufenden Kasten wäre außerdem so
 * breit wie dessen Inhaltsbreite und wanderte beim Rollen aus dem Bild; ein
 * `tfoot` ist so breit wie die Tabelle.
 */

/** Die Spaltenzahl, einmal getippt — der Fuß spannt über alle. */
const COLUMN_COUNT = 8;

export const TODO_TABLE_CAPTION =
  "Alle Todos mit Erledigt-Kennzeichen, Call-Nummer, Status, Frist, Tags und Exportstand ihrer Buchungen";

export interface TodoTableRow {
  readonly todo: Todo;
  readonly summary: ExportSummary;
  readonly statusName: string;
  readonly running: boolean;
  /**
   * Erledigt, offen oder „Erledigt aufgehoben" (A-2.5, Befund C-23).
   *
   * Der dritte Zustand kommt aus der Sitzung und nicht aus dem Todo, deshalb
   * reicht ihn die Ansicht herein, statt ihn hier aus `completedAt` zu raten.
   */
  readonly doneState: DoneFlagState;
  readonly tagLabels: readonly TodoTagLabel[];
  readonly menu: readonly MenuEntry[];
  readonly onToggleDone: () => void;
  readonly onToggleTimer: () => void;
}

export interface TodoTableProps {
  readonly rows: readonly TodoTableRow[];
  /** Heute, aus `useToday` der Ansicht — nicht je Zeile geholt. */
  readonly today: CalendarDay;
  /**
   * Welche Zeile ihre Tag-Fläche offen hat. Genau eine in der ganzen Ansicht;
   * ein zweiter Auslöser schließt die erste.
   */
  readonly openTagsTodoId: string | null;
  readonly onOpenTags: (todoId: string | null) => void;
  /** „Weitere laden (n übrig)", als Fuß der Tabelle. */
  readonly footer?: ReactNode;
}

/**
 * Doppelklick öffnet die Detailansicht — außer auf einem Bedienelement.
 *
 * Zeichengleich der Ausschluß, den die frühere Listenzeile trug und den die
 * Exporttabelle für ihre Zeilen ebenfalls führt. Der Auslöser der Tag-Fläche
 * ist ein `button` und fällt damit von selbst darunter.
 */
function openOnRowDoubleClick(event: MouseEvent<HTMLTableRowElement>, todoId: string): void {
  const target = event.target;
  if (
    !(target instanceof Element) ||
    target.closest('a, button, input, label, select, textarea, [role="button"], [role="menuitem"]')
  ) {
    return;
  }
  navigate("todo", todoId);
}

export function TodoTable({ rows, today, openTagsTodoId, onOpenTags, footer }: TodoTableProps) {
  return (
    <table className="table todo-table">
      <caption className="visually-hidden">{TODO_TABLE_CAPTION}</caption>
      <colgroup>
        <col className="todo-col--done" />
        <col className="todo-col--call" />
        {/* Genau eine Spalte ohne Breite: der Titel nimmt, was übrig bleibt. */}
        <col className="todo-col--title" />
        <col className="todo-col--status" />
        <col className="todo-col--deadline" />
        <col className="todo-col--tags" />
        <col className="todo-col--bookings" />
        <col className="todo-col--actions" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Erledigt</th>
          <th scope="col">Call</th>
          <th scope="col">Titel</th>
          <th scope="col">Status</th>
          <th scope="col">Frist</th>
          <th scope="col">Tags</th>
          <th scope="col">Buchungen</th>
          <th scope="col" className="table__cell--end">
            <span className="visually-hidden">Aktionen</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <TodoTableRowView
            key={row.todo.id}
            row={row}
            today={today}
            tagsOpen={openTagsTodoId === row.todo.id}
            onOpenTags={onOpenTags}
          />
        ))}
      </tbody>
      {footer === undefined ? null : (
        <tfoot>
          <tr className="todo-table__foot">
            <td colSpan={COLUMN_COUNT}>{footer}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function TodoTableRowView({
  row,
  today,
  tagsOpen,
  onOpenTags,
}: {
  readonly row: TodoTableRow;
  readonly today: CalendarDay;
  readonly tagsOpen: boolean;
  readonly onOpenTags: (todoId: string | null) => void;
}) {
  const { todo, summary, statusName, running, doneState, tagLabels, menu } = row;
  const done = todo.completedAt !== null;

  return (
    /*
      `todo-row` und `todo-row__title` überleben den Umbau als Haken (E-114):
      zwölf Prüfstellen in acht e2e-Dateien benutzen sie als Geltungsbereich.
      Sie fragen nach einem Kasten mit einem Text darin, und den gibt es
      weiterhin — jetzt als Tabellenzeile.
    */
    <tr
      className={cx(
        "table__row",
        "todo-row",
        done && "todo-row--done",
        running && "todo-row--running",
      )}
      onDoubleClick={(event) => openOnRowDoubleClick(event, todo.id)}
    >
      <td className="todo-cell--done">
        <span className="todo-cell__stack">
          <label className="todo-row__check">
            <input type="checkbox" checked={done} onChange={row.onToggleDone} />
            <span className="visually-hidden">
              {done
                ? `${quotedName(todo.title)} als offen markieren`
                : `${quotedName(todo.title)} als erledigt markieren`}
            </span>
          </label>
          {/*
            A-2.5, I-05: Hat ein Timerstart „Erledigt" aufgehoben, darf die
            Zeile nicht aussehen, als wäre sie nie erledigt gewesen. S-02 ist
            neben S-03 die Ansicht, aus der am häufigsten gestartet wird
            (E-027, A-6.1) — bis T-045 stand das Etikett hier als einziger
            Listenansicht nicht (Befund C-23). Es steht in voller Beschriftung
            und wird nicht gekürzt; reicht die Breite nicht, bricht es um.
          */}
          <DoneFlag state={doneState} />
        </span>
      </td>

      {/*
        Ohne Call bleibt die Zelle **leer**. „— ohne Call —" aus der
        Buchungstabelle zu übernehmen wäre ein neuer Oberflächentext in dieser
        Ansicht; in einer Tabelle ist eine leere Zelle keine Lücke, weil der
        Spaltenkopf die Frage schon gestellt hat und eine Vorlesehilfe ihn zu
        jeder Zelle mitliest. Dasselbe gilt für Frist und Tags.

        Gekürzt wird die Nummer **nie**: Wer aus dem Add-in den Hinweis „diesen
        Call gibt es schon" bekommt, sucht ihn hier (A-10.9).
      */}
      <td className="todo-cell--call">
        {todo.callNumber === null ? null : (
          <span className="mono">
            <Foreign value={todo.callNumber} />
          </span>
        )}
      </td>

      {/*
        Der Titel wird **nicht gekürzt, sondern umgebrochen**. Der Bestand
        behandelt denselben Wert in derselben Rolle schon so (die Exporttabelle);
        `.truncate` trägt er nur in der Nebenrolle. Ein Titelattribut wäre bei
        Tastaturfokus nicht erreichbar, und ein Deckel verbirgt Inhalt, ohne daß
        ein Lauf es merkt.
      */}
      <td className="todo-cell--title">
        <a className="todo-row__title" href={href("todo", todo.id)}>
          <Foreign value={todo.title} />
        </a>
      </td>

      <td className="todo-cell--status">
        <Foreign className="todo-row__status" value={statusName} />
      </td>

      {/*
        Die Frist (A-19.4): sichtbar, ohne das Todo zu öffnen — und ohne Frist
        steht hier gar nichts (A-19.5). Überfälligkeit bleibt eine Aussage der
        **Zelle**; die Zeilenfärbung bleibt dem laufenden Timer vorbehalten,
        denn zwei konkurrierende Zeilenfärbungen machen beide unlesbar.
      */}
      <td className="todo-cell--deadline">
        <DeadlineFlag dueDate={todo.dueDate} today={today} />
      </td>

      <td className="todo-cell--tags">
        <TodoTagsCell
          count={todo.tagIds.length}
          tags={tagLabels}
          open={tagsOpen}
          onOpenChange={(open) => onOpenTags(open ? todo.id : null)}
        />
      </td>

      <td className="todo-cell--bookings">
        <ExportSummaryStrip summary={summary} />
      </td>

      <td className="todo-cell--actions table__cell--end">
        <span className="todo-cell__actions">
          <IconButton
            size="sm"
            label={
              running
                ? `Timer für ${quotedName(todo.title)} stoppen`
                : `Timer für ${quotedName(todo.title)} starten`
            }
            icon={running ? "pause" : "play"}
            variant={running ? "primary" : "ghost"}
            onClick={row.onToggleTimer}
          />
          <Menu
            trigger={<Icon name="more-horizontal" size={16} />}
            triggerLabel={`Menü für ${quotedName(todo.title)}`}
            triggerClassName="table__row-menu"
            entries={menu}
            align="end"
          />
        </span>
      </td>
    </tr>
  );
}
