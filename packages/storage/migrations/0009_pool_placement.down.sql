-- Takt — Migration 0009 "pool_placement", Rückwärtsrichtung
--
-- Ein Schritt, weil die Vorwärtsrichtung einer war. Kein Index und kein Trigger
-- hängt an der Spalte — der Grund dafür steht in der Vorwärtsdatei, Abschnitt 2
-- —, deshalb nimmt SQLite das DROP COLUMN ohne Vorarbeit an.
--
-- **Was der Rückweg nicht zurücknimmt.** Welche Regel eine Kanban-Spalte war,
-- steht danach nirgends mehr. Nach dem Rückweg ist jede Regel wieder ein Pool
-- und erscheint in der Pool-Liste — auch die, die der Benutzer ausdrücklich nur
-- auf dem Board haben wollte. Nichts geht dabei verloren außer dieser
-- Zuordnung: Name, Regel und Position stehen unverändert da.
--
-- Das ist die richtige Richtung des Verlusts. Die Alternative wäre, Regeln mit
-- `placement = 'board'` beim Rückweg zu löschen, weil sie „vorher nicht
-- existierten" — das nähme dem Benutzer eine von Hand eingerichtete Regel weg,
-- ohne zu fragen. Der eigentliche Rückweg auf einem benutzten Bestand ist
-- ohnehin die Sicherungskopie, die der Migrationsläufer vor jedem Lauf anlegt
-- (datenmodell.md 8).

ALTER TABLE pool DROP COLUMN placement;
