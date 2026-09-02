import { useCallback, useState } from "react";
import { FilterBar, FilterToggle, type ActiveFilter } from "../components/FilterBar";
import { ExportSummaryStrip, KanbanCard, KanbanColumn } from "../components/Kanban";
import type { MenuEntry } from "../components/Menu";
import { Card, EmptyState, InlineMessage } from "../components/Primitives";
import { Icon } from "../components/Icon";
import { TagChip } from "../components/Tag";
import { ReactivationNotice } from "../components/Timer";
import { cx } from "../lib/cx";
import { BOARD_CARDS, BOARD_COLUMNS, type BoardCard } from "./data";
import { Section, SubHeading } from "./Section";

/**
 * Zwei Pool-Ansichten ueber demselben Bestand — E-039, E-023, A-3.4.
 *
 * Ein Pool ist ueber eine Tag-Regel definiert; die Zugehoerigkeit wird bei
 * jeder Abfrage neu berechnet und nicht gespeichert (A-3.4). Fuer die
 * Musterseite reicht die Regel als Praedikat.
 */
interface PoolView {
  readonly id: string;
  readonly name: string;
  readonly rule: string;
  readonly matches: (card: BoardCard) => boolean;
}

const POOLS: readonly PoolView[] = [
  {
    id: "pool-intern",
    name: "Intern",
    rule: "Tag „Intern“",
    matches: (card) => card.tags.some((tag) => tag.label === "Intern"),
  },
  {
    id: "pool-kunden",
    name: "Kunden",
    rule: "Ordner „Kunden“, alle Unterordner",
    matches: (card) => card.tags.some((tag) => tag.path?.[0] === "Kunden"),
  },
];

const DRAG_MIME = "application/x-takt-todo";

interface CombinationRow {
  readonly column: string;
  readonly flag: string;
  readonly meaning: string;
  readonly onBoard: string;
}

/**
 * Alle vier Kombinationen aus Statusspalte und Erledigt-Kennzeichen.
 * Zwei davon überraschen, und genau die stehen auf dem Board darüber.
 */
const COMBINATIONS: readonly CombinationRow[] = [
  {
    column: "„In Arbeit“",
    flag: "Offen",
    meaning: "Der Normalfall: wird gerade bearbeitet.",
    onBoard: "„Musterkunde Nord — Rechnungslauf prüfen“",
  },
  {
    column: "„In Arbeit“",
    flag: "Erledigt",
    meaning:
      "Die Arbeit ist fertig, die Karte ist nur noch nicht weitergezogen. Erlaubt und häufig.",
    onBoard: "„Beispiel GmbH — Schnittstelle neu aufsetzen“",
  },
  {
    column: "„Erledigt“",
    flag: "Offen",
    meaning:
      "Die Spalte heißt so, weil der Benutzer sie so genannt hat. Das Todo ist trotzdem offen.",
    onBoard: "„Rückmeldung zur Testumgebung abwarten“",
  },
  {
    column: "„Erledigt“",
    flag: "Erledigt",
    meaning: "Beides trifft zu — der Fall, den man erwartet.",
    onBoard: "„Betriebshandbuch Kapitel 3 abgeschlossen“",
  },
];

