import type { DesignTheme, Density, MotionIntensity } from '@takt/domain';
import type { ThemePreference } from './theme';
import { THEME_PRESETS, themePreset } from './themePresets';
import type { Language } from '../../lib/language';

const CACHE_KEY = 'supertakt.appearance.v1';

export interface StartupAppearance {
  readonly theme: ThemePreference;
  readonly designTheme: DesignTheme;
  readonly density: Density;
  readonly motionIntensity: MotionIntensity;
}

/** Read only the attributes installed by the early bootstrap. */
export function startupAppearance(): StartupAppearance {
  const data = document.documentElement.dataset;
  return {
    theme: data['startupTheme'] === 'light' || data['startupTheme'] === 'dark' ? data['startupTheme'] : 'system',
    designTheme: THEME_PRESETS.find(preset => preset.value === data['designTheme'])?.value ?? 'classic',
    density: data['density'] === 'compact' ? 'compact' : 'comfortable',
    motionIntensity: data['motionIntensity'] === 'reduced' || data['motionIntensity'] === 'expressive' ? data['motionIntensity'] : 'subtle',
  };
}

export function cacheAppearance(value: StartupAppearance & { readonly uiLanguage: Language }): void {
  try {
    const preset = themePreset(value.designTheme);
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: 1, theme: value.theme, designTheme: preset.value,
      density: value.density, motionIntensity: value.motionIntensity, mode: preset.mode,
      // The early bootstrap ignores this field; `startupLanguage` reads it.
      language: value.uiLanguage,
    }));
  } catch {
    // Die Datenbank speichert auch bei nicht verfügbarem Browserspeicher.
  }
}

/**
 * The language last stored, so start-up screens before the service answers
 * already speak it (welle-18-fluss.md 2.2 point 7). Only a cache: the value in
 * the Bestand replaces it once the settings are loaded. Without a cache: German.
 */
export function startupLanguage(): Language {
  try {
    const cached: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (typeof cached === 'object' && cached !== null && 'language' in cached && cached.language === 'en') {
      return 'en';
    }
  } catch {
    // Missing, unavailable or corrupt storage falls back to German.
  }
  return 'de';
}
