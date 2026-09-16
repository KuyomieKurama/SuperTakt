import { createTodoPriorityPort } from "./repo-priorities.ts";
import { createMailPort } from './repo-mail.ts';
/**
 * Transaktionen serialisieren, da `await` sonst fremde Anfragen in dieselbe SQLite-Transaktion
 * lassen könnte. `BEGIN IMMEDIATE` nimmt die Schreibsperre vor dem Dateiexport.
 * Verschachtelte Aufrufe vor dem Einreihen erkennen, sonst entsteht ein Deadlock.
 * `AsyncLocalStorage` unterscheidet sie von unabhängigen wartenden Anfragen.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

import type { TransactionPort, UnitOfWork } from '../ports.ts';
import { tagAxisIsUnresolved, type TodoFilter } from '@takt/domain';

import type { SqlConnection } from './database.ts';
import { createIdSource, type IdSource } from './ids.ts';
import { createExportPort, createExportReadPort } from './repo-export.ts';
import { createAppSettingsPort, createDefaultTagPort, createExportTemplatePort } from './repo-settings.ts';
import { createTodoStatusPort } from './repo-statuses.ts';
import { createPoolPort, createTagFolderPort, createTagPort, poolAxes, poolMatchMode, resolvePoolAxis } from './repo-tags.ts';
import { createTimeEntryPort, createTimerHeartbeatPort, createTimerPort } from './repo-time.ts';
import { createIdleTimerPort } from './repo-idle.ts';
import { createAttachmentPort } from './repo-attachments.ts';
import { createTodoNotePort, createTodoPort, type PoolResolver } from './repo-todos.ts';
import { createDataArchivePort } from './repo-data-archive.ts';
import type { Page, Pagination } from '../ports.ts';
import type { Todo } from '@takt/domain';

export interface UnitOptions {
  readonly ids?: IdSource;
  /**
   * Zeitzone für die Tagesgruppierung des Exports (E-025).
   *
   * Ohne Angabe die des Rechners. Sie ist überschreibbar, damit ein Prüfpfad
   * den Fall „Buchung um 23:50" ohne verstellte Umgebung fahren kann.
   */
  readonly timeZone?: string;
}

/**
 * Baut alle Ports auf **einer** Verbindung zusammen.
 *
 * Die Ports teilen sich die Verbindung und damit die offene Transaktion. Das
 * ist der Zweck des Bündels: Wer `unit.todos` und `unit.timeEntries` in
 * derselben Arbeitseinheit benutzt, schreibt in dieselbe Klammer.
 */
