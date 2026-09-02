/**
 * Takt — Exportvorlagen, Einstellungen und Standard-Tags (A-8.7, A-9.*, E-005, E-011).
 *
 * Die **Feldliste** einer Vorlage wird hier nicht gedeutet.
 * `ExportTemplateEnvelope.definition` ist in der Domäne `unknown`, weil das
 * Vorlagenformat dem Motor in `packages/export` gehört und sich
 * weiterentwickeln können soll, ohne dass Schema oder Domäne mitwandern
 * (E-005, Migration 0005). Dieses Paket prüft nur, dass es gültiges JSON ist —
 * das erzwingt ohnehin schon der CHECK `json_valid(definition)`. Die fachliche
 * Prüfung macht `validateExportTemplateDefinition`, und sie steht im
 * Anwendungsfall **vor** dem Schreiben.
 */

import type { AppSettingsPort, DefaultTagPort, ExportTemplatePort } from '../ports.ts';
import type { AppSettings, ExportTemplateEnvelope, ExportTemplateId } from '@takt/domain';
import { err, ok, taktError } from '@takt/domain';

import { text, type SqlConnection, type SqlValue } from './database.ts';
import { attempt } from './errors.ts';
import { toAppSettings, toDefaultTag, toExportTemplate } from './mappers.ts';
import type { IdSource } from './ids.ts';

const TEMPLATE_COLUMNS = 'id, name, is_builtin, definition, created_at, updated_at';

