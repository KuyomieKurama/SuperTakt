/**
 * Takt — T-010, Exportvorlagen (A-8.7, E-005, E-017).
 *
 * Testfälle: TP-TPL-01, TP-TPL-03, TP-TPL-05, TP-TPL-08 (Integration) sowie
 * die strukturelle Zusicherung "Standardvorlage erzeugt exakt Call/Zeit/
 * Notiz/WindowsUser" aus TP-EXPORT-01/-06. docs/testplan.md, Abschnitt 10.
 *
 * TP-TPL-02, -04, -06, -07 sind End-to-End bzw. Verweise auf TP-EXPORT-07/-08
 * (siehe testplan.md) und liegen nicht hier.
 *
 * Gleiche Modul-Annahmen wie note-boundary-property.test.ts:
 * `packages/export/src/template.ts` (validateExportTemplateField) und
 * `packages/export/src/render.ts` (renderExportGroup).
 *
 * ROT ZUERST: keine der beiden Dateien existiert (packages/export fehlt, T-007).
 *
 * NACHTRAG T-010b (E-033, `.claude/team/reports/T-009-domain-dev.md`, Abschnitt
 * "Offene Fragen" Punkt 1c): `ExportSourcePath` in `packages/domain/src/export.ts`
 * führt seit T-009 kein `booking.*` mehr — die Quellen dieser Datei sind auf die
 * Gruppenquellen `group.*` umgestellt. Für das Exportfeld `Zeit` ist das jetzt
 * `group.quarters` (die **gerundete** Tagessumme, E-008/E-020) mit der
 * Transformation `quarter_hours_to_number` — nicht `round_to_quarter_hour`.
 * Der alte Name bekäme eine bereits gerundete Anzahl Viertelstunden und läse
 * sie als Sekunden; aus 0,75 würde still 0,25 auf einer Kundenrechnung.
 */
import { describe, expect, it } from 'vitest';
import { validateExportTemplateField } from '../src/template.js';
import { renderExportGroup } from '../src/render.js';
import type { ExportGroup, ExportSourcePath, ExportSystemContext } from '@takt/domain/export';
import type { CalendarDay, TimeEntryId, Timestamp, TodoId } from '@takt/domain';

interface ExportFieldDefinition {
  readonly name: string;
  readonly source: ExportSourcePath;
  readonly transformation: 'raw' | 'base64' | 'quarter_hours_to_number';
}

const todoId = (value: string) => value as unknown as TodoId;
const timeEntryId = (value: string) => value as unknown as TimeEntryId;
const timestamp = (value: string) => value as unknown as Timestamp;
const calendarDay = (value: string) => value as unknown as CalendarDay;

const context: ExportSystemContext = {
  windowsUser: 't.beispiel',
  exportedAt: timestamp('2026-01-15T18:00:00Z'),
  roundingMode: 'up',
};

function group(overrides: Partial<ExportGroup> = {}): ExportGroup {
  return {
    todoId: todoId('todo-tpl'),
    day: calendarDay('2026-01-15'),
    todoTitle: 'Vorlagentest',
    todoCallNumber: 'TCK-000042',
    todoTagNames: [],
    previouslyExported: false,
    entries: [
      {
        timeEntryId: timeEntryId('te-1'),
        todoId: todoId('todo-tpl'),
        startedAt: timestamp('2026-01-15T09:00:00Z'),
        endedAt: timestamp('2026-01-15T09:16:00Z'), // 16 Minuten — der Unterscheidungsfall aus Abschnitt 1
        durationSeconds: 16 * 60,
        bookingNote: 'Rückruf erledigt',
        todoTitle: 'Vorlagentest',
        todoCallNumber: 'TCK-000042',
        todoTagNames: [],
        previouslyExported: false,
      },
    ],
    ...overrides,
  };
}

