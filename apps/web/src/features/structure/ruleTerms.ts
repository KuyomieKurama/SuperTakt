import type { Id, PoolRuleTerm } from "../../api/types";

/* ==================================================================== */
/* Terme: Tags und Ordner in einer Liste                                */
/* ==================================================================== */

/**
 * Die Tags einer Termliste. Ordnerterme bleiben, wo sie sind.
 *
 * Zwei Bedienelemente teilen sich eine Liste — die Tag-Eingabe und die
 * Ordnerauswahl —, weil der Dienst eine Liste erwartet. Die Aufteilung findet
 * hier statt und nirgends sonst.
 */
export function tagIdsOf(terms: readonly PoolRuleTerm[]): readonly Id[] {
  return terms.flatMap((term) => (term.kind === "tag" ? [term.tagId] : []));
}

export function withTagIds(terms: readonly PoolRuleTerm[], next: readonly Id[]): readonly PoolRuleTerm[] {
  return [
    ...next.map((tagId) => ({ kind: "tag", tagId }) as const),
    ...terms.filter((term) => term.kind === "folder"),
  ];
}

function hasFolder(terms: readonly PoolRuleTerm[], folderId: Id): boolean {
  return terms.some((term) => term.kind === "folder" && term.folderId === folderId);
}

/** Die Ordnerkennungen einer Termliste als Menge. */
export function folderIdsOf(terms: readonly PoolRuleTerm[]): ReadonlySet<Id> {
  return new Set(terms.flatMap((term) => (term.kind === "folder" ? [term.folderId] : [])));
}

export function toggleFolder(terms: readonly PoolRuleTerm[], folderId: Id): readonly PoolRuleTerm[] {
  return hasFolder(terms, folderId)
    ? terms.filter((term) => !(term.kind === "folder" && term.folderId === folderId))
    : [...terms, { kind: "folder", folderId } as const];
}

/**
 * Nennt der Entwurf noch dieselben Terme wie der gespeicherte Stand?
 *
 * Keine Regelauswertung, sondern ein Vergleich zweier Listen: Er entscheidet
 * allein, ob die vom Dienst gelieferte Auflösung (`pool.resolved`) noch zu dem
 * gehört, was gerade im Formular steht. Sobald sie es nicht mehr tut, wird sie
 * nicht angepasst, sondern weggelassen.
 */
export function sameTerms(draft: readonly PoolRuleTerm[], saved: readonly PoolRuleTerm[]): boolean {
  if (draft.length !== saved.length) return false;
  return draft.every((term, index) => {
    const other = saved[index];
    if (other === undefined) return false;
    return term.kind === "tag"
      ? other.kind === "tag" && other.tagId === term.tagId
      : other.kind === "folder" && other.folderId === term.folderId;
  });
}
