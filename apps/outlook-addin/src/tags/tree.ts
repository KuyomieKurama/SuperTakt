/**
 * Takt — der Tag- und Ordnerbaum im Aufgabenbereich (A-4.3, A-4.4, A-10.4, A-10.5).
 *
 * Der Baum kommt vollständig über die API und wird **nicht** im Add-in
 * zwischengespeichert (A-10.4). Diese Datei enthält deshalb keine Ablage,
 * sondern nur zwei reine Umformungen — und genau die beiden, die einen tiefen
 * Baum in einem 350 Pixel breiten Aufgabenbereich bedienbar halten:
 *
 *  - **Abflachen mit Pfad.** Jedes Tag bekommt seinen vollständigen Pfad
 *    (`Kunden › Nord › Betrieb › Wartung`). Bei vier und mehr Ebenen ist die
 *    Einrückung allein wertlos, weil sie in der Breite nicht mehr unterscheidet
 *    — der Pfad tut es (A-4.4, A-13.3).
 *  - **Suchen.** Getroffen wird über den **Pfad**, nicht nur über den Tagnamen.
 *    „Wartung" findet das Tag; „Nord Wartung" findet es auch. Damit ersetzt die
 *    Suche das Aufklappen, statt es zu ergänzen — das ist der einzige Weg, auf
 *    dem eine tiefe Hierarchie in einem schmalen Bereich schnell bleibt.
 */

import type { TagDto, TagFolderNodeDto, TagTreeDto } from '../api/types.ts';

export interface FlatTag {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  /** Die Ordner über dem Tag, von der Wurzel abwärts. Leer auf Wurzelebene. */
  readonly folderPath: readonly string[];
  /** Der Pfad als anzeigbarer Text, ohne den Tagnamen selbst. */
  readonly folderLabel: string;
  /** Tiefe des Tags. 0 heißt Wurzelebene. */
  readonly depth: number;
}

export const PATH_SEPARATOR = ' › ';

/**
 * Flacht den Baum ab und hängt an jedes Tag seinen Pfad.
 *
 * Iterativ mit eigenem Stapel und nicht rekursiv: Die Tiefe ist laut A-4.3
 * unbegrenzt, und ein Aufrufstapel, dessen Tiefe von Benutzerdaten abhängt, ist
 * eine Absturzursache, auf die man nicht kommt, solange man mit drei Ebenen
 * probiert.
 */
export const flattenTagTree = (tree: TagTreeDto): readonly FlatTag[] => {
  const result: FlatTag[] = [];

  const addTags = (tags: readonly TagDto[], path: readonly string[]): void => {
    for (const tag of tags) {
      result.push({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        folderPath: path,
        folderLabel: path.join(PATH_SEPARATOR),
        depth: path.length,
      });
    }
  };

  addTags(tree.rootTags, []);

  const stack: Array<{ readonly node: TagFolderNodeDto; readonly path: readonly string[] }> = [];
  for (let index = tree.rootFolders.length - 1; index >= 0; index -= 1) {
    const node = tree.rootFolders[index];
    if (node !== undefined) stack.push({ node, path: [] });
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;

    const path = [...current.path, current.node.folder.name];
    addTags(current.node.tags, path);

    for (let index = current.node.subfolders.length - 1; index >= 0; index -= 1) {
      const child = current.node.subfolders[index];
      if (child !== undefined) stack.push({ node: child, path });
    }
  }

  return result;
};

/**
 * Filtert die abgeflachte Liste.
 *
 * Jedes Wort der Eingabe muss irgendwo in Pfad **oder** Name vorkommen — nicht
 * die ganze Eingabe als zusammenhängende Zeichenkette. Sonst fände „Nord
 * Wartung" nichts, obwohl beide Wörter im Pfad stehen, und der Benutzer hielte
 * die Suche für kaputt.
 *
 * Groß- und Kleinschreibung wird über `toLocaleLowerCase('de')` angeglichen:
 * Die Tagnamen sind deutsch, und `İ` in der türkischen Voreinstellung eines
 * Rechners ist ein Fehler, den man erst auf dem Rechner des Kunden sieht.
 */
export const filterTags = (tags: readonly FlatTag[], query: string): readonly FlatTag[] => {
  const words = query
    .toLocaleLowerCase('de')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return tags;

  return tags.filter((tag) => {
    const haystack = `${tag.folderLabel}${PATH_SEPARATOR}${tag.name}`.toLocaleLowerCase('de');
    return words.every((word) => haystack.includes(word));
  });
};

/** Nachschlagewerk für die Chips über dem Baum. */
export const indexTags = (tags: readonly FlatTag[]): ReadonlyMap<string, FlatTag> =>
  new Map(tags.map((tag) => [tag.id, tag]));
