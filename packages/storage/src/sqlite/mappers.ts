/**
 * Takt — von der Zeile zum Domänenwert.
 *
 * Eine Zeile ist ein `Record<string, SqlValue>`; ein Domänenwert trägt
 * markierte Kennungen und feste Vereinigungen. Zwischen beidem liegt genau
 * diese Datei.
 *
 * Die Umwandlung ist absichtlich ausgeschrieben und nicht generisch. Ein
 * automatischer Abbilder von `snake_case` auf `camelCase` nähme jede Spalte
 * mit, die jemand später ergänzt — auch `todo_note.body`, wenn er sie je in
 * eine Abfrage zöge. Ausgeschriebene Zugriffe sind die Fassung von E-017 auf
 * der Leseseite: Was nicht dasteht, kommt nicht heraus.
 */

import type {
  AppSettings,
  DefaultTag,
  ExportAuditEntry,
  ExportAuditEvent,
  ExportAuditId,
  ExportRun,
  ExportRunGroupId,
  ExportRunId,
  ExportStatus,
  ExportTemplateEnvelope,
  ExportTemplateId,
  Pool,
  PoolId,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolPlacement,
  PoolTagTerm,
  RoundingMode,
  RunningTimeEntry,
  StatusId,
  Tag,
  TagFolder,
  TagFolderId,
  TagId,
  TaktFieldError,
  TimeEntry,
  TimeEntryId,
  TimeEntrySource,
  Timestamp,
  Todo,
  TodoNote,
  TodoStatus,
} from '@takt/domain';

import { boolean, integer, text, textOrNull, type SqlRow, type SqlValue } from './database.ts';

/**
 * Markierte Kennungen sind zur Laufzeit Zeichenketten. Diese Umdeutung ist der
 * eine Ort, an dem die Marke vergeben wird — nach dem Lesen aus der Datenbank,
 * die keine Typen kennt.
 */
const brand = <T extends string>(value: string): T => value as T;

export const asTimestamp = (value: string): Timestamp => brand<Timestamp>(value);