export function createUnitOfWork(conn: SqlConnection, options: UnitOptions = {}): UnitOfWork {
  const ids = options.ids ?? createIdSource();

  // `TodoPort` braucht die aufgelösten Pool-Regeln für seinen Filter, und
  // `PoolPort` braucht `TodoPort.search` für seine Mitglieder. Statt die
  // beiden Ports einander in die Hand zu geben — womit jeder den ganzen
  // anderen sähe — wird genau die eine gebrauchte Fähigkeit gereicht.
  const resolvePools: PoolResolver = (poolIds) =>
    poolIds.map((poolId) => {
      const axes = poolAxes(conn, poolId);
      // Beide Taglisten samt der Zahl ihrer Terme (E-057). Die Zahl ist der
      // Unterschied zwischen „diese Regel sagt über Tags nichts" und „sie nennt
      // einen Ordner, in dem kein Tag liegt"; nach dem Auflösen steht in beiden
      // Fällen dieselbe leere Menge da, und die Abfrage träfe im zweiten Fall
      // ohne diese Auskunft zu viel.
      const required = resolvePoolAxis(conn, poolId);
      const excluded = resolvePoolAxis(conn, poolId, 'excluded');
      return {
        tagIds: required.tagIds,
        excludedTagIds: excluded.tagIds,
        // Beurteilt wird in der Domäne, nicht hier. Diese Datei reicht die
        // beiden Zahlen weiter, die nur sie hat.
        unresolvedRequired: tagAxisIsUnresolved({
          named: required.named,
          resolved: required.tagIds.length,
          // Termweise (E-057): Ein leerer Ordner **neben** einem Tagterm
          // verschwindet in der Summe darüber, nicht aber hier.
          emptyTerms: required.emptyFolderIds.length,
        }),
        matchMode: poolMatchMode(conn, poolId),
        statusIds: axes.statusIds,
        completion: axes.completion,
        exportState: axes.exportState,
      };
    });

  const todos = createTodoPort(conn, ids, resolvePools);
  const searchTodos = (filter: TodoFilter, pagination?: Pagination): Promise<Page<Todo>> =>
    todos.search(filter, pagination);

  return {
    todos,
    mails: createMailPort(conn),
    notes: createTodoNotePort(conn),
    /*
     * Anhänge (A-19.8). Ein eigener Port neben `notes` und aus demselben
     * Grund: Kein Wert vom Typ `Todo` trägt sie, wer sie will, benennt ihn —
     * und der Exportmotor bekommt überhaupt keine Ports (A-19.17, R-06).
     */
    attachments: createAttachmentPort(conn, ids),
    tags: createTagPort(conn, ids),
    folders: createTagFolderPort(conn, ids),
    pools: createPoolPort(conn, ids, searchTodos),
    statuses: createTodoStatusPort(conn, ids),
    priorities: createTodoPriorityPort(conn, ids),
    timeEntries: createTimeEntryPort(conn, ids, options.timeZone),
    timer: createTimerPort(conn, ids),
    idle: createIdleTimerPort(conn),
    heartbeat: createTimerHeartbeatPort(conn),
    exportRead: createExportReadPort(conn, options.timeZone),
    export: createExportPort(conn, ids),
    templates: createExportTemplatePort(conn, ids),
    settings: createAppSettingsPort(conn),
    defaultTags: createDefaultTagPort(conn),
    dataArchive: createDataArchivePort(conn),
  };
}

/**
 * Kennzeichen einer laufenden Transaktion im asynchronen Aufrufzusammenhang.
 *
 * `open` ist wahr, solange die Klammer offen ist. Siehe `run()`.
 */
interface TransactionScope {
  open: boolean;
}

/**
 * Die Klammer selbst.
 *
 * Wirft die übergebene Funktion, wird zurückgenommen und der Wurf
 * weitergereicht. Ein fachlicher Fehlschlag ist **kein** Wurf, sondern ein
 * `Result` — er rollt also nicht von selbst zurück. Wer eine Transaktion wegen
 * eines fachlichen Fehlschlags verwerfen will, wirft ausdrücklich; sonst gilt,
 * was bis dahin geschrieben wurde. Der Exportlauf macht genau das (siehe
 * `features/export/export.ts` im Dienst).
 */
