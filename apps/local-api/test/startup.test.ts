/**
 * Takt — T-132: Der Startabbruch nennt seinen Grund, und zwar pfadfrei.
 *
 * ===========================================================================
 * Anlass
 * ===========================================================================
 *
 * Am 2026-09-04 um 18:57 startete Takt nicht. Der Sidecar schrieb genau eine
 * Zeile:
 *
 *     {"ts":"2026-09-04T18:57:44.365Z","level":"error","message":"Der
 *      Datenbestand konnte nicht auf den Stand dieser Fassung gebracht werden.
 *      Takt startet nicht."}
 *
 * Ein zweiter Anlauf lief durch. Der Grund war nie zu ermitteln, weil
 * `main.ts` ihn mit `catch {` ohne Bindung wegwarf.
 *
 * ===========================================================================
 * Was hier gemessen wird
 * ===========================================================================
 *
 * 1. **Die Unterscheidung.** Jeder Grund ergibt einen eigenen Schlüssel im
 *    Protokoll. Ein Prüffall, der nur misst, dass überhaupt etwas
 *    protokolliert wird, hätte den Befund nicht verhindert — deshalb steht
 *    unten kein `toContain('error')`, sondern ein Vergleich der Schlüssel
 *    untereinander.
 * 2. **Die Pfadfreiheit.** Über den vollständigen Vorrat der Gründe wird
 *    gemessen, dass weder Satz noch Schlüssel einen Pfadtrenner, einen
 *    Dateinamen oder einen Benutzernamen tragen kann. Das ist die Zusage, die
 *    B-2.4 verlangt — und der einzige Grund, aus dem der Wurf ursprünglich
 *    weggeworfen wurde.
 * 3. **Der Riegel im Protokollierer.** Ein Grund in falscher Gestalt wird
 *    nicht ausgegeben, sondern durch `unclassified` ersetzt. Damit hängt die
 *    Zusage nicht an der Sorgfalt künftiger Aufrufstellen.
 *
 * Der ganze Lauf kommt **ohne laufenden Dienst** aus: `bringDatabaseUpToDate`
 * nimmt zwei Schnittstellen entgegen und fasst nichts an, was es nur zur
 * Laufzeit gibt.
 *
 * ---------------------------------------------------------------------------
 * Übergabe an unit-tester (T-132)
 * ---------------------------------------------------------------------------
 * Diese Datei liegt in seiner Hoheit und wurde vom domain-dev angelegt, weil
 * die Aufgabe die Prüffälle ausdrücklich verlangt. Sie ist als Übernahme
 * gedacht, nicht als Doppelung.
 */
import { describe, expect, it } from 'vitest';

import { migrationFailure, type MigrationFailureReason, type MigrationState } from '@takt/storage';

import { createLogger, UNCLASSIFIED_REASON, type Logger } from '../src/logger.ts';
import {
  bringDatabaseUpToDate,
  describeMigrationFailure,
  describeStoreOpenFailure,
  type MigrationStep,
} from '../src/startup.ts';

// ---------------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------------

interface Recorded {
  readonly logger: Logger;
  readonly lines: { level: string; message: string; reason?: string }[];
}

/** Ein Protokollierer, der seine Zeilen behält — die echte Ausgabe, nur abgefangen. */
function recording(): Recorded {
  const lines: { level: string; message: string; reason?: string }[] = [];
  const logger = createLogger((line) => lines.push(JSON.parse(line) as never));
  return { logger, lines };
}

/** Ein Läufer, der einen vorgegebenen Wurf wirft. */
function throwing(error: unknown): MigrationStep {
  return {
    state: () => Promise.resolve({ kind: 'current', version: 12 } satisfies MigrationState),
    migrateToLatest: () => Promise.reject(error),
  };
}

const failure = (reason: MigrationFailureReason): Error =>
  migrationFailure(reason, 'Meldung mit /home/jemand/.local/share/takt/takt.db darin');

