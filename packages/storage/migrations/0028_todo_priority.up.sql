CREATE TABLE todo_priority (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  weight INTEGER NOT NULL CHECK (typeof(weight) = 'integer' AND weight BETWEEN -9007199254740991 AND 9007199254740991),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX ux_todo_priority_name ON todo_priority (name COLLATE NOCASE);
ALTER TABLE todo ADD COLUMN priority_id TEXT REFERENCES todo_priority(id) ON DELETE SET NULL;
CREATE INDEX ix_todo_priority ON todo(priority_id);
