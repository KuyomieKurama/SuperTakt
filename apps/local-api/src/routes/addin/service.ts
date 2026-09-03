/**
 * Takt — die Anwendungsfälle des Add-ins (A-9.5, A-10.4, A-10.5, A-10.9, R-15).
 *
 * Kein HTTP, kein Hono, kein `Request`. Alles hier nimmt Werte entgegen und
 * gibt Werte zurück; der Router daneben übersetzt nur zwischen JSON und diesen
 * Aufrufen. Damit ist jeder Anwendungsfall ohne laufenden Dienst prüfbar —
 * `apps/outlook-addin/scripts/proof-addin.mjs` ruft sie über den Router auf,
 * könnte sie aber ebenso gut unmittelbar aufrufen.
 */

import type {
  CallNumberRejection,
  DefaultTag,
  Pool,
  Result,
  StatusId,
  Tag,
  TagId,
  TagTree,
  TaktError,
  TimeEntry,
  Timestamp,
  Todo,
  TodoId,
  TodoStatus,
} from '@takt/domain';
import {
  applyDefaultTags,
  checkCallNumber,
  checkTagNames,
  err,
  matchesPool,
  ok,
  tagAxisIsUnresolved,
} from '@takt/domain';

import { AbortTodoCreate, resolveTagNames } from '../../usecases/tag-names.ts';

import type { AddinDeps, AddinUnit } from './ports.ts';

// ---------------------------------------------------------------------------
// A-10.4 — alles, was der Aufgabenbereich beim Öffnen braucht, in einem Zug
// ---------------------------------------------------------------------------

/**
 * Der Startzustand des Aufgabenbereichs.
 *
 * Ein Aufruf statt vier. Nicht aus Sparsamkeit: Ein Aufgabenbereich in Outlook
 * wird bei **jeder** geöffneten E-Mail neu aufgebaut, und vier nacheinander
 * laufende Anfragen über eine gerade erst aufgebaute Verbindung sind der
 * Unterschied zwischen „ist schon da" und „lädt schon wieder".
 *
 * `defaultTagIds` steht getrennt neben dem Baum, weil S-12 die Standard-Tags
 * **als solche gekennzeichnet** zeigen muss (A-9.3, A-9.5). Ohne die Trennung
 * sähe der Benutzer drei Chips und wüsste nicht, welche davon er selbst gewählt
 * hat.
 */
export interface AddinContext {
  readonly tagTree: TagTree;
  readonly pools: readonly Pool[];
  readonly statuses: readonly TodoStatus[];
  readonly defaultStatusId: StatusId;
  readonly defaultTagIds: readonly TagId[];
}

export const loadContext = (deps: AddinDeps): Promise<AddinContext> =>
  deps.inTransaction(async (unit) => {
    const [tagTree, pools, statuses, defaultStatus, defaults] = await Promise.all([
      unit.folders.loadTree(),
      unit.pools.list(),
      unit.statuses.list(),
      unit.statuses.defaultStatus(),
      unit.defaultTags.list(),
    ]);

    return {
      tagTree,
      pools,
      statuses,
      defaultStatusId: defaultStatus.id,
      defaultTagIds: orderedDefaultTagIds(defaults),
    };
  });

/** Standard-Tags in ihrer konfigurierten Reihenfolge (A-9.1). */
const orderedDefaultTagIds = (defaults: readonly DefaultTag[]): readonly TagId[] =>
  [...defaults].sort((left, right) => left.position - right.position).map((entry) => entry.tagId);

// ---------------------------------------------------------------------------
// A-10.9 / R-15 — das Duplikatangebot
// ---------------------------------------------------------------------------

/**
 * Ein gefundenes Todo, so wie es dem Benutzer **vor** der Entscheidung gezeigt
 * wird.
 *
 * Enthält absichtlich mehr als die Kennung: Titel, Call-Nummer, Tags und die
 * Aufteilung der bereits gebuchten Zeit in offen und exportiert. Grund ist
 * R-15 und Punkt 16 aus T-005: Eine anonyme Ja/Nein-Frage („Auf vorhandenes
 * Todo buchen?") beantwortet jeder mit Ja. Titel und Kundentag lassen einen
 * Menschen den falschen Vorgang sofort erkennen; die Aufteilung offen/exportiert
 * verhindert, dass unbemerkt auf einen bereits abgerechneten Vorgang
 * weitergebucht wird.
 */
