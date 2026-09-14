/**
 * Takt — Timer und Zeitbuchungen (A-6.*, A-2.5, E-036).
 *
 * ---------------------------------------------------------------------------
 * Die drei Regeln, die hier zusammenkommen
 * ---------------------------------------------------------------------------
 *
 *  1. **Nur ein Timer gleichzeitig** (A-6.8). Läuft schon einer, wird
 *     **gefragt**, nicht abgebrochen und nicht stillschweigend gestoppt. Der
 *     Anwendungsfall liefert dafür `confirmation_required` mit dem Titel des
 *     betroffenen Todos — sonst müsste die Oberfläche nachfragen, ohne sagen zu
 *     können, worum es geht.
 *  2. **Starten hebt „Erledigt" auf** (A-2.5). Das Todo wird wieder aktiv, die
 *     Kanban-Spalte bleibt (E-023), und die Pool-Zugehörigkeit kommt ohne
 *     Schreibvorgang zurück, weil sie aus den Tags abgeleitet und nirgends
 *     gespeichert ist (A-3.4).
 *  3. **Alles in einer Transaktion.** Stopp des alten Timers, Aufheben von
 *     „Erledigt" und Start des neuen sind ein Vorgang. Ein Abbruch dazwischen
 *     darf keinen Zustand hinterlassen, in dem das Todo aktiv ist, aber kein
 *     Timer läuft — oder in dem zwei Timer als beendet gelten und keiner läuft.
 */

import type {
  PoolMovement,
  RunningTimeEntry,
  TimeEntry,
  TimeEntryId,
  Timestamp,
  TodoId,
} from '@takt/domain';
import { decideOrphanedTimer, err, ok, taktError } from '@takt/domain';
import type { UnitOfWork } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';
import { NO_ENTRIES } from '../../pool-movement.ts';
import { movementOfBooking, movementOfStart, presenceBeforeBooking } from './movement.ts';

