/**
 * Takt — der Exportstatus einer Buchung und das Protokoll dazu
 * (E-012, E-032, E-037, E-047, R-10).
 *
 * Die Regel steht hier nicht: Ob ein Statuswechsel zulässig ist, entscheidet
 * `checkExportStatusTransition` in der Domäne. Diese Datei ruft sie auf und
 * klammert das Schreiben — mehr nicht.
 *
 * Nach `exported` führt allein ein Exportlauf (`export.ts`). Was hier steht,
 * führt in die andere Richtung: zurück auf `open` und, als eigener Vorgang,
 * auf „nicht abrechnen".
 */

import type {
  ExportAuditEntry,
  ExportRun,
  ExportRunId,
  ExportStatus,
  TimeEntry,
  TimeEntryId,
} from '@takt/domain';
import { checkExportStatusTransition, err, ok, taktError } from '@takt/domain';
import type { ExportAuditFilter, Page, Pagination } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';

/**
 * Den Exportstatus einer Buchung zurücksetzen.
 *
 * **Nur nach `open`.** Der Weg nach `exported` führt allein über einen
 * Exportlauf; sonst gäbe es eine als abgerechnet markierte Buchung ohne Beleg.
 * Die Regel steht in der Domäne (`checkExportStatusTransition`) und wird hier
 * aufgerufen, bevor überhaupt gelesen wird — der Fehlschlag hängt an der
 * Absicht des Aufrufers, nicht am Bestand.
 *
 * `actor` ist der Windows-Benutzername aus dem Zusammenhang, **kein**
 * Eingabefeld. Ein Protokoll, dessen Urheber der Aufrufer selbst bestimmt,
 * belegt nichts (E-010, B-8.1).
 */
export async function setExportStatus(
  context: AppContext,
  id: TimeEntryId,
  target: ExportStatus,
  reason: string,
): Promise<UseCaseResult<TimeEntry>> {
  const timestamp = now(context);
  const actor = context.system.windowsUser();

  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timeEntries.load(id);
    if (entry === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));

    // Die Domäne urteilt über den Wechsel, und zwar über den **tatsächlichen**
    // Ausgangszustand. Ein fest verdrahtetes `from` wäre eine Annahme über den
    // Bestand — und sie fiele genau dort auf die Füße, wo sie am teuersten ist:
    // Der Versuch, `exported` von Hand zu setzen, ergäbe „ist schon so" statt
    // „geht auf diesem Weg nicht".
    const allowed = checkExportStatusTransition(entry.exportStatus, target, 'reset');
    if (!allowed.ok) return err(allowed.error);

    return unit.export.resetStatus({ timeEntryId: id, reason, actor, now: timestamp });
  });
}

/**
 * E-047 — „Nicht abrechnen".
 *
 * Der Gegenpart zu `setExportStatus`: Er führt dieselbe Buchung in die andere
 * Richtung, ohne dass eine Datei entsteht. Die Domäne urteilt auch hier über
 * den **tatsächlichen** Ausgangszustand — eine bereits ausgebuchte oder
 * exportierte Buchung ergibt `export_status_unchanged` (409) und nicht etwa
 * einen zweiten Protokolleintrag über denselben Vorgang.
 *
 * Der Vorgang heißt nirgends „als exportiert markieren". Exportiert wurde diese
 * Zeit nie; der Benutzer rechnet sie schlicht nicht ab (E-047).
 */
export async function markNotBilled(
  context: AppContext,
  id: TimeEntryId,
  reason: string,
): Promise<UseCaseResult<TimeEntry>> {
  const timestamp = now(context);
  const actor = context.system.windowsUser();

  return context.transactions.inTransaction(async (unit) => {
    const entry = await unit.timeEntries.load(id);
    if (entry === null) return err(taktError('not_found', 'Diese Buchung gibt es nicht.'));

    const allowed = checkExportStatusTransition(entry.exportStatus, 'exported', 'not_billed');
    if (!allowed.ok) return err(allowed.error);

    return unit.export.markNotBilled({ timeEntryId: id, reason, actor, now: timestamp });
  });
}

export function listExportRuns(
  context: AppContext,
  pagination: Pagination,
): Promise<Page<ExportRun>> {
  return context.transactions.inTransaction((unit) => unit.export.listRuns(pagination));
}

export async function loadExportRun(
  context: AppContext,
  id: ExportRunId,
): Promise<UseCaseResult<ExportRun>> {
  return context.transactions.inTransaction(async (unit) => {
    const run = await unit.export.loadRun(id);
    if (run === null) return err(taktError('not_found', 'Diesen Exportlauf gibt es nicht.'));
    return ok(run);
  });
}

/**
 * Das Exportprotokoll, gefiltert (R-10, T-042).
 *
 * Der Filter geht **in die Abfrage** und nicht in den Aufrufer. Bis T-042
 * beantwortete die Oberfläche „welche Buchungen waren in diesem Lauf?" durch
 * Sieben der gerade geladenen Seite — und ein Lauf mit mehr Buchungen als eine
 * Seite fasst, schiebt jeden älteren Lauf aus ihr heraus. Der Knopf versagte
 * damit genau bei den Läufen, für die man ihn drückt.
 */
export function listExportAudit(
  context: AppContext,
  filter: ExportAuditFilter,
  pagination: Pagination,
): Promise<Page<ExportAuditEntry>> {
  return context.transactions.inTransaction((unit) => unit.export.audit(filter, pagination));
}
