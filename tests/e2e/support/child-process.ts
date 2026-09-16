import { execFile, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Auf Unix muss der Aufrufer mit detached: true eine eigene Prozessgruppe starten.
export async function killChildTree(child: ChildProcess): Promise<void> {
  if (process.platform === 'win32' && child.pid !== undefined) {
    try {
      await execFileAsync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    } catch {
      // Bereits beendet, oder nie wirklich gestartet — kein zweiter Versuch nötig.
    }
    return;
  }
  if (child.pid !== undefined) {
    try {
      process.kill(-child.pid, 'SIGTERM');
      return;
    } catch {
      // Gruppe bereits weg, oder Plattform ohne Prozeßgruppen-Unterstützung —
      // der Einzelprozeß-Versuch darunter bleibt der Rückweg.
    }
  }
  child.kill('SIGTERM');
}