/**
 * Die Aufnahme beim Dienststart — und was „verwaist" überhaupt heißt (E-036,
 * geprüft in T-350).
 *
 * ---------------------------------------------------------------------------
 * Der Satz, um den es geht
 * ---------------------------------------------------------------------------
 *
 * „Verwaist ist eine Buchung ohne Ende, die **beim Start der Anwendung**
 * vorgefunden wird: Absturz, Abmeldung, Stromausfall." So steht es in der
 * Domäne (`decideOrphanedTimer`, `packages/domain/src/time-entry.ts`), und so
 * steht es in E-036. „Beim Start vorgefunden" ist der ganze Inhalt der Regel —
 * und diese Funktion ist die einzige Stelle, an der er tatsächlich gemessen
 * wird.
 *
 * **Die Speicherung mißt ihn nicht.** `TimerHeartbeatPort.orphaned()` liefert
 * jede Zeile mit `ended_at IS NULL`, ohne Rücksicht auf den Zeitpunkt — und
 * weil `ux_time_entry_running` genau eine solche Zeile zuläßt (A-6.8), ist das
 * **immer** der gerade laufende Timer. Ohne diese Aufnahme beantwortete
 * `GET /timer/orphaned` die Frage „ist etwas abgestürzt?" also mit dem Timer,
 * den der Benutzer in diesem Augenblick sichtbar laufen sieht. Gemessen
 * (T-350, in einem Prozeß, ohne HTTP): Ein Timer, der in derselben
 * Dienstsitzung gestartet wurde, gilt heute **nicht** als verwaist — vorher
 * hätte ein Neuladen der Seite den Dialog „Eine Buchung ohne Ende" darüber
 * gestellt. Der Kommentar der Speicherung („die beim Start vorgefundene
 * unvollständige Buchung") sagt seit jeher etwas zu, was ihre Abfrage nicht
 * einlöst; eingelöst wird es hier.
 *
 * ---------------------------------------------------------------------------
 * Warum das kein Widerspruch zu A-24.7 ist
 * ---------------------------------------------------------------------------
 *
 * A-24.7 verlangt, daß offene Phasen Neuladen, Neustart und Datensicherung
 * überleben, und CLAUDE.md schärft nach: in SQLite, nicht im Arbeitsspeicher.
 * Hier steht ein Wert im Arbeitsspeicher — aber er ist **kein Zustand**,
 * sondern eine **Beobachtung**, die bei jedem Start aus SQLite neu gewonnen
 * wird. Der offene Eintrag selbst liegt im Bestand und überlebt alles; die
 * Frage „lag er schon da, als ich hochkam?" wird bei jedem Start neu
 * beantwortet und kommt deshalb nach einem Neustart nicht abhanden, sondern
 * entsteht dort überhaupt erst.
 *
 * Gemessen (T-350, echter Dienst auf 17843, `kill -9` zwischen zwei Läufen,
 * derselbe Bestand): Der Eintrag aus Lauf 1 ist in Lauf 2 verwaist,
 * `bookableSeconds` steht auf dem Abstand bis zum letzten Lebenszeichen und
 * nicht auf der Wanduhr. Die Verengung nimmt der Anwendung also **nichts** von
 * dem, wofür die Erkennung gebaut wurde.
 *
 * ---------------------------------------------------------------------------
 * Zwei Mechanismen, eine Trennlinie: hat der Prozeß überlebt?
 * ---------------------------------------------------------------------------
 *
 * E-036 und A-24 fragen dasselbe („da lief ein Timer, und niemand hat
 * gearbeitet") auf zwei Seiten derselben Linie:
 *
 *   Prozeß **tot**      → E-036. Beim nächsten Start: bis zum letzten
 *                         Lebenszeichen buchen oder verwerfen.
 *   Prozeß **am Leben** → A-24. Die Abwesenheit wird vorgemerkt, der Timer
 *                         läuft weiter, die Rückkehr schließt die aktive Zeit
 *                         ab (`idle.ts`, `timer_idle` in SQLite).
 *
 * Ein Eintrag, der beides beanspruchte, hätte zwei Dialoge über denselben
 * Sachverhalt. Genau das war der Anlaß dieser Aufnahme, und deshalb steht
 * darunter in beiden Anwendungsfällen zusätzlich die Abfrage auf eine offene
 * Inaktivitätsphase.
 *
 * ---------------------------------------------------------------------------
 * Der zweite Eingang, und wer die Frage stellt (T-350, T-358, T-363, R-34)
 * ---------------------------------------------------------------------------
 *
 * Die Aufnahme geschieht **einmal** beim Start. Offene Einträge entstehen im
 * Betrieb nur durch `unit.timer.start` (`startTimer` hier,
 * `resolveIdle`/`returnFromIdle` in `idle.ts`) — und durch
 * `dataArchive.replaceAll` (A-20, `features/data-transfer/data-transfer.ts`).
 * Dieser zweite Eingang kommt **nach** dem Start: Ein Archiv, das bei
 * laufendem Timer entstand, trägt eine `time_entry`-Zeile ohne Ende und das
 * mitgereiste `timer_heartbeat`. `importDataArchive` stellt deshalb dieselbe
 * Frage wie diese Funktion noch einmal, und zwar **in derselben Transaktion**
 * wie `replaceAll`; eine zweite Klammer dahinter ließ gemessen einen nebenher
 * fragenden Leser zwischen `COMMIT` und Aufnahme geraten (T-358).
 *
 * ---------------------------------------------------------------------------
 * Wer die Frage stellt, entscheidet über die Zahl auf der Rechnung (T-363)
 * ---------------------------------------------------------------------------
 *
 * Bis T-363 stellten sie ausschließlich {@link loadOrphanedTimer} und
 * {@link resolveOrphanedTimer} — der Schutz lag damit in der **Anzeige**, und
 * wer den Weg über den Dialog nicht nahm, bekam die Wanduhr. Gemessen über den
 * echten Anwendungsfallweg, Zieluhr elf Stunden hinter der Quelluhr:
 *
 *   `POST /timer/stop` auf dem eingespielten Eintrag   **39 600 s**
 *   derselbe Eintrag über den Dialog                   1 200 s
 *
 * Und dasselbe **ohne jedes Archiv**: Nach einem gewöhnlichen Absturz buchte
 * ein direkter Stopp ebenfalls 39 600 s — der Fall, für den E-036 überhaupt
 * geschrieben wurde. Der zweite Eingang war also nicht der einzige Weg zu den
 * elf Stunden, sondern der auffälligere.
 *
 * Seit T-363 fragen {@link stopTimer} und {@link touchHeartbeat} dieselbe
 * Frage wie die Anzeige. Die Regel dazu steht weiterhin an **einer** Stelle:
 * {@link foundAtServiceStart}, und was aus ihr folgt, in
 * {@link bookingEndOf}.
 *
 * ---------------------------------------------------------------------------
 * Und T-363 hat seine Menge trotzdem zu klein gespannt (T-371)
 * ---------------------------------------------------------------------------
 *
 * Zwei unabhängige Prüfungen haben dasselbe gefunden: Von den Stellen, die
 * `ended_at` auf einen offenen Eintrag schreiben, fragten **zwei** die Frage
 * nicht — `beginIdle` und `completeReturn` in `idle.ts`. Beide buchten auf
 * einem vorgefundenen Eintrag gemessen die Wanduhr eines fremden Rechners
 * (39 900 s gegen 1 200 s im Dialog), beide **ohne Zutun des Benutzers**:
 * `useIdleTimer` schickt sie von selbst, sobald jemand weggeht.
 *
 * Seit T-371 sind {@link foundAtServiceStart} und {@link bookingEndOf}
 * deshalb **exportiert** und `idle.ts` fragt durch sie. Die Menge ist an der
 * Anforderung aufgespannt und nicht an den Routen (E-099 Punkt 3):
 * `proof:layers` Abschnitt 7 zählt die Schreibstellen aus der Platte und
 * verlangt für jede den Nachweis, daß sie fragt — eine achte Tür wird rot,
 * bevor sie gemessen werden muß.
 */
export async function captureTimerRecovery(context: AppContext): Promise<void> {
  if (context.timerRecovery !== undefined) {
    context.timerRecovery.entryId = await context.transactions.inTransaction(async (unit) => (await unit.timer.running())?.id ?? null);
  }
}

/**
 * Die Regel aus {@link captureTimerRecovery}, an genau einer Stelle.
 *
 * Bis T-350 stand sie zweimal wörtlich in einer `if`-Bedingung — einmal in
 * {@link loadOrphanedTimer}, einmal in {@link resolveOrphanedTimer}. Zwei
 * Abschriften einer Regel sind eine Regel, die einmal geändert werden kann;
 * und ein `!==` in einer längeren Bedingung trägt seinen Namen nicht, weshalb
 * drei End-zu-Ende-Fälle sie erst beim Fehlschlagen bemerkt haben.
 *
 * **Kein Zusammenhang, keine Verengung.** Fehlt `timerRecovery` ganz, gilt
 * jeder offene Eintrag als verwaist — das ist die Lage vor E-036s Aufnahme und
 * ausdrücklich nicht die Zusage des Erzeugnisses: `composition.ts` setzt das
 * Feld in dem einen Zweig, in dem überhaupt ein `AppContext` entsteht. Übrig
 * bleibt der von Hand gebaute Zusammenhang eines Prüffalls, und dort ist „ohne
 * Aufnahme sieht alles verwaist aus" die ehrlichere Vorgabe als „ohne Aufnahme
 * ist nichts mehr verwaist", die jede Wiedererkennung stillschweigend
 * abschaltete.
 *
 * **Seit T-363 hängt an der Ausfallrichtung Geld, nicht nur ein Dialog.**
 * Vorher hieß „kein Zusammenhang" nur, daß die Waisenfrage öfter gestellt
 * wird; jetzt heißt sie zusätzlich, bis wohin ein Stopp bucht
 * ({@link bookingEndOf}). Beide Richtungen sind damit nicht mehr
 * gleichwertig: „im Zweifel verwaist" bucht **höchstens** bis zum letzten
 * Lebenszeichen, „im Zweifel nicht verwaist" bucht die Wanduhr. Deshalb bleibt
 * das Feld freiwillig und diese Zeile defensiv — eine Pflicht im Typ würde von
 * jedem von Hand gebauten Zusammenhang mit `as unknown as AppContext` ohnehin
 * stumm unterlaufen, nähme aber genau diese `undefined`-Abzweigung mit und
 * drehte die Ausfallrichtung dabei auf die teure Seite (Begründung im Bericht
 * zu T-363, Punkt 3).
 */
