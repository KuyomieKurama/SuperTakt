/**
 * Takt — Zeitbuchung, Exportstatus und Timer-Regel (A-6.*, A-7.3, A-7.4, E-012).
 */

import type {
  ExportAuditId,
  ExportRunGroupId,
  ExportRunId,
  Result,
  Seconds,
  TaktError,
  Timestamp,
  TimeEntryId,
  TodoId,
} from './kernel.ts';
import { err, ok, secondsBetween, taktError } from './kernel.ts';

// ---------------------------------------------------------------------------
// Exportstatus (A-6.5, A-6.9)
// ---------------------------------------------------------------------------

/**
 * Zweiwertig, nie leer, nie mehrdeutig (A-6.9).
 *
 * Es gibt keinen dritten Wert, keinen Zwischenzustand „wird gerade exportiert"
 * und kein `null`. Der Exportlauf ist eine Transaktion (A-8.8); zwischen
 * `open` und `exported` liegt kein beobachtbarer Zustand. Die Speicherung
 * erzwingt das über NOT NULL plus CHECK, nicht über eine Zusicherung im Code.
 *
 * Die Werte sind englisch und stehen so auch in `time_entry.export_status`. Die
 * Beschriftung auf dem Bildschirm — „offen" und „exportiert" — bildet die
 * Oberfläche darauf ab; sie gehört nicht in die Datenbank.
 */
export type ExportStatus = 'open' | 'exported';

/** Woher die Buchung stammt. Für die Oberfläche, ohne Einfluss auf den Export. */
export type TimeEntrySource = 'timer' | 'manual';

/**
 * Eine abgeschlossene Zeitbuchung (A-6.4). Tabelle `time_entry`.
 *
 * `note` ist die Buchungsnotiz aus A-7.3, auf dem Bildschirm **Leistung**
 * (E-016). Sie geht in die Abrechnung (A-7.4). Der interne Vermerk des Todos
 * aus A-7.2 kommt in diesem Typ nicht vor und ist über ihn auch nicht
 * erreichbar — siehe `TodoNote` in todo.ts und R-06.
 */
