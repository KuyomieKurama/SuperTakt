/**
 * Takt — Ausgehende Ports (Hexagonale Architektur).
 *
 * Diese Datei beschreibt, was die Anwendungsfälle von der Speicherung brauchen,
 * in der Sprache der Domäne. Kein SQL, kein Dateipfad, kein Treibertyp.
 *
 * Der SQLite-Adapter setzt diese Schnittstellen um. Ein anderer Adapter — etwa
 * gegen einen Dienst, falls das „zumindest derzeit" aus E-001 später fällt —
 * ersetzt ihn, ohne dass die Domäne oder ein Anwendungsfall sich ändert.
 *
 * T-001 liefert nur Typen. Der Adapter entsteht in T-009. Bezeichner sind
 * englisch und an den Tabellennamen ausgerichtet (E-015, R-16), Kommentare
 * bleiben deutsch.
 */

import type {
  AppSettings,
  AppSettingsUpdate,
  CalendarDay,
  DefaultTag,
  ExportAuditEntry,
  ExportCandidate,
  ExportDirectoryCheck,
  ExportDirectoryTrait,
  ExportGroup,
  ExportRun,
  ExportRunId,
  ExportStatus,
  ExportStatusResetRequest,
  ExportTemplateEnvelope,
  ExportTemplateId,
  NotBilledRequest,
  Pool,
  PoolId,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolPlacement,
  PoolTagTerm,
  PoolSurface,
  QuarterHours,
  Result,
  RoundingMode,
  RunningTimeEntry,
  Seconds,
  StatusId,
  Tag,
  TagFolder,
  TagFolderId,
  TagId,
  TagTree,
  TaktError,
  TimeEntry,
  TimeEntryId,
  Timestamp,
  Todo,
  TodoCreate,
  TodoFilter,
  TodoId,
  TodoNote,
  TodoStatus,
  TodoUpdate,
} from '@takt/domain';

// ---------------------------------------------------------------------------
// Querschnitt
// ---------------------------------------------------------------------------

/** Seitenweises Abrufen. Fortsetzungsmarke statt Seitenzahl, siehe architektur.md. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly total: number;
}

export interface Pagination {
  readonly cursor?: string;
  readonly limit?: number;
}

/**
 * Klammer um mehrere Schreibvorgänge.
 *
 * Trägt A-8.8 und den atomaren Timerstopp aus A-6.2. Der Adapter setzt sie auf
 * eine SQLite-Transaktion ab; die Anwendungsfälle sehen nur diesen Port. Wirft
 * die übergebene Funktion, wird nichts geschrieben.
 *
 * Verschachtelte Aufrufe sind unzulässig. SQLite kennt zwar Sicherungspunkte,
 * aber ein Anwendungsfall, der eine bestehende Transaktion nur teilweise
 * zurücknimmt, ist bei einer Abrechnung nicht wünschenswert.
 *
 * „Unzulässig" heißt: Der Aufruf aus einer laufenden Transaktion heraus liefert
 * eine **abgelehnte** Zusage, sofort und ohne die Klammer zu öffnen. Das ist
 * ein Programmierfehler, kein fachlicher Fehlschlag — er kommt deshalb als Wurf
 * und nicht als `Result` (T-029). Zwei Aufrufe **nebeneinander** sind dagegen
 * zulässig; sie werden gereiht, nicht abgewiesen.
 */
export interface TransactionPort {
  inTransaction<T>(work: (unit: UnitOfWork) => Promise<T>): Promise<T>;
}

/** Bündel aller Ports innerhalb einer Transaktion. */
export interface UnitOfWork {
  readonly todos: TodoPort;
  readonly notes: TodoNotePort;
  readonly tags: TagPort;
  readonly folders: TagFolderPort;
  readonly pools: PoolPort;
  readonly statuses: TodoStatusPort;
  readonly timeEntries: TimeEntryPort;
  readonly timer: TimerPort;
  readonly heartbeat: TimerHeartbeatPort;
  /** Leseseite des Exports. Getrennt von `export`, damit eine Vorschau nichts schreiben kann. */
  readonly exportRead: ExportReadPort;
  readonly export: ExportPort;
  readonly templates: ExportTemplatePort;
  readonly settings: AppSettingsPort;
  readonly defaultTags: DefaultTagPort;
}

// ---------------------------------------------------------------------------
// Todos
// ---------------------------------------------------------------------------

export interface TodoPort {
  load(id: TodoId): Promise<Todo | null>;
  loadMany(ids: readonly TodoId[]): Promise<readonly Todo[]>;
  search(filter: TodoFilter, pagination?: Pagination): Promise<Page<Todo>>;
  /** A-10.9: Duplikaterkennung im Add-in. Trifft den Teilindex auf call_number. */
  findByCallNumber(callNumber: string): Promise<readonly Todo[]>;
  /**
   * Legt ein Todo an (A-2.1, A-9.5).
   *
   * `tagIds` steht zweimal, und das ist eine Aussage und kein Versehen:
   *
   *  - `input.tagIds` sind die **ausdrücklich gewählten** Tags, so wie
   *    `TodoCreate` in todo.ts es beschreibt.
   *  - Das zweite Argument ist die **wirksame** Liste — die gewählten
   *    zuzüglich der Standard-Tags aus `applyDefaultTags`.
   *
   * **Der Adapter schreibt das zweite Argument.** `input.tagIds` liest er
   * nicht. Damit greift A-9.5 unabhängig davon, ob der Aufrufer die Ergänzung
   * vorgenommen hat, und ein Aufrufer, der beide gleich übergibt, bekommt
   * dasselbe Ergebnis. (Antwort auf offene Frage 4 aus T-019.)
   */
  create(input: TodoCreate, tagIds: readonly TagId[]): Promise<Todo>;
  update(id: TodoId, input: TodoUpdate): Promise<Result<Todo, TaktError>>;
  remove(id: TodoId): Promise<Result<void, TaktError<'time_entry_locked' | 'not_found'>>>;

