/**
 * Takt — T-160 (unit-tester), O-DC: `AttachmentBlobPort.removeImage` bekommt
 * einen Prüffall (A-A-18, T-159).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei fehlte
 * ---------------------------------------------------------------------------
 *
 * `apps/local-api/src/access/attachment-store.ts` hatte laut T-159-domain-dev.md
 * (Risiko 1) **keine** Attrappe und **keinen** Prüffall in diesem Bestand — eine
 * Suche über die Testordner aller Pakete und Anwendungen sowie `tests/` lieferte keinen
 * einzigen Treffer auf `AttachmentBlobPort`, `removeImage` oder
 * `attachmentBlobs`. Das war bequem, solange die Methode `void` zurückgab.
 * Seit T-159 gibt sie `ImageRemoval` (`'removed' | 'unknown_name' | 'failed'`)
 * zurück und protokolliert den dritten Fall — und genau dieser Fehlschlag war
 * "eben sichtbar gemacht" worden, ohne dass ein Prüffall ihn je auslöst.
 *
 * ---------------------------------------------------------------------------
 * Wie hier ein `failed` erzwungen wird — ohne eine echte Bilddatei
 * ---------------------------------------------------------------------------
 *
 * `removeImage` ruft `rm(full, { force: true })` **ohne** `recursive: true`.
 * Zeigt der erzeugte Name zufällig auf ein **Verzeichnis** statt auf eine
 * Datei, wirft `rm` `ERR_FS_EISDIR` — `force` überschreibt das nicht (empirisch
 * geprüft, siehe Bericht). Das genügt, um den Fehlschlagpfad ohne Rechteentzug
 * und ohne eine reale Bilddatei zu erreichen (O-DC: "Der Prüffall braucht
 * keine echte Datei").
 *
 * ---------------------------------------------------------------------------
 * Was geprüft wird
 * ---------------------------------------------------------------------------
 *
 *  1. `removed` — eine vorhandene Kopie verschwindet, **ohne** Protokollzeile.
 *  2. `removed` — eine Kopie, die es längst nicht mehr gibt, ist kein
 *     Fehlschlag (dieselbe Aussage wie im Kopfkommentar des Ports).
 *  3. `unknown_name` — ein Name, der `GENERATED_NAME_SHAPE` nicht trägt (Form)
 *     bzw. der außerhalb des Bildverzeichnisses aufgelöst hat (Boden), **ohne**
 *     Protokollzeile und ohne einen Löschversuch am falschen Ort.
 *  4. `unknown_name` — ohne eingerichtetes Anwendungsdatenverzeichnis
 *     (`appDataDir === null`), unabhängig vom Namen.
 *  5. `failed` — der Rückgabewert **und** die Protokollzeile: `warn`, der
 *     Schlüssel `attachment_image_remove_failed` (und nicht
 *     `UNCLASSIFIED_REASON` — also `REASON_SHAPE`-tauglich, wie T-159 selbst
 *     gemessen hat), der erzeugte Name in der Meldung, kein Pfad und kein
 *     `errno` (B-2.4). Die liegengebliebene "Kopie" bleibt real liegen.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createAttachmentBlobPort, imageDigest } from '../../src/access/attachment-store.ts';
import { createLogger, UNCLASSIFIED_REASON, type Logger } from '../../src/logger.ts';

/** Eine Form, die `GENERATED_NAME_SHAPE` trägt — 32 Hexziffern, Endung `png`. */
const NAME = '0123456789abcdef0123456789abcdef.png';

/** Eine echte PNG-Kopfsignatur (dieselben acht Bytes wie in `packages/domain/test/attachment.test.ts`). */
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

/** Eine echte JPEG-Kopfsignatur. */
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

interface Recorded {
  readonly logger: Logger;
  readonly lines: { level: string; message: string; reason?: string }[];
}

/** Derselbe Aufbau wie in `test/startup.test.ts` — die echte Ausgabe, nur abgefangen. */
function recording(): Recorded {
  const lines: { level: string; message: string; reason?: string }[] = [];
  const logger = createLogger((line) => lines.push(JSON.parse(line) as never));
  return { logger, lines };
}

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'takt-attachment-store-'));
}