export function createExportTemplatePort(conn: SqlConnection, ids: IdSource): ExportTemplatePort {
  const loadOne = (id: ExportTemplateId): ExportTemplateEnvelope | null => {
    const row = conn.prepare(`SELECT ${TEMPLATE_COLUMNS} FROM export_template WHERE id = ?`).get(id);
    return row === undefined ? null : toExportTemplate(row);
  };

  return {
    async list() {
      return conn
        .prepare(`SELECT ${TEMPLATE_COLUMNS} FROM export_template ORDER BY is_builtin DESC, name COLLATE NOCASE`)
        .all()
        .map(toExportTemplate);
    },

    async load(id) {
      return loadOne(id);
    },

    /**
     * A-8.7 — die mitgelieferte Standardvorlage.
     *
     * Sie ist durch `ux_export_template_builtin` als einzige ihrer Art
     * gesichert und durch zwei Trigger gegen Ändern und Löschen. Fehlt sie,
     * ist der Bestand kaputt und nicht bloß leer — deshalb ein Wurf und kein
     * `null`.
     */
    async builtin() {
      const row = conn
        .prepare(`SELECT ${TEMPLATE_COLUMNS} FROM export_template WHERE is_builtin = 1 LIMIT 1`)
        .get();
      if (row === undefined) {
        throw new Error('Die mitgelieferte Standardvorlage fehlt im Bestand.');
      }
      return toExportTemplate(row);
    },

    async create(name, definition, now) {
      const id = ids.next() as ExportTemplateId;
      const outcome = attempt(() =>
        conn
          .prepare(
            `INSERT INTO export_template (id, name, is_builtin, definition, created_at, updated_at)
             VALUES (?, ?, 0, ?, ?, ?)`,
          )
          .run(id, name, JSON.stringify(definition), now, now),
      );
      if (!outcome.ok) return err(outcome.error);
      const created = loadOne(id);
      if (created === null) throw new Error('Die angelegte Vorlage ist nicht auffindbar.');
      return ok(created);
    },

    /**
     * Ändern. Die Standardvorlage wird abgewiesen, bevor die Anweisung läuft.
     *
     * Der Trigger `trg_export_template_builtin_no_update` täte es auch, aber
     * er meldet `builtin_template_immutable` als Abbruch. Die Prüfung hier
     * davor liefert denselben Schlüssel mit einem Satz, der sagt, was zu tun
     * ist: eine Kopie anlegen.
     */
    async update(id, name, definition, now) {
      const existing = loadOne(id);
      if (existing === null) return err(taktError('not_found', 'Diese Vorlage gibt es nicht.'));
      if (existing.isBuiltin) {
        return err(
          taktError(
            'builtin_template_immutable',
            'Die mitgelieferte Standardvorlage lässt sich nicht ändern. Legen Sie eine Kopie an.',
          ),
        );
      }

      const outcome = attempt(() => {
        const sets: string[] = [];
        const params: SqlValue[] = [];
        if (name !== undefined) {
          sets.push('name = ?');
          params.push(name);
        }
        if (definition !== undefined) {
          sets.push('definition = ?');
          params.push(JSON.stringify(definition));
        }
        sets.push('updated_at = ?');
        params.push(now, id);
        conn.prepare(`UPDATE export_template SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      });
      if (!outcome.ok) return err(outcome.error as never);

      const updated = loadOne(id);
      if (updated === null) return err(taktError('not_found', 'Diese Vorlage gibt es nicht.'));
      return ok(updated);
    },

    async remove(id) {
      const existing = loadOne(id);
      if (existing === null) return err(taktError('not_found', 'Diese Vorlage gibt es nicht.'));
      if (existing.isBuiltin) {
        return err(
          taktError(
            'builtin_template_immutable',
            'Die mitgelieferte Standardvorlage lässt sich nicht löschen. Sie ist kopierbar.',
          ),
        );
      }
      const outcome = attempt(() => conn.prepare('DELETE FROM export_template WHERE id = ?').run(id));
      if (!outcome.ok) return err(outcome.error as never);
      return ok(undefined);
    },
  };
}

/**
 * Einstellungen (E-011). Eine Zeile mit fester Kennung 1.
 *
 * Kein Schlüssel-Wert-Beutel: Jede Einstellung hat einen Typ, einen CHECK und
 * eine Migration. Das Add-in-Token steht ausdrücklich **nicht** hier, sondern
 * in einer eigenen Datei im Anwendungsdatenverzeichnis (E-009, R-09) — die
 * Datenbank wird kopiert, für Sicherungen und zur Fehlersuche, und ein Token
 * darin wanderte mit.
 */
export function createAppSettingsPort(conn: SqlConnection): AppSettingsPort {
  const COLUMNS =
    'export_directory, active_export_template_id, rounding_mode, locale, theme, updated_at';

  const read = (): AppSettings => {
    const row = conn.prepare(`SELECT ${COLUMNS} FROM app_setting WHERE id = 1`).get();
    if (row === undefined) {
      throw new Error('Die Einstellungszeile fehlt im Bestand.');
    }
    return toAppSettings(row);
  };

  return {
    async load() {
      return read();
    },

    async update(input) {
      const outcome = attempt(() => {
        const sets: string[] = [];
        const params: SqlValue[] = [];
        if (input.exportDirectory !== undefined) {
          sets.push('export_directory = ?');
          params.push(input.exportDirectory);
        }
        if (input.activeExportTemplateId !== undefined) {
          sets.push('active_export_template_id = ?');
          params.push(input.activeExportTemplateId);
        }
        if (input.roundingMode !== undefined) {
          sets.push('rounding_mode = ?');
          params.push(input.roundingMode);
        }
        if (input.locale !== undefined) {
          sets.push('locale = ?');
          params.push(input.locale);
        }
        if (input.theme !== undefined) {
          sets.push('theme = ?');
          params.push(input.theme);
        }
        sets.push('updated_at = ?');
        params.push(input.now);
        conn.prepare(`UPDATE app_setting SET ${sets.join(', ')} WHERE id = 1`).run(...params);
      });
      if (!outcome.ok) return err(outcome.error);
      return ok(read());
    },
  };
}

/**
 * Standard-Tags (A-9.1 bis A-9.5).
 *
 * Sie greifen im Anwendungsfall „Todo anlegen", nicht in der Oberfläche und
 * nicht im Add-in. Deshalb gelten sie für beide Wege gleichermaßen, ohne dass
 * einer von beiden die Regel kennen müsste — genau das verlangt A-9.5.
 */
export function createDefaultTagPort(conn: SqlConnection): DefaultTagPort {
  return {
    async list() {
      return conn
        .prepare('SELECT tag_id, position FROM default_tag ORDER BY position')
        .all()
        .map(toDefaultTag);
    },

    /**
     * Setzt die Liste vollständig neu.
     *
     * Erst leeren, dann schreiben. Ein Teilstück-Update über
     * `ux_default_tag_position` bräche am eindeutigen Index, sobald zwei Tags
     * die Plätze tauschen — dasselbe Muster wie bei den Kanban-Spalten.
     */
    async set(tagIds, now) {
      conn.prepare('DELETE FROM default_tag').run();
      const insert = conn.prepare('INSERT INTO default_tag (tag_id, position, created_at) VALUES (?, ?, ?)');
      let position = 1;
      for (const tagId of new Set(tagIds)) {
        insert.run(tagId, position, now);
        position += 1;
      }
      return conn
        .prepare('SELECT tag_id, position FROM default_tag ORDER BY position')
        .all()
        .map(toDefaultTag);
    },
  };
}

/** Kennung der Standardvorlage. Wird für die Vorschau ohne Vorlagenwahl gebraucht. */
export function builtinTemplateId(conn: SqlConnection): ExportTemplateId | null {
  const row = conn.prepare('SELECT id FROM export_template WHERE is_builtin = 1 LIMIT 1').get();
  return row === undefined ? null : (text(row, 'id') as ExportTemplateId);
}
