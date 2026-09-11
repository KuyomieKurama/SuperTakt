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

import type { PoolMovement, DesignTheme, Density } from "@takt/domain";
import type { ExportStatus } from "../shared/ui/ExportStatus";
import type {
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolPlacement,
  RoundingMode,
  ThemeSetting,
  TimeEntrySource,
} from "../lib/labels";

/**
 * `PoolMovement` kommt **unmittelbar** aus `@takt/domain` und nicht über
 * `lib/labels.ts` wie die Aufzählungen daneben (E-058).
 *
 * Der Unterschied ist kein Zufall: `lib/labels.ts` gibt es, weil eine
 * Aufzählung eine deutsche **Beschriftung** braucht, die die Domäne nicht
 * kennt. `PoolMovement` braucht keine — der Satz dazu kommt fertig aus
 * derselben Domäne (`poolMovementSentence`), und die Oberfläche hat an drei
 * Namenslisten nichts zu beschriften. Ein Umweg über `labels.ts` wäre die
 * Einladung, dort doch eine zweite Fassung des Satzes abzulegen.
 */
export type {
  ExportStatus,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolMovement,
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
/* Herkunft als Typ (E-063, T-129)                                      */
/* ==================================================================== */

/**
 * **Warum hier keine Zeichenkette mehr bloß `string` heißt.**
 *
 * Seit T-124 geht fremder Text vor der Anzeige durch `shared/ui/Foreign.tsx`,
 * `quotedName` oder `foreignText`. Der Bericht dazu nennt die Schwäche dieser
 * Lösung selbst (R3): Sitzt die Behandlung im Anzeigebaustein, ist sie an der
 * Aufrufstelle **unsichtbar**. Wer morgen eine weitere Stelle baut und den
 * Baustein vergisst, bekommt keinen Übersetzungsfehler und keinen roten Test —
 * für gewöhnliche Namen ist jede dieser Behandlungen die Identität.
 *
 * Die Antwort darauf steht hier: Die **Herkunft** eines Textes ist keine
 * Verabredung im Kopf des Entwicklers, sondern eine Eigenschaft seines Typs.
 * `ForeignText` trägt eine Marke, die der Übersetzer durch Zuweisungen,
 * Zerlegungen, Felder und Parameter mitführt — und `scripts/proof-foreign.mjs`
 * fragt ihn danach, statt eine Liste von Feldnamen abzuschreiben. Eine
 * abgeschriebene Liste ist der Fehler, den E-063 Punkt 4 benennt; sie kann nur
 * hinterherhinken.
 *
 * **Kein Feld dieser Datei heißt darum noch bloß `string`.** Das ist die zweite
 * Hälfte des Nachweises: Ein neues Feld zwingt zu einer Entscheidung, statt
 * stillschweigend als „nicht fremd" zu gelten. Der Nachweis liest diese Datei
 * und wird rot, sobald irgendwo wieder ein nacktes `string` steht.
 */

/**
 * Text, den **jemand anderes** geschrieben hat und den der Dienst nur
 * ausliefert: Titel und Vermerk eines Todos, die Leistung einer Buchung, die
 * Namen von Tags, Ordnern, Pools, Status und Exportvorlagen, die Call-Nummer,
 * der Windows-Benutzername.
 *
 * Vor der Anzeige gehört er durch `<Foreign>`, `quotedName` oder `foreignText`
 * (E-063 Punkt 1 und 2). Die Marke ist **freiwillig und leer** — sie ändert
 * nichts an der Zuweisbarkeit und nichts zur Laufzeit; sie ist ausschließlich
 * dafür da, dass der Nachweis die Herkunft sehen kann.
 */
export type ForeignText = string & { readonly __foreignText?: undefined };

/**
 * Was der Benutzer **dieser** Oberfläche gerade selbst schreibt oder abschickt:
 * der Inhalt eines Eingabefeldes, ein Suchbegriff, der Rumpf einer Anfrage.
 *
 * Er wird **nicht** behandelt. Den Inhalt eines Eingabefeldes zu verändern
 * hieße, die Eingabe des Benutzers zu verändern — und sie ginge verändert
 * zurück in die Datenbank (E-063 Punkt 1).
 */
export type DraftText = string & { readonly __draftText?: undefined };

/**
 * Deutscher Anzeigetext, den **unser eigener** Dienst geliefert hat: die
 * Meldung zu einem Fehler, die Beschriftung einer Exportquelle, der Satz unter
 * der Quellenauswahl.
 *
 * Er ist nicht fremd. `visibleText` darauf wäre die Identität, und der Aufruf
 * behauptete eine Herkunft, die es nicht gibt.
 */
export type ServiceText = string;

/** Ein englischer technischer Schlüssel: `code`, `field`, Gruppenkennung, Sprachkennzeichen. */
export type TechnicalKey = string;

/**
 * Ein Pfad aus dem Dateisystem. Nicht fremd im Sinne von E-063, aber auch nicht
 * unsere Beschriftung: Er wird nach eigenen Regeln geprüft
 * (`lib/pathInspection.ts`) und nicht nach der Zeichenklasse für Namen.
 */
export type FileSystemPath = string;

/** Ein Farbwert, wie ihn der Dienst führt: `#1f6feb`. */
export type ColorValue = string;

/** Die undurchsichtige Fortsetzungsmarke einer Liste. Wird nie selbst gebildet. */
export type PageCursor = string;

/** Ein Geheimnis. Steht in keiner Anzeige und in keinem Protokoll. */
export type SecretText = string;

/**
 * Bytes, die der Dienst **bereits kodiert** ausliefert: das Vorschaubild eines
 * Bildanhangs, Base64 (A-19.13, E-071 Punkt 3).
 *
 * **Kein Anzeigetext.** Er geht in ein `src` und nie in einen Satz, nie in ein
 * `title`, nie in ein `aria-label`. `visibleText` darauf wäre sinnlos — es gibt
 * nichts sichtbar zu machen —, und `<Foreign>` darum wäre eine Zeichenkette von
 * einigen Megabyte im Textknoten.
 *
 * **Warum er hier einen eigenen Namen bekommt.** Weil er sonst `ForeignText`
 * hieße und der Nachweis an jeder Verwendung eine Behandlung einforderte, die
 * es für Bytes nicht gibt — oder `string`, und dann wäre er unsichtbar. Ein
 * eigener Name zwingt an jeder neuen Stelle zu derselben Entscheidung, die hier
 * getroffen ist (E-063 Punkt 4).
 *
 * **Kodiert wird er nicht in der Oberfläche.** Base64 ist A-8.4 und liegt in
 * der Domäne; die Oberfläche setzt aus `mediaType` und diesem Wert eine
 * `data:`-Adresse zusammen und rechnet dabei nichts.
 */
export type EncodedBytes = string;

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
  readonly nextCursor: PageCursor | null;
  readonly total: number;
}