export function createTransactionPort(conn: SqlConnection, options: UnitOptions = {}): TransactionPort {
  const unit = createUnitOfWork(conn, options);

  /** Die Warteschlange. Siehe den Kopf dieser Datei. */
  let queue: Promise<unknown> = Promise.resolve();

  /**
   * Der Aufrufzusammenhang der gerade laufenden Transaktion **dieser** Klammer.
   *
   * Je Klammer eine eigene Ablage, nicht eine für das ganze Erzeugnis: Zwei
   * Klammern sind zwei Verbindungen und damit zwei Transaktionen, die einander
   * nichts angehen. Ein Wächter über alle Verbindungen hinweg würde einen
   * zulässigen Fall abweisen.
   */
  const openScope = new AsyncLocalStorage<TransactionScope>();

  const run = async <T>(work: (unit: UnitOfWork) => Promise<T>): Promise<T> => {
    // Das Kennzeichen wird beim Ende auf `false` gesetzt statt weggeworfen:
    // Eine Fortsetzung, die *innerhalb* der Transaktion geplant, aber erst
    // *nach* ihr ausgeführt wird — ein Zeitgeber etwa — erbt den Zusammenhang,
    // eröffnet aber keine Verschachtelung. Sie darf sich einreihen.
    const scope: TransactionScope = { open: true };

    conn.exec('BEGIN IMMEDIATE;');
    try {
      const value = await openScope.run(scope, () => work(unit));
      conn.exec('COMMIT;');
      return value;
    } catch (error) {
      // Ein Fehlschlag beim Zurücknehmen darf den ursprünglichen Grund nicht
      // verdecken. Er wird verschluckt, der eigentliche Wurf geht weiter.
      try {
        conn.exec('ROLLBACK;');
      } catch {
        /* Die Transaktion war bereits beendet. */
      }
      throw error;
    } finally {
      scope.open = false;
    }
  };

  return {
    inTransaction<T>(work: (unit: UnitOfWork) => Promise<T>): Promise<T> {
      // Vor der Warteschlange, nicht dahinter: Wer sich hier einreiht, obwohl
      // er selbst aus einer offenen Transaktion heraus fragt, wartet auf sich
      // selbst. Deshalb ist dies der einzige Zweig, der die Reihung überspringt.
      //
      // Der Fehlschlag ist eine abgelehnte Zusage, kein Wurf aus einer
      // Funktion, die `Promise` verspricht — sonst müsste jeder Aufrufer
      // dieselbe Störung an zwei Stellen behandeln.
      if (openScope.getStore()?.open === true) {
        return Promise.reject(
          new Error(
            'Verschachtelte Transaktionen sind unzulässig. Eine Transaktion, die nur teilweise zurückgenommen wird, ist bei einer Abrechnung nicht wünschenswert (A-8.8).',
          ),
        );
      }

      /*
       * **`next` und nicht `queue` — und daran hängt Geld** (T-369, T-370,
       * T-371, R-34).
       *
       * Der Rückgabewert dieser Funktion ist `next`, die Zusage der eigenen
       * Transaktion. `queue` ist eine **Ableitung** davon und wird eine
       * Mikroaufgabe **später** erfüllt. Aus dieser Reihenfolge folgt eine
       * Zusage, die bisher nirgends aufgeschrieben war:
       *
       *   Der Code **hinter dem `await`** des Aufrufers läuft garantiert
       *   **vor** der nächsten hier eingereihten Transaktion.
       *
       * `importDataArchive` (A-20) verläßt sich darauf. Es schreibt das Archiv
       * und liest den laufenden Eintrag in **einer** Klammer, weist aber
       * `context.timerRecovery.entryId` erst hinter dem `await` zu — bewußt,
       * weil ein Fehlschlag beim `COMMIT` die Aufnahme sonst auf einen
       * Eintrag zeigen ließe, den es nicht gibt. Daß trotzdem kein nebenher
       * fragender Leser zwischen `COMMIT` und Zuweisung gerät, leistet
       * ausschließlich diese Zeile. Gemessen (T-358, in T-369 und T-370
       * unabhängig nachgefahren): 17 von 17 nebenläufigen Lesern sahen den
       * Eintrag als verwaist; mit zwei Klammern sah einer einen laufenden
       * Timer über elf Stunden.
       *
       * **Wer hier `return queue` schriebe, öffnete R-34 wieder, und nichts
       * würde rot.** Ein Prüffall dafür fehlt bis heute; er gehört dem
       * unit-tester (T-358 Abschnitt 8 Fall E, erweitert um einen nebenher
       * gereihten Leser). Bis er steht, ist dieser Absatz die einzige Wache.
       */
      const next = queue.then(() => run(work));

      // Die Kette darf nicht an einem Fehlschlag reißen: Der nächste Aufrufer
      // wartet auf das *Ende* des vorigen, nicht auf dessen Erfolg. Genau das
      // leisten diese beiden Zweige — `queue` ist danach eine Zusage, die
      // **immer** erfüllt wird, nie eine abgelehnte. Ein zweiter Rückfallzweig
      // oben wäre deshalb unerreichbar (T-029): Er sähe aus wie eine Sicherung,
      // liefe aber nie, und niemand könnte prüfen, ob er noch stimmt. Die
      // Sicherung ist der Prüfpfad „eine Transaktion, die wirft, gibt die
      // Warteschlange trotzdem frei" — er wird rot, sobald diese Zeilen fallen.
      queue = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    },
  };
}