  /** A-2.4 */
  markDone(id: TodoId, now: Timestamp): Promise<Result<Todo, TaktError>>;
  /**
   * A-2.5. Hebt „Erledigt" auf, indem `completed_at` auf `null` gesetzt wird.
   *
   * Die Kanban-Spalte bleibt unangetastet: Erledigt und Spalte sind zwei
   * getrennte Achsen, das Erledigen hat nie verschoben, also gibt es nichts
   * zurückzusetzen. Wird ausschließlich innerhalb derselben Transaktion wie der
   * Timerstart aufgerufen, damit kein Zustand entsteht, in dem das Todo aktiv
   * ist, aber kein Timer läuft.
   */
  clearDone(id: TodoId, now: Timestamp): Promise<Result<Todo, TaktError>>;

  /** Summe aller Buchungen je Todo. Berechnet, nie gespeichert. */
  sumSeconds(ids: readonly TodoId[]): Promise<ReadonlyMap<TodoId, number>>;
}

/**
 * Zugriff auf den internen Vermerk eines Todos (A-7.1, A-7.2). Tabelle
 * `todo_note`; auf dem Bildschirm heißt das Feld „Vermerk" (E-016).
 *
 * Bewusst ein eigener Port und nicht eine Methode auf `TodoPort`. Der
 * Exportlauf bekommt `UnitOfWork.notes` nicht in die Hand: der Vorlagen-Motor
 * in `packages/export` bekommt überhaupt keine Ports, sondern fertige
 * `ExportGroup`-Werte. Wer den Vermerk laden will, muss diesen Port
 * ausdrücklich benennen, und das ist im Quelltext auffindbar (R-06).
 */
export interface TodoNotePort {
  load(todoId: TodoId): Promise<TodoNote | null>;
  write(todoId: TodoId, text: string, now: Timestamp): Promise<TodoNote>;
}

// ---------------------------------------------------------------------------
// Tags und Ordner
// ---------------------------------------------------------------------------

export interface TagPort {
  load(id: TagId): Promise<Tag | null>;
  listInFolder(folderId: TagFolderId | null): Promise<readonly Tag[]>;

  /**
   * Alle Tags mit diesem Vergleichsschlüssel, **ordnerübergreifend** (T-058).
   *
   * Eine reine Abfrage. Sie urteilt nicht: Ob kein, ein oder mehrere Treffer
   * heißen „anlegen", „verwenden" oder „nachfragen", entscheidet der
   * Anwendungsfall (`createTodo`), nicht der Adapter. Der Adapter hätte für
   * diese Entscheidung auch keinen Ort — sie ist eine Regel über Tagnamen und
   * keine über SQL.
   *
   * Der Schlüssel kommt aus `tagNameKey` in der Domäne und nirgendwo sonst her.
   * Ein Aufrufer, der hier einen rohen Namen hineinreicht, sucht nach etwas,
   * das so nicht gespeichert ist. Getroffen wird `ix_tag_name_key`; ein
   * Tabellendurchlauf entsteht dabei nicht.
   */
  findByKey(key: string): Promise<readonly Tag[]>;

  create(
    folderId: TagFolderId | null,
    name: string,
    color: string | null,
    now: Timestamp,
  ): Promise<Result<Tag, TaktError<'name_conflict' | 'validation_error'>>>;
  rename(
    id: TagId,
    name: string,
    now: Timestamp,
  ): Promise<Result<Tag, TaktError<'name_conflict' | 'not_found' | 'validation_error'>>>;
  move(id: TagId, folderId: TagFolderId | null, now: Timestamp): Promise<Result<Tag, TaktError>>;
  remove(id: TagId): Promise<Result<void, TaktError<'tag_in_use' | 'not_found'>>>;
  setOnTodo(todoId: TodoId, tagIds: readonly TagId[], now: Timestamp): Promise<void>;
}

export interface TagFolderPort {
  load(id: TagFolderId): Promise<TagFolder | null>;
  listChildren(parentId: TagFolderId | null): Promise<readonly TagFolder[]>;

  /**
   * Der vollständige Baum in einem Aufruf (A-10.4).
   *
   * Der Adapter holt Ordner und Tags mit je einer Abfrage und setzt den Baum im
   * Speicher zusammen. Kein Aufruf je Ebene, kein N+1.
   */
  loadTree(): Promise<TagTree>;

  /**
   * Vorfahren eines Ordners, vom Ordner aufwärts bis zur Wurzel.
   *
   * Grundlage der Zyklusprüfung aus A-4.6. Rekursive Abfrage über die
   * Adjazenzliste (E-022); je Ebene ein Indexzugriff auf den Primärschlüssel,
   * nie ein Volltabellenscan. Bei zehn Ebenen sind das zehn Zugriffe.
   */
  ancestors(id: TagFolderId): Promise<readonly TagFolderId[]>;

  /**
   * Alle Nachfahren eines Ordners einschließlich seiner selbst.
   *
   * Grundlage für „Tags dieses Ordners und aller Unterordner". Rekursive
   * Abfrage über `ix_tag_folder_parent`; je Ebene ein Indexzugriff.
   */
  subtree(id: TagFolderId): Promise<readonly TagFolderId[]>;

  create(
    parentId: TagFolderId | null,
    name: string,
    now: Timestamp,
  ): Promise<Result<TagFolder, TaktError<'name_conflict'>>>;
  rename(id: TagFolderId, name: string, now: Timestamp): Promise<Result<TagFolder, TaktError>>;

