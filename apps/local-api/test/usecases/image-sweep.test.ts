/**
 * Takt — T-174 (unit-tester), O-EM: die Riegel des Aufräumens verwaister
 * Bildkopien beim Start (A-A-18, A-A-36).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei fehlte
 * ---------------------------------------------------------------------------
 *
 * `apps/local-api/src/usecases/image-sweep.ts` entstand mit T-168 (O-DE) und
 * hatte keinen einzigen Prüffall unter `apps/local-api/test/**` — eine Suche
 * nach `sweepOrphanedImages` oder `OrphanedImageSweep` fand nichts. T-168 hat
 * das im eigenen Bericht als offene Frage 3 an unit-tester weitergereicht:
 * "Miss die Riegel, nicht das Aufräumen."
 *
 * Während dieser Prüffall entstand, hat eine parallel laufende Welle
 * (A-A-36) einen vierten Riegel ergänzt: `attachmentKinds()` wird jetzt **vor
 * allem anderen** gefragt, und der Lauf räumt bei jeder Abweichung von der
 * heute bekannten Artmenge gar nicht auf. Jede Attrappe unten stellt diese
 * Funktion deshalb bereit (`KNOWN_KINDS`) — eine Attrappe ohne sie ließe den
 * Lauf über den neuen Riegel stolpern, bevor er überhaupt beim eigentlich zu
 * prüfenden Verhalten ankommt.
 *
 * ---------------------------------------------------------------------------
 * Was hier gemessen wird — und was nicht
 * ---------------------------------------------------------------------------
 *
 * `sweepOrphanedImages` ist bewusst gegen vier schmale Funktionen gebaut statt
 * gegen einen Port oder einen laufenden Dienst (Kopfkommentar der
 * Produktivdatei: "damit ist er ohne Datenbank, ohne Dateisystem und ohne
 * laufenden Dienst prüfbar"). Diese Datei nutzt genau das: Attrappen ohne
 * Dateisystem und ohne SQLite, die die vier Riegel und ihre Reihenfolge
 * einzeln vorführen — **nicht** die echten Adapter (die haben eigene
 * Prüffälle in `attachment-store.test.ts` und `repo-attachments.test.ts`) und
 * **nicht** das Aufräumen selbst als Datei-Vorgang.
 *
 * Gemessen wird:
 *
 *  1. **Riegel 0 (A-A-36) — die Artmenge des Bestands.** Führt der Bestand
 *     eine andere Menge an Anhangsarten als dieses Erzeugnis kennt, räumt der
 *     Lauf **gar nicht** auf — weder `listImages` noch `knownImageTargets`
 *     noch `removeImage` werden dann gerufen.
 *  2. **Riegel 1 — die Form/Antwort von `listImages`.** Eine leere Liste
 *     beendet den Lauf sofort, ohne den Bestand zu fragen.
 *  3. **Riegel 2 — nur eine Antwort ohne den Namen macht ihn zum Waisen.**
 *     Ein gefundener Name, den der Bestand kennt, wird NIE an `removeImage`
 *     übergeben.
 *  4. **Die Reihenfolge selbst ist ein Riegel:** Erst das Verzeichnis lesen,
 *     dann den Bestand fragen. Eine Zeile, die genau zwischen beiden
 *     Schritten entsteht, ist in der zweiten Antwort schon enthalten und
 *     überlebt — würde zuerst gefragt, träfe es die frische Kopie.
 *  5. **Riegel 3 — `removeImage` misst noch einmal** ist der Prüffall von
 *     `attachment-store.test.ts` (`unknown_name`); hier wird nur geprüft,
 *     dass `sweepOrphanedImages` dessen Rückgabewert korrekt auswertet
 *     (`failed` zählt nicht mit, `removed` schon).
 *  6. **Still, wenn nichts liegt / nichts entfernt wurde** — keine Zeile bei
 *     `removed === 0`, unabhängig davon, ob überhaupt etwas gefunden wurde.
 *  7. **Ein unlesbares Verzeichnis** (oder ein unerreichbarer Bestand)
 *     bricht den Lauf ab, ohne zu werfen: eine `warn`-Zeile mit dem Schlüssel
 *     `attachment_image_sweep_unavailable`, kein Pfad, kein `errno` (B-2.4).
 *  8. **Ein Abbruch mitten im Entfernen** verschluckt den bereits erzielten
 *     Fortschritt nicht: Die Zahl der bis dahin wirklich entfernten Kopien
 *     wird weiterhin gemeldet, zusätzlich zur Abbruchzeile — wörtlich der
 *     Kopfkommentar: "Verschluckt wird nichts: Der Abbruch bekommt seine
 *     Zeile, und die Zahl darunter sagt, wie weit es gekommen war."
 */
