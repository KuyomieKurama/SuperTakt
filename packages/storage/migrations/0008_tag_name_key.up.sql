-- Takt — Migration 0008 "tag_name_key", Vorwärtsrichtung
-- Deckt: A-4.1, A-4.5, T-058
--
-- ===========================================================================
-- Wogegen
-- ===========================================================================
--
-- Beim Anlegen eines Todos darf ein neuer Tagname mit angegeben werden. Zwei
-- Fenster, die gleichzeitig ein Todo mit demselben neuen Tag anlegen, dürfen
-- kein zweites Tag erzeugen. Das ist eine Zusage über einen Wettlauf, und eine
-- solche Zusage hält nur, wenn die **Datenbank** sie hält — eine Prüfung im
-- Adapter ist immer nur so gut wie der Abstand zwischen ihr und dem INSERT.
--
-- Bis hierher gab es `ux_tag_name ON tag (COALESCE(folder_id,'~root'), name
-- COLLATE NOCASE)`. Der Index deckt A–Z und sonst nichts:
--
--   „Backend“ gegen „backend“   → abgewiesen        ✔ (NOCASE)
--   „ backend“ gegen „backend“  → beide angelegt    ✘ Leerzeichen
--   „Änderung“ gegen „änderung“ → beide angelegt    ✘ NOCASE kennt kein Ä
--   „back  end“ gegen „back end“→ beide angelegt    ✘ doppelter Leerraum
--
-- Diese Migration führt die Spalte `tag.name_key` ein: den Vergleichsschlüssel
-- aus `packages/domain/src/tag-name.ts`. Er trägt den eindeutigen Index, und
-- damit ist „kein doppeltes Tag“ eine Zusage des Schemas.
--
-- ===========================================================================
-- Warum der Schlüssel hier Zeichen für Zeichen nachgebaut wird
-- ===========================================================================
--
-- SQLite hat keine Unicode-Faltung: `lower()` fasst A–Z an und sonst nichts.
-- Ein Rückgriff darauf ergäbe zwei Regeln — eine in der Domäne, eine in der
-- Datenbank — und die Datenbank erzwänge die schwächere. Genau dort entstünde
-- das doppelte Tag, das der Index verhindern soll.
--
-- Deshalb bildet die rekursive Abfrage unten die **aufgezählte** Faltung aus
-- tag-name.ts nach: ASCII A–Z, der lateinische Ergänzungsblock U+00C0–U+00DE
-- ohne das Malzeichen U+00D7, das große ẞ (U+1E9E) auf ß, jeder Leerraum zu
-- einem Leerzeichen, Folgen zu einem, vorn und hinten nichts.
-- `pnpm --filter @takt/local-api proof:tags` hält beide Fassungen gegeneinander
-- und wird rot, sobald eine von ihnen sich bewegt.
--
-- **Was diese Migration nicht kann:** Unicode-Zusammensetzung (NFC). Ein
-- bestehender Name, in dem „ä“ als „a“ plus Trema gespeichert ist, bekommt
-- einen Schlüssel in derselben Zerlegung. Die Domäne setzt NFC voraus; jeder
-- neu angelegte oder umbenannte Tagname geht durch sie hindurch. Für Namen, die
-- über eine Tastatur unter Windows oder Linux entstanden sind, ist der Fall
-- gegenstandslos.
--
-- ===========================================================================
-- Bestehende Doppelte
-- ===========================================================================
--
-- Ein Bestand kann heute „ backend“ und „backend“ nebeneinander führen; unter
-- dem neuen Schlüssel sind das zwei gleiche. Der Index ließe sich dann nicht
-- anlegen und die Migration bräche ab. Statt abzubrechen bekommt jedes weitere
-- Tag mit demselben Schlüssel ein „ (2)“, „ (3)“ … an den Namen — sichtbar,
-- verlustfrei und vom Benutzer nachträglich zu bereinigen. Die Reihenfolge ist
-- die der Anlage; das zuerst angelegte Tag behält seinen Namen.
--
-- Zusammenführen wäre die Alternative gewesen und ist die schlechtere: Sie
-- verschöbe Todos zwischen Tags und damit zwischen Pools, ohne dass jemand
-- gefragt worden wäre.

