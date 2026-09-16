import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { openTestDatabase } from './support/setup.ts';

it('neue Theme-Kennungen benötigen keine weitere Migration; Rückweg erhält bekannte Themes', () => {
  const db = openTestDatabase();
  try {
    db.conn.exec("UPDATE app_setting SET design_theme = 'dracula'");
    const down = readFileSync(new URL('../migrations/0024_theme_identifiers.down.sql', import.meta.url), 'utf8');
    const up = readFileSync(new URL('../migrations/0024_theme_identifiers.up.sql', import.meta.url), 'utf8');
    db.conn.exec(down);
    expect(() => db.conn.exec("UPDATE app_setting SET design_theme = 'test-ocean'")).toThrow();
    db.conn.exec(up);
    expect(db.conn.prepare('SELECT design_theme FROM app_setting').get()?.['design_theme']).toBe('dracula');
    db.conn.exec("UPDATE app_setting SET design_theme = 'test-ocean'");
    expect(db.conn.prepare('SELECT design_theme FROM app_setting').get()?.['design_theme']).toBe('test-ocean');
    for (const invalid of ['', 'UPPER', '../theme', '<script>', 'a'.repeat(65)]) {
      expect(() => db.conn.prepare('UPDATE app_setting SET design_theme = ?').run(invalid)).toThrow();
    }
    db.conn.exec(down);
    expect(db.conn.prepare('SELECT design_theme FROM app_setting').get()?.['design_theme']).toBe('classic');
  } finally { db.close(); }
});
