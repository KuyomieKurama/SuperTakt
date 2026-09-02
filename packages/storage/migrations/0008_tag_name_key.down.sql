-- Takt — Migration 0008 "tag_name_key", Rückwärtsrichtung
--
-- Die Reihenfolge ist keine Formsache: SQLite verweigert `DROP COLUMN` für eine
-- Spalte, die in einem Index oder einem Trigger vorkommt. Erst die Trigger,
-- dann die Indizes, dann die Spalte.
--
-- **Was der Rückweg nicht zurücknimmt.** Die Vorwärtsrichtung hat den Leerraum
-- in `tag.name` vereinheitlicht und bestehende Doppelte mit „ (2)“ auseinander-
-- gezogen. Beides bleibt stehen. Der ursprüngliche Text ist nach dem UPDATE
-- nirgends mehr gespeichert; eine Rückwärtsmigration, die ihn erriete, wäre
-- schlimmer als eine, die ihn stehen lässt. Der Rückweg auf einem benutzten
-- Bestand ist die Sicherungskopie, die der Migrationsläufer vor jedem Lauf
-- anlegt (datenmodell.md 8).
--
-- Nach dem Rückweg gilt wieder allein `ux_tag_name` aus 0001: Namen sind je
-- Ordner eindeutig, aber nur unter ASCII-Groß- und -Kleinschreibung.

DROP TRIGGER IF EXISTS trg_tag_name_key_insert;
DROP TRIGGER IF EXISTS trg_tag_name_key_update;

DROP INDEX IF EXISTS ux_tag_name_key;
DROP INDEX IF EXISTS ix_tag_name_key;

ALTER TABLE tag DROP COLUMN name_key;