export interface AddinTodoMatch {
  readonly id: TodoId;
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: StatusId;
  readonly tagIds: readonly TagId[];
  /** `null` bedeutet aktiv (A-2.4). Ein erledigtes Todo wird gekennzeichnet. */
  readonly completedAt: Timestamp | null;
  readonly openSeconds: number;
  readonly exportedSeconds: number;
  /**
   * Die Pools, in denen dieses Todo **nach einer Buchung darauf** stünde —
   * beim Namen genannt (I-05, T-038, T-078).
   *
   * Steht **vor** der Entscheidung in der Antwort und nicht erst danach. Ist
   * das Todo erledigt, hebt eine Buchung darauf das Kennzeichen automatisch
   * auf (A-2.5); der Aufgabenbereich kann damit vorher sagen, wo es danach
   * wieder auftaucht, statt den Benutzer hinterher suchen zu lassen.
   *
   * **Zugehörigkeit, nicht Sichtbarkeit** — und seit T-078 ist das eine
   * Unterscheidung mit Folgen. `matchesPool` beantwortet die Zugehörigkeit,
   * `isVisibleInPool` die Sichtbarkeit; das Add-in fragt die erste. Die zweite
   * bräuchte `includeCompleted`, eine Einstellung der **Ansicht** in der
   * Hauptanwendung (E-039), die das Add-in nicht kennt und die es raten
   * müsste. Nach der Buchung ist das Todo ohnehin offen, und dann liefert
   * `isVisibleInPool` für jeden Pool `true` — die Frage trüge nichts bei und
   * brächte einen geratenen Wert herein.
   *
   * **Warum „nach einer Buchung" und nicht „jetzt".** Der Satz, den der
   * Aufgabenbereich daraus baut, steht im Futur: „Es erscheint dann wieder in
   * …" (`duplicate/reopen.ts`). Bis T-076 war das derselbe Satz wie „jetzt",
   * weil die Zugehörigkeit allein an den Tags hing. Seitdem gibt es Regeln
   * über `completion` und `exportState`, und die beiden Zeitpunkte fallen
   * auseinander: Eine Spalte „Erledigt" (`completion: 'done'`) enthält das
   * Todo **jetzt** und **nach** der Buchung nicht mehr; eine Spalte „Noch
   * nicht abgerechnet" (`exportState: 'open'`) umgekehrt. Genannt wird, was
   * der Benutzer nach seiner Entscheidung vorfindet.
   */
  readonly poolNames: readonly string[];
  /**
   * Die Pools, in denen das Todo **vorher nicht** stand und nach der Buchung
   * steht (T-084).
   *
   * Eine **Teilmenge** von `poolNames` und keine zweite Rechnung: Beide
   * entstehen in einem Durchgang durch dieselben Regeln (`poolNamer`).
   * `poolNames` beantwortet „wo steht es danach", diese Liste „was ändert sich
   * dadurch" — und das sind zwei verschiedene Fragen, seit eine Spalte über den
   * Exportstatus urteilen kann (T-076).
   *
   * Wozu sie gebraucht wird: Für ein **erledigtes** Todo ist die Buchung eine
   * Rückkehr, und der Aufgabenbereich nennt alle Pools, in denen es danach zu
   * finden ist. Für ein **offenes** Todo ist sie das nicht — dort wäre eine
   * Aufzählung der ohnehin schon zutreffenden Pools kein Hinweis, sondern
   * Rauschen. Was der Benutzer dort erfährt, ist genau der Unterschied: Die
   * erste Buchung setzt `hasOpenEntries` von falsch auf wahr, und eine Spalte
   * `exportState: 'open'` nimmt das Todo damit auf. Ohne diese Liste ließe sich
   * „es erscheint neu in …" nicht von „es steht ohnehin schon in …"
   * unterscheiden, ohne zwei Namenslisten gegeneinander zu halten — und Namen
   * sind nicht eindeutig (siehe `poolNamer`).
   *
   * Leer heißt: Diese Buchung bewegt das Todo in keinen Pool hinein. Zusammen
   * mit einem leeren `leavingPoolNames` heißt es, dass sie es überhaupt nicht
   * bewegt — und dann sagt der Aufgabenbereich kein Wort über Pools.
   */
  readonly enteringPoolNames: readonly string[];
  /**
   * Die Pools, aus denen dieselbe Buchung das Todo **entfernt** (E-056).
   *
   * Die andere Hälfte derselben Auskunft. Sie ist fast immer leer — nur eine
   * Regel, die nach „Erledigt" fragt, kann ein Todo durch eine Buchung
   * verlieren. Genau diese Regel ist aber die, für die man so eine Spalte
   * anlegt: **erledigt und noch nicht abgerechnet**, benutzt als
   * Abrechnungsliste. Wer dort bucht, sieht die Karte aus der Liste
   * verschwinden, in der er sie gerade sucht; eine unerklärte Bewegung wird an
   * dieser Stelle als Datenverlust gelesen.
   *
   * Ein Pool steht nie in beiden Listen: `poolNames` gewinnt, und diese hier
   * trägt nur, was vorher zutraf und nachher nicht.
   */
  readonly leavingPoolNames: readonly string[];
}

/**
 * Der Zustand eines Todos, über den die Poolregel urteilt.
 *
 * Alle fünf Achsen aus T-076 in einem Wert. Er steht hier als eigener Typ und
 * nicht als lose Argumentliste, damit `tsc` widerspricht, wenn die Domäne eine
 * sechste Achse bekommt und diese Datei sie nicht mitgibt — genau der Fehler,
 * den T-078 zu beheben hat.
 */
interface PoolCandidate {
  readonly tagIds: readonly TagId[];
  readonly statusId: StatusId;
  /** `null` bedeutet unerledigt (A-2.4). */
  readonly completedAt: Timestamp | null;
  /** Mindestens eine abgeschlossene, offene Buchung? */
  readonly hasOpenEntries: boolean;
  /** Mindestens eine exportierte Buchung? */
  readonly hasExportedEntries: boolean;
}

/**
 * Die Bewegung, die eine Buchung auslöst (E-056).
 *
 * Zwei Listen, benannt statt der Reihe nach: Sie sind gleich getippt, und wer
 * sie vertauscht, bekommt einen Satz, der sich richtig liest und das Gegenteil
 * behauptet. Ein Paar mit Feldnamen kann man nicht vertauschen, ohne es zu
 * bemerken.
 */
