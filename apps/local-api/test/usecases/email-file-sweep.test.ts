/**
 * Takt — T-316 (unit-tester): der Aufräumlauf für übernommene E-Mail-Dateien
 * (A-A-83, A-A-98, E-111, T-313, T-314-domain-dev.md).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Datei fehlte
 * ---------------------------------------------------------------------------
 *
 * `apps/local-api/src/features/todos/email-file-sweep.ts` entstand in T-314
 * als Gegenmittel zu R-29 ("Der Lauf, der löscht") und hatte laut
 * T-314-domain-dev.md Abschnitt 7 **null** Prüffälle — derselbe Zustand, in
 * dem `image-sweep.ts` bis T-174 stand, mit demselben Risiko: ein Lauf, der
 * ohne Rückfrage Kundendaten entfernt, ungeprüft.
 *
 * ---------------------------------------------------------------------------
 * Was hier gemessen wird — nach dem Vorbild von image-sweep.test.ts
 * ---------------------------------------------------------------------------
 *
 * `sweepOrphanedEmailFiles` ist bewusst gegen sieben schmale Funktionen
 * gebaut, nicht gegen einen Port oder einen laufenden Dienst. Diese Datei
 * nutzt genau das: Attrappen ohne Dateisystem und ohne SQLite.
 *
 *  1. **Riegel 0 (A-A-36)** — eine unbekannte Artmenge räumt gar nicht auf.
 *  2. **Riegel 1** — eine leere Verzeichnisliste beendet den Lauf sofort.
 *  3. **`pathOf` filtert vor jeder Frage** — ein Name ohne auflösbaren Pfad
 *     kommt in keiner Richtung wieder vor.
 *  4. **Ohne Waise wird nicht gefragt** — `folder`/`attachmentNamesUnder`/
 *     `emailFileCount` werden erst gerufen, sobald überhaupt etwas fallen
 *     würde (orphans.length > 0). Das ist der Riegel, an dem T-313-2 hing:
 *     Eine unvollständige Zuordnung allein blockiert nichts.
 *  5. **Der Widerspruchsriegel feuert auf ZWEI Achsen, unabhängig
 *     voneinander** — und, das ist der wichtigste Einzelfall in dieser Datei
 *     (T-314-domain-dev.md Abschnitt 2, "der vorletzte Fall"): er feuert auch
 *     bei einer NICHT LEEREN Eigentümermenge (`owned: 1`, nicht `0`). Der
 *     alte Riegel hing an `known.size === 0` und konnte genau diesen Fall
 *     nicht sehen (T-313-1).
 *  6. **`no_folder`** — kein Ordner bestimmbar, sobald eine Waise vorläge.
 *  7. **Reihenfolge**: erst das Verzeichnis, dann der Bestand; die beiden
 *     Gegenfragen erst, wenn eine Waise vorläge.
 *  8. **Abbruch mitten im Entfernen** verschluckt den erzielten Fortschritt
 *     nicht (B-2.4: keine Namen im Protokoll).
 */
import { describe, expect, it } from 'vitest';
import { ATTACHMENT_KINDS } from '@takt/domain';

import {
  sweepOrphanedEmailFiles,
  type EmailFileSweepReport,
  type OrphanedEmailFileSweep,
} from '../../src/features/todos/email-file-sweep.ts';
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
function niemalsGerufenePorts(): OrphanedEmailFileSweep {
  return {
    async attachmentKinds() {
      return darfNichtAufgerufenWerden('attachmentKinds');
    },
    folder() {
      return darfNichtAufgerufenWerden('folder');
    },
    async listEmailFiles() {
      return darfNichtAufgerufenWerden('listEmailFiles');
    },
    pathOf() {
      return darfNichtAufgerufenWerden('pathOf');
    },
    async attachmentsNamingFiles() {
      return darfNichtAufgerufenWerden('attachmentsNamingFiles');
    },
    async attachmentNamesUnder() {
      return darfNichtAufgerufenWerden('attachmentNamesUnder');
    },
    async emailFileCount() {
      return darfNichtAufgerufenWerden('emailFileCount');
    },
    async removeEmailFile() {
      return darfNichtAufgerufenWerden('removeEmailFile');
    },
  };
}

