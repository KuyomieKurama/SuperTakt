/**
 * Takt — die Gestalt der Antworten des lokalen Dienstes.
 *
 * Geschrieben gegen die **Umsetzung** in `apps/local-api/src/routes/**`, nicht
 * gegen `openapi/takt-local-api.yaml`. Die beiden weichen an mehreren Stellen
 * voneinander ab (Abfrageparameter, Umschlag der Listen, Gestalt der
 * Timer-Antworten); wer gegen die Beschreibung baut, bekommt zur Laufzeit
 * `undefined` statt eines Übersetzungsfehlers. Die Abweichungen sind im
 * Bericht zu T-022 einzeln aufgeführt.
 *
 * **Keine Fachlogik in dieser Datei.** Hier stehen ausschließlich Typen. Jede
 * Zahl, die in eine Abrechnung geht — Dauer, Viertelstunden, Tagesgruppe —
 * kommt fertig gerechnet aus `packages/domain` über den Dienst.
 *
 * Kennungen sind hier `string`. Die Domäne führt sie als gebrandete Typen
 * (`TodoId`, `TimeEntryId`, …); über die Leitung sind es Zeichenketten, und
 * die Oberfläche erzeugt keine davon selbst.
 */

import type { ExportStatus } from "../components/ExportStatus";
import type {
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolPlacement,
  RoundingMode,
  ThemeSetting,
  TimeEntrySource,
} from "../lib/labels";

export type {
  ExportStatus,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolPlacement,
  RoundingMode,
  ThemeSetting,
  TimeEntrySource,
};

/** UUID Fassung 7, als Zeichenkette. */
export type Id = string;
/** UTC, sekundengenau: `2026-03-02T09:00:00Z`. */
export type Timestamp = string;
/** Kalendertag ohne Zeitzone: `2026-03-02`. */
export type CalendarDay = string;

/* ==================================================================== */
/* Umschlag und Blätterung                                              */
/* ==================================================================== */

/** Jede erfolgreiche Antwort trägt genau ein Feld: `data`. */
export interface Envelope<T> {
  readonly data: T;
}

/**
 * Eine Seite. `nextCursor` ist undurchsichtig und wird nie selbst gebildet
 * (Fortsetzungsmarke statt Seitenzahl, T-021 Annahme 7).
 */
export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly total: number;
}

/* ==================================================================== */
/* Fehler                                                               */
/* ==================================================================== */

export interface ApiFieldError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * `code` ist der englische technische Schlüssel — die einzige Größe, gegen die
 * verzweigt wird. `message` ist der deutsche Anzeigetext des Dienstes und wird
 * unverändert gezeigt, nicht durch einen eigenen ersetzt.
 */
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: readonly ApiFieldError[];
}

export interface ErrorEnvelope {
  readonly error: ApiError;
  /** Beim Timerstart mit laufendem Timer (A-6.8). */
  readonly running?: RunningTimeEntry;
}

/* ==================================================================== */
/* Todos                                                                */
/* ==================================================================== */

/**
 * Ein Todo, wie der Dienst es liefert.
 *
 * **Was hier bewusst fehlt.** `boardRank`, der Sortierschlüssel innerhalb einer
 * Statusspalte aus der Zeit des Ziehens (A-5.2). Mit E-054 und Migration 0010
 * gibt es das Feld nicht mehr: Die Antwort führt es nicht, `TodoUpdate` nimmt
 * es nicht an, und keine Ansicht sortiert danach — die Ordnung einer Spalte
 * steht in `BoardScreen`.
 */
