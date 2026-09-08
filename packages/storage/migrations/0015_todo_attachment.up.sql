-- Takt — Migration 0015 "todo_attachment", Vorwärtsrichtung
-- Deckt: A-19.8 bis A-19.15, A-19.17, A-19.19, E-071, E-072, A-A-16 bis A-A-18, A-A-21
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ===========================================================================
-- Wozu
-- ===========================================================================
--
-- A-19.8: „Ein Todo kann beliebig viele Anhänge tragen." Drei Arten (A-19.9):
-- Verweis, Bild, Datei. Sie hängen am **bestehenden** Todo und sind keine
-- zweite Struktur daneben (spec.md, Kopf von Abschnitt 19).
--
-- ===========================================================================
-- Die Form: eine Wertspalte, und die Art in einer eigenen Tabelle
-- ===========================================================================
--
-- Die Auflage lautet: Eine **vierte Art** darf keine Migration mit
-- Tabellenumbau verlangen. Drei Entwürfe standen zur Wahl, und der dritte ist
-- der einzige, der sie erfüllt:
--
--  1. **Drei Spalten** — `url`, `file_path`, `image_name`. Eine vierte Art
--     bekäme eine vierte Spalte, drei von vier wären in jeder Zeile leer, und
--     jede Abfrage müßte wissen, welche sie lesen darf. Verworfen.
--
--  2. **Eine Wertspalte mit `CHECK (kind IN ('link','image','file'))`.**
--     Kompakt und richtig — bis zur vierten Art. SQLite kann einen CHECK nicht
--     ändern; ihn zu erweitern heißt, die Tabelle neu zu bauen, die Zeilen zu
--     kopieren und die Fremdschlüssel wieder anzulegen. Genau das schließt die
--     Auflage aus, und jede kopierte Zeile ist eine Gelegenheit, etwas zu
--     verlieren (dieselbe Begründung wie in 0013).
--
--  3. **Eine Wertspalte und eine Nachschlagetabelle für die Art.** Die Art ist
--     ein Fremdschlüssel auf `todo_attachment_kind`. Die Menge der Arten ist
--     damit **Daten** und keine Schemaklausel: Eine vierte Art ist ein INSERT
--     und ein Zweig in `packages/domain/src/attachment.ts` — kein Umbau.
--     Gewählt.
--
-- Der Preis von (3) ist eine Tabelle mit drei Zeilen und eine Verknüpfung, die
-- niemand liest. Der Gegenwert ist, daß die Datenbank die Art trotzdem nicht
-- still gehorchen läßt: `ON DELETE RESTRICT` und `ON UPDATE RESTRICT` machen
-- aus einer unbekannten Art einen Fehlschlag beim Schreiben und nicht eine
-- Zeile, die niemand anzeigen kann. Das ist dieselbe Rolle wie die
-- RESTRICT-Klauseln aus 0011 und 0012: die zweite Wache, nicht die erste.
--
-- ===========================================================================
-- Was `target` je Art enthält (E-071 Punkt 1 und 2)
-- ===========================================================================
--
--   link   Die **Normalform** der Adresse (A-A-3). Was hier steht, ist genau
--          das, was angezeigt und was geöffnet wird. Normalisiert wird einmal,
--          beim Anlegen, in `packages/domain/src/attachment.ts` — und nirgends
--          sonst (A-A-13).
--   file   Der absolute Pfad, unverändert. Takt kopiert nichts und verwaltet
--          nichts davon; verschwindet die Datei, sagt der Anhang das (A-19.15).
--   image  Der **erzeugte** Name der Kopie im Bildverzeichnis (A-A-17). NICHT
--          der Name und nicht der Pfad der Quelldatei: Der verriete, wo der
--          Benutzer seine Dateien hält, und niemand braucht ihn nach dem
--          Kopieren.
--
-- ===========================================================================
-- Was hier NICHT steht
-- ===========================================================================
--
-- **Keine Bytes.** Ein Bild liegt als Datei im Anwendungsdatenverzeichnis
-- neben dem Bestand, unter denselben Rechten (0700/0600, E-018, A-A-17), und
-- nicht als BLOB in dieser Tabelle. Grund: Ein BLOB wandert in jede Sicherung
-- der Datenbankdatei, es bläht die WAL bei jedem Schreibvorgang, und es machte
-- aus `takt.db` eine Datei, deren Größe niemand mehr erklären kann.
--
-- **Keine Verbindung zum Export.** Es gibt keine Sicht und keinen Trigger, der
-- diese Tabelle mit `v_export_candidate` oder `export_run_entry` verbindet, und
-- es wird nie einen geben (A-19.17). Der Schutz ist derselbe wie beim internen
-- Vermerk: `ExportSourcePath` bleibt bei zwölf Werten, `ExportCandidate` und
-- `ExportGroup` tragen kein Anhangsfeld — der **Typ** trägt die Grenze, nicht
-- eine Filterliste (R-06, A-A-20).
--
-- ===========================================================================
-- ON DELETE CASCADE, und warum die Bildkopie trotzdem nicht von selbst geht
-- ===========================================================================
--
-- `todo_id` steht auf CASCADE wie `todo_note` und `todo_tag`: Ein gelöschtes
-- Todo läßt keine Anhänge zurück.
--
-- Die **Datei** im Bildverzeichnis nimmt die Datenbank dabei nicht mit — sie
-- kennt kein Dateisystem. A-A-18 verlangt trotzdem, daß sie mitgeht: Eine
-- verwaiste Kopie ist Kundenmaterial ohne Eigentümer. Das leistet der
-- Anwendungsfall, der vor dem Löschen die Namen liest und danach die Dateien
-- entfernt. Diese Reihenfolge steht dort und ist der Grund, warum das Löschen
-- eines Todos den Anhangsport überhaupt anfaßt.

