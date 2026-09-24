import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { openTestDatabase } from './support/setup.ts';

/** A-28.1, A-28.2 (T-397): `version_check_enabled` and `ui_language`, forward and backward. */
it('migration 0029 forward and backward: the CHECK constraints reject out-of-range values', () => {
  const db = openTestDatabase();
  try {
    // Forward is already applied by `openTestDatabase` (every migration up to the latest).
    expect(db.conn.prepare('SELECT version_check_enabled, ui_language FROM app_setting').get()).toEqual({
      version_check_enabled: 1,
      ui_language: 'de',
    });
    db.conn.exec("UPDATE app_setting SET ui_language = 'en', version_check_enabled = 0");
    expect(() => db.conn.exec("UPDATE app_setting SET ui_language = 'fr'")).toThrow();
    expect(() => db.conn.exec('UPDATE app_setting SET version_check_enabled = 2')).toThrow();
    expect(db.conn.prepare('SELECT version_check_enabled, ui_language FROM app_setting').get()).toEqual({
      version_check_enabled: 0,
      ui_language: 'en',
    });

    const down = readFileSync(new URL('../migrations/0029_interface_preferences.down.sql', import.meta.url), 'utf8');
    const up = readFileSync(new URL('../migrations/0029_interface_preferences.up.sql', import.meta.url), 'utf8');

    db.conn.exec(down);
    expect(() => db.conn.prepare('SELECT version_check_enabled FROM app_setting').get()).toThrow();
    expect(() => db.conn.prepare('SELECT ui_language FROM app_setting').get()).toThrow();

    db.conn.exec(up);
    // Both columns return with their default, not the pre-drop value — DROP COLUMN loses data,
    // as the migration's own comment says it does.
    expect(db.conn.prepare('SELECT version_check_enabled, ui_language FROM app_setting').get()).toEqual({
      version_check_enabled: 1,
      ui_language: 'de',
    });
    expect(() => db.conn.exec("UPDATE app_setting SET ui_language = 'fr'")).toThrow();
    expect(() => db.conn.exec('UPDATE app_setting SET version_check_enabled = 2')).toThrow();
    db.conn.exec("UPDATE app_setting SET ui_language = 'en'");
    expect(db.conn.prepare('SELECT ui_language FROM app_setting').get()?.['ui_language']).toBe('en');
  } finally {
    db.close();
  }
});