export function foundAtServiceStart(context: AppContext, entryId: TimeEntryId): boolean {
  return context.timerRecovery === undefined || context.timerRecovery.entryId === entryId;
}

/**
 * Bis wohin eine Buchung reicht, die einen **offenen** Eintrag schließt —
 * dieselbe Frage, die die Anzeige stellt (T-363, T-371, R-34, E-036).
 *
 * ---------------------------------------------------------------------------
 * Warum die Funktion seit T-371 `wish` heißt und nicht mehr `wallClock`
 * ---------------------------------------------------------------------------
 *
 * T-363 hat sie als `bookingEndOfStop` gebaut, für die eine Stelle, die der
 * Auftrag kannte. Gemessen waren es **sieben** Stellen, an denen `ended_at`
 * auf einen offenen Eintrag geschrieben wird, und **zwei** davon — beide in
 * `idle.ts` — stellten die Frage nicht: Auf einem vorgefundenen Eintrag buchte
 * die Inaktivitätserkennung gemessen **39 900 s**, während `GET /timer/orphaned`
 * für denselben Eintrag 1 200 s auswies (T-369, T-370). Die Menge war an den
 * Routen aufgespannt statt an der Anforderung — E-099 Punkt 3.
 *
 * Der Unterschied zwischen den Stellen ist nicht die Regel, sondern der
 * **Wunsch**: Der Stopp will bis „jetzt" schließen, die Verdrängung ebenso,
 * die Inaktivität bis zum Beginn der Abwesenheit. Deshalb nimmt diese Funktion
 * den Wunsch entgegen und gibt zurück, was davon übrigbleibt:
 *
 *     Timer **dieses** Laufs      → `wish`, unverändert.
 *     beim Start **vorgefunden**  → `min(wish, letztes Lebenszeichen)`.
 *
 * `wish` ist damit zugleich die **Obergrenze** dieses Weges. Jede Aufrufstelle
 * leitet ihn aus einem Wert ab, der nicht hinter ihrer eigenen Wanduhr liegt;
 * der Deckel nach oben entsteht dadurch in `decideOrphanedTimer` von selbst
 * (dort steht, warum er dorthin gehört und nicht hierher).
 *
 * ---------------------------------------------------------------------------
 * Zwei Fälle, und nur der zweite ist eine Verengung
 * ---------------------------------------------------------------------------
 *
 *   Timer **dieses** Laufs   → der Wunsch des Weges, unverändert. Der
 *                              gewöhnliche Fall: gestartet, gearbeitet,
 *                              gestoppt.
 *   Beim Start **vorgefunden** → höchstens bis zum letzten Lebenszeichen.
 *
 * Der zweite Fall ist die Buchung, über die {@link loadOrphanedTimer} schon
 * heute `bookableSeconds` berichtet und die {@link resolveOrphanedTimer} auf
 * „bis zum Lebenszeichen buchen" schreibt. Bis T-363 gab ein direkter
 * `POST /timer/stop` daneben eine **zweite** Zahl für denselben Eintrag — die
 * Wanduhr. Zwei Zahlen für eine Buchung sind kein Kompromiß, sondern der
 * Fehler: Welche in der Abrechnung landet, entschied der Weg durch die
 * Oberfläche.
 *
 * ---------------------------------------------------------------------------
 * Warum der Stopp bucht und nicht verweigert — und `beginIdle` umgekehrt
 * ---------------------------------------------------------------------------
 *
 * Der Stopp ist bereits eine **Antwort** des Benutzers, die
 * Inaktivitätserkennung ist es nicht: `useIdleTimer` schickt `idle/begin` von
 * selbst, sobald jemand vom Rechner weggeht. Deshalb fällt die Entscheidung
 * dort anders aus und steht in `idle.ts` begründet — dieselbe Frage, zwei
 * Ausgänge, und der Unterschied ist nicht der Weg, sondern ob eine Person
 * geantwortet hat.
 *
 * Die naheliegende Alternative wäre, den Stopp mit `conflict` abzuweisen
 * („beantworten Sie zuerst die Frage aus E-036") — so, wie es die Zeile
 * darüber für eine offene Inaktivitätsphase tut. Dagegen sprechen zwei Dinge.
 * Erstens ist der Stopp bereits eine Antwort: Der Benutzer sagt „buchen", und
 * genau diesen Ausgang bietet der Dialog als Vorgabe an; das Gegenteil
 * („verwerfen") kann `POST /timer/stop` nicht ausdrücken und muß deshalb beim
 * Dialog bleiben. Zweitens holt die Oberfläche `GET /timer/orphaned` nur beim
 * Aufbau der Seite — nach einem Einspielen im laufenden Betrieb gibt es den
 * Dialog also gar nicht zu beantworten, und eine Abweisung ließe den Benutzer
 * vor einem Timer stehen, den er nicht schließen kann.
 *
 * Gebucht wird mit der **Leistung aus dem Stopp** und nicht mit der am Eintrag
 * gespeicherten; {@link resolveOrphanedTimer} hat keine und nimmt deshalb die
 * gespeicherte. Das ist der einzige Unterschied zwischen beiden Wegen.
 *
 * ---------------------------------------------------------------------------
 * Ohne Lebenszeichen
 * ---------------------------------------------------------------------------
 *
 * Dann liefert `decideOrphanedTimer` `discarded`, und diese Funktion gibt den
 * **Startzeitpunkt** zurück: `timer.stop` rechnet daraus die Dauer 0, verwirft
 * die Buchung und räumt die Zeile ab — derselbe Weg wie im Dialog, und es gibt
 * keinen zweiten, auf dem eine Buchung entstehen könnte. Erreichbar ist das
 * fast nur über ein Archiv ohne `timer_heartbeat`: `startTimer` schreibt das
 * erste Lebenszeichen sofort mit.
 *
 * Gefragt wird `heartbeat.lastSeen` und nicht `heartbeat.orphaned`, obwohl die
 * Anzeige letzteres nimmt. Es ist dieselbe Zeile: `orphaned()` ist `running()`
 * plus ein `LEFT JOIN` auf dasselbe Lebenszeichen, und `ux_time_entry_running`
 * läßt genau einen offenen Eintrag zu. Hier liegt die Kennung bereits vor.
 */
