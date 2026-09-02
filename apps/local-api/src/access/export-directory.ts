/**
 * Takt — was für ein Ordner der Exportordner ist (T-039, B-5.2, B-5.3 Punkt 3).
 *
 * ===========================================================================
 * Diese Datei ist der Beleg, nicht die Warnung — und nicht die Grenze
 * ===========================================================================
 *
 * Drei Stellen sprechen über denselben Ordner, und sie tun verschiedene Dinge:
 *
 *  1. `apps/web/src/lib/exportDirectoryAdvice.ts` **warnt**. Sie liest den Pfad
 *     als Zeichenkette und sagt es auch so: „liegt in", nicht „ist". Sie
 *     erwischt den häufigsten Fall, bevor gespeichert wird, und erklärt ihn.
 *  2. `checkExportDirectory` in `packages/storage` **entscheidet**. Vorhanden,
 *     Ordner, beschreibbar. Was daran scheitert, wird nicht gespeichert.
 *  3. Diese Datei **belegt**. Sie fragt das Betriebssystem und nennt nur, was
 *     daraus folgt.
 *
 * Die Reihenfolge ist keine Rangfolge. Die Heuristik der Oberfläche bleibt
 * stehen, auch wo diese Datei etwas Sichereres weiß: Sie greift früher, ohne
 * Anfrage, während der Benutzer tippt. Diese Datei greift genauer, aber erst
 * nachdem der Dienst gefragt wurde.
 *
 * ===========================================================================
 * Warum das hier liegt und nicht bei der Prüfung
 * ===========================================================================
 *
 * Weil es eine Auskunft über den **Rechner** ist und nicht über eine
 * Speicherung: Umgebungsvariablen des angemeldeten Benutzers, Art des
 * Dateisystems, Ort der Windows-Installation. Das ist dieselbe Sorte Wissen wie
 * in `paths.ts` (wo liegt das Anwendungsdatenverzeichnis) und
 * `token-store.ts` (welche Rechte hat diese Datei) — und deshalb liegt es
 * daneben.
 *
 * ===========================================================================
 * Was hier bewusst **nicht** steht
 * ===========================================================================
 *
 * Ein **zugeordnetes Netzlaufwerk** unter Windows (`Z:`). Ob `Z:` auf eine
 * Freigabe zeigt, steht weder im Pfad noch in einer Auskunft, die Node bekommt;
 * `statfs` ist unter Windows vorhanden, sagt darüber aber nichts. Die Antwort
 * hat `GetDriveTypeW`, und die erreicht die Tauri-Hülle (E-004), nicht der
 * Sidecar. Solange das fehlt, sagt eine leere Liste dort **nichts** — sie ist
 * keine Entwarnung.
 *
 * Ebenfalls nicht hier: eine Sperre. Was abgewiesen wird, entscheidet die
 * Prüfung, nicht die Einordnung. Ein Merkmal ist ein Befund und kein Urteil.
 */

import { statfs } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import type { ExportDirectoryTrait } from '@takt/domain';
import { DIRECTORY_CHECK_BUDGET_MS, within, type DirectoryInsightPort } from '@takt/storage';

/**
 * Magische Zahlen von Netzdateisystemen, wie `statfs` sie unter Linux und macOS
 * zurückgibt.
 *
 * Die Liste ist bewusst kurz. Aufgenommen ist nur, was ohne Zweifel über ein
 * Netz geht; FUSE steht **nicht** darin, obwohl `sshfs` und `rclone` es
 * benutzen — es trägt genauso gut einen lokalen Archivbetrachter, und ein
 * falsches `network` ist schlimmer als ein fehlendes: Es ist eine Warnung, die
 * der Benutzer beim zweiten Mal wegklickt.
 */
const NETWORK_FILESYSTEMS: ReadonlySet<number> = new Set([
  0xff534d42, // CIFS/SMB
  0xfe534d42, // SMB2
  0x517b, // SMB, ältere Kennung
  0x6969, // NFS
  0x564c, // NCP (NetWare)
  0x5346414f, // AFS
  0x73757245, // CODA
]);

/**
 * Liegt `child` in `parent` oder ist es `parent` selbst?
 *
 * Der Vergleich läuft ohne Rücksicht auf Groß- und Kleinschreibung, wo das
 * Dateisystem sie ebenfalls nicht unterscheidet. Sonst ginge `C:\Windows` gegen
 * ein eingetipptes `c:\windows` verloren — und zwar still.
 */
