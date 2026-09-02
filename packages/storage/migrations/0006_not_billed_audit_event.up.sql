-- Takt — Migration 0006 "not_billed_audit_event", Vorwärtsrichtung
-- takt: foreign_keys=off
-- Deckt: E-047 (ersetzt E-037), R-10. Auflage aus T-022 (offene Frage 1).
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ---------------------------------------------------------------------------
-- Warum diese Migration ohne Fremdschlüsselprüfung läuft
-- ---------------------------------------------------------------------------
--
-- Beide Teile bauen eine Tabelle um, und SQLite kennt kein ALTER TABLE für
-- einen CHECK. Der vorgeschriebene Weg — neue Tabelle, kopieren, alte weg,
-- umbenennen — stößt bei `time_entry` auf zwei Sperren, die beide an der
-- eingeschalteten Fremdschlüsselprüfung hängen:
--
--   1. `export_audit` und `export_run_entry` verweisen mit ON DELETE RESTRICT
--      auf `time_entry`. Das DROP führt eine stille Löschung aller Zeilen aus
--      und scheitert an eben diesem RESTRICT.
--   2. Ein RENAME zieht bei eingeschalteter Prüfung die REFERENCES-Klauseln
--      der Kinder mit. Die Kinder zeigten danach auf die weggeworfene Tabelle.
--
-- Deshalb die Marke `-- takt: foreign_keys=off` in Zeile 2. Sie schaltet die
-- Prüfung **nicht** ab, sie verschiebt sie: Der Läufer führt nach dem letzten
-- Befehl dieser Datei und vor dem Festschreiben `PRAGMA foreign_key_check`
-- über den ganzen Bestand aus und nimmt alles zurück, sobald ein Verweis ins
-- Leere zeigt.
--
-- `legacy_alter_table` kommt dazu, weil ein RENAME sonst auch die Sicht
-- `v_export_candidate` und die Trigger anderer Tabellen umschreibt — und weil
-- er in seiner neueren Form das gesamte Schema neu einliest und dabei über die
-- für einen Augenblick fehlende Tabelle stolpert.
--
-- ---------------------------------------------------------------------------
-- Warum das Protokoll einen dritten Ereignistyp bekommt
-- ---------------------------------------------------------------------------
--
-- E-047: „Nicht abrechnen" ist kein Export. Der Exportstatus der Buchung geht
-- trotzdem auf 'exported' — zweiwertig bleibt zweiwertig (E-032) —, aber das
-- Protokoll muss festhalten, was tatsächlich geschah. Sonst beantwortet es die
-- eine Frage nicht mehr, für die man ein Exportprotokoll führt: Wie viel Zeit
-- ist nie abgerechnet worden?
--
-- Der CHECK aus 0001 verlangt für event='exported' einen Exportlauf **und** eine
-- Exportzeile. Genau richtig: Eine als abgerechnet geführte Buchung ohne Beleg
-- wäre der Fehler, den dieser CHECK verhindert. Deshalb wird er hier nicht
-- gelockert, sondern um einen dritten, gleich strengen Zweig erweitert:
--
--   exported    Lauf und Zeile gesetzt,   Ziel 'exported'
--   reset       Lauf und Zeile NULL,      Ziel 'open'
--   not_billed  Lauf und Zeile NULL,      Ziel 'exported'
--
-- 'not_billed' ist damit an seiner Belegfreiheit erkennbar und nicht nur am
-- Namen: Eine Zeile mit export_run_id kann kein 'not_billed' sein und
-- umgekehrt. Eine Auswertung „nie abgerechnete Zeit" ist ein WHERE auf event.
--
-- ---------------------------------------------------------------------------
-- Warum ein Tabellenumbau
-- ---------------------------------------------------------------------------
--
-- Der Umbau folgt dem vorgeschriebenen Weg: neue Tabelle, Inhalt kopieren,
-- alte weg, umbenennen, Indizes und Trigger wortgleich wieder anlegen. Er ist
-- verlustfrei — jede vorhandene Protokollzeile erfüllt den neuen CHECK, weil er
-- die beiden alten Zweige unverändert enthält.
--
-- Die beiden Trigger verbieten UPDATE und DELETE auf dem Protokoll. Sie hängen
-- an der alten Tabelle und verschwinden mit ihr; DROP TABLE löst kein
-- BEFORE DELETE aus. Sie werden unten wortgleich wiederhergestellt. Zwischen
-- DROP und CREATE liegt keine Zeile ungeschützt: Alles hier läuft in der einen
-- Transaktion des Läufers.
-- ---------------------------------------------------------------------------

