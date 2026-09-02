import { useCallback, useMemo, useState, type DragEvent } from "react";
import { errorMessage } from "../api/client";
import {
  clearTodoDone,
  createTodoStatus,
  deleteTodoStatus,
  listTodos,
  markTodoDone,
  reorderTodoStatuses,
  updateTodo,
  updateTodoStatus,
} from "../api/endpoints";
import type { Id, Todo, TodoStatus } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FilterToggle } from "../components/FilterBar";
import { FormDialog, TextField } from "../components/FormDialog";
import { KanbanCard, KanbanColumn, type KanbanCardData } from "../components/Kanban";
import type { MenuEntry } from "../components/Menu";
import { Button, EmptyState, IconButton, InlineMessage } from "../components/Primitives";
import { EMPTY_SUMMARY, loadExportSummaries } from "../app/exportSummary";
import { useRefresh } from "../app/RefreshContext";
import { navigate } from "../app/router";
import { useStructure } from "../app/StructureContext";
import { useTimer } from "../app/TimerContext";
import { useToasts } from "../app/ToastContext";
import { useAsync, useMutation } from "../app/useAsync";
import { formatDuration } from "../lib/format";
import { AsyncBoundary, ScreenHeader } from "./parts";
import { TodoFormDialog } from "./TodoFormDialog";

/**
 * Takt — S-04, das Kanban-Board (A-5, I-14, A-13.6).
 *
 * ## Zwei Achsen, die nichts voneinander wissen (E-023)
 *
 * Die **Statusspalte** sagt, wo die Karte liegt. Das **Erledigt-Kennzeichen**
 * sagt, ob das Todo fertig ist. Beide sind unabhängig, und **keine
 * Kombination ist ungültig**:
 *
 *   „In Arbeit" + offen     — der Regelfall
 *   „In Arbeit" + erledigt  — fachlich fertig, das Board wurde nicht nachgeführt
 *   „Erledigt"  + offen     — der Arbeitsfluss ist durch, das Todo nicht
 *   „Erledigt"  + erledigt  — beides trifft zu
 *
 * Deshalb: **Ziehen ändert die Spalte und sonst nichts.** Kein
 * Bestätigungsdialog, kein Erledigt-Setzen, kein Timer wird berührt — und die
 * Live-Ansage sagt das ausdrücklich, damit niemand eine Nebenwirkung vermutet
 * (I-14, T-005n Abschnitt 3).
 *
 * Der Begriff „Abschlussspalte" kommt hier nicht vor. Die letzte Spalte einer
 * Statusstruktur ist die letzte Spalte, mehr nicht.
 *
 * ## Bedienung ohne Ziehen (SC 2.5.7)
 *
 * Jede Karte lässt sich mit den Pfeiltasten links und rechts eine Spalte
 * weiterschieben, solange sie den Fokus hat. Drag & Drop ist der bequeme Weg,
 * nicht der einzige.
 */

const DRAG_MIME = "application/x-takt-todo";

/**
 * Die Ordnung **innerhalb** einer Spalte: zuletzt geändert zuerst.
 *
 * Bis Migration 0010 stand hier der Sortierschlüssel `boardRank` — aus der
 * Zeit, als Karten innerhalb einer Spalte an ihren Platz gezogen wurden
 * (A-5.2). Mit E-054 ist dieses Ziehen entfallen; geblieben ist das Ziehen
 * **zwischen** Spalten, das die Spalte ändert und sonst nichts. Damit gibt es
 * keine vom Benutzer gesetzte Reihenfolge mehr, die eine Spalte wiedergeben
 * könnte, und das Feld gibt es auch nicht mehr.
 *
 * **Warum diese Ordnung und keine andere.** Sie ist wörtlich die, in der
 * `GET /todos` die Liste ohnehin liefert (`repo-todos.ts`:
 * `ORDER BY t.updated_at DESC, t.id DESC`). Die Ansicht stellt damit keine
 * zweite Ordnung neben die des Dienstes, sie spricht dessen Ordnung aus — und
 * was zuletzt angefasst wurde, steht oben, wo man es sucht.
 *
 * **Gerechnet wird hier nicht.** Beide Felder sind Zeichenketten des Dienstes,
 * und beide sind so gebaut, dass ihr Vergleich als Text die zeitliche
 * Reihenfolge ergibt: `Timestamp` ist UTC in fester Breite („Lexikographische
 * Sortierung ist chronologisch", `takt-local-api.yaml`), `Id` ist UUID Fassung
 * 7 und nach Erzeugungszeit sortierbar. Kein `Date`, keine Zeitzone, keine
 * Dauer.
 *
 * Die Kennung ist der zweite Schlüssel, weil Zeitstempel sekundengenau sind:
 * Zwei Karten derselben Sekunde bekämen sonst die Reihenfolge, in der sie
 * zufällig hereinkamen.
 */
