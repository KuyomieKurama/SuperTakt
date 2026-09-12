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
  Attachment,
  AttachmentCreate,
  AttachmentId,
  AttachmentKind,
  CalendarDay,
  DefaultTag,
  ExportAuditEntry,
  ExportCandidate,
  ExportDirectoryCheck,
  ExportGroup,
  ExportRun,
  ExportRunId,
  ExportStatus,
  ExportStatusResetRequest,
  ExportTemplateEnvelope,
  ExportTemplateId,
  LocationTrait,
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
  readonly attachments: AttachmentPort;
  readonly tags: TagPort;
  readonly folders: TagFolderPort;
  readonly pools: PoolPort;
  readonly statuses: TodoStatusPort;
  readonly timeEntries: TimeEntryPort;
  readonly timer: TimerPort;
  readonly idle: IdleTimerPort;
  readonly heartbeat: TimerHeartbeatPort;
  /** Leseseite des Exports. Getrennt von `export`, damit eine Vorschau nichts schreiben kann. */
  readonly exportRead: ExportReadPort;
  readonly export: ExportPort;
  readonly templates: ExportTemplatePort;
  readonly settings: AppSettingsPort;
  readonly defaultTags: DefaultTagPort;
  /** Vollständige, versionierte Datensicherung (A-20.1 bis A-20.8). */
  readonly dataArchive: DataArchivePort;
}

// ---------------------------------------------------------------------------
// Datensicherung und Migration (A-20.*)
// ---------------------------------------------------------------------------

/** JSON-kompatibler Zellenwert des anwendungsunabhängigen Archivs. */
export type ArchiveScalar = string | number | null;
export type ArchiveRow = Readonly<Record<string, ArchiveScalar>>;

/**
 * Die Tabellen des fachlichen Bestands. Abgeleitete Sichten und das interne
 * Migrationsbuch gehören nicht in das Austauschformat.
 */
export const DATA_ARCHIVE_TABLES = [
  'todo_status',
  'tag_folder',
  'tag',
  'todo',
  'todo_note',
  'todo_tag',
  'time_entry',
  'timer_heartbeat',
  'timer_idle',
  'todo_attachment_kind',
  'todo_attachment',
  'pool',
  'pool_rule',
  'default_tag',
  'export_template',
  'export_run',
  'export_run_group',
  'export_run_entry',
  'export_audit',
  'app_setting',
] as const;

export type DataArchiveTable = (typeof DATA_ARCHIVE_TABLES)[number];
export type DataArchiveTables = Readonly<Record<DataArchiveTable, readonly ArchiveRow[]>>;

