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
 */
export interface Pool {
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
  readonly matchMode: 'any' | 'all';
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
 *
 * ---------------------------------------------------------------------------
 * Warum alle neuen Felder freiwillig sind
 * ---------------------------------------------------------------------------
 *
 * Damit jeder Aufrufer aus der Zeit vor T-076 unverändert dieselbe Antwort
 * bekommt: Was er nicht nennt, steht neutral, und dann verhält sich die
 * Funktion wie zuvor.
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
export type MatchesPool = (input: {
  readonly todoTagIds: readonly TagId[];
  /** Die **erforderlichen** Tags der Regel, aufgelöst. Leer: schränkt nicht ein. */
  readonly ruleTagIds: readonly TagId[];
  /** Wie `ruleTagIds` verknüpft ist. Gilt für keine andere Achse. */
  readonly matchMode: 'any' | 'all';
  /** Die **ausgeschlossenen** Tags der Regel, aufgelöst. Leer: schränkt nicht ein. */
  readonly excludedTagIds?: readonly TagId[] | undefined;
  /**
   * Der Status der Karte. Jedes Todo trägt genau einen (`todo.status_id` ist
   * NOT NULL); `null` oder weggelassen heißt „dieser Aufrufer kennt ihn nicht",
   * nicht „diese Karte hat keinen".
   */
  readonly todoStatusId?: StatusId | null | undefined;
  /** Die Status der Regel. Leer oder weggelassen heißt „Alle". */
  readonly ruleStatusIds?: readonly StatusId[] | undefined;
  /** `null` bedeutet unerledigt (A-2.4). Weggelassen: dem Aufrufer unbekannt. */
  readonly completedAt?: Timestamp | null | undefined;
  /** Die Erledigt-Achse der Regel. Weggelassen ist `any`. */
  readonly completion?: PoolCompletionFilter | undefined;
  /** Hat die Karte mindestens eine abgeschlossene, offene Buchung? */
  readonly hasOpenEntries?: boolean | undefined;
  /** Hat die Karte mindestens eine exportierte Buchung? */
  readonly hasExportedEntries?: boolean | undefined;
  /** Die Exportstatus-Achse der Regel. Weggelassen ist `any`. */
  readonly exportState?: PoolExportFilter | undefined;
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
 * Gehört ein Todo in diesen Pool? (A-3.2, A-3.4, T-076)
 *
 * Fünf Achsen, jede mit einem Neutralwert. Der Aufbau ist immer derselbe:
 * steht die Achse neutral, wird sie übersprungen; sagt sie etwas, kann sie nur
 * ablehnen. Deshalb steht am Ende ein nacktes `true` und keine Verknüpfung von
 * fünf Ausdrücken — die wäre dieselbe Aussage in unlesbar.
 *
 * Die **eine** Ausnahme steht ganz oben und ist eine fachliche Entscheidung:
 * Stehen alle fünf Achsen neutral, trifft die Regel nichts. Die mathematisch
 * saubere Lesart „alle null Bedingungen sind erfüllt" wäre hier falsch — eine
 * Regel, die noch nicht fertig eingerichtet ist, hätte schlagartig jedes Todo
 * der Datenbank als Mitglied.
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
}) => {
  const excluded = excludedTagIds ?? [];
  const statuses = ruleStatusIds ?? [];
  const wantedCompletion = completion ?? 'any';
  const wantedExport = exportState ?? 'any';

  // Alle Achsen neutral: Die Regel ist nicht eingerichtet und trifft nichts.
  if (
    ruleTagIds.length + excluded.length + statuses.length === 0 &&
    wantedCompletion === 'any' &&
    wantedExport === 'any'
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
