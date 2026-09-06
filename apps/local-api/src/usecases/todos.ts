/**
 * Takt — Anwendungsfälle rund um Todos (A-2.*, A-5.*, A-7.1, A-9.5, A-10.9).
 *
 * Die eine Regel, die hier zwingend steht und nirgends sonst stehen darf:
 * **Standard-Tags kommen beim Anlegen dazu, im Anwendungsfall.** Nicht in der
 * Oberfläche und nicht im Add-in. Genau das verlangt A-9.5 — sonst griffe die
 * Regel nur auf einem der beiden Wege, und welcher das ist, merkte man erst,
 * wenn ein aus Outlook angelegtes Todo in keinem Pool auftaucht.
 */

import type {
  CalendarDay,
  DefaultTag,
  PoolMovement,
  StatusId,
  Tag,
  TagId,
  TimeEntry,
  Timestamp,
  Todo,
  TodoFilter,
  TodoId,
  TodoNote,
} from '@takt/domain';
import {
  applyDefaultTags,
  checkCallNumber,
  checkTagNames,
  err,
  normalizeCallNumber,
  ok,
  resolveTimeZone,
  taktError,
  toCalendarDay,
} from '@takt/domain';
import type { Page, Pagination, UnitOfWork } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from './context.ts';
import { NO_ENTRIES, completionMovementStates, poolMovementNamer } from './pool-movement.ts';
import { type AttachmentView, toAttachmentView } from './attachments.ts';
import { AbortTodoCreate, resolveTagNames } from './tag-names.ts';

export interface CreateTodoInput {
  readonly title: string;
  readonly callNumber: string | null;
  readonly statusId: StatusId | null;
  readonly tagIds: readonly TagId[];
  /**
   * Tags, die über ihren **Namen** benannt werden statt über eine Kennung
   * (T-058).
   *
   * Gibt es den Namen schon, wird das vorhandene Tag verwendet; gibt es ihn
   * nicht, entsteht eines. Beides geschieht in derselben Transaktion wie das
   * Anlegen des Todos — siehe `createTodo`.
   *
   * Freiwillig, und das ist eine Aussage: Ein Aufrufer, der Tags ausschließlich
   * über Kennungen benennt, soll nichts hinschreiben müssen. Die Route setzt
   * über ihr Schema ohnehin `[]` ein; das `?? []` unten gilt den Aufrufern
   * innerhalb des Dienstes.
   */
  readonly tagNames?: readonly string[];
  /** Der interne Vermerk (A-7.1). Geht **nie** in den Export (A-7.2). */
  readonly note: string;
  /**
   * Die Frist (A-19.1, A-19.3). `null` heißt „ohne Frist".
   *
   * Sie kommt **geprüft** herein: `checkDueDate` in der Domäne läuft an der
   * Tür, und zwar an jeder — auch an der des Add-ins (A-19.21, E-074 Punkt 4).
   * Dieser Anwendungsfall urteilt nicht noch einmal darüber, was ein Tag ist;
   * eine zweite, abweichende Fassung wäre genau das, was E-045 für die
   * Call-Nummer beseitigt hat.
   */
  readonly dueDate: CalendarDay | null;
}

export interface CreateTodoResult {
  readonly todo: Todo;
  /** Welche Tags durch A-9 dazugekommen sind. Für die Rückmeldung in der Oberfläche. */
  readonly addedDefaultTagIds: readonly TagId[];
  /**
   * Welche Tags durch `tagNames` **neu entstanden** sind (T-058).
   *
   * Vollständige Tags und nicht nur Kennungen: Die Oberfläche muss den neuen
   * Namen sofort an der Karte zeigen können, ohne den Tag-Baum erneut zu holen.
   * Leer, wenn jeder genannte Name schon ein Tag hatte.
   */
  readonly createdTags: readonly Tag[];
}

