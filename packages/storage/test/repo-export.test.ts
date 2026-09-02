/**
 * Takt — T-027, Export: Lesen, Festschreiben, Zurücksetzen, Protokoll
 * (A-7.2, A-8.8, E-012, E-020, E-032, R-06, R-10).
 *
 * `packages/storage/src/sqlite/repo-export.ts` lag laut T-021-Bericht
 * (Risiko 1) bei 0 Prozent Abdeckung. Zuschnitt nach Schaden (T-021, offene
 * Frage 3): `openGroups`/`openCandidates` liefern nur offene Buchungen,
 * `recordRun` weist eine inzwischen exportierte Buchung im Auftrag ab statt
 * sie zu überspringen, `resetStatus` ist ohne Protokollzeile nicht möglich —
 * und dazu die Gegenprobe zu A-8.8: ein Abbruch zwischen Markieren und
 * Festschreiben hinterlässt keine Spur.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { ExportRunRecord } from '../src/ports.ts';
import { tagIdsOf } from '../src/sqlite/repo-export.ts';
import { NOW, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

async function seedOpenBooking(db: TestDatabase, overrides?: { readonly note?: string }) {
  const todo = await db.unit.todos.create(
    { title: 'Kundenauftrag', callNumber: null, statusId: null, tagIds: [], note: 'interner Vermerk', now: NOW },
    [],
  );
  const created = await db.unit.timeEntries.create(
    {
      todoId: todo.id,
      startedAt: ts('2026-08-31T08:00:00Z'),
      endedAt: ts('2026-08-31T08:30:00Z'),
      note: overrides?.note ?? 'Leistung erbracht',
    },
    NOW,
  );
  if (!created.ok) throw new Error('Vorbedingung fehlgeschlagen');
  return { todo, entry: created.value };
}

/** Die mitgelieferte Standardvorlage (Migration 0002/0004) — die einzige, die
 * ohne vorheriges Anlegen sicher existiert. */
const BUILTIN_TEMPLATE_ID = '01931000-0000-7000-8000-0000000000f1';

function runRecordFor(entryId: string, todoId: string): ExportRunRecord {
  return {
    templateId: BUILTIN_TEMPLATE_ID as never,
    templateSnapshot: { fields: ['Call', 'Zeit', 'Notiz', 'WindowsUser'] },
    filePath: '/exporte/2026-08-31.txt',
    fileSha256: 'a'.repeat(64),
    bytes: 42,
    roundingMode: 'up',
    windowsUser: 't.beispiel',
    now: ts('2026-08-31T09:00:00Z'),
    groups: [
      {
        todoId: todoId as never,
        day: '2026-08-31' as never,
        seconds: 1800,
        quarters: 2,
        entries: [{ timeEntryId: entryId as never, durationSeconds: 1800 }],
      },
    ],
  };
}

