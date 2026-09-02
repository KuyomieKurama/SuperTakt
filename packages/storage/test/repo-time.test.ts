/**
 * Takt — T-027, Zeitbuchungen, Timer und Lebenszeichen (A-6.*, A-2.5, E-036).
 *
 * `packages/storage/src/sqlite/repo-time.ts` lag laut T-021-Bericht (Risiko 1)
 * bei 0 Prozent Abdeckung. Zuschnitt nach Schaden (T-021, offene Frage 3): der
 * Partialindex gegen einen zweiten Timer, dass `stop` unter der Mindestdauer
 * die Zeile löscht statt sie mit Dauer 0 zu schreiben — und dazu Start auf
 * einem erledigten Todo (A-2.5) und der verwaiste Timer (E-036).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { NOW, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

describe('createTimeEntryPort — manuelle Buchungen (A-6.1, A-6.9)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('legt eine manuelle Buchung mit source = "manual" an', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );

    const created = await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:20:00Z'), note: 'Leistung' },
      NOW,
    );

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.source).toBe('manual');
    expect(created.value.exportStatus).toBe('open');
    expect(created.value.durationSeconds).toBe(20 * 60);
  });

  it('eine exportierte Buchung lässt sich weder ändern noch löschen — der Adapter weist ab, zusätzlich zum Trigger (A-6.9)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const created = await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:20:00Z'), note: 'x' },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Direkt über SQL exportiert, um die Sperre unabhängig vom Exportport zu
    // prüfen. `export_count >= 1` muss mitgehen — der CHECK erzwingt genau
    // die Zusicherung aus A-6.9, dass "exported" nie ohne einen Lauf entsteht.
    db.conn
      .prepare("UPDATE time_entry SET export_status = 'exported', export_count = 1 WHERE id = ?")
      .run(created.value.id);

    const updated = await db.unit.timeEntries.update(created.value.id, { note: 'nachträglich' }, NOW);
    expect(updated.ok).toBe(false);
    if (updated.ok) return;
    expect(updated.error.code).toBe('time_entry_locked');

    const removed = await db.unit.timeEntries.remove(created.value.id);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('time_entry_locked');
  });

  it('update auf eine unbekannte Buchung ergibt not_found', async () => {
    db = openTestDatabase();
    const result = await db.unit.timeEntries.update('te-unbekannt' as never, { note: 'x' }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('remove auf eine unbekannte Buchung ergibt not_found', async () => {
    db = openTestDatabase();
    const result = await db.unit.timeEntries.remove('te-unbekannt' as never);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('ändert eine offene Buchung vollständig (todoId, Zeiten, Notiz)', async () => {
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
      { todoId: todoA.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:10:00Z'), note: 'alt' },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await db.unit.timeEntries.update(
      created.value.id,
      { todoId: todoB.id, startedAt: ts('2026-08-31T09:00:00Z'), endedAt: ts('2026-08-31T09:30:00Z'), note: 'neu' },
      ts('2026-08-31T09:31:00Z'),
    );

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value).toMatchObject({ todoId: todoB.id, note: 'neu', durationSeconds: 30 * 60 });
  });

  it('search filtert nach todoId, exportStatus und Tagesspanne, und blättert mit einer Fortsetzungsmarke', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    for (const [start, end] of [
      ['2026-08-29T08:00:00Z', '2026-08-29T08:10:00Z'],
      ['2026-08-30T08:00:00Z', '2026-08-30T08:10:00Z'],
      ['2026-08-31T08:00:00Z', '2026-08-31T08:10:00Z'],
    ] as const) {
      const result = await db.unit.timeEntries.create({ todoId: todo.id, startedAt: ts(start), endedAt: ts(end), note: '' }, NOW);
      expect(result.ok).toBe(true);
    }

    const byTodo = await db.unit.timeEntries.search({ todoId: todo.id });
    expect(byTodo.total).toBe(3);

    const byDay = await db.unit.timeEntries.search({ fromDay: '2026-08-30', toDay: '2026-08-30' });
    expect(byDay.total).toBe(1);

    const page = await db.unit.timeEntries.search({ todoId: todo.id }, { limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
    const rest = await db.unit.timeEntries.search(
      { todoId: todo.id },
      { limit: 10, ...(page.nextCursor === null ? {} : { cursor: page.nextCursor }) },
    );
    expect(rest.items).toHaveLength(2);
  });

  it('onlyPreviouslyExported filtert auf offene, aber zurückgesetzte Buchungen (R-10)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const created = await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:10:00Z'), note: '' },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    db.conn
      .prepare("UPDATE time_entry SET export_status = 'open', export_count = 1 WHERE id = ?")
      .run(created.value.id);

    const filtered = await db.unit.timeEntries.search({ onlyPreviouslyExported: true });
    expect(filtered.items.map((e) => e.id)).toEqual([created.value.id]);
  });

  it('sumSeconds summiert nur die Buchungen, die den Filter treffen', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    await db.unit.timeEntries.create({ todoId: todo.id, startedAt: ts('2026-08-31T08:00:00Z'), endedAt: ts('2026-08-31T08:10:00Z'), note: '' }, NOW);
    await db.unit.timeEntries.create({ todoId: todo.id, startedAt: ts('2026-08-31T09:00:00Z'), endedAt: ts('2026-08-31T09:05:00Z'), note: '' }, NOW);

    expect(await db.unit.timeEntries.sumSeconds({ todoId: todo.id })).toBe(10 * 60 + 5 * 60);
    expect(await db.unit.timeEntries.sumSeconds({ todoId: 'anderes-todo' as never })).toBe(0);
  });
});

describe('createTimerPort.start — der Partialindex, die Rückfrage und A-2.5', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('startet einen Timer auf einem unbekannten Todo nicht (not_found)', async () => {
    db = openTestDatabase();
    const result = await db.unit.timer.start('todo-unbekannt' as never, false, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('ein zweiter Start ohne stopRunning wird abgewiesen — nichts ändert sich (A-6.8)', async () => {
    db = openTestDatabase();
    const todoA = await db.unit.todos.create(
      { title: 'A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const todoB = await db.unit.todos.create(
      { title: 'B', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const first = await db.unit.timer.start(todoA.id, false, NOW);
    expect(first.ok).toBe(true);

    const second = await db.unit.timer.start(todoB.id, false, ts('2026-08-31T08:05:00Z'));
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('timer_already_running');

    const running = await db.unit.timer.running();
    expect(running?.todoId).toBe(todoA.id);
  });

  it('startet auf einem erledigten Todo: Start hebt "Erledigt" auf, das Todo wird wieder aktiv (A-2.5)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'Erledigt', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const done = await db.unit.todos.markDone(todo.id, NOW);
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.value.completedAt).not.toBeNull();

    const started = await db.unit.timer.start(todo.id, false, ts('2026-08-31T09:00:00Z'));
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.doneCleared).toBe(true);

    const reloaded = await db.unit.todos.load(todo.id);
    expect(reloaded?.completedAt).toBeNull();
  });

  it('startet auf einem bereits aktiven Todo: doneCleared bleibt false, es wird nichts geschrieben', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'Aktiv', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.doneCleared).toBe(false);
  });

  it('mit stopRunning=true stoppt der Start zuerst den laufenden Timer, dann startet er den neuen (A-6.2)', async () => {
    db = openTestDatabase();
    const todoA = await db.unit.todos.create(
      { title: 'A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const todoB = await db.unit.todos.create(
      { title: 'B', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const first = await db.unit.timer.start(todoA.id, false, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await db.unit.timer.start(todoB.id, true, ts('2026-08-31T08:20:00Z'));
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.stopped).toMatchObject({ id: first.value.started.id, todoId: todoA.id, exportStatus: 'open' });
    expect(second.value.started.todoId).toBe(todoB.id);

    const running = await db.unit.timer.running();
    expect(running?.todoId).toBe(todoB.id);
  });

  it('mit stopRunning=true UND einer Laufzeit unter der Mindestdauer wird der vorige Timer verworfen, nicht mit Dauer 0 abgelegt', async () => {
    db = openTestDatabase();
    const todoA = await db.unit.todos.create(
      { title: 'A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const todoB = await db.unit.todos.create(
      { title: 'B', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const first = await db.unit.timer.start(todoA.id, false, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    // Derselbe Zeitpunkt — Laufzeit 0 Sekunden, unter MINIMUM_DURATION_SECONDS.
    const second = await db.unit.timer.start(todoB.id, true, NOW);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.stopped).toBeNull();
    const remaining = await db.unit.timeEntries.search({ todoId: todoA.id });
    expect(remaining.total).toBe(0);
  });
});

describe('createTimerPort.stop — Ende und Leistung in einer Anweisung (A-6.2, A-6.4)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('stop ohne laufenden Timer ergibt timer_not_running', async () => {
    db = openTestDatabase();
    const result = await db.unit.timer.stop('x', NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('timer_not_running');
  });

  it('stop schreibt Ende und Leistung in einem Zug', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);

    const stopped = await db.unit.timer.stop('fertig', ts('2026-08-31T08:20:00Z'));
    expect(stopped.ok).toBe(true);
    if (!stopped.ok) return;
    expect(stopped.value).toMatchObject({ kind: 'recorded' });
    if (stopped.value.kind !== 'recorded') return;
    expect(stopped.value.entry.note).toBe('fertig');
    expect(stopped.value.entry.durationSeconds).toBe(20 * 60);
  });

  it('stop unter der Mindestdauer löscht die Zeile, statt sie mit Dauer 0 abzulegen (E-008 hängt daran)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    // Derselbe Zeitpunkt wie der Start: 0 Sekunden Laufzeit.
    const stopped = await db.unit.timer.stop('zu kurz', NOW);
    expect(stopped.ok).toBe(true);
    if (!stopped.ok) return;
    expect(stopped.value).toEqual({ kind: 'discarded' });

    expect(await db.unit.timer.running()).toBeNull();
    const all = await db.unit.timeEntries.search({ todoId: todo.id });
    expect(all.total).toBe(0);
  });
});

describe('createTimerHeartbeatPort — Lebenszeichen und verwaiste Timer (E-036)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('lastSeen ist null, solange nie ein Lebenszeichen geschrieben wurde — orphaned liefert die Buchung trotzdem, mit heartbeatAt: null', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    expect(await db.unit.heartbeat.lastSeen(started.value.started.id)).toBeNull();
    // `orphaned` liefert jede unvollständige Buchung — ob sie tatsächlich über
    // einen Neustart hinweg "verwaist" ist, entscheidet die Domäne
    // (`decideOrphanedTimer`), nicht dieser Port. Ohne Lebenszeichen ist
    // `heartbeatAt` schlicht `null`.
    const orphaned = await db.unit.heartbeat.orphaned();
    expect(orphaned?.running.id).toBe(started.value.started.id);
    expect(orphaned?.heartbeatAt).toBeNull();
  });

  it('touch schreibt das Lebenszeichen und erneuert es bei wiederholtem Aufruf (ON CONFLICT)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    await db.unit.heartbeat.touch(started.value.started.id, ts('2026-08-31T08:01:00Z'));
    expect(await db.unit.heartbeat.lastSeen(started.value.started.id)).toBe('2026-08-31T08:01:00Z');

    await db.unit.heartbeat.touch(started.value.started.id, ts('2026-08-31T08:02:00Z'));
    expect(await db.unit.heartbeat.lastSeen(started.value.started.id)).toBe('2026-08-31T08:02:00Z');
  });

  it('orphaned liefert die laufende Buchung samt letztem Lebenszeichen — ohne, dass sie ein Exportkandidat würde', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'Über Nacht vergessen', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, ts('2026-08-31T22:00:00Z'));
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    await db.unit.heartbeat.touch(started.value.started.id, ts('2026-08-31T22:05:00Z'));

    const orphaned = await db.unit.heartbeat.orphaned();
    expect(orphaned).not.toBeNull();
    expect(orphaned?.running.id).toBe(started.value.started.id);
    expect(orphaned?.heartbeatAt).toBe('2026-08-31T22:05:00Z');

    expect(await db.unit.exportRead.openCandidates()).toEqual([]);
  });

  it('orphaned ist null, sobald der Timer wieder abgeschlossen ist', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    await db.unit.timer.stop('fertig', ts('2026-08-31T08:10:00Z'));

    expect(await db.unit.heartbeat.orphaned()).toBeNull();
  });
});
