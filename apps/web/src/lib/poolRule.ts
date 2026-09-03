import type { ExportStatus, Id, Pool, PoolRuleTerm } from "../api/types";
import {
  POOL_COMPLETION_LABEL,
  POOL_EXPORT_LABEL,
  POOL_MATCH_MODE_PREFIX,
  type PoolCompletionFilter,
  type PoolExportFilter,
} from "./labels";

/**
 * Takt — eine Regel in lesbare Teile zerlegen (T-076, T-079, E-055).
 *
 * ## Was hier steht und was ausdrücklich nicht
 *
 * Hier wird **beschrieben**, nicht entschieden. Diese Datei sagt, welche
 * Bedingungen eine Regel nennt und wie sie heißen; **ob ein Todo dazugehört**,
 * beantwortet `matchesPool` in `packages/domain` und in SQL der Dienst. Die
 * Oberfläche rechnet das nirgends nach — zwei Wahrheiten über dieselbe
 * Zugehörigkeit fielen erst auf, wenn eine Karte in der falschen Spalte steht.
 *
 * ## Die eine Frage, die diese Datei doch beantwortet
 *
 * {@link countConditions} zählt, wie viele Bedingungen eine Regel nennt — und
 * damit, ob sie **gar keine** nennt. Das ist keine Zugehörigkeitsrechnung,
 * sondern eine Frage an die gespeicherten Felder: Sind alle fünf Achsen auf
 * ihrem Neutralwert? Die Oberfläche braucht die Antwort für einen Zustand, den
 * es sonst nirgends gäbe — die frisch angelegte Spalte, die leer bleibt, bis
 * eine Bedingung dazukommt (A-3.4).
 *
 * Die Zählung folgt Zeichen für Zeichen der Bedingung aus `matchesPool`
 * (`tag.ts`): erforderliche Tags, ausgeschlossene Tags und Status zusammen
 * leer, `completion` und `exportState` neutral. Wer sie ändert, ohne die
 * Domäne zu lesen, lässt die Oberfläche etwas anderes behaupten als den
 * Dienst.
 *
 * **Eine benannte Ungenauigkeit:** Ein Ordnerterm zählt hier als Bedingung,
 * auch wenn in diesem Ordner kein einziges Tag liegt. Der Dienst löst Ordner zu
 * Tagmengen auf; ein leerer Ordner ergibt dort die leere Menge, und die Regel
 * trifft nichts. Die Ansicht sagt dann „keine Karte trifft diese Regel" statt
 * „dieser Ordner ist leer". Um das zu unterscheiden, müsste sie die Auflösung
 * kennen — und die kommt heute nirgends über die Leitung.
 *
 * ## „Alle" heißt „schränkt nicht ein"
 *
 * Ein Neutralwert steht in {@link RuleDescription.neutral} und **nicht** in
 * `axes`. Das ist der ganze Unterschied, um den es geht: Eine neutrale Achse
 * ist keine Bedingung „trifft alles", sie ist gar keine Bedingung. Die
 * Zusammenfassung auf Board und Pool-Liste zeigt deshalb nur `axes` — was nicht
 * einschränkt, steht dort nicht. Das Formular zeigt beides nebeneinander, weil
 * dort die Wahl getroffen wird und der Unterschied lesbar sein muss.
 */

/* ==================================================================== */
/* Die Teile einer beschriebenen Regel                                  */
/* ==================================================================== */

/** Ein Tag, ein Ordner oder ein Status, wie er in der Zusammenfassung steht. */
export interface RuleChip {
  readonly kind: "tag" | "folder" | "status";
  readonly label: string;
  /** Ordnerpfad eines Tags, damit „Nord" aus zwei Ordnern unterscheidbar bleibt. */
  readonly path: readonly string[];
  /**
   * Nur bei Ordnern: Zählen auch die Unterordner? `includeSubfolders` steht am
   * Pool und gilt für alle Ordnerterme; am Chip steht es, weil es dort etwas
   * bedeutet — bei einem Tag bedeutete es nichts.
   */
  readonly withSubfolders?: boolean;
}

export type RuleAxisId = "required" | "excluded" | "status" | "completion" | "export";

/**
 * Eine Achse, die **einschränkt**.
 *
 * `chips` und `text` schließen einander aus: Tag-, Ordner- und Statusachsen
 * nennen Dinge, die Erledigt- und die Exportachse nennen eine Auswahl. Beide
 * als Chips zu zeichnen hieße, „Nur erledigte" wie ein Tag aussehen zu lassen.
 */