export interface DataArchivePort {
  readAll(): Promise<DataArchiveTables>;
  /** Ersetzt den fachlichen Bestand innerhalb der bereits offenen Transaktion. */
  replaceAll(tables: DataArchiveTables): Promise<void>;
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
// Anhänge (A-19.8 bis A-19.15)
// ---------------------------------------------------------------------------

/**
 * Anhänge eines Todos — Tabelle `todo_attachment` (A-19.8 bis A-19.14).
 *
 * **Ein eigener Port, aus demselben Grund wie `TodoNotePort`.** Kein Wert vom
 * Typ `Todo` trägt Anhänge; wer sie will, benennt diesen Port, und diese
 * Benennung ist im Quelltext auffindbar. Der Exportmotor bekommt weder diesen
 * Port noch den Typ (A-19.17, R-06) — er bekommt überhaupt keine Ports,
 * sondern fertige `ExportGroup`-Werte.
 *
 * **Bytes stehen hier nicht.** Dieser Port führt Zeilen. Die Bytes eines Bildes
 * liegen als Datei im Anwendungsdatenverzeichnis und haben einen eigenen Port
 * ({@link AttachmentBlobPort}) — die Trennung ist dieselbe wie zwischen
 * `ExportPort` und `FilePort`, und sie hat denselben Zweck: Eine Transaktion
 * über Zeilen kann keine Datei zurücknehmen, und wer beides in einem Port
 * hätte, merkte das erst beim ersten Abbruch.
 */
export interface AttachmentPort {
  /** Alle Anhänge eines Todos, in stabiler Reihenfolge (A-19.8). */
  list(todoId: TodoId): Promise<readonly Attachment[]>;
  /** Alle Anhänge mehrerer Todos in **einer** Abfrage. Kein N+1 in der Liste. */
  listMany(todoIds: readonly TodoId[]): Promise<ReadonlyMap<TodoId, readonly Attachment[]>>;
  load(id: AttachmentId): Promise<Attachment | null>;
  /**
   * Legt einen Anhang an. `position` bestimmt der Adapter — sie ist die
   * nächste freie Stelle an diesem Todo und keine Angabe des Aufrufers.
   *
   * Ein Aufrufer, der sie setzen dürfte, könnte zwei Anhänge auf dieselbe
   * Stelle legen; die Reihenfolge wäre dann wieder die der Datenbank, und
   * A-19.8 verlangt eine stabile.
   */
  create(input: AttachmentCreate): Promise<Result<Attachment, TaktError>>;
  /**
   * Entfernt einen Anhang und meldet, **was** entfernt wurde.
   *
   * Der Rückgabewert trägt den Datensatz und nicht nur ein „erledigt": Der
   * Aufrufer braucht bei einem Bild den erzeugten Dateinamen, um die Kopie
   * mitzunehmen (A-A-18) — und er braucht ihn **nach** dem Löschen der Zeile,
   * weil er ihn danach nicht mehr lesen könnte.
   */
  remove(id: AttachmentId): Promise<Result<Attachment, TaktError<'not_found'>>>;
  /**
   * Die Bildkopien eines Todos, **bevor** es gelöscht wird (A-A-18).
   *
   * `ON DELETE CASCADE` nimmt die Zeilen mit, die Dateien nicht — SQL kennt
   * kein Dateisystem. Wer ein Todo löscht, liest deshalb zuerst diese Liste
   * und entfernt danach die Dateien. Die Reihenfolge ist Inhalt: Umgekehrt
   * bliebe bei einem abgebrochenen Löschvorgang ein Anhang ohne Bild zurück.
   */
  imageTargets(todoId: TodoId): Promise<readonly string[]>;
  /**
   * Die **übernommenen E-Mail-Dateien** eines Todos, bevor es gelöscht wird
   * (A-19.23, A-A-83, dieselbe Sache wie {@link imageTargets}).
   *
   * Gefragt wird nach `kind = 'file' AND origin = 'email'` — also nach den
   * Dateien, die **SuperTakt selbst** ins Anwendungsdatenverzeichnis geschrieben
   * hat. Ein vom Benutzer eingetragener Dateipfad (`origin = 'user'`) steht
   * ausdrücklich **nicht** darin: Der zeigt auf eine Datei, die dem Benutzer
   * gehört und die niemals mitgelöscht werden darf.
   *
   * Das ist die schärfste Zusage dieses Ports. Wer die Bedingung `origin` hier
   * wegläßt, hat ein Todo gebaut, dessen Löschung die Rechnung des Kunden aus
   * dem Dokumentenordner entfernt.
   *
   * Der zurückgegebene Wert ist der gespeicherte `target` — der **Pfad**. Was
   * daraus gelöscht werden darf, entscheidet der Blob-Port noch einmal
   * (`AttachmentBlobPort.removeEmailFile`), und zwar an der Form: Zwischen
   * dieser Abfrage und dem `rm` liegt der Bestand, in den ohne diesen Port
   * geschrieben werden kann (VG-1, VG-3).
   */
  emailFileTargets(todoId: TodoId): Promise<readonly string[]>;
  /*
   * **Gestrichen in T-315: `knownImageTargets(names)`.**
   *
   * Sie fragte mit `kind = 'image' AND target IN (namen)` — zeichengleich, über
   * den Teilindex, schnell. Und sie war die **löschende** Frage: Jede Zeile, die
   * aus ihr herausfiel, machte die Datei auf der Platte zur Waise. Drei Wege
   * hinaus sind gemessen (T-314 Abschnitt 4, T-315): eine abweichende
   * Groß-/Kleinschreibung, ein `kind`, das nicht `image` ist, und — der Weg ohne
   * besondere Rechte — eine Zeile, die dieselbe Datei mit ihrem **vollen Pfad**
   * nennt, während die Abfrage mit bloßen Namen fragte.
   *
   * An ihrer Stelle steht {@link attachmentsNamingFiles}: **eine** Frage für
   * beide Aufräumläufe, in ihrer weitesten Fassung, mit der Regel in
   * `@takt/domain`. Eine zweite, engere Fassung derselben Frage hat hier nichts
   * mehr zu suchen — genau ihre Zweitfassung war der Fehler.
   */
  /**
   * Welche Arten führt der Bestand? (A-A-36.)
   *
   * Die Zeilen der Nachschlagetabelle `todo_attachment_kind` aus Migration
   * 0015 — heute drei, und das ist genau die Frage.
   *
   * ---------------------------------------------------------------------------
   * Warum eine eigene Methode und nicht eine Annahme im Aufrufer
   * ---------------------------------------------------------------------------
   *
   * 0015 hat die Arten zu **Daten** gemacht, damit eine vierte Art ein `INSERT`
   * ist und kein Tabellenumbau. Jede Stelle, die über Arten **rechnet**, hat
   * damit eine Annahme über eine Menge, die absichtlich wachsen darf.
   * {@link imageCount} ist eine solche Stelle: Sie zählt hart über
   * `kind = 'image'`, weil `ix_todo_attachment_image` ein Teilindex über genau
   * diese Bedingung ist (Bedrohungsmodell 23.3.3). **Seit T-315 zeigt ihre Enge
   * in die bremsende Richtung:** Eine vierte Art, die ebenfalls eine Kopie im
   * Bildverzeichnis hält, macht diese Zahl zu klein und den Widerspruchsriegel
   * stumpfer — sie macht die Löschung nicht weiter. Bis T-315 war es umgekehrt,
   * und deshalb steht die Artenprüfung überhaupt hier.
   *
   * Diese Methode erlaubt dem Aufrufer, die Annahme zu **prüfen**, statt sie zu
   * haben. Sie ist billig — eine Tabelle mit drei Zeilen ohne Bedingung — und
   * sie kostet den Teilindex nicht.
   *
   * Zurück kommt `string[]` und nicht `AttachmentKind[]`: Was hier gefragt wird,
   * ist gerade das, was dieses Erzeugnis **nicht** kennt. Ein Typ, der die
   * Antwort auf drei Werte einengt, gäbe die Frage auf, bevor sie gestellt ist.
   */
  knownKinds(): Promise<readonly string[]>;
  /**
   * Wie viele Bildanhänge führt der Bestand insgesamt? (T-179 B-1.)
   *
   * ---------------------------------------------------------------------------
   * Die Frage, mit der sich eine **leere** Antwort widerlegen läßt
   * ---------------------------------------------------------------------------
   *
   * {@link attachmentsNamingFiles} beantwortet „welche dieser liegenden Dateien
   * nennt der Bestand" — am **Ende** des Pfades. Eine **leere** oder zu kleine
   * Antwort heißt für den Aufräumlauf „die übrigen gehören niemandem", und sie
   * heißt dasselbe, wenn die Frage selbst nicht mehr trifft, weil sich unter ihr
   * etwas verschoben hat: eine Änderung an `target` (ein Präfix, eine Kennung
   * statt eines Namens) oder an `kind`. Der nächste Start löschte dann den
   * **ganzen** Bildbestand, und die einzige Spur wäre eine `info`-Zeile mit
   * einer Zahl.
   *
   * Diese Zahl hängt als einzige **gar nicht** am `target` und macht daraus
   * einen Widerspruch, den man sehen kann: Der Bestand führt mehr Bildanhänge,
   * als der Ordner Eigentümer findet. Beides zusammen ist kein Aufräumfall,
   * sondern ein Zeichen, daß die Zuordnung nicht mehr trifft.
   *
   * **Seit T-315 ist sie die zweite Achse und nicht mehr die Zweitfassung der
   * ersten** — dieselbe Berichtigung wie bei {@link emailFileCount} in T-314.
   * Bis dahin stellte sie dieselbe `kind = 'image'`-Bedingung wie die Abfrage,
   * der sie widersprechen sollte, und zwei Antworten auf dieselbe Frage
   * widersprechen einander nie. Verglichen wird sie jetzt mit dem Ergebnis der
   * **weiten** Frage, und der Aufrufer stellt sie **immer**, sobald überhaupt
   * etwas fallen würde — nicht erst bei leerer Antwort.
   *
   * Sie zählt über den Teilindex `ix_todo_attachment_image` und lädt nichts in
   * den Speicher.
   */
  imageCount(): Promise<number>;
  /**
   * **Welche dieser liegenden Dateien nennt der Bestand?** (A-A-98, T-313-1,
   * T-313-2, T-315.)
   *
   * **Die Frage beider Aufräumläufe** — der übernommenen E-Mail-Dateien und der
   * Bildkopien. Seit T-315 gibt es sie genau einmal; bis dahin hatte der
   * Bildlauf seine eigene, engere Fassung (`knownImageTargets`), und die
   * Doppelung war der Grund, warum die Berichtigung aus T-314 die Hälfte des
   * Bestands nicht erreichte.
   *
   * ---------------------------------------------------------------------------
   * Die weiteste Bedingung, die einen Eigentümer finden kann — und warum die
   * engere die löschende ist
   * ---------------------------------------------------------------------------
   *
   * Gefragt wird mit **Namen** und nicht mit Pfaden, **ohne** `origin`, **ohne**
   * `kind` und ohne Rücksicht auf die Schreibweise des Pfades davor. Die Regel
   * selbst liegt in `@takt/domain` (`attachmentTargetNamesFile`) und
   * ausschließlich dort; dieser Port hat sie nicht zu wiederholen.
   *
   * Bis T-313 stand hier die Frage `origin = 'email' AND kind = 'file'` über
   * **Pfade**, und sie war als Sicherheit gedacht. Gemessen ist sie das
   * Gegenteil: Eine Zeile, die ihr `origin` verliert, verschwindet aus der
   * Antwort — und was aus dieser Antwort verschwindet, wird **gelöscht**. Zwei
   * Wege dorthin sind gefahren worden (`ON DELETE CASCADE` auf ein zweites,
   * selbst eingetragenes Anhangsrecht; der Rückweg von Migration 0023 mit
   * `DEFAULT 'user'` beim Wiedervorgehen), und ein dritter lag in der
   * Schreibweise: `C:\…` und `c:/…` sind dieselbe Datei und zwei Zeichenketten.
   *
   * **Die Richtung ist entschieden:** Eine Zeile zuviel in der Antwort läßt eine
   * Datei liegen; eine Zeile zuwenig entfernt Kundenmaterial ohne Rückfrage und
   * ohne Wiederherstellung. Im Zweifel also **mehr** Eigentümer.
   *
   * Zurück kommt eine Teilmenge von `names`, Zeichen für Zeichen so, wie sie
   * hereingegeben wurden. Gelesen wird ausschließlich `target` — kein Titel,
   * kein Anzeigename, kein Absender, kein Todo (B-2.4).
   */
  attachmentsNamingFiles(names: readonly string[]): Promise<ReadonlySet<string>>;
  /**
   * **Welche Dateinamen erwartet der Bestand in diesem Ordner?** (A-A-98.)
   *
   * ---------------------------------------------------------------------------
   * Die Menge wird von der **anderen** Seite bestimmt, und das ist der ganze
   * Punkt
   * ---------------------------------------------------------------------------
   *
   * Der Widerspruchsriegel des Aufräumlaufs hing bis T-313 an einer Zahl, die
   * mit **derselben** Bedingung gezählt wurde wie die Abfrage, gegen die sie
   * sprechen sollte. Zwei Antworten auf dieselbe Frage können einander nicht
   * widersprechen: Verlor eine Zeile ihr `origin`, fiel sie aus beiden zugleich,
   * null stand gegen null, und der Riegel sah nichts.
   *
   * Diese Frage spannt die Menge deshalb an einer anderen Achse auf — am
   * **Anfang** des Pfades statt an seinem Ende: Welche Zeilen zeigen überhaupt
   * in diesen Ordner? Der Aufrufer hält das Ergebnis gegen das, was dort
   * wirklich liegt. Nennt der Bestand Dateien, die es nicht gibt, **und** liegen
   * zugleich Dateien da, die keine Zeile nennt, dann trifft die Zuordnung nicht
   * mehr, und es wird nichts entfernt.
   *
   * **Auch der Bildlauf stellt sie seit T-315**, obwohl `target` dort den bloßen
   * Namen trägt und diese Antwort im Regelfall deshalb **leer** ist. Das ist
   * kein Leerlauf: Genau auf dieser Achse fällt eine Zeile auf, die **doch**
   * einen Pfad in das Bildverzeichnis trägt — und so eine Zeile entsteht durch
   * die gewöhnliche Tür (ein Dateianhang auf eine Bildkopie).
   *
   * **Ohne `origin`, ohne `kind`** — aus demselben Grund wie oben. Verglichen
   * wird der Ordnerpräfix in beiden Trennerschreibweisen und in ASCII-Faltung;
   * der Vergleich ist damit nicht vollständig (Kurznamensform,
   * Verbindungspunkte), und das ist tragbar: Diese Antwort **bremst** nur, sie
   * löscht nie. Eine zu kleine Antwort kostet eine Bremse, keine Datei.
   *
   * Zurück kommen **gefaltete Namen** ({@link attachmentTargetFileName}) und
   * keine Pfade — der Aufrufer braucht nichts anderes, und ein Pfad weniger im
   * Speicher ist ein Pfad weniger im Protokoll (B-2.4).
   */
  attachmentNamesUnder(directory: string): Promise<ReadonlySet<string>>;
  /**
   * **Welche Dateinamen nennt der Bestand für Anhänge dieser Art?** (A-A-98,
   * T-320.)
   *
   * ---------------------------------------------------------------------------
   * Wofür das da ist, und wofür ausdrücklich nicht
   * ---------------------------------------------------------------------------
   *
   * {@link attachmentNamesUnder} spannt seine Menge am **Anfang** des Pfades
   * auf. Für die übernommenen E-Mail-Dateien trägt das, weil `target` dort den
   * vollen Pfad führt. Für die **Bildkopien** trägt es nicht: Dort steht im
   * `target` der bloße erzeugte Name, kein Ordner steht davor, und die Antwort
   * ist im Regelfall **leer**. Der Bildlauf hatte damit von seinen beiden
   * Gegenfragen faktisch nur eine — `missing` war dort immer 0, und die ganze
   * Last lag auf `claimed > owned` (T-318, Befund `orphan-sweep.ts:420`).
   *
   * Diese Frage schließt die Lücke: Sie nennt die Namen, die der Bestand für
   * Anhänge dieser Art führt, unabhängig davon, ob `target` ein Pfad ist oder
   * ein bloßer Name. Der Aufrufer hält sie gegen das, was wirklich im Ordner
   * liegt; was er dabei findet, **bremst** ihn — es löscht nie.
   *
   * **Was sie nicht ist: eine dritte unabhängige Achse.** Sie hängt an
   * derselben Spalte wie {@link imageCount}, und zwei Antworten auf dieselbe
   * Frage widersprechen einander nie (T-313-2, T-315). Sie macht die Zahl
   * `missing` im Protokoll rechenbar und weitet die Bremse; sie ersetzt keine
   * der drei vorhandenen Fragen.
   *
   * Zurück kommen **gefaltete Namen** ({@link attachmentTargetFileName}) und
   * keine Pfade — derselbe Grund wie bei {@link attachmentNamesUnder}: Ein Pfad
   * weniger im Speicher ist ein Pfad weniger im Protokoll (B-2.4).
   */
  attachmentNamesOfKind(kind: AttachmentKind): Promise<ReadonlySet<string>>;
  /**
   * Wie viele übernommene E-Mail-Dateien führt der Bestand insgesamt?
   * (T-309, dieselbe Rolle wie {@link imageCount} — seit T-314 aber **nicht**
   * mehr die einzige Gegenfrage.)
   *
   * Der **zweite** Riegel des E-Mail-Aufräumlaufs, und der einzige, der auch
   * dann noch etwas sagt, wenn `target` seine Gestalt vollständig gewechselt hat
   * — wenn also weder der Name am Ende noch der Ordner am Anfang wiederzufinden
   * ist. Dann sagt diese Zahl weiterhin „der Bestand führt übernommene
   * Dateien", während {@link attachmentsNamingFiles} keiner liegenden Datei
   * einen Eigentümer zuordnet und {@link attachmentNamesUnder} leer ist. Diese
   * drei Antworten zusammen sind der Widerspruch; keine von ihnen ist er allein.
   *
   * Gezählt wird über `ix_todo_attachment_email` mit `origin = 'email' AND
   * kind = 'file'`. **Daß diese Bedingung eng ist, ist hier die Eigenschaft und
   * nicht der Fehler:** Sie ist die einzige der drei, die überhaupt nicht am
   * Pfad hängt. Der Fehler aus T-313-2 war nicht ihre Enge, sondern daß die
   * **Abfrage** dieselbe Enge hatte.
   */
  emailFileCount(): Promise<number>;
}


/**
 * Die **Bytes** eines Bildanhangs (E-071 Punkt 2, A-A-15 bis A-A-18).
 *
 * ---------------------------------------------------------------------------
 * Warum ein eigener Port und nicht `FilePort`
 * ---------------------------------------------------------------------------
 *
 * `FilePort` schreibt Exportdateien in einen Ordner, den der **Benutzer**
 * einstellt, und seine ganze Aufgabe ist, nicht daneben zu schreiben (R-11).
 * Dieser Port schreibt in einen Ordner, den **niemand** einstellen kann: das
 * Anwendungsdatenverzeichnis, neben dem Bestand, unter denselben Rechten
 * (`0700`/`0600`, E-018, A-A-17). Zwei Ordner mit zwei entgegengesetzten
 * Regeln in einem Port zu führen, wäre die Gelegenheit, die eine für die
 * andere zu halten.
 *
 * ---------------------------------------------------------------------------
 * Was der Adapter zusagt
 * ---------------------------------------------------------------------------
 *
 *  - **Er zählt beim Lesen** und nicht aus `stat` (A-A-15). Eine angekündigte
 *    Größe ist keine Grenze; dieselbe Begründung wie bei `content-length` in
 *    A-V-6.
 *  - **Er entscheidet an der Kopfsignatur** und nicht an der Endung (A-A-16).
 *    Die Positivliste steht in `packages/domain/src/attachment.ts`.
 *  - **Er erzeugt den Dateinamen** der Kopie und übernimmt ihn nicht aus der
 *    Quelle (A-A-17). Ein Name aus einer fremden Datei ist fremder Text an
 *    einem Ort, an dem er zum Pfad wird.
 *  - **Er wirft nicht.** Jeder Fehlschlag ist ein Wert aus einem geschlossenen
 *    Vorrat (`ImageRejection`), damit ein unlesbares Bild eine Anzeige nach
 *    A-19.15 ergibt und keine Fehlerfläche.
 */
export interface AttachmentBlobPort {
  /**
   * Liest eine Bilddatei, prüft sie und legt eine Kopie an.
   *
   * `sourcePath` kommt aus dem Dateiauswahldialog der Hülle
   * (`dialog:allow-open` mit `directory: false`, A-A-11) — der Benutzer hat
   * die Datei gesehen und ausgewählt, bevor irgendetwas geschieht.
   *
   * Zurück kommt der **erzeugte** Name der Kopie. Er ist der Wert, der in
   * `todo_attachment.target` landet.
   */
  copyImage(
    sourcePath: string,
  ): Promise<
    | { readonly ok: true; readonly name: string; readonly mediaType: string; readonly bytes: number }
    | { readonly ok: false; readonly reason: ImageBlobFailure }
  >;
  /**
   * Liest eine Kopie zurück, für die Anzeige (E-071 Punkt 3).
   *
   * Der Aufrufer baut daraus eine `data:`-Adresse. Die CSP wird dafür **nicht**
   * geöffnet: `img-src` bleibt `'self' data:` (A-A-12).
   *
   * `name` ist ein von diesem Port **erzeugter** Name aus dem Bestand. Der
   * Adapter prüft ihn trotzdem — zwischen Erzeugen und Lesen liegt der
   * Bestand, und das ist derselbe Grund wie bei E-072 Punkt 2.
   */
  readImage(
    name: string,
  ): Promise<
    | { readonly ok: true; readonly mediaType: string; readonly data: Uint8Array }
    | { readonly ok: false; readonly reason: ImageBlobFailure }
  >;
  /** Schreibt eine bereits geprüfte Bildkopie aus einem Takt-Datenarchiv zurück. */
  restoreImage(
    name: string,
    data: Uint8Array,
  ): Promise<
    | { readonly ok: true; readonly mediaType: string; readonly bytes: number }
    | { readonly ok: false; readonly reason: ImageBlobFailure }
  >;
  /**
   * Entfernt eine Kopie (A-A-18).
   *
   * Eine Kopie, die es nicht gibt, ist **kein** Fehlschlag: Das Ziel ist „sie
   * liegt danach nicht mehr da", und das ist erreicht.
   *
   * ---------------------------------------------------------------------------
   * Warum hier ein Wert zurückkommt und kein `void`
   * ---------------------------------------------------------------------------
   *
   * Bis T-159 gab diese Methode `void` zurück und der Adapter verschluckte
   * jeden Fehlschlag. Ein Bild, das sich nicht löschen läßt — unter Windows
   * genügt ein offener Betrachter (`EBUSY`) —, blieb damit als Kundenmaterial
   * **ohne Eigentümer** im Anwendungsdatenverzeichnis liegen, und kein
   * Aufrufer und keine Protokollzeile wußte davon. Genau den Zustand schließt
   * A-A-18 aus.
   *
   * Der Rückgabewert ändert **nichts** an der Antwort an den Benutzer: Der
   * Anhang ist entfernt, und das stimmt. Er ist die Möglichkeit, es zu
   * erfahren — und damit die Bedingung dafür, daß ein späterer Aufrufer
   * anders entscheiden kann als „gar nicht hinsehen".
   */
  removeImage(name: string): Promise<ImageRemoval>;
  /**
   * Die Namen der Kopien, die im Bildverzeichnis liegen (A-A-18).
   *
   * **Nur Namen, die dieser Port erzeugt haben könnte.** Alles andere im
   * Verzeichnis — ein Unterordner, eine `.tmp` aus einem Abbruch, eine Datei,
   * die jemand dort abgelegt hat — bleibt ungenannt und wird damit vom
   * Aufräumen nie angefasst. Die Form ist dieselbe wie beim Lesen und beim
   * Entfernen; sie steht an einer Stelle im Adapter.
   *
   * Gibt es kein Verzeichnis oder lässt es sich nicht lesen, ist die Liste
   * **leer**. Das ist der Regelfall einer frischen Einrichtung und kein
   * Fehlschlag: Wo nichts liegt, ist auch nichts verwaist.
   *
   * Diese Methode beantwortet keine Anfrage. Sie ist die eine Hälfte des
   * Aufräumens beim Start; die andere ist seit T-315
   * {@link AttachmentPort.attachmentsNamingFiles} — dieselbe Frage, die auch der
   * Lauf über die E-Mail-Dateien stellt.
   */
  listImages(): Promise<readonly string[]>;

