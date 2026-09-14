/**
 * Takt — T-317 (unit-tester): das gemeinsame Verfahren `sweepOrphanedBlobs`
 * (A-A-18, A-A-36, A-A-83, A-A-98, E-111, T-315).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei entstand
 * ---------------------------------------------------------------------------
 *
 * Bis T-315 gab es zwei Abschriften desselben Verfahrens — eine für Bildkopien
 * (`image-sweep.ts`), eine für übernommene E-Mail-Dateien
 * (`email-file-sweep.ts`). T-314 berichtigte die eine, die andere blieb mit
 * ihren Fehlern stehen, und drei von vier gemessenen Löschwegen lagen danach
 * ausschließlich in der stehengebliebenen Abschrift. T-315 hat daraus **ein**
 * Verfahren gemacht: `sweepOrphanedBlobs` in `orphan-sweep.ts`.
 *
 * `image-sweep.test.ts` und `email-file-sweep.test.ts` prüfen `sweepOrphanedImages`
 * und `sweepOrphanedEmailFiles` je für sich — beide rufen aber intern
 * dasselbe `sweepOrphanedBlobs`. Diese Datei prüft **das Verfahren selbst**,
 * unabhängig davon, welcher der beiden Läufe es aufruft:
 *
 *  1. **Dieselbe Prozedur, zwei Aufrufer** — bei strukturell gleichwertigen
 *     Eingaben liefern `sweepOrphanedImages` und `sweepOrphanedEmailFiles`
 *     strukturell denselben Bericht (bis auf den ordnerspezifischen
 *     Protokolltext). Eine künftige Abschrift, die nur einen der beiden Läufe
 *     ändert, fällt hier auf.
 *  2. **Die Verschärfung `claimed > owned` (T-315)** direkt am Verfahren
 *     gemessen, mit einem dritten, generischen Aufrufer — der Beleg, dass sie
 *     im Verfahren selbst liegt und nicht in einer der beiden Abschriften
 *     zufällig gleich ausgefallen ist.
 */
import { describe, expect, it } from 'vitest';
import { ATTACHMENT_KINDS } from '@takt/domain';

import {
  sweepOrphanedBlobs,
  type OrphanSweepPorts,
  type OrphanSweepReport,
  type OrphanSweepVoice,
} from '../../src/features/todos/orphan-sweep.ts';
import { sweepOrphanedImages, type OrphanedImageSweep } from '../../src/features/todos/image-sweep.ts';
import {
  sweepOrphanedEmailFiles,
  type OrphanedEmailFileSweep,
} from '../../src/features/todos/email-file-sweep.ts';
import { createLogger, type Logger } from '../../src/logger.ts';

interface Recorded {
  readonly logger: Logger;
  readonly lines: { level: string; message: string; reason?: string }[];
}

function recording(): Recorded {
  const lines: { level: string; message: string; reason?: string }[] = [];
  const logger = createLogger((line) => lines.push(JSON.parse(line) as never));
  return { logger, lines };
}

const KNOWN_KINDS: readonly string[] = ATTACHMENT_KINDS;

const TEST_VOICE: OrphanSweepVoice = Object.freeze({
  sweepKey: 'attachment_test_sweep',
  removedKey: 'attachment_test_orphans_removed',
  unknownKinds: 'unbekannte Arten',
  noFolder: 'kein Ordner',
  contradiction: 'Widerspruch',
  unavailable: 'abgebrochen',
  removed: (count: number) => `${String(count)} entfernt`,
});

