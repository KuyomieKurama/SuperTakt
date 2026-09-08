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

import { createLogger } from '../../src/logger.ts';
import { createVersionChecker } from '../../src/version/checker.ts';
import type { ReleaseLookup, ReleaseSourcePort } from '../../src/version/source.ts';

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

describe('A-18.11 — nach einem Fehlschlag gibt es KEINEN zweiten Versuch im selben Lauf', () => {
  it('ein Fehlschlag plant nichts neu, auch nicht nach einer sehr kurzen "Regelfrist"', async () => {
    const counting = countingSource(async () => ({ ok: false, reason: 'unreachable' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      // Absichtlich winzig: Würde nach einem Fehlschlag doch neu geplant,
      // käme innerhalb von 200 ms längst ein zweiter Aufruf.
      intervalMs: 10,
      minIntervalMs: 1,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() === 1);
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(counting.calls()).toBe(1);
    expect(checker.current()).toEqual({ state: 'unknown' });
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