export interface AddinPoolMovement {
  /** Pools, in denen das Todo **nach** der Buchung steht. */
  readonly appears: readonly string[];
  /**
   * Pools, in die dieselbe Buchung es **hineinbewegt** — die Teilmenge von
   * `appears`, für die vorher nicht galt, was nachher gilt (T-084).
   *
   * Das Gegenstück zu `leaves`, und zusammen sind die beiden die **Bewegung**:
   * Sind beide leer, ändert diese Buchung an der Pool-Zugehörigkeit nichts,
   * und darüber ist dann auch nichts zu sagen. `appears` beantwortet diese
   * Frage nicht — es ist fast immer besetzt, auch wenn sich nichts rührt.
   */
  readonly enters: readonly string[];
  /**
   * Pools, aus denen dieselbe Buchung es **entfernt** — genannt, weil es
   * dieselbe Folge ist wie das Erscheinen, nur in die andere Richtung (E-056).
   *
   * Leer, solange keine Regel danach fragt. Das ist der Normalfall, und der
   * Aufgabenbereich sagt dann kein Wort darüber.
   */
  readonly leaves: readonly string[];
}

/**
 * Baut eine Zuordnung „Zustand eines Todos → Namen seiner Pools".
 *
 * Die Regeln werden **einmal** je Anfrage aufgelöst und danach nur noch gegen
 * einzelne Todos gehalten. Die Entscheidung selbst fällt in `matchesPool` aus
 * `@takt/domain` — dieselbe Funktion, die auch die Pool-Ansicht der
 * Hauptanwendung benutzt. Eine zweite Fassung dieser Regel wäre der Anfang
 * zweier verschiedener Antworten auf dieselbe Frage.
 *
 * ---------------------------------------------------------------------------
 * Warum hier seit T-078 fünf Achsen stehen und nicht eine
 * ---------------------------------------------------------------------------
 *
 * Bis T-078 gab diese Stelle **nur** die erforderlichen Tags mit. Solange eine
 * Regel nichts anderes kannte, war das vollständig; seit T-076 ist es eine
 * halbe Frage mit einer ganzen Antwort. `matchesPool` überspringt jede Achse,
 * die es nicht genannt bekommt — eine Regel „Wartung, **außer** Störung"
 * wurde damit zu „Wartung", und das Add-in behauptete eine Zugehörigkeit, die
 * nicht besteht. Der Fehler ging **nie** in die andere Richtung: Es nannte zu
 * viele Pools, nie zu wenige. Das ist die schlechtere der beiden Richtungen —
 * der Benutzer sucht das Todo in einem genannten Pool, findet es nicht und
 * glaubt der Anzeige beim nächsten Mal nicht mehr.
 *
 * Die drei Angaben über die **Karte** (Status, Erledigt, Buchungen) kommen
 * deshalb vollständig herein oder gar nicht: Ein weggelassenes Feld ist für
 * `matchesPool` „unbekannt", und unbekannt lehnt ab. Weglassen wäre also nicht
 * mehr falsch, aber leise unvollständig — und niemand sähe, warum ein Pool
 * fehlt.
 *
 * ---------------------------------------------------------------------------
 * Der leere Ordner geht seit T-086 mit (E-057)
 * ---------------------------------------------------------------------------
 *
 * Derselbe Fehler wie oben, eine Achse weiter: Eine Regel, die einen Ordner
 * **ohne Tags** fordert, trifft seit E-057 nichts — vorher verschwand die
 * Bedingung beim Auflösen spurlos, weil eine leere Tagmenge und „keine
 * Tagbedingung" gleich aussehen. T-084 hat den Befund gemeldet und nicht
 * behoben: Die Antwort steckt nicht in einer flachen Tagmenge, denn die kann
 * nicht sagen, **welcher** genannte Ordner nichts beigetragen hat.
 *
 * Sie steckt in `PoolPort.resolveAxes`, und die liefert der Port-Ausschnitt
 * seit T-086. Damit geht `unresolvedRequired` mit — seit T-082 ohnehin ein
 * **Pflichtfeld** von `matchesPool`, und genau deshalb: Ein freiwilliges Feld
 * hieße „wer schweigt, bekommt die zu weite Antwort von vorher, und niemand
 * wird rot". Das war die Falle aus T-078, zweimal.
 *
 * Gefragt wird **termweise** und nicht über die Summe: Ein leerer Ordner
 * **neben** einem Tagterm bleibt in `ruleTagIds` unsichtbar (die Menge ist
 * gefüllt), zählt aber in `emptyFolderIds`. Beurteilt wird nichts hier,
 * sondern in `tagAxisIsUnresolved` — dieselbe Ableitung, die auch die
 * Übersetzung nach SQL und die Pool-Liste benutzen. Eine zweite Fassung dieser
 * einen Zeile wäre der Anfang zweier verschiedener Antworten.
 *
 * ---------------------------------------------------------------------------
 * Warum die Antwort seit E-056 zwei Listen hat und nicht eine
 * ---------------------------------------------------------------------------
 *
 * Die zurückgegebene Funktion urteilt über **beide** Zustände desselben Todos —
 * den vor und den nach der Buchung — und geht dabei je Pool **einmal** durch.
 * Sie diffft ausdrücklich nicht zwei Namenslisten gegeneinander: Zwei Pools
 * dürfen denselben Namen tragen, und ein Vergleich über Namen ließe den einen
 * für den anderen einstehen. Verglichen wird die Regel mit sich selbst.
 */