describe('createExportReadPort — nur offene Buchungen (R-06, R-10)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('openCandidates liefert eine offene, abgeschlossene Buchung, aber nicht den internen Vermerk (A-7.2, R-06)', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);

    const candidates = await db.unit.exportRead.openCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      timeEntryId: entry.id,
      todoId: todo.id,
      bookingNote: 'Leistung erbracht',
      previouslyExported: false,
    });
    // Kein Feld dieses Objekts trägt jemals den Vermerk "interner Vermerk" —
    // die Sicht v_export_candidate führt todo_note.body nicht.
    expect(Object.values(candidates[0] as object)).not.toContain('interner Vermerk');
  });

  it('eine bereits exportierte Buchung erscheint nicht als Kandidat, aber mit previouslyExported nach einem Reset (R-10)', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);
    const record = runRecordFor(entry.id, todo.id);
    const recorded = await db.unit.export.recordRun(record);
    expect(recorded.ok).toBe(true);

    expect(await db.unit.exportRead.openCandidates()).toEqual([]);
    expect(await db.unit.exportRead.openCount()).toBe(0);

    const reset = await db.unit.export.resetStatus({
      timeEntryId: entry.id,
      reason: 'Korrektur',
      actor: 't.beispiel',
      now: ts('2026-08-31T10:00:00Z'),
    });
    expect(reset.ok).toBe(true);

    const again = await db.unit.exportRead.openCandidates();
    expect(again).toHaveLength(1);
    expect(again[0]?.previouslyExported).toBe(true);
  });

  it('eine noch laufende Buchung erscheint nicht als Kandidat, auch nicht mit Lebenszeichen (E-036)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'Laufend', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (started.ok) await db.unit.heartbeat.touch(started.value.started.id, ts('2026-08-31T08:05:00Z'));

    expect(await db.unit.exportRead.openCandidates()).toEqual([]);
  });

  it('openGroups gruppiert je Todo und Kalendertag über die Domäne (E-020, E-025)', async () => {
    db = openTestDatabase();
    const { todo } = await seedOpenBooking(db);
    await db.unit.timeEntries.create(
      { todoId: todo.id, startedAt: ts('2026-08-31T10:00:00Z'), endedAt: ts('2026-08-31T10:15:00Z'), note: 'zweite Leistung' },
      NOW,
    );

    const groups = await db.unit.exportRead.openGroups();

    expect(groups).toHaveLength(1);
    expect(groups[0]?.todoId).toBe(todo.id);
    expect(groups[0]?.entries).toHaveLength(2);
  });

  it('openCandidates(ids) filtert auf genau die genannten Kennungen', async () => {
    db = openTestDatabase();
    const { entry: first } = await seedOpenBooking(db);
    const { entry: second } = await seedOpenBooking(db);

    const filtered = await db.unit.exportRead.openCandidates([second.id]);

    expect(filtered.map((c) => c.timeEntryId)).toEqual([second.id]);
    expect(filtered.map((c) => c.timeEntryId)).not.toContain(first.id);
  });
});

