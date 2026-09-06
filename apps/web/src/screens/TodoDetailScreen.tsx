import { useCallback, useState } from "react";
import {
  clearTodoDone,
  deleteTimeEntry,
  getTodo,
  getTodoNote,
  listTimeEntries,
  markTodoDone,
  putTodoNote,
} from "../api/endpoints";
import { errorMessage } from "../api/client";
import type { ForeignText, Id, TimeEntry } from "../api/types";
import { Attachments } from "../components/Attachments";
import { DeadlineFlag } from "../components/DeadlineFlag";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DoneFlag } from "../components/DoneFlag";
import {
  ExportStatusBadge,
  exportDisplayState,
} from "../components/ExportStatus";
import { Icon } from "../components/Icon";
import { Menu, type MenuEntry } from "../components/Menu";
import { NoteField } from "../components/NoteField";
import { Button, Card, EmptyState, InlineMessage } from "../components/Primitives";
import { TagChip } from "../components/Tag";
import { previewOpenEntries } from "../app/dayGroup";
import { useRefresh } from "../app/RefreshContext";
import { navigate } from "../app/router";
import { useStructure } from "../app/StructureContext";
import { useTimer } from "../app/TimerContext";
import { useToasts } from "../app/ToastContext";
import { undoDoneAction } from "../app/undoDone";
import { useAsync, useMutation } from "../app/useAsync";
import { useToday } from "../app/useToday";
import { cx } from "../lib/cx";
import {
  DONE_FLAG_LABEL,
  doneFlagState,
  TIME_ENTRY_SOURCE_LABEL,
} from "../lib/labels";
import {
  calendarDayOf,
  formatDateTime,
  formatDayLabel,
  formatDuration,
  formatQuarters,
  formatTimeRange,
  plural,
} from "../lib/format";
import { doneMovementSentence, withMovement } from "../lib/movement";
import { AsyncBoundary, ScreenHeader, StatTile } from "./parts";
import {
  BookingFormDialog,
  BookingHistoryDialog,
  NotBilledDialog,
  ResetExportDialog,
} from "./BookingDialogs";
import { TodoFormDialog } from "./TodoFormDialog";
import { foreignText, quotedName } from "../lib/foreign";
import { Foreign } from "../components/Foreign";

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

interface DayGroup {
  readonly day: string;
  readonly entries: readonly TimeEntry[];
  readonly openSeconds: number;
  readonly blocked: boolean;
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
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const noteMutation = useMutation();

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

      Bis T-045 verschwand ihr Fehlschlag stumm: Der gerundete Wert fehlte
      dann mit dem Satz „Noch nicht exportiert.", und die Tagesgruppen ohne
      Leistung waren unmarkiert, als hätte jede eine. Der Grund kommt jetzt
      mit.
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

