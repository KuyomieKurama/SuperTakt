import { EMPTY_SUMMARY } from "../../app/exportSummary";
import { navigate } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import type { CalendarDay, ForeignText, Id, Todo } from "../../api/types";
import type { MenuEntry } from "../../shared/ui/Menu";
import { Button, EmptyState } from "../../shared/ui/Primitives";
import { RuleSummary } from "../structure/RuleSummary";
import { quotedName } from "../../lib/foreign";
import { formatDuration } from "../../lib/format";
import {
  axesOf,
  describeRule,
  describeStoredRuleReach,
  emptyFolderNames,
  type RuleLookup,
  type RuleReach,
} from "../../lib/poolRule";
import type { BoardColumnView } from "./api";
import { KanbanCard, KanbanColumn, type KanbanCardData } from "./Kanban";
import { boardTexts } from "./texts";

/**
 * Takt — **eine** Spalte des Boards und die Karten darin (A-5.1, A-5.3 bis
 * A-5.6, E-054).
 *
 * Die Spalte ist die Stelle, an der aus einer Regel eine Fläche wird: Sie
 * beschreibt die Regel **einmal** und liest die Beschreibung dreimal — unter
 * dem Kopf, im Leerzustand und als Grund, aus dem sie nichts trifft. Dazu die
 * beiden Umrechnungen, die nur von hier aus erreichbar sind: das Kartenmenü
 * und die Karte selbst.
 *
 * **Diese Datei führt keinen Zustand.** Sie bekommt alles als Eigenschaft und
 * gibt jede Handlung zurück; der Bildschirm daneben hält ihn. Deshalb steht
 * das Vorkommen einer Karte in mehreren Spalten hier als Auskunft und nicht
 * als Entscheidung.
 *
 * Vorgeschichte: `docs/decisions/board.md`.
 */

interface BoardColumnProps {
  readonly priorities?: readonly { id: string; name: string; weight: number }[];
  /**
   * A priority filter is active (A-27.3). An empty column then does not mean "no todo meets
   * the rule" — the filter may hide them — and the empty state says so (E-133 point 4).
   */
  readonly priorityFiltered?: boolean;
  /** Clears the priority filter; offered by the filtered empty state. */
  readonly onClearPriorityFilter?: () => void;
  readonly view: BoardColumnView;
  /**
   * Spaltenname je Kennung — **fremder Text** (O-AT, T-133). Bis dahin
   * `ReadonlyMap<Id, string>`: Die Namen fielen beim Eintritt in die Karte aus
   * ihrer Herkunft, und die Behandlung weiter unten stand nur noch da, weil
   * jemand daran gedacht hatte.
   */
  readonly columnName: ReadonlyMap<Id, ForeignText>;
  readonly appearances: ReadonlyMap<Id, readonly Id[]>;
  readonly summaries: {
    readonly byTodo: ReadonlyMap<Id, typeof EMPTY_SUMMARY>;
    readonly secondsByTodo: ReadonlyMap<Id, number>;
  };
  readonly highlighted: Id | null;
  readonly seedTagIds: readonly Id[];
  readonly lookup: RuleLookup;
  readonly entries: readonly MenuEntry[];
  readonly onEditRule: () => void;
  readonly onAdd: () => void;
  readonly onOpenTodo: (todo: Todo) => void;
  readonly onEditTodo: (todo: Todo) => void;
  readonly onToggleDone: (todo: Todo) => void;
  readonly onToggleTimer: (todo: Todo) => void;
  readonly onHighlight: (todo: Todo, otherColumns: readonly ForeignText[]) => void;
  readonly isTimerRunning: (todo: Todo) => boolean;
  readonly isReactivated: (todo: Todo) => boolean;
  readonly statusName: (todo: Todo) => ForeignText;
  /** Heute, aus `useToday` der Ansicht (E-073 Punkt 2). */
  readonly today: CalendarDay;
}

