import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { afterEach, expect, it } from 'vitest';

const repo = new URL('../../../', import.meta.url);
const temporary: string[] = [];
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'supertakt-theme-files-'));
  temporary.push(root);
  for (const directory of ['scripts', 'apps/web/src/styles', 'apps/web/src/features/settings', 'apps/web/public', 'packages/domain/src', 'apps/local-api/openapi']) mkdirSync(join(root, directory), { recursive: true });
  for (const file of ['apps/local-api/openapi/takt-local-api.yaml', 'scripts/sync-themes.mjs', 'scripts/startup-appearance.template.js', 'apps/web/src/styles/theme-base.css', 'apps/web/src/styles/themes']) cpSync(new URL(file, repo), join(root, file), { recursive: true });
  return root;
}
const sync = (root: string, ...args: string[]) => execFileSync(process.execPath, [join(root, 'scripts/sync-themes.mjs'), ...args]);
const read = (root: string, file: string) => readFileSync(join(root, file), 'utf8');

it('eine neue CSS-Datei erreicht Auswahl, Dienstvertrag, CSS und frühen Start ohne weitere Registrierung', () => {
  const root = fixture();
  const css = read(root, 'apps/web/src/styles/themes/arc.css').replaceAll('arc', 'test-ocean').replace('"Arc"', '"Test Ocean"');
  writeFileSync(join(root, 'apps/web/src/styles/themes/test-ocean.css'), css);
  sync(root);
  expect(read(root, 'apps/local-api/openapi/takt-local-api.yaml')).toContain('test-ocean');
  expect(read(root, 'packages/domain/src/design-themes.generated.ts')).toContain('"test-ocean"');
  expect(read(root, 'apps/web/src/features/settings/themeCatalog.generated.ts')).toContain('"Test Ocean"');
  expect(read(root, 'apps/web/src/styles/theme-palettes.css')).toContain("@import './themes/test-ocean.css'");
  const dataset: Record<string, string> = {};
  runInNewContext(read(root, 'apps/web/public/startup-appearance.js'), {
    localStorage: { getItem: () => JSON.stringify({ version: 1, designTheme: 'test-ocean', theme: 'light', mode: 'auto', density: 'compact' }) },
    document: { documentElement: { dataset } },
  });
  expect(dataset).toMatchObject({ designTheme: 'test-ocean', theme: 'dark', startupTheme: 'light', density: 'compact' });
  sync(root, '--check');
  rmSync(join(root, 'apps/web/src/styles/themes/test-ocean.css'));
  expect(spawnSync(process.execPath, [join(root, 'scripts/sync-themes.mjs'), '--check']).status).toBe(1);
  sync(root);
  expect(read(root, 'apps/web/src/features/settings/themeCatalog.generated.ts')).not.toContain('test-ocean');
});

it.each(['missing-metadata', 'wrong-selector', 'missing-color', 'reserved-name'])('weist ein unvollständiges Theme zurück: %s', problem => {
  const root = fixture();
  let css = read(root, 'apps/web/src/styles/themes/arc.css');
  if (problem === 'missing-metadata') css = css.slice(css.indexOf('\n') + 1);
  if (problem === 'wrong-selector') css = css.replaceAll('data-design-theme="arc"', 'data-design-theme="other"');
  if (problem === 'missing-color') css = css.replaceAll('--preset-accent:', '--removed-accent:');
  writeFileSync(join(root, `apps/web/src/styles/themes/${problem === 'reserved-name' ? 'clear' : 'arc'}.css`), css);
  expect(spawnSync(process.execPath, [join(root, 'scripts/sync-themes.mjs')]).status).not.toBe(0);
});
