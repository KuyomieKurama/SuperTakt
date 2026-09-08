ALTER TABLE app_setting ADD COLUMN idle_keep_timer_running INTEGER NOT NULL DEFAULT 1 CHECK (idle_keep_timer_running IN (0, 1));