  /**
   * A-4.6. Der Adapter prüft die Zyklusfreiheit innerhalb derselben
   * Transaktion, in der er verschiebt. Eine Prüfung davor und ein Schreiben
   * danach wären zwei Schritte und damit angreifbar, wenn zwei Anfragen
   * gleichzeitig verschieben.
   */
  move(
    id: TagFolderId,
    newParentId: TagFolderId | null,
    now: Timestamp,
  ): Promise<Result<TagFolder, TaktError<'tag_folder_cycle' | 'name_conflict' | 'not_found'>>>;

  remove(id: TagFolderId): Promise<Result<void, TaktError<'tag_folder_not_empty' | 'not_found'>>>;
}

// ---------------------------------------------------------------------------
// Pools **und** Kanban-Spalten (A-3.4, E-054)
//
// Eine Entität, zwei Flächen. Seit E-054 ist eine Kanban-Spalte eine Regel über
// Tags wie ein Pool; `Pool.placement` sagt, wo sie erscheint. Es gibt deshalb
// keinen `BoardColumnPort` — er wäre dieser hier, noch einmal abgeschrieben.
//
// Was für Pools gilt, gilt damit unverändert für Spalten: Gespeichert wird die
// Regel, nie die Mitgliedschaft (A-3.4). Eine Karte kann in mehreren Spalten
// zugleich stehen — bei Regeln ist das unvermeidlich, und `members` liefert sie
// jeder von ihnen.
// ---------------------------------------------------------------------------

/** Eine Regel, auf Kennung und Name verkürzt. Siehe `PoolPort.listNames`. */
export interface PoolNameEntry {
  readonly id: PoolId;
  readonly name: string;
}

/**
 * Eine Tagachse einer Regel, aufgelöst (E-057).
 *
 * `emptyFolderIds` sind die **genannten** Ordner, aus denen kein Tag geworden
 * ist — in der Reihenfolge der Regel, ohne Doppelte. Sie sind der Unterschied
 * zwischen „diese Achse sagt nichts" und „diese Achse verlangt etwas, das
 * niemand hat"; beurteilt wird das in der Domäne (`tagAxisIsUnresolved`).
 *
 * Die Zahl der genannten Terme steht **nicht** darin: Wer sie braucht, hat die
 * Regel in der Hand und zählt `rule.length`. Ein Feld dafür wäre eine zweite
 * Fassung derselben Zahl.
 */
export interface ResolvedTagAxis {
  readonly tagIds: readonly TagId[];
  readonly emptyFolderIds: readonly TagFolderId[];
}

/** Beide Tagachsen einer Regel in einer Antwort. Siehe `PoolPort.resolveAxes`. */
export interface PoolAxesResolution {
  readonly required: ResolvedTagAxis;
  readonly excluded: ResolvedTagAxis;
}

export interface PoolPort {
  load(id: PoolId): Promise<Pool | null>;

  /**
   * Die Regeln einer Fläche, nach Position sortiert (E-054).
   *
   * Seit E-054 ist eine Kanban-Spalte dieselbe Entität wie ein Pool; `placement`
   * sagt, wo eine Regel erscheint. Diese Liste fragt deshalb nach der Fläche und
   * nicht nach allem:
   *
   *   `'pool'`  — was in der Pool-Liste steht (`placement` `pool` oder `both`).
   *   `'board'` — die Spalten des Kanban-Boards (`board` oder `both`).
   *   `'all'`   — jede Regel, ungeachtet der Fläche.
   *
   * **Ohne Argument gilt `'pool'`**, und das ist der Grund, warum das Argument
   * überhaupt weglassbar ist: Jeder Aufrufer, den es vor E-054 gab, meinte
   * „die Pools" — allen voran `poolNamer` in `routes/addin/service.ts`, der die
   * Pools eines Todos beim Namen nennt. Der bekommt damit weiterhin Pools und
   * nicht die Spalten eines Boards, ohne dass die Datei angefasst werden musste.
   * Das Board fragt ausdrücklich.
   */
  list(shownOn?: PoolSurface | 'all'): Promise<readonly Pool[]>;

  /**
   * Kennung und Name **jeder** Regel, ohne ihre Regelterme (T-074).
   *
   * Für die eine Frage „ist dieser Name schon vergeben?“. Sie lässt sich nicht
   * in SQL stellen: Ob zwei Namen derselbe sind, entscheidet `nameKey` in der
   * Domäne, und SQLite kennt weder Unicode-Zusammensetzung noch eine Faltung
   * über A–Z hinaus (siehe `packages/domain/src/tag-name.ts`). Der
   * Anwendungsfall muss die Namen also sehen.
   *
   * **Warum das die ganze Tabelle lesen darf, und `TagPort` nicht.** `pool`
   * hält die Regeln, die ein Mensch von Hand eingerichtet hat — eine Handvoll
   * Zeilen, in keinem denkbaren Bestand mehr als ein paar Dutzend (Migration
   * 0009 begründet an derselben Stelle, warum es hier keinen Index braucht).
   * Tags sind Tausende; dort trägt `tag.name_key` mit `ix_tag_name_key` die
   * Frage, und `findByKey` stellt sie ohne Tabellendurchlauf.
   *
   * Ausdrücklich **ohne** `placement`-Filter: Ein Name ist über alle Flächen
   * hinweg eindeutig, weil `ux_pool_name` es über alle Flächen hinweg ist.
   * Fragte diese Liste nach der Fläche, ließe sich eine Board-Spalte anlegen,
   * deren Name ein Pool schon trägt — und der eindeutige Index wiese sie ab,
   * nachdem die Prüfung sie durchgelassen hat.
   */
  listNames(): Promise<readonly PoolNameEntry[]>;

