import { DESIGN_THEMES } from '@takt/domain';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { openDatabase } from '../src/index.ts';
import { createTodo, NOW, openTestDatabase } from './support/setup.ts';

it('A-21.4: speichert Gestaltung und Dichte unabhängig vom Farbmodus über einen Neustart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'supertakt-appearance-'));
  const options = { location: join(directory, 'data.sqlite'), now: () => NOW };
  let database = openDatabase(options);
  try {
    await database.migrations.migrateToLatest();
    await database.transactions.inTransaction(async (unit) => {
      expect(await unit.settings.load()).toMatchObject({ designTheme: 'classic', density: 'comfortable', promptOnTimerStop: true });
      expect((await unit.settings.update({ theme: 'dark', designTheme: 'clear', density: 'compact', promptOnTimerStop: false, now: NOW })).ok).toBe(true);
      expect((await unit.settings.update({ theme: 'light', now: NOW })).ok).toBe(true);
    });
    database.close();
    database = openDatabase(options);
    await database.migrations.migrateToLatest();
    await database.transactions.inTransaction(async (unit) => {
      expect(await unit.settings.load()).toMatchObject({ theme: 'light', designTheme: 'clear', density: 'compact', promptOnTimerStop: false });
    });
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

it('A-21.4: bestehende Daten erhalten Klar, ihren Farbmodus und ihre Todos', async () => {
  const database = openTestDatabase();
  try {
    const todo = await createTodo(database, { title: 'Bleibt erhalten' });
    database.conn.exec(readFileSync(new URL('../migrations/0016_appearance_settings.down.sql', import.meta.url), 'utf8'));
    database.conn.exec("UPDATE app_setting SET theme = 'dark' WHERE id = 1");
    database.conn.exec(readFileSync(new URL('../migrations/0016_appearance_settings.up.sql', import.meta.url), 'utf8'));
    expect(await database.unit.settings.load()).toMatchObject({ theme: 'dark', designTheme: 'clear', density: 'comfortable', promptOnTimerStop: true });
    expect((await database.unit.todos.search({})).items.map((item) => item.id)).toContain(todo.id);
    expect(() => database.conn.exec("UPDATE app_setting SET design_theme = 'unknown'")).toThrow();
    expect(() => database.conn.exec("UPDATE app_setting SET density = 'unknown'")).toThrow();
  } finally {
    database.close();
  }
});

it.each(['classic', 'clear'] as const)('Theme-Standardmigration erhält die gespeicherte Auswahl %s und ändert nur den Vorgabewert', async (designTheme) => {
  const database = openTestDatabase();
  try {
    database.conn.exec(readFileSync(new URL('../migrations/0019_classic_theme_default.down.sql', import.meta.url), 'utf8'));
    await database.unit.settings.update({ designTheme, theme: 'dark', density: 'compact', now: NOW });
    database.conn.exec(readFileSync(new URL('../migrations/0019_classic_theme_default.up.sql', import.meta.url), 'utf8'));
    expect(await database.unit.settings.load()).toMatchObject({ designTheme, theme: 'dark', density: 'compact' });
    const column = database.conn.prepare('PRAGMA table_info(app_setting)').all().find(row => row['name'] === 'design_theme');
    expect(column?.['dflt_value']).toBe("'classic'");
    expect(() => database.conn.exec("UPDATE app_setting SET design_theme = 'unknown'")).toThrow();
  } finally {
    database.close();
  }
});


it.each(DESIGN_THEMES)('speichert das Farbtheme %s ohne den Farbmodus oder die Dichte zu ändern', async (designTheme) => {
  const database = openTestDatabase();
  try {
    const result = await database.unit.settings.update({ designTheme, now: NOW });
    expect(result.ok).toBe(true);
    expect(await database.unit.settings.load()).toMatchObject({ designTheme, theme: 'system', density: 'comfortable' });
  } finally {
    database.close();
  }
});