/* ==================================================================== */
/* Fehler                                                               */
/* ==================================================================== */

/**
 * Ein einzelner Befund in `error.details`.
 *
 * `name` ist der **bloße** Name des benannten Dings — „Ost“, nicht
 * „Regel „Ost““, ohne Gattungswort und ohne Anführungszeichen (W-11 aus R-2a,
 * geliefert seit T-107 von `poolReference` in `packages/storage`). Es ist
 * freiwillig, und das ist eine Aussage und keine Lücke: Ein Befund über ein
 * **Eingabefeld** hat nichts zu benennen und trägt deshalb keinen Namen. Es
 * gibt auch keinen leeren Namen — fehlt der Name, fehlt das Feld.
 *
 * Wer `name` liest, muss `undefined` behandeln und dann `message` nehmen; das
 * ist der beschriebene Vertragsfall und kein stiller Rückfall. Die eine Stelle,
 * die das tut, ist `lib/errorText.ts`.
 */
export interface ApiFieldError {
  readonly field: TechnicalKey;
  readonly message: ServiceText;
  readonly code: TechnicalKey;
  readonly name?: ForeignText;
}

/**
 * `code` ist der englische technische Schlüssel — die einzige Größe, gegen die
 * verzweigt wird. `message` ist der deutsche Anzeigetext des Dienstes und wird
 * unverändert gezeigt, nicht durch einen eigenen ersetzt.
 */
