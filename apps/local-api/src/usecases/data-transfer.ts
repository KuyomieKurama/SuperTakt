/**
 * Versionierte Datensicherung und Import aus Fremdsystemen (A-20.*).
 *
 * Das Takt-Archiv ist verlustfrei und ersetzt beim Einlesen den Bestand. Die
 * Fremdimporte ergänzen ihn dagegen: Projekte, Bereiche, Labels und Priorität
 * werden als Tags in einem eigenen Importordner abgebildet; je Projekt entsteht
 * zusätzlich ein Pool. Die nicht nativ darstellbare Elternbeziehung bleibt im
 * Vermerk lesbar erhalten.
 */

import {
  IMAGE_SIGNATURE_BYTES,
  MAX_ATTACHMENT_IMAGE_BYTES,
  dropHiddenCharacters,
  imageMediaTypeOf,
  isCalendarDay,
  MAX_NAME_LENGTH,
  MAX_TITLE_CHARACTERS,
  taktError,
  type CalendarDay,
  type TagFolderId,
  type TagId,
  type Timestamp,
} from '@takt/domain';
import {
  DATA_ARCHIVE_TABLES,
} from '@takt/storage';
import type {
  ArchiveRow,
  ArchiveScalar,
  DataArchiveTables,
} from '@takt/storage';

import type { AppContext, UseCaseResult } from './context.ts';

export const DATA_ARCHIVE_FORMAT = 'de.supertakt.data-archive' as const;
export const DATA_ARCHIVE_VERSION = 1 as const;

export interface ArchivedImage {
  readonly name: string;
  readonly mediaType: string;
  readonly base64: string;
}

export interface TaktDataArchive {
  readonly format: typeof DATA_ARCHIVE_FORMAT;
  readonly schemaVersion: typeof DATA_ARCHIVE_VERSION;
  readonly createdAt: Timestamp;
  readonly generator: 'Takt';
  readonly data: {
    readonly tables: DataArchiveTables;
    readonly images: readonly ArchivedImage[];
  };
  readonly warnings: readonly string[];
}

export interface ImportSummary {
  readonly source: 'takt' | 'todoist' | 'super-productivity';
  readonly todos: number;
  readonly projects: number;
  readonly sections: number;
  readonly tags: number;
  readonly timeEntries: number;
  readonly images: number;
  readonly warnings: readonly string[];
}

export interface TodoistFile {
  readonly name: string;
  readonly content: string;
}

interface ExternalTask {
  readonly externalId: string;
  readonly title: string;
  readonly note: string;
  readonly project: string;
  readonly section: string | null;
  readonly labels: readonly string[];
  readonly priority: string | null;
  readonly dueDate: CalendarDay | null;
  readonly completedAt: Timestamp | null;
  readonly parentExternalId: string | null;
  readonly metadata: readonly string[];
  readonly timeByDay: Readonly<Record<string, number>>;
}

interface ExternalData {
  readonly source: 'todoist' | 'super-productivity';
  readonly projects: readonly string[];
  readonly sections: readonly { readonly project: string; readonly name: string }[];
  readonly labels: readonly { readonly name: string; readonly color: string | null }[];
  readonly tasks: readonly ExternalTask[];
  readonly warnings: readonly string[];
}

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const text = (value: unknown): string | null => typeof value === 'string' ? value : null;
const finite = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const ARCHIVED_IMAGE_NAME = /^[0-9a-f]{32}\.(?:png|jpg|gif|webp)$/;
const IMAGE_EXTENSION: Readonly<Record<string, string>> = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
});

function validBase64(value: string): boolean {
  if (value.length === 0) return true;
  if (value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    return false;
  }
  return Buffer.from(value, 'base64').toString('base64') === value;
}

function clean(value: string, limit: number, fallback: string): string {
  const visible = dropHiddenCharacters(value).replace(/[\r\n\t]+/g, ' ').trim();
  const clipped = Array.from(visible).slice(0, limit).join('').trim();
  return clipped.length === 0 ? fallback : clipped;
}

const cleanName = (value: string, fallback: string): string => clean(value, MAX_NAME_LENGTH, fallback);
const cleanTitle = (value: string): string => clean(value, MAX_TITLE_CHARACTERS, 'Aufgabe ohne Titel');

