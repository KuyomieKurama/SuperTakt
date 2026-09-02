import { errorMessage } from "../api/client";
import { listTimeEntries, previewExport } from "../api/endpoints";
import type { CalendarDay, ExportNotExportableReason, ExportPreview, Id } from "../api/types";

/**
 * Takt — was eine Tagesgruppe beim Export ergibt (E-020, E-025, E-034).
 *
 * Seit E-020 hat eine **einzelne** Buchung keinen Exportwert mehr. Zehn,
 * zwanzig und fünf Minuten am selben Tag auf demselben Todo ergeben 0,75 und
 * nicht dreimal 0,25 (Befund B-20). Wo die Oberfläche einen gerundeten Wert
 * zeigt, muss er deshalb von der Gruppe kommen — und die Gruppe bildet der
 * Dienst, nicht diese Datei.
 *
 * Der Weg dorthin führt über die **Vorschau**: Sie benutzt denselben Plan wie
 * der Lauf (R-17), also denselben Zuschnitt der Gruppe, dieselbe Rundung und
 * dieselbe Prüfung auf fehlende Leistung. Zwei Aufrufe für eine Zahl sind der
 * Preis dafür, dass diese Zahl stimmt.
 */
export interface DayGroupInsight {
  readonly entryCount: number;
  /** Ungerundete Summe der noch offenen Buchungen dieser Gruppe. */
  readonly seconds: number;
  /** Gerundete Viertelstunden der Gruppe. `null`, wenn sie nicht exportierbar ist. */
  readonly quarters: number | null;
  /** E-034 — Grund, aus dem die Gruppe stehen bleibt. */
  readonly blockedReason: ExportNotExportableReason | null;
  /**
   * Warum es keinen gerundeten Wert gibt, wenn die Vorschau nicht antwortete.
   *
   * `null` heisst: Die Vorschau hat geantwortet. `quarters === null` bei
   * `previewProblem === null` ist eine Aussage der Domaene; dasselbe `null`
   * mit einer Meldung daneben heisst „nicht gefragt bekommen". Bis T-045
   * sahen beide Faelle gleich aus, und die aufrufende Ansicht sagte fuer
   * beide „Noch nicht exportiert." — eine Behauptung ueber etwas, das die
   * Anwendung nicht wusste.
   */
  readonly previewProblem: string | null;
}

/**
 * Alle noch offenen Buchungen eines Todos an einem Kalendertag, und was der
 * Export daraus machen würde.
 *
 * `null`, wenn es an diesem Tag nichts Offenes gibt.
 */
export async function loadDayGroupInsight(
  todoId: Id,
  day: CalendarDay,
): Promise<DayGroupInsight | null> {
  const page = await listTimeEntries(
    { todoId, exportStatus: "open", fromDay: day, toDay: day },
    { limit: 200 },
  );
  if (page.items.length === 0) return null;

  const seconds = page.items.reduce((sum, entry) => sum + entry.durationSeconds, 0);
  const ids = page.items.map((entry) => entry.id);

  try {
    const preview = await previewExport(null, ids);
    const skipped = preview.skipped[0];
    if (skipped !== undefined) {
      return {
        entryCount: page.items.length,
        seconds: skipped.group.seconds,
        quarters: null,
        blockedReason: skipped.reason,
        previewProblem: null,
      };
    }
    return {
      entryCount: preview.entryCount,
      seconds,
      quarters: preview.totalQuarters,
      blockedReason: null,
      previewProblem: null,
    };
  } catch (cause) {
    /*
     * Ohne Vorlage oder ohne Exportordner gibt es keine Vorschau. Die erfasste
     * Zeit stimmt trotzdem — nur der gerundete Wert fehlt.
     *
     * Bis T-045 wurde der Grund hier verschluckt und das Ergebnis sah aus wie
     * die Antwort „diese Gruppe hat keinen Exportwert". Der Aufrufer konnte
     * die beiden Faelle nicht unterscheiden und hat den zweiten behauptet.
     * Jetzt kommt der Grund mit; ob er angezeigt wird, entscheidet die
     * Ansicht — verschwiegen wird er nicht mehr.
     */
    return {
      entryCount: page.items.length,
      seconds,
      quarters: null,
      blockedReason: null,
      previewProblem: errorMessage(cause),
    };
  }
}

/* ==================================================================== */
/* Die Vorschau ueber alle offenen Buchungen einer Ansicht              */
/* ==================================================================== */

/**
 * Was eine Uebersicht ueber ihre offenen Buchungen erfahren hat.
 *
 * Drei Ausgaenge statt `ExportPreview | null`, weil eine Ansicht sie
 * verschieden beantwortet: „nichts offen" ist eine Null, die stimmt; „die
 * Vorschau antwortet nicht" ist keine Zahl, sondern eine fehlende Auskunft.
 * Bis T-045 fielen beide auf `null` zusammen, und S-01, S-03 und S-05 sagten
 * fuer beide „Noch nicht exportiert." — ein Satz ueber etwas, das die
 * Anwendung nicht gefragt bekommen hatte.
 */
export type OpenPreviewOutcome =
  | { readonly kind: "none" }
  | { readonly kind: "ready"; readonly preview: ExportPreview }
  | { readonly kind: "failed"; readonly message: string };

/**
 * Eine Vorschau ueber genau die uebergebenen Buchungen — mit demselben Plan,
 * mit dem auch der Lauf rechnet (R-17).
 *
 * Gerechnet wird nichts: Rundung (E-008 ueber die Tagessumme), Gruppenschnitt
 * (E-020, E-025) und die Pruefung auf fehlende Leistung (E-034) kommen fertig
 * aus der Antwort. Diese Funktion ruft auf und fasst den Ausgang.
 */
export async function previewOpenEntries(ids: readonly Id[]): Promise<OpenPreviewOutcome> {
  if (ids.length === 0) return { kind: "none" };
  try {
    return { kind: "ready", preview: await previewExport(null, ids) };
  } catch (cause) {
    return { kind: "failed", message: errorMessage(cause) };
  }
}
