/**
 * Takt — die Auskunft über die Feldquellen einer Exportvorlage (E-049, E-017).
 *
 * ===========================================================================
 * Die Oberfläche **fragt**, statt zu wissen
 * ===========================================================================
 *
 * Bis E-049 stand die geschlossene Auswahlliste aus E-017 zweimal: einmal in
 * `packages/export/src/sources.ts`, wo sie hingehört, und ein zweites Mal in
 * `apps/web/src/lib/exportTemplateModel.ts`, weil die Oberfläche `@takt/export`
 * nicht einbinden darf und keine Route hatte, die sie hätte fragen können.
 *
 * Diese Datei ist die Antwort auf diese Frage. Sie fügt der Liste **nichts**
 * hinzu, was eine Regel wäre:
 *
 * - **Welche** Quellen es gibt, sagt allein `EXPORT_SOURCE_PATHS` aus
 *   `@takt/export`. Hier wird über diese Liste gelaufen, nicht neben ihr her.
 * - **Was** eine Quelle liefert, sagt allein `readExportSource` im Motor.
 * - Hier stehen ausschließlich die **deutschen Beschriftungen** — Anzeigetext,
 *   keine Fachregel. Genau dieselbe Sorte Text wie die Fehlermeldungen des
 *   Dienstes, die ebenfalls hier entstehen und nicht in der Oberfläche.
 *
 * Der `Record`-Typ über `ExportSourcePath` erzwingt Vollständigkeit beim
 * Übersetzen: Nimmt die Domäne eine Quelle auf, fehlt hier ein Schlüssel und
 * `tsc` bricht ab. Steht hier ein Schlüssel, den die Domäne nicht kennt, bricht
 * es ebenso. Die ausgelieferte Liste kann damit weder mehr noch weniger
 * enthalten als die, gegen die beim Speichern geprüft wird.
 *
 * ---------------------------------------------------------------------------
 * Der Vermerk steht nicht darauf und kommt nicht darauf
 * ---------------------------------------------------------------------------
 *
 * Diese Datei ist seit E-049 die **veröffentlichte** Fassung der Liste — was
 * hier steht, bietet die Oberfläche zur Auswahl an. Deshalb wiederholt sie die
 * Zusicherung der Domäne (`NoteBoundaryIsSealed`) an ihrer eigenen Grenze:
 * `NoteSourceIsNotPublished` bricht den Übersetzer, sobald ein Notizpfad in
 * `ExportSourcePath` auftaucht — auf jeder Ebene, nicht nur unter `todo.`
 * (A-7.2, R-06, B-3.1).
 */

import type { ExportSourcePath } from '@takt/domain';
import type { ExportConditionOperator, ExportTransformation } from '@takt/export';
import {
  EXPORT_CONDITION_OPERATORS,
  EXPORT_SOURCE_PATHS,
  EXPORT_TRANSFORMATIONS,
} from '@takt/export';

/* ========================================================================= */
/* Zusicherung: der Vermerk wird nicht ausgeliefert                          */
/* ========================================================================= */

/** Reiner Typ, kein Laufzeitanteil. `Assert<false>` verletzt seine Randbedingung. */
type Assert<T extends true> = T;

/**
 * Übersetzungsfehler, sobald ein Notizpfad wählbar würde.
 *
 * Breiter gefasst als `NoteBoundaryIsSealed` in der Domäne, weil hier die
 * **Auswahlliste** entsteht, die der Benutzer im Editor sieht: „Notiz" ohne
 * Zusatz ist dort mehrdeutig, und genau diese Mehrdeutigkeit ist der
 * Bedienfehler aus R-08. Die abrechenbare Leistung heißt `group.bookingNotes`.
 */
export type NoteSourceIsNotPublished = Assert<
  Extract<
    ExportSourcePath,
    | `todo.note${string}`
    | `todo.notiz${string}`
    | `${string}.note`
    | `${string}.notiz`
    | `${string}.vermerk`
  > extends never
    ? true
    : false
>;

/* ========================================================================= */
/* Gestalt der Auskunft                                                      */
/* ========================================================================= */

/** Fachliche Ebene, aus der eine Quelle stammt. Nur zur Gliederung der Liste. */
export type ExportSourceGroupId = 'todo' | 'group' | 'system';

export interface ExportSourceGroupInfo {
  readonly id: ExportSourceGroupId;
  readonly label: string;
  /** Warum diese Ebene existiert. Steht als Erklärung über der Gruppe. */
  readonly hint: string;
}

export interface ExportSourceInfo {
  /** Der Wert, der in `definition.fields[].source` steht. Englisch (E-015). */
  readonly path: ExportSourcePath;
  readonly group: ExportSourceGroupId;
  /** Deutsche Beschriftung in der Auswahlliste. */
  readonly label: string;
  /** Was diese Quelle liefert, in einem Satz. */
  readonly description: string;
}