  /**
   * Ist das ein Name, den das **Bildverzeichnis** tragen kann? (A-A-18, T-315.)
   *
   * Zurück kommt der Name selbst — der Wert, mit dem {@link removeImage}
   * arbeitet — oder `null`, wenn die Form nicht stimmt oder es gar kein
   * Anwendungsdatenverzeichnis gibt. Sie fragt das Dateisystem **nicht**; ob die
   * Datei da ist, sagt sie nicht.
   *
   * ---------------------------------------------------------------------------
   * Warum ein Name und kein Pfad — und warum überhaupt eine Methode
   * ---------------------------------------------------------------------------
   *
   * Dieselbe Rolle wie {@link emailFilePathOf} im anderen Ordner: Der Aufräumlauf
   * braucht **einen** Wert, unter dem er eine Datei später entfernt, und er
   * braucht ihn, bevor er den Bestand fragt. Für eine übernommene E-Mail-Datei
   * ist dieser Wert der volle Pfad (er steht so in `todo_attachment.target`), für
   * eine Bildkopie ist es der bloße Name (so steht er dort, und so nimmt ihn
   * {@link removeImage}).
   *
   * Einen Pfad zurückzugeben, den niemand benutzt, wäre ein Pfad mehr im
   * Speicher und einer mehr, der in eine Protokollzeile rutschen kann (B-2.4).
   * Die Formprüfung bleibt damit an **einer** Stelle im Adapter — dieselbe, die
   * {@link listImages} und {@link removeImage} anwenden.
   */
  imageNameOf(name: string): string | null;