export function BoardColumn({
  priorities = [],
  priorityFiltered = false,
  onClearPriorityFilter,
  view,
  columnName,
  appearances,
  summaries,
  highlighted,
  seedTagIds,
  lookup,
  entries,
  onEditRule,
  onAdd,
  onOpenTodo,
  onEditTodo,
  onToggleDone,
  onToggleTimer,
  onHighlight,
  isTimerRunning,
  isReactivated,
  statusName,
  today,
}: BoardColumnProps) {
  const structure = useStructure();
  const column = view.column;
  const doneCount = view.todos.filter((todo) => todo.completedAt !== null).length;
  /*
   * Die Regel wird je Spalte einmal beschrieben und zweimal gelesen: unter dem
   * Kopf und im Leerzustand. Beide muessen dieselbe Antwort geben — sonst sagt
   * die eine „ohne Bedingung" und die andere zaehlt Bedingungen auf.
   */
  const description = describeRule(axesOf(column), lookup);
  /*
   * Und dieselbe Auskunft ein drittes Mal — der **Grund**, aus dem die Spalte
   * nichts trifft (E-057). Sie kommt aus der beschriebenen Regel und aus der
   * Auflösung des Dienstes und wird deshalb hier einmal gebildet: Der Ordner,
   * den der Leerzustand nennt, muss derselbe sein, den der Spaltenkopf als
   * leer markiert.
   */
  const reach = describeStoredRuleReach(description, column.resolved);

  return (
    <KanbanColumn
      title={column.name}
      count={view.todos.length}
      total={view.total}
      doneCount={doneCount}
      rule={
        <RuleSummary
          description={description}
          reach={reach}
          emptyText={boardTexts().ruleEmpty}
        />
      }
      entries={entries}
      {...(seedTagIds.length === 0
        ? {}
        : {
            onAdd,
            addLabel: boardTexts().addInNamedColumn(quotedName(column.name)),
          })}
    >
      {view.todos.length === 0 ? (
        <BoardColumnEmpty
          reach={reach}
          onEditRule={onEditRule}
          onOpenTags={() => navigate("settings", undefined, { bereich: "tags" })}
          {...(priorityFiltered && onClearPriorityFilter !== undefined ? { onClearPriorityFilter } : {})}
        />
      ) : (
        view.todos.map((todo) => {
          const others = (appearances.get(todo.id) ?? [])
            .filter((id) => id !== column.id)
            .map((id) => columnName.get(id))
            .filter((name): name is ForeignText => name !== undefined);

          return (
            <KanbanCard
              key={todo.id}
              card={toCard(
                todo,
                summaries,
                structure,
                statusName(todo),
                isTimerRunning(todo),
                isReactivated(todo),
                others,
                priorities.find(priority => priority.id === todo.priorityId),
              )}
              entries={cardMenu(todo, others.length > 0, highlighted === todo.id, {
                open: () => onOpenTodo(todo),
                edit: () => onEditTodo(todo),
                done: () => onToggleDone(todo),
                highlight: () => onHighlight(todo, others),
              })}
              highlighted={highlighted === todo.id}
              today={today}
              onOpen={() => onOpenTodo(todo)}
              onToggleTimer={() => onToggleTimer(todo)}
              {...(others.length === 0 ? {} : { onHighlight: () => onHighlight(todo, others) })}
            />
          );
        })
      )}
    </KanbanColumn>
  );
}

/* Der Leerzustand einer einzelnen Spalte                               */

/**
 * Drei Leerzustände, nicht einer und nicht zwei (T-079, E-057, T-083).
 *
 * Eine leere Spalte ist keine Auskunft, sondern eine Frage: **Warum** ist sie
 * leer? Es gibt drei Antworten darauf, und sie verlangen drei verschiedene
 * Handlungen — deshalb stehen hier drei Zustände und nicht ein Satz mit drei
 * Bedeutungen.
 *
 * | Zustand | Was los ist | Was zu tun ist |
 * |---|---|---|
 * | `no-condition` | Die Regel nennt keine Bedingung (A-3.4). | eine ergänzen |
 * | `empty-folder` | Sie verlangt Tags aus Ordnern, in denen keines liegt (E-057). | ein Tag anlegen oder einen anderen Ordner nennen |
 * | `reachable` | Die Bedingungen stehen, gerade passt nichts. | nichts |
 *
 * **Nur der mittlere ist ein Fehler.** Der erste ist der Zustand unmittelbar
 * nach dem Anlegen, der letzte löst sich mit dem nächsten passenden Todo von
 * selbst. Der mittlere löst sich **nie** — bis jemand etwas ändert, und dieser
 * jemand ist ausschließlich der Benutzer. Deshalb nennt er den betroffenen
 * Ordner beim Namen, statt nur zu sagen, dass etwas nicht stimmt: „Ein Ordner
 * ist leer" schickt ihn suchen, „Kunden / Ost ist leer" nicht.
 *
 * **Und er tritt auch neben einer gesunden Bedingung auf (T-087).** Steht der
 * leere Ordner neben einem Tagterm, sieht die Achsensumme gesund aus und die
 * Spalte ist trotzdem leer (E-057). Bis T-087 fiel dieser Fall in den dritten
 * Zustand — „gerade passt nichts" —, und damit in den einzigen, der zum Warten
 * auffordert. Erkannt wird er jetzt termweise, über
 * `resolved.emptyRuleFolderIds`.
 *
 * Alle drei unterscheiden sich in Symbol, Überschrift, Erklärung **und** der
 * angebotenen Handlung — nie nur in der Farbe (SC 1.4.1). Zwei davon „keine
 * Todos" zu nennen wäre der teuerste Leerzustand dieser Anwendung: Er
 * verschwiege den Zustand, den nur der Benutzer beheben kann, und ließe ihn
 * stattdessen auf Karten warten, die nie kommen.
 *
 * Ausgelagert und ausgeführt, weil dieselben drei Zustände auf der Musterseite
 * des Designsystems nebeneinander stehen müssen: Sie unterscheiden sich nur im
 * Text, und drei getrennt gepflegte Fassungen davon liefen binnen einer
 * Aufgabe auseinander.
 */
