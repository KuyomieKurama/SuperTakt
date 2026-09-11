import { useCallback, useMemo, useState } from "react";
import {
  clearTodoDone,
  deleteTodo,
  listTodos,
  markTodoDone,
  updateTodo,
} from "./api";
import { errorMessage } from "../../api/client";
import type {
  Todo,
  TodoStatus,
} from "../../api/types";
import type {
  DueSortDirection,
  DueState,
} from "./api";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { type ActiveFilter } from "../../shared/ui/FilterBar";
import { Icon } from "../../shared/ui/Icon";
import { type MenuEntry } from "../../shared/ui/Menu";
import { Button, EmptyState } from "../../shared/ui/Primitives";
import { EMPTY_SUMMARY, loadExportSummaries } from "../../app/exportSummary";
import { useRefresh } from "../../app/RefreshContext";
import { navigate } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import { useTimer } from "../timer/TimerContext";
import { useToasts } from "../../app/ToastContext";
import { undoDoneAction } from "./undoDone";
import { useAsync } from "../../app/useAsync";
import { useToday } from "../../app/useToday";
import { formatCount, plural } from "../../lib/format";
import { doneFlagState } from "../../lib/labels";
import { doneMovementSentence, withMovement } from "../../lib/movement";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import { TodoRow } from "./TodoRow";
import { TodoListFilters, DEADLINE_FILTER_LABEL, TODO_SORT_LABEL } from "./TodoListFilters";
import { TodoFormDialog } from "./TodoFormDialog";
import { foreignText, quotedName } from "../../lib/foreign";

/**
 * Takt — S-02, die Todo-Liste.
 *
 * ## Drei Festlegungen, die diese Ansicht trägt
 *
 * **E-039 — erledigte Todos sind ausgeblendet, aber einblendbar.** Das ist
 * kein Filtergeschmack: A-2.5 funktioniert genau dadurch, dass ein erledigtes
 * Todo aus den Pool-Ansichten verschwindet und beim Timerstart zurückkehrt.
 * Wäre das Ausblenden selbst unsichtbar, verschwänden Todos ohne Grund
 * (Befund B-19) — deshalb steht die Zahl der ausgeblendeten dort, wo sie
 * fehlen, mit einem Schalter daneben.
 *
 * **E-023 — Erledigt ist ein Kennzeichen, keine Spalte.** Das Kontrollkästchen
 * setzt und nimmt es zurück (I-03). Der Status des Todos steht in derselben
 * Zeile und ändert sich dabei nicht. Welche Statuswerte es überhaupt gibt,
 * wird seit T-073 in den Einstellungen festgelegt (A-5.4).
 *
 * **E-027 — jede Zeile hat ihre Timer-Aktion.** Startet der Timer auf einem
 * erledigten Todo, hebt das „Erledigt“ auf (A-2.5, I-05); die Zeile bleibt
 * stehen, das Kennzeichen wechselt, und der Toast sagt beides.
 */

const PAGE_SIZE = 100;

/**
 * Der Wert aus der Adresse, geprüft.
 *
 * Was in der Adresszeile steht, hat niemand geprüft — ein `as DeadlineFilter`
 * darauf wäre eine Behauptung über einen Wert, den ein Benutzer selbst tippt.
 * Ein unbekannter Wert bedeutet hier schlicht „kein Filter": Die Liste zeigt
 * dann alles, statt eine Fehlerfläche für eine verrutschte Adresse zu bauen.
 */
function asDueState(value: string | undefined): DueState | "" {
  if (value === undefined) return "";
  return value in DEADLINE_FILTER_LABEL ? (value as DueState) : "";
}

export interface TodoListScreenProps {
  readonly query: Readonly<Record<string, string>>;
}