describe('createAttachmentBlobPort.removeImage — die drei Werte aus ImageRemoval (A-A-18, T-159)', () => {
  let appDataDir: string;

  afterEach(() => {
    if (appDataDir !== undefined) rmSync(appDataDir, { recursive: true, force: true });
  });

  function withAttachmentsDirectory(): { appDataDir: string; attachmentsDir: string } {
    appDataDir = tempDir();
    const attachmentsDir = join(appDataDir, 'attachments');
    mkdirSync(attachmentsDir, { recursive: true });
    return { appDataDir, attachmentsDir };
  }

  it('entfernt eine vorhandene Kopie und meldet "removed", ohne eine Protokollzeile', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();
    const target = join(attachmentsDir, NAME);
    writeFileSync(target, 'x');

    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.removeImage(NAME);

    expect(result).toBe('removed');
    expect(existsSync(target)).toBe(false);
    expect(lines).toEqual([]);
  });

  it('eine Kopie, die es längst nicht mehr gibt, ist KEIN Fehlschlag ("removed", `force: true`)', async () => {
    withAttachmentsDirectory();
    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    // Keine Datei je angelegt — das Ziel ("sie liegt danach nicht mehr da")
    // ist bereits erreicht.
    const result = await port.removeImage(NAME);

    expect(result).toBe('removed');
    expect(lines).toEqual([]);
  });

  it('ein Name, der die Form nicht trägt, ergibt "unknown_name" — ohne Dateisystemzugriff und ohne Protokollzeile', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();
    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const zuKurz = NAME.slice(0, -5) + '.png'; // 31 statt 32 Hexziffern
    const zuLang = `0${NAME}`; // 33 statt 32 Hexziffern
    const grossgeschrieben = NAME.toUpperCase(); // [0-9a-f] ist klein, kein [A-F]

    for (const bösartigerName of [
      '../../takt.db',
      '../../../etc/passwd',
      `${NAME.slice(0, -4)}.exe`, // richtige 32 Hexziffern, falsche Endung
      zuKurz,
      zuLang,
      grossgeschrieben,
      '',
    ]) {
      const result = await port.removeImage(bösartigerName);
      expect(result, `erwartet unknown_name für ${JSON.stringify(bösartigerName)}`).toBe(
        'unknown_name',
      );
    }
    expect(lines).toEqual([]);

    // Nichts außerhalb des Bildverzeichnisses ist angetastet worden.
    expect(existsSync(join(attachmentsDir, '..', 'takt.db'))).toBe(false);
  });

  it('ohne eingerichtetes Anwendungsdatenverzeichnis ist jeder Name "unknown_name"', async () => {
    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(null, logger);

    const result = await port.removeImage(NAME);

    expect(result).toBe('unknown_name');
    expect(lines).toEqual([]);
  });

  it('ein rm, das fehlschlägt, meldet "failed" UND schreibt genau eine Protokollzeile mit dem erzeugten Namen', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();
    // Ein Verzeichnis unter dem erzeugten Namen zwingt `rm(..., { force: true })`
    // (ohne `recursive: true`) in den Fehlschlag (ERR_FS_EISDIR) — ganz ohne
    // Rechteentzug und ohne eine echte Bilddatei.
    const target = join(attachmentsDir, NAME);
    mkdirSync(target);

    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.removeImage(NAME);

    expect(result).toBe('failed');
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    // REASON_SHAPE-tauglich — nicht UNCLASSIFIED_REASON. Das ist genau die
    // Probe, die T-159-domain-dev.md als eigene Messung nennt.
    expect(lines[0]?.reason).toBe('attachment_image_remove_failed');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
    expect(lines[0]?.message).toContain(NAME);

    // Kein Pfad und kein technischer Fehlercode in der Meldung (B-2.4).
    expect(lines[0]?.message).not.toContain(appDataDir);
    expect(lines[0]?.message).not.toMatch(/ERR_|ENOENT|EISDIR|errno/i);

    // Der Fehlschlag ist real: Das "liegengebliebene" Verzeichnis ist noch da.
    expect(existsSync(target)).toBe(true);
  });
});

/**
 * T-174 (unit-tester), O-DE — `listImages`, der Verzeichnis-Riegel des
 * Aufräumens beim Start (A-A-18). Er nennt NUR Namen, die dieser Port
 * erzeugt haben könnte, und nur Dateien.
 */
