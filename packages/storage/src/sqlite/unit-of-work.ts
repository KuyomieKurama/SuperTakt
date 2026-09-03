/**
 * Takt — die Transaktionsklammer (A-6.2, A-8.8).
 *
 * ---------------------------------------------------------------------------
 * Warum die Transaktionen gereiht werden, und warum das nicht optional ist
 * ---------------------------------------------------------------------------
 *
 * `node:sqlite` ist synchron, die Ports sind es nicht (siehe `database.ts`).
 * Ein Anwendungsfall darf also innerhalb einer offenen Transaktion `await`
 * sagen — und der Exportlauf **muss** es sogar, weil er die Datei schreibt,
 * bevor er markiert (architektur.md 3.2). An jedem `await` kann die
 * Ereignisschleife eine zweite Anfrage bedienen. Ohne Reihung liefe deren
 * `BEGIN` in dieselbe offene Transaktion hinein: Ihre Schreibvorgänge lägen in
 * fremder Klammer, und ein `ROLLBACK` des Exports nähme sie mit.
 *
 * Deshalb hält dieser Port eine Warteschlange. Zwei Transaktionen laufen nie
 * gleichzeitig; die zweite beginnt, wenn die erste festgeschrieben oder
 * zurückgenommen ist. Für einen Einbenutzerdienst auf einer Loopback-Adresse
 * ist das kein Engpass — der teuerste Vorgang ist der Exportlauf, und der
 * findet einmal am Tag statt.
 *
 * `BEGIN IMMEDIATE` statt `BEGIN`: Die Schreibsperre wird sofort genommen und
 * nicht erst beim ersten Schreibvorgang. Eine Transaktion, die zunächst liest
 * und dann schreibt — genau der Exportlauf — könnte sonst mitten im Vorgang an
 * `SQLITE_BUSY` scheitern, nachdem die Datei bereits geschrieben ist.
 *
 * ---------------------------------------------------------------------------
 * Verschachtelte Aufrufe sind unzulässig
 * ---------------------------------------------------------------------------
 *
 * SQLite kennt Sicherungspunkte, aber ein Anwendungsfall, der eine bestehende
 * Transaktion nur teilweise zurücknimmt, ist bei einer Abrechnung nicht
 * wünschenswert: „Datei geschrieben, aber nur die Hälfte markiert" ist genau
 * der Zustand, den A-8.8 ausschließt. Ein verschachtelter Aufruf ist deshalb
 * ein Programmierfehler und wirft.
 *
 * Der Wächter dafür muss **vor** der Warteschlange stehen, nicht dahinter
 * (T-029, Befund aus T-027). Ein Zähler innerhalb des Laufs war unerreichbar:
 * Der verschachtelte Aufruf kam gar nicht bis dorthin, weil er zuerst auf
 * `queue` wartete — und `queue` wird erst frei, wenn die äußere Transaktion
 * endet, die ihrerseits auf das Ergebnis der inneren wartet. Das Ergebnis war
 * kein Wurf, sondern ein Ring ohne Ende: eine Anfrage, die nie antwortet.
 * Für einen Benutzer sieht das aus wie ein hängender Speichervorgang, und er
 * bricht die Anwendung mitten im Vorgang ab — genau der Zustand, den A-8.8
 * ausschließen soll.
 *
 * Erkannt wird die Verschachtelung über den asynchronen Aufrufzusammenhang
 * (`AsyncLocalStorage`). Das ist nicht Zierrat: Ein bloßes „läuft gerade eine
 * Transaktion?" würde auch die **zweite, unabhängige** Anfrage abweisen, die
 * zulässig ist und nur warten soll. Unterschieden werden muss „von *innerhalb*
 * der laufenden Transaktion aufgerufen" von „gleichzeitig, aber von außen" —
 * und genau diese Auskunft gibt der Aufrufzusammenhang.
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
import { createTodoNotePort, createTodoPort, type PoolResolver } from './repo-todos.ts';
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
    notes: createTodoNotePort(conn),
    tags: createTagPort(conn, ids),
    folders: createTagFolderPort(conn, ids),
    pools: createPoolPort(conn, ids, searchTodos),
    statuses: createTodoStatusPort(conn, ids),
    timeEntries: createTimeEntryPort(conn, ids, options.timeZone),
    timer: createTimerPort(conn, ids),
    heartbeat: createTimerHeartbeatPort(conn),
    exportRead: createExportReadPort(conn, options.timeZone),
    export: createExportPort(conn, ids),
    templates: createExportTemplatePort(conn, ids),
    settings: createAppSettingsPort(conn),
    defaultTags: createDefaultTagPort(conn),
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
 * `usecases/export.ts` im Dienst).
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
