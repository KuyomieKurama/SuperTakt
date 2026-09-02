/**
 * Takt — die Form einer Exportvorlage (E-005, E-017, A-8.7).
 *
 * Reine Typen, kein Laufzeitanteil. Eine Vorlage ist eine **geordnete** Liste
 * von Feldern; die Reihenfolge der Liste ist die Reihenfolge der Schlüssel im
 * erzeugten JSON.
 *
 * Was hier bewusst fehlt: ein Feld für einen frei geschriebenen Quellenpfad.
 * Nach E-017 ist jede Quelle ein Wert aus `ExportSourcePath` der Domäne, und
 * jede Quelle hat in `sources.ts` eine ausgeschriebene Zugriffsfunktion. Ein
 * generischer Pfadauflöser wäre ein Leseprimitiv auf alles, was man ihm gibt,
 * und machte jedes später hinzugefügte Feld automatisch exportierbar (B-3.1).
 */

import type { ExportCandidate, ExportGroup, ExportSourcePath } from '@takt/domain/export';

/**
 * Kennung einer Zeitbuchung, über den Kandidaten der Domäne bezogen.
 *
 * `@takt/domain/export` führt die Kennungstypen aus `kernel.ts` nicht selbst,
 * und dieses Paket darf keinen zweiten Einstiegspunkt der Domäne einbinden
 * (R-06). Der indizierte Zugriff holt genau denselben Typ, ohne ihn hier ein
 * zweites Mal zu erfinden — ein eigenes `type TimeEntryId = string` wäre die
 * Marke los und damit jede Verwechslung wieder möglich.
 */
export type ExportTimeEntryId = ExportCandidate['timeEntryId'];

// ---------------------------------------------------------------------------
// Ergebnis und Fehler
// ---------------------------------------------------------------------------

/**
 * Ergebnis statt Ausnahme, formgleich zu `Result` aus `packages/domain`.
 *
 * Der Typ steht hier und wird nicht aus der Domäne bezogen, weil
 * `@takt/domain/export` — der einzige Einstiegspunkt, den dieses Paket sehen
 * darf (R-06) — ihn nicht führt. Es ist eine Form, keine Regel: strukturell
 * deckungsgleich, also ohne Umweg an jede Stelle übergebbar, die `Result`
 * erwartet. Eine Fachregel würde hier nicht zweimal stehen.
 */
export type ExportResult<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Fehlerschlüssel des Vorlagen-Motors. Alle drei sind Werte aus
 * `TaktErrorCode`; ein `ExportTemplateError` ist damit ein `TaktError`.
 */
export type ExportTemplateErrorCode =
  | 'export_source_forbidden'
  | 'validation_error'
  | 'export_template_invalid';

