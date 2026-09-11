/**
 * Takt — T-140, `createVersionChecker` — der Takt der Versionsprüfung
 * (E-069, A-V-10, A-V-11, A-V-12, A-18.2, A-18.11).
 *
 * A-V-12 ist gebaut, aber laut T-138-Bericht ("Offene Fragen" 3) in keinem
 * Nachweislauf gemessen — der Vorschlag dort ist ausdrücklich eine
 * Einheitenprüfung an `createVersionChecker` in T-140. Diese Datei ist das.
 *
 * Getestet wird ausschließlich die Terminplanung: eine Anfrage je Start,
 * danach höchstens eine je Intervall, ein harter Boden, kein zweiter Versuch
 * nach einem Fehlschlag, sauberes Anhalten mitten in einer laufenden Abfrage.
 * Die Naht dafür ist `options.source` — eine handgeschriebene
 * `ReleaseSourcePort`-Attrappe, keine echte Gegenstelle: Das echte
 * Netzverhalten (Frist, Weiterleitung, Obergrenze) ist bereits Gegenstand von
 * `source.test.ts`. Hier zählt nur, WANN und WIE OFT `latest()` gerufen wird.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createVersionCheckStatePort, openDatabase, toTimestamp, type OpenedDatabase } from '@takt/storage';

import { createLogger } from '../../src/logger.ts';
import { createVersionChecker } from '../../src/features/version/version.ts';
import type {
  ReleaseLookup,
  ReleaseSourcePort,
} from '../../src/features/version/source.ts';
import type { VersionCheckStorePort } from '../../src/features/version/version.ts';

/** Ein Protokollierer, der nichts ausgibt — die Zeilen selbst sind nicht Gegenstand dieser Datei. */
const silentLogger = createLogger(() => undefined);

interface CountingSource {
  readonly source: ReleaseSourcePort;
  readonly calls: () => number;
  /** Wird bei jedem Aufruf gesetzt — für Fälle, die das Signal selbst prüfen wollen. */
  readonly lastSignal: () => AbortSignal | null;
}

function countingSource(respond: (signal: AbortSignal) => Promise<ReleaseLookup>): CountingSource {
  let calls = 0;
  let lastSignal: AbortSignal | null = null;
  const source: ReleaseSourcePort = {
    latest: (signal: AbortSignal) => {
      calls += 1;
      lastSignal = signal;
      return respond(signal);
    },
  };
  return { source, calls: () => calls, lastSignal: () => lastSignal };
}

/** Wartet, bis die Bedingung wahr ist, oder gibt nach `timeoutMs` auf. */
async function waitUntil(condition: () => boolean, timeoutMs = 2_000): Promise<void> {
  const started = Date.now();
  while (!condition()) {
    if (Date.now() - started > timeoutMs) throw new Error('Bedingung wurde nicht rechtzeitig wahr.');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

const checkers: { stop(): void }[] = [];
afterEach(() => {
  while (checkers.length > 0) checkers.pop()?.stop();
});

/**
 * Ein echter, migrierter Bestand samt dem Adapter, den `composition.ts`
 * zwischen `VersionCheckStatePort` (Zeitstempel) und `VersionCheckStorePort`
 * (`Date`) baut — wörtlich dieselbe Verdrahtung, damit dieser Prüffall genau
 * die Naht mißt, durch die T-279 tatsächlich läuft, und nicht eine eigene
 * Nachbildung davon.
 */
async function openStoreBackedDatabase(): Promise<{ readonly database: OpenedDatabase; readonly store: VersionCheckStorePort }> {
  const database = openDatabase({ location: ':memory:', now: () => toTimestamp(new Date()) });
  await database.migrations.migrateToLatest();
  const versionCheckState = createVersionCheckStatePort(database.connection);
  const store: VersionCheckStorePort = {
    read: () => versionCheckState.lastCheckAt(),
    write: (at: Date) => versionCheckState.recordCheck(toTimestamp(at)),
  };
  return { database, store };
}

describe('createVersionChecker — "er tut nichts, bis start() gerufen wird"', () => {
  it('bauen allein löst keine Anfrage aus', async () => {
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
    });
    checkers.push(checker);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(counting.calls()).toBe(0);
    expect(checker.current()).toEqual({ state: 'unknown' });
  });

  it('current() löst niemals eine Anfrage aus, auch nicht nach 100 Aufrufen (A-V-10)', async () => {
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
    });
    checkers.push(checker);

    for (let i = 0; i < 100; i += 1) checker.current();
    expect(counting.calls()).toBe(0);
  });
});

