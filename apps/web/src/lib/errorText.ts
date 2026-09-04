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
 * Warum der Name **unverändert** aus `message` kommt
 * ---------------------------------------------------------------------------
 *
 * Der Vertrag steht in `packages/storage/src/sqlite/mappers.ts`
 * (`poolReference`) und in der Schnittstellenbeschreibung: **`code` ist
 * `pool_rule`, `field` ist die Kennung des Pools, `message` nennt ihn beim
 * Namen** — wörtlich `Regel „Ost“`, samt deutscher Anführungszeichen. Diese
 * Datei zerlegt den Text nicht, um „Ost" herauszuschneiden: Ein Ausdruck, der
 * heute das Wort „Regel" abschneidet, schneidet morgen die Hälfte des Namens
 * ab, und niemand wird dabei rot. Angezeigt wird, was der Dienst geschrieben
 * hat.
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
 * **Form** und nicht die Funktion, die geteilt wird. Die Anführungszeichen
 * setzt sie im Unterschied zu `listPools` nicht selbst: Sie stehen im Text des
 * Dienstes bereits.
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
 * Die Regeln, die der Dienst als Grund genannt hat — als Anzeigetexte.
 *
 * Leer, wenn der Fehlschlag keiner des Dienstes war, wenn er keine `details`
 * trug oder wenn darin nichts steht, was eine Regel bezeichnet. Ein anderer
 * Eintrag in `details` — etwa ein Feldfehler einer Prüfung — wird **nicht**
 * mitgenommen: Er beantwortet eine andere Frage und gehört an das Feld, nicht
 * in einen Löschdialog.
 */
export function ruleReferences(cause: unknown): readonly string[] {
  if (!(cause instanceof TaktApiError)) return [];
  return cause.details
    .filter((entry) => entry.code === RULE_REFERENCE_CODE)
    .map((entry) => entry.message);
}

/**
 * Die Meldung des Dienstes, um die betroffenen Regeln ergänzt.
 *
 * Ohne `details` ist es Wort für Wort `errorMessage(cause)` — die heutige
 * Auskunft, unverändert. Mit `details` kommt ein zweiter Satz dazu, und nur
 * einer: „Betroffen ist Regel „Ost“." beziehungsweise „Betroffen sind Regel
 * „Ost“, Regel „Nord“ und Regel „Abrechnung“."
 *
 * Der Satz sagt nicht, was zu tun ist. Das sagt bereits der Dienst („Nehmen
 * Sie ihn dort zuerst heraus."), und zweimal dieselbe Anweisung liest sich wie
 * zwei verschiedene.
 */
export function errorMessageWithRules(cause: unknown): string {
  const base = errorMessage(cause);
  const rules = ruleReferences(cause);
  if (rules.length === 0) return base;
  const verb = rules.length === 1 ? "Betroffen ist" : "Betroffen sind";
  return `${base} ${verb} ${enumerateGerman(rules)}.`;
}