/**
 * Ein Todo anlegen (A-2.1, A-9.3, A-9.5, T-058).
 *
 * Der Vermerk geht als Teil von `TodoCreate` mit und wird vom Adapter in
 * derselben Transaktion geschrieben. Zwei Transaktionen ließen einen Zustand
 * zu, in dem das Todo da ist und sein Vermerk fehlt — und der Benutzer hätte
 * ihn eingegeben.
 *
 * ---------------------------------------------------------------------------
 * Neue Tags: eine Transaktion, nicht zwei
 * ---------------------------------------------------------------------------
 *
 * `tagNames` sind Tagnamen statt Kennungen. Sie werden **innerhalb** derselben
 * Transaktion aufgelöst, in der das Todo entsteht. Das ist die ganze Antwort
 * auf die Frage nach Wettläufen und doppelten Tags, und sie hat zwei Hälften:
 *
 *  - **Ein Tag, nicht zwei.** Zwei gleichzeitige Anfragen laufen nie ineinander
 *    (`TransactionPort` reiht sie), die zweite sieht das Tag der ersten und
 *    verwendet es. Sollte diese Reihung eines Tages fallen, weist
 *    `ux_tag_name_key` den zweiten gleichen Schlüssel strukturell ab.
 *  - **Kein Tag ohne sein Todo.** Scheitert das Anlegen des Todos, ist auch das
 *    Tag wieder weg. Umgekehrt hängt das Todo nie an einem Tag, das gleich
 *    wieder verschwindet.
 *
 * Die Prüfung der Namen steht **davor** und ist rein: `checkTagNames` in der
 * Domäne normalisiert, prüft und wirft Doppelte innerhalb derselben Anfrage
 * weg. Ohne diesen Schritt liefe „Backend“ und „backend“ in einer Anfrage in
 * den eindeutigen Index — für den Benutzer ein Name, für die Datenbank zwei.
 *
 * Die Auflösung selbst steht seit T-062 in `tag-names.ts` — **einmal**, für
 * diesen Weg und den des Add-ins. Sie stand vorher hier und war nicht
 * exportiert; das hat sie in `routes/addin/service.ts` ein zweites Mal
 * entstehen lassen.
 */