describe('createVersionChecker — start() löst genau eine Anfrage aus (A-18.2)', () => {
  it('nach start() kommt genau ein Aufruf, und das Ergebnis steht danach in current()', async () => {
    const counting = countingSource(async () => ({ ok: true, version: '1.4.0' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 1,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() === 1);
    await waitUntil(() => checker.current().state === 'known');

    expect(checker.current()).toEqual({ state: 'known', latestVersion: '1.4.0' });

    // Wartet noch etwas — es darf kein zweiter Aufruf kommen, solange das
    // Intervall nicht verstrichen ist.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(counting.calls()).toBe(1);
  });

  it('ein zweiter start()-Aufruf verdoppelt nichts', async () => {
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 1,
    });
    checkers.push(checker);

    checker.start();
    checker.start();
    await waitUntil(() => counting.calls() >= 1);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(counting.calls()).toBe(1);
  });
});

describe('A-18.11 — ein Fehlschlag beendet den Prüflauf, nicht die Prüfung (T-273)', () => {
  it('Fehlschlag, dann Erfolg im selben Prozeßlauf: der Zustand wird "known"', async () => {
    // Der vom Auftraggeber gemeldete Fall: Die Anwendung startet schneller als
    // das Netz. Bis T-273 blieb der Zeitgeber nach dem ersten Fehlschlag
    // stehen — dieser Fall wäre vorher rot gewesen und ist der Grund für die
    // Schärfung von A-18.11 ("Lauf" = der einzelne Prüflauf).
    let antworten = 0;
    const counting = countingSource(async () => {
      antworten += 1;
      return antworten === 1
        ? { ok: false, reason: 'unreachable' }
        : { ok: true, version: '2.3.0' };
    });
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => checker.current().state === 'known');

    expect(checker.current()).toEqual({ state: 'known', latestVersion: '2.3.0' });
    expect(counting.calls()).toBe(2);
  });

  it('aber NICHT sofort: der harte Boden hält auch nach einem Fehlschlag (A-V-11)', async () => {
    // Die Gegenrichtung. Ohne sie wäre aus "nie wieder" ein Klopfen geworden.
    const zeitpunkte: number[] = [];
    const counting = countingSource(async () => {
      zeitpunkte.push(Date.now());
      return { ok: false, reason: 'unreachable' };
    });
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      // Der Takt ist absichtlich weit weg: Was hier gemessen wird, ist der
      // BODEN, auf den ein Fehlschlag neu plant — nicht der Takt.
      intervalMs: 10_000,
      minIntervalMs: 300,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() === 1);

    // 200 ms nach dem Fehlschlag: der Boden von 300 ms ist noch nicht um.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(counting.calls()).toBe(1);

    // Und er stimmt auch gemessen, nicht nur gezählt.
    await waitUntil(() => counting.calls() === 2, 3_000);
    expect(zeitpunkte[1]! - zeitpunkte[0]!).toBeGreaterThanOrEqual(300);
  });

  it('der Fehlschlag bleibt stumm: der Zustand ist und bleibt "unknown"', async () => {
    const counting = countingSource(async () => ({ ok: false, reason: 'unreachable' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() >= 3);
    expect(checker.current()).toEqual({ state: 'unknown' });
  });

  it('auch ein Wurf der Abholfunktion beendet die Prüfung nicht', async () => {
    let antworten = 0;
    const counting = countingSource(async () => {
      antworten += 1;
      if (antworten === 1) throw new Error('Netz weg');
      return { ok: true, version: '9.9.9' };
    });
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => checker.current().state === 'known');
    expect(checker.current()).toEqual({ state: 'known', latestVersion: '9.9.9' });
  });

  it('stop() nach einem Fehlschlag plant nichts nach (A-V-12)', async () => {
    const counting = countingSource(async () => ({ ok: false, reason: 'unreachable' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });

    checker.start();
    await waitUntil(() => counting.calls() === 1);
    checker.stop();

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(counting.calls()).toBe(1);
  });
});

describe('A-V-11 — der harte Boden greift auch bei einem sehr kurzen Zeitgebertakt (stehende Uhr)', () => {
  it('bei eingefrorener Uhr bleibt es bei EINER Anfrage, obwohl der Zeitgeber viele Male feuert', async () => {
    // "Stehende Uhr": now() liefert immer denselben Zeitpunkt. Damit bleibt
    // die seit der letzten Anfrage verstrichene Zeit (aus Sicht des Läufers)
    // bei 0 — der harte Boden greift bei jedem Zeitgeberschlag erneut, auch
    // wenn in echter Zeit 200 ms mit einem 5-ms-Takt vergehen.
    const frozen = new Date('2026-09-04T00:00:00Z');
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => frozen,
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 5,
      minIntervalMs: 60_000, // eine Stunde, wie im Betrieb — aber die Uhr steht.
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() === 1);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(counting.calls()).toBe(1);
  });
});

