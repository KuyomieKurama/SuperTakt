import { cx } from "../lib/cx";
import {
  AUDIT_EVENT_DESCRIPTION,
  AUDIT_EVENT_STATE,
  auditEventLabel,
  type ExportAuditRowModel,
} from "../app/exportAudit";
import type { ExportAuditEvent } from "../lib/labels";
import { EXPORT_STATE } from "./ExportStatus";
import { Icon } from "./Icon";
import { Foreign } from "./Foreign";

/**
 * Takt — das Exportprotokoll auf dem Bildschirm (R-10, E-012, E-047, C-01).
 *
 * ## Was eine Zeile sagen muss
 *
 * Wann, welche Buchung, welcher Vorgang, welcher Lauf — und bei „nicht
 * abgerechnet" die freiwillige Begründung, falls eine eingetragen wurde. Das
 * ist die Auskunft, mit der R-10 eine Doppelabrechnung nachvollziehbar hält:
 * Wer sieht, dass eine Buchung am 3. exportiert, am 7. zurückgesetzt und am
 * 9. erneut exportiert wurde, sieht die Doppelabrechnung.
 *
 * ## Das Etikett zeigt den Vorgang, nicht den Status
 *
 * Es benutzt dieselben vier Erscheinungsbilder wie `ExportStatusBadge` — Haken
 * für „exportiert", Pfeil zurück für „zurückgesetzt", durchgestrichener Kreis
 * für „nicht abgerechnet" —, weil ein Vorgang und der Zustand, in den er
 * führt, gleich aussehen sollen. Es trägt aber die Beschriftung des
 * **Ereignisses** (E-047) und für Hilfsmittel das Wort „Vorgang" davor: Im
 * Protokoll steht, was geschah, nicht wo die Buchung heute steht.
 *
 * **Der Baustein rechnet und formatiert nichts.** Zeitpunkte, Zeiträume und
 * Dauern kommen fertig aus `app/exportAudit.ts`.
 */

export interface ExportAuditEventBadgeProps {
  readonly event: ExportAuditEvent;
  readonly size?: "sm" | "md";
  readonly className?: string;
}

export function ExportAuditEventBadge({
  event,
  size = "md",
  className,
}: ExportAuditEventBadgeProps) {
  const definition = EXPORT_STATE[AUDIT_EVENT_STATE[event]];
  return (
    <span
      className={cx("badge", `badge--${definition.slug}`, `badge--${size}`, className)}
      title={AUDIT_EVENT_DESCRIPTION[event]}
    >
      <Icon name={definition.icon} size={size === "sm" ? 12 : 14} />
      <span>
        <span className="visually-hidden">Vorgang: </span>
        {auditEventLabel(event)}
      </span>
    </span>
  );
}

export interface ExportAuditListProps {
  readonly models: readonly ExportAuditRowModel[];
  /**
   * Zeigt die betroffene Buchung mit an.
   *
   * Im Gesamtprotokoll (S-07) ist sie Pflicht — ohne sie ist eine Zeile keine
   * Auskunft. Im Verlauf **einer** Buchung steht sie schon im Kopf des
   * Dialogs; dort wäre sie in jeder Zeile dieselbe Wiederholung.
   */
  readonly showBooking?: boolean;
  /** Öffnet das Todo hinter einer Zeile. Fehlt im Dialog des eigenen Todos. */
  readonly onOpenTodo?: (todoId: string) => void;
  readonly className?: string;
}

export function ExportAuditList({
  models,
  showBooking = true,
  onOpenTodo,
  className,
}: ExportAuditListProps) {
  return (
    <ol className={cx("auditlist", className)}>
      {models.map((model) => (
        <li key={model.id} className={cx("auditrow", `auditrow--${model.event}`)}>
          <div className="auditrow__head">
            <time className="auditrow__when tabular" dateTime={model.occurredAtIso}>
              {model.occurredAt}
            </time>
            <ExportAuditEventBadge event={model.event} size="sm" />
            <span className="auditrow__transition">
              <span className="visually-hidden">Statuswechsel: </span>
              {model.transition}
            </span>
            {!showBooking || model.booking === null ? null : onOpenTodo === undefined ? (
              <span className="auditrow__open auditrow__open--static truncate">
                <Foreign value={model.booking.todoTitle} />
              </span>
            ) : (
              <button
                type="button"
                className="auditrow__open"
                onClick={() => {
                  const booking = model.booking;
                  if (booking !== null) onOpenTodo(booking.todoId);
                }}
              >
                <span className="auditrow__open-title truncate">
                  <Foreign value={model.booking.todoTitle} />
                </span>
                <Icon name="arrow-up-right" size={13} />
              </button>
            )}
          </div>

          {showBooking ? (
            <p className="auditrow__booking">
              {model.booking === null ? (
                <span className="muted">
                  Diese Buchung ist nicht mehr auffindbar. Die Protokollzeile bleibt trotzdem
                  stehen — sie ist der Beleg, dass es sie gab.
                </span>
              ) : (
                <>
                  <span className="auditrow__period tabular">{model.booking.period}</span>
                  <span aria-hidden> · </span>
                  <span className="auditrow__duration tabular">{model.booking.duration}</span>
                  {model.booking.callNumber === null ? null : (
                    <>
                      <span aria-hidden> · </span>
                      <span className="mono">
                        Call <Foreign value={model.booking.callNumber} />
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
          ) : null}

          <p className="auditrow__run">
            {model.run === null ? (
              <>
                <Icon name="slash-circle" size={13} />
                <span>
                  Kein Exportlauf — diese Zeit ist nie in eine Datei gegangen.
                </span>
              </>
            ) : model.run.filePath === "" ? (
              <>
                <Icon name="alert-triangle" size={13} />
                <span>Der zugehörige Exportlauf ließ sich nicht laden.</span>
              </>
            ) : (
              <>
                <Icon name="download" size={13} />
                <span className="auditrow__file mono truncate" title={model.run.filePath}>
                  <Foreign value={model.run.fileName} />
                </span>
                <span className="auditrow__written">geschrieben {model.run.writtenAt}</span>
              </>
            )}
          </p>

          {model.reason.trim().length === 0 ? (
            model.event === "not_billed" ? (
              <p className="auditrow__reason auditrow__reason--absent">
                Ohne Begründung ausgebucht. Das Feld ist freiwillig — protokolliert ist
                trotzdem, dass hier jemand Zeit ohne Abrechnung abgehakt hat, und wann.
              </p>
            ) : null
          ) : (
            <p className="auditrow__reason">
              <span className="auditrow__reason-label">Begründung</span>
              <span className="auditrow__reason-text">
                <Foreign value={model.reason} />
              </span>
            </p>
          )}

          <p className="auditrow__actor">
            <span className="visually-hidden">Ausgelöst von: </span>
            <Foreign value={model.actor} />
          </p>
        </li>
      ))}
    </ol>
  );
}