describe('createExportPort.recordRun — schreibt fest, weist ab statt zu überspringen (A-8.8, R-10)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('markiert jede genannte Buchung als exportiert, erhöht export_count und schreibt eine Protokollzeile (R-10)', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);

    const result = await db.unit.export.recordRun(runRecordFor(entry.id, todo.id));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.entryCount).toBe(1);
    expect(result.value.windowsUser).toBe('t.beispiel');

    const locked = await db.unit.timeEntries.load(entry.id);
    expect(locked).toMatchObject({ exportStatus: 'exported', exportCount: 1 });

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items).toHaveLength(1);
    expect(audit.items[0]).toMatchObject({ event: 'exported', previousStatus: 'open', newStatus: 'exported' });
  });

  it('lehnt den gesamten Lauf ab, wenn auch nur eine genannte Buchung inzwischen exportiert ist — kein stilles Überspringen (T-021 Zuschnitt)', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);
    const first = await db.unit.export.recordRun(runRecordFor(entry.id, todo.id));
    expect(first.ok).toBe(true);

    // Derselbe Auftrag, ein zweites Mal — die Buchung ist inzwischen exportiert.
    const second = await db.unit.export.recordRun(runRecordFor(entry.id, todo.id));

    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('time_entry_locked');

    // Nichts an export_count hat sich durch den abgewiesenen zweiten Versuch
    // verändert — kein "teilweise nachgezogen".
    const entryAfter = await db.unit.timeEntries.load(entry.id);
    expect(entryAfter?.exportCount).toBe(1);
    const runs = await db.unit.export.listRuns();
    expect(runs.total).toBe(1);
  });

  it('lehnt einen Lauf ab, dessen genannte Buchung noch läuft (kein ended_at)', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'X', callNumber: null, statusId: null, tagIds: [], now: NOW, note: '' },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const result = await db.unit.export.recordRun(runRecordFor(started.value.started.id, todo.id));
    expect(result.ok).toBe(false);
  });

  it('ein Lauf ohne Buchungen ist "nichts zu tun" und schreibt nichts', async () => {
    db = openTestDatabase();
    const empty: ExportRunRecord = {
      templateId: 'tpl-0001' as never,
      templateSnapshot: {},
      filePath: '/x.txt',
      fileSha256: 'b'.repeat(64),
      bytes: 0,
      roundingMode: 'up',
      windowsUser: 't.beispiel',
      now: NOW,
      groups: [],
    };
    const result = await db.unit.export.recordRun(empty);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('export_nothing_to_do');
    expect((await db.unit.export.listRuns()).total).toBe(0);
  });

  /**
   * Die Kerngegenprobe zu A-8.8 auf Speicherebene: Ein Abbruch **zwischen**
   * dem Markieren (in `recordRun`, bereits erfolgreich durchgelaufen) und dem
   * Festschreiben der Transaktion lässt keine Buchung in einem Zwischenzustand
   * zurück. `recordRun` selbst öffnet keine eigene Transaktion — die Klammer
   * ist die des Aufrufers (`createTransactionPort`), genau wie
   * `architektur.md` 3.2 es vorschreibt. Dieser Test bildet exakt den vom
   * domain-dev in T-021 beschriebenen Haken nach ("Abbruch nach dem
   * Markieren und vor dem Festschreiben") — ohne den `usecases/export.ts` des
   * Dienstes zu benötigen, weil die Zusage auf der Speicherebene selbst gilt.
   */
  it('A-8.8: ein Abbruch nach dem Markieren und vor dem Festschreiben hinterlässt keine markierte Buchung, keine Protokollzeile, keinen Lauf', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);

    await expect(
      db.transactions.inTransaction(async (unit) => {
        const recorded = await unit.export.recordRun(runRecordFor(entry.id, todo.id));
        expect(recorded.ok).toBe(true);
        // Der simulierte Abbruch: Die Datei ist (im echten Ablauf) bereits
        // geschrieben, aber etwas scheitert, bevor die Transaktion
        // festgeschrieben wird — z. B. ein Fehler beim Aktualisieren der
        // Einstellungen, die derselbe Anwendungsfall in derselben Klammer
        // schreibt.
        throw new Error('Abbruch vor dem Festschreiben');
      }),
    ).rejects.toThrow('Abbruch vor dem Festschreiben');

    // Kein Zwischenzustand: Die Buchung ist unverändert offen, kein
    // erhöhter export_count, keine Protokollzeile, kein Exportlauf.
    const entryAfter = await db.unit.timeEntries.load(entry.id);
    expect(entryAfter).toMatchObject({ exportStatus: 'open', exportCount: 0 });

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items).toEqual([]);

    const runs = await db.unit.export.listRuns();
    expect(runs.total).toBe(0);

    // Die Buchung ist wieder ein gültiger Kandidat — kein dritter Zustand
    // zwischen "offen" und "exportiert" ist erreichbar.
    const candidates = await db.unit.exportRead.openCandidates();
    expect(candidates.map((c) => c.timeEntryId)).toEqual([entry.id]);
  });

  it('A-8.8: ein Abbruch vor jedem Schreibvorgang (kein recordRun aufgerufen) hinterlässt ebenfalls keine Spur', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    await expect(
      db.transactions.inTransaction(async () => {
        throw new Error('Abbruch vor dem Markieren');
      }),
    ).rejects.toThrow('Abbruch vor dem Markieren');

    const entryAfter = await db.unit.timeEntries.load(entry.id);
    expect(entryAfter).toMatchObject({ exportStatus: 'open', exportCount: 0 });
  });

  it('paginiert listRuns über eine Fortsetzungsmarke, neueste zuerst', async () => {
    db = openTestDatabase();
    const { entry: e1, todo: t1 } = await seedOpenBooking(db);
    const { entry: e2, todo: t2 } = await seedOpenBooking(db);
    const first = await db.unit.export.recordRun({ ...runRecordFor(e1.id, t1.id), now: ts('2026-08-31T09:00:00Z') });
    const second = await db.unit.export.recordRun({ ...runRecordFor(e2.id, t2.id), now: ts('2026-08-31T09:05:00Z') });
    expect(first.ok && second.ok).toBe(true);

    const page = await db.unit.export.listRuns({ limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(2);
    expect(page.nextCursor).not.toBeNull();

    const next = await db.unit.export.listRuns({ limit: 1, ...(page.nextCursor === null ? {} : { cursor: page.nextCursor }) });
    expect(next.items).toHaveLength(1);
    expect(next.nextCursor).toBeNull();
    expect(next.items[0]?.id).not.toBe(page.items[0]?.id);
  });
});

