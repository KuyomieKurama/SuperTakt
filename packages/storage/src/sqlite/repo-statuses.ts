/**
 * Takt — der **Status** eines Todos (A-5.3, A-5.4, E-023, E-054).
 *
 * **Seit E-054 ist das keine Kanban-Spalte.** Eine Spalte ist eine Regel über
 * Tags und liegt in `pool` (`repo-tags.ts`, datenmodell.md 3.5); der Status ist
 * eine Eigenschaft am Todo und liegt hier. Die Wörter in den Meldungen dieser
 * Datei sagen das seit T-074 auch — bis dahin sprachen fünf von ihnen von einer
 * „Spalte", und die erste davon erscheint im Einstellungsbereich *Status*, zwei
 * Absätze unter der Erklärung, dass beides zweierlei ist.
 *
 * Ein Status trägt **kein** Merkmal „Erledigt". Erledigt (A-2.4) und der
 * Abschlussstatus (A-5.3) sind zwei getrennte Achsen: Ein Todo kann „Done"
 * tragen und nicht erledigt sein, und es kann erledigt sein und „In Progress"
 * tragen. Das Kennzeichen ist `todo.completed_at` und hängt an keinem Status.
 *
 * Die Neuordnung ist ein eigener Vorgang und kein Feld auf `update`. Grund ist
 * `ux_todo_status_position`: Der eindeutige Index bricht, sobald zwei Zeilen
 * auch nur für die Dauer einer Anweisung dieselbe Position tragen. Eine
 * Neuordnung, die Zeile für Zeile schreibt, ist deshalb nicht bloß langsam,
 * sondern schlägt fehl.
 */

import type { TodoStatusPort } from '../ports.ts';
import type { StatusId, TodoStatus } from '@takt/domain';
import { err, ok, taktError } from '@takt/domain';

import { integer, text, type SqlConnection } from './database.ts';
import { attemptAtomically } from './atomic.ts';
import { attempt } from './errors.ts';
import { RULE_REFERENCE_PROBE, poolReferences, toTodoStatus } from './mappers.ts';
import type { IdSource } from './ids.ts';

const COLUMNS = 'id, name, position, is_default, color, created_at, updated_at';

