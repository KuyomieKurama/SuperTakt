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
  PoolMovement,
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
import { applyDefaultTags, checkCallNumber, checkTagNames, err, ok } from '@takt/domain';

/*
 * Die Bewegung eines Todos durch die Pools kommt seit T-092 aus dem
 * Anwendungsfall und nicht mehr aus dieser Datei (E-058 Absatz 1), und seit
 * T-104 gilt dasselbe für das **Zustandspaar** davor (E-061 Punkt 2).
 *
 * `matchesPool` und `tagAxisIsUnresolved` sind mit `poolNamer` aus der
 * Importliste oben verschwunden — und das ist die eigentliche Aussage dieser
 * Zeile: Im Add-in-Dienst wird keine Poolregel mehr ausgewertet. Wer sie hier
 * wieder importiert, baut die zweite Fassung neu, die E-058 aufgehoben hat.
 *
 * `BOOKING_EFFECT` stand bis T-104 als eigener Wert in dieser Datei; die
 * Konstante liegt jetzt in `packages/domain` und wird hier nicht mehr
 * geschrieben, sondern angewendet. Was eine Buchung an einem Todo ändert, ist
 * Fachwissen (E-061 Punkt 1); `bookingMovementStates` aus dem Anwendungsfall
 * setzt es auf einen gelesenen Bestand um. Wer die zwei Achsen hier wieder
 * hinschreibt, hat die vierte Abschrift, die E-061 aufgehoben hat.
 */
import {
  bookingMovementStates,
  poolMovementNamer,
  type BookingPresenceBefore,
  type MovingTodo,
  type PoolMovementNamer,
} from '../../usecases/pool-movement.ts';
import { AbortTodoCreate, resolveTagNames } from '../../usecases/tag-names.ts';

import type { AddinDeps } from './ports.ts';

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
   * Wie eine Buchung auf dieses Todo es durch die Pools bewegen **würde** —
   * oder `null` (I-05, T-038, T-078, E-056, E-061 Punkt 3).
   *
   * ---------------------------------------------------------------------------
   * Ein Wert statt dreier Listen (E-061 Punkt 3)
   * ---------------------------------------------------------------------------
   *
   * Bis T-104 standen hier `poolNames`, `enteringPoolNames` und
   * `leavingPoolNames` — dieselbe Auskunft in einer zweiten Gestalt, die es
   * sonst nirgends über HTTP gab. `POST /timer/start`, `/timer/stop`,
   * `/timer/orphaned/resolve` und seit E-060 auch `PUT`/`DELETE
   * /todos/{todoId}/done` liefern `poolMovement`; zwei Formen für eine Sache
   * heißt, dass jede Fläche beide kennen muss und die Umrechnung an vier Stellen
   * steht. Die Bedeutungen sind unverändert: `appears` ist das alte
   * `poolNames`, `enters` das alte `enteringPoolNames`, `leaves` das alte
   * `leavingPoolNames` (siehe `PoolMovement` in `@takt/domain`).
   *
   * ---------------------------------------------------------------------------
   * Steht **vor** der Entscheidung da, nicht erst danach
   * ---------------------------------------------------------------------------
   *
   * Ist das Todo erledigt, hebt eine Buchung darauf das Kennzeichen automatisch
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
   *
   * ---------------------------------------------------------------------------
   * Wann `null` steht — und wann ausdrücklich nicht
   * ---------------------------------------------------------------------------
   *
   * `null` heißt „hier war keine Bewegung möglich": Das Todo ist offen und hat
   * schon eine offene Buchung, die Buchung ändert also keine der fünf Achsen.
   * Dieselbe Bedeutung wie an den Timer-Routen, und aus demselben Grund keine
   * drei leeren Listen — die hießen „nachgesehen und nichts gefunden" und
   * kosteten das Auflösen jeder Regel über beliebig tiefe Ordnerbäume.
   *
   * Für ein **erledigtes** Todo steht hier deshalb immer ein Wert: Die Buchung
   * hebt „Erledigt" auf, die beiden Zustände sind verschieden, und der Satz
   * über die Rückkehr braucht `appears` (Anlass `'reopen'`, der auch ohne jeden
   * Treffer etwas zu sagen hat).
   */
  readonly poolMovement: PoolMovement | null;
}

