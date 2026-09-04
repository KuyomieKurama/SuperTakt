import { errorMessage, TaktApiError } from "../api/client";

/**
 * Takt — die Fehlermeldung des Dienstes, um das ergänzt, was in `details`
 * steht (T-097, Fund 2 aus T-096).
 *
 * ---------------------------------------------------------------------------
 * Wogegen
 * ---------------------------------------------------------------------------
 *
 * `TaktApiError.details` wurde im gesamten `apps/web`-Baum an keiner Stelle
 * gelesen. Der Dienst legt dort seit T-089 die **Regeln beim Namen** ab, die
 * ein Löschen verhindern — bei `tag_in_use` (Tag oder Ordner in einer Regel)
 * und bei `status_in_use` (Status in einer Regel). Die Oberfläche zeigte
 * stattdessen nur den allgemeinen Satz: „Dieser Ordner wird in der Regel eines
 * Pools verwendet." Bei einer Handvoll Regeln ist das gleichgültig, bei zwanzig
 * ist es eine Suche — und eine Sperre, aus der man nicht herausfindet, ist nur
 * halb umkehrbar. Genau deshalb nennt der Dienst die Namen; sie lagen bereit
 * und wurden weggeworfen.
 *
 * ---------------------------------------------------------------------------
 * Woher der Name kommt — `details[].name`, nicht ein Schnitt in `message`
 * ---------------------------------------------------------------------------
 *
 * Der Vertrag steht in `packages/storage/src/sqlite/mappers.ts`
 * (`poolReference`) und in der Schnittstellenbeschreibung: **`code` ist
 * `pool_rule`, `field` ist die Kennung des Pools, `message` nennt sie im Satz**
 * — wörtlich `Regel „Ost“` —, **und `name` nennt den bloßen Namen**: `Ost`,
 * ohne Gattungswort, ohne Anführungszeichen (seit T-107, W-11 aus R-2a).
 *
 * Diese Datei zerlegt `message` nicht, um „Ost" herauszuschneiden: Ein
 * Ausdruck, der heute das Wort „Regel" abschneidet, schneidet morgen die Hälfte
 * des Namens ab, und niemand wird dabei rot (T-097 Annahme 1, von R-2a
 * ausdrücklich bestätigt). Das Feld `name` gibt es genau deshalb.
 *
 * **Fehlt `name`, gilt `message`** — und das ist der beschriebene Vertragsfall
 * und kein stiller Rückfall: `name` ist freiwillig (`ApiFieldError.name?`),
 * weil ein Befund über ein Eingabefeld nichts zu benennen hat. Ein
 * `pool_rule`-Eintrag ohne Namen kommt heute von keiner der drei Sperren (Tag,
 * Ordner, Status teilen sich `poolReference`); er käme von einem älteren
 * Dienst, und dem gegenüber bleibt die Auskunft dieselbe wie vor T-110, Zeichen
 * für Zeichen. Verschwiegen wird dabei nichts: Der Name steht dann im Satz des
 * Dienstes.
 *
 * ---------------------------------------------------------------------------
 * Warum das Gattungswort am Satz hängt und nicht am Eintrag
 * ---------------------------------------------------------------------------
 *
 * Aus `name` wird „Betroffen sind die Regeln „Ost“, „Nord“ und „Abrechnung“."
 * — einmal „Regel", vorn, statt dreimal mitten in der Aufzählung. Das setzt
 * voraus, dass in der Aufzählung **nur** Namen stehen. Träfen beide Sorten
 * zusammen, stünde dort „die Regeln Regel „Ost“ und „Nord“"; deshalb entscheidet
 * {@link ruleList} für den ganzen Satz: Gattungswort vorn nur, wenn **jeder**
 * Eintrag seinen Namen mitbringt, sonst der Satzbau von T-097.
 *
 * ---------------------------------------------------------------------------
 * Was hier **nicht** entsteht
 * ---------------------------------------------------------------------------
 *
 * Keine zweite Fachlogik. Diese Datei entscheidet nichts über Regeln, sie
 * reiht Namen auf. Die Aufzählungsform ist die aus `poolMovementSentence`
 * (`packages/domain/src/pool-movement.ts`, `listPools`) — „A, B und C" —, weil
 * der Benutzer beide Aufzählungen am selben Tag liest und zwei verschiedene
 * Formen für dieselbe Sache eine Frage aufwerfen, die keine ist. Sie steht
 * hier abermals, weil `listPools` nicht ausgeführt wird; es ist bewußt die
 * **Form** und nicht die Funktion, die geteilt wird — `listPools` ist in
 * `@takt/domain` nicht ausgeführt und steht deshalb nicht zur Verfügung
 * (siehe „Offene Fragen" in T-110).
 *
 * Die Anführungszeichen um einen **Namen** setzt {@link ruleList} seit T-110
 * selbst, wie `listPools` es tut: `name` bringt keine mit. Um eine **Meldung**
 * setzt sie keine — dort stehen sie bereits im Text des Dienstes.
 */

