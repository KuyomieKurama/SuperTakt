/**
 * Takt — Anwendungsfälle für Struktur und Einstellungen
 * (A-3.*, A-4.*, A-5.*, A-8.7, E-011, E-012, R-10).
 *
 * Die Regeln stehen hier nicht: Zyklusfreiheit prüft `checkFolderMove` in der
 * Domäne, die Zulässigkeit eines Exportstatuswechsels
 * `checkExportStatusTransition`. Diese Datei ruft sie auf und klammert das
 * Schreiben — mehr nicht. Wer eine Fachregel hier findet, hat eine gefunden,
 * die an der falschen Stelle steht.
 */

import type {
  AppSettings,
  DefaultTag,
  ExportAuditEntry,
  ExportDirectoryTrait,
  ExportRun,
  ExportRunId,
  ExportStatus,
  ExportTemplateEnvelope,
  ExportTemplateId,
  Pool,
  PoolId,
  PoolPlacement,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolSurface,
  PoolTagTerm,
  RoundingMode,
  StatusId,
  Tag,
  TagFolder,
  TagFolderId,
  TagId,
  TagTree,
  TimeEntry,
  TimeEntryId,
  Todo,
  TodoFilter,
  TaktError,
  TodoStatus,
} from '@takt/domain';
import {
  checkExportStatusTransition,
  checkPoolName,
  checkTagName,
  err,
  nameKey,
  ok,
  taktError,
} from '@takt/domain';
import type { ExportAuditFilter, Page, Pagination, UnitOfWork } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from './context.ts';
import { checkTemplateDefinition } from './export.ts';

// ---------------------------------------------------------------------------
// Tags und Ordner (A-4.*)
// ---------------------------------------------------------------------------

/** A-10.4 — der vollständige Baum in **einem** Aufruf, beliebig tief. */
export function loadTagTree(context: AppContext): Promise<TagTree> {
  return context.transactions.inTransaction((unit) => unit.folders.loadTree());
}

export function listTagsInFolder(
  context: AppContext,
  folderId: TagFolderId | null,
): Promise<readonly Tag[]> {
  return context.transactions.inTransaction((unit) => unit.tags.listInFolder(folderId));
}

/**
 * Ein Tag anlegen (A-4.1).
 *
 * Der Name geht durch `checkTagName` — dieselbe Prüfung wie beim Anlegen eines
 * Todos mit neuem Tagnamen (T-058). Sie steht hier und nicht im Adapter: Ob ein
 * Name zulässig ist, ist eine fachliche Frage; der Adapter schreibt und
 * urteilt nicht (architektur.md 3.4).
 */
export function createTag(
  context: AppContext,
  folderId: TagFolderId | null,
  name: string,
  color: string | null,
): Promise<UseCaseResult<Tag>> {
  const checked = checkTagName(name);
  if (!checked.ok) return Promise.resolve(err(checked.error));

  const timestamp = now(context);
  return context.transactions.inTransaction((unit) =>
    unit.tags.create(folderId, checked.value.name, color, timestamp),
  );
}

export async function updateTag(
  context: AppContext,
  id: TagId,
  input: { readonly name?: string; readonly folderId?: TagFolderId | null; readonly color?: string | null },
): Promise<UseCaseResult<Tag>> {
  // Erst prüfen, dann eine Klammer öffnen. Siehe `createTag`.
  const checkedName = input.name === undefined ? null : checkTagName(input.name);
  if (checkedName !== null && !checkedName.ok) return err(checkedName.error);
  const newName = checkedName === null ? undefined : checkedName.value.name;

  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    let current = await unit.tags.load(id);
    if (current === null) return err(taktError('not_found', 'Dieses Tag gibt es nicht.'));

    if (newName !== undefined) {
      const renamed = await unit.tags.rename(id, newName, timestamp);
      if (!renamed.ok) return err(renamed.error);
      current = renamed.value;
    }
    if (input.folderId !== undefined) {
      const moved = await unit.tags.move(id, input.folderId, timestamp);
      if (!moved.ok) return err(moved.error);
      current = moved.value;
    }
    return ok(current);
  });
}

