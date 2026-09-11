/**
 * Takt — der Exportstatus einer Buchung: seine Wechsel und ihr Protokoll
 * (A-6.9, E-012, E-032, E-047, R-10).
 *
 * ---------------------------------------------------------------------------
 * Was hier steht und was nebenan
 * ---------------------------------------------------------------------------
 *
 * Der **Wert** `ExportStatus` steht in `time-entry.ts`, weil er eine Spalte
 * von `time_entry` ist und zur Buchung gehört wie Start und Dauer. Hier steht,
 * **wie er sich ändert** — die drei erlaubten Übergänge samt Auslöser, die
 * Sperre einer exportierten Buchung und das anhängende Protokoll
 * (`export_audit`).
 *
 * Bis T-261 stand beides in `time-entry.ts`, zusammen mit der Timer-Regel.
 * Der Schnitt stand dort bereits als Überschrift ausgeschrieben
 * („Exportstatuswechsel", „Protokoll des Exportstatus"), er trennt zwei
 * Anforderungsbereiche (A-6.8/A-2.5 gegen A-6.9/E-012), zwei Tabellen
 * (`time_entry` gegen `export_audit`) und zwei Aufrufergruppen — und **keine
 * der beiden Seiten ruft die andere auf**. Die Richtung ist damit eindeutig:
 * Diese Datei liest die Buchung, die Buchung liest diese Datei nicht.
 *
 * ---------------------------------------------------------------------------
 * Was hier **nicht** steht
 * ---------------------------------------------------------------------------
 *
 *  - **Der Exportlauf selbst.** `export.ts` — und der ist über
 *    `@takt/domain/export` erreichbar, diese Datei ausdrücklich nicht. Der
 *    Exportmotor braucht sie nicht: Er erzeugt die Datei, das Markieren der
 *    Buchungen ist Sache des Anwendungsfalls, der diese Regel ruft (R-06).
 *  - **Das Schreiben.** Die Domäne entscheidet, der Adapter schreibt (E-001).
 *    Die Speicherung setzt dieselbe Sperre noch einmal als Trigger durch,
 *    damit sie auch dann gilt, wenn ein späterer Anwendungsfall sie zu prüfen
 *    vergißt.
 *
 * Rein: gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Uhr, Datei, Netz
 * oder Datenbank. Ohne laufenden Dienst prüfbar.
 */

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

// ---------------------------------------------------------------------------
// Exportstatuswechsel (A-6.9, E-012, R-10)
// ---------------------------------------------------------------------------

/**
 * Erlaubte Übergänge. Es gibt genau drei, und jeder hat einen Auslöser,
 * der protokolliert wird.
 *
 *   open     --[ Exportlauf, A-8.8 ]------>  exported
 *   open     --[ Nicht abrechnen, E-047 ]->  exported
 *   exported --[ Zurücksetzen, E-012 ]---->  open
 *
 * **Der Auslöser ist Teil der Bedingung, nicht Beiwerk.** Zwei der drei
 * Übergänge führen auf denselben Wert, und trotzdem sind es zwei verschiedene
 * Vorgänge: Der eine hat eine geschriebene Datei hinter sich, der andere
 * ausdrücklich keine. Wer sie am Zielwert unterscheiden wollte, könnte es nicht
 * — deshalb steht der Auslöser im Typ und wandert bis in `export_audit.event`.
 *
 * Zu „nicht abrechnen" (E-047, ersetzt E-037): Der Benutzer will diese Zeit
 * nicht abrechnen; exportiert wurde sie nie. Der Exportstatus geht trotzdem auf
 * `exported`, weil zweiwertig zweiwertig bleibt (E-032) — ein dritter Status
 * „ausgebucht" landete früher oder später in einem Filter und hielte die
 * Buchung anders als beabsichtigt aus einer Auswertung heraus. Was tatsächlich
 * geschah, trägt das Protokoll.
 *
 * Nicht erlaubt und in der Speicherung nicht erreichbar:
 *   - `exported` ohne einen der beiden vorgesehenen Auslöser. Ein „einfach
 *     setzen" gäbe eine als abgerechnet markierte Buchung, der weder eine Datei
 *     noch eine Entscheidung des Benutzers zugeordnet werden kann.
 *   - jeder Wechsel auf sich selbst.
 */