const poolNamer = async (
  unit: AddinUnit,
): Promise<(states: { readonly before: PoolCandidate; readonly after: PoolCandidate }) => AddinPoolMovement> => {
  const pools = await unit.pools.list();
  const ordered = [...pools].sort((left, right) => left.position - right.position);

  const resolved = await Promise.all(
    ordered.map(async (pool) => {
      // Beide Taglisten in **einer** Antwort (`PoolPort.resolveAxes`, E-057).
      // Sie bewirken im Ergebnis Gegenteiliges und stehen deshalb getrennt
      // nebeneinander; aufgelöst werden sie zusammen, weil hier ausnahmslos
      // beide gebraucht werden — und weil nur diese Antwort die Ordner nennt,
      // aus denen kein Tag geworden ist.
      const axes = await unit.pools.resolveAxes(pool.id);

      return {
        name: pool.name,
        matchMode: pool.matchMode,
        ruleTagIds: axes.required.tagIds,
        excludedTagIds: axes.excluded.tagIds,
        // Termweise (E-057): `named` zählt die **Terme** der Regel, nicht die
        // Tags, die daraus geworden sind — `pool.rule` ist die Liste, die der
        // Benutzer ausgesprochen hat. Die ausgeschlossene Achse steht
        // absichtlich nicht daneben: „keiner davon" über nichts schließt
        // nichts aus.
        unresolvedRequired: tagAxisIsUnresolved({
          named: pool.rule.length,
          resolved: axes.required.tagIds.length,
          emptyTerms: axes.required.emptyFolderIds.length,
        }),
        ruleStatusIds: pool.statusIds,
        completion: pool.completion,
        exportState: pool.exportState,
      };
    }),
  );

  /** Ein Pool gegen einen Zustand — die Regel, an genau einer Stelle. */
  const holds = (pool: (typeof resolved)[number], todo: PoolCandidate): boolean =>
    matchesPool({
      todoTagIds: todo.tagIds,
      ruleTagIds: pool.ruleTagIds,
      matchMode: pool.matchMode,
      excludedTagIds: pool.excludedTagIds,
      // Pflichtfeld seit T-082, und der einzige Wert hier, der keine Bedingung
      // ist, sondern eine Auskunft über eine: Ist eine erforderliche
      // Bedingung genannt, die auf nichts auflöst? (E-057)
      unresolvedRequired: pool.unresolvedRequired,
      todoStatusId: todo.statusId,
      ruleStatusIds: pool.ruleStatusIds,
      completedAt: todo.completedAt,
      completion: pool.completion,
      hasOpenEntries: todo.hasOpenEntries,
      hasExportedEntries: todo.hasExportedEntries,
      exportState: pool.exportState,
    });

  return ({ before, after }) => {
    const appears: string[] = [];
    const enters: string[] = [];
    const leaves: string[] = [];

    for (const pool of resolved) {
      // Ein Pool, ein Durchgang, beide Zustände. Seit T-084 fällt dabei ein
      // dritter Wert ab, und zwar aus **derselben** Antwort: Ob sich für
      // diesen Pool etwas geändert hat, weiß nur die Stelle, die ihn für
      // beide Zustände befragt hat. Wer `enters` später aus `appears` und
      // einer zweiten Abfrage nachrechnete, verglich Namen mit Namen — und
      // zwei Pools dürfen denselben Namen tragen.
      const held = holds(pool, before);

      if (holds(pool, after)) {
        appears.push(pool.name);
        // Die Teilmenge, die die **Bewegung** trägt. `continue` steht
        // absichtlich danach: Ein Pool, der nachher zutrifft, kann nicht
        // zugleich verlassen werden.
        if (!held) enters.push(pool.name);
        continue;
      }
      // Nur hier wird der Zustand **vor** der Buchung befragt, und nur für die
      // Pools, die danach nicht mehr zutreffen. Ein Pool kann deshalb nie in
      // beiden Listen stehen — „erscheint" und „verschwindet" über denselben
      // Namen wäre kein Satz, den jemand lesen möchte.
      if (held) leaves.push(pool.name);
    }

    return { appears, enters, leaves };
  };
};

/**
 * Die zwei Zustände, zwischen denen eine Buchung das Todo bewegt.
 *
 * Der Aufgabenbereich sagt vorher „Es erscheint dann wieder in …" und
 * hinterher „Es ist zurück in …" (`duplicate/reopen.ts`). Beide Sätze meinen
 * denselben Zeitpunkt, und deshalb rechnet ihn **eine** Funktion aus. Zwei
 * Rechnungen an zwei Stellen wären zwei Gelegenheiten, Verschiedenes zu
 * behaupten — dieselbe Begründung, aus der die Sätze selbst in einer Datei
 * stehen. Seit E-056 gilt das für beide Hälften der Aussage: Das Erscheinen
 * und das Verschwinden kommen aus **einem** Wertepaar, nicht aus zwei
 * Rechnungen, die man einzeln richtig oder falsch stellen könnte.
 *
 * ---------------------------------------------------------------------------
 * `after` — zwei Werte stehen fest und werden nicht abgefragt
 * ---------------------------------------------------------------------------
 *
 *  - `completedAt: null` — eine Buchung hebt „Erledigt" **automatisch** auf
 *    (A-2.5). Seit T-038 gibt es keinen Schalter mehr, der das verhindern
 *    könnte; die Aufhebung ist damit keine Vermutung, sondern die Wirkung der
 *    Handlung, um die es geht.
 *  - `hasOpenEntries: true` — die entstehende Buchung ist abgeschlossen und
 *    **offen** (E-032: `export_status` ist zweiwertig und beginnt bei `open`).
 *    Ein Todo, auf das gebucht wird, hat danach in jedem Fall etwas
 *    Abzurechnendes.
 *
 * ---------------------------------------------------------------------------
 * `before` — **hier** steht der Zustand von jetzt, und zwar mit Absicht
 * ---------------------------------------------------------------------------
 *
 * Das ist kein Rückfall in den Fehler von T-078, sondern die zweite Hälfte
 * derselben Rechnung. Dort war falsch, den **jetzigen** Zustand für eine
 * Aussage über **danach** zu benutzen. Hier wird er für eine Aussage über
 * jetzt benutzt: „woraus verschwindet es" hat nur eine Antwort, wenn man weiß,
 * worin es gerade steht. `completedAt` trägt deshalb den echten Wert des Todos
 * und nicht `null` — wer ihn hier auf `null` setzt, macht beide Zustände
 * gleich, und die Liste `leaves` ist dann für immer leer, ohne dass etwas
 * bricht. **Genau das wäre die stille Rückabwicklung von E-056.**
 *
 * Die Kanban-Spalte geht durch beide Zustände unverändert mit: Erledigen und
 * Spalte sind zwei Achsen (E-023), und diese Buchung fasst die zweite nicht an.
 */
