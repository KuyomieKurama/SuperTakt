import { useMemo, useState } from "react";
import { listTimeEntries, listTodos } from "../api/endpoints";
import { DoneFlag } from "../components/DoneFlag";
import { ExportStatusBadge, exportDisplayState } from "../components/ExportStatus";
import { Icon } from "../components/Icon";
import { Button, Card, EmptyState, InlineMessage } from "../components/Primitives";
import { TimerDisplay } from "../components/Timer";
import { TagChip } from "../components/Tag";
import { previewOpenEntries } from "../app/dayGroup";
import { useRefresh } from "../app/RefreshContext";
import { href, navigate } from "../app/router";
import { useStructure } from "../app/StructureContext";
import { useTimer } from "../app/TimerContext";
import { useAsync } from "../app/useAsync";
import {
  formatDuration,
  formatQuarters,
  formatStopwatch,
  formatTime,
  formatTimeRange,
  plural,
  todayCalendarDay,
} from "../lib/format";
import { doneFlagState } from "../lib/labels";
import { AsyncBoundary, ScreenHeader, StatTile } from "./parts";
import { TodoFormDialog } from "./TodoFormDialog";

/**
 * Takt — S-01, das Dashboard (Abschnitt 12).
 *
 * Vier Fragen, die jeden Morgen anstehen, und für jede eine Zahl:
 *
 *   Läuft gerade etwas?          — der Timer, groß und mit Stoppknopf
 *   Was habe ich heute erfasst?  — Summe des Tages, ungerundet
 *   Was ist noch nicht abgerechnet? — offene Zeit **und** was sie gerundet ergibt
 *   Was steht an?                — offene Todos, zuletzt bearbeitet zuerst
 *
 * Der gerundete Wert kommt aus der Exportvorschau, also aus derselben Rechnung
 * wie die Datei (R-17). Er steht neben der ungerundeten Zeit und nicht an ihrer
 * Stelle: Die Differenz ist der Aufschlag der Rundung, und den soll man sehen.
 *
 * Von hier aus lässt sich handeln, nicht nur schauen (Abschnitt 12): Timer
 * starten, Todo anlegen, in den Export springen.
 *
 * ## „Zuletzt bearbeitet" führt erledigte Todos mit (A-2.5, I-05, Befund C-04)
 *
 * Bis T-040 lud diese Liste mit `onlyOpen: true`. Damit war das Dashboard
 * einer der sechs Startpunkte für I-05 — und der einzige, an dem ein
 * erledigtes Todo gar nicht erst erscheinen konnte.
 *
 * Hier steht deshalb **kein** Schalter wie in S-02, S-04 und S-05: Diese Liste
 * ist keine Pool-Ansicht, sondern eine Chronik der letzten Arbeit, und E-039
 * regelt Pool-Ansichten. Ausgeblendet wird nichts, gekennzeichnet alles: Ein
 * erledigtes Todo trägt sein Kennzeichen, und nach einem Timerstart trägt es
 * „Erledigt aufgehoben", damit der Wechsel nicht unerklärt bleibt (T-005n,
 * Abschnitt 1, Regel 1).
 */
