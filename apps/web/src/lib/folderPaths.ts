import type { Id, TagFolderNode, TagTree } from "../api/types";

export interface FolderPath {
  readonly id: Id;
  /** Der volle Pfad, Wurzel zuerst: `["Kunden", "Nord"]`. */
  readonly path: readonly string[];
}

/**
 * Der Ordnerbaum als flache Liste mit vollem Pfad (A-4.3, A-13.3).
 *
 * Der Baum ist beliebig tief; ueberall dort, wo ein Ordner **ausserhalb** des
 * Baums genannt wird — in einer Regel, in einem Auswahlfeld —, braucht es
 * seinen Pfad und nicht nur seinen Namen: Drei Ordner koennen "Nord" heissen.
 *
 * Reine Anzeige. Welche Tags in einem Ordner liegen und welche Todos daraus
 * folgen, entscheidet der Dienst (`PoolPort.resolveRule`), nicht diese Datei.
 */
export function flatFolders(tree: TagTree): readonly FolderPath[] {
  const out: FolderPath[] = [];
  const walk = (nodes: readonly TagFolderNode[], prefix: readonly string[]): void => {
    for (const node of nodes) {
      const path = [...prefix, node.folder.name];
      out.push({ id: node.folder.id, path });
      walk(node.subfolders, path);
    }
  };
  walk(tree.rootFolders, []);
  return out;
}
