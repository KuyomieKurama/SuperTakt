/** Die Speicherung sichert die Änderungssperre zusätzlich durch Trigger ab. */

import type {
  ExportAuditId,
  ExportRunGroupId,
  ExportRunId,
  Result,
  TaktError,
  Timestamp,
  TimeEntryId,
} from './kernel.ts';
import { err, ok, taktError } from './kernel.ts';
import type { ExportStatus, TimeEntry } from './time-entry.ts';

// Exportstatuswechsel (A-6.9, E-012, R-10)

/**
 * Auch „nicht abrechnen“ setzt `exported`, erzeugt aber keine Datei. Erst der protokollierte
 * Auslöser unterscheidet beide Vorgänge.
 */
export type ExportStatusTransition =
  | { readonly from: 'open'; readonly to: 'exported'; readonly trigger: 'export_run' }
  | { readonly from: 'open'; readonly to: 'exported'; readonly trigger: 'not_billed' }
  | { readonly from: 'exported'; readonly to: 'open'; readonly trigger: 'reset' };

export type ExportStatusTrigger = ExportStatusTransition['trigger'];

export type CheckExportStatusTransition = (
  from: ExportStatus,
  to: ExportStatus,
  trigger: ExportStatusTrigger,
) => Result<
  ExportStatusTransition,
  TaktError<'export_status_unchanged' | 'export_status_not_settable'>
>;

/**
 * Exportierte Buchungen sind gegen Bearbeitung und Löschen gesperrt; der Exportstatus selbst muss
 * zurücksetzbar bleiben.
 */
export type IsLocked = (entry: Pick<TimeEntry, 'exportStatus'>) => boolean;

// Protokoll des Exportstatus (R-10) — Tabelle `export_audit`

/** `not_billed` hat weder Exportlauf noch Exportzeile; `exported` verlangt beides. */
export type ExportAuditEvent = 'exported' | 'reset' | 'not_billed';

/**
 * Unveränderliches Protokoll, damit erneute Abrechnungen derselben Zeit nachvollziehbar bleiben.
 * Trigger sperren UPDATE und DELETE.
 */
export interface ExportAuditEntry {
  readonly id: ExportAuditId;
  readonly timeEntryId: TimeEntryId;
  readonly event: ExportAuditEvent;
  readonly previousStatus: ExportStatus;
  readonly newStatus: ExportStatus;
  /** Gesetzt genau dann, wenn `event === 'exported'`. */
  readonly exportRunId: ExportRunId | null;
  /**
   * Nur bei `exported` gesetzt. Gerundete Werte gehören zur Tagesgruppe und werden über diese
   * Kennung nachgeschlagen.
   */
  readonly exportRunGroupId: ExportRunGroupId | null;
  /** Windows-Benutzername (E-010). Keine freie Eingabe. */
  readonly actor: string;
  /** Begründung aus dem Bestätigungsdialog beim Zurücksetzen. Darf leer sein. */
  readonly reason: string;
  readonly occurredAt: Timestamp;
}

/**
 * Antrag auf Zurücksetzen des Exportstatus (E-012).
 *
 * Je Buchung, nicht je Exportlauf. `reason` ist die Freitexteingabe aus dem
 * Bestätigungsdialog und wandert unverändert ins Protokoll.
 */
export interface ExportStatusResetRequest {
  readonly timeEntryId: TimeEntryId;
  readonly reason: string;
  readonly actor: string;
  readonly now: Timestamp;
}

export interface NotBilledRequest {
  readonly timeEntryId: TimeEntryId;
  /** Freiwillig. Wandert unverändert ins Protokoll. */
  readonly reason: string;
  /** Windows-Benutzername (E-010). Keine freie Eingabe. */
  readonly actor: string;
  readonly now: Timestamp;
}

/**
 * Ist die Buchung gegen Bearbeitung gesperrt? (A-6.9)
 *
 * Gesperrt sind Start, Ende, Dauer, Leistung, Todo-Zuordnung und das Löschen.
 * Nicht gesperrt ist der Exportstatus selbst — sonst ließe sich E-012 nicht
 * umsetzen. Dieselbe Regel steht als Trigger in der Speicherung, damit sie auch
 * dann greift, wenn ein späterer Anwendungsfall sie zu prüfen vergisst.
 */
export const isLocked: IsLocked = (entry) => entry.exportStatus === 'exported';

/**
 * Der Auslöser gehört zur Prüfung; ein Zielstatus allein belegt weder Export noch bewussten
 * Abrechnungsverzicht.
 */
export const checkExportStatusTransition: CheckExportStatusTransition = (from, to, trigger) => {
  if (from === to) {
    return err(
      taktError(
        'export_status_unchanged',
        'Der Exportstatus ist bereits auf diesem Wert; es gibt nichts zu ändern.',
      ),
    );
  }

  if (from === 'open' && to === 'exported' && trigger === 'export_run') {
    return ok({ from: 'open', to: 'exported', trigger: 'export_run' });
  }

  if (from === 'open' && to === 'exported' && trigger === 'not_billed') {
    return ok({ from: 'open', to: 'exported', trigger: 'not_billed' });
  }

  if (from === 'exported' && to === 'open' && trigger === 'reset') {
    return ok({ from: 'exported', to: 'open', trigger: 'reset' });
  }

  return err(
    taktError(
      'export_status_not_settable',
      'Dieser Wechsel des Exportstatus ist über diesen Weg nicht vorgesehen.',
    ),
  );
};

// Die Menge der Übergänge — gerechnet, nicht abgeschrieben (T-270)

/** Reiner Typ, kein Laufzeitanteil. `Assert<false>` verletzt seine Randbedingung. */
type Assert<T extends true> = T;

/**
 * Die Listen müssen alle typisierten Werte enthalten; `satisfies` und die Vollständigkeitsprüfung
 * sichern beide Richtungen ab.
 */
const EXPORT_STATUS_VALUES = ['open', 'exported'] as const satisfies readonly ExportStatus[];

const EXPORT_STATUS_TRIGGERS = [
  'export_run',
  'not_billed',
  'reset',
] as const satisfies readonly ExportStatusTrigger[];

/** Übersetzungsfehler, sobald `ExportStatus` einen Wert trägt, der oben fehlt. */
export type ExportStatusValuesAreComplete = Assert<
  Exclude<ExportStatus, (typeof EXPORT_STATUS_VALUES)[number]> extends never ? true : false
>;

/** Übersetzungsfehler, sobald ein Auslöser hinzukommt, der oben fehlt. */
export type ExportStatusTriggersAreComplete = Assert<
  Exclude<ExportStatusTrigger, (typeof EXPORT_STATUS_TRIGGERS)[number]> extends never ? true : false
>;

/** Leitet die Übergänge aus der Prüfung ab. Die Ergebnisreihenfolge ist keine Zusage. */
export const allowedExportStatusTransitions = (): readonly ExportStatusTransition[] =>
  EXPORT_STATUS_VALUES.flatMap((from) =>
    EXPORT_STATUS_VALUES.flatMap((to) =>
      EXPORT_STATUS_TRIGGERS.flatMap((trigger) => {
        const checked = checkExportStatusTransition(from, to, trigger);
        return checked.ok ? [checked.value] : [];
      }),
    ),
  );
