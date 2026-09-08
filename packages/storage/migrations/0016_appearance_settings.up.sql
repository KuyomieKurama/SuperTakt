-- SuperTakt — wählbare Gestaltung und dauerhafte Zeilendichte (A-21.4).
-- Vorhandene Installationen behalten ihre klassische Gestaltung.
ALTER TABLE app_setting ADD COLUMN design_theme TEXT NOT NULL DEFAULT 'classic'
  CHECK (design_theme IN ('classic', 'clear'));
ALTER TABLE app_setting ADD COLUMN density TEXT NOT NULL DEFAULT 'comfortable'
  CHECK (density IN ('comfortable', 'compact'));
