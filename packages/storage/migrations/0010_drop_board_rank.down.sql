-- Takt — Migration 0010 "drop_board_rank", Rückwärtsrichtung
--
-- ===========================================================================
-- Warum dieser Rückweg verlustfrei ist
-- ===========================================================================
--
-- Der einzige Wert, der je in `board_rank` stand, war die Kennung des Todos
-- selbst: `repo-todos.ts` hat ihn beim Anlegen aus `id` gesetzt, und kein
-- Aufrufer hat ihn je überschrieben (T-066, gemessen). `UPDATE todo SET
-- board_rank = id` stellt deshalb nicht irgendeinen brauchbaren Wert her,
-- sondern **genau den**, der vor Migration 0010 dort stand.
--
-- Das ist der Unterschied zu 0009: Dort verliert der Rückweg eine Auskunft
-- (welche Regel eine Kanban-Spalte war). Hier verliert er nichts.
--
-- ---------------------------------------------------------------------------
-- 1. Die Spalte, mit Vorgabewert — und warum das kein Fehler ist
-- ---------------------------------------------------------------------------
--
-- `0001_initial.up.sql` legt `board_rank TEXT NOT NULL` **ohne** Vorgabewert
-- an. Hier steht `DEFAULT ''`, weil SQLite anders nicht kann: Eine Spalte, die
-- über ALTER TABLE ADD COLUMN entsteht, darf NOT NULL nur zusammen mit einem
-- Vorgabewert tragen — sonst hätten die vorhandenen Zeilen keinen Wert.
--
-- Der Unterschied ist nach Schritt 3 folgenlos, und das ist der Grund, warum
-- er hier stehen bleiben darf: `ux_todo_rank` ist eindeutig über
-- (status_id, board_rank). Ein INSERT, der `board_rank` ausließe, bekäme ''
-- und liefe beim zweiten Mal in derselben Statusspalte in die
-- Eindeutigkeitsbedingung. Die Wache überlebt den Rückweg, sie heißt nur
-- anders: UNIQUE statt NOT NULL.
--
-- Die verlustfreie Alternative wäre ein vollständiger Tabellenneubau nach dem
-- zwölfschrittigen Verfahren von SQLite. Er müsste `todo` samt vier CHECK-
-- Bedingungen, vier weiteren Indizes und den Fremdschlüsseln aus `todo_note`,
-- `todo_tag` und `time_entry` neu aufbauen — und damit das Wesentliche
-- (die Kundendaten) für das Unwesentliche (ein fehlendes DEFAULT) aufs Spiel
-- setzen. Der Rückweg ist Werkzeug für Entwicklung und für einen
-- fehlgeschlagenen Aktualisierungslauf; die Rettung eines benutzten Bestands
-- ist die Sicherungskopie, die der Läufer vorher anlegt (datenmodell.md 8).
ALTER TABLE todo ADD COLUMN board_rank TEXT NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------------
-- 2. Der Wert, den die Spalte vorher trug
-- ---------------------------------------------------------------------------
--
-- Vor Schritt 3, nicht danach: Mit '' in jeder Zeile verletzten schon zwei
-- Todos in derselben Statusspalte die Eindeutigkeit von `ux_todo_rank`.
UPDATE todo SET board_rank = id;

-- ---------------------------------------------------------------------------
-- 3. Die beiden Indizes aus 0001, Wort für Wort
-- ---------------------------------------------------------------------------
DROP INDEX ix_todo_status;
CREATE INDEX ix_todo_status ON todo (status_id, board_rank);
CREATE UNIQUE INDEX ux_todo_rank ON todo (status_id, board_rank);
