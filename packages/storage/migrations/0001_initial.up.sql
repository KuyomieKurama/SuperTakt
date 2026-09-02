-- Takt — Migration 0001 "initial", Vorwärtsrichtung
-- Deckt: A-2.*, A-3.*, A-4.*, A-5.*, A-6.*, A-7.*, A-8.*, A-9.*, E-006, E-008, E-011, E-012
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.

-- ---------------------------------------------------------------------------
-- Kanban-Spalten (A-5.3, A-5.4)
--
-- Es gibt hier bewusst KEINE Spalte is_done. Erledigt (A-2.4) und die
-- Kanban-Abschlussspalte (A-5.3) sind zwei getrennte Dinge: Ein Todo kann in
-- „Done" stehen und nicht erledigt sein, und es kann erledigt sein und in
-- „In Progress" stehen. Das Erledigt-Kennzeichen ist todo.completed_at und
-- hängt an keiner Spalte.
--
-- is_default bleibt: die Spalte, in der ein neu angelegtes Todo landet, wenn
-- der Aufrufer keine nennt.
-- ---------------------------------------------------------------------------
CREATE TABLE todo_status (
  id          TEXT    NOT NULL PRIMARY KEY,
  name        TEXT    NOT NULL,
  position    INTEGER NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  color       TEXT,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL,
  CHECK (length(trim(name)) > 0)
);
CREATE UNIQUE INDEX ux_todo_status_name     ON todo_status (name COLLATE NOCASE);
CREATE UNIQUE INDEX ux_todo_status_position ON todo_status (position);
-- Genau eine Spalte ist Standardspalte für neu angelegte Todos.
CREATE UNIQUE INDEX ux_todo_status_default  ON todo_status ((1)) WHERE is_default = 1;

-- ---------------------------------------------------------------------------
-- Tag-Ordner: Adjazenzliste, beliebig tief (A-4.2, A-4.3, A-4.6)
-- ---------------------------------------------------------------------------
CREATE TABLE tag_folder (
  id         TEXT NOT NULL PRIMARY KEY,
  parent_id  TEXT          REFERENCES tag_folder (id) ON DELETE RESTRICT,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(name)) > 0),
  CHECK (parent_id IS NULL OR parent_id <> id)          -- trivialer Selbstzyklus
);
CREATE INDEX        ix_tag_folder_parent ON tag_folder (parent_id, name COLLATE NOCASE);
CREATE UNIQUE INDEX ux_tag_folder_name   ON tag_folder (COALESCE(parent_id, '~root'), name COLLATE NOCASE);

-- ---------------------------------------------------------------------------
-- Tags (A-4.1, A-4.5)
-- ---------------------------------------------------------------------------
CREATE TABLE tag (
  id         TEXT NOT NULL PRIMARY KEY,
  folder_id  TEXT          REFERENCES tag_folder (id) ON DELETE RESTRICT,
  name       TEXT NOT NULL,
  color      TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(name)) > 0)
);
CREATE INDEX        ix_tag_folder ON tag (folder_id, name COLLATE NOCASE);
CREATE UNIQUE INDEX ux_tag_name   ON tag (COALESCE(folder_id, '~root'), name COLLATE NOCASE);