describe('sweepOrphanedEmailFiles — Riegel 0 (A-A-36): die Artmenge des Bestands', () => {
  it('kennt der Bestand eine ANDERE Artmenge, räumt der Lauf gar nicht auf — kein weiterer Port wird gerufen', async () => {
    const ports: OrphanedEmailFileSweep = {
      ...niemalsGerufenePorts(),
      async attachmentKinds() {
        return ['link', 'file']; // "image" fehlt
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({
      read: 0,
      owned: 0,
      removed: 0,
      refused: 'unknown_kinds',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe('attachment_email_sweep_unknown_kinds kinds=2');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
  });

  it('führt der Bestand genau die bekannte Artmenge, geht der Lauf normal weiter', async () => {
    const ports: OrphanedEmailFileSweep = {
      ...niemalsGerufenePorts(),
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async listEmailFiles() {
        return [];
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 0, owned: 0, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedEmailFiles — Riegel 1: eine leere Verzeichnisliste beendet den Lauf sofort', () => {
  it('keine Datei im Verzeichnis: der Bestand wird NICHT gefragt, keine Protokollzeile', async () => {
    const ports: OrphanedEmailFileSweep = {
      ...niemalsGerufenePorts(),
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      async listEmailFiles() {
        return [];
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 0, owned: 0, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedEmailFiles — pathOf filtert VOR jeder Frage an den Bestand', () => {
  it('ein Name ohne auflösbaren Pfad wird weder gefragt noch entfernt — "read" zählt ihn trotzdem', async () => {
    const auflösbar = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml';
    const nicht = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listEmailFiles() {
        return [auflösbar, nicht];
      },
      pathOf(name) {
        return name === auflösbar ? `C:\\App\\email-attachments\\${name}` : null;
      },
      async attachmentsNamingFiles(names) {
        // Nur der auflösbare Name darf hier ankommen.
        expect(names).toEqual([auflösbar]);
        return new Set(names);
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async emailFileCount() {
        return darfNichtAufgerufenWerden('emailFileCount');
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 2, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });

  it('KEIN gefundener Name hat einen auflösbaren Pfad: owned bleibt 0, der Bestand wird gar nicht gefragt', async () => {
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listEmailFiles() {
        return ['cccccccccccccccccccccccccccccccc.eml'];
      },
      pathOf() {
        return null;
      },
      async attachmentsNamingFiles() {
        return darfNichtAufgerufenWerden('attachmentsNamingFiles');
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async emailFileCount() {
        return darfNichtAufgerufenWerden('emailFileCount');
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 1, owned: 0, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedEmailFiles — ohne Waise wird NICHT gefragt (T-313-2: eine unvollständige Zuordnung allein blockiert nichts)', () => {
  it('jeder gefundene Name hat einen Eigentümer: folder/attachmentNamesUnder/emailFileCount werden NICHT gerufen', async () => {
    const bekannt = 'dddddddddddddddddddddddddddddddd.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listEmailFiles() {
        return [bekannt];
      },
      pathOf(name) {
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names); // "alles hat einen Eigentümer"
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async emailFileCount() {
        return darfNichtAufgerufenWerden('emailFileCount');
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 1, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedEmailFiles — der Widerspruchsriegel: ZWEI Achsen, gestellt sobald überhaupt eine Waise vorläge', () => {
  it('eine echte Waise, kein Widerspruch auf beiden Achsen: sie wird entfernt', async () => {
    const bekannt = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.eml';
    const waise = 'ffffffffffffffffffffffffffffffff.eml';
    const entfernt: string[] = [];
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        return [bekannt, waise];
      },
      pathOf(name) {
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names.filter((name) => name === bekannt));
      },
      async attachmentNamesUnder() {
        // Der Bestand erwartet genau den bekannten Namen in diesem Ordner --
        // kein "missing".
        return new Set([bekannt]);
      },
      async emailFileCount() {
        return 1;
      },
      async removeEmailFile(target) {
        entfernt.push(target);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 2, owned: 1, removed: 1, refused: null });
    expect(entfernt).toEqual([`C:\\App\\email-attachments\\${waise}`]);
    expect(lines).toEqual([
      expect.objectContaining({
        level: 'info',
        reason: 'attachment_email_orphans_removed files=1',
      }),
    ]);
  });

  it('DIE WICHTIGSTE MESSUNG (T-314 Abschnitt 2): der Riegel feuert auch bei NICHT LEERER Eigentümermenge (owned=1, nicht 0)', async () => {
    // Der Bestand erwartet einen Namen in diesem Ordner, der dort NICHT liegt
    // -- zusammen mit einer echten Waise ist das der Widerspruch. Der alte
    // Riegel (T-313-1) hing an "known.size === 0" und hätte diesen Fall NICHT
    // gesehen, weil hier bereits ein Name zugeordnet werden konnte.
    const bekannt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml';
    const waise = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.eml';
    const erwartetAberFehlend = 'cccccccccccccccccccccccccccccccc.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        return [bekannt, waise];
      },
      pathOf(name) {
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles(names) {
        return new Set(names.filter((name) => name === bekannt)); // owned.size === 1, NICHT 0
      },
      async attachmentNamesUnder() {
        // Der Bestand nennt einen dritten Namen in diesem Ordner, der gar
        // nicht gefunden wurde -- "missing" > 0.
        return new Set([bekannt, erwartetAberFehlend]);
      },
      async emailFileCount() {
        // Beide Gegenfragen werden IMMER gestellt (Kopfkommentar: "und beide
        // werden immer gestellt") -- die erste Achse allein entscheidet
        // bereits über den Widerspruch, aber der Aufruf selbst unterbleibt
        // nicht.
        return 0;
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({
      read: 2,
      owned: 1,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe(
      'attachment_email_sweep_contradiction files=2 owned=1 orphans=1 expected=2 missing=1 attachments=0',
    );
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
    // Keine erzeugten Namen im Protokoll (B-2.4).
    expect(lines[0]?.message).not.toMatch(/\.eml/);
  });

  it('zweite Achse — "blind": der Bestand führt übernommene Dateien, findet aber weder am Namen noch am Ordner eine einzige wieder', async () => {
    const waise = 'dddddddddddddddddddddddddddddddd.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        return [waise];
      },
      pathOf(name) {
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles() {
        return new Set(); // niemand nennt diesen Namen
      },
      async attachmentNamesUnder() {
        return new Set(); // der Ordner erwartet ebenfalls nichts
      },
      async emailFileCount() {
        return 3; // der Bestand fuehrt trotzdem uebernommene Dateien -- Widerspruch
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({
      read: 1,
      owned: 0,
      removed: 0,
      refused: 'contradiction',
    });
    expect(lines[0]?.reason).toBe(
      'attachment_email_sweep_contradiction files=1 owned=0 orphans=1 expected=0 missing=0 attachments=3',
    );
  });

  it('Gegenprobe zur zweiten Achse: emailFileCount() ist 0 -- kein Widerspruch, die Waise wird entfernt', async () => {
    const waise = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.eml';
    const entfernt: string[] = [];
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        return [waise];
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
      async removeEmailFile(target) {
        entfernt.push(target);
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 1, owned: 0, removed: 1, refused: null });
    expect(entfernt).toEqual([`C:\\App\\email-attachments\\${waise}`]);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_email_orphans_removed files=1' }),
    ]);
  });
});

describe('sweepOrphanedEmailFiles — no_folder: kein Ordner bestimmbar, sobald eine Waise vorläge', () => {
  it('folder() ist null: der Lauf verweigert, entfernt nichts, und emailFileCount/attachmentNamesUnder werden NICHT gerufen', async () => {
    const waise = 'ffffffffffffffffffffffffffffffff.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return null;
      },
      async listEmailFiles() {
        return [waise];
      },
      pathOf(name) {
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles() {
        return new Set();
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async emailFileCount() {
        return darfNichtAufgerufenWerden('emailFileCount');
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({
      read: 1,
      owned: 0,
      removed: 0,
      refused: 'no_folder',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('warn');
    expect(lines[0]?.reason).toBe('attachment_email_sweep_no_folder files=1');
    expect(lines[0]?.reason).not.toBe(UNCLASSIFIED_REASON);
  });
});

describe('sweepOrphanedEmailFiles — Reihenfolge: erst das Verzeichnis, dann der Bestand, die Gegenfragen zuletzt', () => {
  it('attachmentKinds -> listEmailFiles -> pathOf -> attachmentsNamingFiles -> folder -> attachmentNamesUnder -> emailFileCount -> removeEmailFile', async () => {
    const reihenfolge: string[] = [];
    const waise = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        reihenfolge.push('attachmentKinds');
        return KNOWN_KINDS;
      },
      folder() {
        reihenfolge.push('folder');
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        reihenfolge.push('listEmailFiles');
        return [waise];
      },
      pathOf(name) {
        reihenfolge.push('pathOf');
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles() {
        reihenfolge.push('attachmentsNamingFiles');
        return new Set();
      },
      async attachmentNamesUnder() {
        reihenfolge.push('attachmentNamesUnder');
        return new Set();
      },
      async emailFileCount() {
        reihenfolge.push('emailFileCount');
        return 0;
      },
      async removeEmailFile() {
        reihenfolge.push('removeEmailFile');
        return 'removed';
      },
    };
    const { logger } = recording();

    await sweepOrphanedEmailFiles(ports, logger);

    expect(reihenfolge).toEqual([
      'attachmentKinds',
      'listEmailFiles',
      'pathOf',
      'attachmentsNamingFiles',
      'folder',
      'attachmentNamesUnder',
      'emailFileCount',
      'removeEmailFile',
    ]);
  });

  it('eine Zeile, die genau zwischen Verzeichnislesen und Bestandsfrage entsteht, überlebt', async () => {
    const frisch = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.eml';
    let inzwischenAngelegt = false;
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listEmailFiles() {
        inzwischenAngelegt = true;
        return [frisch];
      },
      pathOf(name) {
        return `C:\\App\\email-attachments\\${name}`;
      },
      async attachmentsNamingFiles(names) {
        return inzwischenAngelegt ? new Set(names) : new Set();
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async emailFileCount() {
        return darfNichtAufgerufenWerden('emailFileCount');
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({ read: 1, owned: 1, removed: 0, refused: null });
    expect(lines).toEqual([]);
  });
});

describe('sweepOrphanedEmailFiles — ein Abbruch mitten im Entfernen verschluckt den erzielten Fortschritt nicht (B-2.4)', () => {
  it('ein "failed" von removeEmailFile zählt NICHT mit', async () => {
    const waiseEins = 'cccccccccccccccccccccccccccccccc.eml';
    const waiseZwei = 'dddddddddddddddddddddddddddddddd.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        return [waiseEins, waiseZwei];
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
      async removeEmailFile(target) {
        return target.endsWith(waiseEins) ? 'failed' : 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report.removed).toBe(1);
    expect(lines).toEqual([
      expect.objectContaining({ reason: 'attachment_email_orphans_removed files=1' }),
    ]);
  });

  it('ein werfender Schritt bricht ab, ohne nach außen zu werfen — die Zahl bis dahin bleibt erhalten', async () => {
    const bereitsEntfernt = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.eml';
    const bricht = 'ffffffffffffffffffffffffffffffff.eml';
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        return KNOWN_KINDS;
      },
      folder() {
        return 'C:\\App\\email-attachments';
      },
      async listEmailFiles() {
        return [bereitsEntfernt, bricht];
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
      async removeEmailFile(target) {
        if (target.endsWith(bricht)) throw new Error('EBUSY');
        return 'removed';
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({
      read: 2,
      owned: 0,
      removed: 1,
      refused: 'unavailable',
    });
    expect(lines).toEqual([
      expect.objectContaining({ level: 'warn', reason: 'attachment_email_sweep_unavailable files=2 removed=1' }),
    ]);
    // Kein Pfad, kein technischer Fehlercode in der Meldung (B-2.4).
    expect(lines[0]?.message).not.toMatch(/EBUSY|C:\\|errno/i);
  });

  it('attachmentKinds() wirft: derselbe Abbruch, keine Ausnahme dringt nach außen', async () => {
    const ports: OrphanedEmailFileSweep = {
      async attachmentKinds() {
        throw new Error('SQLITE_BUSY');
      },
      folder() {
        return darfNichtAufgerufenWerden('folder');
      },
      async listEmailFiles() {
        return darfNichtAufgerufenWerden('listEmailFiles');
      },
      pathOf() {
        return darfNichtAufgerufenWerden('pathOf');
      },
      async attachmentsNamingFiles() {
        return darfNichtAufgerufenWerden('attachmentsNamingFiles');
      },
      async attachmentNamesUnder() {
        return darfNichtAufgerufenWerden('attachmentNamesUnder');
      },
      async emailFileCount() {
        return darfNichtAufgerufenWerden('emailFileCount');
      },
      async removeEmailFile() {
        return darfNichtAufgerufenWerden('removeEmailFile');
      },
    };
    const { logger, lines } = recording();

    const report = await sweepOrphanedEmailFiles(ports, logger);

    expect(report).toEqual<EmailFileSweepReport>({
      read: 0,
      owned: 0,
      removed: 0,
      refused: 'unavailable',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.reason).toBe('attachment_email_sweep_unavailable files=0 removed=0');
  });
});
