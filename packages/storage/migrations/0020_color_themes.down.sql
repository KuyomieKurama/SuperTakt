-- Ältere Versionen kennen nur Klassisch und Klar.
ALTER TABLE app_setting ADD COLUMN previous_design_theme TEXT NOT NULL DEFAULT 'classic'
  CHECK (previous_design_theme IN ('classic', 'clear'));
UPDATE app_setting SET previous_design_theme = CASE WHEN design_theme = 'clear' THEN 'clear' ELSE 'classic' END;
ALTER TABLE app_setting DROP COLUMN design_theme;
ALTER TABLE app_setting RENAME COLUMN previous_design_theme TO design_theme;