  /**
   * Legt eine Regel an.
   *
   * `placement` ist weglassbar und dann `'pool'` — dieselbe Vorgabe, die auch
   * das Schema setzt (Migration 0009). Eine Regel ohne genannte Fläche ist ein
   * Pool; das war die einzige Bedeutung, die eine Regel vor E-054 haben konnte.
   */
  create(
    pool: Omit<
      Pool,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'placement'
      | 'excludedTags'
      | 'statusIds'
      | 'completion'
      | 'exportState'
    > & {
      readonly placement?: PoolPlacement;
      /**
       * Die vier Achsen aus T-076 sind weglassbar und stehen dann auf ihrem
       * **Neutralwert** — dieselbe Vorgabe, die auch das Schema setzt
       * (Migration 0011), und dieselbe Bauart wie bei `placement`.
       *
       * Eine Regel, die nur `rule` nennt, ist damit Wort für Wort die Regel,
       * die man vor T-076 anlegen konnte.
       */
      readonly excludedTags?: readonly PoolTagTerm[];
      readonly statusIds?: readonly StatusId[];
      readonly completion?: PoolCompletionFilter;
      readonly exportState?: PoolExportFilter;
    },
    now: Timestamp,
  ): Promise<Pool>;
  /**
   * Teiländerung. Was fehlt, bleibt, wie es ist — **auch bei den drei Listen**
   * der Regel: Wer nur `rule` schickt, ändert die erforderlichen Tags und
   * behält seine Ausschlüsse und Status (T-076).
   */
  update(id: PoolId, pool: Partial<Omit<Pool, 'id'>>, now: Timestamp): Promise<Result<Pool, TaktError>>;
  remove(id: PoolId): Promise<Result<void, TaktError<'not_found'>>>;

  /**
   * Löst die **erforderlichen** Tags einer Regel zur vollständigen Tagmenge
   * auf, einschließlich der Tags aus Unterordnern, wenn `includeSubfolders`
   * gesetzt ist.
   *
   * Es gibt keine Methode, die Pool-Mitgliedschaft speichert. Sie wird bei
   * jeder Abfrage neu bestimmt (A-3.4).
   *
   * **Nur die erforderlichen.** Der Name ist der aus der Zeit, als es nur eine
   * Liste gab; die zweite hat mit T-076 eine eigene Methode bekommen, statt
   * dass diese hier zwei Dinge zurückgäbe. Der Grund ist nicht Geschmack: An
   * dieser Signatur hängt ein Aufrufer in fremder Hoheit
   * (`routes/addin/service.ts`), und eine geänderte Rückgabe hätte ihn
   * gebrochen, ohne dass er dabei richtiger geworden wäre.
   */
  resolveRule(id: PoolId): Promise<readonly TagId[]>;

  /**
   * Löst die **ausgeschlossenen** Tags einer Regel auf (T-076).
   *
   * Dieselbe Auflösung wie `resolveRule`, dieselbe Tiefe, dasselbe
   * `includeSubfolders`. Getrennt, weil die beiden Listen im Ergebnis
   * Gegenteiliges bewirken und eine gemeinsame Rückgabe an jeder Aufrufstelle
   * wieder auseinandergenommen werden müsste.
   */
  resolveExcluded(id: PoolId): Promise<readonly TagId[]>;

  /**
   * Beide Taglisten, aufgelöst — **und** die Ordner, aus denen nichts geworden
   * ist (E-057).
   *
   * Der Zusatz gegenüber `resolveRule`/`resolveExcluded` ist die Auskunft, die
   * eine Tagmenge nicht tragen kann: welcher **genannte Ordner** keinen Tag
   * enthält. Ohne sie sieht ein leerer Ordner aus wie eine Achse, die schweigt
   * — und steht daneben noch ein Tagterm, ist er in der Summe überhaupt nicht
   * mehr zu sehen.
   *
   * **Eine Methode für beide Achsen**, obwohl die schmale Fassung darüber zwei
   * hat: Die beiden Aufrufer dieser Fassung — die Pool-Liste und das Board —
   * brauchen ausnahmslos beide Achsen und lösten schon vorher zweimal auf. Zwei
   * Methoden wären hier zwei Aufrufe für eine Antwort.
   *
   * Die schmalen Methoden bleiben daneben stehen. An ihnen hängt ein Aufrufer
   * in fremder Hoheit (`routes/addin/service.ts`), und sie sind für den, der
   * nur die Tagmenge braucht, weiterhin die genügsamere Frage.
   */
  resolveAxes(id: PoolId): Promise<PoolAxesResolution>;

  /** Mitglieder eines Pools. Abgeleitet, nicht gespeichert. */
  members(id: PoolId, filter?: TodoFilter, pagination?: Pagination): Promise<Page<Todo>>;
}

// ---------------------------------------------------------------------------
// Der Status eines Todos (A-5.3, A-5.4) — Tabelle `todo_status`
//
// **Keine Kanban-Spalte.** Seit E-054 ist eine Spalte eine Regel und liegt in
// `pool`; der Status ist eine Eigenschaft am Todo und liegt hier. Seit T-076
// lässt sich in einer Regel **nach** dem Status filtern (`Pool.statusIds`) —
// das macht die Spalte nicht wieder zum Status: Eine Spalte kann mehrere
// Status umfassen, keinen, oder Status und Tags mischen.
// ---------------------------------------------------------------------------

