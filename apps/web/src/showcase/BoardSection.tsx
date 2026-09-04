import { poolMovementSentence, type PoolMovement } from "@takt/domain";
import { useCallback, useMemo, useState } from "react";
import { useToasts } from "../app/ToastContext";
import { FilterToggle } from "../components/FilterBar";
import { KanbanCard, KanbanColumn } from "../components/Kanban";
import type { MenuEntry } from "../components/Menu";
import { Card, InlineMessage, Button, LoadingBlock } from "../components/Primitives";
import { RuleSummary } from "../components/RuleSummary";
import { describeRule, describeRuleReach } from "../lib/poolRule";
import { BoardColumnEmpty, BoardEmptyState } from "../screens/BoardScreen";
import { BOARD_CARDS, BOARD_COLUMNS, SHOWCASE_RULE_LOOKUP, type BoardCard } from "./data";
import { reactivationTitle, RULE_IS_A_RULE, RULE_WHAT_MOVES_A_CARD } from "../lib/labels";
import { Section, SubHeading } from "./Section";

/**
 * Das Kanban-Board nach E-054 — S-04, A-5.1, A-5.3 bis A-5.6.
 *
 * ## Was diese Musterseite zeigt und warum
 *
 * Eine Spalte ist eine **Regel**, dieselbe Entitaet wie ein Pool — und seit
 * E-055 eine Regel ueber fuenf Bedingungen: erforderliche Tags, ausgeschlossene
 * Tags, Status, „Erledigt" und Exportstatus.
 * Daraus folgen Zustaende, die es vor E-054 nicht gab und die hier
 * nebeneinander stehen, weil sie einzeln harmlos und zusammen verwirrend sind:
 *
 *   1. Dieselbe Karte in **zwei** Spalten ("Musterkunde Nord" steht in
 *      "Kunden Nord" und in "Support").
 *   2. Eine Spalte, deren Regel derzeit **nichts** trifft ("Eskalation").
 *   3. Ein **leeres Board** — der Zustand direkt nach der Umstellung.
 *   4. Die **Leerzustaende einer Spalte** nebeneinander (T-083, T-087). Sie
 *      unterscheiden sich nur im Text und in der angebotenen Handlung, und
 *      genau einer von ihnen ist ein Einrichtungsfehler — er steht zweimal da,
 *      einmal allein und einmal neben einer gesunden Bedingung, weil er in
 *      dieser zweiten Form bis T-087 unsichtbar war.
 *   5. **Laden und Scheitern** (T-091). Beides galt bis dahin als
 *      selbstverstaendlich und stand deshalb nirgends — und was nirgends
 *      steht, wird nicht abgenommen, sondern geglaubt. Beide gelten fuer die
 *      **ganze** Seite und nicht je Spalte: Der Dienst liefert das Board in
 *      einer Antwort.
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

/**
 * Die vier Leerzustaende einer Spalte, in der Reihenfolge, in der sie zu lesen
 * sind (T-083, T-087): erst der harmlose, dann der Fehler, dann derselbe
 * Fehler neben einer gesunden Bedingung, dann der unfertige.
 *
 * Der dritte ist der Grund fuer T-087: Seine Achsensumme steht auf `1`, und
 * bis dahin sah er aus wie der erste — "gerade passt nichts" statt "hier fehlt
 * ein Tag". Er steht deshalb unmittelbar neben dem zweiten, damit beide
 * denselben Satz sagen.
 *
 * Aus `BOARD_COLUMNS` gefiltert und nicht daneben getippt — sonst zeigte diese
 * Aufstellung Regeln, die es im Board darueber nicht gibt.
 */
const EMPTY_COLUMN_IDS: readonly string[] = [
  "eskalation",
  "kunden-ost",
  "support-oder-ost",
  "neu",
];

const EMPTY_COLUMNS = EMPTY_COLUMN_IDS.flatMap((id) =>
  BOARD_COLUMNS.filter((column) => column.id === id),
);

