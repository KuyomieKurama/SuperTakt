-- A-24: offene Inaktivität ist keine abrechenbare Zeitbuchung.
ALTER TABLE app_setting ADD COLUMN idle_detection_enabled INTEGER NOT NULL DEFAULT 1 CHECK (idle_detection_enabled IN (0, 1));
ALTER TABLE app_setting ADD COLUMN idle_threshold_minutes INTEGER NOT NULL DEFAULT 5 CHECK (idle_threshold_minutes BETWEEN 1 AND 120);
CREATE TABLE timer_idle (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  session_id TEXT NOT NULL UNIQUE,
  todo_id TEXT NOT NULL REFERENCES todo(id) ON DELETE RESTRICT,
  started_at TEXT NOT NULL,
  returned_at TEXT CHECK (returned_at IS NULL OR returned_at > started_at),
  note TEXT NOT NULL DEFAULT '',
  CHECK (started_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'),
  CHECK (returned_at IS NULL OR returned_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z')
) STRICT;
