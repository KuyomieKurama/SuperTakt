-- Takt — Migration 0002 "seed_defaults", Vorwärtsrichtung
-- Datenmigration, getrennt von der Schemamigration 0001.
-- Legt an: die vier Beispielspalten aus A-5.3, die Einstellungszeile und die
-- nicht löschbare Standard-Exportvorlage aus A-8.2 bis A-8.5.
-- Die Feldliste ist die Speicherform aus E-005; packages/export validiert sie.
-- Die Schluessel Call/Zeit/Notiz/WindowsUser gibt das Abrechnungstool vor und
-- bleiben deutsch (A-8.2). Die Transformationsnamen sind technische Werte und
-- daher englisch: raw, round_to_quarter_hour, base64.

-- Die Spalte „Done" ist eine Spalte wie jede andere. Sie trägt keine Markierung,
-- die sie mit dem Erledigt-Kennzeichen aus A-2.4 verknüpft — beides ist
-- getrennt. Standardspalte für neu angelegte Todos ist „Backlog".
INSERT INTO todo_status (id, name, position, is_default, color, created_at, updated_at) VALUES
  ('01931000-0000-7000-8000-000000000001', 'Backlog',     1, 1, '#64748b', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('01931000-0000-7000-8000-000000000002', 'In Progress', 2, 0, '#2563eb', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('01931000-0000-7000-8000-000000000003', 'Waiting',     3, 0, '#d97706', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('01931000-0000-7000-8000-000000000004', 'Done',        4, 0, '#16a34a', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');

INSERT INTO export_template (id, name, is_builtin, definition, created_at, updated_at) VALUES
  ('01931000-0000-7000-8000-0000000000f1', 'Standard', 1,
   json('{"version":1,"fields":['
     || '{"name":"Call","source":"todo.callNumber","transform":"raw"},'
     || '{"name":"Zeit","source":"booking.durationSeconds","transform":"round_to_quarter_hour"},'
     || '{"name":"Notiz","source":"booking.note","transform":"base64"},'
     || '{"name":"WindowsUser","source":"system.windowsUser","transform":"raw"}]}'),
   '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');

INSERT INTO app_setting (id, export_directory, active_export_template_id, rounding_mode, locale, theme, updated_at)
VALUES (1, NULL, '01931000-0000-7000-8000-0000000000f1', 'up', 'de-DE', 'system', '2026-01-01T00:00:00Z');
