import { useCallback, useMemo, useState } from "react";
import { errorMessage } from "../../api/client";
import { updatePool } from "../../api/endpoints";
import type { Id, Pool, PoolRuleTerm, Todo } from "../../api/types";
import { loadExportSummaries } from "../../app/exportSummary";
import { useRefresh } from "../../app/RefreshContext";
import { navigate } from "../../app/router";
import { useRuleLookup, useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useAsync } from "../../app/useAsync";
import { useToday } from "../../app/useToday";
import { FilterToggle } from "../../shared/ui/FilterBar";
import type { MenuEntry } from "../../shared/ui/Menu";
import { Button } from "../../shared/ui/Primitives";
import { quotedName } from "../../lib/foreign";
import { formatTime, plural } from "../../lib/format";
import { poolPlacementMessage, RULE_WHAT_MOVES_A_CARD } from "../../lib/labels";
import { doneMovementSentence, withMovement } from "../../lib/movement";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { RefreshHint, ScreenHeader } from "../../shared/ui/ScreenHeader";
import { PoolFormDialog } from "../structure/PoolFormDialog";
import { PoolRenameDialog } from "../structure/PoolRenameDialog";
import { useTimer } from "../timer/TimerContext";
import { clearTodoDone, markTodoDone } from "../todos/api";
import { TodoFormDialog } from "../todos/TodoFormDialog";
import { undoDoneAction } from "../todos/undoDone";
import { getBoard } from "./api";
import { BoardColumn } from "./BoardColumn";
import { BoardEmptyState } from "./BoardEmptyState";
import { BoardSetupDialog } from "./BoardSetupDialog";

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
 * wird deshalb hier nirgends getippt; seine Fassungen stehen in `lib/labels.ts`
 * (`RULE_IS_A_RULE`, `RULE_WHAT_MOVES_A_CARD`).
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
 *
 * Vorgeschichte: `docs/decisions/board.md`.
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

export function BoardScreen() {
  const structure = useStructure();
  const timer = useTimer();
  /*
    Der heutige Tag, **einmal je Ansicht** (E-073 Punkt 2). Er wandert durch
    `BoardColumn` bis an die Karte; ein `useToday` je Karte wäre ein Zeitgeber
    je Karte, und bei achtzig Karten hätte das Board achtzig Zeitgeber auf
    dieselbe Mitternacht.
  */
  const today = useToday();
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

            **Die Ansicht rechnet die Bewegung nicht selbst.** Beide
            Erledigt-Routen liefern `poolMovement`, gerechnet aus dem
            Zustandspaar vor und nach der Handlung; der Satz dazu kommt aus
            derselben Funktion wie der nach einem Timerstart. `null` heißt
            „keine Fläche bewegt sich", und dann steht keine Zeile da. Selbst
            zu rechnen wäre die zweite Fassung einer Auskunft, die E-058 gerade
            auf eine zusammengeführt hat. Vorgeschichte:
            `docs/decisions/board.md`.

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
              Der Rückweg, an allen drei Flächen und mit demselben Schutz
              (B-7 aus T-116, E-059). Die Gegenrichtung („wieder offen")
              bekommt keinen: Sie ist selbst schon die Rücknahme.
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
   * **Kein Bestätigungsdialog, und das ist Absicht.** Zwei Schutzniveaus für
   * dieselbe Handlung lehren, daß eines davon bedeutungslos ist; aufgelöst ist
   * es zugunsten der **schwächeren, ehrlicheren** Fassung. Ein Dialog erklärte
   * vor allem, daß nichts verlorengeht — und das sagt ein Toast mit
   * „Rückgängig" überzeugender, weil man es ausprobieren kann. Die Handlung ist
   * ein `PATCH` auf ein Feld und vollständig umkehrbar; ein Dialog davor
   * kostet jedes Mal einen Klick für einen Schaden, den es nicht gibt.
   *
   * `previous` wird **vor** dem Aufruf gelesen und mitgegeben, nicht hinterher
   * aus dem neu geladenen Bestand geholt: Nach `structure.reload()` steht dort
   * bereits der neue Wert, und „Rückgängig" führte dann zurück auf sich selbst.
   *
   * **Der Wortlaut steht nicht hier** (W-14 aus R-2a). `poolPlacementMessage`
   * in `lib/labels.ts` bildet Titel und Zeile in einem Aufruf, und die
   * Regelliste (S-11) ruft dieselbe Funktion. Einen Titel gibt diese Stelle
   * deshalb nicht mit: Was er sagt, folgt aus dem Ziel und daraus, ob dies der
   * Rückweg ist.
   *
   * Vorgeschichte: `docs/decisions/board.md`.
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
       * (O-A). Es sind zwei Handlungen und nicht eine: Der eine Weg schickt
       * `{ name }`, der andere schreibt alle fünf Achsen neu.
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
      {/*
        Nur noch das **Verhalten** (T-181, ST-05). Die Definition steht im
        Einrichtungsdialog, dort, wo eine Spalte entsteht; hier steht die
        Frage, die vor dem Board tatsaechlich gestellt wird: warum laesst
        sich nichts ziehen, warum ist die Karte weg. Der Satz bleibt
        ungekuerzt — er ist die einzige Stelle, an der Takt erklaert, warum
        A-5.2 seit E-054 nicht mehr gilt (Auflage aus T-177 Abschnitt 1.1).

        Was die haeufigere Frage beantwortet — „warum steht **diese** Karte
        **hier**" —, ist die `RuleSummary` unter jedem Spaltenkopf. Sie ist
        seit T-181 als Definition der Spalte gezeichnet und nicht mehr als
        Fussnote: `.kcolumn__head` ohne Trennlinie, `.rule-summary` in
        `--text-secondary` (`components.css`).
      */}
      <ScreenHeader
        title="Kanban"
        lead={RULE_WHAT_MOVES_A_CARD}
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
                onOpenSetup={() => setSetupOpen(true)}
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
                    today={today}
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
          **Beide** Knöpfe schließen den Dialog, und zwar **vor** der Meldung
          (W-6 aus R-2a).

          Ein offener `FormDialog` trägt `aria-modal="true"` und eine
          Tabulatorschleife; ein Toast liegt außerhalb davon. Ein Knopf, der
          den Dialog offen ließe, legte seinen Rückweg damit an eine Stelle,
          die für Tastatur und Vorlesehilfe nicht vorhanden ist — und seit
          E-059 ist der Rückweg der einzige Schutz vor dieser Handlung. Zwei
          Nachbarknöpfe mit zwei Verhalten lehren außerdem, daß eines davon
          keine Bedeutung hat.

          Die Reihenfolge stimmt von selbst: `setPlacement` zeigt die Meldung
          erst, wenn der `PATCH` geantwortet hat — der Dialog ist dann längst
          zu, und der Fokus steht wieder auf dem Knopf, der ihn geöffnet hat.

          Vorgeschichte: `docs/decisions/board.md`.
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
