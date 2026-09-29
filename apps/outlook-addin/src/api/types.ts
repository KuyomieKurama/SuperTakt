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
 * Type-only imports from `@takt/domain` are allowed where the service returns a
 * domain shape without branded ids (`EmailAttachmentFailureReason`); `import type`
 * brings nothing into the bundle at runtime.
 */

import type { EmailAttachmentFailureReason } from '@takt/domain';

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
  readonly mailAssignment?: { readonly accepted: boolean };
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
  // No `poolMovement`: the add-in books nothing, so a match announces no movement (E-125 point 1).
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
  readonly dueTime?: string | null;
  readonly estimateMinutes?: number | null;
  readonly dueDate: string | null;
}

export interface CreateTodoResponseDto {
  readonly outcome?: 'created' | 'appended' | 'already_present';
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
   * `null`, wenn im Anlegeruf kein Anhang dabei war; **fehlt**, solange der
   * Dienst keine Anhänge annimmt. Für den Aufgabenbereich sind beide Fälle
   * derselbe: Es hängt keiner daran, und niemand hat etwas anderes behauptet.
   *
   * Die Zahl in der Erfolgsmeldung kommt aus dieser Antwort und nicht aus der
   * eigenen Zählung des Aufgabenbereichs: „3 Anhänge hängen daran" ist eine
   * Aussage über den Bestand, und über den Bestand weiß der Dienst Bescheid.
   * Was der Aufgabenbereich selbst weiß, sind die Anhänge, die es **nicht** bis
   * zum Anlegeruf geschafft haben — die kennt der Dienst nicht.
   */
  readonly attachments?: CreatedAttachmentsDto | null;
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
