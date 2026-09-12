/**
 * Takt — T-317 (unit-tester): der Aufräumlauf für verwaiste Bildkopien, nach
 * der Vereinheitlichung in T-315 (A-A-18, A-A-36, A-A-98, T-313, T-314,
 * T-315-domain-dev.md).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei komplett neu geschrieben wurde
 * ---------------------------------------------------------------------------
 *
 * Die alte Fassung (T-174) prüfte eine Schnittstelle, die es seit T-315 nicht
 * mehr gibt: `knownImageTargets` ist ersatzlos gestrichen, der Rückgabewert
 * war ein `number` statt eines {@link OrphanSweepReport}. Rot-zuerst-Nachweis
 * (vor dieser Änderung gemessen): **16 von 18 Fällen rot, 22
 * Übersetzungsfehler** (`tsc -p apps/local-api/tsconfig.test.json`).
 *
 * Diese Fassung prüft `sweepOrphanedImages` gegen `OrphanedImageSweep` (acht
 * Felder: `attachmentKinds`, `folder`, `listImages`, `imageNameOf`,
 * `attachmentsNamingFiles`, `attachmentNamesUnder`, `imageCount`,
 * `removeImage`) und `OrphanSweepReport`, nach dem Vorbild von
 * `email-file-sweep.test.ts` (T-316) — dieselben Riegel, dieselbe Reihenfolge,
 * derselbe Widerspruchsriegel auf zwei Achsen.
 *
 * ---------------------------------------------------------------------------
 * Was hier zusätzlich gemessen wird — die neun Fälle aus T-315-domain-dev.md
 * Abschnitt 4
 * ---------------------------------------------------------------------------
 *
 * domain-dev hat `sweepOrphanedImages` in T-315 gegen eine echte, migrierte
 * Datenbank gefahren und neun Fälle in einer Tabelle festgehalten. Sie sind
 * hier als eigene `describe`-Gruppe nachgebaut, mit Attrappen statt echter
 * Adapter — was `attachmentsNamingFiles`/`attachmentNamesUnder` bei
 * abweichender Groß-/Kleinschreibung, anderem `kind` oder vollem Pfad
 * tatsächlich antworten, ist Sache von `packages/domain/test/attachment.test.ts`
 * und `packages/storage/test/repo-attachments.test.ts` — hier wird geprüft,
 * dass `sweepOrphanedImages` diese Antworten korrekt auswertet.
 */
import { describe, expect, it } from 'vitest';
import { ATTACHMENT_KINDS } from '@takt/domain';

import {
  sweepOrphanedImages,
  KINDS_HOLDING_IMAGE_FILES,
  type OrphanedImageSweep,
} from '../../src/features/todos/image-sweep.ts';
import type { OrphanSweepReport } from '../../src/features/todos/orphan-sweep.ts';
import { createLogger, UNCLASSIFIED_REASON, type Logger } from '../../src/logger.ts';

interface Recorded {
  readonly logger: Logger;
  readonly lines: { level: string; message: string; reason?: string }[];
}

function recording(): Recorded {
  const lines: { level: string; message: string; reason?: string }[] = [];
  const logger = createLogger((line) => lines.push(JSON.parse(line) as never));
  return { logger, lines };
}

function darfNichtAufgerufenWerden(name: string): never {
  throw new Error(`darf in diesem Fall nicht aufgerufen werden: ${name}`);
}

const KNOWN_KINDS: readonly string[] = ATTACHMENT_KINDS;

/** Ein vollständiger Satz Attrappen, die jeder darf-nicht-aufgerufen-werden. */
function niemalsGerufenePorts(): OrphanedImageSweep {
  return {
    async attachmentKinds() {
      return darfNichtAufgerufenWerden('attachmentKinds');
    },
    folder() {
      return darfNichtAufgerufenWerden('folder');
    },
    async listImages() {
      return darfNichtAufgerufenWerden('listImages');
    },
    imageNameOf() {
      return darfNichtAufgerufenWerden('imageNameOf');
    },
    async attachmentsNamingFiles() {
      return darfNichtAufgerufenWerden('attachmentsNamingFiles');
    },
    async attachmentNamesUnder() {
      return darfNichtAufgerufenWerden('attachmentNamesUnder');
    },
    async imageCount() {
      return darfNichtAufgerufenWerden('imageCount');
    },
    async removeImage() {
      return darfNichtAufgerufenWerden('removeImage');
    },
  };
}