function byRecency(left: Todo, right: Todo): number {
  const byUpdated = right.updatedAt.localeCompare(left.updatedAt);
  return byUpdated !== 0 ? byUpdated : right.id.localeCompare(left.id);
}

export function BoardScreen() {
  const structure = useStructure();
  const timer = useTimer();
  const toasts = useToasts();
  const { version, bump } = useRefresh();

  const [showDone, setShowDone] = useState(false);
  const [dragging, setDragging] = useState<Id | null>(null);
  const [dropColumn, setDropColumn] = useState<Id | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [createIn, setCreateIn] = useState<Id | null>(null);
  const [editing, setEditing] = useState<Todo | null>(null);

  const statuses = useMemo(
    () =>
      structure.state.status === "ready"
        ? [...structure.state.value.statuses].sort((left, right) => left.position - right.position)
        : [],
    [structure.state],
  );

  const data = useAsync(async () => {
    const [todos, summaries] = await Promise.all([
      listTodos(showDone ? {} : { onlyOpen: true }, { limit: 200 }),
      loadExportSummaries(),
    ]);
    return { todos: todos.items, summaries };
  }, [version, showDone]);

  const move = useCallback(
    (todo: Todo, target: TodoStatus) => {
      if (todo.statusId === target.id) return;
      void updateTodo(todo.id, { statusId: target.id })
        .then(() => {
          bump();
          setAnnouncement(
            `„${todo.title}“ verschoben nach ${target.name}. Das Erledigt-Kennzeichen bleibt unverändert: ${todo.completedAt === null ? "offen" : "erledigt"}.`,
          );
        })
        .catch((cause: unknown) =>
          toasts.failure("Die Karte ließ sich nicht verschieben", errorMessage(cause)),
        );
    },
    [bump, toasts],
  );

  const moveByOffset = useCallback(
    (todo: Todo, delta: number) => {
      const index = statuses.findIndex((status) => status.id === todo.statusId);
      if (index < 0) return;
      const target = statuses[Math.min(Math.max(index + delta, 0), statuses.length - 1)];
      if (target === undefined) return;
      move(todo, target);
    },
    [move, statuses],
  );

  const toggleDone = useCallback(
    (todo: Todo) => {
      const wasDone = todo.completedAt !== null;
      timer.clearReactivated(todo.id);
      void (wasDone ? clearTodoDone(todo.id) : markTodoDone(todo.id))
        .then(() => {
          bump();
          toasts.show({
            tone: wasDone ? "info" : "success",
            title: wasDone
              ? `„${todo.title}“ ist wieder offen.`
              : `„${todo.title}“ ist erledigt.`,
            body: "Die Karte bleibt in ihrer Spalte — Erledigt ist ein Kennzeichen, keine Spalte.",
          });
        })
        .catch((cause: unknown) =>
          toasts.failure("Das Kennzeichen ließ sich nicht ändern", errorMessage(cause)),
        );
    },
    [bump, timer, toasts],
  );

  const cardMenu = useCallback(
    (todo: Todo): readonly MenuEntry[] => [
      { id: "open", label: "Todo öffnen", icon: "arrow-up-right", shortcut: "Eingabe", onSelect: () => navigate("todo", todo.id) },
      { id: "edit", label: "Bearbeiten", icon: "pencil", onSelect: () => setEditing(todo) },
      {
        id: "done",
        label: todo.completedAt === null ? "Als erledigt markieren" : "Erledigt zurücknehmen",
        icon: todo.completedAt === null ? "check" : "rotate-ccw",
        onSelect: () => toggleDone(todo),
      },
      { kind: "separator", id: "sep" },
      ...statuses
        .filter((status) => status.id !== todo.statusId)
        .map<MenuEntry>((status) => ({
          id: `move-${status.id}`,
          label: `Nach „${status.name}“ verschieben`,
          icon: "chevron-right",
          onSelect: () => move(todo, status),
        })),
    ],
    [move, statuses, toggleDone],
  );

  /*
   * `screen--wide` stand hier bis T-057 und hob die Breitengrenze auf, die für
   * jede andere Ansicht gilt. Gemessen bei 1920px Fensterbreite: 1440px auf
   * acht Ansichten, 1622px hier — der Inhaltsbereich sprang um 182px, sobald
   * man diesen Reiter wählte. Das Board braucht die Ausnahme nicht: `.kboard`
   * scrollt waagerecht, sobald mehr Spalten da sind, als hineinpassen.
   */
  return (
    <section className="screen">
      <ScreenHeader
        title="Kanban"
        lead="Spalten sind frei definierbar. Ziehen ändert die Spalte — und sonst nichts."
        actions={
          <>
            <FilterToggle
              label="Erledigte einblenden"
              pressed={showDone}
              onChange={setShowDone}
              hint="Voreingestellt ausgeblendet"
            />
            <Button variant="secondary" iconStart="filter" onClick={() => setColumnsOpen(true)}>
              Spalten verwalten
            </Button>
          </>
        }
      />

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      <AsyncBoundary state={data.state} label="Board wird geladen" rows={4} onRetry={data.reload}>
        {(value) => {
          if (statuses.length === 0) {
            return (
              <EmptyState
                icon="square"
                title="Es gibt noch keine Statusspalte"
                description="Ohne Spalte hat eine Karte keinen Platz. Legen Sie die erste an — zum Beispiel „Offen“, „In Arbeit“ und „Fertig“."
                action={
                  <Button variant="primary" iconStart="plus" onClick={() => setColumnsOpen(true)}>
                    Spalten verwalten
                  </Button>
                }
              />
            );
          }

          return (
            <div className="board">
              {statuses.map((status) => {
                const cards = value.todos
                  .filter((todo) => todo.statusId === status.id)
                  .sort(byRecency);
                const doneCount = cards.filter((todo) => todo.completedAt !== null).length;

                return (
                  <KanbanColumn
                    key={status.id}
                    title={status.name}
                    count={cards.length}
                    doneCount={doneCount}
                    dropTarget={dropColumn === status.id}
                    onDragOver={(event: DragEvent<HTMLElement>) => {
                      if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropColumn(status.id);
                    }}
                    onDragLeave={() => setDropColumn((current) => (current === status.id ? null : current))}
                    onDrop={(event: DragEvent<HTMLElement>) => {
                      event.preventDefault();
                      setDropColumn(null);
                      setDragging(null);
                      const todoId = event.dataTransfer.getData(DRAG_MIME);
                      const todo = value.todos.find((candidate) => candidate.id === todoId);
                      if (todo !== undefined) move(todo, status);
                    }}
                    onAdd={() => setCreateIn(status.id)}
                    entries={[
                      {
                        id: "rename",
                        label: "Spalten verwalten",
                        icon: "pencil",
                        onSelect: () => setColumnsOpen(true),
                      },
                      {
                        id: "add",
                        label: "Todo in dieser Spalte anlegen",
                        icon: "plus",
                        onSelect: () => setCreateIn(status.id),
                      },
                    ]}
                  >
                    {cards.length === 0 ? (
                      <p className="board__empty">
                        Keine Karte. Ziehen Sie eine hierher oder legen Sie eine an.
                      </p>
                    ) : (
                      cards.map((todo) => (
                        <KanbanCard
                          key={todo.id}
                          card={toCard(todo, value.summaries, structure, timer.isRunningFor(todo.id), timer.reactivated.has(todo.id))}
                          entries={cardMenu(todo)}
                          dragging={dragging === todo.id}
                          onOpen={() => navigate("todo", todo.id)}
                          onToggleTimer={() => timer.toggle(todo.id, todo.title)}
                          onMoveByKeyboard={(delta) => moveByOffset(todo, delta)}
                          onDragStart={(event: DragEvent<HTMLElement>) => {
                            event.dataTransfer.setData(DRAG_MIME, todo.id);
                            event.dataTransfer.effectAllowed = "move";
                            setDragging(todo.id);
                          }}
                          onDragEnd={() => {
                            setDragging(null);
                            setDropColumn(null);
                          }}
                        />
                      ))
                    )}
                  </KanbanColumn>
                );
              })}
            </div>
          );
        }}
      </AsyncBoundary>

      <StatusColumnsDialog open={columnsOpen} statuses={statuses} onClose={() => setColumnsOpen(false)} />

      <TodoFormDialog
        open={createIn !== null}
        {...(createIn === null ? {} : { presetStatusId: createIn })}
        onClose={() => setCreateIn(null)}
      />

      {editing === null ? null : (
        <TodoFormDialog open todo={editing} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}

function toCard(
  todo: Todo,
  summaries: { byTodo: ReadonlyMap<Id, typeof EMPTY_SUMMARY>; secondsByTodo: ReadonlyMap<Id, number> },
  structure: ReturnType<typeof useStructure>,
  timerRunning: boolean,
  reactivated: boolean,
): KanbanCardData {
  return {
    id: todo.id,
    title: todo.title,
    callNumber: todo.callNumber,
    tags: todo.tagIds
      .map((id) => structure.tagInfo(id))
      .filter((info): info is NonNullable<typeof info> => info !== undefined)
      .map((info) => ({ label: info.tag.name, path: info.path })),
    trackedDisplay: formatDuration(summaries.secondsByTodo.get(todo.id) ?? 0),
    exportSummary: summaries.byTodo.get(todo.id) ?? EMPTY_SUMMARY,
    timerRunning,
    done: todo.completedAt !== null,
    reactivated,
  };
}

/* ==================================================================== */
/* Statusspalten verwalten (A-5.4)                                      */
/* ==================================================================== */

function StatusColumnsDialog({
  open,
  statuses,
  onClose,
}: {
  readonly open: boolean;
  readonly statuses: readonly TodoStatus[];
  readonly onClose: () => void;
}) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();
  const [newName, setNewName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TodoStatus | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const after = (): void => {
    structure.reload();
    bump();
  };

  return (
    <>
      <FormDialog
        open={open}
        title="Statusspalten"
        description="Frei definierbar. Keine Spalte ist ausgezeichnet — Erledigt ist ein Kennzeichen am Todo, keine Spalte."
        submitLabel="Spalte anlegen"
        cancelLabel="Schließen"
        submitDisabled={newName.trim().length === 0}
        busy={mutation.busy}
        error={mutation.error}
        onSubmit={() => {
          void mutation.run(async () => {
            await createTodoStatus(newName.trim(), null);
            setNewName("");
            after();
            toasts.success("Spalte angelegt.");
          });
        }}
        onCancel={onClose}
      >
        <ul className="column-list">
          {statuses.map((status, index) => (
            <li key={status.id} className="column-row">
              <span className="column-row__name grow truncate">{status.name}</span>
              {status.isDefault ? (
                <span className="column-row__flag">Standardspalte</span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void mutation.run(async () => {
                      await updateTodoStatus(status.id, { isDefault: true });
                      after();
                    });
                  }}
                >
                  Als Standard
                </Button>
              )}
              <IconButton
                label={`„${status.name}“ nach links`}
                icon="chevron-right"
                size="sm"
                className="column-row__up"
                disabled={index === 0}
                onClick={() => {
                  void mutation.run(async () => {
                    const order = statuses.map((entry) => entry.id);
                    const previous = order[index - 1];
                    const current = order[index];
                    if (previous === undefined || current === undefined) return;
                    order[index - 1] = current;
                    order[index] = previous;
                    await reorderTodoStatuses(order);
                    after();
                  });
                }}
              />
              <IconButton
                label={`„${status.name}“ nach rechts`}
                icon="chevron-right"
                size="sm"
                disabled={index === statuses.length - 1}
                onClick={() => {
                  void mutation.run(async () => {
                    const order = statuses.map((entry) => entry.id);
                    const next = order[index + 1];
                    const current = order[index];
                    if (next === undefined || current === undefined) return;
                    order[index + 1] = current;
                    order[index] = next;
                    await reorderTodoStatuses(order);
                    after();
                  });
                }}
              />
              <IconButton
                label={`„${status.name}“ löschen`}
                icon="trash"
                size="sm"
                variant="danger"
                disabled={statuses.length <= 1}
                onClick={() => {
                  setDeleteError(null);
                  setPendingDelete(status);
                }}
              />
            </li>
          ))}
        </ul>

        <TextField
          label="Neue Spalte"
          value={newName}
          onChange={setNewName}
          maxLength={64}
          placeholder="z. B. Wartet auf Rückmeldung"
        />

        <InlineMessage tone="info" title="Reihenfolge und Namen gelten sofort">
          Die Karten bleiben, wo sie sind. Wird eine Spalte gelöscht, fragt Takt vorher, was mit
          ihren Karten geschehen soll.
        </InlineMessage>
      </FormDialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Statusspalte löschen?"
        description={
          pendingDelete === null ? "" : `Die Spalte „${pendingDelete.name}“ wird entfernt.`
        }
        consequence={
          deleteError ??
          "Liegen noch Karten in dieser Spalte, lehnt Takt das Löschen ab. Verschieben Sie sie vorher — dann geht keine Karte verloren."
        }
        confirmLabel="Löschen"
        onConfirm={() => {
          const status = pendingDelete;
          if (status === null) return;
          void deleteTodoStatus(status.id)
            .then(() => {
              setPendingDelete(null);
              structure.reload();
              bump();
              toasts.success("Spalte gelöscht.");
            })
            .catch((cause: unknown) => {
              setDeleteError(
                cause instanceof Error ? cause.message : "Die Spalte ließ sich nicht löschen.",
              );
            });
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

