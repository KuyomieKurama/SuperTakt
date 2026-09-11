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

import type { EmailAttachmentFailureReason, PoolMovement } from '@takt/domain';

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

/**
 * **Daß** dieser Dienst Anhänge aus einer E-Mail annimmt (A-19.22, E-108).
 *
 * ---------------------------------------------------------------------------
 * Ein Feld, nicht drei Zahlen (T-304)
 * ---------------------------------------------------------------------------
 *
 * In T-300 trug dieser Block die drei Grenzen aus A-A-81. Sie stehen jetzt in
 * `packages/domain` und werden von dort gelesen (`TAKEOVER_LIMITS` in
 * `attachments/model.ts`): Eine Grenze ist eine Fachregel, und eine Fachregel
 * über zwei Wege zu verteilen ist die Gelegenheit, sie verschieden zu ändern.
 *
 * Was **hier** stehen muß und nirgends sonst stehen kann, ist die Auskunft
 * über den laufenden Dienst: Add-in und Dienst werden getrennt installiert und
 * können auseinanderlaufen. Ein neuer Aufgabenbereich an einem älteren Dienst
 * sammelte sonst Anhänge ein, deren Tür das Feld nicht liest — und verlöre sie
 * still (A-19.31, E-100 Punkt 3).
 *
 * Deshalb bleibt der Block optional und deshalb ist er die Naht: Fehlt er,
 * **bietet der Aufgabenbereich die Übernahme gar nicht an**. Kein Satz
 * verspricht dann etwas, was hinterher nicht geschieht.
 */
export interface EmailAttachmentSupportDto {
  /** `true` heißt: `POST /addin/todos` liest das Feld `attachments`. */
  readonly accepted: boolean;
}

export interface AddinContextDto {
  readonly tagTree: TagTreeDto;
  readonly pools: readonly PoolDto[];
  readonly statuses: readonly TodoStatusDto[];
  readonly defaultStatusId: string;
  /** Standard-Tags aus A-9.1, in ihrer konfigurierten Reihenfolge. */
  readonly defaultTagIds: readonly string[];
  /**
   * Fehlt, solange der Dienst keine Anhänge aus dem Add-in annimmt.
   *
   * `?` und nicht `| null`: Unter `exactOptionalPropertyTypes` ist „das Feld
   * fehlt" etwas anderes als „es ist `null`", und hier ist genau das Erste
   * gemeint — ein älterer Dienst weiß von diesem Feld nichts.
   */
  readonly emailAttachments?: EmailAttachmentSupportDto;
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
  /**
   * Die **Frist**, so wie der Dienst sie abgelegt hat (A-19.21, T-149).
   *
   * Sie steht in der Antwort, weil sie im Bestand steht — der Umschlag trägt
   * `Todo`, und `Todo` führt sie seit T-146. Der Aufgabenbereich **zeigt** sie
   * in der Erfolgsmeldung nicht: Der Benutzer hat sie eben eingetragen, und
   * eine Bestätigung dessen, was gerade im Feld darüber stand, sagt ihm
   * nichts, was er nicht wüßte. Anders als bei `createdTags`, wo die
   * Schreibweise aus der Antwort und nicht aus dem Eingabefeld kommt, gibt es
   * hier nichts, was der Dienst anders entschieden haben könnte.
   *
   * Der **Zustand** (überfällig, heute fällig, später fällig) steht bewußt
   * nicht hier und wird auch nicht geliefert: Er wird gerechnet und nie
   * gespeichert (E-070 Punkt 3). Rechnen würde ihn `dueState` aus
   * `@takt/domain`; das tut die Hauptanwendung, weil dort die Liste steht,
   * die er ordnet. Der Aufgabenbereich hat keine Liste.
   */
  readonly dueDate: string | null;
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
  /**
   * Was der Dienst von den mitgeschickten Anhängen **tatsächlich** abgelegt
   * hat (A-19.29, A-19.33).
   *
   * Fehlt, solange der Dienst keine Anhänge annimmt. Die Zahl in der
   * Erfolgsmeldung kommt aus dieser Antwort und nicht aus der eigenen Zählung
   * des Aufgabenbereichs: „3 Anhänge hängen daran" ist eine Aussage über den
   * Bestand, und über den Bestand weiß der Dienst Bescheid. Was der
   * Aufgabenbereich selbst weiß, sind die Anhänge, die es **nicht** bis zum
   * Anlegeruf geschafft haben — die kennt der Dienst nicht.
   */
  readonly attachments?: CreatedAttachmentsDto;
}

export interface CreatedAttachmentsDto {
  /** Wie viele Anhänge am Todo hängen. */
  readonly stored: number;
  /**
   * Welche der mitgeschickten der Dienst abgewiesen hat, in der Reihenfolge des
   * Rufs — **mit Grund** (A-19.29).
   *
   * Der Grund ist eine der acht Kennungen der Domäne
   * (`EmailAttachmentFailureReason`); der Satz dazu entsteht hier, in
   * `attachments/reasons.ts`. Ein Freitext des Dienstes stünde an dieser Stelle
   * als fremder Satz in einer Fläche, die sonst nur eigene zeigt (AB-3).
   *
   * `bytes` ist gesetzt, wo der Grund eine Größe nennt (`too_large`), sonst
   * `null`. Sie ist **gemessen** und nicht angekündigt (A-A-81).
   *
   * **Kein Pfad.** Der Dienst kennt für jede abgelegte Datei den vollen Pfad im
   * Anwendungsdatenverzeichnis; er steht ausdrücklich nicht in dieser Antwort.
   * Ein Pfad ist eine Ortsangabe über **einen** Rechner (Befund T-301) und
   * gehört in die Hauptanwendung, die ihn vor dem Öffnen nennen muß — nicht in
   * ein Browsersteuerelement innerhalb von Outlook.
   */
  readonly rejected: readonly {
    readonly displayName: string;
    readonly reason: EmailAttachmentFailureReason;
    readonly bytes: number | null;
  }[];
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