export function BoardColumnEmpty({
  reach,
  onEditRule,
  onOpenTags,
  onClearPriorityFilter,
}: {
  readonly reach: RuleReach;
  readonly onEditRule: () => void;
  /** Set while a priority filter is active: the empty column is then the filter's doing. */
  readonly onClearPriorityFilter?: () => void;
  /**
   * Zu den Tags — der Ort, an dem der leere Ordner gefüllt wird. Freiwillig,
   * weil die Musterseite keine Navigation hat.
   */
  readonly onOpenTags?: () => void;
}) {
  const text = boardTexts();
  if (reach.kind === "no-condition") {
    return (
      <EmptyState
        compact
        icon="alert-triangle"
        title={text.noConditionTitle}
        description={text.noConditionBody}
        action={
          <Button size="sm" variant="primary" iconStart="pencil" onClick={onEditRule}>
            {text.addCondition}
          </Button>
        }
      />
    );
  }

  if (reach.kind === "empty-folder") {
    const folders = emptyFolderNames(reach.folders);
    return (
      <EmptyState
        compact
        icon="folder-open"
        title={
          reach.folders.length === 1 ? text.emptyFolderTitleOne : text.emptyFolderTitleMany
        }
        description={text.emptyFolderBody(folders, reach.folders.length === 1)}
        action={
          <>
            {onOpenTags === undefined ? null : (
              <Button size="sm" variant="primary" iconStart="tag" onClick={onOpenTags}>
                {text.createTag}
              </Button>
            )}
            <Button size="sm" variant="secondary" iconStart="pencil" onClick={onEditRule}>
              {text.editRule}
            </Button>
          </>
        }
      />
    );
  }

  if (onClearPriorityFilter !== undefined) {
    return (
      <EmptyState
        compact
        icon="filter"
        title={text.filteredTitle}
        description={text.filteredBody}
        action={
          <Button size="sm" variant="secondary" onClick={onClearPriorityFilter}>
            {text.showAllPriorities}
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      compact
      icon="inbox"
      title={text.noCardTitle}
      description={text.noCardBody}
      action={
        <Button size="sm" variant="secondary" iconStart="pencil" onClick={onEditRule}>
          {text.editRule}
        </Button>
      }
    />
  );
}

/**
 * Das Kartenmenü. Es nennt den Weg, den es seit E-054 gibt — Tags ändern —,
 * und den Ort, an dem der Status geändert wird. Beides führt in denselben
 * Dialog; getrennt genannt, weil sonst niemand auf die Idee käme, den Status
 * unter „Bearbeiten" zu suchen.
 */
function cardMenu(
  todo: Todo,
  multiple: boolean,
  highlighted: boolean,
  on: {
    readonly open: () => void;
    readonly edit: () => void;
    readonly done: () => void;
    readonly highlight: () => void;
  },
): readonly MenuEntry[] {
  const text = boardTexts();
  return [
    { id: "open", label: text.openTodo, icon: "arrow-up-right", onSelect: on.open },
    {
      id: "tags",
      label: text.changeTags,
      icon: "tag",
      onSelect: on.edit,
    },
    { id: "status", label: text.changeStatus, icon: "pencil", onSelect: on.edit },
    { kind: "separator", id: "sep-done" },
    {
      id: "done",
      label: todo.completedAt === null ? text.markDone : text.undoDone,
      icon: todo.completedAt === null ? "check" : "rotate-ccw",
      onSelect: on.done,
    },
    ...(multiple
      ? ([
          { kind: "separator", id: "sep-also" },
          {
            id: "highlight",
            label: highlighted ? text.clearHighlight : text.highlightAll,
            icon: "copy",
            onSelect: on.highlight,
          },
        ] as const)
      : []),
  ];
}

function toCard(
  todo: Todo,
  summaries: {
    readonly byTodo: ReadonlyMap<Id, typeof EMPTY_SUMMARY>;
    readonly secondsByTodo: ReadonlyMap<Id, number>;
  },
  structure: ReturnType<typeof useStructure>,
  statusName: ForeignText,
  timerRunning: boolean,
  reactivated: boolean,
  otherColumns: readonly ForeignText[],
  priority?: { readonly name: string; readonly weight: number },
): KanbanCardData {
  return {
    id: todo.id,
    tagCount: todo.tagIds.length,
    ...(priority === undefined ? {} : { priority: { name: priority.name, weight: priority.weight } }),
    title: todo.title,
    callNumber: todo.callNumber,
    tags: todo.tagIds
      .map((id) => structure.tagInfo(id))
      .filter((info): info is NonNullable<typeof info> => info !== undefined)
      .map((info) => ({ label: info.tag.name, path: info.path })),
    trackedDisplay: formatDuration(summaries.secondsByTodo.get(todo.id) ?? 0),
    exportSummary: summaries.byTodo.get(todo.id) ?? EMPTY_SUMMARY,
    timerRunning,
    statusName,
    done: todo.completedAt !== null,
    reactivated,
    dueDate: todo.dueDate,
    ...(otherColumns.length === 0 ? {} : { appearance: { otherColumns } }),
  };
}
