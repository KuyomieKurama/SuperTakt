/**
 * Takt — T-027, Todos und der interne Vermerk (A-2.*, A-5.*, A-7.1, A-7.2, A-10.9).
 *
 * `packages/storage/src/sqlite/repo-todos.ts` lag laut T-021-Bericht (Risiko 1)
 * bei 0 Prozent Abdeckung. Schwerpunkt: die Notiz-Trennung auf der Leseseite
 * (A-7.2, R-06), welche `tagIds` `create` tatsächlich schreibt (die Antwort auf
 * offene Frage 4 aus T-019), Suche/Filter/Blätterung, und dass eine Buchung an
 * einem Todo dessen Löschen verhindert.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NOW, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

describe('createTodoPort.create — die Notiz-Trennung und welche tagIds geschrieben werden (A-7.2, A-9.5, T-019 Frage 4)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('schreibt einen nicht leeren Vermerk in derselben Transaktion (Befund 1 aus T-021)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'Aus dem Add-in', callNumber: null, statusId: null, tagIds: [], note: 'aus der E-Mail übernommen', now: NOW },
      [],
    );

    const note = await db.unit.notes.load(todo.id);
    expect(note?.text).toBe('aus der E-Mail übernommen');

    // Und: kein Feld von `Todo` selbst trägt den Vermerk (A-7.2).
    expect(Object.keys(todo)).not.toContain('note');
  });

  it('ein leerer Vermerk legt keine Zeile in todo_note an', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'Ohne Vermerk', callNumber: null, statusId: null, tagIds: [], note: '   ', now: NOW },
      [],
    );

    expect(await db.unit.notes.load(todo.id)).toBeNull();
  });

  it('schreibt das ZWEITE Argument (die wirksame Liste), nicht input.tagIds (die ausdrücklich gewählten)', async () => {
    db = openTestDatabase();
    const chosen = await db.unit.tags.create(null, 'Gewählt', null, NOW);
    const effective = await db.unit.tags.create(null, 'Standard-Tag', null, NOW);
    expect(chosen.ok && effective.ok).toBe(true);
    if (!chosen.ok || !effective.ok) return;

    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [chosen.value.id], note: '', now: NOW },
      // Die wirksame Liste enthält NICHT `chosen` — nur so lässt sich beweisen,
      // dass `input.tagIds` tatsächlich ignoriert wird und nicht bloß zufällig
      // mit dem zweiten Argument übereinstimmt.
      [effective.value.id],
    );

    expect(todo.tagIds).toEqual([effective.value.id]);
  });

  it('keine Abfrage für ein neu angelegtes Todo verbindet todo mit todo_note (R-06)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: 'geheimer Vermerk', now: NOW },
      [],
    );

    const loaded = await db.unit.todos.load(todo.id);
    expect(JSON.stringify(loaded)).not.toContain('geheimer Vermerk');
  });

  it('ohne statusId wird die Standardspalte verwendet (A-5.4)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const statuses = await db.unit.statuses.list();
    const defaultStatus = statuses.find((s) => s.isDefault);
    expect(todo.statusId).toBe(defaultStatus?.id);
  });
});

describe('createTodoNotePort — der interne Vermerk, eigener Port, eigene Abfrage (A-7.1, A-7.2)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('load ergibt null, wenn nie ein Vermerk geschrieben wurde', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    expect(await db.unit.notes.load(todo.id)).toBeNull();
  });

  it('write legt einen Vermerk an und aktualisiert ihn danach (ON CONFLICT)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    await db.unit.notes.write(todo.id, 'erste Fassung', NOW);
    expect((await db.unit.notes.load(todo.id))?.text).toBe('erste Fassung');

    await db.unit.notes.write(todo.id, 'zweite Fassung', ts('2026-08-31T09:00:00Z'));
    expect((await db.unit.notes.load(todo.id))?.text).toBe('zweite Fassung');
  });
});

describe('createTodoPort — Suche, Filter, Blätterung (A-13.7)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('search filtert nach Freitext über Titel und Call-Nummer, mit maskierten Sonderzeichen', async () => {
    db = openTestDatabase();
    await db.unit.todos.create(
      { title: 'Rabatt 50% sichern', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.todos.create(
      { title: 'Anderes Thema', callNumber: 'X-99', statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    // "%" ist in LIKE ein Platzhalter — ohne Maskierung träfe die Suche nach
    // "50%" auf jede Zeile.
    const byPercent = await db.unit.todos.search({ search: '50%' });
    expect(byPercent.items).toHaveLength(1);
    expect(byPercent.items[0]?.title).toBe('Rabatt 50% sichern');

    const byCallNumber = await db.unit.todos.search({ search: 'X-99' });
    expect(byCallNumber.items).toHaveLength(1);
  });

  it('search filtert nach statusIds, tagIds (alle müssen hängen) und onlyOpen', async () => {
    db = openTestDatabase();
    const tagA = await db.unit.tags.create(null, 'A', null, NOW);
    const tagB = await db.unit.tags.create(null, 'B', null, NOW);
    expect(tagA.ok && tagB.ok).toBe(true);
    if (!tagA.ok || !tagB.ok) return;

    const both = await db.unit.todos.create(
      { title: 'Beide Tags', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id, tagB.value.id],
    );
    await db.unit.todos.create(
      { title: 'Nur A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id],
    );
    const done = await db.unit.todos.create(
      { title: 'Erledigt', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id, tagB.value.id],
    );
    await db.unit.todos.markDone(done.id, NOW);

    const byBothTags = await db.unit.todos.search({ tagIds: [tagA.value.id, tagB.value.id] });
    expect(byBothTags.items.map((t) => t.id).sort()).toEqual([both.id, done.id].sort());

    const openOnly = await db.unit.todos.search({ tagIds: [tagA.value.id, tagB.value.id], onlyOpen: true });
    expect(openOnly.items.map((t) => t.id)).toEqual([both.id]);
  });

  it('onlyWithOpenEntries filtert auf Todos mit mindestens einer offenen, abgeschlossenen Buchung', async () => {
    db = openTestDatabase();
    const withEntry = await db.unit.todos.create(
      { title: 'Mit Buchung', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.todos.create(
      { title: 'Ohne', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.timeEntries.create(
      { todoId: withEntry.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:10:00Z'), note: '' },
      NOW,
    );

    const result = await db.unit.todos.search({ onlyWithOpenEntries: true });
    expect(result.items.map((t) => t.id)).toEqual([withEntry.id]);
  });

  it('blättert mit einer Fortsetzungsmarke, absteigend nach updated_at', async () => {
    db = openTestDatabase();
    for (const title of ['Erstes', 'Zweites', 'Drittes']) {
      await db.unit.todos.create(
        { title, callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
        [],
      );
    }

    const page = await db.unit.todos.search({}, { limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(3);
    expect(page.nextCursor).not.toBeNull();

    const rest = await db.unit.todos.search({}, { limit: 10, ...(page.nextCursor === null ? {} : { cursor: page.nextCursor }) });
    expect(rest.items).toHaveLength(2);
  });

  it('loadMany liefert genau die genannten Todos, leer bei leerer Liste', async () => {
    db = openTestDatabase();
    const a = await db.unit.todos.create(
      { title: 'A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.todos.create(
      { title: 'B', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    expect(await db.unit.todos.loadMany([])).toEqual([]);
    expect((await db.unit.todos.loadMany([a.id])).map((t) => t.id)).toEqual([a.id]);
  });

  it('findByCallNumber liefert Treffer neueste zuerst', async () => {
    db = openTestDatabase();
    await db.unit.todos.create(
      { title: 'Älter', callNumber: 'DUP-1', statusId: null, tagIds: [], note: '', now: ts('2026-08-30T08:00:00Z') },
      [],
    );
    const newer = await db.unit.todos.create(
      { title: 'Neuer', callNumber: 'DUP-1', statusId: null, tagIds: [], note: '', now: ts('2026-08-31T08:00:00Z') },
      [],
    );

    const matches = await db.unit.todos.findByCallNumber('DUP-1');
    expect(matches[0]?.id).toBe(newer.id);
    expect(matches).toHaveLength(2);
  });
});

describe('createTodoPort — ändern, löschen, Erledigt (A-2.4, A-2.5)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('update auf ein unbekanntes Todo ergibt not_found', async () => {
    db = openTestDatabase();
    const result = await db.unit.todos.update('unbekannt' as never, { title: 'x', now: NOW });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('update ersetzt Tags vollständig, wenn tagIds angegeben ist', async () => {
    db = openTestDatabase();
    const tagA = await db.unit.tags.create(null, 'A', null, NOW);
    const tagB = await db.unit.tags.create(null, 'B', null, NOW);
    expect(tagA.ok && tagB.ok).toBe(true);
    if (!tagA.ok || !tagB.ok) return;
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagA.value.id],
    );

    const updated = await db.unit.todos.update(todo.id, { tagIds: [tagB.value.id], now: NOW });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.tagIds).toEqual([tagB.value.id]);
  });

  it('ohne tagIds im Aufruf bleiben die bestehenden Tags unangetastet', async () => {
    db = openTestDatabase();
    const tag = await db.unit.tags.create(null, 'A', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tag.value.id],
    );

    const updated = await db.unit.todos.update(todo.id, { title: 'Neuer Titel', now: NOW });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.tagIds).toEqual([tag.value.id]);
  });

  it('ein Todo mit Zeitbuchungen wird nicht gelöscht (time_entry_locked)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:10:00Z'), note: '' },
      NOW,
    );

    const removed = await db.unit.todos.remove(todo.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('time_entry_locked');
  });

  it('remove auf ein unbekanntes Todo ergibt not_found; ein Todo ohne Buchungen lässt sich löschen', async () => {
    db = openTestDatabase();
    expect((await db.unit.todos.remove('unbekannt' as never)).ok).toBe(false);

    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const removed = await db.unit.todos.remove(todo.id);
    expect(removed.ok).toBe(true);
    expect(await db.unit.todos.load(todo.id)).toBeNull();
  });

  it('markDone setzt completedAt nur einmal (WHERE completed_at IS NULL)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const first = await db.unit.todos.markDone(todo.id, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.completedAt).toBe(NOW);

    // Ein zweiter Aufruf ändert den bereits gesetzten Zeitpunkt nicht.
    const second = await db.unit.todos.markDone(todo.id, ts('2026-09-01T00:00:00Z'));
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.completedAt).toBe(NOW);
  });

  it('markDone/clearDone auf ein unbekanntes Todo ergibt not_found', async () => {
    db = openTestDatabase();
    expect((await db.unit.todos.markDone('unbekannt' as never, NOW)).ok).toBe(false);
    expect((await db.unit.todos.clearDone('unbekannt' as never, NOW)).ok).toBe(false);
  });

  it('clearDone hebt Erledigt auf und lässt die Kanban-Spalte unangetastet (A-2.5, E-023)', async () => {
    db = openTestDatabase();
    const statuses = await db.unit.statuses.list();
    const other = await db.unit.statuses.create('Andere Spalte', 0, NOW);
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: other.value.id, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.todos.markDone(todo.id, NOW);

    const cleared = await db.unit.todos.clearDone(todo.id, ts('2026-09-01T00:00:00Z'));
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.completedAt).toBeNull();
    expect(cleared.value.statusId).toBe(other.value.id);
    expect(statuses.length).toBeGreaterThan(0);
  });

  it('sumSeconds summiert nur abgeschlossene Buchungen je Todo, 0 ohne Buchungen', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const other = await db.unit.todos.create(
      { title: 'Ohne', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:10:00Z'), note: '' },
      NOW,
    );

    const sums = await db.unit.todos.sumSeconds([todo.id, other.id]);
    expect(sums.get(todo.id)).toBe(600);
    expect(sums.get(other.id)).toBe(0);
  });
});
