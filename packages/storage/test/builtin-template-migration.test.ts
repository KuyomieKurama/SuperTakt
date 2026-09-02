/**
 * Takt — T-010b, die nicht löschbare Standardvorlage nach Migration 0005 (E-005, E-015, E-020, E-033).
 *
 * Migration 0002 hatte die Standardvorlage noch mit `booking.durationSeconds`
 * und `booking.note` angelegt — Quellen, die E-033 aus `ExportSourcePath`
 * entfernt hat. Migration 0004 hat die Quellen auf `group.*` nachgezogen, aber
 * noch den JSON-Schlüssel `transform` benutzt. `packages/export/src/model.ts`
 * (T-007) — der einzige Typ, der das Feld überhaupt benennt, weil
 * `ExportTemplateEnvelope.definition` in der Domäne bewusst `unknown` ist —
 * nennt es `transformation`. Migration 0005 zieht den Schlüssel nach; ohne sie
 * wäre die Standardvorlage für den Vorlagen-Motor unlesbar
 * (`validation_error`, siehe T-007-Bericht, Befund 3) — ausgerechnet die eine
 * Vorlage, die der Benutzer nicht löschen und nicht reparieren kann (A-8.7).
 *
 * Der Aufzählungswert bleibt englisch (E-015): `raw`, nicht `roh`. Dieser Test
 * prüft die tatsächlich in der Datenbank liegende Zeile nach einer
 * vollständigen Migration, nicht nur den Text der SQL-Dateien.
 *
 * Der Name der Transformation für `Zeit` ist weiterhin ausdrücklich Gegenstand:
 * Sie heißt seit T-009 `quarter_hours_to_number`, nicht mehr
 * `round_to_quarter_hour`. Der alte Name bekäme eine bereits gerundete Anzahl
 * Viertelstunden (hier: 3) und läse sie als Sekunden — aus 0,75 würde still
 * 0,25 auf einer Kundenrechnung. Wird einer der beiden Namen in einer
 * künftigen Änderung an der Migration zurückgedreht, muss genau dieser Test
 * das melden.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { BUILTIN_TEMPLATE_ID, openMigratedDatabase } from './support/migrated-database.js';

interface StoredField {
  readonly name: string;
  readonly source: string;
  readonly transformation: string;
}

interface StoredDefinition {
  readonly version: number;
  readonly fields: readonly StoredField[];
}

describe('Standardvorlage nach Migration 0005 (A-8.2, A-8.7, E-005, E-015, E-020, E-033)', () => {
  let db: DatabaseSync;
  let definition: StoredDefinition;

  beforeEach(() => {
    db = openMigratedDatabase();
    const row = db
      .prepare('SELECT definition FROM export_template WHERE id = ? AND is_builtin = 1')
      .get(BUILTIN_TEMPLATE_ID) as { definition: string } | undefined;
    expect(row).toBeDefined();
    definition = JSON.parse(row!.definition) as StoredDefinition;
  });

  afterEach(() => {
    db.close();
  });

  it('erzeugt exakt die vier Felder Call, Zeit, Notiz, WindowsUser, in dieser Reihenfolge (A-8.2)', () => {
    expect(definition.fields.map((field) => field.name)).toEqual(['Call', 'Zeit', 'Notiz', 'WindowsUser']);
  });

  it('keines der vier Felder benutzt noch eine booking.*-Quelle (E-033, "entfernt statt umgedeutet")', () => {
    for (const field of definition.fields) {
      expect(field.source.startsWith('booking.')).toBe(false);
    }
  });

  it('jedes Feld benutzt den Schlüssel "transformation", nicht mehr "transform" (Migration 0005)', () => {
    for (const field of definition.fields as unknown as Array<Record<string, unknown>>) {
      expect(field['transform']).toBeUndefined();
      expect(typeof field['transformation']).toBe('string');
    }
  });

  it('jedes Feld benutzt den Aufzählungswert "raw", nicht "roh" (E-015: technische Schlüssel englisch)', () => {
    const raw = definition.fields.filter((field) => field.name === 'Call' || field.name === 'WindowsUser');
    expect(raw).toHaveLength(2);
    for (const field of raw) {
      expect(field.transformation).toBe('raw');
    }
  });

  it('Zeit liest aus group.quarters mit der Transformation quarter_hours_to_number — NICHT round_to_quarter_hour', () => {
    const zeit = definition.fields.find((field) => field.name === 'Zeit');
    expect(zeit).toEqual({ name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' });
  });

  it('Notiz liest aus group.bookingNotes, weiterhin über base64', () => {
    const notiz = definition.fields.find((field) => field.name === 'Notiz');
    expect(notiz).toEqual({ name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' });
  });

  it('Call und WindowsUser bleiben inhaltlich unverändert gegenüber Migration 0002/0004', () => {
    expect(definition.fields.find((field) => field.name === 'Call')).toEqual({
      name: 'Call',
      source: 'todo.callNumber',
      transformation: 'raw',
    });
    expect(definition.fields.find((field) => field.name === 'WindowsUser')).toEqual({
      name: 'WindowsUser',
      source: 'system.windowsUser',
      transformation: 'raw',
    });
  });

  it('die Standardvorlage bleibt nach der Migration weiterhin unlöschbar und unveränderlich (A-8.7)', () => {
    expect(() => db.prepare('DELETE FROM export_template WHERE id = ?').run(BUILTIN_TEMPLATE_ID)).toThrow(
      /builtin_template_immutable/,
    );
    expect(() =>
      db.prepare("UPDATE export_template SET name = 'Anders' WHERE id = ?").run(BUILTIN_TEMPLATE_ID),
    ).toThrow(/builtin_template_immutable/);
  });
});
