import type {
  Result,
  TagFolderId,
  TagId,
  TaktError,
  Timestamp,
} from './kernel.ts';
import { err, ok, taktError } from './kernel.ts';

// Tag-Ordner (A-4.2, A-4.3, A-4.6) — Tabelle `tag_folder`

/**
 * Ein Ordner für Tags. `parentId === null` bedeutet Wurzelebene.
 *
 * Die Tiefe ist nicht begrenzt (A-4.3). Sie wird auch nicht gespeichert: ein
 * mitgeführter Tiefenwert müsste beim Verschieben für den gesamten Teilbaum
 * fortgeschrieben werden und wäre eine weitere Stelle, an der der Baum
 * inkonsistent werden kann.
 */
export interface TagFolder {
  readonly id: TagFolderId;
  readonly parentId: TagFolderId | null;
  readonly name: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Ein Ordner samt Kindern, wie ihn die Oberfläche und das Add-in in einem Zug
 * abholen (A-10.4). Ein Aufruf, ein Baum — nicht ein Aufruf je Ebene.
 */
export interface TagFolderNode {
  readonly folder: TagFolder;
  readonly subfolders: readonly TagFolderNode[];
  readonly tags: readonly Tag[];
}

/** Der vollständige Baum. Wurzeltags sind Tags ohne Ordner. */
export interface TagTree {
  readonly rootFolders: readonly TagFolderNode[];
  readonly rootTags: readonly Tag[];
}

// Zyklusfreiheit (A-4.6)

/** Die Vorfahrenkette des Ziels über den Port laden, statt den gesamten Ordnerbestand einzulesen. */
export type CheckFolderMove = (input: {
  readonly folderId: TagFolderId;
  readonly newParentId: TagFolderId | null;
  /** Vorfahren des Zielordners, vom Ziel aufwärts bis zur Wurzel. */
  readonly targetAncestors: readonly TagFolderId[];
}) => Result<void, TaktError<'tag_folder_cycle'>>;

// Tag (A-4.1, A-4.5)

export interface Tag {
  readonly id: TagId;
  /** `null` bedeutet: liegt auf Wurzelebene, in keinem Ordner. */
  readonly folderId: TagFolderId | null;
  readonly name: string;
  readonly color: string | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// Standard-Tags (A-9.1 bis A-9.5) — Tabelle `default_tag`

/**
 * Tags, die jedes neu angelegte Todo automatisch bekommt.
 *
 * Sie greifen im Anwendungsfall „Todo anlegen", nicht in einem der Aufrufer.
 * Damit gelten sie für die Oberfläche und für das Outlook-Add-in gleichermaßen,
 * wie A-9.5 es verlangt, ohne dass beide Wege dieselbe Regel führen müssen.
 */
export interface DefaultTag {
  readonly tagId: TagId;
  readonly position: number;
}

/**
 * Vereinigt die gewählten Tags mit den Standard-Tags.
 *
 * Doppelte werden zusammengefasst. Die Reihenfolge ist: erst die Standard-Tags
 * in ihrer konfigurierten Ordnung, dann die ausdrücklich gewählten.
 */
export type ApplyDefaultTags = (
  selected: readonly TagId[],
  defaults: readonly DefaultTag[],
) => readonly TagId[];

// Umsetzung (T-009)

/** Selbstzuordnung und Zuordnung unter eigene Nachfahren verhindern; die Wurzelebene ist zulässig. */
export const checkFolderMove: CheckFolderMove = ({ folderId, newParentId, targetAncestors }) => {
  if (newParentId === null) return ok(undefined);

  if (newParentId === folderId) {
    return err(
      taktError('tag_folder_cycle', 'Ein Ordner kann nicht in sich selbst verschoben werden.'),
    );
  }

  if (targetAncestors.includes(folderId)) {
    return err(
      taktError(
        'tag_folder_cycle',
        'Ein Ordner kann nicht in einen seiner eigenen Unterordner verschoben werden.',
      ),
    );
  }

  return ok(undefined);
};

/**
 * Standard-Tags zuerst, danach gewählte Tags; beim Entfernen von Duplikaten die Reihenfolge
 * erhalten.
 */
export const applyDefaultTags: ApplyDefaultTags = (selected, defaults) => {
  const ordered = [...defaults].sort((left, right) => left.position - right.position);

  const result: TagId[] = [];
  const seen = new Set<TagId>();

  const add = (tagId: TagId): void => {
    if (seen.has(tagId)) return;
    seen.add(tagId);
    result.push(tagId);
  };

  for (const entry of ordered) add(entry.tagId);
  for (const tagId of selected) add(tagId);

  return result;
};
