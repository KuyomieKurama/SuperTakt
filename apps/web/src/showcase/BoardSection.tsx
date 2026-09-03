import { useCallback, useMemo, useState } from "react";
import { FilterToggle } from "../components/FilterBar";
import { KanbanCard, KanbanColumn } from "../components/Kanban";
import type { MenuEntry } from "../components/Menu";
import { Card, EmptyState, InlineMessage, Button } from "../components/Primitives";
import { ReactivationNotice } from "../components/Timer";
import { BoardEmptyState } from "../screens/BoardScreen";
import { BOARD_CARDS, BOARD_COLUMNS, type BoardCard } from "./data";
import { Section, SubHeading } from "./Section";

/**
 * Das Kanban-Board nach E-054 — S-04, A-5.1, A-5.3 bis A-5.6.
 *
 * ## Was diese Musterseite zeigt und warum
 *
 * Eine Spalte ist eine **Regel ueber Tags**, dieselbe Entitaet wie ein Pool.
 * Daraus folgen drei Zustaende, die es vor E-054 nicht gab und die hier
 * nebeneinander stehen, weil sie einzeln harmlos und zusammen verwirrend sind:
 *
 *   1. Dieselbe Karte in **zwei** Spalten ("Musterkunde Nord" steht in
 *      "Kunden Nord" und in "Support").
 *   2. Eine Spalte, deren Regel derzeit **nichts** trifft ("Eskalation").
 *   3. Ein **leeres Board** — der Zustand direkt nach der Umstellung.
 *
 * ## Was hier bewusst fehlt
 *
 * Ziehen und Ablegen. Bis T-072 stand an dieser Stelle eine ausfuehrliche
 * Vorfuehrung davon samt Tastaturalternative nach SC 2.5.7. Beides ist mit
 * E-054 gegenstandslos: Eine Regel laesst sich nicht durch Verschieben
 * umkehren, ohne Tags zu setzen. Eine Musterseite, die eine entfernte Geste
 * weiter vorfuehrt, ist schlimmer als keine.
 */

/** Der Leerzustand ist ein eigener Bildschirm — hier zum Umschalten. */
type Stage = "board" | "empty";