describe('Standardvorlage — erzeugt exakt Call, Zeit, Notiz, WindowsUser (A-8.2, E-005)', () => {
  const builtinTemplate: readonly ExportFieldDefinition[] = [
    { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
    { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
    { name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' },
    { name: 'WindowsUser', source: 'system.windowsUser', transformation: 'raw' },
  ];

  it('das Ergebnis trägt genau die vier Schlüssel Call, Zeit, Notiz, WindowsUser — keine zusätzlichen, keine fehlenden', () => {
    const result = renderExportGroup(group(), builtinTemplate, context);
    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(Object.keys(result.row).sort()).toEqual(['Call', 'Notiz', 'WindowsUser', 'Zeit'].sort());
    }
  });

  it('WindowsUser entspricht dem übergebenen Systemkontext, nicht einem fest verdrahteten Wert', () => {
    const result = renderExportGroup(group(), builtinTemplate, context);
    if (result.kind === 'row') {
      expect(result.row['WindowsUser']).toBe('t.beispiel');
    }
  });
});

describe('TP-TPL-01/-03 — abweichende Vorlage mit anderen Feldern und anderer Reihenfolge', () => {
  const customTemplate: readonly ExportFieldDefinition[] = [
    // group.durationSeconds ist die UNGERUNDETE Summe der Gruppe — keine
    // Abrechnungsgröße, sondern eine Kontrollspalte (siehe ExportSourcePath in
    // packages/domain/src/export.ts). Genau dafür steht sie hier: eine
    // abweichende Vorlage, die zusätzlich zur eigentlichen Abrechnung eine
    // Rohwert-Spalte führen will.
    { name: 'Dauer', source: 'group.durationSeconds', transformation: 'raw' },
    { name: 'Ticket', source: 'todo.callNumber', transformation: 'raw' },
  ];

  it('das Ergebnis trägt ausschließlich Ticket und Dauer — kein Notiz-, kein WindowsUser-Feld', () => {
    const result = renderExportGroup(group(), customTemplate, context);
    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(Object.keys(result.row).sort()).toEqual(['Dauer', 'Ticket'].sort());
      expect(result.row['Ticket']).toBe('TCK-000042');
    }
  });

  it('die Feldreihenfolge in der Definition bestimmt die Reihenfolge im Ergebnis', () => {
    const result = renderExportGroup(group(), customTemplate, context);
    if (result.kind === 'row') {
      expect(Object.keys(result.row)).toEqual(['Dauer', 'Ticket']);
    }
  });
});

describe('TP-TPL-05 — bedingtes Feld (A-2.6)', () => {
  // ExportFieldDefinition oben trägt keine Bedingung; für diesen Fall wird sie
  // testweise als optionales Attribut angenommen, siehe validateExportTemplateField
  // unten für die Validierungsseite. Die Rendering-Seite bekommt hier bewusst
  // KEIN eigenes Feld-Typ-Upgrade, um den Rest der Datei nicht zu verkomplizieren
  // — sollte T-007 Bedingungen anders modellieren, ist das im Bericht vermerkt.
  it('Feld mit gesetzter callNumber ist im Ergebnis enthalten', () => {
    const template = [{ name: 'Call', source: 'todo.callNumber' as ExportSourcePath, transformation: 'raw' as const, condition: { source: 'todo.callNumber' as ExportSourcePath, op: 'is_set' as const } }];
    const result = renderExportGroup(group({ todoCallNumber: 'TCK-000042' }), template, context);
    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(result.row['Call']).toBe('TCK-000042');
    }
  });

  it('Feld ohne gesetzte callNumber fehlt vollständig — nicht null, nicht leerer String', () => {
    const template = [{ name: 'Call', source: 'todo.callNumber' as ExportSourcePath, transformation: 'raw' as const, condition: { source: 'todo.callNumber' as ExportSourcePath, op: 'is_set' as const } }];
    const result = renderExportGroup(group({ todoCallNumber: null }), template, context);
    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect('Call' in result.row).toBe(false);
    }
  });
});

describe('TP-TPL-08 — Feldquelle nur aus geschlossener Liste, auch bei toleranter Schreibweise (E-017)', () => {
  it.each([
    'todo.metadaten.irgendwas', // frei erfundener, nicht gelisteter Pfad
    '', // leere Quelle
    ' todo.callNumber ', // gültige Quelle mit umschließenden Leerzeichen
    'Todo.CallNumber', // Groß-/Kleinschreibungsvariante einer gültigen Quelle
    'booking.Note',
  ])('Quelle "%s" wird abgelehnt — keine tolerante Normalisierung', (source) => {
    const result = validateExportTemplateField({ name: 'Feld', source, transformation: 'raw' });
    expect(result.ok).toBe(false);
  });

  it('exakt und wörtlich gelistete Quellen werden weiterhin angenommen (Gegenprobe)', () => {
    const result = validateExportTemplateField({ name: 'Call', source: 'todo.callNumber', transformation: 'raw' });
    expect(result.ok).toBe(true);
  });
});
