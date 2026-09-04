import { useCallback, useMemo, useState } from "react";
import { errorMessage } from "../api/client";
import { listTimeEntries, listTodos, resetExportStatus } from "../api/endpoints";
import type { ExportStatus, Id, TimeEntry } from "../api/types";
import { exportDisplayState, type ExportDisplayState } from "../components/ExportStatus";
import {
  BookingTable,
  TableShell,
  type BookingRowData,
  type SortColumn,
  type SortDirection,
} from "../components/BookingTable";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FilterBar, FilterToggle, SearchField, type ActiveFilter } from "../components/FilterBar";
import { Select } from "../components/Select";
import { ContextMenu, type ContextMenuState, type MenuEntry } from "../components/Menu";
import { Button, EmptyState } from "../components/Primitives";
import { TextField } from "../components/FormDialog";
import { useRefresh } from "../app/RefreshContext";
import { navigate } from "../app/router";
import { useToasts } from "../app/ToastContext";
import { useAsync } from "../app/useAsync";
import {
  formatDateTime,
  formatDuration,
  formatPeriod,
  plural,
  shiftCalendarDay,
  todayCalendarDay,
} from "../lib/format";
import { AsyncBoundary, RefreshHint, ScreenHeader } from "./parts";
import {
  BookingFormDialog,
  BookingHistoryDialog,
  NotBilledDialog,
  ResetExportDialog,
} from "./BookingDialogs";

/**
 * Takt — S-06, alle Zeitbuchungen (I-10).
 *
 * ## Der Filter kennt genau zwei Werte
 *
 * `offen` und `exportiert` (A-6.9, E-032). „Erneut offen" ist **kein dritter
 * Wert**: Eine zurückgesetzte Buchung ist offen und muss im Filter „offen"
 * enthalten sein — sonst fiele sie aus der Menge der zu exportierenden heraus,
 * und R-10 stünde auf dem Kopf (Befund B-21).
 *
 * Der Schalter „nur schon einmal exportierte" ist deshalb ausdrücklich eine
 * **Einengung innerhalb** eines Status und kein Statuswert. Er sitzt neben dem
 * Statusfeld, nicht darin, und die Beschriftung sagt es.
 */

const PAGE_SIZE = 200;

/** Reihenfolge der Anzeigezustände beim Sortieren nach Status. */
const STATE_ORDER: readonly ExportDisplayState[] = ["open", "reopened", "exported", "not_billed"];

export interface BookingsScreenProps {
  readonly query: Readonly<Record<string, string>>;
}

