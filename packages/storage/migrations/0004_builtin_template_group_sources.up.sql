-- Takt — Migration 0004 "builtin_template_group_sources", Vorwärtsrichtung
-- Deckt: E-020, E-026, E-033. Auflage aus T-009.
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ---------------------------------------------------------------------------
-- Warum die Standardvorlage nachgezogen wird
-- ---------------------------------------------------------------------------
--
-- Migration 0002 hat die Standardvorlage mit den Quellen `booking.durationSeconds`
-- und `booking.note` angelegt. Das war der Stand vor E-020: eine Exportzeile je
-- Buchung. Seither entsteht eine Zeile je Todo und Kalendertag, und E-033 hat
-- `booking.*` in `ExportSourcePath` (packages/domain/src/export.ts) **entfernt**
-- statt umgedeutet — abgesichert durch die Typbehauptung `BookingSourcesAreGone`.
--
-- Damit zeigt die mitgelieferte, nicht löschbare Vorlage auf zwei Quellen, die
-- es in der Domäne nicht mehr gibt. Der Vorlagen-Motor weist sie mit
-- `export_source_forbidden` ab: Die Standardvorlage wäre unbenutzbar, und zwar
-- ausgerechnet die eine, die der Benutzer nicht löschen und nicht reparieren
-- kann (A-8.7).
--
-- Ersetzt wird:
--
--   Zeit   booking.durationSeconds -> group.quarters
--          Die **gerundete** Tagessumme der Gruppe (E-008, E-020). Erst
--          addieren, dann runden — 10, 20 und 5 Minuten am selben Tag ergeben
--          0,75 und nicht dreimal aufgerundet 1,00.
--   Notiz  booking.note            -> group.bookingNotes
--          Die nach Startzeit sortierten und mit "; " verbundenen
--          Leistungstexte der Gruppe (E-026, E-028). Base64 wird auf den
--          zusammengeführten Text angewandt, nicht je Einzeltext.
--
-- Die Transformation für `Zeit` heißt jetzt `quarter_hours_to_number` statt
-- `round_to_quarter_hour`. Das ist kein Schönheitswechsel: Die alte
-- Transformation bekam Sekunden und rundete sie; die neue bekommt eine bereits
-- gerundete Anzahl Viertelstunden und teilt sie durch vier. Bliebe der alte
-- Name stehen, würde eine Umsetzung, die ihn wörtlich nimmt, die Zahl 3 als
-- Sekunden lesen und daraus 0,25 machen — aus 0,75 würde still 0,25 auf einer
-- Kundenrechnung. Ein unbekannter Name bricht sichtbar beim Validieren, ein
-- umgedeuteter bricht still und erst beim Abrechnen. Genau das ist die
-- Begründung aus E-033, eine Ebene tiefer.
--
-- Die Trigger auf export_template verbieten jede Änderung an der
-- Standardvorlage (A-8.7). Sie werden für die Dauer der Migration entfernt und
-- danach wortgleich wiederhergestellt — wie schon in der Rückwärtsrichtung von
-- 0002.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_export_template_builtin_no_delete;
DROP TRIGGER IF EXISTS trg_export_template_builtin_no_update;

UPDATE export_template
   SET definition = json('{"version":1,"fields":['
         || '{"name":"Call","source":"todo.callNumber","transform":"raw"},'
         || '{"name":"Zeit","source":"group.quarters","transform":"quarter_hours_to_number"},'
         || '{"name":"Notiz","source":"group.bookingNotes","transform":"base64"},'
         || '{"name":"WindowsUser","source":"system.windowsUser","transform":"raw"}]}'),
       updated_at = '2026-09-01T00:00:00Z'
 WHERE id = '01931000-0000-7000-8000-0000000000f1'
   AND is_builtin = 1;

CREATE TRIGGER trg_export_template_builtin_no_delete
BEFORE DELETE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;

CREATE TRIGGER trg_export_template_builtin_no_update
BEFORE UPDATE ON export_template WHEN OLD.is_builtin = 1
BEGIN SELECT RAISE(ABORT, 'builtin_template_immutable'); END;
