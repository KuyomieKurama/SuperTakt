import type { ForeignText, Id, TagFolderNode, TagTree } from "../../api/types";
import type { TagTreeNode } from "./TagTree";

/**
 * Vom Baum des Dienstes zur Baumansicht — und zurück zur Auswahl.
 *
 * Reine Umwandlung, kein React: `TagTree` ist die Gestalt aus `api/types.ts`,
 * `TagTreeNode` die Gestalt, die `TagTree.tsx` zeichnet. Getrennt von der
 * Ansicht, weil das zwei Fragen sind — „wie sieht ein Knoten aus" gehört der
 * Ansicht, „welcher Knoten ist das" den Daten.
 *
 * `ForeignText` und nicht `string`: Namen von Tags und Ordnern kommen aus dem
 * Bestand und können aus dem Add-in stammen (E-063). Wer die Herkunft hier
 * fallen ließe, verlöre sie für jede Prüfung dahinter.
 */

/** Was im Baum gerade gewählt ist. `null` heißt: nichts. */
export type Selection =
  | {
      readonly kind: "folder";
      readonly id: Id;
      readonly name: ForeignText;
      readonly parentId: Id | null;
    }
  | {
      readonly kind: "tag";
      readonly id: Id;
      readonly name: ForeignText;
      readonly folderId: Id | null;
    }
  | null;

export function toTreeNodes(tree: TagTree): readonly TagTreeNode[] {
  const folderNode = (node: TagFolderNode): TagTreeNode => ({
    id: node.folder.id,
    label: node.folder.name,
    kind: "folder",
    tagCount: countTags(node),
    children: [
      ...node.subfolders.map(folderNode),
      ...node.tags.map<TagTreeNode>((tag) => ({ id: tag.id, label: tag.name, kind: "tag" })),
    ],
  });

  return [
    ...tree.rootFolders.map(folderNode),
    ...tree.rootTags.map<TagTreeNode>((tag) => ({ id: tag.id, label: tag.name, kind: "tag" })),
  ];
}

function countTags(node: TagFolderNode): number {
  return node.tags.length + node.subfolders.reduce((sum, child) => sum + countTags(child), 0);
}

export function findSelection(tree: TagTree, id: Id): Selection {
  for (const tag of tree.rootTags) {
    if (tag.id === id) return { kind: "tag", id, name: tag.name, folderId: null };
  }
  const walk = (nodes: readonly TagFolderNode[], parentId: Id | null): Selection => {
    for (const node of nodes) {
      if (node.folder.id === id) {
        return { kind: "folder", id, name: node.folder.name, parentId };
      }
      for (const tag of node.tags) {
        if (tag.id === id) {
          return { kind: "tag", id, name: tag.name, folderId: node.folder.id };
        }
      }
      const deeper = walk(node.subfolders, node.folder.id);
      if (deeper !== null) return deeper;
    }
    return null;
  };
  return walk(tree.rootFolders, null);
}

/**
 * Voller Pfad eines Ordners als ein Stueck Text, fuer die Rueckmeldung nach
 * einem Ziehvorgang. „Wartung" allein sagt nicht, welche Wartung gemeint ist,
 * wenn zwei Kunden je eine haben.
 */
export function folderName(tree: TagTree, id: Id): string {
  const path = pathOf(tree, id);
  return path.length === 0 ? "diesem Ordner" : path.join(" / ");
}

export function pathOf(tree: TagTree, id: Id): readonly string[] {
  const walk = (nodes: readonly TagFolderNode[], prefix: readonly string[]): readonly string[] | null => {
    for (const node of nodes) {
      const path = [...prefix, node.folder.name];
      if (node.folder.id === id) return path;
      for (const tag of node.tags) if (tag.id === id) return [...path, tag.name];
      const deeper = walk(node.subfolders, path);
      if (deeper !== null) return deeper;
    }
    return null;
  };
  const rootTag = tree.rootTags.find((tag) => tag.id === id);
  if (rootTag !== undefined) return [rootTag.name];
  return walk(tree.rootFolders, []) ?? [];
}
