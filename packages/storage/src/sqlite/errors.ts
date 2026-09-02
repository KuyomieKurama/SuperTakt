/**
 * Takt — SQLite-Meldungen in fachliche Fehler übersetzen
 * (architektur.md 5.4, ecc:error-handling).
 *
 * ```
 *    Speicherung             Domäne                      HTTP
 *    RAISE(ABORT,'…')    ►   TaktError                ►  Statuscode
 *    UNIQUE ux_…_running     'timer_already_running'     409
 *    CHECK duration          'validation_error'          422
 * ```
 *
 * Die Übersetzung geschieht an **genau einer** Stelle. Genau deshalb tragen die
 * Trigger im Schema absichtlich dieselben Zeichenketten wie die Fehlerkennungen
 * der Domäne (`time_entry_locked`, `append_only`,
 * `builtin_template_immutable`): Der Weg von der Datenbank bis in die Antwort
 * ist damit ohne Übersetzungstabelle nachvollziehbar.
 *
 * ---------------------------------------------------------------------------
 * Was hier **nicht** passiert
 * ---------------------------------------------------------------------------
 *
 * Die ursprüngliche SQLite-Meldung wird nie weitergereicht. Sie enthält
 * Tabellen-, Spalten- und Indexnamen, also Innenleben der Datenbank, und
 * B-2.4 verbietet das in einer Antwort. Sie geht in `details` nicht ein und in
 * `message` nicht: Die Texte hier sind Konstanten.
 *
 * Was nicht zugeordnet werden kann, wird `storage_error` — und zwar mit
 * demselben Text wie jede andere unbekannte Störung. Ein „unbekannter
 * Constraint XY" in einer Antwort wäre eine Einladung, das Schema von außen
 * abzutasten.
 */

import type { TaktError, TaktErrorCode } from '@takt/domain';
import { taktError } from '@takt/domain';

/**
 * Kennzeichen einer SQLite-Störung, wie `node:sqlite` sie wirft.
 *
 * Es wird bewusst strukturell geprüft und nicht auf eine Klasse: Die
 * Fehlerklasse von `node:sqlite` ist nicht exportiert, und ein `instanceof`
 * gegen eine nicht benennbare Klasse wäre eine Behauptung ohne Prüfung.
 */
interface SqliteFailure {
  readonly message: string;
  readonly code?: unknown;
  readonly errcode?: unknown;
}

function asFailure(error: unknown): SqliteFailure | null {
  if (typeof error !== 'object' || error === null) return null;
  const candidate = error as { message?: unknown; code?: unknown; errcode?: unknown };
  if (typeof candidate.message !== 'string') return null;
  return {
    message: candidate.message,
    code: candidate.code,
    errcode: candidate.errcode,
  };
}

/**
 * Zeichenketten, die ein `RAISE(ABORT, …)` im Schema auslöst, und ihre
 * fachliche Entsprechung.
 *
 * `append_only` hat keinen eigenen Fehlerschlüssel in der Domäne und bekommt
 * auch keinen. Der Versuch, eine Protokollzeile zu ändern, ist kein fachlicher
 * Fall, den ein Aufrufer behandeln könnte — es gibt keinen Anwendungsfall, der
 * das täte. Er wird `storage_error` und landet damit als 500 im Protokoll, wo
 * er hingehört.
 */
const RAISED: Readonly<Record<string, { readonly code: TaktErrorCode; readonly message: string }>> =
  Object.freeze({
    time_entry_locked: {
      code: 'time_entry_locked',
      message:
        'Diese Zeitbuchung ist bereits exportiert und damit gesperrt. Setzen Sie den Exportstatus zurück, wenn Sie sie ändern wollen.',
    },
    builtin_template_immutable: {
      code: 'builtin_template_immutable',
      message:
        'Die mitgelieferte Standardvorlage lässt sich weder ändern noch löschen. Legen Sie eine Kopie an.',
    },
    timer_not_running: {
      code: 'timer_not_running',
      message: 'Es läuft kein Timer.',
    },
  });

/**
 * Eindeutige Indizes, deren Verletzung einen eigenen fachlichen Namen hat.
 *
 * Der Indexname steht in der Meldung von SQLite (`UNIQUE constraint failed:
 * …`). Er wird hier **gelesen**, aber nie **ausgegeben**.
 */