/**
 * Welche Zweige es gibt — **vom Übersetzer geprüft**.
 *
 * `satisfies Record<…, true>` wird rot, sobald die Domäne einen Zweig ergänzt,
 * der hier fehlt. Ohne diese Zeile bliebe die Liste unten still unvollständig,
 * und die Pfadfreiheit wäre für den neuen Zweig ungemessen — genau der stille
 * Rückfall, gegen den T-132 geschrieben ist.
 */
const ZWEIGE = {
  checksum_mismatch: true,
  database_too_new: true,
  database_busy: true,
  state_unreadable: true,
  backup_failed: true,
  migration_failed: true,
  no_way_back: true,
  embedded_drift: true,
  unknown: true,
} satisfies Record<MigrationFailureReason['kind'], true>;

/**
 * Der **vollständige** Vorrat der Gründe, mit ungünstigen Werten.
 *
 * Die Zahlen sind absichtlich groß und die Schlüssel absichtlich lang: Was
 * hier durchkommt, kommt auch mit ungünstigen Werten durch. Dass jeder Zweig
 * aus {@link ZWEIGE} vorkommt, wird unten gemessen.
 */
const ALLE_GRUENDE: readonly MigrationFailureReason[] = [
  { kind: 'checksum_mismatch', version: 12 },
  { kind: 'database_too_new', database: 4711, known: 12 },
  { kind: 'database_busy', sqlite: 5 },
  { kind: 'database_busy', sqlite: null },
  { kind: 'state_unreadable', code: 'ERR_SQLITE_ERROR', sqlite: 11 },
  { kind: 'state_unreadable', code: null, sqlite: null },
  { kind: 'backup_failed', from: 12, code: 'ENOSPC', sqlite: null },
  { kind: 'backup_failed', from: 0, code: null, sqlite: 14 },
  { kind: 'migration_failed', version: 13, direction: 'up', code: 'ERR_SQLITE_ERROR', sqlite: 19 },
  { kind: 'migration_failed', version: 6, direction: 'down', code: null, sqlite: null },
  { kind: 'no_way_back', version: 13 },
  { kind: 'embedded_drift' },
  { kind: 'unknown', code: 'ENOENT', sqlite: null },
  { kind: 'unknown', code: null, sqlite: 26 },
];

// ---------------------------------------------------------------------------

