import { afterEach, describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { openDatabase, type OpenedDatabase } from '@takt/storage';

import type { AppContext } from '../../src/usecases/context.ts';
import {
  exportDataArchive,
  importDataArchive,
  importSuperProductivity,
  importTodoist,
  parseCsv,
} from '../../src/usecases/data-transfer.ts';

const NOW = '2026-09-08T10:00:00Z' as Timestamp;

async function setup(): Promise<{ readonly database: OpenedDatabase; readonly context: AppContext }> {
  const database = openDatabase({ location: ':memory:', now: () => NOW });
  await database.migrations.migrateToLatest();
  return {
    database,
    context: {
      transactions: database.transactions,
      clock: { now: () => NOW },
    } as unknown as AppContext,
  };
}

describe('Fremdimport — Todoist und Super Productivity (A-20.7)', () => {
  let opened: OpenedDatabase | null = null;
  afterEach(() => { opened?.close(); opened = null; });

  it('liest Todoist-CSV mit Bereichen, Labels, Priorität, Frist, Notiz und Unteraufgabe', async () => {
    const { database, context } = await setup();
    opened = database;
    const content = [
      'TYPE;CONTENT;DESCRIPTION;PRIORITY;INDENT;AUTHOR;RESPONSIBLE;DATE;DATE_LANG;TIMEZONE;DURATION;DURATION_UNIT;DEADLINE',
      ['section', 'Planung', '', '', '', '', '', '', '', '', '', '', ''].join(';'),
      ['task', 'Elternaufgabe @kunde', 'Beschreibung', '1', '1', '', '', '', '', '', '30', 'minute', '2026-09-30'].join(';'),
      ['note', 'Kommentar zur Aufgabe', '', '', '', '', '', '', '', '', '', '', ''].join(';'),
      ['task', 'Unteraufgabe', '', '2', '2', '', '', '', '', '', '', '', ''].join(';'),
    ].join('\n');

    const result = await importTodoist(context, [{ name: 'Umzug.csv', content }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ todos: 2, projects: 1, sections: 1 });

    await database.transactions.inTransaction(async (unit) => {
      const todos = await unit.todos.search({});
      expect(todos.items.map((todo) => todo.title).sort()).toEqual(['Elternaufgabe', 'Unteraufgabe']);
      expect(todos.items.find((todo) => todo.title === 'Elternaufgabe')?.dueDate).toBe('2026-09-30');
      const child = todos.items.find((todo) => todo.title === 'Unteraufgabe');
      expect(child).toBeDefined();
      if (child !== undefined) expect((await unit.notes.load(child.id))?.text).toContain('Unteraufgabe von: Elternaufgabe');
      expect((await unit.pools.list('all')).some((pool) => pool.name.includes('Umzug'))).toBe(true);
    });
  });

  it('übernimmt aus Super Productivity Projekte, Tags, Frist, Vermerk, Erledigt und Tageszeit', async () => {
    const { database, context } = await setup();
    opened = database;
    const backup = {
      project: { entities: { p1: { id: 'p1', title: 'Produkt', taskIds: ['t1'], backlogTaskIds: [], noteIds: [] } } },
      tag: { entities: { l1: { id: 'l1', title: 'Wichtig', color: '#ef4444' } } },
      section: { entities: { s1: { id: 's1', contextId: 'p1', title: 'Sprint', taskIds: ['t1'] } } },
      task: { entities: { t1: {
        id: 't1', title: 'Liefern', notes: 'Ausführlicher Vermerk', projectId: 'p1', tagIds: ['l1'],
        isDone: true, doneOn: Date.parse('2026-09-07T12:00:00Z'), deadlineDay: '2026-09-20',
        timeSpentOnDay: { '2026-09-06': 1_800_000 }, timeEstimate: 3_600_000,
      } } },
    };

    const result = await importSuperProductivity(context, backup);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ todos: 1, projects: 1, sections: 1, timeEntries: 1 });

    await database.transactions.inTransaction(async (unit) => {
      const todo = (await unit.todos.search({})).items[0];
      expect(todo).toMatchObject({ title: 'Liefern', dueDate: '2026-09-20' });
      expect(todo?.completedAt).toBe('2026-09-07T12:00:00Z');
      if (todo !== undefined) {
        expect((await unit.notes.load(todo.id))?.text).toContain('Ausführlicher Vermerk');
        expect((await unit.timeEntries.search({ todoId: todo.id })).items[0]?.durationSeconds).toBe(1800);
      }
    });
  });

  it('liest das aktuelle Super-Productivity-Backup mit data-Wrapper und beiden Archiven', async () => {
    const { database, context } = await setup();
    opened = database;
    const backup = {
      timestamp: Date.parse('2026-09-08T09:00:00Z'),
      lastUpdate: Date.parse('2026-09-08T09:00:00Z'),
      crossModelVersion: 1,
      data: {
        project: { entities: { p1: { id: 'p1', title: 'Aktuelles Projekt' } } },
        tag: { entities: {} },
        section: { entities: {} },
        task: { entities: { active: {
          id: 'active', title: 'Aktiv', projectId: 'p1', tagIds: [], isDone: false,
          timeSpentOnDay: {},
        } } },
        archiveYoung: { task: { entities: { young: {
          id: 'young', title: 'Jung archiviert', projectId: 'p1', tagIds: [], isDone: true,
          doneOn: Date.parse('2026-09-07T10:00:00Z'), timeSpentOnDay: { '2026-09-07': 600_000 },
        } } } },
        archiveOld: { task: { entities: { old: {
          id: 'old', title: 'Alt archiviert', projectId: 'p1', tagIds: [], isDone: true,
          doneOn: Date.parse('2026-08-01T10:00:00Z'), timeSpentOnDay: {},
        } } } },
      },
    };

    const result = await importSuperProductivity(context, backup);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ todos: 3, projects: 1, timeEntries: 1 });

    await database.transactions.inTransaction(async (unit) => {
      const todos = (await unit.todos.search({})).items;
      expect(todos.map((todo) => todo.title).sort()).toEqual(['Aktiv', 'Alt archiviert', 'Jung archiviert']);
      expect(todos.find((todo) => todo.title === 'Jung archiviert')?.completedAt).toBe('2026-09-07T10:00:00Z');
      expect(todos.find((todo) => todo.title === 'Alt archiviert')?.completedAt).toBe('2026-08-01T10:00:00Z');
    });
  });
});