export function removeTag(context: AppContext, id: TagId): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.tags.remove(id));
}

export function createTagFolder(
  context: AppContext,
  parentId: TagFolderId | null,
  name: string,
): Promise<UseCaseResult<TagFolder>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.folders.create(parentId, name, timestamp));
}

export function renameTagFolder(
  context: AppContext,
  id: TagFolderId,
  name: string,
): Promise<UseCaseResult<TagFolder>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.folders.rename(id, name, timestamp));
}

/**
 * A-4.6 — Verschieben mit Zyklusprüfung.
 *
 * Prüfung und Schreiben liegen in **einer** Transaktion (im Adapter, siehe
 * `repo-tags.ts`). Eine Prüfung davor und ein Schreiben danach wären zwei
 * Schritte, und zwei gleichzeitige Verschiebungen könnten aneinander vorbei
 * einen Kreis erzeugen, den beide für ausgeschlossen hielten.
 */
export function moveTagFolder(
  context: AppContext,
  id: TagFolderId,
  newParentId: TagFolderId | null,
): Promise<UseCaseResult<TagFolder>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.folders.move(id, newParentId, timestamp));
}

export function removeTagFolder(
  context: AppContext,
  id: TagFolderId,
): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.folders.remove(id));
}

// ---------------------------------------------------------------------------
// Pools und Kanban-Spalten (A-3.*, A-5.*, E-054)
//
// Eine Entität, zwei Flächen. Wer eine Spalte anlegt, legt einen Pool mit
// `placement: 'board'` an; es gibt hier keinen zweiten Satz Anwendungsfälle für
// Spalten, weil er derselbe wäre. Das Board **liest** über `usecases/board.ts`.
// ---------------------------------------------------------------------------

/**
 * Die Regeln einer Fläche (A-3.1, E-054).
 *
 * Seit E-054 ist eine Kanban-Spalte dieselbe Entität wie ein Pool. `shownOn`
 * sagt, welche Fläche gemeint ist; ohne Angabe die Pool-Liste. Die Begründung
 * für diese Vorgabe steht am Port (`PoolPort.list`).
 */
export function listPools(
  context: AppContext,
  shownOn?: PoolSurface | 'all',
): Promise<readonly Pool[]> {
  return context.transactions.inTransaction((unit) => unit.pools.list(shownOn));
}

/**
 * Die Regel einer Fläche, wie eine Anfrage sie schickt (A-3.*, E-054, T-076).
 *
 * Fünf Achsen mit je einem Neutralwert. Alle außer `rule` sind weglassbar und
 * stehen dann neutral — eine Anfrage aus der Zeit vor T-076 legt damit
 * dieselbe Regel an wie zuvor.
 */
export interface PoolInput {
  readonly name: string;
  /** Wie die **erforderlichen** Tags verknüpft sind. Gilt für keine andere Achse. */
  readonly matchMode: 'any' | 'all';
  readonly includeSubfolders: boolean;
  /** Wo die Regel erscheint (E-054). Ohne Angabe ein Pool. */
  readonly placement?: PoolPlacement;
  readonly position: number;
  /** Erforderliche Tags. Leer: schränkt nicht ein. */
  readonly rule: readonly PoolTagTerm[];
  /** Ausgeschlossene Tags: keines davon (T-076). */
  readonly excludedTags?: readonly PoolTagTerm[];
  /** Status: einer von diesen. Leer heißt „Alle" (T-076). */
  readonly statusIds?: readonly StatusId[];
  /** Erledigt: alle / nur erledigte / nur unerledigte (T-076). */
  readonly completion?: PoolCompletionFilter;
  /** Exportstatus: alle / mit offener / mit exportierter Buchung (T-076). */
  readonly exportState?: PoolExportFilter;
}

