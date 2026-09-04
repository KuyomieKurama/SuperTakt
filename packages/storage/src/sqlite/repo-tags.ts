/**
 * Takt — Tags, Tag-Ordner und Pools (A-3.*, A-4.*, A-9.*, E-022).
 *
 * ---------------------------------------------------------------------------
 * Beliebig tief, ohne die Tabelle in den Speicher zu laden
 * ---------------------------------------------------------------------------
 *
 * Der Baum ist eine Adjazenzliste (E-022). Drei Zugriffsarten kommen vor, und
 * jede hat ihre eigene Abfrage:
 *
 *  - `ancestors(id)` — die Kette nach oben. Rekursive Abfrage über den
 *    Primärschlüssel: je Ebene ein Indexzugriff. Bei zehn Ebenen zehn Zugriffe.
 *    Grundlage der Zyklusprüfung aus A-4.6.
 *  - `subtree(id)` — alles darunter. Rekursive Abfrage über
 *    `ix_tag_folder_parent`: je Ebene ein Indexzugriff, nie ein
 *    Volltabellenscan. Grundlage für „Tags dieses Ordners und aller
 *    Unterordner" (A-3.3).
 *  - `loadTree()` — der ganze Baum in **einem** Aufruf (A-10.4). Zwei
 *    Abfragen: alle Ordner, alle Tags. Zusammengesetzt wird im Speicher. Das
 *    ist hier ausdrücklich richtig — der Aufrufer will ohnehin alles, und ein
 *    Aufruf je Ebene wäre genau das N+1, das A-10.4 ausschließt.
 *
 * Die Zyklusprüfung selbst steht **nicht** hier, sondern als `checkFolderMove`
 * in `packages/domain/src/tag.ts`. Dieser Adapter lädt die Kette und schreibt;
 * er urteilt nicht. Beides — Prüfung und Schreiben — geschieht innerhalb
 * derselben Transaktion, sonst könnten zwei gleichzeitige Verschiebungen
 * aneinander vorbei laufen und einen Kreis erzeugen, den beide für ausgeschlossen
 * hielten.
 */

import type { PoolPort, TagFolderPort, TagPort, Page, Pagination } from '../ports.ts';
import type {
  Pool,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolId,
  PoolMatchMode,
  PoolTagTerm,
  StatusId,
  Tag,
  TagFolder,
  TagFolderId,
  TagFolderNode,
  TagId,
  TagTree,
  Timestamp,
  Todo,
  TodoFilter,
} from '@takt/domain';
import { checkFolderMove, err, normalizeName, normalizeTagName, ok, tagNameKey, taktError } from '@takt/domain';

import { integer, text, placeholders, type SqlConnection } from './database.ts';
import { attemptAtomically } from './atomic.ts';
import { attempt } from './errors.ts';
import {
  RULE_REFERENCE_PROBE,
  poolReferences,
  toPool,
  toPoolCompletion,
  toPoolExportState,
  toPoolRuleTerm,
  toTag,
  toTagFolder,
} from './mappers.ts';
import type { IdSource } from './ids.ts';

const TAG_COLUMNS = 'id, folder_id, name, color, created_at, updated_at';
const FOLDER_COLUMNS = 'id, parent_id, name, created_at, updated_at';
/**
 * Alle Spalten von `pool`, ausgeschrieben — `placement` seit E-054 darunter,
 * `completion` und `export_state` seit T-076.
 *
 * Ausgeschrieben und nicht `SELECT *`, aus demselben Grund wie in
 * `repo-todos.ts`: Eine später ergänzte Spalte soll nicht von selbst in einem
 * Datensatz landen, den irgendein Pfad weiterreicht.
 */
const POOL_COLUMNS =
  'id, name, match_mode, include_subfolders, placement, position, completion, export_state, created_at, updated_at';

