/**
 * Takt — der Exportlauf (A-8.1, A-8.8, E-011, E-020, E-034, R-10, R-11, R-17).
 *
 * ===========================================================================
 * Entweder Datei geschrieben und alle Buchungen markiert, oder nichts.
 * ===========================================================================
 *
 * Das ist A-8.8, und es ist die einzige Stelle im Projekt, an der die
 * Reihenfolge der Schritte fachlich entscheidet. Sie steht ausgeschrieben in
 * architektur.md 3.2; hier ist ihre Umsetzung:
 *
 * ```
 *   1  Ordner prüfen — vorhanden, ein Ordner, beschreibbar   (E-011, R-11)
 *      fehlt oder gesperrt ► Fehlschlag, nichts geöffnet
 *
 *   2  TRANSAKTION öffnen
 *
 *   3  Tagesgruppen aus v_export_candidate lesen             (ohne Vermerk)
 *      Nur offene Buchungen. Die Sicht entscheidet das, nicht dieser Code.
 *      Plan bilden — packages/export, rein, ohne Dateizugriff
 *      keine Zeile ► export_nothing_to_do, Transaktion wird verworfen
 *
 *   4  Datei schreiben:  <ordner>/.takt-<zufall>.tmp ► rename ► <ordner>/…json
 *
 *   5  In derselben Transaktion: export_run, export_run_group,
 *      export_run_entry, export_status='exported', export_count+1, export_audit
 *      Fehlschlag ► Datei wieder entfernen, Wurf ► ROLLBACK
 *
 *   6  COMMIT
 *      Fehlschlag ► Datei wieder entfernen
 * ```
 *
 * ---------------------------------------------------------------------------
 * Warum die Datei **vor** der Markierung geschrieben wird
 * ---------------------------------------------------------------------------
 *
 * Eine geschriebene Datei ohne Markierung führt dazu, dass dieselbe Zeit ein
 * zweites Mal exportiert wird. Ärgerlich — aber **auffindbar**: Die Datei liegt
 * im Ordner, und der Benutzer sieht sie.
 *
 * Eine Markierung ohne Datei führt zu **verlorener Abrechnung**. Die Buchungen
 * gelten als übertragen, aber niemand hat sie bekommen, und niemand merkt es.
 *
 * Der zweite Fall ist der schlimmere, deshalb wird er ausgeschlossen. Bricht
 * Schritt 4 ab, wird 5 nie erreicht; es bleibt höchstens eine verwaiste
 * `.tmp`-Nachbardatei, die beim nächsten Start entfernt wird. Bricht 5 oder 6
 * ab, wird die bereits umbenannte Datei wieder entfernt.
 *
 * ---------------------------------------------------------------------------
 * Warum ein fachlicher Fehlschlag hier ausdrücklich geworfen wird
 * ---------------------------------------------------------------------------
 *
 * `createTransactionPort` nimmt eine Transaktion nur bei einem **Wurf** zurück.
 * Ein `Result` mit `ok: false` ist ein Wert und rollt nichts zurück — richtig
 * so, denn ein Anwendungsfall darf einen Fehlschlag melden und trotzdem etwas
 * geschrieben haben wollen. Hier will er das nie. Deshalb wird jeder
 * Fehlschlag in `AbortExport` verpackt und geworfen; die Klammer außen fängt
 * ihn, nimmt zurück und macht wieder einen Wert daraus.
 *
 * Ohne diesen Kunstgriff wäre der schlimmste Fall möglich: Datei geschrieben,
 * `recordRun` scheitert, Ergebnis „Fehler" an den Benutzer — und die halbe
 * Markierung bliebe festgeschrieben.
 */

import type {
  ExportGroup,
  ExportRun,
  ExportTemplateEnvelope,
  ExportTemplateId,
  QuarterHours,
  RoundingMode,
  TaktError,
  TimeEntryId,
  Timestamp,
} from '@takt/domain';
import { err, ok, taktError } from '@takt/domain';
import type { ExportRunGroupRecord } from '@takt/storage';
import { removeFile } from '@takt/storage';
import type {
  ExportFieldDefinition,
  ExportGroupSummary,
  ExportRow,
  ExportRunPlan,
  SkippedExportGroup,
} from '@takt/export';
import { planExportRun, serializeExportRows, validateExportTemplateDefinition } from '@takt/export';