export function TodoListScreen({ query }: TodoListScreenProps) {
  const structure = useStructure();
  const timer = useTimer();
  const toasts = useToasts();
  const { version, bump } = useRefresh();

  const [search, setSearch] = useState(query["q"] ?? "");
  const [statusId, setStatusId] = useState<string>(query["spalte"] ?? "");
  const [poolId, setPoolId] = useState<string>(query["pool"] ?? "");
  /*
   * Mehrere Tags statt eines (T-059).
   *
   * **Die Adresse bringt weiterhin genau ein Tag mit** — mehr hat sie nie
   * geschrieben. Deshalb steht hier ein einzelner Wert aus der Abfrage und
   * eine Liste im Zustand.
   *
   * Vorgeschichte: `docs/decisions/todos.md`.
   */
  const initialTag = query["tag"];
  const [tagIds, setTagIds] = useState<readonly string[]>(
    initialTag === undefined || initialTag.length === 0 ? [] : [initialTag],
  );
  const [showDone, setShowDone] = useState(false);
  /*
    Frist: filtern und ordnen (A-19.20, E-074 Punkt 1). Beides ist **Anzeige**
    und keine Achse — die Frist geht weiterhin nicht in Pools, nicht in Spalten
    und nicht in den Export.

    `sort` steht auf `recent`, also der bisherigen Ordnung des Dienstes. Eine
    Liste, die sich beim ersten Öffnen anders sortiert als gestern, wäre eine
    Umstellung und keine Ergänzung (A-19.16).
  */
  const [deadlineFilter, setDeadlineFilter] = useState<DueState | "">(() =>
    asDueState(query["frist"]),
  );
  const [sort, setSort] = useState<DueSortDirection | "">("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  /*
    Der heutige Tag, der von selbst aktuell bleibt (E-073 Punkt 2). **Einer je
    Ansicht** und nicht einer je Zeile: So wechseln alle Zeilen im selben
    Augenblick, und es läuft ein Zeitgeber statt hundert.
  */
  const today = useToday();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const statuses = structure.state.status === "ready" ? structure.state.value.statuses : [];
  const pools = structure.state.status === "ready" ? structure.state.value.pools : [];

  const filter = useMemo(
    () => ({
      ...(search.trim().length === 0 ? {} : { search: search.trim() }),
      ...(statusId.length === 0 ? {} : { statusIds: [statusId] }),
      ...(poolId.length === 0 ? {} : { poolIds: [poolId] }),
      ...(tagIds.length === 0 ? {} : { tagIds }),
      ...(showDone ? {} : { onlyOpen: true }),
      ...(deadlineFilter === "" ? {} : { dueStates: [deadlineFilter] }),
      ...(sort === "" ? {} : { sortByDueDate: sort }),
    }),
    [search, statusId, poolId, tagIds, showDone, deadlineFilter, sort],
  );

  const list = useAsync(async () => {
    const [page, summaries, all] = await Promise.all([
      listTodos(filter, { limit }),
      loadExportSummaries(),
      // Wie viele wären es ohne die Ausblendung? Nur dann gefragt, wenn
      // ausgeblendet wird — sonst ist die Zahl bereits bekannt.
      showDone ? Promise.resolve(null) : listTodos({ ...filter, onlyOpen: false }, { limit: 1 }),
    ]);
    return { page, summaries, totalWithDone: all?.total ?? page.total };
    /*
      `today` steht in dieser Liste, obwohl es im Rumpf nicht vorkommt — und
      genau deshalb (T-154, Befund O-CO).

      Der Fristfilter geht als `dueStates` an den Dienst, und **dort** wird
      „überfällig" gegen den heutigen Tag gerechnet, bei jeder Antwort neu
      (E-070 Punkt 3). Die Antwort altert also, ohne dass sich eine der
      übrigen Abhängigkeiten rührt: Um Mitternacht wandert ein Todo von „heute
      fällig" nach „überfällig", die gefilterte Liste zeigt aber weiter den
      Stand von gestern. Die Marken an den Zeilen wechseln in diesem Augenblick
      (sie hängen an demselben `today`) — die Liste, in der sie stehen, tut es
      ohne diese Zeile nicht, und die beiden widersprächen sich.

      Es kostet einen Lauf je Tag. Ohne Fristfilter kommt dieselbe Seite zurück.
    */
  }, [filter, limit, showDone, today], [version]);

  const activeFilters = useMemo<readonly ActiveFilter[]>(() => {
    const entries: ActiveFilter[] = [];
    if (search.trim().length > 0) {
      entries.push({ id: "q", field: "Suche", value: search.trim(), onRemove: () => setSearch("") });
    }
    const status = statuses.find((candidate) => candidate.id === statusId);
    if (status !== undefined) {
      entries.push({ id: "spalte", field: "Status", value: status.name, onRemove: () => setStatusId("") });
    }
    /*
      Der Name kommt aus **allen** Regeln und nicht nur aus den Pools (E-054):
      Wer aus einer Board-Spalte hierher springt, filtert nach einer Regel mit
      Anzeigeort „Board". Sie steht nicht in der Pool-Auswahl — ohne diesen
      Rueckgriff wirkte der Filter, ohne dass er angezeigt wuerde, und
      niemand faende heraus, warum die Liste kurz ist.
    */
    if (poolId.length > 0) {
      const poolName = structure.ruleName(poolId);
      entries.push({
        id: "pool",
        field: "Regel",
        value: poolName ?? "unbekannte Regel",
        onRemove: () => setPoolId(""),
      });
    }
    for (const id of tagIds) {
      const tag = structure.tagInfo(id);
      entries.push({
        id: `tag-${id}`,
        field: "Tag",
        value: tag?.tag.name ?? "Unbekannt",
        onRemove: () => setTagIds((previous) => previous.filter((other) => other !== id)),
      });
    }
    if (showDone) {
      entries.push({
        id: "done",
        field: "Erledigte",
        value: "eingeblendet",
        onRemove: () => setShowDone(false),
      });
    }
    if (deadlineFilter !== "") {
      entries.push({
        id: "frist",
        field: "Frist",
        value: DEADLINE_FILTER_LABEL[deadlineFilter],
        onRemove: () => setDeadlineFilter(""),
      });
    }
    /*
      Die **Ordnung** steht als eigener Eintrag in der Leiste, obwohl sie kein
      Filter ist. Grund: Sie ändert, welches Todo oben steht, und wer eine
      Liste in ungewohnter Reihenfolge vorfindet, sucht den Grund zuerst bei
      den Filtern. Ein Eintrag, der ihn nennt und zurücksetzt, spart das.
    */
    if (sort !== "") {
      entries.push({
        id: "sort",
        field: "Ordnung",
        value: TODO_SORT_LABEL[sort],
        onRemove: () => setSort(""),
      });
    }
    return entries;
  }, [search, statusId, poolId, tagIds, showDone, deadlineFilter, sort, statuses, pools, structure]);

  const resetAll = useCallback(() => {
    setSearch("");
    setStatusId("");
    setPoolId("");
    setTagIds([]);
    setShowDone(false);
    setDeadlineFilter("");
    setSort("");
  }, []);

  const toggleDone = useCallback(
    (todo: Todo) => {
      const wasDone = todo.completedAt !== null;
      void (wasDone ? clearTodoDone(todo.id) : markTodoDone(todo.id))
        .then((result) => {
          /*
            Der Anzeigezustand „Erledigt aufgehoben" endet, sobald der
            Benutzer das Kennzeichen selbst anfasst (A-2.5). Er erklaert eine
            Aenderung, die Takt vorgenommen hat — nach einer eigenen bliebe
            er als Behauptung stehen.
          */
          timer.clearReactivated(todo.id);
          bump();
          /*
            Der Bewegungssatz aus der Antwort (E-060 Punkt 4). Er nennt die
            Pools und Spalten beim Namen und ersetzt damit die pauschale
            Auskunft, die bis T-102 hier stand: „Es erscheint wieder in seinen
            Pools und auf dem Board" beziehungsweise „Es verschwindet … aus
            seinen Pools und vom Board". Beide Sätze rieten — eine Regel ohne
            Erledigt-Achse behält das Todo, und welche Regel es überhaupt
            trifft, weiß allein der Dienst. Meldet er keine Bewegung, bleibt es
            bei der Auskunft über **diese Liste**, denn die hängt an der
            Ansichtseinstellung und nicht an einer Regel.
          */
          const movement = doneMovementSentence(result.poolMovement, wasDone);
          const unchanged = "Der Status bleibt unverändert.";
          if (wasDone) {
            toasts.show({
              tone: "info",
              title: `${quotedName(todo.title)} ist wieder offen.`,
              body: withMovement(unchanged, movement),
            });
          } else {
            toasts.show({
              tone: "success",
              title: `${quotedName(todo.title)} ist erledigt.`,
              body: withMovement(
                showDone ? unchanged : `Aus dieser Liste ausgeblendet. ${unchanged}`,
                movement,
              ),
              action: undoDoneAction(todo.id, todo.title, toasts, bump),
            });
          }
        })
        .catch((cause: unknown) =>
          toasts.failure("Das Kennzeichen ließ sich nicht ändern", errorMessage(cause)),
        );
    },
    [bump, showDone, timer, toasts],
  );

  const confirmDelete = useCallback(() => {
    const todo = pendingDelete;
    if (todo === null) return;
    setDeleting(true);
    setDeleteError(null);
    void deleteTodo(todo.id)
      .then(() => {
        setPendingDelete(null);
        bump();
        toasts.success("Todo gelöscht.", `${quotedName(todo.title)} ist entfernt.`);
      })
      .catch((cause: unknown) => {
        setDeleteError(
          cause instanceof Error
            ? cause.message
            : "Das Todo ließ sich nicht löschen.",
        );
      })
      .finally(() => setDeleting(false));
  }, [bump, pendingDelete, toasts]);

  /**
   * Den Status setzen, ohne einen Dialog zu oeffnen (I-02).
   *
   * Seit E-054 ist der Status keine Kanban-Spalte mehr und laesst sich auf dem
   * Board nicht mehr durch Ziehen aendern. Damit er nicht schwerer erreichbar
   * ist als vorher, steht er hier als ein Griff im Zeilenmenue — nicht nur
   * als Feld im Bearbeiten-Dialog.
   */
  const setStatus = useCallback(
    (todo: Todo, status: TodoStatus) => {
      void updateTodo(todo.id, { statusId: status.id })
        .then(() => {
          bump();
          toasts.success(
            `Status geändert: ${foreignText(status.name)}.`,
            `${quotedName(todo.title)} steht jetzt auf ${quotedName(status.name)}. Tags und Kanban-Spalten bleiben unberührt.`,
          );
        })
        .catch((cause: unknown) =>
          toasts.failure("Der Status ließ sich nicht ändern", errorMessage(cause)),
        );
    },
    [bump, toasts],
  );

  const rowMenu = useCallback(
    (todo: Todo): readonly MenuEntry[] => [
      {
        id: "open",
        label: "Öffnen",
        icon: "pencil",
        onSelect: () => navigate("todo", todo.id),
      },
      {
        id: "edit",
        label: "Bearbeiten",
        icon: "pencil",
        onSelect: () => {
          setEditing(todo);
          setFormOpen(true);
        },
      },
      { kind: "separator", id: "sep-status" },
      ...statuses.map<MenuEntry>((status) => ({
        id: `status-${status.id}`,
        label: `Status: ${foreignText(status.name)}`,
        icon: "chevron-right",
        disabled: status.id === todo.statusId,
        ...(status.id === todo.statusId ? { disabledReason: "Aktueller Status" } : {}),
        onSelect: () => setStatus(todo, status),
      })),
      { kind: "separator", id: "sep-done" },
      {
        id: "done",
        label: todo.completedAt === null ? "Als erledigt markieren" : "Erledigt zurücknehmen",
        icon: todo.completedAt === null ? "check" : "rotate-ccw",
        onSelect: () => toggleDone(todo),
      },
      { kind: "separator", id: "sep" },
      {
        id: "delete",
        label: "Löschen",
        icon: "trash",
        tone: "danger",
        onSelect: () => {
          setDeleteError(null);
          setPendingDelete(todo);
        },
      },
    ],
    [setStatus, statuses, toggleDone],
  );

  return (
    <section className="screen todo-screen">
      <ScreenHeader
        title="Todos"
        refreshing={list.state.status === "ready" && list.state.refreshing}
        lead="Alles, wofür Zeit erfasst wird. Erledigte sind ausgeblendet, bis Sie sie einblenden."
        actions={
          <Button
            variant="primary"
            iconStart="plus"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            Neues Todo
          </Button>
        }
      >
        <TodoListFilters
          search={search} onSearchChange={setSearch}
          statusId={statusId} onStatusChange={setStatusId} statuses={statuses}
          poolId={poolId} onPoolChange={setPoolId} pools={pools}
          tagIds={tagIds} onTagsChange={setTagIds}
          deadlineFilter={deadlineFilter} onDeadlineChange={setDeadlineFilter}
          sort={sort} onSortChange={setSort}
          showDone={showDone} onShowDoneChange={setShowDone}
          busy={list.state.status === "ready" && list.state.refreshing}
          resultLabel={list.state.status === "ready" ? plural(list.state.value.page.total, "Todo", "Todos") : "wird geladen …"}
          activeFilters={activeFilters}
          onResetAll={resetAll}
        />
      </ScreenHeader>

      <AsyncBoundary
        state={list.state}
        label="Todos werden geladen"
        rows={6}
        onRetry={list.reload}
      >
        {(value) => {
          const hiddenCount = showDone ? 0 : Math.max(0, value.totalWithDone - value.page.total);
          const todos = value.page.items;

          if (todos.length === 0) {
            return (
              <>
                <HiddenDoneNotice count={hiddenCount} onShow={() => setShowDone(true)} />
                {activeFilters.length === 0 ? (
                  <EmptyState
                    icon="inbox"
                    title="Noch kein Todo"
                    description="SuperTakt erfasst Zeit auf Todos. Legen Sie das erste an — Titel genügt."
                    action={
                      <Button
                        variant="primary"
                        iconStart="plus"
                        onClick={() => {
                          setEditing(undefined);
                          setFormOpen(true);
                        }}
                      >
                        Neues Todo
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon="search"
                    title="Kein Todo passt zu diesen Filtern"
                    description="Setzen Sie einen Filter zurück oder blenden Sie erledigte Todos ein."
                    action={
                      <Button variant="secondary" iconStart="rotate-ccw" onClick={resetAll}>
                        Filter zurücksetzen
                      </Button>
                    }
                  />
                )}
              </>
            );
          }

          return (
            <>
              <HiddenDoneNotice count={hiddenCount} onShow={() => setShowDone(true)} />

              <ul className="todo-list" aria-label="Todos">
                {todos.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    summary={value.summaries.byTodo.get(todo.id) ?? EMPTY_SUMMARY}
                    statusName={structure.statusName(todo.statusId)}
                    running={timer.isRunningFor(todo.id)}
                    doneState={doneFlagState(
                      todo.completedAt !== null,
                      timer.reactivated.has(todo.id),
                    )}
                    today={today}
                    onToggleDone={() => toggleDone(todo)}
                    onToggleTimer={() => timer.toggle(todo.id, todo.title)}
                    menu={rowMenu(todo)}
                    tagLabels={todo.tagIds
                      .map((id) => structure.tagInfo(id))
                      .filter((info): info is NonNullable<typeof info> => info !== undefined)}
                  />
                ))}
              </ul>

              {value.page.nextCursor === null && todos.length >= value.page.total ? null : (
                <div className="list-more">
                  <Button
                    variant="secondary"
                    onClick={() => setLimit((current) => current + PAGE_SIZE)}
                    disabled={todos.length >= value.page.total}
                  >
                    Weitere laden ({formatCount(Math.max(0, value.page.total - todos.length))} übrig)
                  </Button>
                </div>
              )}
            </>
          );
        }}
      </AsyncBoundary>

      <TodoFormDialog
        open={formOpen}
        {...(editing === undefined ? {} : { todo: editing })}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Todo löschen?"
        description={
          pendingDelete === null
            ? ""
            : `${quotedName(pendingDelete.title)} wird mit allen noch nicht exportierten Zeitbuchungen entfernt.`
        }
        consequence={
          deleteError ??
          "Hängt an dem Todo eine bereits exportierte Buchung, lehnt SuperTakt das Löschen ab: Abgerechnete Zeit wird nicht durch das Löschen eines Todos entfernt."
        }
        confirmLabel="Endgültig löschen"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

/* ==================================================================== */
/* Ausgeblendete erledigte Todos (B-19, E-039)                          */
/* ==================================================================== */

function HiddenDoneNotice({
  count,
  onShow,
}: {
  readonly count: number;
  readonly onShow: () => void;
}) {
  if (count === 0) return null;
  return (
    <p className="hidden-notice">
      <Icon name="info" size={14} />
      <span>
        {plural(count, "erledigtes Todo ist", "erledigte Todos sind")} ausgeblendet. Startet der
        Timer auf einem davon, ist es wieder offen und erscheint hier erneut.
      </span>
      <Button size="sm" variant="ghost" onClick={onShow}>
        Einblenden
      </Button>
    </p>
  );
}
