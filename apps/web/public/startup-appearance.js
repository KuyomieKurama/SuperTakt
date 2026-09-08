// Small, synchronous bootstrap: runs before styles and the application bundle.
// This cache contains appearance only; the service remains authoritative.
(() => {
  try {
    const value = JSON.parse(localStorage.getItem('supertakt.appearance.v1'));
    if (!value || value.version !== 1 ||
        !['light', 'dark', 'system'].includes(value.theme) ||
        !['auto', 'light', 'dark'].includes(value.mode) ||
        !['comfortable', 'compact'].includes(value.density) ||
        typeof value.designTheme !== 'string' || !/^[a-z-]{1,40}$/.test(value.designTheme)) return;
    const root = document.documentElement;
    root.dataset.startupTheme = value.theme;
    root.dataset.designTheme = value.designTheme;
    root.dataset.density = value.density;
    const mode = value.mode === 'auto' ? value.theme : value.mode;
    if (mode !== 'system') root.dataset.theme = mode;
  } catch {
    // Missing, unavailable or corrupt storage must never block startup.
  }
})();
