/**
 * Takt — Tags, Tag-Ordner und Pools (A-3.*, A-4.*, A-9.*).
 */

import type {
  PoolId,
  Result,
  StatusId,
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
 * Ein Tagbestandteil einer Regel: ein einzelnes Tag (A-3.2) oder ein Ordner,
 * dessen Tags zählen — mit `Pool.includeSubfolders` auch die seiner
 * Unterordner, beliebig tief (A-3.3). Genau eines von beidem.
 *
 * Beide lösen sich zur **selben** Größe auf: einer Menge von Tagkennungen, die
 * über `todo_tag` am Todo hängen. Ein Ordnerterm ist deshalb nur eine bequeme
 * Schreibweise für „diese Tags"; wer die Regel auswertet, sieht am Ende eine
 * Tagmenge und keinen Ordner mehr.
 *
 * Deshalb steht hier **kein** dritter Fall für den Status. Der Status ist keine
 * Tagmenge: Er steht als `todo.status_id` an der Zeile, genau einer je Todo,
 * nie keiner und nie zwei. Er ist eine eigene Achse der Regel und hat ein
 * eigenes Feld — siehe {@link Pool}.
 */
export type PoolTagTerm =
  | { readonly kind: 'tag'; readonly tagId: TagId }
  | { readonly kind: 'folder'; readonly folderId: TagFolderId };

/**
 * Der Name aus der Zeit, als eine Regel **nur** aus solchen Termen bestand.
 *
 * Derselbe Typ, nicht ein zweiter daneben. Er bleibt stehen, weil an ihm
 * Aufrufer in fremder Hoheit hängen (`apps/web`, die Prüfpfade); wer neu
 * schreibt, nimmt {@link PoolTagTerm}, weil der Name sagt, was der Term
 * bezeichnet.
 */
export type PoolRuleTerm = PoolTagTerm;

/**
 * Wie die **erforderlichen** Tags einer Regel verknüpft sind (A-3.2, T-076).
 *
 *   `any` — das Todo trägt mindestens eines davon. **Vorgabe**, und der Wert
 *           jeder Regel, die vor T-076 ohne ausdrückliche Wahl entstand.
 *   `all` — das Todo trägt alle davon.
 *
 * Gilt für **keine andere Achse**: Ausgeschlossene Tags sind immer „keines
 * davon", Status immer „einer von diesen". Ein `matchMode` an einer der beiden
 * wäre eine Wahl ohne Bedeutung.
 *
 * **Warum das ein benannter Typ ist** (T-091 Frage 1, T-093). `'any' | 'all'`
 * stand ausgeschrieben an fünf Stellen in vier Paketen — in der Domäne zweimal,
 * in der Speicherung, im lokalen Dienst und in der Oberfläche, die daraus ihre
 * Beschriftungen ableitet. Fünf Abschriften derselben Aufzählung sind fünf
 * Gelegenheiten, eine dritte Verknüpfungsart an vier Stellen zu ergänzen und an
 * der fünften zu vergessen. Der Name macht daraus eine Quelle: Wer sie
 * erweitert, bekommt überall dort einen Übersetzerfehler, wo die Fälle
 * aufgezählt werden.
 */
export type PoolMatchMode = 'any' | 'all';

/**
 * Die Erledigt-Achse einer Regel (A-2.4, E-023, T-076).
 *
 *   `any`  — Erledigt spielt für die Zugehörigkeit keine Rolle. Neutralwert.
 *   `open` — nur unerledigte Todos.
 *   `done` — nur erledigte Todos.
 *
 * **Nicht zu verwechseln mit dem Status** (A-5.3). „Erledigt" ist
 * `todo.completed_at` und hängt an keinem Status; ein Todo kann „Done" tragen
 * und unerledigt sein und umgekehrt. Die beiden Achsen sind seit E-023
 * getrennt und bleiben es.
 *
 * **Nicht zu verwechseln mit `includeCompleted`** (E-039). Diese Achse
 * entscheidet über **Zugehörigkeit**, jene über **Sichtbarkeit**: `any` heißt
 * „die Regel sagt dazu nichts", und dann entscheidet die Ansicht wie bisher.
 * Sagt die Regel etwas, hat sie das letzte Wort — sonst wäre eine Spalte
 * „Erledigt" in der Vorgabeansicht dauerhaft leer.
 */
export type PoolCompletionFilter = 'any' | 'done' | 'open';

/**
 * Die Exportstatus-Achse einer Regel (E-032, T-076).
 *
 *   `any`      — der Exportstatus spielt keine Rolle. Neutralwert.
 *   `open`     — das Todo hat mindestens eine **abgeschlossene, offene**
 *                Buchung. Das ist „was habe ich noch nicht abgerechnet".
 *   `exported` — das Todo hat mindestens eine exportierte Buchung.
 *
 * Der Exportstatus ist eine Eigenschaft der **Buchung**, nicht des Todos
 * (E-032: zweiwertig, nie leer). Ein Todo hat viele Buchungen; die Achse fragt
 * deshalb nach dem Vorhandensein, nicht nach einem Zustand des Todos.
 *
 * **Warum `exported` nicht „vollständig abgerechnet" heißt.** Das wäre die
 * andere denkbare Lesart, und sie wäre nicht die Umkehrung von `open`, sondern
 * deren Verneinung — ein Todo mit einer offenen und einer exportierten Buchung
 * fiele dann durch beide Raster. So wie es hier steht, steht es in beiden
 * Spalten, und das ist die richtige Antwort: Beides trifft zu. Es ist genau
 * derselbe Fall, den E-054 auf dem Board zum Normalfall gemacht hat.
 *
 * Ein Todo **ohne jede Buchung** erfüllt weder `open` noch `exported`. Es
 * steht damit nur in Spalten, deren Regel diese Achse offenlässt — richtig, denn
 * abzurechnen gibt es an ihm nichts.
 */
export type PoolExportFilter = 'any' | 'open' | 'exported';

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
 * ---------------------------------------------------------------------------
 * Die Regel ist eine Struktur mit benannten Feldern, keine Liste (T-076)
 * ---------------------------------------------------------------------------
 *
 * Bis T-076 war die Regel **eine** Liste gleichartiger Terme, und wie mehrere
 * davon verknüpft sind, stand nirgends — man musste es erklären. Seitdem hat
 * jede Bedingung ihr eigenes Feld, und die Verknüpfung folgt aus dem Feldnamen:
 *
 * | Feld | Bedeutung | Neutralwert |
 * |---|---|---|
 * | `rule` + `matchMode` | erforderliche Tags: alle (`all`) oder mindestens eines (`any`) | leere Liste |
 * | `excludedTags` | ausgeschlossene Tags: **keines** davon darf am Todo hängen | leere Liste |
 * | `statusIds` | Status: **einer** von diesen | leere Liste = „Alle" |
 * | `completion` | Erledigt: alle / nur erledigte / nur unerledigte | `any` |
 * | `exportState` | Exportstatus: alle / mit offener / mit exportierter Buchung | `any` |
 *
 * **Die Felder sind mit „und" verbunden**, jedes einzelne engt weiter ein. Das
 * ist keine Wahl, die man treffen und anders treffen könnte: Ein „oder"
 * zwischen „erforderliche Tags" und „ausgeschlossene Tags" wäre sinnlos, und
 * eine zusätzlich genannte Bedingung, die das Ergebnis **vergrößert**, wäre in
 * jeder Ansicht eine Überraschung.
 *
 * **Innerhalb** eines Feldes steht die Verknüpfung am Feld: `matchMode` für die
 * erforderlichen Tags, „keines davon" für die ausgeschlossenen, „einer von
 * diesen" für die Status. Für die Status ist das keine Entscheidung, sondern
 * eine Tatsache: `todo.status_id` trägt genau einen Wert, ein „alle davon"
 * über zwei Status wäre nicht streng, sondern unerfüllbar.
 *
 * **Alle Felder neutral heißt weiterhin: die Regel trifft nichts** (A-3.4).
 * Nicht „alle null Bedingungen sind erfüllt": Eine Regel, die noch nicht
 * eingerichtet ist, hätte sonst schlagartig jedes Todo der Datenbank als
 * Mitglied.
 *
 * **Was das an E-054 nicht ändert.** Status und Kanban-Spalte bleiben
 * getrennt. Eine Spalte wird durch `statusIds` nicht wieder zum Status: Sie
 * kann mehrere Status umfassen, keinen, oder Status und Tags mischen, und
 * dieselbe Karte kann weiterhin in mehreren Spalten stehen.
 *
 * ---------------------------------------------------------------------------
 * `extends PoolRuleAxes` — die fünf Achsen stehen nicht zufällig hier (T-080)
 * ---------------------------------------------------------------------------
 *
 * {@link PoolRuleAxes} ist die Aufzählung der Achsen, auf der die Frage „nennt
 * diese Regel überhaupt eine Bedingung?" beruht. Das `extends` hält beide
 * aneinander: Wer hier ein Achsenfeld umbenennt oder entfernt, bekommt einen
 * Übersetzerfehler, statt eine Regel zu hinterlassen, deren Leere niemand mehr
 * richtig beantwortet.
 *
 * Die Felder stehen unten trotzdem ausgeschrieben. Sie sind dort **enger**
 * getippt — Terme statt `unknown` — und tragen ihre Begründung; geerbt wird
 * die Aufzählung, nicht die Beschreibung.
 */
export interface Pool extends PoolRuleAxes {
  readonly id: PoolId;
  readonly name: string;
  /**
   * Wie die **erforderlichen** Tags (`rule`) verknüpft sind.
   *
   *   `any` — das Todo trägt mindestens eines davon. **Vorgabe**, und der Wert
   *           jeder Regel, die vor T-076 ohne ausdrückliche Wahl entstand.
   *   `all` — das Todo trägt alle davon.
   *
   * Gilt ausschließlich für `rule`. Die ausgeschlossenen Tags sind immer
   * „keines davon", die Status immer „einer von diesen".
   */
  readonly matchMode: PoolMatchMode;
  /**
   * Bei Termen der Art `folder` zählen auch die Tags in dessen Unterordnern,
   * beliebig tief. Gilt für **beide** Taglisten — eine getrennte Tiefe je
   * Liste wäre eine zweite Wahrheit über denselben Baum.
   */
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
  /**
   * Die **erforderlichen** Tags (A-3.2, A-3.3). Leer heißt: Diese Achse
   * schränkt nicht ein.
   *
   * Das Feld heißt seit T-009 `rule` — aus der Zeit, als es die ganze Regel
   * war. Der Name bleibt, weil ein Umbenennen Aufrufer in fremder Hoheit bräche
   * (`apps/web`, die Prüfpfade) und die Aussage nicht verbesserte: Was das Feld
   * bedeutet, steht hier, und `excludedTags` daneben macht es unübersehbar.
   * Der Umbau auf `requiredTags` gehört in eine Aufgabe, die alle Aufrufer
   * zugleich anfasst.
   */
  readonly rule: readonly PoolTagTerm[];
  /**
   * **Ausgeschlossene** Tags (T-076). Trägt das Todo eines davon, gehört es
   * nicht dazu — ganz gleich, was die übrigen Felder sagen.
   *
   * Das ist die Bedingung, die eine Liste gleichartiger Terme nicht ausdrücken
   * konnte: Sie hat keinen Platz für „nicht". Deshalb eine zweite Liste und
   * kein Term mit einem Vorzeichen.
   */
  readonly excludedTags: readonly PoolTagTerm[];
  /**
   * Status, von denen das Todo **einen** tragen muss (T-076). Leer heißt
   * „Alle" — die Achse schränkt dann nicht ein.
   *
   * Mehrere sind ausdrücklich zulässig: Eine Spalte soll mehrere Status
   * umfassen können (E-054). Ein „alle davon" gibt es hier nicht, siehe
   * `matchMode`.
   */
  readonly statusIds: readonly StatusId[];
  /** Die Erledigt-Achse (T-076). Siehe {@link PoolCompletionFilter}. */
  readonly completion: PoolCompletionFilter;
  /** Die Exportstatus-Achse (T-076). Siehe {@link PoolExportFilter}. */
  readonly exportState: PoolExportFilter;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Gehört ein Todo in diesen Pool? — die Regel als reine Funktion.
 *
 * Rein und ohne laufenden Dienst prüfbar. Die beiden Tagmengen kommen bereits
 * **aufgelöst** herein, einschließlich der Tags aus Unterordnern; das Auflösen
 * ist Aufgabe des Ports, weil dafür der Baum gebraucht wird.
 *
 * ---------------------------------------------------------------------------
 * Die Verknüpfung steht in der Feldstruktur, nicht in einer Erklärung (T-076)
 * ---------------------------------------------------------------------------
 *
 * Fünf Achsen, jede mit einem Neutralwert, alle mit „und" verbunden. Die
 * vollständige Begründung steht an {@link Pool}; hier nur, was das für die
 * Auswertung heißt:
 *
 *  1. Jede Achse, die auf ihrem Neutralwert steht, wird **übersprungen**. Eine
 *     Regel, die nur Tags nennt, ist damit Zeichen für Zeichen das, was sie vor
 *     T-076 war — der Grund, warum keine bestehende Regel ihre Bedeutung
 *     ändert.
 *  2. Jede Achse, die etwas sagt, kann nur **ablehnen**. Deshalb ist die
 *     Reihenfolge der Prüfungen unten gleichgültig und deshalb wird eine
 *     zusätzlich gesetzte Bedingung das Ergebnis nie vergrößern.
 *  3. Stehen **alle** Achsen neutral, trifft die Regel **nichts** (A-3.4).
 *     Das ist der eine Fall, den Punkt 1 und 2 zusammen nicht ergeben, und er
 *     ist eine fachliche Entscheidung: Eine Regel, die noch nicht eingerichtet
 *     ist, hätte sonst jedes Todo der Datenbank als Mitglied.
 *  4. **Ein erforderlicher Term, der ins Leere zeigt, läßt ebenfalls nichts
 *     treffen** (E-057). Der Ausnahmefall zu Punkt 1: Eine leere Tagmenge ist
 *     der Neutralwert — aber nur, wenn die Regel wirklich nichts genannt hat.
 *     Kommt sie aus einem Ordner, in dem kein Tag liegt, ist sie eine
 *     Einschränkung ohne Treffer, und dann trifft die ganze Regel nichts —
 *     auch dann, wenn daneben ein Tagterm steht, der Tags beisteuert. Ob das so
 *     ist, sagt `unresolvedRequired`; die Tagmenge allein kann es nicht sagen.
 *
 * ---------------------------------------------------------------------------
 * Warum die Felder der Achsen freiwillig sind — und eines nicht
 * ---------------------------------------------------------------------------
 *
 * Damit jeder Aufrufer aus der Zeit vor T-076 unverändert dieselbe Antwort
 * bekommt: Was er nicht nennt, steht neutral, und dann verhält sich die
 * Funktion wie zuvor.
 *
 * Die Ausnahme ist `unresolvedRequired` (E-057): keine Achse, sondern eine
 * Auskunft über eine bereits genannte. Schweigen hieße dort nicht „neutral",
 * sondern „zu weit" — und niemand würde rot. Die Begründung steht am Feld.
 *
 * Jedes dieser Felder nimmt ausdrücklich auch `undefined` an und nicht nur das
 * Fehlen (`?: T | undefined`). Der Grund ist der Aufrufer: Wer eine Karte aus
 * einer Liste durchreicht, hat die Werte in der Hand und weiß nicht, welche
 * davon gesetzt sind. Ohne diesen Zusatz müsste er unter
 * `exactOptionalPropertyTypes` acht Felder einzeln wegkürzen — acht
 * Verzweigungen, die nichts entscheiden und alle mitgeprüft werden wollen.
 * Fehlend und `undefined` bedeuten hier dasselbe, und das steht damit im Typ.
 *
 * Die Angaben über die **Karte** — Status, Erledigt-Zeitpunkt, Vorhandensein
 * von Buchungen — fehlen, wenn der Aufrufer sie nicht kennt. Dann trifft eine
 * Regel, die danach fragt, **nicht**. Die Antwort fällt zu, nicht auf: Eine
 * Zugehörigkeit zu behaupten, deren Bedingung man nicht geprüft hat, wäre die
 * schlechtere der beiden Richtungen.
 *
 * Nicht zu verwechseln: `completion` entscheidet über **Zugehörigkeit**,
 * `isVisibleInPool` über **Sichtbarkeit**. Steht `completion` neutral, weiß
 * diese Funktion vom Erledigt-Kennzeichen so wenig wie vor T-076, und A-2.5
 * gilt unverändert.
 */
export type MatchesPool = (input: MatchesPoolRule & MatchesPoolCandidate) => boolean;

/**
 * Die **Regelseite** der Eingabe von {@link MatchesPool} — aufgelöst.
 *
 * Getrennt von der Kartenseite und nicht als ein Objektliteral im
 * Funktionstyp, seit T-080. Der Grund ist nicht Ordnungsliebe: Über diese
 * Felder läuft die Aufzählung der Achsen, und nur weil sie einen Namen haben,
 * kann `tsc` verlangen, dass jedes von ihnen einer Achse zugeordnet ist
 * ({@link POOL_RULE_AXIS_OF_FIELD}). Wer hier ein Feld ergänzt, bekommt einen
 * Fehler, bis er gesagt hat, welche Achse es füllt.
 *
 * Die Feldnamen tragen `rule`/`todo` im Namen, weil beide Hälften zusammen als
 * **ein** Argument hereinkommen: `completedAt` gehört der Karte, `completion`
 * der Regel, und ohne die Vorsilbe stünden `statusIds` zweimal da.
 */
export interface MatchesPoolRule {
  /** Die **erforderlichen** Tags der Regel, aufgelöst. Leer: schränkt nicht ein. */
  readonly ruleTagIds: readonly TagId[];
  /** Wie `ruleTagIds` verknüpft ist. Gilt für keine andere Achse. */
  readonly matchMode: PoolMatchMode;
  /** Die **ausgeschlossenen** Tags der Regel, aufgelöst. Leer: schränkt nicht ein. */
  readonly excludedTagIds?: readonly TagId[] | undefined;
  /** Die Status der Regel. Leer oder weggelassen heißt „Alle". */
  readonly ruleStatusIds?: readonly StatusId[] | undefined;
  /** Die Erledigt-Achse der Regel. Weggelassen ist `any`. */
  readonly completion?: PoolCompletionFilter | undefined;
  /** Die Exportstatus-Achse der Regel. Weggelassen ist `any`. */
  readonly exportState?: PoolExportFilter | undefined;
  /**
   * Nennt die **erforderliche** Tagachse Terme, von denen keiner auf einen Tag
   * auflöst? (E-057)
   *
   * Der Fall ist der Ordner, in dem kein Tag liegt — **ein einziger genügt**,
   * auch wenn daneben ein Tagterm steht und `ruleTagIds` deshalb gefüllt ist
   * (E-057, termweise). Steht der leere Ordner allein, ist `ruleTagIds` leer —
   * und eine leere Tagliste ist der **Neutralwert** dieser Achse, also dasselbe,
   * was ein Aufrufer schickt, der über Tags gar nichts sagen wollte. Genau
   * diese zwei Zustände sind verschieden und sehen gleich aus:
   *
   *   „keine Tagbedingung"        → die Achse schränkt nicht ein
   *   „Tagbedingung ohne Treffer" → die **Regel** trifft nichts (E-057)
   *
   * Deshalb steht die Unterscheidung hier als eigenes Feld und nicht in
   * `ruleTagIds`: Die aufgelöste Liste kann sie nicht tragen, sie ist in beiden
   * Fällen `[]`. Wer auflöst, weiß es; wer nur die Menge weiterreicht, nicht
   * mehr. {@link tagAxisIsUnresolved} beantwortet es an genau einer Stelle,
   * {@link resolvePool} liefert die Antwort mit.
   *
   * ---------------------------------------------------------------------------
   * **Pflicht**, und das ist der Kern der Sache
   * ---------------------------------------------------------------------------
   *
   * Das einzige Feld der Regelseite, das nicht weggelassen werden darf — die
   * übrigen sind freiwillig, damit ein Aufrufer aus der Zeit vor T-076
   * unverändert dieselbe Antwort bekommt.
   *
   * Hier gilt das Gegenteil, weil dieses Feld keine **Bedingung** ist, sondern
   * eine Auskunft über eine Bedingung, die der Aufrufer bereits genannt hat.
   * `matchesPool` überspringt, was es nicht genannt bekommt; ein freiwilliges
   * Feld hieße also: Wer schweigt, bekommt die zu weite Antwort von vor E-057 —
   * und **niemand wird rot**. Genau so ist der Fehler aus T-078 entstanden, bei
   * dem der Aufgabenbereich Pools nannte, die die Hauptanwendung nicht führt.
   * Die Wache dagegen ist der Übersetzer und nicht die Sorgfalt: Wer
   * `matchesPool` ruft, sagt, ob die erforderlichen Terme aufgelöst sind.
   *
   * Wer die Antwort nicht hat, holt sie beim Port: `PoolPort.resolveAxes`
   * liefert zu jeder Achse die Tags **und** die Ordner, aus denen nichts
   * geworden ist. Aus einer flachen Tagmenge (`resolveRule`) ist sie nicht zu
   * gewinnen — das ist der ganze Punkt von E-057.
   */
  readonly unresolvedRequired: boolean;
}

/**
 * Die **Kartenseite** der Eingabe von {@link MatchesPool}.
 *
 * Alles außer den Tags ist freiwillig, und was fehlt, lässt eine Achse, die
 * danach fragt, **nicht** treffen. Die Begründung steht an {@link MatchesPool}.
 */
export interface MatchesPoolCandidate {
  readonly todoTagIds: readonly TagId[];
  /**
   * Der Status der Karte. Jedes Todo trägt genau einen (`todo.status_id` ist
   * NOT NULL); `null` oder weggelassen heißt „dieser Aufrufer kennt ihn nicht",
   * nicht „diese Karte hat keinen".
   */
  readonly todoStatusId?: StatusId | null | undefined;
  /** `null` bedeutet unerledigt (A-2.4). Weggelassen: dem Aufrufer unbekannt. */
  readonly completedAt?: Timestamp | null | undefined;
  /** Hat die Karte mindestens eine abgeschlossene, offene Buchung? */
  readonly hasOpenEntries?: boolean | undefined;
  /** Hat die Karte mindestens eine exportierte Buchung? */
  readonly hasExportedEntries?: boolean | undefined;
}

/**
 * Die fünf Achsen einer Regel, so weit die Frage „nennt diese Regel überhaupt
 * eine Bedingung?" sie liest (T-080).
 *
 * ---------------------------------------------------------------------------
 * Warum die drei Listen `readonly unknown[]` sind
 * ---------------------------------------------------------------------------
 *
 * Weil dieselbe Frage an **zwei** Gestalten derselben Regel gestellt wird und
 * die Antwort beide Male dieselbe sein muss:
 *
 *   **gespeichert** — `rule` und `excludedTags` sind Terme ({@link PoolTagTerm}),
 *   ein Ordnerterm steht darin für beliebig viele Tags. Das ist die Gestalt in
 *   der Datenbank, in der Antwort des Dienstes und im Formular der Oberfläche,
 *   auch für einen Entwurf, den noch niemand gespeichert hat.
 *
 *   **aufgelöst** — dieselben Felder tragen Tagkennungen, die Ordner sind zu
 *   ihren Tags geworden. Das ist die Gestalt, in der `matchesPool` und die
 *   Abfrage in SQL urteilen.
 *
 * Gezählt wird beide Male die **Länge**, und mehr liest diese Frage von den
 * Listen nicht. Ein engerer Typ hätte zwei Fassungen der Funktion erzwungen —
 * und zwei Fassungen sind genau das, was T-080 beseitigt. `readonly unknown[]`
 * und nicht `{ length: number }`: Eine Zeichenkette hat auch eine Länge, ist
 * hier aber nie gemeint.
 *
 * Die Feldnamen sind die des gespeicherten Pools und die der Schnittstelle
 * (`rule`, `excludedTags`, `statusIds`, `completion`, `exportState`). Ein
 * `Pool` erfüllt diesen Typ deshalb unverändert, und die Oberfläche kann ihren
 * Formularentwurf ohne Umbau hineinreichen.
 *
 * **Kein Feld ist freiwillig.** Das ist die ganze Absicherung: Jede Stelle,
 * die diese Frage stellt, nennt alle Achsen ausdrücklich. Kommt eine sechste
 * dazu, wird jede dieser Stellen rot — die Tabelle unten, `matchesPool`, die
 * Übersetzung nach SQL in `packages/storage` und die Auflösung im Dienst.
 *
 * **Wie weit „jede dieser Stellen" reicht** (T-089). Der Satz galt für die
 * Stellen, die dieses Gebilde zusammensetzen; er galt **nicht** für die
 * Aufrufer von {@link matchesPool}, die sich ihre Regelseite selbst aus
 * eigenen Feldern bauten. Zwei taten das: `BoardColumnRule` in `board.ts` und
 * der Auflöser des Add-in-Dienstes. Beide hätten eine sechste Achse
 * stillschweigend übersprungen — R-1 hat es gemessen. `BoardColumnRule` erbt
 * seine Regelseite deshalb seit T-089 von {@link MatchesPoolRule}, statt sie
 * abzuschreiben. Wer einen weiteren Aufrufer schreibt, hält es genauso: Die
 * Regelseite wird geerbt oder durchgereicht, nicht nachgebaut.
 */
export interface PoolRuleAxes {
  /** Erforderliche Tags — Terme oder aufgelöste Tagkennungen. */
  readonly rule: readonly unknown[];
  /** Ausgeschlossene Tags — Terme oder aufgelöste Tagkennungen. */
  readonly excludedTags: readonly unknown[];
  /** Status: einer von diesen. Leer heißt „Alle". */
  readonly statusIds: readonly unknown[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
}

/** Der Name einer Achse — zugleich der Feldname am `Pool` und in der Schnittstelle. */
export type PoolRuleAxisId = keyof PoolRuleAxes;

/**
 * Dieselben Achsen, **nachdem** die Ordner aufgelöst sind (E-057).
 *
 * Der Unterschied zu {@link PoolRuleAxes} ist eine einzige Auskunft, die sich
 * beim Auflösen verliert: **was aus den einzelnen erforderlichen Termen
 * geworden ist.** Danach steht dort eine Tagmenge — eine leere sieht aus wie
 * „nicht genannt", ist aber „genannt und ohne Treffer", und eine gefüllte
 * verschweigt, daß einer der Terme nichts beigetragen hat.
 *
 * `unresolvedRequired` ist **Pflicht**. Das ist der Zweck dieses Typs: Wer eine
 * aufgelöste Regel beurteilen will ({@link poolRuleMatchesNothing}), muß die
 * Frage beantworten, statt sie zu übergehen. Die Übersetzung nach SQL in
 * `packages/storage` und die Auflösung im Dienst werden damit rot, wenn sie die
 * Auskunft nicht durchreichen — und genau dort ist die Regel bis E-057 still
 * verschwunden.
 *
 * Für die **ausgeschlossene** Achse gibt es hier bewußt kein Gegenstück. Sie
 * braucht keines: Ein Ausschluß über einen leeren Ordner schließt nichts aus,
 * und das ist Zeichen für Zeichen dasselbe wie „nicht genannt". Nur die
 * erforderliche Achse kennt den Unterschied.
 */
export interface ResolvedPoolRuleAxes extends PoolRuleAxes {
  /**
   * Nennt die erforderliche Tagachse Terme, von denen keiner auf einen Tag
   * auflöst? Siehe {@link tagAxisIsUnresolved}.
   */
  readonly unresolvedRequired: boolean;
}

/**
 * Was eine Regel nach dem Auflösen ihrer Ordner ergibt (T-080).
 *
 * Der Grund, warum das über die Leitung geht: Die Oberfläche kann eine Regel
 * ohne Bedingung selbst erkennen — die Felder liegen ihr vor —, aber sie kann
 * nicht wissen, ob in einem genannten Ordner überhaupt ein Tag liegt. Ohne
 * diese Auskunft sieht ein leerer Ordner aus wie eine Regel ohne Treffer, und
 * das sind zwei verschiedene Zustände: Der eine löst sich morgen von selbst,
 * der andere nie.
 */
export interface PoolResolution {
  /** Wie viele Tags die **erforderliche** Liste ergibt, Unterordner eingerechnet. */
  readonly tagCount: number;
  /** Dasselbe für die **ausgeschlossene** Liste. */
  readonly excludedTagCount: number;
  /**
   * Bleibt nach dem Auflösen **keine** Bedingung übrig?
   *
   * Nicht dasselbe wie `poolRuleIsEmpty` über die gespeicherte Regel: Eine
   * Regel, die nur einen leeren Ordner nennt, nennt eine Bedingung und hat nach
   * dem Auflösen keine mehr.
   *
   * Ist dieser Wert `true`, trifft die Regel nichts. Seit E-057 ist das
   * **hinreichend und nicht mehr notwendig**: Eine Regel „Tags aus dem leeren
   * Ordner **und** Status offen" hat nach dem Auflösen noch die Statusachse,
   * ist hier also `false` — und trifft trotzdem nichts. Die vollständige
   * Antwort auf „trifft diese Regel überhaupt etwas?" steht in
   * {@link PoolResolution.matchesNothing}; dieses Feld unterscheidet, **warum**
   * nicht.
   */
  readonly isEmpty: boolean;
  /**
   * Nennt die **erforderliche** Achse Terme, von denen keiner auf einen Tag
   * auflöst? (E-057)
   *
   * Das ist der leere Ordner in der Liste „muß eines davon tragen". Die Regel
   * trifft damit nichts, unabhängig vom Modus und von den übrigen Achsen: Der
   * Benutzer hat eine Einschränkung ausgesprochen, und die erfüllt niemand.
   *
   * Für die Oberfläche ist es die Auskunft, die den Satz trägt: „Der Ordner
   * enthält keinen Tag" ist etwas anderes als „im Augenblick paßt nichts" — der
   * eine Zustand löst sich von selbst, der andere nie. Sie geht deshalb vor
   * `isEmpty`, wenn beide gesetzt sind (die Regel nennt nur den leeren Ordner):
   * „richte die Regel ein" wäre dort die falsche Auskunft, sie **ist**
   * eingerichtet.
   */
  readonly unresolvedRequired: boolean;
  /**
   * Dasselbe für die **ausgeschlossene** Achse (E-057).
   *
   * Und hier **ohne** Folgen für die Treffermenge: „keiner davon" über nichts
   * schließt nichts aus, es läßt in Ruhe. Die Zahl steht trotzdem da, weil ein
   * Ausschluß, der nicht wirkt, eine Auskunft wert ist — sichtbar gemacht,
   * nicht zur Bedingung erhoben.
   */
  readonly unresolvedExcluded: boolean;
  /**
   * **Welche** erforderlichen Ordner keinen Tag enthalten (E-057).
   *
   * Der Unterschied zwischen „ein Ordner ist leer" und „der Ordner **Ost** ist
   * leer" — und der Grund, warum diese Liste über die Leitung geht: Die
   * Oberfläche hat die Ordnerkennungen aus der Regel, aber sie kann nicht
   * wissen, in welchem davon ein Tag liegt. Die Ordnerrekursion dafür ein
   * zweites Mal zu schreiben wäre die Doppelung, die T-080 beseitigt hat.
   *
   * Leer heißt: kein erforderlicher Ordnerterm zeigt ins Leere. Nicht leer
   * heißt: `unresolvedRequired` ist `true` und die Regel trifft nichts.
   *
   * **Ausgeschlossene Ordner stehen nicht darin.** Ein leerer Ordner in der
   * Ausschlußliste ist kein Fehler; er schließt nichts aus und läßt alles, wie
   * es ist. Ob es ihn gibt, sagt `unresolvedExcluded` — ohne Namen, weil daraus
   * keine Handlung folgt.
   */
  readonly emptyRuleFolderIds: readonly TagFolderId[];
  /**
   * Trifft diese Regel von vornherein nichts? (A-3.4, E-057)
   *
   * Die eine Frage, die die Oberfläche wirklich stellt, und die einzige, deren
   * Antwort sie nicht selbst zusammensetzen soll: `isEmpty || unresolvedRequired`
   * wäre die sechste Fassung derselben Bedingung. Sie kommt aus
   * {@link poolRuleMatchesNothing} — derselben Funktion, die `matchesPool` und
   * die Übersetzung nach SQL benutzen.
   *
   * Ist dieser Wert `true`, liefert die Mitgliederabfrage nichts. Nicht
   * „vielleicht nichts": nichts.
   */
  readonly matchesNothing: boolean;
}

/**
 * Die Auflösung einer Regel zusammensetzen (T-080).
 *
 * Rein: Die aufgelösten Taglisten kommen herein, das Auflösen selbst ist
 * Aufgabe des Ports — dafür braucht es den Ordnerbaum.
 */
export type ResolvePool = (input: {
  /** Die gespeicherte Regel. Gelesen werden die drei Achsen, die nichts auflösen. */
  readonly axes: PoolRuleAxes;
  /** Die erforderlichen Tags, aufgelöst. */
  readonly ruleTagIds: readonly unknown[];
  /** Die ausgeschlossenen Tags, aufgelöst. */
  readonly excludedTagIds: readonly unknown[];
  /**
   * Die **erforderlichen** Ordnerterme, aus denen kein Tag geworden ist
   * (E-057). Jeder einzelne davon läßt die Regel nichts treffen.
   *
   * Warum als Liste und nicht als Anzahl: Die Oberfläche soll „Der Ordner Ost
   * enthält keinen Tag" sagen können und nicht „ein Ordner". Die Kennungen
   * kennt sie ohnehin — sie stehen in der Regel —, den **Inhalt** der Ordner
   * kennt nur der Dienst.
   */
  readonly emptyRuleFolderIds: readonly TagFolderId[];
  /**
   * Dasselbe für die **ausgeschlossenen** Ordnerterme — ohne Folgen für die
   * Treffermenge (E-057), aber die Auskunft, daß ein Ausschluß nicht wirkt.
   */
  readonly emptyExcludedFolderIds: readonly TagFolderId[];
}) => PoolResolution;

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

// ---------------------------------------------------------------------------
// Die Achsen einer Regel, einmal aufgezählt (T-080)
//
// Bis T-080 stand die Frage „nennt diese Regel überhaupt eine Bedingung?" an
// drei Stellen: in `matchesPool` unten, in der Übersetzung nach SQL
// (`packages/storage`, `buildConditions`) und in der Oberfläche, die sie für
// den Leerzustand einer frisch angelegten Spalte braucht und über keine Route
// erfragen konnte. Drei Fassungen derselben Bedingung, alle drei richtig, alle
// drei von Hand gepflegt.
//
// Hier steht sie einmal. Und sie steht so, dass eine **sechste** Achse nicht
// stillschweigend an ihr vorbeikommt: Die Tabelle darunter ist über
// `PoolRuleAxes` abgebildet und verlangt zu jedem Feld einen Eintrag.
// ---------------------------------------------------------------------------

/**
 * Zu jeder Achse: Wie viele Bedingungen nennt sie?
 *
 * Zwei Bauformen, und das ist der ganze Bestand — eine Liste, deren
 * Neutralwert leer ist, und eine Dreiwahl, deren Neutralwert `any` heißt. Der
 * Rückgabewert ist eine **Anzahl** und kein Wahrheitswert, weil die Oberfläche
 * „3 Bedingungen" schreibt und nicht „Bedingungen: ja".
 *
 * Das `-?` in der Abbildung ist kein Zierrat: Ohne es würde eine neu
 * hinzugefügte, freiwillige Achse hier stillschweigend fehlen dürfen.
 */
const POOL_RULE_AXIS_CONDITIONS: {
  readonly [K in PoolRuleAxisId]-?: (axes: PoolRuleAxes) => number;
} = {
  rule: (axes) => axes.rule.length,
  excludedTags: (axes) => axes.excludedTags.length,
  statusIds: (axes) => axes.statusIds.length,
  completion: (axes) => (axes.completion === 'any' ? 0 : 1),
  exportState: (axes) => (axes.exportState === 'any' ? 0 : 1),
};

/**
 * Die Achsen in Leserichtung: erforderlich, ausgeschlossen, Status, Erledigt,
 * Exportstatus. Dieselbe Folge wie im Formular und in der Zusammenfassung.
 *
 * Abgeleitet und nicht abgeschrieben: Wer eine Achse ergänzt, ergänzt sie in
 * der Tabelle darüber, und diese Liste weiß sofort davon.
 */
export const POOL_RULE_AXIS_IDS = Object.keys(
  POOL_RULE_AXIS_CONDITIONS,
) as readonly PoolRuleAxisId[];

/**
 * Zu jedem Feld der **aufgelösten** Regelseite die Achse, die es füllt.
 *
 * Kein Datenbestand, sondern eine Behauptung an den Übersetzer, und sie schaut
 * in die Richtung, die die Tabelle darüber nicht abdeckt: Wer
 * {@link MatchesPoolRule} ein Feld hinzufügt — und das muss er, damit eine
 * neue Achse überhaupt wirkt —, bekommt hier einen Fehler, bis er sagt, zu
 * welcher Achse es gehört. Und Achsen gibt es nur die in {@link PoolRuleAxes};
 * damit wird die Tabelle darüber im selben Zug rot.
 *
 * `matchMode` steht ausdrücklich **nicht** darin. Er ist keine Achse, sondern
 * sagt, wie **eine** Achse verknüpft ist; eine Regel, die nur ihn setzt, nennt
 * keine Bedingung. Wer ihn hier vermisst, hat die Unterscheidung gefunden, um
 * die es geht.
 *
 * Gelesen wird die Zuordnung außerhalb der Domäne: `proof:openapi` hält sie
 * gegen die Schnittstellenbeschreibung und gegen die Eingabeprüfung der
 * Routen — jede Achse muss beschrieben, annehmbar und ausgeliefert sein.
 */
export const POOL_RULE_AXIS_OF_FIELD: {
  readonly [K in Exclude<keyof MatchesPoolRule, 'matchMode'>]-?: PoolRuleAxisId;
} = {
  ruleTagIds: 'rule',
  excludedTagIds: 'excludedTags',
  ruleStatusIds: 'statusIds',
  completion: 'completion',
  exportState: 'exportState',
  // Keine sechste Achse, sondern eine Auskunft **über** die erste: Sie sagt
  // nicht, was die Regel verlangt, sondern was aus dem Verlangten geworden ist
  // (E-057). Eine eigene Achse daraus zu machen wäre falsch — sie zählt in
  // `countPoolRuleConditions` nicht mit, eine Regel wird durch einen leeren
  // Ordner nicht um eine Bedingung reicher.
  unresolvedRequired: 'rule',
};

/**
 * Wie viele Bedingungen nennt diese Regel? (A-3.4, T-080)
 *
 * Null heißt: keine einzige. Die Regel trifft dann **nichts** — nicht alles.
 *
 * Die Zahl zählt, was die Regel **nennt**, nicht wie viel dabei herauskommt:
 * Ein Ordnerterm ist eine Bedingung, auch wenn in dem Ordner kein Tag liegt.
 * Ob nach dem Auflösen noch etwas übrig ist, beantwortet
 * {@link PoolResolution}; die beiden Antworten sind verschieden, und beide
 * werden gebraucht.
 */
export const countPoolRuleConditions = (axes: PoolRuleAxes): number =>
  Object.values(POOL_RULE_AXIS_CONDITIONS).reduce((sum, count) => sum + count(axes), 0);

/**
 * Nennt diese Regel keine einzige Bedingung? (A-3.4, E-055, T-080)
 *
 * Die eine Frage, die dieser Bestand achtmal an verschiedenen Stellen
 * beantwortet hatte. Sie steht jetzt hier, und alle stellen sie: die
 * Zugehörigkeitsregel darunter, die Übersetzung nach SQL, der Dienst beim
 * Ausliefern einer Regel und die Oberfläche — für den gespeicherten Pool
 * genauso wie für den Entwurf im Formular, den noch keine Route gesehen hat.
 *
 * **Was sie nicht ist.** Kein Fehler und keine Abweisung: Eine Regel ohne
 * Bedingung ist der Zustand unmittelbar nach dem Anlegen und ausdrücklich
 * zulässig (E-055). Sie bleibt nur leer, bis eine Bedingung dazukommt — und
 * genau das soll die Oberfläche sagen können, statt „keine Karte trifft diese
 * Regel" zu schreiben.
 */
export const poolRuleIsEmpty = (axes: PoolRuleAxes): boolean =>
  countPoolRuleConditions(axes) === 0;

/**
 * Hat eine Tagachse Terme genannt, die auf **keinen** Tag auflösen? (E-057)
 *
 * Die Ableitung ist eine Zeile, und genau deshalb steht sie hier: Sie wird an
 * drei Stellen gebraucht — beim Auflösen im Dienst, in der Übersetzung nach SQL
 * und beim Aufbau der Frage an {@link matchesPool} —, und drei Fassungen einer
 * Zeile sind drei Gelegenheiten, sie verschieden zu schreiben. „> 0 und === 0"
 * ist außerdem die Art Bedingung, die man beim zweiten Hinschreiben umdreht.
 *
 * **Gefragt wird termweise, nicht achsenweise.** `emptyTerms` zählt die
 * einzelnen Terme, aus denen kein Tag geworden ist — und ein einziger davon
 * genügt. Die achsenweise Summe (`resolved`) reicht nicht: Nennt eine Regel
 * „Tag Support **oder** Ordner Ost" und ist nur Ost leer, bleibt die Summe
 * positiv, und der leere Ordner wäre wieder unsichtbar. Er trägt dann still
 * nichts bei — bis jemand einen Tag in Ost legt und die Spalte sich ohne
 * ersichtlichen Grund ändert. Das ist dieselbe Falle wie in E-057, nur
 * verzögert.
 *
 * **Auch im Modus `any`.** Aussagenlogisch trüge ein leerer Term zu einem
 * „oder" nichts bei, und die Regel bliebe gültig. Diese Lesart wird nicht
 * nachgebaut, und zwar aus demselben Grund wie in E-057: Der Benutzer hat den
 * Ordner genannt, weil er ihn meint.
 *
 * Die zweite Bedingung (`named > 0 && resolved === 0`) bleibt daneben stehen.
 * Sie ist heute von der ersten mit abgedeckt — nur ein Ordnerterm kann leer
 * ausgehen, ein Tagterm bringt immer seinen Tag mit — und ist das Netz für eine
 * dritte Termart, die eines Tages ins Leere zeigt, ohne ein Ordner zu sein.
 *
 * Benannte Felder statt dreier Zahlen: `(0, 3, 0)` und `(3, 0, 0)` bedeuten
 * Gegenteiliges und sähen am Aufrufpunkt gleich aus.
 */
export const tagAxisIsUnresolved = (axis: {
  /** Wie viele **Terme** die Achse nennt — Tags und Ordner, ungeachtet ihres Inhalts. */
  readonly named: number;
  /** Wie viele **Tags** daraus geworden sind. */
  readonly resolved: number;
  /** Wie viele **einzelne Terme** keinen Tag beigetragen haben (E-057). */
  readonly emptyTerms: number;
}): boolean => axis.emptyTerms > 0 || (axis.named > 0 && axis.resolved === 0);

/**
 * Trifft diese Regel von vornherein nichts? (A-3.4, E-057)
 *
 * Die Frage an die **aufgelöste** Regel, und die einzige Stelle, an der die
 * beiden Gründe zusammenkommen:
 *
 *  1. **Sie nennt keine Bedingung** ({@link poolRuleIsEmpty}, A-3.4). Der
 *     Zustand unmittelbar nach dem Anlegen. Er löst sich, sobald jemand die
 *     Regel einrichtet.
 *  2. **Sie nennt eine erforderliche Tagbedingung, die auf nichts auflöst**
 *     (E-057). Der leere Ordner. Er löst sich, sobald jemand einen Tag
 *     hineinlegt — und bis dahin ist die Regel eine Einschränkung, die niemand
 *     erfüllt.
 *
 * Der zweite Fall war bis E-057 kein Fall: Eine leere Tagmenge galt als
 * Neutralwert, die Achse verschwand, und „Tags aus Ordner X **und** Status
 * offen" wurde zu „Status offen". Die Regel traf **mehr**, als der Benutzer
 * gesagt hatte — die gefährliche Richtung, weil eine Spalte, die zu viel zeigt,
 * niemandem auffällt.
 *
 * **Der Modus spielt keine Rolle.** Aussagenlogisch wäre „alle davon" über eine
 * leere Menge wahr und „mindestens eines davon" falsch; diese Unterscheidung
 * wird ausdrücklich nicht nachgebaut. Der Benutzer meint mit „Ordner X" nicht
 * die Menge, sondern die Zugehörigkeit zu X, und die hat niemand, wenn X leer
 * ist.
 *
 * **Die ausgeschlossene Achse steht nicht darin.** „Keiner davon" über nichts
 * schließt nichts aus; das ist die richtige Lesart, und sie engt nicht ein.
 * Bleibt daneben keine andere Bedingung übrig, greift Fall 1 — nicht, weil ein
 * Ausschluß ins Leere zeigt, sondern weil die Regel dann gar nichts mehr sagt.
 *
 * ---------------------------------------------------------------------------
 * Wie weit Fall 2 reicht — termweise, nicht achsenweise
 * ---------------------------------------------------------------------------
 *
 * Gefragt wird über den **einzelnen Term**: Nennt eine Regel „Tag Support
 * **oder** Ordner Ost" und ist nur Ost leer, trifft sie trotzdem nichts,
 * obwohl Support Tags beisteuert.
 *
 * Achsenweise — „nur wenn die ganze Liste leer ausgeht" — wäre die
 * naheliegendere und die schwächere Antwort: Der leere Ordner trüge still
 * nichts bei, die Spalte zeigte die Support-Karten, niemandem fiele auf, daß
 * Ost leer ist. Sobald jemand einen Tag in Ost legt, änderte sich die Spalte
 * ohne ersichtlichen Grund. Das ist dieselbe Falle wie in E-057, nur verzögert.
 *
 * Und das gilt **in beiden Modi**, auch in `any`. Siehe
 * {@link tagAxisIsUnresolved}.
 */
export const poolRuleMatchesNothing = (axes: ResolvedPoolRuleAxes): boolean =>
  poolRuleIsEmpty(axes) || axes.unresolvedRequired;

/**
 * Was eine Regel nach dem Auflösen ihrer Ordner ergibt (T-080, E-057).
 *
 * Der Unterschied zu {@link poolRuleIsEmpty} ist der Ordner, in dem kein Tag
 * liegt: Er ist eine genannte Bedingung, aus der keine Tagmenge wird. Bis
 * E-057 verschwand er in `matchesPool` spurlos — eine leere Tagmenge galt als
 * Neutralwert und wurde übersprungen —, und eine Regel „Tags aus diesem Ordner
 * **und** Status offen" schrumpfte still auf „Status offen".
 *
 * Seit E-057 trifft sie statt dessen **nichts**, und diese Auskunft steht in
 * `matchesNothing`. Die Zahlen daneben bleiben: Sie sagen, **warum** — und das
 * ist der Unterschied zwischen „richte die Regel ein" und „leg einen Tag in den
 * Ordner", zwei Sätzen, von denen die Oberfläche den richtigen sagen soll.
 */
export const resolvePool: ResolvePool = ({
  axes,
  ruleTagIds,
  excludedTagIds,
  emptyRuleFolderIds,
  emptyExcludedFolderIds,
}) => {
  // Dieselben fünf Achsen, nur die beiden Taglisten in ihrer aufgelösten
  // Gestalt — und die eine Auskunft, die dabei sonst verlorenginge (E-057).
  // Genau dieses Gebilde beurteilen auch `matchesPool` und die Abfrage in SQL.
  const resolved: ResolvedPoolRuleAxes = {
    rule: ruleTagIds,
    excludedTags: excludedTagIds,
    statusIds: axes.statusIds,
    completion: axes.completion,
    exportState: axes.exportState,
    unresolvedRequired: tagAxisIsUnresolved({
      named: axes.rule.length,
      resolved: ruleTagIds.length,
      emptyTerms: emptyRuleFolderIds.length,
    }),
  };

  return {
    tagCount: ruleTagIds.length,
    excludedTagCount: excludedTagIds.length,
    isEmpty: poolRuleIsEmpty(resolved),
    unresolvedRequired: resolved.unresolvedRequired,
    unresolvedExcluded: tagAxisIsUnresolved({
      named: axes.excludedTags.length,
      resolved: excludedTagIds.length,
      emptyTerms: emptyExcludedFolderIds.length,
    }),
    emptyRuleFolderIds,
    matchesNothing: poolRuleMatchesNothing(resolved),
  };
};

/**
 * Gehört ein Todo in diesen Pool? (A-3.2, A-3.4, T-076)
 *
 * Fünf Achsen, jede mit einem Neutralwert. Der Aufbau ist immer derselbe:
 * steht die Achse neutral, wird sie übersprungen; sagt sie etwas, kann sie nur
 * ablehnen. Deshalb steht am Ende ein nacktes `true` und keine Verknüpfung von
 * fünf Ausdrücken — die wäre dieselbe Aussage in unlesbar.
 *
 * Die **zwei** Ausnahmen stehen ganz oben und sind fachliche Entscheidungen:
 *
 *  - Stehen alle fünf Achsen neutral, trifft die Regel nichts (A-3.4). Die
 *    mathematisch saubere Lesart „alle null Bedingungen sind erfüllt" wäre hier
 *    falsch — eine Regel, die noch nicht fertig eingerichtet ist, hätte
 *    schlagartig jedes Todo der Datenbank als Mitglied.
 *  - Zeigt einer der erforderlichen Terme ins Leere, trifft die Regel nichts
 *    (E-057). Auch das ist keine Aussagenlogik, sondern eine Lesart: „Tags aus
 *    Ordner X" heißt Zugehörigkeit zu X, und die hat niemand, wenn X leer ist.
 */
export const matchesPool: MatchesPool = ({
  todoTagIds,
  ruleTagIds,
  matchMode,
  excludedTagIds,
  todoStatusId,
  ruleStatusIds,
  completedAt,
  completion,
  hasOpenEntries,
  hasExportedEntries,
  exportState,
  unresolvedRequired,
}) => {
  /*
   * Die Laufzeitwache über das eine Pflichtfeld (E-057, O-L, R-3 H-3, T-089).
   *
   * Der Übersetzer trägt sie für allen übersetzten Code, und seit T-088 auch
   * für die Prüffälle in domain, storage und export. Nicht erfaßt bleiben die
   * Nachweisskripte: die Dateien unter `scripts/` sieht kein Übersetzer, und ein
   * fehlendes Feld liest sich dort zur Laufzeit als `undefined` — also als
   * „nein". Die Regel träfe damit wieder das, was sie vor E-057 traf, nämlich
   * **mehr**, und der Nachweis wäre grün.
   *
   * Deshalb wird hier geworfen und nicht weitergerechnet. Fail-closed ist an
   * dieser Stelle möglich, weil kein zulässiger Aufrufer das Feld weglassen
   * darf: Es ist keine Bedingung, sondern die Auskunft, ob eine genannte
   * Bedingung aufgelöst werden konnte. Wer sie nicht hat, holt sie bei
   * `PoolPort.resolveAxes` — aus einer flachen Tagmenge ist sie nicht zu
   * gewinnen.
   *
   * Ein Wurf und kein `false`: „diese Regel trifft nichts" wäre eine fachliche
   * Antwort auf eine Frage, die niemand gestellt hat. Der Aufrufer hat einen
   * Fehler gemacht, und der gehört laut gesagt.
   */
  if (typeof unresolvedRequired !== 'boolean') {
    throw new TypeError(
      'matchesPool: Das Feld `unresolvedRequired` fehlt oder ist kein Wahrheitswert. ' +
        'Es ist seit E-057 Pflicht und sagt, ob die erforderliche Tagachse Terme nennt, ' +
        'die auf keinen Tag auflösen (der leere Ordner). Die Antwort liefert ' +
        '`PoolPort.resolveAxes` zusammen mit `tagAxisIsUnresolved`.',
    );
  }

  const excluded = excludedTagIds ?? [];
  const statuses = ruleStatusIds ?? [];
  const wantedCompletion = completion ?? 'any';
  const wantedExport = exportState ?? 'any';

  // Zwei Gründe, aus denen die Regel nichts trifft, bevor eine Karte überhaupt
  // angesehen wird: Sie nennt keine Bedingung (A-3.4), oder ihre erforderliche
  // Tagachse zeigt ins Leere (E-057).
  //
  // Beides stand bis T-080/T-082 hier ausgeschrieben — und noch einmal in der
  // Übersetzung nach SQL. Jetzt steht es in `poolRuleMatchesNothing`, und
  // dieser Aufruf ist zugleich die Stelle, die rot wird, wenn eine sechste
  // Achse dazukommt: Das Literal muß jede nennen.
  if (
    poolRuleMatchesNothing({
      rule: ruleTagIds,
      excludedTags: excluded,
      statusIds: statuses,
      completion: wantedCompletion,
      exportState: wantedExport,
      // Ohne Vorgabewert: Das Feld ist Pflicht, und die Begründung steht am
      // Feld in `MatchesPoolRule`. Ein `?? false` an dieser Stelle wäre die
      // Wache, die sich selbst abschaltet.
      unresolvedRequired,
    })
  ) {
    return false;
  }

  const onTodo = new Set<TagId>(todoTagIds);

  // Erforderliche Tags — die einzige Achse, deren Verknüpfung wählbar ist.
  if (ruleTagIds.length > 0) {
    const hit =
      matchMode === 'all'
        ? ruleTagIds.every((tagId) => onTodo.has(tagId))
        : ruleTagIds.some((tagId) => onTodo.has(tagId));
    if (!hit) return false;
  }

  // Ausgeschlossene Tags — immer „keines davon". Ein `matchMode` hier wäre
  // zweideutig: „nicht alle" und „keines" sind verschiedene Aussagen, und nur
  // die zweite ist die, die jemand meint, der ein Tag ausschließt.
  //
  // Ohne vorgeschaltete Längenprüfung: `some` auf einer leeren Liste ist
  // `false`, und das ist genau die Bedeutung des Neutralwerts.
  if (excluded.some((tagId) => onTodo.has(tagId))) return false;

  // Status — immer „einer von diesen".
  //
  // Der Vergleich erledigt den unbekannten Status nebenbei: `undefined` und
  // `null` stehen in keiner Statusliste, `some` liefert `false`, die Regel
  // trifft nicht. Eine eigene Prüfung darauf wäre dieselbe Aussage ein zweites
  // Mal — und die Stelle, an der die beiden eines Tages auseinanderliefen.
  if (statuses.length > 0 && !statuses.some((id) => id === todoStatusId)) return false;

  // Erledigt. `undefined` heißt „unbekannt" und zählt weder als erledigt noch
  // als unerledigt: Beide Richtungen lehnen dann ab, statt eine Hälfte zu
  // raten.
  const done = completedAt === undefined ? null : completedAt !== null;
  if (wantedCompletion === 'done' && done !== true) return false;
  if (wantedCompletion === 'open' && done !== false) return false;

  // Exportstatus. Die beiden Kennzeichen sind Vorhandenseinsaussagen über die
  // Buchungen des Todos, nicht sein Zustand — ein Todo kann beide tragen.
  if (wantedExport === 'open' && hasOpenEntries !== true) return false;
  if (wantedExport === 'exported' && hasExportedEntries !== true) return false;

  return true;
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
