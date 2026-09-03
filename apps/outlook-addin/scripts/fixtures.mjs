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

/** Alle Tags eines Ordners, auf Wunsch einschließlich seiner Unterordner. */
const tagsInFolder = (folderId, includeSubfolders) => {
  const collect = (node) => [
    ...node.tags.map((tag) => tag.id),
    ...(includeSubfolders ? node.subfolders.flatMap(collect) : []),
  ];

  const find = (nodes) => {
    for (const node of nodes) {
      if (node.folder.id === folderId) return node;
      const deeper = find(node.subfolders);
      if (deeper !== null) return deeper;
    }
    return null;
  };

  const node = find(buildTagTree().rootFolders);
  return node === null ? [] : collect(node);
};

/**
 * Eine der beiden Tagachsen einer Regel, aufgelöst (T-076, E-057).
 *
 * `which` ist `rule` (erforderlich) oder `excludedTags` (ausgeschlossen). Eine
 * fehlende Liste ist eine **leere** Liste und kein Fehler: Genau so sieht eine
 * Regel aus der Zeit vor T-076 aus, und sie muss weiterhin dasselbe treffen.
 *
 * Zurück kommt dieselbe Gestalt wie aus `resolvePoolAxis` im echten Adapter:
 * die Tags **und** die genannten Ordner, aus denen keiner geworden ist — in
 * der Reihenfolge der Regel und ohne Doppelte. Die zweite Hälfte ist die
 * Auskunft, die eine Tagmenge nicht tragen kann: „über Tags sagt die Regel
 * nichts" und „die Regel nennt einen leeren Ordner" ergeben beide `[]`.
 *
 * Beurteilt wird hier nichts. Ob eine Achse damit unaufgelöst ist, sagt
 * `tagAxisIsUnresolved` in der Domäne — so wie der Betrieb es auch tut.
 */
const resolveAxis = (pools, poolId, which) => {
  const pool = pools.find((entry) => entry.id === poolId);
  if (pool === undefined) return { tagIds: [], emptyFolderIds: [] };

  const tagIds = [];
  const emptyFolderIds = [];

  for (const term of pool[which] ?? []) {
    if (term.kind === 'tag') {
      if (!tagIds.includes(term.tagId)) tagIds.push(term.tagId);
      continue;
    }
    // Zweimal derselbe Ordner ist ein Ordner — sonst stünde er in der Auskunft
    // an die Oberfläche doppelt (`repo-tags.ts`).
    if (emptyFolderIds.includes(term.folderId)) continue;

    const inFolder = tagsInFolder(term.folderId, pool.includeSubfolders);
    if (inFolder.length === 0) {
      emptyFolderIds.push(term.folderId);
      continue;
    }
    for (const tagId of inFolder) if (!tagIds.includes(tagId)) tagIds.push(tagId);
  }

  return { tagIds, emptyFolderIds };
};

/** Nur die Tagmenge — dieselbe Auflösung, die schmale Frage (`resolvePoolRule`). */
const resolveTerms = (pools, poolId, which) => resolveAxis(pools, poolId, which).tagIds;

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
 * `pools` ist seit T-078 austauschbar. Nicht der Bequemlichkeit wegen: Die
 * Regelachsen aus T-076 lassen sich nur zeigen, wenn es Regeln gibt, die sie
 * benutzen — und der Bestand aus `DEFAULT_POOLS` soll dabei unberührt bleiben,
 * damit die Prüfungen von T-038 weiterhin dasselbe messen wie zuvor.
 *
 * @param {{ serializeTransactions?: boolean, enforceUniqueTagName?: boolean, pools?: readonly object[] }} [options]
 */
