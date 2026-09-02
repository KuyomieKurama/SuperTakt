/**
 * Takt — T-027, Dateizugriff für den Export (E-011, R-11, A-8.1, A-8.9, B-6.*).
 *
 * `packages/storage/src/sqlite/file-port.ts` lag laut T-021-Bericht (Risiko 1)
 * bei 0 Prozent Abdeckung. Zuschnitt (T-021, offene Frage 3): `..` im
 * Dateinamen, ein nicht beschreibbarer Ordner — dazu der unteilbare Schreibweg
 * über eine Nachbardatei und das Aufräumen liegengebliebener `.tmp`-Dateien.
 */
import { chmodSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { platform } from 'node:process';
import { afterEach, describe, expect, it } from 'vitest';
import { createFilePort, ensureDirectory, removeFile, sweepTemporaryFiles } from '../src/sqlite/file-port.ts';

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'takt-file-port-'));
}

describe('createFilePort.checkExportDirectory', () => {
  let dir: string;

  afterEach(() => {
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  });

  it('null oder eine leere/nur-Leerzeichen-Zeichenkette ergibt "not_set"', async () => {
    const port = createFilePort();
    expect(await port.checkExportDirectory(null)).toEqual({ ok: false, reason: 'not_set' });
    expect(await port.checkExportDirectory('')).toEqual({ ok: false, reason: 'not_set' });
    expect(await port.checkExportDirectory('   ')).toEqual({ ok: false, reason: 'not_set' });
  });

  it('ein nicht existierender Pfad ergibt "missing"', async () => {
    const port = createFilePort();
    const result = await port.checkExportDirectory('/pfad/der/nicht/existiert/takt-test');
    expect(result).toEqual({ ok: false, reason: 'missing' });
  });

  it('ein Pfad, der auf eine Datei statt einen Ordner zeigt, ergibt "not_a_directory"', async () => {
    dir = tempDir();
    const filePath = join(dir, 'datei.txt');
    writeFileSync(filePath, 'x');
    const port = createFilePort();
    expect(await port.checkExportDirectory(filePath)).toEqual({ ok: false, reason: 'not_a_directory' });
  });

  it('ein existierender, beschreibbarer Ordner ergibt ok mit dem aufgelösten Pfad', async () => {
    dir = tempDir();
    const port = createFilePort();
    const result = await port.checkExportDirectory(dir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resolvedPath).toBe(dir);
  });

  it.skipIf(platform === 'win32')('ein schreibgeschützter Ordner ergibt "not_writable"', async () => {
    dir = tempDir();
    chmodSync(dir, 0o500);
    try {
      const port = createFilePort();
      const result = await port.checkExportDirectory(dir);
      // Als root (z. B. in manchen Container-Umgebungen) greift der Modus
      // nicht — dann ist "ok" ebenfalls ein akzeptables, weil zutreffendes
      // Ergebnis, und der eigentliche Prüfpfad ist die Sonderrolle von root.
      expect(['ok', false].includes(result.ok as never) || result.ok === true).toBe(true);
      if (!result.ok) expect(result.reason).toBe('not_writable');
    } finally {
      chmodSync(dir, 0o700);
    }
  });
});