export async function bookingEndOf(
  context: AppContext,
  unit: UnitOfWork,
  running: RunningTimeEntry,
  wish: Timestamp,
): Promise<Timestamp> {
  if (!foundAtServiceStart(context, running.id)) return wish;

  const decision = decideOrphanedTimer({
    running,
    heartbeatAt: await unit.heartbeat.lastSeen(running.id),
    resolution: 'book_until_heartbeat',
    now: wish,
  });
  return decision.kind === 'recorded' ? decision.entry.endedAt : running.startedAt;
}

export interface RunningTimerView {
  readonly entry: RunningTimeEntry;
  readonly todoTitle: string;
  /** Sekunden seit dem Start, zum Zeitpunkt der Anfrage. Nicht gespeichert. */
  readonly elapsedSeconds: number;
}

export function loadRunningTimer(context: AppContext): Promise<RunningTimerView | null> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timer.running();
    if (entry === null) return null;
    const todo = await unit.todos.load(entry.todoId);
    return {
      entry,
      todoTitle: todo?.title ?? '',
      elapsedSeconds: Math.max(0, Math.floor((Date.parse(timestamp) - Date.parse(entry.startedAt)) / 1000)),
    };
  });
}

export type StartTimerResult =
  | {
      readonly kind: 'started';
      readonly started: RunningTimeEntry;
      readonly stopped: TimeEntry | null;
      /** A-2.5: war das Todo erledigt und ist durch den Start wieder aktiv? */
      readonly doneCleared: boolean;
      /**
       * Wie der Start das Todo durch die Pools bewegt — oder `null` (E-058).
       *
       * ---------------------------------------------------------------------
       * Wann gerechnet wird und wann nicht
       * ---------------------------------------------------------------------
       *
       * Gerechnet wird, wenn der Start etwas bewegt haben **kann**, und das
       * sind genau zwei Fälle:
       *
       *  1. **Der Start hat „Erledigt" aufgehoben** (A-2.5, `doneCleared`).
       *     Jede Regel mit einer Erledigt-Achse urteilt danach anders — die
       *     Spalte „nur Erledigte" verliert das Todo, die Spalte „nur Offene"
       *     bekommt es.
       *  2. **Die erste abgeschlossene Buchung ist entstanden.** Das geschieht
       *     beim Start dann, wenn er einen laufenden Timer **desselben** Todos
       *     stoppt: Aus dem laufenden Timer wird eine offene Buchung, und
       *     jede Regel mit `exportState: 'open'` nimmt das Todo damit auf.
       *
       * Sonst `null`. Ein laufender Timer allein ist keine Buchung — die
       * Abfrage verlangt `ended_at IS NOT NULL`, „ein laufender Timer ist noch
       * nichts, was man abrechnen könnte" —, an den Tags ändert der Start
       * nichts, und am Status auch nicht (E-023). Es gibt dann buchstäblich
       * nichts zu berichten, und `null` sagt das, statt drei leere Listen zu
       * schicken, aus denen der Aufrufer dasselbe schließen müsste.
       *
       * ---------------------------------------------------------------------
       * Warum das nicht dieselbe Frage ist wie `doneCleared`
       * ---------------------------------------------------------------------
       *
       * `doneCleared` sagt, **was geschehen ist**; `poolMovement` sagt, **was
       * daraus folgt**. Bis E-058 sagten beide Flächen dazu denselben Satz
       * („Die Karte bleibt, wo sie ist"), und der war seit E-055 falsch: Eine
       * Regel entscheidet auch über Erledigt und über den Exportstatus, und
       * beides ändert dieser Start. Der Satz dazu steht in
       * `poolMovementSentence` (`packages/domain`); hier stehen nur die Namen.
       */
      readonly poolMovement: PoolMovement | null;
    }
  | {
      readonly kind: 'confirmation_required';
      readonly running: RunningTimeEntry;
      readonly runningTodoTitle: string;
    };

/**
 * Timer starten (A-6.2, A-6.8, A-2.5).
 *
 * `stopRunning` ist die Antwort des Benutzers auf die Rückfrage — nicht eine
 * Bequemlichkeit des Aufrufers. Ohne sie wird nichts angefasst, und der
 * Anwendungsfall liefert zurück, worüber zu entscheiden ist.
 */
