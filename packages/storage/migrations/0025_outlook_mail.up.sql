CREATE TABLE todo_mail (
  todo_id TEXT NOT NULL REFERENCES todo(id) ON DELETE CASCADE,
  identity TEXT NOT NULL,
  metadata TEXT NOT NULL CHECK (json_valid(metadata)),
  received_at TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (todo_id, identity)
);
CREATE TABLE addin_mail_receipt (
  request_key TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  todo_id TEXT NOT NULL REFERENCES todo(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (json_valid(response))
);
ALTER TABLE todo ADD COLUMN due_time TEXT CHECK (due_time IS NULL OR (length(due_time) = 5 AND due_time GLOB '[0-2][0-9]:[0-5][0-9]' AND due_time < '24:00'));
ALTER TABLE todo ADD COLUMN estimate_minutes INTEGER CHECK (estimate_minutes IS NULL OR (estimate_minutes > 0 AND estimate_minutes <= 525600));
