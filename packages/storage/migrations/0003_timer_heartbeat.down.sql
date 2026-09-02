-- Takt — Migration 0003 "timer_heartbeat", Rückwärtsrichtung
-- Reihenfolge: erst die Trigger, dann die Tabelle.
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- Verlustfrei im fachlichen Sinn: Das Lebenszeichen ist ein flüchtiger Wert für
-- einen gerade laufenden Timer. Es geht keine erfasste Arbeitszeit verloren —
-- die Buchungen selbst stehen in time_entry und bleiben unberührt. Nach der
-- Rücknahme verhält sich Takt wie vor E-036: Ein verwaister Timer ist dann
-- nicht mehr bis zum letzten Lebenszeichen buchbar, sondern nur noch zu
-- verwerfen.

DROP TRIGGER IF EXISTS trg_timer_heartbeat_only_running_update;
DROP TRIGGER IF EXISTS trg_timer_heartbeat_only_running_insert;

DROP TABLE IF EXISTS timer_heartbeat;