import { describe, expect, it } from 'vitest';
import { ATTACHMENT_KINDS } from '@takt/domain';

import { sweepOrphanedImages, type OrphanedImageSweep } from '../../src/usecases/image-sweep.ts';
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

/** Ruft nie auf, was der jeweilige Fall nicht erreichen darf. */
function darfNichtAufgerufenWerden(name: string): never {
  throw new Error(`darf in diesem Fall nicht aufgerufen werden: ${name}`);
}

/**
 * Genau die Artmenge, die dieses Erzeugnis kennt (A-A-36) — die einzige
 * Antwort von `attachmentKinds`, bei der der neue Riegel den Lauf überhaupt
 * weitermachen lässt. Aus `@takt/domain` und nicht abgeschrieben: Eine eigene
 * Liste hier wäre die zweite Wahrheit, die genau dann veraltet, wenn eine
 * fünfte Art dazukommt.
 */
const KNOWN_KINDS: readonly string[] = ATTACHMENT_KINDS;

describe('sweepOrphanedImages — Riegel 0 (A-A-36): die Artmenge des Bestands', () => {
  it('kennt der Bestand WENIGER Arten als dieses Erzeugnis, räumt der Lauf gar nicht auf', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return ['link', 'file']; // "image" fehlt
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return darfNichtAufgerufenWerden('listImages');
      },
      async knownImageTargets() {
        return darfNichtAufgerufenWerden('knownImageTargets');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe('attachment_image_sweep_unknown_kinds kinds=2 expected=3');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
    // Keine Art wird beim Namen genannt (B-2.4) -- weder "link" noch "file".
    expect(lines[0]?.message).not.toMatch(/link|file|image/);
  });

  it('kennt der Bestand eine ZUSÄTZLICHE, unbekannte Art, räumt der Lauf ebenfalls nicht auf', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return [...KNOWN_KINDS, 'screenshot'];
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return darfNichtAufgerufenWerden('listImages');
      },
      async knownImageTargets() {
        return darfNichtAufgerufenWerden('knownImageTargets');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.reason).toBe('attachment_image_sweep_unknown_kinds kinds=4 expected=3');
  });

  it('führt der Bestand genau die bekannte Artmenge, geht der Lauf normal weiter (kein Riegel, keine Zeile dafür)', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return [];
      },
      async knownImageTargets() {
        return darfNichtAufgerufenWerden('knownImageTargets');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toEqual([]);
  });

  it('attachmentKinds() wird VOR listImages() gerufen (Reihenfolge-Beleg)', async () => {
    const reihenfolge: string[] = [];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        reihenfolge.push('attachmentKinds');
        return ['link']; // unbekannte Menge -- der Lauf bricht danach ab
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        reihenfolge.push('listImages');
        return [];
      },
      async knownImageTargets() {
        reihenfolge.push('knownImageTargets');
        return new Set();
      },
      async removeImage() {
        reihenfolge.push('removeImage');
        return 'removed';
      },
    };
    const { logger } = recording();

    await sweepOrphanedImages(ports, logger);

    expect(reihenfolge).toEqual(['attachmentKinds']);
  });
});

describe('sweepOrphanedImages — Riegel 1: eine leere Verzeichnisliste beendet den Lauf sofort', () => {
  it('kein Bild im Verzeichnis: 0 zurück, der Bestand wird NICHT gefragt, keine Protokollzeile', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return [];
      },
      async knownImageTargets() {
        return darfNichtAufgerufenWerden('knownImageTargets');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedImages — Riegel 2: nur, was der Bestand NICHT kennt, wird zum Waisen', () => {
  it('ein gefundener Name, den der Bestand kennt, wird nie an removeImage übergeben', async () => {
    const bekannt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return [bekannt];
      },
      async knownImageTargets(names) {
        return new Set(names); // "der Bestand kennt alles, was gefunden wurde"
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toEqual([]);
  });

  it('gemischt: bekannte Namen bleiben unangetastet, nur die Waise wird entfernt', async () => {
    const bekannt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png';
    const waise = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg';
    const entfernteNamen: string[] = [];

    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return [bekannt, waise];
      },
      async knownImageTargets() {
        return new Set([bekannt]);
      },
      async removeImage(name) {
        entfernteNamen.push(name);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(entfernteNamen).toEqual([waise]);
    expect(removed).toBe(1);
    expect(lines).toEqual([
      expect.objectContaining({
        level: 'info',
        reason: 'attachment_image_orphans_removed files=1',
      }),
    ]);
  });

  it('ein "failed" von removeImage zählt NICHT mit — die eigene Protokollzeile schreibt der Adapter, nicht dieser Lauf', async () => {
    const waiseEins = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg';
    const waiseZwei = 'cccccccccccccccccccccccccccccccc.gif';

    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      // known.size ist hier 0 (keiner der beiden Funde ist "bekannt") -- der
      // Widerspruchsriegel (T-179 B-1) fragt in diesem Fall imageCount().
      // "0" heißt: kein Widerspruch, der Bestand führt tatsächlich keine
      // Bildanhänge, der Lauf darf normal weiterlaufen.
      async imageCount() {
        return 0;
      },
      async listImages() {
        return [waiseEins, waiseZwei];
      },
      async knownImageTargets() {
        return new Set();
      },
      async removeImage(name) {
        return name === waiseEins ? 'failed' : 'removed';
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(1);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_image_orphans_removed files=1' }),
    ]);
  });
});

