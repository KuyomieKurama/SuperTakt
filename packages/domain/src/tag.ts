/**
 * Takt — Tags, Tag-Ordner und Standard-Tags (A-4.*, A-9.*).
 *
 * Drei Tabellen und ein Baum: `tag`, `tag_folder`, `default_tag`.
 *
 * **Die Pools sind seit T-261 nebenan** (`pool.ts`). Sie standen hier, solange
 * eine Regel nur aus Tags bestand; seit E-055 nennt sie fünf Achsen, von denen
 * vier keine Tags sind. Die Trennung hat nichts gekostet: Diese Datei benutzt
 * aus `pool.ts` nichts, und `pool.ts` benutzt von hier nichts.
 */

import type {
  Result,
  TagFolderId,
  TagId,
  TaktError,
  Timestamp,
} from './kernel.ts';
import { err, ok, taktError } from './kernel.ts';

// ---------------------------------------------------------------------------
// Tag-Ordner (A-4.2, A-4.3, A-4.6) — Tabelle `tag_folder`
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Zyklusfreiheit (A-4.6)
// ---------------------------------------------------------------------------

/**
 * Darf `folderId` unter `newParentId` gehängt werden?
 *
 * Unzulässig ist beides: ein Ordner als eigener Vorfahr und ein Ordner als
 * Nachfahr seiner selbst. Beide Fälle sind dieselbe Bedingung — der Zielordner
 * darf nicht im Teilbaum des verschobenen Ordners liegen und nicht der Ordner
 * selbst sein.
 *
 * Die Prüfung braucht die Vorfahrenkette des Ziels. Sie wird über einen Port
 * geladen, nicht über einen Tabellendurchlauf: `TagFolderPort.ancestors`
 * liefert sie mit einer rekursiven Abfrage, die je Ebene einen Indexzugriff
 * macht. Bei vier und mehr Ebenen bleibt das ein Indexzugriff je Ebene und
 * lädt nie die gesamte Tabelle in den Speicher (E-022).
 *
 * Rein: Die Funktion bekommt die Kette als Eingabe und liest nichts nach.
 */
export type CheckFolderMove = (input: {
  readonly folderId: TagFolderId;
  readonly newParentId: TagFolderId | null;
  /** Vorfahren des Zielordners, vom Ziel aufwärts bis zur Wurzel. */
  readonly targetAncestors: readonly TagFolderId[];
}) => Result<void, TaktError<'tag_folder_cycle'>>;

// ---------------------------------------------------------------------------
// Tag (A-4.1, A-4.5)
// ---------------------------------------------------------------------------

export interface Tag {
  readonly id: TagId;
  /** `null` bedeutet: liegt auf Wurzelebene, in keinem Ordner. */
  readonly folderId: TagFolderId | null;
  readonly name: string;
  readonly color: string | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Standard-Tags (A-9.1 bis A-9.5) — Tabelle `default_tag`
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Umsetzung (T-009)
// ---------------------------------------------------------------------------

/**
 * Darf `folderId` unter `newParentId` gehängt werden? (A-4.6)
 *
 * Drei Fälle, und der mittlere ist der, den man vergisst:
 *
 *  1. Wurzelebene (`newParentId === null`) ist immer erlaubt. Ein Ordner ohne
 *     Elternteil kann in keinem Zyklus stehen.
 *  2. Der Ordner selbst als Ziel — ein Zyklus der Länge eins.
 *  3. Ein Nachfahr als Ziel. Erkennbar daran, dass der verschobene Ordner in
 *     der Vorfahrenkette des Ziels vorkommt: Wäre `a` ein Vorfahr von `d`, so
 *     hinge `a` nach dem Zug unter seinem eigenen Nachfahren.
 *
 * Die Kette kommt als Eingabe herein und wird nicht nachgeladen. Sie liefert
 * `TagFolderPort.ancestors` mit einer rekursiven Abfrage, die je Ebene einen
 * Indexzugriff macht und nie die ganze Tabelle in den Speicher lädt (E-022).
 * Genau deshalb bleibt diese Regel rein und ohne laufenden Dienst prüfbar,
 * obwohl sie über einen beliebig tiefen Baum urteilt.
 */
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
 * Vereinigt die gewählten Tags mit den Standard-Tags (A-9.1, A-9.3, A-9.5).
 *
 * Erst die Standard-Tags in ihrer konfigurierten Reihenfolge, dann die
 * ausdrücklich gewählten; Doppelte fallen weg, ohne die Reihenfolge zu
 * verschieben.
 *
 * Die Funktion ist rein und hält keinen Zustand. Das ist die Umsetzung von
 * A-9.5: Oberfläche und Outlook-Add-in rufen denselben Anwendungsfall auf, und
 * der ruft diese eine Funktion — es gibt keinen zweiten Erzeugungspfad, der
 * abweichen könnte.
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