  /**
   * **Der Ordner** der Bildkopien auf diesem Rechner — oder `null`, wenn es kein
   * Anwendungsdatenverzeichnis gibt (A-A-18, A-A-98, T-315).
   *
   * Wortgleich die Begründung von {@link emailFileFolder}, nur für den anderen
   * Ordner: Der Aufräumlauf spannt seinen Widerspruchsriegel **von der anderen
   * Seite** auf und fragt den Bestand, welche Namen er in **diesem** Ordner
   * erwartet ({@link AttachmentPort.attachmentNamesUnder}). Dafür muß jemand
   * sagen, welcher Ordner gemeint ist; ihn aus einem Dateipfad zurückzurechnen
   * wäre dieselbe Zerlegung an einer zweiten Stelle.
   *
   * Sie gibt **keine** Auskunft darüber, ob der Ordner existiert.
   */
  imageFolder(): string | null;

  /**
   * Legt eine **Datei aus einer fremden E-Mail** ab (A-19.23, A-A-78, A-A-79).
   *
   * -------------------------------------------------------------------------
   * Was diese Methode **nicht** entgegennimmt, und das ist ihr ganzer Punkt
   * -------------------------------------------------------------------------
   *
   * **Keinen Namen.** Nicht den aus der E-Mail, nicht einen bereinigten, nicht
   * einen vorgeschlagenen. Der Name auf der Platte ist `<32 Hexziffern>` mit
   * der Endung, die der Aufrufer aus `nameEmailFile` der Domäne bekommen hat —
   * und die ist auf `[a-z0-9]`, höchstens 16 Zeichen, beschränkt.
   *
   * Damit sind Pfadausbruch, Gerätename (`NUL`, `COM1`, `CON.txt`),
   * Richtungszeichen, Doppelendung, Kollision und Kappung **nicht abgewehrt,
   * sondern unmöglich** — die Fehlerklasse aus T-297 (25 Namen hinein, 25
   * Dateien auf der Platte, null Ablehnungen) kommt nie in die Nähe eines
   * Pfadbestandteils. Ein zweiter Namensfilter wäre der teurere und
   * schwächere Weg (A-A-80 nennt ihn ausdrücklich als Alternative, nicht als
   * Ergänzung).
   *
   * **Keine Größenangabe.** `detail.size` ist eine Behauptung des Absenders
   * (A-A-15, A-A-81). Gezählt wird, was ankommt: `data.byteLength`, vom
   * Aufrufer geprüft, und hier ein zweites Mal als Boden.
   *
   * -------------------------------------------------------------------------
   * Geschrieben wird ohne Ausweichen und ohne Nachsehen (A-A-79)
   * -------------------------------------------------------------------------
   *
   * `open(ziel, 'wx', 0600)` in einem Verzeichnis mit `0700` — **kein**
   * `existsSync`-dann-`writeFile` wie in der Vorlage. Das ist ein TOCTOU-Paar,
   * und es folgt auf POSIX einem **baumelnden** Symlink an einen fremden Ort.
   * Ein bereits vorhandener Eintrag ist ein **Fehlschlag** und kein Ausweichen
   * auf „(2)"; bei einem erzeugten Namen aus 128 Bit ist er so wahrscheinlich
   * wie eine doppelte UUID.
   *
   * Zurück kommt der **volle Pfad**: Er ist der Wert, der in
   * `todo_attachment.target` landet, denn eine übernommene Datei ist ein
   * gewöhnlicher Dateianhang (A-19.26) und wird über den Öffnen-Befehl der
   * Hülle geöffnet — der einen absoluten Pfad verlangt.
   */
  storeEmailFile(
    data: Uint8Array,
    extension: string | null,
  ): Promise<
    | { readonly ok: true; readonly name: string; readonly path: string; readonly bytes: number }
    | { readonly ok: false; readonly reason: EmailFileFailure }
  >;

