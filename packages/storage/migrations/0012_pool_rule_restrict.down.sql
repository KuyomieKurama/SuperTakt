-- Takt — Migration 0012 "pool_rule_restrict", Rückwärtsrichtung
-- takt: foreign_keys=off
--
-- ===========================================================================
-- Was der Rückweg zurücknimmt — und was er dabei nicht verliert
-- ===========================================================================
--
-- Zurück steht die Form von 0011: `tag_id` und `folder_id` auf ON DELETE
-- CASCADE, `status_id` weiterhin auf RESTRICT.
--
-- **Kein Datenverlust.** Anders als die Rückrichtung von 0011 nimmt diese hier
-- keiner Zeile ihren Platz: Die Tabelle behält dieselben fünf Spalten,
-- denselben CHECK und denselben Inhalt. Was zurückgenommen wird, ist allein das
-- Verhalten beim Löschen eines Tags oder eines Ordners.
--
-- **Was der Rückweg wieder aufmacht**, und das gehört benannt: Ein gelöschter
-- Ordner nimmt danach seine Regelterme wieder still mit (R-1 Befund 1). Die
-- Prüfungen in `TagPort.remove` und `TagFolderPort.remove` bleiben davon
-- unberührt und weisen weiterhin fachlich ab — der Bestand ist also nicht
-- ungeschützt, sondern nur wieder auf **eine** Wache statt zweier
-- zurückgesetzt. Genau das war die Lage bis T-089.
--
-- Der Umbau ist derselbe wie in der Vorwärtsrichtung: SQLite kennt kein
-- ALTER TABLE für eine REFERENCES-Klausel.

PRAGMA foreign_keys = OFF;
PRAGMA legacy_alter_table = ON;

-- ---------------------------------------------------------------------------
-- 1. `pool_rule` zurück in die Form von 0011 — Wort für Wort
-- ---------------------------------------------------------------------------
CREATE TABLE pool_rule_alt (
  pool_id   TEXT NOT NULL REFERENCES pool        (id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'required' CHECK (role IN ('required', 'excluded', 'status')),
  tag_id    TEXT          REFERENCES tag         (id) ON DELETE CASCADE,
  folder_id TEXT          REFERENCES tag_folder  (id) ON DELETE CASCADE,
  status_id TEXT          REFERENCES todo_status (id) ON DELETE RESTRICT,
  CHECK (
       (role IN ('required', 'excluded')
        AND status_id IS NULL
        AND ((tag_id IS NULL) <> (folder_id IS NULL)))
    OR (role = 'status'
        AND status_id IS NOT NULL
        AND tag_id    IS NULL
        AND folder_id IS NULL)
  )
);

INSERT INTO pool_rule_alt (pool_id, role, tag_id, folder_id, status_id)
SELECT pool_id, role, tag_id, folder_id, status_id FROM pool_rule;

DROP TABLE pool_rule;

ALTER TABLE pool_rule_alt RENAME TO pool_rule;

-- ---------------------------------------------------------------------------
-- 2. Die Indizes aus 0011, wortgleich
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX ux_pool_rule ON pool_rule
  (pool_id, role, COALESCE(tag_id, ''), COALESCE(folder_id, ''), COALESCE(status_id, ''));

CREATE INDEX ix_pool_rule_tag    ON pool_rule (tag_id)    WHERE tag_id    IS NOT NULL;
CREATE INDEX ix_pool_rule_folder ON pool_rule (folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX ix_pool_rule_status ON pool_rule (status_id) WHERE status_id IS NOT NULL;

PRAGMA legacy_alter_table = OFF;
PRAGMA foreign_keys = ON;