describe('sweepOrphanedBlobs — dieselbe Prozedur trägt beide Läufe', () => {
  it('bei strukturell gleichwertigen Eingaben melden sweepOrphanedImages und sweepOrphanedEmailFiles denselben Bericht', async () => {
    const waise = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    const imagePorts: OrphanedImageSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      async listImages() {
        return [`${waise}.png`];
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
      async removeImage() {
        return 'removed';
      },
    };
    const emailPorts: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        return [`${waise}.eml`];
      },
      pathOf(name) {
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles() {
        return new Set();
      },
      async attachmentNamesUnder() {
        return new Set();
      },
      async emailFileCount() {
        return 0;
      },
      async removeEmailFile() {
        return 'removed';
      },
    };

    const imageReport = await sweepOrphanedImages(imagePorts, recording().logger);
    const emailReport = await sweepOrphanedEmailFiles(emailPorts, recording().logger);

    // Dieselben Zahlen, derselbe Verweigerungsgrund (null) -- unabhängig
    // davon, welcher der beiden Läufe sie erzeugt hat.
    expect(imageReport).toEqual<OrphanSweepReport>({
      read: 1,
      owned: 0,
      removed: 1,
      refused: null,
    });
    expect(emailReport).toEqual<OrphanSweepReport>(imageReport);
  });

  it('unknown_kinds trifft beide Läufe an derselben Stelle, mit demselben Verweigerungsgrund', async () => {
    const fremdeArten = ['link', 'file']; // "image" fehlt bei beiden

    const imageReport = await sweepOrphanedImages(
      {
        async attachmentKinds() {
          return fremdeArten;
        },
        folder() {
          throw new Error('darf nicht gerufen werden');
        },
        async listImages() {
          throw new Error('darf nicht gerufen werden');
        },
        imageNameOf() {
          throw new Error('darf nicht gerufen werden');
        },
        async attachmentsNamingFiles() {
          throw new Error('darf nicht gerufen werden');
        },
        async attachmentNamesUnder() {
          throw new Error('darf nicht gerufen werden');
        },
        async imageCount() {
          throw new Error('darf nicht gerufen werden');
        },
        async removeImage() {
          throw new Error('darf nicht gerufen werden');
        },
      },
      recording().logger,
    );
    const emailReport = await sweepOrphanedEmailFiles(
      {
        async attachmentKinds() {
          return fremdeArten;
        },
        folder() {
          throw new Error('darf nicht gerufen werden');
        },
        async listEmailFiles() {
          throw new Error('darf nicht gerufen werden');
        },
        pathOf() {
          throw new Error('darf nicht gerufen werden');
        },
        async attachmentsNamingFiles() {
          throw new Error('darf nicht gerufen werden');
        },
        async attachmentNamesUnder() {
          throw new Error('darf nicht gerufen werden');
        },
        async emailFileCount() {
          throw new Error('darf nicht gerufen werden');
        },
        async removeEmailFile() {
          throw new Error('darf nicht gerufen werden');
        },
      },
      recording().logger,
    );

    expect(imageReport.refused).toBe('unknown_kinds');
    expect(emailReport.refused).toBe('unknown_kinds');
    expect(imageReport).toEqual<OrphanSweepReport>(emailReport);
  });
});

describe('sweepOrphanedBlobs — die Verschärfung "claimed > owned" (T-315), am Verfahren selbst gemessen', () => {
  function portsFor(config: {
    readonly gefunden: readonly string[];
    readonly eigentuemer: ReadonlySet<string>;
    readonly erwartetUnterOrdner: ReadonlySet<string>;
    readonly beansprucht: number;
  }): OrphanSweepPorts {
    return {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      list: async () => config.gefunden,
      handleOf: (name) => name,
      attachmentsNamingFiles: async () => new Set(config.eigentuemer),
      attachmentNamesUnder: async () => new Set(config.erwartetUnterOrdner),
      claimedCount: async () => config.beansprucht,
      remove: async () => {
        throw new Error('darf in diesem Fall nicht aufgerufen werden: remove');
      },
    };
  }

  it('zehn gefundene Dateien, EINE zugeordnet: claimed(10) > owned(1) feuert — gegen "owned === 0" hätte er geschwiegen', async () => {
    const bekannt = '00000000000000000000000000000000';
    const rest = Array.from({ length: 9 }, (_, i) => `${String(i + 1).repeat(32)}`);
    const ports = portsFor({
      gefunden: [bekannt, ...rest],
      eigentuemer: new Set([bekannt]),
      erwartetUnterOrdner: new Set(),
      beansprucht: 10,
    });
    const { logger, lines } = recording();

    const report = await sweepOrphanedBlobs(ports, TEST_VOICE, logger);

    expect(report).toEqual<OrphanSweepReport>({
      read: 10,
      owned: 1,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines[0]?.reason).toBe(
      'attachment_test_sweep_contradiction files=10 owned=1 orphans=9 expected=0 missing=0 attachments=10',
    );
  });

  it('Gegenprobe: claimed(1) === owned(1) -- kein Widerspruch, die neun tatsächlichen Waisen fallen', async () => {
    const bekannt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const waisen = Array.from({ length: 9 }, (_, i) => `${String(i + 1).repeat(32)}b`);
    let entfernt = 0;
    const ports: OrphanSweepPorts = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\attachments';
      },
      list: async () => [bekannt, ...waisen],
      handleOf: (name) => name,
      attachmentsNamingFiles: async () => new Set([bekannt]),
      attachmentNamesUnder: async () => new Set(),
      claimedCount: async () => 1, // claimed === owned -- kein Widerspruch
      remove: async () => {
        entfernt += 1;
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedBlobs(ports, TEST_VOICE, logger);

    expect(report).toEqual<OrphanSweepReport>({ read: 10, owned: 1, removed: 9, refused: null });
    expect(entfernt).toBe(9);
    expect(lines).toEqual([expect.objectContaining({ reason: 'attachment_test_orphans_removed files=9' })]);
  });
});