export type ExportStatusTransition =
  | { readonly from: 'open'; readonly to: 'exported'; readonly trigger: 'export_run' }
  | { readonly from: 'open'; readonly to: 'exported'; readonly trigger: 'not_billed' }
  | { readonly from: 'exported'; readonly to: 'open'; readonly trigger: 'reset' };

/**
 * Der Auslöser eines Wechsels — **abgeleitet, nicht abgeschrieben**.
 *
 * Welche Auslöser es gibt, sagt {@link ExportStatusTransition}; der Auslöser
 * gehört zum Übergang und nicht neben ihn. Bis T-270 zählte der Funktionstyp
 * darunter dieselben drei Werte ein zweites Mal auf. Das ist dieselbe Bauart,
 * die im Kommentar dieser Datei bereits einmal auseinandergelaufen ist: Eine
 * Regel, die zweimal geschrieben steht, wird irgendwann nur einmal geändert.
 */
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
 * Ist die Buchung gegen Bearbeitung gesperrt? (A-6.9)
 *
 * Gesperrt sind Start, Ende, Dauer, Leistung, Todo-Zuordnung und Löschen einer
 * exportierten Buchung. Nicht gesperrt ist der Exportstatus selbst — sonst
 * ließe E-012 sich nicht umsetzen. Die Speicherung erzwingt dieselbe Regel
 * über einen Trigger, damit sie auch dann gilt, wenn ein späterer
 * Anwendungsfall sie zu prüfen vergisst.
 */
export type IsLocked = (entry: Pick<TimeEntry, 'exportStatus'>) => boolean;

// ---------------------------------------------------------------------------
// Protokoll des Exportstatus (R-10) — Tabelle `export_audit`
// ---------------------------------------------------------------------------

/**
 * Literale wie in `export_audit.event`.
 *
 * `not_billed` (E-047) ist kein Export und trägt deshalb weder Exportlauf noch
 * Exportzeile — das Schema erzwingt das mit demselben CHECK, der für `exported`
 * beides verlangt. Erst diese Unterscheidung macht die Auswertung möglich, für
 * die man ein solches Protokoll überhaupt führt: Wie viel Zeit ist nie
 * abgerechnet worden?
 */
export type ExportAuditEvent = 'exported' | 'reset' | 'not_billed';

/**
 * Eine Zeile des Exportstatus-Protokolls. Anhängend und unveränderlich.
 *
 * Zweck: Wird eine Buchung zurückgesetzt und erneut exportiert, geht dieselbe
 * Arbeitszeit ein zweites Mal in die Abrechnung. Das Protokoll macht diesen
 * Vorgang nachträglich auffindbar — wer, wann, welche Buchung, mit welcher
 * Begründung, und in welchem Exportlauf sie vorher steckte.
 *
 * Die Speicherung verbietet UPDATE und DELETE auf dieser Tabelle über Trigger.
 * Es gibt keinen Anwendungsfall, der Protokollzeilen ändert oder löscht.
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
   * Die Exportzeile, in der die Buchung stand. Gesetzt genau dann, wenn
   * `event === 'exported'`.
   *
   * Hier steht bewusst kein `quarters`. Der gerundete Wert gehört der Gruppe,
   * nicht der Buchung; ein Anteil je Buchung existiert nicht (siehe
   * `ExportRunGroup`). Über diese Kennung sind Tagessumme und gerundeter Wert
   * der Zeile erreichbar, in der die Buchung damals stand — und damit auch,
   * wieviel eine zweite Abrechnung derselben Zeit tatsächlich hinzugefügt hat.
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

/**
 * Antrag auf Ausbuchen ohne Abrechnung (E-047, ersetzt E-037).
 *
 * Gleiche Gestalt wie der Antrag auf Zurücksetzen, und das ist kein Zufall:
 * Beides ist eine Entscheidung eines Menschen über genau eine Buchung, beides
 * wird protokolliert, und `reason` ist beide Male freiwillig. Ein Pflichtfeld
 * erzeugt in der Praxis den Text „x"; was zählt, ist die Nachvollziehbarkeit
 * des Vorgangs, nicht die Qualität seiner Begründung.
 *
 * Der Typ ist trotzdem ein eigener und kein Alias: Die beiden Anträge dürfen
 * sich unterschiedlich entwickeln, und an der Signatur der Ports soll ablesbar
 * sein, welcher der beiden Vorgänge gemeint ist.
 */
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
 * Prüft einen Wechsel des Exportstatus (A-6.9, E-012, E-032).
 *
 * **Welche Übergänge es gibt, steht an {@link ExportStatusTransition} und nur
 * dort.** Hier stand bis T-270 eine zweite Aufzählung, und sie war
 * auseinandergelaufen: Sie zeichnete zwei Pfeile und sagte „genau zwei", wo der
 * Typ oben und die Zweige unten drei führen — `open --[ not_billed ]-> exported`
 * (E-047) fehlte im Bild und wurde erst im Fließtext nachgereicht. Der Code war
 * nie falsch, das zweite Bild war es. Eine zweite Aufzählung ist deshalb nicht
 * berichtigt, sondern **gestrichen** worden: Wieviele Übergänge es sind, wird
 * gerechnet ({@link allowedExportStatusTransitions}) und nicht abgeschrieben,
 * sonst steht die Zahl in einem Jahr wieder falsch da.
 *
 * Der Auslöser ist Teil der Bedingung, nicht Beiwerk. `open -> exported` ohne
 * einen der beiden vorgesehenen Auslöser wäre eine als abgerechnet markierte
 * Buchung, hinter der weder eine Datei noch eine Entscheidung steht. „Nicht
 * abrechnen" (E-047) führt deshalb nicht am Wächter vorbei, sondern durch ihn
 * hindurch — mit eigenem Auslöser und eigenem Ereignistyp im Protokoll.
 *
 * **E-032 steht hier als Abwesenheit.** Das Ergebnis eines Resets ist `open` —
 * derselbe Wert wie bei einer Buchung, die nie exportiert war. Es gibt keinen
 * dritten Status „erneut offen", weil ein solcher Wert früher oder später in
 * einem Filter landen und die zurückgesetzte Buchung aus dem nächsten Export
 * heraushalten würde. Dass sie schon einmal exportiert war, trägt `exportCount`
 * und ist eine Frage der Anzeige (R-10).
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