/**
 * Die Bewegung, die eine Buchung auf dieses Todo auslöst — oder `null`
 * (E-058, E-061 Punkt 2, T-104).
 *
 * ---------------------------------------------------------------------------
 * Warum beide Add-in-Routen durch **diese** Funktion gehen
 * ---------------------------------------------------------------------------
 *
 * Weil sie über dieselbe Handlung reden: die Duplikatsuche als Ankündigung
 * („Es erscheint dann …") und `bookOnTodo` als Bestätigung („Es steht jetzt
 * …"). Sagten sie Verschiedenes über deren Wirkung, sagte die Ankündigung
 * etwas anderes als die Bestätigung — Befund C-03 aus T-025, eine Ebene
 * tiefer. Bis T-104 stand dafür ein `BOOKING_EFFECT` in dieser Datei und das
 * Zustandspaar zweimal von Hand; beides ist mit E-061 in
 * `packages/domain` beziehungsweise `usecases/pool-movement.ts` gewandert.
 *
 * ---------------------------------------------------------------------------
 * Die erste Zeile ist die ganze Sparsamkeit dieser Funktion
 * ---------------------------------------------------------------------------
 *
 * Ein offenes Todo mit einer offenen Buchung geht durch die Buchung in keiner
 * Achse anders hervor, als es hineingeht: `completedAt` stand schon auf `null`,
 * „hat offene Buchungen" schon auf wahr. Das Zustandspaar wäre zweimal
 * derselbe Wert, die Antwort drei leere Listen — und der Weg dorthin führte
 * über das Auflösen jeder Regel. Das ist der Normalfall, und er kostet hier
 * nichts. Deshalb nimmt die Funktion den Namensgeber als **Versprechen** und
 * nicht als Wert: Wo nichts zu rechnen ist, wird auch nichts aufgelöst.
 *
 * Umgekehrt ist der Zweig, der rechnet, genau der aus `movementOfStart` in
 * `usecases/timer.ts`: „Erledigt" fällt, oder die erste abgeschlossene Buchung
 * entsteht.
 */
const bookingMovement = async (
  namer: () => Promise<PoolMovementNamer>,
  todo: MovingTodo,
  entries: BookingPresenceBefore,
): Promise<PoolMovement | null> => {
  if (todo.completedAt === null && entries.hasOpen) return null;

  // Das Paar bildet der Anwendungsfall aus der Wirkung in der Domäne (E-061
  // Punkte 1 und 2). `todo` trägt dabei den echten Zustand von **jetzt**; wer
  // dort schon das Ergebnis einsetzte, bekäme zwei gleiche Zustände und damit
  // für immer ein leeres `leaves` — die stille Rückabwicklung von E-056.
  return (await namer())(bookingMovementStates(todo, entries));
};

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

    /*
     * Höchstens **einmal** je Anfrage, nicht einmal je Treffer, und seit T-104
     * gar nicht, wenn sich kein Treffer bewegt.
     *
     * Das Auflösen der Ordner über beliebig tiefe Bäume ist die teure Hälfte,
     * das Urteil über ein einzelnes Todo die billige
     * (`usecases/pool-movement.ts`) — deshalb wird der Namensgeber geteilt.
     * Gebaut wird er erst, wenn ihn der erste Treffer verlangt: Die häufigste
     * Trefferliste besteht aus offenen Todos mit gebuchter Zeit, und für die
     * gibt es nichts zu rechnen ({@link bookingMovement}).
     *
     * Das Zwischenergebnis ist das **Versprechen** und nicht der Wert: Die
     * Treffer werden nebenläufig beurteilt, und eine Zuweisung nach einem
     * `await` liefe zweimal. Die hier steht vor jedem `await`.
     */
    let namer: Promise<PoolMovementNamer> | null = null;
    const movementNamer = (): Promise<PoolMovementNamer> => (namer ??= poolMovementNamer(unit));

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
        //
        // `todo` geht als Zustand von **jetzt** hinein; die Wirkung der Buchung
        // legt {@link bookingMovement} darüber (E-061 Punkte 1 und 2).
        return {
          id: todo.id,
          title: todo.title,
          callNumber: todo.callNumber,
          statusId: todo.statusId,
          tagIds: todo.tagIds,
          completedAt: todo.completedAt,
          openSeconds,
          exportedSeconds,
          poolMovement: await bookingMovement(movementNamer, todo, {
            hasOpen: openSeconds > 0,
            hasExported: exportedSeconds > 0,
          }),
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
 * Antwort dieser Route (`doneCleared`, `poolMovement`).
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
       * Wie diese Buchung das Todo durch die Pools bewegt hat — oder `null`
       * (I-05, E-056, T-084, E-061 Punkt 3).
       *
       * Aus derselben Quelle **und demselben Zustandspaar** wie in der
       * Duplikatsuche ({@link bookingMovement}), damit der Satz vor der Buchung
       * und der Satz danach nicht auseinandergehen. `proof:addin` hält beide
       * Liste für Liste gegeneinander.
       *
       * Drei leere Listen sind eine Aussage und kein Fehlen: Auf dieses Todo
       * passt derzeit keine Regel. `null` ist die andere Aussage — es war hier
       * keine Bewegung möglich, weil das Todo offen war und schon eine offene
       * Buchung hatte. Beide Fälle führen im Aufgabenbereich zu keiner Zeile,
       * aber nur der zweite kostet keine Ordnerauflösung.
       */
      readonly poolMovement: PoolMovement | null;
    };