-- ---------------------------------------------------------------------------
-- 1. Die Spalte
-- ---------------------------------------------------------------------------
--
-- `DEFAULT ''` ist der Preis dafür, dass SQLite eine NOT-NULL-Spalte nur mit
-- Vorgabewert anhängen lässt. Der leere Schlüssel wird deshalb unten von einem
-- Trigger abgewiesen — sonst wäre die Vorgabe ein stiller Ausweg für einen
-- INSERT, der die Spalte vergisst.
ALTER TABLE tag ADD COLUMN name_key TEXT NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------------
-- 2. Anzeigeform und Schlüssel für den Bestand
-- ---------------------------------------------------------------------------
--
-- Ein Durchlauf je Zeichen. `norm` sammelt die Anzeigeform (Leerraum
-- vereinheitlicht), `folded` denselben Text zusätzlich gefaltet. Beide
-- entstehen im selben Durchlauf, damit sie nicht auseinanderlaufen können.
--
-- Die Obergrenze `i <= 1000` ist der Notausgang für einen Namen, den ein
-- Eingriff von Hand länger gemacht hat, als der CHECK je zugelassen hätte.
CREATE TEMP TABLE _tag_key AS
WITH RECURSIVE walk(id, src, i, norm, folded) AS (
  SELECT id, name, 1, '', '' FROM tag
  UNION ALL
  SELECT
    id,
    src,
    i + 1,
    CASE
      WHEN unicode(substr(src, i, 1)) IN (9,10,11,12,13,32,160,5760,8232,8233,8239,8287,12288,65279)
        OR unicode(substr(src, i, 1)) BETWEEN 8192 AND 8202
      THEN CASE WHEN norm = '' OR substr(norm, -1, 1) = ' ' THEN norm ELSE norm || ' ' END
      ELSE norm || substr(src, i, 1)
    END,
    CASE
      WHEN unicode(substr(src, i, 1)) IN (9,10,11,12,13,32,160,5760,8232,8233,8239,8287,12288,65279)
        OR unicode(substr(src, i, 1)) BETWEEN 8192 AND 8202
      THEN CASE WHEN folded = '' OR substr(folded, -1, 1) = ' ' THEN folded ELSE folded || ' ' END
      WHEN unicode(substr(src, i, 1)) BETWEEN 65 AND 90
      THEN folded || char(unicode(substr(src, i, 1)) + 32)
      WHEN unicode(substr(src, i, 1)) BETWEEN 192 AND 222
       AND unicode(substr(src, i, 1)) <> 215
      THEN folded || char(unicode(substr(src, i, 1)) + 32)
      WHEN unicode(substr(src, i, 1)) = 7838
      THEN folded || char(223)
      ELSE folded || substr(src, i, 1)
    END
  FROM walk
  WHERE i <= length(src) AND i <= 1000
),
-- Die letzte Zeile je Tag trägt das vollständige Ergebnis.
folded_tag(id, norm, folded) AS (
  SELECT id, rtrim(norm, ' '), rtrim(folded, ' ')
    FROM walk
   WHERE i = length(src) + 1
)
-- `rn` zählt, das wievielte Tag mit **diesem** Schlüssel in **diesem** Ordner
-- das ist. Alles über 1 ist ein bestehendes Doppeltes; siehe Schritt 3.
SELECT
  f.id     AS id,
  f.norm   AS norm,
  f.folded AS folded,
  ROW_NUMBER() OVER (PARTITION BY COALESCE(t.folder_id, '~root'), f.folded
                     ORDER BY t.created_at, t.id) AS rn
FROM folded_tag f JOIN tag t ON t.id = f.id;

-- ---------------------------------------------------------------------------
-- 3. Bestehende Doppelte auseinanderziehen
-- ---------------------------------------------------------------------------
--
-- Je Ordner, weil der eindeutige Index je Ordner gilt: Dasselbe Tag darf in
-- zwei Ordnern stehen (A-4.2).
--
-- Der Zusatz geht auf **beide** Spalten. `folded` bleibt damit die Faltung von
-- `norm`: Ziffern, Klammern und Leerzeichen falten auf sich selbst.
UPDATE _tag_key
   SET norm   = norm   || ' (' || rn || ')',
       folded = folded || ' (' || rn || ')'
 WHERE rn > 1;