const bookingStates = (
  todo: {
    readonly tagIds: readonly TagId[];
    readonly statusId: StatusId;
    readonly completedAt: Timestamp | null;
  },
  entries: { readonly hasOpenEntries: boolean; readonly hasExportedEntries: boolean },
): { readonly before: PoolCandidate; readonly after: PoolCandidate } => ({
  before: {
    tagIds: todo.tagIds,
    statusId: todo.statusId,
    completedAt: todo.completedAt,
    hasOpenEntries: entries.hasOpenEntries,
    hasExportedEntries: entries.hasExportedEntries,
  },
  after: {
    tagIds: todo.tagIds,
    statusId: todo.statusId,
    completedAt: null,
    hasOpenEntries: true,
    hasExportedEntries: entries.hasExportedEntries,
  },
});

export type AddinMatchResult =
  /**
   * Es wurde **nicht gesucht**, weil der Wert keine plausible Call-Nummer ist
   * (B-4.3 Punkt 4). Bewusst ein eigener Fall und nicht „keine Treffer": Das
   * Add-in soll sagen können, warum es nichts anbietet.
   *
   * `CallNumberRejection` statt `string` (T-046): Der Grund kommt wörtlich aus
   * `checkCallNumber`, und der Router beschriftet ihn über einen `Record` über
   * denselben Typ. Als `string` konnte der Router nur raten und brauchte einen
   * Ersatztext; jetzt bricht `tsc`, wenn die Domäne einen Grund aufnimmt, für
   * den niemand einen Satz geschrieben hat.
   */
  | { readonly kind: 'not_searched'; readonly reason: CallNumberRejection }
  | { readonly kind: 'searched'; readonly callNumber: string; readonly matches: readonly AddinTodoMatch[] };

/**
 * Sucht Todos mit derselben Call-Nummer (A-10.9).
 *
 * Der erste Schritt ist die Plausibilisierung, und er ist der wichtige: Ein
 * leerer, ein nur aus Leerzeichen bestehender und ein unplausibler Wert führen
 * **nie** zu einer Abfrage. Genau hier bricht die Kette aus R-15 — ein zu
 * weiter regulärer Ausdruck kann noch so viel „erkennen", es entsteht kein
 * Übereinstimmungskriterium daraus.
 */
export const findMatches = async (
  deps: AddinDeps,
  rawCallNumber: unknown,
): Promise<AddinMatchResult> => {
  const checked = checkCallNumber(rawCallNumber);
  if (!checked.ok) {
    return { kind: 'not_searched', reason: checked.reason };
  }

  const callNumber = checked.value;

  return deps.inTransaction(async (unit) => {
    const found = await unit.todos.findByCallNumber(callNumber);
    const movementOf = await poolNamer(unit);

    const matches = await Promise.all(
      found.map(async (todo): Promise<AddinTodoMatch> => {
        const [openSeconds, exportedSeconds] = await Promise.all([
          unit.timeEntries.sumSeconds({ todoId: todo.id, exportStatus: 'open' }),
          unit.timeEntries.sumSeconds({ todoId: todo.id, exportStatus: 'exported' }),
        ]);

        // `> 0` heißt „es gibt mindestens eine solche Buchung" und nicht bloß
        // „es ist Zeit zusammengekommen": Eine Buchung hat mindestens eine
        // Sekunde (`CHECK duration_seconds >= 1` aus Migration 0001), eine
        // laufende trägt `NULL` und fällt aus der Summe, und eine exportierte
        // ist gesperrt und kann nachträglich nicht auf null schrumpfen. Beide
        // Zahlen stehen ohnehin schon da — ein zweiter Port dafür wäre Fläche
        // am Add-in-Token ohne Zuwachs an Wahrheit.
        const movement = movementOf(
          bookingStates(todo, {
            hasOpenEntries: openSeconds > 0,
            hasExportedEntries: exportedSeconds > 0,
          }),
        );

        return {
          id: todo.id,
          title: todo.title,
          callNumber: todo.callNumber,
          statusId: todo.statusId,
          tagIds: todo.tagIds,
          completedAt: todo.completedAt,
          openSeconds,
          exportedSeconds,
          poolNames: movement.appears,
          enteringPoolNames: movement.enters,
          leavingPoolNames: movement.leaves,
        };
      }),
    );

    return { kind: 'searched', callNumber, matches };
  });
};

// ---------------------------------------------------------------------------
// A-10.5 / A-9.5 — ein Todo aus der E-Mail anlegen
// ---------------------------------------------------------------------------