/**
 * Ist dieser Name schon vergeben? (T-074)
 *
 * Die Antwort steht in der Domäne (`nameKey`) und nicht in SQL. Der eindeutige
 * Index `ux_pool_name` vergleicht mit `COLLATE NOCASE` und deckt damit A–Z und
 * sonst nichts: „Änderung“ und „änderung“ liefen aneinander vorbei, „back  end“
 * und „back end“ auch. Deshalb wird hier verglichen und der Index steht daneben
 * als schwächere, aber strukturelle Absicherung.
 *
 * **Warum das kein Wettlauf ist.** Die Prüfung und das anschließende Anlegen
 * stehen in **derselben** Transaktion, und `TransactionPort` reiht Transaktionen
 * (`unit-of-work.ts`): Zwei laufen nie ineinander. Eine zweite Anfrage sieht
 * also die Regel der ersten. Käme dieser Schutz je abhanden, wiese `ux_pool_name`
 * den ASCII-Fall weiterhin ab — und die Antwort darauf ist seit T-074 ein 409
 * und kein 500 mehr.
 */
async function poolNameTaken(unit: UnitOfWork, key: string): Promise<boolean> {
  const names = await unit.pools.listNames();
  return names.some((entry) => nameKey(entry.name) === key);
}

/**
 * Der Name steht in der Meldung (T-072, T-074).
 *
 * Das ist der Unterschied zwischen „Es gibt bereits eine Regel mit diesem
 * Namen“ und einer Meldung, mit der ein Benutzer etwas anfangen kann: Der Name,
 * den er getippt hat, ist womöglich nicht der Name, der gespeichert ist —
 * „Backend“ trifft ein vorhandenes „backend“, und ohne den Namen im Satz sieht
 * die Abweisung aus wie ein Fehler des Dienstes.
 *
 * Der eingesetzte Text ist die **Anzeigeform der Eingabe** des Aufrufers und
 * kommt nicht aus dem Bestand. Er verrät damit nichts, was der Aufrufer nicht
 * schon geschickt hat (B-2.4).
 */
function poolNameConflict(name: string): TaktError {
  return taktError(
    'name_conflict',
    `Es gibt bereits eine Regel mit dem Namen „${name}“. Pools und Kanban-Spalten teilen sich die Namen, auch wenn sie auf verschiedenen Flächen stehen.`,
  );
}

/**
 * Eine Regel anlegen — Pool, Kanban-Spalte oder beides (A-3.1, E-054).
 *
 * Bis T-074 gab dieser Anwendungsfall `Promise<Pool>` zurück und überließ den
 * doppelten Namen dem eindeutigen Index. Der warf, niemand fing ihn, und
 * `POST /pools` antwortete mit **500 internal_error** — gemessen vom
 * frontend-dev in T-072. Ein 500 heißt „bei mir ist etwas kaputt“; die
 * Oberfläche riet daraufhin zum erneuten Versuch, der genauso scheiterte.
 */
export async function createPool(
  context: AppContext,
  input: PoolInput,
): Promise<UseCaseResult<Pool>> {
  // Rein, und deshalb vor der Transaktion: Ein unbrauchbarer Name soll gar
  // keine Klammer öffnen. Dieselbe Reihenfolge wie in `createTag`.
  const checked = checkPoolName(input.name);
  if (!checked.ok) return err(checked.error);

  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    if (await poolNameTaken(unit, checked.value.key)) {
      return err(poolNameConflict(checked.value.name));
    }
    return ok(await unit.pools.create({ ...input, name: checked.value.name }, timestamp));
  });
}