export async function createTodo(
  context: AppContext,
  input: CreateTodoInput,
): Promise<UseCaseResult<CreateTodoResult>> {
  const timestamp = now(context);
  const callNumber = normalizeCallNumber(input.callNumber);

  // Eine gesetzte Call-Nummer muss plausibel sein (E-045, B-4.3). Leer bleiben
  // darf sie (A-2.6) — das ist der Normalfall eines von Hand angelegten Todos.
  if (callNumber !== null && !checkCallNumber(callNumber).ok) {
    return err(
      taktError(
        'validation_error',
        'Diese Call-Nummer ist nicht zulässig. Erlaubt sind 3 bis 64 Zeichen aus Buchstaben, Ziffern, Punkt, Schrägstrich, Bindestrich und Unterstrich.',
      ),
    );
  }

  // Rein, und deshalb vor der Transaktion: Eine unzulässige Eingabe soll gar
  // keine Klammer öffnen.
  const names = checkTagNames(input.tagNames ?? []);
  if (!names.ok) return err(names.error);

  try {
    return await context.transactions.inTransaction(async (unit) => {
      const created = await resolveTagNames(unit, names.value, timestamp);

      // Erst die ausdrücklich gewählten, dann die über den Namen benannten.
      // `applyDefaultTags` fasst Doppelte zusammen, ohne die Reihenfolge zu
      // verschieben.
      const selected: readonly TagId[] = [...input.tagIds, ...created.all.map((tag) => tag.id)];

      const defaults = await unit.defaultTags.list();
      const effective = applyDefaultTags(selected, defaults);

      const todo = await unit.todos.create(
        {
          title: input.title,
          callNumber,
          statusId: input.statusId,
          // Die ausdrücklich gewählten Tags. Der Adapter schreibt das zweite
          // Argument — siehe den Vertrag von `TodoPort.create`.
          tagIds: selected,
          note: input.note,
          dueDate: input.dueDate,
          now: timestamp,
        },
        effective,
      );

      // Der Vermerk wird von `TodoPort.create` in derselben Transaktion
      // mitgeschrieben (siehe dort). Ein zweiter Schreibvorgang hier wäre eine
      // zweite Stelle, an der er entstehen kann — und die eine, die das Add-in
      // nicht durchläuft.

      const chosen = new Set<TagId>(selected);
      return ok({
        todo,
        addedDefaultTagIds: effective.filter((tagId) => !chosen.has(tagId)),
        createdTags: created.fresh,
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
}

export interface UpdateTodoInput {
  readonly title?: string;
  readonly callNumber?: string | null;
  readonly statusId?: StatusId;
  readonly tagIds?: readonly TagId[];
  /**
   * Drei Fälle (A-19.3): Das Feld **fehlt** heißt „unverändert", `null` heißt
   * „Frist entfernen", ein Tag heißt „setzen". Die Unterscheidung ist der
   * Grund für `exactOptionalPropertyTypes` in diesem Baum.
   */
  readonly dueDate?: CalendarDay | null;
}

export async function updateTodo(
  context: AppContext,
  id: TodoId,
  input: UpdateTodoInput,
): Promise<UseCaseResult<Todo>> {
  const timestamp = now(context);

  if (input.callNumber !== undefined && input.callNumber !== null) {
    const normalized = normalizeCallNumber(input.callNumber);
    if (normalized !== null && !checkCallNumber(normalized).ok) {
      return err(
        taktError('validation_error', 'Diese Call-Nummer ist nicht zulässig.'),
      );
    }
  }

  return context.transactions.inTransaction((unit) =>
    unit.todos.update(id, {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.callNumber === undefined
        ? {}
        : { callNumber: normalizeCallNumber(input.callNumber) }),
      ...(input.statusId === undefined ? {} : { statusId: input.statusId }),
      ...(input.tagIds === undefined ? {} : { tagIds: input.tagIds }),
      ...(input.dueDate === undefined ? {} : { dueDate: input.dueDate }),
      now: timestamp,
    }),
  );
}

export function listTodos(
  context: AppContext,
  filter: TodoFilter,
  pagination: Pagination,
): Promise<Page<Todo>> {
  return context.transactions.inTransaction((unit) => unit.todos.search(filter, pagination));
}

/**
 * Ein Todo mit allem, was die Detailansicht braucht — **ohne** den Vermerk.
 *
 * Der Vermerk ist eine eigene Ressource (`/todos/{id}/note`) und eine eigene
 * Abfrage. Ihn hier mitzuliefern wäre bequem und genau der Schritt, mit dem die
 * Trennung aus A-7.2 aufhört, strukturell zu sein: Sobald er an einem Todo
 * hängt, nimmt ihn irgendwann jemand versehentlich mit.
 */
export interface TodoDetail {
  readonly todo: Todo;
  /** Erfasste Zeit in Sekunden. Berechnet, nie gespeichert. */
  readonly totalSeconds: number;
  /** Offene, noch nicht exportierte Sekunden. Für die Kennzeichnung in der Liste. */
  readonly openSeconds: number;
  /** Die Anhänge (A-19.8, A-19.11). Leer, wenn es keine gibt. */
  readonly attachments: readonly AttachmentView[];
}

/*
 * ===========================================================================
 * Warum in dieser Antwort **kein** `dueState` steht
 * ===========================================================================
 *
 * Weil er sonst zweimal existierte, und die zweite Fassung wäre die falsche.
 *
 * E-073 Punkt 2 legt fest, **wann** der Zustand gerechnet wird: bei jedem
 * Zeichnen, zusätzlich bei `visibilitychange` und über einen Zeitgeber auf die
 * nächste Mitternacht. Das ist eine Eigenschaft der **Anzeige** — eine
 * Anwendung, die über Nacht offen bleibt, soll nicht bis zum nächsten Klick
 * „heute fällig" zeigen.
 *
 * Ein Feld in dieser Antwort trüge den Zustand zum Zeitpunkt der **Anfrage**.
 * Es wäre um 23:59 richtig und um 00:01 falsch, und die Oberfläche hätte
 * daneben ihren eigenen, jüngeren Wert. Zwei Werte über dieselbe Sache, von
 * denen einer altert — das ist die Doppelung, die dieser Bestand an sechs
 * Stellen bereits beseitigt hat (Rundung, Kalendertag, Quellenliste, …).
 *
 * Also: Der Dienst gibt den **Tag** heraus (`todo.dueDate`), und wer ihn
 * anzeigt, ruft `dueState(todo.dueDate, heute)` aus `@takt/domain`. Es gibt
 * genau eine Regel, sie liegt in der Domäne, und beide Flächen lesen sie.
 *
 * Serverseitig gerechnet wird der Zustand an genau einer Stelle, und dort muß
 * es sein: beim **Filtern** (`listTodos`). Eine Abfrage kann nicht jede Zeile
 * laden und die Oberfläche fragen; sie braucht den Vergleich in SQL. Auch dort
 * kommt er aus der Domäne (`dueComparison`), und `heute` entsteht in derselben
 * Funktion wie hier: {@link today}.
 */

/**
 * Der heutige Kalendertag — **derselbe** wie bei der Tagesgruppierung des
 * Exports (E-025, E-070 Punkt 2).
 *
 * Eine Funktion und keine Konstante: Sie liest die Uhr des Zusammenbaus bei
 * jedem Aufruf. Genau das ist die Umsetzung von „gerechnet, nicht gespeichert"
 * — und die Zeitzone kommt aus derselben Quelle wie überall sonst.
 *
 * `resolveTimeZone()` ohne Argument ist die Zone des Rechners. Sie steht hier
 * nicht als Einstellung: Eine zweite, abweichend eingestellte Zone wäre eine
 * Fehlerquelle ohne Nutzen (`kernel.ts`).
 */
export function today(context: AppContext): CalendarDay {
  return toCalendarDay(context.clock.now(), resolveTimeZone());
}

export async function loadTodo(
  context: AppContext,
  id: TodoId,
): Promise<UseCaseResult<TodoDetail>> {
  return context.transactions.inTransaction(async (unit) => {
    const todo = await unit.todos.load(id);
    if (todo === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));

    const sums = await unit.todos.sumSeconds([id]);
    const openSeconds = await unit.timeEntries.sumSeconds({ todoId: id, exportStatus: 'open' });
    const attachments = await unit.attachments.list(id);

    return ok({
      todo,
      totalSeconds: sums.get(id) ?? 0,
      openSeconds,
      attachments: attachments.map(toAttachmentView),
    });
  });
}

/**
 * Ein Todo löschen — und seine Bildkopien nehmen den Weg mit (A-A-18).
 *
 * ---------------------------------------------------------------------------
 * Warum das nicht `ON DELETE CASCADE` erledigt
 * ---------------------------------------------------------------------------
 *
 * Weil SQL kein Dateisystem kennt. Die **Zeilen** in `todo_attachment`
 * verschwinden von selbst (Migration 0015); die **Dateien** im
 * Bildverzeichnis nicht. Eine verwaiste Kopie ist Kundenmaterial ohne
 * Eigentümer — sie taucht in keiner Anzeige mehr auf, wandert aber in jede
 * Sicherung und in jeden Synchronisierungsordner (VG-3).
 *
 * Die Reihenfolge ist Inhalt: **erst lesen, dann löschen, dann die Dateien.**
 * Nach dem `COMMIT` ließen sich die Namen nicht mehr lesen; vor dem `COMMIT`
 * die Dateien zu entfernen hieße, sie bei einem Abbruch verloren zu haben,
 * während das Todo noch dasteht. Von den beiden möglichen Halbzuständen ist
 * „Zeile weg, Datei liegt noch" der behebbare.
 */
export async function removeTodo(context: AppContext, id: TodoId): Promise<UseCaseResult<void>> {
  const outcome = await context.transactions.inTransaction(async (unit) => {
    const images = await unit.attachments.imageTargets(id);
    const removed = await unit.todos.remove(id);
    if (!removed.ok) return err(removed.error);
    return ok(images);
  });

  if (!outcome.ok) return err(outcome.error);
  for (const name of outcome.value) {
    /*
     * Der Rückgabewert wird bewußt nicht in die Antwort getragen (T-159): Das
     * Todo **ist** gelöscht, und daran ändert eine liegengebliebene Kopie
     * nichts. Ein Abbruch mitten in dieser Schleife wäre der schlechtere
     * Ausgang — er ließe die übrigen Kopien liegen und meldete zugleich einen
     * Fehlschlag für einen Vorgang, der stattgefunden hat.
     *
     * Still ist er trotzdem nicht: `removeImage` schreibt den Fehlschlag mit
     * dem erzeugten Namen ins Protokoll, und der Wert steht hier für den, der
     * daraus später mehr machen will (etwa ein Aufräumen beim nächsten Start).
     */
    await context.attachmentBlobs.removeImage(name);
  }
  return ok(undefined);
}

/**
 * Das Todo nach dem Umlegen des Erledigt-Kennzeichens — und was das durch die
 * Pools bewegt hat (E-060).
 *
 * ---------------------------------------------------------------------------
 * Warum diese beiden Routen überhaupt eine Bewegung melden
 * ---------------------------------------------------------------------------
 *
 * Weil „Erledigt" seit E-055 eine **Achse** ist, nach der eine Regel fragen
 * darf. Ein Todo auf „erledigt" zu setzen nimmt es aus jeder Spalte mit
 * `completion: 'open'` heraus und trägt es in jede mit `completion: 'done'`
 * ein — dieselbe Bewegung, die ein Timerstart in die andere Richtung auslöst
 * und die `POST /timer/start` seit E-058 ansagt. Wer an einer Stelle Auskunft
 * gibt und an der anderen schweigt, sagt die halbe Wahrheit (E-060).
 *
 * `poolMovement` ist `null`, wenn das Kennzeichen sich gar nicht geändert hat
 * — zweimal „erledigt" hintereinander etwa. Dann ist nichts zu berichten, und
 * es wird auch keine einzige Regel aufgelöst.
 */
export interface TodoDoneResult {
  readonly todo: Todo;
  /** Wie das Umlegen das Todo durch die Pools bewegt — oder `null` (E-060). */
  readonly poolMovement: PoolMovement | null;
}

/**
 * Das Umlegen des Erledigt-Kennzeichens, für beide Richtungen (A-2.4, A-2.5,
 * E-060).
 *
 * Eine Funktion und nicht zwei: Setzen und Aufheben unterscheiden sich in
 * genau einem Aufruf an den Port. Alles übrige — den Zustand vorher lesen, die
 * Buchungslage lesen, das Zustandspaar bilden, die Bewegung rechnen — ist
 * Zeichen für Zeichen dasselbe, und zweimal geschrieben wäre es die Stelle, an
 * der die eine Richtung eines Tages etwas anderes meldet als die andere.
 *
 * **Beide Zustände sind gelesen und keiner geraten.** `before` kommt aus
 * `load`, `after` aus dem Rückgabewert des Ports — der trägt den Zeitstempel,
 * den die Speicherung wirklich geschrieben hat.
 *
 * Der Todo-Zugriff steht **vor** dem Schreiben. Danach wäre `completed_at`
 * bereits umgelegt, und woraus das Todo verschwindet, ließe sich nicht mehr
 * sagen — genau die Auskunft, die E-056 verlangt.
 */
async function switchTodoDone(
  context: AppContext,
  id: TodoId,
  write: (unit: UnitOfWork, timestamp: Timestamp) => Promise<UseCaseResult<Todo>>,
): Promise<UseCaseResult<TodoDoneResult>> {
  const timestamp = now(context);

  return context.transactions.inTransaction(async (unit) => {
    const before = await unit.todos.load(id);
    // Gibt es das Todo nicht, bildet der Port den Fehler — an genau einer
    // Stelle. Hier wird deshalb nichts behauptet und nichts weiter gelesen.
    const presence =
      before === null ? null : ((await unit.timeEntries.exportPresence([id])).get(id) ?? NO_ENTRIES);

    const written = await write(unit, timestamp);
    if (!written.ok) return err(written.error);

    const after = written.value;
    // Das Kennzeichen stand schon so — `markDone` schreibt dann nichts
    // (`AND completed_at IS NULL`). Nichts bewegt sich, und es wird keine
    // einzige Regel über ihre Ordnerbäume aufgelöst.
    if (before === null || presence === null || before.completedAt === after.completedAt) {
      return ok({ todo: after, poolMovement: null });
    }

    const namer = await poolMovementNamer(unit);
    return ok({
      todo: after,
      poolMovement: namer(completionMovementStates(before, presence, after.completedAt)),
    });
  });
}

/**
 * A-2.4 — Erledigt setzen.
 *
 * **Der Status bleibt** (E-023): Erledigt und Status sind zwei Achsen, und das
 * Erledigen hat den Status nie verändert. `markDone` schreibt allein
 * `completed_at`.
 *
 * **Die Kanban-Spalte bleibt deshalb nicht.** Bis T-117 stand hier das
 * Gegenteil — ein Einzeiler an derselben Funktion, die es ausrechnet. Seit
 * E-054 ist eine Spalte eine Regel und seit E-055 darf diese Regel nach
 * „Erledigt" fragen: Das Setzen nimmt das Todo aus jeder Spalte mit
 * `completion: 'open'` heraus und trägt es in jede mit `completion: 'done'`
 * ein. `switchTodoDone` rechnet genau das, über `list('all')` und damit über
 * reine Board-Spalten mit, und gibt es als `poolMovement` heraus (E-060).
 * Dieselbe Richtigstellung steht seit T-101 am Schreibpfad
 * (`packages/storage/src/sqlite/repo-todos.ts`, `markDone`); hier war sie
 * stehengeblieben (R-2a W-3, T-115).
 */
export function markTodoDone(
  context: AppContext,
  id: TodoId,
): Promise<UseCaseResult<TodoDoneResult>> {
  return switchTodoDone(context, id, (unit, timestamp) => unit.todos.markDone(id, timestamp));
}

/**
 * A-2.5 — „Erledigt" von Hand aufheben.
 *
 * Derselbe Vorgang, den der Timerstart auslöst, nur ohne Timer. Auch hier wird
 * keine Spalte wiederhergestellt und keine Pool-Zugehörigkeit geschrieben: Die
 * Zugehörigkeit ergibt sich aus der Regel (A-3.4, E-055) und ist nirgends
 * gespeichert. Was daraus folgt, sagt trotzdem jemand — deshalb `poolMovement`
 * (E-060).
 */
export function clearTodoDone(
  context: AppContext,
  id: TodoId,
): Promise<UseCaseResult<TodoDoneResult>> {
  return switchTodoDone(context, id, (unit, timestamp) => unit.todos.clearDone(id, timestamp));
}

/** Der interne Vermerk (A-7.1). Eigene Ressource, eigener Port, eigener Aufruf. */
export async function loadTodoNote(
  context: AppContext,
  id: TodoId,
): Promise<UseCaseResult<TodoNote>> {
  return context.transactions.inTransaction(async (unit) => {
    const todo = await unit.todos.load(id);
    if (todo === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
    const note = await unit.notes.load(id);
    return ok(note ?? { todoId: id, text: '', updatedAt: todo.updatedAt });
  });
}

export async function writeTodoNote(
  context: AppContext,
  id: TodoId,
  text: string,
): Promise<UseCaseResult<TodoNote>> {
  const timestamp = now(context);
  return context.transactions.inTransaction(async (unit) => {
    const todo = await unit.todos.load(id);
    if (todo === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
    return ok(await unit.notes.write(id, text, timestamp));
  });
}

/**
 * A-10.9, R-15 — gibt es schon ein Todo mit dieser Call-Nummer?
 *
 * Die Antwort unterscheidet **nicht gesucht** von **nichts gefunden**. Das ist
 * der Kern der Gegenmaßnahme aus B-4.3 Punkt 4: Ein leerer oder unplausibler
 * Wert erzeugt kein Übereinstimmungskriterium. „Nicht gesucht" ist eine Aussage
 * über die Eingabe; „kein Treffer" verkürzt jemand später zu „dann leg halt
 * an".
 */
export type DuplicateLookup =
  | { readonly kind: 'not_searched'; readonly reason: string }
  | {
      readonly kind: 'searched';
      readonly callNumber: string;
      readonly matches: readonly {
        readonly todo: Todo;
        readonly openSeconds: number;
        readonly exportedSeconds: number;
      }[];
    };

export async function findTodosByCallNumber(
  context: AppContext,
  raw: unknown,
): Promise<DuplicateLookup> {
  const check = checkCallNumber(raw);
  if (!check.ok) {
    return { kind: 'not_searched', reason: check.reason };
  }

  return context.transactions.inTransaction(async (unit) => {
    const todos = await unit.todos.findByCallNumber(check.value);

    const matches = [];
    for (const todo of todos) {
      // Offen und exportiert getrennt: Der Benutzer entscheidet über das
      // Duplikatangebot, und dafür muss er sehen, wieviel Zeit auf dem
      // gefundenen Todo bereits abgerechnet ist (A-10.9).
      const openSeconds = await unit.timeEntries.sumSeconds({
        todoId: todo.id,
        exportStatus: 'open',
      });
      const exportedSeconds = await unit.timeEntries.sumSeconds({
        todoId: todo.id,
        exportStatus: 'exported',
      });
      matches.push({ todo, openSeconds, exportedSeconds });
    }

    return { kind: 'searched' as const, callNumber: check.value, matches };
  });
}

/**
 * E-038 — die globale Suche trifft auch Zeitbuchungen.
 *
 * Zwei Listen in einer Antwort, keine gemischte. Ein Treffer in einer Leistung
 * ist etwas anderes als ein Treffer in einem Titel, und wer sie zusammenwirft,
 * muss sie in der Oberfläche wieder auseinandernehmen.
 */
export interface SearchResult {
  readonly todos: Page<Todo>;
  readonly timeEntries: readonly TimeEntry[];
}

export async function searchEverything(
  context: AppContext,
  term: string,
  pagination: Pagination,
): Promise<SearchResult> {
  return context.transactions.inTransaction(async (unit) => {
    const todos = await unit.todos.search({ search: term }, pagination);

    // Buchungen werden über die Todos ihrer Treffer gefunden **und** über den
    // Leistungstext. Der zweite Weg braucht keinen eigenen Port: Er ist ein
    // Filter auf derselben Suche, nur eine Ebene tiefer.
    const found = await unit.timeEntries.search({}, { limit: 200 });
    const needle = term.trim().toLowerCase();
    const timeEntries = found.items.filter((entry) =>
      entry.note.toLowerCase().includes(needle),
    );

    return { todos, timeEntries };
  });
}

/** Standard-Tags lesen und setzen (A-9.1, A-9.2). */
export function listDefaultTags(context: AppContext): Promise<readonly DefaultTag[]> {
  return context.transactions.inTransaction((unit) => unit.defaultTags.list());
}

export function setDefaultTags(
  context: AppContext,
  tagIds: readonly TagId[],
): Promise<readonly DefaultTag[]> {
  const timestamp: Timestamp = now(context);
  return context.transactions.inTransaction((unit: UnitOfWork) =>
    unit.defaultTags.set(tagIds, timestamp),
  );
}
