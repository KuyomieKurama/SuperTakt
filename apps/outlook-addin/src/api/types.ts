/**
 * Takt — die Antworttypen des lokalen Dienstes, so wie das Add-in sie sieht.
 *
 * Bewusst **eigene** Typen und kein Import aus `@takt/domain`. Zwei Gründe:
 *
 *  1. Was über HTTP kommt, ist JSON. Markierte Kennungstypen (`TodoId` und so
 *     weiter) existieren zur Laufzeit nicht; sie hier zu behaupten wäre eine
 *     Behauptung über fremde Daten, keine Prüfung.
 *  2. Das Add-in soll die Domäne **nicht** in sein Bündel ziehen können. Eine
 *     Abhängigkeit auf `@takt/domain` wäre die offene Tür dafür, Fachlogik im
 *     Aufgabenbereich nachzubauen, statt sie über den Dienst zu benutzen — und
 *     genau das ist die zweite Wahrheit, die eine Abrechnung auseinanderbringt.
 *
 * Die Gestalt spiegelt `apps/local-api/src/routes/addin/`. Weicht sie ab, fällt
 * es im Nachweispfad auf: Er fährt den echten Router gegen diesen Client.
 *
 * **Eine Ausnahme, und sie ist begründet: `PoolMovement`.** Der Typ kommt seit
 * T-104 aus `@takt/domain` statt als vierte Abschrift hierher. Beide Gründe
 * oben treffen auf ihn nicht zu: Er trägt keine markierte Kennung, sondern drei
 * Listen gewöhnlicher Zeichenketten, und er wird **unverändert** an
 * `poolMovementSentence` weitergereicht — an dieselbe Funktion in derselben
 * Domäne, die der Aufgabenbereich seit E-058 ohnehin aufruft. Ein `import type`
 * bringt zur Laufzeit nichts ins Bündel. Eine eigene Fassung hier hätte sich
 * stillschweigend von ihr entfernen können; das ist dieselbe Falle wie beim
 * Satz selbst, eine Ebene tiefer. Die ausführliche Begründung steht in
 * `duplicate/rule.ts` an der Stelle, an der bis T-104 `offerMovement` stand.
 */

import type { PoolMovement } from '@takt/domain';

export interface TagDto {
  readonly id: string;
  readonly folderId: string | null;
  readonly name: string;
  readonly color: string | null;
}

export interface TagFolderDto {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
}

export interface TagFolderNodeDto {
  readonly folder: TagFolderDto;
  /** Beliebig tief (A-4.3). Vier Ebenen sind der Regelfall, nicht die Grenze. */
  readonly subfolders: readonly TagFolderNodeDto[];
  readonly tags: readonly TagDto[];
}

export interface TagTreeDto {
  readonly rootFolders: readonly TagFolderNodeDto[];
  readonly rootTags: readonly TagDto[];
}

export interface PoolDto {
  readonly id: string;
  readonly name: string;
  readonly matchMode: 'any' | 'all';
  readonly includeSubfolders: boolean;
  readonly rule: readonly ({ kind: 'tag'; tagId: string } | { kind: 'folder'; folderId: string })[];
}

export interface TodoStatusDto {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly isDefault: boolean;
}

export interface AddinContextDto {
  readonly tagTree: TagTreeDto;
  readonly pools: readonly PoolDto[];
  readonly statuses: readonly TodoStatusDto[];
  readonly defaultStatusId: string;
  /** Standard-Tags aus A-9.1, in ihrer konfigurierten Reihenfolge. */
  readonly defaultTagIds: readonly string[];
}