-- Die beiden folgenden Zeilen sind kein Widerspruch zur Marke in Zeile 2,
-- sondern ihre Ergänzung: `PRAGMA foreign_keys` ist **innerhalb** einer
-- offenen Transaktion wirkungslos. Läuft diese Datei über den Migrationsläufer,
-- ist die Prüfung durch die Marke bereits vor BEGIN abgeschaltet und diese Zeile
-- tut nichts. Wird sie ohne Läufer eingespielt — so machen es die Prüfpfade, die
-- das Schema selbst untersuchen —, gibt es keine offene Transaktion, und dann
-- ist genau diese Zeile die wirksame. Ohne sie zöge das RENAME weiter unten die
-- REFERENCES-Klauseln der Kindtabellen mit auf die weggeworfene Tabelle.
PRAGMA foreign_keys = OFF;

PRAGMA legacy_alter_table = ON;

CREATE TABLE export_audit_neu (
  id                  TEXT NOT NULL PRIMARY KEY,
  time_entry_id       TEXT NOT NULL REFERENCES time_entry       (id) ON DELETE RESTRICT,
  event               TEXT NOT NULL CHECK (event           IN ('exported', 'reset', 'not_billed')),
  previous_status     TEXT NOT NULL CHECK (previous_status IN ('open', 'exported')),
  new_status          TEXT NOT NULL CHECK (new_status      IN ('open', 'exported')),
  export_run_id       TEXT          REFERENCES export_run       (id) ON DELETE RESTRICT,
  export_run_group_id TEXT          REFERENCES export_run_group (id) ON DELETE RESTRICT,
  actor               TEXT NOT NULL,
  reason              TEXT NOT NULL DEFAULT '',
  occurred_at         TEXT NOT NULL,
  CHECK (previous_status <> new_status),
  CHECK ((event = 'exported'   AND export_run_id       IS NOT NULL
                               AND export_run_group_id IS NOT NULL
                               AND new_status = 'exported')
      OR (event = 'reset'      AND export_run_id       IS NULL
                               AND export_run_group_id IS NULL
                               AND new_status = 'open')
      OR (event = 'not_billed' AND export_run_id       IS NULL
                               AND export_run_group_id IS NULL
                               AND new_status = 'exported'))
);

INSERT INTO export_audit_neu
  (id, time_entry_id, event, previous_status, new_status,
   export_run_id, export_run_group_id, actor, reason, occurred_at)
SELECT
   id, time_entry_id, event, previous_status, new_status,
   export_run_id, export_run_group_id, actor, reason, occurred_at
  FROM export_audit;

DROP TABLE export_audit;

ALTER TABLE export_audit_neu RENAME TO export_audit;

CREATE INDEX ix_export_audit_entry ON export_audit (time_entry_id, occurred_at DESC);
CREATE INDEX ix_export_audit_time  ON export_audit (occurred_at DESC);

CREATE TRIGGER trg_export_audit_no_update BEFORE UPDATE ON export_audit
BEGIN SELECT RAISE(ABORT, 'append_only'); END;
CREATE TRIGGER trg_export_audit_no_delete BEFORE DELETE ON export_audit
BEGIN SELECT RAISE(ABORT, 'append_only'); END;

-- ---------------------------------------------------------------------------
-- Zweiter Teil: die Buchung selbst darf ausgebucht sein
-- ---------------------------------------------------------------------------
--
-- 0001 führt den CHECK `export_status = 'open' OR export_count >= 1` mit der
-- Begründung „Exportiert und nie in einem Lauf gewesen ist widersprüchlich"
-- (datenmodell.md 4.4). Mit E-047 ist der Satz nicht mehr wahr: Eine
-- ausgebuchte Buchung ist genau das — exportiert im Status, nie in einem Lauf.
-- `export_count` mitzuzählen wäre der bequeme Ausweg und eine Falschaussage:
-- Die Oberfläche liest `export_status = 'open' AND export_count > 0` als „schon
-- einmal exportiert" (R-10) und würde nach einem Zurücksetzen vor einer zweiten
-- Abrechnung warnen, die nie eine erste hatte.
--
-- Der CHECK entfällt deshalb — aber die Zusage dahinter bleibt, und zwar
-- schärfer als vorher. Statt „irgendein Zähler ist positiv" verlangt der neue
-- Trigger eine **Herkunft**: Wer eine offene Buchung auf `exported` setzt, ohne
-- dass ein Exportlauf mitzählt, muss die Protokollzeile bereits geschrieben
-- haben. Damit ist „beides oder keines" (R-10) nicht mehr nur eine Zusage des
-- Adapters, sondern eine des Schemas.
--
-- Zum Verfahren siehe den Dateikopf.

ALTER TABLE time_entry RENAME TO time_entry_alt;

