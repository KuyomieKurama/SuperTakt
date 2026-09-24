-- Globale Bewegungsstärke der Oberfläche. „subtle" bewahrt die bisherige,
-- zurückhaltende Bewegungsdauer für jeden bestehenden Bestand.
ALTER TABLE app_setting ADD COLUMN motion_intensity TEXT NOT NULL DEFAULT 'subtle'
  CHECK (motion_intensity IN ('reduced', 'subtle', 'expressive'));
