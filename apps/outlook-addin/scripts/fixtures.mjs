/**
 * Takt — Prüfdaten und Attrappen für den Nachweispfad des Add-ins.
 *
 * **Alles hier ist erfunden.** Es gibt keinen Kunden „Musterbetrieb Nord", die
 * Call-Nummern `TCK-000042` und `TCK-000815` gehören zu keinem Vorgang, und die
 * Absenderadressen liegen unter `example.org` beziehungsweise `example.com` —
 * den von der IETF für genau diesen Zweck reservierten Namen (RFC 2606). Kein
 * Zugangsdatum, kein echter Name, keine echte Nummer (CLAUDE.md, B-11.1).
 *
 * Die Attrappe der Speicherung setzt genau den Ausschnitt um, den
 * `apps/local-api/src/routes/addin/ports.ts` verlangt — und keinen Zug mehr.
 * Sie ist damit zugleich der Beleg, dass dieser Ausschnitt vollständig ist.
 *
 * ---------------------------------------------------------------------------
 * Was diese Attrappe seit T-061 **nachbildet** statt zu vereinfachen
 * ---------------------------------------------------------------------------
 *
 * Zwei Eigenschaften des Betriebs sind hier nicht bequem weggelassen, weil an
 * ihnen hängt, ob aus zwei gleichzeitigen Anfragen ein Tag wird oder zwei:
 *
 *  1. **`inTransaction` reiht.** Wörtlich dieselbe Warteschlange wie
 *     `packages/storage/src/sqlite/unit-of-work.ts`: Die nächste Klammer
 *     beginnt erst, wenn die vorige **beendet** ist — ob erfolgreich oder
 *     nicht. Eine Attrappe, die `work(unit)` einfach aufruft, ließe zwei
 *     Klammern ineinanderlaufen und wäre bei genau der Frage stumm, die T-061
 *     stellt. Sie ist deshalb über `serializeTransactions: false` weiterhin zu
 *     haben — als **Gegenprobe**, die zeigt, dass die Messung rot werden kann.
 *  2. **Der Tagname ist eindeutig.** `tags.create` weist einen zweiten gleichen
 *     Vergleichsschlüssel mit `name_conflict` ab, wie `ux_tag_name_key` aus
 *     Migration 0008. Den Schlüssel rechnet `tagNameKey` aus `@takt/domain` —
 *     dieselbe Funktion, die auch der Dienst benutzt. Eine eigene Faltung hier
 *     wäre eine Attrappe, die eine andere Regel erzwingt als der Betrieb, und
 *     damit schlimmer als keine.
 */

import { normalizeTagName, tagNameKey } from '@takt/domain';

/**
 * Kennungen in der Gestalt aus der OpenAPI-Beschreibung: UUID Fassung 7.
 *
 * Sprechende Zeichenketten wie `tag-intern` wären lesbarer und wären falsch:
 * Die Eingabeprüfung der Add-in-Routen verlangt UUIDs, und eine Attrappe, die
 * eine schwächere Gestalt benutzt als der Betrieb, prüft die Prüfung nicht mit.
 * Die Namen der Konstanten tragen die Lesbarkeit, die Werte die Wahrheit.
 */
export const ID = Object.freeze({
  tagIntern:            '01931f4e-0000-7000-8000-0000000010a1',
  tagTodo:              '01931f4e-0000-7000-8000-0000000010a2',
  tagNichtAbgerechnet:  '01931f4e-0000-7000-8000-0000000010a3',
  tagMusterbetrieb:     '01931f4e-0000-7000-8000-0000000010a4',
  tagTurnuswartung:     '01931f4e-0000-7000-8000-0000000010a5',
  tagStoerung:          '01931f4e-0000-7000-8000-0000000010a6',

  folderKunden:         '01931f4e-0000-7000-8000-0000000020b1',
  folderNord:           '01931f4e-0000-7000-8000-0000000020b2',
  folderBetrieb:        '01931f4e-0000-7000-8000-0000000020b3',
  folderWartung:        '01931f4e-0000-7000-8000-0000000020b4',
  folderArt:            '01931f4e-0000-7000-8000-0000000020b5',
  // Ein Ordner **ohne Tags** — angelegt, noch nicht gefüllt. Genau der
  // Bestand, für den E-057 entschieden wurde, und ein Zustand, den jede
  // Einrichtung durchläuft.
  folderArchiv:         '01931f4e-0000-7000-8000-0000000020b6',

  statusBacklog:        '01931f4e-0000-7000-8000-0000000030c1',
  statusInArbeit:       '01931f4e-0000-7000-8000-0000000030c2',
  statusDone:           '01931f4e-0000-7000-8000-0000000030c3',

  poolWartung:          '01931f4e-0000-7000-8000-0000000040d1',

  todoStoerung:         '01931f4e-0000-7000-8000-0000000050e1',
  todoTurnus:           '01931f4e-0000-7000-8000-0000000050e2',
});

