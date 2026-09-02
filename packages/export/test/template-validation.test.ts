/**
 * Takt — T-010b, Nachtrag zur Abdeckung: `validateExportTemplateDefinition` und die
 * Bedingungszweige von `validateExportTemplateField` (A-7.2, A-8.7, E-005, E-017, R-06).
 *
 * `template.ts` lag nach T-007 bei 48,14 % Zeilen/Zweigen — T-010 konnte die
 * Datei nicht kennen (`.claude/team/reports/T-007-integration-dev.md`,
 * Befund 4). Die Fälle hier sind wörtlich die dort vorgeschlagenen:
 *
 *   validateExportTemplateDefinition: kein Objekt, unbekannte Fassung, leere
 *   Feldliste, Fehlerdurchreichung mit Feldnummer, Erfolgsfall.
 *
 *   validateExportTemplateField, Bedingungszweige: Bedingung ist kein Objekt,
 *   gesperrte Bedingungsquelle, unbekannter Vergleich, is_not_set.
 */
import { describe, expect, it } from 'vitest';
import { validateExportTemplateDefinition, validateExportTemplateField } from '../src/template.js';

describe('validateExportTemplateDefinition — die Vorlage als Ganzes (A-8.7)', () => {
  it('kein Objekt (z. B. eine Zeichenkette) wird abgewiesen', () => {
    const result = validateExportTemplateDefinition('nicht-ein-objekt');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_template_invalid');
    }
  });

  it('null wird abgewiesen (typeof null === "object", eigener Zweig nötig)', () => {
    const result = validateExportTemplateDefinition(null);
    expect(result.ok).toBe(false);
  });

  it('ein Array anstelle eines Objekts wird abgewiesen', () => {
    const result = validateExportTemplateDefinition([]);
    expect(result.ok).toBe(false);
  });

  it('eine unbekannte Fassung (version !== 1) wird abgewiesen', () => {
    const result = validateExportTemplateDefinition({
      version: 2,
      fields: [{ name: 'Call', source: 'todo.callNumber', transformation: 'raw' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_template_invalid');
    }
  });

  it('eine leere Feldliste wird abgewiesen — eine Vorlage ohne Feld exportiert nichts Sinnvolles', () => {
    const result = validateExportTemplateDefinition({ version: 1, fields: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_template_invalid');
    }
  });

  it('fields fehlt ganz oder ist kein Array wird ebenfalls abgewiesen', () => {
    expect(validateExportTemplateDefinition({ version: 1 }).ok).toBe(false);
    expect(validateExportTemplateDefinition({ version: 1, fields: 'Call' }).ok).toBe(false);
  });

  it('bricht beim ERSTEN fehlerhaften Feld ab und nennt dessen Nummer in der Meldung', () => {
    // Feld 1 ist gültig, Feld 2 trägt eine gesperrte Quelle. Eine Vorlage mit
    // gesperrter Quelle ist als Ganzes unbrauchbar — sie wird nicht teilweise
    // übernommen, sonst fiele ein Feld stillschweigend weg.
    const result = validateExportTemplateDefinition({
      version: 1,
      fields: [
        { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
        { name: 'Vermerk', source: 'todo.notiz', transformation: 'raw' },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_source_forbidden');
      expect(result.error.message).toContain('Feld 2');
    }
  });

  it('Erfolgsfall: eine vollständige, gültige Mehrfeld-Vorlage wird angenommen, Reihenfolge bleibt erhalten', () => {
    const input = {
      version: 1,
      fields: [
        { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
        { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
        { name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' },
        { name: 'WindowsUser', source: 'system.windowsUser', transformation: 'raw' },
      ],
    };

    const result = validateExportTemplateDefinition(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(input);
      expect(result.value.fields.map((field) => field.name)).toEqual(['Call', 'Zeit', 'Notiz', 'WindowsUser']);
    }
  });

  it('liest exakt die reale, migrierte Standardvorlage aus Migration 0005 fehlerfrei (Gegenprobe gegen die Datenbank)', () => {
    // Dieselbe Zeichenkette, wie sie packages/storage/migrations/0005_builtin_template_field_key.up.sql
    // tatsächlich in export_template.definition schreibt.
    const migratedDefinition = JSON.parse(
      '{"version":1,"fields":[' +
        '{"name":"Call","source":"todo.callNumber","transformation":"raw"},' +
        '{"name":"Zeit","source":"group.quarters","transformation":"quarter_hours_to_number"},' +
        '{"name":"Notiz","source":"group.bookingNotes","transformation":"base64"},' +
        '{"name":"WindowsUser","source":"system.windowsUser","transformation":"raw"}]}',
    );

    const result = validateExportTemplateDefinition(migratedDefinition);

    expect(result.ok).toBe(true);
  });
});

describe('validateExportTemplateField — Bedingungszweige (A-8.7, "bedingung")', () => {
  const validField = { name: 'Call', source: 'todo.callNumber', transformation: 'raw' };

  it('eine Bedingung, die kein Objekt ist, wird abgewiesen', () => {
    const result = validateExportTemplateField({ ...validField, condition: 'todo.callNumber ist gesetzt' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation_error');
    }
  });

  it('eine Bedingung, die ein Array ist, wird ebenfalls abgewiesen', () => {
    const result = validateExportTemplateField({ ...validField, condition: [] });
    expect(result.ok).toBe(false);
  });

  it('eine Bedingung mit gesperrter Quelle (todo.notiz) wird abgewiesen — dieselbe Grenze wie beim Feld selbst (R-06)', () => {
    const result = validateExportTemplateField({
      ...validField,
      condition: { source: 'todo.notiz', op: 'is_set' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_source_forbidden');
    }
  });

  it('eine Bedingung mit unbekanntem Vergleichsoperator wird abgewiesen', () => {
    const result = validateExportTemplateField({
      ...validField,
      condition: { source: 'todo.callNumber', op: 'ist_ungefaehr' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation_error');
    }
  });

  it('is_not_set ist ein gültiger, angenommener Vergleichsoperator', () => {
    const result = validateExportTemplateField({
      ...validField,
      condition: { source: 'todo.callNumber', op: 'is_not_set' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.condition).toEqual({ source: 'todo.callNumber', op: 'is_not_set' });
    }
  });

  it('ein Feld ganz ohne Bedingung bleibt weiterhin gültig (condition ist optional)', () => {
    const result = validateExportTemplateField(validField);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.condition).toBeUndefined();
    }
  });

  it('condition: null wird wie "keine Bedingung" behandelt, nicht als Fehler', () => {
    const result = validateExportTemplateField({ ...validField, condition: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.condition).toBeUndefined();
    }
  });
});