export interface TodoStatusPort {
  list(): Promise<readonly TodoStatus[]>;
  load(id: StatusId): Promise<TodoStatus | null>;
  defaultStatus(): Promise<TodoStatus>;
  /**
   * Legt eine Spalte an. `color` steht hinter `now` und ist weglassbar —
   * die Farbe kam erst mit T-051 dazu, und ein Anlegen ohne sie ist der
   * Normalfall (farblose Spalte).
   */
  create(
    name: string,
    position: number,
    now: Timestamp,
    color?: string | null,
  ): Promise<Result<TodoStatus, TaktError<'name_conflict'>>>;
  /**
   * Ändern. `isDefault: true` gibt den Standard weiter; `isDefault: false` auf
   * dem **aktuellen** Standard wird abgewiesen (`default_status_locked`,
   * T-074) — sonst bliebe kein Standard übrig und `defaultStatus()` fiele
   * still auf den ersten nach Position.
   */
  update(
    id: StatusId,
    fields: Partial<Omit<TodoStatus, 'id'>>,
    now: Timestamp,
  ): Promise<Result<TodoStatus, TaktError>>;
  /** Neuordnung in einem Zug, damit der eindeutige Index nicht zwischendrin bricht. */
  reorder(order: readonly StatusId[], now: Timestamp): Promise<Result<readonly TodoStatus[], TaktError>>;
  /**
   * Löschen. Vier fachliche Gründe können es verhindern:
   * `status_in_use` (Todos tragen ihn — oder, seit T-076, eine Regel benutzt
   * ihn), `last_status_column` und — seit T-074 auch im Dienst und nicht mehr
   * nur in der Oberfläche — `default_status_locked`.
   */
  remove(
    id: StatusId,
  ): Promise<
    Result<
      void,
      TaktError<'status_in_use' | 'last_status_column' | 'default_status_locked' | 'not_found'>
    >
  >;
}

// ---------------------------------------------------------------------------
// Zeitbuchungen und Timer
// ---------------------------------------------------------------------------

export interface TimeEntryFilter {
  readonly todoId?: TodoId;
  readonly exportStatus?: ExportStatus;
  /**
   * Kalendertag **in Ortszeit**, einschließlich (E-025).
   *
   * `CalendarDay` und nicht `string`: Bis T-042 stand hier ein nackter
   * `string`, und der Adapter verglich ihn mit `date(started_at)` — also mit
   * dem UTC-Tag. Der Typ sagt jetzt, welcher Tagesbegriff gemeint ist, und die
   * Umrechnung in UTC-Grenzen macht `calendarDayBounds` in der Domäne.
   */
  readonly fromDay?: CalendarDay;
  /** Kalendertag in Ortszeit, einschließlich. */
  readonly toDay?: CalendarDay;
  readonly onlyPreviouslyExported?: boolean;
}

export interface TimeEntryPort {
  load(id: TimeEntryId): Promise<TimeEntry | null>;
  search(filter: TimeEntryFilter, pagination?: Pagination): Promise<Page<TimeEntry>>;

  /** Manuelle Buchung (A-6.1). Umgeht den Timer, unterliegt denselben Regeln. */
  create(
    input: Pick<TimeEntry, 'todoId' | 'startedAt' | 'endedAt' | 'note'>,
    now: Timestamp,
  ): Promise<Result<TimeEntry, TaktError>>;

  /** A-6.9: Der Adapter weist eine gesperrte Buchung ab, zusätzlich zum Trigger. */
  update(
    id: TimeEntryId,
    fields: Partial<Pick<TimeEntry, 'startedAt' | 'endedAt' | 'note' | 'todoId'>>,
    now: Timestamp,
  ): Promise<Result<TimeEntry, TaktError<'time_entry_locked' | 'validation_error' | 'not_found'>>>;

  remove(id: TimeEntryId): Promise<Result<void, TaktError<'time_entry_locked' | 'not_found'>>>;

  sumSeconds(filter: TimeEntryFilter): Promise<number>;

  /**
   * Hat dieses Todo offene, hat es exportierte Buchungen? (T-076)
   *
   * Für die Exportstatus-Achse einer Regel. **Eine** Abfrage für alle
   * genannten Todos, nicht eine je Todo: Das Board fragt für jede geladene
   * Karte, und ein Aufruf je Karte wäre genau das N+1, das A-10.4 ausschließt.
   *
   * Zwei Wahrheitswerte und keine Summe: Gefragt ist, ob es solche Buchungen
   * **gibt**. `sumSeconds` daneben beantwortet die andere Frage — wie viel —
   * und braucht dafür je Todo einen eigenen Aufruf, weil sie eine Zahl je
   * Filter liefert und keine Zuordnung.
   *
   * `open` zählt nur **abgeschlossene** Buchungen: Ein laufender Timer ist
   * noch nichts, was man abrechnen könnte, und derselbe Zusatz steht seit
   * jeher in `TodoFilter.onlyWithOpenEntries`. Ein Todo, das in keiner der
   * beiden Mengen vorkommt, hat gar keine Buchungen; es fehlt dann in der
   * Zuordnung, und der Aufrufer liest zweimal `false`.
   */
  exportPresence(
    todoIds: readonly TodoId[],
  ): Promise<ReadonlyMap<TodoId, { readonly hasOpen: boolean; readonly hasExported: boolean }>>;
}

/**
 * Der Timer (A-6.2, A-6.8).
 *
 * Nur ein laufender Timer ist zugleich möglich. Die Speicherung erzwingt das
 * über einen partiellen eindeutigen Index auf `time_entry` — nicht über eine
 * Prüfung im Adapter, die zwischen Lesen und Schreiben verlieren könnte.
 */
export interface TimerPort {
  running(): Promise<RunningTimeEntry | null>;

  /**
   * Startet einen Timer. Läuft bereits einer und `stopRunning` ist nicht
   * gesetzt, liefert der Port `timer_already_running`, ohne etwas zu ändern.
   *
   * Ist es gesetzt, geschieht in genau einer Transaktion: den laufenden Timer
   * beenden, gegebenenfalls „Erledigt" am Zieltodo aufheben (A-2.5), den neuen
   * Timer anlegen. Ein Abbruch dazwischen hinterlässt keinen der Teilschritte.
   */
  start(
    todoId: TodoId,
    stopRunning: boolean,
    now: Timestamp,
  ): Promise<
    Result<
      {
        readonly started: RunningTimeEntry;
        readonly stopped: TimeEntry | null;
        readonly doneCleared: boolean;
      },
      TaktError<'timer_already_running' | 'not_found'>
    >
  >;

