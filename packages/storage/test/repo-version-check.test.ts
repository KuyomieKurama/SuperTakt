/**
 * Takt — T-280, `createVersionCheckStatePort` (`app_setting.last_version_check_at`,
 * Migration 0022, A-V-11, T-279).
 *
 * Befund aus dem T-279-Bericht des domain-dev: Die Datei stand bei **0 %**
 * Abdeckung; `pnpm test:coverage` war trotzdem grün, weil die 80-%-Schwelle
 * über die ganze Gruppe `packages/storage/src/**` mißt und nicht je Datei —
 * "grün aus Zufall" (E-103). Diese Datei mißt die Datei selbst: Lesen bei
 * frischem Bestand (`NULL` = "noch nie gefragt"), Schreiben, die
 * Unberührtheit von `updated_at`, die GLOB-Form aus 0022 und den kaputten
 * Bestand ohne Einstellungszeile.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { createVersionCheckStatePort } from '../src/sqlite/repo-version-check.ts';
import { openMigratedConnection, ts } from './support/setup.ts';
import type { SqlConnection } from '../src/sqlite/database.ts';

describe('createVersionCheckStatePort — lastCheckAt() bei frischem Bestand', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('ist NULL unmittelbar nach der Migration — "noch nie gefragt" (Migration 0022)', async () => {
    conn = openMigratedConnection();
    const port = createVersionCheckStatePort(conn);

    expect(await port.lastCheckAt()).toBeNull();
  });

  it('die Spalte selbst ist in der frischen Zeile NULL, nicht bloß der Adapter, der so liest', () => {
    conn = openMigratedConnection();
    const row = conn.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get();
    expect(row?.['last_version_check_at']).toBeNull();
  });
});

describe('createVersionCheckStatePort — recordCheck() schreibt, lastCheckAt() liest denselben Wert', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('nach recordCheck() liefert lastCheckAt() genau den gemerkten Zeitpunkt', async () => {
    conn = openMigratedConnection();
    const port = createVersionCheckStatePort(conn);

    await port.recordCheck(ts('2026-09-11T09:12:34Z'));

    expect(await port.lastCheckAt()).toBe('2026-09-11T09:12:34Z');
  });

  it('ein zweiter recordCheck() überschreibt den ersten — es gibt keine Historie, nur den letzten Stand', async () => {
    conn = openMigratedConnection();
    const port = createVersionCheckStatePort(conn);

    await port.recordCheck(ts('2026-09-11T09:00:00Z'));
    await port.recordCheck(ts('2026-09-11T10:30:00Z'));

    expect(await port.lastCheckAt()).toBe('2026-09-11T10:30:00Z');
  });

  it('ein Zeitstempel aus der Zukunft wird angenommen — kein CHECK "nicht in der Zukunft" (verstellte Uhr, eingespielte Sicherung)', async () => {
    conn = openMigratedConnection();
    const port = createVersionCheckStatePort(conn);

    await port.recordCheck(ts('2999-01-01T00:00:00Z'));

    expect(await port.lastCheckAt()).toBe('2999-01-01T00:00:00Z');
  });

  it('recordCheck() rührt updated_at nicht an — sonst ließe sich der Takt der Prüfung darüber ablesen (A-18.11)', async () => {
    conn = openMigratedConnection();
    const port = createVersionCheckStatePort(conn);
    const before = conn.prepare('SELECT updated_at FROM app_setting WHERE id = 1').get()?.['updated_at'];

    await port.recordCheck(ts('2026-09-11T09:12:34Z'));

    const after = conn.prepare('SELECT updated_at FROM app_setting WHERE id = 1').get()?.['updated_at'];
    expect(after).toBe(before);
  });
});

describe('createVersionCheckStatePort — die Zeile fehlt: NULL statt eines Wurfs, kein Wurf beim Schreiben', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it('lastCheckAt() ohne Einstellungszeile wirft nicht und liefert NULL — "wie beim allerersten Start"', async () => {
    conn = openMigratedConnection();
    conn.prepare('DELETE FROM app_setting WHERE id = 1').run();
    const port = createVersionCheckStatePort(conn);

    await expect(port.lastCheckAt()).resolves.toBeNull();
  });

  it('recordCheck() ohne Einstellungszeile wirft nicht — die UPDATE-Anweisung trifft schlicht keine Zeile', async () => {
    conn = openMigratedConnection();
    conn.prepare('DELETE FROM app_setting WHERE id = 1').run();
    const port = createVersionCheckStatePort(conn);

    await expect(port.recordCheck(ts('2026-09-11T09:00:00Z'))).resolves.toBeUndefined();
  });
});

describe('Migration 0022 — der CHECK auf last_version_check_at nimmt genau die eine ISO-8601-Form (GLOB, length = 20)', () => {
  let conn: SqlConnection;

  afterEach(() => {
    conn.close();
  });

  it.each([
    '2026-09-11T09:59:59Z',
    '2999-01-01T00:00:00Z',
    '0001-01-01T00:00:00Z',
  ])('nimmt %s an', (value) => {
    conn = openMigratedConnection();
    expect(() =>
      conn.prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1').run(value),
    ).not.toThrow();
    expect(conn.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get()?.['last_version_check_at']).toBe(value);
  });

  it('NULL bleibt weiterhin ein gültiger Wert (der CHECK lässt IS NULL ausdrücklich zu)', () => {
    conn = openMigratedConnection();
    conn.prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1').run('2026-09-11T09:59:59Z');
    expect(() =>
      conn.prepare('UPDATE app_setting SET last_version_check_at = NULL WHERE id = 1').run(),
    ).not.toThrow();
  });

  it.each([
    ['Millisekunden', '2026-09-11T09:59:59.000Z'],
    ['fehlendes Z', '2026-09-11T09:59:59'],
    ['Zonenversatz statt Z', '2026-09-11T09:59:59+02:00'],
    ['Zahl als Text', '1757584799000'],
    ['leere Zeichenkette', ''],
    ['angehängtes Leerzeichen', '2026-09-11T09:59:59Z '],
    ['Datum ohne Uhrzeit', '2026-09-11'],
    ['Leerzeichen statt T', '2026-09-11 09:59:59Z'],
  ])('weist %s ab (%s)', (_bezeichnung, value) => {
    conn = openMigratedConnection();
    expect(() =>
      conn.prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1').run(value),
    ).toThrow();
    // Und der CHECK hat den Bestand dabei nicht verändert — der Wert bleibt NULL.
    expect(conn.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get()?.['last_version_check_at']).toBeNull();
  });
});