export interface ExportTransformationInfo {
  readonly value: ExportTransformation;
  readonly label: string;
  /** Was die Transformation mit dem Wert macht, in einem Satz. */
  readonly effect: string;
}

export interface ExportConditionOperatorInfo {
  readonly value: ExportConditionOperator;
  readonly label: string;
}

export interface ExportSourceCatalog {
  readonly groups: readonly ExportSourceGroupInfo[];
  /** Alle wählbaren Quellen in Anzeigereihenfolge, nach `groups` sortiert. */
  readonly sources: readonly ExportSourceInfo[];
  readonly transformations: readonly ExportTransformationInfo[];
  readonly conditionOperators: readonly ExportConditionOperatorInfo[];
  /**
   * Der feste Satz unter der Quellenauswahl (A-7.2, T-005 Abschnitt 3.4).
   *
   * Er klärt auf, ohne die Möglichkeit anzubieten. Er steht hier und nicht in
   * der Oberfläche, weil er eine Aussage über **diese** Liste ist: Wer die
   * Liste ausliefert, liefert auch die Begründung dafür, was nicht darauf
   * steht.
   */
  readonly noteBoundaryHint: string;
}

/* ========================================================================= */
/* Beschriftungen                                                            */
/* ========================================================================= */

/** Reihenfolge der Gruppen in der Auswahlliste. */
const SOURCE_GROUPS: readonly ExportSourceGroupInfo[] = Object.freeze([
  {
    id: 'todo',
    label: 'Todo',
    hint: 'Angaben, die am Todo hängen und für jede seiner Zeilen gleich sind.',
  },
  {
    id: 'group',
    label: 'Tagesgruppe',
    hint: 'Ein Todo an einem Kalendertag — die Einheit, aus der genau eine Exportzeile entsteht.',
  },
  {
    id: 'system',
    label: 'System',
    hint: 'Werte, die nicht aus der Erfassung stammen, sondern vom Rechner und vom Lauf.',
  },
] as const);

/** Was zu einer Quelle gesagt wird. Ohne den Pfad selbst — der ist der Schlüssel. */
type SourceLabel = Omit<ExportSourceInfo, 'path'>;

/**
 * Beschriftung je Quelle.
 *
 * Der Schlüssel ist der Wert aus dem Datenmodell, niemals ein hier erfundener.
 * `Record<ExportSourcePath, …>` erzwingt Vollständigkeit — siehe Kopf.
 */
const SOURCE_LABELS: Readonly<Record<ExportSourcePath, SourceLabel>> = Object.freeze({
  'todo.callNumber': {
    group: 'todo',
    label: 'Call-Nummer des Todos',
    description: 'Die Nummer aus dem Ticketsystem. Leer, wenn am Todo keine gesetzt ist.',
  },
  'todo.title': {
    group: 'todo',
    label: 'Titel des Todos',
    description: 'Der Titel, wie er in der Liste steht.',
  },
  'todo.tags': {
    group: 'todo',
    label: 'Tags des Todos',
    description: 'Die Namen aller Tags des Todos, vom Dienst zu einem Text verbunden.',
  },
  'group.day': {
    group: 'group',
    label: 'Kalendertag der Tagesgruppe',
    description: 'Der Tag, an dem der Timer gestartet wurde — er bestimmt die Gruppe.',
  },
  'group.quarters': {
    group: 'group',
    label: 'Gerundete Zeit der Tagesgruppe',
    description:
      'Ganze Viertelstunden über die Summe des Tages. Die Quelle für das Feld „Zeit“ der Standardvorlage.',
  },
  'group.durationSeconds': {
    group: 'group',
    label: 'Ungerundete Dauer in Sekunden',
    description:
      'Die Summe der Buchungen ohne Rundung. Keine Abrechnungsgröße — gedacht für eine Kontrollspalte.',
  },
  'group.bookingNotes': {
    group: 'group',
    label: 'Leistung der Tagesgruppe',
    description:
      'Die Leistungstexte aller enthaltenen Buchungen, vom Dienst zu einem Text zusammengeführt. Die Quelle für das Feld „Notiz“ der Standardvorlage.',
  },
  'group.startedAt': {
    group: 'group',
    label: 'Beginn der ersten Buchung',
    description: 'Zeitpunkt, an dem die früheste Buchung der Gruppe begann.',
  },
  'group.endedAt': {
    group: 'group',
    label: 'Ende der letzten Buchung',
    description: 'Zeitpunkt, an dem die späteste Buchung der Gruppe endete.',
  },
  'group.entryCount': {
    group: 'group',
    label: 'Anzahl der zusammengefassten Buchungen',
    description: 'Wie viele Buchungen in dieser einen Exportzeile stecken.',
  },
  'system.windowsUser': {
    group: 'system',
    label: 'Windows-Benutzername',
    description: 'Vom Betriebssystem gelesen, keine Eingabe. Die Quelle für „WindowsUser“.',
  },
  'system.exportedAt': {
    group: 'system',
    label: 'Zeitpunkt des Exports',
    description: 'Wann der Lauf die Datei geschrieben hat.',
  },
} as const);