export async function updatePool(
  context: AppContext,
  id: PoolId,
  input: Partial<PoolInput>,
): Promise<UseCaseResult<Pool>> {
  const checked = input.name === undefined ? null : checkPoolName(input.name);
  if (checked !== null && !checked.ok) return err(checked.error);

  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    if (checked !== null) {
      const names = await unit.pools.listNames();
      // **Erst die Frage nach der Regel selbst.** Gibt es sie nicht, ist 404 die
      // Antwort und nicht 409 — sonst bekäme ein Aufrufer, der eine gelöschte
      // Regel umbenennt, „Name vergeben" zu lesen und suchte am falschen Ende.
      // Der 404 kommt aus `update` weiter unten, mit dem Satz, der dort steht.
      const exists = names.some((entry) => entry.id === id);
      // `entry.id !== id` ist der zweite Punkt: Eine Regel, die ihren eigenen
      // Namen behält, darf sich nicht selbst im Weg stehen.
      const taken = names.some(
        (entry) => entry.id !== id && nameKey(entry.name) === checked.value.key,
      );
      if (exists && taken) return err(poolNameConflict(checked.value.name));
    }
    const fields = checked === null ? input : { ...input, name: checked.value.name };
    return unit.pools.update(id, fields, timestamp);
  });
}

export function removePool(context: AppContext, id: PoolId): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.pools.remove(id));
}

/**
 * Mitglieder eines Pools — **abgeleitet**, nicht gespeichert (A-3.4).
 *
 * `onlyOpen` ist die Abfrageseite von `isVisibleInPool` (E-039): Erledigte
 * Todos sind in Pool-Ansichten ausgeblendet, aber einblendbar. Genau deshalb
 * erscheint ein Todo, dessen „Erledigt" ein Timerstart aufgehoben hat, ohne
 * einen einzigen Schreibvorgang wieder in seinem Pool.
 *
 * **Sagt die Regel selbst etwas über „Erledigt", entscheidet die Regel**
 * (T-076). Dieselbe Abwägung wie auf dem Board, mit derselben Begründung: Ein
 * Pool `completion: 'done'` wäre mit `onlyOpen` obendrauf immer leer, und die
 * zweite Bedingung hat der Benutzer für die Ansicht gesetzt und nicht für
 * diesen Pool. Steht die Achse neutral, bleibt alles wie zuvor.
 */
export async function listPoolMembers(
  context: AppContext,
  id: PoolId,
  includeCompleted: boolean,
  pagination: Pagination,
): Promise<UseCaseResult<Page<Todo>>> {
  return context.transactions.inTransaction(async (unit) => {
    const pool = await unit.pools.load(id);
    if (pool === null) return err(taktError('not_found', 'Diesen Pool gibt es nicht.'));

    const filter: TodoFilter =
      pool.completion !== 'any' ? {} : includeCompleted ? {} : { onlyOpen: true };
    return ok(await unit.pools.members(id, filter, pagination));
  });
}

// ---------------------------------------------------------------------------
// Kanban-Spalten (A-5.*)
// ---------------------------------------------------------------------------

export function listStatuses(context: AppContext): Promise<readonly TodoStatus[]> {
  return context.transactions.inTransaction((unit) => unit.statuses.list());
}

/** `color` ist freiwillig; ohne Angabe entsteht die Spalte farblos (T-051). */
export function createStatus(
  context: AppContext,
  name: string,
  position: number,
  color: string | null = null,
): Promise<UseCaseResult<TodoStatus>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) =>
    unit.statuses.create(name, position, timestamp, color),
  );
}

export function updateStatus(
  context: AppContext,
  id: StatusId,
  fields: { readonly name?: string; readonly color?: string | null; readonly isDefault?: boolean },
): Promise<UseCaseResult<TodoStatus>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.statuses.update(id, fields, timestamp));
}

/** Reihenfolge **vollständig**, nicht in Teilstücken — siehe `repo-statuses.ts`. */
export function reorderStatuses(
  context: AppContext,
  order: readonly StatusId[],
): Promise<UseCaseResult<readonly TodoStatus[]>> {
  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.statuses.reorder(order, timestamp));
}

export function removeStatus(context: AppContext, id: StatusId): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.statuses.remove(id));
}

// ---------------------------------------------------------------------------
// Exportstatus (E-012, E-032, E-037, R-10)
// ---------------------------------------------------------------------------

