/** Registers the unbundled GTK/Wayland development window with the desktop. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'linux') process.exit(0);

const desktopDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(desktopDir, '../..');
const dataHome = process.env.XDG_DATA_HOME;
const applications = join(
  dataHome && isAbsolute(dataHome) ? dataHome : join(homedir(), '.local/share'),
  'applications',
);
// With enableGTKAppId disabled, GTK uses the executable name as the app ID.
const destination = join(applications, 'takt-desktop.desktop');
const marker = 'X-SuperTakt-Development=true';
try {
  if (!readFileSync(destination, 'utf8').split('\n').includes(marker)) {
    console.warn(`Linux-Icon: vorhandenen fremden Eintrag nicht überschrieben: ${destination}`);
    process.exit(0);
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

// Desktop Entry string escaping; Exec additionally has its own quoting rules.
const value = (text) => text.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll('\r', '\\r').replaceAll('\t', '\\t');
const argument = (text) => value(`"${text.replace(/[\\"`$]/g, '\\$&').replaceAll('%', '%%')}"`);
const entry = [
  '[Desktop Entry]',
  'Type=Application',
  'Name=SuperTakt (Entwicklung)',
  `Exec=pnpm --dir ${argument(repoDir)} desktop`,
  `Icon=${value(join(desktopDir, 'src-tauri/icons/128x128@2x.png'))}`,
  'StartupWMClass=takt-desktop',
  'Terminal=false',
  'NoDisplay=true',
  marker,
  '',
].join('\n');
mkdirSync(applications, { recursive: true });
writeFileSync(destination, entry);
// KDE otherwise may retain its fallback icon until the next session.
for (const command of ['kbuildsycoca6', 'kbuildsycoca5']) {
  const result = spawnSync(command, ['--noincremental'], { stdio: 'ignore' });
  if (!result.error || result.error.code !== 'ENOENT') break;
}
console.log(`Linux-Entwicklungsicon registriert: ${destination}`);
