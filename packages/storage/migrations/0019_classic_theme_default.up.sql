-- Klassisch ist die Vorgabe. Bereits gespeicherte Auswahlen bleiben erhalten.
-- Die unveränderte Seed-Zeile stammt aus 0002; jede Einstellungsänderung
-- schreibt updated_at. Neue und noch unkonfigurierte Bestände erhalten Klassisch.
ALTER TABLE app_setting ADD COLUMN next_design_theme TEXT NOT NULL DEFAULT 'classic'
  CHECK (next_design_theme IN ('classic', 'clear'));
UPDATE app_setting SET next_design_theme = design_theme
  WHERE updated_at <> '2026-01-01T00:00:00Z';
ALTER TABLE app_setting DROP COLUMN design_theme;
ALTER TABLE app_setting RENAME COLUMN next_design_theme TO design_theme;
