-- Zusätzliche Farbthemen auf dem klassischen Layout.
ALTER TABLE app_setting ADD COLUMN next_design_theme TEXT NOT NULL DEFAULT 'classic'
  CHECK (next_design_theme IN ('classic', 'clear', 'arc', 'cybr', 'dark-base', 'dracula', 'everfrost', 'glass', 'lines', 'liquid-glass', 'nord-polar-night', 'nord-snow-storm', 'plainspace', 'rainbow', 'zen', 'velvet', 'catppuccin-latte', 'catppuccin-frappe', 'catppuccin-macchiato', 'catppuccin-mocha'));
UPDATE app_setting SET next_design_theme = design_theme;
ALTER TABLE app_setting DROP COLUMN design_theme;
ALTER TABLE app_setting RENAME COLUMN next_design_theme TO design_theme;