CREATE TABLE time_entry (
  id               TEXT    NOT NULL PRIMARY KEY,
  todo_id          TEXT    NOT NULL REFERENCES todo (id) ON DELETE RESTRICT,
  started_at       TEXT    NOT NULL,
  ended_at         TEXT,
  duration_seconds INTEGER GENERATED ALWAYS AS (
                     CASE WHEN ended_at IS NULL THEN NULL
                          ELSE unixepoch(ended_at) - unixepoch(started_at) END
                   ) STORED,
  note             TEXT    NOT NULL DEFAULT '',
  export_status    TEXT    NOT NULL DEFAULT 'open'  CHECK (export_status IN ('open', 'exported')),
  export_count     INTEGER NOT NULL DEFAULT 0       CHECK (export_count >= 0),
  source           TEXT    NOT NULL DEFAULT 'timer' CHECK (source IN ('timer', 'manual')),
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL,
  CHECK (started_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'),
  CHECK (ended_at IS NULL OR ended_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'),
  CHECK (ended_at IS NULL OR ended_at > started_at),
  CHECK (duration_seconds IS NULL OR duration_seconds >= 1),   -- E-008: Dauer 0 gibt es nicht
  CHECK (export_status = 'open' OR ended_at IS NOT NULL)       -- laufend ist nie exportiert
  -- Der Zähler-CHECK aus 0001 ist entfallen; an seiner Stelle steht
  -- trg_time_entry_exported_needs_provenance weiter unten.
);

INSERT INTO time_entry
  (id, todo_id, started_at, ended_at, note, export_status, export_count, source, created_at, updated_at)
SELECT
   id, todo_id, started_at, ended_at, note, export_status, export_count, source, created_at, updated_at
  FROM time_entry_alt;

DROP TABLE time_entry_alt;

-- Indizes und Trigger wortgleich aus 0001.
CREATE UNIQUE INDEX ux_time_entry_running ON time_entry ((1)) WHERE ended_at IS NULL;
CREATE INDEX ix_time_entry_todo   ON time_entry (todo_id, started_at DESC);
CREATE INDEX ix_time_entry_queue  ON time_entry (todo_id, started_at) WHERE export_status = 'open';
CREATE INDEX ix_time_entry_day    ON time_entry (started_at DESC);
CREATE INDEX ix_time_entry_reset  ON time_entry (todo_id) WHERE export_status = 'open' AND export_count > 0;

CREATE TRIGGER trg_time_entry_locked
BEFORE UPDATE ON time_entry
WHEN OLD.export_status = 'exported' AND NEW.export_status = 'exported'
 AND (NEW.todo_id    <> OLD.todo_id
   OR NEW.started_at <> OLD.started_at
   OR NEW.ended_at   IS NOT OLD.ended_at
   OR NEW.note       <> OLD.note
   OR NEW.source     <> OLD.source)
BEGIN
  SELECT RAISE(ABORT, 'time_entry_locked');
END;

CREATE TRIGGER trg_time_entry_no_delete_exported
BEFORE DELETE ON time_entry
WHEN OLD.export_status = 'exported'
BEGIN
  SELECT RAISE(ABORT, 'time_entry_locked');
END;

-- Neu: kein Exportstatus ohne Herkunft.
--
-- Zählt ein Exportlauf mit, steigt `export_count` in derselben Anweisung — die
-- Bedingung greift dann nicht. Bleibt der Zähler stehen, ist es eine
-- Ausbuchung, und dann **muss** die Protokollzeile schon dastehen: Der Adapter
-- schreibt sie vor dem Statuswechsel (`markNotBilled` in repo-export.ts).
--
-- Geprüft wird die **jüngste** Zeile des Protokolls, nicht irgendeine. Eine
-- alte Ausbuchung, die längst zurückgesetzt wurde, rechtfertigt keine neue:
-- Nach einem Zurücksetzen ist die jüngste Zeile 'reset', und der Versuch
-- scheitert.
--
-- `IS NOT` statt `<>`: Ohne jede Protokollzeile liefert die Unterabfrage NULL,
-- und ein Vergleich mit `<>` wäre dann NULL statt wahr — die Prüfung liefe ins
-- Leere, ausgerechnet im Fall „gar nichts protokolliert".
CREATE TRIGGER trg_time_entry_exported_needs_provenance
BEFORE UPDATE ON time_entry
WHEN OLD.export_status = 'open' AND NEW.export_status = 'exported'
 AND NEW.export_count = OLD.export_count
 AND (SELECT event FROM export_audit
       WHERE time_entry_id = NEW.id
       ORDER BY occurred_at DESC, id DESC
       LIMIT 1) IS NOT 'not_billed'
BEGIN
  SELECT RAISE(ABORT, 'export_status_not_settable');
END;

PRAGMA legacy_alter_table = OFF;

PRAGMA foreign_keys = ON;