function timestampFromMillis(value: unknown): Timestamp | null {
  const millis = finite(value);
  if (millis === null || millis < 0) return null;
  const date = new Date(millis);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.toISOString().slice(0, 19)}Z` as Timestamp;
}

function dayFrom(value: unknown): CalendarDay | null {
  if (typeof value === 'string') {
    const direct = value.slice(0, 10);
    if (isCalendarDay(direct)) return direct;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      const day = new Date(parsed).toISOString().slice(0, 10);
      if (isCalendarDay(day)) return day;
    }
  }
  const timestamp = timestampFromMillis(value);
  if (timestamp !== null) {
    const day = timestamp.slice(0, 10);
    if (isCalendarDay(day)) return day;
  }
  return null;
}

function isScalar(value: unknown): value is ArchiveScalar {
  return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function parseArchive(value: unknown): UseCaseResult<TaktDataArchive> {
  const root = record(value);
  if (
    root === null ||
    root['format'] !== DATA_ARCHIVE_FORMAT ||
    root['schemaVersion'] !== DATA_ARCHIVE_VERSION ||
    root['generator'] !== 'Takt'
  ) {
    return { ok: false, error: taktError('validation_error', 'Die Datei ist kein unterstütztes Takt-Datenarchiv der Fassung 1.') };
  }
  const data = record(root['data']);
  const rawTables = record(data?.['tables']);
  const rawImages = data?.['images'];
  if (data === null || rawTables === null || !Array.isArray(rawImages)) {
    return { ok: false, error: taktError('validation_error', 'Das Takt-Datenarchiv ist unvollständig.') };
  }

  const tables = {} as Record<(typeof DATA_ARCHIVE_TABLES)[number], readonly ArchiveRow[]>;
  for (const table of DATA_ARCHIVE_TABLES) {
    const rows = rawTables[table];
    if (!Array.isArray(rows) || rows.length > 250_000) {
      return { ok: false, error: taktError('validation_error', `Die Tabelle „${table}“ fehlt oder ist zu groß.`) };
    }
    const checked: ArchiveRow[] = [];
    for (const valueRow of rows) {
      const item = record(valueRow);
      if (item === null || !Object.values(item).every(isScalar)) {
        return { ok: false, error: taktError('validation_error', `Die Tabelle „${table}“ enthält eine ungültige Zeile.`) };
      }
      checked.push(item as ArchiveRow);
    }
    tables[table] = checked;
  }

  const images: ArchivedImage[] = [];
  if (rawImages.length > 10_000) {
    return { ok: false, error: taktError('validation_error', 'Das Takt-Datenarchiv enthält zu viele Bildanhänge.') };
  }
  for (const rawImage of rawImages) {
    const image = record(rawImage);
    if (
      image === null || typeof image['name'] !== 'string' ||
      typeof image['mediaType'] !== 'string' || typeof image['base64'] !== 'string' ||
      !validBase64(image['base64'])
    ) {
      return { ok: false, error: taktError('validation_error', 'Das Datenarchiv enthält einen ungültigen Bildanhang.') };
    }
    const bytes = Buffer.from(image['base64'], 'base64');
    const detected = imageMediaTypeOf(bytes.subarray(0, IMAGE_SIGNATURE_BYTES));
    const extension = IMAGE_EXTENSION[image['mediaType']];
    if (
      bytes.byteLength === 0 || bytes.byteLength > MAX_ATTACHMENT_IMAGE_BYTES ||
      detected !== image['mediaType'] || extension === undefined ||
      !ARCHIVED_IMAGE_NAME.test(image['name']) || !image['name'].endsWith(`.${extension}`)
    ) {
      return { ok: false, error: taktError('validation_error', 'Das Datenarchiv enthält einen ungültigen Bildanhang.') };
    }
    images.push({ name: image['name'], mediaType: image['mediaType'], base64: image['base64'] });
  }

  return {
    ok: true,
    value: {
      format: DATA_ARCHIVE_FORMAT,
      schemaVersion: DATA_ARCHIVE_VERSION,
      createdAt: typeof root['createdAt'] === 'string' ? root['createdAt'] as Timestamp : '1970-01-01T00:00:00Z' as Timestamp,
      generator: 'Takt',
      data: { tables, images },
      warnings: Array.isArray(root['warnings']) ? root['warnings'].filter((item): item is string => typeof item === 'string') : [],
    },
  };
}

export async function exportDataArchive(context: AppContext): Promise<TaktDataArchive> {
  return context.transactions.inTransaction(async (unit) => {
    const tables = await unit.dataArchive.readAll();
    const images: ArchivedImage[] = [];
    const warnings: string[] = [];
    for (const row of tables.todo_attachment) {
      if (row['kind'] !== 'image' || typeof row['target'] !== 'string') continue;
      const result = await context.attachmentBlobs.readImage(row['target']);
      if (!result.ok) {
        warnings.push(`Die Bildkopie ${row['target']} konnte nicht in die Sicherung aufgenommen werden (${result.reason}).`);
        continue;
      }
      images.push({
        name: row['target'],
        mediaType: result.mediaType,
        base64: Buffer.from(result.data).toString('base64'),
      });
    }
    return {
      format: DATA_ARCHIVE_FORMAT,
      schemaVersion: DATA_ARCHIVE_VERSION,
      createdAt: context.clock.now(),
      generator: 'Takt',
      data: { tables, images },
      warnings,
    };
  });
}

export async function importDataArchive(
  context: AppContext,
  raw: unknown,
): Promise<UseCaseResult<ImportSummary>> {
  const parsed = parseArchive(raw);
  if (!parsed.ok) return parsed;

  await context.transactions.inTransaction(async (unit) => unit.dataArchive.replaceAll(parsed.value.data.tables));
  const warnings = [...parsed.value.warnings];
  let restoredImages = 0;
  for (const image of parsed.value.data.images) {
    const bytes = Buffer.from(image.base64, 'base64');
    const restored = await context.attachmentBlobs.restoreImage(image.name, bytes);
    if (restored.ok) restoredImages += 1;
    else warnings.push(`Die Bildkopie ${image.name} konnte nicht wiederhergestellt werden (${restored.reason}).`);
  }

  const tables = parsed.value.data.tables;
  return {
    ok: true,
    value: {
      source: 'takt',
      todos: tables.todo.length,
      projects: tables.pool.length,
      sections: tables.tag_folder.length,
      tags: tables.tag.length,
      timeEntries: tables.time_entry.length,
      images: restoredImages,
      warnings,
    },
  };
}

/** RFC-4180-Leser mit automatischer Trennzeichenerkennung für Todoists Semikolon-Export. */
export function parseCsv(source: string): readonly (readonly string[])[] {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index] ?? '';
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function todoistData(files: readonly TodoistFile[]): UseCaseResult<ExternalData> {
  if (files.length === 0) return { ok: false, error: taktError('validation_error', 'Wählen Sie mindestens eine Todoist-CSV-Datei aus.') };
  const tasks: Array<ExternalTask & { noteParts: string[] }> = [];
  const projects: string[] = [];
  const sections: { project: string; name: string }[] = [];
  const labelNames = new Set<string>();
  const warnings: string[] = [];

  for (const file of files) {
    const project = cleanName(file.name.replace(/\.csv$/i, ''), 'Todoist-Projekt');
    projects.push(project);
    const rows = parseCsv(file.content);
    const headers = rows[0]?.map((header) => header.replace(/^\uFEFF/, '').trim().toUpperCase()) ?? [];
    const at = (values: readonly string[], name: string): string => values[headers.indexOf(name)] ?? '';
    if (!headers.includes('TYPE') || !headers.includes('CONTENT')) {
      return { ok: false, error: taktError('validation_error', `„${file.name}“ hat nicht das Todoist-CSV-Format.`) };
    }
    let section: string | null = null;
    let previous: (ExternalTask & { noteParts: string[] }) | null = null;
    const parents = new Map<number, string>();
    for (const [rowIndex, values] of rows.slice(1).entries()) {
      const type = at(values, 'TYPE').trim();
      const content = at(values, 'CONTENT').trim();
      if (type === 'section') {
        section = cleanName(content, 'Bereich');
        sections.push({ project, name: section });
        previous = null;
        continue;
      }
      if (type === 'note') {
        if (previous !== null && content.length > 0) previous.noteParts.push(content);
        continue;
      }
      if (type !== 'task') continue;

      const labels = [...content.matchAll(/(?:^|\s)@([^\s@]+)/gu)].map((match) => cleanName(match[1] ?? '', 'Label'));
      labels.forEach((label) => labelNames.add(label));
      const title = content.replace(/(?:^|\s)@[^\s@]+/gu, ' ').replace(/\s+/g, ' ').trim();
      const indent = Math.max(1, Math.min(4, Number.parseInt(at(values, 'INDENT'), 10) || 1));
      const externalId = `${file.name}:${String(rowIndex + 2)}`;
      const parentExternalId = indent > 1 ? parents.get(indent - 1) ?? null : null;
      parents.set(indent, externalId);
      for (const depth of [...parents.keys()]) if (depth > indent) parents.delete(depth);

      const description = at(values, 'DESCRIPTION').trim();
      const priorityRaw = at(values, 'PRIORITY').trim();
      const priority = /^[1-4]$/.test(priorityRaw) ? `P${priorityRaw}` : null;
      const due = dayFrom(at(values, 'DEADLINE')) ?? dayFrom(at(values, 'DATE'));
      const metadata = [
        at(values, 'DATE').trim().length > 10 ? `Todoist-Termin: ${at(values, 'DATE').trim()}` : '',
        at(values, 'DURATION').trim().length > 0 ? `Todoist-Schätzung: ${at(values, 'DURATION').trim()} ${at(values, 'DURATION_UNIT').trim()}` : '',
        at(values, 'RESPONSIBLE').trim().length > 0 ? `Todoist-verantwortlich: ${at(values, 'RESPONSIBLE').trim()}` : '',
      ].filter((item) => item.length > 0);
      const task = {
        externalId,
        title: cleanTitle(title),
        note: description,
        project,
        section,
        labels,
        priority,
        dueDate: due,
        completedAt: null,
        parentExternalId,
        metadata,
        timeByDay: {},
        noteParts: [],
      };
      tasks.push(task);
      previous = task;
    }
  }

  if (tasks.length === 0) warnings.push('Die gewählten Dateien enthalten keine Aufgaben.');
  return {
    ok: true,
    value: {
      source: 'todoist', projects: [...new Set(projects)], sections,
      labels: [...labelNames].map((name) => ({ name, color: null })),
      tasks: tasks.map(({ noteParts, ...task }) => ({ ...task, note: [task.note, ...noteParts].filter(Boolean).join('\n\n') })),
      warnings,
    },
  };
}

function entities(value: unknown): readonly Record<string, unknown>[] {
  const state = record(value);
  const raw = record(state?.['entities']);
  return raw === null ? [] : Object.values(raw).map(record).filter((item): item is Record<string, unknown> => item !== null);
}

function findSuperProductivityState(value: unknown): Record<string, unknown> | null {
  let current: unknown = value;
  for (let depth = 0; depth < 4; depth += 1) {
    const candidate = record(current);
    if (candidate === null) return null;
    if (record(candidate['task']) !== null && record(candidate['project']) !== null) return candidate;
    const next = candidate['data'] ?? candidate['appData'] ?? candidate['state'];
    if (typeof next === 'string') {
      try { current = JSON.parse(next); } catch { return null; }
    } else current = next;
  }
  return null;
}

function superProductivityData(value: unknown): UseCaseResult<ExternalData> {
  const root = findSuperProductivityState(value);
  if (root === null) return { ok: false, error: taktError('validation_error', 'Die Datei ist kein unterstütztes Super-Productivity-Backup.') };
  const projectsRaw = entities(root['project']);
  const tagsRaw = entities(root['tag']);
  const sectionsRaw = entities(root['section']);
  const activeTasks = entities(root['task']);
  const archived = entities(root['taskArchive']);
  const projectNames = new Map(projectsRaw.map((item) => [String(item['id']), cleanName(text(item['title']) ?? 'Projekt', 'Projekt')]));
  const tagNames = new Map(tagsRaw.map((item) => [String(item['id']), cleanName(text(item['title']) ?? 'Tag', 'Tag')]));
  const sectionByTask = new Map<string, string>();
  const sections: { project: string; name: string }[] = [];
  for (const item of sectionsRaw) {
    const project = projectNames.get(String(item['contextId'])) ?? 'Eingang';
    const name = cleanName(text(item['title']) ?? 'Bereich', 'Bereich');
    sections.push({ project, name });
    if (Array.isArray(item['taskIds'])) for (const id of item['taskIds']) sectionByTask.set(String(id), name);
  }

  const tasks: ExternalTask[] = [...activeTasks, ...archived].map((item, index) => {
    const id = String(item['id'] ?? `task-${String(index + 1)}`);
    const project = projectNames.get(String(item['projectId'])) ?? 'Eingang';
    const tagIds = Array.isArray(item['tagIds']) ? item['tagIds'].map(String) : [];
    const timeByDay: Record<string, number> = {};
    const rawTime = record(item['timeSpentOnDay']);
    if (rawTime !== null) {
      for (const [day, millis] of Object.entries(rawTime)) {
        if (isCalendarDay(day) && typeof millis === 'number' && millis > 0) timeByDay[day] = Math.floor(millis / 1000);
      }
    }
    const metadata = [
      finite(item['timeEstimate']) !== null && Number(item['timeEstimate']) > 0 ? `Super-Productivity-Schätzung: ${String(item['timeEstimate'])} ms` : '',
      text(item['repeatCfgId']) !== null ? `Wiederholung: ${text(item['repeatCfgId']) ?? ''}` : '',
      Array.isArray(item['attachments']) && item['attachments'].length > 0 ? `Anhänge aus Super Productivity: ${JSON.stringify(item['attachments'])}` : '',
      text(item['issueId']) !== null ? `Vorgangskennung: ${text(item['issueId']) ?? ''}` : '',
    ].filter((line) => line.length > 0);
    return {
      externalId: id,
      title: cleanTitle(text(item['title']) ?? ''),
      note: text(item['notes']) ?? '',
      project,
      section: sectionByTask.get(id) ?? null,
      labels: tagIds.map((tagId) => tagNames.get(tagId)).filter((name): name is string => name !== undefined),
      priority: null,
      dueDate: dayFrom(item['deadlineDay']) ?? dayFrom(item['deadlineWithTime']) ?? dayFrom(item['dueDay']) ?? dayFrom(item['dueWithTime']),
      completedAt: item['isDone'] === true ? timestampFromMillis(item['doneOn']) ?? timestampFromMillis(item['modified']) ?? timestampFromMillis(item['created']) : null,
      parentExternalId: text(item['parentId']),
      metadata,
      timeByDay,
    };
  });
  return {
    ok: true,
    value: {
      source: 'super-productivity',
      projects: [...new Set([...projectNames.values(), ...tasks.map((task) => task.project)])],
      sections,
      labels: tagsRaw.map((item) => {
        const rawColor = text(item['color']);
        return {
          name: tagNames.get(String(item['id'])) ?? 'Tag',
          color: rawColor !== null && /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : null,
        };
      }),
      tasks,
      warnings: [],
    },
  };
}

async function expectCreated<T>(result: { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: unknown }): Promise<T> {
  if (!result.ok) throw new Error('Eine Struktur des Imports konnte nicht angelegt werden.');
  return result.value;
}

async function importExternal(context: AppContext, external: ExternalData): Promise<ImportSummary> {
  return context.transactions.inTransaction(async (unit) => {
    const now = context.clock.now();
    const stamp = now.replace(/[-:TZ]/g, '').slice(0, 14);
    const sourceLabel = external.source === 'todoist' ? 'Todoist' : 'Super Productivity';
    const rootNames = new Set((await unit.folders.listChildren(null)).map((folder) => folder.name.toLocaleLowerCase('de-DE')));
    const rootBase = cleanName(`${sourceLabel}-Import ${stamp}`, 'Import');
    let rootName = rootBase;
    let rootSuffix = 2;
    while (rootNames.has(rootName.toLocaleLowerCase('de-DE'))) {
      rootName = cleanName(`${rootBase} (${String(rootSuffix)})`, `Import ${String(rootSuffix)}`);
      rootSuffix += 1;
    }
    const root = await expectCreated(await unit.folders.create(null, rootName, now));
    const projectFolder = await expectCreated(await unit.folders.create(root.id, 'Projekte', now));
    const sectionFolder = await expectCreated(await unit.folders.create(root.id, 'Bereiche', now));
    const labelFolder = await expectCreated(await unit.folders.create(root.id, 'Labels', now));
    const priorityFolder = await expectCreated(await unit.folders.create(root.id, 'Prioritäten', now));

    const projectTags = new Map<string, TagId>();
    const existingPoolNames = new Set((await unit.pools.listNames()).map((pool) => pool.name.toLocaleLowerCase('de-DE')));
    let poolPosition = (await unit.pools.list('all')).length;
    for (const project of external.projects) {
      const tag = await expectCreated(await unit.tags.create(projectFolder.id, cleanName(project, 'Projekt'), null, now));
      projectTags.set(project, tag.id);
      let poolName = cleanName(`${sourceLabel}: ${project}`, `${sourceLabel}: Projekt`);
      let suffix = 2;
      while (existingPoolNames.has(poolName.toLocaleLowerCase('de-DE'))) {
        poolName = cleanName(`${sourceLabel}: ${project} (${String(suffix)})`, `${sourceLabel}: Projekt ${String(suffix)}`);
        suffix += 1;
      }
      existingPoolNames.add(poolName.toLocaleLowerCase('de-DE'));
      await unit.pools.create({
        name: poolName, matchMode: 'any', includeSubfolders: true, position: poolPosition,
        placement: 'pool', rule: [{ kind: 'tag', tagId: tag.id }],
      }, now);
      poolPosition += 1;
    }

    const sectionFolders = new Map<string, TagFolderId>();
    const sectionTags = new Map<string, TagId>();
    for (const item of external.sections) {
      let folderId = sectionFolders.get(item.project);
      if (folderId === undefined) {
        const folder = await expectCreated(await unit.folders.create(sectionFolder.id, cleanName(item.project, 'Projekt'), now));
        folderId = folder.id;
        sectionFolders.set(item.project, folderId);
      }
      const key = `${item.project}\u0000${item.name}`;
      if (!sectionTags.has(key)) {
        const tag = await expectCreated(await unit.tags.create(folderId, cleanName(item.name, 'Bereich'), null, now));
        sectionTags.set(key, tag.id);
      }
    }

    const labelTags = new Map<string, TagId>();
    for (const label of external.labels) {
      const key = label.name.toLocaleLowerCase('de-DE');
      if (labelTags.has(key)) continue;
      const tag = await expectCreated(await unit.tags.create(labelFolder.id, cleanName(label.name, 'Label'), label.color, now));
      labelTags.set(key, tag.id);
    }
    const priorityTags = new Map<string, TagId>();
    for (const priority of [...new Set(external.tasks.map((task) => task.priority).filter((item): item is string => item !== null))]) {
      const tag = await expectCreated(await unit.tags.create(priorityFolder.id, priority, null, now));
      priorityTags.set(priority, tag.id);
    }

    const defaultStatus = await unit.statuses.defaultStatus();
    const titles = new Map(external.tasks.map((task) => [task.externalId, task.title]));
    let timeEntries = 0;
    for (const task of external.tasks) {
      const tagIds = [projectTags.get(task.project)];
      if (task.section !== null) tagIds.push(sectionTags.get(`${task.project}\u0000${task.section}`));
      for (const label of task.labels) tagIds.push(labelTags.get(label.toLocaleLowerCase('de-DE')));
      if (task.priority !== null) tagIds.push(priorityTags.get(task.priority));
      const parent = task.parentExternalId === null ? null : titles.get(task.parentExternalId) ?? task.parentExternalId;
      const importLines = [
        `Importquelle: ${sourceLabel} (${task.externalId})`,
        parent === null ? '' : `Unteraufgabe von: ${parent}`,
        ...task.metadata,
      ].filter((line) => line.length > 0);
      const created = await unit.todos.create({
        title: task.title, callNumber: null, statusId: defaultStatus.id,
        tagIds: tagIds.filter((id): id is TagId => id !== undefined),
        note: '', dueDate: task.dueDate, now,
      }, tagIds.filter((id): id is TagId => id !== undefined));
      const note = [task.note.trim(), importLines.join('\n')].filter(Boolean).join('\n\n');
      if (note.length > 0) await unit.notes.write(created.id, note, now);
      if (task.completedAt !== null) await unit.todos.markDone(created.id, task.completedAt);

      for (const [day, seconds] of Object.entries(task.timeByDay)) {
        if (!isCalendarDay(day) || seconds < 1) continue;
        const started = `${day}T08:00:00Z` as Timestamp;
        const ended = `${new Date(Date.parse(started) + seconds * 1000).toISOString().slice(0, 19)}Z` as Timestamp;
        const entry = await unit.timeEntries.create({ todoId: created.id, startedAt: started, endedAt: ended, note: `Import aus ${sourceLabel}` }, now);
        if (entry.ok) timeEntries += 1;
      }
    }

    return {
      source: external.source,
      todos: external.tasks.length,
      projects: external.projects.length,
      sections: external.sections.length,
      tags: projectTags.size + sectionTags.size + labelTags.size + priorityTags.size,
      timeEntries,
      images: 0,
      warnings: external.warnings,
    };
  });
}

export async function importTodoist(context: AppContext, files: readonly TodoistFile[]): Promise<UseCaseResult<ImportSummary>> {
  const parsed = todoistData(files);
  if (!parsed.ok) return parsed;
  return { ok: true, value: await importExternal(context, parsed.value) };
}

export async function importSuperProductivity(context: AppContext, raw: unknown): Promise<UseCaseResult<ImportSummary>> {
  const parsed = superProductivityData(raw);
  if (!parsed.ok) return parsed;
  return { ok: true, value: await importExternal(context, parsed.value) };
}
