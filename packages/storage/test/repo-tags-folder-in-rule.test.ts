/**
 * Takt — T-095, Ordnersperre `tag_in_use` mit `details` (R-1 Befund 1, R-3
 * H-2, T-089).
 *
 * Bis T-089 prüfte `TagFolderPort.remove` nur den **Inhalt** eines Ordners
 * (Unterordner, Tags). Ein leerer Ordner, der in der Regel eines Pools
 * verwendet wird, ließ sich löschen — und die Regel „Ordner Ost **und**
 * Status offen" verlor dabei still ihren Term und traf danach **mehr**, als
 * der Benutzer gesagt hatte (E-057, in die Richtung, die E-057 als die
 * gefährliche bezeichnet).
 *
 * Seit T-089 weist `remove` mit `tag_in_use` ab, sobald ein Ordner in
 * `pool_rule` steht, und nennt die betroffenen Regeln in `details`
 * (`{ field: <Pool-Kennung>, code: 'pool_rule', message: 'Regel „…“' }`,
 * `mappers.ts#poolReference`). Migration 0012 setzt zusätzlich
 * `pool_rule.folder_id` auf `ON DELETE RESTRICT` — die Datenbank als zweite
 * Wache, für den Fall, dass eines Tages ein zweiter Schreibpfad an dieser
 * Prüfung vorbeigeht.
 *
 * Diese Datei existiert unverändert seit T-089 (kein Rot-Zustand am
 * Produktivcode während dieser Aufgabe); sie schließt die bislang fehlende
 * Prüfabdeckung an genau dieser Verhaltensänderung.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NOW, openTestDatabase, type TestDatabase } from './support/setup.ts';

describe('TagFolderPort.remove — ein leerer Ordner in der Regel eines Pools wird abgewiesen (tag_in_use, T-089)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('ein leerer Ordner, den eine Regel als erforderlichen Term nennt, wird mit tag_in_use und der Regel in details abgewiesen', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Ost', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;

    const pool = await db.unit.pools.create(
      {
        name: 'Wartung Nord',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'folder', folderId: folder.value.id }],
      },
      NOW,
    );

    const removed = await db.unit.folders.remove(folder.value.id);

    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('tag_in_use');

    const details = removed.error.details;
    expect(details).toBeDefined();
    expect(details?.length).toBeGreaterThan(0);
    expect(details?.[0]?.code).toBe('pool_rule');
    expect(details?.[0]?.field).toBe(pool.id);
    expect(details?.[0]?.message).toContain('Wartung Nord');

    // Der Ordner ist unangetastet: Die Abweisung hat nichts halb gelöscht.
    expect(await db.unit.folders.load(folder.value.id)).not.toBeNull();
  });

  it('ein leerer Ordner in einer AUSGESCHLOSSENEN Achse wird ebenso abgewiesen — die Sperre fragt nicht nach der Rolle', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Ausschluss-Ordner', NOW);
    const tag = await db.unit.tags.create(null, 'Support', null, NOW);
    expect(folder.ok && tag.ok).toBe(true);
    if (!folder.ok || !tag.ok) return;

    await db.unit.pools.create(
      {
        name: 'Alles außer Ausschluss',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tag.value.id }],
        excludedTags: [{ kind: 'folder', folderId: folder.value.id }],
      },
      NOW,
    );

    const removed = await db.unit.folders.remove(folder.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('tag_in_use');
  });

  it('nennt MEHRERE Regeln, wenn derselbe Ordner in mehr als einer Regel steht', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Geteilter Ordner', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;

    // `position: 0` bei beiden — Absicht, kein Versehen: `pools.create` nimmt
    // eine ausdrückliche Position erst ab 1 an (O-B) und weist bei 0 selbst
    // die nächste zu (`nextPosition()`); zwei Pools mit derselben
    // ausgesprochenen Position kollidierten sonst am eindeutigen Index.
    const first = await db.unit.pools.create(
      { name: 'Erste Regel', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'folder', folderId: folder.value.id }] },
      NOW,
    );
    const second = await db.unit.pools.create(
      { name: 'Zweite Regel', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'folder', folderId: folder.value.id }] },
      NOW,
    );

    const removed = await db.unit.folders.remove(folder.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;

    const details = removed.error.details;
    expect(details?.map((entry) => entry.field).sort()).toEqual([first.id, second.id].sort());
    const messages = details?.map((entry) => entry.message).join(' | ') ?? '';
    expect(messages).toContain('Erste Regel');
    expect(messages).toContain('Zweite Regel');
  });

  it('Gegenprobe: derselbe leere Ordner OHNE Regel lässt sich weiterhin löschen (die Sperre trifft nur den echten Fall)', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Unbenutzt', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;

    const removed = await db.unit.folders.remove(folder.value.id);
    expect(removed.ok).toBe(true);
    expect(await db.unit.folders.load(folder.value.id)).toBeNull();
  });

  it('Gegenprobe: ein Ordner, dessen Regel entfernt wurde, lässt sich danach löschen — die Sperre hängt am aktuellen Bestand, nicht an der Vergangenheit', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Erst benutzt, dann frei', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;

    const pool = await db.unit.pools.create(
      { name: 'Vorübergehend', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'folder', folderId: folder.value.id }] },
      NOW,
    );

    const blockedFirst = await db.unit.folders.remove(folder.value.id);
    expect(blockedFirst.ok).toBe(false);

    // Die Regel wird geändert, sodass sie den Ordner nicht mehr nennt.
    const updated = await db.unit.pools.update(pool.id, { rule: [] }, NOW);
    expect(updated.ok).toBe(true);

    const removedAfterUnlink = await db.unit.folders.remove(folder.value.id);
    expect(removedAfterUnlink.ok).toBe(true);
    expect(await db.unit.folders.load(folder.value.id)).toBeNull();
  });
});