-- ---------------------------------------------------------------------------
-- Die Arten (A-19.9). Daten und keine Schemaklausel — siehe Entwurf (3) oben.
-- ---------------------------------------------------------------------------
CREATE TABLE todo_attachment_kind (
  kind TEXT NOT NULL PRIMARY KEY,
  CHECK (length(trim(kind)) > 0)
) WITHOUT ROWID;

INSERT INTO todo_attachment_kind (kind) VALUES ('link'), ('image'), ('file');

-- ---------------------------------------------------------------------------
-- Die Anhänge selbst (A-19.8 bis A-19.14)
-- ---------------------------------------------------------------------------
CREATE TABLE todo_attachment (
  id         TEXT NOT NULL PRIMARY KEY,
  todo_id    TEXT NOT NULL REFERENCES todo (id) ON DELETE CASCADE,
  kind       TEXT NOT NULL REFERENCES todo_attachment_kind (kind)
               ON DELETE RESTRICT ON UPDATE RESTRICT,
  -- Frei gewählte Bezeichnung (A-19.10). NULL heißt „nicht gesetzt"; die
  -- Ersatzbeschriftung aus A-19.12 entsteht beim Anzeigen und wird nicht
  -- gespeichert — sie hinge sonst an einem Titel von gestern.
  title      TEXT,
  target     TEXT NOT NULL,
  -- Reihenfolge des Hinzufügens (A-19.8: „in einer erkennbaren, stabilen
  -- Ordnung, nicht zufällig bei jedem Laden neu gemischt").
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (title IS NULL OR length(trim(title)) > 0),
  CHECK (length(trim(target)) > 0),
  -- 4 096 ist MAX_ATTACHMENT_PATH_BYTES, die weiteste der drei Grenzen aus
  -- `packages/domain/src/attachment.ts`. Der CHECK zählt Zeichen und die
  -- Domäne Bytes; er ist damit die weitere von beiden und genau das, was er
  -- sein soll — ein Deckel gegen einen Roman im Feld, keine zweite Meinung
  -- über die Form.
  CHECK (length(target) <= 4096),
  CHECK (position >= 0),
  CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z')
);

-- Alle Anhänge eines Todos in ihrer Reihenfolge, in einem Indexdurchlauf.
CREATE INDEX ix_todo_attachment_todo ON todo_attachment (todo_id, position, id);

-- Die Bildkopien eines Bestands, ohne Tabellendurchlauf. Gebraucht beim
-- Aufräumen: Welche Datei im Bildverzeichnis hat keinen Eigentümer mehr?
CREATE INDEX ix_todo_attachment_image ON todo_attachment (target) WHERE kind = 'image';