export async function startTimer(
  context: AppContext,
  todoId: TodoId,
  stopRunning: boolean,
): Promise<UseCaseResult<StartTimerResult>> {
  const timestamp = now(context);

  return context.transactions.inTransaction(async (unit) => {
    const running = await unit.timer.running();

    if (running !== null && !stopRunning) {
      const todo = await unit.todos.load(running.todoId);
      return ok({
        kind: 'confirmation_required' as const,
        running,
        runningTodoTitle: todo?.title ?? '',
      });
    }

    /*
     * Der Zustand **vor** dem Start, gelesen bevor etwas geschrieben wird
     * (E-058).
     *
     * Er muss hier stehen und nicht danach: Nach dem Start ist `completed_at`
     * bereits `NULL`, und aus dem Ergebnis allein ließe sich nicht mehr sagen,
     * woraus das Todo verschwindet. Genau das ist die Auskunft, die E-056
     * verlangt.
     *
     * Beides zusammen ist ein Lesezugriff auf die Zeile und einer auf den
     * Index `ix_time_entry_queue`; die Ordner werden erst weiter unten
     * aufgelöst, und nur dann, wenn es etwas zu berichten gibt.
     */
    const before = await unit.todos.load(todoId);
    const presenceBefore =
      before === null ? null : await presenceBeforeBooking(unit, todoId);

    /*
     * Der **verdrängte** Timer, wenn er beim Dienststart vorgefunden wurde
     * (T-363, R-34, E-036).
     *
     * -----------------------------------------------------------------------
     * Die dritte Tür zu denselben elf Stunden
     * -----------------------------------------------------------------------
     *
     * `unit.timer.start(todoId, true, now)` schließt den laufenden Timer
     * **mit demselben Zeitpunkt**, mit dem es den neuen eröffnet — Wanduhr,
     * ohne Rücksicht darauf, woher der laufende stammt. Gemessen nach dem
     * Einspielen einer Sicherung mit laufendem Timer, Uhrversatz elf Stunden:
     * die verdrängte Buchung stand auf **39 600 s**, während
     * `GET /timer/orphaned` für denselben Eintrag 1 200 s auswies. Es ist
     * dieselbe Zahl wie beim direkten Stopp und derselbe Fehler; nur ist der
     * Weg dorthin der bequemere — die Oberfläche fragt beim Start auf einem
     * anderen Todo „Ein Timer läuft. Stoppen?", und ein Ja genügt (A-6.8).
     *
     * Deshalb wird ein vorgefundener Eintrag **vorher** und gedeckelt
     * geschlossen, und der Start läuft danach ohne Verdrängung. Dieselbe Regel,
     * dieselbe Funktion ({@link bookingEndOf}), dieselbe Zahl wie im Dialog.
     *
     * -----------------------------------------------------------------------
     * Warum zwei Schritte hier keinen Teilzustand hinterlassen
     * -----------------------------------------------------------------------
     *
     * Beide Schritte stehen in **derselben** Klammer, die der Anwendungsfall
     * ohnehin aufspannt. Der Port weist einen Start aus genau zwei fachlichen
     * Gründen ab — das Todo gibt es nicht, oder eine inaktive Zeit wartet auf
     * Zuordnung —, und beide werden **vor** dem Schließen geprüft (`before`
     * oben, `idle.pending()` hier). Bleibt ein Fehlschlag der Speicherung, und
     * dann darf nichts stehenbleiben: Ein zurückgegebener Fehler rollt die
     * Klammer **nicht** zurück, ein Wurf schon (`unit-of-work.ts`; dieselbe
     * Begründung wie in `idle.ts`). Der Wurf wird zu `internal_error`, und der
     * Bestand ist unverändert.
     */
    let displaced: TimeEntry | null = null;
    let closedBeforeStart = false;
    if (running !== null && stopRunning && before !== null && foundAtServiceStart(context, running.id)) {
      const pendingIdle = await unit.idle.pending();
      if (pendingIdle === null || pendingIdle.returnedAt !== null) {
        const closed = await unit.timer.stop(running.note, await bookingEndOf(context, unit, running, timestamp));
        // Nichts geschrieben — `timer_not_running` ist hier nicht erreichbar,
        // `running` wurde eine Zeile weiter oben aus derselben Transaktion
        // gelesen. Die Abzweigung steht trotzdem da, statt den Ausgang zu
        // unterstellen.
        if (!closed.ok) return err(closed.error);
        displaced = closed.value.kind === 'recorded' ? closed.value.entry : null;
        closedBeforeStart = true;
      }
    }

    const result = await unit.timer.start(todoId, closedBeforeStart ? false : stopRunning, timestamp);
    if (!result.ok) {
      if (closedBeforeStart) {
        throw new Error(`Der Timerstart schlug fehl, nachdem die vorgefundene Buchung geschlossen war (${result.error.code}).`);
      }
      return err(result.error);
    }

    const stopped = closedBeforeStart ? displaced : result.value.stopped;

    // Ein frisch gestarteter Timer bekommt sofort sein erstes Lebenszeichen
    // (E-036). Ohne es wüsste ein Neustart unmittelbar nach dem Start nicht,
    // bis wohin gebucht werden darf, und verwürfe die Buchung — richtig, aber
    // unnötig.
    await unit.heartbeat.touch(result.value.started.id, timestamp);

    return ok({
      kind: 'started' as const,
      started: result.value.started,
      stopped,
      doneCleared: result.value.doneCleared,
      poolMovement: await movementOfStart(unit, {
        todo: before,
        presence: presenceBefore ?? NO_ENTRIES,
        doneCleared: result.value.doneCleared,
        // Der gestoppte Timer wird zu einer **offenen** Buchung (E-032), und
        // nur wenn er auf demselben Todo lief, betrifft das dieses hier.
        bookedOnThisTodo: stopped?.todoId === todoId,
      }),
    });
  });
}



