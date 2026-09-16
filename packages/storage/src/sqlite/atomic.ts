/**
 * Fehlerwerte rollen eine äußere Transaktion nicht zurück; deshalb zusammengehörige Anweisungen
 * mit SAVEPOINT absichern.
 * Eine äußere Transaktion ist vorausgesetzt. Nicht-SQLite-Ausnahmen weiterwerfen;
 * Sicherungspunktnamen dürfen nie aus Eingaben stammen.
 */

import type { TaktError } from '@takt/domain';

import type { SqlConnection } from './database.ts';
import { attempt } from './errors.ts';

/**
 * Zulässige Sicherungspunktnamen: Kleinbuchstaben, Ziffern, Unterstrich.
 *
 * SQLite kennt keine Parameter für `SAVEPOINT`; der Name steht im Klartext in
 * der Anweisung. Diese Prüfung ist der Ersatz dafür (B-4.3). Sie kann nur einen
 * Programmierfehler treffen — kein Aufruf in Takt bildet den Namen aus Daten —
 * und wirft deshalb, statt einen Fehlerwert zu liefern.
 */
const SAVEPOINT_NAME = /^[a-z][a-z0-9_]{0,63}$/;

export type Attempted<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: TaktError };

/**
 * Führt `work` innerhalb eines Sicherungspunkts aus.
 *
 * Wie `attempt`, nur dass eine gefangene SQLite-Störung zusätzlich alles
 * zurücknimmt, was `work` bis dahin geschrieben hat.
 */
export function attemptAtomically<T>(conn: SqlConnection, name: string, work: () => T): Attempted<T> {
  return guarded(conn, name, work, () => false);
}

/**
 * Dieselbe Klammer für Arbeit, die ihren Fehlschlag **als Wert** meldet.
 *
 * `work` gibt `null` für „gelungen" und einen `TaktError` für „nicht gelungen"
 * zurück. Beides führt zum selben Ergebnis wie ein Wurf beziehungsweise ein
 * Erfolg: Der Fehler nimmt den Sicherungspunkt zurück.
 *
 * Das braucht, wer eine Anweisung an ihrer **Trefferzahl** misst statt an einer
 * Störung — `UPDATE … WHERE export_status = 'open'` trifft keine Zeile und
 * wirft trotzdem nicht.
 */
export function atomically(
  conn: SqlConnection,
  name: string,
  work: () => TaktError | null,
): { readonly ok: true } | { readonly ok: false; readonly error: TaktError } {
  // `didFail` ist der Grund, warum diese Funktion nicht `attemptAtomically`
  // benutzt: Ein Fehlschlag **als Wert** ist für `attempt` ein Erfolg, und der
  // Sicherungspunkt wäre freigegeben, bevor jemand hinsieht.
  const outcome = guarded(conn, name, work, (value) => value !== null);
  if (!outcome.ok) return { ok: false, error: outcome.error };
  return outcome.value === null ? { ok: true } : { ok: false, error: outcome.value };
}

/**
 * Der gemeinsame Kern. `didFail` entscheidet, ob ein **zurückgegebener** Wert
 * ein Fehlschlag ist; eine Störung ist ohnehin einer.
 */
function guarded<T>(
  conn: SqlConnection,
  name: string,
  work: () => T,
  didFail: (value: T) => boolean,
): Attempted<T> {
  if (!SAVEPOINT_NAME.test(name)) {
    throw new Error('Ein Sicherungspunktname muss eine Konstante aus Kleinbuchstaben sein.');
  }

  conn.exec(`SAVEPOINT ${name};`);
  const outcome = attempt(work);
  if (outcome.ok && !didFail(outcome.value)) {
    conn.exec(`RELEASE ${name};`);
    return outcome;
  }
  conn.exec(`ROLLBACK TO ${name};`);
  conn.exec(`RELEASE ${name};`);
  return outcome;
}
