import { useCallback, useMemo, useState } from "react";
import {
  clearTodoDone,
  deleteTodo,
  listTodos,
  markTodoDone,
  updateTodo,
} from "../api/endpoints";
import { errorMessage } from "../api/client";
import type { Todo, TodoStatus } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DoneFlag } from "../components/DoneFlag";
import { FilterBar, FilterToggle, SearchField, type ActiveFilter } from "../components/FilterBar";
import { Select } from "../components/Select";
import { Icon } from "../components/Icon";
import { ExportSummaryStrip } from "../components/Kanban";
import { Menu, type MenuEntry } from "../components/Menu";
import { Button, EmptyState, IconButton } from "../components/Primitives";
import { TagChip } from "../components/Tag";
import { TagInput } from "../components/TagInput";
import { EMPTY_SUMMARY, loadExportSummaries, type ExportSummary } from "../app/exportSummary";
import { useRefresh } from "../app/RefreshContext";
import { href, navigate } from "../app/router";
import { useStructure } from "../app/StructureContext";
import { useTimer } from "../app/TimerContext";
import { useToasts } from "../app/ToastContext";
import { undoDoneAction } from "../app/undoDone";
import { useAsync } from "../app/useAsync";
import { cx } from "../lib/cx";
import { formatCount, plural } from "../lib/format";
import { doneFlagState, type DoneFlagState } from "../lib/labels";
import { doneMovementSentence, withMovement } from "../lib/movement";
import { AsyncBoundary, RefreshHint, ScreenHeader } from "./parts";
import { TodoFormDialog } from "./TodoFormDialog";
import { foreignText, quotedName } from "../lib/foreign";
import { Foreign } from "../components/Foreign";

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
   * Bis dahin gab es diesen Filter zwar in der Abfrage, aber **kein
   * Bedienelement** dafür: Setzen ließ er sich nur über einen Klick auf ein
   * Tag-Chip in einer anderen Ansicht, und wieder loswerden nur über das Chip
   * in der Filterleiste. Ein Filter, den man nicht einstellen kann, ist keiner.
   * Die Adresse darf weiterhin genau ein Tag mitbringen — mehr hat sie nie
   * geschrieben.
   */
  const initialTag = query["tag"];
  const [tagIds, setTagIds] = useState<readonly string[]>(
    initialTag === undefined || initialTag.length === 0 ? [] : [initialTag],
  );
  const [showDone, setShowDone] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

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
    }),
    [search, statusId, poolId, tagIds, showDone],
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
  }, [filter, limit, showDone], [version]);

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
    return entries;
  }, [search, statusId, poolId, tagIds, showDone, statuses, pools, structure]);

  const resetAll = useCallback(() => {
    setSearch("");
    setStatusId("");
    setPoolId("");
    setTagIds([]);
    setShowDone(false);
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
                showDone
                  ? unchanged
                  : `Es verschwindet damit aus dieser Liste, solange erledigte ausgeblendet sind. ${unchanged}`,
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
    <section className="screen">
      <ScreenHeader
        title="Todos"
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
        <FilterBar
          label="Todos filtern"
          resultLabel={
            list.state.status === "ready"
              ? plural(list.state.value.page.total, "Todo", "Todos")
              : "wird geladen …"
          }
          activeFilters={activeFilters}
          onResetAll={resetAll}
          controls={
            <>
              <SearchField
                label="Todos durchsuchen"
                value={search}
                onChange={setSearch}
                placeholder="Titel oder Call-Nummer …"
                busy={list.state.status === "ready" && list.state.refreshing}
              />
              <Select
                label="Status"
                value={statusId}
                onChange={setStatusId}
                options={[
                  { value: "", label: "Jeder Status" },
                  ...statuses.map((status) => ({ value: status.id, label: status.name })),
                ]}
              />
              <Select
                label="Pool"
                value={poolId}
                onChange={setPoolId}
                options={[
                  { value: "", label: "Alle Pools" },
                  ...pools.map((pool) => ({ value: pool.id, label: pool.name })),
                ]}
              />
              <TagInput
                label="Tags"
                size="lg"
                value={tagIds}
                onChange={setTagIds}
                placeholder="Nach Tag filtern …"
              />
              <FilterToggle
                label="Erledigte einblenden"
                pressed={showDone}
                onChange={setShowDone}
                hint="Voreingestellt ausgeblendet"
              />
            </>
          }
        />
      </ScreenHeader>

      <AsyncBoundary
        state={list.state}
        label="Todos werden geladen"
        rows={6}
        onRetry={list.reload}
      >
        {(value, refreshing) => {
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
                    description="Takt erfasst Zeit auf Todos. Legen Sie das erste an — Titel genügt."
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
              <RefreshHint active={refreshing} />

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
          "Hängt an dem Todo eine bereits exportierte Buchung, lehnt Takt das Löschen ab: Abgerechnete Zeit wird nicht durch das Löschen eines Todos entfernt."
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

/* ==================================================================== */
/* Zeile                                                                */
/* ==================================================================== */

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
  readonly onToggleDone: () => void;
  readonly onToggleTimer: () => void;
  readonly menu: readonly MenuEntry[];
  readonly tagLabels: ReadonlyArray<{ readonly tag: { readonly name: string }; readonly path: readonly string[] }>;
}

function TodoRow({
  todo,
  summary,
  statusName,
  running,
  doneState,
  onToggleDone,
  onToggleTimer,
  menu,
  tagLabels,
}: TodoRowProps) {
  const done = todo.completedAt !== null;
  const visibleTags = tagLabels.slice(0, 3);
  const hiddenTags = tagLabels.length - visibleTags.length;

  return (
    <li className={cx("todo-row", done && "todo-row--done", running && "todo-row--running")}>
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
            <span className="todo-row__call">Call {todo.callNumber}</span>
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
