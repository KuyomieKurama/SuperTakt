/**
 * Takt — Anhänge eines Todos (A-19.8 bis A-19.15, E-071, A-A-18).
 *
 * ---------------------------------------------------------------------------
 * Diese Datei verbindet nichts mit dem Export, und das ist keine Zufälligkeit
 * ---------------------------------------------------------------------------
 *
 * Es gibt hier keine Abfrage, die `todo_attachment` mit `time_entry`,
 * `export_run_entry` oder `v_export_candidate` verbindet — dieselbe Aussage
 * wie im Kopf von `repo-todos.ts` über `todo_note`. `SELECT *` kommt nirgends
 * vor: Jede Spalte ist ausgeschrieben, damit eine später ergänzte nicht von
 * selbst in einen Datensatz gerät (A-19.17, R-06).
 *
 * Der eigentliche Schutz liegt aber nicht hier, sondern im Typ:
 * `ExportCandidate` und `ExportGroup` haben kein Anhangsfeld, und
 * `ExportSourcePath` bleibt bei zwölf Werten (A-A-20). Eine Vorlage — auch
 * eine beliebige, nicht nur die Standardvorlage — kann einen Anhang deshalb
 * gar nicht auflösen.
 *
 * ---------------------------------------------------------------------------
 * `position` bestimmt der Adapter
 * ---------------------------------------------------------------------------
 *
 * Sie ist die nächste freie Stelle an diesem Todo, gelesen in derselben
 * Transaktion, in der eingefügt wird. Kein Aufrufer gibt sie an: Zwei Anhänge
 * auf derselben Stelle machten die Reihenfolge wieder zu der der Datenbank,
 * und A-19.8 verlangt eine stabile.
 *
 * Die Kennung steht als zweiter Sortierschlüssel daneben. Sie ist UUIDv7 und
 * damit nach Erzeugungszeit sortierbar — zwei Anhänge, die dieselbe Stelle
 * trügen, kämen so trotzdem in der Reihenfolge ihres Entstehens.
 */

import type { AttachmentPort } from '../ports.ts';
import type {
  Attachment,
  AttachmentCreate,
  AttachmentId,
  Result,
  TaktError,
  TodoId,
} from '@takt/domain';
import { err, isAttachmentKind, ok, taktError } from '@takt/domain';

import { chunk, integer, placeholders, text, type SqlConnection, type SqlRow } from './database.ts';
import { attempt } from './errors.ts';
import { toAttachment } from './mappers.ts';
import type { IdSource } from './ids.ts';

/** Alle Spalten von `todo_attachment`, ausgeschrieben. */
const ATTACHMENT_COLUMNS = 'a.id, a.todo_id, a.kind, a.title, a.target, a.position, a.created_at';

/**
 * Zeilen, deren Art die Domäne nicht kennt, werden **übergangen**.
 *
 * Der Fall entsteht, wenn jemand an der Tür vorbei in den Bestand schreibt
 * (VG-3) oder wenn ein Bestand aus einer neueren Fassung stammt, die eine
 * vierte Art kennt. Beide Male ist „nicht anzeigen" die richtige Antwort und
 * „werfen" die falsche: Ein Todo, dessen Anhangsliste eine Ausnahme auslöst,
 * ist ein Todo, das man nicht mehr öffnen kann.
 *
 * Übergangen heißt **nicht gelöscht**. Der Datensatz bleibt liegen; eine
 * spätere Fassung, die die Art kennt, zeigt ihn wieder.
 */
function toAttachments(rows: readonly SqlRow[]): readonly Attachment[] {
  const out: Attachment[] = [];
  for (const row of rows) {
    if (!isAttachmentKind(text(row, 'kind'))) continue;
    out.push(toAttachment(row));
  }
  return out;
}

