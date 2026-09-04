/**
 * Takt — T-027, von der Zeile zum Domänenwert (`src/sqlite/mappers.ts`).
 *
 * Ein stiller Fehler hier verfälscht alles darüber, wie der Kopfkommentar der
 * Datei selbst sagt. Diese Tests bauen `SqlRow`-Werte von Hand — genau die
 * Form, in der eine Zeile aus `node:sqlite` kommt — und prüfen jede
 * Übersetzungsfunktion einzeln, einschließlich ihrer Fehlerfälle.
 */
import { describe, expect, it } from 'vitest';
import type { SqlRow } from '../src/sqlite/database.ts';
import {
  RULE_REFERENCE_LIMIT,
  RULE_REFERENCE_PROBE,
  asTimestamp,
  poolReference,
  poolReferences,
  toAppSettings,
  toDefaultTag,
  toExportAuditEntry,
  toExportRun,
  toExportTemplate,
  toPool,
  toPoolCompletion,
  toPoolExportState,
  toPoolRuleTerm,
  toRoundingMode,
  toRunningTimeEntry,
  toTag,
  toTagFolder,
  toTimeEntry,
  toTodo,
  toTodoNote,
  toTodoStatus,
} from '../src/sqlite/mappers.ts';

describe('asTimestamp', () => {
  it('reicht die Zeichenkette unverändert als Timestamp durch', () => {
    expect(asTimestamp('2026-08-31T08:00:00Z')).toBe('2026-08-31T08:00:00Z');
  });
});

describe('toTodoStatus', () => {
  it('übersetzt eine vollständige Zeile', () => {
    const row: SqlRow = {
      id: 'status-1',
      name: 'Backlog',
      position: 1,
      is_default: 1,
      color: '#fff',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };
    expect(toTodoStatus(row)).toEqual({
      id: 'status-1',
      name: 'Backlog',
      position: 1,
      isDefault: true,
      color: '#fff',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });
  });

  it('is_default = 0 wird zu false, color = NULL bleibt null', () => {
    const row: SqlRow = {
      id: 's',
      name: 'n',
      position: 2,
      is_default: 0,
      color: null,
      created_at: 'a',
      updated_at: 'b',
    };
    expect(toTodoStatus(row).isDefault).toBe(false);
    expect(toTodoStatus(row).color).toBeNull();
  });
});

describe('toTodo — ohne den internen Vermerk (A-7.2, R-06)', () => {
  const base: SqlRow = {
    id: 'todo-1',
    title: 'Titel',
    call_number: null,
    status_id: 'status-1',
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  };

  it('übersetzt eine offene, aktive Karte', () => {
    const todo = toTodo(base, ['tag-1', 'tag-2'] as never);
    expect(todo).toMatchObject({ id: 'todo-1', title: 'Titel', callNumber: null, completedAt: null });
    expect(todo.tagIds).toEqual(['tag-1', 'tag-2']);
    // Kein Feld heißt "note", "vermerk" oder ähnlich — die Zeile hat den
    // Vermerk nie enthalten, aber ein Test soll das nicht nur annehmen.
    expect(Object.keys(todo)).not.toContain('note');
  });

  it('completed_at gesetzt wird zu einem Timestamp, nicht zu einem Wahrheitswert', () => {
    const todo = toTodo({ ...base, completed_at: '2026-01-03T00:00:00Z' }, []);
    expect(todo.completedAt).toBe('2026-01-03T00:00:00Z');
  });

  it('call_number gesetzt wird durchgereicht', () => {
    const todo = toTodo({ ...base, call_number: 'ABC123' }, []);
    expect(todo.callNumber).toBe('ABC123');
  });
});

describe('toTodoNote', () => {
  it('übersetzt eine Vermerkzeile', () => {
    const note = toTodoNote({ todo_id: 'todo-1', body: 'Hallo Ärger 🎉', updated_at: 't' });
    expect(note).toEqual({ todoId: 'todo-1', text: 'Hallo Ärger 🎉', updatedAt: 't' });
  });
});

describe('toTag / toTagFolder', () => {
  it('toTag: folder_id null bleibt null, gesetzt wird gebrandet', () => {
    const root = toTag({ id: 't1', folder_id: null, name: 'Root', color: null, created_at: 'a', updated_at: 'b' });
    expect(root.folderId).toBeNull();
    const nested = toTag({ id: 't2', folder_id: 'f1', name: 'Nested', color: '#f00', created_at: 'a', updated_at: 'b' });
    expect(nested.folderId).toBe('f1');
  });

  it('toTagFolder: parent_id null bleibt null, gesetzt wird gebrandet', () => {
    const root = toTagFolder({ id: 'f1', parent_id: null, name: 'Root', created_at: 'a', updated_at: 'b' });
    expect(root.parentId).toBeNull();
    const nested = toTagFolder({ id: 'f2', parent_id: 'f1', name: 'Nested', created_at: 'a', updated_at: 'b' });
    expect(nested.parentId).toBe('f1');
  });
});