-- ---------------------------------------------------------------------------
-- Todo (A-2.1, A-2.2, A-2.4, E-006)
-- Der interne Vermerk liegt bewusst NICHT hier, sondern in todo_note (A-7.2, R-06).
--
-- completed_at ist das Erledigt-Kennzeichen aus A-2.4 und steht für sich: Es
-- hängt an keiner Kanban-Spalte, und weder Setzen noch Aufheben verschiebt die
-- Karte. Deshalb gibt es kein status_id_before_done — es gäbe nichts
-- wiederherzustellen. A-2.5 trägt die Sichtbarkeit: Erledigte Todos werden in
-- Pool-Ansichten ausgeblendet, ein aufgehobenes Erledigt bringt das Todo ohne
-- Zutun in seinen tag-abgeleiteten Pool zurück (A-3.4).
-- ---------------------------------------------------------------------------
CREATE TABLE todo (
  id                     TEXT NOT NULL PRIMARY KEY,
  title                  TEXT NOT NULL,
  call_number            TEXT,
  status_id              TEXT NOT NULL REFERENCES todo_status (id) ON DELETE RESTRICT,
  board_rank             TEXT NOT NULL,
  completed_at           TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  CHECK (length(trim(title)) > 0),
  CHECK (call_number IS NULL OR length(trim(call_number)) > 0),
  CHECK (completed_at IS NULL OR completed_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'),
  CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z')
);
CREATE INDEX ix_todo_status      ON todo (status_id, board_rank);
CREATE INDEX ix_todo_call_number ON todo (call_number) WHERE call_number IS NOT NULL;  -- A-10.9
CREATE INDEX ix_todo_open        ON todo (updated_at DESC) WHERE completed_at IS NULL;
CREATE INDEX ix_todo_completed   ON todo (completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE UNIQUE INDEX ux_todo_rank ON todo (status_id, board_rank);

-- ---------------------------------------------------------------------------
-- Persönliche Todo-Notiz (A-7.1, A-7.2)
-- Eigene Tabelle, damit kein Export-Join sie versehentlich mitnehmen kann (R-06).
-- ---------------------------------------------------------------------------
CREATE TABLE todo_note (
  todo_id    TEXT NOT NULL PRIMARY KEY REFERENCES todo (id) ON DELETE CASCADE,
  body       TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
) WITHOUT ROWID;

-- ---------------------------------------------------------------------------
-- Tag-Zuordnung (A-2.3)
-- ---------------------------------------------------------------------------
CREATE TABLE todo_tag (
  todo_id    TEXT NOT NULL REFERENCES todo (id) ON DELETE CASCADE,
  tag_id     TEXT NOT NULL REFERENCES tag  (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (todo_id, tag_id)
) WITHOUT ROWID;
CREATE INDEX ix_todo_tag_reverse ON todo_tag (tag_id, todo_id);

-- ---------------------------------------------------------------------------
-- Zeitbuchung (A-6.1 bis A-6.9, A-7.3, A-7.4)
-- ---------------------------------------------------------------------------
CREATE TABLE time_entry (
  id               TEXT    NOT NULL PRIMARY KEY,
  todo_id          TEXT    NOT NULL REFERENCES todo (id) ON DELETE RESTRICT,
  started_at       TEXT    NOT NULL,
  ended_at         TEXT,
  duration_seconds INTEGER GENERATED ALWAYS AS (
                     CASE WHEN ended_at IS NULL THEN NULL
                          ELSE unixepoch(ended_at) - unixepoch(started_at) END
                   ) STORED,
  note             TEXT    NOT NULL DEFAULT '',
  export_status    TEXT    NOT NULL DEFAULT 'open'  CHECK (export_status IN ('open', 'exported')),
  export_count     INTEGER NOT NULL DEFAULT 0       CHECK (export_count >= 0),
  source           TEXT    NOT NULL DEFAULT 'timer' CHECK (source IN ('timer', 'manual')),
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL,
  CHECK (started_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'),
  CHECK (ended_at IS NULL OR ended_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'),
  CHECK (ended_at IS NULL OR ended_at > started_at),
  CHECK (duration_seconds IS NULL OR duration_seconds >= 1),   -- E-008: Dauer 0 gibt es nicht
  CHECK (export_status = 'open' OR ended_at IS NOT NULL),      -- laufend ist nie exportiert
  CHECK (export_status = 'open' OR export_count >= 1)
);
-- A-6.8: höchstens ein laufender Timer, strukturell erzwungen.
CREATE UNIQUE INDEX ux_time_entry_running ON time_entry ((1)) WHERE ended_at IS NULL;
CREATE INDEX ix_time_entry_todo   ON time_entry (todo_id, started_at DESC);
CREATE INDEX ix_time_entry_queue  ON time_entry (todo_id, started_at) WHERE export_status = 'open';
CREATE INDEX ix_time_entry_day    ON time_entry (started_at DESC);
CREATE INDEX ix_time_entry_reset  ON time_entry (todo_id) WHERE export_status = 'open' AND export_count > 0;

-- A-6.9: eine exportierte Buchung ist gesperrt. Erlaubt bleibt nur der Wechsel
-- des Exportstatus selbst (E-012) und das Hochzählen von export_count.
CREATE TRIGGER trg_time_entry_locked
BEFORE UPDATE ON time_entry
WHEN OLD.export_status = 'exported' AND NEW.export_status = 'exported'
 AND (NEW.todo_id    <> OLD.todo_id
   OR NEW.started_at <> OLD.started_at
   OR NEW.ended_at   IS NOT OLD.ended_at
   OR NEW.note       <> OLD.note
   OR NEW.source     <> OLD.source)
BEGIN
  SELECT RAISE(ABORT, 'time_entry_locked');
END;

-- Eine exportierte Buchung wird nicht gelöscht, sie wird zurückgesetzt (R-10).
CREATE TRIGGER trg_time_entry_no_delete_exported
BEFORE DELETE ON time_entry
WHEN OLD.export_status = 'exported'
BEGIN
  SELECT RAISE(ABORT, 'time_entry_locked');
END;

-- ---------------------------------------------------------------------------
-- Pools (A-3.1 bis A-3.4) — nur die Regel wird gespeichert, nie die Mitgliedschaft.
-- ---------------------------------------------------------------------------
CREATE TABLE pool (
  id                 TEXT    NOT NULL PRIMARY KEY,
  name               TEXT    NOT NULL,
  match_mode         TEXT    NOT NULL DEFAULT 'any' CHECK (match_mode IN ('any', 'all')),
  include_subfolders INTEGER NOT NULL DEFAULT 1     CHECK (include_subfolders IN (0, 1)),
  position           INTEGER NOT NULL,
  created_at         TEXT    NOT NULL,
  updated_at         TEXT    NOT NULL,
  CHECK (length(trim(name)) > 0)
);
CREATE UNIQUE INDEX ux_pool_name     ON pool (name COLLATE NOCASE);
CREATE UNIQUE INDEX ux_pool_position ON pool (position);

CREATE TABLE pool_rule (
  pool_id   TEXT NOT NULL REFERENCES pool        (id) ON DELETE CASCADE,
  tag_id    TEXT          REFERENCES tag         (id) ON DELETE CASCADE,
  folder_id TEXT          REFERENCES tag_folder  (id) ON DELETE CASCADE,
  CHECK ((tag_id IS NULL) <> (folder_id IS NULL))     -- genau eine Quelle je Regel
);
CREATE UNIQUE INDEX ux_pool_rule ON pool_rule (pool_id, COALESCE(tag_id, ''), COALESCE(folder_id, ''));
CREATE INDEX        ix_pool_rule_tag    ON pool_rule (tag_id)    WHERE tag_id    IS NOT NULL;
CREATE INDEX        ix_pool_rule_folder ON pool_rule (folder_id) WHERE folder_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Standard-Tags (A-9.1 bis A-9.5)
-- ---------------------------------------------------------------------------
CREATE TABLE default_tag (
  tag_id     TEXT    NOT NULL PRIMARY KEY REFERENCES tag (id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  created_at TEXT    NOT NULL
) WITHOUT ROWID;
CREATE UNIQUE INDEX ux_default_tag_position ON default_tag (position);

-- ---------------------------------------------------------------------------
-- Exportvorlagen (A-8.7, E-005). Die Feldliste selbst validiert packages/export.
-- ---------------------------------------------------------------------------
CREATE TABLE export_template (
  id         TEXT    NOT NULL PRIMARY KEY,
  name       TEXT    NOT NULL,
  is_builtin INTEGER NOT NULL DEFAULT 0 CHECK (is_builtin IN (0, 1)),
  definition TEXT    NOT NULL,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL,
  CHECK (length(trim(name)) > 0),
  CHECK (json_valid(definition))
);
CREATE UNIQUE INDEX ux_export_template_name    ON export_template (name COLLATE NOCASE);
CREATE UNIQUE INDEX ux_export_template_builtin ON export_template ((1)) WHERE is_builtin = 1;

-- A-8.7: die Standardvorlage ist nicht löschbar und nicht änderbar, aber kopierbar.
CREATE TRIGGER trg_export_template_builtin_no_delete
BEFORE DELETE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

CREATE TRIGGER trg_export_template_builtin_no_update
BEFORE UPDATE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

-- ---------------------------------------------------------------------------
-- Exportlauf (A-8.8) — eine Zeile je geschriebener Datei.
-- ---------------------------------------------------------------------------
CREATE TABLE export_run (
  id                TEXT    NOT NULL PRIMARY KEY,
  template_id       TEXT    NOT NULL REFERENCES export_template (id) ON DELETE RESTRICT,
  template_snapshot TEXT    NOT NULL,
  file_path         TEXT    NOT NULL,
  file_sha256       TEXT    NOT NULL,
  byte_size         INTEGER NOT NULL CHECK (byte_size > 0),
  entry_count       INTEGER NOT NULL CHECK (entry_count > 0),
  total_quarters    INTEGER NOT NULL CHECK (total_quarters > 0),
  rounding_mode     TEXT    NOT NULL CHECK (rounding_mode IN ('up', 'nearest')),
  windows_user      TEXT    NOT NULL,
  created_at        TEXT    NOT NULL,
  CHECK (json_valid(template_snapshot)),
  CHECK (file_sha256 GLOB '[0-9a-f]*' AND length(file_sha256) = 64)
);
CREATE INDEX ix_export_run_created ON export_run (created_at DESC);

CREATE TRIGGER trg_export_run_no_update BEFORE UPDATE ON export_run
BEGIN SELECT RAISE(ABORT, 'append_only'); END;
CREATE TRIGGER trg_export_run_no_delete BEFORE DELETE ON export_run
BEGIN SELECT RAISE(ABORT, 'append_only'); END;

-- Eine Exportgruppe: ein Todo an einem Kalendertag, eine Zeile in der Datei.
--
-- Der gerundete Wert hängt hier und nicht an der einzelnen Buchung. Bei 10, 20
-- und 5 Minuten in einer Gruppe von 0,75 gibt es keine richtige Aufteilung auf
-- die drei Buchungen, nur mehrere falsche — und eine willkürliche Aufteilung
-- würde genau das Protokoll verfälschen, das R-10 nachvollziehbar halten soll.
--
-- `seconds` ist die ungerundete Summe, `quarters` der Wert, der in die
-- Abrechnung ging. Beide zusammen machen nachrechenbar, wieviel die Rundung
-- der Zeile hinzugefügt hat.
CREATE TABLE export_run_group (
  id            TEXT    NOT NULL PRIMARY KEY,
  export_run_id TEXT    NOT NULL REFERENCES export_run (id) ON DELETE RESTRICT,
  todo_id       TEXT    NOT NULL REFERENCES todo       (id) ON DELETE RESTRICT,
  day           TEXT    NOT NULL,
  seconds       INTEGER NOT NULL CHECK (seconds  >= 1),
  quarters      INTEGER NOT NULL CHECK (quarters >= 1),
  CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
-- Je Lauf höchstens eine Gruppe für dasselbe Todo am selben Tag.
CREATE UNIQUE INDEX ux_export_run_group      ON export_run_group (export_run_id, todo_id, day);
CREATE INDEX        ix_export_run_group_todo ON export_run_group (todo_id, day);

CREATE TRIGGER trg_export_run_group_no_update BEFORE UPDATE ON export_run_group
BEGIN SELECT RAISE(ABORT, 'append_only'); END;
CREATE TRIGGER trg_export_run_group_no_delete BEFORE DELETE ON export_run_group
BEGIN SELECT RAISE(ABORT, 'append_only'); END;

-- Welche Buchungen in welche Zeile eingegangen sind.
--
-- `duration_seconds` ist die ungerundete Dauer der Buchung, nicht ihr Anteil an
-- den Viertelstunden der Gruppe. Ein Anteil existiert nicht.
CREATE TABLE export_run_entry (
  export_run_group_id TEXT    NOT NULL REFERENCES export_run_group (id) ON DELETE RESTRICT,
  time_entry_id       TEXT    NOT NULL REFERENCES time_entry       (id) ON DELETE RESTRICT,
  duration_seconds    INTEGER NOT NULL CHECK (duration_seconds >= 1),
  PRIMARY KEY (export_run_group_id, time_entry_id)
) WITHOUT ROWID;
CREATE INDEX ix_export_run_entry_time_entry ON export_run_entry (time_entry_id);

CREATE TRIGGER trg_export_run_entry_no_update BEFORE UPDATE ON export_run_entry
BEGIN SELECT RAISE(ABORT, 'append_only'); END;
CREATE TRIGGER trg_export_run_entry_no_delete BEFORE DELETE ON export_run_entry
BEGIN SELECT RAISE(ABORT, 'append_only'); END;

-- ---------------------------------------------------------------------------
-- Exportstatus-Protokoll (E-012, R-10) — anhängend und unveränderlich.
-- ---------------------------------------------------------------------------
-- Kein Feld `quarters`. Der gerundete Wert gehört der Gruppe, nicht der
-- Buchung; das Protokoll verweist deshalb auf die Gruppe, statt einen Anteil zu
-- erfinden. Über export_run_group_id sind Tagessumme und gerundeter Wert der
-- Zeile erreichbar, in der die Buchung damals stand.
CREATE TABLE export_audit (
  id                  TEXT NOT NULL PRIMARY KEY,
  time_entry_id       TEXT NOT NULL REFERENCES time_entry       (id) ON DELETE RESTRICT,
  event               TEXT NOT NULL CHECK (event           IN ('exported', 'reset')),
  previous_status     TEXT NOT NULL CHECK (previous_status IN ('open', 'exported')),
  new_status          TEXT NOT NULL CHECK (new_status      IN ('open', 'exported')),
  export_run_id       TEXT          REFERENCES export_run       (id) ON DELETE RESTRICT,
  export_run_group_id TEXT          REFERENCES export_run_group (id) ON DELETE RESTRICT,
  actor               TEXT NOT NULL,
  reason              TEXT NOT NULL DEFAULT '',
  occurred_at         TEXT NOT NULL,
  CHECK (previous_status <> new_status),
  CHECK ((event = 'exported' AND export_run_id       IS NOT NULL
                             AND export_run_group_id IS NOT NULL
                             AND new_status = 'exported')
      OR (event = 'reset'    AND export_run_id       IS NULL
                             AND export_run_group_id IS NULL
                             AND new_status = 'open'))
);
CREATE INDEX ix_export_audit_entry ON export_audit (time_entry_id, occurred_at DESC);
CREATE INDEX ix_export_audit_time  ON export_audit (occurred_at DESC);

CREATE TRIGGER trg_export_audit_no_update BEFORE UPDATE ON export_audit
BEGIN SELECT RAISE(ABORT, 'append_only'); END;
CREATE TRIGGER trg_export_audit_no_delete BEFORE DELETE ON export_audit
BEGIN SELECT RAISE(ABORT, 'append_only'); END;

-- ---------------------------------------------------------------------------
-- Einstellungen (E-011). Einzeiler-Tabelle, kein Schlüssel-Wert-Beutel.
-- Das Add-in-Token liegt bewusst NICHT hier, sondern in einer eigenen Datei (E-009).
-- ---------------------------------------------------------------------------
CREATE TABLE app_setting (
  id                       INTEGER NOT NULL PRIMARY KEY CHECK (id = 1),
  export_directory         TEXT,
  active_export_template_id TEXT   REFERENCES export_template (id) ON DELETE SET NULL,
  rounding_mode            TEXT    NOT NULL DEFAULT 'up' CHECK (rounding_mode IN ('up', 'nearest')),
  locale                   TEXT    NOT NULL DEFAULT 'de-DE',
  theme                    TEXT    NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  updated_at               TEXT    NOT NULL
);

-- ---------------------------------------------------------------------------
-- Exportsicht (A-7.2, R-06): die einzige Quelle, die der Exportmotor liest.
-- Sie enthält keine Spalte todo_note.body — die Grenze ist im Schema, nicht im Code.
-- ---------------------------------------------------------------------------
CREATE VIEW v_export_candidate AS
SELECT
  te.id               AS time_entry_id,
  te.todo_id          AS todo_id,
  te.started_at       AS started_at,
  te.ended_at         AS ended_at,
  te.duration_seconds AS duration_seconds,
  te.note             AS booking_note,
  te.export_count     AS export_count,
  t.title             AS todo_title,
  t.call_number       AS todo_call_number
FROM time_entry te
JOIN todo t ON t.id = te.todo_id
WHERE te.export_status = 'open'
  AND te.ended_at IS NOT NULL;