-- ---------------------------------------------------------------------------
-- 4. Übertragen — in zwei Durchläufen, und das ist der Punkt
-- ---------------------------------------------------------------------------
--
-- `ux_tag_name` aus 0001 wird **je Zeile** geprüft, nicht am Ende der
-- Anweisung. Aus „back  end“ wird „back end“, und solange die Zeile daneben
-- noch „back end“ heißt, stünden für die Dauer eines Schreibvorgangs zwei
-- gleiche Namen da — die Migration bräche mit einer UNIQUE-Verletzung ab,
-- obwohl das Ergebnis eindeutig gewesen wäre. Gemessen, nicht befürchtet.
--
-- Deshalb erst auf einen Zwischenwert, der nicht kollidieren kann, und dann auf
-- den endgültigen. Dasselbe Muster wie beim Umsortieren der Kanban-Spalten
-- (`repo-statuses.ts`), aus demselben Grund.
UPDATE tag SET name = '~takt-0008~' || id;

-- `updated_at` bleibt stehen. Eine Vereinheitlichung des Leerraums ist keine
-- Änderung des Benutzers, und ein aufgefrischter Zeitstempel schöbe jedes Tag
-- in jeder nach Änderung sortierten Liste nach oben.
UPDATE tag
   SET name     = (SELECT norm   FROM _tag_key WHERE _tag_key.id = tag.id),
       name_key = (SELECT folded FROM _tag_key WHERE _tag_key.id = tag.id)
 WHERE EXISTS (SELECT 1 FROM _tag_key WHERE _tag_key.id = tag.id);

DROP TABLE _tag_key;

-- ---------------------------------------------------------------------------
-- 5. Die Zusage
-- ---------------------------------------------------------------------------
--
-- `ux_tag_name_key` ist der Wettlaufschutz: Zwei gleichzeitige Anlagen mit
-- demselben Schlüssel können nicht beide gelingen, gleich wie die Anwendung
-- vorher geprüft hat. `ux_tag_name` aus 0001 bleibt daneben stehen — er ist
-- schwächer, aber nicht falsch, und er trägt die Fehlermeldung „In diesem
-- Ordner gibt es bereits ein Tag mit diesem Namen“, auf die `errors.ts` bereits
-- abbildet.
CREATE UNIQUE INDEX ux_tag_name_key ON tag (COALESCE(folder_id, '~root'), name_key);

-- Der **ordnerübergreifende** Zugriff: „Gibt es irgendwo ein Tag namens
-- backend?“ Ohne diesen Index wäre das ein Tabellendurchlauf bei jedem
-- Anlegen eines Todos mit neuem Tag.
CREATE INDEX ix_tag_name_key ON tag (name_key);

-- ---------------------------------------------------------------------------
-- 6. Der Schlüssel darf nicht leer und nicht ungefaltet sein
-- ---------------------------------------------------------------------------
--
-- Ein CHECK wäre der richtige Ort, aber SQLite kann keinen an eine bestehende
-- Tabelle anhängen, ohne sie neu zu bauen — und ein Neubau von `tag` risse drei
-- Fremdschlüssel mit. Der Trigger leistet dasselbe.
--
-- Was er prüfen kann und was nicht: Ob der Schlüssel wirklich zu **diesem**
-- Namen gehört, weiß nur die Faltung, und die steht in TypeScript. Prüfbar ist
-- dagegen, ob der Wert überhaupt wie ein Schlüssel aussieht — nicht leer, keine
-- Großbuchstaben, kein Leerraum am Rand, keine doppelten Leerzeichen. Das
-- trifft den wahrscheinlichsten Fehlgriff: `name_key` mit dem Namen zu belegen.
CREATE TRIGGER trg_tag_name_key_insert
BEFORE INSERT ON tag
WHEN NEW.name_key = ''
  OR NEW.name_key <> lower(NEW.name_key)
  OR NEW.name_key <> trim(NEW.name_key)
  OR instr(NEW.name_key, '  ') > 0
BEGIN SELECT RAISE(ABORT, 'tag_name_key_invalid'); END;

CREATE TRIGGER trg_tag_name_key_update
BEFORE UPDATE ON tag
WHEN NEW.name_key = ''
  OR NEW.name_key <> lower(NEW.name_key)
  OR NEW.name_key <> trim(NEW.name_key)
  OR instr(NEW.name_key, '  ') > 0
BEGIN SELECT RAISE(ABORT, 'tag_name_key_invalid'); END;
