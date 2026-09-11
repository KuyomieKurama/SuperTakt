import type { DesignTheme, Density } from '@takt/domain';
import type { ThemePreference } from './theme';
import { THEME_PRESETS, themePreset } from './themePresets';

export interface StartupAppearance {
  readonly theme: ThemePreference;
  readonly designTheme: DesignTheme;
  readonly density: Density;
}

/** Read only the attributes installed by the early bootstrap. */
export function startupAppearance(): StartupAppearance {
  const data = document.documentElement.dataset;
  return {
    theme: data['startupTheme'] === 'light' || data['startupTheme'] === 'dark' ? data['startupTheme'] : 'system',
    designTheme: THEME_PRESETS.find(preset => preset.value === data['designTheme'])?.value ?? 'classic',
    density: data['density'] === 'compact' ? 'compact' : 'comfortable',
  };
}

export function cacheAppearance(value: StartupAppearance): void {
  try {
    const preset = themePreset(value.designTheme);
    localStorage.setItem('supertakt.appearance.v1', JSON.stringify({
      version: 1, theme: value.theme, designTheme: preset.value,
      density: value.density, mode: preset.mode,
    }));
  } catch {
    // The database save still works when web storage is unavailable.
  }
}
