-- Takt — Migration 0005 "builtin_template_field_key", Rückwärtsrichtung
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- Stellt die Feldliste aus 0004 wortgleich wieder her, einschließlich des
-- Schlüssels `transform`. Verlustfrei: Geändert wird ausschließlich die
-- mitgelieferte Vorlage, keine vom Benutzer angelegte Kopie und kein
-- `template_snapshot` eines gelaufenen Exports — der ist unveränderlich und
-- trägt weiterhin die Fassung, mit der er tatsächlich geschrieben wurde.

DROP TRIGGER IF EXISTS trg_export_template_builtin_no_delete;
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_update;

UPDATE export_template
   SET definition = json('{"version":1,"fields":['
         || '{"name":"Call","source":"todo.callNumber","transform":"raw"},'
         || '{"name":"Zeit","source":"group.quarters","transform":"quarter_hours_to_number"},'
         || '{"name":"Notiz","source":"group.bookingNotes","transform":"base64"},'
         || '{"name":"WindowsUser","source":"system.windowsUser","transform":"raw"}]}'),
       updated_at = '2026-09-01T00:00:00Z'
 WHERE id = '01931000-0000-7000-8000-0000000000f1'
   AND is_builtin = 1;

CREATE TRIGGER trg_export_template_builtin_no_delete
BEFORE DELETE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

CREATE TRIGGER trg_export_template_builtin_no_update
BEFORE UPDATE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;
