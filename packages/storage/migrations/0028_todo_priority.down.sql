-- Takt — migration 0028 "todo_priority", backward direction
--
-- Data loss, named: all priorities and the priority of every todo are deleted. Going forward
-- again starts with no priorities.

DROP INDEX ix_todo_priority;
ALTER TABLE todo DROP COLUMN priority_id;
DROP TABLE todo_priority;
