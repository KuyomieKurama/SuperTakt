/**
 * Takt — T-027, SQLite-Meldungen in fachliche Fehler übersetzen (architektur.md 5.4).
 *
 * `packages/storage/src/sqlite/errors.ts` lag laut T-021-Bericht (Risiko 1)
 * bei 0 Prozent Abdeckung. Die Übersetzung geschieht laut Kopfkommentar "an
 * genau einer Stelle" — dieser Test prüft jeden Zweig davon: jeden benannten
 * `RAISE(ABORT, …)`-Text, jeden eindeutigen Index mit eigenem fachlichem
 * Namen, die drei generischen Constraint-Arten, und dass eine Störung, die
 * keine SQLite-Störung ist, unverändert weitergeworfen wird — ein
 * Programmierfehler soll ein Programmierfehler bleiben.
 */
import { describe, expect, it } from 'vitest';
import { attempt, translateSqliteError } from '../src/sqlite/errors.ts';

function sqliteError(message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = 'ERR_SQLITE_ERROR';
  return error;
}

describe('translateSqliteError — RAISE(ABORT, …)-Texte', () => {
  it.each([
    ['time_entry_locked', 'time_entry_locked'],
    ['builtin_template_immutable', 'builtin_template_immutable'],
    ['timer_not_running', 'timer_not_running'],
  ])('"%s" wird zu %s', (raised, expectedCode) => {
    const result = translateSqliteError(sqliteError(raised));
    expect(result.code).toBe(expectedCode);
  });

  it('führende/nachgestellte Leerzeichen um den RAISE-Text werden beschnitten', () => {
    const result = translateSqliteError(sqliteError('  time_entry_locked  '));
    expect(result.code).toBe('time_entry_locked');
  });

  it('"append_only" hat keinen eigenen Schlüssel und wird zu storage_error (bewusst kein Anwendungsfall dafür)', () => {
    const result = translateSqliteError(sqliteError('append_only'));
    expect(result.code).toBe('storage_error');
  });
});

describe('translateSqliteError — eindeutige Indizes', () => {
  it.each([
    ['ux_time_entry_running', 'timer_already_running'],
    ['ux_todo_status_name', 'name_conflict'],
    ['ux_todo_status_position', 'conflict'],
    ['ux_todo_status_default', 'conflict'],
    ['ux_tag_folder_name', 'name_conflict'],
    ['ux_tag_name', 'name_conflict'],
    ['ux_pool_name', 'name_conflict'],
    ['ux_pool_position', 'conflict'],
    ['ux_export_template_name', 'name_conflict'],
    ['ux_export_template_builtin', 'conflict'],
    ['ux_default_tag_position', 'conflict'],
    ['ux_export_run_group', 'conflict'],
  ])('UNIQUE-Verletzung mit Indexnamen "%s" wird zu %s', (indexName, expectedCode) => {
    const message = `UNIQUE constraint failed: some_table.${indexName}`;
    const result = translateSqliteError(sqliteError(message));
    expect(result.code).toBe(expectedCode);
  });

  it('eine UNIQUE-Verletzung ohne bekannten Indexnamen wird zur allgemeinen Aussage — verrät nichts', () => {
    const result = translateSqliteError(sqliteError('UNIQUE constraint failed: some_table.spalte1, some_table.spalte2'));
    expect(result.code).toBe('name_conflict');
    expect(result.message).not.toContain('spalte1');
  });
});

describe('translateSqliteError — generische Constraint-Arten', () => {
  it('FOREIGN KEY constraint failed wird zu validation_error', () => {
    expect(translateSqliteError(sqliteError('FOREIGN KEY constraint failed')).code).toBe('validation_error');
  });

  it('CHECK constraint failed wird zu validation_error', () => {
    expect(translateSqliteError(sqliteError('CHECK constraint failed: duration_seconds')).code).toBe('validation_error');
  });

  it('jede andere Meldung wird zu storage_error, und die ursprüngliche Meldung erscheint nirgends im Ergebnis (B-2.4)', () => {
    const original = 'disk I/O error on table geheime_tabelle';
    const result = translateSqliteError(sqliteError(original));
    expect(result.code).toBe('storage_error');
    expect(JSON.stringify(result)).not.toContain('geheime_tabelle');
  });
});

describe('translateSqliteError — Weiterwurf bei Nicht-SQLite-Störungen', () => {
  it('eine Störung ohne den SQLite-Code wird unverändert weitergeworfen', () => {
    const programmerError = new TypeError('undefined is not a function');
    expect(() => translateSqliteError(programmerError)).toThrow(programmerError);
  });

  it('ein Wert, der kein Error-Objekt ist, wird ebenfalls weitergeworfen', () => {
    expect(() => translateSqliteError('ein Textwurf')).toThrow('ein Textwurf');
    expect(() => translateSqliteError({ nichtMessage: true })).toThrow();
    expect(() => translateSqliteError(null)).toThrow();
  });
});

describe('attempt — schreibt oder liefert den übersetzten Fehler als Wert', () => {
  it('liefert das Ergebnis der Arbeit bei Erfolg', () => {
    const result = attempt(() => 42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('fängt eine SQLite-Störung ab und übersetzt sie', () => {
    const result = attempt(() => {
      throw sqliteError('timer_not_running');
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('timer_not_running');
  });

  it('lässt eine Nicht-SQLite-Störung durch translateSqliteError erneut werfen', () => {
    expect(() =>
      attempt(() => {
        throw new TypeError('Programmierfehler');
      }),
    ).toThrow('Programmierfehler');
  });
});