describe('toPool / toPoolRuleTerm', () => {
  it('toPool: match_mode "all" bleibt "all", jeder andere Wert wird zu "any"', () => {
    const all = toPool({ id: 'p', name: 'Pool', match_mode: 'all', include_subfolders: 1, position: 1, created_at: 'a', updated_at: 'b' }, []);
    expect(all.matchMode).toBe('all');
    const any = toPool({ id: 'p', name: 'Pool', match_mode: 'garbage', include_subfolders: 0, position: 1, created_at: 'a', updated_at: 'b' }, []);
    expect(any.matchMode).toBe('any');
    expect(any.includeSubfolders).toBe(false);
  });

  it('toPoolRuleTerm: tag_id gesetzt ergibt einen Tag-Term, sonst einen Ordner-Term', () => {
    expect(toPoolRuleTerm({ tag_id: 'tag-1', folder_id: null })).toEqual({ kind: 'tag', tagId: 'tag-1' });
    expect(toPoolRuleTerm({ tag_id: null, folder_id: 'folder-1' })).toEqual({ kind: 'folder', folderId: 'folder-1' });
  });
});

describe('toPoolCompletion / toPoolExportState — die Erledigt- und Exportstatus-Achse einer Regel (T-076)', () => {
  it('toPoolCompletion: "done" und "open" bleiben, jeder andere Wert (auch undefined) wird zum Neutralwert "any"', () => {
    expect(toPoolCompletion('done')).toBe('done');
    expect(toPoolCompletion('open')).toBe('open');
    expect(toPoolCompletion('garbage')).toBe('any');
    expect(toPoolCompletion(undefined)).toBe('any');
  });

  it('toPoolExportState: "open" und "exported" bleiben, jeder andere Wert (auch undefined) wird zum Neutralwert "any"', () => {
    expect(toPoolExportState('open')).toBe('open');
    expect(toPoolExportState('exported')).toBe('exported');
    expect(toPoolExportState('garbage')).toBe('any');
    expect(toPoolExportState(undefined)).toBe('any');
  });

  it('toPool liest completion und exportState über genau diese beiden Funktionen (kein zweiter Übersetzungsweg)', () => {
    const row: SqlRow = {
      id: 'p',
      name: 'Pool',
      match_mode: 'any',
      include_subfolders: 0,
      position: 1,
      completion: 'done',
      export_state: 'exported',
      created_at: 'a',
      updated_at: 'b',
    };
    const pool = toPool(row, []);
    expect(pool.completion).toBe('done');
    expect(pool.exportState).toBe('exported');
  });
});

describe('toTimeEntry — wirft auf eine laufende Buchung (kein stiller Rückfall)', () => {
  const base: SqlRow = {
    id: 'te-1',
    todo_id: 'todo-1',
    started_at: '2026-08-31T08:00:00Z',
    ended_at: '2026-08-31T08:15:00Z',
    duration_seconds: 900,
    note: 'Leistung',
    export_status: 'open',
    export_count: 0,
    source: 'timer',
    created_at: 'a',
    updated_at: 'b',
  };

  it('übersetzt eine abgeschlossene Buchung vollständig', () => {
    expect(toTimeEntry(base)).toEqual({
      id: 'te-1',
      todoId: 'todo-1',
      startedAt: '2026-08-31T08:00:00Z',
      endedAt: '2026-08-31T08:15:00Z',
      durationSeconds: 900,
      note: 'Leistung',
      exportStatus: 'open',
      exportCount: 0,
      source: 'timer',
      createdAt: 'a',
      updatedAt: 'b',
    });
  });

  it('wirft, wenn ended_at NULL ist — eine laufende Buchung ist kein TimeEntry', () => {
    expect(() => toTimeEntry({ ...base, ended_at: null })).toThrow(/kein TimeEntry/);
  });

  it('export_status "exported" bleibt "exported", jeder andere Wert wird zu "open"', () => {
    expect(toTimeEntry({ ...base, export_status: 'exported' }).exportStatus).toBe('exported');
    expect(toTimeEntry({ ...base, export_status: 'irgendwas' }).exportStatus).toBe('open');
  });

  it('source "manual" bleibt "manual", jeder andere Wert wird zu "timer"', () => {
    expect(toTimeEntry({ ...base, source: 'manual' }).source).toBe('manual');
    expect(toTimeEntry({ ...base, source: 'irgendwas' }).source).toBe('timer');
  });
});

