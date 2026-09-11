// Small, synchronous bootstrap: runs before styles and the application bundle.
// This cache contains appearance only; the service remains authoritative.
(() => {
  // The design themes are spelled out because this file runs before the first
  // paint and without a bundler (A-21.4, T-060): it cannot import THEME_PRESETS.
  //
  // Leading source: THEME_PRESETS in apps/web/src/features/settings/themePresets.ts
  // (itself derived from DESIGN_THEMES in packages/domain/src/settings.ts).
  // The copy is measured, not trusted: apps/web/test/public/startupAppearance.test.ts
  // runs this bootstrap once per preset and once per domain value and turns red
  // when the two lists drift apart. A theme added over there without being added
  // here fails that run.
  //
  // `clear` is deliberately absent. It is a retired choice that still sits in
  // saved settings, and it must be shown in the classic look; it is caught by
  // the fallback below, like every other unknown value.
  const DESIGN_THEMES = [
    'classic', 'arc', 'cybr', 'dark-base', 'dracula', 'everfrost', 'glass',
    'lines', 'liquid-glass', 'nord-polar-night', 'nord-snow-storm',
    'plainspace', 'rainbow', 'zen', 'velvet', 'catppuccin-latte',
    'catppuccin-frappe', 'catppuccin-macchiato', 'catppuccin-mocha',
  ];
  try {
    const value = JSON.parse(localStorage.getItem('supertakt.appearance.v1'));
    if (!value || value.version !== 1 ||
        !['light', 'dark', 'system'].includes(value.theme) ||
        !['auto', 'light', 'dark'].includes(value.mode) ||
        !['comfortable', 'compact'].includes(value.density)) return;
    // An unknown design theme is mapped, not dropped -- themePreset() does the
    // same once the bundle runs, so the bootstrap paints what the application
    // is about to paint instead of flashing a second look. Dropping the whole
    // cache here would also throw away a valid colour mode and density.
    const known = DESIGN_THEMES.includes(value.designTheme);
    const root = document.documentElement;
    root.dataset.startupTheme = value.theme;
    root.dataset.designTheme = known ? value.designTheme : 'classic';
    root.dataset.density = value.density;
    // The colour mode is stored as the mode of the cached design theme, so it
    // falls back together with it: the classic preset is mode `auto`.
    const cachedMode = known ? value.mode : 'auto';
    const mode = cachedMode === 'auto' ? value.theme : cachedMode;
    if (mode !== 'system') root.dataset.theme = mode;
  } catch {
    // Missing, unavailable or corrupt storage must never block startup.
  }
})();