/**
 * Den Exportstatus einer Buchung zurücksetzen.
 *
 * **Nur nach `open`.** Der Weg nach `exported` führt allein über einen
 * Exportlauf; sonst gäbe es eine als abgerechnet markierte Buchung ohne Beleg.
 * Die Regel steht in der Domäne (`checkExportStatusTransition`) und wird hier
 * aufgerufen, bevor überhaupt gelesen wird — der Fehlschlag hängt an der
 * Absicht des Aufrufers, nicht am Bestand.
 *
 * `actor` ist der Windows-Benutzername aus dem Zusammenhang, **kein**
 * Eingabefeld. Ein Protokoll, dessen Urheber der Aufrufer selbst bestimmt,
 * belegt nichts (E-010, B-8.1).
 */
export async function setExportStatus(
  context: AppContext,
  id: TimeEntryId,
  target: ExportStatus,
  reason: string,
): Promise<UseCaseResult<TimeEntry>> {
  const timestamp = now(context);
  const actor = context.system.windowsUser();

  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timeEntries.load(id);
    if (entry === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));

    // Die Domäne urteilt über den Wechsel, und zwar über den **tatsächlichen**
    // Ausgangszustand. Ein fest verdrahtetes `from` wäre eine Annahme über den
    // Bestand — und sie fiele genau dort auf die Füße, wo sie am teuersten ist:
    // Der Versuch, `exported` von Hand zu setzen, ergäbe „ist schon so" statt
    // „geht auf diesem Weg nicht".
    const allowed = checkExportStatusTransition(entry.exportStatus, target, 'reset');
    if (!allowed.ok) return err(allowed.error);

    return unit.export.resetStatus({ timeEntryId: id, reason, actor, now: timestamp });
  });
}

/**
 * E-047 — „Nicht abrechnen".
 *
 * Der Gegenpart zu `setExportStatus`: Er führt dieselbe Buchung in die andere
 * Richtung, ohne dass eine Datei entsteht. Die Domäne urteilt auch hier über
 * den **tatsächlichen** Ausgangszustand — eine bereits ausgebuchte oder
 * exportierte Buchung ergibt `export_status_unchanged` (409) und nicht etwa
 * einen zweiten Protokolleintrag über denselben Vorgang.
 *
 * Der Vorgang heißt nirgends „als exportiert markieren". Exportiert wurde diese
 * Zeit nie; der Benutzer rechnet sie schlicht nicht ab (E-047).
 */
export async function markNotBilled(
  context: AppContext,
  id: TimeEntryId,
  reason: string,
): Promise<UseCaseResult<TimeEntry>> {
  const timestamp = now(context);
  const actor = context.system.windowsUser();

  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timeEntries.load(id);
    if (entry === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));

    const allowed = checkExportStatusTransition(entry.exportStatus, 'exported', 'not_billed');
    if (!allowed.ok) return err(allowed.error);

    return unit.export.markNotBilled({ timeEntryId: id, reason, actor, now: timestamp });
  });
}

export function listExportRuns(
  context: AppContext,
  pagination: Pagination,
): Promise<Page<ExportRun>> {
  return context.transactions.inTransaction((unit) => unit.export.listRuns(pagination));
}

export async function loadExportRun(
  context: AppContext,
  id: ExportRunId,
): Promise<UseCaseResult<ExportRun>> {
  return context.transactions.inTransaction(async (unit) => {
    const run = await unit.export.loadRun(id);
    if (run === null) return err(taktError('not_found', 'Diesen Exportlauf gibt es nicht.'));
    return ok(run);
  });
}

/**
 * Das Exportprotokoll, gefiltert (R-10, T-042).
 *
 * Der Filter geht **in die Abfrage** und nicht in den Aufrufer. Bis T-042
 * beantwortete die Oberfläche „welche Buchungen waren in diesem Lauf?" durch
 * Sieben der gerade geladenen Seite — und ein Lauf mit mehr Buchungen als eine
 * Seite fasst, schiebt jeden älteren Lauf aus ihr heraus. Der Knopf versagte
 * damit genau bei den Läufen, für die man ihn drückt.
 */