describe('sweepOrphanedImages — Riegel 0 (A-A-36): die Artmenge des Bestands', () => {
  it('kennt der Bestand eine ANDERE Artmenge, räumt der Lauf gar nicht auf — kein weiterer Port wird gerufen', async () => {
    const ports: OrphanedImageSweep = {
      ...niemalsGerufenePorts(),
      async attachmentKinds() {
        return ['link', 'file']; // "image" fehlt
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 0,
      owned: 0,
      removed: 0,
      refused: 'unknown_kinds',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    // Seit T-315: kein "expected=3" mehr im Bildlauf (E-Mail-Lauf führte es
    // nie) — die Zahl war ohnehin konstant und damit keine Messung.
    expect(lines[0]?.reason).toBe('attachment_image_sweep_unknown_kinds kinds=2');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
    expect(lines[0]?.message).not.toMatch(/link|file|image/);
  });

  it('führt der Bestand genau die bekannte Artmenge, geht der Lauf normal weiter', async () => {
    const ports: OrphanedImageSweep = {
      ...niemalsGerufenePorts(),
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async listImages() {
        return [];
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 0, owned: 0, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedImages — Riegel 1: eine leere Verzeichnisliste beendet den Lauf sofort', () => {
  it('keine Kopie im Verzeichnis: der Bestand wird NICHT gefragt, keine Protokollzeile', async () => {
    const ports: OrphanedImageSweep = {
      ...niemalsGerufenePorts(),
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async listImages() {
        return [];
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 0, owned: 0, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedImages — imageNameOf filtert VOR jeder Frage an den Bestand', () => {
  it('ein Name ohne auflösbaren Wert wird weder gefragt noch entfernt — "read" zählt ihn trotzdem', async () => {
    const auflösbar = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png';
    const nicht = 'rechnung.pdf'; // kein von diesem Ordner erzeugter Name
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return [auflösbar, nicht];
      },
      imageNameOf(name) {
        return name === auflösbar ? name : null;
      },
      async attachmentsNamingFiles(names) {
        // Nur der auflösbare Name darf hier ankommen.
        expect(names).toEqual([auflösbar]);
        return new Set(names);
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 2, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });

  it('KEIN gefundener Name hat einen auflösbaren Wert: owned bleibt 0, der Bestand wird gar nicht gefragt', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return ['notizen.txt'];
      },
      imageNameOf() {
        return null;
      },
      async attachmentsNamingFiles() {
        return darfNichtAufgerufenWerden('attachmentsNamingFiles');
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 1, owned: 0, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedImages — ohne Waise wird NICHT gefragt (T-313-2: eine unvollständige Zuordnung allein blockiert nichts)', () => {
  it('jeder gefundene Name hat einen Eigentümer: folder/attachmentNamesUnder/imageCount werden NICHT gerufen', async () => {
    const bekannt = 'dddddddddddddddddddddddddddddddd.png';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return [bekannt];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names); // "alles hat einen Eigentümer"
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 1, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedImages — der Widerspruchsriegel: ZWEI Achsen, gestellt sobald überhaupt eine Waise vorläge', () => {
  it('eine echte Waise, kein Widerspruch auf beiden Achsen: sie wird entfernt', async () => {
    const bekannt = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
    const waise = 'ffffffffffffffffffffffffffffffff.jpg';
    const entfernt: string[] = [];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [bekannt, waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names.filter((name) => name === bekannt));
      },
      async attachmentNamesUnder() {
        // Bildzeilen tragen bloße Namen, keine Pfade -- diese Gegenfrage
        // antwortet im Regelfall leer (Kopfkommentar der Produktivdatei).
        return new Set();
      },
      async imageCount() {
        return 1;
      },
      async removeImage(name) {
        entfernt.push(name);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 2, owned: 1, removed: 1, refused: null });
    expect(entfernt).toEqual([waise]);
    expect(lines).toEqual([
      expect.objectContaining({
        level: 'info',
        reason: 'attachment_image_orphans_removed files=1',
      }),
    ]);
  });

  it('DIE WICHTIGSTE MESSUNG (T-315 Abschnitt 3.2): der Riegel feuert auch bei NICHT LEERER Eigentümermenge (owned=1, nicht 0)', async () => {
    const bekannt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png';
    const waise = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg';
    const erwartetAberFehlend = 'cccccccccccccccccccccccccccccccc.gif';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [bekannt, waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names.filter((name) => name === bekannt)); // owned.size === 1, NICHT 0
      },
      async attachmentNamesUnder() {
        // Eine Zeile mit vollem Pfad in diesen Ordner nennt einen Namen, der
        // hier nicht liegt -- "missing" > 0.
        return new Set([erwartetAberFehlend]);
      },
      async imageCount() {
        return 1;
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 2,
      owned: 1,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.reason).toBe(
      'attachment_image_sweep_contradiction files=2 owned=1 orphans=1 expected=1 missing=1 attachments=1',
    );
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
    expect(lines[0]?.message).not.toMatch(/\.(png|jpg|gif|webp)/);
  });

  it('zweite Achse — "blind": der Bestand führt Bildanhänge, findet aber weder am Namen noch am Ordner eine einzige wieder', async () => {
    const waise = 'dddddddddddddddddddddddddddddddd.webp';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles() {
        return new Set(); // niemand nennt diesen Namen
      },
      async attachmentNamesUnder() {
        return new Set(); // der Ordner erwartet ebenfalls nichts
      },
      async imageCount() {
        return 3; // der Bestand führt trotzdem Bildanhänge -- Widerspruch
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 1,
      owned: 0,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines[0]?.reason).toBe(
      'attachment_image_sweep_contradiction files=1 owned=0 orphans=1 expected=0 missing=0 attachments=3',
    );
  });

  it('Gegenprobe zur zweiten Achse: imageCount() ist 0 -- kein Widerspruch, die Waise wird entfernt', async () => {
    const waise = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
    const entfernt: string[] = [];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles() {
        return new Set();
      },
      async attachmentNamesUnder() {
        return new Set();
      },
      async imageCount() {
        return 0;
      },
      async removeImage(name) {
        entfernt.push(name);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 1, owned: 0, removed: 1, refused: null });
    expect(entfernt).toEqual([waise]);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_image_orphans_removed files=1' }),
    ]);
  });
});

describe('sweepOrphanedImages — die Verschärfung "claimed > owned" (T-315): am GEMISCHTEN Fall gemessen, nicht am leeren', () => {
  it('zehn Kopien, EINE davon zugeordnet, NEUN nicht: der Riegel feuert -- gegen "owned === 0" hätte er geschwiegen', async () => {
    // Der alte Riegel (bis T-315) verglich die zweite Achse gegen Null. Eine
    // EINZIGE zugeordnete Datei hätte ihn entwaffnet -- genau der teuerste der
    // in T-313/T-314 gemessenen Fälle: neun Dateien mit Eigentümer fielen,
    // weil die zehnte passte. Dieser Fall mißt exakt das Verhältnis 1-von-10,
    // nicht 0-von-N, damit die Verschärfung selbst (und nicht nur der bereits
    // vorher erkannte leere Fall) nachgewiesen ist.
    const bekannt = '00000000000000000000000000000000.png';
    const scheinbareWaisen = Array.from(
      { length: 9 },
      (_, i) => `${String(i + 1).repeat(32)}.png`,
    );
    const gefunden = [bekannt, ...scheinbareWaisen];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return gefunden;
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        // Nur die eine bekannte Datei hat (noch) eine Zeile -- die übrigen
        // neun Zeilen haben ihre Gestalt gewechselt (z. B. ein von außen
        // verändertes "kind"/"target") und sind über KEINE der beiden Fragen
        // mehr auffindbar.
        return new Set(names.filter((name) => name === bekannt));
      },
      async attachmentNamesUnder() {
        // Bildzeilen tragen bloße Namen -- diese Achse trägt hier nichts bei.
        return new Set();
      },
      async imageCount() {
        // Der Bestand führt zehn Bildanhänge insgesamt (claimed = 10), obwohl
        // der Ordner nur einen einzigen davon wiederfindet (owned = 1).
        // claimed (10) > owned (1) -- der Riegel muß feuern.
        return 10;
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 10,
      owned: 1,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe(
      'attachment_image_sweep_contradiction files=10 owned=1 orphans=9 expected=0 missing=0 attachments=10',
    );
    // Keine der neun scheinbaren Waisen wird entfernt -- der Riegel hält alle
    // zehn zurück, nicht nur die neun ohne Zeile.
    expect(report.removed).toBe(0);
  });
});

describe('sweepOrphanedImages — no_folder: kein Ordner bestimmbar, sobald eine Waise vorläge', () => {
  it('folder() ist null: der Lauf verweigert, entfernt nichts, und imageCount/attachmentNamesUnder werden NICHT gerufen', async () => {
    const waise = 'ffffffffffffffffffffffffffffffff.png';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return null;
      },
      async listImages() {
        return [waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles() {
        return new Set();
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 1,
      owned: 0,
      removed: 0,
      refused: 'no_folder',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe('attachment_image_sweep_no_folder files=1');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
  });
});

describe('sweepOrphanedImages — Reihenfolge: erst das Verzeichnis, dann der Bestand, die Gegenfragen zuletzt', () => {
  it('attachmentKinds -> listImages -> imageNameOf -> attachmentsNamingFiles -> folder -> attachmentNamesUnder -> imageCount -> removeImage', async () => {
    const reihenfolge: string[] = [];
    const waise = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        reihenfolge.push('attachmentKinds');
        return KNOWN_KINDS;
      },
      folder() {
        reihenfolge.push('folder');
        return 'C:\\App\\attachments';
      },
      async listImages() {
        reihenfolge.push('listImages');
        return [waise];
      },
      imageNameOf(name) {
        reihenfolge.push('imageNameOf');
        return name;
      },
      async attachmentsNamingFiles() {
        reihenfolge.push('attachmentsNamingFiles');
        return new Set();
      },
      async attachmentNamesUnder() {
        reihenfolge.push('attachmentNamesUnder');
        return new Set();
      },
      async imageCount() {
        reihenfolge.push('imageCount');
        return 0;
      },
      async removeImage() {
        reihenfolge.push('removeImage');
        return 'removed';
      },
    };
    const { logger } = recording();

    await sweepOrphanedImages(ports, logger);

    expect(reihenfolge).toEqual([
      'attachmentKinds',
      'listImages',
      'imageNameOf',
      'attachmentsNamingFiles',
      'folder',
      'attachmentNamesUnder',
      'imageCount',
      'removeImage',
    ]);
  });

  it('eine Zeile, die genau zwischen Verzeichnislesen und Bestandsfrage entsteht, überlebt', async () => {
    const frisch = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png';
    let inzwischenAngelegt = false;
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        inzwischenAngelegt = true;
        return [frisch];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return inzwischenAngelegt ? new Set(names) : new Set();
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 1, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedImages — ein Abbruch mitten im Entfernen verschluckt den erzielten Fortschritt nicht (B-2.4)', () => {
  it('ein "failed" von removeImage zählt NICHT mit', async () => {
    const waiseEins = 'cccccccccccccccccccccccccccccccc.jpg';
    const waiseZwei = 'dddddddddddddddddddddddddddddddd.gif';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [waiseEins, waiseZwei];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles() {
        return new Set();
      },
      async attachmentNamesUnder() {
        return new Set();
      },
      async imageCount() {
        return 0;
      },
      async removeImage(name) {
        return name === waiseEins ? 'failed' : 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report.removed).toBe(1);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_image_orphans_removed files=1' }),
    ]);
  });

  it('ein werfender Schritt bricht ab, ohne nach außen zu werfen — die Zahl bis dahin bleibt erhalten', async () => {
    const bereitsEntfernt = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
    const bricht = 'ffffffffffffffffffffffffffffffff.jpg';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [bereitsEntfernt, bricht];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles() {
        return new Set();
      },
      async attachmentNamesUnder() {
        return new Set();
      },
      async imageCount() {
        return 0;
      },
      async removeImage(name) {
        if (name === bricht) throw new Error('EBUSY');
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 2,
      owned: 0,
      removed: 1,
      refused: 'unavailable',
    });
    expect(lines).toEqual([
      expect.objectContaining({
        level: 'warn',
        reason: 'attachment_image_sweep_unavailable files=2 removed=1',
      }),
    ]);
    // Kein Name, kein technischer Fehlercode in der Meldung (B-2.4).
    expect(lines[0]?.message).not.toMatch(/EBUSY|C:\\|errno|\.png|\.jpg/i);
  });

  it('attachmentKinds() wirft: derselbe Abbruch, keine Ausnahme dringt nach außen', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        throw new Error('SQLITE_BUSY');
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return darfNichtAufgerufenWerden('listImages');
      },
      imageNameOf() {
        return darfNichtAufgerufenWerden('imageNameOf');
      },
      async attachmentsNamingFiles() {
        return darfNichtAufgerufenWerden('attachmentsNamingFiles');
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 0,
      owned: 0,
      removed: 0,
      refused: 'unavailable',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.reason).toBe('attachment_image_sweep_unavailable files=0 removed=0');
  });
});

// ---------------------------------------------------------------------------
// Die neun Fälle aus T-315-domain-dev.md Abschnitt 4 — mit echten Adaptern auf
// einer frischen SQLite-Datenbank gemessen. Hier als Attrappen nachgebaut:
// Was `attachmentsNamingFiles`/`attachmentNamesUnder` bei abweichender
// Groß-/Kleinschreibung, anderem `kind` oder vollem Pfad tatsächlich
// antworten, ist an der echten Datenbank in
// packages/storage/test/repo-attachments.test.ts und rein in
// packages/domain/test/attachment.test.ts nachgewiesen (attachmentTargetNamesFile
// kennt weder "kind" noch "origin" und vergleicht ASCII-gefaltet). Hier wird
// geprüft, dass sweepOrphanedImages die jeweilige Antwort korrekt auswertet.
// ---------------------------------------------------------------------------
describe('sweepOrphanedImages — die neun Meßfälle aus T-315-domain-dev.md Abschnitt 4', () => {
  it('T-313-1: zwei Kopien, eine Zeile zeichengleich, eine mit abweichender Groß-/Kleinschreibung — BEIDE bleiben da', async () => {
    const einsExakt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.PNG';
    const zweiAbweichend = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return [einsExakt, zweiAbweichend];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        // Die weiteste Frage (attachmentTargetNamesFile) faltet ASCII und
        // findet beide -- unabhängig von der Groß-/Kleinschreibung der Zeile.
        return new Set(names);
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 2, owned: 2, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });

  it('T-313-2: zwei Kopien, beide Zeilen vom Typ "file" — BEIDE bleiben da, die Frage kennt kein "kind"', async () => {
    const eins = 'cccccccccccccccccccccccccccccccc.jpg';
    const zwei = 'dddddddddddddddddddddddddddddddd.gif';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return [eins, zwei];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        // "attachmentsNamingFiles" fragt ohne "kind" -- zwei Zeilen mit
        // kind='file', die auf denselben Namen zeigen, zählen genauso.
        return new Set(names);
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 2, owned: 2, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });

  it('DER VIERTE WEG (neu in T-315): eine Kopie, deren Zeile denselben Namen als VOLLEN PFAD trägt statt als bloßen Namen — sie bleibt da', async () => {
    // Vor T-315 fragte der Bildlauf mit einem zeichengleichen "target IN
    // (namen)" über bloße Namen. Eine Zeile, die dieselbe Datei mit ihrem
    // vollen Pfad nennt ("C:\...\attachments\<name>.png", z. B. weil sie über
    // die gewöhnliche Datei-Anhang-Tür statt als Bild angelegt wurde), war
    // darin unsichtbar: entfernt = 1, Datei fort, Zeile blieb stehen
    // (T-315-domain-dev.md Abschnitt 4). Seit T-315 fragt der Lauf über
    // attachmentsNamingFiles, und die endet auf "target.endsWith(name)" --
    // ein voller Pfad, der auf den Namen endet, nennt ihn ebenfalls.
    const kopie = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return [kopie];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        // Simuliert die reale attachmentTargetNamesFile-Antwort für eine
        // Zeile mit target = voller Pfad in den Bildordner, kind='file'.
        return new Set(names);
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 1, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });

  it('Gegenprobe nach oben: drei Kopien, zwei Zeilen — die echte Waise fällt', async () => {
    const einsBekannt = 'ffffffffffffffffffffffffffffffff.png';
    const zweiBekannt = '11111111111111111111111111111111.jpg';
    const waise = '22222222222222222222222222222222.gif';
    const entfernt: string[] = [];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [einsBekannt, zweiBekannt, waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names.filter((name) => name !== waise));
      },
      async attachmentNamesUnder() {
        return new Set();
      },
      async imageCount() {
        return 2;
      },
      async removeImage(name) {
        entfernt.push(name);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 3, owned: 2, removed: 1, refused: null });
    expect(entfernt).toEqual([waise]);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_image_orphans_removed files=1' }),
    ]);
  });

  it('der gemischte Fall: drei Kopien, eine Zeile paßt, zwei haben die Gestalt gewechselt — Widerspruch, nichts fällt', async () => {
    const paßt = '33333333333333333333333333333333.png';
    const gewechseltEins = '44444444444444444444444444444444.jpg';
    const gewechseltZwei = '55555555555555555555555555555555.gif';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [paßt, gewechseltEins, gewechseltZwei];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names.filter((name) => name === paßt));
      },
      async attachmentNamesUnder() {
        return new Set(); // keine Zeile mit vollem Pfad hierher
      },
      async imageCount() {
        // Der Bestand führt drei Bildanhänge insgesamt -- claimed(3) > owned(1).
        return 3;
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 3,
      owned: 1,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.reason).toBe(
      'attachment_image_sweep_contradiction files=3 owned=1 orphans=2 expected=0 missing=0 attachments=3',
    );
  });

  it('eine Zeile ohne Datei PLUS eine echte Waise: Widerspruch auf der ersten Achse', async () => {
    const bekannt = '66666666666666666666666666666666.png';
    const waise = '77777777777777777777777777777777.jpg';
    const erwartetAberFehlend = '88888888888888888888888888888888.gif';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [bekannt, waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names.filter((name) => name === bekannt));
      },
      async attachmentNamesUnder() {
        // Eine Zeile mit vollem Pfad nennt einen Namen, der hier nicht liegt.
        return new Set([bekannt, erwartetAberFehlend]);
      },
      async imageCount() {
        return 1;
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 2,
      owned: 1,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines[0]?.reason).toBe(
      'attachment_image_sweep_contradiction files=2 owned=1 orphans=1 expected=2 missing=1 attachments=1',
    );
  });

  it('dieselbe fehlende Zeile OHNE Waise: still — die Gegenfragen werden erst gar nicht gestellt', async () => {
    const bekannt = '99999999999999999999999999999999.png';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listImages() {
        return [bekannt];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names); // alles hat einen Eigentümer -- keine Waise
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 1, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });

  it('Zeile mit vollem Pfad in den Ordner, deren Datei fehlt, PLUS eine Waise: Widerspruch, obwohl owned=0 UND claimed=owned', async () => {
    const waise = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab.png';
    const erwartetAberFehlend = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba.jpg';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [waise];
      },
      imageNameOf(name) {
        return name;
      },
      async attachmentsNamingFiles() {
        return new Set(); // owned = 0
      },
      async attachmentNamesUnder() {
        // Nur der fehlende Name, NICHT die Waise selbst -- die erste Achse
        // trägt diesen Fall allein, unabhängig von der zweiten.
        return new Set([erwartetAberFehlend]);
      },
      async imageCount() {
        return 0; // claimed(0) === owned(0) -- die zweite Achse trägt hier nichts
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 1,
      owned: 0,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines[0]?.reason).toBe(
      'attachment_image_sweep_contradiction files=1 owned=0 orphans=1 expected=1 missing=1 attachments=0',
    );
  });

  it('ein fremder Name im Ordner (z. B. "rechnung.pdf") ist unsichtbar und überlebt — die Waise daneben fällt trotzdem', async () => {
    const fremd = 'rechnung.pdf';
    const waise = 'cccccccccccccccccccccccccccccccc.png';
    const entfernt: string[] = [];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [fremd, waise];
      },
      imageNameOf(name) {
        // Der echte Adapter erkennt nur seine eigene Namensform (Hex + eine
        // der vier bekannten Endungen); ein fremder Name kommt für diesen
        // Ordner nicht in Frage.
        return name === fremd ? null : name;
      },
      async attachmentsNamingFiles(names) {
        expect(names).toEqual([waise]); // "rechnung.pdf" wird nie gefragt
        return new Set();
      },
      async attachmentNamesUnder() {
        return new Set();
      },
      async imageCount() {
        return 0;
      },
      async removeImage(name) {
        entfernt.push(name);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedImages(ports, logger);

    // "read" zählt den fremden Namen mit (er wurde im Verzeichnis gesehen),
    // aber er wird nie angefaßt -- nur die echte Waise fällt.
    expect(report).toEqual<OrphanSweepReport>({ read: 2, owned: 0, removed: 1, refused: null });
    expect(entfernt).toEqual([waise]);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_image_orphans_removed files=1' }),
    ]);
  });
});

// ---------------------------------------------------------------------------
// KINDS_HOLDING_IMAGE_FILES — die Auswertung der Tafel KIND_OWNS_IMAGE_FILE
// (Kopfkommentar von image-sweep.ts). Eine Zusicherung, die genau EINE Art
// erwartet: Wer eine vierte Art mit "true" einträgt, muß diesen Prüffall
// ändern, bevor er ihn grün bekommt -- und wird dabei an imageCount()
// erinnert (die enge Zählung müßte diese Art dann mitzählen).
// ---------------------------------------------------------------------------
describe('KINDS_HOLDING_IMAGE_FILES — die Auswertung der Tafel, die eine vierte Art bemerken muß', () => {
  it('heute genau eine Art: "image"', () => {
    expect(KINDS_HOLDING_IMAGE_FILES).toEqual(['image']);
  });
});