describe('createExportPort.resetStatus — kein Statuswechsel ohne Protokollzeile (E-012, R-10)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('setzt eine exportierte Buchung zurück und schreibt in derselben Anweisungsfolge eine Protokollzeile', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);
    await db.unit.export.recordRun(runRecordFor(entry.id, todo.id));

    const reset = await db.unit.export.resetStatus({
      timeEntryId: entry.id,
      reason: 'Kunde hat storniert',
      actor: 't.beispiel',
      now: ts('2026-08-31T11:00:00Z'),
    });

    expect(reset.ok).toBe(true);
    if (!reset.ok) return;
    expect(reset.value.exportStatus).toBe('open');
    // export_count bleibt stehen (E-032): kein dritter Status.
    expect(reset.value.exportCount).toBe(1);

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items.map((a) => a.event)).toEqual(['reset', 'exported']);
    expect(audit.items[0]).toMatchObject({ reason: 'Kunde hat storniert', actor: 't.beispiel' });
  });

  it('eine bereits offene Buchung lässt sich nicht zurücksetzen — "es gibt nichts zurückzusetzen"', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    const reset = await db.unit.export.resetStatus({
      timeEntryId: entry.id,
      reason: '',
      actor: 't.beispiel',
      now: NOW,
    });

    expect(reset.ok).toBe(false);
    if (reset.ok) return;
    expect(reset.error.code).toBe('export_status_unchanged');
  });

  it('eine unbekannte Buchung ergibt not_found', async () => {
    db = openTestDatabase();
    const reset = await db.unit.export.resetStatus({
      timeEntryId: 'te-unbekannt' as never,
      reason: '',
      actor: 't.beispiel',
      now: NOW,
    });
    expect(reset.ok).toBe(false);
    if (reset.ok) return;
    expect(reset.error.code).toBe('not_found');
  });
});

/**
 * T-032 — Zuschnitt aus dem T-029-Bericht (Abschnitt "Offene Fragen", Punkt 1):
 * `markNotBilled` war seit T-029 neuer Adaptercode ohne Einheitentest und hielt
 * die Zweigabdeckung von `packages/storage/src` nur 0,82 Punkte über der
 * Schwelle. E-047 ersetzt das manuelle "als exportiert markieren" (E-037) durch
 * "nicht abrechnen": Der Exportstatus geht auf `exported`, ohne dass je ein
 * Exportlauf stattfand — zweiwertig bleibt zweiwertig (E-032), aber das
 * Protokoll trägt ein eigenes Ereignis, sonst beantwortet es die Frage "wie
 * viel Zeit haben wir nie abgerechnet" nicht mehr.
 *
 * Der Trigger dahinter (`trg_time_entry_exported_needs_provenance`, Migration
 * 0006) ist am Schema selbst geprüft, nicht hier —
 * `packages/storage/test/not-billed-audit.test.ts`, mit derselben
 * Mutationsmethode wie `export-candidate-view.test.ts`.
 */