describe('A-V-12 — stop() beendet einen laufenden Aufruf und räumt den Zeitgeber weg', () => {
  it('stop() während eine Antwort noch aussteht: das Signal wird abgebrochen, current() bleibt "unknown"', async () => {
    const counting = countingSource(
      (signal: AbortSignal) =>
        new Promise<ReleaseLookup>((resolve) => {
          signal.addEventListener('abort', () => resolve({ ok: false, reason: 'aborted' }));
          // Löst NIE von selbst auf — nur das Abbrechen darf das Versprechen beenden.
        }),
    );
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() === 1);
    expect(counting.lastSignal()?.aborted).toBe(false);

    checker.stop();

    expect(counting.lastSignal()?.aborted).toBe(true);
    expect(checker.current()).toEqual({ state: 'unknown' });
  });

  it('start() gefolgt von sofortigem stop(): keine einzige Anfrage geht hinaus', async () => {
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
    });
    checkers.push(checker);

    checker.start();
    checker.stop();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(counting.calls()).toBe(0);
  });

  it('stop() nach stop() wirft nicht und startet nichts neu', async () => {
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
    });
    checkers.push(checker);

    checker.stop();
    expect(() => checker.stop()).not.toThrow();
    checker.start(); // start() NACH stop() darf ebenfalls nichts mehr auslösen.

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(counting.calls()).toBe(0);
  });
});

/**
 * T-280 — Befund aus dem T-279-Bericht des domain-dev: „Ein Neustart fragt
 * nicht erneut" ist der Satz, der die zweite Verschärfung trägt, und er
 * braucht die Gegenprobe OHNE Speicher — sonst wird er über einer leeren
 * Menge wahr. Beide Fälle stehen deshalb nebeneinander, am selben Aufbau,
 * und beide gegen den ECHTEN Adapter aus `packages/storage` (nicht gegen eine
 * eigene Nachbildung des Speichers).
 */