/**
 * Der geplante Abbruch einer Buchung (R-1 Befund 2).
 *
 * Dieselbe Bauart und dieselbe Begründung wie `AbortTodoCreate` in
 * `usecases/tag-names.ts`: Die Transaktionsklammer nimmt **nur bei einem Wurf**
 * zurück, ein fachlicher Fehlschlag ist aber kein Programmierfehler. Eine
 * eigene Klasse trennt beides — der `catch`-Zweig unterscheidet „geplanter
 * Abbruch" von „etwas ist kaputtgegangen", und nur das Zweite endet als 500.
 *
 * **Eine eigene Klasse und nicht `AbortTodoCreate`.** Deren Name sagt, was der
 * Abbruch mitnimmt („das Anlegen des Todos"), und genau darauf beruft sich der
 * Kommentar dort. Hier nimmt er die **Buchung** mit; ein Name, der das Falsche
 * behauptet, ist schlechter als eine zweite Zeile Code.
 *
 * Nicht exportiert: Sie wird in dieser Datei geworfen und in dieser Datei
 * gefangen. Wer sie außerhalb fängt, fängt einen Abbruch, dessen Klammer er
 * nicht geöffnet hat.
 */
class AbortBooking extends Error {
  /**
   * Ausgeschriebenes Feld statt einer Parametereigenschaft: Node führt
   * TypeScript nur durch Streichen der Typen aus, und eine
   * Parametereigenschaft müsste umgeschrieben werden.
   */
  readonly failure: TaktError;