describe('createExportPort.markNotBilled — „nicht abrechnen" ersetzt das manuelle Markieren (E-047, E-032, R-10)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('bucht eine offene Buchung aus: exportStatus wird "exported", export_count bleibt bei 0 — kein Exportlauf hat stattgefunden', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    const result = await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: 'Kulanz für Stammkunde',
      actor: 't.beispiel',
      now: ts('2026-08-31T10:00:00Z'),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.exportStatus).toBe('exported');
    // Der Exportzähler wird NICHT hochgezählt — im Unterschied zu recordRun, das
    // ihn auf 1 setzt (siehe Test oben). Täte er es doch, würde ein späteres
    // Zurücksetzen vor einer zweiten Abrechnung warnen, die nie eine erste hatte.
    expect(result.value.exportCount).toBe(0);

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items).toHaveLength(1);
    expect(audit.items[0]).toMatchObject({
      event: 'not_billed',
      previousStatus: 'open',
      newStatus: 'exported',
      exportRunId: null,
      exportRunGroupId: null,
      actor: 't.beispiel',
      reason: 'Kulanz für Stammkunde',
    });

    // Eine so ausgebuchte Buchung erscheint in keiner Exportauswahl mehr — der
    // Status ist zweiwertig, und "exported" heißt "exported" (E-032).
    expect(await db.unit.exportRead.openCandidates()).toEqual([]);
    expect(await db.unit.exportRead.openCount()).toBe(0);
  });

  it('reason darf leer bleiben — keine Begründungspflicht (E-037, fortgeführt in E-047)', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    const result = await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: '',
      actor: 't.beispiel',
      now: NOW,
    });

    expect(result.ok).toBe(true);
    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items[0]?.reason).toBe('');
  });

  it('ein zweites Ausbuchen derselben Buchung ergibt export_status_unchanged, ohne eine zweite Protokollzeile', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);
    const first = await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: '',
      actor: 't.beispiel',
      now: NOW,
    });
    expect(first.ok).toBe(true);

    const second = await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: 'zweiter Versuch',
      actor: 't.beispiel',
      now: ts('2026-08-31T10:05:00Z'),
    });

    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('export_status_unchanged');

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items).toHaveLength(1);
  });

  it('eine per Exportlauf bereits exportierte Buchung lässt sich nicht zusätzlich ausbuchen — export_status_unchanged, export_count bleibt bei 1', async () => {
    db = openTestDatabase();
    const { entry, todo } = await seedOpenBooking(db);
    const recorded = await db.unit.export.recordRun(runRecordFor(entry.id, todo.id));
    expect(recorded.ok).toBe(true);

    const notBilled = await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: '',
      actor: 't.beispiel',
      now: ts('2026-08-31T10:00:00Z'),
    });

    expect(notBilled.ok).toBe(false);
    if (notBilled.ok) return;
    expect(notBilled.error.code).toBe('export_status_unchanged');

    const entryAfter = await db.unit.timeEntries.load(entry.id);
    expect(entryAfter).toMatchObject({ exportStatus: 'exported', exportCount: 1 });

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items.map((a) => a.event)).toEqual(['exported']);
  });

  it('eine laufende Buchung ist keine Buchung im Sinne dieses Vorgangs — not_found, dasselbe wie beim Zurücksetzen', async () => {
    db = openTestDatabase();
    const todo = await db.unit.todos.create(
      { title: 'Läuft noch', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    );
    const started = await db.unit.timer.start(todo.id, false, NOW);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const result = await db.unit.export.markNotBilled({
      timeEntryId: started.value.started.id,
      reason: '',
      actor: 't.beispiel',
      now: NOW,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('eine unbekannte Buchung ergibt not_found', async () => {
    db = openTestDatabase();
    const result = await db.unit.export.markNotBilled({
      timeEntryId: 'te-unbekannt' as never,
      reason: '',
      actor: 't.beispiel',
      now: NOW,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('not_found');
  });

  it('Zurücksetzen einer ausgebuchten Buchung bringt sie zurück nach "open" — export_count bleibt bei 0, previouslyExported bleibt false (E-012, E-032)', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);
    const notBilled = await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: 'Kulanz',
      actor: 't.beispiel',
      now: ts('2026-08-31T09:00:00Z'),
    });
    expect(notBilled.ok).toBe(true);

    const reset = await db.unit.export.resetStatus({
      timeEntryId: entry.id,
      reason: 'doch abrechnen',
      actor: 't.beispiel',
      now: ts('2026-08-31T10:00:00Z'),
    });

    expect(reset.ok).toBe(true);
    if (!reset.ok) return;
    expect(reset.value.exportStatus).toBe('open');
    // Anders als nach dem Reset eines echten Exportlaufs (dort bleibt
    // export_count bei 1, siehe Test oben): Hier war export_count nie
    // gestiegen, weil nie ein Exportlauf stattfand.
    expect(reset.value.exportCount).toBe(0);

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items.map((a) => a.event)).toEqual(['reset', 'not_billed']);

    // previouslyExported (R-10) fragt export_count > 0 ab — bei einer
    // Ausbuchung ohne Exportlauf bleibt das falsch, obwohl die Buchung
    // zwischenzeitlich exportStatus "exported" trug.
    const candidates = await db.unit.exportRead.openCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ timeEntryId: entry.id, previouslyExported: false });
  });

  it('der Weg zurück: nach dem Zurücksetzen lässt sich dieselbe Buchung erneut ausbuchen', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);
    await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: '',
      actor: 't.beispiel',
      now: ts('2026-08-31T09:00:00Z'),
    });
    await db.unit.export.resetStatus({
      timeEntryId: entry.id,
      reason: '',
      actor: 't.beispiel',
      now: ts('2026-08-31T10:00:00Z'),
    });

    const again = await db.unit.export.markNotBilled({
      timeEntryId: entry.id,
      reason: 'endgültig nicht abrechnen',
      actor: 't.beispiel',
      now: ts('2026-08-31T11:00:00Z'),
    });

    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.value.exportStatus).toBe('exported');
    expect(again.value.exportCount).toBe(0);

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items.map((a) => a.event)).toEqual(['not_billed', 'reset', 'not_billed']);
  });

  /**
   * Dieselbe Gegenprobe wie bei `recordRun` (A-8.8) oben, angewandt auf den
   * neuen Pfad: `markNotBilled` öffnet keine eigene Transaktion, sondern
   * schreibt in der des Aufrufers. Ein Abbruch danach darf keine Buchung in
   * einem Zwischenzustand zurücklassen — kein Zustand außer "open" und
   * "exported" ist erreichbar (E-032), und "exported" ohne Protokollzeile darf
   * es nach dieser Transaktion so wenig geben wie davor.
   */
  it('E-047/A-8.8: ein Abbruch nach dem Ausbuchen und vor dem Festschreiben hinterlässt keine ausgebuchte Buchung und keine Protokollzeile', async () => {
    db = openTestDatabase();
    const { entry } = await seedOpenBooking(db);

    await expect(
      db.transactions.inTransaction(async (unit) => {
        const result = await unit.export.markNotBilled({
          timeEntryId: entry.id,
          reason: 'wird zurückgenommen',
          actor: 't.beispiel',
          now: ts('2026-08-31T10:00:00Z'),
        });
        expect(result.ok).toBe(true);
        throw new Error('Abbruch vor dem Festschreiben');
      }),
    ).rejects.toThrow('Abbruch vor dem Festschreiben');

    const entryAfter = await db.unit.timeEntries.load(entry.id);
    expect(entryAfter).toMatchObject({ exportStatus: 'open', exportCount: 0 });

    const audit = await db.unit.export.audit(entry.id);
    expect(audit.items).toEqual([]);

    const candidates = await db.unit.exportRead.openCandidates();
    expect(candidates.map((c) => c.timeEntryId)).toEqual([entry.id]);
  });
});

describe('tagIdsOf — Tagkennungen eines einzelnen Todos (Anzeige außerhalb des Exports)', () => {
  it('liefert die Tagkennungen eines Todos, sortiert nach Kennung', async () => {
    const db = openTestDatabase();
    try {
      const tagA = await db.unit.tags.create(null, 'B-Tag', null, NOW);
      const tagB = await db.unit.tags.create(null, 'A-Tag', null, NOW);
      expect(tagA.ok && tagB.ok).toBe(true);
      if (!tagA.ok || !tagB.ok) return;

      const todo = await db.unit.todos.create(
        { title: 'Mit Tags', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
        [tagA.value.id, tagB.value.id],
      );

      expect(tagIdsOf(db.conn, todo.id).slice().sort()).toEqual([tagA.value.id, tagB.value.id].sort());
    } finally {
      db.close();
    }
  });

  it('liefert eine leere Liste für ein Todo ohne Tags', async () => {
    const db = openTestDatabase();
    try {
      const todo = await db.unit.todos.create(
        { title: 'Ohne Tags', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
        [],
      );
      expect(tagIdsOf(db.conn, todo.id)).toEqual([]);
    } finally {
      db.close();
    }
  });
});