/**
 * Die Bewegung, wie der Dienst sie beim Start gemeldet haette (E-058).
 *
 * In der Anwendung kommt sie als `poolMovement` mit `POST /timer/start`; auf
 * dieser Seite gibt es keinen Dienst, also wird sie aus dem gestellt, was hier
 * ohnehin sichtbar ist: den Spalten, in denen die Karte danach steht. Der
 * **Satz** dazu entsteht auch hier in `poolMovementSentence` und wird nicht
 * abgeschrieben.
 *
 * `leaves` bleibt leer, und das ist keine Bequemlichkeit — **keine** der
 * Spalten dieser Musterseite fragt nach „Erledigt: nur erledigte", also gibt
 * es hier nichts zu verlassen. Wie der Satz mit besetztem `leaves` klingt,
 * steht in Abschnitt 6 neben den drei uebrigen Faellen.
 */
function movementOf(card: BoardCard, columnTitle: ReadonlyMap<string, string>): PoolMovement {
  const names = card.columnIds
    .map((id) => columnTitle.get(id))
    .filter((title): title is string => title !== undefined);
  return { appears: names, enters: names, leaves: [] };
}

export function BoardSection() {
  const toasts = useToasts();
  const [cards, setCards] = useState<readonly BoardCard[]>(BOARD_CARDS);
  const [stage, setStage] = useState<Stage>("board");
  const [showDone, setShowDone] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const columnTitle = useMemo(
    () => new Map(BOARD_COLUMNS.map((column) => [column.id, column.title])),
    [],
  );

  /**
   * Erledigt setzen und zuruecknehmen (I-03).
   *
   * Gesagt wird nur das Faktum. Bis T-094 stand hier „die Regeln treffen weiter
   * zu" — eine Behauptung ueber Spalten, die seit E-055 falsch sein kann: Eine
   * Regel darf nach „Erledigt" fragen, und dann wechselt die Karte mit genau
   * dieser Handlung. Dieselbe Zurueckhaltung uebt der echte Board-Toast
   * (S-3 aus R-2).
   */
  const toggleDone = useCallback((cardId: string) => {
    setCards((previous) =>
      previous.map((candidate) => {
        if (candidate.id !== cardId) return candidate;
        const next = !candidate.done;
        setAnnouncement(
          next
            ? `${candidate.title} ist jetzt erledigt. Tags und Status ändern sich dadurch nicht.`
            : `${candidate.title} ist wieder offen.`,
        );
        return { ...candidate, done: next, reactivated: false };
      }),
    );
  }, []);

  /**
   * Der Rueckweg aus der Meldung (I-05): Timer aus, „Erledigt" zurueck, die
   * eben entstandene Buchung verworfen.
   *
   * Die Karte kommt als Argument und nicht aus einem Zustand: Die Meldung
   * haelt ihren Bezug selbst, solange sie steht, und zwei Meldungen
   * nebeneinander meinen dann auch zwei verschiedene Karten.
   */
  const undoReactivation = useCallback((cardId: string) => {
    setCards((previous) =>
      previous.map((candidate) =>
        candidate.id === cardId
          ? { ...candidate, timerRunning: false, done: true, reactivated: false }
          : candidate,
      ),
    );
    setAnnouncement("Zurückgenommen. Das Todo ist wieder erledigt, die Buchung wurde verworfen.");
  }, []);

  /**
   * I-05: Der Timerstart auf einem erledigten Todo hebt "Erledigt" auf
   * (A-2.5). Gefragt wird nicht; gesagt wird hinterher — auf zwei Flaechen:
   * dem Etikett „Erledigt aufgehoben" an der Karte und der **Meldung** unten
   * rechts, mit dem Rueckweg darin.
   *
   * Bis T-108 stand an der Stelle der Meldung `ReactivationNotice`, eine
   * eigene Hinweisflaeche unter dem Board — die keine Ansicht der Anwendung je
   * eingesetzt hat (W-9 aus R-2a). Jetzt zeigt die Musterseite denselben
   * Baustein wie das Produkt.
   *
   * **Der Zustand wird ausserhalb des Aktualisierers gerechnet.** Bis T-108
   * riefen `setAnnouncement` und die Auswahl der Karte mitten in `setCards`;
   * eine Meldung waere dort im Doppellauf des `StrictMode` **zweimal**
   * erschienen. Der Aktualisierer bildet jetzt nur noch die neue Liste.
   */
  const toggleTimer = useCallback(
    (cardId: string) => {
      const card = cards.find((candidate) => candidate.id === cardId);
      if (card === undefined) return;
      const starting = !card.timerRunning;
      const reactivating = starting && card.done;

      setCards((previous) =>
        previous.map((candidate) => {
          if (candidate.id !== cardId) return { ...candidate, timerRunning: false };
          return {
            ...candidate,
            timerRunning: starting,
            done: reactivating ? false : candidate.done,
            reactivated: reactivating ? true : candidate.reactivated === true,
          };
        }),
      );

      if (!reactivating) {
        setAnnouncement(`Timer für ${card.title} ${starting ? "gestartet" : "gestoppt"}.`);
        return;
      }

      /*
        Titel aus `lib/labels.ts`, Rumpf aus `@takt/domain` — wie in der
        Anwendung. Die Meldung sagt es damit selbst; eine zweite, versteckte
        Ansage waere derselbe Satz ein zweites Mal, und der Toast liegt
        ohnehin in einem `aria-live`-Bereich.
      */
      toasts.show({
        tone: "success",
        title: reactivationTitle(card.title),
        body: poolMovementSentence(movementOf(card, columnTitle), "past", "reopen"),
        action: { label: "Rückgängig", onSelect: () => undoReactivation(cardId) },
      });
    },
    [cards, columnTitle, toasts, undoReactivation],
  );

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
      lead={`${RULE_IS_A_RULE} Kein Status und kein Ablageort (E-054, E-055). Deshalb steht dieselbe Karte manchmal in mehreren Spalten, deshalb gibt es kein Ziehen mehr, und deshalb ist das Board nach der Umstellung leer, bis der Benutzer Spalten einrichtet.`}
      refs={["S-04", "S-11", "A-2.4", "A-2.5", "A-5.1", "A-5.3", "A-5.4", "A-5.6", "E-054", "I-03", "I-05"]}
    >
      <InlineMessage tone="info" title="Was an die Stelle des Ziehens getreten ist">
        {RULE_WHAT_MOVES_A_CARD} Wer eine Karte anderswohin bringen will, ändert am Todo das,
        wonach die Regel fragt — meist ein Tag, manchmal den Status; das Kartenmenü sagt das
        ausdrücklich. Der Status bleibt dabei eine Eigenschaft des Todos und wird in der Liste und
        in der Detailansicht geändert.
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
            const description = describeRule(column.rule, SHOWCASE_RULE_LOOKUP);
            const reach = describeRuleReach(description, column.resolved);

            return (
              <KanbanColumn
                key={column.id}
                title={column.title}
                count={visible.length}
                total={visible.length}
                doneCount={doneCount}
                rule={
                  <RuleSummary
                    description={description}
                    reach={reach}
                    emptyText="Ohne Bedingung — diese Spalte bleibt leer."
                  />
                }
                entries={columnMenu(column.title)}
                onAdd={() => setAnnouncement(`Neues Todo mit den Tags von ${column.title}.`)}
                addLabel={`Todo in „${column.title}“ anlegen — mit den Tags dieser Regel`}
              >
                {visible.length === 0 ? (
                  <BoardColumnEmpty
                    reach={reach}
                    onEditRule={() => setAnnouncement(`Regel von ${column.title} bearbeiten.`)}
                    onOpenTags={() => setAnnouncement("Zu den Tags.")}
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

      <SubHeading>Die Leerzustände einer Spalte</SubHeading>
      <p className="section__lead">
        Eine leere Spalte ist keine Auskunft, sondern eine Frage: <strong>warum</strong> ist sie
        leer? Es gibt drei Antworten, sie verlangen drei verschiedene Handlungen, und nur die
        mittlere ist ein Einrichtungsfehler. Sie stehen hier nebeneinander, weil sie sich allein im
        Text unterscheiden — getrennt gepflegt liefen sie binnen einer Aufgabe auseinander. Der
        Einrichtungsfehler steht zweimal: allein und neben einer gesunden Bedingung. Die zweite
        Form sah bis T-087 aus wie die erste Spalte, weil die Achsensumme dort positiv bleibt —
        seither entscheidet die Auflösung <strong>je Term</strong>, und die Spalte nennt den leeren
        Ordner beim Namen.
      </p>
      <div className="board">
        {EMPTY_COLUMNS.map((column) => {
          const description = describeRule(column.rule, SHOWCASE_RULE_LOOKUP);
          const reach = describeRuleReach(description, column.resolved);

          return (
            <KanbanColumn
              key={column.id}
              title={column.title}
              count={0}
              total={0}
              doneCount={0}
              rule={
                <RuleSummary
                  description={description}
                  reach={reach}
                  emptyText="Ohne Bedingung — diese Spalte bleibt leer."
                />
              }
              entries={columnMenu(column.title)}
            >
              <BoardColumnEmpty
                reach={reach}
                onEditRule={() => setAnnouncement(`Regel von ${column.title} bearbeiten.`)}
                onOpenTags={() => setAnnouncement("Zu den Tags.")}
              />
            </KanbanColumn>
          );
        })}
      </div>
      <SubHeading>Wie das Board lädt und wie es scheitert</SubHeading>
      <p className="section__lead">
        Die Leerzustände oben sind Auskünfte über eingerichtete Spalten. Davor stehen zwei
        Zustände, die gar nichts über die Regeln sagen — und die bis T-091 auf dieser Seite
        fehlten: Das Board <strong>lädt</strong>, und das Board <strong>ließ sich nicht laden</strong>.
        Beide kommen aus <code>AsyncBoundary</code> und gelten für die ganze Seite, nicht je
        Spalte: Der Dienst liefert das Board in einer Antwort, und eine Spalte, die für sich lädt,
        gäbe es nirgends.
      </p>
      <div className="grid grid--2">
        <Card title="Lädt" description="Vier Platzhalterzeilen, angesagt als „Board wird geladen“.">
          <LoadingBlock label="Board wird geladen" rows={4} />
        </Card>
        <Card
          title="Ließ sich nicht laden"
          description="Die Meldung des Dienstes samt Fehlerschlüssel und ein Weg zurück — nie eine Sackgasse."
        >
          <InlineMessage
            tone="danger"
            title="Das ließ sich nicht laden"
            action={
              <Button
                size="sm"
                variant="secondary"
                iconStart="rotate-ccw"
                onClick={() => setAnnouncement("Erneut versucht.")}
              >
                Erneut versuchen
              </Button>
            }
          >
            Der lokale Dienst antwortet nicht.
            <span className="message__code"> (service_unavailable)</span>
          </InlineMessage>
        </Card>
      </div>

      <InlineMessage tone="info" title="Warum der leere Ordner eigens dasteht">
        Ein erforderlicher Ordner, in dem kein Tag liegt, löst sich <strong>nie</strong> von
        selbst auf — im Unterschied zu „trifft gerade nichts", das mit dem nächsten passenden Todo
        vorbei ist. Deshalb nennt dieser Zustand den Ordner beim Namen, markiert ihn in der
        Zusammenfassung darüber und bietet den Weg an, auf dem er zu beheben ist. Ausgeschlossene
        Ordner ohne Tag sind davon nicht betroffen: Was leer ist, schließt nichts aus, und eine
        Warnung ohne Folge glaubt beim nächsten Mal niemand mehr (E-057).
      </InlineMessage>

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
              <td>Eine Regel (`pool` mit Anzeigeort „Board“)</td>
              <td>
                Die fünf Bedingungen der Regel — Tags, Status, „Erledigt“, Exportstatus — oder
                die Regel selbst
              </td>
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
          <strong>Was „Erledigt“ entscheidet, hängt an der Regel</strong> (E-055). Steht ihre
          Erledigt-Bedingung auf „Alle“, entscheidet das Kennzeichen nur über die{" "}
          <em>Sichtbarkeit</em>: Das Todo bleibt Mitglied und erscheint wieder, sobald erledigte
          Karten eingeblendet werden oder ein Timerstart das Kennzeichen aufhebt. Fragt die Regel
          dagegen ausdrücklich nach „Erledigt“ oder „Unerledigt“, entscheidet das Kennzeichen
          über die <em>Zugehörigkeit</em> — dann verlässt die Karte mit demselben Timerstart ihre
          Spalte.
        </p>
        <p className="section__lead">
          Bis T-091 stand hier der halbe Satz „Erledigt entscheidet über die Sichtbarkeit, nicht
          über die Zugehörigkeit“. Er war die richtige Erklärung für E-054 und mit E-055 zur
          halben geworden. Probieren Sie beides an „Beispiel GmbH — Schnittstelle neu aufsetzen“.
        </p>
      </Card>
    </Section>
  );
}