import { type AppContext, type UseCaseResult, now } from './context.ts';

/**
 * Ein fachlicher Fehlschlag, der die Transaktion mitnehmen soll.
 *
 * Er ist absichtlich eine eigene Klasse und keine allgemeine `Error`: Die
 * Klammer außen unterscheidet damit „geplanter Abbruch" von „etwas ist
 * kaputtgegangen". Beim zweiten bleibt der Wurf ein Wurf und endet als 500 im
 * Protokoll, statt als hübsche Fehlermeldung getarnt zu werden.
 */
class AbortExport extends Error {
  /**
   * Ausgeschriebenes Feld statt einer Parametereigenschaft
   * (`constructor(readonly failure: …)`).
   *
   * Node führt TypeScript nur durch **Streichen** der Typen aus; eine
   * Parametereigenschaft müsste umgeschrieben werden und bricht mit
   * `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. Der Dienst muss aus dem Quelltext
   * startbar bleiben — sonst ist kein Prüfpfad ohne Bauschritt möglich.
   */
  readonly failure: TaktError;

  constructor(failure: TaktError) {
    super(failure.code);
    this.name = 'AbortExport';
    this.failure = failure;
  }
}

export interface ExportPreviewResult {
  readonly rows: readonly ExportRow[];
  /**
   * Die Tagesgruppen zu den Zeilen, `groups[i]` zu `rows[i]` (T-022).
   *
   * Ohne sie müsste die Oberfläche die Gliederung selbst herstellen — also
   * entscheiden, welcher Kalendertag zu einer Buchung gehört. Das ist eine
   * Regel der Domäne (E-025: der Tag des **Timerstarts**, in der Zeitzone des
   * Rechners), und eine nachgebaute Regel ist eine zweite Fassung derselben
   * Wahrheit. Sie wäre ausgerechnet an der Grenze falsch, an der es weh tut:
   * bei einer Buchung um 23:50, die über Mitternacht läuft.
   *
   * Die Gruppen enthalten keinen Text der Buchung und keinen Vermerk, nur
   * Kennungen und Kennzahlen (`ExportGroupSummary` in `packages/export`).
   */
  readonly groups: readonly ExportGroupSummary[];
  readonly skipped: readonly SkippedExportGroup[];
  readonly entryCount: number;
  readonly totalQuarters: QuarterHours;
  readonly roundingMode: RoundingMode;
  /** R-10: Zeilen, die eine zurückgesetzte Buchung enthalten. */
  readonly previouslyExportedCount: number;
  /**
   * Woher die Felddefinition kam (E-051).
   *
   * `stored` — eine gespeicherte Vorlage; `templateId` und `templateName` sind
   * belegt. `draft` — eine mitgeschickte, **nicht** gespeicherte Definition;
   * beide sind `null`, weil es sie nicht gibt.
   *
   * Ausgeschrieben und nicht aus `templateId === null` abgeleitet: Eine
   * Vorschau, die den gezeigten Stand nur andeutet, ist genau die
   * Mehrdeutigkeit, wegen der S-14 vorher „zeigt den gespeicherten Stand"
   * daruntergeschrieben hat.
   */
  readonly templateSource: 'stored' | 'draft';
  readonly templateId: ExportTemplateId | null;
  readonly templateName: string | null;
}

/**
 * Woraus die Vorschau rendern soll (E-051).
 *
 * Zwei Fälle, ausgeschlossen ineinander. Ein Rumpf, der beides mitbrächte,
 * wird am Rand abgewiesen — nicht hier stillschweigend entschieden.
 */
export type ExportPreviewTemplate =
  /** Eine gespeicherte Vorlage. `null` heißt: die in den Einstellungen aktive. */
  | { readonly kind: 'stored'; readonly templateId: ExportTemplateId | null }
  /** Eine mitgeschickte Definition, ungespeichert. Wird geprüft, nie geschrieben. */
  | { readonly kind: 'draft'; readonly definition: unknown };