describe('toRunningTimeEntry', () => {
  it('übersetzt eine laufende Buchung ohne Ende und ohne Dauer', () => {
    const running = toRunningTimeEntry({ id: 'te-1', todo_id: 'todo-1', started_at: 'a', note: 'x' });
    expect(running).toEqual({ id: 'te-1', todoId: 'todo-1', startedAt: 'a', note: 'x', source: 'timer' });
  });
});

describe('toRoundingMode', () => {
  it('"nearest" bleibt "nearest", jeder andere Wert wird zu "up"', () => {
    expect(toRoundingMode('nearest')).toBe('nearest');
    expect(toRoundingMode('up')).toBe('up');
    expect(toRoundingMode('irgendwas')).toBe('up');
  });
});

describe('toExportTemplate', () => {
  it('parst die Feldliste als JSON, ohne sie zu deuten (E-005)', () => {
    const template = toExportTemplate({
      id: 'tpl-1',
      name: 'Standard',
      is_builtin: 1,
      definition: JSON.stringify({ fields: ['Call'] }),
      created_at: 'a',
      updated_at: 'b',
    });
    expect(template.isBuiltin).toBe(true);
    expect(template.definition).toEqual({ fields: ['Call'] });
  });
});

describe('toExportRun', () => {
  it('übersetzt eine vollständige Zeile inklusive geparster Vorlagenkopie', () => {
    const run = toExportRun({
      id: 'run-1',
      template_id: 'tpl-1',
      template_snapshot: JSON.stringify({ fields: [] }),
      file_path: '/x.txt',
      file_sha256: 'a'.repeat(64),
      byte_size: 10,
      entry_count: 2,
      total_quarters: 4,
      rounding_mode: 'up',
      windows_user: 't.beispiel',
      created_at: 'a',
    });
    expect(run).toMatchObject({ id: 'run-1', bytes: 10, entryCount: 2, totalQuarters: 4, roundingMode: 'up' });
    expect(run.templateSnapshot).toEqual({ fields: [] });
  });
});

describe('toExportAuditEntry', () => {
  it('event "reset" bleibt "reset", jeder andere Wert wird zu "exported"', () => {
    const base: SqlRow = {
      id: 'audit-1',
      time_entry_id: 'te-1',
      event: 'reset',
      previous_status: 'exported',
      new_status: 'open',
      export_run_id: null,
      export_run_group_id: null,
      actor: 't.beispiel',
      reason: 'Korrektur',
      occurred_at: 'a',
    };
    expect(toExportAuditEntry(base).event).toBe('reset');
    expect(toExportAuditEntry({ ...base, event: 'exported' }).event).toBe('exported');
    expect(toExportAuditEntry({ ...base, event: 'irgendwas' }).event).toBe('exported');
  });

  it('exportRunId / exportRunGroupId bleiben null, wenn die Spalten NULL sind, sonst gebrandet', () => {
    const withRun = toExportAuditEntry({
      id: 'audit-1',
      time_entry_id: 'te-1',
      event: 'exported',
      previous_status: 'open',
      new_status: 'exported',
      export_run_id: 'run-1',
      export_run_group_id: 'group-1',
      actor: 't.beispiel',
      reason: '',
      occurred_at: 'a',
    });
    expect(withRun.exportRunId).toBe('run-1');
    expect(withRun.exportRunGroupId).toBe('group-1');
  });
});

describe('toAppSettings', () => {
  it('theme "light"/"dark" bleiben, jeder andere Wert wird zu "system"', () => {
    const base: SqlRow = {
      export_directory: null,
      active_export_template_id: null,
      rounding_mode: 'up',
      locale: 'de-DE',
      theme: 'light',
      updated_at: 'a',
    };
    expect(toAppSettings(base).theme).toBe('light');
    expect(toAppSettings({ ...base, theme: 'dark' }).theme).toBe('dark');
    expect(toAppSettings({ ...base, theme: 'irgendwas' }).theme).toBe('system');
  });

  it('activeExportTemplateId bleibt null, wenn die Spalte NULL ist', () => {
    const settings = toAppSettings({
      export_directory: '/exporte',
      active_export_template_id: null,
      rounding_mode: 'nearest',
      locale: 'de-DE',
      theme: 'system',
      updated_at: 'a',
    });
    expect(settings.activeExportTemplateId).toBeNull();
    expect(settings.exportDirectory).toBe('/exporte');
  });
});