describe('Takt-Datenarchiv (A-20.4 und A-20.5)', () => {
  let opened: OpenedDatabase | null = null;
  afterEach(() => { opened?.close(); opened = null; });

  it('weist eine ungültige Bildkopie ab, bevor der Bestand ersetzt wird', async () => {
    const { database, context } = await setup();
    opened = database;
    const archive = await exportDataArchive(context);
    await database.transactions.inTransaction(async (unit) => {
      await unit.todos.create(
        { title: 'Muss erhalten bleiben', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
        [],
      );
    });

    const result = await importDataArchive(context, {
      ...archive,
      data: {
        ...archive.data,
        images: [{
          name: '00000000000000000000000000000000.png',
          mediaType: 'image/png',
          base64: Buffer.from('kein Bild').toString('base64'),
        }],
      },
    });

    expect(result.ok).toBe(false);
    await database.transactions.inTransaction(async (unit) => {
      expect((await unit.todos.search({})).items.map((todo) => todo.title)).toContain('Muss erhalten bleiben');
    });
  });
});

describe('parseCsv', () => {
  it('behält Trennzeichen, Zeilenumbrüche und Anführungszeichen in maskierten Feldern', () => {
    expect(parseCsv('TYPE;CONTENT\n task;"eins; zwei\nund ""drei"""')).toEqual([
      ['TYPE', 'CONTENT'],
      [' task', 'eins; zwei\nund "drei"'],
    ]);
  });
});
