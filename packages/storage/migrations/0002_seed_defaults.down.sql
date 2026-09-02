-- Takt — Migration 0002 "seed_defaults", Rückwärtsrichtung
--
-- Eine Datenmigration ist nur so lange rücknehmbar, wie niemand auf die
-- angelegten Zeilen verweist. Sobald ein Todo in einer der vier Beispielspalten
-- liegt oder ein Exportlauf die Standardvorlage benutzt hat, ist die Rücknahme
-- verlustbehaftet. Sie bricht dann ausdrücklich ab, statt still zu scheitern
-- oder Daten zu zerstören. Der Rückweg auf einem benutzten Bestand ist die
-- Sicherungskopie, die der Migrationsläufer vor jedem Lauf anlegt.

-- Wächter: erzwingt einen sprechenden Abbruch statt eines rohen
-- FOREIGN-KEY-Fehlers. Schlägt der CHECK fehl, rollt die umschließende
-- Transaktion des Läufers alles zurück.
CREATE TEMP TABLE _rollback_0002_guard (
  ok INTEGER NOT NULL
    CONSTRAINT rollback_0002_only_without_user_data CHECK (ok = 1)
);

INSERT INTO _rollback_0002_guard (ok)
SELECT CASE WHEN (SELECT count(*) FROM todo)       = 0
             AND (SELECT count(*) FROM export_run) = 0
            THEN 1 ELSE 0 END;

DROP TABLE _rollback_0002_guard;

UPDATE app_setting SET active_export_template_id = NULL WHERE id = 1;
DELETE FROM app_setting WHERE id = 1;

-- Die Trigger auf export_template verbieten das Löschen der Standardvorlage.
-- Sie werden für die Dauer der Rücknahme entfernt und danach wiederhergestellt.
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_delete;
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_update;

DELETE FROM export_template WHERE is_builtin = 1;

CREATE TRIGGER trg_export_template_builtin_no_delete
BEFORE DELETE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

CREATE TRIGGER trg_export_template_builtin_no_update
BEFORE UPDATE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

DELETE FROM todo_status WHERE id IN (
  '01931000-0000-7000-8000-000000000001',
  '01931000-0000-7000-8000-000000000002',
  '01931000-0000-7000-8000-000000000003',
  '01931000-0000-7000-8000-000000000004');