/**
 * Vorschau (A-8.7, S-07, S-14, R-17, E-051).
 *
 * **Derselbe Plan wie der Lauf.** Vorschau und Datei entstehen aus einem
 * Aufruf von `planExportRun`, nicht aus zweien — sonst sähe der Benutzer das
 * eine und verschickte das andere, und der Unterschied fiele erst dem
 * Empfänger auf.
 *
 * ---------------------------------------------------------------------------
 * Seit E-051: auch eine ungespeicherte Definition
 * ---------------------------------------------------------------------------
 *
 * A-8.7 verlangt eine Vorschau, die sich bei **jeder** Änderung aktualisiert.
 * Nähme diese Route weiterhin nur eine Kennung entgegen, bliebe der Oberfläche
 * nur ein zweiter Renderer — genau das, was R-17 verbietet.
 *
 * Die Prüfung ist dabei nicht „ähnlich" wie beim Speichern, sondern
 * **dieselbe Funktion**: `checkTemplateDefinition`, die auch `createTemplate`
 * und `updateTemplate` aufrufen. Eine Vorschau, die eine Definition
 * durchließe, die das Speichern abweist, wäre schlimmer als gar keine — der
 * Benutzer sähe ein Ergebnis und bekäme es beim Speichern nicht.
 *
 * Aus demselben Grund läuft **auch die gespeicherte Vorlage** durch dieselbe
 * Funktion. Vorher rief dieser Zweig `validateExportTemplateDefinition`
 * unmittelbar auf und verlor dabei `details`; die Oberfläche bekam denselben
 * Fehlschlag also je nach Weg einmal mit und einmal ohne Feldangabe.
 *
 * Geschrieben wird in **keinem** der beiden Fälle. Der Entwurf verlässt diese
 * Funktion nicht: Er wird gelesen, geprüft, gerendert und fallengelassen.
 *
 * Die Transaktion ist trotzdem da, weil der Bestand während des Lesens nicht
 * wandern soll: Ein laufender Timer schreibt jede Minute.
 */
export async function previewExport(
  context: AppContext,
  template: ExportPreviewTemplate,
  timeEntryIds: readonly TimeEntryId[],
): Promise<UseCaseResult<ExportPreviewResult>> {
  const timestamp = now(context);
  const windowsUser = context.system.windowsUser();

  return context.transactions.inTransaction(async (unit) => {
    const settings = await unit.settings.load();

    // Erst klären, welche Definition gilt — danach ist der Weg für beide Fälle
    // Zeile für Zeile derselbe.
    let definition: unknown;
    let templateId: ExportTemplateId | null;
    let templateName: string | null;

    if (template.kind === 'draft') {
      definition = template.definition;
      templateId = null;
      templateName = null;
    } else {
      const stored = await resolveTemplate(unit, template.templateId ?? settings.activeExportTemplateId);
      if (!stored.ok) return err(stored.error);
      definition = stored.value.definition;
      templateId = stored.value.id;
      templateName = stored.value.name;
    }

    const fields = checkTemplateDefinition(definition);
    if (!fields.ok) return err(fields.error);

    const groups = await unit.exportRead.openGroups(timeEntryIds);
    const plan = planExportRun(groups, fields.value, {
      windowsUser,
      exportedAt: timestamp,
      roundingMode: settings.roundingMode,
    });

    return ok({
      rows: plan.rows,
      groups: plan.groups,
      skipped: plan.skipped,
      entryCount: plan.entryCount,
      totalQuarters: plan.totalQuarters,
      roundingMode: settings.roundingMode,
      previouslyExportedCount: plan.previouslyExportedCount,
      templateSource: template.kind,
      templateId,
      templateName,
    });
  });
}

export interface ExportRunResult {
  readonly run: ExportRun;
  readonly skipped: readonly SkippedExportGroup[];
}

/**
 * Für den Prüfpfad: ein Haken mitten im Vorgang.
 *
 * Er hat genau einen Zweck, und der ist es wert, dass er im Erzeugnis steht:
 * Die Zusicherung aus A-8.8 lässt sich sonst nicht **nachweisen**, nur
 * behaupten. Ein Abbruch zwischen Datei und Markierung ist der eine Fall, der
 * im Betrieb selten und in seinen Folgen teuer ist — er gehört ausgelöst und
 * gemessen, nicht erhofft.
 *
 * Im Betrieb ist er `undefined` und kostet einen Vergleich. Er wird
 * ausschließlich im Zusammenbau gesetzt und ist über keine Anfrage erreichbar.
 */
export interface ExportFaultInjection {
  /** Läuft, nachdem die Datei liegt und **bevor** markiert wird. */
  readonly afterFileWritten?: () => void;
  /** Läuft, nachdem markiert wurde und **bevor** festgeschrieben wird. */
  readonly beforeCommit?: () => void;
}