  const toggleDone = useCallback(
    (done: boolean, title: ForeignText) => {
      void (done ? clearTodoDone(todoId) : markTodoDone(todoId))
        .then((result) => {
          /*
            Der Anzeigezustand „Erledigt aufgehoben" endet, sobald der
            Benutzer das Kennzeichen selbst anfasst (A-2.5). Er erklaert eine
            Aenderung, die Takt vorgenommen hat — nach einer eigenen bliebe er
            als Behauptung stehen.
          */
          timer.clearReactivated(todoId);
          bump();
          /*
            Der Bewegungssatz aus der Antwort (E-060 Punkt 4). Diese Ansicht
            zeigt kein Board und keine Pool-Liste — gerade deshalb steht hier,
            wo das Todo nach der Handlung zu finden ist. Meldet der Dienst
            keine Bewegung, bleibt es beim Satz über Status und Kennzeichen.
          */
          toasts.show({
            tone: done ? "info" : "success",
            title: done ? `${quotedName(title)} ist wieder offen.` : `${quotedName(title)} ist erledigt.`,
            body: withMovement(
              "Der Status bleibt unverändert — Erledigt und Status sind zwei getrennte Größen.",
              doneMovementSentence(result.poolMovement, done),
            ),
            /*
              Der Rückweg, seit T-118 an allen drei Flächen (B-7 aus T-116).
              `done` ist hier der Zustand **vor** der Handlung: Wenn er wahr
              war, hat der Benutzer gerade wieder geöffnet — das ist selbst
              schon eine Rücknahme und braucht keine zweite.
            */
            ...(done ? {} : { action: undoDoneAction(todoId, title, toasts, bump) }),
          });
        })
        .catch((cause: unknown) =>
          toasts.failure("Das Kennzeichen ließ sich nicht ändern", errorMessage(cause)),
        );
    },
    [bump, timer, todoId, toasts],
  );

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
          const done = todo.completedAt !== null;
          /*
            A-2.5, I-05, Befund C-23: S-03 ist neben S-02 die Ansicht, aus der
            am haeufigsten ein Timer gestartet wird. Bis T-045 sprang der
            Schalter danach schlicht auf „Offen" — die Aenderung, die Takt
            ohne Rueckfrage vorgenommen hat, war hinterher nicht mehr zu
            erkennen.
          */
          const flagState = doneFlagState(done, timer.reactivated.has(todo.id));
          const running = timer.isRunningFor(todo.id);
          const groups = groupByDay(value.entries, value.blockedDays);
          const noteText = noteDraft ?? value.note.text;
          const noteDirty = noteDraft !== null && noteDraft !== value.note.text;

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
                  <Card
                    title="Erledigt"
                    description="Ein Kennzeichen am Todo — weder der Status noch eine Kanban-Spalte. Alle drei sind unabhängig."
                  >
                    <label className={cx("done-switch", done && "done-switch--on")}>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleDone(done, todo.title)}
                      />
                      <span className="done-switch__box" aria-hidden>
                        <Icon name={done ? "check" : "square"} size={14} />
                      </span>
                      <span>
                        <span className="done-switch__state">
                          <strong>{DONE_FLAG_LABEL[flagState]}</strong>
                          {flagState === "reopened" ? (
                            <DoneFlag state={flagState} />
                          ) : null}
                        </span>
                        {/*
                          Drei Saetze, und keiner wertet eine Regel aus (E-058,
                          T-094).

                          Bis T-094 stand im mittleren „… erscheint erneut in
                          jedem Pool, dessen Regel auf seine Tags passt. Die
                          Karte bleibt, wo sie ist …" — doppelt falsch. Eine
                          Regel hat seit E-055 fuenf Achsen, nicht nur Tags; und
                          die Spalte aendert sich sehr wohl, wenn eine Regel
                          nach „Erledigt" oder nach dem Exportstatus fragt.

                          Rekonstruiert wird die Bewegung hier auch nicht
                          nachtraeglich: Diese Ansicht weiss nicht, welcher
                          Zustand vor dem Start galt. Wer es weiss, ist der
                          Dienst, und er hat es beim Start gesagt (`poolMovement`
                          an `POST /timer/start`). Der Satz verweist deshalb auf
                          jene Meldung, statt eine zweite, schlechtere zu bauen.
                        */}
                        <span className="done-switch__hint">
                          {flagState === "done"
                            ? `Erledigt am ${formatDateTime(todo.completedAt ?? todo.updatedAt)}. Das Todo ist aus seinen Pools ausgeblendet; ein Timerstart hebt das auf.`
                            : flagState === "reopened"
                              ? 'Der Timerstart hat das Kennzeichen aufgehoben — Takt hat das getan, nicht Sie. Das Todo ist wieder offen; welche Pools und Spalten das betrifft, hat die Meldung beim Start genannt. Setzen Sie den Haken, gilt wieder „Erledigt".'
                              : "Es erscheint überall dort, wo eine Regel es aufnimmt — als Pool, als Board-Spalte oder beides."}
                        </span>
                      </span>
                    </label>
                  </Card>

                  {/*
                    Die **Frist** (A-19.3, A-19.4). Sie steht in der
                    Detailansicht als Eigenschaft und nicht als dritte
                    Anzeigestelle — gesetzt, geändert und entfernt wird sie im
                    Bearbeiten-Dialog, hier steht ihr Zustand.

                    Der Satz darunter sagt, was sie **nicht** tut. Ohne ihn
                    liegt die Annahme nahe, eine Frist bewege ein Todo in eine
                    Spalte oder in einen Pool; sie tut nichts dergleichen
                    (A-19.7, E-070 Punkt 4).
                  */}
                  <Card
                    title="Frist"
                    description="Ein Tag, keine Uhrzeit. Sie ändert nichts an Pools, Spalten, Buchungen oder Export — und sie steht in keinem Export."
                    actions={
                      <Button variant="ghost" iconStart="pencil" onClick={() => setEditOpen(true)}>
                        {todo.dueDate === null ? "Frist setzen" : "Frist ändern"}
                      </Button>
                    }
                  >
                    {todo.dueDate === null ? (
                      <p className="muted">
                        Keine Frist gesetzt. Dieses Todo ist deshalb weder überfällig noch heute
                        fällig — es hat schlicht keinen dieser Zustände.
                      </p>
                    ) : (
                      <DeadlineFlag dueDate={todo.dueDate} today={today} />
                    )}
                  </Card>

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

                <aside className="detail__side">
                  <Card title="Erfasste Zeit">
                    <div className="stat-grid stat-grid--tight">
                      <StatTile
                        label="Gesamt"
                        value={formatDuration(value.todo.totalSeconds)}
                        detail="Alle Buchungen, ungerundet."
                      />
                      <StatTile
                        label="Noch offen"
                        value={formatDuration(value.todo.openSeconds)}
                        tone="warning"
                        detail={
                          value.previewProblem !== null
                            ? "Was der Export daraus macht, ist gerade nicht abrufbar."
                            : value.totalQuarters === null
                              ? "Noch nicht exportiert."
                              : `Beim Export ergibt das ${formatQuarters(value.totalQuarters)} — über alle Tagesgruppen zusammen.`
                        }
                      />
                    </div>
                    {/*
                      Ohne diesen Satz sähe die Liste darunter aus, als hätte
                      jede Tagesgruppe ihre Leistung — die Kennzeichnung aus
                      E-034 stammt aus derselben Antwort, die hier gefehlt hat.
                    */}
                    {value.previewProblem === null ? null : (
                      <p className="daygroup__blocked">
                        <Icon name="alert-triangle" size={14} />
                        <span>
                          Was der Export aus den offenen Buchungen macht, ließ sich nicht
                          abrufen: {value.previewProblem} Solange fehlt auch die Kennzeichnung
                          der Tagesgruppen, denen die Leistung fehlt.
                        </span>
                      </p>
                    )}
                  </Card>

                  <Card
                    title="Tags"
                    description="Tags sind der häufigste Griff, mit dem eine Karte die Spalte wechselt — aber nicht der einzige: Eine Regel fragt auch nach Status, „Erledigt“ und Exportstatus."
                  >
                    {todo.tagIds.length === 0 ? (
                      <p className="muted">
                        Keine Tags. Regeln, die Tags verlangen, treffen dieses Todo damit nicht —
                        Regeln über Status, „Erledigt“ oder den Exportstatus schon.
                      </p>
                    ) : (
                      <div className="tag-row">
                        {todo.tagIds.map((id) => {
                          const info = structure.tagInfo(id);
                          if (info === undefined) return null;
                          return (
                            <TagChip
                              key={id}
                              label={info.tag.name}
                              path={info.path}
                              size="sm"
                              onToggle={() => navigate("todos", undefined, { tag: id })}
                            />
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  <Card title="Vermerk">
                    <NoteField
                      scope="internal"
                      value={noteText}
                      onChange={setNoteDraft}
                      rows={6}
                      maxLength={65536}
                      /*
                        Kein eigener Platzhalter mehr (T-181, ST-09): Das Feld
                        nimmt den Vorgabewert aus `NoteField`. Zwei Fassungen
                        fuer dasselbe Feld an zwei Flaechen waren zwei Anreden
                        und zwei Wortlaute fuer eine Sache.
                      */
                    />
                    <div className="note-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!noteDirty}
                        loading={noteMutation.busy}
                        onClick={() => {
                          void noteMutation.run(async () => {
                            const saved = await putTodoNote(todoId, noteText);
                            setNoteDraft(null);
                            detail.replace({ ...value, note: saved });
                            toasts.success("Vermerk gespeichert.", "Er bleibt in Takt.");
                          });
                        }}
                      >
                        Vermerk speichern
                      </Button>
                      {noteDirty ? (
                        <span className="note-actions__hint">Nicht gespeicherte Änderung</span>
                      ) : (
                        <span className="note-actions__hint muted">
                          Zuletzt geändert am {formatDateTime(value.note.updatedAt)}
                        </span>
                      )}
                    </div>
                    {noteMutation.error === null ? null : (
                      <InlineMessage tone="danger" title="Der Vermerk wurde nicht gespeichert">
                        {noteMutation.error}
                      </InlineMessage>
                    )}
                  </Card>

                  <Card title="Herkunft">
                    <dl className="facts">
                      <dt>Angelegt</dt>
                      <dd>{formatDateTime(todo.createdAt)}</dd>
                      <dt>Zuletzt geändert</dt>
                      <dd>{formatDateTime(todo.updatedAt)}</dd>
                      {/*
                        Der Status ist seit E-054 **keine** Kanban-Spalte mehr;
                        ein Verweis von hier auf das Board hat deshalb kein Ziel
                        mehr, das ihn zeigte. Geaendert wird er hier — die
                        Detailansicht ist neben der Liste der Ort dafuer.
                      */}
                      <dt>Status</dt>
                      <dd className="facts__with-action">
                        <span>
                          <Foreign value={structure.statusName(todo.statusId)} />
                        </span>
                        <Button size="sm" variant="ghost" iconStart="pencil" onClick={() => setEditOpen(true)}>
                          Ändern
                        </Button>
                      </dd>
                    </dl>
                  </Card>
                </aside>
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

/**
 * Buchungen nach Kalendertag des **Starts** bündeln (E-025).
 *
 * Das ist die Gliederung, die auch der Export benutzt — welche Buchungen
 * daraus eine Zeile ergeben und was sie gerundet wert ist, entscheidet
 * weiterhin der Dienst. Hier wird nur sortiert und gezählt.
 */
function groupByDay(
  entries: readonly TimeEntry[],
  blockedDays: ReadonlySet<string>,
): readonly DayGroup[] {
  const buckets = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const day = calendarDayOf(entry.startedAt);
    const bucket = buckets.get(day);
    if (bucket === undefined) buckets.set(day, [entry]);
    else bucket.push(entry);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([day, items]) => ({
      day,
      entries: [...items].sort((left, right) => left.startedAt.localeCompare(right.startedAt)),
      openSeconds: items
        .filter((entry) => entry.exportStatus === "open")
        .reduce((sum, entry) => sum + entry.durationSeconds, 0),
      blocked: blockedDays.has(day),
    }));
}