/** Feldbezogener Hinweis, wie ihn `TaktError.details` trägt. */
export interface ExportFieldIssue {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/** Fachlicher Fehlschlag als Wert. `message` deutsch, `code` englisch. */
export interface ExportTemplateError<C extends ExportTemplateErrorCode = ExportTemplateErrorCode> {
  readonly code: C;
  readonly message: string;
  readonly details?: readonly ExportFieldIssue[];
}

// ---------------------------------------------------------------------------
// Vorlage
// ---------------------------------------------------------------------------

/**
 * Transformationen, abschließend.
 *
 * `raw`                       Wert unverändert.
 * `base64`                    UTF-8 nach Base64 (A-8.4).
 * `quarter_hours_to_number`   ganze Viertelstunden nach 0,25-Schritten (A-8.3).
 *
 * Der dritte Name ist mit Bedacht gewählt und **nicht** `round_to_quarter_hour`.
 * Die alte Bezeichnung bekäme eine bereits gerundete Anzahl Viertelstunden und
 * läse sie als Sekunden: aus 3 würde 0,25 statt 0,75 — still, und erst auf einer
 * Kundenrechnung sichtbar (E-033, T-009).
 *
 * **`raw`, nicht `roh`.** Abschnitt 8 der Spezifikation schreibt die deutschen
 * Namen, aber das ist dort die Beschreibung einer Auswahl für den Benutzer,
 * nicht die Festlegung eines technischen Schlüssels. Nach E-015 sind Werte im
 * Code englisch, und `base64` und `quarter_hours_to_number` sind es ohnehin —
 * ein deutscher Wert zwischen zwei englischen wäre die schlechteste der drei
 * Möglichkeiten. Die deutsche Beschriftung gehört in den Vorlageneditor,
 * genau wie „aufwärts" und „kaufmännisch" bei `RoundingMode`.
 *
 * Dieser Typ ist die einzige Stelle im Projekt, die das Feld benennt: Die
 * Domäne lässt `ExportTemplateEnvelope.definition` bewusst `unknown`, weil das
 * Vorlagenformat dem Motor gehört. Deshalb zieht die Migration hierher nach und
 * nicht umgekehrt (Entscheidung des Orchestrators, Migration 0005).
 */
export type ExportTransformation = 'raw' | 'base64' | 'quarter_hours_to_number';

/** Vergleiche einer Feldbedingung. Abschließend, wie die Quellen. */
export type ExportConditionOperator = 'is_set' | 'is_not_set';

/**
 * Bedingung eines Feldes (A-8.7, „bedingung").
 *
 * Trifft sie nicht zu, fehlt der Schlüssel im Ergebnis vollständig — er steht
 * nicht mit `null` und nicht mit leerem Text da. Ein leeres Feld wäre für das
 * Abrechnungstool etwas anderes als ein fehlendes.
 *
 * Die Quelle der Bedingung unterliegt derselben geschlossenen Liste wie die
 * Quelle des Feldes. Sonst ließe sich über eine Bedingung ablesen, ob ein
 * gesperrtes Feld belegt ist — ein schmaler, aber echter Abfluss.
 */
export interface ExportFieldCondition {
  readonly source: ExportSourcePath;
  readonly op: ExportConditionOperator;
}

/** Ein Feld einer Exportvorlage. */
export interface ExportFieldDefinition {
  /** Schlüssel im erzeugten JSON, frei wählbar. Beispiel: `Call`. */
  readonly name: string;
  readonly source: ExportSourcePath;
  readonly transformation: ExportTransformation;
  readonly condition?: ExportFieldCondition;
}

/**
 * Eine vollständige Vorlage, so wie sie in `export_template.definition` liegt.
 *
 * `version` steht davor, damit ein späteres Format erkennbar bleibt, statt
 * stillschweigend anders gelesen zu werden.
 */
export interface ExportTemplateDefinition {
  readonly version: 1;
  readonly fields: readonly ExportFieldDefinition[];
}

// ---------------------------------------------------------------------------
// Ergebnis einer Zeile
// ---------------------------------------------------------------------------

/** Was in einer Exportzelle stehen kann. Kein `undefined`: fehlend heißt fehlend. */
export type ExportValue = string | number | null;

/** Eine Exportzeile. Schlüsselreihenfolge = Feldreihenfolge der Vorlage. */
export type ExportRow = Readonly<Record<string, ExportValue>>;

/**
 * Die Kenndaten der Tagesgruppe, aus der die Zeile entstanden ist.
 *
 * Sie stehen neben der Zeile und nicht darin: Die Zeile gehört dem Benutzer und
 * enthält genau die Felder seiner Vorlage. Diese Werte gehören dem Protokoll —
 * `export_run_group` trägt `seconds` und `quarters`, `export_run_entry` die
 * Kennungen der enthaltenen Buchungen (A-8.8, R-10).
 *
 * `quarters` ist `null`, wenn die Gruppe keine positive Dauer hat; dann gibt es
 * nichts abzurechnen (E-008).
 */
export interface ExportGroupSummary {
  readonly todoId: ExportGroup['todoId'];
  readonly day: ExportGroup['day'];
  /** Ungerundete Summe der enthaltenen, noch offenen Buchungen. */
  readonly seconds: number;
  /** Gerundete Viertelstunden der Gruppe, oder `null`. */
  readonly quarters: number | null;
  readonly entryCount: number;
  /** Die Buchungen dieser Zeile, für `export_run_entry`. */
  readonly timeEntryIds: readonly ExportTimeEntryId[];
  /** R-10: mindestens eine enthaltene Buchung war schon einmal exportiert. */
  readonly previouslyExported: boolean;
}

/** Grund, aus dem eine Tagesgruppe nicht exportierbar ist. */
export type ExportNotExportableReason = 'empty_note';

/**
 * Ergebnis für genau eine Tagesgruppe.
 *
 * Zwei Ausgänge, kein dritter. `not_exportable` ist ausdrücklich **kein**
 * Fehler: Der Export der übrigen Gruppen läuft weiter, die betroffene bleibt
 * offen und erscheint beim nächsten Mal wieder (E-034).
 */
export type ExportRowResult =
  | { readonly kind: 'row'; readonly row: ExportRow; readonly group: ExportGroupSummary }
  | {
      readonly kind: 'not_exportable';
      readonly reason: ExportNotExportableReason;
      readonly group: ExportGroupSummary;
    };
