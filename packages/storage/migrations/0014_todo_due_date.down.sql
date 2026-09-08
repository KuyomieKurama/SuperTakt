-- Takt — Migration 0014 "todo_due_date", Rückwärtsrichtung
--
-- ===========================================================================
-- Die Reihenfolge ist Inhalt: erst der Index, dann die Spalte
-- ===========================================================================
--
-- SQLite lehnt `DROP COLUMN` ab, solange die Spalte in einem Index vorkommt —
-- die Meldung lautet dann „error in index ix_todo_due_date". Der Index fällt
-- deshalb zuerst. Das ist kein Kunstgriff, sondern die Bedingung, unter der
-- `DROP COLUMN` überhaupt zulässig ist; sie steht hier, damit der nächste, der
-- eine Spalte mit Index anlegt, sie nicht neu herausfindet.
--
-- ===========================================================================
-- Was dabei verloren geht — benannt und nicht verschwiegen
-- ===========================================================================
--
-- **Jede gesetzte Frist.** Nach diesem Rückweg trägt kein Todo mehr eine, und
-- es gibt keinen Ort, an dem sie zwischengelegen hätte. Das ist ein
-- Datenverlust, und er ist die ehrlichere von zwei Möglichkeiten: Die
-- Alternative wäre, die Werte in eine Nebentabelle zu retten, die das Schema
-- der Vorgängerfassung nicht kennt — dann stünde Kundenmaterial in einer
-- Tabelle, die niemand liest und niemand löscht.
--
-- Was **nicht** verloren geht: das Todo selbst, seine Tags, seine Buchungen,
-- sein Vermerk und sein Exportstatus. Die Frist war nie eine Achse (A-19.7),
-- deshalb hängt an ihr nichts.
--
-- Keine andere Spalte, kein Fremdschlüssel und kein bestehender CHECK ist
-- betroffen: `due_date` kommt in keiner Sicht, keinem Trigger und keinem
-- anderen CHECK vor.

DROP INDEX IF EXISTS ix_todo_due_date;

ALTER TABLE todo DROP COLUMN due_date;