describe('sweepOrphanedImages — die Reihenfolge selbst ist ein Riegel: erst das Verzeichnis, dann der Bestand', () => {
  it('eine Anhangszeile, die genau zwischen beiden Schritten entsteht, überlebt', async () => {
    // Simuliert die Sekunde zwischen "Datei liegt schon" und "Zeile ist
    // geschrieben": listImages() sieht die Datei zuerst, und GENAU in diesem
    // Moment (als Seiteneffekt seines Aufrufs) entsteht die Anhangszeile. Wird
    // knownImageTargets() -- wie im Produktivcode -- ERST DANACH gefragt,
    // sieht es die Zeile schon und die Kopie überlebt. Würde die Reihenfolge
    // vertauscht (erst fragen, dann lesen), fiele sie dem Aufräumen zum
    // Opfer -- das ist der Fall, den die Reihenfolge ausschließt.
    const frischeKopie = 'dddddddddddddddddddddddddddddddd.webp';
    let inzwischenAngelegt = false;

    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        inzwischenAngelegt = true;
        return [frischeKopie];
      },
      async knownImageTargets(names) {
        return inzwischenAngelegt ? new Set(names) : new Set();
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toEqual([]);
  });

  it('die Aufrufreihenfolge ist wörtlich listImages vor knownImageTargets', async () => {
    const reihenfolge: string[] = [];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        reihenfolge.push('listImages');
        return [];
      },
      async knownImageTargets(names) {
        reihenfolge.push('knownImageTargets');
        return new Set(names);
      },
      async removeImage() {
        reihenfolge.push('removeImage');
        return 'removed';
      },
    };
    const { logger } = recording();

    await sweepOrphanedImages(ports, logger);

    // Bei einer leeren Liste wird knownImageTargets gar nicht erst gerufen
    // (Riegel 1) -- die Reihenfolge zeigt sich deshalb erst mit Funden.
    expect(reihenfolge).toEqual(['listImages']);
  });
});

describe('sweepOrphanedImages — still, wenn nichts liegt oder nichts entfernt wurde', () => {
  it('etwas liegt, aber nichts ist verwaist: removed=0 und trotzdem keine Zeile', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return ['eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'];
      },
      async knownImageTargets(names) {
        return new Set(names);
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    expect(await sweepOrphanedImages(ports, logger)).toBe(0);
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedImages — ein unlesbares Verzeichnis bricht den Lauf ab, ohne zu werfen (B-2.4)', () => {
  it('listImages() wirft: 0 zurück, genau eine warn-Zeile mit dem richtigen Schlüssel, kein Pfad, kein errno', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        throw new Error('EACCES: permission denied, scandir "/geheim/attachments"');
      },
      async knownImageTargets() {
        return darfNichtAufgerufenWerden('knownImageTargets');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe('attachment_image_sweep_unavailable');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
    expect(lines[0]?.message).not.toMatch(/EACCES|geheim|errno|\//);
  });

  it('attachmentKinds() wirft (z. B. Bestand nicht erreichbar): derselbe Abbruch, keine Ausnahme dringt nach außen', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        throw new Error('SQLITE_BUSY');
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return darfNichtAufgerufenWerden('listImages');
      },
      async knownImageTargets() {
        return darfNichtAufgerufenWerden('knownImageTargets');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.reason).toBe('attachment_image_sweep_unavailable');
  });

  it('knownImageTargets() wirft (z. B. Bestand nicht erreichbar): derselbe Abbruch, keine Ausnahme dringt nach außen', async () => {
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return ['ffffffffffffffffffffffffffffffff.png'];
      },
      async knownImageTargets() {
        throw new Error('SQLITE_BUSY');
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.reason).toBe('attachment_image_sweep_unavailable');
  });

  it('ein Abbruch MITTEN im Entfernen verschluckt den bereits erzielten Fortschritt nicht', async () => {
    const bereitsEntfernt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png';
    const bricht = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      // known.size ist hier 0 -- ohne diese Antwort spräche der
      // Widerspruchsriegel (T-179 B-1) dazwischen, bevor der eigentlich zu
      // prüfende Abbruch überhaupt erreicht wird.
      async imageCount() {
        return 0;
      },
      async listImages() {
        return [bereitsEntfernt, bricht];
      },
      async knownImageTargets() {
        return new Set();
      },
      async removeImage(name) {
        if (name === bricht) throw new Error('EBUSY');
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    // Die eine Kopie, die VOR dem Abbruch entfernt wurde, zählt weiterhin.
    expect(removed).toBe(1);
    // Beide Zeilen stehen da: die Abbruchzeile UND die Fortschrittszeile --
    // "die Zahl darunter sagt, wie weit es gekommen war" (Kopfkommentar).
    expect(lines).toEqual([
      expect.objectContaining({ level: 'warn', reason: 'attachment_image_sweep_unavailable' }),
      expect.objectContaining({
        level: 'info',
        reason: 'attachment_image_orphans_removed files=1',
      }),
    ]);
  });
});

