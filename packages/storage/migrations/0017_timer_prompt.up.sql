-- A-22.1: Leistungsabfrage beim Timerstopp ist abschaltbar.
ALTER TABLE app_setting ADD COLUMN prompt_on_timer_stop INTEGER NOT NULL DEFAULT 1
  CHECK (prompt_on_timer_stop IN (0, 1));