export function BoardSection() {
  const [cards, setCards] = useState<readonly BoardCard[]>(BOARD_CARDS);
  const [stage, setStage] = useState<Stage>("board");
  const [showDone, setShowDone] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [reactivatedCardId, setReactivatedCardId] = useState<string | null>(null);

  const columnTitle = useMemo(
    () => new Map(BOARD_COLUMNS.map((column) => [column.id, column.title])),
    [],
  );

  /** Erledigt setzen und zuruecknehmen (I-03). Aendert keine Spalte — nur die Sichtbarkeit. */
  const toggleDone = useCallback((cardId: string) => {
    setCards((previous) =>
      previous.map((candidate) => {
        if (candidate.id !== cardId) return candidate;
        const next = !candidate.done;
        setAnnouncement(
          next
            ? `${candidate.title} ist jetzt erledigt. Die Tags bleiben, die Regeln treffen weiter zu.`
            : `${candidate.title} ist wieder offen.`,
        );
        return { ...candidate, done: next, reactivated: false };
      }),
    );
    setReactivatedCardId((current) => (current === cardId ? null : current));
  }, []);

  /**
   * I-05: Der Timerstart auf einem erledigten Todo hebt "Erledigt" auf
   * (A-2.5). Die Tags aendern sich dabei nicht — die Karte erscheint deshalb
   * genau dort wieder, wo sie vorher stand, sobald erledigte Karten
   * ausgeblendet sind. Gefragt wird nicht; gesagt wird hinterher.
   */
  const toggleTimer = useCallback((cardId: string) => {
    setCards((previous) => {
      const card = previous.find((candidate) => candidate.id === cardId);
      if (card === undefined) return previous;
      const starting = !card.timerRunning;
      const reactivating = starting && card.done;

      if (reactivating) {
        setReactivatedCardId(cardId);
        setAnnouncement(
          `Timer gestartet. „Erledigt“ wurde bei ${card.title} aufgehoben. Das Todo erscheint wieder in seinen Pools und in denselben Spalten wie zuvor.`,
        );
      } else {
        setAnnouncement(`Timer für ${card.title} ${starting ? "gestartet" : "gestoppt"}.`);
      }

      return previous.map((candidate) => {
        if (candidate.id !== cardId) return { ...candidate, timerRunning: false };
        return {
          ...candidate,
          timerRunning: starting,
          done: reactivating ? false : candidate.done,
          reactivated: reactivating ? true : candidate.reactivated === true,
        };
      });
    });
  }, []);

  const undoReactivation = useCallback(() => {
    const cardId = reactivatedCardId;
    if (cardId === null) return;
    setCards((previous) =>
      previous.map((candidate) =>
        candidate.id === cardId
          ? { ...candidate, timerRunning: false, done: true, reactivated: false }
          : candidate,
      ),
    );
    setReactivatedCardId(null);
    setAnnouncement("Zurückgenommen. Das Todo ist wieder erledigt, die Buchung wurde verworfen.");
  }, [reactivatedCardId]);

  const reactivatedCard = cards.find((card) => card.id === reactivatedCardId);

  const cardMenu = useCallback(
    (card: BoardCard, others: readonly string[]): readonly MenuEntry[] => [
      {
        id: "open",
        label: "Todo öffnen",
        icon: "arrow-up-right",
        onSelect: () => setAnnouncement(`${card.title} geöffnet.`),
      },
      {
        id: "tags",
        label: "Tags ändern — sie entscheiden die Spalte",
        icon: "tag",
        onSelect: () => setAnnouncement(`Tags von ${card.title} bearbeiten.`),
      },
      {
        id: "status",
        label: "Status ändern",
        icon: "pencil",
        onSelect: () => setAnnouncement(`Status von ${card.title} ändern.`),
      },
      { kind: "separator", id: "sep-done" },
      {
        id: "done",
        label: card.done ? "Erledigt zurücknehmen" : "Als erledigt markieren",
        icon: card.done ? "rotate-ccw" : "check",
        onSelect: () => toggleDone(card.id),
      },
      ...(others.length === 0
        ? []
        : ([
            { kind: "separator", id: "sep-also" },
            {
              id: "highlight",
              label:
                highlighted === card.id ? "Hervorhebung aufheben" : "Alle Vorkommen hervorheben",
              icon: "copy",
              onSelect: () =>
                setHighlighted((current) => (current === card.id ? null : card.id)),
            },
          ] as const)),
    ],
    [highlighted, toggleDone],
  );

  const columnMenu = useCallback(
    (columnTitleText: string): readonly MenuEntry[] => [
      {
        id: "rule",
        label: "Regel bearbeiten",
        icon: "pencil",
        onSelect: () => setAnnouncement(`Regel von ${columnTitleText} bearbeiten.`),
      },
      {
        id: "list",
        label: "Alle Todos dieser Regel in der Liste",
        icon: "filter",
        onSelect: () => setAnnouncement(`Liste zu ${columnTitleText}.`),
      },
      { kind: "separator", id: "sep" },
      {
        id: "remove",
        label: "Vom Board nehmen",
        icon: "x",
        tone: "danger",
        onSelect: () => setAnnouncement(`${columnTitleText} vom Board genommen.`),
      },
    ],
    [],
  );

  return (
    <Section
      id="board"
      title="5 — Kanban-Board"
      lead="Eine Spalte ist eine Regel über Tags, kein Status (E-054). Deshalb steht dieselbe Karte manchmal in mehreren Spalten, deshalb gibt es kein Ziehen mehr, und deshalb ist das Board nach der Umstellung leer, bis der Benutzer Spalten einrichtet."
      refs={["S-04", "S-11", "A-2.4", "A-2.5", "A-5.1", "A-5.3", "A-5.4", "A-5.6", "E-054", "I-03", "I-05"]}
    >
      <InlineMessage tone="info" title="Was an die Stelle des Ziehens getreten ist">
        Welche Karte in welcher Spalte steht, entscheiden die Tags des Todos. Wer eine Karte
        anderswohin bringen will, ändert ihre Tags — das Kartenmenü sagt das ausdrücklich. Der
        Status bleibt als Eigenschaft am Todo und wird in der Liste und in der Detailansicht
        geändert.
      </InlineMessage>

      <div className="showcase__switch">
        <Button
          variant={stage === "board" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setStage("board")}
        >
          Board mit Spalten
        </Button>
        <Button
          variant={stage === "empty" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setStage("empty")}
        >
          Leeres Board nach der Umstellung
        </Button>
        <FilterToggle
          label="Erledigte einblenden"
          pressed={showDone}
          onChange={setShowDone}
          hint="Voreingestellt ausgeblendet"
        />
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      {stage === "empty" ? (
        <BoardEmptyState
          pools={[]}
          onCreate={() => setAnnouncement("Spalte einrichten.")}
          onAdopt={() => setAnnouncement("Regel aufgenommen.")}
        />
      ) : (
        <div className="board">
          {BOARD_COLUMNS.map((column) => {
            const inColumn = cards.filter((card) => card.columnIds.includes(column.id));
            const visible = showDone ? inColumn : inColumn.filter((card) => !card.done);
            const doneCount = visible.filter((card) => card.done).length;

            return (
              <KanbanColumn
                key={column.id}
                title={column.title}
                count={visible.length}
                total={visible.length}
                doneCount={doneCount}
                rule={<p className="kcolumn__rule-text">{column.rule}</p>}
                entries={columnMenu(column.title)}
                onAdd={() => setAnnouncement(`Neues Todo mit den Tags von ${column.title}.`)}
                addLabel={`Todo in „${column.title}“ anlegen — mit den Tags dieser Regel`}
              >
                {visible.length === 0 ? (
                  <EmptyState
                    compact
                    icon="inbox"
                    title="Keine Karte trifft diese Regel"
                    description="Sobald ein Todo die genannten Tags trägt, erscheint es hier von selbst."
                  />
                ) : (
                  visible.map((card) => {
                    const others = card.columnIds
                      .filter((id) => id !== column.id)
                      .map((id) => columnTitle.get(id))
                      .filter((title): title is string => title !== undefined);

                    return (
                      <KanbanCard
                        key={card.id}
                        card={{
                          ...card,
                          ...(others.length === 0 ? {} : { appearance: { otherColumns: others } }),
                        }}
                        entries={cardMenu(card, others)}
                        highlighted={highlighted === card.id}
                        onOpen={() => setAnnouncement(`${card.title} geöffnet.`)}
                        onToggleTimer={() => toggleTimer(card.id)}
                        {...(others.length === 0
                          ? {}
                          : {
                              onHighlight: () =>
                                setHighlighted((current) =>
                                  current === card.id ? null : card.id,
                                ),
                            })}
                      />
                    );
                  })
                )}
              </KanbanColumn>
            );
          })}
        </div>
      )}

      {reactivatedCard === undefined ? null : (
        <ReactivationNotice
          todoTitle={reactivatedCard.title}
          poolNames={reactivatedCard.columnIds
            .map((id) => columnTitle.get(id))
            .filter((title): title is string => title !== undefined)}
          onUndo={undoReactivation}
          onDismiss={() => setReactivatedCardId(null)}
        />
      )}

      <Card
        title="Dieselbe Karte in mehreren Spalten"
        description="Bei Statusspalten war das unmöglich, bei Regeln ist es der Normalfall: Zwei zutreffende Regeln treffen beide zu."
      >
        <p className="section__lead">
          „Musterkunde Nord — Rechnungslauf prüfen“ trägt die Tags <strong>Musterkunde Nord</strong>{" "}
          (im Ordner Kunden / Nord) und <strong>Support</strong>. Damit trifft es zwei Regeln und
          steht in zwei Spalten. Beide Vorkommen tragen ein Etikett, das die jeweils andere Spalte
          beim Namen nennt; ein Druck darauf hebt alle Vorkommen hervor, ein zweiter nimmt die
          Hervorhebung zurück. Der Weg über die Tastatur ist derselbe — das Etikett ist ein Knopf
          mit <code>aria-pressed</code>, kein Zierrat.
        </p>
        <p className="section__lead">
          Ohne diese Auskunft sähe ein doppeltes Vorkommen wie ein Fehler aus. Verstecken ließe es
          sich nur um den Preis einer Lüge: Die Karte <em>ist</em> in beiden Spalten, weil beide
          Regeln zutreffen.
        </p>

        <SubHeading>Was auf einer Karte steht</SubHeading>
        <p className="section__lead">
          Call-Nummer, Erledigt-Kennzeichen, Titel, das Etikett für Mehrfachvorkommen, Tags mit
          Ordnerpfad, die Zusammenfassung der Exportstände, die erfasste Zeit — und der{" "}
          <strong>Status</strong>. Der steht dort, weil er sonst auf dem Board nirgends mehr
          vorkäme: Er ist seit E-054 keine Spalte mehr, aber er ist nicht abgeschafft.
        </p>
      </Card>

      <Card
        title="Drei Dinge, die nichts voneinander wissen"
        description="Spalte, Status und Erledigt-Kennzeichen. Jede Kombination ist gültig, und keine lässt sich aus einer anderen ableiten."
      >
        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Größe</th>
              <th scope="col">Wo sie steht</th>
              <th scope="col">Wer sie ändert</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spalte</td>
              <td>Eine Regel über Tags (`pool` mit Anzeigeort „Board“)</td>
              <td>Die Tags des Todos — oder die Regel selbst</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>Eigenschaft am Todo (`todo.status_id`)</td>
              <td>Detailansicht und Liste, ausdrücklich</td>
            </tr>
            <tr>
              <td>Erledigt</td>
              <td>Kennzeichen am Todo (`todo.completed_at`)</td>
              <td>Der Benutzer — oder ein Timerstart, der es aufhebt (A-2.5)</td>
            </tr>
          </tbody>
        </table>
        <p className="section__lead">
          Erledigt entscheidet über die <em>Sichtbarkeit</em>, nicht über die Zugehörigkeit: Ein
          erledigtes Todo bleibt Mitglied jeder Regel, die auf seine Tags passt, und erscheint
          wieder, sobald erledigte Karten eingeblendet werden oder ein Timerstart das Kennzeichen
          aufhebt. Probieren Sie es an „Beispiel GmbH — Schnittstelle neu aufsetzen“.
        </p>
      </Card>
    </Section>
  );
}
