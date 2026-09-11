import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const bootstrap = readFileSync(new URL('../../public/startup-appearance.js', import.meta.url), 'utf8');
function restore(value: unknown, blocked = false) {
  const dataset: Record<string, string> = {};
  runInNewContext(bootstrap, {
    localStorage: { getItem: () => { if (blocked) throw new Error('blocked'); return typeof value === 'string' ? value : JSON.stringify(value); } },
    document: { documentElement: { dataset } },
  });
  return dataset;
}
const appearance = { version: 1, theme: 'system', designTheme: 'catppuccin-macchiato', mode: 'dark', density: 'compact' };
describe('appearance before the application loads', () => {
  it('restores the fixed dark palette even when Windows uses light mode', () => {
    expect(restore(appearance)).toEqual({ startupTheme: 'system', designTheme: 'catppuccin-macchiato', theme: 'dark', density: 'compact' });
  });
  it('leaves an automatic palette following the OS', () => {
    expect(restore({ ...appearance, designTheme: 'classic', mode: 'auto' })).not.toHaveProperty('theme');
  });
  it('restores an explicit preference for an automatic palette', () => {
    expect(restore({ ...appearance, designTheme: 'classic', mode: 'auto', theme: 'light' }).theme).toBe('light');
  });
  it.each([null, '{broken', { ...appearance, version: 2 }, { ...appearance, theme: 'unknown' }, { ...appearance, designTheme: '<script>' }])('ignores missing or invalid cache %j', value => {
    expect(restore(value)).toEqual({});
  });
  it('survives disabled web storage', () => expect(restore(appearance, true)).toEqual({}));
});
