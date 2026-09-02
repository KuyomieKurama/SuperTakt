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
   * Die Pools, in denen dieses Todo Mitglied ist — beim Namen genannt (I-05,
   * T-038).
   *
   * Steht **vor** der Entscheidung in der Antwort und nicht erst danach. Ist
   * das Todo erledigt, hebt eine Buchung darauf das Kennzeichen automatisch
   * auf (A-2.5); der Aufgabenbereich kann damit vorher sagen, wo es danach
   * wieder auftaucht, statt den Benutzer hinterher suchen zu lassen.
   *
   * Mitgliedschaft, nicht Sichtbarkeit: `matchesPool` kennt den Erledigt-Status
   * nicht (A-3.4). Ein erledigtes Todo hat seinen Pool nie verlassen, es wurde
   * dort nur nicht angezeigt.
   */
  readonly poolNames: readonly string[];
}

/**
 * Baut eine Zuordnung „Tags eines Todos → Namen seiner Pools".
 *
 * Die Regeln werden **einmal** je Anfrage aufgelöst und danach nur noch gegen
 * Tagmengen gehalten. Die Entscheidung selbst fällt in `matchesPool` aus
 * `@takt/domain` — dieselbe Funktion, die auch die Pool-Ansicht der
 * Hauptanwendung benutzt. Eine zweite Fassung dieser Regel wäre der Anfang
 * zweier verschiedener Antworten auf dieselbe Frage.
 */
const poolNamer = async (unit: AddinUnit): Promise<(tagIds: readonly TagId[]) => readonly string[]> => {
  const pools = await unit.pools.list();
  const ordered = [...pools].sort((left, right) => left.position - right.position);

  const resolved = await Promise.all(
    ordered.map(async (pool) => ({
      name: pool.name,
      matchMode: pool.matchMode,
      ruleTagIds: await unit.pools.resolveRule(pool.id),
    })),
  );

  return (todoTagIds) =>
    resolved
      .filter((pool) =>
        matchesPool({ todoTagIds, ruleTagIds: pool.ruleTagIds, matchMode: pool.matchMode }),
      )
      .map((pool) => pool.name);
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
    const namePools = await poolNamer(unit);

    const matches = await Promise.all(
      found.map(async (todo): Promise<AddinTodoMatch> => {
        const [openSeconds, exportedSeconds] = await Promise.all([
          unit.timeEntries.sumSeconds({ todoId: todo.id, exportStatus: 'open' }),
          unit.timeEntries.sumSeconds({ todoId: todo.id, exportStatus: 'exported' }),
        ]);

        return {
          id: todo.id,
          title: todo.title,
          callNumber: todo.callNumber,
          statusId: todo.statusId,
          tagIds: todo.tagIds,
          completedAt: todo.completedAt,
          openSeconds,
          exportedSeconds,
          poolNames: namePools(todo.tagIds),
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
       * Aus derselben Quelle wie in der Duplikatsuche, damit der Satz vor der
       * Buchung und der Satz danach nicht auseinandergehen. Eine leere Liste
       * ist eine Aussage und kein Fehlen: Auf die Tags dieses Todos passt
       * derzeit keine Poolregel.
       */
      readonly poolNames: readonly string[];
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

    const namePools = await poolNamer(unit);

    return {
      kind: 'booked',
      timeEntry: created.value,
      todoWasDone,
      // Es gibt keinen Weg mehr, auf dem diese beiden Werte auseinanderfallen.
      doneCleared: todoWasDone,
      poolNames: namePools(todo.tagIds),
    };
  });