export function DashboardScreen() {
  const timer = useTimer();
  const structure = useStructure();
  const { version } = useRefresh();
  const [formOpen, setFormOpen] = useState(false);

  const today = useMemo(() => todayCalendarDay(), []);

  const data = useAsync(async () => {
    const [todayEntries, openTodos, allTodos, recent, openEntries] = await Promise.all([
      listTimeEntries({ fromDay: today, toDay: today }, { limit: 200 }),
      listTodos({ onlyOpen: true }, { limit: 1 }),
      listTodos({}, { limit: 1 }),
      // Ohne `onlyOpen`: I-05 braucht einen Startpunkt, an dem ein erledigtes
      // Todo überhaupt sichtbar ist (Befund C-04).
      listTodos({}, { limit: 8 }),
      listTimeEntries({ exportStatus: "open" }, { limit: 200 }),
    ]);

    /*
      Bis T-045 wurde der Fehlschlag hier verschluckt: `quarters` blieb `null`,
      und die Kachel zeigte daneben die blosse Zahl der offenen Buchungen, als
      waere das die vollstaendige Auskunft. Auch die Warnung ueber
      Tagesgruppen ohne Leistung (E-034) blieb dann aus — nicht weil es keine
      gab, sondern weil niemand gefragt hatte. Jetzt kommt der Grund mit.
    */
    const outcome = await previewOpenEntries(openEntries.items.map((entry) => entry.id));
    const preview = outcome.kind === "ready" ? outcome.preview : null;

    return {
      previewProblem: outcome.kind === "failed" ? outcome.message : null,
      quarters: preview?.totalQuarters ?? null,
      rowCount: preview?.rows.length ?? 0,
      blocked: preview?.skipped.length ?? 0,
      todayEntries: todayEntries.items,
      openTodoCount: openTodos.total,
      doneTodoCount: Math.max(0, allTodos.total - openTodos.total),
      recent: recent.items,
      openEntryCount: openEntries.total,
      openSeconds: openEntries.items.reduce((sum, entry) => sum + entry.durationSeconds, 0),
    };
  }, [today, version]);

  return (
    <section className="screen">
      <ScreenHeader
        title="Dashboard"
        lead="Was läuft, was heute erfasst wurde, was noch nicht abgerechnet ist."
        actions={
          <>
            <Button variant="primary" iconStart="plus" onClick={() => setFormOpen(true)}>
              Neues Todo
            </Button>
            <Button variant="secondary" iconStart="clock" onClick={() => navigate("time")}>
              Zeiterfassung
            </Button>
          </>
        }
      />

      <Card title="Timer">
        {timer.running === null ? (
          <div className="timer-panel timer-panel--idle">
            <TimerDisplay state="idle" display="00:00:00" size="md" />
            <p className="timer-panel__hint">
              Kein Timer läuft. Wählen Sie unten ein Todo oder gehen Sie in die Zeiterfassung.
            </p>
          </div>
        ) : (
          <div className="timer-panel timer-panel--running">
            <TimerDisplay
              state="running"
              size="md"
              display={formatStopwatch(timer.elapsedSeconds)}
              todoTitle={timer.running.todoTitle}
              detail={`seit ${formatTime(timer.running.entry.startedAt)} Uhr`}
              onStop={timer.requestStop}
            />
          </div>
        )}
      </Card>

      <AsyncBoundary state={data.state} label="Dashboard wird geladen" rows={4} onRetry={data.reload}>
        {(value) => {
          const todaySeconds = value.todayEntries.reduce(
            (sum, entry) => sum + entry.durationSeconds,
            0,
          );

          return (
            <>
              <div className="stat-grid">
                <StatTile
                  label="Heute erfasst"
                  value={formatDuration(todaySeconds)}
                  detail={plural(value.todayEntries.length, "Buchung", "Buchungen")}
                />
                <StatTile
                  label="Noch nicht exportiert"
                  value={formatDuration(value.openSeconds)}
                  tone="warning"
                  detail={
                    value.previewProblem !== null
                      ? `${plural(value.openEntryCount, "offene Buchung", "offene Buchungen")} · Exportwert nicht abrufbar`
                      : value.quarters === null
                        ? plural(value.openEntryCount, "offene Buchung", "offene Buchungen")
                        : `${plural(value.openEntryCount, "Buchung", "Buchungen")} in ${plural(value.rowCount, "Exportzeile", "Exportzeilen")} · ${formatQuarters(value.quarters)} h`
                  }
                  action={
                    <Button size="sm" variant="secondary" iconStart="download" onClick={() => navigate("export")}>
                      Zur Export-Ansicht
                    </Button>
                  }
                />
                <StatTile
                  label="Offene Todos"
                  value={String(value.openTodoCount)}
                  tone="accent"
                  detail="In Pool-Ansichten sichtbar."
                />
                <StatTile
                  label="Erledigte Todos"
                  value={String(value.doneTodoCount)}
                  detail="Ausgeblendet, bis Sie sie einblenden — oder bis ein Timerstart das Kennzeichen aufhebt."
                />
              </div>

              {/*
                Was die Vorschau nicht beantwortet hat, steht als Meldung da
                und nicht als Zahl. Eine Kachel ohne gerundeten Wert sieht
                sonst aus wie „noch nichts zu holen"; tatsaechlich ist es
                „nicht gefragt bekommen" — und die Warnung ueber Gruppen ohne
                Leistung (E-034) fehlt dann mit.
              */}
              {value.previewProblem === null ? null : (
                <InlineMessage
                  tone="warning"
                  title="Was der Export aus den offenen Buchungen macht, ließ sich nicht abrufen"
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      iconStart="rotate-ccw"
                      onClick={data.reload}
                    >
                      Erneut versuchen
                    </Button>
                  }
                >
                  {value.previewProblem} Wie viel Zeit erfasst ist, steht fest — wie viele
                  Exportzeilen und Stunden daraus werden, weiß Takt gerade nicht und rät es
                  nicht. Solange fehlt hier auch die Prüfung, ob eine Tagesgruppe ohne
                  Leistung dasteht.
                </InlineMessage>
              )}

              {value.blocked > 0 ? (
                <InlineMessage
                  tone="warning"
                  title={`${plural(value.blocked, "Tagesgruppe geht", "Tagesgruppen gehen")} so nicht in den Export`}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => navigate("export")}>
                      In der Export-Ansicht ansehen
                    </Button>
                  }
                >
                  Ohne Leistungstext nimmt das Abrechnungstool eine Zeile nicht an. Der
                  übrige Export läuft trotzdem — diese Zeit bliebe aber liegen, ohne dass es
                  jemandem auffiele.
                </InlineMessage>
              ) : null}

              <div className="dash-columns">
                <Card
                  title="Zuletzt bearbeitet"
                  description="Das jüngste zuerst — erledigte mit ihrem Kennzeichen. Ein Timerstart hebt es auf."
                  flush
                >
                  {value.recent.length === 0 ? (
                    <EmptyState
                      compact
                      icon="inbox"
                      title="Noch kein Todo"
                      description="Takt erfasst Zeit auf Todos. Legen Sie das erste an."
                      action={
                        <Button variant="primary" iconStart="plus" onClick={() => setFormOpen(true)}>
                          Neues Todo
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="pick-list">
                      {value.recent.map((todo) => {
                        const done = todo.completedAt !== null;
                        const reactivated = !done && timer.reactivated.has(todo.id);
                        return (
                          <li key={todo.id} className="pick-row">
                            <Button
                              size="sm"
                              variant={timer.isRunningFor(todo.id) ? "primary" : "secondary"}
                              iconStart={timer.isRunningFor(todo.id) ? "pause" : "play"}
                              onClick={() => timer.toggle(todo.id, todo.title)}
                            >
                              {timer.isRunningFor(todo.id) ? "Stopp" : "Start"}
                            </Button>
                            <a className="pick-row__title grow truncate" href={href("todo", todo.id)}>
                              {todo.title}
                            </a>
                            <DoneFlag state={doneFlagState(done, reactivated)} />
                            <span className="pick-row__tags">
                              {todo.tagIds.slice(0, 2).map((id) => {
                                const info = structure.tagInfo(id);
                                if (info === undefined) return null;
                                return <TagChip key={id} label={info.tag.name} size="sm" />;
                              })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>

                <Card title="Buchungen von heute" flush>
                  {value.todayEntries.length === 0 ? (
                    <EmptyState
                      compact
                      icon="clock"
                      title="Heute noch nichts erfasst"
                      description="Der erste Timerstart legt die erste Buchung an."
                    />
                  ) : (
                    <ul className="entry-list">
                      {[...value.todayEntries]
                        .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
                        .slice(0, 8)
                        .map((entry) => (
                          <li key={entry.id} className="entry-row">
                            <ExportStatusBadge
                              state={exportDisplayState(entry.exportStatus, entry.exportCount)}
                              size="sm"
                              iconOnly
                            />
                            <span className="entry-row__period">
                              {formatTimeRange(entry.startedAt, entry.endedAt)}
                            </span>
                            <span className="entry-row__duration tabular">
                              {formatDuration(entry.durationSeconds)}
                            </span>
                            <span className="entry-row__note grow truncate">
                              {entry.note.length === 0 ? (
                                <span className="muted">Ohne Leistung</span>
                              ) : (
                                entry.note
                              )}
                            </span>
                            <a
                              className="entry-row__link"
                              href={href("todo", entry.todoId)}
                              aria-label="Todo dieser Buchung öffnen"
                            >
                              <Icon name="arrow-up-right" size={14} />
                            </a>
                          </li>
                        ))}
                    </ul>
                  )}
                </Card>
              </div>
            </>
          );
        }}
      </AsyncBoundary>

      <TodoFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </section>
  );
}
