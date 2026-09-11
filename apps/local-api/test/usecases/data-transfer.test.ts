import { afterEach, describe, expect, it } from 'vitest';
import type { Timestamp } from '@takt/domain';
import { openDatabase, type OpenedDatabase } from '@takt/storage';

import type { AppContext } from '../../src/context.ts';
import { exportDataArchive, importDataArchive } from '../../src/features/data-transfer/data-transfer.ts';
import { importSuperProductivity, importTodoist, parseCsv } from '../../src/features/data-transfer/foreign.ts';

const NOW = '2026-09-08T10:00:00Z' as Timestamp;

async function setup(): Promise<{ readonly database: OpenedDatabase; readonly context: AppContext }> {
  const database = openDatabase({ location: ':memory:', now: () => NOW });
  await database.migrations.migrateToLatest();
  return {
    database,
    context: {
      transactions: database.transactions,
      clock: { now: () => NOW },
      system: { windowsUser: () => 'Importprüfung' },
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
        expect((await unit.notes.load(todo.id))?.text).not.toContain('Importquelle:');
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

  it.each([false, true])('importiert mehrere Projekte auch bei lückenhaften Poolpositionen (%s)', async (existing) => {
    const { database, context } = await setup();
    opened = database;
    const project = { entities: { p1: { id: 'p1', title: 'Eins' }, p2: { id: 'p2', title: 'Zwei' } } };
    const task = { entities: { t: { id: 't', title: 'Arbeit', projectId: 'p1' } } };
    if (existing) {
      expect((await importSuperProductivity(context, { project, task })).ok).toBe(true);
      database.connection.exec('UPDATE pool SET position = position + 10');
    }
    expect((await importSuperProductivity(context, { project, task })).ok).toBe(true);
    const pools = database.connection.prepare('SELECT position FROM pool ORDER BY position').all();
    expect(pools.map(row => row['position'])).toEqual(existing ? [11, 12, 13, 14] : [1, 2]);
  });

  it.each([true, false])('übernimmt Leistungsnachweise und externe Übertragung (ausnehmen: %s)', async (excludeTransferred) => {
    const { database, context } = await setup();
    opened = database;
    const notes = [
      'Interne Mail, kein Leistungsnachweis', '---- Eigene Notiz', 'Privater Kontext',
      '---- Zeit Dauer: 06.09.26 02:00:00', 'Analyse',
      '---- Zeit Dauer: 06.09.2026 01:00:00', 'Korrektur',
      '---- Zeit Dauer: 07.09.26 00:30:00', 'Abnahme',
    ].join('\n');
    const result = await importSuperProductivity(context, { data: {
      project: { entities: {} },
      task: { entities: {
        t: { id: 't', title: 'Arbeit', notes, tagIds: ['open'], timeSpentOnDay: { '2026-09-06': 600_000, '2026-09-07': 300_000 } },
        b: { id: 'b', title: 'Übertragen', tagIds: ['booked', 'open'], timeSpentOnDay: { '2026-09-06': 60_000 } },
      } },
      pluginUserData: [{ id: 'outlook-super-productivity-bridge', data: JSON.stringify({
        version: 1, bookingTagId: 'booked', bookingOpenTagId: 'open', timeBooked: { 't|2026-09-06': 123 },
      }) }],
    } }, excludeTransferred);
    expect(result.ok).toBe(true);
    const rows = database.connection.prepare('SELECT note, duration_seconds, export_status, export_count FROM time_entry ORDER BY duration_seconds DESC').all();
    expect(rows).toEqual([
      { note: 'Analyse\n\nKorrektur', duration_seconds: 600, export_status: excludeTransferred ? 'exported' : 'open', export_count: 0 },
      { note: 'Abnahme', duration_seconds: 300, export_status: 'open', export_count: 0 },
      { note: '', duration_seconds: 60, export_status: excludeTransferred ? 'exported' : 'open', export_count: 0 },
    ]);
    const audit = database.connection.prepare('SELECT event, reason FROM export_audit').all();
    expect(audit).toHaveLength(excludeTransferred ? 2 : 0);
    for (const row of audit) {
      expect(row['event']).toBe('not_billed');
      expect(row['reason']).toContain('Import aus OutlookBridge');
    }
    await database.transactions.inTransaction(async unit => {
      const todo = (await unit.todos.search({})).items.find(item => item.title === 'Arbeit');
      expect(todo).toBeDefined();
      expect((await unit.notes.load(todo!.id))?.text).toContain(notes);
    });
  });

  it('zählt Elternsummen nicht doppelt und erhält nicht datierbare Leistungsnachweise in der Notiz', async () => {
    const { database, context } = await setup();
    opened = database;
    const notes = '---- Eigene Notiz\n---- Zeit Dauer: 00:10:00\nOhne Datum';
    const result = await importSuperProductivity(context, { project: { entities: {} }, task: { entities: {
      parent: { id: 'parent', title: 'Eltern', subTaskIds: ['child'], timeSpentOnDay: { '2026-09-06': 120_000 } },
      child: { id: 'child', title: 'Kind', parentId: 'parent', notes, timeSpentOnDay: { '2026-09-06': 120_000 } },
      multi: { id: 'multi', title: 'Mehrere Tage', notes, timeSpentOnDay: { '2026-09-06': 60_000, '2026-09-07': 60_000, '2026-09-08': 999 } },
    } } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.timeEntries).toBe(3);
    expect(result.value.warnings.join(' ')).toContain('keinen eindeutig zuordenbaren Buchungstag');
    const rows = database.connection.prepare('SELECT note, duration_seconds FROM time_entry ORDER BY duration_seconds DESC').all();
    expect(rows).toEqual([{ note: 'Ohne Datum', duration_seconds: 120 }, { note: '', duration_seconds: 60 }, { note: '', duration_seconds: 60 }]);
    await database.transactions.inTransaction(async unit => {
      const todo = (await unit.todos.search({})).items.find(item => item.title === 'Mehrere Tage');
      expect((await unit.notes.load(todo!.id))?.text).toContain(notes);
    });
  });

  it('erhält Tag-Ordner, leere Unterordner, Farben und gleichnamige Tags über ihre Kennungen', async () => {
    const { database, context } = await setup();
    opened = database;
    const result = await importSuperProductivity(context, { data: {
      project: { entities: {} },
      task: { entities: { t: { id: 't', title: 'Arbeit', tagIds: ['a', 'b', 'loose'] } } },
      tag: { entities: {
        a: { id: 'a', title: 'Gleich', color: '#112233' },
        b: { id: 'b', title: 'Gleich', color: '#445566' },
        loose: { id: 'loose', title: 'Frei' },
      } },
      menuTree: { tagTree: [
        { k: 'f', id: 'f1', name: 'Kunden', children: [
          { k: 't', id: 'a' }, { k: 'f', id: 'empty', name: 'Leer', children: [] },
        ] },
        { k: 'f', id: 'f2', name: 'Kollegen', children: [{ k: 't', id: 'b' }] },
      ] },
    } });
    expect(result.ok).toBe(true);
    const tags = database.connection.prepare(`SELECT t.name, t.color, f.name AS folder
      FROM tag t LEFT JOIN tag_folder f ON f.id=t.folder_id
      JOIN todo_tag tt ON tt.tag_id=t.id WHERE t.name IN ('Gleich', 'Frei') ORDER BY t.name, f.name`).all();
    expect(tags).toEqual([
      { name: 'Frei', color: null, folder: null },
      { name: 'Gleich', color: '#445566', folder: 'Kollegen' },
      { name: 'Gleich', color: '#112233', folder: 'Kunden' },
    ]);
    expect(database.connection.prepare(`SELECT p.name FROM tag_folder c JOIN tag_folder p ON c.parent_id=p.id WHERE c.name='Leer'`).get()?.['name']).toBe('Kunden');
    expect(database.connection.prepare("SELECT COUNT(*) AS n FROM tag_folder WHERE name LIKE 'Super Productivity%'").get()?.['n']).toBe(0);
    expect(database.connection.prepare("SELECT name FROM tag_folder WHERE parent_id IS NULL ORDER BY name").all().map(row => row['name'])).toEqual(['Kollegen', 'Kunden', 'Projekte']);
    expect(database.connection.prepare("SELECT COUNT(*) AS n FROM tag_folder WHERE name IN ('Labels', 'Bereiche', 'Prioritäten') OR name LIKE 'Import %'").get()?.['n']).toBe(0);
    expect(database.connection.prepare("SELECT COUNT(*) AS n FROM pool WHERE name LIKE 'Super Productivity%'").get()?.['n']).toBe(0);
  });

  it('legt Links und Dateipfade als Anhänge an und erhält nicht unterstützte Originaldaten im Vermerk', async () => {
    const { database, context } = await setup();
    opened = database;
    const result = await importSuperProductivity(context, {
      project: { entities: {} },
      task: { entities: { t: { id: 't', title: 'Mit Anhängen', attachments: [
        { id: 'a', type: 'LINK', title: 'Mail', path: 'https://outlook.office.com/mail/test' },
        { id: 'b', type: 'FILE', title: 'Dokument', path: 'C:/Documents/test.pdf' },
        { id: 'c', type: 'LINK', title: 'Ungültig', path: 'javascript:alert(1)' },
      ] } } },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warnings.join(' ')).toContain('1 Anhänge konnten nicht');
    await database.transactions.inTransaction(async unit => {
      const todo = (await unit.todos.search({})).items[0]!;
      const attachments = await unit.attachments.list(todo.id);
      expect(attachments.map(({ kind, title, target }) => ({ kind, title, target }))).toEqual([
        { kind: 'link', title: 'Mail', target: 'https://outlook.office.com/mail/test' },
        { kind: 'file', title: 'Dokument', target: 'C:/Documents/test.pdf' },
      ]);
      expect((await unit.notes.load(todo.id))?.text).toContain('javascript:alert(1)');
    });
  });

  it('speichert erkannte Calls am Todo und schreibt bei ungültigem Regex keine Importdaten', async () => {
    const { database, context } = await setup();
    opened = database;
    const backup = { project: { entities: {} }, task: { entities: {
      t: { id: 't', title: 'Fw: Call 31855 - Arbeit', notes: 'Originalnotiz' },
    } } };
    expect((await importSuperProductivity(context, backup, true, '(')).ok).toBe(false);
    expect(database.connection.prepare('SELECT COUNT(*) AS n FROM todo').get()?.['n']).toBe(0);
    expect((await importSuperProductivity(context, backup)).ok).toBe(true);
    expect(database.connection.prepare('SELECT call_number, title FROM todo').get()).toMatchObject({ call_number: '31855', title: 'Fw: Call 31855 - Arbeit' });
  });

  it('bricht bei beschädigten Plugin-Daten vor dem Schreiben ab', async () => {
    const { database, context } = await setup();
    opened = database;
    const result = await importSuperProductivity(context, {
      project: { entities: {} },
      task: { entities: { t: { id: 't', title: 'Arbeit' } } },
      pluginUserData: [{ id: 'outlook-super-productivity-bridge', data: '{invalid' }],
    });
    expect(result.ok).toBe(false);
    expect(database.connection.prepare('SELECT COUNT(*) AS n FROM todo').get()?.['n']).toBe(0);
  });

});

describe('Takt-Datenarchiv (A-20.4 und A-20.5)', () => {
  let opened: OpenedDatabase | null = null;
  afterEach(() => { opened?.close(); opened = null; });

  it('A-21.5: Archivfassung 4 stellt Darstellung und Timer-Einstellung wieder her', async () => {
    const { database, context } = await setup();
    opened = database;
    await database.transactions.inTransaction(async (unit) => {
      await unit.settings.update({ theme: 'dark', designTheme: 'catppuccin-mocha', density: 'compact', promptOnTimerStop: false, idleDetectionEnabled: false, idleKeepTimerRunning: false, idleThresholdMinutes: 15, now: NOW });
    });
    const archive = await exportDataArchive(context);
    expect(archive.schemaVersion).toBe(5);
    await database.transactions.inTransaction(async (unit) => {
      await unit.settings.update({ theme: 'light', designTheme: 'classic', density: 'comfortable', promptOnTimerStop: true, idleDetectionEnabled: true, idleKeepTimerRunning: true, idleThresholdMinutes: 5, now: NOW });
    });
    expect((await importDataArchive(context, archive)).ok).toBe(true);
    await database.transactions.inTransaction(async (unit) => {
      expect(await unit.settings.load()).toMatchObject({ theme: 'dark', designTheme: 'catppuccin-mocha', density: 'compact', promptOnTimerStop: false, idleDetectionEnabled: false, idleKeepTimerRunning: false, idleThresholdMinutes: 15 });
    });
  });

  it('T-280/T-279: last_version_check_at nimmt am Round-Trip teil — Export, Bestandsänderung, Import stellen denselben Wert wieder her (A-20.4, Migration 0022)', async () => {
    const { database, context } = await setup();
    opened = database;
    database.connection
      .prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1')
      .run('2026-09-11T09:12:34Z');

    const archive = await exportDataArchive(context);
    expect(archive.data.tables.app_setting[0]?.['last_version_check_at']).toBe('2026-09-11T09:12:34Z');

    // Der Bestand ändert sich, bevor die Sicherung wieder eingespielt wird.
    database.connection
      .prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1')
      .run('2026-01-01T00:00:00Z');

    expect((await importDataArchive(context, archive)).ok).toBe(true);
    expect(
      database.connection.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get()?.[
        'last_version_check_at'
      ],
    ).toBe('2026-09-11T09:12:34Z');

    // Und ein zweiter Export nach dem Rundlauf ist zeichengleich zum ersten.
    const secondArchive = await exportDataArchive(context);
    expect(secondArchive.data.tables.app_setting).toEqual(archive.data.tables.app_setting);
  });

  it('T-280/T-279: ein Archiv der Fassung 5 OHNE last_version_check_at wird angenommen — der Wert danach ist NULL ("noch nie gefragt", `hasOwn` statt Fassungsvergleich)', async () => {
    const { database, context } = await setup();
    opened = database;
    database.connection
      .prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1')
      .run('2026-09-11T09:12:34Z');

    const archive = await exportDataArchive(context);
    const rows = archive.data.tables.app_setting.map((row) => {
      const legacy = { ...row };
      delete legacy['last_version_check_at'];
      return legacy;
    });

    expect(
      (
        await importDataArchive(context, {
          ...archive,
          data: { ...archive.data, tables: { ...archive.data.tables, app_setting: rows } },
        })
      ).ok,
    ).toBe(true);
    expect(
      database.connection.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get()?.[
        'last_version_check_at'
      ],
    ).toBeNull();
  });

  it('ein Archiv der Fassung 5 MIT last_version_check_at = null bleibt null nach dem Import (derselbe Bestand wie ohne das Feld)', async () => {
    const { database, context } = await setup();
    opened = database;
    const archive = await exportDataArchive(context);
    expect(archive.data.tables.app_setting[0]?.['last_version_check_at']).toBeNull();

    database.connection
      .prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1')
      .run('2026-09-11T09:12:34Z');

    expect((await importDataArchive(context, archive)).ok).toBe(true);
    expect(
      database.connection.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get()?.[
        'last_version_check_at'
      ],
    ).toBeNull();
  });

  it('Fassung 4 ergänzt Weiterlaufen als Standard und erhält die Inaktivitätsschwelle', async () => {
    const { database, context } = await setup();
    opened = database;
    await database.transactions.inTransaction(async unit => {
      await unit.settings.update({ idleThresholdMinutes: 15, idleKeepTimerRunning: false, now: NOW });
    });
    const archive = await exportDataArchive(context);
    const rows = archive.data.tables.app_setting.map(row => {
      const legacy = { ...row };
      delete legacy['idle_keep_timer_running'];
      return legacy;
    });
    expect((await importDataArchive(context, {
      ...archive, schemaVersion: 4, data: { ...archive.data, tables: { ...archive.data.tables, app_setting: rows } },
    })).ok).toBe(true);
    await database.transactions.inTransaction(async unit => {
      expect(await unit.settings.load()).toMatchObject({ idleKeepTimerRunning: true, idleThresholdMinutes: 15 });
    });
  });

  it('A-24: Fassung 3 ergänzt Inaktivitätseinstellungen ohne offene Zeit', async () => {
    const { database, context } = await setup();
    opened = database;
    const archive = await exportDataArchive(context);
    const { timer_idle: _idle, ...tables } = archive.data.tables;
    const rows = tables.app_setting.map(row => {
      const legacy = { ...row };
      delete legacy['idle_detection_enabled'];
      delete legacy['idle_threshold_minutes'];
      return legacy;
    });
    expect((await importDataArchive(context, {
      ...archive, schemaVersion: 3, data: { ...archive.data, tables: { ...tables, app_setting: rows } },
    })).ok).toBe(true);
    await database.transactions.inTransaction(async unit => {
      expect(await unit.settings.load()).toMatchObject({ idleDetectionEnabled: true, idleKeepTimerRunning: true, idleThresholdMinutes: 5 });
      expect(await unit.idle.pending()).toBeNull();
    });
  });

  it('A-21.5: liest Fassung 1 mit Klassisch und erhält den alten Farbmodus', async () => {
    const { database, context } = await setup();
    opened = database;
    await database.transactions.inTransaction(async (unit) => {
      await unit.settings.update({ theme: 'dark', designTheme: 'clear', density: 'compact', promptOnTimerStop: false, now: NOW });
    });
    const archive = await exportDataArchive(context);
    const legacyRows = archive.data.tables.app_setting.map((row) => {
      const legacy = { ...row };
      delete legacy['design_theme'];
      delete legacy['density'];
      delete legacy['prompt_on_timer_stop'];
      return legacy;
    });
    const legacyArchive = { ...archive, schemaVersion: 1, data: { ...archive.data, tables: { ...archive.data.tables, app_setting: legacyRows } } };
    expect((await importDataArchive(context, legacyArchive)).ok).toBe(true);
    await database.transactions.inTransaction(async (unit) => {
      expect(await unit.settings.load()).toMatchObject({ theme: 'dark', designTheme: 'classic', density: 'comfortable', promptOnTimerStop: true });
    });
  });

  it('A-22.1: Fassung 2 behält die Gestaltung und ergänzt die Leistungsabfrage', async () => {
    const { database, context } = await setup();
    opened = database;
    await database.transactions.inTransaction(async (unit) => {
      await unit.settings.update({ designTheme: 'classic', density: 'compact', promptOnTimerStop: false, now: NOW });
    });
    const archive = await exportDataArchive(context);
    const rows = archive.data.tables.app_setting.map((row) => {
      const legacy = { ...row };
      delete legacy['prompt_on_timer_stop'];
      return legacy;
    });
    expect((await importDataArchive(context, {
      ...archive, schemaVersion: 2,
      data: { ...archive.data, tables: { ...archive.data.tables, app_setting: rows } },
    })).ok).toBe(true);
    await database.transactions.inTransaction(async (unit) => {
      expect(await unit.settings.load()).toMatchObject({ designTheme: 'classic', density: 'compact', promptOnTimerStop: true });
    });
  });

  it('A-21.5: unbekannte Fassungen verändern den aktuellen Bestand nicht', async () => {
    const { database, context } = await setup();
    opened = database;
    const archive = await exportDataArchive(context);
    await database.transactions.inTransaction(async (unit) => {
      await unit.settings.update({ designTheme: 'clear', now: NOW });
    });
    expect((await importDataArchive(context, { ...archive, schemaVersion: 99 })).ok).toBe(false);
    await database.transactions.inTransaction(async (unit) => {
      expect((await unit.settings.load()).designTheme).toBe('clear');
    });
  });

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