/**
 * Beschriftung je Transformation. Wieder ein `Record` über den Typ des Motors:
 * Kommt eine Transformation dazu, fehlt hier ein Schlüssel und `tsc` bricht ab.
 */
const TRANSFORMATION_LABELS: Readonly<
  Record<ExportTransformation, Omit<ExportTransformationInfo, 'value'>>
> = Object.freeze({
  raw: {
    label: 'unverändert',
    effect: 'Der Wert geht so in die Datei, wie die Quelle ihn liefert.',
  },
  base64: {
    label: 'Base64',
    effect:
      'UTF-8 nach Base64. Eine Kodierung, keine Verschlüsselung — der Inhalt bleibt lesbar, wer ihn dekodiert.',
  },
  quarter_hours_to_number: {
    label: 'Viertelstunden als Zahl',
    effect: 'Aus ganzen Viertelstunden werden Schritte von 0,25 — aus 3 wird 0,75.',
  },
} as const);

/**
 * Beschriftung je Vergleich einer Feldbedingung.
 *
 * **Nur Beschriftung.** Die Liste selbst führt seit T-046 der Motor:
 * `EXPORT_CONDITION_OPERATORS` steht neben `EXPORT_TRANSFORMATIONS`, und die
 * Prüfliste in `template.ts` hängt am Typ statt an einem `Set<string>`. Diese
 * Datei läuft darüber, so wie sie es bei Quellen und Transformationen schon
 * tat — der `Record` erzwingt weiterhin, dass jeder Vergleich eine
 * Beschriftung hat, bestimmt aber weder Menge noch Reihenfolge.
 */
const CONDITION_OPERATOR_LABELS: Readonly<Record<ExportConditionOperator, string>> = Object.freeze({
  is_set: 'ist belegt',
  is_not_set: 'ist leer',
} as const);

const NOTE_BOUNDARY_HINT =
  'Der Vermerk eines Todos steht nicht auf dieser Liste und lässt sich nicht hinzufügen. ' +
  'Er bleibt in Takt und geht in keinen Export. ' +
  'Die abrechenbare Leistung heißt „Leistung der Tagesgruppe“.';

/* ========================================================================= */
/* Zusammenbau                                                               */
/* ========================================================================= */

/**
 * Die Quellen in Anzeigereihenfolge: nach Gruppen, innerhalb einer Gruppe in
 * der Reihenfolge des Motors.
 *
 * Gelaufen wird über `EXPORT_SOURCE_PATHS`, **nicht** über die Schlüssel von
 * `SOURCE_LABELS`. Der Unterschied ist heute keiner — `Record` erzwingt
 * dieselbe Menge —, aber er legt fest, wer die Liste führt: der Motor. Diese
 * Datei beschriftet nur.
 */
const SOURCES: readonly ExportSourceInfo[] = Object.freeze(
  SOURCE_GROUPS.flatMap((group) =>
    EXPORT_SOURCE_PATHS.filter((path) => SOURCE_LABELS[path].group === group.id).map(
      (path): ExportSourceInfo => ({ path, ...SOURCE_LABELS[path] }),
    ),
  ),
);

const TRANSFORMATIONS: readonly ExportTransformationInfo[] = Object.freeze(
  EXPORT_TRANSFORMATIONS.map(
    (value): ExportTransformationInfo => ({ value, ...TRANSFORMATION_LABELS[value] }),
  ),
);

const CONDITION_OPERATORS: readonly ExportConditionOperatorInfo[] = Object.freeze(
  EXPORT_CONDITION_OPERATORS.map(
    (value): ExportConditionOperatorInfo => ({
      value,
      label: CONDITION_OPERATOR_LABELS[value],
    }),
  ),
);

const CATALOG: ExportSourceCatalog = Object.freeze({
  groups: SOURCE_GROUPS,
  sources: SOURCES,
  transformations: TRANSFORMATIONS,
  conditionOperators: CONDITION_OPERATORS,
  noteBoundaryHint: NOTE_BOUNDARY_HINT,
});

/**
 * Die Auskunft. Unveränderlich, ohne Bestand, ohne Uhr — dieselbe Antwort für
 * jeden Aufruf, weil die Liste nicht vom Bestand abhängt (E-017).
 */
export function exportSourceCatalog(): ExportSourceCatalog {
  return CATALOG;
}
