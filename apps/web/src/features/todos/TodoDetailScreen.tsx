import { useCallback, useState } from "react";
import {
  deleteTimeEntry,
  listTimeEntries,
} from "../../api/endpoints";
import { getTodo, getTodoNote } from "./api";
import { errorMessage } from "../../api/client";
import type { Id, TimeEntry } from "../../api/types";
import { Attachments } from "./Attachments";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import {
  ExportStatusBadge,
  exportDisplayState,
} from "../../shared/ui/ExportStatus";
import { Icon } from "../../shared/ui/Icon";
import { Menu, type MenuEntry } from "../../shared/ui/Menu";
import { Button, Card, EmptyState } from "../../shared/ui/Primitives";
import { previewOpenEntries } from "../../app/dayGroup";
import { useRefresh } from "../../app/RefreshContext";
import { useStructure } from "../../app/StructureContext";
import { useTimer } from "../timer/TimerContext";
import { useToasts } from "../../app/ToastContext";
import { useAsync } from "../../app/useAsync";
import { useToday } from "../../app/useToday";
import { TIME_ENTRY_SOURCE_LABEL } from "../../lib/labels";
import {
  calendarDayOf,
  formatDayLabel,
  formatDuration,
  formatTimeRange,
  plural,
} from "../../lib/format";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import {
  BookingFormDialog,
  BookingHistoryDialog,
  NotBilledDialog,
  ResetExportDialog,
} from "../bookings/BookingDialogs";
import { TodoDetailAside } from "./TodoDetailAside";
import { TodoDoneSwitch } from "./TodoDoneSwitch";
import { TodoFormDialog } from "./TodoFormDialog";
import { TodoNoteCard } from "./TodoNoteCard";
import { groupByDay } from "./todoDayGroups";
import { foreignText } from "../../lib/foreign";
import { Foreign } from "../../shared/ui/Foreign";

/**
 * Takt — S-03, die Todo-Detailansicht.
 *
 * Drei Dinge stehen hier nebeneinander, die sonst nirgends zusammenkommen:
 *
 * 1. **Der Vermerk** (A-7.1, E-016). Er bleibt in Takt und geht nie in den
 *    Export. Das steht als Satz unter dem Feld, nicht nur im Handbuch.
 * 2. **Die Buchungen, nach Kalendertag gruppiert** (E-020, E-025). Neben einer
 *    einzelnen Buchung steht ihre Dauer und **kein** Exportwert — den hat sie
 *    seit E-020 nicht mehr (Befund B-20). Der gerundete Wert gehört der
 *    Tagesgruppe.
 * 3. **Der Exportstatus jeder Buchung** (A-13.5, E-032). Zweiwertig, mit der
 *    dritten Darstellung für „schon einmal exportiert“.
 *
 * Eine Tagesgruppe ohne Leistung wird als solche gekennzeichnet (E-034) —
 * sichtbar hier und nicht erst in der Export-Ansicht, denn hier lässt sich der
 * Text nachtragen.
 */

export interface TodoDetailScreenProps {
  readonly todoId: Id;
}