function isInside(parent: string, child: string): boolean {
  if (parent.trim() === '') return false;
  const outer = normalize(resolve(parent));
  const inner = normalize(child);
  return inner === outer || inner.startsWith(outer.endsWith(sep) ? outer : outer + sep);
}

const normalize = (path: string): string =>
  process.platform === 'win32' ? path.toLowerCase() : path;

/**
 * Systemverzeichnisse, wie das Betriebssystem selbst sie benennt.
 *
 * Unter Windows aus der Umgebung und nicht als `C:\Windows` fest verdrahtet:
 * Es gibt Rechner, auf denen Windows nicht auf `C:` liegt, und dort wäre eine
 * feste Liste stillschweigend wirkungslos — der schlechteste Zustand für eine
 * Prüfung, die niemand mehr nachrechnet.
 */
function systemDirectories(): readonly string[] {
  if (process.platform !== 'win32') {
    return ['/bin', '/sbin', '/usr', '/etc', '/boot', '/proc', '/sys', '/dev', '/lib', '/lib64', '/var', '/run'];
  }
  const named = [
    'SystemRoot',
    'windir',
    'ProgramFiles',
    'ProgramFiles(x86)',
    'ProgramW6432',
    'ProgramData',
    'CommonProgramFiles',
  ];
  return named.map((name) => process.env[name] ?? '').filter((value) => value.trim() !== '');
}

/**
 * Ablageordner von Synchronisierungsdiensten, wie deren Client sie meldet.
 *
 * Der Weg über die Umgebung ist der Grund, warum das hier steht und nicht in
 * der Oberfläche: `%OneDrive%` zeigt auf den **tatsächlichen** Ordner, auch
 * wenn der Benutzer ihn umbenannt oder auf ein anderes Laufwerk gelegt hat. Ein
 * Namensvergleich fände ihn dann nicht mehr — und ein Ordner, der nur
 * „OneDrive" heißt, ohne einer zu sein, wird hier umgekehrt nicht zu einem.
 *
 * Ist der Client nicht installiert, steht hier nichts. Das heißt nicht, dass
 * nichts synchronisiert wird; genau deshalb bleibt die Heuristik der Oberfläche
 * daneben stehen.
 */
function syncDirectories(): readonly string[] {
  const wanted = /^(OneDrive|Dropbox|iCloudDrive|Nextcloud)/i;
  return Object.entries(process.env)
    .filter(([name, value]) => wanted.test(name) && (value ?? '').trim() !== '')
    .map(([, value]) => value as string);
}

/**
 * Der Adapter zum `DirectoryInsightPort`.
 *
 * Ohne Zustand und ohne Aufbau: Jede Anfrage liest die Umgebung neu. Ein
 * zwischengespeicherter `%OneDrive%`-Pfad wäre falsch, sobald der Benutzer den
 * Client einrichtet, während Takt läuft — und dann falsch in die beruhigende
 * Richtung.
 */
export function createDirectoryInsightPort(): DirectoryInsightPort {
  return {
    async describeExportDirectory(path, options): Promise<readonly ExportDirectoryTrait[]> {
      if (path === null || path.trim() === '') return [];

      const original = path.trim();
      const resolved = resolve(original);
      const traits = new Set<ExportDirectoryTrait>();

      // UNC ist aus der Form ableitbar und damit sicher — aber nur dort, wo die
      // Form etwas bedeutet. Unter POSIX ist `\\a\b` ein Dateiname mit
      // Rückstrichen und `//srv/share` ein Pfad wie jeder andere.
      if (process.platform === 'win32' && /^[\\/]{2}[^\\/]/.test(original)) {
        traits.add('unc');
        traits.add('network');
      }

      if (systemDirectories().some((entry) => isInside(entry, resolved))) {
        traits.add('system_dir');
      }
      if (syncDirectories().some((entry) => isInside(entry, resolved))) {
        traits.add('sync_folder');
      }

      if (options.mayAskFileSystem && !traits.has('network')) {
        const seen = await within(statfs(resolved), DIRECTORY_CHECK_BUDGET_MS);
        // Kein Treffer heißt „nicht belegt" und nicht „lokal". Unter Windows
        // sagt `statfs` über ein zugeordnetes Laufwerk nichts — siehe den Kopf.
        if (seen.kind === 'value' && NETWORK_FILESYSTEMS.has(Number(seen.value.type))) {
          traits.add('network');
        }
      }

      return [...traits];
    },
  };
}
