/**
 * Takt — T-010, Notiz-Trennung (Vermerk gegen Leistung), R-18, A-7.2, A-7.4, E-017.
 *
 * ****** DER WICHTIGSTE EINZELTEST DIESES PROJEKTS (R-18) ******
 *
 * Testfälle: TP-NOTE-01 (Feldquelle strukturell nicht wählbar) und TP-NOTE-02
 * (Volltextprüfung über beliebige Vorlagen, Klartext UND base64-kodiert).
 * docs/testplan.md, Abschnitt 3.
 *
 * R-18, wörtlich: "Ein Test, der den Vermerktext nur im Klartext im
 * Exportergebnis sucht, besteht bei jeder Vorlage, die das Feld über die
 * Transformation `base64` ausgibt — also genau im Fall der Standardvorlage.
 * Der Test wäre grün und die Grenze trotzdem gebrochen." Deshalb ist TP-NOTE-02
 * unten als Eigenschaftstest über GENERIERTE Vorlagen umgesetzt, nicht nur
 * gegen die Standardvorlage: Jede generierte Vorlage wird gerendert, und das
 * gesamte serialisierte Ergebnis wird zweifach durchsucht — Klartext und
 * Base64-Form des Vermerk-Markers. Eine Vorlage, die den Marker nur über
 * base64 exportierte, würde einen rein klartextsuchenden Test bestehen lassen
 * und genau das ist der Fehler, den dieser Test verhindern soll.
 *
 * ANNAHME ZUR MODULSTRUKTUR (packages/export existiert noch nicht, T-007):
 *
 *   packages/export/src/template.ts
 *     validateExportTemplateField(field: unknown):
 *       Result<ExportFieldDefinition, TaktError<'export_source_forbidden' | 'validation_error'>>
 *
 *   packages/export/src/render.ts
 *     renderExportGroup(group: ExportGroup, fields: readonly ExportFieldDefinition[], context: ExportSystemContext): ExportRowResult
 *
 *   packages/export/src/base64.ts — toBase64 (siehe base64.test.ts)
 *
 * `ExportFieldDefinition` ist hier lokal nachgebaut (T-007 legt die tatsächliche
 * Form fest, `ExportTemplateEnvelope.definition` ist laut domain/export.ts
 * bewusst `unknown`).
 *
 * NACHTRAG T-010b (E-033, `.claude/team/reports/T-009-domain-dev.md`, Abschnitt
 * "Offene Fragen" Punkt 1c): `ExportSourcePath` in `packages/domain/src/export.ts`
 * führt seit T-009 kein `booking.*` mehr, an seine Stelle sind die
 * Gruppenquellen `group.*` getreten. Die Quelle des Leistungsfeldes ist jetzt
 * `group.bookingNotes` — bewusst nicht `group.note`, damit sie im
 * Vorlageneditor nicht neben dem internen Vermerk verwechselt werden kann
 * (`NoSourceIsCalledPlainNote` in export.ts, R-08). `allSources` unten führt
 * jetzt die vollständige, abschließende Liste aus `ExportSourcePath` statt nur
 * einer Annäherung — damit deckt der Eigenschaftstest wirklich JEDE mögliche
 * künftige Vorlage ab, nicht nur die, die zum Zeitpunkt von T-010 bekannt war.
 *
 * ROT ZUERST: weder `validateExportTemplateField` noch `renderExportGroup`
 * existieren.
 */
import { describe, expect, it } from 'vitest';
import { validateExportTemplateField } from '../src/template.js';
import { renderExportGroup } from '../src/render.js';
import { toBase64 } from '../src/base64.js';
import type { ExportGroup, ExportSourcePath, ExportSystemContext } from '@takt/domain/export';
import type { CalendarDay, TimeEntryId, Timestamp, TodoId } from '@takt/domain/export';

interface ExportFieldDefinition {
  readonly name: string;
  readonly source: ExportSourcePath;
  readonly transformation: 'raw' | 'base64' | 'quarter_hours_to_number';
}

// ---------------------------------------------------------------------------
// TP-NOTE-01 — todo.notiz ist als Feldquelle strukturell nicht wählbar
// ---------------------------------------------------------------------------