  /**
   * Stoppt den laufenden Timer. Schreibt Ende und Leistung in einem Zug.
   *
   * Liegt die Laufzeit unter der Mindestdauer, wird die Buchung verworfen statt
   * mit Dauer 0 abgelegt — die Speicherung ließe eine solche Zeile ohnehin
   * nicht zu.
   */
  stop(
    note: string,
    now: Timestamp,
  ): Promise<
    Result<
      { readonly kind: 'recorded'; readonly entry: TimeEntry } | { readonly kind: 'discarded' },
      TaktError<'timer_not_running'>
    >
  >;
}

/**
 * Lebenszeichen des laufenden Timers (E-036) — Tabelle `timer_heartbeat`.
 *
 * Der laufende Timer schreibt mindestens jede Minute. Beim naechsten Start der
 * Anwendung findet Takt eine Buchung ohne Ende vor und weiss dank des letzten
 * Lebenszeichens, bis wohin sie hoechstens gebucht werden darf. Ohne diesen
 * Wert bliebe nur, die Endzeit auf „jetzt" zu setzen — ein ueber Nacht
 * vergessener Timer buchte dann vierzehn Stunden, und nach der Aufrundung aus
 * E-008 landet das in einer Rechnung.
 *
 * `touch` ist absichtlich ein eigener Port und kein Feld auf `TimeEntryPort`:
 * Es ist der einzige Schreibvorgang in Takt, der im Sekundentakt laeuft, und er
 * darf die Zeile mit den Abrechnungsdaten nicht anfassen.
 *
 * Die Regel, was mit der vorgefundenen Buchung geschieht, liegt in der Domaene
 * (`decideOrphanedTimer` in time-entry.ts) und nicht hier. Dieser Port liefert
 * nur den Wert, auf den sie sich stuetzt.
 */
export interface TimerHeartbeatPort {
  /** Schreibt oder erneuert das Lebenszeichen der laufenden Buchung. */
  touch(timeEntryId: TimeEntryId, now: Timestamp): Promise<void>;

  /**
   * Letztes Lebenszeichen einer Buchung. `null`, wenn nie eines geschrieben
   * wurde — dann gibt es nichts zu buchen, was jemand bezeugen koennte.
   */
  lastSeen(timeEntryId: TimeEntryId): Promise<Timestamp | null>;

  /**
   * Die beim Start vorgefundene, unvollstaendige Buchung samt ihrem letzten
   * Lebenszeichen. `null`, wenn kein Timer verwaist ist.
   *
   * Bis der Benutzer geantwortet hat, bleibt die Buchung ohne Ende und geht in
   * keinen Export: `v_export_candidate` fuehrt ausschliesslich abgeschlossene
   * Buchungen.
   */
  orphaned(): Promise<{
    readonly running: RunningTimeEntry;
    readonly heartbeatAt: Timestamp | null;
  } | null>;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Lesezugriff für den Export.
 *
 * Liest ausschließlich die Sicht `v_export_candidate`. Diese Sicht enthält die
 * Spalte mit dem internen Vermerk des Todos nicht, sodass die Grenze aus A-7.2
 * auch dann hält, wenn jemand hier später eine Abfrage von Hand ergänzt (R-06).
 *
 * `openGroups` ist die Form, in der der Exportmotor liest: je Todo und
 * Kalendertag eine Gruppe aus ausschließlich offenen Buchungen. Erst summieren,
 * dann runden. `openCandidates` bleibt die ungruppierte Sicht für Vorschau und
 * Listen.
 */
export interface ExportReadPort {
  openCandidates(ids?: readonly TimeEntryId[]): Promise<readonly ExportCandidate[]>;
  openGroups(ids?: readonly TimeEntryId[]): Promise<readonly ExportGroup[]>;
  openCount(): Promise<number>;
}

/**
 * Eine geschriebene Exportzeile, so wie der Anwendungsfall sie fertig übergibt.
 *
 * `seconds` ist die ungerundete Tagessumme, `quarters` der Wert, der in die
 * Abrechnung ging. Beide zusammen machen nachrechenbar, wieviel die Rundung
 * dieser Zeile hinzugefügt hat (E-008, E-020).
 *
 * Ein Anteil je Buchung steht hier nicht und wird nicht gebildet: Bei 10, 20
 * und 5 Minuten in einer Gruppe von 0,75 gibt es keine richtige Aufteilung auf
 * die drei Buchungen, nur mehrere falsche.
 */
export interface ExportRunGroupRecord {
  readonly todoId: TodoId;
  readonly day: CalendarDay;
  readonly seconds: Seconds;
  readonly quarters: QuarterHours;
  readonly entries: readonly {
    readonly timeEntryId: TimeEntryId;
    readonly durationSeconds: Seconds;
  }[];
}

/**
 * Ein vollständig geplanter und bereits geschriebener Exportlauf.
 *
 * Alles darin steht fest, **bevor** `recordRun` aufgerufen wird: Die Datei
 * liegt im Ordner, ihr SHA-256 ist gebildet, jede Zeile ist gerendert. Der
 * Adapter rechnet nichts nach und rendert nichts — er schreibt fest.
 */
export interface ExportRunRecord {
  readonly templateId: ExportTemplateId;
  /** Abzug der Vorlage. Ohne ihn schriebe eine spätere Änderung die Geschichte um. */
  readonly templateSnapshot: unknown;
  readonly filePath: string;
  readonly fileSha256: string;
  readonly bytes: number;
  readonly roundingMode: RoundingMode;
  /** Vom Betriebssystem gelesen (E-010), über die zweite `stdin`-Zeile gereicht (E-042). */
  readonly windowsUser: string;
  readonly now: Timestamp;
  readonly groups: readonly ExportRunGroupRecord[];
}

/**
 * Schreibseite des Exports (A-8.8).
 *
 * ---------------------------------------------------------------------------
 * Warum hier `recordRun` steht und nicht `runExport`
 * ---------------------------------------------------------------------------
 *
 * Der ursprüngliche Vertrag (T-001) legte den ganzen Ablauf in diesen Port:
 * Ordner prüfen, gruppieren, rendern, Datei schreiben, markieren. Das hätte
 * bedeutet, dass die Speicherung den Vorlagen-Motor aus `packages/export`
 * einbindet und den `FilePort` zugleich benutzt und umsetzt. Ein austauschbarer
 * Adapter (E-001) trüge damit das Vorlagenformat mit sich, und ein zweiter
 * Adapter müsste es nachbauen.
 *
 * Geschnitten ist es deshalb so:
 *
 *   - **Der Anwendungsfall** (`apps/local-api/src/usecases/export.ts`) führt
 *     den Ablauf aus architektur.md 3.2: Ordner prüfen, Transaktion öffnen,
 *     Gruppen lesen, Plan bilden, Datei schreiben, festschreiben. Er ist die
 *     einzige Stelle, an der die Reihenfolge steht.
 *   - **Dieser Port** schreibt fest, und zwar in der Transaktion, die der
 *     Anwendungsfall geöffnet hat: `export_run`, je Zeile ein
 *     `export_run_group` mit seinen `export_run_entry`, den Statuswechsel jeder
 *     Buchung und je Buchung eine Protokollzeile. Alles oder nichts.
 *
 * Die Klammer bleibt damit dort, wo die Transaktion ist, und das Rendern dort,
 * wo das Format ist.
 *
 * **Die Reihenfolge Datei-vor-Markierung ist Absicht.** Eine geschriebene Datei
 * ohne Markierung führt dazu, dass dieselbe Zeit ein zweites Mal exportiert
 * wird — ärgerlich, aber auffindbar, denn die Datei liegt im Ordner. Eine
 * Markierung ohne Datei führt zu verlorener Abrechnung: Die Buchungen gelten
 * als übertragen, aber niemand hat sie bekommen, und niemand merkt es. Der
 * zweite Fall ist der schlimmere, deshalb wird er ausgeschlossen.
 */
export interface ExportPort {
  /**
   * Schreibt einen fertigen Lauf fest. **Öffnet keine eigene Transaktion** —
   * er läuft in der des Aufrufers.
   *
   * Weist ab, wenn auch nur eine der genannten Buchungen inzwischen nicht mehr
   * offen ist. Sie stillschweigend zu überspringen wäre schlimmer: Dann stünde
   * in der bereits geschriebenen Datei etwas anderes, als markiert wurde.
   */
  recordRun(record: ExportRunRecord): Promise<Result<ExportRun, TaktError>>;

