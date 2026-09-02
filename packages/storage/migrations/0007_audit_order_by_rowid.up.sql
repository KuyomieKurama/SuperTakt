-- Takt — Migration 0007 "audit_order_by_rowid", Vorwärtsrichtung
-- Deckt: R-10, E-047. Auflage aus T-041 (Nachtrag), freigegeben in T-047.
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ---------------------------------------------------------------------------
-- Eine Integritätsprüfung der Datenbank darf nicht am Kennungsgenerator der
-- Anwendung hängen
-- ---------------------------------------------------------------------------
--
-- `trg_time_entry_exported_needs_provenance` aus Migration 0006 lässt den
-- Wechsel auf `export_status = 'exported'` ohne mitzählenden Exportlauf nur zu,
-- wenn die **jüngste** Protokollzeile der Buchung `not_billed` ist. „Jüngste"
-- war bisher `ORDER BY occurred_at DESC, id DESC`.
--
-- `occurred_at` ist sekundengenau. Zwei Protokollzeilen derselben Buchung in
-- derselben Sekunde — ein Zurücksetzen und eine sofortige Ausbuchung, wie sie
-- die Oberfläche mit zwei Klicks erzeugt — sind über `occurred_at` allein nicht
-- zu ordnen. Dann entscheidet der Zweitschlüssel, und der war die Kennung.
--
-- Die Kennung ist eine UUIDv7. Sie ist millisekundengenau **sortierbar**, aber
-- innerhalb derselben Millisekunde füllt der Zufall die restlichen Bits: Zwei
-- in derselben Millisekunde erzeugte Kennungen stehen mit gleicher
-- Wahrscheinlichkeit in der einen wie in der anderen Reihenfolge. Der Trigger
-- las also in einem von zwei Fällen die **falsche** Zeile als „jüngste" — und
-- ließ einen Statuswechsel zu, den er verbieten sollte, oder verbot einen, den
-- er zulassen sollte. T-041 hat das gemessen: neun Abweichungen in vierzig
-- Runden, in drei von vier Läufen unsichtbar.
--
-- `ids.ts` hat seither einen Zähler (RFC 9562 6.2), der die Ordnung auch
-- innerhalb einer Millisekunde herstellt. Das behebt die Ursache breit — es
-- lässt die Zusage der Datenbank aber an einer Zusage der Anwendung hängen.
-- Wer `IdSource` austauscht, hebt eine Integritätsprüfung auf, ohne davon zu
-- erfahren. Diese Migration hängt sie stattdessen an etwas, das die Datenbank
-- selbst weiß.
--
-- ---------------------------------------------------------------------------
-- Warum `rowid` die Reihenfolge kennt
-- ---------------------------------------------------------------------------
--
-- `export_audit` ist eine gewöhnliche Rowid-Tabelle: `id` ist TEXT und damit
-- kein `INTEGER PRIMARY KEY`, also führt SQLite den verborgenen `rowid` selbst.
-- Ohne AUTOINCREMENT vergibt er `max(rowid) + 1` — die Wiederverwendung einer
-- Nummer setzte voraus, dass die höchste Zeile gelöscht wird, und das verbieten
-- `trg_export_audit_no_update` und `trg_export_audit_no_delete`. Die Tabelle
-- ist anhängend; `rowid` ist damit streng aufsteigend in der
-- Einfügereihenfolge und der einzige Wert in dieser Tabelle, der die
-- Reihenfolge **kennt**, statt sie aus einer Uhr oder einem Zufall zu schätzen.
--
-- Zur Vollständigkeit: Ein `VACUUM` darf `rowid` einer Tabelle ohne explizites
-- `INTEGER PRIMARY KEY` neu vergeben. Es tut das in der bestehenden Ordnung,
-- die Reihenfolge bleibt also erhalten — und der Läufer benutzt ohnehin nur
-- `VACUUM INTO`, das eine **Kopie** schreibt und den laufenden Bestand nicht
-- anfasst.
--
-- ---------------------------------------------------------------------------
-- Verlustfrei
-- ---------------------------------------------------------------------------
--
-- Es wird keine Zeile angefasst und keine Tabelle umgebaut, nur eine Bedingung
-- getauscht. Die Rückwärtsrichtung stellt den Wortlaut aus 0006 wieder her und
-- ist ebenso verlustfrei — sie holt den Wettlauf zurück, mehr nicht.

DROP TRIGGER IF EXISTS trg_time_entry_exported_needs_provenance;

CREATE TRIGGER trg_time_entry_exported_needs_provenance
BEFORE UPDATE ON time_entry
WHEN OLD.export_status = 'open' AND NEW.export_status = 'exported'
 AND NEW.export_count = OLD.export_count
 AND (SELECT event FROM export_audit
       WHERE time_entry_id = NEW.id
       ORDER BY occurred_at DESC, rowid DESC
       LIMIT 1) IS NOT 'not_billed'
BEGIN
  SELECT RAISE(ABORT, 'export_status_not_settable');
END;