export interface AddinCreateTodoInput {
  readonly title: string;
  /** Bereits geprüft; `null` heißt „keine erkannt und keine eingetragen". */
  readonly callNumber: string | null;
  readonly statusId: StatusId | null;
  /** Die vom Benutzer ausdrücklich gewählten Tags. Ohne die Standard-Tags. */
  readonly tagIds: readonly TagId[];
  /**
   * Tags, die über ihren **Namen** benannt werden statt über eine Kennung
   * (T-058, T-061).
   *
   * Gibt es den Namen schon, wird das vorhandene Tag verwendet; gibt es ihn
   * nicht, entsteht eines — in **derselben** Transaktion wie das Todo. Wortlaut
   * und Wirkung sind dieselben wie bei `CreateTodoInput.tagNames` in
   * `usecases/todos.ts`; das ist keine Ähnlichkeit, sondern die Bedingung
   * dafür, dass A-9.5 und T-058 auf beiden Wegen dasselbe bedeuten.
   *
   * Freiwillig, damit ein Aufrufer, der nur Kennungen benennt, nichts
   * hinschreiben muss. Die Route setzt über ihr Schema ohnehin `[]` ein.
   */
  readonly tagNames?: readonly string[];
  /** Der **interne Vermerk** (A-7.1, A-7.2). Nicht die Leistung. */
  readonly note: string;
}

export interface AddinCreateTodoResult {
  readonly todo: Todo;
  /** Welche Tags der Dienst ergänzt hat. Für die Rückmeldung in S-12. */
  readonly addedDefaultTagIds: readonly TagId[];
  /**
   * Welche Tags durch `tagNames` **neu entstanden** sind (T-058, T-061).
   *
   * Vollständige Tags und nicht nur Kennungen — genau wie bei `POST /todos`.
   * Der Aufgabenbereich zeigt den neuen Namen unmittelbar in der
   * Erfolgsmeldung, ohne `GET /addin/context` erneut zu holen; und der
   * Benutzer sieht, **dass** etwas Neues entstanden ist und nicht nur, dass
   * sein Todo angelegt wurde. Leer, wenn jeder genannte Name schon ein Tag
   * hatte.
   */
  readonly createdTags: readonly Tag[];
}

/**
 * Legt ein Todo an (A-2.1, A-10.5, A-9.5, T-058).
 *
 * **A-9.5 hängt an diesen Zeilen.** Die Standard-Tags werden hier ergänzt, im
 * Dienst, mit `applyDefaultTags` aus `packages/domain` — derselben Funktion,
 * die auch die Oberfläche benutzt. Es gibt keinen zweiten Erzeugungspfad, der
 * abweichen könnte, und das Add-in schickt die Standard-Tags nicht mit. Ein
 * Aufrufer, der sie vergisst, kann sie damit nicht vergessen.
 *
 * `note` geht in den **internen Vermerk**, nicht in eine Buchungsnotiz
 * (B-12.3 Punkt 1). Aus einer E-Mail übernommener Text ist Kontext und gehört
 * nicht ungefragt an das Abrechnungstool.
 *
 * ---------------------------------------------------------------------------
 * Neue Tags: eine Transaktion, nicht zwei (T-061)
 * ---------------------------------------------------------------------------
 *
 * `tagNames` sind Namen statt Kennungen. Sie werden **innerhalb** derselben
 * Transaktion aufgelöst, in der das Todo entsteht, und zwar durch **dieselbe**
 * Funktion, die auch `createTodo` in `usecases/todos.ts` benutzt:
 * `resolveTagNames` aus `usecases/tag-names.ts`. Bis T-062 stand hier eine
 * zweite, abgeschriebene Fassung — nicht aus Nachlässigkeit, sondern weil die
 * erste nicht exportiert war. Seit T-064 gibt es nur noch eine, und damit ist
 * die Gleichheit beider Wege keine Zusicherung mehr, sondern eine Tatsache:
 *
 *  - **Ein Tag, nicht zwei.** Zwei gleichzeitige Anfragen laufen nie
 *    ineinander (`TransactionPort` reiht sie), die zweite sieht das Tag der
 *    ersten und verwendet es. Fiele die Reihung, wiese `ux_tag_name_key` den
 *    zweiten gleichen Schlüssel strukturell ab. Der Schutz sitzt im Dienst und
 *    in der Datenbank, nicht in dieser Datei — deshalb trägt er für den
 *    Add-in-Weg genauso.
 *  - **Kein Tag ohne sein Todo.** Scheitert das Anlegen, ist auch das Tag
 *    wieder weg (`AbortTodoCreate`).
 *
 * Die Prüfung der Namen steht **davor** und ist rein: `checkTagNames` aus der
 * Domäne normalisiert, prüft und wirft Doppelte **innerhalb derselben Anfrage**
 * weg. Ohne diesen Schritt liefen „Backend" und „backend" in einer Anfrage in
 * den eindeutigen Index — für den Benutzer ein Name, für die Datenbank zwei.
 *
 * Der Fehlschlag ist ein **Wert** (`Result`) und kein Wurf: Ein Tagname, den es
 * zweimal gibt, ist eine Eingabe des Benutzers und kein Programmierfehler.
 */
