-- Takt — Migration 0004 "builtin_template_group_sources", Rückwärtsrichtung
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- Stellt die Feldliste aus 0002 wortgleich wieder her. Verlustfrei: Geändert
-- wird ausschließlich die mitgelieferte Vorlage, keine vom Benutzer angelegte
-- Kopie (A-8.7) und kein `template_snapshot` eines gelaufenen Exports — der ist
-- unveränderlich und trägt weiterhin die Fassung, mit der er tatsächlich
-- geschrieben wurde.
--
-- Nach der Rücknahme zeigt die Standardvorlage wieder auf `booking.*`. Das ist
-- kein Versehen, sondern der Sinn einer Rückwärtsmigration: Sie stellt den
-- Stand von 0002 her, einschließlich seiner Fehler.

DROP TRIGGER IF EXISTS trg_export_template_builtin_no_delete;
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_update;

UPDATE export_template
   SET definition = json('{"version":1,"fields":['
         || '{"name":"Call","source":"todo.callNumber","transform":"raw"},'
         || '{"name":"Zeit","source":"booking.durationSeconds","transform":"round_to_quarter_hour"},'
         || '{"name":"Notiz","source":"booking.note","transform":"base64"},'
         || '{"name":"WindowsUser","source":"system.windowsUser","transform":"raw"}]}'),
       updated_at = '2026-01-01T00:00:00Z'
 WHERE id = '01931000-0000-7000-8000-0000000000f1'
   AND is_builtin = 1;

CREATE TRIGGER trg_export_template_builtin_no_delete
BEFORE DELETE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

CREATE TRIGGER trg_export_template_builtin_no_update
BEFORE UPDATE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;
