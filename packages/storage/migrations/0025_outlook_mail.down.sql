-- Takt — migration 0025 "outlook_mail", backward direction
--
-- Data loss, named: every mail history entry (`todo_mail`, including personal mail notes) and
-- every add-in request receipt (`addin_mail_receipt`) is deleted, and each todo loses its due
-- time and time estimate. Files attached from e-mails stay as ordinary attachments. Without the
-- receipts, an add-in request repeated after going forward again can create a duplicate.

DROP TABLE addin_mail_receipt;
DROP TABLE todo_mail;
ALTER TABLE todo DROP COLUMN due_time;
ALTER TABLE todo DROP COLUMN estimate_minutes;
