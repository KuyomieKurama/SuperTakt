-- Takt — migration 0029 "interface_preferences", backward direction
--
-- Both columns fall. Data loss, named: a disabled version check is enabled again and the
-- interface language returns to German. Neither column appears in an index, view, trigger or
-- other CHECK, so DROP COLUMN is allowed.

ALTER TABLE app_setting DROP COLUMN ui_language;
ALTER TABLE app_setting DROP COLUMN version_check_enabled;