/**
 * Der Ausgang eines Stopps — und was er durch die Pools bewegt hat (E-058
 * Punkt 6).
 *
 * ---------------------------------------------------------------------------
 * Warum der Stopp überhaupt etwas zu berichten hat
 * ---------------------------------------------------------------------------
 *
 * Weil die **erste abgeschlossene Buchung** eine Achse umlegt. Seit E-055 kann
 * eine Regel nach dem Exportstatus fragen (`exportState: 'open'` — „was habe
 * ich noch nicht abgerechnet"), und ein Todo ohne jede abgeschlossene Buchung
 * erfüllt diese Achse nicht. Der Stopp macht aus dem laufenden Timer eine
 * offene Buchung; jede solche Spalte nimmt das Todo damit auf.
 *
 * Bis T-093 sagte nur `POST /timer/start` etwas dazu. Wer am Start eine
 * Auskunft gibt und am Stopp schweigt, sagt die halbe Wahrheit — und
 * ausgerechnet die unwichtigere Hälfte: Der Start kann die erste Buchung nur
 * in dem Sonderfall entstehen lassen, in dem er einen Timer **desselben** Todos
 * verdrängt. Der Regelweg zur ersten Buchung ist dieser hier.
 *
 * ---------------------------------------------------------------------------
 * Warum das Feld auch im verworfenen Ausgang steht
 * ---------------------------------------------------------------------------
 *
 * Ein Stopp unter der Mindestdauer erzeugt keine Buchung (A-6.2), bewegt also
 * nichts, und `poolMovement` ist dort **immer** `null`. Trotzdem steht das Feld
 * da, statt in diesem Zweig zu fehlen: Ein Feld, das je nach `kind` da ist oder
 * nicht, zwingt jede Aufrufstelle zu einer Fallunterscheidung, bevor sie die
 * eigentliche treffen kann — und `movement?.appears` auf einem Zweig, der es
 * nicht kennt, liest sich fehlerfrei und fragt ins Leere. Ein immer
 * vorhandenes `null` ist die Antwort „nachgesehen, nichts".
 *
 * Der Anlaß ist stets `'booking'` und nie `'reopen'`: Ein Stopp hebt kein
 * „Erledigt" auf. Das tut allein der Start (A-2.5).
 *
 * ---------------------------------------------------------------------------
 * Zwei Gründe für „verworfen", und sie sind nicht derselbe (O-R)
 * ---------------------------------------------------------------------------
 *
 * `decideOrphanedTimer` und `decideTimerStop` liefern beide `discarded`, aber
 * aus verschiedenen Gründen — und der Grund gehört in die Meldung an den
 * Benutzer (E-036, `TimerStopDecision` in `@takt/domain`):
 *
 *   `timer_too_short`   Die Laufzeit lag unter der Mindestdauer. Der
 *                       Doppelklick auf „Start", nicht geleistete Arbeit.
 *   `orphan_discarded`  Der Benutzer hat eine **verwaiste** Buchung
 *                       ausdrücklich verworfen. Es gab etwas zu buchen, und er
 *                       wollte es nicht.
 *
 * Bis T-101 schrieb `resolveOrphanedTimer` über den zweiten Grund
 * `timer_too_short` — die Domäne unterschied, der Dienst kürzte es wieder ein.
 * Der Benutzer las danach „die Buchung war zu kurz" über eine Buchung, die er
 * selbst verworfen hatte. `POST /timer/stop` kennt weiterhin **nur**
 * `timer_too_short`: Dort gibt es keine verwaiste Buchung zu verwerfen.
 */
type StopOutcome<Reason extends 'timer_too_short' | 'orphan_discarded'> =
  | {
      readonly kind: 'recorded';
      readonly entry: TimeEntry;
      /** Wie diese Buchung das Todo durch die Pools bewegt — oder `null`. */
      readonly poolMovement: PoolMovement | null;
    }
  | {
      readonly kind: 'discarded';
      /** Siehe den Absatz „Zwei Gründe für „verworfen"" oben (O-R, E-036). */
      readonly reason: Reason;
      /** Immer `null`: Ohne Buchung bewegt sich nichts. */
      readonly poolMovement: null;
    };

/**
 * `POST /timer/stop` — ein Grund für „verworfen", und es ist nicht der des
 * verwaisten Timers.
 */
export type StopTimerResult = StopOutcome<'timer_too_short'>;

/**
 * `POST /timer/orphaned/resolve` — **beide** Gründe (O-R).
 *
 * Ein eigener Typ und nicht eine Erweiterung von {@link StopTimerResult}: Die
 * Antwort von `POST /timer/stop` kann `orphan_discarded` nicht enthalten, und
 * ein gemeinsamer Typ zwänge jede Aufrufstelle dort zu einer
 * Fallunterscheidung, die es nicht gibt. Die Gestalt teilen sie über
 * `StopOutcome`; unterschiedlich ist allein die Gründeliste.
 */
export type ResolveOrphanedTimerResult = StopOutcome<'timer_too_short' | 'orphan_discarded'>;



/**
 * Timer stoppen (A-6.2, A-6.4, A-7.3, E-036).
 *
 * Die Leistung wird beim Stoppen erfasst und in derselben Anweisung
 * geschrieben wie das Ende. Bleibt sie leer, entsteht trotzdem eine Buchung —
 * sie ist nur nicht exportierbar (E-034), und die Exportvorschau sagt das mit
 * Grund und bietet an, den Text nachzutragen.
 *
 * **Das Ende ist nicht in jedem Fall „jetzt".** Wurde der laufende Eintrag beim
 * Start des Dienstes **vorgefunden** — Absturz, Abmeldung, eingespielte
 * Datensicherung —, wird höchstens bis zum letzten Lebenszeichen gebucht, also
 * dieselbe Dauer, die {@link loadOrphanedTimer} als `bookableSeconds` anzeigt.
 * Bis T-363 war das die Wanduhr und damit eine zweite Zahl für denselben
 * Eintrag: gemessen **39 600 s** gegen die **1 200 s** des Dialogs. Die
 * Begründung steht an {@link bookingEndOf}.
 */