export function createTodoStatusPort(conn: SqlConnection, ids: IdSource): TodoStatusPort {
  const loadOne = (id: StatusId): TodoStatus | null => {
    const row = conn.prepare(`SELECT ${COLUMNS} FROM todo_status WHERE id = ?`).get(id);
    return row === undefined ? null : toTodoStatus(row);
  };

  return {
    async list() {
      return conn.prepare(`SELECT ${COLUMNS} FROM todo_status ORDER BY position`).all().map(toTodoStatus);
    },

    async load(id) {
      return loadOne(id);
    },

    /**
     * Der Standard für neue Todos.
     *
     * Die zweite Zeile ist ein **Rückfall**, kein Normalweg: Gibt es keinen
     * Standard, wird der erste nach Position genommen. Über die Routen ist das
     * seit T-074 nicht mehr erreichbar — weder `remove` noch `update` lassen
     * den letzten Standard fallen —, und Migration 0002 setzt einen. Der
     * Rückfall bleibt für einen Bestand, an dem jemand von Hand gearbeitet hat;
     * ohne ihn schlüge dort jedes Anlegen eines Todos fehl.
     *
     * Bis T-074 war er der stille Ausgang aus einer Lücke: Wer den Standard
     * löschte, bekam wortlos einen anderen. Genau das ist jetzt zu.
     */
    async defaultStatus() {
      const row =
        conn.prepare(`SELECT ${COLUMNS} FROM todo_status WHERE is_default = 1 LIMIT 1`).get() ??
        conn.prepare(`SELECT ${COLUMNS} FROM todo_status ORDER BY position LIMIT 1`).get();
      if (row === undefined) throw new Error('Es gibt keinen einzigen Status.');
      return toTodoStatus(row);
    },

    async create(name, position, now, color = null) {
      const id = ids.next() as StatusId;
      const target =
        position > 0
          ? position
          : integer(
              conn.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM todo_status').get() ?? {
                next: 1,
              },
              'next',
            );

      // Sicherungspunkt (T-047): Das Rücken der Positionen und das Einfügen
      // gelten nur gemeinsam. Ein Name, den es schon gibt, lässt das INSERT
      // scheitern — `attempt` macht daraus einen **Wert**, die
      // Transaktionsklammer sieht keinen Wurf und schreibt fest. Zurück bliebe
      // ein Brett, auf dem jede Spalte ab der Zielposition um eins verrutscht
      // ist, während die Anwendung nichts als „Name bereits vergeben" meldet.
      const outcome = attemptAtomically(conn, 'takt_status_create', () => {
        // Platz schaffen: alle Spalten ab der Zielposition rücken eine weiter.
        // Absteigend, damit der eindeutige Index nie zwei gleiche Positionen
        // sieht — aufsteigend geschrieben kollidierte jede Zeile mit ihrem
        // eigenen Nachfolger.
        for (const row of conn
          .prepare('SELECT id, position FROM todo_status WHERE position >= ? ORDER BY position DESC')
          .all(target)) {
          conn
            .prepare('UPDATE todo_status SET position = ?, updated_at = ? WHERE id = ?')
            .run(integer(row, 'position') + 1, now, text(row, 'id'));
        }
        conn
          .prepare(
            `INSERT INTO todo_status (id, name, position, is_default, color, created_at, updated_at)
             VALUES (?, ?, ?, 0, ?, ?, ?)`,
          )
          .run(id, name, target, color, now, now);
      });
      if (!outcome.ok) return err(outcome.error as never);

      const created = loadOne(id);
      if (created === null) throw new Error('Der angelegte Status ist nicht auffindbar.');
      return ok(created);
    },

    async update(id, fields, now) {
      const current = loadOne(id);
      if (current === null) return err(taktError('not_found', 'Diesen Status gibt es nicht.'));

      /**
       * Der Standard lässt sich **weitergeben**, nicht abwählen (T-074).
       *
       * Dieselbe Lücke wie beim Löschen und in derselben Datei: `isDefault:
       * false` auf dem Standard räumte die Marke ab und ließ **null** zurück.
       * `ux_todo_status_default` sichert „höchstens einer", nicht „mindestens
       * einer"; danach fiel `defaultStatus()` still auf den ersten nach
       * Position. Die Oberfläche kennt die Regel — „abwählen lässt sich der
       * Standard nicht, nur weitergeben" steht dort ausgeschrieben —, der
       * Dienst kannte sie nicht.
       *
       * Auf einem Status, der ohnehin nicht der Standard ist, bleibt
       * `isDefault: false` wie bisher folgenlos.
       */
      if (fields.isDefault === false && current.isDefault) {
        return err(
          taktError(
            'default_status_locked',
            'Der Standard für neue Todos lässt sich nicht abwählen, nur weitergeben. Bestimmen Sie einen anderen Status zum Standard.',
          ),
        );
      }

      // Sicherungspunkt (T-047): Ohne ihn ist der schlimmste Fall dieser
      // Methode ein Bestand **ohne** Standardspalte. Wer gleichzeitig
      // `isDefault` setzt und auf einen vergebenen Namen umbenennt, räumt mit
      // der ersten Anweisung alle Standardmarken ab und scheitert mit der
      // zweiten — als Wert, nicht als Wurf. `defaultStatus()` wirft danach bei
      // jedem neuen Todo.
      const outcome = attemptAtomically(conn, 'takt_status_update', () => {
        if (fields.isDefault === true) {
          // Genau eine Standardspalte (`ux_todo_status_default`). Erst alle
          // abräumen, dann setzen — in der umgekehrten Reihenfolge stünden
          // kurzzeitig zwei da, und der Index bräche.
          conn.prepare('UPDATE todo_status SET is_default = 0, updated_at = ? WHERE is_default = 1').run(now);
        }
        const sets: string[] = [];
        const params: (string | number | null)[] = [];
        if (fields.name !== undefined) {
          sets.push('name = ?');
          params.push(fields.name);
        }
        if (fields.color !== undefined) {
          sets.push('color = ?');
          params.push(fields.color);
        }
        if (fields.isDefault !== undefined) {
          sets.push('is_default = ?');
          params.push(fields.isDefault ? 1 : 0);
        }
        sets.push('updated_at = ?');
        params.push(now, id);
        conn.prepare(`UPDATE todo_status SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      });
      if (!outcome.ok) return err(outcome.error);

      const updated = loadOne(id);
      if (updated === null) return err(taktError('not_found', 'Diesen Status gibt es nicht.'));
      return ok(updated);
    },

    /**
     * Neuordnung in **einem** Zug (A-5.4).
     *
     * Zwei Durchläufe: erst alle Positionen auf negative Werte, dann auf die
     * endgültigen. Der Umweg ist nicht Zierde — `ux_todo_status_position` ist
     * eindeutig, und jede Vertauschung zweier benachbarter Spalten kollidierte
     * ohne den Zwischenschritt mit sich selbst. Negative Positionen kommen im
     * Normalbestand nicht vor und können deshalb nichts treffen.
     */
    async reorder(order, now) {
      const known = conn.prepare('SELECT id FROM todo_status').all().map((row) => text(row, 'id'));
      const givenSet = new Set<string>(order);

      if (givenSet.size !== order.length || known.some((id) => !givenSet.has(id)) || order.length !== known.length) {
        return err(
          taktError(
            'validation_error',
            'Die Reihenfolge muss alle Status genau einmal nennen. Teilstücke sind nicht zulässig.',
          ),
        );
      }

      // Sicherungspunkt (T-047): Zwischen den beiden Durchläufen stehen **alle**
      // Positionen negativ. Scheitert der zweite, ist das der Bestand, der
      // festgeschrieben würde — ein Brett, dessen Spalten in umgekehrter
      // Reihenfolge stünden und dessen Neuordnung nie wieder gelänge.
      const outcome = attemptAtomically(conn, 'takt_status_reorder', () => {
        const shift = conn.prepare('UPDATE todo_status SET position = ? WHERE id = ?');
        order.forEach((id, index) => shift.run(-(index + 1), id));
        const settle = conn.prepare('UPDATE todo_status SET position = ?, updated_at = ? WHERE id = ?');
        order.forEach((id, index) => settle.run(index + 1, now, id));
      });
      if (!outcome.ok) return err(outcome.error);

      return ok(
        conn.prepare(`SELECT ${COLUMNS} FROM todo_status ORDER BY position`).all().map(toTodoStatus),
      );
    },

    /**
     * Löschen. Vier Gründe, die es verhindern, und alle vier sind fachlich.
     *
     * Der Fremdschlüssel `todo.status_id` steht auf `ON DELETE RESTRICT` und
     * würde den zweiten Fall ohnehin abweisen. Die Prüfung hier davor liefert
     * den fachlichen Grund statt einer Datenbankmeldung — der Unterschied ist
     * der zwischen „Diesen Status tragen noch Todos" und „FOREIGN KEY
     * constraint failed".
     *
     * **Der dritte Grund ist seit T-074 hier und nicht mehr nur in der
     * Oberfläche.** `ux_todo_status_default` sichert „höchstens **ein**
     * Standard", nicht „mindestens einer". Wer den Standard löschte, ließ null
     * zurück, und `defaultStatus()` fiel **still** auf den ersten nach Position
     * — ein neu angelegtes Todo landete danach woanders, ohne dass jemand es
     * erfahren hätte. `apps/web` sperrte den Knopf; wer die Route unmittelbar
     * aufrief, stellte trotzdem den Zustand her, den die Oberfläche für
     * unmöglich hielt.
     *
     * Abgewiesen statt umgehängt: Welcher Status danach der Standard sein soll,
     * ist eine Entscheidung des Benutzers und kein Rest, den eine Löschroutine
     * nebenbei trifft. Der Weg heißt `PATCH /todo-statuses/{id}` mit
     * `isDefault: true` auf einem anderen — und der ist in der Meldung genannt.
     */
    async remove(id) {
      const status = loadOne(id);
      if (status === null) return err(taktError('not_found', 'Diesen Status gibt es nicht.'));

      const count = conn.prepare('SELECT COUNT(*) AS n FROM todo_status').get();
      if (count !== undefined && integer(count, 'n') <= 1) {
        return err(
          taktError('last_status_column', 'Der letzte Status kann nicht gelöscht werden.'),
        );
      }

      if (status.isDefault) {
        return err(
          taktError(
            'default_status_locked',
            'Dieser Status ist der Standard für neue Todos und lässt sich deshalb nicht löschen. Machen Sie zuerst einen anderen Status zum Standard.',
          ),
        );
      }

      const used = conn.prepare('SELECT COUNT(*) AS n FROM todo WHERE status_id = ?').get(id);
      if (used !== undefined && integer(used, 'n') > 0) {
        return err(
          taktError(
            'status_in_use',
            'Diesen Status tragen noch Todos. Geben Sie ihnen zuerst einen anderen.',
          ),
        );
      }

      /**
       * Der vierte Grund, seit T-076: Der Status steht in der Regel eines Pools
       * oder einer Kanban-Spalte.
       *
       * Wörtlich dieselbe Lage wie bei einem Tag in einer Regel (`tag_in_use`,
       * A-4.5) — und seit Migration 0012 auch dieselbe Bauart: `pool_rule.tag_id`
       * und `pool_rule.folder_id` stehen seitdem wie `status_id` auf ON DELETE
       * **RESTRICT**. In allen drei Fällen weist die Datenbank selbst ab, und
       * diese Prüfung nimmt ihr nur das Wort aus dem Mund: „Diesen Status
       * benutzt noch eine Regel" statt „FOREIGN KEY constraint failed" — und
       * sie kann sagen, **welche**.
       *
       * Bis T-101 stand hier, `tag_id` sei CASCADE und die Prüfung im
       * Tag-Adapter deshalb die einzige Wache. Das war seit Migration 0012
       * falsch (R-1a Befund 3). Für `todo_tag` und `default_tag` gilt es
       * weiterhin — aber die stehen nicht in dieser Regel.
       *
       * Warum nicht kaskadieren: Eine Regel, der ihr letzter Statusterm
       * stillschweigend entzogen wird, hat danach eine Achse weniger und trifft
       * mehr Todos als vorher — oder, wenn es ihre einzige Achse war, gar
       * keine. Beides fiele erst auf, wenn jemand auf das Board sieht und sich
       * wundert.
       */
      /*
       * Und die Regel steht mit **Namen** in der Antwort (R-3 H-2, T-089).
       *
       * Der Satz allein sagt nicht, **welche** Regel. Bei einer Handvoll ist
       * das gleichgültig, bei zwanzig ist es eine Suche — und eine Sperre, aus
       * der man nicht herausfindet, ist nur halb reversibel. Die Abfrage hat
       * die `pool_id` ohnehin in der Hand; sie mitzugeben kostet nichts.
       *
       * `ix_pool_rule_status` trägt die Frage. Die Zahl der Namen ist seit
       * T-101 begrenzt ({@link RULE_REFERENCE_PROBE}, R-3a H-3): Bis dahin
       * stand hier, `pool_rule` halte „eine Handvoll von Hand eingerichteter
       * Zeilen" und brauche deshalb keine Obergrenze — das ist die Annahme, die
       * eine Grenze ersetzen soll, und Annahmen dieser Art altern.
       */
      const inRule = conn
        .prepare(
          `SELECT DISTINCT p.id AS id, p.name AS name
             FROM pool_rule r JOIN pool p ON p.id = r.pool_id
            WHERE r.status_id = ? AND r.role = 'status'
            ORDER BY p.position, p.name
            LIMIT ${String(RULE_REFERENCE_PROBE)}`,
        )
        .all(id);
      if (inRule.length > 0) {
        const { details, notice } = poolReferences(inRule);
        return err({
          code: 'status_in_use' as const,
          message: `Diesen Status benutzt noch die Regel eines Pools oder einer Kanban-Spalte. Nehmen Sie ihn dort zuerst heraus.${notice}`,
          details,
        });
      }

      const outcome = attempt(() => conn.prepare('DELETE FROM todo_status WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as never);
      return ok(undefined);
    },
  };
}