// ---------------------------------------------------------------------------
// Die Menge der Übergänge — gerechnet, nicht abgeschrieben (T-270)
// ---------------------------------------------------------------------------

/** Reiner Typ, kein Laufzeitanteil. `Assert<false>` verletzt seine Randbedingung. */
type Assert<T extends true> = T;

/**
 * Die Eingabemenge des Wächters: beide Statuswerte, alle Auslöser.
 *
 * Diese beiden Listen sind der einzige Ort im Paket, an dem die Werte noch
 * einmal ausgeschrieben stehen — und sie sind **in beide Richtungen** an den
 * Typ gebunden: `satisfies` fängt einen Eintrag zuviel, die beiden
 * Behauptungen darunter einen zuwenig. Ein vierter Auslöser ohne Eintrag hier
 * bricht `pnpm typecheck` mit TS2344, bevor ein Prüffall läuft.
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

/**
 * Alle Übergänge, die {@link checkExportStatusTransition} annimmt — **gefragt,
 * nicht aufgezählt**.
 *
 * Die Funktion schreibt keinen einzigen Übergang hin. Sie legt dem Wächter die
 * vollständige Eingabemenge vor (Status x Status x Auslöser) und behält, was er
 * annimmt. Die Zahl der Übergänge ist damit eine **Messung an der Regel** und
 * keine Abschrift daneben: Fällt ein Zweig weg oder kommt einer hinzu, ändert
 * sich das Ergebnis von selbst — und ein Mengenprüffall über
 * `allowedExportStatusTransitions().length` schlägt an, statt daß ein
 * Kommentar still falsch wird. Genau das ist bis T-270 zweimal passiert
 * (`export-status.ts` gegen sich selbst, `docs/datenmodell.md` 6.1).
 *
 * Rein wie der Rest der Datei: kein Zugriff auf Uhr, Datei, Netz oder
 * Datenbank, gleiche Ausgabe bei gleicher Eingabe. Die Reihenfolge ist die der
 * Listen oben und keine Zusage.
 */
export const allowedExportStatusTransitions = (): readonly ExportStatusTransition[] =>
  EXPORT_STATUS_VALUES.flatMap((from) =>
    EXPORT_STATUS_VALUES.flatMap((to) =>
      EXPORT_STATUS_TRIGGERS.flatMap((trigger) => {
        const checked = checkExportStatusTransition(from, to, trigger);
        return checked.ok ? [checked.value] : [];
      }),
    ),
  );
