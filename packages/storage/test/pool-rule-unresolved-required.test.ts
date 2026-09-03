/**
 * Takt — T-088, E-057 (T-082 §4): Ein Ordnerterm, der auf keinen Tag auflöst,
 * ist eine Einschränkung ohne Treffer, kein Neutralwert — an der SQL-Übersetzung
 * (`buildConditions` in `packages/storage/src/sqlite/repo-todos.ts`), nicht an
 * der reinen Domänenfunktion. Die reine Funktion hat ihre eigene Testdatei:
 * `packages/domain/test/pool-rule-unresolved.test.ts`.
 *
 * Die drei Fälle sind wörtlich aus `.claude/team/reports/T-082-domain-dev.md`,
 * Abschnitt 4 ("Was das für den unit-tester heißt"), jeder mit der dort
 * verlangten Gegenprobe. Vor T-082 blieb `pools.members` für alle drei grün,
 * weil eine leere Tagmenge als Neutralwert der Achse galt und die Achse damit
 * aus der Regel verschwand ("Tags aus Ordner X UND Status offen" wurde zu
 * "Status offen").
 *
 * ---------------------------------------------------------------------------
 * ROT-NACHWEIS, ohne `src` anzufassen (meine Hoheit ist ausschließlich
 * `packages/*\/test/**`)
 * ---------------------------------------------------------------------------
 *
 * Zwei sich ergänzende Nachweise je Fall:
 *
 *  1. **Bereits gemessen, am laufenden Dienst, von domain-dev in T-082 §4a/b**
 *     (nicht von mir wiederholt, weil das `src` in fremder Hoheit anfassen
 *     würde): Mit `unresolvedRequired` aus `poolRuleMatchesNothing`
 *     herausgenommen fiel Abschnitt 14 von `proof:openapi` mit
 *     `"karten": 2` um — die Spalte "leerer Ordner UND Status" zeigte beide
 *     Bestandskarten, genau die Menge der Statusspalte daneben (Fall 1 unten).
 *     Mit achsenweiser statt termweiser Zählung (`emptyTerms` ignoriert) fiel
 *     die gemischte Spalte mit `"tagCount": 1` um (Fall 2 unten). Die exakten
 *     Zeilen: `packages/storage/src/sqlite/repo-todos.ts:229`
 *     (`unresolvedRequired: pool.unresolvedRequired`) für Fall 1, und
 *     `packages/storage/src/sqlite/unit-of-work.ts:116`
 *     (`emptyTerms: required.emptyFolderIds.length`) für Fall 2 — beide
 *     jeweils durch `false` beziehungsweise `0` ersetzt, würde den
 *     zugehörigen Fall unten wieder rot machen.
 *  2. **Selbst nachvollzogen, auf Ebene der reinen Funktion**, in
 *     `pool-rule-unresolved.test.ts`: Der `matchesPool`-Aufruf mit
 *     `unresolvedRequired: false` erzwungen reproduziert exakt die Antwort von
 *     vor E-057 und liefert bei jedem der drei Fälle unten eine andere Antwort
 *     als `pools.members` — siehe die jeweilige "Nachweis"-Zeile in jedem Fall.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { matchesPool, tagAxisIsUnresolved } from '@takt/domain';
import { NOW, openTestDatabase, type TestDatabase } from './support/setup.ts';

describe('pools.members — ein leerer Ordnerterm neben einer zweiten Achse (T-082 §4, Fall 1: gemischte Achse)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('"leerer Ordner UND Status" liefert nichts; Gegenprobe: derselbe Status ohne den Ordner liefert die Karte', async () => {
    db = openTestDatabase();
    const status = await db.unit.statuses.create('In Bearbeitung', 0, NOW);
    expect(status.ok).toBe(true);
    if (!status.ok) return;
    const emptyFolder = await db.unit.folders.create(null, 'Leer', NOW);
    expect(emptyFolder.ok).toBe(true);
    if (!emptyFolder.ok) return;

    const withStatus = await db.unit.todos.create(
      { title: 'Mit Status', callNumber: null, statusId: status.value.id, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.todos.create(
      { title: 'Ohne Status', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    const mixed = await db.unit.pools.create(
      {
        name: 'Ordner (leer) UND Status',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'folder', folderId: emptyFolder.value.id }],
        statusIds: [status.value.id],
      },
      NOW,
    );

    // Die eigentliche Prüfung: nichts, nicht "die Statusachse allein entscheidet".
    expect((await db.unit.pools.members(mixed.id)).items).toEqual([]);

    // Gegenprobe (T-082 §4, Fall 1): dieselbe statusIds-Achse OHNE den
    // Ordnerterm liefert die Karte — die Statusachse selbst ist also nicht
    // kaputt, nur ihre Verbindung mit der leeren Ordnerachse muss ablehnen.
    const statusOnly = await db.unit.pools.create(
      { name: 'Nur Status', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], statusIds: [status.value.id] },
      NOW,
    );
    expect((await db.unit.pools.members(statusOnly.id)).items.map((t) => t.id)).toEqual([withStatus.id]);

    // Nachweis auf Funktionsebene: `unresolvedRequired: false` erzwungen (die
    // Antwort von vor E-057, äquivalent zu `repo-todos.ts:229` mit
    // `pool.unresolvedRequired` durch `false` ersetzt) sagt für dieselbe Karte
    // das Gegenteil von dem, was `pools.members` tatsächlich liefert.
    const preE057Verdict = matchesPool({
      todoTagIds: [],
      ruleTagIds: [],
      matchMode: 'any',
      ruleStatusIds: [status.value.id],
      todoStatusId: status.value.id,
      unresolvedRequired: false,
    });
    expect(preE057Verdict).toBe(true);
    expect(preE057Verdict).not.toBe((await db.unit.pools.members(mixed.id)).items.length > 0);
  });
});

describe('pools.members — Tagterm neben leerem Ordnerterm, Modus "any" (T-082 §4, Fall 2: gemischte Terme)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('[{tag}, {folder leer}] liefert nichts, obwohl der Tagterm einen Tag beisteuert; Gegenprobe: der Tagterm allein liefert die Karte', async () => {
    db = openTestDatabase();
    const tagSupport = await db.unit.tags.create(null, 'Support', null, NOW);
    expect(tagSupport.ok).toBe(true);
    if (!tagSupport.ok) return;
    const emptyFolder = await db.unit.folders.create(null, 'Ost', NOW);
    expect(emptyFolder.ok).toBe(true);
    if (!emptyFolder.ok) return;

    const withTag = await db.unit.todos.create(
      { title: 'Mit Support-Tag', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagSupport.value.id],
    );

    const mixedTerms = await db.unit.pools.create(
      {
        name: 'Support ODER Ost (leer)',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagSupport.value.id }, { kind: 'folder', folderId: emptyFolder.value.id }],
      },
      NOW,
    );

    expect((await db.unit.pools.members(mixedTerms.id)).items).toEqual([]);

    // Gegenprobe (T-082 §4, Fall 2): derselbe Tagterm allein liefert die Karte
    // — der Tagterm selbst ist also nicht das Problem, nur der leere
    // Ordnerterm daneben, den eine achsenweise Zählung übersehen hätte
    // (`unit-of-work.ts:116`, termweise über `emptyFolderIds.length`).
    const tagOnly = await db.unit.pools.create(
      {
        name: 'Nur Support',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagSupport.value.id }],
      },
      NOW,
    );
    expect((await db.unit.pools.members(tagOnly.id)).items.map((t) => t.id)).toEqual([withTag.id]);

    // Nachweis auf Funktionsebene: Eine achsenweise statt termweise Zählung
    // (`emptyTerms: 0` statt der tatsächlichen Zahl leerer Terme) hält die
    // Achse für aufgelöst, weil die Summe der Tags positiv ist (1) — die
    // resultierende `unresolvedRequired` wäre `false`, `matchesPool` träfe
    // zu, `pools.members` liefert aber nichts.
    const axisWiseUnresolvedRequired = tagAxisIsUnresolved({ named: 2, resolved: 1, emptyTerms: 0 });
    const termWiseUnresolvedRequired = tagAxisIsUnresolved({ named: 2, resolved: 1, emptyTerms: 1 });
    expect(axisWiseUnresolvedRequired).toBe(false);
    expect(termWiseUnresolvedRequired).toBe(true);
    expect(axisWiseUnresolvedRequired).not.toBe(termWiseUnresolvedRequired);

    const axisWiseVerdict = matchesPool({
      todoTagIds: [tagSupport.value.id],
      ruleTagIds: [tagSupport.value.id],
      matchMode: 'any',
      unresolvedRequired: axisWiseUnresolvedRequired,
    });
    expect(axisWiseVerdict).toBe(true);
    expect(axisWiseVerdict).not.toBe((await db.unit.pools.members(mixedTerms.id)).items.length > 0);
  });
});

describe('pools.members — Ausschluss über einen leeren Ordner neben einem Tagterm (T-082 §4, Fall 3)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('liefert dieselbe Menge wie ohne den Ausschluss — der Fall, an dem eine zu grobe Behebung auffällt', async () => {
    db = openTestDatabase();
    const tagBeratung = await db.unit.tags.create(null, 'Beratung', null, NOW);
    expect(tagBeratung.ok).toBe(true);
    if (!tagBeratung.ok) return;
    const emptyFolder = await db.unit.folders.create(null, 'Leer', NOW);
    expect(emptyFolder.ok).toBe(true);
    if (!emptyFolder.ok) return;

    const todo = await db.unit.todos.create(
      { title: 'Mit Beratung', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagBeratung.value.id],
    );

    const withoutExclusion = await db.unit.pools.create(
      {
        name: 'Ohne Ausschluss',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagBeratung.value.id }],
      },
      NOW,
    );
    const withUselessExclusion = await db.unit.pools.create(
      {
        name: 'Mit Ausschluss über leerem Ordner',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagBeratung.value.id }],
        excludedTags: [{ kind: 'folder', folderId: emptyFolder.value.id }],
      },
      NOW,
    );

    const without = (await db.unit.pools.members(withoutExclusion.id)).items.map((t) => t.id);
    const withExclusion = (await db.unit.pools.members(withUselessExclusion.id)).items.map((t) => t.id);

    // "Keiner davon" über nichts schließt nichts aus (E-057) — dieselbe Menge,
    // und nicht leer.
    expect(withExclusion).toEqual(without);
    expect(withExclusion).toEqual([todo.id]);

    // Nachweis, an dem eine zu grobe Behebung auffiele: Eine Fassung, die
    // JEDE unaufgelöste Achse (auch die ausgeschlossene) wie die erforderliche
    // behandelt, würde hier fälschlich "trifft nichts" sagen. Diese Funktion
    // steht ausschließlich hier — keine Kopie von etwas in `src/` — und zeigt,
    // dass eine solche Verallgemeinerung eine andere Antwort gäbe als
    // `pools.members` tatsächlich liefert.
    const tooBroadVerdict = matchesPool({
      todoTagIds: [tagBeratung.value.id],
      ruleTagIds: [tagBeratung.value.id],
      matchMode: 'any',
      excludedTagIds: [],
      // Die zu grobe Behebung: die ausgeschlossene Achse wird wie die
      // erforderliche behandelt, obwohl "keiner davon" über nichts nichts
      // ausschließt (E-057, letzter Absatz).
      unresolvedRequired: tagAxisIsUnresolved({ named: 1, resolved: 0, emptyTerms: 1 }),
    });
    expect(tooBroadVerdict).toBe(false);
    expect(tooBroadVerdict).not.toBe(withExclusion.length > 0);
  });
});

describe('pools.members gegen matchesPool — Kreuzprüfung für die drei Spalten aus Fall 1–3 (T-082 §4, Fall 4)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('für jede der drei Spalten und jede Karte stimmt pools.members mit matchesPool überein, aufgelöst über PoolPort.resolveAxes', async () => {
    db = openTestDatabase();
    const tagSupport = await db.unit.tags.create(null, 'Support', null, NOW);
    const status = await db.unit.statuses.create('In Bearbeitung', 0, NOW);
    expect(tagSupport.ok && status.ok).toBe(true);
    if (!tagSupport.ok || !status.ok) return;
    const emptyFolderA = await db.unit.folders.create(null, 'Leer A', NOW);
    const emptyFolderB = await db.unit.folders.create(null, 'Leer B', NOW);
    expect(emptyFolderA.ok && emptyFolderB.ok).toBe(true);
    if (!emptyFolderA.ok || !emptyFolderB.ok) return;

    const cardWithStatus = await db.unit.todos.create(
      { title: 'Mit Status', callNumber: null, statusId: status.value.id, tagIds: [], note: '', now: NOW },
      [],
    );
    const cardWithTag = await db.unit.todos.create(
      { title: 'Mit Support-Tag', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagSupport.value.id],
    );
    const cardWithNeither = await db.unit.todos.create(
      { title: 'Ohne beides', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    // Dieselben drei Spaltenformen wie in Fall 1–3: gemischte Achse, gemischte
    // Terme, Ausschluss über einen leeren Ordner.
    const columns = await Promise.all([
      db.unit.pools.create(
        {
          name: 'Fall 1: Ordner (leer) UND Status',
          matchMode: 'any',
          includeSubfolders: false,
          position: 0,
          rule: [{ kind: 'folder', folderId: emptyFolderA.value.id }],
          statusIds: [status.value.id],
        },
        NOW,
      ),
      db.unit.pools.create(
        {
          name: 'Fall 2: Support ODER Ordner (leer)',
          matchMode: 'any',
          includeSubfolders: false,
          position: 0,
          rule: [{ kind: 'tag', tagId: tagSupport.value.id }, { kind: 'folder', folderId: emptyFolderB.value.id }],
        },
        NOW,
      ),
      db.unit.pools.create(
        {
          name: 'Fall 3: Support, Ausschluss über leerem Ordner',
          matchMode: 'any',
          includeSubfolders: false,
          position: 0,
          rule: [{ kind: 'tag', tagId: tagSupport.value.id }],
          excludedTags: [{ kind: 'folder', folderId: emptyFolderA.value.id }],
        },
        NOW,
      ),
    ]);

    const cards = await db.unit.todos.loadMany([cardWithStatus.id, cardWithTag.id, cardWithNeither.id]);
    expect(cards).toHaveLength(3);
    const presence = await db.unit.timeEntries.exportPresence(cards.map((c) => c.id));

    let comparisons = 0;
    for (const column of columns) {
      const pool = await db.unit.pools.load(column.id);
      expect(pool).not.toBeNull();
      if (pool === null) continue;

      // Über den PORT aufgelöst (`PoolPort.resolveAxes`), nicht über die
      // Repo-interne `resolvePoolAxis` — anders als die allgemeine
      // Kreuzprüfung in `repo-todos.test.ts`, die auf die Modulfunktion
      // zugreift. Deckt damit den Port ab, den auch das Add-in ruft
      // (T-082 §5, `routes/addin/service.ts`, `unit.pools.resolveAxes`).
      const axes = await db.unit.pools.resolveAxes(column.id);
      const unresolvedRequired = tagAxisIsUnresolved({
        named: pool.rule.length,
        resolved: axes.required.tagIds.length,
        emptyTerms: axes.required.emptyFolderIds.length,
      });

      const sqlMembers = new Set((await db.unit.pools.members(column.id)).items.map((t) => t.id));

      for (const card of cards) {
        const cardPresence = presence.get(card.id);
        const domainVerdict = matchesPool({
          todoTagIds: card.tagIds,
          ruleTagIds: axes.required.tagIds,
          matchMode: pool.matchMode,
          excludedTagIds: axes.excluded.tagIds,
          todoStatusId: card.statusId,
          ruleStatusIds: pool.statusIds,
          completedAt: card.completedAt,
          completion: pool.completion,
          hasOpenEntries: cardPresence?.hasOpen ?? false,
          hasExportedEntries: cardPresence?.hasExported ?? false,
          exportState: pool.exportState,
          unresolvedRequired,
        });

        expect(sqlMembers.has(card.id)).toBe(domainVerdict);
        comparisons += 1;
      }
    }

    // Gegenprobe, dass die Schleife tatsächlich etwas geprüft hat.
    expect(comparisons).toBe(columns.length * cards.length);
    // Und dass mindestens ein Fall wirklich "nichts" liefert — sonst bewiese
    // ein Bestand, in dem zufällig alles leer ausgeht, denselben grünen Test.
    const emptyColumnsCount = (
      await Promise.all(columns.map(async (column) => (await db.unit.pools.members(column.id)).items.length))
    ).filter((count) => count === 0).length;
    expect(emptyColumnsCount).toBe(2); // Fall 1 und Fall 2 liefern nichts, Fall 3 liefert die Karte.
  });
});
