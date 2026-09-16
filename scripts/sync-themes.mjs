/** CSS-Dateien sind die Quelle; generierte Listen werden niemals von Hand gepflegt. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checking = process.argv.includes('--check');
const read = (name) => readFileSync(join(root, name), 'utf8');
const folder = 'apps/web/src/styles/themes';
const themes = readdirSync(join(root, folder)).filter(name => name.endsWith('.css')).sort().map(name => {
  const id = name.slice(0, -4);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || id.length > 64 || id === 'clear') {
    throw new Error(`Ungültiger oder reservierter Theme-Name: ${name}`);
  }
  const css = read(`${folder}/${name}`);
  const match = css.match(/^\/\*\s*@theme\s+(\{[^\n]*\})\s*\*\//);
  if (!match) throw new Error(`${name}: Kopfkommentar /* @theme { ... } */ fehlt.`);
  const meta = JSON.parse(match[1]);
  if (!meta || typeof meta.label !== 'string' || !meta.label.trim() || typeof meta.hint !== 'string' ||
      !['auto', 'light', 'dark'].includes(meta.mode) || !Number.isFinite(meta.order ?? 100)) {
    throw new Error(`${name}: label, hint, mode oder order ist ungültig.`);
  }
  const otherIds = [...css.matchAll(/data-design-theme\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
  if (otherIds.some(value => value !== id)) throw new Error(`${name}: Selektor verweist auf ein anderes Theme.`);
  if (id !== 'classic') {
    if (!otherIds.includes(id)) throw new Error(`${name}: Selektor für data-design-theme="${id}" fehlt.`);
    for (const token of ['canvas', 'surface', 'ink', 'muted', 'accent', 'link', 'on', 'accent-hover', 'accent-active']) {
      if (!css.includes(`--preset-${token}:`)) throw new Error(`${name}: --preset-${token} fehlt.`);
    }
  }
  return { value: id, label: meta.label, mode: meta.mode, hint: meta.hint, order: meta.order ?? 100, css };
});
if (!themes.some(t => t.value === 'classic' && t.mode === 'auto')) throw new Error('classic.css mit mode auto ist erforderlich.');
themes.sort((a, b) => (a.value === 'classic' ? -1 : b.value === 'classic' ? 1 : a.order - b.order || a.value.localeCompare(b.value, 'en')));
const ids = themes.map(t => t.value);
const banner = '// Generiert durch scripts/sync-themes.mjs aus styles/themes/*.css. Nicht bearbeiten.\n';
const outputs = new Map([
  ['packages/domain/src/design-themes.generated.ts', banner + `export const DESIGN_THEMES = ${JSON.stringify([...ids, 'clear'], null, 2)} as const;\n`],
  ['apps/web/src/features/settings/themeCatalog.generated.ts', banner + 'import type { ThemePreset } from "./themePresets";\n\n' + `export const THEME_PRESETS = ${JSON.stringify(themes.map(({value,label,mode,hint}) => ({value,label,mode,hint})), null, 2)} as const satisfies readonly ThemePreset[];\n`],
  ['apps/web/src/styles/theme-palettes.css', '/* Generiert durch scripts/sync-themes.mjs. Nicht bearbeiten. */\n' + "@import './theme-base.css';\n" + themes.map(t => `@import './themes/${t.value}.css';`).join('\n') + '\n'],
  ['apps/web/public/startup-appearance.js', banner + read('scripts/startup-appearance.template.js').replace('/* THEME_MODES */ {}', JSON.stringify(Object.fromEntries(themes.map(t => [t.value, t.mode]))))],
]);
// Die öffentliche Beschreibung erhält dieselbe Auswahl wie die Validierung.
const specPath = 'apps/local-api/openapi/takt-local-api.yaml';
const spec = read(specPath);
const themeFields = /designTheme: \{ type: string, enum: \[[^\]]*\] \}/g;
if ([...spec.matchAll(themeFields)].length !== 2) throw new Error('Die beiden Theme-Felder der OpenAPI-Beschreibung sind nicht auflösbar.');
outputs.set(specPath, spec.replace(themeFields, `designTheme: { type: string, enum: [${[...ids, 'clear'].join(', ')}] }`));
let stale = false;
for (const [name, content] of outputs) {
  let current;
  try { current = read(name); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (current === content) continue;
  if (checking) { console.error(`Theme-Abbild veraltet: ${name}`); stale = true; }
  else writeFileSync(join(root, name), content);
}
if (stale) process.exitCode = 1;