export const createFakeStore = (options = {}) => {
  const serializeTransactions = options.serializeTransactions ?? true;
  const enforceUniqueTagName = options.enforceUniqueTagName ?? true;
  const pools = options.pools ?? DEFAULT_POOLS;

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
          tagIds: [...tagIds],
          createdAt: now,
          updatedAt: now,
        });
        state.notes.set(todo.id, { todoId: todo.id, text: input.note, updatedAt: now });
        return todo;
      },

      clearDone: async (todoId, now) => {
        const todo = state.todos.get(todoId);
        if (todo === undefined) {
          return { ok: false, error: { code: 'not_found', message: 'Nicht vorhanden.' } };
        }
        const updated = { ...todo, completedAt: null, updatedAt: now };
        state.todos.set(todoId, updated);
        return { ok: true, value: updated };
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

    pools: {
      list: async () => pools,

      // Die Auflösung, die im Betrieb SQL ist: Regelteile der Art `folder`
      // ziehen die Tags aller Unterordner mit (A-4.3), Regelteile der Art
      // `tag` genau ihr eigenes. Die Attrappe rechnet sie aus demselben Baum
      // aus, den `loadTree` liefert — sonst könnte sie behaupten, ein Todo sei
      // in einem Pool, den es nach dem Baum gar nicht gibt.
      resolveRule: async (poolId) => resolveTerms(pools, poolId, 'rule'),

      // Dieselbe Auflösung, dieselbe Tiefe, die andere Liste (T-076). Sie
      // steht hier nicht als Kopie, sondern als zweiter Aufruf derselben
      // Funktion: Zwei Auflösungen, die auseinanderlaufen könnten, wären genau
      // die Art Attrappe, die grün behauptet, was der Betrieb anders macht.
      resolveExcluded: async (poolId) => resolveTerms(pools, poolId, 'excludedTags'),

      /*
       * Beide Achsen in einer Antwort — **und** die Ordner, aus denen kein Tag
       * geworden ist (E-057, `PoolPort.resolveAxes`).
       *
       * Seit T-086 ist das die Methode, die der Add-in-Teilbaum benutzt; die
       * beiden schmalen darüber bleiben als der Rest des Ports stehen, den ein
       * `UnitOfWork` mitbringt. Sie rufen dieselbe Auflösung — eine zweite,
       * die auseinanderlaufen könnte, wäre eine Attrappe, die etwas anderes
       * behauptet als der Betrieb.
       */
      resolveAxes: async (poolId) => ({
        required: resolveAxis(pools, poolId, 'rule'),
        excluded: resolveAxis(pools, poolId, 'excludedTags'),
      }),
    },
    statuses: {
      list: async () => STATUSES,
      defaultStatus: async () => STATUSES[0],
    },
    defaultTags: { list: async () => DEFAULT_TAGS },

    timeEntries: {
      create: async (input, now) => {
        const seconds =
          (Date.parse(input.endedAt) - Date.parse(input.startedAt)) / 1000;
        if (!Number.isFinite(seconds) || seconds < 1) {
          return {
            ok: false,
            error: { code: 'timer_too_short', message: 'Die Buchung ist zu kurz.' },
          };
        }
        const entry = {
          id: id('te'),
          todoId: input.todoId,
          startedAt: input.startedAt,
          endedAt: input.endedAt,
          durationSeconds: seconds,
          note: input.note,
          exportStatus: 'open',
          exportCount: 0,
          source: 'manual',
          createdAt: now,
          updatedAt: now,
        };
        state.timeEntries.push(entry);
        return { ok: true, value: entry };
      },

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

// ---------------------------------------------------------------------------
// T-078 — der Bestand für die fünf Regelachsen aus T-076
// ---------------------------------------------------------------------------

/**
 * Die Kennungen des Achsen-Bestands. Wieder UUID Fassung 7, wieder erfunden.
 *
 * Getrennt von {@link ID}, weil dieser Bestand **neben** dem von T-038 steht
 * und ihn nicht verändert: Die Prüfungen von damals sollen weiterhin dasselbe
 * messen wie damals, sonst wäre nicht zu unterscheiden, ob eine Änderung den
 * Fehler behebt oder die Messung verstellt.
 */
export const AXIS_POOL = Object.freeze({
  alleWartung:       '01931f4e-0000-7000-8000-0000000041d1',
  ohneStoerungen:    '01931f4e-0000-7000-8000-0000000041d2',
  imBacklog:         '01931f4e-0000-7000-8000-0000000041d3',
  erledigte:         '01931f4e-0000-7000-8000-0000000041d4',
  nichtAbgerechnet:  '01931f4e-0000-7000-8000-0000000041d5',
  bereitsAbgerechnet:'01931f4e-0000-7000-8000-0000000041d6',
  erledigtOffen:     '01931f4e-0000-7000-8000-0000000041d7',
  leereRegel:        '01931f4e-0000-7000-8000-0000000041d8',
});

export const AXIS_TODO = Object.freeze({
  stoerung: '01931f4e-0000-7000-8000-0000000051a1',
  turnus:   '01931f4e-0000-7000-8000-0000000051a2',
});

/**
 * Acht Regeln über **demselben** Ordner — eine je Achse (T-076, T-078, E-056).
 *
 * Der Zuschnitt ist so gewählt, dass keine Antwort zufällig richtig sein kann:
 * Alle sieben eingerichteten Regeln tragen **wortgleich dieselben**
 * erforderlichen Tags (den Ordner „Wartung", mit Unterordnern). Wer nur diese
 * eine Liste auswertet — der Zustand vor T-078 —, muss deshalb für jedes Todo
 * **alle sieben** nennen. Jeder Unterschied im Ergebnis kommt damit nachweisbar
 * aus einer der neuen Achsen und aus nichts anderem.
 *
 * Die vorletzte Regel ist der Fall, für den E-056 entschieden wurde:
 * **erledigt und noch nicht abgerechnet**, benutzt als Abrechnungsliste. Sie
 * ist die einzige Art Regel, die ein Todo durch eine Buchung **verliert**.
 *
 * Die letzte Regel ist leer. Sie trifft nichts (A-3.4, E-055 in seiner
 * berichtigten Fassung) und steht hier, weil ein Pool im Zustand „gerade
 * angelegt, noch nicht eingerichtet" (S-05) der Normalfall ist und niemals
 * genannt werden darf.
 */
export const AXIS_POOLS = Object.freeze([
  {
    id: AXIS_POOL.alleWartung,
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
  {
    // Die Achse, an der T-078 hängt: „Wartung, **außer** Störungen".
    id: AXIS_POOL.ohneStoerungen,
    name: 'Wartung ohne Störungen',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 1,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [{ kind: 'tag', tagId: ID.tagStoerung }],
    statusIds: [],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: AXIS_POOL.imBacklog,
    name: 'Wartung im Backlog',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 2,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [],
    statusIds: [ID.statusBacklog],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: AXIS_POOL.erledigte,
    name: 'Erledigte Wartung',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 3,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [],
    statusIds: [],
    completion: 'done',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: AXIS_POOL.nichtAbgerechnet,
    name: 'Wartung, noch nicht abgerechnet',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 4,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [],
    statusIds: [],
    completion: 'any',
    exportState: 'open',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: AXIS_POOL.bereitsAbgerechnet,
    name: 'Wartung, bereits abgerechnet',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 5,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [],
    statusIds: [],
    completion: 'any',
    exportState: 'exported',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    // Der Fall aus E-056: die Abrechnungsliste. Erledigt **und** noch nicht
    // abgerechnet — wer hier bucht, sieht die Karte aus genau der Liste
    // verschwinden, in der er sie sucht.
    id: AXIS_POOL.erledigtOffen,
    name: 'Erledigt, noch nicht abgerechnet',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 6,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [],
    statusIds: [],
    completion: 'done',
    exportState: 'open',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: AXIS_POOL.leereRegel,
    name: 'Noch nicht eingerichtet',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 7,
    rule: [],
    excludedTags: [],
    statusIds: [],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]);

// ---------------------------------------------------------------------------
// T-086 — der Bestand für den leeren Ordner (E-057)
// ---------------------------------------------------------------------------

/**
 * Die Kennungen des E-057-Bestands. Wieder erfunden, wieder UUID Fassung 7.
 *
 * Ein **eigener** Poolsatz neben {@link AXIS_POOLS}, aus demselben Grund, aus
 * dem jener neben {@link DEFAULT_POOLS} steht: Die Sätze und Namenslisten, die
 * T-078, E-056 und T-084 Zeichen für Zeichen festhalten, sollen weiterhin
 * dasselbe messen. Eine zusätzliche Spalte im Achsen-Bestand hätte drei
 * bestehende Erwartungen verschoben, ohne einen Fehler zu zeigen.
 */
export const E057_POOL = Object.freeze({
  wartung:           '01931f4e-0000-7000-8000-0000000042e1',
  archivUndTagterm:  '01931f4e-0000-7000-8000-0000000042e2',
  archivUndStatus:   '01931f4e-0000-7000-8000-0000000042e3',
  nurStatus:         '01931f4e-0000-7000-8000-0000000042e4',
  archivImAusschluss:'01931f4e-0000-7000-8000-0000000042e5',
});

/**
 * Fünf Regeln über dem **leeren** Ordner „Archiv" (E-057).
 *
 * Sie messen die Entscheidung in beiden Richtungen, und jede der drei
 * betroffenen Regeln hat ihre Gegenprobe unmittelbar daneben:
 *
 * | Regel | erwartet | ohne E-057 |
 * |---|---|---|
 * | `wartung` — nur der volle Ordner | beide Todos | beide Todos |
 * | `archivUndTagterm` — „Wartung **oder** Archiv" | **niemand** | beide Todos |
 * | `archivUndStatus` — „Archiv **und** In Arbeit" | **niemand** | das Todo In Arbeit |
 * | `nurStatus` — „In Arbeit", ohne Ordner | das Todo In Arbeit | dasselbe |
 * | `archivImAusschluss` — „Wartung, **außer** Archiv" | beide Todos | beide Todos |
 *
 * Die zweite Zeile ist der Fall, den eine achsenweise Zählung nicht sieht: Die
 * Tagmenge ist **gefüllt** (der Ordner „Wartung" trägt zwei Tags bei), und der
 * leere Ordner daneben verschwindet in der Summe. Gefragt wird deshalb
 * termweise.
 *
 * Die letzte Zeile ist die Grenze der Entscheidung: „Keiner davon" über nichts
 * schließt nichts aus. Eine zu grobe Behebung — „leerer Ordner, gleich in
 * welcher Achse" — fällt genau hier auf und sonst nirgends.
 */
export const E057_POOLS = Object.freeze([
  {
    // Die Kontrolle. Ohne sie wäre „nennt niemanden" auch dann grün, wenn der
    // Bestand die Regeln aus einem anderen Grund nicht erfüllte.
    id: E057_POOL.wartung,
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
  {
    // Termweise (E-057): Der leere Ordner steht **neben** einem Ordner, der
    // Tags beisteuert, und im Modus `any`. Aussagenlogisch trüge er zu einem
    // „oder" nichts bei; die Entscheidung sagt, der Benutzer hat ihn genannt,
    // weil er ihn meint.
    id: E057_POOL.archivUndTagterm,
    name: 'Wartung oder Archiv',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 1,
    rule: [
      { kind: 'folder', folderId: ID.folderWartung },
      { kind: 'folder', folderId: ID.folderArchiv },
    ],
    excludedTags: [],
    statusIds: [],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    // Der Fall aus E-057 in seiner ursprünglichen Gestalt: „Tags aus Ordner X
    // **und** Status In Arbeit". Vor der Entscheidung schrumpfte die Regel
    // still auf „Status In Arbeit" — sie traf mehr, als der Benutzer gesagt
    // hatte, und das fällt niemandem auf.
    id: E057_POOL.archivUndStatus,
    name: 'Archiv, in Arbeit',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 2,
    rule: [{ kind: 'folder', folderId: ID.folderArchiv }],
    excludedTags: [],
    statusIds: [ID.statusInArbeit],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    // Die Gegenprobe dazu: **dieselbe** Statusachse ohne den Ordner. Sie nennt
    // das Todo — damit steht fest, daß die Regel darüber am leeren Ordner
    // scheitert und nicht am Status.
    id: E057_POOL.nurStatus,
    name: 'In Arbeit',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 3,
    rule: [],
    excludedTags: [],
    statusIds: [ID.statusInArbeit],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    // Derselbe leere Ordner, die andere Achse. „Keiner davon" über nichts
    // schließt nichts aus (E-057, Absatz „Nicht betroffen") — die Regel muß
    // genau dieselben Todos nennen wie `wartung` darüber.
    id: E057_POOL.archivImAusschluss,
    name: 'Wartung, außer Archiv',
    matchMode: 'any',
    includeSubfolders: true,
    placement: 'pool',
    position: 4,
    rule: [{ kind: 'folder', folderId: ID.folderWartung }],
    excludedTags: [{ kind: 'folder', folderId: ID.folderArchiv }],
    statusIds: [],
    completion: 'any',
    exportState: 'any',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]);

/**
 * Zwei erfundene Todos, die sich in **jeder** Achse unterscheiden.
 *
 * | | Störung | Status | Erledigt | offene Buchung | exportierte Buchung |
 * |---|---|---|---|---|---|
 * | `stoerung` | ja | In Arbeit | nein | nein | nein |
 * | `turnus`   | nein | Backlog | ja | ja | ja |
 *
 * Beide hängen an einem Tag des Ordners „Wartung" und erfüllen damit die
 * erforderlichen Tags **jeder** der sechs eingerichteten Regeln. Alles, was
 * sie danach trennt, ist eine der neuen Achsen.
 *
 * Die Call-Nummern sind erfunden, wie alles hier: `TCK-000517` und
 * `TCK-000518` gehören zu keinem Vorgang.
 */
export const buildAxisTodos = () => [
  {
    id: AXIS_TODO.stoerung,
    title: 'Notbetrieb prüfen',
    callNumber: 'TCK-000517',
    statusId: ID.statusInArbeit,
    boardRank: 'm',
    completedAt: null,
    tagIds: [ID.tagMusterbetrieb, ID.tagStoerung],
    createdAt: '2026-02-20T08:00:00Z',
    updatedAt: '2026-02-20T08:00:00Z',
  },
  {
    id: AXIS_TODO.turnus,
    title: 'Turnus abschließen',
    callNumber: 'TCK-000518',
    statusId: ID.statusBacklog,
    boardRank: 'n',
    completedAt: '2026-02-25T16:00:00Z',
    tagIds: [ID.tagTurnuswartung],
    createdAt: '2026-02-21T08:00:00Z',
    updatedAt: '2026-02-25T16:00:00Z',
  },
];

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
