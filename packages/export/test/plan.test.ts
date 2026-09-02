/**
 * Takt — T-010b, Nachtrag zur Abdeckung: `planExportRun` und `serializeExportRows` (A-8.1, A-8.8, E-034, R-10, R-17).
 *
 * `plan.ts` lag nach T-007 bei 0 Prozent Abdeckung in jedem Maß — T-010 konnte
 * die Datei nicht kennen, weil es den Motor noch nicht gab
 * (`.claude/team/reports/T-007-integration-dev.md`, Befund 4). Das ist die
 * Stelle, an der ein Exportlauf plant, welche Buchungen in welche Zeile fallen
 * und welche Gruppe wegen fehlender Leistung ausgelassen bleibt — ein Fehler
 * hier kostet Geld oder verliert Arbeitszeit.
 *
 * Die fünf Fälle für `planExportRun` sind wörtlich die aus dem T-007-Bericht
 * vorgeschlagenen: gemischter Lauf, `entryCount` zählt Buchungen und nicht
 * Zeilen, `totalQuarters` summiert über die Zeilen, `timeEntryIds` enthält
 * keine Buchung einer ausgelassenen Gruppe, `previouslyExportedCount` nach
 * R-10.
 */
import { describe, expect, it } from 'vitest';
import { planExportRun, serializeExportRows } from '../src/plan.js';
import type { ExportFieldDefinition } from '../src/model.js';
import type { ExportGroup, ExportSystemContext } from '@takt/domain/export';
import type { CalendarDay, TimeEntryId, Timestamp, TodoId } from '@takt/domain/export';

const todoId = (value: string) => value as unknown as TodoId;
const timeEntryId = (value: string) => value as unknown as TimeEntryId;
const timestamp = (value: string) => value as unknown as Timestamp;
const calendarDay = (value: string) => value as unknown as CalendarDay;

const context: ExportSystemContext = {
  windowsUser: 't.beispiel',
  exportedAt: timestamp('2026-01-15T18:00:00Z'),
  roundingMode: 'up',
};

