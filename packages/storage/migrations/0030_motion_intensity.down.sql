-- Die persönliche Bewegungsstärke wird beim Rückweg verworfen; ältere
-- Fassungen kennen nur ihre bisherige, zurückhaltende Bewegung.
ALTER TABLE app_setting DROP COLUMN motion_intensity;
