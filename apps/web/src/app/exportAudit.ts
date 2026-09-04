import { getExportRun, getTimeEntry, getTodo, listExportAudit } from "../api/endpoints";
import type {
  ExportAuditEntry,
  ExportRun,
  ForeignText,
  Id,
  TimeEntry,
  Todo,
} from "../api/types";
import { EXPORT_STATE, type ExportDisplayState } from "../components/ExportStatus";
import { EXPORT_AUDIT_EVENT_LABEL, type ExportAuditEvent } from "../lib/labels";
import { formatDateTime, formatDuration, formatPeriod } from "../lib/format";

/**
 * Takt — das Exportprotokoll, aufbereitet für die Anzeige (R-10, E-012, E-047).
 *
 * ## Wozu es da ist
 *
 * Wird eine Buchung zurückgesetzt (E-012) und danach erneut exportiert, geht
 * dieselbe Arbeitszeit ein zweites Mal in die Abrechnung. R-10 verlangt, dass
 * das **auffindbar** bleibt. Der Dienst schreibt das Protokoll seit Anfang an,
 * unveränderlich und mit eigenem Ereignistyp für „nicht abrechnen" (E-047) —
 * bis T-040 gab es in der Oberfläche nur keinen Ort, an dem man es ansehen
 * konnte (Befund C-01). Ein Protokoll, das niemand sehen kann, hält gar nichts
 * nach.
 *
 * ## Warum hier nachgeschlagen wird
 *
 * Eine Protokollzeile nennt eine Buchungskennung, eine Laufkennung und einen
 * Statuswechsel. Für einen Menschen ist das keine Auskunft: Er will wissen,
 * **welche** Buchung an **welchem** Todo hing und in **welche Datei** sie
 * gegangen ist. Beides holt dieses Modul über die vorhandenen Routen nach —
 * je Kennung genau einmal, nicht je Zeile.
 *
 * ## Was hier nicht geschieht
 *
 * Gerechnet wird nichts. Dauer, Zeitraum und Zeitpunkt kommen aus
 * `lib/format`, der Statuswechsel aus den Beschriftungen von `ExportStatus`,
 * die Ereignisnamen aus `lib/labels`. Dieses Modul ordnet zu und formatiert;
 * es leitet keinen Zustand ab und erfindet keinen Zusammenhang.
 */

/** Wie viele Protokollzeilen ein Abruf höchstens holt. */
export const AUDIT_PAGE_SIZE = 40;

/**
 * Eine Protokollzeile, fertig für die Anzeige.
 *
 * Alle Felder sind bereits Text. Der Baustein, der sie zeigt, formatiert
 * nichts mehr — dieselbe Regel wie bei `ExportGroupData`.
 */
export interface ExportAuditRowModel {
  readonly id: Id;
  readonly event: ExportAuditEvent;
  /** Wann es geschah, bereits formatiert. */
  readonly occurredAt: string;
  /**
   * Derselbe Zeitpunkt maschinenlesbar, unveraendert aus der Antwort.
   *
   * Er steht im `datetime` des `<time>`-Elements. Die deutsche Schreibweise
   * daneben ist fuer Menschen; ohne den Rohwert waere das `<time>` eine
   * Behauptung, die kein Werkzeug nachlesen kann.
   */
  readonly occurredAtIso: string;
  /** Der Statuswechsel im Klartext, zum Beispiel „Offen → Exportiert". */
  readonly transition: string;
  readonly timeEntryId: Id;
  /** Die betroffene Buchung. `null`, wenn sie nicht mehr auffindbar ist. */
  readonly booking: AuditBooking | null;
  /** Der Exportlauf. `null` bei „nicht abgerechnet" — dort gab es keinen. */
  readonly run: AuditRun | null;
  /** Freiwillige Begründung (E-047) oder Pflichtbegründung (E-012). Leer heißt: keine. */
  readonly reason: ForeignText;
  /** Wer den Vorgang ausgelöst hat (A-8.5, E-042). */
  readonly actor: ForeignText;
}

