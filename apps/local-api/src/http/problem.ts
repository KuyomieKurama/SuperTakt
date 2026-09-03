/**
 * Takt — vom fachlichen Fehler zum Statuscode (architektur.md 5.2, 5.3).
 *
 * ===========================================================================
 * Die Zuordnung steht an **genau einer** Stelle
 * ===========================================================================
 *
 * Die Domäne kennt keinen Statuscode (E-001). Sie meldet `TaktError` mit einem
 * englischen `code` und einem deutschen Satz; hier wird daraus eine Antwort.
 * Die Trennung ist der Grund, warum sich die Bewertung eines Falls ändern
 * lässt, ohne eine Fachregel anzufassen — architektur.md 5.2 nennt genau das
 * für den Fall, dass T-003 `403` und `401` zusammenlegen will.
 *
 * ```
 *   400  Anfrage nicht lesbar
 *   404  not_found
 *   409  Widerspruch zum Zustand — der Aufrufer kann es später erneut versuchen
 *        oder erst etwas anderes ändern
 *   422  gelesen und für fachlich unzulässig befunden
 *   500  unerwartet; immer derselbe Text, nie Innenleben
 * ```
 *
 * **`400` gegen `422`:** `400` heißt, der Dienst konnte die Anfrage nicht
 * lesen; `422`, er hat sie gelesen und für unzulässig befunden. Für das Add-in
 * ist der Unterschied nützlich — er sagt, ob der Aufruf oder die Eingabe des
 * Benutzers falsch war.
 *
 * **Was nie in einer Antwort steht:** Ablaufverfolgung, SQL-Meldung, Dateipfad
 * außerhalb des gewählten Exportordners, das Token, Innenleben der Datenbank
 * (B-2.4). Die Sätze kommen aus der Domäne und sind dort Konstanten; dieser
 * Übersetzer setzt nichts ein.
 */

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { TaktError, TaktErrorCode, TaktFieldError } from '@takt/domain';

import type { TaktEnv } from './guards.ts';

/**
 * Statuscode je Fehlerschlüssel. Vollständig über `TaktErrorCode` — fehlt ein
 * Schlüssel, meldet es der Übersetzer und nicht ein Benutzer.
 */
const STATUS: Readonly<Record<TaktErrorCode, ContentfulStatusCode>> = Object.freeze({
  validation_error: 422,
  not_found: 404,

  // Widerspruch zum Zustand (409). Der Aufrufer hat richtig gefragt, aber der
  // Bestand steht dagegen.
  tag_folder_cycle: 409,
  tag_folder_not_empty: 409,
  tag_in_use: 409,
  name_conflict: 409,
  timer_already_running: 409,
  timer_not_running: 409,
  time_entry_locked: 409,
  export_status_unchanged: 409,
  export_status_not_settable: 409,
  export_nothing_to_do: 409,
  builtin_template_immutable: 409,
  status_in_use: 409,
  last_status_column: 409,
  // Der Standard-Status für neue Todos. 409 und nicht 422: Der Aufrufer hat
  // richtig gefragt, der Bestand steht dagegen — und er kann es ändern, indem
  // er zuerst einen anderen Status zum Standard macht (T-074).
  default_status_locked: 409,
  conflict: 409,

  // Gelesen, aber fachlich unzulässig (422).
  timer_too_short: 422,
  export_template_invalid: 422,
  export_source_forbidden: 422,
  export_directory_missing: 422,
  export_directory_not_writable: 422,
  export_path_outside_directory: 422,

  // Die Speicherung konnte nicht. Das ist kein Fall, den ein Aufrufer
  // behandeln kann — und die Ursache bleibt drinnen.
  storage_error: 500,
});

export interface FachErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: readonly TaktFieldError[];
  };
}

export function statusFor(code: TaktErrorCode): ContentfulStatusCode {
  return STATUS[code];
}

export function envelopeFor(error: TaktError): FachErrorEnvelope {
  return {
    error:
      error.details === undefined
        ? { code: error.code, message: error.message }
        : { code: error.code, message: error.message, details: error.details },
  };
}

/**
 * Antwortet mit einem fachlichen Fehler.
 *
 * `outcome` geht in die Protokollzeile — als **Schlüssel**, nie als Wert aus
 * der Anfrage (B-2.4 Punkt 2).
 */
export function fail(c: Context<TaktEnv>, error: TaktError): Response {
  c.set('outcome', error.code);
  const status = statusFor(error.code);
  if (status === 500) {
    // Nach außen derselbe Satz wie bei jeder anderen Störung. Der fachliche
    // Schlüssel bleibt im Protokoll.
    return c.json(
      { error: { code: 'internal_error', message: 'Ein unerwarteter Fehler ist aufgetreten.' } },
      500,
    );
  }
  return c.json(envelopeFor(error), status);
}

/** Eingabefehler aus der Gestaltprüfung (zod). Immer 422, immer feldbezogen. */
export function failValidation(
  c: Context<TaktEnv>,
  details: readonly TaktFieldError[],
  message = 'Die Eingabe ist unvollständig oder unzulässig.',
): Response {
  c.set('outcome', 'validation_error');
  return c.json({ error: { code: 'validation_error', message, details } }, 422);
}

/** Antwort mit Nutzlast. Einheitlich `{ "data": … }`, damit nie geraten wird. */
export function data<T>(c: Context<TaktEnv>, payload: T, status: ContentfulStatusCode = 200): Response {
  return c.json({ data: payload }, status);
}