describe('T-132 — der Grund wird unterschieden', () => {
  it('checksum_mismatch nennt die Fassung', async () => {
    const { logger, lines } = recording();
    const ok = await bringDatabaseUpToDate(
      throwing(failure({ kind: 'checksum_mismatch', version: 12 })),
      logger,
    );

    expect(ok).toBe(false);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('error');
    expect(lines[0]?.reason).toBe('checksum_mismatch version=12');
  });

  it('database_too_new nennt beide Fassungen', async () => {
    const { logger, lines } = recording();
    await bringDatabaseUpToDate(
      throwing(failure({ kind: 'database_too_new', database: 13, known: 12 })),
      logger,
    );
    expect(lines[0]?.reason).toBe('database_too_new database=13 known=12');
  });

  it('ein Fehlschlag mitten in einer Migration nennt Fassung und Richtung', async () => {
    const { logger, lines } = recording();
    await bringDatabaseUpToDate(
      throwing(
        failure({
          kind: 'migration_failed',
          version: 13,
          direction: 'up',
          code: 'ERR_SQLITE_ERROR',
          sqlite: 19,
        }),
      ),
      logger,
    );
    expect(lines[0]?.reason).toBe(
      'migration_failed version=13 direction=up code=err_sqlite_error sqlite=19',
    );
  });

  it('der Fehlschlag der Sicherungskopie ist ein anderer Fall als der einer Migration', async () => {
    const { logger, lines } = recording();
    await bringDatabaseUpToDate(
      throwing(failure({ kind: 'backup_failed', from: 12, code: 'ENOSPC', sqlite: null })),
      logger,
    );
    expect(lines[0]?.reason).toBe('backup_failed from=12 code=enospc');
    // Und der Satz sagt etwas anderes: Hier ist nichts geändert worden.
    expect(lines[0]?.message).toContain('Sicherungskopie');
  });

  it('ein belegter Bestand bekommt einen eigenen Grund und das Ergebniskennzeichen von SQLite', async () => {
    const { logger, lines } = recording();
    await bringDatabaseUpToDate(throwing(failure({ kind: 'database_busy', sqlite: 5 })), logger);
    expect(lines[0]?.reason).toBe('database_busy sqlite=5');
  });

  it('ein Wurf ohne bekannte Form wird eingeordnet, so weit es ohne seine Meldung geht', async () => {
    const { logger, lines } = recording();
    const fremd = Object.assign(new Error('Etwas ganz anderes in /home/jemand/takt.db'), {
      code: 'ENOENT',
    });
    const ok = await bringDatabaseUpToDate(throwing(fremd), logger);

    expect(ok).toBe(false);
    expect(lines[0]?.reason).toBe('unknown code=enoent');
    // Der Satz ist der von vorher — für diesen Fall ist er richtig.
    expect(lines[0]?.message).toBe(
      'Der Datenbestand konnte nicht auf den Stand dieser Fassung gebracht werden. Takt startet nicht.',
    );
  });

  it('ein Wurf, der gar kein Objekt ist, kippt den Startpfad nicht', async () => {
    const { logger, lines } = recording();
    const ok = await bringDatabaseUpToDate(throwing('nur ein Text'), logger);
    expect(ok).toBe(false);
    expect(lines[0]?.reason).toBe('unknown');
  });

  it('ein SQLite-Wurf ohne angehängten Grund wird an seinem Ergebniskennzeichen erkannt', () => {
    const belegt = Object.assign(new Error('database is locked'), {
      code: 'ERR_SQLITE_ERROR',
      // Die erweiterte Form von SQLITE_BUSY: SQLITE_BUSY_SNAPSHOT.
      errcode: 517,
    });
    expect(describeMigrationFailure(belegt).key).toBe('database_busy sqlite=517');
  });

  it('jeder Zweig kommt in der Prüfliste vor — sonst bliebe er ungemessen', () => {
    expect([...new Set(ALLE_GRUENDE.map((reason) => reason.kind))].sort()).toEqual(
      Object.keys(ZWEIGE).sort(),
    );
  });

  it('verschiedene Gründe ergeben verschiedene Schlüssel', () => {
    const schluessel = ALLE_GRUENDE.map((reason) => describeMigrationFailure(failure(reason)).key);
    expect(new Set(schluessel).size).toBe(ALLE_GRUENDE.length);
  });
});

describe('T-132 — keine dieser Zeilen trägt einen Pfad', () => {
  /**
   * Der Wurf, aus dem der Grund kommt, trägt in **jedem** Fall einen Pfad in
   * seiner Meldung (siehe `failure`). Käme er auch nur an einer Stelle durch,
   * stünde er hier.
   */
  it('weder Satz noch Schlüssel enthalten Pfadtrenner, Dateinamen oder Benutzernamen', () => {
    for (const reason of ALLE_GRUENDE) {
      const { sentence, key } = describeMigrationFailure(failure(reason));
      const beides = `${sentence} ${key}`;
      expect(beides, reason.kind).not.toContain('/');
      expect(beides, reason.kind).not.toContain('\\');
      expect(beides, reason.kind).not.toContain('takt.db');
      expect(beides, reason.kind).not.toContain('jemand');
      expect(beides, reason.kind).not.toContain('.local');
      // Auch keine Laufwerksangabe und kein Umgebungsverweis.
      expect(beides, reason.kind).not.toMatch(/[A-Za-z]:\\/);
      expect(beides, reason.kind).not.toContain('%');
      expect(beides, reason.kind).not.toContain('~');
    }
  });

  it('der Schlüssel bleibt im Zeichenvorrat, den der Protokollierer durchlässt', () => {
    for (const reason of ALLE_GRUENDE) {
      const { logger, lines } = recording();
      logger.lifecycle('error', 'egal', describeMigrationFailure(failure(reason)).key);
      // Nicht `unclassified`: Der Riegel greift, aber er greift hier nicht ein.
      expect(lines[0]?.reason, reason.kind).not.toBe(UNCLASSIFIED_REASON);
      expect(lines[0]?.reason, reason.kind).toBe(describeMigrationFailure(failure(reason)).key);
    }
  });

  it('ein Grund in falscher Gestalt wird ersetzt und nicht ausgegeben', () => {
    const { logger, lines } = recording();
    for (const boese of [
      'pfad=/home/jemand/.local/share/takt/takt.db',
      'C:\\Users\\Jemand\\AppData\\Local\\Takt',
      'unknown code=ERR_SQLITE_ERROR', // Großbuchstaben
      'Der Bestand ist belegt.', // ein ganzer Satz
      'a'.repeat(400),
    ]) {
      logger.lifecycle('error', 'egal', boese);
    }
    for (const line of lines) {
      expect(line.reason).toBe(UNCLASSIFIED_REASON);
    }
  });
});

