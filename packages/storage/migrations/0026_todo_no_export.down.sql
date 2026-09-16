DROP VIEW v_export_candidate;
CREATE VIEW v_export_candidate AS
SELECT
  te.id               AS time_entry_id,
  te.todo_id          AS todo_id,
  te.started_at       AS started_at,
  te.ended_at         AS ended_at,
  te.duration_seconds AS duration_seconds,
  te.note             AS booking_note,
  te.export_count     AS export_count,
  t.title             AS todo_title,
  t.call_number       AS todo_call_number
FROM time_entry te
JOIN todo t ON t.id = te.todo_id
WHERE te.export_status = 'open'
  AND te.ended_at IS NOT NULL;
ALTER TABLE todo DROP COLUMN no_export;