export function BoardSection() {
  const [cards, setCards] = useState<readonly BoardCard[]>(BOARD_CARDS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropColumnId, setDropColumnId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [reactivatedCardId, setReactivatedCardId] = useState<string | null>(null);
  /**
   * Je Pool-Ansicht gemerkt, ob erledigte Todos eingeblendet sind (E-039).
   * Voreinstellung ist ausgeblendet; die Menge enthaelt nur die Ansichten, in
   * denen der Benutzer eingeblendet hat.
   */
  const [poolsShowingDone, setPoolsShowingDone] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const setPoolDoneVisible = useCallback((poolId: string, visible: boolean) => {
    setPoolsShowingDone((previous) => {
      const next = new Set(previous);
      if (visible) next.add(poolId);
      else next.delete(poolId);
      return next;
    });
  }, []);

  /**
   * Verschieben ändert die Spalte — und nur die. Das Erledigt-Kennzeichen
   * bleibt, wo es war. Statusspalten sind frei definierbar (A-5.4); die
   * Anwendung darf aus einem Spaltennamen nicht auf „erledigt“ schließen.
   */
  const moveCard = useCallback((cardId: string, targetColumnId: string) => {
    setCards((previous) => {
      const card = previous.find((candidate) => candidate.id === cardId);
      const column = BOARD_COLUMNS.find((candidate) => candidate.id === targetColumnId);
      if (card === undefined || column === undefined || card.columnId === targetColumnId) {
        return previous;
      }
      setAnnouncement(
        `${card.title} verschoben nach ${column.title}. Das Erledigt-Kennzeichen bleibt unverändert: ${card.done ? "erledigt" : "offen"}.`,
      );
      return previous.map((candidate) =>
        candidate.id === cardId ? { ...candidate, columnId: targetColumnId } : candidate,
      );
    });
  }, []);

  const moveByOffset = useCallback(
    (cardId: string, delta: number) => {
      const card = cards.find((candidate) => candidate.id === cardId);
      if (card === undefined) return;
      const index = BOARD_COLUMNS.findIndex((column) => column.id === card.columnId);
      const target = BOARD_COLUMNS[Math.min(Math.max(index + delta, 0), BOARD_COLUMNS.length - 1)];
      if (target === undefined) return;
      moveCard(cardId, target.id);
    },
    [cards, moveCard],
  );

  /** Erledigt setzen und zurücknehmen von Hand (I-03). Ändert die Spalte nicht. */
  const toggleDone = useCallback((cardId: string) => {
    setCards((previous) =>
      previous.map((candidate) => {
        if (candidate.id !== cardId) return candidate;
        const next = !candidate.done;
        setAnnouncement(
          next
            ? `${candidate.title} ist jetzt erledigt. Die Karte bleibt in ihrer Spalte.`
            : `${candidate.title} ist wieder offen. Die Karte bleibt in ihrer Spalte.`,
        );
        return { ...candidate, done: next, reactivated: false };
      }),
    );
    setReactivatedCardId((current) => (current === cardId ? null : current));
  }, []);

  /**
   * I-05: Der Timerstart auf einem erledigten Todo hebt „Erledigt“ auf
   * (A-2.5). Die Karte wechselt dabei die Spalte **nicht** — sie erscheint
   * nur wieder in ihren Pools, weil Pool-Ansichten erledigte Todos ausblenden.
   * Gefragt wird nicht; gesagt wird hinterher, und der Rückweg steht bereit.
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
          `Timer gestartet. „Erledigt“ wurde bei ${card.title} aufgehoben. Das Todo erscheint wieder in seinen Pools und bleibt in seiner Spalte.`,
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

  /** Rückgängig nach I-05: Timer stoppen, Buchung verwerfen, „Erledigt“ zurück. */
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
  /**
   * Pools, in denen das wieder aktivierte Todo nach seinen Tags erscheint
   * (A-3.4). Abgeleitet und nicht fest hinterlegt — eine Meldung, die einen
   * Pool erfindet, waere schlimmer als keine.
   */
  const reactivatedPools =
    reactivatedCard === undefined
      ? []
      : POOLS.filter((pool) => pool.matches(reactivatedCard)).map((pool) => pool.name);

  const cardMenu = useCallback(
    (card: BoardCard): readonly MenuEntry[] => [
      {
        id: "open",
        label: "Todo öffnen",
        icon: "pencil",
        shortcut: "Eingabe",
        onSelect: () => setAnnouncement(`${card.title} geöffnet.`),
      },
      {
        id: "done",
        label: card.done ? "Erledigt zurücknehmen" : "Als erledigt markieren",
        icon: card.done ? "rotate-ccw" : "check",
        onSelect: () => toggleDone(card.id),
      },
      { kind: "separator", id: "sep-move" },
      ...BOARD_COLUMNS.map<MenuEntry>((column) => ({
        id: `move-${column.id}`,
        label: `Verschieben nach „${column.title}“`,
        icon: "chevron-right",
        disabled: column.id === card.columnId,
        ...(column.id === card.columnId ? { disabledReason: "Aktuelle Spalte" } : {}),
        onSelect: () => moveCard(card.id, column.id),
      })),
      { kind: "separator", id: "sep-danger" },
      {
        id: "delete",
        label: "Todo löschen",
        icon: "trash",
        tone: "danger",
        onSelect: () => setAnnouncement(`Löschen angefragt für ${card.title}.`),
      },
    ],
    [moveCard, toggleDone],
  );

  const columnMenu = useCallback(
    (columnTitle: string): readonly MenuEntry[] => [
      {
        id: "rename",
        label: "Spalte umbenennen",
        icon: "pencil",
        onSelect: () => setAnnouncement(`Spalte ${columnTitle} umbenennen.`),
      },
      {
        id: "limit",
        label: "Obergrenze festlegen",
        icon: "filter",
        onSelect: () => setAnnouncement(`Obergrenze für ${columnTitle} festlegen.`),
      },
      { kind: "separator", id: "sep" },
      {
        id: "remove",
        label: "Spalte entfernen",
        icon: "trash",
        tone: "danger",
        onSelect: () => setAnnouncement(`Spalte ${columnTitle} entfernen.`),
      },
    ],
    [],
  );

  return (
    <Section
      id="board"
      title="5 — Kanban-Board"
      lead="Ziehen und Ablegen ist der schnelle Weg. Es ist aber nie der einzige: WCAG 2.2 SC 2.5.7 verlangt für jede Ziehbewegung eine Alternative. Jede Karte trägt deshalb „Verschieben nach …“ im Menü und reagiert auf Strg+Pfeil links und rechts."
      refs={["S-04", "A-2.4", "A-2.5", "A-5.1", "A-5.2", "A-5.4", "A-5.6", "I-03", "I-05", "I-14"]}
    >
      <InlineMessage tone="info" title="So bedienen Sie das Board ohne Maus">
        Mit dem Tabulator auf eine Karte springen, dann <kbd>Strg</kbd> + <kbd>→</kbd> oder{" "}
        <kbd>Strg</kbd> + <kbd>←</kbd>. Alternativ das Kartenmenü öffnen und eine Zielspalte wählen.
        Jede Verschiebung wird angesagt.
      </InlineMessage>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="kboard">
        {BOARD_COLUMNS.map((column) => {
          const columnCards = cards.filter((card) => card.columnId === column.id);
          const doneCount = columnCards.filter((card) => card.done).length;
          return (
            <KanbanColumn
              key={column.id}
              title={column.title}
              count={columnCards.length}
              {...(column.limit === undefined ? {} : { limit: column.limit })}
              doneCount={doneCount}
              entries={columnMenu(column.title)}
              dropTarget={dropColumnId === column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setDropColumnId(column.id);
              }}
              onDragLeave={() => setDropColumnId(null)}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData(DRAG_MIME);
                setDropColumnId(null);
                setDraggingId(null);
                if (id !== "") moveCard(id, column.id);
              }}
              onAdd={() => setAnnouncement(`Neues Todo in ${column.title}.`)}
            >
              {columnCards.length === 0 ? (
                <EmptyState
                  compact
                  icon="inbox"
                  title="Keine Todos"
                  description="Karte hierher ziehen oder mit dem Pluszeichen anlegen."
                />
              ) : (
                columnCards.map((card) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    entries={cardMenu(card)}
                    dragging={draggingId === card.id}
                    onOpen={() => setAnnouncement(`${card.title} geöffnet.`)}
                    onToggleTimer={() => toggleTimer(card.id)}
                    onMoveByKeyboard={(delta) => moveByOffset(card.id, delta)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(DRAG_MIME, card.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(card.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropColumnId(null);
                    }}
                  />
                ))
              )}
            </KanbanColumn>
          );
        })}
      </div>

      {reactivatedCard !== undefined ? (
        <ReactivationNotice
          todoTitle={reactivatedCard.title}
          poolNames={reactivatedPools}
          onUndo={undoReactivation}
          onDismiss={() => setReactivatedCardId(null)}
        />
      ) : null}

      <Card
        title="Spalte und „Erledigt“ sind zwei verschiedene Dinge"
        description="Die Statusspalten sind frei definierbar (A-5.4). Ein Kanban-Abschluss ist deshalb kein Erledigt: Ein Todo kann in „Erledigt“ stehen und offen sein, und es kann in „In Arbeit“ stehen und erledigt sein. Beide überraschenden Fälle stehen oben auf dem Board."
      >
        <p className="section__lead">
          Damit man nie raten muss, welcher der beiden Zustände gerade welcher ist, trägt{" "}
          <strong>jede Karte ihr Erledigt-Kennzeichen ausdrücklich</strong> — auch dann, wenn es
          „Offen“ lautet. Der Normalfall flüstert (schmale Kontur, gedämpft), der auffällige Fall
          spricht (gefülltes grünes Etikett, durchgestrichener Titel). Der Spaltenkopf zählt
          zusätzlich, wie viele seiner Todos erledigt sind. Wäre das Kennzeichen nur beim Zustand
          „erledigt“ da, müsste man es aus dem Spaltennamen erschließen — und genau das ist der
          Fehler, den die Trennung verhindern soll.
        </p>

        <SubHeading>Die vier Kombinationen</SubHeading>
        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Spalte</th>
              <th scope="col">Kennzeichen</th>
              <th scope="col">Bedeutung</th>
              <th scope="col">Auf dem Board oben</th>
            </tr>
          </thead>
          <tbody>
            {COMBINATIONS.map((row) => (
              <tr key={`${row.column}-${row.flag}`}>
                <td>{row.column}</td>
                <td>{row.flag}</td>
                <td>{row.meaning}</td>
                <td>{row.onBoard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        title="Zwei Wege, zwei Wirkungen — zum Ausprobieren"
        description="Beide Zustände lassen sich unabhängig voneinander ändern. Was der eine Weg anfasst, lässt der andere in Ruhe."
      >
        <ul className="intro__list">
          <li className="intro__item">
            <span className="intro__step" aria-hidden>
              ↔
            </span>
            <p className="intro__text">
              <strong>Karte verschieben</strong> — ziehen, <kbd>Strg</kbd> + <kbd>→</kbd> oder
              „Verschieben nach …“ im Kartenmenü. Ändert die Spalte. Das Kennzeichen bleibt, wie es
              war; die Ansage nennt es ausdrücklich mit.
            </p>
          </li>
          <li className="intro__item">
            <span className="intro__step" aria-hidden>
              ✓
            </span>
            <p className="intro__text">
              <strong>Erledigt setzen oder zurücknehmen</strong> — „Als erledigt markieren“ im
              Kartenmenü. Ändert das Kennzeichen. Die Karte bleibt, wo sie ist.
            </p>
          </li>
          <li className="intro__item">
            <span className="intro__step" aria-hidden>
              ▶
            </span>
            <p className="intro__text">
              <strong>Timer auf einem erledigten Todo starten</strong> — der Abspielknopf auf
              „Beispiel GmbH — Schnittstelle neu aufsetzen“. Takt hebt „Erledigt“ von sich aus auf
              (A-2.5), fragt dabei nicht und sagt es hinterher: Der Hinweis unter dem Board nennt
              die Pools, in denen das Todo wieder erscheint, sagt ausdrücklich, dass die Spalte
              gleich bleibt, und bietet „Rückgängig“ an. Die Karte trägt danach das Kennzeichen
              „Erledigt aufgehoben“, damit später niemand rätselt, warum das Häkchen weg ist.
            </p>
          </li>
        </ul>
      </Card>

      <Card
        title="Pool-Ansichten blenden erledigte Todos aus"
        description="Genau daran hängt A-2.5: Ein erledigtes Todo verschwindet aus seinen Pools, ein wieder aktiviertes erscheint dort erneut. Wäre es dauerhaft sichtbar, gäbe es nichts, wohin es zurückkehren könnte. Ausgeblendet ist die Voreinstellung; der Schalter in der Filterleiste blendet ein, und die Wahl wird je Ansicht gemerkt (E-039)."
      >
        <p className="section__lead">
          Die beiden Listen zeigen denselben Bestand wie das Board oben und ändern sich mit ihm.
          Starten Sie den Timer auf „Beispiel GmbH — Schnittstelle neu aufsetzen“: Das Todo ist
          erledigt und deshalb im Pool <strong>Kunden</strong> nicht zu sehen — nach dem Timerstart
          steht es wieder da. Der Schalter steht bewusst in der Filterleiste und nicht in einem
          Menü: Ein Filter, der als Voreinstellung greift, muss sichtbar sein, sonst sucht jemand
          ein Todo, das er selbst abgehakt hat.
        </p>

        <div className="grid grid--2">
          {POOLS.map((pool) => {
            const inPool = cards.filter((card) => pool.matches(card));
            const showDone = poolsShowingDone.has(pool.id);
            const visible = showDone ? inPool : inPool.filter((card) => !card.done);
            const hidden = inPool.length - visible.length;
            const activeFilters: readonly ActiveFilter[] = showDone
              ? []
              : [
                  {
                    id: `${pool.id}-done`,
                    field: "Erledigte Todos",
                    value: "ausgeblendet",
                    onRemove: () => setPoolDoneVisible(pool.id, true),
                  },
                ];

            return (
              <Card key={pool.id} title={`Pool „${pool.name}“`} description={`Regel: ${pool.rule}`}>
                <FilterBar
                  label={`Pool ${pool.name} filtern`}
                  controls={
                    <FilterToggle
                      label="Erledigte Todos anzeigen"
                      pressed={showDone}
                      hint={
                        hidden === 0
                          ? "derzeit keins ausgeblendet"
                          : `${hidden} ${hidden === 1 ? "Todo" : "Todos"} ausgeblendet`
                      }
                      onChange={(next) => setPoolDoneVisible(pool.id, next)}
                    />
                  }
                  activeFilters={activeFilters}
                  onResetAll={() => setPoolDoneVisible(pool.id, true)}
                  resultLabel={`${visible.length} von ${inPool.length} Todos`}
                />

                {visible.length === 0 ? (
                  <EmptyState
                    compact
                    icon="inbox"
                    title="Kein Todo in diesem Pool"
                    description={
                      hidden === 0
                        ? "Zu dieser Regel passt derzeit kein Tag."
                        : "Alle Todos dieses Pools sind erledigt. Der Schalter oben blendet sie ein."
                    }
                  />
                ) : (
                  <ul className="poollist">
                    {visible.map((card) => (
                      <li
                        className={cx("poollist__item", card.done && "poollist__item--done")}
                        key={card.id}
                      >
                        <span className="poollist__flag">
                          <Icon name={card.done ? "check" : "circle"} size={11} />
                          <span className="visually-hidden">
                            {card.done ? "Erledigt" : "Offen"}
                          </span>
                        </span>
                        <span className="poollist__main">
                          <span className="poollist__title truncate">{card.title}</span>
                          <span className="poollist__tags">
                            {card.tags.map((tag) => (
                              <TagChip
                                key={`${tag.path?.join("/") ?? ""}/${tag.label}`}
                                label={tag.label}
                                size="sm"
                                {...(tag.path === undefined ? {} : { path: tag.path })}
                              />
                            ))}
                          </span>
                        </span>
                        <ExportSummaryStrip summary={card.exportSummary} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </Card>

      <Card
        title="Was die Karte zeigt"
        description="Call-Nummer, Erledigt-Kennzeichen, Titel, Tags mit Ordnerpfad, Zusammenfassung der Exportstände, erfasste Zeit und der Timer-Knopf. Läuft der Timer, bekommt die Karte eine violette Kante — dieselbe Farbe wie die Timer-Anzeige, und keine, die für einen Exportstatus steht."
      >
        <p className="section__lead">
          Die Spaltenstruktur ist konfigurierbar (A-5.4): Umbenennen, Obergrenze und Entfernen
          liegen im Spaltenmenü. Wird eine Obergrenze überschritten, färbt sich der Zähler und sagt
          es Hilfsmitteln zusätzlich an. Das Kennzeichen „Erledigt aufgehoben“ trägt bewusst keine
          eigene Statusfarbe: Bernstein, Grün und Rosé gehören dem Exportstatus, Violett dem
          laufenden Timer. Hier tragen Symbol und gestrichelter Rand die Aussage.
        </p>
      </Card>
    </Section>
  );
}
