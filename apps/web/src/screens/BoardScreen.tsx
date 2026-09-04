import { countPoolRuleConditions } from "@takt/domain";
import { useCallback, useMemo, useState } from "react";
import { errorMessage } from "../api/client";
import { clearTodoDone, markTodoDone, getBoard, updatePool } from "../api/endpoints";
import type { BoardColumnView, ForeignText, Id, Pool, PoolRuleTerm, Todo } from "../api/types";
import { FilterToggle } from "../components/FilterBar";
import { FormDialog } from "../components/FormDialog";
import { Icon } from "../components/Icon";
import { KanbanCard, KanbanColumn, type KanbanCardData } from "../components/Kanban";
import type { MenuEntry } from "../components/Menu";
import { Button, Card, EmptyState, InlineMessage, LoadingBlock } from "../components/Primitives";
import { RuleSummary } from "../components/RuleSummary";
import { EMPTY_SUMMARY, loadExportSummaries } from "../app/exportSummary";
import { useRefresh } from "../app/RefreshContext";
import { navigate } from "../app/router";
import { useRuleLookup, useStructure } from "../app/StructureContext";
import { useTimer } from "../app/TimerContext";
import { useToasts } from "../app/ToastContext";
import { undoDoneAction } from "../app/undoDone";
import { useAsync } from "../app/useAsync";
import { formatDuration, formatTime, plural } from "../lib/format";
import {
  POOL_PLACEMENT_SHORT,
  poolPlacementMessage,
  RULE_IS_A_RULE,
  RULE_WHAT_MOVES_A_CARD,
} from "../lib/labels";
import { doneMovementSentence, withMovement } from "../lib/movement";
import {
  axesOf,
  describeRule,
  describeRuleReach,
  emptyFolderNames,
  type RuleLookup,
  type RuleReach,
} from "../lib/poolRule";
import { AsyncBoundary, RefreshHint, ScreenHeader } from "./parts";
import { PoolFormDialog } from "./PoolFormDialog";
import { PoolRenameDialog } from "./PoolRenameDialog";
import { TodoFormDialog } from "./TodoFormDialog";
import { quotedName } from "../lib/foreign";
import { Foreign } from "../components/Foreign";

/**
 * Takt — S-04, das Kanban-Board (A-5.1, A-5.3 bis A-5.6, E-054).
 *
 * ## Eine Spalte ist eine Regel
 *
 * Bis E-054 war eine Spalte ein Statuswert; jede Karte stand in genau einer.
 * Seitdem ist eine Spalte dieselbe Entität wie ein Pool — eine Regel —, und
 * `pool.placement` sagt, wo sie erscheint. Der Status bleibt als Eigenschaft
 * am Todo; er ist nur nicht mehr die Spalte.
 *
 * **Und die Regel ist seit E-055 mehr als ihre Tags** (S-2 aus R-2). Sie hat
 * fünf Bedingungen: erforderliche Tags, ausgeschlossene Tags, Status,
 * „Erledigt" und Exportstatus. Drei davon ändern sich, ohne dass jemand ein Tag
 * anfasst — ein Timerstart hebt „Erledigt" auf (A-2.5) und lässt die erste
 * Buchung entstehen. Der Satz „welche Karte wo steht, entscheiden die Tags"
 * stand bis T-091 an elf Stellen und schickte den Benutzer im wichtigsten Fall
 * an die falsche Stelle suchen; die Fassungen dafür stehen jetzt in
 * `lib/labels.ts` (`RULE_IS_A_RULE`, `RULE_WHAT_MOVES_A_CARD`).
 *
 * Daraus folgen drei Dinge, die diese Ansicht sichtbar machen muss:
 *
 *  1. **Kein Ziehen.** Eine Regel lässt sich nicht durch Verschieben umkehren,
 *     ohne Tags zu setzen — und das hat der Auftraggeber ausgeschlossen. A-5.2
 *     und I-14 sind aufgehoben. Wer eine Karte in eine andere Spalte bringen
 *     will, ändert am Todo das, wonach die Regel fragt — meist die **Tags**,
 *     manchmal den Status; das sagt das Kartenmenü ausdrücklich.
 *  2. **Eine Karte kann in mehreren Spalten stehen.** Das ist kein Fehler,
 *     sondern der Normalfall: Zwei zutreffende Regeln treffen beide zu. Jedes
 *     Vorkommen nennt die anderen Spalten beim Namen und hebt sie auf Wunsch
 *     hervor.
 *  3. **Das Board ist nach der Umstellung leer.** Migration 0009 hat aus keiner
 *     vorhandenen Regel eine Spalte gemacht, weil es keine ehrliche Übersetzung
 *     von „In Progress" in ein Tag gibt. Der Leerzustand erklärt das und führt
 *     zur Einrichtung, statt „keine Daten" zu sagen.
 *
 * ## Warum es keine Blätterung je Spalte gibt
 *
 * `GET /board` liefert je Spalte die erste Seite; weiterblättern ließe sich je
 * Spalte über `GET /pools/{id}/todos`. Diese Ansicht tut es trotzdem nicht,
 * sondern erhöht die Kartenzahl **je Spalte** und lädt das Board neu. Grund ist
 * die Mehrfachnennung: `appearances` wird vom Dienst an der Regel berechnet,
 * über alle Mitglieder — nachgeladene Karten kämen ohne diese Auskunft an, und
 * eine Karte, die dann in zwei Spalten steht, ohne es zu sagen, sieht aus wie
 * ein Fehler. Lieber ein Aufruf mehr als eine Ansicht, die je nach Seite etwas
 * anderes behauptet.
 *
 * ## Was hier nicht mehr steht
 *
 * `DRAG_MIME`, `draggable`, `dropColumn`, `moveByOffset` und der Aufruf
 * `updateTodo({ statusId })` aus dem Ziehen. Der Status wird in S-02 und S-03
 * geändert; das Kartenmenü führt dorthin.
 */

