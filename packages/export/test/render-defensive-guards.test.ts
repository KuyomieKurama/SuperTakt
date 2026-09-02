/**
 * Takt — T-010b, Nachtrag zur Abdeckung: die beiden Schutzzweige in `render.ts`
 * und `sources.ts` (A-7.2, R-06, R-18).
 *
 * T-007-Bericht, Befund 4, letzter Aufzählungspunkt: "Die beiden Schutzzweige
 * (`render.ts` Zeile 54, `sources.ts` Zeile 179): ein Feld, das an der Prüfung
 * vorbei mit unbekannter Quelle in den Renderer gelangt, ergibt `null` — nie
 * einen geratenen Wert. Das ist die Stelle, an der `todo.notiz` landete, wenn
 * es je durchkäme."
 *
 * `renderExportGroup` nimmt `ExportFieldDefinition`-Werte entgegen und geht
 * davon aus, dass sie bereits `validateExportTemplateField` durchlaufen haben
 * — der Typ allein erzwingt das zur Laufzeit nicht. Diese Datei simuliert
 * genau den Fall, dass eine ungeprüfte Felddefinition am Vorlageneditor vorbei
 * in den Renderer gelangt (aus einer Datei, über die HTTP-Schnittstelle, aus
 * einem alten Bestand) und prüft, dass der Motor dann **rät nichts**, sondern
 * `null` liefert — insbesondere für eine Quelle, die wie der interne Vermerk
 * aussieht.
 */
import { describe, expect, it } from 'vitest';
import { renderExportGroup } from '../src/render.js';
import type { ExportFieldDefinition, ExportTransformation } from '../src/model.js';
import type { ExportGroup, ExportSourcePath, ExportSystemContext } from '@takt/domain/export';
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

function group(): ExportGroup {
  return {
    todoId: todoId('todo-guard'),
    day: calendarDay('2026-01-15'),
    todoTitle: 'Schutzzweig-Test',
    todoCallNumber: 'TCK-000042',
    todoTagNames: [],
    previouslyExported: false,
    entries: [
      {
        timeEntryId: timeEntryId('te-guard'),
        todoId: todoId('todo-guard'),
        startedAt: timestamp('2026-01-15T09:00:00Z'),
        endedAt: timestamp('2026-01-15T09:15:00Z'),
        durationSeconds: 900,
        bookingNote: 'sichtbare Leistung',
        todoTitle: 'Schutzzweig-Test',
        todoCallNumber: 'TCK-000042',
        todoTagNames: [],
        previouslyExported: false,
      },
    ],
  };
}

describe('sources.ts, Schutzzweig von readExportSource — unbekannte Quelle an der Prüfung vorbei', () => {
  it('eine Quelle, die keinem der zwölf Zweige entspricht, ergibt null — nicht geraten, nicht übersprungen', () => {
    // Bewusst über validateExportTemplateField hinweg: eine Felddefinition,
    // deren "source" gar nicht in ExportSourcePath steht. Zur Laufzeit ist das
    // ein einfacher String; der Cast täuscht dem Übersetzer nur vor, dass die
    // Prüfung bereits stattgefunden hätte.
    const bypassedField: ExportFieldDefinition = {
      name: 'Unbekannt',
      source: 'group.nichtVorhanden' as unknown as ExportSourcePath,
      transformation: 'raw',
    };

    const result = renderExportGroup(group(), [bypassedField], context);

    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(result.row['Unbekannt']).toBeNull();
    }
  });

  it('genau die Stelle, an der der interne Vermerk landete, wenn er je durchkäme: "todo.notiz" liefert null, nicht den (nicht vorhandenen) Vermerk', () => {
    // ExportGroup kennt den Vermerk nicht einmal als Feld (siehe
    // ExportGroupHasNoTodoNote in packages/domain/src/export.ts) — dieser Test
    // zeigt zusätzlich, dass selbst der VERSUCH, eine notizartige, nicht
    // gelistete Quelle zu lesen, ins Leere greift.
    const sneakyField: ExportFieldDefinition = {
      name: 'Vermerk',
      source: 'todo.notiz' as unknown as ExportSourcePath,
      transformation: 'raw',
    };

    const result = renderExportGroup(group(), [sneakyField], context);

    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(result.row['Vermerk']).toBeNull();
    }
  });
});

describe('render.ts, Schutzzweig von applyTransformation — unbekannte Transformation an der Prüfung vorbei', () => {
  it('eine Transformation außerhalb der drei bekannten Werte ergibt null, wirft nicht und rät nichts', () => {
    const bypassedField: ExportFieldDefinition = {
      name: 'Kaputt',
      source: 'todo.callNumber',
      transformation: 'unbekannte_transformation' as unknown as ExportTransformation,
    };

    expect(() => renderExportGroup(group(), [bypassedField], context)).not.toThrow();

    const result = renderExportGroup(group(), [bypassedField], context);
    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(result.row['Kaputt']).toBeNull();
    }
  });

  it('Gegenprobe: dieselbe Quelle mit einer bekannten Transformation liefert sehr wohl einen Wert', () => {
    const validField: ExportFieldDefinition = {
      name: 'Call',
      source: 'todo.callNumber',
      transformation: 'raw',
    };

    const result = renderExportGroup(group(), [validField], context);

    expect(result.kind).toBe('row');
    if (result.kind === 'row') {
      expect(result.row['Call']).toBe('TCK-000042');
    }
  });
});
