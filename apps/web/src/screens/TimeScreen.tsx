import { useMemo, useState } from "react";
import { listTimeEntries, listTodos } from "../api/endpoints";
import type { TimeEntry, Todo } from "../api/types";
import { FilterToggle, SearchField } from "../components/FilterBar";
import { DoneFlag } from "../components/DoneFlag";
import { ExportStatusBadge, exportDisplayState } from "../components/ExportStatus";
import { Icon } from "../components/Icon";
import { Button, Card, EmptyState, IconButton } from "../components/Primitives";
import { TimerDisplay } from "../components/Timer";
import { previewOpenEntries } from "../app/dayGroup";
import { useRefresh } from "../app/RefreshContext";
import { href } from "../app/router";
import { useTimer } from "../app/TimerContext";
import { useAsync } from "../app/useAsync";
import { cx } from "../lib/cx";
import { doneFlagState, TIME_ENTRY_SOURCE_LABEL } from "../lib/labels";
import {
  formatDuration,
  formatQuarters,
  formatStopwatch,
  formatTime,
  formatTimeRange,
  plural,
  todayCalendarDay,
} from "../lib/format";
import { AsyncBoundary, ScreenHeader, StatTile } from "./parts";
import { BookingFormDialog } from "./BookingDialogs";

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
 * Bis T-040 lud diese Ansicht ihre Auswahlliste mit `onlyOpen: true`. Ein
 * erledigtes Todo erschien hier also nie — und daneben stand trotzdem der Satz
 * „Startet der Timer auf einem erledigten Todo, ist es danach wieder offen."
 * Ein Versprechen, das der Screen nicht einlösen konnte, ist schlimmer als
 * kein Satz.
 *
 * Jetzt trägt die Auswahlliste denselben Schalter wie S-02 und S-04: erledigte
 * Todos ausgeblendet als Voreinstellung (E-039, sonst gäbe es keinen Ort, an
 * den ein reaktiviertes Todo zurückkehren könnte), über einen Schalter
 * einblendbar, mit der Zahl der ausgeblendeten daneben. Startet der Timer auf
 * einem davon, bleibt die Zeile stehen, das Kennzeichen wechselt auf „Erledigt
 * aufgehoben", und der Toast nennt alle drei Wirkungen samt Rückgängig.
 */
