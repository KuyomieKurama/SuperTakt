import type { AddinDefaults } from './store.ts';

export function resolveTheme(preference: AddinDefaults['theme'], outlookBackground: string | undefined, systemDark: boolean): 'light' | 'dark' {
  if (preference !== 'auto') return preference;
  const color = outlookBackground?.replace('#', '');
  if (color && /^[0-9a-f]{6}$/i.test(color)) {
    const channels = [0, 2, 4].map(offset => parseInt(color.slice(offset, offset + 2), 16));
    return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722 < 128 ? 'dark' : 'light';
  }
  return systemDark ? 'dark' : 'light';
}