const fields: readonly ExportFieldDefinition[] = [
  { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
  { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
  { name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' },
  { name: 'WindowsUser', source: 'system.windowsUser', transformation: 'raw' },
];

function exportableGroup(overrides: {
  readonly todo: string;
  readonly day: string;
  readonly minutes: number;
  readonly note: string;
  readonly previouslyExported?: boolean;
}): ExportGroup {
  const seconds = overrides.minutes * 60;
  return {
    todoId: todoId(overrides.todo),
    day: calendarDay(overrides.day),
    todoTitle: `Todo ${overrides.todo}`,
    todoCallNumber: `TCK-${overrides.todo}`,
    todoTagNames: [],
    previouslyExported: overrides.previouslyExported ?? false,
    entries: [
      {
        timeEntryId: timeEntryId(`te-${overrides.todo}-${overrides.day}-a`),
        todoId: todoId(overrides.todo),
        startedAt: timestamp(`${overrides.day}T08:00:00Z`),
        endedAt: timestamp(`${overrides.day}T08:${String(overrides.minutes).padStart(2, '0')}:00Z`),
        durationSeconds: seconds,
        bookingNote: overrides.note,
        todoTitle: `Todo ${overrides.todo}`,
        todoCallNumber: `TCK-${overrides.todo}`,
        todoTagNames: [],
        previouslyExported: overrides.previouslyExported ?? false,
      },
      {
        timeEntryId: timeEntryId(`te-${overrides.todo}-${overrides.day}-b`),
        todoId: todoId(overrides.todo),
        startedAt: timestamp(`${overrides.day}T09:00:00Z`),
        endedAt: timestamp(`${overrides.day}T09:${String(overrides.minutes).padStart(2, '0')}:00Z`),
        durationSeconds: seconds,
        bookingNote: '',
        todoTitle: `Todo ${overrides.todo}`,
        todoCallNumber: `TCK-${overrides.todo}`,
        todoTagNames: [],
        previouslyExported: false,
      },
    ],
  };
}

/** Eine Gruppe, deren zusammengeführter Leistungstext leer bleibt (E-034). */
function notExportableGroup(todo: string): ExportGroup {
  return {
    todoId: todoId(todo),
    day: calendarDay('2026-01-16'),
    todoTitle: `Todo ${todo}`,
    todoCallNumber: null,
    todoTagNames: [],
    previouslyExported: false,
    entries: [
      {
        timeEntryId: timeEntryId(`te-${todo}-empty`),
        todoId: todoId(todo),
        startedAt: timestamp('2026-01-16T08:00:00Z'),
        endedAt: timestamp('2026-01-16T08:30:00Z'),
        durationSeconds: 1800,
        bookingNote: '',
        todoTitle: `Todo ${todo}`,
        todoCallNumber: null,
        todoTagNames: [],
        previouslyExported: false,
      },
    ],
  };
}

describe('planExportRun — gemischter Lauf aus exportierbarer und nicht exportierbarer Gruppe (E-034)', () => {
  it('eine exportierbare und eine leere Gruppe: genau eine Zeile, genau ein Skip', () => {
    const exportable = exportableGroup({ todo: 'call-a', day: '2026-01-15', minutes: 10, note: 'Rückruf erledigt' });
    const empty = notExportableGroup('call-empty');

    const plan = planExportRun([exportable, empty], fields, context);

    expect(plan.rows).toHaveLength(1);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0]?.reason).toBe('empty_note');
  });

  it('entryCount zählt BUCHUNGEN, nicht Zeilen — eine Gruppe aus zwei Buchungen zählt als 2, nicht als 1', () => {
    const twoBookingsOneRow = exportableGroup({ todo: 'call-b', day: '2026-01-15', minutes: 10, note: 'Text' });

    const plan = planExportRun([twoBookingsOneRow], fields, context);

    expect(plan.rows).toHaveLength(1);
    expect(plan.entryCount).toBe(2);
  });

  it('totalQuarters summiert über die ZEILEN (gerundete Gruppensummen), nicht über rohe Sekunden', () => {
    // Gruppe 1: 2 x 10 Minuten = 20 Minuten -> aufgerundet 2 Viertelstunden (0,50).
    // Gruppe 2: 2 x 20 Minuten = 40 Minuten -> aufgerundet 3 Viertelstunden (0,75).
    const groupA = exportableGroup({ todo: 'call-c', day: '2026-01-15', minutes: 10, note: 'A' });
    const groupB = exportableGroup({ todo: 'call-d', day: '2026-01-15', minutes: 20, note: 'B' });

    const plan = planExportRun([groupA, groupB], fields, context);

    expect(plan.rows).toHaveLength(2);
    expect(plan.totalQuarters).toBe(2 + 3);
  });

  it('timeEntryIds enthält KEINE Buchung einer ausgelassenen Gruppe (kritisch: sonst verschwände Arbeitszeit spurlos)', () => {
    const exportable = exportableGroup({ todo: 'call-e', day: '2026-01-15', minutes: 10, note: 'Text' });
    const empty = notExportableGroup('call-empty-2');

    const plan = planExportRun([exportable, empty], fields, context);

    const emptyGroupEntryIds = empty.entries.map((entry) => entry.timeEntryId);
    for (const id of emptyGroupEntryIds) {
      expect(plan.timeEntryIds).not.toContain(id);
    }
    // Gegenprobe: die Buchungen der exportierbaren Gruppe stehen sehr wohl drin.
    for (const entry of exportable.entries) {
      expect(plan.timeEntryIds).toContain(entry.timeEntryId);
    }
  });

  it('previouslyExportedCount zählt ZEILEN mit mindestens einer zurückgesetzten Buchung (R-10), nicht Buchungen', () => {
    const resetGroup = exportableGroup({
      todo: 'call-f',
      day: '2026-01-15',
      minutes: 10,
      note: 'Text',
      previouslyExported: true,
    });
    const freshGroup = exportableGroup({ todo: 'call-g', day: '2026-01-15', minutes: 10, note: 'Text' });

    const plan = planExportRun([resetGroup, freshGroup], fields, context);

    expect(plan.rows).toHaveLength(2);
    expect(plan.previouslyExportedCount).toBe(1);
  });
});

describe('serializeExportRows — deterministisch (R-17)', () => {
  it('zwei Läufe über denselben Bestand ergeben byteweise dieselbe Datei', () => {
    const group = exportableGroup({ todo: 'call-h', day: '2026-01-15', minutes: 10, note: 'Text' });
    const plan = planExportRun([group], fields, context);

    const first = serializeExportRows(plan.rows);
    const second = serializeExportRows(plan.rows);

    expect(first).toBe(second);
  });

  it('endet mit genau einem abschließenden Zeilenumbruch und ist gültiges JSON', () => {
    const group = exportableGroup({ todo: 'call-i', day: '2026-01-15', minutes: 10, note: 'Text' });
    const plan = planExportRun([group], fields, context);

    const serialized = serializeExportRows(plan.rows);

    expect(serialized.endsWith('\n')).toBe(true);
    expect(serialized.endsWith('\n\n')).toBe(false);
    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(JSON.parse(serialized)).toEqual(plan.rows);
  });

  it('eine leere Zeilenliste ergibt ein leeres JSON-Feld, keinen Fehler', () => {
    const serialized = serializeExportRows([]);
    expect(JSON.parse(serialized)).toEqual([]);
  });
});
