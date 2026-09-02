/**
 * Takt — T-027, Nachtrag: die restlichen Fehlerzweige der Adapter.
 *
 * Diese Datei ergänzt die Zweigabdeckung (Branches) über mehrere Repositorys
 * hinweg — insbesondere die `attempt(...)`-Fehlerzweige, die nur bei einer
 * tatsächlichen Verletzung eines eindeutigen Index auftreten und deshalb in
 * den themenbezogenen Testdateien noch nicht ausgelöst wurden.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NOW, openTestDatabase, type TestDatabase } from './support/setup.ts';

describe('createTagPort — Namenskonflikte über den eindeutigen Index (ux_tag_name)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('zwei Tags mit demselben Namen auf Wurzelebene: das zweite ergibt name_conflict', async () => {
    db = openTestDatabase();
    const first = await db.unit.tags.create(null, 'Doppelt', null, NOW);
    expect(first.ok).toBe(true);

    const second = await db.unit.tags.create(null, 'Doppelt', null, NOW);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('name_conflict');
  });

  it('rename auf einen bereits vergebenen Namen im selben Ordner ergibt name_conflict', async () => {
    db = openTestDatabase();
    await db.unit.tags.create(null, 'A', null, NOW);
    const other = await db.unit.tags.create(null, 'B', null, NOW);
    expect(other.ok).toBe(true);
    if (!other.ok) return;

    const renamed = await db.unit.tags.rename(other.value.id, 'A', NOW);
    expect(renamed.ok).toBe(false);
    if (renamed.ok) return;
    expect(renamed.error.code).toBe('name_conflict');
  });

  it('move in einen Ordner, der bereits ein gleichnamiges Tag enthält, ergibt name_conflict', async () => {
    db = openTestDatabase();
    const folder = await db.unit.folders.create(null, 'Ziel', NOW);
    expect(folder.ok).toBe(true);
    if (!folder.ok) return;
    await db.unit.tags.create(folder.value.id, 'Kollision', null, NOW);
    const toMove = await db.unit.tags.create(null, 'Kollision', null, NOW);
    expect(toMove.ok).toBe(true);
    if (!toMove.ok) return;

    const moved = await db.unit.tags.move(toMove.value.id, folder.value.id, NOW);
    expect(moved.ok).toBe(false);
  });
});

describe('createTagFolderPort — Namenskonflikte über den eindeutigen Index (ux_tag_folder_name)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('zwei Ordner mit demselben Namen auf Wurzelebene: der zweite ergibt name_conflict', async () => {
    db = openTestDatabase();
    await db.unit.folders.create(null, 'Doppelt', NOW);
    const second = await db.unit.folders.create(null, 'Doppelt', NOW);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('name_conflict');
  });

  it('rename eines Ordners auf einen bereits vergebenen Namen ergibt einen Fehlschlag', async () => {
    db = openTestDatabase();
    await db.unit.folders.create(null, 'A', NOW);
    const other = await db.unit.folders.create(null, 'B', NOW);
    expect(other.ok).toBe(true);
    if (!other.ok) return;

    const renamed = await db.unit.folders.rename(other.value.id, 'A', NOW);
    expect(renamed.ok).toBe(false);
  });

  it('move in einen Ordner, der bereits einen gleichnamigen Unterordner hat, ergibt einen Fehlschlag', async () => {
    db = openTestDatabase();
    const target = await db.unit.folders.create(null, 'Ziel', NOW);
    expect(target.ok).toBe(true);
    if (!target.ok) return;
    await db.unit.folders.create(target.value.id, 'Kollision', NOW);
    const toMove = await db.unit.folders.create(null, 'Kollision', NOW);
    expect(toMove.ok).toBe(true);
    if (!toMove.ok) return;

    const moved = await db.unit.folders.move(toMove.value.id, target.value.id, NOW);
    expect(moved.ok).toBe(false);
  });
});

describe('createExportTemplatePort — Namenskonflikt (ux_export_template_name)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('zwei eigene Vorlagen mit demselben Namen: die zweite scheitert', async () => {
    db = openTestDatabase();
    await db.unit.templates.create('Meine Vorlage', { fields: [] }, NOW);
    const second = await db.unit.templates.create('Meine Vorlage', { fields: [] }, NOW);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('name_conflict');
  });

  it('update auf einen bereits vergebenen Namen scheitert ebenfalls', async () => {
    db = openTestDatabase();
    await db.unit.templates.create('Erste', { fields: [] }, NOW);
    const second = await db.unit.templates.create('Zweite', { fields: [] }, NOW);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const updated = await db.unit.templates.update(second.value.id, 'Erste', undefined, NOW);
    expect(updated.ok).toBe(false);
  });
});

describe('createTodoStatusPort — weitere Zweige von create/update/remove', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('update ändert ausschließlich die Farbe, ohne den Namen zu berühren', async () => {
    db = openTestDatabase();
    const created = await db.unit.statuses.create('Spalte', 0, NOW);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.statuses.update(created.value.id, { color: '#123456' }, NOW);
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.color).toBe('#123456');
    expect(updated.value.name).toBe('Spalte');
  });

  it('update mit isDefault: false lässt die vorhandene Standardspalte unangetastet', async () => {
    db = openTestDatabase();
    const created = await db.unit.statuses.create('Spalte', 0, NOW);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.statuses.update(created.value.id, { isDefault: false }, NOW);
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.isDefault).toBe(false);

    const stillDefault = await db.unit.statuses.defaultStatus();
    expect(stillDefault.isDefault).toBe(true);
  });
});

describe('createTimeEntryPort.update — jedes optionale Feld einzeln (Zweigabdeckung)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('update ausschließlich der Startzeit lässt Ende und Notiz unangetastet', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const created = await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: '2026-08-31T08:00:00Z' as never, endedAt: '2026-08-31T08:10:00Z' as never, note: 'x' },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.timeEntries.update(created.value.id, { startedAt: '2026-08-31T07:00:00Z' as never }, NOW);
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.startedAt).toBe('2026-08-31T07:00:00Z');
    expect(updated.value.note).toBe('x');
  });

  it('update ausschließlich der Endzeit', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const created = await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: '2026-08-31T08:00:00Z' as never, endedAt: '2026-08-31T08:10:00Z' as never, note: '' },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.timeEntries.update(created.value.id, { endedAt: '2026-08-31T08:20:00Z' as never }, NOW);
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.endedAt).toBe('2026-08-31T08:20:00Z');
  });

  it('update ausschließlich der todoId', async () => {
    db = openTestDatabase();
    const todoA = await db.unit.todos.create(
      { title: 'A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const todoB = await db.unit.todos.create(
      { title: 'B', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const created = await db.unit.timeEntries.create(
      { todoId: todoA.id, startedAt: '2026-08-31T08:00:00Z' as never, endedAt: '2026-08-31T08:10:00Z' as never, note: '' },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.timeEntries.update(created.value.id, { todoId: todoB.id }, NOW);
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.todoId).toBe(todoB.id);
  });
});