  loadRun(id: ExportRunId): Promise<ExportRun | null>;
  listRuns(pagination?: Pagination): Promise<Page<ExportRun>>;

  /**
   * E-012. Setzt den Status genau einer Buchung zurück und schreibt in
   * derselben Transaktion die Protokollzeile. Ohne Protokollzeile gibt es
   * keinen Statuswechsel — beides oder keines (R-10).
   */
  resetStatus(
    request: ExportStatusResetRequest,
  ): Promise<Result<TimeEntry, TaktError<'export_status_unchanged' | 'not_found'>>>;

  /**
   * E-047. Bucht genau eine Buchung aus, ohne sie abzurechnen, und schreibt in
   * derselben Transaktion die Protokollzeile mit `event = 'not_billed'`.
   *
   * Der Exportstatus geht auf `exported` (E-032), aber **ohne Exportlauf** —
   * das Schema erzwingt genau diese Kombination und schließt aus, dass eine
   * Ausbuchung später als Export gelesen wird. Ohne Protokollzeile gibt es
   * keinen Statuswechsel: beides oder keines (R-10).
   *
   * Eine laufende Buchung ist keine Buchung im Sinne dieses Vorgangs und
   * ergibt `not_found` — dasselbe wie beim Zurücksetzen.
   */
  markNotBilled(
    request: NotBilledRequest,
  ): Promise<Result<TimeEntry, TaktError<'export_status_unchanged' | 'not_found'>>>;