  /**
   * Entfernt eine übernommene E-Mail-Datei (A-A-83, dieselbe Sache wie
   * {@link removeImage}).
   *
   * **Der Pfad wird geprüft, bevor gelöscht wird**, und zwar an derselben
   * Form, in der er erzeugt wurde: Der Ordner muß der Ordner der E-Mail-Dateien
   * sein und der Name muß einer sein, den {@link storeEmailFile} erzeugt haben
   * könnte. Zwischen dem Schreiben und diesem Aufruf liegt der Bestand, und in
   * den wird ohne diesen Port geschrieben (VG-1, VG-3) — ein `target`, das
   * jemand auf `takt.db` gesetzt hat, darf hier nicht zu einem `rm` werden.
   *
   * Das ist wörtlich die Lehre aus T-156-1, T-164-1 und T-297: **Geprüft wird,
   * was benutzt wird.**
   */
  removeEmailFile(target: string): Promise<BlobRemoval>;

  /**
   * Die Namen der E-Mail-Dateien, die im Ordner liegen — dieselbe Rolle wie
   * {@link listImages} und mit derselben Zusage: nur Namen, die dieser Port
   * erzeugt haben könnte, und nur Dateien.
   */
  listEmailFiles(): Promise<readonly string[]>;

  // -------------------------------------------------------------------------
  // Die Datensicherung trägt die Bytes mit (A-19.34, A-A-90, Archivfassung 6)
  // -------------------------------------------------------------------------

  /**
   * Liest eine übernommene E-Mail-Datei zurück — für die Datensicherung
   * (A-19.34).
   *
   * -------------------------------------------------------------------------
   * Warum es diese Methode überhaupt gibt
   * -------------------------------------------------------------------------
   *
   * Bis T-301 nahm die Sicherung die **Zeile** mit und die **Datei** nicht. Der
   * Befund, der das umgeworfen hat, war eine Messung und keine Vorliebe: Ein
   * **Bild**anhang reist samt Bytes (`ArchivedImage`), eine übernommene Rechnung
   * nicht. Dieselbe Handlung des Benutzers, zwei Ergebnisse — und danach ein
   * Anhang, der auf dem neuen Rechner auf nichts zeigt.
   *
   * -------------------------------------------------------------------------
   * Der Eingabewert ist der `target` aus dem Bestand, nicht ein Name
   * -------------------------------------------------------------------------
   *
   * Für eine E-Mail-Datei steht in `todo_attachment.target` der **volle Pfad**
   * (A-19.26: sie ist ein gewöhnlicher Dateianhang und wird über den
   * Öffnen-Befehl der Hülle geöffnet, der einen absoluten Pfad verlangt). Er
   * wird hier **nicht benutzt, wie er dasteht**, sondern durch dieselbe Form
   * zurückgeprüft, durch die er beim Schreiben ging — genau wie bei
   * {@link removeEmailFile} und aus demselben Grund: Zwischen dem Schreiben und
   * diesem Aufruf liegt der Bestand, und in den kann ohne diesen Port
   * geschrieben werden (VG-1, VG-3). Ein `target`, das jemand auf `takt.db`
   * oder auf ein Dokument des Benutzers gesetzt hat, darf **niemals** in eine
   * Datensicherung wandern.
   *
   * **Gezählt wird beim Lesen** (A-A-15), nicht aus `stat`: Die Datei liegt im
   * Anwendungsdatenverzeichnis, und jeder Prozeß im Benutzerkonto kann sie
   * ersetzen. Über {@link MAX_EMAIL_ATTACHMENT_BYTES} bricht der Lauf ab —
   * nichts gelesen, nichts kodiert.
   *
   * Zurück kommt der **erzeugte Name** (ohne Ordner) und die Bytes. Der Name
   * ist der Schlüssel, unter dem die Datei im Archiv steht und unter dem
   * {@link restoreEmailFile} sie wieder anlegt; der Pfad des Quellrechners geht
   * das Zielsystem nichts an.
   */
  readEmailFile(
    target: string,
  ): Promise<
    | { readonly ok: true; readonly name: string; readonly data: Uint8Array }
    | { readonly ok: false; readonly reason: EmailFileReadFailure }
  >;

  /**
   * Schreibt eine E-Mail-Datei aus einem Datenarchiv zurück (A-19.34).
   *
   * Das Gegenstück zu {@link restoreImage}, und mit denselben zwei
   * Unterschieden zu {@link storeEmailFile}:
   *
   *  - **Der Name kommt mit** und wird nicht erzeugt. Er stammt aus dem Archiv
   *    und ist damit **fremder Text** — deshalb geht er durch dieselbe Form wie
   *    jeder gelesene Name (`<32 Hexziffern>[.<endung>]`). Ein Eintrag namens
   *    `../takt.db` scheitert hier, nicht an einer Prüfung weiter vorn.
   *  - **Ein vorhandener Eintrag wird überschrieben**, nicht abgelehnt. Das
   *    Einspielen eines Archivs **ersetzt** den Bestand (A-20.5); ein Archiv,
   *    das auf demselben Rechner entstanden ist, nennt Namen, die dort schon
   *    liegen. `wx` wäre hier falsch: Es machte den Regelfall zum Fehlschlag.
   *    Geschrieben wird über eine Nachbardatei und `rename` — ein Abbruch
   *    mitten im Schreiben hinterläßt dann **die alte** Datei und keine halbe.
   *
   * Zurück kommt der **volle Pfad** auf **diesem** Rechner. Er ist der Wert,
   * den der Aufrufer in `todo_attachment.target` einträgt, und er ist der
   * Grund, warum A-19.34 überhaupt aufgeht: Der Pfad im Archiv ist der des
   * Quellrechners und dort, wo die Sicherung ankommt, sicher falsch.
   */
  restoreEmailFile(
    name: string,
    data: Uint8Array,
  ): Promise<
    | { readonly ok: true; readonly path: string; readonly bytes: number }
    | { readonly ok: false; readonly reason: EmailFileFailure }
  >;