describe('T-132 — der Startpfad ohne Fehlschlag', () => {
  it('ein Bestand auf Stand meldet nichts und lässt den Dienst weiterlaufen', async () => {
    const { logger, lines } = recording();
    const ok = await bringDatabaseUpToDate(
      {
        state: () => Promise.resolve({ kind: 'current', version: 12 } satisfies MigrationState),
        migrateToLatest: () => Promise.resolve({ from: 12, to: 12, backup: null }),
      },
      logger,
    );
    expect(ok).toBe(true);
    expect(lines).toHaveLength(0);
  });

  it('eine gelaufene Migration steht mit Fassungen und Sicherungskopie im Protokoll', async () => {
    const { logger, lines } = recording();
    const ok = await bringDatabaseUpToDate(
      {
        state: () =>
          Promise.resolve({ kind: 'pending', from: 11, to: 12, count: 1 } satisfies MigrationState),
        migrateToLatest: () =>
          Promise.resolve({ from: 11, to: 12, backup: '/home/jemand/takt-vor-migration-11.db' }),
      },
      logger,
    );

    expect(ok).toBe(true);
    expect(lines.map((line) => line.reason)).toEqual([
      'migration_pending from=11 to=12',
      'migration_done from=11 to=12 backup=yes',
    ]);
    // Der Pfad der Sicherungskopie steht **nicht** in der Zeile, obwohl der
    // Läufer ihn zurückgibt (B-2.4).
    for (const line of lines) {
      expect(`${line.message} ${line.reason ?? ''}`).not.toContain('/home');
    }
  });
});

describe('T-132 — der Fehlschlag beim Öffnen des Bestands', () => {
  it('ein belegter Bestand heißt auch hier „belegt"', () => {
    const belegt = Object.assign(new Error('database is locked'), {
      code: 'ERR_SQLITE_ERROR',
      errcode: 5,
    });
    expect(describeStoreOpenFailure(belegt).key).toBe('database_busy sqlite=5');
  });

  it('auseinandergelaufene eingebettete Migrationen bekommen ihren eigenen Grund', () => {
    const drift = migrationFailure({ kind: 'embedded_drift' }, 'packages/storage/migrations weicht ab');
    const diagnosis = describeStoreOpenFailure(drift);
    expect(diagnosis.key).toBe('embedded_drift');
    expect(diagnosis.sentence).not.toContain('/');
  });

  it('alles Übrige ist „nicht zu öffnen" — mit Schlüssel und ohne Pfad', () => {
    const fehlt = Object.assign(new Error("ENOENT: no such file or directory, open '/home/jemand/takt.db'"), {
      code: 'ENOENT',
    });
    const diagnosis = describeStoreOpenFailure(fehlt);
    expect(diagnosis.key).toBe('store_unopenable code=enoent');
    expect(`${diagnosis.sentence} ${diagnosis.key}`).not.toContain('/home');
  });
});