export function toTodoStatus(row: SqlRow): TodoStatus {
  return {
    id: brand<StatusId>(text(row, 'id')),
    name: text(row, 'name'),
    position: integer(row, 'position'),
    isDefault: boolean(row, 'is_default'),
    color: textOrNull(row, 'color'),
    createdAt: asTimestamp(text(row, 'created_at')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

/**
 * Ein Todo **ohne** seinen internen Vermerk (A-7.2, R-06).
 *
 * Es gibt keine Abfrage in diesem Paket, die `todo` und `todo_note` verbindet
 * und dann hierher führt. Wer den Vermerk will, ruft `TodoNotePort.load` auf,
 * und dieser Aufruf ist im Quelltext auffindbar.
 */
export function toTodo(row: SqlRow, tagIds: readonly TagId[]): Todo {
  return {
    id: brand(text(row, 'id')),
    title: text(row, 'title'),
    callNumber: textOrNull(row, 'call_number'),
    statusId: brand<StatusId>(text(row, 'status_id')),
    completedAt: mapNullable(textOrNull(row, 'completed_at'), asTimestamp),
    tagIds,
    createdAt: asTimestamp(text(row, 'created_at')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

export function toTodoNote(row: SqlRow): TodoNote {
  return {
    todoId: brand(text(row, 'todo_id')),
    text: text(row, 'body'),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

export function toTag(row: SqlRow): Tag {
  return {
    id: brand<TagId>(text(row, 'id')),
    folderId: mapNullable(textOrNull(row, 'folder_id'), brand<TagFolderId>),
    name: text(row, 'name'),
    color: textOrNull(row, 'color'),
    createdAt: asTimestamp(text(row, 'created_at')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

export function toTagFolder(row: SqlRow): TagFolder {
  return {
    id: brand<TagFolderId>(text(row, 'id')),
    parentId: mapNullable(textOrNull(row, 'parent_id'), brand<TagFolderId>),
    name: text(row, 'name'),
    createdAt: asTimestamp(text(row, 'created_at')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

/**
 * Der Anzeigeort einer Regel (E-054).
 *
 * Alles, was nicht wörtlich `board` oder `both` ist, wird zu `pool` — dieselbe
 * Bauart wie bei `match_mode` daneben und aus demselben Grund: Ein Mapper
 * urteilt nicht, er liest, und ein unbekannter Wert darf keine Regel auf eine
 * Fläche stellen, die niemand gewählt hat. Ein Bestand vor Migration 0009 hat
 * die Spalte gar nicht; auch dann ist die Antwort `pool`, und das ist die
 * richtige.
 */
function toPoolPlacement(value: SqlValue | undefined): PoolPlacement {
  return value === 'board' || value === 'both' ? value : 'pool';
}

/**
 * Die Erledigt-Achse einer Regel (T-076).
 *
 * Dieselbe Bauart wie `toPoolPlacement` daneben: Alles, was nicht wörtlich
 * `done` oder `open` ist, wird zu `any` — dem **Neutralwert**. Ein Mapper
 * urteilt nicht, er liest; und ein unbekannter Wert darf keine Bedingung
 * erfinden, die niemand gesetzt hat. Ein Bestand vor Migration 0011 hat die
 * Spalte gar nicht, und auch dann ist `any` die richtige Antwort.
 */
export function toPoolCompletion(value: SqlValue | undefined): PoolCompletionFilter {
  return value === 'done' || value === 'open' ? value : 'any';
}

/** Die Exportstatus-Achse einer Regel (T-076). Siehe `toPoolCompletion`. */
export function toPoolExportState(value: SqlValue | undefined): PoolExportFilter {
  return value === 'open' || value === 'exported' ? value : 'any';
}

/**
 * Die übrigen Regelachsen, die als eigene Zeilen in `pool_rule` stehen (T-076).
 *
 * Freiwillig und leer als Vorgabe: `toPool(row, [])` bleibt damit ein
 * gültiger Aufruf, und ein Aufrufer, der nur die erforderlichen Tags kennt,
 * bekommt eine Regel, die genau das sagt — statt eine, die eine Achse
 * behauptet, die er nie gelesen hat.
 */
export interface PoolRuleParts {
  readonly excludedTags?: readonly PoolTagTerm[];
  readonly statusIds?: readonly StatusId[];
}

export function toPool(
  row: SqlRow,
  rule: readonly PoolTagTerm[],
  parts: PoolRuleParts = {},
): Pool {
  return {
    id: brand<PoolId>(text(row, 'id')),
    name: text(row, 'name'),
    matchMode: text(row, 'match_mode') === 'all' ? 'all' : 'any',
    includeSubfolders: boolean(row, 'include_subfolders'),
    placement: toPoolPlacement(row['placement']),
    position: integer(row, 'position'),
    rule,
    excludedTags: parts.excludedTags ?? [],
    statusIds: parts.statusIds ?? [],
    completion: toPoolCompletion(row['completion']),
    exportState: toPoolExportState(row['export_state']),
    createdAt: asTimestamp(text(row, 'created_at')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

/**
 * Eine Zeile aus `pool_rule` mit `role` `required` oder `excluded`.
 *
 * Statuszeilen kommen hier **nicht** an: Sie tragen keinen Term, sondern eine
 * Kennung, und `repo-tags.ts` liest sie als solche. Ein Mapper, der beides
 * könnte, müsste einen dritten Rückgabefall haben, den kein Aufrufer je
 * bekäme.
 */
export function toPoolRuleTerm(row: SqlRow): PoolTagTerm {
  const tagId = textOrNull(row, 'tag_id');
  if (tagId !== null) return { kind: 'tag', tagId: brand<TagId>(tagId) };
  return { kind: 'folder', folderId: brand<TagFolderId>(text(row, 'folder_id')) };
}

/**
 * Eine Regel als Feldangabe in `details` (R-3 H-2, R-1 Befund 1, T-089).
 *
 * ---------------------------------------------------------------------------
 * Warum die Kennung in `field` steht
 * ---------------------------------------------------------------------------
 *
 * `TaktFieldError` hat drei Felder: `field`, `code`, `message`. Bei einer
 * Löschanfrage gibt es kein Eingabefeld, dem etwas vorzuwerfen wäre — die
 * Anfrage besteht aus einem Pfadbestandteil und sonst nichts. `field` ist
 * damit der einzige Platz in der Hülle, der eine maschinenlesbare Angabe
 * tragen kann, und die Kennung der Regel ist genau das, was die Oberfläche
 * braucht: Sie soll dorthin verweisen können, wo der Benutzer den Term
 * herausnimmt.
 *
 * Der Vertrag lautet deshalb, und er steht so auch in der
 * Schnittstellenbeschreibung: **`code` ist `pool_rule`, `field` ist die
 * Kennung des Pools, `message` nennt ihn beim Namen.** Ein Aufrufer liest
 * `details.filter((d) => d.code === 'pool_rule')` und hat Kennung und Namen.
 *
 * Der Name kommt aus dem eigenen Bestand und nicht aus der Anfrage; er verrät
 * dem Aufrufer nichts, was ihm die Pool-Liste nicht ohnehin sagt (B-2.4).
 */
export function poolReference(row: SqlRow): TaktFieldError {
  return {
    field: text(row, 'id'),
    code: 'pool_rule',
    message: `Regel „${text(row, 'name')}“`,
  };
}

/**
 * Eine **abgeschlossene** Buchung.
 *
 * Wirft, wenn `ended_at` fehlt. Das ist Absicht: `TimeEntry` sagt per Vertrag
 * zu, dass Ende und Dauer vorhanden sind, und eine laufende Buchung ist
 * `RunningTimeEntry`. Ein `?? ''` an dieser Stelle erzeugte eine Buchung mit
 * Dauer 0 in einer Abrechnung — genau die Sorte stiller Fehler, die E-008
 * ausschließt.
 */
export function toTimeEntry(row: SqlRow): TimeEntry {
  const endedAt = textOrNull(row, 'ended_at');
  if (endedAt === null) {
    throw new Error('Eine laufende Buchung ist kein TimeEntry.');
  }
  return {
    id: brand<TimeEntryId>(text(row, 'id')),
    todoId: brand(text(row, 'todo_id')),
    startedAt: asTimestamp(text(row, 'started_at')),
    endedAt: asTimestamp(endedAt),
    durationSeconds: integer(row, 'duration_seconds'),
    note: text(row, 'note'),
    exportStatus: text(row, 'export_status') === 'exported' ? 'exported' : 'open',
    exportCount: integer(row, 'export_count'),
    source: toSource(text(row, 'source')),
    createdAt: asTimestamp(text(row, 'created_at')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

export function toRunningTimeEntry(row: SqlRow): RunningTimeEntry {
  return {
    id: brand<TimeEntryId>(text(row, 'id')),
    todoId: brand(text(row, 'todo_id')),
    startedAt: asTimestamp(text(row, 'started_at')),
    note: text(row, 'note'),
    source: 'timer',
  };
}

function toSource(value: string): TimeEntrySource {
  return value === 'manual' ? 'manual' : 'timer';
}

export function toExportStatus(value: string): ExportStatus {
  return value === 'exported' ? 'exported' : 'open';
}

export function toRoundingMode(value: string): RoundingMode {
  return value === 'nearest' ? 'nearest' : 'up';
}

export function toExportTemplate(row: SqlRow): ExportTemplateEnvelope {
  return {
    id: brand<ExportTemplateId>(text(row, 'id')),
    name: text(row, 'name'),
    isBuiltin: boolean(row, 'is_builtin'),
    // `definition` ist in der Domäne `unknown` (E-005): Das Vorlagenformat
    // gehört dem Motor, nicht dem Schema. Hier wird es deshalb nur gelesen und
    // nicht gedeutet — die Prüfung macht `validateExportTemplateDefinition`.
    definition: JSON.parse(text(row, 'definition')) as unknown,
    createdAt: asTimestamp(text(row, 'created_at')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

export function toExportRun(row: SqlRow): ExportRun {
  return {
    id: brand<ExportRunId>(text(row, 'id')),
    templateId: brand<ExportTemplateId>(text(row, 'template_id')),
    templateSnapshot: JSON.parse(text(row, 'template_snapshot')) as unknown,
    filePath: text(row, 'file_path'),
    fileSha256: text(row, 'file_sha256'),
    bytes: integer(row, 'byte_size'),
    entryCount: integer(row, 'entry_count'),
    totalQuarters: integer(row, 'total_quarters'),
    roundingMode: toRoundingMode(text(row, 'rounding_mode')),
    windowsUser: text(row, 'windows_user'),
    createdAt: asTimestamp(text(row, 'created_at')),
  };
}

/**
 * Der Ereignistyp des Protokolls, drei Werte seit E-047.
 *
 * Ausgeschrieben und nicht als zweiwertige Kurzform: Vor E-047 stand hier
 * `value === 'reset' ? 'reset' : 'exported'`, und eine `not_billed`-Zeile aus
 * der Datenbank kam als „exportiert" heraus — die Ausbuchung sähe im Protokoll
 * wie ein Export aus, also genau die Verwechslung, die E-047 aufhebt.
 *
 * Der Rückfall auf `exported` für unbekannte Werte bleibt, wie er war: Er ist
 * durch einen Prüfpfad festgehalten (`mappers.test.ts`), und ein
 * Zeichenkettenwert außerhalb der drei Literale kann ohnehin nur entstehen,
 * wenn jemand am CHECK der Tabelle vorbei geschrieben hat.
 */
function toExportAuditEvent(value: string): ExportAuditEvent {
  switch (value) {
    case 'reset':
      return 'reset';
    case 'not_billed':
      return 'not_billed';
    default:
      return 'exported';
  }
}

export function toExportAuditEntry(row: SqlRow): ExportAuditEntry {
  const event: ExportAuditEvent = toExportAuditEvent(text(row, 'event'));
  return {
    id: brand<ExportAuditId>(text(row, 'id')),
    timeEntryId: brand<TimeEntryId>(text(row, 'time_entry_id')),
    event,
    previousStatus: toExportStatus(text(row, 'previous_status')),
    newStatus: toExportStatus(text(row, 'new_status')),
    exportRunId: mapNullable(textOrNull(row, 'export_run_id'), brand<ExportRunId>),
    exportRunGroupId: mapNullable(textOrNull(row, 'export_run_group_id'), brand<ExportRunGroupId>),
    actor: text(row, 'actor'),
    reason: text(row, 'reason'),
    occurredAt: asTimestamp(text(row, 'occurred_at')),
  };
}

export function toAppSettings(row: SqlRow): AppSettings {
  return {
    exportDirectory: textOrNull(row, 'export_directory'),
    activeExportTemplateId: mapNullable(
      textOrNull(row, 'active_export_template_id'),
      brand<ExportTemplateId>,
    ),
    roundingMode: toRoundingMode(text(row, 'rounding_mode')),
    locale: text(row, 'locale'),
    theme: toTheme(text(row, 'theme')),
    updatedAt: asTimestamp(text(row, 'updated_at')),
  };
}

function toTheme(value: string): AppSettings['theme'] {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function toDefaultTag(row: SqlRow): DefaultTag {
  return {
    tagId: brand<TagId>(text(row, 'tag_id')),
    position: integer(row, 'position'),
  };
}

/** `null` bleibt `null`. Kein Wert wird erfunden, auch kein leerer. */
function mapNullable<T>(value: string | null, map: (input: string) => T): T | null {
  return value === null ? null : map(value);
}