export interface RunExportInput {
  readonly templateId: ExportTemplateId | null;
  readonly timeEntryIds: readonly TimeEntryId[];
  readonly faults?: ExportFaultInjection;
}

export async function runExport(
  context: AppContext,
  input: RunExportInput,
): Promise<UseCaseResult<ExportRunResult>> {
  const timestamp = now(context);
  const windowsUser = context.system.windowsUser();
  // Der Haken kommt aus dem Zusammenbau, nicht aus der Anfrage.
  const faults = input.faults ?? context.exportFaults;

  // ---------------------------------------------------------------------
  // 1. Der Ordner. Vor der Transaktion, weil ein fehlender Ordner kein Grund
  //    ist, eine Schreibsperre zu nehmen — und weil die Meldung dieselbe
  //    bleibt, ob gerade jemand anders schreibt oder nicht.
  //
  //    Geprüft wird bei **jedem** Lauf, nicht nur beim Einstellen: Ein
  //    Netzlaufwerk kann seit dem letzten Mal verschwunden sein (R-11).
  // ---------------------------------------------------------------------
  const settings = await context.transactions.inTransaction((unit) => unit.settings.load());
  const directory = await context.files.checkExportDirectory(settings.exportDirectory);

  if (!directory.ok) {
    return err(directoryError(directory.reason));
  }

  /**
   * Was nach einem Abbruch von der Datei übrig bleiben darf: nichts.
   *
   * Steht außerhalb der Transaktion, weil das Entfernen auch dann geschehen
   * muss, wenn die Klammer selbst scheitert.
   */
  let writtenPath: string | null = null;

  try {
    const result = await context.transactions.inTransaction(async (unit) => {
      // -----------------------------------------------------------------
      // 3. Lesen und planen. Beides vollständig, **bevor** irgendetwas
      //    geschrieben wird — genau das macht A-8.8 durchsetzbar: Ein
      //    Fehlschlag beim Rendern kann keine halbe Datei hinterlassen, weil
      //    es zu diesem Zeitpunkt noch nichts zurückzunehmen gibt.
      // -----------------------------------------------------------------
      const template = await resolveTemplate(unit, input.templateId ?? settings.activeExportTemplateId);
      if (!template.ok) throw new AbortExport(template.error);

      /**
       * **Dieselbe Funktion wie Vorschau und Speichern** (T-046).
       *
       * Bis dahin rief dieser Zweig `validateExportTemplateDefinition`
       * unmittelbar auf und baute den Fehler mit `taktError(code, message)`
       * neu — dabei fielen die `details` weg. Der Lauf sagte damit **weniger**
       * als die Vorschau desselben Fehlschlags, obwohl er der teurere Weg ist
       * und der einzige, der eine Datei schreibt. Die Oberfläche konnte die
       * betroffene Feldzeile beim Lauf nicht markieren und bei der Vorschau
       * schon.
       */
      const definition = checkTemplateDefinition(template.value.definition);
      if (!definition.ok) throw new AbortExport(definition.error);

      // `openGroups` liest ausschließlich `v_export_candidate`. Die Sicht
      // führt nur offene, abgeschlossene Buchungen — eine bereits exportierte
      // Buchung desselben Tages kommt hier gar nicht an und kann die
      // Tagessumme nicht erhöhen (R-10). Diese Zeile filtert nichts nach; täte
      // sie es, wäre es eine zweite Wahrheit über dieselbe Menge.
      const groups = await unit.exportRead.openGroups(input.timeEntryIds);

      // `checkTemplateDefinition` liefert bereits die Felderliste, nicht die
      // ganze Definition.
      const plan = planExportRun(groups, definition.value, {
        windowsUser,
        exportedAt: timestamp,
        roundingMode: settings.roundingMode,
      });

      if (plan.rows.length === 0) {
        // Keine leere Datei. Sie hätte einen Namen, ein Datum und einen
        // Prüfwert und sähe nach einer Abrechnung aus.
        throw new AbortExport(
          taktError(
            'export_nothing_to_do',
            plan.skipped.length === 0
              ? 'Es gibt keine offenen Buchungen für einen Export.'
              : 'Keine der offenen Tagesgruppen ist exportierbar. Tragen Sie die fehlenden Leistungstexte nach.',
          ),
        );
      }

      // -----------------------------------------------------------------
      // 4. Die Datei. Erst Nachbardatei, dann umbenennen — das Umbenennen
      //    innerhalb desselben Dateisystems ist unteilbar (siehe FilePort).
      // -----------------------------------------------------------------
      const fileName = exportFileName(timestamp);
      const written = await context.files.writeFile(
        directory.resolvedPath,
        fileName,
        serializeExportRows(plan.rows),
      );
      if (!written.ok) throw new AbortExport(written.error);

      writtenPath = written.value.path;
      faults?.afterFileWritten?.();

      // -----------------------------------------------------------------
      // 5. Festschreiben in derselben Transaktion. `recordRun` setzt den
      //    Status **und** schreibt je Buchung eine Protokollzeile; es gibt
      //    keinen Weg, das eine ohne das andere zu tun (R-10).
      // -----------------------------------------------------------------
      const recorded = await unit.export.recordRun({
        templateId: template.value.id,
        // Abzug der Vorlage. Ohne ihn schriebe eine spätere Änderung an der
        // Vorlage rückwirkend die Geschichte um, und man könnte nicht mehr
        // feststellen, welche Felder in der Abrechnung gelandet sind.
        templateSnapshot: template.value.definition,
        filePath: written.value.path,
        fileSha256: written.value.sha256,
        bytes: written.value.bytes,
        roundingMode: settings.roundingMode,
        // E-042/E-010: durchgereicht von der zweiten `stdin`-Zeile bis hierher.
        // Kein Anwendungsfall und keine Route nimmt ihn entgegen.
        windowsUser,
        now: timestamp,
        groups: toGroupRecords(plan, durationsOf(groups)),
      });

      if (!recorded.ok) throw new AbortExport(recorded.error);

      faults?.beforeCommit?.();

      return { run: recorded.value, skipped: plan.skipped };
    });

    return ok(result);
  } catch (error) {
    // -------------------------------------------------------------------
    // 6. Aufräumen. Die Transaktion ist an dieser Stelle **bereits**
    //    zurückgenommen — das erledigt die Klammer. Was bleibt, ist die
    //    Datei, und die muss fort: Sonst läge im Ordner eine Abrechnung, die
    //    es nach der Datenbank nie gegeben hat.
    // -------------------------------------------------------------------
    if (writtenPath !== null) {
      await removeFile(writtenPath);
    }

    if (error instanceof AbortExport) {
      return err(error.failure);
    }

    // Kein fachlicher Fall. Der Wurf bleibt ein Wurf und endet als 500 mit
    // einem Satz ohne Innenleben (B-2.4). Die Datei ist trotzdem fort.
    throw error;
  }
}