export interface AuditBooking {
  readonly todoId: Id;
  readonly todoTitle: ForeignText;
  readonly callNumber: ForeignText | null;
  /** Zeitraum, bereits formatiert. */
  readonly period: string;
  /** Ungerundete Dauer, bereits formatiert. */
  readonly duration: string;
}

export interface AuditRun {
  readonly id: Id;
  /** Der volle Pfad der geschriebenen Datei. */
  readonly filePath: string;
  /** Nur der Dateiname — der Pfad steht als Titel daneben. */
  readonly fileName: string;
  /** Wann der Lauf geschrieben wurde, bereits formatiert. */
  readonly writtenAt: string;
}

/** Was ein Abruf des Protokolls zurückbringt. */
export interface ExportAuditPage {
  readonly rows: readonly ExportAuditRowModel[];
  /** Zeiger auf die nächste Seite. `null` heißt: das war alles. */
  readonly nextCursor: string | null;
  readonly total: number;
}

/**
 * Holt Protokollzeilen und schlägt Buchungen, Todos und Läufe dazu nach.
 *
 * `timeEntryId` eingrenzen heißt: der Verlauf **einer** Buchung. Dann werden
 * die Buchungsangaben trotzdem geladen, weil der Aufrufer sie im Kopf des
 * Dialogs zeigt und eine zweite Quelle dafür eine zweite Wahrheit wäre.
 */
export async function loadExportAuditPage(options: {
  readonly timeEntryId?: Id;
  readonly cursor?: string;
  readonly limit?: number;
}): Promise<ExportAuditPage> {
  const page = await listExportAudit(options.timeEntryId, {
    ...(options.cursor === undefined ? {} : { cursor: options.cursor }),
    limit: options.limit ?? AUDIT_PAGE_SIZE,
  });

  const entryIds = distinct(page.items.map((entry) => entry.timeEntryId));
  const runIds = distinct(
    page.items
      .map((entry) => entry.exportRunId)
      .filter((id): id is Id => id !== null),
  );

  /*
   * Je Kennung ein Aufruf, nicht je Zeile: Ein Exportlauf schreibt viele
   * Buchungen und erzeugt entsprechend viele Protokollzeilen, die alle
   * denselben Lauf nennen. Ein Dienst auf derselben Maschine verträgt die
   * paar Anfragen; eine Anfrage je Zeile wäre trotzdem Verschwendung.
   *
   * Fehlschläge werden **einzeln** verschluckt. Eine gelöschte Buchung oder
   * ein nicht mehr lesbarer Lauf darf das Protokoll nicht unsichtbar machen —
   * das Protokoll ist genau die Auskunft, die dann noch übrig ist.
   */
  const [entries, runs] = await Promise.all([
    Promise.all(entryIds.map((id) => getTimeEntry(id).catch(() => null))),
    Promise.all(runIds.map((id) => getExportRun(id).catch(() => null))),
  ]);

  const entryById = new Map<Id, TimeEntry>();
  for (const entry of entries) if (entry !== null) entryById.set(entry.id, entry);

  const runById = new Map<Id, ExportRun>();
  for (const run of runs) if (run !== null) runById.set(run.id, run);

  /*
   * Die Todos werden **gezielt** geholt und nicht als Liste mit Obergrenze:
   * Eine Liste der ersten zweihundert hätte bei einem älteren Protokolleintrag
   * still „Unbekanntes Todo" ergeben — und ein Protokoll, das die Buchung nicht
   * benennen kann, beantwortet die Frage nicht, für die es geführt wird. Es
   * ist ein zweiter Umlauf gegen einen Dienst auf derselben Maschine.
   */
  const todoIds = distinct(
    [...entryById.values()].map((entry) => entry.todoId),
  );
  const todos = await Promise.all(todoIds.map((id) => getTodo(id).catch(() => null)));

  const todoById = new Map<Id, Todo>();
  for (const detail of todos) if (detail !== null) todoById.set(detail.todo.id, detail.todo);

  return {
    rows: page.items.map((item) => toRowModel(item, entryById, todoById, runById)),
    nextCursor: page.nextCursor,
    total: page.total,
  };
}

