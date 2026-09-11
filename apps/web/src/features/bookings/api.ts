import { request } from "../../api/client";
import type { Id, PoolMovement, TimeEntry, Timestamp } from "../../api/types";

/**
 * Takt — die Routen und Typen einer Zeitbuchung, die von Hand angefaßt wird
 * (A-6.6, A-6.9, E-012, E-047, R-10).
 *
 * Vier Routen. Alle vier ändern etwas an **einer** Buchung, und drei davon
 * ändern Geld: anlegen, ändern, ausbuchen, zurücksetzen.
 *
 * **Lesen steht nicht hier.** `listTimeEntries`, `getTimeEntry` und
 * `deleteTimeEntry` bleiben in `api/endpoints.ts` — sie haben Aufrufer in
 * `app/`, in `features/todos/` und in den Export-Ansichten, und was mehrere
 * Merkmale lesen, gehört keinem.
 */

/**
 * Die Antwort auf `POST /time-entries` — die Buchung **von Hand** (O-V,
 * Nachtrag zu E-061).
 *
 * Flach wie `TodoDoneResult` (`features/todos/api.ts`): die Buchung selbst,
 * `poolMovement` als Feld daneben. Dieselbe Gestalt an allen Routen, die eine
 * Bewegung melden, ist die eine Form aus E-061 Punkt 3.
 *
 * **Warum die Buchung von Hand überhaupt etwas bewegt.** Sie kann die *erste*
 * Buchung eines Todos sein und setzt damit „hat offene Buchungen" von falsch
 * auf wahr. Ein Todo ohne jede Buchung erfüllt seit E-055 keine Regel mit
 * `exportState: 'open'`; mit dieser Buchung erfüllt es sie. Der Dienst rechnet
 * die Bewegung deshalb nach derselben Rechnung wie der Timerstopp
 * (`closedEntryMovementStates`) und meldet sie mit demselben Anlaß `'booking'`.
 *
 * **Nicht `bookingMovementStates`** — die Buchung von Hand hebt „Erledigt"
 * nicht auf (A-2.5 spricht vom **Starten** der Zeiterfassung, nicht vom
 * Nachtragen eines Zeitraums). Mit `BOOKING_EFFECT` meldete diese Route für ein
 * erledigtes Todo ein Verlassen jeder Spalte `completion: 'done'`, das nicht
 * stattfindet: Der Benutzer läse „ist aus „Erledigt“ verschwunden." und sähe
 * die Karte danebenstehen. Vorgeschichte: `docs/decisions/bookings.md`.
 *
 * **`PoolMovement | null` und nichts anderes.** Kein optionales Feld und kein
 * `?? null` an der Aufrufstelle: Ein Feld, das fehlen *darf*, zwingt jede
 * Aufrufstelle zu einer Fallunterscheidung vor der eigentlichen, und ein
 * `?? null` verschwiege den Tag, an dem der Dienst es nicht mehr liefert.
 * `null` heißt hier wie überall „hier war keine Bewegung möglich" — nicht
 * „nicht geliefert".
 *
 * **Der `PATCH` hat kein Gegenstück.** Ein geänderter Zeitraum bewegt nichts:
 * Die Buchung war schon da, „hat offene Buchungen" stand bereits (O-V,
 * letzter Satz). `updateTimeEntry` liefert deshalb weiter die nackte
 * {@link TimeEntry}.
 */
export interface CreateTimeEntryResult extends TimeEntry {
  readonly poolMovement: PoolMovement | null;
}

/**
 * A-6.6 — Zeit von Hand erfassen.
 *
 * Die Antwort trägt seit O-V (Nachtrag zu E-061) die Poolbewegung neben der
 * Buchung ({@link CreateTimeEntryResult}). Der Grund ist derselbe wie bei
 * E-058 Punkt 6 für den Stopp: Diese Buchung kann die **erste** eines Todos
 * sein, und dann nimmt jede Spalte mit `exportState: 'open'` das Todo auf. Wer
 * am Timerstopp Auskunft gibt und an der Buchung von Hand schweigt, sagt die
 * halbe Wahrheit.
 *
 * Die Oberfläche rechnet nichts nach: Sie reicht `poolMovement` an
 * `bookingSentence` (`lib/movement.ts`) weiter, das den Satz aus
 * `poolMovementSentence` in `@takt/domain` holt.
 */
export function createTimeEntry(body: {
  todoId: Id;
  startedAt: Timestamp;
  endedAt: Timestamp;
  note: string;
}): Promise<CreateTimeEntryResult> {
  return request<CreateTimeEntryResult>("/time-entries", { method: "POST", body });
}

/**
 * Eine exportierte Buchung ist gesperrt (A-6.9): `time_entry_locked`.
 *
 * **Ohne `poolMovement`, und das ist der Vertrag** (O-V, letzter Satz): Ein
 * geänderter Zeitraum bewegt nichts. Die Buchung war schon da, „hat offene
 * Buchungen" stand bereits, und keine Achse einer Regel fragt nach Anfang oder
 * Ende. Die nackte {@link TimeEntry} ist deshalb hier die vollständige Antwort
 * und keine Lücke.
 */
export function updateTimeEntry(
  id: Id,
  body: { todoId?: Id; startedAt?: Timestamp; endedAt?: Timestamp; note?: string },
): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

/**
 * E-047 — „Nicht abrechnen".
 *
 * Der zweite und einzige andere Weg nach `exported`: Die Buchung wird als
 * abgeschlossen geführt, ohne dass eine Datei entsteht. `exportCount` bleibt
 * dabei **unverändert** — sie war in keinem Exportlauf, und eine erfundene
 * Eins ergäbe später eine Warnung vor einer zweiten Abrechnung, die nie eine
 * erste hatte.
 *
 * `reason` ist freiwillig (E-047). Ein zweiter Aufruf auf derselben Buchung
 * ergibt `409 export_status_unchanged` — sie ist dann bereits ausgebucht oder
 * exportiert.
 */
export function markNotBilled(id: Id, reason: string): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}/not-billed`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * E-012 — Exportstatus zurücksetzen. Die einzige Route, die ihn von Hand
 * ändert, und sie kann ihn ausschließlich auf `open` setzen.
 *
 * Die Begründung ist hier **Pflicht** (`minLength: 1`) und wandert unverändert
 * ins Protokoll (R-10). Das ist etwas anderes als der freiwillige Grund bei
 * „nicht abrechnen“ (E-047).
 */
export function resetExportStatus(id: Id, reason: string): Promise<TimeEntry> {
  return request<TimeEntry>(`/time-entries/${encodeURIComponent(id)}/export-status`, {
    method: "PUT",
    body: { status: "open", reason },
  });
}