/** Karten je Spalte beim ersten Laden. Eine Bildschirmhöhe, nicht mehr. */
const PAGE_SIZE = 25;

/**
 * Die ausdrücklich genannten Tags einer Regel.
 *
 * Ordnerterme bleiben außen vor: Welche Tags in einem Ordner samt Unterordnern
 * liegen, löst der Dienst auf (`resolveRule`) — hier wäre es die zweite Fassung
 * derselben Rechnung, und die erste wäre nicht mehr die einzige Wahrheit.
 */
function seedTagIds(rule: readonly PoolRuleTerm[]): readonly Id[] {
  return rule.flatMap((term) => (term.kind === "tag" ? [term.tagId] : []));
}

/** Dieselbe Frage für eine ganze Spalte. */
function seedTagsOf(column: Pool): readonly Id[] {
  return seedTagIds(column.rule);
}

export function BoardScreen() {
  const structure = useStructure();
  const timer = useTimer();
  const toasts = useToasts();
  const { version, bump } = useRefresh();

  const [showDone, setShowDone] = useState(false);
  const [perColumn, setPerColumn] = useState(PAGE_SIZE);
  const [setupOpen, setSetupOpen] = useState(false);
  /** Offener Regel-Dialog: `null` zu, sonst anlegen (`pool` fehlt) oder ändern. */
  const [ruleForm, setRuleForm] = useState<{ readonly pool?: Pool } | null>(null);
  /**
   * Die Spalte, die gerade umbenannt wird (O-A).
   *
   * Ein **eigener** Zustand neben `ruleForm` und nicht dessen Sonderfall: Die
   * beiden Dialoge tun Verschiedenes. Der eine ändert eine Regel über fünf
   * Achsen, der andere ein Wort — und wer nur das Wort ändern will, soll nicht
   * versehentlich die ganze Regel neu schreiben.
   */
  const [renaming, setRenaming] = useState<Pool | null>(null);
  const [createIn, setCreateIn] = useState<Pool | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [highlighted, setHighlighted] = useState<Id | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const data = useAsync(async () => {
    const [board, summaries] = await Promise.all([
      getBoard({ includeCompleted: showDone, limit: perColumn }),
      loadExportSummaries(),
    ]);
    return { board, summaries };
  }, [showDone, perColumn], [version]);

  const lookup = useRuleLookup();
  const pools = structure.state.status === "ready" ? structure.state.value.pools : [];
  /*
   * **Alle** Regeln, nicht nur die der Pool-Fläche: Der eindeutige Index
   * `ux_pool_name` gilt über die ganze Tabelle, also kollidiert der Name einer
   * Spalte auch mit dem einer Regel, die nur in den Pools steht (O-A).
   */
  const allRules = structure.state.status === "ready" ? structure.state.value.rules : [];

  const toggleDone = useCallback(
    (todo: Todo) => {
      const wasDone = todo.completedAt !== null;
      timer.clearReactivated(todo.id);
      void (wasDone ? clearTodoDone(todo.id) : markTodoDone(todo.id))
        .then((result) => {
          bump();
          /*
            Der Toast sagt das Faktum — und seit E-060 auch, wohin die Karte
            gewandert ist.

            Bis T-091 stand hier „Die Regeln ihrer Spalten treffen unverändert
            zu" beziehungsweise „Sie bleibt in ihren Spalten stehen". Beide
            Sätze stammen aus der Zeit, in der eine Spalte nur an Tags hing.
            Seit E-055 kann eine Spalte ausdrücklich nach „Erledigt" fragen —
            dann wechselt die Karte mit genau dieser Handlung die Spalte, und
            der Toast behauptete das Gegenteil. Bis T-094 schwieg er deshalb
            über die Spalten: Die beiden Erledigt-Routen antworteten mit dem
            Todo und sonst nichts, und selbst zu rechnen wäre die zweite
            Fassung einer Auskunft gewesen, die E-058 gerade auf eine
            zusammengeführt hatte.

            Seit E-060 liefern beide Routen `poolMovement`, gerechnet aus dem
            Zustandspaar vor und nach der Handlung. Der Satz dazu kommt aus
            derselben Funktion wie der nach einem Timerstart; `null` heißt
            „keine Fläche bewegt sich", und dann steht keine Zeile da.

            **Warum die Zeile „Sie verschwindet vom Board" nur ohne
            Bewegungssatz steht.** Sie ist die Auskunft über die
            Ansichtseinstellung „Erledigte einblenden" und war immer dann
            falsch, wenn eine Spalte selbst nach „Erledigt" fragt: Deren Regel
            hat das letzte Wort, die Karte bleibt dort sichtbar
            (`usecases/board.ts`, `showsCompleted`). Genau in diesem Fall
            meldet der Dienst eine Bewegung — nur eine Regel mit einer
            Erledigt-Achse kann durch diese Handlung gewonnen oder verloren
            werden. Wo also der Bewegungssatz steht, ist er die genauere
            Antwort auf dieselbe Frage, und die pauschale Zeile entfällt.
          */
          const movement = doneMovementSentence(result.poolMovement, wasDone);
          const unchanged = "Tags und Status ändern sich dadurch nicht.";
          toasts.show({
            tone: wasDone ? "info" : "success",
            title: wasDone ? `${quotedName(todo.title)} ist wieder offen.` : `${quotedName(todo.title)} ist erledigt.`,
            body: withMovement(
              wasDone || movement !== null
                ? unchanged
                : showDone
                  ? `Erledigte Karten sind eingeblendet, sie bleibt also sichtbar. ${unchanged}`
                  : `Sie verschwindet vom Board, bis erledigte Karten eingeblendet werden. ${unchanged}`,
              movement,
            ),
            /*
              Der Rückweg, seit T-118 an allen drei Flächen (B-7 aus T-116).
              Bis dahin bot ihn nur die Todo-Liste an — dieselbe Handlung mit
              zwei Schutzniveaus, buchstäblich der Befund, aus dem E-059
              entstanden ist. Die Gegenrichtung („wieder offen") bekommt keinen:
              Sie ist selbst schon die Rücknahme.
            */
            ...(wasDone ? {} : { action: undoDoneAction(todo.id, todo.title, toasts, bump) }),
          });
        })
        .catch((cause: unknown) =>
          toasts.failure("Das Kennzeichen ließ sich nicht ändern", errorMessage(cause)),
        );
    },
    [bump, showDone, timer, toasts],
  );

  /**
   * Den Anzeigeort einer Regel ändern — mit einem Rückweg im Toast
   * (S-5 aus R-2).
   *
   * Bis T-091 war „Vom Board nehmen" auf dieser Fläche durch einen
   * Bestätigungsdialog geschützt und in der Regelliste (S-08) dieselbe
   * Handlung eine Sofortaktion mit Toast, ohne Rückweg. Zwei Schutzniveaus für
   * dieselbe Handlung lehren, dass eines davon bedeutungslos ist.
   *
   * Aufgelöst zugunsten der **schwächeren, ehrlicheren** Fassung: Der Dialog
   * erklärte vor allem, dass nichts verlorengeht — und das sagt ein Toast mit
   * „Rückgängig" überzeugender, weil man es ausprobieren kann. Die Handlung ist
   * ein `PATCH` auf ein Feld und vollständig umkehrbar; ein Dialog davor
   * kostet jedes Mal einen Klick für einen Schaden, den es nicht gibt.
   *
   * `previous` wird **vor** dem Aufruf gelesen und mitgegeben, nicht hinterher
   * aus dem neu geladenen Bestand geholt: Nach `structure.reload()` steht dort
   * bereits der neue Wert, und „Rückgängig" führte dann zurück auf sich selbst.
   *
   * **Der Wortlaut steht seit T-108 nicht mehr hier** (W-14 aus R-2a).
   * `poolPlacementMessage` in `lib/labels.ts` bildet Titel und Zeile in einem
   * Aufruf, und die Regelliste (S-11) ruft dieselbe Funktion. Bis dahin gab
   * jede Aufrufstelle ihren Titel selbst mit (`spoken`) — vier Stellen auf
   * dieser Fläche, eine weitere in der Regelliste mit anderem Wortlaut. Der
   * Parameter ist damit entfallen: Was der Titel sagt, folgt aus dem Ziel und
   * daraus, ob dies der Rückweg ist.
   */
  const setPlacement = useCallback<PlacementChange>(
    (pool, placement, restoring = false) => {
      const previous = pool.placement;
      void updatePool(pool.id, { placement })
        .then(() => {
          structure.reload();
          bump();
          toasts.show({
            tone: "success",
            ...poolPlacementMessage(pool.name, placement, restoring),
            ...(!restoring && previous !== placement
              ? {
                  action: {
                    label: "Rückgängig",
                    onSelect: () => {
                      setPlacement({ ...pool, placement }, previous, true);
                    },
                  },
                }
              : {}),
          });
        })
        .catch((cause: unknown) =>
          toasts.failure("Der Anzeigeort ließ sich nicht ändern", errorMessage(cause)),
        );
    },
    [bump, structure, toasts],
  );

  const columnMenu = useCallback(
    (column: Pool): readonly MenuEntry[] => [
      /*
       * Der Eintrag steht auch dann da, wenn er nicht geht — mit dem Grund
       * daneben. Eine Spalte, die als einzige kein Pluszeichen trägt, wirkt
       * sonst kaputt; hier steht stattdessen, warum Takt die Tags für diese
       * Regel nicht raten kann.
       */
      seedTagsOf(column).length === 0
        ? {
            id: "add",
            label: "Todo in dieser Spalte anlegen",
            icon: "plus",
            disabled: true,
            disabledReason:
              "Diese Regel nennt nur Ordner. Welche Tags darin liegen, löst der Dienst auf — die Ansicht rechnet das nicht nach.",
            onSelect: () => undefined,
          }
        : {
            id: "add",
            label: "Todo mit den Tags dieser Regel anlegen",
            icon: "plus",
            onSelect: () => setCreateIn(column),
          },
      /*
       * „Umbenennen" steht **vor** „Regel bearbeiten" und trägt den Stift
       * (O-A). Bis T-133 gab es den Eintrag nicht: Wer eine Spalte umbenennen
       * wollte, musste erraten, dass der Name im Regelformular steht — und
       * schrieb beim Speichern alle fünf Achsen neu, um ein Wort zu ändern.
       *
       * Die Reihenfolge folgt der Häufigkeit, das Symbol der Bedeutung: Der
       * Stift ist an jeder anderen Fläche das Umbenennen (S-08, S-09), und das
       * Regelformular bekommt dafür den Trichter — eine Regel **ist** ein
       * Filter (E-055), und der Weg in die Liste zeigt seitdem hinaus.
       */
      {
        id: "rename",
        label: "Umbenennen",
        icon: "pencil",
        onSelect: () => setRenaming(column),
      },
      {
        id: "edit",
        label: "Regel bearbeiten",
        icon: "filter",
        onSelect: () => setRuleForm({ pool: column }),
      },
      {
        id: "list",
        label: "Alle Todos dieser Regel in der Liste",
        icon: "arrow-up-right",
        onSelect: () => navigate("todos", undefined, { pool: column.id }),
      },
      { kind: "separator", id: "sep" },
      {
        id: "remove",
        label: "Vom Board nehmen",
        icon: "x",
        tone: "danger",
        onSelect: () => setPlacement(column, "pool"),
      },
    ],
    [setPlacement],
  );

  const createInTags = useMemo(
    () => (createIn === null ? [] : seedTagIds(createIn.rule)),
    [createIn],
  );

  return (
    <section className="screen">
      <ScreenHeader
        title="Kanban"
        lead={`${RULE_IS_A_RULE} ${RULE_WHAT_MOVES_A_CARD}`}
        actions={
          <>
            <FilterToggle
              label="Erledigte einblenden"
              pressed={showDone}
              onChange={setShowDone}
              hint="Voreingestellt ausgeblendet. Spalten, die ausdrücklich nach „Erledigt“ fragen, zeigen ihre Karten trotzdem."
            />
            <Button variant="secondary" iconStart="filter" onClick={() => setSetupOpen(true)}>
              Spalten verwalten
            </Button>
          </>
        }
      />

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      <AsyncBoundary state={data.state} label="Board wird geladen" rows={4} onRetry={data.reload}>
        {(value, refreshing) => {
          const columnName = new Map(value.board.columns.map((view) => [view.column.id, view.column.name]));
          const appearances = new Map(
            value.board.appearances.map((entry) => [entry.todoId, entry.columnIds]),
          );
          const partial = value.board.columns.some((view) => view.todos.length < view.total);

          if (value.board.columns.length === 0) {
            return (
              <BoardEmptyState
                pools={pools}
                poolsKnown={structure.state.status === "ready"}
                onCreate={() => setRuleForm({})}
                onAdopt={(pool) => setPlacement(pool, "both")}
              />
            );
          }

          return (
            <>
              <div className="board__bar">
                <p className="board__stamp">
                  Stand {formatTime(value.board.generatedAt)} ·{" "}
                  {plural(value.board.columns.length, "Spalte", "Spalten")}
                  {value.board.appearances.length === 0
                    ? ""
                    : ` · ${plural(value.board.appearances.length, "Karte steht", "Karten stehen")} in mehreren Spalten`}
                </p>
                <RefreshHint active={refreshing} />
                <Button size="sm" variant="ghost" iconStart="rotate-ccw" onClick={data.reload}>
                  Neu berechnen
                </Button>
              </div>

              <div className="board">
                {value.board.columns.map((view) => (
                  <BoardColumn
                    key={view.column.id}
                    view={view}
                    columnName={columnName}
                    appearances={appearances}
                    summaries={value.summaries}
                    highlighted={highlighted}
                    seedTagIds={seedTagsOf(view.column)}
                    lookup={lookup}
                    entries={columnMenu(view.column)}
                    onEditRule={() => setRuleForm({ pool: view.column })}
                    onAdd={() => setCreateIn(view.column)}
                    onOpenTodo={(todo) => navigate("todo", todo.id)}
                    onEditTodo={setEditingTodo}
                    onToggleDone={toggleDone}
                    onToggleTimer={(todo) => timer.toggle(todo.id, todo.title)}
                    onHighlight={(todo, columns) => {
                      const next = highlighted === todo.id ? null : todo.id;
                      setHighlighted(next);
                      setAnnouncement(
                        next === null
                          ? "Hervorhebung aufgehoben."
                          : /*
                               Jeder Name einzeln behandelt (O-AT): `join` auf
                               einer Reihe fremden Textes ergibt gewöhnlichen
                               Text — die Herkunft fällt dabei ab, und mit ihr
                               die Pflicht. Der Satz wird angesagt; ein
                               Richtungszeichen in einem Regelnamen drehte
                               ihn um.
                             */
                            `${quotedName(todo.title)} steht in ${columns.length + 1} Spalten: ${[view.column.name, ...columns].map(quotedName).join(", ")}.`,
                      );
                    }}
                    isTimerRunning={(todo) => timer.isRunningFor(todo.id)}
                    isReactivated={(todo) => timer.reactivated.has(todo.id)}
                    statusName={(todo) => structure.statusName(todo.statusId)}
                  />
                ))}
              </div>

              {partial ? (
                <div className="list-more">
                  <Button
                    variant="secondary"
                    onClick={() => setPerColumn((current) => current + PAGE_SIZE)}
                  >
                    Mehr Karten je Spalte laden (derzeit {perColumn})
                  </Button>
                  <p className="list-more__hint">
                    Das Board wird dabei neu berechnet — nur so bleibt die Auskunft „steht auch
                    in …“ für jede Karte vollständig.
                  </p>
                </div>
              ) : null}
            </>
          );
        }}
      </AsyncBoundary>

      <BoardSetupDialog
        open={setupOpen}
        boardState={data.state.status}
        onRetry={data.reload}
        columns={data.state.status === "ready" ? data.state.value.board.columns : []}
        pools={pools}
        lookup={lookup}
        onClose={() => setSetupOpen(false)}
        onCreate={() => {
          setSetupOpen(false);
          setRuleForm({});
        }}
        onEdit={(pool) => {
          setSetupOpen(false);
          setRuleForm({ pool });
        }}
        onRename={(pool) => {
          setSetupOpen(false);
          setRenaming(pool);
        }}
        /*
          Beide Knöpfe schließen den Dialog, und zwar **vor** der Meldung
          (W-6 aus R-2a).

          Bis T-102 tat das nur „Vom Board nehmen". „Als Spalte aufnehmen"
          ließ den Dialog offen — und legte seinen Rückweg in einen Toast, der
          außerhalb des `aria-modal="true"` mit Tabulatorschleife liegt
          (`FormDialog`). Für Tastatur und Vorlesehilfe war „Rückgängig" damit
          nicht vorhanden, und seit E-059 ist der Rückweg der einzige Schutz
          vor dieser Handlung. Zwei Nachbarknöpfe mit zwei Verhalten lehren
          außerdem, daß eines davon keine Bedeutung hat.

          Die Reihenfolge stimmt von selbst: `setPlacement` zeigt die Meldung
          erst, wenn der `PATCH` geantwortet hat — der Dialog ist dann längst
          zu, und der Fokus steht wieder auf dem Knopf, der ihn geöffnet hat.
        */
        onAdopt={(pool) => {
          setSetupOpen(false);
          setPlacement(pool, "both");
        }}
        onRemove={(pool) => {
          setSetupOpen(false);
          setPlacement(pool, "pool");
        }}
      />

      <PoolFormDialog
        open={ruleForm !== null}
        {...(ruleForm?.pool === undefined ? {} : { pool: ruleForm.pool })}
        defaultPlacement="board"
        onClose={() => setRuleForm(null)}
      />

      {/*
        Umbenennen (O-A). Die Liste für die Vorabprüfung sind **alle** Regeln
        und nicht die Spalten dieses Boards: `ux_pool_name` ist eindeutig über
        die ganze Tabelle, also kollidiert eine Spalte auch mit einem Pool, der
        hier gar nicht steht. `rules` liegt in der Struktur; ist sie noch nicht
        geladen, sagt `existingKnown` das, statt einen Bestand zu behaupten.
      */}
      <PoolRenameDialog
        open={renaming !== null}
        pool={renaming}
        existing={allRules}
        existingKnown={structure.state.status === "ready"}
        onClose={() => setRenaming(null)}
      />

      {/*
        Die Vorbelegung haengt an `createIn` und nicht am Rendern: Ein bei
        jedem Durchlauf neu gebautes Feld waere eine neue Kennung, und der
        Ruecksetz-Effekt im Dialog liefe mit — mitten im Tippen.
      */}
      <TodoFormDialog
        open={createIn !== null}
        presetTagIds={createInTags}
        onClose={() => setCreateIn(null)}
      />

      {editingTodo === null ? null : (
        <TodoFormDialog open todo={editingTodo} onClose={() => setEditingTodo(null)} />
      )}
    </section>
  );
}

