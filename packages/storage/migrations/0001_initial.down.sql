-- Takt — Migration 0001 "initial", Rückwärtsrichtung
-- Reihenfolge: erst Sichten, dann Trigger, dann Tabellen von den Blättern zur Wurzel.
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.

DROP VIEW IF EXISTS v_export_candidate;

DROP TRIGGER IF EXISTS trg_export_audit_no_delete;
DROP TRIGGER IF EXISTS trg_export_audit_no_update;
DROP TRIGGER IF EXISTS trg_export_run_group_no_delete;
DROP TRIGGER IF EXISTS trg_export_run_group_no_update;
DROP TRIGGER IF EXISTS trg_export_run_entry_no_delete;
DROP TRIGGER IF EXISTS trg_export_run_entry_no_update;
DROP TRIGGER IF EXISTS trg_export_run_no_delete;
DROP TRIGGER IF EXISTS trg_export_run_no_update;
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_update;
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_delete;
DROP TRIGGER IF EXISTS trg_time_entry_no_delete_exported;
DROP TRIGGER IF EXISTS trg_time_entry_locked;

DROP TABLE IF EXISTS app_setting;
DROP TABLE IF EXISTS export_audit;
DROP TABLE IF EXISTS export_run_entry;
DROP TABLE IF EXISTS export_run_group;
DROP TABLE IF EXISTS export_run;
DROP TABLE IF EXISTS export_template;
DROP TABLE IF EXISTS default_tag;
DROP TABLE IF EXISTS pool_rule;
DROP TABLE IF EXISTS pool;
DROP TABLE IF EXISTS time_entry;
DROP TABLE IF EXISTS todo_tag;
DROP TABLE IF EXISTS todo_note;
DROP TABLE IF EXISTS todo;
DROP TABLE IF EXISTS tag;
DROP TABLE IF EXISTS tag_folder;
DROP TABLE IF EXISTS todo_status;