export interface ApiError {
  readonly code: TechnicalKey;
  readonly message: ServiceText;
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
  readonly title: ForeignText;
  readonly callNumber: ForeignText | null;
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
  /**
   * Die **Frist** (A-19.1 bis A-19.7, E-070). `null` heißt: keine, und das ist
   * in jeder Hinsicht ein gültiges Todo.
   *
   * **Ein Tag, keine Uhrzeit** (E-070 Punkt 1), und es ist derselbe Tagesbegriff
   * wie bei der Tagesgruppierung des Exports (E-070 Punkt 2, E-025). Die drei
   * Zustände — überfällig, heute fällig, später fällig — stehen **nicht** hier:
   * Sie werden gerechnet, nicht gespeichert (E-070 Punkt 3), sonst wären sie
   * über Nacht falsch, ohne dass jemand etwas angefasst hat. Die Rechnung steht
   * in `lib/deadline.ts`.
   *
   * **Keine Achse** (E-070 Punkt 4, A-19.7): nicht in Pools, nicht in Spalten,
   * nicht im Export (A-19.17). Sortieren und Filtern der Liste sind Anzeige und
   * etwas anderes als ein Regelterm (E-074 Punkt 1).
   */
  readonly dueDate: CalendarDay | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
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
 * „Status" der Einstellungen (`features/settings/StatusSettings.tsx`).
 *
 * Er trägt kein Merkmal, das ihn als „Erledigt" auswiese — Erledigt hängt am
 * Todo und an keinem Statuswert (E-023).
 */
export interface TodoStatus {
  readonly id: Id;
  readonly name: ForeignText;
  readonly position: number;
  readonly isDefault: boolean;
  readonly color: ColorValue | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/* ==================================================================== */
/* Tags, Ordner, Pools                                                  */
/* ==================================================================== */

export interface Tag {
  readonly id: Id;
  readonly folderId: Id | null;
  readonly name: ForeignText;
  readonly color: ColorValue | null;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface TagFolder {
  readonly id: Id;
  readonly parentId: Id | null;
  readonly name: ForeignText;
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
  readonly name: ForeignText;
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
  readonly name: DraftText;
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
/* Zeitbuchungen und Timer                                              */
/* ==================================================================== */

export interface TimeEntry {
  readonly id: Id;
  readonly todoId: Id;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  readonly durationSeconds: number;
  /** Leistung (A-7.3, E-016). Geht in die Abrechnung. */
  readonly note: ForeignText;
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
  readonly note: ForeignText;
  readonly source: "timer";
}

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
  readonly name: ForeignText;
  readonly isBuiltin: boolean;
  readonly definition: unknown;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/** Ein Wert in einer Exportzeile. */
export type ExportValue = ForeignText | number | null;

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
  readonly templateName: ForeignText | null;
}

/* ==================================================================== */
/* Einstellungen                                                        */
/* ==================================================================== */

export interface AppSettings {
  /** `null` heißt: noch nicht gewählt, Export nicht möglich (E-011). */
  readonly exportDirectory: FileSystemPath | null;
  readonly activeExportTemplateId: Id | null;
  readonly roundingMode: RoundingMode;
  readonly locale: TechnicalKey;
  readonly theme: ThemeSetting;
  readonly designTheme: DesignTheme;
  readonly density: Density;
  readonly promptOnTimerStop: boolean;
  readonly idleDetectionEnabled: boolean;
  readonly idleKeepTimerRunning: boolean;
  readonly idleThresholdMinutes: number;
  /**
   * Die übersprungene Fassung der Versionsprüfung (A-18.10, R-20). `null`
   * heißt: nichts übersprungen.
   *
   * **Fremder Text, obwohl er wie eine Zahl aussieht.** Der Wert stammt
   * ursprünglich aus der Antwort von GitHub und liegt seitdem im Bestand, wo
   * jeder Prozess mit dem Sitzungsgeheimnis ihn ändern kann (T-136-4, VG-6).
   * Die Oberfläche **zeigt** ihn nirgends an; sie reicht ihn allein an
   * `decideUpdateNotice` in `@takt/domain` weiter, und dort entscheidet die
   * Formprüfung, ob er überhaupt etwas bedeutet. Ein unbrauchbarer Wert heißt
   * „nichts übersprungen" und führt zu keinem Wurf.
   *
   * Ohne führendes `v`, wie jede Fassung nach der Domäne (E-066 Punkt 3).
   */
  readonly skippedVersion: ForeignText | null;
  readonly updatedAt: Timestamp;
}

export interface AppSettingsUpdate {
  readonly exportDirectory?: FileSystemPath | null;
  readonly activeExportTemplateId?: Id | null;
  readonly roundingMode?: RoundingMode;
  readonly locale?: TechnicalKey;
  readonly theme?: ThemeSetting;
  readonly designTheme?: DesignTheme;
  readonly density?: Density;
  readonly promptOnTimerStop?: boolean;
  readonly idleDetectionEnabled?: boolean;
  readonly idleKeepTimerRunning?: boolean;
  readonly idleThresholdMinutes?: number;
  /**
   * `null` setzt „nichts übersprungen" zurück, ein Wert überspringt genau
   * diese eine Fassung — nicht die Prüfung (E-064 Punkt 5).
   *
   * Geschrieben wird ausschließlich die Fassung, über die
   * `decideUpdateNotice` gerade entschieden hat. Damit steht im Bestand
   * dieselbe Schreibweise, die im Dialog stand.
   */
  readonly skippedVersion?: ForeignText | null;
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
  readonly windowsUser: ForeignText;
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
   * Die Oberfläche legt den Pfad in `features/settings/databaseLocationAdvice.ts` aus. Anders
   * als beim Exportordner belegt der Dienst zu dieser Datei **keine** Merkmale;
   * kein Befund heißt deshalb nur „im Pfad steht nichts".
   */
  readonly databasePath: FileSystemPath | null;
}

/* ==================================================================== */
/* Suche (E-038)                                                        */
/* ==================================================================== */

export interface SearchResult {
  readonly todos: Page<Todo>;
  /** Getroffen über den Leistungstext. Der Vermerk ist kein Suchfeld (A-7.1). */
  readonly timeEntries: readonly TimeEntry[];
}
