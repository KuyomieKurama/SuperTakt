-- Takt — Migration 0010 "drop_board_rank", Vorwärtsrichtung
-- Deckt: A-5.2 (entfallen), A-13.6, E-054
--
-- ===========================================================================
-- Wogegen
-- ===========================================================================
--
-- `todo.board_rank` war der Sortierschlüssel innerhalb einer Kanban-Spalte, aus
-- der Zeit, als das Board eine Gruppierung nach `status_id` war und Karten
-- gezogen wurden (A-5.2, A-13.6). Mit E-054 ist beides entfallen: Eine
-- Kanban-Spalte ist seitdem eine Regel über Tags, eine Karte kann in mehreren
-- Spalten zugleich stehen, und es gibt keine Route, die eine Karte in eine
-- Spalte legt.
--
-- Damit war die Spalte tot, und zwar **gemessen** und nicht vermutet (T-066):
--
--   * Kein Aufrufer hat sie je gesetzt. `TodoUpdate.boardRank` war die einzige
--     schreibbare Stelle; weder die Oberfläche noch das Add-in noch ein
--     Prüfpfad hat das Feld je geschickt (`proof:callers` liest jeden Rumpf der
--     Oberfläche).
--   * Der Wert eines neuen Todos war seine eigene Kennung (`repo-todos.ts`).
--     Die Reihenfolge war damit die der Anlage und nie die eines Benutzers.
--   * Sortiert wurde danach an genau einer Stelle, im alten Ziehen-Board.
--
-- Eine als tot beschriftete Spalte ist besser als eine unbeschriftete, aber
-- schlechter als keine: Die Beschriftung selbst wird zur nächsten
-- Falschaussage, sobald jemand sie überliest.
--
-- ===========================================================================
-- Warum die beiden Indizes zuerst fallen
-- ===========================================================================
--
-- SQLite verweigert `ALTER TABLE ... DROP COLUMN`, solange ein Index die
-- Spalte nennt — gemessen, nicht angenommen:
--
--     error in index ix_todo_status after drop column: no such column: board_rank
--
-- Deshalb erst die Indizes, dann die Spalte, dann der eine Index, der bleibt.
--
-- ---------------------------------------------------------------------------
-- 1. Die beiden Indizes, die an der Spalte hängen
-- ---------------------------------------------------------------------------
--
-- `ux_todo_rank (status_id, board_rank)` war die Zusicherung „je Statusspalte
-- eine eindeutige Reihenfolge". Ohne Ziehen gibt es keine Reihenfolge, die
-- eindeutig sein müsste; die Zusicherung hat nichts mehr zu sichern.
DROP INDEX ux_todo_rank;

-- `ix_todo_status (status_id, board_rank)` war der Zugriffspfad „eine Spalte
-- des Boards, in ihrer Reihenfolge". Der Filter über `status_id` bleibt
-- (`TodoFilter.statusIds`, `buildConditions`), und `todo_status` löscht mit
-- ON DELETE RESTRICT — beides braucht weiterhin einen Index auf `status_id`.
-- Er wird unten neu angelegt, einspaltig.
DROP INDEX ix_todo_status;

-- ---------------------------------------------------------------------------
-- 2. Die Spalte
-- ---------------------------------------------------------------------------
ALTER TABLE todo DROP COLUMN board_rank;

-- ---------------------------------------------------------------------------
-- 3. Der Index, der bleibt — einspaltig
-- ---------------------------------------------------------------------------
--
-- Gleicher Name, gleiche Aufgabe, ein Feld weniger. Der Name bleibt absichtlich
-- derselbe: Ein zweiter Name für denselben Zugriffspfad wäre eine zweite
-- Auskunft über dieselbe Sache, und `0001_initial.up.sql` nennt ihn ebenso.
CREATE INDEX ix_todo_status ON todo (status_id);