  /**
   * Wo eine E-Mail-Datei dieses Namens auf **diesem** Rechner läge — ohne
   * nachzusehen, ob sie da ist.
   *
   * Die einzige Methode dieses Ports, die nichts tut: keine Anfrage an das
   * Dateisystem, kein Lesen, kein Schreiben, deshalb auch kein `Promise`.
   *
   * Sie ist trotzdem nötig, und zwar für genau einen Fall: Ein Archiv der
   * Fassungen 1 bis 5 trägt die Zeilen, aber **keine Bytes**. Der Pfad in der
   * Zeile ist der des Quellrechners. Ihn stehen zu lassen hieße, dem Benutzer
   * in der Rückfrage vor dem Öffnen einen Pfad zu nennen, den es hier nicht
   * gibt — eine Aussage über einen fremden Rechner an der Stelle, an der er
   * eine über seinen erwartet (A-A-6). Der Aufrufer setzt deshalb auch ohne
   * Bytes den **hiesigen** Pfad ein; die Datei fehlt dann, und **das** ist der
   * Zustand aus A-19.15, den die Oberfläche an Ort und Stelle sagt.
   *
   * `null`, wenn der Name keiner ist, den dieser Port erzeugt hätte, oder wenn
   * es gar kein Anwendungsdatenverzeichnis gibt.
   */
  emailFilePathOf(name: string): string | null;

  /**
   * **Der Ordner** der übernommenen E-Mail-Dateien auf diesem Rechner — oder
   * `null`, wenn es kein Anwendungsdatenverzeichnis gibt (A-A-98).
   *
   * Die zweite Methode dieses Ports, die nichts tut. Sie steht hier, weil der
   * Aufräumlauf seinen Widerspruchsriegel **von der anderen Seite** aufspannen
   * muß: Er fragt den Bestand, welche Namen er in **diesem** Ordner erwartet
   * ({@link AttachmentPort.attachmentNamesUnder}), und dafür muß jemand sagen,
   * welcher Ordner gemeint ist. Ihn aus `emailFilePathOf` zurückzurechnen wäre
   * dieselbe Zerlegung an einer zweiten Stelle — und zwei Zerlegungen desselben
   * Pfades sind die Bauart, an der T-313-1 hing.
   *
   * Sie gibt **keine** Auskunft darüber, ob der Ordner existiert.
   */
  emailFileFolder(): string | null;
}

/**
 * Warum eine übernommene E-Mail-Datei nicht gelesen werden konnte (A-19.34).
 *
 * Geschlossener Vorrat, vier Werte, keiner trägt einen Pfad oder eine Meldung
 * des Betriebssystems. Kein `not_an_image`-Gegenstück: Was für eine Datei das
 * ist, entscheidet in diesem Bestand niemand (A-A-88).
 */
export type EmailFileReadFailure =
  /**
   * Der `target` ist keiner, den {@link AttachmentBlobPort.storeEmailFile}
   * erzeugt hätte — oder es gibt kein Verzeichnis. Es wurde **nichts** gelesen.
   */
  | 'unknown_name'
  /** Nicht vorhanden, nicht lesbar. Der Regelfall nach A-19.15. */
  | 'unreadable'
  /** Über {@link MAX_EMAIL_ATTACHMENT_BYTES} — beim Lesen gezählt, nicht aus `stat`. */
  | 'too_large'
  /** Leer. Eine Datei ohne Bytes ist keine. */
  | 'empty';

/**
 * Warum eine E-Mail-Datei nicht abgelegt werden konnte.
 *
 * Geschlossener Vorrat, und deutlich kürzer als {@link ImageBlobFailure}: Es
 * wird nichts **gelesen** — die Bytes liegen bereits im Speicher — und nichts
 * an einer Kopfsignatur erkannt. Eine E-Mail-Datei ist ein Bytefeld; was für
 * eines, entscheidet weder dieser Port noch sonst jemand in diesem Bestand
 * (A-A-88).
 */
export type EmailFileFailure =
  /** Leer. Eine Datei ohne Bytes ist keine. */
  | 'empty'
  /** Über {@link MAX_EMAIL_ATTACHMENT_BYTES} — an den Bytes gezählt. */
  | 'too_large'
  /**
   * Die Endung ist keine, die dieser Port an einen erzeugten Namen hängt.
   * Kommt nicht vor, solange der Aufrufer `nameEmailFile` der Domäne fragt —
   * und steht hier, weil „kommt nicht vor" keine Zusage ist, sondern eine
   * Erwartung an den Aufrufer.
   */
  | 'bad_extension'
  /** Kein Ort eingerichtet, Verzeichnis nicht anlegbar, Schreiben gescheitert. */
  | 'write_failed';

/**
 * Was aus dem Entfernen einer Bildkopie geworden ist (A-A-18).
 *
 * Geschlossener Vorrat, drei Werte, keiner davon trägt einen Pfad oder eine
 * Fehlermeldung des Betriebssystems.
 */
export type BlobRemoval =
  /** Sie liegt danach nicht mehr da — gelöscht, oder es gab sie schon nicht mehr. */
  | 'removed'
  /**
   * Der Name ist keiner, den dieser Port erzeugt hätte, oder es gibt gar kein
   * Bildverzeichnis. Es wurde **nichts** angefaßt.
   */
  | 'unknown_name'
  /** Sie liegt noch da. Der Grund steht im Protokoll, nicht in diesem Wert. */
  | 'failed';

/**
 * Der bisherige Name von {@link BlobRemoval}.
 *
 * Er stammt aus T-159, als es nur Bildkopien gab. Seit A-19.23 entfernt
 * derselbe Vorrat auch übernommene E-Mail-Dateien; der Typ ist zeichengleich
 * geblieben, nur sein Name war eine Aussage über den einen Aufrufer, den es
 * damals gab. Beide Namen stehen, damit die Umbenennung keinen Aufrufer
 * kostet, der mit der Sache nichts zu tun hat.
 */
export type ImageRemoval = BlobRemoval;

/** Warum eine Bilddatei nicht gelesen oder nicht übernommen werden konnte. */
export type ImageBlobFailure =
  /** Nicht vorhanden, nicht lesbar, kein Verzeichnis vorhanden. */
  | 'unreadable'
  /** Über {@link MAX_ATTACHMENT_IMAGE_BYTES} — beim Lesen gezählt. */
  | 'too_large'
  /** Leer. Eine Datei ohne Bytes hat keine Kopfsignatur. */
  | 'empty'
  /** Die Kopfsignatur gehört zu keiner der vier erlaubten Bildarten. */
  | 'not_an_image'
  /** Der Name ist keiner, den dieser Port erzeugt hätte. */
  | 'bad_name'
  /** Das Schreiben der Kopie ist gescheitert. */
  | 'write_failed';

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

