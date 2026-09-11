import { describe, expect, it } from 'vitest';
import { DEFAULT_IMPORT_CALL_PATTERN } from '@takt/domain';
import { extractImportCalls } from '../../src/features/data-transfer/import-call-numbers.ts';

describe('Call-Erkennung beim Fremdimport', () => {
  it('liest das vorgegebene Muster mit Trennzeichen und unabhängig von der Großschreibung', () => {
    expect(extractImportCalls(['Fw: Call 31855 - Arbeit', 'CALL#123456', 'call:_-54321', 'Ohne Call', 'Call 1234'], DEFAULT_IMPORT_CALL_PATTERN))
      .toEqual({ ok: true, value: ['31855', '123456', '54321', null, null] });
  });
  it('unterstützt eigene Muster, vollständige Treffer und das Ausschalten', () => {
    expect(extractImportCalls(['Ticket [ABC-123]'], String.raw`Ticket \[([^\]]+)\]`)).toEqual({ ok: true, value: ['ABC-123'] });
    expect(extractImportCalls(['Nr. 12345'], String.raw`\d{5}`)).toEqual({ ok: true, value: ['12345'] });
    expect(extractImportCalls(['Call 12345'], '')).toEqual({ ok: true, value: [null] });
  });
  it('weist ungültige Muster und ungültige Call-Nummern ab', () => {
    expect(extractImportCalls(['Call 12345'], '(').ok).toBe(false);
    expect(extractImportCalls(['=SUM(A1)'], '(.+)').ok).toBe(false);
    expect(extractImportCalls([], 'x'.repeat(513)).ok).toBe(false);
  });
  it('begrenzt die Ausführungszeit auch bei katastrophalem Backtracking', () => {
    const result = extractImportCalls(['a'.repeat(100) + '!'], '(a+)+$');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('benötigt zu lange');
  });
});
