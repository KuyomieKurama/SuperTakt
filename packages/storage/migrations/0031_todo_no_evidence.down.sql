-- The no-evidence mark is discarded when downgrading. Back up the database before this migration.
ALTER TABLE todo DROP COLUMN no_evidence;