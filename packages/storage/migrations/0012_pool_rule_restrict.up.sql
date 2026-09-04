-- Takt — Migration 0012 "pool_rule_restrict", Vorwärtsrichtung
-- takt: foreign_keys=off
-- Deckt: A-3.*, A-4.5, A-4.6, E-054, E-055, E-057, R-1 Befund 1
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ===========================================================================
-- Wogegen
-- ===========================================================================
--
-- `pool_rule.tag_id` und `pool_rule.folder_id` standen seit 0001 auf
-- ON DELETE **CASCADE**. Damit nimmt das Löschen eines Tags oder eines Ordners
-- die Regelterme, die ihn nennen, stillschweigend mit — und die Regel bedeutet
-- danach etwas anderes, ohne dass jemand sie angefasst hat.
--
-- Der Fall, an dem es aufgefallen ist (R-1 Befund 1): Die Regel „Tags aus
-- Ordner Ost **und** Status offen". Löschbar ist nur ein **leerer** Ordner —
-- und genau der leere Ordner in einer erforderlichen Achse ist der Fall, um
-- den es in E-057 geht. Nach dem Löschen heißt die Regel „Status offen". Sie
-- trifft **mehr**, als der Benutzer gesagt hat, und das ist wörtlich die
-- Richtung, die E-057 als die gefährliche bezeichnet: Eine Spalte, die zu viel
-- zeigt, fällt niemandem auf.
--
-- Für Tags war die Lage seit jeher dieselbe; dort verhinderte es allein die
-- Prüfung in `TagPort.remove` (`tag_in_use`, A-4.5). Eine Zusage, die an einer
-- einzigen `if`-Zeile im Adapter hängt, ist eine Zusage bis zum nächsten
-- zweiten Schreibpfad.
--
-- ===========================================================================
-- Was sich ändert: dasselbe Muster wie beim Status (0011)
-- ===========================================================================
--
-- `pool_rule.status_id` steht seit 0011 auf ON DELETE **RESTRICT**, und die
-- Begründung dort gilt Wort für Wort auch für Tag und Ordner:
--
--   „Ein gelöschter Status, der eine Regel stillschweigend entkernt,
--    hinterließe eine Spalte, die aus einem Grund leer ist, den niemand mehr
--    sehen kann."
--
-- Nach dieser Migration verhalten sich alle drei Termspalten gleich:
--
--   pool_id   → CASCADE   die Regel selbst geht, ihre Terme gehen mit. Richtig:
--                         Ein Term ohne Regel ist kein Datensatz, sondern Müll.
--   tag_id    → RESTRICT  die Datenbank weist ab.
--   folder_id → RESTRICT  ebenso.
--   status_id → RESTRICT  unverändert seit 0011.
--
-- **Die Datenbank ist dabei die zweite Wache, nicht die erste.** `TagPort.remove`
-- und `TagFolderPort.remove` fragen vorher und antworten fachlich
-- (`tag_in_use`, 409, mit den Namen der betroffenen Regeln in `details`). Diese
-- Migration nimmt der Datenbank nur die Möglichkeit, still zu gehorchen, wenn
-- eines Tages jemand an der Prüfung vorbeischreibt. Der Unterschied ist der
-- zwischen „FOREIGN KEY constraint failed" und einem Bestand, dessen Regeln
-- etwas anderes bedeuten als gestern.
--
-- ===========================================================================
-- Warum ein Tabellenumbau
-- ===========================================================================
--
-- SQLite kennt kein ALTER TABLE für eine REFERENCES-Klausel. Der Umbau folgt
-- dem vorgeschriebenen Weg und ist Zeile für Zeile der aus 0011: neue Tabelle,
-- Inhalt kopieren, alte weg, umbenennen, Indizes wieder anlegen. `pool_rule`
-- hat keine Kindtabelle, und kein Trigger hängt daran.
--
-- Die Marke in Zeile 2 wird gebraucht: Ohne sie zöge das RENAME die
-- REFERENCES-Klauseln der Nachbartabellen um, und das DROP liefe gegen die
-- eingeschaltete Prüfung. Siehe die Begründung im Kopf von 0006.
--
-- **Keine Zeile ändert ihren Inhalt.** Der Bestand wird eins zu eins kopiert;
-- was sich ändert, ist allein, was beim Löschen anderswo geschieht.

PRAGMA foreign_keys = OFF;
PRAGMA legacy_alter_table = ON;

-- ---------------------------------------------------------------------------
-- 1. Dieselbe Tabelle, drei RESTRICT statt zweier CASCADE
-- ---------------------------------------------------------------------------
--
-- Der CHECK ist der aus 0011, unverändert: Zu jeder Rolle gehört genau eine
-- gefüllte Spalte, alles andere ist NULL.
CREATE TABLE pool_rule_neu (
  pool_id   TEXT NOT NULL REFERENCES pool        (id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'required' CHECK (role IN ('required', 'excluded', 'status')),
  tag_id    TEXT          REFERENCES tag         (id) ON DELETE RESTRICT,
  folder_id TEXT          REFERENCES tag_folder  (id) ON DELETE RESTRICT,
  status_id TEXT          REFERENCES todo_status (id) ON DELETE RESTRICT,
  CHECK (
       (role IN ('required', 'excluded')
        AND status_id IS NULL
        AND ((tag_id IS NULL) <> (folder_id IS NULL)))    -- genau eine Quelle je Tagterm
    OR (role = 'status'
        AND status_id IS NOT NULL
        AND tag_id    IS NULL
        AND folder_id IS NULL)
  )
);

INSERT INTO pool_rule_neu (pool_id, role, tag_id, folder_id, status_id)
SELECT pool_id, role, tag_id, folder_id, status_id FROM pool_rule;

DROP TABLE pool_rule;

ALTER TABLE pool_rule_neu RENAME TO pool_rule;

-- ---------------------------------------------------------------------------
-- 2. Die Indizes — wortgleich mit 0011
-- ---------------------------------------------------------------------------
--
-- Sie fallen mit der Tabelle und werden deshalb neu angelegt. Namen und Form
-- sind dieselben: Es ist derselbe Zugriffspfad und dieselbe Zusicherung, und
-- `errors.ts` übersetzt `ux_pool_rule` unter diesem Namen (`proof:conflicts`
-- misst das).
CREATE UNIQUE INDEX ux_pool_rule ON pool_rule
  (pool_id, role, COALESCE(tag_id, ''), COALESCE(folder_id, ''), COALESCE(status_id, ''));

-- Die drei Rückwärtsrichtungen: „welche Regeln hängen an diesem Tag / diesem
-- Ordner / diesem Status?". Die ersten beiden tragen ab jetzt zusätzlich die
-- Prüfung, die RESTRICT bei jedem Löschen anstellt.
CREATE INDEX ix_pool_rule_tag    ON pool_rule (tag_id)    WHERE tag_id    IS NOT NULL;
CREATE INDEX ix_pool_rule_folder ON pool_rule (folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX ix_pool_rule_status ON pool_rule (status_id) WHERE status_id IS NOT NULL;

PRAGMA legacy_alter_table = OFF;
PRAGMA foreign_keys = ON;