describe('toDefaultTag', () => {
  it('übersetzt Kennung und Position', () => {
    expect(toDefaultTag({ tag_id: 'tag-1', position: 3 })).toEqual({ tagId: 'tag-1', position: 3 });
  });
});

/**
 * T-105 (Auftrag aus `reports/T-101-domain-dev.md`, R-3a H-3): `poolReference`
 * und `poolReferences` waren vor dieser Ergänzung von keinem Test benannt —
 * nur über die echte Datenbank in `repo-tags-folder-in-rule.test.ts` indirekt
 * mitgelaufen. Diese Datei prüft beide Funktionen rein, ohne SQL.
 *
 * `poolReferences` bekommt `rows` mit `LIMIT RULE_REFERENCE_PROBE`
 * (`RULE_REFERENCE_LIMIT + 1`) übergeben — eine Zeile mehr, als sie zeigt, um
 * die Kürzung zu BEMERKEN. Getestet wird deshalb genau an der Grenze: 20
 * Zeilen (keine Kürzung) gegen 21 Zeilen (Kürzung auf 20 plus Hinweistext).
 */
describe('poolReference — ein einzelner Regelverweis für `details`', () => {
  it('bildet { id, name } auf { field, code: "pool_rule", message: \'Regel „…“\' } ab', () => {
    expect(poolReference({ id: 'pool-1', name: 'Abrechnung' })).toEqual({
      field: 'pool-1',
      code: 'pool_rule',
      message: 'Regel „Abrechnung“',
    });
  });
});

describe('poolReferences — Obergrenze der genannten Regeln (R-3a H-3: 21 geholt, 20 genannt, Hinweis im Text)', () => {
  const row = (n: number): SqlRow => ({ id: `pool-${String(n)}`, name: `Regel ${String(n)}` });

  it('RULE_REFERENCE_LIMIT ist 20, RULE_REFERENCE_PROBE ist genau eins mehr (21)', () => {
    expect(RULE_REFERENCE_LIMIT).toBe(20);
    expect(RULE_REFERENCE_PROBE).toBe(21);
  });

  it('eine leere Liste ergibt keine details und keinen Hinweistext', () => {
    expect(poolReferences([])).toEqual({ details: [], notice: '' });
  });

  it('fünf Zeilen: alle fünf erscheinen, kein Hinweistext', () => {
    const rows = [row(1), row(2), row(3), row(4), row(5)];
    const result = poolReferences(rows);
    expect(result.details).toHaveLength(5);
    expect(result.notice).toBe('');
  });

  it('GENAU 20 Zeilen (die Grenze selbst): alle 20 erscheinen, noch KEIN Hinweistext — rows.length > LIMIT ist an dieser Stelle falsch', () => {
    const rows = Array.from({ length: RULE_REFERENCE_LIMIT }, (_, i) => row(i + 1));
    const result = poolReferences(rows);
    expect(result.details).toHaveLength(20);
    expect(result.notice).toBe('');
  });

  it('21 Zeilen (RULE_REFERENCE_PROBE, der Fall, für den die Abfrage eine Zeile mehr holt): genannt werden die ERSTEN 20, mit Hinweistext', () => {
    const rows = Array.from({ length: RULE_REFERENCE_PROBE }, (_, i) => row(i + 1));
    const result = poolReferences(rows);

    expect(result.details).toHaveLength(20);
    // Die ersten 20 in der Reihenfolge der Zeilen — nicht die letzten 20 und
    // nicht ungeordnet.
    expect(result.details.map((entry) => entry.field)).toEqual(
      Array.from({ length: 20 }, (_, i) => `pool-${String(i + 1)}`),
    );
    expect(result.details.some((entry) => entry.field === 'pool-21')).toBe(false);
    expect(result.notice).toBe(' Es sind mehr als 20; genannt werden die ersten 20.');
  });

  it('22 Zeilen (mehr als die Probe) ergeben denselben Hinweistext wie 21 — der Text nennt die Grenze, nicht die tatsächliche Überzahl', () => {
    const rows = Array.from({ length: 22 }, (_, i) => row(i + 1));
    const result = poolReferences(rows);
    expect(result.details).toHaveLength(20);
    expect(result.notice).toBe(' Es sind mehr als 20; genannt werden die ersten 20.');
  });
});