/**
 * Der Schlüssel, unter dem der Dienst eine Regel in `details` nennt.
 *
 * Eine Zeichenkette an einer Stelle. Sie steht dreimal in `packages/storage`
 * und einmal in der Schnittstellenbeschreibung; hier ist ihr einziger Ort in
 * der Oberfläche.
 */
const RULE_REFERENCE_CODE = "pool_rule";

/**
 * Reiht auf, wie `poolMovementSentence` es tut: „A", „A und B", „A, B und C".
 *
 * Ohne Anführungszeichen und ohne Gattungswort — beides bringen die Einträge
 * mit. Bei einer leeren Liste kommt die leere Zeichenkette zurück; die
 * Aufrufstelle fragt vorher, ob es überhaupt etwas aufzuzählen gibt.
 */
export function enumerateGerman(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1] ?? ""}`;
}

/**
 * Die Regeln, die der Dienst als Grund genannt hat — als Anzeigetexte, und die
 * Auskunft, ob jede von ihnen ihren Namen mitgebracht hat.
 *
 * `items` ist leer, wenn der Fehlschlag keiner des Dienstes war, wenn er keine
 * `details` trug oder wenn darin nichts steht, was eine Regel bezeichnet. Ein
 * anderer Eintrag in `details` — etwa ein Feldfehler einer Prüfung — wird
 * **nicht** mitgenommen: Er beantwortet eine andere Frage und gehört an das
 * Feld, nicht in einen Löschdialog.
 *
 * Je Eintrag gilt: **erst `name`, sonst `message`.** Ein Name kommt in
 * Anführungszeichen, eine Meldung unverändert — sie bringt ihre eigenen mit.
 */
function ruleList(cause: unknown): { readonly items: readonly string[]; readonly named: boolean } {
  if (!(cause instanceof TaktApiError)) return { items: [], named: false };
  const entries = cause.details.filter((entry) => entry.code === RULE_REFERENCE_CODE);
  return {
    items: entries.map((entry) => (entry.name === undefined ? entry.message : `„${entry.name}“`)),
    named: entries.length > 0 && entries.every((entry) => entry.name !== undefined),
  };
}

/**
 * Die Regeln, die der Dienst als Grund genannt hat — als Anzeigetexte.
 *
 * Siehe {@link ruleList}. Aufrufer, die nur wissen wollen, **ob** der Dienst
 * Regeln genannt hat, fragen `length`; der Satz für die Anzeige entsteht in
 * {@link errorMessageWithRules} und nicht zweimal.
 */
export function ruleReferences(cause: unknown): readonly string[] {
  return ruleList(cause).items;
}

/**
 * Die Meldung des Dienstes, um die betroffenen Regeln ergänzt.
 *
 * Ohne `details` ist es Wort für Wort `errorMessage(cause)` — die heutige
 * Auskunft, unverändert. Mit `details` kommt ein zweiter Satz dazu, und nur
 * einer:
 *
 * * mit `name` (Regelfall seit T-107, Fassung aus W-11):
 *   „Betroffen ist die Regel „Ost“." · „Betroffen sind die Regeln „Ost“,
 *   „Nord“ und „Abrechnung“."
 * * ohne `name` (älterer Dienst, siehe Dateikopf): „Betroffen ist Regel
 *   „Ost“." · „Betroffen sind Regel „Ost“, Regel „Nord“ und Regel
 *   „Abrechnung“." — der Wortlaut von T-097, unverändert.
 *
 * Der Satz sagt nicht, was zu tun ist. Das sagt bereits der Dienst („Nehmen
 * Sie ihn dort zuerst heraus."), und zweimal dieselbe Anweisung liest sich wie
 * zwei verschiedene.
 */
export function errorMessageWithRules(cause: unknown): string {
  const base = errorMessage(cause);
  const { items, named } = ruleList(cause);
  if (items.length === 0) return base;
  const subject = named
    ? items.length === 1
      ? "ist die Regel"
      : "sind die Regeln"
    : items.length === 1
      ? "ist"
      : "sind";
  return `${base} Betroffen ${subject} ${enumerateGerman(items)}.`;
}