export async function stopTimer(
  context: AppContext,
  note: string,
): Promise<UseCaseResult<StopTimerResult>> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const idle = await unit.idle.pending();
    if (idle !== null && idle.returnedAt === null) return err(taktError('conflict', 'Bestätigen Sie zuerst Ihre Rückkehr. Der Timer läuft weiter.'));

    /*
     * Der Bestand **vor** dem Stopp (E-058 Punkt 6).
     *
     * Erst hier steht fest, auf welchem Todo der Timer sitzt; danach ist die
     * Frage „gab es schon eine abgeschlossene Buchung?" nicht mehr zu stellen,
     * weil es ab dem Stopp immer eine gibt.
     *
     * Läuft kein Timer, wird nichts gelesen und nichts geraten — den Fehler
     * bildet `timer.stop` gleich darunter, an genau einer Stelle.
     */
    const running = await unit.timer.running();
    // Todo und Buchungslage in **einem** Wert: Getrennt gehalten müßte die
    // Aufrufstelle unten zweimal auf `null` prüfen, und `tsc` könnte den
    // Zusammenhang zwischen beiden Prüfungen nicht sehen.
    const booked =
      running === null
        ? null
        : { todoId: running.todoId, presence: await presenceBeforeBooking(unit, running.todoId) };

    /*
     * Bis wohin gebucht wird — und das ist seit T-363 nicht mehr immer „jetzt"
     * (R-34, E-036). Läuft der Timer dieses Laufs, ist es die Wanduhr; wurde
     * der Eintrag beim Start **vorgefunden**, höchstens das letzte
     * Lebenszeichen. Die Begründung steht an {@link bookingEndOf}, die
     * Regel in der Domäne.
     *
     * `timer.stop` bekommt den Wert wie jeder andere Zeitpunkt auch: Es gibt
     * weiterhin genau einen Weg, auf dem eine Buchung entsteht, und genau eine
     * Stelle, die über die Mindestdauer urteilt.
     *
     * **Der Aufruf steht ausgeschrieben und nicht hinter einem Namen** (T-371).
     * Eine Zwischenvariable läse sich schöner, rückte die Frage aber wieder
     * von der Schreibstelle weg — und genau das war die Bauart, die in
     * `idle.ts` zwei Türen offen ließ. `proof:layers` Abschnitt 7 mißt die
     * Schreibstelle, nicht die Umgebung; was hier steht, muß dort sichtbar
     * sein.
     */
    const result = await unit.timer.stop(note, running === null ? timestamp : await bookingEndOf(context, unit, running, timestamp));
    if (!result.ok) return err(result.error);
    if (result.value.kind === 'discarded') {
      return ok({
        kind: 'discarded' as const,
        reason: 'timer_too_short' as const,
        poolMovement: null,
      });
    }
    return ok({
      kind: 'recorded' as const,
      entry: result.value.entry,
      poolMovement:
        booked === null ? null : await movementOfBooking(unit, booked.todoId, booked.presence),
    });
  });
}

/**
 * Lebenszeichen (E-036).
 *
 * Der einzige Schreibvorgang, der im Minutentakt läuft. Er fasst die Zeile mit
 * den Abrechnungsdaten nicht an. Läuft kein Timer, ist das kein Fehler,
 * sondern die Antwort „nichts zu tun": Die Oberfläche schickt weiter, bis sie
 * selbst merkt, dass der Timer aus ist.
 *
 * ---------------------------------------------------------------------------
 * Ein vorgefundener Eintrag bekommt **kein** neues Lebenszeichen (T-363)
 * ---------------------------------------------------------------------------
 *
 * Das Lebenszeichen ist der Beleg, daß ein **lebender** Lauf diese Buchung
 * mitgeschrieben hat. Genau darauf stützt sich die Frage aus E-036: „bis zum
 * letzten Lebenszeichen buchen" heißt „bis dahin, wo der abgestürzte Lauf
 * zuletzt zu sehen war". Wird der Wert danach weitergeschrieben, wandert die
 * Grenze mit der Wanduhr, und aus dem Angebot des Dialogs wird stillschweigend
 * „bis jetzt" — das, was E-036 ausdrücklich ausschließt.
 *
 * Gemessen (T-363, ohne HTTP, Uhr elf Stunden weiter): `bookableSeconds` des
 * vorgefundenen Eintrags springt durch **ein einziges** `POST /timer/heartbeat`
 * von **1 200** auf **39 600**, und ein Stopp bucht danach wieder die vollen
 * elf Stunden. Die Oberfläche schickt dieses Lebenszeichen von selbst: Sie
 * startet ihren Minutentakt, sobald `GET /timer` einen laufenden Timer meldet,
 * und das tut es für den vorgefundenen Eintrag ebenso wie für jeden anderen.
 * Der Deckel aus E-036 („der Schaden ist auf ein Schreibintervall begrenzt")
 * hielt damit nur, solange niemand die Oberfläche öffnete.
 *
 * Die Gegenrichtung ist bedacht und sie ist die billigere: Wer nach einem
 * Neustart **weitergearbeitet** hat, ohne den Dialog zu beantworten, bucht
 * beim Stopp nur bis zum Absturz und muß die Buchung von Hand verlängern. Der
 * Fehler geht damit zu Lasten der eigenen Zeit, nicht zu Lasten der Rechnung
 * des Kunden — und es gibt für die Zeit danach ohnehin keinen Beleg.
 *
 * Der Rückgabewert `null` sagt hier dasselbe wie bei „kein Timer": geschrieben
 * wurde nichts. Die Oberfläche wertet ihn nicht aus.
 */
export async function touchHeartbeat(context: AppContext): Promise<UseCaseResult<Timestamp | null>> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const running = await unit.timer.running();
    if (running === null) return ok(null);
    if (foundAtServiceStart(context, running.id)) return ok(null);
    await unit.heartbeat.touch(running.id, timestamp);
    return ok(timestamp);
  });
}

export interface OrphanedTimerView {
  readonly running: RunningTimeEntry;
  readonly todoTitle: string;
  readonly heartbeatAt: Timestamp | null;
  /** Was gebucht würde, wenn der Benutzer „bis zum Lebenszeichen" wählt. */
  readonly bookableSeconds: number;
}