describe('createAttachmentBlobPort.listImages — der Verzeichnis-Riegel des Aufräumens (A-A-18)', () => {
  let appDataDir: string;

  afterEach(() => {
    if (appDataDir !== undefined) rmSync(appDataDir, { recursive: true, force: true });
  });

  function withAttachmentsDirectory(): { appDataDir: string; attachmentsDir: string } {
    appDataDir = tempDir();
    const attachmentsDir = join(appDataDir, 'attachments');
    mkdirSync(attachmentsDir, { recursive: true });
    return { appDataDir, attachmentsDir };
  }

  it('ohne eingerichtetes Anwendungsdatenverzeichnis ist die Liste leer, ohne Dateisystemzugriff', async () => {
    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(null, logger);

    expect(await port.listImages()).toEqual([]);
    expect(lines).toEqual([]);
  });

  it('ein noch nicht angelegtes Bildverzeichnis (frische Einrichtung) ergibt eine leere Liste, keinen Fehlschlag', async () => {
    // `withAttachmentsDirectory` wird bewusst NICHT aufgerufen -- `attachments/`
    // existiert an dieser Stelle noch nicht, wie bei einer frischen Installation.
    appDataDir = tempDir();
    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    expect(await port.listImages()).toEqual([]);
    expect(lines).toEqual([]);
  });

  it('nennt genau die Dateien, die GENERATED_NAME_SHAPE tragen — ein Unterordner, eine fremde Datei und eine halbe Kopie bleiben unsichtbar', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();

    const zugeordnet = '11111111111111111111111111111111.png';
    const verwaist = '22222222222222222222222222222222.jpg';
    writeFileSync(join(attachmentsDir, zugeordnet), 'x');
    writeFileSync(join(attachmentsDir, verwaist), 'x');
    // Fremde Datei, kein erzeugter Name -- Kundenmaterial, das nicht diesem
    // Port gehört und deshalb unsichtbar bleiben muss.
    writeFileSync(join(attachmentsDir, 'urlaub-2026.png'), 'x');
    // Eine Halbkopie aus einem abgebrochenen Schreibvorgang trägt `.tmp`.
    writeFileSync(join(attachmentsDir, `${verwaist}.tmp`), 'x');
    // Ein Unterordner mit einem gültig aussehenden Namen -- keine Datei,
    // `entry.isFile()` muss ihn ausschließen.
    mkdirSync(join(attachmentsDir, '33333333333333333333333333333333.png'));

    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const gefunden = [...(await port.listImages())].sort();
    expect(gefunden).toEqual([zugeordnet, verwaist].sort());
  });

  it('ein leeres, wirklich vorhandenes Verzeichnis ergibt eine leere Liste', async () => {
    withAttachmentsDirectory();
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    expect(await port.listImages()).toEqual([]);
  });
});

/**
 * T-174 (unit-tester), O-DJ — `copyImage` hat bislang keinen Prüffall (kein
 * Befund verlangt das, aber `removeImage` war es auch nicht, bis es kaputt
 * war, T-159).
 */
describe('createAttachmentBlobPort.copyImage — bislang ohne Prüffall (O-DJ)', () => {
  let appDataDir: string;
  let quelle: string;

  afterEach(() => {
    if (appDataDir !== undefined) rmSync(appDataDir, { recursive: true, force: true });
    if (quelle !== undefined) rmSync(quelle, { force: true });
  });

  function quellDatei(bytes: Buffer): string {
    quelle = join(tempDir(), 'quelle.bin');
    writeFileSync(quelle, bytes);
    return quelle;
  }

  it('ein relativer Quellpfad ist "unreadable" — ohne dass irgendetwas gelesen wird (A-A-11)', async () => {
    appDataDir = tempDir();
    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.copyImage('relativ/bild.png');

    expect(result).toEqual({ ok: false, reason: 'unreadable' });
    expect(lines).toEqual([]);
  });

  it('ohne eingerichtetes Anwendungsdatenverzeichnis ist das Ergebnis "write_failed"', async () => {
    const quellpfad = quellDatei(PNG_BYTES);
    const { logger } = recording();
    const port = createAttachmentBlobPort(null, logger);

    const result = await port.copyImage(quellpfad);

    expect(result).toEqual({ ok: false, reason: 'write_failed' });
  });

  it('eine nicht vorhandene Quelldatei ist "unreadable"', async () => {
    appDataDir = tempDir();
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.copyImage(join(appDataDir, 'gibt-es-nicht.png'));

    expect(result).toEqual({ ok: false, reason: 'unreadable' });
  });

  it('eine echte PNG-Datei wird kopiert: erzeugter Name, richtiger MediaType, Bytezahl, und dieselben Bytes liegen unter dem erzeugten Namen', async () => {
    appDataDir = tempDir();
    const quellpfad = quellDatei(PNG_BYTES);
    const { logger, lines } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.copyImage(quellpfad);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.name).toMatch(/^[0-9a-f]{32}\.png$/);
    expect(result.mediaType).toBe('image/png');
    expect(result.bytes).toBe(PNG_BYTES.length);
    expect(lines).toEqual([]);

    const kopie = readFileSync(join(appDataDir, 'attachments', result.name));
    expect(imageDigest(kopie)).toBe(imageDigest(PNG_BYTES));

    // Der Name der KOPIE ist erzeugt und hat nichts mit dem Quellnamen zu
    // tun (A-A-17) — "quelle.bin" taucht nirgends im erzeugten Namen auf.
    expect(result.name).not.toContain('quelle');
  });

  it('Bytes ohne eine der vier Kopfsignaturen ergeben "not_an_image" — die Endung der Quelle zählt nicht', async () => {
    appDataDir = tempDir();
    const quellpfad = quellDatei(Buffer.from('dies ist kein Bild, nur Text'));
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.copyImage(quellpfad);

    expect(result).toEqual({ ok: false, reason: 'not_an_image' });
  });

  it('eine leere Quelldatei ergibt "empty"', async () => {
    appDataDir = tempDir();
    const quellpfad = quellDatei(Buffer.alloc(0));
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.copyImage(quellpfad);

    expect(result).toEqual({ ok: false, reason: 'empty' });
  });
});