export function listExportAudit(
  context: AppContext,
  filter: ExportAuditFilter,
  pagination: Pagination,
): Promise<Page<ExportAuditEntry>> {
  return context.transactions.inTransaction((unit) => unit.export.audit(filter, pagination));
}

// ---------------------------------------------------------------------------
// Exportvorlagen (A-8.7, E-005)
// ---------------------------------------------------------------------------

export function listTemplates(context: AppContext): Promise<readonly ExportTemplateEnvelope[]> {
  return context.transactions.inTransaction((unit) => unit.templates.list());
}

/**
 * Eine Vorlage anlegen.
 *
 * Die Feldliste wird **vor** dem Schreiben geprüft — von
 * `validateExportTemplateDefinition` im Motor, nicht hier. Das ist die Stelle,
 * an der `todo.note` als Quelle abgewiesen wird (A-7.2, E-017, R-06): Die
 * Auswahlliste ist abschließend, und was nicht daraufsteht, kommt nicht in die
 * Datenbank.
 */
export async function createTemplate(
  context: AppContext,
  name: string,
  definition: unknown,
): Promise<UseCaseResult<ExportTemplateEnvelope>> {
  const checked = checkTemplateDefinition(definition);
  if (!checked.ok) return err(checked.error);

  const timestamp = now(context);
  return context.transactions.inTransaction((unit) =>
    unit.templates.create(name, definition, timestamp),
  );
}

export async function updateTemplate(
  context: AppContext,
  id: ExportTemplateId,
  name: string | undefined,
  definition: unknown,
): Promise<UseCaseResult<ExportTemplateEnvelope>> {
  if (definition !== undefined) {
    const checked = checkTemplateDefinition(definition);
    if (!checked.ok) return err(checked.error);
  }

  const timestamp = now(context);
  return context.transactions.inTransaction((unit) =>
    unit.templates.update(id, name, definition, timestamp),
  );
}

export function removeTemplate(
  context: AppContext,
  id: ExportTemplateId,
): Promise<UseCaseResult<void>> {
  return context.transactions.inTransaction((unit) => unit.templates.remove(id));
}

// ---------------------------------------------------------------------------
// Einstellungen (E-011)
// ---------------------------------------------------------------------------

export interface SettingsView {
  readonly settings: AppSettings;
  /** Zustand des Exportordners **jetzt**, nicht beim Einstellen (R-11). */
  readonly exportDirectoryState:
    | 'ok'
    | 'not_set'
    | 'missing'
    | 'not_writable'
    | 'not_a_directory'
    | 'unreachable';
  /**
   * Was am eingestellten Ordner belegbar ist (T-039).
   *
   * Leer, solange nichts belegt ist — auch bei `missing` und `not_a_directory`,
   * wo der Grund die ganze Auskunft ist. Die Oberfläche warnt daneben weiter aus
   * dem Pfad heraus; diese Liste ist der Beleg, nicht die Warnung.
   */
  readonly exportDirectoryTraits: readonly ExportDirectoryTrait[];
  readonly defaultTags: readonly DefaultTag[];
  /**
   * Unter welchem Namen abgerechnet wird (E-010, E-042, T-042).
   *
   * Er stand bis T-041 **nur** in `ExportRun.windowsUser`, also erst nach dem
   * ersten Export. Genau davor will man ihn aber wissen: E-042 hat einen
   * abgesicherten Kanal gebaut, damit der Name nicht manipulierbar ist — wenn
   * ihn niemand vorher nachsehen kann, ist die halbe Wirkung dahin.
   *
   * Er ist **keine Einstellung** und steht deshalb neben `settings` und nicht
   * darin: Er kommt von der Hülle über `stdin` und ist über keine Route
   * änderbar (B-8.1).
   */
  readonly windowsUser: string;
  /**
   * Wo der Bestand liegt (E-018, R-13). `null` bei einem Bestand im
   * Arbeitsspeicher.
   *
   * Auskunft, keine Einstellung. Nach allem, was über Synchronisierungsordner
   * entschieden wurde, soll man nachsehen können, wo die Datei tatsächlich
   * liegt, statt es aus der Anwendung heraus zu vermuten.
   *
   * **Warum das kein Verstoß gegen B-2.4 ist.** Dort steht, dass ein Dateipfad
   * nicht in eine **Fehlermeldung** gehört: Sie geht auch an einen Aufrufer,
   * der sie nicht bekommen soll, und sie verrät Innenleben zu einem Zeitpunkt,
   * zu dem der Aufrufer nichts damit anfangen kann. Hier ist es umgekehrt —
   * eine ausdrücklich erfragte Auskunft, hinter dem Sitzungsgeheimnis, das
   * ausschließlich die Hülle hat. Das Add-in-Token erreicht `/settings` nicht
   * (`access/route-policy.ts`), und derselbe Rumpf führt mit
   * `settings.exportDirectory` bereits einen Pfad desselben Rechners.
   */
  readonly databasePath: string | null;
}

