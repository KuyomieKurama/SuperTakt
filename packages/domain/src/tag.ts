/**
 * Takt — Tags, Tag-Ordner und Pools (A-3.*, A-4.*, A-9.*).
 */

import type {
  PoolId,
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
// Pools (A-3.1 bis A-3.4)
// ---------------------------------------------------------------------------

/**
 * Ein Bestandteil einer Pool-Regel: entweder ein einzelnes Tag (A-3.2) oder
 * ein Ordner, dessen Tags allesamt zählen. Genau eines von beidem.
 * Tabelle `pool_rule`.
 */
export type PoolRuleTerm =
  | { readonly kind: 'tag'; readonly tagId: TagId }
  | { readonly kind: 'folder'; readonly folderId: TagFolderId };

/**
 * Wo eine Regel erscheint (E-054).
 *
 * Seit E-054 ist eine Kanban-Spalte dasselbe wie ein Pool: ein Name und eine
 * Regel über Tags. Es gibt deshalb **eine** Entität und nicht zwei —
 * `pool`/`pool_rule` mit allem, was daran hängt (Auflösung über Ordner,
 * Mitglieder als Abfrage, die leere Regel trifft nichts). Was eine Regel von
 * der anderen unterscheidet, ist allein die Fläche, auf der sie erscheint.
 *
 *   `pool`  — nur in der Pool-Liste. Der Bestand vor E-054, und die Vorgabe:
 *             eine neu angelegte Regel steht dort, wo Regeln bisher standen.
 *   `board` — nur als Spalte des Kanban-Boards.
 *   `both`  — beides. Dieselbe Regel, an zwei Stellen sichtbar.
 *
 * Dreiwertig und nie leer, aus demselben Grund wie der Exportstatus: Zwei
 * Wahrheitswerte nebeneinander (`zeigtImPool`, `zeigtAufBoard`) hätten vier
 * Zustände, und einer davon — beide falsch — wäre eine Regel, die nirgends
 * erscheint und die niemand wiederfindet.
 */
export type PoolPlacement = 'pool' | 'board' | 'both';

/**
 * Eine der beiden Flächen, auf denen eine Regel erscheinen kann (E-054).
 *
 * Hier steht **kein** Prädikat `showsOn(placement, surface)`. Es wäre in einer
 * Zeile geschrieben und hätte keinen Aufrufer: Wer auf einer Fläche steht,
 * entscheidet die Abfrage (`PoolPort.list`, `WHERE placement IN (?, 'both')`),
 * und eine zweite Fassung ohne Leser wäre genau der tote Eintrag, den dieser
 * Bestand an anderer Stelle rot werden lässt. Der Typ hier trägt die
 * Aufzählung, damit `tsc` sie erzwingt; die Auswahl trifft die Abfrage.
 */
export type PoolSurface = 'pool' | 'board';

/**
 * Ein Todo-Pool (A-3.1 bis A-3.3) — und seit E-054 zugleich die Bauform einer
 * Kanban-Spalte.
 *
 * Gespeichert wird ausschließlich die Regel. Es gibt keine Tabelle, die ein
 * Todo einem Pool zuordnet, und keinen zwischengespeicherten Mitgliederstand
 * (A-3.4). Wer im Pool ist, ergibt sich bei jeder Abfrage aus den Tags.
 *
 * Das ist die Voraussetzung für A-2.5: Wird ein erledigtes Todo durch den
 * Timerstart wieder aktiv, ändert sich an seinen Tags nichts — es erscheint
 * ohne weiteres Zutun wieder in seinem Pool, weil es ihn nie verlassen hat.
 * Ein gespeicherter Mitgliederstand müsste an dieser Stelle nachgezogen werden
 * und wäre die wahrscheinlichste Fehlerquelle des ganzen Ablaufs.
 *
 * `matchMode`:
 *   `any` — das Todo trägt mindestens eines der Regel-Tags.
 *   `all` — das Todo trägt alle Regel-Tags.
 *
 * `includeSubfolders`: Bei Regelteilen der Art `folder` zählen auch die Tags in
 * dessen Unterordnern, beliebig tief.
 */
export interface Pool {
  readonly id: PoolId;
  readonly name: string;
  readonly matchMode: 'any' | 'all';
  readonly includeSubfolders: boolean;
  /**
   * Wo diese Regel erscheint (E-054). Siehe {@link PoolPlacement}.
   *
   * Die Vorgabe ist `pool`. Migration 0009 setzt sie auf jede vorhandene
   * Zeile: Nach der Aktualisierung ist jede bestehende Regel weiterhin ein
   * Pool und keine davon eine Spalte. Das Board ist danach leer, bis jemand
   * eine Spalte einrichtet — sichtbar leer, nicht heimlich gefüllt.
   */
  readonly placement: PoolPlacement;
  /**
   * Reihenfolge. Sie gilt für **beide** Flächen: Die Pool-Liste zeigt die
   * Regeln mit `placement` `pool`/`both` nach Position, das Board die mit
   * `board`/`both` nach derselben Position. Eine zweite Positionsspalte je
   * Fläche wäre eine zweite Wahrheit über dieselbe Ordnung.
   */
  readonly position: number;
  readonly rule: readonly PoolRuleTerm[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Gehört ein Todo mit diesen Tags in diesen Pool?
 *
 * Rein und ohne laufenden Dienst prüfbar. `ruleTagIds` ist die zur Regel
 * aufgelöste Tagmenge einschließlich der Tags aus Unterordnern; das Auflösen
 * ist Aufgabe des Ports, weil dafür der Baum gebraucht wird.
 *
 * Der Erledigt-Status geht hier bewusst nicht ein. Ein erledigtes Todo bleibt
 * Mitglied seines Pools; ob es angezeigt wird, entscheidet der Filter der
 * Ansicht, nicht die Zugehörigkeit.
 */
export type MatchesPool = (input: {
  readonly todoTagIds: readonly TagId[];
  readonly ruleTagIds: readonly TagId[];
  readonly matchMode: 'any' | 'all';
}) => boolean;

/**
 * Wird ein Todo in einer Pool-Ansicht gezeigt? (A-2.4, A-2.5)
 *
 * Diese Regel trägt A-2.5, und sie ist der einzige Ort, an dem der
 * Erledigt-Status überhaupt eine Rolle für Pools spielt. `MatchesPool` oben
 * kennt ihn nicht: Ein erledigtes Todo bleibt Mitglied seines Pools, es wird
 * nur nicht angezeigt.
 *
 * Damit erfüllt sich A-2.5 ohne einen einzigen Schreibvorgang. Hebt ein
 * Timerstart das Erledigt-Kennzeichen auf, liefert diese Funktion `true`, und
 * das Todo erscheint wieder in seinem Pool — dieselbe Zugehörigkeit, dieselbe
 * Kanban-Spalte, nichts wurde gespeichert und nichts wiederhergestellt.
 *
 * Die Regel gehört in die Domäne und nicht in die Oberfläche. Läge sie in einer
 * Ansicht, müsste jede weitere Ansicht sie erneut treffen — Board, Liste,
 * Add-in — und eine davon würde sie irgendwann anders treffen.
 *
 * `includeCompleted` ist der ausdrückliche Wunsch des Benutzers, erledigte
 * Todos einzublenden. Vorgabe in Pool-Ansichten ist `false`.
 *
 * Rein und ohne laufenden Dienst prüfbar.
 */
export type IsVisibleInPool = (input: {
  /** `null` bedeutet aktiv, ein Zeitstempel bedeutet erledigt (A-2.4). */
  readonly completedAt: Timestamp | null;
  readonly includeCompleted: boolean;
}) => boolean;

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
 * Gehört ein Todo mit diesen Tags in diesen Pool? (A-3.2, A-3.4)
 *
 * Eine leere Regel trifft nichts — auch im Modus `all` nicht. Die mathematisch
 * saubere Lesart „alle null Bedingungen sind erfüllt" wäre hier fachlich
 * falsch: Ein Pool, dessen Regel noch nicht fertig eingerichtet ist, hätte
 * schlagartig jedes Todo der Datenbank als Mitglied.
 */
export const matchesPool: MatchesPool = ({ todoTagIds, ruleTagIds, matchMode }) => {
  if (ruleTagIds.length === 0) return false;

  const onTodo = new Set<TagId>(todoTagIds);

  return matchMode === 'all'
    ? ruleTagIds.every((tagId) => onTodo.has(tagId))
    : ruleTagIds.some((tagId) => onTodo.has(tagId));
};

/**
 * Wird ein Todo in einer Pool-Ansicht gezeigt? (A-2.4, A-2.5, E-039)
 *
 * Das ist die ganze Umsetzung von A-2.5. Es gibt keinen Schreibvorgang, keine
 * gespeicherte Mitgliedschaft und keine gemerkte Kanban-Spalte: Hebt der
 * Timerstart `completedAt` auf, liefert diese Funktion `true`, und das Todo
 * steht wieder in seinem Pool — in derselben Spalte wie zuvor, weil das
 * Erledigen die Spalte nie angefasst hat (E-023).
 */
export const isVisibleInPool: IsVisibleInPool = ({ completedAt, includeCompleted }) =>
  completedAt === null || includeCompleted;

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
