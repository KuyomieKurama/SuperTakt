/**
 * Takt — der Sicherungspunkt um mehrere Anweisungen, die nur gemeinsam gelten
 * (R-10, architektur.md 3.2, ecc:error-handling).
 *
 * ---------------------------------------------------------------------------
 * Wogegen
 * ---------------------------------------------------------------------------
 *
 * Ein fachlicher Fehlschlag ist im Adapter ein **Wert** und kein Wurf: `attempt`
 * fängt die SQLite-Störung und übersetzt sie in einen `TaktError`, den der
 * Aufrufer als `err(...)` weiterreicht. Das ist gewollt — eine
 * Namenskollision ist keine Ausnahme, sondern eine Antwort.
 *
 * Die Transaktionsklammer (`unit-of-work.ts`) nimmt aber nur bei einem **Wurf**
 * zurück. Ein Rückgabewert ist für sie ein erfolgreicher Durchlauf, und sie
 * schreibt fest. Wer also in einer Methode zwei Anweisungen schreibt und den
 * Fehlschlag der zweiten als Wert meldet, hinterlässt die erste — dauerhaft,
 * mitten in einer Klammer, die genau das ausschließen sollte:
 *
 * ```
 *   inTransaction(unit => unit.todoStatuses.update(id, {name, isDefault:true}))
 *                                   │
 *                                   ├─ UPDATE … SET is_default = 0    ✔ steht
 *                                   └─ UPDATE … SET name = 'Offen'    ✘ belegt
 *                                          ↓
 *                                   err('name_conflict')  ← kein Wurf
 *                                          ↓
 *                                   COMMIT                ← die 0 bleibt
 * ```
 *
 * Ergebnis: kein Bestand hat mehr eine Standardspalte, und die Anwendung
 * meldet nichts als „Name bereits vergeben". T-041 hat denselben Bau im
 * Exportprotokoll gemessen (Protokollzeile geschrieben, Statuswechsel
 * gescheitert, Zeile blieb stehen); T-047 hat ihn an sechs weiteren Stellen
 * gefunden.
 *
 * ---------------------------------------------------------------------------
 * Wie
 * ---------------------------------------------------------------------------
 *
 * Ein `SAVEPOINT` um die Anweisungen, `RELEASE` bei Erfolg, `ROLLBACK TO` bei
 * einem Fehlschlag. `ROLLBACK TO` beendet die **äußere** Transaktion nicht: Sie
 * läuft weiter, alles davor bleibt stehen, und der Aufrufer bekommt seinen
 * Fehlschlag als Wert, so wie bisher. Nur die halbe Änderung ist weg.
 *
 * **Voraussetzung.** Eine offene Transaktion. Ohne sie eröffnet `SAVEPOINT` in
 * SQLite selbst eine, und `RELEASE` schreibt sie fest — der Vorgang wird dann
 * seine eigene Transaktion. Das ist kein Schaden, aber es ist ein anderes
 * Verhalten, und deshalb steht es hier. Alle Aufrufer in Takt laufen über
 * `TransactionPort.inTransaction`.
 *
 * **Ein Wurf, der kein SQLite-Fehler ist**, geht unverändert durch: `attempt`
 * wirft ihn weiter, der Sicherungspunkt bleibt ungelöst, und die äußere
 * Klammer nimmt ohnehin alles zurück. Ein Programmierfehler soll ein
 * Programmierfehler bleiben.
 *
 * **Der Name** geht in eine SQL-Anweisung ein und darf deshalb nie aus einer
 * Eingabe stammen. Er ist an jeder Aufrufstelle eine Konstante im Quelltext;
 * `SAVEPOINT_NAME` hält das fest, statt es zu hoffen.
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