export function TimeScreen() {
  const timer = useTimer();
  const { version } = useRefresh();
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [manualFor, setManualFor] = useState<Todo | null>(null);

  const today = useMemo(() => todayCalendarDay(), []);

  const data = useAsync(async () => {
    const [entries, todos, all] = await Promise.all([
      listTimeEntries({ fromDay: today, toDay: today }, { limit: 200 }),
      listTodos(showDone ? {} : { onlyOpen: true }, { limit: 100 }),
      // Wie viele wären es ohne die Ausblendung? Nur gefragt, wenn
      // ausgeblendet wird — sonst ist die Zahl bereits bekannt.
      showDone ? Promise.resolve(null) : listTodos({}, { limit: 1 }),
    ]);

    const openIds = entries.items
      .filter((entry) => entry.exportStatus === "open")
      .map((entry) => entry.id);

    /*
      Bis T-045 wurde der Fehlschlag hier verschluckt, und die Kachel „Noch
      offen" sagte danach „Noch nicht exportiert." — richtig geraten, aber
      nicht gewusst. Der Grund kommt jetzt mit; die erfasste Zeit daneben
      stimmt unabhaengig davon, sie kommt aus einer anderen Antwort.
    */
    const outcome = await previewOpenEntries(openIds);
    const preview = outcome.kind === "ready" ? outcome.preview : null;

    return {
      entries: entries.items,
      todos: todos.items,
      hiddenDone: all === null ? 0 : Math.max(0, all.total - todos.total),
      quarters: preview?.totalQuarters ?? null,
      blockedGroups: preview?.skipped.length ?? 0,
      previewProblem: outcome.kind === "failed" ? outcome.message : null,
    };
  }, [today, showDone], [version]);

  const runningTodoId = timer.running?.entry.todoId ?? null;

  return (
    <section className="screen">
      <ScreenHeader
        title="Zeiterfassung"
        lead="Timer starten und stoppen, heutige Buchungen ansehen, Zeit von Hand nachtragen."
        refreshing={data.state.status === "ready" && data.state.refreshing}
      />

      <AsyncBoundary state={data.state} label="Zeiterfassung wird geladen" onRetry={data.reload}>
        {(value) => {
          const todaySeconds = value.entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
          const openSeconds = value.entries
            .filter((entry) => entry.exportStatus === "open")
            .reduce((sum, entry) => sum + entry.durationSeconds, 0);

          const candidates = filterTodos(value.todos, search);

          return (
            <div className="time-layout">
              <div className="time-layout__main">
                <Card title="Timer" description="Es läuft höchstens einer.">
                  {timer.running === null ? (
                    <div className="timer-panel timer-panel--idle">
                      <TimerDisplay state="idle" display="00:00:00" size="lg" />
                      <p className="timer-panel__hint">
                        Kein Timer läuft. Wählen Sie unten ein Todo — oder starten Sie den Timer
                        direkt aus der Todo-Liste, dem Kanban-Board oder dem Dashboard.
                      </p>
                    </div>
                  ) : (
                    <div className="timer-panel timer-panel--running">
                      <TimerDisplay
                        state="running"
                        size="lg"
                        display={formatStopwatch(timer.elapsedSeconds)}
                        todoTitle={timer.running.todoTitle}
                        detail={`seit ${formatTime(timer.running.entry.startedAt)} Uhr`}
                        onStop={timer.requestStop}
                      />
                      <p className="timer-panel__hint">
                        Beim Stoppen fragt Takt nach der Leistung. Sie geht in die Abrechnung —
                        im Unterschied zum Vermerk, der in Takt bleibt.
                      </p>
                    </div>
                  )}
                </Card>

                <Card
                  title="Todo wählen"
                  description="Startet der Timer auf einem erledigten Todo, ist es danach wieder offen."
                  actions={
                    <>
                      <SearchField
                        label="Todos durchsuchen"
                        value={search}
                        onChange={setSearch}
                        placeholder="Titel oder Call-Nummer …"
                      />
                      {/*
                        E-039, Befund C-04. Derselbe Schalter wie in S-02 und
                        S-04 — und er ist die Bedingung dafür, dass der Satz in
                        der Kartenbeschreibung überhaupt einlösbar ist.
                      */}
                      <FilterToggle
                        label="Erledigte einblenden"
                        pressed={showDone}
                        onChange={setShowDone}
                        hint="Voreingestellt ausgeblendet"
                      />
                    </>
                  }
                  flush
                >
                  {!showDone && value.hiddenDone > 0 ? (
                    <p className="hidden-notice">
                      <Icon name="info" size={14} />
                      <span>
                        {plural(value.hiddenDone, "erledigtes Todo ist", "erledigte Todos sind")}{" "}
                        ausgeblendet. Startet der Timer auf einem davon, ist es wieder offen und
                        erscheint hier erneut.
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setShowDone(true)}>
                        Einblenden
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
                            ? "Noch kein Todo"
                            : "Kein offenes Todo"
                          : "Kein Treffer"
                      }
                      description={
                        search.trim().length === 0
                          ? showDone
                            ? "Legen Sie zuerst ein Todo an — Zeit wird immer auf ein Todo gebucht."
                            : "Alle Todos sind erledigt. Blenden Sie sie ein: Ein Timerstart hebt das Kennzeichen auf und holt das Todo in seine Pools zurück."
                          : showDone
                            ? "Kein Todo passt zu dieser Eingabe."
                            : "Kein offenes Todo passt zu dieser Eingabe. Erledigte sind ausgeblendet."
                      }
                      {...(showDone || search.trim().length > 0
                        ? {}
                        : {
                            action: (
                              <Button variant="secondary" onClick={() => setShowDone(true)}>
                                Erledigte einblenden
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
                                  ? `Timer für „${todo.title}“ stoppen`
                                  : `Timer für „${todo.title}“ starten`
                              }
                              icon={running ? "pause" : "play"}
                              variant={running ? "primary" : "secondary"}
                              onClick={() => timer.toggle(todo.id, todo.title)}
                            />
                            <a className="pick-row__title grow truncate" href={href("todo", todo.id)}>
                              {todo.title}
                            </a>
                            <DoneFlag state={doneFlagState(done, reactivated)} />
                            {todo.callNumber === null ? null : (
                              <span className="pick-row__call">Call {todo.callNumber}</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              iconStart="plus"
                              onClick={() => setManualFor(todo)}
                            >
                              Von Hand
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>

              <aside className="time-layout__side">
                <Card title="Heute">
                  <div className="stat-grid stat-grid--tight">
                    <StatTile
                      label="Erfasst"
                      value={formatDuration(todaySeconds)}
                      detail={plural(value.entries.length, "Buchung", "Buchungen")}
                    />
                    <StatTile
                      label="Noch offen"
                      value={formatDuration(openSeconds)}
                      tone="warning"
                      detail={
                        value.previewProblem !== null
                          ? "Was der Export daraus macht, ist gerade nicht abrufbar."
                          : value.quarters === null
                            ? "Noch nicht exportiert."
                            : `Ergibt beim Export ${formatQuarters(value.quarters)}.`
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
                        Was der Export aus den offenen Buchungen macht, ließ sich nicht
                        abrufen: {value.previewProblem} Die erfasste Zeit stimmt trotzdem —
                        nur der gerundete Wert fehlt, und geraten wird er nicht.
                      </span>
                    </p>
                  )}
                  {value.blockedGroups > 0 ? (
                    <p className="daygroup__blocked">
                      <Icon name="alert-triangle" size={14} />
                      <span>
                        {plural(value.blockedGroups, "Tagesgruppe hat", "Tagesgruppen haben")} noch
                        keinen Leistungstext und {value.blockedGroups === 1 ? "geht" : "gehen"} so
                        nicht in den Export. Die Export-Ansicht zeigt, welche.
                      </span>
                    </p>
                  ) : null}
                </Card>

                <Card title="Buchungen von heute" flush>
                  {value.entries.length === 0 ? (
                    <EmptyState
                      compact
                      icon="clock"
                      title="Heute noch nichts erfasst"
                      description="Der erste Timerstart legt die erste Buchung an."
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
          );
        }}
      </AsyncBoundary>
    </section>
  );
}

function TodayRow({ entry }: { readonly entry: TimeEntry }) {
  return (
    <li className="entry-row">
      <ExportStatusBadge
        state={exportDisplayState(entry.exportStatus, entry.exportCount)}
        size="sm"
        iconOnly
      />
      <span className="entry-row__period">{formatTimeRange(entry.startedAt, entry.endedAt)}</span>
      <span className="entry-row__duration tabular">{formatDuration(entry.durationSeconds)}</span>
      <span className="entry-row__note grow truncate">
        {entry.note.length === 0 ? <span className="muted">Ohne Leistung</span> : entry.note}
      </span>
      <span className="entry-row__source">{TIME_ENTRY_SOURCE_LABEL[entry.source]}</span>
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
