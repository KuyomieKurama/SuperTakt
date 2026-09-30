import { useState } from "react";
import { listTimeEntries } from "../bookings/api";
import {
  listTodos,
} from "../todos/api";
import type { TimeEntry, Todo } from "../../api/types";
import { FilterToggle, SearchField } from "../../shared/ui/FilterBar";
import { DoneFlag } from "../../shared/ui/DoneFlag";
import { ExportStatusBadge, exportDisplayState } from "../../shared/ui/ExportStatus";
import { Icon } from "../../shared/ui/Icon";
import { Button, Card, EmptyState, IconButton } from "../../shared/ui/Primitives";
import { TimerDisplay } from "./Timer";
import { previewOpenEntries } from "../../app/dayGroup";
import { useRefresh } from "../../app/RefreshContext";
import { href } from "../../app/router";
import { useTimer } from "./TimerContext";
import { useAsync } from "../../app/useAsync";
import { useToday } from "../../app/useToday";
import { cx } from "../../lib/cx";
import { doneFlagState, labels } from "../../lib/labels";
import { timerTexts } from "./texts";
import {
  formatDuration,
  formatQuarters,
  formatStopwatch,
  formatTime,
  formatTimeRange,
  plural,
} from "../../lib/format";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { ScreenBody, ScreenFrame } from "../../shared/ui/ScreenBody";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import { StatTile } from "../../shared/ui/StatTile";
import { BookingFormDialog } from "../bookings/BookingDialogs";
import { quotedName } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";
import { ServiceText } from "../../shared/ui/ServiceText";
import { todoTexts } from "../todos/texts";

/**
 * Takt — S-05, die Zeiterfassung.
 *
 * Der Bereich heißt **Zeiterfassung**, das Bedienelement darin heißt **Timer**
 * (E-030). Hier entsteht Arbeitszeit, hier wird sie am selben Tag noch einmal
 * angesehen.
 *
 * Der gerundete Wert steht **nicht** an der einzelnen Buchung. Er steht einmal
 * über dem Tag, weil er dorthin gehört: Alle offenen Buchungen desselben Todos
 * an einem Kalendertag ergeben zusammen eine Exportzeile, und erst deren Summe
 * wird aufgerundet (E-020, E-008). Zehn, zwanzig und fünf Minuten sind 0,75 —
 * nicht dreimal 0,25.
 *
 * ## Erledigte Todos sind einblendbar (A-2.5, I-05, E-039, Befund C-04)
 *
 * Die Auswahlliste trägt denselben Schalter wie S-02 und S-04: erledigte
 * Todos ausgeblendet als Voreinstellung (E-039, sonst gäbe es keinen Ort, an
 * den ein reaktiviertes Todo zurückkehren könnte), über einen Schalter
 * einblendbar, mit der Zahl der ausgeblendeten daneben. Startet der Timer auf
 * einem davon, bleibt die Zeile stehen, das Kennzeichen wechselt auf „Erledigt
 * aufgehoben", und der Toast nennt alle drei Wirkungen samt Rückgängig.
 *
 * Vorgeschichte: `docs/decisions/timer.md`.
 */