// -----------------------------------------------------------------------
// T-174 (unit-tester) — der Widerspruchsriegel aus T-179 B-1, ergänzt in
// `image-sweep.ts` während dieser Aufgabe entstand: Antwortet
// `knownImageTargets` mit einer LEEREN Menge, obwohl etwas gefunden wurde,
// widerlegt der Lauf diese Antwort erst, bevor er ihr traut — er fragt
// `imageCount()`, und nur wenn der Bestand insgesamt auch keine Bildanhänge
// führt, gilt die leere Antwort als plausibel. `imageCount()` wird
// AUSSCHLIESSLICH in diesem einen Fall gerufen (known.size === 0) — jede
// Attrappe in den Gruppen oben, bei der das nicht zutrifft, wirft bei einem
// Aufruf und bestätigt damit indirekt, dass er unterbleibt.
// -----------------------------------------------------------------------
describe('sweepOrphanedImages — der Widerspruchsriegel (T-179 B-1): eine leere Bestandsantwort wird widerlegt, bevor sie gilt', () => {
  it('knownImageTargets ist leer UND der Bestand führt insgesamt Bildanhänge: Widerspruch, der Lauf räumt gar nicht auf', async () => {
    const gefunden = ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg'];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        // Der Bestand führt sehr wohl Bildanhänge (5) -- nur keiner davon
        // passt zu den beiden gefundenen Namen. Das ist der Widerspruch.
        return 5;
      },
      async listImages() {
        return gefunden;
      },
      async knownImageTargets() {
        return new Set();
      },
      async removeImage() {
        return darfNichtAufgerufenWerden('removeImage');
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe('attachment_image_sweep_contradiction files=2 attachments=5');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
    // Kein erzeugter Dateiname in der Meldung (B-2.4) -- nur die zwei Zahlen.
    expect(lines[0]?.message).not.toMatch(/\.(png|jpg|gif|webp)/);
  });

  it('knownImageTargets ist leer, UND der Bestand führt insgesamt auch keine Bildanhänge: kein Widerspruch, alle Funde werden entfernt', async () => {
    const verwaist = ['cccccccccccccccccccccccccccccccc.gif', 'dddddddddddddddddddddddddddddddd.webp'];
    const entfernteNamen: string[] = [];
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return 0;
      },
      async listImages() {
        return verwaist;
      },
      async knownImageTargets() {
        return new Set();
      },
      async removeImage(name) {
        entfernteNamen.push(name);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(entfernteNamen).toEqual(verwaist);
    expect(removed).toBe(2);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_image_orphans_removed files=2' }),
    ]);
  });

  it('knownImageTargets kennt WENIGSTENS einen gefundenen Namen: imageCount() wird gar nicht erst gerufen', async () => {
    const bekannt = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
    const waise = 'ffffffffffffffffffffffffffffffff.jpg';
    const ports: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async imageCount() {
        return darfNichtAufgerufenWerden('imageCount');
      },
      async listImages() {
        return [bekannt, waise];
      },
      async knownImageTargets() {
        return new Set([bekannt]); // Größe 1, NICHT leer
      },
      async removeImage(name) {
        return name === waise ? 'removed' : darfNichtAufgerufenWerden('removeImage(' + name + ')');
      },
    };
    const { logger } = recording();

    const removed = await sweepOrphanedImages(ports, logger);

    expect(removed).toBe(1);
  });
});
