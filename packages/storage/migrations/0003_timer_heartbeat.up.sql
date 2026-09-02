-- Takt — Migration 0003 "timer_heartbeat", Vorwärtsrichtung
-- Deckt: E-036, A-6.4. Auflage aus T-009.
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ---------------------------------------------------------------------------
-- Warum eine eigene Tabelle und keine Spalte auf time_entry
-- ---------------------------------------------------------------------------
--
-- E-036 verlangt, dass ein laufender Timer im Betrieb mindestens jede Minute
-- ein Lebenszeichen hinterlässt. Beim nächsten Start erkennt Takt die verwaiste
-- Buchung und bucht höchstens bis zu diesem Zeitpunkt — statt einen über Nacht
-- vergessenen Timer vierzehn Stunden weiterzuzählen, die nach der Aufrundung
-- aus E-008 in einer Rechnung landen.
--
-- Drei Gründe sprechen gegen eine Spalte auf time_entry:
--
--  1. Ein Schreibvorgang je Minute auf eine Zeile, die Abrechnungsdaten trägt,
--     berührt genau die Zeile, die der Sperr-Trigger aus A-6.9 schützt. Die
--     Trennung hält den heißen Pfad von den kalten Daten fern.
--  2. Die Spalte müsste in der Rückwärtsrichtung wieder verschwinden. SQLite
--     verweigert DROP COLUMN, sobald die Spalte in einem CHECK vorkommt — der
--     Rückweg wäre also entweder ein vollständiger Tabellenumbau oder eine
--     Spalte ohne Formatprüfung. Eine eigene Tabelle kostet ein DROP TABLE.
--  3. Der Wert ist flüchtig. Er gilt für genau einen laufenden Timer, hat nach
--     dessen Ende keine Bedeutung mehr und gehört deshalb nicht in die
--     Buchung, die dauerhaft aufbewahrt wird.
--
-- Höchstens eine Zeile existiert gleichzeitig: Es gibt höchstens einen
-- laufenden Timer (A-6.8, ux_time_entry_running), und der Primärschlüssel
-- bindet das Lebenszeichen an genau dessen Buchung.
--
-- ON DELETE CASCADE: Wird eine verworfene Buchung gelöscht, verschwindet ihr
-- Lebenszeichen mit. Eine exportierte Buchung lässt sich ohnehin nicht löschen
-- (trg_time_entry_no_delete_exported), und eine laufende war nie exportiert.
-- ---------------------------------------------------------------------------

CREATE TABLE timer_heartbeat (
  time_entry_id TEXT NOT NULL PRIMARY KEY REFERENCES time_entry (id) ON DELETE CASCADE,
  seen_at       TEXT NOT NULL,
  CHECK (seen_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z')
);

-- Ein Lebenszeichen für eine bereits beendete Buchung ist sinnlos und wäre ein
-- Hinweis auf einen Fehler im Adapter: Geschrieben wird nur, solange der Timer
-- läuft. Der Trigger fängt beides ab, Einfügen wie Fortschreiben.
CREATE TRIGGER trg_timer_heartbeat_only_running_insert
BEFORE INSERT ON timer_heartbeat
WHEN (SELECT ended_at FROM time_entry WHERE id = NEW.time_entry_id) IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'timer_not_running');
END;

CREATE TRIGGER trg_timer_heartbeat_only_running_update
BEFORE UPDATE ON timer_heartbeat
WHEN (SELECT ended_at FROM time_entry WHERE id = NEW.time_entry_id) IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'timer_not_running');
END;
