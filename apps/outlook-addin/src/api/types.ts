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
 */

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
   * Namen der Pools, in denen dieses Todo **nach einer Buchung darauf** stünde
   * (I-05).
   *
   * Kommt aus dem Dienst und wird im Add-in **nicht** nachgerechnet: Die
   * Poolregeln lösen Ordner beliebig tief auf (A-4.3) und urteilen seit T-076
   * über fünf Achsen — erforderliche Tags, ausgeschlossene Tags, Status,
   * Erledigt, Exportstatus. Eine zweite Fassung davon im Aufgabenbereich wäre
   * eine zweite Wahrheit über die Frage, wo ein Todo auftaucht; sie liefe
   * spätestens mit der sechsten Achse auseinander.
   *
   * Der Zeitpunkt ist der **nach** der Buchung, weil der Satz daraus im Futur
   * steht (`duplicate/reopen.ts`). Für eine Regel über „Erledigt" oder den
   * Exportstatus ist das seit T-078 ein Unterschied.
   */
  readonly poolNames: readonly string[];
  /**
   * Namen der Pools, in die dieselbe Buchung das Todo **hineinbewegt**
   * (T-084) — eine Teilmenge von `poolNames`.
   *
   * `poolNames` sagt, wo das Todo **danach steht**; diese Liste sagt, was sich
   * **dadurch ändert**. Für ein erledigtes Todo ist das Erste die Auskunft, für
   * ein offenes das Zweite: Dort wird nichts aufgehoben, und die Pools, in
   * denen es ohnehin schon steht, sind keine Nachricht. Die erste Buchung auf
   * einem Todo ist eine — sie setzt „hat offene Buchungen" von falsch auf wahr,
   * und eine Spalte über den Exportstatus nimmt es damit auf.
   *
   * Der Unterschied wird im Dienst gerechnet und nicht hier: Er verlangt beide
   * Zustände desselben Pools, und ein Vergleich über **Namen** ließe zwei
   * gleichnamige Pools füreinander einstehen.
   */
  readonly enteringPoolNames: readonly string[];
  /**
   * Namen der Pools, aus denen dieselbe Buchung das Todo **entfernt** (E-056).
   *
   * Die andere Hälfte derselben Auskunft, und aus demselben Grund aus dem
   * Dienst übernommen statt hier gerechnet. Fast immer leer — nur eine Regel,
   * die nach „Erledigt" fragt, kann ein Todo durch eine Buchung verlieren.
   */
  readonly leavingPoolNames: readonly string[];
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
  /** Pools, in denen das Todo nach der Buchung steht — beim Namen (I-05). */
  readonly poolNames: readonly string[];
  /**
   * Pools, in die diese Buchung es **hineinbewegt** hat — beim Namen (T-084).
   *
   * Teilmenge von `poolNames`. Leer heißt: Es steht danach in keinem Pool, in
   * dem es nicht schon vorher stand.
   */
  readonly enteringPoolNames: readonly string[];
  /** Pools, aus denen die Buchung es entfernt hat — beim Namen (E-056). */
  readonly leavingPoolNames: readonly string[];
}
