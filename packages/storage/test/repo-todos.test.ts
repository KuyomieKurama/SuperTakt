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
import { matchesPool, tagAxisIsUnresolved } from '@takt/domain';
import { poolAxes, poolMatchMode, resolvePoolAxis } from '../src/sqlite/repo-tags.ts';
import { NOW, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

/** Die mitgelieferte Standardvorlage (Migration 0002) — dieselbe Kennung wie in repo-export.test.ts. */
const BUILTIN_TEMPLATE_ID = '01931000-0000-7000-8000-0000000000f1';

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

/**
 * T-076 — die fünf Achsen einer Regel in `buildConditions` (`repo-todos.ts`).
 *
 * `packages/storage/test/repo-tags.test.ts` prüft, dass die vier neuen Achsen
 * gespeichert und gelesen werden, wie sie hineingingen. Hier geht es um etwas
 * anderes: ob `pools.members` — also die SQL-Übersetzung der Regel — für jede
 * Achse und für ihr Zusammenspiel dasselbe liefert, was die Regel fachlich
 * meint. Der letzte Fall in diesem Block hält beide Seiten (SQL-Übersetzung
 * und `matchesPool` in der Domäne) unmittelbar gegeneinander, statt beide
 * getrennt gegen eine von Hand hingeschriebene Erwartung zu prüfen — das ist
 * der Fall aus T-076-domain-dev, Befund 2, den `boardAppearances` gelöst hat.
 */
describe('T-076 — pools.members über die fünf Achsen einer Regel (Zusammenspiel, nicht nur Einzelachsen)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('eine Spalte nur über den Status trifft alle Karten mit diesem Status — eine über einen unbenutzten Status trifft keine (Gegenprobe)', async () => {
    db = openTestDatabase();
    const status = await db.unit.statuses.defaultStatus();
    const unused = await db.unit.statuses.create('Unbenutzt', 0, NOW);
    expect(unused.ok).toBe(true);
    if (!unused.ok) return;

    const cardA = await db.unit.todos.create(
      { title: 'A', callNumber: null, statusId: status.id, tagIds: [], note: '', now: NOW },
      [],
    );
    const cardB = await db.unit.todos.create(
      { title: 'B', callNumber: null, statusId: status.id, tagIds: [], note: '', now: NOW },
      [],
    );

    const byStatus = await db.unit.pools.create(
      { name: 'Nach Status', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], statusIds: [status.id] },
      NOW,
    );
    const byUnusedStatus = await db.unit.pools.create(
      { name: 'Unbenutzter Status', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], statusIds: [unused.value.id] },
      NOW,
    );

    expect((await db.unit.pools.members(byStatus.id)).items.map((t) => t.id).sort()).toEqual(
      [cardA.id, cardB.id].sort(),
    );
    expect((await db.unit.pools.members(byUnusedStatus.id)).items).toEqual([]);
  });

  it('Tag UND Status ist eine Und-, keine Oder-Verknüpfung: 1 von 2 Karten mit demselben Status', async () => {
    db = openTestDatabase();
    const status = await db.unit.statuses.defaultStatus();
    const tagRückfrage = await db.unit.tags.create(null, 'Rückfrage', null, NOW);
    expect(tagRückfrage.ok).toBe(true);
    if (!tagRückfrage.ok) return;

    const withTag = await db.unit.todos.create(
      { title: 'Mit Rückfrage', callNumber: null, statusId: status.id, tagIds: [], note: '', now: NOW },
      [tagRückfrage.value.id],
    );
    const withoutTag = await db.unit.todos.create(
      { title: 'Ohne Rückfrage', callNumber: null, statusId: status.id, tagIds: [], note: '', now: NOW },
      [],
    );

    const mixed = await db.unit.pools.create(
      {
        name: 'Tag und Status',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagRückfrage.value.id }],
        statusIds: [status.id],
      },
      NOW,
    );

    const members = await db.unit.pools.members(mixed.id);
    // Die Tagspalte allein träfe beide (RED-Nachweis eben: [withTag, withoutTag]);
    // UND mit dem Status bleibt nur eine.
    expect(members.items.map((t) => t.id)).toEqual([withTag.id]);
    expect(members.items.map((t) => t.id)).not.toContain(withoutTag.id);
  });

  it('ein ausgeschlossenes Tag lässt genau die andere Karte übrig', async () => {
    db = openTestDatabase();
    const tagBeratung = await db.unit.tags.create(null, 'Beratung', null, NOW);
    const tagRückfrage = await db.unit.tags.create(null, 'Rückfrage', null, NOW);
    expect(tagBeratung.ok && tagRückfrage.ok).toBe(true);
    if (!tagBeratung.ok || !tagRückfrage.ok) return;

    const both = await db.unit.todos.create(
      { title: 'Beide Tags', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagBeratung.value.id, tagRückfrage.value.id],
    );
    const onlyBeratung = await db.unit.todos.create(
      { title: 'Nur Beratung', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [tagBeratung.value.id],
    );

    const pool = await db.unit.pools.create(
      {
        name: 'Beratung ohne Rückfrage',
        matchMode: 'any',
        includeSubfolders: false,
        position: 0,
        rule: [{ kind: 'tag', tagId: tagBeratung.value.id }],
        excludedTags: [{ kind: 'tag', tagId: tagRückfrage.value.id }],
      },
      NOW,
    );

    const members = await db.unit.pools.members(pool.id);
    expect(members.items.map((t) => t.id)).toEqual([onlyBeratung.id]);
    expect(members.items.map((t) => t.id)).not.toContain(both.id);
  });

  it('eine Karte steht zugleich in einer Tag-Spalte und einer Status-Spalte (E-054 gilt für die neuen Achsen weiter)', async () => {
    db = openTestDatabase();
    const status = await db.unit.statuses.defaultStatus();
    const tag = await db.unit.tags.create(null, 'Tag', null, NOW);
    expect(tag.ok).toBe(true);
    if (!tag.ok) return;
    const card = await db.unit.todos.create(
      { title: 'Karte', callNumber: null, statusId: status.id, tagIds: [], note: '', now: NOW },
      [tag.value.id],
    );

    const tagColumn = await db.unit.pools.create(
      { name: 'Tag-Spalte', matchMode: 'any', includeSubfolders: false, position: 0, rule: [{ kind: 'tag', tagId: tag.value.id }] },
      NOW,
    );
    const statusColumn = await db.unit.pools.create(
      { name: 'Status-Spalte', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], statusIds: [status.id] },
      NOW,
    );

    expect((await db.unit.pools.members(tagColumn.id)).items.map((t) => t.id)).toContain(card.id);
    expect((await db.unit.pools.members(statusColumn.id)).items.map((t) => t.id)).toContain(card.id);
  });

  it('eine Regel ganz ohne Bedingungen trifft nichts — auch wenn Karten vorhanden sind (E-055 korrigiert, A-3.4)', async () => {
    db = openTestDatabase();
    await db.unit.todos.create(
      { title: 'Irgendeine Karte', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    const empty = await db.unit.pools.create(
      { name: 'Leer', matchMode: 'any', includeSubfolders: false, position: 0, rule: [] },
      NOW,
    );

    expect((await db.unit.pools.members(empty.id)).items).toEqual([]);
  });

  it('Erledigt- und Exportstatus-Achse folgen dem tatsächlichen Zustand nach Timerstart/-stopp und Exportlauf, nicht einem angenommenen', async () => {
    db = openTestDatabase();
    const card = await db.unit.todos.create(
      { title: 'Karte', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const marked = await db.unit.todos.markDone(card.id, NOW);
    expect(marked.ok).toBe(true);

    const doneColumn = await db.unit.pools.create(
      { name: 'Erledigt', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], completion: 'done' },
      NOW,
    );
    const openColumn = await db.unit.pools.create(
      { name: 'Offen', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], completion: 'open' },
      NOW,
    );

    expect((await db.unit.pools.members(doneColumn.id)).items.map((t) => t.id)).toEqual([card.id]);
    expect((await db.unit.pools.members(openColumn.id)).items).toEqual([]);

    // Timerstart auf der erledigten Karte hebt "Erledigt" auf (A-2.5) — die
    // Erledigt-Achse folgt dem sofort, ohne dass irgendetwas an der Regel
    // geändert würde.
    const started = await db.unit.timer.start(card.id, false, ts('2026-08-31T09:00:00Z'));
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.doneCleared).toBe(true);

    expect((await db.unit.pools.members(doneColumn.id)).items).toEqual([]);
    expect((await db.unit.pools.members(openColumn.id)).items.map((t) => t.id)).toEqual([card.id]);

    // Stopp erzeugt eine offene, abgeschlossene Buchung.
    const stopped = await db.unit.timer.stop('Leistung erbracht', ts('2026-08-31T09:20:00Z'));
    expect(stopped.ok).toBe(true);
    if (!stopped.ok || stopped.value.kind !== 'recorded') return;

    const openExportColumn = await db.unit.pools.create(
      { name: 'Noch nicht abgerechnet', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], exportState: 'open' },
      NOW,
    );
    const exportedColumn = await db.unit.pools.create(
      { name: 'Abgerechnet', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], exportState: 'exported' },
      NOW,
    );

    expect((await db.unit.pools.members(openExportColumn.id)).items.map((t) => t.id)).toEqual([card.id]);
    expect((await db.unit.pools.members(exportedColumn.id)).items).toEqual([]);

    // Ein Exportlauf schreibt die Buchung fest — kein direktes UPDATE, damit
    // der Fall tatsächlich einen Exportlauf durchläuft und nicht bloß den
    // Endzustand simuliert.
    const recorded = await db.unit.export.recordRun({
      templateId: BUILTIN_TEMPLATE_ID as never,
      templateSnapshot: { fields: ['Call', 'Zeit', 'Notiz', 'WindowsUser'] },
      filePath: '/exporte/2026-08-31.txt',
      fileSha256: 'a'.repeat(64),
      bytes: 42,
      roundingMode: 'up',
      windowsUser: 't.beispiel',
      now: ts('2026-08-31T10:00:00Z'),
      groups: [
        {
          todoId: card.id,
          day: '2026-08-31' as never,
          seconds: 20 * 60,
          quarters: 2,
          entries: [{ timeEntryId: stopped.value.entry.id, durationSeconds: 20 * 60 }],
        },
      ],
    } as never);
    expect(recorded.ok).toBe(true);

    expect((await db.unit.pools.members(openExportColumn.id)).items).toEqual([]);
    expect((await db.unit.pools.members(exportedColumn.id)).items.map((t) => t.id)).toEqual([card.id]);
  });

  it('Abfrage und Domänenregel dürfen nicht auseinanderlaufen: für jede Karte und jede Spalte stimmt pools.members mit matchesPool überein', async () => {
    db = openTestDatabase();
    const tagBeratung = await db.unit.tags.create(null, 'Beratung', null, NOW);
    const tagRückfrage = await db.unit.tags.create(null, 'Rückfrage', null, NOW);
    expect(tagBeratung.ok && tagRückfrage.ok).toBe(true);
    if (!tagBeratung.ok || !tagRückfrage.ok) return;
    const status1 = await db.unit.statuses.defaultStatus();
    const status2 = await db.unit.statuses.create('Zweite Spalte', 0, NOW);
    expect(status2.ok).toBe(true);
    if (!status2.ok) return;

    // Vier Karten, so gewählt, dass keine Antwort zufällig richtig sein kann:
    // unterschiedliche Tags, unterschiedliche Status, eine erledigt, eine mit
    // einer offenen Buchung.
    const cardBoth = await db.unit.todos.create(
      { title: 'Beide Tags', callNumber: null, statusId: status1.id, tagIds: [], note: '', now: NOW },
      [tagBeratung.value.id, tagRückfrage.value.id],
    );
    const cardOnlyBeratung = await db.unit.todos.create(
      { title: 'Nur Beratung', callNumber: null, statusId: status2.value.id, tagIds: [], note: '', now: NOW },
      [tagBeratung.value.id],
    );
    const cardDone = await db.unit.todos.create(
      { title: 'Erledigt', callNumber: null, statusId: status1.id, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.todos.markDone(cardDone.id, NOW);
    const cardWithBooking = await db.unit.todos.create(
      { title: 'Mit offener Buchung', callNumber: null, statusId: status1.id, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.timeEntries.create(
      { todoId: cardWithBooking.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:10:00Z'), note: '' },
      NOW,
    );

    // Frisch geladen, nicht die Rückgabewerte von `create`: `cardDone` trägt
    // an seinem ursprünglichen Objekt noch `completedAt: null` — `markDone`
    // hat nur die Datenbank geändert. Die SQL-Übersetzung fragt die
    // Datenbank; ein Vergleich gegen den veralteten Wert prüfte nicht
    // dasselbe wie die Abfrage und würde einen Widerspruch vortäuschen, den es
    // nicht gibt.
    const cards = await db.unit.todos.loadMany([cardBoth.id, cardOnlyBeratung.id, cardDone.id, cardWithBooking.id]);
    expect(cards).toHaveLength(4);

    const columns = await Promise.all([
      db.unit.pools.create(
        { name: 'Nach Status 1', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], statusIds: [status1.id] },
        NOW,
      ),
      db.unit.pools.create(
        {
          name: 'Tag und Status',
          matchMode: 'any',
          includeSubfolders: false,
          position: 0,
          rule: [{ kind: 'tag', tagId: tagRückfrage.value.id }],
          statusIds: [status1.id],
        },
        NOW,
      ),
      db.unit.pools.create(
        {
          name: 'Beratung ohne Rückfrage',
          matchMode: 'any',
          includeSubfolders: false,
          position: 0,
          rule: [{ kind: 'tag', tagId: tagBeratung.value.id }],
          excludedTags: [{ kind: 'tag', tagId: tagRückfrage.value.id }],
        },
        NOW,
      ),
      db.unit.pools.create(
        { name: 'Erledigt', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], completion: 'done' },
        NOW,
      ),
      db.unit.pools.create(
        { name: 'Noch nicht abgerechnet', matchMode: 'any', includeSubfolders: false, position: 0, rule: [], exportState: 'open' },
        NOW,
      ),
      db.unit.pools.create({ name: 'Leer', matchMode: 'any', includeSubfolders: false, position: 0, rule: [] }, NOW),
    ]);

    const presence = await db.unit.timeEntries.exportPresence(cards.map((c) => c.id));

    let comparisons = 0;
    for (const column of columns) {
      const sqlMembers = new Set((await db.unit.pools.members(column.id)).items.map((t) => t.id));

      // Seit T-082/E-057: `resolvePoolAxis` statt der flachen `resolvePoolRule`,
      // weil `unresolvedRequired` termweise aus `named`/`resolved`/`emptyTerms`
      // hervorgeht (T-082-domain-dev, Abschnitt 4) — vor dieser Umstellung lief
      // dieselbe Kreuzprüfung mit `unresolvedRequired: undefined`, also der
      // Antwort von vor E-057, und blieb grün, weil `pools.members` denselben
      // Fehler machte.
      const required = resolvePoolAxis(db.conn, column.id);
      const excluded = resolvePoolAxis(db.conn, column.id, 'excluded');
      const axes = poolAxes(db.conn, column.id);
      const matchMode = poolMatchMode(db.conn, column.id);
      const unresolvedRequired = tagAxisIsUnresolved({
        named: required.named,
        resolved: required.tagIds.length,
        emptyTerms: required.emptyFolderIds.length,
      });

      for (const card of cards) {
        const cardPresence = presence.get(card.id);
        const domainVerdict = matchesPool({
          todoTagIds: card.tagIds,
          ruleTagIds: required.tagIds,
          matchMode,
          excludedTagIds: excluded.tagIds,
          todoStatusId: card.statusId,
          ruleStatusIds: axes.statusIds,
          completedAt: card.completedAt,
          completion: axes.completion,
          hasOpenEntries: cardPresence?.hasOpen ?? false,
          hasExportedEntries: cardPresence?.hasExported ?? false,
          exportState: axes.exportState,
          unresolvedRequired,
        });

        expect(sqlMembers.has(card.id)).toBe(domainVerdict);
        comparisons += 1;
      }
    }

    // Gegenprobe: Die Schleife hat tatsächlich etwas geprüft. Ohne diese
    // Zeile bewiese ein leerer Bestand (0 Vergleiche) fälschlich denselben
    // grünen Test.
    expect(comparisons).toBe(columns.length * cards.length);
  });
});
