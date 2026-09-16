// Generiert durch scripts/sync-themes.mjs aus styles/themes/*.css. Nicht bearbeiten.
// Small, synchronous bootstrap: runs before styles and the application bundle.
// This cache contains appearance only; the service remains authoritative.
(() => {
  const THEME_MODES = {"classic":"auto","arc":"dark","cybr":"dark","dark-base":"dark","dracula":"dark","everfrost":"auto","glass":"auto","lines":"auto","liquid-glass":"auto","nord-polar-night":"dark","nord-snow-storm":"light","plainspace":"auto","rainbow":"auto","zen":"auto","velvet":"dark","catppuccin-latte":"light","catppuccin-frappe":"dark","catppuccin-macchiato":"dark","catppuccin-mocha":"dark"};
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
    const known = typeof value.designTheme === 'string' && Object.hasOwn(THEME_MODES, value.designTheme);
    const root = document.documentElement;
    root.dataset.startupTheme = value.theme;
    root.dataset.designTheme = known ? value.designTheme : 'classic';
    root.dataset.density = value.density;
    // Die aktuelle CSS-Datei bestimmt den Modus, auch bei einem alten Cache.
    const cachedMode = known ? THEME_MODES[value.designTheme] : 'auto';
    const mode = cachedMode === 'auto' ? value.theme : cachedMode;
    if (mode !== 'system') root.dataset.theme = mode;
  } catch {
    // Missing, unavailable or corrupt storage must never block startup.
  }
})();
