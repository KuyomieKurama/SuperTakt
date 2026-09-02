-- Takt — Migration 0005 "builtin_template_field_key", Vorwärtsrichtung
-- Deckt: E-005, E-015. Auflage aus T-009 (Nachtrag), gemeldet vom Orchestrator.
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ---------------------------------------------------------------------------
-- Der Schlüssel heißt "transformation", nicht "transform"
-- ---------------------------------------------------------------------------
--
-- Migration 0002 und 0004 schrieben "transform". Der einzige Typ, der das Feld
-- überhaupt benennt, ist `ExportFieldDefinition` in `packages/export/src/model.ts`
-- (T-007), und der heißt `transformation`. `packages/domain/src/export.ts` sagt
-- dazu bewusst nichts: `ExportTemplateEnvelope.definition` ist `unknown`, weil
-- das Vorlagenformat dem Motor gehört und nicht der Domäne — es soll sich
-- weiterentwickeln können, ohne dass Schema oder Domäne mitwandern.
--
-- Damit gewinnt der Typ, und die Migration zieht nach. Die umgekehrte Richtung
-- wäre schlechter gewesen: Ein in SQL festgeschriebener Feldname zwänge den
-- Motor, sein eigenes Format nach der Datenbank zu benennen, und genau diese
-- Kopplung vermeidet `definition unknown`.
--
-- Die Werte bleiben englisch (E-015, „Bezeichner im Code englisch"): `raw`,
-- `base64`, `quarter_hours_to_number`. Das ist keine Änderung gegenüber 0004,
-- sondern die Bestätigung dessen, was dort schon steht.
--
-- Ohne diesen Schritt ist die nicht löschbare Standardvorlage für den
-- Vorlagen-Motor unlesbar: Er sucht `transformation`, findet nichts und weist
-- das Feld mit `validation_error` ab (A-8.7 — der Benutzer kann diese Vorlage
-- weder löschen noch reparieren).
--
-- Die Trigger auf export_template verbieten jede Änderung an der
-- Standardvorlage. Sie werden für die Dauer der Migration entfernt und danach
-- wortgleich wiederhergestellt, wie in 0004 und in der Rückwärtsrichtung von
-- 0002.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_export_template_builtin_no_delete;
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_update;

UPDATE export_template
   SET definition = json('{"version":1,"fields":['
         || '{"name":"Call","source":"todo.callNumber","transformation":"raw"},'
         || '{"name":"Zeit","source":"group.quarters","transformation":"quarter_hours_to_number"},'
         || '{"name":"Notiz","source":"group.bookingNotes","transformation":"base64"},'
         || '{"name":"WindowsUser","source":"system.windowsUser","transformation":"raw"}]}'),
       updated_at = '2026-09-01T00:00:00Z'
 WHERE id = '01931000-0000-7000-8000-0000000000f1'
   AND is_builtin = 1;

CREATE TRIGGER trg_export_template_builtin_no_delete
BEFORE DELETE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

CREATE TRIGGER trg_export_template_builtin_no_update
BEFORE UPDATE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;