/**
 * Die beim Start vorgefundene, unvollständige Buchung (E-036).
 *
 * Sie bleibt ohne Ende, bis der Benutzer geantwortet hat, und geht in keinen
 * Export — `v_export_candidate` führt ausschließlich abgeschlossene Buchungen.
 * Das ist der Grund, warum die Frage warten darf, ohne dass jemand zu viel
 * abrechnet.
 */
export async function loadOrphanedTimer(context: AppContext): Promise<OrphanedTimerView | null> {
  // Die Wanduhr geht mit in die Domäne: Der Dialog nennt seit T-371 dieselbe
  // Zahl wie der Stopp, auch wenn das mitgereiste Lebenszeichen aus der
  // Zukunft kommt. Zwei Zahlen für denselben Eintrag sind der Fehler, gegen
  // den T-363 gebaut wurde — ein Deckel, den nur eine der beiden Seiten kennt,
  // stellte ihn wieder her.
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const orphan = await unit.heartbeat.orphaned();
    if (orphan === null || !foundAtServiceStart(context, orphan.running.id)) return null;
    const idle = await unit.idle.pending();
    if (idle !== null && idle.returnedAt === null && idle.id === orphan.running.id) return null;


    const todo = await unit.todos.load(orphan.running.todoId);
    const decision = decideOrphanedTimer({
      running: orphan.running,
      heartbeatAt: orphan.heartbeatAt,
      resolution: 'book_until_heartbeat',
      now: timestamp,
    });

    return {
      running: orphan.running,
      todoTitle: todo?.title ?? '',
      heartbeatAt: orphan.heartbeatAt,
      bookableSeconds: decision.kind === 'recorded' ? decision.entry.durationSeconds : 0,
    };
  });
}

export type OrphanResolution = 'book_until_heartbeat' | 'discard';

/**
 * Die Antwort des Benutzers auf die verwaiste Buchung (E-036).
 *
 * Gebucht wird **höchstens bis zum letzten Lebenszeichen**, nie bis „jetzt".
 * Ein über Nacht vergessener Timer buchte sonst vierzehn Stunden, und nach der
 * Aufrundung aus E-008 landet das in einer Rechnung. Fehlt das Lebenszeichen
 * ganz, ist die Dauer 0 und die Buchung fällt als zu kurz heraus — es gibt
 * nichts zu buchen, was jemand bezeugen könnte.
 */
export async function resolveOrphanedTimer(
  context: AppContext,
  resolution: OrphanResolution,
): Promise<UseCaseResult<ResolveOrphanedTimerResult>> {
  const timestamp = now(context);

  return context.transactions.inTransaction(async (unit) => {
    const idle = await unit.idle.pending();
    if (idle !== null && idle.returnedAt === null) return err(taktError('conflict', 'Die Rückkehr aus der inaktiven Zeit muss zuerst bestätigt werden.'));

    const orphan = await unit.heartbeat.orphaned();
    if (orphan === null || !foundAtServiceStart(context, orphan.running.id)) {
      return err(taktError('timer_not_running', 'Es gibt keine unvollständige Buchung.'));
    }

    // `timestamp` als Deckel nach oben (T-371): Seit E-036 konnte diese Route
    // ein Lebenszeichen aus der Zukunft ungeprüft in ein `ended_at` schreiben —
    // gemessen 251 613 021 599 s aus einem Archiv mit `9999-12-31`. Der Deckel
    // liegt in `decideOrphanedTimer`; hier steht nur, wer die Uhr liest.
    const decision = decideOrphanedTimer({
      running: orphan.running,
      heartbeatAt: orphan.heartbeatAt,
      resolution,
      now: timestamp,
    });

    if (decision.kind === 'discarded') {
      const removed = await unit.timer.stop('', orphan.running.startedAt);
      if (!removed.ok) return err(removed.error);
      // **Verwerfen bewegt nichts** (E-058 Punkt 6). Die Buchung entsteht gar
      // nicht, `hasOpenEntries` bleibt, was es war — und deshalb wird hier auch
      // nichts gelesen und keine Regel aufgelöst.
      //
      // Der Grund kommt aus der **Domäne** und wird nicht hier gesetzt (O-R):
      // `decideOrphanedTimer` unterscheidet `orphan_discarded` von
      // `timer_too_short`, und bis T-101 schrieb diese Stelle den Unterschied
      // wieder weg. Beide Ausgänge sind erreichbar — `discard` gibt
      // `orphan_discarded`, `book_until_heartbeat` ohne Lebenszeichen gibt
      // `timer_too_short` —, und der Benutzer bekommt den Satz zu seinem
      // eigenen Fall.
      return ok({
        kind: 'discarded' as const,
        reason: decision.reason,
        poolMovement: null,
      });
    }

    // Der Bestand vor dem Buchen, aus demselben Grund wie in `stopTimer`.
    const presence = await presenceBeforeBooking(unit, orphan.running.todoId);

    // `timer.stop` mit dem Zeitpunkt des Lebenszeichens statt mit „jetzt".
    // Damit läuft der Stopp durch dieselbe Regel wie jeder andere, und es gibt
    // keinen zweiten Weg, auf dem eine Buchung entstehen kann.
    const stopped = await unit.timer.stop(orphan.running.note, decision.entry.endedAt);
    if (!stopped.ok) return err(stopped.error);
    if (stopped.value.kind === 'discarded') {
      // Hier ist `timer_too_short` der **richtige** Grund und keine Kürzung:
      // Der Benutzer wollte buchen, und die Zeit bis zum Lebenszeichen lag
      // unter der Mindestdauer. Es gibt nichts zu buchen, was jemand bezeugen
      // könnte (E-036).
      return ok({
        kind: 'discarded' as const,
        reason: 'timer_too_short' as const,
        poolMovement: null,
      });
    }
    return ok({
      kind: 'recorded' as const,
      entry: stopped.value.entry,
      poolMovement: await movementOfBooking(unit, orphan.running.todoId, presence),
    });
  });
}
