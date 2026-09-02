/**
 * Takt — Ablage des Tokens auf der Dienstseite (B-2.2, E-018).
 *
 * ## Was auf der Platte liegt
 *
 * **Nur der SHA-256-Abdruck.** Nicht das Token. Wer die Datei liest — ein
 * anderer Benutzer des Rechners (A-04), ein Sicherungs- oder
 * Synchronisierungsagent (A-05), wer den Rechner in die Hand bekommt (A-08) —
 * hält damit einen Abdruck in der Hand und kein Geheimnis.
 *
 * Der Klartext entsteht genau einmal, bei der Erzeugung, wird genau einmal
 * herausgegeben und danach vergessen. Wer ihn verliert, erzeugt ein neues.
 *
 * ## Rechte
 *
 * Verzeichnis `0700`, Datei `0600` — beides ausdrücklich gesetzt, nicht der
 * `umask` überlassen. Unter Windows trägt die ACL die Grenze; `chmod` ist dort
 * weitgehend wirkungslos. Das ist eine benannte Lücke, kein Versehen.
 *
 * ## Schreibweise
 *
 * Temporäre Datei im **selben** Verzeichnis, `fsync`, dann umbenennen. Ein
 * Absturz mitten im Schreiben hinterlässt damit entweder den alten oder den
 * neuen Abdruck, nie einen halben. Ein halber Abdruck wäre ein ausgesperrter
 * Benutzer.
 */

import { constants as fsConstants } from 'node:fs';
import { chmod, mkdir, open, readFile, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

import { DIR_MODE, FILE_MODE, isTooPermissive } from './paths.ts';

/** Was in der Datei steht. Kein Klartext, kein Pfad, kein Benutzername. */
export const tokenRecordSchema = z.object({
  version: z.literal(1),
  algorithm: z.literal('sha256'),
  /** SHA-256 des Tokens, hexadezimal in Kleinbuchstaben. */
  fingerprint: z.string().regex(/^[0-9a-f]{64}$/),
  issuedAt: z.string().min(1),
  lastUsedAt: z.string().min(1).nullable(),
  /** Zählt hoch bei jeder Neuerzeugung. Nur zur Anzeige, nicht zum Vergleich. */
  generation: z.number().int().min(1),
});

export type TokenRecord = z.infer<typeof tokenRecordSchema>;

export type TokenReadResult =
  | { readonly status: 'ok'; readonly record: TokenRecord }
  /** Es ist noch keins eingerichtet. Der Dienst läuft, weist aber ab. */
  | { readonly status: 'absent' }
  /**
   * Die Datei existiert, ist aber nicht lesbar oder nicht plausibel. Es wird
   * **nicht** stillschweigend ein neues Token erzeugt: Das würde ein
   * funktionierendes Add-in ohne Vorwarnung aussperren.
   */
  | { readonly status: 'unreadable' };

export interface PermissionReport {
  readonly checked: boolean;
  readonly dirTooPermissive: boolean;
  readonly fileTooPermissive: boolean;
}

export interface TokenStorePort {
  read(): Promise<TokenReadResult>;
  write(record: TokenRecord): Promise<void>;
  inspectPermissions(): Promise<PermissionReport>;
}

export function createFileTokenStore(filePath: string): TokenStorePort {
  const dir = dirname(filePath);

  async function ensureDir(): Promise<void> {
    await mkdir(dir, { recursive: true, mode: DIR_MODE });
    // `mkdir` maskiert den Modus mit der `umask`. Deshalb noch einmal
    // ausdrücklich — sonst ist das Verzeichnis auf vielen Systemen 0755.
    if (process.platform !== 'win32') {
      await chmod(dir, DIR_MODE);
    }
  }

  return {
    async read(): Promise<TokenReadResult> {
      let raw: string;
      try {
        raw = await readFile(filePath, 'utf8');
      } catch (error) {
        if (isNotFound(error)) {
          return { status: 'absent' };
        }
        return { status: 'unreadable' };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { status: 'unreadable' };
      }

      const result = tokenRecordSchema.safeParse(parsed);
      if (!result.success) {
        // Der Fehlerbericht von zod wird bewusst nicht weitergereicht. Er
        // enthielte den gelesenen Wert, und der ist zwar nur ein Abdruck, aber
        // die Regel „kein Inhalt der Tokendatei verlässt diese Datei" hat
        // keine Ausnahme.
        return { status: 'unreadable' };
      }
      return { status: 'ok', record: result.data };
    },

    async write(record: TokenRecord): Promise<void> {
      await ensureDir();
      const temporary = join(dir, `.addin-token.${randomBytes(6).toString('hex')}.tmp`);
      const payload = `${JSON.stringify(record, null, 2)}\n`;

      // `wx`: Fehler statt Überschreiben. Ein vorhandener Eintrag wird nicht
      // verfolgt — auch keine symbolische Verknüpfung, die woandershin zeigt.
      const handle = await open(temporary, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL, FILE_MODE);
      try {
        await handle.writeFile(payload, 'utf8');
        if (process.platform !== 'win32') {
          await handle.chmod(FILE_MODE);
        }
        await handle.sync();
      } finally {
        await handle.close();
      }

      try {
        await rename(temporary, filePath);
      } catch (error) {
        await unlink(temporary).catch(() => undefined);
        throw error;
      }

      // Das Verzeichnis selbst noch einmal auf die Platte zwingen, damit die
      // Umbenennung einen Stromausfall überlebt. Schlägt das fehl (manche
      // Dateisysteme lassen ein Verzeichnis nicht zum Schreiben öffnen), ist
      // das kein Grund, die Neuerzeugung zurückzunehmen.
      try {
        const dirHandle = await open(dir, fsConstants.O_RDONLY);
        try {
          await dirHandle.sync();
        } finally {
          await dirHandle.close();
        }
      } catch {
        // bewusst still
      }
    },

    async inspectPermissions(): Promise<PermissionReport> {
      if (process.platform === 'win32') {
        // Unter Windows sagt der POSIX-Modus nichts. Hier müsste die ACL
        // geprüft werden; das gehört in die Hülle (T-008b) und ist im Bericht
        // zu T-011 als offener Punkt benannt.
        return { checked: false, dirTooPermissive: false, fileTooPermissive: false };
      }
      try {
        const dirStat = await stat(dir);
        let fileTooPermissive = false;
        try {
          const fileStat = await stat(filePath);
          fileTooPermissive = isTooPermissive(fileStat.mode, FILE_MODE);
        } catch (error) {
          if (!isNotFound(error)) {
            throw error;
          }
        }
        return {
          checked: true,
          dirTooPermissive: isTooPermissive(dirStat.mode, DIR_MODE),
          fileTooPermissive,
        };
      } catch {
        return { checked: false, dirTooPermissive: false, fileTooPermissive: false };
      }
    },
  };
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}