export interface RuleAxis {
  readonly id: RuleAxisId;
  /** Was vor den Chips steht, etwa „Mindestens eines von" oder „Ohne". */
  readonly label: string;
  readonly chips: readonly RuleChip[];
  /** Statt Chips ein Ausdruck, etwa „Nur erledigte". */
  readonly text: string | null;
  /**
   * Nur an der Exportachse: der fachliche Exportstatus, auf den sie zeigt.
   *
   * Er steht hier, damit die Zusammenfassung dasselbe Etikett zeichnen kann wie
   * jede andere Fläche der Anwendung (`ExportStatusBadge`). Der Exportstatus
   * ist die Unterscheidung, um die sich Takt dreht; ein zweites Aussehen dafür
   * wäre eine zweite Sprache.
   */
  readonly exportState?: ExportStatus;
}

/** Eine Achse, die auf ihrem Neutralwert steht — und deshalb nichts wegnimmt. */
export interface NeutralAxis {
  readonly id: RuleAxisId;
  /** Der Name der Achse, nicht ihr Wert: „Status", nicht „Alle". */
  readonly label: string;
}

export interface RuleDescription {
  /** Nur die einschränkenden Achsen, in Leserichtung. */
  readonly axes: readonly RuleAxis[];
  readonly neutral: readonly NeutralAxis[];
  /** Keine einzige Bedingung — die Regel trifft nichts (A-3.4). */
  readonly isEmpty: boolean;
  readonly conditionCount: number;
}

/**
 * Woher die Namen kommen.
 *
 * Als Argument und nicht über einen Zusammenhang (Context) geholt: Damit ist
 * dieselbe Beschreibung ohne laufenden Dienst prüfbar und auf der Musterseite
 * des Designsystems zeigbar, wo es keinen `StructureProvider` gibt.
 */
export interface RuleLookup {
  readonly tag: (id: Id) => { readonly name: string; readonly path: readonly string[] } | undefined;
  readonly folder: (id: Id) => readonly string[] | undefined;
  readonly status: (id: Id) => string | undefined;
}

/* ==================================================================== */
/* Zählen                                                               */
/* ==================================================================== */