/**
 * Der Dateiname wird **vom Dienst** gebildet und enthält keine Eingabe des
 * Aufrufers (R-11).
 *
 * Er trägt den Zeitpunkt des Laufs, damit zwei Läufe am selben Tag sich nicht
 * überschreiben, und keine Sonderzeichen, damit er auf jedem Dateisystem
 * gleich heißt.
 */
export function exportFileName(timestamp: Timestamp): string {
  const compact = timestamp.replace(/[:-]/g, '').replace('T', '-').replace('Z', '');
  return `takt-export-${compact}.json`;
}

/**
 * Die ungerundete Dauer je Buchung, aus den gelesenen Tagesgruppen.
 *
 * Sie wird **gelesen und nicht abgeleitet**. Eine gleichmäßige Aufteilung der
 * Tagessumme auf die enthaltenen Buchungen läge nahe und wäre falsch: Sie
 * verfälschte genau das Protokoll, das R-10 nachvollziehbar halten soll, und
 * zwar an der Stelle, an der jemand später nachrechnen will, wieviel eine
 * zweite Abrechnung derselben Zeit hinzugefügt hat.
 */
function durationsOf(groups: readonly ExportGroup[]): ReadonlyMap<TimeEntryId, number> {
  const durations = new Map<TimeEntryId, number>();
  for (const group of groups) {
    for (const entry of group.entries) {
      durations.set(entry.timeEntryId, entry.durationSeconds);
    }
  }
  return durations;
}