export function BookingsScreen({ query }: BookingsScreenProps) {
  const toasts = useToasts();
  const { version, bump } = useRefresh();

  const [status, setStatus] = useState<ExportStatus | "">((query["status"] as ExportStatus) ?? "");
  const [onlyPrevious, setOnlyPrevious] = useState(false);
  const [fromDay, setFromDay] = useState(query["von"] ?? "");
  const [toDay, setToDay] = useState(query["bis"] ?? "");
  const [todoSearch, setTodoSearch] = useState("");
  const [todoId, setTodoId] = useState<string>(query["todo"] ?? "");

  const [selected, setSelected] = useState<ReadonlySet<Id>>(() => new Set());
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "period",
    direction: "descending",
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [resetEntry, setResetEntry] = useState<TimeEntry | null>(null);
  const [notBilledEntry, setNotBilledEntry] = useState<TimeEntry | null>(null);
  const [historyEntry, setHistoryEntry] = useState<TimeEntry | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const filter = useMemo(
    () => ({
      ...(status === "" ? {} : { exportStatus: status }),
      ...(onlyPrevious ? { onlyPreviouslyExported: true } : {}),
      ...(fromDay === "" ? {} : { fromDay }),
      ...(toDay === "" ? {} : { toDay }),
      ...(todoId === "" ? {} : { todoId }),
    }),
    [status, onlyPrevious, fromDay, toDay, todoId],
  );

  const data = useAsync(async () => {
    const [page, todos] = await Promise.all([
      listTimeEntries(filter, { limit: PAGE_SIZE }),
      listTodos({}, { limit: 200 }),
    ]);
    const titles = new Map<Id, { title: string; callNumber: string | null }>();
    for (const todo of todos.items) {
      titles.set(todo.id, { title: todo.title, callNumber: todo.callNumber });
    }
    return { page, titles, todos: todos.items };
  }, [filter], [version]);

  const activeFilters = useMemo<readonly ActiveFilter[]>(() => {
    const entries: ActiveFilter[] = [];
    if (status !== "") {
      entries.push({
        id: "status",
        field: "Exportstatus",
        value: status === "open" ? "Offen" : "Exportiert",
        onRemove: () => setStatus(""),
      });
    }
    if (onlyPrevious) {
      entries.push({
        id: "prev",
        field: "Einengung",
        value: "schon einmal exportiert",
        onRemove: () => setOnlyPrevious(false),
      });
    }
    if (fromDay !== "") {
      entries.push({ id: "von", field: "Ab", value: fromDay, onRemove: () => setFromDay("") });
    }
    if (toDay !== "") {
      entries.push({ id: "bis", field: "Bis", value: toDay, onRemove: () => setToDay("") });
    }
    if (todoId !== "") {
      entries.push({ id: "todo", field: "Todo", value: "eingeschränkt", onRemove: () => setTodoId("") });
    }
    return entries;
  }, [status, onlyPrevious, fromDay, toDay, todoId]);

  const resetAll = useCallback(() => {
    setStatus("");
    setOnlyPrevious(false);
    setFromDay("");
    setToDay("");
    setTodoId("");
    setTodoSearch("");
  }, []);

  const toggleRow = useCallback((id: Id) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const bulkReset = useCallback(
    (reason: string) => {
      const entries = data.state.status === "ready" ? data.state.value.page.items : [];
      const targets = entries.filter(
        (entry) => selected.has(entry.id) && entry.exportStatus === "exported",
      );
      if (targets.length === 0) return;

      setBulkBusy(true);
      void (async () => {
        let done = 0;
        /*
          Warum abgebrochen wurde, gehört in die Meldung. „3 von 7" allein
          sagt nicht, ob ein zweiter Versuch etwas ändert — und ob der Rest
          liegen bleibt oder ein Recht dazu hat, ist beim Zurücksetzen eines
          Exportstatus die teuerste offene Frage (R-10).
        */
        let failure: string | null = null;
        for (const entry of targets) {
          try {
            await resetExportStatus(entry.id, reason);
            done += 1;
          } catch (cause) {
            failure = errorMessage(cause);
            break;
          }
        }
        setBulkBusy(false);
        setBulkOpen(false);
        setSelected(new Set());
        bump();
        if (done === targets.length) {
          toasts.show({
            tone: "warning",
            title: `${plural(done, "Buchung ist", "Buchungen sind")} wieder offen.`,
            body: "Dieselbe Arbeitszeit geht beim nächsten Export erneut in die Abrechnung. Jeder Vorgang steht mit Ihrer Begründung im Protokoll.",
          });
        } else {
          toasts.failure(
            "Nicht alles ließ sich zurücksetzen",
            `${String(done)} von ${String(targets.length)} Buchungen sind wieder offen. Der Rest blieb unverändert.${failure === null ? "" : ` Abgebrochen wurde bei: ${failure}`}`,
          );
        }
      })();
    },
    [bump, data.state, selected, toasts],
  );

  const rowMenu = useCallback(
    (row: BookingRowData): readonly MenuEntry[] => {
      const entries = data.state.status === "ready" ? data.state.value.page.items : [];
      const entry = entries.find((candidate) => candidate.id === row.id);
      if (entry === undefined) return [];
      const locked = entry.exportStatus === "exported";
      /*
       * Warum die Buchung gesperrt ist, entscheidet der **Anzeigezustand**
       * (E-050): Eine ausgebuchte Buchung ist ebenso gesperrt wie eine
       * exportierte, aber sie wurde nie exportiert. Stuende in der Begruendung
       * trotzdem „bereits exportiert", waere das die Luege, die E-047
       * beseitigen sollte.
       */
      const notBilled = exportDisplayState(entry.exportStatus, entry.exportCount) === "not_billed";
      const lockReason = notBilled
        ? "Diese Zeit wurde ausgebucht und ist gesperrt. Setzen Sie den Exportstatus zurück, um sie wieder zu bearbeiten."
        : "Diese Buchung wurde bereits exportiert und ist gesperrt. Setzen Sie den Exportstatus zurück, um sie zu bearbeiten.";
      return [
        {
          id: "todo",
          label: "Todo öffnen",
          icon: "arrow-up-right",
          onSelect: () => navigate("todo", entry.todoId),
        },
        {
          id: "edit",
          label: "Bearbeiten",
          icon: "pencil",
          disabled: locked,
          ...(locked ? { disabledReason: lockReason } : {}),
          onSelect: () => setEditing(entry),
        },
        // R-10, Befund C-01. Steht **vor** dem Zurücksetzen, weil es die Frage
        // beantwortet, die davor steht: Was ist mit dieser Zeit schon
        // geschehen? Ein Eintrag ohne Bedingung — auch eine nie exportierte
        // Buchung darf zeigen, dass zu ihr nichts protokolliert ist.
        {
          id: "history",
          label: "Verlauf dieser Buchung",
          icon: "clock",
          onSelect: () => setHistoryEntry(entry),
        },
        {
          id: "reset",
          label: "Exportstatus zurücksetzen",
          icon: "rotate-ccw",
          disabled: !locked,
          ...(locked ? {} : { disabledReason: "Diese Buchung ist bereits offen." }),
          onSelect: () => setResetEntry(entry),
        },
        // E-047. Der Eintrag steht nur bei offenen Buchungen zur Wahl und
        // heißt nirgends „als exportiert markieren": Exportiert wird diese
        // Zeit nicht, sie wird schlicht nicht abgerechnet.
        {
          id: "not-billed",
          label: "Nicht abrechnen",
          // Nicht der Haken (E-050): Der traegt seit jeher „Exportiert", und
          // exportiert wird diese Zeit gerade nicht. Der durchgestrichene
          // Kreis ist dasselbe Zeichen, das die Buchung danach in der Liste
          // traegt — Vorgang und Ergebnis sehen gleich aus.
          icon: "slash-circle",
          disabled: locked,
          ...(locked
            ? {
                disabledReason: notBilled
                  ? "Diese Zeit ist bereits ausgebucht."
                  : "Diese Buchung ist bereits exportiert und damit abgeschlossen.",
              }
            : {}),
          onSelect: () => setNotBilledEntry(entry),
        },
      ];
    },
    [data.state],
  );

  return (
    <section className="screen">
      <ScreenHeader
        title="Buchungen"
        lead="Alle Zeitbuchungen mit ihrem Exportstatus. Gefiltert wird über genau zwei Statuswerte."
        actions={
          <Button variant="secondary" iconStart="download" onClick={() => navigate("export")}>
            Zur Export-Ansicht
          </Button>
        }
      >
        <FilterBar
          label="Buchungen filtern"
          resultLabel={
            data.state.status === "ready"
              ? plural(data.state.value.page.total, "Buchung", "Buchungen")
              : "wird geladen …"
          }
          activeFilters={activeFilters}
          onResetAll={resetAll}
          controls={
            <>
              <Select
                label="Exportstatus"
                value={status}
                onChange={(next) => setStatus(next as ExportStatus | "")}
                options={[
                  { value: "", label: "Alle" },
                  { value: "open", label: "Offen" },
                  { value: "exported", label: "Exportiert" },
                ]}
              />
              <FilterToggle
                label="Nur schon einmal exportierte"
                pressed={onlyPrevious}
                onChange={setOnlyPrevious}
                hint="Einengung innerhalb des Status, kein eigener Statuswert"
              />
              <TextField label="Ab Tag" type="date" value={fromDay} onChange={setFromDay} />
              <TextField label="Bis Tag" type="date" value={toDay} onChange={setToDay} />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const today = todayCalendarDay();
                  setFromDay(shiftCalendarDay(today, -6));
                  setToDay(today);
                }}
              >
                Letzte 7 Tage
              </Button>
              <SearchField
                label="Todo einschränken"
                value={todoSearch}
                onChange={setTodoSearch}
                placeholder="Todo suchen …"
              />
            </>
          }
        />
      </ScreenHeader>

      {todoSearch.trim().length > 0 && data.state.status === "ready" ? (
        <ul className="pick-list pick-list--inline" aria-label="Todo für den Filter wählen">
          {data.state.value.todos
            .filter((todo) => todo.title.toLowerCase().includes(todoSearch.trim().toLowerCase()))
            .slice(0, 6)
            .map((todo) => (
              <li key={todo.id} className="pick-row">
                <Button
                  size="sm"
                  variant={todoId === todo.id ? "primary" : "secondary"}
                  onClick={() => {
                    setTodoId(todo.id);
                    setTodoSearch("");
                  }}
                >
                  {todo.title}
                </Button>
              </li>
            ))}
        </ul>
      ) : null}

      <AsyncBoundary state={data.state} label="Buchungen werden geladen" rows={8} onRetry={data.reload}>
        {(value, refreshing) => {
          const rows = toRows(value.page.items, value.titles, sort);
          const selectedEntries = value.page.items.filter((entry) => selected.has(entry.id));
          const exportedSelected = selectedEntries.filter(
            (entry) => entry.exportStatus === "exported",
          ).length;
          const selectedSeconds = selectedEntries.reduce(
            (sum, entry) => sum + entry.durationSeconds,
            0,
          );

          if (rows.length === 0) {
            return (
              <TableShell>
                <EmptyState
                  icon={activeFilters.length === 0 ? "clock" : "search"}
                  title={
                    activeFilters.length === 0
                      ? "Noch keine Zeitbuchung"
                      : "Keine Buchung passt zu diesen Filtern"
                  }
                  description={
                    activeFilters.length === 0
                      ? "Starten Sie den Timer auf einem Todo — die erste Buchung entsteht beim Stoppen."
                      : "Setzen Sie einen Filter zurück oder erweitern Sie den Zeitraum."
                  }
                  action={
                    activeFilters.length === 0 ? (
                      <Button variant="primary" iconStart="clock" onClick={() => navigate("time")}>
                        Zur Zeiterfassung
                      </Button>
                    ) : (
                      <Button variant="secondary" iconStart="rotate-ccw" onClick={resetAll}>
                        Filter zurücksetzen
                      </Button>
                    )
                  }
                />
              </TableShell>
            );
          }

          return (
            <>
              <div className="bulkbar" role="status" aria-live="polite">
                <RefreshHint active={refreshing} />
                {selected.size === 0 ? (
                  <span className="bulkbar__hint">
                    Zeilen auswählen, um mehrere Buchungen auf einmal zu bearbeiten.
                  </span>
                ) : (
                  <>
                    <span className="bulkbar__count">
                      {plural(selected.size, "Buchung ausgewählt", "Buchungen ausgewählt")} ·{" "}
                      {formatDuration(selectedSeconds)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      iconStart="rotate-ccw"
                      disabled={exportedSelected === 0}
                      onClick={() => setBulkOpen(true)}
                    >
                      Exportstatus zurücksetzen ({exportedSelected})
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                      Auswahl aufheben
                    </Button>
                  </>
                )}
              </div>

              <BookingTable
                rows={rows}
                caption="Alle Zeitbuchungen mit Exportstatus, Zeitraum, Dauer und Leistung"
                selectedIds={selected}
                onToggleRow={toggleRow}
                onToggleAll={() =>
                  setSelected((previous) =>
                    previous.size === rows.length
                      ? new Set()
                      : new Set(rows.map((row) => row.id)),
                  )
                }
                sort={sort}
                onSort={(column) =>
                  setSort((previous) =>
                    previous.column === column
                      ? {
                          column,
                          direction:
                            previous.direction === "ascending" ? "descending" : "ascending",
                        }
                      : { column, direction: "ascending" },
                  )
                }
                rowMenu={rowMenu}
                onOpenContextMenu={(row, x, y) =>
                  setContextMenu({
                    x,
                    y,
                    entries: rowMenu(row),
                    label: `Aktionen für die Buchung ${row.todoTitle}`,
                  })
                }
              />

              <ContextMenu state={contextMenu} onClose={() => setContextMenu(null)} />
            </>
          );
        }}
      </AsyncBoundary>

      {editing === null ? null : (
        <BookingFormDialog
          open
          entry={editing}
          todoId={editing.todoId}
          todoTitle={
            data.state.status === "ready"
              ? (data.state.value.titles.get(editing.todoId)?.title ?? "diesem Todo")
              : "diesem Todo"
          }
          onClose={() => setEditing(null)}
        />
      )}

      <ResetExportDialog
        open={resetEntry !== null}
        entry={resetEntry}
        todoTitle={
          resetEntry === null || data.state.status !== "ready"
            ? "diesem Todo"
            : (data.state.value.titles.get(resetEntry.todoId)?.title ?? "diesem Todo")
        }
        onClose={() => setResetEntry(null)}
      />

      <BookingHistoryDialog
        open={historyEntry !== null}
        entry={historyEntry}
        todoTitle={
          historyEntry === null || data.state.status !== "ready"
            ? "diesem Todo"
            : (data.state.value.titles.get(historyEntry.todoId)?.title ?? "diesem Todo")
        }
        onClose={() => setHistoryEntry(null)}
      />

      <NotBilledDialog
        open={notBilledEntry !== null}
        entry={notBilledEntry}
        todoTitle={
          notBilledEntry === null || data.state.status !== "ready"
            ? "diesem Todo"
            : (data.state.value.titles.get(notBilledEntry.todoId)?.title ?? "diesem Todo")
        }
        onClose={() => setNotBilledEntry(null)}
      />

      <ConfirmDialog
        open={bulkOpen}
        tone="danger"
        title="Exportstatus mehrerer Buchungen zurücksetzen?"
        description="Alle ausgewählten Buchungen, die exportiert sind, werden wieder als offen geführt."
        consequence="Dieselbe Arbeitszeit geht beim nächsten Export erneut in die Abrechnung. Jeder einzelne Vorgang wird mit dieser Begründung protokolliert."
        confirmLabel="Zurücksetzen"
        reasonLabel="Begründung für das Protokoll"
        reasonRequired
        acknowledgeLabel="Mir ist klar, dass diese Zeiten dadurch ein zweites Mal abgerechnet werden können."
        busy={bulkBusy}
        onConfirm={bulkReset}
        onCancel={() => setBulkOpen(false)}
      />
    </section>
  );
}