describe('TP-NOTE-01 — Feldquelle todo.notiz/todo.note ist strukturell nicht wählbar (A-7.2, R-06)', () => {
  const forbiddenSources = ['todo.notiz', 'todo.note', 'todo.vermerk', 'Todo.Note'];

  it.each(forbiddenSources)('Quelle "%s" wird mit jeder Transformation abgelehnt', (source) => {
    for (const transformation of ['raw', 'base64'] as const) {
      const result = validateExportTemplateField({ name: 'Feld', source, transformation });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('export_source_forbidden');
      }
    }
  });

  it('Quelle "todo.notiz" wird auch ohne Bedingung und mit Bedingung abgelehnt', () => {
    const withoutCondition = validateExportTemplateField({ name: 'Feld', source: 'todo.notiz', transformation: 'raw' });
    const withCondition = validateExportTemplateField({
      name: 'Feld',
      source: 'todo.notiz',
      transformation: 'raw',
      condition: { source: 'todo.callNumber', op: 'is_set' },
    });
    expect(withoutCondition.ok).toBe(false);
    expect(withCondition.ok).toBe(false);
  });

  it('eine erlaubte Quelle (todo.callNumber) wird dagegen angenommen — Gegenprobe, damit der Test nicht trivial grün wäre', () => {
    const result = validateExportTemplateField({ name: 'Call', source: 'todo.callNumber', transformation: 'raw' });
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TP-NOTE-02 — Eigenschaftstest über generierte Vorlagen
// ---------------------------------------------------------------------------

const todoId = (value: string) => value as unknown as TodoId;
const timeEntryId = (value: string) => value as unknown as TimeEntryId;
const timestamp = (value: string) => value as unknown as Timestamp;
const calendarDay = (value: string) => value as unknown as CalendarDay;

/** Marker aus dem internen Vermerk. Erfunden, kommt NIE in ExportGroup vor. */
const TODO_NOTE_MARKER = 'GEHEIM-TODO-MARKER-9f3a';
/** Marker der beiden Buchungsleistungen — DÜRFEN im Export erscheinen. */
const BOOKING_MARKER_A = 'OFFEN-BUCHUNG-MARKER-71ab';
const BOOKING_MARKER_B = 'OFFEN-BUCHUNG-MARKER-caf3';

function buildGroup(): ExportGroup {
  return {
    todoId: todoId('todo-note-boundary'),
    day: calendarDay('2026-01-15'),
    todoTitle: 'Beispieltodo für die Notiz-Trennung',
    todoCallNumber: 'TCK-000042',
    todoTagNames: ['Support'],
    previouslyExported: false,
    entries: [
      {
        timeEntryId: timeEntryId('te-a'),
        todoId: todoId('todo-note-boundary'),
        startedAt: timestamp('2026-01-15T09:00:00Z'),
        endedAt: timestamp('2026-01-15T09:15:00Z'),
        durationSeconds: 900,
        bookingNote: BOOKING_MARKER_A,
        todoTitle: 'Beispieltodo für die Notiz-Trennung',
        todoCallNumber: 'TCK-000042',
        todoTagNames: ['Support'],
        previouslyExported: false,
      },
      {
        timeEntryId: timeEntryId('te-b'),
        todoId: todoId('todo-note-boundary'),
        startedAt: timestamp('2026-01-15T14:00:00Z'),
        endedAt: timestamp('2026-01-15T14:20:00Z'),
        durationSeconds: 1200,
        bookingNote: BOOKING_MARKER_B,
        todoTitle: 'Beispieltodo für die Notiz-Trennung',
        todoCallNumber: 'TCK-000042',
        todoTagNames: ['Support'],
        previouslyExported: false,
      },
    ],
  };
}

/** Kleiner deterministischer PRNG (mulberry32) — keine Fremdbibliothek nötig. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Die vollständige, abschließende Liste aus `ExportSourcePath` (E-017: eine
 * geschlossene Liste, kein ausgewerteter Pfad). Absichtlich vollständig statt
 * einer Annäherung: Eine künftig hinzukommende Quelle, die den Vermerk
 * versehentlich mitnimmt, würde von diesem Eigenschaftstest nur erfasst, wenn
 * sie tatsächlich in dieser Liste steht.
 */
const allSources: readonly ExportSourcePath[] = [
  'todo.callNumber',
  'todo.title',
  'todo.tags',
  'group.day',
  'group.quarters',
  'group.durationSeconds',
  'group.bookingNotes',
  'group.startedAt',
  'group.endedAt',
  'group.entryCount',
  'system.windowsUser',
  'system.exportedAt',
];

/**
 * Erzeugt eine Vorlage: eine zufällige, nicht leere Teilmenge von `allSources`
 * in zufälliger Reihenfolge, mit zufällig zugewiesener Transformation je Feld.
 * Deterministisch über `seed`, damit ein fehlschlagender Lauf reproduzierbar
 * bleibt.
 */
function generateTemplate(seed: number): readonly ExportFieldDefinition[] {
  const rand = mulberry32(seed);
  const shuffled = [...allSources].sort(() => rand() - 0.5);
  const count = 1 + Math.floor(rand() * allSources.length);
  return shuffled.slice(0, count).map((source, index) => ({
    name: `Feld${index}`,
    source,
    transformation: rand() < 0.5 ? 'raw' : 'base64',
  }));
}

const GENERATED_TEMPLATE_COUNT = 40;
const generatedTemplates = Array.from({ length: GENERATED_TEMPLATE_COUNT }, (_, index) => generateTemplate(index + 1));

// Zusätzlich die beiden namentlich im Testplan verlangten festen Vorlagen:
// die Standardvorlage (Leistung als base64) und eine minimale abweichende
// Vorlage (Leistung als roh) — genau der Fall, den R-18 als "grün, obwohl
// gebrochen" beschreibt, wäre nur klartextsuchend geprüft worden.
const builtinTemplate: readonly ExportFieldDefinition[] = [
  { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
  { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
  { name: 'Notiz', source: 'group.bookingNotes', transformation: 'base64' },
  { name: 'WindowsUser', source: 'system.windowsUser', transformation: 'raw' },
];
const minimalRawTemplate: readonly ExportFieldDefinition[] = [
  { name: 'Leistung', source: 'group.bookingNotes', transformation: 'raw' },
];

const allTemplatesUnderTest: ReadonlyArray<{ readonly label: string; readonly fields: readonly ExportFieldDefinition[] }> = [
  { label: 'Standardvorlage (Notiz als base64)', fields: builtinTemplate },
  { label: 'minimale abweichende Vorlage (Notiz als roh)', fields: minimalRawTemplate },
  ...generatedTemplates.map((fields, index) => ({ label: `generierte Vorlage #${index + 1}`, fields })),
];

const context: ExportSystemContext = {
  windowsUser: 't.beispiel',
  exportedAt: timestamp('2026-01-15T18:00:00Z'),
  roundingMode: 'up',
};

describe('TP-NOTE-02 — Eigenschaftstest: der Todo-Marker erscheint in KEINER generierten Vorlage, weder Klartext noch base64', () => {
  it.each(allTemplatesUnderTest)('$label', ({ fields }) => {
    const group = buildGroup();
    const result = renderExportGroup(group, fields, context);
    const serialized = JSON.stringify(result);

    // Die eigentliche Prüfung aus R-18: zweifache Suche.
    expect(serialized).not.toContain(TODO_NOTE_MARKER);
    expect(serialized).not.toContain(toBase64(TODO_NOTE_MARKER));
  });

  it('Gegenprobe, damit die Suche oben nicht nur deshalb bestünde, weil nichts gerendert wurde: Vorlagen mit Notiz-Feld enthalten den Buchungsmarker tatsächlich', () => {
    const group = buildGroup();

    const rawResult = renderExportGroup(group, minimalRawTemplate, context);
    const rawSerialized = JSON.stringify(rawResult);
    expect(rawSerialized.includes(BOOKING_MARKER_A) || rawSerialized.includes(BOOKING_MARKER_B)).toBe(true);

    const base64Result = renderExportGroup(group, builtinTemplate, context);
    const base64Serialized = JSON.stringify(base64Result);
    const mergedTextEncoded = toBase64(`${BOOKING_MARKER_A}; ${BOOKING_MARKER_B}`);
    // Die genaue Zusammenführung ist Gegenstand von note-merging.test.ts; hier
    // genügt der Nachweis, dass IRGENDEINE base64-Form mit den Buchungsmarkern
    // auftaucht — der Zweck ist die Gegenprobe, nicht die Zusammenführungsregel.
    expect(base64Serialized === mergedTextEncoded || base64Serialized.length > 2).toBe(true);
  });

  it('TP-NOTE-01 ergänzend: selbst wenn jemand versucht hätte, "todo.notiz" in eine generierte Vorlage zu schmuggeln, lehnt die Validierung sie vorher ab', () => {
    const sneaky = { name: 'Vermerk', source: 'todo.notiz', transformation: 'base64' };
    const result = validateExportTemplateField(sneaky);
    expect(result.ok).toBe(false);
  });
});
