/**
 * Takt — T-027, Tags, Tag-Ordner und Pools (A-3.*, A-4.*, A-9.*, E-022).
 *
 * `packages/storage/src/sqlite/repo-tags.ts` lag laut T-021-Bericht (Risiko 1)
 * bei 0 Prozent Abdeckung. Zuschnitt nach Schaden (T-027-Auftrag): vier Ebenen
 * tief anlegen, ein Tag verschieben, einen Ordner verschieben, ein Ordner in
 * sich selbst verschieben wird abgelehnt — dazu die Pool-Auflösung mit und
 * ohne Unterordner, `any` gegen `all`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { poolMatchMode } from '../src/sqlite/repo-tags.ts';
import { NOW, openTestDatabase, type TestDatabase } from './support/setup.ts';

describe('createTagFolderPort — vier Ebenen tief, Vorfahren und Nachfahren (A-4.3, A-4.6)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('legt vier verschachtelte Ordner an und liest ancestors/subtree korrekt', async () => {
    db = openTestDatabase();
    const level1 = await db.unit.folders.create(null, 'Ebene 1', NOW);
    expect(level1.ok).toBe(true);
    if (!level1.ok) return;
    const level2 = await db.unit.folders.create(level1.value.id, 'Ebene 2', NOW);
    expect(level2.ok).toBe(true);
    if (!level2.ok) return;
    const level3 = await db.unit.folders.create(level2.value.id, 'Ebene 3', NOW);
    expect(level3.ok).toBe(true);
    if (!level3.ok) return;
    const level4 = await db.unit.folders.create(level3.value.id, 'Ebene 4', NOW);
    expect(level4.ok).toBe(true);
    if (!level4.ok) return;

    const ancestorsOfDeepest = await db.unit.folders.ancestors(level4.value.id);
    // Von unten aufwärts, der Ordner selbst ist nicht enthalten.
    expect(ancestorsOfDeepest).toEqual([level3.value.id, level2.value.id, level1.value.id]);

    const subtreeOfRoot = await db.unit.folders.subtree(level1.value.id);
    expect([...subtreeOfRoot].sort()).toEqual(
      [level1.value.id, level2.value.id, level3.value.id, level4.value.id].sort(),
    );

    expect(await db.unit.folders.ancestors(level1.value.id)).toEqual([]);
    expect(await db.unit.folders.subtree(level4.value.id)).toEqual([level4.value.id]);
  });

  it('verschiebt einen Ordner zu einem neuen Elternteil', async () => {
    db = openTestDatabase();
    const a = await db.unit.folders.create(null, 'A', NOW);
    const b = await db.unit.folders.create(null, 'B', NOW);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    const moved = await db.unit.folders.move(b.value.id, a.value.id, NOW);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.value.parentId).toBe(a.value.id);

    expect(await db.unit.folders.ancestors(b.value.id)).toEqual([a.value.id]);
  });

  it('ein Ordner kann nicht in sich selbst verschoben werden (A-4.6)', async () => {
    db = openTestDatabase();
    const a = await db.unit.folders.create(null, 'A', NOW);
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    const result = await db.unit.folders.move(a.value.id, a.value.id, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('tag_folder_cycle');

    // Nichts hat sich geändert.
    const reloaded = await db.unit.folders.load(a.value.id);
    expect(reloaded?.parentId).toBeNull();
  });

  it('ein Ordner kann nicht in einen seiner eigenen Unterordner verschoben werden (A-4.6)', async () => {
    db = openTestDatabase();
    const parent = await db.unit.folders.create(null, 'Eltern', NOW);
    expect(parent.ok).toBe(true);
    if (!parent.ok) return;
    const child = await db.unit.folders.create(parent.value.id, 'Kind', NOW);
    expect(child.ok).toBe(true);
    if (!child.ok) return;

    const result = await db.unit.folders.move(parent.value.id, child.value.id, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('tag_folder_cycle');
  });

  it('move auf einen unbekannten Ordner oder Zielordner ergibt not_found', async () => {
    db = openTestDatabase();
    const a = await db.unit.folders.create(null, 'A', NOW);
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    expect((await db.unit.folders.move('unbekannt' as never, null, NOW)).ok).toBe(false);
    expect((await db.unit.folders.move(a.value.id, 'unbekannt' as never, NOW)).ok).toBe(false);
  });

  it('ein Ordner mit Inhalt (Unterordner oder Tags) wird nicht gelöscht', async () => {
    db = openTestDatabase();
    const parent = await db.unit.folders.create(null, 'Eltern', NOW);
    expect(parent.ok).toBe(true);
    if (!parent.ok) return;
    await db.unit.folders.create(parent.value.id, 'Kind', NOW);

    const removed = await db.unit.folders.remove(parent.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('tag_folder_not_empty');
  });

  it('ein leerer Ordner lässt sich löschen', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Leer', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;

    const removed = await db.unit.folders.remove(folder.value.id);
    expect(removed.ok).toBe(true);
    expect(await db.unit.folders.load(folder.value.id)).toBeNull();
  });

  it('loadTree liefert Wurzelordner, verschachtelte Unterordner und Wurzeltags in einem Aufruf (A-10.4)', async () => {
    db = openTestDatabase();
    const root = await db.unit.folders.create(null, 'Wurzel', NOW);
    expect(root.ok).toBe(true);
    if (!root.ok) return;
    const child = await db.unit.folders.create(root.value.id, 'Kind', NOW);
    expect(child.ok).toBe(true);
    if (!child.ok) return;

    const tagInChild = await db.unit.tags.create(child.value.id, 'Im Kind', null, NOW);
    const rootTag = await db.unit.tags.create(null, 'Wurzeltag', null, NOW);
    expect(tagInChild.ok && rootTag.ok).toBe(true);
    if (!tagInChild.ok || !rootTag.ok) return;

    const tree = await db.unit.folders.loadTree();

    expect(tree.rootTags.map((t) => t.id)).toEqual([rootTag.value.id]);
    expect(tree.rootFolders).toHaveLength(1);
    const rootNode = tree.rootFolders[0];
    expect(rootNode?.folder.id).toBe(root.value.id);
    expect(rootNode?.subfolders).toHaveLength(1);
    expect(rootNode?.subfolders[0]?.folder.id).toBe(child.value.id);
    expect(rootNode?.subfolders[0]?.tags.map((t) => t.id)).toEqual([tagInChild.value.id]);
  });

  it('loadTree bewältigt eine tausendfach verschachtelte Kette, ohne einen Stapelüberlauf (iterativer Aufbau)', async () => {
    db = openTestDatabase();
    let parentId: string | null = null;
    for (let level = 0; level < 500; level += 1) {
      const created = await db.unit.folders.create(parentId as never, `Ebene ${level}`, NOW);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      parentId = created.value.id;
    }

    const tree = await db.unit.folders.loadTree();
    // Nur ein Wurzelordner, der Rest hängt darunter — der Aufbau darf nicht
    // rekursiv über 500 Ebenen aufrufen.
    expect(tree.rootFolders).toHaveLength(1);
  });

  it('rename auf einen unbekannten Ordner ergibt not_found', async () => {
    db = openTestDatabase();
    const result = await db.unit.folders.rename('unbekannt' as never, 'x', NOW);
    expect(result.ok).toBe(false);
  });

  it('listChildren liefert Wurzelebene für null und die Kinder eines Ordners sonst', async () => {
    db = openTestDatabase();
    const root = await db.unit.folders.create(null, 'A', NOW);
    expect(root.ok).toBe(true);
    if (!root.ok) return;
    await db.unit.folders.create(root.value.id, 'B', NOW);

    expect((await db.unit.folders.listChildren(null)).map((f) => f.id)).toEqual([root.value.id]);
    expect((await db.unit.folders.listChildren(root.value.id)).map((f) => f.name)).toEqual(['B']);
  });
});

describe('createTagPort — anlegen, verschieben, löschen mit Benutzungsprüfung (A-4.5)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('verschiebt ein Tag in einen anderen Ordner', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Ziel', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;
    const tag = await db.unit.tags.create(null, 'Tag', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;

    const moved = await db.unit.tags.move(tag.value.id, folder.value.id, NOW);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.value.folderId).toBe(folder.value.id);
  });

  it('move/rename auf ein unbekanntes Tag ergibt not_found', async () => {
    db = openTestDatabase();
    expect((await db.unit.tags.move('unbekannt' as never, null, NOW)).ok).toBe(false);
    expect((await db.unit.tags.rename('unbekannt' as never, 'x', NOW)).ok).toBe(false);
  });

  it('ein an einem Todo hängendes Tag wird nicht gelöscht', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Tag', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;
    await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tag.value.id],
    );

    const removed = await db.unit.tags.remove(tag.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('tag_in_use');
  });

  it('ein in einer Pool-Regel verwendetes Tag wird nicht gelöscht — und details nennt die Regel beim Namen (T-101, R-1a Befund 1)', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Tag', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;
    const pool = await db.unit.pools.create(
      { name: 'Wartung Süd', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'tag', tagId: tag.value.id }] },
      NOW,
    );

    const removed = await db.unit.tags.remove(tag.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('tag_in_use');

    // Bis T-101 lieferte `TagPort.remove` als EINZIGER der drei
    // Sperr-Erzeuger (Ordner, Status, Tag) kein `details` — der Löschdialog
    // der Oberfläche konnte die Regel deshalb nicht beim Namen nennen
    // (gemessen im Bericht T-099). Dieselbe Gestalt wie bei
    // `TagFolderPort.remove` (`repo-tags-folder-in-rule.test.ts`):
    // `{ field: <Pool-Kennung>, code: 'pool_rule', message: 'Regel „…“' }`.
    const details = removed.error.details;
    expect(details).toBeDefined();
    expect(details?.length).toBeGreaterThan(0);
    expect(details?.[0]?.code).toBe('pool_rule');
    expect(details?.[0]?.field).toBe(pool.id);
    expect(details?.[0]?.message).toContain('Wartung Süd');
    expect(removed.error.message).toContain('Dieses Tag wird in der Regel eines Pools verwendet.');
  });

  it('nennt MEHRERE Regeln, wenn dasselbe Tag in mehr als einer Regel steht', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Geteiltes Tag', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;

    const first = await db.unit.pools.create(
      { name: 'Erste Regel', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'tag', tagId: tag.value.id }] },
      NOW,
    );
    const second = await db.unit.pools.create(
      { name: 'Zweite Regel', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'tag', tagId: tag.value.id }] },
      NOW,
    );

    const removed = await db.unit.tags.remove(tag.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;

    const details = removed.error.details;
    expect(details?.map((entry) => entry.field).sort()).toEqual([first.id, second.id].sort());
    const messages = details?.map((entry) => entry.message).join(' | ') ?? '';
    expect(messages).toContain('Erste Regel');
    expect(messages).toContain('Zweite Regel');
  });

  it('H-3 Obergrenze: 21 Regeln nennen dasselbe Tag — genannt werden nur die ersten 20, mit Hinweistext (R-3a H-3)', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Vielfach benutztes Tag', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;

    const createdIds: string[] = [];
    for (let index = 1; index <= 21; index += 1) {
      const pool = await db.unit.pools.create(
        {
          name: `Regel ${String(index).padStart(2, '0')}`,
          matchMode: 'any',
          includeSubfolders: false,
          // position: 0 — pools.create weist bei 0 selbst die nächste Position
          // zu (O-B, siehe repo-tags-folder-in-rule.test.ts), damit die
          // Reihenfolge der Anlage der Reihenfolge in `details` entspricht
          // (die Abfrage sortiert `ORDER BY p.position, p.name`).
          position: 0,
          rule: [{ kind: 'tag', tagId: tag.value.id }],
        },
        NOW,
      );
      createdIds.push(pool.id);
    }
    expect(createdIds).toHaveLength(21);

    const removed = await db.unit.tags.remove(tag.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('tag_in_use');

    const details = removed.error.details;
    expect(details).toHaveLength(20);
    // Die ersten 20 der 21 angelegten Regeln — nicht die letzten 20.
    expect(details?.map((entry) => entry.field)).toEqual(createdIds.slice(0, 20));
    expect(details?.some((entry) => entry.field === createdIds[20])).toBe(false);
    expect(removed.error.message).toBe(
      'Dieses Tag wird in der Regel eines Pools verwendet. Es sind mehr als 20; genannt werden die ersten 20.',
    );
  });

  it('ein als Standard-Tag gesetztes Tag wird nicht gelöscht (A-9.*)', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Standard', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;
    await db.unit.defaultTags.set([tag.value.id], NOW);

    const removed = await db.unit.tags.remove(tag.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('tag_in_use');
  });

  it('ein unbenutztes Tag lässt sich löschen', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Frei', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;

    const removed = await db.unit.tags.remove(tag.value.id);
    expect(removed.ok).toBe(true);
    expect(await db.unit.tags.load(tag.value.id)).toBeNull();
  });

  it('remove auf ein unbekanntes Tag ergibt not_found', async () => {
    db = openTestDatabase();
    const result = await db.unit.tags.remove('unbekannt' as never);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('listInFolder liefert Wurzelebene für null und den Ordnerinhalt sonst, alphabetisch', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Ordner', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;
    await db.unit.tags.create(folder.value.id, 'Zebra', null, NOW);
    await db.unit.tags.create(folder.value.id, 'Anton', null, NOW);
    await db.unit.tags.create(null, 'Wurzeltag', null, NOW);

    expect((await db.unit.tags.listInFolder(folder.value.id)).map((t) => t.name)).toEqual(['Anton', 'Zebra']);
    expect((await db.unit.tags.listInFolder(null)).map((t) => t.name)).toEqual(['Wurzeltag']);
  });

  it('setOnTodo ersetzt die Tagliste vollständig und verwirft Duplikate', async () => {
    db = openTestDatabase();
    const tagA = await db.unit.tags.create(null, 'A', null, NOW);
    const tagB = await db.unit.tags.create(null, 'B', null, NOW);
    expect(tagA.ok && tagB.ok).toBe(true);
    if (!tagA.ok || !tagB.ok) return;
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id],
    );

    await db.unit.tags.setOnTodo(todo.id, [tagB.value.id, tagB.value.id], NOW);

    const reloaded = await db.unit.todos.load(todo.id);
    expect(reloaded?.tagIds).toEqual([tagB.value.id]);
  });
});

describe('createPoolPort und resolvePoolRule — Regel gespeichert, Mitgliedschaft abgeleitet (A-3.*)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('matchMode "any": ein Todo mit mindestens einem Regel-Tag gehört zum Pool', async () => {
    db = openTestDatabase();
    const tagA = await db.unit.tags.create(null, 'A', null, NOW);
    const tagB = await db.unit.tags.create(null, 'B', null, NOW);
    expect(tagA.ok && tagB.ok).toBe(true);
    if (!tagA.ok || !tagB.ok) return;

    const pool = await db.unit.pools.create(
      {
        name: 'Pool',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagA.value.id }, { kind: 'tag', tagId: tagB.value.id }],
      },
      NOW,
    );

    const withA = await db.unit.todos.create(
      { title: 'MitA', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id],
    );
    await db.unit.todos.create(
      { title: 'OhneTag', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    const members = await db.unit.pools.members(pool.id);
    expect(members.items.map((t) => t.id)).toEqual([withA.id]);
  });

  it('matchMode "all": ein Todo muss jedes Regel-Tag tragen', async () => {
    db = openTestDatabase();
    const tagA = await db.unit.tags.create(null, 'A', null, NOW);
    const tagB = await db.unit.tags.create(null, 'B', null, NOW);
    expect(tagA.ok && tagB.ok).toBe(true);
    if (!tagA.ok || !tagB.ok) return;

    const pool = await db.unit.pools.create(
      {
        name: 'Pool',
        matchMode: 'all',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagA.value.id }, { kind: 'tag', tagId: tagB.value.id }],
      },
      NOW,
    );

    const both = await db.unit.todos.create(
      { title: 'Beide', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id, tagB.value.id],
    );
    await db.unit.todos.create(
      { title: 'NurA', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id],
    );

    const members = await db.unit.pools.members(pool.id);
    expect(members.items.map((t) => t.id)).toEqual([both.id]);
  });

  it('eine Ordner-Regel mit includeSubfolders zieht Tags aller Unterordner mit (A-3.3)', async () => {
    db = openTestDatabase();
    const parent = await db.unit.folders.create(null, 'Eltern', NOW);
    expect(parent.ok).toBe(true);
    if (!parent.ok) return;
    const child = await db.unit.folders.create(parent.value.id, 'Kind', NOW);
    expect(child.ok).toBe(true);
    if (!child.ok) return;
    const tagInChild = await db.unit.tags.create(child.value.id, 'Tief', null, NOW);
    expect(tagInChild.ok).toBe(true);
    if (!tagInChild.ok) return;

    const withSubfolders = await db.unit.pools.create(
      { name: 'Mit', matchMode: 'any', includeSubfolders: true, position: 0, rule: [{ kind: 'folder', folderId: parent.value.id }] },
      NOW,
    );
    const resolved = await db.unit.pools.resolveRule(withSubfolders.id);
    expect(resolved).toEqual([tagInChild.value.id]);

    const withoutSubfolders = await db.unit.pools.create(
      { name: 'Ohne', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'folder', folderId: parent.value.id }] },
      NOW,
    );
    expect(await db.unit.pools.resolveRule(withoutSubfolders.id)).toEqual([]);
  });

  it('ein Pool ohne aufgelöste Tags trifft keinen Todo — auch nicht "leer trifft alles"', async () => {
    db = openTestDatabase();
    const emptyFolder = await db.unit.folders.create(null, 'Leer', NOW);
    expect(emptyFolder.ok).toBe(true);
    if (!emptyFolder.ok) return;
    const pool = await db.unit.pools.create(
      { name: 'Leer', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'folder', folderId: emptyFolder.value.id }] },
      NOW,
    );
    await db.unit.todos.create(
      { title: 'Irgendeins', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    expect((await db.unit.pools.members(pool.id)).items).toEqual([]);
  });

  it('mehrere Pools im Filter wirken als Vereinigung, nicht als Schnitt (Annahme 8 aus T-021)', async () => {
    db = openTestDatabase();
    const tagA = await db.unit.tags.create(null, 'A', null, NOW);
    const tagB = await db.unit.tags.create(null, 'B', null, NOW);
    expect(tagA.ok && tagB.ok).toBe(true);
    if (!tagA.ok || !tagB.ok) return;
    const poolA = await db.unit.pools.create(
      { name: 'PoolA', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'tag', tagId: tagA.value.id }] },
      NOW,
    );
    const poolB = await db.unit.pools.create(
      { name: 'PoolB', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'tag', tagId: tagB.value.id }] },
      NOW,
    );
    const withA = await db.unit.todos.create(
      { title: 'A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id],
    );
    const withB = await db.unit.todos.create(
      { title: 'B', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagB.value.id],
    );

    const result = await db.unit.todos.search({ poolIds: [poolA.id, poolB.id] });
    expect(result.items.map((t) => t.id).sort()).toEqual([withA.id, withB.id].sort());
  });

  it('update ändert Name, Modus, Unterordner-Flag, Position und Regel', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'Tag', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;
    const pool = await db.unit.pools.create(
      { name: 'Alt', matchMode: 'any', includeSubfolders: false, position: 0, rule: [] },
      NOW,
    );

    const updated = await db.unit.pools.update(
      pool.id,
      { name: 'Neu', matchMode: 'all', includeSubfolders: true, position: 5, rule: [{ kind: 'tag', tagId: tag.value.id }] },
      NOW,
    );

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value).toMatchObject({ name: 'Neu', matchMode: 'all', includeSubfolders: true, position: 5 });
    expect(updated.value.rule).toEqual([{ kind: 'tag', tagId: tag.value.id }]);
  });

  it('update/remove auf einen unbekannten Pool ergibt not_found', async () => {
    db = openTestDatabase();
    expect((await db.unit.pools.update('unbekannt' as never, { name: 'x' }, NOW)).ok).toBe(false);
    expect((await db.unit.pools.remove('unbekannt' as never)).ok).toBe(false);
  });

  it('list liefert alle Pools nach Position sortiert', async () => {
    db = openTestDatabase();
    await db.unit.pools.create({ name: 'Zweiter', matchMode: 'any', includeSubfolders: false, position: 2, rule: [] }, NOW);
    await db.unit.pools.create({ name: 'Erster', matchMode: 'any', includeSubfolders: false, position: 1, rule: [] }, NOW);

    const list = await db.unit.pools.list();
    expect(list.map((p) => p.name)).toEqual(['Erster', 'Zweiter']);
  });

  it('position 0 beim Anlegen vergibt automatisch die nächste freie Position', async () => {
    db = openTestDatabase();
    const first = await db.unit.pools.create({ name: 'A', matchMode: 'any', includeSubfolders: false, position: 0, rule: [] }, NOW);
    const second = await db.unit.pools.create({ name: 'B', matchMode: 'any', includeSubfolders: false, position: 0, rule: [] }, NOW);
    expect(second.position).toBeGreaterThan(first.position);
  });
});

describe('createPoolPort — die vier neuen Achsen aus T-076 (ausgeschlossene Tags, Status, Erledigt, Exportstatus)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('create/load: excludedTags, statusIds, completion und exportState kommen zurück, wie sie hineingingen', async () => {
    db = openTestDatabase();
    const required = await db.unit.tags.create(null, 'Erforderlich', null, NOW);
    const excluded = await db.unit.tags.create(null, 'Ausgeschlossen', null, NOW);
    expect(required.ok && excluded.ok).toBe(true);
    if (!required.ok || !excluded.ok) return;
    const status = await db.unit.statuses.create('Sonderstatus', 0, NOW);
    expect(status.ok).toBe(true);
    if (!status.ok) return;

    const pool = await db.unit.pools.create(
      {
        name: 'Vier Achsen',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: required.value.id }],
        excludedTags: [{ kind: 'tag', tagId: excluded.value.id }],
        statusIds: [status.value.id],
        completion: 'done',
        exportState: 'exported',
      },
      NOW,
    );

    const loaded = await db.unit.pools.load(pool.id);
    expect(loaded?.rule).toEqual([{ kind: 'tag', tagId: required.value.id }]);
    expect(loaded?.excludedTags).toEqual([{ kind: 'tag', tagId: excluded.value.id }]);
    expect(loaded?.statusIds).toEqual([status.value.id]);
    expect(loaded?.completion).toBe('done');
    expect(loaded?.exportState).toBe('exported');
  });

  it('update mit NUR excludedTags lässt die erforderlichen Tags unverändert (Vollständigkeitszusage aus PoolPort.update)', async () => {
    db = openTestDatabase();
    const required = await db.unit.tags.create(null, 'Erforderlich', null, NOW);
    const excluded = await db.unit.tags.create(null, 'Ausgeschlossen', null, NOW);
    expect(required.ok && excluded.ok).toBe(true);
    if (!required.ok || !excluded.ok) return;
    const pool = await db.unit.pools.create(
      {
        name: 'Teiländerung',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: required.value.id }],
      },
      NOW,
    );

    const updated = await db.unit.pools.update(
      pool.id,
      { excludedTags: [{ kind: 'tag', tagId: excluded.value.id }] },
      NOW,
    );

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    // Die erforderlichen Tags standen nicht im Aufruf — sie bleiben stehen.
    expect(updated.value.rule).toEqual([{ kind: 'tag', tagId: required.value.id }]);
    expect(updated.value.excludedTags).toEqual([{ kind: 'tag', tagId: excluded.value.id }]);
  });
});

describe('poolMatchMode', () => {
  it('liefert "all" nur, wenn genau das in der Zeile steht, sonst "any"', async () => {
    const db = openTestDatabase();
    try {
      const pool = await db.unit.pools.create({ name: 'P', matchMode: 'all', includeSubfolders: false, position: 0, rule: [] }, NOW);
      expect(poolMatchMode(db.conn, pool.id)).toBe('all');
      expect(poolMatchMode(db.conn, 'unbekannt')).toBe('any');
    } finally {
      db.close();
    }
  });
});