export async function loadSettings(context: AppContext): Promise<SettingsView> {
  const settings = await context.transactions.inTransaction((unit) => unit.settings.load());
  const defaultTags = await context.transactions.inTransaction((unit) => unit.defaultTags.list());
  const check = await context.files.checkExportDirectory(settings.exportDirectory);
  // Nach einer Zeitgrenze wird das Dateisystem nicht noch einmal gefragt: Es
  // liefe in dieselbe Wand. Was aus Pfad und Umgebung folgt, bleibt trotzdem —
  // und ist dort die eigentliche Erklärung.
  const traits = await context.directories.describeExportDirectory(settings.exportDirectory, {
    mayAskFileSystem: check.ok || check.reason !== 'unreachable',
  });

  return {
    settings,
    exportDirectoryState: check.ok ? 'ok' : check.reason,
    exportDirectoryTraits: traits,
    defaultTags,
    windowsUser: context.system.windowsUser(),
    databasePath: context.system.databasePath(),
  };
}

export interface SettingsUpdate {
  readonly exportDirectory?: string | null;
  readonly activeExportTemplateId?: ExportTemplateId | null;
  readonly roundingMode?: RoundingMode;
  readonly locale?: string;
  readonly theme?: 'system' | 'light' | 'dark';
}

/**
 * Einstellungen ändern.
 *
 * Ein gesetzter Exportordner wird sofort geprüft und bei einem Fehlschlag
 * **abgewiesen**, statt gespeichert und später zu überraschen. Geprüft wird
 * trotzdem bei jedem Lauf erneut (R-11) — der Ordner kann danach verschwinden.
 */
export async function updateSettings(
  context: AppContext,
  input: SettingsUpdate,
): Promise<UseCaseResult<AppSettings>> {
  if (input.exportDirectory !== undefined && input.exportDirectory !== null) {
    const check = await context.files.checkExportDirectory(input.exportDirectory);
    if (!check.ok) {
      // `unreachable` bekommt einen eigenen Satz, weil es einen anderen
      // Handgriff verlangt: Bei „gibt es nicht" wählt man einen anderen Ordner,
      // bei „antwortet nicht" verbindet man das Laufwerk neu oder wartet. Der
      // Fehlerschlüssel bleibt derselbe — kein Aufrufer verzweigt darauf, und
      // ein neuer Schlüssel wäre eine Änderung ohne Empfänger.
      if (check.reason === 'unreachable') {
        return err(
          taktError(
            'export_directory_missing',
            `Der Ordner hat innerhalb von ${Math.round(check.waitedMs / 1000)} Sekunden nicht geantwortet. Er wurde nicht gespeichert.`,
          ),
        );
      }
      return err(
        taktError(
          check.reason === 'not_writable' ? 'export_directory_not_writable' : 'export_directory_missing',
          check.reason === 'not_writable'
            ? 'In diesen Ordner kann nicht geschrieben werden.'
            : 'Diesen Ordner gibt es nicht oder er ist kein Ordner.',
        ),
      );
    }
  }

  const timestamp = now(context);
  return context.transactions.inTransaction((unit) => unit.settings.update({ ...input, now: timestamp }));
}
