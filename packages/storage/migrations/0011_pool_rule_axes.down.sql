-- Takt — Migration 0011 "pool_rule_axes", Rückwärtsrichtung
-- takt: foreign_keys=off
--
-- ===========================================================================
-- Was der Rückweg zurücknimmt, und was er dabei verliert
-- ===========================================================================
--
-- Zurück bleibt die Form von 0001: eine Liste gleichartiger Tagterme, ein
-- `match_mode`, sonst nichts. Vier der fünf Achsen haben dort kein Feld, in dem
-- sie stehen könnten. Deshalb ist dieser Rückweg **nicht verlustfrei**, und der
-- Verlust ist benannt:
--
--   * **Erforderliche Tags** stehen unverändert da, mit unverändertem
--     `match_mode`. Der Normalfall verliert nichts.
--   * **Ausgeschlossene Tags** und **Statusterme** fallen weg. Sie lassen sich
--     in der alten Form nicht ausdrücken.
--   * **Erledigt** und **Exportstatus** fallen mit ihren Spalten weg.
--
-- Eine Regel, die **nur** aus solchen Bedingungen bestand, hat danach eine
-- leere Regel — und trifft damit nichts (A-3.4). Das ist die richtige Richtung
-- des Verlusts: Sie ist sichtbar leer. Die Alternative wäre gewesen, solche
-- Regeln zu löschen, weil sie „vorher nicht existierten" — das nähme dem
-- Benutzer eine von Hand eingerichtete Regel samt ihrem Namen und ihrer
-- Position weg, ohne zu fragen.
--
-- Dieselbe Abwägung wie in 0009. Und wie dort gilt: Der eigentliche Rückweg auf
-- einem benutzten Bestand ist die Sicherungskopie, die der Läufer vor jedem
-- Lauf anlegt (datenmodell.md 8).

PRAGMA foreign_keys = OFF;
PRAGMA legacy_alter_table = ON;

-- ---------------------------------------------------------------------------
-- 1. `pool_rule` zurück in die Form von 0001 — Wort für Wort
-- ---------------------------------------------------------------------------
CREATE TABLE pool_rule_alt (
  pool_id   TEXT NOT NULL REFERENCES pool        (id) ON DELETE CASCADE,
  tag_id    TEXT          REFERENCES tag         (id) ON DELETE CASCADE,
  folder_id TEXT          REFERENCES tag_folder  (id) ON DELETE CASCADE,
  CHECK ((tag_id IS NULL) <> (folder_id IS NULL))     -- genau eine Quelle je Regel
);

-- Nur die erforderlichen Tagterme. `role = 'excluded'` und `role = 'status'`
-- haben in dieser Form keinen Platz; siehe Kopf.
INSERT INTO pool_rule_alt (pool_id, tag_id, folder_id)
SELECT pool_id, tag_id, folder_id FROM pool_rule WHERE role = 'required';

DROP TABLE pool_rule;

ALTER TABLE pool_rule_alt RENAME TO pool_rule;

-- Die drei Indizes aus 0001, wortgleich. `ix_pool_rule_status` kehrt nicht
-- zurück — die Spalte, auf die er zeigte, gibt es nicht mehr.
CREATE UNIQUE INDEX ux_pool_rule ON pool_rule (pool_id, COALESCE(tag_id, ''), COALESCE(folder_id, ''));
CREATE INDEX        ix_pool_rule_tag    ON pool_rule (tag_id)    WHERE tag_id    IS NOT NULL;
CREATE INDEX        ix_pool_rule_folder ON pool_rule (folder_id) WHERE folder_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Die beiden Spalten an `pool`
-- ---------------------------------------------------------------------------
--
-- Kein Index und kein Trigger hängt an ihnen, deshalb nimmt SQLite das
-- DROP COLUMN ohne Vorarbeit an — dieselbe Lage wie bei `placement` in 0009.
ALTER TABLE pool DROP COLUMN export_state;
ALTER TABLE pool DROP COLUMN completion;

PRAGMA legacy_alter_table = OFF;
PRAGMA foreign_keys = ON;