  /**
   * Das Exportprotokoll, gefiltert (R-10, T-042).
   *
   * Zwei Fragen werden hier gestellt, und beide brauchen den Filter **in der
   * Abfrage** und nicht im Aufrufer:
   *
   *  - „Was ist mit dieser Buchung passiert?" → `timeEntryId`.
   *  - „Welche Buchungen waren in diesem Lauf?" → `exportRunId`. Ohne diesen
   *    Filter konnte die Oberfläche die Frage nur über die gerade geladene
   *    Seite beantworten. Ein Lauf mit 41 Buchungen schiebt jeden älteren von
   *    der ersten Seite — der Knopf versagte also gerade bei den Läufen, für
   *    die man ihn drückt, und je größer der Export, desto sicherer.
   *
   * Beide zusammen sind zulässig und werden mit `AND` verbunden.
   *
   * Die erste Stelle nimmt **auch** eine nackte `TimeEntryId` entgegen. Das ist
   * die ältere, kürzere Form; sie bleibt, weil die Aufrufe in
   * `packages/storage/test/` in fremder Hoheit liegen und ein Bruch dort
   * niemandem hilft. Neuer Quelltext schreibt den Filter aus.
   */
  audit(
    filter?: TimeEntryId | ExportAuditFilter,
    pagination?: Pagination,
  ): Promise<Page<ExportAuditEntry>>;
}

/** Womit sich das Exportprotokoll einschränken lässt (T-042). */
export interface ExportAuditFilter {
  readonly timeEntryId?: TimeEntryId;
  readonly exportRunId?: ExportRunId;
}

export interface ExportTemplatePort {
  list(): Promise<readonly ExportTemplateEnvelope[]>;
  load(id: ExportTemplateId): Promise<ExportTemplateEnvelope | null>;
  builtin(): Promise<ExportTemplateEnvelope>;
  create(name: string, definition: unknown, now: Timestamp): Promise<Result<ExportTemplateEnvelope, TaktError>>;
  update(
    id: ExportTemplateId,
    name: string | undefined,
    definition: unknown,
    now: Timestamp,
  ): Promise<Result<ExportTemplateEnvelope, TaktError<'builtin_template_immutable' | 'not_found'>>>;
  remove(
    id: ExportTemplateId,
  ): Promise<Result<void, TaktError<'builtin_template_immutable' | 'not_found'>>>;
}

// ---------------------------------------------------------------------------
// Einstellungen und Standard-Tags
// ---------------------------------------------------------------------------

export interface AppSettingsPort {
  load(): Promise<AppSettings>;
  update(input: AppSettingsUpdate): Promise<Result<AppSettings, TaktError>>;
}

export interface DefaultTagPort {
  list(): Promise<readonly DefaultTag[]>;
  set(tagIds: readonly TagId[], now: Timestamp): Promise<readonly DefaultTag[]>;
}

// ---------------------------------------------------------------------------
// Ports, die nicht auf die Datenbank zeigen
// ---------------------------------------------------------------------------

/**
 * Die Uhr. Eigener Port, damit Anwendungsfälle mit fester Zeit prüfbar sind.
 *
 * `monotonicSeconds` ist bewusst getrennt von `now`. Die Dauer eines Timers
 * wird aus der monotonen Quelle bestimmt, nicht aus der Differenz zweier
 * Wanduhrzeiten. Eine Zeitumstellung oder ein Abgleich über das Netz während
 * eines laufenden Timers verfälscht sonst die Abrechnung. Die Endzeit ergibt
 * sich anschließend als Startzeit plus gemessene Dauer, sodass Start, Ende und
 * Dauer zueinander passen.
 */
export interface ClockPort {
  now(): Timestamp;
  monotonicSeconds(): number;
}

/** Kennungserzeugung. UUIDv7: zufällig genug und nach Erzeugungszeit sortierbar. */
export interface IdPort {
  next(): string;
}

/**
 * Dateizugriff für den Export (E-011, R-11).
 *
 * `writeFile` schreibt ausschließlich innerhalb des in den Einstellungen
 * gewählten Ordners. Der Adapter löst den Zielpfad auf und vergleicht ihn mit
 * dem aufgelösten Ordner; liegt er außerhalb, bricht er mit
 * `export_path_outside_directory` ab. Ein Dateiname aus einer Vorlage oder aus
 * einer Anfrage darf keine Pfadtrenner enthalten.
 *
 * `checkExportDirectory` **entscheidet**. Was für ein Ordner das ist, ist eine
 * andere Frage und hat einen eigenen Port: `DirectoryInsightPort`.
 */
export interface FilePort {
  checkExportDirectory(path: string | null): Promise<ExportDirectoryCheck>;
  writeFile(
    directory: string,
    fileName: string,
    content: string,
  ): Promise<
    Result<{ readonly path: string; readonly sha256: string; readonly bytes: number }, TaktError>
  >;
}

/**
 * Was für ein Ordner das ist — belegt, nicht geraten (T-039, B-5.2,
 * B-5.3 Punkt 3).
 *
 * Ein eigener Port neben `FilePort`, weil es eine andere Frage ist. Ob
 * geschrieben werden darf, hängt am Zustand des Ordners; was für ein Ordner das
 * ist, hängt nicht daran. Ein Systemverzeichnis bleibt eines, ob es nun
 * beschreibbar ist oder nicht, und eine Netzfreigabe bleibt eine, auch wenn sie
 * gerade nicht antwortet.
 *
 * Der Adapter dazu liegt **nicht** in diesem Paket, sondern in
 * `apps/local-api/src/access/export-directory.ts` — bei den übrigen
 * Betriebssystem-Adaptern (Anwendungsdatenverzeichnis, Sitzungsgeheimnis,
 * Dateirechte). Er liest Umgebungsvariablen und Dateisystemarten; das ist
 * Auskunft über den Rechner und nicht über eine Speicherung.
 */
export interface DirectoryInsightPort {
  /**
   * `mayAskFileSystem` ist `false`, wenn die Prüfung eben in eine Zeitgrenze
   * gelaufen ist. Dann wird das Dateisystem nicht noch einmal gefragt — es liefe
   * in dieselbe Wand und verdoppelte die Wartezeit, die gerade abgebrochen
   * wurde. Übrig bleibt, was aus Pfad und Umgebung folgt, und das ist in genau
   * diesem Fall das Wichtigste: `unc` erklärt, warum nichts geantwortet hat.
   *
   * Eine leere Liste ist **keine** Entwarnung, sondern eine Nichtaussage.
   */
  describeExportDirectory(
    path: string | null,
    options: { readonly mayAskFileSystem: boolean },
  ): Promise<readonly ExportDirectoryTrait[]>;
}

/** Windows-Benutzername (A-8.5, E-010). Kommt aus der Tauri-Hülle, nie aus einer Eingabe. */
export interface SystemPort {
  windowsUser(): string;
  /**
   * Wo der Bestand wirklich liegt (E-018, R-13).
   *
   * `null`, wenn im Arbeitsspeicher gearbeitet wird — im Prüfpfad und in
   * Tests. Der Pfad wird im Zusammenbau gesetzt und ist von dort aus
   * unveränderlich; kein Aufrufer kann ihn verstellen (B-1.6 Punkt 1).
   *
   * Er steht hier und nicht in den Einstellungen der Datenbank, weil er keine
   * Einstellung ist: Er entsteht aus dem Anwendungsdatenverzeichnis des
   * angemeldeten Benutzers und ist eine Auskunft über den Rechner. Wer wissen
   * will, ob seine Buchungen in einem Synchronisierungsordner liegen, kann es
   * damit nachsehen, statt es zu vermuten.
   */
  databasePath(): string | null;
}