const UNIQUE_INDEX: readonly {
  readonly needle: string;
  readonly code: TaktErrorCode;
  readonly message: string;
}[] = Object.freeze([
  {
    needle: 'ux_time_entry_running',
    code: 'timer_already_running',
    message: 'Es läuft bereits ein Timer. Er muss zuerst gestoppt werden.',
  },
  {
    needle: 'ux_todo_status_name',
    code: 'name_conflict',
    message: 'Eine Spalte mit diesem Namen gibt es bereits.',
  },
  {
    needle: 'ux_todo_status_position',
    code: 'conflict',
    message: 'Diese Reihenfolge der Spalten ist nicht eindeutig.',
  },
  {
    needle: 'ux_todo_status_default',
    code: 'conflict',
    message: 'Es kann nur eine Standardspalte geben.',
  },
  {
    needle: 'ux_tag_folder_name',
    code: 'name_conflict',
    message: 'In diesem Ordner gibt es bereits einen Unterordner mit diesem Namen.',
  },
  {
    needle: 'ux_tag_name',
    code: 'name_conflict',
    message: 'In diesem Ordner gibt es bereits ein Tag mit diesem Namen.',
  },
  {
    needle: 'ux_pool_name',
    code: 'name_conflict',
    message: 'Einen Pool mit diesem Namen gibt es bereits.',
  },
  {
    needle: 'ux_pool_position',
    code: 'conflict',
    message: 'Diese Reihenfolge der Pools ist nicht eindeutig.',
  },
  {
    needle: 'ux_export_template_name',
    code: 'name_conflict',
    message: 'Eine Exportvorlage mit diesem Namen gibt es bereits.',
  },
  {
    needle: 'ux_export_template_builtin',
    code: 'conflict',
    message: 'Es kann nur eine mitgelieferte Standardvorlage geben.',
  },
  {
    needle: 'ux_default_tag_position',
    code: 'conflict',
    message: 'Diese Reihenfolge der Standard-Tags ist nicht eindeutig.',
  },
  {
    needle: 'ux_export_run_group',
    code: 'conflict',
    message: 'Dieselbe Tagesgruppe steht zweimal im selben Exportlauf.',
  },
]);

interface GenericFailure {
  readonly code: TaktErrorCode;
  readonly message: string;
}

const GENERIC = Object.freeze({
    check: {
      code: 'validation_error',
      message: 'Die Eingabe verletzt eine Regel der Speicherung.',
    },
    foreign: {
      code: 'validation_error',
      message: 'Ein verwiesener Datensatz existiert nicht oder wird noch benutzt.',
    },
    restrict: {
      code: 'conflict',
      message: 'Dieser Datensatz wird noch verwendet und kann nicht entfernt werden.',
    },
    unique: {
      code: 'name_conflict',
      message: 'Dieser Wert ist bereits vergeben.',
    },
    unknown: {
      code: 'storage_error',
      message: 'Die Speicherung konnte den Vorgang nicht ausführen.',
    },
  }) satisfies Readonly<Record<string, GenericFailure>>;

/**
 * Übersetzt eine geworfene Störung in einen fachlichen Fehlerwert.
 *
 * Ist die Störung **keine** SQLite-Störung, wird sie weitergeworfen. Ein
 * Programmierfehler soll ein Programmierfehler bleiben und nicht als 409 in
 * einer Oberfläche landen, wo ihn niemand mehr findet.
 */
export function translateSqliteError(error: unknown): TaktError {
  const failure = asFailure(error);
  if (failure === null || failure.code !== 'ERR_SQLITE_ERROR') {
    throw error;
  }

  const message = failure.message;

  const raised = RAISED[message.trim()];
  if (raised !== undefined) {
    return taktError(raised.code, raised.message);
  }

  if (message.includes('UNIQUE constraint failed')) {
    for (const entry of UNIQUE_INDEX) {
      if (message.includes(entry.needle)) {
        return taktError(entry.code, entry.message);
      }
    }
    // Ohne Indexnamen in der Meldung (SQLite nennt bei einem eindeutigen Index
    // die Spalten, nicht den Index) bleibt die allgemeine Aussage. Sie ist
    // richtig und verrät nichts.
    return taktError(GENERIC.unique.code, GENERIC.unique.message);
  }

  if (message.includes('FOREIGN KEY constraint failed')) {
    return taktError(GENERIC.foreign.code, GENERIC.foreign.message);
  }

  if (message.includes('CHECK constraint failed')) {
    return taktError(GENERIC.check.code, GENERIC.check.message);
  }

  return taktError(GENERIC.unknown.code, GENERIC.unknown.message);
}

/**
 * Führt eine schreibende Anweisung aus und liefert das Ergebnis als Wert.
 *
 * Der Grund, warum das hier steht und nicht in jedem Adapter: Ein `try/catch`
 * je Schreibvorgang wird irgendwann einmal vergessen, und dann kommt eine
 * SQLite-Meldung mit Tabellennamen bis in eine Antwort. Diese Hülle ist die
 * eine Stelle, an der die Übersetzung geschieht.
 */
export function attempt<T>(work: () => T): { ok: true; value: T } | { ok: false; error: TaktError } {
  try {
    return { ok: true, value: work() };
  } catch (error) {
    return { ok: false, error: translateSqliteError(error) };
  }
}
