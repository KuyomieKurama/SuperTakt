/**
 * Takt — T-010, leere Tagesgruppe ist nicht exportierbar, hält den Export aber
 * nicht auf (E-034).
 *
 * Testfall: entspricht dem in E-034 verlangten Fall ("Der Testplan braucht den
 * Fall, dass ein Export mit einer nicht exportierbaren Gruppe teilweise
 * durchläuft — einschließlich der Prüfung, dass die ausgelassene Gruppe
 * danach weiterhin als offen geführt wird."); im Testplan selbst als
 * TP-EXPORT-16c mit ausdrücklich offener Erwartung für den Notiz-*Inhalt*
 * geführt (siehe note-merging.test.ts). Diese Datei prüft den davon getrennten
 * Teil, der laut E-034 sehr wohl entschieden ist: **exportierbar oder nicht**.
 *
 * ANNAHME: `renderExportGroup` (siehe note-boundary-property.test.ts) liefert
 * für eine Gruppe, deren zusammengeführter Leistungstext leer ist, ein
 * Ergebnis vom `kind: 'not_exportable'` statt eines `row`-Ergebnisses mit
 * leerem `Notiz`-Feld. Das "Zurücksetzen"/"Offen bleiben" der betroffenen
 * Buchungen selbst ist Sache der Schreibseite (packages/storage,
 * `ExportPort.runExport`) und damit nicht Gegenstand dieser reinen
 * Render-Funktion — hier wird nur geprüft, dass die Render-Funktion den Fall
 * überhaupt als solchen erkennt und meldet, statt eine leere Notiz
 * stillschweigend durchzureichen.
 *
 * ROT ZUERST: `renderExportGroup` existiert nicht (packages/export fehlt, T-007).
 *
 * NACHTRAG T-010b (E-033): die Quelle des Leistungsfeldes ist seit T-009
 * `group.bookingNotes` (die zusammengeführten Leistungstexte der Tagesgruppe),
 * nicht mehr `booking.note` — `ExportSourcePath` in
 * `packages/domain/src/export.ts` kennt `booking.*` seit T-009 nicht mehr.
 */
import { describe, expect, it } from 'vitest';
import { renderExportGroup } from '../src/render.js';
import type { ExportGroup, ExportSourcePath, ExportSystemContext } from '@takt/domain/export';
import type { CalendarDay, TimeEntryId, Timestamp, TodoId } from '@takt/domain/export';

interface ExportFieldDefinition {
  readonly name: string;
  readonly source: ExportSourcePath;
  readonly transformation: 'raw' | 'base64';
}

const todoId = (value: string) => value as unknown as TodoId;
const timeEntryId = (value: string) => value as unknown as TimeEntryId;
const timestamp = (value: string) => value as unknown as Timestamp;
const calendarDay = (value: string) => value as unknown as CalendarDay;

const noteField: readonly ExportFieldDefinition[] = [{ name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' }];

const context: ExportSystemContext = {
  windowsUser: 't.beispiel',
  exportedAt: timestamp('2026-01-15T18:00:00Z'),
  roundingMode: 'up',
};

function groupWithNotes(notes: readonly string[]): ExportGroup {
  return {
    todoId: todoId('todo-empty-note'),
    day: calendarDay('2026-01-15'),
    todoTitle: 'Todo ohne Leistungstext',
    todoCallNumber: null,
    todoTagNames: [],
    previouslyExported: false,
    entries: notes.map((note, index) => ({
      timeEntryId: timeEntryId(`te-${index}`),
      todoId: todoId('todo-empty-note'),
      startedAt: timestamp(`2026-01-15T0${9 + index}:00:00Z`),
      endedAt: timestamp(`2026-01-15T0${9 + index}:10:00Z`),
      durationSeconds: 600,
      bookingNote: note,
      todoTitle: 'Todo ohne Leistungstext',
      todoCallNumber: null,
      todoTagNames: [],
      previouslyExported: false,
    })),
  };
}

describe('E-034 — eine Tagesgruppe ohne Leistungstext ist nicht exportierbar', () => {
  it('alle Buchungen der Gruppe haben einen leeren Leistungstext -> not_exportable', () => {
    const group = groupWithNotes(['', '']);
    const result = renderExportGroup(group, noteField, context);
    expect(result.kind).toBe('not_exportable');
    if (result.kind === 'not_exportable') {
      expect(result.reason).toBe('empty_note');
    }
  });

  it('ein Segment aus ausschließlich Leerzeichen zählt ebenfalls als leer (konsistent mit note-merging.test.ts)', () => {
    const group = groupWithNotes(['   ', '']);
    const result = renderExportGroup(group, noteField, context);
    expect(result.kind).toBe('not_exportable');
  });

  it('mindestens ein nicht leerer Leistungstext macht die Gruppe exportierbar', () => {
    const group = groupWithNotes(['', 'Kunde zurückgerufen']);
    const result = renderExportGroup(group, noteField, context);
    expect(result.kind).toBe('row');
  });

  it('eine Vorlage ohne Leistungsfeld überhaupt ist von der Leer-Notiz-Regel unberührt', () => {
    // Enthält eine Vorlage kein Feld mit Quelle group.bookingNotes, kann "leere
    // Notiz" den Export nicht blockieren — die Regel hängt am tatsächlich
    // konfigurierten Feld, nicht an der Buchung an sich.
    const group = { ...groupWithNotes(['', '']), todoCallNumber: 'TCK-000042' };
    const callOnlyTemplate: readonly ExportFieldDefinition[] = [{ name: 'Call', source: 'todo.callNumber', transformation: 'raw' }];
    const result = renderExportGroup(group, callOnlyTemplate, context);
    expect(result.kind).toBe('row');
    // NACHTRAG T-010b: `kind: 'row'` allein wäre auch dann grün, wenn die
    // Transformation den falschen Aufzählungswert trüge und der Motor jedes
    // Feld über seinen Schutzzweig zu `null` verwürfe (siehe render.ts, der
    // `default`-Zweig von applyTransformation) — die Zeile bliebe eine "row",
    // nur mit leerem Inhalt. Deshalb zusätzlich der tatsächliche Wert.
    if (result.kind === 'row') {
      expect(result.row['Call']).not.toBeNull();
      expect(result.row['Call']).toBe('TCK-000042');
    }
  });

  it('das Ergebnis der ersten Prüfung trägt tatsächlich das Notiz-Feld mit Inhalt, nicht nur kind: "row" (Gegenprobe zur Leer-Notiz-Regel)', () => {
    const group = groupWithNotes(['', 'Kunde zurückgerufen']);
    const result = renderExportGroup(group, noteField, context);
    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(result.row['Notiz']).not.toBeNull();
      expect(typeof result.row['Notiz']).toBe('string');
      expect((result.row['Notiz'] as string).length).toBeGreaterThan(0);
    }
  });
});