export const createTodo = async (
  deps: AddinDeps,
  input: AddinCreateTodoInput,
): Promise<Result<AddinCreateTodoResult, TaktError>> => {
  // Rein, und deshalb vor der Transaktion: Eine unzulässige Eingabe soll gar
  // keine Klammer öffnen.
  const names = checkTagNames(input.tagNames ?? []);
  if (!names.ok) return err(names.error);

  try {
    return await deps.inTransaction(async (unit) => {
      const now = deps.now();
      const resolved = await resolveTagNames(unit, names.value, now);

      // Erst die ausdrücklich gewählten, dann die über den Namen benannten —
      // dieselbe Reihenfolge wie in `usecases/todos.ts`. `applyDefaultTags`
      // fasst Doppelte zusammen, ohne die Reihenfolge zu verschieben.
      const selected: readonly TagId[] = [
        ...input.tagIds,
        ...resolved.all.map((tag) => tag.id),
      ];

      const defaults = await unit.defaultTags.list();
      const effectiveTagIds = applyDefaultTags(selected, defaults);

      const statusId = input.statusId ?? (await unit.statuses.defaultStatus()).id;

      const todo = await unit.todos.create(
        {
          title: input.title,
          callNumber: input.callNumber,
          statusId,
          // Beide Stellen tragen dieselbe, bereits ergänzte Liste. Der Vertrag
          // von `TodoPort.create` führt `tagIds` zweimal — einmal im Eingabewert,
          // einmal als zweites Argument — und legt nicht fest, welche der beiden
          // der Adapter liest. Solange der Adapter aus T-009 fehlt, ist das eine
          // offene Frage; sie hier durch Gleichheit zu beantworten kostet nichts
          // und kann A-9.5 nicht brechen. Ein Unterschied zwischen beiden wäre
          // die Art Annahme, die man erst in einer Abrechnung bemerkt.
          tagIds: effectiveTagIds,
          note: input.note,
          now,
        },
        effectiveTagIds,
      );

      const chosen = new Set<TagId>(selected);

      return ok({
        todo,
        addedDefaultTagIds: effectiveTagIds.filter((tagId) => !chosen.has(tagId)),
        createdTags: resolved.fresh,
      });
    });
  } catch (error) {
    // Die Klammer hat bereits zurückgenommen — auch die Tags, die vor dem
    // Abbruch entstanden sind. Hier steht nur noch die Antwort.
    if (error instanceof AbortTodoCreate) return err(error.failure);

    // Kein fachlicher Fall. Der Wurf bleibt ein Wurf und endet als 500 mit
    // einem Satz ohne Innenleben (B-2.4).
    throw error;
  }
};

// ---------------------------------------------------------------------------
// A-10.9 — auf ein vorhandenes Todo buchen
// ---------------------------------------------------------------------------

export interface AddinBookInput {
  readonly todoId: TodoId;
  readonly startedAt: Timestamp;
  readonly endedAt: Timestamp;
  /** Die **Leistung** (A-7.3). Sie geht in die Abrechnung (A-7.4). */
  readonly note: string;
}

/*
 * Hier stand bis T-038 ein `reopenIfDone: boolean` mit der Vorgabe `false`.
 *
 * Die Begründung — A-2.5 knüpfe die Aufhebung an den *Timerstart*, eine
 * nachgetragene Buchung sei etwas anderes — war eine Auslegung, und sie war
 * falsch. A-2.5 sagt „automatisch"; E-023 hat daran nur geklärt, dass die
 * Kanban-Spalte unangetastet bleibt, nicht dass die Aufhebung freiwillig wird.
 * Der Preis der Auslegung stand im Befund C-03 aus T-025: Wer aus Outlook auf
 * ein erledigtes Todo buchte, hatte danach eine Buchung auf einem Vorgang, der
 * weiterhin als erledigt galt und in keinem Pool auftauchte — dieselbe
 * Handlung, zwei Ergebnisse, je nachdem ob sie in der Hauptanwendung oder im
 * Add-in geschah.
 *
 * Es gibt deshalb **keinen** Schalter mehr, auch keinen mit der Vorgabe
 * „aufheben". Ein Schalter wäre eine Einladung, die beiden Wege wieder
 * auseinanderlaufen zu lassen. Ein Aufrufer, der das Feld weiterhin schickt,
 * ändert damit nichts: Die Eingabeprüfung kennt es nicht mehr und wirft es
 * weg (siehe `schema.ts`). Sichtbar gemacht wird die Wirkung dort, wo sie
 * hingehört — **vor** der Entscheidung im Aufgabenbereich (A-10.9) und in der
 * Antwort dieser Route (`doneCleared`, `poolNames`).
 */

export type AddinBookResult =
  | { readonly kind: 'not_found' }
  | { readonly kind: 'rejected'; readonly code: string; readonly message: string }
  | {
      readonly kind: 'booked';
      readonly timeEntry: TimeEntry;
      /** War das Todo vor dieser Buchung als erledigt gekennzeichnet? */
      readonly todoWasDone: boolean;
      /**
       * Wurde „Erledigt" durch diese Buchung aufgehoben?
       *
       * Seit T-038 gilt: `doneCleared === todoWasDone`. Beide Felder bleiben
       * stehen, weil sie zwei verschiedene Dinge aussagen — „war erledigt" ist
       * der Vorzustand, „aufgehoben" die Wirkung — und weil ein Aufrufer, der
       * nur eines von beiden liest, so oder so das Richtige liest. Dass sie
       * nicht mehr auseinanderfallen **können**, ist der Kern der Nacharbeit;
       * der Nachweispfad hält genau das fest.
       */
      readonly doneCleared: boolean;
      /**
       * Die Pools, in denen das Todo nach dieser Buchung steht — beim Namen
       * (I-05).
       *
       * Aus derselben Quelle **und demselben Zustandspaar** wie in der
       * Duplikatsuche (`bookingStates`), damit der Satz vor der Buchung und der
       * Satz danach nicht auseinandergehen. Eine leere Liste ist eine Aussage
       * und kein Fehlen: Auf dieses Todo passt derzeit keine Poolregel.
       */
      readonly poolNames: readonly string[];
      /**
       * Die Pools, in die diese Buchung das Todo **hineinbewegt** hat (T-084).
       *
       * Teilmenge von `poolNames`, aus demselben Zustandspaar. Sie ist der
       * Unterschied zwischen „das Todo steht in diesen Pools" und „durch diese
       * Buchung ist es dort neu" — und nur die zweite Aussage ist eine
       * Nachricht wert, wenn das Todo gar nicht erledigt war und deshalb auch
       * nichts aufgehoben wurde.
       */
      readonly enteringPoolNames: readonly string[];
      /**
       * Die Pools, aus denen diese Buchung das Todo entfernt hat (E-056).
       *
       * Dieselbe Rechnung wie in der Duplikatsuche, damit die Ankündigung und
       * die Bestätigung auch in dieser Hälfte übereinstimmen. Fast immer leer;
       * der Aufgabenbereich sagt dann nichts darüber.
       */
      readonly leavingPoolNames: readonly string[];
    };