/**
 * Vier Ebenen Ordner (A-4.3): Kunden › Nord › Betrieb › Wartung.
 *
 * Dazu ein **leerer** Ordner „Archiv" auf Wurzelebene (E-057). Er trägt kein
 * Tag und keinen Unterordner und ändert damit an keiner Tagzählung etwas — er
 * ist der Bestand, an dem sich zeigen läßt, daß ein Ordnerterm ohne Treffer
 * eine Einschränkung ist und kein Neutralwert.
 */
export const buildTagTree = () => ({
  rootTags: [{ id: ID.tagIntern, folderId: null, name: 'Intern', color: '#7e8a9e' }],
  rootFolders: [
    {
      folder: { id: ID.folderKunden, parentId: null, name: 'Kunden' },
      tags: [],
      subfolders: [
        {
          folder: { id: ID.folderNord, parentId: ID.folderKunden, name: 'Nord' },
          tags: [{ id: ID.tagMusterbetrieb, folderId: ID.folderNord, name: 'Musterbetrieb Nord', color: '#2159da' }],
          subfolders: [
            {
              folder: { id: ID.folderBetrieb, parentId: ID.folderNord, name: 'Betrieb' },
              tags: [],
              subfolders: [
                {
                  folder: { id: ID.folderWartung, parentId: ID.folderBetrieb, name: 'Wartung' },
                  tags: [
                    { id: ID.tagTurnuswartung, folderId: ID.folderWartung, name: 'Turnuswartung', color: null },
                    { id: ID.tagStoerung, folderId: ID.folderWartung, name: 'Störung', color: '#ac2a22' },
                  ],
                  subfolders: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      folder: { id: ID.folderArt, parentId: null, name: 'Aufgabenart' },
      tags: [
        { id: ID.tagTodo, folderId: ID.folderArt, name: 'Todo', color: null },
        { id: ID.tagNichtAbgerechnet, folderId: ID.folderArt, name: 'Nicht abgerechnet', color: null },
      ],
      subfolders: [],
    },
    {
      // Leer, und zwar auch über Unterordner: Wer ihn in einer Regel nennt,
      // nennt eine Bedingung, die niemand erfüllt (E-057).
      folder: { id: ID.folderArchiv, parentId: null, name: 'Archiv' },
      tags: [],
      subfolders: [],
    },
  ],
});

const STATUSES = [
  { id: ID.statusBacklog, name: 'Backlog', position: 0, isDefault: true, color: null },
  { id: ID.statusInArbeit, name: 'In Arbeit', position: 1, isDefault: false, color: null },
  { id: ID.statusDone, name: 'Done', position: 2, isDefault: false, color: null },
];

/** Beispiel aus A-9.2: „Intern", „Todo", „Nicht abgerechnet". */
const DEFAULT_TAGS = [
  { tagId: ID.tagIntern, position: 0 },
  { tagId: ID.tagTodo, position: 1 },
  { tagId: ID.tagNichtAbgerechnet, position: 2 },
];

/**
 * Ein erfundener Pool über dem Ordner „Wartung" (A-3.1).
 *
 * `includeSubfolders` steht auf `true` und die Regel zeigt auf den tiefsten
 * Ordner des Baums. Damit prüft der Nachweispfad die Auflösung über mehrere
 * Ebenen mit und nicht nur den einfachen Fall.
 *
 * Die vier Achsen aus T-076 stehen ausdrücklich auf ihrem **Neutralwert** und
 * fehlen nicht. Das ist der Unterschied zwischen „diese Regel sagt dazu
 * nichts" und „diese Attrappe kennt das Feld nicht": Nur der erste Fall ist
 * der Bestand, den es im Betrieb gibt (jede Regel von vor T-076), und nur er
 * belegt, dass eine solche Regel weiterhin genau dieselben Todos trifft.
 */
export const DEFAULT_POOLS = [
  {
    id: ID.poolWartung,
    name: 'Wartung Nord',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 0,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [],
    statusIds: [],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

/** Alle Tags des Startbaums, flach — der Bestand, den die Attrappe kennt. */
const seedTags = () => {
  const tree = buildTagTree();
  const out = [...tree.rootTags];
  const walk = (nodes) => {
    for (const node of nodes) {
      out.push(...node.tags);
      walk(node.subfolders);
    }
  };
  walk(tree.rootFolders);
  return out;
};

/**
 * Attrappe der Speicherung.
 *
 * Kein SQL, aber dieselben Verträge: `Result`-Werte statt Würfe, `findByCallNumber`
 * auf **Gleichheit** und nicht auf Teilzeichenketten, `sumSeconds` über einen Filter,
 * eine reihende Transaktionsklammer und ein eindeutiger Tagname (siehe Kopf).
 *
 * Beide Nachbildungen lassen sich einzeln abschalten. Nicht der Bequemlichkeit
 * wegen: Sie sind die beiden Ebenen, die T-058 für den Wettlauf benannt hat,
 * und nur wer sie einzeln wegnehmen kann, kann zeigen, **dass** sie tragen.
 * Der Betrieb hat immer beide.
 *
 * The fake offers neither `clearDone` nor `timeEntries.create`: `AddinUnit` does not either (A-10.12, E-120).
 *
 * @param {{ serializeTransactions?: boolean, enforceUniqueTagName?: boolean }} [options]
 */
export const createFakeStore = (options = {}) => {
  const serializeTransactions = options.serializeTransactions ?? true;
  const enforceUniqueTagName = options.enforceUniqueTagName ?? true;

  const state = {
    todos: new Map(),
    notes: new Map(),
    tags: new Map(seedTags().map((tag) => [tag.id, tag])),
    timeEntries: [],
    nextId: 0,
  };

  const id = (prefix) => {
    state.nextId += 1;
    return `${prefix}-${String(state.nextId).padStart(4, '0')}`;
  };

  /**
   * Eine Kennung in der Gestalt aus der Beschreibung — UUID Fassung 7.
   *
   * Neu angelegte Tags bekommen sie, weil ihre Kennungen im Aufgabenbereich
   * unmittelbar wieder als `tagIds` verwendet werden und die Eingabeprüfung der
   * Route dort UUIDs verlangt. Eine Attrappe, die an dieser Stelle `tag-0001`
   * liefert, prüfte die Prüfung nicht mit.
   */
  const uuid = () => {
    state.nextId += 1;
    return `01931f4e-0000-7000-8000-${String(state.nextId).padStart(12, '9')}`;
  };

  const seedTodo = (todo) => {
    state.todos.set(todo.id, todo);
    return todo;
  };

  const unit = {
    todos: {
      load: async (todoId) => state.todos.get(todoId) ?? null,

      // Gleichheit, nicht `includes`. Eine Teilzeichenkettensuche fände
      // `TCK-000042` auch in `TCK-0000420` — genau die Art Treffer, aus der
      // R-15 einen Abrechnungsfehler macht.
      findByCallNumber: async (callNumber) =>
        [...state.todos.values()].filter((todo) => todo.callNumber === callNumber),

      create: async (input, tagIds) => {
        const now = input.now;
        const todo = seedTodo({
          id: id('todo'),
          title: input.title,
          callNumber: input.callNumber,
          statusId: input.statusId,
          boardRank: 'm',
          completedAt: null,
          /*
           * Die Frist (A-19.21, T-149).
           *
           * `?? null` wie im echten Adapter: `TodoCreateInput.dueDate` ist
           * freiwillig, und „fehlt" heißt beim Anlegen dasselbe wie `null`
           * (siehe `TodoCreateInput` in `@takt/domain`). Eine Attrappe, die
           * das Feld gar nicht schriebe, lieferte `undefined` — und ein
           * Prüffall auf `null` wäre dann rot, obwohl der Dienst richtig
           * arbeitet. Eine Attrappe, die es anders schriebe als der Adapter,
           * wäre schlimmer: Sie machte den Prüffall zu einer Aussage über sich
           * selbst.
           */
          dueDate: input.dueDate ?? null,
          tagIds: [...tagIds],
          createdAt: now,
          updatedAt: now,
        });
        state.notes.set(todo.id, { todoId: todo.id, text: input.note, updatedAt: now });
        return todo;
      },
    },

    /**
     * Der Baum kommt aus dem Bestand der Attrappe und nicht aus der Konstanten
     * (T-061).
     *
     * Ein neu angelegtes Tag liegt auf Wurzelebene und muss beim nächsten
     * `GET /addin/context` **dabei** sein — sonst könnte der Aufgabenbereich es
     * nicht wieder auswählen, und die Prüfung „das neue Tag ist danach ein
     * gewöhnliches Tag" wäre nicht zu fahren. Die Ordner bleiben, wie sie sind:
     * Aus dem Add-in heraus entsteht kein Ordner.
     */
    folders: {
      loadTree: async () => ({
        ...buildTagTree(),
        rootTags: [...state.tags.values()].filter((tag) => tag.folderId === null),
      }),
    },

    /**
     * Die zwei Züge, die `AddinUnit` seit T-061 führt — und keinen dritten.
     *
     * `findByKey` urteilt nicht; es liefert **alle** Tags mit diesem Schlüssel,
     * ordnerübergreifend. Zwei Treffer sind ein zulässiger Zustand (Tagnamen
     * sind nur je Ordner eindeutig, A-4.2), und was daraus folgt, entscheidet
     * der Anwendungsfall.
     */
    tags: {
      findByKey: async (key) =>
        [...state.tags.values()].filter((tag) => tagNameKey(tag.name) === key),

      create: async (folderId, name, color, now) => {
        // Der Adapter speichert die **normalisierte** Anzeigeform
        // (`repo-tags.ts`). Die Attrappe tut dasselbe, sonst stünde hier ein
        // Name mit doppeltem Leerzeichen, den es im Betrieb nicht gäbe.
        const normalized = normalizeTagName(name);
        const key = tagNameKey(normalized);

        // `ux_tag_name_key` aus Migration 0008, nachgebildet. Der Fehlschlag
        // ist ein Wert und kein Wurf — wie im echten Adapter.
        if (enforceUniqueTagName && [...state.tags.values()].some((tag) => tagNameKey(tag.name) === key)) {
          return {
            ok: false,
            error: { code: 'name_conflict', message: 'Diesen Tagnamen gibt es bereits.' },
          };
        }

        const tag = { id: uuid(), folderId, name: normalized, color, createdAt: now, updatedAt: now };
        state.tags.set(tag.id, tag);
        return { ok: true, value: tag };
      },
    },

    // Only `list`, like `AddinUnit.pools`: a match carries no pool movement (E-125 point 1).
    pools: {
      /*
       * Das Flächenargument wird **ausgewertet** und nicht verschluckt (T-090).
       *
       * `PoolPort.list` nimmt seit E-054 `'pool'`, `'board'` oder `'all'` und
       * setzt ohne Argument `'pool'` ein — eine reine Board-Spalte ist damit für
       * jeden Aufrufer unsichtbar, der nichts sagt. Genau daran hing R-1
       * Befund 3 / R-2 B-4, und genau deshalb hat es niemand gemessen: Die
       * Attrappe gab bis T-090 unbesehen **alle** Regeln zurück. Eine Attrappe,
       * die großzügiger ist als der Betrieb, macht den Fehler unsichtbar, den
       * sie zeigen soll.
       *
       * `both` steht in beiden Flächen. Das ist keine Bequemlichkeit, sondern
       * die Bedeutung des Wertes: Die Regel erscheint an beiden Orten.
       */
      list: async (shownOn = 'pool') =>
        DEFAULT_POOLS.filter((pool) => {
          if (shownOn === 'all') return true;
          return pool.placement === shownOn || pool.placement === 'both';
        }),
    },
    statuses: {
      list: async () => STATUSES,
      defaultStatus: async () => STATUSES[0],
    },
    defaultTags: { list: async () => DEFAULT_TAGS },

    timeEntries: {
      sumSeconds: async (filter) =>
        state.timeEntries
          .filter(
            (entry) =>
              (filter.todoId === undefined || entry.todoId === filter.todoId) &&
              (filter.exportStatus === undefined || entry.exportStatus === filter.exportStatus),
          )
          .reduce((total, entry) => total + entry.durationSeconds, 0),
    },
  };

  /*
   * Die Klammer nimmt bei einem **Wurf** zurück.
   *
   * Das ist die zweite Hälfte des Vertrags von `inTransaction`, und ohne sie
   * wäre der Nachweis „kein Tag ohne sein Todo" (T-047) an dieser Attrappe
   * nicht zu führen: Ein Abbruch mitten in der Klammer ließe die vorher
   * angelegten Tags stehen, und die Attrappe behauptete grün, was der Betrieb
   * anders macht. Ein Abzug des Zustands ist hier billig — im Betrieb tut
   * SQLite dasselbe mit `ROLLBACK`.
   */
  const snapshot = () => ({
    todos: new Map(state.todos),
    notes: new Map(state.notes),
    tags: new Map(state.tags),
    timeEntries: [...state.timeEntries],
    nextId: state.nextId,
  });

  const restore = (taken) => {
    state.todos = taken.todos;
    state.notes = taken.notes;
    state.tags = taken.tags;
    state.timeEntries = taken.timeEntries;
    state.nextId = taken.nextId;
  };

  const bracketed = async (work) => {
    const taken = snapshot();
    try {
      return await work(unit);
    } catch (error) {
      restore(taken);
      throw error;
    }
  };

  /*
   * Die Warteschlange aus `unit-of-work.ts`, Zeile für Zeile in derselben
   * Reihenfolge: Die nächste Klammer beginnt nach dem **Ende** der vorigen,
   * nicht nach ihrem Erfolg. Reißt die Kette an einem Fehlschlag, wartet der
   * übernächste Aufrufer für immer — genau deshalb stehen dort zwei Zweige,
   * und genau deshalb stehen sie auch hier.
   */
  let queue = Promise.resolve();

  const serialized = (work) => {
    const next = queue.then(() => bracketed(work));
    queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };

  return {
    state,
    seedTodo,
    deps: {
      /*
       * `serializeTransactions: false` liefert genau das, was hier bis T-061
       * stand: einen blanken Aufruf. Er reiht nicht und nimmt nicht zurück —
       * also keine Klammer, sondern die Abwesenheit einer.
       *
       * Das ist **nicht** der Betrieb, sondern die Gegenprobe: Sie zeigt, dass
       * die Messung „acht gleichzeitige Anfragen, ein Tag" rot werden kann und
       * nicht bloß grün ist (T-061, Abschnitt 11c).
       */
      inTransaction: serializeTransactions ? serialized : async (work) => work(unit),
      now: () => '2026-03-02T09:00:00Z',
    },
  };
};

/** Zwei erfundene E-Mails, deutlich verschiedener erfundener Absender. */
export const MAIL_MIT_NUMMER = Object.freeze({
  subject: 'AW: Störung Lüftung — Vorgang TCK-000042',
  body:
    'Guten Tag,\n\nzu Vorgang TCK-000042 bitte um Rückruf. Die Anlage läuft seit\n' +
    'gestern im Notbetrieb.\n\nViele Grüße\nA. Beispiel\n',
  senderName: 'A. Beispiel',
  senderAddress: 'a.beispiel@example.org',
  receivedAt: '2026-03-02T08:12:00Z',
});

export const MAIL_OHNE_NUMMER = Object.freeze({
  subject: 'Angebot Turnuswartung — Rückfrage',
  body:
    'Sehr geehrte Damen und Herren,\n\nwir hätten eine Rückfrage zum Turnus.\n\n' +
    'Mit freundlichen Grüßen\nB. Muster\n',
  senderName: 'B. Muster',
  senderAddress: 'b.muster@example.com',
  receivedAt: '2026-03-02T08:40:00Z',
});

/** Eine Ablage im Arbeitsspeicher mit der Fläche von `localStorage`. */
export const createMemoryStorage = () => {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
};
