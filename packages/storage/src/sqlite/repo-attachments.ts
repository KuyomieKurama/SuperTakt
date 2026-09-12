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
import {
  attachmentTargetFileName,
  attachmentTargetNamesFile,
  err,
  isAttachmentKind,
  ok,
  taktError,
} from '@takt/domain';

import { chunk, integer, placeholders, text, type SqlConnection, type SqlRow } from './database.ts';
import { attempt } from './errors.ts';
import { toAttachment } from './mappers.ts';
import type { IdSource } from './ids.ts';

/** Alle Spalten von `todo_attachment`, ausgeschrieben. */
const ATTACHMENT_COLUMNS =
  'a.id, a.todo_id, a.kind, a.title, a.target, a.position, a.created_at, ' +
  'a.origin, a.origin_sender, a.display_name, a.rebuilt';

/**
 * Das Fluchtzeichen der `LIKE`-Muster in dieser Datei (A-A-98).
 *
 * Ein Rückstrich, und das ist bei Windows-Pfaden **kein** Widerspruch: Geflohen
 * wird das **Muster**, nicht der Wert. Jeder Rückstrich eines Pfades wird dabei
 * verdoppelt und steht danach für genau einen Rückstrich — `%` und `_` aus einem
 * Dateinamen verlieren ihre Sonderbedeutung, statt sie zu behalten. Ohne diese
 * Zeile wäre ein Anhangspfad mit `_` ein Muster, das mehr trifft, als es soll.
 */
const LIKE_ESCAPE = '\\';

/** Ein Wert als `LIKE`-Muster, ohne Sonderbedeutung. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => LIKE_ESCAPE + character);
}

/**
 * Wie viele Namen höchstens in **einer** `LIKE`-Kette stehen.
 *
 * Kleiner als {@link PARAMETER_CHUNK} (500), und der Grund ist nicht die Zahl
 * der Parameter, sondern die Tiefe des Ausdrucks: Eine Kette aus `OR` ist für
 * SQLite ein linksgeneigter Baum, und `SQLITE_MAX_EXPR_DEPTH` liegt in der
 * Vorgabe bei 1000. Eine Kette, die diese Grenze reißt, wäre kein falsches
 * Ergebnis, sondern ein **Wurf** — und dieser Wurf landete im Aufräumlauf, der
 * daraufhin `unavailable` meldet und nichts anfaßt. Das ist der gutartige
 * Ausgang, und trotzdem ist er unnötig.
 */
