-- Takt — migration 0029 "interface_preferences", forward direction
-- Covers: A-28.1, A-28.2, E-120 (F-18, F-23), E-123
-- The migration runner sets PRAGMA foreign_keys before BEGIN and opens the transaction itself.
--
-- Two settings, both stored in the one-row table like every other setting (E-011), so that they
-- survive restart and the data archive (A-28.1, A-28.2, A-20.4).
--
-- version_check_enabled: 1 = the version check may ask GitHub (default, A-28.1). 0 = no request
--   and no outgoing connection at all, not even at start.
-- ui_language: language of the main interface, 'de' (default) or 'en' (A-28.2). It never reaches
--   the export file (E-123 point 4). The older column `locale` stays untouched: it was never read.
--
-- ADD COLUMN and no table rebuild: no existing column, reference, trigger or view changes.

ALTER TABLE app_setting ADD COLUMN version_check_enabled INTEGER NOT NULL DEFAULT 1
  CHECK (version_check_enabled IN (0, 1));

ALTER TABLE app_setting ADD COLUMN ui_language TEXT NOT NULL DEFAULT 'de'
  CHECK (ui_language IN ('de', 'en'));
