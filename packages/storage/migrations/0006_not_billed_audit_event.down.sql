-- Takt — Migration 0006 "not_billed_audit_event", Rückwärtsrichtung
-- takt: foreign_keys=off
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
-- Zum Verfahren des Tabellenumbaus und zur Marke in Zeile 2 siehe den Kopf der
-- Vorwärtsdatei.
--
-- Stellt den CHECK aus 0001 wortgleich wieder her: nur 'exported' und 'reset'.
--
-- **Nur verlustfrei, solange niemand ausgebucht hat.** Eine Zeile mit
-- event='not_billed' hat unter dem alten CHECK keinen Platz — sie wäre entweder
-- zu verwerfen oder als 'exported' ohne Exportlauf umzudeuten, und beides wäre
-- schlimmer als ein Abbruch: Das eine löscht die Auskunft „diese Zeit wurde nie
-- abgerechnet", das andere verfälscht sie zu „wurde exportiert" und erfindet
-- damit einen Beleg, den es nie gab.
--
-- Die Rücknahme bricht deshalb ausdrücklich ab, sobald eine solche Zeile
-- existiert. Der Rückweg auf einem benutzten Bestand ist die Sicherungskopie,
-- die der Läufer vor jedem Vorwärtslauf anlegt (datenmodell.md 8.3).
--
-- Der Wächter prüft beides: die Protokollzeile **und** die Buchung, die unter
-- dem zurückkehrenden CHECK `export_status = 'open' OR export_count >= 1`
-- keinen Platz hätte. Die zweite Bedingung ist nach heutigem Stand von der
-- ersten miterfasst; sie steht trotzdem da, weil sie genau das prüft, was die
-- Tabelle gleich wieder verlangen wird, statt sich auf eine Herleitung zu
-- verlassen.

-- Wächter: erzwingt einen sprechenden Abbruch statt eines rohen CHECK-Fehlers
-- mitten im Kopieren.
CREATE TEMP TABLE _rollback_0006_guard (
  ok INTEGER NOT NULL
    CONSTRAINT rollback_0006_only_without_not_billed CHECK (ok = 1)
);

INSERT INTO _rollback_0006_guard (ok)
SELECT CASE WHEN (SELECT count(*) FROM export_audit WHERE event = 'not_billed') = 0
             AND (SELECT count(*) FROM time_entry
                   WHERE export_status = 'exported' AND export_count = 0) = 0
            THEN 1 ELSE 0 END;

DROP TABLE _rollback_0006_guard;

-- Die beiden folgenden Zeilen sind kein Widerspruch zur Marke in Zeile 2,
-- sondern ihre Ergänzung: `PRAGMA foreign_keys` ist **innerhalb** einer
-- offenen Transaktion wirkungslos. Läuft diese Datei über den Migrationsläufer,
-- ist die Prüfung durch die Marke bereits vor BEGIN abgeschaltet und diese Zeile
-- tut nichts. Wird sie ohne Läufer eingespielt — so machen es die Prüfpfade, die
-- das Schema selbst untersuchen —, gibt es keine offene Transaktion, und dann
-- ist genau diese Zeile die wirksame. Ohne sie zöge das RENAME weiter unten die
-- REFERENCES-Klauseln der Kindtabellen mit auf die weggeworfene Tabelle.
PRAGMA foreign_keys = OFF;

PRAGMA legacy_alter_table = ON;

CREATE TABLE export_audit_alt (
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

INSERT INTO export_audit_alt
  (id, time_entry_id, event, previous_status, new_status,
   export_run_id, export_run_group_id, actor, reason, occurred_at)
SELECT
   id, time_entry_id, event, previous_status, new_status,
   export_run_id, export_run_group_id, actor, reason, occurred_at
  FROM export_audit;

DROP TABLE export_audit;

ALTER TABLE export_audit_alt RENAME TO export_audit;

CREATE INDEX ix_export_audit_entry ON export_audit (time_entry_id, occurred_at DESC);
CREATE INDEX ix_export_audit_time  ON export_audit (occurred_at DESC);

CREATE TRIGGER trg_export_audit_no_update BEFORE UPDATE ON export_audit
BEGIN SELECT RAISE(ABORT, 'append_only'); END;
CREATE TRIGGER trg_export_audit_no_delete BEFORE DELETE ON export_audit
BEGIN SELECT RAISE(ABORT, 'append_only'); END;

-- ---------------------------------------------------------------------------
-- Zweiter Teil: der Zähler-CHECK auf time_entry kehrt zurück
-- ---------------------------------------------------------------------------
--
-- Spiegelbild des Vorwärtsschritts, mit demselben Verfahren. Der Wächter oben
-- hat bereits sichergestellt, dass keine Zeile den zurückkehrenden CHECK
-- verletzt.

DROP TRIGGER IF EXISTS trg_time_entry_exported_needs_provenance;

ALTER TABLE time_entry RENAME TO time_entry_alt;

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

INSERT INTO time_entry
  (id, todo_id, started_at, ended_at, note, export_status, export_count, source, created_at, updated_at)
SELECT
   id, todo_id, started_at, ended_at, note, export_status, export_count, source, created_at, updated_at
  FROM time_entry_alt;

DROP TABLE time_entry_alt;

CREATE UNIQUE INDEX ux_time_entry_running ON time_entry ((1)) WHERE ended_at IS NULL;
CREATE INDEX ix_time_entry_todo   ON time_entry (todo_id, started_at DESC);
CREATE INDEX ix_time_entry_queue  ON time_entry (todo_id, started_at) WHERE export_status = 'open';
CREATE INDEX ix_time_entry_day    ON time_entry (started_at DESC);
CREATE INDEX ix_time_entry_reset  ON time_entry (todo_id) WHERE export_status = 'open' AND export_count > 0;

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

CREATE TRIGGER trg_time_entry_no_delete_exported
BEFORE DELETE ON time_entry
WHEN OLD.export_status = 'exported'
BEGIN
  SELECT RAISE(ABORT, 'time_entry_locked');
END;

PRAGMA legacy_alter_table = OFF;

PRAGMA foreign_keys = ON;