describe('T-279/T-280 — der Bezugspunkt des Bodens überlebt einen "Neustart" (Migration 0022)', () => {
  it('zwei Prüfer auf demselben Speicher: der zweite fragt NICHT erneut — der Boden hält über die Prozeßgrenze', async () => {
    const { database, store } = await openStoreBackedDatabase();
    try {
      const counting1 = countingSource(async () => ({ ok: true, version: '1.0.0' }));
      const checker1 = createVersionChecker({
        logger: silentLogger,
        now: () => new Date(),
        source: counting1.source,
        startDelayMs: 5,
        intervalMs: 10_000,
        minIntervalMs: 30_000,
        store,
      });
      checkers.push(checker1);
      checker1.start();
      await waitUntil(() => counting1.calls() === 1);
      checker1.stop();

      // "Neustart": ein zweiter, unabhängiger Prüfer — neuer Prozeß, gleicher
      // Bestand. Derselbe `store`-Adapter, aber eine frisch gebaute Prüfer-
      // Instanz, so wie ein neu gestarteter Sidecar eine frische Instanz wäre.
      const counting2 = countingSource(async () => ({ ok: true, version: '1.0.0' }));
      const checker2 = createVersionChecker({
        logger: silentLogger,
        now: () => new Date(),
        source: counting2.source,
        startDelayMs: 5,
        intervalMs: 10_000,
        minIntervalMs: 30_000,
        store,
      });
      checkers.push(checker2);
      checker2.start();
      // Genug Zeit für einen Aufruf, der ohne Boden fällig wäre (startDelayMs 5).
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(counting2.calls()).toBe(0);
    } finally {
      database.close();
    }
  });

  it('Gegenprobe: OHNE Speicher fragt der "neue" Prüfer sehr wohl erneut — sonst wäre der obige Satz über einer leeren Menge wahr', async () => {
    const counting1 = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker1 = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting1.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 30_000,
      // kein store — das Verhalten von vor T-279.
    });
    checkers.push(checker1);
    checker1.start();
    await waitUntil(() => counting1.calls() === 1);
    checker1.stop();

    const counting2 = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const checker2 = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting2.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 30_000,
    });
    checkers.push(checker2);
    checker2.start();
    await waitUntil(() => counting2.calls() === 1);

    expect(counting2.calls()).toBe(1);
  });

  it('der Zeitpunkt steht bereits IM Speicher, während die Anfrage noch läuft — geschrieben wird vor dem fetch, nicht danach (T-279)', async () => {
    const { database, store } = await openStoreBackedDatabase();
    try {
      let duringRequest: string | null | undefined;
      const counting = countingSource(async () => {
        duringRequest = await store.read();
        return { ok: true, version: '1.0.0' };
      });
      const checker = createVersionChecker({
        logger: silentLogger,
        now: () => new Date(),
        source: counting.source,
        startDelayMs: 5,
        store,
      });
      checkers.push(checker);

      checker.start();
      await waitUntil(() => counting.calls() === 1);

      expect(duringRequest).not.toBeUndefined();
      expect(typeof duringRequest).toBe('string');
    } finally {
      database.close();
    }
  });

  it('ein lesend werfender Speicher beendet die Prüfung nicht und protokolliert genau EINE Zeile ("_unreadable")', async () => {
    const lines: string[] = [];
    const logger = createLogger((line) => lines.push(line));
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const throwingStore: VersionCheckStorePort = {
      read: () => Promise.reject(new Error('Speicher kaputt (Lesen)')),
      write: async () => undefined,
    };
    const checker = createVersionChecker({
      logger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
      store: throwingStore,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => checker.current().state === 'known');
    // Ein Herzschlag, damit ein zweiter (fälschlicher) Versuch sichtbar würde.
    await new Promise((resolve) => setTimeout(resolve, 60));

    const unreadable = lines.filter((line) => line.includes('version_check_state_unreadable'));
    expect(unreadable.length).toBe(1);
    // Die Prüfung selbst lief trotzdem durch — kein Wurf verließ `run()`.
    expect(checker.current()).toEqual({ state: 'known', latestVersion: '1.0.0' });
  });

  it('ein schreibend werfender Speicher beendet die Prüfung nicht und protokolliert genau EINE Zeile ("_unwritable")', async () => {
    const lines: string[] = [];
    const logger = createLogger((line) => lines.push(line));
    const counting = countingSource(async () => ({ ok: true, version: '1.0.0' }));
    const throwingStore: VersionCheckStorePort = {
      read: async () => null,
      write: () => Promise.reject(new Error('Speicher kaputt (Schreiben)')),
    };
    const checker = createVersionChecker({
      logger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
      store: throwingStore,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => checker.current().state === 'known');
    await new Promise((resolve) => setTimeout(resolve, 60));

    const unwritable = lines.filter((line) => line.includes('version_check_state_unwritable'));
    expect(unwritable.length).toBe(1);
    expect(checker.current()).toEqual({ state: 'known', latestVersion: '1.0.0' });
  });
});

/**
 * T-279 — der Streuwert auf den Boden (`VERSION_CHECK_JITTER_RATIO`, in
 * `packages/domain`). Hier wird nicht die reine Rechnung geprüft (das steht
 * in `packages/domain/test/version.test.ts`), sondern daß der Prüfer sie
 * tatsächlich anwendet: `random: () => 0` ergibt den blanken Boden,
 * `random: () => 1` ergibt spürbar mehr Wartezeit — gemessen an der Uhr.
 */
describe('T-279 — der Streuwert auf den Boden wirkt am laufenden Prüfer (A-V-11)', () => {
  async function gemessenerAbstand(random: () => number): Promise<number> {
    const zeitpunkte: number[] = [];
    const counting = countingSource(async () => {
      zeitpunkte.push(Date.now());
      return { ok: false, reason: 'unreachable' };
    });
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 200,
      random,
    });
    checkers.push(checker);
    checker.start();
    await waitUntil(() => counting.calls() === 2, 5_000);
    checker.stop();
    return zeitpunkte[1]! - zeitpunkte[0]!;
  }

  it('random: () => 1 läßt mehr Zeit verstreichen als random: () => 0, bei demselben Boden — die Richtung stimmt', async () => {
    const mitNull = await gemessenerAbstand(() => 0);
    const mitEins = await gemessenerAbstand(() => 1);

    // Der Boden hält so oder so.
    expect(mitNull).toBeGreaterThanOrEqual(200);
    expect(mitEins).toBeGreaterThanOrEqual(200);
    // Und der Streuwert wirkt tatsächlich in die richtige Richtung.
    expect(mitEins).toBeGreaterThan(mitNull);
  });

  it('eine werfende Zufallsquelle ergibt den blanken Boden, keinen Absturz und kein Unterschreiten', async () => {
    const abstand = await gemessenerAbstand(() => {
      throw new Error('Zufallsquelle kaputt');
    });

    expect(abstand).toBeGreaterThanOrEqual(200);
  });
});