export function createTagPort(conn: SqlConnection, ids: IdSource): TagPort {
  const loadOne = (id: TagId): Tag | null => {
    const row = conn.prepare(`SELECT ${TAG_COLUMNS} FROM tag WHERE id = ?`).get(id);
    return row === undefined ? null : toTag(row);
  };

  /**
   * Alle Tags mit diesem Vergleichsschlüssel — **ordnerübergreifend**.
   *
   * Ein Indexzugriff über `ix_tag_name_key`, kein Tabellendurchlauf. Das ist
   * der Grund, warum es diesen Index neben dem eindeutigen gibt: Der eindeutige
   * führt den Ordner an erster Stelle und taugt für die Frage „gibt es das
   * irgendwo?“ nicht.
   */
  const byKey = (key: string): readonly Tag[] =>
    conn
      .prepare(`SELECT ${TAG_COLUMNS} FROM tag WHERE name_key = ? ORDER BY created_at, id`)
      .all(key)
      .map(toTag);

  const insertTag = (
    id: TagId,
    folderId: TagFolderId | null,
    name: string,
    color: string | null,
    now: Timestamp,
  ): void => {
    conn
      .prepare(
        `INSERT INTO tag (${TAG_COLUMNS}, name_key) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, folderId, name, color, now, now, tagNameKey(name));
  };

  return {
    async load(id) {
      return loadOne(id);
    },

    async findByKey(key) {
      return byKey(key);
    },

    async listInFolder(folderId) {
      const rows =
        folderId === null
          ? conn
              .prepare(`SELECT ${TAG_COLUMNS} FROM tag WHERE folder_id IS NULL ORDER BY name COLLATE NOCASE`)
              .all()
          : conn
              .prepare(`SELECT ${TAG_COLUMNS} FROM tag WHERE folder_id = ? ORDER BY name COLLATE NOCASE`)
              .all(folderId);
      return rows.map(toTag);
    },

    /**
     * Der Name geht **normalisiert** in die Datenbank (T-058).
     *
     * `„ Backend “` und `„Backend“` sind derselbe Name; welche der beiden
     * Schreibweisen gespeichert wird, darf nicht davon abhängen, wer sie
     * geschickt hat. Der Schlüssel daneben trägt den eindeutigen Index.
     *
     * Ein Name, der nach der Normalisierung leer ist, wird hier **nicht**
     * geprüft. Das ist Aufgabe von `checkTagName` in der Domäne, und der
     * Anwendungsfall ruft sie auf, bevor er hierher kommt — dieselbe Trennung
     * wie bei der Auflösung von Tagnamen (architektur.md 3.4): Der Adapter
     * schreibt, er urteilt nicht. Käme trotzdem einer durch, hielte ihn der
     * CHECK auf `tag.name` auf.
     */
    async create(folderId, name, color, now) {
      const id = ids.next() as TagId;
      const normalized = normalizeTagName(name);
      const outcome = attempt(() => {
        insertTag(id, folderId, normalized, color, now);
      });
      if (!outcome.ok) return err(outcome.error as never);
      const created = loadOne(id);
      if (created === null) throw new Error('Das angelegte Tag ist nicht auffindbar.');
      return ok(created);
    },

    async rename(id, name, now) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Dieses Tag gibt es nicht.'));
      const normalized = normalizeTagName(name);
      // Name und Schlüssel in **einer** Anweisung. Getrennt geschrieben gäbe es
      // einen Augenblick, in dem der Schlüssel einen anderen Namen beschreibt
      // als die Zeile trägt — und der Trigger aus 0008 kann das nicht sehen.
      const outcome = attempt(() =>
        conn
          .prepare('UPDATE tag SET name = ?, name_key = ?, updated_at = ? WHERE id = ?')
          .run(normalized, tagNameKey(normalized), now, id),
      );
      if (!outcome.ok) return err(outcome.error as never);
      const renamed = loadOne(id);
      if (renamed === null) return err(taktError('not_found', 'Dieses Tag gibt es nicht.'));
      return ok(renamed);
    },

    async move(id, folderId, now) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Dieses Tag gibt es nicht.'));
      const outcome = attempt(() =>
        conn.prepare('UPDATE tag SET folder_id = ?, updated_at = ? WHERE id = ?').run(folderId, now, id),
      );
      if (!outcome.ok) return err(outcome.error);
      const moved = loadOne(id);
      if (moved === null) return err(taktError('not_found', 'Dieses Tag gibt es nicht.'));
      return ok(moved);
    },

    /**
     * A-4.5 — ein Tag, das an Todos oder in einer Pool-Regel hängt, wird nicht
     * gelöscht.
     *
     * ---------------------------------------------------------------------
     * Warum hier trotz RESTRICT vorher gefragt wird
     * ---------------------------------------------------------------------
     *
     * Seit Migration 0012 steht `pool_rule.tag_id` auf `ON DELETE RESTRICT`;
     * die Datenbank weist also selbst ab. Diese Prüfung nimmt ihr nur das Wort
     * aus dem Mund: „Dieses Tag wird in der Regel eines Pools verwendet." statt
     * „FOREIGN KEY constraint failed" — und sie kann sagen, **welche** Regel.
     *
     * `todo_tag.tag_id` und `default_tag.tag_id` stehen unverändert auf
     * `ON DELETE CASCADE` (Migration 0001). Dort ist diese Prüfung die
     * **einzige** Wache: Die Datenbank wiese nicht ab, sondern gehorchte und
     * nähme die Zuordnungen stillschweigend mit.
     *
     * Bis T-101 behauptete der Kommentar an dieser Stelle das Gegenteil der
     * Lage — er nannte alle drei Fremdschlüssel `CASCADE` und war für den
     * Regelfall seit Migration 0012 falsch (R-1a Befund 3).
     */
    async remove(id) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Dieses Tag gibt es nicht.'));

      const usage = conn
        .prepare(
          `SELECT (SELECT COUNT(*) FROM todo_tag  WHERE tag_id = ?) AS todos,
                  (SELECT COUNT(*) FROM default_tag WHERE tag_id = ?) AS defaults`,
        )
        .get(id, id);

      if (usage !== undefined && integer(usage, 'todos') > 0) {
        return err(
          taktError('tag_in_use', 'Dieses Tag ist noch an Todos vergeben und wird nicht gelöscht.'),
        );
      }

      /*
       * Die Regel beim **Namen** (R-1a Befund 1, T-099).
       *
       * Ordner und Status nennen die betroffene Regel seit T-089; das Tag tat
       * es als einziges nicht, und der Löschdialog der Oberfläche stand
       * deshalb ohne den Satz „Betroffen ist Regel „…"." da — gemessen in
       * T-099. Die Oberfläche liest `details` bereits (`errorText.ts`); es
       * fehlte allein die Antwort.
       *
       * Dieselbe Abfrage wie beim Ordner, mit `ix_pool_rule_tag` aus Migration
       * 0011 und der Obergrenze aus {@link RULE_REFERENCE_PROBE}.
       */
      const usedIn = conn
        .prepare(
          `SELECT DISTINCT p.id AS id, p.name AS name
             FROM pool_rule r JOIN pool p ON p.id = r.pool_id
            WHERE r.tag_id = ?
            ORDER BY p.position, p.name
            LIMIT ${String(RULE_REFERENCE_PROBE)}`,
        )
        .all(id);

      if (usedIn.length > 0) {
        const { details, notice } = poolReferences(usedIn);
        return err({
          code: 'tag_in_use' as const,
          message: `Dieses Tag wird in der Regel eines Pools verwendet.${notice}`,
          details,
        });
      }

      if (usage !== undefined && integer(usage, 'defaults') > 0) {
        return err(taktError('tag_in_use', 'Dieses Tag ist ein Standard-Tag.'));
      }

      const outcome = attempt(() => conn.prepare('DELETE FROM tag WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as never);
      return ok(undefined);
    },

    async setOnTodo(todoId, tagIds, now) {
      conn.prepare('DELETE FROM todo_tag WHERE todo_id = ?').run(todoId);
      const insert = conn.prepare('INSERT INTO todo_tag (todo_id, tag_id, created_at) VALUES (?, ?, ?)');
      for (const tagId of new Set(tagIds)) insert.run(todoId, tagId, now);
    },
  };
}

export function createTagFolderPort(conn: SqlConnection, ids: IdSource): TagFolderPort {
  const loadOne = (id: TagFolderId): TagFolder | null => {
    const row = conn.prepare(`SELECT ${FOLDER_COLUMNS} FROM tag_folder WHERE id = ?`).get(id);
    return row === undefined ? null : toTagFolder(row);
  };

  /**
   * Vorfahren, vom Ordner aufwärts. Der Ordner selbst ist **nicht** enthalten.
   *
   * Die Rekursion endet zwangsläufig: `parent_id` ist ein Fremdschlüssel auf
   * dieselbe Tabelle, und ein Kreis darin ist durch `checkFolderMove` und den
   * CHECK gegen den Selbstbezug ausgeschlossen. Sollte trotzdem je einer
   * entstehen — etwa durch einen Eingriff von Hand in die Datei — begrenzt
   * `LIMIT` die Abfrage, statt die Anwendung stehen zu lassen.
   */
  const ancestorsOf = (id: TagFolderId): readonly TagFolderId[] => {
    const rows = conn
      .prepare(
        `WITH RECURSIVE up(id, parent_id, depth) AS (
             SELECT f.id, f.parent_id, 0 FROM tag_folder f WHERE f.id = ?
             UNION ALL
             SELECT f.id, f.parent_id, up.depth + 1
               FROM tag_folder f JOIN up ON f.id = up.parent_id
              WHERE up.depth < 1000
           )
           SELECT id FROM up WHERE id <> ? ORDER BY depth`,
      )
      .all(id, id);
    return rows.map((row) => text(row, 'id') as TagFolderId);
  };

  const subtreeOf = (id: TagFolderId): readonly TagFolderId[] => {
    const rows = conn
      .prepare(
        `WITH RECURSIVE down(id, depth) AS (
             SELECT f.id, 0 FROM tag_folder f WHERE f.id = ?
             UNION ALL
             SELECT f.id, down.depth + 1
               FROM tag_folder f JOIN down ON f.parent_id = down.id
              WHERE down.depth < 1000
           )
           SELECT id FROM down ORDER BY depth`,
      )
      .all(id);
    return rows.map((row) => text(row, 'id') as TagFolderId);
  };

  return {
    async load(id) {
      return loadOne(id);
    },

    async listChildren(parentId) {
      const rows =
        parentId === null
          ? conn
              .prepare(
                `SELECT ${FOLDER_COLUMNS} FROM tag_folder WHERE parent_id IS NULL ORDER BY name COLLATE NOCASE`,
              )
              .all()
          : conn
              .prepare(
                `SELECT ${FOLDER_COLUMNS} FROM tag_folder WHERE parent_id = ? ORDER BY name COLLATE NOCASE`,
              )
              .all(parentId);
      return rows.map(toTagFolder);
    },

    /** A-10.4 — der vollständige Baum in einem Aufruf. Zwei Abfragen, kein N+1. */
    async loadTree(): Promise<TagTree> {
      const folders = conn
        .prepare(`SELECT ${FOLDER_COLUMNS} FROM tag_folder ORDER BY name COLLATE NOCASE`)
        .all()
        .map(toTagFolder);
      const tags = conn
        .prepare(`SELECT ${TAG_COLUMNS} FROM tag ORDER BY name COLLATE NOCASE`)
        .all()
        .map(toTag);

      const tagsByFolder = new Map<string, Tag[]>();
      const rootTags: Tag[] = [];
      for (const tag of tags) {
        if (tag.folderId === null) rootTags.push(tag);
        else {
          const bucket = tagsByFolder.get(tag.folderId);
          if (bucket === undefined) tagsByFolder.set(tag.folderId, [tag]);
          else bucket.push(tag);
        }
      }

      const childrenOf = new Map<string, TagFolder[]>();
      const roots: TagFolder[] = [];
      for (const folder of folders) {
        if (folder.parentId === null) roots.push(folder);
        else {
          const bucket = childrenOf.get(folder.parentId);
          if (bucket === undefined) childrenOf.set(folder.parentId, [folder]);
          else bucket.push(folder);
        }
      }

      /**
       * Iterativ statt rekursiv.
       *
       * Ein rekursiver Aufbau ist kürzer, aber die Tiefe ist ausdrücklich
       * unbegrenzt (A-4.3). Ein Baum aus tausend verschachtelten Ordnern —
       * versehentlich durch ein Skript entstanden — legte den Dienst mit einem
       * Stapelüberlauf still, und zwar in einem Aufruf, der nur lesen wollte.
       */
      interface MutableNode {
        readonly folder: TagFolder;
        readonly subfolders: MutableNode[];
        readonly tags: readonly Tag[];
      }

      const build = (roots_: readonly TagFolder[]): readonly TagFolderNode[] => {
        const nodes = new Map<string, MutableNode>();
        const order: TagFolder[] = [];
        const stack = [...roots_];
        while (stack.length > 0) {
          const folder = stack.pop();
          if (folder === undefined) continue;
          order.push(folder);
          nodes.set(folder.id, {
            folder,
            subfolders: [],
            tags: tagsByFolder.get(folder.id) ?? [],
          });
          stack.push(...(childrenOf.get(folder.id) ?? []));
        }
        // Von den Blättern zurück nach oben: Ein Kind ist fertig, bevor sein
        // Elternteil es einhängt, weil `order` die Ordner in Absteigerichtung
        // enthält.
        for (let index = order.length - 1; index >= 0; index -= 1) {
          const folder = order[index];
          if (folder === undefined || folder.parentId === null) continue;
          const parent = nodes.get(folder.parentId);
          const self = nodes.get(folder.id);
          if (parent !== undefined && self !== undefined) parent.subfolders.push(self);
        }
        const byName = (left: MutableNode, right: MutableNode): number =>
          left.folder.name.localeCompare(right.folder.name, 'de');
        for (const node of nodes.values()) node.subfolders.sort(byName);
        return roots_
          .map((folder) => nodes.get(folder.id))
          .filter((node): node is MutableNode => node !== undefined)
          .sort(byName);
      };

      return { rootFolders: build(roots), rootTags };
    },

    async ancestors(id) {
      return ancestorsOf(id);
    },

    async subtree(id) {
      return subtreeOf(id);
    },

    async create(parentId, name, now) {
      const id = ids.next() as TagFolderId;
      const outcome = attempt(() =>
        conn
          .prepare(`INSERT INTO tag_folder (${FOLDER_COLUMNS}) VALUES (?, ?, ?, ?, ?)`)
          .run(id, parentId, name, now, now),
      );
      if (!outcome.ok) return err(outcome.error as never);
      const created = loadOne(id);
      if (created === null) throw new Error('Der angelegte Ordner ist nicht auffindbar.');
      return ok(created);
    },

    async rename(id, name, now) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Diesen Ordner gibt es nicht.'));
      const outcome = attempt(() =>
        conn.prepare('UPDATE tag_folder SET name = ?, updated_at = ? WHERE id = ?').run(name, now, id),
      );
      if (!outcome.ok) return err(outcome.error);
      const renamed = loadOne(id);
      if (renamed === null) return err(taktError('not_found', 'Diesen Ordner gibt es nicht.'));
      return ok(renamed);
    },

    /**
     * A-4.6 — Verschieben mit Zyklusprüfung, in **einer** Transaktion.
     *
     * Erst die Vorfahrenkette des Ziels laden, dann die reine Regel der Domäne
     * fragen, dann schreiben. Alle drei Schritte liegen in derselben Klammer,
     * die der Aufrufer geöffnet hat: Eine Prüfung davor und ein Schreiben
     * danach wären zwei Schritte, und zwei gleichzeitige Verschiebungen könnten
     * aneinander vorbei einen Kreis erzeugen.
     */
    async move(id, newParentId, now) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Diesen Ordner gibt es nicht.'));
      if (newParentId !== null && loadOne(newParentId) === null) {
        return err(taktError('not_found', 'Den Zielordner gibt es nicht.'));
      }

      const targetAncestors = newParentId === null ? [] : ancestorsOf(newParentId);
      const allowed = checkFolderMove({ folderId: id, newParentId, targetAncestors });
      if (!allowed.ok) return err(allowed.error);

      const outcome = attempt(() =>
        conn
          .prepare('UPDATE tag_folder SET parent_id = ?, updated_at = ? WHERE id = ?')
          .run(newParentId, now, id),
      );
      if (!outcome.ok) return err(outcome.error as never);

      const moved = loadOne(id);
      if (moved === null) return err(taktError('not_found', 'Diesen Ordner gibt es nicht.'));
      return ok(moved);
    },

    /**
     * Ein Ordner wird nicht gelöscht, solange er **Inhalt** hat oder in einer
     * **Regel** steht (A-4.5, A-4.6, E-057, R-1 Befund 1).
     *
     * ---------------------------------------------------------------------------
     * Warum die zweite Frage seit T-089 danebensteht
     * ---------------------------------------------------------------------------
     *
     * Bis T-089 fragte diese Stelle nur nach dem Inhalt. Löschbar war also
     * genau ein **leerer** Ordner — und der leere Ordner in einer
     * erforderlichen Achse ist der Fall, um den es in E-057 geht. Die Wirkung
     * war die, gegen die E-057 geschrieben ist, nur über die Hintertür: Die
     * Regel „Ordner Ost **und** Status offen" verlor beim Löschen von Ost
     * still ihren Term und hieß danach „Status offen". Sie traf **mehr**, als
     * der Benutzer gesagt hatte, und eine Spalte, die zu viel zeigt, fällt
     * niemandem auf.
     *
     * Zwei Funktionen weiter oben, bei `TagPort.remove`, stand dieselbe
     * Überlegung längst ausgeschrieben; hier fehlte sie.
     *
     * Seit Migration 0012 steht `pool_rule.folder_id` zusätzlich auf
     * ON DELETE **RESTRICT** — dieselbe Bauart wie bei `status_id` (0011): Die
     * Datenbank weist ab, und diese Prüfung nimmt ihr das Wort aus dem Mund.
     * „Dieser Ordner wird in der Regel eines Pools verwendet" statt
     * „FOREIGN KEY constraint failed", und mit den Namen der Regeln in
     * `details`, damit der Benutzer weiß, wo er nachsehen muss.
     *
     * ---------------------------------------------------------------------------
     * Warum `tag_in_use` und kein eigener Schlüssel
     * ---------------------------------------------------------------------------
     *
     * Es ist wörtlich derselbe Sachverhalt wie bei einem Tag in einer Regel,
     * und dort heißt er `tag_in_use` — drei verschiedene Gründe teilen sich
     * diesen Schlüssel bereits (Todos, Regel, Standard-Tag). Der Fehlerschlüssel
     * ist eine Zusage an seine Aufrufer; ein vierter Schlüssel für denselben
     * Satz hätte jede Fehleranzeige um einen Zweig verlängert, ohne dass
     * jemand anders damit umgeht. Welches Ding gemeint ist, sagt die Route.
     */
    async remove(id) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Diesen Ordner gibt es nicht.'));

      const content = conn
        .prepare(
          `SELECT (SELECT COUNT(*) FROM tag_folder WHERE parent_id = ?) AS folders,
                  (SELECT COUNT(*) FROM tag        WHERE folder_id = ?) AS tags`,
        )
        .get(id, id);

      if (
        content !== undefined &&
        (integer(content, 'folders') > 0 || integer(content, 'tags') > 0)
      ) {
        return err(
          taktError(
            'tag_folder_not_empty',
            'Dieser Ordner ist nicht leer. Verschieben oder löschen Sie zuerst seinen Inhalt.',
          ),
        );
      }

      // Die Regel beim Namen: `pool_id` und `name` stehen der Abfrage ohnehin
      // zur Verfügung, und ohne sie ist die Sperre bei zwanzig Regeln eine
      // Suche. `ix_pool_rule_folder` trägt die Frage (Migration 0011); die
      // Obergrenze steht an {@link RULE_REFERENCE_PROBE} (R-3a H-3).
      const usedIn = conn
        .prepare(
          `SELECT DISTINCT p.id AS id, p.name AS name
             FROM pool_rule r JOIN pool p ON p.id = r.pool_id
            WHERE r.folder_id = ?
            ORDER BY p.position, p.name
            LIMIT ${String(RULE_REFERENCE_PROBE)}`,
        )
        .all(id);

      if (usedIn.length > 0) {
        const { details, notice } = poolReferences(usedIn);
        return err({
          code: 'tag_in_use' as const,
          message: `Dieser Ordner wird in der Regel eines Pools verwendet.${notice}`,
          details,
        });
      }

      const outcome = attempt(() => conn.prepare('DELETE FROM tag_folder WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as never);
      return ok(undefined);
    },
  };
}


/**
 * Pools (A-3.1 bis A-3.4).
 *
 * **Es gibt keine Methode, die eine Mitgliedschaft speichert.** Das ist keine
 * Auslassung, sondern die Voraussetzung für A-2.5: Wird ein erledigtes Todo
 * durch einen Timerstart wieder aktiv, ändert sich an seinen Tags nichts — es
 * erscheint ohne Zutun wieder in seinem Pool, weil es ihn nie verlassen hat.
 * Ein gespeicherter Mitgliederstand müsste an dieser Stelle nachgezogen werden
 * und wäre die wahrscheinlichste Fehlerquelle des ganzen Ablaufs.
 */
/**
 * Pools **und** Kanban-Spalten (A-3.*, E-054).
 *
 * Eine Entität, zwei Flächen. Seit E-054 ist eine Kanban-Spalte eine Regel über
 * Tags wie ein Pool; `pool.placement` sagt, wo sie erscheint. Es gibt deshalb
 * keinen zweiten Adapter für Spalten — er wäre dieser hier, abgeschrieben samt
 * `resolvePoolRule` und der rekursiven Ordnerauflösung.
 *
 * `load`, `resolveRule` und `members` fragen **nicht** nach der Fläche: Eine
 * Spalte ist über `/pools/{id}` ladbar und blättert über `/pools/{id}/todos`
 * weiter wie jeder Pool. Allein `list` unterscheidet, weil allein dort die
 * Frage „was steht auf dieser Fläche?" gestellt wird.
 */
export function createPoolPort(
  conn: SqlConnection,
  ids: IdSource,
  searchTodos: (filter: TodoFilter, pagination?: Pagination) => Promise<Page<Todo>>,
): PoolPort {
  /**
   * Alle drei Rollen einer Regel in **einer** Abfrage (T-076).
   *
   * Nicht drei Abfragen mit je einem `WHERE role = ?`: Es ist derselbe
   * Indexzugriff auf `ux_pool_rule (pool_id, role, …)`, und drei Aufrufe je
   * geladener Regel wären auf der Pool-Liste dreimal so viele wie nötig.
   * Sortiert wird nach `role`, damit die Reihenfolge nicht davon abhängt, in
   * welcher Folge SQLite die Zeilen zurückgibt.
   */
  const partsOf = (
    id: PoolId,
  ): {
    readonly required: readonly PoolTagTerm[];
    readonly excluded: readonly PoolTagTerm[];
    readonly statusIds: readonly StatusId[];
  } => {
    const required: PoolTagTerm[] = [];
    const excluded: PoolTagTerm[] = [];
    const statusIds: StatusId[] = [];

    const rows = conn
      .prepare(
        `SELECT role, tag_id, folder_id, status_id FROM pool_rule
          WHERE pool_id = ?
          ORDER BY role, COALESCE(tag_id, folder_id, status_id)`,
      )
      .all(id);

    for (const row of rows) {
      const role = text(row, 'role');
      if (role === 'status') {
        // `text` und nicht eine Prüfung auf `null`: Der CHECK des Schemas sagt
        // zu, dass eine Zeile mit `role = 'status'` eine Kennung trägt. Eine
        // Zeile, die das nicht tut, ist ein Fehler im Schema und soll auffallen
        // — dieselbe Haltung wie in `toPoolRuleTerm` und `toTimeEntry`, wo ein
        // stiller Rückfall eine halbe Regel beziehungsweise eine Buchung mit
        // Dauer 0 ergäbe.
        statusIds.push(text(row, 'status_id') as StatusId);
        continue;
      }
      // Der CHECK des Schemas lässt nur `required`, `excluded` und `status` zu.
      // Alles, was nicht `excluded` ist, ist deshalb `required` — und ein Wert,
      // den es nicht geben kann, landet in der einschränkenderen der beiden
      // Listen und nicht in der ausschließenden.
      (role === 'excluded' ? excluded : required).push(toPoolRuleTerm(row));
    }

    return { required, excluded, statusIds };
  };

  const loadOne = (id: PoolId): Pool | null => {
    const row = conn.prepare(`SELECT ${POOL_COLUMNS} FROM pool WHERE id = ?`).get(id);
    if (row === undefined) return null;
    const parts = partsOf(id);
    return toPool(row, parts.required, { excludedTags: parts.excluded, statusIds: parts.statusIds });
  };

  /**
   * Schreibt **alle** Achsen, die als Zeilen in `pool_rule` stehen (T-076).
   *
   * Erst löschen, dann schreiben — wie zuvor, und aus demselben Grund in einem
   * Sicherungspunkt (siehe `update`). Neu ist, dass die drei Listen zusammen
   * geschrieben werden: Eine Änderung, die nur die erforderlichen Tags
   * ersetzte und die ausgeschlossenen stehen ließe, wäre eine halbe Regel, und
   * welche Hälfte gemeint war, könnte hier niemand entscheiden.
   */
  const writeRule = (
    poolId: PoolId,
    required: readonly PoolTagTerm[],
    excluded: readonly PoolTagTerm[],
    statusIds: readonly StatusId[],
  ): void => {
    conn.prepare('DELETE FROM pool_rule WHERE pool_id = ?').run(poolId);
    const insert = conn.prepare(
      'INSERT INTO pool_rule (pool_id, role, tag_id, folder_id, status_id) VALUES (?, ?, ?, ?, ?)',
    );
    // **Eine** Schleife für beide Taglisten, mit der Rolle als Argument. Zwei
    // Schleifen wären dieselbe Fallunterscheidung zweimal — und die zweite
    // wäre die, die beim nächsten Termtyp vergessen wird.
    const writeTerms = (role: 'required' | 'excluded', terms: readonly PoolTagTerm[]): void => {
      for (const term of terms) {
        if (term.kind === 'tag') insert.run(poolId, role, term.tagId, null, null);
        else insert.run(poolId, role, null, term.folderId, null);
      }
    };
    writeTerms('required', required);
    writeTerms('excluded', excluded);
    for (const statusId of statusIds) insert.run(poolId, 'status', null, null, statusId);
  };

  const nextPosition = (): number => {
    const row = conn.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM pool').get();
    return row === undefined ? 1 : integer(row, 'next');
  };

  return {
    async load(id) {
      return loadOne(id);
    },

    /**
     * Die Regeln einer Fläche, nach Position (E-054).
     *
     * Ohne Argument die Pool-Liste — die Begründung steht am Port. `'both'`
     * fällt in beide Antworten: dieselbe Regel, an zwei Stellen sichtbar, nicht
     * zwei Regeln.
     */
    async list(shownOn) {
      const surface = shownOn ?? 'pool';
      const rows =
        surface === 'all'
          ? conn.prepare(`SELECT ${POOL_COLUMNS} FROM pool ORDER BY position`).all()
          : conn
              .prepare(
                `SELECT ${POOL_COLUMNS} FROM pool WHERE placement IN (?, 'both') ORDER BY position`,
              )
              .all(surface);
      return rows.map((row) => {
        const parts = partsOf(text(row, 'id') as PoolId);
        return toPool(row, parts.required, {
          excludedTags: parts.excluded,
          statusIds: parts.statusIds,
        });
      });
    },

    /**
     * Kennung und Name jeder Regel, ohne Regelterme (T-074).
     *
     * Bewusst **nicht** über `list('all')`: Das löst für jede Regel zusätzlich
     * ihre Terme auf, und für die Frage „ist der Name vergeben?“ ist das eine
     * Abfrage je Regel zu viel. Eine Abfrage, ein Durchlauf, zwei Spalten.
     */
    async listNames() {
      return conn
        .prepare('SELECT id, name FROM pool ORDER BY position')
        .all()
        .map((row) => ({ id: text(row, 'id') as PoolId, name: text(row, 'name') }));
    },

    async create(pool, now) {
      const id = ids.next() as PoolId;
      // Die Neutralwerte der vier Achsen aus T-076 an **einer** Stelle, als
      // Vorspann statt als vier `??` weiter unten. Was der Aufrufer nennt,
      // gewinnt; was er wegläßt, steht neutral — dieselbe Vorgabe, die auch das
      // Schema setzt (Migration 0011).
      const axes = {
        excludedTags: [] as readonly PoolTagTerm[],
        statusIds: [] as readonly StatusId[],
        completion: 'any' as const,
        exportState: 'any' as const,
        ...pool,
      };
      conn
        .prepare(
          `INSERT INTO pool (id, name, match_mode, include_subfolders, placement, position,
                             completion, export_state, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          // Die Anzeigeform aus der Domäne, wie bei `TagPort.create` (T-058).
          // Der Anwendungsfall reicht sie bereits normalisiert herein; hier
          // steht sie ein zweites Mal, damit ein Aufrufer, der die Prüfung
          // umgeht, keinen Namen mit doppeltem Leerzeichen in den Bestand
          // bringt. Geurteilt wird dabei nicht — `normalizeName` weist nichts
          // ab, es vereinheitlicht nur.
          normalizeName(pool.name),
          pool.matchMode,
          pool.includeSubfolders ? 1 : 0,
          // Ohne genannte Fläche ein Pool — dieselbe Vorgabe wie im Schema
          // (Migration 0009). Sie steht hier ein zweites Mal, weil ein
          // weggelassener Wert im INSERT sonst `NULL` wäre und nicht die
          // Vorgabe: Die greift nur, wenn die Spalte gar nicht genannt wird.
          pool.placement ?? 'pool',
          pool.position > 0 ? pool.position : nextPosition(),
          // Ohne genannte Achse der Neutralwert (T-076) — dieselbe Bauart und
          // derselbe Grund wie bei `placement` eine Zeile darüber.
          axes.completion,
          axes.exportState,
          now,
          now,
        );
      writeRule(id, pool.rule, axes.excludedTags, axes.statusIds);
      const created = loadOne(id);
      if (created === null) throw new Error('Der angelegte Pool ist nicht auffindbar.');
      return created;
    },

    async update(id, pool, now) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Diesen Pool gibt es nicht.'));

      // Sicherungspunkt (T-047): `writeRule` löscht die Regel und schreibt sie
      // neu. Verweist ein Term auf ein Tag, das inzwischen gelöscht ist,
      // scheitert das INSERT an der Fremdschlüsselbedingung — als **Wert**,
      // nicht als Wurf. Zurück bliebe ein umbenannter Pool ganz **ohne** Regel,
      // und ein Pool ohne Regel ist kein leerer Pool, sondern einer, der alles
      // oder nichts zeigt.
      const outcome = attemptAtomically(conn, 'takt_pool_update', () => {
        const sets: string[] = [];
        const params: (string | number | null)[] = [];
        if (pool.name !== undefined) {
          sets.push('name = ?');
          // Dieselbe Vereinheitlichung wie beim Anlegen. Siehe dort.
          params.push(normalizeName(pool.name));
        }
        if (pool.matchMode !== undefined) {
          sets.push('match_mode = ?');
          params.push(pool.matchMode);
        }
        if (pool.includeSubfolders !== undefined) {
          sets.push('include_subfolders = ?');
          params.push(pool.includeSubfolders ? 1 : 0);
        }
        if (pool.placement !== undefined) {
          sets.push('placement = ?');
          params.push(pool.placement);
        }
        if (pool.position !== undefined) {
          sets.push('position = ?');
          params.push(pool.position);
        }
        if (pool.completion !== undefined) {
          sets.push('completion = ?');
          params.push(pool.completion);
        }
        if (pool.exportState !== undefined) {
          sets.push('export_state = ?');
          params.push(pool.exportState);
        }
        sets.push('updated_at = ?');
        params.push(now, id);
        conn.prepare(`UPDATE pool SET ${sets.join(', ')} WHERE id = ?`).run(...params);

        // Die drei Listen werden **gemeinsam** geschrieben, sobald eine von
        // ihnen genannt ist: `writeRule` löscht alle Zeilen der Regel und legt
        // sie neu an. Wer nur `rule` schickt, meint „diese erforderlichen Tags"
        // und nicht „lösche meine Ausschlüsse"; deshalb wird für jede nicht
        // genannte Liste der **vorhandene** Stand eingesetzt und nicht die
        // leere Liste.
        if (
          pool.rule !== undefined ||
          pool.excludedTags !== undefined ||
          pool.statusIds !== undefined
        ) {
          const current = partsOf(id);
          writeRule(
            id,
            pool.rule ?? current.required,
            pool.excludedTags ?? current.excluded,
            pool.statusIds ?? current.statusIds,
          );
        }
      });
      if (!outcome.ok) return err(outcome.error);

      const updated = loadOne(id);
      if (updated === null) return err(taktError('not_found', 'Diesen Pool gibt es nicht.'));
      return ok(updated);
    },

    async remove(id) {
      if (loadOne(id) === null) return err(taktError('not_found', 'Diesen Pool gibt es nicht.'));
      const outcome = attempt(() => conn.prepare('DELETE FROM pool WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as never);
      return ok(undefined);
    },

    /**
     * Löst die Regel zur vollständigen Tagmenge auf (A-3.3).
     *
     * Ordner-Regelteile ziehen bei `includeSubfolders` die Tags aller
     * Unterordner mit — beliebig tief, über eine rekursive Abfrage. Ohne sie
     * müsste der Aufrufer Ebene für Ebene nachladen, und die Antwort hinge
     * davon ab, wie tief er zu gehen bereit war.
     */
    async resolveRule(id) {
      return resolvePoolRule(conn, id);
    },

    /**
     * Dieselbe Auflösung für die **ausgeschlossenen** Tags (T-076).
     *
     * Ein Argument Unterschied, keine zweite Abfrage: Die rekursive
     * Ordnerauflösung steht einmal da und wird von beiden Listen benutzt.
     */
    async resolveExcluded(id) {
      return resolvePoolRule(conn, id, 'excluded');
    },

    /**
     * Beide Achsen samt der Ordner, aus denen nichts geworden ist (E-057).
     *
     * Dieselbe Auflösung wie die beiden Methoden darüber — sie rufen dieselbe
     * Funktion —, nur mit der Auskunft, die eine Tagmenge nicht tragen kann.
     */
    async resolveAxes(id) {
      const required = resolvePoolAxis(conn, id);
      const excluded = resolvePoolAxis(conn, id, 'excluded');
      return {
        required: { tagIds: required.tagIds, emptyFolderIds: required.emptyFolderIds },
        excluded: { tagIds: excluded.tagIds, emptyFolderIds: excluded.emptyFolderIds },
      };
    },

    /**
     * Mitglieder eines Pools — abgeleitet, nicht gespeichert.
     *
     * Die Abfrage geht über `TodoPort.search`, damit Pool-Ansicht und Liste
     * denselben Filter, dieselbe Sortierung und dieselbe Blätterung benutzen.
     * Eine zweite Abfrage hier wäre eine zweite Wahrheit über dieselbe Menge.
     */
    async members(id, filter, pagination) {
      return searchTodos({ ...(filter ?? {}), poolIds: [id] }, pagination);
    },
  };
}

/**
 * Eine Tagliste einer Regel als aufgelöste Tagmenge.
 *
 * Steht außerhalb von `createPoolPort`, weil `TodoPort.search` sie ebenfalls
 * braucht und die beiden Ports sich sonst gegenseitig halten müssten.
 *
 * `role` sagt, **welche** der beiden Taglisten gemeint ist (T-076). Der
 * Vorgabewert `'required'` ist die Liste, die es seit A-3.2 gibt: Jeder
 * Aufrufer aus der Zeit davor bekommt damit unverändert das, was er meinte.
 *
 * Die Auflösung ist für beide Listen dieselbe — Ordner samt Unterordnern,
 * beliebig tief, über eine rekursive Abfrage —, und das ist der Grund, warum es
 * hier eine Funktion mit einem Argument gibt und nicht zwei Funktionen: Die
 * zweite wäre die erste, abgeschrieben samt der rekursiven Abfrage.
 */
export function resolvePoolRule(
  conn: SqlConnection,
  poolId: PoolId | string,
  role: 'required' | 'excluded' = 'required',
): readonly TagId[] {
  return resolvePoolAxis(conn, poolId, role).tagIds;
}

/**
 * Was aus einer Tagachse geworden ist — die Tags, die Zahl der Terme **und**
 * die Ordner, aus denen nichts geworden ist (E-057).
 *
 * Der Zusatz gegenüber {@link resolvePoolRule} ist der Grund für E-057: Aus
 * `tagIds` allein läßt sich nicht ablesen, ob ein genannter Ordner etwas
 * beigetragen hat. Zwei Zustände sehen dort gleich aus —
 *
 *   „über Tags sagt diese Regel nichts"      → Neutralwert, die übrigen Achsen
 *                                              entscheiden
 *   „Ordner Ost genannt, Ost ist leer"       → Einschränkung ohne Treffer, die
 *                                              Regel trifft nichts
 *
 * — und der zweite verschwindet vollends, sobald daneben ein Tagterm steht:
 * Dann ist `tagIds` gefüllt, und die achsenweise Summe verrät den leeren Ordner
 * nicht mehr. Deshalb wird **je Ordnerterm** gezählt.
 *
 * Es kostet keine zweite Abfrage: Die Terme werden hier ohnehin gelesen, und
 * die rekursive Auflösung trägt die Wurzel, von der sie ausgegangen ist, in
 * derselben Zeile mit. Beurteilt wird nichts davon hier, sondern in der Domäne
 * (`tagAxisIsUnresolved`) — diese Datei liest, sie entscheidet nicht.
 */
export function resolvePoolAxis(
  conn: SqlConnection,
  poolId: PoolId | string,
  role: 'required' | 'excluded' = 'required',
): {
  readonly named: number;
  readonly tagIds: readonly TagId[];
  readonly emptyFolderIds: readonly TagFolderId[];
} {
  const pool = conn.prepare('SELECT include_subfolders FROM pool WHERE id = ?').get(poolId);
  // Eine Regel, die es nicht gibt, nennt auch nichts: `named: 0`. Sie ist damit
  // eine leere Regel und keine Einschränkung ohne Treffer — sie trifft nichts,
  // aber aus dem Grund aus A-3.4 und nicht aus dem aus E-057.
  if (pool === undefined) return { named: 0, tagIds: [], emptyFolderIds: [] };
  const includeSubfolders = integer(pool, 'include_subfolders') !== 0;

  const terms = conn
    .prepare('SELECT tag_id, folder_id FROM pool_rule WHERE pool_id = ? AND role = ?')
    .all(poolId, role);

  const tagIds = new Set<string>();
  const folderIds: string[] = [];

  for (const term of terms) {
    const tagId = term['tag_id'];
    if (typeof tagId === 'string') {
      tagIds.add(tagId);
      continue;
    }
    const folderId = term['folder_id'];
    // Zweimal derselbe Ordner ist ein Ordner: Sonst stünde er in der Auskunft
    // an die Oberfläche doppelt.
    if (typeof folderId === 'string' && !folderIds.includes(folderId)) folderIds.push(folderId);
  }

  const emptyFolderIds: string[] = [];

  if (folderIds.length > 0) {
    // `root` ist der Ordner **aus der Regel**, `id` der Tag, der über ihn
    // hereinkommt — auch aus beliebig tiefen Unterordnern. Ohne diese Spalte
    // wüßte der Aufrufer nur, wie viele Tags insgesamt herausgekommen sind,
    // und ein leerer Ordner neben einem gefüllten bliebe unsichtbar.
    const rows = includeSubfolders
      ? conn
          .prepare(
            `WITH RECURSIVE down(root, id, depth) AS (
                 SELECT f.id, f.id, 0 FROM tag_folder f WHERE f.id IN (${placeholders(folderIds.length)})
                 UNION
                 SELECT down.root, f.id, down.depth + 1
                   FROM tag_folder f JOIN down ON f.parent_id = down.id
                  WHERE down.depth < 1000
               )
               SELECT down.root AS root, t.id AS id FROM tag t JOIN down ON t.folder_id = down.id`,
          )
          .all(...folderIds)
      : conn
          .prepare(
            `SELECT folder_id AS root, id FROM tag WHERE folder_id IN (${placeholders(folderIds.length)})`,
          )
          .all(...folderIds);

    const filled = new Set<string>();
    for (const row of rows) {
      tagIds.add(text(row, 'id'));
      filled.add(text(row, 'root'));
    }
    // Die Reihenfolge ist die der Regel und nicht die der Abfrage: Die
    // Oberfläche nennt die Ordner in derselben Folge, in der sie im Formular
    // stehen.
    for (const folderId of folderIds) {
      if (!filled.has(folderId)) emptyFolderIds.push(folderId);
    }
  }

  // `named` zählt die **Terme**, nicht die Tags: Ein Ordnerterm ist eine
  // genannte Bedingung, gleich wie viele Tags er ergibt — auch keinen.
  return {
    named: terms.length,
    tagIds: [...tagIds] as TagId[],
    emptyFolderIds: emptyFolderIds as TagFolderId[],
  };
}

/** Der Modus einer Pool-Regel. Für die Filterübersetzung in `repo-todos.ts`. */
export function poolMatchMode(conn: SqlConnection, poolId: string): PoolMatchMode {
  const row = conn.prepare('SELECT match_mode FROM pool WHERE id = ?').get(poolId);
  return row !== undefined && text(row, 'match_mode') === 'all' ? 'all' : 'any';
}

/**
 * Die Achsen einer Regel, die **keine** Tagmenge sind (T-076).
 *
 * Für dieselbe Filterübersetzung wie `poolMatchMode` daneben. Eine Regel, die
 * es nicht gibt, liefert lauter Neutralwerte — und trifft in Verbindung mit
 * zwei leeren Taglisten damit nichts, so wie es `matchesPool` für sie
 * entschiede.
 */
export function poolAxes(
  conn: SqlConnection,
  poolId: string,
): {
  readonly statusIds: readonly StatusId[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
} {
  // Eine Regel, die es nicht gibt, liefert eine leere Zeile — und damit über
  // die Mapper lauter Neutralwerte.
  const row = conn.prepare('SELECT completion, export_state FROM pool WHERE id = ?').get(poolId) ?? {};

  return {
    statusIds: conn
      .prepare("SELECT status_id FROM pool_rule WHERE pool_id = ? AND role = 'status'")
      .all(poolId)
      .map((entry) => text(entry, 'status_id') as StatusId),
    // **Dieselben** Funktionen wie in `toPool`, nicht dieselbe Regel ein
    // zweites Mal. Beide Wege — die geladene Regel und die Filterübersetzung —
    // müssen aus demselben gespeicherten Wert dieselbe Achse lesen; zwei
    // Fassungen davon wären zwei Boards, von denen die Oberfläche eines zeigt
    // und die Abfrage das andere beantwortet.
    completion: toPoolCompletion(row['completion']),
    exportState: toPoolExportState(row['export_state']),
  };
}

export type { Timestamp };