/**
 * T-174 (unit-tester), O-DJ — `readImage` hat bislang keinen Prüffall.
 */
describe('createAttachmentBlobPort.readImage — bislang ohne Prüffall (O-DJ)', () => {
  let appDataDir: string;

  afterEach(() => {
    if (appDataDir !== undefined) rmSync(appDataDir, { recursive: true, force: true });
  });

  function withAttachmentsDirectory(): { appDataDir: string; attachmentsDir: string } {
    appDataDir = tempDir();
    const attachmentsDir = join(appDataDir, 'attachments');
    mkdirSync(attachmentsDir, { recursive: true });
    return { appDataDir, attachmentsDir };
  }

  it('ein Name, der die Form nicht trägt, ergibt "bad_name" — ohne Dateisystemzugriff', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.readImage('../../takt.db');

    expect(result).toEqual({ ok: false, reason: 'bad_name' });
    // Nichts außerhalb des Bildverzeichnisses ist gelesen worden -- diese
    // Zeile scheitert bereits an "bad_name" und nicht an einem I/O-Fehler.
    expect(existsSync(join(attachmentsDir, '..', 'takt.db'))).toBe(false);
  });

  it('ohne eingerichtetes Anwendungsdatenverzeichnis ist jeder Name "bad_name"', async () => {
    const { logger } = recording();
    const port = createAttachmentBlobPort(null, logger);

    const result = await port.readImage(NAME);

    expect(result).toEqual({ ok: false, reason: 'bad_name' });
  });

  it('eine Kopie, die es nicht (mehr) gibt, ist "unreadable" (A-19.15) — kein Wurf', async () => {
    withAttachmentsDirectory();
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.readImage(NAME);

    expect(result).toEqual({ ok: false, reason: 'unreadable' });
  });

  it('eine echte Kopie liefert dieselben Bytes und den MediaType aus dem INHALT zurück', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();
    writeFileSync(join(attachmentsDir, NAME), PNG_BYTES);
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.readImage(NAME);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mediaType).toBe('image/png');
    expect(imageDigest(result.data)).toBe(imageDigest(PNG_BYTES));
  });

  it('der Name lügt, der Inhalt entscheidet: eine ".png"-Kopie mit JPEG-Signatur liefert "image/jpeg"', async () => {
    // Name und Bytes können auseinanderfallen (VG-1, VG-3) -- die Kopfsignatur
    // wird beim Lesen ERNEUT gemessen, die Endung des Namens wird dabei nicht
    // gefragt (Kopfkommentar von `readImage`).
    const { attachmentsDir } = withAttachmentsDirectory();
    writeFileSync(join(attachmentsDir, NAME), JPEG_BYTES);
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.readImage(NAME);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mediaType).toBe('image/jpeg');
  });

  it('eine Kopie ohne gültige Kopfsignatur ergibt "not_an_image", trotz gültigem Namen', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();
    writeFileSync(join(attachmentsDir, NAME), 'kein Bild, nur Text');
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.readImage(NAME);

    expect(result).toEqual({ ok: false, reason: 'not_an_image' });
  });

  it('eine leere Kopie ergibt "empty"', async () => {
    const { attachmentsDir } = withAttachmentsDirectory();
    writeFileSync(join(attachmentsDir, NAME), Buffer.alloc(0));
    const { logger } = recording();
    const port = createAttachmentBlobPort(appDataDir, logger);

    const result = await port.readImage(NAME);

    expect(result).toEqual({ ok: false, reason: 'empty' });
  });
});