export function TimeScreen() {
  const timer = useTimer();
  const text = timerTexts();
  const { version } = useRefresh();
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [manualFor, setManualFor] = useState<Todo | null>(null);

  /*
    **Der Tag kommt aus `useToday` und nicht aus einem eingefrorenen `useMemo`**
    (T-154 O-CO, dritte Stelle nachgezogen in T-162 O-DG).

    Er steht in genau einer Frage an den Dienst: „was wurde heute erfasst"
    (`fromDay`/`toDay`). Ein `useMemo` mit leerer Abhängigkeitsliste hielt ihn
    bis zum nächsten Zeichnen fest — ein über Nacht offenes Takt zeigte am
    Morgen unter „Heute" die Buchungen von gestern, und die Kachel darüber
    zählte deren Summe.

    `useToday` beantwortet genau das: ein Zeitgeber auf die **nächste
    Mitternacht** und ein zweiter Anlaß, wenn das Fenster wieder sichtbar wird
    (E-073 Punkt 2). Der Wert wechselt einmal je Tag; die Abfrage unten hängt an
    ihm und läuft dann von selbst neu. Kein Filtervorschlag hängt daran — die
    Auswahl „letzte 7 Tage" gehört S-06, nicht dieser Ansicht.
  */
  const today = useToday();

  const data = useAsync(async () => {
    const [entries, todos, all] = await Promise.all([
      listTimeEntries({ fromDay: today, toDay: today, includeNoExport: true }, { limit: 200 }),
      listTodos(showDone ? {} : { onlyOpen: true }, { limit: 100 }),
      // Wie viele wären es ohne die Ausblendung? Nur gefragt, wenn
      // ausgeblendet wird — sonst ist die Zahl bereits bekannt.
      showDone ? Promise.resolve(null) : listTodos({}, { limit: 1 }),
    ]);

    // A NoExport booking is never open for billing (F-8, A-26.2, A-6.6).
    const openIds = entries.items
      .filter((entry) => entry.exportStatus === "open" && !entry.todoNoExport)
      .map((entry) => entry.id);

    /*
      Der Grund des Fehlschlags kommt mit; die erfasste Zeit daneben stimmt
      unabhaengig davon, sie kommt aus einer anderen Antwort. Vorgeschichte:
      `docs/decisions/timer.md`.
    */
    const outcome = await previewOpenEntries(openIds);
    const preview = outcome.kind === "ready" ? outcome.preview : null;

    return {
      entries: entries.items,
      todos: todos.items,
      hiddenDone: all === null ? 0 : Math.max(0, all.total - todos.total),
      quarters: preview?.totalQuarters ?? null,
      blockedGroups: preview?.skipped.length ?? 0,
      previewProblem: outcome.kind === "failed" ? { message: outcome.message, fromService: outcome.fromService } : null,
    };
  }, [today, showDone], [version]);

  const runningTodoId = timer.running?.entry.todoId ?? null;

  return (
    <section className="screen">
      {/*
        Kein `lead` (T-181, ST-10). Zwei der drei Glieder waren Kartentitel
        („Timer", „Buchungen von heute"), das dritte ein Knopf in jeder Zeile
        der Auswahlliste („Von Hand").

        Diese Ansicht hat keine Aktion im Kopf; der Gewinn ist ein anderer:
        Die Karte „Timer" rueckt nach oben, und Start und Stopp stehen
        unmittelbar unter dem Titel — die richtige Reihenfolge fuer eine
        Ansicht, deren einzige Aufgabe das Laufenlassen einer Uhr ist.
      */}
      <ScreenHeader
        title={text.timeTracking}
        refreshing={data.state.status === "ready" && data.state.refreshing}
      />

      {/*
        **Die eine Ansicht mit zwei Laufbereichen** (T-322 4.5): links „woran
        arbeite ich als nächstes", rechts „was habe ich heute schon erfaßt". Wer
        in der Tagesliste nach unten sieht, soll den Timer und die Todo-Suche
        nicht verlieren — und umgekehrt. Dasselbe Muster wie beim Kanban:
        Kartenkopf steht, Kartenrumpf läuft.

        Die Namen sind die vorhandenen Kartenüberschriften „Todo wählen" und
        „Buchungen von heute". Bei ≤ 68 rem fallen die Spalten untereinander
        (bestehende Regel in `app.css`), und dann gilt R-2: **ein** Laufbereich
        über beide, der Rahmen selbst, mit dem Namen „Zeiterfassung". Zwei
        senkrechte Bildlaufflächen untereinander teilen die Höhe und machen
        beide unbrauchbar.

        Im Lade- und Fehlerzustand gibt es hier nur einen Laufbereich: Der
        Zweispalter entsteht erst mit den Daten, und ein Skelett braucht keine
        zwei Bildlaufflächen.
      */}
      <AsyncBoundary
        state={data.state}
        label={text.timeTrackingLoading}
        onRetry={data.reload}
        fallbackFrame={(content) => <ScreenBody label={text.timeTracking}>{content}</ScreenBody>}
      >
        {(value) => {
          const todaySeconds = value.entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
          const openSeconds = value.entries
            .filter((entry) => entry.exportStatus === "open" && !entry.todoNoExport)
            .reduce((sum, entry) => sum + entry.durationSeconds, 0);

          const candidates = filterTodos(value.todos, search);

          return (
            <ScreenFrame label={text.timeTracking} className="screen__body--split">
              <div className="time-layout">
                <div className="time-layout__main">
                  <Card title={text.timer}>
                    {timer.running === null ? (
                      <div className="timer-panel timer-panel--idle">
                        <TimerDisplay state="idle" display="00:00:00" size="lg" />
                        <p className="timer-panel__hint">
                          {text.idleHint}
                        </p>
                      </div>
                    ) : (
                      <div className="timer-panel timer-panel--running">
                        <TimerDisplay
                          state="running"
                          size="lg"
                          display={formatStopwatch(timer.elapsedSeconds)}
                          todoTitle={timer.running.todoTitle}
                          detail={text.since(formatTime(timer.running.entry.startedAt))}
                          onStop={timer.requestStop}
                        />

                      </div>
                    )}
                  </Card>

                  {/*
                    Laufbereich A trägt seit T-348 die Sprungmarke (T-344 8.5):
                    Er ist der Inhaltshalt dieser Ansicht. Der `--split`-Rahmen
                    behält Halt, Rolle und Namen — er ist unterhalb von 68 rem
                    der einzige senkrechte Läufer —, gibt aber die Marke ab.
                    Oberhalb ruht sein Halt; der Preis steht hier statt im
                    Kleingedruckten.
                  */}
                  <Card
                    title={text.pickTodo}
                    runArea={text.pickTodo}
                    anchor

                    actions={
                      <>
                        <SearchField
                          label={text.searchTodos}
                          value={search}
                          onChange={setSearch}
                          placeholder={text.searchPlaceholder}
                        />
                        {/*
                          E-039, Befund C-04. Derselbe Schalter wie in S-02 und
                          S-04 — und er ist die Bedingung dafür, dass der Satz in
                          der Kartenbeschreibung überhaupt einlösbar ist.
                        */}
                        <FilterToggle
                          label={text.showDone}
                          pressed={showDone}
                          onChange={setShowDone}

                        />
                      </>
                    }
                    flush
                  >
                    {!showDone && value.hiddenDone > 0 ? (
                      <p className="hidden-notice">
                        <Icon name="info" size={14} />
                        <span>
                          {text.hiddenDone(plural(value.hiddenDone, text.hiddenDoneOne, text.hiddenDoneMany))}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setShowDone(true)}>
                          {text.show}
                        </Button>
                      </p>
                    ) : null}

                    {candidates.length === 0 ? (
                      <EmptyState
                        compact
                        icon="search"
                        title={
                          search.trim().length === 0
                            ? showDone
                              ? text.noTodoYet
                              : text.noOpenTodo
                            : text.noMatch
                        }
                        description={
                          search.trim().length === 0
                            ? showDone
                              ? text.createTodoFirst
                              : text.allDone
                            : showDone
                              ? text.noTodoMatches
                              : text.noOpenTodoMatches
                        }
                        {...(showDone || search.trim().length > 0
                          ? {}
                          : {
                              action: (
                                <Button variant="secondary" onClick={() => setShowDone(true)}>
                                  {text.showDone}
                                </Button>
                              ),
                            })}
                      />
                    ) : (
                      <ul className="pick-list">
                        {candidates.slice(0, 30).map((todo) => {
                          const running = runningTodoId === todo.id;
                          const done = todo.completedAt !== null;
                          /*
                            A-2.5, T-005n Abschnitt 1 Regel 1: Nach dem
                            Timerstart darf die Zeile nicht so aussehen, als
                            wäre sie nie erledigt gewesen. Der dritte
                            Anzeigezustand lebt in der Sitzung (`reactivated`)
                            und endet, sobald der Benutzer das Kennzeichen
                            selbst anfasst.
                          */
                          const reactivated = !done && timer.reactivated.has(todo.id);
                          return (
                            <li key={todo.id} className={cx("pick-row", running && "pick-row--running")}>
                              <IconButton
                                label={
                                  running
                                    ? text.stopTimerFor(quotedName(todo.title))
                                    : text.startTimerFor(quotedName(todo.title))
                                }
                                icon={running ? "pause" : "play"}
                                variant={running ? "primary" : "secondary"}
                                onClick={() => timer.toggle(todo.id, todo.title)}
                              />
                              <a className="pick-row__title grow truncate" href={href("todo", todo.id)}>
                                <Foreign value={todo.title} />
                              </a>
                              <DoneFlag state={doneFlagState(done, reactivated)} />
                              {todo.callNumber === null ? null : (
                                <span className="pick-row__call">
                                  {text.call} <Foreign value={todo.callNumber} />
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                iconStart="plus"
                                onClick={() => setManualFor(todo)}
                              >
                                {text.manual}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Card>
                </div>

                <aside className="time-layout__side">
                  <Card title={text.today}>
                    <div className="stat-grid stat-grid--tight">
                      <StatTile
                        label={text.recorded}
                        value={formatDuration(todaySeconds)}
                        detail={plural(value.entries.length, text.booking, text.bookings)}
                      />
                      <StatTile
                        label={text.stillOpen}
                        value={formatDuration(openSeconds)}
                        tone="warning"
                        detail={
                          value.previewProblem !== null
                            ? text.exportUnavailable
                            : value.quarters === null
                              ? text.notExportedYet
                              : text.yieldsAtExport(formatQuarters(value.quarters))
                        }
                      />
                    </div>
                    {/*
                      Der Grund steht unter den Kacheln und nicht in ihnen: Eine
                      Kachel traegt eine Zahl, keine Fehlermeldung. Ohne ihn
                      fehlte auch die Warnung ueber Tagesgruppen ohne Leistung
                      (E-034), ohne dass jemand merkt, warum.
                    */}
                    {value.previewProblem === null ? null : (
                      <p className="daygroup__blocked">
                        <Icon name="alert-triangle" size={14} />
                        <span>
                          {text.previewProblemLead}
                          <ServiceText text={value.previewProblem.message} fromService={value.previewProblem.fromService} />
                          {text.previewProblemTail}
                        </span>
                      </p>
                    )}
                    {value.blockedGroups > 0 ? (
                      <p className="daygroup__blocked">
                        <Icon name="alert-triangle" size={14} />
                        <span>
                          {text.blockedGroups(
                            plural(value.blockedGroups, text.groupHas, text.groupsHave),
                            value.blockedGroups === 1,
                          )}
                        </span>
                      </p>
                    ) : null}
                  </Card>

                  <Card title={text.todayBookings} runArea={text.todayBookings} flush>
                    {value.entries.length === 0 ? (
                      <EmptyState
                        compact
                        icon="clock"
                        title={text.nothingToday}
                        description={text.nothingTodayBody}
                      />
                    ) : (
                      <ul className="entry-list">
                        {[...value.entries]
                          .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
                          .map((entry) => (
                            <TodayRow key={entry.id} entry={entry} />
                          ))}
                      </ul>
                    )}
                  </Card>
                </aside>

                {manualFor === null ? null : (
                  <BookingFormDialog
                    open
                    todoId={manualFor.id}
                    todoTitle={manualFor.title}
                    onClose={() => setManualFor(null)}
                  />
                )}
              </div>
            </ScreenFrame>
          );
        }}
      </AsyncBoundary>
    </section>
  );
}

function TodayRow({ entry }: { readonly entry: TimeEntry }) {
  const text = timerTexts();
  return (
    <li className="entry-row">
      {/* A NoExport booking does not read "offen" for billing (F-8); it says why instead. */}
      {entry.todoNoExport ? (
        <span className="muted entry-row__no-export">{todoTexts().noExport}</span>
      ) : (
        <ExportStatusBadge
          state={exportDisplayState(entry.exportStatus, entry.exportCount)}
          size="sm"
          iconOnly
        />
      )}
      <span className="entry-row__period">{formatTimeRange(entry.startedAt, entry.endedAt)}</span>
      <span className="entry-row__duration tabular">{formatDuration(entry.durationSeconds)}</span>
      <span className="entry-row__note grow truncate">
        {entry.note.length === 0 && !entry.todoNoEvidence ? (
          <span className="muted">{text.withoutNote}</span>
        ) : (
          <Foreign value={entry.note} />
        )}
      </span>
      <span className="entry-row__source">{labels().timeEntrySource[entry.source]}</span>
    </li>
  );
}

function filterTodos(todos: readonly Todo[], search: string): readonly Todo[] {
  const needle = search.trim().toLowerCase();
  if (needle.length === 0) return todos;
  return todos.filter(
    (todo) =>
      todo.title.toLowerCase().includes(needle) ||
      (todo.callNumber ?? "").toLowerCase().includes(needle),
  );
}