export interface Todo {
  readonly id: Id;
  readonly title: string;
  readonly callNumber: string | null;
  /**
   * Der Status als **Eigenschaft** des Todos (A-5.4).
   *
   * Seit E-054 ist er nicht mehr die Kanban-Spalte: Spalten sind Regeln über
   * Tags (siehe {@link Pool}). Geändert wird der Status in der Detailansicht
   * und in der Liste, nicht durch Verschieben auf dem Board.
   */
  readonly statusId: Id;
  /** `null` heißt aktiv, ein Zeitstempel heißt erledigt (A-2.4). */
  readonly completedAt: Timestamp | null;
  readonly tagIds: readonly Id[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/** `GET /todos/{id}` — das Todo samt seiner berechneten Summen, ohne Vermerk. */
export interface TodoDetail {
  readonly todo: Todo;
  readonly totalSeconds: number;
  /** Noch nicht exportierte Sekunden. */
  readonly openSeconds: number;
}

/** Der interne Vermerk (A-7.1, E-016). Eigene Ressource, eigener Aufruf. */
export interface TodoNote {
  readonly todoId: Id;
  readonly text: string;
  readonly updatedAt: Timestamp;
}

export interface TodoCreate {
  readonly title: string;
  readonly callNumber?: string | null;
  readonly statusId?: Id | null;
  readonly tagIds?: readonly Id[];
  /**
   * Tagnamen statt Kennungen — für Tags, die es noch nicht gibt (T-058).
   *
   * Der Dienst löst sie **in derselben Transaktion** auf, in der das Todo
   * entsteht: Ein Name, den es schon gibt, wird verwendet; einer, den es nicht
   * gibt, entsteht auf der Wurzelebene. Deshalb legt die Oberfläche neue Tags
   * nicht selbst an — wer den Dialog abbricht, hinterlässt sonst ein Tag ohne
   * Todo.
   */
  readonly tagNames?: readonly string[];
  readonly note?: string;
}

export interface TodoUpdate {
  readonly title?: string;
  readonly callNumber?: string | null;
  readonly statusId?: Id;
  readonly tagIds?: readonly Id[];
}

export interface TodoFilter {
  readonly search?: string;
  readonly callNumber?: string;
  readonly statusIds?: readonly Id[];
  readonly tagIds?: readonly Id[];
  readonly poolIds?: readonly Id[];
  /** Erledigte ausblenden (E-039). */
  readonly onlyOpen?: boolean;
  readonly onlyWithOpenEntries?: boolean;
}

/* ==================================================================== */
/* Status eines Todos (A-5.4, E-023, E-054)                              */
/* ==================================================================== */

/**
 * Ein Statuswert.
 *
 * **Keine Kanban-Spalte mehr.** Bis E-054 war beides dasselbe; seitdem ist eine
 * Spalte des Boards eine Regel (`Pool` mit `placement`), und der Status ist
 * eine Eigenschaft des Todos geblieben — eine von fünf Bedingungen, nach denen
 * eine Regel fragen kann (E-055), und keine Ablagefläche mehr. Verwaltet wird er im Bereich
 * „Status" der Einstellungen (`screens/StatusSettings.tsx`).
 *
 * Er trägt kein Merkmal, das ihn als „Erledigt" auswiese — Erledigt hängt am
 * Todo und an keinem Statuswert (E-023).
 */
export interface TodoStatus {
  readonly id: Id;
  readonly name: string;
  readonly position: number;
  readonly isDefault: boolean;
  readonly color: string | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/* ==================================================================== */
/* Tags, Ordner, Pools                                                  */
/* ==================================================================== */

export interface Tag {
  readonly id: Id;
  readonly folderId: Id | null;
  readonly name: string;
  readonly color: string | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface TagFolder {
  readonly id: Id;
  readonly parentId: Id | null;
  readonly name: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/** Beliebig tief (A-4.3). */
export interface TagFolderNode {
  readonly folder: TagFolder;
  readonly subfolders: readonly TagFolderNode[];
  readonly tags: readonly Tag[];
}

export interface TagTree {
  readonly rootFolders: readonly TagFolderNode[];
  readonly rootTags: readonly Tag[];
}

/**
 * Ein **Tagbestandteil** einer Regel: ein einzelnes Tag oder ein Ordner.
 *
 * Es gibt keinen Fall für den Status und keinen für „nicht" (T-076). Ein Term
 * mit Vorzeichen wäre Aussagenlogik im Datenmodell; stattdessen gibt es zwei
 * Listen derselben Terme — `rule` und `excludedTags` — und der Feldname sagt,
 * was gemeint ist.
 */
export type PoolRuleTerm =
  | { readonly kind: "tag"; readonly tagId: Id }
  | { readonly kind: "folder"; readonly folderId: Id };

/**
 * Eine benannte Regel — und seit E-054 zugleich die Bauform einer
 * **Kanban-Spalte**. Es gibt keine zweite Entität `BoardColumn`; was eine
 * Spalte von einem Pool unterscheidet, ist allein `placement`.
 *
 * ## Die Regel ist eine Struktur mit benannten Feldern, keine Liste (T-076)
 *
 * | Feld | Bedeutung | Neutralwert |
 * |---|---|---|
 * | `rule` + `matchMode` | erforderliche Tags: alle davon oder mindestens eines | `[]` |
 * | `excludedTags` | ausgeschlossene Tags: **keines** davon | `[]` |
 * | `statusIds` | Status: **einer** von diesen | `[]` = „Alle" |
 * | `completion` | Erledigt: alle / nur erledigte / nur unerledigte | `"any"` |
 * | `exportState` | Exportstatus: alle / mit offener / mit exportierter Buchung | `"any"` |
 *
 * **Zwischen** den Achsen gilt „und", jede engt weiter ein. Die Verknüpfung
 * folgt damit aus dem Feldnamen und nicht aus einem Und/Oder-Schalter:
 * „erforderlich" heißt und, „ausgeschlossen" heißt nicht (E-055).
 *
 * **Ein Neutralwert schränkt nicht ein — er trifft nicht alles.** Stehen alle
 * Achsen neutral, trifft die Regel **nichts** (A-3.4). Das ist der Zustand
 * unmittelbar nach dem Anlegen, und die Oberfläche sagt an jeder Fläche, dass
 * die Spalte leer bleibt, bis eine Bedingung dazukommt.
 */
/**
 * Was eine Regel **nach dem Auflösen** ihrer Ordner ergibt (T-080, E-057).
 *
 * Ein Ordnerterm nennt keinen Tag, sondern einen Ort. Wie viele Tags dort
 * liegen — mit `includeSubfolders` auch in allen Unterordnern, beliebig tief —
 * weiß ausschließlich der Dienst; er steigt dafür über den Ordnerbaum ab. Die
 * Oberfläche rechnet das nicht nach, sie liest die Zahl.
 *
 * **Wozu sie da ist.** Ohne sie sieht eine Regel, die einen leeren Ordner
 * nennt, genauso aus wie eine Regel, auf die gerade nichts passt. Das sind
 * zwei verschiedene Zustände: Der eine löst sich auf, sobald jemand ein
 * passendes Todo anlegt, der andere nie — er ist ein Einrichtungsfehler, und
 * nur der Benutzer kann ihn beheben. Erst mit dieser Auskunft lässt er sich
 * benennen (siehe `describeRuleReach` in `lib/poolRule.ts`).
 *
 * **Termweise, nicht achsenweise (T-082, T-087).** Die beiden Zahlen sind
 * Summen über eine ganze Achse und taugen deshalb **nicht** als Erkennung: Ein
 * leerer Ordner neben einem Tagterm lässt `tagCount` positiv und ist trotzdem
 * da. Gefragt wird deshalb `unresolvedRequired`, und **welcher** Ordner es ist,
 * sagt `emptyRuleFolderIds`.
 *
 * **Nicht enthalten: ob die Regel überhaupt eine Bedingung nennt.** Diese
 * Frage beantwortet `poolRuleIsEmpty` aus `@takt/domain` — für jeden, der die
 * Felder in der Hand hat, also auch für den Entwurf im Formular, den noch
 * keine Route gesehen hat.
 *
 * **Alle Felder sind Pflicht.** Ein freiwilliges Feld hieße `=== true` an jeder
 * Leserstelle, und damit schaltete sich die Wache selbst ab: Ein Dienst, der
 * die Auskunft eines Tages nicht mehr mitschickt, ließe die Oberfläche
 * stillschweigend die Antwort von vor E-057 zeichnen. Alle Antworten, aus denen
 * diese Oberfläche einen `Pool` bezieht, liefern sie mit (Schema
 * `PoolResolution` in `takt-local-api.yaml`, `required` mit sieben Feldern).
 */
export interface PoolResolution {
  /**
   * Wie viele Tags die **erforderliche** Liste (`rule`) ergibt.
   *
   * Eine **Summe über die Achse**: `0` bei nicht leerem `rule` heißt zwar „die
   * genannten Ordner enthalten kein Tag", ein positiver Wert heißt aber
   * **nicht**, dass alle Terme auflösen. Für die Erkennung eines leeren
   * Ordners ist `emptyRuleFolderIds` zuständig, nicht diese Zahl (E-057).
   */
  readonly tagCount: number;
  /** Dasselbe für die **ausgeschlossene** Liste (`excludedTags`). */
  readonly excludedTagCount: number;
  /**
   * Bleibt nach dem Auflösen **keine** Bedingung übrig?
   *
   * Seit E-057 **hinreichend, aber nicht notwendig** für „trifft nichts":
   * Steht neben dem leeren Ordner noch eine Statusachse, bleibt eine Bedingung
   * übrig, und die Regel trifft trotzdem nichts. Dieses Feld sagt, **warum**
   * nicht; ob überhaupt etwas kommen kann, sagt `matchesNothing`.
   */
  readonly isEmpty: boolean;
  /**
   * Nennt die **erforderliche** Liste (`rule`) einen Term, der auf keinen
   * einzigen Tag auflöst? (E-057)
   *
   * Das ist der Ordner ohne Tags, und **ein einziger genügt** — auch neben
   * einem Tagterm, der Tags beisteuert. Die Regel trifft dann nichts,
   * unabhängig von `matchMode` und den übrigen Achsen: Der Benutzer hat eine
   * Zugehörigkeit verlangt, die niemand hat.
   *
   * Für die Anzeige die **wichtigere** der beiden Auskünfte und deshalb vor
   * `isEmpty` zu lesen: „Der Ordner enthält kein Tag" ist ein anderer Satz —
   * und eine andere Handlung — als „diese Regel ist noch nicht eingerichtet".
   */
  readonly unresolvedRequired: boolean;
  /**
   * Dasselbe für die **ausgeschlossene** Liste — und **ohne** Folgen für die
   * Treffermenge (E-057).
   *
   * „Keiner davon" über nichts schließt nichts aus; ein Ausschluss über einen
   * leeren Ordner lässt in Ruhe, statt einzuengen. Die Oberfläche zeigt ihn
   * deshalb als **Hinweis** und nie als Warnung: Eine Warnung ohne Folge
   * glaubt beim nächsten Mal niemand mehr.
   */
  readonly unresolvedExcluded: boolean;
  /**
   * **Welche** erforderlichen Ordner keinen Tag enthalten (E-057).
   *
   * Der Unterschied zwischen „ein Ordner ist leer" und „der Ordner **Ost** ist
   * leer". In der Reihenfolge der Regel und ohne Doppelte — damit die
   * Oberfläche sie in derselben Folge nennt, in der sie im Formular stehen.
   *
   * Die Namen dazu stehen im Ordnerbaum, den die Oberfläche ohnehin lädt.
   * Ausgeschlossene Ordner stehen **nicht** darin: Aus ihnen folgt keine
   * Handlung.
   */
  readonly emptyRuleFolderIds: readonly Id[];
  /**
   * Trifft diese Regel von vornherein nichts? (A-3.4, E-057)
   *
   * Die zusammengefasste Antwort der Domäne (`poolRuleMatchesNothing`) über
   * den **gespeicherten** Stand: `isEmpty || unresolvedRequired`.
   *
   * Die Oberfläche liest sie bewusst **nicht als Ganzes**, sondern die beiden
   * Gründe einzeln — und zwar aus verschiedenen Quellen, weil sie von
   * Verschiedenem abhängen: `unresolvedRequired` hängt allein an den
   * Regeltermen und `includeSubfolders` und kommt deshalb von hier;
   * „nennt keine Bedingung" hängt an allen fünf Achsen und kommt aus
   * `poolRuleIsEmpty` über die Felder, die gerade im Formular stehen. Ein
   * Entwurf, der eine Statusachse ergänzt, ist eingerichtet — auch wenn der
   * gespeicherte Stand daneben noch `matchesNothing: true` sagt.
   */
  readonly matchesNothing: boolean;
}

export interface Pool {
  readonly id: Id;
  readonly name: string;
  /** Gilt **nur** für `rule`. Ausgeschlossene Tags sind immer „keines davon". */
  readonly matchMode: PoolMatchMode;
  readonly includeSubfolders: boolean;
  readonly placement: PoolPlacement;
  /** Reihenfolge, für beide Flächen dieselbe: Pool-Liste und Board. */
  readonly position: number;
  /** Die erforderlichen Tags und Ordner. */
  readonly rule: readonly PoolRuleTerm[];
  /** Die ausgeschlossenen Tags und Ordner (T-076). Keiner darf am Todo hängen. */
  readonly excludedTags: readonly PoolRuleTerm[];
  /** Die Status der Regel (T-076). Leer heißt „Alle" und schränkt nicht ein. */
  readonly statusIds: readonly Id[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
  /**
   * Die aufgelöste Regel (T-080). Pflicht, nicht freiwillig: Alle vier
   * Antworten, aus denen diese Oberfläche einen `Pool` bezieht — `GET /pools`,
   * `POST /pools`, `PATCH /pools/{id}` und `GET /board` —, liefern sie mit.
   * Ein freiwilliges Feld hieße, den Leerzustand mit einem Vielleicht zu
   * begründen.
   */
  readonly resolved: PoolResolution;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface PoolWrite {
  readonly name: string;
  readonly matchMode?: PoolMatchMode;
  readonly includeSubfolders?: boolean;
  /** Ohne Angabe legt der Dienst einen Pool an, keine Spalte. */
  readonly placement?: PoolPlacement;
  readonly position?: number;
  readonly rule: readonly PoolRuleTerm[];
  /**
   * Die vier Achsen aus T-076 sind alle weglassbar und stehen dann neutral.
   * Ein Aufrufer aus der Zeit davor legt damit dieselbe Regel an wie zuvor.
   */
  readonly excludedTags?: readonly PoolRuleTerm[];
  readonly statusIds?: readonly Id[];
  readonly completion?: PoolCompletionFilter;
  readonly exportState?: PoolExportFilter;
}

/**
 * Teiländerung einer Regel. Was fehlt, bleibt, wie es ist — auch die Regel
 * selbst. Genau das braucht der Wechsel des Anzeigeorts: Aus einem Pool wird
 * eine Spalte, ohne dass die Oberfläche die Regel noch einmal mitschicken und
 * dabei womöglich verkürzen muss.
 */
export type PoolPatch = Partial<PoolWrite>;

/**
 * Fragezeichenparameter von `GET /pools`. `all` ist keine Fläche, sondern der
 * Verzicht auf den Filter — und `both` ist hier kein zulässiger Wert: Eine
 * Regel mit `both` steht auf beiden Flächen und kommt in beiden Antworten vor.
 */
export type PoolSurfaceQuery = "pool" | "board" | "all";

/* ==================================================================== */
/* Kanban-Board (E-054)                                                 */
/* ==================================================================== */

/**
 * Eine Spalte mit ihrer ersten Seite.
 *
 * `column` ist ein vollständiger `Pool` samt Regel — damit die Ansicht sagen
 * kann, **warum** eine Karte hier steht, ohne sie nachzuladen. `total` zählt
 * alle Mitglieder, nicht die geladenen; weitergeblättert wird über
 * `GET /pools/{id}/todos` mit `nextCursor`.
 */
export interface BoardColumnView {
  readonly column: Pool;
  readonly todos: readonly Todo[];
  readonly nextCursor: string | null;
  readonly total: number;
}

/**
 * Dieselbe Karte in mehreren Spalten (E-054).
 *
 * Geliefert werden **nur** Karten in mehr als einer Spalte; `columnIds` steht
 * in der Reihenfolge der Spalten. Vor E-054 war dieser Fall ausgeschlossen,
 * seitdem ist er der Normalfall: Zwei zutreffende Regeln treffen beide zu.
 */
export interface BoardAppearance {
  readonly todoId: Id;
  readonly columnIds: readonly Id[];
}

/**
 * Das Board als **Ansicht**, nicht als Bestand.
 *
 * Es gibt nichts Gespeichertes, das diese Antwort wiedergäbe: Sie entsteht bei
 * jedem Aufruf neu aus den Regeln der Spalten und den Tags der Todos. Ein
 * leeres `columns` heißt „keine Spalte eingerichtet“ und nirgends „nichts zu
 * tun“ — nach der Umstellung ist das der Ausgangszustand.
 */
export interface BoardView {
  readonly columns: readonly BoardColumnView[];
  readonly appearances: readonly BoardAppearance[];
  readonly generatedAt: Timestamp;
}

/* ==================================================================== */
/* Zeitbuchungen und Timer                                              */
/* ==================================================================== */

export interface TimeEntry {
  readonly id: Id;
  readonly todoId: Id;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  readonly durationSeconds: number;
  /** Leistung (A-7.3, E-016). Geht in die Abrechnung. */
  readonly note: string;
  readonly exportStatus: ExportStatus;
  /**
   * `exportStatus === "open" && exportCount > 0` ist „schon einmal exportiert“
   * (R-10, E-032). Ein Anzeigemerkmal, **kein** dritter Status und niemals ein
   * Filterwert.
   */
  readonly exportCount: number;
  readonly source: TimeEntrySource;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/** Eine laufende Buchung: kein Ende, keine Dauer, nie exportierbar. */
export interface RunningTimeEntry {
  readonly id: Id;
  readonly todoId: Id;
  readonly startedAt: Timestamp;
  readonly note: string;
  readonly source: "timer";
}

export interface RunningTimerView {
  readonly entry: RunningTimeEntry;
  readonly todoTitle: string;
  /** Sekunden seit dem Start, zum Zeitpunkt der Anfrage. Vom Dienst gerechnet. */
  readonly elapsedSeconds: number;
}

/**
 * Zwei Ausgänge. `confirmation_required` ist **kein** Fehler, sondern der
 * vorgesehene erste Schritt (A-6.8, T-021 Annahme 9).
 */
export type StartTimerResult =
  | {
      readonly kind: "started";
      readonly started: RunningTimeEntry;
      readonly stopped: TimeEntry | null;
      /** A-2.5: war das Todo erledigt und ist durch den Start wieder aktiv? */
      readonly doneCleared: boolean;
    }
  | {
      readonly kind: "confirmation_required";
      readonly running: RunningTimeEntry;
      readonly runningTodoTitle: string;
    };

export type StopTimerResult =
  | { readonly kind: "recorded"; readonly entry: TimeEntry }
  | { readonly kind: "discarded"; readonly reason: "timer_too_short" };

export interface OrphanedTimerView {
  readonly running: RunningTimeEntry;
  readonly todoTitle: string;
  readonly heartbeatAt: Timestamp | null;
  /** Was gebucht würde, wenn „bis zum Lebenszeichen“ gewählt wird. */
  readonly bookableSeconds: number;
}

export type OrphanResolution = "book_until_heartbeat" | "discard";

export interface TimeEntryFilter {
  readonly todoId?: Id;
  readonly exportStatus?: ExportStatus;
  readonly fromDay?: CalendarDay;
  readonly toDay?: CalendarDay;
  /** R-10 — schon einmal exportierte, inzwischen offene Buchungen. */
  readonly onlyPreviouslyExported?: boolean;
}

/* ==================================================================== */
/* Export                                                               */
/* ==================================================================== */

export interface ExportTemplate {
  readonly id: Id;
  readonly name: string;
  readonly isBuiltin: boolean;
  readonly definition: unknown;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/* -------------------------------------------------------------------- */
/* Die Auswahlliste einer Vorlage (E-049)                               */
/* -------------------------------------------------------------------- */

/**
 * `GET /export/sources` — die geschlossene Auswahlliste als **Auskunft des
 * Dienstes** (E-017, E-049).
 *
 * Bis E-049 stand sie zweimal: einmal im Motor und ein zweites Mal in
 * `apps/web/src/lib/exportTemplateModel.ts`, weil die Oberfläche
 * `@takt/export` nicht einbinden darf und keine Route hatte, die sie hätte
 * fragen können. Sie war die fünfte und letzte Doppelung dieses Projekts.
 * Jetzt fragt die Oberfläche, statt zu wissen.
 *
 * Ohne Parameter, ohne Bestand, für jeden Aufruf dieselbe Antwort.
 */

/**
 * Ein Quellenpfad, wie er in `definition.fields[].source` steht.
 *
 * **Bewusst `string` und keine aufgeschriebene Vereinigung.** Welche Pfade es
 * gibt, sagt seit E-049 der Dienst zur Laufzeit; eine Vereinigung hier wäre
 * genau die Doppelung, die E-049 beseitigt hat. Geprüft wird deshalb nicht am
 * Übersetzer, sondern gegen die geholte Liste — `parseTemplateDefinition` in
 * `lib/exportTemplateModel.ts` weist alles ab, was nicht darauf steht, und die
 * Auswahllisten im Editor bieten nichts anderes an.
 *
 * Der Alias trägt trotzdem seinen Namen: Er sagt, **welcher** String hier
 * gemeint ist, und macht jede Stelle auffindbar, an der ein Quellenpfad durch
 * die Oberfläche läuft.
 */
export type ExportSourcePath = string;

/** Wert aus `EXPORT_TRANSFORMATIONS` des Motors. Englisch (E-015). */
export type ExportTransformation = string;

/** Vergleich einer Feldbedingung, etwa `is_set`. */
export type ExportConditionOperator = string;

/** Fachliche Ebene, aus der eine Quelle stammt. Nur zur Gliederung der Liste. */
export interface ExportSourceGroupInfo {
  readonly id: string;
  readonly label: string;
  /** Warum diese Ebene existiert. Steht als Erklärung über der Gruppe. */
  readonly hint: string;
}

export interface ExportSourceInfo {
  /** Der Wert, der in `definition.fields[].source` steht. Englisch (E-015). */
  readonly path: ExportSourcePath;
  readonly group: string;
  /** Deutsche Beschriftung in der Auswahlliste. */
  readonly label: string;
  /** Was diese Quelle liefert, in einem Satz. */
  readonly description: string;
}

export interface ExportTransformationInfo {
  readonly value: ExportTransformation;
  readonly label: string;
  /** Was die Transformation mit dem Wert macht, in einem Satz. */
  readonly effect: string;
}

export interface ExportConditionOperatorInfo {
  readonly value: ExportConditionOperator;
  readonly label: string;
}

export interface ExportSourceCatalog {
  readonly groups: readonly ExportSourceGroupInfo[];
  /** Alle wählbaren Quellen in Anzeigereihenfolge, nach `groups` sortiert. */
  readonly sources: readonly ExportSourceInfo[];
  readonly transformations: readonly ExportTransformationInfo[];
  readonly conditionOperators: readonly ExportConditionOperatorInfo[];
  /**
   * Der feste Satz unter der Quellenauswahl (A-7.2, T-005 Abschnitt 3.4).
   *
   * Er kommt mit der Liste, weil er eine Aussage über **diese** Liste ist:
   * Wer die Liste ausliefert, liefert auch die Begründung dafür, was nicht
   * darauf steht.
   */
  readonly noteBoundaryHint: string;
}

/** Ein Wert in einer Exportzeile. */
export type ExportValue = string | number | null;

/** Eine Exportzeile: genau die Felder der Vorlage, in ihrer Reihenfolge. */
export type ExportRow = Readonly<Record<string, ExportValue>>;

/**
 * Die Kenndaten der Tagesgruppe hinter einer Zeile (E-020, E-025).
 * `quarters` ist der gerundete Wert der **Gruppe**, nicht einer Buchung.
 */
export interface ExportGroupSummary {
  readonly todoId: Id;
  readonly day: CalendarDay;
  readonly seconds: number;
  readonly quarters: number | null;
  readonly entryCount: number;
  readonly timeEntryIds: readonly Id[];
  readonly previouslyExported: boolean;
}

/** Bisher nur ein Grund: die Gruppe hat keinen Leistungstext (E-034). */
export type ExportNotExportableReason = "empty_note";

/** Eine Tagesgruppe, die nicht in die Datei geht, den Lauf aber nicht aufhält. */
export interface SkippedExportGroup {
  readonly group: ExportGroupSummary;
  readonly reason: ExportNotExportableReason;
}

export interface ExportPreview {
  readonly rows: readonly ExportRow[];
  /**
   * Die Tagesgruppe zu jeder Zeile: `groups[i]` gehört zu `rows[i]`.
   *
   * **Seit T-030 geliefert, und damit ist die Gliederung wieder eine Sache der
   * Domäne.** Vorher bildete die Oberfläche sie selbst — sie entschied also,
   * welcher Kalendertag zu einer Buchung gehört, und das ist eine Regel
   * (E-025: der Tag des Timer**starts**). Falsch wäre sie ausgerechnet an der
   * Grenze gewesen, an der es weh tut: bei einer Buchung um 23:50, die über
   * Mitternacht läuft.
   *
   * Nicht exportierbare Gruppen stehen **nicht** hier, sondern in `skipped`
   * (gemessen). Wer alle Gruppen zeigen will, zeigt beide Listen.
   */
  readonly groups: readonly ExportGroupSummary[];
  /** E-034 — gehört in die Anzeige, sonst verschwindet Arbeitszeit lautlos. */
  readonly skipped: readonly SkippedExportGroup[];
  /** Anzahl **Buchungen**, nicht Zeilen. */
  readonly entryCount: number;
  readonly totalQuarters: number;
  readonly roundingMode: RoundingMode;
  readonly previouslyExportedCount: number;
  /**
   * Woher die Felddefinition kam (E-051).
   *
   * `stored` — eine gespeicherte Vorlage; `templateId` und `templateName` sind
   * belegt. `draft` — eine mitgeschickte, **nicht** gespeicherte Definition;
   * beide sind `null`, weil es sie nicht gibt.
   *
   * Der Dienst schreibt den Wert aus und leitet ihn nicht aus
   * `templateId === null` ab. Eine Vorschau, die den gezeigten Stand nur
   * andeutet, ist genau die Mehrdeutigkeit, die S-14 vorher mit dem Hinweis
   * „zeigt den gespeicherten Stand" überdecken musste.
   */
  readonly templateSource: "stored" | "draft";
  /** `null` im Entwurfsfall — eine ungespeicherte Vorlage hat keine Kennung. */
  readonly templateId: Id | null;
  /** `null` im Entwurfsfall. */
  readonly templateName: string | null;
}

export interface ExportRunGroup {
  readonly id: Id;
  readonly exportRunId: Id;
  readonly todoId: Id;
  readonly day: CalendarDay;
  readonly seconds: number;
  readonly quarters: number;
  readonly timeEntryIds?: readonly Id[];
}

export interface ExportRun {
  readonly id: Id;
  readonly templateId: Id;
  readonly filePath: string;
  readonly fileSha256: string;
  readonly bytes: number;
  readonly entryCount: number;
  readonly totalQuarters: number;
  readonly roundingMode: RoundingMode;
  readonly windowsUser?: string;
  /**
   * **Vom Dienst heute nicht geliefert.** Die Beschreibung führt das Feld, die
   * Antwort von `POST /export/runs` enthält es nicht (nachgemessen gegen den
   * laufenden Dienst). Die Oberfläche verlässt sich deshalb nicht darauf: Die
   * Zahl der geschriebenen Zeilen kommt aus der Vorschau, mit der derselbe
   * Lauf ausgelöst wurde — dieselbe Rechnung (R-17), nur eine Sekunde früher.
   */
  readonly groups?: readonly ExportRunGroup[];
  /** Die beim Lauf verwendete Vorlage, festgehalten. Wird hier nicht gelesen. */
  readonly templateSnapshot?: unknown;
  readonly createdAt: Timestamp;
}

/** `POST /export/runs` — der Lauf **und** was er ausgelassen hat (E-034). */
export interface ExportRunResult {
  readonly run: ExportRun;
  readonly skipped: readonly SkippedExportGroup[];
}

export interface ExportAuditEntry {
  readonly id: Id;
  readonly timeEntryId: Id;
  /** `not_billed` seit E-047: ausgebucht, ohne dass eine Datei entstand. */
  readonly event: "exported" | "reset" | "not_billed";
  readonly previousStatus: ExportStatus;
  readonly newStatus: ExportStatus;
  readonly exportRunId: Id | null;
  readonly exportRunGroupId: Id | null;
  readonly actor: string;
  readonly reason: string;
  readonly occurredAt: Timestamp;
}

/* ==================================================================== */
/* Einstellungen                                                        */
/* ==================================================================== */

export interface AppSettings {
  /** `null` heißt: noch nicht gewählt, Export nicht möglich (E-011). */
  readonly exportDirectory: string | null;
  readonly activeExportTemplateId: Id | null;
  readonly roundingMode: RoundingMode;
  readonly locale: string;
  readonly theme: ThemeSetting;
  readonly updatedAt: Timestamp;
}

export interface AppSettingsUpdate {
  readonly exportDirectory?: string | null;
  readonly activeExportTemplateId?: Id | null;
  readonly roundingMode?: RoundingMode;
  readonly locale?: string;
  readonly theme?: ThemeSetting;
}

export interface DefaultTag {
  readonly tagId: Id;
  readonly position: number;
}

/**
 * Zustand des Exportordners **jetzt** (R-11), nicht beim Einstellen.
 *
 * Der Ordner ist Benutzereingabe und kann zwischen zwei Läufen verschwinden
 * oder schreibgeschützt werden. Deshalb prüft der Dienst ihn bei jedem Abruf
 * neu — und die Oberfläche zeigt das Ergebnis, statt „nicht gesetzt“ zu
 * vermuten, wenn in Wahrheit die Rechte fehlen.
 */
export type ExportDirectoryState =
  | "ok"
  | "not_set"
  | "missing"
  | "not_writable"
  | "not_a_directory"
  /**
   * Der Ordner hat innerhalb des Zeitbudgets von drei Sekunden **nicht
   * geantwortet** (T-039).
   *
   * Das ist ausdrücklich nicht `missing`: „gibt es nicht" schickt den Benutzer
   * zum Neueintragen, „antwortet nicht" zum Netzlaufwerk. Ein abwesender
   * Ordner ist belegt; ein schweigender ist es nicht.
   */
  | "unreachable";

/**
 * Ein am Exportordner **belegter** Befund (T-039, B-5.2, B-5.3 Punkt 3).
 *
 *   `unc`          Netzfreigabe in UNC-Schreibweise. Aus der Form sicher.
 *   `network`      Netzdateisystem, belegt über die Art des Dateisystems.
 *   `sync_folder`  Ablageordner eines Synchronisierungsdienstes, wie dessen
 *                  Client ihn der Umgebung meldet — auch nach Umbenennung.
 *   `system_dir`   Systemverzeichnis, wie das Betriebssystem es selbst
 *                  benennt. Auch wenn Windows nicht auf `C:` liegt.
 *
 * **Eine leere Liste ist keine Entwarnung.** Ein zugeordnetes Netzlaufwerk
 * (`Z:`) steht weder im Pfad noch in einer Auskunft, die der Dienst bekommt —
 * dafür bräuchte es `GetDriveTypeW`. Wer aus „nichts gefunden" ein „alles in
 * Ordnung" macht, behauptet etwas, das niemand geprüft hat, und zwar
 * ausgerechnet in dem Fall, vor dem gewarnt werden soll.
 */
export type ExportDirectoryTrait = "unc" | "network" | "sync_folder" | "system_dir";

/**
 * `GET /settings` liefert **nicht** `AppSettings`, sondern diese Sicht.
 *
 * Die Beschreibung in `openapi/takt-local-api.yaml` sagt etwas anderes; die
 * Umsetzung (`loadSettings` in `usecases/structure.ts`) gilt. Gegen die
 * Beschreibung gebaut bekäme man `undefined` statt eines Übersetzungsfehlers.
 */
export interface SettingsView {
  readonly settings: AppSettings;
  readonly exportDirectoryState: ExportDirectoryState;
  /**
   * Was am eingestellten Ordner belegbar ist. Leer heißt „nichts belegt",
   * nicht „unbedenklich" — siehe `ExportDirectoryTrait`.
   *
   * Steht unabhängig vom Zustand: Ein Systemverzeichnis bleibt eines, ob
   * dorthin geschrieben werden darf oder nicht. Nur nach `unreachable` bleibt
   * `network` aus, weil dafür genau das Dateisystem hätte antworten müssen,
   * an dem die Prüfung abgebrochen wurde.
   */
  readonly exportDirectoryTraits: readonly ExportDirectoryTrait[];
  readonly defaultTags: readonly DefaultTag[];
  /**
   * Unter welchem Namen abgerechnet wird (E-010, E-042, C-20).
   *
   * Dieser Name steht in **jeder Zeile jeder Exportdatei**. Er ist keine
   * Einstellung und steht deshalb neben `settings` und nicht darin: Er kommt
   * über die zweite `stdin`-Zeile von der Hülle und ist über keine Route
   * setzbar (B-8.1).
   *
   * **Warum die Anzeige zu der Absicherung gehört.** E-042 nimmt den Namen
   * ausdrücklich nicht aus der Umgebungsvariablen — sonst genügte
   * `set USERNAME=fremder && Takt.exe`, um fremde Arbeitszeit unter eigenem
   * Namen abzurechnen. Diese ganze Absicherung ist wertlos, wenn niemand
   * nachsehen kann, welcher Name tatsächlich verwendet wird. Bis T-042 stand
   * er nur in `ExportRun.windowsUser` — also erst **nach** dem ersten Export,
   * im Protokoll. Der Moment, in dem man ihn wissen will, liegt davor.
   */
  readonly windowsUser: string;
  /**
   * Wo der Bestand liegt (E-018, R-13). `null` bei einem Bestand im
   * Arbeitsspeicher — im Prüfbetrieb und auf der Musterseite.
   *
   * Auskunft, keine Einstellung: Der Pfad entsteht aus dem
   * Anwendungsdatenverzeichnis und ist über keine Route verstellbar (B-1.6
   * Punkt 1). Über Synchronisierungsordner ist viel entschieden worden — für
   * die Datei mit den Kundendaten selbst konnte bisher niemand nachsehen, wo
   * sie liegt.
   *
   * **Kein Widerspruch zu B-2.4.** Dort geht es um Pfade in
   * *Fehlermeldungen*, die auch an einen Aufrufer gehen, der sie nicht
   * bekommen soll. Hier ist es eine erfragte Auskunft hinter dem
   * Sitzungsgeheimnis, das ausschließlich die Hülle hat, und derselbe Rumpf
   * führt mit `settings.exportDirectory` bereits einen Pfad desselben
   * Rechners.
   *
   * Die Oberfläche legt den Pfad in `lib/databaseLocationAdvice.ts` aus. Anders
   * als beim Exportordner belegt der Dienst zu dieser Datei **keine** Merkmale;
   * kein Befund heißt deshalb nur „im Pfad steht nichts".
   */
  readonly databasePath: string | null;
}

/**
 * `POST /todos` liefert **nicht** das Todo allein.
 *
 * `addedDefaultTagIds` nennt die Tags, die der Dienst nach A-9.5 ergänzt hat.
 * Sie gehören in die Rückmeldung: Der Benutzer hat sie nicht gewählt, und ein
 * Tag, der ungefragt erscheint, gehört ausgesprochen.
 */
export interface TodoCreated {
  readonly todo: Todo;
  readonly addedDefaultTagIds: readonly Id[];
  /**
   * Welche Tags durch `tagNames` neu entstanden sind (T-058).
   *
   * Vollständige Tags und nicht nur Kennungen, damit die Oberfläche den neuen
   * Namen sofort nennen kann, ohne den Baum erneut zu holen. Ältere
   * Dienststände liefern das Feld nicht — dann ist es `undefined`, und die
   * Ansicht sagt einfach nichts darüber.
   */
  readonly createdTags?: readonly Tag[];
}

/* ==================================================================== */
/* Suche (E-038)                                                        */
/* ==================================================================== */

export interface SearchResult {
  readonly todos: Page<Todo>;
  /** Getroffen über den Leistungstext. Der Vermerk ist kein Suchfeld (A-7.1). */
  readonly timeEntries: readonly TimeEntry[];
}

/* ==================================================================== */
/* Zugriff und Zustand                                                  */
/* ==================================================================== */

export interface TokenStatus {
  readonly configured: boolean;
  readonly issuedAt: Timestamp | null;
  readonly lastUsedAt: Timestamp | null;
  readonly generation: number;
  readonly unreadable: boolean;
}

export interface IssuedToken {
  readonly token: string;
  readonly issuedAt: Timestamp;
  readonly generation: number;
}

export type SecurityNoticeKind =
  | "auth_failure_burst"
  | "token_in_url"
  | "origin_rejected"
  | "host_rejected"
  | "file_permissions_wide";

export interface SecurityNotice {
  readonly kind: SecurityNoticeKind;
  readonly count: number;
  readonly firstAt: Timestamp;
  readonly lastAt: Timestamp;
}