/**
 * Bucht Zeit auf ein vorhandenes Todo (A-6.1, A-10.9) und hebt „Erledigt"
 * dabei **automatisch** auf (A-2.5, I-05).
 *
 * Drei Wirkungen, eine Transaktion:
 *
 *  1. Die Buchung entsteht.
 *  2. War das Todo erledigt, fällt das Kennzeichen — ohne Nachfrage, ohne
 *     Schalter, wie beim Timerstart in der Hauptanwendung.
 *  3. Damit steht das Todo wieder in seinen Pools. Ohne einen einzigen
 *     Schreibvorgang: Die Mitgliedschaft hing nie am Kennzeichen (A-3.4), nur
 *     die Sichtbarkeit (`isVisibleInPool`).
 *
 * Was **nicht** geschieht, ist ebenso wichtig: Die Kanban-Spalte bleibt, wo sie
 * ist (E-023). Erledigt und Spalte sind zwei Achsen; das Erledigen hat nie
 * verschoben, also gibt es nichts zurückzuschieben.
 *
 * Alles in **einer** Transaktion. Sonst gäbe es einen Zustand, in dem die Zeit
 * gebucht ist, das Todo aber noch als erledigt geführt wird und damit in seiner
 * Pool-Ansicht nicht auftaucht (E-039) — genau der Zustand, den C-03 als
 * Dauerzustand beschrieben hat.
 *
 * Scheitert das Aufheben, scheitert die **ganze** Buchung (`rejected`, die
 * Transaktion rollt zurück). Eine Buchung ohne die zugehörige Aufhebung
 * durchgehen zu lassen, wäre wieder der halbe Zustand.
 */
export const bookOnTodo = (deps: AddinDeps, input: AddinBookInput): Promise<AddinBookResult> =>
  deps.inTransaction(async (unit) => {
    const now = deps.now();
    const todo = await unit.todos.load(input.todoId);
    if (todo === null) {
      return { kind: 'not_found' };
    }

    /*
     * Die Buchungslage **vor** der Buchung, und deshalb steht sie vor ihr.
     *
     * Nach `timeEntries.create` wäre die offene Summe unbrauchbar: Sie
     * enthielte die soeben entstandene Buchung und wäre damit der Zustand
     * danach, nicht davor. Für `leavingPoolNames` (E-056) wird aber genau der
     * Zustand davor gebraucht — sonst gibt es nichts, aus dem etwas
     * verschwinden könnte.
     *
     * Beide Summen in einem Zug und innerhalb derselben Transaktion: Ein
     * Exportlauf, der dazwischenliefe, dürfte den Satz nicht mehr verschieben,
     * den der Aufgabenbereich gleich anzeigt.
     */
    const [openBefore, exportedBefore] = await Promise.all([
      unit.timeEntries.sumSeconds({ todoId: input.todoId, exportStatus: 'open' }),
      unit.timeEntries.sumSeconds({ todoId: input.todoId, exportStatus: 'exported' }),
    ]);

    const created = await unit.timeEntries.create(
      {
        todoId: input.todoId,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        note: input.note,
      },
      now,
    );

    if (!created.ok) {
      return { kind: 'rejected', code: created.error.code, message: created.error.message };
    }

    const todoWasDone = todo.completedAt !== null;

    if (todoWasDone) {
      const reopened = await unit.todos.clearDone(input.todoId, now);
      if (!reopened.ok) {
        return { kind: 'rejected', code: reopened.error.code, message: reopened.error.message };
      }
    }

    const movementOf = await poolNamer(unit);

    // `todo` ist der Stand **vor** der Buchung — `load` lief davor, und
    // `clearDone` gibt seinen neuen Wert nicht hierher zurück. Genau so wird er
    // gebraucht: `bookingStates` rechnet aus ihm **beide** Zustände aus. Wer
    // hier den Stand von danach einsetzte, bekäme zwei gleiche Zustände und
    // damit für immer ein leeres `leavingPoolNames` — E-056 wäre still wieder
    // abgeschafft.
    const movement = movementOf(
      bookingStates(todo, {
        hasOpenEntries: openBefore > 0,
        hasExportedEntries: exportedBefore > 0,
      }),
    );

    return {
      kind: 'booked',
      timeEntry: created.value,
      todoWasDone,
      // Es gibt keinen Weg mehr, auf dem diese beiden Werte auseinanderfallen.
      doneCleared: todoWasDone,
      poolNames: movement.appears,
      enteringPoolNames: movement.enters,
      leavingPoolNames: movement.leaves,
    };
  });