  /**
   * Löschen. Zwei fachliche Gründe können es verhindern (A-4.5, E-057).
   *
   * `tag_folder_not_empty` — der Ordner enthält Unterordner oder Tags.
   *
   * `tag_in_use` — der Ordner steht in der Regel eines Pools oder einer
   * Kanban-Spalte. Derselbe Schlüssel wie beim Tag in einer Regel, weil es
   * derselbe Sachverhalt ist; welches Ding gemeint ist, sagt die Route. Bis
   * T-089 fehlte dieser Grund, `pool_rule.folder_id` stand auf CASCADE, und
   * das Löschen eines **leeren** Ordners entkernte die Regel still — sie traf
   * danach mehr, als der Benutzer gesagt hatte. Seit Migration 0012 steht die
   * Spalte auf RESTRICT; die Prüfung im Adapter nennt den fachlichen Grund,
   * bevor die Datenbank ihn nennen muss.
   *
   * Die Antwort trägt in `details` je betroffener Regel einen Eintrag mit
   * `code: 'pool_rule'`, der **Kennung** in `field`, dem bloßen **Namen** in
   * `name` und demselben Namen im Satz `message` (W-11). Ohne sie ist die
   * Sperre bei zwanzig Regeln eine Suche.
   */
  remove(
    id: TagFolderId,
  ): Promise<Result<void, TaktError<'tag_folder_not_empty' | 'tag_in_use' | 'not_found'>>>;
}

// ---------------------------------------------------------------------------
// Pools **und** Kanban-Spalten (A-3.4, E-054)
//
// Eine Entität, zwei Flächen. Seit E-054 ist eine Kanban-Spalte eine Regel wie
// ein Pool — seit E-055 über fünf Achsen und nicht allein über Tags;
// `Pool.placement` sagt, wo sie erscheint. Es gibt deshalb keinen
// `BoardColumnPort` — er wäre dieser hier, noch einmal abgeschrieben.
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
   * ---------------------------------------------------------------------------
   * Warum es überhaupt eine Vorgabe gibt — richtiggestellt (T-093)
   * ---------------------------------------------------------------------------
   *
   * **Ohne Argument gilt `'pool'`.** Hier stand bis T-093 als Zeuge dafür
   * `poolNamer` in `routes/addin/service.ts`, „der die Pools eines Todos beim
   * Namen nennt". Das war schon bei der Niederschrift kein guter Zeuge und ist
   * seit T-090/T-092 gar keiner mehr: `poolNamer` fragte versehentlich ohne
   * Argument und übersah damit jede **reine** Board-Spalte (R-1 Befund 3, R-2
   * B-4); er ruft seit T-090 `list('all')` und ist seit T-092 durch
   * `poolMovementNamer` ersetzt, den es hier nicht mehr gibt.
   *
   * Die Vorgabe bleibt trotzdem, und zwar mit den beiden Zeugen, die sie
   * wirklich tragen — beide fragen nach einer **Auswahlliste für einen
   * Menschen**, nicht nach einer Zugehörigkeit:
   *
   *   - `GET /pools` ohne `placement` — die Pool-Ansicht (`listPools` in
   *     `features/structure/structure.ts`). Sie zeigt die Pool-Liste, und eine reine
   *     Board-Spalte gehört dort nicht hinein.
   *   - `GET /addin/context` — der Aufgabenbereich des Add-ins. Er hat kein
   *     Board; die Liste dient dort der Auswahl. Dass er bei `list()` bleibt,
   *     ist ausdrücklich entschieden (E-058 Punkt 7).
   *
   * **Wer über Zugehörigkeit rechnet, fragt `'all'`** und nicht die Vorgabe:
   * `poolMovementNamer` (`pool-movement.ts`, E-058 Absatz 1) will
   * jede Regel sehen, gleich auf welcher Fläche sie erscheint — eine Bewegung
   * aus einer reinen Board-Spalte heraus ist eine Bewegung. Das Board fragt
   * ausdrücklich `'board'`.
   *
   * Die Lehre aus dem falschen Zeugen steht besser hier als in einem Bericht:
   * Eine Vorgabe, die mit einem Aufrufer begründet wird, überlebt den Aufrufer.
   * Diese hier ist mit der **Frage** begründet — Auswahlliste gegen
   * Zugehörigkeit —, und die bleibt, auch wenn die Dateien wechseln.
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
   * dass diese hier zwei Dinge zurückgäbe.
   *
   * ---------------------------------------------------------------------------
   * Wer diese beiden Methoden noch ruft — richtiggestellt (O-I, T-089)
   * ---------------------------------------------------------------------------
   *
   * Hier stand bis T-089: „An dieser Signatur hängt ein Aufrufer in fremder
   * Hoheit (`routes/addin/service.ts`)." Das stimmt seit T-086 nicht mehr —
   * der Ausschnitt dort heißt `Pick<PoolPort, 'list' | 'resolveAxes'>`, und
   * der Add-in-Dienst löst über {@link PoolPort.resolveAxes} auf, weil er seit
   * E-057 wissen muss, **welcher** genannte Ordner nichts beigetragen hat.
   *
   * In `src` gibt es damit **keinen** Aufrufer mehr. Es rufen nur noch die
   * Prüffälle (`packages/storage/test/repo-tags.test.ts`) und die Attrappe im
   * Nachweispfad des Add-ins. Eine tote Portfläche mit einer Begründung, die
   * nicht mehr stimmt, ist schlechter als tote Portfläche allein — beim
   * nächsten Mal glaubt ihr jemand.
   *
   * Die Streichung selbst ist **nicht** hier entschieden: Sie zöge zwei
   * Dateien in fremder Hoheit nach (der Prüffall und die Attrappe), und beide
   * gehören nicht dem domain-dev. Der Vorschlag steht im Bericht zu T-089.
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
   * Die schmalen Methoden bleiben daneben stehen — für den, der nur die
   * Tagmenge braucht, sind sie weiterhin die genügsamere Frage. Dass sie in
   * `src` keinen Aufrufer mehr haben, steht an `resolveRule`; ob sie deshalb
   * entfallen, entscheidet der Orchestrator (O-I).
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
  /** Separates the completed idle window and continues from return, atomically. */
  separateIdle(entryId: TimeEntryId, startedAt: Timestamp, returnedAt: Timestamp, now: Timestamp): Promise<Result<RunningTimeEntry, TaktError>>;
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

/** A-24: genau eine noch nicht zugeordnete Inaktivitätsphase. */
export interface IdleSession {
  readonly id: TimeEntryId;
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly returnedAt: Timestamp | null;
  readonly note: string;
}