export function TodoDetailScreen({ todoId }: TodoDetailScreenProps) {
  const structure = useStructure();
  const timer = useTimer();
  const toasts = useToasts();
  const { version, bump } = useRefresh();
  /*
    Der heutige Tag für die Frist (E-073 Punkt 2). Auch hier einer je Ansicht:
    Die Detailansicht zeigt genau eine Frist, aber der Haken ist derselbe, und
    zwei Bauarten für dieselbe Sache liefen auseinander.
  */
  const today = useToday();

  const [editOpen, setEditOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>(undefined);
  const [resetEntry, setResetEntry] = useState<TimeEntry | null>(null);
  const [notBilledEntry, setNotBilledEntry] = useState<TimeEntry | null>(null);
  const [historyEntry, setHistoryEntry] = useState<TimeEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TimeEntry | null>(null);

  const detail = useAsync(async () => {
    const [todo, note, entries] = await Promise.all([
      getTodo(todoId),
      getTodoNote(todoId),
      listTimeEntries({ todoId }, { limit: 200 }),
    ]);

    const openIds = entries.items
      .filter((entry) => entry.exportStatus === "open")
      .map((entry) => entry.id);

    /*
      Eine Vorschau über alle offenen Buchungen dieses Todos. Sie liefert den
      gerundeten Gesamtwert und — über `skipped` — genau die Kalendertage, die
      ohne Leistung dastehen (E-034).

      **Ihr Fehlschlag darf nicht stumm sein**: Ohne `previewProblem` fehlte
      der gerundete Wert mit dem Satz „Noch nicht exportiert.", und die
      Tagesgruppen ohne Leistung stünden unmarkiert da, als hätte jede eine.

      Vorgeschichte: `docs/decisions/todos.md`.
    */
    const outcome = await previewOpenEntries(openIds);
    const preview = outcome.kind === "ready" ? outcome.preview : null;
    const blockedDays: ReadonlySet<string> = new Set(
      preview?.skipped.map((group) => group.group.day) ?? [],
    );

    return {
      todo,
      note,
      entries: entries.items,
      totalQuarters: preview?.totalQuarters ?? null,
      blockedDays,
      previewProblem: outcome.kind === "failed" ? outcome.message : null,
    };
  }, [todoId], [version]);


  const removeEntry = useCallback(() => {
    const entry = pendingDelete;
    if (entry === null) return;
    void deleteTimeEntry(entry.id)
      .then(() => {
        setPendingDelete(null);
        bump();
        toasts.success("Buchung gelöscht.", "Die Tagesgruppe dieses Todos ändert sich mit.");
      })
      .catch((cause: unknown) =>
        toasts.failure("Die Buchung ließ sich nicht löschen", errorMessage(cause)),
      );
  }, [bump, pendingDelete, toasts]);

  const entryMenu = useCallback(
    (entry: TimeEntry): readonly MenuEntry[] => {
      const locked = entry.exportStatus === "exported";
      /*
       * Warum die Buchung gesperrt ist, entscheidet der **Anzeigezustand**
       * (E-050): Eine ausgebuchte Buchung ist ebenso gesperrt wie eine
       * exportierte, aber sie wurde nie exportiert. Stuende in der Begruendung
       * trotzdem „bereits exportiert", waere das die Luege, die E-047
       * beseitigen sollte.
       */
      const notBilled = exportDisplayState(entry.exportStatus, entry.exportCount) === "not_billed";
      const lockReason = notBilled
        ? "Diese Zeit wurde ausgebucht und ist gesperrt. Setzen Sie den Exportstatus zurück, um sie wieder zu bearbeiten."
        : "Diese Buchung wurde bereits exportiert und ist gesperrt. Setzen Sie den Exportstatus zurück, um sie zu bearbeiten.";
      return [
        {
          id: "edit",
          label: "Bearbeiten",
          icon: "pencil",
          disabled: locked,
          ...(locked ? { disabledReason: lockReason } : {}),
          onSelect: () => {
            setEditingEntry(entry);
            setBookingOpen(true);
          },
        },
        // R-10, Befund C-01. Steht **vor** dem Zurücksetzen: Was mit dieser
        // Zeit schon geschehen ist, ist die Frage, die davor steht.
        {
          id: "history",
          label: "Verlauf dieser Buchung",
          icon: "clock",
          onSelect: () => setHistoryEntry(entry),
        },
        {
          id: "reset",
          label: "Exportstatus zurücksetzen",
          icon: "rotate-ccw",
          disabled: !locked,
          ...(locked ? {} : { disabledReason: "Diese Buchung ist bereits offen." }),
          onSelect: () => setResetEntry(entry),
        },
        // E-047 — der Gegenweg zum Export, ohne dass eine Datei entsteht.
        {
          id: "not-billed",
          label: "Nicht abrechnen",
          // Nicht der Haken (E-050): Der traegt seit jeher „Exportiert", und
          // exportiert wird diese Zeit gerade nicht. Der durchgestrichene
          // Kreis ist dasselbe Zeichen, das die Buchung danach in der Liste
          // traegt — Vorgang und Ergebnis sehen gleich aus.
          icon: "slash-circle",
          disabled: locked,
          ...(locked
            ? {
                disabledReason: notBilled
                  ? "Diese Zeit ist bereits ausgebucht."
                  : "Diese Buchung ist bereits exportiert und damit abgeschlossen.",
              }
            : {}),
          onSelect: () => setNotBilledEntry(entry),
        },
        { kind: "separator", id: "sep" },
        {
          id: "delete",
          label: "Löschen",
          icon: "trash",
          tone: "danger",
          disabled: locked,
          ...(locked
            ? {
                disabledReason: notBilled
                  ? "Ausgebuchte Zeit wird nicht gelöscht. Sie bleibt als Beleg stehen."
                  : "Abgerechnete Zeit wird nicht gelöscht.",
              }
            : {}),
          onSelect: () => setPendingDelete(entry),
        },
      ];
    },
    [],
  );

  return (
    <section className="screen">
      <AsyncBoundary state={detail.state} label="Todo wird geladen" rows={5} onRetry={detail.reload}>
        {(value, refreshing) => {
          const todo = value.todo.todo;
          const running = timer.isRunningFor(todo.id);
          const groups = groupByDay(value.entries, value.blockedDays);

          return (
            <>
              <ScreenHeader
                title={<Foreign value={todo.title} />}
                lead={
                  todo.callNumber === null
                    ? `Status: ${foreignText(structure.statusName(todo.statusId))}`
                    : /*
                        Die Call-Nummer geht seit T-129 durch dieselbe
                        Behandlung wie jeder andere fremde Text — obwohl
                        `checkCallNumber` nur `A-Z a-z 0-9 . _ / -` durchlaesst
                        (E-045) und `visibleText` darauf die Identitaet ist.

                        Zwei Gruende, und der zweite wiegt schwerer als der
                        erste: Der Vorrat ist an der *heutigen* Tuer geschlossen,
                        nicht im Bestand (T-124 R4 — was vor T-101 angelegt
                        wurde, hat diese Tuer nie gesehen). Und eine Ausnahme
                        waere eine Stelle, an der die Regel nicht gilt: Sie
                        muesste im Nachweis stehen, gepflegt werden und koennte
                        veralten. Eine Identitaet kostet nichts.
                      */
                      `Call ${foreignText(todo.callNumber)} · Status: ${foreignText(structure.statusName(todo.statusId))}`
                }
                refreshing={refreshing}
                actions={
                  <>
                    <Button
                      variant={running ? "secondary" : "primary"}
                      iconStart={running ? "pause" : "play"}
                      onClick={() => timer.toggle(todo.id, todo.title)}
                    >
                      {running ? "Timer stoppen" : "Timer starten"}
                    </Button>
                    <Button variant="secondary" iconStart="pencil" onClick={() => setEditOpen(true)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      iconStart="plus"
                      onClick={() => {
                        setEditingEntry(undefined);
                        setBookingOpen(true);
                      }}
                    >
                      Zeit von Hand
                    </Button>
                  </>
                }
              />

              <div className="detail">
                <div className="detail__main">
                  <TodoDoneSwitch todo={todo} />

                  <TodoNoteCard
                    todoId={todoId}
                    note={value.note}
                    onSaved={(saved) => detail.replace({ ...value, note: saved })}
                  />

                  {/*
                    Anhänge (A-19.11): unmittelbar am Todo sichtbar und dort
                    verwaltbar — hinzufügen, öffnen, entfernen. `version` reicht
                    das Änderungssignal der Anwendung durch, damit ein zweites
                    Fenster oder der Aufgabenbereich des Add-ins nicht an einer
                    veralteten Liste vorbeiläuft (T-097).
                  */}
                  <Card
                    title="Anhänge"
                    description="Ein Verweis öffnet den Browser, eine Datei die Standardanwendung des Systems, ein Bild wird hier gezeigt. Geöffnet wird nur auf Ihren Klick."
                  >
                    <Attachments todoId={todo.id} todoTitle={todo.title} version={version} />
                  </Card>

                  <Card
                    title="Buchungen"
                    description="Nach Kalendertag gruppiert — so entsteht auch die Exportzeile."
                    flush
                  >
                    {groups.length === 0 ? (
                      <EmptyState
                        icon="clock"
                        compact
                        title="Noch keine Zeit erfasst"
                        description="Starten Sie den Timer oder tragen Sie eine Zeit von Hand ein."
                        action={
                          <Button
                            variant="primary"
                            iconStart="play"
                            onClick={() => timer.toggle(todo.id, todo.title)}
                          >
                            Timer starten
                          </Button>
                        }
                      />
                    ) : (
                      <ul className="daygroups">
                        {groups.map((group) => (
                          <li key={group.day} className="daygroup">
                            <div className="daygroup__head">
                              <h4 className="daygroup__day">{formatDayLabel(group.day)}</h4>
                              <span className="daygroup__meta">
                                {plural(group.entries.length, "Buchung", "Buchungen")}
                                {group.openSeconds > 0
                                  ? ` · ${formatDuration(group.openSeconds)} offen`
                                  : " · vollständig exportiert"}
                              </span>
                            </div>

                            {group.blocked ? (
                              <p className="daygroup__blocked">
                                <Icon name="alert-triangle" size={14} />
                                <span>
                                  Diese Tagesgruppe hat keinen Leistungstext und geht so nicht in
                                  den Export. Der übrige Export läuft trotzdem — sie bleibt offen
                                  und erscheint beim nächsten Mal wieder.
                                </span>
                              </p>
                            ) : null}

                            <ul className="entry-list">
                              {group.entries.map((entry) => (
                                <li key={entry.id} className="entry-row">
                                  <ExportStatusBadge
                                    state={exportDisplayState(entry.exportStatus, entry.exportCount)}
                                    size="sm"
                                    {...(entry.exportStatus === "open" && entry.exportCount > 0
                                      ? { detail: `${String(entry.exportCount)}× exportiert` }
                                      : {})}
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
                                      <Foreign value={entry.note} />
                                    )}
                                  </span>
                                  <span className="entry-row__source">
                                    {TIME_ENTRY_SOURCE_LABEL[entry.source]}
                                  </span>
                                  <Menu
                                    trigger={<Icon name="more-horizontal" size={16} />}
                                    triggerLabel="Menü für diese Buchung"
                                    entries={entryMenu(entry)}
                                    align="end"
                                  />
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>

                <TodoDetailAside
                  todo={todo}
                  today={today}
                  totalSeconds={value.todo.totalSeconds}
                  openSeconds={value.todo.openSeconds}
                  totalQuarters={value.totalQuarters}
                  previewProblem={value.previewProblem}
                  onEdit={() => setEditOpen(true)}
                />
              </div>

              <TodoFormDialog open={editOpen} todo={todo} onClose={() => setEditOpen(false)} />

              <BookingFormDialog
                open={bookingOpen}
                {...(editingEntry === undefined ? {} : { entry: editingEntry })}
                todoId={todo.id}
                todoTitle={todo.title}
                onClose={() => setBookingOpen(false)}
              />

              <ResetExportDialog
                open={resetEntry !== null}
                entry={resetEntry}
                todoTitle={todo.title}
                onClose={() => setResetEntry(null)}
              />

              <BookingHistoryDialog
                open={historyEntry !== null}
                entry={historyEntry}
                todoTitle={todo.title}
                onClose={() => setHistoryEntry(null)}
              />

              <NotBilledDialog
                open={notBilledEntry !== null}
                entry={notBilledEntry}
                todoTitle={todo.title}
                onClose={() => setNotBilledEntry(null)}
              />

              <ConfirmDialog
                open={pendingDelete !== null}
                tone="danger"
                title="Buchung löschen?"
                description={
                  pendingDelete === null
                    ? ""
                    : `${formatDuration(pendingDelete.durationSeconds)} vom ${formatDayLabel(calendarDayOf(pendingDelete.startedAt))} werden entfernt.`
                }
                consequence="Die Tagesgruppe dieses Todos wird dadurch kleiner, und der gerundete Exportwert ändert sich mit."
                confirmLabel="Löschen"
                onConfirm={removeEntry}
                onCancel={() => setPendingDelete(null)}
              />
            </>
          );
        }}
      </AsyncBoundary>
    </section>
  );
}