export function createAttachmentPort(conn: SqlConnection, ids: IdSource): AttachmentPort {
  const loadOne = (id: AttachmentId): Attachment | null => {
    const row = conn
      .prepare(`SELECT ${ATTACHMENT_COLUMNS} FROM todo_attachment a WHERE a.id = ?`)
      .get(id);
    if (row === undefined) return null;
    return toAttachments([row])[0] ?? null;
  };

  return {
    async list(todoId) {
      const rows = conn
        .prepare(
          `SELECT ${ATTACHMENT_COLUMNS} FROM todo_attachment a
            WHERE a.todo_id = ?
            ORDER BY a.position, a.id`,
        )
        .all(todoId);
      return toAttachments(rows);
    },

    async listMany(todoIds) {
      const map = new Map<TodoId, readonly Attachment[]>();
      if (todoIds.length === 0) return map;

      const collected = new Map<TodoId, Attachment[]>();
      for (const id of todoIds) collected.set(id, []);

      for (const block of chunk([...todoIds])) {
        const rows = conn
          .prepare(
            `SELECT ${ATTACHMENT_COLUMNS} FROM todo_attachment a
              WHERE a.todo_id IN (${placeholders(block.length)})
              ORDER BY a.todo_id, a.position, a.id`,
          )
          .all(...block);
        for (const attachment of toAttachments(rows)) {
          collected.get(attachment.todoId)?.push(attachment);
        }
      }

      for (const [todoId, list] of collected) map.set(todoId, list);
      return map;
    },

    async load(id) {
      return loadOne(id);
    },

    async create(input: AttachmentCreate): Promise<Result<Attachment, TaktError>> {
      const id = ids.next() as AttachmentId;

      /*
       * Die nächste freie Stelle, gelesen in derselben Transaktion. `COALESCE`
       * und kein `COUNT(*)`: Nach einem Löschvorgang wäre die Anzahl kleiner
       * als die höchste vergebene Stelle, und der nächste Anhang bekäme eine
       * Stelle, die schon einmal vergeben war.
       */
      const next = integer(
        conn
          .prepare(
            'SELECT COALESCE(MAX(position) + 1, 0) AS n FROM todo_attachment WHERE todo_id = ?',
          )
          .get(input.todoId) ?? { n: 0 },
        'n',
      );

      const outcome = attempt(() => {
        conn
          .prepare(
            `INSERT INTO todo_attachment (id, todo_id, kind, title, target, position, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(id, input.todoId, input.kind, input.title, input.target, next, input.now);
      });
      if (!outcome.ok) return err(outcome.error);

      const created = loadOne(id);
      if (created === null) {
        // Unerreichbar, solange das INSERT durchging: Die Zeile ist da, und
        // ihre Art steht in `todo_attachment_kind`. Der Zweig steht trotzdem,
        // weil `loadOne` unbekannte Arten übergeht — und wenn er je greift,
        // ist das ein Fund und keine leere Antwort.
        return err(taktError('storage_error', 'Der angelegte Anhang ist nicht auffindbar.'));
      }
      return ok(created);
    },

    async remove(id): Promise<Result<Attachment, TaktError<'not_found'>>> {
      /*
       * Erst lesen, dann löschen — und den gelesenen Wert zurückgeben.
       *
       * Der Aufrufer braucht bei einem Bild den erzeugten Dateinamen, um die
       * Kopie mitzunehmen (A-A-18). Nach dem `DELETE` könnte er ihn nicht mehr
       * lesen, und ihn vorher aus einer zweiten Abfrage zu holen wäre
       * derselbe Weg mit einer Gelegenheit mehr, ihn zu vergessen.
       */
      const existing = loadOne(id);
      if (existing === null) return err(taktError('not_found', 'Diesen Anhang gibt es nicht.'));

      conn.prepare('DELETE FROM todo_attachment WHERE id = ?').run(id);
      return ok(existing);
    },

    async imageTargets(todoId) {
      const rows = conn
        .prepare(
          "SELECT a.target FROM todo_attachment a WHERE a.todo_id = ? AND a.kind = 'image'",
        )
        .all(todoId);
      return rows.map((row) => text(row, 'target'));
    },

    async knownImageTargets(names) {
      const known = new Set<string>();
      if (names.length === 0) return known;

      /*
       * Gefragt wird nach den **gefundenen Dateien**, in Blöcken, über
       * `ix_todo_attachment_image` — den Teilindex aus Migration 0015, der
       * genau für diese Frage angelegt wurde. Kein `SELECT target FROM
       * todo_attachment WHERE kind = 'image'` ohne Bedingung: Das lüde alle
       * Bildziele des Bestands in den Speicher, um am Ende dieselbe Teilmenge
       * zu bilden.
       *
       * Die Zeilen dieser Abfrage tragen nur `target` — den **erzeugten**
       * Namen einer Kopie (A-A-17). Weder Titel noch Vermerk noch Todo werden
       * dabei gelesen.
       */
      for (const block of chunk([...names])) {
        const rows = conn
          .prepare(
            `SELECT a.target FROM todo_attachment a
              WHERE a.kind = 'image' AND a.target IN (${placeholders(block.length)})`,
          )
          .all(...block);
        for (const row of rows) known.add(text(row, 'target'));
      }
      return known;
    },

    async knownKinds() {
      /*
       * Ohne Bedingung, ohne Sortierung, ohne Verknüpfung: Die Tabelle hat drei
       * Zeilen, und gefragt ist genau, **welche** es sind (A-A-36).
       *
       * Kein `COUNT(*)`. Eine Zahl beantwortete die Frage nicht — drei Zeilen,
       * von denen eine `screenshot` heißt, wären dieselbe Drei und ein anderer
       * Bestand. Der Aufrufer vergleicht Mengen und nicht Größen.
       */
      const rows = conn.prepare(`SELECT kind FROM todo_attachment_kind`).all();
      return rows.map((row) => text(row, 'kind'));
    },

    async imageCount() {
      /*
       * Über `ix_todo_attachment_image` — denselben Teilindex wie
       * `knownImageTargets`, und das ist Absicht: Die Zahl soll aus **derselben
       * Menge** kommen, gegen die dort gefragt wird. Käme sie woanders her,
       * verglichen der Aufrufer zwei Antworten über zwei verschiedene Dinge,
       * und der Widerspruch, den er sucht, wäre keiner mehr.
       */
      const row = conn
        .prepare(`SELECT COUNT(*) AS total FROM todo_attachment WHERE kind = 'image'`)
        .get();
      if (row === undefined) {
        /*
         * **Unerreichbar — und trotzdem war die Antwort hier falsch** (T-188,
         * O-FT).
         *
         * `SELECT COUNT(*)` liefert unter SQLite immer genau eine Zeile, auch
         * ohne einen zutreffenden Datensatz. `undefined` kann mit dem echten
         * Treiber nicht entstehen; die Prüfung steht nur, weil `.get()` als
         * `SqlRow | undefined` deklariert ist. T-174 hat den Zweig deshalb zu
         * Recht **nicht** mit einem Prüffall zugedeckt, der eine Lage
         * behauptet, die es nicht gibt.
         *
         * Bis T-188 stand hier `? 0`, und das war der teuerste denkbare Wert.
         * Diese Zahl ist der **Widerspruchsriegel** aus T-179 B-1: Findet
         * `sweepOrphanedImages` Bilddateien, ordnet ihnen aber keinen einzigen
         * Anhang zu, dann entscheidet allein `imageCount() > 0` darüber, ob der
         * Lauf abbricht oder **jede gefundene Datei als Waise löscht**. Eine
         * `0` aus einer unmöglichen Lage öffnet genau diesen Riegel: Der
         * Unmöglichkeitsfall hätte still das Gegenteil dessen ausgelöst, wofür
         * die Zahl gebaut wurde.
         *
         * Den Zweig zu streichen ginge nur mit einer Zusicherung am
         * Übersetzer, und die verschöbe dieselbe Annahme ungeprüft in die
         * Laufzeit. Deshalb dieselbe Antwort, die `text` und `integer` in
         * `database.ts` auf denselben Fall geben: ein lauter Fehler statt eines
         * stillen Rückfalls. Der Aufrufer fängt ihn — `image-sweep.ts` hat für
         * genau diese Zusage eine Klammer um alle fünf Schritte, schreibt eine
         * `warn`-Zeile und faßt nichts an.
         */
        throw new Error('COUNT(*) über die Bildanhänge lieferte keine Zeile.');
      }
      return integer(row, 'total');
    },
  };
}
