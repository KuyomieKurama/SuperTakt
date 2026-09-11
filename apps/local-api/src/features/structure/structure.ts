/**
 * Takt — Anwendungsfälle für Tags, Ordner, Pools und Kanban-Spalten
 * (A-3.*, A-4.*, A-5.*, E-054).
 *
 * Die Regeln stehen hier nicht: Zyklusfreiheit prüft `checkFolderMove` in der
 * Domäne, die Zulässigkeit eines Namens `checkTagName` und `checkPoolName`.
 * Diese Datei ruft sie auf und klammert das Schreiben — mehr nicht. Wer eine
 * Fachregel hier findet, hat eine gefunden, die an der falschen Stelle steht.
 */

import type {
  Pool,
  PoolId,
  PoolPlacement,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolResolution,
  PoolSurface,
  PoolTagTerm,
  StatusId,
  Tag,
  TagFolder,
  TagFolderId,
  TagId,
  TagTree,
  Todo,
  TodoFilter,
  TaktError,
  TodoStatus,
} from '@takt/domain';
import { checkPoolName, checkTagName, err, nameKey, ok, resolvePool, taktError } from '@takt/domain';
import type { Page, Pagination, PoolAxesResolution, UnitOfWork } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';

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
// Spalten, weil er derselbe wäre. Das Board **liest** über `features/board/board.ts`.
// ---------------------------------------------------------------------------

/**
 * Eine Regel samt dem, was ihre Ordner ergeben (T-080).
 *
 * ---------------------------------------------------------------------------
 * Warum die Auflösung mitgeliefert wird und die Leere nicht
 * ---------------------------------------------------------------------------
 *
 * Zwei Fragen, die gleich klingen und verschiedene Antworten brauchen:
 *
 *  1. **Nennt diese Regel eine Bedingung?** Das steht in den Feldern, die der
 *     Aufrufer ohnehin in der Hand hat, und `poolRuleIsEmpty` aus der Domäne
 *     beantwortet es für ihn — auch für einen Entwurf im Formular, den noch
 *     keine Route gesehen hat. Ein Feld an dieser Antwort wäre die zweite
 *     Fassung derselben Auskunft und für den Entwurf ohnehin nicht zu haben.
 *  2. **Was ergeben ihre Ordner?** Das kann nur der Dienst sagen; die
 *     Auflösung steigt über den Ordnerbaum ab. Deshalb steht sie hier.
 *
 * Ohne die zweite Zahl sieht ein Ordner, in dem kein Tag liegt, aus wie eine
 * Regel ohne Treffer — und nur der erste Fall ist ein Einrichtungsfehler.
 *
 * `resolved.matchesNothing` (E-057) ist **kein** Rückfall in Frage 1. Es
 * beantwortet „trifft diese Regel überhaupt etwas?" für die **aufgelöste**
 * Regel, und dafür braucht es den Ordnerbaum: Der leere Ordner steht neben
 * einer zweiten Achse, die Regel nennt also eine Bedingung und trifft trotzdem
 * nichts. Für den Entwurf im Formular bleibt es bei `poolRuleIsEmpty` — dort
 * gibt es keine Auflösung, die eine andere Antwort geben könnte.
 */
export interface PoolWithResolution extends Pool {
  readonly resolved: PoolResolution;
}

/**
 * Eine Regel mit **bereits aufgelösten** Taglisten zusammensetzen.
 *
 * Für Aufrufer, die ohnehin auflösen mussten — das Board tut es je Spalte, um
 * die Mehrfachnennung zu bestimmen. Sie zahlen die Abfrage damit einmal und
 * nicht zweimal.
 *
 * Herein kommt die Antwort des Ports (`PoolPort.resolveAxes`) unverändert: die
 * beiden Tagmengen **und** die Ordner, aus denen nichts geworden ist. Diese
 * Datei nimmt sie auseinander und urteilt nicht; das Urteil fällt in
 * `resolvePool` (E-057).
 */
export function poolWithResolution(pool: Pool, axes: PoolAxesResolution): PoolWithResolution {
  return {
    ...pool,
    resolved: resolvePool({
      axes: pool,
      ruleTagIds: axes.required.tagIds,
      excludedTagIds: axes.excluded.tagIds,
      emptyRuleFolderIds: axes.required.emptyFolderIds,
      emptyExcludedFolderIds: axes.excluded.emptyFolderIds,
    }),
  };
}

/**
 * Dasselbe für Regeln, deren Taglisten noch niemand aufgelöst hat.
 *
 * Zwei Abfragen je Regel, und das ist vertretbar: `pool` hält die Regeln, die
 * ein Mensch von Hand eingerichtet hat — eine Handvoll Zeilen, in keinem
 * denkbaren Bestand mehr als ein paar Dutzend (dieselbe Begründung wie an
 * `PoolPort.listNames`). Die Auflösung selbst steht **einmal** im Adapter und
 * wird hier nicht nachgebaut; eine zweite Fassung davon wäre genau die
 * Doppelung, die T-080 beseitigt.
 */
async function withResolution(
  unit: UnitOfWork,
  pools: readonly Pool[],
): Promise<readonly PoolWithResolution[]> {
  return Promise.all(
    pools.map(async (pool) => poolWithResolution(pool, await unit.pools.resolveAxes(pool.id))),
  );
}

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
): Promise<readonly PoolWithResolution[]> {
  return context.transactions.inTransaction(async (unit) =>
    withResolution(unit, await unit.pools.list(shownOn)),
  );
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
  readonly matchMode: PoolMatchMode;
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
): Promise<UseCaseResult<PoolWithResolution>> {
  // Rein, und deshalb vor der Transaktion: Ein unbrauchbarer Name soll gar
  // keine Klammer öffnen. Dieselbe Reihenfolge wie in `createTag`.
  const checked = checkPoolName(input.name);
  if (!checked.ok) return err(checked.error);

  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    if (await poolNameTaken(unit, checked.value.key)) {
      return err(poolNameConflict(checked.value.name));
    }
    const created = await unit.pools.create({ ...input, name: checked.value.name }, timestamp);
    // Die Antwort trägt dieselbe Auflösung wie die Liste. Eine Regel, die beim
    // Anlegen anders aussieht als beim Lesen, wäre zwei Regeln (T-080).
    const [view] = await withResolution(unit, [created]);
    return view === undefined ? err(taktError('not_found', 'Diesen Pool gibt es nicht.')) : ok(view);
  });
}

export async function updatePool(
  context: AppContext,
  id: PoolId,
  input: Partial<PoolInput>,
): Promise<UseCaseResult<PoolWithResolution>> {
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
    const updated = await unit.pools.update(id, fields, timestamp);
    if (!updated.ok) return updated;
    const [view] = await withResolution(unit, [updated.value]);
    return view === undefined ? err(taktError('not_found', 'Diesen Pool gibt es nicht.')) : ok(view);
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