  constructor(failure: TaktError) {
    super(failure.code);
    this.name = 'AbortBooking';
    this.failure = failure;
  }
}

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
 * Scheitert das Aufheben, scheitert die **ganze** Buchung: Der Anwendungsfall
 * **wirft** {@link AbortBooking}, die Klammer nimmt zurück, und erst außerhalb
 * wird daraus `rejected`. Eine Buchung ohne die zugehörige Aufhebung
 * durchgehen zu lassen, wäre wieder der halbe Zustand.
 *
 * ---------------------------------------------------------------------------
 * Warum ein Wurf und keine Rückgabe — seit T-090 (R-1 Befund 2)
 * ---------------------------------------------------------------------------
 *
 * Bis T-090 stand hier `return { kind: 'rejected' }`, und das war der teuerste
 * Fehler dieses Bestands. `createTransactionPort.run` nimmt **nur bei einem
 * Wurf** zurück; eine gewöhnliche Rückgabe führt zu `COMMIT`
 * (`packages/storage/src/sqlite/unit-of-work.ts`, und der Kopf dort sagt es
 * ausdrücklich: „Ein fachlicher Fehlschlag ist kein Wurf … er rollt also nicht
 * von selbst zurück"). Zwei Zeilen darüber war die Buchung bereits geschrieben.
 * Das Ergebnis: Die Zeit steht festgeschrieben in der Datenbank, das Todo gilt
 * weiter als erledigt, und der Aufgabenbereich meldet „abgewiesen" — der
 * Benutzer bucht erneut, und dieselbe Zeit geht **zweimal** in die Abrechnung.
 * Der Kommentar an dieser Stelle behauptete dabei genau das Gegenteil.
 *
 * Der Weg ist derselbe wie bei `createTodo` einen Abschnitt weiter oben
 * (`AbortTodoCreate` aus `usecases/tag-names.ts`): eine eigene Abbruchklasse,
 * geworfen innen, gefangen außen, dort in einen Wert übersetzt. Eine eigene
 * Klasse und keine allgemeine `Error`, damit der `catch`-Zweig „geplanter
 * Abbruch" von „etwas ist kaputtgegangen" unterscheiden kann; das Zweite bleibt
 * ein Wurf und endet als 500 im Protokoll.
 *
 * **Nicht** geworfen wird in den beiden Zweigen davor. `not_found` steht vor
 * jedem Schreibvorgang, und ein abgewiesenes `timeEntries.create` hat nichts
 * geschrieben — dort gibt es nichts zurückzunehmen, und ein Wurf wäre eine
 * Umständlichkeit ohne Wirkung.
 */
export const bookOnTodo = async (deps: AddinDeps, input: AddinBookInput): Promise<AddinBookResult> => {
  try {
    return await deps.inTransaction(async (unit) => {
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
       * danach, nicht davor. Für `poolMovement.leaves` (E-056) wird aber genau
       * der Zustand davor gebraucht — sonst gibt es nichts, aus dem etwas
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
        // Ein **Wurf** und keine Rückgabe: Die Buchung ein paar Zeilen darüber
        // ist geschrieben, und nur ein Wurf nimmt sie wieder zurück (R-1
        // Befund 2). Eine Rückgabe hier hieße `COMMIT` — festgeschriebene Zeit
        // bei gemeldetem Fehlschlag, und derselbe Zeitraum ein zweites Mal in
        // der Abrechnung, sobald der Benutzer es noch einmal versucht.
        if (!reopened.ok) throw new AbortBooking(reopened.error);
      }

      /*
       * `todo` ist der Stand **vor** der Buchung — `load` lief davor, und
       * `clearDone` gibt seinen neuen Wert nicht hierher zurück. Genau so wird
       * er gebraucht: Der Zustand von jetzt geht hinein, die Wirkung legt
       * {@link bookingMovement} darüber. Wer hier den Stand von danach
       * einsetzte, bekäme zwei gleiche Zustände und damit für immer ein leeres
       * `leaves` — E-056 wäre still wieder abgeschafft.
       *
       * Derselbe Aufruf wie in der Duplikatsuche: Die Ankündigung vor der
       * Buchung und die Bestätigung danach reden über dieselbe Bewegung, und
       * `proof:addin` hält sie Liste für Liste dagegen.
       *
       * Der Namensgeber entsteht innerhalb der Transaktion und nach dem
       * Schreiben: Er liest nur, gehört aber in dieselbe Klammer wie die
       * Handlung, über die er redet — sonst beurteilte er einen Bestand, den es
       * zum Zeitpunkt der Handlung nicht mehr gab.
       */
      const poolMovement = await bookingMovement(() => poolMovementNamer(unit), todo, {
        hasOpen: openBefore > 0,
        hasExported: exportedBefore > 0,
      });

      return {
        kind: 'booked',
        timeEntry: created.value,
        todoWasDone,
        // Es gibt keinen Weg mehr, auf dem diese beiden Werte auseinanderfallen.
        doneCleared: todoWasDone,
        poolMovement,
      };
    });
  } catch (error) {
    // Die Klammer hat bereits zurückgenommen — die Buchung ebenso wie das
    // Kennzeichen. Hier steht nur noch die Antwort, und es ist dieselbe, die
    // vor T-090 an der falschen Stelle stand.
    if (error instanceof AbortBooking) {
      return { kind: 'rejected', code: error.failure.code, message: error.failure.message };
    }

    // Kein fachlicher Fall. Der Wurf bleibt ein Wurf und endet als 500 mit
    // einem Satz ohne Innenleben (B-2.4).
    throw error;
  }
};