const NAME_LIKE_CHUNK = 100;

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
            `INSERT INTO todo_attachment
               (id, todo_id, kind, title, target, position, created_at,
                origin, origin_sender, display_name, rebuilt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            id,
            input.todoId,
            input.kind,
            input.title,
            input.target,
            next,
            input.now,
            /*
             * Die vier Spalten aus Migration 0023 (A-A-84, A-A-97).
             *
             * **Ausgeschrieben und nicht ausgelassen.** Der `DEFAULT` der
             * Migration trägt die Zeilen, die es vorher gab; diese Anweisung
             * schreibt jede Spalte selbst, weil ein ausgelassenes Feld sonst
             * zweimal beantwortet würde — einmal von SQLite, einmal von der
             * Domäne —, und zwei Antworten über dieselbe Sache laufen
             * auseinander, ohne daß es jemand sieht.
             */
            input.origin ?? 'user',
            input.originSender ?? null,
            input.displayName ?? null,
            (input.rebuilt ?? false) ? 1 : 0,
          );
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

    async emailFileTargets(todoId) {
      /*
       * **Beide Bedingungen, und die zweite ist die tragende.** `kind = 'file'`
       * allein träfe auch jeden Pfad, den der Benutzer selbst eingetragen hat —
       * und dessen Datei gehört ihm. `origin = 'email'` schränkt auf die
       * Dateien ein, die dieser Dienst selbst geschrieben hat.
       */
      const rows = conn
        .prepare(
          "SELECT a.target FROM todo_attachment a WHERE a.todo_id = ? AND a.kind = 'file' AND a.origin = 'email'",
        )
        .all(todoId);
      return rows.map((row) => text(row, 'target'));
    },

    /*
     * **`knownImageTargets` ist in T-315 gestrichen**, und zwar ersatzlos: Die
     * Frage stellt jetzt `attachmentsNamingFiles` weiter unten, für beide
     * Aufräumläufe und mit der Regel aus `@takt/domain`.
     *
     * Was hier stand, war schnell und falsch — `kind = 'image' AND target IN
     * (namen)`, zeichengleich, über den Teilindex. Drei gemessene Wege hinaus,
     * und jeder kostete eine Bildkopie des Benutzers: abweichende
     * Groß-/Kleinschreibung, ein anderes `kind` auf der Zeile, und eine Zeile,
     * die dieselbe Datei mit ihrem **vollen Pfad** nennt, während hier mit
     * bloßen Namen gefragt wurde. Der letzte Weg entsteht ohne jeden Fehler und
     * ohne Schreibzugriff an der Tür vorbei: Ein Dateianhang, der auf eine
     * Bildkopie zeigt, ist eine gewöhnliche Eingabe.
     *
     * Wer die schnelle Frage vermißt, liest zuerst den Kopf von
     * {@link attachmentsNamingFiles}: Der Index machte sie schnell **und**
     * falsch, und die teure Richtung ist hier die richtige.
     */

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
       * **Die enge Frage — und seit T-315 ist ihre Enge die Eigenschaft**
       * (wortgleich die Begründung von {@link emailFileCount} seit T-314).
       *
       * Sie zählt über `ix_todo_attachment_image` mit `kind = 'image'` und hängt
       * damit als einzige der drei Fragen des Bildlaufs **gar nicht** am
       * `target`. Genau deshalb steht sie noch da: Wenn `target` seine Gestalt
       * gewechselt hat — weder der Name am Ende noch der Ordner am Anfang
       * wiederzufinden —, sagt sie als einzige weiter „der Bestand führt
       * Bildanhänge".
       *
       * Bis T-315 stand hier das Gegenteil: Die Zahl solle aus **derselben**
       * Menge kommen wie die Abfrage, gegen die sie sprechen sollte
       * (`knownImageTargets`, ebenfalls `kind = 'image'`). Das war der
       * Denkfehler. Zwei Antworten auf dieselbe Frage widersprechen einander
       * nie — verlor eine Zeile ihr `kind`, fiel sie aus beiden zugleich, null
       * stand gegen null, und die Datei fiel. Die Abfrage ist jetzt weit, diese
       * Zahl ist eng, und erst dadurch sind es zwei Fragen.
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
         * Diese Zahl ist einer der beiden **Widerspruchsriegel** des Bildlaufs
         * (T-179 B-1, seit T-315 gegen die weite Eigentümerfrage gehalten):
         * Findet `sweepOrphanedImages` Bilddateien ohne Eigentümer, dann
         * entscheidet `imageCount()` mit darüber, ob der Lauf abbricht oder
         * **jede gefundene Datei als Waise löscht**. Eine `0` aus einer
         * unmöglichen Lage öffnet genau diesen Riegel: Der Unmöglichkeitsfall
         * hätte still das Gegenteil dessen ausgelöst, wofür die Zahl gebaut
         * wurde.
         *
         * Den Zweig zu streichen ginge nur mit einer Zusicherung am
         * Übersetzer, und die verschöbe dieselbe Annahme ungeprüft in die
         * Laufzeit. Deshalb dieselbe Antwort, die `text` und `integer` in
         * `database.ts` auf denselben Fall geben: ein lauter Fehler statt eines
         * stillen Rückfalls. Der Aufrufer fängt ihn — `orphan-sweep.ts` hat für
         * genau diese Zusage eine Klammer um alle Schritte, schreibt eine
         * `warn`-Zeile und faßt nichts an.
         */
        throw new Error('COUNT(*) über die Bildanhänge lieferte keine Zeile.');
      }
      return integer(row, 'total');
    },

    async attachmentsNamingFiles(names) {
      /*
       * **Keine Abkürzung für die leere Liste, und das ist Absicht.** `chunk`
       * liefert für eine leere Menge keine Blöcke, die Schleife läuft nicht,
       * und die Antwort ist dieselbe. Ein Zweig, der nur eine Anweisung spart,
       * ist an dieser Stelle ein Zweig ohne Prüffall — und in einer Datei, die
       * über Löschungen entscheidet, sind ungeprüfte Zweige das teuerste
       * Sparergebnis.
       */
      const owned = new Set<string>();

      /*
       * ==================================================================
       * Die weiteste Bedingung kann keinen Index benutzen, und das ist der
       * Preis, den A-A-98 ausdrücklich bezahlt
       * ==================================================================
       *
       * Gefragt ist „welche Zeile nennt diesen **Namen**" — ein Vergleich am
       * **Ende** einer Zeichenkette. Kein Index dieser Datenbank steht auf dem
       * Ende von `target`; jede Frage dieser Art ist ein vollständiger Lauf
       * über die Tabelle. Bis T-313 stand hier statt dessen ein zeichengleiches
       * `IN` über `ix_todo_attachment_email`, und das war schnell und falsch:
       * Es hat `c:\…` nicht als denselben Pfad wie `C:\…` erkannt und eine
       * Datei mit Eigentümer entfernt (T-313-1).
       *
       * **Seit T-315 stellen beide Aufräumläufe diese eine Frage** — die
       * übernommenen E-Mail-Dateien und die Bildkopien. Der Bildlauf hatte bis
       * dahin seine eigene, engere Fassung (`knownImageTargets`), und sie war
       * die ältere und ausgelieferte: Sie kostete eine Bildkopie schon dann,
       * wenn eine Zeile dieselbe Datei mit ihrem **vollen Pfad** nannte. Wer
       * hier eine zweite Fassung für einen dritten Ordner anlegt, baut denselben
       * Fehler ein drittes Mal.
       *
       * **Die Vorauswahl hier ist absichtlich weiter als die Entscheidung.**
       * `LIKE '%name%'` trifft jede Zeile, die den Namen **irgendwo** trägt;
       * entschieden wird danach in `attachmentTargetNamesFile` (@takt/domain),
       * und die Regel steht dort ein einziges Mal. Eine Vorauswahl, die enger
       * wäre als die Entscheidung, hielte Zeilen zurück, die der Entscheider
       * als Eigentümer erkannt hätte — und jede zurückgehaltene Zeile ist eine
       * gelöschte Datei. Wer diese Anweisung ändert, prüft zuerst diesen Satz.
       *
       * `LIKE` faltet in SQLite ASCII (kein `ICU` geladen) — dieselbe Faltung
       * wie in der Domäne, und aus demselben Grund dort ausgeschrieben.
       *
       * Gelesen wird ausschließlich `target` (B-2.4).
       */
      for (const block of chunk([...names], NAME_LIKE_CHUNK)) {
        const rows = conn
          .prepare(
            `SELECT a.target FROM todo_attachment a
              WHERE ${block.map(() => `a.target LIKE ? ESCAPE '${LIKE_ESCAPE}'`).join(' OR ')}`,
          )
          .all(...block.map((name) => `%${escapeLike(name)}%`));
        for (const row of rows) {
          const target = text(row, 'target');
          // `Set.add` auf einen vorhandenen Namen ist ein Aufruf ohne Wirkung;
          // eine vorgeschaltete Abfrage spart ihn und kostet einen Zweig, den
          // niemand prüft. Siehe oben.
          for (const name of block) {
            if (attachmentTargetNamesFile(target, name)) owned.add(name);
          }
        }
      }
      return owned;
    },

    async attachmentNamesUnder(directory) {
      const names = new Set<string>();
      const root = directory.replace(/[\\/]+$/, '');
      if (root === '') return names;

      /*
       * **Die andere Achse:** der Anfang des Pfades statt sein Ende. Beide
       * Trennerschreibweisen, weil ein Bestand aus einem Windows-Rechner auf
       * einem Linux-Dienst gelesen werden kann und umgekehrt; die Faltung
       * besorgt `LIKE`.
       *
       * Was dieser Vergleich **nicht** trifft: die Kurznamensform
       * (`C:\PROGRA~1`), Verbindungspunkte, einen zweiten Laufwerksbuchstaben
       * auf dasselbe Ziel. Das ist hingenommen und nicht übersehen — diese
       * Antwort bremst den Aufräumlauf, sie löscht nie. Eine zu kleine Antwort
       * kostet eine Bremse; eine zu kleine Antwort von
       * {@link attachmentsNamingFiles} kostete eine Datei.
       */
      // Erst der Ordner in der jeweiligen Trennerschreibweise, **dann** die
      // Flucht über das Ganze: Ein Rückstrich, der erst nach dem Fliehen
      // angehängt würde, wäre im Muster ein Fluchtzeichen und kein Trenner.
      const windows = `${root.replace(/\//g, '\\')}\\`;
      const posix = `${root.replace(/\\/g, '/')}/`;
      const patterns = [`${escapeLike(windows)}%`, `${escapeLike(posix)}%`];
      const rows = conn
        .prepare(
          `SELECT a.target FROM todo_attachment a
            WHERE a.target LIKE ? ESCAPE '${LIKE_ESCAPE}'
               OR a.target LIKE ? ESCAPE '${LIKE_ESCAPE}'`,
        )
        .all(...patterns);
      for (const row of rows) names.add(attachmentTargetFileName(text(row, 'target')));
      return names;
    },

    async attachmentNamesOfKind(kind) {
      /*
       * **Die andere Hälfte der ersten Gegenfrage — für einen Ordner, dessen
       * `target` gar keinen Pfad trägt** (T-320).
       *
       * `attachmentNamesUnder` fragt am Anfang des Pfades und antwortet dem
       * Bildlauf deshalb im Regelfall leer: Eine gewöhnliche Bildzeile führt im
       * `target` den bloßen Namen. Diese Frage hängt statt dessen an der Art
       * und faltet den Namen aus dem `target` heraus — egal ob dort ein Name
       * steht oder ein Pfad.
       *
       * **`kind` ist gebunden und nicht eingesetzt**, obwohl der Vorrat
       * geschlossen ist und aus der Domäne kommt. Eine Zeichenkette in eine
       * Anweisung zu setzen ist an dieser Stelle kein Tempogewinn, sondern die
       * Gewohnheit, die irgendwann an einem Wert aus dem Bestand bricht.
       *
       * Gelesen wird ausschließlich `target` (B-2.4).
       */
      const names = new Set<string>();
      const rows = conn
        .prepare('SELECT a.target FROM todo_attachment a WHERE a.kind = ?')
        .all(kind);
      for (const row of rows) names.add(attachmentTargetFileName(text(row, 'target')));
      return names;
    },

    async emailFileCount() {
      /*
       * **Die enge Frage — und seit T-314 ist ihre Enge die Eigenschaft.**
       *
       * Sie zählt über `ix_todo_attachment_email` mit
       * `origin = 'email' AND kind = 'file'` und ist damit die einzige der drei
       * Fragen des Aufräumlaufs, die überhaupt nicht am Pfad hängt. Genau
       * deshalb steht sie noch da: Wenn `target` seine Gestalt gewechselt hat —
       * weder der Name am Ende noch der Ordner am Anfang wiederzufinden —,
       * sagt sie als einzige weiter „der Bestand führt übernommene Dateien".
       *
       * Bis T-313 war sie die **einzige** Gegenfrage, und sie stellte dieselbe
       * Bedingung wie die Abfrage, der sie widersprechen sollte. Zwei Antworten
       * auf dieselbe Frage widersprechen einander nie: Verlor eine Zeile ihr
       * `origin`, fiel sie aus beiden zugleich, null stand gegen null, und
       * beide Dateien wurden entfernt (T-313-2). Die Abfrage ist jetzt weit,
       * diese Zahl ist eng, und erst dadurch sind es zwei Fragen.
       */
      const row = conn
        .prepare(
          `SELECT COUNT(*) AS total FROM todo_attachment
            WHERE origin = 'email' AND kind = 'file'`,
        )
        .get();
      if (row === undefined) {
        /*
         * **Unerreichbar, und trotzdem kein `0`** — wortgleich die Begründung
         * von {@link imageCount}: Diese Zahl ist einer der beiden
         * Widerspruchsriegel des E-Mail-Aufräumlaufs. Eine `0` aus einer
         * unmöglichen Lage öffnete genau den Riegel, für den sie gebaut ist.
         * Ein lauter Fehler statt eines stillen Rückfalls; der Aufrufer hat
         * dafür seine Klammer und faßt danach nichts an.
         */
        throw new Error('COUNT(*) über die übernommenen E-Mail-Dateien lieferte keine Zeile.');
      }
      return integer(row, 'total');
    },
  };
}