export interface IdleTimerPort {
  pending(): Promise<IdleSession | null>;
  begin(session: IdleSession): Promise<void>;
  returned(id: TimeEntryId, at: Timestamp): Promise<void>;
  clear(id: TimeEntryId): Promise<void>;
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
 *   - **Der Anwendungsfall** (`apps/local-api/src/features/export/export.ts`) führt
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

/**
 * Der Zeitpunkt der letzten Anfrage der Versionsprüfung (A-V-11, A-20.4,
 * Migration 0022, T-279, T-285).
 *
 * ===========================================================================
 * Wozu der Wert da ist — und wozu seit T-285 nicht mehr
 * ===========================================================================
 *
 * Er war in T-279 der **Bezugspunkt des harten Bodens über Prozeßgrenzen
 * hinweg**: Ein neu gestarteter Dienst las ihn und schwieg, wenn die letzte
 * Anfrage weniger als eine Stunde zurücklag. Das ist zurückgenommen. Der
 * Boden gilt innerhalb eines Laufs, und **ein Programmstart prüft immer
 * einmal** — sonst nähme ein Neustart dem Benutzer die einzige Selbsthilfe,
 * die E-069 ihm läßt (Begründung in
 * `apps/local-api/src/features/version/version.ts`).
 *
 * Was bleibt, ist eine **Tatsache**: „wann hat dieses Erzeugnis zuletzt
 * gefragt". Sie wird vor jeder ausgehenden Anfrage geschrieben und nimmt am
 * Round-Trip der Datensicherung teil (A-20.4). **Kein Betriebspfad liest sie
 * mehr.** {@link VersionCheckStatePort.lastCheckAt} bleibt trotzdem stehen —
 * als die Naht, an der ein Prüffall den Schreiber überhaupt messen kann
 * (`packages/storage/test/repo-version-check.test.ts`). Ein Schreiber ohne
 * Leser ist ein Schreiber ohne Nachweis.
 *
 * Wer `lastCheckAt()` wieder an die Versionsprüfung hängt, baut T-279 nach.
 *
 * ===========================================================================
 * Warum das ein eigener Port ist und nicht ein Feld in `AppSettingsPort`
 * ===========================================================================
 *
 * Der Wert liegt in derselben Zeile wie die Einstellungen — `app_setting`, eine
 * Zeile, feste Felder (E-011). Er ist trotzdem **keine Einstellung**: Niemand
 * setzt ihn, niemand liest ihn, er erscheint in keiner Route und in keiner
 * Oberfläche.
 *
 * Stünde er in `AppSettings`, wäre er über `GET /settings` sichtbar, und das
 * ist genau die Fehlerfläche, die A-18.11 verbietet („kein Hinweis, keine
 * Fehlerfläche, kein Zeitstempel ‚zuletzt geprüft'"). Ein eigener Port hält die
 * Trennung an der einzigen Stelle, an der sie sich nicht versehentlich
 * auflösen kann: Der Weg zu diesem Wert führt nicht durch den Weg zu den
 * Einstellungen.
 *
 * Er hängt deshalb auch **nicht** an der {@link UnitOfWork}. Sein einziger
 * Aufrufer ist die Versionsprüfung des Dienstes, und die liegt außerhalb jeder
 * Anwendungsfall-Transaktion — sie läuft an einem Zeitgeber, nicht an einer
 * Anfrage.
 *
 * ===========================================================================
 * Zwei Fragen, keine dritte
 * ===========================================================================
 *
 * Es gibt kein „zurücksetzen" und kein „löschen". `null` entsteht genau einmal,
 * nämlich durch die Migration, und heißt „noch nie gefragt". Eine Tür, die den
 * Wert von außen verstellt, wäre eine Fläche für einen Wert, den niemand
 * sehen soll.
 */
export interface VersionCheckStatePort {
  /**
   * Der Zeitpunkt der letzten **ausgehenden** Anfrage, oder `null`.
   *
   * `null` heißt „noch nie gefragt". Das ist der Zustand jedes Bestands
   * unmittelbar nach Migration 0022.
   *
   * **Seit T-285 liest das kein Betriebspfad mehr** — weder die
   * Versionsprüfung noch eine Route noch die Datensicherung (die liest die
   * Spalte über `repo-data-archive.ts`). Die Frage bleibt, weil sie die
   * einzige Naht ist, an der {@link VersionCheckStatePort.recordCheck}
   * nachweisbar ist. Sie wieder an die Versionsprüfung zu hängen hieße, den
   * Boden über Prozeßgrenzen zurückzuholen und den Neustart erneut
   * stillzulegen.
   *
   * Ein Zeitstempel aus der Zukunft ist möglich (verstellte Uhr, eingespielte
   * Datensicherung von einem anderen Rechner) und wird hier **nicht**
   * ausgesiebt: Er ist eine gültige gespeicherte Angabe, und was aus ihr folgt,
   * entscheidet der Leser.
   */
  lastCheckAt(): Promise<Timestamp | null>;
  /**
   * Merkt den Zeitpunkt einer ausgehenden Anfrage — **vor** der Anfrage.
   *
   * Die Reihenfolge ist der Punkt und steht deshalb hier und nicht nur beim
   * Aufrufer: Wer erst fragt und dann merkt, hat den Boden für jeden Absturz
   * **während** der Anfrage wieder geöffnet, und das ist schwerer zu sehen als
   * gar kein Boden.
   */
  recordCheck(at: Timestamp): Promise<void>;
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
 * Was für ein Ort das ist — belegt, nicht geraten (T-039, B-5.2,
 * B-5.3 Punkt 3).
 *
 * Ein eigener Port neben `FilePort`, weil es eine andere Frage ist. Ob
 * geschrieben werden darf, hängt am Zustand des Ordners; was für ein Ordner das
 * ist, hängt nicht daran. Ein Systemverzeichnis bleibt eines, ob es nun
 * beschreibbar ist oder nicht, und eine Netzfreigabe bleibt eine, auch wenn sie
 * gerade nicht antwortet.
 *
 * **Nicht nur der Exportordner** (T-132, O-C). Bis dahin hieß die eine Frage
 * dieses Ports `describeExportDirectory`, und der Ort des Datenbestands bekam
 * gar keine Antwort — obwohl an ihm mehr hängt: Der Exportordner enthält, was
 * exportiert wurde, der Bestand enthält **alles**, einschließlich der internen
 * Vermerke (A-7.2). Liegt er in einem Synchronisierungsordner, verlässt die
 * Kundendatenbank den Rechner, und genau davor steht E-018.
 *
 * Der Adapter dazu liegt **nicht** in diesem Paket, sondern in
 * `apps/local-api/src/access/export-directory.ts` — bei den übrigen
 * Betriebssystem-Adaptern (Anwendungsdatenverzeichnis, Sitzungsgeheimnis,
 * Dateirechte). Er liest Umgebungsvariablen und Dateisystemarten; das ist
 * Auskunft über den Rechner und nicht über eine Speicherung.
 */
export interface DirectoryInsightPort {
  /**
   * Merkmale eines Ortes — eines Ordners oder einer Datei.
   *
   * `mayAskFileSystem` ist `false`, wenn die Prüfung eben in eine Zeitgrenze
   * gelaufen ist. Dann wird das Dateisystem nicht noch einmal gefragt — es liefe
   * in dieselbe Wand und verdoppelte die Wartezeit, die gerade abgebrochen
   * wurde. Übrig bleibt, was aus Pfad und Umgebung folgt, und das ist in genau
   * diesem Fall das Wichtigste: `unc` erklärt, warum nichts geantwortet hat.
   *
   * Eine leere Liste ist **keine** Entwarnung, sondern eine Nichtaussage.
   */
  describeLocation(
    path: string | null,
    options: { readonly mayAskFileSystem: boolean },
  ): Promise<readonly LocationTrait[]>;
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
  /**
   * Wie viele der drei Dateien des Bestands weiter liegen als `0600`
   * (B-7.2, T-132/O-C).
   *
   * Eine **Zahl** und keine Pfadliste: Der Aufrufer soll sagen können „zwei
   * Dateien liegen offen", nicht welche. Der Dienst protokolliert dieselbe Zahl
   * beim Start und merkt sie als Vorfall vor; über die Einstellungen ist sie
   * damit auch dann noch sichtbar, wenn niemand das Startprotokoll gelesen hat.
   *
   * `null` heißt „nicht messbar": unter Windows, wo der POSIX-Modus nichts
   * sagt und die geerbte ACL die Grenze trägt, und bei einem Bestand im
   * Arbeitsspeicher. `null` ist ausdrücklich **nicht** `0` — eine
   * Nichtaussage ist keine Entwarnung, genauso wie bei den Merkmalen oben.
   */
  databaseFilesTooPermissive(): number | null;
}