export interface TimeEntry {
  readonly id: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  readonly durationSeconds: Seconds;
  readonly note: string;
  readonly exportStatus: ExportStatus;
  /**
   * Wie oft diese Buchung schon in einem Exportlauf enthalten war.
   *
   * `exportStatus === 'open' && exportCount > 0` ist genau der Zustand, den
   * die Oberfläche als „schon einmal exportiert" kennzeichnen muss (R-10).
   */
  readonly exportCount: number;
  readonly source: TimeEntrySource;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/** Eine laufende Buchung: kein Ende, keine Dauer, nie exportierbar. */
export interface RunningTimeEntry {
  readonly id: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly note: string;
  readonly source: 'timer';
}

// ---------------------------------------------------------------------------
// Timer-Regel (A-6.8, A-2.5)
// ---------------------------------------------------------------------------

/**
 * Wunsch, einen Timer zu starten.
 *
 * `stopRunning` ist die Antwort des Benutzers auf die Rückfrage aus A-6.8.
 * Ohne dieses Feld verweigert der Start, wenn bereits ein Timer läuft.
 * Die Rückfrage ist damit nicht Höflichkeit der Oberfläche, sondern Bedingung
 * des Vertrags: es gibt keinen Weg, einen laufenden Timer stillschweigend zu
 * beenden.
 */
export interface TimerStartRequest {
  readonly todoId: TodoId;
  readonly stopRunning: boolean;
  readonly now: Timestamp;
}

/**
 * Ergebnis eines Startversuchs.
 *
 * Ein ausgezeichneter Vereinigungstyp, damit der Aufrufer den Konfliktfall
 * nicht übersehen kann: `kind` muss geprüft werden, bevor auf `entry`
 * zugegriffen werden darf.
 */
export type TimerStartResult =
  | {
      readonly kind: 'started';
      readonly entry: RunningTimeEntry;
      /** Der vorher laufende Timer, falls einer gestoppt wurde. */
      readonly stopped: TimeEntry | null;
      /**
       * A-2.5: war das Todo erledigt und wurde durch den Start wieder aktiv?
       *
       * Es gibt kein Feld für eine neue Spalte. Der Start hebt nur das
       * Erledigt-Kennzeichen auf. **Ob die Karte dadurch eine Spalte wechselt,
       * entscheidet die Regel** (E-055): Eine Kanban-Spalte fragt seit E-054
       * auch nach „Erledigt" und nach dem Exportstatus, und genau diese beiden
       * Achsen legt ein Start um. Die Bewegung, die daraus folgt, liefert
       * `poolMovement` an der Route; der Satz dazu steht in
       * `poolMovementSentence` (`pool-movement.ts`).
       *
       * Bis T-101 stand hier „die Karte bleibt, wo sie ist" — derselbe Satz,
       * den E-058 an vier Flächen als falsch begraben hat, drei Dateien neben
       * der Funktion, die ihn ersetzt (R-2a W-2).
       */
      readonly doneCleared: boolean;
    }
  | {
      readonly kind: 'confirmation_required';
      /** Der Timer, der ohne Bestätigung weiterliefe. Für den Dialog. */
      readonly running: RunningTimeEntry;
      /** Titel des Todos, auf dem der laufende Timer sitzt. */
      readonly runningTodoTitle: string;
    };

/**
 * Regel für den Start eines Timers auf einem erledigten Todo (A-2.5).
 *
 * Rein und ohne laufenden Dienst prüfbar. Sie entscheidet nur, was zu tun ist;
 * das Schreiben übernimmt der Anwendungsfall in einer einzigen Transaktion.
 *
 * Die Regel ist knapp, weil Erledigt und Kanban-Spalte getrennt sind: Der
 * Start hebt `completed_at` auf und rührt `status_id` nicht an. Es gibt keine
 * gemerkte und keine konfigurierte Rückkehr-Spalte, weil das Erledigen die
 * Spalte nie verändert hat.
 *
 * Wieder in seinem Pool erscheint das Todo dadurch von selbst: Die
 * Pool-Zugehörigkeit ergibt sich aus den Tags und ist nicht gespeichert
 * (A-3.4); ausgeblendet war es allein über `IsVisibleInPool` in tag.ts. Fällt
 * das Kennzeichen, fällt die Ausblendung.
 *
 * Der eigene Typ bleibt trotz der kurzen Regel bestehen: Er ist die eine
 * Stelle, an der A-2.5 steht, und die eine Stelle, an der T-010 dagegen prüft.
 */
export type DetermineReopen = (input: {
  readonly isDone: boolean;
}) => {
  readonly clearDone: boolean;
};

/**
 * Kürzeste Dauer, die als Buchung erhalten bleibt.
 *
 * Ein Stopp unterhalb dieser Grenze verwirft die Buchung, statt eine Buchung
 * über 0 Sekunden anzulegen — das ist der Doppelklick auf „Start", nicht
 * geleistete Arbeit. Der Anwendungsfall meldet das als `timer_too_short`
 * zurück; die Oberfläche stellt es als Hinweis dar, nicht als Fehler.
 */
export type MinimumDurationSeconds = 1;

export type TimerStopResult =
  | { readonly kind: 'recorded'; readonly entry: TimeEntry }
  | { readonly kind: 'discarded'; readonly reason: 'timer_too_short'; readonly durationSeconds: number };

// ---------------------------------------------------------------------------
// Exportstatuswechsel (A-6.9, E-012, R-10)
// ---------------------------------------------------------------------------

/**
 * Erlaubte Übergänge. Es gibt genau drei, und jeder hat einen Auslöser,
 * der protokolliert wird.
 *
 *   open     --[ Exportlauf, A-8.8 ]------>  exported
 *   open     --[ Nicht abrechnen, E-047 ]->  exported
 *   exported --[ Zurücksetzen, E-012 ]---->  open
 *
 * **Der Auslöser ist Teil der Bedingung, nicht Beiwerk.** Zwei der drei
 * Übergänge führen auf denselben Wert, und trotzdem sind es zwei verschiedene
 * Vorgänge: Der eine hat eine geschriebene Datei hinter sich, der andere
 * ausdrücklich keine. Wer sie am Zielwert unterscheiden wollte, könnte es nicht
 * — deshalb steht der Auslöser im Typ und wandert bis in `export_audit.event`.
 *
 * Zu „nicht abrechnen" (E-047, ersetzt E-037): Der Benutzer will diese Zeit
 * nicht abrechnen; exportiert wurde sie nie. Der Exportstatus geht trotzdem auf
 * `exported`, weil zweiwertig zweiwertig bleibt (E-032) — ein dritter Status
 * „ausgebucht" landete früher oder später in einem Filter und hielte die
 * Buchung anders als beabsichtigt aus einer Auswertung heraus. Was tatsächlich
 * geschah, trägt das Protokoll.
 *
 * Nicht erlaubt und in der Speicherung nicht erreichbar:
 *   - `exported` ohne einen der beiden vorgesehenen Auslöser. Ein „einfach
 *     setzen" gäbe eine als abgerechnet markierte Buchung, der weder eine Datei
 *     noch eine Entscheidung des Benutzers zugeordnet werden kann.
 *   - jeder Wechsel auf sich selbst.
 */
export type ExportStatusTransition =
  | { readonly from: 'open'; readonly to: 'exported'; readonly trigger: 'export_run' }
  | { readonly from: 'open'; readonly to: 'exported'; readonly trigger: 'not_billed' }
  | { readonly from: 'exported'; readonly to: 'open'; readonly trigger: 'reset' };

export type CheckExportStatusTransition = (
  from: ExportStatus,
  to: ExportStatus,
  trigger: 'export_run' | 'reset' | 'not_billed',
) => Result<
  ExportStatusTransition,
  TaktError<'export_status_unchanged' | 'export_status_not_settable'>
>;

/**
 * Ist die Buchung gegen Bearbeitung gesperrt? (A-6.9)
 *
 * Gesperrt sind Start, Ende, Dauer, Leistung, Todo-Zuordnung und Löschen einer
 * exportierten Buchung. Nicht gesperrt ist der Exportstatus selbst — sonst
 * ließe E-012 sich nicht umsetzen. Die Speicherung erzwingt dieselbe Regel
 * über einen Trigger, damit sie auch dann gilt, wenn ein späterer
 * Anwendungsfall sie zu prüfen vergisst.
 */
export type IsLocked = (entry: Pick<TimeEntry, 'exportStatus'>) => boolean;

// ---------------------------------------------------------------------------
// Protokoll des Exportstatus (R-10) — Tabelle `export_audit`
// ---------------------------------------------------------------------------

/**
 * Literale wie in `export_audit.event`.
 *
 * `not_billed` (E-047) ist kein Export und trägt deshalb weder Exportlauf noch
 * Exportzeile — das Schema erzwingt das mit demselben CHECK, der für `exported`
 * beides verlangt. Erst diese Unterscheidung macht die Auswertung möglich, für
 * die man ein solches Protokoll überhaupt führt: Wie viel Zeit ist nie
 * abgerechnet worden?
 */
export type ExportAuditEvent = 'exported' | 'reset' | 'not_billed';

/**
 * Eine Zeile des Exportstatus-Protokolls. Anhängend und unveränderlich.
 *
 * Zweck: Wird eine Buchung zurückgesetzt und erneut exportiert, geht dieselbe
 * Arbeitszeit ein zweites Mal in die Abrechnung. Das Protokoll macht diesen
 * Vorgang nachträglich auffindbar — wer, wann, welche Buchung, mit welcher
 * Begründung, und in welchem Exportlauf sie vorher steckte.
 *
 * Die Speicherung verbietet UPDATE und DELETE auf dieser Tabelle über Trigger.
 * Es gibt keinen Anwendungsfall, der Protokollzeilen ändert oder löscht.
 */
export interface ExportAuditEntry {
  readonly id: ExportAuditId;
  readonly timeEntryId: TimeEntryId;
  readonly event: ExportAuditEvent;
  readonly previousStatus: ExportStatus;
  readonly newStatus: ExportStatus;
  /** Gesetzt genau dann, wenn `event === 'exported'`. */
  readonly exportRunId: ExportRunId | null;
  /**
   * Die Exportzeile, in der die Buchung stand. Gesetzt genau dann, wenn
   * `event === 'exported'`.
   *
   * Hier steht bewusst kein `quarters`. Der gerundete Wert gehört der Gruppe,
   * nicht der Buchung; ein Anteil je Buchung existiert nicht (siehe
   * `ExportRunGroup`). Über diese Kennung sind Tagessumme und gerundeter Wert
   * der Zeile erreichbar, in der die Buchung damals stand — und damit auch,
   * wieviel eine zweite Abrechnung derselben Zeit tatsächlich hinzugefügt hat.
   */
  readonly exportRunGroupId: ExportRunGroupId | null;
  /** Windows-Benutzername (E-010). Keine freie Eingabe. */
  readonly actor: string;
  /** Begründung aus dem Bestätigungsdialog beim Zurücksetzen. Darf leer sein. */
  readonly reason: string;
  readonly occurredAt: Timestamp;
}

/**
 * Antrag auf Zurücksetzen des Exportstatus (E-012).
 *
 * Je Buchung, nicht je Exportlauf. `reason` ist die Freitexteingabe aus dem
 * Bestätigungsdialog und wandert unverändert ins Protokoll.
 */
export interface ExportStatusResetRequest {
  readonly timeEntryId: TimeEntryId;
  readonly reason: string;
  readonly actor: string;
  readonly now: Timestamp;
}

/**
 * Antrag auf Ausbuchen ohne Abrechnung (E-047, ersetzt E-037).
 *
 * Gleiche Gestalt wie der Antrag auf Zurücksetzen, und das ist kein Zufall:
 * Beides ist eine Entscheidung eines Menschen über genau eine Buchung, beides
 * wird protokolliert, und `reason` ist beide Male freiwillig. Ein Pflichtfeld
 * erzeugt in der Praxis den Text „x"; was zählt, ist die Nachvollziehbarkeit
 * des Vorgangs, nicht die Qualität seiner Begründung.
 *
 * Der Typ ist trotzdem ein eigener und kein Alias: Die beiden Anträge dürfen
 * sich unterschiedlich entwickeln, und an der Signatur der Ports soll ablesbar
 * sein, welcher der beiden Vorgänge gemeint ist.
 */
export interface NotBilledRequest {
  readonly timeEntryId: TimeEntryId;
  /** Freiwillig. Wandert unverändert ins Protokoll. */
  readonly reason: string;
  /** Windows-Benutzername (E-010). Keine freie Eingabe. */
  readonly actor: string;
  readonly now: Timestamp;
}

// ---------------------------------------------------------------------------
// Entwürfe: was eine reine Regel über eine Buchung sagen kann (T-009)
//
// Eine reine Funktion kann keine Kennung vergeben — dafür bräuchte sie Zufall
// oder eine Uhr, und beides nähme ihr die Prüfbarkeit ohne laufenden Dienst.
// Sie liefert deshalb Entwürfe: alles, was aus der Regel folgt, ohne die
// Felder, die erst die Speicherung setzt (`id` beim Anlegen, `createdAt`,
// `updatedAt`, `exportStatus`, `exportCount`).
//
// Das ist kein Umweg, sondern die Trennung aus E-001 an einer konkreten
// Stelle: Die Domäne entscheidet, der Adapter schreibt.
// ---------------------------------------------------------------------------

/** Ein neuer, noch nicht gespeicherter laufender Timer. */
export interface RunningTimeEntryDraft {
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly note: string;
  readonly source: 'timer';
}

/**
 * Eine abzuschließende Buchung: die Kennung ist bekannt, weil die Zeile bereits
 * läuft; Ende und Dauer folgen aus der Regel.
 */
export interface StoppedTimeEntryDraft {
  readonly id: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  readonly durationSeconds: Seconds;
  readonly note: string;
  readonly source: 'timer';
}

/** Kürzeste Dauer, die als Buchung erhalten bleibt. Siehe `MinimumDurationSeconds`. */
export const MINIMUM_DURATION_SECONDS: MinimumDurationSeconds = 1;

/**
 * Ergebnis der reinen Stopp-Regel.
 *
 * `orphan_discarded` steht neben `timer_too_short`, weil beide Fälle dieselbe
 * Folge haben — es entsteht keine Buchung — aber aus verschiedenen Gründen, und
 * der Grund gehört in die Meldung an den Benutzer (E-036).
 */
export type TimerStopDecision =
  | { readonly kind: 'recorded'; readonly entry: StoppedTimeEntryDraft }
  | {
      readonly kind: 'discarded';
      readonly reason: 'timer_too_short' | 'orphan_discarded';
      readonly durationSeconds: number;
    };

/**
 * Ergebnis der reinen Start-Regel (A-6.8, A-2.5).
 *
 * Nicht zu verwechseln mit `TimerStartResult` oben: Dort steht, was nach dem
 * Schreiben herauskommt (mit vergebener Kennung und vollständiger Buchung),
 * hier steht, was die Regel entschieden hat. Der Anwendungsfall setzt das eine
 * in einer Transaktion in das andere um.
 */
export type TimerStartDecision =
  | {
      readonly kind: 'started';
      readonly entry: RunningTimeEntryDraft;
      /** Was mit dem zuvor laufenden Timer geschieht. `null`, wenn keiner lief. */
      readonly stopped: TimerStopDecision | null;
      /** A-2.5: hebt dieser Start das Erledigt-Kennzeichen des Todos auf? */
      readonly doneCleared: boolean;
    }
  | {
      readonly kind: 'confirmation_required';
      readonly running: RunningTimeEntry;
    };

// ---------------------------------------------------------------------------
// Umsetzung (T-009)
// ---------------------------------------------------------------------------

/**
 * Regel für den Start eines Timers auf einem erledigten Todo (A-2.5, E-023).
 *
 * Der Vertrag ist absichtlich so schmal: ein Feld hinein, ein Feld hinaus. Es
 * gibt keine Kanban-Spalte im Ergebnis, weil der Start keine anfasst. Erledigt
 * und Spalte sind zwei Achsen; das Erledigen hat die Spalte nie verändert, also
 * gibt es beim Wiederaufnehmen nichts wiederherzustellen.
 *
 * `clearDone: false` bei einem nicht erledigten Todo ist kein Leerlauf, sondern
 * eine Aussage: Der Anwendungsfall schreibt dann nicht auf `completed_at` und
 * berührt die Zeile nicht ohne Grund.
 */
export const determineReopen: DetermineReopen = ({ isDone }) => ({ clearDone: isDone });

/**
 * Was das **Abschließen** einer Buchung am Zustand eines Todos ändert (E-032).
 *
 * Eine Achse und nur eine: `export_status` ist zweiwertig und beginnt bei
 * `open` (E-032). Sobald eine Buchung ein Ende hat, gibt es an diesem Todo
 * etwas Abzurechnendes, und jede Regel mit `exportState: 'open'` — „was habe
 * ich noch nicht abgerechnet" — nimmt es damit auf.
 *
 * **Ein laufender Timer zählt nicht.** Er trägt `ended_at IS NULL` und ist
 * nichts, was man abrechnen könnte; `v_export_candidate` führt ausschließlich
 * abgeschlossene Buchungen.
 *
 * Das ist die Wirkung von `POST /timer/stop` und von
 * `POST /timer/orphaned/resolve` mit `book_until_heartbeat`: Beide schließen
 * eine Buchung ab, die schon da war, und **beide fassen das
 * Erledigt-Kennzeichen nicht an** — das tut allein der Start (A-2.5). Wer hier
 * {@link BOOKING_EFFECT} nähme, behauptete eine Aufhebung, die nicht
 * stattfindet: Ein Todo, das während des laufenden Timers von Hand auf erledigt
 * gesetzt wurde, bliebe erledigt, und der Satz nennte trotzdem jede Spalte mit
 * `completion: 'open'`.
 */
export interface EntryClosedEffect {
  /** E-032 — es gibt jetzt mindestens eine abgeschlossene, offene Buchung. */
  readonly hasOpenEntries: true;
}

/** Siehe {@link EntryClosedEffect}. Eingefroren, weil ein geteilter Wert nicht wandern darf. */
export const ENTRY_CLOSED_EFFECT: EntryClosedEffect = Object.freeze({ hasOpenEntries: true });

/**
 * Was eine **Buchung auf ein Todo** an dessen Zustand ändert
 * (A-2.5, E-032, E-061 Punkt 1).
 *
 * ---------------------------------------------------------------------------
 * Warum das eine Größe der Domäne ist und nicht eine Zeile im Anwendungsfall
 * ---------------------------------------------------------------------------
 *
 * Bis T-101 stand dieses Paar an **vier** Stellen ausgeschrieben: zweimal in
 * den Add-in-Routen (Ankündigung und Bestätigung derselben Buchung), einmal in
 * `timer/start` und einmal in `timer/stop` samt `orphaned/resolve`. Vier
 * Abschriften einer Fachaussage sind vier Gelegenheiten, Verschiedenes über
 * dieselbe Handlung zu behaupten — und die Ankündigung, die etwas anderes
 * verspricht, als die Bestätigung berichtet, ist Befund C-03 aus T-025.
 *
 * Deshalb steht die **Wirkung** hier, in der Domäne, und die **Rechnung** im
 * Anwendungsfall (`apps/local-api/src/usecases/pool-movement.ts`). Diese
 * Konstante kennt weder Buchungen im Speicher noch Pools noch Regeln; sie sagt
 * allein, welche zwei Achsen eine Buchung umlegt.
 *
 * ---------------------------------------------------------------------------
 * Die beiden Achsen, und warum es genau diese zwei sind
 * ---------------------------------------------------------------------------
 *
 *  - `completedAt: null` — **Buchen hebt „Erledigt" auf** (A-2.5). Das gilt für
 *    jeden Weg, auf dem eine Buchung auf einem Todo **entsteht**: der
 *    Timerstart (`timer.start` schreibt `completed_at = NULL`) und die Buchung
 *    aus dem Aufgabenbereich des Add-ins (`clearDone` in derselben
 *    Transaktion). Seit T-038 gibt es keinen Schalter mehr, der das verhindern
 *    könnte. War das Todo nicht erledigt, stand dort ohnehin `null`, und der
 *    Wert ändert nichts.
 *  - `hasOpenEntries: true` — {@link ENTRY_CLOSED_EFFECT}, siehe dort.
 *
 * **Nicht die Wirkung eines Stopps.** Der Stopp schließt eine Buchung ab, die
 * schon da war; er legt nur die zweite Achse um. Dafür steht
 * {@link ENTRY_CLOSED_EFFECT}, und der Unterschied ist keine Feinheit: Er ist
 * der Fall „während des laufenden Timers von Hand auf erledigt gesetzt".
 *
 * **Nicht dabei sind Tags, Status und der Exportstatus vorhandener Buchungen.**
 * Eine Buchung fasst keine davon an; wer sie hier aufnähme, behauptete eine
 * Wirkung, die es nicht gibt. Das Spreizen über den Zustand von vorher
 * (`{ ...before, ...BOOKING_EFFECT }`) ist deshalb der richtige Weg: Kommt eine
 * sechste Achse hinzu, geht sie unverändert mit, statt still zu fehlen.
 *
 * **Nicht dasselbe wie „ein Timer läuft".** Ein laufender Timer trägt
 * `ended_at IS NULL` und ist nichts, was man abrechnen könnte; er setzt
 * `hasOpenEntries` **nicht**. Am Timerstart gilt diese Wirkung deshalb nur
 * dann vollständig, wenn er einen Timer **desselben** Todos verdrängt und dabei
 * eine Buchung abschließt; sonst fällt allein das Kennzeichen.
 */
export interface BookingEffect extends EntryClosedEffect {
  /** A-2.5 — das Kennzeichen fällt. */
  readonly completedAt: null;
}

/** Siehe {@link BookingEffect}. Eingefroren, weil ein geteilter Wert nicht wandern darf. */
export const BOOKING_EFFECT: BookingEffect = Object.freeze({
  ...ENTRY_CLOSED_EFFECT,
  completedAt: null,
});

/**
 * Stopp-Regel (A-6.2, A-6.4).
 *
 * Liegt die Laufzeit unter der Mindestdauer, entsteht keine Buchung. Das ist
 * der Doppelklick auf „Start", nicht geleistete Arbeit — und die Speicherung
 * ließe eine Zeile mit Dauer 0 ohnehin nicht zu (CHECK auf `duration_seconds`).
 *
 * Rein: Ende und Dauer folgen ausschließlich aus den übergebenen Zeitstempeln.
 * Die Uhr liest der Aufrufer, nicht diese Funktion.
 */
export const decideTimerStop = (input: {
  readonly running: RunningTimeEntry;
  readonly note: string;
  readonly now: Timestamp;
}): TimerStopDecision => {
  const durationSeconds = secondsBetween(input.running.startedAt, input.now);

  if (durationSeconds < MINIMUM_DURATION_SECONDS) {
    return { kind: 'discarded', reason: 'timer_too_short', durationSeconds };
  }

  return {
    kind: 'recorded',
    entry: {
      id: input.running.id,
      todoId: input.running.todoId,
      startedAt: input.running.startedAt,
      endedAt: input.now,
      durationSeconds,
      note: input.note,
      source: 'timer',
    },
  };
};

/**
 * Start-Regel: höchstens ein Timer gleichzeitig (A-6.8).
 *
 * Läuft bereits einer und hat der Benutzer nicht ausdrücklich zugestimmt, ihn
 * zu stoppen, liefert die Regel `confirmation_required` — und zwar **bevor**
 * irgendetwas geschrieben wird. Es gibt keinen Weg durch diese Funktion, der
 * einen laufenden Timer stillschweigend beendet, und keinen, der zwei Timer
 * gleichzeitig entstehen lässt.
 *
 * Der strukturelle Schutz in der Speicherung (`ux_time_entry_running`, ein
 * eindeutiger Partialindex auf `ended_at IS NULL`) ersetzt diese Regel nicht,
 * sondern sichert sie ab: Der Index verhindert den zweiten Timer, diese Regel
 * sorgt dafür, dass der Benutzer vorher gefragt wird, statt einen Fehler zu
 * sehen.
 *
 * `todoIsDone` und `note` sind optional, weil der häufige Fall — aktives Todo,
 * leerer Leistungstext — ohne sie auskommt.
 */
export const decideTimerStart = (input: {
  readonly running: RunningTimeEntry | null;
  readonly request: TimerStartRequest;
  /** A-2.5: trägt das Zieltodo das Erledigt-Kennzeichen? */
  readonly todoIsDone?: boolean;
  /** Leistungstext, mit dem der neue Timer beginnt. */
  readonly note?: string;
}): TimerStartDecision => {
  const { running, request } = input;

  if (running !== null && !request.stopRunning) {
    return { kind: 'confirmation_required', running };
  }

  const stopped =
    running === null
      ? null
      : decideTimerStop({ running, note: running.note, now: request.now });

  return {
    kind: 'started',
    entry: {
      todoId: request.todoId,
      startedAt: request.now,
      note: input.note ?? '',
      source: 'timer',
    },
    stopped,
    doneCleared: determineReopen({ isDone: input.todoIsDone ?? false }).clearDone,
  };
};

/**
 * Was mit einer verwaisten Buchung geschieht (E-036).
 *
 * Verwaist ist eine Buchung ohne Ende, die beim Start der Anwendung vorgefunden
 * wird: Absturz, Abmeldung, Stromausfall. Sie wird **nie** stillschweigend bis
 * jetzt weitergezählt — ein über Nacht vergessener Timer bucht sonst vierzehn
 * Stunden, und nach der Aufrundung aus E-008 landet das in einer Rechnung.
 *
 * Gebucht wird höchstens bis zum letzten Lebenszeichen. Der Schaden ist damit
 * auf ein Schreibintervall gedeckelt. Fehlt das Lebenszeichen ganz, ist die
 * Dauer 0 und die Buchung fällt als zu kurz heraus — es gibt nichts zu buchen,
 * was jemand bezeugen könnte.
 *
 * Bis der Benutzer geantwortet hat, bleibt die Buchung unvollständig und geht
 * in keinen Export: Sie hat kein `ended_at`, und `v_export_candidate` führt
 * ausschließlich abgeschlossene Buchungen.
 */
export const decideOrphanedTimer = (input: {
  readonly running: RunningTimeEntry;
  /** Letztes Lebenszeichen, `null` wenn nie eines geschrieben wurde. */
  readonly heartbeatAt: Timestamp | null;
  readonly resolution: 'book_until_heartbeat' | 'discard';
}): TimerStopDecision => {
  if (input.resolution === 'discard') {
    return { kind: 'discarded', reason: 'orphan_discarded', durationSeconds: 0 };
  }

  return decideTimerStop({
    running: input.running,
    note: input.running.note,
    now: input.heartbeatAt ?? input.running.startedAt,
  });
};

/**
 * Ist die Buchung gegen Bearbeitung gesperrt? (A-6.9)
 *
 * Gesperrt sind Start, Ende, Dauer, Leistung, Todo-Zuordnung und das Löschen.
 * Nicht gesperrt ist der Exportstatus selbst — sonst ließe sich E-012 nicht
 * umsetzen. Dieselbe Regel steht als Trigger in der Speicherung, damit sie auch
 * dann greift, wenn ein späterer Anwendungsfall sie zu prüfen vergisst.
 */
export const isLocked: IsLocked = (entry) => entry.exportStatus === 'exported';

/**
 * Prüft einen Wechsel des Exportstatus (A-6.9, E-012, E-032).
 *
 * Es gibt genau zwei erlaubte Übergänge, und jeder hat genau einen Auslöser:
 *
 *     open     --[ export_run ]--> exported
 *     exported --[ reset      ]--> open
 *
 * Der Auslöser ist Teil der Bedingung, nicht Beiwerk. `open -> exported` ohne
 * einen der beiden vorgesehenen Auslöser wäre eine als abgerechnet markierte
 * Buchung, hinter der weder eine Datei noch eine Entscheidung steht. „Nicht
 * abrechnen" (E-047) führt deshalb nicht am Wächter vorbei, sondern durch ihn
 * hindurch — mit eigenem Auslöser und eigenem Ereignistyp im Protokoll.
 *
 * **E-032 steht hier als Abwesenheit.** Das Ergebnis eines Resets ist `open` —
 * derselbe Wert wie bei einer Buchung, die nie exportiert war. Es gibt keinen
 * dritten Status „erneut offen", weil ein solcher Wert früher oder später in
 * einem Filter landen und die zurückgesetzte Buchung aus dem nächsten Export
 * heraushalten würde. Dass sie schon einmal exportiert war, trägt `exportCount`
 * und ist eine Frage der Anzeige (R-10).
 */
export const checkExportStatusTransition: CheckExportStatusTransition = (from, to, trigger) => {
  if (from === to) {
    return err(
      taktError(
        'export_status_unchanged',
        'Der Exportstatus ist bereits auf diesem Wert; es gibt nichts zu ändern.',
      ),
    );
  }

  if (from === 'open' && to === 'exported' && trigger === 'export_run') {
    return ok({ from: 'open', to: 'exported', trigger: 'export_run' });
  }

  if (from === 'open' && to === 'exported' && trigger === 'not_billed') {
    return ok({ from: 'open', to: 'exported', trigger: 'not_billed' });
  }

  if (from === 'exported' && to === 'open' && trigger === 'reset') {
    return ok({ from: 'exported', to: 'open', trigger: 'reset' });
  }

  return err(
    taktError(
      'export_status_not_settable',
      'Dieser Wechsel des Exportstatus ist über diesen Weg nicht vorgesehen.',
    ),
  );
};
