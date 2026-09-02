-- Takt — Migration 0007 "audit_order_by_rowid", Rückwärtsrichtung
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- Stellt `trg_time_entry_exported_needs_provenance` im Wortlaut aus Migration
-- 0006 wieder her: `ORDER BY occurred_at DESC, id DESC`.
--
-- Verlustfrei. Es wird keine Zeile angefasst; zurück kommt allein der
-- Wettlauf, den 0007 beseitigt hat — zwei Protokollzeilen derselben Buchung in
-- derselben Sekunde ordnet der Trigger danach wieder über die Kennung, und
-- damit über den Zufall in den unteren Bits einer UUIDv7.
--
-- Die Begründung steht vollständig im Kopf der Vorwärtsdatei. Sie wird hier
-- nicht wiederholt, damit es nur eine Fassung davon gibt.

DROP TRIGGER IF EXISTS trg_time_entry_exported_needs_provenance;

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
