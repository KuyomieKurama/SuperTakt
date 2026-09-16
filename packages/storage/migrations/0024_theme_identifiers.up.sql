-- Theme-Dateien liefern die erlaubte Auswahl im Dienst. SQLite sichert die
-- Kennungsform, damit neue Themes keine weitere Schemaänderung benötigen.
ALTER TABLE app_setting ADD COLUMN next_design_theme TEXT NOT NULL DEFAULT 'classic'
  CHECK (length(next_design_theme) BETWEEN 1 AND 64
    AND next_design_theme GLOB '[a-z]*'
    AND next_design_theme NOT GLOB '*[^a-z0-9-]*');
UPDATE app_setting SET next_design_theme = design_theme;
ALTER TABLE app_setting DROP COLUMN design_theme;
ALTER TABLE app_setting RENAME COLUMN next_design_theme TO design_theme;