/* ==================================================================== */
/* Eine Spalte                                                          */
/* ==================================================================== */

/**
 * Den Anzeigeort einer Regel ändern.
 *
 * Ausgeschriebener Typ, weil die Funktion sich für „Rückgängig" **selbst**
 * aufruft: Ohne Annotation liefe der Übersetzer in eine ringförmige Ableitung
 * und setzte `any` ein — genau die Sorte stiller Aufgabe der Prüfung, die
 * dieses Projekt nicht will.
 */
type PlacementChange = (
  pool: Pool,
  placement: "pool" | "board" | "both",
  /**
   * Ist dieser Aufruf der Rückweg selbst?
   *
   * Dann trägt die Meldung den Titel „Anzeigeort wiederhergestellt." und bietet
   * keinen zweiten Rückweg an — sonst schöbe man den Anzeigeort im Toast hin
   * und her, ohne je zu sehen, wo man steht.
   */
  restoring?: boolean,
) => void;

interface BoardColumnProps {
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
}

function BoardColumn({
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
  const reach = describeRuleReach(description, column.resolved);

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
          emptyText="Ohne Bedingung — diese Spalte bleibt leer."
        />
      }
      entries={entries}
      {...(seedTagIds.length === 0
        ? {}
        : {
            onAdd,
            addLabel: `Todo in ${quotedName(column.name)} anlegen — mit den Tags dieser Regel`,
          })}
    >
      {view.todos.length === 0 ? (
        <BoardColumnEmpty reach={reach} onEditRule={onEditRule} onOpenTags={() => navigate("tags")} />
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
              )}
              entries={cardMenu(todo, others.length > 0, highlighted === todo.id, {
                open: () => onOpenTodo(todo),
                edit: () => onEditTodo(todo),
                done: () => onToggleDone(todo),
                highlight: () => onHighlight(todo, others),
              })}
              highlighted={highlighted === todo.id}
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

/* ==================================================================== */
/* Der Leerzustand einer einzelnen Spalte                               */
/* ==================================================================== */

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
}: {
  readonly reach: RuleReach;
  readonly onEditRule: () => void;
  /**
   * Zu den Tags — der Ort, an dem der leere Ordner gefüllt wird. Freiwillig,
   * weil die Musterseite keine Navigation hat.
   */
  readonly onOpenTags?: () => void;
}) {
  if (reach.kind === "no-condition") {
    return (
      <EmptyState
        compact
        icon="alert-triangle"
        title="Diese Spalte hat noch keine Bedingung"
        description="Sie bleibt leer, bis eine dazukommt — eine Regel ohne Bedingung trifft nichts, nicht alles. Nennen Sie einen Tag, einen Ordner, einen Status, „Erledigt“ oder den Exportstatus, dann füllt sie sich von selbst."
        action={
          <Button size="sm" variant="primary" iconStart="pencil" onClick={onEditRule}>
            Bedingung ergänzen
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
          reach.folders.length === 1
            ? "Der geforderte Ordner enthält kein Tag"
            : "Die geforderten Ordner enthalten kein Tag"
        }
        description={`Die Regel verlangt ein Tag aus ${folders} — dort liegt keines. Eine Bedingung, die auf keinen Tag zeigt, kann kein Todo erfüllen; daran ändert auch ein zweiter Tag oder Ordner daneben nichts. Legen Sie ein Tag in ${reach.folders.length === 1 ? "diesem Ordner" : "diesen Ordnern"} an oder nennen Sie in der Regel einen anderen.`}
        action={
          <>
            {onOpenTags === undefined ? null : (
              <Button size="sm" variant="primary" iconStart="tag" onClick={onOpenTags}>
                Tag anlegen
              </Button>
            )}
            <Button size="sm" variant="secondary" iconStart="pencil" onClick={onEditRule}>
              Regel bearbeiten
            </Button>
          </>
        }
      />
    );
  }

  return (
    <EmptyState
      compact
      icon="inbox"
      title="Keine Karte trifft diese Regel"
      description="Die Bedingungen stehen — im Augenblick erfüllt sie kein Todo. Sobald eines dazu passt, erscheint es hier von selbst."
      action={
        <Button size="sm" variant="secondary" iconStart="pencil" onClick={onEditRule}>
          Regel bearbeiten
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
  return [
    { id: "open", label: "Todo öffnen", icon: "arrow-up-right", onSelect: on.open },
    {
      id: "tags",
      label: "Tags ändern — sie entscheiden die Spalte",
      icon: "tag",
      onSelect: on.edit,
    },
    { id: "status", label: "Status ändern", icon: "pencil", onSelect: on.edit },
    { kind: "separator", id: "sep-done" },
    {
      id: "done",
      label: todo.completedAt === null ? "Als erledigt markieren" : "Erledigt zurücknehmen",
      icon: todo.completedAt === null ? "check" : "rotate-ccw",
      onSelect: on.done,
    },
    ...(multiple
      ? ([
          { kind: "separator", id: "sep-also" },
          {
            id: "highlight",
            label: highlighted ? "Hervorhebung aufheben" : "Alle Vorkommen hervorheben",
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
    statusName,
    done: todo.completedAt !== null,
    reactivated,
    ...(otherColumns.length === 0 ? {} : { appearance: { otherColumns } }),
  };
}

/* ==================================================================== */
/* Der Leerzustand — der wichtigste Bildschirm dieser Ansicht           */
/* ==================================================================== */

/**
 * Kein Board heißt hier **nicht** „nichts zu tun".
 *
 * Nach der Umstellung auf E-054 ist das Board leer, und zwar aus einem Grund,
 * den der Benutzer kennen muss: Es gab keine ehrliche Übersetzung der alten
 * Statusspalten in Tag-Regeln, und Takt setzt keine Tags von sich aus. Ein
 * Leerzustand, der nur „keine Daten" sagt, ließe ihn glauben, seine Arbeit sei
 * verschwunden. Deshalb steht hier, was geschehen ist, wo seine Todos geblieben
 * sind und wie er in zwei Klicks eine Spalte bekommt.
 */
export interface BoardEmptyStateProps {
  /** Vorhandene Pool-Regeln, die sich als Spalte aufnehmen lassen. */
  readonly pools: readonly Pool[];
  /**
   * Ist die Regelliste geladen? (B-5 aus R-2, sinngemäß.)
   *
   * `pools` ist leer, solange der Aufbau lädt und wenn er fehlgeschlagen ist.
   * „Sie haben noch keine Regel" wäre dann eine Behauptung über den Bestand,
   * die niemand belegt hat — und sie stünde ausgerechnet neben der
   * Aufforderung, Tags zu vergeben, die der Benutzer längst hat. Fehlt die
   * Angabe, wird der Satz weggelassen statt geraten.
   */
  readonly poolsKnown?: boolean;
  readonly onCreate: () => void;
  readonly onAdopt: (pool: Pool) => void;
}

export function BoardEmptyState({
  pools,
  poolsKnown = true,
  onCreate,
  onAdopt,
}: BoardEmptyStateProps) {
  return (
    <div className="board-setup">
      <EmptyState
        icon="square"
        title="Das Board hat noch keine Spalte"
        description={`Seit der Umstellung ist eine Spalte eine Regel — dieselbe Art Regel wie ein Pool, über Tags, Status, „Erledigt“ und den Exportstatus. Sie richten die Spalten selbst ein; Takt erfindet keine.`}
        action={
          <Button variant="primary" iconStart="plus" onClick={onCreate}>
            Erste Spalte einrichten
          </Button>
        }
      />

      <Card title="Was sich geändert hat" description="Kurz, damit nichts verloren wirkt.">
        <ul className="board-setup__points">
          <li>
            <strong>Ihre Todos sind vollzählig da.</strong> Sie stehen in der Todo-Liste, mit
            Status, Tags und allen erfassten Zeiten. Es wurde nichts gelöscht und nichts
            verschoben.
          </li>
          <li>
            <strong>Der Status bleibt.</strong> Er ist weiterhin eine Eigenschaft jedes Todos und
            wird in der Liste und in der Detailansicht geändert — er ist nur nicht mehr die
            Spalte. Welche Statuswerte es gibt, richten Sie in den Einstellungen unter „Status“
            ein.
          </li>
          <li>
            <strong>Keine automatische Übersetzung.</strong> Aus „In Progress" ließe sich nur dann
            eine Spalte machen, wenn Takt dafür ein Tag anlegte und an Ihre Todos hinge. Genau das
            soll es nicht tun.
          </li>
          <li>
            <strong>Nichts wird mehr gezogen.</strong> Welche Karte in welcher Spalte steht,
            entscheidet die Regel der Spalte — über Tags, Status, „Erledigt“ und den
            Exportstatus. Ändert sich am Todo etwas, wonach die Regel fragt, wandert es von
            selbst.
          </li>
        </ul>
        <div className="board-setup__actions">
          <Button variant="primary" iconStart="plus" onClick={onCreate}>
            Erste Spalte einrichten
          </Button>
          <Button variant="ghost" iconStart="arrow-up-right" onClick={() => navigate("todos")}>
            Zur Todo-Liste
          </Button>
        </div>
      </Card>

      {!poolsKnown ? null : pools.length === 0 ? (
        <InlineMessage tone="info" title="Sie haben noch keine Regel">
          Eine Spalte nennt Bedingungen — zum Beispiel „alles unter Kunden“, „Tag Wartet“ oder
          „erledigt und noch nicht abgerechnet“. Wer noch keine Tags vergeben hat, fängt am besten
          damit an; über Status, „Erledigt“ und den Exportstatus kommt man auch ganz ohne Tag zu
          einer Spalte.
        </InlineMessage>
      ) : (
        <Card
          title="Vorhandene Regeln als Spalte aufnehmen"
          description="Diese Regeln gibt es bereits in Ihren Pools. Sie werden dadurch nicht kopiert — dieselbe Regel erscheint zusätzlich auf dem Board."
        >
          <ul className="rule-list">
            {pools.map((pool) => (
              <li key={pool.id} className="rule-row">
                <span className="rule-row__name grow truncate">
                  <Foreign value={pool.name} />
                </span>
                <span className="rule-row__count">
                  {plural(countPoolRuleConditions(axesOf(pool)), "Bedingung", "Bedingungen")}
                </span>
                <Button size="sm" variant="secondary" iconStart="plus" onClick={() => onAdopt(pool)}>
                  Als Spalte aufnehmen
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ==================================================================== */
/* Spalten verwalten (S-11 auf der Board-Seite)                         */
/* ==================================================================== */

function BoardSetupDialog({
  open,
  boardState,
  onRetry,
  columns,
  pools,
  lookup,
  onClose,
  onCreate,
  onEdit,
  onRename,
  onAdopt,
  onRemove,
}: {
  readonly open: boolean;
  /**
   * Woher die Spaltenliste kommt (B-5 aus R-2, sinngemäß).
   *
   * `columns` ist leer, solange das Board lädt **und** wenn es
   * fehlgeschlagen ist. „Noch keine Spalte" wäre in beiden Fällen eine
   * Behauptung über den Bestand, für die es keinen Beleg gibt — derselbe
   * Fehler, den das Regelformular bei Ordnern und Status gemacht hat.
   */
  readonly boardState: "loading" | "ready" | "error";
  readonly onRetry: () => void;
  readonly columns: readonly BoardColumnView[];
  readonly pools: readonly Pool[];
  readonly lookup: RuleLookup;
  readonly onClose: () => void;
  readonly onCreate: () => void;
  readonly onEdit: (pool: Pool) => void;
  /** Nur den Namen ändern (O-A). Der zweite Weg neben dem Spaltenmenü. */
  readonly onRename: (pool: Pool) => void;
  readonly onAdopt: (pool: Pool) => void;
  readonly onRemove: (pool: Pool) => void;
}) {
  const onBoard = new Set(columns.map((view) => view.column.id));
  const available = pools.filter((pool) => !onBoard.has(pool.id));

  return (
    <FormDialog
      open={open}
      title="Spalten des Boards"
      description={`${RULE_IS_A_RULE} Dieselbe Entität wie ein Pool — was hier steht, ist eine Regel mit dem Anzeigeort „Board“.`}
      submitLabel="Neue Spalte anlegen"
      cancelLabel="Schließen"
      onSubmit={onCreate}
      onCancel={onClose}
    >
      {boardState === "loading" ? (
        <LoadingBlock label="Spalten werden geladen" rows={3} />
      ) : boardState === "error" ? (
        <InlineMessage
          tone="danger"
          title="Die Spalten ließen sich nicht laden"
          action={
            <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={onRetry}>
              Erneut versuchen
            </Button>
          }
        >
          Ob dieses Board Spalten hat, ist gerade nicht feststellbar. Angelegt ist deshalb nichts
          verloren — nur ungezeigt.
        </InlineMessage>
      ) : columns.length === 0 ? (
        <EmptyState
          compact
          icon="square"
          title="Noch keine Spalte"
          description="Legen Sie eine an oder nehmen Sie eine vorhandene Regel auf."
        />
      ) : (
        <ul className="rule-list">
          {columns.map((view) => {
            /*
             * Derselbe Befund wie im Leerzustand der Spalte, aus derselben
             * Quelle (E-057). Er steht auch hier, weil dieser Dialog die
             * Fläche ist, auf der Spalten verwaltet werden — wer den Fehler
             * nur unter einer Spalte sähe, müsste erst dorthin scrollen.
             */
            const reach = describeRuleReach(
              describeRule(axesOf(view.column), lookup),
              view.column.resolved,
            );

            return (
            <li key={view.column.id} className="rule-row">
              <div className="grow">
                <p className="rule-row__name">
                  <Foreign value={view.column.name} />
                </p>
                <p className="rule-row__meta">
                  {POOL_PLACEMENT_SHORT[view.column.placement]} ·{" "}
                  {plural(countPoolRuleConditions(axesOf(view.column)), "Bedingung", "Bedingungen")}{" "}
                  · {plural(view.total, "Karte", "Karten")}
                </p>
                {reach.kind === "empty-folder" ? (
                  <p className="rule-row__fault">
                    <Icon name="alert-triangle" size={11} />
                    Kein Tag in {emptyFolderNames(reach.folders)} — diese Spalte kann nichts
                    treffen.
                  </p>
                ) : null}
              </div>
              {/*
                Zwei getrennte Knöpfe, weil es zwei Handlungen sind (O-A):
                „Umbenennen" schickt `{ name }`, „Regel bearbeiten" schreibt
                alle fünf Achsen. Die Beschriftung sagt seit T-133, **was**
                bearbeitet wird — „Bearbeiten" allein ließ offen, ob damit der
                Name gemeint ist, und genau daran ist das Umbenennen bisher
                gescheitert.
              */}
              <Button
                size="sm"
                variant="secondary"
                iconStart="pencil"
                onClick={() => onRename(view.column)}
              >
                Umbenennen
              </Button>
              <Button
                size="sm"
                variant="ghost"
                iconStart="filter"
                onClick={() => onEdit(view.column)}
              >
                Regel bearbeiten
              </Button>
              <Button size="sm" variant="ghost" iconStart="x" onClick={() => onRemove(view.column)}>
                Vom Board nehmen
              </Button>
            </li>
            );
          })}
        </ul>
      )}

      {available.length === 0 ? null : (
        <div className="field">
          <span className="field__label">Vorhandene Pool-Regeln</span>
          <ul className="rule-list">
            {available.map((pool) => (
              <li key={pool.id} className="rule-row">
                <span className="rule-row__name grow truncate">
                  <Foreign value={pool.name} />
                </span>
                <Button size="sm" variant="ghost" iconStart="plus" onClick={() => onAdopt(pool)}>
                  Als Spalte aufnehmen
                </Button>
              </li>
            ))}
          </ul>
          <p className="field__hint">
            Die Regel erscheint dann an beiden Stellen. Wollen Sie sie nur auf dem Board, stellen
            Sie den Anzeigeort im Bearbeiten-Dialog auf „Nur auf dem Board“.
          </p>
        </div>
      )}

      <InlineMessage tone="info" title="Reihenfolge">
        Die Spalten stehen in der Reihenfolge ihrer Position, die sie mit der Pool-Liste teilen.
        Sie lässt sich hier noch nicht ändern.
      </InlineMessage>

      {/*
        Wer „Statusspalten" sucht, sucht sie hier — bis E-054 wurden sie in
        genau diesem Dialog verwaltet. Der Hinweis nennt den neuen Ort und den
        Grund, statt ihn suchen zu lassen (A-5.4, T-073).
      */}
      <InlineMessage
        tone="info"
        title="Sie suchen die Statuswerte?"
        action={
          <Button
            size="sm"
            variant="secondary"
            iconStart="arrow-up-right"
            onClick={() => navigate("settings", undefined, { bereich: "status" })}
          >
            Zu den Einstellungen
          </Button>
        }
      >
        Der Status ist seit der Umstellung keine Spalte mehr, sondern eine Eigenschaft des Todos —
        sichtbar auf jeder Karte, geändert in der Liste und in der Detailansicht. Angelegt,
        umbenannt, sortiert und gelöscht werden die Statuswerte in den Einstellungen unter
        „Status“.
      </InlineMessage>
    </FormDialog>
  );
}