/**
 * Buchungen in Tabellenzeilen. Formatiert wird hier, gerechnet nicht:
 * `durationSeconds` kommt aus der Domäne, ein Exportwert je Zeile existiert
 * seit E-020 nicht (Befund B-20).
 */
function toRows(
  entries: readonly TimeEntry[],
  titles: ReadonlyMap<Id, { title: string; callNumber: string | null }>,
  sort: { column: SortColumn; direction: SortDirection },
): readonly BookingRowData[] {
  const rows = entries.map((entry) => {
    const todo = titles.get(entry.todoId);
    return {
      id: entry.id,
      exportStatus: entry.exportStatus,
      exportCount: entry.exportCount,
      source: entry.source,
      callNumber: todo?.callNumber ?? null,
      todoTitle: todo?.title ?? "Unbekanntes Todo",
      period: formatPeriod(entry.startedAt, entry.endedAt),
      duration: formatDuration(entry.durationSeconds),
      note: entry.note,
      ...(entry.exportStatus === "exported" ? { exportedAt: formatDateTime(entry.updatedAt) } : {}),
      sortPeriod: entry.startedAt,
      sortDuration: entry.durationSeconds,
      /*
       * Sortiert wird nach **Anzeigezustand** und damit nach Dringlichkeit:
       * offen, erneut offen, exportiert, nicht abgerechnet. Der Filter
       * daneben kennt weiterhin genau zwei Werte (E-032) — hier wird nur
       * geordnet, nicht ausgewählt.
       */
      sortState: STATE_ORDER.indexOf(exportDisplayState(entry.exportStatus, entry.exportCount)),
    };
  });

  const factor = sort.direction === "ascending" ? 1 : -1;
  rows.sort((left, right) => {
    if (sort.column === "duration") return (left.sortDuration - right.sortDuration) * factor;
    if (sort.column === "state") return (left.sortState - right.sortState) * factor;
    return left.sortPeriod.localeCompare(right.sortPeriod) * factor;
  });

  return rows.map(({ sortPeriod, sortDuration, sortState, ...row }) => {
    void sortPeriod;
    void sortDuration;
    void sortState;
    return row;
  });
}
