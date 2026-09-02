/**
 * Takt — Ablageort der Anwendungsdaten (E-018, B-7.1, R-13).
 *
 * `%LOCALAPPDATA%\Takt\` unter Windows, `~/.local/share/takt/` sonst.
 *
 * **Ausdrücklich nicht `%APPDATA%`.** Ein Roaming-Profil kopiert dieses
 * Verzeichnis beim Abmelden auf einen Dateiserver. Zwei Schäden gleichzeitig:
 * Die Kundendatenbank verlässt den Rechner (gegen E-001), und unabhängig
 * synchronisierte WAL-Dateien beschädigen SQLite. Für das Token gilt
 * dasselbe — es läge dann auf einem Dateiserver.
 *
 * Die Auflösung ist rein: Umgebung und Plattform kommen als Argument. Damit
 * lässt sich die Windows-Regel auf jedem Rechner prüfen.
 */

import { join } from 'node:path';

export type PathResolution =
  | { readonly ok: true; readonly dir: string }
  | { readonly ok: false; readonly reason: 'localappdata_missing' | 'home_missing' };

export interface PathEnvironment {
  readonly platform: NodeJS.Platform;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly homedir: string | null;
}

/**
 * Verzeichnis für Datenbank, Tokendatei und Vorgabe-Exportordner.
 *
 * Kein Rückfallweg auf `%APPDATA%`. Fehlt `%LOCALAPPDATA%`, ist das ein Fehler
 * und keine Gelegenheit, in das Roaming-Profil auszuweichen — ein stiller
 * Rückfall wäre genau der Schaden aus R-13.
 */
export function resolveAppDataDir(environment: PathEnvironment): PathResolution {
  if (environment.platform === 'win32') {
    const local = environment.env['LOCALAPPDATA'];
    if (local === undefined || local.trim() === '') {
      return { ok: false, reason: 'localappdata_missing' };
    }
    return { ok: true, dir: join(local, 'Takt') };
  }

  const xdg = environment.env['XDG_DATA_HOME'];
  if (xdg !== undefined && xdg.trim() !== '') {
    return { ok: true, dir: join(xdg, 'takt') };
  }

  if (environment.homedir === null || environment.homedir.trim() === '') {
    return { ok: false, reason: 'home_missing' };
  }
  return { ok: true, dir: join(environment.homedir, '.local', 'share', 'takt') };
}

/**
 * Die Tokendatei liegt **neben** der Datenbank, nicht darin (architektur.md 6.2).
 *
 * Die Datenbankdatei wird kopiert — für eine Sicherung, zur Fehlersuche, in
 * einen Ordner, der mit einem Cloud-Dienst abgeglichen wird. Ein Token darin
 * wanderte mit. Getrennt abgelegt bleibt es zurück.
 *
 * Sie liegt auch nicht in derselben Datei wie Port und Dienstzustand: Die wird
 * von der Oberfläche und vom Benutzer gelesen, das Token nicht (B-1.5 Punkt 2).
 */
export function tokenFilePath(appDataDir: string): string {
  return join(appDataDir, 'addin-token.json');
}

/**
 * Die Datenbankdatei liegt im selben Verzeichnis wie das Token — aber in einer
 * **eigenen** Datei (architektur.md 6.2).
 *
 * Die Datenbank wird kopiert: für eine Sicherung, zur Fehlersuche, in einen
 * Ordner, der mit einem Cloud-Dienst abgeglichen wird. Ein Token darin
 * wanderte mit. Getrennt abgelegt bleibt es zurück.
 */
export function databaseFilePath(appDataDir: string): string {
  return join(appDataDir, 'takt.db');
}

/**
 * Schlüssel und Zertifikat des Aufgabenbereichs (E-046, E-018).
 *
 * Sie liegen neben Token und Datenbank, mit denselben engen Rechten. Der
 * private Schlüssel ist ein Geheimnis wie das Token: Wer ihn hat, kann sich
 * gegenüber Outlook als der Aufgabenbereich ausgeben.
 */
export function taskpaneKeyPath(appDataDir: string): string {
  return join(appDataDir, 'taskpane-key.pem');
}

export function taskpaneCertPath(appDataDir: string): string {
  return join(appDataDir, 'taskpane-cert.pem');
}

/** Rechte, mit denen Verzeichnis und Datei angelegt werden (B-2.2 Punkt 3). */
export const DIR_MODE = 0o700;
export const FILE_MODE = 0o600;

/**
 * Prüft, ob ein Modus weiter ist als erlaubt.
 *
 * Unter Windows liefert `fs.stat` keinen brauchbaren POSIX-Modus; dort ist das
 * Ergebnis dieser Prüfung bedeutungslos und die ACL trägt die Grenze. Das ist
 * kein Versehen, sondern eine benannte Lücke — siehe Bericht zu T-011.
 */
export function isTooPermissive(mode: number, expected: number): boolean {
  return (mode & 0o777 & ~expected) !== 0;
}