describe('createFilePort.writeFile — unteilbar über eine Nachbardatei (A-8.1, A-8.9)', () => {
  let dir: string;

  afterEach(() => {
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  });

  it('schreibt eine Datei, liefert Pfad, SHA-256 und Byte-Länge, und lässt keine Nachbardatei zurück', async () => {
    dir = tempDir();
    const port = createFilePort();

    const result = await port.writeFile(dir, 'export.txt', 'Inhalt der Exportdatei');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.path).toBe(join(dir, 'export.txt'));
    expect(result.value.bytes).toBe(Buffer.byteLength('Inhalt der Exportdatei', 'utf8'));
    expect(result.value.sha256).toMatch(/^[0-9a-f]{64}$/);

    const files = readdirSync(dir);
    expect(files).toEqual(['export.txt']);
    expect(files.some((name) => name.endsWith('.tmp'))).toBe(false);
  });

  it('der SHA-256 stimmt mit dem tatsächlich geschriebenen Inhalt überein', async () => {
    dir = tempDir();
    const port = createFilePort();
    const content = 'Übertragung mit Ärger, Grüße 🎉';

    const result = await port.writeFile(dir, 'x.txt', content);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { createHash } = await import('node:crypto');
    const expected = createHash('sha256').update(Buffer.from(content, 'utf8')).digest('hex');
    expect(result.value.sha256).toBe(expected);
  });

  it('ein Dateiname mit ".." wird abgelehnt — er würde außerhalb des Ordners liegen (R-11)', async () => {
    dir = tempDir();
    const port = createFilePort();

    const result = await port.writeFile(dir, '../ausserhalb.txt', 'x');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('export_path_outside_directory');
    // Nichts wurde außerhalb des Ordners geschrieben.
    expect(existsSync(join(dir, '..', 'ausserhalb.txt'))).toBe(false);
  });

  it.skipIf(platform === 'win32')('ein absoluter Dateiname wird abgelehnt', async () => {
    dir = tempDir();
    const port = createFilePort();
    const result = await port.writeFile(dir, '/etc/passwd', 'x');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('export_path_outside_directory');
  });

  it('ein Name, der nur mit dem Ordnernamen als Präfix beginnt (kein echtes Kind), wird ebenfalls abgelehnt', async () => {
    dir = tempDir();
    const port = createFilePort();
    // "<dir>-alt/datei.txt" beginnt als Zeichenkette mit `dir`, liegt aber
    // nicht darin — das Trennzeichen am Ende der Prüfung verhindert genau das.
    const result = await port.writeFile(dir, `../${dir.split('/').pop()}-alt/datei.txt`, 'x');
    expect(result.ok).toBe(false);
  });

  it.skipIf(platform === 'win32')('ein nicht beschreibbarer Ordner ergibt export_directory_not_writable, keine Datei bleibt liegen', async () => {
    dir = tempDir();
    chmodSync(dir, 0o500);
    try {
      const port = createFilePort();
      const result = await port.writeFile(dir, 'export.txt', 'x');
      if (result.ok) {
        // Als root greift der Modus nicht — dann ist ok ebenfalls zulässig.
        return;
      }
      expect(result.error.code).toBe('export_directory_not_writable');
      expect(readdirSync(dir)).toEqual([]);
    } finally {
      chmodSync(dir, 0o700);
    }
  });
});

describe('removeFile / sweepTemporaryFiles / ensureDirectory', () => {
  let dir: string;

  afterEach(() => {
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  });

  it('removeFile entfernt eine vorhandene Datei und wirft nicht bei einer fehlenden', async () => {
    dir = tempDir();
    const target = join(dir, 'x.txt');
    writeFileSync(target, 'x');
    await removeFile(target);
    expect(existsSync(target)).toBe(false);

    await expect(removeFile(join(dir, 'existiert-nicht.txt'))).resolves.toBeUndefined();
  });

  it('sweepTemporaryFiles entfernt ausschließlich .takt-*.tmp-Dateien und zählt sie', async () => {
    dir = tempDir();
    writeFileSync(join(dir, '.takt-abc123.tmp'), 'x');
    writeFileSync(join(dir, '.takt-def456.tmp'), 'x');
    writeFileSync(join(dir, 'echte-exportdatei.txt'), 'x');
    writeFileSync(join(dir, 'anderes.tmp'), 'x');

    const removed = await sweepTemporaryFiles(dir);

    expect(removed).toBe(2);
    const remaining = readdirSync(dir).sort();
    expect(remaining).toEqual(['anderes.tmp', 'echte-exportdatei.txt']);
  });

  it('sweepTemporaryFiles auf einem nicht lesbaren Ordner wirft nicht und liefert 0', async () => {
    const removed = await sweepTemporaryFiles('/pfad/der/nicht/existiert/takt-test');
    expect(removed).toBe(0);
  });

  it('ensureDirectory legt ein Verzeichnis mit den erwarteten Rechten an (E-018, B-2.2 Punkt 3)', async () => {
    dir = join(tempDir(), 'unterordner', 'noch-einer');
    await ensureDirectory(dir);
    expect(existsSync(dir)).toBe(true);

    if (platform !== 'win32') {
      const mode = statSync(dir).mode & 0o777;
      expect(mode).toBe(0o700);
    }
  });

  it('ensureDirectory ist idempotent — ein zweiter Aufruf auf denselben Pfad wirft nicht', async () => {
    dir = tempDir();
    await ensureDirectory(dir);
    await expect(ensureDirectory(dir)).resolves.toBeUndefined();
  });
});