function toRowModel(
  item: ExportAuditEntry,
  entryById: ReadonlyMap<Id, TimeEntry>,
  todoById: ReadonlyMap<Id, Todo>,
  runById: ReadonlyMap<Id, ExportRun>,
): ExportAuditRowModel {
  const entry = entryById.get(item.timeEntryId) ?? null;
  const todo = entry === null ? undefined : todoById.get(entry.todoId);
  const run = item.exportRunId === null ? null : (runById.get(item.exportRunId) ?? null);

  return {
    id: item.id,
    event: item.event,
    occurredAt: formatDateTime(item.occurredAt),
    occurredAtIso: item.occurredAt,
    transition: `${statusLabel(item.previousStatus)} → ${statusLabel(item.newStatus)}`,
    timeEntryId: item.timeEntryId,
    booking:
      entry === null
        ? null
        : {
            todoId: entry.todoId,
            todoTitle: todo?.title ?? "Unbekanntes Todo",
            callNumber: todo?.callNumber ?? null,
            period: formatPeriod(entry.startedAt, entry.endedAt),
            duration: formatDuration(entry.durationSeconds),
          },
    run:
      run === null
        ? item.exportRunId === null
          ? null
          : {
              id: item.exportRunId,
              filePath: "",
              fileName: "Lauf nicht mehr lesbar",
              writtenAt: "",
            }
        : {
            id: run.id,
            filePath: run.filePath,
            fileName: fileNameOf(run.filePath),
            writtenAt: formatDateTime(run.createdAt),
          },
    reason: item.reason,
    actor: item.actor,
  };
}

/**
 * Der fachliche Statuswert in seiner Beschriftung.
 *
 * Bewusst **nicht** der Anzeigezustand aus `exportDisplayState`: Das Protokoll
 * hält den gespeicherten Wechsel fest, und der kennt genau zwei Werte (E-032).
 * „Erneut offen" und „Nicht abgerechnet" sind Anzeige und stünden hier falsch —
 * was aus dem Wechsel geworden ist, sagt der Ereignisname daneben.
 */
function statusLabel(status: "open" | "exported"): string {
  const state: ExportDisplayState = status;
  return EXPORT_STATE[state].label;
}

/** Der Dateiname aus einem Pfad. Windows und POSIX, ohne Pfadbibliothek. */
function fileNameOf(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] ?? path;
}

function distinct(values: readonly Id[]): readonly Id[] {
  return [...new Set(values)];
}

/** Beschriftung eines Ereignisses, groß geschrieben für Etiketten. */
export function auditEventLabel(event: ExportAuditEvent): string {
  const label = EXPORT_AUDIT_EVENT_LABEL[event];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Was ein Ereignis bedeutet, in einem Satz.
 *
 * Er steht als Titel am Etikett und als Langform für Hilfsmittel. Die
 * Unterscheidung zwischen „exportiert" und „nicht abgerechnet" ist der ganze
 * Grund, aus dem E-047 einen eigenen Ereignistyp bekommen hat: Eine Ausbuchung
 * als Export zu führen beantwortet die Frage „wie viel Zeit haben wir nie
 * abgerechnet" nicht mehr.
 */
export const AUDIT_EVENT_DESCRIPTION: Readonly<Record<ExportAuditEvent, string>> = {
  exported:
    "In eine Exportdatei geschrieben. Die Datei steht daneben; die Buchung war danach gesperrt.",
  reset:
    "Der Exportstatus wurde zurückgesetzt. Diese Zeit geht beim nächsten Export erneut in die Abrechnung — genau dafür gibt es dieses Protokoll.",
  not_billed:
    "Von Hand ausgebucht: Diese Zeit wird nicht abgerechnet. Eine Exportdatei hat sie nie enthalten, deshalb steht hier kein Lauf.",
};

/** Zu welchem Anzeigezustand ein Ereignis führt — für Symbol und Färbung. */
export const AUDIT_EVENT_STATE: Readonly<Record<ExportAuditEvent, ExportDisplayState>> = {
  exported: "exported",
  reset: "reopened",
  not_billed: "not_billed",
};
