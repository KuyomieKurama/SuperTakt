ALTER TABLE timer_idle ADD COLUMN previous_periods TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(previous_periods) AND json_type(previous_periods) = 'array');