/** Die fünf Achsen, so wie sie an einem `Pool` stehen — auch als Entwurf im Formular. */
export interface RuleAxes {
  readonly matchMode: "any" | "all";
  readonly includeSubfolders: boolean;
  readonly rule: readonly PoolRuleTerm[];
  readonly excludedTags: readonly PoolRuleTerm[];
  readonly statusIds: readonly Id[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
}

/**
 * Wie viele Bedingungen nennt diese Regel?
 *
 * Null heißt: keine einzige. Die Regel trifft dann nichts — nicht alles.
 */
export function countConditions(axes: RuleAxes): number {
  return (
    axes.rule.length +
    axes.excludedTags.length +
    axes.statusIds.length +
    (axes.completion === "any" ? 0 : 1) +
    (axes.exportState === "any" ? 0 : 1)
  );
}

/** Kurzform für die Stellen, die nur die Ja-Nein-Frage stellen. */
export function hasNoCondition(axes: RuleAxes): boolean {
  return countConditions(axes) === 0;
}

/* ==================================================================== */
/* Beschreiben                                                          */
/* ==================================================================== */

/** Der Text der Erledigt-Achse, wenn sie einschränkt. */
const COMPLETION_TEXT: Readonly<Record<Exclude<PoolCompletionFilter, "any">, string>> = {
  done: "Nur erledigte",
  open: "Nur unerledigte",
};

/**
 * Der Text der Exportachse, wenn sie einschränkt.
 *
 * Ausgeschrieben als „mindestens eine …" und nirgends als „abgerechnet": Der
 * Exportstatus hängt an der Buchung, nicht am Todo (E-032). „Exportiert"
 * bedeutet **eine** exportierte Buchung, nicht die vollständige Abrechnung des
 * Todos.
 */
const EXPORT_TEXT: Readonly<Record<Exclude<PoolExportFilter, "any">, string>> = {
  open: "Mit offener Buchung",
  exported: "Mit exportierter Buchung",
};

function chipsOf(
  terms: readonly PoolRuleTerm[],
  includeSubfolders: boolean,
  lookup: RuleLookup,
): readonly RuleChip[] {
  return terms.map((term): RuleChip => {
    if (term.kind === "tag") {
      const info = lookup.tag(term.tagId);
      return info === undefined
        ? { kind: "tag", label: "Unbekannter Tag", path: [] }
        : { kind: "tag", label: info.name, path: info.path };
    }
    const path = lookup.folder(term.folderId);
    return path === undefined
      ? { kind: "folder", label: "Unbekannter Ordner", path: [], withSubfolders: includeSubfolders }
      : {
          kind: "folder",
          label: path.join(" / "),
          path: [],
          withSubfolders: includeSubfolders,
        };
  });
}

/**
 * Die Regel als lesbare Teile — einschränkende Achsen und neutrale getrennt.
 *
 * Die Reihenfolge der Achsen ist überall dieselbe: erforderlich, ausgeschlossen,
 * Status, Erledigt, Exportstatus. Sie folgt dem Formular, und das folgt dem
 * Vorbild, an dem der Auftraggeber das Formular gemessen sehen will (E-055).
 */
export function describeRule(axes: RuleAxes, lookup: RuleLookup): RuleDescription {
  const constraining: RuleAxis[] = [];
  const neutral: NeutralAxis[] = [];

  if (axes.rule.length === 0) neutral.push({ id: "required", label: "Erforderliche Tags" });
  else {
    constraining.push({
      id: "required",
      label: POOL_MATCH_MODE_PREFIX[axes.matchMode],
      chips: chipsOf(axes.rule, axes.includeSubfolders, lookup),
      text: null,
    });
  }

  if (axes.excludedTags.length === 0) {
    neutral.push({ id: "excluded", label: "Ausgeschlossene Tags" });
  } else {
    constraining.push({
      id: "excluded",
      label: "Ohne",
      chips: chipsOf(axes.excludedTags, axes.includeSubfolders, lookup),
      text: null,
    });
  }

  if (axes.statusIds.length === 0) neutral.push({ id: "status", label: "Status" });
  else {
    constraining.push({
      id: "status",
      // „Einer von" und nicht „alle von": Ein Todo trägt genau einen Status.
      // Ein „alle davon" über zwei Status wäre nicht streng, sondern
      // unerfüllbar (T-076, Abschnitt 2).
      label: axes.statusIds.length === 1 ? "Status" : "Status — einer von",
      chips: axes.statusIds.map(
        (id): RuleChip => ({ kind: "status", label: lookup.status(id) ?? "Unbekannter Status", path: [] }),
      ),
      text: null,
    });
  }

  if (axes.completion === "any") neutral.push({ id: "completion", label: "Erledigt" });
  else {
    constraining.push({
      id: "completion",
      label: "Erledigt",
      chips: [],
      text: COMPLETION_TEXT[axes.completion],
    });
  }

  if (axes.exportState === "any") neutral.push({ id: "export", label: "Exportstatus" });
  else {
    constraining.push({
      id: "export",
      label: "Exportstatus",
      chips: [],
      text: EXPORT_TEXT[axes.exportState],
      exportState: axes.exportState,
    });
  }

  const conditionCount = countConditions(axes);
  return { axes: constraining, neutral, isEmpty: conditionCount === 0, conditionCount };
}

/** Die Achsen eines gespeicherten Pools — der Normalfall der Aufrufer. */
export function axesOf(pool: Pool): RuleAxes {
  return {
    matchMode: pool.matchMode,
    includeSubfolders: pool.includeSubfolders,
    rule: pool.rule,
    excludedTags: pool.excludedTags,
    statusIds: pool.statusIds,
    completion: pool.completion,
    exportState: pool.exportState,
  };
}

/**
 * Der Wert einer Achse als Wort — für Vorlesehilfen und einzeilige Auskünfte.
 *
 * Nicht dieselbe Zeichenkette wie das Etikett im Formular: Dort steht „Alle",
 * hier „Alle (schränkt nicht ein)". Im Formular steht der Zusatz daneben, in
 * einem vorgelesenen Satz muss er mit.
 */
export function completionSpoken(value: PoolCompletionFilter): string {
  return value === "any" ? POOL_COMPLETION_LABEL.any : COMPLETION_TEXT[value];
}

export function exportSpoken(value: PoolExportFilter): string {
  return value === "any" ? POOL_EXPORT_LABEL.any : EXPORT_TEXT[value];
}