/**
 * Vom Plan zu den Zeilen, die das Protokoll trägt.
 *
 * `quarters` ist im Plan `number | null` — `null`, wenn eine Gruppe keine
 * positive Dauer hat. Eine solche Gruppe kommt hier nicht an: `planExportRun`
 * nimmt nur gerenderte Gruppen in `rows` auf, und die Speicherung hat einen
 * CHECK auf `quarters >= 1`. Der Rückfall auf 0 stünde also für einen
 * unmöglichen Fall — deshalb wird er **nicht** stillschweigend gesetzt,
 * sondern führt zu einem Wurf und damit zum Rollback. Dasselbe gilt für eine
 * Buchung, deren Dauer sich nicht wiederfindet.
 */
function toGroupRecords(
  plan: ExportRunPlan,
  durations: ReadonlyMap<TimeEntryId, number>,
): readonly ExportRunGroupRecord[] {
  return plan.groups.map((group, index) => {
    if (group.quarters === null || group.quarters < 1) {
      throw new Error(
        `Die Exportzeile ${index + 1} hat keine gerundete Dauer. Es wird nichts geschrieben.`,
      );
    }

    return {
      todoId: group.todoId,
      day: group.day,
      seconds: group.seconds,
      quarters: group.quarters,
      entries: group.timeEntryIds.map((timeEntryId) => {
        const durationSeconds = durations.get(timeEntryId);
        if (durationSeconds === undefined || durationSeconds < 1) {
          throw new Error(
            'Zu einer Buchung dieses Laufs fehlt die Dauer. Es wird nichts geschrieben.',
          );
        }
        // Ungerundete Dauer der **Buchung**, nicht ihr Anteil an den
        // Viertelstunden der Gruppe. Einen solchen Anteil gibt es nicht
        // (siehe ExportRunGroup in packages/domain/src/export.ts).
        return { timeEntryId, durationSeconds };
      }),
    };
  });
}

function directoryError(
  reason: 'not_set' | 'missing' | 'not_writable' | 'not_a_directory' | 'unreachable',
): TaktError {
  switch (reason) {
    case 'unreachable':
      // Der Ordner hat auf die Prüfung nicht geantwortet — in aller Regel eine
      // Netzfreigabe, die nicht mehr hängt. Der Lauf bricht **vor** der
      // Transaktion ab; es ist nichts markiert und nichts geschrieben.
      return taktError(
        'export_directory_missing',
        'Der eingestellte Exportordner hat nicht geantwortet. Es wurde nichts exportiert und nichts markiert.',
      );
    case 'not_set':
      return taktError(
        'export_directory_missing',
        'Es ist kein Exportordner eingestellt. Bitte in den Einstellungen einen wählen.',
      );
    case 'missing':
      return taktError(
        'export_directory_missing',
        'Der eingestellte Exportordner ist nicht erreichbar. Bitte prüfen, ob er noch existiert.',
      );
    case 'not_a_directory':
      return taktError(
        'export_directory_missing',
        'Der eingestellte Pfad ist kein Ordner.',
      );
    case 'not_writable':
      return taktError(
        'export_directory_not_writable',
        'In den eingestellten Exportordner kann nicht geschrieben werden.',
      );
  }
}

async function resolveTemplate(
  unit: { readonly templates: { load(id: ExportTemplateId): Promise<ExportTemplateEnvelope | null>; builtin(): Promise<ExportTemplateEnvelope> } },
  templateId: ExportTemplateId | null,
): Promise<UseCaseResult<ExportTemplateEnvelope>> {
  if (templateId === null) {
    // Ohne Wahl die mitgelieferte Standardvorlage (A-8.7). Sie ist nicht
    // löschbar, also gibt es immer eine.
    return ok(await unit.templates.builtin());
  }
  const template = await unit.templates.load(templateId);
  if (template === null) {
    return err(taktError('not_found', 'Diese Exportvorlage gibt es nicht.'));
  }
  return ok(template);
}

/** Die Felddefinitionen einer Vorlage, geprüft. Für den Vorlageneditor (S-14). */
export function checkTemplateDefinition(
  definition: unknown,
): UseCaseResult<readonly ExportFieldDefinition[]> {
  const checked = validateExportTemplateDefinition(definition);
  if (!checked.ok) {
    return err({
      code: checked.error.code,
      message: checked.error.message,
      ...(checked.error.details === undefined ? {} : { details: checked.error.details }),
    });
  }
  return ok(checked.value.fields);
}
