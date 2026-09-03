/**
 * Takt — T-027, Kanban-Spalten (A-5.3, A-5.4, E-023).
 *
 * `packages/storage/src/sqlite/repo-statuses.ts` lag laut T-021-Bericht
 * (Risiko 1) bei 0 Prozent Abdeckung.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NOW, openTestDatabase, type TestDatabase } from './support/setup.ts';

describe('createTodoStatusPort — anlegen mit Platz schaffen, Neuordnung, Löschregeln', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('list liefert die aus Migration 0002 mitgelieferte Standardspalte', async () => {
    db = openTestDatabase();
    const list = await db.unit.statuses.list();
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((s) => s.isDefault)).toBe(true);
  });

  it('defaultStatus liefert die als Standard markierte Spalte, sonst die vorderste', async () => {
    db = openTestDatabase();
    const status = await db.unit.statuses.defaultStatus();
    expect(status.isDefault).toBe(true);
  });

  it('create ohne Position hängt hinten an; mit Position rückt alles ab dort um eins weiter', async () => {
    db = openTestDatabase();
    const before = await db.unit.statuses.list();
    const appended = await db.unit.statuses.create('Neu hinten', 0, NOW);
    expect(appended.ok).toBe(true);
    if (!appended.ok) return;
    expect(appended.value.position).toBe(before.length + 1);

    const inserted = await db.unit.statuses.create('Eingefügt vorn', 1, NOW);
    expect(inserted.ok).toBe(true);
    if (!inserted.ok) return;
    expect(inserted.value.position).toBe(1);

    const after = await db.unit.statuses.list();
    // Keine zwei Spalten teilen sich eine Position — der eindeutige Index
    // hätte sonst abgewiesen.
    const positions = after.map((s) => s.position);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('create mit einem bereits vergebenen Namen ergibt name_conflict', async () => {
    db = openTestDatabase();
    const first = await db.unit.statuses.create('Doppelt', 0, NOW);
    expect(first.ok).toBe(true);
    const second = await db.unit.statuses.create('Doppelt', 0, NOW);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('name_conflict');
  });

  it('update setzt isDefault exklusiv — die vorige Standardspalte verliert die Markierung', async () => {
    db = openTestDatabase();
    const created = await db.unit.statuses.create('Kandidat', 0, NOW);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.statuses.update(created.value.id, { isDefault: true }, NOW);
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.isDefault).toBe(true);

    const list = await db.unit.statuses.list();
    expect(list.filter((s) => s.isDefault)).toHaveLength(1);
  });

  it('update auf eine unbekannte Spalte ergibt not_found', async () => {
    db = openTestDatabase();
    const result = await db.unit.statuses.update('unbekannt' as never, { name: 'x' }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('reorder verlangt jede bestehende Spalte genau einmal — Teilstücke werden abgelehnt', async () => {
    db = openTestDatabase();
    const before = await db.unit.statuses.list();
    const extra = await db.unit.statuses.create('Zusätzlich', 0, NOW);
    expect(extra.ok).toBe(true);
    if (!extra.ok) return;

    const incomplete = await db.unit.statuses.reorder([before[0]!.id], NOW);
    expect(incomplete.ok).toBe(false);
    if (incomplete.ok) return;
    expect(incomplete.error.code).toBe('validation_error');

    const duplicated = await db.unit.statuses.reorder([extra.value.id, extra.value.id], NOW);
    expect(duplicated.ok).toBe(false);
  });

  it('reorder setzt die neue Reihenfolge vollständig, ohne den eindeutigen Index zu verletzen', async () => {
    db = openTestDatabase();
    const a = await db.unit.statuses.create('A', 0, NOW);
    const b = await db.unit.statuses.create('B', 0, NOW);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const all = await db.unit.statuses.list();
    const order = [b.value.id, a.value.id, ...all.map((s) => s.id).filter((id) => id !== a.value.id && id !== b.value.id)];

    const reordered = await db.unit.statuses.reorder(order, NOW);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) return;
    expect(reordered.value.map((s) => s.id)).toEqual(order);
    expect(reordered.value.map((s) => s.position)).toEqual(order.map((_, index) => index + 1));
  });

  it('die letzte Spalte kann nicht gelöscht werden', async () => {
    db = openTestDatabase();
    const list = await db.unit.statuses.list();
    // Alle bis auf eine entfernen.
    for (const status of list.slice(1)) {
      await db.unit.statuses.remove(status.id);
    }
    const remaining = await db.unit.statuses.list();
    expect(remaining).toHaveLength(1);

    const result = await db.unit.statuses.remove(remaining[0]!.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('last_status_column');
  });

  it('eine Spalte mit Todos wird nicht gelöscht (status_in_use)', async () => {
    db = openTestDatabase();
    const extra = await db.unit.statuses.create('Belegt', 0, NOW);
    expect(extra.ok).toBe(true);
    if (!extra.ok) return;
    await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: extra.value.id, tagIds: [], note: '', now: NOW },
      [],
    );

    const result = await db.unit.statuses.remove(extra.value.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('status_in_use');
  });

  it('ein in der Regel eines Pools oder einer Kanban-Spalte verwendeter Status wird nicht gelöscht (status_in_use, T-076)', async () => {
    db = openTestDatabase();
    const extra = await db.unit.statuses.create('In Regel', 0, NOW);
    expect(extra.ok).toBe(true);
    if (!extra.ok) return;
    await db.unit.pools.create(
      { name: 'Spalte über Status', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], statusIds: [extra.value.id] },
      NOW,
    );

    const result = await db.unit.statuses.remove(extra.value.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('status_in_use');
  });

  it('remove auf eine unbekannte Spalte ergibt not_found; eine leere zusätzliche Spalte lässt sich löschen', async () => {
    db = openTestDatabase();
    expect((await db.unit.statuses.remove('unbekannt' as never)).ok).toBe(false);

    const extra = await db.unit.statuses.create('Leer', 0, NOW);
    expect(extra.ok).toBe(true);
    if (!extra.ok) return;
    const removed = await db.unit.statuses.remove(extra.value.id);
    expect(removed.ok).toBe(true);
    expect(await db.unit.statuses.load(extra.value.id)).toBeNull();
  });
});
