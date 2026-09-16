import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('keeps the Tauri resource source fresh so startup cannot restore an old task pane', () => {
  const root = mkdtempSync(join(tmpdir(), 'takt-taskpane-stage-'));
  try {
    const scripts = join(root, 'apps/desktop/scripts');
    mkdirSync(scripts, { recursive: true });
    for (const name of ['build-taskpane.mjs', 'rust-target.mjs']) {
      cpSync(fileURLToPath(new URL(`../scripts/${name}`, import.meta.url)), join(scripts, name));
    }
    const dist = join(root, 'apps/outlook-addin/dist');
    const resources = join(root, 'apps/desktop/src-tauri/taskpane');
    const target = join(root, 'cargo-target/debug/taskpane');
    for (const dir of [dist, resources, target]) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dist, 'index.html'), '<script src="./new.js"></script>');
    writeFileSync(join(dist, 'new.js'), 'new view');
    for (const dir of [resources, target]) {
      writeFileSync(join(dir, 'index.html'), 'old view');
      writeFileSync(join(dir, 'old.js'), 'old view');
    }
    execFileSync(process.execPath, [join(scripts, 'build-taskpane.mjs'), '--dev', '--no-build'], {
      cwd: root, env: { ...process.env, CARGO_TARGET_DIR: join(root, 'cargo-target') },
    });
    // Reproduce Tauri's resource copy after the pre-development script.
    cpSync(resources, target, { recursive: true });
    for (const dir of [resources, target]) {
      expect(readdirSync(dir).sort()).toEqual(['index.html', 'new.js']);
      expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('./new.js');
      expect(readFileSync(join(dir, 'new.js'), 'utf8')).toBe('new view');
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
