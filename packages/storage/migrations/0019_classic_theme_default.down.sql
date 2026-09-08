-- Die Auswahl bleibt auch beim Zurücksetzen der Vorgabe erhalten.
ALTER TABLE app_setting ADD COLUMN previous_design_theme TEXT NOT NULL DEFAULT 'clear'
  CHECK (previous_design_theme IN ('classic', 'clear'));
UPDATE app_setting SET previous_design_theme = design_theme;
ALTER TABLE app_setting DROP COLUMN design_theme;
ALTER TABLE app_setting RENAME COLUMN previous_design_theme TO design_theme;