export interface TodoMatchDto {
  readonly id: string;
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: string;
  readonly tagIds: readonly string[];
  readonly completedAt: string | null;
  readonly openSeconds: number;
  readonly exportedSeconds: number;
  /**
   * Wie eine Buchung auf dieses Todo es durch die Pools und Spalten bewegen
   * **würde** — oder `null` (I-05, E-056, T-084, E-061 Punkt 3).
   *
   * Kommt aus dem Dienst und wird im Add-in **nicht** nachgerechnet: Die Regeln
   * lösen Ordner beliebig tief auf (A-4.3) und urteilen seit T-076 über fünf
   * Achsen — erforderliche Tags, ausgeschlossene Tags, Status, Erledigt,
   * Exportstatus. Eine zweite Fassung davon im Aufgabenbereich wäre eine zweite
   * Wahrheit über die Frage, wo ein Todo auftaucht; sie liefe spätestens mit
   * der sechsten Achse auseinander. `enters` ließe sich hier ohnehin nicht
   * nachbilden: Der Unterschied verlangt beide Zustände **derselben** Regel,
   * und ein Vergleich über Namen ließe zwei gleichnamige Regeln füreinander
   * einstehen.
   *
   * Der Zeitpunkt ist der **nach** der Buchung, weil der Satz daraus im Futur
   * steht (`duplicate/reopen.ts`). Für eine Regel über „Erledigt" oder den
   * Exportstatus ist das seit T-078 ein Unterschied.
   *
   * `null` heißt: Diese Buchung bewegt nichts — das Todo ist offen und hat
   * schon eine offene Buchung. Der Aufgabenbereich lässt die Zeile dann weg.
   * Für ein **erledigtes** Todo steht hier immer ein Wert: Die Buchung hebt
   * „Erledigt" auf (A-2.5), und der Satz über die Rückkehr braucht `appears`.
   *
   * Bis T-104 standen hier `poolNames`, `enteringPoolNames` und
   * `leavingPoolNames`; die Namen leben in `PoolMovement` als `appears`,
   * `enters` und `leaves` weiter (E-061 Punkt 3).
   */
  readonly poolMovement: PoolMovement | null;
}

export type MatchResponseDto =
  | {
      readonly searched: false;
      readonly reason: string;
      readonly message: string;
      readonly matches: readonly TodoMatchDto[];
    }
  | {
      readonly searched: true;
      readonly callNumber: string;
      readonly matches: readonly TodoMatchDto[];
    };

export interface TodoDto {
  readonly id: string;
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: string;
  readonly tagIds: readonly string[];
  readonly completedAt: string | null;
}

export interface CreateTodoResponseDto {
  readonly todo: TodoDto;
  /** Welche Tags der Dienst nach A-9.5 ergänzt hat. */
  readonly addedDefaultTagIds: readonly string[];
  /**
   * Welche Tags durch `tagNames` **neu entstanden** sind (T-061).
   *
   * Vollständige Tags und nicht nur Kennungen: Die Erfolgsmeldung nennt den
   * neuen Namen, ohne den Baum erneut zu holen. Leer, wenn jeder getippte Name
   * schon ein Tag hatte — und dieser Fall ist der häufigere, weil der
   * Aufgabenbereich einen bereits vorhandenen Namen gar nicht erst als „neu"
   * anbietet.
   *
   * Welche Schreibweise hier steht, entscheidet der Dienst: Trifft „Backend"
   * ein vorhandenes „backend", gewinnt das zuerst angelegte Tag. Deshalb wird
   * der Name aus dieser Antwort gezeigt und nicht der aus dem Eingabefeld.
   */
  readonly createdTags: readonly TagDto[];
}

export interface TimeEntryDto {
  readonly id: string;
  readonly todoId: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly durationSeconds: number;
  readonly note: string;
  readonly exportStatus: 'open' | 'exported';
}

export interface BookResponseDto {
  readonly timeEntry: TimeEntryDto;
  /** War das Todo vor dieser Buchung erledigt? */
  readonly todoWasDone: boolean;
  /**
   * Wurde „Erledigt" durch diese Buchung aufgehoben (A-2.5)?
   *
   * Seit T-038 gleichbedeutend mit `todoWasDone` — die Aufhebung ist keine
   * Option mehr. Das Feld bleibt, weil die Rückmeldung an den Benutzer die
   * **Wirkung** benennt und nicht den Vorzustand.
   */
  readonly doneCleared: boolean;
  /**
   * Wie diese Buchung das Todo durch die Pools und Spalten bewegt hat — oder
   * `null` (I-05, E-056, T-084, E-061 Punkt 3).
   *
   * Aus derselben Rechnung und demselben Zustandspaar wie die Ankündigung in
   * {@link TodoMatchDto.poolMovement}: Was der Aufgabenbereich vor der Buchung
   * angekündigt hat, muss danach zutreffen.
   */
  readonly poolMovement: PoolMovement | null;
}
