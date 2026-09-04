import {
  countPoolRuleConditions,
  enumerateGerman,
  poolRuleIsEmpty,
  type PoolRuleAxes,
} from "@takt/domain";
import type { Id, Pool, PoolResolution, PoolRuleTerm } from "../api/types";
import { formatCount } from "./format";
import { foreignText, quotedName } from "./foreign";
import {
  POOL_EXPORT_EXPORTED_NOTE,
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
 * ## Gezählt wird auch nicht mehr hier (T-083)
 *
 * Bis T-083 stand in dieser Datei ein `countConditions`, das die fünf Achsen
 * selbst auf ihre Neutralwerte prüfte — die **dritte** Fassung derselben
 * Bedingung neben `matchesPool` und der Übersetzung nach SQL. Sie ist weg.
 * Gezählt wird mit {@link countPoolRuleConditions} aus `@takt/domain`, gefragt
 * mit `poolRuleIsEmpty`; {@link RuleAxes} erweitert `PoolRuleAxes` und wird
 * damit rot, sobald die Domäne eine sechste Achse bekommt.
 *
 * ## Zwei Leeren, und nur eine davon ist ein Fehler (E-057, T-083, T-087)
 *
 * „Nennt die Regel eine Bedingung?" und „ergibt sie nach dem Auflösen der
 * Ordner überhaupt etwas?" sind verschiedene Fragen. Die erste beantwortet die
 * Domäne aus den Feldern, die zweite kann nur der Dienst beantworten — er
 * steigt dafür über den Ordnerbaum ab und liefert das Ergebnis als
 * `pool.resolved` mit. {@link describeRuleReach} führt beide zusammen und
 * benennt den Zustand, den ausschließlich der Benutzer beheben kann: ein
 * erforderlicher Ordner ohne ein einziges Tag darin.
 *
 * Gefragt wird seit T-087 **termweise** (`resolved.unresolvedRequired` und
 * `resolved.emptyRuleFolderIds`) und nicht mehr über die Achsensumme
 * `resolved.tagCount`. Der Unterschied ist der gemischte Fall — ein leerer
 * Ordner neben einem Tagterm —, in dem die Summe positiv bleibt und die Regel
 * trotzdem nichts trifft. Und die Ordner werden **beim Namen** genannt, in der
 * Reihenfolge, in der sie im Formular stehen: „Ein Ordner ist leer" schickt den
 * Benutzer suchen, „Kunden / Ost ist leer" nicht.
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
  /**
   * Nur bei Ordnern: die Kennung des Ordners (T-087).
   *
   * Sie steht hier, damit der Befund „kein Tag darin" **den einzelnen Chip**
   * treffen kann und nicht die ganze Achse. Bis T-087 trug jeder Ordnerchip
   * der erforderlichen Achse die Markierung, sobald irgendeiner leer war —
   * bei „Ordner Nord **oder** Ordner Ost" zeigte die Oberfläche damit auf den
   * falschen Ordner.
   */
  readonly folderId?: Id;
  /**
   * Der Tag- beziehungsweise Ordnerbaum kennt diese Kennung nicht (mehr).
   *
   * Der Chip trägt dann „Unbekannter Tag" oder „Unbekannter Ordner" als
   * Ersatzwort. Für die Auskunft aus {@link describeRuleReach} ist das der
   * Unterschied zwischen „der Ordner **Kunden / Ost** ist leer" und „ein
   * Ordner, den es nicht mehr gibt" — eine nackte Kennung anzuzeigen wäre
   * beides nicht.
   */
  readonly missing?: boolean;
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
   * Ein Satz, der einen absehbaren **Lesefehler** dieser Achse ausräumt —
   * sonst nicht gesetzt (W-7 aus R-2a).
   *
   * Kein zweiter Platz für Beschriftungen: Der Wert der Achse steht in `text`.
   * Hier steht ausschließlich, was jemand fragen würde, der den Wert schon
   * gelesen hat. Heute gibt es genau einen solchen Fall, den Exportstatus
   * „Abgerechnet" gegen den Anzeigezustand „Nicht abgerechnet" einer Buchung
   * darin.
   */
  readonly note?: string;
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
/* Die Achsen einer Regel                                               */
/* ==================================================================== */

/**
 * Die fünf Achsen, so wie sie an einem `Pool` stehen — auch als Entwurf im
 * Formular, den noch keine Route gesehen hat.
 *
 * `extends PoolRuleAxes` ist die Absicherung und kein Zierrat: Die Domäne
 * zählt die Bedingungen einer Regel (`countPoolRuleConditions`) und beantwortet
 * die Frage nach der Leere (`poolRuleIsEmpty`) über genau diesen Typ. Bekommt
 * sie eine sechste Achse, fehlt sie hier — und jede Stelle, die eine `RuleAxes`
 * zusammensetzt, wird rot. Vorher hätte die Oberfläche stillschweigend
 * weitergezählt und etwas anderes behauptet als der Dienst.
 *
 * Die Feldnamen sind deshalb die der Schnittstelle, und die Typen sind enger
 * als in der Domäne: Dort steht `readonly unknown[]`, weil dieselbe Frage an
 * die gespeicherte **und** an die aufgelöste Regel gestellt wird. Hier gibt es
 * nur die gespeicherte.
 *
 * `matchMode` und `includeSubfolders` stehen zusätzlich darin und sind
 * ausdrücklich **keine** Achsen: Sie sagen, wie eine Achse zu lesen ist, nicht
 * ob sie einschränkt. Eine Regel, die nur den Modus setzt, nennt keine
 * Bedingung.
 */
export interface RuleAxes extends PoolRuleAxes {
  readonly matchMode: "any" | "all";
  readonly includeSubfolders: boolean;
  readonly rule: readonly PoolRuleTerm[];
  readonly excludedTags: readonly PoolRuleTerm[];
  readonly statusIds: readonly Id[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
}

/* ==================================================================== */
/* Beschreiben                                                          */
/* ==================================================================== */

/** Der Text der Erledigt-Achse, wenn sie einschränkt. */
const COMPLETION_TEXT: Readonly<Record<Exclude<PoolCompletionFilter, "any">, string>> = {
  done: "Nur erledigte",
  open: "Nur unerledigte",
};

/*
 * Hier stand bis T-094 `EXPORT_TEXT` — „Mit offener Buchung" / „Mit
 * exportierter Buchung".
 *
 * Es war die **zweite Fassung** derselben Auswahl: Im Formular stand über dem
 * Optionsknopf ein Wort, drei Zeilen darunter in der Vorschau ein anderes, und
 * beide meinten denselben Wert. Genau diese Doppelung nennt E-059 als Fehler,
 * den der Benutzer ausbadet. Die Vorschau nimmt seither `POOL_EXPORT_LABEL` —
 * dieselbe Beschriftung wie der Optionsknopf, an dem gewählt wird.
 *
 * Der Grund, aus dem die alte Fassung „mindestens eine …" ausschrieb, ist
 * damit nicht verloren: Der Exportstatus hängt an der Buchung und nicht am
 * Todo (E-032). Dieser Satz steht jetzt dort, wo gewählt wird
 * ({@link POOL_EXPORT_NOT_BILLED_HINT} und der Hilfssatz der Achse) — also
 * vor der Entscheidung statt in der Zusammenfassung danach.
 */

function chipsOf(
  terms: readonly PoolRuleTerm[],
  includeSubfolders: boolean,
  lookup: RuleLookup,
): readonly RuleChip[] {
  return terms.map((term): RuleChip => {
    if (term.kind === "tag") {
      const info = lookup.tag(term.tagId);
      return info === undefined
        ? { kind: "tag", label: "Unbekannter Tag", path: [], missing: true }
        : { kind: "tag", label: info.name, path: info.path };
    }
    const path = lookup.folder(term.folderId);
    return path === undefined
      ? {
          kind: "folder",
          label: "Unbekannter Ordner",
          path: [],
          withSubfolders: includeSubfolders,
          folderId: term.folderId,
          missing: true,
        }
      : {
          kind: "folder",
          label: path.join(" / "),
          path: [],
          withSubfolders: includeSubfolders,
          folderId: term.folderId,
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
      text: POOL_EXPORT_LABEL[axes.exportState],
      /*
        Nur bei „Abgerechnet" (W-7 aus R-2a). „Noch nicht abgerechnet" trägt
        keinen Widerspruch in sich: Was darin steht, heißt an der Buchung
        „Offen" oder „Erneut offen", und beides liest sich wie das Etikett der
        Achse. Ein Satz an jeder der beiden Wahlen wäre die Sorte Hinweis, die
        man nach dem dritten Mal überliest.
      */
      ...(axes.exportState === "exported" ? { note: POOL_EXPORT_EXPORTED_NOTE } : {}),
    });
  }

  return {
    axes: constraining,
    neutral,
    // Beide Antworten kommen aus der Domäne. `isEmpty` hier selbst aus
    // `conditionCount === 0` abzuleiten wäre schon wieder eine zweite Fassung
    // derselben Aussage — kurz, richtig und trotzdem die Art Zeile, die eines
    // Tages von der Domäne abweicht.
    isEmpty: poolRuleIsEmpty(axes),
    conditionCount: countPoolRuleConditions(axes),
  };
}

/* ==================================================================== */
/* Warum trifft diese Regel nichts? (E-057, T-083, T-087)               */
/* ==================================================================== */

/**
 * Ein erforderlicher Ordner, in dem kein einziges Tag liegt (E-057, T-087).
 *
 * Er kommt aus `resolved.emptyRuleFolderIds` und damit aus derselben Quelle wie
 * die Regel selbst — die Oberfläche steigt **nicht** über den Ordnerbaum ab, um
 * ihn zu finden. Sein Name kommt aus dem Baum, den sie ohnehin geladen hat.
 */
export interface EmptyRuleFolder {
  /**
   * Die Kennung, wie sie in der Regel steht — oder `null`, wenn der Dienst
   * einen unaufgelösten erforderlichen Term meldet, ohne einen Ordner dazu zu
   * nennen. Siehe {@link describeRuleReach}.
   */
  readonly id: Id | null;
  /**
   * Der Ordnerpfad, wie ihn die Zusammenfassung zeigt („Kunden / Ost") — oder
   * `null`, wenn der Baum diese Kennung nicht (mehr) kennt.
   *
   * `null` heißt **nicht** „unbenannt lassen": {@link emptyFolderNames} setzt
   * dafür „einem unbekannten Ordner" ein. Eine nackte Kennung im Fließtext
   * beantwortete die Frage des Benutzers nicht, sondern stellte eine neue.
   */
  readonly label: string | null;
}

/**
 * Der Grund, aus dem eine Regel im Augenblick nichts trifft — soweit er an der
 * Regel selbst ablesbar ist.
 *
 * Drei Fälle, und nur einer davon ist ein Einrichtungsfehler. Sie werden in
 * **dieser** Reihenfolge geprüft (T-082, T-087):
 *
 * | Fall | Was los ist | Wer es behebt |
 * |---|---|---|
 * | `empty-folder` | Die Regel nennt Ordner, in denen kein Tag liegt (E-057). | der Benutzer, durch ein Tag im Ordner |
 * | `no-condition` | Sie nennt gar keine Bedingung (A-3.4). | der Benutzer, durch Ergänzen |
 * | `reachable` | Sie ist eingerichtet und auflösbar. | niemand — sie füllt sich von selbst |
 *
 * Der leere Ordner steht **vor** der leeren Regel, weil eine Regel, die nur aus
 * einem leeren Ordner besteht, nach dem Auflösen beides ist — und „richten Sie
 * die Regel ein" wäre an einer eingerichteten Regel die falsche Aufforderung.
 *
 * `reachable` heißt **nicht** „es gibt Karten". Ob gerade eines der Todos
 * zutrifft, sagt allein der Dienst; diese Auskunft hier sagt nur, dass es
 * möglich wäre.
 */
export type RuleReach =
  | { readonly kind: "no-condition" }
  | {
      readonly kind: "empty-folder";
      /**
       * Die betroffenen Ordner — genau die, die niemand füllt, in der
       * Reihenfolge der Regel und **immer mindestens einer**.
       */
      readonly folders: readonly EmptyRuleFolder[];
    }
  | { readonly kind: "reachable" };

/**
 * Den Grund benennen — aus der bereits beschriebenen Regel und der Auflösung
 * des Dienstes.
 *
 * Die Beschreibung kommt herein und wird nicht ein zweites Mal erzeugt: Die
 * Ordnernamen im Text müssen dieselben sein wie die Chips in der
 * Zusammenfassung darüber, sonst nennt der Leerzustand einen anderen Ordner als
 * die Regel, auf die er sich bezieht.
 *
 * ## Die Reihenfolge ist Teil der Auskunft (T-082, T-087)
 *
 * Erst `unresolvedRequired`, dann „nennt keine Bedingung". Umgekehrt stünde
 * „richten Sie die Regel ein" an einer Regel, die eingerichtet ist: Eine Regel,
 * die nur aus einem leeren Ordner besteht, ist **nach dem Auflösen** leer und
 * nennt trotzdem eine Bedingung. Der Benutzer soll ein Tag in den Ordner legen,
 * nicht nach einer Bedingung suchen, die er längst genannt hat.
 *
 * ## Termweise statt achsenweise — der Fall, der bis T-087 still war
 *
 * Bis T-087 stand hier `resolved.tagCount === 0`. Das ist eine **Summe** über
 * die Achse: Nennt eine Regel „Tag Support **oder** Ordner Ost" und ist nur der
 * Ordner leer, bleibt die Summe bei `1` — die Achse sah gesund aus, und die
 * Oberfläche schwieg, obwohl die Regel nach E-057 nichts trifft. Gefragt wird
 * deshalb `resolved.unresolvedRequired`, und **welcher** Ordner es ist, sagt
 * `resolved.emptyRuleFolderIds`. Beides kommt aus derselben Auflösung, die auch
 * über die Mitgliedschaft entscheidet; nachgerechnet wird hier nichts.
 *
 * ## Woher jede der beiden Antworten kommt — und warum nicht beide von hier
 *
 * | Frage | hängt ab von | Quelle |
 * |---|---|---|
 * | Ist ein erforderlicher Ordner leer? | den Regeltermen und `includeSubfolders` | `resolved` (nur der Dienst weiß es) |
 * | Nennt die Regel eine Bedingung? | allen fünf Achsen | `description.isEmpty`, also `poolRuleIsEmpty` über die Felder |
 *
 * `resolved.matchesNothing` fasst beides zusammen — über den **gespeicherten**
 * Stand. Als Ganzes gelesen wäre es im Formular falsch: Wer einer noch leeren
 * Regel eine Statusachse hinzufügt, hat sie eingerichtet, während der
 * gespeicherte Stand daneben weiterhin `matchesNothing: true` meldet. Die
 * beiden Gründe verlangen ohnehin verschiedene Sätze und verschiedene
 * Handlungen; hier werden sie deshalb getrennt beantwortet — aus je der Quelle,
 * die für sie zuständig ist, und nie aus einer eigenen Rechnung.
 *
 * ## Wenn der Dienst keinen Ordner nennt
 *
 * `unresolvedRequired` deckt neben dem leeren Ordner auch den Fall ab, dass
 * eine erforderliche Liste Terme nennt und **gar nichts** daraus wird — das
 * Netz für eine Termart, die eines Tages ins Leere zeigt, ohne ein Ordner zu
 * sein. Dann bleibt `emptyRuleFolderIds` leer, und die Oberfläche kann nichts
 * benennen. Sie schweigt trotzdem nicht: Es steht ein Eintrag ohne Kennung und
 * ohne Namen da, den {@link emptyFolderNames} als „einem unbekannten Ordner"
 * ausschreibt. Der Befund („diese Regel kann kein Todo erfüllen") ist richtig,
 * nur die Wortwahl „Ordner" ist dann eine Annahme — die bessere Hälfte einer
 * Auskunft ist mehr wert als gar keine, und die Chips darüber tragen ohnehin
 * „Unbekannter Tag" beziehungsweise „Unbekannter Ordner".
 *
 * Ausgeschlossene Tags über einen leeren Ordner sind **kein** Fall für diese
 * Auskunft: „keiner davon" über nichts schließt nichts aus, engt also nicht
 * ein und ist deshalb kein Fehler (E-057). `unresolvedExcluded` wird hier
 * nicht gelesen — es steht als **Hinweis** im Formular, wo die Regel bearbeitet
 * wird, und nirgends als Warnung.
 */
export function describeRuleReach(
  description: RuleDescription,
  resolved: PoolResolution,
): RuleReach {
  if (resolved.unresolvedRequired) {
    return { kind: "empty-folder", folders: emptyFoldersOf(description, resolved) };
  }
  if (description.isEmpty) return { kind: "no-condition" };
  return { kind: "reachable" };
}

/**
 * Die leeren Ordner mit ihren Namen — in der Reihenfolge, die der Dienst
 * vorgibt, und das ist die Reihenfolge der Regel im Formular.
 */
function emptyFoldersOf(
  description: RuleDescription,
  resolved: PoolResolution,
): readonly EmptyRuleFolder[] {
  // Nur die **erforderliche** Achse: Ein ausgeschlossener Ordner ohne Tag ist
  // kein Fehler, und `emptyRuleFolderIds` nennt ihn ohnehin nicht.
  const required = description.axes.find((axis) => axis.id === "required");
  const byId = new Map<Id, RuleChip>();
  for (const chip of required?.chips ?? []) {
    if (chip.kind === "folder" && chip.folderId !== undefined) byId.set(chip.folderId, chip);
  }

  const folders = resolved.emptyRuleFolderIds.map((id): EmptyRuleFolder => {
    const chip = byId.get(id);
    // Kein Chip zu dieser Kennung, oder ein Chip, den der Baum nicht kennt:
    // beides derselbe Wettlauf — der Ordner ist verschwunden, seit der Dienst
    // geantwortet hat, oder der Baum der Oberfläche ist älter als die Antwort.
    // In beiden Fällen ist „ein unbekannter Ordner" die ehrliche Auskunft und
    // die nackte Kennung die unehrliche.
    return { id, label: chip === undefined || chip.missing === true ? null : chip.label };
  });

  // `unresolvedRequired` ohne einen einzigen genannten Ordner: Der Befund
  // stimmt, nur benennen lässt er sich nicht. Ein leeres Feld hier hieße
  // „Der geforderte Ordner enthält kein Tag" ohne jeden Ordner im Satz.
  return folders.length === 0 ? [{ id: null, label: null }] : folders;
}

/**
 * Die betroffenen Ordner als deutsche Aufzählung — im Dativ, weil alle drei
 * Sätze, die sie einsetzen, einen Dativ verlangen: „ein Tag aus …", „in … liegt
 * kein Tag", „kein Tag in …".
 *
 * Namen stehen in Anführungszeichen, Unbenennbares nicht: „einem unbekannten
 * Ordner" ist eine Umschreibung und kein Name, und Anführungszeichen darum
 * behaupteten einen.
 *
 * Es gibt diese Funktion, weil derselbe Satzteil an vier Flächen entsteht —
 * Spaltenkopf, Spaltenleerzustand, Spaltendialog und Regelformular. Vier
 * getrennt gepflegte Fassungen liefen binnen einer Aufgabe auseinander.
 */
export function emptyFolderNames(folders: readonly EmptyRuleFolder[]): string {
  const named = folders
    .filter((folder) => folder.label !== null)
    .map((folder) => quotedName(folder.label ?? ""));
  const unnamed = folders.length - named.length;
  if (unnamed === 0) return enumerateGerman(named);
  return enumerateGerman([
    ...named,
    unnamed === 1 ? "einem unbekannten Ordner" : `${formatCount(unnamed)} unbekannten Ordnern`,
  ]);
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

/*
 * Hier standen bis T-094 `completionSpoken` und `exportSpoken` — „der Wert
 * einer Achse als Wort, für Vorlesehilfen".
 *
 * Beide hatten seit T-091 **keinen Aufrufer**. Der vorgelesene Satz entsteht in
 * {@link ruleSpoken} aus derselben Beschreibung, die auch die sichtbare
 * Vorschau zeichnet — und das ist der Grund, aus dem beide dasselbe sagen.
 * Zwei ungenutzte Nebenwege dorthin sind kein Vorrat, sondern zwei Stellen,
 * an denen ein späterer Aufrufer eine dritte Fassung bekommt.
 *
 * `exportSpoken` war zudem der letzte Leser von `EXPORT_TEXT`, das mit E-059
 * entfallen ist.
 */

/**
 * Die ganze Regel in **einem** Satz — für die Live-Region der Vorschau
 * (S-8 aus R-2, SC 4.1.3).
 *
 * ## Warum es diesen Satz überhaupt gibt
 *
 * Die Vorschau im Regelformular ist die einzige Fläche, an der die fünf Achsen
 * zu **einer** Aussage zusammenkommen — und sie ändert sich bei jeder Wahl.
 * Für eine Vorlesehilfe war sie damit unsichtbar: Wer die Regel mit der
 * Tastatur ändert, hört, dass er einen Optionsknopf gewählt hat, aber nicht,
 * was die Regel jetzt trifft.
 *
 * ## Warum die Chips **nicht** einzeln vorgelesen werden
 *
 * Die Live-Region bekommt genau diesen einen Satz und nicht den Kasten. Wird
 * eine ganze Chipwolke zur Live-Region, sagt sie bei jedem Tastendruck alles
 * noch einmal — und dann schaltet der Benutzer die Vorlesehilfe ab, nicht die
 * Region.
 *
 * Aus demselben Grund steht der **Grund** einer nicht erfüllbaren Regel am
 * Ende: Wer nach dem dritten Wort weghört, hat trotzdem gehört, was die Regel
 * trifft. Wer zuhört, erfährt danach, warum sie es nicht tut.
 */
export function ruleSpoken(description: RuleDescription, reach: RuleReach | null): string {
  const fault =
    reach?.kind === "empty-folder"
      ? ` Kein Tag in ${emptyFolderNames(reach.folders)} — diese Regel trifft deshalb nichts.`
      : "";

  if (description.isEmpty) {
    return `Diese Regel nennt keine Bedingung und trifft nichts.${fault}`;
  }

  const conditions = description.axes
    .map(
      (axis) =>
        `${axis.label} ${axis.text ?? axis.chips.map((chip) => foreignText(chip.label)).join(", ")}`,
    )
    .join("; ");
  const neutral =
    description.neutral.length === 0
      ? ""
      : ` Ohne Einschränkung: ${description.neutral.map((axis) => axis.label).join(", ")}.`;

  return `Diese Regel trifft: ${conditions}.${neutral}${fault}`;
}
